import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';
import AdminPage from './pages/AdminPage';
import CustomersPage from './pages/CustomersPage';
import DashboardPage from './pages/DashboardPage';
import DealsPage from './pages/DealsPage';
import LoginPage from './pages/LoginPage';
import TasksPage from './pages/TasksPage';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
                    <ProtectedRoute adminOnly>
                      <AdminPage />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App; 