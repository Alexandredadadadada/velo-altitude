# Guide de Déploiement Velo-Altitude

## Prérequis

- Node.js v20.10.0 et npm v9.8.0 (versions requises)
- Compte Netlify pour le déploiement
- Variables d'environnement configurées (voir ci-dessous)

## Configuration des Variables d'Environnement

Toutes les variables suivantes doivent être configurées dans le panneau d'administration Netlify:

### Authentification (Auth0)
- AUTH0_AUDIENCE
- AUTH0_BASE_URL
- AUTH0_CLIENT_ID
- AUTH0_CLIENT_SECRET
- AUTH0_ISSUER_BASE_URL
- AUTH0_SCOPE
- AUTH0_SECRET

### Cartographie
- MAPBOX_TOKEN

### Intégration Strava
- STRAVA_CLIENT_ID
- STRAVA_CLIENT_SECRET
- STRAVA_ACCESS_TOKEN
- STRAVA_REFRESH_TOKEN

### API Météo
- OPENWEATHER_API_KEY
- OPENROUTE_API_KEY
- WINDY_PLUGINS_API

### IA et Recommandations
- OPENAI_API_KEY
- CLAUDE_API_KEY

### Base de Données
- MONGODB_URI
- MONGODB_DB_NAME

### Configuration Application
- REACT_APP_API_URL
- REACT_APP_BASE_URL
- REACT_APP_VERSION
- REACT_APP_BRAND_NAME
- REACT_APP_ENABLE_ANALYTICS

### Sécurité
- API_KEYS_ENCRYPTION_KEY
- SESSION_SECRET

## Architecture Backend Optimisée

Le backend de Velo-Altitude a été optimisé avec plusieurs services clés :

1. **Cache Service** : Cache mémoire avancé avec TTL, éviction LRU et segmentation pour l'optimisation des performances de l'API
2. **Database Manager** : Gestionnaire de connexion MongoDB pour une gestion efficace des connexions et une surveillance des requêtes
3. **Security Middleware** : Protection complète avec limitation de débit, validation des entrées et en-têtes de sécurité
4. **Authentication Middleware** : Vérification JWT avec liste noire de tokens et contrôle d'accès basé sur les rôles
5. **Monitoring Service** : Suivi des performances en temps réel, journalisation des erreurs et collecte de métriques système
6. **API Router** : Routage centralisé avec fonctionnalités de sécurité avancées et gestion structurée des erreurs
7. **Strava Integration** : Intégration améliorée avec cache optimisé, gestion des erreurs et gestion des tokens
8. **Weather Service** : Récupération optimisée des données météo avec cache avancé pour les itinéraires cyclistes

## Processus de Déploiement

### 1. Déploiement Local (Test)

```bash
# Installation des dépendances
npm install

# Lancer en mode développement
npm start

# Exécuter les tests
npm test

# Vérifier la qualité du code
npm run lint

# Analyser les bundles webpack
ANALYZE=true npm run build
```

### 2. Déploiement sur Netlify

```bash
# Installation de Netlify CLI
npm install netlify-cli -g

# Connexion à Netlify
netlify login

# Build du projet
npm run build

# Déploiement manuel (optionnel)
netlify deploy --prod --dir=build
```

### 3. Déploiement Automatique (CI/CD)

Le projet est configuré pour un déploiement automatique via GitHub:

1. Toute modification sur la branche `main` déclenche un build et un déploiement
2. Les pull requests créent des environnements de preview

## Fonctionnement du Script Post-Déploiement

Le script `deploy-complete.js` est exécuté automatiquement après chaque build réussi sur Netlify. Il effectue les actions suivantes :

1. Crée et configure les fichiers d'environnement nécessaires au fonctionnement de l'application
2. Copie les fichiers d'authentification d'urgence pour garantir l'accès en cas de problème avec Auth0
3. Crée un fichier de configuration runtime accessible par l'application
4. Vérifie la présence des variables d'environnement requises
5. Modifie le fichier `index.html` pour inclure le script de configuration runtime

## Vérification Post-Déploiement

Après chaque déploiement, vérifier les éléments suivants:

1. Authentification fonctionne correctement
2. Visualisation des cartes et des cols est opérationnelle
3. Intégration avec Strava fonctionne
4. Système météo affiche les prévisions pour les cols
5. Les défis "7 Majeurs" peuvent être créés et suivis
6. Le système d'entraînement et de nutrition fonctionne
7. Les mécanismes de cache API fonctionnent correctement

## Gestion des Erreurs Courantes

### Problèmes d'Authentification Auth0
- Vérifier que les URL de callback sont correctement configurées dans la console Auth0
- Confirmer que AUTH0_AUDIENCE et AUTH0_SCOPE sont correctement paramétrés
- Vérifier le fonctionnement du système d'authentification d'urgence

### Problèmes d'Affichage des Cartes
- Vérifier que le MAPBOX_TOKEN est valide 
- Confirmer que l'API Mapbox n'a pas atteint sa limite de requêtes

### Problèmes d'Intégration Strava
- Vérifier la validité des tokens
- Rafraîchir le token si nécessaire via l'interface d'administration
- Vérifier le fonctionnement du cache Strava

### Problèmes de Cache API
- Vérifier les logs du serveur pour identifier les problèmes de cache
- Utiliser l'endpoint `/api/cache/stats` pour obtenir des informations sur l'état du cache
- Si nécessaire, purger le cache via l'endpoint `/api/cache/clear`

## Optimisation des Performances

Les builds de production incluent:
- Configuration webpack optimisée avec gestion spécifique des assets statiques
- Système de cache avancé avec TTL et segmentation par type de données
- Compression Brotli (activée via ENABLE_BROTLI_COMPRESSION)
- Mise en cache des assets (configurée via headers Netlify)
- Lazy loading des composants lourds comme la visualisation 3D
- SEO technique optimisé avec meta tags et données structurées Schema.org

## SEO et Données Structurées

Velo-Altitude utilise des balises SEO et des données structurées pour améliorer le référencement :

1. **Meta Tags** : Chaque page utilise react-helmet pour définir des balises meta uniques et pertinentes
2. **Données Structurées** : Implémentation de Schema.org au format JSON-LD pour :
   - Pages de cols (SportsActivityLocation/Mountain)
   - Itinéraires cyclistes (Trip)
3. **Sitemap et Robots.txt** : Générés automatiquement et configurés pour une indexation optimale

## URLs et Redirections

La structure d'URL a été standardisée selon le schéma suivant :
- `/cols/:country/:slug` - Pages de détail des cols
- `/entrainement/:level/:slug` - Programmes d'entraînement
- `/nutrition/:category/:slug` - Plans nutritionnels
- `/visualisation-3d/:country/:slug` - Visualisations 3D des itinéraires
