# Velo-Altitude Environment Variables

This document provides a comprehensive guide to all environment variables used in the Velo-Altitude application. These variables configure various aspects of the application, from API connections to caching and security settings.

## Configuration Categories

- [API Keys](#api-keys)
- [Database Configuration](#database-configuration)
- [Redis Configuration](#redis-configuration)
- [Auth0 Configuration](#auth0-configuration)
- [Application Settings](#application-settings)
- [React Application Variables](#react-application-variables)
- [Optimization Settings](#optimization-settings)
- [Security Settings](#security-settings)

## API Keys

### `OPENWEATHER_API_KEY`
- **Description**: API key for OpenWeather service
- **Required**: Yes, for weather functionality
- **Format**: String
- **Example**: `abcdef1234567890abcdef1234567890`

### `MAPBOX_TOKEN`
- **Description**: Token for MapBox services (maps and elevation data)
- **Required**: Yes, for map and elevation functionality
- **Format**: String
- **Example**: `pk.eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### `OPENROUTE_API_KEY`
- **Description**: API key for OpenRoute service (routing and elevation)
- **Required**: Yes, for elevation profiles
- **Format**: String
- **Example**: `5b3ce3xxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### `WINDY_PLUGINS_API`
- **Description**: API key for Windy plugins and weather data
- **Required**: No, used as fallback for weather data
- **Format**: String

### `STRAVA_CLIENT_ID`
- **Description**: Client ID for Strava API integration
- **Required**: Only for Strava integration
- **Format**: String
- **Example**: `12345`

### `STRAVA_CLIENT_SECRET`
- **Description**: Client secret for Strava API integration
- **Required**: Only for Strava integration
- **Format**: String

### `STRAVA_ACCESS_TOKEN`
- **Description**: Access token for Strava API calls
- **Required**: Only for automated Strava connectivity
- **Format**: String

### `STRAVA_REFRESH_TOKEN`
- **Description**: Refresh token for Strava API calls
- **Required**: Only for automated Strava connectivity
- **Format**: String

## Database Configuration

### `MONGODB_URI`
- **Description**: Connection URI for MongoDB database
- **Required**: Yes, for all database operations
- **Format**: String
- **Example**: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

### `MONGODB_DB_NAME`
- **Description**: Name of the MongoDB database to use
- **Required**: Yes, for all database operations
- **Format**: String
- **Example**: `velo-altitude-production`

## Redis Configuration

### `REDIS_URL`
- **Description**: URL for Redis connection including port
- **Required**: For caching and rate limiting
- **Format**: String
- **Example**: `redis://redis-hostname:6379`

### `REDIS_PASSWORD`
- **Description**: Password for Redis connection
- **Required**: For secured Redis instances
- **Format**: String

## Auth0 Configuration

### `AUTH0_AUDIENCE`
- **Description**: API audience identifier for Auth0
- **Required**: Yes, for authentication
- **Format**: String
- **Example**: `https://api.velo-altitude.com`

### `AUTH0_BASE_URL`
- **Description**: Base URL of your application (for callbacks)
- **Required**: Yes, for authentication
- **Format**: String
- **Example**: `https://velo-altitude.com`

### `AUTH0_CLIENT_ID`
- **Description**: Client ID from Auth0 application settings
- **Required**: Yes, for authentication
- **Format**: String

### `AUTH0_CLIENT_SECRET`
- **Description**: Client secret from Auth0 application settings
- **Required**: Yes, for authentication
- **Format**: String

### `AUTH0_ISSUER_BASE_URL`
- **Description**: Auth0 domain URL
- **Required**: Yes, for authentication
- **Format**: String
- **Example**: `https://velo-altitude.auth0.com`

### `AUTH0_SCOPE`
- **Description**: Requested scopes for Auth0 tokens
- **Required**: Yes, for authentication
- **Format**: String
- **Example**: `openid profile email offline_access`

### `AUTH0_SECRET`
- **Description**: Secret used to encrypt session cookies
- **Required**: Yes, for authentication
- **Format**: String, at least 32 characters
- **Example**: Generate a strong random string

## Application Settings

### `NODE_ENV`
- **Description**: Application environment
- **Required**: Yes
- **Format**: String
- **Allowed Values**: `development`, `production`, `test`
- **Default**: `development`

### `SESSION_SECRET`
- **Description**: Secret used for session cookie signing
- **Required**: Yes, for security
- **Format**: String (random, high-entropy)

### `API_KEYS_ENCRYPTION_KEY`
- **Description**: Key used to encrypt sensitive API keys in database
- **Required**: Yes, for secure key storage
- **Format**: String (32 characters for AES-256)

## React Application Variables

### `REACT_APP_API_URL`
- **Description**: URL of the backend API
- **Required**: Yes, for frontend API calls
- **Format**: String
- **Example**: `https://velo-altitude.com/api`

### `REACT_APP_BASE_URL`
- **Description**: Base URL of the application
- **Required**: Yes, for various frontend operations
- **Format**: String
- **Example**: `https://velo-altitude.com`

### `REACT_APP_BRAND_NAME`
- **Description**: Displayed brand name
- **Required**: No
- **Format**: String
- **Default**: `Velo-Altitude`

### `REACT_APP_ENABLE_ANALYTICS`
- **Description**: Flag to enable/disable analytics
- **Required**: No
- **Format**: Boolean string
- **Default**: `true`

### `REACT_APP_VERSION`
- **Description**: Application version for display and versioning
- **Required**: No
- **Format**: Semantic version string
- **Example**: `1.0.0`

## Optimization Settings

### `ENABLE_BROTLI_COMPRESSION`
- **Description**: Enable Brotli compression for static assets
- **Required**: No
- **Format**: Boolean string
- **Default**: `true`

### `ASSET_CACHE_MAX_AGE`
- **Description**: Max age for static asset caching (in seconds)
- **Required**: No
- **Format**: Number
- **Default**: `31536000` (1 year)

## Setting Up Environment Variables

### Local Development

For local development, create a `.env.local` file in the project root with required variables. Example:

```
MONGODB_URI=mongodb://localhost:27017/velo-altitude
REACT_APP_API_URL=http://localhost:3000/api
NODE_ENV=development
```

### Production Deployment (Netlify)

For production, set environment variables in the Netlify dashboard:

1. Go to Site settings > Build & deploy > Environment
2. Add each variable needed for production

### Environment Variable Best Practices

1. **Never commit secrets to version control**: Keep `.env.local` in `.gitignore`
2. **Use different values for development/production**: Create separate configurations
3. **Rotate secrets regularly**: Update API keys and secrets periodically
4. **Use minimum required permissions**: Don't use admin keys in production

## Troubleshooting

### Common Issues

#### "API Key Invalid" Errors
- Verify the API keys are correctly set and not expired
- Check for correct capitalization and formatting

#### Redis Connection Errors
- Ensure REDIS_URL is correctly formatted with protocol (redis:// or rediss://)
- Verify REDIS_PASSWORD is correct

#### Auth0 Authentication Problems
- Ensure all Auth0 variables are set correctly
- Verify allowed callback URLs in Auth0 dashboard match application URLs

## Required Variables by Environment

### Minimum Required for Development
```
MONGODB_URI
NODE_ENV=development
REACT_APP_API_URL
OPENWEATHER_API_KEY
MAPBOX_TOKEN
```

### Additional Variables for Production
```
REDIS_URL
REDIS_PASSWORD
AUTH0_* (all Auth0 variables)
SESSION_SECRET
ENABLE_BROTLI_COMPRESSION=true
```
