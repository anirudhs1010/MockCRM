const express = require('express');

// Mock the database pool
jest.mock('../../config/database', () => ({
  query: jest.fn()
}));

const pool = require('../../config/database');
const { requireAuth, requireAdmin, requireAdminOrOwnership, canAccessDeal, canAccessCustomer, canAccessTask } = require('../roleMiddleware');

describe('Role Middleware', () => {
  let app, mockReq, mockRes, mockNext;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock request, response, and next function
    mockReq = {
      user: null,
      params: {},
      app: {
        locals: {
          pool: pool
        }
      }
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    mockNext = jest.fn();
    
    pool.query.mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('requireAuth', () => {
    it('should call next() when user is authenticated', () => {
      mockReq.user = { id: 1, role: 'admin' };
      
      requireAuth(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockReq.user = null;
      
      requireAuth(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should call next() when user is admin', () => {
      mockReq.user = { role: 'admin' };
      
      requireAdmin(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not admin', () => {
      mockReq.user = { role: 'sales_rep' };
      
      requireAdmin(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Admin access required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not authenticated', () => {
      mockReq.user = null;
      
      requireAdmin(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Admin access required' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdminOrOwnership', () => {
    it('should call next() when user is admin', () => {
      mockReq.user = { role: 'admin' };
      
      requireAdminOrOwnership(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() when user is not admin (ownership check will be done per-route)', () => {
      mockReq.user = { role: 'sales_rep' };
      
      requireAdminOrOwnership(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockReq.user = null;
      
      requireAdminOrOwnership(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('canAccessDeal', () => {
    it('should call next() when user is admin', async () => {
      mockReq.user = { role: 'admin' };
      
      await canAccessDeal(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() when user owns the deal', async () => {
      mockReq.user = { id: 1, account_id: 1, role: 'sales_rep' };
      mockReq.params = { id: '1' };
      
      pool.query.mockResolvedValue({
        rows: [{ id: 1, user_id: 1, account_id: 1 }]
      });
      
      await canAccessDeal(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 when user does not own the deal', async () => {
      mockReq.user = { id: 1, account_id: 1, role: 'sales_rep' };
      mockReq.params = { id: '1' };
      
      pool.query.mockResolvedValue({
        rows: []
      });
      
      await canAccessDeal(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access denied to this deal' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockReq.user = null;
      
      await canAccessDeal(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('canAccessCustomer', () => {
    it('should call next() when user is admin', async () => {
      mockReq.user = { role: 'admin' };
      
      await canAccessCustomer(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() when customer belongs to user account', async () => {
      mockReq.user = { id: 1, account_id: 1, role: 'sales_rep' };
      mockReq.params = { id: '1' };
      
      pool.query.mockResolvedValue({
        rows: [{ id: 1, account_id: 1 }]
      });
      
      await canAccessCustomer(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 when customer does not belong to user account', async () => {
      mockReq.user = { id: 1, account_id: 1, role: 'sales_rep' };
      mockReq.params = { id: '1' };
      
      pool.query.mockResolvedValue({
        rows: []
      });
      
      await canAccessCustomer(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access denied to this customer' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockReq.user = null;
      
      await canAccessCustomer(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('canAccessTask', () => {
    it('should call next() when user is admin', async () => {
      mockReq.user = { role: 'admin' };
      
      await canAccessTask(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() when task belongs to user account', async () => {
      mockReq.user = { id: 1, account_id: 1, role: 'sales_rep' };
      mockReq.params = { id: '1' };
      
      pool.query.mockResolvedValue({
        rows: [{ id: 1, user_id: 1 }]
      });
      
      await canAccessTask(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 when task does not belong to user account', async () => {
      mockReq.user = { id: 1, account_id: 1, role: 'sales_rep' };
      mockReq.params = { id: '1' };
      
      pool.query.mockResolvedValue({
        rows: []
      });
      
      await canAccessTask(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access denied to this task' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockReq.user = null;
      
      await canAccessTask(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
}); 