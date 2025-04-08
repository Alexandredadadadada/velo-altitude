# Velo-Altitude Configuration Guide

This document provides comprehensive information about configuring the Velo-Altitude application, including environment variables, configuration guidelines, and security considerations.

## Table of Contents

1. [Environment Variables](#environment-variables)
2. [Service Configuration](#service-configuration)
3. [Security Best Practices](#security-best-practices)
4. [Feature Flags](#feature-flags)
5. [Configuration Files](#configuration-files)

## Environment Variables

Environment variables are the primary method for configuring Velo-Altitude. For a complete reference of all environment variables, see [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md).

### Loading Priority

Environment variables are loaded in the following order (later sources override earlier ones):

1. Default values (hardcoded in the application)
2. `.env` file in the project root
3. `.env.local` file (for local development)
4. `.env.development` or `.env.production` (environment-specific)
5. Netlify environment variables (for production)
6. Runtime environment variables

### Critical Variables

The following variables are critical and must be properly configured for the application to function:

#### Authentication (Auth0)
```
AUTH0_ISSUER_BASE_URL=https://velo-altitude.eu.auth0.com
AUTH0_CLIENT_ID=<your_client_id>
AUTH0_CLIENT_SECRET=<your_client_secret>
AUTH0_AUDIENCE=https://velo-altitude.com/api
AUTH0_SCOPE=openid profile email offline_access
AUTH0_SECRET=<random_string>
```

#### API Keys
```
OPENWEATHER_API_KEY=<your_api_key>
MAPBOX_TOKEN=<your_token>
OPENROUTE_API_KEY=<your_api_key>
```

#### Database and Caching
```
MONGODB_URI=<your_mongodb_connection_string>
MONGODB_DB_NAME=velo-altitude
REDIS_URL=<your_redis_url>
REDIS_PASSWORD=<your_redis_password>
```

## Service Configuration

### Weather Service

The Weather Service can be configured through several options:

#### Provider Configuration

```typescript
// src/config/weather-providers.ts
export const weatherProviders = {
  openWeather: {
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    apiKey: process.env.OPENWEATHER_API_KEY,
    isEnabled: true,
    priority: 1
  },
  windy: {
    baseUrl: 'https://api.windy.com',
    apiKey: process.env.WINDY_PLUGINS_API,
    isEnabled: true,
    priority: 2
  }
};
```

#### Cache Configuration

The WeatherCache service accepts configuration parameters:

```typescript
// Custom configuration example
const customConfig = {
  ttl: {
    current: 300,        // 5 minutes
    forecast: 1800,      // 30 minutes
    historical: 86400,   // 24 hours
    mountainPass: 1200   // 20 minutes
  },
  limits: {
    maxEntries: 2000,
    maxSize: 100 * 1024 * 1024  // 100MB
  },
  useRedis: true
};

// Initialize with custom config
import { WeatherCache } from '../services/cache/WeatherCache';
const cache = new WeatherCache(customConfig);
```

#### Rate Limiting Configuration

The rate limiter can be configured:

```typescript
// src/config/rate-limits.ts
export const rateLimitConfig = {
  weather: {
    tokensPerInterval: 60,  // Default 60 requests
    interval: 60,           // Per 60 seconds
    fireImmediately: false
  },
  elevation: {
    tokensPerInterval: 100, // Default 100 requests
    interval: 60,           // Per 60 seconds
    fireImmediately: false
  }
};
```

### Elevation Service

Configure the Elevation Service for multiple providers:

```typescript
// src/config/elevation-providers.ts
export const elevationProviders = {
  openRoute: {
    baseUrl: 'https://api.openrouteservice.org/elevation/line',
    apiKey: process.env.OPENROUTE_API_KEY,
    isEnabled: true,
    priority: 1
  },
  mapbox: {
    baseUrl: 'https://api.mapbox.com/v4/terrain-rgb',
    apiKey: process.env.MAPBOX_TOKEN,
    isEnabled: true,
    priority: 2
  }
};
```

### Monitoring Configuration

Tune the monitoring settings based on environment:

```typescript
// src/config/monitoring.ts
export const monitoringConfig = {
  enabled: process.env.NODE_ENV === 'production',
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  errorReporting: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === 'production'
  },
  metrics: {
    interval: 60000,  // 1 minute in ms
    detailed: process.env.NODE_ENV !== 'production'
  }
};
```

## Security Best Practices

### API Key Protection

API keys should be:

1. Stored only in environment variables, never in code
2. Different across environments (development, staging, production)
3. Rotated regularly (quarterly recommended)
4. Restricted by IP address and domain when the provider allows it

### JWT Security

For Auth0 JWT security:

1. Use appropriate token expiration times:
   - Access tokens: 1-24 hours (recommended: 2 hours)
   - Refresh tokens: 14-30 days
   
2. Implement proper token validation:
   - Verify the issuer (`iss` claim)
   - Validate the audience (`aud` claim)
   - Check token expiration (`exp` claim)
   - Verify signature using JWKS

3. Use token blacklisting for revocation scenarios:
   - Store revoked tokens in Redis with TTL
   - Check blacklist before allowing token use

### CORS Configuration

Configure appropriate CORS headers in `netlify.toml`:

```toml
[[headers]]
  for = "/api/*"
  [headers.values]
    Access-Control-Allow-Origin = "https://velo-altitude.com"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    Access-Control-Max-Age = "86400"
```

### Content Security Policy

Implement a strict Content Security Policy:

```
Content-Security-Policy: default-src 'self'; 
  script-src 'self' https://apis.google.com; 
  style-src 'self' https://fonts.googleapis.com; 
  img-src 'self' data: https://*.tile.openstreetmap.org; 
  font-src 'self' https://fonts.gstatic.com; 
  connect-src 'self' https://api.openweathermap.org https://api.mapbox.com https://*.eu.auth0.com;
```

### Database Security

For MongoDB security:

1. Use SSL/TLS for all connections
2. Implement IP allowlisting in MongoDB Atlas
3. Use separate database users for different environments
4. Apply principle of least privilege for database users

## Feature Flags

Velo-Altitude uses environment-based feature flags:

### Available Flags

```typescript
// src/config/feature-flags.ts
export const featureFlags = {
  enableWeatherCaching: true,
  enableRateLimiting: true,
  enableMultiProviderWeather: true,
  enableEnhanced3DVisualization: true,
  enableStravaIntegration: false,  // Coming soon
  enableOfflineSupport: false,     // Coming soon
};
```

### Flag Evaluation

```typescript
import { featureFlags } from '../config/feature-flags';

// Usage in code
if (featureFlags.enableMultiProviderWeather) {
  // Use multiple providers
} else {
  // Fallback to single provider
}
```

## Configuration Files

The following configuration files control application behavior:

### `netlify.toml`

Contains deployment configuration for Netlify, including:

- Build commands
- Publish directory
- Redirect rules
- Header configuration
- Function configuration

Example:

```toml
[build]
  command = "npm run build"
  publish = "build"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
```

### `.env.sample`

Template for local environment variables:

```
# API Keys
OPENWEATHER_API_KEY=
MAPBOX_TOKEN=
OPENROUTE_API_KEY=

# Auth0 Configuration
AUTH0_ISSUER_BASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_AUDIENCE=
AUTH0_SCOPE=openid profile email offline_access
AUTH0_SECRET=

# Database & Redis
MONGODB_URI=
MONGODB_DB_NAME=
REDIS_URL=
REDIS_PASSWORD=

# Application Settings
NODE_ENV=development
```

### `tsconfig.json`

TypeScript configuration:

```json
{
  "compilerOptions": {
    "target": "es6",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

## Environment-Specific Configuration

### Development

For local development:

1. Copy `.env.sample` to `.env.local`
2. Fill in required values
3. Start the application with `npm run dev`

### Production

For production deployment:

1. Configure all environment variables in Netlify
2. Set `NODE_ENV=production`
3. Enable optimizations like Brotli compression
