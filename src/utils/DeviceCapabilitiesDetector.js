/**
 * Utilitaire pour détecter les capacités de l'appareil et optimiser 
 * les visualisations en fonction des performances disponibles
 */

import { DEFAULT_DEVICE_CONFIG, QUALITY_LEVELS, VISUALIZATION_TYPES } from '../config/visualizationConfig';

class DeviceCapabilitiesDetector {
  constructor() {
    this.cachedCapabilities = null;
    this.cachedDeviceType = null;
    this.benchmarkResults = null;
    this.hasBenchmarked = false;
  }

  /**
   * Détecte les capacités de l'appareil actuel
   * @returns {Object} Les capacités de l'appareil
   */
  detect() {
    if (this.cachedCapabilities) {
      return this.cachedCapabilities;
    }

    const deviceType = this.detectDeviceType();
    const config = DEFAULT_DEVICE_CONFIG[deviceType];
    const gpu = this.detectGPUCapabilities();
    const memory = this.detectMemory();
    const webgl = this.detectWebGLSupport();

    this.cachedCapabilities = {
      deviceType,
      config,
      gpu,
      memory,
      webgl,
      hasTouchScreen: this.hasTouchScreen(),
      batteryStatus: null, // À remplir de manière asynchrone si nécessaire
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
    };

    this.tryGetBatteryStatus().then(batteryStatus => {
      this.cachedCapabilities.batteryStatus = batteryStatus;
    }).catch(() => {
      // API Batterie non disponible, on continue sans cette information
    });

    return this.cachedCapabilities;
  }

  /**
   * Détermine le type d'appareil (mobile, tablet, desktop)
   * @returns {string} Type d'appareil
   */
  detectDeviceType() {
    if (this.cachedDeviceType) {
      return this.cachedDeviceType;
    }

    // Détection basée sur l'user agent et la taille d'écran
    const userAgent = navigator.userAgent.toLowerCase();
    const width = window.innerWidth;

    // Détection basée sur l'user agent pour les appareils mobiles
    const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /ipad|android/.test(userAgent) && !/mobile/.test(userAgent);

    // Détection basée sur la taille d'écran en cas de doute
    let deviceType = "desktop";
    
    if (width < 768 || isMobile) {
      deviceType = "mobile";
    } else if (width < 1024 || isTablet) {
      deviceType = "tablet";
    }

    this.cachedDeviceType = deviceType;
    return deviceType;
  }

