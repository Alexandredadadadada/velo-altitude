import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import ThemeToggle from '../ThemeToggle';
import { toggleTheme } from '../../../theme/materialTheme';
import themeManager from '../../../utils/ThemeManager';

// Mock des dépendances
jest.mock('../../../theme/materialTheme', () => ({
  toggleTheme: jest.fn()
}));

jest.mock('../../../utils/ThemeManager', () => ({
  isDarkModeEnabled: jest.fn()
}));

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render correctly in light mode', () => {
    // Simuler le mode clair
    themeManager.isDarkModeEnabled.mockReturnValue(false);
    toggleTheme.mockReturnValue(true);
    
    render(<ThemeToggle lightTooltip="Passer en mode sombre" darkTooltip="Passer en mode clair" />);
    
    // Vérifier que l'icône du mode sombre est affichée en mode clair
    expect(screen.getByTestId('dark-mode-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('light-mode-icon')).not.toBeInTheDocument();
  });

  test('should render correctly in dark mode', () => {
    // Simuler le mode sombre
    themeManager.isDarkModeEnabled.mockReturnValue(true);
    toggleTheme.mockReturnValue(false);
    
    render(<ThemeToggle lightTooltip="Passer en mode sombre" darkTooltip="Passer en mode clair" />);
    
    // Vérifier que l'icône du mode clair est affichée en mode sombre
    expect(screen.getByTestId('light-mode-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('dark-mode-icon')).not.toBeInTheDocument();
  });

  test('should toggle theme when clicked', () => {
    // Simuler le mode clair initialement
    themeManager.isDarkModeEnabled.mockReturnValue(false);
    toggleTheme.mockReturnValue(true);
    
    render(<ThemeToggle lightTooltip="Passer en mode sombre" darkTooltip="Passer en mode clair" />);
    
    // Cliquer sur le bouton de bascule
    fireEvent.click(screen.getByRole('button'));
    
    // Vérifier que toggleTheme a été appelé
    expect(toggleTheme).toHaveBeenCalledTimes(1);
    
    // Simuler la mise à jour de l'état après le clic
    themeManager.isDarkModeEnabled.mockReturnValue(true);
    
    // Re-rendre le composant pour simuler la mise à jour de l'état
    render(<ThemeToggle lightTooltip="Passer en mode sombre" darkTooltip="Passer en mode clair" />);
    
    // Vérifier que l'icône a changé
    expect(screen.getByTestId('light-mode-icon')).toBeInTheDocument();
  });

  test('should apply custom sizes', () => {
    themeManager.isDarkModeEnabled.mockReturnValue(false);
    
    render(<ThemeToggle size="large" />);
    
    // Vérifier que la taille a été appliquée
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('size', 'large');
  });

  test('should display correct tooltip based on theme', () => {
    // Simuler le mode clair
    themeManager.isDarkModeEnabled.mockReturnValue(false);
    
    render(<ThemeToggle lightTooltip="Test Light Tooltip" darkTooltip="Test Dark Tooltip" />);
    
    // Vérifier le tooltip en mode clair
    const tooltip = screen.getByRole('button').closest('div[role="tooltip"]');
    expect(tooltip).toHaveTextContent('Test Light Tooltip');
    
    // Simuler le passage en mode sombre
    themeManager.isDarkModeEnabled.mockReturnValue(true);
    
    // Re-rendre pour simuler la mise à jour
    render(<ThemeToggle lightTooltip="Test Light Tooltip" darkTooltip="Test Dark Tooltip" />);
    
    // Vérifier que le tooltip a changé
    const updatedTooltip = screen.getByRole('button').closest('div[role="tooltip"]');
    expect(updatedTooltip).toHaveTextContent('Test Dark Tooltip');
  });
});
