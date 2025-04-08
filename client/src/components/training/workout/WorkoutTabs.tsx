import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiInfo, FiActivity, FiTool, FiUser, FiMessageCircle } from 'react-icons/fi';
import { WorkoutTabType, WorkoutTabsProps } from '../../../types/workout';
import { colors } from '../../../design-system/tokens/colors';
import './WorkoutTabs.css';

/**
 * @module Training/Workout
 * @component WorkoutTabs
 * 
 * Composant de navigation par onglets pour la vue détaillée d'un entraînement.
 * Permet de basculer entre les différentes sections d'information.
 * 
 * @example
 * ```tsx
 * <WorkoutTabs 
 *   activeTab="details" 
 *   onTabChange={(tab) => setActiveTab(tab)} 
 * />
 * ```
 */
const WorkoutTabs: React.FC<WorkoutTabsProps> = ({ activeTab, onTabChange }) => {
  // Configuration des onglets (mémorisée pour éviter re-création à chaque rendu)
  const tabs = useMemo(() => [
    {
      id: 'details' as WorkoutTabType,
      label: 'Détails',
      icon: <FiInfo aria-hidden="true" />,
      ariaLabel: 'Voir les détails de l\'entraînement',
    },
    {
      id: 'metrics' as WorkoutTabType,
      label: 'Métriques',
      icon: <FiActivity aria-hidden="true" />,
      ariaLabel: 'Voir les métriques de l\'entraînement',
    },
    {
      id: 'equipment' as WorkoutTabType,
      label: 'Équipement',
      icon: <FiTool aria-hidden="true" />,
      ariaLabel: 'Voir l\'équipement nécessaire',
    },
    {
      id: 'instructor' as WorkoutTabType,
      label: 'Instructeur',
      icon: <FiUser aria-hidden="true" />,
      ariaLabel: 'Voir les informations sur l\'instructeur',
    },
    {
      id: 'comments' as WorkoutTabType,
      label: 'Commentaires',
      icon: <FiMessageCircle aria-hidden="true" />,
      ariaLabel: 'Voir les commentaires',
    }
  ], []);

  return (
    <nav className="workout-tabs" role="tablist" aria-label="Sections de l'entraînement">
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          className={`workout-tab focus-visible-ring ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          whileTap={{ scale: 0.97 }}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`${tab.id}-panel`}
          id={`${tab.id}-tab`}
          aria-label={tab.ariaLabel}
        >
          <span className="workout-tab-icon">
            {tab.icon}
          </span>
          <span className="workout-tab-text">
            {tab.label}
          </span>
          {activeTab === tab.id && (
            <motion.div 
              className="tab-indicator"
              layoutId="tab-indicator"
              transition={{ 
                duration: 0.3, 
                ease: "easeInOut"
              }}
            />
          )}
        </motion.button>
      ))}
    </nav>
  );
};

// Memoisation uniquement justifiée si ce composant est souvent rendu avec les mêmes props
export default WorkoutTabs;
