// Progressive test file to identify issues
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';

// Start with minimal tests that should definitely work
describe('Progressive Integration Tests', () => {
  // Level 1: Basic Jest assertions
  test('level 1: basic assertions work', () => {
    expect(true).toBe(true);
    expect(1 + 1).toBe(2);
    expect({}).toEqual({});
    expect([1, 2, 3]).toHaveLength(3);
  });

  // Level 2: Simple React component rendering
  test('level 2: simple component rendering works', () => {
    const SimpleComponent = () => <div data-testid="simple">Simple</div>;
    render(<SimpleComponent />);
    expect(screen.getByTestId('simple')).toBeInTheDocument();
  });

  // Level 3: Component state and events
  test('level 3: component state and events work', () => {
    const StateComponent = () => {
      const [clicked, setClicked] = React.useState(false);
      return (
        <div data-testid="state-component">
          <button 
            data-testid="state-button" 
            onClick={() => setClicked(true)}
          >
            Click me
          </button>
          {clicked && <span data-testid="state-result">Clicked!</span>}
        </div>
      );
    };
    
    render(<StateComponent />);
    expect(screen.getByTestId('state-component')).toBeInTheDocument();
    expect(screen.queryByTestId('state-result')).not.toBeInTheDocument();
    
    fireEvent.click(screen.getByTestId('state-button'));
    expect(screen.getByTestId('state-result')).toBeInTheDocument();
  });
  
  // Level 4: Mock functions
  test('level 4: mock functions work', () => {
    const mockFn = jest.fn();
    const MockComponent = ({ onClick }) => (
      <button data-testid="mock-button" onClick={onClick}>
        Click for mock
      </button>
    );
    
    render(<MockComponent onClick={mockFn} />);
    fireEvent.click(screen.getByTestId('mock-button'));
    
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
  
  // Level 5: React Router
  test('level 5: React Router works', () => {
    const Home = () => <div data-testid="home-page">Home Page</div>;
    const About = () => <div data-testid="about-page">About Page</div>;
    
    const App = () => (
      <div>
        <nav>
          <Link to="/" data-testid="home-link">Home</Link>
          <Link to="/about" data-testid="about-link">About</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    );
    
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    
    // Initially on home page
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.queryByTestId('about-page')).not.toBeInTheDocument();
    
    // Navigate to about page
    fireEvent.click(screen.getByTestId('about-link'));
    expect(screen.getByTestId('about-page')).toBeInTheDocument();
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
  });
  
  // Level 6: localStorage
  test('level 6: localStorage works', () => {
    // Create localStorage mock
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => {
          store[key] = value.toString();
        }),
        clear: jest.fn(() => {
          store = {};
        })
      };
    })();
    
    // Replace window.localStorage with mock
    const originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    try {
      // Component that uses localStorage
      const LocalStorageComponent = () => {
        const [data, setData] = React.useState(null);
        
        const saveData = () => {
          const testData = { id: 1, value: 'test' };
          localStorage.setItem('testData', JSON.stringify(testData));
          setData(testData);
        };
        
        return (
          <div>
            <button data-testid="save-button" onClick={saveData}>Save Data</button>
            {data && <div data-testid="saved-data">Data Saved: {data.value}</div>}
          </div>
        );
      };
      
      render(<LocalStorageComponent />);
      
      // Click save button
      fireEvent.click(screen.getByTestId('save-button'));
      
      // Check data was saved
      expect(localStorageMock.setItem).toHaveBeenCalledWith('testData', '{"id":1,"value":"test"}');
      expect(screen.getByTestId('saved-data')).toHaveContent('Data Saved: test');
    } finally {
      // Restore original localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true
      });
    }
  });
  
  // Level 7: Combined (Router + localStorage)
  test('level 7: Router and localStorage combined work', () => {
    // Create localStorage mock
    const localStorageMock = (() => {
      let store = {};
      return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => {
          store[key] = value.toString();
        }),
        clear: jest.fn(() => {
          store = {};
        })
      };
    })();
    
    // Replace window.localStorage with mock
    const originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
    
    try {
      // Components
      const Home = () => {
        const saveData = () => {
          localStorage.setItem('visited', 'true');
        };
        
        return (
          <div data-testid="home-page">
            <h1>Home</h1>
            <button data-testid="save-btn" onClick={saveData}>Save Visit</button>
            <Link to="/dashboard" data-testid="dashboard-link">Go to Dashboard</Link>
          </div>
        );
      };
      
      const Dashboard = () => {
        const [visited, setVisited] = React.useState(false);
        
        React.useEffect(() => {
          const wasVisited = localStorage.getItem('visited') === 'true';
          setVisited(wasVisited);
        }, []);
        
        return (
          <div data-testid="dashboard-page">
            <h1>Dashboard</h1>
            {visited && <div data-testid="visited-message">You visited home!</div>}
            <Link to="/" data-testid="home-link">Back to Home</Link>
          </div>
        );
      };
      
      const App = () => (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      );
      
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );
      
      // Check we're on home page
      expect(screen.getByTestId('home-page')).toBeInTheDocument();
      
      // Click save button to save to localStorage
      fireEvent.click(screen.getByTestId('save-btn'));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('visited', 'true');
      
      // Navigate to dashboard
      fireEvent.click(screen.getByTestId('dashboard-link'));
      
      // Check localStorage value was used
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
      expect(screen.getByTestId('visited-message')).toBeInTheDocument();
    } finally {
      // Restore original localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true
      });
    }
  });
});
