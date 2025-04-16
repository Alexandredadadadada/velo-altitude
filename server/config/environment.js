console.log('Loading environment config...');

const environment = {
  mongodb: {
    uri: process.env.MONGODB_URI,
    dbName: process.env.MONGODB_DB_NAME,
    clusterName: process.env.MONGODB_CLUSTER_NAME,
    region: process.env.MONGODB_REGION,
    poolSize: {
      min: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '5'),
      max: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10')
    }
  },
  auth: {
    auth0: {
      baseURL: process.env.AUTH0_BASE_URL,
      issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
      clientID: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      secret: process.env.AUTH0_SECRET,
      audience: process.env.AUTH0_AUDIENCE,
      scope: process.env.AUTH0_SCOPE
    }
  },
  ai: {
    claude: {
      apiKey: process.env.CLAUDE_API_KEY
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY
    }
  },
  apis: {
    mapbox: process.env.MAPBOX_TOKEN,
    openroute: process.env.OPENROUTE_API_KEY,
    openweather: process.env.OPENWEATHER_API_KEY,
    windy: process.env.WINDY_PLUGINS_API,
    strava: {
      clientId: process.env.STRAVA_CLIENT_ID,
      clientSecret: process.env.STRAVA_CLIENT_SECRET,
      accessToken: process.env.STRAVA_ACCESS_TOKEN,
      refreshToken: process.env.STRAVA_REFRESH_TOKEN
    }
  },
  cache: {
    redis: {
      url: process.env.REDIS_URL,
      password: process.env.REDIS_PASSWORD
    }
  },
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
    sessionSecret: process.env.SESSION_SECRET,
    apiKeysEncryption: process.env.API_KEYS_ENCRYPTION_KEY
  }
};

module.exports = { environment };
