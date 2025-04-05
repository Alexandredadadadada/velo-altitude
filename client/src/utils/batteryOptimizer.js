/**
 * Service d'optimisation pour la gestion de la batterie dans les applications 3D
 * Ce service surveille l'état de la batterie et fournit des configurations
 * optimisées pour réduire la consommation sur les appareils mobiles.
 */

class BatteryOptimizer {
  constructor() {
    this.batteryData = {
      isSupported: false,
      level: 1.0,
      charging: true,
      dischargingTime: Infinity
    };
    this.listeners = [];
    this.batteryModeActive = false;
    this.initialized = false;

    // Configurations d'optimisation pour le mode batterie
    this.batterySavingConfig = {
      maxPixelRatio: 1.0,
      shadowsEnabled: false,
      useSimplifiedGeometry: true,
      minimizeObjects: true,
      maxDistanceMarkers: 5,
      antialias: false,
      maxLights: 1,
      useLowResTextures: true,
      disablePostProcessing: true,
      throttleFPS: true,
      targetFPS: 30,
      enableFrustumCulling: true
    };

    // Seuils pour le mode batterie
    this.thresholds = {
      lowBatteryLevel: 0.3,      // Niveau sous lequel activer automatiquement le mode batterie
      criticalBatteryLevel: 0.15, // Niveau critique pour des optimisations maximales
      dischargingTimeWarning: 30 * 60, // 30 minutes en secondes
    };

    this.autoEnableBatteryMode = true; // Option à configurer par l'utilisateur
  }

