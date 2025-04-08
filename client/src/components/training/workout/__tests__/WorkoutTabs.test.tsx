import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkoutTabs from '../WorkoutTabs';
import { WorkoutTabType } from '../../../../types/workout';

// Mock de framer-motion pour éviter les problèmes avec les animations dans les tests
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    },
  };
});

describe('WorkoutTabs Component', () => {
  const mockOnTabChange = jest.fn();
  const activeTab: WorkoutTabType = 'details';
  
  beforeEach(() => {
    mockOnTabChange.mockClear();
  });

  test('renders all tabs correctly', () => {
    render(
      <WorkoutTabs 
        activeTab={activeTab}
        onTabChange={mockOnTabChange}
      />
    );
    
    // Vérification de la présence de tous les onglets
    expect(screen.getByRole('tab', { name: /voir les détails/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /voir les métriques/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /voir l'équipement/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /voir les informations sur l'instructeur/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /voir les commentaires/i })).toBeInTheDocument();
  });

  test('highlights the active tab', () => {
    render(
      <WorkoutTabs 
        activeTab={activeTab}
        onTabChange={mockOnTabChange}
      />
    );
    
    // Vérification que l'onglet actif a l'attribut aria-selected à true
    const activeTabElement = screen.getByRole('tab', { name: /voir les détails/i });
    expect(activeTabElement).toHaveAttribute('aria-selected', 'true');
    expect(activeTabElement).toHaveClass('active');
    
    // Vérification que les autres onglets ne sont pas actifs
    const nonActiveTab = screen.getByRole('tab', { name: /voir les métriques/i });
    expect(nonActiveTab).toHaveAttribute('aria-selected', 'false');
    expect(nonActiveTab).not.toHaveClass('active');
  });

  test('calls onTabChange when a tab is clicked', () => {
    render(
      <WorkoutTabs 
        activeTab={activeTab}
        onTabChange={mockOnTabChange}
      />
    );
    
    // Clic sur un onglet non actif
    const metricsTab = screen.getByRole('tab', { name: /voir les métriques/i });
    fireEvent.click(metricsTab);
    
    // Vérification que onTabChange a été appelé avec le bon argument
    expect(mockOnTabChange).toHaveBeenCalledTimes(1);
    expect(mockOnTabChange).toHaveBeenCalledWith('metrics');
  });

  test('has correct ARIA attributes for accessibility', () => {
    render(
      <WorkoutTabs 
        activeTab={activeTab}
        onTabChange={mockOnTabChange}
      />
    );
    
    // Vérification que la navigation a les attributs ARIA corrects
    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveAttribute('aria-label', 'Sections de l\'entraînement');
    
    // Vérification que chaque onglet contrôle un panel correspondant
    const detailsTab = screen.getByRole('tab', { name: /voir les détails/i });
    expect(detailsTab).toHaveAttribute('aria-controls', 'details-panel');
    
    const metricsTab = screen.getByRole('tab', { name: /voir les métriques/i });
    expect(metricsTab).toHaveAttribute('aria-controls', 'metrics-panel');
  });

  test('changes active tab correctly with different prop value', () => {
    const { rerender } = render(
      <WorkoutTabs 
        activeTab="details"
        onTabChange={mockOnTabChange}
      />
    );
    
    // Vérification de l'onglet actif initial
    expect(screen.getByRole('tab', { name: /voir les détails/i })).toHaveAttribute('aria-selected', 'true');
    
    // Changement de l'onglet actif via les props
    rerender(
      <WorkoutTabs 
        activeTab="metrics"
        onTabChange={mockOnTabChange}
      />
    );
    
    // Vérification que le nouvel onglet est actif
    expect(screen.getByRole('tab', { name: /voir les métriques/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /voir les détails/i })).toHaveAttribute('aria-selected', 'false');
  });
});
