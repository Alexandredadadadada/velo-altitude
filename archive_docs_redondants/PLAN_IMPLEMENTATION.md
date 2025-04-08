# Plan d'implémentation et de test des correctifs

Ce document détaille le plan d'implémentation et de test pour les correctifs apportés aux problèmes d'authentification et de chargement des données sur Dashboard-Velo.com.

## 1. Correctifs d'authentification

### 1.1. Amélioration du système de rotation des clés JWT

**Changements effectués :**
- Implémentation d'une période de grâce de 48 heures pour les anciennes clés
- Conservation des clés précédentes pendant cette période
- Suppression uniquement des clés très anciennes

**Tests à réaliser :**
- Test unitaire : Vérifier que la rotation des clés conserve les anciennes clés pendant la période de grâce
- Test d'intégration : Vérifier qu'un token généré avant la rotation reste valide après la rotation
- Test de charge : Simuler une rotation de clé pendant que plusieurs utilisateurs sont connectés

```javascript
// Test unitaire pour la rotation des clés
describe('AuthService - Rotation des clés JWT', () => {
  it('devrait conserver les anciennes clés pendant la période de grâce', async () => {
    const authService = new AuthService();
    const initialKeyId = authService.keyRotation.currentKeyId;
    const initialKeyCount = authService.keyRotation.keys.size;
    
    // Effectuer une rotation
    authService.rotateSigningKeys();
    
    // Vérifier que la nouvelle clé est créée et l'ancienne conservée
    expect(authService.keyRotation.currentKeyId).to.equal(initialKeyId + 1);
    expect(authService.keyRotation.keys.size).to.equal(initialKeyCount + 1);
    expect(authService.keyRotation.keys.has(initialKeyId)).to.be.true;
  });
  
  it('devrait valider les tokens signés avec une ancienne clé', async () => {
    const authService = new AuthService();
    
    // Générer un token avec la clé actuelle
    const user = { id: 'test-user', role: 'user' };
    const token = authService.generateToken(user);
    
    // Effectuer une rotation de clé
    authService.rotateSigningKeys();
    
    // Vérifier que le token est toujours valide
    const decoded = await authService.verifyToken(token);
    expect(decoded).to.have.property('id', user.id);
  });
});
```

### 1.2. Assouplissement de la détection des activités suspectes

**Changements effectués :**
- Augmentation du seuil de tentatives échouées de 5 à 10 en 5 minutes
- Envoi d'alertes administrateurs uniquement après 15 tentatives

**Tests à réaliser :**
- Test unitaire : Vérifier que l'IP n'est pas marquée comme suspecte avant 10 tentatives
- Test d'intégration : Simuler 8 tentatives échouées et vérifier que l'utilisateur peut toujours se connecter

```javascript
// Test unitaire pour la détection d'activités suspectes
describe('SecurityMonitor - Détection d\'activités suspectes', () => {
  it('ne devrait pas marquer une IP comme suspecte avant 10 tentatives', () => {
    const securityMonitor = new SecurityMonitor();
    const testIP = '192.168.1.1';
    
    // Simuler 9 tentatives échouées
    for (let i = 0; i < 9; i++) {
      securityMonitor.recordFailedAttempt(testIP, 'Mot de passe incorrect');
    }
    
    // Vérifier que l'IP n'est pas encore suspecte
    expect(securityMonitor.isSuspicious(testIP)).to.be.false;
    
    // Ajouter une tentative supplémentaire
    securityMonitor.recordFailedAttempt(testIP, 'Mot de passe incorrect');
    
    // Maintenant l'IP devrait être suspecte
    expect(securityMonitor.isSuspicious(testIP)).to.be.true;
  });
});
```

### 1.3. Simplification de la vérification des empreintes client

**Changements effectués :**
- Comparaison des composants de l'empreinte séparément
- Acceptation si au moins 2 parties sur 4 correspondent
- Stockage de jusqu'à 5 empreintes par utilisateur

**Tests à réaliser :**
- Test unitaire : Vérifier que des empreintes similaires sont reconnues
- Test d'intégration : Simuler des connexions avec différents navigateurs/appareils

```javascript
// Test unitaire pour la vérification des empreintes client
describe('AuthService - Vérification des empreintes client', () => {
  it('devrait accepter des empreintes similaires', () => {
    const authService = new AuthService();
    const userId = 'test-user';
    
    // Empreinte initiale
    const fingerprint1 = 'Chrome:Windows:1920x1080:fr-FR';
    
    // Empreinte similaire (navigateur différent)
    const fingerprint2 = 'Firefox:Windows:1920x1080:fr-FR';
    
    // Empreinte très différente
    const fingerprint3 = 'Safari:MacOS:1440x900:en-US';
    
    // Enregistrer la première empreinte
    expect(authService.isSuspiciousActivity(userId, fingerprint1)).to.be.false;
    
    // Tester avec une empreinte similaire
    expect(authService.isSuspiciousActivity(userId, fingerprint2)).to.be.false;
    
    // Tester avec une empreinte très différente
    expect(authService.isSuspiciousActivity(userId, fingerprint3)).to.be.false;
  });
});
```

