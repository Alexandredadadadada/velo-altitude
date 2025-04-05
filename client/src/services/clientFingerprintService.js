/**
 * Service de collecte d'empreintes client
 * Ce service génère une empreinte unique pour chaque appareil/navigateur 
 * afin d'améliorer la sécurité du système d'authentification
 */

import { v4 as uuidv4 } from 'uuid';
import * as UAParser from 'ua-parser-js';

class ClientFingerprintService {
  constructor() {
    this.fingerprintKey = 'client_fingerprint';
    this.uaParser = new UAParser();
    this.initFingerprint();
  }

  /**
   * Initialise l'empreinte client si elle n'existe pas déjà
   */
  initFingerprint() {
    if (!this.getFingerprint()) {
      this.generateFingerprint();
    }
  }

  /**
   * Génère et stocke une nouvelle empreinte client
   * @returns {Object} L'empreinte complète avec toutes ses composantes
   */
  generateFingerprint() {
    const uuid = uuidv4();
    const browserInfo = this.getBrowserInfo();
    const osInfo = this.getOSInfo();
    const screenInfo = this.getScreenInfo();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const languages = navigator.languages || [navigator.language || navigator.userLanguage];
    
    // Informations sur le matériel (si disponibles)
    const hardwareInfo = this.getHardwareInfo();
    
    // Informations sur les capacités du navigateur
    const capabilities = this.getCapabilities();
    
    const fingerprint = {
      id: uuid,
      browser: browserInfo,
      os: osInfo,
      screen: screenInfo,
      timeZone,
      languages,
      hardware: hardwareInfo,
      capabilities,
      createdAt: new Date().toISOString()
    };
    
    // Stocker l'empreinte complète
    localStorage.setItem(this.fingerprintKey, JSON.stringify(fingerprint));
    
    return fingerprint;
  }
  
  /**
   * Récupère l'empreinte client stockée
   * @returns {Object|null} L'empreinte client ou null si elle n'existe pas
   */
  getFingerprint() {
    const stored = localStorage.getItem(this.fingerprintKey);
    return stored ? JSON.parse(stored) : null;
  }
  
  /**
   * Récupère uniquement l'ID d'empreinte
   * @returns {string|null} L'ID d'empreinte ou null
   */
  getFingerprintId() {
    const fingerprint = this.getFingerprint();
    return fingerprint ? fingerprint.id : null;
  }
  
