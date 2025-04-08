/**
 * @file Tests unitaires pour authUtils.ts
 * @description Tests des fonctions d'authentification utilisées dans l'application
 */

import * as authUtils from './authUtils';
import { AuthContextType } from '../auth/AuthCore';
import * as authHooks from '../auth'; // Import the auth hooks to mock

// Mock the auth hooks
jest.mock('../auth', () => ({
  useSafeAuth: jest.fn()
}));

describe('authUtils', () => {
  // Setup mock data
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
  const mockUser = {
    sub: '123456789',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user'
  };
  const mockAuthContext: Partial<AuthContextType> = {
    isAuthenticated: true,
    currentUser: mockUser,
    getToken: jest.fn().mockResolvedValue(mockToken)
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup the mock implementation for useSafeAuth
    (authHooks.useSafeAuth as jest.Mock).mockReturnValue(mockAuthContext);
  });

  describe('getToken', () => {
    it('should return token when authenticated', async () => {
      const token = await authUtils.getToken();
      expect(token).toBe(mockToken);
      expect(mockAuthContext.getToken).toHaveBeenCalled();
    });

    it('should return null when not authenticated', async () => {
      (authHooks.useSafeAuth as jest.Mock).mockReturnValue({
        ...mockAuthContext,
        isAuthenticated: false
      });
      
      const token = await authUtils.getToken();
      expect(token).toBeNull();
      expect(mockAuthContext.getToken).not.toHaveBeenCalled();
    });

    it('should use cached token if available and not expired', async () => {
      // First call to populate the cache
      await authUtils.getToken();
      
      // Second call should use cache
      await authUtils.getToken();
      
      // getToken should only be called once
      expect(mockAuthContext.getToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when authenticated', () => {
      const authenticated = authUtils.isAuthenticated();
      expect(authenticated).toBe(true);
    });

    it('should return false when not authenticated', () => {
      (authHooks.useSafeAuth as jest.Mock).mockReturnValue({
        ...mockAuthContext,
        isAuthenticated: false
      });
      
      const authenticated = authUtils.isAuthenticated();
      expect(authenticated).toBe(false);
    });
  });

  describe('getUserId', () => {
    it('should return user ID when authenticated', () => {
      const userId = authUtils.getUserId();
      expect(userId).toBe(mockUser.sub);
    });

    it('should return null when not authenticated', () => {
      (authHooks.useSafeAuth as jest.Mock).mockReturnValue({
        ...mockAuthContext,
        currentUser: null
      });
      
      const userId = authUtils.getUserId();
      expect(userId).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('should decode JWT token correctly', () => {
      const decoded = authUtils.decodeToken(mockToken);
      expect(decoded).toEqual({
        sub: '1234567890',
        name: 'John Doe',
        iat: 1516239022,
        exp: 9999999999
      });
    });

    it('should return null for invalid token', () => {
      const decoded = authUtils.decodeToken('invalid.token');
      expect(decoded).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      const expired = authUtils.isTokenExpired(mockToken);
      expect(expired).toBe(false);
    });

    it('should return true for expired token', () => {
      // Create an expired token (exp in the past)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9V8wFzzht-KQ';
      
      const expired = authUtils.isTokenExpired(expiredToken);
      expect(expired).toBe(true);
    });
  });
});
