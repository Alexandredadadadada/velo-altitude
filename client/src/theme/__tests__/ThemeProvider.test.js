import React from 'react';
import { render, act, screen } from '@testing-library/react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useTheme, Button } from '@mui/material';
import ThemeProvider from '../ThemeProvider';
import { toggleTheme, getCurrentTheme } from '../materialTheme';
import themeManager from '../../utils/ThemeManager';

// Composant de test qui affiche la couleur de fond actuelle
const TestComponent = () => {
  const theme = useTheme();
  return (
    <div data-testid="theme-test">
      <div data-testid="theme-mode">{theme.palette.mode}</div>
      <div data-testid="bg-color">{theme.palette.background.default}</div>
      <div data-testid="primary-color">{theme.palette.primary.main}</div>
      <Button data-testid="mui-button" variant="contained">Test Button</Button>
    </div>
  );
};

// Mock de ThemeManager
jest.mock('../../utils/ThemeManager', () => ({
  initialize: jest.fn(),
  isDarkModeEnabled: jest.fn(),
  addThemeListener: jest.fn(),
  removeThemeListener: jest.fn(),
  toggleDarkMode: jest.fn(),
  isInitialized: false
}));

describe('ThemeProvider Component', () => {
  let themeListenerCallback;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurer le mode initial (light par défaut)
    themeManager.isDarkModeEnabled.mockReturnValue(false);
    
    // Capturer le callback pour simuler les changements de thème
    themeManager.addThemeListener.mockImplementation((callback) => {
      themeListenerCallback = callback;
      return () => {};
    });
    
    // Simuler le toggle
    themeManager.toggleDarkMode.mockImplementation(() => {
      const newMode = !themeManager.isDarkModeEnabled();
      themeManager.isDarkModeEnabled.mockReturnValue(newMode);
      if (themeListenerCallback) {
        themeListenerCallback(newMode);
      }
      return newMode;
    });
  });

  test('should render with light theme by default', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('theme-mode').textContent).toBe('light');
    expect(themeManager.initialize).toHaveBeenCalled();
    expect(themeManager.addThemeListener).toHaveBeenCalled();
  });
  
  test('should toggle between light and dark theme', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    // Vérifier le thème initial
    expect(screen.getByTestId('theme-mode').textContent).toBe('light');
    
    // Simuler le toggle vers le mode sombre
    act(() => {
      toggleTheme();
    });
    
    // Vérifier que le thème a changé
    expect(screen.getByTestId('theme-mode').textContent).toBe('dark');
    
    // Simuler un autre toggle pour revenir au mode clair
    act(() => {
      toggleTheme();
    });
    
    // Vérifier que nous sommes revenus au mode clair
    expect(screen.getByTestId('theme-mode').textContent).toBe('light');
  });
  
  test('should properly apply theme values to Material-UI components', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    // Vérifier que les composants Material-UI reçoivent correctement le thème
    const button = screen.getByTestId('mui-button');
    
    // En mode clair, le bouton doit avoir une couleur de fond égale à primary.main
    const lightTheme = getCurrentTheme();
    expect(getComputedStyle(button).backgroundColor).toBe(lightTheme.palette.primary.main);
    
    // Simuler le passage en mode sombre
    act(() => {
      toggleTheme();
    });
    
    // En mode sombre, les couleurs devraient être différentes
    const darkTheme = getCurrentTheme();
    expect(screen.getByTestId('bg-color').textContent).toBe(darkTheme.palette.background.default);
    expect(screen.getByTestId('primary-color').textContent).toBe(darkTheme.palette.primary.main);
  });
  
  test('should clean up theme listener on unmount', () => {
    const { unmount } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    unmount();
    
    // Vérifier que le removeThemeListener a été appelé
    expect(themeManager.removeThemeListener).toHaveBeenCalled();
  });
});
