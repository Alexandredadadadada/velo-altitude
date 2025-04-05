/**
 * Modèle de données enrichi pour les cols européens
 * Ce modèle contient toutes les informations détaillées pour les 50+ cols modélisés en 3D
 */

// Exemple de structure complète pour un col
const colTemplate = {
  id: "col-id-unique",
  name: "Nom du Col",
  nameFr: "Nom du Col en français",
  nameEn: "Name of the Pass in English",
  nameDe: "Name des Passes auf Deutsch",
  nameIt: "Nome del Passo in italiano",
  nameEs: "Nombre del Puerto en español",
  
  // Informations géographiques
  location: {
    country: "France", // Pays
    region: "Alpes", // Région
    subRegion: "Savoie", // Sous-région
    latitude: 45.9219,
    longitude: 6.8696,
    elevation: 2642, // Altitude en mètres
    startElevation: 1045, // Altitude de départ
    elevationGain: 1597, // Dénivelé positif
  },
  
  // Caractéristiques techniques
  technical: {
    length: 21.3, // Longueur en km
    averageGradient: 7.5, // Pente moyenne en %
    maxGradient: 12.1, // Pente maximale en %
    difficulty: 9, // Note de difficulté sur 10
    technicalDifficulty: 8, // Difficulté technique sur 10
    surface: "Asphalte", // Type de revêtement
    surfaceQuality: 9, // Qualité du revêtement sur 10
    hairpins: 21, // Nombre de virages en épingle
    trafficDensity: 6, // Densité du trafic routier sur 10
    tunnels: false, // Présence de tunnels
    closedInWinter: true, // Fermé en hiver
    roadWidth: "Moyen", // Largeur de la route
    dangerousPassages: [
      {
        kmMark: 12.5,
        description: "Virage en épingle avec gravier possible",
        severity: "Moyen" // Léger, Moyen, Élevé
      }
    ],
    gradientSections: [
      { start: 0, end: 5, gradient: 5.5 },
      { start: 5, end: 10, gradient: 7.2 },
      { start: 10, end: 15, gradient: 8.9 },
      { start: 15, end: 21.3, gradient: 8.3 }
    ]
  },
  
  // Historique et culture
  history: {
    firstFeaturedYear: 1952, // Première apparition dans une course
    significance: "Haut lieu du Tour de France depuis les années 50",
    famousVictories: [
      {
        year: 1986,
        rider: "Bernard Hinault",
        race: "Tour de France",
        story: "Dernière victoire d'étape pour le Blaireau dans le Tour"
      },
      {
        year: 2018,
        rider: "Geraint Thomas",
        race: "Tour de France",
        story: "Victoire décisive pour son maillot jaune final"
      }
    ],
    historicalFacts: [
      "Inauguré comme route carrossable en 1935",
      "Théâtre d'une bataille durant la Seconde Guerre mondiale",
      "Monument aux cyclistes inauguré en 2000 au sommet"
    ],
    culturalSignificance: "Le col est considéré comme l'un des passages mythiques des Alpes, autant pour son panorama que pour les exploits sportifs qui s'y sont déroulés."
  },
  
  // Météo et saisons
  weather: {
    bestPeriod: {
      from: "15 juin",
      to: "15 septembre"
    },
    weatherCharacteristics: "Temps changeant, possibilité de brouillard soudain même en été",
    temperatureRange: {
      summer: { min: 8, max: 25 },
      spring: { min: 2, max: 18 },
      autumn: { min: 5, max: 20 },
      winter: { min: -10, max: 5 }
    },
    windExposure: "Élevé", // Faible, Moyen, Élevé
    rainfallRisk: "Moyen", // Faible, Moyen, Élevé
    snowPeriod: "Novembre à Mai",
    microclimate: "Le versant sud bénéficie généralement d'un ensoleillement plus important"
  },
  
  // Points d'intérêt
  pointsOfInterest: [
    {
      name: "Panorama du Mont Blanc",
      type: "Vue", // Vue, Site historique, Gastronomie, Services
      description: "Vue exceptionnelle sur le massif du Mont Blanc par temps clair",
      kmMark: 18.5,
      coordinates: { lat: 45.9100, lng: 6.8500 }
    },
    {
      name: "Refuge du Col",
      type: "Services",
      description: "Refuge offrant restauration et hébergement avec une spécialité de tartiflette",
      kmMark: 21.3,
      coordinates: { lat: 45.9219, lng: 6.8696 },
      website: "http://www.refugeducol.fr",
      openingHours: "8h-19h en saison"
    }
  ],
  
  // Témoignages de cyclistes
  testimonials: [
    {
      author: "Jean Dupont",
      rating: 5, // sur 5
      date: "2023-07-15",
      text: "Une ascension inoubliable avec des paysages à couper le souffle. La pente est exigeante mais régulière.",
      experience: "Cycliste amateur, 10 ans d'expérience",
      recommendedGear: "Compact 34x28 minimum"
    },
    {
      author: "Marie Laurent",
      rating: 4,
      date: "2022-08-22",
      text: "Magnifique montée mais attention au vent dans les 5 derniers kilomètres qui peut rendre l'effort beaucoup plus difficile.",
      experience: "Cyclosportive, 5 ans d'expérience",
      recommendedGear: "Prévoir un coupe-vent même par beau temps"
    }
  ],
  
  // Conseils pratiques
  practicalTips: {
    bestTimeOfDay: "Tôt le matin pour éviter le trafic",
    waterSources: [
      { description: "Fontaine", kmMark: 8.5 },
      { description: "Restaurant", kmMark: 15.2 }
    ],
    parkingOptions: [
      { description: "Parking gratuit au pied de l'ascension", size: "Grand", coordinates: { lat: 45.8500, lng: 6.8000 } }
    ],
    publicTransport: "Bus depuis Chamonix jusqu'au pied du col (ligne 4, été uniquement)",
    serviceStations: [
      { type: "Mécanicien vélo", location: "Village de départ", openingHours: "9h-18h" }
    ],
    cellCoverage: "Bonne couverture 4G jusqu'au sommet"
  },
  
  // Approches alternatives et variantes
  variants: [
    {
      name: "Versant Sud",
      length: 18.5,
      averageGradient: 8.1,
      description: "Plus court mais plus raide, avec moins de circulation"
    },
    {
      name: "Parcours cyclotourisme",
      length: 23.0,
      averageGradient: 7.0,
      description: "Variante passant par une route secondaire plus ombragée"
    }
  ],
  
  // Guide spécifique d'ascension
  climbingGuide: {
    strategyTips: "Gérez votre effort sur les 5 premiers kilomètres pour garder des forces pour la section finale plus raide",
    keySegments: [
      {
        name: "Premier tiers",
        kmRange: "0-7",
        description: "Pente régulière autour de 6%, idéal pour trouver son rythme"
      },
      {
        name: "Section médiane",
        kmRange: "7-14",
        description: "Les pourcentages augmentent avec quelques passages à 9-10%"
      },
      {
        name: "Final",
        kmRange: "14-21",
        description: "Section la plus difficile avec des pentes soutenues et le facteur altitude"
      }
    ],
    gearing: "Cassette 11-32 recommandée, voire plus facile pour les cyclistes moins expérimentés",
    nutrionalAdvice: "Consommez environ 60g de glucides par heure d'effort, en privilégiant les aliments liquides dans la partie finale"
  },
  
  // Médias
  media: {
    photos: [
      { url: "/images/cols/col-id-unique/panorama1.jpg", description: "Vue depuis le km 15", credit: "Dashboard-Velo" },
      { url: "/images/cols/col-id-unique/sommet.jpg", description: "Arrivée au sommet", credit: "Cycling Europe" }
    ],
    videos: [
      { url: "/videos/cols/col-id-unique/flyover.mp4", description: "Survol 3D du parcours", duration: "2:15" },
      { url: "/videos/cols/col-id-unique/climb-tips.mp4", description: "Conseils d'ascension par un pro", duration: "4:30" }
    ],
    panoramas: [
      { url: "/panoramas/cols/col-id-unique/sommet-360.jpg", description: "Vue 360° du sommet" }
    ],
    model3d: "/models/cols/col-id-unique/3d-model.glb"
  },
  
  // Liens externes
  externalLinks: [
    { title: "Histoire complète sur Wikipédia", url: "https://fr.wikipedia.org/wiki/Col_exemple" },
    { title: "Profil détaillé sur climbbybike.com", url: "https://www.climbbybike.com/col-exemple" }
  ],
  
  // Métadonnées pour SEO
  seo: {
    canonicalUrl: "https://dashboard-velo.com/cols/col-id-unique",
    metaDescription: "Guide complet du Col du Galibier : profil, histoire, conseils d'ascension et témoignages de cyclistes",
    keywords: ["col galibier", "ascension vélo galibier", "profil col alpes", "cols mythiques tour france"]
  },
  
  // Données techniques pour l'API
  createdAt: "2022-03-15T10:30:00Z",
  updatedAt: "2023-11-28T09:15:00Z",
  status: "published", // draft, published, featured
  views: 12547,
  favoriteCount: 432
};

