import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

// Création du contexte
const ChallengeContext = createContext();

// Actions types
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_ALL_COLS: 'SET_ALL_COLS',
  SET_TOTAL_ITEMS: 'SET_TOTAL_ITEMS',
  SET_FILTERS: 'SET_FILTERS',
  SET_PAGE: 'SET_PAGE',
  SELECT_COL: 'SELECT_COL',
  REMOVE_COL: 'REMOVE_COL',
  SET_CHALLENGE_NAME: 'SET_CHALLENGE_NAME',
  SET_IS_PUBLIC: 'SET_IS_PUBLIC',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  SET_PREDEFINED_CHALLENGES: 'SET_PREDEFINED_CHALLENGES',
  SET_USER_CHALLENGES: 'SET_USER_CHALLENGES',
  SET_SELECTED_COL: 'SET_SELECTED_COL',
  SET_SHOW_COL_DETAILS: 'SET_SHOW_COL_DETAILS',
  SET_WEATHER_DATA: 'SET_WEATHER_DATA',
  SET_USER_COMPLETED_COLS: 'SET_USER_COMPLETED_COLS',
  SET_SCHEDULED_ASCENTS: 'SET_SCHEDULED_ASCENTS',
  SET_SCHEDULE_DIALOG: 'SET_SCHEDULE_DIALOG',
  ADD_SCHEDULED_ASCENT: 'ADD_SCHEDULED_ASCENT',
  SET_COMMUNITY_FILTER: 'SET_COMMUNITY_FILTER',
  SET_COMMUNITY_SEARCH: 'SET_COMMUNITY_SEARCH',
  SET_COMMUNITY_LIKES: 'SET_COMMUNITY_LIKES',
  TOGGLE_LIKE_CHALLENGE: 'TOGGLE_LIKE_CHALLENGE',
  LOAD_CHALLENGE: 'LOAD_CHALLENGE',
  CLEAR_SELECTION: 'CLEAR_SELECTION',
  SET_NOTIFICATION: 'SET_NOTIFICATION',
  CLEAR_NOTIFICATION: 'CLEAR_NOTIFICATION',
  SET_EXPORT_FORMAT: 'SET_EXPORT_FORMAT',
};

// État initial
const initialState = {
  loading: false,
  error: null,
  allCols: [],
  totalItems: 0,
  filters: {
    region: '',
    country: '',
    minAltitude: '',
    maxAltitude: '',
    difficulty: '',
    searchQuery: ''
  },
  page: 1,
  rowsPerPage: 20,
  selectedCols: [],
  challengeName: "Mon défi des 7 Majeurs",
  isPublic: false,
  activeTab: 0,
  predefinedChallenges: [],
  userChallenges: [],
  selectedCol: null,
  showColDetails: false,
  weatherData: {},
  showScheduleDialog: false,
  scheduleColId: null,
  scheduleColName: '',
  communityFilter: 'recent',
  communitySearch: '',
  communityLikes: {},
  userCompletedCols: [],
  scheduledAscents: {},
  exportFormat: 'gpx',
  notification: null
};

