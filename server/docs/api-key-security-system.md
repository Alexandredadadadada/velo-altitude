# Système de Gestion Sécurisée des Clés API

## Introduction

Ce document présente le système de gestion sécurisée des clés API implémenté pour Dashboard-Velo.com. Ce système a été conçu pour répondre aux exigences de sécurité les plus strictes en matière de gestion des clés API, en mettant l'accent sur la confidentialité, l'intégrité et la disponibilité des clés.

## Architecture du Système

Le système de gestion sécurisée des clés API est composé de cinq composants principaux :

1. **SecureMemoryStorage** : Stockage sécurisé des clés en mémoire
2. **SecretManager** : Gestion et validation des secrets
3. **ApiKeyPermissionManager** : Contrôle d'accès basé sur les permissions
4. **EnhancedApiKeyRotationManager** : Rotation automatique des clés
5. **EnhancedApiKeyManager** : Intégration de tous les composants

### Diagramme d'Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    EnhancedApiKeyManager                        │
├─────────────┬──────────────────┬───────────────┬───────────────┤
│ SecureMemory│  SecretManager   │ ApiKeyPermiss │ EnhancedApiKey│
│   Storage   │                  │ ionManager    │ RotationManager│
└─────────────┴──────────────────┴───────────────┴───────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Services                              │
├─────────────┬──────────────────┬───────────────┬───────────────┤
│ OpenRoute   │     Strava       │ WeatherService│    Mapbox     │
│  Service    │                  │               │               │
└─────────────┴──────────────────┴───────────────┴───────────────┘
```

## Composants

### 1. SecureMemoryStorage

Le `SecureMemoryStorage` est responsable du stockage sécurisé des clés API en mémoire. Il utilise le chiffrement AES-256-GCM pour protéger les données sensibles et implémente un mécanisme de TTL (Time-To-Live) pour assurer l'expiration automatique des clés en mémoire.

**Caractéristiques principales :**
- Chiffrement AES-256-GCM
- Expiration automatique des clés (TTL)
- Nettoyage automatique des entrées expirées
- Gestion des erreurs et journalisation

**Exemple d'utilisation :**
```javascript
const SecureMemoryStorage = require('../utils/secure-memory-storage');

// Créer une instance avec une clé de chiffrement
const storage = new SecureMemoryStorage('encryption-key-hex', {
  ttl: 30 * 60 * 1000 // 30 minutes
});

// Stocker une valeur
storage.set('api_key', 'secret-api-key');

// Récupérer une valeur
const apiKey = storage.get('api_key');

// Supprimer une valeur
storage.delete('api_key');

// Vider le stockage
storage.clear();
```

### 2. SecretManager

Le `SecretManager` est responsable de la gestion et de la validation des secrets de l'application. Il vérifie que les secrets requis sont définis et suffisamment forts pour garantir la sécurité du système.

**Caractéristiques principales :**
- Validation des secrets requis
- Vérification de la force des secrets
- Génération de secrets forts
- Gestion des erreurs et journalisation

**Exemple d'utilisation :**
```javascript
const SecretManager = require('../utils/secret-manager');

// Créer une instance
const secretManager = new SecretManager();

// Valider les secrets requis
const validation = secretManager.validateRequiredSecrets();
if (!validation.valid) {
  console.error(`Secrets manquants: ${validation.missingSecrets.join(', ')}`);
}

// Vérifier la force d'un secret
const strength = secretManager.checkSecretStrength('my-secret');
console.log(`Force du secret: ${strength.score}/10`);

// Générer un secret fort
const newSecret = secretManager.generateStrongSecret();
```

### 3. ApiKeyPermissionManager

Le `ApiKeyPermissionManager` est responsable du contrôle d'accès aux clés API basé sur les permissions. Il permet de définir quels modules de l'application peuvent accéder à quelles clés API.

**Caractéristiques principales :**
- Contrôle d'accès basé sur les modules
- Gestion des rôles et des permissions
- Génération de rapports sur les permissions
- Gestion des erreurs et journalisation

**Exemple d'utilisation :**
```javascript
const ApiKeyPermissionManager = require('../utils/api-key-permission-manager');

// Créer une instance
const permissionManager = new ApiKeyPermissionManager();

// Vérifier si un module a accès à un service
const hasAccess = permissionManager.hasPermission('weather-module', 'weatherService');

// Obtenir la liste des modules ayant accès à un service
const modules = permissionManager.getModulesWithAccess('openRouteService');

// Générer un rapport sur les permissions
const report = permissionManager.generatePermissionsReport();
```

### 4. EnhancedApiKeyRotationManager

Le `EnhancedApiKeyRotationManager` est responsable de la rotation automatique des clés API. Il permet de définir des intervalles de rotation et une période de grâce pendant laquelle les anciennes clés restent valides.

**Caractéristiques principales :**
- Rotation automatique des clés
- Période de grâce pour les anciennes clés
- Nettoyage automatique des clés expirées
- Génération de rapports sur les rotations
- Gestion des erreurs et journalisation

**Exemple d'utilisation :**
```javascript
const EnhancedApiKeyRotationManager = require('../utils/enhanced-api-key-rotation-manager');

// Créer une instance
const rotationManager = new EnhancedApiKeyRotationManager(apiKeyManager, {
  rotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 jours
  gracePeriod: 24 * 60 * 60 * 1000 // 24 heures
});

