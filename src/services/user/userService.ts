import { User } from '@auth0/auth0-react';
import { useAuth } from '../../features/auth/authContext';

// Fonction utilitaire pour récupérer un token d'accès
const getAccessToken = async (): Promise<string | null> => {
  // Cette fonction sera remplacée par l'importation dynamique
  // du contexte d'authentification dans les fonctions qui l'utilisent
  return null;
};

export const userService = {
  /**
   * Récupère le profil de l'utilisateur depuis l'API
   */
  async getProfile(): Promise<User> {
    // On utilise le hook useAuth() dans les composants
    // Pour les appels hors des composants, nous devons utiliser une méthode différente
    
    let token = null;
    
    try {
      const auth = useAuth();
      token = await auth.getAccessToken();
    } catch (error) {
      // Probablement appelé en dehors d'un composant React
      token = await getAccessToken();
    }
    
    if (!token) {
      throw new Error('Unauthorized: No access token available');
    }
    
    const response = await fetch('/.netlify/functions/api/user/profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching profile: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  /**
   * Met à jour les métadonnées de l'utilisateur
   */
  async updateUserMetadata(userId: string, metadata: Record<string, any>): Promise<User> {
    let token = null;
    
    try {
      const auth = useAuth();
      token = await auth.getAccessToken();
    } catch (error) {
      token = await getAccessToken();
    }
    
    if (!token) {
      throw new Error('Unauthorized: No access token available');
    }
    
    const response = await fetch(`/.netlify/functions/api/user/${userId}/metadata`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    });
    
    if (!response.ok) {
      throw new Error(`Error updating user metadata: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  /**
   * Récupère les rôles de l'utilisateur
   */
  async getUserRoles(userId: string): Promise<string[]> {
    let token = null;
    
    try {
      const auth = useAuth();
      token = await auth.getAccessToken();
    } catch (error) {
      token = await getAccessToken();
    }
    
    if (!token) {
      throw new Error('Unauthorized: No access token available');
    }
    
    const response = await fetch(`/.netlify/functions/api/user/${userId}/roles`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching user roles: ${response.statusText}`);
    }
    
    return response.json();
  },
  
  /**
   * Récupère les permissions de l'utilisateur
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    let token = null;
    
    try {
      const auth = useAuth();
      token = await auth.getAccessToken();
    } catch (error) {
      token = await getAccessToken();
    }
    
    if (!token) {
      throw new Error('Unauthorized: No access token available');
    }
    
    const response = await fetch(`/.netlify/functions/api/user/${userId}/permissions`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching user permissions: ${response.statusText}`);
    }
    
    return response.json();
  }
};
