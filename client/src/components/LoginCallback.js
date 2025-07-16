import { useOktaAuth } from '@okta/okta-react';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginCallback = () => {
  const { oktaAuth, authState } = useOktaAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authState?.isAuthenticated) {
      // User is authenticated, redirect to dashboard
      navigate('/dashboard', { replace: true });
    } else if (authState?.isPending) {
      // Still processing the callback, show loading
      return;
    } else {
      // Authentication failed, redirect to login
      navigate('/login', { replace: true });
    }
  }, [authState, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};

export default LoginCallback; 