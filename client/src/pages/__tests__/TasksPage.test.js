import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import TasksPage from '../TasksPage';

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

const mockTasks = [
  { id: 1, name: 'Test Task', description: 'Do something', deal_id: 1, status: 'in_progress', priority: 'medium', due_date: '2025-08-01' },
];

const mockDeals = [
  { id: 1, name: 'Test Deal' },
];

function setupMocks() {
  const { useQuery } = require('@tanstack/react-query');
  useQuery.mockImplementation(({ queryKey }) => {
    if (queryKey[0] === 'tasks') return { data: mockTasks, isLoading: false, error: null };
    if (queryKey[0] === 'deals') return { data: mockDeals, isLoading: false, error: null };
    return { data: [], isLoading: false, error: null };
  });
}

describe('TasksPage', () => {
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

  it('renders tasks table and task row', () => {
    render(<TasksPage />);
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Do something')).toBeInTheDocument();
    expect(screen.getAllByText('in_progress')[0]).toBeInTheDocument();
    expect(screen.getAllByText((content) => content.toLowerCase() === 'medium')[0]).toBeInTheDocument();
    expect(screen.getByText('7/31/2025')).toBeInTheDocument();
  });

  it('opens and closes the Add Task modal', () => {
    render(<TasksPage />);
    const addButton = screen.getByText('Add Task');
    fireEvent.click(addButton);
    expect(screen.getByText('Add New Task')).toBeInTheDocument();
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(screen.queryByText('Add New Task')).not.toBeInTheDocument();
  });
}); 