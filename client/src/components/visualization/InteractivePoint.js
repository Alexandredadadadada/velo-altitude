import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Html } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import './InteractivePoint.css';

/**
 * Composant pour afficher un point d'intérêt interactif dans une visualisation 3D
 * Utilise React Three Fiber pour l'intégration avec Three.js
 */
const InteractivePoint = ({ 
  position, 
  color = '#e63946', 
  hoverColor = '#f1faee', 
  size = 0.5, 
  type = 'info', 
  title, 
  description, 
  icon,
  distance,
  elevation,
  onClick,
  visible = true,
  accessibilityLabel
}) => {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const pointRef = useRef();
  const timeout = useRef();

  // Animation de la sphère (pulsation)
  const { scale, sphereColor } = useSpring({
    scale: hovered ? [1.4, 1.4, 1.4] : [1, 1, 1],
    sphereColor: hovered ? hoverColor : color,
    config: { tension: 300, friction: 10 }
  });

  // Animation de l'infobulle
  const { opacity, transform } = useSpring({
    opacity: clicked || hovered ? 1 : 0,
    transform: `scale(${clicked || hovered ? 1 : 0.8})`,
    config: { tension: 300, friction: 20 }
  });

  // Gestion des événements de souris/toucher
  const handlePointerOver = (e) => {
    e.stopPropagation();
    setHovered(true);
    if (timeout.current) clearTimeout(timeout.current);
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    // Petit délai avant de fermer pour une meilleure UX
    timeout.current = setTimeout(() => {
      if (!clicked) setHovered(false);
    }, 200);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    setClicked(!clicked);
    if (onClick) onClick({ type, title, position, distance, elevation });
  };

  // Fermer le popup si on clique ailleurs
  useEffect(() => {
    const handleGlobalClick = () => {
      if (clicked) setClicked(false);
    };

    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, [clicked]);

  if (!visible) return null;

  // Détermine l'icône à afficher selon le type de point
  const getIconClass = () => {
    switch (type) {
      case 'water': return 'fas fa-tint';
      case 'view': return 'fas fa-mountain';
      case 'technical': return 'fas fa-tools';
      case 'danger': return 'fas fa-exclamation-triangle';
      case 'refreshment': return 'fas fa-utensils';
      case 'photo': return 'fas fa-camera';
      default: return 'fas fa-info-circle';
    }
  };

  return (
    <group position={position} ref={pointRef}>
      {/* Sphère interactive */}
      <animated.mesh
        scale={scale}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        aria-label={accessibilityLabel || title}
        role="button"
      >
        <sphereGeometry args={[size, 16, 16]} />
        <animated.meshStandardMaterial color={sphereColor} emissive={sphereColor} emissiveIntensity={0.5} />
      </animated.mesh>

      {/* Infobulle HTML (utilise Html de drei pour intégrer du HTML dans THREE.js) */}
      <Html position={[0, size * 2, 0]} center distanceFactor={10}>
        <animated.div 
          className={`interactive-point-tooltip ${clicked ? 'clicked' : ''}`}
          style={{ opacity, transform }}
          role="tooltip"
          aria-hidden={!clicked && !hovered}
        >
          <div className="interactive-point-header">
            <i className={`${icon || getIconClass()} point-icon point-${type}`} aria-hidden="true"></i>
            <h3>{title}</h3>
            {clicked && (
              <button className="close-button" onClick={() => setClicked(false)} aria-label="Fermer">
                <i className="fas fa-times" aria-hidden="true"></i>
              </button>
            )}
          </div>

          <div className="interactive-point-content">
            {description && <p>{description}</p>}
            
            {/* Informations additionnelles */}
            <div className="interactive-point-details">
              {distance !== undefined && (
                <div className="detail-item">
                  <i className="fas fa-road" aria-hidden="true"></i>
                  <span>{distance} km</span>
                </div>
              )}
              {elevation !== undefined && (
                <div className="detail-item">
                  <i className="fas fa-mountain" aria-hidden="true"></i>
                  <span>{elevation} m</span>
                </div>
              )}
            </div>
          </div>
        </animated.div>
      </Html>
    </group>
  );
};

InteractivePoint.propTypes = {
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
  color: PropTypes.string,
  hoverColor: PropTypes.string,
  size: PropTypes.number,
  type: PropTypes.oneOf(['info', 'water', 'view', 'technical', 'danger', 'refreshment', 'photo']),
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  icon: PropTypes.string,
  distance: PropTypes.number,
  elevation: PropTypes.number,
  onClick: PropTypes.func,
  visible: PropTypes.bool,
  accessibilityLabel: PropTypes.string
};

export default InteractivePoint;
