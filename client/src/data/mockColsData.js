/**
 * Données mockées pour les cols
 * Ces données sont utilisées pour le développement et les tests
 * Dans la version de production, ces données seront remplacées par des appels API
 */

const mockColsData = [
  {
    id: 'col-du-tourmalet',
    name: 'Col du Tourmalet',
    altitude: 2115,
    distance: 19.0,
    elevation: 1268,
    avgGradient: 7.4,
    maxGradient: 10.2,
    difficulty: 'hard',
    famous: true,
    mythical: true,
    recent: false,
    isFavorite: false,
    rating: 4.8,
    reviews: 1203,
    location: {
      region: 'pyrenees',
      country: 'France',
      latitude: 42.8695,
      longitude: 0.1768
    },
    description: "Le Col du Tourmalet est l'un des cols mythiques des Pyrénées et du Tour de France. Avec ses 19 km d'ascension depuis Luz-Saint-Sauveur, ce col hors catégorie offre des paysages grandioses et un défi sportif considérable.",
    imageUrl: '/images/cols/tourmalet.jpg',
    elevationProfile: generateElevationProfile(19.0, 1268, 7.4, 10.2)
  },
  {
    id: 'alpe-d-huez',
    name: "L'Alpe d'Huez",
    altitude: 1860,
    distance: 13.8,
    elevation: 1120,
    avgGradient: 8.1,
    maxGradient: 13.0,
    difficulty: 'hard',
    famous: true,
    mythical: true,
    recent: false,
    isFavorite: true,
    rating: 4.9,
    reviews: 1542,
    location: {
      region: 'alpes',
      country: 'France',
      latitude: 45.0909,
      longitude: 6.0706
    },
    description: "L'Alpe d'Huez est l'arrivée mythique du Tour de France avec ses 21 virages légendaires. C'est une montée intense qui offre peu de répit, mais dont l'histoire et l'ambiance en font un must pour tout cycliste.",
    imageUrl: '/images/cols/alpe-d-huez.jpg',
    elevationProfile: generateElevationProfile(13.8, 1120, 8.1, 13.0)
  },
  {
    id: 'col-du-galibier',
    name: 'Col du Galibier',
    altitude: 2642,
    distance: 18.1,
    elevation: 1245,
    avgGradient: 6.9,
    maxGradient: 10.1,
    difficulty: 'hard',
    famous: true,
    mythical: true,
    recent: false,
    isFavorite: false,
    rating: 4.7,
    reviews: 982,
    location: {
      region: 'alpes',
      country: 'France',
      latitude: 45.0643,
      longitude: 6.4028
    },
    description: "Culminant à 2642 mètres, le Col du Galibier est l'un des plus hauts cols des Alpes françaises. L'ascension depuis le Col du Lautaret offre des panoramas spectaculaires sur les sommets environnants.",
    imageUrl: '/images/cols/galibier.jpg',
    elevationProfile: generateElevationProfile(18.1, 1245, 6.9, 10.1)
  },
  {
    id: 'mont-ventoux',
    name: 'Mont Ventoux',
    altitude: 1909,
    distance: 21.5,
    elevation: 1617,
    avgGradient: 7.5,
    maxGradient: 12.0,
    difficulty: 'extreme',
    famous: true,
    mythical: true,
    recent: false,
    isFavorite: false,
    rating: 4.9,
    reviews: 1358,
    location: {
      region: 'provence',
      country: 'France',
      latitude: 44.1740,
      longitude: 5.2786
    },
    description: "Surnommé le 'Géant de Provence', le Mont Ventoux est une ascension emblématique caractérisée par son sommet lunaire dépourvu de végétation. Ses pentes sévères et son exposition au vent en font un défi redoutable.",
    imageUrl: '/images/cols/ventoux.jpg',
    elevationProfile: generateElevationProfile(21.5, 1617, 7.5, 12.0)
  },
  {
    id: 'col-d-izoard',
    name: "Col d'Izoard",
    altitude: 2360,
    distance: 19.2,
    elevation: 1105,
    avgGradient: 5.7,
    maxGradient: 9.0,
    difficulty: 'medium',
    famous: true,
    mythical: false,
    recent: false,
    isFavorite: false,
    rating: 4.6,
    reviews: 724,
    location: {
      region: 'alpes',
      country: 'France',
      latitude: 44.8203,
      longitude: 6.7347
    },
    description: "Le Col d'Izoard est célèbre pour la traversée de la Casse Déserte, un paysage lunaire unique qui précède son sommet. Cette montée offre une variété de panoramas allant des forêts de mélèzes aux rochers dolomitiques.",
    imageUrl: '/images/cols/izoard.jpg',
    elevationProfile: generateElevationProfile(19.2, 1105, 5.7, 9.0)
  },
  {
    id: 'col-de-la-madeleine',
    name: 'Col de la Madeleine',
    altitude: 2000,
    distance: 19.3,
    elevation: 1520,
    avgGradient: 7.9,
    maxGradient: 10.5,
    difficulty: 'hard',
    famous: true,
    mythical: false,
    recent: false,
    isFavorite: false,
    rating: 4.5,
    reviews: 658,
    location: {
      region: 'alpes',
      country: 'France',
      latitude: 45.3953,
      longitude: 6.3672
    },
    description: "Le Col de la Madeleine est une longue ascension qui combine des sections raides et quelques replats permettant de reprendre son souffle. Ses alpages verdoyants offrent des vues magnifiques sur les montagnes environnantes.",
    imageUrl: '/images/cols/madeleine.jpg',
    elevationProfile: generateElevationProfile(19.3, 1520, 7.9, 10.5)
  },
  {
    id: 'passo-dello-stelvio',
    name: 'Passo dello Stelvio',
    altitude: 2758,
    distance: 24.3,
    elevation: 1808,
    avgGradient: 7.4,
    maxGradient: 14.0,
    difficulty: 'extreme',
    famous: true,
    mythical: true,
    recent: false,
    isFavorite: false,
    rating: 4.9,
    reviews: 1087,
    location: {
      region: 'alpes',
      country: 'Italie',
      latitude: 46.5253,
      longitude: 10.4541
    },
    description: "Le Stelvio est le deuxième plus haut col routier des Alpes avec ses 2758 mètres d'altitude. Ses 48 virages en épingle à cheveux en font une expérience visuelle unique et un défi légendaire du cyclisme italien.",
    imageUrl: '/images/cols/stelvio.jpg',
    elevationProfile: generateElevationProfile(24.3, 1808, 7.4, 14.0)
  },
  {
    id: 'col-du-grand-colombier',
    name: 'Col du Grand Colombier',
    altitude: 1501,
    distance: 18.3,
    elevation: 1255,
    avgGradient: 6.9,
    maxGradient: 12.0,
    difficulty: 'hard',
    famous: false,
    mythical: false,
    recent: true,
    isFavorite: false,
    rating: 4.6,
    reviews: 452,
    location: {
      region: 'jura',
      country: 'France',
      latitude: 45.9145,
      longitude: 5.6728
    },
    description: "Devenu régulier dans le Tour de France ces dernières années, le Grand Colombier offre plusieurs versants aux caractéristiques très différentes. Celui depuis Culoz est probablement le plus difficile avec des passages très raides.",
    imageUrl: '/images/cols/grand-colombier.jpg',
    elevationProfile: generateElevationProfile(18.3, 1255, 6.9, 12.0)
  },
  {
    id: 'col-de-la-croix-de-fer',
    name: 'Col de la Croix de Fer',
    altitude: 2067,
    distance: 22.7,
    elevation: 1347,
    avgGradient: 5.9,
    maxGradient: 11.0,
    difficulty: 'medium',
    famous: true,
    mythical: false,
    recent: false,
    isFavorite: true,
    rating: 4.5,
    reviews: 587,
    location: {
      region: 'alpes',
      country: 'France',
      latitude: 45.2264,
      longitude: 6.1831
    },
    description: "Le Col de la Croix de Fer est réputé pour son profil irrégulier, alternant des portions très pentues avec des sections plates voire descendantes. Cette variété rend l'ascension très particulière et stratégique.",
    imageUrl: '/images/cols/croix-de-fer.jpg',
    elevationProfile: generateElevationProfile(22.7, 1347, 5.9, 11.0)
  },
  {
    id: 'col-de-la-bonette',
    name: 'Col de la Bonette',
    altitude: 2802,
    distance: 24.1,
    elevation: 1589,
    avgGradient: 6.6,
    maxGradient: 10.0,
    difficulty: 'hard',
    famous: true,
    mythical: false,
    recent: false,
    isFavorite: false,
    rating: 4.7,
    reviews: 423,
    location: {
      region: 'alpes',
      country: 'France',
      latitude: 44.3209,
      longitude: 6.8058
    },
    description: "Avec la boucle autour de la Cime de la Bonette, c'est la plus haute route asphaltée d'Europe à 2802 mètres. L'ascension est longue mais régulière, traversant des paysages alpins spectaculaires.",
    imageUrl: '/images/cols/bonette.jpg',
    elevationProfile: generateElevationProfile(24.1, 1589, 6.6, 10.0)
  },
  {
    id: 'col-d-aubisque',
    name: "Col d'Aubisque",
    altitude: 1709,
    distance: 16.6,
    elevation: 1190,
    avgGradient: 7.2,
    maxGradient: 10.0,
    difficulty: 'medium',
    famous: true,
    mythical: false,
    recent: false,
    isFavorite: false,
    rating: 4.6,
    reviews: 512,
    location: {
      region: 'pyrenees',
      country: 'France',
      latitude: 42.9825,
      longitude: -0.3364
    },
    description: "Le Col d'Aubisque est l'un des cols emblématiques des Pyrénées, souvent associé au Col du Soulor qui le précède. La route taillée à flanc de montagne offre des vues impressionnantes et parfois vertigineuses.",
    imageUrl: '/images/cols/aubisque.jpg',
    elevationProfile: generateElevationProfile(16.6, 1190, 7.2, 10.0)
  },
  {
    id: 'passo-di-gavia',
    name: 'Passo di Gavia',
    altitude: 2621,
    distance: 17.3,
    elevation: 1363,
    avgGradient: 7.9,
    maxGradient: 16.0,
    difficulty: 'extreme',
    famous: true,
    mythical: true,
    recent: false,
    isFavorite: false,
    rating: 4.8,
    reviews: 375,
    location: {
      region: 'alpes',
      country: 'Italie',
      latitude: 46.3448,
      longitude: 10.4933
    },
    description: "Le Gavia est célèbre pour l'étape épique du Giro 1988 sous la neige. C'est une montée étroite et sauvage avec des tunnels non éclairés et des pourcentages très exigeants dans sa partie centrale.",
    imageUrl: '/images/cols/gavia.jpg',
    elevationProfile: generateElevationProfile(17.3, 1363, 7.9, 16.0)
  },
  {
    id: 'col-du-grand-ballon',
    name: 'Col du Grand Ballon',
    altitude: 1336,
    distance: 13.2,
    elevation: 886,
    avgGradient: 6.7,
    maxGradient: 11.0,
    difficulty: 'medium',
    famous: false,
    mythical: false,
    recent: false,
    isFavorite: false,
    rating: 4.3,
    reviews: 289,
    location: {
      region: 'vosges',
      country: 'France',
      latitude: 47.8992,
      longitude: 7.0922
    },
    description: "Point culminant des Vosges, le Grand Ballon offre une ascension variée avec une première partie en forêt suivie d'une section plus ouverte avec des vues sur la plaine d'Alsace et parfois jusqu'aux Alpes.",
    imageUrl: '/images/cols/grand-ballon.jpg',
    elevationProfile: generateElevationProfile(13.2, 886, 6.7, 11.0)
  },
  {
    id: 'col-de-vars',
    name: 'Col de Vars',
    altitude: 2109,
    distance: 19.3,
    elevation: 1015,
    avgGradient: 5.3,
    maxGradient: 9.0,
    difficulty: 'medium',
    famous: false,
    mythical: false,
    recent: false,
    isFavorite: false,
    rating: 4.4,
    reviews: 312,
    location: {
      region: 'alpes',
      country: 'France',
      latitude: 44.5383,
      longitude: 6.7025
    },
    description: "Le Col de Vars est souvent gravi en association avec l'Izoard ou la Bonette. Son ascension est assez régulière et offre de beaux points de vue sur les montagnes environnantes et les mélèzes.",
    imageUrl: '/images/cols/vars.jpg',
    elevationProfile: generateElevationProfile(19.3, 1015, 5.3, 9.0)
  },
  {
    id: 'col-de-porte',
    name: 'Col de Porte',
    altitude: 1326,
    distance: 11.2,
    elevation: 746,
    avgGradient: 6.7,
    maxGradient: 9.0,
    difficulty: 'medium',
    famous: false,
    mythical: false,
    recent: true,
    isFavorite: false,
    rating: 4.2,
    reviews: 186,
    location: {
      region: 'alpes',
      country: 'France',
      latitude: 45.2944,
      longitude: 5.7694
    },
    description: "Situé dans le massif de la Chartreuse près de Grenoble, le Col de Porte est une ascension accessible qui traverse une belle forêt avant d'arriver sur le plateau nordique.",
    imageUrl: '/images/cols/porte.jpg',
    elevationProfile: generateElevationProfile(11.2, 746, 6.7, 9.0)
  },
  {
    id: 'ballon-d-alsace',
    name: "Ballon d'Alsace",
    altitude: 1178,
    distance: 9.1,
    elevation: 632,
    avgGradient: 6.9,
    maxGradient: 9.0,
    difficulty: 'medium',
    famous: true,
    mythical: false,
    recent: false,
    isFavorite: false,
    rating: 4.1,
    reviews: 245,
    location: {
      region: 'vosges',
      country: 'France',
      latitude: 47.8236,
      longitude: 6.8578
    },
    description: "Premier col de l'histoire du Tour de France, le Ballon d'Alsace est une montée régulière à travers les forêts vosgiennes. Son sommet offre une vue panoramique sur les Vosges et l'Alsace.",
    imageUrl: '/images/cols/ballon-alsace.jpg',
    elevationProfile: generateElevationProfile(9.1, 632, 6.9, 9.0)
  },
  {
    id: 'passo-del-mortirolo',
    name: 'Passo del Mortirolo',
    altitude: 1852,
    distance: 11.5,
    elevation: 1291,
    avgGradient: 11.2,
    maxGradient: 18.0,
    difficulty: 'extreme',
    famous: true,
    mythical: true,
    recent: false,
    isFavorite: false,
    rating: 4.7,
    reviews: 431,
    location: {
      region: 'alpes',
      country: 'Italie',
      latitude: 46.2373,
      longitude: 10.3464
    },
    description: "Le Mortirolo est considéré comme l'une des montées les plus difficiles d'Europe avec des pentes constamment au-dessus de 10% sur plusieurs kilomètres. Cette ascension très exigeante a forgé les exploits de nombreux champions.",
    imageUrl: '/images/cols/mortirolo.jpg',
    elevationProfile: generateElevationProfile(11.5, 1291, 11.2, 18.0)
  },
  {
    id: 'col-d-aspin',
    name: "Col d'Aspin",
    altitude: 1490,
    distance: 12.0,
    elevation: 642,
    avgGradient: 5.4,
    maxGradient: 8.0,
    difficulty: 'medium',
    famous: true,
    mythical: false,
    recent: false,
    isFavorite: false,
    rating: 4.3,
    reviews: 387,
    location: {
      region: 'pyrenees',
      country: 'France',
      latitude: 42.9356,
      longitude: 0.3308
    },
    description: "Souvent associé au Tourmalet, le Col d'Aspin est une ascension plus accessible des Pyrénées. Il offre de superbes panoramas sur les montagnes environnantes et est particulièrement agréable au printemps avec ses prairies fleuries.",
    imageUrl: '/images/cols/aspin.jpg',
    elevationProfile: generateElevationProfile(12.0, 642, 5.4, 8.0)
  },
  {
    id: 'colle-di-agnello',
    name: 'Colle dell\'Agnello',
    altitude: 2744,
    distance: 20.7,
    elevation: 1741,
    avgGradient: 8.4,
    maxGradient: 14.0,
    difficulty: 'extreme',
    famous: false,
    mythical: false,
    recent: true,
    isFavorite: false,
    rating: 4.7,
    reviews: 184,
    location: {
      region: 'alpes',
      country: 'Italie',
      latitude: 44.6797,
      longitude: 6.9831
    },
    description: "Troisième plus haut col routier des Alpes, le Colle dell'Agnello est une montée transfrontalière entre la France et l'Italie. Son final est particulièrement exigeant avec des pourcentages soutenus.",
    imageUrl: '/images/cols/agnello.jpg',
    elevationProfile: generateElevationProfile(20.7, 1741, 8.4, 14.0)
  },
  {
    id: 'col-du-petit-saint-bernard',
    name: 'Col du Petit Saint-Bernard',
    altitude: 2188,
    distance: 25.7,
    elevation: 1348,
    avgGradient: 5.2,
    maxGradient: 8.0,
    difficulty: 'medium',
    famous: true,
    mythical: false,
    recent: false,
    isFavorite: false,
    rating: 4.3,
    reviews: 254,
    location: {
      region: 'alpes',
      country: 'France',
      latitude: 45.6841,
      longitude: 6.8852
    },
    description: "Col frontalier entre la France et l'Italie, le Petit Saint-Bernard est une longue ascension mais aux pourcentages modérés. Son panorama ouvre sur le Mont Blanc et la vallée d'Aoste.",
    imageUrl: '/images/cols/petit-saint-bernard.jpg',
    elevationProfile: generateElevationProfile(25.7, 1348, 5.2, 8.0)
  },
  {
    id: 'col-de-peyresourde',
    name: 'Col de Peyresourde',
    altitude: 1569,
    distance: 13.5,
    elevation: 835,
    avgGradient: 6.2,
    maxGradient: 9.5,
    difficulty: 'medium',
    famous: true,
    mythical: false,
    recent: false,
    isFavorite: false,
    rating: 4.4,
    reviews: 325,
    location: {
      region: 'pyrenees',
      country: 'France',
      latitude: 42.7972,
      longitude: 0.4394
    },
    description: "Classique du Tour de France, le Peyresourde offre deux versants aux caractéristiques assez différentes. Le sommet, avec son petit café et ses crêpes, est un lieu de pause apprécié des cyclistes.",
    imageUrl: '/images/cols/peyresourde.jpg',
    elevationProfile: generateElevationProfile(13.5, 835, 6.2, 9.5)
  }
];

