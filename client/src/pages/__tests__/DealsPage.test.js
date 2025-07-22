import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import DealsPage from '../DealsPage';

// Mock react-query hooks
jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  let mutationCallCount = 0;
  return {
    ...actual,
    useQuery: jest.fn(),
    useMutation: jest.fn(() => {
      mutationCallCount++;
      return { mutate: jest.fn(), isLoading: false, isError: false, error: null };
    }),
    useQueryClient: jest.fn(() => ({ invalidateQueries: jest.fn() })),
  };
});

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ isAdmin: () => true }),
}));

const mockDeals = [
  { id: 1, name: 'Test Deal', customer_name: 'Test Customer', amount: 1000, stage: 'Prospecting', outcome: 'won' },
];

const mockStages = [
  { id: 1, name: 'Prospecting' },
];

// Helper to set up mocks
function setupMocks() {
  const { useQuery } = require('@tanstack/react-query');
  useQuery.mockImplementation(({ queryKey }) => {
    if (queryKey[0] === 'deals') return { data: mockDeals, isLoading: false, error: null };
    if (queryKey[0] === 'stages') return { data: mockStages, isLoading: false, error: null };
    return { data: [], isLoading: false, error: null };
  });
}

describe('DealsPage', () => {
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

  it('renders deals table and deal row', () => {
    render(<DealsPage />);
    expect(screen.getByText('Deals')).toBeInTheDocument();
    expect(screen.getByText('Test Deal')).toBeInTheDocument();
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
    expect(screen.getByText('$1,000')).toBeInTheDocument();
    expect(screen.getAllByText('Prospecting')[0]).toBeInTheDocument();
    expect(screen.getAllByText('won')[0]).toBeInTheDocument();
  });

  it('opens and closes the Add Deal modal', () => {
    render(<DealsPage />);
    const addButton = screen.getByText('Add Deal');
    fireEvent.click(addButton);
    expect(screen.getByText('Add New Deal')).toBeInTheDocument();
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(screen.queryByText('Add New Deal')).not.toBeInTheDocument();
  });
}); 