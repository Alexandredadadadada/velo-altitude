import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import './MetricsVisualization.css';

/**
 * Composants de visualisation de données premium pour le tableau de bord cyclisme
 * Inclut des graphiques personnalisés et des transitions animées
 * 
 * @module MetricsVisualization
 */

/**
 * Graphique en ligne avec animations fluides et interactions
 * 
 * @component
 */
export const LineChart = ({
  data,
  height = 200,
  width = '100%',
  animate = true,
  showPoints = true,
  showArea = true,
  showTooltip = true,
  lineColor = 'linear-gradient(90deg, #3494E6, #EC6EAD)',
  areaColor = 'linear-gradient(180deg, rgba(52, 148, 230, 0.2), rgba(236, 110, 173, 0))',
  pointColor = '#ffffff',
  gridLines = true,
  xAxisLabels,
  yAxisLabels,
  minDataValue = null,
  maxDataValue = null,
  formatTooltip
}) => {
  const [activePointIndex, setActivePointIndex] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const chartRef = useRef(null);
  
  // Si min et max ne sont pas spécifiés, les calculer à partir des données
  const dataMin = minDataValue !== null ? minDataValue : Math.min(...data);
  const dataMax = maxDataValue !== null ? maxDataValue : Math.max(...data);
  const range = dataMax - dataMin;
  
  // Ajouter une marge pour éviter que les points soient coupés
  const effectiveMin = dataMin - range * 0.05;
  const effectiveMax = dataMax + range * 0.05;
  const effectiveRange = effectiveMax - effectiveMin;
  
  // Calculer les coordonnées des points
  const getPoints = () => {
    if (!data || data.length === 0) return [];
    
    const chartWidth = chartRef.current ? chartRef.current.offsetWidth : 300;
    const chartHeight = height;
    const stepX = chartWidth / (data.length - 1);
    
    return data.map((value, index) => {
      const x = index * stepX;
      // Inverser l'axe Y (0 en haut, height en bas)
      const normalizedValue = (value - effectiveMin) / effectiveRange;
      const y = chartHeight - (normalizedValue * chartHeight);
      return { x, y, value };
    });
  };
  
  // Créer le chemin SVG pour la ligne
  const createLinePath = (points) => {
    if (!points || points.length === 0) return '';
    
    return points.reduce((path, point, index) => {
      if (index === 0) return `M ${point.x},${point.y}`;
      return `${path} L ${point.x},${point.y}`;
    }, '');
  };
  
  // Créer le chemin SVG pour l'aire sous la courbe
  const createAreaPath = (points) => {
    if (!points || points.length === 0) return '';
    
    const chartHeight = height;
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    
    return `
      M ${startPoint.x},${startPoint.y}
      ${points.slice(1).map(point => `L ${point.x},${point.y}`).join(' ')}
      L ${endPoint.x},${chartHeight}
      L ${startPoint.x},${chartHeight}
      Z
    `;
  };
  
  // Gérer le survol des points
  const handlePointHover = (index, event) => {
    setActivePointIndex(index);
    
    // Calculer la position du tooltip
    if (chartRef.current) {
      const chartRect = chartRef.current.getBoundingClientRect();
      const points = getPoints();
      const point = points[index];
      
      setTooltipPosition({
        x: point.x,
        y: point.y - 15
      });
    }
  };
  
  // Format de valeur pour le tooltip
  const formatTooltipValue = (value) => {
    if (formatTooltip) return formatTooltip(value);
    return value.toFixed(1);
  };
  
  // Créer les lignes de la grille
  const createGridLines = () => {
    const chartHeight = height;
    const chartWidth = chartRef.current ? chartRef.current.offsetWidth : 300;
    const horizontalLines = [];
    const verticalLines = [];
    
    // Lignes horizontales
    const horizontalLineCount = 5;
    for (let i = 1; i < horizontalLineCount; i++) {
      const y = i * (chartHeight / horizontalLineCount);
      horizontalLines.push(
        <line
          key={`h-${i}`}
          x1="0"
          y1={y}
          x2={chartWidth}
          y2={y}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeDasharray="4,4"
        />
      );
    }
    
    // Lignes verticales
    const verticalLineCount = Math.min(data.length, 8);
    for (let i = 1; i < verticalLineCount; i++) {
      const x = i * (chartWidth / verticalLineCount);
      verticalLines.push(
        <line
          key={`v-${i}`}
          x1={x}
          y1="0"
          x2={x}
          y2={chartHeight}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeDasharray="4,4"
        />
      );
    }
    
    return [...horizontalLines, ...verticalLines];
  };
  
  // Créer les étiquettes d'axe X
  const createXAxisLabels = () => {
    if (!xAxisLabels) return null;
    
    const chartWidth = chartRef.current ? chartRef.current.offsetWidth : 300;
    const chartHeight = height;
    
    return xAxisLabels.map((label, index) => {
      const step = chartWidth / (xAxisLabels.length - 1);
      const x = index * step;
      
      return (
        <text
          key={`x-${index}`}
          x={x}
          y={chartHeight + 20}
          textAnchor="middle"
          fontSize="12"
          fill="rgba(255, 255, 255, 0.6)"
        >
          {label}
        </text>
      );
    });
  };
  
  // Créer les étiquettes d'axe Y
  const createYAxisLabels = () => {
    if (!yAxisLabels) return null;
    
    const chartHeight = height;
    
    return yAxisLabels.map((label, index) => {
      const step = chartHeight / (yAxisLabels.length - 1);
      const y = chartHeight - (index * step);
      
      return (
        <text
          key={`y-${index}`}
          x="-5"
          y={y + 5}
          textAnchor="end"
          fontSize="12"
          fill="rgba(255, 255, 255, 0.6)"
        >
          {label}
        </text>
      );
    });
  };
  
  // Recalculer les points lors du redimensionnement
  useEffect(() => {
    const handleResize = () => {
      setActivePointIndex(null);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const points = getPoints();
  const linePath = createLinePath(points);
  const areaPath = createAreaPath(points);
  
  return (
    <div className="metrics-chart metrics-line-chart" ref={chartRef}>
      <svg width={width} height={height + (xAxisLabels ? 30 : 0)} className="metrics-chart-svg">
        {/* Grille en arrière-plan */}
        {gridLines && createGridLines()}
        
        {/* Étiquettes d'axe */}
        {xAxisLabels && createXAxisLabels()}
        {yAxisLabels && createYAxisLabels()}
        
        {/* Aire sous la courbe */}
        {showArea && (
          <motion.path
            d={areaPath}
            fill={areaColor}
            initial={animate ? { opacity: 0 } : { opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          />
        )}
        
        {/* Ligne du graphique */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={animate ? { pathLength: 0 } : { pathLength: 1 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        
        {/* Points sur la courbe */}
        {showPoints && points.map((point, index) => (
          <motion.circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={activePointIndex === index ? 6 : 4}
            fill={pointColor}
            stroke={lineColor}
            strokeWidth={2}
            initial={animate ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: animate ? 1 + (index * 0.05) : 0 }}
            onMouseEnter={(e) => handlePointHover(index, e)}
            onMouseLeave={() => setActivePointIndex(null)}
            className="metrics-chart-point"
          />
        ))}
        
        {/* Tooltip au survol */}
        {showTooltip && activePointIndex !== null && points[activePointIndex] && (
          <g className="metrics-chart-tooltip">
            <rect
              x={tooltipPosition.x - 30}
              y={tooltipPosition.y - 30}
              width="60"
              height="25"
              rx="4"
              fill="rgba(30, 30, 40, 0.9)"
              stroke="rgba(255, 255, 255, 0.2)"
            />
            <text
              x={tooltipPosition.x}
              y={tooltipPosition.y - 14}
              textAnchor="middle"
              fontSize="12"
              fill="white"
            >
              {formatTooltipValue(points[activePointIndex].value)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

LineChart.propTypes = {
  data: PropTypes.array.isRequired,
  height: PropTypes.number,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  animate: PropTypes.bool,
  showPoints: PropTypes.bool,
  showArea: PropTypes.bool,
  showTooltip: PropTypes.bool,
  lineColor: PropTypes.string,
  areaColor: PropTypes.string,
  pointColor: PropTypes.string,
  gridLines: PropTypes.bool,
  xAxisLabels: PropTypes.array,
  yAxisLabels: PropTypes.array,
  minDataValue: PropTypes.number,
  maxDataValue: PropTypes.number,
  formatTooltip: PropTypes.func
};

/**
 * Graphique à barres avec animations et interactions
 * 
 * @component
 */
export const BarChart = ({
  data,
  labels,
  height = 200,
  width = '100%',
  animate = true,
  barColor = 'linear-gradient(180deg, #3494E6, #EC6EAD)',
  barSpacing = 5,
  showTooltip = true,
  showValues = false,
  gridLines = true,
  formatTooltip,
  emptyMessage = 'Aucune donnée'
}) => {
  const [activeBarIndex, setActiveBarIndex] = useState(null);
  const chartRef = useRef(null);
  
  // Vérifier si les données sont vides
  const isEmpty = !data || data.length === 0;
  
  // Calculer les valeurs min et max
  const maxValue = isEmpty ? 0 : Math.max(...data);
  
  // Gérer le survol des barres
  const handleBarHover = (index) => {
    setActiveBarIndex(index);
  };
  
  // Format de valeur pour le tooltip
  const formatValue = (value) => {
    if (formatTooltip) return formatTooltip(value);
    return value.toFixed(1);
  };
  
  // Créer les lignes de la grille
  const createGridLines = () => {
    if (isEmpty) return null;
    
    const chartHeight = height;
    const chartWidth = chartRef.current ? chartRef.current.offsetWidth : 300;
    const horizontalLines = [];
    
    // Lignes horizontales
    const horizontalLineCount = 5;
    for (let i = 1; i < horizontalLineCount; i++) {
      const y = i * (chartHeight / horizontalLineCount);
      horizontalLines.push(
        <line
          key={`h-${i}`}
          x1="0"
          y1={y}
          x2={chartWidth}
          y2={y}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeDasharray="4,4"
        />
      );
    }
    
    return horizontalLines;
  };
  
  return (
    <div className="metrics-chart metrics-bar-chart" ref={chartRef}>
      {isEmpty ? (
        <div className="metrics-chart-empty">
          <span>{emptyMessage}</span>
        </div>
      ) : (
        <svg width={width} height={height + (labels ? 30 : 0)} className="metrics-chart-svg">
          {/* Grille en arrière-plan */}
          {gridLines && createGridLines()}
          
          {/* Barres du graphique */}
          <g>
            {data.map((value, index) => {
              const barWidth = chartRef.current
                ? (chartRef.current.offsetWidth / data.length) - barSpacing
                : 20;
              
              const barHeight = (value / maxValue) * height;
              const barX = index * (barWidth + barSpacing);
              const barY = height - barHeight;
              
              return (
                <g key={index}>
                  <motion.rect
                    x={barX}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    fill={barColor}
                    rx={4}
                    initial={animate ? { height: 0, y: height } : { height: barHeight, y: barY }}
                    animate={{ height: barHeight, y: barY }}
                    transition={{ duration: 0.5, delay: animate ? index * 0.1 : 0 }}
                    onMouseEnter={() => handleBarHover(index)}
                    onMouseLeave={() => setActiveBarIndex(null)}
                    className="metrics-chart-bar"
                  />
                  
                  {/* Valeur au-dessus de la barre */}
                  {showValues && (
                    <motion.text
                      x={barX + barWidth / 2}
                      y={barY - 8}
                      textAnchor="middle"
                      fontSize="12"
                      fill="rgba(255, 255, 255, 0.8)"
                      initial={animate ? { opacity: 0, y: barY } : { opacity: 1, y: barY - 8 }}
                      animate={{ opacity: 1, y: barY - 8 }}
                      transition={{ duration: 0.5, delay: animate ? 0.5 + (index * 0.1) : 0 }}
                    >
                      {formatValue(value)}
                    </motion.text>
                  )}
                  
                  {/* Étiquette sous la barre */}
                  {labels && (
                    <text
                      x={barX + barWidth / 2}
                      y={height + 20}
                      textAnchor="middle"
                      fontSize="12"
                      fill="rgba(255, 255, 255, 0.6)"
                    >
                      {labels[index]}
                    </text>
                  )}
                  
                  {/* Tooltip au survol */}
                  {showTooltip && activeBarIndex === index && (
                    <g className="metrics-chart-tooltip">
                      <rect
                        x={barX + barWidth / 2 - 30}
                        y={barY - 40}
                        width="60"
                        height="25"
                        rx="4"
                        fill="rgba(30, 30, 40, 0.9)"
                        stroke="rgba(255, 255, 255, 0.2)"
                      />
                      <text
                        x={barX + barWidth / 2}
                        y={barY - 24}
                        textAnchor="middle"
                        fontSize="12"
                        fill="white"
                      >
                        {formatValue(value)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      )}
    </div>
  );
};

BarChart.propTypes = {
  data: PropTypes.array.isRequired,
  labels: PropTypes.array,
  height: PropTypes.number,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  animate: PropTypes.bool,
  barColor: PropTypes.string,
  barSpacing: PropTypes.number,
  showTooltip: PropTypes.bool,
  showValues: PropTypes.bool,
  gridLines: PropTypes.bool,
  formatTooltip: PropTypes.func,
  emptyMessage: PropTypes.string
};
