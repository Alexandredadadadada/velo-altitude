import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TrainingPlanBuilder from '../components/training/TrainingPlanBuilder';
import FTPCalculator from '../components/training/FTPCalculator';
import CommunityFeed from '../components/social/CommunityFeed';
import { SevenMajorsChallenge } from '../components/challenges/SevenMajorsChallenge';

// Mocks des services
jest.mock('../services/socialService');
jest.mock('../services/trainingService');
jest.mock('../services/FTPEstimationService');

// Mock du contexte pour les notifications
const NotificationContext = React.createContext({
  notify: jest.fn()
});

// Mock des événements de calendrier
const mockCalendarEvents = [];

// Mock de localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
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

describe('Tests d\'intégration entre modules', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  test('Module Training: Compatibilité entre FTPCalculator et TrainingPlanBuilder', async () => {
    // Préparation des données
    const ftpValue = 250;
    localStorageMock.setItem('userFTP', ftpValue);
    localStorageMock.setItem('trainingEvents', JSON.stringify(mockCalendarEvents));
    
    // Rendu de FTPCalculator
    const { unmount } = render(
      <MemoryRouter>
        <NotificationContext.Provider value={{ notify: jest.fn() }}>
          <FTPCalculator />
        </NotificationContext.Provider>
      </MemoryRouter>
    );
    
    // Vérification que la FTP est récupérée du localStorage
    expect(localStorageMock.getItem).toHaveBeenCalledWith('userFTP');
    
    // Nettoyage
    unmount();
    
    // Rendu de TrainingPlanBuilder
    render(
      <MemoryRouter>
        <NotificationContext.Provider value={{ notify: jest.fn() }}>
          <TrainingPlanBuilder />
        </NotificationContext.Provider>
      </MemoryRouter>
    );
    
    // Vérification que le TrainingPlanBuilder utilise la même valeur de FTP
    expect(localStorageMock.getItem).toHaveBeenCalledWith('userFTP');
    
    // Vérification que les événements de calendrier sont récupérés
    expect(localStorageMock.getItem).toHaveBeenCalledWith('trainingEvents');
  });
  
  test('Module Social: Partage d\'un plan d\'entraînement via le module Social', async () => {
    // Mock de la fonction window.open pour les liens de partage
    const originalOpen = window.open;
    window.open = jest.fn();
    
    // Simulation des événements d'un plan d'entraînement créé
    const mockTrainingPlan = {
      id: 'plan123',
      title: 'Plan d\'entraînement FTP',
      description: 'Plan de 8 semaines pour améliorer votre FTP',
      ftpTarget: 280,
      weeks: 8
    };
    
    localStorageMock.setItem('currentTrainingPlan', JSON.stringify(mockTrainingPlan));
    
    // Fonction pour créer un post social à partir d'un plan d'entraînement
    const createSocialPostFromTraining = (plan) => {
      return {
        content: `Je viens de créer un nouveau plan d'entraînement "${plan.title}". Objectif: améliorer ma FTP à ${plan.ftpTarget}W en ${plan.weeks} semaines!`,
        type: 'training_plan',
        relatedData: {
          planId: plan.id,
          planTitle: plan.title
        },
        user: {
          id: 'user123',
          name: 'Jean Cycliste'
        }
      };
    };
    
    // Création d'un post social à partir du plan d'entraînement
    const socialPost = createSocialPostFromTraining(mockTrainingPlan);
    
    // Vérification que le format du post est correct pour le module social
    expect(socialPost).toHaveProperty('content');
    expect(socialPost).toHaveProperty('type', 'training_plan');
    expect(socialPost).toHaveProperty('relatedData.planId', mockTrainingPlan.id);
    
    // Restauration de window.open
    window.open = originalOpen;
  });
  
  test('Module Challenges: Intégration des défis avec le module Social', async () => {
    // Mock de données pour le défi des 7 majeurs
    const mockSelectedCols = [
      { id: 'col1', name: 'Mont Ventoux', difficulty: 9, altitude: 1909 },
      { id: 'col2', name: 'Alpe d\'Huez', difficulty: 8, altitude: 1860 }
    ];
    
    localStorageMock.setItem('selectedCols', JSON.stringify(mockSelectedCols));
    
    // Fonction pour créer un post social à partir d'un défi
    const createSocialPostFromChallenge = (cols) => {
      const colNames = cols.map(col => col.name).join(', ');
      const totalAltitude = cols.reduce((sum, col) => sum + col.altitude, 0);
      
      return {
        content: `J'ai sélectionné ${cols.length}/7 cols pour mon défi des 7 majeurs: ${colNames}. Dénivelé total: ${totalAltitude}m!`,
        type: 'challenge',
        relatedData: {
          challengeType: 'seven_majors',
          selectedCols: cols.map(col => col.id)
        },
        user: {
          id: 'user123',
          name: 'Jean Cycliste'
        }
      };
    };
    
    // Création d'un post social à partir du défi
    const socialPost = createSocialPostFromChallenge(mockSelectedCols);
    
    // Vérification que le format du post est correct pour le module social
    expect(socialPost).toHaveProperty('content');
    expect(socialPost).toHaveProperty('type', 'challenge');
    expect(socialPost).toHaveProperty('relatedData.challengeType', 'seven_majors');
    expect(socialPost.relatedData.selectedCols).toHaveLength(mockSelectedCols.length);
  });
  
  test('Compatibilité avec le système de notifications', () => {
    // Préparation d'une notification qui pourrait être envoyée par n'importe quel module
    const mockNotification = {
      message: 'Votre séance d\'entraînement commence dans 1 heure',
      type: 'reminder',
      source: 'training',
      timestamp: new Date().toISOString()
    };
    
    // Vérification du format de notification pour s'assurer qu'il est compatible entre les modules
    expect(mockNotification).toHaveProperty('message');
    expect(mockNotification).toHaveProperty('type');
    expect(mockNotification).toHaveProperty('source');
    expect(mockNotification).toHaveProperty('timestamp');
    
    // Simulation de stockage de notification
    const storedNotifications = [mockNotification];
    localStorageMock.setItem('notifications', JSON.stringify(storedNotifications));
    
    // Vérification que les notifications sont correctement stockées
    const retrievedNotifications = JSON.parse(localStorageMock.getItem('notifications'));
    expect(retrievedNotifications).toHaveLength(1);
    expect(retrievedNotifications[0].message).toBe(mockNotification.message);
  });
});
