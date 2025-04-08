import { EventEmitter } from 'events';

// Type definitions
export interface OptimizationConfig {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  gpuTier: 'low' | 'medium' | 'high';
  connectionSpeed: 'slow' | 'medium' | 'fast';
  memoryLimit?: number; // in MB
  batteryStatus?: 'charging' | 'discharging';
  batteryLevel?: number; // 0-1
}

export interface RenderingSettings {
  textureQuality: 'low' | 'medium' | 'high';
  meshDetail: 'low' | 'medium' | 'high';
  maxDrawCalls: number;
  useCompressedTextures: boolean;
  useLOD: boolean;
  usePostProcessing: boolean;
  maxTextureSize: number;
  enableAntialiasing: boolean;
  useShadows: boolean;
  maxLights: number;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number; // in ms
  drawCalls: number;
  triangleCount: number;
  memoryUsage: number; // in MB
  textureMemory: number; // in MB
  geometryMemory: number; // in MB
  gpuUtilization?: number; // 0-1
  timestamp: number;
}

/**
 * Mobile Optimization Service for 3D Rendering
 * 
 * Provides device detection and optimization strategies for mobile devices:
 * - Progressive mesh loading
 * - Level of detail (LOD) management
 * - Texture compression
 * - Draw call optimization
 */
export class MobileOptimizationService extends EventEmitter {
  private static instance: MobileOptimizationService;
  private config: OptimizationConfig;
  private settings: RenderingSettings;
  private metricsHistory: PerformanceMetrics[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private adaptationMode: 'static' | 'dynamic' = 'dynamic';
  private maxMetricsHistory: number = 100;
  
  // Service integration
  private monitoringService: any; // Will be properly typed when integrated with actual service
  private cacheService: any; // Will be properly typed when integrated with actual service

  private constructor() {
    super();
    
    // Default configuration - will be updated via detection
    this.config = {
      deviceType: 'desktop',
      gpuTier: 'high',
      connectionSpeed: 'fast'
    };
    
    // Default rendering settings based on high-end device
    this.settings = {
      textureQuality: 'high',
      meshDetail: 'high',
      maxDrawCalls: 1000,
      useCompressedTextures: false,
      useLOD: false,
      usePostProcessing: true,
      maxTextureSize: 2048,
      enableAntialiasing: true,
      useShadows: true,
      maxLights: 8
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MobileOptimizationService {
    if (!MobileOptimizationService.instance) {
      MobileOptimizationService.instance = new MobileOptimizationService();
    }
    return MobileOptimizationService.instance;
  }

  /**
   * Initialize with services and configuration
   */
  public initialize(monitoringService?: any, cacheService?: any): void {
    this.monitoringService = monitoringService;
    this.cacheService = cacheService;
    
    // Detect device capabilities
    this.detectDeviceCapabilities();
    
    // Apply initial optimization settings
    this.updateOptimizationSettings();
    
    console.log('MobileOptimizationService initialized with config:', this.config);
  }

  /**
   * Detect device capabilities using various browser APIs
   */
  private detectDeviceCapabilities(): void {
    if (typeof window === 'undefined') return; // Skip on server-side

    // Device type detection based on screen size and user agent
    const width = window.innerWidth;
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (width < 768 || (isMobileUserAgent && width < 1024)) {
      this.config.deviceType = width < 480 ? 'mobile' : 'tablet';
    } else {
      this.config.deviceType = 'desktop';
    }

    // GPU detection - using a simple heuristic approach
    this.detectGPUCapabilities();
    
    // Connection detection
    this.detectConnectionSpeed();
    
    // Battery status detection if API is available
    this.detectBatteryStatus();
    
    // Memory limits
    this.detectMemoryLimits();
    
    // Report configuration to monitoring service if available
    if (this.monitoringService) {
      this.monitoringService.reportDeviceCapabilities(this.config);
    }
  }

  /**
   * Detect GPU capabilities
   */
  private detectGPUCapabilities(): void {
    if (typeof window === 'undefined') return;

    // Simple heuristic based on device type initially
    if (this.config.deviceType === 'mobile') {
      this.config.gpuTier = 'low';
    } else if (this.config.deviceType === 'tablet') {
      this.config.gpuTier = 'medium';
    } else {
      this.config.gpuTier = 'high';
    }
    
    // Attempt more accurate GPU detection using canvas performance
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          
          // Classify GPU tier based on renderer string
          if (/(Intel|HD Graphics|UHD Graphics|Iris)/i.test(renderer)) {
            this.config.gpuTier = 'medium';
          } else if (/(NVIDIA|RTX|GTX|AMD|Radeon)/i.test(renderer)) {
            this.config.gpuTier = 'high';
          } else if (/(Apple|M1|M2)/i.test(renderer) && this.config.deviceType !== 'mobile') {
            this.config.gpuTier = 'high';
          }
          
          // Log detected renderer for monitoring
          console.log('Detected WebGL renderer:', renderer);
        }
      }
    } catch (e) {
      console.warn('Error during GPU detection:', e);
    }
  }

