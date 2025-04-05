import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import GlobalNavigation from '../GlobalNavigation';
import { createTheme } from '@mui/material/styles';

// Mock des dépendances externes
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'nav.home': 'Accueil',
        'nav.cols': 'Cols',
        'nav.training': 'Entraînement',
        'nav.nutrition': 'Nutrition',
        'nav.routes': 'Parcours',
        'nav.social': 'Social',
        'nav.challenges': 'Défis',
        'nav.colsExplorer': 'Explorateur de cols',
        'nav.trainingPlans': 'Plans d\'entraînement',
        'common.openMenu': 'Ouvrir le menu',
        'common.closeMenu': 'Fermer le menu',
        'common.mainNavigation': 'Navigation principale',
        'common.clickToSeeSubmenu': 'Cliquer pour voir le sous-menu'
      };
      return translations[key] || key;
    }
  })
}));

// Mock des composants chargés avec lazy loading
jest.mock('../../common/Header', () => {
  return function MockHeader({ onMenuClick }) {
    return (
      <header>
        <button 
          onClick={onMenuClick} 
          data-testid="menu-toggle-button"
          aria-label="Ouvrir le menu"
        >
          Menu
        </button>
      </header>
    );
  };
});

// Configuration
const mockTheme = createTheme();

// Wrapper pour les tests
const TestWrapper = ({ children }) => (
  <MuiThemeProvider theme={mockTheme}>
    <MemoryRouter>
      {children}
    </MemoryRouter>
  </MuiThemeProvider>
);

describe('GlobalNavigation Component', () => {
  beforeEach(() => {
    // Reset des mocks et de l'état entre les tests
    jest.clearAllMocks();
    
    // Mock des media queries
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false, // Simuler desktop par défaut
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  test('should render desktop navigation correctly', async () => {
    render(
      <TestWrapper>
        <GlobalNavigation />
      </TestWrapper>
    );
    
    // Attendre le chargement des composants lazy-loaded
    await waitFor(() => {
      expect(screen.getByTestId('menu-toggle-button')).toBeInTheDocument();
    });
    
    // Vérifier que les éléments de navigation principaux sont présents
    expect(screen.getByText('Accueil')).toBeInTheDocument();
    expect(screen.getByText('Cols')).toBeInTheDocument();
    expect(screen.getByText('Entraînement')).toBeInTheDocument();
    expect(screen.getByText('Nutrition')).toBeInTheDocument();
  });
  
  test('should toggle drawer when menu button is clicked', async () => {
    render(
      <TestWrapper>
        <GlobalNavigation />
      </TestWrapper>
    );
    
    // Attendre le chargement des composants lazy-loaded
    await waitFor(() => {
      expect(screen.getByTestId('menu-toggle-button')).toBeInTheDocument();
    });
    
    // Cliquer sur le bouton menu
    act(() => {
      fireEvent.click(screen.getByTestId('menu-toggle-button'));
    });
    
    // Vérifier que le drawer est ouvert
    await waitFor(() => {
      const closeButton = screen.getByLabelText('Fermer le menu');
      expect(closeButton).toBeInTheDocument();
    });
    
    // Fermer le drawer
    act(() => {
      fireEvent.click(screen.getByLabelText('Fermer le menu'));
    });
    
    // Vérifier que le drawer est fermé
    await waitFor(() => {
      expect(screen.queryByLabelText('Fermer le menu')).not.toBeInTheDocument();
    });
  });
  
  test('should toggle submenu when parent item is clicked', async () => {
    // Simuler le mode desktop
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    
    render(
      <TestWrapper>
        <GlobalNavigation />
      </TestWrapper>
    );
    
    // Attendre le chargement des composants lazy-loaded
    await waitFor(() => {
      expect(screen.getByTestId('menu-toggle-button')).toBeInTheDocument();
    });
    
    // Cliquer sur un élément parent avec sous-menu
    act(() => {
      fireEvent.click(screen.getByText('Cols'));
    });
    
    // Vérifier que le sous-menu est affiché
    await waitFor(() => {
      expect(screen.getByText('Explorateur de cols')).toBeInTheDocument();
    });
    
    // Cliquer à nouveau pour fermer le sous-menu
    act(() => {
      fireEvent.click(screen.getByText('Cols'));
    });
    
    // Vérifier que le sous-menu est fermé
    await waitFor(() => {
      expect(screen.queryByText('Explorateur de cols')).not.toBeInTheDocument();
    });
  });
  
  test('should respond to mobile view correctly', async () => {
    // Simuler le mode mobile
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query.includes('(max-width'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    
    render(
      <TestWrapper>
        <GlobalNavigation />
      </TestWrapper>
    );
    
    // Attendre le chargement des composants lazy-loaded
    await waitFor(() => {
      expect(screen.getByTestId('menu-toggle-button')).toBeInTheDocument();
    });
    
    // Vérifier que la barre de navigation desktop n'est pas visible
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    
    // Ouvrir le menu mobile
    act(() => {
      fireEvent.click(screen.getByTestId('menu-toggle-button'));
    });
    
    // Vérifier que le drawer mobile est ouvert
    await waitFor(() => {
      expect(screen.getByLabelText('Fermer le menu')).toBeInTheDocument();
      expect(screen.getByText('Accueil')).toBeInTheDocument();
    });
  });
  
  test('should meet accessibility requirements', async () => {
    render(
      <TestWrapper>
        <GlobalNavigation />
      </TestWrapper>
    );
    
    // Attendre le chargement des composants lazy-loaded
    await waitFor(() => {
      expect(screen.getByTestId('menu-toggle-button')).toBeInTheDocument();
    });
    
    // Vérifier les attributs ARIA pour la navigation
    const navigation = screen.getByLabelText('Navigation principale');
    expect(navigation).toBeInTheDocument();
    expect(navigation).toHaveAttribute('aria-label', 'Navigation principale');
    
    // Vérifier l'accessibilité du bouton de menu
    const menuButton = screen.getByTestId('menu-toggle-button');
    expect(menuButton).toHaveAttribute('aria-label', 'Ouvrir le menu');
  });
});
