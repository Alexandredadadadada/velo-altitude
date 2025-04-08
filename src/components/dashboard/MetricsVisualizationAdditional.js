import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import './MetricsVisualization.css';

/**
 * Composants additionnels de visualisation de métriques premium
 * 
 * @module MetricsVisualizationAdditional
 */

/**
 * Graphique en radar (polygone) pour visualisation des compétences/statistiques
 * 
 * @component
 */
export const RadarChart = ({
  data,
  labels,
  size = 250,
  animate = true,
  fillColor = 'rgba(52, 148, 230, 0.2)',
  strokeColor = '#3494E6',
  labelColor = 'rgba(255, 255, 255, 0.7)',
  showLabels = true,
  showValues = false,
  maxValue = 100,
  formatValue
}) => {
  const [activePointIndex, setActivePointIndex] = useState(null);
  
  if (!data || data.length === 0 || !labels || labels.length === 0) {
    return <div className="metrics-radar-empty">Données insuffisantes</div>;
  }
  
  // Nombre de points/angles dans le radar
  const pointCount = data.length;
  
  // Rayon du cercle
  const radius = size / 2 - 30;
  
  // Centre du cercle
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Calculer les coordonnées pour chaque point
  const calculatePoint = (value, index) => {
    // Normaliser la valeur (entre 0 et 1)
    const normalizedValue = Math.min(value, maxValue) / maxValue;
    
    // Calculer l'angle (commencer à midi, aller dans le sens des aiguilles d'une montre)
    const angle = (Math.PI * 2 * index) / pointCount - Math.PI / 2;
    
    // Calculer les coordonnées
    const x = centerX + radius * normalizedValue * Math.cos(angle);
    const y = centerY + radius * normalizedValue * Math.sin(angle);
    
    return { x, y, value, index };
  };
  
  // Calculer les coordonnées des points
  const points = data.map((value, index) => calculatePoint(value, index));
  
  // Créer le chemin SVG pour le polygone
  const createPolygonPath = (points) => {
    return points.map(point => `${point.x},${point.y}`).join(' ');
  };
  
  // Créer les cercles de référence (grille)
  const createGrid = () => {
    const gridLevels = 4; // Nombre de cercles concentriques
    const gridCircles = [];
    const gridLines = [];
    
    // Cercles concentriques
    for (let i = 1; i <= gridLevels; i++) {
      const gridRadius = (radius * i) / gridLevels;
      gridCircles.push(
        <circle
          key={`grid-circle-${i}`}
          cx={centerX}
          cy={centerY}
          r={gridRadius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeDasharray="2,3"
        />
      );
    }
    
    // Lignes du centre vers chaque angle
    for (let i = 0; i < pointCount; i++) {
      const angle = (Math.PI * 2 * i) / pointCount - Math.PI / 2;
      const endX = centerX + radius * Math.cos(angle);
      const endY = centerY + radius * Math.sin(angle);
      
      gridLines.push(
        <line
          key={`grid-line-${i}`}
          x1={centerX}
          y1={centerY}
          x2={endX}
          y2={endY}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeDasharray="2,3"
        />
      );
    }
    
    return [...gridCircles, ...gridLines];
  };
  
  // Créer les étiquettes pour chaque point
  const createLabels = () => {
    return labels.map((label, index) => {
      const angle = (Math.PI * 2 * index) / pointCount - Math.PI / 2;
      const labelDistance = radius + 20; // Distance du centre aux étiquettes
      const x = centerX + labelDistance * Math.cos(angle);
      const y = centerY + labelDistance * Math.sin(angle);
      
      // Ajuster l'alignement du texte en fonction de la position
      let textAnchor = 'middle';
      if (angle < -Math.PI * 0.25 || angle > Math.PI * 0.75) textAnchor = 'end';
      if (angle > -Math.PI * 0.25 && angle < Math.PI * 0.25) textAnchor = 'start';
      
      return (
        <text
          key={`label-${index}`}
          x={x}
          y={y}
          textAnchor={textAnchor}
          dominantBaseline="central"
          fontSize="12"
          fill={labelColor}
        >
          {label}
        </text>
      );
    });
  };
  
  // Formater la valeur pour l'affichage
  const formatDisplayValue = (value) => {
    if (formatValue) return formatValue(value);
    return value.toFixed(0);
  };
  
  // Gérer le survol des points
  const handlePointHover = (index) => {
    setActivePointIndex(index);
  };
  
  return (
    <div className="metrics-chart metrics-radar-chart">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="metrics-radar-svg">
        {/* Grille en arrière-plan */}
        {createGrid()}
        
        {/* Polygone de données */}
        <motion.polygon
          points={createPolygonPath(points)}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinejoin="round"
          initial={animate ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        
        {/* Points sur chaque angle */}
        {points.map((point, index) => (
          <motion.g key={index}>
            <motion.circle
              cx={point.x}
              cy={point.y}
              r={activePointIndex === index ? 6 : 4}
              fill={activePointIndex === index ? 'white' : strokeColor}
              stroke={strokeColor}
              strokeWidth="2"
              initial={animate ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: animate ? 0.8 + (index * 0.05) : 0 }}
              onMouseEnter={() => handlePointHover(index)}
              onMouseLeave={() => setActivePointIndex(null)}
              className="metrics-chart-point"
            />
            
            {/* Valeur près du point */}
            {(showValues || activePointIndex === index) && (
              <motion.text
                x={point.x}
                y={point.y - 12}
                textAnchor="middle"
                fontSize="11"
                fontWeight="bold"
                fill="white"
                initial={animate ? { opacity: 0 } : { opacity: 1 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: animate ? 1 + (index * 0.05) : 0 }}
              >
                {formatDisplayValue(point.value)}
              </motion.text>
            )}
          </motion.g>
        ))}
        
        {/* Étiquettes */}
        {showLabels && createLabels()}
      </svg>
    </div>
  );
};

RadarChart.propTypes = {
  data: PropTypes.array.isRequired,
  labels: PropTypes.array.isRequired,
  size: PropTypes.number,
  animate: PropTypes.bool,
  fillColor: PropTypes.string,
  strokeColor: PropTypes.string,
  labelColor: PropTypes.string,
  showLabels: PropTypes.bool,
  showValues: PropTypes.bool,
  maxValue: PropTypes.number,
  formatValue: PropTypes.func
};

/**
 * Anneau de progression circulaire avec animation fluide
 * 
 * @component
 */
export const ProgressRing = ({
  value,
  maxValue = 100,
  size = 120,
  strokeWidth = 8,
  animate = true,
  duration = 1.5,
  showValue = true,
  label,
  valuePrefix = '',
  valueSuffix = '',
  primaryColor = '#3494E6',
  secondaryColor = 'rgba(255, 255, 255, 0.1)',
  valueColor = 'white',
  labelColor = 'rgba(255, 255, 255, 0.7)',
  formatValue
}) => {
  // Normaliser la valeur entre 0 et 1
  const percentage = Math.min(Math.max(value, 0), maxValue) / maxValue;
  
  // Calculer les dimensions
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage);
  
  // Centre du cercle
  const center = size / 2;
  
  // Formater la valeur pour l'affichage
  const formattedValue = formatValue 
    ? formatValue(value) 
    : Math.round(value).toString();
  
  return (
    <div className="metrics-chart metrics-progress-ring">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Cercle de fond (gris) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={secondaryColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Cercle de progression (coloré) */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ 
            strokeDashoffset: animate ? circumference : strokeDashoffset 
          }}
          animate={{ 
            strokeDashoffset: strokeDashoffset 
          }}
          transition={{ 
            duration: duration, 
            ease: "easeOut" 
          }}
          transform={`rotate(-90, ${center}, ${center})`}
        />
        
        {/* Valeur et label */}
        <g>
          {showValue && (
            <motion.text
              x={center}
              y={label ? center - 10 : center}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={size * 0.18}
              fontWeight="bold"
              fill={valueColor}
              initial={animate ? { opacity: 0 } : { opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: animate ? duration * 0.7 : 0 }}
            >
              {valuePrefix}{formattedValue}{valueSuffix}
            </motion.text>
          )}
          
          {label && (
            <motion.text
              x={center}
              y={center + (showValue ? 15 : 0)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={size * 0.11}
              fill={labelColor}
              initial={animate ? { opacity: 0 } : { opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: animate ? duration * 0.7 : 0 }}
            >
              {label}
            </motion.text>
          )}
        </g>
      </svg>
    </div>
  );
};

