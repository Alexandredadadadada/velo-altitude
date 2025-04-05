/**
 * Service pour la gestion des sorties de groupe
 * Permet de créer, rechercher et gérer les sorties cyclistes en groupe
 */
import api from './api';
import authService from './authService';
import routeService from './routeService';
import weatherService from './weather.service';

// Vérifier si nous utilisons les données mockées ou les API réelles
const USE_MOCK_DATA = process.env.REACT_APP_USE_MOCK_DATA === 'true';

// Données mockées pour les sorties de groupe
const mockGroupRides = [
  {
    id: 'ride-1',
    title: "Sortie des cols vosgiens",
    description: "Une belle sortie à travers les Vosges avec passage sur 3 cols majeurs",
    routeId: "route-123",
    routeDetails: {
      name: "Circuit des 3 Ballons",
      distance: 85,
      elevationGain: 1250,
      difficulty: "Difficile",
      region: "Vosges"
    },
    organizer: {
      id: "user-123",
      name: "Pierre Martin",
      level: "advanced",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    dateTime: "2025-05-15T09:00:00",
    meetingPoint: "Place de la mairie, Thann",
    maxParticipants: 15,
    currentParticipants: 8,
    levelRequired: "intermediate",
    averageSpeed: 26,
    terrainType: "mountain",
    isPublic: true,
    tags: ["vosges", "cols", "groupe"],
    weatherForecast: {
      temperature: 18,
      condition: "partly-cloudy",
      windSpeed: 12,
      precipitation: 10
    },
    participants: [
      {
        id: "user-123",
        name: "Pierre Martin",
        level: "advanced",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg"
      },
      {
        id: "user-124",
        name: "Sophie Dubois",
        level: "intermediate",
        avatar: "https://randomuser.me/api/portraits/women/44.jpg"
      }
    ],
    stravaEventId: null
  },
  {
    id: 'ride-2',
    title: "Sortie endurance plaine d'Alsace",
    description: "Parcours plat idéal pour travailler l'endurance en groupe",
    routeId: "route-456",
    routeDetails: {
      name: "Plaine rhénane",
      distance: 100,
      elevationGain: 350,
      difficulty: "Modéré",
      region: "Alsace"
    },
    organizer: {
      id: "user-125",
      name: "Thomas Klein",
      level: "intermediate",
      avatar: "https://randomuser.me/api/portraits/men/41.jpg"
    },
    dateTime: "2025-05-18T08:30:00",
    meetingPoint: "Vélodrome de Strasbourg",
    maxParticipants: 20,
    currentParticipants: 12,
    levelRequired: "beginner",
    averageSpeed: 28,
    terrainType: "flat",
    isPublic: true,
    tags: ["endurance", "plat", "débutants bienvenus"],
    weatherForecast: {
      temperature: 22,
      condition: "sunny",
      windSpeed: 8,
      precipitation: 0
    },
    participants: [
      {
        id: "user-125",
        name: "Thomas Klein",
        level: "intermediate",
        avatar: "https://randomuser.me/api/portraits/men/41.jpg"
      },
      {
        id: "user-126",
        name: "Julie Morel",
        level: "beginner",
        avatar: "https://randomuser.me/api/portraits/women/22.jpg"
      }
    ],
    stravaEventId: "ev-123456"
  },
  {
    id: 'ride-3',
    title: "Sortie gravel Forêt-Noire",
    description: "Exploration des chemins forestiers de la Forêt-Noire, vélo gravel conseillé",
    routeId: "route-789",
    routeDetails: {
      name: "Sentiers de Forêt-Noire",
      distance: 65,
      elevationGain: 850,
      difficulty: "Modéré",
      region: "Forêt-Noire"
    },
    organizer: {
      id: "user-127",
      name: "Lucie Weber",
      level: "advanced",
      avatar: "https://randomuser.me/api/portraits/women/28.jpg"
    },
    dateTime: "2025-05-22T10:00:00",
    meetingPoint: "Parking forêt de Schirmeck",
    maxParticipants: 10,
    currentParticipants: 6,
    levelRequired: "intermediate",
    averageSpeed: 18,
    terrainType: "mixed",
    isPublic: true,
    tags: ["gravel", "forêt", "nature"],
    weatherForecast: {
      temperature: 16,
      condition: "cloudy",
      windSpeed: 5,
      precipitation: 20
    },
    participants: [
      {
        id: "user-127",
        name: "Lucie Weber",
        level: "advanced",
        avatar: "https://randomuser.me/api/portraits/women/28.jpg"
      },
      {
        id: "user-128",
        name: "Marc Fleury",
        level: "advanced",
        avatar: "https://randomuser.me/api/portraits/men/56.jpg"
      }
    ],
    stravaEventId: null
  }
];

const GroupRideService = {
  /**
   * Récupère toutes les sorties de groupe
   * @param {Object} filters - Filtres pour la recherche
   * @returns {Promise<Array>} Liste des sorties de groupe
   */
  getAllGroupRides: async (filters = {}) => {
    if (USE_MOCK_DATA) {
      // Simulation délai réseau
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Appliquer les filtres
      let filteredRides = [...mockGroupRides];
      
      // Filtre par région
      if (filters.region) {
        filteredRides = filteredRides.filter(ride => 
          ride.routeDetails.region.toLowerCase() === filters.region.toLowerCase());
      }
      
      // Filtre par niveau requis
      if (filters.levelRequired) {
        filteredRides = filteredRides.filter(ride => 
          ride.levelRequired === filters.levelRequired);
      }
      
      // Filtre par type de terrain
      if (filters.terrainType) {
        filteredRides = filteredRides.filter(ride => 
          ride.terrainType === filters.terrainType);
      }
      
      // Filtre par date (à partir d'aujourd'hui)
      if (filters.fromDate) {
        const fromDate = new Date(filters.fromDate);
        filteredRides = filteredRides.filter(ride => 
          new Date(ride.dateTime) >= fromDate);
      }
      
      // Filtre par vitesse moyenne
      if (filters.minSpeed) {
        filteredRides = filteredRides.filter(ride => 
          ride.averageSpeed >= filters.minSpeed);
      }
      if (filters.maxSpeed) {
        filteredRides = filteredRides.filter(ride => 
          ride.averageSpeed <= filters.maxSpeed);
      }
      
      // Filtre par recherche dans le titre ou la description
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredRides = filteredRides.filter(ride => 
          ride.title.toLowerCase().includes(searchLower) || 
          ride.description.toLowerCase().includes(searchLower) ||
          (ride.tags && ride.tags.some(tag => tag.toLowerCase().includes(searchLower))));
      }
      
      return filteredRides;
    }
    
    try {
      const queryParams = new URLSearchParams();
      
      // Ajouter les filtres aux paramètres de requête
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value);
        }
      });
      
      const response = await api.get(`/api/group-rides?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des sorties de groupe:', error);
      throw error;
    }
  },
  
  /**
   * Récupère une sortie de groupe par son ID
   * @param {string} rideId - ID de la sortie
   * @returns {Promise<Object>} Détails de la sortie
   */
  getGroupRideById: async (rideId) => {
    if (USE_MOCK_DATA) {
      // Simulation délai réseau
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const ride = mockGroupRides.find(r => r.id === rideId);
      if (!ride) {
        throw new Error(`Sortie ${rideId} non trouvée`);
      }
      
      return ride;
    }
    
    try {
      const response = await api.get(`/api/group-rides/${rideId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la sortie ${rideId}:`, error);
      throw error;
    }
  },
  
  /**
   * Crée une nouvelle sortie de groupe
   * @param {Object} rideData - Données de la sortie
   * @returns {Promise<Object>} Sortie créée
   */
  createGroupRide: async (rideData) => {
    // Vérifier si l'utilisateur est connecté
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Vous devez être connecté pour créer une sortie de groupe');
    }
    
    if (USE_MOCK_DATA) {
      // Simulation délai réseau
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Créer un ID unique
      const rideId = `ride-${Date.now()}`;
      
      // Si un itinéraire est spécifié, récupérer ses détails
      let routeDetails = {};
      if (rideData.routeId) {
        try {
          const route = await routeService.getRouteById(rideData.routeId);
          routeDetails = {
            name: route.name,
            distance: route.distance,
            elevationGain: route.elevationGain,
            difficulty: route.difficulty,
            region: route.region
          };
        } catch (error) {
          console.error('Erreur lors de la récupération des détails de l\'itinéraire:', error);
        }
      }
      
      // Récupérer les prévisions météo
      let weatherForecast = null;
      if (rideData.dateTime) {
        try {
          const rideDate = new Date(rideData.dateTime);
          // Simplification: utiliser les coordonnées de Strasbourg par défaut
          const weatherData = await weatherService.getForecast(48.573405, 7.752111, rideDate);
          
          if (weatherData && weatherData.daily && weatherData.daily[0]) {
            weatherForecast = {
              temperature: weatherData.daily[0].temp.day,
              condition: weatherData.daily[0].weather[0].main.toLowerCase(),
              windSpeed: weatherData.daily[0].wind_speed,
              precipitation: weatherData.daily[0].pop * 100
            };
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des prévisions météo:', error);
        }
      }
      
      // Créer la nouvelle sortie
      const newRide = {
        id: rideId,
        ...rideData,
        routeDetails,
        organizer: {
          id: currentUser.id,
          name: currentUser.name,
          level: currentUser.level || 'intermediate',
          avatar: currentUser.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'
        },
        currentParticipants: 1, // L'organisateur est compté comme participant
        participants: [
          {
            id: currentUser.id,
            name: currentUser.name,
            level: currentUser.level || 'intermediate',
            avatar: currentUser.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'
          }
        ],
        weatherForecast,
        stravaEventId: null, // À créer séparément
        createdAt: new Date().toISOString()
      };
      
      return newRide;
    }
    
    try {
      const response = await api.post('/api/group-rides', rideData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la sortie de groupe:', error);
      throw error;
    }
  },
  
  /**
   * Met à jour une sortie de groupe existante
   * @param {string} rideId - ID de la sortie
   * @param {Object} rideData - Données à mettre à jour
   * @returns {Promise<Object>} Sortie mise à jour
   */
  updateGroupRide: async (rideId, rideData) => {
    if (USE_MOCK_DATA) {
      // Simulation délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Vérifier si la sortie existe
      const rideIndex = mockGroupRides.findIndex(r => r.id === rideId);
      if (rideIndex === -1) {
        throw new Error(`Sortie ${rideId} non trouvée`);
      }
      
      // Vérifier les permissions (simplification)
      const currentUser = authService.getCurrentUser();
      if (!currentUser || mockGroupRides[rideIndex].organizer.id !== currentUser.id) {
        throw new Error('Vous n\'avez pas les droits pour modifier cette sortie');
      }
      
      // Mettre à jour la sortie
      const updatedRide = {
        ...mockGroupRides[rideIndex],
        ...rideData,
        updatedAt: new Date().toISOString()
      };
      
      return updatedRide;
    }
    
    try {
      const response = await api.put(`/api/group-rides/${rideId}`, rideData);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la sortie ${rideId}:`, error);
      throw error;
    }
  },
  
  /**
   * Supprime une sortie de groupe
   * @param {string} rideId - ID de la sortie
   * @returns {Promise<Object>} Confirmation de suppression
   */
  deleteGroupRide: async (rideId) => {
    if (USE_MOCK_DATA) {
      // Simulation délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Vérifier si la sortie existe
      const rideIndex = mockGroupRides.findIndex(r => r.id === rideId);
      if (rideIndex === -1) {
        throw new Error(`Sortie ${rideId} non trouvée`);
      }
      
      // Vérifier les permissions (simplification)
      const currentUser = authService.getCurrentUser();
      if (!currentUser || mockGroupRides[rideIndex].organizer.id !== currentUser.id) {
        throw new Error('Vous n\'avez pas les droits pour supprimer cette sortie');
      }
      
      return { success: true, message: 'Sortie supprimée avec succès' };
    }
    
    try {
      const response = await api.delete(`/api/group-rides/${rideId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de la sortie ${rideId}:`, error);
      throw error;
    }
  },
  
  /**
   * Rejoindre une sortie de groupe
   * @param {string} rideId - ID de la sortie
   * @returns {Promise<Object>} Résultat de l'opération
   */
  joinGroupRide: async (rideId) => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Vous devez être connecté pour rejoindre une sortie');
    }
    
    if (USE_MOCK_DATA) {
      // Simulation délai réseau
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Vérifier si la sortie existe
      const ride = mockGroupRides.find(r => r.id === rideId);
      if (!ride) {
        throw new Error(`Sortie ${rideId} non trouvée`);
      }
      
      // Vérifier si la sortie est complète
      if (ride.currentParticipants >= ride.maxParticipants) {
        throw new Error('Cette sortie est complète, impossible de rejoindre');
      }
      
      // Vérifier si l'utilisateur participe déjà
      if (ride.participants.some(p => p.id === currentUser.id)) {
        throw new Error('Vous participez déjà à cette sortie');
      }
      
      // Ajouter l'utilisateur aux participants
      const updatedRide = {
        ...ride,
        currentParticipants: ride.currentParticipants + 1,
        participants: [
          ...ride.participants,
          {
            id: currentUser.id,
            name: currentUser.name,
            level: currentUser.level || 'intermediate',
            avatar: currentUser.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg'
          }
        ]
      };
      
      return { 
        success: true, 
        message: 'Vous avez rejoint la sortie avec succès', 
        ride: updatedRide 
      };
    }
    
    try {
      const response = await api.post(`/api/group-rides/${rideId}/join`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la tentative de rejoindre la sortie ${rideId}:`, error);
      throw error;
    }
  },
  
  /**
   * Quitter une sortie de groupe
   * @param {string} rideId - ID de la sortie
   * @returns {Promise<Object>} Résultat de l'opération
   */
  leaveGroupRide: async (rideId) => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Vous devez être connecté pour quitter une sortie');
    }
    
    if (USE_MOCK_DATA) {
      // Simulation délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Vérifier si la sortie existe
      const ride = mockGroupRides.find(r => r.id === rideId);
      if (!ride) {
        throw new Error(`Sortie ${rideId} non trouvée`);
      }
      
      // Vérifier si l'utilisateur est l'organisateur
      if (ride.organizer.id === currentUser.id) {
        throw new Error('En tant qu\'organisateur, vous ne pouvez pas quitter la sortie. Vous devez la supprimer ou transférer l\'organisation.');
      }
      
      // Vérifier si l'utilisateur participe à la sortie
      if (!ride.participants.some(p => p.id === currentUser.id)) {
        throw new Error('Vous ne participez pas à cette sortie');
      }
      
      // Retirer l'utilisateur des participants
      const updatedRide = {
        ...ride,
        currentParticipants: Math.max(0, ride.currentParticipants - 1),
        participants: ride.participants.filter(p => p.id !== currentUser.id)
      };
      
      return { 
        success: true, 
        message: 'Vous avez quitté la sortie avec succès', 
        ride: updatedRide 
      };
    }
    
    try {
      const response = await api.post(`/api/group-rides/${rideId}/leave`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la tentative de quitter la sortie ${rideId}:`, error);
      throw error;
    }
  },
  
  /**
   * Partage une sortie de groupe sur Strava
   * @param {string} rideId - ID de la sortie
   * @returns {Promise<Object>} Résultat de l'opération avec ID d'événement Strava
   */
  shareOnStrava: async (rideId) => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Vous devez être connecté pour partager sur Strava');
    }
    
    if (USE_MOCK_DATA) {
      // Simulation délai réseau
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Vérifier si la sortie existe
      const ride = mockGroupRides.find(r => r.id === rideId);
      if (!ride) {
        throw new Error(`Sortie ${rideId} non trouvée`);
      }
      
      // Vérifier les permissions (simplification)
      if (ride.organizer.id !== currentUser.id) {
        throw new Error('Seul l\'organisateur peut partager cette sortie sur Strava');
      }
      
      // Générer un ID Strava factice
      const stravaEventId = `ev-${Date.now()}`;
      
      return { 
        success: true, 
        message: 'Sortie partagée sur Strava avec succès', 
        stravaEventId 
      };
    }
    
    try {
      const response = await api.post(`/api/group-rides/${rideId}/share-strava`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors du partage sur Strava de la sortie ${rideId}:`, error);
      throw error;
    }
  },
  
  /**
   * Récupère les sorties de groupe auxquelles participe un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des sorties
   */
  getUserGroupRides: async (userId) => {
    if (!userId) {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non spécifié et non connecté');
      }
      userId = currentUser.id;
    }
    
    if (USE_MOCK_DATA) {
      // Simulation délai réseau
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Filtrer les sorties où l'utilisateur participe
      const userRides = mockGroupRides.filter(ride => 
        ride.participants.some(p => p.id === userId)
      );
      
      return userRides;
    }
    
    try {
      const response = await api.get(`/api/users/${userId}/group-rides`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des sorties de l'utilisateur ${userId}:`, error);
      throw error;
    }
  },
  
  /**
   * Récupère les sorties de groupe organisées par un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des sorties
   */
  getUserOrganizedRides: async (userId) => {
    if (!userId) {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non spécifié et non connecté');
      }
      userId = currentUser.id;
    }
    
    if (USE_MOCK_DATA) {
      // Simulation délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Filtrer les sorties organisées par l'utilisateur
      const organizedRides = mockGroupRides.filter(ride => 
        ride.organizer.id === userId
      );
      
      return organizedRides;
    }
    
    try {
      const response = await api.get(`/api/users/${userId}/organized-rides`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des sorties organisées par l'utilisateur ${userId}:`, error);
      throw error;
    }
  }
};

export default GroupRideService;
