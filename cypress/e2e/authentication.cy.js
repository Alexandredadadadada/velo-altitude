/// <reference types="cypress" />

/**
 * E2E tests for the authentication flow
 * Using enhanced Auth0 testing commands from auth.js
 */
describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.intercept('POST', '**/oauth/token').as('authRequest');
    cy.intercept('GET', '**/userinfo').as('userInfo');
    // Intercept API calls that require authentication
    cy.intercept('GET', '**/api/user/profile').as('profileRequest');
  });

  it('should display login page', () => {
    cy.visit('/login');
    cy.get('[data-testid="login-form"]').should('be.visible');
    cy.get('[data-testid="login-button"]').should('be.visible');
  });

  it('should successfully login with valid credentials via Auth0', () => {
    // Use the new Auth0 login command
    cy.loginViaAuth0(
      Cypress.env('auth0_username'),
      Cypress.env('auth0_password')
    );
    
    // Verify successful login
    cy.wait('@userInfo');
    cy.url().should('include', '/dashboard');
    
    // Verify that the user profile is loaded
    cy.get('[data-testid="user-profile"]').should('be.visible');
    cy.get('[data-testid="main-navigation"]').should('be.visible');
  });

  it('should redirect to login when accessing protected route while not authenticated', () => {
    // Clear any existing session
    cy.clearCookies();
    cy.clearLocalStorage();
    
    // Try to access a protected route directly
    cy.visit('/dashboard');
    
    // Should be redirected to login
    cy.url().should('include', '/login');
    
    // Should show the login form
    cy.get('[data-testid="login-form"]').should('be.visible');
  });

  it('should maintain authentication after page refresh', () => {
    // Login first
    cy.loginViaAuth0(
      Cypress.env('auth0_username'),
      Cypress.env('auth0_password')
    );
    
    // Verify we're on dashboard
    cy.url().should('include', '/dashboard');
    
    // Refresh the page
    cy.reload();
    
    // Should still be on dashboard and authenticated
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="user-profile"]').should('be.visible');
    
    // User data should be loaded without login prompt
    cy.wait('@profileRequest', { timeout: 10000 });
  });

  it('should access protected API routes with authentication token', () => {
    // Login first
    cy.loginViaAuth0(
      Cypress.env('auth0_username'),
      Cypress.env('auth0_password')
    );
    
    // Verify profile data is loaded (requires token)
    cy.wait('@profileRequest');
    
    // Verify user data appears in profile section
    cy.get('[data-testid="user-profile"]').should('contain', Cypress.env('auth0_username'));
  });

  it('should handle token refresh for expired tokens', () => {
    // Login first
    cy.loginViaAuth0(
      Cypress.env('auth0_username'),
      Cypress.env('auth0_password')
    );
    
    // Simulate token expiration
    cy.simulateTokenExpiration();
    
    // Try to access a protected API
    cy.intercept('GET', '**/api/user/profile').as('tokenRefreshRequest');
    cy.visit('/profile');
    
    // Should trigger a token refresh
    cy.wait('@authRequest');
    
    // Should successfully load the profile
    cy.get('[data-testid="user-profile"]').should('be.visible');
  });

  it('should logout successfully', () => {
    // Login first
    cy.loginViaAuth0(
      Cypress.env('auth0_username'),
      Cypress.env('auth0_password')
    );
    
    // Verify that the user is logged in
    cy.url().should('include', '/dashboard');
    
    // Logout using the logout command
    cy.logout();
    
    // Verify that the user is redirected to the home page
    cy.url().should('include', '/');
    
    // Verify that login button is visible
    cy.get('[data-testid="login-button"]').should('be.visible');
    
    // Try to access a protected route
    cy.visit('/dashboard');
    
    // Should be redirected to login
    cy.url().should('include', '/login');
  });
});
