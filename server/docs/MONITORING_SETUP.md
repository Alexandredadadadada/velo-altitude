# Configuration du Monitoring et des Alertes

## Architecture de Monitoring

L'architecture de monitoring mise en place pour Dashboard-Velo.com est basée sur la stack Prometheus-Grafana, complétée par ELK pour la gestion des logs.

### Diagramme d'Architecture

```
+----------------+        +-----------------+        +----------------+
|                |        |                 |        |                |
|  Applications  +------->+   Prometheus    +------->+    Grafana     |
|  (Node.js)     |        |                 |        |                |
|                |        +-----------------+        +----------------+
+-------+--------+                 ^                        ^
        |                          |                        |
        v                          |                        |
+-------+--------+        +--------+---------+     +--------+--------+
|                |        |                  |     |                 |
|    Node        +------->+  Alert Manager   +---->+  Notification   |
|   Exporters    |        |                  |     |   Channels      |
|                |        +------------------+     |                 |
+----------------+                                 +-----------------+
        |
        v
+-------+--------+        +-----------------+        +----------------+
|                |        |                 |        |                |
|  Filebeat      +------->+   Elasticsearch +------->+    Kibana      |
|                |        |                 |        |                |
+----------------+        +-----------------+        +----------------+
```

## Configuration Prometheus

### Installation et Configuration de Base

```yaml
# /etc/prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  scrape_timeout: 10s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']

rule_files:
  - "/etc/prometheus/rules/*.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['app-server-1:9100', 'app-server-2:9100', 'app-server-3:9100']

  - job_name: 'api-servers'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['app-server-1:3000', 'app-server-2:3000', 'app-server-3:3000']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-server:9121']

  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb-server:9216']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-server:9113']
```

### Règles d'Alerte

```yaml
# /etc/prometheus/rules/node_alerts.yml
groups:
- name: node_alerts
  rules:
  - alert: HighCPULoad
    expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High CPU load (instance {{ $labels.instance }})"
      description: "CPU load is > 80%\n  VALUE = {{ $value }}\n  LABELS: {{ $labels }}"

  - alert: CriticalCPULoad
    expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 95
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "Critical CPU load (instance {{ $labels.instance }})"
      description: "CPU load is > 95%\n  VALUE = {{ $value }}\n  LABELS: {{ $labels }}"

  - alert: HighMemoryLoad
    expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory load (instance {{ $labels.instance }})"
      description: "Memory load is > 85%\n  VALUE = {{ $value }}\n  LABELS: {{ $labels }}"

  - alert: CriticalMemoryLoad
    expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 95
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "Critical memory load (instance {{ $labels.instance }})"
      description: "Memory load is > 95%\n  VALUE = {{ $value }}\n  LABELS: {{ $labels }}"

  - alert: HighDiskUsage
    expr: (node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100 > 85
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High disk usage (instance {{ $labels.instance }})"
      description: "Disk usage is > 85%\n  VALUE = {{ $value }}\n  LABELS: {{ $labels }}"
```

```yaml
# /etc/prometheus/rules/api_alerts.yml
groups:
- name: api_alerts
  rules:
  - alert: HighApiLatency
    expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route)) > 0.5
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High API latency (route {{ $labels.route }})"
      description: "95th percentile latency is > 500ms\n  VALUE = {{ $value }}\n  LABELS: {{ $labels }}"

  - alert: HighApiErrorRate
    expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100 > 1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High API error rate"
      description: "Error rate is > 1%\n  VALUE = {{ $value }}\n  LABELS: {{ $labels }}"

  - alert: CriticalApiErrorRate
    expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100 > 5
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "Critical API error rate"
      description: "Error rate is > 5%\n  VALUE = {{ $value }}\n  LABELS: {{ $labels }}"
```

```yaml
# /etc/prometheus/rules/redis_alerts.yml
groups:
- name: redis_alerts
  rules:
  - alert: RedisHighMemoryUsage
    expr: redis_memory_used_bytes / redis_memory_max_bytes * 100 > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Redis high memory usage"
      description: "Redis memory usage is > 80%\n  VALUE = {{ $value }}\n  LABELS: {{ $labels }}"

  - alert: RedisKeyEvictionRate
    expr: rate(redis_evicted_keys_total[5m]) > 10
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "Redis high key eviction rate"
      description: "Redis is evicting keys at a rate of {{ $value }} keys/sec\n  LABELS: {{ $labels }}"
```

## Configuration Grafana

### Dashboards Principaux

#### 1. Dashboard Vue d'Ensemble

Métriques clés :
- Santé globale du système
- Nombre de requêtes par seconde
- Temps de réponse moyen
- Taux d'erreur global
- Utilisation des ressources (CPU, mémoire, disque)

#### 2. Dashboard API Performance

Métriques clés :
- Temps de réponse par endpoint
- Requêtes par seconde par endpoint
- Taux d'erreur par endpoint
- Codes de statut HTTP
- Percentiles de latence (50th, 95th, 99th)

#### 3. Dashboard Redis

