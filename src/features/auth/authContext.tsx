/**
 * Auth Context Provider
 * 
 * Provides authentication state and methods for the application
 * Integrates with Auth0 for secure authentication
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import monitoringService from '../../monitoring';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  error: string | null;
  token: string | null;
  login: () => void;
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

// Default context values
const defaultContext: AuthContextType = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  error: null,
  token: null,
  login: () => {},
  logout: () => {},
  getAccessToken: async () => null,
  hasPermission: () => false,
  hasRole: () => false,
};

// Create context
export const AuthContext = createContext<AuthContextType>(defaultContext);

// Hook for using auth context
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Use Auth0 hook
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    getAccessTokenSilently, 
    loginWithRedirect, 
    logout: auth0Logout,
    error: auth0Error 
  } = useAuth0();

  // Update token when authenticated
  useEffect(() => {
    const getToken = async () => {
      if (isAuthenticated) {
        try {
          const accessToken = await getAccessTokenSilently();
          setToken(accessToken);
          monitoringService.trackEvent('auth_token_acquired');
        } catch (err) {
          console.error('Error getting access token:', err);
          setError('Erreur d\'authentification. Veuillez réessayer.');
          monitoringService.trackError('auth_token_error', err as Error);
        }
      }
    };

    getToken();
  }, [isAuthenticated, getAccessTokenSilently]);

  // Handle Auth0 errors
  useEffect(() => {
    if (auth0Error) {
      setError(auth0Error.message);
      monitoringService.trackError('auth0_error', auth0Error);
    }
  }, [auth0Error]);

  // Login with Auth0
  const login = () => {
    loginWithRedirect({
      appState: {
        returnTo: window.location.pathname
      }
    });
    monitoringService.trackEvent('login_initiated');
  };

  // Logout with Auth0
  const performLogout = () => {
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
    setToken(null);
    monitoringService.trackEvent('logout_performed');
  };

  // Get access token (for API calls)
  const getAccessToken = async (): Promise<string | null> => {
    if (!isAuthenticated) return null;
    
    try {
      return await getAccessTokenSilently();
    } catch (err) {
      console.error('Error getting access token:', err);
      monitoringService.trackError('access_token_error', err as Error);
      return null;
    }
  };

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    if (!isAuthenticated || !user) return false;
    
    const userPermissions = user['https://velo-altitude.com/permissions'] || [];
    return userPermissions.includes(permission);
  };

  // Check if user has specific role
  const hasRole = (role: string): boolean => {
    if (!isAuthenticated || !user) return false;
    
    const userRoles = user['https://velo-altitude.com/roles'] || [];
    return userRoles.includes(role);
  };

  // Context value
  const contextValue: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    error,
    token,
    login,
    logout: performLogout,
    getAccessToken,
    hasPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
