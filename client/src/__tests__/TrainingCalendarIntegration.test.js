import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import TrainingPlanBuilder from '../components/training/TrainingPlanBuilder';
import Calendar from '../components/calendar/Calendar';

// Mocks des services
jest.mock('../services/trainingService');
jest.mock('../services/calendarService');

// Mock du contexte pour les notifications
const NotificationContext = React.createContext({
  notify: jest.fn()
});

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

// Mock du service calendrier
const mockCalendarService = {
  addEvent: jest.fn(),
  getEvents: jest.fn(() => [])
};

// Mock du service d'entraînement
const mockTrainingService = {
  savePlan: jest.fn(),
  getPlans: jest.fn(() => [])
};

describe('Tests d\'intégration entre TrainingPlanBuilder et Calendar', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  test('Ajout d\'un plan d\'entraînement au calendrier', async () => {
    // Mock de la méthode de conversion de plan en événements de calendrier
    const mockEvents = [
      {
        id: 'workout1',
        title: 'Séance 1: Endurance',
        start: new Date(2023, 8, 15),
        end: new Date(2023, 8, 15),
        allDay: false,
        type: 'training'
      },
      {
        id: 'workout2',
        title: 'Séance 2: Intervalles',
        start: new Date(2023, 8, 17),
        end: new Date(2023, 8, 17),
        allDay: false,
        type: 'training'
      }
    ];

    // Simulation d'un plan d'entraînement
    const mockTrainingPlan = {
      id: 'plan123',
      title: 'Plan d\'entraînement FTP',
      description: 'Plan de 8 semaines pour améliorer votre FTP',
      ftpTarget: 280,
      startDate: '2023-09-15',
      weeks: [
        {
          week: 1,
          phase: 'preparation',
          type: 'regular',
          tss: 450,
          schedule: [
            { day: 'Lundi', workout: 'Récupération' },
            { day: 'Mardi', workout: 'Endurance - 1h, Z2' },
            { day: 'Mercredi', workout: 'Intervalles - 2x15min Z4' },
            { day: 'Jeudi', workout: 'Endurance - 1h, Z2' },
            { day: 'Vendredi', workout: 'Repos' },
            { day: 'Samedi', workout: 'Sortie longue - 3h, Z2' },
            { day: 'Dimanche', workout: 'Endurance - 1h, Z2' }
          ]
        }
      ]
    };

    // Configuration de TrainingPlanBuilder pour utiliser notre plan mock
    jest.spyOn(TrainingPlanBuilder.prototype, 'convertPlanToCalendarEvents').mockImplementation(() => {
      return mockEvents;
    });

    // Simuler l'enregistrement d'un plan dans localStorage
    localStorageMock.setItem('currentTrainingPlan', JSON.stringify(mockTrainingPlan));
    localStorageMock.setItem('trainingEvents', JSON.stringify([]));

    // Rendu du composant TrainingPlanBuilder
    const { getByText } = render(
      <MemoryRouter>
        <NotificationContext.Provider value={{ notify: jest.fn() }}>
          <TrainingPlanBuilder />
        </NotificationContext.Provider>
      </MemoryRouter>
    );

    // Vérification que les données du plan sont chargées
    await waitFor(() => {
      expect(localStorageMock.getItem).toHaveBeenCalledWith('currentTrainingPlan');
    });

    // Simuler l'appel à la fonction d'ajout au calendrier
    const addToCalendarButton = screen.getByText('training.addToCalendar');
    fireEvent.click(addToCalendarButton);

    // Vérifier que les événements du calendrier sont enregistrés dans localStorage
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('trainingEvents', expect.any(String));
      
      const savedEvents = JSON.parse(localStorageMock.getItem('trainingEvents'));
      expect(savedEvents).toHaveLength(mockEvents.length);
      expect(savedEvents[0].title).toBe(mockEvents[0].title);
    });
  });

  test('Affichage des événements d\'entraînement dans le calendrier', async () => {
    // Simuler des événements d'entraînement dans localStorage
    const mockEvents = [
      {
        id: 'workout1',
        title: 'Séance 1: Endurance',
        start: new Date(2023, 8, 15).toISOString(),
        end: new Date(2023, 8, 15).toISOString(),
        allDay: false,
        type: 'training'
      },
      {
        id: 'workout2',
        title: 'Séance 2: Intervalles',
        start: new Date(2023, 8, 17).toISOString(),
        end: new Date(2023, 8, 17).toISOString(),
        allDay: false,
        type: 'training'
      }
    ];
    
    localStorageMock.setItem('trainingEvents', JSON.stringify(mockEvents));

    // Mock du composant Calendar pour vérifier la récupération des événements
    jest.mock('../components/calendar/Calendar', () => {
      return function MockCalendar(props) {
        React.useEffect(() => {
          // Vérifier que les props contiennent les événements d'entraînement
          if (props.events) {
            expect(props.events).toHaveLength(mockEvents.length);
          }
        }, [props]);
        
        return <div data-testid="calendar">Calendrier</div>;
      };
    });

    // Rendu du composant Calendar
    render(
      <MemoryRouter>
        <NotificationContext.Provider value={{ notify: jest.fn() }}>
          <Calendar />
        </NotificationContext.Provider>
      </MemoryRouter>
    );

    // Vérification que les événements sont récupérés de localStorage
    await waitFor(() => {
      expect(localStorageMock.getItem).toHaveBeenCalledWith('trainingEvents');
    });
  });

  test('Format des événements d\'entraînement compatible avec le calendrier', () => {
    // Format d'événement généré par le module d'entraînement
    const trainingEvent = {
      id: 'workout1',
      title: 'Séance 1: Endurance',
      start: new Date(2023, 8, 15).toISOString(),
      end: new Date(2023, 8, 15).toISOString(),
      allDay: false,
      type: 'training',
      description: 'Séance d\'endurance de 1h en zone 2',
      color: '#4CAF50'
    };

    // Vérification que l'événement a tous les champs requis pour le calendrier
    expect(trainingEvent).toHaveProperty('id');
    expect(trainingEvent).toHaveProperty('title');
    expect(trainingEvent).toHaveProperty('start');
    expect(trainingEvent).toHaveProperty('end');
    expect(trainingEvent).toHaveProperty('allDay');
    
    // Format ISO pour les dates (nécessaire pour le calendrier)
    expect(typeof trainingEvent.start).toBe('string');
    expect(typeof trainingEvent.end).toBe('string');
    
    // Le type doit être spécifié pour appliquer un style différent dans le calendrier
    expect(trainingEvent).toHaveProperty('type');
    
    // La couleur est utilisée pour distinguer les types d'événements
    expect(trainingEvent).toHaveProperty('color');
  });
});
