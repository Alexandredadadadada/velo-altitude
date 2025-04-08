# Guide de Déploiement - Velo-Altitude

Ce document détaille les étapes nécessaires pour déployer l'application Velo-Altitude en environnement de production, configurer les variables d'environnement requises, effectuer des sauvegardes et réaliser les vérifications post-déploiement.

## Table des matières

1. [Prérequis de déploiement](#prérequis-de-déploiement)
2. [Étapes de déploiement](#étapes-de-déploiement)
   - [Préparation](#préparation)
   - [Déploiement du frontend](#déploiement-du-frontend)
   - [Déploiement des nouvelles fonctionnalités UI](#déploiement-des-nouvelles-fonctionnalités-ui)
   - [Déploiement du backend](#déploiement-du-backend)
3. [Variables d'environnement](#variables-denvironnement)
4. [Procédures de sauvegarde et restauration](#procédures-de-sauvegarde-et-restauration)
5. [Vérifications post-déploiement](#vérifications-post-déploiement)
6. [Résolution des problèmes courants](#résolution-des-problèmes-courants)

## Prérequis de déploiement

Avant de commencer le déploiement, assurez-vous de disposer des éléments suivants :

### Matériel et infrastructure
- Serveur Linux (Ubuntu 20.04 ou supérieur recommandé)
- Minimum 2 CPU, 4 Go RAM
- 20 Go d'espace disque disponible
- Connexion Internet stable

### Logiciels et dépendances
- Node.js v18.17.0 (version exacte requise)
- npm v9.6.7 (version exacte requise)
- MongoDB v4.4 ou supérieur
- Nginx (pour le serveur web)
- PM2 (gestionnaire de processus Node.js)
- Git

### Clés API et comptes
- Compte Strava API (clientId et clientSecret)
- Clé API OpenWeatherMap
- Clé API OpenRoute Service
- Clé d'accès Mapbox

### Domaines et certificats
- Nom de domaine pour l'application
- Certificat SSL (Let's Encrypt recommandé)

## Étapes de déploiement

### Préparation

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/velo-altitude/website-final.git
   cd website-final
   ```

2. **Installer les dépendances globales**
   ```bash
   npm install -g pm2
   ```

3. **Créer les fichiers de configuration**
   ```bash
   cp .env.example .env
   # Éditer le fichier .env avec les valeurs de production
   ```

### Déploiement du frontend

1. **Installer les dépendances du frontend**
   ```bash
   cd client
   npm install
   ```

2. **Créer un build de production**
   ```bash
   npm run build
   ```

3. **Configurer Nginx pour servir le frontend**
   Créez un fichier de configuration Nginx pour votre application :
   ```nginx
   server {
       listen 80;
       server_name votre-domaine.com;
       
       # Redirection vers HTTPS
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl;
       server_name votre-domaine.com;
       
       # Configuration SSL
       ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
       
       # Racine du site
       root /chemin/vers/website-final/client/build;
       index index.html;
       
       # Compression Gzip
       gzip on;
       gzip_types text/plain text/css application/json application/javascript;
       
       # Mise en cache des assets statiques
       location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico)$ {
           expires 30d;
           add_header Cache-Control "public, no-transform";
       }
       
       # Gestion du routing SPA
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       # Proxy pour l'API
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Activer la configuration Nginx**
   ```bash
   sudo ln -s /etc/nginx/sites-available/velo-altitude.conf /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Déploiement des nouvelles fonctionnalités UI

Les récentes mises à jour de l'interface utilisateur nécessitent une attention particulière lors du déploiement en raison des nouvelles dépendances et des optimisations pour les animations et visualisations 3D.

1. **Installation des dépendances pour les fonctionnalités 3D et visualisations avancées**
   ```bash
   cd client
   npm install three@0.148.0 gsap@3.11.4 framer-motion@10.12.0 recharts@2.5.0
   ```

2. **Configuration pour les polices et les assets**
   ```bash
   # Assurez-vous que le fichier .env.local contient ces variables
   echo "REACT_APP_ENABLE_ANIMATIONS=true" >> .env.local
   echo "REACT_APP_PERFORMANCE_MODE=auto" >> .env.local
   echo "REACT_APP_ENABLE_3D_FEATURES=true" >> .env.local
   ```

3. **Optimisations Nginx pour les animations fluides**
   Ajoutez la configuration suivante à votre bloc `server` dans Nginx :
   ```nginx
   # Headers pour améliorer la performance des animations
   location ~* \.(js|css)$ {
       add_header Cache-Control "public, max-age=31536000, immutable";
   }
   
   # Améliorer la performance pour les modèles 3D et assets
   location ~* \.(glb|gltf|obj|mtl|hdr|fbx)$ {
       add_header Cache-Control "public, max-age=31536000, immutable";
       add_header Content-Disposition "inline";
   }
   ```

4. **Configuration des nouvelles fonctionnalités 3D et interactives**
   Créez un fichier de configuration pour les nouvelles fonctionnalités :
   ```bash
   cat <<EOF > client/public/config/advanced-features.json
   {
     "3d": {
       "colFlyThrough": {
         "enabled": true,
         "defaultQuality": "medium",
         "maxFrameRate": 60,
         "mobileQuality": "low"
       },
       "trainingVisualizer": {
         "enabled": true,
         "defaultQuality": "medium",
         "maxFrameRate": 60,
         "mobileQuality": "low"
       }
     },
     "interactive": {
       "nutritionRecipeVisualizer": {
         "enabled": true,
         "enableTimer": true,
         "enableNutritionDetails": true
       },
       "communityFeed": {
         "refreshRate": 60000,
         "maxItems": 50,
         "enableRealTimeUpdates": true
       }
     }
   }
   EOF
   ```

5. **Vérification de la compatibilité des navigateurs**
   Les nouvelles fonctionnalités nécessitent des navigateurs modernes avec support de WebGL et des fonctionnalités ES6+. Ajoutez le script suivant pour vérifier la compatibilité :
   ```bash
   cat <<EOF >> client/public/index.html
   <script>
     // Vérification de la compatibilité du navigateur
     (function() {
       var hasWebGL = (function() {
         try {
           var canvas = document.createElement('canvas');
           return !!(window.WebGLRenderingContext && 
                    (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
         } catch(e) {
           return false;
         }
       })();
       
       if (!hasWebGL) {
         window.addEventListener('DOMContentLoaded', function() {
           var warningDiv = document.createElement('div');
           warningDiv.style.position = 'fixed';
           warningDiv.style.top = '0';
           warningDiv.style.left = '0';
           warningDiv.style.right = '0';
           warningDiv.style.padding = '10px';
           warningDiv.style.backgroundColor = '#FFCBCB';
           warningDiv.style.color = '#000';
           warningDiv.style.textAlign = 'center';
           warningDiv.style.zIndex = '9999';
           warningDiv.innerHTML = 'Votre navigateur ne prend pas en charge certaines fonctionnalités 3D de Velo-Altitude. Veuillez utiliser un navigateur plus récent.';
           document.body.appendChild(warningDiv);
         });
       }
     })();
   </script>
   EOF
   ```

6. **Configuration des ressources pour les différentes fonctionnalités**

   **ColFlyThrough** (Visualisation 3D des cols) :
   - Assurez-vous que les données d'élévation des cols sont correctement formatées
   - Les fichiers de texture et modèles 3D doivent être placés dans `client/public/assets/3d/cols/`
   - Configuration de performance dans `client/src/config/performance-config.js`

   **TrainingVisualizer3D** (Entraînement virtuel) :
   - Les modèles 3D de cyclistes doivent être placés dans `client/public/assets/3d/cyclist/`
   - Les textures de route et terrain dans `client/public/assets/3d/environment/`

   **NutritionRecipeVisualizer** (Visualisation des recettes) :
   - Les images des recettes doivent être optimisées et placées dans `client/public/assets/nutrition/`
   - Base de données des recettes accessible via l'API

   **CommunityActivityFeed** (Fil d'activité communautaire) :
   - Configuration des webhooks pour les mises à jour en temps réel
   - Optimisation des requêtes via la mise en cache Redis

7. **Test des fonctionnalités avancées**
   ```bash
   # Créer un build de test avec fonctionnalités avancées activées
   REACT_APP_ENABLE_3D_FEATURES=true npm run build
   
   # Lancer un serveur local pour tester
   npx serve -s build
   ```

8. **Mesures pour optimiser les performances**
   Les fonctionnalités avancées peuvent être exigeantes en ressources, particulièrement :
   - Animations parallaxe et transitions de page
   - Visualisation 3D des cols avec ColFlyThrough
   - Simulation d'entraînement avec TrainingVisualizer3D
   - Visualisation interactive des recettes
   - Fil d'activité communautaire avec mises à jour en temps réel
   
   Implémentez une détection automatique des capacités de l'appareil :
   ```javascript
   // Ajouter dans client/src/utils/deviceCapabilities.js
   export const detectDeviceCapabilities = () => {
     const capabilities = {
       supportsWebGL: false,
       highPerformance: false,
       touchEnabled: false,
       lowBandwidth: false
     };
     
     // Détection WebGL
     try {
       const canvas = document.createElement('canvas');
       capabilities.supportsWebGL = !!(window.WebGLRenderingContext && 
         (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
     } catch(e) {
       capabilities.supportsWebGL = false;
     }
     
     // Estimation performance
     capabilities.highPerformance = window.navigator.hardwareConcurrency > 4;
     
     // Détection écran tactile
     capabilities.touchEnabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
     
     // Estimation bande passante
     if (navigator.connection) {
       capabilities.lowBandwidth = navigator.connection.downlink < 5;
     }
     
     return capabilities;
   };
   ```

### Déploiement du backend

1. **Installer les dépendances du backend**
   ```bash
   cd ../server
   npm install
   ```

2. **Configurer PM2**
   Créer un fichier de configuration `ecosystem.config.js` :
   ```javascript
   module.exports = {
     apps: [{
       name: "velo-altitude-api",
       script: "./server.js",
       instances: "max",
       exec_mode: "cluster",
       env: {
         NODE_ENV: "production",
         PORT: 5000
       },
       env_production: {
         NODE_ENV: "production"
       }
     }]
   };
   ```

3. **Démarrer l'application avec PM2**
   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save
   ```

4. **Configurer PM2 pour démarrer automatiquement**
   ```bash
   pm2 startup
   # Suivre les instructions affichées pour configurer le démarrage automatique
   ```

## Variables d'environnement

Les variables d'environnement suivantes doivent être configurées dans le fichier `.env` du serveur :

### Variables d'environnement essentielles

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NODE_ENV` | Environnement d'exécution | `production` |
| `PORT` | Port du serveur backend | `5000` |
| `MONGODB_URI` | URI de connexion MongoDB | `mongodb://user:password@localhost:27017/velo-altitude` |
| `SESSION_SECRET` | Secret pour les sessions | `votre_secret_très_complexe` |
| `CORS_ORIGIN` | Origine autorisée pour CORS | `https://votre-domaine.com` |

### Variables pour les API externes

| Variable | Description | Exemple |
|----------|-------------|---------|
| `STRAVA_CLIENT_ID` | ID client Strava | `12345` |
| `STRAVA_CLIENT_SECRET` | Secret client Strava | `abcdef123456789` |
| `STRAVA_REDIRECT_URI` | URI de redirection Strava | `https://votre-domaine.com/api/strava/callback` |
| `OPENWEATHER_API_KEY` | Clé API OpenWeatherMap | `abcdef123456789` |
| `OPENROUTE_API_KEY` | Clé API OpenRoute | `abcdef123456789` |
| `MAPBOX_ACCESS_TOKEN` | Token d'accès Mapbox | `pk.abcdef123456789` |

### Variables optionnelles

| Variable | Description | Exemple |
|----------|-------------|---------|
| `LOG_LEVEL` | Niveau de détail des logs | `info` |
| `REDIS_URL` | URL de connexion Redis (si utilisé) | `redis://localhost:6379` |
| `EMAIL_SERVICE` | Service d'envoi d'emails | `smtp.example.com` |
| `EMAIL_USER` | Utilisateur pour les emails | `noreply@votre-domaine.com` |
| `EMAIL_PASSWORD` | Mot de passe pour les emails | `password` |

## Procédures de sauvegarde et restauration

### Sauvegarde de la base de données

1. **Sauvegarde manuelle avec MongoDB**
   ```bash
   mongodump --uri="mongodb://user:password@localhost:27017/velo-altitude" --out=/chemin/vers/backup/$(date +"%Y-%m-%d")
   ```

2. **Script de sauvegarde automatique**
   Créez un script `backup.sh` :
   ```bash
   #!/bin/bash
   BACKUP_DIR="/chemin/vers/backups/mongodb"
   DATE=$(date +"%Y-%m-%d_%H-%M-%S")
   
   # Créer le dossier de sauvegarde
   mkdir -p $BACKUP_DIR
   
   # Effectuer la sauvegarde
   mongodump --uri="mongodb://user:password@localhost:27017/velo-altitude" --out=$BACKUP_DIR/$DATE
   
   # Compresser la sauvegarde
   tar -zcvf $BACKUP_DIR/$DATE.tar.gz $BACKUP_DIR/$DATE
   
   # Supprimer le dossier non compressé
   rm -rf $BACKUP_DIR/$DATE
   
   # Supprimer les sauvegardes de plus de 30 jours
   find $BACKUP_DIR -name "*.tar.gz" -type f -mtime +30 -delete
   
   echo "Sauvegarde terminée: $BACKUP_DIR/$DATE.tar.gz"
   ```

3. **Ajouter le script au planificateur cron**
   ```bash
   chmod +x backup.sh
   crontab -e
   # Ajouter la ligne suivante pour une sauvegarde quotidienne à 2h du matin
   0 2 * * * /chemin/vers/backup.sh >> /var/log/mongodb-backup.log 2>&1
   ```

### Restauration de la base de données

1. **Restauration d'une sauvegarde**
   ```bash
   # Décompresser l'archive si nécessaire
   tar -zxvf backup_2023-04-15.tar.gz
   
   # Restaurer la base de données
   mongorestore --uri="mongodb://user:password@localhost:27017/velo-altitude" --drop /chemin/vers/backup/2023-04-15/velo-altitude
   ```

2. **Vérification de la restauration**
   ```bash
   # Vérifier que les collections sont bien restaurées
   mongo mongodb://user:password@localhost:27017/velo-altitude --eval "db.getCollectionNames()"
   ```

### Sauvegarde des fichiers d'application

1. **Sauvegarde du code et des configurations**
   ```bash
   # Créer une archive du dossier d'application
   tar -zcvf /chemin/vers/backups/app_$(date +"%Y-%m-%d").tar.gz /chemin/vers/website-final --exclude="node_modules" --exclude=".git"
   
   # Sauvegarde des fichiers de configuration nginx
   cp /etc/nginx/sites-available/velo-altitude.conf /chemin/vers/backups/nginx/
   ```

## Vérifications post-déploiement

Après le déploiement, effectuez les vérifications suivantes pour vous assurer que tout fonctionne correctement :

### Vérifications de base

1. **Accès au site web**
   - Vérifiez que le site est accessible via HTTPS
   - Vérifiez que la redirection HTTP vers HTTPS fonctionne

2. **Fonctionnalités principales**
   - Connexion et inscription des utilisateurs
   - Création et visualisation d'itinéraires
   - Fonctionnalités spécifiques au cyclisme (visualisation des cols, etc.)
   - Nouvelles fonctionnalités implémentées :
     * **ColFlyThrough** : Vérifiez que la visualisation 3D des cols fonctionne correctement
     * **TrainingVisualizer3D** : Testez la simulation d'entraînement virtuel
     * **NutritionRecipeVisualizer** : Testez l'affichage des recettes et le fonctionnement des timers
     * **CommunityActivityFeed** : Vérifiez l'affichage des activités récentes et les interactions utilisateur

3. **Performance et sécurité**
   - Exécutez un test de performance avec [PageSpeed Insights](https://pagespeed.web.dev/)
   - Vérifiez la sécurité du site avec [Mozilla Observatory](https://observatory.mozilla.org/)
   - Testez les performances des fonctionnalités 3D sur différents appareils
   - Vérifiez que la détection de compatibilité WebGL fonctionne correctement

### Vérifications avancées

1. **Monitoring du backend**
   Accédez au dashboard de monitoring via :
   ```
   https://votre-domaine.com/api/monitoring/dashboard
   ```
   Vérifiez que toutes les métriques sont collectées correctement.

2. **Tests des fonctionnalités 3D et interactives**
   ```bash
   # Vérifier les logs pour les erreurs WebGL
   grep -i "webgl\|three.js\|3d" /var/log/nginx/error.log
   
   # Vérifier les erreurs console côté client
   # Utilisez les outils de développement du navigateur pour vérifier la console
   ```

3. **Tests des API externes**
   Vérifiez que toutes les intégrations API fonctionnent :
   - Strava (authentification et récupération de données)
   - Services météo
   - Calcul d'itinéraires
   - API de nutrition pour les recettes
   - API en temps réel pour le flux d'activités communautaires

4. **Vérification des performances sous charge**
   ```bash
   # Tester les performances des fonctionnalités avancées
   npx lighthouse https://votre-domaine.com/training --preset=desktop
   npx lighthouse https://votre-domaine.com/nutrition --preset=desktop
   npx lighthouse https://votre-domaine.com/community --preset=desktop
   npx lighthouse https://votre-domaine.com/cols --preset=desktop
   ```

5. **Vérification des logs**
   ```bash
   # Vérifier les logs de l'application
   pm2 logs velo-altitude-api
   
   # Vérifier les logs Nginx
   tail -f /var/log/nginx/error.log
   ```

6. **Vérification du SSL**
   ```bash
   # Tester la configuration SSL
   curl -I https://votre-domaine.com
   ```

7. **Tests de compatibilité sur différents appareils**
   Testez les fonctionnalités sur :
   - Ordinateurs de bureau (Windows, macOS, Linux)
   - Appareils mobiles (iOS, Android)
   - Tablettes
   - Vérifiez en particulier la dégradation élégante des fonctionnalités 3D sur les appareils moins puissants

## Résolution des problèmes courants

### Problème : Le serveur ne démarre pas

**Causes possibles et solutions :**
- **Erreur de configuration** : Vérifiez le fichier `.env` et les variables d'environnement
- **Port déjà utilisé** : Vérifiez si un autre service utilise déjà le port 5000
  ```bash
  lsof -i :5000
  ```
- **Dépendances manquantes** : Vérifiez les packages node
  ```bash
  npm install
  ```

### Problème : Erreurs 502 Bad Gateway

**Causes possibles et solutions :**
- **PM2 ne fonctionne pas** : Vérifiez l'état de PM2
  ```bash
  pm2 status
  pm2 restart velo-altitude-api
  ```
- **Configuration Nginx incorrecte** : Vérifiez les logs Nginx
  ```bash
  nginx -t
  tail -f /var/log/nginx/error.log
  ```

### Problème : Authentification Strava ne fonctionne pas

**Causes possibles et solutions :**
- **URI de redirection incorrect** : Vérifiez que l'URI de redirection configuré dans l'application Strava correspond exactement à celui dans votre `.env`
- **Clés API invalides** : Vérifiez les clés dans votre fichier `.env`
- **Scopes insuffisants** : Vérifiez que vous avez demandé les bons scopes lors de l'authentification

### Problème : Fonctionnalités 3D ou interactives ne fonctionnent pas correctement

**Causes possibles et solutions :**

1. **Problème avec ColFlyThrough (visualisation 3D des cols)**
   - **WebGL non supporté** : Vérifiez si le navigateur supporte WebGL
     ```javascript
     // Exécuter dans la console du navigateur
     !!window.WebGLRenderingContext
     ```
   - **Erreurs de chargement des modèles 3D** : Vérifiez les chemins des assets dans la console
   - **Performance faible** : Ajustez la qualité dans les paramètres de l'application
     ```bash
     # Modifier la qualité par défaut dans le fichier de configuration
     sed -i 's/"defaultQuality": "medium"/"defaultQuality": "low"/g' client/public/config/advanced-features.json
     ```

2. **Problème avec TrainingVisualizer3D (entraînement virtuel)**
   - **RAM ou GPU insuffisants** : Activez le mode performance
     ```javascript
     // Ajouter au localStorage via la console navigateur
     localStorage.setItem('velo-altitude-performance-mode', 'low');
     ```
   - **Animations saccadées** : Limitez le framerate
     ```bash
     # Modifier le framerate maximum dans le fichier de configuration
     sed -i 's/"maxFrameRate": 60/"maxFrameRate": 30/g' client/public/config/advanced-features.json
     ```

3. **Problème avec NutritionRecipeVisualizer (visualisation des recettes)**
   - **API de nutrition inaccessible** : Vérifiez la connexion à l'API
     ```bash
     curl -I https://votre-api-nutrition.com/health
     ```
   - **Timer ne fonctionne pas** : Vérifiez les permissions de notification
   - **Images de recettes manquantes** : Vérifiez les chemins des images et les droits d'accès
     ```bash
     # Vérifier les permissions des fichiers d'image
     ls -la client/public/assets/nutrition/
     ```

4. **Problème avec CommunityActivityFeed (fil d'activité communautaire)**
   - **Pas de mise à jour en temps réel** : Vérifiez la configuration des webhooks
     ```bash
     # Tester manuellement un webhook
     curl -X POST https://votre-domaine.com/api/webhooks/activity -H "Content-Type: application/json" -d '{"type":"test"}'
     ```
   - **Chargement lent des activités** : Optimisez la mise en cache Redis
     ```bash
     # Vérifier l'état de Redis
     redis-cli ping
     redis-cli info | grep used_memory
     ```
   - **Interactions utilisateur non enregistrées** : Vérifiez les logs d'erreurs API
     ```bash
     grep -i "community\|activity\|interaction" /var/log/velo-altitude-api.log
     ```

5. **Problèmes généraux de performance pour les nouvelles fonctionnalités**
   - **Désactiver temporairement certaines fonctionnalités pour diagnostiquer**
     ```bash
     # Désactiver temporairement les fonctionnalités 3D
     sed -i 's/"enabled": true/"enabled": false/g' client/public/config/advanced-features.json
     ```
   - **Vérifier la consommation de ressources**
     ```bash
     # Surveiller la consommation CPU/mémoire
     top -p $(pgrep -f node)
     ```
   - **Activer le mode de débogage**
     ```javascript
     // Ajouter au localStorage via la console navigateur
     localStorage.setItem('velo-altitude-debug-mode', 'true');
     ```

## Déploiement de Velo-Altitude

### État actuel du déploiement
- **Date de dernière tentative** : 05 avril 2025
- **Statut** : En cours
- **Plateforme** : Netlify

### Problèmes identifiés et solutions

#### Structure du projet et déploiement
La structure de notre projet présente une particularité : les fichiers React se trouvent dans le dossier `client/`, mais le dépôt GitHub actuel ne reflète pas cette structure. Cela cause des erreurs lors du déploiement automatique via GitHub.

**Erreur principale rencontrée** :
```
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/opt/build/repo/package.json'
```

#### Solutions possibles

1. **Configuration de Netlify** :
   - Définir "Base directory" sur `client` dans les paramètres de build
   - Utiliser `npm run build` comme commande de build
   - Définir "Publish directory" sur `build`

2. **Restructuration du dépôt GitHub** :
   - Mettre à jour le dépôt pour qu'il reflète la structure locale avec le dossier `client`
   - Pousser les changements vers GitHub

3. **Déploiement direct par ZIP** (méthode recommandée) :
   - Générer le build localement : `npm run build` dans le dossier `client`
   - Compresser le dossier `build` généré
   - Déployer manuellement via l'interface de Netlify en déposant le ZIP

### Variables d'environnement requises

Les variables suivantes doivent être configurées dans Netlify :
- `REACT_APP_BASE_URL=https://velo-altitude.com`
- `REACT_APP_BRAND_NAME=Velo-Altitude`
- `REACT_APP_API_URL=https://api.velo-altitude.com`
- `AUTH0_BASE_URL=https://velo-altitude.com`
- `AUTH0_AUDIENCE=https://api.velo-altitude.com`
- `AUTH0_ISSUER_BASE_URL=https://velo-altitude.eu.auth0.com`
- `MAPBOX_TOKEN=your_token_here`
- `OPENWEATHER_API_KEY=your_key_here`

### Prochaines étapes

1. Finaliser le déploiement via la méthode ZIP
2. Vérifier les modules après déploiement :
   - Explorateur de Cols avec données météo
   - Les 7 Majeurs avec visualisation 3D
   - Module d'entraînement (Calculateur FTP et HIIT)
   - Module Nutrition avec les 40 recettes
3. Configurer le domaine personnalisé sur Netlify
4. Résoudre la divergence entre le dépôt GitHub et la structure locale
