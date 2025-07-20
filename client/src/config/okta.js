const oktaConfig = {
  issuer: process.env.REACT_APP_OKTA_ISSUER,
  clientId: process.env.REACT_APP_OKTA_CLIENT_ID,
  redirectUri: window.location.origin + '/login/callback',
  scopes: ['openid', 'profile', 'email'],
  pkce: true,
  disableHttpsCheck: process.env.NODE_ENV === 'development',
  responseType: ['code'],
  // Add debugging
  onAuthRequired: () => {
    console.log('Okta: Auth required callback triggered');
  },
  onAuthResume: () => {
    console.log('Okta: Auth resume callback triggered');
  },
  // Add error handling
  onAuthError: (error) => {
    console.error('Okta: Authentication error:', error);
  }
};

export default oktaConfig; 