/**
 * Données pour les défis "7 Majeurs"
 * Ces données représentent les défis prédéfinis pour la fonctionnalité "7 Majeurs"
 * permettant aux cyclistes de sélectionner et suivre 7 grands cols à conquérir
 */

import mockColsData from './mockColsData';

// Fonction utilitaire pour trouver un col par son ID
const findColById = (colId) => {
  return mockColsData.find(col => col.id === colId) || null;
};

// Calculer les statistiques globales d'un défi en fonction de ses cols
const calculateChallengeStats = (colIds) => {
  const cols = colIds.map(findColById).filter(Boolean);
  
  // Si aucun col valide n'est trouvé, retourner des statistiques par défaut
  if (cols.length === 0) {
    return {
      totalElevationGain: 0,
      totalDistance: 0,
      estimatedCompletionTime: 0,
      avgDifficulty: 0
    };
  }
  
  const totalElevationGain = cols.reduce((sum, col) => sum + col.elevation, 0);
  const totalDistance = cols.reduce((sum, col) => sum + col.distance, 0);
  
  // Estimation du temps en heures (basée sur une vitesse moyenne d'ascension de 10km/h)
  const estimatedCompletionTime = totalDistance / 10;
  
  // Calcul de la difficulté moyenne
  const difficultyMap = { 'easy': 1, 'medium': 2, 'hard': 3, 'extreme': 4 };
  const avgDifficulty = cols.reduce((sum, col) => sum + difficultyMap[col.difficulty], 0) / cols.length;
  
  return {
    totalElevationGain: Math.round(totalElevationGain),
    totalDistance: parseFloat(totalDistance.toFixed(1)),
    estimatedCompletionTime: parseFloat(estimatedCompletionTime.toFixed(1)),
    avgDifficulty: parseFloat(avgDifficulty.toFixed(1))
  };
};

/**
 * Données des défis "7 Majeurs" prédéfinis
 */
