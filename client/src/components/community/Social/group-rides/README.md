# Module Sorties de Groupe - Velo-Altitude

Ce module permet aux utilisateurs de la plateforme Velo-Altitude (anciennement Grand Est Cyclisme) de planifier, créer et participer à des sorties cyclistes en groupe. Il s'intègre parfaitement dans l'écosystème social de l'application et utilise les fonctionnalités existantes comme le partage d'itinéraires et l'intégration avec Strava.

## Fonctionnalités principales

### 1. Gestion des sorties de groupe
- Création de sorties avec définition de tous les paramètres (date, lieu, niveau requis, itinéraire, etc.)
- Visualisation des sorties existantes avec filtrage avancé
- Participation et désinscription aux sorties
- Suivi des sorties auxquelles l'utilisateur participe ou qu'il organise

### 2. Sélection d'itinéraires
- Intégration avec le module de routes existant
- Visualisation cartographique des itinéraires disponibles
- Sélection facile d'itinéraires pour les sorties de groupe
- Importation automatique des informations de l'itinéraire (distance, dénivelé, difficulté)

### 3. Fonctionnalités sociales
- Chat entre participants d'une sortie
- Système d'invitation simplifié (lien, email, réseaux sociaux)
- Consultation des profils des participants
- Visualisation des statistiques de participation

### 4. Intégration Strava
- Partage automatique des sorties sur Strava
- Synchronisation des participants entre Velo-Altitude et Strava
- Gestion des paramètres de partage (privé/public, invitation des followers)

### 5. Données météorologiques
- Affichage des prévisions météo pour chaque sortie
- Mise à jour automatique des conditions à l'approche de la date
- Indicateurs visuels de température, vent, précipitations

## Structure des composants

```
/components/social/group-rides/
├── GroupRidesList.js       # Affichage des sorties sous forme de liste de cartes
├── GroupRideFilters.js     # Filtres de recherche pour les sorties
├── GroupRideDetails.js     # Dialogue détaillé d'une sortie spécifique
├── CreateGroupRideDialog.js # Formulaire de création/édition d'une sortie
├── MapRouteSelector.js     # Sélecteur d'itinéraire sur carte
├── GroupRideChat.js        # Chat entre participants d'une sortie
```

```
/services/
├── groupRideService.js     # Service pour la gestion des sorties de groupe
```

```
/components/integrations/
├── StravaIntegration.js    # Intégration avec l'API Strava
```

## Structure de données

### Objet `GroupRide`

```javascript
{
  id: String,                // Identifiant unique de la sortie
  title: String,             // Titre de la sortie
  description: String,       // Description détaillée
  routeId: String,           // Référence à l'itinéraire sélectionné
  routeDetails: {            // Détails de l'itinéraire (dénormalisés pour performance)
    name: String,
    distance: Number,
    elevationGain: Number,
    difficulty: String,
    region: String
  },
  organizer: {               // Informations sur l'organisateur
    id: String,
    name: String,
    level: String,
    avatar: String
  },
  dateTime: String,          // Date et heure de la sortie (ISO format)
  meetingPoint: String,      // Lieu de rendez-vous
  maxParticipants: Number,   // Nombre maximum de participants
  currentParticipants: Number, // Nombre actuel de participants
  levelRequired: String,     // Niveau requis (beginner, intermediate, advanced, expert)
  averageSpeed: Number,      // Vitesse moyenne prévue en km/h
  terrainType: String,       // Type de terrain (flat, hilly, mountain, mixed)
  isPublic: Boolean,         // Visibilité publique ou privée
  tags: [String],            // Tags associés à la sortie
  weatherForecast: {         // Prévisions météo (mise à jour automatiquement)
    temperature: Number,
    condition: String,
    windSpeed: Number,
    precipitation: Number
  },
  participants: [{           // Liste des participants
    id: String,
    name: String,
    level: String,
    avatar: String
  }],
  stravaEventId: String      // ID de l'événement Strava associé (si partagé)
}
```

## Intégration dans l'application

Le module s'intègre parfaitement avec les autres fonctionnalités de Velo-Altitude :

1. **Avec le système d'itinéraires** : Utilisation des itinéraires existants pour définir le parcours des sorties
2. **Avec le système de profils** : Vérification du niveau des utilisateurs, affichage de leurs avatars
3. **Avec Strava** : Partage des sorties, invitation des followers, synchronisation des participants
4. **Avec la météo** : Affichage des prévisions pour la date de la sortie

## Installation et configuration

1. Assurez-vous que tous les composants sont correctement importés dans le fichier principal de l'application.
2. Vérifiez que les services nécessaires sont importés et configurés.
3. Pour l'intégration avec Strava, configurez les variables d'environnement suivantes :
   - `REACT_APP_STRAVA_CLIENT_ID`
   - `REACT_APP_STRAVA_CLIENT_SECRET`
   - `REACT_APP_STRAVA_REDIRECT_URI`
4. Pour la visualisation des cartes, assurez-vous que la variable `REACT_APP_MAPBOX_TOKEN` est configurée.

## Utilisation

Importez le composant principal dans votre page ou composant parent :

```javascript
import GroupRideBuilder from '../components/social/GroupRideBuilder';

// Puis dans votre rendu
<GroupRideBuilder userId={currentUser?.id} />
```

## Mode mock

En mode développement ou démo, le service utilise des données mockées définies dans `groupRideService.js`. Pour basculer entre les données mockées et les données réelles, utilisez la variable d'environnement `REACT_APP_USE_MOCK_DATA`.

## Inspirations et évolutions futures

Ce module s'inspire des meilleurs aspects de plateformes comme Strava Clubs, Komoot et Garmin Connect, tout en apportant une touche unique adaptée à la communauté de cyclistes de la région Grand Est.

### Évolutions prévues

1. **Intégration GPS** : Suivi en temps réel de la position des participants lors de la sortie
2. **Statistiques avancées** : Analyse post-sortie des performances du groupe
3. **Évaluation des sorties** : Système de notation et commentaires après les sorties
4. **Recommandation intelligente** : Suggestion de sorties basée sur le profil et l'historique de l'utilisateur

---

Développé avec ❤️ pour la communauté Velo-Altitude 🚴‍♂️
