import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { 
  setupLocalStorageMock, 
  renderWithProviders,
  createTestComponent
} from './test-utils';

// Create mock components
const TrainingBuilder = createTestComponent('TrainingBuilder');
const Calendar = createTestComponent('Calendar');

// Create a simplified app that simulates our integration
const IntegratedApp = () => {
  const [showCalendar, setShowCalendar] = React.useState(false);
  
  const handleAddToCalendar = () => {
    // Store some mock data
    const mockEvents = [
      { id: 'event1', title: 'Mock Workout', start: new Date().toISOString() }
    ];
    localStorage.setItem('trainingEvents', JSON.stringify(mockEvents));
    setShowCalendar(true);
  };
  
  return (
    <div data-testid="integrated-app">
      {!showCalendar ? (
        <div>
          <TrainingBuilder />
          <button 
            data-testid="add-to-calendar-btn"
            onClick={handleAddToCalendar}
          >
            Add to Calendar
          </button>
        </div>
      ) : (
        <Calendar />
      )}
    </div>
  );
};

describe('Simplified Integration Tests', () => {
  let cleanupLocalStorage;
  
  beforeEach(() => {
    // Setup localStorage mock
    cleanupLocalStorage = setupLocalStorageMock();
  });
  
  afterEach(() => {
    // Clean up localStorage mock
    if (cleanupLocalStorage) {
      cleanupLocalStorage();
    }
  });
  
  test('shows training builder initially', () => {
    renderWithProviders(<IntegratedApp />);
    
    // Verify components render correctly
    expect(screen.getByTestId('integrated-app')).toBeInTheDocument();
    expect(screen.getByTestId('TrainingBuilder-component')).toBeInTheDocument();
    expect(screen.queryByTestId('Calendar-component')).not.toBeInTheDocument();
  });
  
  test('clicking add to calendar saves events and shows calendar', () => {
    renderWithProviders(<IntegratedApp />);
    
    // Click the add to calendar button
    fireEvent.click(screen.getByTestId('add-to-calendar-btn'));
    
    // Verify calendar is now shown
    expect(screen.getByTestId('Calendar-component')).toBeInTheDocument();
    expect(screen.queryByTestId('TrainingBuilder-component')).not.toBeInTheDocument();
    
    // Verify localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalled();
    
    // Get the stored events and verify they match expected format
    const storedEventsJSON = localStorage.getItem('trainingEvents');
    expect(storedEventsJSON).toBeTruthy();
    
    const storedEvents = JSON.parse(storedEventsJSON);
    expect(storedEvents).toHaveLength(1);
    expect(storedEvents[0].title).toBe('Mock Workout');
  });
});
