import { OktaAuth } from '@okta/okta-auth-js';
import { Security } from '@okta/okta-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import oktaConfig from './config/okta';
import { AuthProvider } from './contexts/AuthContext';
import AdminPage from './pages/AdminPage';
import CustomersPage from './pages/CustomersPage';
import DashboardPage from './pages/DashboardPage';
import DealsPage from './pages/DealsPage';
import TasksPage from './pages/TasksPage';

// Initialize Okta Auth
const oktaAuth = new OktaAuth(oktaConfig);

// Make oktaAuth available globally for API calls
window.oktaAuth = oktaAuth;

// Initialize React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Configure axios to include credentials
import axios from 'axios';
axios.defaults.withCredentials = true;
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Callback component that handles the authentication
const LoginCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Process the callback and redirect to dashboard
    const processCallback = async () => {
      try {
        console.log('LoginCallback: Processing authentication callback...');
        console.log('LoginCallback: Current URL:', window.location.href);
        
        // Let Okta handle the token exchange
        console.log('LoginCallback: Calling oktaAuth.handleRedirect()...');
        await oktaAuth.handleRedirect();
        
        console.log('LoginCallback: Token exchange completed successfully');
        
        // Force a check for user data after token exchange
        console.log('LoginCallback: Checking for user data...');
        try {
          const user = await oktaAuth.getUser();
          console.log('LoginCallback: User data retrieved:', user);
        } catch (error) {
          console.error('LoginCallback: Error getting user data:', error);
        }
        
        console.log('LoginCallback: Redirecting to dashboard...');
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('LoginCallback: Error processing callback:', error);
        console.error('LoginCallback: Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        navigate('/login', { replace: true });
      }
    };

    processCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Security 
          oktaAuth={oktaAuth}
          restoreOriginalUri={async (oktaAuth, originalUri) => {
            console.log('App: restoreOriginalUri called with:', originalUri);
            // Use the navigate function instead of window.location
            if (originalUri) {
              window.location.replace(originalUri);
            } else {
              window.location.replace('/dashboard');
            }
          }}
          onAuthRequired={async (oktaAuth) => {
            console.log('App: onAuthRequired triggered');
            await oktaAuth.signInWithRedirect();
          }}
        >
          <AuthProvider>
            <div className="min-h-screen bg-gray-50">
              <Navigation />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/login/callback" element={<LoginCallback />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/customers" 
                    element={
                      <ProtectedRoute>
                        <CustomersPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/deals" 
                    element={
                      <ProtectedRoute>
                        <DealsPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/tasks" 
                    element={
                      <ProtectedRoute>
                        <TasksPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin" 
                    element={
                      <ProtectedRoute>
                        <AdminPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          </AuthProvider>
        </Security>
      </Router>
    </QueryClientProvider>
  );
}

export default App; 