// Step-by-step integration test to diagnose issues
import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Step-by-step Integration Test', () => {
  // Test 1: Simplest React component
  test('step 1: renders a simple React component', () => {
    const SimpleComponent = () => <div data-testid="simple">Simple Component</div>;
    render(<SimpleComponent />);
    expect(screen.getByTestId('simple')).toBeInTheDocument();
  });
  
  // Test 2: Component with React Router
  test('step 2: renders with React Router', () => {
    const { MemoryRouter } = require('react-router-dom');
    const RouterComponent = () => (
      <MemoryRouter>
        <div data-testid="router">Router Component</div>
      </MemoryRouter>
    );
    render(<RouterComponent />);
    expect(screen.getByTestId('router')).toBeInTheDocument();
  });
  
  // Test 3: Component with Context
  test('step 3: renders with Context', () => {
    const TestContext = React.createContext({ value: 'test' });
    const ContextComponent = () => {
      const context = React.useContext(TestContext);
      return <div data-testid="context">{context.value}</div>;
    };
    
    render(
      <TestContext.Provider value={{ value: 'test value' }}>
        <ContextComponent />
      </TestContext.Provider>
    );
    
    expect(screen.getByTestId('context')).toBeInTheDocument();
    expect(screen.getByText('test value')).toBeInTheDocument();
  });
  
  // Test 4: Component with localStorage
  test('step 4: interacts with localStorage', () => {
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    const LocalStorageComponent = () => {
      React.useEffect(() => {
        localStorage.setItem('test-key', 'test-value');
      }, []);
      
      return <div data-testid="local-storage">LocalStorage Component</div>;
    };
    
    render(<LocalStorageComponent />);
    expect(screen.getByTestId('local-storage')).toBeInTheDocument();
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', 'test-value');
  });
  
  // Test 5: All elements combined
  test('step 5: combines all elements', () => {
    const { MemoryRouter } = require('react-router-dom');
    const TestContext = React.createContext({ value: 'test' });
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(() => null),
      setItem: jest.fn(),
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    const CombinedComponent = () => {
      const context = React.useContext(TestContext);
      
      React.useEffect(() => {
        localStorage.setItem('combined-key', context.value);
      }, [context.value]);
      
      return <div data-testid="combined">{context.value}</div>;
    };
    
    render(
      <MemoryRouter>
        <TestContext.Provider value={{ value: 'combined value' }}>
          <CombinedComponent />
        </TestContext.Provider>
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('combined')).toBeInTheDocument();
    expect(screen.getByText('combined value')).toBeInTheDocument();
    expect(localStorageMock.setItem).toHaveBeenCalledWith('combined-key', 'combined value');
  });
});
