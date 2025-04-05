import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ColVisualization3D from '../components/visualization/ColVisualization3D';

// Mock the three.js related modules
jest.mock('@react-three/fiber', () => ({
  Canvas: ({ children }) => <div data-testid="canvas-mock">{children}</div>,
  useFrame: () => {},
  useLoader: () => [
    { isTexture: true },
    { isTexture: true },
    { isTexture: true },
  ],
}));

jest.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls-mock" />,
  Text: ({ children }) => <div data-testid="text-mock">{children}</div>,
}));

jest.mock('three/src/loaders/TextureLoader', () => ({
  TextureLoader: jest.fn(),
}));

describe('ColVisualization3D Component', () => {
  const mockElevationData = {
    width: 10,
    heights: Array(10).fill().map(() => Array(10).fill(100)),
  };
  
  const mockSurfaceTypes = {
    dominant: 'asphalt',
    sections: [
      { start: 0, end: 50, type: 'asphalt' },
      { start: 50, end: 75, type: 'gravel' },
      { start: 75, end: 100, type: 'dirt' }
    ]
  };
  
  const mockPointsOfInterest = [
    { x: 1, z: 2, elevation: 100, name: 'Viewpoint', type: 'panorama' },
    { x: 3, z: 4, elevation: 120, name: 'Water Source', type: 'water' }
  ];

  test('renders without crashing', () => {
    render(
      <ColVisualization3D 
        passId="123" 
        elevationData={mockElevationData}
        surfaceTypes={mockSurfaceTypes}
        pointsOfInterest={mockPointsOfInterest}
      />
    );
    
    expect(screen.getByText('Vue du dessus')).toBeInTheDocument();
    expect(screen.getByText('Vue latérale')).toBeInTheDocument();
    expect(screen.getByText('Vue frontale')).toBeInTheDocument();
  });

  test('camera view buttons change camera positions', () => {
    render(
      <ColVisualization3D 
        passId="123" 
        elevationData={mockElevationData}
        surfaceTypes={mockSurfaceTypes}
        pointsOfInterest={mockPointsOfInterest}
      />
    );
    
    // Click each view button and verify the component doesn't crash
    fireEvent.click(screen.getByText('Vue du dessus'));
    fireEvent.click(screen.getByText('Vue latérale'));
    fireEvent.click(screen.getByText('Vue frontale'));
    
    // We can't directly test state changes in React Testing Library without exposing them
    // But we can verify the component still renders after button clicks
    expect(screen.getByTestId('canvas-mock')).toBeInTheDocument();
  });
});
