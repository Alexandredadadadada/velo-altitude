import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth0Config } from '../config/auth0';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialisation Auth0
    const initAuth = async () => {
      try {
        // Vérification du token
        const token = localStorage.getItem('auth_token');
        if (token) {
          setIsAuthenticated(true);
          // Récupérer les infos utilisateur
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = () => {
    // Logique de connexion
  };

  const logout = () => {
    // Logique de déconnexion
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
