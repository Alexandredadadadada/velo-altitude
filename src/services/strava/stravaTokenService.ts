/**
 * Service de gestion des tokens Strava
 * 
 * Ce service gère l'authentification et le rafraîchissement des tokens Strava
 * avec une gestion d'erreur robuste.
 */

import axios from 'axios';

// Types pour les tokens Strava
interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

/**
 * Rafraîchit le token Strava
 * Implémente une gestion d'erreur robuste et des événements de notification
 * @returns Les nouveaux tokens
 */
export const refreshStravaToken = async (): Promise<StravaTokens> => {
  try {
    const refreshToken = localStorage.getItem('strava_refresh_token');
    if (!refreshToken) {
      const error = new Error('No refresh token available');
      // Signaler la nécessité d'une réauthentification
      dispatchEvent(new CustomEvent('strava-reauth-needed'));
      throw error;
    }
    
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });
    
    // Stockage des nouveaux tokens
    localStorage.setItem('strava_access_token', response.data.access_token);
    localStorage.setItem('strava_refresh_token', response.data.refresh_token);
    localStorage.setItem('strava_token_expiry', response.data.expires_at.toString());
    
    return response.data;
  } catch (error) {
    // Gestion appropriée des erreurs
    console.error('Strava token refresh failed:', error);
    
    // Signaler la nécessité d'une réauthentification
    dispatchEvent(new CustomEvent('strava-reauth-needed'));
    throw error;
  }
};

/**
 * Vérifie si le token actuel est valide et le rafraîchit si nécessaire
 * @returns Token d'accès valide
 */
export const getValidAccessToken = async (): Promise<string> => {
  const accessToken = localStorage.getItem('strava_access_token');
  const tokenExpiry = parseInt(localStorage.getItem('strava_token_expiry') || '0', 10);
  
  // Vérifier si le token existe et n'a pas expiré (avec une marge de 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  const tokenValid = accessToken && tokenExpiry > now + 300;
  
  if (tokenValid) {
    return accessToken!;
  }
  
  // Rafraîchir le token s'il a expiré
  try {
    const tokens = await refreshStravaToken();
    return tokens.access_token;
  } catch (error) {
    console.error('Failed to get valid Strava access token:', error);
    throw error;
  }
};

/**
 * Initialise le processus d'authentification Strava via OAuth
 */
export const initiateStravaAuth = (): void => {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = `${window.location.origin}/strava-callback`;
  const scope = 'read,activity:read,profile:read_all';
  
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}`;
  
  window.location.href = authUrl;
};

/**
 * Traite le code d'autorisation reçu après le consentement OAuth
 * @param code Code d'autorisation reçu du flux OAuth
 * @returns Tokens d'accès et de rafraîchissement
 */
export const processAuthorizationCode = async (code: string): Promise<StravaTokens> => {
  try {
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code'
    });
    
    // Stockage des tokens
    localStorage.setItem('strava_access_token', response.data.access_token);
    localStorage.setItem('strava_refresh_token', response.data.refresh_token);
    localStorage.setItem('strava_token_expiry', response.data.expires_at.toString());
    
    return response.data;
  } catch (error) {
    console.error('Error processing Strava authorization code:', error);
    throw error;
  }
};

/**
 * Configure un écouteur d'événement pour détecter la nécessité de réauthentification
 * @param callback Fonction à appeler en cas de nécessité de réauthentification
 */
export const setupReauthListener = (callback: () => void): () => void => {
  const handler = () => callback();
  window.addEventListener('strava-reauth-needed', handler);
  
  // Retourner une fonction de nettoyage
  return () => window.removeEventListener('strava-reauth-needed', handler);
};

export default {
  refreshStravaToken,
  getValidAccessToken,
  initiateStravaAuth,
  processAuthorizationCode,
  setupReauthListener
};
