/**
 * Service de détection des appareils
 * 
 * Ce service permet de détecter le type d'appareil, 
 * ses capacités et de fournir des informations sur
 * l'environnement d'exécution pour permettre une 
 * expérience adaptée, notamment pour le Fly-through.
 */

class DeviceDetection {
  constructor() {
    this.deviceInfo = {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      browser: 'unknown',
      os: 'unknown',
      screenSize: { width: 0, height: 0 },
      pixelRatio: 1,
      touchCapable: false,
      gpuTier: 'unknown',
      performanceProfile: 'high' // 'low', 'medium', 'high'
    };
    
    // Initialiser si en environnement navigateur
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  /**
   * Initialise la détection d'appareil
   */
  initialize() {
    this.detectDeviceType();
    this.detectBrowser();
    this.detectOS();
    this.measureScreen();
    this.detectTouchCapability();
    this.estimatePerformanceProfile();
  }

  /**
   * Détecte le type d'appareil (mobile, tablette, desktop)
   */
  detectDeviceType() {
    if (typeof window === 'undefined') return;
    
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Vérifier si mobile
    const mobileKeywords = ['android', 'iphone', 'ipod', 'windows phone'];
    this.deviceInfo.isMobile = mobileKeywords.some(keyword => userAgent.includes(keyword));
    
    // Vérifier si tablette
    const tabletKeywords = ['ipad', 'tablet'];
    const tabletExceptions = ['android', 'mobile'];
    
    const isTabletByKeyword = tabletKeywords.some(keyword => userAgent.includes(keyword));
    const isNotTabletByException = this.deviceInfo.isMobile && 
                                  tabletExceptions.every(keyword => userAgent.includes(keyword));
    
    this.deviceInfo.isTablet = isTabletByKeyword && !isNotTabletByException;
    
    // Si c'est une tablette, ce n'est pas un mobile
    if (this.deviceInfo.isTablet) {
      this.deviceInfo.isMobile = false;
    }
    
    // Si ce n'est ni mobile ni tablette, c'est un desktop
    this.deviceInfo.isDesktop = !this.deviceInfo.isMobile && !this.deviceInfo.isTablet;
  }

  /**
   * Détecte le navigateur
   */
  detectBrowser() {
    if (typeof window === 'undefined') return;
    
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('firefox')) {
      this.deviceInfo.browser = 'firefox';
    } else if (userAgent.includes('edg')) {
      this.deviceInfo.browser = 'edge';
    } else if (userAgent.includes('chrome')) {
      this.deviceInfo.browser = 'chrome';
    } else if (userAgent.includes('safari')) {
      this.deviceInfo.browser = 'safari';
    } else if (userAgent.includes('opera') || userAgent.includes('opr')) {
      this.deviceInfo.browser = 'opera';
    } else {
      this.deviceInfo.browser = 'unknown';
    }
  }

