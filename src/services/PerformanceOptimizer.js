/**
 * PerformanceOptimizer Service
 * Provides utilities for optimizing application performance,
 * especially for resource-intensive features like 3D visualizations
 */
class PerformanceOptimizer {
  constructor() {
    this.devicePerformance = this.detectDevicePerformance();
    this.textureCache = new Map();
    this.loadingQueue = [];
    this.isProcessing = false;
    this.maxConcurrentLoads = 3;
  }

  /**
   * Detect device performance based on hardware capabilities
   * @returns {string} 'low', 'medium', or 'high'
   */
  detectDevicePerformance() {
    try {
      // Check for hardware concurrency (CPU cores)
      const cpuCores = navigator.hardwareConcurrency || 2;
      
      // Check if the device is mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      // Check if device has WebGL 2 support
      const hasWebGL2 = !!document.createElement('canvas')
        .getContext('webgl2');
      
      // Simple heuristic for device performance
      if (isMobile && cpuCores <= 4) {
        return 'low';
      } else if ((isMobile && cpuCores > 4) || (!isMobile && cpuCores <= 4) || !hasWebGL2) {
        return 'medium';
      } else {
        return 'high';
      }
    } catch (error) {
      console.warn('Error detecting device performance:', error);
      return 'medium'; // Default to medium if detection fails
    }
  }

  /**
   * Get recommended 3D detail level based on device performance
   * @param {Object} options - Additional options like view distance
   * @returns {Object} Configuration for 3D rendering
   */
  get3DDetailLevel(options = {}) {
    const { viewDistance = 5000 } = options;
    
    // Base detail levels by device performance
    const detailLevels = {
      low: { 
        segments: 64, 
        textureSize: 512, 
        shadows: false,
        reflections: false,
        antialiasing: false,
        maxLights: 2
      },
      medium: { 
        segments: 128, 
        textureSize: 1024, 
        shadows: true,
        reflections: false,
        antialiasing: true,
        maxLights: 4
      },
      high: { 
        segments: 256, 
        textureSize: 2048, 
        shadows: true,
        reflections: true,
        antialiasing: true,
        maxLights: 8
      }
    };
    
    // Get base level according to device performance
    const baseLevelConfig = detailLevels[this.devicePerformance];
    
    // Adjust based on view distance
    const distanceFactor = Math.max(0.5, Math.min(1, 5000 / viewDistance));
    const adjustedSegments = Math.floor(baseLevelConfig.segments * distanceFactor);
    
    return {
      ...baseLevelConfig,
      segments: adjustedSegments
    };
  }