/**
 * Génère un profil d'élévation simulé pour un col
 * @param {number} distance - Distance totale en km
 * @param {number} elevation - Dénivelé total en mètres
 * @param {number} avgGradient - Pente moyenne en pourcentage
 * @param {number} maxGradient - Pente maximale en pourcentage
 * @returns {Array} - Tableau des points d'élévation
 */
function generateElevationProfile(distance, elevation, avgGradient, maxGradient) {
  const pointsCount = 100; // Nombre de points du profil
  const distanceStep = distance / (pointsCount - 1);
  const baseAltitude = Math.random() * 500 + 500; // Altitude de départ entre 500 et 1000m
  
  const profile = [];
  
  // Paramètres pour générer une courbe réaliste
  const peakLocation = 0.7 + Math.random() * 0.2; // Pic de difficulté entre 70% et 90% du parcours
  const flatStart = 0.1 + Math.random() * 0.1; // Début plat entre 10% et 20%
  const irregularity = 0.4 + Math.random() * 0.3; // Facteur d'irrégularité entre 0.4 et 0.7
  
  for (let i = 0; i < pointsCount; i++) {
    const progress = i / (pointsCount - 1);
    const currentDistance = i * distanceStep;
    
    // Calculer un gradient qui varie en fonction de la position
    let currentGradient;
    if (progress < flatStart) {
      // Début relativement plat
      currentGradient = avgGradient * 0.5 * (progress / flatStart);
    } else if (progress < peakLocation) {
      // Montée progressive vers le pic de difficulté
      const peakFactor = (progress - flatStart) / (peakLocation - flatStart);
      currentGradient = avgGradient + (maxGradient - avgGradient) * Math.pow(peakFactor, 2);
    } else {
      // Diminution après le pic
      const finalFactor = (progress - peakLocation) / (1 - peakLocation);
      currentGradient = maxGradient - (maxGradient - avgGradient * 0.7) * finalFactor;
    }
    
    // Ajouter de l'irrégularité
    const randomFactor = Math.sin(progress * 10) * Math.sin(progress * 25) * Math.sin(progress * 52);
    currentGradient += randomFactor * irregularity * avgGradient;
    
    // Calculer l'altitude en fonction du gradient actuel
    let currentElevation;
    if (i === 0) {
      currentElevation = baseAltitude;
    } else {
      const prevElevation = profile[i - 1].elevation;
      const elevationGain = (distanceStep * currentGradient) / 100 * 1000; // En mètres
      currentElevation = prevElevation + elevationGain;
    }
    
    profile.push({
      distance: parseFloat(currentDistance.toFixed(1)),
      elevation: Math.round(currentElevation),
      gradient: parseFloat(currentGradient.toFixed(1))
    });
  }
  
  // Ajuster pour que l'élévation totale soit correcte
  const generatedElevation = profile[pointsCount - 1].elevation - profile[0].elevation;
  const scaleFactor = elevation / generatedElevation;
  
  for (let i = 1; i < pointsCount; i++) {
    const elevationGain = (profile[i].elevation - profile[i-1].elevation) * scaleFactor;
    profile[i].elevation = Math.round(profile[i-1].elevation + elevationGain);
  }
  
  return profile;
}

export default mockColsData;
