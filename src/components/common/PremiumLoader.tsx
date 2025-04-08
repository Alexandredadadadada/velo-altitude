import React from 'react';
import { motion } from 'framer-motion';
import './PremiumLoader.css';

type LoaderColorType = 'gradient' | 'blue' | 'pink' | 'white';
type LoaderType = 'spinner' | 'pulse' | 'dots';

interface PremiumLoaderProps {
  /** Taille du loader en pixels */
  size?: number;
  /** Couleur du loader */
  color?: LoaderColorType;
  /** Texte optionnel à afficher sous le loader */
  text?: string;
  /** Classes CSS additionnelles */
  className?: string;
  /** Type d'animation du loader */
  type?: LoaderType;
  /** Si true, affiche un overlay sur tout l'écran */
  overlay?: boolean;
}

/**
 * Composant de loader premium avec animation fluide
 * Conçu pour maintenir l'expérience utilisateur premium pendant les chargements
 * 
 * @component
 */
export const PremiumLoader: React.FC<PremiumLoaderProps> = ({ 
  size = 40, 
  color = 'gradient', 
  text,
  className = '',
  type = 'spinner',
  overlay = false,
}) => {
  // Déterminer la classe de couleur
  const colorClass = {
    'gradient': 'premium-loader--gradient',
    'blue': 'premium-loader--blue',
    'pink': 'premium-loader--pink',
    'white': 'premium-loader--white'
  }[color] || 'premium-loader--gradient';
  
  // Animations pour les différents types de loaders
  const spinnerVariants = {
    animate: {
      rotate: 360,
      transition: {
        repeat: Infinity,
        duration: 1.5,
        ease: "linear"
      }
    }
  };
  
  const pulseVariants = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        repeat: Infinity,
        duration: 1.8,
        ease: "easeInOut"
      }
    }
  };
  
  const dotVariants = {
    animate: (i: number) => ({
      y: [0, -10, 0],
      transition: {
        repeat: Infinity,
        duration: 1,
        ease: "easeInOut",
        delay: i * 0.2
      }
    })
  };
  
  // Rendu du loader selon le type choisi
  const renderLoader = () => {
    switch (type) {
      case 'pulse':
        return (
          <motion.div
            className={`premium-loader__pulse ${colorClass}`}
            style={{ width: size, height: size }}
            variants={pulseVariants}
            animate="animate"
            aria-hidden="true"
          />
        );
      case 'dots':
        return (
          <div 
            className="premium-loader__dots"
            style={{ height: size }}
            role="status"
            aria-label={text || "Chargement en cours"}
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className={`premium-loader__dot ${colorClass}`}
                style={{ width: size / 5, height: size / 5 }}
                custom={i}
                variants={dotVariants}
                animate="animate"
                aria-hidden="true"
              />
            ))}
          </div>
        );
      case 'spinner':
      default:
        return (
          <motion.div
            className={`premium-loader__spinner ${colorClass}`}
            style={{ width: size, height: size, borderWidth: size / 10 }}
            variants={spinnerVariants}
            animate="animate"
            role="status"
            aria-label={text || "Chargement en cours"}
          />
        );
    }
  };
  
  // Si overlay, envelopper dans un conteneur plein écran
  if (overlay) {
    return (
      <div className="premium-loader-overlay" data-testid="premium-loader-overlay">
        <div className="premium-loader-container">
          {renderLoader()}
          {text && (
            <p className="premium-loader__text" aria-live="polite">
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }
  
  // Rendu standard
  return (
    <div className={`premium-loader ${className}`} data-testid="premium-loader">
      {renderLoader()}
      {text && (
        <p className="premium-loader__text" aria-live="polite">
          {text}
        </p>
      )}
    </div>
  );
};
