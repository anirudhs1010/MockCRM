const jwt = require('jsonwebtoken');

// Mock the database pool
jest.mock('../config/database', () => ({
  query: jest.fn()
}));

const pool = require('../config/database');

describe('JWT Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('requireAuth', () => {
    const { requireAuth } = require('../jwtMiddleware');

    it('should call next() with valid token', async () => {
      const token = jwt.sign(
        { userId: 1, email: 'test@example.com', role: 'admin' },
        'your-secret-key',
        { expiresIn: '1h' }
      );

      req.headers.authorization = `Bearer ${token}`;
      
      pool.query.mockResolvedValue({
        rows: [{ id: 1, email: 'test@example.com', role: 'admin' }]
      });

      await requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(1);
    });

    it('should return 401 for missing authorization header', async () => {
      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authorization header required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for user not found', async () => {
      const token = jwt.sign(
        { userId: 999, email: 'test@example.com', role: 'admin' },
        'your-secret-key',
        { expiresIn: '1h' }
      );

      req.headers.authorization = `Bearer ${token}`;
      
      pool.query.mockResolvedValue({ rows: [] });

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    const { requireAdmin } = require('../jwtMiddleware');

    it('should call next() for admin user', () => {
      req.user = { role: 'admin' };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 403 for non-admin user', () => {
      req.user = { role: 'sales_rep' };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 for user without role', () => {
      req.user = {};

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Admin access required' });
      expect(next).not.toHaveBeenCalled();
    });
  });
}); 