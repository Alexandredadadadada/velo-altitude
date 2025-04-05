import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RouteSharing from '../RouteSharing';
import { RouteService } from '../../../services/routeService';
import { SocialService } from '../../../services/socialService';

// Mock des services
jest.mock('../../../services/routeService');
jest.mock('../../../services/socialService');

describe('RouteSharing Component', () => {
  // Données de test
  const mockRoutes = [
    {
      id: '1',
      name: 'Route des Crêtes',
      description: 'Magnifique parcours à travers les montagnes',
      distance: 45.7,
      elevation_gain: 850,
      difficulty: 4,
      region: 'Vosges',
      image_url: 'https://example.com/route1.jpg',
      favorite_count: 24,
      is_favorite: false,
      likes: 24,
      author: {
        id: '101',
        name: 'Jean Cycliste',
        profile_image: 'https://example.com/jean.jpg'
      }
    },
    {
      id: '2',
      name: 'Tour du Mont Blanc',
      description: 'Parcours exigeant autour du plus haut sommet des Alpes',
      distance: 170,
      elevation_gain: 8000,
      difficulty: 5,
      region: 'Alpes',
      image_url: 'https://example.com/route2.jpg',
      favorite_count: 56,
      is_favorite: true,
      likes: 56,
      author: {
        id: '102',
        name: 'Marie Grimpeuse',
        profile_image: 'https://example.com/marie.jpg'
      }
    }
  ];

  beforeEach(() => {
    // Configuration des mocks avant chaque test
    RouteService.getAllRoutes = jest.fn().mockResolvedValue(mockRoutes);
    SocialService.toggleFavorite = jest.fn().mockResolvedValue({ success: true });
    
    // Réinitialiser les mocks
    jest.clearAllMocks();
  });

  test('affiche correctement la liste des itinéraires', async () => {
    render(<RouteSharing />);
    
    // Vérifier le chargement initial
    expect(screen.getByText(/Chargement des itinéraires/i)).toBeInTheDocument();
    
    // Attendre que les itinéraires se chargent
    await waitFor(() => {
      expect(RouteService.getAllRoutes).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Route des Crêtes')).toBeInTheDocument();
      expect(screen.getByText('Tour du Mont Blanc')).toBeInTheDocument();
    });
    
    // Vérifier que les détails sont affichés
    expect(screen.getByText('45.7 km')).toBeInTheDocument();
    expect(screen.getByText('8000 m')).toBeInTheDocument();
    expect(screen.getByText('Vosges')).toBeInTheDocument();
    expect(screen.getByText('Alpes')).toBeInTheDocument();
  });

  test('filtre les itinéraires correctement', async () => {
    render(<RouteSharing />);
    
    // Attendre que les itinéraires se chargent
    await waitFor(() => {
      expect(screen.getByText('Tour du Mont Blanc')).toBeInTheDocument();
    });
    
    // Filtrer par région
    const regionFilter = screen.getByLabelText('Région');
    fireEvent.change(regionFilter, { target: { value: 'Alpes' } });
    
    // Vérifier que seule la route des Alpes est affichée
    await waitFor(() => {
      expect(screen.queryByText('Route des Crêtes')).not.toBeInTheDocument();
      expect(screen.getByText('Tour du Mont Blanc')).toBeInTheDocument();
    });
  });

  test('permet d\'ajouter/retirer des favoris', async () => {
    render(<RouteSharing />);
    
    // Attendre que les itinéraires se chargent
    await waitFor(() => {
      expect(screen.getByText('Route des Crêtes')).toBeInTheDocument();
    });
    
    // Trouver le bouton de favoris pour la première route et cliquer dessus
    const favoriteButtons = screen.getAllByLabelText('favorite-button');
    fireEvent.click(favoriteButtons[0]);
    
    // Vérifier que le service a été appelé
    expect(SocialService.toggleFavorite).toHaveBeenCalledWith('1');
    
    // Vérifier que l'UI a été mise à jour de manière optimiste
    await waitFor(() => {
      // Vérifier que le compteur de favoris a été incrémenté
      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });

  test('affiche un message d\'erreur lors d\'un échec de chargement', async () => {
    // Simuler une erreur lors du chargement des itinéraires
    RouteService.getAllRoutes = jest.fn().mockRejectedValue(new Error('Erreur de chargement'));
    
    render(<RouteSharing />);
    
    // Vérifier que le message d'erreur s'affiche
    await waitFor(() => {
      expect(screen.getByText(/Impossible de charger les itinéraires/i)).toBeInTheDocument();
    });
  });
});
