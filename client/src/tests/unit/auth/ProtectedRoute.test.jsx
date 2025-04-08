/**
 * Tests unitaires pour le composant ProtectedRoute
 * 
 * Ces tests vérifient que le composant ProtectedRoute fonctionne correctement
 * en redirigeant les utilisateurs non authentifiés et en affichant le contenu
 * pour les utilisateurs authentifiés.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import { PrivateRoute } from '../../../AppRouter';  // Importer depuis AppRouter

// Mock du hook useAuth
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

// Importer le mock après la déclaration
const { useAuth } = require('../../../hooks/useAuth');

describe('PrivateRoute Component', () => {
  const TestComponent = () => <div data-testid="protected-content">Contenu protégé</div>;
  
  const renderWithRouter = (ui, { route = '/protected' } = {}) => {
    return render(
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/login" element={<div data-testid="login-page">Page de connexion</div>} />
          <Route path="/protected" element={<PrivateRoute element={<TestComponent />} />} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait afficher un chargeur quand loading est vrai', () => {
    // Arrange
    useAuth.mockReturnValue({
      user: null,
      loading: true
    });

    // Act
    renderWithRouter();

    // Assert
    expect(screen.getByText(/chargement/i)).toBeInTheDocument();
  });

  it('devrait rediriger vers /login quand l\'utilisateur n\'est pas authentifié', () => {
    // Arrange
    useAuth.mockReturnValue({
      user: null,
      loading: false
    });

    // Act
    renderWithRouter();

    // Assert
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });

  it('devrait rendre le composant enfant quand l\'utilisateur est authentifié', () => {
    // Arrange
    useAuth.mockReturnValue({
      user: { sub: 'auth0|123' },
      loading: false
    });

    // Act
    renderWithRouter();

    // Assert
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
});
