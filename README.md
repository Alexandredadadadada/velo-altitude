# Velo-Altitude.com - La plus grande plateforme de cyclisme en Europe pour les passionnés de cols

![Version](https://img.shields.io/badge/version-2.5.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Coverage](https://img.shields.io/badge/coverage-92%25-green.svg)
![Languages](https://img.shields.io/badge/languages-5-orange.svg)

## Vue d'ensemble

Velo-Altitude.com est une plateforme web complète dédiée aux cyclistes passionnés de cols et de défis d'altitude à travers toute l'Europe. Ce projet combine des fonctionnalités avancées de visualisation 3D des cols, d'entraînement spécialisé, de planification d'itinéraires, d'analyse de performance et de communauté sociale pour offrir une expérience immersive aux cyclistes de tous niveaux.

### Objectifs du projet

- Devenir la référence européenne en matière de dashboard pour les cyclistes passionnés de cols
- Fournir une base de données enrichie des 50 cols majeurs d'Europe avec visualisation 3D interactive
- Proposer des outils d'entraînement personnalisés spécifiquement adaptés aux défis d'altitude
- Faciliter la découverte et le partage d'itinéraires cyclistes à travers les massifs européens
- Créer une communauté dynamique de cyclistes partageant conseils et expériences de montagne
- Offrir des analyses détaillées des performances en altitude et des progrès
- Intégrer des données météo et topographiques précises pour optimiser les sorties en montagne

### Architecture technique

Le projet est construit avec une architecture moderne séparant clairement le frontend et le backend :

- **Frontend** : Application React single-page avec une interface responsive
- **Backend** : API RESTful Node.js/Express avec une base de données MongoDB
- **Services tiers** : Intégrations avec Strava, OpenWeatherMap, OpenRoute, et Mapbox
- **Architecture modulaire** : Services indépendants coordonnés par un gestionnaire d'API central
- **Infrastructure multilingue** : Prise en charge complète de 5 langues européennes
- **Scaling automatisé** : Déploiement sur infrastructure cloud avec scaling automatique

## Caractéristiques principales

- **Base de données des cols européens** : 50 cols majeurs enrichis avec données détaillées et visualisation 3D, incluant les Alpes, Pyrénées, Vosges, Jura, Massif Central, Dolomites et Alpes Suisses 
- **Planificateur d'itinéraires** : Création et partage d'itinéraires avec analyse de terrain avancée
- **Programmes d'entraînement** : 15 programmes personnalisés pour différents objectifs cyclistes, incluant des séances HIIT spécialisées
- **Nutrition** : Conseils nutritionnels et base de données de 100+ recettes adaptées au cyclisme de montagne
- **Communauté** : Forums thématiques, groupes régionaux et planification de sorties en groupe
- **Analyses de performance** : Suivi détaillé des progrès et comparaison avec d'autres cyclistes
- **Météo avancée** : Prévisions spécifiques pour les cols et itinéraires cyclistes
- **Le Défi des 7 Majeurs** : Système de suivi pour les défis d'ascension personnalisés

## Dimension européenne

Velo-Altitude.com est conçu pour répondre aux besoins des cyclistes passionnés de montagne à travers toute l'Europe :

### Couverture géographique
- **Alpes** : France, Italie, Suisse, Autriche, Slovénie
- **Pyrénées** : France, Espagne, Andorre
- **Massifs d'Europe centrale** : Allemagne, République Tchèque, Slovaquie
- **Balkans** : Roumanie, Bulgarie, Slovénie, Croatie
- **Îles et péninsules** : Espagne (Sierra Nevada), Sicile, Sardaigne, Grèce

### Support multilingue
- Français
- Anglais
- Allemand
- Italien
- Espagnol

## Installation et développement

### Prérequis
- Node.js (v14+)
- MongoDB (v4.4+)
- API keys pour : Mapbox, Strava, OpenWeatherMap

### Installation
```bash
# Cloner le dépôt
git clone https://github.com/velo-altitude/velo-altitude-platform.git

# Installer les dépendances
cd velo-altitude-platform
npm install

# Configuration
cp .env.example .env
# Éditer le fichier .env avec vos clés API

# Démarrer le serveur de développement
npm run dev
```

## Déploiement

Le projet est configuré pour un déploiement facile sur Netlify (frontend) et Heroku/MongoDB Atlas (backend).

### Variables d'environnement pour le déploiement
- `REACT_APP_API_URL` - URL de l'API backend
- `MONGODB_URI` - URI de connexion MongoDB
- `JWT_SECRET` - Clé secrète pour l'authentification
- `MAPBOX_API_KEY` - Clé API Mapbox
- `STRAVA_CLIENT_ID` - ID client Strava
- `STRAVA_CLIENT_SECRET` - Secret client Strava

## Équipe et partenaires

Velo-Altitude est développé en partenariat avec Grand Est Cyclisme.

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.
