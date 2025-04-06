import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNotification } from '../components/common/NotificationSystem';
import { useFeatureFlags } from '../services/featureFlags';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

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
  badges: [
    { id: 'badge1', name: 'Grimpeur', icon: 'mountain', description: 'A gravi plus de 10 cols', date: '2025-01-15' },
    { id: 'badge2', name: 'Social', icon: 'people', description: 'A participé à 5 événements communautaires', date: '2025-02-28' },
    { id: 'badge3', name: 'Expert', icon: 'star', description: 'A contribué à 20 discussions du forum', date: '2025-03-10' }
  ],
  socialAccounts: {
    strava: 'jeandupont',
    twitter: 'jean_cyclist',
    instagram: 'jean.cyclisme'
  }
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
  popularRegions: [
    { name: 'Alsace', count: 543 },
    { name: 'Alpes', count: 892 },
    { name: 'Pyrénées', count: 746 },
    { name: 'Vosges', count: 328 },
    { name: 'Jura', count: 215 }
  ]
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

// Mock des forums
const mockForums = [
  {
    id: 'forum-region-alpes',
    type: 'region',
    name: 'Alpes',
    description: 'Forum dédié aux cyclistes des Alpes',
    topicCount: 124,
    lastActivity: '2025-04-06T10:45:00Z'
  },
  {
    id: 'forum-region-pyrenees',
    type: 'region',
    name: 'Pyrénées',
    description: 'Forum dédié aux cyclistes des Pyrénées',
    topicCount: 98,
    lastActivity: '2025-04-05T16:20:00Z'
  },
  {
    id: 'forum-region-vosges',
    type: 'region',
    name: 'Vosges',
    description: 'Forum dédié aux cyclistes des Vosges',
    topicCount: 57,
    lastActivity: '2025-04-02T08:15:00Z'
  },
  {
    id: 'forum-discipline-road',
    type: 'discipline',
    name: 'Cyclisme sur route',
    description: 'Discussions sur le cyclisme sur route',
    topicCount: 215,
    lastActivity: '2025-04-06T14:30:00Z'
  },
  {
    id: 'forum-discipline-gravel',
    type: 'discipline',
    name: 'Gravel',
    description: 'Discussions sur le cyclisme gravel',
    topicCount: 84,
    lastActivity: '2025-04-04T09:10:00Z'
  },
  {
    id: 'forum-discipline-endurance',
    type: 'discipline',
    name: 'Endurance',
    description: 'Forum pour les amateurs de longues distances',
    topicCount: 76,
    lastActivity: '2025-04-03T11:45:00Z'
  }
];

// Mock des sujets de forum
const mockForumTopics = [
  {
    id: 'topic-1',
    forumId: 'forum-region-alpes',
    title: 'Meilleure période pour l\'ascension du Col du Galibier',
    author: {
      id: '123',
      name: 'Jean Dupont',
      avatar: '/images/profiles/default-avatar.jpg'
    },
    createdAt: '2025-04-01T08:30:00Z',
    replies: 24,
    views: 342,
    lastReply: {
      authorName: 'Marie Martin',
      date: '2025-04-05T14:20:00Z'
    },
    pinned: true,
    locked: false
  },
  {
    id: 'topic-2',
    forumId: 'forum-region-alpes',
    title: 'Boucle des Grandes Alpes en 5 jours',
    author: {
      id: '456',
      name: 'Pierre Lambert',
      avatar: '/images/profiles/user2.jpg'
    },
    createdAt: '2025-03-28T15:45:00Z',
    replies: 18,
    views: 276,
    lastReply: {
      authorName: 'Jean Dupont',
      date: '2025-04-04T10:15:00Z'
    },
    pinned: false,
    locked: false
  }
];

