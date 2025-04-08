import React from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';
import './ErrorStateView.css';

interface ErrorStateViewProps {
  /** Titre de l'erreur */
  title?: string;
  /** Message détaillé de l'erreur */
  message?: string;
  /** Texte du bouton d'action */
  actionText?: string;
  /** Fonction à exécuter lors du clic sur le bouton */
  onAction?: () => void;
  /** Icône personnalisée */
  icon?: React.ReactNode;
}

/**
 * Composant pour afficher un état d'erreur avec animation et accessibilité
 * 
 * @component
 */
const ErrorStateView: React.FC<ErrorStateViewProps> = ({ 
  title = "Une erreur s'est produite", 
  message = "Nous n'avons pas pu charger les données demandées. Veuillez réessayer ultérieurement.",
  actionText,
  onAction,
  icon = <FiAlertTriangle size={48} />
}) => {
  return (
    <motion.div 
      className="error-state-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      role="alert"
      aria-live="assertive"
    >
      <motion.div 
        className="error-state-icon"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {icon}
      </motion.div>
      
      <h2 className="error-state-title">{title}</h2>
      <p className="error-state-message">{message}</p>
      
      {actionText && onAction && (
        <motion.button 
          className="error-state-action"
          onClick={onAction}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {actionText}
        </motion.button>
      )}
      
      <div className="error-state-details">
        <p className="error-state-hint">
          Si le problème persiste, veuillez contacter notre support.
        </p>
      </div>
    </motion.div>
  );
};

export default ErrorStateView;
