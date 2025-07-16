const passport = require('passport');
const { Strategy } = require('passport-openidconnect');
const pool = require('../config/database');
require('dotenv').config({ path: '../../.env' });

passport.use('okta', new Strategy({
  issuer: `https://${process.env.OKTA_DOMAIN}/oauth2/default`,
  authorizationURL: `https://${process.env.OKTA_DOMAIN}/oauth2/default/v1/authorize`,
  tokenURL: `https://${process.env.OKTA_DOMAIN}/oauth2/default/v1/token`,
  userInfoURL: `https://${process.env.OKTA_DOMAIN}/oauth2/default/v1/userinfo`,
  clientID: process.env.OKTA_CLIENT_ID,
  clientSecret: process.env.OKTA_CLIENT_SECRET,
  callbackURL: process.env.OKTA_CALLBACK_URL,
  scope: 'openid profile email'
}, async (issuer, sub, profile, accessToken, refreshToken, done) => {
  try {
    // Check if user exists in database
    const userResult = await pool.query(
      'SELECT * FROM users WHERE okta_id = $1',
      [sub]
    );

    if (userResult.rows.length > 0) {
      // User exists, return the user
      return done(null, userResult.rows[0]);
    } else {
      // Create new user - first create or find an account
      let accountId;
      
      // For now, create a new account for each user
      // In a real app, you might want to invite users to existing accounts
      const accountResult = await pool.query(
        'INSERT INTO accounts (name) VALUES ($1) RETURNING id',
        [`${profile.displayName}'s Account`]
      );
      accountId = accountResult.rows[0].id;

      // Create new user with account_id
      const newUserResult = await pool.query(
        'INSERT INTO users (account_id, okta_id, email, name, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [accountId, sub, profile.emails[0].value, profile.displayName, 'sales_rep']
      );
      return done(null, newUserResult.rows[0]);
    }
  } catch (error) {
    console.error('Error in OAuth callback:', error);
    return done(error);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length > 0) {
      done(null, result.rows[0]);
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error);
  }
}); 