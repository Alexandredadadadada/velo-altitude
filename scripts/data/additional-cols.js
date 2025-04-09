/**
 * Liste complémentaire de cols cyclistes pour atteindre l'objectif des 45+ cols
 */

const additionalCols = [
  {
    name: "Col de la Bonette",
    region: "Alpes-Maritimes",
    country: "France",
    elevation: 2802,
    length: 24.1,
    avgGradient: 6.6,
    maxGradient: 10,
    difficulty: "extreme",
    coordinates: [44.3208, 6.8069],
    description: "La Cime de la Bonette est souvent présentée comme la route la plus haute d'Europe à 2802m. Bien que techniquement ce soit une boucle autour du col de la Bonette (2715m), c'est une ascension spectaculaire qui traverse le Parc National du Mercantour et offre des paysages alpins grandioses.",
    climbs: [{
      side: "sud",
      startCoordinates: [44.2, 6.75],
      endCoordinates: [44.3208, 6.8069],
      length: 24.1,
      avgGradient: 6.6,
      maxGradient: 10
    }],
    tags: ["plus-haute-route", "mercantour", "alpes", "extreme"]
  },
  {
    name: "Col de Vars",
    region: "Hautes-Alpes",
    country: "France",
    elevation: 2109,
    length: 19,
    avgGradient: 5.7,
    maxGradient: 9,
    difficulty: "medium",
    coordinates: [44.5408, 6.7025],
    description: "Le Col de Vars est situé sur la Route des Grandes Alpes. Son ascension est relativement régulière depuis Guillestre, traversant de beaux paysages alpins avant d'arriver à un sommet panoramique. Il constitue souvent une étape avant ou après le Col d'Izoard.",
    climbs: [{
      side: "sud",
      startCoordinates: [44.45, 6.65],
      endCoordinates: [44.5408, 6.7025],
      length: 19,
      avgGradient: 5.7,
      maxGradient: 9
    }],
    tags: ["route-des-grandes-alpes", "régulier", "alpes"]
  },
  {
    name: "Col du Télégraphe",
    region: "Savoie",
    country: "France",
    elevation: 1566,
    length: 11.8,
    avgGradient: 7.1,
    maxGradient: 9.8,
    difficulty: "medium",
    coordinates: [45.1969, 6.4447],
    description: "Le Col du Télégraphe précède généralement l'ascension du Galibier depuis Saint-Michel-de-Maurienne. C'est une montée régulière et boisée qui mène au village de Valloire. Il est souvent négligé face au Galibier, mais représente déjà un défi conséquent.",
    climbs: [{
      side: "nord",
      startCoordinates: [45.26, 6.5],
      endCoordinates: [45.1969, 6.4447],
      length: 11.8,
      avgGradient: 7.1,
      maxGradient: 9.8
    }],
    tags: ["galibier", "forêt", "alpes"]
  },
  {
    name: "Col de Peyrepertuse",
    region: "Aude",
    country: "France",
    elevation: 737,
    length: 4.2,
    avgGradient: 7.9,
    maxGradient: 14,
    difficulty: "medium",
    coordinates: [42.8739, 2.5450],
    description: "Le Col de Peyrepertuse n'est pas le plus connu ni le plus haut, mais il offre une montée courte et intense menant au château cathare de Peyrepertuse. Les derniers virages avec vue sur la forteresse sont spectaculaires et les pourcentages sont sérieux.",
    climbs: [{
      side: "duilhac",
      startCoordinates: [42.85, 2.52],
      endCoordinates: [42.8739, 2.5450],
      length: 4.2,
      avgGradient: 7.9,
      maxGradient: 14
    }],
    tags: ["cathare", "court", "chateau", "pyrénées-orientales"]
  },
  {
    name: "Mont Faron",
    region: "Var",
    country: "France",
    elevation: 584,
    length: 6.5,
    avgGradient: 8.7,
    maxGradient: 11.4,
    difficulty: "hard",
    coordinates: [43.1247, 5.9372],
    description: "Le Mont Faron domine la ville de Toulon et offre une ascension courte mais intense. La route en lacets grimpe rapidement à travers la garrigue méditerranéenne. Au sommet, on découvre un panorama exceptionnel sur la rade de Toulon et la Méditerranée.",
    climbs: [{
      side: "toulon",
      startCoordinates: [43.12, 5.92],
      endCoordinates: [43.1247, 5.9372],
      length: 6.5,
      avgGradient: 8.7,
      maxGradient: 11.4
    }],
    tags: ["méditerranée", "vue", "court", "raide"]
  },
  {
    name: "Col de l'Iseran",
    region: "Savoie",
    country: "France",
    elevation: 2764,
    length: 47.8,
    avgGradient: 4.1,
    maxGradient: 8.4,
    difficulty: "hard",
    coordinates: [45.4167, 7.0333],
    description: "Le Col de l'Iseran est le plus haut col routier des Alpes françaises. L'ascension depuis Bourg-Saint-Maurice est particulièrement longue (près de 48km) mais avec une pente moyenne raisonnable. Les paysages de haute montagne y sont spectaculaires, surtout dans les derniers kilomètres au-dessus de Val d'Isère.",
    climbs: [{
      side: "nord",
      startCoordinates: [45.62, 6.77],
      endCoordinates: [45.4167, 7.0333],
      length: 47.8,
      avgGradient: 4.1,
      maxGradient: 8.4
    }],
    tags: ["plus-haut-col", "haute-altitude", "alpes", "longue-distance"]
  },
  {
    name: "Col du Soulor",
    region: "Hautes-Pyrénées",
    country: "France",
    elevation: 1474,
    length: 19.5,
    avgGradient: 5.2,
    maxGradient: 8,
    difficulty: "medium",
    coordinates: [42.9578, -0.2617],
    description: "Le Col du Soulor est souvent grimpé en route vers le Col d'Aubisque. Depuis Argelès-Gazost, c'est une montée progressive qui traverse des paysages pastoraux typiques des Pyrénées. Le sommet offre une vue magnifique sur les montagnes environnantes.",
    climbs: [{
      side: "est",
      startCoordinates: [43.0, -0.1],
      endCoordinates: [42.9578, -0.2617],
      length: 19.5,
      avgGradient: 5.2,
      maxGradient: 8
    }],
    tags: ["aubisque", "pastoral", "pyrénées"]
  },
  {
    name: "Col d'Allos",
    region: "Alpes-de-Haute-Provence",
    country: "France",
    elevation: 2250,
    length: 16.5,
    avgGradient: 6,
    maxGradient: 8.4,
    difficulty: "medium",
    coordinates: [44.3014, 6.5950],
    description: "Le Col d'Allos est un col alpin régulier qui relie les vallées de l'Ubaye et du Verdon. L'ascension depuis Barcelonnette traverse des forêts de mélèzes avant d'atteindre des alpages ouverts. C'est une montée plutôt régulière avec peu de passages très raides.",
    climbs: [{
      side: "nord",
      startCoordinates: [44.38, 6.65],
      endCoordinates: [44.3014, 6.5950],
      length: 16.5,
      avgGradient: 6,
      maxGradient: 8.4
    }],
    tags: ["régulier", "mercantour", "alpes"]
  },
  {
    name: "Col du Noyer",
    region: "Hautes-Alpes",
    country: "France",
    elevation: 1664,
    length: 7.5,
    avgGradient: 8.5,
    maxGradient: 13,
    difficulty: "hard",
    coordinates: [44.6714, 5.9575],
    description: "Le Col du Noyer est une ascension courte mais intense dans le massif du Dévoluy. Sa pente est constamment élevée avec quelques passages à plus de 10%. Les derniers kilomètres traversent des alpages avec une vue spectaculaire sur les falaises calcaires caractéristiques du Dévoluy.",
    climbs: [{
      side: "sud",
      startCoordinates: [44.61, 5.94],
      endCoordinates: [44.6714, 5.9575],
      length: 7.5,
      avgGradient: 8.5,
      maxGradient: 13
    }],
    tags: ["raide", "dévoluy", "alpes", "court"]
  },
  {
    name: "Col de la Machine",
    region: "Drôme",
    country: "France",
    elevation: 1011,
    length: 9.4,
    avgGradient: 5.5,
    maxGradient: 8.5,
    difficulty: "medium",
    coordinates: [44.9028, 5.2825],
    description: "Le Col de la Machine est situé dans le massif du Vercors. C'est une montée régulière qui traverse d'abord des gorges impressionnantes avant de grimper en forêt. Le sommet offre une vue magnifique sur le Vercors et les Alpes environnantes.",
    climbs: [{
      side: "est",
      startCoordinates: [44.93, 5.2],
      endCoordinates: [44.9028, 5.2825],
      length: 9.4,
      avgGradient: 5.5,
      maxGradient: 8.5
    }],
    tags: ["vercors", "forêt", "préalpes"]
  },
  {
    name: "Col de la République",
    region: "Loire",
    country: "France",
    elevation: 1161,
    length: 17.7,
    avgGradient: 4.7,
    maxGradient: 9,
    difficulty: "medium",
    coordinates: [45.3733, 4.5231],
    description: "Le Col de la République (ou Col du Grand Bois) est historiquement le premier col routier à plus de 1000m gravi par le Tour de France en 1903. L'ascension depuis Saint-Étienne est longue mais progressive, traversant de belles forêts du Pilat.",
    climbs: [{
      side: "saint-étienne",
      startCoordinates: [45.45, 4.4],
      endCoordinates: [45.3733, 4.5231],
      length: 17.7,
      avgGradient: 4.7,
      maxGradient: 9
    }],
    tags: ["historique", "pilat", "massif-central", "premier-col-tour"]
  },
  {
    name: "Col de la Colombière",
    region: "Haute-Savoie",
    country: "France",
    elevation: 1613,
    length: 16.3,
    avgGradient: 6.8,
    maxGradient: 10.2,
    difficulty: "hard",
    coordinates: [46.0183, 6.4628],
    description: "Le Col de la Colombière est une ascension classique des Alpes du Nord. Depuis Le Grand-Bornand, la montée est régulière jusqu'aux derniers kilomètres qui deviennent plus difficiles. Le paysage est typique des Alpes savoyardes avec ses chalets et alpages.",
    climbs: [{
      side: "grand-bornand",
      startCoordinates: [45.94, 6.43],
      endCoordinates: [46.0183, 6.4628],
      length: 16.3,
      avgGradient: 6.8,
      maxGradient: 10.2
    }],
    tags: ["tour-de-france", "alpes", "aravis"]
  },
  {
    name: "Col du Portillon",
    region: "Haute-Garonne",
    country: "France",
    elevation: 1293,
    length: 8.4,
    avgGradient: 7.9,
    maxGradient: 11,
    difficulty: "hard",
    coordinates: [42.7372, 0.5831],
    description: "Le Col du Portillon est un col frontalier entre la France et l'Espagne. L'ascension depuis Bagnères-de-Luchon est courte mais soutenue, avec des passages raides dans la forêt. Le col offre une belle vue sur le val d'Aran côté espagnol.",
    climbs: [{
      side: "luchon",
      startCoordinates: [42.79, 0.59],
      endCoordinates: [42.7372, 0.5831],
      length: 8.4,
      avgGradient: 7.9,
      maxGradient: 11
    }],
    tags: ["frontière", "espagne", "pyrénées", "forêt"]
  },
  {
    name: "Grand Ballon",
    region: "Haut-Rhin",
    country: "France",
    elevation: 1424,
    length: 19.8,
    avgGradient: 6.3,
    maxGradient: 9,
    difficulty: "hard",
    coordinates: [47.9019, 7.0958],
    description: "Le Grand Ballon est le point culminant des Vosges. L'ascension depuis Willer-sur-Thur est longue et régulière, traversant de magnifiques forêts vosgiennes. Le sommet offre une vue panoramique exceptionnelle sur la plaine d'Alsace, la Forêt Noire et même les Alpes par temps clair.",
    climbs: [{
      side: "willer-sur-thur",
      startCoordinates: [47.83, 7.03],
      endCoordinates: [47.9019, 7.0958],
      length: 19.8,
      avgGradient: 6.3,
      maxGradient: 9
    }],
    tags: ["vosges", "forêt", "panorama", "est-france"]
  },
  {
    name: "Col de Pierre-Saint-Martin",
    region: "Pyrénées-Atlantiques",
    country: "France",
    elevation: 1760,
    length: 14,
    avgGradient: 8.2,
    maxGradient: 13,
    difficulty: "hard",
    coordinates: [42.9761, -0.7594],
    description: "Le Col de Pierre-Saint-Martin est situé à la frontière espagnole. L'ascension depuis Arette est exigeante avec une pente constamment élevée. La route traverse d'abord des pâturages avant d'atteindre un paysage plus minéral et karstique typique de cette partie des Pyrénées.",
    climbs: [{
      side: "arette",
      startCoordinates: [43.07, -0.71],
      endCoordinates: [42.9761, -0.7594],
      length: 14,
      avgGradient: 8.2,
      maxGradient: 13
    }],
    tags: ["frontière", "pyrénées", "raide", "karst"]
  },
  {
    name: "Col du Chaussy",
    region: "Savoie",
    country: "France",
    elevation: 1533,
    length: 14.4,
    avgGradient: 6.3,
    maxGradient: 9.7,
    difficulty: "medium",
    coordinates: [45.3306, 6.3256],
    description: "Le Col du Chaussy est connu pour sa montée par les célèbres lacets de Montvernier, une série impressionnante de 17 virages en épingle parfaitement alignés. Après ces lacets spectaculaires, la route continue plus paisiblement à travers alpages et forêts.",
    climbs: [{
      side: "montvernier",
      startCoordinates: [45.37, 6.28],
      endCoordinates: [45.3306, 6.3256],
      length: 14.4,
      avgGradient: 6.3,
      maxGradient: 9.7
    }],
    tags: ["lacets", "montvernier", "alpes", "spectaculaire"]
  },
  {
    name: "Col des Tempêtes",
    region: "Vaucluse",
    country: "France",
    elevation: 1829,
    length: 21.5,
    avgGradient: 7.2,
    maxGradient: 11,
    difficulty: "hard",
    coordinates: [44.1739, 5.2789],
    description: "Le Col des Tempêtes est en fait le point culminant de la route du Mont Ventoux, juste avant l'observatoire. C'est là que le mistral souffle le plus fort, d'où son nom. Les conditions météorologiques y sont souvent extrêmes, passant du soleil brûlant au brouillard épais en quelques minutes.",
    climbs: [{
      side: "bédoin",
      startCoordinates: [44.12, 5.18],
      endCoordinates: [44.1739, 5.2789],
      length: 21.5,
      avgGradient: 7.2,
      maxGradient: 11
    }],
    tags: ["ventoux", "mistral", "vent", "provence"]
  },
  {
    name: "Col du Pré",
    region: "Savoie",
    country: "France",
    elevation: 1740,
    length: 12.6,
    avgGradient: 7.9,
    maxGradient: 12.5,
    difficulty: "hard",
    coordinates: [45.6927, 6.6072],
    description: "Le Col du Pré est une ascension méconnue mais spectaculaire du Beaufortain. Depuis Arêches, la pente est constamment soutenue avec des passages raides. Le sommet offre une vue magnifique sur le lac de Roselend et le Mont Blanc en arrière-plan.",
    climbs: [{
      side: "arêches",
      startCoordinates: [45.68, 6.56],
      endCoordinates: [45.6927, 6.6072],
      length: 12.6,
      avgGradient: 7.9,
      maxGradient: 12.5
    }],
    tags: ["beaufortain", "roselend", "alpes", "vue"]
  },
  {
    name: "Col du Marie-Blanque",
    region: "Pyrénées-Atlantiques",
    country: "France",
    elevation: 1035,
    length: 9.1,
    avgGradient: 7.7,
    maxGradient: 13,
    difficulty: "hard",
    coordinates: [43.0467, -0.5253],
    description: "Le Col de Marie-Blanque est une ascension courte mais féroce des Pyrénées. Le versant est depuis Escot est particulièrement difficile avec ses derniers kilomètres à plus de 11% de moyenne. C'est un col souvent sous-estimé qui peut faire de gros dégâts dans le peloton du Tour de France.",
    climbs: [{
      side: "est",
      startCoordinates: [43.07, -0.61],
      endCoordinates: [43.0467, -0.5253],
      length: 9.1,
      avgGradient: 7.7,
      maxGradient: 13
    }],
    tags: ["raide", "pyrénées", "tour-de-france", "difficile"]
  },
  {
    name: "Montée de Lure",
    region: "Alpes-de-Haute-Provence",
    country: "France",
    elevation: 1736,
    length: 17.8,
    avgGradient: 6.5,
    maxGradient: 9,
    difficulty: "hard",
    coordinates: [44.1156, 5.8356],
    description: "La Montée de Lure est souvent surnommée le 'petit Ventoux'. Depuis Saint-Étienne-les-Orgues, l'ascension est longue et régulière, traversant d'abord des forêts de chênes puis de pins et de cèdres. Le sommet offre un paysage lunaire similaire au Mont Ventoux, avec une vue spectaculaire sur les Alpes du Sud.",
    climbs: [{
      side: "saint-étienne-les-orgues",
      startCoordinates: [44.05, 5.78],
      endCoordinates: [44.1156, 5.8356],
      length: 17.8,
      avgGradient: 6.5,
      maxGradient: 9
    }],
    tags: ["ventoux", "provence", "alpes", "régulier"]
  },
  {
    name: "Col de Menté",
    region: "Haute-Garonne",
    country: "France",
    elevation: 1349,
    length: 9.7,
    avgGradient: 9.1,
    maxGradient: 13,
    difficulty: "hard",
    coordinates: [42.9292, 0.7417],
    description: "Le Col de Menté est tristement célèbre pour avoir été le théâtre de la chute de Luis Ocaña poursuivant Eddy Merckx sous la pluie lors du Tour de France 1971. Depuis Saint-Béat, c'est une montée très raide et technique, notamment dans sa première partie.",
    climbs: [{
      side: "saint-béat",
      startCoordinates: [42.92, 0.69],
      endCoordinates: [42.9292, 0.7417],
      length: 9.7,
      avgGradient: 9.1,
      maxGradient: 13
    }],
    tags: ["tour-de-france", "historique", "pyrénées", "raide"]
  },
  {
    name: "Montée de Chamrousse",
    region: "Isère",
    country: "France",
    elevation: 1730,
    length: 18.7,
    avgGradient: 7.5,
    maxGradient: 12,
    difficulty: "hard",
    coordinates: [45.1169, 5.8889],
    description: "La montée vers la station de Chamrousse est une ascension exigeante proche de Grenoble. C'est ici que Marco Pantani a réalisé l'une de ses plus belles performances en 1998. La route serpente à travers la forêt avant d'atteindre la station de ski avec vue sur l'agglomération grenobloise.",
    climbs: [{
      side: "uriage",
      startCoordinates: [45.15, 5.83],
      endCoordinates: [45.1169, 5.8889],
      length: 18.7,
      avgGradient: 7.5,
      maxGradient: 12
    }],
    tags: ["pantani", "belledonne", "alpes", "station-de-ski"]
  }
];

module.exports = additionalCols;
