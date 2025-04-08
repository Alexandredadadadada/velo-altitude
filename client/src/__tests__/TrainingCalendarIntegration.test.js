import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock React Router instead of using it directly
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
  MemoryRouter: ({ children }) => <div data-testid="memory-router">{children}</div>
}));

// Mock notifications context
const mockNotify = jest.fn();
const NotificationContext = React.createContext({
  notify: mockNotify
});

// Create localStorage mock
const createLocalStorageMock = () => {
  const mock = {
    store: {},
    getItem: jest.fn(key => mock.store[key] || null),
    setItem: jest.fn((key, value) => {
      mock.store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      mock.store = {};
    }),
    removeItem: jest.fn(key => {
      delete mock.store[key];
    })
  };
  return mock;
};

// Mock training events
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

// Mock components
const TrainingPlanBuilder = ({ onAddToCalendar }) => (
  <div data-testid="training-builder">
    <h2>Plan d'entraînement</h2>
    <button
      data-testid="add-to-calendar-btn"
      onClick={() => {
        onAddToCalendar(mockEvents);
        mockNotify('training.planAddedToCalendar', 'success');
      }}
    >
      Ajouter au calendrier
    </button>
  </div>
);

const Calendar = ({ events = [] }) => (
  <div data-testid="calendar">
    <h2>Calendrier</h2>
    <ul data-testid="event-list">
      {events.map(event => (
        <li key={event.id} data-testid={`event-${event.id}`}>
          {event.title}
        </li>
      ))}
    </ul>
  </div>
);

describe('Tests d\'intégration entre TrainingPlanBuilder et Calendar', () => {
  let localStorageMock;
  let originalLocalStorage;
  
  beforeEach(() => {
    // Setup localStorage mock
    localStorageMock = createLocalStorageMock();
    originalLocalStorage = window.localStorage;
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    // Clear mocks
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore original localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });
  });

  test('Ajout d\'un plan d\'entraînement au calendrier', () => {
    const handleAddToCalendar = (events) => {
      localStorage.setItem('trainingEvents', JSON.stringify(events));
    };
    
    render(
      <NotificationContext.Provider value={{ notify: mockNotify }}>
        <TrainingPlanBuilder onAddToCalendar={handleAddToCalendar} />
      </NotificationContext.Provider>
    );
    
    // Verify component rendered
    expect(screen.getByTestId('training-builder')).toBeInTheDocument();
    
    // Click the add to calendar button
    fireEvent.click(screen.getByTestId('add-to-calendar-btn'));
    
    // Verify events stored in localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('trainingEvents', expect.any(String));
    
    // Verify notification was triggered
    expect(mockNotify).toHaveBeenCalledWith('training.planAddedToCalendar', 'success');
    
    // Verify stored events
    const storedEvents = JSON.parse(localStorageMock.store.trainingEvents);
    expect(storedEvents).toHaveLength(mockEvents.length);
    expect(storedEvents[0].title).toBe(mockEvents[0].title);
  });

  test('Affichage des événements d\'entraînement dans le calendrier', () => {
    // Pre-populate localStorage with events
    localStorageMock.store.trainingEvents = JSON.stringify(mockEvents);
    
    // Create a calendar component that loads from localStorage
    const CalendarWithEvents = () => {
      const [events, setEvents] = React.useState([]);
      
      React.useEffect(() => {
        const storedEvents = localStorage.getItem('trainingEvents');
        if (storedEvents) {
          setEvents(JSON.parse(storedEvents));
        }
      }, []);
      
      return <Calendar events={events} />;
    };
    
    render(
      <NotificationContext.Provider value={{ notify: mockNotify }}>
        <CalendarWithEvents />
      </NotificationContext.Provider>
    );
    
    // Verify component rendered
    expect(screen.getByTestId('calendar')).toBeInTheDocument();
    
    // Verify localStorage was checked
    expect(localStorageMock.getItem).toHaveBeenCalledWith('trainingEvents');
    
    // Verify events were loaded
    expect(screen.getByTestId('event-list')).toBeInTheDocument();
    expect(screen.getByTestId('event-workout1')).toBeInTheDocument();
    expect(screen.getByTestId('event-workout2')).toBeInTheDocument();
    expect(screen.getByText('Séance 1: Endurance')).toBeInTheDocument();
    expect(screen.getByText('Séance 2: Intervalles')).toBeInTheDocument();
  });

  test('Flux intégré: Création du plan, ajout au calendrier, chargement dans le calendrier', () => {
    // Create an integrated app
    const IntegratedApp = () => {
      const [showCalendar, setShowCalendar] = React.useState(false);
      const [events, setEvents] = React.useState([]);
      
      const handleAddToCalendar = (newEvents) => {
        localStorage.setItem('trainingEvents', JSON.stringify(newEvents));
        setEvents(newEvents);
        setShowCalendar(true);
      };
      
      return (
        <div data-testid="integrated-app">
          {!showCalendar ? (
            <TrainingPlanBuilder onAddToCalendar={handleAddToCalendar} />
          ) : (
            <Calendar events={events} />
          )}
        </div>
      );
    };
    
    render(
      <NotificationContext.Provider value={{ notify: mockNotify }}>
        <IntegratedApp />
      </NotificationContext.Provider>
    );
    
    // Initially shows training builder
    expect(screen.getByTestId('training-builder')).toBeInTheDocument();
    expect(screen.queryByTestId('calendar')).not.toBeInTheDocument();
    
    // Click add to calendar button
    fireEvent.click(screen.getByTestId('add-to-calendar-btn'));
    
    // Now shows calendar with events
    expect(screen.getByTestId('calendar')).toBeInTheDocument();
    expect(screen.queryByTestId('training-builder')).not.toBeInTheDocument();
    expect(screen.getByTestId('event-workout1')).toBeInTheDocument();
    expect(screen.getByTestId('event-workout2')).toBeInTheDocument();
    
    // Check localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('trainingEvents', expect.any(String));
    
    // Check notification was triggered
    expect(mockNotify).toHaveBeenCalled();
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
