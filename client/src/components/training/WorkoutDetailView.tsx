import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { PremiumLoader } from '../common/PremiumLoader';
import ErrorStateView from '../common/ErrorStateView';
import { 
  WorkoutHeader, 
  WorkoutTabs, 
  WorkoutDetailsTab, 
  WorkoutMetricsTab, 
  WorkoutEquipmentTab, 
  WorkoutInstructorTab, 
  WorkoutCommentsTab 
} from './workout';
// Import des types centralisés
import { Workout, WorkoutTabType, WorkoutDetailViewProps } from '../../types/workout';
// Import du service mock (à remplacer par MSW plus tard)
import { getWorkoutById } from '../../mocks/workoutData';
// Import des tokens depuis le design system
import { colors } from '../../design-system/tokens/colors';
import { spacing } from '../../design-system/tokens/spacing';
import './WorkoutDetailView.css';

/**
 * @module Training
 * @component WorkoutDetailView
 * 
 * Composant principal pour afficher les détails d'un entraînement
 * Gère le chargement de données, les erreurs et l'affichage des différents onglets
 * 
 * @example
 * ```tsx
 * <WorkoutDetailView workoutId="123" />
 * ```
 * ou
 * ```tsx
 * <Route path="/workouts/:id" element={<WorkoutDetailView />} />
 * ```
 */
const WorkoutDetailView: React.FC<WorkoutDetailViewProps> = ({ workoutId: propWorkoutId }) => {
  // États
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [activeTab, setActiveTab] = useState<WorkoutTabType>('details');

  // Récupérer l'ID de l'entraînement depuis les paramètres d'URL si non fourni en prop
  const { id: urlWorkoutId } = useParams<{ id: string }>();
  const finalWorkoutId = propWorkoutId || urlWorkoutId;

  // Fonction mémorisée pour charger l'entraînement
  // TODO: À remplacer par un hook personnalisé utilisant MSW (ex: useWorkout(id))
  const fetchWorkout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulation d'une requête API (à remplacer par un appel réel)
      setTimeout(() => {
        try {
          const workoutData = getWorkoutById(finalWorkoutId || '');
          if (!workoutData) {
            throw new Error('Entraînement non trouvé');
          }
          setWorkout(workoutData as Workout);
          setLoading(false);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
          setLoading(false);
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
      setLoading(false);
    }
  }, [finalWorkoutId]);

  // Charger les données de l'entraînement
  useEffect(() => {
    if (finalWorkoutId) {
      fetchWorkout();
    } else {
      setError(new Error('ID d\'entraînement manquant'));
      setLoading(false);
    }
  }, [finalWorkoutId, fetchWorkout]);

  // Gestionnaire de changement d'onglet (mémorisé pour éviter les re-rendus)
  const handleTabChange = useCallback((tab: WorkoutTabType) => {
    setActiveTab(tab);
  }, []);

  // Fonction pour réessayer le chargement en cas d'erreur (mémorisée)
  const handleRetry = useCallback(() => {
    if (finalWorkoutId) {
      fetchWorkout();
    }
  }, [finalWorkoutId, fetchWorkout]);

  // Animation mémorisée pour éviter la recréation à chaque rendu
  const fadeInAnimation = useMemo(() => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5 }
  }), []);

  // Accessibilité : titre de la page basé sur l'onglet actif
  useEffect(() => {
    if (workout) {
      let pageTitle = `${workout.title} - `;
      switch (activeTab) {
        case 'details': pageTitle += 'Détails'; break;
        case 'metrics': pageTitle += 'Métriques'; break;
        case 'equipment': pageTitle += 'Équipement'; break;
        case 'instructor': pageTitle += 'Instructeur'; break;
        case 'comments': pageTitle += 'Commentaires'; break;
      }
      document.title = pageTitle;
    }
    return () => {
      document.title = 'Velo-Altitude - Entraînements';
    };
  }, [workout, activeTab]);

  // Afficher le loader pendant le chargement
  if (loading) {
    return (
      <div className="workout-detail-container workout-detail-loading" aria-live="polite" aria-busy="true">
        <PremiumLoader 
          size={60} 
          color="gradient" 
          text="Chargement de l'entraînement..." 
          overlay={false}
        />
      </div>
    );
  }

  // Afficher l'erreur si elle existe
  if (error) {
    return (
      <div className="workout-detail-container workout-detail-error" aria-live="assertive">
        <ErrorStateView 
          title="Impossible de charger l'entraînement"
          message={error.message}
          actionText="Réessayer"
          onAction={handleRetry}
        />
      </div>
    );
  }

  // Vérification supplémentaire pour éviter les erreurs TypeScript
  if (!workout) {
    return null; // Ce cas ne devrait jamais se produire car nous avons déjà un check pour l'état vide
  }

  // Afficher les détails de l'entraînement
  return (
    <motion.div 
      className="workout-detail-container"
      {...fadeInAnimation}
      aria-labelledby="workout-title"
      aria-describedby="workout-subtitle"
    >
      {/* En-tête avec infos principales */}
      <WorkoutHeader workout={workout} />
      
      {/* Navigation par onglets */}
      <WorkoutTabs 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />
      
      {/* Contenu des onglets */}
      <div 
        className="workout-detail-tab-content"
        role="region"
        aria-live="polite"
      >
        {activeTab === 'details' && (
          <WorkoutDetailsTab workout={workout} />
        )}
        
        {activeTab === 'metrics' && (
          <WorkoutMetricsTab metrics={workout.metrics} />
        )}
        
        {activeTab === 'equipment' && (
          <WorkoutEquipmentTab equipment={workout.equipment} />
        )}
        
        {activeTab === 'instructor' && (
          <WorkoutInstructorTab instructor={workout.instructor} />
        )}
        
        {activeTab === 'comments' && (
          <WorkoutCommentsTab 
            workoutId={workout.id} 
            comments={workout.comments} 
          />
        )}
      </div>
    </motion.div>
  );
};

export default WorkoutDetailView;
