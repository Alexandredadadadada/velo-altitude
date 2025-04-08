import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Create a standard notification context for tests
export const NotificationContext = React.createContext({
  notify: jest.fn()
});

// Create a localStorage mock that can be reused
export const createLocalStorageMock = () => {
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

// Add localStorage mock to window
export const setupLocalStorageMock = () => {
  const mock = createLocalStorageMock();
  const originalLocalStorage = window.localStorage;
  
  Object.defineProperty(window, 'localStorage', {
    value: mock,
    writable: true
  });
  
  // Return a cleanup function to restore the original
  return () => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true
    });
  };
};

// Custom render with providers for tests
export const renderWithProviders = (ui, options = {}) => {
  const {
    route = '/',
    notifyMock = jest.fn(),
    ...renderOptions
  } = options;
  
  return render(
    <MemoryRouter initialEntries={[route]}>
      <NotificationContext.Provider value={{ notify: notifyMock }}>
        {ui}
      </NotificationContext.Provider>
    </MemoryRouter>,
    renderOptions
  );
};

// Create a mock component for testing
export const createTestComponent = (name, props = {}) => {
  return function TestComponent() {
    return (
      <div data-testid={`${name}-component`}>
        <h2>{name} Component</h2>
        <pre>{JSON.stringify(props, null, 2)}</pre>
      </div>
    );
  };
};
