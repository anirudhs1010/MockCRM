const request = require('supertest');
const express = require('express');
const dealsRoute = require('../deals');
const pool = require('../../config/database');

// Mock the database connection pool for testing
jest.mock('../../config/database', () => {
  const mockQuery = jest.fn();
  return {
    query: mockQuery,
    end: jest.fn(),
  };
});

// Mock JWT verification
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn((token, secret) => {
    if (token === 'admin-token') {
      return { userId: 1 };
    } else if (token === 'sales-rep-token') {
      return { userId: 2 };
    } else {
      throw new Error('Invalid token');
    }
  })
}));

describe('Deals Routes', () => {
  let app;
  let adminApp;
  let salesRepApp;

  beforeEach(() => {
    // Create separate app instances for different user roles
    app = express();
    adminApp = express();
    salesRepApp = express();

    app.use(express.json());
    adminApp.use(express.json());
    salesRepApp.use(express.json());

    // Mock authentication for admin user
    adminApp.use((req, res, next) => {
      req.headers.authorization = 'Bearer admin-token';
      next();
    });

    // Mock authentication for sales rep user
    salesRepApp.use((req, res, next) => {
      req.headers.authorization = 'Bearer sales-rep-token';
      next();
    });

    // Mock unauthenticated user
    app.use((req, res, next) => {
      // No authorization header
      next();
    });

    adminApp.use('/api/deals', dealsRoute);
    salesRepApp.use('/api/deals', dealsRoute);
    app.use('/api/deals', dealsRoute);

    pool.query.mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('GET /api/deals', () => {
    it('should return a 200 OK status and a list of deals', async () => {
      const mockDeals = [
        { id: 1, name: 'Deal 1', amount: 1000, account_id: 100, user_id: 1, customer_id: 10, stage_id: 1, outcome: 'pending' },
        { id: 2, name: 'Deal 2', amount: 5000, account_id: 100, user_id: 1, customer_id: 11, stage_id: 2, outcome: 'won' },
      ];
      // User lookup for JWT middleware
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, account_id: 100, role: 'admin' }] });
      // Deals query
      pool.query.mockResolvedValueOnce({ rows: mockDeals });
      
      const response = await request(adminApp).get('/api/deals');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDeals);
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('should return a 500 Server Error if there is a database error', async () => {
      // User lookup for JWT middleware
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, account_id: 100, role: 'admin' }] });
      // Deals query fails
      pool.query.mockRejectedValueOnce(new Error('Database connection error'));
      
      const response = await request(adminApp).get('/api/deals');
      expect(response.status).toBe(500);
      expect(response.text).toBe('Server error');
    });
  });

  describe('POST /api/deals', () => {
    it('should create a new deal and return it', async () => {
      const newDeal = { name: 'New Deal', amount: 2000, stage_id: 1, outcome: 'pending', customer_id: 10 };
      const createdDeal = { id: 3, account_id: 100, user_id: 1, ...newDeal };
      // User lookup for JWT middleware
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, account_id: 100, role: 'admin' }] });
      // Deal creation
      pool.query.mockResolvedValueOnce({ rows: [createdDeal] });
      
      const response = await request(adminApp).post('/api/deals').send(newDeal);
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdDeal);
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('should return 500 if there is a database error', async () => {
      // User lookup for JWT middleware
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, account_id: 100, role: 'admin' }] });
      // Deal creation fails
      pool.query.mockRejectedValueOnce(new Error('Database connection error'));
      
      const response = await request(adminApp).post('/api/deals').send({});
      expect(response.status).toBe(500);
      expect(response.text).toBe('Server error');
    });
  });

  describe('PUT /api/deals/:id', () => {
    it('should update a deal and return it', async () => {
      const updatedDeal = { name: 'Updated Deal', amount: 3000, stage_id: 2, outcome: 'won', customer_id: 11 };
      const resultDeal = { id: 1, account_id: 100, user_id: 1, ...updatedDeal };
      // User lookup for JWT middleware
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, account_id: 100, role: 'admin' }] });
      // Deal update
      pool.query.mockResolvedValueOnce({ rows: [resultDeal] });
      
      const response = await request(adminApp).put('/api/deals/1').send(updatedDeal);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(resultDeal);
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('should return 404 if deal not found', async () => {
      // User lookup for JWT middleware
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, account_id: 100, role: 'admin' }] });
      // Deal update returns empty
      pool.query.mockResolvedValueOnce({ rows: [] });
      
      const response = await request(adminApp).put('/api/deals/999').send({});
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Deal not found' });
    });

    it('should return 500 if there is a database error', async () => {
      // User lookup for JWT middleware
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, account_id: 100, role: 'admin' }] });
      // Deal update fails
      pool.query.mockRejectedValueOnce(new Error('Database connection error'));
      
      const response = await request(adminApp).put('/api/deals/1').send({});
      expect(response.status).toBe(500);
      expect(response.text).toBe('Server error');
    });
  });

  describe('DELETE /api/deals/:id', () => {
    it('should delete a deal and return a message', async () => {
      // User lookup for JWT middleware
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, account_id: 100, role: 'admin' }] });
      // Deal deletion
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      
      const response = await request(adminApp).delete('/api/deals/1');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Deal deleted successfully' });
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('should return 404 if deal not found', async () => {
      // User lookup for JWT middleware
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, account_id: 100, role: 'admin' }] });
      // Deal deletion returns empty
      pool.query.mockResolvedValueOnce({ rows: [] });
      
      const response = await request(adminApp).delete('/api/deals/999');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Deal not found' });
    });

    it('should return 500 if there is a database error', async () => {
      // User lookup for JWT middleware
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, account_id: 100, role: 'admin' }] });
      // Deal deletion fails
      pool.query.mockRejectedValueOnce(new Error('Database connection error'));
      
      const response = await request(adminApp).delete('/api/deals/1');
      expect(response.status).toBe(500);
      expect(response.text).toBe('Server error');
    });
  });
});