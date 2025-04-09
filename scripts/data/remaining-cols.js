/**
 * Liste des cols cyclistes restants à ajouter à la base de données
 */

// Format standardisé pour tous les cols
const remainingCols = [
  // Alpes
  {
    name: "Col de la Loze",
    region: "Savoie",
    country: "France",
    elevation: 2304,
    length: 21.5,
    avgGradient: 7.8,
    maxGradient: 24,
    difficulty: "extreme",
    coordinates: [45.4167, 6.5833],
    description: "Le col de la Loze est l'un des cols les plus difficiles des Alpes françaises. Ajouté récemment au Tour de France, il est devenu emblématique par ses pourcentages vertigineux et ses changements de pente brutaux. La fin de l'ascension est particulièrement redoutable avec des pentes à près de 24%.",
    climbs: [{
      side: "nord",
      startCoordinates: [45.38, 6.55],
      endCoordinates: [45.4167, 6.5833],
      length: 21.5,
      avgGradient: 7.8,
      maxGradient: 24
    }],
    tags: ["tour-de-france", "extrême", "alpes"]
  },
  {
    name: "Mont Ventoux",
    region: "Vaucluse",
    country: "France",
    elevation: 1909,
    length: 21.5,
    avgGradient: 7.5,
    maxGradient: 12,
    difficulty: "hard",
    coordinates: [44.1739, 5.2789],
    description: "Le Mont Ventoux, surnommé le Géant de Provence, est l'un des cols mythiques du Tour de France. Son sommet dénudé et balayé par les vents, reconnaissable à sa tour météo, offre un paysage lunaire unique. L'ascension depuis Bédoin est considérée comme la plus difficile.",
    climbs: [{
      side: "bédoin",
      startCoordinates: [44.12, 5.18],
      endCoordinates: [44.1739, 5.2789],
      length: 21.5,
      avgGradient: 7.5,
      maxGradient: 12
    }],
    tags: ["tour-de-france", "mythique", "provence"]
  },
  {
    name: "Col du Granon",
    region: "Hautes-Alpes",
    country: "France",
    elevation: 2413,
    length: 11.5,
    avgGradient: 9.2,
    maxGradient: 12.5,
    difficulty: "extreme",
    coordinates: [44.9797, 6.5994],
    description: "Le Col du Granon offre l'une des montées les plus difficiles des Alpes françaises. Cette route sans répit avec une pente moyenne supérieure à 9% mène à un sommet militaire. C'est ici que Jonas Vingegaard a pris le maillot jaune à Tadej Pogačar lors du Tour de France 2022.",
    climbs: [{
      side: "unique",
      startCoordinates: [44.9, 6.55],
      endCoordinates: [44.9797, 6.5994],
      length: 11.5,
      avgGradient: 9.2,
      maxGradient: 12.5
    }],
    tags: ["tour-de-france", "difficile", "alpes"]
  },
  {
    name: "Alpe d'Huez",
    region: "Isère",
    country: "France",
    elevation: 1860,
    length: 13.8,
    avgGradient: 8.1,
    maxGradient: 13,
    difficulty: "hard",
    coordinates: [45.0920, 6.0701],
    description: "L'Alpe d'Huez est probablement le col le plus célèbre de France avec ses 21 virages numérotés à l'envers. C'est une montée mythique du Tour de France depuis 1976, où chaque virage porte le nom d'un vainqueur d'étape. Les premiers kilomètres sont particulièrement difficiles.",
    climbs: [{
      side: "unique",
      startCoordinates: [45.05, 6.04],
      endCoordinates: [45.0920, 6.0701],
      length: 13.8,
      avgGradient: 8.1,
      maxGradient: 13
    }],
    tags: ["tour-de-france", "21-virages", "alpes", "mythique"]
  },
  {
    name: "Col du Galibier",
    region: "Hautes-Alpes",
    country: "France",
    elevation: 2642,
    length: 18,
    avgGradient: 6.9,
    maxGradient: 10.1,
    difficulty: "hard",
    coordinates: [45.0642, 6.4091],
    description: "Le Col du Galibier est l'un des plus hauts cols routiers des Alpes françaises. Situé sur la route des Grandes Alpes, il relie Saint-Michel-de-Maurienne et Briançon. Son ascension est magnifique avec des vues panoramiques et change radicalement d'ambiance après le tunnel du Col du Lautaret.",
    climbs: [{
      side: "nord",
      startCoordinates: [45.2, 6.3],
      endCoordinates: [45.0642, 6.4091],
      length: 18,
      avgGradient: 6.9,
      maxGradient: 10.1
    }],
    tags: ["tour-de-france", "haute-altitude", "alpes"]
  },
  {
    name: "Col d'Izoard",
    region: "Hautes-Alpes",
    country: "France",
    elevation: 2360,
    length: 14.1,
    avgGradient: 7.3,
    maxGradient: 10,
    difficulty: "hard",
    coordinates: [44.8206, 6.7323],
    description: "Le Col d'Izoard est célèbre pour son paysage lunaire appelé la Casse Déserte sur son versant sud. C'est un col historique du Tour de France où les plus grands champions comme Fausto Coppi et Louison Bobet ont brillé. L'ascension depuis Briançon offre les plus beaux paysages.",
    climbs: [{
      side: "briançon",
      startCoordinates: [44.9, 6.65],
      endCoordinates: [44.8206, 6.7323],
      length: 14.1,
      avgGradient: 7.3,
      maxGradient: 10
    }],
    tags: ["tour-de-france", "casse-déserte", "alpes"]
  },
  {
    name: "Col de la Madeleine",
    region: "Savoie",
    country: "France",
    elevation: 2000,
    length: 19.2,
    avgGradient: 8,
    maxGradient: 10.5,
    difficulty: "hard",
    coordinates: [45.4355, 6.3967],
    description: "Le Col de la Madeleine est l'une des ascensions les plus longues et difficiles des Alpes. Avec près de 20 km de montée depuis La Chambre, c'est un véritable test d'endurance. Le sommet offre une vue spectaculaire sur le Mont Blanc et les vallées environnantes.",
    climbs: [{
      side: "est",
      startCoordinates: [45.4, 6.28],
      endCoordinates: [45.4355, 6.3967],
      length: 19.2,
      avgGradient: 8,
      maxGradient: 10.5
    }],
    tags: ["tour-de-france", "endurance", "alpes"]
  },
  {
    name: "Col du Tourmalet",
    region: "Hautes-Pyrénées",
    country: "France",
    elevation: 2115,
    length: 19,
    avgGradient: 7.4,
    maxGradient: 10.5,
    difficulty: "hard",
    coordinates: [42.9103, 0.1425],
    description: "Le Col du Tourmalet est le col le plus emprunté par le Tour de France et l'un des plus emblématiques des Pyrénées. Son ascension est longue et exigeante, particulièrement depuis Sainte-Marie-de-Campan. Au sommet se trouve la statue du Géant du Tourmalet, hommage aux cyclistes.",
    climbs: [{
      side: "est",
      startCoordinates: [42.98, 0.22],
      endCoordinates: [42.9103, 0.1425],
      length: 19,
      avgGradient: 7.4,
      maxGradient: 10.5
    }],
    tags: ["tour-de-france", "mythique", "pyrénées"]
  },
  {
    name: "Puy Mary",
    region: "Cantal",
    country: "France",
    elevation: 1589,
    length: 13.7,
    avgGradient: 7.1,
    maxGradient: 12,
    difficulty: "hard",
    coordinates: [45.1114, 2.6811],
    description: "Le Puy Mary est un ancien volcan qui offre une ascension spectaculaire dans le Massif central. Plusieurs versants permettent d'y accéder, mais celui du Pas de Peyrol est le plus difficile. Le sommet offre une vue panoramique à 360° sur les monts du Cantal.",
    climbs: [{
      side: "pas-de-peyrol",
      startCoordinates: [45.15, 2.62],
      endCoordinates: [45.1114, 2.6811],
      length: 13.7,
      avgGradient: 7.1,
      maxGradient: 12
    }],
    tags: ["tour-de-france", "massif-central", "volcan"]
  },
  {
    name: "Col de Peyresourde",
    region: "Hautes-Pyrénées",
    country: "France",
    elevation: 1569,
    length: 14.9,
    avgGradient: 6.1,
    maxGradient: 8.5,
    difficulty: "medium",
    coordinates: [42.7958, 0.4458],
    description: "Le Col de Peyresourde relie les vallées de Larboust et Louron dans les Pyrénées. Son ascension est régulière et sans grandes difficultés, ce qui en fait un col apprécié des cyclistes amateurs. Au sommet, la crêperie est une halte incontournable pour les cyclistes.",
    climbs: [{
      side: "ouest",
      startCoordinates: [42.83, 0.38],
      endCoordinates: [42.7958, 0.4458],
      length: 14.9,
      avgGradient: 6.1,
      maxGradient: 8.5
    }],
    tags: ["tour-de-france", "régulier", "pyrénées"]
  },
  // Ajoutez les cols suivants ici
  {
    name: "Col d'Aubisque",
    region: "Pyrénées-Atlantiques",
    country: "France",
    elevation: 1709,
    length: 16.6,
    avgGradient: 7.2,
    maxGradient: 10,
    difficulty: "hard",
    coordinates: [42.9767, -0.3364],
    description: "Le Col d'Aubisque est l'un des cols historiques des Pyrénées, souvent associé au Col du Soulor qu'on franchit avant. La route à flanc de montagne offre des vues vertigineuses, notamment au niveau du célèbre Cirque du Litor. Des moutons et chevaux sauvages peuplent souvent les prairies environnantes.",
    climbs: [{
      side: "laruns",
      startCoordinates: [43.1, -0.42],
      endCoordinates: [42.9767, -0.3364],
      length: 16.6,
      avgGradient: 7.2,
      maxGradient: 10
    }],
    tags: ["tour-de-france", "mythique", "pyrénées"]
  },
  {
    name: "Mont Aigoual",
    region: "Gard",
    country: "France",
    elevation: 1567,
    length: 14.9,
    avgGradient: 4.9,
    maxGradient: 8.7,
    difficulty: "medium",
    coordinates: [44.1211, 3.5781],
    description: "Le Mont Aigoual est le point culminant du Gard et abrite un observatoire météorologique. Son ascension depuis Valleraugue est la plus difficile avec une distance de près de 30km, mais on peut aussi l'aborder par d'autres versants plus courts. Le sommet offre un panorama exceptionnel sur les Cévennes.",
    climbs: [{
      side: "valleraugue",
      startCoordinates: [44.08, 3.66],
      endCoordinates: [44.1211, 3.5781],
      length: 14.9,
      avgGradient: 4.9,
      maxGradient: 8.7
    }],
    tags: ["tour-de-france", "cévennes", "observatoire"]
  },
  {
    name: "Col d'Aspin",
    region: "Hautes-Pyrénées",
    country: "France",
    elevation: 1490,
    length: 12,
    avgGradient: 6.5,
    maxGradient: 8,
    difficulty: "medium",
    coordinates: [42.9372, 0.3258],
    description: "Le Col d'Aspin est souvent franchi lors du Tour de France, généralement avant ou après le Tourmalet. C'est une ascension relativement douce pour les Pyrénées, avec une montée régulière dans un cadre forestier magnifique qui s'ouvre sur les pâturages au sommet.",
    climbs: [{
      side: "est",
      startCoordinates: [42.99, 0.38],
      endCoordinates: [42.9372, 0.3258],
      length: 12,
      avgGradient: 6.5,
      maxGradient: 8
    }],
    tags: ["tour-de-france", "forêt", "pyrénées"]
  },
  {
    name: "Col de la Croix de Fer",
    region: "Savoie",
    country: "France",
    elevation: 2067,
    length: 22.7,
    avgGradient: 5.1,
    maxGradient: 11,
    difficulty: "hard",
    coordinates: [45.2275, 6.1833],
    description: "Le Col de la Croix de Fer doit son nom à la croix en fer forgé située à son sommet. L'ascension depuis Saint-Jean-de-Maurienne est longue mais variée, avec quelques portions à plat ou en descente. Le paysage est somptueux, dominé par les lacs et les sommets environnants.",
    climbs: [{
      side: "ouest",
      startCoordinates: [45.3, 6.02],
      endCoordinates: [45.2275, 6.1833],
      length: 22.7,
      avgGradient: 5.1,
      maxGradient: 11
    }],
    tags: ["tour-de-france", "lacs", "alpes"]
  },
  {
    name: "Col du Grand Colombier",
    region: "Ain",
    country: "France",
    elevation: 1501,
    length: 18.3,
    avgGradient: 7.1,
    maxGradient: 14,
    difficulty: "hard",
    coordinates: [45.8678, 5.6143],
    description: "Le Grand Colombier est le point culminant du Jura méridional. Son ascension depuis Culoz est particulièrement difficile avec des passages à 14%. Depuis son introduction au Tour de France, ce col a gagné en popularité, offrant des vues spectaculaires sur le lac du Bourget et les Alpes.",
    climbs: [{
      side: "culoz",
      startCoordinates: [45.78, 5.78],
      endCoordinates: [45.8678, 5.6143],
      length: 18.3,
      avgGradient: 7.1,
      maxGradient: 14
    }],
    tags: ["tour-de-france", "jura", "difficile"]
  }
  // La liste peut continuer avec d'autres cols emblématiques...
];

module.exports = remainingCols;
