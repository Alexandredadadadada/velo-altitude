import React, { createContext, useContext, useState, useEffect } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';

// Créer une instance unique de contexte d'authentification
const AuthContext = createContext(null);

/**
 * Fonction pour obtenir la configuration Auth0
 * Prend en charge à la fois les variables d'environnement standard et React
 */
export const getAuth0Config = () => ({
  domain: process.env.REACT_APP_AUTH0_ISSUER_BASE_URL || process.env.AUTH0_ISSUER_BASE_URL,
  clientId: process.env.REACT_APP_AUTH0_CLIENT_ID || process.env.AUTH0_CLIENT_ID,
  authorizationParams: {
    redirect_uri: window.location.origin,
    audience: process.env.REACT_APP_AUTH0_AUDIENCE || process.env.AUTH0_AUDIENCE,
    scope: process.env.REACT_APP_AUTH0_SCOPE || process.env.AUTH0_SCOPE
  }
});

/**
 * Fonction de secours pour l'authentification d'urgence
 * Utilisée lorsque l'authentification Auth0 échoue
 */
const getEmergencyAuth = () => {
  // Récupérer l'utilisateur du stockage local
  const getUser = () => {
    try {
      const emergencyUser = localStorage.getItem('velo_user');
      const standardUser = localStorage.getItem('velo_altitude_user');
      return emergencyUser ? JSON.parse(emergencyUser) : 
             standardUser ? JSON.parse(standardUser) : null;
    } catch (e) {
      console.error("[AUTH] Erreur lors de la récupération de l'utilisateur:", e);
      return null;
    }
  };
  
  const user = getUser();
  
  return {
    currentUser: user,
    user: user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    loading: false,
    login: async (credentials) => {
      if (credentials) {
        try {
          // Dans une vraie application, ceci serait un appel API
          const newUser = {
            id: 'user-' + Date.now(),
            name: credentials.name || credentials.email || 'Utilisateur Vélo-Altitude',
            email: credentials.email || 'cycliste@velo-altitude.fr',
            role: credentials.email?.includes('admin') ? 'admin' : 'user',
            preferences: { theme: 'light', language: 'fr' },
            profile: { weight: 75, height: 180, ftp: 250 }
          };
          
          // Stocker dans les deux emplacements pour compatibilité
          localStorage.setItem('velo_altitude_user', JSON.stringify(newUser));
          localStorage.setItem('velo_user', JSON.stringify(newUser));
          
          return { success: true, user: newUser };
        } catch (error) {
          console.error('[AUTH] Erreur de connexion (mode d\'urgence):', error);
          return { success: false, error: error.message };
        }
      } else {
        // Redirection vers la page d'urgence si pas de credentials
        window.location.href = '/emergency-login.html';
        return { success: false, redirected: true };
      }
    },
    logout: () => {
      try {
        // Supprimer des deux emplacements
        localStorage.removeItem('velo_altitude_user');
        localStorage.removeItem('velo_user');
        window.location.href = '/';
        return { success: true };
      } catch (error) {
        console.error('[AUTH] Erreur de déconnexion (mode d\'urgence):', error);
        return { success: false, error: error.message };
      }
    },
    updateUserProfile: (data) => {
      try {
        const currentUser = getUser();
        if (!currentUser) {
          return { success: false, error: 'Non authentifié', user: null };
        }
        
        const updatedUser = { ...currentUser, ...data };
        
        // Mettre à jour dans les deux emplacements
        localStorage.setItem('velo_altitude_user', JSON.stringify(updatedUser));
        localStorage.setItem('velo_user', JSON.stringify(updatedUser));
        
        return { success: true, user: updatedUser };
      } catch (error) {
        console.error('[AUTH] Erreur de mise à jour du profil (mode d\'urgence):', error);
        return { success: false, error: error.message, user: null };
      }
    },
    getToken: () => 'emergency-token-' + Date.now()
  };
};

/**
 * Hook combiné qui fonctionne avec Auth0 ou le mode d'urgence
 */
