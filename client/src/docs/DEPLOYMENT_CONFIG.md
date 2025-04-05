# Configuration de Déploiement - Dashboard-Velo

## 1. Vue d'ensemble

Ce document détaille la configuration de déploiement pour Dashboard-Velo.com, couvrant l'infrastructure, les environnements, et les processus de déploiement continu.

## 2. Architecture de Déploiement

### 2.1 Infrastructure Cloud

Dashboard-Velo est déployé sur AWS avec l'architecture suivante:

```
                                      ┌─────────────┐
                                      │   Route53   │
                                      │    (DNS)    │
                                      └──────┬──────┘
                                             │
                                      ┌──────▼──────┐
                                      │ CloudFront  │
                                      │    (CDN)    │
                                      └──────┬──────┘
                                             │
┌─────────────┐                       ┌──────▼──────┐
│  Certificate│◄──────────────────────┤     ALB     │
│   Manager   │                       │(Load Balancer)
└─────────────┘                       └──────┬──────┘
                                             │
                ┌───────────────────────────┬┴───────────────────────────┐
                │                           │                            │
         ┌──────▼──────┐             ┌──────▼──────┐              ┌──────▼──────┐
         │    ECS      │             │    ECS      │              │    ECS      │
         │ (Frontend)  │             │ (Backend)   │              │ (WebSockets)│
         └──────┬──────┘             └──────┬──────┘              └──────┬──────┘
                │                           │                            │
                │                    ┌──────▼──────┐                     │
                │                    │   RDS       │                     │
                │                    │ (Database)  │                     │
                │                    └──────┬──────┘                     │
                │                           │                            │
                │                    ┌──────▼──────┐                     │
                │                    │ ElastiCache │                     │
                │                    │  (Redis)    │◄────────────────────┘
                │                    └─────────────┘
                │
         ┌──────▼──────┐
         │     S3      │
         │(Static Files)│
         └─────────────┘
```

### 2.2 Environnements

| Environnement | URL | Usage |
|---------------|-----|-------|
| Development | dev.dashboard-velo.com | Tests en cours de développement |
| Staging | staging.dashboard-velo.com | Tests pré-production |
| Production | dashboard-velo.com | Environnement live |

## 3. Infrastructure as Code

### 3.1 Terraform

La configuration Infrastructure as Code est gérée via Terraform:

```hcl
# Extrait du fichier principal main.tf

provider "aws" {
  region = "eu-west-3"  # Paris
}

module "vpc" {
  source = "./modules/vpc"
  # Configuration du VPC
}

module "ecs" {
  source = "./modules/ecs"
  depends_on = [module.vpc]
  # Configuration du cluster ECS
}

module "rds" {
  source = "./modules/rds"
  depends_on = [module.vpc]
  # Configuration de la base de données
}

module "s3" {
  source = "./modules/s3"
  # Configuration du bucket S3
}

module "cloudfront" {
  source = "./modules/cloudfront"
  depends_on = [module.s3]
  # Configuration de CloudFront
}
```

### 3.2 CI/CD Pipeline

Le pipeline CI/CD est géré via GitHub Actions:

```yaml
# Extrait du workflow de déploiement .github/workflows/deploy.yml
name: Deploy Dashboard-Velo

on:
  push:
    branches:
      - main
      - staging
      - develop

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run security-audit

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build:prod
      - uses: actions/upload-artifact@v3
        with:
          name: build
          path: build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/download-artifact@v3
        with:
          name: build
          path: build
      - uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-west-3
      # Déploiement sur ECS et S3
```

## 4. Configuration des Conteneurs

### 4.1 Dockerfile Frontend

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:prod

# Image de production
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 4.2 Dockerfile Backend

```dockerfile
# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .

# Arguments d'environnement
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

EXPOSE 3000
CMD ["node", "server.js"]
```

### 4.3 Docker Compose

Pour le développement local:

```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://localhost:3000

  backend:
    build: ./server
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    environment:
      - DATABASE_URL=postgres://user:password@postgres:5432/dbname
      - REDIS_URL=redis://redis:6379
      - PORT=3000
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}

  postgres:
    image: postgres:14
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=dbname
    volumes:
      - postgres-data:/var/lib/postgresql/data

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  redis-data:
```

