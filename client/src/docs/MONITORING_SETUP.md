# Configuration du Monitoring - Dashboard-Velo

## 1. Vue d'ensemble

Ce document détaille l'architecture de monitoring mise en place pour Dashboard-Velo, permettant de surveiller les performances, la disponibilité et l'expérience utilisateur de l'application.

## 2. Architecture de Monitoring

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Performance    │     │  Disponibilité  │     │  Expérience     │
│  Monitoring     │     │  Monitoring     │     │  Utilisateur    │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │                       │                       │
┌────────▼────────┐     ┌────────▼────────┐     ┌────────▼────────┐
│  AWS CloudWatch │     │  Prometheus     │     │  Google         │
│  Performance    │     │  Alertmanager   │     │  Analytics 4    │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                       ┌─────────▼─────────┐
                       │   Grafana         │
                       │  (Dashboards)     │
                       └─────────┬─────────┘
                                 │
                       ┌─────────▼─────────┐
                       │   PagerDuty       │
                       │   (Alertes)       │
                       └───────────────────┘
```

## 3. Métriques Surveillées

### 3.1 Infrastructure

| Métrique | Description | Seuil d'alerte | Sévérité |
|----------|-------------|----------------|----------|
| CPU Usage | Utilisation CPU des instances | >80% pendant 5 min | Warning |
| Memory Usage | Utilisation mémoire | >85% pendant 5 min | Warning |
| Disk Space | Espace disque disponible | <15% | Critical |
| Network I/O | Trafic réseau | >80% capacité | Warning |

### 3.2 Application

| Métrique | Description | Seuil d'alerte | Sévérité |
|----------|-------------|----------------|----------|
| Response Time | Temps de réponse API | >500ms (P95) | Warning |
| Error Rate | Taux d'erreurs HTTP 5xx | >1% sur 5 min | Critical |
| Throughput | Requêtes par seconde | >2000 rps | Warning |
| Saturation | Connexions actives | >1000 connexions | Warning |

### 3.3 Base de Données

| Métrique | Description | Seuil d'alerte | Sévérité |
|----------|-------------|----------------|----------|
| DB CPU | Utilisation CPU RDS | >75% pendant 5 min | Warning |
| DB Connections | Nombre de connexions | >80% max connections | Warning |
| Query Performance | Temps de réponse des requêtes | >200ms (P95) | Warning |
| Disk Queue | Longueur de la file d'attente | >10 pendant 5 min | Critical |

### 3.4 Expérience Utilisateur

| Métrique | Description | Seuil d'alerte | Sévérité |
|----------|-------------|----------------|----------|
| LCP | Largest Contentful Paint | >2.5s | Warning |
| FID | First Input Delay | >100ms | Warning |
| CLS | Cumulative Layout Shift | >0.1 | Warning |
| Page Load Time | Temps de chargement complet | >3s | Warning |

## 4. Configuration AWS CloudWatch

### 4.1 Configuration des Métriques

```terraform
# Extrait de la configuration Terraform pour CloudWatch
resource "aws_cloudwatch_metric_alarm" "api_latency_alarm" {
  alarm_name          = "api-latency-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "p95"
  threshold           = "500"
  alarm_description   = "Alarme si la latence P95 dépasse 500ms sur 5 minutes"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  dimensions = {
    ApiName = "dashboard-velo-api"
    Stage   = "prod"
  }
}
```

### 4.2 Logs Application

```json
// Format de logs structurés JSON
{
  "timestamp": "2025-04-05T12:34:56.789Z",
  "level": "info",
  "service": "user-service",
  "message": "Requête traitée avec succès",
  "request_id": "req-12345",
  "user_id": "user-6789",
  "path": "/api/users/profile",
  "method": "GET",
  "status_code": 200,
  "response_time_ms": 45,
  "client_ip": "192.168.1.1"
}
```

### 4.3 Filtres Métriques

```terraform
resource "aws_cloudwatch_log_metric_filter" "error_count" {
  name           = "ErrorCount"
  pattern        = "{ $.level = \"error\" }"
  log_group_name = aws_cloudwatch_log_group.api_logs.name

  metric_transformation {
    name      = "ApiErrorCount"
    namespace = "Dashboard-Velo/Errors"
    value     = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_log_metric_filter" "slow_response" {
  name           = "SlowResponses"
  pattern        = "{ $.response_time_ms > 200 }"
  log_group_name = aws_cloudwatch_log_group.api_logs.name

  metric_transformation {
    name      = "ApiSlowResponseCount"
    namespace = "Dashboard-Velo/Performance"
    value     = "1"
    default_value = "0"
  }
}
```

## 5. Configuration Prometheus

### 5.1 Configuration de Base

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alerts.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

scrape_configs:
  - job_name: 'dashboard-velo-frontend'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['frontend:8080']

  - job_name: 'dashboard-velo-backend'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['backend:3000']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
```

### 5.2 Règles d'Alerte

```yaml
# alerts.yml
groups:
  - name: dashboard-velo-alerts
    rules:
      - alert: HighErrorRate
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Taux d'erreur HTTP élevé"
          description: "Le taux d'erreur HTTP 5xx est > 1% depuis 5 minutes"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Temps de réponse élevé"
          description: "Le temps de réponse P95 est > 500ms depuis 5 minutes"
```

## 6. Instrumentation Application

### 6.1 Backend (Node.js)

```javascript
// Instrumentation Prometheus pour le backend
const express = require('express');
const promClient = require('prom-client');
const app = express();

// Création du registre Prometheus
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Définition des métriques personnalisées
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durée des requêtes HTTP en secondes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 10]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Nombre total de requêtes HTTP',
  labelNames: ['method', 'route', 'status_code']
});

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestsTotal);

// Middleware pour collecter les métriques
app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  
  res.on('finish', () => {
    const route = req.route ? req.route.path : req.path;
    
    end({
      method: req.method,
      route,
      status_code: res.statusCode
    });
    
    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });
  });
  
  next();
});

// Endpoint pour exposer les métriques
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### 6.2 Frontend (React)

```javascript
// web-vitals.js - Instrumentation des Core Web Vitals
import { getCLS, getFID, getLCP } from 'web-vitals';

function sendToAnalytics(metric) {
  // Adapter cette fonction pour envoyer à GA4, CloudWatch ou autre système
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    page: window.location.pathname
  });
  
  // Utiliser l'API Beacon si disponible, sinon fetch
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/metrics', body);
  } else {
    fetch('/api/metrics', {
      body,
      method: 'POST',
      keepalive: true
    });
  }
}

