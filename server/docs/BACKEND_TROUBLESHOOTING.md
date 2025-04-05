# Guide de dépannage du backend

Ce document fournit des instructions pour diagnostiquer et résoudre les problèmes courants rencontrés dans le backend de Dashboard-Velo.com.

## Problèmes d'authentification

### Tokens expirés ou invalides

**Symptômes :**
- Messages d'erreur "Token expiré" ou "Token invalide"
- Déconnexions inattendues des utilisateurs
- Erreurs 401 dans les journaux

**Causes possibles :**
1. Horloge du serveur désynchronisée
2. Problème avec la rotation des clés JWT
3. Période de grâce trop courte

**Solutions :**
1. Vérifier la synchronisation de l'horloge du serveur
   ```bash
   ntpdate -q pool.ntp.org
   ```
2. Vérifier les journaux de rotation des clés JWT
   ```bash
   grep "Rotation JWT" /path/to/logs/server.log
   ```
3. Augmenter la période de grâce dans la configuration
   ```javascript
   // Dans api.config.js
   auth: {
     gracePeriod: 60 * 60 * 1000 // 1 heure
   }
   ```
4. Vérifier les métriques d'authentification
   ```bash
   curl -X GET http://localhost:3000/api/admin/auth/metrics -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

### Problèmes d'empreinte client

**Symptômes :**
- Erreurs "Empreinte client invalide"
- Utilisateurs forcés de se reconnecter fréquemment
- Augmentation des activités suspectes dans les métriques

**Causes possibles :**
1. Validation trop stricte des empreintes
2. Mises à jour de navigateur modifiant les caractéristiques
3. Utilisateurs derrière des proxys ou VPN changeants

**Solutions :**
1. Assouplir les paramètres de validation des empreintes
   ```javascript
   // Dans auth.service.js
   isFingerprintValid(storedFingerprint, currentFingerprint, threshold = 0.7)
   ```
2. Augmenter le nombre de tentatives autorisées
   ```javascript
   // Dans auth.service.js
   this.maxFingerPrintAttempts = 15;
   ```
3. Vérifier les journaux pour identifier les modèles d'échec
   ```bash
   grep "Empreinte client invalide" /path/to/logs/server.log
   ```

## Problèmes avec les services externes

### Erreurs d'API OpenRoute

**Symptômes :**
- Échecs de calcul d'itinéraire
- Erreurs 401/403 lors des appels à OpenRoute
- Messages "Clé API invalide" dans les journaux

**Causes possibles :**
1. Clé API expirée ou invalide
2. Limite de quota atteinte
3. Problème de rotation des clés API

**Solutions :**
1. Vérifier l'état des clés API
   ```bash
   node -e "const apiServices = require('./server/services/apiServices'); apiServices.openRouteService.checkAllKeys().then(console.log)"
   ```
2. Forcer une rotation des clés API
   ```bash
   curl -X POST http://localhost:3000/api/admin/services/rotate-keys -H "Authorization: Bearer YOUR_ADMIN_TOKEN" -d '{"service":"openRouteService"}'
   ```
3. Vérifier les quotas d'utilisation
   ```bash
   curl -X GET http://localhost:3000/api/admin/services/usage -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```
4. Exécuter le test d'intégration pour OpenRoute
   ```bash
   node server/scripts/api-key-integration-test.js --service=openRouteService
   ```
5. Vérifier les paramètres de retry et de backoff
   ```javascript
   // Dans openroute.service.js
   this.retryConfig = {
     maxRetries: 5,
     initialDelay: 1000,
     maxDelay: 30000,
     factor: 2
   };
   ```
6. Inspecter les erreurs spécifiques dans les journaux
   ```bash
   grep "OpenRoute API error" /path/to/logs/server.log | tail -50
   ```

### Problèmes avec Strava API

**Symptômes :**
- Échecs de synchronisation des activités
- Erreurs 401 lors des appels à Strava
- Déconnexions fréquentes de Strava

**Causes possibles :**
1. Token d'accès Strava expiré
2. Révocation de l'autorisation par l'utilisateur
3. Changements dans l'API Strava
4. Limites de taux dépassées

**Solutions :**
1. Vérifier l'état des connexions Strava
   ```bash
   curl -X GET http://localhost:3000/api/admin/strava/connections -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```
