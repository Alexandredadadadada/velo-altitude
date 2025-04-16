/**
 * Utilitaires de détection des capacités des appareils
 * Utilisé pour adapter l'expérience utilisateur et les performances
 */

/**
 * Représente les capacités d'un appareil
 */
export interface DeviceCapabilities {
  isMobile: boolean;
  isTouchDevice: boolean;
  hasWebGL2: boolean;
  devicePixelRatio: number;
  performanceLevel: 'low' | 'medium' | 'high';
  gpuTier?: number;
  gpu?: string;
  memory?: number;
  connection?: {
    type?: string;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
}

/**
 * Classe singleton pour la détection des capacités des appareils
 */
export class DeviceCapabilitiesDetector {
  private static instance: DeviceCapabilitiesDetector;
  private capabilities: DeviceCapabilities;
  private performanceTestCompleted: boolean = false;
  private changeListeners: Array<(capabilities: DeviceCapabilities) => void> = [];

  /**
   * Constructeur privé (singleton)
   */
  private constructor() {
    // Initialisation avec des valeurs par défaut
    this.capabilities = {
      isMobile: false,
      isTouchDevice: false,
      hasWebGL2: false,
      devicePixelRatio: 1,
      performanceLevel: 'medium'
    };

    // Détecter les capacités initiales
    this.detectBasicCapabilities();

    // Enregistrer les écouteurs d'événements
    this.setupEventListeners();
    
    // Démarrer le test de performance complet (asynchrone)
    this.runFullPerformanceTest();
  }

  /**
   * Obtenir l'instance unique
   */
  public static getInstance(): DeviceCapabilitiesDetector {
    if (!DeviceCapabilitiesDetector.instance) {
      DeviceCapabilitiesDetector.instance = new DeviceCapabilitiesDetector();
    }
    return DeviceCapabilitiesDetector.instance;
  }

  /**
   * Obtenir les capacités actuelles de l'appareil
   */
  public getCapabilities(): DeviceCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Ajouter un écouteur pour les changements de capacités
   * @param listener Fonction appelée lors d'un changement
   * @returns Fonction pour supprimer l'écouteur
   */
  public addCapabilitiesChangeListener(
    listener: (capabilities: DeviceCapabilities) => void
  ): () => void {
    this.changeListeners.push(listener);
    
    // Appeler immédiatement avec les capacités actuelles
    listener(this.getCapabilities());
    
    // Retourner une fonction pour supprimer l'écouteur
    return () => {
      this.changeListeners = this.changeListeners.filter(l => l !== listener);
    };
  }

  /**
   * Détecter les capacités de base de l'appareil
   */
  private detectBasicCapabilities(): void {
    // Détection mobile
    const isMobile = 
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
      window.innerWidth < 768;
    
    // Détection écran tactile
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Détection WebGL2
    const canvas = document.createElement('canvas');
    const hasWebGL2 = !!canvas.getContext('webgl2');
    
    // Rapport de pixels de l'appareil
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Détecter le GPU si possible
    let gpu: string | undefined = undefined;
    try {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
      }
    } catch (e) {
      console.warn('Failed to detect GPU info:', e);
    }
    
    // Détection de la mémoire si disponible
    let memory: number | undefined = undefined;
    if ((navigator as any).deviceMemory) {
      memory = (navigator as any).deviceMemory;
    }
    
    // Détection de la connexion réseau si disponible
    let connection = undefined;
    if ((navigator as any).connection) {
      const conn = (navigator as any).connection;
      connection = {
        type: conn.type,
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt
      };
    }
    
    // Mise à jour des capacités de base
    this.updateCapabilities({
      isMobile,
      isTouchDevice,
      hasWebGL2,
      devicePixelRatio,
      performanceLevel: this.capabilities.performanceLevel, // Conservé jusqu'au test complet
      gpu,
      memory,
      connection
    });
  }

