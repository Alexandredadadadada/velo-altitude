# Catalogue des Cols

## Vue d'Ensemble
- **Objectif** : Documentation de la structure et du contenu du catalogue de cols
- **Contexte** : Base de données centrale des cols disponibles pour l'application
- **Portée** : Plus de 50 cols à travers l'Europe avec informations détaillées

## Contenu Principal
- **Structure du Catalogue**
  - Organisation par région géographique
  - Classification par difficulté
  - Catégorisation par caractéristiques
  - Données techniques et culturelles

- **Couverture Géographique**
  - Alpes françaises, italiennes et suisses
  - Pyrénées françaises et espagnoles
  - Massif central
  - Vosges et Jura
  - Carpates
  - Montagnes scandinaves
  - Sierra Nevada

- **Informations par Col**
  - Données techniques (altitude, longueur, pente)
  - Historique et culture
  - Météo et saisonnalité
  - Points d'intérêt
  - Témoignages et conseils

- **Intégration avec Autres Modules**
  - Visualisation 3D
  - Défis "7 Majeurs"
  - Plans d'entraînement spécifiques
  - Recommandations nutritionnelles

## Structure de Données
```typescript
// Type définition pour un col
interface Col {
  id: string;
  name: string;
  alternateNames?: string[];
  
  // Localisation
  region: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  
  // Caractéristiques techniques
  elevation: number;        // mètres
  length: {
    north?: number;         // km
    south?: number;         // km
    east?: number;          // km
    west?: number;          // km
    recommended: string;    // direction recommandée
  };
  gradient: {
    north?: {
      avg: number;          // %
      max: number;          // %
    };
    south?: {
      avg: number;          // %
      max: number;          // %
    };
    east?: {
      avg: number;          // %
      max: number;          // %
    };
    west?: {
      avg: number;          // %
      max: number;          // %
    };
  };
  
  // Difficulté et classification
  difficulty: 'easy' | 'moderate' | 'difficult' | 'very_difficult' | 'extreme';
  category: 'HC' | '1' | '2' | '3' | '4';  // Classification type Tour de France
  
  // Informations complémentaires
  history: {
    tourDeFrance?: {
      appearances: number;
      firstAppearance: number;
      famousStages: Array<{
        year: number;
        description: string;
        winner?: string;
      }>;
    };
    giro?: {/* Structure similaire */};
    vuelta?: {/* Structure similaire */};
    description: string;
  };
  
  // Informations pratiques
  practical: {
    bestSeason: string[];
    roadCondition: string;
    trafficLevel: 'low' | 'medium' | 'high';
    openingDates?: {  // Pour cols avec fermeture saisonnière
      open: string;   // MM-DD format
      close: string;  // MM-DD format
    };
    facilities: string[];
  };
  
  // Points d'intérêt
  pointsOfInterest: Array<{
    id: string;
    name: string;
    type: 'restaurant' | 'viewpoint' | 'monument' | 'fountain' | 'other';
    description: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    images?: string[];
  }>;
  
  // Ressources visuelles
  media: {
    images: string[];
    videos?: string[];
    panoramas?: string[];
    has3DModel: boolean;
  };
  
  // Témoignages
  testimonials: Array<{
    userId: string;
    username: string;
    date: string;
    text: string;
    rating: number;
    images?: string[];
  }>;
  
  // Données météo historiques
  weatherData: {
    monthly: Array<{
      month: number;
      avgTemp: number;
      precipDays: number;
      snowDays?: number;
      windAvg: number;
    }>;
  };
  
  // Métadonnées
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: number;
    completeness: number;  // 0-100%, complétude des informations
  };
}
```

