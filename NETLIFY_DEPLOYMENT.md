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
- `REDIS_HOST` - Hôte Redis pour le cache
- `REDIS_PORT` - Port Redis
- `REDIS_PASSWORD` - Mot de passe Redis
- `REDIS_CLUSTER_NODES` - Liste des nœuds du cluster Redis (optionnel)

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

### Stratégies de Cache par Domaine
- **Nutrition**: TTL long, priorité à la cohérence
- **Météo**: TTL court, priorité à la disponibilité
- **Explorateur**: Cache géospatial, stratégies par région
- **Auth**: TTL court, haute sécurité

## Processus de Déploiement

### 1. Préparation (✅ COMPLÉTÉ - 100%)
- ✅ Finaliser tous les modules à 100%
  - ✅ Module Nutrition complété (40 recettes fonctionnelles)
  - ✅ Module Entraînement avec calculateur FTP (6 méthodes)
  - ✅ Module HIIT avec validation robuste
  - ✅ Système de cache météo pour l'Explorateur de Cols
  - ✅ Gestion du mode hors ligne pour l'Explorateur de Cols
  - ✅ Mise en œuvre complète du Redis Cluster avec sharding
  - ✅ Optimisation des intégrations externes (Strava, OpenWeatherMap)
  - ✅ Rotation des JWT pour la sécurité
- ✅ Valider la configuration webpack
- ✅ Préparer les données initiales pour MongoDB (100% complété)

### 2. Déploiement Initial sur Netlify
- Connecter le projet GitHub à Netlify
- Configurer les variables d'environnement
- Déclencher le build initial

### 3. Vérification sur Preview
- Tester toutes les fonctionnalités dans l'environnement de preview
- Vérifier les intégrations API
- Valider l'authentification
- Tester sur différents appareils
- Vérifier le fonctionnement du cache et du mode hors ligne

### 4. Déploiement en Production
- Promouvoir le déploiement de preview à la production
- Connecter le domaine personnalisé
- Activer HTTPS

### 5. Validation Post-Déploiement
- Exécuter les tests automatisés sur la production
- Vérifier les analytics et la performance
- Surveiller les logs d'erreurs
- Tester le système de cache et le mode hors ligne en production

## Checklist Pré-Déploiement

### Frontend
- [x] Bundle webpack optimisé
- [x] Assets compressés et optimisés
- [x] Polyfills pour navigateurs plus anciens
- [x] Lighthouse score > 90
- [x] Module Nutrition testé en environnement de production
- [x] Images des recettes optimisées avec ResponsiveImage
- [x] Système de cache météo implémenté et testé
- [x] Gestion du mode hors ligne implémentée et testée

### Backend (Netlify Functions)
- [x] Toutes les Functions implémentées et testées
- [x] Gestion des erreurs robuste
- [x] Validation des entrées
- [x] Tests des limites de timeout (10 secondes max)
- [x] Fonction col-weather.js implémentée pour les données météo
- [x] Service explorerCacheService.js implémenté
- [x] Service externalIntegration.js optimisé avec stratégies de fallback
- [x] Redis Cluster configuré avec sharding

### Données
- [x] MongoDB Atlas configuré et peuplé
- [x] Sauvegardes configurées
- [x] Indexes créés pour les requêtes fréquentes
- [x] Recettes nutritionnelles complètes importées (40 recettes)
- [x] Données des profils utilisateurs avec préférences alimentaires

### Sécurité
- [x] Auth0 correctement configuré
- [x] Headers de sécurité configurés
- [x] Validation des tokens JWT
- [x] Rate limiting configuré
- [x] Rotation des JWT implémentée
- [x] Stratégie de blacklisting des tokens

## Critères "Prêt pour Déploiement"

Pour qu'un module soit considéré comme prêt pour le déploiement, il doit satisfaire les critères suivants :

### Critères Généraux
1. **Fonctionnalité complète à 100%**
   - Toutes les user stories implémentées
   - Absence de fonctions "stub" ou temporaires
   - Documentation utilisateur complète

2. **Tests exhaustifs**
   - Tests unitaires pour les composants critiques
   - Tests d'intégration pour les flux principaux
   - Tests de performance pour les opérations coûteuses

3. **Optimisation**
   - Code minifié et optimisé
   - Chargement à la demande (lazy loading) implémenté
   - Temps de chargement < 2 secondes sur connexion 4G
   - Gestion du mode hors ligne pour les fonctionnalités critiques

### Critères Spécifiques par Module

#### Module Nutrition (✅ COMPLÉTÉ)
- ✅ 40 recettes fonctionnelles (10 par catégorie)
- ✅ Système de filtrage et recherche opérationnel
- ✅ Calcul nutritionnel précis
- ✅ Adaptation aux préférences alimentaires
- ✅ Interface utilisateur responsive
- ✅ Templates de recettes pour les différentes phases d'effort
- ✅ Optimisation des images avec ResponsiveImage
- ✅ Cache Redis avec stratégie stale-while-revalidate

#### Module Entraînement (✅ COMPLÉTÉ)
- ✅ Calculateur FTP avec 6 méthodes fonctionnelles
- ✅ Visualisation des zones d'entraînement
- ✅ Intégration avec le profil utilisateur
- ✅ Module HIIT avec validation des paramètres
- ✅ Plans d'entraînement personnalisés
- ✅ Optimisation des requêtes d'agrégation

#### Explorateur de Cols (✅ COMPLÉTÉ)
- ✅ API météo finalisée avec système de cache
- ✅ Gestion du mode hors ligne implémentée
- ✅ Données des 50 cols européens complètes
- ✅ Système de recherche et filtrage
- ✅ Visualisation cartographique
- ✅ Profils d'élévation interactifs
- ✅ Visualisation 3D optimisée pour mobile
- ✅ Cache géospatial pour les recherches par région
- ✅ Optimisation des appels d'API externes avec fallbacks

## Plan de Déploiement Progressif

Notre stratégie de déploiement suivra ces étapes :

1. **Phase 1: Déploiement en Preview (J+0)**
   - Déploiement de tous les composants
   - Tests fonctionnels approfondis
   - Ajustements de dernière minute

2. **Phase 2: Pré-production avec données réelles (J+1)**
   - Déploiement dans un environnement identique à la production
   - Importation des données réelles
   - Tests de charge et de performance
   - Validation de la sécurité et de l'authentification

3. **Phase 3: Déploiement en Production (J+2)**
   - Déploiement progressif par région
   - Surveillance étroite des métriques
   - Équipe support en alerte

4. **Phase 4: Optimisation Post-Déploiement (J+3 à J+7)**
   - Analyse des performances réelles
   - Ajustement des paramètres de cache
   - Optimisation basée sur les patterns d'utilisation
   - Résolution des problèmes identifiés