export const useAuth = () => {
  // Tenter d'utiliser Auth0 si disponible
  try {
    const auth0 = useAuth0();
    
    // Vérifier si Auth0 est correctement initialisé et l'utilisateur est authentifié
    if (auth0 && !auth0.isLoading) {
      if (auth0.isAuthenticated && auth0.user) {
        return {
          currentUser: auth0.user,
          user: auth0.user,
          isAuthenticated: auth0.isAuthenticated,
          isAdmin: auth0.user?.['https://velo-altitude.com/roles']?.includes('admin'),
          loading: auth0.isLoading,
          error: auth0.error,
          login: auth0.loginWithRedirect,
          logout: () => auth0.logout({ returnTo: window.location.origin }),
          getToken: auth0.getAccessTokenSilently,
          updateUserProfile: async (data) => {
            // Dans un système réel, on mettrait à jour le profil utilisateur via l'API
            console.log('[AUTH] Mise à jour du profil utilisateur (mode Auth0):', data);
            return { success: true, user: { ...auth0.user, ...data } };
          }
        };
      } else if (!auth0.isLoading) {
        // L'utilisateur n'est pas authentifié mais Auth0 fonctionne
        return {
          currentUser: null,
          user: null,
          isAuthenticated: false,
          isAdmin: false,
          loading: auth0.isLoading,
          error: auth0.error,
          login: auth0.loginWithRedirect,
          logout: () => auth0.logout({ returnTo: window.location.origin }),
          getToken: auth0.getAccessTokenSilently,
          updateUserProfile: async () => ({ success: false, error: 'Non authentifié', user: null })
        };
      }
    }
  } catch (error) {
    console.warn('[AUTH] Auth0 non disponible, utilisation du mode de secours:', error);
  }
  
  // Fallback au stockage local (mode d'urgence)
  return getEmergencyAuth();
};

/**
 * Fournisseur de contexte d'authentification principal
 * Version révisée pour supporter Auth0 et le mode d'urgence
 */
export const AuthProvider = ({ children }) => {
  // Vérification si Auth0 est configuré
  const auth0Config = getAuth0Config();
  const isAuth0Configured = !!auth0Config.clientId && !!auth0Config.domain;
  
  // Provider conditionnel
  if (isAuth0Configured) {
    return (
      <Auth0Provider {...auth0Config}>
        <InternalAuthProvider>
          {children}
        </InternalAuthProvider>
      </Auth0Provider>
    );
  } else {
    // Provider de secours pour le mode d'urgence
    return (
      <InternalAuthProvider>
        {children}
      </InternalAuthProvider>
    );
  }
};

/**
 * Provider interne qui gère l'état local et la synchronisation
 */
const InternalAuthProvider = ({ children }) => {
  const auth = useAuth();
  const [state, setState] = useState({
    currentUser: null,
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    loading: true,
    error: null
  });

  // Synchroniser l'état avec l'authentification
  useEffect(() => {
    setState({
      currentUser: auth.currentUser,
      user: auth.user,
      isAuthenticated: auth.isAuthenticated,
      isAdmin: auth.isAdmin,
      loading: auth.loading,
      error: auth.error
    });
  }, [auth.isAuthenticated, auth.user, auth.loading, auth.error]);

  // Valeur complète du contexte
  const authValue = {
    ...state,
    login: auth.login,
    logout: auth.logout,
    updateUserProfile: auth.updateUserProfile,
    getToken: auth.getToken
  };

  return (
    <AuthContext.Provider value={authValue}>
      {!state.loading ? children : <div>Chargement de l'authentification...</div>}
    </AuthContext.Provider>
  );
};

/**
 * Hook sécurisé pour accéder au contexte d'authentification
 * Fournit un fallback automatique si utilisé hors contexte
 */
export const useSafeAuth = () => {
  try {
    const context = useContext(AuthContext);
    
    // Si le contexte est indéfini, on fournit des valeurs par défaut et on log un avertissement
    if (context === undefined) {
      console.warn('[AUTH] useSafeAuth appelé en dehors d\'un AuthProvider - fallback activé');
      return getEmergencyAuth();
    }
    
    return context;
  } catch (error) {
    console.error('[AUTH] Erreur dans useSafeAuth:', error);
    return getEmergencyAuth();
  }
};

// Export du contexte pour les tests et cas avancés
export { AuthContext };

// Export unique pour éviter les dépendances circulaires
export default { AuthProvider, useAuth, useSafeAuth, AuthContext };
