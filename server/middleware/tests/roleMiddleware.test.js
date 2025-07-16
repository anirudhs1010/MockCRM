const request = require('supertest');
const express = require('express');
const pool = require('../../config/database');

// Mock the database connection pool for testing
jest.mock('../../config/database', () => {
  const mockQuery = jest.fn();
  return {
    query: mockQuery,
    end: jest.fn(),
  };
});

// Import middleware functions
const {
  requireAuth,
  requireAdmin,
  requireAdminOrOwnership,
  canAccessDeal,
  canAccessCustomer,
  canAccessTask
} = require('../roleMiddleware');

describe('Role Middleware', () => {
  let app;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock request, response, and next function
    mockReq = {
      isAuthenticated: jest.fn(),
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
      mockReq.isAuthenticated.mockReturnValue(true);
      
      requireAuth(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockReq.isAuthenticated.mockReturnValue(false);
      
      requireAuth(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should call next() when user is admin', () => {
      mockReq.isAuthenticated.mockReturnValue(true);
      mockReq.user = { role: 'admin' };
      
      requireAdmin(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not admin', () => {
      mockReq.isAuthenticated.mockReturnValue(true);
      mockReq.user = { role: 'sales_rep' };
      
      requireAdmin(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Admin access required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not authenticated', () => {
      mockReq.isAuthenticated.mockReturnValue(false);
      
      requireAdmin(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Admin access required' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdminOrOwnership', () => {
    it('should call next() when user is admin', () => {
      mockReq.isAuthenticated.mockReturnValue(true);
      mockReq.user = { role: 'admin' };
      
      requireAdminOrOwnership(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() when user is not admin (ownership check will be done per-route)', () => {
      mockReq.isAuthenticated.mockReturnValue(true);
      mockReq.user = { role: 'sales_rep' };
      
      requireAdminOrOwnership(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      mockReq.isAuthenticated.mockReturnValue(false);
      
      requireAdminOrOwnership(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('canAccessDeal', () => {
    it('should call next() when user is admin', async () => {
      mockReq.isAuthenticated.mockReturnValue(true);
      mockReq.user = { id: 1, role: 'admin' };
      
      await canAccessDeal(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() when user owns the deal', async () => {
      mockReq.isAuthenticated.mockReturnValue(true);
      mockReq.user = { id: 1, account_id: 100, role: 'sales_rep' };
      mockReq.params = { id: '1' };
      
      pool.query.mockResolvedValue({ rows: [{ id: 1, user_id: 1, account_id: 100 }] });
      
      await canAccessDeal(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM deals WHERE id = $1 AND user_id = $2 AND account_id = $3',
        ['1', 1, 100]
      );
    });

    it('should return 403 when user does not own the deal', async () => {
      mockReq.isAuthenticated.mockReturnValue(true);
      mockReq.user = { id: 1, account_id: 100, role: 'sales_rep' };
      mockReq.params = { id: '1' };
      
      pool.query.mockResolvedValue({ rows: [] });
      
      await canAccessDeal(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access denied to this deal' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockReq.isAuthenticated.mockReturnValue(false);
      
      await canAccessDeal(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockReq.isAuthenticated.mockReturnValue(true);
      mockReq.user = { id: 1, account_id: 100, role: 'sales_rep' };
      mockReq.params = { id: '1' };
      
      pool.query.mockRejectedValue(new Error('Database error'));
      
      await canAccessDeal(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('canAccessCustomer', () => {
    it('should call next() when user is admin', async () => {
      mockReq.isAuthenticated.mockReturnValue(true);
      mockReq.user = { id: 1, role: 'admin' };
      
      await canAccessCustomer(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() when customer belongs to user account', async () => {
      mockReq.isAuthenticated.mockReturnValue(true);
      mockReq.user = { id: 1, account_id: 100, role: 'sales_rep' };
      mockReq.params = { id: '1' };
      
      pool.query.mockResolvedValue({ rows: [{ id: 1, account_id: 100 }] });
      
      await canAccessCustomer(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM customers WHERE id = $1 AND account_id = $2',
        ['1', 100]
      );
    });

    it('should return 403 when customer does not belong to user account', async () => {
      mockReq.isAuthenticated.mockReturnValue(true);
      mockReq.user = { id: 1, account_id: 100, role: 'sales_rep' };
      mockReq.params = { id: '1' };
      
      pool.query.mockResolvedValue({ rows: [] });
      
      await canAccessCustomer(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access denied to this customer' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockReq.isAuthenticated.mockReturnValue(false);
      
      await canAccessCustomer(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockReq.isAuthenticated.mockReturnValue(true);
      mockReq.user = { id: 1, account_id: 100, role: 'sales_rep' };
      mockReq.params = { id: '1' };
      
      pool.query.mockRejectedValue(new Error('Database error'));
      
      await canAccessCustomer(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('canAccessTask', () => {
    it('should call next() when user is admin', async () => {
      mockReq.isAuthenticated.mockReturnValue(true);
      mockReq.user = { id: 1, role: 'admin' };
      
      await canAccessTask(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should call next() when user is assigned to the task', async () => {
      mockReq.isAuthenticated.mockReturnValue(true);
      mockReq.user = { id: 1, account_id: 100, role: 'sales_rep' };
      mockReq.params = { id: '1' };
      
      pool.query.mockResolvedValue({ rows: [{ id: 1, user_id: 1 }] });
      
      await canAccessTask(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT t.* FROM tasks t JOIN deals d ON t.deal_id = d.id WHERE t.id = $1 AND t.user_id = $2 AND d.account_id = $3',
        ['1', 1, 100]
      );
    });

    it('should return 403 when user is not assigned to the task', async () => {
      mockReq.isAuthenticated.mockReturnValue(true);
      mockReq.user = { id: 1, account_id: 100, role: 'sales_rep' };
      mockReq.params = { id: '1' };
      
      pool.query.mockResolvedValue({ rows: [] });
      
      await canAccessTask(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access denied to this task' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      mockReq.isAuthenticated.mockReturnValue(false);
      
      await canAccessTask(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      mockReq.isAuthenticated.mockReturnValue(true);
      mockReq.user = { id: 1, account_id: 100, role: 'sales_rep' };
      mockReq.params = { id: '1' };
      
      pool.query.mockRejectedValue(new Error('Database error'));
      
      await canAccessTask(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Server error' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
}); 