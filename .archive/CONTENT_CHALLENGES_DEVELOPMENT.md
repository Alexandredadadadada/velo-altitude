# Guide de Développement des Défis Cyclistes - Velo-Altitude

**Date :** 5 avril 2025  
**Version :** 1.0

## Introduction

Ce document détaille le format et les exigences pour l'ajout de nouveaux défis cyclistes à la plateforme Velo-Altitude. La structure suit le format JSON existant dans `server/data/cycling-challenges.json`.

## Structure des données

Chaque défi cycliste doit être défini en suivant ce modèle JSON :

```json
{
  "id": "challenge-xyz",
  "name": "Nom du défi",
  "description": "Description détaillée du défi et de ses objectifs",
  "difficulty": "Modéré", // Options: "Facile", "Modéré", "Difficile", "Très difficile", "Extrême"
  "estimatedTimeToComplete": "3 jours", // Durée estimée
  "category": "Multi-cols", // Options: "Haute montagne", "Multi-cols", "Endurance", "Gravel", "Mixte", etc.
  "cols": [
    "col-id-1", // ID du premier col
    "col-id-2", // ID du deuxième col
    "col-id-3"  // etc.
  ],
  "badgeImage": "/assets/badges/badge-name.svg", // Chemin vers l'image du badge
  "rewards": {
    "points": 5000, // Points attribués pour la réalisation
    "badge": "Nom du badge attribué",
    "certificate": true, // Si un certificat est généré
    "specialReward": "Description d'une récompense spéciale éventuelle"
  },
  "requirements": {
    "photosRequired": true, // Si des photos sont nécessaires
    "stravaActivities": true, // Si des activités Strava sont requises
    "timeLimit": "14 jours", // Limite de temps éventuelle
    "minimumTimePerCol": "30 minutes", // Temps minimum sur chaque col
    "additionalVerification": "Description des vérifications supplémentaires"
  },
  "leaderboard": true, // Si un classement est maintenu
  "stages": [ // Pour les défis multi-étapes
    {
      "name": "Nom de l'étape",
      "start": "Point de départ",
      "end": "Point d'arrivée",
      "distance": 120, // en kilomètres
      "elevation": 2500, // en mètres
      "suggestedRoute": "URL vers le tracé GPX",
      "checkpoints": ["col-id-1", "col-id-2"],
      "timeEstimate": "6-8 heures"
    }
  ],
  "tips": [
    "Conseil 1 pour réussir le défi",
    "Conseil 2 pour réussir le défi"
  ],
  "seasons": {
    "recommended": "Mai à octobre",
    "possible": "Avril à novembre",
    "closed": "Décembre à mars"
  },
  "logisticsInfo": {
    "startPoint": {
      "name": "Nom du point de départ",
      "coordinates": [46.123, 7.456],
      "accessInfo": "Information sur l'accès"
    },
    "accommodations": [
      {
        "name": "Nom de l'hébergement",
        "type": "hotel", // ou "gîte", "camping", etc.
        "location": "Localité",
        "bikeFriendly": true,
        "priceRange": "€€",
        "contact": "Information de contact"
      }
    ],
    "services": [
      {
        "type": "bike_shop",
        "name": "Nom du service",
        "location": "Localité",
        "notes": "Informations complémentaires"
      }
    ],
    "transportation": [
      "Information sur les transports en commun",
      "Information sur le stationnement"
    ]
  },
  "communityNotes": [
    {
      "author": "Nom de l'auteur",
      "date": "2025-03-15",
      "text": "Retour d'expérience sur le défi",
      "rating": 4.5
    }
  ],
  "relatedChallenges": ["challenge-id-1", "challenge-id-2"],
  "createdBy": "admin", // ou ID utilisateur pour les défis créés par la communauté
  "dateCreated": "2025-01-15T14:30:00Z",
  "lastUpdated": "2025-03-20T10:15:00Z"
}
```

## Catégories de défis à développer

### 1. Défis de massifs montagneux

Développer des défis couvrant les principales chaînes de montagnes européennes.

**Priorités :**
- Les Dolomites Essentielles (5-7 cols majeurs)
- Tour du Mont-Blanc (cols franco-italo-suisses)
- Les Joyaux des Alpes Suisses
- La Grande Traversée des Carpates
- Route des Grandes Alpes (version intégrale)
- Traversée des Alpes Juliennes

