# Fonctionnalités Sociales de Velo-Altitude

## Vue d'ensemble
- **Objectif**: Documenter les fonctionnalités sociales et d'interaction entre utilisateurs
- **Public cible**: Équipe Communauté & Auth, équipe Frontend
- **Statut**: En production avec mises à jour prévues
- **Dernière mise à jour**: Avril 2025

## Fonctionnalités principales

### Système de suivi (Follow)
- Les utilisateurs peuvent suivre d'autres cyclistes
- Les relations sont asymétriques (comme sur Twitter/Instagram)
- Notifications lors d'un nouvel abonné
- Configuration des flux d'activité basée sur les abonnements
- Limite de 1000 abonnements par compte

### Flux d'activité
- Affichage des activités récentes des utilisateurs suivis
- Types d'activités visibles:
  - Nouveaux cols gravis
  - Défis complétés ou créés
  - Photos partagées
  - Participation à des événements
  - Badges débloqués
- Filtrage personnalisable par type d'activité
- Chargement lazy pour optimiser les performances

### Système de réactions
- "Kudos" pour féliciter les réalisations (similaire au "Like")
- Réactions variées: 👏, 🔥, 🚵, 🏔️, 👍
- Commentaires sur les activités
- Système anti-spam et modération automatique
- Notifications pour les nouvelles réactions

### Événements et sorties groupées
- Création d'événements cyclistes
- Invitation d'autres utilisateurs
- Planification collaborative
- Parcours suggérés selon les niveaux des participants
- Confirmation de participation et listes d'attente

### Système de messages
- Messagerie privée entre utilisateurs
- Discussions de groupe pour les événements
- Partage de parcours et défis via messages
- Notifications in-app et email (selon préférences)
- Contrôles anti-harcèlement

## Structure de données

### Relation sociale
```json
{
  "id": "rel_1234567",
  "follower": "user_123",
  "following": "user_456",
  "createdAt": "2025-02-14T15:32:10Z",
  "status": "active",
  "notificationsEnabled": true,
  "relationshipType": "follow"
}
```

### Publication sociale
```json
{
  "id": "post_789012",
  "authorId": "user_456",
  "type": "col_completed",
  "content": {
    "colId": "col_galibier",
    "colName": "Col du Galibier",
    "date": "2025-04-02T11:45:22Z",
    "message": "Enfin conquis le géant des Alpes !",
    "photos": ["https://velo-altitude.com/media/posts/img_12345.jpg"],
    "statistics": {
      "duration": 125,
      "averageSpeed": 12.5,
      "maxSpeed": 68.2,
      "elevation": 1245
    },
    "location": {
      "lat": 45.0656,
      "lng": 6.4083
    }
  },
  "visibility": "public",
  "createdAt": "2025-04-02T15:30:00Z",
  "editedAt": null,
  "reactionsCount": {
    "kudos": 24,
    "comments": 8
  },
  "isPromoted": false
}
```

### Événement social
```json
{
  "id": "event_345678",
  "title": "Ascension du Ventoux - Groupe Intermédiaire",
  "description": "Sortie groupe pour gravir le géant de Provence par Bédoin",
  "organizer": "user_789",
  "startDate": "2025-06-15T08:00:00Z",
  "endDate": "2025-06-15T16:00:00Z",
  "maxParticipants": 15,
  "currentParticipants": 8,
  "waitingList": [],
  "level": "intermédiaire",
  "route": {
    "routeId": "route_ventoux_bedoin",
    "distance": 42.5,
    "elevation": 1617,
    "gpxUrl": "https://velo-altitude.com/routes/gpx/ventoux_bedoin.gpx"
  },
  "meetingPoint": {
    "name": "Place de la Mairie, Bédoin",
    "coordinates": {
      "lat": 44.1239,
      "lng": 5.1797
    }
  },
  "status": "scheduled",
  "visibility": "public",
  "tags": ["ventoux", "groupe", "intermédiaire"],
  "weather": {
    "forecast": "ensoleillé",
    "temperature": "18-25°C",
    "windSpeed": "15-25km/h",
    "precipitation": "0%"
  }
}
```

### Message
```json
{
  "id": "msg_901234",
  "conversationId": "conv_567890",
  "senderId": "user_123",
  "content": "Tu serais partant pour le défi des 7 Majeurs ce mois-ci ?",
  "sentAt": "2025-04-03T10:23:45Z",
  "readBy": ["user_456"],
  "attachments": [],
  "reactions": []
}
```

## Fonctionnalités avancées

### Groupes et clubs
- Création de groupes privés ou publics
- Hiérarchie des membres (administrateur, modérateur, membre)
- Partage de contenu exclusif au groupe
- Événements privés pour les membres
- Statistiques et classements de groupe

