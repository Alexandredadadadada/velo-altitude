/**
 * deviceCapabilityDetector.js
 * Système avancé de détection des capacités de l'appareil
 * 
 * Ce module fournit une détection précise des capacités matérielles et réseau
 * pour optimiser les performances des composants 3D et de l'interface utilisateur.
 */

import { PERF_LEVELS } from './PerformanceDetector';

class DeviceCapabilityDetector {
  constructor() {
    this.capabilities = {
      // Capacités GPU
      gpu: {
        webGLSupport: false,
        webGL2Support: false,
        renderer: null,
        vendor: null,
        estimatedMemory: 0,
        maxTextureSize: 0,
        maxCubemapSize: 0,
        glExtensions: [],
        isMobileGPU: false
      },
      // CPU
      cpu: {
        cores: navigator.hardwareConcurrency || 2,
        estimatedPerformance: 'medium'
      },
      // Écran
      screen: {
        resolution: { width: window.screen.width, height: window.screen.height },
        pixelRatio: window.devicePixelRatio || 1,
        effectiveResolution: {
          width: Math.round(window.screen.width * (window.devicePixelRatio || 1)),
          height: Math.round(window.screen.height * (window.devicePixelRatio || 1))
        },
        isHighDensity: (window.devicePixelRatio || 1) > 1.5
      },
      // Réseau
      network: {
        type: 'unknown',
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false
      },
      // Flags divers
      flags: {
        isMobile: false,
        isTablet: false,
        isLowEndDevice: false,
        hasBatteryConstraints: false,
        preferReducedMotion: false,
        isOffline: !navigator.onLine
      },
      // Niveau de performance global
      performanceLevel: PERF_LEVELS.MEDIUM
    };
    
    this.benchmarkResults = null;
    this.detectionComplete = false;
    
    // Initialiser la détection
    this.detect();
  }
  
  /**
   * Récupère les capacités détectées
   * @returns {Object} Objet contenant les capacités détectées
   */
  getCapabilities() {
    if (!this.detectionComplete) {
      console.warn('DeviceCapabilityDetector: getCapabilities appelé avant la fin de la détection');
    }
    return this.capabilities;
  }
  
  /**
   * Lance la détection complète des capacités
   * @returns {Promise<Object>} Promesse résolue avec les capacités détectées
   */
  async detect() {
    try {
      // Détection simultanée des différentes capacités
      await Promise.all([
        this.detectGPUCapabilities(),
        this.detectNetworkConditions(),
        this.detectAccessibilityPreferences(),
        this.detectDeviceType(),
        this.detectBatteryStatus()
      ]);
      
      // Charger les résultats précédents s'ils existent
      this.loadCachedResults();
      
      // Exécuter le benchmark seulement si nécessaire (pas de résultats ou plus de 24h)
      const needsBenchmark = !this.benchmarkResults || 
        (Date.now() - this.benchmarkResults.timestamp > 24 * 60 * 60 * 1000);
        
      if (needsBenchmark) {
        this.benchmarkResults = await this.runLightBenchmark();
        this.cacheBenchmarkResults();
      }
      
      // Finaliser la détection
      this.finalizeDetection();
      this.detectionComplete = true;
      
      console.log('DeviceCapabilityDetector: détection terminée', {
        performanceLevel: this.getPerformanceLevelName(this.capabilities.performanceLevel),
        isMobile: this.capabilities.flags.isMobile,
        gpuMemory: this.capabilities.gpu.estimatedMemory + 'MB',
        cores: this.capabilities.cpu.cores
      });
      
    } catch (error) {
      console.error('DeviceCapabilityDetector: erreur lors de la détection', error);
      // En cas d'erreur, utiliser des valeurs par défaut conservatrices
      this.applyDefaultValues();
      this.detectionComplete = true;
    }
    
    return this.capabilities;
  }
  