  /**
   * Met à jour l'empreinte existante avec les données actuelles
   * Utile pour détecter les changements de configuration
   * @returns {Object} L'empreinte mise à jour
   */
  updateFingerprint() {
    const currentFingerprint = this.getFingerprint();
    if (!currentFingerprint) {
      return this.generateFingerprint();
    }
    
    // Garder l'ID existant mais mettre à jour les autres informations
    const updatedFingerprint = {
      ...this.generateFingerprint(),
      id: currentFingerprint.id,
      previousCreatedAt: currentFingerprint.createdAt,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem(this.fingerprintKey, JSON.stringify(updatedFingerprint));
    return updatedFingerprint;
  }
  
  /**
   * Récupère les informations sur le navigateur
   * @private
   * @returns {Object} Informations sur le navigateur
   */
  getBrowserInfo() {
    const browserResult = this.uaParser.getBrowser();
    const engineResult = this.uaParser.getEngine();
    
    return {
      name: browserResult.name || 'Unknown',
      version: browserResult.version || 'Unknown',
      engine: engineResult.name || 'Unknown',
      engineVersion: engineResult.version || 'Unknown',
      userAgent: navigator.userAgent
    };
  }
  
  /**
   * Récupère les informations sur le système d'exploitation
   * @private
   * @returns {Object} Informations sur le système d'exploitation
   */
  getOSInfo() {
    const osResult = this.uaParser.getOS();
    
    return {
      name: osResult.name || 'Unknown',
      version: osResult.version || 'Unknown',
      platform: navigator.platform || 'Unknown'
    };
  }
  
  /**
   * Récupère les informations sur l'écran
   * @private
   * @returns {Object} Informations sur l'écran
   */
  getScreenInfo() {
    return {
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: window.screen.orientation ? window.screen.orientation.type : 'Unknown'
    };
  }
  
  /**
   * Récupère les informations matérielles (si disponibles)
   * @private
   * @returns {Object} Informations sur le matériel
   */
  getHardwareInfo() {
    const deviceResult = this.uaParser.getDevice();
    const hardwareInfo = {
      deviceType: deviceResult.type || 'Unknown',
      deviceModel: deviceResult.model || 'Unknown',
      deviceVendor: deviceResult.vendor || 'Unknown',
      isMobile: this.isMobileDevice(),
      isTablet: this.isTabletDevice()
    };
    
    // Essayer d'obtenir des informations sur les cœurs CPU
    if (navigator.hardwareConcurrency) {
      hardwareInfo.cpuCores = navigator.hardwareConcurrency;
    }
    
    // Essayer d'obtenir des informations sur la mémoire
    if (navigator.deviceMemory) {
      hardwareInfo.deviceMemory = navigator.deviceMemory;
    }
    
    return hardwareInfo;
  }
  
  /**
   * Détermine si l'appareil est mobile
   * @private
   * @returns {boolean} True si l'appareil est un mobile
   */
  isMobileDevice() {
    const deviceType = this.uaParser.getDevice().type;
    return deviceType === 'mobile' || /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(navigator.userAgent);
  }
  
  /**
   * Détermine si l'appareil est une tablette
   * @private
   * @returns {boolean} True si l'appareil est une tablette
   */
  isTabletDevice() {
    const deviceType = this.uaParser.getDevice().type;
    return deviceType === 'tablet' || /(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(navigator.userAgent);
  }
  
  /**
   * Récupère les capacités techniques du navigateur
   * @private
   * @returns {Object} Capacités du navigateur
   */
  getCapabilities() {
    const capabilities = {
      cookies: navigator.cookieEnabled,
      localStorage: this.isLocalStorageEnabled(),
      sessionStorage: this.isSessionStorageEnabled(),
      webGL: this.isWebGLEnabled(),
      webRTC: this.isWebRTCEnabled(),
      canvas: this.isCanvasEnabled(),
      svg: this.isSVGEnabled(),
      webP: null, // Sera déterminé de manière asynchrone
      audio: this.isAudioEnabled(),
      video: this.isVideoEnabled(),
      touchPoints: 'maxTouchPoints' in navigator ? navigator.maxTouchPoints : 0,
      bluetooth: 'bluetooth' in navigator,
      gyroscope: this.hasGyroscope(),
      serviceWorkers: 'serviceWorker' in navigator
    };
    
    // Tester le support WebP de manière asynchrone
    this.testWebPSupport().then(webPSupported => {
      capabilities.webP = webPSupported;
      
      // Mettre à jour les capacités stockées
      const fingerprint = this.getFingerprint();
      if (fingerprint) {
        fingerprint.capabilities = {
          ...fingerprint.capabilities,
          webP: webPSupported
        };
        localStorage.setItem(this.fingerprintKey, JSON.stringify(fingerprint));
      }
    });
    
    return capabilities;
  }
  
  /**
   * Vérifie si le localStorage est disponible
   * @private
   * @returns {boolean} True si le localStorage est disponible
   */
  isLocalStorageEnabled() {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Vérifie si le sessionStorage est disponible
   * @private
   * @returns {boolean} True si le sessionStorage est disponible
   */
  isSessionStorageEnabled() {
    try {
      sessionStorage.setItem('test', 'test');
      sessionStorage.removeItem('test');
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Vérifie si WebGL est disponible
   * @private
   * @returns {boolean} True si WebGL est disponible
   */
  isWebGLEnabled() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Vérifie si WebRTC est disponible
   * @private
   * @returns {boolean} True si WebRTC est disponible
   */
  isWebRTCEnabled() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) || 
           !!(navigator.getUserMedia) || 
           !!(navigator.webkitGetUserMedia) || 
           !!(navigator.mozGetUserMedia);
  }
  
  /**
   * Vérifie si Canvas est disponible
   * @private
   * @returns {boolean} True si Canvas est disponible
   */
  isCanvasEnabled() {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext && canvas.getContext('2d'));
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Vérifie si SVG est disponible
   * @private
   * @returns {boolean} True si SVG est disponible
   */
  isSVGEnabled() {
    return !!document.createElementNS && 
           !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect;
  }
  
  /**
   * Teste le support du format WebP
   * @private
   * @returns {Promise<boolean>} Promise résolu avec true si WebP est supporté
   */
  testWebPSupport() {
    return new Promise(resolve => {
      const webP = new Image();
      webP.onload = webP.onerror = function() {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }
  
  /**
   * Vérifie si l'API Audio est disponible
   * @private
   * @returns {boolean} True si l'API Audio est disponible
   */
  isAudioEnabled() {
    return !!(window.AudioContext || window.webkitAudioContext || window.mozAudioContext);
  }
  
  /**
   * Vérifie si l'API Vidéo est disponible
   * @private
   * @returns {boolean} True si l'API Vidéo est disponible
   */
  isVideoEnabled() {
    try {
      const video = document.createElement('video');
      return !!(video.canPlayType);
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Vérifie si le gyroscope est disponible
   * @private
   * @returns {boolean} True si le gyroscope est disponible
   */
  hasGyroscope() {
    return 'DeviceOrientationEvent' in window || 'DeviceMotionEvent' in window;
  }
  
  /**
   * Récupère une version simplifiée de l'empreinte pour l'authentification
   * @returns {Object} Empreinte simplifiée
   */
  getAuthFingerprint() {
    const fingerprint = this.getFingerprint() || this.generateFingerprint();
    
    return {
      id: fingerprint.id,
      browser: `${fingerprint.browser.name}/${fingerprint.browser.version}`,
      os: `${fingerprint.os.name}/${fingerprint.os.version}`,
      screen: `${fingerprint.screen.width}x${fingerprint.screen.height}`,
      isMobile: fingerprint.hardware.isMobile,
      timeZone: fingerprint.timeZone,
      language: fingerprint.languages[0] || 'unknown'
    };
  }
}

const clientFingerprintService = new ClientFingerprintService();
export default clientFingerprintService;
