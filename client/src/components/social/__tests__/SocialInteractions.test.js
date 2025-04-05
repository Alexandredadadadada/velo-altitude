import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CommunityFeed from '../CommunityFeed';
import SocialService from '../../../services/socialService';

// Mock de SocialService
jest.mock('../../../services/socialService', () => ({
  getFeedPosts: jest.fn(),
  toggleLike: jest.fn(),
  getPostComments: jest.fn(),
  addComment: jest.fn()
}));

describe('Tests des interactions sociales', () => {
  // Mock data pour les tests
  const mockPosts = [
    {
      id: '1',
      content: 'Post de test #1',
      imageUrl: '/images/social/test-image.jpg',
      user: {
        id: 'user1',
        name: 'Jean Dupont',
        avatar: '/images/social/default-avatar.svg'
      },
      likes: 5,
      userLiked: false,
      commentCount: 2,
      comments: [
        {
          id: 'c1',
          content: 'Super post !',
          user: {
            id: 'user2',
            name: 'Marie Martin',
            avatar: '/images/social/default-avatar.svg'
          },
          timestamp: '2025-04-01T10:30:00'
        }
      ],
      timestamp: '2025-04-01T10:00:00'
    },
    {
      id: '2',
      content: 'Post de test #2',
      user: {
        id: 'user3',
        name: 'Paul Bernard',
        avatar: '/images/social/default-avatar.svg'
      },
      likes: 10,
      userLiked: true,
      commentCount: 0,
      comments: [],
      timestamp: '2025-04-02T14:30:00'
    }
  ];

  // Configuration des mocks avant chaque test
  beforeEach(() => {
    SocialService.getFeedPosts.mockResolvedValue(mockPosts);
    SocialService.toggleLike.mockResolvedValue({ success: true });
    SocialService.getPostComments.mockResolvedValue(mockPosts[0].comments);
    SocialService.addComment.mockResolvedValue({
      id: 'c2',
      content: 'Nouveau commentaire',
      user: {
        id: 'user4',
        name: 'Test User',
        avatar: '/images/social/default-avatar.svg'
      },
      timestamp: '2025-04-04T15:00:00'
    });

    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn(() => Promise.resolve())
      }
    });

    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://grandestvelo.fr'
      }
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  test('Chargement et affichage des posts', async () => {
    render(<CommunityFeed userId="user4" />);
    
    // Vérifier l'appel au service
    expect(SocialService.getFeedPosts).toHaveBeenCalledTimes(1);
    
    // Attendre que les posts soient chargés
    await waitFor(() => {
      expect(screen.getByText('Post de test #1')).toBeInTheDocument();
      expect(screen.getByText('Post de test #2')).toBeInTheDocument();
    });
    
    // Vérifier les noms d'utilisateurs
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
    expect(screen.getByText('Paul Bernard')).toBeInTheDocument();
    
    // Vérifier les informations sur les likes
    expect(screen.getByText('5 likes')).toBeInTheDocument();
    expect(screen.getByText('10 likes')).toBeInTheDocument();
  });

  test('Interaction: Toggle like sur un post', async () => {
    render(<CommunityFeed userId="user4" />);
    
    // Attendre que les posts soient chargés
    await waitFor(() => {
      expect(screen.getByText('Post de test #1')).toBeInTheDocument();
    });
    
    // Trouver les boutons "J'aime"
    const likeButtons = screen.getAllByText('J\'aime');
    
    // Cliquer sur le premier bouton like
    fireEvent.click(likeButtons[0]);
    
    // Vérifier l'appel au service toggleLike
    expect(SocialService.toggleLike).toHaveBeenCalledWith('1');
    
    // Vérifier le changement d'état optimiste
    await waitFor(() => {
      expect(SocialService.getFeedPosts).toHaveBeenCalledTimes(2);
    });
  });

  test('Interaction: Chargement et affichage des commentaires', async () => {
    render(<CommunityFeed userId="user4" />);
    
    // Attendre que les posts soient chargés
    await waitFor(() => {
      expect(screen.getByText('Post de test #1')).toBeInTheDocument();
    });
    
    // Cliquer sur le bouton "Commenter"
    const commentButtons = screen.getAllByText('Commenter');
    fireEvent.click(commentButtons[0]);
    
    // Vérifier l'appel au service getPostComments
    expect(SocialService.getPostComments).toHaveBeenCalledWith('1');
    
    // Vérifier l'affichage du commentaire existant
    await waitFor(() => {
      expect(screen.getByText('Super post !')).toBeInTheDocument();
      expect(screen.getByText('Marie Martin')).toBeInTheDocument();
    });
  });

  test('Interaction: Ajout d\'un nouveau commentaire', async () => {
    render(<CommunityFeed userId="user4" />);
    
    // Attendre que les posts soient chargés
    await waitFor(() => {
      expect(screen.getByText('Post de test #1')).toBeInTheDocument();
    });
    
    // Cliquer sur le bouton "Commenter"
    const commentButtons = screen.getAllByText('Commenter');
    fireEvent.click(commentButtons[0]);
    
    // Attendre que le formulaire de commentaire soit affiché
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ajoutez un commentaire...')).toBeInTheDocument();
    });
    
    // Écrire un nouveau commentaire
    const commentInput = screen.getByPlaceholderText('Ajoutez un commentaire...');
    fireEvent.change(commentInput, { target: { value: 'Nouveau commentaire' } });
    
    // Trouver et cliquer sur le bouton d'envoi
    const sendButtons = document.querySelectorAll('[aria-label="Envoyer"]');
    fireEvent.click(sendButtons[0] || screen.getByRole('button', { name: /Envoyer/i }));
    
    // Vérifier l'appel au service addComment
    expect(SocialService.addComment).toHaveBeenCalledWith('1', 'Nouveau commentaire');
  });

  test('Interaction: Ouverture de la boîte de dialogue de partage', async () => {
    render(<CommunityFeed userId="user4" />);
    
    // Attendre que les posts soient chargés
    await waitFor(() => {
      expect(screen.getByText('Post de test #1')).toBeInTheDocument();
    });
    
    // Trouver et cliquer sur le bouton "Partager"
    const shareButtons = screen.getAllByText('Partager');
    fireEvent.click(shareButtons[0]);
    
    // Vérifier que la boîte de dialogue de partage est ouverte
    await waitFor(() => {
      expect(screen.getByText('Partager cette publication')).toBeInTheDocument();
      expect(screen.getByText('Partager via')).toBeInTheDocument();
      expect(screen.getByText('Ou copier le lien')).toBeInTheDocument();
    });
    
    // Vérifier que les URL de partage sont correctes
    expect(screen.getByText('https://grandestvelo.fr/posts/1')).toBeInTheDocument();
    
    // Tester le bouton Copier
    const copyButton = screen.getByText('Copier');
    fireEvent.click(copyButton);
    
    // Vérifier que le presse-papier a été appelé
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://grandestvelo.fr/posts/1');
    
    // Attendre le changement du texte du bouton
    await waitFor(() => {
      expect(screen.getByText('Copié!')).toBeInTheDocument();
    });
  });
});
