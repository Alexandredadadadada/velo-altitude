/**
 * Données mockées pour les itinéraires d'un utilisateur
 */

const mockUserRoutes = [
  {
    id: 'user-route-1',
    name: 'Ma balade dominicale',
    description: 'Mon parcours préféré pour les sorties du dimanche matin avec une belle vue sur la cathédrale.',
    distance: 42.3,
    elevationGain: 350,
    difficulty: 'Facile',
    region: 'Alsace',
    type: 'Route',
    surface: 'Asphalte',
    createdBy: {
      id: 'user-123',
      name: 'Jean Dupont'
    },
    coordinates: [
      [48.580, 7.750],
      [48.590, 7.760],
      [48.600, 7.770],
      [48.595, 7.780]
    ],
    previewImage: 'https://i.imgur.com/dJKH5FG.jpg',
    favorites: 12,
    createdAt: '2024-09-15T08:30:00Z',
    updatedAt: '2024-12-08T14:20:00Z',
    isPublic: true
  },
  {
    id: 'user-route-2',
    name: 'Entraînement collineux',
    description: 'Parcours d\'entraînement avec plusieurs montées courtes pour travailler la puissance.',
    distance: 56.7,
    elevationGain: 820,
    difficulty: 'Intermédiaire',
    region: 'Alsace',
    type: 'Route',
    surface: 'Asphalte',
    createdBy: {
      id: 'user-123',
      name: 'Jean Dupont'
    },
    coordinates: [
      [48.570, 7.720],
      [48.580, 7.730],
      [48.590, 7.740],
      [48.585, 7.750]
    ],
    previewImage: 'https://i.imgur.com/xKCY53B.jpg',
    favorites: 8,
    createdAt: '2024-08-22T16:45:00Z',
    updatedAt: '2024-11-30T09:10:00Z',
    isPublic: true
  },
  {
    id: 'user-route-3',
    name: 'Sortie longue mensuelle',
    description: 'Mon parcours de fond pour la sortie longue du premier samedi du mois.',
    distance: 145.2,
    elevationGain: 1650,
    difficulty: 'Difficile',
    region: 'Alsace, Vosges',
    type: 'Route',
    surface: 'Asphalte',
    createdBy: {
      id: 'user-123',
      name: 'Jean Dupont'
    },
    coordinates: [
      [48.573, 7.752],
      [48.600, 7.800],
      [48.650, 7.850],
      [48.700, 7.900]
    ],
    previewImage: 'https://i.imgur.com/3W4NBKL.jpg',
    favorites: 19,
    createdAt: '2024-07-05T07:15:00Z',
    updatedAt: '2024-12-02T18:30:00Z',
    isPublic: true
  },
  {
    id: 'user-route-4',
    name: 'Récupération active',
    description: 'Parcours plat pour les jours de récupération active.',
    distance: 28.5,
    elevationGain: 120,
    difficulty: 'Facile',
    region: 'Alsace',
    type: 'Route',
    surface: 'Mixte',
    createdBy: {
      id: 'user-123',
      name: 'Jean Dupont'
    },
    coordinates: [
      [48.570, 7.750],
      [48.575, 7.760],
      [48.580, 7.770],
      [48.575, 7.780]
    ],
    previewImage: 'https://i.imgur.com/2TsUmFJ.jpg',
    favorites: 5,
    createdAt: '2024-10-10T14:30:00Z',
    updatedAt: '2024-11-25T11:45:00Z',
    isPublic: false
  }
];

export default mockUserRoutes;
