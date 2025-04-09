import React, { useState, useEffect, useRef } from 'react';
import { SimpleColVisualization } from '../../services/visualization/SimpleColVisualization';
import './ColVisualization3D.css';

/**
 * Composant de visualisation 3D des cols
 * Utilise le service SimpleColVisualization pour générer un profil d'élévation
 * sans dépendance à des API externes
 */
const ColVisualization3D = ({ col }) => {
  const [visualData, setVisualData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef(null);
  const visualizationService = new SimpleColVisualization();

  // Génère les données de visualisation à partir des données du col
  useEffect(() => {
    if (col) {
      try {
        const data = visualizationService.transformColTo3D(col);
        setVisualData(data);
      } catch (error) {
        console.error("Erreur lors de la transformation des données:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [col]);

  // Dessine le profil d'élévation sur le canvas
  useEffect(() => {
    if (visualData && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const { width, height } = canvas;

      // Effacer le canvas
      ctx.clearRect(0, 0, width, height);

      // Définir les marges et dimensions
      const margin = { top: 20, right: 20, bottom: 30, left: 40 };
      const graphWidth = width - margin.left - margin.right;
      const graphHeight = height - margin.top - margin.bottom;

      // Tracer le fond
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, width, height);

      if (visualData.points.length === 0) return;

      // Calculer les échelles
      const maxDistance = visualData.elevationProfile.distance;
      const minElevation = visualData.elevationProfile.start;
      const maxElevation = visualData.elevationProfile.summit;
      const elevationRange = maxElevation - minElevation;

      // Fonction pour convertir les coordonnées en pixels
      const scaleX = (distance) => margin.left + (distance / maxDistance) * graphWidth;
      const scaleY = (elevation) => height - margin.bottom - ((elevation - minElevation) / elevationRange) * graphHeight;

      // Tracer le profil
      ctx.beginPath();
      ctx.moveTo(scaleX(0), scaleY(visualData.points[0].elevation));
      
      visualData.points.forEach((point) => {
        ctx.lineTo(scaleX(point.distance), scaleY(point.elevation));
      });
      
      // Compléter le chemin et colorer
      ctx.lineTo(scaleX(maxDistance), scaleY(minElevation));
      ctx.lineTo(scaleX(0), scaleY(minElevation));
      ctx.closePath();
      
      // Remplir avec un dégradé
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(65, 105, 225, 0.7)');
      gradient.addColorStop(1, 'rgba(65, 105, 225, 0.1)');
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Tracer la ligne du profil
      ctx.beginPath();
      ctx.moveTo(scaleX(0), scaleY(visualData.points[0].elevation));
      
      visualData.points.forEach((point) => {
        ctx.lineTo(scaleX(point.distance), scaleY(point.elevation));
      });
      
      ctx.strokeStyle = '#2a5198';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Ajouter des axes
      ctx.beginPath();
      ctx.moveTo(margin.left, height - margin.bottom);
      ctx.lineTo(width - margin.right, height - margin.bottom);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(margin.left, margin.top);
      ctx.lineTo(margin.left, height - margin.bottom);
      ctx.stroke();
      
      // Ajouter des labels d'axe
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.fillText('Distance (km)', width / 2, height - 5);
      
      ctx.save();
      ctx.translate(10, height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Élévation (m)', 0, 0);
      ctx.restore();
      
      // Ajouter quelques repères
      ctx.font = '10px Arial';
      
      // Repères d'élévation
      for (let i = 0; i <= 4; i++) {
        const elevation = minElevation + (i / 4) * elevationRange;
        const y = scaleY(elevation);
        
        ctx.beginPath();
        ctx.moveTo(margin.left - 5, y);
        ctx.lineTo(margin.left, y);
        ctx.stroke();
        
        ctx.fillText(Math.round(elevation) + 'm', margin.left - 35, y + 4);
      }
      
      // Repères de distance
      for (let i = 0; i <= 5; i++) {
        const distance = (i / 5) * maxDistance;
        const x = scaleX(distance);
        
        ctx.beginPath();
        ctx.moveTo(x, height - margin.bottom);
        ctx.lineTo(x, height - margin.bottom + 5);
        ctx.stroke();
        
        ctx.fillText(distance.toFixed(1) + 'km', x - 10, height - margin.bottom + 20);
      }
      
      // Ajouter les points d'intérêt
      const sections = [
        { distance: 0, label: 'Départ' },
        { distance: maxDistance, label: 'Sommet' }
      ];
      
      sections.forEach(section => {
        const x = scaleX(section.distance);
        
        // Cercle pour le point d'intérêt
        ctx.beginPath();
        ctx.arc(x, section.distance === 0 
          ? scaleY(visualData.elevationProfile.start) 
          : scaleY(visualData.elevationProfile.summit), 
          5, 0, 2 * Math.PI);
        ctx.fillStyle = section.distance === 0 ? '#4CAF50' : '#F44336';
        ctx.fill();
        
        // Label pour le point d'intérêt
        ctx.fillStyle = '#333';
        ctx.font = 'bold 12px Arial';
        ctx.fillText(
          section.label, 
          x - 15, 
          section.distance === 0 
            ? scaleY(visualData.elevationProfile.start) - 10 
            : scaleY(visualData.elevationProfile.summit) - 10
        );
      });
    }
  }, [visualData]);

  if (isLoading) {
    return (
      <div className="col-visualization loading">
        <div className="loading-spinner"></div>
        <p>Chargement du profil d'élévation...</p>
      </div>
    );
  }

  if (!col || !visualData) {
    return (
      <div className="col-visualization error">
        <p>Impossible de charger les données du col</p>
      </div>
    );
  }

  return (
    <div className="col-visualization">
      <h3>Profil du {col.name}</h3>
      
      <div className="visualization-container">
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={300} 
          className="elevation-canvas"
        />
      </div>
      
      <div className="elevation-stats">
        <div className="stat-box">
          <span className="stat-label">Départ</span>
          <span className="stat-value">{Math.round(visualData.elevationProfile.start)}m</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Sommet</span>
          <span className="stat-value">{visualData.elevationProfile.summit}m</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Distance</span>
          <span className="stat-value">{visualData.elevationProfile.distance}km</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Pente moyenne</span>
          <span className="stat-value">{visualData.elevationProfile.gradient}%</span>
        </div>
        <div className="stat-box">
          <span className="stat-label">Dénivelé</span>
          <span className="stat-value">
            {Math.round(visualData.elevationProfile.summit - visualData.elevationProfile.start)}m
          </span>
        </div>
      </div>
      
      {col.climbs && col.climbs.length > 0 && (
        <div className="climbs-info">
          <h4>Points d'intérêt</h4>
          <ul>
            {col.climbs.map((climb, index) => (
              <li key={index}>
                {climb.name || `Section ${index + 1}`}: 
                {climb.gradient && ` ${climb.gradient}%`}
                {climb.length && ` sur ${climb.length}km`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ColVisualization3D;
