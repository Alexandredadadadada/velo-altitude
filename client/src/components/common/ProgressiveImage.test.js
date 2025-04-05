import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressiveImage from './ProgressiveImage';
import progressiveImageLoader, { LOAD_PRIORITIES } from '../../services/progressiveImageLoader';

// Mock du service progressiveImageLoader
jest.mock('../../services/progressiveImageLoader', () => ({
  loadImage: jest.fn(),
  LOAD_PRIORITIES: {
    CRITICAL: 1,
    HIGH: 2,
    MEDIUM: 3,
    LOW: 4,
    LAZY: 5
  }
}));

describe('ProgressiveImage Component', () => {
  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    jest.clearAllMocks();
    
    // Mock de l'API IntersectionObserver
    const mockIntersectionObserver = jest.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: () => jest.fn(),
      unobserve: () => jest.fn(),
      disconnect: () => jest.fn()
    });
    window.IntersectionObserver = mockIntersectionObserver;
  });

  it('devrait afficher un placeholder pendant le chargement', () => {
    // Configure le mock pour simuler un chargement en cours
    progressiveImageLoader.loadImage.mockReturnValue(new Promise(() => {}));
    
    render(
      <ProgressiveImage 
        src="/test-image.jpg" 
        alt="Test image" 
        lazy={false}
        placeholderColor="#e0e0e0"
      />
    );
    
    // Vérifier que le placeholder est affiché
    const placeholder = screen.getByRole('img', { hidden: true }).parentElement.querySelector('div');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveStyle('display: flex');
  });

  it('devrait charger l\'image avec la priorité et la taille spécifiées', () => {
    // Configure le mock pour résoudre immédiatement
    progressiveImageLoader.loadImage.mockResolvedValue('/test-image-loaded.jpg');
    
    render(
      <ProgressiveImage 
        src="/test-image.jpg" 
        alt="Test image" 
        priority={LOAD_PRIORITIES.HIGH}
        size="large"
        lazy={false}
      />
    );
    
    // Vérifier que loadImage a été appelé avec les bons paramètres
    expect(progressiveImageLoader.loadImage).toHaveBeenCalledWith(
      expect.any(String),
      '/test-image.jpg',
      expect.objectContaining({
        priority: LOAD_PRIORITIES.HIGH,
        size: 'large',
        useCache: true
      })
    );
  });

  it('devrait afficher l\'image une fois chargée', async () => {
    // Configure le mock pour résoudre immédiatement
    progressiveImageLoader.loadImage.mockResolvedValue('/test-image-loaded.jpg');
    
    render(
      <ProgressiveImage 
        src="/test-image.jpg" 
        alt="Test description"
        lazy={false}
      />
    );
    
    // Attendre que l'image soit chargée
    await waitFor(() => {
      expect(screen.getByRole('img')).toHaveAttribute('src', '/test-image-loaded.jpg');
    });
    
    // Vérifier que le placeholder n'est plus affiché
    await waitFor(() => {
      const image = screen.getByRole('img');
      expect(image).toHaveStyle('opacity: 1');
    });
  });

  it('devrait charger l\'image uniquement quand visible si lazy=true', () => {
    // Mock pour simuler l'observation de l'intersection
    const mockObserve = jest.fn();
    window.IntersectionObserver = jest.fn().mockImplementation(callback => {
      return {
        observe: mockObserve,
        disconnect: jest.fn(),
        unobserve: jest.fn()
      };
    });
    
    render(
      <ProgressiveImage 
        src="/test-image.jpg" 
        alt="Test image"
        lazy={true}
      />
    );
    
    // Vérifier que observe a été appelé (pour le lazy loading)
    expect(mockObserve).toHaveBeenCalled();
    
    // Vérifier que loadImage n'a pas encore été appelé
    expect(progressiveImageLoader.loadImage).not.toHaveBeenCalled();
  });

  it('devrait appeler onLoad lorsque l\'image est chargée', async () => {
    // Mock de la fonction onLoad
    const onLoadMock = jest.fn();
    
    // Configure le mock pour résoudre immédiatement
    progressiveImageLoader.loadImage.mockResolvedValue('/test-image-loaded.jpg');
    
    render(
      <ProgressiveImage 
        src="/test-image.jpg" 
        alt="Test image"
        lazy={false}
        onLoad={onLoadMock}
      />
    );
    
    // Attendre que l'image soit chargée et que onLoad soit appelé
    await waitFor(() => {
      expect(onLoadMock).toHaveBeenCalledWith('/test-image-loaded.jpg');
    });
  });

  it('devrait utiliser un placeholder flou si useBlur=true et placeholderUrl est fourni', () => {
    // Configure le mock pour simuler un chargement en cours
    progressiveImageLoader.loadImage.mockReturnValue(new Promise(() => {}));
    
    render(
      <ProgressiveImage 
        src="/test-image.jpg" 
        alt="Test image"
        lazy={false}
        useBlur={true}
        placeholderUrl="/test-image-tiny.jpg"
      />
    );
    
    // Vérifier que le placeholder a les propriétés de flou
    const placeholder = screen.getByRole('img', { hidden: true }).parentElement.querySelector('div');
    expect(placeholder).toHaveStyle('background-image: url(/test-image-tiny.jpg)');
    expect(placeholder).toHaveStyle('filter: blur(10px)');
  });
});
