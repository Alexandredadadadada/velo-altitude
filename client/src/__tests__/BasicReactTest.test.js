import React from 'react';
import { render, screen } from '@testing-library/react';

// A simple test component
const TestComponent = () => {
  return (
    <div data-testid="simple-component">
      <h1>Hello Testing World</h1>
      <p>This is a simple test component</p>
    </div>
  );
};

describe('Basic React Component Tests', () => {
  test('renders without crashing', () => {
    render(<TestComponent />);
    
    const element = screen.getByTestId('simple-component');
    expect(element).toBeInTheDocument();
    
    const heading = screen.getByText(/Hello Testing World/i);
    expect(heading).toBeInTheDocument();
    
    const paragraph = screen.getByText(/This is a simple test component/i);
    expect(paragraph).toBeInTheDocument();
  });
  
  test('basic jest assertions are working', () => {
    // Basic Jest assertions
    expect(1 + 1).toBe(2);
    expect(true).toBeTruthy();
    expect(false).toBeFalsy();
    expect('test').toBe('test');
    expect([1, 2, 3]).toContain(2);
    expect({ name: 'test' }).toHaveProperty('name');
  });
});
