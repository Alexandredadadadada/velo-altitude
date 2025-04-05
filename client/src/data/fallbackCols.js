// Données de fallback pour les cols à utiliser lorsque la base de données n'est pas disponible
// Ce fichier sert de sauvegarde pour garantir que l'interface reste fonctionnelle même en cas de problème de connexion

const fallbackCols = [
  {
    _id: "col001",
    name: "Col du Tourmalet",
    region: "Pyrénées",
    country: "France",
    altitude: 2115,
    length: 19.0,
    avgGradient: 7.4,
    maxGradient: 10.2,
    difficulty: 5,
    popularity: 100,
    description: "Le géant des Pyrénées, incontournable du Tour de France.",
    imageUrl: "/images/cols/tourmalet.jpg",
    coordinates: {
      lat: 42.8725,
      lng: 0.1786
    }
  },
  {
    _id: "col002",
    name: "Col du Galibier",
    region: "Alpes",
    country: "France",
    altitude: 2642,
    length: 23.0,
    avgGradient: 5.1,
    maxGradient: 10.5,
    difficulty: 5,
    popularity: 95,
    description: "L'un des plus hauts cols des Alpes françaises, souvent au programme du Tour de France.",
    imageUrl: "/images/cols/galibier.jpg",
    coordinates: {
      lat: 45.0546,
      lng: 6.4102
    }
  },
  {
    _id: "col003",
    name: "Alpe d'Huez",
    region: "Alpes",
    country: "France",
    altitude: 1860,
    length: 13.8,
    avgGradient: 8.1,
    maxGradient: 13.0,
    difficulty: 4,
    popularity: 90,
    description: "Célèbre pour ses 21 virages numérotés et son ambiance légendaire pendant le Tour.",
    imageUrl: "/images/cols/alpe-dhuez.jpg",
    coordinates: {
      lat: 45.0946,
      lng: 6.0706
    }
  },
  {
    _id: "col004",
    name: "Mont Ventoux",
    region: "Provence",
    country: "France",
    altitude: 1909,
    length: 21.5,
    avgGradient: 7.5,
    maxGradient: 12.0,
    difficulty: 5,
    popularity: 88,
    description: "Le 'Géant de Provence' au sommet lunaire balayé par les vents.",
    imageUrl: "/images/cols/ventoux.jpg",
    coordinates: {
      lat: 44.1731,
      lng: 5.2783
    }
  },
  {
    _id: "col005",
    name: "Passo dello Stelvio",
    region: "Alpes italiennes",
    country: "Italie",
    altitude: 2758,
    length: 24.3,
    avgGradient: 7.4,
    maxGradient: 14.0,
    difficulty: 5,
    popularity: 85,
    description: "Un monument du cyclisme avec ses 48 virages en épingle spectaculaires.",
    imageUrl: "/images/cols/stelvio.jpg",
    coordinates: {
      lat: 46.5283,
      lng: 10.4544
    }
  },
  {
    _id: "col006",
    name: "Col d'Aubisque",
    region: "Pyrénées",
    country: "France",
    altitude: 1709,
    length: 16.6,
    avgGradient: 7.2,
    maxGradient: 13.0,
    difficulty: 4,
    popularity: 82,
    description: "Offre des vues spectaculaires sur les montagnes environnantes.",
    imageUrl: "/images/cols/aubisque.jpg",
    coordinates: {
      lat: 42.9823,
      lng: -0.3362
    }
  },
  {
    _id: "col007",
    name: "Passo di Gavia",
    region: "Alpes italiennes",
    country: "Italie",
    altitude: 2621,
    length: 17.3,
    avgGradient: 7.9,
    maxGradient: 16.0,
    difficulty: 5,
    popularity: 80,
    description: "Col alpin sauvage et exigeant du Giro d'Italia.",
    imageUrl: "/images/cols/gavia.jpg",
    coordinates: {
      lat: 46.3419,
      lng: 10.4931
    }
  }
];

module.exports = fallbackCols;
