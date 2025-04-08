# Guide de Déploiement sur Netlify - Dashboard-Velo.com

Ce document détaille la stratégie et les étapes pour déployer Dashboard-Velo.com sur Netlify avec une fonctionnalité à 100%.

## Architecture de Déploiement

Nous utiliserons une architecture complète pour garantir toutes les fonctionnalités :

1. **Frontend React** : Déployé directement sur Netlify
2. **Backend API** : Implémenté via Netlify Functions 
3. **Base de données** : MongoDB Atlas (cluster dédié)
4. **Authentication** : Auth0 intégré
5. **Cache** : Redis Cluster avec sharding par domaine fonctionnel

## Configuration Netlify

### Fichier netlify.toml
Le fichier netlify.toml a été mis à jour avec les configurations optimisées suivantes :
- Build command et publish directory configurés
- Redirections pour SPA et API
- Headers de sécurité et cache
- Plugins pour l'optimisation des performances
- Variables d'environnement pour chaque contexte (production, preview, branch)
- Configuration CSP (Content Security Policy)

### Variables d'Environnement Requises
- `MONGODB_URI` - URI de connexion MongoDB Atlas
- `AUTH0_DOMAIN` - Domaine Auth0
- `AUTH0_CLIENT_ID` - ID client Auth0
- `AUTH0_AUDIENCE` - Audience API Auth0
- `JWT_SECRET` - Secret pour la validation des tokens
- `JWT_ROTATION_SECRET` - Secret pour la rotation des tokens JWT
- `MAPBOX_API_KEY` - Clé API Mapbox pour les cartes
- `REACT_APP_OPENROUTE_API_KEY` - Clé API OpenRoute pour les itinéraires
- `REACT_APP_OPENWEATHER_API_KEY` - Clé API OpenWeather pour les données météo
- `OPENAI_API_KEY` - Clé API OpenAI pour les chatbots
- `CLAUDE_API_KEY` - Clé API Claude pour les chatbots alternatifs
- `REDIS_HOST` - Hôte Redis pour le cache
- `REDIS_PORT` - Port Redis
- `REDIS_PASSWORD` - Mot de passe Redis
- `REDIS_CLUSTER_NODES` - Liste des nœuds du cluster Redis (optionnel)
- `GO_VERSION` - Réglé sur "skip" pour éviter l'installation inutile de Go 

## Structure des Netlify Functions

Nous devons implémenter les Functions suivantes pour remplacer notre API backend actuelle :

### Endpoints Prioritaires à Implémenter

1. **Routes API** :
   - `/api/routes/featured` → `netlify/functions/routes-featured.js`
   - `/api/routes/search` → `netlify/functions/routes-search.js`
   - `/api/routes/:id` → `netlify/functions/route-by-id.js`

2. **Module Nutrition** :
   - `/api/nutrition/recipes` → `netlify/functions/nutrition-recipes.js`
   - `/api/nutrition/calculate` → `netlify/functions/nutrition-calculate.js`

3. **Explorateur de Cols** :
   - `/api/cols/list` → `netlify/functions/cols-list.js`
   - `/api/cols/search` → `netlify/functions/cols-search.js`
   - `/api/cols/:id` → `netlify/functions/col-by-id.js`
   - `/api/cols/weather/:id` → `netlify/functions/col-weather.js`
   - `/api/cols/elevation` → `netlify/functions/cols-elevation.js` (NOUVEAU)
   - `/api/cols/region` → `netlify/functions/cols-region.js` (NOUVEAU)

4. **Module Social et Événements** :
   - `/api/events/upcoming` → `netlify/functions/events-upcoming.js`
   - `/api/news/latest` → `netlify/functions/news-latest.js`
   - `/api/social/posts` → `netlify/functions/social-posts.js`

5. **Authentification** :
   - `/api/auth/profile` → `netlify/functions/auth-profile.js`
   - `/api/auth/verify` → `netlify/functions/auth-verify.js`
   - `/api/auth/refresh` → `netlify/functions/auth-refresh.js` (NOUVEAU)

## MongoDB Atlas Configuration

### Structure des Collections
- `users` - Informations utilisateurs
- `routes` - Parcours cyclistes
- `cols` - Données des cols cyclistes
- `events` - Événements à venir
- `news` - Actualités cyclistes
- `nutrition_recipes` - Recettes nutritionnelles
- `training_programs` - Programmes d'entraînement
- `challenges` - Défis cyclistes personnalisés

### Configuration de la Base de Données
1. Créer un cluster dédié (M0 gratuit pour commencer)
2. Configurer Network Access pour Netlify
3. Créer un utilisateur de base de données avec privilèges limités
4. Importer les données depuis les fichiers JSON existants
5. Configurer le sharding pour les collections à haute charge

## Configuration Redis Cluster (NOUVEAU)

### Architecture du Cluster Redis
- Sharding par domaine fonctionnel:
  - `nutrition:` - Données nutritionnelles
  - `weather:` - Données météo
  - `explorer:` - Données d'exploration de cols
  - `auth:` - Données d'authentification

## Problèmes de Déploiement Résolus (05/04/2025)

### 1. Problème de Sous-module Git
**Symptôme** : Build échouant avec des erreurs liées au sous-module VELO-ALTITUDE  
**Solution** : Suppression de la référence au sous-module qui n'existait pas.

### 2. Problème de Script de Build pour Windows
**Symptôme** : Commande build échouant avec des erreurs car référençant `cmd.exe`  
**Solution** : Modification du script dans `package.json` pour utiliser une commande compatible avec l'environnement Unix de Netlify.
```json
"build": "npx webpack --config webpack.fix.js --mode production"
```

### 3. Problème de Dépendances webpack
**Symptôme** : Erreur `Cannot find module 'html-webpack-plugin'`  
**Solution** : Déplacement des dépendances webpack de `devDependencies` vers `dependencies` dans `package.json` pour qu'elles soient installées en environnement de production.

### 4. Problème d'Installation de Go
**Symptôme** : Build échouant avec des erreurs lors de l'installation de Go 1.19  
**Solution** : Ajout de la variable d'environnement `GO_VERSION=skip` pour éviter l'installation de Go qui n'est pas nécessaire pour le projet.

## Checklist de Vérification Post-Déploiement
- [ ] Fonctionnalité de visualisation 3D des cols
- [ ] Module "Les 7 Majeurs" 
- [ ] Chatbots OpenAI et Claude
- [ ] Intégration Mapbox
- [ ] Intégration OpenWeather
- [ ] Intégration OpenRouteService
- [ ] Intégration Strava (si configurée)
- [ ] Module Nutrition
- [ ] Module Entraînement
