const passport = require('passport');
const pool = require('../../config/database');

// Mock passport and database BEFORE importing the middleware
jest.mock('passport');
jest.mock('../../config/database', () => {
  const mockQuery = jest.fn();
  return {
    query: mockQuery,
    end: jest.fn(),
  };
});

// Mock the Strategy constructor
jest.mock('passport-openidconnect', () => ({
  Strategy: jest.fn().mockImplementation((config, verify) => {
    return {
      _issuer: config.issuer,
      _authorizationURL: config.authorizationURL,
      _tokenURL: config.tokenURL,
      _userInfoURL: config.userInfoURL,
      _clientID: config.clientID,
      _clientSecret: config.clientSecret,
      _callbackURL: config.callbackURL,
      _scope: config.scope,
      _verify: verify
    };
  })
}));

// Mock environment variables
process.env.OKTA_DOMAIN = 'test.okta.com';
process.env.OKTA_CLIENT_ID = 'test-client-id';
process.env.OKTA_CLIENT_SECRET = 'test-client-secret';
process.env.OKTA_CALLBACK_URL = 'http://localhost:3000/auth/okta/callback';

describe('Auth Middleware', () => {
  beforeEach(() => {
    pool.query.mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    delete require.cache[require.resolve('../authMiddleware')];
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('should restore user with correct role after deserialization', async () => {
    require('../authMiddleware');
    const userId = 1;
    const user = { id: 1, name: 'Test User', role: 'admin' };
    const mockDone = jest.fn();
    pool.query.mockResolvedValue({ rows: [user] });
    // Get the deserializeUser function
    const deserializeCall = passport.deserializeUser.mock.calls[0];
    const deserializeFunction = deserializeCall[0];
    await deserializeFunction(userId, mockDone);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
    expect(mockDone).toHaveBeenCalledWith(null, user);
    // The important part: role is present and correct
    expect(user.role).toBe('admin');
  });
}); 