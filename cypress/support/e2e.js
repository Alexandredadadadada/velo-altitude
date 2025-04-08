// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Prevent uncaught exceptions from failing tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false;
});

// Log information about the test run
Cypress.on('test:after:run', (attributes) => {
  if (attributes.state === 'failed') {
    cy.task('log', `Test failed: ${attributes.title}`);
  }
});

// Add custom assertions
chai.use((_chai, utils) => {
  _chai.Assertion.addMethod('visibleInViewport', function () {
    const subject = this._obj;
    
    const windowHeight = Cypress.config('viewportHeight');
    const windowWidth = Cypress.config('viewportWidth');
    const rect = subject[0].getBoundingClientRect();
    
    this.assert(
      rect.top < windowHeight && rect.bottom > 0 && rect.left < windowWidth && rect.right > 0,
      'expected #{this} to be visible in viewport',
      'expected #{this} to not be visible in viewport',
      this._obj
    );
  });
});
