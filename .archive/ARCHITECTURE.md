# Architecture - Grand Est Cyclisme

## 1. Structure du projet

Le projet Grand Est Cyclisme est organisé selon une architecture client-serveur moderne :

```
grand-est-cyclisme/
├── client/                # Application frontend React
│   ├── public/            # Ressources statiques
│   └── src/               # Code source frontend
├── server/                # API backend Node.js
│   ├── config/            # Configurations
│   ├── controllers/       # Contrôleurs API
│   ├── middleware/        # Middleware Express
│   ├── models/            # Modèles de données
│   ├── routes/            # Routes API
│   ├── services/          # Services métier
│   └── utils/             # Utilitaires
└── .env                   # Configuration des variables d'environnement
```

## 2. Architecture backend

### 2.1 Gestion des dépendances circulaires

L'application utilise un système de registre de services centralisé dans `api-manager.service.js`. Pour éviter les problèmes de dépendances circulaires, nous avons implémenté une technique d'importation différée :

```javascript
// Dans les services qui ont besoin d'api-manager
// Import différé pour éviter la dépendance circulaire
let apiManager;
setTimeout(() => {
  apiManager = require('./api-manager.service');
}, 0);
```

Cette approche permet de :
- Résoudre les dépendances circulaires entre les services
- Maintenir une architecture orientée service propre
- Faciliter l'enregistrement des services auprès du gestionnaire API central

Les services implémentant cette approche :
- `weather.service.js`
- `strava.service.js`
- `openroute.service.js`

### 2.2 Gestionnaire d'API central

Le fichier `api-manager.service.js` fournit une gestion centralisée pour toutes les API externes :

- **Rotation des clés API** : Permet d'alterner entre plusieurs clés API
- **Gestion des erreurs** : Implique des stratégies de retry avec backoff exponentiel
- **Rate limiting** : Évite de dépasser les quotas d'API
- **Mise en cache** : Optimise les performances et réduit les appels API
- **Monitoring** : Suit la consommation et les performances des API

### 2.3 Système de cache

L'application utilise une stratégie de cache à deux niveaux :

- **Backend** : Cache Redis pour les données partagées entre utilisateurs avec fallback sur NodeCache
- **Frontend** : Cache localStorage pour optimiser l'expérience utilisateur entre les sessions

## 3. Architecture frontend

### 3.1 Structure de l'application React

L'application frontend est structurée selon une architecture modulaire :

- **pages/** : Composants de page de haut niveau
- **components/** : Composants réutilisables
- **context/** : Providers de contexte React (Auth, Theme, etc.)
- **hooks/** : Hooks React personnalisés
- **services/** : Services d'intégration avec le backend
- **utils/** : Utilitaires et helpers

### 3.2 Système de routage

Le routage est géré via React Router avec une structure hiérarchique :

```jsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/cols/*" element={<ColsExplorer />} />
  <Route path="/training/*" element={<TrainingDashboard />} />
  <!-- Routes supplémentaires -->
</Routes>
```

## 4. Intégrations API externes

L'application s'intègre avec plusieurs API externes :

- **OpenWeatherMap** : Données météo
- **Mapbox** : Cartographie
- **OpenRouteService** : Calcul d'itinéraires
- **Strava** : Activités cyclistes et données d'entraînement
- **OpenAI** : Assistants IA pour les recommandations

## 5. Sécurité

- Toutes les clés API sont stockées dans le fichier `.env` et non dans le code
- Validation des clés API au démarrage du serveur
- Stratégies de fallback en cas d'échec d'API
- Gestion sécurisée des tokens utilisateur (Strava OAuth)

## 6. Performance et scalabilité

- Préchargement des données fréquemment utilisées
- Purge automatique des caches périmés
- Optimisation des images et assets
- Lazy loading des composants React
- Compression gzip pour les ressources servies

## 7. Best practices

- Utilisation du typage fort avec JSDoc
- Tests unitaires et intégration
- Structured logging pour le debugging
- Documentation complète du code
- Gestion des erreurs cohérente
