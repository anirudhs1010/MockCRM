import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';

jest.mock('@okta/okta-react', () => ({
  useOktaAuth: () => ({
    oktaAuth: { signInWithRedirect: jest.fn(), signOut: jest.fn() },
    authState: { isAuthenticated: false, isPending: false }
  }),
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    loading: false,
    user: null,
    oktaError: null,
  }),
}));

describe('LoginPage', () => {
  it('renders login form', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/sign in to mockcrm/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with okta/i })).toBeInTheDocument();
  });
}); 