2. Forcer un rafraîchissement des tokens Strava
   ```bash
   curl -X POST http://localhost:3000/api/admin/strava/refresh-all -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```
3. Vérifier les journaux pour les erreurs spécifiques à Strava
   ```bash
   grep "Strava API" /path/to/logs/server.log
   ```
4. Vérifier les limites de taux actuelles
   ```bash
   curl -X GET http://localhost:3000/api/admin/strava/rate-limits -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```
5. Réinitialiser les connexions problématiques
   ```bash
   curl -X POST http://localhost:3000/api/admin/strava/reset-connection -H "Authorization: Bearer YOUR_ADMIN_TOKEN" -d '{"userId":"USER_ID"}'
   ```
6. Vérifier les webhooks Strava
   ```bash
   curl -X GET http://localhost:3000/api/admin/strava/webhooks -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```
7. Exécuter le test d'intégration pour Strava
   ```bash
   node server/scripts/api-key-integration-test.js --service=stravaService
   ```

### Problèmes avec OpenWeatherMap API

**Symptômes :**
- Données météo manquantes ou obsolètes
- Erreurs 401/403 dans les journaux
- Temps de réponse lents pour les requêtes météo

**Causes possibles :**
1. Clé API expirée ou invalide
2. Quota d'appels dépassé
3. Problèmes de géolocalisation
4. Cache météo corrompu

**Solutions :**
1. Vérifier l'état des clés API
   ```bash
   node -e "const apiServices = require('./server/services/apiServices'); apiServices.weatherService.checkAllKeys().then(console.log)"
   ```
2. Forcer une rotation des clés API
   ```bash
   curl -X POST http://localhost:3000/api/admin/services/rotate-keys -H "Authorization: Bearer YOUR_ADMIN_TOKEN" -d '{"service":"weatherService"}'
   ```
3. Vérifier les quotas d'utilisation
   ```bash
   curl -X GET http://localhost:3000/api/admin/services/usage -H "Authorization: Bearer YOUR_ADMIN_TOKEN" | grep weather
   ```
4. Vider le cache météo
   ```bash
   curl -X POST http://localhost:3000/api/admin/cache/clear -H "Authorization: Bearer YOUR_ADMIN_TOKEN" -d '{"pattern":"weather:*"}'
   ```
5. Vérifier la précision des coordonnées géographiques
   ```bash
   grep "Invalid coordinates" /path/to/logs/server.log
   ```
6. Exécuter le test d'intégration pour OpenWeatherMap
   ```bash
   node server/scripts/api-key-integration-test.js --service=weatherService
   ```
7. Vérifier les paramètres de mise en cache
   ```javascript
   // Dans weather.service.js
   this.cacheConfig = {
     ttl: 30 * 60 * 1000, // 30 minutes
     staleWhileRevalidate: true
   };
   ```

### Problèmes avec Mapbox API

**Symptômes :**
- Cartes non chargées ou incomplètes
- Erreurs de géocodage
- Données d'élévation manquantes
- Erreurs 401/403 dans les journaux

**Causes possibles :**
1. Clé API expirée ou invalide
2. Quota d'utilisation dépassé
3. Problèmes de format des coordonnées
4. Restrictions régionales

**Solutions :**
1. Vérifier l'état des clés API
   ```bash
   node -e "const apiServices = require('./server/services/apiServices'); apiServices.mapboxService.checkAllKeys().then(console.log)"
   ```
2. Forcer une rotation des clés API
   ```bash
   curl -X POST http://localhost:3000/api/admin/services/rotate-keys -H "Authorization: Bearer YOUR_ADMIN_TOKEN" -d '{"service":"mapboxService"}'
   ```
3. Vérifier les quotas d'utilisation
   ```bash
   curl -X GET http://localhost:3000/api/admin/services/usage -H "Authorization: Bearer YOUR_ADMIN_TOKEN" | grep mapbox
   ```
4. Tester les requêtes de géocodage
   ```bash
   curl -X GET "http://localhost:3000/api/debug/mapbox/geocode?query=Paris,France" -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```
5. Vérifier le format des coordonnées dans les journaux
   ```bash
   grep "Invalid coordinates format" /path/to/logs/server.log
   ```
6. Exécuter le test d'intégration pour Mapbox
   ```bash
   node server/scripts/api-key-integration-test.js --service=mapboxService
   ```
