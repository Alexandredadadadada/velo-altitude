import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import WorkoutHeader from '../WorkoutHeader';
import { Workout } from '../../../../types/workout';

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

describe('WorkoutHeader Component', () => {
  const mockWorkout: Workout = {
    id: 'workout-1',
    title: 'Entraînement HIIT Intensif',
    subtitle: 'Séance de haute intensité pour développer la puissance',
    type: 'interval',
    level: 'advanced',
    duration: 75,
    distance: 30,
    elevation: 450,
    calories: 650,
    description: 'Une séance intensive avec des intervalles courts...',
    imageUrl: '/images/workouts/hiit.jpg',
    thumbnailUrl: '/images/workouts/hiit_thumb.jpg',
    featured: true,
    premium: false,
    createdAt: '2025-03-15T10:00:00Z',
    updatedAt: '2025-03-20T14:30:00Z',
    benefits: ['Développement de la VO2max', 'Amélioration de la puissance'],
    tags: ['hiit', 'puissance', 'interval'],
    sections: [
      {
        title: 'Échauffement',
        duration: 10,
        description: 'Échauffement progressif...',
        targets: ['Préparation cardiovasculaire', 'Mobilité']
      }
    ],
    metrics: {
      avgPower: 230,
      maxPower: 450,
      avgHeartRate: 155,
      maxHeartRate: 182
    },
    equipment: [],
    instructor: {
      id: 'instructor-1',
      name: 'Marie Dupont',
      title: 'Coach de cyclisme professionnel',
      bio: 'Ancienne cycliste professionnelle...'
    },
    comments: []
  };

  test('renders workout title correctly', () => {
    render(
      <BrowserRouter>
        <WorkoutHeader workout={mockWorkout} />
      </BrowserRouter>
    );
    
    // Vérification du titre de l'entraînement
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(mockWorkout.title);
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('id', 'workout-title');
  });

  test('renders workout type badge correctly', () => {
    render(
      <BrowserRouter>
        <WorkoutHeader workout={mockWorkout} />
      </BrowserRouter>
    );
    
    // Vérification du badge de type
    const typeBadge = screen.getByText(mockWorkout.type);
    expect(typeBadge).toBeInTheDocument();
    expect(typeBadge).toHaveClass('workout-type-badge');
    expect(typeBadge).toHaveClass('badge-interval');
  });

  test('renders workout metadata correctly', () => {
    render(
      <BrowserRouter>
        <WorkoutHeader workout={mockWorkout} />
      </BrowserRouter>
    );
    
    // Vérification de la durée
    expect(screen.getByText('1h 15min')).toBeInTheDocument();
    expect(screen.getByText('Durée')).toBeInTheDocument();
    
    // Vérification de la date
    const dateElement = screen.getByText(/mars 2025/i);
    expect(dateElement).toBeInTheDocument();
    
    // Vérification de la difficulté
    const difficultyContainer = screen.getByText('Difficulté');
    expect(difficultyContainer).toBeInTheDocument();
  });

  test('renders back button with correct link', () => {
    render(
      <BrowserRouter>
        <WorkoutHeader workout={mockWorkout} />
      </BrowserRouter>
    );
    
    // Vérification du bouton de retour
    const backButton = screen.getByText(/retour aux entraînements/i);
    expect(backButton).toBeInTheDocument();
    expect(backButton.closest('a')).toHaveAttribute('href', '/training');
  });

  test('renders action buttons', () => {
    render(
      <BrowserRouter>
        <WorkoutHeader workout={mockWorkout} />
      </BrowserRouter>
    );
    
    // Vérification des boutons d'action
    expect(screen.getByText('Télécharger')).toBeInTheDocument();
    expect(screen.getByText('Partager')).toBeInTheDocument();
    expect(screen.getByText('Favoris')).toBeInTheDocument();
  });

  test('formats duration correctly for different values', () => {
    // Test avec heures et minutes
    let modifiedWorkout = { ...mockWorkout, duration: 90 }; // 1h 30min
    const { rerender } = render(
      <BrowserRouter>
        <WorkoutHeader workout={modifiedWorkout} />
      </BrowserRouter>
    );
    expect(screen.getByText('1h 30min')).toBeInTheDocument();
    
    // Test avec minutes seulement
    modifiedWorkout = { ...mockWorkout, duration: 45 }; // 45min
    rerender(
      <BrowserRouter>
        <WorkoutHeader workout={modifiedWorkout} />
      </BrowserRouter>
    );
    expect(screen.getByText('45min')).toBeInTheDocument();
    
    // Test avec heures seulement (pas de minutes)
    modifiedWorkout = { ...mockWorkout, duration: 120 }; // 2h
    rerender(
      <BrowserRouter>
        <WorkoutHeader workout={modifiedWorkout} />
      </BrowserRouter>
    );
    expect(screen.getByText('2h')).toBeInTheDocument();
  });

  test('applies animations and has proper accessibility attributes', () => {
    render(
      <BrowserRouter>
        <WorkoutHeader workout={mockWorkout} />
      </BrowserRouter>
    );
    
    // Vérification des attributs d'accessibilité pour la difficulté
    const difficultyValue = screen.getByText(/Difficulté : advanced/i);
    expect(difficultyValue).toHaveClass('visually-hidden');
    
    // Les étoiles de difficulté devraient être marquées comme aria-hidden
    const stars = screen.getAllByText('★');
    stars.forEach(star => {
      expect(star.closest('span')).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
