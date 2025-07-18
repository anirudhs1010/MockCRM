const request = require('supertest');
const express = require('express');
const customersRoute = require('../customers');
const pool = require('../../config/database');

// Mock the database connection pool for testing
jest.mock('../../config/database', () => {
  const mockQuery = jest.fn();
  return {
    query: mockQuery,
    end: jest.fn(),
  };
});

describe('Customers Routes', () => {
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
      req.isAuthenticated = () => true;
      req.user = {
        id: 1,
        account_id: 100,
        role: 'admin',
      };
      req.app = { locals: { pool } };
      next();
    });

    // Mock authentication for sales rep user
    salesRepApp.use((req, res, next) => {
      req.isAuthenticated = () => true;
      req.user = {
        id: 2,
        account_id: 100,
        role: 'sales_rep',
      };
      req.app = { locals: { pool } };
      next();
    });

    // Mock unauthenticated user
    app.use((req, res, next) => {
      req.isAuthenticated = () => false;
      req.user = null;
      next();
    });

    adminApp.use('/api/customers', customersRoute);
    salesRepApp.use('/api/customers', customersRoute);
    app.use('/api/customers', customersRoute);

    pool.query.mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('GET /api/customers', () => {
    it('should return all customers for admin user', async () => {
      const mockCustomers = [
        { id: 1, name: 'Customer 1', email: 'customer1@test.com', account_id: 100 },
        { id: 2, name: 'Customer 2', email: 'customer2@test.com', account_id: 100 },
      ];
      pool.query.mockResolvedValue({ rows: mockCustomers });

      const response = await request(adminApp).get('/api/customers');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCustomers);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM customers WHERE account_id = $1 ORDER BY created_at DESC',
        [100]
      );
    });

    it('should return all customers for sales rep user', async () => {
      const mockCustomers = [
        { id: 1, name: 'Customer 1', email: 'customer1@test.com', account_id: 100 },
      ];
      pool.query.mockResolvedValue({ rows: mockCustomers });

      const response = await request(salesRepApp).get('/api/customers');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCustomers);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM customers WHERE account_id = $1 ORDER BY created_at DESC',
        [100]
      );
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app).get('/api/customers');
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Authentication required' });
    });

    it('should return 500 on database error', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      const response = await request(adminApp).get('/api/customers');
      
      expect(response.status).toBe(500);
      expect(response.text).toBe('Server error');
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should return customer for admin user', async () => {
      const mockCustomer = { id: 1, name: 'Customer 1', email: 'customer1@test.com', account_id: 100 };
      pool.query.mockResolvedValue({ rows: [mockCustomer] });

      const response = await request(adminApp).get('/api/customers/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCustomer);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM customers WHERE id = $1 AND account_id = $2',
        ['1', 100]
      );
    });

    it('should return customer for sales rep user if customer belongs to their account', async () => {
      const mockCustomer = { id: 1, name: 'Customer 1', email: 'customer1@test.com', account_id: 100 };
      pool.query.mockResolvedValue({ rows: [mockCustomer] });

      const response = await request(salesRepApp).get('/api/customers/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockCustomer);
    });

    it('should return 403 for sales rep accessing customer from different account', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const response = await request(salesRepApp).get('/api/customers/999');
      
      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Access denied to this customer' });
    });

    it('should return 404 for non-existent customer', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const response = await request(adminApp).get('/api/customers/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Customer not found' });
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app).get('/api/customers/1');
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Authentication required' });
    });
  });

  describe('POST /api/customers', () => {
    it('should create customer for admin user', async () => {
      const newCustomer = { name: 'New Customer', email: 'new@test.com', phone: '123-456-7890' };
      const createdCustomer = { id: 3, account_id: 100, ...newCustomer };
      pool.query.mockResolvedValue({ rows: [createdCustomer] });

      const response = await request(adminApp).post('/api/customers').send(newCustomer);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdCustomer);
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO customers (account_id, name, email, phone) VALUES ($1, $2, $3, $4) RETURNING *',
        [100, 'New Customer', 'new@test.com', '123-456-7890']
      );
    });

    it('should create customer for sales rep user', async () => {
      const newCustomer = { name: 'New Customer', email: 'new@test.com', phone: '123-456-7890' };
      const createdCustomer = { id: 3, account_id: 100, ...newCustomer };
      pool.query.mockResolvedValue({ rows: [createdCustomer] });

      const response = await request(salesRepApp).post('/api/customers').send(newCustomer);
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdCustomer);
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app).post('/api/customers').send({});
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Authentication required' });
    });

    it('should return 500 on database error', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      const response = await request(adminApp).post('/api/customers').send({});
      
      expect(response.status).toBe(500);
      expect(response.text).toBe('Server error');
    });
  });

  describe('PUT /api/customers/:id', () => {
    it('should update customer for admin user', async () => {
      const updateData = { name: 'Updated Customer', email: 'updated@test.com', phone: '987-654-3210' };
      const updatedCustomer = { id: 1, account_id: 100, ...updateData };
      pool.query.mockResolvedValue({ rows: [updatedCustomer] });

      const response = await request(adminApp).put('/api/customers/1').send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedCustomer);
      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE customers SET name = $1, email = $2, phone = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 AND account_id = $5 RETURNING *',
        ['Updated Customer', 'updated@test.com', '987-654-3210', '1', 100]
      );
    });

    it('should return 403 for sales rep updating customer from different account', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const response = await request(salesRepApp).put('/api/customers/999').send({});
      
      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Access denied to this customer' });
    });

    it('should return 404 for non-existent customer', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const response = await request(adminApp).put('/api/customers/999').send({});
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Customer not found' });
    });

    it('should return 401 for unauthenticated user', async () => {
      const response = await request(app).put('/api/customers/1').send({});
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Authentication required' });
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('should delete customer for admin user', async () => {
      pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

      const response = await request(adminApp).delete('/api/customers/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Customer deleted successfully' });
      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM customers WHERE id = $1 AND account_id = $2 RETURNING *',
        ['1', 100]
      );
    });

    it('should return 403 for sales rep user (admin only)', async () => {
      const response = await request(salesRepApp).delete('/api/customers/1');
      
      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Admin access required' });
    });

    it('should return 404 for non-existent customer', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const response = await request(adminApp).delete('/api/customers/999');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Customer not found' });
    });

    it('should return 403 for unauthenticated user (admin only)', async () => {
      const response = await request(app).delete('/api/customers/1');
      
      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Admin access required' });
    });
  });
}); 