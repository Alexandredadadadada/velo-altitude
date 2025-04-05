/**
 * Données mockées pour les itinéraires
 */

const mockRoutes = [
  {
    id: 'route-1',
    name: 'Route des Vins d\'Alsace',
    description: 'Parcours pittoresque à travers les vignobles alsaciens, avec de magnifiques panoramas sur la plaine du Rhin.',
    distance: 67.8,
    elevationGain: 780,
    difficulty: 'Intermédiaire',
    region: 'Alsace',
    type: 'Route',
    surface: 'Asphalte',
    createdBy: {
      id: 'user-123',
      name: 'Jean Dupont'
    },
    coordinates: [
      [48.168, 7.302],
      [48.265, 7.342],
      [48.350, 7.365],
      [48.425, 7.410]
    ],
    previewImage: 'https://i.imgur.com/pO5tM1S.jpg',
    favorites: 42,
    createdAt: '2024-06-15T14:30:00Z',
    updatedAt: '2024-12-10T09:45:00Z',
    userFavorited: true
  },
  {
    id: 'route-2',
    name: 'Tour du Mont Sainte-Odile',
    description: 'Belle ascension vers le Mont Sainte-Odile avec des vues spectaculaires sur la plaine d\'Alsace et la Forêt-Noire.',
    distance: 45.2,
    elevationGain: 950,
    difficulty: 'Difficile',
    region: 'Alsace',
    type: 'Route',
    surface: 'Asphalte',
    createdBy: {
      id: 'user-456',
      name: 'Marie Durand'
    },
    coordinates: [
      [48.438, 7.410],
      [48.456, 7.405],
      [48.471, 7.401],
      [48.484, 7.410]
    ],
    previewImage: 'https://i.imgur.com/3G4Wj5u.jpg',
    favorites: 38,
    createdAt: '2024-07-21T08:15:00Z',
    updatedAt: '2024-11-05T16:20:00Z',
    userFavorited: false
  },
  {
    id: 'route-3',
    name: 'Boucle des Hautes Vosges',
    description: 'Parcours exigeant à travers les plus hauts sommets vosgiens incluant le Grand Ballon et le Ballon d\'Alsace.',
    distance: 120.5,
    elevationGain: 2580,
    difficulty: 'Très difficile',
    region: 'Vosges',
    type: 'Route',
    surface: 'Asphalte',
    createdBy: {
      id: 'user-789',
      name: 'Thomas Petit'
    },
    coordinates: [
      [47.900, 6.990],
      [47.920, 7.040],
      [47.980, 7.080],
      [48.050, 7.100]
    ],
    previewImage: 'https://i.imgur.com/7zTyLte.jpg',
    favorites: 65,
    createdAt: '2024-05-10T11:30:00Z',
    updatedAt: '2024-10-18T14:15:00Z',
    userFavorited: true
  },
  {
    id: 'route-4',
    name: 'Piste des Forts de Strasbourg',
    description: 'Parcours familial faisant le tour de Strasbourg en suivant les anciennes fortifications militaires.',
    distance: 32.6,
    elevationGain: 210,
    difficulty: 'Facile',
    region: 'Alsace',
    type: 'Route',
    surface: 'Mixte',
    createdBy: {
      id: 'user-123',
      name: 'Jean Dupont'
    },
    coordinates: [
      [48.573, 7.752],
      [48.590, 7.770],
      [48.600, 7.780],
      [48.585, 7.790]
    ],
    previewImage: 'https://i.imgur.com/aFTKGYV.jpg',
    favorites: 91,
    createdAt: '2024-08-05T15:45:00Z',
    updatedAt: '2024-12-01T10:30:00Z',
    userFavorited: false
  },
  {
    id: 'route-5',
    name: 'Traversée de la Lorraine',
    description: 'Grande traversée de la Lorraine du nord au sud, passant par les principales villes de la région.',
    distance: 215.3,
    elevationGain: 1850,
    difficulty: 'Difficile',
    region: 'Lorraine',
    type: 'Route',
    surface: 'Asphalte',
    createdBy: {
      id: 'user-456',
      name: 'Marie Durand'
    },
    coordinates: [
      [49.120, 6.175],
      [48.900, 6.200],
      [48.700, 6.170],
      [48.580, 6.150]
    ],
    previewImage: 'https://i.imgur.com/QpBj8tO.jpg',
    favorites: 27,
    createdAt: '2024-06-28T09:20:00Z',
    updatedAt: '2024-11-15T12:40:00Z',
    userFavorited: false
  },
  {
    id: 'route-6',
    name: 'Circuit des Lacs Vosgiens',
    description: 'Parcours reliant les principaux lacs des Vosges dans un cadre naturel préservé.',
    distance: 88.7,
    elevationGain: 1450,
    difficulty: 'Intermédiaire',
    region: 'Vosges',
    type: 'Route',
    surface: 'Asphalte',
    createdBy: {
      id: 'user-789',
      name: 'Thomas Petit'
    },
    coordinates: [
      [48.050, 6.950],
      [48.070, 6.980],
      [48.100, 7.000],
      [48.130, 7.030]
    ],
    previewImage: 'https://i.imgur.com/pBQjHnD.jpg',
    favorites: 54,
    createdAt: '2024-07-12T13:10:00Z',
    updatedAt: '2024-12-05T16:50:00Z',
    userFavorited: true
  }
];

export default mockRoutes;
