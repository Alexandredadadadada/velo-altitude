/**
 * Auth0 Configuration
 * 
 * This file contains the configuration needed for Auth0 integration.
 * Environment variables sont configurées dans Netlify pour le déploiement
 * (voir la documentation technique pour plus d'informations).
 */

// Auth0 configuration object
export const auth0Config = {
  // Auth0 domain - your tenant's domain
  domain: process.env.AUTH0_ISSUER_BASE_URL!.replace('https://', ''),
  
  // The identifier of your API in Auth0
  audience: process.env.AUTH0_AUDIENCE!,
  
  // Auth0 client ID of your application
  clientId: process.env.AUTH0_CLIENT_ID!,
  
  // Redirect URI after login
  redirectUri: `${process.env.AUTH0_BASE_URL}/callback`,
  
  // Redirect URI after logout
  logoutRedirectUri: `${process.env.AUTH0_BASE_URL}/`,
  
  // Requested scopes for tokens
  scope: process.env.AUTH0_SCOPE || 'openid profile email offline_access',
  
  // Session secret for cookie encryption
  secret: process.env.AUTH0_SECRET || '',
  
  // Logout configuration
  logoutParams: {
    returnTo: process.env.AUTH0_BASE_URL || 'http://localhost:3000'
  }
};

// Validate configuration
export const validateAuth0Config = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!auth0Config.domain) errors.push('AUTH0_ISSUER_BASE_URL is not set');
  if (!auth0Config.clientId) errors.push('AUTH0_CLIENT_ID is not set');
  if (!auth0Config.audience) errors.push('AUTH0_AUDIENCE is not set');
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Function to refresh token with error handling
export const refreshTokenWithErrorHandling = async (refreshToken: string) => {
  try {
    const response = await refreshAccessToken(refreshToken);
    return response;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Implement retry logic
    return await retryTokenRefresh(refreshToken, 3);
  }
};

// Helper function to refresh access token
const refreshAccessToken = async (refreshToken: string) => {
  const tokenEndpoint = `https://${auth0Config.domain}/oauth/token`;
  
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: auth0Config.clientId,
      refresh_token: refreshToken
    })
  });
  
  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }
  
  return await response.json();
};

// Retry logic for token refresh
const retryTokenRefresh = async (refreshToken: string, maxRetries: number) => {
  let retries = 0;
  let lastError;
  
  while (retries < maxRetries) {
    try {
      // Exponential backoff
      const delay = Math.pow(2, retries) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const response = await refreshAccessToken(refreshToken);
      return response;
    } catch (error) {
      lastError = error;
      retries++;
      console.warn(`Token refresh retry ${retries}/${maxRetries} failed`);
    }
  }
  
  throw lastError;
};

// URL helpers for Auth0
export const auth0Urls = {
  login: `/api/auth/login`,
  logout: `/api/auth/logout`,
  callback: `/api/auth/callback`,
  me: `/api/auth/me`
};

export default auth0Config;
