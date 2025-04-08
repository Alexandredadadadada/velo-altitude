const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        }
      });
    },
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    chromeWebSecurity: false,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    pageLoadTimeout: 60000,
    env: {
      apiUrl: 'http://localhost:8888/.netlify/functions',
      auth0Domain: process.env.AUTH0_DOMAIN,
      auth0ClientId: process.env.AUTH0_CLIENT_ID
    }
  },
});
