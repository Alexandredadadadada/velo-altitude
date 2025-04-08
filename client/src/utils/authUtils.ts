/**
 * @file Utilitaires d'authentification pour Velo-Altitude
 * @description Fournit une API unifiée pour l'authentification, utilisant Auth0 comme 
 * mécanisme principal d'authentification.
 * 
 * Cette implémentation utilise le SDK Auth0 officiel pour toutes les opérations
 * d'authentification, offrant une interface cohérente et sécurisée.
 *
 * @module authUtils
 * @version 4.0.0
 */

import { useAuth0 } from '@auth0/auth0-react';
import { useSafeAuth } from '../auth';

// Mécanisme de mise en cache des tokens pour optimiser les performances
let cachedToken: string | null = null;
let tokenExpiration: number | null = null;
const TOKEN_EXPIRY_BUFFER = 60 * 1000; // 1 minute de buffer avant expiration réelle

/**
 * Récupère le token d'authentification via le SDK Auth0
 * Utilise un mécanisme de cache pour éviter les appels fréquents à getAccessTokenSilently
 * 
 * @returns {Promise<string | null>} Le token d'authentification ou null si non authentifié
 */
export const getToken = async (): Promise<string | null> => {
  try {
    // Si nous avons un token en cache qui n'est pas expiré, l'utiliser
    if (cachedToken && tokenExpiration && Date.now() < tokenExpiration - TOKEN_EXPIRY_BUFFER) {
      return cachedToken;
    }

    // Utiliser le SDK Auth0 via le système d'authentification unifié
    const auth = useSafeAuth();
    
    if (!auth || !auth.isAuthenticated) {
      console.warn('[AUTH] Tentative de récupération du token sans authentification');
      clearToken(); // Nettoyage par sécurité
      return null;
    }

    // Utiliser getToken qui appelle getAccessTokenSilently d'Auth0
    const token = await auth.getToken();
    
    if (token) {
      // Mettre en cache le token et calculer l'expiration
      cachedToken = token;
      const decoded = decodeToken(token);
      tokenExpiration = decoded?.exp ? decoded.exp * 1000 : Date.now() + 3600 * 1000;
    }
    
    return token;
  } catch (error) {
    console.error('[AUTH] Erreur lors de la récupération du token:', error);
    return null;
  }
};

/**
 * Sauvegarde le token d'authentification dans le cache temporaire
 * Note: Le stockage durable est géré par Auth0
 * 
 * @param {string} token - Le token JWT à sauvegarder
 */
export const setToken = (token: string): void => {
  if (!token) return;
  
  cachedToken = token;
  const decoded = decodeToken(token);
  tokenExpiration = decoded?.exp ? decoded.exp * 1000 : Date.now() + 3600 * 1000;
};

/**
 * Supprime le token d'authentification du cache temporaire
 * Utilisé lors de la déconnexion ou lorsque le token devient invalide
 */
export const clearToken = (): void => {
  cachedToken = null;
  tokenExpiration = null;
};

/**
 * Vérifie si un utilisateur est actuellement authentifié
 * Utilise le système d'authentification Auth0
 * 
 * @returns {boolean} true si l'utilisateur est authentifié, false sinon
 */
export const isAuthenticated = (): boolean => {
  try {
    const auth = useSafeAuth();
    return !!auth?.isAuthenticated;
  } catch (error) {
    console.error('[AUTH] Erreur lors de la vérification d\'authentification:', error);
    return false;
  }
};

/**
 * Récupère l'ID de l'utilisateur authentifié
 * Compatible avec le format Auth0 (sub)
 * 
 * @returns {string | null} ID de l'utilisateur ou null si non authentifié
 */
export const getUserId = (): string | null => {
  try {
    const auth = useSafeAuth();
    return auth?.currentUser?.sub || null;
  } catch (error) {
    console.error('[AUTH] Erreur lors de la récupération de l\'ID utilisateur:', error);
    return null;
  }
};

/**
 * Récupère les données de l'utilisateur du système d'authentification
 * 
 * @returns {any | null} Données complètes de l'utilisateur ou null si non authentifié
 */
export const getUserData = (): any | null => {
  try {
    const auth = useSafeAuth();
    return auth?.currentUser || null;
  } catch (error) {
    console.error('[AUTH] Erreur lors de la récupération des données utilisateur:', error);
    return null;
  }
};

/**
 * Effectue la déconnexion de l'utilisateur
 * Utilise la méthode logout du SDK Auth0
 */
export const logout = (): void => {
  try {
    const auth = useSafeAuth();
    if (auth?.logout) {
      auth.logout();
    }
    clearToken();
  } catch (error) {
    console.error('[AUTH] Erreur lors de la déconnexion:', error);
    // En cas d'erreur, rediriger vers la page d'accueil
    window.location.href = '/';
  }
};

/**
 * Décode un token JWT sans dépendance externe
 * Implémentation légère permettant d'extraire les informations du payload JWT
 * 
 * @param {string} token - Token JWT à décoder
 * @returns {any | null} Contenu décodé du token ou null en cas d'erreur
 */
export const decodeToken = (token: string): any | null => {
  try {
    // JWT est composé de 3 parties séparées par des points: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Décoder la partie payload (deuxième partie)
    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('[AUTH] Erreur lors du décodage du token:', error);
    return null;
  }
};

/**
 * Vérifie si un token est expiré en analysant sa date d'expiration
 * 
 * @param {string} token - Token JWT à vérifier
 * @returns {boolean} true si le token est expiré, false sinon
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }

  // La date d'expiration est en secondes depuis l'époque Unix
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

export default {
  getToken,
  setToken,
  clearToken,
  isAuthenticated,
  getUserId,
  getUserData,
  logout,
  decodeToken,
  isTokenExpired
};
