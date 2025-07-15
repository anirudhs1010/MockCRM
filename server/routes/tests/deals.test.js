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
app.use('/api/deals', dealsRoute);

describe('GET /api/deals', () => {
  beforeEach(() => {
    // Reset the mock before each test
    pool.query.mockClear();
    // Mock console.error to suppress output during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error after each test
    console.error.mockRestore();
  });

  it('should return a 200 OK status and a list of deals', async () => {
    // Mock the database query to return some sample data
    pool.query.mockResolvedValue({
      rows: [
        { id: 1, stage: 'Prospecting', amount: 1000 },
        { id: 2, stage: 'Qualified', amount: 5000 },
      ],
    });

    const response = await request(app).get('/api/deals');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: 1, stage: 'Prospecting', amount: 1000 },
      { id: 2, stage: 'Qualified', amount: 5000 },
    ]);
    expect(pool.query).toHaveBeenCalledTimes(1); // Verify the query was called
  });

  it('should return a 500 Server Error if there is a database error', async () => {
    // Mock the database query to reject with an error
    pool.query.mockRejectedValue(new Error('Database connection error'));

    const response = await request(app).get('/api/deals');

    expect(response.status).toBe(500);
    expect(response.text).toBe('Server error');
    expect(pool.query).toHaveBeenCalledTimes(1); // Verify the query was called
  });
});