// Démarrer la rotation automatique
rotationManager.startAutomaticRotation();

// Forcer une rotation
await rotationManager.forceRotation('openRouteService');

// Générer un rapport sur les rotations
const report = await rotationManager.generateRotationReport();

// Arrêter la rotation automatique
rotationManager.stopAutomaticRotation();
```

### 5. EnhancedApiKeyManager

Le `EnhancedApiKeyManager` est le composant principal qui intègre tous les autres composants pour fournir une solution complète de gestion sécurisée des clés API.

**Caractéristiques principales :**
- Intégration de tous les composants
- Stockage sécurisé des clés sur disque (chiffré)
- Gestion des clés API pour tous les services
- Génération de rapports sur l'état des clés
- Gestion des erreurs et journalisation

**Exemple d'utilisation :**
```javascript
const EnhancedApiKeyManager = require('../utils/enhanced-api-key-manager');

// Créer une instance
const apiKeyManager = new EnhancedApiKeyManager({
  keysDirectory: './.keys',
  rotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 jours
  gracePeriod: 24 * 60 * 60 * 1000 // 24 heures
});

// Initialiser le gestionnaire
await apiKeyManager.initialize();

// Obtenir une clé API
const apiKey = await apiKeyManager.getApiKey('openRouteService', 'map-module');

// Obtenir toutes les clés valides
const validKeys = await apiKeyManager.getAllValidKeys('openRouteService');

// Vérifier si une clé est valide
const isValid = await apiKeyManager.isValidKey('openRouteService', 'api-key');

// Ajouter une nouvelle clé
await apiKeyManager.addKey('openRouteService', 'new-api-key');

// Générer un rapport
const report = await apiKeyManager.generateReport();

// Arrêter le gestionnaire
apiKeyManager.stop();
```

## Intégration avec les Services API

Le système de gestion sécurisée des clés API est intégré avec les services API existants via le module `apiServices.js`. Ce module expose une interface cohérente pour tous les services API, tout en utilisant le nouveau système de gestion sécurisée des clés API en arrière-plan.

**Exemple d'utilisation :**
```javascript
const apiServices = require('../services/apiServices');

// Obtenir une clé API
const apiKey = await apiServices.openRouteService.getKey();

// Obtenir toutes les clés valides
const validKeys = await apiServices.openRouteService.getAllKeys();

// Vérifier si une clé est valide
const isValid = await apiServices.openRouteService.isValidKey('api-key');

// Forcer une rotation
await apiServices.openRouteService.rotateKeys();

// Ajouter une nouvelle clé
await apiServices.openRouteService.addKey('new-api-key');

// Arrêter tous les gestionnaires
apiServices.stopAll();
```

## Sécurité

Le système de gestion sécurisée des clés API implémente plusieurs mesures de sécurité pour protéger les clés API :

1. **Chiffrement** : Les clés API sont chiffrées en mémoire et sur disque à l'aide d'algorithmes de chiffrement robustes (AES-256-GCM).

2. **Contrôle d'accès** : L'accès aux clés API est contrôlé par un système de permissions basé sur les modules de l'application.

3. **Rotation automatique** : Les clés API sont automatiquement rotées à intervalles réguliers pour minimiser les risques de compromission.

4. **Période de grâce** : Une période de grâce est implémentée pour permettre une transition en douceur lors de la rotation des clés.

5. **Expiration automatique** : Les clés API en mémoire expirent automatiquement après une période définie pour minimiser les risques de fuite.

6. **Validation des secrets** : Les secrets de l'application sont validés pour s'assurer qu'ils sont suffisamment forts pour garantir la sécurité du système.

7. **Journalisation** : Toutes les opérations sur les clés API sont journalisées pour permettre une traçabilité complète.

## Tests

Le système de gestion sécurisée des clés API est accompagné de plusieurs scripts de test pour valider son fonctionnement :

1. **test-api-key-security.js** : Test unitaire des composants du système de gestion sécurisée des clés API.

2. **test-api-key-integration.js** : Test d'intégration du système de gestion sécurisée des clés API avec les services API existants.

3. **api-key-security-integration.js** : Script de démonstration de l'utilisation du système de gestion sécurisée des clés API.

4. **test-enhanced-api-key-integration.js** : Test d'intégration spécifique pour le service OpenRouteService.

## Conclusion

Le système de gestion sécurisée des clés API implémenté pour Dashboard-Velo.com offre une solution complète et robuste pour la gestion des clés API. Il répond aux exigences de sécurité les plus strictes en matière de confidentialité, d'intégrité et de disponibilité des clés API.

## Références

- [SecureMemoryStorage](../utils/secure-memory-storage.js)
- [SecretManager](../utils/secret-manager.js)
- [ApiKeyPermissionManager](../utils/api-key-permission-manager.js)
- [EnhancedApiKeyRotationManager](../utils/enhanced-api-key-rotation-manager.js)
- [EnhancedApiKeyManager](../utils/enhanced-api-key-manager.js)
- [API Services](../services/apiServices.js)
- [Test API Key Security](../scripts/test-api-key-security.js)
- [Test API Key Integration](../scripts/test-api-key-integration.js)
- [API Key Security Integration](../scripts/api-key-security-integration.js)
- [Test Enhanced API Key Integration](../scripts/test-enhanced-api-key-integration.js)
