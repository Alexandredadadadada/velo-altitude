/**
 * Contexte d'authentification temporaire simplifié
 * Ce fichier fournit une implémentation simplifiée de l'authentification
 * pour permettre à l'application de fonctionner même sans backend
 */

import React, { createContext, useState, useContext, useEffect } from 'react';

// Création du contexte d'authentification
const TempAuthContext = createContext(null);

/**
 * Fournisseur du contexte d'authentification temporaire
 */
export const TempAuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Simuler un chargement initial
  useEffect(() => {
    const storedUser = localStorage.getItem('temp_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.warn('Erreur lors du chargement de l\'utilisateur stocké', e);
        localStorage.removeItem('temp_user');
      }
    }
  }, []);

  // Fonction de connexion simplifiée
  const login = async (credentials) => {
    setLoading(true);
    
    // Simuler un délai d'API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Créer un utilisateur factice
    const mockUser = {
      id: '123456',
      name: 'Utilisateur Test',
      email: credentials?.email || 'cycliste@example.com',
      role: 'user',
      preferences: {
        theme: 'light',
        language: 'fr'
      }
    };
    
    setCurrentUser(mockUser);
    localStorage.setItem('temp_user', JSON.stringify(mockUser));
    setLoading(false);
    return mockUser;
  };

  // Fonction de déconnexion simplifiée
  const logout = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    setCurrentUser(null);
    localStorage.removeItem('temp_user');
    setLoading(false);
  };

  // Autres fonctions simulées
  const getAuthFetch = async () => {
    return window.fetch;
  };

  const loadUserProfile = async () => {
    return currentUser;
  };

  // Valeur exposée par le contexte
  const contextValue = {
    currentUser,
    user: currentUser, // Alias pour la compatibilité avec les autres implémentations
    loading,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === 'admin',
    login,
    logout,
    getAuthFetch,
    loadUserProfile,
    getToken: () => 'mock-token-123',
    error: null,
    updateUserProfile: async (profile) => {
      const updatedUser = { ...currentUser, ...profile };
      setCurrentUser(updatedUser);
      localStorage.setItem('temp_user', JSON.stringify(updatedUser));
      return updatedUser;
    },
    userProfile: currentUser
  };

  return (
    <TempAuthContext.Provider value={contextValue}>
      {children}
    </TempAuthContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte d'authentification temporaire
 */
export const useTempAuth = () => {
  const context = useContext(TempAuthContext);
  
  if (!context) {
    console.warn('useTempAuth utilisé en dehors d\'un TempAuthProvider - utilisation d\'un contexte par défaut');
    
    // Retourner un objet par défaut pour éviter les erreurs
    return {
      currentUser: null,
      user: null,
      loading: false,
      isAuthenticated: false,
      isAdmin: false,
      login: async () => null,
      logout: async () => {},
      getAuthFetch: async () => window.fetch,
      loadUserProfile: async () => null,
      getToken: () => null,
      error: null,
      updateUserProfile: async () => null,
      userProfile: null
    };
  }
  
  return context;
};
