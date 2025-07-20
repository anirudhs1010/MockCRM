import { useOktaAuth } from '@okta/okta-react';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { loading, user, oktaError } = useAuth();
  const { oktaAuth, authState } = useOktaAuth();
  const navigate = useNavigate();

  console.log('Login component: Current state', { 
    user, 
    loading, 
    authState: authState?.isAuthenticated,
    authStatePending: authState?.isPending,
    oktaError
  });

  useEffect(() => {
    // If user is authenticated in our context, redirect to dashboard
    if (user) {
      console.log('Login: User found in context, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Show loading during authentication
  if (loading || authState?.isPending) {
    console.log('Login: Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, don't show login form
  if (user || authState?.isAuthenticated) {
    console.log('Login: User is authenticated, redirecting');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async () => {
    try {
      console.log('Login: Initiating Okta sign in...');
      await oktaAuth.signInWithRedirect();
    } catch (error) {
      console.error('Login: Error initiating sign in:', error);
    }
  };

  console.log('Login: Showing login form');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to MockCRM
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Manage your customers, deals, and tasks
          </p>
        </div>
        
        {oktaError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Authentication Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{oktaError}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8 space-y-6">
          <div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in with Okta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 