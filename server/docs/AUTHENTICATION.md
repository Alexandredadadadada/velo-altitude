# Système d'Authentification

Ce document décrit l'architecture et le fonctionnement du système d'authentification de Dashboard-Velo.com.

## Vue d'ensemble

Le système d'authentification est basé sur les tokens JWT (JSON Web Tokens) avec un mécanisme avancé de rotation des clés et de validation des empreintes client. Il offre un équilibre entre sécurité et expérience utilisateur grâce à des fonctionnalités comme la période de grâce pour les tokens expirés et la validation partielle des empreintes client.

## Composants principaux

### 1. Service d'authentification (`auth.service.js`)

Le service d'authentification est le point central pour toutes les opérations liées à l'authentification :

- Génération de tokens JWT (accès et rafraîchissement)
- Vérification de tokens
- Gestion des sessions utilisateur
- Révocation de tokens
- Détection d'activités suspectes

### 2. Système de rotation JWT amélioré (`enhanced-jwt-rotation.js`)

Ce système gère la rotation des clés de signature JWT de manière dynamique :

- Rotation automatique basée sur l'activité utilisateur
- Période de grâce pour les tokens expirés
- Révocation sélective de tokens
- Journalisation des rotations pour le débogage

### 3. Service de liste noire de tokens (`token-blacklist.service.js`)

Maintient une liste des tokens révoqués pour empêcher leur réutilisation.

## Flux d'authentification

1. **Connexion utilisateur** : L'utilisateur s'authentifie avec ses identifiants, et le système génère un token d'accès et un token de rafraîchissement.
2. **Utilisation du token d'accès** : Le client utilise le token d'accès pour accéder aux ressources protégées.
3. **Rafraîchissement du token** : Lorsque le token d'accès expire, le client utilise le token de rafraîchissement pour obtenir un nouveau token d'accès sans avoir à se reconnecter.
4. **Déconnexion** : Le token est révoqué et ajouté à la liste noire.

## Optimisations de sécurité

### Empreintes client (Fingerprinting)

Le système utilise une empreinte client pour lier un token à un appareil spécifique :

- Génération d'une empreinte unique basée sur les caractéristiques du navigateur et de l'appareil
- Validation flexible permettant des changements mineurs dans l'empreinte
- Détection d'activités suspectes en cas de changements importants

#### Configuration actuelle

- Nombre d'attributs requis pour la validation : Réduit pour plus de flexibilité
- Nombre de tentatives autorisées : 10 dans un intervalle de 5 minutes
- Validation partielle : Autorise l'accès même si certains attributs ont changé

### Rotation des clés JWT

Le système implémente une rotation dynamique des clés de signature JWT :

- Rotation basée sur l'activité plutôt qu'un intervalle fixe
- Conservation des clés précédentes pendant une période de grâce
- Révocation sélective en cas de compromission suspectée

#### Configuration actuelle

- Intervalle minimum entre rotations : 12 heures
- Période de grâce : 30 minutes
- Seuil d'activité pour déclencher une rotation : 1000 validations

### Cache de validation

Pour améliorer les performances, le système met en cache les résultats de validation des tokens :

- Réduction de la charge de validation pour les tokens fréquemment utilisés
- Nettoyage automatique des entrées expirées
- Mise à jour des empreintes client dans le cache

## Métriques et surveillance

Le système collecte des métriques pour surveiller les performances et la sécurité :

- Nombre de tokens générés, vérifiés et rejetés
- Taux de succès des rafraîchissements
- Taux de hit du cache
- Activités suspectes détectées

Ces métriques sont accessibles via l'endpoint `/api/auth/metrics` (réservé aux administrateurs).

## Gestion des erreurs

Le système utilise un service d'erreur centralisé pour standardiser les messages d'erreur et faciliter le débogage :

- Classification des erreurs par type (authentification, autorisation, serveur)
- Enrichissement des erreurs avec des métadonnées
- Journalisation cohérente

## Configuration

Les paramètres du système d'authentification sont configurables via le fichier `api.config.js` :

```javascript
auth: {
  tokenSecret: process.env.JWT_SECRET,
  tokenExpiration: '1h',
  refreshTokenExpiration: '7d',
  gracePeriod: 30 * 60 * 1000, // 30 minutes
  keyRotation: {
    interval: 24 * 60 * 60 * 1000, // 24 heures
    activityThreshold: 1000
  }
}
```

## Bonnes pratiques pour les développeurs

1. **Toujours utiliser le service d'authentification** pour les opérations liées aux tokens.
2. **Ne jamais stocker de tokens sensibles** dans le localStorage (préférer les cookies HttpOnly).
3. **Implémenter une logique de rafraîchissement automatique** côté client.
4. **Gérer correctement les erreurs d'authentification** et rediriger vers la page de connexion si nécessaire.
5. **Vérifier régulièrement les métriques** pour détecter des anomalies.

## Dépannage

### Problèmes courants

1. **Token expiré** : Vérifier que le client utilise correctement le mécanisme de rafraîchissement.
2. **Empreinte client invalide** : Vérifier si l'utilisateur a changé de navigateur ou d'appareil.
3. **Token révoqué** : Vérifier si l'utilisateur s'est déconnecté d'un autre appareil ou si une révocation de sécurité a été déclenchée.

### Journalisation

Le système journalise les événements importants pour faciliter le débogage :

- Génération et vérification de tokens
- Rotations de clés
- Révocations de tokens
- Activités suspectes

Les journaux sont disponibles dans le répertoire `logs/` et via l'interface d'administration.

## Tests

Le système d'authentification est testé via :

1. **Tests unitaires** : Vérification du fonctionnement individuel des composants.
2. **Tests d'intégration** : Vérification de l'interaction entre les composants.
3. **Tests de charge** : Vérification des performances sous charge.

Pour exécuter les tests :

```bash
# Tests unitaires
npm run test:auth

# Tests d'intégration
node server/scripts/api-key-integration-test.js

# Tests de charge
node server/scripts/backend-load-test.js
```