/**
 * Structure enrichie pour les parcours de cols les plus emblématiques
 */
const iconicClimbGuideTemplate = {
  id: "iconic-climb-1",
  colId: "col-id-unique",
  title: "Conquérir le Col Mythique",
  description: "Guide complet pour préparer et réussir l'ascension du col le plus emblématique des Alpes",
  author: "Michel Expert",
  authorCredentials: "Ancien coureur professionnel, 5 ascensions du col en compétition",
  
  // Sections du guide
  sections: [
    {
      title: "Préparation physique",
      content: "Pour aborder ce col dans les meilleures conditions, une préparation spécifique de 8-12 semaines est recommandée. Voici un programme progressif adapté...",
      keyPoints: [
        "Travail spécifique sur la PMA et le seuil",
        "Entraînements en côtes longues (>30min)",
        "Sorties d'endurance avec dénivelé cumulé important"
      ]
    },
    {
      title: "Matériel spécifique",
      content: "Le choix du matériel peut grandement influencer votre expérience sur ce col...",
      recommendations: [
        {
          category: "Transmission",
          recommendation: "Privilégiez un compact avec une cassette 11-32 minimum",
          explanation: "Les sections à plus de 10% requièrent un braquet confortable"
        },
        {
          category: "Pneus",
          recommendation: "Optez pour des pneus de 25-28mm à bonne résistance à la crevaison",
          explanation: "Le revêtement peut présenter des imperfections dans certains virages"
        }
      ]
    },
    {
      title: "Analyse segment par segment",
      segments: [
        {
          name: "L'approche initiale (km 0-5)",
          description: "Cette section à 5-6% sert d'échauffement. Résistez à la tentation de partir trop vite.",
          tactic: "Restez 10-15% sous votre FTP pour économiser de l'énergie",
          pitfalls: "Le faux-plat au km 3 trompe souvent les cyclistes inexpérimentés"
        },
        {
          name: "Les virages en épingle (km 5-12)",
          description: "La route s'élève avec des passages entre 8-10% et de nombreux virages",
          tactic: "Adoptez une position assise confortable, anticipez les virages pour maintenir un rythme",
          keyPoints: "Les virages 7 et 9 sont particulièrement raides"
        }
        // Autres segments...
      ]
    },
    {
      title: "Nutrition et hydratation",
      content: "Une stratégie nutritionnelle adaptée est cruciale pour cette ascension de plus de 1h30...",
      plan: {
        before: "Repas riche en glucides 3h avant, en-cas léger 30min avant le départ",
        during: "60-90g de glucides/heure sous forme de boisson et gels/barres",
        hydration: "500-750ml/heure selon température, électrolytes recommandés"
      }
    },
    {
      title: "Conditions météorologiques",
      content: "Ce col est connu pour ses conditions changeantes...",
      scenarios: [
        {
          condition: "Chaleur (>25°C)",
          advice: "Partez tôt, hydratation accrue, vêtements légers et clairs"
        },
        {
          condition: "Risque d'orage",
          advice: "Vérifiez la météo avant, emportez un imperméable léger, n'hésitez pas à faire demi-tour"
        }
      ]
    },
    {
      title: "Récupération au sommet",
      content: "Les actions prises immédiatement après l'ascension sont importantes...",
      steps: [
        "Enfilez immédiatement une couche supplémentaire",
        "Consommez une boisson de récupération dans les 30 minutes",
        "Profitez du panorama mais ne restez pas immobile trop longtemps"
      ]
    }
  ],
  
  // Témoignage inspirant
  featuredTestimonial: {
    author: "Sophie Martin",
    achievement: "A gravi ce col après seulement 2 ans de pratique du vélo",
    quote: "Ce qui semblait impossible est devenu réalité grâce à une préparation méthodique et beaucoup de détermination.",
    tips: "Prenez le temps d'apprécier chaque kilomètre parcouru, c'est un voyage autant qu'un défi sportif."
  },
  
  // Ressources complémentaires
  relatedResources: [
    {
      type: "Programme d'entraînement",
      title: "Plan 8 semaines spécial cols alpins",
      link: "/training/programs/alpine-climbs-8-weeks"
    },
    {
      type: "Analyse nutritionnelle",
      title: "Nutrition optimale pour les longues ascensions",
      link: "/nutrition/guides/long-climbs"
    }
  ],
  
  createdAt: "2023-05-10T14:30:00Z",
  updatedAt: "2023-12-05T11:20:00Z",
  status: "published"
};

