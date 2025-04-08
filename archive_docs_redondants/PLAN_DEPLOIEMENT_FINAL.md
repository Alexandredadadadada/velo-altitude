# Plan de déploiement final Velo-Altitude

## 1. Préparation au déploiement

### Liste des vérifications techniques
- Vérifier le système d'authentification unifié Auth0 + fallback d'urgence
- Tester les trois scénarios d'authentification documentés
- Valider la présence de tous les fichiers de secours d'authentification
- Vérifier les variables d'environnement requises pour Auth0 et les autres APIs
- Valider la configuration Netlify dans le fichier netlify.toml

### Vérification des fonctionnalités critiques
- Connexion/déconnexion via Auth0 (standard)
- Basculement automatique vers le mode d'urgence si nécessaire
- Navigation entre les modules principaux
- Intégration des APIs externes (Strava, Mapbox, OpenWeather)
- Optimisations de performance et chargement progressif

#### Vérifications spécifiques au module Nutrition
- Vérifier les formulaires d'entrée du journal alimentaire (`src/components/nutrition/journal/FoodEntryForm.tsx`)
- Tester l'affichage des plans nutritionnels et des recettes (`src/pages/nutrition/plans/[id].tsx`, `src/pages/nutrition/recettes/[id].tsx`)
- Valider le fonctionnement du calculateur de macronutriments (`src/pages/nutrition/MacroCalculator.js`)
- Vérifier la synchronisation entre données d'entraînement et recommandations nutritionnelles (`src/components/nutrition/journal/NutritionTrainingSync.tsx`)
- Tester le dashboard nutritionnel et s'assurer que toutes les données sont correctement affichées (`src/pages/nutrition/dashboard.tsx`)
- Valider l'affichage des graphiques de tendances (`src/components/nutrition/journal/NutritionTrends.tsx`)

### Configuration des secrets Netlify
Copier de `netlify/netlify.env.example` vers `netlify/netlify.env`:
```
NETLIFY_AUTH_TOKEN=xxx
NETLIFY_SITE_ID=xxx
```

## 2. Processus de déploiement (Script automatisé)

Le script de déploiement `scripts/deploy-complete.js` gère automatiquement:

1. **Préparation de l'environnement**
   - Configuration des variables d'environnement
   - Installation des dépendances nécessaires
   - Optimisation des assets

2. **Construction du bundle optimisé**
   - Commande: `CI=false npm run build`
   - Désactivation des avertissements ESLint pour le build
   - Génération des assets statiques optimisés

3. **Post-processing**
   - Copie des fichiers d'authentification d'urgence dans le dossier de build
   - Ajout du fichier _redirects pour le routage SPA
   - Optimisation des assets statiques (images, JS, CSS)

4. **Déploiement sur Netlify**
   - Utilisation de l'API Netlify pour déployer le site
   - Application des variables d'environnement de production
   - Configuration des headers de sécurité

## 3. Procédure de déploiement pas à pas

### Procédure manuelle (si le script automatisé échoue)

1. **Préparation du build**
   ```bash
   cd c:\Users\busin\CascadeProjects\grand-est-cyclisme-website-final (1) VERSION FINAL
   npm install
   ```

2. **Configuration des variables d'environnement**
   ```bash
   set DISABLE_ESLINT_PLUGIN=true
   set CI=false
   set NODE_VERSION=20.10.0
   set NPM_VERSION=9.8.0
   ```

3. **Build de l'application**
   ```bash
   npm run build
   ```

4. **Post-processing manuel**
   ```bash
   cp public/auth-override.js build/
   cp public/emergency-login.html build/
   cp public/emergency-dashboard.html build/
   cp public/auth-diagnostic.js build/
   cp public/_redirects build/
   ```

5. **Déploiement via Netlify CLI**
   ```bash
   netlify deploy --prod --dir=build
   ```

## 4. Vérifications post-déploiement

### Tests d'authentification
1. Test de l'authentification Auth0 standard
   - Naviguer vers le site déployé
   - Cliquer sur "Connexion"
   - Vérifier que l'authentification Auth0 fonctionne
   - Vérifier l'accès aux zones protégées

2. Test du mécanisme de fallback
   - Simuler une erreur Auth0 (voir instructions dans TEST_AUTHENTICATION.md)
   - Vérifier le basculement automatique vers le mode d'urgence
   - Vérifier que l'interface utilisateur reste accessible

