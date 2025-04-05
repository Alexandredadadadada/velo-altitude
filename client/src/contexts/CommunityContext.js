import React, { createContext, useState, useContext, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNotification } from '../components/common/NotificationSystem';
import { useFeatureFlags } from '../services/featureFlags';

// Création du contexte
export const CommunityContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useCommunity = () => {
  const context = useContext(CommunityContext);
  if (!context) {
    throw new Error('useCommunity doit être utilisé à l\'intérieur d\'un CommunityProvider');
  }
  return context;
};

// Données de démonstration
const mockUserProfile = {
  id: '123',
  username: 'cycliste_passionné',
  fullName: 'Jean Dupont',
  following: 145,
  followers: 89,
  achievementCount: 27,
  points: 3450,
  level: 7,
  region: 'Alsace',
  avatar: '/images/profiles/default-avatar.jpg',
};

const mockCommunityStats = {
  totalMembers: 5432,
  activeMembers: 1284,
  yourRank: 172,
  activeChallenges: 14,
  yourChallenges: 5,
  totalChallenges: 48,
  regionRiders: 412,
  weeklyActivity: [35, 42, 28, 45, 51, 63, 47],
};

const mockUpcomingEvents = [
  {
    id: '1',
    title: 'Randonnée Col de la Schlucht',
    date: '2025-04-18',
    time: '09:00',
    location: 'Munster, Haut-Rhin',
    distance: 95,
    elevation: 1200,
    participants: 47,
    organizer: 'Club Cycliste du Haut-Rhin',
    joined: true,
    description: 'Randonnée cycliste à travers la vallée de Munster et montée du Col de la Schlucht.'
  },
  {
    id: '2',
    title: 'Montée du Grand Ballon',
    date: '2025-05-02',
    time: '10:30',
    location: 'Thann, Haut-Rhin',
    distance: 75,
    elevation: 1424,
    participants: 32,
    organizer: 'Cyclomontagnards d\'Alsace',
    joined: false,
    description: 'Défi d\'ascension du Grand Ballon, le point culminant des Vosges.'
  },
  {
    id: '3',
    title: 'Boucle des Trois Frontières',
    date: '2025-05-15',
    time: '08:00',
    location: 'Saint-Louis, Haut-Rhin',
    distance: 110,
    elevation: 850,
    participants: 28,
    organizer: 'Vélo Club Transfrontalier',
    joined: false,
    description: 'Parcours à travers la France, l\'Allemagne et la Suisse avec découverte de paysages variés.'
  }
];

// Composant Provider qui fournit le contexte
export const CommunityProvider = ({ children }) => {
  // Systèmes externes
  const { notify } = useNotification();
  const { isEnabled } = useFeatureFlags();
  
  // États
  const [userProfile, setUserProfile] = useState(mockUserProfile);
  const [communityStats, setCommunityStats] = useState(mockCommunityStats);
  const [upcomingEvents, setUpcomingEvents] = useState(mockUpcomingEvents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Effet pour charger les données (simulation)
  useEffect(() => {
    // Dans une application réelle, charger les données depuis l'API
    setLoading(true);
    
    try {
      // Simuler un délai de chargement
      const timer = setTimeout(() => {
        setUserProfile(mockUserProfile);
        setCommunityStats(mockCommunityStats);
        
        // Vérifier si les défis mensuels sont activés via feature flag
        if (isEnabled('enableMonthlyChallenge')) {
          setUpcomingEvents(mockUpcomingEvents);
        } else {
          // Si le feature flag est désactivé, filtrer les défis mensuels
          setUpcomingEvents(mockUpcomingEvents.filter(event => !event.title.includes('Mensuel')));
        }
        
        setLoading(false);
      }, 800);
      
      return () => clearTimeout(timer);
    } catch (error) {
      setError(error);
      setLoading(false);
      notify.error('Erreur lors du chargement des données communautaires', error);
    }
  }, [notify, isEnabled]);

  // Fonction pour formater une date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMM yyyy', { locale: fr });
    } catch (error) {
      console.error('Error formatting date:', error);
      notify.error('Erreur lors du formatage de la date', error);
      return dateString;
    }
  };

  // Fonction pour rejoindre un événement
  const handleJoinEvent = (eventId) => {
    try {
      setUpcomingEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { ...event, joined: true } 
            : event
        )
      );
      notify.success(`Vous avez rejoint l'événement avec succès`);
    } catch (error) {
      notify.error('Impossible de rejoindre l\'événement', error);
    }
  };

  // Fonction pour quitter un événement
  const handleLeaveEvent = (eventId) => {
    try {
      setUpcomingEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventId 
            ? { ...event, joined: false } 
            : event
        )
      );
      notify.info(`Vous avez quitté l'événement`);
    } catch (error) {
      notify.error('Impossible de quitter l\'événement', error);
    }
  };

  // Valeur du contexte à exposer
  const value = {
    userProfile,
    communityStats,
    upcomingEvents,
    loading,
    error,
    formatDate,
    handleJoinEvent,
    handleLeaveEvent,
    // Exposer les fonctions externes
    isFeatureEnabled: isEnabled
  };

  return (
    <CommunityContext.Provider value={value}>
      {children}
    </CommunityContext.Provider>
  );
};

export default CommunityProvider;
