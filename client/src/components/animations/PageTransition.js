import React from 'react';
import { motion } from 'framer-motion';
import { Box } from '@mui/material';

const PageTransition = ({ children, transition = 'fade' }) => {
  // Définition des différentes animations de transition
  const transitions = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.4 }
    },
    slide: {
      initial: { opacity: 0, x: 100 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -100 },
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    scale: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.95 },
      transition: { duration: 0.5 }
    },
    slideUp: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -50 },
      transition: { type: 'spring', stiffness: 500, damping: 30 }
    }
  };
  
  // Utiliser la transition demandée ou la transition par défaut
  const currentTransition = transitions[transition] || transitions.fade;
  
  return (
    <motion.div
      initial={currentTransition.initial}
      animate={currentTransition.animate}
      exit={currentTransition.exit}
      transition={currentTransition.transition}
      style={{ width: '100%' }}
    >
      <Box sx={{ overflow: 'hidden' }}>
        {children}
      </Box>
    </motion.div>
  );
};

export default PageTransition;