7. Vérifier les restrictions régionales
   ```bash
   curl -X GET "http://localhost:3000/api/admin/mapbox/account-info" -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

### Problèmes avec OpenAI API

**Symptômes :**
- Échecs de génération de contenu
- Erreurs 401/429 dans les journaux
- Temps de réponse très longs
- Contenu généré de mauvaise qualité

**Causes possibles :**
1. Clé API expirée ou invalide
2. Quota d'utilisation dépassé ou limite de taux
3. Problèmes de modération de contenu
4. Paramètres de requête incorrects

**Solutions :**
1. Vérifier l'état des clés API
   ```bash
   node -e "const apiServices = require('./server/services/apiServices'); apiServices.openaiService.checkAllKeys().then(console.log)"
   ```
2. Forcer une rotation des clés API
   ```bash
   curl -X POST http://localhost:3000/api/admin/services/rotate-keys -H "Authorization: Bearer YOUR_ADMIN_TOKEN" -d '{"service":"openaiService"}'
   ```
3. Vérifier les quotas et limites de taux
   ```bash
   curl -X GET http://localhost:3000/api/admin/services/usage -H "Authorization: Bearer YOUR_ADMIN_TOKEN" | grep openai
   ```
4. Tester la modération de contenu
   ```bash
   curl -X POST "http://localhost:3000/api/debug/openai/moderate" -H "Authorization: Bearer YOUR_ADMIN_TOKEN" -d '{"content":"Texte à modérer"}'
   ```
5. Vérifier les paramètres de requête
   ```bash
   grep "OpenAI API parameter error" /path/to/logs/server.log
   ```
6. Exécuter le test d'intégration pour OpenAI
   ```bash
   node server/scripts/api-key-integration-test.js --service=openaiService
   ```
7. Ajuster les paramètres de timeout
   ```javascript
   // Dans openai.service.js
   this.requestConfig = {
     timeout: 60000, // 60 secondes
     maxRetries: 3
   };
   ```
8. Vérifier les journaux de modération
   ```bash
   grep "Content flagged by moderation" /path/to/logs/server.log
   ```

## Problèmes d'authentification avancés

### Échecs de validation d'empreinte partielle

**Symptômes :**
- Taux élevé d'échecs de validation d'empreinte
- Utilisateurs signalant des déconnexions fréquentes
- Erreurs "Seuil d'empreinte non atteint" dans les journaux

**Causes possibles :**
1. Seuil de validation trop élevé
2. Attributs d'empreinte instables sélectionnés
3. Changements fréquents d'environnement utilisateur

**Solutions :**
1. Ajuster le seuil de validation d'empreinte
   ```javascript
   // Dans auth.service.js
   this.fingerprintThreshold = 0.6; // Réduire à 60% de correspondance
   ```
2. Privilégier les attributs stables
   ```javascript
   // Dans auth.service.js
   this.stableAttributes = ['userAgent', 'language', 'colorDepth', 'deviceMemory', 'hardwareConcurrency'];
   this.stableAttributesWeight = 0.7; // Donner plus de poids aux attributs stables
   ```
3. Analyser les modèles d'échec
   ```bash
   node server/scripts/analyze-fingerprint-failures.js --days=7
   ```
4. Mettre à jour la logique de détection des changements légitimes
   ```javascript
   // Dans auth.service.js
   isLegitimateChange(oldFingerprint, newFingerprint) {
     // Logique améliorée pour détecter les mises à jour de navigateur, etc.
   }
   ```
5. Augmenter la période de grâce après les changements détectés
   ```javascript
   // Dans auth.service.js
   this.fingerprintGracePeriod = 7 * 24 * 60 * 60 * 1000; // 7 jours
   ```

### Problèmes de rotation des tokens JWT

**Symptômes :**
- Erreurs "Token invalide mais dans la période de grâce"
- Échecs de rotation automatique des tokens
- Augmentation des déconnexions après une période d'inactivité

**Causes possibles :**
1. Configuration incorrecte de la période de grâce
2. Problèmes avec le stockage des tokens côté client
3. Bugs dans la logique de rotation
4. Désynchronisation entre frontend et backend

**Solutions :**
1. Vérifier la configuration de rotation des tokens
   ```javascript
   // Dans enhanced-jwt-rotation.js
   this.rotationConfig = {
     gracePeriod: 10 * 60 * 1000, // Augmenter à 10 minutes
     renewBeforeExpiration: 15 * 60 * 1000, // Renouveler 15 minutes avant expiration
     forceRotationAfter: 12 * 60 * 60 * 1000 // Forcer la rotation après 12 heures
   };
   ```
2. Analyser les journaux de rotation
   ```bash
   grep "JWT rotation" /path/to/logs/server.log | tail -100
   ```
3. Vérifier l'implémentation côté client
   ```bash
   # Vérifier les logs côté client
   grep "Token refresh" /path/to/frontend/logs/app.log
   ```
4. Tester manuellement la rotation
   ```bash
   curl -X POST http://localhost:3000/api/auth/refresh -H "Authorization: Bearer YOUR_TOKEN"
   ```
5. Exécuter les tests de rotation JWT
   ```bash
   node server/scripts/api-key-integration-test.js --test=jwtRotation
   ```
6. Vérifier la synchronisation des horloges
   ```bash
   node -e "console.log('Décalage serveur:', Math.abs(Date.now() - new Date().getTime()))"
   ```

### Révocation sélective des tokens

**Symptômes :**
- Certains tokens continuent de fonctionner après révocation
- Utilisateurs non déconnectés de tous les appareils comme prévu
- Erreurs "Token révoqué" incohérentes

**Causes possibles :**
1. Problèmes avec le stockage des révocations
2. Nettoyage prématuré des entrées de révocation
3. Propagation lente des révocations entre instances

**Solutions :**
1. Vérifier le stockage des révocations
   ```bash
   node -e "const { getRevocationStore } = require('./server/services/auth.service'); console.log(getRevocationStore().getAll())"
   ```
2. Ajuster la durée de conservation des révocations
   ```javascript
   // Dans auth.service.js
   this.revocationTTL = 30 * 24 * 60 * 60 * 1000; // 30 jours
   ```
3. Forcer une synchronisation des révocations
   ```bash
   curl -X POST http://localhost:3000/api/admin/auth/sync-revocations -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```
