/**
 * Service pour la gestion des fonctionnalités sociales
 */
import api from './api';
import mockPosts from '../mocks/posts';
import mockComments from '../mocks/comments';
import mockStravaActivities from '../mocks/stravaActivities';

// Vérifier si nous utilisons les données mockées ou les API réelles
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

const SocialService = {
  /**
   * Récupère les posts du fil d'actualité
   * @param {Object} options - Options de filtrage
   * @returns {Promise<Array>} Liste des posts
   */
  getFeedPosts: async (options = {}) => {
    try {
      if (USE_MOCK_DATA) {
        console.log('Using mock data for posts');
        // Filtrer les posts mockés selon les options
        const filteredPosts = mockPosts.filter(post => {
          if (options.filter && options.filter !== 'all') {
            return post.type === options.filter;
          }
          return true;
        });
        
        // Simuler une latence réseau
        await new Promise(resolve => setTimeout(resolve, 500));
        return filteredPosts;
      }
      
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (options.filter && options.filter !== 'all') {
        params.append('type', options.filter);
      }
      
      // Appel API réel
      const response = await api.get(`/social/posts?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching feed posts:', error);
      throw error;
    }
  },
  
  /**
   * Crée un nouveau post
   * @param {Object} postData - Données du post
   * @returns {Promise<Object>} Post créé
   */
  createPost: async (postData) => {
    try {
      if (USE_MOCK_DATA) {
        console.log('Using mock data for creating post');
        
        // Créer un nouveau post mocké
        const newPost = {
          id: `post-${Date.now()}`,
          user: {
            id: 'user-123',
            name: 'Jean Dupont',
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
          },
          content: postData.content,
          timestamp: new Date().toISOString(),
          likes: 0,
          comments: [],
          userLiked: false,
          type: postData.type || 'text'
        };
        
        // Ajouter des détails spécifiques selon le type de post
        if (postData.type === 'ride' && postData.activity) {
          newPost.activity = postData.activity;
        }
        
        // Simuler une latence réseau
        await new Promise(resolve => setTimeout(resolve, 500));
        return newPost;
      }
      
      // Appel API réel
      const response = await api.post('/social/posts', postData);
      return response.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les commentaires d'un post
   * @param {string} postId - ID du post
   * @returns {Promise<Array>} Liste des commentaires
   */
  getComments: async (postId) => {
    try {
      if (USE_MOCK_DATA) {
        console.log(`Using mock data for comments of post ${postId}`);
        
        // Filtrer les commentaires mockés pour ce post
        const comments = mockComments.filter(comment => comment.postId === postId);
        
        // Simuler une latence réseau
        await new Promise(resolve => setTimeout(resolve, 300));
        return comments;
      }
      
      // Appel API réel
      const response = await api.get(`/social/posts/${postId}/comments`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching comments for post ${postId}:`, error);
      throw error;
    }
  },
  
  /**
   * Ajoute un commentaire à un post
   * @param {string} postId - ID du post
   * @param {string} content - Contenu du commentaire
   * @returns {Promise<Object>} Commentaire créé
   */
  addComment: async (postId, content) => {
    try {
      if (USE_MOCK_DATA) {
        console.log(`Using mock data for adding comment to post ${postId}`);
        
        // Créer un nouveau commentaire mocké
        const newComment = {
          id: `comment-${Date.now()}`,
          postId,
          user: {
            id: 'user-123',
            name: 'Jean Dupont',
            avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
          },
          content,
          timestamp: new Date().toISOString()
        };
        
        // Simuler une latence réseau
        await new Promise(resolve => setTimeout(resolve, 300));
        return newComment;
      }
      
      // Appel API réel
      const response = await api.post(`/social/posts/${postId}/comments`, { content });
      return response.data;
    } catch (error) {
      console.error(`Error adding comment to post ${postId}:`, error);
      throw error;
    }
  },
  
  /**
   * Active/désactive le "j'aime" sur un post
   * @param {string} postId - ID du post
   * @param {boolean} liked - Nouvel état (aimé ou non)
   * @returns {Promise<Object>} Résultat de l'opération
   */
  toggleLike: async (postId, liked) => {
    try {
      if (USE_MOCK_DATA) {
        console.log(`Using mock data for toggling like on post ${postId}`);
        
        // Simuler une latence réseau
        await new Promise(resolve => setTimeout(resolve, 200));
        return { success: true };
      }
      
      // Appel API réel
      if (liked) {
        const response = await api.post(`/social/posts/${postId}/like`);
        return response.data;
      } else {
        const response = await api.delete(`/social/posts/${postId}/like`);
        return response.data;
      }
    } catch (error) {
      console.error(`Error toggling like on post ${postId}:`, error);
      throw error;
    }
  },
  
  /**
   * Vérifie si l'utilisateur est connecté à Strava
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<boolean>} État de la connexion
   */
  checkStravaConnection: async (userId) => {
    try {
      if (USE_MOCK_DATA) {
        console.log(`Using mock data for checking Strava connection of user ${userId}`);
        
        // Simuler une latence réseau
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Retourner false par défaut pour permettre de tester la connexion
        return false;
      }
      
      // Appel API réel
      const response = await api.get(`/social/strava/status`);
      return response.data.connected;
    } catch (error) {
      console.error(`Error checking Strava connection for user ${userId}:`, error);
      throw error;
    }
  },
  
  /**
   * Connecte l'utilisateur à Strava
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Résultat de la connexion
   */
  connectStrava: async (userId) => {
    try {
      if (USE_MOCK_DATA) {
        console.log(`Using mock data for connecting user ${userId} to Strava`);
        
        // Simuler une latence réseau
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { success: true };
      }
      
      // Appel API réel
      const response = await api.post(`/social/strava/connect`);
      return response.data;
    } catch (error) {
      console.error(`Error connecting user ${userId} to Strava:`, error);
      throw error;
    }
  },
  
  /**
   * Récupère les activités Strava de l'utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des activités
   */
  getStravaActivities: async (userId) => {
    try {
      if (USE_MOCK_DATA) {
        console.log(`Using mock data for Strava activities of user ${userId}`);
        
        // Simuler une latence réseau
        await new Promise(resolve => setTimeout(resolve, 800));
        return mockStravaActivities;
      }
      
      // Appel API réel
      const response = await api.get(`/social/strava/activities`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching Strava activities for user ${userId}:`, error);
      throw error;
    }
  },
  
  /**
   * Récupère un post par son ID
   * @param {string} postId - ID du post
   * @returns {Promise<Object>} Données du post
   */
  getPostById: async (postId) => {
    if (USE_MOCK_DATA) {
      const post = mockPosts.find(p => p.id === postId);
      if (!post) throw new Error('Post non trouvé');
      return Promise.resolve(post);
    }
    
    try {
      const response = await api.get(`/api/social/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du post ${postId}`, error);
      throw error;
    }
  },
  
  /**
   * Met à jour un post existant
   * @param {string} postId - ID du post
   * @param {Object} postData - Données à mettre à jour
   * @returns {Promise<Object>} Post mis à jour
   */
  updatePost: async (postId, postData) => {
    if (USE_MOCK_DATA) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 400));
      return Promise.resolve({
        id: postId,
        ...postData,
        updatedAt: new Date().toISOString()
      });
    }
    
    try {
      const response = await api.put(`/api/social/posts/${postId}`, postData);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du post ${postId}`, error);
      throw error;
    }
  },
  
  /**
   * Supprime un post
   * @param {string} postId - ID du post
   * @returns {Promise<Object>} Résultat de l'opération
   */
  deletePost: async (postId) => {
    if (USE_MOCK_DATA) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      return Promise.resolve({ success: true });
    }
    
    try {
      const response = await api.delete(`/api/social/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression du post ${postId}`, error);
      throw error;
    }
  },
  
  /**
   * Partage une activité Strava sur le fil social
   * @param {string} userId - ID de l'utilisateur
   * @param {string} activityId - ID de l'activité Strava
   * @param {Object} postData - Données additionnelles pour le post
   * @returns {Promise<Object>} Post créé
   */
  shareStravaActivity: async (userId, activityId, postData = {}) => {
    if (USE_MOCK_DATA) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recherche de l'activité dans les données mockées
      const activity = mockStravaActivities.find(a => a.id === activityId);
      if (!activity) throw new Error('Activité Strava non trouvée');
      
      const newPost = {
        id: `post-${Date.now()}`,
        userId,
        type: 'ride',
        content: postData.content || `J'ai partagé mon activité Strava: ${activity.name}`,
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: [],
        userLiked: false,
        activity: {
          id: activity.id,
          title: activity.name,
          distance: (activity.distance / 1000).toFixed(1),
          duration: formatDuration(activity.moving_time),
          elevationGain: activity.total_elevation_gain,
          stravaId: activity.id,
          polyline: activity.map?.polyline || null
        },
        user: {
          id: userId,
          name: 'Jean Dupont', // Normalement récupéré depuis l'API
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
        }
      };
      
      return Promise.resolve(newPost);
    }
    
    try {
      const response = await api.post(`/api/social/strava/${activityId}/share`, {
        userId,
        ...postData
      });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors du partage de l'activité Strava ${activityId}`, error);
      throw error;
    }
  },
  
  /**
   * Vérifie le statut de connexion Strava d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Statut de connexion Strava
   */
  getStravaConnectionStatus: async (userId) => {
    if (USE_MOCK_DATA) {
      // Simuler un délai réseau
      await new Promise(resolve => setTimeout(resolve, 200));
      return Promise.resolve({ 
        connected: true,
        athleteId: '12345678',
        athleteName: 'Jean Dupont'
      });
    }
    
    try {
      const response = await api.get(`/api/users/${userId}/strava/status`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la vérification du statut Strava pour l'utilisateur ${userId}`, error);
      throw error;
    }
  }
};

/**
 * Formate la durée en secondes vers un format lisible (HH:MM:SS)
 * @param {number} seconds - Durée en secondes
 * @returns {string} Durée formatée
 */
const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  } else {
    return `${minutes}min ${remainingSeconds}s`;
  }
};

export default SocialService;