  /**
   * Load a texture with progressive quality
   * @param {string} url - URL of the texture to load
   * @param {number} priority - Loading priority (higher = more important)
   * @returns {Promise<Object>} Promise resolving to the texture
   */
  loadTexture(url, priority = 1) {
    return new Promise((resolve, reject) => {
      // Check if texture is already in cache
      if (this.textureCache.has(url)) {
        resolve(this.textureCache.get(url));
        return;
      }
      
      // Add to loading queue
      this.loadingQueue.push({
        url,
        priority,
        resolve,
        reject
      });
      
      // Sort queue by priority
      this.loadingQueue.sort((a, b) => b.priority - a.priority);
      
      // Start processing if not already
      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process the texture loading queue
   */
  async processQueue() {
    if (this.loadingQueue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    
    // Process up to maxConcurrentLoads textures simultaneously
    const batch = this.loadingQueue.splice(0, this.maxConcurrentLoads);
    
    try {
      await Promise.all(batch.map(item => this.loadTextureItem(item)));
    } catch (error) {
      console.error('Error loading textures:', error);
    }
    
    // Continue with the queue
    this.processQueue();
  }

  /**
   * Load a single texture with progressive quality
   * @param {Object} item - Queue item containing url, resolve, and reject functions
   */
  async loadTextureItem({ url, resolve, reject }) {
    // In a real implementation, this would use THREE.TextureLoader
    // For this example, we'll simulate the loading process
    try {
      // First load low-res version
      const lowResUrl = url.replace(/\.([^.]+)$/, '_low.$1');
      
      // Simulate loading a low-res texture
      const lowResTexture = await this.simulateTextureLoading(lowResUrl, 500);
      
      // Resolve immediately with low-res version
      resolve(lowResTexture);
      this.textureCache.set(url, lowResTexture);
      
      // Then load high-res version in background
      const highResTexture = await this.simulateTextureLoading(url, 1500);
      
      // Update cache with high-res version
      this.textureCache.set(url, highResTexture);
      
      // Dispatch event to notify of the update
      window.dispatchEvent(new CustomEvent('texture-updated', {
        detail: { url, texture: highResTexture }
      }));
    } catch (error) {
      reject(error);
    }
  }

  /**
   * Simulate loading a texture (temporary replacement for THREE.TextureLoader)
   * @param {string} url - URL of the texture
   * @param {number} delay - Simulated loading delay in ms
   * @returns {Promise<Object>} Promise resolving to the texture
   */
  simulateTextureLoading(url, delay) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock texture object
        const texture = {
          url,
          width: url.includes('_low') ? 512 : 2048,
          height: url.includes('_low') ? 512 : 2048,
          isTexture: true
        };
        resolve(texture);
      }, delay);
    });
  }

  /**
   * Calculate occlusion culling parameters for 3D scene
   * @param {Object} sceneInfo - Information about the scene
   * @returns {Object} Occlusion culling configuration
   */
  calculateOcclusionCulling(sceneInfo) {
    const { viewportWidth, viewportHeight, cameraFOV, cameraPosition } = sceneInfo;
    
    // Calculate frustum dimensions at near plane (simplified)
    const nearDistance = 0.1;
    const farDistance = 10000;
    
    return {
      enabled: true,
      frustumCulling: true,
      occlusionCulling: this.devicePerformance !== 'low',
      hierarchicalCulling: this.devicePerformance === 'high',
      cullingDistance: this.devicePerformance === 'low' ? 3000 : 5000,
      lodDistances: [500, 1000, 2000, 4000],
      updateInterval: this.devicePerformance === 'high' ? 0 : 2 // frames
    };
  }

  /**
   * Optimize rendering of a scene for current device
   * @param {Object} scene - Scene to optimize (interface agnostic, implementation depends on rendering library)
   * @param {Object} options - Additional optimization options
   */
  optimizeScene(scene, options = {}) {
    const perfLevel = this.devicePerformance;
    
    // Example optimizations (would be implemented depending on 3D library)
    const optimizations = {
      enableShadows: perfLevel !== 'low',
      shadowMapSize: perfLevel === 'high' ? 2048 : (perfLevel === 'medium' ? 1024 : 512),
      enableSSAO: perfLevel === 'high',
      anisotropicFiltering: perfLevel === 'low' ? 1 : (perfLevel === 'medium' ? 2 : 4),
      useFXAA: perfLevel !== 'low',
      useHDR: perfLevel === 'high',
      enableDynamicEnvMap: perfLevel === 'high',
      maxLightsPerScene: perfLevel === 'low' ? 2 : (perfLevel === 'medium' ? 4 : 8),
      textureQuality: perfLevel === 'low' ? 0.5 : (perfLevel === 'medium' ? 0.75 : 1)
    };
    
    return {
      ...optimizations,
      ...options
    };
  }

  /**
   * Get best image format supported by browser
   * @returns {string} Best supported image format extension
   */
  getBestImageFormat() {
    const formats = [
      { format: 'avif', extension: 'avif' },
      { format: 'webp', extension: 'webp' },
      { format: 'jpeg', extension: 'jpg' }
    ];
    
    for (const { format, extension } of formats) {
      const supported = format === 'jpeg' ? true : this.isFormatSupported(format);
      if (supported) {
        return extension;
      }
    }
    
    return 'jpg'; // Fallback to JPEG
  }

  /**
   * Check if a specific image format is supported
   * @param {string} format - Format to check ('webp', 'avif', etc.)
   * @returns {boolean} Whether the format is supported
   */
  isFormatSupported(format) {
    const elem = document.createElement('canvas');
    if (!elem.getContext || !elem.getContext('2d')) {
      return false;
    }
    
    return elem.toDataURL(`image/${format}`).indexOf(`image/${format}`) > -1;
  }

  /**
   * Get appropriate size image for current viewport and device pixel ratio
   * @param {string} basePath - Base path to the image without extension
   * @param {number} containerWidth - Width of the container in pixels
   * @returns {string} URL for the appropriately sized image
   */
  getResponsiveImageUrl(basePath, containerWidth) {
    const dpr = window.devicePixelRatio || 1;
    const effectiveWidth = containerWidth * dpr;
    
    // Available size breakpoints
    const sizes = [400, 800, 1200, 1600, 2000];
    
    // Find the smallest size that is larger than needed
    let selectedSize = sizes[0];
    for (const size of sizes) {
      selectedSize = size;
      if (size >= effectiveWidth) {
        break;
      }
    }
    
    // Get best format
    const format = this.getBestImageFormat();
    
    // Construct URL with size and format
    return `${basePath}-${selectedSize}.${format}`;
  }
}

export default new PerformanceOptimizer();
