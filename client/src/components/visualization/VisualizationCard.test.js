import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import VisualizationCard from './VisualizationCard';
import modernTheme from '../../theme/modernTheme';

// Mock de props pour les tests
const mockProps = {
  id: 'vis-1',
  title: 'Col du Galibier',
  subtitle: 'Un des plus beaux cols des Alpes',
  image: '/images/cols/galibier.jpg',
  type: 'col',
  location: 'Alpes, France',
  stats: {
    difficulty: 'difficile',
    distance: '23',
    elevation: '1245',
    views: '3248'
  },
  details: [
    { title: 'Histoire', content: 'Le Col du Galibier est un col mythique du Tour de France...' },
    { title: 'Conseils', content: 'Prévoyez des vêtements chauds même en été.' }
  ],
  detailsUrl: '/cols/galibier',
  isFavorite: false,
  isBookmarked: false,
  onFavoriteToggle: jest.fn(),
  onBookmarkToggle: jest.fn(),
  onShare: jest.fn()
};

// Fonction d'aide pour le rendu du composant
const renderCard = (props = {}, variant = 'compact') => {
  return render(
    <ThemeProvider theme={modernTheme}>
      <MemoryRouter>
        <VisualizationCard {...mockProps} {...props} variant={variant} />
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('VisualizationCard Component', () => {
  test('renders title and location in compact mode', () => {
    renderCard();
    
    expect(screen.getByText('Col du Galibier')).toBeInTheDocument();
    expect(screen.getByText('Alpes, France')).toBeInTheDocument();
  });

  test('renders expanded card with all information', () => {
    renderCard({}, 'expanded');
    
    // Vérifie le titre et la localisation
    expect(screen.getByText('Col du Galibier')).toBeInTheDocument();
    expect(screen.getByText('Alpes, France')).toBeInTheDocument();
    
    // Vérifie la description
    expect(screen.getByText('Un des plus beaux cols des Alpes')).toBeInTheDocument();
    
    // Vérifie les statistiques
    expect(screen.getByText('23 km')).toBeInTheDocument();
    expect(screen.getByText('1245 m D+')).toBeInTheDocument();
    expect(screen.getByText('3248 vues')).toBeInTheDocument();
    
    // Vérifie la puce de difficulté
    expect(screen.getByText('Difficulté: difficile')).toBeInTheDocument();
  });

  test('shows type badge correctly', () => {
    renderCard();
    
    // Vérifie le badge de type pour un col
    expect(screen.getByText('Col')).toBeInTheDocument();
    
    // Re-render avec type 'route'
    renderCard({ type: 'route' });
    
    // Vérifie le badge de type pour un parcours
    expect(screen.getByText('Parcours')).toBeInTheDocument();
  });

  test('toggles favorite status on button click', () => {
    renderCard({}, 'expanded');
    
    // Clique sur le bouton favori
    fireEvent.click(screen.getByLabelText('Ajouter aux favoris'));
    
    // Vérifie que la fonction de callback a été appelée avec l'ID correct
    expect(mockProps.onFavoriteToggle).toHaveBeenCalledWith('vis-1');
  });

  test('toggles bookmark status on button click', () => {
    renderCard();
    
    // Clique sur le bouton d'enregistrement
    fireEvent.click(screen.getByLabelText('Enregistrer'));
    
    // Vérifie que la fonction de callback a été appelée avec l'ID correct
    expect(mockProps.onBookmarkToggle).toHaveBeenCalledWith('vis-1');
  });

  test('navigates to details URL when details button is clicked', () => {
    renderCard({}, 'expanded');
    
    // Vérifie que le lien de détails est correctement configuré
    const detailsButton = screen.getByRole('link', { name: /détails/i });
    expect(detailsButton).toHaveAttribute('href', '/cols/galibier');
  });

  test('expands and collapses details section correctly', () => {
    renderCard({}, 'expanded');
    
    // Vérifie que les détails ne sont pas visibles initialement
    expect(screen.queryByText('Histoire')).not.toBeInTheDocument();
    
    // Clique sur le bouton d'expansion
    fireEvent.click(screen.getByLabelText('Afficher plus'));
    
    // Vérifie que les détails sont maintenant visibles
    expect(screen.getByText('Histoire')).toBeInTheDocument();
    expect(screen.getByText('Le Col du Galibier est un col mythique du Tour de France...')).toBeInTheDocument();
    expect(screen.getByText('Conseils')).toBeInTheDocument();
    expect(screen.getByText('Prévoyez des vêtements chauds même en été.')).toBeInTheDocument();
    
    // Clique à nouveau pour réduire
    fireEvent.click(screen.getByLabelText('Afficher plus'));
    
    // Vérifie que les détails ne sont plus visibles
    // Note: Nous utilisons queryByText car getByText échouerait si l'élément n'est pas trouvé
    expect(screen.queryByText('Histoire')).not.toBeInTheDocument();
  });

  test('share button works correctly', () => {
    renderCard({}, 'expanded');
    
    // Clique sur le bouton de partage
    fireEvent.click(screen.getByText('Partager'));
    
    // Vérifie que la fonction de callback a été appelée avec l'ID correct
    expect(mockProps.onShare).toHaveBeenCalledWith('vis-1');
  });

  test('displays favorite icon when item is favorite', () => {
    renderCard({ isFavorite: true });
    
    // Vérifie que l'icône de favori est présente
    const favoriteIcon = screen.getByLabelText('Retirer des favoris');
    expect(favoriteIcon).toBeInTheDocument();
  });

  test('displays bookmark icon when item is bookmarked', () => {
    renderCard({ isBookmarked: true });
    
    // Vérifie que l'icône d'enregistrement est présente
    const bookmarkIcon = screen.getByLabelText('Retirer des enregistrements');
    expect(bookmarkIcon).toBeInTheDocument();
  });
});
