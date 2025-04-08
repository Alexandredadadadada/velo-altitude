/// <reference types="cypress" />

describe('Strava Integration Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.login();
    
    // Mock Strava API responses
    cy.intercept('GET', '**/api/v3/athlete', { fixture: 'strava/athlete.json' }).as('getAthlete');
    cy.intercept('GET', '**/api/v3/athlete/activities*', { fixture: 'strava/activities.json' }).as('getActivities');
  });

  it('should display Strava integration page', () => {
    cy.visit('/social/strava');
    
    // Check if the Strava connect button is visible
    cy.get('[data-testid="strava-connect-button"]').should('be.visible');
  });

  it('should simulate Strava OAuth flow', () => {
    cy.visit('/social/strava');
    
    // Mock the OAuth redirect
    cy.intercept('GET', '**/oauth/authorize*', (req) => {
      // Extract the redirect_uri from the request
      const url = new URL(req.url);
      const redirectUri = url.searchParams.get('redirect_uri');
      
      // Simulate the redirect with a code
      req.reply({
        statusCode: 302,
        headers: {
          'Location': `${redirectUri}?code=mock_auth_code&scope=read,activity:read`
        }
      });
    }).as('stravaAuth');
    
    // Mock the token exchange
    cy.intercept('POST', '**/oauth/token', {
      statusCode: 200,
      body: {
        token_type: 'Bearer',
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires_at: Math.floor(Date.now() / 1000) + 21600
      }
    }).as('tokenExchange');
    
    // Click the connect button
    cy.get('[data-testid="strava-connect-button"]').click();
    
    // Wait for the token exchange
    cy.wait('@tokenExchange');
    
    // Verify we're redirected back to the Strava page
    cy.url().should('include', '/social/strava');
    
    // Verify the UI shows connected state
    cy.get('[data-testid="strava-connected-status"]').should('be.visible');
    cy.get('[data-testid="strava-connected-status"]').should('contain', 'Connecté');
  });

  it('should display Strava activities after connection', () => {
    // Simulate already connected state
    cy.window().then((win) => {
      win.localStorage.setItem('strava_connected', 'true');
    });
    
    cy.visit('/social/strava');
    
    // Wait for activities to load
    cy.wait('@getActivities');
    
    // Verify activities are displayed
    cy.get('[data-testid="strava-activities-list"]').should('be.visible');
    cy.get('[data-testid="strava-activity-item"]').should('have.length.at.least', 1);
  });

  it('should allow sharing a Strava activity as a route', () => {
    // Simulate already connected state
    cy.window().then((win) => {
      win.localStorage.setItem('strava_connected', 'true');
    });
    
    // Mock the activity detail endpoint
    cy.intercept('GET', '**/api/v3/activities/*', { fixture: 'strava/activity-detail.json' }).as('getActivityDetail');
    
    // Mock the route creation endpoint
    cy.intercept('POST', '**/api/routes', {
      statusCode: 201,
      body: {
        id: 'new-route-id',
        name: 'Morning Ride',
        success: true
      }
    }).as('createRoute');
    
    cy.visit('/social/strava');
    cy.wait('@getActivities');
    
    // Click on the first activity
    cy.get('[data-testid="strava-activity-item"]').first().click();
    
    // Wait for activity details to load
    cy.wait('@getActivityDetail');
    
    // Click share button
    cy.get('[data-testid="share-activity-button"]').click();
    
    // Confirm sharing
    cy.get('[data-testid="confirm-share-button"]').click();
    
    // Wait for route creation
    cy.wait('@createRoute');
    
    // Verify success message
    cy.get('[data-testid="success-alert"]').should('be.visible');
    cy.get('[data-testid="success-alert"]').should('contain', 'Activité partagée avec succès');
  });

  it('should handle Strava disconnection', () => {
    // Simulate already connected state
    cy.window().then((win) => {
      win.localStorage.setItem('strava_connected', 'true');
    });
    
    // Mock the disconnect endpoint
    cy.intercept('POST', '**/api/strava/disconnect', {
      statusCode: 200,
      body: { success: true }
    }).as('disconnectStrava');
    
    cy.visit('/social/strava');
    
    // Click disconnect button
    cy.get('[data-testid="strava-disconnect-button"]').click();
    
    // Confirm disconnection
    cy.get('[data-testid="confirm-disconnect-button"]').click();
    
    // Wait for disconnect API call
    cy.wait('@disconnectStrava');
    
    // Verify UI shows disconnected state
    cy.get('[data-testid="strava-connect-button"]').should('be.visible');
    cy.get('[data-testid="strava-connected-status"]').should('not.exist');
  });
});
