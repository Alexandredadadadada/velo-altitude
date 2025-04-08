/**
 * @file apiConfig.test.ts
 * @description Tests for the API configuration and interceptors
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import api from './apiConfig';
import * as authCore from '../auth/AuthCore';

// Mock the Auth0 token functions
jest.mock('../auth/AuthCore', () => ({
  getAuthToken: jest.fn(),
  refreshAuthToken: jest.fn()
}));

describe('API Configuration', () => {
  let mockAxios: MockAdapter;
  
  beforeEach(() => {
    mockAxios = new MockAdapter(api);
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    mockAxios.restore();
  });

  describe('Request Interceptor', () => {
    it('should add authorization header when token is available', async () => {
      // Mock the auth token
      (authCore.getAuthToken as jest.Mock).mockResolvedValueOnce('test-token');
      
      // Setup a mock endpoint
      mockAxios.onGet('/test').reply(config => {
        // Check if Authorization header was properly set
        expect(config.headers?.Authorization).toBe('Bearer test-token');
        return [200, { success: true }];
      });
      
      // Make request
      await api.get('/test');
      
      // Verify getAuthToken was called
      expect(authCore.getAuthToken).toHaveBeenCalledTimes(1);
    });
    
    it('should continue without authorization header when token is unavailable', async () => {
      // Mock the auth token as null (user not authenticated)
      (authCore.getAuthToken as jest.Mock).mockResolvedValueOnce(null);
      
      // Setup a mock endpoint
      mockAxios.onGet('/test-no-auth').reply(config => {
        // Check that Authorization header is not set
        expect(config.headers?.Authorization).toBeUndefined();
        return [200, { success: true }];
      });
      
      // Make request
      await api.get('/test-no-auth');
      
      // Verify getAuthToken was called
      expect(authCore.getAuthToken).toHaveBeenCalledTimes(1);
    });
    
    it('should handle errors when getting the token', async () => {
      // Mock the auth token function to throw an error
      (authCore.getAuthToken as jest.Mock).mockRejectedValueOnce(new Error('Token error'));
      
      // Setup a mock endpoint
      mockAxios.onGet('/test-error').reply(config => {
        // Should continue without token
        expect(config.headers?.Authorization).toBeUndefined();
        return [200, { success: true }];
      });
      
      // Should not throw an error
      await expect(api.get('/test-error')).resolves.toBeDefined();
      
      // Verify getAuthToken was called
      expect(authCore.getAuthToken).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Response Interceptor', () => {
    it('should handle 401 errors by refreshing token and retrying', async () => {
      // First request will return 401, second will succeed
      let attemptCount = 0;
      
      // Setup the auth tokens
      (authCore.getAuthToken as jest.Mock).mockResolvedValueOnce('old-token');
      (authCore.refreshAuthToken as jest.Mock).mockResolvedValueOnce('new-token');
      
      // Setup the mock endpoint
      mockAxios.onGet('/protected').reply(config => {
        attemptCount++;
        
        if (attemptCount === 1) {
          // First attempt with old token fails
          expect(config.headers?.Authorization).toBe('Bearer old-token');
          return [401, { error: 'Unauthorized' }];
        } else {
          // Second attempt with new token succeeds
          expect(config.headers?.Authorization).toBe('Bearer new-token');
          return [200, { success: true }];
        }
      });
      
      // Make the request
      const response = await api.get('/protected');
      
      // Should succeed on second attempt
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ success: true });
      
      // Verify the token was refreshed
      expect(authCore.refreshAuthToken).toHaveBeenCalledTimes(1);
      expect(attemptCount).toBe(2);
    });
    
    it('should handle refresh token failure', async () => {
      // Setup the auth tokens
      (authCore.getAuthToken as jest.Mock).mockResolvedValueOnce('expired-token');
      (authCore.refreshAuthToken as jest.Mock).mockRejectedValueOnce(new Error('Refresh failed'));
      
      // Setup mock endpoint
      mockAxios.onGet('/refresh-fails').reply(401);
      
      // Request should fail
      await expect(api.get('/refresh-fails')).rejects.toBeDefined();
      
      // Verify the refresh was attempted
      expect(authCore.refreshAuthToken).toHaveBeenCalledTimes(1);
    });
  });
});
