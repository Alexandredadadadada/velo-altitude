# SECURITE

*Document consolidé le 07/04/2025 03:04:42*

## Table des matières

- [API SECURITY](#api-security)
- [api-key-security-system](#api-key-security-system)
- [AUTH0 PRODUCTION CONFIG](#auth0-production-config)
- [DEPLOY SECRETS](#deploy-secrets)
- [API SECURITY CONFIGURATION](#api-security-configuration)

---

## API SECURITY

*Source: docs/API_SECURITY.md*

## Système de rotation des clés API

Dashboard-Velo.com utilise un système de rotation automatique des clés API pour améliorer la sécurité et limiter l'impact potentiel d'une fuite de clés.

### Caractéristiques principales

- **Rotation automatique** : Les clés sont automatiquement renouvelées selon un calendrier configurable
- **Multiples clés actives** : Plusieurs clés sont valides simultanément pour assurer une transition en douceur
- **Chiffrement des clés stockées** : Les clés sont chiffrées avant d'être stockées sur le disque
- **Isolation par service** : Chaque service externe a son propre ensemble de clés

### Services pris en charge

Le système gère les clés API pour les services suivants :

| Service | Fréquence de rotation | Nombre de clés actives |
|---------|----------------------|------------------------|
| OpenRouteService | Mensuelle (1er jour) | 3 |
| Strava | Hebdomadaire (dimanche) | 2 |
| OpenWeatherMap | Bi-mensuelle (1er et 15) | 2 |
| Mapbox | Mensuelle (1er jour) | 2 |
| OpenAI | Mensuelle (15 du mois) | 2 |

### Configuration initiale

1. Générez une clé de chiffrement :

```bash
node server/scripts/generateEncryptionKey.js
```

2. Ajoutez la clé générée à votre fichier `.env` :

```
API_KEYS_ENCRYPTION_KEY=votre_clé_générée
KEYS_DIRECTORY=./.keys
```

3. Assurez-vous que le répertoire `.keys` est exclu de Git (ajoutez-le à `.gitignore`)

```
# API Keys
.keys
```

### Fonctionnement du système

Le système de gestion des clés API fonctionne comme suit :

1. **Initialisation** : Lors du démarrage de l'application, le système charge les clés existantes depuis le répertoire `.keys` ou utilise les clés des variables d'environnement si aucun fichier n'existe.

2. **Rotation automatique** : Les clés sont automatiquement rotées selon le calendrier configuré pour chaque service.

3. **Gestion des quotas** : Le système surveille l'utilisation des quotas API et peut déclencher une rotation anticipée en cas d'approche des limites.

4. **Récupération d'erreurs** : En cas d'erreur avec une clé, le système peut automatiquement passer à une autre clé valide.

### Utilisation dans le code

Pour utiliser une clé API dans votre code :

```javascript
const apiServices = require('./server/services/apiServices');

// Obtenir la clé active pour un service
const openRouteKey = apiServices.openRouteService.getKey();

// Vérifier si une clé est valide
const isValid = apiServices.strava.isValidKey(someKey);

// Forcer une rotation des clés
apiServices.weatherService.rotateKeys();

// Ajouter une nouvelle clé
apiServices.mapbox.addKey(newKey);
```

### Rotation manuelle des clés

En cas d'urgence, vous pouvez forcer une rotation des clés :

```javascript
const apiServices = require('./server/services/apiServices');
apiServices.openRouteService.rotateKeys();
```

### Surveillance et alertes

Le système enregistre toutes les opérations liées aux clés API dans les journaux de l'application. En cas de problème (rotation échouée, tentative d'utilisation d'une clé invalide, etc.), une alerte est envoyée aux administrateurs.

### Bonnes pratiques

- Ne stockez jamais les clés API dans le code source
- Utilisez toujours le gestionnaire de clés pour accéder aux clés API
- Surveillez les journaux pour détecter toute activité suspecte
- Effectuez régulièrement des audits de sécurité
- Limitez l'accès aux fichiers `.env` et au répertoire `.keys`

### Récupération en cas de compromission

Si vous suspectez qu'une clé API a été compromise :

1. Forcez immédiatement une rotation des clés pour le service concerné
2. Vérifiez les journaux pour détecter toute activité suspecte
3. Contactez le fournisseur du service pour signaler la compromission
4. Générez une nouvelle clé de chiffrement et réinitialisez le système

### Architecture technique

Le système de gestion des clés API est composé de deux classes principales :

1. **ApiKeyManager** : Gère les clés pour un service spécifique (rotation, chiffrement, etc.)
2. **apiServices** : Centralise l'accès aux gestionnaires de clés pour tous les services

Le stockage des clés est sécurisé par chiffrement AES-256 avec une clé unique générée lors de l'installation.

### Dépannage

Si vous rencontrez des problèmes avec le système de gestion des clés API :

1. Vérifiez que la clé de chiffrement est correctement configurée dans le fichier `.env`
2. Assurez-vous que le répertoire `.keys` existe et est accessible en lecture/écriture
3. Consultez les journaux de l'application pour identifier les erreurs spécifiques
4. En cas de problème persistant, vous pouvez réinitialiser le système en supprimant les fichiers du répertoire `.keys` (les clés seront recréées à partir des variables d'environnement)

### Limitations connues

- Le système nécessite que les clés API initiales soient disponibles dans les variables d'environnement
- La rotation des clés est effectuée en mémoire et nécessite un redémarrage de l'application pour être prise en compte par tous les processus
- Les clés sont stockées localement et ne sont pas synchronisées entre plusieurs instances de l'application

### Évolutions futures

- Synchronisation des clés entre plusieurs instances via Redis
- Interface d'administration pour la gestion des clés
- Intégration avec des services de gestion de secrets (HashiCorp Vault, AWS Secrets Manager, etc.)
- Rotation automatique basée sur l'utilisation plutôt que sur un calendrier fixe

---

## api-key-security-system

*Source: docs/api-key-security-system.md*

## Vue d'Ensemble

Le système de gestion sécurisée des clés API de Dashboard-Velo.com est une solution complète pour gérer, sécuriser et contrôler l'accès aux clés API utilisées par l'application. Ce système implémente les meilleures pratiques de sécurité pour protéger les clés API contre les accès non autorisés, les fuites et les utilisations abusives.

## Architecture

Le système est composé de quatre composants principaux qui travaillent ensemble pour assurer la sécurité des clés API :

1. **SecureMemoryStorage** : Stockage sécurisé des clés en mémoire avec chiffrement
2. **SecretManager** : Gestion et validation des secrets de l'application
3. **ApiKeyPermissionManager** : Contrôle d'accès basé sur les permissions
4. **EnhancedApiKeyRotationManager** : Rotation automatique des clés avec période de grâce

### Diagramme d'Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Système de Gestion des Clés API                │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌───────────────────┐       ┌───────────────────────────┐      │
│  │  SecretManager    │       │  ApiKeyPermissionManager  │      │
│  └───────────────────┘       └───────────────────────────┘      │
│           │                              │                      │
│           ▼                              ▼                      │
│  ┌───────────────────┐       ┌───────────────────────────┐      │
│  │SecureMemoryStorage│◄─────►│EnhancedApiKeyRotationMgr  │      │
│  └───────────────────┘       └───────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Services de l'Application                   │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐        │
│  │ WeatherService│  │ StravaService │  │OpenRouteService│        │
│  └───────────────┘  └───────────────┘  └───────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Composants

### 1. SecureMemoryStorage

Ce composant fournit un stockage sécurisé en mémoire pour les clés API. Il utilise le chiffrement AES-256-GCM pour protéger les clés même après leur chargement depuis les fichiers.

#### Caractéristiques principales :

- Chiffrement AES-256-GCM avec IV unique pour chaque entrée
- Authentification des données avec GCM pour détecter les manipulations
- Gestion automatique de la durée de vie (TTL) des clés en mémoire
- Nettoyage automatique des entrées expirées
- Dérivation de clé de chiffrement spécifique à la mémoire

#### Exemple d'utilisation :

```javascript
const storage = new SecureMemoryStorage(process.env.API_KEYS_ENCRYPTION_KEY, {
  ttl: 30 * 60 * 1000, // 30 minutes
  autoCleanup: true
});

// Stocker une clé API
storage.set('openai_key', { key: 'sk-abcdef123456', created: new Date() });

// Récupérer une clé API
const apiKey = storage.get('openai_key');

// Vérifier si une clé existe et n'est pas expirée
if (storage.has('openai_key')) {
  // Utiliser la clé...
}

// Supprimer une clé
storage.delete('openai_key');
```

### 2. SecretManager

Ce composant gère et valide les secrets de l'application, assurant qu'ils sont présents et suffisamment forts pour garantir la sécurité du système.

#### Caractéristiques principales :

- Validation de la présence des secrets requis
- Vérification de la force des secrets (longueur, entropie)
- Génération de secrets forts
- Rapports détaillés sur l'état des secrets

#### Exemple d'utilisation :

```javascript
const secretManager = new SecretManager({
  additionalSecrets: ['OPENAI_API_KEY', 'STRAVA_CLIENT_SECRET'],
  minSecretLength: 32,
  minEntropyLevel: 3
});

// Initialiser et valider tous les secrets
try {
  secretManager.initialize();
  console.log('Tous les secrets sont valides');
} catch (error) {
  console.error('Erreur de validation des secrets:', error.message);
  
  // Générer des suggestions pour les secrets manquants ou faibles
  const suggestions = secretManager.generateSecretSuggestions();
  console.log('Suggestions de secrets:', suggestions);
}

// Générer un rapport sur l'état des secrets
const report = secretManager.generateReport();
console.log('Rapport des secrets:', report);
```

### 3. ApiKeyPermissionManager

Ce composant implémente un système de contrôle d'accès basé sur les permissions pour limiter l'accès aux clés API selon le contexte d'utilisation.

#### Caractéristiques principales :

- Définition des permissions par module
- Vérification des permissions avant l'accès aux clés
- Gestion granulaire des permissions (ajout, suppression)
- Rapports détaillés sur les permissions

#### Exemple d'utilisation :

```javascript
const permissionManager = new ApiKeyPermissionManager({
  logger: customLogger
});

// Configurer des permissions personnalisées
permissionManager.setPermissions('weather-module', ['weatherService']);
permissionManager.setPermissions('map-module', ['openRouteService', 'mapbox']);

// Vérifier les permissions
if (permissionManager.hasPermission('weather-module', 'weatherService')) {
  // Accéder à la clé API...
} else {
  console.error('Accès non autorisé');
}

// Ajouter des permissions à un module existant
permissionManager.addPermissions('weather-module', ['additionalWeatherService']);

// Générer un rapport des permissions
const report = permissionManager.generatePermissionsReport();
console.log('Rapport des permissions:', report);
```

### 4. EnhancedApiKeyRotationManager

Ce composant gère la rotation automatique des clés API avec une période de grâce pour assurer une transition en douceur lors des changements de clés.

#### Caractéristiques principales :

- Rotation automatique des clés selon un intervalle configurable
- Période de grâce pour les anciennes clés
- Nettoyage automatique des clés expirées
- Rapports détaillés sur l'état des rotations

#### Exemple d'utilisation :

```javascript
const rotationManager = new EnhancedApiKeyRotationManager(apiKeyManager, {
  rotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 jours
  gracePeriod: 24 * 60 * 60 * 1000, // 24 heures
  logger: customLogger
});

// Démarrer le service de rotation automatique
rotationManager.startAutomaticRotation();

// Vérifier si une rotation est nécessaire
const rotationNeeded = await rotationManager.checkRotationNeeded('openai');
if (rotationNeeded) {
  await rotationManager.rotateWithGracePeriod('openai');
}

// Vérifier si une clé est valide (active ou en période de grâce)
const isKeyValid = await rotationManager.isKeyValid('openai', keyIndex);

// Générer un rapport sur l'état des rotations
const report = await rotationManager.generateRotationReport();
console.log('Rapport des rotations:', report);
```

## Intégration des Composants

L'intégration des quatre composants crée un système complet de gestion sécurisée des clés API. Voici comment ils interagissent :

1. **SecretManager** valide les secrets au démarrage de l'application
2. **ApiKeyPermissionManager** définit les permissions d'accès aux clés API
3. **SecureMemoryStorage** stocke les clés API en mémoire de manière sécurisée
4. **EnhancedApiKeyRotationManager** gère la rotation automatique des clés

### Exemple d'Intégration Complète

```javascript
// Initialisation du système
const secretManager = new SecretManager();
secretManager.initialize(); // Valider les secrets au démarrage

const storage = new SecureMemoryStorage(process.env.API_KEYS_ENCRYPTION_KEY);
const permissionManager = new ApiKeyPermissionManager({ logger });

// Intégration avec ApiKeyManager existant
class EnhancedApiKeyManager {
  constructor(encryptionKey, options = {}) {
    this.fileEncryptionKey = encryptionKey;
    this.memoryStorage = new SecureMemoryStorage(encryptionKey);
    this.permissionManager = new ApiKeyPermissionManager();
    this.logger = options.logger || console;
    
    // Initialiser le gestionnaire de rotation
    this.rotationManager = new EnhancedApiKeyRotationManager(this, {
      logger: this.logger,
      rotationInterval: options.rotationInterval || (30 * 24 * 60 * 60 * 1000)
    });
    
    // Démarrer la rotation automatique si activée
    if (options.autoRotation) {
      this.rotationManager.startAutomaticRotation();
    }
  }
  
  async getApiKey(service, moduleId) {
    // Vérifier les permissions
    if (!moduleId || !this.permissionManager.hasPermission(moduleId, service)) {
      throw new Error(`Accès non autorisé à la clé API ${service} pour le module ${moduleId}`);
    }
    
    // Essayer d'abord de récupérer depuis le stockage mémoire sécurisé
    const cachedKey = this.memoryStorage.get(`${service}_key`);
    if (cachedKey) return cachedKey;
    
    // Si pas en mémoire, charger depuis le fichier
    const keys = await this.loadKeysFromFile(service);
    const activeKey = keys.keys[keys.activeKeyIndex];
    
    // Stocker en mémoire sécurisée pour les prochains accès
    this.memoryStorage.set(`${service}_key`, activeKey);
    
    return activeKey;
  }
  
  // Autres méthodes...
}

// Utilisation dans les services
class WeatherService {
  constructor(apiKeyManager) {
    this.apiKeyManager = apiKeyManager;
    this.moduleId = 'weather-module';
  }
  
  async getWeather(location) {
    try {
      const apiKey = await this.apiKeyManager.getApiKey('weatherService', this.moduleId);
      // Utiliser la clé pour l'appel API...
    } catch (error) {
      console.error('Erreur d\'accès à la clé API:', error.message);
      throw new Error('Impossible d\'accéder au service météo');
    }
  }
}
```

## Sécurité

Le système implémente plusieurs couches de sécurité pour protéger les clés API :

1. **Chiffrement** : Les clés sont chiffrées à la fois sur disque et en mémoire
2. **Contrôle d'accès** : Accès limité selon le principe du moindre privilège
3. **Rotation des clés** : Changement régulier des clés pour limiter l'impact d'une fuite
4. **Période de grâce** : Transition en douceur lors des rotations de clés
5. **Validation des secrets** : Vérification de la force des secrets de l'application
6. **Expiration en mémoire** : Les clés ne restent en mémoire que pour une durée limitée

## Tests

Un framework de test complet est fourni pour valider le fonctionnement du système :

```javascript
const tester = new ApiKeySecurityTester();
tester.runAllTests()
  .then(results => {
    console.log('Résultats des tests:', results);
  });
```

Les tests couvrent :
- Le fonctionnement individuel de chaque composant
- L'intégration entre les composants
- Les cas d'erreur et la gestion des exceptions
- Les scénarios de sécurité critiques

## Bonnes Pratiques

### Configuration

- Utiliser des variables d'environnement pour les secrets
- Définir des clés de chiffrement fortes (au moins 32 caractères)
- Configurer des intervalles de rotation adaptés à la sensibilité des services

### Développement

- Toujours vérifier les permissions avant d'accéder aux clés API
- Ne jamais stocker les clés API en clair dans le code ou les logs
- Utiliser le système de période de grâce pour éviter les interruptions de service

### Déploiement

- Utiliser des secrets différents pour chaque environnement
- Mettre en place une surveillance des rotations de clés
- Configurer des alertes en cas d'échec de rotation

## Conclusion

Le système de gestion sécurisée des clés API de Dashboard-Velo.com offre une solution robuste et complète pour protéger les clés API contre les accès non autorisés et les fuites. En implémentant les meilleures pratiques de sécurité comme le chiffrement, le contrôle d'accès, la rotation des clés et la validation des secrets, ce système assure la sécurité des intégrations externes de l'application.

---

## AUTH0 PRODUCTION CONFIG

*Source: docs/AUTH0_PRODUCTION_CONFIG.md*

Ce document détaille la configuration Auth0 requise pour le déploiement de Velo-Altitude sur Netlify.

## Prérequis

- Une application Auth0 déjà créée
- Accès au tableau de bord Auth0
- Accès au tableau de bord Netlify

## Configuration des URLs de callback

Pour que l'authentification fonctionne correctement en production, configurez les URLs suivantes dans les paramètres de l'application Auth0 :

### 1. URLs de callback autorisées

```
https://velo-altitude.netlify.app/callback
https://velo-altitude.netlify.app/api/auth/callback
https://*.netlify.app/callback
https://*.netlify.app/api/auth/callback
http://localhost:3000/callback
```

### 2. URLs de déconnexion autorisées

```
https://velo-altitude.netlify.app
https://*.netlify.app
http://localhost:3000
```

### 3. Origines Web autorisées (CORS)

```
https://velo-altitude.netlify.app
https://*.netlify.app
http://localhost:3000
```

## Configuration des règles Auth0

### 1. Règle pour ajouter les rôles utilisateur au token ID

Créez une nouvelle règle avec le code suivant :

```javascript
function addRolesToIdToken(user, context, callback) {
  const namespace = 'https://velo-altitude.netlify.app';
  const assignedRoles = (context.authorization || {}).roles || [];

  const idTokenClaims = context.idToken || {};
  idTokenClaims[`${namespace}/roles`] = assignedRoles;
  
  context.idToken = idTokenClaims;
  callback(null, user, context);
}
```

### 2. Règle pour l'authentification silencieuse

```javascript
function enhanceSilentAuth(user, context, callback) {
  // Si l'origine de la requête est notre application
  if (context.request.query && context.request.query.prompt === 'none') {
    // Configurer le contexte pour permettre l'authentification silencieuse
    context.sessionManager = {
      updateLastLogin: false
    };
  }
  
  callback(null, user, context);
}
```

## Variables d'environnement à configurer sur Netlify

Assurez-vous que les variables suivantes sont définies dans les paramètres de déploiement Netlify :

```
AUTH0_AUDIENCE=https://velo-altitude.netlify.app/api
AUTH0_BASE_URL=https://velo-altitude.netlify.app
AUTH0_CLIENT_ID=votre_client_id
AUTH0_CLIENT_SECRET=votre_client_secret
AUTH0_ISSUER_BASE_URL=https://votre-domaine.auth0.com
AUTH0_SCOPE=openid profile email offline_access
AUTH0_SECRET=une_valeur_secrete_aleatoire_generee
```

## Test de l'authentification en production

Après le déploiement, testez les scénarios suivants :

1. **Authentification standard Auth0**
   - Connectez-vous via la page de connexion normale
   - Vérifiez que vous êtes correctement redirigé après la connexion
   - Vérifiez que le token est correctement stocké

2. **Authentification avec le mode d'urgence**
   - Ajoutez `?emergency=true` à l'URL pour forcer le mode d'urgence
   - Vérifiez que vous pouvez vous connecter avec les identifiants de secours
   - Vérifiez l'accès aux fonctionnalités de base

3. **Déconnexion et actualisation de session**
   - Déconnectez-vous et reconnectez-vous
   - Restez inactif pendant un moment puis essayez d'accéder à une section protégée
   - Vérifiez que la session est rafraîchie automatiquement

## Résolution des problèmes courants

### Erreur "Login required"
- Vérifiez que les URLs de callback sont correctement configurées
- Assurez-vous que le client ID et le domaine Auth0 sont corrects

### Erreur CORS
- Vérifiez que toutes les origines web sont autorisées dans Auth0
- Assurez-vous que la Content Security Policy dans netlify.toml est correcte

### Redirection en boucle
- Vérifiez la configuration des règles Auth0
- Assurez-vous que le script auth-override.js est correctement déployé

---

## DEPLOY SECRETS

*Source: docs/DEPLOY_SECRETS.md*

Ce document explique comment obtenir et configurer les secrets nécessaires pour le déploiement automatisé de Velo-Altitude via GitHub Actions vers Netlify.

## Obtention des secrets Netlify

### 1. Récupérer votre NETLIFY_AUTH_TOKEN

1. Connectez-vous à votre compte Netlify
2. Accédez à la page des applications utilisateur: https://app.netlify.com/user/applications
3. Dans la section "Personal access tokens", cliquez sur "New access token"
4. Donnez un nom descriptif comme "GitHub Actions Deployment"
5. Copiez le token généré (vous ne pourrez plus le voir après avoir quitté cette page)

### 2. Récupérer votre NETLIFY_SITE_ID

1. Connectez-vous à votre compte Netlify
2. Accédez au site Velo-Altitude
3. Allez dans "Site settings" > "General"
4. Le "Site ID" est affiché dans la section "Site details"
5. Copiez cette valeur

## Configuration des secrets dans GitHub

### Dans l'interface GitHub

1. Accédez à votre dépôt GitHub pour Velo-Altitude
2. Cliquez sur "Settings" > "Secrets" > "Actions"
3. Cliquez sur "New repository secret"
4. Ajoutez les secrets suivants:
   - Nom: `NETLIFY_AUTH_TOKEN`  
     Valeur: [Collez votre token d'accès personnel Netlify]
   - Nom: `NETLIFY_SITE_ID`  
     Valeur: [Collez l'ID de votre site Netlify]

### Via la CLI GitHub (alternative)

```bash
# Installation de la CLI GitHub si nécessaire
npm install -g gh

# Authentification
gh auth login

# Ajout des secrets
gh secret set NETLIFY_AUTH_TOKEN -b "votre_token_netlify"
gh secret set NETLIFY_SITE_ID -b "votre_site_id_netlify"
```

## Vérification

Pour vérifier que vos secrets sont correctement configurés:

1. Accédez à l'onglet "Actions" de votre dépôt GitHub
2. Cliquez sur le workflow "Deploy to Netlify"
3. Cliquez sur "Run workflow" et sélectionnez la branche principale
4. Surveillez l'exécution du workflow - si la configuration est correcte, il n'y aura pas d'erreurs liées aux secrets

## Sécurité des secrets

**Important**: Ne partagez jamais ces tokens directement dans votre code ou dans des fichiers versionnés. Utilisez toujours le système de secrets de GitHub pour les stocker de manière sécurisée.

Ces tokens accordent un accès privilégié à votre compte Netlify, alors assurez-vous de les traiter avec la même prudence que des mots de passe.

## Rotation des secrets

Il est recommandé de faire une rotation périodique de vos tokens d'accès personnels:

1. Créez un nouveau token dans Netlify
2. Mettez à jour le secret dans GitHub
3. Supprimez l'ancien token dans Netlify

Cela limite les risques si un token est accidentellement exposé.

---

## API SECURITY CONFIGURATION

*Source: API_SECURITY_CONFIGURATION.md*

**Date :** 5 avril 2025  
**Version :** 1.0.0

## Aperçu

Ce document décrit les meilleures pratiques de sécurité mises en œuvre pour protéger les clés API et autres données sensibles dans l'application Velo-Altitude.

## Configuration des API

### 1. Variables d'environnement Netlify

Toutes les clés API et secrets sont stockés en tant que variables d'environnement dans Netlify avec l'option "Contains secret values" activée pour les valeurs sensibles. Cette approche garantit que les secrets ne sont jamais exposés publiquement.

### 2. API intégrées

#### Mapbox (Cartographie)
- **Variable :** `MAPBOX_TOKEN`
- **Utilisation :** Affichage des cartes interactives, visualisation des cols et itinéraires
- **Restriction :** Configuré pour limiter les domaines autorisés à votre domaine Netlify

#### OpenWeatherMap (Données météo)
- **Variable :** `OPENWEATHER_API_KEY`
- **Utilisation :** Prévisions météo pour les itinéraires et cols
- **Rotation :** Plan de rotation des clés tous les 3 mois

#### OpenRouteService (Calcul d'itinéraires)
- **Variable :** `OPENROUTE_API_KEY`
- **Utilisation :** Calcul d'itinéraires, alternatives et élévation
- **Quota :** Surveillance des quotas implémentée

#### Strava (Intégration sociale)
- **Variables :** 
  - `STRAVA_CLIENT_ID`
  - `STRAVA_CLIENT_SECRET`
  - `STRAVA_ACCESS_TOKEN`
  - `STRAVA_REFRESH_TOKEN`
- **Utilisation :** Partage d'activités, défis sociaux, connexion avec l'API Strava
- **Sécurité :** Tokens régénérés automatiquement via le refresh token

#### Services d'IA (Recommandations)
- **Variables :** 
  - `OPENAI_API_KEY`
  - `CLAUDE_API_KEY`
- **Utilisation :** Chatbot, recommandations personnalisées, analyse des itinéraires
- **Protection :** Limitation du nombre de requêtes par utilisateur

### 3. Chiffrement des clés

Pour une sécurité supplémentaire, nous utilisons la variable `API_KEYS_ENCRYPTION_KEY` pour chiffrer les clés API stockées dans la base de données (pour les clés spécifiques à l'utilisateur).

## Implémentation sécurisée dans le code

### Client (Frontend)

Toutes les références aux API dans le code client utilisent des variables d'environnement avec le préfixe `REACT_APP_` :

```javascript
// Bonne pratique - utilisation de variables d'environnement
const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN || '';

// Valeurs de fallback vides ou placeholder non fonctionnels
const weatherApiKey = process.env.REACT_APP_WEATHER_API_KEY || '';
```

### Serveur (Backend)

Le code serveur accède aux variables d'environnement directement :

```javascript
// Accès aux variables d'environnement côté serveur
const openRouteApiKey = process.env.OPENROUTE_API_KEY;
const stravaClientId = process.env.STRAVA_CLIENT_ID;
```

## Plan de rotation des clés

Un plan de rotation régulière des clés API a été mis en place :
- Clés de haute sécurité (Auth0, MongoDB) : Rotation tous les 2 mois
- Clés d'API externes : Rotation tous les 3-6 mois
- Clés de session : Rotation tous les mois

## Surveillance et alertes

Des mécanismes de surveillance de l'utilisation des API ont été implémentés :
- Journalisation de toutes les requêtes API
- Alertes en cas d'utilisation excessive
- Détection des modèles d'utilisation suspects

## Recommandations pour les développeurs

1. Ne jamais coder en dur les clés API ou secrets
2. Toujours utiliser les variables d'environnement
3. Pour les tests locaux, utiliser un fichier `.env` local (non commité)
4. Vérifier régulièrement les journaux d'utilisation des API

---


## Note de consolidation

Ce document a été consolidé à partir de 5 sources le 07/04/2025 03:04:42. Les documents originaux sont archivés dans le dossier `.archive`.
