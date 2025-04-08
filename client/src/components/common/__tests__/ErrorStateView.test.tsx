import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorStateView from '../ErrorStateView';

describe('ErrorStateView Component', () => {
  const mockOnAction = jest.fn();
  
  beforeEach(() => {
    mockOnAction.mockClear();
  });

  test('renders with default props', () => {
    render(<ErrorStateView />);
    
    // Le titre par défaut doit être présent
    expect(screen.getByRole('heading')).toHaveTextContent('Une erreur s\'est produite');
    
    // Le message par défaut doit être présent
    expect(screen.getByText("Nous n'avons pas pu charger les données demandées. Veuillez réessayer ultérieurement.")).toBeInTheDocument();
    
    // Par défaut, aucun bouton n'est présent car actionText et onAction ne sont pas fournis
    const actionButtons = screen.queryAllByRole('button');
    expect(actionButtons.length).toBe(0);
  });

  test('renders with custom title and message', () => {
    const customTitle = 'Erreur de chargement';
    const customMessage = 'Les données de l\'entraînement n\'ont pas pu être récupérées';
    
    render(
      <ErrorStateView 
        title={customTitle} 
        message={customMessage} 
      />
    );
    
    expect(screen.getByRole('heading')).toHaveTextContent(customTitle);
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  test('renders with custom action text', () => {
    const customActionText = 'Recommencer';
    
    render(
      <ErrorStateView 
        actionText={customActionText}
        onAction={mockOnAction}
      />
    );
    
    const actionButton = screen.getByRole('button');
    expect(actionButton).toHaveTextContent(customActionText);
  });

  test('calls onAction when button is clicked', () => {
    render(
      <ErrorStateView 
        actionText="Réessayer"
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
      <ErrorStateView 
        icon={<MockIcon />} 
      />
    );
    
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  test('applies accessibility attributes correctly', () => {
    render(<ErrorStateView />);
    
    // Le container doit avoir le rôle alert pour les lecteurs d'écran
    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toBeInTheDocument();
    
    // L'élément doit avoir un aria-live pour annoncer l'erreur
    expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
  });
});
