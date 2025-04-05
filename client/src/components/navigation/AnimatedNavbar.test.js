import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import AnimatedNavbar from './AnimatedNavbar';
import modernTheme from '../../theme/modernTheme';

// Mock des hooks et contextes
jest.mock('@mui/material/useMediaQuery');
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    logout: jest.fn(),
  }),
}));

// Fonction d'aide pour le rendu du composant
const renderNavbar = (userMock = null) => {
  // Override le mock useAuth pour ce test spécifique si nécessaire
  if (userMock !== null) {
    require('../../hooks/useAuth').useAuth.mockImplementation(() => ({
      user: userMock,
      logout: jest.fn(),
    }));
  }

  return render(
    <ThemeProvider theme={modernTheme}>
      <MemoryRouter>
        <AnimatedNavbar />
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('AnimatedNavbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders desktop navigation with correct links', () => {
    // Simule un écran desktop
    useMediaQuery.mockReturnValue(false); // isMobile = false
    
    renderNavbar();
    
    // Vérifie la présence du logo
    expect(screen.getByText(/Grand Est Cyclisme/i)).toBeInTheDocument();
    
    // Vérifie la présence des liens de navigation
    expect(screen.getByText(/Accueil/i)).toBeInTheDocument();
    expect(screen.getByText(/Cols/i)).toBeInTheDocument();
    expect(screen.getByText(/Parcours/i)).toBeInTheDocument();
    expect(screen.getByText(/Événements/i)).toBeInTheDocument();
    expect(screen.getByText(/Communauté/i)).toBeInTheDocument();
    expect(screen.getByText(/Outils/i)).toBeInTheDocument();
    
    // Vérifie la présence des boutons d'authentification pour un utilisateur non connecté
    expect(screen.getByText(/Connexion/i)).toBeInTheDocument();
    expect(screen.getByText(/Inscription/i)).toBeInTheDocument();
  });

  test('renders mobile navigation with hamburger menu', () => {
    // Simule un écran mobile
    useMediaQuery.mockReturnValue(true); // isMobile = true
    
    renderNavbar();
    
    // Vérifie la présence du logo
    expect(screen.getByText(/Grand Est Cyclisme/i)).toBeInTheDocument();
    
    // Vérifie la présence du bouton de menu hamburger
    expect(screen.getByLabelText(/menu/i)).toBeInTheDocument();
    
    // Vérifie que les liens ne sont pas visibles initialement
    expect(screen.queryByText(/Accueil/i)).not.toBeVisible();
  });

  test('opens and closes mobile drawer correctly', async () => {
    // Simule un écran mobile
    useMediaQuery.mockReturnValue(true); // isMobile = true
    
    renderNavbar();
    
    // Vérifie que le drawer est initialement fermé
    expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
    
    // Clique sur le bouton hamburger
    fireEvent.click(screen.getByLabelText(/menu/i));
    
    // Attend que le drawer s'ouvre
    await waitFor(() => {
      expect(screen.getByRole('presentation')).toBeInTheDocument();
      expect(screen.getByText(/Accueil/i)).toBeVisible();
    });
    
    // Ferme le drawer en cliquant sur le bouton de fermeture
    fireEvent.click(screen.getByLabelText(/close/i));
    
    // Attend que le drawer se ferme
    await waitFor(() => {
      expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
    });
  });

  test('displays user menu when user is logged in (desktop)', () => {
    // Simule un écran desktop
    useMediaQuery.mockReturnValue(false); // isMobile = false
    
    // Mock d'un utilisateur connecté
    const userMock = {
      name: 'Test User',
      avatar: 'https://example.com/avatar.jpg'
    };
    
    renderNavbar(userMock);
    
    // Vérifie que le nom de l'utilisateur est affiché
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    
    // Vérifie que l'icône de notification est présente
    expect(screen.getByTestId('NotificationsIcon')).toBeInTheDocument();
    
    // Clique sur le menu utilisateur
    fireEvent.click(screen.getByText(/Test User/i));
    
    // Vérifie que le menu déroulant s'ouvre
    expect(screen.getByText(/Mon Profil/i)).toBeInTheDocument();
    expect(screen.getByText(/Paramètres/i)).toBeInTheDocument();
    expect(screen.getByText(/Déconnexion/i)).toBeInTheDocument();
  });

  test('highlights active route based on current location', () => {
    // Simule un écran desktop
    useMediaQuery.mockReturnValue(false); // isMobile = false
    
    // Utilise MemoryRouter avec une route initiale spécifique
    render(
      <ThemeProvider theme={modernTheme}>
        <MemoryRouter initialEntries={['/cols']}>
          <AnimatedNavbar />
        </MemoryRouter>
      </ThemeProvider>
    );
    
    // Vérifie que le lien "Cols" a la classe active
    const colsLink = screen.getByText(/Cols/i).closest('button');
    expect(colsLink).toHaveAttribute('active', '1');
    
    // Vérifie que les autres liens n'ont pas la classe active
    const homeLink = screen.getByText(/Accueil/i).closest('button');
    expect(homeLink).toHaveAttribute('active', '0');
  });

  test('scrolling changes navbar appearance', async () => {
    // Simule un écran desktop
    useMediaQuery.mockReturnValue(false); // isMobile = false
    
    renderNavbar();
    
    // Simule un événement de défilement
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    fireEvent.scroll(window);
    
    // Attend que la barre de navigation change d'apparence
    await waitFor(() => {
      const appBar = document.querySelector('.MuiAppBar-root');
      // Vérifie que la hauteur a changé (à adapter selon l'implémentation exacte)
      expect(appBar).toHaveStyle({ height: '64px' });
    });
  });
});
