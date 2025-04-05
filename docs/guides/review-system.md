# Documentation du Système de Revues

## Vue d'ensemble

Le système de revues permet aux utilisateurs de noter et commenter les routes cyclables. Il offre une plateforme pour partager des expériences, aider d'autres cyclistes à choisir des parcours adaptés à leurs préférences, et améliorer continuellement la qualité des données sur les routes européennes.

## Fonctionnalités principales

### 1. Création et gestion des revues

- **Notation des routes** : Les utilisateurs peuvent attribuer une note de 1 à 5 étoiles aux routes qu'ils ont parcourues
- **Commentaires détaillés** : Possibilité d'ajouter un commentaire descriptif (jusqu'à 1000 caractères)
- **Modification et suppression** : Les utilisateurs peuvent modifier ou supprimer leurs propres revues
- **Filtrage et tri** : Les revues peuvent être filtrées et triées selon différents critères (date, note, etc.)

### 2. Modération des revues

- **Signalement** : Les utilisateurs peuvent signaler les revues inappropriées
- **Modération automatique** : Détection automatique de contenu inapproprié basée sur des mots-clés
- **Modération manuelle** : Interface d'administration pour examiner les revues signalées
- **Actions de modération** : Approbation, rejet, modification ou suppression des revues signalées
- **Notifications** : Notifications aux administrateurs pour les revues modérées automatiquement

### 3. Intégration avec les routes et cols

- **Liaison avec les routes** : Chaque revue est associée à une route spécifique
- **Liaison avec les cols** : Intégration avec les cols européens pour enrichir les données
- **Statistiques agrégées** : Calcul de notes moyennes et autres métriques pour chaque route

## Architecture technique

### Modèles de données

#### RouteReview

```javascript
const reviewSchema = new mongoose.Schema({
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  flags: { type: Number, default: 0 },
  flaggedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  flagDetails: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    date: Date
  }],
  hidden: { type: Boolean, default: false },
  moderationStatus: { 
    type: String, 
    enum: ['none', 'pending', 'approved', 'rejected', 'edited'],
    default: 'none'
  },
  moderationNote: String,
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: Date
});
```

### Services

#### RouteReviewService

Gère les opérations CRUD pour les revues, y compris :
- Création de nouvelles revues
- Récupération des revues par route, utilisateur ou ID
- Mise à jour des revues existantes
- Suppression des revues
- Calcul des statistiques agrégées

#### ReviewModerationService

Gère la modération des revues, y compris :
- Traitement des revues signalées
- Modération automatique basée sur des mots-clés
- Actions de modération manuelle
- Notifications aux administrateurs et utilisateurs

#### RouteReviewIntegrationService

Intègre les revues avec d'autres composants du système, y compris :
- Liaison avec les cols européens
- Enrichissement des données de revues
- Génération de recommandations basées sur les revues

### API REST

#### Endpoints pour les revues

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/reviews/routes/:routeId` | Récupère toutes les revues pour une route spécifique |
| GET | `/api/reviews/users/:userId` | Récupère toutes les revues d'un utilisateur spécifique |
| GET | `/api/reviews/:reviewId` | Récupère une revue spécifique par ID |
| POST | `/api/reviews` | Crée une nouvelle revue |
| PUT | `/api/reviews/:reviewId` | Met à jour une revue existante |
| DELETE | `/api/reviews/:reviewId` | Supprime une revue |

#### Endpoints pour la modération

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/moderation/reviews/:reviewId/report` | Signale une revue |
| GET | `/api/moderation/pending` | Récupère les revues en attente de modération (admin) |
| GET | `/api/moderation/history` | Récupère l'historique des modérations (admin) |
| POST | `/api/moderation/reviews/:reviewId/moderate` | Modère une revue (admin) |

## Utilisation

### Création d'une revue

```javascript
// Exemple de requête pour créer une revue
const createReview = async (routeId, rating, comment) => {
  try {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        route: routeId,
        rating,
        comment
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la création de la revue:', error);
    throw error;
  }
};
```

### Récupération des revues pour une route

```javascript
// Exemple de requête pour récupérer les revues d'une route
const getRouteReviews = async (routeId) => {
  try {
    const response = await fetch(`/api/reviews/routes/${routeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des revues:', error);
    throw error;
  }
};
```

### Signalement d'une revue

```javascript
// Exemple de requête pour signaler une revue
const reportReview = async (reviewId, reason) => {
  try {
    const response = await fetch(`/api/moderation/reviews/${reviewId}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        reason
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Erreur lors du signalement de la revue:', error);
    throw error;
  }
};
```

## Bonnes pratiques

### Pour les développeurs

1. **Validation des données** : Toujours valider les entrées utilisateur côté client et serveur
2. **Gestion des erreurs** : Implémenter une gestion d'erreurs robuste pour toutes les opérations
3. **Caching** : Utiliser le service de cache pour optimiser les performances des requêtes fréquentes
4. **Sécurité** : Vérifier les autorisations avant toute opération de modification
5. **Tests** : Écrire des tests unitaires et d'intégration pour toutes les fonctionnalités

### Pour les administrateurs

1. **Modération** : Traiter rapidement les revues signalées pour maintenir la qualité du contenu
2. **Cohérence** : Appliquer les règles de modération de manière cohérente
3. **Feedback** : Fournir un feedback clair aux utilisateurs dont les revues ont été modérées
4. **Surveillance** : Surveiller les tendances dans les signalements pour identifier les problèmes systémiques

## Évolutions futures

1. **Réponses aux revues** : Permettre aux propriétaires de routes ou aux administrateurs de répondre aux revues
2. **Mentions "utile"** : Permettre aux utilisateurs de marquer les revues comme utiles
3. **Photos dans les revues** : Ajouter la possibilité d'inclure des photos dans les revues
4. **Revues vérifiées** : Marquer les revues des utilisateurs ayant effectivement parcouru la route
5. **Analyse de sentiment** : Utiliser l'IA pour analyser le sentiment des revues et détecter automatiquement le contenu inapproprié

## Dépannage

### Problèmes courants

1. **La revue n'apparaît pas** : Vérifier que la revue n'a pas été masquée par la modération automatique
2. **Erreur lors de la création d'une revue** : Vérifier que tous les champs requis sont remplis correctement
3. **Impossible de modifier une revue** : Vérifier que l'utilisateur est bien l'auteur de la revue

### Support

Pour toute question ou problème concernant le système de revues, contacter l'équipe de support à support@euro-cycling-dashboard.eu.
