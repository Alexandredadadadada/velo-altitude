// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
Cypress.Commands.add('login', (email, password) => {
  // Check if we're already logged in
  cy.window().then(win => {
    const isLoggedIn = win.localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      return;
    }
  });

  // Mock Auth0 authentication
  cy.intercept('POST', '**/oauth/token', {
    body: {
      access_token: 'test_access_token',
      id_token: 'test_id_token',
      scope: 'openid profile email',
      expires_in: 86400,
      token_type: 'Bearer'
    }
  }).as('getToken');

  // Mock user info
  cy.intercept('GET', '**/userinfo', {
    body: {
      sub: 'auth0|123456789',
      nickname: 'testuser',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
      updated_at: new Date().toISOString(),
      email: email || 'test@example.com',
      email_verified: true
    }
  }).as('getUserInfo');

  // Visit login page
  cy.visit('/login');

  // Fill login form
  cy.get('[data-testid="email-input"]').type(email || 'test@example.com');
  cy.get('[data-testid="password-input"]').type(password || 'Password123!');
  cy.get('[data-testid="login-button"]').click();

  // Wait for auth to complete
  cy.wait('@getToken');
  cy.wait('@getUserInfo');

  // Set local storage to indicate logged in state for future tests
  cy.window().then(win => {
    win.localStorage.setItem('isLoggedIn', 'true');
  });
});

// Commande pour simuler la connexion à Strava
Cypress.Commands.add('connectToStrava', () => {
  // Simuler un utilisateur déjà connecté à Strava
  cy.window().then(win => {
    win.localStorage.setItem('strava_connected', 'true');
    win.localStorage.setItem('strava_token_expires_at', (Math.floor(Date.now() / 1000) + 3600).toString());
  });
  
  // Intercepter les appels à l'API Strava
  cy.intercept('GET', '**/api/v3/athlete', { fixture: 'strava/athlete.json' }).as('getAthlete');
  cy.intercept('GET', '**/api/v3/athlete/activities*', { fixture: 'strava/activities.json' }).as('getActivities');
});

// Commande pour vérifier les performances de chargement
Cypress.Commands.add('checkPerformance', (selector, maxLoadTime = 1000) => {
  const start = performance.now();
  cy.get(selector, { timeout: maxLoadTime }).should('be.visible');
  const end = performance.now();
  const loadTime = end - start;
  
  cy.task('log', `Element ${selector} loaded in ${loadTime.toFixed(2)}ms`);
  expect(loadTime).to.be.lessThan(maxLoadTime);
});

// Commande pour tester le mode hors ligne
Cypress.Commands.add('goOffline', () => {
  cy.log('**Going offline**');
  cy.window().then(win => {
    win.navigator.serviceWorker.ready.then(registration => {
      cy.stub(win.navigator, 'onLine').value(false);
      win.dispatchEvent(new win.Event('offline'));
    });
  });
});

Cypress.Commands.add('goOnline', () => {
  cy.log('**Going online**');
  cy.window().then(win => {
    win.navigator.serviceWorker.ready.then(registration => {
      cy.stub(win.navigator, 'onLine').value(true);
      win.dispatchEvent(new win.Event('online'));
    });
  });
});

// Commande pour tester le responsive design
Cypress.Commands.add('viewportPreset', (preset) => {
  const presets = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 800 },
    widescreen: { width: 1920, height: 1080 }
  };
  
  const viewport = presets[preset] || presets.desktop;
  cy.viewport(viewport.width, viewport.height);
});

// Commande pour tester les interactions tactiles
Cypress.Commands.add('touchSwipe', (selector, direction) => {
  cy.get(selector).then($el => {
    const rect = $el[0].getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const moveDistance = direction === 'left' || direction === 'right' ? rect.width / 2 : rect.height / 2;
    
    let startX, startY, endX, endY;
    
    switch (direction) {
      case 'left':
        startX = centerX + moveDistance;
        startY = centerY;
        endX = centerX - moveDistance;
        endY = centerY;
        break;
      case 'right':
        startX = centerX - moveDistance;
        startY = centerY;
        endX = centerX + moveDistance;
        endY = centerY;
        break;
      case 'up':
        startX = centerX;
        startY = centerY + moveDistance;
        endX = centerX;
        endY = centerY - moveDistance;
        break;
      case 'down':
        startX = centerX;
        startY = centerY - moveDistance;
        endX = centerX;
        endY = centerY + moveDistance;
        break;
    }
    
    cy.wrap($el)
      .trigger('touchstart', { touches: [{ clientX: startX, clientY: startY }] })
      .trigger('touchmove', { touches: [{ clientX: endX, clientY: endY }] })
      .trigger('touchend');
  });
});
