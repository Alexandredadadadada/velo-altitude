import React from 'react';
import { motion } from 'framer-motion';
import { FiInbox } from 'react-icons/fi';
import './EmptyStateView.css';

interface EmptyStateViewProps {
  /** Titre de l'état vide */
  title?: string;
  /** Message détaillé expliquant pourquoi l'état est vide */
  message?: string;
  /** Texte du bouton d'action (optionnel) */
  actionText?: string;
  /** Fonction à exécuter lors du clic sur le bouton */
  onAction?: () => void;
  /** Icône personnalisée (par défaut: FiInbox) */
  icon?: React.ReactNode;
  /** URL d'une image à afficher à la place de l'icône (optionnel) */
  imageUrl?: string;
}

/**
 * Composant pour afficher un état vide avec animation et accessibilité
 * 
 * @component
 */
const EmptyStateView: React.FC<EmptyStateViewProps> = ({ 
  title = "Aucun élément à afficher", 
  message = "Il n'y a actuellement aucun contenu à afficher dans cette vue.",
  actionText,
  onAction,
  icon = <FiInbox size={48} />,
  imageUrl
}) => {
  return (
    <motion.div 
      className="empty-state-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      role="status"
      aria-live="polite"
    >
      {imageUrl ? (
        <motion.div 
          className="empty-state-image"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <img 
            src={imageUrl} 
            alt="" 
            aria-hidden="true"
            loading="lazy"
          />
        </motion.div>
      ) : (
        <motion.div 
          className="empty-state-icon"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          aria-hidden="true"
        >
          {icon}
        </motion.div>
      )}
      
      <h2 className="empty-state-title">{title}</h2>
      <p className="empty-state-message">{message}</p>
      
      {actionText && onAction && (
        <motion.button 
          className="empty-state-action"
          onClick={onAction}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {actionText}
        </motion.button>
      )}
    </motion.div>
  );
};

export default EmptyStateView;
