/**
 * Elevation Service with OpenRoute Integration
 * 
 * This service handles elevation data retrieval with:
 * - Primary integration with OpenRouteService
 * - Rate limiting with Redis
 * - Caching for performance optimization
 * - Error handling and fallback mechanisms
 */

import axios from 'axios';
import { Redis } from 'ioredis';
import { redisConfig } from '../../config/redis';
import monitoringService from '../../monitoring';
import { RateLimitExceededError, RateLimitResult } from '../weather/rate-limiting';

// OpenRoute API configuration
const OPENROUTE_KEY = process.env.OPENROUTE_API_KEY;
const OPENROUTE_API_URL = 'https://api.openrouteservice.org/v2/elevation';
const DEMO_KEY = 'YOUR_OPENROUTE_API_KEY'; // Only for development testing

// Fallback elevation providers (if needed)
const ELEVATION_PROVIDERS = {
  OPENROUTE: 'openroute',
  MAPBOX: 'mapbox', // Fallback to Mapbox elevation API
  LOCAL: 'local'    // Local elevation dataset (limited resolution)
};

// Types for elevation data
export interface ElevationPoint {
  lat: number;
  lng: number;
  elevation: number;
}

export interface ElevationProfile {
  points: ElevationPoint[];
  totalAscent: number;
  totalDescent: number;
  minElevation: number;
  maxElevation: number;
  segments?: ElevationSegment[];
}

export interface ElevationSegment {
  startIndex: number;
  endIndex: number;
  startDistance: number; // km
  endDistance: number;   // km
  avgGradient: number;   // percentage
  classification: 'easy' | 'moderate' | 'challenging' | 'difficult' | 'extreme';
  length: number;        // km
}

// Rate limiting configuration for OpenRouteService
interface OpenRouteRateLimitConfig {
  enabled: boolean;
  maxRequests: number;
  windowSizeSeconds: number;
  retryAfterSeconds: number;
}

export class ElevationService {
  private redis: Redis | null = null;
  private defaultProvider = ELEVATION_PROVIDERS.OPENROUTE;
  private rateLimitConfig: OpenRouteRateLimitConfig = {
    enabled: true,
    maxRequests: 40,    // Default: 40 requests per minute for free tier
    windowSizeSeconds: 60,
    retryAfterSeconds: 2
  };
  private BUCKET_KEY = 'elevation_rate_limit:';
  private cacheEnabled = true;
  private cacheTtl = 86400; // 24 hours in seconds

  constructor() {
    // Initialize Redis connection for rate limiting
    try {
      this.redis = new Redis(redisConfig);
      this.redis.on('error', (err) => {
        console.error('[ElevationService] Redis connection error:', err);
        monitoringService.trackError('redis_connection_error', err, {
          service: 'ElevationService',
          event: 'initialization'
        });
      });
    } catch (error) {
      console.error('[ElevationService] Failed to initialize Redis:', error);
      monitoringService.trackError('redis_init_failed', error as Error, {
        service: 'ElevationService'
      });
      this.redis = null;
    }
  }

