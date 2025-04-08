/**
 * Mock global pour ThemeManager
 */

const mockThemeManager = {
  initialize: jest.fn(),
  isDarkModeEnabled: jest.fn().mockReturnValue(false),
  setDarkMode: jest.fn(),
  addThemeListener: jest.fn(callback => {
    // Store the callback for later use in tests
    mockThemeManager._lastCallback = callback;
    return jest.fn(); // Return unsubscribe function
  }),
  removeThemeListener: jest.fn(),
  toggleDarkMode: jest.fn(),
  setDarkModeBasedOnSystemPreference: jest.fn(),
  updateMetaTags: jest.fn(),
  resetPreferences: jest.fn(),
  setupSystemPreferenceListener: jest.fn(),
  notifyListeners: jest.fn(),
  setupToggle: jest.fn(),
  isInitialized: false,
  
  // Methods for testing
  _simulateThemeChange(isDarkMode) {
    this.isDarkModeEnabled.mockReturnValue(isDarkMode);
    if (this._lastCallback) {
      this._lastCallback(isDarkMode);
    }
    return isDarkMode;
  },
  
  _reset() {
    this.isDarkModeEnabled.mockReturnValue(false);
    this._lastCallback = null;
    this.isInitialized = false;
    
    // Reset all the mocks
    Object.values(this)
      .filter(value => typeof value === 'function' && value.mockClear)
      .forEach(mockFn => mockFn.mockClear());
  }
};

export default mockThemeManager;
