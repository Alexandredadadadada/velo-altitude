# Velo-Altitude

 ![Logo Velo-Altitude](./public/images/header.jpg)

## Vision

Velo-Altitude se positionne comme la communauté de référence pour les cyclistes passionnés par les ascensions alpines.

## Objectifs

- Cartographier et documenter tous les cols européens
- Fournir des données météorologiques précises et personnalisées pour le cyclisme
- Créer une communauté engagée de passionnés de cyclisme alpin
- Offrir une expérience immersive via la visualisation 3D des cols

## Fonctionnalités

### Cartographie des cols

Nous développons une base de données complète des cols européens, avec:

- Profils d'élévation précis
- Données historiques et culturelles
- Images panoramiques
- Témoignages et conseils de cyclistes

### Données météorologiques

Notre plateforme intègre:

- Prévisions météorologiques spécifiques pour chaque col
- Alertes personnalisées
- Historique des conditions
- Recommandations adaptées

### Visualisation immersive

L'expérience Velo-Altitude est enrichie par:

- Visualisation 3D des cols et des itinéraires
- Intégration de données d'élévation réelles
- Simulation des conditions météorologiques
- Vue à 360° des points d'intérêt

### Communauté et défis

La dimension sociale est au cœur du projet:

- Profils cyclistes personnalisés
- Partage d'expériences et de photos
- Défis et compétitions amicales
- Rencontres et événements

## Fonctionnalités avancées

- **Analyse de performance** : Suivi détaillé des progrès et comparaison avec d'autres cyclistes
- **Météo avancée** : Prévisions spécifiques pour les cols et itinéraires cyclistes
- **Le Défi des 7 Majeurs** : Système de suivi pour les défis d'ascension personnalisés
- **Effets météorologiques avancés** : Système complet de visualisation météo avec pluie, neige, brouillard et orages

## Dimension européenne

Le projet couvre initialement:

- Les Alpes françaises, italiennes et suisses
- Les Pyrénées françaises et espagnoles
- Les massifs montagneux d'Allemagne et d'Autriche
- Les cols du Benelux et des pays scandinaves

## Volet environnemental

Velo-Altitude promeut:

- Le cyclisme comme moyen de transport écologique
- Le respect des espaces naturels
- La sensibilisation aux impacts du changement climatique sur les écosystèmes alpins
- Le tourisme durable en région montagneuse

## Plan de développement

### Phase 1 (Terminée)

- Conception de l'architecture technique
- Développement du système d'authentification
- Mise en place de la base de données initiale
- Intégration des APIs météorologiques

### Phase 2 (En cours)

- Enrichissement de la base de données des cols
- Développement des fonctionnalités de visualisation 3D
- Création des profils utilisateurs et du système de communauté
- Mise en place du système de défis

### Phase 3 (Planifiée)

- Lancement de l'application mobile
- Extension de la couverture géographique
- Partenariats avec organisateurs d'événements cyclistes
- Développement de fonctionnalités premium

## Déploiement sur Netlify

Pour déployer correctement l'application sur Netlify avec toutes ses fonctionnalités, suivez ces étapes :

1. **Configuration des variables d'environnement**

   Configurez les variables suivantes dans le dashboard Netlify (Settings > Build & Deploy > Environment) :

   - `MONGODB_URI` : URI de connexion à votre base MongoDB Atlas
   - `MONGODB_DBNAME` : Nom de la base de données (par défaut: velo-altitude)
   - `REACT_APP_AUTH0_DOMAIN` : Domaine Auth0
   - `REACT_APP_AUTH0_CLIENT_ID` : Client ID Auth0
   - `REACT_APP_AUTH0_AUDIENCE` : Audience API Auth0
   - `REACT_APP_MAPBOX_TOKEN` : Token Mapbox pour les cartes
   - `REACT_APP_OPENWEATHER_API_KEY` : Clé API OpenWeather

2. **Déploiement initial**

   Connectez votre dépôt GitHub à Netlify et configurez le site avec les paramètres suivants :
   
   - Build command: `npm ci && NODE_ENV=production CI=false npm run build:prod`
   - Publish directory: `build`

3. **Fonctions Netlify**

   Les fonctions Netlify dans le dossier `netlify/functions` gèrent les API pour :
   - Cols alpins (50 cols déjà importés dans MongoDB Atlas)
   - Météo (utilisant les différentes implémentations du service météo)
   - Nutrition (service refactorisé utilisant RealApiOrchestrator)
   - Authentification et autres services

4. **Architecture des services**

   L'application utilise une architecture hybride :
   - Services dans `client/src/services` et `src/services`
   - Visualisations 3D des cols dans les composants Three.js
   - Services refactorisés utilisant RealApiOrchestrator pour les opérations de données

5. **URLs de l'application**

   - Production: https://velo-altitude.netlify.app
   - Développement local: http://localhost:3000

6. **Mise à jour de l'application**

   Pour mettre à jour l'application après modifications :
   ```bash
   git add .
   git commit -m "Description des modifications"
   git push
   ```
   Netlify détectera automatiquement les changements et déploiera la nouvelle version.

## Structure des API

Les API sont organisées comme suit :

- `/api/cols/*` : Service des cols alpins (recherche, filtrage, données 3D)
- `/api/weather/*` : Service météo (conditions actuelles, prévisions, alertes)
- `/api/nutrition/*` : Service de nutrition (recommandations, produits)
- `/api/challenges/*` : Service des défis (Les 7 Majeurs)
- `/api/auth/*` : Service d'authentification

## Contact et contributions

Pour participer au projet ou obtenir plus d'informations:

- Email: contact@velo-altitude.com
- Twitter: @VeloAltitude
- GitHub: github.com/velo-altitude

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## Nouveautés (Avril 2025)

### Améliorations techniques et stabilité

- **Mise à jour des dépendances** : Retour à React 18.2.0 pour une stabilité et performance optimales
- **Compatibilité renforcée** : Résolution des conflits de dépendances pour une expérience fluide
- **Optimisation des performances** : Configuration ajustée pour une meilleure exécution sur tous les appareils
- **Support multiplateforme** : Compatibilité étendue avec les navigateurs modernes

### Système météorologique avancé

Notre tout nouveau système météorologique offre une expérience visuelle immersive :

- **Effets de précipitation réalistes** : pluie et neige simulées par particules avec comportement physique
- **Dynamique atmosphérique** : variations de brouillard, nuages et visibilité
- **Effets d'éclairage** : éclair, variation de luminosité selon les conditions
- **Calcul GPU optimisé** : performance maximale sur les appareils compatibles

### Adaptation automatique des performances

- Détection intelligente des capacités de votre appareil
- Ajustement dynamique de la qualité visuelle en fonction du FPS
- Bascule automatique entre calculs GPU et CPU
- Interface fluide sur tous les types d'appareils

### Contrôles météorologiques

- Préréglages météorologiques pour différentes conditions (ensoleillé, pluvieux, neigeux...)
- Transitions fluides entre conditions météorologiques
- Manipulation des paramètres individuels (intensité de pluie, densité du brouillard...)
- Mode de démonstration pour explorer les capacités visuelles