  /**
   * Détecte le système d'exploitation
   */
  detectOS() {
    if (typeof window === 'undefined') return;
    
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('win')) {
      this.deviceInfo.os = 'windows';
    } else if (userAgent.includes('mac')) {
      this.deviceInfo.os = 'macos';
    } else if (userAgent.includes('linux')) {
      this.deviceInfo.os = 'linux';
    } else if (userAgent.includes('android')) {
      this.deviceInfo.os = 'android';
    } else if (userAgent.includes('ios') || userAgent.includes('iphone') || userAgent.includes('ipad')) {
      this.deviceInfo.os = 'ios';
    } else {
      this.deviceInfo.os = 'unknown';
    }
  }

  /**
   * Mesure la taille de l'écran et le pixel ratio
   */
  measureScreen() {
    if (typeof window === 'undefined') return;
    
    this.deviceInfo.screenSize = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    this.deviceInfo.pixelRatio = window.devicePixelRatio || 1;
  }

  /**
   * Détecte si l'appareil a des capacités tactiles
   */
  detectTouchCapability() {
    if (typeof window === 'undefined') return;
    
    this.deviceInfo.touchCapable = 'ontouchstart' in window || 
                                  navigator.maxTouchPoints > 0 || 
                                  navigator.msMaxTouchPoints > 0;
  }

  /**
   * Estime le profil de performance de l'appareil
   */
  estimatePerformanceProfile() {
    if (typeof window === 'undefined') return;
    
    // Par défaut, on commence avec un profil élevé
    let performanceScore = 10;
    
    // Réduire le score pour les appareils mobiles
    if (this.deviceInfo.isMobile) {
      performanceScore -= 3;
    } else if (this.deviceInfo.isTablet) {
      performanceScore -= 2;
    }
    
    // Réduire le score pour les petits écrans
    if (this.deviceInfo.screenSize.width < 768) {
      performanceScore -= 1;
    }
    
    // Réduire le score pour les vieux navigateurs
    if (this.deviceInfo.browser === 'unknown') {
      performanceScore -= 1;
    }
    
    // Utiliser l'API NavigatorConnection si disponible
    if (navigator.connection) {
      // Réduire le score pour les connexions lentes
      if (navigator.connection.effectiveType === '2g' || navigator.connection.effectiveType === 'slow-2g') {
        performanceScore -= 2;
      } else if (navigator.connection.effectiveType === '3g') {
        performanceScore -= 1;
      }
    }
    
    // Déterminer le profil en fonction du score
    if (performanceScore <= 4) {
      this.deviceInfo.performanceProfile = 'low';
    } else if (performanceScore <= 7) {
      this.deviceInfo.performanceProfile = 'medium';
    } else {
      this.deviceInfo.performanceProfile = 'high';
    }
    
    // Estimer le tier GPU en fonction des informations disponibles
    if (this.deviceInfo.performanceProfile === 'high') {
      this.deviceInfo.gpuTier = 'high';
    } else if (this.deviceInfo.performanceProfile === 'medium') {
      this.deviceInfo.gpuTier = 'medium';
    } else {
      this.deviceInfo.gpuTier = 'low';
    }
  }

  /**
   * Simule un appareil spécifique pour les tests
   * @param {string} deviceType - Type d'appareil à simuler (low_end_mobile, mid_range_mobile, high_end_mobile, tablet, desktop)
   */
  simulateDevice(deviceType) {
    switch (deviceType) {
      case 'low_end_mobile':
        return {
          isMobile: true,
          isTablet: false,
          isDesktop: false,
          browser: 'chrome',
          os: 'android',
          screenSize: { width: 320, height: 480 },
          pixelRatio: 1,
          touchCapable: true,
          gpuTier: 'low',
          performanceProfile: 'low'
        };
      
      case 'mid_range_mobile':
        return {
          isMobile: true,
          isTablet: false,
          isDesktop: false,
          browser: 'chrome',
          os: 'android',
          screenSize: { width: 375, height: 812 },
          pixelRatio: 2,
          touchCapable: true,
          gpuTier: 'medium',
          performanceProfile: 'medium'
        };
      
      case 'high_end_mobile':
        return {
          isMobile: true,
          isTablet: false,
          isDesktop: false,
          browser: 'safari',
          os: 'ios',
          screenSize: { width: 390, height: 844 },
          pixelRatio: 3,
          touchCapable: true,
          gpuTier: 'high',
          performanceProfile: 'high'
        };
      
      case 'tablet':
        return {
          isMobile: false,
          isTablet: true,
          isDesktop: false,
          browser: 'safari',
          os: 'ios',
          screenSize: { width: 768, height: 1024 },
          pixelRatio: 2,
          touchCapable: true,
          gpuTier: 'medium',
          performanceProfile: 'medium'
        };
      
      case 'desktop':
      default:
        return {
          isMobile: false,
          isTablet: false,
          isDesktop: true,
          browser: 'chrome',
          os: 'windows',
          screenSize: { width: 1920, height: 1080 },
          pixelRatio: 1,
          touchCapable: false,
          gpuTier: 'high',
          performanceProfile: 'high'
        };
    }
  }

  /**
   * Obtient les informations sur l'appareil actuel
   * @returns {Object} Informations sur l'appareil
   */
  getDeviceInfo() {
    return { ...this.deviceInfo };
  }

  /**
   * Vérifie si l'appareil est capable d'afficher des graphiques 3D complexes
   * @returns {boolean} Vrai si l'appareil peut afficher des graphiques 3D complexes
   */
  canHandle3DGraphics() {
    // Estimons que seuls les appareils avec un profil moyen ou élevé peuvent gérer les graphiques 3D complexes
    return this.deviceInfo.performanceProfile === 'medium' || this.deviceInfo.performanceProfile === 'high';
  }

  /**
   * Recommande des paramètres de rendu 3D en fonction des capacités de l'appareil
   * @returns {Object} Paramètres de rendu recommandés
   */
  get3DRenderingParameters() {
    const baseParams = {
      maxTextureSize: 2048,
      shadowMapEnabled: true,
      antialiasing: true,
      maxParticles: 1000,
      drawDistance: 10000,
      terrainDetail: 128,
      effectsQuality: 'high',
      textureQuality: 'high'
    };
    
    // Ajuster en fonction du profil de performance
    switch (this.deviceInfo.performanceProfile) {
      case 'low':
        return {
          ...baseParams,
          maxTextureSize: 1024,
          shadowMapEnabled: false,
          antialiasing: false,
          maxParticles: 100,
          drawDistance: 5000,
          terrainDetail: 64,
          effectsQuality: 'low',
          textureQuality: 'low'
        };
        
      case 'medium':
        return {
          ...baseParams,
          maxTextureSize: 2048,
          shadowMapEnabled: true,
          antialiasing: true,
          maxParticles: 500,
          drawDistance: 7500,
          terrainDetail: 96,
          effectsQuality: 'medium',
          textureQuality: 'medium'
        };
        
      case 'high':
      default:
        return baseParams;
    }
  }
}

// Singleton
const deviceDetection = new DeviceDetection();

export default deviceDetection;
