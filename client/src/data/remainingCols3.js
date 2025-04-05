/**
 * Données des cols restants (3/8) pour Dashboard-Velo.com
 * Trollstigen (Norvège) et Sa Calobra (Espagne/Majorque)
 */

const remainingCols3 = [
  // Col #4 - Trollstigen (Norvège)
  {
    id: "trollstigen",
    name: "Trollstigen",
    nameFr: "La Route des Trolls",
    nameEn: "Trolls' Path",
    nameDe: "Trollstiegen",
    nameIt: "Strada dei Trolls",
    nameEs: "Camino de los Trolls",
    
    // Informations géographiques
    location: {
      country: "Norvège",
      region: "Montagnes scandinaves",
      subRegion: "Comté de Møre og Romsdal",
      latitude: 62.4572,
      longitude: 7.6696,
      elevation: 852, // Altitude en mètres
      startElevation: 15, // Altitude de départ
      elevationGain: 837, // Dénivelé positif
    },
    
    // Caractéristiques techniques
    technical: {
      length: 11.0, // Longueur en km
      averageGradient: 7.6, // Pente moyenne en %
      maxGradient: 12.0, // Pente maximale en %
      difficulty: 8, // Note de difficulté sur 10
      technicalDifficulty: 9, // Difficulté technique sur 10
      surface: "Asphalte", // Type de revêtement
      surfaceQuality: 8, // Qualité du revêtement sur 10
      hairpins: 11, // Nombre de virages en épingle
      trafficDensity: 9, // Densité du trafic routier sur 10 (très élevé en été)
      tunnels: false, // Présence de tunnels
      closedInWinter: true, // Fermé en hiver (octobre à mai)
      roadWidth: "Étroit", // Largeur de la route
      dangerousPassages: [
        {
          kmMark: 7.5,
          description: "Virage en épingle très serré avec exposition au vide",
          severity: "Élevé"
        },
        {
          kmMark: 9.2,
          description: "Route étroite avec circulation dense et risque de chute d'eau sur la chaussée",
          severity: "Moyen"
        }
      ],
      gradientSections: [
        { start: 0, end: 3, gradient: 6.0 },
        { start: 3, end: 8, gradient: 8.5 },
        { start: 8, end: 11, gradient: 7.0 }
      ]
    },
    
    // Historique et culture
    history: {
      firstFeaturedYear: 2012, // Première apparition dans le Tour des Fjords
      significance: "Une des routes touristiques les plus spectaculaires de Scandinavie, construite entre 1928 et 1936",
      famousVictories: [
        {
          year: 2013,
          rider: "Alexander Kristoff",
          race: "Tour des Fjords",
          story: "Victoire du champion norvégien sur ses terres"
        }
      ],
      historicalFacts: [
        "Construite entièrement à la main entre 1928 et 1936",
        "Nommée d'après les figures de la mythologie nordique, les trolls",
        "Classée route touristique nationale depuis 1998",
        "A été utilisée comme décor dans plusieurs films et publicités internationales"
      ],
      culturalSignificance: "Trollstigen est un symbole national norvégien et un chef-d'œuvre d'ingénierie routière dans un paysage extrêmement difficile. Elle illustre la détermination nordique à maîtriser une nature particulièrement hostile."
    },
    
    // Météo et saisons
    weather: {
      bestPeriod: {
        from: "15 juin",
        to: "31 août"
      },
      weatherCharacteristics: "Climat nordique instable et frais. Précipitations fréquentes toute l'année.",
      temperatureRange: {
        summer: { min: 5, max: 18 },
        spring: { min: 0, max: 10 },
        autumn: { min: 2, max: 12 },
        winter: { min: -10, max: 0 }
      },
      windExposure: "Élevé", // Faible, Moyen, Élevé
      rainfallRisk: "Très élevé", // Faible, Moyen, Élevé, Très élevé
      snowPeriod: "Octobre à Mai",
      microclimate: "L'environnement des fjords crée des microclimats changeants avec possibilité de brouillard soudain"
    },
    
    // Points d'intérêt
    pointsOfInterest: [
      {
        name: "Plateforme d'observation Trollstigen",
        type: "Vue",
        description: "Structure moderne offrant une vue plongeante sur les lacets",
        kmMark: 11.0,
        coordinates: { lat: 62.4572, lng: 7.6696 }
      },
      {
        name: "Cascade Stigfossen",
        type: "Vue",
        description: "Impressionnante chute d'eau de 320m visible le long de l'ascension",
        kmMark: 8.5,
        coordinates: { lat: 62.4540, lng: 7.6680 }
      },
      {
        name: "Centre visiteurs Trollstigen",
        type: "Services",
        description: "Architecture moderne avec restaurant, boutiques et expositions",
        kmMark: 11.0,
        coordinates: { lat: 62.4572, lng: 7.6696 },
        website: "https://www.nasjonaleturistveger.no",
        openingHours: "10h-18h en saison"
      }
    ],
    
    // Témoignages de cyclistes
    testimonials: [
      {
        author: "Erik Johansen",
        rating: 5,
        date: "2023-07-14",
        text: "Une ascension inoubliable dans un cadre surréaliste. Les cascades, les montagnes escarpées et les virages en épingle créent une expérience unique. Attention au trafic touristique intense en haute saison.",
        experience: "Cycliste local, natif de Åndalsnes",
        recommendedGear: "Vêtements imperméables obligatoires, même par beau temps"
      },
      {
        author: "Sophie Mercier",
        rating: 4,
        date: "2022-08-02",
        text: "Paysages à couper le souffle, mais l'expérience est gâchée par le nombre de véhicules en été. À faire absolument très tôt le matin. La descente nécessite une grande vigilance car la route est étroite et souvent mouillée.",
        experience: "Cyclotouriste, 5 ans d'expérience",
        recommendedGear: "Freins en parfait état et vêtements chauds/imperméables"
      },
      {
        author: "Lars Nielsen",
        rating: 5,
        date: "2024-06-05",
        text: "Un joyau scandinave avec sa route qui serpente au milieu des cascades. J'ai eu la chance de la gravir un jour de semaine tôt en juin, avant le pic touristique. C'était magique d'avoir cette merveille presque pour moi seul.",
        experience: "Guide de voyages cyclistes nordiques",
        recommendedGear: "Caméra étanche et système d'éclairage (pour le brouillard)"
      }
    ],
    
    // Conseils pratiques
    practicalTips: {
      bestTimeOfDay: "Entre 6h et 8h du matin pour éviter l'afflux touristique",
      waterSources: [
        { description: "Cascades naturelles (eau non traitée)", kmMark: 5.5 },
        { description: "Centre visiteurs", kmMark: 11.0 }
      ],
      parkingOptions: [
        { description: "Parking à Åndalsnes (début potentiel)", size: "Grand", coordinates: { lat: 62.5676, lng: 7.6874 } }
      ],
      publicTransport: "Train jusqu'à Åndalsnes, puis bus occasionnels",
      serviceStations: [
        { type: "Commerces et services", location: "Åndalsnes (15km)", openingHours: "9h-20h" }
      ],
      cellCoverage: "Correcte mais inégale dans les zones encaissées",
      specialRequirements: "L'ascension est gratuite pour les cyclistes, contrairement aux véhicules motorisés"
    },
    
    // Approches alternatives et variantes
    variants: [
      {
        name: "Boucle Geiranger-Trollstigen",
        length: 106.0,
        averageGradient: "Variable",
        description: "Circuit touristique complet incluant le col d'Ørnevegen et Trollstigen, une journée épique"
      }
    ],
    
    // Guide spécifique d'ascension
    climbingGuide: {
      strategyTips: "Les infrastructures touristiques au sommet peuvent être bondées. Prévoyez d'arriver tôt pour profiter des vues. La route étant étroite, restez vigilant et visible.",
      keySegments: [
        {
          name: "Approche initiale",
          kmRange: "0-4",
          description: "Montée régulière qui suit la vallée, bon échauffement"
        },
        {
          name: "Section des cascades",
          kmRange: "4-8",
          description: "La route commence à serpenter sérieusement avec la cascade Stigfossen en vue"
        },
        {
          name: "Virages en épingle finaux",
          kmRange: "8-11",
          description: "La partie la plus spectaculaire et technique avec 11 virages en épingle serrés"
        }
      ],
      gearing: "Un rapport de 34x28 est recommandé pour les cyclistes moyens",
      nutrionalAdvice: "Prévoyez une autonomie complète en eau et nourriture car les prix au centre visiteurs sont très élevés"
    },
    
    // Médias
    media: {
      photos: [
        { url: "/images/cols/trollstigen/aerial.jpg", description: "Vue aérienne des 11 lacets", credit: "Dashboard-Velo" },
        { url: "/images/cols/trollstigen/waterfall.jpg", description: "Route longeant la cascade Stigfossen", credit: "Visit Norway" },
        { url: "/images/cols/trollstigen/viewpoint.jpg", description: "Plateforme d'observation moderne", credit: "Norwegian Architecture" }
      ],
      videos: [
        { url: "/videos/cols/trollstigen/flyover.mp4", description: "Survol 3D du parcours", duration: "2:45" },
        { url: "/videos/cols/trollstigen/morning-climb.mp4", description: "Ascension matinale sans circulation", duration: "5:10" }
      ],
      panoramas: [
        { url: "/panoramas/cols/trollstigen/viewpoint-360.jpg", description: "Vue 360° depuis la plateforme d'observation" }
      ],
      model3d: "/models/cols/trollstigen/3d-model.glb"
    },
    
    // Liens externes
    externalLinks: [
      { title: "Site officiel des routes touristiques norvégiennes", url: "https://www.nasjonaleturistveger.no/en/routes/geiranger-trollstigen" },
      { title: "Informations cyclistes sur visitnorway.com", url: "https://www.visitnorway.com/places-to-go/fjord-norway/northwest/listings-northwest/trollstigen/11862/" }
    ],
    
    // Métadonnées pour SEO
    seo: {
      canonicalUrl: "https://dashboard-velo.com/cols/trollstigen",
      metaDescription: "Guide complet du Trollstigen : la route des Trolls norvégienne, son profil, conseils d'ascension et témoignages pour cette ascension spectaculaire au pays des fjords",
      keywords: ["trollstigen vélo", "route des trolls cyclisme", "cols norvège", "ascension fjords", "lacets trollstigen"]
    },
    
    // Données techniques pour l'API
    createdAt: "2023-08-10T11:45:00Z",
    updatedAt: "2024-04-05T10:30:00Z",
    status: "published", 
    views: 6823,
    favoriteCount: 412
  },
  
  // Col #5 - Sa Calobra (Espagne/Majorque)
  {
    id: "sa-calobra",
    name: "Sa Calobra",
    nameFr: "Sa Calobra",
    nameEn: "Sa Calobra",
    nameDe: "Sa Calobra",
    nameIt: "Sa Calobra",
    nameEs: "Sa Calobra",
    
    // Informations géographiques
    location: {
      country: "Espagne",
      region: "Îles Baléares",
      subRegion: "Majorque",
      latitude: 39.8505,
      longitude: 2.8068,
      elevation: 682, // Altitude en mètres (Col de Cal Reis)
      startElevation: 0, // Altitude de départ (niveau de la mer)
      elevationGain: 682, // Dénivelé positif
    },
    
    // Caractéristiques techniques
    technical: {
      length: 9.4, // Longueur en km
      averageGradient: 7.1, // Pente moyenne en %
      maxGradient: 12.0, // Pente maximale en %
      difficulty: 8, // Note de difficulté sur 10
      technicalDifficulty: 9, // Difficulté technique sur 10
      surface: "Asphalte", // Type de revêtement
      surfaceQuality: 9, // Qualité du revêtement sur 10
      hairpins: 26, // Nombre de virages en épingle, dont le célèbre "nœud de cravate"
      trafficDensity: 8, // Densité du trafic routier sur 10 (élevé en haute saison touristique)
      tunnels: true, // Un tunnel en bas de l'ascension
      closedInWinter: false, // Ouvert toute l'année
      roadWidth: "Très étroit", // Largeur de la route
      dangerousPassages: [
        {
          kmMark: 2.5,
          description: "Le 'nœud de cravate', virage à 270° sans visibilité",
          severity: "Élevé"
        },
        {
          kmMark: 0.5,
          description: "Tunnel non éclairé de 200m",
          severity: "Moyen"
        }
      ],
      gradientSections: [
        { start: 0, end: 3, gradient: 6.5 },
        { start: 3, end: 6, gradient: 7.3 },
        { start: 6, end: 9.4, gradient: 7.5 }
      ]
    },
    
    // Historique et culture
    history: {
      firstFeaturedYear: 2004, // Première apparition dans le Challenge de Majorque
      significance: "Ascension emblématique de Majorque, souvent utilisée par les équipes professionnelles pour leur camp d'entraînement hivernal",
      famousVictories: [
        {
          year: 2016,
          rider: "Bradley Wiggins",
          race: "Segment Strava (record non officiel)",
          story: "Record établi pendant son camp d'entraînement"
        }
      ],
      historicalFacts: [
        "Route construite dans les années 1930 pour relier le village de pêcheurs isolé",
        "Conçue par l'ingénieur Antonio Parietti qui a aussi créé la route de Formentor",
        "Longtemps utilisée uniquement pour le transport maritime avant le développement touristique",
        "Lieu d'entraînement privilégié d'équipes professionnelles comme Team Sky/Ineos, Movistar"
      ],
      culturalSignificance: "Sa Calobra est devenue un symbole du cyclisme à Majorque et un incontournable pour les cyclotouristes du monde entier. Elle représente parfaitement l'alliance entre beauté méditerranéenne et défi sportif."
    },
    
    // Météo et saisons
    weather: {
      bestPeriod: {
        from: "1er mars",
        to: "15 juin"
      },
      weatherCharacteristics: "Climat méditerranéen chaud et sec en été, doux en hiver. Risque de vent fort.",
      temperatureRange: {
        summer: { min: 20, max: 35 },
        spring: { min: 12, max: 25 },
        autumn: { min: 15, max: 28 },
        winter: { min: 8, max: 18 }
      },
      windExposure: "Élevé", // Faible, Moyen, Élevé
      rainfallRisk: "Faible", // Faible, Moyen, Élevé
      snowPeriod: "Jamais (très exceptionnellement)",
      microclimate: "La gorge peut créer un effet entonnoir amplifiant le vent. Les parties hautes sont plus exposées aux rafales."
    },
    
    // Points d'intérêt
    pointsOfInterest: [
      {
        name: "Nœud de cravate",
        type: "Vue",
        description: "Spectaculaire virage à 270° qui passe sous lui-même",
        kmMark: 2.5,
        coordinates: { lat: 39.8402, lng: 2.8106 }
      },
      {
        name: "Plage de Sa Calobra",
        type: "Vue",
        description: "Petite crique de galets encaissée dans des falaises impressionnantes",
        kmMark: 0,
        coordinates: { lat: 39.8515, lng: 2.7911 }
      },
      {
        name: "Torrent de Pareis",
        type: "Vue",
        description: "Gorge spectaculaire classée patrimoine naturel",
        kmMark: 0.2,
        coordinates: { lat: 39.8520, lng: 2.8080 }
      },
      {
        name: "Restaurants Sa Calobra",
        type: "Services",
        description: "Plusieurs établissements au pied de l'ascension",
        kmMark: 0,
        coordinates: { lat: 39.8515, lng: 2.7911 },
        website: "https://www.sacalobra.es",
        openingHours: "9h-19h (plus long en haute saison)"
      }
    ],
    
    // Témoignages de cyclistes
    testimonials: [
      {
        author: "David Taylor",
        rating: 5,
        date: "2023-04-12",
        text: "Une ascension unique qui mérite sa réputation. La particularité est qu'on descend généralement d'abord au bord de mer pour ensuite remonter, car c'est un cul-de-sac. Le nœud de cravate est un moment fort et toute l'ascension offre des vues magnifiques sur la mer.",
        experience: "Cycliste amateur, habitué des camps d'entraînement à Majorque",
        recommendedGear: "Compact 34x28 suffisant pour la plupart des cyclistes"
      },
      {
        author: "Maria Garcia",
        rating: 4,
        date: "2022-05-20",
        text: "Montée magnifique mais souvent surpeuplée de cyclistes et de voitures touristiques. À faire absolument hors saison ou très tôt le matin. La route est étroite et les bus touristiques peuvent rendre l'expérience stressante.",
        experience: "Cycliste locale majorquine",
        recommendedGear: "Éclairage pour le tunnel et vêtements visibles"
      },
      {
        author: "Jens Voigt",
        rating: 5,
        date: "2024-02-15",
        text: "J'ai gravi Sa Calobra des dizaines de fois pendant ma carrière lors des camps d'entraînement. C'est l'ascension parfaite pour travailler le seuil et la technique. L'hiver est la période idéale pour éviter la foule et profiter pleinement de cette merveille d'ingénierie.",
        experience: "Ex-cycliste professionnel",
        recommendedGear: "Coupe-vent pour la descente vers la mer qui peut être fraîche"
      }
    ],
    
    // Conseils pratiques
    practicalTips: {
      bestTimeOfDay: "Avant 9h ou après 16h pour éviter l'afflux touristique",
      waterSources: [
        { description: "Restaurants à Sa Calobra", kmMark: 0 },
        { description: "Fontaine à Escorca", kmMark: 11.5 }
      ],
      parkingOptions: [
        { description: "Petit parking au sommet (Col de Cal Reis)", size: "Petit", coordinates: { lat: 39.8248, lng: 2.8500 } }
      ],
      publicTransport: "Bus touristiques depuis Port de Sóller et Palma, ferry depuis Port de Sóller",
      serviceStations: [
        { type: "Magasins de vélo", location: "Port de Pollença (30km)", openingHours: "9h-19h" }
      ],
      cellCoverage: "Limitée dans les gorges, bonne au sommet",
      logistics: "Comme c'est un cul-de-sac, planifiez bien votre itinéraire. La plupart des cyclistes descendent d'abord puis remontent."
    },
    
    // Approches alternatives et variantes
    variants: [
      {
        name: "Boucle Sa Calobra - Puig Major",
        length: 62.0,
        averageGradient: "Variable",
        description: "Circuit classique incluant Sa Calobra et le plus haut col de l'île, le Puig Major"
      }
    ],
    
    // Guide spécifique d'ascension
    climbingGuide: {
      strategyTips: "La principale difficulté est de gérer la chaleur et la circulation. Partez tôt et emportez suffisamment d'eau. Attention au vent qui peut être traître dans les virages exposés.",
      keySegments: [
        {
          name: "Section initiale et tunnel",
          kmRange: "0-2",
          description: "Sortie de la crique avec un court tunnel puis début de la montée"
        },
        {
          name: "Nœud de cravate",
          kmRange: "2-3",
          description: "Section spectaculaire avec le virage emblématique à 270° passant sous lui-même"
        },
        {
          name: "Section finale",
          kmRange: "3-9.4",
          description: "Succession de virages en épingle avec vues panoramiques sur la mer et les montagnes"
        }
      ],
      gearing: "Un compact avec cassette 11-28 est généralement suffisant",
      nutrionalAdvice: "Emportez plus d'eau que d'habitude en été. L'exposition au soleil et la chaleur augmentent considérablement les besoins hydriques."
    },
    
    // Médias
    media: {
      photos: [
        { url: "/images/cols/sa-calobra/tie-knot.jpg", description: "Le célèbre virage en 'nœud de cravate'", credit: "Dashboard-Velo" },
        { url: "/images/cols/sa-calobra/aerial.jpg", description: "Vue aérienne des lacets", credit: "Mallorca Tourism" },
        { url: "/images/cols/sa-calobra/sea-view.jpg", description: "Vue sur la Méditerranée depuis la route", credit: "Cycling Mallorca" }
      ],
      videos: [
        { url: "/videos/cols/sa-calobra/flyover.mp4", description: "Survol 3D du parcours", duration: "2:30" },
        { url: "/videos/cols/sa-calobra/pro-training.mp4", description: "Entraînement d'équipes professionnelles", duration: "4:15" }
      ],
      panoramas: [
        { url: "/panoramas/cols/sa-calobra/summit-360.jpg", description: "Vue 360° depuis le sommet (Col de Cal Reis)" }
      ],
      model3d: "/models/cols/sa-calobra/3d-model.glb"
    },
    
    // Liens externes
    externalLinks: [
      { title: "Guide de Sa Calobra sur CyclingMallorca", url: "https://www.cycling-mallorca.com/sa-calobra" },
      { title: "Segment Strava officiel", url: "https://www.strava.com/segments/629046" }
    ],
    
    // Métadonnées pour SEO
    seo: {
      canonicalUrl: "https://dashboard-velo.com/cols/sa-calobra",
      metaDescription: "Guide complet de Sa Calobra : la perle cycliste de Majorque, son profil, son fameux 'nœud de cravate' et conseils d'ascension pour cette montée méditerranéenne",
      keywords: ["sa calobra vélo", "majorque cyclisme", "nœud cravate sa calobra", "ascension baléares", "col majorque"]
    },
    
    // Données techniques pour l'API
    createdAt: "2023-02-15T15:30:00Z",
    updatedAt: "2024-04-04T16:45:00Z",
    status: "published", 
    views: 14568,
    favoriteCount: 756
  }
];

export { remainingCols3 };
