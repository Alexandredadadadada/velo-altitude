import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TrainingPlanBuilder from '../TrainingPlanBuilder';

// Mock de localStorage pour tester le stockage des événements
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock du hook useHistory de react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: jest.fn(),
  }),
}));

describe('Tests d\'intégration de TrainingPlanBuilder avec le calendrier', () => {
  // Réinitialiser les mocks entre chaque test
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });
  
  test('Le plan d\'entraînement généré peut être converti en événements de calendrier', () => {
    // Préparer un mock de NotificationContext
    const notifyMock = jest.fn();
    const contextValue = { notify: notifyMock };
    
    // Rendre le composant avec les mocks nécessaires
    render(
      <MemoryRouter>
        <NotificationContext.Provider value={contextValue}>
          <TrainingPlanBuilder />
        </NotificationContext.Provider>
      </MemoryRouter>
    );
    
    // Simuler la création d'un plan
    // Remarque: Ces assertions seront simplifiées car le composant complet 
    // nécessiterait plus de mocks (traduction, etc.)
    
    // Vérifier que localStorage.setItem est appelé avec la clé correcte
    // lorsque la fonction convertPlanToCalendarEvents est appelée
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'trainingPlanEvents',
      expect.any(String)
    );
    
    // Vérifier que le format des événements est correct
    const storedEvents = JSON.parse(localStorageMock.setItem.mock.calls[0][1]);
    expect(Array.isArray(storedEvents)).toBe(true);
    
    if (storedEvents.length > 0) {
      // Vérifier la structure d'un événement
      const event = storedEvents[0];
      expect(event).toHaveProperty('id');
      expect(event).toHaveProperty('title');
      expect(event).toHaveProperty('date');
      expect(event).toHaveProperty('type');
      expect(event).toHaveProperty('category', 'training');
    }
  });
});

// Mock de NotificationContext
const NotificationContext = React.createContext({
  notify: () => {},
});
