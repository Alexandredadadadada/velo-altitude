/**
 * Contexte d'authentification pour l'application
 * Fournit des fonctionnalités d'authentification à l'ensemble de l'application
 */

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import enhancedAuthClient from '../services/enhancedAuthClient';
import AuthErrorHandler from '../components/auth/AuthErrorHandler';

// Création du contexte
const AuthContext = createContext(null);

/**
 * Fournisseur du contexte d'authentification
 * @param {Object} props Props du composant
 * @param {React.ReactNode} props.children Enfants du composant
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fonction pour charger le profil utilisateur
  const loadUserProfile = useCallback(async () => {
    try {
      const userInfo = await enhancedAuthClient.getUserInfo();
      setCurrentUser(userInfo);
      return userInfo;
    } catch (err) {
      console.error('Erreur lors du chargement du profil utilisateur:', err);
      setCurrentUser(null);
      return null;
    }
  }, []);

  // Vérifier l'état d'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const isAuthenticated = await enhancedAuthClient.isAuthenticated();
        
        if (isAuthenticated) {
          await loadUserProfile();
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de l\'authentification:', err);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [loadUserProfile]);

  // Gérer les événements d'authentification
  useEffect(() => {
    const handleSessionExpired = () => {
      setCurrentUser(null);
      setError({
        code: 'session_expired',
        message: 'Votre session a expiré. Veuillez vous reconnecter.'
      });
    };

    const handleTokenRevoked = () => {
      setCurrentUser(null);
      setError({
        code: 'token_revoked',
        message: 'Votre session a été révoquée. Veuillez vous reconnecter.'
      });
    };

    const handleAuthError = (event) => {
      setError(event.detail);
    };

    // S'abonner aux événements
    window.addEventListener('auth:session-expired', handleSessionExpired);
    window.addEventListener('auth:token-revoked', handleTokenRevoked);
    window.addEventListener('auth:error', handleAuthError);

    // Se désabonner à la destruction
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
      window.removeEventListener('auth:token-revoked', handleTokenRevoked);
      window.removeEventListener('auth:error', handleAuthError);
    };
  }, [navigate]);

  // Fonction de connexion
  const login = async (credentials) => {
    setLoading(true);
    try {
      const user = await enhancedAuthClient.login(credentials);
      setCurrentUser(user);
      return user;
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError({
        code: err.code || 'auth_error',
        message: err.message || 'Erreur lors de la connexion'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = async (revokeAll = false) => {
    setLoading(true);
    try {
      await enhancedAuthClient.logout(revokeAll);
      setCurrentUser(null);
      navigate('/login');
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour obtenir un fetch authentifié
  const getAuthFetch = useCallback(async () => {
    try {
      return await enhancedAuthClient.getAuthenticatedFetch();
    } catch (err) {
      console.error('Erreur lors de la récupération du fetch authentifié:', err);
      if (err.code === 'no_token') {
        setCurrentUser(null);
      }
      throw err;
    }
  }, []);

  // Fermeture du dialogue d'erreur
  const handleErrorClose = () => {
    setError(null);
  };

  // Gestionnaire d'action d'erreur
  const handleErrorAction = (action) => {
    setError(null);
    
    switch (action) {
      case 'login':
        navigate('/login');
        break;
      case 'manage_devices':
        navigate('/account/devices');
        break;
      default:
        // Autres actions
        break;
    }
  };

  // Valeurs exposées par le contexte
  const contextValue = {
    currentUser,
    loading,
    isAuthenticated: !!currentUser,
    login,
    logout,
    getAuthFetch,
    loadUserProfile,
    error
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      
      {/* Gestionnaire d'erreurs d'authentification */}
      {error && (
        <AuthErrorHandler
          errorCode={error.code}
          errorMessage={error.message}
          open={!!error}
          onClose={handleErrorClose}
          onAction={handleErrorAction}
          useSnackbar={error.code === 'token_expired'} // Utiliser snackbar pour les erreurs moins critiques
        />
      )}
    </AuthContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte d'authentification
 * @returns {Object} Contexte d'authentification
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Si le contexte n'est pas disponible, fournir un contexte par défaut
  // au lieu de lancer une erreur, pour plus de résilience
  if (!context) {
    console.warn('useAuth utilisé en dehors d\'un AuthProvider - utilisation d\'un contexte par défaut');
    
    // Retourner un contexte par défaut pour éviter les erreurs
    return {
      currentUser: null,
      loading: false,
      isAuthenticated: false,
      login: () => Promise.reject(new Error('Non disponible - AuthProvider manquant')),
      logout: () => Promise.resolve(),
      getAuthFetch: () => Promise.reject(new Error('Non disponible - AuthProvider manquant')),
      loadUserProfile: () => Promise.reject(new Error('Non disponible - AuthProvider manquant')),
      error: null
    };
  }
  
  return context;
};

export default AuthContext;