// Reducer pour gérer les actions
const challengeReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case ACTIONS.SET_ALL_COLS:
      return { ...state, allCols: action.payload, loading: false };
    
    case ACTIONS.SET_TOTAL_ITEMS:
      return { ...state, totalItems: action.payload };
    
    case ACTIONS.SET_FILTERS:
      return { 
        ...state, 
        filters: { ...state.filters, ...action.payload },
        page: 1 // Réinitialiser la page lors du changement de filtres
      };
    
    case ACTIONS.SET_PAGE:
      return { ...state, page: action.payload };
    
    case ACTIONS.SELECT_COL:
      // Éviter les doublons et limiter à 7 cols
      if (state.selectedCols.length >= 7 || 
          state.selectedCols.some(col => col.id === action.payload.id)) {
        return state;
      }
      return { 
        ...state, 
        selectedCols: [...state.selectedCols, action.payload] 
      };
    
    case ACTIONS.REMOVE_COL:
      return { 
        ...state, 
        selectedCols: state.selectedCols.filter(col => col.id !== action.payload)
      };
    
    case ACTIONS.SET_CHALLENGE_NAME:
      return { ...state, challengeName: action.payload };
    
    case ACTIONS.SET_IS_PUBLIC:
      return { ...state, isPublic: action.payload };
    
    case ACTIONS.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload };
    
    case ACTIONS.SET_PREDEFINED_CHALLENGES:
      return { ...state, predefinedChallenges: action.payload, loading: false };
    
    case ACTIONS.SET_USER_CHALLENGES:
      return { ...state, userChallenges: action.payload, loading: false };
    
    case ACTIONS.SET_SELECTED_COL:
      return { ...state, selectedCol: action.payload };
    
    case ACTIONS.SET_SHOW_COL_DETAILS:
      return { ...state, showColDetails: action.payload };
    
    case ACTIONS.SET_WEATHER_DATA:
      return { 
        ...state, 
        weatherData: { 
          ...state.weatherData, 
          [action.payload.colId]: action.payload.data 
        } 
      };
    
    case ACTIONS.SET_USER_COMPLETED_COLS:
      return { ...state, userCompletedCols: action.payload };
    
    case ACTIONS.SET_SCHEDULED_ASCENTS:
      return { ...state, scheduledAscents: action.payload };
    
    case ACTIONS.SET_SCHEDULE_DIALOG:
      return { 
        ...state, 
        showScheduleDialog: action.payload.show,
        scheduleColId: action.payload.colId || state.scheduleColId,
        scheduleColName: action.payload.colName || state.scheduleColName
      };
    
    case ACTIONS.ADD_SCHEDULED_ASCENT:
      return {
        ...state,
        scheduledAscents: {
          ...state.scheduledAscents,
          [action.payload.colId]: action.payload.date
        }
      };
    
    case ACTIONS.SET_COMMUNITY_FILTER:
      return { ...state, communityFilter: action.payload };
    
    case ACTIONS.SET_COMMUNITY_SEARCH:
      return { ...state, communitySearch: action.payload };
    
    case ACTIONS.SET_COMMUNITY_LIKES:
      return { ...state, communityLikes: action.payload };
    
    case ACTIONS.TOGGLE_LIKE_CHALLENGE:
      return {
        ...state,
        communityLikes: {
          ...state.communityLikes,
          [action.payload]: !state.communityLikes[action.payload]
        }
      };
    
    case ACTIONS.LOAD_CHALLENGE:
      return {
        ...state,
        challengeName: action.payload.name,
        selectedCols: action.payload.cols,
        isPublic: action.payload.isPublic || false,
        activeTab: 1 // Basculer vers l'onglet "Mon défi"
      };
    
    case ACTIONS.CLEAR_SELECTION:
      return {
        ...state,
        selectedCols: [],
        challengeName: "Mon défi des 7 Majeurs",
        isPublic: false
      };
    
    case ACTIONS.SET_NOTIFICATION:
      return { ...state, notification: action.payload };
    
    case ACTIONS.CLEAR_NOTIFICATION:
      return { ...state, notification: null };
    
    case ACTIONS.SET_EXPORT_FORMAT:
      return { ...state, exportFormat: action.payload };
    
    default:
      return state;
  }
};

