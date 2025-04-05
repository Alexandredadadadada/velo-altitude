# Checklist de déploiement - Dashboard-Velo.com

Ce document fournit une liste de vérification complète pour préparer le déploiement final du site Dashboard-Velo.com sur Netlify.

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

## 3. Scripts de vérification et de déploiement

Les scripts suivants ont été créés pour faciliter le déploiement :

- `scripts/prepare-netlify-deployment.js` - Script principal de préparation au déploiement
- `scripts/verify-all-api-keys.js` - Vérifie toutes les clés API
- `scripts/verify-api-integrations.js` - Teste la connectivité avec les API externes
- `scripts/verify-client-api-keys.js` - Vérifie les clés API côté client
- `scripts/generate-client-env.js` - Génère le fichier `.env.local` pour le client React
- `scripts/run-api-keys-manager.js` - Exécute le gestionnaire de clés API
- `scripts/test-application-features.js` - Teste les fonctionnalités de l'application

## 4. Procédure de déploiement Netlify

1. Exécuter le script de préparation au déploiement :
   ```
   node scripts/prepare-netlify-deployment.js
   ```

2. Vérifier le rapport de préparation au déploiement généré dans `deployment-report/deployment-preparation-report.html`

3. Résoudre tous les problèmes identifiés dans le rapport

4. Tester les fonctionnalités de l'application :
   ```
   node scripts/test-application-features.js
   ```

5. Vérifier le rapport de test des fonctionnalités généré dans `application-features-test-report.html`

6. Création du déploiement sur Netlify :
   - Connecter le dépôt GitHub à Netlify
   - Configurer les paramètres de build dans `netlify.toml`
   - Ajouter les variables d'environnement dans le tableau de bord Netlify

7. Vérifier le déploiement de prévisualisation (preview)

8. Promouvoir le déploiement en production

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
