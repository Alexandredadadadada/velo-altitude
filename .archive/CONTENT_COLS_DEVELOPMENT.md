# Guide de Développement du Contenu des Cols - Velo-Altitude

**Date :** 5 avril 2025  
**Version :** 1.0

## Introduction

Ce document détaille le format et les exigences pour l'ajout de nouveaux cols à la base de données Velo-Altitude. La structure suit le format JSON existant dans `server/data/european-cols-enriched-final.json`.

## Structure des données

Chaque col doit être défini en suivant ce modèle JSON :

```json
{
  "id": "nom-du-col-en-minuscules-sans-accents",
  "name": {
    "fr": "Nom du Col en français",
    "en": "Nom du Col en anglais",
    "de": "Nom du Col en allemand",
    "it": "Nom du Col en italien",
    "es": "Nom du Col en espagnol"
  },
  "altitude": 1234, // en mètres
  "location": {
    "latitude": 46.1234,
    "longitude": 6.1234,
    "region": "Nom de la région",
    "country": "Pays",
    "nearbyTowns": ["Ville 1", "Ville 2", "Ville 3"]
  },
  "climbData": {
    "mainSide": {
      "startLocation": "Nom de la ville de départ",
      "length": 12.3, // en kilomètres
      "elevation": 789, // dénivelé en mètres
      "averageGradient": 6.4, // en pourcentage
      "maxGradient": 10.2, // en pourcentage
      "difficulty": 8 // échelle de 1 à 10
    },
    "alternateSide": {
      // Mêmes champs que mainSide si le col a plusieurs versants
    }
  },
  "history": {
    "firstCompetitionYear": 1952,
    "vuealtaAppearances": 14,
    "tourDeFranceAppearances": 32,
    "famousStories": [
      "Histoire 1 en quelques phrases",
      "Histoire 2 en quelques phrases"
    ],
    "records": {
      "ascent": {
        "holder": "Nom du cycliste",
        "time": "12:34",
        "year": 2015,
        "side": "mainSide"
      },
      "modern": {
        "holder": "Nom du cycliste récent",
        "time": "12:12",
        "year": 2023,
        "side": "mainSide"
      }
    }
  },
  "pointsOfInterest": [
    {
      "name": "Nom du point d'intérêt",
      "description": "Description détaillée",
      "coordinates": [46.1234, 6.1234],
      "type": "landmark" // ou "monument", "viewpoint", etc.
    }
  ],
  "practicalInfo": {
    "bestTimeToVisit": "Mai à octobre",
    "roadCondition": "Description de l'état de la route",
    "trafficLevel": "Description du niveau de trafic",
    "winterClosure": "Informations sur les fermetures hivernales",
    "facilities": ["Service 1", "Service 2"],
    "parkingAvailable": true,
    "waterPoints": ["Description des points d'eau"]
  },
  "images": {
    "main": "/images/cols/nom-du-col/main.jpg",
    "gallery": [
      "/images/cols/nom-du-col/image1.jpg",
      "/images/cols/nom-du-col/image2.jpg"
    ]
  },
  "difficulty": 4, // échelle de 1 à 5
  "surfaceType": "Asphalte", // ou "Gravier", "Mixte", etc.
  "trainingTips": [
    "Conseil d'entraînement 1",
    "Conseil d'entraînement 2"
  ],
  "recommendedBikeTypes": ["Type de vélo recommandé"],
  "weatherInfo": {
    "bestSeason": "Été",
    "averageTemperature": {
      "summer": "15-25°C",
      "spring": "8-18°C",
      "autumn": "5-15°C"
    },
    "rainfallRisk": "Modéré",
    "windExposure": "Élevé",
    "weatherWarnings": [
      "Attention particulière à..."
    ]
  },
  "segments": [
    {
      "name": "Segment 1",
      "startKm": 0,
      "endKm": 3.5,
      "averageGradient": 5.2,
      "description": "Description du segment"
    }
  ],
  "userRatings": {
    "scenery": 4.5,
    "difficulty": 4.2,
    "experience": 4.7,
    "totalReviews": 123
  },
  "links": {
    "strava": "URL du segment Strava",
    "website": "URL du site officiel"
  }
}
```

## Recommandations pour l'enrichissement des données existantes

Au lieu d'ajouter de nouveaux cols, concentrez-vous sur l'enrichissement des données pour les 50 cols existants :

### Améliorations prioritaires

1. **Standardisation des champs** : Assurez-vous que tous les cols ont le même niveau de détail et la même structure.
   
2. **Traductions multilingues** : Compléter les noms et descriptions dans toutes les langues cibles (FR, EN, DE, IT, ES).

3. **Enrichissement médiatique** :
   - Ajouter des photos de haute qualité pour tous les cols (minimum 4 par col)
   - Créer des profils d'élévation standardisés au format SVG
   - Vérifier que tous les cols ont des fichiers GPX précis

4. **Données météorologiques** :
   - Ajouter les données saisonnières manquantes
   - Intégrer des recommandations spécifiques basées sur la météo historique

5. **Segments détaillés** :
   - Diviser chaque col en 3-5 segments caractéristiques
   - Décrire les particularités techniques de chaque segment

6. **Contenu historique** :
   - Enrichir les récits historiques (course et non-course)
   - Ajouter des anecdotes et moments mémorables

7. **Optimisation SEO** :
   - Enrichir les descriptions avec des mots-clés pertinents
   - Créer des méta-descriptions optimisées pour chaque col

### Données à standardiser en priorité

1. **Comparaison des versants** : Créer une analyse comparative pour tous les cols à versants multiples
2. **Difficulté technique** : Affiner l'échelle de difficulté avec des critères objectifs
3. **Conseils pratiques** : Étendre la section informations pratiques avec des détails locaux
4. **Points d'intérêt** : Ajouter 3-5 points d'intérêt géolocalisés pour chaque col

### Contenu multimédia à développer

1. **Vidéos 360°** : Ajouter des liens vers des vidéos à 360° du sommet de chaque col
2. **Time-lapses** : Intégrer des time-lapses des ascensions complètes
3. **Galeries par saison** : Organiser des galeries montrant le col à différentes saisons
4. **Archives historiques** : Rassembler des photos d'archives des courses historiques

## Exigences pour les médias

### Images
- **Photo principale** : 1920x1080px, format paysage, montrant clairement le col
- **Photos de galerie** : au moins 4 photos de 1280x720px minimum, montrant :
  - La route vers le sommet
  - Les virages en épingle caractéristiques
  - Le sommet avec panneau/borne
  - La vue panoramique du sommet
  - Optionnel : Détails du gradient, monuments, points d'intérêt

### Formats cartographiques
- **Profil d'élévation** : format SVG ou JSON avec points tous les 100m
- **Tracé GPS** : format GPX pour les deux versants si applicable

## Liste de contrôle pour la validation

- [ ] Coordonnées GPS vérifiées avec une précision de 6 décimales
- [ ] Données d'élévation vérifiées avec une source officielle
- [ ] Noms vérifiés dans toutes les langues requises
- [ ] Histoire vérifiée avec des sources crédibles
- [ ] Images libres de droits ou avec autorisation
- [ ] Informations pratiques à jour (fermetures, conditions)
- [ ] Segments proportionnels à la longueur totale

## Conseils pour la rédaction

1. Utilisez un ton informatif mais engageant
2. Incluez des détails techniques précis pour les cyclistes
3. Mentionnez les particularités qui distinguent ce col
4. Indiquez les dangers ou difficultés spécifiques
5. Suggérez des combinaisons avec d'autres cols voisins
