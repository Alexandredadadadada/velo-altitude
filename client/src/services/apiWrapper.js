/**
 * API Wrapper pour Velo-Altitude
 * Ce service détecte automatiquement si l'application est sur Netlify et utilise des données mockées
 * au lieu d'appeler réellement les API si nécessaire
 */
import config from '../config';
import mockColsData from '../data/mockColsData';
import mockMajorChallengeData from '../data/mockMajorChallengeData';
import mockNutritionData from '../data/mockNutritionData';
import mockTrainingData from '../data/mockTrainingData';

// Déterminer si nous devons utiliser des données mockées
const useMockData = config.api.useMockData || config.development.mockData;

/**
 * Wrapper pour les appels API qui utilise des données mockées si configuré ainsi
 */
class ApiWrapper {
  /**
   * Récupère les données appropriées (réelles ou mockées) en fonction de la configuration
   * @param {string} endpoint - L'endpoint API à appeler
   * @param {Object} options - Options de la requête
   * @returns {Promise} - Promesse avec les données
   */
  async get(endpoint, options = {}) {
    // Si on utilise des données mockées, retourner les données appropriées
    if (useMockData) {
      console.log(`Using mock data for ${endpoint}`);
      return this.getMockData(endpoint, options);
    }

    // Sinon, faire un vrai appel API
    try {
      const response = await fetch(`${config.api.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API error for ${endpoint}:`, error);
      
      // En cas d'erreur, on peut fallback sur les données mockées
      console.log(`Falling back to mock data for ${endpoint}`);
      return this.getMockData(endpoint, options);
    }
  }

  /**
   * Récupère les données mockées appropriées en fonction de l'endpoint
   * @param {string} endpoint - L'endpoint API
   * @param {Object} options - Options de la requête
   * @returns {Promise} - Promesse avec les données mockées
   */
  getMockData(endpoint, options = {}) {
    // Simuler un délai réseau pour que ça paraisse plus réaliste
    return new Promise(resolve => {
      setTimeout(() => {
        // Retourner les données mockées appropriées en fonction de l'endpoint
        if (endpoint.includes('/cols')) {
          resolve({ data: mockColsData });
        } 
        else if (endpoint.includes('/major-challenge') || endpoint.includes('/7majeurs')) {
          if (endpoint.includes('/community')) {
            resolve({ data: mockMajorChallengeData.communityChallenges });
          } else if (endpoint.includes('/user')) {
            resolve({ data: mockMajorChallengeData.userChallenges });
          } else {
            resolve({ data: mockMajorChallengeData.detailedCols });
          }
        }
        else if (endpoint.includes('/nutrition')) {
          if (endpoint.includes('/profile')) {
            resolve({ data: mockNutritionData.nutritionProfile });
          } else if (endpoint.includes('/recommendations')) {
            resolve({ data: mockNutritionData.mealRecommendations });
          } else if (endpoint.includes('/tracking')) {
            resolve({ data: mockNutritionData.nutritionTracking });
          } else if (endpoint.includes('/recipes')) {
            resolve({ data: mockNutritionData.recipes });
          } else {
            resolve({ data: mockNutritionData });
          }
        }
        else if (endpoint.includes('/training')) {
          if (endpoint.includes('/profile')) {
            resolve({ data: mockTrainingData.trainingProfile });
          } else if (endpoint.includes('/plans')) {
            resolve({ data: mockTrainingData.trainingPlans });
          } else if (endpoint.includes('/workouts')) {
            resolve({ data: mockTrainingData.colTrainingWorkouts });
          } else if (endpoint.includes('/progress')) {
            resolve({ data: mockTrainingData.trainingProgress });
          } else if (endpoint.includes('/simulator')) {
            resolve({ data: mockTrainingData.colSimulatorData });
          } else {
            resolve({ data: mockTrainingData });
          }
        }
        else {
          // Endpoint inconnu, retourner un objet vide
          resolve({ data: {} });
        }
      }, 300); // Délai de 300ms pour simuler une requête réseau
    });
  }

  /**
   * Effectue un appel POST à l'API
   * @param {string} endpoint - L'endpoint API
   * @param {Object} data - Les données à envoyer
   * @param {Object} options - Options de la requête
   * @returns {Promise} - Promesse avec la réponse
   */
  async post(endpoint, data, options = {}) {
    // Si on utilise des données mockées, simuler une réponse réussie
    if (useMockData) {
      console.log(`Using mock POST for ${endpoint}`);
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ success: true, data: { id: 'mock-id-' + Date.now() } });
        }, 300);
      });
    }

    // Sinon, faire un vrai appel API
    try {
      const response = await fetch(`${config.api.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(data),
        ...options
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API error for ${endpoint}:`, error);
      
      // En cas d'erreur, simuler une réponse réussie
      console.log(`Falling back to mock response for ${endpoint}`);
      return { success: true, data: { id: 'mock-id-' + Date.now() } };
    }
  }

  /**
   * Effectue un appel PUT à l'API
   * @param {string} endpoint - L'endpoint API
   * @param {Object} data - Les données à envoyer
   * @param {Object} options - Options de la requête
   * @returns {Promise} - Promesse avec la réponse
   */
  async put(endpoint, data, options = {}) {
    if (useMockData) {
      console.log(`Using mock PUT for ${endpoint}`);
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ success: true });
        }, 300);
      });
    }

    try {
      const response = await fetch(`${config.api.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: JSON.stringify(data),
        ...options
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API error for ${endpoint}:`, error);
      return { success: true };
    }
  }

  /**
   * Effectue un appel DELETE à l'API
   * @param {string} endpoint - L'endpoint API
   * @param {Object} options - Options de la requête
   * @returns {Promise} - Promesse avec la réponse
   */
  async delete(endpoint, options = {}) {
    if (useMockData) {
      console.log(`Using mock DELETE for ${endpoint}`);
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ success: true });
        }, 300);
      });
    }

    try {
      const response = await fetch(`${config.api.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API error for ${endpoint}:`, error);
      return { success: true };
    }
  }
}

// Exporter une instance unique du wrapper
export default new ApiWrapper();
