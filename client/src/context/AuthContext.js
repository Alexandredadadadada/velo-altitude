import React, { createContext, useState, useContext, useEffect } from 'react';

// Création du contexte d'authentification
const AuthContext = createContext(null);

// Provider qui enveloppera l'application
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Simuler la récupération du user depuis le stockage local ou l'API
    const checkUserAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
          
          // Récupérer le profil utilisateur
          await fetchUserProfile(user.id);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUserAuth();
  }, []);

  // Récupérer le profil utilisateur depuis l'API
  const fetchUserProfile = async (userId) => {
    try {
      // Pour la demo, créons un profil simulé
      const defaultProfile = {
        id: userId,
        firstName: "Utilisateur",
        lastName: "Demo",
        level: "intermédiaire",
        ftp: 250,
        weight: 75,
        height: 180,
        goals: ["amélioration FTP", "grimper cols"],
        preferences: {
          theme: "standard",
          notifications: true,
          units: "metric"
        },
        trainingStats: {
          totalDistance: 2500,
          totalElevation: 35000,
          totalRides: 45,
          totalTime: 120
        }
      };
      
      setUserProfile(defaultProfile);
      return defaultProfile;
    } catch (error) {
      console.error("Erreur lors de la récupération du profil utilisateur:", error);
      return null;
    }
  };

  // Fonction de connexion
  const login = async (email, password) => {
    try {
      // En démo, on utilise un utilisateur fictif
      const demoUser = {
        id: "user_123456",
        email: email,
        name: "Cycliste Demo",
        authToken: "jwt_token_demo_123456789"
      };

      setCurrentUser(demoUser);
      localStorage.setItem('user', JSON.stringify(demoUser));
      
      // Récupérer le profil utilisateur
      await fetchUserProfile(demoUser.id);
      
      return { success: true, user: demoUser };
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      return { success: false, error: error.message };
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    setCurrentUser(null);
    setUserProfile(null);
    localStorage.removeItem('user');
  };

  // Enregistrement d'un nouvel utilisateur
  const register = async (email, password, name) => {
    try {
      // En démo, on utilise un utilisateur fictif
      const newUser = {
        id: "user_" + Date.now(),
        email,
        name,
        authToken: "jwt_token_new_" + Date.now()
      };

      setCurrentUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      // Créer un profil utilisateur par défaut
      const defaultProfile = {
        id: newUser.id,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' '),
        level: "débutant",
        ftp: 200,
        weight: 75,
        height: 175,
        goals: ["amélioration endurance"],
        preferences: {
          theme: "standard",
          notifications: true,
          units: "metric"
        }
      };
      
      setUserProfile(defaultProfile);
      return { success: true, user: newUser };
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      return { success: false, error: error.message };
    }
  };

  // Mise à jour du profil utilisateur
  const updateUserProfile = async (profileData) => {
    try {
      const updatedProfile = { ...userProfile, ...profileData };
      setUserProfile(updatedProfile);
      
      // Normalement on ferait un appel API ici
      console.log("Profil utilisateur mis à jour:", updatedProfile);
      
      return { success: true, profile: updatedProfile };
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      return { success: false, error: error.message };
    }
  };

  // Valeurs exposées par le contexte
  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    logout,
    register,
    updateUserProfile,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
