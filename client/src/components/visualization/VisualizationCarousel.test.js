import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import VisualizationCarousel from './VisualizationCarousel';
import modernTheme from '../../theme/modernTheme';

// Mock pour Framer Motion pour éviter les problèmes de test animation
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock des données pour les tests
const mockItems = [
  {
    id: 'item-1',
    title: 'Col du Tourmalet',
    subtitle: 'Le géant des Pyrénées',
    image: '/images/cols/tourmalet.jpg',
    type: 'col',
    location: 'Pyrénées, France',
    stats: {
      difficulty: 'très difficile',
      distance: '19',
      elevation: '1404',
      views: '5248'
    },
    details: [
      { title: 'Histoire', content: 'Le Col du Tourmalet est le plus haut col routier des Pyrénées...' },
      { title: 'Conseils', content: 'Prévoyez de l\'eau en quantité suffisante.' }
    ],
    detailsUrl: '/cols/tourmalet',
    isFavorite: true,
    isBookmarked: false
  },
  {
    id: 'item-2',
    title: 'Col d\'Aubisque',
    subtitle: 'Un paysage exceptionnel',
    image: '/images/cols/aubisque.jpg',
    type: 'col',
    location: 'Pyrénées, France',
    stats: {
      difficulty: 'difficile',
      distance: '16',
      elevation: '1190',
      views: '3102'
    },
    detailsUrl: '/cols/aubisque',
    isFavorite: false,
    isBookmarked: true
  },
  {
    id: 'item-3',
    title: 'La Route des Crêtes',
    subtitle: 'Un parcours panoramique',
    image: '/images/routes/cretes.jpg',
    type: 'route',
    location: 'Vosges, France',
    stats: {
      difficulty: 'moyen',
      distance: '38',
      elevation: '980',
      views: '2187'
    },
    detailsUrl: '/routes/cretes',
    isFavorite: false,
    isBookmarked: false
  }
];

// Les fonctions mock pour les callbacks
const mockHandlers = {
  onFavoriteToggle: jest.fn(),
  onBookmarkToggle: jest.fn(),
  onShare: jest.fn()
};