  /**
   * Détecte les capacités GPU via WebGL
   * @private
   */
  async detectGPUCapabilities() {
    try {
      // Tester le support WebGL
      this.capabilities.gpu.webGLSupport = this.isWebGLSupported();
      this.capabilities.gpu.webGL2Support = this.isWebGL2Supported();
      
      if (!this.capabilities.gpu.webGLSupport) {
        console.warn('DeviceCapabilityDetector: WebGL non supporté');
        return;
      }
      
      // Créer un canvas temporaire
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) return;
      
      // Récupérer les informations du renderer
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        this.capabilities.gpu.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        this.capabilities.gpu.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      }
      
      // Estimer la mémoire GPU
      const gpuMemory = this.estimateGPUMemory(gl, this.capabilities.gpu.renderer);
      this.capabilities.gpu.estimatedMemory = gpuMemory;
      
      // Taille de texture maximale
      this.capabilities.gpu.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      this.capabilities.gpu.maxCubemapSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
      
      // Extensions disponibles
      this.capabilities.gpu.glExtensions = gl.getSupportedExtensions();
      
      // Détecter si c'est un GPU mobile
      this.capabilities.gpu.isMobileGPU = this.isMobileGPU(this.capabilities.gpu.renderer);
      
    } catch (error) {
      console.error('DeviceCapabilityDetector: erreur lors de la détection GPU', error);
    }
  }
  
  /**
   * Détecte les conditions réseau via Network Information API
   * @private
   */
  async detectNetworkConditions() {
    try {
      const connection = navigator.connection || 
                         navigator.mozConnection || 
                         navigator.webkitConnection;
                         
      if (connection) {
        this.capabilities.network.type = connection.type || 'unknown';
        this.capabilities.network.effectiveType = connection.effectiveType || 'unknown';
        this.capabilities.network.downlink = connection.downlink || 0;
        this.capabilities.network.rtt = connection.rtt || 0;
        this.capabilities.network.saveData = !!connection.saveData;
        
        // Écouter les changements de connexion
        connection.addEventListener('change', () => {
          this.capabilities.network.type = connection.type || 'unknown';
          this.capabilities.network.effectiveType = connection.effectiveType || 'unknown';
          this.capabilities.network.downlink = connection.downlink || 0;
          this.capabilities.network.rtt = connection.rtt || 0;
          this.capabilities.network.saveData = !!connection.saveData;
        });
      }
    } catch (error) {
      console.error('DeviceCapabilityDetector: erreur lors de la détection réseau', error);
    }
  }
  
  /**
   * Détecte les préférences d'accessibilité
   * @private
   */
  async detectAccessibilityPreferences() {
    try {
      if (window.matchMedia) {
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.capabilities.flags.preferReducedMotion = motionQuery.matches;
        
        // Écouter les changements de préférence
        motionQuery.addEventListener('change', (e) => {
          this.capabilities.flags.preferReducedMotion = e.matches;
        });
      }
    } catch (error) {
      console.error('DeviceCapabilityDetector: erreur lors de la détection des préférences', error);
    }
  }
  
  /**
   * Détecte le type d'appareil (mobile, tablette, desktop)
   * @private
   */
  async detectDeviceType() {
    try {
      // Détection via user agent
      const userAgent = navigator.userAgent || navigator.vendor || window.opera || '';
      const mobileRegex = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i;
      const tabletRegex = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(ad|hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i;
      
      this.capabilities.flags.isMobile = mobileRegex.test(userAgent);
      this.capabilities.flags.isTablet = tabletRegex.test(userAgent) && !mobileRegex.test(userAgent);
      
      // Vérification supplémentaire basée sur la taille d'écran pour les tablettes
      if (!this.capabilities.flags.isTablet && !this.capabilities.flags.isMobile) {
        const minTabletWidth = 600;
        const maxTabletWidth = 1024;
        const screenWidth = window.screen.width;
        
        if (screenWidth >= minTabletWidth && screenWidth <= maxTabletWidth) {
          this.capabilities.flags.isTablet = true;
        }
      }
      
      // Détecter les appareils de faible puissance
      this.capabilities.flags.isLowEndDevice = this.isLowEndDevice();
      
    } catch (error) {
      console.error('DeviceCapabilityDetector: erreur lors de la détection du type d\'appareil', error);
    }
  }
  
  /**
   * Détecte l'état de la batterie
   * @private
   */
  async detectBatteryStatus() {
    try {
      if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        
        this.capabilities.flags.hasBatteryConstraints = 
          !battery.charging && battery.level < 0.3;
          
        // Écouter les changements de batterie
        battery.addEventListener('levelchange', () => {
          this.capabilities.flags.hasBatteryConstraints = 
            !battery.charging && battery.level < 0.3;
        });
        
        battery.addEventListener('chargingchange', () => {
          this.capabilities.flags.hasBatteryConstraints = 
            !battery.charging && battery.level < 0.3;
        });
      }
    } catch (error) {
      console.error('DeviceCapabilityDetector: erreur lors de la détection de la batterie', error);
    }
  }
  
  /**
   * Charge les résultats de benchmark depuis le localStorage
   * @private
   */
  loadCachedResults() {
    try {
      const cachedResults = localStorage.getItem('deviceBenchmarkResults');
      if (cachedResults) {
        this.benchmarkResults = JSON.parse(cachedResults);
      }
    } catch (error) {
      console.error('DeviceCapabilityDetector: erreur lors du chargement des résultats', error);
    }
  }
  
  /**
   * Exécute un benchmark léger pour évaluer les performances
   * @returns {Promise<Object>} Résultats du benchmark
   * @private
   */
  async runLightBenchmark() {
    console.log('DeviceCapabilityDetector: démarrage du benchmark léger');
    
    const results = {
      timestamp: Date.now(),
      scores: {}
    };
    
    try {
      // Benchmark CPU (opérations mathématiques)
      const cpuStartTime = performance.now();
      let sum = 0;
      for (let i = 0; i < 1000000; i++) {
        sum += Math.sqrt(i) * Math.sin(i);
      }
      const cpuEndTime = performance.now();
      results.scores.cpu = 1000 / (cpuEndTime - cpuStartTime);
      
      // Benchmark DOM
      const domStartTime = performance.now();
      const container = document.createElement('div');
      document.body.appendChild(container);
      for (let i = 0; i < 1000; i++) {
        const el = document.createElement('div');
        el.textContent = 'test';
        el.style.backgroundColor = i % 2 === 0 ? 'red' : 'blue';
        container.appendChild(el);
      }
      container.scrollTop = 100;
      document.body.removeChild(container);
      const domEndTime = performance.now();
      results.scores.dom = 1000 / (domEndTime - domStartTime);
      
      // Si WebGL disponible, benchmark GPU
      if (this.capabilities.gpu.webGLSupport) {
        results.scores.gpu = await this.runWebGLBenchmark();
      } else {
        results.scores.gpu = 0;
      }
      
      // Calcul du score global
      results.scores.overall = (results.scores.cpu * 0.3 + 
                               results.scores.dom * 0.3 + 
                               results.scores.gpu * 0.4);
      
      console.log('DeviceCapabilityDetector: benchmark terminé', results.scores);
      
    } catch (error) {
      console.error('DeviceCapabilityDetector: erreur lors du benchmark', error);
      results.scores = {
        cpu: 5,
        dom: 5,
        gpu: 5,
        overall: 5
      };
    }
    
    return results;
  }
  
  /**
   * Exécute un benchmark WebGL pour évaluer les performances GPU
   * @returns {Promise<number>} Score du benchmark
   * @private
   */
  async runWebGLBenchmark() {
    return new Promise((resolve) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const gl = canvas.getContext('webgl');
        
        if (!gl) {
          resolve(0);
          return;
        }
        
        // Vertex shader simple
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, `
          attribute vec2 position;
          void main() {
            gl_Position = vec4(position, 0.0, 1.0);
          }
        `);
        gl.compileShader(vertexShader);
        
        // Fragment shader avec calculs intensifs
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, `
          precision mediump float;
          uniform float time;
          
          void main() {
            vec2 uv = gl_FragCoord.xy / 512.0;
            float x = uv.x * sin(time * 0.1) * 10.0;
            float y = uv.y * cos(time * 0.1) * 10.0;
            
            for(int i = 0; i < 10; i++) {
              x = sin(x * y + time * 0.1) * 0.5 + 0.5;
              y = cos(x * y + time * 0.1) * 0.5 + 0.5;
            }
            
            gl_FragColor = vec4(x, y, x * y, 1.0);
          }
        `);
        gl.compileShader(fragmentShader);
        
        // Créer le programme
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);
        
        // Position attribute
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
          -1, -1,
           1, -1,
          -1,  1,
           1,  1
        ]), gl.STATIC_DRAW);
        
        const positionLocation = gl.getAttribLocation(program, 'position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        
        // Time uniform
        const timeLocation = gl.getUniformLocation(program, 'time');
        
        // Benchmark
        let frames = 0;
        const startTime = performance.now();
        const maxTime = 1000; // 1 seconde de test
        
        const render = () => {
          gl.uniform1f(timeLocation, performance.now() * 0.001);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          frames++;
          
          const elapsedTime = performance.now() - startTime;
          if (elapsedTime < maxTime) {
            requestAnimationFrame(render);
          } else {
            const fps = frames / (elapsedTime * 0.001);
            // Normaliser le score sur une échelle de 0 à 10
            const normalizedScore = Math.min(fps / 30, 10);
            resolve(normalizedScore);
          }
        };
        
        render();
        
      } catch (error) {
        console.error('DeviceCapabilityDetector: erreur dans le benchmark WebGL', error);
        resolve(0);
      }
    });
  }
  
  /**
   * Enregistre les résultats du benchmark dans localStorage
   * @private
   */
  cacheBenchmarkResults() {
    try {
      if (this.benchmarkResults) {
        localStorage.setItem('deviceBenchmarkResults', 
          JSON.stringify(this.benchmarkResults));
      }
    } catch (error) {
      console.error('DeviceCapabilityDetector: erreur lors de la mise en cache', error);
    }
  }
  
  /**
   * Finalise la détection et calcule le niveau de performance global
   * @private
   */
  finalizeDetection() {
    try {
      // Déterminer le niveau de performance global
      let performanceLevel = PERF_LEVELS.MEDIUM;
      
      if (this.capabilities.flags.isLowEndDevice || 
          this.capabilities.gpu.estimatedMemory < 512 ||
          this.benchmarkResults?.scores.overall < 3) {
        performanceLevel = PERF_LEVELS.LOW;
      } else if (this.capabilities.gpu.estimatedMemory >= 2048 && 
                !this.capabilities.flags.isMobile &&
                this.capabilities.cpu.cores >= 4 &&
                this.benchmarkResults?.scores.overall > 7) {
        performanceLevel = PERF_LEVELS.HIGH;
      }
      
      // Ajuster en fonction des conditions réseau
      if (this.capabilities.network.effectiveType === '2g' || 
          this.capabilities.network.effectiveType === 'slow-2g') {
        performanceLevel = Math.max(PERF_LEVELS.ULTRA_LOW, performanceLevel - 2);
      } else if (this.capabilities.network.effectiveType === '3g') {
        performanceLevel = Math.max(PERF_LEVELS.LOW, performanceLevel - 1);
      }
      
      // Ajuster en fonction des préférences d'accessibilité
      if (this.capabilities.flags.preferReducedMotion) {
        performanceLevel = Math.min(performanceLevel, PERF_LEVELS.MEDIUM);
      }
      
      // Ajuster en fonction des contraintes de batterie
      if (this.capabilities.flags.hasBatteryConstraints) {
        performanceLevel = Math.max(PERF_LEVELS.LOW, performanceLevel - 1);
      }
      
      this.capabilities.performanceLevel = performanceLevel;
      
    } catch (error) {
      console.error('DeviceCapabilityDetector: erreur lors de la finalisation', error);
      this.capabilities.performanceLevel = PERF_LEVELS.MEDIUM; // Valeur par défaut
    }
  }
  
  /**
   * Applique des valeurs par défaut conservatrices en cas d'erreur
   * @private
   */
  applyDefaultValues() {
    this.capabilities.gpu.estimatedMemory = 512;
    this.capabilities.flags.isLowEndDevice = true;
    this.capabilities.performanceLevel = PERF_LEVELS.MEDIUM;
  }
  
  /**
   * Vérifie si WebGL est supporté
   * @returns {boolean} true si WebGL est supporté
   * @private
   */
  isWebGLSupported() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Vérifie si WebGL2 est supporté
   * @returns {boolean} true si WebGL2 est supporté
   * @private
   */
  isWebGL2Supported() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Estime la mémoire GPU disponible
   * @param {WebGLRenderingContext} gl Contexte WebGL
   * @param {string} renderer Nom du renderer
   * @returns {number} Mémoire estimée en MB
   * @private
   */
  estimateGPUMemory(gl, renderer) {
    // Si l'API WEBGL_debug_renderer_info est disponible, on peut estimer la mémoire
    // en fonction du nom du renderer
    if (renderer) {
      const rendererLower = renderer.toLowerCase();
      
      // GPUs mobiles
      if (rendererLower.includes('adreno')) {
        if (rendererLower.includes('adreno 6')) return 2048;
        if (rendererLower.includes('adreno 5')) return 1024;
        return 512;
      }
      
      if (rendererLower.includes('mali')) {
        if (rendererLower.includes('mali-g')) return 2048;
        return 1024;
      }
      
      if (rendererLower.includes('apple')) {
        if (rendererLower.includes('a14') || rendererLower.includes('a15')) return 4096;
        if (rendererLower.includes('a12') || rendererLower.includes('a13')) return 3072;
        if (rendererLower.includes('a10') || rendererLower.includes('a11')) return 2048;
        return 1536;
      }
      
      // GPUs desktop
      if (rendererLower.includes('nvidia') || rendererLower.includes('geforce')) {
        if (rendererLower.includes('rtx')) return 8192;
        if (rendererLower.includes('gtx 16') || rendererLower.includes('gtx 10')) return 6144;
        return 4096;
      }
      
      if (rendererLower.includes('amd') || rendererLower.includes('radeon')) {
        if (rendererLower.includes('rx 6')) return 8192;
        if (rendererLower.includes('rx 5')) return 6144;
        return 4096;
      }
      
      if (rendererLower.includes('intel')) {
        if (rendererLower.includes('iris')) return 2048;
        if (rendererLower.includes('uhd')) return 1536;
        return 1024;
      }
    }
    
    // Estimation basée sur la taille de texture maximale
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    if (maxTextureSize >= 16384) return 4096;
    if (maxTextureSize >= 8192) return 2048;
    if (maxTextureSize >= 4096) return 1024;
    return 512;
  }
  
  /**
   * Détermine si c'est un GPU mobile
   * @param {string} renderer Nom du renderer
   * @returns {boolean} true si c'est un GPU mobile
   * @private
   */
  isMobileGPU(renderer) {
    if (!renderer) return false;
    
    const rendererLower = renderer.toLowerCase();
    return rendererLower.includes('adreno') || 
           rendererLower.includes('mali') || 
           rendererLower.includes('sgx') ||
           rendererLower.includes('apple') && (
             rendererLower.includes('iphone') || 
             rendererLower.includes('ipad')
           );
  }
  
  /**
   * Détermine si c'est un appareil de faible puissance
   * @returns {boolean} true si c'est un appareil de faible puissance
   * @private
   */
  isLowEndDevice() {
    // Check pour memory
    if ('deviceMemory' in navigator) {
      if (navigator.deviceMemory < 2) return true;
    }
    
    // Check pour CPU
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      return true;
    }
    
    // Check pour GPU
    if (this.capabilities.gpu.estimatedMemory < 512) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Convertit le niveau de performance en nom lisible
   * @param {number} level Niveau de performance
   * @returns {string} Nom du niveau de performance
   * @private
   */
  getPerformanceLevelName(level) {
    switch (level) {
      case PERF_LEVELS.ULTRA_LOW: return 'Ultra faible';
      case PERF_LEVELS.LOW: return 'Faible';
      case PERF_LEVELS.MEDIUM: return 'Moyen';
      case PERF_LEVELS.HIGH: return 'Élevé';
      case PERF_LEVELS.ULTRA_HIGH: return 'Ultra élevé';
      default: return 'Moyen';
    }
  }
}

// Export d'une instance unique
const deviceCapabilityDetector = new DeviceCapabilityDetector();
export default deviceCapabilityDetector;
