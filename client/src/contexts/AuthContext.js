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
  const [user, setUser] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on app start
  useEffect(() => {

    // Check if user is already logged in on app start
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          // Verify token with backend
          const response = await fetch('http://localhost:5000/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('authToken');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {

    try {
      setError(null);
      const response = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const { user: userData, token } = await response.json();
      
      // Store token
      localStorage.setItem('authToken', token);
      setUser(userData);
      
      return userData;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const register = async (email, password, name) => {

    try {
      setError(null);
      const response = await fetch('http://localhost:5000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const { user: userData, token } = await response.json();
      
      // Store token
      localStorage.setItem('authToken', token);
      setUser(userData);
      
      return userData;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const logout = async () => {

    try {
      // Call logout endpoint to invalidate token on server
      const token = localStorage.getItem('authToken');
      if (token) {
        await fetch('http://localhost:5000/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of server response
      localStorage.removeItem('authToken');
      setUser(null);
      setError(null);
    }
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const getAuthToken = () => {
    return localStorage.getItem('authToken');
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAdmin,
    getAuthToken,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 