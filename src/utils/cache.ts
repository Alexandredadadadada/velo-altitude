export class CacheService {
  private cache: Map<string, { data: any, expiry: number }> = new Map();
  
  // Get data from cache
  get(key: string) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (cached.expiry < Date.now()) {
      this.remove(key);
      return null;
    }
    
    return cached.data;
  }
  
  // Store data in cache
  set(key: string, data: any, ttlSeconds: number = 300) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
  }
  
  // Remove data from cache
  remove(key: string): boolean {
    return this.cache.delete(key);
  }
  
  // Clear all cache
  clear() {
    this.cache.clear();
  }
  
  // Create a cached version of any async function
  cached<T>(fn: (...args: any[]) => Promise<T>, keyFn: (...args: any[]) => string, ttlSeconds: number = 300) {
    return async (...args: any[]): Promise<T> => {
      const cacheKey = keyFn(...args);
      const cached = this.get(cacheKey);
      if (cached) return cached;
      
      const result = await fn(...args);
      this.set(cacheKey, result, ttlSeconds);
      return result;
    };
  }
}
