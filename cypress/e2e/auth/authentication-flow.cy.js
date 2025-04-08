/**
 * Tests E2E pour le flux d'authentification
 * 
 * Ce fichier contient les tests end-to-end pour les différents scénarios
 * d'authentification dans l'application Velo-Altitude.
 */

describe('Flux d\'authentification', () => {
  beforeEach(() => {
    // Réinitialiser les cookies et le localStorage avant chaque test
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('devrait permettre la connexion et accéder à des pages protégées', () => {
    // Se connecter à l'application
    cy.loginViaAuth0(Cypress.env('auth0_username'), Cypress.env('auth0_password'));
    
    // Vérifier que l'utilisateur est bien connecté
    cy.get('[data-testid="user-profile"]').should('exist');
    
    // Accéder à une page protégée
    cy.visitProtected('/profile', { skipLoginCheck: true });
    
    // Vérifier que la page protégée est accessible
    cy.url().should('include', '/profile');
    cy.get('[data-testid="profile-content"]').should('exist');
  });

  it('devrait rediriger vers la page de connexion pour les routes protégées', () => {
    // Essayer d'accéder directement à une page protégée sans être connecté
    cy.visit('/profile');
    
    // Vérifier la redirection vers la page de connexion
    cy.url().should('include', '/login');
  });

  it('devrait permettre la déconnexion', () => {
    // D'abord se connecter
    cy.loginViaAuth0(Cypress.env('auth0_username'), Cypress.env('auth0_password'));
    
    // Vérifier que l'utilisateur est connecté
    cy.get('[data-testid="user-profile"]').should('exist');
    
    // Se déconnecter
    cy.logout();
    
    // Vérifier que l'utilisateur est déconnecté
    cy.get('[data-testid="login-button"]').should('exist');
    
    // Essayer d'accéder à une page protégée
    cy.visit('/profile');
    
    // Vérifier la redirection vers la page de connexion
    cy.url().should('include', '/login');
  });

  it('devrait rafraîchir automatiquement le token expiré', () => {
    // Se connecter
    cy.loginViaAuth0(Cypress.env('auth0_username'), Cypress.env('auth0_password'));
    
    // Accéder à une page protégée
    cy.visitProtected('/profile', { skipLoginCheck: true });
    
    // Simuler l'expiration du token
    cy.simulateTokenExpiration();
    
    // Essayer d'accéder à une autre page protégée
    cy.visitProtected('/auth-test/api', { skipLoginCheck: true });
    
    // Vérifier que l'accès est toujours possible (token rafraîchi)
    cy.url().should('include', '/auth-test/api');
    cy.get('[data-testid="api-test-content"]').should('exist');
  });

  it('devrait utiliser notre environnement de test d\'authentification', () => {
    // Se connecter
    cy.loginViaAuth0(Cypress.env('auth0_username'), Cypress.env('auth0_password'));
    
    // Naviguer vers notre sandbox de test
    cy.visit('/auth-test');
    
    // Vérifier la présence des composants de test
    cy.contains('Tests d\'Authentification Velo-Altitude').should('exist');
    cy.contains('Test de Connexion').should('exist');
    cy.contains('Test des Routes Protégées').should('exist');
    cy.contains('Test des Appels API').should('exist');
    
    // Naviguer vers le test des routes protégées
    cy.contains('Test des Routes Protégées').click();
    cy.url().should('include', '/auth-test/protected');
    
    // Vérifier que l'utilisateur a bien accès au contenu protégé
    cy.contains('Zone Utilisateur').should('exist');
    
    // Naviguer vers le test des API
    cy.contains('Test des Appels API').click();
    cy.url().should('include', '/auth-test/api');
    
    // Tester un appel API protégé
    cy.contains('Profil utilisateur').click();
    cy.contains('L\'appel API a réussi').should('exist');
  });
});
