import React, { createContext, useContext, useState, useEffect } from 'react';

// Création du contexte d'authentification
const AuthContext = createContext(null);

// Mock d'un utilisateur par défaut
const DEFAULT_USER = {
  id: "demo-user-123",
  name: "Utilisateur Démo",
  email: "demo@velo-altitude.com",
  role: "admin", // Pour permettre l'accès à toutes les fonctionnalités
  preferences: {
    theme: "light",
    language: "fr",
    notifications: true
  },
  profile: {
    weight: 75,
    height: 180,
    ftp: 250,
    experience: "intermediate"
  }
};

// Provider qui enveloppe l'application
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Effet pour charger l'utilisateur depuis localStorage au démarrage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('velo-altitude-user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      } else {
        // Utilisateur par défaut si aucun n'est enregistré
        setCurrentUser(DEFAULT_USER);
        localStorage.setItem('velo-altitude-user', JSON.stringify(DEFAULT_USER));
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'utilisateur:", error);
      // Fallback sur l'utilisateur par défaut en cas d'erreur
      setCurrentUser(DEFAULT_USER);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fonction de connexion
  const login = async (email, password) => {
    // Simuler une connexion réussie
    console.log(`Tentative de connexion avec ${email}`);
    setCurrentUser(DEFAULT_USER);
    localStorage.setItem('velo-altitude-user', JSON.stringify(DEFAULT_USER));
    return true;
  };

  // Fonction de déconnexion
  const logout = async () => {
    setCurrentUser(null);
    localStorage.removeItem('velo-altitude-user');
    return true;
  };

  // Mise à jour du profil utilisateur
  const updateUserProfile = async (profileData) => {
    const updatedUser = { ...currentUser, ...profileData };
    setCurrentUser(updatedUser);
    localStorage.setItem('velo-altitude-user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  // Obtention d'un token (simulé)
  const getToken = () => {
    return "demo-token-xyz-123";
  };

  // Valeur du contexte avec toutes les fonctions et propriétés nécessaires
  const value = {
    currentUser,
    user: currentUser, // Alias pour compatibilité
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === "admin",
    loading,
    login,
    logout,
    updateUserProfile,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Au lieu de lancer une erreur, retournons un contexte par défaut
    console.warn("useAuth est utilisé en dehors d'un AuthProvider, utilisation du contexte par défaut");
    return {
      currentUser: DEFAULT_USER,
      user: DEFAULT_USER,
      isAuthenticated: true,
      isAdmin: true,
      loading: false,
      login: () => Promise.resolve(true),
      logout: () => Promise.resolve(true),
      updateUserProfile: (data) => Promise.resolve({...DEFAULT_USER, ...data}),
      getToken: () => "demo-token-xyz-123"
    };
  }
  return context;
};

// Export par défaut pour compatibilité
export default { AuthProvider, useAuth };
