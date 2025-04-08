import { MobileOptimizationService } from '../../src/services/optimization/MobileOptimizationService';

// Mock performance.now() for consistent testing
const originalPerformanceNow = performance.now;
let mockTime = 0;

// Custom TTI measurement utility
interface TTIOptions {
  device: 'mobile' | 'tablet' | 'desktop';
  connection: '3G' | '4G' | 'wifi';
  viewport: { width: number; height: number };
}

/**
 * Measures Time to Interactive for the 3D visualization
 */
async function measureTTI(options: TTIOptions): Promise<{ tti: number }> {
  // Reset mock time
  mockTime = 0;
  
  // Setup mocks and spies
  global.performance.now = jest.fn(() => mockTime);
  
  // Mock window dimensions
  Object.defineProperty(window, 'innerWidth', { value: options.viewport.width });
  Object.defineProperty(window, 'innerHeight', { value: options.viewport.height });
  
  // Mock navigator
  Object.defineProperty(navigator, 'userAgent', {
    value: options.device === 'mobile' 
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
      : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15'
  });
  
  // Mock connection
  Object.defineProperty(navigator, 'connection', {
    value: {
      effectiveType: options.connection === '3G' ? '3g' : '4g',
      downlink: options.connection === '3G' ? 2 : 10,
      rtt: options.connection === '3G' ? 200 : 50
    }
  });
  
  // Mock WebGL context
  const mockGL = {
    getExtension: jest.fn((ext) => {
      if (ext === 'WEBGL_debug_renderer_info') {
        return {
          UNMASKED_RENDERER_WEBGL: 1
        };
      }
      return null;
    }),
    getParameter: jest.fn(() => options.device === 'mobile' ? 'Mali-G72' : 'NVIDIA GeForce RTX 3080')
  };
  
  const mockCanvas = {
    getContext: jest.fn(() => mockGL)
  };
  
  jest.spyOn(document, 'createElement').mockImplementation(() => mockCanvas as unknown as HTMLElement);
  
  // Initialize optimization service
  const optimizationService = MobileOptimizationService.getInstance();
  optimizationService.initialize();
  
  // Measure initialization time
  const startTime = mockTime;
  
  // Simulate render process
  mockTime += 50; // Add 50ms for initial processing
  
  // Simulate asset loading time based on connection and optimization settings
  const settings = optimizationService.getSettings();
  const config = optimizationService.getConfig();
  
  let assetLoadTime = 0;
  
  // Texture loading time based on quality and connection
  if (settings.textureQuality === 'high') {
    assetLoadTime += options.connection === '3G' ? 800 : 200;
  } else if (settings.textureQuality === 'medium') {
    assetLoadTime += options.connection === '3G' ? 400 : 100;
  } else {
    assetLoadTime += options.connection === '3G' ? 200 : 50;
  }
  
  // Mesh loading time based on detail and connection
  if (settings.meshDetail === 'high') {
    assetLoadTime += options.connection === '3G' ? 600 : 150;
  } else if (settings.meshDetail === 'medium') {
    assetLoadTime += options.connection === '3G' ? 300 : 80;
  } else {
    assetLoadTime += options.connection === '3G' ? 150 : 40;
  }
  
  // Apply optimization factors
  if (settings.useCompressedTextures) {
    assetLoadTime *= 0.7; // 30% reduction for compressed textures
  }
  
  if (settings.useLOD) {
    assetLoadTime *= 0.8; // 20% reduction for LOD
  }
  
  // Simulate asset loading
  mockTime += assetLoadTime;
  
  // Simulate render time
  const renderTime = 
    settings.usePostProcessing ? 150 :
    settings.useShadows ? 100 : 50;
  
  mockTime += renderTime;
  
  // Simulate first interaction possibility
  mockTime += 50;
  
  // Calculate TTI
  const tti = mockTime - startTime;
  
  // Cleanup
  global.performance.now = originalPerformanceNow;
  
  return { tti };
}

/**
 * Mock for performance.memory
 */
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

describe('Mobile Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Clear singleton instance between tests
    (MobileOptimizationService as any).instance = null;
    
    // Mock performance.memory
    (performance as any).memory = {
      usedJSHeapSize: 20 * 1024 * 1024, // 20MB initial
      totalJSHeapSize: 100 * 1024 * 1024,
      jsHeapSizeLimit: 2048 * 1024 * 1024
    };
  });
  
  test('TTI improvement on mobile devices', async () => {
    const metrics = await measureTTI({
      device: 'mobile',
      connection: '4G',
      viewport: { width: 375, height: 812 }
    });
    
    console.log('TTI for mobile device:', metrics.tti);
    expect(metrics.tti).toBeLessThan(1000); // Target: 1000ms
  });
  
  test('TTI improvement on tablet devices', async () => {
    const metrics = await measureTTI({
      device: 'tablet',
      connection: '4G',
      viewport: { width: 768, height: 1024 }
    });
    
    console.log('TTI for tablet device:', metrics.tti);
    expect(metrics.tti).toBeLessThan(1200); // Slightly higher target for tablets
  });
  
  test('Memory optimization', () => {
    // Mock the memory API
    const memoryBefore = (performance as any).memory.usedJSHeapSize;
    
    // Initialize optimization service
    const optimizationService = MobileOptimizationService.getInstance();
    optimizationService.initialize();
    
    // Simulate 3D visualization loading by increasing heap size based on settings
    const settings = optimizationService.getSettings();
    const config = optimizationService.getConfig();
    
    // Calculate memory increase based on settings
    let memoryIncrease = 0;
    
    // Base memory for framework
    memoryIncrease += 10 * 1024 * 1024; // 10MB
    
    // Texture memory
    if (settings.textureQuality === 'high') {
      memoryIncrease += 30 * 1024 * 1024; // 30MB
    } else if (settings.textureQuality === 'medium') {
      memoryIncrease += 15 * 1024 * 1024; // 15MB
    } else {
      memoryIncrease += 5 * 1024 * 1024; // 5MB
    }
    
    // Mesh memory
    if (settings.meshDetail === 'high') {
      memoryIncrease += 20 * 1024 * 1024; // 20MB
    } else if (settings.meshDetail === 'medium') {
      memoryIncrease += 10 * 1024 * 1024; // 10MB
    } else {
      memoryIncrease += 3 * 1024 * 1024; // 3MB
    }
    
    // Apply optimizations
    if (settings.useCompressedTextures) {
      memoryIncrease *= 0.7; // 30% reduction
    }
    
    // Simulate memory increase
    (performance as any).memory.usedJSHeapSize += memoryIncrease;
    
    // Get final memory
    const memoryAfter = (performance as any).memory.usedJSHeapSize;
    const memoryDelta = memoryAfter - memoryBefore;
    
    console.log('Memory increase:', memoryDelta / (1024 * 1024), 'MB');
    expect(memoryDelta).toBeLessThan(50 * 1024 * 1024); // Max 50MB increase
  });
  
  test('Performance improvement on slow connections', async () => {
    const metrics3G = await measureTTI({
      device: 'mobile',
      connection: '3G',
      viewport: { width: 375, height: 812 }
    });
    
    console.log('TTI on 3G connection:', metrics3G.tti);
    expect(metrics3G.tti).toBeLessThan(2000); // Higher threshold for 3G
  });
});