## 2. Correctifs de synchronisation Strava

### 2.1. Augmentation de la limite de synchronisations et file d'attente

**Changements effectués :**
- Augmentation de la limite de synchronisations simultanées de 5 à 10
- Implémentation d'une file d'attente pour les demandes excédentaires
- Traitement périodique de la file d'attente

**Tests à réaliser :**
- Test unitaire : Vérifier que les demandes sont mises en file d'attente lorsque la limite est atteinte
- Test d'intégration : Simuler 15 demandes simultanées et vérifier qu'elles sont toutes traitées

```javascript
// Test unitaire pour la file d'attente de synchronisation
describe('StravaSyncService - File d\'attente', () => {
  it('devrait mettre les demandes en file d\'attente lorsque la limite est atteinte', async () => {
    const syncService = new StravaSyncService();
    
    // Simuler que le maximum de synchronisations est atteint
    for (let i = 0; i < syncService.maxConcurrentSyncs; i++) {
      syncService.syncInProgress.add(`user-${i}`);
    }
    
    // Tenter de démarrer une nouvelle synchronisation
    const startPromise = syncService.startSync('new-user');
    
    // Vérifier que la demande est mise en file d'attente
    expect(syncService.syncQueue.length).to.equal(1);
    expect(syncService.syncQueue[0].userId).to.equal('new-user');
    
    // Simuler la fin d'une synchronisation
    syncService.syncInProgress.delete('user-0');
    
    // Déclencher le traitement de la file d'attente
    await syncService._processQueue();
    
    // Vérifier que la demande en file d'attente est maintenant en cours
    expect(syncService.syncInProgress.has('new-user')).to.be.true;
    expect(syncService.syncQueue.length).to.equal(0);
  });
});
```

### 2.2. Amélioration de la gestion des erreurs réseau et mécanisme de reprise

**Changements effectués :**
- Implémentation d'un mécanisme de timeout pour les requêtes API
- Gestion des erreurs avec tentatives de reprise (jusqu'à 3 fois)
- Conservation des résultats partiels en cas d'échec

**Tests à réaliser :**
- Test unitaire : Vérifier que le système réessaie après une erreur réseau
- Test d'intégration : Simuler des erreurs réseau intermittentes et vérifier la reprise

```javascript
// Test unitaire pour la gestion des erreurs et la reprise
describe('StravaSyncService - Gestion des erreurs et reprise', () => {
  it('devrait réessayer après une erreur réseau', async () => {
    const syncService = new StravaSyncService();
    let attempts = 0;
    
    // Mock de la fonction getActivities qui échoue les 2 premières fois
    const originalFetch = syncService._fetchActivitiesWithTimeout;
    syncService._fetchActivitiesWithTimeout = async (token, params) => {
      attempts++;
      if (attempts <= 2) {
        throw new Error('Erreur réseau simulée');
      }
      return [{ id: 'activity-1' }];
    };
    
    // Simuler une synchronisation
    await syncService._performSync('test-user', {});
    
    // Restaurer la fonction originale
    syncService._fetchActivitiesWithTimeout = originalFetch;
    
    // Vérifier que la fonction a été appelée 3 fois (2 échecs + 1 succès)
    expect(attempts).to.equal(3);
    
    // Vérifier que la synchronisation est marquée comme terminée
    const status = await syncService.getSyncStatus('test-user');
    expect(status.status).to.equal('completed');
  });
});
```

## 3. Plan de déploiement

1. **Environnement de test :**
   - Déployer les modifications sur l'environnement de test
   - Exécuter la suite de tests automatisés
   - Effectuer des tests manuels pour valider le comportement

2. **Tests de non-régression :**
   - Vérifier que les fonctionnalités existantes continuent de fonctionner
   - Tester spécifiquement les scénarios qui posaient problème auparavant

3. **Déploiement en production :**
   - Planifier une fenêtre de maintenance (idéalement en période de faible trafic)
   - Effectuer une sauvegarde complète de la base de données
   - Déployer les modifications par étapes :
     1. Correctifs d'authentification
     2. Correctifs de synchronisation Strava
   - Surveiller les logs et les métriques après chaque étape

4. **Surveillance post-déploiement :**
   - Surveiller les taux d'erreur d'authentification
   - Surveiller les performances et la réussite des synchronisations Strava
   - Collecter les retours utilisateurs

## 4. Documentation

Mettre à jour la documentation technique pour refléter les changements :

1. **Documentation d'architecture :**
   - Mettre à jour les diagrammes de flux pour le processus d'authentification
   - Documenter le nouveau mécanisme de file d'attente pour les synchronisations

2. **Documentation opérationnelle :**
   - Mettre à jour les procédures de surveillance
   - Documenter les nouveaux codes d'erreur et leurs résolutions

3. **Documentation utilisateur :**
   - Mettre à jour les FAQ concernant les problèmes de connexion
   - Ajouter des informations sur le comportement de la synchronisation Strava
