# Configuration de Déploiement en Production

## Architecture de Déploiement

L'architecture de déploiement en production pour Dashboard-Velo.com est conçue pour assurer une haute disponibilité, une scalabilité horizontale et une sécurité optimale.

### Diagramme d'Architecture

```
                                  +-------------+
                                  |   CloudFlare|
                                  |    (CDN)    |
                                  +------+------+
                                         |
                                         v
+----------------+              +--------+-------+
|  Monitoring    |<------------>|                |
|  Prometheus    |              |    Load        |
|  Grafana       |              |   Balancer     |
+----------------+              |                |
                                +--------+-------+
                                         |
                 +---------------------+-+-------------------+
                 |                     |                     |
         +-------v------+     +--------v------+     +-------v------+
         |              |     |               |     |              |
         |  App Server  |     |  App Server   |     |  App Server  |
         |  (Node.js)   |     |  (Node.js)    |     |  (Node.js)   |
         |              |     |               |     |              |
         +-------+------+     +-------+-------+     +-------+------+
                 |                    |                     |
                 +----------+---------+----------+----------+
                            |                    |
                    +-------v------+     +-------v------+
                    |              |     |              |
                    |    Redis     |     |   MongoDB    |
                    |   Cluster    |     |   Cluster    |
                    |              |     |              |
                    +--------------+     +--------------+
```

## Configuration des Serveurs

### Serveurs d'Application

Nous utilisons des instances EC2 t3.medium pour les serveurs d'application avec la configuration suivante :

| Composant | Spécification |
|-----------|---------------|
| CPU | 2 vCPU |
| RAM | 4 GB |
| Stockage | 50 GB SSD |
| OS | Ubuntu Server 22.04 LTS |
| Node.js | v18.16.0 LTS |
| PM2 | v5.3.0 |

### Base de Données

Pour MongoDB, nous utilisons un cluster Atlas M30 avec la configuration suivante :

| Composant | Spécification |
|-----------|---------------|
| Réplicas | 3 (1 primaire, 2 secondaires) |
| RAM | 8 GB par nœud |
| Stockage | 100 GB SSD par nœud |
| Backup | Quotidien avec rétention de 7 jours |
| Monitoring | Activé avec alertes |

### Cache Redis

Pour Redis, nous utilisons un cluster ElastiCache avec la configuration suivante :

| Composant | Spécification |
|-----------|---------------|
| Nœuds | 3 (1 primaire, 2 réplicas) |
| Type d'instance | cache.m5.large |
| RAM | 8 GB par nœud |
| Éviction | volatile-lru |
| Persistance | RDB (toutes les 60 minutes) |

## Configuration Nginx

Voici la configuration Nginx optimisée pour la production :

```nginx
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 4096;
    multi_accept on;
    use epoll;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Gzip Settings
    gzip on;
    gzip_disable "msie6";
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

    # Server Configuration
    server {
        listen 80;
        server_name api.dashboard-velo.com;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name api.dashboard-velo.com;

        ssl_certificate /etc/letsencrypt/live/api.dashboard-velo.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.dashboard-velo.com/privkey.pem;

        # Security Headers
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "DENY" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self' https://api.strava.com https://api.openweathermap.org https://api.mapbox.com;" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "geolocation=(self), camera=(), microphone=()" always;

        # Proxy Settings
        location / {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 90;
        }

        location /api/auth {
            limit_req zone=auth burst=10 nodelay;
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static Files Caching
        location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
            expires 30d;
            add_header Cache-Control "public, no-transform";
        }

        # API Documentation
        location /api/docs {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## Configuration PM2

Voici la configuration PM2 pour la gestion des processus Node.js :

```json
{
  "apps": [
    {
      "name": "dashboard-velo-api",
      "script": "server.js",
      "instances": "max",
      "exec_mode": "cluster",
      "watch": false,
      "max_memory_restart": "1G",
      "env": {
        "NODE_ENV": "production",
        "PORT": 3000
      },
      "error_file": "/var/log/dashboard-velo/error.log",
      "out_file": "/var/log/dashboard-velo/out.log",
      "merge_logs": true,
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
      "max_restarts": 10,
      "restart_delay": 4000,
      "wait_ready": true,
      "listen_timeout": 50000,
      "kill_timeout": 5000
    }
  ]
}
```

## Variables d'Environnement

Les variables d'environnement sont gérées via un fichier `.env.production` sécurisé :

```
# Server
NODE_ENV=production
PORT=3000
API_VERSION=v1
CORS_ORIGIN=https://dashboard-velo.com,https://www.dashboard-velo.com

