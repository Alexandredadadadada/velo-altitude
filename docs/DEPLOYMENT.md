# Deployment Guide for Velo-Altitude

This document outlines the deployment process for the Velo-Altitude application on Netlify, including environment setup, verification steps, and best practices.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Deployment Process](#deployment-process)
3. [Environment Setup](#environment-setup)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Rollback Procedures](#rollback-procedures)
6. [Performance Optimization](#performance-optimization)
7. [Continuous Integration](#continuous-integration)

## Prerequisites

Before deploying, ensure you have:

- Access to the Velo-Altitude GitHub repository
- Netlify account with admin access to the Velo-Altitude site
- All required API keys and credentials (see [Environment Variables](./ENVIRONMENT_VARIABLES.md))
- Auth0 configuration completed (see [Auth0 Setup](./AUTH0_SETUP.md))

## Deployment Process

### GitHub Integration Deployment

Velo-Altitude uses Netlify's GitHub integration for continuous deployment:

1. **Code Push**:
   - Push changes to the `main` branch for production deployment
   - Pull requests automatically generate preview deployments

2. **Build Process**:
   - Netlify automatically detects new commits and initiates the build
   - Build command: `npm run build`
   - Publish directory: `build`

3. **Deployment**:
   - Successful builds are automatically deployed to production
   - Failed builds trigger notifications to the development team

### Manual Deployment

For emergency deployments outside the normal workflow:

1. Log in to the [Netlify Dashboard](https://app.netlify.com)
2. Navigate to the Velo-Altitude site
3. Go to **Deploys** > **Trigger deploy** > **Deploy site**
4. Monitor the deploy logs for any issues

## Environment Setup

### Environment Variables

All required environment variables must be configured in Netlify before deployment:

1. Navigate to **Site settings** > **Build & deploy** > **Environment**
2. Configure the following categories of variables:

#### API Keys
- `OPENWEATHER_API_KEY`
- `MAPBOX_TOKEN`
- `OPENROUTE_API_KEY`
- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `STRAVA_ACCESS_TOKEN`
- `STRAVA_REFRESH_TOKEN`
- `WINDY_PLUGINS_API`

#### Application Configuration
- `REACT_APP_API_URL=https://velo-altitude.com/api`
- `REACT_APP_BASE_URL=https://velo-altitude.com`
- `REACT_APP_BRAND_NAME=Velo-Altitude`
- `REACT_APP_VERSION=1.0.0`
- `REACT_APP_ENABLE_ANALYTICS=true`

#### Database & Caching
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `REDIS_URL`
- `REDIS_PASSWORD`

#### Authentication (Auth0)
- `AUTH0_AUDIENCE=https://velo-altitude.com/api`
- `AUTH0_BASE_URL=https://velo-altitude.com`
- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `AUTH0_ISSUER_BASE_URL=https://velo-altitude.eu.auth0.com`
- `AUTH0_SCOPE=openid profile email offline_access`
- `AUTH0_SECRET`

#### Security
- `API_KEYS_ENCRYPTION_KEY`
- `SESSION_SECRET`

#### Build Optimization
- `NODE_ENV=production`
- `ENABLE_BROTLI_COMPRESSION=true`
- `ASSET_CACHE_MAX_AGE=31536000`

### Custom Headers

Configure security headers in `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Content-Security-Policy = "default-src 'self'; script-src 'self' https://apis.google.com; style-src 'self' https://fonts.googleapis.com; img-src 'self' data: https://*.tile.openstreetmap.org; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.openweathermap.org https://api.mapbox.com https://*.eu.auth0.com;"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Feature-Policy = "camera 'none'; microphone 'none'; geolocation 'self'"
```

### Build Plugins

Enable the following Netlify build plugins:

1. **Netlify Cache**:
   - Caches node_modules to speed up builds

2. **Bundle Analyzer**:
   - Analyzes bundle size and composition
   - Alerts on significant size increases

3. **Compression**:
   - Enables Brotli compression for static assets

## Post-Deployment Verification

After each deployment, perform these verification steps:

### Automated Verification

The following tests run automatically after deployment:

1. **Smoke Tests**:
   - Basic page loading and navigation
   - API connectivity checks
   - Authentication flow validation

2. **Performance Tests**:
   - Lighthouse scores (Performance, Accessibility, SEO)
   - Bundle size verification

### Manual Verification

For critical deployments, perform these manual checks:

1. **Feature Verification**:
   - Test core features (Weather service, Col visualization)
   - Verify mobile responsiveness
   - Test authentication flows

2. **Security Verification**:
   - Check Content Security Policy implementation
   - Verify JWT token validation
   - Test rate limiting systems

3. **External Integration Testing**:
   - Verify weather API connectivity
   - Test map integration
   - Validate elevation data retrieval

## Rollback Procedures

In case of critical issues after deployment:

### Immediate Rollback

1. Navigate to **Deploys** in the Netlify dashboard
2. Find the last stable deployment
3. Click **Publish deploy** to revert to that version
4. Verify the application is functioning correctly after rollback

### Fixing and Re-deploying

1. Create a hotfix branch from the last stable commit
2. Fix the issue and test thoroughly
3. Create a pull request and merge to main
4. Monitor the new deployment carefully

## Performance Optimization

### CDN Configuration

Netlify automatically distributes assets via its global CDN. Enhance with:

1. **Cache Headers**:
   ```toml
   [[headers]]
     for = "/*.js"
     [headers.values]
       Cache-Control = "public, max-age=31536000, immutable"
   
   [[headers]]
     for = "/*.css"
     [headers.values]
       Cache-Control = "public, max-age=31536000, immutable"
   ```

2. **Asset Optimization**:
   - Enable asset optimization in Netlify (CSS, JS, images)
   - Use the `ENABLE_BROTLI_COMPRESSION` environment variable

### Monitoring

Monitor performance metrics after deployment:

1. **Core Web Vitals**:
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - First Input Delay (FID)
   - Cumulative Layout Shift (CLS)

2. **API Response Times**:
   - Weather API latency
   - Authentication response time
   - Database query performance

## Continuous Integration

### GitHub Actions Integration

1. `.github/workflows/ci.yml` runs tests on each pull request
2. Netlify deploys preview environments for each PR
3. Lighthouse CI runs performance tests on preview URLs

### Quality Gates

The following quality gates must pass before deployment:

1. All unit and integration tests passing
2. Code coverage above 75%
3. No TypeScript or ESLint errors
4. Bundle size within acceptable limits
5. Lighthouse performance score above 85

## Troubleshooting Common Deployment Issues

### Build Failures

1. **Node Version Mismatch**:
   - Set Node version in `netlify.toml`: `NODE_VERSION = "16"`

2. **Dependency Installation Failures**:
   - Check for NPM registry issues
   - Consider using a lockfile (`package-lock.json`)

### Runtime Errors

1. **Missing Environment Variables**:
   - Check Netlify environment variables configuration
   - Verify all required variables are set

2. **API Connectivity Issues**:
   - Verify API keys and endpoints
   - Check for CORS issues in the browser console

3. **Authentication Failures**:
   - Confirm Auth0 configuration is correct
   - Verify callback URLs match the deployed environment
