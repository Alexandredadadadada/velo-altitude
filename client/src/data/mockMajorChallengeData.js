/**
 * Données mockées pour le module "7 Majeurs"
 * Ces données simulent les réponses de l'API pour permettre le fonctionnement
 * en mode hors-ligne ou sans backend sur Netlify
 */

// Fonction utilitaire pour créer un profil d'élévation réaliste
const createElevationProfile = (distance, elevation, avgGradient, maxGradient) => {
  const points = Math.floor(distance * 10); // 10 points par km
  const elevationProfile = [];
  let currentAltitude = 0;
  
  for (let i = 0; i < points; i++) {
    // Simuler des variations de pente
    const progress = i / points;
    let gradient = avgGradient;
    
    // Ajouter des variations et un pic vers le milieu
    if (progress > 0.4 && progress < 0.6) {
      gradient = Math.min(maxGradient, avgGradient * 1.5);
    } else if (progress > 0.7 && progress < 0.8) {
      gradient = Math.min(maxGradient - 1, avgGradient * 1.3);
    }
    
    // Calculer l'altitude pour ce point
    const segmentDistance = distance / points;
    const elevationGain = (gradient / 100) * segmentDistance * 1000;
    currentAltitude += elevationGain;
    
    elevationProfile.push({
      distance: (i / points) * distance,
      altitude: currentAltitude,
      gradient: gradient
    });
  }
  
  return elevationProfile;
};

// Colletion de cols détaillés pour le module "7 Majeurs"
export const detailedCols = [
  {
    id: 'col-du-tourmalet',
    name: 'Col du Tourmalet',
    altitude: 2115,
    distance: 19.0,
    elevation: 1268,
    avgGradient: 7.4,
    maxGradient: 10.2,
    difficulty: 5,
    category: 'HC',
    famous: true,
    mythical: true,
    region: 'Pyrénées',
    country: 'France',
    latitude: 42.8695,
    longitude: 0.1768,
    description: "Le Col du Tourmalet est l'un des cols mythiques des Pyrénées et du Tour de France. Avec ses 19 km d'ascension depuis Luz-Saint-Sauveur, ce col hors catégorie offre des paysages grandioses et un défi sportif considérable.",
    image: '/images/cols/tourmalet.jpg',
    elevationProfile: createElevationProfile(19.0, 1268, 7.4, 10.2)
  },
  {
    id: 'alpe-d-huez',
    name: "L'Alpe d'Huez",
    altitude: 1860,
    distance: 13.8,
    elevation: 1120,
    avgGradient: 8.1,
    maxGradient: 13.0,
    difficulty: 5,
    category: 'HC',
    famous: true,
    mythical: true,
    region: 'Alpes',
    country: 'France',
    latitude: 45.0909,
    longitude: 6.0639,
    description: "L'Alpe d'Huez est sans doute l'ascension la plus célèbre des Alpes françaises. Ses 21 virages numérotés à l'envers et ses pentes sévères en font un défi redoutable mais incontournable pour tout cycliste.",
    image: '/images/cols/alpe-huez.jpg',
    elevationProfile: createElevationProfile(13.8, 1120, 8.1, 13.0)
  },
  {
    id: 'mont-ventoux',
    name: 'Mont Ventoux',
    altitude: 1909,
    distance: 21.5,
    elevation: 1617,
    avgGradient: 7.5,
    maxGradient: 12.0,
    difficulty: 5,
    category: 'HC',
    famous: true,
    mythical: true,
    region: 'Provence',
    country: 'France',
    latitude: 44.1739,
    longitude: 5.2784,
    description: "Le Mont Ventoux, surnommé le Géant de Provence, est l'un des cols les plus redoutés du cyclisme. Son sommet dénudé et balayé par le vent offre un paysage lunaire unique et une ascension mémorable.",
    image: '/images/cols/ventoux.jpg',
    elevationProfile: createElevationProfile(21.5, 1617, 7.5, 12.0)
  },
  {
    id: 'col-du-galibier',
    name: 'Col du Galibier',
    altitude: 2642,
    distance: 18.1,
    elevation: 1245,
    avgGradient: 6.9,
    maxGradient: 10.1,
    difficulty: 4,
    category: 'HC',
    famous: true,
    mythical: true,
    region: 'Alpes',
    country: 'France',
    latitude: 45.0638,
    longitude: 6.4093,
    description: "Le Col du Galibier est l'un des géants des Alpes françaises. Culminant à plus de 2600m d'altitude, il offre des panoramas extraordinaires sur les massifs environnants et constitue un défi majeur même pour les cyclistes expérimentés.",
    image: '/images/cols/galibier.jpg',
    elevationProfile: createElevationProfile(18.1, 1245, 6.9, 10.1)
  },
  {
    id: 'puy-de-dome',
    name: 'Puy de Dôme',
    altitude: 1465,
    distance: 13.4,
    elevation: 1130,
    avgGradient: 8.4,
    maxGradient: 13.3,
    difficulty: 4,
    category: '1',
    famous: true,
    mythical: false,
    region: 'Massif Central',
    country: 'France',
    latitude: 45.7721,
    longitude: 2.9614,
    description: "Le Puy de Dôme est un ancien volcan offrant une ascension exigeante avec une pente moyenne supérieure à 8%. Cette montée historique du Tour de France offre des vues spectaculaires sur la chaîne des Puys.",
    image: '/images/cols/puy-de-dome.jpg',
    elevationProfile: createElevationProfile(13.4, 1130, 8.4, 13.3)
  },
  {
    id: 'col-d-izoard',
    name: "Col d'Izoard",
    altitude: 2360,
    distance: 15.9,
    elevation: 1105,
    avgGradient: 7.0,
    maxGradient: 9.5,
    difficulty: 4,
    category: 'HC',
    famous: true,
    mythical: true,
    region: 'Alpes',
    country: 'France',
    latitude: 44.8209,
    longitude: 6.7343,
    description: "Le Col d'Izoard est célèbre pour son paysage lunaire de la Casse Déserte. Cette ascension mythique a forgé la légende de nombreux champions du Tour de France.",
    image: '/images/cols/izoard.jpg',
    elevationProfile: createElevationProfile(15.9, 1105, 7.0, 9.5)
  },
  {
    id: 'col-de-la-madeleine',
    name: 'Col de la Madeleine',
    altitude: 2000,
    distance: 19.2,
    elevation: 1520,
    avgGradient: 7.9,
    maxGradient: 10.2,
    difficulty: 5,
    category: 'HC',
    famous: true,
    mythical: false,
    region: 'Alpes',
    country: 'France',
    latitude: 45.4304,
    longitude: 6.3111,
    description: "Le Col de la Madeleine est l'une des ascensions les plus difficiles des Alpes, avec près de 20 km à près de 8% de moyenne. Il offre des vues imprenables sur le massif de la Vanoise.",
    image: '/images/cols/madeleine.jpg',
    elevationProfile: createElevationProfile(19.2, 1520, 7.9, 10.2)
  },
  {
    id: 'col-d-aubisque',
    name: "Col d'Aubisque",
    altitude: 1709,
    distance: 16.6,
    elevation: 1190,
    avgGradient: 7.2,
    maxGradient: 10.0,
    difficulty: 4,
    category: 'HC',
    famous: true,
    mythical: false,
    region: 'Pyrénées',
    country: 'France',
    latitude: 42.9777,
    longitude: -0.3360,
    description: "Le Col d'Aubisque est l'un des cols emblématiques des Pyrénées. Son ascension depuis Laruns traverse des paysages variés et impressionnants, avec une route taillée dans la roche.",
    image: '/images/cols/aubisque.jpg',
    elevationProfile: createElevationProfile(16.6, 1190, 7.2, 10.0)
  },
  {
    id: 'col-de-peyresourde',
    name: 'Col de Peyresourde',
    altitude: 1569,
    distance: 13.2,
    elevation: 939,
    avgGradient: 7.1,
    maxGradient: 9.8,
    difficulty: 3,
    category: '1',
    famous: true,
    mythical: false,
    region: 'Pyrénées',
    country: 'France',
    latitude: 42.7959,
    longitude: 0.4456,
    description: "Le Col de Peyresourde est un passage incontournable des Pyrénées, souvent au programme du Tour de France. Malgré une difficulté modérée, son enchaînement avec d'autres cols peut le rendre redoutable.",
    image: '/images/cols/peyresourde.jpg',
    elevationProfile: createElevationProfile(13.2, 939, 7.1, 9.8)
  },
  {
    id: 'grand-ballon',
    name: 'Grand Ballon',
    altitude: 1424,
    distance: 20.1,
    elevation: 1150,
    avgGradient: 5.7,
    maxGradient: 9.0,
    difficulty: 3,
    category: '1',
    famous: false,
    mythical: false,
    region: 'Vosges',
    country: 'France',
    latitude: 47.9000,
    longitude: 7.0833,
    description: "Le Grand Ballon est le point culminant du massif des Vosges. Son ascension offre de superbes vues sur la plaine d'Alsace, la Forêt Noire et parfois même les Alpes.",
    image: '/images/cols/grand-ballon.jpg',
    elevationProfile: createElevationProfile(20.1, 1150, 5.7, 9.0)
  }
];