  /**
   * Initialise le service et tente d'accéder à l'API Battery
   * @returns {Promise<boolean>} - True si l'API est supportée
   */
  async initialize() {
    if (this.initialized) return this.batteryData.isSupported;

    // Vérifier si l'API Battery est disponible
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        this.batteryData.isSupported = true;
        this.updateBatteryInfo(battery);
        
        // Ajouter les event listeners
        battery.addEventListener('levelchange', () => this.updateBatteryInfo(battery));
        battery.addEventListener('chargingchange', () => this.updateBatteryInfo(battery));
        battery.addEventListener('dischargingtimechange', () => this.updateBatteryInfo(battery));
        
        // Vérifier si nous devons activer le mode d'économie
        this.checkBatteryStatus();
        
        console.log('BatteryOptimizer: API Battery initialisée avec succès');
      } catch (error) {
        console.error('BatteryOptimizer: Erreur lors de l\'initialisation de l\'API Battery', error);
        this.batteryData.isSupported = false;
      }
    } else {
      console.log('BatteryOptimizer: API Battery non supportée par ce navigateur');
      this.batteryData.isSupported = false;
    }
    
    this.initialized = true;
    return this.batteryData.isSupported;
  }

  /**
   * Met à jour les informations de la batterie
   * @param {BatteryManager} battery - L'objet BatteryManager
   */
  updateBatteryInfo(battery) {
    const previousLevel = this.batteryData.level;
    const previousCharging = this.batteryData.charging;
    
    this.batteryData.level = battery.level;
    this.batteryData.charging = battery.charging;
    this.batteryData.dischargingTime = battery.dischargingTime;
    
    // Notifier les listeners seulement si des changements importants sont détectés
    const significantChange = 
      Math.abs(previousLevel - battery.level) > 0.05 || // Changement de 5% ou plus
      previousCharging !== battery.charging; // Changement d'état de chargement
      
    if (significantChange) {
      this.notifyListeners();
      this.checkBatteryStatus();
    }
  }

  /**
   * Vérifie l'état de la batterie et active le mode économie si nécessaire
   */
  checkBatteryStatus() {
    if (!this.batteryData.isSupported || !this.autoEnableBatteryMode) return;
    
    // Si en charge, on peut désactiver le mode économie
    if (this.batteryData.charging && this.batteryModeActive) {
      this.setBatteryMode(false);
      console.log('BatteryOptimizer: Appareil en charge, désactivation du mode économie de batterie');
      return;
    }
    
    // Si le niveau est bas et pas en charge, on active le mode économie
    if (!this.batteryData.charging) {
      if (this.batteryData.level <= this.thresholds.lowBatteryLevel && !this.batteryModeActive) {
        this.setBatteryMode(true);
        console.log(`BatteryOptimizer: Batterie faible (${Math.round(this.batteryData.level * 100)}%), activation du mode économie`);
      }
      
      // Si le niveau est critique, on peut ajouter des optimisations supplémentaires
      if (this.batteryData.level <= this.thresholds.criticalBatteryLevel) {
        console.log(`BatteryOptimizer: Niveau de batterie critique (${Math.round(this.batteryData.level * 100)}%), optimisations maximales`);
        // Ici on pourrait notifier l'utilisateur ou ajouter des optimisations plus agressives
      }
    }
  }

  /**
   * Active ou désactive le mode économie de batterie
   * @param {boolean} active - True pour activer, false pour désactiver
   */
  setBatteryMode(active) {
    if (this.batteryModeActive === active) return;
    
    this.batteryModeActive = active;
    
    // Notification à tous les composants écoutant ce service
    this.notifyListeners();
    
    // Stocker la préférence utilisateur dans localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('batteryModeEnabled', active ? 'true' : 'false');
    }
    
    console.log(`BatteryOptimizer: Mode économie de batterie ${active ? 'activé' : 'désactivé'}`);
  }

  /**
   * Obtient la configuration optimisée pour la visualisation 3D
   * @returns {Object} Configuration d'optimisation
   */
  getBatterySavingConfig() {
    if (!this.batteryModeActive) return null;
    
    // Pour le niveau critique, on peut renforcer les optimisations
    if (this.batteryData.level <= this.thresholds.criticalBatteryLevel) {
      return {
        ...this.batterySavingConfig,
        maxPixelRatio: 0.75,  // Encore plus faible
        targetFPS: 20,        // FPS encore plus bas
        minimizeObjects: true  // Réduire au maximum les objets
      };
    }
    
    return this.batterySavingConfig;
  }

  /**
   * Indique si le mode économie de batterie est actif
   * @returns {boolean}
   */
  isBatteryModeActive() {
    return this.batteryModeActive;
  }

  /**
   * Récupère les données actuelles de la batterie
   * @returns {Object} Données de la batterie
   */
  getBatteryData() {
    return { ...this.batteryData };
  }

  /**
   * Ajoute un écouteur pour les changements d'état de la batterie
   * @param {Function} listener - Fonction callback à appeler lors des changements
   */
  addListener(listener) {
    if (typeof listener === 'function' && !this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }

  /**
   * Supprime un écouteur
   * @param {Function} listener - Écouteur à supprimer
   */
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notifie tous les écouteurs d'un changement
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener({
          batteryData: this.getBatteryData(),
          batteryModeActive: this.batteryModeActive,
          config: this.getBatterySavingConfig()
        });
      } catch (error) {
        console.error('BatteryOptimizer: Erreur lors de la notification d\'un écouteur', error);
      }
    });
  }
  
  /**
   * Configure l'activation automatique du mode batterie
   * @param {boolean} enabled - True pour activer, false pour désactiver
   */
  setAutoMode(enabled) {
    this.autoEnableBatteryMode = enabled;
    
    // Si on active le mode auto, on vérifie immédiatement l'état
    if (enabled) {
      this.checkBatteryStatus();
    }
    
    // Stocker la préférence utilisateur
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('batteryAutoMode', enabled ? 'true' : 'false');
    }
  }
  
  /**
   * Charge les préférences utilisateur du localStorage
   */
  loadUserPreferences() {
    if (typeof localStorage !== 'undefined') {
      // Charger le mode batterie
      const savedBatteryMode = localStorage.getItem('batteryModeEnabled');
      if (savedBatteryMode === 'true') {
        this.setBatteryMode(true);
      }
      
      // Charger le mode auto
      const savedAutoMode = localStorage.getItem('batteryAutoMode');
      if (savedAutoMode !== null) {
        this.setAutoMode(savedAutoMode === 'true');
      }
    }
  }
}

// Créer et exporter l'instance unique
const batteryOptimizer = new BatteryOptimizer();

// Initialiser automatiquement
if (typeof window !== 'undefined') {
  // Initialiser au chargement pour les navigateurs
  window.addEventListener('load', () => {
    batteryOptimizer.initialize().then(() => {
      batteryOptimizer.loadUserPreferences();
    });
  });
}

export default batteryOptimizer;
