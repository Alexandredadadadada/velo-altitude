import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import '../../design-system/styles/glassmorphism.scss';
import './PremiumModal.css';

/**
 * Modale premium avec effet glassmorphism et animations fluides
 * 
 * Composant réutilisable pour afficher du contenu dans une modale élégante
 * avec différentes tailles, variantes visuelles et comportements.
 */
const PremiumModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium', // 'small', 'medium', 'large', 'fullscreen'
  variant = 'default', // 'default', 'success', 'warning', 'error', 'info'
  position = 'center', // 'center', 'top', 'bottom'
  showCloseButton = true,
  closeOnClickOutside = true,
  closeOnEsc = true,
  showBackdrop = true,
  customBackdrop = null,
  className = '',
  onAfterOpen,
  onBeforeClose,
  footer,
  contentScrollable = true,
  maxHeight,
  enableParallax = false,
}) => {
  const modalRef = useRef(null);
  const contentRef = useRef(null);
  
  // Gestion de la touche Echap pour fermer la modale
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc]);
  
  // Callback après ouverture
  useEffect(() => {
    if (isOpen && onAfterOpen) {
      onAfterOpen();
    }
  }, [isOpen, onAfterOpen]);
  
  // Empêcher le scroll du body quand la modale est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // Gestion de la fermeture
  const handleClose = async () => {
    if (onBeforeClose) {
      const shouldClose = await onBeforeClose();
      if (shouldClose === false) return;
    }
    
    onClose();
  };
  
  // Gestion du clic à l'extérieur
  const handleOutsideClick = (e) => {
    if (closeOnClickOutside && modalRef.current && !contentRef.current.contains(e.target)) {
      handleClose();
    }
  };
  
  // Gestion de l'effet parallaxe
  const handleMouseMove = (e) => {
    if (!enableParallax || !contentRef.current) return;
    
    const { left, top, width, height } = contentRef.current.getBoundingClientRect();
    
    // Position relative de la souris par rapport à la modale (de -1 à 1)
    const x = ((e.clientX - left) / width - 0.5) * 2;
    const y = ((e.clientY - top) / height - 0.5) * 2;
    
    // Appliquer une légère transformation en 3D
    contentRef.current.style.transform = `perspective(1000px) rotateX(${y * -3}deg) rotateY(${x * 3}deg) translateZ(10px)`;
  };
  
  const handleMouseLeave = () => {
    if (!enableParallax || !contentRef.current) return;
    
    // Réinitialiser la transformation
    contentRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
  };
  
  // Animations pour la modale
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };
  
  const getModalVariants = () => {
    switch(position) {
      case 'top':
        return {
          hidden: { opacity: 0, y: -50, scale: 0.95 },
          visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { 
              type: 'spring',
              damping: 25,
              stiffness: 300
            }
          },
          exit: { opacity: 0, y: -30, scale: 0.95, transition: { duration: 0.2 } }
        };
      case 'bottom':
        return {
          hidden: { opacity: 0, y: 50, scale: 0.95 },
          visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { 
              type: 'spring',
              damping: 25,
              stiffness: 300
            }
          },
          exit: { opacity: 0, y: 30, scale: 0.95, transition: { duration: 0.2 } }
        };
      default: // center
        return {
          hidden: { opacity: 0, scale: 0.85 },
          visible: { 
            opacity: 1, 
            scale: 1,
            transition: { 
              type: 'spring',
              damping: 25,
              stiffness: 300
            }
          },
          exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
        };
    }
  };
  
  // Classes pour la taille et la variante
  const modalSizeClass = `premium-modal__content--${size}`;
  const modalVariantClass = `premium-modal__content--${variant}`;
  const modalPositionClass = `premium-modal__container--${position}`;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="premium-modal" ref={modalRef} onClick={handleOutsideClick}>
          {/* Backdrop */}
          {showBackdrop && (
            <motion.div
              className="premium-modal__backdrop"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {customBackdrop}
            </motion.div>
          )}
          
          {/* Container */}
          <div className={`premium-modal__container ${modalPositionClass}`}>
            {/* Contenu de la modale */}
            <motion.div
              ref={contentRef}
              className={`premium-modal__content glass glass--premium ${modalSizeClass} ${modalVariantClass} ${className}`}
              variants={getModalVariants()}
              initial="hidden"
              animate="visible"
              exit="exit"
              onMouseMove={enableParallax ? handleMouseMove : undefined}
              onMouseLeave={enableParallax ? handleMouseLeave : undefined}
              style={{ maxHeight: maxHeight ? `${maxHeight}px` : 'calc(100vh - 40px)' }}
            >
              {/* En-tête */}
              {(title || showCloseButton) && (
                <div className="premium-modal__header">
                  {title && <h2 className="premium-modal__title">{title}</h2>}
                  {showCloseButton && (
                    <button
                      className="premium-modal__close-button"
                      aria-label="Fermer"
                      onClick={handleClose}
                    >
                      <span className="premium-modal__close-icon">×</span>
                    </button>
                  )}
                </div>
              )}
              
              {/* Corps */}
              <div 
                className={`premium-modal__body ${contentScrollable ? 'premium-modal__body--scrollable' : ''}`}
              >
                {children}
              </div>
              
              {/* Pied de page */}
              {footer && (
                <div className="premium-modal__footer">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

PremiumModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node,
  children: PropTypes.node,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'fullscreen']),
  variant: PropTypes.oneOf(['default', 'success', 'warning', 'error', 'info']),
  position: PropTypes.oneOf(['center', 'top', 'bottom']),
  showCloseButton: PropTypes.bool,
  closeOnClickOutside: PropTypes.bool,
  closeOnEsc: PropTypes.bool,
  showBackdrop: PropTypes.bool,
  customBackdrop: PropTypes.node,
  className: PropTypes.string,
  onAfterOpen: PropTypes.func,
  onBeforeClose: PropTypes.func,
  footer: PropTypes.node,
  contentScrollable: PropTypes.bool,
  maxHeight: PropTypes.number,
  enableParallax: PropTypes.bool,
};

export default PremiumModal;
