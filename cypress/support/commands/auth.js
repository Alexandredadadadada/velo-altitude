/**
 * @file Auth commands for Cypress E2E tests
 * @description Custom Cypress commands for authentication testing
 */

// Import Auth0 testing library
import '@auth0/auth0-spa-js';

// Command to log in via Auth0
Cypress.Commands.add('loginViaAuth0', (username, password) => {
  // Visit the app's login page
  cy.visit('/login');
  
  // Click the login button (which should redirect to Auth0)
  cy.get('[data-testid="login-button"]').click();
  
  // Auth0 Universal Login will appear
  // Fill in credentials on Auth0 login form
  cy.origin(Cypress.env('auth0_domain'), { args: { username, password } }, 
    ({ username, password }) => {
      cy.get('input[name="username"]').type(username);
      cy.get('input[name="password"]').type(password);
      cy.get('button[type="submit"]').click();
    }
  );
  
  // Wait for redirect back to the app
  cy.url().should('not.include', 'auth0.com');
  
  // Verify we're authenticated
  cy.get('[data-testid="user-profile"]').should('exist');
});

// Command to check if logged in and skip login if already authenticated
Cypress.Commands.add('loginIfNeeded', (username, password) => {
  cy.visit('/');
  
  // Check if we're already logged in
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="user-profile"]').length === 0) {
      cy.loginViaAuth0(username, password);
    }
  });
});

// Command to logout
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-button"]').click();
  
  // Verify we're logged out
  cy.get('[data-testid="login-button"]').should('exist');
});

// Command to visit a protected page that requires authentication
Cypress.Commands.add('visitProtected', (url, options = {}) => {
  const { skipLoginCheck = false } = options;
  
  if (!skipLoginCheck) {
    // Ensure we're logged in first
    cy.loginIfNeeded(Cypress.env('auth0_username'), Cypress.env('auth0_password'));
  }
  
  // Visit the protected page
  cy.visit(url);
});

// Command to simulate token expiration
Cypress.Commands.add('simulateTokenExpiration', () => {
  // This is a simplified approach - in a real implementation, 
  // we would need to manipulate the token or mock Auth0's behavior
  cy.window().then((win) => {
    // Force Auth0 to consider the token expired
    win.localStorage.setItem('auth0.is.authenticated', 'false');
  });
  
  // Reload the page to trigger token refresh
  cy.reload();
});
