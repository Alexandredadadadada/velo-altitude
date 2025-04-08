/**
 * Tests pour l'authentification Auth0
 * 
 * Ce fichier contient des tests pour vérifier le flux d'authentification avec Auth0
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '../../features/auth/authContext';
import { AuthProvider } from '../../features/auth/authContext';
import { Auth0Provider } from '@auth0/auth0-react';
import React from 'react';

// Mocks pour Auth0
jest.mock('@auth0/auth0-react', () => ({
  Auth0Provider: ({ children }: { children: React.ReactNode }) => children,
  useAuth0: () => ({
    isAuthenticated: true,
    user: {
      sub: 'auth0|123456789',
      name: 'Test User',
      email: 'test@example.com',
      picture: 'https://example.com/profile.jpg',
      email_verified: true,
      updated_at: '2025-04-08T12:00:00.000Z',
      'https://velo-altitude.com/roles': ['user'],
      'https://velo-altitude.com/permissions': ['read:profile']
    },
    isLoading: false,
    getAccessTokenSilently: jest.fn().mockResolvedValue('mock-token'),
    loginWithRedirect: jest.fn(),
    logout: jest.fn(),
    error: null
  })
}));

// Mock pour le service de monitoring
jest.mock('../../monitoring', () => ({
  __esModule: true,
  default: {
    trackEvent: jest.fn(),
    trackError: jest.fn()
  }
}));

// Wrapper pour les tests
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Auth0Provider
    domain="test.auth0.com"
    clientId="test-client-id"
    authorizationParams={{ redirect_uri: window.location.origin }}
  >
    <AuthProvider>{children}</AuthProvider>
  </Auth0Provider>
);

describe('Auth Context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('should provide authentication state from Auth0', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.user).toEqual(expect.objectContaining({
      sub: 'auth0|123456789',
      name: 'Test User'
    }));
  });

  test('should get access token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    let token;
    await act(async () => {
      token = await result.current.getAccessToken();
    });

    expect(token).toBe('mock-token');
  });

  test('should check permissions correctly', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasPermission('read:profile')).toBe(true);
    expect(result.current.hasPermission('write:profile')).toBe(false);
  });

  test('should check roles correctly', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasRole('user')).toBe(true);
    expect(result.current.hasRole('admin')).toBe(false);
  });

  test('should call login method from Auth0', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    act(() => {
      result.current.login();
    });

    // Verify the Auth0 loginWithRedirect was called
    expect(require('@auth0/auth0-react').useAuth0().loginWithRedirect).toHaveBeenCalled();
  });

  test('should call logout method from Auth0', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    act(() => {
      result.current.logout();
    });

    // Verify the Auth0 logout was called
    expect(require('@auth0/auth0-react').useAuth0().logout).toHaveBeenCalled();
  });
});