// Exporter les modèles
export { colTemplate, iconicClimbGuideTemplate };

/**
 * Structure pour la base de données des 50+ cols européens
 * À compléter avec des données réelles pour chaque col
 */
export const europeanCols = [
  // Alpes françaises
  {
    id: "alpe-huez",
    name: "Alpe d'Huez",
    location: {
      country: "France",
      region: "Alpes",
      subRegion: "Isère"
    },
    // Autres données à compléter selon le modèle
  },
  {
    id: "galibier",
    name: "Col du Galibier",
    location: {
      country: "France",
      region: "Alpes",
      subRegion: "Savoie/Hautes-Alpes"
    }
    // Autres données à compléter selon le modèle
  },
  // Pyrénées
  {
    id: "tourmalet",
    name: "Col du Tourmalet",
    location: {
      country: "France",
      region: "Pyrénées",
      subRegion: "Hautes-Pyrénées"
    }
    // Autres données à compléter selon le modèle
  },
  // Alpes italiennes
  {
    id: "stelvio",
    name: "Passo dello Stelvio",
    location: {
      country: "Italie",
      region: "Alpes",
      subRegion: "Lombardie"
    }
    // Autres données à compléter selon le modèle
  },
  // Espagne
  {
    id: "angliru",
    name: "Alto de l'Angliru",
    location: {
      country: "Espagne",
      region: "Asturies",
      subRegion: "Riosa"
    }
    // Autres données à compléter selon le modèle
  }
  // À compléter avec les 45+ autres cols européens
];
