# Testing Guide - Velo-Altitude

## Test Configuration

The project uses Jest with React Testing Library for component testing. The test environment is configured to handle both JavaScript and TypeScript files.

### Key Files

- `jest.config.js`: Main Jest configuration
- `src/setupTests.js`: Jest setup file that runs before each test
- `src/__mocks__/`: Directory containing mock implementations for non-JS modules

### Configuration Details

The Jest configuration provides:

- JSDOM environment for simulating browser API
- Support for TypeScript files using ts-jest
- Mocking for CSS files and static assets (images, etc.)
- Special handling for node_modules that need transformation
- Coverage reporting that excludes certain directories

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- path/to/test.js

# Run tests in watch mode
npm test -- --watch
```

## Writing Tests

### Component Testing

Use React Testing Library to test components:

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Mocking Dependencies

For tests that need to mock API calls or other dependencies, use Jest's mocking capabilities:

```jsx
jest.mock('../api/yourApiModule', () => ({
  fetchData: jest.fn().mockResolvedValue({ data: 'mocked data' })
}));
```

## Known Issues

1. Some tests may fail with act() warnings. This usually means the test needs to be updated to properly wait for asynchronous operations.

2. Tests referencing out-of-scope variables in jest.mock() calls need to be refactored to use variables defined within the mock factory.

3. Component tests may fail if they rely on global context providers (ThemeProvider, AuthProvider, etc.) which should be added to the test render.
