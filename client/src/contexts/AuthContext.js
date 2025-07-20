import { useOktaAuth } from '@okta/okta-react';
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { oktaAuth, authState } = useOktaAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [oktaError, setOktaError] = useState(null);

  // Function to get user data from Okta
  const getUserData = async () => {
    try {
      console.log('AuthContext: Getting user data from Okta...');
      console.log('AuthContext: authState:', authState);
      
      // Check if we have tokens
      const tokenManager = oktaAuth.tokenManager;
      const accessToken = await tokenManager.get('accessToken');
      const idToken = await tokenManager.get('idToken');
      
      console.log('AuthContext: Access token exists:', !!accessToken);
      console.log('AuthContext: ID token exists:', !!idToken);
      
      const oktaUser = await oktaAuth.getUser();
      console.log('AuthContext: Okta user data', oktaUser);
      
      if (!oktaUser) {
        throw new Error('No user data returned from Okta');
      }
      
      const userData = {
        id: oktaUser.sub,
        name: oktaUser.name,
        email: oktaUser.email,
        role: 'admin' // Set to admin by default
      };
      
      console.log('AuthContext: Setting user data', userData);
      setUser(userData);
      setLoading(false);
      return userData;
    } catch (error) {
      console.error('AuthContext: Error getting Okta user:', error);
      console.error('AuthContext: Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      setUser(null);
      setLoading(false);
      setOktaError(`Failed to get user information from Okta: ${error.message}`);
      return null;
    }
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      console.log('AuthContext: authState changed', authState);
      console.log('AuthContext: authState.isAuthenticated', authState?.isAuthenticated);
      console.log('AuthContext: authState.isPending', authState?.isPending);
      
      // If authState is still undefined after a reasonable time, assume not authenticated
      if (!authState) {
        console.log('AuthContext: authState is undefined, waiting for initialization...');
        // Set a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
          console.log('AuthContext: Timeout reached, assuming not authenticated');
          setUser(null);
          setLoading(false);
          setOktaError('Okta authentication service is not responding. Please check your connection and Okta configuration.');
        }, 5000); // 5 second timeout
        
        return () => clearTimeout(timeout);
      }
      
      // Clear any previous errors
      setOktaError(null);
      
      if (authState.isAuthenticated) {
        console.log('AuthContext: User is authenticated, getting user info...');
        await getUserData();
      } else if (authState.isPending) {
        console.log('AuthContext: Authentication is pending, keeping loading state');
        setLoading(true);
      } else {
        console.log('AuthContext: User is not authenticated');
        setUser(null);
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [authState, oktaAuth]);

  // Force user data fetch when authState is true but user is null
  useEffect(() => {
    if (authState?.isAuthenticated && !user && !loading) {
      console.log('AuthContext: authState is true but user is null, forcing user data fetch...');
      getUserData();
    }
  }, [authState?.isAuthenticated, user, loading, oktaAuth]);

  const logout = async () => {
    console.log('AuthContext: Logout called');
    try {
      await oktaAuth.signOut({
        postLogoutRedirectUri: window.location.origin + '/login'
      });
      setUser(null);
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
      setOktaError(`Failed to logout: ${error.message}`);
    }
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const value = {
    user,
    loading,
    logout,
    isAdmin,
    isAuthenticated,
    oktaError,
    oktaAuth
  };

  console.log('AuthContext: Current state', { user, loading, authState: authState?.isAuthenticated, oktaError });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 