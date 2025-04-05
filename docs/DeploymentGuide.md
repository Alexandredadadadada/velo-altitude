# Guide de déploiement - Grand Est Cyclisme

Ce guide décrit les étapes nécessaires pour déployer l'application Grand Est Cyclisme sur Hostinger.

## Prérequis

- Compte Hostinger avec un plan approprié (minimum Business)
- Node.js v14+ sur votre environnement de développement
- Accès SSH à votre serveur Hostinger (disponible avec les plans Premium et Business)
- Nom de domaine configuré

## Architecture de l'application

L'application Grand Est Cyclisme est composée de deux parties principales:

1. **Client (Frontend)**: Application React
2. **Serveur (Backend)**: API Node.js/Express

## Étape 1: Préparation des fichiers pour le déploiement

### 1.1. Préparer l'application client (Frontend)

1. Ouvrez un terminal et naviguez jusqu'au dossier client:
   ```bash
   cd /chemin/vers/grand-est-cyclisme-website-final/client
   ```

2. Installez les dépendances:
   ```bash
   npm install
   ```

3. Créez un fichier `.env.production` à la racine du dossier client avec les variables d'environnement de production:
   ```
   REACT_APP_API_URL=https://api.votredomaine.com
   REACT_APP_STRAVA_CLIENT_ID=votre_id_client_strava
   REACT_APP_GOOGLE_MAPS_API_KEY=votre_cle_api_google_maps
   ```

4. Générez la version de production:
   ```bash
   npm run build
   ```

5. Le résultat sera un dossier `build` contenant l'application optimisée pour la production.

### 1.2. Préparer l'application serveur (Backend)

1. Ouvrez un terminal et naviguez jusqu'au dossier serveur:
   ```bash
   cd /chemin/vers/grand-est-cyclisme-website-final/server
   ```

2. Installez les dépendances:
   ```bash
   npm install
   ```

3. Créez un fichier `.env` à la racine du dossier serveur avec les variables d'environnement de production:
   ```
   NODE_ENV=production
   PORT=8080
   DB_URI=votre_uri_mongodb
   JWT_SECRET=votre_cle_secrete_jwt
   STRAVA_CLIENT_ID=votre_id_client_strava
   STRAVA_CLIENT_SECRET=votre_secret_client_strava
   STRAVA_REDIRECT_URI=https://votredomaine.com/callback/strava
   ```

## Étape 2: Déploiement sur Hostinger

### 2.1. Créer une application Node.js sur Hostinger

1. Connectez-vous à votre panneau de contrôle Hostinger.
2. Accédez à la section "Hébergement Web" et sélectionnez votre domaine.
3. Dans le menu de gauche, cliquez sur "Applications avancées".
4. Sélectionnez "Node.js" comme type d'application.
5. Configurez l'application:
   - **Nom de l'application**: Grand Est Cyclisme
   - **Version de Node.js**: Choisissez la dernière version LTS (par exemple, 16.x)
   - **Point d'entrée**: server.js
   - **Chemin d'installation**: Laissez la valeur par défaut ou personnalisez selon vos besoins

6. Cliquez sur "Installer".

### 2.2. Transférer les fichiers via SSH ou FTP

#### Option A: Utiliser SSH (recommandé)

1. Connectez-vous à votre serveur Hostinger via SSH:
   ```bash
   ssh u123456789@votredomaine.com
   # Remplacez u123456789 par votre nom d'utilisateur SSH
   ```

2. Naviguez vers le répertoire de votre application Node.js:
   ```bash
   cd /home/u123456789/public_html/nom_application_nodejs
   ```

3. Clonez votre dépôt git (si vous utilisez Git) ou transférez les fichiers:
   ```bash
   git clone https://github.com/votre-repo/grand-est-cyclisme.git .
   ```

   Ou si vous n'utilisez pas Git, vous pouvez transférer les fichiers en utilisant SCP depuis votre machine locale:
   ```bash
   # Sur votre machine locale (dans un nouveau terminal)
   scp -r /chemin/vers/grand-est-cyclisme-website-final/* u123456789@votredomaine.com:/home/u123456789/public_html/nom_application_nodejs/
   ```

#### Option B: Utiliser FTP

1. Connectez-vous à votre compte FTP Hostinger avec un client FTP comme FileZilla.
2. Naviguez vers le répertoire de votre application Node.js.
3. Téléchargez les fichiers du serveur (contenu du dossier server) vers ce répertoire.
4. Téléchargez les fichiers du client compilé (contenu du dossier client/build) vers le répertoire public_html.

### 2.3. Configurer le serveur pour exécuter l'application Node.js

1. Dans votre session SSH, naviguez vers le répertoire de l'application:
   ```bash
   cd /home/u123456789/public_html/nom_application_nodejs
   ```

2. Installez les dépendances:
   ```bash
   npm install --production
   ```

3. Créez un fichier `ecosystem.config.js` pour PM2 (gestionnaire de processus Node.js):
   ```bash
   touch ecosystem.config.js
   ```

4. Éditez le fichier avec un éditeur comme nano:
   ```bash
   nano ecosystem.config.js
   ```

5. Ajoutez la configuration suivante:
   ```javascript
   module.exports = {
     apps: [{
       name: "grand-est-cyclisme",
       script: "server.js",
       env: {
         NODE_ENV: "production",
         PORT: 8080
       },
       instances: "max",
       exec_mode: "cluster",
       max_memory_restart: "200M"
     }]
   };
   ```