Métriques clés :
- Utilisation mémoire
- Opérations par seconde
- Taux de hit/miss du cache
- Clés expirées/évincées
- Connexions clients

#### 4. Dashboard MongoDB

Métriques clés :
- Opérations par seconde (lectures/écritures)
- Temps de réponse des requêtes
- Utilisation mémoire
- Connexions actives
- Verrous et contentions

#### 5. Dashboard Sécurité

Métriques clés :
- Tentatives de connexion échouées
- Requêtes bloquées par rate limiting
- Activités suspectes
- Violations CORS
- Tentatives d'injection

### Configuration des Sources de Données

```yaml
# Prometheus Data Source
name: Prometheus
type: prometheus
url: http://localhost:9090
access: proxy
isDefault: true

# Elasticsearch Data Source
name: Elasticsearch
type: elasticsearch
url: http://localhost:9200
access: proxy
database: "[logstash-]YYYY.MM.DD"
jsonData:
  esVersion: 7.10.0
  timeField: "@timestamp"
```

## Configuration ELK Stack

### Filebeat Configuration

```yaml
# /etc/filebeat/filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/dashboard-velo/*.log
  json.keys_under_root: true
  json.add_error_key: true
  json.message_key: message

output.elasticsearch:
  hosts: ["localhost:9200"]
  index: "dashboard-velo-%{+yyyy.MM.dd}"

setup.kibana:
  host: "localhost:5601"

setup.ilm.enabled: true
setup.ilm.rollover_alias: "dashboard-velo"
setup.ilm.pattern: "{now/d}-000001"
```

### Logstash Configuration

```
# /etc/logstash/conf.d/dashboard-velo.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [json] {
    json {
      source => "message"
      target => "parsed_json"
    }
    
    mutate {
      add_field => {
        "log_level" => "%{[parsed_json][level]}"
        "service" => "%{[parsed_json][service]}"
        "trace_id" => "%{[parsed_json][trace_id]}"
      }
    }
  }
  
  geoip {
    source => "[parsed_json][client_ip]"
    target => "geoip"
  }
  
  date {
    match => [ "[parsed_json][timestamp]", "ISO8601" ]
    target => "@timestamp"
  }
}

output {
  elasticsearch {
    hosts => ["localhost:9200"]
    index => "dashboard-velo-%{+YYYY.MM.dd}"
  }
}
```

## Instrumentation de l'Application

### Middleware Express pour Prometheus

```javascript
// server/middleware/prometheus.middleware.js
const promClient = require('prom-client');
const responseTime = require('response-time');

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Create custom metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// Register the custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestsTotal);

// Middleware function
function prometheusMiddleware(app) {
  // Endpoint to expose metrics for Prometheus
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  // Use the response time middleware
  app.use(responseTime((req, res, time) => {
    if (req.url !== '/metrics') {
      const route = req.route ? req.route.path : req.url;
      const method = req.method;
      const status = res.statusCode;

      httpRequestsTotal.inc({ method, route, status });
      httpRequestDurationMicroseconds.observe({ method, route, status }, time / 1000);
    }
  }));
}

module.exports = prometheusMiddleware;
```

### Instrumentation Redis

```javascript
// server/services/redis-monitor.service.js
const promClient = require('prom-client');
const redisClient = require('./redis.service').getClient();

// Create a Registry for Redis metrics
const redisRegister = new promClient.Registry();

// Redis operation counter
const redisOperationsTotal = new promClient.Counter({
  name: 'redis_operations_total',
  help: 'Total number of Redis operations',
  labelNames: ['operation', 'status']
});

// Redis operation duration
const redisOperationDuration = new promClient.Histogram({
  name: 'redis_operation_duration_seconds',
  help: 'Duration of Redis operations in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
});

// Redis cache hit/miss counter
const redisCacheHitMiss = new promClient.Counter({
  name: 'redis_cache_hit_miss_total',
  help: 'Total number of Redis cache hits and misses',
  labelNames: ['result', 'cache_type']
});

// Register metrics
redisRegister.registerMetric(redisOperationsTotal);
redisRegister.registerMetric(redisOperationDuration);
redisRegister.registerMetric(redisCacheHitMiss);

// Instrument Redis operations
function instrumentRedisOperation(operation, callback) {
  const startTime = process.hrtime();
  
  return new Promise((resolve, reject) => {
    callback()
      .then(result => {
        const duration = process.hrtime(startTime);
        const durationSeconds = duration[0] + duration[1] / 1e9;
        
        redisOperationsTotal.inc({ operation, status: 'success' });
        redisOperationDuration.observe({ operation }, durationSeconds);
        
        resolve(result);
      })
      .catch(error => {
        redisOperationsTotal.inc({ operation, status: 'error' });
        reject(error);
      });
  });
}

// Record cache hit/miss
function recordCacheResult(result, cacheType) {
  redisCacheHitMiss.inc({ result, cache_type: cacheType });
}

module.exports = {
  instrumentRedisOperation,
  recordCacheResult,
  redisRegister
};
```

## Alertes et Notifications

### Configuration d'AlertManager