  /**
   * Détecte les capacités du GPU via WebGL
   * @returns {Object} Capacités GPU
   */
  detectGPUCapabilities() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) {
      return {
        supported: false,
        webgl2Supported: false,
        renderer: null,
        vendor: null,
        extensions: [],
        maxTextureSize: 0,
        level: QUALITY_LEVELS.LOW
      };
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null;
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null;
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const extensions = gl.getSupportedExtensions() || [];
    const webgl2Supported = !!canvas.getContext('webgl2');

    // Estimation du niveau de qualité basée sur le GPU et les capacités WebGL
    let quality = QUALITY_LEVELS.LOW;
    
    if (maxTextureSize >= 8192 && webgl2Supported && extensions.length > 20) {
      quality = QUALITY_LEVELS.HIGH;
    } else if (maxTextureSize >= 4096 && extensions.length > 15) {
      quality = QUALITY_LEVELS.MEDIUM;
    }

    return {
      supported: true,
      webgl2Supported,
      renderer,
      vendor,
      extensions,
      maxTextureSize,
      quality
    };
  }

  /**
   * Détecte le support de WebGL
   * @returns {Object} Support WebGL
   */
  detectWebGLSupport() {
    const canvas = document.createElement('canvas');
    let webgl1 = false;
    let webgl2 = false;

    try {
      if (canvas.getContext('webgl')) {
        webgl1 = true;
      }
    } catch (e) {
      // WebGL 1 non supporté
    }

    try {
      if (canvas.getContext('webgl2')) {
        webgl2 = true;
      }
    } catch (e) {
      // WebGL 2 non supporté
    }

    return {
      webgl1,
      webgl2,
      supported: webgl1 || webgl2
    };
  }

  /**
   * Estimation approximative de la mémoire disponible
   * @returns {Object} Informations sur la mémoire
   */
  detectMemory() {
    // Vérifier si l'API de performance est disponible
    if (window.performance && window.performance.memory) {
      return {
        total: window.performance.memory.jsHeapSizeLimit,
        available: window.performance.memory.jsHeapSizeLimit - window.performance.memory.usedJSHeapSize,
        used: window.performance.memory.usedJSHeapSize
      };
    }

    // Estimation basée sur le type d'appareil
    const deviceType = this.detectDeviceType();
    
    // Valeurs par défaut approximatives
    const memoryDefaults = {
      mobile: {
        total: 512 * 1024 * 1024, // 512MB estimation pour mobile
        available: 256 * 1024 * 1024
      },
      tablet: {
        total: 1024 * 1024 * 1024, // 1GB estimation pour tablette
        available: 512 * 1024 * 1024
      },
      desktop: {
        total: 2048 * 1024 * 1024, // 2GB estimation pour desktop
        available: 1024 * 1024 * 1024
      }
    };

    const memory = memoryDefaults[deviceType];
    return {
      total: memory.total,
      available: memory.available,
      used: memory.total - memory.available,
      isEstimate: true
    };
  }

  /**
   * Vérifie si l'appareil a un écran tactile
   * @returns {boolean} Vrai si l'appareil a un écran tactile
   */
  hasTouchScreen() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Tente d'obtenir le statut de la batterie si disponible
   * @returns {Promise<Object>} Statut de la batterie
   */
  async tryGetBatteryStatus() {
    if (!navigator.getBattery) {
      return null;
    }

    try {
      const battery = await navigator.getBattery();
      return {
        level: battery.level,
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Exécute un benchmark pour déterminer les capacités de rendu
   * @param {Function} progressCallback Fonction de callback pour la progression
   * @returns {Promise<Object>} Résultats du benchmark
   */
  async runBenchmark(progressCallback = () => {}) {
    if (this.hasBenchmarked) {
      return this.benchmarkResults;
    }

    // Notifier le début du benchmark
    progressCallback({ status: 'starting', progress: 0 });

    // Benchmark WebGL
    const webglScore = await this.benchmarkWebGL(
      progress => progressCallback({ status: 'webgl', progress: progress * 0.6 })
    );

    // Benchmark CPU
    const cpuScore = await this.benchmarkCPU(
      progress => progressCallback({ status: 'cpu', progress: 0.6 + progress * 0.4 })
    );

    // Calculer le score total et déterminer le type de visualisation recommandé
    const totalScore = webglScore * 0.7 + cpuScore * 0.3;
    
    const recommendedVisualization = this.getRecommendedVisualization(totalScore);
    const recommendedQuality = this.getRecommendedQuality(totalScore);

    this.benchmarkResults = {
      webglScore,
      cpuScore,
      totalScore,
      recommendedVisualization,
      recommendedQuality,
      timestamp: Date.now()
    };

    this.hasBenchmarked = true;
    progressCallback({ status: 'complete', progress: 1, results: this.benchmarkResults });
    
    return this.benchmarkResults;
  }

  /**
   * Benchmark des capacités WebGL
   * @param {Function} progressCallback Fonction de callback pour la progression
   * @returns {Promise<number>} Score WebGL (0-100)
   */
  async benchmarkWebGL(progressCallback) {
    return new Promise(resolve => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

      if (!gl) {
        progressCallback(1);
        resolve(0); // WebGL non supporté
        return;
      }

      // Tests WebGL
      const tests = [
        // Test 1: Rendu de triangles simples
        () => this.testDrawTriangles(gl, 10000),
        
        // Test 2: Tests des textures
        () => this.testTextures(gl, 1024),
        
        // Test 3: Test des transformations
        () => this.testTransforms(gl, 1000)
      ];

      let totalScore = 0;
      let testsCompleted = 0;

      const runNextTest = () => {
        if (testsCompleted >= tests.length) {
          const finalScore = Math.min(100, totalScore / tests.length);
          resolve(finalScore);
          return;
        }

        const testFn = tests[testsCompleted];
        const testScore = testFn();
        totalScore += testScore;
        testsCompleted++;

        progressCallback(testsCompleted / tests.length);
        setTimeout(runNextTest, 0);
      };

      runNextTest();
    });
  }

  /**
   * Test de rendu de triangles WebGL
   * @param {WebGLRenderingContext} gl Contexte WebGL
   * @param {number} count Nombre de triangles
   * @returns {number} Score (0-100)
   */
  testDrawTriangles(gl, count) {
    try {
      // Créer un shader et un programme simples
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, `
        attribute vec2 position;
        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `);
      gl.compileShader(vertexShader);

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, `
        precision mediump float;
        void main() {
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
      `);
      gl.compileShader(fragmentShader);

      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);

      // Créer des données de vertex
      const vertices = new Float32Array(count * 6);
      for (let i = 0; i < count; i++) {
        const j = i * 6;
        vertices[j] = Math.random() * 2 - 1;
        vertices[j + 1] = Math.random() * 2 - 1;
        vertices[j + 2] = Math.random() * 2 - 1;
        vertices[j + 3] = Math.random() * 2 - 1;
        vertices[j + 4] = Math.random() * 2 - 1;
        vertices[j + 5] = Math.random() * 2 - 1;
      }

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const positionAttrib = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(positionAttrib);
      gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);

      // Mesurer le temps de rendu
      const startTime = performance.now();
      for (let i = 0; i < 10; i++) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        for (let j = 0; j < count; j += 3) {
          gl.drawArrays(gl.TRIANGLES, j, 3);
        }
      }
      gl.finish();
      const endTime = performance.now();

      // Calculer le score basé sur le temps
      const time = endTime - startTime;
      const expectedTime = 500; // Temps attendu pour un appareil moyen (ms)
      const score = Math.min(100, Math.max(0, 100 * (expectedTime / Math.max(10, time))));

      return score;
    } catch (e) {
      console.error('Erreur dans le test de triangles WebGL:', e);
      return 10; // Score minimal en cas d'erreur
    }
  }

  /**
   * Test des textures WebGL
   * @param {WebGLRenderingContext} gl Contexte WebGL
   * @param {number} size Taille de la texture
   * @returns {number} Score (0-100)
   */
  testTextures(gl, size) {
    try {
      // Score basé sur la taille maximale de texture
      const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      const sizeScore = Math.min(100, (maxSize / 8192) * 100);
      
      // Vérifier si l'appareil supporte les textures flottantes
      const hasFloatTextures = gl.getExtension('OES_texture_float') !== null;
      const hasHalfFloatTextures = gl.getExtension('OES_texture_half_float') !== null;
      const textureFormatScore = hasFloatTextures ? 100 : (hasHalfFloatTextures ? 60 : 30);
      
      // Nombre d'unités de texture
      const textureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
      const unitsScore = Math.min(100, (textureUnits / 16) * 100);
      
      // Score combiné
      return (sizeScore * 0.5 + textureFormatScore * 0.3 + unitsScore * 0.2);
    } catch (e) {
      console.error('Erreur dans le test de textures WebGL:', e);
      return 20;
    }
  }

  /**
   * Test des transformations matricielles
   * @param {WebGLRenderingContext} gl Contexte WebGL
   * @param {number} iterations Nombre d'itérations
   * @returns {number} Score (0-100)
   */
  testTransforms(gl, iterations) {
    try {
      // Créer un shader simple utilisant une matrice de transformation
      const vertexShader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, `
        attribute vec2 position;
        uniform mat4 transform;
        void main() {
          gl_Position = transform * vec4(position, 0.0, 1.0);
        }
      `);
      gl.compileShader(vertexShader);

      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, `
        precision mediump float;
        void main() {
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
      `);
      gl.compileShader(fragmentShader);

      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);

      // Préparer un triangle
      const vertices = new Float32Array([
        -0.5, -0.5,
        0.5, -0.5,
        0.0, 0.5
      ]);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const positionAttrib = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(positionAttrib);
      gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);

      const transformLocation = gl.getUniformLocation(program, 'transform');

      // Tester les transformations
      const startTime = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        // Créer une matrice de transformation
        const angle = (i / iterations) * Math.PI * 2;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        
        // Matrice de rotation
        const matrix = [
          c, -s, 0, 0,
          s, c, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1
        ];
        
        gl.uniformMatrix4fv(transformLocation, false, matrix);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      
      gl.finish();
      const endTime = performance.now();

      // Calculer le score
      const time = endTime - startTime;
      const expectedTime = 50; // Temps attendu pour un appareil moyen (ms)
      const score = Math.min(100, Math.max(0, 100 * (expectedTime / Math.max(1, time))));

      return score;
    } catch (e) {
      console.error('Erreur dans le test de transformations WebGL:', e);
      return 30;
    }
  }

  /**
   * Benchmark des capacités CPU
   * @param {Function} progressCallback Fonction de callback pour la progression
   * @returns {Promise<number>} Score CPU (0-100)
   */
  async benchmarkCPU(progressCallback) {
    return new Promise(resolve => {
      // Test 1: Calculs mathématiques
      const startTimeMath = performance.now();
      let sum = 0;
      for (let i = 0; i < 1000000; i++) {
        sum += Math.sin(i) * Math.cos(i);
      }
      const mathTime = performance.now() - startTimeMath;
      
      progressCallback(0.25);
      
      // Test 2: Manipulation d'objets
      const startTimeObjects = performance.now();
      const objects = [];
      for (let i = 0; i < 10000; i++) {
        objects.push({
          id: i,
          value: Math.random(),
          data: `item-${i}`
        });
      }
      
      objects.sort((a, b) => a.value - b.value);
      
      const objectsTime = performance.now() - startTimeObjects;
      
      progressCallback(0.5);
      
      // Test 3: Arrays et string operations
      const startTimeArrays = performance.now();
      const array = new Array(100000);
      for (let i = 0; i < array.length; i++) {
        array[i] = i.toString();
      }
      
      const joined = array.join('').substring(0, 1000);
      const split = joined.split('');
      
      const arraysTime = performance.now() - startTimeArrays;
      
      progressCallback(0.75);
      
      // Test 4: Opérations DOM
      const startTimeDOM = performance.now();
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.left = '-9999px';
      document.body.appendChild(div);
      
      for (let i = 0; i < 1000; i++) {
        const child = document.createElement('span');
        child.textContent = `Item ${i}`;
        div.appendChild(child);
      }
      
      const computed = window.getComputedStyle(div);
      document.body.removeChild(div);
      
      const domTime = performance.now() - startTimeDOM;
      
      progressCallback(1);
      
      // Calculer les scores de chaque test
      const mathScore = Math.min(100, Math.max(0, 100 * (400 / Math.max(10, mathTime))));
      const objectsScore = Math.min(100, Math.max(0, 100 * (200 / Math.max(10, objectsTime))));
      const arraysScore = Math.min(100, Math.max(0, 100 * (300 / Math.max(10, arraysTime))));
      const domScore = Math.min(100, Math.max(0, 100 * (300 / Math.max(10, domTime))));
      
      // Score final pondéré
      const finalScore = (
        mathScore * 0.3 +
        objectsScore * 0.3 +
        arraysScore * 0.2 +
        domScore * 0.2
      );
      
      resolve(finalScore);
    });
  }

  /**
   * Détermine le type de visualisation recommandé en fonction du score
   * @param {number} score Score du benchmark
   * @returns {string} Type de visualisation recommandé
   */
  getRecommendedVisualization(score) {
    if (score < 30) {
      return VISUALIZATION_TYPES.MINI_PROFILE;
    } else if (score < 60) {
      return VISUALIZATION_TYPES.PROFILE_2D;
    } else {
      return VISUALIZATION_TYPES.TERRAIN_3D;
    }
  }

  /**
   * Détermine la qualité recommandée en fonction du score
   * @param {number} score Score du benchmark
   * @returns {string} Niveau de qualité recommandé
   */
  getRecommendedQuality(score) {
    if (score < 40) {
      return QUALITY_LEVELS.LOW;
    } else if (score < 75) {
      return QUALITY_LEVELS.MEDIUM;
    } else {
      return QUALITY_LEVELS.HIGH;
    }
  }

  /**
   * Réinitialise le cache des capacités
   */
  reset() {
    this.cachedCapabilities = null;
    this.cachedDeviceType = null;
    this.benchmarkResults = null;
    this.hasBenchmarked = false;
  }
}

// Exporter une instance unique
export default new DeviceCapabilitiesDetector();
