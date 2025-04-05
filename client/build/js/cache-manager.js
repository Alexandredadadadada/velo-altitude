/**
 * Gestionnaire de cache intelligent pour l'application Grand Est Cyclisme
 * Permet de stocker les données API en local pour réduire les appels réseau
 */
const CacheManager = (function() {
  // Configuration du cache
  const DEFAULT_CONFIG = {
    // Durée de validité par défaut (en secondes)
    defaultTTL: 3600, // 1 heure
    
    // Configuration spécifique par type de données
    ttlConfig: {
      weather: 1800,       // 30 minutes pour les données météo
      forecast: 7200,      // 2 heures pour les prévisions
      routes: 86400,       // 24 heures pour les itinéraires calculés
      elevation: 2592000,  // 30 jours pour les données d'élévation (ne changent pas)
      stravaAthleteStats: 43200,  // 12 heures pour les statistiques athlète
      stravaActivities: 3600,     // 1 heure pour les activités
      cols: 2592000        // 30 jours pour les cols (données statiques)
    },
    
    // Taille maximale du cache en octets (10 Mo par défaut)
    maxCacheSize: 10 * 1024 * 1024,
    
    // Stratégie d'éviction : 'lru' (least recently used) ou 'lfu' (least frequently used)
    evictionStrategy: 'lru',
    
    // Configuration de la mise en cache progressive
    progressiveCache: {
      enabled: true,       // Activer la mise en cache progressive
      criticalDataTTL: {   // TTL pour les données critiques (en secondes)
        weather: 3600,     // 1 heure pour les données météo critiques
        routes: 604800,    // 7 jours pour les itinéraires critiques
        stravaActivities: 7200  // 2 heures pour les activités Strava critiques
      },
      criticalDataKeys: [  // Liste des clés de données considérées comme critiques
        'temperature', 'condition', 'summary', 'distance', 'duration', 
        'elevation', 'difficulty', 'name', 'coordinates', 'athleteId'
      ],
      // Priorité des types de données (1 = priorité maximale)
      priority: {
        weather: 1,        // Haute priorité pour les données météo
        routes: 2,         // Priorité moyenne pour les itinéraires
        elevation: 2,      // Priorité moyenne pour les données d'élévation
        stravaActivities: 3, // Priorité basse pour les activités Strava
        cols: 1            // Haute priorité pour les informations sur les cols
      }
    },
    
    // Configuration de la synchronisation en arrière-plan
    backgroundSync: {
      enabled: true,           // Activer la synchronisation en arrière-plan
      interval: 30 * 60 * 1000, // Vérifier toutes les 30 minutes
      syncOnNetworkChange: true, // Synchroniser lors du changement d'état du réseau
      maxRetries: 3,           // Nombre maximum de tentatives
      respectBatteryStatus: true, // Respecter le statut de la batterie (si disponible)
      onlyWhenIdle: false      // Synchroniser uniquement lorsque l'appareil est inactif
    },
    
    // Gestion des requêtes API
    apiRateLimit: {
      enabled: true,           // Activer la limitation de débit des API
      quotaPerApi: {           // Quota par API (requêtes par jour)
        weather: 1000,         // OpenWeatherMap (plan gratuit)
        mapbox: 50000,         // Mapbox (plan gratuit)
        strava: 100,           // Strava API (limite stricte)
        openroute: 500         // OpenRouteService (plan gratuit)
      },
      // Stratégie de conservation des requêtes (pourcentage du quota à conserver)
      conserveQuota: 0.1       // Conserver 10% du quota pour les requêtes critiques
    }
  };
  
  // État du cache
  let cacheConfig = {...DEFAULT_CONFIG};
  let cacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    lastCleanup: Date.now(),
    pendingSync: [],
    apiUsage: {}
  };
  
  /**
   * Génère une clé de cache unique pour une ressource
   * @param {string} type Type de ressource (weather, routes, etc.)
   * @param {object} params Paramètres de la ressource
   * @returns {string} Clé de cache
   */
  function generateCacheKey(type, params) {
    // Conversion des paramètres en chaîne triée pour assurer la cohérence des clés
    const sortedParams = Object.entries(params || {})
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join('&');
    
    return `${type}:${sortedParams}`;
  }
  
  /**
   * Calcule la taille approximative d'un objet en mémoire (en octets)
   * @param {*} object Objet à mesurer
   * @returns {number} Taille approximative en octets
   */
  function getObjectSize(object) {
    // Conversion en JSON pour avoir une mesure approximative
    const jsonString = JSON.stringify(object);
    return jsonString.length * 2; // Estimation pour UTF-16
  }
  
  /**
   * Vérifie si une entrée de cache est encore valide
   * @param {object} cacheEntry Entrée de cache à vérifier
   * @returns {boolean} True si l'entrée est valide, false sinon
   */
  function isEntryValid(cacheEntry) {
    if (!cacheEntry) return false;
    return Date.now() < cacheEntry.expiry;
  }
  
  /**
   * Nettoie les entrées expirées du cache
   */
  function cleanupExpiredEntries() {
    const now = Date.now();
    let removedSize = 0;
    
    // Ne nettoyer que toutes les 5 minutes maximum
    if (now - cacheStats.lastCleanup < 300000) return;
    
    cacheStats.lastCleanup = now;
    
    Object.keys(localStorage).forEach(key => {
      // Ne traiter que les clés qui appartiennent à notre cache
      if (!key.includes(':')) return;
      
      try {
        const entry = JSON.parse(localStorage.getItem(key));
        if (entry && entry.expiry && entry.expiry < now) {
          removedSize += getObjectSize(entry);
          localStorage.removeItem(key);
          cacheStats.evictions++;
        }
      } catch (e) {
        // Ignorer les erreurs de parsing
        console.warn(`Erreur lors du nettoyage de l'entrée de cache ${key}:`, e);
      }
    });
    
    // Mettre à jour la taille du cache
    cacheStats.size -= removedSize;
    
    console.log(`Nettoyage du cache terminé: ${cacheStats.evictions} entrées expirées supprimées (${Math.round(removedSize / 1024)} Ko)`);
  }
  
  /**
   * Évince des entrées du cache selon la stratégie configurée si nécessaire
   * @param {number} requiredSpace Espace requis en octets
   */
  function evictEntries(requiredSpace) {
    // Liste des entrées de cache avec leurs métadonnées
    const entries = [];
    let currentSize = 0;
    
    // Collecter toutes les entrées de cache
    Object.keys(localStorage).forEach(key => {
      if (!key.includes(':')) return;
      
      try {
        const entry = JSON.parse(localStorage.getItem(key));
        if (entry && entry.data) {
          const size = getObjectSize(entry);
          currentSize += size;
          
          entries.push({
            key,
            lastAccess: entry.lastAccess || 0,
            accessCount: entry.accessCount || 0,
            size,
            expiry: entry.expiry || 0
          });
        }
      } catch (e) {
        console.warn(`Erreur lors de la lecture de l'entrée de cache ${key}:`, e);
      }
    });
    
    // Si le cache est encore sous la limite, pas besoin d'évincer
    if (currentSize + requiredSpace <= cacheConfig.maxCacheSize) {
      return;
    }
    
    // Trier les entrées selon la stratégie d'éviction
    if (cacheConfig.evictionStrategy === 'lru') {
      // Least Recently Used - éviction par date d'accès
      entries.sort((a, b) => a.lastAccess - b.lastAccess);
    } else {
      // Least Frequently Used - éviction par fréquence d'utilisation
      entries.sort((a, b) => a.accessCount - b.accessCount);
    }
    
    // Éviction des entrées jusqu'à libérer assez d'espace
    let freedSpace = 0;
    let evictedCount = 0;
    
    for (const entry of entries) {
      localStorage.removeItem(entry.key);
      freedSpace += entry.size;
      evictedCount++;
      
      if (currentSize - freedSpace + requiredSpace <= cacheConfig.maxCacheSize) {
        break;
      }
    }
    
    // Mettre à jour les statistiques
    cacheStats.evictions += evictedCount;
    cacheStats.size = currentSize - freedSpace;
    
    console.log(`Éviction de cache: ${evictedCount} entrées supprimées (${Math.round(freedSpace / 1024)} Ko libérés)`);
  }
  
  /**
   * Enregistre une valeur dans le cache
   * @param {string} type Type de ressource
   * @param {object} params Paramètres de la ressource
   * @param {*} data Données à mettre en cache
   * @param {number} [customTTL] Durée de validité personnalisée (en secondes)
   */
  function set(type, params, data, customTTL) {
    if (!data) {
      console.warn('CacheManager: Tentative de mise en cache de données nulles');
      return;
    }
    
    try {
      // Générer la clé de cache
      const key = generateCacheKey(type, params);
      
      // Obtenir la taille des données
      const dataSize = getObjectSize(data);
      
      // Vérifier si on a assez d'espace
      if (cacheStats.size + dataSize > cacheConfig.maxCacheSize) {
        // Libérer de l'espace
        evictEntries(dataSize);
      }
      
      // Déterminer la TTL à utiliser
      let ttl = customTTL;
      if (!ttl) {
        ttl = cacheConfig.ttlConfig[type] || cacheConfig.defaultTTL;
      }
      
      // Préparer l'entrée de cache complète
      const fullEntry = {
        type,
        data,
        timestamp: Date.now(),
        expiry: Date.now() + (ttl * 1000),
        size: dataSize,
        lastAccess: Date.now(),
        accessCount: 0,
        isCritical: false,
        isComplete: true
      };
      
      // Si la mise en cache progressive est activée, extraire et stocker les données critiques
      if (cacheConfig.progressiveCache.enabled) {
        // Extraire les données critiques
        const criticalData = extractCriticalData(type, data);
        
        if (criticalData) {
          // Calculer la TTL pour les données critiques
          const criticalTTL = cacheConfig.progressiveCache.criticalDataTTL[type] || ttl * 2;
          
          // Préparer l'entrée de cache critique
          const criticalEntry = {
            type,
            data: criticalData,
            timestamp: Date.now(),
            expiry: Date.now() + (criticalTTL * 1000),
            size: getObjectSize(criticalData),
            lastAccess: Date.now(),
            accessCount: 0,
            isCritical: true,
            isComplete: false
          };
          
          // Stocker les données critiques
          try {
            localStorage.setItem(`${key}:critical`, JSON.stringify(criticalEntry));
            // Mettre à jour la taille du cache
            cacheStats.size += criticalEntry.size;
          } catch (e) {
            console.warn('Erreur lors du stockage des données critiques:', e);
          }
        }
      }
      
      // Stocker les données complètes
      try {
        localStorage.setItem(key, JSON.stringify(fullEntry));
        // Mettre à jour la taille du cache
        cacheStats.size += dataSize;
      } catch (e) {
        console.error('Erreur lors du stockage dans le cache:', e);
        
        // En cas d'erreur (par exemple, localStorage plein), nettoyer et réessayer
        cleanupExpiredEntries();
        try {
          localStorage.setItem(key, JSON.stringify(fullEntry));
          cacheStats.size += dataSize;
        } catch (e2) {
          console.error('Échec du stockage même après nettoyage:', e2);
          // Si toujours impossible, évincer des entrées plus agressivement
          evictEntries(dataSize * 2); // Libérer 2x plus d'espace que nécessaire
          try {
            localStorage.setItem(key, JSON.stringify(fullEntry));
            cacheStats.size += dataSize;
          } catch (e3) {
            console.error('Stockage impossible, abandon:', e3);
            // Si toujours impossible, abandonner le stockage
          }
        }
      }
    } catch (error) {
      console.error('Exception lors de la mise en cache:', error);
    }
  }
  
  /**
   * Récupère une valeur depuis le cache
   * @param {string} type Type de ressource 
   * @param {object} params Paramètres de la ressource
   * @returns {object|null} Données mises en cache ou null si non trouvées/expirées
   */
  function get(type, params) {
    try {
      // Générer la clé de cache
      const key = generateCacheKey(type, params);
      
      // Vérifier si des données complètes existent
      let entry = null;
      let criticalEntry = null;
      let fromCritical = false;
      
      try {
        const storedEntry = localStorage.getItem(key);
        if (storedEntry) {
          entry = JSON.parse(storedEntry);
        }
      } catch (e) {
        console.warn(`Erreur lors de la lecture des données complètes pour ${key}:`, e);
      }
      
      // Si les données complètes sont valides
      if (entry && isEntryValid(entry)) {
        // Mettre à jour les statistiques d'accès
        entry.lastAccess = Date.now();
        entry.accessCount = (entry.accessCount || 0) + 1;
        
        try {
          localStorage.setItem(key, JSON.stringify(entry));
        } catch (e) {
          // Ignorer les erreurs de mise à jour
        }
        
        cacheStats.hits++;
        
        // Calculer le temps restant avant expiration (en secondes)
        const expiresIn = Math.round((entry.expiry - Date.now()) / 1000);
        
        // Si l'entrée expire bientôt, ajouter à la file d'attente de synchronisation
        if (expiresIn < 300) { // Moins de 5 minutes
          // Priorité basée sur le type de données
          const priority = cacheConfig.progressiveCache.priority[type] || 5;
          addToSyncQueue(type, params, priority);
        }
        
        // Retourner les données avec les métadonnées de cache
        return {
          data: entry.data,
          fromCache: true,
          cacheAge: Math.round((Date.now() - entry.timestamp) / 1000),
          cacheExpiresIn: expiresIn,
          cacheType: 'complete'
        };
      }
      
      // Si les données complètes ne sont pas disponibles, vérifier les données critiques
      if (cacheConfig.progressiveCache.enabled) {
        try {
          const storedCriticalEntry = localStorage.getItem(`${key}:critical`);
          if (storedCriticalEntry) {
            criticalEntry = JSON.parse(storedCriticalEntry);
          }
        } catch (e) {
          console.warn(`Erreur lors de la lecture des données critiques pour ${key}:`, e);
        }
        
        // Si les données critiques sont valides
        if (criticalEntry && isEntryValid(criticalEntry)) {
          // Mettre à jour les statistiques d'accès
          criticalEntry.lastAccess = Date.now();
          criticalEntry.accessCount = (criticalEntry.accessCount || 0) + 1;
          
          try {
            localStorage.setItem(`${key}:critical`, JSON.stringify(criticalEntry));
          } catch (e) {
            // Ignorer les erreurs de mise à jour
          }
          
          cacheStats.hits++;
          fromCritical = true;
          
          // Ajouter à la file d'attente de synchronisation avec haute priorité
          const priority = Math.max(1, (cacheConfig.progressiveCache.priority[type] || 5) - 1);
          addToSyncQueue(type, params, priority);
          
          // Calculer le temps restant avant expiration (en secondes)
          const expiresIn = Math.round((criticalEntry.expiry - Date.now()) / 1000);
          
          // Retourner les données critiques avec métadonnées
          return {
            data: criticalEntry.data,
            fromCache: true,
            cacheAge: Math.round((Date.now() - criticalEntry.timestamp) / 1000),
            cacheExpiresIn: expiresIn,
            cacheType: 'critical'
          };
        }
      }
      
      // Aucune donnée valide trouvée
      cacheStats.misses++;
      
      // Ajouter à la file d'attente de synchronisation
      const priority = cacheConfig.progressiveCache.priority[type] || 5;
      addToSyncQueue(type, params, priority);
      
      return null;
    } catch (error) {
      console.error('Exception lors de la récupération depuis le cache:', error);
      return null;
    }
  }
  
  /**
   * Supprime une entrée spécifique du cache
   * @param {string} type Type de ressource
   * @param {object} params Paramètres de la ressource
   */
  function remove(type, params) {
    const key = generateCacheKey(type, params);
    localStorage.removeItem(key);
  }
  
  /**
   * Efface toutes les entrées de cache d'un type spécifique
   * @param {string} type Type de ressource à effacer
   */
  function clearType(type) {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(`${type}:`)) {
        localStorage.removeItem(key);
      }
    });
    
    // Recalculer la taille du cache
    calculateCacheSize();
  }
  
  /**
   * Efface tout le cache
   */
  function clearAll() {
    Object.keys(localStorage).forEach(key => {
      if (key.includes(':')) {
        localStorage.removeItem(key);
      }
    });
    
    // Réinitialiser les statistiques
    cacheStats.size = 0;
    cacheStats.evictions = 0;
  }
  
  /**
   * Calcule la taille actuelle du cache
   */
  function calculateCacheSize() {
    let totalSize = 0;
    
    Object.keys(localStorage).forEach(key => {
      if (key.includes(':')) {
        const size = localStorage.getItem(key).length * 2;
        totalSize += size;
      }
    });
    
    cacheStats.size = totalSize;
    return totalSize;
  }
  
  /**
   * Configure le gestionnaire de cache
   * @param {object} config Nouvelle configuration
   */
  function configure(config) {
    cacheConfig = {...cacheConfig, ...config};
  }
  
  /**
   * Récupère les statistiques du cache
   * @returns {object} Statistiques
   */
  function getStats() {
    const hitRatio = cacheStats.hits + cacheStats.misses > 0
      ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(2)
      : 0;
      
    return {
      ...cacheStats,
      hitRatio,
      sizeKB: Math.round(cacheStats.size / 1024),
      maxSizeKB: Math.round(cacheConfig.maxCacheSize / 1024),
      usagePercent: (cacheStats.size / cacheConfig.maxCacheSize * 100).toFixed(2)
    };
  }
  
  /**
   * Récupère les détails des entrées actuellement en cache
   * @returns {Array} Liste des entrées en cache avec leurs métadonnées
   */
  function getCacheEntries() {
    const entries = [];
    
    Object.keys(localStorage).forEach(key => {
      if (!key.includes(':')) return;
      
      try {
        const entry = JSON.parse(localStorage.getItem(key));
        if (entry && entry.type) {
          const [type, params] = key.split(':');
          entries.push({
            key,
            type,
            params,
            size: getObjectSize(entry),
            expiry: entry.expiry,
            expiresIn: Math.round((entry.expiry - Date.now()) / 1000),
            lastAccess: entry.lastAccess,
            accessCount: entry.accessCount || 0,
            isValid: isEntryValid(entry)
          });
        }
      } catch (e) {
        // Ignorer les erreurs de parsing
      }
    });
    
    return entries;
  }
  
  /**
   * Ajoute un indicateur visuel pour les données en cache
   */
  function addCacheIndicator(element, cacheInfo) {
    if (!element || !cacheInfo || !cacheInfo.fromCache) return;
    
    // Créer un indicateur de cache
    const indicator = document.createElement('div');
    indicator.className = 'cache-indicator';
    
    // Calculer la fraîcheur des données (de 0 à 100%)
    const totalTTL = cacheInfo.cacheAge + cacheInfo.cacheExpiresIn;
    const freshness = Math.max(0, Math.min(100, (cacheInfo.cacheExpiresIn / totalTTL) * 100));
    
    // Formater le temps restant
    let timeText;
    if (cacheInfo.cacheExpiresIn < 60) {
      timeText = `${cacheInfo.cacheExpiresIn}s`;
    } else if (cacheInfo.cacheExpiresIn < 3600) {
      timeText = `${Math.floor(cacheInfo.cacheExpiresIn / 60)}m`;
    } else {
      timeText = `${Math.floor(cacheInfo.cacheExpiresIn / 3600)}h`;
    }
    
    // Définir la couleur en fonction de la fraîcheur
    let color;
    if (freshness > 70) {
      color = 'var(--success-color, #28a745)';
    } else if (freshness > 30) {
      color = 'var(--warning-color, #ffc107)';
    } else {
      color = 'var(--danger-color, #dc3545)';
    }
    
    // Définir le HTML de l'indicateur
    indicator.innerHTML = `
      <div class="cache-icon" style="background-color: ${color};" title="Données en cache - Expire dans ${timeText}">
        <i class="fas fa-database"></i>
      </div>
    `;
    
    // Ajouter l'indicateur à l'élément
    element.style.position = 'relative';
    element.appendChild(indicator);
    
    // Ajouter la fonctionnalité de rafraîchissement au clic
    indicator.addEventListener('click', (e) => {
      e.stopPropagation();
      // Déclencher un événement personnalisé que les modules peuvent écouter
      element.dispatchEvent(new CustomEvent('refreshCachedData', {
        bubbles: true,
        detail: { element }
      }));
    });
  }
  
  /**
   * Extraie les données critiques d'un objet selon la configuration
   * @param {string} type Type de données
   * @param {Object} data Données complètes
   * @returns {Object} Données critiques extraites
   */
  function extractCriticalData(type, data) {
    if (!cacheConfig.progressiveCache.enabled || !data) {
      return null;
    }
    
    // Obtenir les clés critiques
    const criticalKeys = cacheConfig.progressiveCache.criticalDataKeys;
    
    // Fonction récursive pour extraire les données critiques
    function extractFromObject(obj) {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }
      
      // Pour les tableaux, traiter chaque élément
      if (Array.isArray(obj)) {
        return obj.map(item => extractFromObject(item));
      }
      
      // Pour les objets, extraire les clés critiques
      const result = {};
      Object.keys(obj).forEach(key => {
        // Inclure la clé si elle est critique ou si c'est un identifiant
        if (criticalKeys.includes(key) || key === 'id' || key.endsWith('Id')) {
          result[key] = obj[key];
        } 
        // Pour les objets imbriqués, appliquer la même logique
        else if (typeof obj[key] === 'object' && obj[key] !== null) {
          const extractedNested = extractFromObject(obj[key]);
          // N'inclure que si des données ont été extraites
          if (extractedNested && 
              (Array.isArray(extractedNested) ? extractedNested.length > 0 : Object.keys(extractedNested).length > 0)) {
            result[key] = extractedNested;
          }
        }
      });
      
      return Object.keys(result).length > 0 ? result : null;
    }
    
    return extractFromObject(data);
  }
  
  /**
   * Fusionne les données critiques avec les données complètes
   * @param {Object} criticalData Données critiques
   * @param {Object} fullData Données complètes
   * @returns {Object} Données fusionnées
   */
  function mergeCacheData(criticalData, fullData) {
    if (!criticalData) return fullData;
    if (!fullData) return criticalData;
    
    // Si les données sont des tableaux
    if (Array.isArray(criticalData) && Array.isArray(fullData)) {
      // Créer un index des éléments par ID pour faciliter la fusion
      const idMap = {};
      
      // Indexer les éléments des données critiques
      criticalData.forEach(item => {
        if (item && item.id) {
          idMap[item.id] = { ...item };
        }
      });
      
      // Fusionner avec les données complètes
      return fullData.map(item => {
        if (item && item.id && idMap[item.id]) {
          return { ...idMap[item.id], ...item };
        }
        return item;
      });
    }
    
    // Si ce sont des objets
    if (typeof criticalData === 'object' && typeof fullData === 'object') {
      return { ...criticalData, ...fullData };
    }
    
    // Si les types ne correspondent pas, privilégier les données complètes
    return fullData;
  }
  
  /**
   * Ajoute une entrée à la file d'attente de synchronisation
   * @param {string} type Type de données
   * @param {Object} params Paramètres de la ressource
   * @param {number} priority Priorité de synchronisation (plus petit = plus prioritaire)
   */
  function addToSyncQueue(type, params, priority = 5) {
    if (!cacheConfig.backgroundSync.enabled) {
      return;
    }
    
    const key = generateCacheKey(type, params);
    
    // Vérifier si l'entrée est déjà dans la file d'attente
    const existingIndex = cacheStats.pendingSync.findIndex(item => item.key === key);
    
    if (existingIndex >= 0) {
      // Mettre à jour la priorité si c'est plus prioritaire
      if (priority < cacheStats.pendingSync[existingIndex].priority) {
        cacheStats.pendingSync[existingIndex].priority = priority;
      }
      cacheStats.pendingSync[existingIndex].retries = 0; // Réinitialiser les tentatives
    } else {
      // Ajouter à la file d'attente
      cacheStats.pendingSync.push({
        key,
        type,
        params,
        priority,
        timestamp: Date.now(),
        retries: 0
      });
      
      // Trier la file d'attente par priorité
      cacheStats.pendingSync.sort((a, b) => a.priority - b.priority);
    }
    
    // Stocker la file d'attente dans localStorage
    try {
      localStorage.setItem('cacheManagerSyncQueue', JSON.stringify(cacheStats.pendingSync));
    } catch (e) {
      console.warn('Impossible de sauvegarder la file d\'attente de synchronisation:', e);
    }
  }
  
  /**
   * Traite la file d'attente de synchronisation en arrière-plan
   */
  function processBackgroundSync() {
    if (!cacheConfig.backgroundSync.enabled || cacheStats.pendingSync.length === 0) {
      return;
    }
    
    // Vérifier si les conditions permettent la synchronisation
    if (cacheConfig.backgroundSync.respectBatteryStatus && 'getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        if (battery.charging || battery.level > 0.2) { // Batterie > 20% ou en charge
          performNextSync();
        }
      }).catch(() => {
        // En cas d'erreur, continuer quand même
        performNextSync();
      });
    } else {
      performNextSync();
    }
  }
  
  /**
   * Effectue la prochaine synchronisation dans la file d'attente
   */
  function performNextSync() {
    if (cacheStats.pendingSync.length === 0) {
      return;
    }
    
    // Prendre le premier élément de la file (plus haute priorité)
    const syncItem = cacheStats.pendingSync[0];
    
    // Ne pas dépasser le nombre maximum de tentatives
    if (syncItem.retries >= cacheConfig.backgroundSync.maxRetries) {
      // Supprimer de la file d'attente
      cacheStats.pendingSync.shift();
      console.warn(`Synchronisation abandonnée pour ${syncItem.key} après ${syncItem.retries} tentatives.`);
      
      // Mettre à jour localStorage
      try {
        localStorage.setItem('cacheManagerSyncQueue', JSON.stringify(cacheStats.pendingSync));
      } catch (e) {
        console.warn('Impossible de mettre à jour la file d\'attente de synchronisation:', e);
      }
      
      // Passer à l'élément suivant
      processBackgroundSync();
      return;
    }
    
    // Incrémenter le compteur de tentatives
    syncItem.retries++;
    
    // Déclencher un événement pour que les modules concernés effectuent la synchronisation
    document.dispatchEvent(new CustomEvent('backgroundSync', {
      detail: {
        type: syncItem.type,
        params: syncItem.params,
        key: syncItem.key,
        onSuccess: () => {
          // Supprimer de la file d'attente en cas de succès
          cacheStats.pendingSync.shift();
          
          // Mettre à jour localStorage
          try {
            localStorage.setItem('cacheManagerSyncQueue', JSON.stringify(cacheStats.pendingSync));
          } catch (e) {
            console.warn('Impossible de mettre à jour la file d\'attente de synchronisation:', e);
          }
          
          // Continuer avec l'élément suivant
          setTimeout(processBackgroundSync, 1000);
        },
        onError: () => {
          // En cas d'erreur, déplacer l'item à la fin de la file pour réessayer plus tard
          const item = cacheStats.pendingSync.shift();
          cacheStats.pendingSync.push(item);
          
          // Mettre à jour localStorage
          try {
            localStorage.setItem('cacheManagerSyncQueue', JSON.stringify(cacheStats.pendingSync));
          } catch (e) {
            console.warn('Impossible de mettre à jour la file d\'attente de synchronisation:', e);
          }
          
          // Continuer avec l'élément suivant après un délai
          setTimeout(processBackgroundSync, 5000);
        }
      }
    }));
  }
  
  /**
   * Vérifie et limite l'utilisation des API selon les quotas configurés
   * @param {string} apiName Nom de l'API
   * @returns {boolean} True si l'API peut être utilisée, false sinon
   */
  function checkApiRateLimit(apiName) {
    if (!cacheConfig.apiRateLimit.enabled) {
      return true;
    }
    
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    // Initialiser le compteur pour aujourd'hui si nécessaire
    if (!cacheStats.apiUsage[today]) {
      cacheStats.apiUsage[today] = {};
      
      // Nettoyer les anciennes entrées (garder seulement les 7 derniers jours)
      const dates = Object.keys(cacheStats.apiUsage).sort();
      while (dates.length > 7) {
        delete cacheStats.apiUsage[dates.shift()];
      }
    }
    
    if (!cacheStats.apiUsage[today][apiName]) {
      cacheStats.apiUsage[today][apiName] = 0;
    }
    
    // Vérifier le quota
    const quota = cacheConfig.apiRateLimit.quotaPerApi[apiName] || 1000;
    const currentUsage = cacheStats.apiUsage[today][apiName];
    const conserveAmount = Math.floor(quota * cacheConfig.apiRateLimit.conserveQuota);
    
    // Si on a atteint ou dépassé le quota moins la marge de conservation
    if (currentUsage >= (quota - conserveAmount)) {
      console.warn(`Quota API atteint pour ${apiName}: ${currentUsage}/${quota} (conservant ${conserveAmount} requêtes)`);
      return false;
    }
    
    // Incrémenter l'utilisation
    cacheStats.apiUsage[today][apiName]++;
    
    // Enregistrer l'utilisation dans localStorage
    try {
      localStorage.setItem('cacheManagerApiUsage', JSON.stringify(cacheStats.apiUsage));
    } catch (e) {
      console.warn('Impossible d\'enregistrer l\'utilisation des API:', e);
    }
    
    return true;
  }

  /**
   * Initialise le gestionnaire de cache
   */
  function init() {
    console.log('Initialisation du gestionnaire de cache...');
    
    // Restaurer la file d'attente de synchronisation depuis localStorage
    try {
      const savedQueue = localStorage.getItem('cacheManagerSyncQueue');
      if (savedQueue) {
        cacheStats.pendingSync = JSON.parse(savedQueue);
        console.log(`${cacheStats.pendingSync.length} éléments chargés dans la file d'attente de synchronisation`);
      }
    } catch (e) {
      console.warn('Erreur lors du chargement de la file d\'attente de synchronisation:', e);
    }
    
    // Restaurer les statistiques d'utilisation des API
    try {
      const savedApiUsage = localStorage.getItem('cacheManagerApiUsage');
      if (savedApiUsage) {
        cacheStats.apiUsage = JSON.parse(savedApiUsage);
      }
    } catch (e) {
      console.warn('Erreur lors du chargement des statistiques d\'utilisation des API:', e);
    }
    
    // Calculer la taille du cache actuel
    recalculateCacheSize();
    
    // Configurer les écouteurs d'événements pour le réseau
    if (navigator.connection) {
      navigator.connection.addEventListener('change', handleNetworkChange);
    }
    
    // Configurer l'écouteur d'événements pour la batterie
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        battery.addEventListener('chargingchange', handleBatteryChange);
      }).catch(e => {
        console.warn('Impossible d\'accéder à l\'API de batterie:', e);
      });
    }
    
    // Traiter la file d'attente de synchronisation
    if (cacheConfig.backgroundSync.enabled) {
      // Première synchronisation après 10 secondes (laisser le temps à l'application de se charger)
      setTimeout(() => {
        processBackgroundSync();
        
        // Configurer le traitement périodique
        setInterval(processBackgroundSync, cacheConfig.backgroundSync.interval);
      }, 10000);
    }
    
    // Nettoyer les entrées expirées au démarrage
    cleanupExpiredEntries();
    
    console.log('Gestionnaire de cache initialisé.');
  }
  
  /**
   * Recalcule la taille totale du cache
   */
  function recalculateCacheSize() {
    let totalSize = 0;
    
    // Parcourir toutes les entrées de localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // Ne considérer que les entrées de notre cache
      if (key.startsWith('cache:')) {
        try {
          const entry = JSON.parse(localStorage.getItem(key));
          if (entry && entry.size) {
            totalSize += entry.size;
          } else if (entry) {
            // Calculer la taille pour les anciennes entrées sans la propriété size
            const entrySize = getObjectSize(entry);
            totalSize += entrySize;
          }
        } catch (e) {
          console.warn(`Erreur lors de la lecture de l'entrée cache ${key}:`, e);
        }
      }
    }
    
    cacheStats.size = totalSize;
    console.log(`Taille du cache recalculée: ${Math.round(totalSize / 1024)} Ko`);
  }
  
  /**
   * Gestionnaire de changement d'état du réseau
   */
  function handleNetworkChange() {
    if (!cacheConfig.backgroundSync.enabled || !cacheConfig.backgroundSync.syncOnNetworkChange) {
      return;
    }
    
    const online = navigator.onLine;
    console.log(`État du réseau changé: ${online ? 'En ligne' : 'Hors ligne'}`);
    
    if (online) {
      // Si on revient en ligne, lancer une synchronisation
      processBackgroundSync();
    }
  }
  
  /**
   * Gestionnaire de changement d'état de la batterie
   * @param {Event} event Événement de changement de la batterie
   */
  function handleBatteryChange(event) {
    if (!cacheConfig.backgroundSync.enabled || !cacheConfig.backgroundSync.respectBatteryStatus) {
      return;
    }
    
    const battery = event.target;
    
    // Si on se met en charge, lancer une synchronisation
    if (battery.charging) {
      console.log('Appareil en charge, lancement de la synchronisation...');
      processBackgroundSync();
    }
  }

  // Initialiser le gestionnaire de cache au chargement
  // On utilise setTimeout pour s'assurer que le document est complètement chargé
  setTimeout(init, 500);

  // API publique
  return {
    set,
    get,
    remove,
    clearType,
    clearAll,
    configure,
    getStats,
    getCacheEntries,
    addCacheIndicator,
    extractCriticalData,
    mergeCacheData,
    addToSyncQueue,
    processBackgroundSync,
    checkApiRateLimit,
    init
  };
})();