```yaml
# /etc/alertmanager/alertmanager.yml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXX'
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alertmanager@dashboard-velo.com'
  smtp_auth_username: 'alerts@dashboard-velo.com'
  smtp_auth_password: 'password'

route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'team-backend'
  routes:
  - match:
      severity: critical
    receiver: 'team-backend-critical'
    continue: true
  - match_re:
      service: redis|mongodb
    receiver: 'team-dba'
  - match_re:
      service: nginx
    receiver: 'team-devops'

receivers:
- name: 'team-backend'
  slack_configs:
  - channel: '#alerts-backend'
    send_resolved: true
    title: '{{ template "slack.default.title" . }}'
    text: '{{ template "slack.default.text" . }}'
  email_configs:
  - to: 'backend-team@dashboard-velo.com'
    send_resolved: true

- name: 'team-backend-critical'
  slack_configs:
  - channel: '#alerts-critical'
    send_resolved: true
    title: '{{ template "slack.default.title" . }}'
    text: '{{ template "slack.default.text" . }}'
  email_configs:
  - to: 'backend-team@dashboard-velo.com,oncall@dashboard-velo.com'
    send_resolved: true
  pagerduty_configs:
  - service_key: 'your_pagerduty_service_key'
    send_resolved: true

- name: 'team-dba'
  slack_configs:
  - channel: '#alerts-dba'
    send_resolved: true
    title: '{{ template "slack.default.title" . }}'
    text: '{{ template "slack.default.text" . }}'
  email_configs:
  - to: 'dba-team@dashboard-velo.com'
    send_resolved: true

- name: 'team-devops'
  slack_configs:
  - channel: '#alerts-devops'
    send_resolved: true
    title: '{{ template "slack.default.title" . }}'
    text: '{{ template "slack.default.text" . }}'
  email_configs:
  - to: 'devops-team@dashboard-velo.com'
    send_resolved: true
```

## Procédures d'Intervention

### Niveaux de Sévérité

| Niveau | Description | Temps de Réponse | Escalade |
|--------|-------------|------------------|----------|
| Info | Information, pas d'action requise | N/A | N/A |
| Warning | Problème potentiel, à surveiller | 4 heures | Non |
| Error | Problème nécessitant une intervention | 1 heure | Après 2 heures |
| Critical | Problème grave affectant le service | 15 minutes | Immédiate |

### Procédure pour Alertes Critiques

1. **Notification** : L'alerte est envoyée via Slack, email et PagerDuty
2. **Accusé de Réception** : L'ingénieur de garde accuse réception dans PagerDuty
3. **Investigation** : Analyse des logs, métriques et traces
4. **Mitigation** : Application des mesures correctives immédiates
5. **Résolution** : Correction complète du problème
6. **Post-Mortem** : Analyse des causes et actions préventives

### Playbooks d'Intervention

#### CPU Élevé
1. Identifier les processus consommant le plus de CPU (`top`, Grafana)
2. Vérifier les logs pour des activités anormales
3. Si nécessaire, redémarrer les services problématiques
4. Si persistant, ajouter des ressources ou scaler horizontalement

#### Mémoire Élevée
1. Identifier les processus consommant le plus de mémoire (`top`, Grafana)
2. Vérifier les fuites mémoire potentielles
3. Redémarrer les services si nécessaire
4. Ajuster les limites de mémoire dans les configurations

#### Latence API Élevée
1. Vérifier les endpoints les plus lents (Grafana)
2. Analyser les requêtes de base de données associées
3. Vérifier la charge du système et des services externes
4. Appliquer des optimisations ou du caching si possible

#### Taux d'Erreur Élevé
1. Identifier les endpoints générant le plus d'erreurs
2. Analyser les logs pour comprendre la cause
3. Vérifier les dépendances externes
4. Appliquer des corrections ou des fallbacks

## Formation et Documentation

### Documentation pour l'Équipe

- Guide d'utilisation des dashboards Grafana
- Interprétation des métriques clés
- Procédures d'intervention pour chaque type d'alerte
- Configuration et maintenance du système de monitoring

### Sessions de Formation

- Formation initiale pour toute l'équipe (2 heures)
- Formation approfondie pour l'équipe de garde (4 heures)
- Exercices de simulation d'incidents (mensuel)
- Revue des alertes et interventions (hebdomadaire)

## Évolution et Maintenance

### Plan de Maintenance

- Revue mensuelle des seuils d'alerte
- Mise à jour trimestrielle des outils de monitoring
- Ajout de nouvelles métriques selon les besoins
- Optimisation des dashboards basée sur le feedback

### Roadmap d'Évolution

1. **Phase 1 (Actuelle)** : Monitoring de base avec Prometheus/Grafana
2. **Phase 2 (Mois 2)** : Intégration du tracing distribué avec Jaeger
3. **Phase 3 (Mois 4)** : Monitoring des expériences utilisateur (RUM)
4. **Phase 4 (Mois 6)** : Intelligence artificielle pour la détection d'anomalies

*Document mis à jour le 5 avril 2025*
*Équipe Backend - Dashboard-Velo.com*
