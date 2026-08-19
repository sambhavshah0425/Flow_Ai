import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { RevokedToken } from '../models/RevokedToken.js';
import { isDBConnected } from '../config/db.js';
import { JWT_SECRET } from '../config/security.js';

// In-memory set for blacklisted token hashes in dev mode when DB is unavailable
export const memoryRevokedTokens = new Set();

// In-Memory store fallback when MongoDB daemon is not running locally
const memoryUsers = new Map();

function generateToken(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
}

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const normEmail = email.toLowerCase().trim();

    if (!isDBConnected() && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, message: 'Database service is currently unavailable.' });
    }

    if (isDBConnected()) {
      const existingUser = await User.findOne({ email: normEmail });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'User with this email already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        name,
        email: normEmail,
        password: hashedPassword
      });

      const token = generateToken(user._id, user.email);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } else {
      // In-Memory Fallback Mode
      if (memoryUsers.has(normEmail)) {
        return res.status(400).json({ success: false, message: 'User with this email already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const fakeId = `usr_${Date.now()}`;

      const user = {
        _id: fakeId,
        id: fakeId,
        name,
        email: normEmail,
        password: hashedPassword
      };

      memoryUsers.set(normEmail, user);
      const token = generateToken(user.id, user.email);

      return res.status(201).json({
        success: true,
        message: 'Account created successfully (In-Memory Mode)',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Registration failed' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const normEmail = email.toLowerCase().trim();

    if (!isDBConnected() && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ success: false, message: 'Database service is currently unavailable.' });
    }

    if (isDBConnected()) {
      const user = await User.findOne({ email: normEmail });
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      const token = generateToken(user._id, user.email);

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    } else {
      // In-Memory Fallback Mode
      const user = memoryUsers.get(normEmail);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      const token = generateToken(user.id, user.email);

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully (In-Memory Mode)',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Login failed' });
  }
}

export async function getProfile(req, res) {
  return res.status(200).json({
    success: true,
    user: req.user
  });
}

export async function logout(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(400).json({ success: false, message: 'No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Decode token to get exp claim
    const decoded = jwt.decode(token);
    const expiresAt = decoded && decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (isDBConnected()) {
      await RevokedToken.create({
        tokenHash,
        expiresAt,
        userId: req.user?._id || req.user?.id
      });
    } else {
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ success: false, message: 'Database service is currently unavailable.' });
      }
      memoryRevokedTokens.add(tokenHash);
      // Auto-remove after expiry
      setTimeout(() => {
        memoryRevokedTokens.delete(tokenHash);
      }, Math.max(0, expiresAt.getTime() - Date.now()));
    }

    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Logout failed' });
  }
}
