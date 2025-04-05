# Guide de dépannage - Système de cache distribué

Ce document fournit des solutions aux problèmes courants rencontrés avec le système de cache distribué de Dashboard-Velo.

## Table des matières

1. [Problèmes de connexion Redis](#problèmes-de-connexion-redis)
2. [Problèmes de performance](#problèmes-de-performance)
3. [Problèmes de cohérence des données](#problèmes-de-cohérence-des-données)
4. [Erreurs de compression/décompression](#erreurs-de-compressiondécompression)
5. [Problèmes de mémoire](#problèmes-de-mémoire)
6. [Surveillance et métriques](#surveillance-et-métriques)
7. [Scénarios de reprise après sinistre](#scénarios-de-reprise-après-sinistre)

## Problèmes de connexion Redis

### Symptômes
- Messages d'erreur : `Redis connection failed` ou `ECONNREFUSED`
- Latence élevée des requêtes API
- Métriques indiquant un taux élevé de fallbacks sur le cache local

### Solutions
1. **Vérifier la configuration Redis**
   ```javascript
   // Vérifier dans .env ou config.js
   REDIS_URL=redis://localhost:6379
   REDIS_PASSWORD=your_password
   ```

2. **Vérifier que Redis est en cours d'exécution**
   ```bash
   # Vérifier le statut du service Redis
   systemctl status redis
   
   # Ou pour Docker
   docker ps | grep redis
   ```

3. **Tester la connexion manuellement**
   ```bash
   redis-cli ping
   # Devrait répondre PONG
   ```

4. **Vérifier les logs Redis**
   ```bash
   tail -f /var/log/redis/redis-server.log
   ```

5. **Redémarrer Redis si nécessaire**
   ```bash
   systemctl restart redis
   # Ou pour Docker
   docker restart redis
   ```

6. **Vérifier les paramètres de reconnexion**
   ```javascript
   // Dans distributed-cache.js
   this.options.reconnectStrategy = {
     retries: 10,
     minDelay: 1000,
     maxDelay: 30000
   };
   ```

## Problèmes de performance

### Symptômes
- Temps de réponse élevés malgré l'utilisation du cache
- Utilisation CPU élevée
- Métriques indiquant un faible taux de hits du cache

### Solutions
1. **Vérifier les métriques de performance**
   ```javascript
   // Endpoint de monitoring
   GET /api/monitoring/cache
   ```

2. **Optimiser les clés de cache**
   - Vérifier que les clés sont bien structurées et spécifiques
   - Éviter les clés trop génériques qui pourraient causer des collisions

3. **Ajuster les paramètres de compression**
   ```javascript
   // Dans distributed-cache.js
   this.options.compression = true;
   this.options.compressionThreshold = 1024; // Octets
   ```

4. **Vérifier la configuration Redis**
   ```bash
   # Vérifier la configuration de maxmemory et la politique d'éviction
   redis-cli CONFIG GET maxmemory
   redis-cli CONFIG GET maxmemory-policy
   
   # Recommandé pour un cache : volatile-lru ou allkeys-lru
   redis-cli CONFIG SET maxmemory-policy volatile-lru
   ```

5. **Utiliser Redis Cluster pour la mise à l'échelle**
   - Configurer Redis en mode cluster pour répartir la charge
   - Mettre à jour la configuration de connexion dans l'application

## Problèmes de cohérence des données

### Symptômes
- Données obsolètes ou incorrectes
- Incohérences entre les utilisateurs ou les régions

### Solutions
1. **Vérifier les TTL**
   ```javascript
   // Dans distributed-cache.js
   const ttl = this.getTTL(dataType, region);
   console.log(`TTL for ${dataType} in ${region}: ${ttl}s`);
   ```

2. **Forcer l'invalidation du cache**
   ```javascript
   // Endpoint d'administration
   POST /api/admin/cache/invalidate
   {
     "pattern": "cols:*",
     "region": "western-europe"
   }
   ```

3. **Vérifier les stratégies de mise à jour**
   - S'assurer que les données sont correctement invalidées lors des mises à jour
   - Implémenter un mécanisme de versionnage des données si nécessaire

4. **Synchroniser les caches locaux et Redis**
   ```javascript
   // Méthode pour synchroniser
   await distributedCache.synchronize();
   ```

## Erreurs de compression/décompression

### Symptômes
- Erreurs : `Error decompressing data` ou `Invalid compressed data`
- Augmentation des métriques `decompressionErrors`

### Solutions
1. **Vérifier les données stockées dans Redis**
   ```bash
   # Examiner une clé spécifique
   redis-cli --raw GET "dashboardvelo:cols:col-123"
   ```

2. **Désactiver temporairement la compression**
   ```javascript
   // Dans distributed-cache.js
   this.options.compression = false;
   ```

3. **Vider le cache et le reconstruire**
   ```javascript
   // Endpoint d'administration
   POST /api/admin/cache/clear
   ```

4. **Vérifier les versions de zlib**
   - S'assurer que la même version de zlib est utilisée sur tous les serveurs

## Problèmes de mémoire

### Symptômes
- Erreurs : `JavaScript heap out of memory`
- Augmentation constante de l'utilisation de la mémoire
- Redis signalant `OOM command not allowed`

### Solutions
1. **Ajuster les limites de mémoire Node.js**
   ```bash
   # Augmenter la limite de mémoire
   NODE_OPTIONS="--max-old-space-size=4096" npm start
   ```

2. **Optimiser la taille des objets mis en cache**
   - Réduire la taille des objets en supprimant les champs inutiles
   - Utiliser des formats plus compacts (par exemple, GeoJSON simplifié)

3. **Ajuster la configuration Redis**
   ```bash
   # Définir une limite de mémoire appropriée
   redis-cli CONFIG SET maxmemory 2gb
   ```

4. **Implémenter un nettoyage périodique**
   ```javascript
   // Dans le planificateur de tâches
   setInterval(() => {
     distributedCache.pruneStaleEntries();
   }, 3600000); // Toutes les heures
   ```

## Surveillance et métriques

### Comment surveiller efficacement
1. **Endpoint de métriques**
   ```
   GET /api/monitoring/cache
   ```

2. **Métriques clés à surveiller**
   - Taux de hit/miss (global et par région)
   - Temps de réponse moyen
   - Taille du cache
   - Erreurs de connexion Redis
   - Erreurs de compression/décompression

3. **Intégration avec Prometheus/Grafana**
   - Exporter les métriques au format Prometheus
   - Créer des tableaux de bord Grafana pour visualiser les tendances

4. **Alertes**
   - Configurer des alertes pour les situations critiques :
     - Taux de hit inférieur à 70%
     - Erreurs de connexion Redis répétées
     - Latence élevée persistante

## Scénarios de reprise après sinistre

### Panne complète de Redis
1. **Fallback automatique**
   - Le système basculera automatiquement vers le cache local
   - Les performances seront réduites mais le système restera fonctionnel

2. **Restauration**
   ```javascript
   // Une fois Redis restauré, le système se reconnectera automatiquement
   // Pour forcer une reconnexion
   await distributedCache.reconnect();
   ```

3. **Reconstruction du cache**
   ```javascript
   // Endpoint d'administration
   POST /api/admin/cache/rebuild
   {
     "priority": ["cols", "routes", "weather"]
   }
   ```

### Corruption des données
1. **Effacer le cache corrompu**
   ```javascript
   // Effacer des clés spécifiques
   await distributedCache.del("pattern:*");
   ```

2. **Restaurer à partir des données sources**
   ```javascript
   // Endpoint d'administration
   POST /api/admin/cache/rebuild
   {
     "dataTypes": ["cols", "routes"],
     "region": "all"
   }
   ```

## Maintenance préventive

1. **Vérifications régulières**
   ```bash
   # Vérifier l'état de Redis
   redis-cli INFO
   
   # Vérifier les statistiques de mémoire
   redis-cli INFO memory
   ```

2. **Nettoyage périodique**
   - Programmer un nettoyage hebdomadaire des données rarement utilisées
   - Mettre en place une rotation des logs

3. **Tests de charge réguliers**
   ```bash
   # Exécuter les tests de charge
   k6 run server/tests/performance/cache-load-tests.js
   ```

4. **Sauvegardes Redis**
   ```bash
   # Configurer des sauvegardes automatiques
   redis-cli CONFIG SET save "900 1 300 10 60 10000"
   ```

## Ressources supplémentaires

- [Documentation Redis](https://redis.io/documentation)
- [Bonnes pratiques Node.js avec Redis](https://docs.redis.com/latest/rs/references/client_references/client_nodejs/)
- [Optimisation des performances de cache](https://redis.io/topics/latency)
- [Monitoring Redis](https://redis.io/topics/monitoring)

Pour toute assistance supplémentaire, contacter l'équipe DevOps à devops@dashboard-velo.eu
