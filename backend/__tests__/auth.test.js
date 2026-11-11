import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET } from '../config/security.js';

const mockState = {
  dbConnected: true,
  usersByEmail: new Map(),
  revokedHashes: new Set()
};

const mockUserModel = {
  findOne: vi.fn(async ({ email }) => mockState.usersByEmail.get(email) || null),
  create: vi.fn(async (doc) => {
    const id = '507f1f77bcf86cd799439011';
    const userDoc = {
      _id: id,
      ...doc,
      save: vi.fn(async () => userDoc)
    };
    mockState.usersByEmail.set(doc.email, userDoc);
    return userDoc;
  }),
  findById: vi.fn((id) => ({
    select: vi.fn(async () => {
      for (const u of mockState.usersByEmail.values()) {
        if (u._id === id) {
          const { password, ...safe } = u;
          return safe;
        }
      }
      return null;
    })
  }))
};

const mockRevokedModel = {
  findOne: vi.fn(async ({ tokenHash }) => (mockState.revokedHashes.has(tokenHash) ? { tokenHash } : null)),
  create: vi.fn(async ({ tokenHash }) => {
    mockState.revokedHashes.add(tokenHash);
    return { tokenHash };
  })
};

vi.mock('../config/db.js', () => ({
  isDBConnected: () => mockState.dbConnected
}));

vi.mock('../models/User.js', () => ({
  User: mockUserModel
}));

vi.mock('../models/RevokedToken.js', () => ({
  RevokedToken: mockRevokedModel
}));

const { register, login, logout } = await import('../controllers/authController.js');
const { authenticateJWT } = await import('../middlewares/authMiddleware.js');

function mockRes() {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn((body) => {
    res.body = body;
    return res;
  });
  return res;
}

beforeEach(() => {
  mockState.dbConnected = true;
  mockState.usersByEmail.clear();
  mockState.revokedHashes.clear();
  vi.clearAllMocks();
});

describe('Auth flow with database persistence', () => {
  it('registers a user with bcrypt password hash and initial lastLoginAt', async () => {
    const req = { body: { name: '  Ada Lovelace  ', email: 'Ada@Example.COM', password: 'secret123' } };
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('ada@example.com');
    expect(res.body.user.lastLoginAt).toBeInstanceOf(Date);

    const saved = mockState.usersByEmail.get('ada@example.com');
    expect(saved.name).toBe('Ada Lovelace');
    expect(saved.password).not.toBe('secret123');
    expect(await bcrypt.compare('secret123', saved.password)).toBe(true);
  });

  it('rejects duplicate email registration', async () => {
    await register({ body: { name: 'Ada', email: 'ada@example.com', password: 'secret123' } }, mockRes());
    const res = mockRes();

    await register({ body: { name: 'Ada 2', email: 'ada@example.com', password: 'secret123' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body.success).toBe(false);
  });

  it('logs in with valid credentials, updates lastLoginAt, and rejects wrong password', async () => {
    await register({ body: { name: 'Ada', email: 'ada@example.com', password: 'secret123' } }, mockRes());
    const saved = mockState.usersByEmail.get('ada@example.com');
    const initialLogin = saved.lastLoginAt;

    const badRes = mockRes();
    await login({ body: { email: 'ada@example.com', password: 'wrong' } }, badRes);
    expect(badRes.status).toHaveBeenCalledWith(401);

    const okRes = mockRes();
    await login({ body: { email: 'ada@example.com', password: 'secret123' } }, okRes);
    expect(okRes.status).toHaveBeenCalledWith(200);
    expect(saved.save).toHaveBeenCalledTimes(1);
    expect(okRes.body.user.lastLoginAt.getTime()).toBeGreaterThanOrEqual(initialLogin.getTime());
  });

  it('revokes JWT on logout and rejects revoked or deleted-user tokens in authenticateJWT', async () => {
    const regRes = mockRes();
    await register({ body: { name: 'Ada', email: 'ada@example.com', password: 'secret123' } }, regRes);
    const token = regRes.body.token;

    // Valid token resolves req.user from DB
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = vi.fn();
    await authenticateJWT(req, mockRes(), next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.email).toBe('ada@example.com');

    // Logout blacklists the token hash
    await logout({ headers: { authorization: `Bearer ${token}` }, user: req.user }, mockRes());
    const revokedRes = mockRes();
    const nextAfterLogout = vi.fn();
    await authenticateJWT({ headers: { authorization: `Bearer ${token}` } }, revokedRes, nextAfterLogout);
    expect(nextAfterLogout).not.toHaveBeenCalled();
    expect(revokedRes.status).toHaveBeenCalledWith(401);

    // Deleted user token is rejected when DB is connected
    const staleToken = jwt.sign({ userId: '507f1f77bcf86cd799439099', email: 'gone@example.com' }, JWT_SECRET);
    const deletedRes = mockRes();
    await authenticateJWT({ headers: { authorization: `Bearer ${staleToken}` } }, deletedRes, vi.fn());
    expect(deletedRes.status).toHaveBeenCalledWith(401);
  });
});

