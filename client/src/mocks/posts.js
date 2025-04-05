/**
 * Données mockées pour les posts sociaux
 */

const mockPosts = [
  {
    id: 'post-1',
    user: {
      id: 'user-123',
      name: 'Jean Dupont',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    content: 'Belle sortie aujourd\'hui dans les Vosges ! Le Col de la Schlucht était magnifique avec la vue sur la vallée.',
    timestamp: '2025-04-02T10:30:00Z',
    likes: 24,
    comments: [],
    userLiked: true,
    type: 'ride',
    activity: {
      title: 'Ascension Col de la Schlucht',
      distance: 68.5,
      duration: '3h 45min',
      elevationGain: 1250
    }
  },
  {
    id: 'post-2',
    user: {
      id: 'user-456',
      name: 'Marie Durand',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    content: 'J\'ai trouvé ce nouveau parcours autour de Strasbourg, parfait pour une sortie du dimanche matin !',
    timestamp: '2025-04-01T18:45:00Z',
    likes: 15,
    comments: [],
    userLiked: false,
    type: 'route',
    route: {
      name: 'Boucle Strasbourg - Kehl',
      distance: 42,
      elevationGain: 320,
      difficulty: 'Facile'
    }
  },
  {
    id: 'post-3',
    user: {
      id: 'user-789',
      name: 'Thomas Petit',
      avatar: 'https://randomuser.me/api/portraits/men/67.jpg'
    },
    content: 'Qui participe à la "Cyclotour du Grand Est" le mois prochain ? On pourrait former une équipe !',
    timestamp: '2025-03-31T09:15:00Z',
    likes: 31,
    comments: [],
    userLiked: false,
    type: 'event'
  },
  {
    id: 'post-4',
    user: {
      id: 'user-123',
      name: 'Jean Dupont',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    content: 'Le lever de soleil ce matin sur le Mont Saint-Odile était incroyable. Ça valait bien le départ à 5h !',
    timestamp: '2025-03-30T07:30:00Z',
    likes: 42,
    comments: [],
    userLiked: false,
    type: 'photo',
    images: ['https://i.imgur.com/aFTKGYV.jpg']
  },
  {
    id: 'post-5',
    user: {
      id: 'user-456',
      name: 'Marie Durand',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    content: 'Aujourd\'hui c\'était journée préparation physique avec mon coach. Travailler la force est essentiel même pour le cyclisme !',
    timestamp: '2025-03-29T15:20:00Z',
    likes: 18,
    comments: [],
    userLiked: true,
    type: 'training'
  },
  {
    id: 'post-6',
    user: {
      id: 'user-789',
      name: 'Thomas Petit',
      avatar: 'https://randomuser.me/api/portraits/men/67.jpg'
    },
    content: 'Nouveau vélo jour ! Tellement heureux de ma nouvelle acquisition, j\'ai hâte de l\'essayer ce weekend.',
    timestamp: '2025-03-28T12:00:00Z',
    likes: 56,
    comments: [],
    userLiked: true,
    type: 'photo',
    images: ['https://i.imgur.com/QpBj8tO.jpg']
  }
];

export default mockPosts;
