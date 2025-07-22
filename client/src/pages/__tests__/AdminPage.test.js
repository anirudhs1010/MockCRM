import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import React from 'react';
import AdminPage from '../AdminPage';

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ isAdmin: () => true }),
}));

describe('AdminPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockImplementation(() => ({ data: [], isLoading: false, error: null }));
  });

  it('renders admin page header', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AdminPage />
      </QueryClientProvider>
    );
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });
}); 