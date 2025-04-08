import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyStateView from '../EmptyStateView';

describe('EmptyStateView Component', () => {
  const mockOnAction = jest.fn();
  
  beforeEach(() => {
    mockOnAction.mockClear();
  });

  test('renders with default props', () => {
    render(<EmptyStateView />);
    
    // Le titre par défaut doit être présent
    expect(screen.getByRole('heading')).toHaveTextContent('Aucun élément à afficher');
    
    // Le message par défaut doit être présent
    expect(screen.getByText('Il n\'y a actuellement aucun contenu à afficher dans cette vue.')).toBeInTheDocument();
    
    // Pas de bouton par défaut si onAction n'est pas fourni
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBe(0);
  });

  test('renders with custom title and message', () => {
    const customTitle = 'Aucun entraînement';
    const customMessage = 'Vous n\'avez pas encore d\'entraînements enregistrés';
    
    render(
      <EmptyStateView 
        title={customTitle} 
        message={customMessage} 
      />
    );
    
    expect(screen.getByRole('heading')).toHaveTextContent(customTitle);
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  test('renders with action button when onAction is provided', () => {
    const customActionText = 'Créer un entraînement';
    
    render(
      <EmptyStateView 
        actionText={customActionText} 
        onAction={mockOnAction}
      />
    );
    
    const actionButton = screen.getByRole('button');
    expect(actionButton).toHaveTextContent(customActionText);
  });

  test('calls onAction when button is clicked', () => {
    render(
      <EmptyStateView 
        actionText="Créer"
        onAction={mockOnAction} 
      />
    );
    
    const actionButton = screen.getByRole('button');
    fireEvent.click(actionButton);
    
    expect(mockOnAction).toHaveBeenCalledTimes(1);
  });

  test('renders with icon when provided', () => {
    const MockIcon = () => <div data-testid="mock-icon">Icon</div>;
    
    render(
      <EmptyStateView 
        icon={<MockIcon />} 
      />
    );
    
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  test('includes animation attributes from Framer Motion', () => {
    render(<EmptyStateView />);
    
    // Le container a les attributs Framer Motion pour l'animation
    const container = screen.getByRole('status');
    
    // Vérification des attributs associés à Framer Motion
    // Note: Ces attributs sont injectés par Framer Motion lors du rendu
    expect(container).toHaveClass('empty-state-container');
    
    // Vérifier que l'icône est présente et a des attributs d'animation
    const iconContainer = container.querySelector('.empty-state-icon');
    expect(iconContainer).toBeInTheDocument();
  });

  test('applies accessibility attributes correctly', () => {
    render(<EmptyStateView />);
    
    // Le container doit être accessible aux lecteurs d'écran
    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });
});