  /**
   * Detect connection speed
   */
  private detectConnectionSpeed(): void {
    if (typeof navigator === 'undefined') return;
    
    // Use Network Information API if available
    const conn = (navigator as any).connection;
    if (conn) {
      if (conn.effectiveType === '4g') {
        this.config.connectionSpeed = 'fast';
      } else if (conn.effectiveType === '3g') {
        this.config.connectionSpeed = 'medium';
      } else {
        this.config.connectionSpeed = 'slow';
      }
    } else {
      // Default to 'fast' if API not available
      this.config.connectionSpeed = 'fast';
    }
  }

  /**
   * Detect battery status
   */
  private detectBatteryStatus(): void {
    if (typeof navigator === 'undefined') return;
    
    // Use Battery API if available
    if ((navigator as any).getBattery) {
      (navigator as any).getBattery().then((battery: any) => {
        this.config.batteryStatus = battery.charging ? 'charging' : 'discharging';
        this.config.batteryLevel = battery.level;
        
        // Update when battery status changes
        battery.addEventListener('chargingchange', () => {
          this.config.batteryStatus = battery.charging ? 'charging' : 'discharging';
          this.updateOptimizationSettings();
        });
        
        battery.addEventListener('levelchange', () => {
          this.config.batteryLevel = battery.level;
          this.updateOptimizationSettings();
        });
      });
    }
  }

  /**
   * Detect memory limits
   */
  private detectMemoryLimits(): void {
    if (typeof navigator === 'undefined') return;
    
    // Use Performance API if available
    if ((navigator as any).deviceMemory) {
      // deviceMemory is in GB, convert to MB
      this.config.memoryLimit = (navigator as any).deviceMemory * 1024;
    } else {
      // Set default based on device type
      this.config.memoryLimit = 
        this.config.deviceType === 'mobile' ? 2048 :
        this.config.deviceType === 'tablet' ? 4096 : 8192;
    }
  }

  /**
   * Update optimization settings based on detected capabilities
   */
  private updateOptimizationSettings(): void {
    // Base settings on device type and GPU tier
    switch (this.config.deviceType) {
      case 'mobile':
        this.applyMobileSettings();
        break;
      case 'tablet':
        this.applyTabletSettings();
        break;
      case 'desktop':
        this.applyDesktopSettings();
        break;
    }
    
    // Further refinement based on connection speed
    if (this.config.connectionSpeed === 'slow') {
      this.settings.textureQuality = 'low';
      this.settings.useCompressedTextures = true;
      this.settings.maxTextureSize = Math.min(this.settings.maxTextureSize, 512);
    }
    
    // Battery optimizations
    if (this.config.batteryStatus === 'discharging' && this.config.batteryLevel && this.config.batteryLevel < 0.2) {
      // Low battery mode - reduce quality significantly
      this.settings.usePostProcessing = false;
      this.settings.enableAntialiasing = false;
      this.settings.useShadows = false;
      this.settings.textureQuality = 'low';
    }
    
    // Emit settings updated event
    this.emit('settingsUpdated', this.settings);
  }

  /**
   * Apply settings optimized for mobile devices
   */
  private applyMobileSettings(): void {
    // Base mobile settings
    this.settings.textureQuality = 'low';
    this.settings.meshDetail = 'low';
    this.settings.maxDrawCalls = 300;
    this.settings.useCompressedTextures = true;
    this.settings.useLOD = true;
    this.settings.usePostProcessing = false;
    this.settings.maxTextureSize = 512;
    this.settings.enableAntialiasing = false;
    this.settings.useShadows = false;
    this.settings.maxLights = 2;
    
    // Adjust based on GPU tier
    if (this.config.gpuTier === 'medium') {
      this.settings.textureQuality = 'medium';
      this.settings.maxDrawCalls = 500;
      this.settings.maxTextureSize = 1024;
      this.settings.enableAntialiasing = true;
    } else if (this.config.gpuTier === 'high') {
      // High-end mobile device
      this.settings.textureQuality = 'medium';
      this.settings.meshDetail = 'medium';
      this.settings.maxDrawCalls = 700;
      this.settings.maxTextureSize = 1024;
      this.settings.enableAntialiasing = true;
      this.settings.useShadows = true;
      this.settings.maxLights = 4;
    }
  }