# MongoDB
MONGO_URI=mongodb+srv://[username]:[password]@cluster0.mongodb.net/dashboard-velo?retryWrites=true&w=majority
MONGO_DB_NAME=dashboard-velo

# Redis
REDIS_HOST=dashboard-velo-redis.abcdef.ng.0001.euw1.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_PREFIX=dv:

# JWT
JWT_SECRET=[secret-key-here]
JWT_REFRESH_SECRET=[refresh-secret-key-here]
JWT_EXPIRATION=30m
JWT_REFRESH_EXPIRATION=7d

# OpenAI
OPENAI_API_KEY=[openai-api-key-here]
OPENAI_ORGANIZATION_ID=[openai-org-id-here]

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Security
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
BCRYPT_SALT_ROUNDS=12

# External APIs
STRAVA_CLIENT_ID=[strava-client-id]
STRAVA_CLIENT_SECRET=[strava-client-secret]
MAPBOX_ACCESS_TOKEN=[mapbox-token]
OPENWEATHERMAP_API_KEY=[openweathermap-key]
```

## Monitoring et Alertes

### Prometheus Configuration

Voici la configuration de base pour Prometheus :

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']

rule_files:
  - "alerts.yml"

scrape_configs:
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'api-server'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['localhost:3000']

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']

  - job_name: 'mongodb'
    static_configs:
      - targets: ['localhost:9216']
```

### Grafana Dashboards

Nous avons configuré les dashboards Grafana suivants :

1. **Dashboard Vue d'Ensemble** : Métriques globales du système
2. **Dashboard API** : Performances des endpoints API, temps de réponse, taux d'erreur
3. **Dashboard Redis** : Utilisation mémoire, opérations/sec, taux de hit/miss
4. **Dashboard MongoDB** : Opérations/sec, temps de réponse, utilisation mémoire
5. **Dashboard Système** : CPU, mémoire, disque, réseau
6. **Dashboard Sécurité** : Tentatives de connexion, requêtes bloquées, activité suspecte

### Alertes Configurées

| Alerte | Condition | Sévérité | Notification |
|--------|-----------|----------|--------------|
| CPU élevé | CPU > 80% pendant 5min | Warning | Email, Slack |
| CPU critique | CPU > 95% pendant 2min | Critical | Email, Slack, SMS |
| Mémoire élevée | Mémoire > 85% pendant 5min | Warning | Email, Slack |
| Mémoire critique | Mémoire > 95% pendant 2min | Critical | Email, Slack, SMS |
| Latence API | Temps de réponse > 500ms pendant 5min | Warning | Email, Slack |
| Erreurs API | Taux d'erreur > 1% pendant 5min | Warning | Email, Slack |
| Erreurs API critiques | Taux d'erreur > 5% pendant 2min | Critical | Email, Slack, SMS |
| Redis mémoire | Utilisation > 80% pendant 5min | Warning | Email, Slack |
| MongoDB latence | Temps de réponse > 100ms pendant 5min | Warning | Email, Slack |

## Procédure de Déploiement

### Étapes de Déploiement

1. **Préparation**
   - Vérification des tests automatisés (CI/CD)
   - Revue du code et validation
   - Création d'une release tag

2. **Déploiement sur Staging**
   - Déploiement automatique via CI/CD
   - Tests de non-régression
   - Tests de performance
   - Validation fonctionnelle

3. **Déploiement en Production**
   - Création d'un snapshot de la base de données
   - Déploiement avec stratégie Blue/Green
   - Vérification des métriques de santé
   - Tests de smoke

4. **Post-Déploiement**
   - Surveillance active pendant 24h
   - Vérification des logs
   - Vérification des métriques de performance
   - Communication aux équipes

### Script de Déploiement Automatisé

