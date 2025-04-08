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

// Mock des modules externes
jest.mock('../materialTheme', () => ({
  toggleTheme: jest.fn(),
  getCurrentTheme: jest.fn().mockImplementation(() => ({
    palette: {
      mode: 'light',
      background: { default: '#ffffff' },
      primary: { main: '#1976d2' }
    }
  }))
}));

describe('ThemeProvider Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.classList.remove('dark-mode');
    
    // Réinitialiser les mocks
    themeManager.isDarkModeEnabled.mockReturnValue(false);
    getCurrentTheme.mockImplementation(() => ({
      palette: {
        mode: 'light',
        background: { default: '#ffffff' },
        primary: { main: '#1976d2' }
      }
    }));
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
    
    // Simuler le passage au thème sombre
    act(() => {
      // Mettre à jour le mock pour getCurrentTheme
      getCurrentTheme.mockImplementation(() => ({
        palette: {
          mode: 'dark',
          background: { default: '#121212' },
          primary: { main: '#90caf9' }
        }
      }));
      
      // Déclencher le callback avec le thème sombre
      themeManager._simulateThemeChange(true);
      
      // Appeler toggleTheme pour simuler un clic sur le bouton de bascule
      toggleTheme();
    });
    
    // Vérifier que le thème a changé
    expect(screen.getByTestId('theme-mode').textContent).toBe('dark');
    
    // Simuler un autre toggle pour revenir au mode clair
    act(() => {
      // Mise à jour de getCurrentTheme pour le thème clair
      getCurrentTheme.mockImplementation(() => ({
        palette: {
          mode: 'light',
          background: { default: '#ffffff' },
          primary: { main: '#1976d2' }
        }
      }));
      
      // Déclencher le callback avec le thème clair
      themeManager._simulateThemeChange(false);
      
      // Appeler toggleTheme à nouveau
      toggleTheme();
    });
    
    // Vérifier que nous sommes revenus au mode clair
    expect(screen.getByTestId('theme-mode').textContent).toBe('light');
  });
  
  test('should properly apply theme values to Material-UI components', () => {
    // Définir des valeurs spécifiques pour le test
    getCurrentTheme.mockImplementation(() => ({
      palette: {
        mode: 'light',
        background: { default: '#ffffff' },
        primary: { main: '#ff0000' }
      }
    }));
    
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    // Vérifier que les valeurs du thème sont correctement appliquées
    expect(screen.getByTestId('primary-color').textContent).toBe('#ff0000');
    expect(screen.getByTestId('bg-color').textContent).toBe('#ffffff');
    
    // Simuler le passage en mode sombre
    act(() => {
      getCurrentTheme.mockImplementation(() => ({
        palette: {
          mode: 'dark',
          background: { default: '#121212' },
          primary: { main: '#00ff00' }
        }
      }));
      
      themeManager._simulateThemeChange(true);
    });
    
    // En mode sombre, les couleurs devraient être différentes
    expect(screen.getByTestId('bg-color').textContent).toBe('#121212');
    expect(screen.getByTestId('primary-color').textContent).toBe('#00ff00');
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
