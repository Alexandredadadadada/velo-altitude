/**
 * Types de niveau de performance des appareils
 */
export type DevicePerformanceLevel = 'high' | 'medium' | 'low';

/**
 * Résultat de la détection des fonctionnalités WebGL
 */
export interface WebGLCapabilities {
  supported: boolean;
  webgl2Supported: boolean;
  maxTextureSize: number;
  maxAnisotropy: number;
  precision: string;
  antialiasing: boolean;
  floatTextures: boolean;
  extensions: string[];
}

/**
 * Résultat de la détection des capacités de l'appareil
 */
export interface DeviceCapabilities {
  performance: DevicePerformanceLevel;
  gpu: {
    supported: boolean;
    renderer: string;
    vendor: string;
  };
  webgl: WebGLCapabilities;
  screen: {
    width: number;
    height: number;
    pixelRatio: number;
    touchSupported: boolean;
  };
  recommendations: {
    maxRoutePoints: number;
    textureQuality: 'high' | 'medium' | 'low';
    useSimplifiedGeometry: boolean;
    useSimplifiedMaterials: boolean;
    useEffects: boolean;
  };
}

/**
 * Test la puissance GPU par un benchmark simple
 */
async function runGpuBenchmark(): Promise<number> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
      
      if (!gl) {
        resolve(0); // WebGL non supporté
        return;
      }
      
      const startTime = performance.now();
      const iterations = 50;
      const size = 1000;
      
      // Créer un programme simple
      const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
      gl.shaderSource(vertexShader, `
        attribute vec2 position;
        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `);
      gl.compileShader(vertexShader);
      
      const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
      gl.shaderSource(fragmentShader, `
        precision mediump float;
        void main() {
          gl_FragColor = vec4(0.5, 0.5, 0.5, 1.0);
        }
      `);
      gl.compileShader(fragmentShader);
      
      const program = gl.createProgram()!;
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.useProgram(program);
      
      // Créer un buffer avec des triangles
      const triangleBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffer);
      
      const positions = new Float32Array(size * 6); // 3 points par triangle, 2 coordonnées par point
      for (let i = 0; i < size * 6; i++) {
        positions[i] = Math.random() * 2 - 1; // Valeurs entre -1 et 1
      }
      
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
      
      const positionLocation = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      
      // Exécuter le benchmark
      let frame = 0;
      function render() {
        // Nous savons que gl n'est pas null ici car nous avons vérifié plus haut
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, size * 3);
        
        frame++;
        if (frame < iterations) {
          requestAnimationFrame(render);
        } else {
          const endTime = performance.now();
          const duration = endTime - startTime;
          const fps = iterations / (duration / 1000);
          resolve(fps);
        }
      }
      
      render();
    } catch (e) {
      console.error('Erreur lors du benchmark GPU:', e);
      resolve(0);
    }
  });
}

/**
 * Détecte les fonctionnalités WebGL disponibles
 */
function detectWebGLCapabilities(): WebGLCapabilities {
  const canvas = document.createElement('canvas');
  const defaultCapabilities: WebGLCapabilities = {
    supported: false,
    webgl2Supported: false,
    maxTextureSize: 0,
    maxAnisotropy: 0,
    precision: 'unknown',
    antialiasing: false,
    floatTextures: false,
    extensions: []
  };

  try {
    // Vérifier WebGL 1
    let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) {
      return defaultCapabilities;
    }

    // Vérifier WebGL 2
    const webgl2Supported = !!canvas.getContext('webgl2');

    // Obtenir les extensions et fonctionnalités
    const extensions = gl.getSupportedExtensions() || [];
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    
    // Vérifier l'antialiasing
    const contextAttributes = gl.getContextAttributes();
    // Utiliser une valeur par défaut false si contextAttributes ou contextAttributes.antialias est undefined
    const antialiasing = contextAttributes ? !!contextAttributes.antialias : false;
    
    // Vérifier le support des textures float
    const floatTexturesSupported = extensions.includes('OES_texture_float');
    
    // Déterminer la précision
    const fragmentPrecision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    const precision = fragmentPrecision && fragmentPrecision.precision > 0 ? 'high' : 'medium';
    
    // Obtenir l'anisotropie maximale
    let maxAnisotropy = 0;
    const extAniso = gl.getExtension('EXT_texture_filter_anisotropic') || 
                    gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
                    gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
    
    if (extAniso) {
      maxAnisotropy = gl.getParameter(extAniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
    }

    return {
      supported: true,
      webgl2Supported,
      maxTextureSize,
      maxAnisotropy,
      precision,
      antialiasing,
      floatTextures: floatTexturesSupported,
      extensions
    };
  } catch (e) {
    console.error('Erreur lors de la détection des fonctionnalités WebGL:', e);
    return defaultCapabilities;
  }
}

/**
 * Détecte les informations GPU
 */
function detectGPUInfo() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
  
  if (!gl) {
    return {
      supported: false,
      renderer: 'unknown',
      vendor: 'unknown'
    };
  }
  
  let renderer: string;
  let vendor: string;
  
  try {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    
    if (debugInfo) {
      renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    } else {
      renderer = 'unknown';
      vendor = 'unknown';
    }
  } catch (e) {
    renderer = 'unknown';
    vendor = 'unknown';
  }
  
  return {
    supported: true,
    renderer,
    vendor
  };
}

