# Gestion des Profils Utilisateurs

## Vue d'ensemble
- **Objectif**: Documenter la structure, la gestion et les fonctionnalités des profils utilisateurs dans Velo-Altitude
- **Public cible**: Équipe Communauté & Auth, équipe Frontend
- **Statut**: En production
- **Dernière mise à jour**: Avril 2025

## Structure des profils utilisateurs

### Données de base
```json
{
  "userId": "auth0|1234567890",
  "email": "utilisateur@exemple.com",
  "displayName": "CyclisteAlpin",
  "firstName": "Jean",
  "lastName": "Dupont",
  "avatar": "https://velo-altitude.com/images/profiles/default.png",
  "coverImage": "https://velo-altitude.com/images/profiles/covers/mountains.jpg",
  "location": "Grenoble, France",
  "dateCreated": "2024-12-15T14:30:00Z",
  "lastLogin": "2025-04-04T09:15:30Z",
  "isPublic": true,
  "language": "fr",
  "role": "user"
}
```

### Données cyclistes
```json
{
  "cyclingProfile": {
    "level": "intermédiaire",
    "ftp": 250,
    "weight": 72,
    "height": 178,
    "preferredTerrains": ["montagne", "vallonné"],
    "cyclingExperience": 4,
    "weeklyHours": 8,
    "mainBike": "Route",
    "secondaryBikes": ["VTT", "Gravel"]
  }
}
```

### Préférences utilisateur
```json
{
  "preferences": {
    "notifications": {
      "email": true,
      "push": true,
      "newsletter": true,
      "events": true,
      "challenges": true,
      "friendActivity": true
    },
    "privacy": {
      "showActivity": true,
      "showLocation": false,
      "showStats": true,
      "allowTagging": true
    },
    "display": {
      "darkMode": "auto",
      "distanceUnit": "km",
      "elevationUnit": "m",
      "weightUnit": "kg",
      "temperatureUnit": "celsius",
      "mapDefault": "relief"
    }
  }
}
```

### Statistiques utilisateur
```json
{
  "stats": {
    "totalDistance": 7841,
    "totalElevation": 98500,
    "colsClimbed": 34,
    "challengesCompleted": 5,
    "kudosGiven": 127,
    "kudosReceived": 89,
    "followersCount": 42,
    "followingCount": 65,
    "longestRide": 210,
    "highestClimb": 2802
  }
}
```

## Fonctionnalités de profil

### Page de profil public
- Affiche les informations publiques de l'utilisateur
- Présente les statistiques, réalisations et défis récents
- Permet de consulter les cols complétés sur une carte interactive
- Affiche l'historique des activités publiques
- Inclut la galerie de photos partagées

### Page de profil privé (Mon Profil)
- Interface de modification des données personnelles
- Gestion des préférences de confidentialité et notifications
- Tableau de bord personnalisé avec:
  - Statistiques et progression
  - Défis en cours et à venir
  - Rappel des derniers entraînements
  - Recommandations personnalisées

### Associations et badges
- Badges pour les réalisations (cols grimpés, défis terminés)
- Écussons spéciaux pour les "7 Majeurs" complétés
- Certification "Grimpeur Certifié" après validation d'activités
- Badges saisonniers et pour événements spéciaux

## Intégration avec Auth0

### Structure de métadonnées Auth0
```json
{
  "user_metadata": {
    "cyclingLevel": "intermédiaire",
    "preferredRegions": ["Alpes", "Pyrénées"],
    "lastCompletedCol": "Col du Galibier",
    "displayPreferences": {
      "darkMode": true
    }
  },
  "app_metadata": {
    "role": "user",
    "subscription": "premium",
    "subscription_end": "2025-12-31",
    "verified_cyclist": true
  }
}
```

### Synchronisation des profils
- Les données de base sont synchronisées depuis Auth0 lors de la connexion
- Les métadonnées utilisateur sont mises à jour dans Auth0 lors des modifications de profil
- Les rôles et autorisations sont gérés via app_metadata
- Processus de synchronisation asynchrone pour éviter les problèmes de performance

## Gestion des avatars et médias

### Stockage des images
- Avatars stockés dans AWS S3 (bucket `velo-altitude-user-media`)
- Traitement d'images via API dédiée
- Plusieurs tailles générées automatiquement:
  - Thumbnail: 50x50px
  - Small: 150x150px
  - Medium: 300x300px
  - Large: 600x600px

### Contraintes et validation
- Taille maximale: 5MB
- Formats acceptés: JPG, PNG, WebP
- Vérification automatique du contenu inapproprié
- Redimensionnement et optimisation automatique

## Niveaux d'accès et confidentialité

### Options de confidentialité
- **Public**: Profil visible par tous les utilisateurs
- **Abonnés uniquement**: Visible uniquement par les abonnés
- **Privé**: Visible uniquement par l'utilisateur et les administrateurs

### Gestion des données personnelles
- Conformité RGPD complète
- Option d'exportation des données personnelles (format JSON et CSV)
- Procédure de suppression de compte avec période de grâce de 30 jours
- Anonymisation des contributions communautaires après suppression

## Intégration avec d'autres modules

### Module Cols & Défis
- Affichage des cols complétés sur le profil
- Défis personnels et progression
- Badges et récompenses visibles sur le profil

### Module Entraînement
- Synchronisation avec les plans d'entraînement
- Affichage des statistiques d'entraînement
- Historique des séances

### Module Communauté
- Lien vers les amis et abonnés
- Activité récente dans la communauté
- Participation aux événements et challenges

## Analytique et recommandations

### Collecte de données
- Suivi de l'engagement utilisateur (consentement requis)
- Analyse des préférences et comportements pour personnalisation
- Identification des tendances d'utilisation

### Système de recommandation
- Suggère des cols basés sur l'historique et les préférences
- Recommande des utilisateurs similaires à suivre
- Propose des défis adaptés au niveau de l'utilisateur
- Suggère des plans d'entraînement personnalisés

## Évolutions prévues

### Phase 1 (Q3 2025)
- Intégration d'un système de niveau d'expertise avec quiz de validation
- Ajout d'un système de mentoring entre utilisateurs
- Visualisation améliorée de la progression

### Phase 2 (Q4 2025)
- Profils pour clubs et associations
- Système de certification pour guides et coaches
- Intégration de données de santé depuis des applications tierces

## Points techniques à noter

### Performance
- Mise en cache des données de profil (Redis, TTL: 15 minutes)
- Chargement lazy des statistiques complexes
- Optimisation des requêtes avec agrégation MongoDB

### Sécurité
- Validation stricte des entrées utilisateur
- Sanitization des données HTML pour les descriptions
- Rate limiting sur les mises à jour de profil (10 par heure)

## Références
- [Documentation Auth0 sur les métadonnées utilisateur](https://auth0.com/docs/users/metadata)
- [Spécifications de l'API Profils](../../../technique/API/ENDPOINTS.md)
- [Guide UX des profils utilisateur](../../guides/developpeur/UX_GUIDELINES.md)
