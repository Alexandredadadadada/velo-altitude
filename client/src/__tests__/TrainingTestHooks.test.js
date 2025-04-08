import React, { useState, useEffect } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';

// A simple hook that simulates the training builder behavior
const useSimpleTraining = (initialPlan = null) => {
  const [plan, setPlan] = useState(initialPlan || { title: 'Default Plan', weeks: [] });
  const [events, setEvents] = useState([]);

  // Method to convert plan to calendar events
  const convertToEvents = () => {
    return [
      {
        id: 'event1',
        title: `Workout from ${plan.title}`,
        start: new Date(),
        end: new Date(),
        type: 'training'
      }
    ];
  };

  // Method to add to calendar
  const addToCalendar = () => {
    const newEvents = convertToEvents();
    setEvents(newEvents);
    
    // Store in localStorage for testing
    localStorage.setItem('testEvents', JSON.stringify(newEvents));
    return newEvents;
  };

  return {
    plan,
    events,
    convertToEvents,
    addToCalendar,
    updatePlan: (newPlan) => setPlan(newPlan)
  };
};

// Simple component that uses the hook
const SimpleTrainingComponent = () => {
  const { plan, addToCalendar } = useSimpleTraining({ 
    title: 'Test Plan', 
    weeks: [{ week: 1, workouts: ['Workout 1', 'Workout 2'] }] 
  });

  return (
    <div data-testid="training-component">
      <h2>{plan.title}</h2>
      <button data-testid="add-to-calendar-btn" onClick={addToCalendar}>
        Add to Calendar
      </button>
    </div>
  );
};

// Set up localStorage mock
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
  value: localStorageMock,
  writable: true
});

describe('Training Hook Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  test('hook initializes with provided plan', () => {
    const { result } = renderHook(() => 
      useSimpleTraining({ title: 'Custom Plan', weeks: [{ week: 1 }] })
    );
    
    expect(result.current.plan.title).toBe('Custom Plan');
    expect(result.current.plan.weeks).toHaveLength(1);
  });

  test('hook converts plan to events correctly', () => {
    const { result } = renderHook(() => 
      useSimpleTraining({ title: 'Event Test Plan', weeks: [] })
    );
    
    const events = result.current.convertToEvents();
    expect(events).toHaveLength(1);
    expect(events[0].title).toContain('Event Test Plan');
    expect(events[0].type).toBe('training');
  });

  test('component renders and handles click correctly', () => {
    render(<SimpleTrainingComponent />);
    
    // Component renders correctly
    expect(screen.getByTestId('training-component')).toBeInTheDocument();
    expect(screen.getByText('Test Plan')).toBeInTheDocument();
    
    // Click the button
    fireEvent.click(screen.getByTestId('add-to-calendar-btn'));
    
    // Check localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('testEvents', expect.any(String));
    
    // Get the stored events
    const storedEvents = JSON.parse(localStorageMock.getItem('testEvents'));
    expect(storedEvents[0].title).toContain('Test Plan');
  });
});