/**
 * Détermine le niveau de performance de l'appareil en fonction des capacités détectées
 */
function determinePerformanceLevel(gpuInfo: ReturnType<typeof detectGPUInfo>, webglInfo: WebGLCapabilities, benchmarkScore: number): DevicePerformanceLevel {
  // Si WebGL n'est pas supporté, performance faible
  if (!webglInfo.supported) return 'low';
  
  // Identification de GPU spécifiques (liste non exhaustive)
  const renderer = gpuInfo.renderer.toLowerCase();
  
  // GPU haute performance connus
  const highEndGPUs = [
    'nvidia', 'rtx', 'geforce', 'quadro',
    'radeon rx', 'radeon pro', 'amd radeon', 'vega',
    'intel iris xe', 'intel arc'
  ];
  
  // GPU milieu de gamme connus
  const midRangeGPUs = [
    'intel iris', 'intel uhd', 'intel(r) uhd',
    'amd ryzen', 'mali-g', 'adreno 6'
  ];
  
  // GPU bas de gamme connus
  const lowEndGPUs = [
    'intel hd', 'mali-t', 'mali-4', 'adreno 5'
  ];
  
  // Vérifier si le GPU est dans une des catégories
  const isHighEnd = highEndGPUs.some(gpu => renderer.includes(gpu));
  const isMidRange = midRangeGPUs.some(gpu => renderer.includes(gpu));
  const isLowEnd = lowEndGPUs.some(gpu => renderer.includes(gpu));
  
  // Évaluer en fonction du benchmark GPU et des autres facteurs
  if (benchmarkScore > 40 || isHighEnd) {
    return 'high';
  } else if (benchmarkScore > 20 || isMidRange || webglInfo.webgl2Supported) {
    return 'medium';
  } else if (isLowEnd || benchmarkScore < 10) {
    return 'low';
  }
  
  // Par défaut, utiliser le niveau moyen
  return 'medium';
}

/**
 * Évalue les capacités de l'appareil pour la visualisation 3D
 */
export async function detectDeviceCapabilities(): Promise<DeviceCapabilities> {
  // Valeurs par défaut pour les environnements sans navigateur (SSR)
  if (typeof window === 'undefined') {
    return {
      performance: 'medium',
      gpu: {
        supported: false,
        renderer: 'unknown',
        vendor: 'unknown'
      },
      webgl: {
        supported: false,
        webgl2Supported: false,
        maxTextureSize: 0,
        maxAnisotropy: 0,
        precision: 'unknown',
        antialiasing: false,
        floatTextures: false,
        extensions: []
      },
      screen: {
        width: 1920,
        height: 1080,
        pixelRatio: 1,
        touchSupported: false
      },
      recommendations: {
        maxRoutePoints: 1000,
        textureQuality: 'medium',
        useSimplifiedGeometry: false,
        useSimplifiedMaterials: false,
        useEffects: true
      }
    };
  }

  // Détecter les capacités WebGL
  const webglCapabilities = detectWebGLCapabilities();
  
  // Détecter les informations GPU
  const gpuInfo = detectGPUInfo();
  
  // Exécuter le benchmark GPU
  const benchmarkScore = await runGpuBenchmark();
  
  // Déterminer le niveau de performance
  const performanceLevel = determinePerformanceLevel(gpuInfo, webglCapabilities, benchmarkScore);
  
  // Obtenir les informations d'écran
  const screenInfo = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: window.devicePixelRatio || 1,
    touchSupported: 'ontouchstart' in window
  };
  
  // Calculer les recommandations en fonction des capacités détectées
  const recommendations = {
    maxRoutePoints: performanceLevel === 'high' ? 3000 : performanceLevel === 'medium' ? 1500 : 500,
    textureQuality: performanceLevel as 'high' | 'medium' | 'low',
    useSimplifiedGeometry: performanceLevel === 'low',
    useSimplifiedMaterials: performanceLevel !== 'high',
    useEffects: performanceLevel !== 'low'
  };
  
  return {
    performance: performanceLevel,
    gpu: gpuInfo,
    webgl: webglCapabilities,
    screen: screenInfo,
    recommendations
  };
}

/**
 * Obtient le niveau de performance de l'appareil
 * Cette fonction est un raccourci pour obtenir uniquement le niveau de performance
 */
export async function getDevicePerformanceLevel(): Promise<DevicePerformanceLevel> {
  try {
    const capabilities = await detectDeviceCapabilities();
    return capabilities.performance;
  } catch (e) {
    console.error('Erreur lors de la détection des performances:', e);
    return 'medium'; // Valeur par défaut en cas d'erreur
  }
}

/**
 * Fournit les recommandations optimales pour le rendu 3D en fonction des capacités de l'appareil
 */
export async function getOptimalRenderingSettings() {
  const capabilities = await detectDeviceCapabilities();
  return capabilities.recommendations;
}

export default {
  detectDeviceCapabilities,
  getDevicePerformanceLevel,
  getOptimalRenderingSettings
};