  /**
   * Apply settings optimized for tablets
   */
  private applyTabletSettings(): void {
    // Base tablet settings
    this.settings.textureQuality = 'medium';
    this.settings.meshDetail = 'medium';
    this.settings.maxDrawCalls = 500;
    this.settings.useCompressedTextures = true;
    this.settings.useLOD = true;
    this.settings.usePostProcessing = false;
    this.settings.maxTextureSize = 1024;
    this.settings.enableAntialiasing = true;
    this.settings.useShadows = false;
    this.settings.maxLights = 4;
    
    // Adjust based on GPU tier
    if (this.config.gpuTier === 'high') {
      this.settings.textureQuality = 'high';
      this.settings.meshDetail = 'high';
      this.settings.maxDrawCalls = 800;
      this.settings.maxTextureSize = 2048;
      this.settings.usePostProcessing = true;
      this.settings.useShadows = true;
      this.settings.maxLights = 6;
    }
  }

  /**
   * Apply settings optimized for desktop devices
   */
  private applyDesktopSettings(): void {
    // Base desktop settings
    this.settings.textureQuality = 'high';
    this.settings.meshDetail = 'high';
    this.settings.maxDrawCalls = 1000;
    this.settings.useCompressedTextures = false;
    this.settings.useLOD = true;
    this.settings.usePostProcessing = true;
    this.settings.maxTextureSize = 2048;
    this.settings.enableAntialiasing = true;
    this.settings.useShadows = true;
    this.settings.maxLights = 8;
    
    // Adjust based on GPU tier
    if (this.config.gpuTier === 'low') {
      this.settings.textureQuality = 'medium';
      this.settings.meshDetail = 'medium';
      this.settings.maxDrawCalls = 500;
      this.settings.usePostProcessing = false;
      this.settings.enableAntialiasing = false;
      this.settings.useShadows = false;
      this.settings.maxLights = 4;
    } else if (this.config.gpuTier === 'medium') {
      this.settings.textureQuality = 'high';
      this.settings.meshDetail = 'high';
      this.settings.maxDrawCalls = 800;
      this.settings.usePostProcessing = true;
      this.settings.enableAntialiasing = true;
      this.settings.useShadows = true;
      this.settings.maxLights = 6;
    }
  }