  /**
   * Configurer les écouteurs d'événements pour les changements de capacités
   */
  private setupEventListeners(): void {
    // Écouteur pour le redimensionnement
    window.addEventListener('resize', () => {
      this.detectBasicCapabilities();
    });
    
    // Écouteur pour les changements d'orientation
    window.addEventListener('orientationchange', () => {
      this.detectBasicCapabilities();
    });
    
    // Écouteur pour les changements de connexion réseau
    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', () => {
        this.detectBasicCapabilities();
      });
    }
    
    // Écouteur pour les changements de périphériques
    if (navigator.mediaDevices && (navigator.mediaDevices as any).ondevicechange) {
      (navigator.mediaDevices as any).ondevicechange = () => {
        this.detectBasicCapabilities();
      };
    }
  }

  /**
   * Exécute un test de performance complet pour déterminer les capacités
   */
  private async runFullPerformanceTest(): Promise<void> {
    if (this.performanceTestCompleted) return;
    
    try {
      // Test simple CPU
      const cpuResult = await this.runCPUTest();
      
      // Test GPU si WebGL disponible
      let gpuTier = 0;
      if (this.capabilities.hasWebGL2) {
        gpuTier = await this.estimateGPUTier();
      }
      
      // Déterminer le niveau de performance global
      let performanceLevel: 'low' | 'medium' | 'high' = 'medium';
      
      // Estimer en fonction des tests
      if (cpuResult < 5) {
        performanceLevel = 'high';
      } else if (cpuResult > 15) {
        performanceLevel = 'low';
      }
      
      // Ajuster en fonction du GPU
      if (gpuTier >= 2 && performanceLevel !== 'low') {
        performanceLevel = 'high';
      } else if (gpuTier === 0 && performanceLevel !== 'high') {
        performanceLevel = 'low';
      }
      
      // Limiter la performance sur mobile pour l'autonomie
      if (this.capabilities.isMobile && performanceLevel === 'high') {
        performanceLevel = 'medium';
      }
      
      // Mise à jour avec les résultats de performance
      this.updateCapabilities({
        ...this.capabilities,
        performanceLevel,
        gpuTier
      });
      
      this.performanceTestCompleted = true;
      
      console.log('Device capabilities detection completed:', this.capabilities);
    } catch (error) {
      console.error('Error during performance tests:', error);
    }
  }

  /**
   * Exécuter un test de performance CPU simple
   * @returns Durée du test en millisecondes
   */
  private async runCPUTest(): Promise<number> {
    return new Promise(resolve => {
      setTimeout(() => {
        const start = performance.now();
        const iterations = 10000;
        
        for (let i = 0; i < iterations; i++) {
          Math.sqrt(i * 123.456);
        }
        
        const duration = performance.now() - start;
        resolve(duration);
      }, 0);
    });
  }

  /**
   * Estimer le niveau de GPU (0-3)
   * @returns Niveau estimé du GPU
   */
  private async estimateGPUTier(): Promise<number> {
    // Cette estimation est simplifiée
    // Une implémentation complète nécessiterait des tests de rendu
    
    // Vérifier si nous avons déjà détecté les informations du GPU
    if (!this.capabilities.gpu) return 1;
    
    const gpu = this.capabilities.gpu.toLowerCase();
    
    // Détecter les GPU haut de gamme courants
    if (gpu.includes('nvidia') && !gpu.includes('mx')) {
      return 3;
    }
    
    // Détecter les GPU AMD haut de gamme
    if (gpu.includes('radeon') && (gpu.includes('rx') || gpu.includes('vega'))) {
      return 3;
    }
    
    // Détecter les GPU Intel haut de gamme
    if (gpu.includes('iris') || gpu.includes('arc')) {
      return 2;
    }
    
    // Détecter les GPU mobiles haut de gamme
    if (gpu.includes('apple') && (gpu.includes('m1') || gpu.includes('m2'))) {
      return 3;
    }
    
    // GPU mobile milieu de gamme
    if (gpu.includes('adreno') || gpu.includes('mali')) {
      return this.capabilities.isMobile ? 2 : 1;
    }
    
    // GPU Intel intégrés
    if (gpu.includes('intel') && !gpu.includes('iris')) {
      return 1;
    }
    
    // Par défaut
    return 1;
  }

  /**
   * Mettre à jour les capacités et notifier les écouteurs si nécessaire
   * @param newCapabilities Nouvelles capacités
   */
  private updateCapabilities(newCapabilities: DeviceCapabilities): void {
    const shouldNotify = 
      this.capabilities.isMobile !== newCapabilities.isMobile ||
      this.capabilities.hasWebGL2 !== newCapabilities.hasWebGL2 ||
      this.capabilities.performanceLevel !== newCapabilities.performanceLevel;
    
    this.capabilities = { ...newCapabilities };
    
    if (shouldNotify) {
      this.notifyListeners();
    }
  }

  /**
   * Notifier tous les écouteurs des changements de capacités
   */
  private notifyListeners(): void {
    const capabilities = this.getCapabilities();
    this.changeListeners.forEach(listener => {
      try {
        listener(capabilities);
      } catch (error) {
        console.error('Error in capabilities change listener:', error);
      }
    });
  }
}

/**
 * Hook pour obtenir les capacités de l'appareil
 * @returns Capacités actuelles de l'appareil
 */
export function useDeviceCapabilities(): DeviceCapabilities {
  // Cette fonction sera utilisée dans le composant React
  // L'implémentation doit être intégrée dans les hooks React
  return DeviceCapabilitiesDetector.getInstance().getCapabilities();
}

/**
 * Obtenir les capacités de l'appareil de manière synchrone
 * Utile pour les contextes non-React
 * @returns Capacités actuelles de l'appareil
 */
export function getDeviceCapabilities(): DeviceCapabilities {
  return DeviceCapabilitiesDetector.getInstance().getCapabilities();
}

/**
 * S'abonner aux changements de capacités de l'appareil
 * @param listener Fonction appelée lors d'un changement
 * @returns Fonction pour se désabonner
 */
export function subscribeToCapabilitiesChanges(
  listener: (capabilities: DeviceCapabilities) => void
): () => void {
  return DeviceCapabilitiesDetector.getInstance().addCapabilitiesChangeListener(listener);
}