## Exemple de Col
```javascript
// Exemple du Col du Galibier
const galibier = {
  id: "col_galibier",
  name: "Col du Galibier",
  alternateNames: ["Galibier Pass"],
  
  region: "Alpes",
  country: "France",
  coordinates: {
    lat: 45.064529,
    lng: 6.407713
  },
  
  elevation: 2642,
  length: {
    north: 18.1,  // Depuis le Col du Télégraphe
    south: 23.0,  // Depuis Le Monêtier-les-Bains
    recommended: "north"
  },
  gradient: {
    north: {
      avg: 5.5,
      max: 12.0
    },
    south: {
      avg: 6.9,
      max: 12.1
    }
  },
  
  difficulty: "difficult",
  category: "HC",
  
  history: {
    tourDeFrance: {
      appearances: 60,
      firstAppearance: 1911,
      famousStages: [
        {
          year: 1998,
          description: "Marco Pantani accélère et distance Jan Ullrich",
          winner: "Marco Pantani"
        },
        {
          year: 2011,
          description: "Centenaire du Galibier, arrivée d'étape exceptionnelle au sommet",
          winner: "Andy Schleck"
        }
      ]
    },
    description: "Le Col du Galibier est l'un des géants des Alpes, souvent décrit comme l'un des plus beaux cols de France. Il a été inclus pour la première fois dans le Tour en 1911..."
  },
  
  practical: {
    bestSeason: ["juin", "juillet", "août", "septembre"],
    roadCondition: "Excellente, entièrement asphaltée",
    trafficLevel: "medium",
    openingDates: {
      open: "05-15",  // 15 mai environ
      close: "10-30"  // 30 octobre environ
    },
    facilities: ["Parking", "Toilettes", "Monument", "Point d'eau"]
  },
  
  pointsOfInterest: [
    {
      id: "poi_galibier_monument",
      name: "Monument Henri Desgrange",
      type: "monument",
      description: "Monument dédié au créateur du Tour de France, situé près du sommet",
      coordinates: {
        lat: 45.064112,
        lng: 6.407001
      },
      images: ["pois/galibier/monument_desgrange.jpg"]
    },
    {
      id: "poi_galibier_view_ecrins",
      name: "Vue sur les Écrins",
      type: "viewpoint",
      description: "Panorama exceptionnel sur le massif des Écrins par temps clair",
      coordinates: {
        lat: 45.060532,
        lng: 6.403889
      },
      images: ["pois/galibier/view_ecrins.jpg", "pois/galibier/view_ecrins_2.jpg"]
    }
    // Autres POIs...
  ],
  
  media: {
    images: [
      "cols/galibier/main.jpg",
      "cols/galibier/north_approach.jpg",
      "cols/galibier/south_approach.jpg",
      "cols/galibier/summit.jpg"
    ],
    videos: ["https://www.youtube.com/watch?v=example"],
    panoramas: ["cols/galibier/panorama_360.jpg"],
    has3DModel: true
  },
  
  testimonials: [
    {
      userId: "user123",
      username: "AlpineRider",
      date: "2022-07-15",
      text: "Une ascension magnifique, particulièrement difficile dans les derniers kilomètres. Prévoir des vêtements chauds pour la descente, même en été.",
      rating: 5,
      images: ["user_content/galibier/user123_1.jpg"]
    }
    // Autres témoignages...
  ],
  
  weatherData: {
    monthly: [
      {
        month: 6,  // Juin
        avgTemp: 12.5,
        precipDays: 8,
        windAvg: 15
      },
      {
        month: 7,  // Juillet
        avgTemp: 15.2,
        precipDays: 7,
        windAvg: 12
      }
      // Autres mois...
    ]
  },
  
  metadata: {
    createdAt: "2022-01-15T10:30:00Z",
    updatedAt: "2023-03-22T14:45:12Z",
    version: 8,
    completeness: 95
  }
};
```

## Métriques et KPIs
- **Objectifs**
  - Couverture cols européens majeurs > 90%
  - Complétude moyenne des informations > 85%
  - Fraîcheur des données (mise à jour < 6 mois) > 95%
  - Satisfaction utilisateur > 4.5/5
  
- **Mesures actuelles**
  - Couverture cols européens majeurs: 78%
  - Complétude moyenne: 82%
  - Fraîcheur des données: 90%
  - Satisfaction: 4.3/5

## Processus de Maintenance
- **Mise à Jour des Données**
  - Vérification trimestrielle des informations
  - Ajout des nouveaux cols validés
  - Mise à jour des conditions routières
  - Enrichissement des ressources visuelles

- **Sources de Données**
  - Partenariats avec offices de tourisme
  - Retours utilisateurs validés
  - Sources officielles (routes, météo)
  - Expérience terrain de l'équipe

## Intégration avec l'API
- **Endpoints**
  - `/api/cols` - Liste des cols avec filtres
  - `/api/cols/:id` - Détails d'un col spécifique
  - `/api/cols/search` - Recherche avancée
  - `/api/cols/nearby` - Cols à proximité

- **Performances**
  - Cache des données fréquemment accédées
  - Pagination pour requêtes volumineuses
  - Compression des réponses
  - Cache côté client

## Références
- [Base de données des cols alpins](https://www.climbbybike.com/)
- [Fédération française de cyclisme - Documentation des cols](https://www.ffc.fr/)
- [OpenStreetMap - Données géographiques](https://www.openstreetmap.org/)
- [Météo-France - Données climatiques](https://www.meteofrance.com/)
- [Le Cycle - Guide des cols](https://www.lecycle.fr/)
