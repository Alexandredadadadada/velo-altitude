# Documentation de la Section Communauté - Velo-Altitude

## Vue d'ensemble

La section Communauté de Velo-Altitude offre un ensemble complet de fonctionnalités sociales permettant aux cyclistes de se connecter, partager leurs expériences, comparer leurs performances et s'encourager mutuellement. Ce document fournit une référence complète pour l'intégration, les tests et la maintenance des composants communautaires.

## Structure des fichiers

### Page principale et contexte

| Composant | Chemin | Description |
|-----------|--------|-------------|
| Page Communauté | `client/src/pages/Community.js` | Point d'entrée principal de la section avec système d'onglets et routage |
| Contexte Communauté | `client/src/contexts/CommunityContext.js` | Gestion centralisée de l'état pour toutes les fonctionnalités communautaires |

### Forums et discussions

| Composant | Chemin | Description |
|-----------|--------|-------------|
| Liste des Forums | `client/src/components/community/forums/ForumsList.js` | Affichage des forums thématiques par région et discipline |
| Liste des Sujets | `client/src/components/community/forums/ForumTopicList.js` | Liste des sujets dans un forum spécifique avec recherche et filtrage |
| Création de Sujet | `client/src/components/community/forums/NewTopicForm.js` | Formulaire de création de nouveaux sujets avec support Markdown |
| Sujet Détaillé | `client/src/components/community/forums/ForumTopic.js` | Affichage d'un sujet avec ses réponses et fonctionnalités de modération |

### Partage d'itinéraires

| Composant | Chemin | Description |
|-----------|--------|-------------|
| Partage d'Itinéraire | `client/src/components/community/sharing/RouteSharing.js` | Interface multi-étapes pour partager un itinéraire avec détails et photos |
| Galerie d'Itinéraires | `client/src/components/community/sharing/RouteGallery.js` | Affichage des itinéraires partagés avec filtrage et recherche |
| Détail d'Itinéraire | `client/src/components/community/sharing/RouteDetail.js` | Vue détaillée d'un itinéraire avec carte, statistiques et commentaires |

### Profils et classements

| Composant | Chemin | Description |
|-----------|--------|-------------|
| Système de Classement | `client/src/components/community/ranking/RankingSystem.js` | Classement dynamique des cyclistes avec filtres et statistiques |
| Profil Utilisateur | `client/src/components/community/profile/UserProfile.js` | Profil détaillé avec badges, activités et statistiques personnelles |

## Intégration avec le système d'authentification

La section Communauté s'intègre avec le système d'authentification unifié de Velo-Altitude. Les fonctionnalités sensibles sont protégées et nécessitent une connexion utilisateur.

### Points d'intégration clés

- `useAuth()` : Hook personnalisé utilisé dans tous les composants nécessitant l'authentification
- Mécanisme de fallback automatique : Compatible avec le système de secours d'urgence
- Protection des routes : Utilisation du composant `ProtectedRoute` pour les sections restreintes

```jsx
// Exemple d'utilisation dans les composants communautaires
import { useAuth } from '../../../context/AuthContext';

const Component = () => {
  const { isAuthenticated, user } = useAuth();
  
  // Logique conditionnelle basée sur l'authentification
  return (
    {isAuthenticated ? (
      <RestrictedContent />
    ) : (
      <LoginPrompt />
    )}
  );
};
```

## Fonctionnalités et points d'entrée

### Forums thématiques

- **Classification** : Forums organisés par région (Alpes, Pyrénées, Vosges, etc.) et par discipline (Route, Gravel, VTT)
- **Recherche avancée** : Filtrage par termes, catégories et dates
- **Contenu enrichi** : Support Markdown pour le formatage des messages
- **Modération** : Système de signalement pour le contenu inapproprié

### Partage d'itinéraires

- **Création guidée** : Interface par étapes pour détailler un itinéraire
- **Sélection de cols** : Intégration avec la base de données des cols
- **Galerie de photos** : Upload et gestion d'images
- **Métriques** : Distance, dénivelé, difficulté, durée estimée
- **Profil altimétrique** : Visualisation du profil de dénivelé
- **Commentaires** : Discussion et retours sur les itinéraires partagés

### Système de classement

- **Points** : Attribués pour les distances parcourues, dénivelés, défis complétés
- **Filtres** : Par niveau, région, équipe, période
- **Statistiques globales** : Métriques de la communauté (distance totale, etc.)
- **Évolution personnelle** : Suivi des progrès individuels

