# Checklist de déploiement - Velo-Altitude (anciennement Dashboard-Velo.com)

Ce document fournit une liste de vérification complète pour finaliser le déploiement du site Velo-Altitude sur Netlify.

## État actuel du déploiement - 5 avril 2025

- [x] Rebranding de "Grand Est Cyclisme"/"Dashboard-Velo" vers "Velo-Altitude" 
- [x] Configuration initiale du compte Netlify
- [x] Connexion au repository GitHub
- [ ] Déploiement réussi en production

### Problème actuel identifié
Le déploiement via GitHub échoue avec l'erreur:
```
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory
```
Cause: Le dépôt GitHub ne reflète pas la structure locale avec le dossier `client/`.

## 1. Vérification des clés API

Toutes les clés API suivantes doivent être correctement configurées dans les variables d'environnement Netlify :

- [x] `MAPBOX_PUBLIC_TOKEN` - Pour l'affichage des cartes
- [x] `MAPBOX_SECRET_TOKEN` - Pour les fonctionnalités avancées de Mapbox
- [x] `OPENWEATHER_API_KEY` - Pour les données météo
- [x] `OPENROUTE_API_KEY` - Pour le calcul d'itinéraires
- [x] `STRAVA_CLIENT_ID` - Pour l'intégration Strava
- [x] `STRAVA_CLIENT_SECRET` - Pour l'authentification Strava
- [x] `OPENAI_API_KEY` - Pour le coach virtuel (OpenAI)
- [x] `CLAUDE_API_KEY` - Pour le coach virtuel (Claude)
- [x] `REACT_APP_BRAND_NAME=Velo-Altitude` - Nom de la marque
- [x] `REACT_APP_BASE_URL=https://velo-altitude.com` - URL de base
- [x] `REACT_APP_API_URL=https://api.velo-altitude.com` - URL de l'API

## 2. Configuration du cache

Le système de cache est configuré pour optimiser les performances API avec les durées suivantes :

- Routes environnementales : 30 minutes
- Routes de prédiction environnementale : 1 heure
- Routes d'estimation d'effort : 30 minutes
- Routes d'alerte météo : 15 minutes
- Détails des cols : 1 heure
- Segments des cols : 1 heure
- Points d'intérêt des cols : 1 heure
- Prévisions météo des cols : 15 minutes
- Itinéraires associés aux cols : 1 heure
- Cols similaires : 2 heures

## 3. Solutions de déploiement recommandées

### Option 1: Déploiement direct via ZIP (RECOMMANDÉ)
1. Générer un build local dans le dossier `client`:
   ```
   cd client
   npm install
   npm run build
   ```
2. Compresser le dossier `build` généré en fichier ZIP
3. Dans l'interface Netlify:
   - Aller à l'onglet "Deploys"
   - Utiliser la zone de glisser-déposer pour uploader le ZIP

### Option 2: Modification des paramètres Netlify
1. Dans "Site settings" > "Build & deploy" > "Build settings":
   - Définir "Base directory" sur `client`
   - Commander de build: `npm run build`
   - Publish directory: `build`
2. Déclencher un nouveau déploiement

### Option 3: Mise à jour du dépôt GitHub
1. Restructurer le dépôt pour qu'il corresponde à la structure locale
2. Pousser les modifications vers GitHub pour déclencher un build automatique

## 4. Vérification post-déploiement des modules clés

### Module d'entraînement
- [ ] Calculateur FTP fonctionnel avec les 6 méthodes:
  - [ ] Test 20 minutes
  - [ ] Test 60 minutes
  - [ ] Test Ramp
  - [ ] Test 8 minutes
  - [ ] Test 5 minutes
  - [ ] Seuil Lactate
- [ ] Visualisation des zones d'entraînement (TrainingZoneChart)
- [ ] Sauvegarde des données FTP dans le profil utilisateur

### Module HIIT
- [ ] Affichage des templates d'entraînement
- [ ] Fonctionnement des générateurs d'intervalles:
  - [ ] Fonction `generateLadderIntervals`
  - [ ] Fonction `generateOverUnderIntervals`
- [ ] Gestion des erreurs et validation robuste
- [ ] Affichage correct dans HIITWorkoutCard

### Les 7 Majeurs
- [ ] Affichage des dénivelés et des cols
- [ ] Visualisation 3D des parcours
- [ ] Enregistrement des défis complétés

