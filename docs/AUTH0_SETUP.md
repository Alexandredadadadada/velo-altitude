# Auth0 Setup Guide for Velo-Altitude

This document provides a comprehensive guide for setting up and configuring Auth0 authentication for the Velo-Altitude application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Auth0 Dashboard Configuration](#auth0-dashboard-configuration)
3. [Application Configuration](#application-configuration)
4. [Netlify Environment Variables](#netlify-environment-variables)
5. [Testing Authentication](#testing-authentication)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have:

- An Auth0 account (sign up at [auth0.com](https://auth0.com))
- Access to the Velo-Altitude Netlify deployment dashboard
- Local development environment set up for testing

## Auth0 Dashboard Configuration

### 1. Create a New Application

1. Log in to the [Auth0 Dashboard](https://manage.auth0.com/)
2. Navigate to **Applications > Applications**
3. Click **Create Application**
4. Name it "Velo-Altitude"
5. Select "Single Page Application" as the application type
6. Click **Create**

### 2. Configure Application Settings

In your new application settings:

1. **Allowed Callback URLs**:
   - Production: `https://velo-altitude.com/api/auth/callback`
   - Development: `http://localhost:3000/api/auth/callback`

2. **Allowed Logout URLs**:
   - Production: `https://velo-altitude.com`
   - Development: `http://localhost:3000`

3. **Allowed Web Origins**:
   - Production: `https://velo-altitude.com`
   - Development: `http://localhost:3000`

4. **Allowed Origins (CORS)**:
   - Production: `https://velo-altitude.com`
   - Development: `http://localhost:3000`

5. Save changes

### 3. Create API

1. Navigate to **Applications > APIs**
2. Click **Create API**
3. Set the following values:
   - **Name**: `Velo-Altitude API`
   - **Identifier**: `https://velo-altitude.com/api` (this is your API Audience)
   - **Signing Algorithm**: RS256
4. Click **Create**

### 4. Define Permissions

In your API settings:

1. Go to the **Permissions** tab
2. Add the following permissions:
   - `read:profile` - Read user profile data
   - `read:cols` - Access cols data
   - `write:cols` - Create or modify cols
   - `read:weather` - Access weather data
   - `admin` - Administrative access

### 5. Create Roles (Optional)

1. Navigate to **User Management > Roles**
2. Create the following roles:
   - `user`: Basic access
   - `premium`: Premium user access
   - `admin`: Administrative access
3. Assign appropriate permissions to each role

## Application Configuration

### Required Auth0 Credentials

From your Auth0 dashboard, gather the following credentials:

- **Domain**: Found in Application settings (e.g., `velo-altitude.eu.auth0.com`)
- **Client ID**: Found in Application settings
- **Client Secret**: Found in Application settings
- **API Audience**: The identifier you set for your API (e.g., `https://velo-altitude.com/api`)

These values will be used in both your local development environment and Netlify deployment.

## Netlify Environment Variables

The following Auth0-related environment variables must be configured in Netlify:

1. `AUTH0_ISSUER_BASE_URL`: Your Auth0 domain with https prefix (`https://velo-altitude.eu.auth0.com`)
2. `AUTH0_CLIENT_ID`: Your Auth0 application Client ID
3. `AUTH0_CLIENT_SECRET`: Your Auth0 application Client Secret
4. `AUTH0_AUDIENCE`: Your API identifier (`https://velo-altitude.com/api`)
5. `AUTH0_SCOPE`: The requested scopes (`openid profile email offline_access`)
6. `AUTH0_BASE_URL`: The base URL of your application (`https://velo-altitude.com`)
7. `AUTH0_SECRET`: A long, secret random string for cookie encryption

### Setting Environment Variables in Netlify

1. Log in to your Netlify dashboard
2. Navigate to your site settings
3. Go to **Build & deploy > Environment**
4. Add each variable and its corresponding value
5. Save changes and trigger a new deployment

## Testing Authentication

### Local Testing

1. Create a `.env.local` file in your project root with the Auth0 variables
2. Start your development server with `npm run dev`
3. Try logging in with the authentication flow
4. Test protected routes to ensure they require authentication

### Production Testing

1. Check that the Auth0 configuration is correctly set in Netlify
2. Deploy your changes to production
3. Test the login process on the live site
4. Verify JWT token validation and permissions

### Test User Accounts

For development and testing, create test users in your Auth0 dashboard:

1. Navigate to **User Management > Users**
2. Click **Create User**
3. Create users with different roles for testing

## Troubleshooting

### Common Issues

#### CORS Errors
- Ensure your Auth0 application has the correct Allowed Origins (CORS) settings
- Check the Content-Security-Policy header in your Netlify configuration

#### JWT Validation Errors
- Verify the Auth0 audience matches your API identifier
- Check that the signing algorithm is RS256
- Ensure your Auth0 domain is correct

#### Redirect URI Mismatch
- Confirm that the callback URLs in Auth0 match your application's redirect URIs
- For local development, ensure you're using the correct localhost URL

### Debugging Tools

- Use the Network tab in browser DevTools to inspect Auth0 requests
- Check Auth0 logs in the Auth0 Dashboard under **Monitoring > Logs**
- Use the JWT debugger at [jwt.io](https://jwt.io) to decode and verify tokens

## Additional Resources

- [Auth0 Documentation](https://auth0.com/docs)
- [JWT Introduction](https://jwt.io/introduction)
- [OAuth 2.0 Simplified](https://aaronparecki.com/oauth-2-simplified/)
- [Netlify Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)
