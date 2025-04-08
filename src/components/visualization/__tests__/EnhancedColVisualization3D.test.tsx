import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedColVisualization3D from '../EnhancedColVisualization3D';

// Mock react-three-fiber to avoid WebGL context issues in tests
jest.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas-mock">{children}</div>,
  useFrame: () => {},
  useLoader: () => [null, null, null],
  useThree: () => ({ gl: { dispose: jest.fn() } }),
}));

// Mock drei components
jest.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  Text: ({ children }: { children: React.ReactNode }) => <div data-testid="drei-text">{children}</div>,
}));

// Mock Three.js
jest.mock('three', () => ({
  WebGLRenderer: jest.fn(),
  Scene: jest.fn(),
  PerspectiveCamera: jest.fn(),
  RepeatWrapping: 'repeat',
  DoubleSide: 'double-side',
  TextureLoader: jest.fn(),
  Mesh: jest.fn(),
}));

// Sample test data
const minimalElevationData = {
  heights: [[0, 0], [0, 0]],
  width: 2,
};

const viewportDimensions = {
  width: 800,
  height: 600,
};

const defaultInteractionMode = {
  rotate: true,
  pan: true,
  zoom: true,
};

describe('EnhancedColVisualization3D', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders with minimal elevation data', async () => {
    render(
      <EnhancedColVisualization3D
        elevationData={minimalElevationData}
        viewportDimensions={viewportDimensions}
        renderQuality="2d"
        interactionMode={defaultInteractionMode}
      />
    );

    // Verify loading screen appears first
    expect(screen.getByText('Loading 3D visualization...')).toBeInTheDocument();

    // Wait for the canvas to be rendered (loading is done)
    await waitFor(() => {
      expect(screen.queryByText('Loading 3D visualization...')).not.toBeInTheDocument();
    });

    // Verify control buttons are rendered
    expect(screen.getByText('Top View')).toBeInTheDocument();
    expect(screen.getByText('Side View')).toBeInTheDocument();
    expect(screen.getByText('Front View')).toBeInTheDocument();
    expect(screen.getByText('Default View')).toBeInTheDocument();
  });

  test('handles viewport resize', async () => {
    const { rerender } = render(
      <EnhancedColVisualization3D
        elevationData={minimalElevationData}
        viewportDimensions={viewportDimensions}
        renderQuality="2d"
        interactionMode={defaultInteractionMode}
      />
    );

    // Get initial container
    const initialContainer = screen.getByClassName('col-visualization-container');
    expect(initialContainer).toHaveStyle(`height: ${viewportDimensions.height}px`);
    expect(initialContainer).toHaveStyle(`width: ${viewportDimensions.width}px`);

    // Resize viewport
    const resizedViewport = {
      width: 1024,
      height: 768,
    };

    // Re-render with new dimensions
    rerender(
      <EnhancedColVisualization3D
        elevationData={minimalElevationData}
        viewportDimensions={resizedViewport}
        renderQuality="2d"
        interactionMode={defaultInteractionMode}
      />
    );

    // Check if container dimensions are updated
    const resizedContainer = screen.getByClassName('col-visualization-container');
    expect(resizedContainer).toHaveStyle(`height: ${resizedViewport.height}px`);
    expect(resizedContainer).toHaveStyle(`width: ${resizedViewport.width}px`);
  });

  test('manages memory cleanup', () => {
    // Create spy for useEffect cleanup function
    const useEffectCleanupSpy = jest.fn();
    jest.spyOn(React, 'useEffect').mockImplementation((callback) => {
      const cleanup = callback();
      if (cleanup) {
        useEffectCleanupSpy.mockImplementation(cleanup);
      }
      return undefined;
    });

    const { unmount } = render(
      <EnhancedColVisualization3D
        elevationData={minimalElevationData}
        viewportDimensions={viewportDimensions}
        renderQuality="2d"
        interactionMode={defaultInteractionMode}
      />
    );

    // Unmount to trigger cleanup
    unmount();

    // Verify cleanup function was called
    expect(useEffectCleanupSpy).toHaveBeenCalled();
  });

  test('optimizes re-renders', () => {
    // Create a spy for React.memo's comparison function
    const memoCompareSpy = jest.spyOn(React, 'memo');

    render(
      <EnhancedColVisualization3D
        elevationData={minimalElevationData}
        viewportDimensions={viewportDimensions}
        renderQuality="2d"
        interactionMode={defaultInteractionMode}
      />
    );

    // Verify React.memo was used
    expect(memoCompareSpy).toHaveBeenCalled();

    // Additional verification could be done with a more complex setup
    // that tracks actual render counts, but that would require more complex test setup
  });

  test('handles invalid elevation data gracefully', () => {
    // @ts-ignore - deliberately passing invalid data for testing
    render(
      <EnhancedColVisualization3D
        elevationData={null}
        viewportDimensions={viewportDimensions}
        renderQuality="2d"
        interactionMode={defaultInteractionMode}
      />
    );

    // Check for error message
    expect(screen.getByText('Missing or invalid elevation data')).toBeInTheDocument();
  });

  test('displays points of interest when provided', async () => {
    const pointsOfInterest = [
      { x: 1, z: 1, name: 'Test Point 1', type: 'restaurant' },
      { x: 2, z: 2, name: 'Test Point 2', type: 'viewpoint' },
    ];

    render(
      <EnhancedColVisualization3D
        elevationData={minimalElevationData}
        viewportDimensions={viewportDimensions}
        renderQuality="2d"
        interactionMode={defaultInteractionMode}
        pointsOfInterest={pointsOfInterest}
      />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading 3D visualization...')).not.toBeInTheDocument();
    });

    // Since we're mocking the Three.js components, we can't directly test
    // if the points of interest are rendered, but we can check that the component
    // doesn't crash when points of interest are provided
    expect(screen.getByText('Top View')).toBeInTheDocument();
  });
});
