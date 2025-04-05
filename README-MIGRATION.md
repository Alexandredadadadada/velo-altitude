# Migration vers Velo-Altitude

Ce document décrit le processus de migration du site Grand Est Cyclisme vers Velo-Altitude, incluant les changements de configuration, de domaine et les tests à effectuer.

## Modifications effectuées

### 1. Configuration du domaine

- ✅ Enregistrement du domaine `velo-altitude.com` via Netlify
- ✅ Configuration DNS pour `velo-altitude.com` et `www.velo-altitude.com`
- ✅ Configuration DNS pour `api.velo-altitude.com`
- ✅ SSL/TLS activé pour tous les domaines

### 2. Variables d'environnement

- ✅ `REACT_APP_BASE_URL` → `https://velo-altitude.com`
- ✅ `AUTH0_BASE_URL` → `https://velo-altitude.com`
- ✅ `REACT_APP_BRAND_NAME` → `Velo-Altitude`
- ✅ `REACT_APP_API_URL` → `https://api.velo-altitude.com`
- ✅ `AUTH0_AUDIENCE` → `https://api.velo-altitude.com`
- ✅ `AUTH0_ISSUER_BASE_URL` → `https://velo-altitude.eu.auth0.com`
- ✅ `MONGODB_DB_NAME` → `velo-altitude`

### 3. Redirections API

- ✅ Ajout d'une redirection `api.velo-altitude.com/*` vers `/.netlify/functions/:splat`
- ✅ Mise à jour de la politique de sécurité (CSP) pour inclure le nouveau domaine

### 4. Branding

- ✅ Création d'un fichier `branding.js` centralisé pour gérer tous les éléments de marque
- ✅ Mise à jour du nom du projet dans `package.json`

## Tests à effectuer

### Fonctionnalités générales

- [ ] Navigation générale du site
- [ ] Connexion/inscription (flow Auth0)
- [ ] Profil utilisateur (modification et sauvegarde)
- [ ] Fonctionnalités cartographiques (MapBox)

### Les 7 Majeurs

- [ ] Affichage des dénivelés et des cols
- [ ] Visualisation 3D des parcours
- [ ] Enregistrement des défis complétés

### Module d'entraînement

- [ ] Calculateur FTP avec ses 6 méthodes de calcul
  - [ ] Test 20 minutes
  - [ ] Test 60 minutes
  - [ ] Test Ramp
  - [ ] Test 8 minutes
  - [ ] Test 5 minutes
  - [ ] Seuil Lactate
- [ ] Affichage des zones d'entraînement (TrainingZoneChart)
- [ ] Sauvegarde des données FTP dans le profil utilisateur

### Module HIIT

- [ ] Affichage des templates d'entraînement HIIT
- [ ] Fonctionnement des générateurs d'intervalles
  - [ ] Fonction `generateLadderIntervals`
  - [ ] Fonction `generateOverUnderIntervals`
- [ ] Affichage correct des données dans HIITWorkoutCard
- [ ] Sauvegarde des entraînements HIIT

## Prochaines étapes

1. Optimisations de performance
   - [ ] Lazy loading des composants
   - [ ] Audit Lighthouse
   - [ ] Optimisation des images
   
2. Intégrations futures
   - [ ] Intégration complète avec Strava
   - [ ] Configurations avancées du serveur pour l'API

## Problèmes connus

*Aucun problème connu pour le moment. Veuillez documenter ici les problèmes identifiés lors des tests.*
