/**
 * @file ProtectedRoute.test.tsx
 * @description Tests for the ProtectedRoute component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import * as AuthCore from './AuthCore';

// Mock the auth hook
jest.mock('./AuthCore', () => ({
  useAuth: jest.fn()
}));

// Mock LoadingSpinner component to simplify testing
jest.mock('../components/common/LoadingSpinner', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-spinner">Loading...</div>
}));

describe('ProtectedRoute', () => {
  const mockUseAuth = AuthCore.useAuth as jest.Mock;
  
  // Sample protected content
  const ProtectedContent = () => <div data-testid="protected-content">Protected Content</div>;
  
  // Helper function to render the component within a Router context
  const renderWithRouter = (
    isAuthenticated: boolean = false,
    loading: boolean = false,
    onUnauthorized: () => void = jest.fn()
  ) => {
    mockUseAuth.mockReturnValue({
      isAuthenticated,
      loading,
      user: isAuthenticated ? { name: 'Test User' } : null
    });

    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute redirectTo="/login" onUnauthorized={onUnauthorized}>
              <ProtectedContent />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        </Routes>
      </BrowserRouter>
    );
  };

  it('should show loading spinner when authentication is loading', () => {
    renderWithRouter(false, true);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  it('should redirect to login page when user is not authenticated', () => {
    renderWithRouter(false, false);
    
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('should render protected content when user is authenticated', () => {
    renderWithRouter(true, false);
    
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  it('should call onUnauthorized callback when not authenticated', () => {
    const onUnauthorizedMock = jest.fn();
    
    renderWithRouter(false, false, onUnauthorizedMock);
    
    expect(onUnauthorizedMock).toHaveBeenCalledTimes(1);
  });

  it('should not call onUnauthorized callback when authenticated', () => {
    const onUnauthorizedMock = jest.fn();
    
    renderWithRouter(true, false, onUnauthorizedMock);
    
    expect(onUnauthorizedMock).not.toHaveBeenCalled();
  });
});