4. Vérifier les journaux de révocation
   ```bash
   grep "Token revocation" /path/to/logs/server.log
   ```
5. Tester la révocation sélective
   ```bash
   curl -X POST http://localhost:3000/api/admin/auth/revoke -H "Authorization: Bearer YOUR_ADMIN_TOKEN" -d '{"userId":"USER_ID","tokenId":"TOKEN_ID"}'
   ```
6. Vérifier la propagation entre instances
   ```bash
   curl -X GET http://localhost:3000/api/admin/auth/revocation-status -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

### Problèmes de mise en cache des validations

**Symptômes :**
- Charge CPU élevée lors des pics d'authentification
- Validations redondantes dans les journaux
- Incohérences dans la validation des tokens

**Causes possibles :**
1. Cache mal configuré ou désactivé
2. Clé de cache incorrecte
3. Invalidation prématurée du cache

**Solutions :**
1. Vérifier la configuration du cache
   ```javascript
   // Dans auth.service.js
   this.tokenValidationCache = {
     enabled: true,
     ttl: 30 * 1000, // 30 secondes
     maxSize: 10000
   };
   ```
2. Surveiller les performances du cache
   ```bash
   curl -X GET http://localhost:3000/api/admin/metrics/cache/auth -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```
3. Vérifier les journaux de validation
   ```bash
   grep "Token validation" /path/to/logs/server.log | wc -l
   ```
4. Tester les performances avec et sans cache
   ```bash
   # Désactiver temporairement le cache
   curl -X POST http://localhost:3000/api/admin/auth/toggle-validation-cache -H "Authorization: Bearer YOUR_ADMIN_TOKEN" -d '{"enabled":false}'
   
   # Réactiver le cache
   curl -X POST http://localhost:3000/api/admin/auth/toggle-validation-cache -H "Authorization: Bearer YOUR_ADMIN_TOKEN" -d '{"enabled":true}'
   ```
5. Ajuster la stratégie de mise en cache
   ```javascript
   // Dans auth.service.js
   generateCacheKey(token) {
     // Utiliser un hash du token plutôt que le token complet
     return crypto.createHash('sha256').update(token).digest('hex');
   }
   ```

{{ ... }}
