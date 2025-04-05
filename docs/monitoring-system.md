# Système de Monitoring Dashboard-Velo

## Vue d'ensemble

Le système de monitoring de Dashboard-Velo est conçu pour surveiller les performances, l'utilisation des ressources et les quotas API à l'échelle européenne. Il fournit une visibilité en temps réel sur l'état du système et génère des alertes lorsque des seuils prédéfinis sont dépassés.

**Version :** 1.0.0  
**Date d'implémentation :** Avril 2025  
**Auteur :** Équipe Dashboard-Velo

## Table des matières

1. [Architecture](#1-architecture)
2. [Métriques collectées](#2-métriques-collectées)
3. [Configuration des alertes](#3-configuration-des-alertes)
4. [API de monitoring](#4-api-de-monitoring)
5. [Intégration avec d'autres systèmes](#5-intégration-avec-dautres-systèmes)
6. [Mode post-lancement](#6-mode-post-lancement)
7. [Bonnes pratiques](#7-bonnes-pratiques)

## 1. Architecture

Le système de monitoring est implémenté sous forme de module Node.js qui s'intègre au serveur Express principal. Il est composé des éléments suivants :

```
server/
├── utils/
│   ├── monitoring.js         # Module principal de monitoring
│   ├── apiQuotaManager.js    # Gestionnaire de quotas API (intégré avec le monitoring)
│   └── quota-analytics.js    # Analyse des quotas (intégré avec le monitoring)
├── middleware/
│   └── performance-optimization.js  # Middleware d'optimisation des performances
└── routes/
    └── api-dashboard.js      # Routes API pour le monitoring
```

### 1.1 Flux de données

1. Le middleware `requestMonitoringMiddleware` capture les métriques pour chaque requête HTTP
2. Les métriques sont agrégées dans l'objet `metrics` du module de monitoring
3. Des collecteurs périodiques mettent à jour les métriques système et de quota
4. Un vérificateur de seuils génère des alertes lorsque les métriques dépassent les seuils configurés
5. Les endpoints API exposent les métriques et alertes pour l'interface utilisateur du tableau de bord

## 2. Métriques collectées

### 2.1 Métriques système

| Métrique | Description | Unité |
|----------|-------------|-------|
| `cpu` | Utilisation CPU | Pourcentage (0-100) |
| `memory.used` | Mémoire utilisée | Octets |
| `memory.total` | Mémoire totale | Octets |
| `memory.percentage` | Pourcentage de mémoire utilisée | Pourcentage (0-100) |
| `uptime` | Temps d'activité du serveur | Secondes |

### 2.2 Métriques de requêtes

| Métrique | Description |
|----------|-------------|
| `requests.total` | Nombre total de requêtes |
| `requests.success` | Nombre de requêtes réussies |
| `requests.error` | Nombre de requêtes en erreur |
| `requests.byEndpoint` | Métriques par endpoint API |
| `requests.byCountry` | Métriques par pays |
| `requests.byRegion` | Métriques par région européenne |

### 2.3 Métriques de performance

| Métrique | Description | Unité |
|----------|-------------|-------|
| `performance.responseTime.avg` | Temps de réponse moyen | Millisecondes |
| `performance.responseTime.min` | Temps de réponse minimum | Millisecondes |
| `performance.responseTime.max` | Temps de réponse maximum | Millisecondes |
| `performance.byEndpoint` | Métriques de performance par endpoint | Millisecondes |
| `performance.byCountry` | Métriques de performance par pays | Millisecondes |
| `performance.byRegion` | Métriques de performance par région | Millisecondes |

### 2.4 Métriques de quota

| Métrique | Description |
|----------|-------------|
| `quotas.daily.used` | Utilisation du quota journalier |
| `quotas.daily.limit` | Limite du quota journalier |
| `quotas.daily.percentage` | Pourcentage d'utilisation du quota journalier |
| `quotas.hourly.used` | Utilisation du quota horaire |
| `quotas.hourly.limit` | Limite du quota horaire |
| `quotas.hourly.percentage` | Pourcentage d'utilisation du quota horaire |
| `quotas.byCountry` | Utilisation des quotas par pays |
| `quotas.byRegion` | Utilisation des quotas par région |

## 3. Configuration des alertes

### 3.1 Seuils d'alerte globaux

| Seuil | Description | Valeur par défaut |
|-------|-------------|-------------------|
| `cpu` | Seuil d'utilisation CPU | 80% |
| `memory` | Seuil d'utilisation mémoire | 85% |
| `responseTime` | Seuil de temps de réponse | 1000ms |
| `errorRate` | Seuil de taux d'erreur | 5% |
| `quotaUsage` | Seuil d'utilisation de quota | 80% |

### 3.2 Seuils d'alerte par région

| Région | Quota | Erreur |
|--------|-------|--------|
| `western` | 85% | 4% |
| `eastern` | 75% | 6% |
| `northern` | 80% | 5% |
| `southern` | 80% | 5% |
| `central` | 85% | 4% |

### 3.3 Seuils d'alerte par pays

| Pays | Quota | Erreur |
|------|-------|--------|
| `fr` | 90% | 3% |
| `de` | 90% | 3% |
| `it` | 85% | 4% |
| `es` | 85% | 4% |

### 3.4 Types d'alertes

| Type | Description | Niveaux de sévérité |
|------|-------------|---------------------|
| `system` | Alertes liées aux ressources système | `info`, `warning`, `error` |
| `quota` | Alertes liées à l'utilisation des quotas API | `info`, `warning`, `error` |
| `error` | Alertes liées aux taux d'erreur | `warning`, `error` |

## 4. API de monitoring

### 4.1 Endpoints

| Endpoint | Description | Méthode |
|----------|-------------|---------|
| `/api/dashboard/monitoring/metrics` | Récupérer toutes les métriques | GET |
| `/api/dashboard/monitoring/alerts` | Récupérer les alertes actives | GET |

### 4.2 Paramètres de filtrage

Les endpoints de monitoring acceptent les paramètres de filtrage suivants :

| Paramètre | Description | Exemple |
|-----------|-------------|---------|
| `country` | Filtre par pays | `?country=fr` |
| `region` | Filtre par région | `?region=western` |
| `severity` | Filtre par niveau de sévérité (alertes uniquement) | `?severity=warning` |
| `type` | Filtre par type d'alerte (alertes uniquement) | `?type=quota` |

Pour plus de détails sur les formats de réponse, consultez la [documentation API](./api-dashboard.md).

## 5. Intégration avec d'autres systèmes

### 5.1 Intégration avec le gestionnaire de quotas API

Le système de monitoring s'intègre avec le gestionnaire de quotas API (`apiQuotaManager.js`) pour :

- Collecter les métriques d'utilisation des quotas
- Détecter les dépassements de quota
- Générer des alertes en cas d'utilisation élevée

### 5.2 Intégration avec le système de logging

Les alertes générées par le système de monitoring sont automatiquement journalisées via le module de logging (`logger.js`) :

- Les alertes de niveau `warning` sont journalisées avec `logger.warn`
- Les alertes de niveau `error` sont journalisées avec `logger.error`

### 5.3 Intégration avec le middleware d'optimisation des performances

Le système de monitoring s'intègre avec le middleware d'optimisation des performances (`performance-optimization.js`) pour :

- Mesurer l'impact des optimisations sur les temps de réponse
- Ajuster dynamiquement les paramètres d'optimisation en fonction des métriques

## 6. Mode post-lancement

Le système de monitoring inclut un mode spécial "post-lancement" qui peut être activé lors du déploiement d'une nouvelle version :

### 6.1 Caractéristiques du mode post-lancement

- Seuils d'alerte plus stricts pendant une période définie (par défaut : 1 heure)
- Surveillance plus fréquente des métriques
- Notifications immédiates en cas de problème

### 6.2 Configuration du mode post-lancement

| Paramètre | Description | Valeur par défaut |
|-----------|-------------|-------------------|
| `monitoringPeriod` | Durée du mode post-lancement | 3600000ms (1 heure) |
| `thresholds.responseTime` | Seuil de temps de réponse | 800ms |
| `thresholds.errorRate` | Seuil de taux d'erreur | 3% |
| `thresholds.quotaUsage` | Seuil d'utilisation de quota | 70% |

### 6.3 Activation du mode post-lancement

Le mode post-lancement peut être activé en appelant la fonction `initPostLaunchMonitoring()` du module de monitoring :

```javascript
const monitoring = require('./utils/monitoring');
monitoring.initPostLaunchMonitoring();
```

## 7. Bonnes pratiques

### 7.1 Surveillance des métriques

- Consultez régulièrement le tableau de bord de monitoring pour identifier les tendances
- Configurez des notifications pour les alertes critiques
- Analysez les métriques par pays et région pour identifier les problèmes localisés

### 7.2 Réponse aux alertes

| Type d'alerte | Action recommandée |
|---------------|-------------------|
| Utilisation CPU élevée | Vérifier les processus en cours d'exécution, envisager une mise à l'échelle |
| Utilisation mémoire élevée | Vérifier les fuites de mémoire potentielles, redémarrer le serveur si nécessaire |
| Temps de réponse élevé | Vérifier les logs pour identifier les requêtes lentes, optimiser les requêtes problématiques |
| Taux d'erreur élevé | Vérifier les logs d'erreur, corriger les problèmes sous-jacents |
| Utilisation de quota élevée | Ajuster les stratégies de cache, limiter les requêtes non essentielles |

### 7.3 Optimisation des performances

- Utilisez les métriques de performance par endpoint pour identifier les endpoints lents
- Optimisez les endpoints les plus utilisés en priorité
- Ajustez les stratégies de cache en fonction des métriques d'utilisation

## Conclusion

Le système de monitoring de Dashboard-Velo fournit une visibilité complète sur les performances et l'utilisation des ressources à l'échelle européenne. Il permet d'identifier rapidement les problèmes et d'optimiser les performances pour offrir une expérience utilisateur optimale à tous les utilisateurs européens.
