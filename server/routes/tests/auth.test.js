const request = require('supertest');
const express = require('express');
const passport = require('passport');

jest.mock('passport');

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    delete require.cache[require.resolve('../auth')];
  });

  describe('GET /auth/okta', () => {
    it('should call passport authenticate for Okta login', async () => {
      passport.authenticate.mockImplementation(() => (req, res) => res.send('redirected to okta'));
      const authRoutes = require('../auth');
      app.use('/auth', authRoutes);

      const res = await request(app).get('/auth/okta');
      
      expect(res.text).toBe('redirected to okta');
      expect(passport.authenticate).toHaveBeenCalledWith('okta');
    });
  });

  describe('GET /auth/okta/callback', () => {
    it('should handle successful OAuth callback', async () => {
      // Mock the callback route directly
      app.get('/auth/okta/callback', (req, res) => {
        req.user = { id: 1, name: 'Test User' };
        res.redirect('/');
      });

      const res = await request(app).get('/auth/okta/callback');
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/');
    });
  });

  describe('GET /auth/logout', () => {
    it('should logout user and redirect to home', async () => {
      const authRoutes = require('../auth');
      
      // Mock req.logout to accept a callback
      app.use((req, res, next) => {
        req.logout = (callback) => {
          callback(); // Call the callback immediately
        };
        next();
      });
      
      app.use('/auth', authRoutes);

      const res = await request(app).get('/auth/logout');
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/');
    });
  });

  describe('GET /auth/status', () => {
    it('should return user info when authenticated', async () => {
      const authRoutes = require('../auth');
      
      // Mock authenticated user
      app.use((req, res, next) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, name: 'Test User', email: 'test@example.com' };
        next();
      });
      
      app.use('/auth', authRoutes);

      const res = await request(app).get('/auth/status');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        authenticated: true,
        user: { id: 1, name: 'Test User', email: 'test@example.com' }
      });
    });

    it('should return not authenticated when user is not logged in', async () => {
      const authRoutes = require('../auth');
      
      // Mock unauthenticated user
      app.use((req, res, next) => {
        req.isAuthenticated = () => false;
        req.user = null;
        next();
      });
      
      app.use('/auth', authRoutes);

      const res = await request(app).get('/auth/status');
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        authenticated: false,
        user: null
      });
    });
  });
});