// Provider du contexte
export const ChallengeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(challengeReducer, initialState);
  const { isAuthenticated, user } = useAuth();
  
  // Fonctions d'effet de bord
  
  // Charger les données des cols avec pagination
  const fetchColsData = async () => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      const response = await axios.get('/api/european-cols', {
        params: {
          page: state.page,
          limit: state.rowsPerPage,
          search: state.filters.searchQuery,
          region: state.filters.region,
          country: state.filters.country,
          minAltitude: state.filters.minAltitude,
          maxAltitude: state.filters.maxAltitude,
          difficulty: state.filters.difficulty
        }
      });
      
      dispatch({ type: ACTIONS.SET_ALL_COLS, payload: response.data.items });
      dispatch({ type: ACTIONS.SET_TOTAL_ITEMS, payload: response.data.total });
    } catch (err) {
      console.error('Erreur lors du chargement des cols:', err);
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: 'Impossible de charger les données des cols. Veuillez réessayer plus tard.' 
      });
    }
  };
  
  // Charger les défis prédéfinis
  const fetchPredefinedChallenges = async () => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      const response = await axios.get('/api/predefined-challenges');
      dispatch({ type: ACTIONS.SET_PREDEFINED_CHALLENGES, payload: response.data });
    } catch (err) {
      console.error('Erreur lors du chargement des défis prédéfinis:', err);
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: 'Impossible de charger les défis prédéfinis. Veuillez réessayer plus tard.' 
      });
    }
  };
  
  // Charger les défis de l'utilisateur
  const fetchUserChallenges = async () => {
    if (!isAuthenticated) return;
    
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      const response = await axios.get('/api/user-challenges');
      dispatch({ type: ACTIONS.SET_USER_CHALLENGES, payload: response.data });
    } catch (err) {
      console.error('Erreur lors du chargement des défis utilisateur:', err);
      dispatch({ 
        type: ACTIONS.SET_ERROR, 
        payload: 'Impossible de charger vos défis. Veuillez réessayer plus tard.' 
      });
    }
  };
  
  // Charger les cols complétés par l'utilisateur
  const fetchCompletedCols = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await axios.get('/api/user-completed-cols');
      dispatch({ type: ACTIONS.SET_USER_COMPLETED_COLS, payload: response.data.map(item => item.colId) });
    } catch (err) {
      console.error('Erreur lors du chargement des cols complétés:', err);
    }
  };
  
  // Charger les ascensions programmées
  const fetchScheduledAscents = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await axios.get('/api/scheduled-ascents');
      
      // Transformer le tableau en objet { colId: date }
      const scheduledMap = response.data.reduce((acc, item) => {
        acc[item.colId] = item.date;
        return acc;
      }, {});
      
      dispatch({ type: ACTIONS.SET_SCHEDULED_ASCENTS, payload: scheduledMap });
    } catch (err) {
      console.error('Erreur lors du chargement des ascensions programmées:', err);
    }
  };
  
  // Sauvegarder un défi personnalisé
  const saveChallenge = async () => {
    if (!isAuthenticated || state.selectedCols.length === 0) return;
    
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true });
      
      const challengeData = {
        name: state.challengeName,
        cols: state.selectedCols.map(col => col.id),
        isPublic: state.isPublic
      };
      
      await axios.post('/api/user-challenges', challengeData);
      
      // Rafraîchir la liste des défis
      await fetchUserChallenges();
      
      dispatch({ 
        type: ACTIONS.SET_NOTIFICATION, 
        payload: {
          message: 'Défi sauvegardé avec succès!',
          severity: 'success'
        }
      });
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du défi:', err);
      dispatch({ 
        type: ACTIONS.SET_NOTIFICATION, 
        payload: {
          message: 'Impossible de sauvegarder le défi. Veuillez réessayer plus tard.',
          severity: 'error'
        } 
      });
    } finally {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    }
  };
  
  // Marquer un col comme complété
  const markColAsCompleted = async (colId) => {
    if (!isAuthenticated) return;
    
    try {
      await axios.post('/api/user-completed-cols', { colId });
      
      // Mettre à jour la liste des cols complétés
      dispatch({ 
        type: ACTIONS.SET_USER_COMPLETED_COLS, 
        payload: [...state.userCompletedCols, colId]
      });
      
      dispatch({ 
        type: ACTIONS.SET_NOTIFICATION, 
        payload: {
          message: 'Col marqué comme conquis!',
          severity: 'success'
        }
      });
    } catch (err) {
      console.error('Erreur lors du marquage du col:', err);
      dispatch({ 
        type: ACTIONS.SET_NOTIFICATION, 
        payload: {
          message: 'Impossible de marquer le col comme complété. Veuillez réessayer plus tard.',
          severity: 'error'
        } 
      });
    }
  };
  
  // Planifier une ascension
  const scheduleAscent = async (date) => {
    if (!isAuthenticated || !state.scheduleColId) return;
    
    try {
      await axios.post('/api/scheduled-ascents', {
        colId: state.scheduleColId,
        date: date
      });
      
      // Mettre à jour la liste des ascensions programmées
      dispatch({ 
        type: ACTIONS.ADD_SCHEDULED_ASCENT, 
        payload: {
          colId: state.scheduleColId,
          date: date
        }
      });
      
      dispatch({ 
        type: ACTIONS.SET_NOTIFICATION, 
        payload: {
          message: 'Ascension programmée!',
          severity: 'success'
        }
      });
      
      // Fermer la boîte de dialogue
      dispatch({ 
        type: ACTIONS.SET_SCHEDULE_DIALOG, 
        payload: {
          show: false
        }
      });
    } catch (err) {
      console.error('Erreur lors de la programmation de l\'ascension:', err);
      dispatch({ 
        type: ACTIONS.SET_NOTIFICATION, 
        payload: {
          message: 'Impossible de programmer l\'ascension. Veuillez réessayer plus tard.',
          severity: 'error'
        } 
      });
    }
  };
  
  // Récupérer les données météo pour un col
  const fetchWeatherData = async (colId, lat, lng) => {
    try {
      const response = await axios.get(`/api/weather?lat=${lat}&lng=${lng}`);
      
      dispatch({ 
        type: ACTIONS.SET_WEATHER_DATA, 
        payload: {
          colId,
          data: response.data
        }
      });
    } catch (err) {
      console.error('Erreur lors de la récupération des données météo:', err);
    }
  };
  
  // Supprimer un défi utilisateur
  const deleteChallenge = async (challengeId) => {
    if (!isAuthenticated) return;
    
    try {
      await axios.delete(`/api/user-challenges/${challengeId}`);
      
      // Rafraîchir la liste des défis
      await fetchUserChallenges();
      
      dispatch({ 
        type: ACTIONS.SET_NOTIFICATION, 
        payload: {
          message: 'Défi supprimé avec succès!',
          severity: 'success'
        }
      });
    } catch (err) {
      console.error('Erreur lors de la suppression du défi:', err);
      dispatch({ 
        type: ACTIONS.SET_NOTIFICATION, 
        payload: {
          message: 'Impossible de supprimer le défi. Veuillez réessayer plus tard.',
          severity: 'error'
        } 
      });
    }
  };
  
  // "Like" un défi communautaire
  const likeChallenge = async (challengeId) => {
    if (!isAuthenticated) return;
    
    try {
      // Inverser l'état du like
      const isLiked = state.communityLikes[challengeId];
      
      await axios.post(`/api/challenges/${challengeId}/like`, { like: !isLiked });
      
      dispatch({ type: ACTIONS.TOGGLE_LIKE_CHALLENGE, payload: challengeId });
    } catch (err) {
      console.error('Erreur lors du like/unlike:', err);
    }
  };
  
  // Exporter un parcours
  const exportTrack = async (colId, format) => {
    try {
      const response = await axios.get(`/api/cols/${colId}/export?format=${format}`, {
        responseType: 'blob'
      });
      
      // Créer un URL pour le blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Créer un lien temporaire
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `col_${colId}.${format}`);
      
      // Ajouter au document
      document.body.appendChild(link);
      
      // Cliquer sur le lien
      link.click();
      
      // Nettoyer
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erreur lors de l\'exportation du parcours:', err);
      dispatch({ 
        type: ACTIONS.SET_NOTIFICATION, 
        payload: {
          message: 'Impossible d\'exporter le parcours. Veuillez réessayer plus tard.',
          severity: 'error'
        } 
      });
    }
  };
  
  // Effets pour le chargement initial des données
  useEffect(() => {
    fetchColsData();
  }, [state.page, state.rowsPerPage, state.filters]);
  
  useEffect(() => {
    fetchPredefinedChallenges();
  }, []);
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserChallenges();
      fetchCompletedCols();
      fetchScheduledAscents();
    }
  }, [isAuthenticated]);
  
  // Préparer l'objet de valeur du contexte
  const value = {
    ...state,
    dispatch,
    actions: ACTIONS,
    
    // Actions d'effet de bord
    fetchColsData,
    fetchPredefinedChallenges,
    fetchUserChallenges,
    fetchCompletedCols,
    fetchScheduledAscents,
    fetchWeatherData,
    saveChallenge,
    markColAsCompleted,
    scheduleAscent,
    deleteChallenge,
    likeChallenge,
    exportTrack,
    
    // Actions simplifiées pour les composants
    selectCol: (col) => dispatch({ type: ACTIONS.SELECT_COL, payload: col }),
    removeCol: (colId) => dispatch({ type: ACTIONS.REMOVE_COL, payload: colId }),
    setChallengeName: (name) => dispatch({ type: ACTIONS.SET_CHALLENGE_NAME, payload: name }),
    setIsPublic: (isPublic) => dispatch({ type: ACTIONS.SET_IS_PUBLIC, payload: isPublic }),
    setActiveTab: (tab) => dispatch({ type: ACTIONS.SET_ACTIVE_TAB, payload: tab }),
    viewColDetails: (col) => {
      dispatch({ type: ACTIONS.SET_SELECTED_COL, payload: col });
      dispatch({ type: ACTIONS.SET_SHOW_COL_DETAILS, payload: true });
      if (col && col.latitude && col.longitude) {
        fetchWeatherData(col.id, col.latitude, col.longitude);
      }
    },
    closeColDetails: () => dispatch({ type: ACTIONS.SET_SHOW_COL_DETAILS, payload: false }),
    showScheduleDialog: (colId, colName) => dispatch({ 
      type: ACTIONS.SET_SCHEDULE_DIALOG, 
      payload: { show: true, colId, colName } 
    }),
    closeScheduleDialog: () => dispatch({ 
      type: ACTIONS.SET_SCHEDULE_DIALOG, 
      payload: { show: false } 
    }),
    setCommunityFilter: (filter) => dispatch({ type: ACTIONS.SET_COMMUNITY_FILTER, payload: filter }),
    setCommunitySearch: (search) => dispatch({ type: ACTIONS.SET_COMMUNITY_SEARCH, payload: search }),
    loadChallenge: (challenge) => dispatch({ type: ACTIONS.LOAD_CHALLENGE, payload: challenge }),
    clearSelection: () => dispatch({ type: ACTIONS.CLEAR_SELECTION }),
    setNotification: (notification) => dispatch({ type: ACTIONS.SET_NOTIFICATION, payload: notification }),
    clearNotification: () => dispatch({ type: ACTIONS.CLEAR_NOTIFICATION }),
    setExportFormat: (format) => dispatch({ type: ACTIONS.SET_EXPORT_FORMAT, payload: format }),
    setPage: (page) => dispatch({ type: ACTIONS.SET_PAGE, payload: page }),
    setFilters: (filters) => dispatch({ type: ACTIONS.SET_FILTERS, payload: filters })
  };
  
  return (
    <ChallengeContext.Provider value={value}>
      {children}
    </ChallengeContext.Provider>
  );
};

// Hook custom pour utiliser le contexte
export const useChallenge = () => {
  const context = useContext(ChallengeContext);
  if (context === undefined) {
    throw new Error('useChallenge must be used within a ChallengeProvider');
  }
  return context;
};

export default ChallengeContext;
