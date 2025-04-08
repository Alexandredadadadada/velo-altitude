import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiTarget, FiClock } from 'react-icons/fi';
import { WorkoutDetailsTabProps } from '../../../types/workout';
import { colors } from '../../../design-system/tokens/colors';
import { spacing } from '../../../design-system/tokens/spacing';
import './WorkoutDetailsTab.css';

/**
 * @module Training/Workout
 * @component WorkoutDetailsTab
 * 
 * Affiche les détails d'un entraînement avec sections, bénéfices et conseils
 * 
 * @example
 * ```tsx
 * <WorkoutDetailsTab workout={workoutData} />
 * ```
 */
const WorkoutDetailsTab: React.FC<WorkoutDetailsTabProps> = ({ workout }) => {
  // Animation pour les éléments de liste (mémorisée)
  const listItemVariants = useMemo(() => ({
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5
      }
    })
  }), []);
  
  // Animation pour les sections (mémorisée)
  const sectionVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.6
      }
    })
  }), []);

  return (
    <div 
      className="workout-details-tab" 
      role="tabpanel"
      id="details-panel"
      aria-labelledby="details-tab"
    >
      <h2>Description</h2>
      <p className="workout-description">{workout.description}</p>
      
      <h2 id="benefits-heading">Bénéfices</h2>
      <ul 
        className="workout-benefits-list" 
        aria-labelledby="benefits-heading"
      >
        {workout.benefits.map((benefit, index) => (
          <motion.li 
            key={index}
            className="workout-benefit-item focus-visible-ring"
            custom={index}
            initial="hidden"
            animate="visible"
            variants={listItemVariants}
            tabIndex={0}
          >
            {benefit}
          </motion.li>
        ))}
      </ul>
      
      <h2 id="program-heading">Programme</h2>
      <div 
        className="workout-sections"
        aria-labelledby="program-heading"
      >
        {workout.sections.map((section, index) => (
          <motion.div 
            key={index}
            className="workout-section focus-visible-ring"
            custom={index}
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
            tabIndex={0}
          >
            <div className="section-header">
              <h3 className="section-title">{section.title}</h3>
              <span className="section-duration" aria-label={`Durée: ${section.duration} minutes`}>
                <FiClock aria-hidden="true" /> {section.duration} min
              </span>
            </div>
            
            <p className="section-description">{section.description}</p>
            
            <div className="section-target">
              {section.targets.map((target, idx) => (
                <div key={idx} className="target-item">
                  <FiTarget aria-hidden="true" />
                  <span>{target}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
      
      {workout.tips && workout.tips.length > 0 && (
        <>
          <h2 id="tips-heading">Conseils</h2>
          <ul 
            className="workout-tips-list"
            aria-labelledby="tips-heading"
          >
            {workout.tips.map((tip, index) => (
              <motion.li 
                key={index}
                className="workout-tip-item focus-visible-ring"
                custom={index}
                initial="hidden"
                animate="visible"
                variants={listItemVariants}
                tabIndex={0}
              >
                {tip}
              </motion.li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default React.memo(WorkoutDetailsTab);