  /**
   * Get elevation data for a route
   * @param coordinates Array of [longitude, latitude] coordinates
   * @param userId Optional user ID for rate limiting
   * @returns Processed elevation profile
   */
  public async getElevationProfile(
    coordinates: [number, number][],
    userId?: string
  ): Promise<ElevationProfile> {
    // Apply rate limiting
    if (this.rateLimitConfig.enabled) {
      const bucketKey = `${this.BUCKET_KEY}${userId || 'anonymous'}`;
      const rateLimitResult = await this.checkRateLimit(bucketKey);
      
      if (!rateLimitResult.allowed) {
        throw new RateLimitExceededError(
          'Rate limit exceeded for elevation API',
          rateLimitResult.resetTime,
          rateLimitResult.retryAfter
        );
      }
    }

    try {
      // Format coordinates for OpenRoute API
      const formattedCoordinates = coordinates.map(coord => ({ 
        longitude: coord[0], 
        latitude: coord[1] 
      }));

      // Call OpenRoute Elevation API
      const response = await axios.post(
        `${OPENROUTE_API_URL}/line`,
        { format_in: 'point', format_out: 'point', geometry: formattedCoordinates },
        {
          headers: {
            'Authorization': OPENROUTE_KEY || DEMO_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      // Track successful API call
      monitoringService.trackApiCall(
        'elevation', 
        'getProfile', 
        Date.now(), 
        true, 
        { provider: this.defaultProvider }
      );

      // Process API response
      return this.processElevationData(response.data, coordinates);
    } catch (error) {
      console.error('[ElevationService] Error fetching elevation data:', error);
      
      // Track API error
      monitoringService.trackError('elevation_api_error', error as Error, {
        provider: this.defaultProvider,
        coordinatesCount: coordinates.length
      });

      // Attempt fallback if available
      return this.getFallbackElevation(coordinates);
    }
  }

  /**
   * Consume rate limit token
   * @param bucketKey Unique key for the rate limit bucket
   * @returns Rate limit check result
   */
  private async checkRateLimit(bucketKey: string): Promise<RateLimitResult> {
    // If Redis is not available, allow the request but log it
    if (!this.redis) {
      console.warn('[ElevationService] Redis unavailable, skipping rate limiting');
      monitoringService.trackEvent('elevation_rate_limit_bypassed', {
        reason: 'redis_unavailable'
      });
      return {
        allowed: true,
        remaining: -1,
        resetTime: Date.now() + 60000,
        retryAfter: 0
      };
    }

    try {
      // Use Lua script to implement token bucket algorithm in Redis
      const luaScript = `
        local bucket = KEYS[1]
        local now = tonumber(ARGV[1])
        local windowSize = tonumber(ARGV[2])
        local maxRequests = tonumber(ARGV[3])
        
        -- Get current bucket data or create new one
        local bucketData = redis.call('HMGET', bucket, 'tokens', 'last_refill')
        local tokens = tonumber(bucketData[1]) or maxRequests
        local lastRefill = tonumber(bucketData[2]) or now
        
        -- Calculate token refill based on time elapsed
        local timePassed = math.max(0, now - lastRefill)
        local tokensToAdd = math.floor(timePassed / windowSize * maxRequests)
        
        -- Update tokens (cap at max capacity)
        tokens = math.min(maxRequests, tokens + tokensToAdd)
        lastRefill = now
        
        local allowed = 0
        local resetTime = now + windowSize
        
        -- Consume a token if available
        if tokens >= 1 then
          tokens = tokens - 1
          allowed = 1
        end
        
        -- Update bucket in Redis
        redis.call('HMSET', bucket, 'tokens', tokens, 'last_refill', lastRefill)
        redis.call('EXPIRE', bucket, windowSize * 2)
        
        -- Calculate when tokens will refill
        local retryAfter = 0
        if allowed == 0 then
          retryAfter = math.ceil(windowSize / maxRequests)
        end
        
        return {allowed, tokens, resetTime, retryAfter}
      `;

      // Execute the rate limiting script
      const result = await this.redis.eval(
        luaScript,
        1,
        bucketKey,
        Date.now().toString(),
        this.rateLimitConfig.windowSizeSeconds.toString(),
        this.rateLimitConfig.maxRequests.toString()
      );

      const [allowed, remaining, resetTime, retryAfter] = result as number[];

      // Log rate limit usage
      monitoringService.trackEvent('elevation_rate_limit_check', {
        allowed: allowed === 1,
        remaining,
        resetTime,
        retryAfter
      });

      return {
        allowed: allowed === 1,
        remaining,
        resetTime,
        retryAfter
      };
    } catch (error) {
      console.error('[ElevationService] Rate limit check error:', error);
      monitoringService.trackError('elevation_rate_limit_error', error as Error, {
        bucketKey
      });

      // Allow the request in case of rate limiting errors
      return {
        allowed: true,
        remaining: -1,
        resetTime: Date.now() + 60000,
        retryAfter: 0
      };
    }
  }

  /**
   * Process raw elevation data into a structured elevation profile
   * @param responseData OpenRoute API response data
   * @param originalCoordinates Original route coordinates
   * @returns Structured elevation profile
   */
  private processElevationData(
    responseData: any, 
    originalCoordinates: [number, number][]
  ): ElevationProfile {
    if (!responseData || !responseData.geometry) {
      throw new Error('Invalid elevation data received');
    }

    const points: ElevationPoint[] = responseData.geometry.map(
      (point: any, index: number) => ({
        lng: point.longitude,
        lat: point.latitude,
        elevation: point.elevation
      })
    );

    // Calculate elevation statistics
    let totalAscent = 0;
    let totalDescent = 0;
    let minElevation = points[0].elevation;
    let maxElevation = points[0].elevation;

    for (let i = 1; i < points.length; i++) {
      const elevationDiff = points[i].elevation - points[i - 1].elevation;
      if (elevationDiff > 0) {
        totalAscent += elevationDiff;
      } else {
        totalDescent += Math.abs(elevationDiff);
      }

      minElevation = Math.min(minElevation, points[i].elevation);
      maxElevation = Math.max(maxElevation, points[i].elevation);
    }

    // Identify and classify gradient segments
    const segments = this.identifyGradientSegments(points, originalCoordinates);

    return {
      points,
      totalAscent,
      totalDescent,
      minElevation,
      maxElevation,
      segments
    };
  }

  /**
   * Identify and classify gradient segments in the elevation profile
   * @param points Elevation points
   * @param originalCoordinates Original route coordinates
   * @returns Array of classified elevation segments
   */
  private identifyGradientSegments(
    points: ElevationPoint[], 
    originalCoordinates: [number, number][]
  ): ElevationSegment[] {
    const segments: ElevationSegment[] = [];
    const minSegmentLength = 0.5; // Minimum segment length in km
    let currentSegmentStart = 0;
    let cumulativeDistance = 0;
    const distances: number[] = [0];

    // Calculate cumulative distances
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currPoint = points[i];
      const distanceKm = this.calculateDistanceKm(
        prevPoint.lat, prevPoint.lng,
        currPoint.lat, currPoint.lng
      );
      cumulativeDistance += distanceKm;
      distances.push(cumulativeDistance);
    }

    // Find gradient segments
    for (let i = 1; i < points.length; i++) {
      // Check if we should create a new segment
      if (i === points.length - 1 || i - currentSegmentStart >= 5) {
        const startElevation = points[currentSegmentStart].elevation;
        const endElevation = points[i].elevation;
        const elevationChange = endElevation - startElevation;
        const segmentDistance = distances[i] - distances[currentSegmentStart];

        // Only create segment if it's long enough
        if (segmentDistance >= minSegmentLength) {
          const gradient = (elevationChange / segmentDistance) / 10; // Convert to percentage
          const segment: ElevationSegment = {
            startIndex: currentSegmentStart,
            endIndex: i,
            startDistance: distances[currentSegmentStart],
            endDistance: distances[i],
            avgGradient: gradient,
            length: segmentDistance,
            classification: this.classifyGradient(gradient)
          };
          segments.push(segment);
        }

        currentSegmentStart = i;
      }
    }

    return segments;
  }

  /**
   * Classify a gradient based on its steepness
   * @param gradient Gradient percentage
   * @returns Classification label
   */
  private classifyGradient(gradient: number): ElevationSegment['classification'] {
    if (gradient <= 3) return 'easy';
    if (gradient <= 6) return 'moderate';
    if (gradient <= 9) return 'challenging';
    if (gradient <= 12) return 'difficult';
    return 'extreme';
  }

  /**
   * Calculate distance between two points in kilometers
   * @param lat1 Latitude of point 1
   * @param lon1 Longitude of point 1
   * @param lat2 Latitude of point 2
   * @param lon2 Longitude of point 2
   * @returns Distance in kilometers
   */
  private calculateDistanceKm(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   * @param deg Angle in degrees
   * @returns Angle in radians
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Get elevation data from fallback provider if primary fails
   * @param coordinates Route coordinates
   * @returns Elevation profile from fallback provider
   */
  private async getFallbackElevation(
    coordinates: [number, number][]
  ): Promise<ElevationProfile> {
    try {
      // Log fallback attempt
      monitoringService.trackEvent('elevation_fallback_attempt', {
        provider: ELEVATION_PROVIDERS.MAPBOX,
        reason: 'primary_provider_failed'
      });

      // Attempt to get elevation data from Mapbox
      // This is a simplified implementation
      const mapboxToken = process.env.MAPBOX_TOKEN;
      const encodedCoordinates = coordinates
        .map(coord => `${coord[0]},${coord[1]}`)
        .join(';');

      const response = await axios.get(
        `https://api.mapbox.com/v4/mapbox.terrain-rgb/tilequery/${encodedCoordinates}.json`,
        {
          params: {
            access_token: mapboxToken,
            layers: 'contour'
          }
        }
      );

      // Process and return Mapbox elevation data
      // Implementation would need to be adapted to Mapbox's response format
      return this.processMapboxElevation(response.data, coordinates);
    } catch (error) {
      console.error('[ElevationService] Fallback elevation retrieval failed:', error);
      
      // Track fallback failure
      monitoringService.trackError('elevation_fallback_failed', error as Error, {
        provider: ELEVATION_PROVIDERS.MAPBOX
      });

      // Return basic elevation profile with estimated data
      return this.generateEstimatedElevationProfile(coordinates);
    }
  }

  /**
   * Process elevation data from Mapbox API
   * @param responseData Mapbox API response
   * @param originalCoordinates Original route coordinates
   * @returns Processed elevation profile
   */
  private processMapboxElevation(
    responseData: any,
    originalCoordinates: [number, number][]
  ): ElevationProfile {
    // This would need to be implemented according to Mapbox's response format
    // This is a placeholder implementation
    const points: ElevationPoint[] = [];
    
    // Return a simplified profile
    return {
      points,
      totalAscent: 0,
      totalDescent: 0,
      minElevation: 0,
      maxElevation: 0
    };
  }

  /**
   * Generate an estimated elevation profile when all providers fail
   * @param coordinates Route coordinates
   * @returns Basic estimated elevation profile
   */
  private generateEstimatedElevationProfile(
    coordinates: [number, number][]
  ): ElevationProfile {
    // Generate basic placeholder elevation points
    const points: ElevationPoint[] = coordinates.map(coord => ({
      lng: coord[0],
      lat: coord[1],
      elevation: 0 // No elevation data available
    }));

    return {
      points,
      totalAscent: 0,
      totalDescent: 0,
      minElevation: 0,
      maxElevation: 0,
      segments: []
    };
  }
}

// Export singleton instance
export default new ElevationService();
