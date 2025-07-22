import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import CustomersPage from '../CustomersPage';

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: jest.fn(),
    useMutation: jest.fn().mockImplementation(() => ({
      mutate: jest.fn(),
      isLoading: false,
      isError: false,
      error: null,
    })),
    useQueryClient: jest.fn(() => ({ invalidateQueries: jest.fn() })),
  };
});

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ isAdmin: () => true }),
}));

const mockCustomers = [
  { id: 1, name: 'Test Customer', email: 'test@example.com', phone: '1234567890', created_at: '2025-07-22' },
];

function setupMocks() {
  const { useQuery } = require('@tanstack/react-query');
  useQuery.mockImplementation(({ queryKey }) => {
    if (queryKey[0] === 'customers') return { data: mockCustomers, isLoading: false, error: null };
    return { data: [], isLoading: false, error: null };
  });
}

describe('CustomersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    require('@tanstack/react-query').useMutation.mockImplementation(() => ({
      mutate: jest.fn(),
      isLoading: false,
      isError: false,
      error: null,
    }));
    setupMocks();
  });

  it('renders customers table and customer row', () => {
    render(<CustomersPage />);
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();
  });

  it('opens and closes the Add Customer modal', () => {
    render(<CustomersPage />);
    const addButton = screen.getByText('Add Customer');
    fireEvent.click(addButton);
    expect(screen.getByText('Add New Customer')).toBeInTheDocument();
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(screen.queryByText('Add New Customer')).not.toBeInTheDocument();
  });
}); 