import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Composant d'animation de vélo utilisant Canvas
 * Affiche une animation de vélo stylisée pour les transitions et les écrans de chargement
 */
const BikeAnimationCanvas = ({ width = 300, height = 200, color = '#1976d2', speed = 1 }) => {
  const canvasRef = useRef(null);
  let animationFrameId;

  // Fonction pour dessiner un vélo stylisé
  const drawBike = (ctx, x, y, frameCount) => {
    const wheelRadius = 30;
    const frameSize = 40;
    
    // Calculer la rotation des roues basée sur le frameCount
    const wheelRotation = (frameCount * speed) % (Math.PI * 2);
    
    // Sauvegarder le contexte
    ctx.save();
    ctx.translate(x, y);
    
    // Dessiner les roues
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    
    // Roue arrière
    ctx.save();
    ctx.translate(-frameSize, 0);
    ctx.beginPath();
    ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Rayons de la roue arrière
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + wheelRotation;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(
        Math.cos(angle) * wheelRadius,
        Math.sin(angle) * wheelRadius
      );
      ctx.stroke();
    }
    ctx.restore();
    
    // Roue avant
    ctx.save();
    ctx.translate(frameSize, 0);
    ctx.beginPath();
    ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Rayons de la roue avant
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + wheelRotation;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(
        Math.cos(angle) * wheelRadius,
        Math.sin(angle) * wheelRadius
      );
      ctx.stroke();
    }
    ctx.restore();
    
    // Cadre du vélo
    ctx.beginPath();
    ctx.moveTo(-frameSize, 0); // Centre de la roue arrière
    ctx.lineTo(-frameSize/2, -frameSize/1.5); // Haut du cadre
    ctx.lineTo(frameSize/2, -frameSize/2); // Jonction du cadre
    ctx.lineTo(frameSize, 0); // Centre de la roue avant
    ctx.moveTo(-frameSize/2, -frameSize/1.5); // Haut du cadre
    ctx.lineTo(0, 0); // Pédalier
    ctx.moveTo(-frameSize/2, -frameSize/1.5); // Haut du cadre
    ctx.lineTo(0, -frameSize); // Guidon
    ctx.lineTo(frameSize/2, -frameSize/1.2); // Guidon avant
    ctx.stroke();
    
    // Pédalier animé
    const pedalRadius = 15;
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Pédales
    const pedalAngle = wheelRotation;
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(
      Math.cos(pedalAngle) * pedalRadius,
      Math.sin(pedalAngle) * pedalRadius
    );
    ctx.moveTo(0, 0);
    ctx.lineTo(
      Math.cos(pedalAngle + Math.PI) * pedalRadius,
      Math.sin(pedalAngle + Math.PI) * pedalRadius
    );
    ctx.stroke();
    
    // Pédales aux extrémités
    ctx.beginPath();
    ctx.arc(
      Math.cos(pedalAngle) * pedalRadius,
      Math.sin(pedalAngle) * pedalRadius,
      3, 0, Math.PI * 2
    );
    ctx.arc(
      Math.cos(pedalAngle + Math.PI) * pedalRadius,
      Math.sin(pedalAngle + Math.PI) * pedalRadius,
      3, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Restaurer le contexte
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    let frameCount = 0;
    let bikeX = -50;
    
    // Animation loop
    const render = () => {
      frameCount++;
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculer la position du vélo (mouvement cyclique)
      bikeX = (bikeX + speed) % (canvas.width + 100);
      if (bikeX < -50) bikeX = canvas.width + 50;
      
      // Dessiner le vélo
      drawBike(context, bikeX, canvas.height / 2, frameCount);
      
      // Continuer l'animation
      animationFrameId = window.requestAnimationFrame(render);
    };
    
    render();
    
    // Nettoyage lors du démontage du composant
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [color, speed]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height}
      style={{ 
        display: 'block', 
        margin: '0 auto',
        maxWidth: '100%'
      }}
    />
  );
};

BikeAnimationCanvas.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  color: PropTypes.string,
  speed: PropTypes.number
};

export default BikeAnimationCanvas;
