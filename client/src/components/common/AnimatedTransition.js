import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import './AnimatedTransition.css';

/**
 * Composant de transition animée pour améliorer l'expérience utilisateur
 * Utilise Framer Motion pour des animations fluides et professionnelles
 * 
 * @param {Object} props - Propriétés du composant
 * @param {React.ReactNode} props.children - Contenu à animer
 * @param {string} props.type - Type d'animation (fade, slide, zoom, etc.)
 * @param {number} props.duration - Durée de l'animation en secondes
 * @param {boolean} props.isVisible - Si le contenu doit être visible
 * @param {string} props.direction - Direction de l'animation (pour slide: left, right, up, down)
 * @param {Function} props.onAnimationComplete - Callback à la fin de l'animation
 */
const AnimatedTransition = ({ 
  children, 
  type = 'fade', 
  duration = 0.5, 
  isVisible = true,
  direction = 'right',
  onAnimationComplete = () => {}
}) => {
  // Définir les variantes d'animation selon le type
  const getVariants = () => {
    switch (type) {
      case 'fade':
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
          exit: { opacity: 0 }
        };
      
      case 'slide':
        const offset = direction === 'left' ? -100 : 
                      direction === 'right' ? 100 : 
                      direction === 'up' ? -100 : 100;
        
        const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
        
        return {
          hidden: { [axis]: offset, opacity: 0 },
          visible: { [axis]: 0, opacity: 1 },
          exit: { [axis]: -offset, opacity: 0 }
        };
      
      case 'zoom':
        return {
          hidden: { scale: 0.8, opacity: 0 },
          visible: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 }
        };
      
      case 'flip':
        return {
          hidden: { rotateY: 90, opacity: 0 },
          visible: { rotateY: 0, opacity: 1 },
          exit: { rotateY: -90, opacity: 0 }
        };
      
      case 'expand':
        return {
          hidden: { height: 0, opacity: 0, overflow: 'hidden' },
          visible: { height: 'auto', opacity: 1, overflow: 'visible' },
          exit: { height: 0, opacity: 0, overflow: 'hidden' }
        };
        
      case 'bounce':
        return {
          hidden: { y: -50, opacity: 0 },
          visible: { 
            y: 0, 
            opacity: 1,
            transition: {
              type: 'spring',
              stiffness: 300,
              damping: 15
            }
          },
          exit: { y: 50, opacity: 0 }
        };
        
      case 'rotate':
        return {
          hidden: { rotate: -90, opacity: 0, scale: 0.8 },
          visible: { rotate: 0, opacity: 1, scale: 1 },
          exit: { rotate: 90, opacity: 0, scale: 0.8 }
        };
        
      case 'stagger':
        return {
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          },
          exit: { opacity: 0 }
        };
        
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };

  const variants = getVariants();
  
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          className={`animated-transition animated-transition-${type}`}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={variants}
          transition={{ duration }}
          onAnimationComplete={onAnimationComplete}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

AnimatedTransition.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['fade', 'slide', 'zoom', 'flip', 'expand', 'bounce', 'rotate', 'stagger']),
  duration: PropTypes.number,
  isVisible: PropTypes.bool,
  direction: PropTypes.oneOf(['left', 'right', 'up', 'down']),
  onAnimationComplete: PropTypes.func
};

export default AnimatedTransition;
