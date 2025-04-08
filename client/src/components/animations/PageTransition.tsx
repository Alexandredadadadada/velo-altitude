import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './PageTransition.css';

/**
 * Types de transition disponibles
 * @typedef {'fade' | 'slide' | 'scale' | 'flip' | 'glide'} TransitionType
 */

/**
 * Props pour le composant PageTransition
 * @interface PageTransitionProps
 */
interface PageTransitionProps {
  /** Contenu de la page à afficher avec la transition */
  children: React.ReactNode;
  /** Objet location du routeur pour identifier la page actuelle */
  location?: {
    pathname: string;
    [key: string]: any;
  };
  /** Type de transition à utiliser */
  transitionType?: 'fade' | 'slide' | 'scale' | 'flip' | 'glide';
  /** Durée de la transition en secondes */
  duration?: number;
  /** Délai avant le début de la transition en secondes */
  delay?: number;
}

/**
 * @module UI/Animations
 * @component PageTransition
 * 
 * Composant de transition entre les pages
 * Crée des transitions fluides et élégantes entre les routes
 * pour une expérience de navigation premium et immersive
 * 
 * @example
 * ```tsx
 * <Router>
 *   <Routes>
 *     <Route path="/" element={
 *       <PageTransition transitionType="slide">
 *         <HomePage />
 *       </PageTransition>
 *     } />
 *   </Routes>
 * </Router>
 * ```
 */
const PageTransition = ({ 
  children, 
  location,
  transitionType = 'fade',
  duration = 0.5,
  delay = 0,
}: PageTransitionProps): React.ReactElement => {
  // Variantes d'animation selon le type choisi
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.05 },
    },
    flip: {
      initial: { opacity: 0, rotateY: 90 },
      animate: { opacity: 1, rotateY: 0 },
      exit: { opacity: 0, rotateY: -90 },
    },
    glide: {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -30 },
    },
  };

  // Sélectionner les variantes en fonction du type de transition
  const selectedVariants = variants[transitionType] || variants.fade;

  // Create the AnimatePresence element with function call syntax
  const animatedContent = AnimatePresence({
    mode: "wait",
    children: (
      <motion.div
        key={location?.pathname || 'default-key'}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={selectedVariants}
        transition={{ 
          type: "tween", 
          ease: "easeInOut", 
          duration, 
          delay 
        }}
        className="page-transition-container"
      >
        {children}
      </motion.div>
    )
  });

  // Return a div wrapper to ensure we always return a valid React element
  return <>{animatedContent}</>;
};

export default PageTransition;
