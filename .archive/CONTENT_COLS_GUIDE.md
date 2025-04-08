# Guide de Développement du Contenu des Cols - Velo-Altitude

**Date :** 5 avril 2025  
**Version :** 1.0

## Introduction

Ce document détaille le format et les exigences pour l'ajout de nouveaux cols à la base de données Velo-Altitude. La qualité et l'exhaustivité des données des cols sont essentielles pour la visualisation 3D et les fonctionnalités de planification d'itinéraires.

## Structure des données

Chaque col doit être défini dans un fichier JSON distinct suivant ce format :

```json
{
  "id": "col-du-tourmalet",
  "name": "Col du Tourmalet",
  "region": "Pyrénées",
  "country": "France",
  "elevation": {
    "summit": 2115,
    "base": 850
  },
  "length": {
    "eastSide": 19.0,
    "westSide": 17.2
  },
  "gradient": {
    "eastSide": {
      "average": 7.4,
      "max": 10.2
    },
    "westSide": {
      "average": 7.6,
      "max": 12.0
    }
  },
  "difficulty": {
    "eastSide": 8,
    "westSide": 8.5
  },
  "coordinates": {
    "summit": {
      "lat": 42.9096,
      "lng": 0.1448
    },
    "start": {
      "eastSide": {
        "lat": 42.8726,
        "lng": 0.2502
      },
      "westSide": {
        "lat": 42.9320,
        "lng": 0.0540
      }
    }
  },
  "profile": {
    "eastSide": "tourmalet_east_profile.json",
    "westSide": "tourmalet_west_profile.json"
  },
  "weather": {
    "bestMonths": [6, 7, 8, 9],
    "snowClosed": [11, 12, 1, 2, 3, 4],
    "rainiest": [4, 5, 10]
  },
  "history": {
    "firstTdFYear": 1910,
    "totalTdFCrossings": 87,
    "famousVictories": [
      {
        "rider": "Octave Lapize",
        "year": 1910,
        "note": "Premier passage du Tour"
      },
      {
        "rider": "Eddy Merckx",
        "year": 1969,
        "note": "Victoire légendaire en solitaire"
      }
    ]
  },
  "amenities": {
    "parking": true,
    "restaurant": true,
    "waterFountain": true,
    "restrooms": true,
    "bikeRepair": false
  },
  "images": {
    "banner": "tourmalet_banner.webp",
    "gallery": [
      "tourmalet_1.webp",
      "tourmalet_2.webp",
      "tourmalet_3.webp"
    ],
    "panorama360": "tourmalet_360.webp"
  },
  "videos": {
    "flythrough": "tourmalet_flythrough.mp4",
    "highlights": "tourmalet_highlights.mp4"
  },
  "description": {
    "short": "Le géant des Pyrénées, célèbre pour ses passages mémorables du Tour de France.",
    "full": "Le Col du Tourmalet est le plus haut col routier des Pyrénées françaises et l'un des plus mythiques du Tour de France. Situé dans le département des Hautes-Pyrénées, il relie les vallées de Campan et de Barèges. Sa montée est exigeante des deux côtés, mais offre des panoramas exceptionnels."
  },
  "nearby": {
    "cols": ["hourquette-dancise", "col-daspin", "luz-ardiden"],
    "towns": ["luz-saint-sauveur", "sainte-marie-de-campan", "bareges"]
  },
  "mapLayers": {
    "heatmap": "tourmalet_heatmap.geojson",
    "gradientColors": "tourmalet_gradient.geojson"
  }
}
```

## Profils d'élévation

Les profils d'élévation doivent être fournis au format GeoJSON avec des points tous les 100 mètres. Exemple de structure (simplifié) :

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "distance": 0.0,
        "elevation": 850,
        "gradient": 0,
        "surface": "asphalt"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [0.2502, 42.8726]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "distance": 0.1,
        "elevation": 858,
        "gradient": 8.0,
        "surface": "asphalt"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [0.2490, 42.8730]
      }
    }
    // ... Points supplémentaires
  ]
}
```

## Médias requis

### Images
- **Banner**: 1920x600px, WebP
- **Gallery**: 1200x800px, WebP
- **Panorama360**: 6000x3000px (équirectangulaire), WebP

### Vidéos
- **Flythrough**: 1080p, MP4 H.264, max 1 minute
- **Highlights**: 1080p, MP4 H.264, max 2 minutes

## Cols prioritaires à ajouter

Cette liste énumère les cols qui devraient être ajoutés en priorité :

### Alpes
- Col du Galibier
- Col de la Madeleine
- Col de la Croix de Fer
- Col d'Izoard
- Col de la Bonette
- Alpe d'Huez
- Col du Glandon
- Col de Vars
- Col d'Ornon
- Col du Mont Cenis

### Pyrénées
- Col d'Aubisque
- Col de Peyresourde
- Col d'Aspin
- Col de Marie-Blanque
- Col du Soulor
- Col de Portet
- Col de Menté
- Port de Balès
- Hourquette d'Ancizan
- Col du Portillon

### Jura et Vosges
- Grand Ballon
- Ballon d'Alsace
- Col de la Schlucht
- Col du Grand Colombier
- Col de la Faucille
- Col de Joux Plane
- Col de Romme
- Col des Aravis
- Col de Joux Verte
- Col de la Colombière

### Massif Central
- Puy Mary
- Pas de Peyrol
- Mont Aigoual
- Col de Peyra Taillade
- Col de la Croix Morand
- Col de la Croix Saint-Robert
- Col du Pertus
- Col de Neronne
- Col de Font de Cère
- Col de Prat de Bouc

## Éléments à inclure pour chaque versant

1. **Profil détaillé** avec gradient pour chaque km
2. **Points d'intérêt** (virages célèbres, monuments, fontaines)
3. **Données météo moyennes** par mois
4. **Segments Strava populaires**
5. **Conseils de préparation** spécifiques au col

## Méthode de vérification des données

1. Vérifier l'exactitude par rapport aux sources officielles (IGN, cartes topographiques)
2. Comparer les données avec au moins deux tracés GPS enregistrés
3. Valider les informations historiques avec des sources fiables (livres, archives du Tour de France)
4. Vérifier les améliorations récentes des routes (resurfaçage, modifications de tracé)

## Conseils de présentation

- Mettre en évidence les sections difficiles avec des couleurs selon le gradient
- Inclure des points de référence visuels reconnaissables
- Ajouter des notes sur la qualité de la route
- Mentionner les passages techniques ou dangereux
- Inclure les meilleures vues panoramiques avec leurs coordonnées exactes