// Rendre disponible globalement
window.CacheManager = CacheManager;

// Ajouter des écouteurs d'événements pour les modules qui souhaitent répondre aux événements de synchronisation
document.addEventListener('backgroundSync', function(event) {
  const { type, params, key, onSuccess, onError } = event.detail;
  
  // Déléguer à la fonction appropriée selon le type de données
  switch (type) {
    case 'weather':
      if (window.weather && typeof window.weather.fetchWeatherData === 'function') {
        window.weather.fetchWeatherData(params.lat, params.lon)
          .then(() => onSuccess())
          .catch(() => onError());
      } else {
        onError();
      }
      break;
      
    case 'forecast':
      if (window.weather && typeof window.weather.fetchForecast === 'function') {
        window.weather.fetchForecast(params.lat, params.lon)
          .then(() => onSuccess())
          .catch(() => onError());
      } else {
        onError();
      }
      break;
      
    case 'routes':
      if (window.router && typeof window.router.fetchRoute === 'function') {
        window.router.fetchRoute(params.start, params.end, params.profile)
          .then(() => onSuccess())
          .catch(() => onError());
      } else {
        onError();
      }
      break;
      
    case 'stravaActivities':
      if (window.strava && typeof window.strava.fetchActivities === 'function') {
        window.strava.fetchActivities()
          .then(() => onSuccess())
          .catch(() => onError());
      } else {
        onError();
      }
      break;
      
    case 'stravaAthleteStats':
      if (window.strava && typeof window.strava.fetchAthleteStats === 'function') {
        window.strava.fetchAthleteStats()
          .then(() => onSuccess())
          .catch(() => onError());
      } else {
        onError();
      }
      break;
      
    default:
      console.warn(`Type de synchronisation non pris en charge: ${type}`);
      onError();
  }
});

// Ajouter les styles CSS pour l'indicateur de cache
(function() {
  const style = document.createElement('style');
  style.textContent = `
    .cache-indicator {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 10;
    }
    
    .cache-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      cursor: pointer;
      transition: transform 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    
    .cache-icon:hover {
      transform: scale(1.1);
    }
  `;
  document.head.appendChild(style);
})();