## 5. Configuration de Base de Données

### 5.1 Migrations

Les migrations sont gérées avec Knex.js:

```javascript
// Exemple de migration (migrations/20250401_initial_schema.js)
exports.up = function(knex) {
  return knex.schema
    .createTable('users', function(table) {
      table.increments('id').primary();
      table.string('email').notNullable().unique();
      table.string('password_hash').notNullable();
      table.string('first_name');
      table.string('last_name');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    })
    .createTable('routes', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.text('description');
      table.float('distance');
      table.integer('elevation_gain');
      table.integer('user_id').references('id').inTable('users');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('routes')
    .dropTable('users');
};
```

### 5.2 Backups

Stratégie de backup RDS:

- Snapshots automatiques quotidiens
- Rétention de 7 jours
- Backup complet hebdomadaire avec rétention de 30 jours
- Stockage chiffré des backups

## 6. Configuration de Sécurité

### 6.1 Gestion des Secrets

Les secrets sont gérés via AWS Secrets Manager:

```javascript
// Exemple d'accès aux secrets dans le code
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager({
  region: process.env.AWS_REGION || 'eu-west-3'
});

async function getDatabaseCredentials() {
  const data = await secretsManager.getSecretValue({
    SecretId: 'dashboard-velo/database'
  }).promise();
  
  return JSON.parse(data.SecretString);
}
```

### 6.2 Gestion des SSL/TLS

Certificats gérés via AWS Certificate Manager avec renouvellement automatique.

### 6.3 Règles WAF

AWS WAF est configuré avec les règles suivantes:

- Protection contre les injections SQL
- Protection contre les attaques XSS
- Rate limiting (max 1000 requêtes par IP par 5 minutes)
- Blocage des IPs malveillantes connues
- Géo-restriction (si nécessaire)

## 7. Surveillance et Logs

### 7.1 CloudWatch

Métriques surveillées:

- CPU et mémoire des conteneurs ECS
- Requêtes HTTP (statut, latence)
- Performance de la base de données
- Erreurs d'application

### 7.2 Logs

Configuration de logs centralisés:

```
Frontend Logs → CloudWatch Logs
Backend Logs → CloudWatch Logs
  └─ Analysés via CloudWatch Insights
  └─ Alertes configurées pour les erreurs
```

## 8. Scaling et Haute Disponibilité

### 8.1 Auto Scaling

Configuration d'Auto Scaling pour ECS:

```hcl
# Extrait de la configuration Terraform
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.main.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_policy_cpu" {
  name               = "cpu-auto-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value = 70.0
  }
}
```

### 8.2 Multi-AZ

Déploiement sur plusieurs zones de disponibilité:

- Services ECS répartis sur 3 AZ
- Base de données RDS en configuration Multi-AZ
- ElastiCache Redis en mode cluster avec réplication

## 9. CDN et Optimisation de Livraison

### 9.1 Configuration CloudFront

```hcl
# Extrait de configuration CloudFront via Terraform
resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.frontend.id}"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }
  
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  
  # Cache policy
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.frontend.id}"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }
  
  # Gestion des SPA et routing React
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }
  
  # Restrictions géographiques si nécessaire
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  # Certificat SSL
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
```

### 9.2 Headers Cache et Compression

```nginx
# Extrait de la configuration Nginx pour le frontend
server {
    listen 80;
    server_name dashboard-velo.com;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_min_length 256;
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|otf)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }
    
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

## 10. Stratégie de Déploiement

### 10.1 Canary Releases

Configuration des déploiements Canary avec AWS CodeDeploy:

```yaml
# appspec.yml
version: 0.0
Resources:
  - TargetService:
      Type: AWS::ECS::Service
      Properties:
        TaskDefinition: <TASK_DEFINITION>
        LoadBalancerInfo:
          ContainerName: "dashboard-velo-container"
          ContainerPort: 80
        PlatformVersion: "LATEST"

