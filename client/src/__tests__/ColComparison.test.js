import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ColComparison from '../components/visualization/ColComparison';

// Mock the components and dependencies
jest.mock('../components/visualization/ColVisualization3D', () => {
  return function DummyColVisualization({ passId }) {
    return <div data-testid={`visualization-${passId}`}>Visualization Mock</div>;
  };
});

jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
    RadarChart: ({ children }) => <div data-testid="radar-chart">{children}</div>,
    Line: () => <div>Line</div>,
    Bar: () => <div>Bar</div>,
    Radar: () => <div>Radar</div>,
    XAxis: () => <div>XAxis</div>,
    YAxis: () => <div>YAxis</div>,
    CartesianGrid: () => <div>CartesianGrid</div>,
    Legend: () => <div>Legend</div>,
    Tooltip: () => <div>Tooltip</div>,
    PolarGrid: () => <div>PolarGrid</div>,
    PolarAngleAxis: () => <div>PolarAngleAxis</div>,
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn(),
    },
  }),
}));

jest.mock('html2canvas', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve({
    toDataURL: jest.fn(() => 'data:image/png;base64,mockBase64'),
    width: 1000,
    height: 500,
  })),
}));

jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    addImage: jest.fn(),
    save: jest.fn(),
    internal: {
      pageSize: {
        getWidth: jest.fn(() => 210),
        getHeight: jest.fn(() => 297),
      },
    },
  })),
}));

// Mock fetch API
global.fetch = jest.fn((url) => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      id: url.includes('1') ? '1' : '2',
      name: url.includes('1') ? 'Col 1' : 'Col 2',
      elevation: url.includes('1') ? 1200 : 1500,
      length: url.includes('1') ? 8.5 : 10.2,
      gradient: url.includes('1') ? 7.5 : 8.3,
      difficulty: url.includes('1') ? 3 : 4,
      elevationData: {
        width: 10,
        heights: Array(10).fill().map(() => Array(10).fill(1000))
      },
      surfaceTypes: {
        dominant: url.includes('1') ? 'asphalt' : 'gravel',
        sections: [
          { start: 0, end: 50, type: 'asphalt' },
          { start: 50, end: 100, type: 'gravel' }
        ]
      },
      elevationProfile: Array(20).fill().map((_, i) => ({
        distance: i * 0.5,
        elevation: 1000 + (i * 20)
      })),
      weatherStats: {
        temperature: 15,
        wind: 10,
        precipitation: 20,
        sunshine: 70
      }
    }),
  });
});

describe('ColComparison Component', () => {
  beforeEach(() => {
    global.fetch.mockClear();
  });

  test('renders loading state initially', () => {
    render(<ColComparison pass1Id="1" pass2Id="2" />);
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  test('renders comparison view after data loading', async () => {
    render(<ColComparison pass1Id="1" pass2Id="2" />);
    
    await waitFor(() => {
      // Check if the loading state disappears
      expect(screen.queryByText('loading')).not.toBeInTheDocument();
    });
    
    // Check if the comparison header is rendered
    expect(screen.getByText(/comparing/)).toBeInTheDocument();
    
    // Check if both visualizations are rendered
    expect(screen.getByTestId('visualization-1')).toBeInTheDocument();
    expect(screen.getByTestId('visualization-2')).toBeInTheDocument();
    
    // Check if charts are rendered
    expect(screen.getAllByTestId('responsive-container').length).toBeGreaterThan(0);
    
    // Check if export button is rendered
    expect(screen.getByText('exportPDF')).toBeInTheDocument();
  });

  test('export button triggers PDF generation', async () => {
    render(<ColComparison pass1Id="1" pass2Id="2" />);
    
    await waitFor(() => {
      expect(screen.queryByText('loading')).not.toBeInTheDocument();
    });
    
    const exportButton = screen.getByText('exportPDF');
    fireEvent.click(exportButton);
    
    // We can't directly test PDF generation, but we can check if the mock was called
    await waitFor(() => {
      expect(require('html2canvas').default).toHaveBeenCalled();
    });
  });
});