// Fonction d'aide pour le rendu du composant
const renderCarousel = (props = {}) => {
  return render(
    <ThemeProvider theme={modernTheme}>
      <MemoryRouter>
        <VisualizationCarousel
          items={mockItems}
          {...mockHandlers}
          {...props}
        />
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('VisualizationCarousel Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders the carousel with title', () => {
    renderCarousel({ title: 'Cols Mythiques' });
    expect(screen.getByText('Cols Mythiques')).toBeInTheDocument();
  });

  test('renders the first item initially', () => {
    renderCarousel();
    expect(screen.getByText('Col du Tourmalet')).toBeInTheDocument();
    expect(screen.getByText('Le géant des Pyrénées')).toBeInTheDocument();
    expect(screen.getByText('Pyrénées, France')).toBeInTheDocument();
  });

  test('navigates to the next item when clicking the next arrow', () => {
    renderCarousel();
    
    // Vérifier que le premier élément est affiché
    expect(screen.getByText('Col du Tourmalet')).toBeInTheDocument();
    
    // Cliquer sur la flèche suivante
    fireEvent.click(screen.getByLabelText('Suivant'));
    
    // Vérifier que le deuxième élément est affiché
    expect(screen.getByText('Col d\'Aubisque')).toBeInTheDocument();
    expect(screen.getByText('Un paysage exceptionnel')).toBeInTheDocument();
  });

  test('navigates to the previous item when clicking the previous arrow', () => {
    renderCarousel();
    
    // Aller au deuxième élément
    fireEvent.click(screen.getByLabelText('Suivant'));
    expect(screen.getByText('Col d\'Aubisque')).toBeInTheDocument();
    
    // Cliquer sur la flèche précédente
    fireEvent.click(screen.getByLabelText('Précédent'));
    
    // Vérifier que le premier élément est affiché
    expect(screen.getByText('Col du Tourmalet')).toBeInTheDocument();
  });

  test('loops back to the first item when clicking next on the last item', () => {
    renderCarousel({ loop: true });
    
    // Aller au dernier élément
    fireEvent.click(screen.getByLabelText('Suivant'));
    fireEvent.click(screen.getByLabelText('Suivant'));
    expect(screen.getByText('La Route des Crêtes')).toBeInTheDocument();
    
    // Cliquer sur la flèche suivante (qui devrait boucler au premier élément)
    fireEvent.click(screen.getByLabelText('Suivant'));
    
    // Vérifier que le premier élément est affiché
    expect(screen.getByText('Col du Tourmalet')).toBeInTheDocument();
  });

  test('navigates to specific item when clicking on dot indicator', () => {
    renderCarousel();
    
    // Cliquer sur le troisième point
    const dots = screen.getAllByLabelText(/Aller à la diapositive/);
    fireEvent.click(dots[2]);
    
    // Vérifier que le troisième élément est affiché
    expect(screen.getByText('La Route des Crêtes')).toBeInTheDocument();
  });

  test('autoplay advances to the next slide after interval', () => {
    renderCarousel({ autoPlay: true, autoPlayInterval: 1000 });
    
    // Vérifier l'élément initial
    expect(screen.getByText('Col du Tourmalet')).toBeInTheDocument();
    
    // Avancer le temps
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Vérifier que le deuxième élément est affiché
    expect(screen.getByText('Col d\'Aubisque')).toBeInTheDocument();
    
    // Avancer encore le temps
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Vérifier que le troisième élément est affiché
    expect(screen.getByText('La Route des Crêtes')).toBeInTheDocument();
  });

  test('does not autoplay when autoPlay is false', () => {
    renderCarousel({ autoPlay: false });
    
    // Vérifier l'élément initial
    expect(screen.getByText('Col du Tourmalet')).toBeInTheDocument();
    
    // Avancer le temps
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    // Vérifier que le premier élément est toujours affiché
    expect(screen.getByText('Col du Tourmalet')).toBeInTheDocument();
  });

  test('renders "Voir tout" button when viewAllUrl is provided', () => {
    renderCarousel({ viewAllUrl: '/cols' });
    
    const viewAllButton = screen.getByText('Voir tout');
    expect(viewAllButton).toBeInTheDocument();
    expect(viewAllButton).toHaveAttribute('href', '/cols');
  });

  test('renders skeleton when loading is true', () => {
    renderCarousel({ loading: true });
    
    // Vérifier que le skeleton est rendu
    const skeletons = document.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
    
    // Vérifier que le contenu n'est pas rendu
    expect(screen.queryByText('Col du Tourmalet')).not.toBeInTheDocument();
  });

  test('renders empty state when no items are provided', () => {
    renderCarousel({ items: [] });
    
    expect(screen.getByText('Aucune visualisation disponible.')).toBeInTheDocument();
  });

  test('forwards interaction events to callback functions', () => {
    // Rendre le carrousel avec un élément spécifique en position initiale
    renderCarousel({ variant: 'expanded' });
    
    // Trouver et cliquer sur le bouton favori dans la carte
    fireEvent.click(screen.getByLabelText('Retirer des favoris'));
    
    // Vérifier que le callback a été appelé avec l'ID correct
    expect(mockHandlers.onFavoriteToggle).toHaveBeenCalledWith('item-1');
    
    // Aller au deuxième élément qui est marqué comme enregistré
    fireEvent.click(screen.getByLabelText('Suivant'));
    
    // Cliquer sur le bouton d'enregistrement
    fireEvent.click(screen.getByLabelText('Retirer des enregistrements'));
    
    // Vérifier que le callback a été appelé avec l'ID correct
    expect(mockHandlers.onBookmarkToggle).toHaveBeenCalledWith('item-2');
  });
});
