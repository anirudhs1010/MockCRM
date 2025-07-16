import { useOktaAuth } from '@okta/okta-react';
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Login from './Login';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();
  const { authState } = useOktaAuth();

  console.log('ProtectedRoute: Current state', { 
    user, 
    loading, 
    authState: authState?.isAuthenticated,
    authStatePending: authState?.isPending 
  });

  // Show loading during authentication, but with a reasonable timeout
  if (loading || authState?.isPending) {
    console.log('ProtectedRoute: Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If authState is undefined and we're not loading, assume not authenticated
  if (!authState && !loading) {
    console.log('ProtectedRoute: authState undefined and not loading, showing login');
    return <Login />;
  }

  // Check if user is authenticated
  if (!user && !authState?.isAuthenticated) {
    console.log('ProtectedRoute: No user found and not authenticated, showing login');
    return <Login />;
  }

  // If Okta says we're authenticated but we don't have user data yet, show loading
  if (authState?.isAuthenticated && !user) {
    console.log('ProtectedRoute: Okta authenticated but no user data yet, showing loading');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Check admin requirements
  if (requireAdmin && !isAdmin()) {
    console.log('ProtectedRoute: Admin access required but user is not admin');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  console.log('ProtectedRoute: User authenticated, showing protected content');
  return children;
};

export default ProtectedRoute; 