### Profils utilisateurs

- **Statistiques personnelles** : Totaux de distance, dénivelé, points
- **Badges** : Récompenses pour les accomplissements
- **Historique d'activités** : Timeline des actions sur la plateforme
- **Itinéraires partagés** : Collection des contributions
- **Réseau social** : Amis, abonnements et messagerie directe

## Tests spécifiques

### Validation des forums

- Test de création de sujet avec formatage Markdown
- Validation des filtres et de la recherche
- Test des notifications de réponses
- Vérification du système de modération et signalement

### Validation du partage d'itinéraires

- Test complet du processus multi-étapes
- Validation de l'upload d'images et du redimensionnement
- Test des filtres dans la galerie d'itinéraires
- Vérification des interactions (likes, commentaires, téléchargements)

### Validation du classement

- Vérification de l'actualisation des classements
- Test des filtres (niveau, région, période)
- Validation de l'affichage des statistiques
- Test de l'évolution des points

### Validation des profils

- Test de l'affichage des données utilisateur
- Validation des badges et accomplissements
- Test de la messagerie directe
- Vérification des interactions sociales (suivre, messages)

## Points d'extension futurs

### Forums

- Ajout de catégories personnalisées par l'utilisateur
- Support pour les sondages intégrés dans les sujets
- Système avancé de modération avec niveaux d'accès

### Partage d'itinéraires

- Intégration plus poussée avec les services cartographiques
- Export GPX pour appareils GPS
- Visualisation 3D des itinéraires partagés
- Comparaison d'itinéraires similaires

### Classement

- Challenges saisonniers avec récompenses
- Classements par équipes et clubs
- Visualisations avancées des performances

### Profils utilisateurs

- Synchronisation bidirectionnelle avec Strava
- Personnalisation avancée du profil
- Recommandations de connexions basées sur les intérêts

## Gestion des données

### Modèles de données

```javascript
// Exemple de structure de données pour les forums
const forumStructure = {
  id: String,
  title: String,
  description: String,
  category: String, // 'region' ou 'discipline'
  subcategory: String, // nom de la région ou discipline
  topics: Array, // références aux sujets
  createdAt: Date,
  updatedAt: Date
};

// Exemple de structure pour un itinéraire partagé
const routeStructure = {
  id: String,
  title: String,
  description: String,
  author: Object, // référence à l'utilisateur
  distance: Number,
  elevation: Number,
  difficulty: String,
  region: String,
  startLocation: String,
  endLocation: String,
  colsIncluded: Array, // références aux cols traversés
  images: Array, // URLs des images
  gpxData: String, // données GPX encodées
  likes: Number,
  comments: Array,
  createdAt: Date,
  updatedAt: Date
};
```

## Intégration avec d'autres modules

### Module Cols

- Référencement des cols dans les itinéraires partagés
- Création de sujets de forum liés à des cols spécifiques

### Module Entrainement

- Partage de plans d'entraînement dans les forums
- Contributions aux classements basées sur les activités enregistrées

### Module Météo

- Affichage des conditions météo actuelles sur les itinéraires partagés
- Suggestions d'itinéraires basées sur les prévisions météorologiques

## Guide de dépannage

| Problème | Solution |
|----------|----------|
| Le classement ne se met pas à jour | Vérifier que le contexte communautaire est correctement initialisé et que les mises à jour provoquent un re-rendu |
| Les images d'itinéraires ne s'affichent pas | Vérifier les chemins d'accès et les autorisations de fichiers pour les uploads |
| Erreurs de formatage Markdown | Vérifier la configuration de React-Markdown et les sanitizers HTML |
| Problèmes d'authentification dans les forums | Vérifier l'intégration avec AuthContext et la gestion des jetons |
| Lenteur de chargement de la galerie d'itinéraires | Optimiser les requêtes et implémenter une pagination côté serveur |

## Optimisations et performances

- Chargement paresseux (lazy loading) pour les composants lourds
- Pagination optimisée pour les listes de forums, sujets et itinéraires
- Mise en cache des données fréquemment consultées
- Compression et redimensionnement des images uploadées

## Conclusion

La section Communauté constitue un pilier central de l'expérience Velo-Altitude, favorisant l'engagement des utilisateurs et le partage d'expériences. Son intégration réussie avec les autres modules et le système d'authentification offre une expérience utilisateur fluide et cohérente, tout en maintenant des performances optimales.
