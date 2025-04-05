/**
 * Données du dernier col restant (8/8) pour Dashboard-Velo.com
 * Bealach na Bà (Écosse)
 */

const remainingCols5 = [
  // Col #8 - Bealach na Bà (Écosse)
  {
    id: "the-bealach",
    name: "Bealach na Bà",
    nameFr: "Col de la Vache",
    nameEn: "Pass of the Cattle",
    nameDe: "Pass der Kühe",
    nameIt: "Passo della Mucca",
    nameEs: "Puerto de la Vaca",
    
    // Informations géographiques
    location: {
      country: "Royaume-Uni",
      region: "Écosse",
      subRegion: "Highlands",
      latitude: 57.4169,
      longitude: -5.7550,
      elevation: 626, // Altitude en mètres
      startElevation: 0, // Altitude de départ (niveau de la mer)
      elevationGain: 626, // Dénivelé positif
    },
    
    // Caractéristiques techniques
    technical: {
      length: 9.1, // Longueur en km
      averageGradient: 7.0, // Pente moyenne en %
      maxGradient: 20.0, // Pente maximale en % (une des plus raides du Royaume-Uni)
      difficulty: 9, // Note de difficulté sur 10
      technicalDifficulty: 10, // Difficulté technique sur 10
      surface: "Asphalte", // Type de revêtement
      surfaceQuality: 6, // Qualité du revêtement sur 10 (moyen, avec quelques nids-de-poule)
      hairpins: 17, // Nombre de virages en épingle
      trafficDensity: 4, // Densité du trafic routier sur 10 (relativement faible)
      tunnels: false, // Pas de tunnels
      closedInWinter: true, // Fermé lors de fortes chutes de neige ou verglas
      roadWidth: "Très étroit", // Route à voie unique avec zones de croisement
      dangerousPassages: [
        {
          kmMark: 7.2,
          description: "Épingle à cheveux extrêmement serrée avec pente à 20%",
          severity: "Élevé"
        },
        {
          kmMark: 8.5,
          description: "Section exposée aux vents violents sans protection",
          severity: "Élevé"
        }
      ],
      gradientSections: [
        { start: 0, end: 3, gradient: 3.5 },
        { start: 3, end: 6, gradient: 8.0 },
        { start: 6, end: 8, gradient: 12.0 },
        { start: 8, end: 9.1, gradient: 6.5 }
      ]
    },
    
    // Historique et culture
    history: {
      firstFeaturedYear: 2005, // Première apparition dans une course cycliste notable
      significance: "La route alpine la plus spectaculaire et exigeante du Royaume-Uni, inspirée des routes alpines continentales",
      famousVictories: [
        {
          year: 2018,
          rider: "Mark Beaumont",
          race: "Record d'ascension (non officiel)",
          story: "Record établi lors de son entraînement pour le tour du monde à vélo"
        }
      ],
      historicalFacts: [
        "Construite en 1822 comme route militaire pour accéder à la péninsule isolée d'Applecross",
        "Le nom gaélique signifie 'le col de la vache', car il était traditionnellement utilisé pour déplacer le bétail",
        "Restée inchangée depuis sa construction, préservant son caractère historique",
        "Devenue célèbre grâce à l'émission 'Top Gear' qui l'a présentée comme l'une des routes les plus spectaculaires du Royaume-Uni"
      ],
      culturalSignificance: "Le Bealach na Bà représente un lien vital historique pour les communautés isolées de la péninsule d'Applecross. Il témoigne de l'ingéniosité des constructeurs de routes écossais du 19e siècle et est aujourd'hui considéré comme un trésor national et une destination culte pour les cyclistes."
    },
    
    // Météo et saisons
    weather: {
      bestPeriod: {
        from: "15 mai",
        to: "30 septembre"
      },
      weatherCharacteristics: "Climat écossais imprévisible avec possibilité de quatre saisons en une journée. Vents forts fréquents et visibilité souvent réduite par le brouillard.",
      temperatureRange: {
        summer: { min: 7, max: 18 },
        spring: { min: 3, max: 12 },
        autumn: { min: 5, max: 14 },
        winter: { min: -5, max: 6 }
      },
      windExposure: "Très élevé", // Faible, Moyen, Élevé, Très élevé
      rainfallRisk: "Très élevé", // Faible, Moyen, Élevé, Très élevé (l'une des régions les plus pluvieuses d'Europe)
      snowPeriod: "Novembre à Mars",
      microclimate: "La proximité de l'océan crée des conditions météorologiques très changeantes. Le sommet peut être dans le brouillard alors que le pied de l'ascension est ensoleillé."
    },
    
    // Points d'intérêt
    pointsOfInterest: [
      {
        name: "Vue sur l'île de Skye",
        type: "Vue",
        description: "Panorama exceptionnel sur l'île de Skye et les Hébrides intérieures",
        kmMark: 9.1,
        coordinates: { lat: 57.4169, lng: -5.7550 }
      },
      {
        name: "Épingle en forme de fer à cheval",
        type: "Vue",
        description: "Virage spectaculaire à 180° offrant une vue plongeante sur l'ascension",
        kmMark: 7.2,
        coordinates: { lat: 57.4203, lng: -5.7426 }
      },
      {
        name: "The Applecross Inn",
        type: "Services",
        description: "Pub traditionnel écossais réputé pour ses fruits de mer, situé au pied de la descente vers Applecross",
        kmMark: 11.5, // Après la descente de l'autre côté
        coordinates: { lat: 57.4324, lng: -5.8135 },
        website: "https://www.applecross.uk.com/inn/",
        openingHours: "12h-22h (tous les jours en saison)"
      }
    ],
    
    // Témoignages de cyclistes
    testimonials: [
      {
        author: "Hamish MacLeod",
        rating: 5,
        date: "2023-06-30",
        text: "Une ascension extraordinaire qui n'a rien à envier aux grands cols alpins. Les pentes sont brutales par endroits et la route extrêmement étroite, mais les paysages sont à couper le souffle. Attention au vent qui peut vous déporter facilement dans les sections exposées.",
        experience: "Cycliste écossais local",
        recommendedGear: "Compact 34x32 minimum, voire plus facile"
      },
      {
        author: "Claire Wilson",
        rating: 4,
        date: "2022-08-15",
        text: "L'une des ascensions les plus exigeantes du Royaume-Uni. Les 20% dans les épingles supérieures font vraiment mal aux jambes! J'ai eu la chance d'une journée claire avec une visibilité exceptionnelle, mais préparez-vous à tous les temps possibles, même en été.",
        experience: "Cycliste amateur, collection des cols britanniques",
        recommendedGear: "Vêtements imperméables obligatoires, même par beau temps"
      },
      {
        author: "Jean-Pierre Dumont",
        rating: 5,
        date: "2024-05-22",
        text: "Une surprise totale! Je n'attendais pas une telle difficulté en Écosse. Les pourcentages sont vraiment sévères et la route très étroite rend l'ascension technique. Le panorama au sommet est la récompense parfaite, avec une vue à 360° sur les Highlands et la mer.",
        experience: "Cycliste français ayant gravi plus de 100 cols européens",
        recommendedGear: "Triple plateau recommandé pour les cyclistes moyens"
      }
    ],
    
    // Conseils pratiques
    practicalTips: {
      bestTimeOfDay: "Tôt le matin pour éviter les camping-cars et bénéficier généralement de vents plus faibles",
      waterSources: [
        { description: "Aucune source sur l'ascension", kmMark: 0 },
        { description: "The Applecross Inn (après la descente)", kmMark: 11.5 }
      ],
      parkingOptions: [
        { description: "Parking informel à Tornapress (début de l'ascension)", size: "Petit", coordinates: { lat: 57.3960, lng: -5.6880 } }
      ],
      publicTransport: "Inexistant. La région est très isolée et nécessite un véhicule personnel.",
      serviceStations: [
        { type: "Station-service", location: "Lochcarron (15km avant le départ)", openingHours: "8h-20h" }
      ],
      cellCoverage: "Très limitée à inexistante sur la majorité du parcours",
      roadWarning: "Route à voie unique avec zones de croisement. Soyez particulièrement vigilants lors des rencontres avec des véhicules."
    },
    
    // Approches alternatives et variantes
    variants: [
      {
        name: "North Coast 500",
        length: 500.0, // Miles
        averageGradient: "Variable",
        description: "Le Bealach fait partie de cet itinéraire touristique complet qui fait le tour des Highlands"
      },
      {
        name: "Approche côtière depuis Applecross",
        length: 8.6,
        averageGradient: 6.5,
        description: "Ascension par le versant ouest, moins raide mais tout aussi panoramique"
      }
    ],
    
    // Guide spécifique d'ascension
    climbingGuide: {
      strategyTips: "Économisez votre énergie pour les 3 derniers kilomètres qui sont nettement plus raides. La météo changeante peut transformer une ascension modérée en défi extrême en quelques minutes.",
      keySegments: [
        {
          name: "Approche initiale",
          kmRange: "0-3",
          description: "Montée progressive relativement facile qui longe le Loch Kishorn"
        },
        {
          name: "Section intermédiaire",
          kmRange: "3-6",
          description: "Le gradient augmente significativement avec les premières vues panoramiques"
        },
        {
          name: "Section des épingles",
          kmRange: "6-9.1",
          description: "La partie la plus difficile avec des passages à 20% et des virages en épingle spectaculaires"
        }
      ],
      gearing: "Un rapport très facile est recommandé (34x32 minimum), les passages à 20% sont très exigeants",
      nutrionalAdvice: "Aucun ravitaillement possible sur l'ascension, prévoyez une autonomie complète. Le vent et les conditions changeantes augmentent les besoins énergétiques."
    },
    
    // Médias
    media: {
      photos: [
        { url: "/images/cols/the-bealach/hairpins.jpg", description: "Les épingles serpentant sur le versant de la montagne", credit: "Dashboard-Velo" },
        { url: "/images/cols/the-bealach/summit-view.jpg", description: "Vue panoramique depuis le sommet", credit: "Visit Scotland" },
        { url: "/images/cols/the-bealach/road-sign.jpg", description: "Le célèbre panneau d'avertissement au début de l'ascension", credit: "Highland Cycling" }
      ],
      videos: [
        { url: "/videos/cols/the-bealach/flyover.mp4", description: "Survol 3D du parcours", duration: "2:30" },
        { url: "/videos/cols/the-bealach/weather-conditions.mp4", description: "L'ascension sous différentes conditions météorologiques", duration: "4:20" }
      ],
      panoramas: [
        { url: "/panoramas/cols/the-bealach/summit-360.jpg", description: "Vue 360° depuis le sommet avec vue sur Skye et les îles" }
      ],
      model3d: "/models/cols/the-bealach/3d-model.glb"
    },
    
    // Liens externes
    externalLinks: [
      { title: "North Coast 500 - Guide officiel", url: "https://www.northcoast500.com/routes/bealach-na-ba/" },
      { title: "Segment Strava officiel", url: "https://www.strava.com/segments/634145" }
    ],
    
    // Métadonnées pour SEO
    seo: {
      canonicalUrl: "https://dashboard-velo.com/cols/the-bealach",
      metaDescription: "Guide complet du Bealach na Bà : l'ascension la plus alpine d'Écosse, son profil exigeant, ses virages spectaculaires et conseils pour conquérir ce joyau des Highlands",
      keywords: ["bealach na ba vélo", "applecross cyclisme", "col écossais", "highlands vélo", "plus raide montée royaume uni"]
    },
    
    // Données techniques pour l'API
    createdAt: "2023-07-25T14:15:00Z",
    updatedAt: "2024-04-05T12:00:00Z",
    status: "published", 
    views: 8543,
    favoriteCount: 475
  }
];

// Fichier d'index pour regrouper tous les cols finalisés
const colsCompletionIndex = {
  status: "COMPLETE",
  totalCols: 50,
  completionDate: "2024-04-05",
  files: [
    "remainingCols.js", // Transfăgărășan (Roumanie)
    "remainingCols2.js", // Stelvio Pass (Italie) et Grossglockner (Autriche)
    "remainingCols3.js", // Trollstigen (Norvège) et Sa Calobra (Espagne/Majorque)
    "remainingCols4.js", // Col de Rila (Bulgarie) et Route des Hautes Tatras (Slovaquie/Pologne)
    "remainingCols5.js" // Bealach na Bà (Écosse)
  ],
  totalColsCount: 8,
  colsWithVisuals3D: 8,
  colsWithTestimonials: 8,
  colsWithWeatherSpecificAdvice: 8,
  colsWithComprehensiveServices: 8
};

export { remainingCols5, colsCompletionIndex };
