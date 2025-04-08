import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import './ElevationProfile.css';

/**
 * Composant pour afficher le profil d'élévation d'un col
 * Visualisation interactive avec informations détaillées
 * 
 * @component
 * @param {Object} props - Les propriétés du composant
 * @param {Array} props.data - Les données d'élévation du profil
 */
export const ElevationProfile = ({ data }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [canvasRect, setCanvasRect] = useState({ width: 0, height: 0 });
  
  // Recalculer le rect du canvas lors du redimensionnement
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        setCanvasRect({
          width: canvasRef.current.width,
          height: canvasRef.current.height
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Dessiner le profil d'élévation
  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Dimensions du canvas
    const width = canvas.width;
    const height = canvas.height;
    
    // Effacer le canvas
    ctx.clearRect(0, 0, width, height);
    
    // Définir les marges
    const margin = {
      top: 20,
      right: 30,
      bottom: 30,
      left: 50
    };
    
    // Dimensions de la zone de dessin
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    
    // Trouver les valeurs min/max pour les échelles
    const distanceMax = Math.max(...data.map(d => d.distance));
    const elevationMin = Math.min(...data.map(d => d.elevation));
    const elevationMax = Math.max(...data.map(d => d.elevation));
    
    // Fonction pour convertir les données en coordonnées du canvas
    const xScale = (distance) => margin.left + (distance / distanceMax) * plotWidth;
    const yScale = (elevation) => height - margin.bottom - ((elevation - elevationMin) / (elevationMax - elevationMin)) * plotHeight;
    
    // Dessiner la grille de fond
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Lignes horizontales
    const elevationStep = Math.ceil((elevationMax - elevationMin) / 5 / 100) * 100;
    for (let e = Math.floor(elevationMin / elevationStep) * elevationStep; e <= elevationMax; e += elevationStep) {
      const y = yScale(e);
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      
      // Étiquettes de l'axe Y
      ctx.font = '12px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${e}m`, margin.left - 10, y);
    }
    
    // Lignes verticales
    const distanceStep = Math.ceil(distanceMax / 5);
    for (let d = 0; d <= distanceMax; d += distanceStep) {
      const x = xScale(d);
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, height - margin.bottom);
      
      // Étiquettes de l'axe X
      ctx.font = '12px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${d}km`, x, height - margin.bottom + 10);
    }
    
    ctx.stroke();
    
    // Dessiner la courbe d'élévation
    ctx.beginPath();
    ctx.moveTo(xScale(data[0].distance), yScale(data[0].elevation));
    
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(xScale(data[i].distance), yScale(data[i].elevation));
    }
    
    // Style pour la ligne du profil
    ctx.strokeStyle = 'rgba(52, 148, 230, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Remplir la zone sous la courbe
    ctx.lineTo(xScale(data[data.length - 1].distance), yScale(elevationMin));
    ctx.lineTo(xScale(data[0].distance), yScale(elevationMin));
    ctx.closePath();
    
    // Dégradé pour le remplissage
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(52, 148, 230, 0.5)');
    gradient.addColorStop(1, 'rgba(52, 148, 230, 0.1)');
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Ajouter des points significatifs
    // Points de départ, sommet et fin
    const pointsOfInterest = [
      { index: 0, label: 'Départ' },
      { 
        index: data.findIndex(d => d.elevation === elevationMax), 
        label: 'Sommet' 
      },
      { index: data.length - 1, label: 'Arrivée' }
    ];
    
    pointsOfInterest.forEach(poi => {
      const point = data[poi.index];
      const x = xScale(point.distance);
      const y = yScale(point.elevation);
      
      // Dessiner le point
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#EC6EAD';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Ajouter l'étiquette
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(poi.label, x, y - 15);
      
      // Ajouter l'élévation
      ctx.font = '12px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(`${Math.round(point.elevation)}m`, x, y - 30);
    });
    
    // Sauvegarder les dimensions pour l'interaction
    setCanvasRect({
      width: canvas.width,
      height: canvas.height,
      margin,
      plotWidth,
      plotHeight,
      xScale,
      yScale,
      distanceMax,
      elevationMin,
      elevationMax
    });
  }, [data, canvasRect.width, canvasRect.height]);
  
  // Gérer le survol du profil
  const handleMouseMove = (e) => {
    if (!canvasRef.current || !data || data.length === 0 || !canvasRect.xScale) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Coordonnées de la souris relativement au canvas
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Vérifier si la souris est dans la zone du graphique
    if (
      mouseX < canvasRect.margin.left || 
      mouseX > canvas.width - canvasRect.margin.right || 
      mouseY < canvasRect.margin.top || 
      mouseY > canvas.height - canvasRect.margin.bottom
    ) {
      setHoveredPoint(null);
      return;
    }
    
    // Convertir la position X de la souris en distance
    const distance = ((mouseX - canvasRect.margin.left) / canvasRect.plotWidth) * canvasRect.distanceMax;
    
    // Trouver le point de données le plus proche
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    data.forEach((point, index) => {
      const d = Math.abs(point.distance - distance);
      if (d < closestDistance) {
        closestDistance = d;
        closestIndex = index;
      }
    });
    
    const closestPoint = data[closestIndex];
    
    // Mettre à jour le point survolé
    setHoveredPoint({
      x: canvasRect.xScale(closestPoint.distance),
      y: canvasRect.yScale(closestPoint.elevation),
      distance: closestPoint.distance,
      elevation: closestPoint.elevation
    });
  };
  
  // Gérer la sortie de la souris du canvas
  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };
  
  // Calculer les statistiques du profil
  const getProfileStats = () => {
    if (!data || data.length === 0) return { distance: 0, elevationGain: 0, maxGradient: 0 };
    
    const distance = data[data.length - 1].distance;
    
    let elevationGain = 0;
    let maxGradient = 0;
    
    for (let i = 1; i < data.length; i++) {
      const elevationDiff = data[i].elevation - data[i - 1].elevation;
      if (elevationDiff > 0) {
        elevationGain += elevationDiff;
      }
      
      const segmentDistance = data[i].distance - data[i - 1].distance;
      if (segmentDistance > 0) {
        const gradient = (elevationDiff / segmentDistance) / 10; // en %
        if (gradient > maxGradient) {
          maxGradient = gradient;
        }
      }
    }
    
    return {
      distance: distance.toFixed(1),
      elevationGain: Math.round(elevationGain),
      maxGradient: maxGradient.toFixed(1)
    };
  };
  
  const stats = getProfileStats();
  
  return (
    <div className="elevation-profile-container" ref={containerRef}>
      <div className="elevation-profile-header">
        <div className="elevation-profile-stat">
          <div className="profile-stat-label">Distance</div>
          <div className="profile-stat-value">{stats.distance}km</div>
        </div>
        <div className="elevation-profile-stat">
          <div className="profile-stat-label">Dénivelé</div>
          <div className="profile-stat-value">{stats.elevationGain}m</div>
        </div>
        <div className="elevation-profile-stat">
          <div className="profile-stat-label">Pente max</div>
          <div className="profile-stat-value">{stats.maxGradient}%</div>
        </div>
      </div>
      
      <div className="elevation-profile-canvas-container">
        <canvas
          ref={canvasRef}
          className="elevation-profile-canvas"
          width={800}
          height={400}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        
        {hoveredPoint && (
          <motion.div
            className="elevation-profile-tooltip glass"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              left: `${hoveredPoint.x}px`,
              top: `${hoveredPoint.y - 60}px`,
              transform: 'translate(-50%, 0)',
              pointerEvents: 'none'
            }}
          >
            <div className="tooltip-distance">{hoveredPoint.distance.toFixed(1)} km</div>
            <div className="tooltip-elevation">{Math.round(hoveredPoint.elevation)} m</div>
          </motion.div>
        )}
        
        {hoveredPoint && (
          <motion.div
            className="elevation-profile-marker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              left: `${hoveredPoint.x}px`,
              top: `${hoveredPoint.y}px`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none'
            }}
          />
        )}
      </div>
      
      <div className="elevation-profile-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: 'rgba(52, 148, 230, 0.8)' }}></div>
          <div className="legend-label">Élévation</div>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#EC6EAD' }}></div>
          <div className="legend-label">Points clés</div>
        </div>
      </div>
    </div>
  );
};
