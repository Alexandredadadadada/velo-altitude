// Données de fallback pour les itinéraires cyclistes
// Utilisé lorsque la connexion à MongoDB échoue dans les fonctions Netlify

module.exports = [
  {
    _id: "route001",
    name: "La Grande Traversée des Vosges",
    description: "Un parcours spectaculaire à travers le massif des Vosges passant par plusieurs cols emblématiques.",
    distance: 145,
    elevation: 3200,
    duration: 480, // en minutes
    difficulty: "difficile",
    region: "Grand Est",
    startPoint: {
      name: "Strasbourg",
      coordinates: [7.7521, 48.5734]
    },
    endPoint: {
      name: "Mulhouse",
      coordinates: [7.3389, 47.7508]
    },
    cols: [
      "coldelaschlucgt", 
      "grandballon", 
      "balondalsace"
    ],
    terrain: ["montagne", "forêt"],
    surface: "asphalte",
    season: ["printemps", "été", "automne"],
    tags: ["panoramique", "cols", "forêt"],
    author: "Club Cycliste Alsacien",
    rating: 4.8,
    reviewCount: 56,
    image: "/images/routes/grande-traversee-vosges.jpg",
    isVerified: true,
    gpxFile: "/data/gpx/grande-traversee-vosges.gpx"
  },
  {
    _id: "route002",
    name: "Circuit des Lacs Vosgiens",
    description: "Une boucle pittoresque autour des principaux lacs des Vosges avec des montées progressives.",
    distance: 90,
    elevation: 1800,
    duration: 300, // en minutes
    difficulty: "moyen",
    region: "Grand Est",
    startPoint: {
      name: "Gérardmer",
      coordinates: [6.8726, 48.0697]
    },
    endPoint: {
      name: "Gérardmer",
      coordinates: [6.8726, 48.0697]
    },
    cols: [
      "coldelaschlucht"
    ],
    terrain: ["montagne", "lac"],
    surface: "asphalte",
    season: ["printemps", "été", "automne"],
    tags: ["lacs", "forêt", "boucle"],
    author: "Office du Tourisme Gérardmer",
    rating: 4.6,
    reviewCount: 42,
    image: "/images/routes/circuit-lacs-vosgiens.jpg",
    isVerified: true,
    gpxFile: "/data/gpx/circuit-lacs-vosgiens.gpx"
  },
  {
    _id: "route003",
    name: "Route des Crêtes",
    description: "Un parcours mythique suivant la ligne de crête des Vosges offrant des panoramas à 360°.",
    distance: 77,
    elevation: 1650,
    duration: 270, // en minutes
    difficulty: "difficile",
    region: "Grand Est",
    startPoint: {
      name: "Col du Bonhomme",
      coordinates: [7.0994, 48.1742]
    },
    endPoint: {
      name: "Cernay",
      coordinates: [7.1794, 47.8097]
    },
    cols: [
      "coldelaschlucgt", 
      "hohneck", 
      "grandballon"
    ],
    terrain: ["montagne", "crête"],
    surface: "asphalte",
    season: ["été", "automne"],
    tags: ["panoramique", "cols", "historique"],
    author: "Fédération Française de Cyclisme",
    rating: 4.9,
    reviewCount: 87,
    image: "/images/routes/route-des-cretes.jpg",
    isVerified: true,
    gpxFile: "/data/gpx/route-des-cretes.gpx"
  },
  {
    _id: "route004",
    name: "Tour de la Plaine d'Alsace",
    description: "Une balade familiale à travers les villages typiques et vignobles de la plaine d'Alsace.",
    distance: 65,
    elevation: 350,
    duration: 210, // en minutes
    difficulty: "facile",
    region: "Grand Est",
    startPoint: {
      name: "Colmar",
      coordinates: [7.3389, 48.0794]
    },
    endPoint: {
      name: "Colmar",
      coordinates: [7.3389, 48.0794]
    },
    cols: [],
    terrain: ["plaine", "vignoble"],
    surface: "asphalte",
    season: ["printemps", "été", "automne"],
    tags: ["vin", "villages", "famille"],
    author: "Route des Vins d'Alsace",
    rating: 4.5,
    reviewCount: 63,
    image: "/images/routes/tour-plaine-alsace.jpg",
    isVerified: true,
    gpxFile: "/data/gpx/tour-plaine-alsace.gpx"
  },
  {
    _id: "route005",
    name: "Traversée du Jura Alsacien",
    description: "Une incursion dans les contreforts du Jura avec de belles montées et des paysages variés.",
    distance: 110,
    elevation: 2100,
    duration: 360, // en minutes
    difficulty: "moyen",
    region: "Grand Est",
    startPoint: {
      name: "Mulhouse",
      coordinates: [7.3389, 47.7508]
    },
    endPoint: {
      name: "Belfort",
      coordinates: [6.8637, 47.6393]
    },
    cols: [
      "balondalsace"
    ],
    terrain: ["montagne", "vallée"],
    surface: "asphalte",
    season: ["printemps", "été", "automne"],
    tags: ["jura", "frontière", "montagne"],
    author: "Club Cycliste du Sundgau",
    rating: 4.4,
    reviewCount: 38,
    image: "/images/routes/traversee-jura-alsacien.jpg",
    isVerified: true,
    gpxFile: "/data/gpx/traversee-jura-alsacien.gpx"
  }
];