### Tests d'intégration des APIs
- Vérifier la connexion à Strava (synchronisation des activités)
- Valider le chargement des cartes Mapbox
- Confirmer la réception des données météo (OpenWeather)
- Tester les visualisations 3D (Three.js)
- Vérifier le fonctionnement de l'API Orchestrator pour les données nutritionnelles (`src/api/orchestration.ts`)
- Tester la récupération des plans nutritionnels et des recettes via l'API
- Valider la synchronisation des données d'entraînement avec le module nutrition

### Tests de la section Communauté
- Vérifier l'affichage et le filtre des forums thématiques 
- Tester la création de sujets et les réponses dans les forums
- Valider le partage d'itinéraires et la galerie associée
- Tester le système de classement et l'affichage des profils utilisateurs
- Vérifier la messagerie directe entre utilisateurs
- Tester les interactions sociales (likes, commentaires, partages)

### Tests du système de profil utilisateur
- Vérifier la fonctionnalité d'exportation des données personnelles dans différents formats (DataExportManager)
- Valider la synchronisation entre appareils et tester la connexion WebSocket (DeviceSyncManager)
- Tester l'intégration OAuth avec Strava et les autres services externes (ExternalServicesManager)
- Vérifier les filtres et visualisations de l'historique d'activités (ActivityHistory)
- Tester le chargement des données utilisateur et la navigation entre les onglets du profil (UserProfile)
- Valider la persistance des préférences utilisateur entre les sessions et les appareils
- Tester le flux de synchronisation bidirectionnel entre l'application et les services externes
- Vérifier les fonctionnalités de changement de thème et d'unités de mesure (PreferencesManager)
- Tester la modification et l'enregistrement des informations personnelles (PersonalInformation)
- Valider le téléchargement et la gestion des avatars utilisateur
- Vérifier l'enregistrement des statistiques cyclistes (FTP, FC, etc.)

### Tests de performance
- Exécuter Lighthouse sur les pages principales
- Valider les métriques Core Web Vitals
- Vérifier les temps de chargement initiaux
- Tester sur différents appareils et connexions

### Tests spécifiques des composants 3D
- Vérifier le fonctionnement du TextureManager avec différentes qualités de textures
- Tester l'adaptation automatique du composant ElevationViewer3D sur différents appareils
- Vérifier que la détection des capacités de l'appareil fonctionne correctement
- Tester le mode performance optimisé sur des appareils mobiles de différentes gammes
- Vérifier les performances FPS sur les différentes plateformes (mobile, tablette, desktop)
- S'assurer que les chargements progressifs des textures et modèles 3D fonctionnent correctement
- Valider le comportement adaptatif en cas de batterie faible sur appareils mobiles

## 5. Procédure de rollback (si nécessaire)

En cas de problème critique détecté après déploiement:

1. **Retour à une version précédente via Netlify**
   - Accéder au dashboard Netlify
   - Aller dans "Deploys" > Sélectionner un déploiement précédent
   - Cliquer sur "Publish deploy"

2. **Identification et correction des problèmes**
   - Analyser les logs et erreurs
   - Consulter la documentation TEST_AUTHENTICATION.md
   - Corriger les problèmes identifiés localement

3. **Redéploiement après correction**
   - Suivre à nouveau la procédure de déploiement complète
   - Effectuer les tests en priorité sur les fonctionnalités précédemment défaillantes

## Référence des variables d'environnement requises

```
# Auth0
AUTH0_AUDIENCE=
AUTH0_BASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_ISSUER_BASE_URL=
AUTH0_SCOPE=
AUTH0_SECRET=

# APIs externes
MAPBOX_TOKEN=
OPENWEATHER_API_KEY=
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_ACCESS_TOKEN=
STRAVA_REFRESH_TOKEN=
OPENROUTE_API_KEY=
CLAUDE_API_KEY=
OPENAI_API_KEY=

# Divers
REACT_APP_API_URL=
REACT_APP_BASE_URL=
REACT_APP_BRAND_NAME=
MONGODB_URI=
MONGODB_DB_NAME=
```

## Contact en cas de problème critique

Si des problèmes persistants sont détectés après déploiement, contacter immédiatement:
- Lead développeur: [CONTACT_EMAIL]
- Responsable architecture: [CONTACT_EMAIL]
- Administrateur Auth0: [CONTACT_EMAIL]