ProgressRing.propTypes = {
  value: PropTypes.number.isRequired,
  maxValue: PropTypes.number,
  size: PropTypes.number,
  strokeWidth: PropTypes.number,
  animate: PropTypes.bool,
  duration: PropTypes.number,
  showValue: PropTypes.bool,
  label: PropTypes.string,
  valuePrefix: PropTypes.string,
  valueSuffix: PropTypes.string,
  primaryColor: PropTypes.string,
  secondaryColor: PropTypes.string,
  valueColor: PropTypes.string,
  labelColor: PropTypes.string,
  formatValue: PropTypes.func
};

/**
 * Jauge d'indicateur semi-circulaire
 * 
 * @component
 */
export const GaugeChart = ({
  value,
  minValue = 0,
  maxValue = 100,
  size = 160,
  animate = true,
  showValue = true,
  label,
  ranges = [],
  valuePrefix = '',
  valueSuffix = '',
  formatValue
}) => {
  // Normaliser la valeur entre 0 et 1
  const normalizedValue = Math.min(Math.max(value, minValue), maxValue);
  const percentage = (normalizedValue - minValue) / (maxValue - minValue);
  
  // Dimensions
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size - 5;
  
  // Angle de l'aiguille (0 = gauche, 1 = droite)
  const minAngle = -90;
  const maxAngle = 90;
  const needleAngle = minAngle + percentage * (maxAngle - minAngle);
  
  // Longueur de l'aiguille
  const needleLength = radius - 15;
  
  // Point final de l'aiguille
  const needleX = centerX + needleLength * Math.cos(needleAngle * Math.PI / 180);
  const needleY = centerY + needleLength * Math.sin(needleAngle * Math.PI / 180);
  
  // Formatage de la valeur
  const formattedValue = formatValue 
    ? formatValue(normalizedValue)
    : Math.round(normalizedValue).toString();
  
  // Fonction pour générer l'arc
  const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    
    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
  };
  
  // Conversion d'angle polaire en coordonnées cartésiennes
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };
  
  // Création des marques de graduation
  const createTicks = () => {
    const ticks = [];
    const tickCount = 5;
    
    for (let i = 0; i <= tickCount; i++) {
      const angle = minAngle + (i / tickCount) * (maxAngle - minAngle);
      const tickLength = i % tickCount === 0 ? 10 : 5;
      const outerPoint = polarToCartesian(centerX, centerY, radius, angle);
      const innerPoint = polarToCartesian(centerX, centerY, radius - tickLength, angle);
      
      ticks.push(
        <line
          key={`tick-${i}`}
          x1={innerPoint.x}
          y1={innerPoint.y}
          x2={outerPoint.x}
          y2={outerPoint.y}
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="1.5"
        />
      );
      
      // Ajouter des chiffres aux graduations principales
      if (i % Math.ceil(tickCount / 5) === 0 || i === tickCount) {
        const value = minValue + (i / tickCount) * (maxValue - minValue);
        const labelPoint = polarToCartesian(centerX, centerY, radius + 15, angle);
        
        ticks.push(
          <text
            key={`tick-label-${i}`}
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10"
            fill="rgba(255, 255, 255, 0.6)"
          >
            {Math.round(value)}
          </text>
        );
      }
    }
    
    return ticks;
  };
  
  // Création des plages de couleur
  const createRanges = () => {
    if (!ranges || ranges.length === 0) {
      // Arc par défaut si aucune plage n'est définie
      return (
        <path
          d={describeArc(centerX, centerY, radius, minAngle, maxAngle)}
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={strokeWidth}
        />
      );
    }
    
    // Trier les plages par valeur de début
    const sortedRanges = [...ranges].sort((a, b) => a.start - b.start);
    
    return sortedRanges.map((range, index) => {
      const rangeStart = Math.max(range.start, minValue);
      const rangeEnd = Math.min(range.end, maxValue);
      
      // Convertir les valeurs en angles
      const startPercentage = (rangeStart - minValue) / (maxValue - minValue);
      const endPercentage = (rangeEnd - minValue) / (maxValue - minValue);
      const startAngle = minAngle + startPercentage * (maxAngle - minAngle);
      const endAngle = minAngle + endPercentage * (maxAngle - minAngle);
      
      return (
        <path
          key={`range-${index}`}
          d={describeArc(centerX, centerY, radius, startAngle, endAngle)}
          fill="none"
          stroke={range.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      );
    });
  };
  
  return (
    <div className="metrics-chart metrics-gauge-chart">
      <svg width={size} height={size / 1.6} viewBox={`0 0 ${size} ${size / 1.6}`}>
        {/* Plages de couleur */}
        <g className="gauge-ranges">
          {createRanges()}
        </g>
        
        {/* Graduations */}
        <g className="gauge-ticks">
          {createTicks()}
        </g>
        
        {/* Aiguille */}
        <motion.line
          x1={centerX}
          y1={centerY}
          x2={needleX}
          y2={needleY}
          stroke="#EC6EAD"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ 
            rotate: animate ? minAngle : needleAngle,
            originX: centerX,
            originY: centerY
          }}
          animate={{ 
            rotate: needleAngle,
            originX: centerX,
            originY: centerY
          }}
          transition={{ 
            type: "spring",
            stiffness: 50,
            damping: 15
          }}
        />
        
        {/* Point central de l'aiguille */}
        <circle
          cx={centerX}
          cy={centerY}
          r="5"
          fill="#EC6EAD"
        />
        
        {/* Valeur et label */}
        <g className="gauge-labels">
          {showValue && (
            <motion.text
              x={centerX}
              y={centerY - radius / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="18"
              fontWeight="bold"
              fill="white"
              initial={animate ? { opacity: 0, y: centerY - radius / 2 + 10 } : { opacity: 1, y: centerY - radius / 2 }}
              animate={{ opacity: 1, y: centerY - radius / 2 }}
              transition={{ duration: 0.5, delay: animate ? 0.5 : 0 }}
            >
              {valuePrefix}{formattedValue}{valueSuffix}
            </motion.text>
          )}
          
          {label && (
            <motion.text
              x={centerX}
              y={centerY - radius / 2 + 20}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="12"
              fill="rgba(255, 255, 255, 0.7)"
              initial={animate ? { opacity: 0 } : { opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: animate ? 0.7 : 0 }}
            >
              {label}
            </motion.text>
          )}
        </g>
      </svg>
    </div>
  );
};

GaugeChart.propTypes = {
  value: PropTypes.number.isRequired,
  minValue: PropTypes.number,
  maxValue: PropTypes.number,
  size: PropTypes.number,
  animate: PropTypes.bool,
  showValue: PropTypes.bool,
  label: PropTypes.string,
  ranges: PropTypes.arrayOf(PropTypes.shape({
    start: PropTypes.number.isRequired,
    end: PropTypes.number.isRequired,
    color: PropTypes.string.isRequired
  })),
  valuePrefix: PropTypes.string,
  valueSuffix: PropTypes.string,
  formatValue: PropTypes.func
};
