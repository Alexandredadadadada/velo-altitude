# Guide de déploiement - Grand Est Cyclisme

Ce document fournit les instructions détaillées pour déployer l'application Grand Est Cyclisme sur Hostinger.

## Table des matières

1. [Prérequis](#prérequis)
2. [Préparation du build de production](#préparation-du-build-de-production)
3. [Configuration de l'hébergement Hostinger](#configuration-de-lhébergement-hostinger)
4. [Déploiement de l'application](#déploiement-de-lapplication)
5. [Configuration des bases de données](#configuration-des-bases-de-données)
6. [Configuration des variables d'environnement](#configuration-des-variables-denvironnement)
7. [Configuration du domaine et des certificats SSL](#configuration-du-domaine-et-des-certificats-ssl)
8. [Vérification du déploiement](#vérification-du-déploiement)
9. [Maintenance et mises à jour](#maintenance-et-mises-à-jour)
10. [Résolution des problèmes courants](#résolution-des-problèmes-courants)

## Prérequis

Avant de commencer le déploiement, assurez-vous de disposer des éléments suivants :

- Un compte Hostinger avec un plan d'hébergement supportant Node.js
- Un nom de domaine configuré (par exemple, grand-est-cyclisme.com)
- Accès SSH à votre serveur Hostinger
- Accès FTP à votre serveur Hostinger
- Les clés API pour tous les services externes (Mapbox, OpenWeatherMap, etc.)
- Un client Git installé sur votre machine locale
- Node.js (v14 ou supérieur) et npm installés sur votre machine locale

## Préparation du build de production

1. Clonez le dépôt sur votre machine locale :
   ```bash
   git clone https://github.com/votre-organisation/grand-est-cyclisme-website.git
   cd grand-est-cyclisme-website
   ```

2. Installez les dépendances :
   ```bash
   npm install
   ```

3. Exécutez le script de build de production :
   ```bash
   node scripts/build-production.js
   ```

4. Vérifiez que le dossier `dist` a été créé avec tous les fichiers nécessaires.

## Configuration de l'hébergement Hostinger

1. Connectez-vous à votre panneau de contrôle Hostinger.

2. Accédez à la section "Hébergement Web" et sélectionnez votre domaine.

3. Dans le menu, allez à "Avancé" > "Node.js".

4. Activez Node.js et configurez les paramètres suivants :
   - Version de Node.js : Sélectionnez la version LTS la plus récente (14.x ou supérieure)
   - Point d'entrée : `server/index.js`
   - Environnement : `production`

5. Cliquez sur "Enregistrer les modifications".

6. Dans le menu, allez à "Avancé" > "Gestionnaire de base de données" et créez :
   - Une base de données MongoDB
   - Une instance Redis (si disponible, sinon utilisez un service externe comme Redis Labs)

7. Notez les informations de connexion pour les bases de données.

## Déploiement de l'application

### Option 1 : Déploiement automatisé via script

1. Configurez le script de déploiement avec vos informations Hostinger :
   ```bash
   nano scripts/deploy-hostinger.sh
   ```
   
   Modifiez les variables suivantes :
   ```bash
   HOSTINGER_USER="votre_utilisateur_ftp"
   HOSTINGER_PASSWORD="votre_mot_de_passe_ftp"
   HOSTINGER_HOST="votre_serveur_ftp.hostinger.com"
   ```

2. Exécutez le script de déploiement :
   ```bash
   ./scripts/deploy-hostinger.sh
   ```

### Option 2 : Déploiement manuel via FTP

1. Connectez-vous à votre serveur Hostinger via FTP en utilisant un client comme FileZilla.

2. Naviguez vers le répertoire racine de votre site (généralement `/public_html`).

3. Téléchargez tout le contenu du dossier `dist` vers ce répertoire.

## Configuration des bases de données

### MongoDB

1. Connectez-vous à votre panneau de contrôle Hostinger.

2. Accédez à "Avancé" > "Gestionnaire de base de données" > "MongoDB".

3. Notez les informations de connexion :
   - Hôte
   - Port
   - Nom d'utilisateur
   - Mot de passe
   - Nom de la base de données

4. Utilisez ces informations pour configurer la variable d'environnement `MONGODB_URI` dans votre fichier `.env`.

### Redis

Si Hostinger propose Redis :

1. Activez Redis depuis le panneau de contrôle.

2. Notez les informations de connexion et configurez les variables d'environnement correspondantes.

Si vous utilisez un service externe comme Redis Labs :

1. Créez un compte et une instance Redis.

2. Notez les informations de connexion et configurez les variables d'environnement correspondantes.

## Configuration des variables d'environnement

1. Connectez-vous à votre serveur Hostinger via SSH :
   ```bash
   ssh votre_utilisateur@votre_serveur.hostinger.com
   ```

2. Naviguez vers le répertoire racine de votre application :
   ```bash
   cd public_html
   ```

3. Créez le fichier `.env` en vous basant sur `.env.example` :
   ```bash
   cp .env.example .env
   nano .env
   ```

4. Configurez toutes les variables d'environnement avec les valeurs de production, notamment :
   - Les clés API pour tous les services externes
   - Les informations de connexion aux bases de données
   - Les URLs de base pour l'API et le client
   - Les paramètres de sécurité (secrets JWT, etc.)
   - Les paramètres de cache

5. Enregistrez le fichier et quittez l'éditeur.

## Configuration du domaine et des certificats SSL

1. Dans votre panneau de contrôle Hostinger, accédez à "Domaines" > "Gérer".

2. Assurez-vous que votre domaine est correctement configuré et pointe vers votre hébergement.

3. Activez le certificat SSL/TLS :
   - Accédez à "SSL/TLS"
   - Cliquez sur "Installer" pour le certificat Let's Encrypt
   - Suivez les instructions pour activer HTTPS

4. Configurez la redirection HTTP vers HTTPS (déjà incluse dans le fichier `.htaccess` généré).

## Vérification du déploiement

1. Redémarrez l'application Node.js depuis le panneau de contrôle Hostinger.

2. Accédez à votre site via le navigateur : `https://grand-est-cyclisme.com`

3. Vérifiez que toutes les fonctionnalités fonctionnent correctement :
   - Visualisation des itinéraires avec code couleur
   - Affichage des cols avec informations détaillées
   - Intégration des API externes (Mapbox, OpenRouteService)
   - Système de défi des cols
   - Authentification et profils utilisateurs

4. Vérifiez les logs de l'application pour détecter d'éventuelles erreurs :
   ```bash
   tail -f /var/log/grand-est-cyclisme/app.log
   ```

## Maintenance et mises à jour

### Mise à jour de l'application

1. Mettez à jour votre code source local :
   ```bash
   git pull origin main
   ```

2. Générez un nouveau build de production :
   ```bash
   node scripts/build-production.js
   ```

3. Déployez le nouveau build en utilisant le script de déploiement ou via FTP.

4. Redémarrez l'application Node.js depuis le panneau de contrôle Hostinger.

### Sauvegarde des données

1. Configurez des sauvegardes régulières de votre base de données MongoDB :
   - Utilisez la fonctionnalité de sauvegarde automatique de Hostinger si disponible
   - Ou configurez un script de sauvegarde personnalisé

2. Sauvegardez régulièrement votre fichier `.env` contenant les variables d'environnement.

## Optimisation des performances

### Mise en cache

Le système de cache Redis est déjà configuré dans l'application. Pour optimiser davantage :

1. Ajustez les durées de cache dans le fichier `config/production.js` en fonction de vos besoins.

2. Utilisez le CDN de Hostinger pour les assets statiques si disponible.

### Compression des assets

Les assets sont déjà compressés lors du build de production. Le fichier `.htaccess` est également configuré pour activer la compression Gzip au niveau du serveur.

## Résolution des problèmes courants

### L'application ne démarre pas

1. Vérifiez les logs de l'application :
   ```bash
   tail -f /var/log/grand-est-cyclisme/app.log
   ```

2. Assurez-vous que toutes les variables d'environnement sont correctement configurées dans le fichier `.env`.

3. Vérifiez que Node.js est activé et correctement configuré dans le panneau de contrôle Hostinger.

### Problèmes de connexion à la base de données

1. Vérifiez que les informations de connexion dans le fichier `.env` sont correctes.

2. Assurez-vous que la base de données MongoDB est active et accessible.

3. Vérifiez que votre IP est autorisée à accéder à la base de données (si des restrictions d'IP sont en place).

### Problèmes avec les API externes

1. Vérifiez que toutes les clés API sont valides et correctement configurées dans le fichier `.env`.

2. Assurez-vous que les API externes sont accessibles depuis votre serveur Hostinger.

3. Vérifiez les quotas et limites d'utilisation des API externes.

### Problèmes de performance

1. Surveillez l'utilisation des ressources (CPU, mémoire) dans le panneau de contrôle Hostinger.

2. Optimisez les requêtes à la base de données et les appels API.

3. Ajustez les paramètres de cache pour améliorer les performances.

---

Pour toute assistance supplémentaire, contactez l'équipe technique à support@grand-est-cyclisme.com
