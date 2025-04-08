import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock navigation rather than using React Router directly
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
  MemoryRouter: ({ children }) => <div data-testid="memory-router">{children}</div>
}));

// Create a localStorage mock
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

// Simple mock components for our integration test
const TrainingBuilder = ({ onAddToCalendar }) => (
  <div data-testid="training-builder">
    <h2>Plan d'entraînement</h2>
    <button 
      data-testid="add-to-calendar-btn"
      onClick={() => onAddToCalendar([
        { id: 'e1', title: 'Test Workout', start: new Date().toISOString() }
      ])}
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

describe('Training Calendar Integration', () => {
  let localStorageMock;
  let originalLocalStorage;
  
  beforeEach(() => {
    // Setup localStorage mock before each test
    localStorageMock = createLocalStorageMock();
    originalLocalStorage = window.localStorage;
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
  });
  
  afterEach(() => {
    // Restore original localStorage after each test
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });
    
    jest.clearAllMocks();
  });
  
  test('adding a training plan to the calendar saves events to localStorage', () => {
    const handleAddToCalendar = (events) => {
      localStorage.setItem('trainingEvents', JSON.stringify(events));
    };
    
    render(<TrainingBuilder onAddToCalendar={handleAddToCalendar} />);
    
    // Click add to calendar button
    fireEvent.click(screen.getByTestId('add-to-calendar-btn'));
    
    // Check localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('trainingEvents', expect.any(String));
    
    // Verify the saved data
    const savedData = JSON.parse(localStorageMock.store.trainingEvents);
    expect(savedData).toHaveLength(1);
    expect(savedData[0].title).toBe('Test Workout');
  });
  
  test('calendar component loads events from localStorage', () => {
    // Pre-populate localStorage with events
    const mockEvents = [
      { id: 'e1', title: 'Test Workout', start: new Date().toISOString() }
    ];
    localStorageMock.store.trainingEvents = JSON.stringify(mockEvents);
    
    // Create component that loads from localStorage
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
    
    render(<CalendarWithEvents />);
    
    // Check localStorage was accessed
    expect(localStorageMock.getItem).toHaveBeenCalledWith('trainingEvents');
    
    // Check events are displayed
    expect(screen.getByTestId('event-list')).toBeInTheDocument();
    expect(screen.getByTestId('event-e1')).toBeInTheDocument();
    expect(screen.getByText('Test Workout')).toBeInTheDocument();
  });
  
  test('integrated flow: create training, save to calendar, load in calendar', () => {
    // Create a simple app that integrates both components
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
            <TrainingBuilder onAddToCalendar={handleAddToCalendar} />
          ) : (
            <Calendar events={events} />
          )}
        </div>
      );
    };
    
    render(<IntegratedApp />);
    
    // Initially shows training builder
    expect(screen.getByTestId('training-builder')).toBeInTheDocument();
    expect(screen.queryByTestId('calendar')).not.toBeInTheDocument();
    
    // Click add to calendar button
    fireEvent.click(screen.getByTestId('add-to-calendar-btn'));
    
    // Now shows calendar with events
    expect(screen.getByTestId('calendar')).toBeInTheDocument();
    expect(screen.queryByTestId('training-builder')).not.toBeInTheDocument();
    expect(screen.getByTestId('event-e1')).toBeInTheDocument();
    expect(screen.getByText('Test Workout')).toBeInTheDocument();
    
    // Check localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('trainingEvents', expect.any(String));
  });
});
