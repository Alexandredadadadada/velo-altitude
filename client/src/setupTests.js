import '@testing-library/jest-dom';
// Setup file for Jest tests
// This file is run before each test file

// Mock for Window methods and properties that aren't available in JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated but still used in some libraries
    removeListener: jest.fn(), // Deprecated as well
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// LocalStorage mock
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}

// Set up localStorage mock
Object.defineProperty(window, 'localStorage', {
  value: new LocalStorageMock(),
  writable: true
});

// Suppress React 18 specific console errors
const originalError = console.error;
console.error = (...args) => {
  // Ignore some specific React 18 warnings during tests
  if (
    args[0]?.includes('Warning: ReactDOM.render is no longer supported') ||
    args[0]?.includes('Warning: An update to') ||
    args[0]?.includes('Inside a test was not wrapped in act')
  ) {
    return;
  }
  originalError(...args);
};

// Mock for canvas and WebGL contexts
HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return {
      createShader: jest.fn(),
      createProgram: jest.fn(),
      uniform1f: jest.fn(),
      uniform2f: jest.fn(),
      uniform3f: jest.fn(),
      uniform4f: jest.fn(),
      clear: jest.fn(),
      drawElements: jest.fn(),
      viewport: jest.fn(),
      getUniformLocation: jest.fn(),
      getProgramParameter: jest.fn(),
      getShaderParameter: jest.fn(),
      getAttribLocation: jest.fn(),
      drawArrays: jest.fn(),
      bufferData: jest.fn(),
      getExtension: jest.fn(),
      bindBuffer: jest.fn(),
      vertexAttribPointer: jest.fn(),
      enableVertexAttribArray: jest.fn(),
      useProgram: jest.fn(),
      createBuffer: jest.fn(),
      shaderSource: jest.fn(),
      compileShader: jest.fn(),
      attachShader: jest.fn(),
      linkProgram: jest.fn(),
      VERTEX_SHADER: 'VERTEX_SHADER',
      FRAGMENT_SHADER: 'FRAGMENT_SHADER',
      ARRAY_BUFFER: 'ARRAY_BUFFER',
      STATIC_DRAW: 'STATIC_DRAW',
      FLOAT: 'FLOAT',
      TRIANGLE_STRIP: 'TRIANGLE_STRIP',
      TRIANGLES: 'TRIANGLES',
      LINES: 'LINES',
      getParameter: jest.fn().mockReturnValue(8),
    };
  }
  return {};
});

// Polyfills for ResizeObserver and IntersectionObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));
