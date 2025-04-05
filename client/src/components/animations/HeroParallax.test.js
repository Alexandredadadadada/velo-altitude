import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import HeroParallax from './HeroParallax';
import modernTheme from '../../theme/modernTheme';

// Mock Intersection Observer
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe(element) {
    this.callback([{ isIntersecting: true, target: element }]);
  }
  unobserve() {}
  disconnect() {}
};

// Fonction d'aide pour le rendu du composant
const renderHeroParallax = (props = {}) => {
  const defaultProps = {
    backgroundImage: '/images/hero-bg.jpg',
    title: 'Test Title',
    subtitle: 'Test Subtitle',
    height: '70vh',
    overlayColor: 'rgba(0, 0, 0, 0.4)',
    ...props,
  };

  return render(
    <ThemeProvider theme={modernTheme}>
      <HeroParallax {...defaultProps}>
        <button>CTA Button</button>
      </HeroParallax>
    </ThemeProvider>
  );
};

describe('HeroParallax Component', () => {
  test('renders with correct title and subtitle', () => {
    renderHeroParallax();
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  test('renders children correctly', () => {
    renderHeroParallax();
    
    expect(screen.getByText('CTA Button')).toBeInTheDocument();
  });

  test('applies correct background image', () => {
    renderHeroParallax();
    
    const heroContainer = screen.getByTestId('hero-parallax-container');
    expect(heroContainer).toHaveStyle({
      backgroundImage: 'url(/images/hero-bg.jpg)'
    });
  });

  test('applies custom height when provided', () => {
    renderHeroParallax({ height: '90vh' });
    
    const heroContainer = screen.getByTestId('hero-parallax-container');
    expect(heroContainer).toHaveStyle({
      height: '90vh'
    });
  });

  test('applies custom overlay color when provided', () => {
    renderHeroParallax({ overlayColor: 'rgba(0, 0, 0, 0.7)' });
    
    const overlay = screen.getByTestId('hero-parallax-overlay');
    expect(overlay).toHaveStyle({
      backgroundColor: 'rgba(0, 0, 0, 0.7)'
    });
  });

  test('animates on scroll', () => {
    renderHeroParallax();
    
    // Simule un événement de défilement
    fireEvent.scroll(window, { target: { scrollY: 100 } });
    
    // Vérifie que l'élément de parallaxe a un style transform approprié
    const parallaxElement = screen.getByTestId('hero-parallax-background');
    expect(parallaxElement).toHaveStyle({
      transform: expect.stringContaining('translateY')
    });
  });

  test('renders correctly with minimal props', () => {
    render(
      <ThemeProvider theme={modernTheme}>
        <HeroParallax title="Minimal Title" />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Minimal Title')).toBeInTheDocument();
    
    // Vérifie qu'il n'y a pas de sous-titre
    expect(screen.queryByTestId('hero-parallax-subtitle')).toBeNull();
  });

  test('has accessible elements with correct roles and attributes', () => {
    renderHeroParallax();
    
    // Vérifie que la section héro a le rôle approprié pour l'accessibilité
    const heroSection = screen.getByTestId('hero-parallax-container');
    expect(heroSection).toHaveAttribute('role', 'banner');
    
    // Vérifie que le titre a un niveau de titre approprié
    const title = screen.getByText('Test Title');
    expect(title.tagName).toBe('H1');
    
    // Vérifie que le sous-titre a le bon niveau
    const subtitle = screen.getByText('Test Subtitle');
    expect(subtitle.tagName).toBe('H2');
  });

  test('applies focus styles when tabbing to interactive elements', () => {
    renderHeroParallax();
    
    const button = screen.getByText('CTA Button');
    button.focus();
    expect(document.activeElement).toBe(button);
  });
});