// Exemples de défis communautaires
export const communityChallenges = [
  {
    id: 'tour-de-france-legends',
    title: 'Tour de France Légendes',
    creator: 'TeamCycliste',
    description: 'Les 7 cols légendaires du Tour de France que tout cycliste devrait gravir une fois dans sa vie.',
    colIds: ['col-du-tourmalet', 'alpe-d-huez', 'mont-ventoux', 'col-du-galibier', 'col-d-izoard', 'col-de-la-madeleine', 'col-d-aubisque'],
    totalDistance: 133.1,
    totalElevation: 8945,
    difficulty: 5,
    likes: 287,
    createdAt: '2024-12-15T14:23:44Z',
    isPublic: true
  },
  {
    id: 'french-alps-challenge',
    title: 'Défi des Alpes Françaises',
    creator: 'AlpineRider',
    description: 'Une sélection des plus beaux cols alpins pour un défi inoubliable dans les montagnes.',
    colIds: ['alpe-d-huez', 'col-du-galibier', 'col-d-izoard', 'col-de-la-madeleine'],
    totalDistance: 64.9,
    totalElevation: 4990,
    difficulty: 4,
    likes: 153,
    createdAt: '2025-01-03T09:18:22Z',
    isPublic: true
  }
];

// Défis personnels de l'utilisateur (exemple)
export const userChallenges = [
  {
    id: 'my-first-challenge',
    title: 'Mon premier défi',
    description: 'Ma sélection personnelle de cols pour la saison prochaine',
    colIds: ['col-du-tourmalet', 'mont-ventoux', 'col-d-aubisque'],
    totalDistance: 57.1,
    totalElevation: 4075,
    difficulty: 4,
    createdAt: '2025-03-10T16:42:11Z',
    isPublic: false
  }
];

export default {
  detailedCols,
  communityChallenges,
  userChallenges
};
