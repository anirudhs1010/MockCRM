import { render, screen } from '@testing-library/react';
import React from 'react';
import DashboardPage from '../DashboardPage';

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { name: 'Test User' }, isAdmin: () => true }),
}));

const mockDeals = [
  { id: 1, name: 'Deal 1', amount: 1000, outcome: 'won' },
];
const mockCustomers = [
  { id: 1, name: 'Customer 1' },
];
const mockTasks = [
  { id: 1, name: 'Task 1', status: 'done' },
];

function setupMocks() {
  const { useQuery } = require('@tanstack/react-query');
  useQuery.mockImplementation(({ queryKey }) => {
    if (queryKey[0] === 'deals') return { data: mockDeals, isLoading: false };
    if (queryKey[0] === 'customers') return { data: mockCustomers, isLoading: false };
    if (queryKey[0] === 'tasks') return { data: mockTasks, isLoading: false };
    return { data: [], isLoading: false };
  });
}

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupMocks();
  });

  it('renders dashboard metrics and recent activity', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Total Deals')).toBeInTheDocument();
    expect(screen.getByText('Total Customers')).toBeInTheDocument();
    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('Deal 1')).toBeInTheDocument();
    expect(screen.getByText('Task 1')).toBeInTheDocument();
  });
}); 