  /**
   * Start performance monitoring
   */
  public startMonitoring(intervalMs: number = 1000): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => this.collectPerformanceMetrics(), intervalMs);
    console.log(`Performance monitoring started with interval: ${intervalMs}ms`);
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('Performance monitoring stopped');
  }

  /**
   * Collect performance metrics
   */
  private collectPerformanceMetrics(): void {
    if (typeof window === 'undefined' || typeof performance === 'undefined') return;

    try {
      // Basic performance metrics
      const metrics: PerformanceMetrics = {
        fps: 0,
        frameTime: 0,
        drawCalls: 0,
        triangleCount: 0,
        memoryUsage: 0,
        textureMemory: 0,
        geometryMemory: 0,
        timestamp: Date.now()
      };
      
      // FPS calculation based on last frame time
      if (window.requestAnimationFrame) {
        let lastFrameTime = performance.now();
        let frameCount = 0;
        const calculateFPS = () => {
          const now = performance.now();
          const delta = now - lastFrameTime;
          lastFrameTime = now;
          frameCount++;
          
          // Update every ~1s
          if (frameCount >= 10) {
            metrics.fps = Math.round(1000 / (delta / frameCount));
            metrics.frameTime = delta / frameCount;
            frameCount = 0;
            
            // Add to metrics history
            this.addMetricsToHistory(metrics);
            
            // Report to monitoring service if available
            if (this.monitoringService) {
              this.monitoringService.reportPerformanceMetrics(metrics);
            }
            
            // Dynamic adaptation if enabled
            if (this.adaptationMode === 'dynamic') {
              this.adaptSettingsBasedOnPerformance();
            }
          }
          
          // Continue monitoring
          if (this.isMonitoring) {
            window.requestAnimationFrame(calculateFPS);
          }
        };
        
        window.requestAnimationFrame(calculateFPS);
      }
    } catch (e) {
      console.error('Error collecting performance metrics:', e);
    }
  }

  /**
   * Add metrics to history with limit
   */
  private addMetricsToHistory(metrics: PerformanceMetrics): void {
    this.metricsHistory.push(metrics);
    
    // Limit history size
    if (this.metricsHistory.length > this.maxMetricsHistory) {
      this.metricsHistory.shift();
    }
  }

  /**
   * Dynamically adapt settings based on performance metrics
   */
  private adaptSettingsBasedOnPerformance(): void {
    if (this.metricsHistory.length < 5) return; // Need sufficient data
    
    // Calculate average FPS from recent metrics
    const recentMetrics = this.metricsHistory.slice(-5);
    const avgFPS = recentMetrics.reduce((sum, m) => sum + m.fps, 0) / recentMetrics.length;
    
    // Adapt settings based on FPS targets
    if (avgFPS < 30) {
      // Performance is poor, reduce quality
      this.decreaseQuality();
    } else if (avgFPS > 58 && this.settings.textureQuality !== 'high') {
      // Performance is good, can potentially increase quality
      this.increaseQuality();
    }
  }

  /**
   * Decrease rendering quality to improve performance
   */
  private decreaseQuality(): void {
    let changed = false;
    
    // Selective quality reduction prioritized by impact
    if (this.settings.usePostProcessing) {
      this.settings.usePostProcessing = false;
      changed = true;
    } else if (this.settings.useShadows) {
      this.settings.useShadows = false;
      changed = true;
    } else if (this.settings.enableAntialiasing) {
      this.settings.enableAntialiasing = false;
      changed = true;
    } else if (this.settings.textureQuality !== 'low') {
      this.settings.textureQuality = 'low';
      changed = true;
    } else if (this.settings.meshDetail !== 'low') {
      this.settings.meshDetail = 'low';
      changed = true;
    }
    
    if (changed) {
      console.log('Decreased quality settings for better performance');
      this.emit('settingsUpdated', this.settings);
    }
  }

  /**
   * Increase rendering quality when performance allows
   */
  private increaseQuality(): void {
    let changed = false;
    
    // Selective quality improvements prioritized by visual impact
    if (this.settings.meshDetail === 'low') {
      this.settings.meshDetail = 'medium';
      changed = true;
    } else if (this.settings.textureQuality === 'low') {
      this.settings.textureQuality = 'medium';
      changed = true;
    } else if (!this.settings.enableAntialiasing) {
      this.settings.enableAntialiasing = true;
      changed = true;
    } else if (!this.settings.useShadows && this.config.gpuTier !== 'low') {
      this.settings.useShadows = true;
      changed = true;
    } else if (!this.settings.usePostProcessing && this.config.gpuTier === 'high') {
      this.settings.usePostProcessing = true;
      changed = true;
    }
    
    if (changed) {
      console.log('Increased quality settings for better visuals');
      this.emit('settingsUpdated', this.settings);
    }
  }

  /**
   * Get current optimization settings
   */
  public getSettings(): RenderingSettings {
    return { ...this.settings };
  }

  /**
   * Get current device configuration
   */
  public getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  /**
   * Get performance metrics history
   */
  public getPerformanceHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Apply progressive mesh loading strategy
   * @param meshData The mesh data to process
   * @returns Processed mesh data with LOD
   */
  public applyProgressiveMeshLoading(meshData: any): any {
    // Implementation would depend on the specific 3D format used
    // This is a placeholder for the concept
    
    if (!meshData) return null;
    
    // If LOD is enabled, process the mesh data accordingly
    if (this.settings.useLOD) {
      // For demonstration, just return the data with a flag
      return {
        ...meshData,
        processedForLOD: true,
        lodLevels: this.settings.meshDetail === 'low' ? 2 : 
                   this.settings.meshDetail === 'medium' ? 3 : 4
      };
    }
    
    return meshData;
  }

  /**
   * Apply texture compression based on current settings
   * @param textureData The texture data
   * @returns Processed texture data
   */
  public applyTextureCompression(textureData: any): any {
    // Implementation would depend on the specific texture format
    // This is a placeholder for the concept
    
    if (!textureData) return null;
    
    // Determine texture size based on quality settings
    const maxSize = this.settings.maxTextureSize;
    const useCompression = this.settings.useCompressedTextures;
    
    // For demonstration, just return the data with flags
    return {
      ...textureData,
      maxSize,
      compressed: useCompression,
      quality: this.settings.textureQuality
    };
  }

  /**
   * Optimize draw calls for the current device
   * @param drawCallsData The draw calls data
   * @returns Optimized draw calls
   */
  public optimizeDrawCalls(drawCallsData: any): any {
    // Implementation would depend on the specific rendering approach
    // This is a placeholder for the concept
    
    if (!drawCallsData) return null;
    
    // For demonstration, just return with max draw calls setting
    return {
      ...drawCallsData,
      maxDrawCalls: this.settings.maxDrawCalls,
      batchingEnabled: true
    };
  }

  /**
   * Set the adaptation mode (static or dynamic)
   */
  public setAdaptationMode(mode: 'static' | 'dynamic'): void {
    this.adaptationMode = mode;
    console.log(`Adaptation mode set to: ${mode}`);
  }
}

export default MobileOptimizationService;
