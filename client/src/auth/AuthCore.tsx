/**
 * @file AuthCore.tsx
 * @description Système d'authentification pour Velo-Altitude basé sur Auth0
 * 
 * Ce module fournit un système d'authentification robuste utilisant Auth0 comme
 * mécanisme principal d'authentification, avec une API React simple et claire.
 * 
 * @version 7.0.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Auth0Provider, useAuth0, User } from '@auth0/auth0-react';
import authUtils from './authUtils';

/**
 * Interface de l'utilisateur authentifié
 */
export interface AuthUser {
  // Propriétés standard Auth0
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
  // Propriétés spécifiques à Velo-Altitude
  role?: string;
  preferences?: Record<string, any>;
  // Profil étendu pour notre application
  userProfile?: Record<string, any>;
  // Autres propriétés dynamiques
  [key: string]: any;
}

/**
 * Interface du contexte d'authentification
 */
export interface AuthContextType {
  currentUser: AuthUser | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: Error | null;
  login: () => void;
  logout: () => void;
  updateUserProfile: (data: Partial<AuthUser>) => Promise<any>;
  getToken: () => Promise<string | null>;
}

// Création du contexte d'authentification
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Obtient la configuration Auth0 depuis les variables d'environnement
 */
export const getAuth0Config = () => ({
  domain: process.env.REACT_APP_AUTH0_ISSUER_BASE_URL || process.env.AUTH0_ISSUER_BASE_URL || '',
  clientId: process.env.REACT_APP_AUTH0_CLIENT_ID || process.env.AUTH0_CLIENT_ID || '',
  authorizationParams: {
    redirect_uri: window.location.origin,
    audience: process.env.REACT_APP_AUTH0_AUDIENCE || process.env.AUTH0_AUDIENCE,
    scope: process.env.REACT_APP_AUTH0_SCOPE || process.env.AUTH0_SCOPE || 'openid profile email'
  }
});

/**
 * Vérifier si l'utilisateur a un rôle spécifique en utilisant les claims Auth0
 * @param user Utilisateur Auth0
 * @param role Rôle à vérifier
 * @returns boolean indiquant si l'utilisateur a le rôle
 */
const hasRole = (user: User | undefined, role: string): boolean => {
  if (!user) return false;
  
  // Vérifier dans les permissions Auth0 standard
  // https://auth0.com/docs/manage-users/access-control/sample-use-cases-rbac
  const roles = user['https://velo-altitude.com/roles'] || [];
  if (Array.isArray(roles) && roles.includes(role)) {
    return true;
  }
  
  // Fallback pour la méthode actuelle basée sur l'email (à enlever après migration complète)
  if (role === 'admin' && user.email?.includes('admin')) {
    return true;
  }
  
  return false;
};

/**
 * Hook principal d'authentification basé sur Auth0
 */
export const useAuth = (): AuthContextType => {
  const auth0 = useAuth0();
  
  // Vérifier si nous sommes en mode développement avec Auth0 simulé
  const isDevelopmentMode = process.env.NODE_ENV === 'development' && 
                          process.env.REACT_APP_AUTH0_DEV_MODE === 'true';

  // Si en mode développement et que l'utilisateur n'est pas authentifié
  if (isDevelopmentMode) {
    console.log('[AUTH] Mode développement Auth0 activé');
    
    // Créer un utilisateur de test à partir des variables d'environnement
    const devUser = process.env.REACT_APP_AUTH0_DEV_USER 
      ? JSON.parse(process.env.REACT_APP_AUTH0_DEV_USER)
      : {
          sub: "auth0|dev123456",
          name: "Utilisateur Test",
          email: "test@velo-altitude.com",
          role: "user"
        };
    
    // Simuler l'authentification
    return {
      currentUser: devUser,
      user: devUser,
      isAuthenticated: true,
      isAdmin: devUser.role === 'admin',
      loading: false,
      error: null,
      login: () => console.log('[AUTH DEV] Login simulé'),
      logout: () => console.log('[AUTH DEV] Logout simulé'),
      updateUserProfile: async (data) => {
        console.log('[AUTH DEV] Mise à jour du profil simulée:', data);
        return Promise.resolve(data);
      },
      getToken: async () => {
        console.log('[AUTH DEV] Token simulé généré');
        return 'dev-token-123456';
      }
    };
  }
  
  // Normaliser l'utilisateur Auth0 vers notre format interne
  const normalizeUser = (auth0User: User | undefined): AuthUser | null => {
    if (!auth0User) return null;
    
    // Déterminer le rôle en utilisant les claims Auth0
    const role = hasRole(auth0User, 'admin') ? 'admin' : 'user';
    
    return {
      ...auth0User,
      role
    };
  };
  
  const user = normalizeUser(auth0.user);
  const isAdmin = hasRole(auth0.user, 'admin');
  
  return {
    currentUser: user,
    user,
    isAuthenticated: auth0.isAuthenticated,
    isAdmin,
    loading: auth0.isLoading,
    error: auth0.error || null,
    login: auth0.loginWithRedirect,
    logout: () => auth0.logout({ 
      logoutParams: { returnTo: window.location.origin } 
    }),
    updateUserProfile: async (data: Partial<AuthUser>) => {
      // Cette fonction serait implémentée avec un appel API
      // pour mettre à jour le profil utilisateur dans votre backend
      console.log('[AUTH] Updating user profile with:', data);
      return Promise.resolve(data);
    },
    getToken: async () => {
      try {
        return await auth0.getAccessTokenSilently();
      } catch (error) {
        console.error('[AUTH] Error getting token:', error);
        return null;
      }
    }
  };
};

/**
 * Props du composant AuthProvider
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider d'authentification principal
 */
export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  // Vérification si Auth0 est configuré
  const auth0Config = getAuth0Config();
  const isAuth0Configured = !!auth0Config.clientId && !!auth0Config.domain;
  
  // Assurer que Auth0 est configuré
  if (!isAuth0Configured) {
    console.error('[AUTH] Auth0 is not properly configured. Check your environment variables.');
    return (
      <div className="auth-error">
        <h2>Erreur de configuration d'authentification</h2>
        <p>Le service d'authentification n'est pas correctement configuré.</p>
      </div>
    );
  }

  return (
    <Auth0Provider {...auth0Config}>
      <InternalAuthProvider>
        {children}
      </InternalAuthProvider>
    </Auth0Provider>
  );
};

/**
 * Provider interne qui gère l'état local et la synchronisation
 */
const InternalAuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const auth = useAuth();
  const [state, setState] = useState<Omit<AuthContextType, 'login' | 'logout' | 'updateUserProfile' | 'getToken'>>({
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
  }, [auth.isAuthenticated, auth.user, auth.loading, auth.error, auth.isAdmin, auth.currentUser]);

  // Valeur complète du contexte
  const authValue: AuthContextType = {
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
 */
export const useSafeAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined || context === null) {
    throw new Error('[AUTH] useSafeAuth doit être utilisé dans un AuthProvider');
  }
  
  return context;
};

// Réexporter les fonctions utilitaires d'authentification pour usage hors React
export const {
  getAccessToken,
  getUserId,
  hasRole: checkRole
} = authUtils;

// Export du contexte pour les tests et cas avancés
export { AuthContext };
