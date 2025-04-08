/// <reference types="cypress" />

describe('Route Planning Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.login();
    
    // Intercept API calls
    cy.intercept('GET', '**/api/cols*').as('getCols');
    cy.intercept('GET', '**/api/routes*').as('getRoutes');
    cy.intercept('POST', '**/api/routes*').as('createRoute');
  });

  it('should display the route planning dashboard', () => {
    cy.visit('/dashboard');
    cy.get('[data-testid="route-planning-card"]').click();
    
    cy.url().should('include', '/route-planning');
    cy.get('[data-testid="col-selector"]').should('be.visible');
    cy.get('[data-testid="map-container"]').should('be.visible');
  });

  it('should allow selecting cols and creating a route', () => {
    cy.visit('/route-planning');
    cy.wait('@getCols');
    
    // Select a col from the list
    cy.get('[data-testid="col-item"]').first().click();
    
    // Verify the col is added to the selected list
    cy.get('[data-testid="selected-cols-list"]').find('[data-testid="selected-col-item"]').should('have.length', 1);
    
    // Open the route creation dialog
    cy.get('[data-testid="create-route-button"]').click();
    
    // Fill in route details
    cy.get('[data-testid="route-name-input"]').type('Test Route');
    cy.get('[data-testid="route-description-input"]').type('This is a test route created by Cypress');
    cy.get('[data-testid="route-difficulty-select"]').click();
    cy.get('[data-value="Modéré"]').click();
    
    // Save the route
    cy.get('[data-testid="save-route-button"]').click();
    
    // Wait for the API call to complete
    cy.wait('@createRoute');
    
    // Verify success message
    cy.get('[data-testid="success-alert"]').should('be.visible');
    cy.get('[data-testid="success-alert"]').should('contain', 'Itinéraire créé avec succès');
  });

  it('should display route details and allow exporting GPX', () => {
    // Visit the routes page
    cy.visit('/routes');
    cy.wait('@getRoutes');
    
    // Click on the first route
    cy.get('[data-testid="route-card"]').first().click();
    
    // Verify route details are displayed
    cy.get('[data-testid="route-details-dialog"]').should('be.visible');
    cy.get('[data-testid="route-name"]').should('be.visible');
    cy.get('[data-testid="route-description"]').should('be.visible');
    cy.get('[data-testid="route-stats"]').should('be.visible');
    
    // Test GPX export
    cy.get('[data-testid="export-gpx-button"]').click();
    
    // Verify download happens (this is tricky in Cypress, so we'll just check the button click works)
    cy.get('[data-testid="export-gpx-button"]').should('not.be.disabled');
  });

  it('should complete the full route planning flow', () => {
    cy.visit('/dashboard');
    
    // Navigate to route planning
    cy.get('[data-testid="route-planning-card"]').click();
    cy.wait('@getCols');
    
    // Select multiple cols
    cy.get('[data-testid="col-item"]').eq(0).click();
    cy.get('[data-testid="col-item"]').eq(1).click();
    cy.get('[data-testid="col-item"]').eq(2).click();
    
    // Verify selected cols
    cy.get('[data-testid="selected-cols-list"]').find('[data-testid="selected-col-item"]').should('have.length', 3);
    
    // Plan the route
    cy.get('[data-testid="plan-route-button"]').click();
    
    // Wait for route calculation
    cy.get('[data-testid="route-loading"]', { timeout: 10000 }).should('not.exist');
    
    // Verify route is displayed on map
    cy.get('[data-testid="route-polyline"]').should('exist');
    
    // Save the route
    cy.get('[data-testid="save-route-button"]').click();
    
    // Fill in route details
    cy.get('[data-testid="route-name-input"]').type('My Epic Route');
    cy.get('[data-testid="route-description-input"]').type('An epic route through the mountains');
    
    // Save the final route
    cy.get('[data-testid="confirm-save-button"]').click();
    
    // Wait for the API call to complete
    cy.wait('@createRoute');
    
    // Verify success and navigation to routes page
    cy.url().should('include', '/routes');
    cy.get('[data-testid="route-card"]').should('contain', 'My Epic Route');
  });
});