```bash
#!/bin/bash
# deploy.sh - Script de déploiement automatisé

# Variables
DEPLOY_ENV=$1
APP_NAME="dashboard-velo-api"
DEPLOY_DIR="/var/www/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Vérification de l'environnement
if [ "$DEPLOY_ENV" != "staging" ] && [ "$DEPLOY_ENV" != "production" ]; then
  echo "Usage: $0 [staging|production]"
  exit 1
fi

# Création du répertoire de backup
mkdir -p $BACKUP_DIR

# Backup des fichiers actuels
if [ -d "$DEPLOY_DIR" ]; then
  echo "Backup des fichiers actuels..."
  tar -czf $BACKUP_DIR/$APP_NAME-$TIMESTAMP.tar.gz -C $DEPLOY_DIR .
fi

# Récupération du code
echo "Récupération du code..."
git fetch --all
git checkout tags/v1.0.0

# Installation des dépendances
echo "Installation des dépendances..."
npm ci --production

# Construction du projet
echo "Construction du projet..."
npm run build

# Copie des fichiers
echo "Déploiement des fichiers..."
mkdir -p $DEPLOY_DIR
rsync -av --delete --exclude='.git' --exclude='node_modules' --exclude='.env*' ./ $DEPLOY_DIR/

# Configuration de l'environnement
echo "Configuration de l'environnement..."
cp .env.$DEPLOY_ENV $DEPLOY_DIR/.env

# Redémarrage de l'application
echo "Redémarrage de l'application..."
cd $DEPLOY_DIR
pm2 reload ecosystem.config.js --env $DEPLOY_ENV

# Vérification du statut
echo "Vérification du statut..."
sleep 5
pm2 status

echo "Déploiement terminé avec succès!"
```

## Plan de Rollback

En cas de problème après le déploiement, voici la procédure de rollback :

1. **Détection du Problème**
   - Alertes Prometheus/Grafana
   - Surveillance des logs
   - Feedback utilisateur

2. **Décision de Rollback**
   - Évaluation de la gravité du problème
   - Impact sur les utilisateurs
   - Possibilité de correction rapide

3. **Procédure de Rollback**
   - Exécution du script de rollback
   - Restauration de la version précédente
   - Vérification du bon fonctionnement

4. **Script de Rollback**

```bash
#!/bin/bash
# rollback.sh - Script de rollback

# Variables
APP_NAME="dashboard-velo-api"
DEPLOY_DIR="/var/www/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"

# Récupération du dernier backup
LATEST_BACKUP=$(ls -t $BACKUP_DIR/$APP_NAME-*.tar.gz | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "Aucun backup trouvé!"
  exit 1
fi

echo "Rollback vers $LATEST_BACKUP..."

# Restauration des fichiers
rm -rf $DEPLOY_DIR/*
tar -xzf $LATEST_BACKUP -C $DEPLOY_DIR

# Redémarrage de l'application
cd $DEPLOY_DIR
pm2 reload ecosystem.config.js

# Vérification du statut
sleep 5
pm2 status

echo "Rollback terminé avec succès!"
```

## Checklist de Mise en Production

- [ ] Tous les tests automatisés passent (unitaires, intégration, e2e)
- [ ] Revue de code complétée et approuvée
- [ ] Documentation API mise à jour
- [ ] Variables d'environnement configurées
- [ ] Stratégie de backup en place et testée
- [ ] Monitoring et alertes configurés
- [ ] Plan de rollback testé
- [ ] Équipe support informée du déploiement
- [ ] Communication aux utilisateurs planifiée (si nécessaire)
- [ ] Vérification des licences et conformité légale
- [ ] Audit de sécurité complété
- [ ] Performance testée sous charge

## Contacts et Responsabilités

| Rôle | Nom | Email | Téléphone |
|------|-----|-------|-----------|
| DevOps Lead | Jean Dupont | jean.dupont@dashboard-velo.com | +33 6 12 34 56 78 |
| Backend Lead | Thomas Martin | thomas.martin@dashboard-velo.com | +33 6 23 45 67 89 |
| Frontend Lead | Julien Bernard | julien.bernard@dashboard-velo.com | +33 6 34 56 78 90 |
| DBA | Sophie Petit | sophie.petit@dashboard-velo.com | +33 6 45 67 89 01 |
| Security Officer | David Moreau | david.moreau@dashboard-velo.com | +33 6 56 78 90 12 |

*Document mis à jour le 5 avril 2025*
*Équipe Backend - Dashboard-Velo.com*
