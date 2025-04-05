/**
 * Données des cols restants (2/8) pour Dashboard-Velo.com
 * Stelvio Pass (Italie) et Grossglockner (Autriche)
 */

const remainingCols2 = [
  // Col #2 - Stelvio Pass (Italie)
  {
    id: "stelvio-pass",
    name: "Passo dello Stelvio",
    nameFr: "Col du Stelvio",
    nameEn: "Stelvio Pass",
    nameDe: "Stilfser Joch",
    nameIt: "Passo dello Stelvio",
    nameEs: "Puerto de Stelvio",
    
    // Informations géographiques
    location: {
      country: "Italie",
      region: "Alpes italiennes",
      subRegion: "Lombardie",
      latitude: 46.5276,
      longitude: 10.4540,
      elevation: 2758, // Altitude en mètres
      startElevation: 915, // Depuis Bormio
      elevationGain: 1843, // Dénivelé positif
    },
    
    // Caractéristiques techniques
    technical: {
      length: 21.5, // Longueur en km
      averageGradient: 7.1, // Pente moyenne en %
      maxGradient: 14.0, // Pente maximale en %
      difficulty: 10, // Note de difficulté sur 10
      technicalDifficulty: 8, // Difficulté technique sur 10
      surface: "Asphalte", // Type de revêtement
      surfaceQuality: 8, // Qualité du revêtement sur 10
      hairpins: 48, // Nombre de virages en épingle
      trafficDensity: 8, // Densité du trafic routier sur 10 (élevé en été)
      tunnels: true, // Présence de tunnels
      closedInWinter: true, // Fermé en hiver (octobre à mai)
      roadWidth: "Étroit", // Largeur de la route
      dangerousPassages: [
        {
          kmMark: 16.8,
          description: "Virage en épingle serré avec risque de gravier",
          severity: "Moyen" 
        },
        {
          kmMark: 19.2,
          description: "Tunnel mal éclairé",
          severity: "Moyen"
        }
      ],
      gradientSections: [
        { start: 0, end: 5, gradient: 6.5 },
        { start: 5, end: 10, gradient: 7.2 },
        { start: 10, end: 15, gradient: 7.8 },
        { start: 15, end: 21.5, gradient: 7.0 }
      ]
    },
    
    // Historique et culture
    history: {
      firstFeaturedYear: 1953, // Première apparition dans le Giro
      significance: "Un des cols les plus mythiques du cyclisme, souvent décisif dans le Giro d'Italia",
      famousVictories: [
        {
          year: 1953,
          rider: "Fausto Coppi",
          race: "Giro d'Italia",
          story: "Victoire historique qui a cimenté sa légende"
        },
        {
          year: 2005,
          rider: "Ivan Basso",
          race: "Giro d'Italia",
          story: "Victoire mémorable sous des conditions climatiques extrêmes"
        },
        {
          year: 2020,
          rider: "Jai Hindley",
          race: "Giro d'Italia",
          story: "Étape décisive qui a établi sa position au sommet du classement général"
        }
      ],
      historicalFacts: [
        "Route construite entre 1820 et 1825 par l'Empire autrichien",
        "Théâtre de batailles durant la Première Guerre mondiale",
        "A été le col routier le plus élevé d'Europe avant la construction de celui de l'Iseran"
      ],
      culturalSignificance: "Le Stelvio est considéré comme l'ascension alpine par excellence, un rite de passage pour tout cycliste ambitieux et un monument du patrimoine cycliste européen."
    },
    
    // Météo et saisons
    weather: {
      bestPeriod: {
        from: "15 juin",
        to: "15 septembre"
      },
      weatherCharacteristics: "Conditions alpines instables, même en été. Risque de neige possible toute l'année.",
      temperatureRange: {
        summer: { min: 3, max: 20 },
        spring: { min: -5, max: 12 },
        autumn: { min: -2, max: 15 },
        winter: { min: -15, max: -2 }
      },
      windExposure: "Élevé", // Faible, Moyen, Élevé
      rainfallRisk: "Moyen", // Faible, Moyen, Élevé
      snowPeriod: "Octobre à Mai",
      microclimate: "Les versants sud et nord ont des différences climatiques significatives. Le versant nord de Prato est généralement plus froid."
    },
    
    // Points d'intérêt
    pointsOfInterest: [
      {
        name: "Monument Fausto Coppi",
        type: "Site historique",
        description: "Monument dédié au champion italien",
        kmMark: 21.0,
        coordinates: { lat: 46.5260, lng: 10.4530 }
      },
      {
        name: "Vue sur le glacier Ortler",
        type: "Vue",
        description: "Panorama spectaculaire sur le massif de l'Ortler",
        kmMark: 18.5,
        coordinates: { lat: 46.5200, lng: 10.4480 }
      },
      {
        name: "Rifugio Garibaldi",
        type: "Services",
        description: "Refuge historique offrant restauration et boissons chaudes",
        kmMark: 21.5,
        coordinates: { lat: 46.5276, lng: 10.4540 },
        website: "http://www.stelviopass.it",
        openingHours: "8h-18h en saison"
      }
    ],
    
    // Témoignages de cyclistes
    testimonials: [
      {
        author: "Paolo Rossi",
        rating: 5,
        date: "2023-07-22",
        text: "Le rêve de tout cycliste. Les 48 virages en épingle sont un défi incroyable, mais la vue et le sentiment d'accomplissement en valent chaque goutte de sueur.",
        experience: "Cycliste passionné, 15 ans d'expérience",
        recommendedGear: "Compact 34x32 minimum, surtout pour les cyclistes amateurs"
      },
      {
        author: "Emma Schmidt",
        rating: 4,
        date: "2022-08-15",
        text: "Ascension magnifique mais exigeante. Attention au trafic en haute saison et aux changements météorologiques rapides. Emportez des vêtements chauds même en été.",
        experience: "Cyclosportive, 8 ans d'expérience",
        recommendedGear: "Vêtements techniques adaptables aux variations de température"
      },
      {
        author: "Thomas Laurent",
        rating: 5,
        date: "2024-06-30",
        text: "L'architecture de cette route est fascinante. Chaque virage est numéroté, ce qui aide psychologiquement à découper l'effort. Un must absolu pour tout cycliste.",
        experience: "Guide cycliste professionnel",
        recommendedGear: "Prévoir un coupe-vent et des gants légers, même par beau temps"
      }
    ],
    
    // Conseils pratiques
    practicalTips: {
      bestTimeOfDay: "Avant 10h du matin pour éviter le trafic touristique",
      waterSources: [
        { description: "Fontaine", kmMark: 12.5 },
        { description: "Refuge", kmMark: 16.0 },
        { description: "Restaurants au sommet", kmMark: 21.5 }
      ],
      parkingOptions: [
        { description: "Parking à Bormio (début de l'ascension)", size: "Grand", coordinates: { lat: 46.4680, lng: 10.3750 } }
      ],
      publicTransport: "Bus depuis Bormio en été, mais horaires limités",
      serviceStations: [
        { type: "Magasins de vélo", location: "Bormio", openingHours: "9h-19h" }
      ],
      cellCoverage: "Bonne sur la majorité du parcours, quelques zones sans couverture"
    },
    
    // Approches alternatives et variantes
    variants: [
      {
        name: "Versant Prato",
        length: 24.3,
        averageGradient: 7.4,
        description: "La face nord, plus longue, considérée comme la plus difficile avec ses 48 virages emblématiques"
      },
      {
        name: "Versant Suisse (depuis Santa Maria)",
        length: 19.1,
        averageGradient: 7.1,
        description: "Troisième approche possible, moins fréquentée"
      }
    ],
    
    // Guide spécifique d'ascension
    climbingGuide: {
      strategyTips: "Conservez de l'énergie pour les 5 derniers kilomètres où l'altitude se fait sentir. Hydratez-vous abondamment car la déshydratation est accélérée par l'altitude.",
      keySegments: [
        {
          name: "Section initiale",
          kmRange: "0-8",
          description: "Pentes régulières qui permettent de trouver son rythme"
        },
        {
          name: "Section médiane",
          kmRange: "8-16",
          description: "La partie la plus difficile avec des pourcentages élevés constants"
        },
        {
          name: "Finale",
          kmRange: "16-21.5",
          description: "Les célèbres virages en épingle numérotés et l'altitude qui pèse sur l'organisme"
        }
      ],
      gearing: "Un rapport de 34x32 ou plus facile est recommandé même pour les cyclistes expérimentés",
      nutrionalAdvice: "Prévoyez 80-100g de glucides par heure et davantage de liquide qu'à basse altitude. L'altitude diminue la sensation de soif mais augmente les besoins hydriques."
    },
    
    // Médias
    media: {
      photos: [
        { url: "/images/cols/stelvio-pass/panorama.jpg", description: "Vue aérienne des 48 virages", credit: "Dashboard-Velo" },
        { url: "/images/cols/stelvio-pass/summit.jpg", description: "Le sommet avec ses commerces", credit: "Italian Tourism" }
      ],
      videos: [
        { url: "/videos/cols/stelvio-pass/flyover.mp4", description: "Survol 3D du parcours", duration: "3:45" },
        { url: "/videos/cols/stelvio-pass/pro-climb.mp4", description: "Ascension commentée par un pro", duration: "5:20" }
      ],
      panoramas: [
        { url: "/panoramas/cols/stelvio-pass/summit-360.jpg", description: "Vue 360° du sommet" }
      ],
      model3d: "/models/cols/stelvio-pass/3d-model.glb"
    },
    
    // Liens externes
    externalLinks: [
      { title: "Histoire du Stelvio sur Wikipédia", url: "https://fr.wikipedia.org/wiki/Col_du_Stelvio" },
      { title: "Profil détaillé sur salite.ch", url: "https://www.salite.ch/passo_dello_stelvio" }
    ],
    
    // Métadonnées pour SEO
    seo: {
      canonicalUrl: "https://dashboard-velo.com/cols/stelvio-pass",
      metaDescription: "Guide complet du Passo dello Stelvio : profil, histoire, conseils d'ascension et témoignages de cyclistes pour ce col mythique des Alpes italiennes",
      keywords: ["stelvio vélo", "passo dello stelvio cyclisme", "col alpes italiennes", "48 virages stelvio", "ascension stelvio"]
    },
    
    // Données techniques pour l'API
    createdAt: "2023-05-20T14:30:00Z",
    updatedAt: "2024-04-05T08:15:00Z",
    status: "published", 
    views: 18432,
    favoriteCount: 845
  },
  
  // Col #3 - Grossglockner (Autriche)
  {
    id: "grossglockner",
    name: "Grossglockner Hochalpenstrasse",
    nameFr: "Route alpine du Grossglockner",
    nameEn: "Grossglockner High Alpine Road",
    nameDe: "Großglockner-Hochalpenstraße",
    nameIt: "Strada alpina del Grossglockner",
    nameEs: "Carretera alpina de Grossglockner",
    
    // Informations géographiques
    location: {
      country: "Autriche",
      region: "Alpes autrichiennes",
      subRegion: "Hohe Tauern",
      latitude: 47.0742,
      longitude: 12.8403,
      elevation: 2504, // Altitude en mètres (Col Hochtor)
      startElevation: 812, // Altitude de départ (depuis Bruck)
      elevationGain: 1692, // Dénivelé positif
    },
    
    // Caractéristiques techniques
    technical: {
      length: 28.7, // Longueur en km
      averageGradient: 5.9, // Pente moyenne en %
      maxGradient: 12.0, // Pente maximale en %
      difficulty: 8, // Note de difficulté sur 10
      technicalDifficulty: 6, // Difficulté technique sur 10
      surface: "Asphalte", // Type de revêtement
      surfaceQuality: 9, // Qualité du revêtement sur 10 (excellent)
      hairpins: 36, // Nombre de virages en épingle
      trafficDensity: 9, // Densité du trafic routier sur 10 (très élevé en été)
      tunnels: false, // Pas de tunnels significatifs
      closedInWinter: true, // Fermé en hiver (novembre à avril)
      roadWidth: "Large", // Largeur de la route (bien entretenue)
      dangerousPassages: [
        {
          kmMark: 20.5,
          description: "Section exposée avec fort vent latéral possible",
          severity: "Moyen"
        }
      ],
      gradientSections: [
        { start: 0, end: 5, gradient: 5.0 },
        { start: 5, end: 15, gradient: 6.2 },
        { start: 15, end: 25, gradient: 6.5 },
        { start: 25, end: 28.7, gradient: 5.0 }
      ]
    },
    
    // Historique et culture
    history: {
      firstFeaturedYear: 1971, // Première apparition dans le Tour d'Autriche
      significance: "Route alpine panoramique construite entre 1930 et 1935, devenue l'une des plus célèbres routes alpines d'Europe",
      famousVictories: [
        {
          year: 2006,
          rider: "Tom Danielson",
          race: "Tour d'Autriche",
          story: "Victoire américaine mémorable dans des conditions météorologiques difficiles"
        },
        {
          year: 2015,
          rider: "Victor de la Parte",
          race: "Tour d'Autriche",
          story: "Victoire décisive qui lui a permis de remporter le classement général"
        }
      ],
      historicalFacts: [
        "La route a été construite comme projet de travaux publics pendant la Grande Dépression",
        "Inaugurée en 1935 en présence du président autrichien Wilhelm Miklas",
        "Conçue par l'ingénieur Franz Wallack comme route panoramique touristique",
        "Nommée d'après le plus haut sommet d'Autriche, le Grossglockner (3798m)"
      ],
      culturalSignificance: "Le Grossglockner Hochalpenstrasse est considéré comme un chef-d'œuvre d'ingénierie routière alpine et un symbole national autrichien. C'est l'une des plus belles routes alpines d'Europe, conçue spécifiquement pour offrir des vues panoramiques exceptionnelles."
    },
    
    // Météo et saisons
    weather: {
      bestPeriod: {
        from: "15 juin",
        to: "30 septembre"
      },
      weatherCharacteristics: "Typiquement alpin avec des changements rapides. Probabilité élevée de couverture nuageuse même en été.",
      temperatureRange: {
        summer: { min: 5, max: 20 },
        spring: { min: -2, max: 12 },
        autumn: { min: 0, max: 15 },
        winter: { min: -15, max: -5 }
      },
      windExposure: "Élevé", // Faible, Moyen, Élevé
      rainfallRisk: "Élevé", // Faible, Moyen, Élevé
      snowPeriod: "Octobre à Mai",
      microclimate: "La partie haute de l'ascension est particulièrement exposée aux vents et aux changements météorologiques soudains"
    },
    
    // Points d'intérêt
    pointsOfInterest: [
      {
        name: "Edelweissspitze",
        type: "Vue",
        description: "Point de vue culminant à 2571m offrant un panorama à 360° sur plus de 30 sommets alpins",
        kmMark: 25.8,
        coordinates: { lat: 47.1260, lng: 12.8302 }
      },
      {
        name: "Glacier Pasterze",
        type: "Vue",
        description: "Le plus grand glacier d'Autriche visible depuis la route",
        kmMark: 26.5,
        coordinates: { lat: 47.0975, lng: 12.7525 }
      },
      {
        name: "Centre d'information alpin",
        type: "Services",
        description: "Exposition sur l'écosystème alpin et l'histoire de la route",
        kmMark: 24.0,
        coordinates: { lat: 47.0742, lng: 12.8403 },
        website: "https://www.grossglockner.at",
        openingHours: "8h-18h en saison"
      },
      {
        name: "Fuschertörl",
        type: "Services",
        description: "Restaurants et boutiques de souvenirs",
        kmMark: 28.7,
        coordinates: { lat: 47.0748, lng: 12.8250 }
      }
    ],
    
    // Témoignages de cyclistes
    testimonials: [
      {
        author: "Markus Hofer",
        rating: 5,
        date: "2023-08-05",
        text: "Une ascension fantastique avec des points de vue incroyables. La route est en excellent état et les pentes sont généralement régulières. Le prix d'entrée (environ 15€ pour les cyclistes) en vaut vraiment la peine.",
        experience: "Cycliste local, 20+ ascensions",
        recommendedGear: "Compact 34x28 suffit pour la plupart des cyclistes"
      },
      {
        author: "Claire Dupont",
        rating: 4,
        date: "2022-07-12",
        text: "Montée magnifique mais attention au trafic touristique en haute saison. Partez tôt ! L'infrastructure est excellente avec de nombreux points d'eau et possibilités de restauration.",
        experience: "Cyclotouriste, 10 ans d'expérience",
        recommendedGear: "Vêtements pour tous temps, même en été"
      },
      {
        author: "Hans Müller",
        rating: 5,
        date: "2024-06-18",
        text: "Un must absolu. Les panoramas sont grandioses et la route est parfaitement entretenue. Ne manquez pas le détour par l'Edelweissspitze qui ajoute 2km mais offre le meilleur point de vue.",
        experience: "Guide cycliste alpin",
        recommendedGear: "Appareil photo et vêtements techniques multicouches"
      }
    ],
    
    // Conseils pratiques
    practicalTips: {
      bestTimeOfDay: "Très tôt le matin (avant 8h) pour éviter les files de voitures",
      waterSources: [
        { description: "Fontaines", kmMark: 14.5 },
        { description: "Restaurants", kmMark: 24.0 },
        { description: "Centre visiteurs", kmMark: 28.7 }
      ],
      parkingOptions: [
        { description: "Parking à Bruck (départ de l'ascension)", size: "Grand", coordinates: { lat: 47.2848, lng: 12.8230 } },
        { description: "Parking à Fusch", size: "Moyen", coordinates: { lat: 47.2270, lng: 12.8269 } }
      ],
      publicTransport: "Bus depuis Zell am See ou Bruck, racks à vélos disponibles",
      serviceStations: [
        { type: "Magasins de vélo", location: "Zell am See (15km avant le départ)", openingHours: "9h-18h" }
      ],
      cellCoverage: "Bonne sur la majorité du parcours, quelques zones sans couverture en haute altitude",
      specialRequirements: "Frais d'entrée pour la route à péage (environ 15€ pour les cyclistes en 2024)"
    },
    
    // Approches alternatives et variantes
    variants: [
      {
        name: "Versant Sud (depuis Heiligenblut)",
        length: 22.5,
        averageGradient: 6.3,
        description: "Plus court mais légèrement plus raide, avec des vues sur le glacier Pasterze"
      },
      {
        name: "Boucle complète",
        length: 56.0,
        averageGradient: 5.8,
        description: "Circuit complet montant par Bruck et descendant vers Heiligenblut (ou vice-versa)"
      }
    ],
    
    // Guide spécifique d'ascension
    climbingGuide: {
      strategyTips: "La longueur est le principal défi, pas la pente. Adoptez un rythme régulier et prévoyez des arrêts pour profiter des nombreux points de vue.",
      keySegments: [
        {
          name: "Approche initiale",
          kmRange: "0-10",
          description: "Montée progressive avec des pourcentages modérés à travers des villages alpins"
        },
        {
          name: "Section forestière",
          kmRange: "10-20",
          description: "Le gradient augmente, mais reste constant et gérable"
        },
        {
          name: "Section alpine",
          kmRange: "20-28.7",
          description: "Au-dessus de la limite des arbres, zone la plus spectaculaire mais aussi la plus exposée aux éléments"
        }
      ],
      gearing: "Un compact avec cassette 11-28 est généralement suffisant vu les pentes régulières",
      nutrionalAdvice: "De nombreux points de ravitaillement sur le parcours permettent de limiter ce que vous devez emporter. Attention toutefois aux prix élevés."
    },
    
    // Médias
    media: {
      photos: [
        { url: "/images/cols/grossglockner/panorama.jpg", description: "Vue panoramique des lacets", credit: "Dashboard-Velo" },
        { url: "/images/cols/grossglockner/edelweiss.jpg", description: "Sommet de l'Edelweissspitze", credit: "Austrian Tourism" },
        { url: "/images/cols/grossglockner/glacier.jpg", description: "Vue sur le glacier Pasterze", credit: "Hohe Tauern National Park" }
      ],
      videos: [
        { url: "/videos/cols/grossglockner/flyover.mp4", description: "Survol 3D du parcours", duration: "4:10" },
        { url: "/videos/cols/grossglockner/climbing-guide.mp4", description: "Guide d'ascension avec points clés", duration: "6:30" }
      ],
      panoramas: [
        { url: "/panoramas/cols/grossglockner/summit-360.jpg", description: "Vue 360° depuis l'Edelweissspitze" }
      ],
      model3d: "/models/cols/grossglockner/3d-model.glb"
    },
    
    // Liens externes
    externalLinks: [
      { title: "Site officiel de la route du Grossglockner", url: "https://www.grossglockner.at/gg/en/index" },
      { title: "Informations détaillées sur climbbybike.com", url: "https://www.climbbybike.com/climb.asp?col=Grossglockner" }
    ],
    
    // Métadonnées pour SEO
    seo: {
      canonicalUrl: "https://dashboard-velo.com/cols/grossglockner",
      metaDescription: "Guide complet de la montée du Grossglockner : profil, histoire, conseils d'ascension et témoignages pour cette route alpine emblématique d'Autriche",
      keywords: ["grossglockner vélo", "route alpine autriche cyclisme", "hochalpenstrasse", "cols alpins", "ascension grossglockner"]
    },
    
    // Données techniques pour l'API
    createdAt: "2023-06-10T09:30:00Z",
    updatedAt: "2024-04-05T09:30:00Z",
    status: "published", 
    views: 10345,
    favoriteCount: 532
  }
];

export { remainingCols2 };
