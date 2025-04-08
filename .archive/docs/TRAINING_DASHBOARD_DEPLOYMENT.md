# Guide de Déploiement du Dashboard d'Entraînement

Ce document détaille les étapes nécessaires pour déployer et configurer le Dashboard d'Entraînement de Velo-Altitude sur votre environnement Netlify.

## Table des matières

1. [Prérequis](#prérequis)
2. [Structure des fichiers](#structure-des-fichiers)
3. [Configuration des variables d'environnement](#configuration-des-variables-denvironnement)
4. [Intégration avec les API externes](#intégration-avec-les-api-externes)
5. [Étapes de déploiement](#étapes-de-déploiement)
6. [Vérifications post-déploiement](#vérifications-post-déploiement)
7. [Troubleshooting](#troubleshooting)

## Prérequis

- Compte Netlify avec accès administrateur
- Accès au repository GitHub du projet
- Environnement Node.js v16+ pour les tests locaux
- Accès aux clés API pour les services externes (Strava, OpenWeather, etc.)

## Structure des fichiers

Le Dashboard d'Entraînement est structuré comme suit:

```
client/
├── src/
│   ├── components/
│   │   ├── training/
│   │   │   ├── TrainingDashboard.jsx         # Composant principal
│   │   │   ├── EnhancedTrainingZones.jsx     # Visualisation des zones
│   │   │   ├── charts/
│   │   │   │   └── OptimizedZoneChart.jsx    # Graphiques optimisés
│   │   │   ├── simulators/
│   │   │   │   ├── ColTrainingSimulator.jsx  # Simulateur principal
│   │   │   │   └── simulator-steps/          # Étapes du simulateur
│   │   │   │       ├── ColSelectionStep.jsx
│   │   │   │       ├── FitnessAssessmentStep.jsx
│   │   │   │       ├── WorkoutGenerationStep.jsx
│   │   │   │       └── SimulationResultsStep.jsx
│   │   │   └── animations/
│   │   │       └── ExerciseAnimation.jsx     # Animations d'exercices
│   │   └── dashboard/
│   │       └── TodayTrainingWidget.jsx       # Widget pour la page d'accueil
│   ├── utils/
│   │   └── OptimizedVisualizationLoader.js   # Utilitaire d'optimisation
│   ├── pages/
│   │   └── TrainingPage.jsx                  # Page conteneur
│   └── AppRouter.jsx                         # Routage de l'application
```

## Configuration des variables d'environnement

Les variables d'environnement suivantes doivent être configurées dans Netlify:

| Variable | Description | Utilisée par |
|----------|-------------|--------------|
| `STRAVA_CLIENT_ID` | ID client pour l'API Strava | Import des données d'entraînement |
| `STRAVA_CLIENT_SECRET` | Secret client pour l'API Strava | Authentification Strava |
| `STRAVA_REFRESH_TOKEN` | Token de rafraîchissement Strava | Maintien de la connexion |
| `OPENWEATHER_API_KEY` | Clé pour l'API OpenWeather | Widget météo pour entraînement |
| `MAPBOX_TOKEN` | Token pour l'API Mapbox | Visualisation des itinéraires d'entraînement |
| `OPENAI_API_KEY` | Clé pour l'API OpenAI (optionnel) | Recommandations d'entraînement personnalisées |

### Configuration manuelle sur Netlify

1. Accédez au tableau de bord Netlify
2. Sélectionnez votre site
3. Naviguez vers **Site settings > Build & deploy > Environment variables**
4. Ajoutez chaque variable avec sa valeur correspondante

## Intégration avec les API externes

### Strava API

Le dashboard utilise l'API Strava pour:
- Importer les activités récentes
- Analyser les performances
- Partager les séances d'entraînement

Configuration requise:
1. Créez une application sur [Strava Developers](https://developers.strava.com/)
2. Ajoutez comme URL de redirection: `https://[VOTRE-DOMAINE]/auth/strava/callback`
3. Définissez les scopes: `activity:read_all,profile:read_all`
4. Utilisez les identifiants générés pour les variables d'environnement

### OpenWeather API

Les prévisions météo sont essentielles pour le planning d'entraînement:
1. Créez un compte sur [OpenWeather](https://openweathermap.org/api)
2. Souscrivez au plan "Current Weather Data"
3. Utilisez la clé API générée

## Étapes de déploiement

### 1. Préparation locale

```bash
# Vérifier que tout est prêt pour le déploiement
npm run build

# Tester localement
npm start
```

### 2. Configuration Netlify

Assurez-vous que ces paramètres sont configurés:

| Paramètre | Valeur |
|-----------|--------|
| Build command | `npm run build` |
| Publish directory | `build/` |
| Node version | 16.x |
| Functions directory | `netlify/functions` (pour les proxy API) |

### 3. Déploiement

#### Option 1: Déploiement automatique (recommandé)

1. Connectez votre repository GitHub à Netlify
2. Configurez le déploiement continu sur la branche `main`
3. Déclenchez un build manuel après avoir configuré les variables d'environnement

#### Option 2: Déploiement manuel

```bash
# Installer Netlify CLI
npm install netlify-cli -g

# Authentification
netlify login

# Déploiement
netlify deploy --prod
```

## Vérifications post-déploiement

Une fois le déploiement terminé, vérifiez les points suivants:

1. **Accès au dashboard**: Naviguez vers `/training` et vérifiez que le dashboard se charge correctement
2. **Intégrations API**: Testez que les données météo et Strava s'affichent correctement
3. **Simulateur de cols**: Testez le processus complet de simulation d'entraînement
4. **Optimisation mobile**: Vérifiez le comportement responsive sur différents appareils
5. **Performance**: Exécutez un test Lighthouse pour vérifier les performances

Checklist de vérification:

- [ ] Chargement initial du dashboard en moins de 3 secondes
- [ ] Graphiques des zones d'entraînement fonctionnels
- [ ] Navigation entre les onglets fluide
- [ ] Données météo à jour et correctes
- [ ] Synchronisation avec Strava opérationnelle
- [ ] Simulateur de cols génère des programmes cohérents
- [ ] Visualisations interactives réactives au clic
- [ ] Affichage correct sur mobile et desktop

## Troubleshooting

### Problèmes d'authentification Strava

Si l'intégration Strava ne fonctionne pas:
1. Vérifiez les logs dans la console développeur
2. Assurez-vous que les tokens sont à jour (ils expirent après 6 heures)
3. Vérifiez que l'URL de redirection configurée chez Strava correspond exactement à celle utilisée

### Problèmes de performance

Si le dashboard est lent:
1. Vérifiez que Web Workers sont activés sur le navigateur client
2. Assurez-vous que la compression Brotli est activée dans Netlify
3. Vérifiez que les optimisations d'images sont en place

### Bugs d'affichage

Pour les problèmes d'UI:
1. Videz le cache du navigateur
2. Testez sur un autre navigateur
3. Vérifiez les versions des dépendances dans `package.json`

## Ressources additionnelles

- [Documentation du module d'entraînement](./FRONTEND_DESIGN_COMPLET.md#module-dentraînement)
- [API Strava pour développeurs](https://developers.strava.com/docs/reference/)
- [Optimisation des performances Netlify](https://docs.netlify.com/configure-builds/manage-dependencies/)

---

Document préparé par l'équipe Velo-Altitude | Dernière mise à jour: 6 avril 2025