// Mock des messages directs
const mockMessages = [
  {
    conversationId: 'conv-1',
    participants: [
      { id: '123', name: 'Jean Dupont', avatar: '/images/profiles/default-avatar.jpg' },
      { id: '456', name: 'Marie Martin', avatar: '/images/profiles/user2.jpg' }
    ],
    messages: [
      { id: 'msg-1', senderId: '456', text: 'Salut Jean, as-tu déjà fait la montée du Mont Ventoux?', timestamp: '2025-04-01T14:30:00Z', read: true },
      { id: 'msg-2', senderId: '123', text: 'Oui, plusieurs fois! C\'est un col mythique.', timestamp: '2025-04-01T14:35:00Z', read: true },
      { id: 'msg-3', senderId: '456', text: 'Super! Je prévois d\'y aller le mois prochain. Des conseils?', timestamp: '2025-04-01T14:38:00Z', read: true },
      { id: 'msg-4', senderId: '123', text: 'Commence tôt le matin pour éviter la chaleur, et prends suffisamment d\'eau!', timestamp: '2025-04-01T14:42:00Z', read: true }
    ],
    lastActivity: '2025-04-01T14:42:00Z',
    unreadCount: 0
  },
  {
    conversationId: 'conv-2',
    participants: [
      { id: '123', name: 'Jean Dupont', avatar: '/images/profiles/default-avatar.jpg' },
      { id: '789', name: 'Lucas Bernard', avatar: '/images/profiles/user3.jpg' }
    ],
    messages: [
      { id: 'msg-5', senderId: '789', text: 'Bonjour Jean, je suis nouveau dans la communauté.', timestamp: '2025-04-05T09:15:00Z', read: true },
      { id: 'msg-6', senderId: '123', text: 'Bienvenue Lucas! N\'hésite pas si tu as des questions.', timestamp: '2025-04-05T09:20:00Z', read: true },
      { id: 'msg-7', senderId: '789', text: 'Merci! Tu participes à l\'événement Col de la Schlucht?', timestamp: '2025-04-05T09:25:00Z', read: false }
    ],
    lastActivity: '2025-04-05T09:25:00Z',
    unreadCount: 1
  }
];

// Mock des itinéraires partagés
const mockSharedRoutes = [
  {
    id: 'route-1',
    title: 'Tour du Mont Blanc',
    author: {
      id: '123',
      name: 'Jean Dupont',
      avatar: '/images/profiles/default-avatar.jpg'
    },
    description: 'Magnifique parcours autour du Mont Blanc traversant trois pays.',
    distance: 170,
    elevation: 8000,
    duration: '3 jours',
    difficulty: 'Difficile',
    createdAt: '2025-03-20T10:15:00Z',
    images: ['/images/routes/mont-blanc1.jpg', '/images/routes/mont-blanc2.jpg'],
    colsIncluded: ['Col du Grand-Saint-Bernard', 'Col de la Forclaz', 'Col des Montets'],
    likes: 45,
    downloads: 28,
    comments: 12
  },
  {
    id: 'route-2',
    title: 'Les Trois Ballons',
    author: {
      id: '456',
      name: 'Marie Martin',
      avatar: '/images/profiles/user2.jpg'
    },
    description: 'Parcours exigeant dans les Vosges avec trois ascensions majeures.',
    distance: 120,
    elevation: 3500,
    duration: '1 jour',
    difficulty: 'Modéré',
    createdAt: '2025-03-25T16:30:00Z',
    images: ['/images/routes/trois-ballons.jpg'],
    colsIncluded: ['Grand Ballon', 'Ballon d\'Alsace', 'Ballon de Servance'],
    likes: 32,
    downloads: 19,
    comments: 8
  }
];