### Explorateur de Cols
- [ ] Affichage des données météo pour chaque col
- [ ] Système de cache météo opérationnel
- [ ] Mode hors ligne fonctionnel

### Module Nutrition
- [ ] Affichage des 40 recettes optimisées
- [ ] Outil de calcul nutritionnel

## 5. Fonctionnalités à vérifier après déploiement

- [ ] Visualisation des cols avec profil d'élévation et code couleur
- [ ] Filtrage des cols par difficulté, région et caractéristiques
- [ ] Affichage des prévisions météo pour les cols
- [ ] Planification d'itinéraires avec calcul d'effort
- [ ] Intégration avec Strava pour importer les activités
- [ ] Fonctionnement du coach virtuel avec suggestions personnalisées
- [ ] Système de cache pour optimiser les performances
- [ ] Calculateur FTP avec les 6 méthodes de calcul (Test 20 min, Test 60 min, Test Ramp, Test 8 min, Test 5 min, Seuil Lactate)
- [ ] Visualisation des zones d'entraînement avec TrainingZoneChart
- [ ] Fonctionnement correct du module HIIT avec différents profils utilisateur
- [ ] Support multilingue dans toutes les sections (vérifier les 5 langues : fr, en, de, it, es)
- [ ] Module Nutrition complet :
  - [ ] Affichage des 40 recettes (10 par catégorie)
  - [ ] Filtrage par phase d'entraînement et préférences alimentaires
  - [ ] Calcul des valeurs nutritionnelles selon le profil utilisateur
  - [ ] Chargement des images des recettes
  - [ ] Fonctionnalité d'impression des recettes
  - [ ] Recommandations personnalisées selon le calendrier d'entraînement
- [ ] Exécution correcte des procédures de sauvegarde automatisées

## 6. Vérifications techniques supplémentaires

- [ ] Exécuter le script de vérification des traductions et résoudre les problèmes identifiés:
  ```
  node scripts/checkTranslations.js
  ```
- [ ] Vérifier les métriques de performance avec Lighthouse : 
  - [ ] Performance > 90
  - [ ] Accessibilité > 90
  - [ ] Meilleures pratiques > 90
  - [ ] SEO > 90
- [ ] Vérifier l'installation et la configuration des outils de monitoring selon MONITORING_PLAN.md
- [ ] Configurer les alertes pour les métriques critiques définies dans le plan de surveillance
- [ ] Tester les fonctionnalités sur différents navigateurs (Chrome, Firefox, Safari, Edge)
- [ ] Vérifier la réactivité sur mobile, tablette et desktop

## 7. Optimisations pour la production sur Netlify

- Mise en place du cache des ressources statiques via les en-têtes HTTP
- Configuration des redirections dans `netlify.toml`
- Configuration du CDN Netlify pour optimiser la distribution
- Activation du HTTPS avec Let's Encrypt
- Configuration des variables d'environnement pour la production
- Activation de la précharge des ressources critiques

## 8. Vérifications spécifiques au Module Nutrition

- [ ] Vérifier l'affichage et la fonctionnalité des nouvelles recettes :
  - [ ] 10 recettes petit-déjeuner
  - [ ] 10 recettes pré-entraînement 
  - [ ] 10 recettes pendant l'effort
  - [ ] 10 recettes post-entraînement
- [ ] Tester le filtrage par :
  - [ ] Type de repas
  - [ ] Difficulté de préparation
  - [ ] Préférences alimentaires (végétarien, vegan, sans gluten)
  - [ ] Phase d'entraînement recommandée
  - [ ] Type d'effort (endurance, haute intensité, etc.)
- [ ] Vérifier la précision des informations nutritionnelles
- [ ] Tester les fonctionnalités d'adaptation des portions selon le profil
- [ ] Vérifier le temps de chargement des images des recettes (optimisation)
- [ ] Tester la fonction de recherche de recettes par ingrédients
- [ ] Vérifier l'intégration avec le calendrier d'entraînement pour les recommandations

## 9. Notes importantes

- Assurez-vous que toutes les clés API ont des quotas suffisants pour la production
- Vérifiez régulièrement les quotas d'utilisation des API externes
- Configurez le monitoring des quotas API
- Vérifiez que les fonctions Netlify respectent les limites de temps d'exécution (10 secondes)

---

Document mis à jour le : 05/04/2025
