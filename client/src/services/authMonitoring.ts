/**
 * @file Authentication Monitoring Service
 * @description Monitors authentication events and errors, sending telemetry to the server
 * and providing alerts for suspicious authentication patterns.
 * 
 * @version 1.0.0
 */

import api from '../config/apiConfig';

// Types of events to monitor
export enum AuthEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  TOKEN_REFRESH_SUCCESS = 'token_refresh_success',
  TOKEN_REFRESH_FAILURE = 'token_refresh_failure',
  LOGOUT = 'logout',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'unauthorized_access_attempt',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity'
}

// Interface for auth events
interface AuthEvent {
  type: AuthEventType;
  timestamp: number;
  details?: Record<string, any>;
  userId?: string;
  error?: string;
}

// Cache to prevent flooding the server with events
const eventCache: Record<string, number> = {};
const EVENT_RATE_LIMIT_MS = 60000; // 1 minute

/**
 * Records an authentication event and sends it to the monitoring endpoint
 * Implements rate limiting to prevent flooding the server
 * 
 * @param eventType Type of authentication event
 * @param details Optional additional details about the event
 * @param userId Optional user ID associated with the event
 * @param error Optional error information
 */
export const recordAuthEvent = async (
  eventType: AuthEventType,
  details: Record<string, any> = {},
  userId?: string,
  error?: Error | string
): Promise<void> => {
  try {
    // Construct the event
    const event: AuthEvent = {
      type: eventType,
      timestamp: Date.now(),
      details,
      userId
    };
    
    // Add error information if present
    if (error) {
      event.error = error instanceof Error ? error.message : error;
    }
    
    // Check rate limiting
    const cacheKey = `${eventType}_${userId || 'anonymous'}`;
    const lastEventTime = eventCache[cacheKey] || 0;
    const currentTime = Date.now();
    
    // Only send if we're not rate limited
    if (currentTime - lastEventTime > EVENT_RATE_LIMIT_MS) {
      // Update cache
      eventCache[cacheKey] = currentTime;
      
      // Send event to the monitoring endpoint
      await api.post('/monitoring/auth-events', event);
      
      // For critical events, log them immediately
      if (eventType === AuthEventType.SUSPICIOUS_ACTIVITY || 
          eventType === AuthEventType.LOGIN_FAILURE) {
        console.warn(`[AUTH-MONITORING] Critical auth event: ${eventType}`, event);
      }
    }
  } catch (e) {
    // Don't let monitoring failures affect the application
    console.error('[AUTH-MONITORING] Failed to record auth event:', e);
  }
};

/**
 * Checks if a token refresh pattern is suspicious (too many failures in a short time)
 * 
 * @param userId User ID to check
 * @returns True if the pattern is suspicious
 */
export const isSuspiciousTokenRefreshPattern = (userId: string): boolean => {
  const cacheKey = `${AuthEventType.TOKEN_REFRESH_FAILURE}_${userId}`;
  const failureCount = sessionStorage.getItem(cacheKey);
  
  if (failureCount && parseInt(failureCount, 10) > 5) {
    return true;
  }
  
  return false;
};

/**
 * Increments the count of token refresh failures for a user
 * 
 * @param userId User ID
 */
export const recordTokenRefreshFailure = (userId: string): void => {
  const cacheKey = `${AuthEventType.TOKEN_REFRESH_FAILURE}_${userId}`;
  const currentCount = sessionStorage.getItem(cacheKey) || '0';
  const newCount = parseInt(currentCount, 10) + 1;
  
  sessionStorage.setItem(cacheKey, newCount.toString());
  
  // Check if pattern is now suspicious
  if (newCount > 5) {
    recordAuthEvent(
      AuthEventType.SUSPICIOUS_ACTIVITY,
      { reason: 'excessive_token_refresh_failures' },
      userId
    );
  }
};

/**
 * Resets the count of token refresh failures for a user
 * 
 * @param userId User ID
 */
export const resetTokenRefreshFailures = (userId: string): void => {
  const cacheKey = `${AuthEventType.TOKEN_REFRESH_FAILURE}_${userId}`;
  sessionStorage.removeItem(cacheKey);
};

export default {
  recordAuthEvent,
  isSuspiciousTokenRefreshPattern,
  recordTokenRefreshFailure,
  resetTokenRefreshFailures,
  AuthEventType
};
