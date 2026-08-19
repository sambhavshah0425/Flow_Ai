import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { JWT_SECRET } from '../config/security.js';
import { RevokedToken } from '../models/RevokedToken.js';
import { isDBConnected } from '../config/db.js';
import { memoryRevokedTokens } from '../controllers/authController.js';

export async function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    // Compute SHA-256 hash of the token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Check blacklist
    if (isDBConnected()) {
      const revoked = await RevokedToken.findOne({ tokenHash });
      if (revoked) {
        return res.status(401).json({ success: false, message: 'Token has been revoked/logged out.' });
      }
    } else {
      if (memoryRevokedTokens.has(tokenHash)) {
        return res.status(401).json({ success: false, message: 'Token has been revoked/logged out.' });
      }
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user exists (if database connected)
    try {
      const user = await User.findById(decoded.userId).select('-password');
      if (user) {
        req.user = user;
      } else {
        req.user = { _id: decoded.userId, email: decoded.email };
      }
    } catch {
      req.user = { _id: decoded.userId, email: decoded.email };
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}
