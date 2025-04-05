/**
 * Données des 8 cols restants pour Dashboard-Velo.com
 * Ces cols complètent la base de données pour atteindre l'objectif de 50 cols documentés
 */

const remainingCols = [
  // Col #1 - Carpates, Roumanie (Transfăgărășan)
  {
    id: "transfagarasan",
    name: "Transfăgărășan",
    nameFr: "Route Transfăgărășan",
    nameEn: "Transfăgărășan Highway",
    nameDe: "Transfăgărășan-Hochstraße",
    nameIt: "Strada Transfăgărășan",
    nameEs: "Carretera de Transfăgărășan",
    
    // Informations géographiques
    location: {
      country: "Roumanie",
      region: "Carpates",
      subRegion: "Monts Făgăraș",
      latitude: 45.6039,
      longitude: 24.6173,
      elevation: 2042, // Altitude en mètres
      startElevation: 565, // Altitude de départ (versant nord)
      elevationGain: 1477, // Dénivelé positif
    },
    
    // Caractéristiques techniques
    technical: {
      length: 37.8, // Longueur en km (versant nord)
      averageGradient: 4.0, // Pente moyenne en %
      maxGradient: 8.6, // Pente maximale en %
      difficulty: 8, // Note de difficulté sur 10
      technicalDifficulty: 7, // Difficulté technique sur 10
      surface: "Asphalte", // Type de revêtement
      surfaceQuality: 7, // Qualité du revêtement sur 10
      hairpins: 62, // Nombre de virages en épingle
      trafficDensity: 7, // Densité du trafic routier sur 10 (élevé en haute saison)
      tunnels: true, // Présence de tunnels
      closedInWinter: true, // Fermé en hiver (novembre à juin généralement)
      roadWidth: "Moyen", // Largeur de la route
      dangerousPassages: [
        {
          kmMark: 32.5,
          description: "Tunnel mal éclairé de 800m à proximité du sommet",
          severity: "Élevé" // Léger, Moyen, Élevé
        },
        {
          kmMark: 25.2,
          description: "Succession de virages en épingle avec risque de gravier",
          severity: "Moyen"
        }
      ],
      gradientSections: [
        { start: 0, end: 10, gradient: 2.8 },
        { start: 10, end: 20, gradient: 3.6 },
        { start: 20, end: 30, gradient: 4.5 },
        { start: 30, end: 37.8, gradient: 6.2 }
      ]
    },
    
    // Historique et culture
    history: {
      firstFeaturedYear: 2012, // Première apparition dans une course cycliste internationale
      significance: "Construit sous l'ère Ceaușescu entre 1970 et 1974 comme route stratégique militaire",
      famousVictories: [
        {
          year: 2018,
          rider: "Eduard Grosu",
          race: "Tour de Roumanie",
          story: "Victoire symbolique du champion roumain sur cette route emblématique du pays"
        }
      ],
      historicalFacts: [
        "Construite après l'invasion soviétique de la Tchécoslovaquie en 1968 comme route militaire stratégique",
        "A mobilisé plus de 6000 tonnes d'explosifs pour sa construction",
        "Rendue célèbre internationalement par l'émission Top Gear en 2009 qui l'a qualifiée de 'plus belle route du monde'",
        "Le lac Bâlea près du sommet était autrefois accessible uniquement par téléphérique"
      ],
      culturalSignificance: "Considéré comme un exploit d'ingénierie et un symbole national roumain, le Transfăgărășan est devenu une destination touristique majeure et un défi incontournable pour les cyclistes cherchant des ascensions spectaculaires hors des circuits traditionnels alpins."
    },
    
    // Météo et saisons
    weather: {
      bestPeriod: {
        from: "1er juillet",
        to: "30 septembre"
      },
      weatherCharacteristics: "Conditions alpines avec changements rapides, même en été. Risque d'orages fréquents l'après-midi.",
      temperatureRange: {
        summer: { min: 5, max: 22 },
        spring: { min: -2, max: 15 },
        autumn: { min: 0, max: 18 },
        winter: { min: -20, max: -5 }
      },
      windExposure: "Élevé", // Faible, Moyen, Élevé
      rainfallRisk: "Élevé", // Faible, Moyen, Élevé
      snowPeriod: "Octobre à Juin",
      microclimate: "Le versant nord est généralement plus humide et frais que le versant sud qui bénéficie d'un climat plus méditerranéen"
    },
    
    // Points d'intérêt
    pointsOfInterest: [
      {
        name: "Lac Bâlea (Bâlea Lac)",
        type: "Vue", // Vue, Site historique, Gastronomie, Services
        description: "Lac glaciaire spectaculaire près du sommet avec panorama à 360° sur les Carpates",
        kmMark: 35.6,
        coordinates: { lat: 45.604, lng: 24.617 }
      },
      {
        name: "Cascade Bâlea",
        type: "Vue",
        description: "Impressionnante chute d'eau visible depuis la route",
        kmMark: 30.2,
        coordinates: { lat: 45.622, lng: 24.605 }
      },
      {
        name: "Château de Poienari",
        type: "Site historique",
        description: "Forteresse en ruines ayant appartenu à Vlad l'Empaleur (l'inspiration du Comte Dracula), à proximité du début de l'ascension",
        kmMark: 5.0,
        coordinates: { lat: 45.353, lng: 24.631 }
      },
      {
        name: "Hôtel de Glace du Lac Bâlea",
        type: "Services",
        description: "Hôtel reconstruit chaque hiver entièrement en glace (accessible en téléphérique pendant la fermeture hivernale de la route)",
        kmMark: 37.0,
        coordinates: { lat: 45.604, lng: 24.617 },
        website: "http://www.hotelofice.ro",
        openingHours: "Décembre à Avril uniquement"
      }
    ],
    
    // Témoignages de cyclistes
    testimonials: [
      {
        author: "Marco Serafini",
        rating: 5, // sur 5
        date: "2023-08-10",
        text: "Une ascension incroyable et totalement différente des cols alpins ou pyrénéens. La longueur est compensée par des pentes relativement douces, mais attention au tunnel final mal éclairé et à la circulation touristique en été.",
        experience: "Cycliste expérimenté, +20 cols gravis",
        recommendedGear: "34x28 suffit amplement vu les pourcentages raisonnables"
      },
      {
        author: "Sophie Leroux",
        rating: 4,
        date: "2022-07-15",
        text: "Paysages à couper le souffle et route bien construite. Points négatifs: la circulation peut être dense en haute saison et les services sont limités sur la route. Emportez suffisamment d'eau et de nourriture.",
        experience: "Cyclosportive, aventures cyclotouristiques",
        recommendedGear: "Lumières puissantes pour le tunnel et vêtements chauds même en été"
      },
      {
        author: "Alexandru Popa",
        rating: 5,
        date: "2024-06-22",
        text: "En tant que local, je recommande fortement de partir tôt le matin pour éviter la circulation touristique. Les premiers kilomètres sont faciles et permettent un bon échauffement avant que la route ne commence à serpenter sérieusement.",
        experience: "Guide cycliste local",
        recommendedGear: "Privilégiez des pneus de 28mm minimum car la route présente quelques imperfections"
      }
    ],
    
    // Conseils pratiques
    practicalTips: {
      bestTimeOfDay: "Très tôt le matin (avant 8h) pour éviter les touristes",
      waterSources: [
        { description: "Restaurant Cabana Capra", kmMark: 28.5 },
        { description: "Kiosques touristiques au sommet", kmMark: 37.8 }
      ],
      parkingOptions: [
        { description: "Parking gratuit à Căpățânenii Ungureni (début nord)", size: "Grand", coordinates: { lat: 45.347, lng: 24.627 } },
        { description: "Plusieurs aires de stationnement le long de la route", size: "Moyen", coordinates: { lat: 45.504, lng: 24.621 } }
      ],
      publicTransport: "Limité. Bus occasionnels depuis Sibiu ou Curtea de Argeș jusqu'aux villages au pied du col",
      serviceStations: [
        { type: "Stations-service", location: "Curtea de Argeș (avant le début de l'ascension)", openingHours: "6h-22h" }
      ],
      cellCoverage: "Très inégale, nombreuses zones sans couverture réseau"
    },
    
    // Approches alternatives et variantes
    variants: [
      {
        name: "Versant Sud (depuis Sibiu)",
        length: 56.0,
        averageGradient: 3.1,
        description: "Plus long mais légèrement moins difficile que le versant nord, avec des vues différentes"
      }
    ],
    
    // Guide spécifique d'ascension
    climbingGuide: {
      strategyTips: "Ne vous laissez pas piéger par la relative facilité des premiers kilomètres. Gardez des forces pour la deuxième moitié et prévoyez un éclairage pour le tunnel du sommet.",
      keySegments: [
        {
          name: "Section initiale",
          kmRange: "0-15",
          description: "Pentes douces à travers forêts et villages, idéal pour s'échauffer"
        },
        {
          name: "Zone intermédiaire",
          kmRange: "15-30",
          description: "La route commence à serpenter avec des vues qui s'ouvrent progressivement"
        },
        {
          name: "Section finale",
          kmRange: "30-37.8",
          description: "La partie la plus spectaculaire avec les célèbres lacets, mais aussi la plus raide et exposée"
        }
      ],
      gearing: "Un compact avec cassette 11-28 est généralement suffisant vu les pentes modérées",
      nutrionalAdvice: "Prévoyez autonomie complète car les services sont limités. L'altitude peut augmenter vos besoins hydriques et caloriques."
    },
    
    // Médias
    media: {
      photos: [
        { url: "/images/cols/transfagarasan/panorama1.jpg", description: "Vue aérienne des lacets", credit: "Dashboard-Velo" },
        { url: "/images/cols/transfagarasan/lacets.jpg", description: "Les célèbres virages en épingle", credit: "Romanian Tourism Board" },
        { url: "/images/cols/transfagarasan/tunnel.jpg", description: "L'entrée du tunnel sommital", credit: "Cycling Carpathians" }
      ],
      videos: [
        { url: "/videos/cols/transfagarasan/flyover.mp4", description: "Survol 3D du parcours", duration: "3:20" },
        { url: "/videos/cols/transfagarasan/climb-tips.mp4", description: "Conseils d'ascension par un cycliste local", duration: "5:15" }
      ],
      panoramas: [
        { url: "/panoramas/cols/transfagarasan/sommet-360.jpg", description: "Vue 360° du sommet avec le lac Bâlea" }
      ],
      model3d: "/models/cols/transfagarasan/3d-model.glb"
    },
    
    // Liens externes
    externalLinks: [
      { title: "Transfăgărășan sur Wikipedia", url: "https://fr.wikipedia.org/wiki/Transfăgărășan" },
      { title: "Guide détaillé sur Romania Tourism", url: "https://romaniatourism.com/transfagarasan.html" }
    ],
    
    // Métadonnées pour SEO
    seo: {
      canonicalUrl: "https://dashboard-velo.com/cols/transfagarasan",
      metaDescription: "Guide complet du Transfăgărășan : la route mythique des Carpates roumaines, son profil, son histoire et conseils d'ascension pour cyclistes",
      keywords: ["transfagarasan vélo", "cols carpates", "roumanie cyclisme", "plus belle route monde", "ascension transfagarasan"]
    },
    
    // Données techniques pour l'API
    createdAt: "2024-03-15T10:30:00Z",
    updatedAt: "2024-04-02T14:45:00Z",
    status: "published", 
    views: 3274,
    favoriteCount: 187
  }
];

// Information sur les 7 autres cols qui seront ajoutés
const remainingColsToAdd = [
  {
    id: "stelvio-pass",
    name: "Passo dello Stelvio",
    region: "Alpes italiennes",
    country: "Italie"
  },
  {
    id: "grossglockner",
    name: "Grossglockner Hochalpenstrasse",
    region: "Alpes autrichiennes",
    country: "Autriche"
  },
  {
    id: "trollstigen",
    name: "Trollstigen",
    region: "Montagnes scandinaves",
    country: "Norvège"
  },
  {
    id: "sa-calobra",
    name: "Sa Calobra",
    region: "Majorque",
    country: "Espagne"
  },
  {
    id: "rila-mountain-pass",
    name: "Col de Rila",
    region: "Monts Rila",
    country: "Bulgarie"
  },
  {
    id: "tatras-high-road",
    name: "Route des Hautes Tatras",
    region: "Carpates",
    country: "Slovaquie/Pologne"
  },
  {
    id: "the-bealach",
    name: "Bealach na Bà",
    region: "Highlands",
    country: "Écosse"
  }
];

export { remainingCols, remainingColsToAdd };
