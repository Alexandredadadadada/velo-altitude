import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlternativeRoutes from '../components/visualization/AlternativeRoutes';

// Mock the Leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Polyline: ({ children }) => <div data-testid="polyline">{children}</div>,
  Marker: ({ children }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({
    fitBounds: jest.fn(),
  }),
}));

// Mock Leaflet
jest.mock('leaflet', () => ({
  Icon: {
    Default: {
      prototype: {
        _getIconUrl: null,
      },
      mergeOptions: jest.fn(),
    },
  },
  latLngBounds: jest.fn().mockImplementation(() => ({
    extend: jest.fn().mockReturnThis(),
  })),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn(),
    },
  }),
}));

// Mock fetch API
global.fetch = jest.fn((url) => {
  if (url.includes('/api/routes/')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id: '123',
        name: 'Test Route',
        mainRoute: {
          coordinates: [
            [48.8566, 2.3522],
            [48.85, 2.34],
            [48.84, 2.35],
            [48.83, 2.36]
          ],
          distance: 25,
          elevation: 650,
          surfaceType: 'asphalt'
        },
        alternatives: [
          {
            id: '1',
            name: 'Alternative 1',
            weatherCondition: 'rain',
            coordinates: [
              [48.8566, 2.3522],
              [48.85, 2.35],
              [48.84, 2.36],
              [48.83, 2.36]
            ],
            distance: 27,
            elevation: 600,
            surfaceType: 'gravel'
          },
          {
            id: '2',
            name: 'Alternative 2',
            weatherCondition: 'wind',
            coordinates: [
              [48.8566, 2.3522],
              [48.86, 2.34],
              [48.85, 2.36],
              [48.83, 2.36]
            ],
            distance: 30,
            elevation: 550,
            surfaceType: 'dirt'
          }
        ]
      }),
    });
  } else {
    // Weather data mock
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        temperature: 15,
        condition: 'sunny',
        wind: {
          speed: 10,
          direction: 180
        },
        precipitation: 20
      }),
    });
  }
});

describe('AlternativeRoutes Component', () => {
  beforeEach(() => {
    global.fetch.mockClear();
  });

  test('renders loading state initially', () => {
    render(<AlternativeRoutes mainRouteId="123" />);
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  test('renders route data and map after loading', async () => {
    render(<AlternativeRoutes mainRouteId="123" />);
    
    await waitFor(() => {
      expect(screen.queryByText('loading')).not.toBeInTheDocument();
    });
    
    // Check if the header is rendered
    expect(screen.getByText(/alternativeRoutes/)).toBeInTheDocument();
    
    // Check if the map container is rendered
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    
    // Check if profile selector buttons are rendered
    expect(screen.getByText('sportif')).toBeInTheDocument();
    expect(screen.getByText('touristique')).toBeInTheDocument();
    expect(screen.getByText('famille')).toBeInTheDocument();
    
    // Check if recommended route section is rendered
    expect(screen.getByText('recommendedRoute')).toBeInTheDocument();
    
    // Check if surface types legend is rendered
    expect(screen.getByText('surfaceTypes')).toBeInTheDocument();
  });

  test('changes selected profile when clicking profile buttons', async () => {
    render(<AlternativeRoutes mainRouteId="123" />);
    
    await waitFor(() => {
      expect(screen.queryByText('loading')).not.toBeInTheDocument();
    });
    
    // Sportif is default selected profile
    const sportifButton = screen.getByText('sportif');
    const touristiqueButton = screen.getByText('touristique');
    const familleButton = screen.getByText('famille');
    
    // Click on touristique button
    fireEvent.click(touristiqueButton);
    
    // The recommendation text should change to include touristique preferences
    expect(screen.getByText(/touristiquePreferences/)).toBeInTheDocument();
    
    // Click on famille button
    fireEvent.click(familleButton);
    
    // The recommendation text should change to include famille preferences
    expect(screen.getByText(/famillePreferences/)).toBeInTheDocument();
    
    // Click on sportif button
    fireEvent.click(sportifButton);
    
    // The recommendation text should change back to sportif preferences
    expect(screen.getByText(/sportifPreferences/)).toBeInTheDocument();
  });
});