// Monitorer les métriques Core Web Vitals
export function initWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getLCP(sendToAnalytics);
}
```

## 7. Dashboards Grafana

### 7.1 Vue d'ensemble Application

![Application Overview Dashboard](https://example.com/app-dashboard.png)

Variables du dashboard:
- `$environment`: Production, Staging, Dev
- `$service`: Frontend, Backend, Database
- `$timeRange`: Dernière heure, 6 heures, 24 heures, 7 jours

Panels:
1. Disponibilité service (%)
2. Taux d'erreur (%)
3. Temps de réponse (P50, P95, P99)
4. Requêtes par seconde
5. Répartition des codes HTTP
6. Top 10 des endpoints les plus sollicités
7. Erreurs récentes (table)

### 7.2 Performance Infrastructure

Panels:
1. Utilisation CPU par service
2. Utilisation mémoire par service
3. Trafic réseau (entrée/sortie)
4. IOPS disque
5. Utilisation RDS
6. Métriques ElastiCache
7. Métriques ECS/EKS

### 7.3 Expérience Utilisateur

Panels:
1. Web Vitals (LCP, FID, CLS)
2. Temps de chargement par page
3. Sessions utilisateurs
4. Taux de rebond
5. Parcours utilisateur
6. Conversion par funnel
7. Erreurs JavaScript côté client

## 8. Alerting et Notification

### 8.1 Configuration PagerDuty

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'pagerduty-critical'
  routes:
  - match:
      severity: critical
    receiver: 'pagerduty-critical'
  - match:
      severity: warning
    receiver: 'pagerduty-warning'
  - match:
      severity: info
    receiver: 'email-notifications'

receivers:
- name: 'pagerduty-critical'
  pagerduty_configs:
  - service_key: '<SECRET_PD_SERVICE_KEY_CRITICAL>'
    send_resolved: true
    
- name: 'pagerduty-warning'
  pagerduty_configs:
  - service_key: '<SECRET_PD_SERVICE_KEY_WARNING>'
    send_resolved: true
    
- name: 'email-notifications'
  email_configs:
  - to: 'team@dashboard-velo.com'
    from: 'monitoring@dashboard-velo.com'
    smarthost: 'smtp.example.com:587'
    auth_username: '<SMTP_USERNAME>'
    auth_password: '<SMTP_PASSWORD>'
    send_resolved: true
```

### 8.2 Escalades et Astreintes

Niveaux d'escalade:
1. Alerte initiale → Équipe on-call
2. Non-acquittée après 15 min → Lead technique
3. Non-résolue après 45 min → CTO + Équipe élargie

Rotation d'astreinte:
- Semaine 1: Équipe Frontend
- Semaine 2: Équipe Backend
- Semaine 3: Équipe DevOps
- Semaine 4: Équipe Lead

## 9. Collecte et Analyse des Logs

### 9.1 Fluent Bit Configuration

```ini
# fluent-bit.conf
[SERVICE]
    Flush        5
    Log_Level    info
    Daemon       off

[INPUT]
    Name             tail
    Path             /var/log/containers/*.log
    Parser           docker
    Tag              kube.*
    Refresh_Interval 5
    Mem_Buf_Limit    5MB
    Skip_Long_Lines  On

[FILTER]
    Name                kubernetes
    Match               kube.*
    Kube_URL            https://kubernetes.default.svc:443
    Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
    Merge_Log           On
    K8S-Logging.Parser  On
    K8S-Logging.Exclude Off

[OUTPUT]
    Name            cloudwatch
    Match           *
    region          eu-west-3
    log_group_name  dashboard-velo-logs
    log_stream_name ${HOSTNAME}
```

