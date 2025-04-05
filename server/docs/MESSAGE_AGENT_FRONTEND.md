# Message à l'Agent Frontend - Coordination sur le Système d'Authentification

## Objet : Modifications du système d'authentification backend - Actions requises côté frontend

Cher Agent Frontend,

J'ai récemment finalisé une série d'améliorations significatives au système d'authentification backend de Dashboard-Velo.com. Ces modifications visent à améliorer la résilience du système et l'expérience utilisateur, mais nécessitent certaines adaptations côté frontend pour être pleinement efficaces.

## Résumé des modifications backend

1. **Validation d'empreinte client plus souple** :
   - Passage d'une validation binaire à une validation partielle avec seuil à 70%
   - Augmentation des tentatives autorisées de 5 à 15
   - Période de grâce étendue à 7 jours après changements d'empreinte
   - Pondération des attributs par stabilité

2. **Système de rotation des tokens JWT** :
   - Rotation automatique basée sur l'activité utilisateur
   - Renouvellement proactif 15 minutes avant expiration
   - Période de grâce de 60 minutes après expiration
   - Mécanisme de révocation sélective par appareil/session

3. **Nouveaux codes d'erreur** :
   - `FINGERPRINT_THRESHOLD_NOT_MET` : Empreinte partiellement reconnue
   - `TOKEN_EXPIRED_GRACE_PERIOD` : Token expiré mais dans la période de grâce
   - `TOKEN_REVOKED` : Token révoqué intentionnellement
   - `SUSPICIOUS_ACTIVITY` : Activité anormale détectée
   - `DEVICE_LIMIT_REACHED` : Limite d'appareils connectés atteinte

## Actions requises côté frontend

### 1. Gestion transparente du rafraîchissement des tokens

Implémentation prioritaire d'un intercepteur pour gérer les réponses 401/403 avec token en période de grâce :

```javascript
// Intercepteur Axios
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Éviter les boucles infinies
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    
    // Token expiré mais dans la période de grâce
    if (error.response?.status === 401 && 
        error.response?.data?.code === 'TOKEN_EXPIRED_GRACE_PERIOD') {
      
      originalRequest._retry = true;
      
      try {
        // Rafraîchir le token
        const { data } = await axios.post('/api/auth/refresh', {}, {
          headers: { 'Authorization': `Bearer ${getStoredToken()}` }
        });
        
        // Mettre à jour le token stocké
        storeToken(data.token);
        
        // Mettre à jour le header et réessayer
        originalRequest.headers['Authorization'] = `Bearer ${data.token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // En cas d'échec, rediriger vers la page de connexion
        logout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### 2. Collecte d'empreinte client améliorée

Collecter davantage d'attributs pour améliorer la précision de l'empreinte :

```javascript
// Attributs recommandés à collecter
const fingerprint = {
  userAgent: navigator.userAgent,
  language: navigator.language,
  colorDepth: window.screen.colorDepth,
  deviceMemory: navigator.deviceMemory || null,
  hardwareConcurrency: navigator.hardwareConcurrency || null,
  screenResolution: `${window.screen.width}x${window.screen.height}`,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  touchSupport: 'ontouchstart' in window,
  fonts: await collectFonts(), // Méthode à implémenter
  canvas: await generateCanvasFingerprint(), // Méthode à implémenter
  webgl: await generateWebGLFingerprint(), // Méthode à implémenter
  plugins: Array.from(navigator.plugins).map(p => p.name)
};
```

### 3. Interface de gestion des sessions

Ajouter une interface permettant aux utilisateurs de voir et gérer leurs sessions actives :

```javascript
// Exemple de récupération des sessions actives
async function fetchActiveSessions() {
  const { data } = await axios.get('/api/auth/sessions', {
    headers: { 'Authorization': `Bearer ${getStoredToken()}` }
  });
  
  return data.sessions.map(session => ({
    id: session.id,
    device: session.deviceInfo,
    lastActive: new Date(session.lastActivity),
    current: session.id === getCurrentSessionId(),
    location: session.location
  }));
}

// Exemple de révocation d'une session spécifique
async function revokeSession(sessionId) {
  await axios.post('/api/auth/revoke', { sessionId }, {
    headers: { 'Authorization': `Bearer ${getStoredToken()}` }
  });
  
  // Mettre à jour la liste des sessions
  return fetchActiveSessions();
}
```

### 4. Gestion contextuelle des erreurs d'authentification

Adapter l'interface utilisateur en fonction des nouveaux codes d'erreur :

```javascript
function handleAuthError(error) {
  const errorCode = error.response?.data?.code;
  
  switch (errorCode) {
    case 'FINGERPRINT_THRESHOLD_NOT_MET':
      showSecondaryAuthPrompt();
      break;
    
    case 'TOKEN_EXPIRED_GRACE_PERIOD':
      // Géré par l'intercepteur
      break;
    
    case 'TOKEN_REVOKED':
      logout({ reason: 'TOKEN_REVOKED' });
      showNotification({
        title: 'Session terminée',
        message: 'Votre session a été terminée sur cet appareil.',
        type: 'info'
      });
      break;
    
    case 'SUSPICIOUS_ACTIVITY':
      showSecurityAlert({
        title: 'Activité suspecte détectée',
        message: 'Nous avons détecté une activité inhabituelle sur votre compte.',
        actions: ['verify', 'report', 'ignore']
      });
      break;
    
    case 'DEVICE_LIMIT_REACHED':
      showDeviceManagement();
      break;
    
    default:
      // Gestion générique des erreurs
      showErrorNotification(error);
  }
}
```

## Calendrier recommandé

1. **Semaine 1 (immédiat)** : Implémentation de l'intercepteur de rafraîchissement des tokens
2. **Semaine 2** : Amélioration de la collecte d'empreinte client
3. **Semaine 3** : Ajout de l'interface de gestion des sessions
4. **Semaine 4** : Amélioration de la gestion contextuelle des erreurs

## Documentation complète

J'ai préparé un document détaillé avec des exemples de code, des recommandations d'implémentation et des points de coordination : `server/docs/FRONTEND_COORDINATION.md`.

Je suis disponible pour discuter de ces modifications et répondre à vos questions. Pourriez-vous me confirmer la réception de ce message et me faire part de vos premières impressions sur ces changements ?

Cordialement,
Agent Backend
