import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiClock, FiCalendar, FiTrendingUp, FiArrowLeft, FiDownload, FiShare2, FiHeart } from 'react-icons/fi';
import { Workout } from '../../../types/workout';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import './WorkoutHeader.css';

/**
 * @module Training/Workout
 * @component WorkoutHeader
 * 
 * En-tête de la vue détaillée d'un entraînement
 * Affiche le titre, les métadonnées et les actions principales
 * 
 * @example
 * ```tsx
 * <WorkoutHeader workout={workoutData} />
 * ```
 */
interface WorkoutHeaderProps {
  workout: Workout;
}

const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({ workout }) => {
  // Format de la durée
  const formatDuration = (mins: number): string => {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return hours > 0 
      ? `${hours}h ${minutes > 0 ? `${minutes}min` : ''}`
      : `${minutes}min`;
  };

  // Format de la date
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Badge de type d'entraînement
  const getTypeClass = (type: string): string => {
    const typeMap: Record<string, string> = {
      'endurance': 'badge-endurance',
      'interval': 'badge-interval',
      'recovery': 'badge-recovery',
      'strength': 'badge-strength',
      'climbing': 'badge-climbing'
    };
    return typeMap[type.toLowerCase()] || 'badge-endurance';
  };

  // Rendu des étoiles de difficulté
  const renderDifficultyStars = (level: number): JSX.Element[] => {
    const difficultyLevel = workout.level ? 
      ['beginner', 'intermediate', 'advanced', 'expert'].indexOf(workout.level) + 1 : 
      3; // Valeur par défaut
    
    return Array(5).fill(0).map((_, i) => (
      <span 
        key={i} 
        className={`difficulty-star ${i < difficultyLevel ? 'active' : ''}`}
        aria-hidden="true"
      >
        ★
      </span>
    ));
  };

  // Récupérer la date au format ISO ou utiliser la date actuelle
  const workoutDate = workout.createdAt || new Date().toISOString();

  return (
    <motion.div 
      className="workout-detail-header"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="workout-detail-header-main">
        <Link to="/training" className="workout-back-button">
          <FiArrowLeft /> Retour aux entraînements
        </Link>
        
        <span className={`workout-type-badge ${getTypeClass(workout.type)}`}>
          {workout.type}
        </span>
        
        <h1 className="workout-title" id="workout-title">{workout.title}</h1>
        
        <div className="workout-meta">
          <div className="workout-meta-item">
            <div className="workout-meta-icon">
              <FiClock />
            </div>
            <div className="workout-meta-value">
              {formatDuration(workout.duration)}
            </div>
            <div className="workout-meta-label">Durée</div>
          </div>
          
          <div className="workout-meta-item">
            <div className="workout-meta-icon">
              <FiCalendar />
            </div>
            <div className="workout-meta-value">
              {formatDate(workoutDate)}
            </div>
            <div className="workout-meta-label">Date</div>
          </div>
          
          <div className="workout-meta-item">
            <div className="workout-meta-icon">
              <FiTrendingUp />
            </div>
            <div className="workout-meta-value">
              <span className="visually-hidden">
                Difficulté : {workout.level || 'intermediate'}
              </span>
              <span aria-hidden="true">
                {renderDifficultyStars(3)} {/* Utilise une valeur par défaut */}
              </span>
            </div>
            <div className="workout-meta-label">Difficulté</div>
          </div>
        </div>
      </div>
      
      <div className="workout-actions">
        <motion.button 
          className="workout-action-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiDownload /> Télécharger
        </motion.button>
        
        <motion.button 
          className="workout-action-button secondary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiShare2 /> Partager
        </motion.button>
        
        <motion.button 
          className="workout-action-button secondary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiHeart /> Favoris
        </motion.button>
      </div>
    </motion.div>
  );
};

export default WorkoutHeader;