### 9.2 Requêtes CloudWatch Insights

```
# Requête pour trouver les erreurs par API
fields @timestamp, @message, service, user_id, path, status_code
| filter level="error"
| stats count(*) as errorCount by path, status_code
| sort errorCount desc
| limit 20

# Requête pour analyser les temps de réponse
fields @timestamp, path, response_time_ms, method
| filter response_time_ms > 200
| stats 
    min(response_time_ms) as min_time,
    avg(response_time_ms) as avg_time,
    max(response_time_ms) as max_time,
    p90(response_time_ms) as p90_time,
    count(*) as request_count
by path, method
| sort avg_time desc
| limit 20
```

## 10. Real User Monitoring (RUM)

### 10.1 Configuration Google Analytics 4

```javascript
// GA4 Enhanced Measurement Configuration
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

gtag('js', new Date());
gtag('config', 'G-XXXXXXXXXX', {
  'send_page_view': true,
  'cookie_domain': 'dashboard-velo.com',
  'cookie_expires': 63072000, // 2 ans
  'custom_map': {
    'dimension1': 'user_type',
    'dimension2': 'subscription_level',
    'metric1': 'page_load_time',
    'metric2': 'js_errors'
  }
});

// Event personnalisé pour les performances
gtag('event', 'page_performance', {
  'page_load_time': performance.now(),
  'ttfb': window.performance.timing.responseStart - window.performance.timing.navigationStart,
  'dom_load': window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
  'page': window.location.pathname
});
```

### 10.2 Suivi des Erreurs Utilisateur

```javascript
// Capture des erreurs JavaScript côté client
window.addEventListener('error', function(event) {
  gtag('event', 'exception', {
    'description': `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`,
    'fatal': false
  });
  
  // Envoyer également à notre backend pour analyse
  fetch('/api/client-errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error ? event.error.stack : null,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }),
    keepalive: true
  }).catch(console.error);
});
```

## 11. Tests de Surveillance

### 11.1 Synthetic Monitoring

Configuration de tests synthétiques avec AWS CloudWatch Synthetics:

```javascript
// synthetic-canary.js
const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const pageLoadBlueprint = async function() {
  // Configurer le navigateur headless
  const page = await synthetics.getPage();
  
  // Naviguer vers la page d'accueil
  const response = await page.goto('https://dashboard-velo.com', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  
  // Vérifier le statut HTTP
  if (response.status() !== 200) {
    throw `Page non disponible. Statut: ${response.status()}`;
  }
  
  // Vérifier la présence d'éléments clés
  await page.waitForSelector('#main-nav', { timeout: 5000 });
  await page.waitForSelector('#hero-section', { timeout: 5000 });
  
  // Simuler une connexion utilisateur
  await page.click('#login-btn');
  await page.waitForSelector('#login-form', { timeout: 5000 });
  await page.type('#email', 'test@example.com');
  await page.type('#password', 'TestPassword123!');
  await page.click('#submit-login');
  
  // Vérifier la connexion réussie
  await page.waitForSelector('#dashboard-welcome', { timeout: 10000 });
  
  // Capture d'écran
  await synthetics.takeScreenshot('logged-in-dashboard', 'success');
  
  log.info('Test de navigation réussi');
};

exports.handler = async () => {
  return await pageLoadBlueprint();
};
```

### 11.2 Healthchecks

```javascript
// api/health.js
router.get('/health', async (req, res) => {
  try {
    // Vérification de la base de données
    const dbCheck = await checkDatabaseConnection();
    
    // Vérification du cache Redis
    const redisCheck = await checkRedisConnection();
    
    // Vérification des services dépendants
    const dependenciesCheck = await checkExternalDependencies();
    
    // Statut global
    const isHealthy = dbCheck.ok && redisCheck.ok && dependenciesCheck.every(d => d.ok);
    
    const status = isHealthy ? 200 : 503;
    
    res.status(status).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbCheck,
        redis: redisCheck,
        dependencies: dependenciesCheck
      },
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});
```

## 12. Contacts et Responsabilités

| Rôle | Nom | Contact | Responsabilité |
|------|-----|---------|----------------|
| DevOps Lead | Marie Martin | marie@dashboard-velo.com | Infrastructure monitoring |
| Backend Lead | Thomas Dubois | thomas@dashboard-velo.com | API monitoring |
| Frontend Lead | Julie Leroy | julie@dashboard-velo.com | RUM & UX monitoring |
| DB Admin | Paul Bernard | paul@dashboard-velo.com | Database monitoring |
| On-Call Manager | Éric Petit | eric@dashboard-velo.com | PagerDuty & escalades |

## 13. Références

- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [Prometheus Documentation](https://prometheus.io/docs/introduction/overview/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Web Vitals](https://web.dev/vitals/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
