/**
 * Cols du Jura
 * Données des cols cyclistes du massif jurassien
 */

const colsJura = [
  {
    id: 'grand-colombier',
    name: 'Grand Colombier',
    region: 'jura',
    country: 'France',
    altitude: 1501,
    length: 18.3,
    avgGradient: 7.6,
    maxGradient: 14,
    difficulty: 'hard',
    elevationGain: 1390,
    startLocation: 'Culoz',
    endLocation: 'Grand Colombier',
    description: 'Le Grand Colombier est l\'un des cols les plus difficiles du Jura, avec quatre versants différents dont certains particulièrement exigeants. Ses pentes sévères en font un terrain d\'entraînement privilégié pour les cyclistes professionnels de la région.',
    history: 'Intégré au Tour de France pour la première fois en 2012, le col s\'est rapidement fait connaître pour sa difficulté. En 2020, une étape s\'est terminée à son sommet avec une victoire de Tadej Pogačar.',
    imageUrl: '/images/cols/grand-colombier/main.jpg',
    profileUrl: '/images/cols/grand-colombier/profile.jpg',
    routes: [
      {
        name: 'Versant Sud (Culoz)',
        startLocation: 'Culoz',
        length: 18.3,
        elevationGain: 1390,
        avgGradient: 7.6,
        maxGradient: 14,
        difficulty: 'hard',
        description: 'L\'ascension la plus longue avec des passages très raides'
      },
      {
        name: 'Versant Ouest (Virieu-le-Petit)',
        startLocation: 'Virieu-le-Petit',
        length: 8.7,
        elevationGain: 790,
        avgGradient: 9.1,
        maxGradient: 19,
        difficulty: 'extreme',
        description: 'La montée la plus difficile, avec des passages à près de 20%'
      },
      {
        name: 'Versant Nord (Anglefort)',
        startLocation: 'Anglefort',
        length: 15.3,
        elevationGain: 1335,
        avgGradient: 8.7,
        maxGradient: 12,
        difficulty: 'hard',
        description: 'Version régulièrement difficile avec peu de répit'
      },
      {
        name: 'Versant Est (Artemare)',
        startLocation: 'Artemare',
        length: 18.4,
        elevationGain: 1255,
        avgGradient: 6.8,
        maxGradient: 10.5,
        difficulty: 'medium',
        description: 'La montée la plus longue mais avec une pente plus clémente'
      }
    ],
    popularSegments: [
      {
        name: 'Virieu - Sommet',
        length: 8.7,
        gradient: 9.1,
        description: 'Le versant le plus raide, véritable test pour les grimpeurs'
      }
    ],
    touristicInfo: 'Du sommet, on peut admirer une vue panoramique sur le lac du Bourget, le plus grand lac naturel de France, ainsi que sur les Alpes avec le Mont Blanc par temps clair.',
    facilities: [
      {
        type: 'water',
        location: 'Virieu-le-Petit',
        description: 'Fontaine au centre du village'
      },
      {
        type: 'food',
        location: 'Sommet',
        description: 'Restaurant ouvert en saison'
      }
    ],
    bestTimeToVisit: 'Mai à octobre',
    weatherInfo: 'Le sommet peut être venteux. Par temps clair, vue exceptionnelle sur les Alpes.',
    strava: {
      segmentId: '636973',
      komTime: '48:30',
      komName: 'Thibaut Pinot'
    }
  },
  {
    id: 'col-du-grand-colombier',
    name: 'Col du Grand Colombier',
    region: 'jura',
    country: 'France',
    altitude: 1501,
    length: 18.3,
    avgGradient: 7.6,
    maxGradient: 14,
    difficulty: 'extreme',
    elevationGain: 1391,
    startLocation: 'Culoz',
    endLocation: 'Col du Grand Colombier',
    description: 'Le Grand Colombier est l\'ascension la plus redoutable du Jura, avec des pentes parfois terribles qui ont fait souffrir les meilleurs coureurs du Tour de France. Culminant à plus de 1500m d\'altitude, il offre des panoramas exceptionnels sur le lac du Bourget, le massif de la Chartreuse et les Alpes.',
    history: 'Longtemps méconnu des organisateurs du Tour de France, le Grand Colombier a fait son entrée dans la Grande Boucle en 2012. Depuis, il s\'est imposé comme l\'un des cols les plus sélectifs du cyclisme moderne, notamment lors de l\'étape de 2020 où Tadej Pogacar a distancé Primoz Roglic dans l\'ascension finale.',
    imageUrl: '/images/cols/grand-colombier/main.jpg',
    profileUrl: '/images/cols/grand-colombier/profile.jpg',
    popularSegments: [
      {
        name: 'Virieu-le-Petit - Sommet',
        length: 8.7,
        gradient: 9.2,
        description: 'Section très exigeante avec plusieurs passages à plus de 12%'
      }
    ],
    routes: [
      {
        name: 'Versant Sud (Culoz)',
        startLocation: 'Culoz',
        length: 18.3,
        elevationGain: 1391,
        avgGradient: 7.6,
        maxGradient: 14,
        difficulty: 'extreme',
        description: 'L\'ascension mythique, considérée comme l\'une des plus difficiles de France'
      },
      {
        name: 'Versant Est (Artemare)',
        startLocation: 'Artemare',
        length: 15.9,
        elevationGain: 1255,
        avgGradient: 7.9,
        maxGradient: 14,
        difficulty: 'extreme',
        description: 'Montée par Virieu-le-Petit, extrêmement exigeante'
      },
      {
        name: 'Versant Ouest (Anglefort)',
        startLocation: 'Anglefort',
        length: 15.5,
        elevationGain: 1187,
        avgGradient: 7.7,
        maxGradient: 12,
        difficulty: 'hard',
        description: 'Ascension par la route de la Sapette, également très difficile'
      }
    ],
    touristicInfo: 'Du sommet, la vue panoramique s\'étend sur le lac du Bourget, la vallée du Rhône, le mont Blanc et les Alpes. Le site, classé Espace Naturel Sensible, abrite une flore et une faune exceptionnelles, notamment des rapaces comme le circaète Jean-le-Blanc.',
    facilities: [
      {
        type: 'water',
        location: 'Virieu-le-Petit',
        description: 'Fontaine dans le village'
      },
      {
        type: 'food',
        location: 'Sommet',
        description: 'Restaurant au sommet (ouvert en saison)'
      }
    ],
    bestTimeToVisit: 'Mai à octobre',
    weatherInfo: 'Col généralement ouvert d\'avril à novembre. En cas de forte chaleur, l\'ascension peut être particulièrement éprouvante car certaines sections sont très exposées au soleil.',
    strava: {
      segmentId: '615473',
      komTime: '48:15',
      komName: 'Thibaut Pinot'
    }
  },
  {
    id: 'col-de-la-faucille',
    name: 'Col de la Faucille',
    region: 'jura',
    country: 'France',
    altitude: 1323,
    length: 13.5,
    avgGradient: 5.8,
    maxGradient: 9,
    difficulty: 'medium',
    elevationGain: 783,
    startLocation: 'Gex',
    endLocation: 'Col de la Faucille',
    description: 'Le Col de la Faucille est un passage historique entre la Suisse et la France, offrant des vues spectaculaires sur le lac Léman et la chaîne du Mont-Blanc. Cette ascension régulière et bien entretenue est parfaite pour les cyclistes de tous niveaux, avec son gradient constant et ses lacets harmonieux au milieu des forêts de sapins du Jura.',
    history: 'Emprunté par le Tour de France dès 1911, le Col de la Faucille a vu passer des légendes comme Coppi, Anquetil et Hinault. C\'était autrefois un col stratégique sur la route Genève-Paris. Au sommet se trouve un ancien poste de douane témoignant de ce passé frontalier.',
    imageUrl: '/images/cols/faucille/main.jpg',
    profileUrl: '/images/cols/faucille/profile.jpg',
    popularSegments: [
      {
        name: 'Gex - Sommet',
        length: 11.2,
        gradient: 6.2,
        description: 'La montée classique depuis Gex, régulière et progressive'
      }
    ],
    routes: [
      {
        name: 'Versant Est (Gex)',
        startLocation: 'Gex',
        length: 13.5,
        elevationGain: 783,
        avgGradient: 5.8,
        maxGradient: 9,
        difficulty: 'medium',
        description: 'L\'ascension principale avec vue sur le lac Léman et les Alpes'
      },
      {
        name: 'Versant Ouest (Mijoux)',
        startLocation: 'Mijoux',
        length: 5.8,
        elevationGain: 282,
        avgGradient: 4.9,
        maxGradient: 7,
        difficulty: 'easy',
        description: 'Montée plus courte depuis la vallée de la Valserine'
      },
      {
        name: 'Versant Sud (Vesancy)',
        startLocation: 'Vesancy',
        length: 12.3,
        elevationGain: 725,
        avgGradient: 5.9,
        maxGradient: 8,
        difficulty: 'medium',
        description: 'Variante moins fréquentée avec des passages en forêt'
      }
    ],
    touristicInfo: 'Le col est une station de sports d\'hiver et d\'été avec plusieurs activités: randonnées, luge d\'été, ski, parapente. On y trouve la célèbre tyrolienne "La Faucille Aventure" et le Monnet Parc. Tout près se trouvent également le Mont Rond et le Col de Crozet.',
    facilities: [
      {
        type: 'water',
        location: 'Au col',
        description: 'Fontaines et services dans les établissements au sommet'
      },
      {
        type: 'food',
        location: 'Col de la Faucille',
        description: 'Plusieurs restaurants, hôtels et boulangerie au sommet'
      }
    ],
    bestTimeToVisit: 'Mai à octobre',
    weatherInfo: 'Ouvert toute l\'année, mais attention aux vents forts et au brouillard qui peuvent s\'installer rapidement. En hiver, la route est généralement bien déneigée mais des équipements peuvent être nécessaires.',
    strava: {
      segmentId: '686421',
      komTime: '35:12',
      komName: 'Romain Bardet'
    }
  },
  {
    id: 'col-joux-plane',
    name: 'Col de Joux Plane',
    region: 'jura',
    country: 'France',
    altitude: 1691,
    length: 11.6,
    avgGradient: 8.5,
    maxGradient: 12.5,
    difficulty: 'hard',
    elevationGain: 986,
    startLocation: 'Samoëns',
    endLocation: 'Col de Joux Plane',
    description: 'Situé entre le massif du Chablais et la vallée du Giffre, le Col de Joux Plane est réputé pour sa pente régulièrement difficile sans répit. Il est considéré comme l\'un des cols les plus exigeants du Tour de France.',
    history: 'Le col est célèbre pour avoir mis en difficulté Lance Armstrong lors du Tour de France 2000, où il fut lâché par Marco Pantani. C\'est aussi dans ce col que Richard Virenque a construit une de ses victoires d\'étape les plus mémorables.',
    imageUrl: '/images/cols/joux-plane/main.jpg',
    profileUrl: '/images/cols/joux-plane/profile.jpg',
    routes: [
      {
        name: 'Versant Est (Samoëns)',
        startLocation: 'Samoëns',
        length: 11.6,
        elevationGain: 986,
        avgGradient: 8.5,
        maxGradient: 12.5,
        difficulty: 'hard',
        description: 'L\'ascension classique, régulièrement difficile'
      },
      {
        name: 'Versant Ouest (Morzine)',
        startLocation: 'Morzine',
        length: 5.7,
        elevationGain: 340,
        avgGradient: 6,
        maxGradient: 9,
        difficulty: 'medium',
        description: 'Montée plus courte et moins difficile'
      }
    ],
    popularSegments: [
      {
        name: 'Forêt des Frasses',
        length: 4.5,
        gradient: 9.4,
        description: 'Section centrale à travers la forêt, particulièrement exigeante'
      }
    ],
    touristicInfo: 'Au sommet se trouve un petit lac alpin et une vue magnifique sur le Mont Blanc. La descente vers Morzine est technique et rapide.',
    facilities: [
      {
        type: 'water',
        location: 'Les Frasses et sommet',
        description: 'Fontaines'
      },
      {
        type: 'food',
        location: 'Sommet',
        description: 'Restaurant d\'altitude (ouvert en saison)'
      }
    ],
    bestTimeToVisit: 'Juin à septembre',
    weatherInfo: 'Conditions changeantes typiques de moyenne montagne. Le col est généralement fermé en hiver.',
    strava: {
      segmentId: '632581',
      komTime: '32:20',
      komName: 'Miguel Angel Lopez'
    }
  },
  {
    id: 'col-colombiere',
    name: 'Col de la Colombière',
    region: 'jura',
    country: 'France',
    altitude: 1613,
    length: 11.7,
    avgGradient: 8.5,
    maxGradient: 12,
    difficulty: 'hard',
    elevationGain: 995,
    startLocation: 'Scionzier',
    endLocation: 'Col de la Colombière',
    description: 'Situé entre la vallée de l\'Arve et le Grand-Bornand, le Col de la Colombière est une ascension classique du Tour de France. Il offre un panorama splendide sur les Aravis et le Mont-Blanc.',
    history: 'Apparu pour la première fois dans le Tour en 1960, il a été franchi à de nombreuses reprises depuis. En 2018, Julian Alaphilippe y a remporté une victoire d\'étape mémorable après une attaque dans la descente.',
    imageUrl: '/images/cols/colombiere/main.jpg',
    profileUrl: '/images/cols/colombiere/profile.jpg',
    routes: [
      {
        name: 'Versant Nord (Scionzier)',
        startLocation: 'Scionzier',
        length: 11.7,
        elevationGain: 995,
        avgGradient: 8.5,
        maxGradient: 12,
        difficulty: 'hard',
        description: 'Montée la plus difficile, avec des sections raides après Reposoir'
      },
      {
        name: 'Versant Sud (Le Grand-Bornand)',
        startLocation: 'Le Grand-Bornand',
        length: 7.5,
        elevationGain: 629,
        avgGradient: 8.4,
        maxGradient: 10.2,
        difficulty: 'medium',
        description: 'Version plus courte mais également exigeante'
      }
    ],
    popularSegments: [
      {
        name: 'Le Reposoir - Sommet',
        length: 7.5,
        gradient: 8.9,
        description: 'Section finale, la plus difficile de l\'ascension'
      }
    ],
    touristicInfo: 'Le col traverse la réserve naturelle du massif des Bornes et offre des vues superbes sur les Aravis et le Bargy.',
    facilities: [
      {
        type: 'water',
        location: 'Le Reposoir et sommet',
        description: 'Fontaines'
      },
      {
        type: 'food',
        location: 'Sommet',
        description: 'Restaurant Col de la Colombière'
      }
    ],
    bestTimeToVisit: 'Juin à septembre',
    weatherInfo: 'Le col est généralement fermé de novembre à mai. Conditions alpines avec changements météorologiques rapides.',
    strava: {
      segmentId: '630482',
      komTime: '33:15',
      komName: 'Primož Roglič'
    }
  },
  {
    id: 'mont-faron',
    name: 'Mont Faron',
    region: 'jura',
    country: 'France',
    altitude: 584,
    length: 5.5,
    avgGradient: 9.8,
    maxGradient: 14,
    difficulty: 'medium',
    elevationGain: 539,
    startLocation: 'Toulon',
    endLocation: 'Mont Faron',
    description: 'Bien que peu élevé, le Mont Faron est une ascension courte mais très raide qui surplombe la ville de Toulon et la Méditerranée. C\'est un classique du Tour du Haut Var et du Tour Méditerranéen.',
    history: 'Cette montée a servi d\'arrivée pour plusieurs courses professionnelles, notamment lors du Tour Méditerranéen. Elle a souvent été le théâtre d\'attaques décisives pour le classement général.',
    imageUrl: '/images/cols/mont-faron/main.jpg',
    profileUrl: '/images/cols/mont-faron/profile.jpg',
    routes: [
      {
        name: 'Versant Sud (Toulon)',
        startLocation: 'Toulon',
        length: 5.5,
        elevationGain: 539,
        avgGradient: 9.8,
        maxGradient: 14,
        difficulty: 'medium',
        description: 'L\'ascension classique, courte mais intense'
      }
    ],
    popularSegments: [
      {
        name: 'Virage en épingle - Sommet',
        length: 3.2,
        gradient: 10.5,
        description: 'Section la plus difficile après le premier virage en épingle'
      }
    ],
    touristicInfo: 'Au sommet, on trouve un mémorial, un zoo et un téléphérique. La vue sur la rade de Toulon et la Méditerranée est spectaculaire.',
    facilities: [
      {
        type: 'water',
        location: 'Sommet',
        description: 'Point d\'eau près du mémorial'
      },
      {
        type: 'food',
        location: 'Sommet',
        description: 'Restaurant panoramique'
      }
    ],
    bestTimeToVisit: 'Toute l\'année, mais éviter l\'été en raison de la chaleur',
    weatherInfo: 'Climat méditerranéen, très chaud en été. Montée exposée au soleil.',
    strava: {
      segmentId: '650173',
      komTime: '14:28',
      komName: 'Thibaut Pinot'
    }
  },
  {
    id: 'mont-saleve',
    name: 'Mont Salève',
    region: 'jura',
    country: 'France',
    altitude: 1379,
    length: 11.2,
    avgGradient: 8.6,
    maxGradient: 13,
    difficulty: 'medium',
    elevationGain: 963,
    startLocation: 'Collonges-sous-Salève',
    endLocation: 'Mont Salève',
    description: 'Surnommé le "Balcon de Genève", le Mont Salève offre une vue exceptionnelle sur le lac Léman, la ville de Genève et la chaîne du Mont-Blanc. Cette ascension exigeante est très populaire auprès des cyclistes locaux.',
    history: 'Bien que rarement inclus dans les grandes compétitions, le Mont Salève est un terrain d\'entraînement privilégié pour de nombreux professionnels basés dans la région genevoise.',
    imageUrl: '/images/cols/mont-saleve/main.jpg',
    profileUrl: '/images/cols/mont-saleve/profile.jpg',
    routes: [
      {
        name: 'Versant Nord (Collonges)',
        startLocation: 'Collonges-sous-Salève',
        length: 11.2,
        elevationGain: 963,
        avgGradient: 8.6,
        maxGradient: 13,
        difficulty: 'medium',
        description: 'L\'ascension principale, raide et technique'
      },
      {
        name: 'Versant Sud (Cruseilles)',
        startLocation: 'Cruseilles',
        length: 13.5,
        elevationGain: 753,
        avgGradient: 5.6,
        maxGradient: 9,
        difficulty: 'medium',
        description: 'Version moins raide mais plus longue'
      }
    ],
    popularSegments: [
      {
        name: 'Étraz - L\'Observatoire',
        length: 6.8,
        gradient: 9.4,
        description: 'Section centrale comportant les passages les plus raides'
      }
    ],
    touristicInfo: 'Au sommet, on trouve un téléphérique, des restaurants et une zone de décollage pour parapentes. C\'est un site de loisirs très fréquenté par les habitants de Genève.',
    facilities: [
      {
        type: 'water',
        location: 'L\'Observatoire',
        description: 'Fontaine près de la terrasse panoramique'
      },
      {
        type: 'food',
        location: 'Sommet',
        description: 'Plusieurs restaurants avec vue'
      }
    ],
    bestTimeToVisit: 'Avril à octobre',
    weatherInfo: 'Accessible presque toute l\'année, mais peut être glissant en hiver.',
    strava: {
      segmentId: '651275',
      komTime: '31:40',
      komName: 'David Gaudu'
    }
  },
  {
    id: 'mont-dor',
    name: 'Mont d\'Or',
    region: 'jura',
    country: 'France',
    altitude: 1461,
    length: 11.8,
    avgGradient: 6.8,
    maxGradient: 9.5,
    difficulty: 'medium',
    elevationGain: 802,
    startLocation: 'Métabief',
    endLocation: 'Mont d\'Or',
    description: 'Le Mont d\'Or est l\'un des sommets emblématiques du Haut-Jura, offrant une ascension variée avec des passages en forêt et des sections en alpage. Son sommet, marqué par une tour d\'observation, offre un panorama à 360° sur la chaîne du Jura, les Alpes et le lac Léman par temps clair.',
    history: 'Bien qu\'il ne soit pas aussi mythique que la montée vers la station de Métabief dans le Tour de France, le Mont d\'Or est néanmoins une ascension appréciée des cyclistes locaux et figure régulièrement dans des cyclosportives régionales comme la Forestière ou le Tour du Doubs.',
    imageUrl: '/images/cols/mont-dor/main.jpg',
    profileUrl: '/images/cols/mont-dor/profile.jpg',
    routes: [
      {
        name: 'Versant Est (Métabief)',
        startLocation: 'Métabief',
        length: 11.8,
        elevationGain: 802,
        avgGradient: 6.8,
        maxGradient: 9.5,
        difficulty: 'medium',
        description: 'L\'ascension classique avec passages techniques dans la forêt'
      },
      {
        name: 'Versant Nord (Rochejean)',
        startLocation: 'Rochejean',
        length: 9.5,
        elevationGain: 780,
        avgGradient: 8.2,
        maxGradient: 11,
        difficulty: 'hard',
        description: 'Version plus courte mais significativement plus pentue'
      },
      {
        name: 'Versant Ouest (Mouthe)',
        startLocation: 'Mouthe',
        length: 14.2,
        elevationGain: 840,
        avgGradient: 5.9,
        maxGradient: 8.5,
        difficulty: 'medium',
        description: 'La plus longue ascension, mais avec des pentes plus régulières'
      }
    ],
    popularSegments: [
      {
        name: 'Station de Métabief - Sommet',
        length: 5.2,
        gradient: 7.4,
        description: 'Section finale avec les plus beaux points de vue'
      },
      {
        name: 'La Montée des Alpages',
        length: 3.8,
        gradient: 8.1,
        description: 'Section médiane avec passages en alpage à découvert'
      }
    ],
    touristicInfo: 'La région du Mont d\'Or est célèbre pour son fromage éponyme, affiné dans des caves naturelles. L\'architecture comtoise traditionnelle est visible dans les villages environnants. En hiver, la station de ski de Métabief attire de nombreux visiteurs.',
    facilities: [
      {
        type: 'water',
        location: 'Métabief et chalets d\'alpage',
        description: 'Fontaines dans le village et auprès de plusieurs chalets'
      },
      {
        type: 'food',
        location: 'Métabief et fermes d\'altitude',
        description: 'Restaurants à Métabief et fermes proposant des produits locaux en été'
      }
    ],
    bestTimeToVisit: 'Mai à octobre',
    weatherInfo: 'Le sommet peut être très venteux. La neige est généralement présente de novembre à avril. Les matinées d\'été offrent souvent les conditions les plus clémentes avant les orages d\'après-midi.',
    strava: {
      segmentId: '754321',
      komTime: '36:15',
      komName: 'Thibaut Pinot'
    }
  }
];

export default colsJura;
