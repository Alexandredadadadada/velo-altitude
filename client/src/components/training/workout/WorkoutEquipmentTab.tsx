import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  FiBriefcase, FiShield, FiThermometer, FiTool, 
  FiBluetooth, FiMonitor, FiCpu, FiLifeBuoy 
} from 'react-icons/fi';
import { WorkoutEquipmentTabProps } from '../../../types/workout';
import { colors } from '../../../design-system/tokens/colors';
import './WorkoutEquipmentTab.css';

/**
 * @module Training/Workout
 * @component WorkoutEquipmentTab
 * 
 * Affiche les équipements nécessaires et recommandés pour un entraînement
 * 
 * @example
 * ```tsx
 * <WorkoutEquipmentTab equipment={workout.equipment} />
 * ```
 */
const WorkoutEquipmentTab: React.FC<WorkoutEquipmentTabProps> = ({ equipment }) => {
  // Fonction pour obtenir l'icône en fonction du type d'équipement
  const getEquipmentIcon = (type: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      'bike': <FiBriefcase aria-hidden="true" size={24} />,
      'protection': <FiShield aria-hidden="true" size={24} />,
      'clothing': <FiThermometer aria-hidden="true" size={24} />,
      'tool': <FiTool aria-hidden="true" size={24} />,
      'sensor': <FiBluetooth aria-hidden="true" size={24} />,
      'display': <FiMonitor aria-hidden="true" size={24} />,
      'electronics': <FiCpu aria-hidden="true" size={24} />,
      'accessory': <FiLifeBuoy aria-hidden="true" size={24} />
    };
    
    return icons[type.toLowerCase()] || <FiTool aria-hidden="true" size={24} />;
  };

  // Tri des équipements: d'abord les obligatoires, puis les optionnels (mémorisé car dépend des props)
  const sortedEquipment = useMemo(() => {
    return [...equipment].sort((a, b) => {
      if (a.optional === b.optional) {
        return (b.recommendationLevel || 0) - (a.recommendationLevel || 0);
      }
      return a.optional ? 1 : -1;
    });
  }, [equipment]);

  // Animation constants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div 
      className="workout-equipment-tab"
      role="tabpanel"
      id="equipment-panel"
      aria-labelledby="equipment-tab"
    >
      <h2 id="equipment-heading">Équipement nécessaire</h2>
      
      {equipment.length === 0 ? (
        <div 
          className="empty-equipment-message" 
          aria-live="polite"
          aria-labelledby="equipment-heading"
        >
          Aucun équipement spécifique n'est requis pour cet entraînement.
        </div>
      ) : (
        <motion.div 
          className="equipment-list"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          aria-labelledby="equipment-heading"
        >
          {sortedEquipment.map((item) => (
            <motion.div 
              key={item.id}
              className="equipment-card focus-visible-ring"
              variants={itemVariants}
              tabIndex={0}
              aria-label={`${item.name}${item.optional ? ', optionnel' : ', nécessaire'}${item.recommendationLevel ? `, recommandation: ${item.recommendationLevel} sur 5` : ''}`}
            >
              <div className={`equipment-icon ${item.type.toLowerCase()}`}>
                {getEquipmentIcon(item.type)}
              </div>
              
              <div className="equipment-details">
                <h3 className="equipment-name">
                  {item.name}
                  {item.optional && (
                    <span className="equipment-optional">Optionnel</span>
                  )}
                </h3>
                
                {item.recommendationLevel && item.recommendationLevel > 0 && (
                  <div className="equipment-recommendation" aria-hidden="true">
                    {Array(5).fill(0).map((_, i) => (
                      <span 
                        key={i} 
                        className={`recommendation-star ${i < item.recommendationLevel! ? 'filled' : 'empty'}`}
                      >
                        ★
                      </span>
                    ))}
                    <span className="visually-hidden">
                      Niveau de recommandation: {item.recommendationLevel} sur 5
                    </span>
                  </div>
                )}
                
                <p className="equipment-description">{item.description}</p>
              </div>
              
              {item.imageUrl && (
                <div className="equipment-image">
                  <img 
                    src={item.imageUrl} 
                    alt="" 
                    aria-hidden="true"
                    loading="lazy"
                  />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
      
      <div className="equipment-note" aria-labelledby="note-heading">
        <h3 id="note-heading">Remarque sur l'équipement</h3>
        <p>
          Assurez-vous que tout votre équipement est en bon état avant de commencer l'entraînement.
          Pour les entraînements en extérieur, prévoyez l'équipement supplémentaire en fonction des
          conditions météorologiques. Les informations météo sont disponibles dans l'application.
        </p>
      </div>
    </div>
  );
};

// Le composant ne change pas souvent; exportation simple sans mémo car son parent contrôle les re-renders
export default WorkoutEquipmentTab;
