/**
 * @file authUtils.ts
 * @description Utilitaires d'authentification pour accès non-React
 * 
 * Ce module fournit des fonctions utilitaires pour accéder à l'état d'authentification
 * en dehors des composants React, par exemple dans les services, intercepteurs API, etc.
 */

import { Auth0Client } from '@auth0/auth0-spa-js';

// Auth0Client singleton pour utilisation en dehors des composants React
let auth0Client: Auth0Client | null = null;

// Configuration Auth0 directement depuis les variables d'environnement
// pour éviter la dépendance circulaire avec AuthCore
const getAuth0Config = () => ({
  domain: process.env.REACT_APP_AUTH0_ISSUER_BASE_URL || process.env.AUTH0_ISSUER_BASE_URL || '',
  clientId: process.env.REACT_APP_AUTH0_CLIENT_ID || process.env.AUTH0_CLIENT_ID || '',
  authorizationParams: {
    redirect_uri: window.location.origin,
    audience: process.env.REACT_APP_AUTH0_AUDIENCE || process.env.AUTH0_AUDIENCE,
    scope: process.env.REACT_APP_AUTH0_SCOPE || process.env.AUTH0_SCOPE || 'openid profile email'
  }
});

// Initialisation du client Auth0 pour les utilisations non-React
const getAuth0Client = (): Auth0Client => {
  if (!auth0Client) {
    const config = getAuth0Config();
    auth0Client = new Auth0Client({
      domain: config.domain,
      clientId: config.clientId,
      authorizationParams: config.authorizationParams,
    });
  }
  return auth0Client;
};

/**
 * Vérifie si un utilisateur est actuellement authentifié
 * Méthode sécurisée utilisable en dehors des composants React
 * @returns {Promise<boolean>} True si l'utilisateur est authentifié
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const client = getAuth0Client();
    return await client.isAuthenticated();
  } catch (error) {
    console.error('[AUTH] Error checking authentication status:', error);
    return false;
  }
};

/**
 * Récupère l'ID de l'utilisateur actuellement authentifié
 * @returns {Promise<string|null>} ID de l'utilisateur ou null
 */
export const getUserId = async (): Promise<string | null> => {
  try {
    const client = getAuth0Client();
    if (!(await client.isAuthenticated())) {
      return null;
    }
    
    const user = await client.getUser();
    return user?.sub || null;
  } catch (error) {
    console.error('[AUTH] Error getting user ID:', error);
    return null;
  }
};

/**
 * Vérifie si l'utilisateur authentifié a un rôle spécifique
 * @param {string} role - Rôle à vérifier (ex: 'admin')
 * @returns {Promise<boolean>} True si l'utilisateur a le rôle spécifié
 */
export const hasRole = async (role: string): Promise<boolean> => {
  try {
    const client = getAuth0Client();
    if (!(await client.isAuthenticated())) {
      return false;
    }
    
    const user = await client.getUser();
    // Vérifier si le rôle existe dans les permissions de l'utilisateur
    // Adapter cette logique à votre implémentation spécifique des rôles
    const roles = user?.['https://velo-altitude.com/roles'] || [];
    return Array.isArray(roles) && roles.includes(role);
  } catch (error) {
    console.error(`[AUTH] Error checking role ${role}:`, error);
    return false;
  }
};

/**
 * Obtient un token d'accès pour les appels API
 * @returns {Promise<string|null>} Token d'accès ou null
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    const client = getAuth0Client();
    return await client.getTokenSilently();
  } catch (error) {
    console.error('[AUTH] Error getting access token:', error);
    return null;
  }
};

/**
 * Déconnecte l'utilisateur actuel
 */
export const logout = async (): Promise<void> => {
  try {
    const client = getAuth0Client();
    await client.logout({ 
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  } catch (error) {
    console.error('[AUTH] Error during logout:', error);
  }
};

// Créer un objet d'exportation pour les fonctions principales
const authUtils = {
  isAuthenticated,
  getUserId,
  hasRole,
  getAccessToken,
  logout
};

// Exporter les fonctions principales
export default authUtils;
