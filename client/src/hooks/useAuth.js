import { useState, useEffect, createContext, useContext } from 'react';
import axios from 'axios';

// Créer le contexte d'authentification
const AuthContext = createContext();

// Fournisseur du contexte d'authentification
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Configurer le token pour toutes les requêtes
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Vérifier la session
        const response = await axios.get('/api/auth/me');
        setUser(response.data);
      } catch (err) {
        console.error('Erreur d\'authentification:', err);
        // Supprimer le token en cas d'erreur
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Fonction de connexion
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      // Stocker le token et configurer axios
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      return user;
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError(err.response?.data?.message || 'Erreur de connexion');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Mise à jour du profil utilisateur
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      const response = await axios.put('/api/users/profile', userData);
      setUser(response.data);
      return response.data;
    } catch (err) {
      console.error('Erreur de mise à jour du profil:', err);
      setError(err.response?.data?.message || 'Erreur de mise à jour du profil');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si l'utilisateur est admin
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  // Valeurs fournies par le contexte
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    updateProfile,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};
