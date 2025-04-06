// src/AuthWrapper.js
import React from 'react';
import App from './App';

// Fonction qui simule un contexte d'authentification complet
const createMockAuth = () => {
  const mockUser = {
    id: 'mock-user-id',
    name: 'Utilisateur Test',
    email: 'test@example.com',
    role: 'admin'
  };
  
  window.mockAuthContext = {
    currentUser: mockUser,
    user: mockUser,
    isAuthenticated: true,
    isAdmin: true,
    login: () => Promise.resolve(true),
    logout: () => Promise.resolve(true),
    updateUserProfile: (data) => Promise.resolve({...mockUser, ...data}),
    getToken: () => 'mock-token-xyz'
  };
};

// Injecter le mock d'authentification globalement
createMockAuth();

// Patch global pour intercepter les erreurs d'authentification
const originalCreateElement = React.createElement;
React.createElement = function(type, props, ...children) {
  // Si un composant tente d'utiliser useAuth et échoue, fournir le contexte mock
  if (props && props.hasOwnProperty('useAuth')) {
    try {
      return originalCreateElement(type, {
        ...props,
        ...window.mockAuthContext
      }, ...children);
    } catch (e) {
      console.warn('Intercepted auth error:', e);
      return originalCreateElement(type, {
        ...props,
        ...window.mockAuthContext
      }, ...children);
    }
  }
  return originalCreateElement(type, props, ...children);
};

// Composant wrapper qui enveloppe toute l'application
const AuthWrapper = () => {
  return <App />;
};

export default AuthWrapper;
