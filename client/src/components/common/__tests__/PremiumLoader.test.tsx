import React from 'react';
import { render, screen } from '@testing-library/react';
import { PremiumLoader } from '../PremiumLoader';

// Mock de framer-motion pour éviter les problèmes avec les animations dans les tests
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
  };
});

describe('PremiumLoader Component', () => {
  test('renders with default props', () => {
    render(<PremiumLoader />);
    
    // Le loader doit être présent dans le document
    const loader = screen.getByTestId('premium-loader');
    expect(loader).toBeInTheDocument();
  });

  test('renders with custom size', () => {
    render(<PremiumLoader size={60} />);
    
    // Pour le type spinner par défaut, on vérifie le premier élément enfant (le spinner)
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveStyle('width: 60px; height: 60px');
  });

  test('renders with custom color', () => {
    render(<PremiumLoader color="blue" />);
    
    // Vérifier que la classe de couleur correcte est appliquée
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('premium-loader__spinner');
    expect(spinner).toHaveClass('premium-loader--blue');
  });

  test('renders with gradient color', () => {
    render(<PremiumLoader color="gradient" />);
    
    // Vérifier que la classe de couleur gradient est appliquée
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('premium-loader__spinner');
    expect(spinner).toHaveClass('premium-loader--gradient');
  });

  test('renders with custom text', () => {
    const loadingText = 'Chargement en cours...';
    render(<PremiumLoader text={loadingText} />);
    
    // Vérifier que le texte est présent
    expect(screen.getByText(loadingText)).toBeInTheDocument();
  });

  test('renders with overlay', () => {
    render(<PremiumLoader overlay={true} />);
    
    // Vérifier que l'overlay est présent
    const overlayContainer = screen.getByTestId('premium-loader-overlay');
    expect(overlayContainer).toHaveClass('premium-loader-overlay');
  });

  test('applies accessibility attributes correctly', () => {
    render(<PremiumLoader text="Chargement" />);
    
    // Vérifier que les attributs d'accessibilité sont présents
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Chargement');
    
    // Vérifier que le texte a un aria-live
    const text = screen.getByText('Chargement');
    expect(text).toHaveAttribute('aria-live', 'polite');
  });
});