Hooks:
  - BeforeInstall: "LambdaFunctionToValidateBeforeInstall"
  - AfterInstall: "LambdaFunctionToValidateDeployment"
  - AfterAllowTestTraffic: "LambdaFunctionToValidateTestTraffic"
  - BeforeAllowTraffic: "LambdaFunctionToFinalizeBeforeTraffic"
  - AfterAllowTraffic: "LambdaFunctionToMonitorAfterDeployment"
```

### 10.2 Blue/Green vs. Rolling Updates

Dashboard-Velo utilise des déploiements Blue/Green pour les mises à jour majeures et des Rolling Updates pour les correctifs mineurs:

| Type de Mise à Jour | Stratégie |
|---------------------|-----------|
| Majeures (refonte UI, changements DB) | Blue/Green |
| Mineures (corrections de bugs, petites fonctionnalités) | Rolling Update |
| Hotfixes critiques | Déploiement direct |

### 10.3 Rollback Strategy

Processus de rollback automatisé en cas d'échec des tests post-déploiement:

```javascript
// Extrait du script de surveillance post-déploiement
async function monitorDeployment() {
  const errorThreshold = 0.05; // 5% taux d'erreur acceptable
  
  // Vérifier les métriques pendant 15 minutes après le déploiement
  const metrics = await getDeploymentMetrics();
  
  if (metrics.errorRate > errorThreshold || 
      metrics.latencyP95 > 500 || 
      metrics.availabilityPercent < 99.9) {
    
    console.log(`Métriques inacceptables: ${JSON.stringify(metrics)}`);
    
    // Déclencher le rollback
    await triggerRollback();
    
    return false;
  }
  
  return true;
}
```

## 11. Variables d'Environnement

### 11.1 Structure des Variables

| Variable | Dev | Staging | Production |
|----------|-----|---------|------------|
| NODE_ENV | development | staging | production |
| API_URL | http://localhost:3000 | https://api.staging.dashboard-velo.com | https://api.dashboard-velo.com |
| LOG_LEVEL | debug | info | warn |
| DB_HOST | localhost | dashboard-velo-staging.xxxx.eu-west-3.rds.amazonaws.com | dashboard-velo-prod.xxxx.eu-west-3.rds.amazonaws.com |

### 11.2 Gestion des Environnements

Utilisation de fichiers .env par environnement, avec des valeurs déployées via CI/CD:

```
.env.development
.env.staging
.env.production
```

## 12. Domaines et DNS

### 12.1 Configuration DNS

```
# Zones DNS Route53
dashboard-velo.com

# Enregistrements
dashboard-velo.com → CloudFront
www.dashboard-velo.com → CloudFront (redirection)
api.dashboard-velo.com → ALB
staging.dashboard-velo.com → CloudFront Staging
api.staging.dashboard-velo.com → ALB Staging
```

### 12.2 Certificats SSL

Gestion des certificats via AWS Certificate Manager:

- Wildcard: *.dashboard-velo.com
- Spécifiques: dashboard-velo.com, www.dashboard-velo.com

## 13. Procédure de Déploiement

### 13.1 Déploiement Initial

```bash
# 1. Provisionnement de l'infrastructure
cd terraform/
terraform init
terraform plan
terraform apply

# 2. Configuration de la base de données
npm run migrate:up

# 3. Déploiement des services
./scripts/deploy.sh
```

### 13.2 Mises à Jour

```bash
# 1. Mise à jour du code source
git pull origin main

# 2. Mise à jour des dépendances
npm ci

# 3. Build
npm run build:prod

# 4. Déploiement via CI/CD
git push origin main  # Déclenche le workflow GitHub Actions
```

## 14. Contacts et Responsabilités

| Rôle | Nom | Contact |
|------|-----|---------|
| DevOps Lead | Marie Dupont | marie@dashboard-velo.com |
| Backend Lead | Thomas Martin | thomas@dashboard-velo.com |
| Frontend Lead | Sophie Bernard | sophie@dashboard-velo.com |
| Responsable Infrastructure | Paul Dubois | paul@dashboard-velo.com |

## 15. Références

- [Documentation AWS ECS](https://docs.aws.amazon.com/ecs/latest/developerguide/Welcome.html)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Knex.js Migrations](https://knexjs.org/#Migrations)
