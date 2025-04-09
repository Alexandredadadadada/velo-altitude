# API Monitoring in Velo-Altitude

## Overview

The Velo-Altitude application uses a comprehensive monitoring system to track API usage, performance, and fallback mechanisms. This document describes how the monitoring system works, what metrics are tracked, and how to interpret and respond to alerts.

## API Metrics Service

The API Metrics Service is responsible for tracking detailed metrics for all external API calls in the application. It captures:

- API usage rates
- Response times
- Fallback rates
- Error counts per service

### Core Services Monitored

| Service | Type | Role | Rate Limits |
|---------|------|------|------------|
| OpenWeather | Weather | Primary | 60 requests/minute |
| Windy | Weather | Fallback | 1000 requests/day |
| Mapbox | Mapping | Primary | Depends on plan |
| OpenRoute | Routing | Primary | Depends on plan |
| Claude | AI | Primary | Varies by plan |
| OpenAI | AI | Fallback | Varies by plan |

## Alert Thresholds

The monitoring system has configurable thresholds that trigger alerts when exceeded:

| Metric | Default Threshold | Description |
|--------|-------------------|-------------|
| Rate Limit Warning | 20% | Triggers when only 20% of rate limit remains |
| Fallback Rate Warning | 30% | Triggers when fallback usage exceeds 30% |
| Response Time Warning | 500ms | Triggers when average response time exceeds 500ms |
| Error Rate Warning | 5% | Triggers when error rate exceeds 5% |

Services can have custom thresholds configured according to their specific characteristics.

## Monitoring Dashboard

A monitoring dashboard is available at `/admin/api-metrics` which displays:

1. Overall API health status for each service
2. Usage statistics (calls per hour/day)
3. Average response times
4. Error rates
5. Fallback usage rates
6. Rate limit status

## Fallback Mechanism

The application implements automatic fallback between services:

1. **Weather Services**: OpenWeather (Primary) → Windy (Fallback)
2. **AI Services**: Claude (Primary) → OpenAI (Fallback)

Fallbacks are triggered in these scenarios:
- Primary API rate limit is exceeded
- Primary API returns an error
- Primary API response time exceeds the configured threshold
- Primary API is explicitly marked as unavailable

## Health Status

Each service can be in one of three health states:

- **Healthy**: Service is operating normally
- **Degraded**: Service is experiencing some issues but is still usable
- **Unhealthy**: Service is not functioning correctly

## Responding to Alerts

### Rate Limit Warnings

When a rate limit warning is triggered:

1. Check the current usage patterns to identify if there's a spike in traffic
2. Consider implementing additional caching for the affected service
3. If persistent, consider upgrading the API service plan

### High Fallback Rates

When fallback rate warnings are triggered:

1. Check the health status of the primary service
2. Review error logs to identify patterns or systematic issues
3. Verify API keys and service configuration
4. Contact the service provider if issues persist

### Response Time Warnings

When response time warnings are triggered:

1. Check for network connectivity issues
2. Review recent changes that might affect API call performance
3. Verify the service is not throttling due to high usage
4. Implement additional caching if appropriate

### Error Rate Warnings

When error rate warnings are triggered:

1. Check error logs for detailed error messages
2. Verify API endpoints and authentication credentials
3. Test API endpoints directly to confirm they are operational
4. Update API implementation if the service has changed

## Implementation

### How to Use the API Metrics Service

```typescript
import apiMetricsService from '../../monitoring/api-metrics';

// Track an API call
apiMetricsService.trackAPICall(
  'openweather', // service name
  '/data/2.5/weather', // endpoint
  150, // response time in ms
  true, // success
  { location: 'London', params: { lat: 51.5074, lon: -0.1278 } } // metadata
);

// Track when a fallback service is used
apiMetricsService.trackFallbackUsage(
  'openweather', // primary service
  'windy', // fallback service
  'rate_limit_exceeded', // reason
  { location: 'London' } // metadata
);

// Track rate limit status
apiMetricsService.trackRateLimit(
  'openweather', // service
  60, // limit
  45, // remaining
  Date.now() + (60 * 60 * 1000) // reset time (optional)
);

// Track API error
apiMetricsService.trackAPIError(
  'openweather', // service
  '/data/2.5/weather', // endpoint
  new Error('API returned 503'), // error
  { location: 'London' } // metadata
);

// Get metrics for a specific service
const metrics = apiMetricsService.getAPIMetrics('openweather');
console.log(metrics.fallbackRate); // Percentage of calls that used fallback

// Get a dashboard of all API metrics
const dashboard = apiMetricsService.getDashboard();
```

## Alert Notifications

Alerts are logged to the monitoring dashboard and can also be configured to:

1. Send email notifications to the development team
2. Post to a Slack channel
3. Generate entries in the monitoring logs
4. Create incidents in the incident tracking system

## Testing

Integration tests have been implemented to verify:

1. Proper metric collection for API calls
2. Correct implementation of fallback mechanisms
3. Accurate rate limit tracking
4. Alert threshold functionality

Tests are located in the following directories:
- `/tests/integration/WeatherFallback.test.ts`
- `/tests/integration/AIFallback.test.ts`

## Contributing

When adding new API services to the application:

1. Register the service with the API Metrics Service
2. Define appropriate thresholds for the service
3. Implement fallback mechanisms where appropriate
4. Add tests to verify fallback behavior

```typescript
// Registering a new API service
apiMetricsService.registerAPIService({
  name: 'new-service',
  isPrimary: true,
  thresholds: {
    rateLimitWarning: 15,
    responseTimeWarning: 700
  }
});
```
