const express = require('express');
const passport = require('passport');
const router = express.Router();

// Initiate Okta OAuth login
router.get('/okta', passport.authenticate('okta'));

// Handle Okta OAuth callback
router.get('/okta/callback',
  passport.authenticate('okta', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication
    res.redirect('/'); // Redirect to home or dashboard
  }
);

// Logout route
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

module.exports = router; 