### 2. Défis thématiques

**Développer les défis suivants :**
- Sur les Traces du Tour (cols historiques du Tour de France)
- Les Ascensions de Plus de 2000m
- Les Pentes de la Terreur (cols avec +15% de pente)
- Les Routes Panoramiques (cols avec vues exceptionnelles)
- Les Routes Secrètes (cols peu connus mais remarquables)
- Le Grand Slam des 3000m (cols à plus de 3000m ou proches)

### 3. Défis saisonniers et spéciaux

- Défi de Printemps (cols idéaux en avril-mai)
- Défi Canicule (cols d'altitude pour l'été)
- Défi des Couleurs d'Automne
- Défi Week-end (réalisable en 2-3 jours)
- Défi Frontières (cols traversant des frontières)
- Défi des Cinq Pays

### 4. Défis personnalisables

Permettre aux utilisateurs de créer leurs propres défis avec:
- Sélection de 3 à 10 cols
- Possibilité de définir un temps limite
- Options de vérification
- Partage avec la communauté

## Exigences pour les médias des défis

### Images
- **Badge du défi** : Format SVG, design distinctif
- **Image de couverture** : 1920x1080px, représentative du défi
- **Carte interactive** : Tracé GPX pour chaque étape ou option
- **Images des cols** : Utiliser les images de la base de données des cols

### Vidéos (optionnelles)
- Vidéo de présentation du défi (30-60 secondes)
- Conseils des cyclistes ayant déjà réalisé le défi

## Système de difficulté

Définir clairement la difficulté selon ces critères:

| Niveau | Distance totale | Dénivelé total | Pentes max | Facteurs logistiques |
|--------|----------------|----------------|------------|----------------------|
| Facile | < 100km | < 1500m | < 8% | Services réguliers, zones peuplées |
| Modéré | 100-200km | 1500-3000m | 8-10% | Services disponibles |
| Difficile | 200-350km | 3000-5000m | 10-15% | Services limités par endroits |
| Très difficile | 350-500km | 5000-8000m | 15-20% | Logistique complexe |
| Extrême | > 500km | > 8000m | > 20% | Zones isolées, logistique très difficile |

## Système de récompenses

- **Points** : Attribuer 100-10000 points selon difficulté et prestige
- **Badges** : Créer un badge unique et visuellement distinctif
- **Certificats** : Générer un certificat PDF personnalisé
- **Récompenses spéciales** : Pour les défis majeurs, prévoir des récompenses physiques optionnelles

## Validation des accomplissements

Définir clairement les méthodes de validation:
1. Photos géolocalisées aux points clés
2. Activités Strava/Garmin Connect
3. Temps de passage aux checkpoints
4. Preuve vidéo pour les défis d'élite
5. Témoins pour les défis communautaires

## Développement du contenu narratif

Chaque défi devrait inclure:

1. **Histoire et contexte** : Arrière-plan culturel et historique des cols
2. **Personnalités marquantes** : Cyclistes célèbres associés aux cols
3. **Anecdotes** : Histoires mémorables liées aux cols
4. **Points d'intérêt culturel** : Éléments patrimoniaux à découvrir
5. **Expérience sensorielle** : Description de l'ambiance et des paysages

## Guide des saisons et météo

Inclure pour chaque défi:
- Période optimale de réalisation
- Conditions météorologiques typiques
- Alertes sur les conditions extrêmes possibles
- Équipement recommandé selon la saison
- Plans B en cas de fermeture de cols

## Conseils pratiques

Inclure une section de conseils pratiques couvrant:
- Préparation physique spécifique
- Logistique (transport, hébergement)
- Ravitaillement et points d'eau
- Équipement recommandé
- Assistance mécanique et médicale

## Liste de contrôle pour la validation

- [ ] Tous les cols du défi ont des données complètes dans la base
- [ ] Tracés GPX vérifiés et disponibles pour chaque étape
- [ ] Exigences de validation clairement définies
- [ ] Difficulté évaluée selon les critères standardisés
- [ ] Conseils saisonniers à jour
- [ ] Estimation réaliste du temps nécessaire
- [ ] Points logistiques vérifiés (hébergements, services)
- [ ] Badges et récompenses conçus
- [ ] Contenu narratif riche et engageant
- [ ] Photos de haute qualité disponibles
