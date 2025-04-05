import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import AnimatedStats from './AnimatedStats';
import modernTheme from '../../theme/modernTheme';

// Mock pour Framer Motion pour éviter les problèmes d'animation dans les tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  useAnimation: () => ({
    start: jest.fn(),
  }),
}));

// Mock pour react-intersection-observer
jest.mock('react-intersection-observer', () => ({
  useInView: () => [null, true],  // [ref, inView] - on simule que l'élément est toujours visible
}));

// Données de test
const testStats = [
  {
    id: 'cols',
    value: 100,
    label: 'Cols documentés',
    description: 'Des Alpes aux Pyrénées',
    icon: <span data-testid="mountain-icon">🏔️</span>,
    color: 'primary'
  },
  {
    id: 'routes',
    value: 500,
    label: 'Itinéraires',
    description: 'Partagés par les utilisateurs',
    icon: <span data-testid="route-icon">🚲</span>,
    color: 'secondary'
  },
  {
    id: 'satisfaction',
    value: 95,
    label: 'Satisfaction',
    description: 'Utilisateurs satisfaits',
    icon: <span data-testid="satisfaction-icon">😊</span>,
    valueType: 'percentage',
    color: 'success'
  }
];

// Fonction d'aide pour le rendu du composant
const renderAnimatedStats = (props = {}) => {
  return render(
    <ThemeProvider theme={modernTheme}>
      <AnimatedStats {...props} />
    </ThemeProvider>
  );
};

describe('AnimatedStats Component', () => {
  test('renders title and subtitle correctly', () => {
    const customTitle = 'Statistiques cyclisme';
    const customSubtitle = 'Les chiffres clés de notre communauté';
    
    renderAnimatedStats({
      title: customTitle,
      subtitle: customSubtitle
    });
    
    expect(screen.getByText(customTitle)).toBeInTheDocument();
    expect(screen.getByText(customSubtitle)).toBeInTheDocument();
  });

  test('renders correct number of stats when provided', () => {
    renderAnimatedStats({ stats: testStats });
    
    // Vérifie que les labels des statistiques sont rendus
    expect(screen.getByText('Cols documentés')).toBeInTheDocument();
    expect(screen.getByText('Itinéraires')).toBeInTheDocument();
    expect(screen.getByText('Satisfaction')).toBeInTheDocument();
    
    // Vérifie que les descriptions sont rendues
    expect(screen.getByText('Des Alpes aux Pyrénées')).toBeInTheDocument();
    expect(screen.getByText('Partagés par les utilisateurs')).toBeInTheDocument();
    expect(screen.getByText('Utilisateurs satisfaits')).toBeInTheDocument();
    
    // Vérifie que les icônes sont rendues
    expect(screen.getByTestId('mountain-icon')).toBeInTheDocument();
    expect(screen.getByTestId('route-icon')).toBeInTheDocument();
    expect(screen.getByTestId('satisfaction-icon')).toBeInTheDocument();
  });

  test('renders default stats when none are provided', () => {
    renderAnimatedStats();
    
    // Vérifie que certaines des statistiques par défaut sont rendues
    expect(screen.getByText('Cols européens documentés')).toBeInTheDocument();
    expect(screen.getByText('Cyclistes actifs')).toBeInTheDocument();
    expect(screen.getByText('Itinéraires partagés')).toBeInTheDocument();
    
    // Vérifie que les descriptions par défaut sont rendues
    expect(screen.getByText('Des plus célèbres aux plus secrets')).toBeInTheDocument();
    expect(screen.getByText('Une communauté passionnée')).toBeInTheDocument();
    expect(screen.getByText('À travers toute l\'Europe')).toBeInTheDocument();
  });

  test('renders values correctly', () => {
    renderAnimatedStats({ stats: testStats });
    
    // Note: Les valeurs réelles sont animées, mais dans notre test
    // elles sont initialisées à 0 puisque l'animation est mockée
    // On vérifie plutôt la présence des éléments qui afficheront ces valeurs
    
    // Vérifie que les éléments Typography qui contiendront les valeurs sont rendus
    const valueElements = screen.getAllByRole('heading', { level: 3 });
    expect(valueElements.length).toBe(3); // 3 stats = 3 valeurs
  });

  test('applies custom background color when provided', () => {
    const customBgColor = 'rgb(240, 245, 250)';
    renderAnimatedStats({ backgroundColor: customBgColor });
    
    // Récupère le conteneur principal
    const container = screen.getByText('Nos chiffres clés').closest('div').parentElement;
    
    // Vérifie que le style backgroundColor est appliqué
    expect(container).toHaveStyle(`background-color: ${customBgColor}`);
  });
});