6. Sauvegardez et fermez le fichier (CTRL+X, puis Y et ENTER dans nano).

7. Démarrez l'application avec PM2:
   ```bash
   pm2 start ecosystem.config.js
   ```

8. Configurez PM2 pour démarrer automatiquement après un redémarrage du serveur:
   ```bash
   pm2 save
   pm2 startup
   ```

### 2.4. Configurer le serveur web (Apache/Nginx) pour servir l'application React

#### Pour Apache (Hostinger utilise généralement Apache)

1. Créez ou modifiez le fichier `.htaccess` dans le répertoire public_html:
   ```bash
   cd /home/u123456789/public_html
   nano .htaccess
   ```

2. Ajoutez la configuration suivante pour la redirection des requêtes API vers votre application Node.js et pour gérer l'application SPA React:
   ```apache
   # Rediriger les requêtes API vers l'application Node.js
   <IfModule mod_rewrite.c>
     RewriteEngine On
     
     # Si la requête commence par /api, redirigez vers le serveur Node.js
     RewriteCond %{REQUEST_URI} ^/api
     RewriteRule ^api/(.*)$ http://localhost:8080/api/$1 [P,L]
     
     # Si le fichier existe, servez-le directement
     RewriteCond %{REQUEST_FILENAME} -f [OR]
     RewriteCond %{REQUEST_FILENAME} -d
     RewriteRule ^ - [L]
     
     # Sinon, redirigez vers index.html pour l'application SPA React
     RewriteRule ^ index.html [L]
   </IfModule>
   
   # Cache-Control pour les fichiers statiques
   <FilesMatch "\.(js|css|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$">
     Header set Cache-Control "max-age=31536000, public"
   </FilesMatch>
   ```

3. Sauvegardez et fermez le fichier.

## Étape 3: Configuration DNS et HTTPS

### 3.1. Configurer les enregistrements DNS

1. Dans le panneau de contrôle Hostinger, allez dans la section "Domaines".
2. Sélectionnez votre domaine et accédez à "DNS Zone".
3. Assurez-vous que les enregistrements A et CNAME sont correctement configurés:
   
   ```
   Type  Nom    Valeur                TTL
   A     @      Adresse IP du serveur 14400
   CNAME www    votredomaine.com      14400
   ```

### 3.2. Activer HTTPS avec Let's Encrypt

1. Dans le panneau de contrôle Hostinger, accédez à la section "SSL".
2. Cliquez sur "Installer" pour Let's Encrypt.
3. Sélectionnez les domaines que vous souhaitez sécuriser (domaine principal et www).
4. Cliquez sur "Installer le certificat".

## Étape 4: Tests post-déploiement

Après le déploiement, vérifiez que tout fonctionne correctement:

1. Vérifiez que le site est accessible à l'adresse https://votredomaine.com
2. Testez la connexion à l'API en accédant à https://votredomaine.com/api/health-check
3. Testez les principales fonctionnalités:
   - Authentification
   - Module HIIT et entraînement
   - Fonctionnalités communautaires
   - Intégration Strava (si applicable)

## Étape 5: Surveillance et maintenance

### 5.1. Surveillance

1. Configurez la surveillance du serveur avec le panneau de contrôle Hostinger.
2. Utilisez PM2 pour surveiller votre application Node.js:
   ```bash
   pm2 monit
   ```

3. Configurez des alertes pour les temps d'arrêt et les erreurs.

### 5.2. Mises à jour

Pour mettre à jour l'application:

1. Connectez-vous au serveur via SSH.
2. Naviguez vers le répertoire de l'application.
3. Récupérez les dernières modifications:
   ```bash
   git pull # Si vous utilisez Git
   ```

4. Installez les dépendances si nécessaire:
   ```bash
   npm install --production
   ```

5. Reconstruisez l'application client si nécessaire:
   ```bash
   cd client && npm run build
   ```

6. Redémarrez l'application:
   ```bash
   pm2 restart grand-est-cyclisme
   ```

## Résolution des problèmes courants

### L'application ne démarre pas

1. Vérifiez les logs PM2:
   ```bash
   pm2 logs grand-est-cyclisme
   ```

2. Assurez-vous que les variables d'environnement sont correctement configurées.
3. Vérifiez que les ports ne sont pas bloqués par le pare-feu.

### Erreurs 502 Bad Gateway

1. Vérifiez que l'application Node.js fonctionne:
   ```bash
   pm2 status
   ```

2. Vérifiez la configuration du proxy dans le fichier .htaccess.
3. Assurez-vous que les modules Apache nécessaires sont activés (mod_proxy, mod_proxy_http).

### Erreurs CORS

1. Vérifiez la configuration CORS dans votre serveur Node.js.
2. Assurez-vous que les en-têtes appropriés sont envoyés.

### Problèmes de performance

1. Analysez les logs pour identifier les goulots d'étranglement.
2. Optimisez les requêtes à la base de données.
3. Mettez en cache les ressources statiques.
4. Augmentez les ressources allouées à l'application si nécessaire.

---

Pour plus d'assistance, contactez le support Hostinger ou envoyez un email à l'équipe de développement à dev@grandestvelo.fr.
