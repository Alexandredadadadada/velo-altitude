import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import authService from '../services/authService';

// Création du contexte d'authentification
const AuthContext = createContext(null);

// Mock d'un utilisateur par défaut
const DEFAULT_USER = {
  id: "demo-user-123",
  name: "Demo User",
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
  const [error, setError] = useState(null);

  // Effet pour initialiser l'authentification au démarrage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("Initialisation du contexte d'authentification...");
        
        // Vérifier si l'utilisateur est déjà authentifié via le service
        const isAuthenticated = authService.isAuthenticated();
        
        if (isAuthenticated) {
          // Si le token est valide, on essaie de le rafraîchir pour s'assurer qu'il est à jour
          try {
            await authService.checkAndRefreshToken();
          } catch (refreshError) {
            console.warn("Erreur lors du rafraîchissement du token:", refreshError);
            // Continuer même si le rafraîchissement échoue
          }
          
          // Récupérer les informations utilisateur depuis le token JWT
          const token = authService.getToken();
          if (token) {
            try {
              // Décodage basique des informations utilisateur
              const userInfo = JSON.parse(atob(token.split('.')[1]));
              setCurrentUser({
                id: userInfo.sub || userInfo.id,
                name: userInfo.name,
                email: userInfo.email,
                role: userInfo.role || "user",
                // Autres propriétés par défaut si nécessaire
                preferences: userInfo.preferences || { theme: "light", language: "fr" },
                profile: userInfo.profile || {}
              });
            } catch (decodeError) {
              console.error("Erreur lors du décodage du token:", decodeError);
              // Fallback sur l'utilisateur par défaut
              setCurrentUser(DEFAULT_USER);
            }
          }
        } else {
          // En développement, utiliser un utilisateur par défaut
          if (process.env.NODE_ENV === 'development') {
            setCurrentUser(DEFAULT_USER);
            // Simuler un token pour le développement
            if (!authService.getToken()) {
              const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vLXVzZXItMTIzIiwibmFtZSI6IkRlbW8gVXNlciIsImVtYWlsIjoiZGVtb0B2ZWxvLWFsdGl0dWRlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTY0MzI5MTI3NCwiZXhwIjoxNzQ2MTIzMjc0fQ.cEfTV_gI2MEFXCwq1jlY_lhqJmjU4CQT3TlzVQHdCOg";
              const expireDate = new Date();
              expireDate.setFullYear(expireDate.getFullYear() + 1); // Expire dans 1 an
              
              localStorage.setItem('auth_token', mockToken);
              localStorage.setItem('token_expiry', expireDate.toISOString());
              localStorage.setItem('refresh_token', 'mock-refresh-token');
            }
          }
        }
        
        // Vérifier les erreurs d'authentification stockées
        const storedError = authService.getStoredAuthError();
        if (storedError) {
          setError(storedError);
          // Effacer l'erreur après l'avoir récupérée
          authService.clearAuthErrors();
        }
      } catch (initError) {
        console.error("Erreur lors de l'initialisation de l'authentification:", initError);
        setError("Problème lors de l'initialisation de l'authentification");
        
        // En développement, utiliser un utilisateur par défaut même en cas d'erreur
        if (process.env.NODE_ENV === 'development') {
          setCurrentUser(DEFAULT_USER);
        }
      } finally {
        setLoading(false);
        console.log("Initialisation du contexte d'authentification terminée");
      }
    };
    
    initializeAuth();
  }, []);

  // Fonction de connexion qui utilise le service d'authentification
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // En développement, simuler une connexion réussie
      if (process.env.NODE_ENV === 'development') {
        console.log(`Connexion simulée pour ${email}`);
        setCurrentUser(DEFAULT_USER);
        return { success: true, user: DEFAULT_USER };
      }
      
      // En production, appeler l'API de connexion
      const response = await axios.post('/api/auth/login', { email, password });
      
      // Traiter la réponse avec le service d'authentification
      await authService.handleLogin(response.data);
      
      // Mettre à jour l'utilisateur courant
      const token = authService.getToken();
      if (token) {
        try {
          const userInfo = JSON.parse(atob(token.split('.')[1]));
          setCurrentUser({
            id: userInfo.sub || userInfo.id,
            name: userInfo.name,
            email: userInfo.email,
            role: userInfo.role || "user",
            preferences: userInfo.preferences || { theme: "light", language: "fr" },
            profile: userInfo.profile || {}
          });
        } catch (decodeError) {
          console.error("Erreur lors du décodage du token:", decodeError);
        }
      }
      
      return { success: true, user: currentUser };
    } catch (loginError) {
      console.error("Erreur de connexion:", loginError);
      
      // Extraire le message d'erreur de la réponse API
      const errorMessage = loginError.response?.data?.message || "Échec de la connexion. Veuillez réessayer.";
      setError(errorMessage);
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion qui utilise le service d'authentification
  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  // Mise à jour du profil utilisateur
  const updateUserProfile = async (profileData) => {
    try {
      setLoading(true);
      
      // En développement, simuler une mise à jour réussie
      if (process.env.NODE_ENV === 'development') {
        const updatedUser = { ...currentUser, ...profileData };
        setCurrentUser(updatedUser);
        return updatedUser;
      }
      
      // En production, appeler l'API de mise à jour
      const response = await axios.put('/api/users/profile', profileData);
      const updatedUser = response.data;
      
      setCurrentUser(prev => ({ ...prev, ...updatedUser }));
      return updatedUser;
    } catch (updateError) {
      console.error("Erreur lors de la mise à jour du profil:", updateError);
      throw updateError;
    } finally {
      setLoading(false);
    }
  };

  // Obtention d'un token via le service d'authentification
  const getToken = () => {
    return authService.getToken();
  };

  // Valeur du contexte avec toutes les fonctions et propriétés nécessaires
  const value = {
    currentUser,
    user: currentUser, // Alias pour compatibilité
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === "admin",
    loading,
    error,
    login,
    logout,
    updateUserProfile,
    getToken,
    authService // Exposer le service pour les cas avancés
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <div>Chargement de l'authentification...</div>}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Au lieu de lancer une erreur, utiliser le contexte global d'override ou un contexte par défaut
    console.warn("useAuth est utilisé en dehors d'un AuthProvider, utilisation du contexte par défaut");
    
    // Vérifier si nous avons un contexte global (défini par auth-override.js)
    if (window.AUTH_CONTEXT) {
      return window.AUTH_CONTEXT;
    }
    
    // Contexte par défaut comme fallback
    return {
      currentUser: DEFAULT_USER,
      user: DEFAULT_USER,
      isAuthenticated: true,
      isAdmin: true,
      loading: false,
      error: null,
      login: () => Promise.resolve({ success: true, user: DEFAULT_USER }),
      logout: () => {},
      updateUserProfile: (data) => Promise.resolve({...DEFAULT_USER, ...data}),
      getToken: () => "mock-token-for-development"
    };
  }
  return context;
};

// Export par défaut pour compatibilité
export default { AuthProvider, useAuth };
