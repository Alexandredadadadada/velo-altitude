# Sécurité des clés API

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
