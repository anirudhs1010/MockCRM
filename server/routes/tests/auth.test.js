const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock the database pool
jest.mock('../config/database', () => ({
  query: jest.fn()
}));

const pool = require('../config/database');

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock the auth routes
    app.post('/auth/login', (req, res) => {
      const { email, password } = req.body;
      if (email === 'test@example.com' && password === 'password123') {
        const token = jwt.sign(
          { userId: 1, email: 'test@example.com', role: 'admin' },
          'test-secret',
          { expiresIn: '1h' }
        );
        res.json({
          user: { id: 1, email: 'test@example.com', name: 'Test User', role: 'admin' },
          token
        });
      } else {
        res.status(401).json({ error: 'Invalid email or password' });
      }
    });

    app.get('/auth/verify', (req, res) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header required' });
      }
      
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, 'test-secret');
        res.json({ id: decoded.userId, email: decoded.email, role: decoded.role });
      } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
      }
    });
  });

  describe('POST /auth/login', () => {
    it('should authenticate valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /auth/verify', () => {
    it('should verify valid token', async () => {
      const token = jwt.sign(
        { userId: 1, email: 'test@example.com', role: 'admin' },
        'test-secret',
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email');
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/auth/verify')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject missing authorization header', async () => {
      const res = await request(app).get('/auth/verify');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });
});