const sevenMajorsChallenges = [
  {
    id: "alpes-challenge",
    name: "7 Majeurs des Alpes",
    description: "Conquérez les 7 cols mythiques des Alpes françaises avec ce défi exceptionnel qui regroupe les montées les plus emblématiques du Tour de France.",
    difficulty: 4,
    region: "Alpes",
    imageUrl: "/assets/challenges/alpes-challenge.jpg",
    createdAt: "2025-04-06T04:00:00Z",
    updatedAt: "2025-04-06T04:00:00Z",
    likes: 243,
    completions: 37,
    tags: ["tour de france", "mythique", "alpes"],
    rewards: {
      badge: {
        id: "alpes-conqueror",
        name: "Conquérant des Alpes",
        imageUrl: "/assets/badges/alpes-conqueror.png",
        description: "Décerné aux cyclistes ayant conquis les 7 cols majeurs des Alpes"
      },
      points: 1000,
      unlocks: ["pyrenees-challenge"]
    },
    visualData: {
      color: "#3498db",
      icon: "mountain_peak"
    },
    // IDs des cols inclus dans ce défi
    colIds: ["alpe-d-huez", "col-du-galibier", "col-d-izoard", "col-de-la-madeleine", "col-de-la-croix-de-fer", "col-du-grand-colombier", "col-du-glandon"]
  },
  {
    id: "pyrenees-challenge",
    name: "7 Majeurs des Pyrénées",
    description: "Les Pyrénées offrent certains des cols les plus impressionnants de France. Ce défi regroupe 7 cols emblématiques qui ont forgé l'histoire du cyclisme français et international.",
    difficulty: 4,
    region: "Pyrénées",
    imageUrl: "/assets/challenges/pyrenees-challenge.jpg",
    createdAt: "2025-04-06T04:00:00Z",
    updatedAt: "2025-04-06T04:00:00Z",
    likes: 187,
    completions: 24,
    tags: ["tour de france", "pyrénées", "espagne"],
    rewards: {
      badge: {
        id: "pyrenees-master",
        name: "Maître des Pyrénées",
        imageUrl: "/assets/badges/pyrenees-master.png",
        description: "Décerné aux cyclistes ayant conquis les 7 cols majeurs des Pyrénées"
      },
      points: 1000,
      unlocks: ["dolomites-challenge"]
    },
    visualData: {
      color: "#e74c3c",
      icon: "terrain"
    },
    // IDs des cols inclus dans ce défi
    colIds: ["col-du-tourmalet", "col-d-aubisque", "col-de-peyresourde", "col-d-aspin", "col-du-soulor", "col-de-portet", "col-de-mente"]
  },
  {
    id: "dolomites-challenge",
    name: "7 Majeurs des Dolomites",
    description: "Les Dolomites italiennes offrent certains des paysages les plus spectaculaires d'Europe. Ce défi vous emmène sur les routes du Giro d'Italia, à la conquête de 7 cols légendaires.",
    difficulty: 5,
    region: "Dolomites",
    imageUrl: "/assets/challenges/dolomites-challenge.jpg",
    createdAt: "2025-04-06T04:00:00Z",
    updatedAt: "2025-04-06T04:00:00Z",
    likes: 156,
    completions: 18,
    tags: ["giro d'italia", "italie", "dolomites"],
    rewards: {
      badge: {
        id: "dolomites-hero",
        name: "Héros des Dolomites",
        imageUrl: "/assets/badges/dolomites-hero.png",
        description: "Décerné aux cyclistes ayant conquis les 7 cols majeurs des Dolomites"
      },
      points: 1200,
      unlocks: ["classic-challenge"]
    },
    visualData: {
      color: "#9b59b6",
      icon: "landscape"
    },
    // IDs des cols inclus dans ce défi
    colIds: ["passo-dello-stelvio", "passo-di-gavia", "passo-pordoi", "passo-di-mortirolo", "tre-cime-di-lavaredo", "monte-grappa", "passo-giau"]
  },
  {
    id: "classic-challenge",
    name: "7 Cols Classiques",
    description: "Ce défi rassemble 7 des cols les plus emblématiques du cyclisme mondial, ceux que tout cycliste rêve de gravir au moins une fois dans sa vie.",
    difficulty: 4,
    region: "Europe",
    imageUrl: "/assets/challenges/classic-challenge.jpg",
    createdAt: "2025-04-06T04:00:00Z",
    updatedAt: "2025-04-06T04:00:00Z",
    likes: 312,
    completions: 42,
    tags: ["classique", "mythique", "tour de france"],
    rewards: {
      badge: {
        id: "classics-legend",
        name: "Légende des Classiques",
        imageUrl: "/assets/badges/classics-legend.png",
        description: "Décerné aux cyclistes ayant conquis les 7 cols les plus emblématiques"
      },
      points: 1000,
      unlocks: ["altitude-challenge"]
    },
    visualData: {
      color: "#f39c12",
      icon: "history"
    },
    // IDs des cols inclus dans ce défi
    colIds: ["mont-ventoux", "alpe-d-huez", "col-du-tourmalet", "passo-dello-stelvio", "col-du-galibier", "col-d-izoard", "col-d-aubisque"]
  },
  {
    id: "altitude-challenge",
    name: "7 Sommets d'Altitude",
    description: "Ce défi extrême regroupe les 7 cols routiers les plus hauts d'Europe. Une véritable aventure qui vous emmènera à plus de 2500m d'altitude avec des panoramas à couper le souffle.",
    difficulty: 5,
    region: "Europe",
    imageUrl: "/assets/challenges/altitude-challenge.jpg",
    createdAt: "2025-04-06T04:00:00Z",
    updatedAt: "2025-04-06T04:00:00Z",
    likes: 134,
    completions: 9,
    tags: ["altitude", "extrême", "panoramique"],
    rewards: {
      badge: {
        id: "altitude-master",
        name: "Maître des Sommets",
        imageUrl: "/assets/badges/altitude-master.png",
        description: "Décerné aux cyclistes ayant conquis les 7 cols les plus hauts d'Europe"
      },
      points: 1500,
      unlocks: ["alps-tour-challenge"]
    },
    visualData: {
      color: "#1abc9c",
      icon: "altitude"
    },
    // IDs des cols inclus dans ce défi
    colIds: ["passo-dello-stelvio", "col-de-la-bonette", "col-du-galibier", "col-de-l-iseran", "passo-d-agnello", "col-agnel", "monte-zoncolan"]
  },
  {
    id: "alps-tour-challenge",
    name: "Tour des Alpes",
    description: "Un défi qui vous fait traverser les Alpes en conquérant 7 cols majeurs répartis entre la France, la Suisse et l'Italie. Une véritable aventure alpine !",
    difficulty: 4,
    region: "Alpes",
    imageUrl: "/assets/challenges/alps-tour-challenge.jpg",
    createdAt: "2025-04-06T04:00:00Z",
    updatedAt: "2025-04-06T04:00:00Z",
    likes: 167,
    completions: 21,
    tags: ["alpes", "tour", "international"],
    rewards: {
      badge: {
        id: "alps-explorer",
        name: "Explorateur des Alpes",
        imageUrl: "/assets/badges/alps-explorer.png",
        description: "Décerné aux cyclistes ayant conquis 7 cols majeurs à travers les Alpes"
      },
      points: 1100,
      unlocks: ["vosges-jura-challenge"]
    },
    visualData: {
      color: "#2ecc71",
      icon: "public"
    },
    // IDs des cols inclus dans ce défi
    colIds: ["col-du-grand-colombier", "col-du-petit-saint-bernard", "col-de-l-iseran", "col-du-mont-cenis", "col-du-simplon", "col-du-saint-gothard", "col-du-grand-saint-bernard"]
  },
  {
    id: "vosges-jura-challenge",
    name: "7 Majeurs Vosges & Jura",
    description: "Les massifs des Vosges et du Jura offrent des cols moins connus mais tout aussi exigeants. Ce défi vous fera découvrir ces joyaux cachés du cyclisme français.",
    difficulty: 3,
    region: "Est de la France",
    imageUrl: "/assets/challenges/vosges-jura-challenge.jpg",
    createdAt: "2025-04-06T04:00:00Z",
    updatedAt: "2025-04-06T04:00:00Z",
    likes: 98,
    completions: 32,
    tags: ["vosges", "jura", "est france"],
    rewards: {
      badge: {
        id: "east-france-hero",
        name: "Héros de l'Est",
        imageUrl: "/assets/badges/east-france-hero.png",
        description: "Décerné aux cyclistes ayant conquis les 7 cols majeurs des Vosges et du Jura"
      },
      points: 800,
      unlocks: ["beginner-challenge"]
    },
    visualData: {
      color: "#27ae60",
      icon: "forest"
    },
    // IDs des cols inclus dans ce défi
    colIds: ["col-du-grand-ballon", "col-de-la-schlucht", "ballon-d-alsace", "col-du-petit-ballon", "col-du-platzerwasel", "col-de-la-croix-de-la-serra", "col-de-la-faucille"]
  },
  {
    id: "beginner-challenge",
    name: "7 Cols pour Débutants",
    description: "Un défi accessible pour les cyclistes débutant dans l'art de gravir les cols. Cette sélection offre des montées plus douces mais néanmoins gratifiantes.",
    difficulty: 2,
    region: "France",
    imageUrl: "/assets/challenges/beginner-challenge.jpg",
    createdAt: "2025-04-06T04:00:00Z",
    updatedAt: "2025-04-06T04:00:00Z",
    likes: 201,
    completions: 76,
    tags: ["débutant", "accessible", "initiation"],
    rewards: {
      badge: {
        id: "climb-initiate",
        name: "Initié des Cols",
        imageUrl: "/assets/badges/climb-initiate.png",
        description: "Décerné aux cyclistes ayant conquis les 7 cols pour débutants"
      },
      points: 500,
      unlocks: ["legendary-finishes-challenge"]
    },
    visualData: {
      color: "#3498db",
      icon: "trending_up"
    },
    // IDs des cols inclus dans ce défi (ces cols devraient être plus faciles)
    colIds: ["col-de-la-faucille", "col-de-la-schlucht", "col-de-vars", "col-du-petit-ballon", "col-de-porte", "col-des-aravis", "col-de-la-forclaz"]
  },
  {
    id: "legendary-finishes-challenge",
    name: "7 Arrivées Légendaires",
    description: "Ce défi rassemble 7 cols qui ont été le théâtre d'arrivées légendaires dans l'histoire du Tour de France et des grands tours.",
    difficulty: 4,
    region: "International",
    imageUrl: "/assets/challenges/legendary-finishes-challenge.jpg",
    createdAt: "2025-04-06T04:00:00Z",
    updatedAt: "2025-04-06T04:00:00Z",
    likes: 178,
    completions: 23,
    tags: ["tour de france", "arrivées", "histoire"],
    rewards: {
      badge: {
        id: "finish-line-hero",
        name: "Héros de la Ligne d'Arrivée",
        imageUrl: "/assets/badges/finish-line-hero.png",
        description: "Décerné aux cyclistes ayant conquis 7 arrivées légendaires du cyclisme"
      },
      points: 1000,
      unlocks: ["spring-challenge"]
    },
    visualData: {
      color: "#f1c40f",
      icon: "emoji_events"
    },
    // IDs des cols avec des arrivées au sommet
    colIds: ["alpe-d-huez", "mont-ventoux", "passo-dello-stelvio", "col-du-tourmalet", "col-de-portet", "la-planche-des-belles-filles", "puy-de-dome"]
  },
  {
    id: "spring-challenge",
    name: "7 Cols du Printemps",
    description: "Idéal pour débuter la saison, ce défi regroupe 7 cols magnifiques qui sont généralement accessibles dès le printemps et offrent des conditions optimales.",
    difficulty: 3,
    region: "Europe du Sud",
    imageUrl: "/assets/challenges/spring-challenge.jpg",
    createdAt: "2025-04-06T04:00:00Z",
    updatedAt: "2025-04-06T04:00:00Z",
    likes: 145,
    completions: 38,
    tags: ["printemps", "début de saison", "europe du sud"],
    rewards: {
      badge: {
        id: "spring-rider",
        name: "Cycliste du Printemps",
        imageUrl: "/assets/badges/spring-rider.png",
        description: "Décerné aux cyclistes ayant conquis les 7 cols majeurs du printemps"
      },
      points: 700,
      unlocks: []
    },
    visualData: {
      color: "#e74c3c",
      icon: "wb_sunny"
    },
    // IDs des cols accessibles au printemps (généralement plus au sud ou à basse altitude)
    colIds: ["col-d-eze", "mont-faron", "col-de-braus", "col-de-la-couillole", "col-de-laghet", "col-de-vence", "mont-ventoux"]
  }
];

// Enrichir les défis avec les statistiques calculées
const enrichedChallenges = sevenMajorsChallenges.map(challenge => {
  const stats = calculateChallengeStats(challenge.colIds);
  
  // Enrichir le défi avec les cols complets et les statistiques
  return {
    ...challenge,
    totalElevationGain: stats.totalElevationGain,
    totalDistance: stats.totalDistance,
    estimatedCompletionTime: stats.estimatedCompletionTime,
    cols: challenge.colIds.map(findColById).filter(Boolean)
  };
});

export default enrichedChallenges;