### Défis collaboratifs
- Défis à relever en équipe
- Progression collective visualisée
- Tableau de classement pour stimuler l'émulation
- Badges collectifs
- Partage des résultats sur les réseaux sociaux

### Classements et compétitions
- Classements hebdomadaires et mensuels
- Catégories variées: distance, dénivelé, nombre de cols
- Segmentation par région et niveau
- Système anti-triche avec validation
- Récompenses virtuelles pour les vainqueurs

## Intégration avec les réseaux sociaux

### Partage externe
- Création de cartes de partage personnalisées
- Intégration avec Facebook, Twitter, Instagram
- Options de confidentialité lors du partage
- Métriques de partage et d'engagement
- Système d'invitation d'amis

### Importation de contacts
- Recherche d'amis depuis des plateformes tierces
- Suggestions d'amis basées sur la localisation
- Suggestions basées sur des activités similaires
- Protection des données lors de l'importation

## Gamification sociale

### Badges communautaires
- "Social Rider" - Pour participation active à la communauté
- "Mentor de la Montagne" - Pour aide apportée aux débutants
- "Organisateur d'Élite" - Pour événements populaires créés
- "Photographe de Sommet" - Pour photos appréciées
- "Ambassadeur Local" - Pour expertise sur une région

### Défis viraux
- Défis créés par la communauté pouvant devenir viraux
- Système de votes pour les défis populaires
- Promotion des défis tendance
- Statistiques de participation en temps réel

## Modération et sécurité

### Protection des utilisateurs
- Filtrage automatique du contenu inapproprié
- Possibilité de bloquer des utilisateurs
- Signalement de contenu problématique
- Détection automatique de comportements suspects
- Vérification des photos partagées

### Système anti-harcèlement
- Détection de messages répétitifs ou inappropriés
- Limitations temporaires pour utilisateurs signalés
- Shadowban pour cas graves
- Processus d'appel pour sanctions

## Architecture technique

### Notifications en temps réel
- WebSockets pour notifications instantanées
- Service de notification Firebase pour mobiles
- File d'attente pour notifications par courriel
- Système de regroupement pour éviter la surcharge

### Base de données
- Collections MongoDB optimisées:
  - `social_relationships`
  - `social_posts`
  - `social_events`
  - `conversations`
  - `messages`
- Indexation pour recherches fréquentes
- Agrégation pour les flux d'activités

### Cache et performance
- Mise en cache Redis des flux d'activité
- Invalidation ciblée lors de nouvelles activités
- Distribution de charge pour événements populaires
- CDN pour médias sociaux partagés

## Intégration avec autres modules

### Module Cols & Défis
- Partage automatique d'activités liées aux cols
- Défis sociaux intégrés
- Comparaison de performances entre amis

### Module Visualisation 3D
- Capture et partage de vues 3D personnalisées
- Tags sociaux dans l'environnement 3D
- Photos géolocalisées visibles en mode 3D

### Module Entraînement
- Partage de plans d'entraînement
- Comparaison d'entraînements entre utilisateurs
- Sessions d'entraînement virtuelles en groupe

## Mesures de succès

### KPIs sociaux
- Taux d'engagement (réactions/vues)
- Rétention des utilisateurs actifs socialement
- Nombre moyen d'interactions par utilisateur
- Croissance du réseau social (nouvelles connexions/jour)
- Taux de conversion des invitations

### Analyses d'engagement
- Heures de pic d'activité
- Types de contenu les plus engageants
- Corrélation entre activité sociale et utilisation
- Impact des fonctionnalités sociales sur la rétention

## Évolutions prévues

### Phase 1 (Q2 2025)
- Intégration des stories éphémères
- Amélioration des suggestions de connexions
- Galeries photos collaboratives pour événements

### Phase 2 (Q3 2025)
- Système de livestream pour événements majeurs
- Fonctionnalités premium pour organisateurs
- API sociale pour intégrations tierces

### Phase 3 (Q4 2025)
- Réalité augmentée pour rencontres cyclistes
- Système d'échange et de prêt de matériel
- Plateforme de mentorat structurée

## Accessibilité et inclusion

- Support multilingue pour les interactions sociales
- Options d'accessibilité pour utilisateurs malvoyants
- Conception inclusive pour tous niveaux d'expérience technique
- Modération sensible à la diversité culturelle

## Références
- [Documentation de l'API sociale](../../../technique/API/ENDPOINTS.md)
- [Guide de modération](MODERATION.md)
- [Bonnes pratiques de communauté](../../guides/utilisateur/COMMUNAUTE_GUIDELINES.md)
- [Schéma de données utilisateurs](PROFILS.md)
