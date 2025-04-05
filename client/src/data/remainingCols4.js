/**
 * Données des cols restants (4/8) pour Dashboard-Velo.com
 * Col de Rila (Bulgarie) et Route des Hautes Tatras (Slovaquie/Pologne)
 */

const remainingCols4 = [
  // Col #6 - Col de Rila (Bulgarie)
  {
    id: "rila-mountain-pass",
    name: "Rilski Prohod",
    nameFr: "Col de Rila",
    nameEn: "Rila Mountain Pass",
    nameDe: "Rila-Pass",
    nameIt: "Passo di Rila",
    nameEs: "Puerto de Rila",
    
    // Informations géographiques
    location: {
      country: "Bulgarie",
      region: "Monts Rila",
      subRegion: "Bulgarie occidentale",
      latitude: 42.1338,
      longitude: 23.3628,
      elevation: 1530, // Altitude en mètres
      startElevation: 640, // Altitude de départ (depuis Blagoevgrad)
      elevationGain: 890, // Dénivelé positif
    },
    
    // Caractéristiques techniques
    technical: {
      length: 26.8, // Longueur en km
      averageGradient: 3.3, // Pente moyenne en %
      maxGradient: 8.0, // Pente maximale en %
      difficulty: 6, // Note de difficulté sur 10
      technicalDifficulty: 5, // Difficulté technique sur 10
      surface: "Asphalte", // Type de revêtement
      surfaceQuality: 6, // Qualité du revêtement sur 10 (moyen)
      hairpins: 14, // Nombre de virages en épingle
      trafficDensity: 5, // Densité du trafic routier sur 10
      tunnels: false, // Pas de tunnels
      closedInWinter: false, // Ouvert toute l'année mais conditions difficiles
      roadWidth: "Moyen", // Largeur de la route
      dangerousPassages: [
        {
          kmMark: 18.5,
          description: "Section avec risque de glissement de terrain après fortes pluies",
          severity: "Moyen"
        },
        {
          kmMark: 24.0,
          description: "Portion de route avec nids-de-poule fréquents",
          severity: "Moyen"
        }
      ],
      gradientSections: [
        { start: 0, end: 10, gradient: 2.8 },
        { start: 10, end: 20, gradient: 3.5 },
        { start: 20, end: 26.8, gradient: 4.0 }
      ]
    },
    
    // Historique et culture
    history: {
      firstFeaturedYear: 2005, // Première apparition dans le Tour de Bulgarie
      significance: "Principal col des montagnes de Rila, reliant la vallée de Struma au monastère de Rila",
      famousVictories: [
        {
          year: 2009,
          rider: "Ivaïlo Gabrovski",
          race: "Tour de Bulgarie",
          story: "Victoire du champion local qui a établi le record de l'ascension"
        }
      ],
      historicalFacts: [
        "Route historique menant au monastère de Rila, le plus grand monastère orthodoxe de Bulgarie, fondé au Xe siècle",
        "A servi de voie de communication traditionnelle entre les régions de Sofia et de Blagoevgrad",
        "Était autrefois un chemin muletier avant la construction de la route moderne dans les années 1960",
        "Les montagnes de Rila abritent le plus haut sommet des Balkans, le Musala (2925m)"
      ],
      culturalSignificance: "Le col de Rila est un élément important du patrimoine culturel bulgare, car il constitue la principale voie d'accès au monastère de Rila, site classé au patrimoine mondial de l'UNESCO et haut lieu spirituel orthodoxe."
    },
    
    // Météo et saisons
    weather: {
      bestPeriod: {
        from: "15 mai",
        to: "30 septembre"
      },
      weatherCharacteristics: "Climat continental montagnard avec étés chauds et hivers froids. Brouillard fréquent au printemps et en automne.",
      temperatureRange: {
        summer: { min: 10, max: 25 },
        spring: { min: 3, max: 18 },
        autumn: { min: 5, max: 20 },
        winter: { min: -10, max: 5 }
      },
      windExposure: "Moyen", // Faible, Moyen, Élevé
      rainfallRisk: "Moyen", // Faible, Moyen, Élevé
      snowPeriod: "Décembre à Mars",
      microclimate: "Les parties boisées offrent une bonne protection contre le soleil et le vent. La partie haute est plus exposée aux intempéries."
    },
    
    // Points d'intérêt
    pointsOfInterest: [
      {
        name: "Monastère de Rila",
        type: "Site historique",
        description: "Le plus grand monastère orthodoxe de Bulgarie, patrimoine mondial de l'UNESCO",
        kmMark: 28.5, // À 1.7km après le col
        coordinates: { lat: 42.1338, lng: 23.3400 }
      },
      {
        name: "Point de vue sur les Monts Rila",
        type: "Vue",
        description: "Panorama sur le massif et le plus haut sommet des Balkans (Musala)",
        kmMark: 24.0,
        coordinates: { lat: 42.1250, lng: 23.3700 }
      },
      {
        name: "Restaurant traditionnel Rila",
        type: "Services",
        description: "Taverne proposant des spécialités bulgares authentiques",
        kmMark: 26.8,
        coordinates: { lat: 42.1338, lng: 23.3628 },
        website: "http://www.rilarestaurant.bg",
        openingHours: "10h-22h (tous les jours en saison)"
      }
    ],
    
    // Témoignages de cyclistes
    testimonials: [
      {
        author: "Dimitar Petrov",
        rating: 4,
        date: "2023-06-18",
        text: "Une ascension agréable avec une pente modérée qui permet d'apprécier le paysage. La récompense est double: d'abord le col puis le magnifique monastère de Rila juste après. Attention à la qualité variable du revêtement.",
        experience: "Cycliste bulgare local",
        recommendedGear: "Un 39x25 est suffisant vu le pourcentage modéré"
      },
      {
        author: "Hélène Martin",
        rating: 4,
        date: "2022-08-05",
        text: "Ascension sans grande difficulté mais très belle, traversant différents paysages de forêts et offrant de belles vues. La visite du monastère de Rila est un must après l'effort. Peu fréquentée par les cyclistes internationaux, c'est une vraie découverte!",
        experience: "Cyclotouriste, 15 pays visités à vélo",
        recommendedGear: "Prévoir de quoi sécuriser son vélo pour visiter le monastère"
      },
      {
        author: "Stefan Ivanov",
        rating: 5,
        date: "2024-05-20",
        text: "L'un des joyaux cyclistes méconnus des Balkans. La pente est douce mais constante, idéale pour un effort modéré. Culturellement, c'est une ascension exceptionnelle avec le monastère au bout. Peu de services sur la route, soyez autonomes.",
        experience: "Guide cycliste en Bulgarie",
        recommendedGear: "Vêtements légers mais prévoir une couche supplémentaire pour la descente"
      }
    ],
    
    // Conseils pratiques
    practicalTips: {
      bestTimeOfDay: "Matinée pour éviter les orages d'été fréquents l'après-midi",
      waterSources: [
        { description: "Fontaine", kmMark: 12.5 },
        { description: "Source naturelle", kmMark: 19.2 },
        { description: "Restaurants au col", kmMark: 26.8 }
      ],
      parkingOptions: [
        { description: "Parking à Blagoevgrad (départ)", size: "Grand", coordinates: { lat: 42.0208, lng: 23.0930 } }
      ],
      publicTransport: "Bus depuis Sofia jusqu'à Blagoevgrad, puis connexions limitées vers le monastère",
      serviceStations: [
        { type: "Magasin de vélo", location: "Blagoevgrad", openingHours: "9h-18h (fermé le dimanche)" }
      ],
      cellCoverage: "Bonne près des villes, limitée dans certaines sections forestières",
      culturalTips: "Prévoir des vêtements appropriés pour visiter le monastère (épaules et genoux couverts)"
    },
    
    // Approches alternatives et variantes
    variants: [
      {
        name: "Versant Est (depuis Samokov)",
        length: 32.0,
        averageGradient: 2.8,
        description: "Plus long mais plus doux, avec vue sur le barrage Iskar"
      },
      {
        name: "Circuit des Sept Lacs de Rila",
        length: 68.0,
        averageGradient: "Variable",
        description: "Extension spectaculaire incluant la région des sept lacs glaciaires"
      }
    ],
    
    // Guide spécifique d'ascension
    climbingGuide: {
      strategyTips: "La pente régulière permet de maintenir un rythme constant. Profitez-en pour admirer le paysage et économiser de l'énergie pour explorer le monastère.",
      keySegments: [
        {
          name: "Section initiale",
          kmRange: "0-10",
          description: "Montée douce à travers la vallée avec végétation méditerranéenne"
        },
        {
          name: "Section forestière",
          kmRange: "10-20",
          description: "Traversée de forêts de pins avec quelques passages plus pentus"
        },
        {
          name: "Approche finale",
          kmRange: "20-26.8",
          description: "Sortie de la forêt avec vues panoramiques et approche du col"
        }
      ],
      gearing: "Un rapport standard est suffisant car les pentes restent modérées",
      nutrionalAdvice: "Prévoyez suffisamment d'eau car les points de ravitaillement sont limités. Possibilité de se restaurer au col et au monastère."
    },
    
    // Médias
    media: {
      photos: [
        { url: "/images/cols/rila-mountain-pass/monastery.jpg", description: "Le monastère de Rila près du col", credit: "Dashboard-Velo" },
        { url: "/images/cols/rila-mountain-pass/forest-road.jpg", description: "La route à travers la forêt de pins", credit: "Bulgarian Tourism" },
        { url: "/images/cols/rila-mountain-pass/summit.jpg", description: "Vue depuis le col", credit: "Cycling Balkans" }
      ],
      videos: [
        { url: "/videos/cols/rila-mountain-pass/flyover.mp4", description: "Survol 3D du parcours", duration: "3:20" },
        { url: "/videos/cols/rila-mountain-pass/cultural-guide.mp4", description: "Guide culturel de l'ascension", duration: "4:45" }
      ],
      panoramas: [
        { url: "/panoramas/cols/rila-mountain-pass/summit-360.jpg", description: "Vue 360° depuis le col" }
      ],
      model3d: "/models/cols/rila-mountain-pass/3d-model.glb"
    },
    
    // Liens externes
    externalLinks: [
      { title: "Site officiel du monastère de Rila", url: "https://rilskimanastir.org" },
      { title: "Guide touristique de la région", url: "https://bulgariatravel.org/rila-monastery/" }
    ],
    
    // Métadonnées pour SEO
    seo: {
      canonicalUrl: "https://dashboard-velo.com/cols/rila-mountain-pass",
      metaDescription: "Guide complet du Col de Rila : ascension cycliste vers le célèbre monastère bulgare, profil, conseils et témoignages pour découvrir cette perle des Balkans",
      keywords: ["col rila vélo", "monastère rila cyclisme", "bulgarie cyclotourisme", "cols balkans", "ascension monts rila"]
    },
    
    // Données techniques pour l'API
    createdAt: "2023-09-12T13:20:00Z",
    updatedAt: "2024-04-05T11:15:00Z",
    status: "published", 
    views: 5234,
    favoriteCount: 287
  },
  
  // Col #7 - Route des Hautes Tatras (Slovaquie/Pologne)
  {
    id: "tatras-high-road",
    name: "Tatranska Magistrala",
    nameFr: "Route des Hautes Tatras",
    nameEn: "High Tatras Road",
    nameDe: "Hohe Tatra Straße",
    nameIt: "Strada degli Alti Tatra",
    nameEs: "Carretera de los Altos Tatras",
    
    // Informations géographiques
    location: {
      country: "Slovaquie/Pologne",
      region: "Carpates",
      subRegion: "Hautes Tatras",
      latitude: 49.1690,
      longitude: 20.2682,
      elevation: 1230, // Altitude du point culminant en mètres
      startElevation: 680, // Altitude de départ (depuis Tatranska Lomnica)
      elevationGain: 550, // Dénivelé positif
    },
    
    // Caractéristiques techniques
    technical: {
      length: 34.5, // Longueur en km (route entière)
      averageGradient: 2.5, // Pente moyenne en %
      maxGradient: 8.0, // Pente maximale en %
      difficulty: 6, // Note de difficulté sur 10
      technicalDifficulty: 5, // Difficulté technique sur 10
      surface: "Asphalte", // Type de revêtement
      surfaceQuality: 7, // Qualité du revêtement sur 10
      hairpins: 8, // Nombre de virages en épingle
      trafficDensity: 6, // Densité du trafic routier sur 10
      tunnels: false, // Pas de tunnels
      closedInWinter: false, // Généralement ouvert mais conditions hivernales difficiles
      roadWidth: "Moyen", // Largeur de la route
      dangerousPassages: [
        {
          kmMark: 24.0,
          description: "Passage exposé avec risque de traversée d'animaux (ours occasionnellement)",
          severity: "Moyen"
        }
      ],
      gradientSections: [
        { start: 0, end: 10, gradient: 3.2 },
        { start: 10, end: 20, gradient: 2.0 },
        { start: 20, end: 30, gradient: 2.5 },
        { start: 30, end: 34.5, gradient: 1.8 }
      ]
    },
    
    // Historique et culture
    history: {
      firstFeaturedYear: 1998, // Première apparition dans une course cycliste notable
      significance: "Route panoramique traversant le parc national des Hautes Tatras à la frontière slovaco-polonaise",
      famousVictories: [
        {
          year: 2010,
          rider: "Peter Sagan",
          race: "Championnat de Slovaquie",
          story: "Première victoire nationale du futur champion du monde sur ses routes d'entraînement"
        }
      ],
      historicalFacts: [
        "La route traverse l'un des plus anciens parcs nationaux d'Europe, créé en 1949",
        "Elle longe la frontière slovaco-polonaise, autrefois partie de la frontière de l'empire austro-hongrois",
        "A connu plusieurs modifications suite à la tempête de 2004 qui a détruit une grande partie de la forêt",
        "Témoigne de l'histoire des stations thermales des Tatras, populaires depuis le 19e siècle"
      ],
      culturalSignificance: "La route des Hautes Tatras représente un patrimoine partagé entre la Slovaquie et la Pologne, traversant une région reconnue comme réserve de biosphère par l'UNESCO. C'est un symbole de la coopération transfrontalière dans les Carpates."
    },
    
    // Météo et saisons
    weather: {
      bestPeriod: {
        from: "1er juin",
        to: "30 septembre"
      },
      weatherCharacteristics: "Climat montagnard avec changements rapides. Possibilité d'orages violents l'après-midi en été.",
      temperatureRange: {
        summer: { min: 8, max: 22 },
        spring: { min: 2, max: 15 },
        autumn: { min: 5, max: 17 },
        winter: { min: -15, max: 0 }
      },
      windExposure: "Moyen", // Faible, Moyen, Élevé
      rainfallRisk: "Élevé", // Faible, Moyen, Élevé
      snowPeriod: "Novembre à Avril",
      microclimate: "Les versants sud bénéficient d'un ensoleillement plus important, tandis que les vallées peuvent rester dans le brouillard"
    },
    
    // Points d'intérêt
    pointsOfInterest: [
      {
        name: "Štrbské Pleso",
        type: "Vue",
        description: "Lac glaciaire emblématique à 1346m d'altitude",
        kmMark: 14.5,
        coordinates: { lat: 49.1241, lng: 20.0560 }
      },
      {
        name: "Observatoire de Skalnaté Pleso",
        type: "Site historique",
        description: "Observatoire astronomique accessible en téléphérique depuis la route",
        kmMark: 8.2,
        coordinates: { lat: 49.1892, lng: 20.2347 }
      },
      {
        name: "Station de Stary Smokovec",
        type: "Services",
        description: "Centre touristique historique avec restaurants et hébergements",
        kmMark: 22.0,
        coordinates: { lat: 49.1392, lng: 20.2223 },
        website: "https://regiontatry.sk",
        openingHours: "Services disponibles toute la journée"
      },
      {
        name: "Point de vue Lomnicky štít",
        type: "Vue",
        description: "Vue sur le deuxième plus haut sommet des Tatras (2634m)",
        kmMark: 6.5,
        coordinates: { lat: 49.1947, lng: 20.2131 }
      }
    ],
    
    // Témoignages de cyclistes
    testimonials: [
      {
        author: "Marek Novak",
        rating: 4,
        date: "2023-07-02",
        text: "Plus qu'une simple ascension, c'est un parcours panoramique traversant plusieurs microclimats. Les pentes sont douces mais la longueur peut être éprouvante. Attention aux changements météorologiques soudains, même en été.",
        experience: "Cycliste slovaque local",
        recommendedGear: "Vêtements adaptables aux changements de température"
      },
      {
        author: "Julia Kowalski",
        rating: 5,
        date: "2022-08-15",
        text: "Un must pour les amateurs de cyclotourisme! La route offre des vues spectaculaires sur les plus hauts sommets des Carpates. J'ai particulièrement apprécié les nombreux services disponibles le long du parcours et la possibilité de faire des pauses culturelles.",
        experience: "Cyclotouriste polonaise",
        recommendedGear: "Appareil photo et protection contre la pluie"
      },
      {
        author: "Thomas Weber",
        rating: 4,
        date: "2024-06-10",
        text: "Une ascension modérée mais longue avec un intérêt culturel et paysager exceptionnel. La diversité des paysages est impressionnante. Point négatif: la circulation peut être dense en haute saison touristique.",
        experience: "Guide cycliste pour l'Europe centrale",
        recommendedGear: "Casque miroir pour garder un œil sur le trafic derrière vous"
      }
    ],
    
    // Conseils pratiques
    practicalTips: {
      bestTimeOfDay: "Tôt le matin pour éviter les touristes et les orages d'après-midi",
      waterSources: [
        { description: "Fontaines dans les stations", kmMark: 8.5 },
        { description: "Restaurants", kmMark: 14.5 },
        { description: "Sources aménagées", kmMark: 22.0 }
      ],
      parkingOptions: [
        { description: "Parking à Tatranska Lomnica", size: "Grand", coordinates: { lat: 49.1656, lng: 20.2773 } },
        { description: "Parking à Štrbské Pleso", size: "Grand", coordinates: { lat: 49.1241, lng: 20.0560 } }
      ],
      publicTransport: "Train électrique (TEŽ) reliant les principales stations des Tatras, accepte les vélos",
      serviceStations: [
        { type: "Location et réparation de vélos", location: "Poprad (15km du début)", openingHours: "9h-18h" }
      ],
      cellCoverage: "Bonne sur l'ensemble du parcours",
      wildlifeWarning: "Région connue pour sa population d'ours. Restez sur les routes principales et soyez vigilants."
    },
    
    // Approches alternatives et variantes
    variants: [
      {
        name: "Boucle transfrontalière",
        length: 80.0,
        averageGradient: "Variable",
        description: "Circuit complet traversant la frontière slovaco-polonaise plusieurs fois"
      },
      {
        name: "Extension Zakopane",
        length: 54.0,
        averageGradient: 2.2,
        description: "Prolongement jusqu'à la célèbre station polonaise de Zakopane"
      }
    ],
    
    // Guide spécifique d'ascension
    climbingGuide: {
      strategyTips: "Ne vous laissez pas piéger par les pentes modérées, la longueur peut être éprouvante. Prévoyez des pauses et profitez des nombreux points d'intérêt.",
      keySegments: [
        {
          name: "Montée vers Tatranska Lomnica",
          kmRange: "0-10",
          description: "Approche progressive avec des vues qui s'ouvrent sur les sommets"
        },
        {
          name: "Segment central panoramique",
          kmRange: "10-25",
          description: "Section la plus spectaculaire traversant plusieurs stations avec services"
        },
        {
          name: "Approche de Štrbské Pleso",
          kmRange: "25-34.5",
          description: "Finale en pente douce vers le lac emblématique des Hautes Tatras"
        }
      ],
      gearing: "Un rapport standard est largement suffisant vu les pentes modérées",
      nutrionalAdvice: "De nombreux points de ravitaillement permettent de voyager léger, mais prévoyez toujours une réserve d'eau en cas d'orage imprévu."
    },
    
    // Médias
    media: {
      photos: [
        { url: "/images/cols/tatras-high-road/lake-view.jpg", description: "Vue sur le lac Štrbské Pleso", credit: "Dashboard-Velo" },
        { url: "/images/cols/tatras-high-road/mountains.jpg", description: "Panorama sur les sommets des Tatras", credit: "Slovak Tourism" },
        { url: "/images/cols/tatras-high-road/forest-road.jpg", description: "Route à travers la forêt de conifères", credit: "Carpathian Cycling" }
      ],
      videos: [
        { url: "/videos/cols/tatras-high-road/flyover.mp4", description: "Survol 3D du parcours", duration: "4:45" },
        { url: "/videos/cols/tatras-high-road/four-seasons.mp4", description: "La route à travers les quatre saisons", duration: "3:30" }
      ],
      panoramas: [
        { url: "/panoramas/cols/tatras-high-road/peak-view-360.jpg", description: "Vue 360° depuis le point culminant" }
      ],
      model3d: "/models/cols/tatras-high-road/3d-model.glb"
    },
    
    // Liens externes
    externalLinks: [
      { title: "Site officiel du parc national des Tatras", url: "https://www.tanap.org/en/" },
      { title: "Guide cycliste des Carpates", url: "https://www.carpathiancycling.com" }
    ],
    
    // Métadonnées pour SEO
    seo: {
      canonicalUrl: "https://dashboard-velo.com/cols/tatras-high-road",
      metaDescription: "Guide complet de la Route des Hautes Tatras : parcours cycliste panoramique à la frontière slovaco-polonaise, profil, conseils et témoignages pour cette traversée des Carpates",
      keywords: ["tatras vélo", "route hautes tatras", "carpates cyclisme", "slovaquie pologne cyclotourisme", "štrbské pleso"]
    },
    
    // Données techniques pour l'API
    createdAt: "2023-10-05T09:30:00Z",
    updatedAt: "2024-04-05T11:45:00Z",
    status: "published", 
    views: 4876,
    favoriteCount: 253
  }
];

export { remainingCols4 };
