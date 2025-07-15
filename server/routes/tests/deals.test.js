const request = require('supertest');
const express = require('express');
const dealsRoute = require('../deals'); // Path to your deals route file
const pool = require('../../config/database'); // Import your database connection

// Mock the database connection pool for testing
jest.mock('../../config/database', () => {
  const mockQuery = jest.fn();
  return {
    query: mockQuery,
    end: jest.fn(), // Mock the end function if needed
  };
});

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  // Mock authentication and user context for all tests
  req.isAuthenticated = () => true;
  req.user = {
    id: 1,
    account_id: 100,
    role: 'admin', // Change to 'sales_rep' to test sales rep logic
  };
  next();
});
app.use('/api/deals', dealsRoute);

describe('GET /api/deals', () => {
  beforeEach(() => {
    pool.query.mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    console.error.mockRestore();
  });

  it('should return a 200 OK status and a list of deals', async () => {
    pool.query.mockResolvedValue({
      rows: [
        { id: 1, name: 'Deal 1', amount: 1000, account_id: 100, user_id: 1, customer_id: 10, stage_id: 1, outcome: 'pending' },
        { id: 2, name: 'Deal 2', amount: 5000, account_id: 100, user_id: 1, customer_id: 11, stage_id: 2, outcome: 'won' },
      ],
    });
    const response = await request(app).get('/api/deals');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: 1, name: 'Deal 1', amount: 1000, account_id: 100, user_id: 1, customer_id: 10, stage_id: 1, outcome: 'pending' },
      { id: 2, name: 'Deal 2', amount: 5000, account_id: 100, user_id: 1, customer_id: 11, stage_id: 2, outcome: 'won' },
    ]);
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('should return a 500 Server Error if there is a database error', async () => {
    pool.query.mockRejectedValue(new Error('Database connection error'));
    const response = await request(app).get('/api/deals');
    expect(response.status).toBe(500);
    expect(response.text).toBe('Server error');
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
});

describe('POST /api/deals', () => {
  beforeEach(() => {
    pool.query.mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    console.error.mockRestore();
  });

  it('should create a new deal and return it', async () => {
    const newDeal = { name: 'New Deal', amount: 2000, stage_id: 1, outcome: 'pending', customer_id: 10 };
    pool.query.mockResolvedValue({ rows: [{ id: 3, account_id: 100, user_id: 1, ...newDeal }] });
    const response = await request(app).post('/api/deals').send(newDeal);
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: 3, account_id: 100, user_id: 1, ...newDeal });
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('should return 500 if there is a database error', async () => {
    pool.query.mockRejectedValue(new Error('Database connection error'));
    const response = await request(app).post('/api/deals').send({});
    expect(response.status).toBe(500);
    expect(response.text).toBe('Server error');
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
});

describe('PUT /api/deals/:id', () => {
  beforeEach(() => {
    pool.query.mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    console.error.mockRestore();
  });

  it('should update a deal and return it', async () => {
    const updatedDeal = { name: 'Updated Deal', amount: 3000, stage_id: 2, outcome: 'won', customer_id: 11 };
    pool.query.mockResolvedValue({ rows: [{ id: 1, account_id: 100, user_id: 1, ...updatedDeal }] });
    const response = await request(app).put('/api/deals/1').send(updatedDeal);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 1, account_id: 100, user_id: 1, ...updatedDeal });
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('should return 404 if deal not found', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const response = await request(app).put('/api/deals/999').send({});
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Deal not found' });
  });

  it('should return 500 if there is a database error', async () => {
    pool.query.mockRejectedValue(new Error('Database connection error'));
    const response = await request(app).put('/api/deals/1').send({});
    expect(response.status).toBe(500);
    expect(response.text).toBe('Server error');
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
});

describe('DELETE /api/deals/:id', () => {
  beforeEach(() => {
    pool.query.mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    console.error.mockRestore();
  });

  it('should delete a deal and return a message', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1 }] });
    const response = await request(app).delete('/api/deals/1');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Deal deleted successfully' });
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('should return 404 if deal not found', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const response = await request(app).delete('/api/deals/999');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Deal not found' });
  });

  it('should return 500 if there is a database error', async () => {
    pool.query.mockRejectedValue(new Error('Database connection error'));
    const response = await request(app).delete('/api/deals/1');
    expect(response.status).toBe(500);
    expect(response.text).toBe('Server error');
    expect(pool.query).toHaveBeenCalledTimes(1);
  });
});