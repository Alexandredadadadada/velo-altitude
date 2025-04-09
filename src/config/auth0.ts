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
  domain: process.env.AUTH0_ISSUER_BASE_URL?.replace(/^https?:\/\//, '') || '',
  
  // The identifier of your API in Auth0
  audience: process.env.AUTH0_AUDIENCE || '',
  
  // Auth0 client ID of your application
  clientId: process.env.AUTH0_CLIENT_ID || '',
  
  // Auth0 client secret
  clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
  
  // The base URL of your application
  baseUrl: process.env.AUTH0_BASE_URL || '',
  
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
  if (!auth0Config.clientSecret) errors.push('AUTH0_CLIENT_SECRET is not set');
  if (!auth0Config.audience) errors.push('AUTH0_AUDIENCE is not set');
  if (!auth0Config.secret) errors.push('AUTH0_SECRET is not set');
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// URL helpers for Auth0
export const auth0Urls = {
  login: `/api/auth/login`,
  logout: `/api/auth/logout`,
  callback: `/api/auth/callback`,
  me: `/api/auth/me`
};

export default auth0Config;