// Composant Provider qui fournit le contexte
export const CommunityProvider = ({ children }) => {
  // Systèmes externes
  const { notify } = useNotification();
  const { isEnabled } = useFeatureFlags();
  const { isAuthenticated, user } = useAuth();
  
  // États
  const [userProfile, setUserProfile] = useState(mockUserProfile);
  const [communityStats, setCommunityStats] = useState(mockCommunityStats);
  const [upcomingEvents, setUpcomingEvents] = useState(mockUpcomingEvents);
  const [forums, setForums] = useState(mockForums);
  const [forumTopics, setForumTopics] = useState(mockForumTopics);
  const [messages, setMessages] = useState(mockMessages);
  const [sharedRoutes, setSharedRoutes] = useState(mockSharedRoutes);
  const [notifications, setNotifications] = useState([]);
  const [rankings, setRankings] = useState({
    global: [],
    regional: {},
    discipline: {}
  });
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
        setForums(mockForums);
        setForumTopics(mockForumTopics);
        setMessages(mockMessages);
        setSharedRoutes(mockSharedRoutes);
        
        // Vérifier si les défis mensuels sont activés via feature flag
        if (isEnabled('enableMonthlyChallenge')) {
          setUpcomingEvents(mockUpcomingEvents);
        } else {
          // Si le feature flag est désactivé, filtrer les défis mensuels
          setUpcomingEvents(mockUpcomingEvents.filter(event => !event.title.includes('Mensuel')));
        }
        
        // Générer des classements
        const mockGlobalRankings = Array.from({ length: 100 }, (_, i) => ({
          rank: i + 1,
          userId: `user-${i + 1}`,
          name: `User ${i + 1}`,
          points: Math.floor(10000 - i * 35 + Math.random() * 20),
          level: Math.max(1, Math.floor(10 - i / 15)),
          avatar: `/images/profiles/user${(i % 5) + 1}.jpg`
        }));
        
        setRankings({
          global: mockGlobalRankings,
          regional: {
            'Alsace': mockGlobalRankings.slice(0, 50).map(user => ({ ...user, region: 'Alsace' })),
            'Alpes': mockGlobalRankings.slice(10, 60).map(user => ({ ...user, region: 'Alpes' }))
          },
          discipline: {
            'road': mockGlobalRankings.slice(5, 55).map(user => ({ ...user, discipline: 'road' })),
            'gravel': mockGlobalRankings.slice(15, 65).map(user => ({ ...user, discipline: 'gravel' }))
          }
        });
        
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
            ? { ...event, joined: true, participants: event.participants + 1 } 
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
            ? { ...event, joined: false, participants: event.participants - 1 } 
            : event
        )
      );
      notify.info(`Vous avez quitté l'événement`);
    } catch (error) {
      notify.error('Impossible de quitter l\'événement', error);
    }
  };

  // Fonction pour créer un événement
  const createEvent = (eventData) => {
    try {
      const newEvent = {
        id: `event-${Date.now()}`,
        ...eventData,
        participants: 1,
        joined: true,
        organizer: userProfile.fullName
      };
      
      setUpcomingEvents(prevEvents => [newEvent, ...prevEvents]);
      notify.success('Événement créé avec succès');
      return newEvent;
    } catch (error) {
      notify.error('Erreur lors de la création de l\'événement', error);
      throw error;
    }
  };

  // Fonction pour créer un sujet de forum
  const createForumTopic = (forumId, topicData) => {
    try {
      const newTopic = {
        id: `topic-${Date.now()}`,
        forumId,
        author: {
          id: userProfile.id,
          name: userProfile.fullName,
          avatar: userProfile.avatar
        },
        createdAt: new Date().toISOString(),
        replies: 0,
        views: 0,
        lastReply: null,
        pinned: false,
        locked: false,
        ...topicData
      };
      
      setForumTopics(prevTopics => [newTopic, ...prevTopics]);
      
      // Mettre à jour le compteur de sujets du forum
      setForums(prevForums => 
        prevForums.map(forum => 
          forum.id === forumId 
            ? { 
                ...forum, 
                topicCount: forum.topicCount + 1,
                lastActivity: new Date().toISOString()
              } 
            : forum
        )
      );
      
      notify.success('Sujet créé avec succès');
      return newTopic;
    } catch (error) {
      notify.error('Erreur lors de la création du sujet', error);
      throw error;
    }
  };

  // Fonction pour répondre à un sujet
  const replyToTopic = (topicId, replyData) => {
    try {
      // Dans une implémentation réelle, ceci serait un appel API
      // Pour l'instant, on simule juste la mise à jour du compteur de réponses
      setForumTopics(prevTopics => 
        prevTopics.map(topic => 
          topic.id === topicId 
            ? { 
                ...topic, 
                replies: topic.replies + 1,
                lastReply: {
                  authorName: userProfile.fullName,
                  date: new Date().toISOString()
                }
              } 
            : topic
        )
      );
      
      notify.success('Réponse publiée avec succès');
      return true;
    } catch (error) {
      notify.error('Erreur lors de la publication de la réponse', error);
      throw error;
    }
  };

  // Fonction pour envoyer un message direct
  const sendDirectMessage = (recipientId, messageContent) => {
    try {
      const now = new Date().toISOString();
      const existingConversation = messages.find(conv => 
        conv.participants.some(p => p.id === recipientId) && 
        conv.participants.some(p => p.id === userProfile.id)
      );
      
      if (existingConversation) {
        // Ajouter à une conversation existante
        const newMessage = {
          id: `msg-${Date.now()}`,
          senderId: userProfile.id,
          text: messageContent,
          timestamp: now,
          read: false
        };
        
        setMessages(prevMessages => 
          prevMessages.map(conv => 
            conv.conversationId === existingConversation.conversationId 
              ? { 
                  ...conv, 
                  messages: [...conv.messages, newMessage],
                  lastActivity: now,
                  unreadCount: conv.unreadCount + (conv.senderId === recipientId ? 1 : 0)
                } 
              : conv
          )
        );
      } else {
        // Créer une nouvelle conversation
        const recipient = {
          id: recipientId,
          name: 'Destinataire', // Dans une vraie implémentation, on récupérerait les infos du destinataire
          avatar: '/images/profiles/default-avatar.jpg'
        };
        
        const newConversation = {
          conversationId: `conv-${Date.now()}`,
          participants: [
            {
              id: userProfile.id,
              name: userProfile.fullName,
              avatar: userProfile.avatar
            },
            recipient
          ],
          messages: [
            {
              id: `msg-${Date.now()}`,
              senderId: userProfile.id,
              text: messageContent,
              timestamp: now,
              read: false
            }
          ],
          lastActivity: now,
          unreadCount: 0
        };
        
        setMessages(prevMessages => [newConversation, ...prevMessages]);
      }
      
      notify.success('Message envoyé avec succès');
      return true;
    } catch (error) {
      notify.error('Erreur lors de l\'envoi du message', error);
      throw error;
    }
  };

  // Fonction pour marquer les messages comme lus
  const markMessagesAsRead = (conversationId) => {
    try {
      setMessages(prevMessages => 
        prevMessages.map(conv => 
          conv.conversationId === conversationId 
            ? { 
                ...conv, 
                messages: conv.messages.map(msg => ({ ...msg, read: true })),
                unreadCount: 0
              } 
            : conv
        )
      );
      return true;
    } catch (error) {
      notify.error('Erreur lors de la mise à jour des messages', error);
      throw error;
    }
  };

  // Fonction pour partager un itinéraire
  const shareRoute = (routeData) => {
    try {
      const newRoute = {
        id: `route-${Date.now()}`,
        author: {
          id: userProfile.id,
          name: userProfile.fullName,
          avatar: userProfile.avatar
        },
        createdAt: new Date().toISOString(),
        likes: 0,
        downloads: 0,
        comments: 0,
        ...routeData
      };
      
      setSharedRoutes(prevRoutes => [newRoute, ...prevRoutes]);
      notify.success('Itinéraire partagé avec succès');
      return newRoute;
    } catch (error) {
      notify.error('Erreur lors du partage de l\'itinéraire', error);
      throw error;
    }
  };

  // Fonction pour liker un itinéraire
  const likeRoute = (routeId) => {
    try {
      setSharedRoutes(prevRoutes => 
        prevRoutes.map(route => 
          route.id === routeId 
            ? { ...route, likes: route.likes + 1 } 
            : route
        )
      );
      return true;
    } catch (error) {
      notify.error('Erreur lors de l\'ajout du like', error);
      throw error;
    }
  };

  // Fonction pour signaler un contenu
  const reportContent = (contentType, contentId, reason) => {
    try {
      // Dans une implémentation réelle, ceci serait un appel API
      notify.success('Contenu signalé avec succès. Notre équipe de modération va examiner ce signalement.');
      return true;
    } catch (error) {
      notify.error('Erreur lors du signalement du contenu', error);
      throw error;
    }
  };

  // Fonction pour connecter un compte social
  const connectSocialAccount = (platform, accountInfo) => {
    try {
      setUserProfile(prevProfile => ({
        ...prevProfile,
        socialAccounts: {
          ...prevProfile.socialAccounts,
          [platform]: accountInfo
        }
      }));
      notify.success(`Compte ${platform} connecté avec succès`);
      return true;
    } catch (error) {
      notify.error(`Erreur lors de la connexion du compte ${platform}`, error);
      throw error;
    }
  };

  // Valeur du contexte à exposer
  const value = {
    userProfile,
    communityStats,
    upcomingEvents,
    forums,
    forumTopics,
    messages,
    sharedRoutes,
    rankings,
    notifications,
    loading,
    error,
    // Méthodes de base
    formatDate,
    // Gestion des événements
    handleJoinEvent,
    handleLeaveEvent,
    createEvent,
    // Gestion des forums
    createForumTopic,
    replyToTopic,
    // Messagerie
    sendDirectMessage,
    markMessagesAsRead,
    // Partage d'itinéraires
    shareRoute,
    likeRoute,
    // Modération
    reportContent,
    // Intégration sociale
    connectSocialAccount,
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
