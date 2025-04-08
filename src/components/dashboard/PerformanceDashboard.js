import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import '../../design-system/styles/glassmorphism.scss';
import '../../design-system/styles/animations.scss';
import './PerformanceDashboard.css';

/**
 * Tableau de bord de performances cyclistes
 * 
 * Composant premium affichant les statistiques, activités et progression de l'utilisateur
 * avec des visualisations de données interactives et des effets visuels immersifs
 */
const PerformanceDashboard = ({
  userData,
  activityData = [],
  stravaConnected = false,
  weatherService,
  loading = false
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [chartType, setChartType] = useState('elevation');
  const [weatherData, setWeatherData] = useState(null);
  const [animationCompleted, setAnimationCompleted] = useState(false);
  
  const elevationChartRef = useRef(null);
  const performanceChartRef = useRef(null);
  
  // Extraction des données utilisateur ou valeurs par défaut
  const {
    name = 'Cycliste',
    avatar = '',
    level = 1,
    totalDistance = 0,
    totalElevation = 0,
    achievements = [],
    favoriteRoutes = [],
    recentActivities = []
  } = userData || {};
  
  // Récupération des données météo pour la région favorite de l'utilisateur
  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!weatherService) return;
      
      try {
        // Récupérer la météo pour la région favorite ou une région par défaut
        const favoriteRegion = favoriteRoutes?.[0]?.region || 'Vosges';
        const data = await weatherService.getRegionWeather(favoriteRegion);
        setWeatherData(data);
      } catch (error) {
        console.error('Erreur lors du chargement des données météo:', error);
        // Données mockées en cas d'échec
        setWeatherData({
          region: 'Vosges',
          temperature: 18,
          condition: 'Ensoleillé',
          icon: '☀️',
          forecast: [
            { day: 'Aujourd'hui', temperature: 18, icon: '☀️' },
            { day: 'Demain', temperature: 16, icon: '⛅' },
            { day: 'J+2', temperature: 15, icon: '🌧️' }
          ]
        });
      }
    };
    
    fetchWeatherData();
  }, [weatherService, favoriteRoutes]);
  
  // Création du graphique d'élévation avec D3.js
  useEffect(() => {
    if (!elevationChartRef.current || activityData.length === 0 || loading || !animationCompleted) return;
    
    const createElevationChart = () => {
      // Nettoyage du graphique précédent
      d3.select(elevationChartRef.current).selectAll('*').remove();
      
      // Dimensions et marges
      const margin = { top: 20, right: 30, bottom: 30, left: 40 };
      const width = elevationChartRef.current.clientWidth - margin.left - margin.right;
      const height = 220 - margin.top - margin.bottom;
      
      // Création du SVG
      const svg = d3.select(elevationChartRef.current)
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
      
      // Préparation des données
      const data = activityData.slice(0, 10).map(activity => ({
        date: new Date(activity.date),
        elevation: activity.elevation
      })).sort((a, b) => a.date - b.date);
      
      // Échelles
      const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);
      
      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.elevation) * 1.1])
        .range([height, 0]);
      
      // Création de la ligne
      const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.elevation))
        .curve(d3.curveMonotoneX);
      
      // Création de l'aire sous la courbe
      const area = d3.area()
        .x(d => x(d.date))
        .y0(height)
        .y1(d => y(d.elevation))
        .curve(d3.curveMonotoneX);
      
      // Ajout de l'aire
      svg.append('path')
        .datum(data)
        .attr('class', 'chart-area')
        .attr('d', area)
        .attr('fill', 'url(#gradient)')
        .attr('opacity', 0.6);
      
      // Ajout du gradient
      const gradient = svg.append('defs')
        .append('linearGradient')
        .attr('id', 'gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#24A26F')
        .attr('stop-opacity', 0.8);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#1A4977')
        .attr('stop-opacity', 0.2);
      
      // Ajout de la ligne
      const path = svg.append('path')
        .datum(data)
        .attr('class', 'chart-line')
        .attr('fill', 'none')
        .attr('stroke', '#24A26F')
        .attr('stroke-width', 3)
        .attr('d', line);
      
      // Animation de la ligne
      const pathLength = path.node().getTotalLength();
      
      path.attr('stroke-dasharray', pathLength)
        .attr('stroke-dashoffset', pathLength)
        .transition()
        .duration(1500)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0);
      
      // Ajout des axes
      svg.append('g')
        .attr('class', 'chart-axis-x')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat('%d/%m')));
      
      svg.append('g')
        .attr('class', 'chart-axis-y')
        .call(d3.axisLeft(y).ticks(5));
      
      // Ajout des points
      svg.selectAll('.chart-point')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'chart-point')
        .attr('cx', d => x(d.date))
        .attr('cy', d => y(d.elevation))
        .attr('r', 5)
        .attr('fill', '#24A26F')
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('opacity', 0)
        .transition()
        .delay((d, i) => i * 150)
        .duration(500)
        .attr('opacity', 1);
      
      // Tooltip sur les points
      svg.selectAll('.chart-point')
        .on('mouseover', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 8);
          
          // Affichage de l'info-bulle
          const [mouseX, mouseY] = d3.pointer(event);
          
          svg.append('text')
            .attr('class', 'tooltip-text')
            .attr('x', x(d.date))
            .attr('y', y(d.elevation) - 15)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .attr('font-weight', 'bold')
            .attr('fill', 'white')
            .text(`${d.elevation}m`);
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 5);
          
          svg.select('.tooltip-text').remove();
        });
    };
    
    createElevationChart();
    
    // Re-render lors du redimensionnement
    const handleResize = () => {
      createElevationChart();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activityData, loading, animationCompleted, chartType]);
  
  // Animation d'entrée des cartes statistiques
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
        when: 'beforeChildren',
        duration: 0.5,
        onComplete: () => setAnimationCompleted(true)
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }
    }
  };
  
  // Formatage des chiffres
  const formatNumber = (num, decimals = 0) => {
    return new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: decimals
    }).format(num);
  };
  
  return (
    <div className="performance-dashboard">
      {/* En-tête du tableau de bord avec informations utilisateur */}
      <div className="performance-dashboard__header glass glass--premium">
        <div className="performance-dashboard__user">
          <div className="performance-dashboard__avatar-container">
            {avatar ? (
              <img src={avatar} alt={name} className="performance-dashboard__avatar" />
            ) : (
              <div className="performance-dashboard__avatar-placeholder">
                {name.charAt(0)}
              </div>
            )}
            <div className="performance-dashboard__level">
              <span>Niv. {level}</span>
            </div>
          </div>
          <div className="performance-dashboard__user-info">
            <h2 className="performance-dashboard__user-name">{name}</h2>
            <div className="performance-dashboard__user-stats">
              <div className="performance-dashboard__user-stat">
                <span className="performance-dashboard__user-stat-icon">🚴‍♂️</span>
                <span className="performance-dashboard__user-stat-value">
                  {formatNumber(totalDistance)} km
                </span>
              </div>
              <div className="performance-dashboard__user-stat">
                <span className="performance-dashboard__user-stat-icon">⛰️</span>
                <span className="performance-dashboard__user-stat-value">
                  {formatNumber(totalElevation)} m
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Widget météo */}
        {weatherData && (
          <div className="performance-dashboard__weather glass glass--subtle">
            <div className="performance-dashboard__weather-current">
              <div className="performance-dashboard__weather-icon">
                {weatherData.icon}
              </div>
              <div className="performance-dashboard__weather-info">
                <div className="performance-dashboard__weather-temp">
                  {weatherData.temperature}°C
                </div>
                <div className="performance-dashboard__weather-condition">
                  {weatherData.condition}
                </div>
                <div className="performance-dashboard__weather-location">
                  {weatherData.region}
                </div>
              </div>
            </div>
            
            {/* Prévisions */}
            {weatherData.forecast && (
              <div className="performance-dashboard__weather-forecast">
                {weatherData.forecast.map((day, index) => (
                  <div key={index} className="performance-dashboard__weather-day">
                    <div className="performance-dashboard__weather-day-name">
                      {day.day}
                    </div>
                    <div className="performance-dashboard__weather-day-icon">
                      {day.icon}
                    </div>
                    <div className="performance-dashboard__weather-day-temp">
                      {day.temperature}°C
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Connexion Strava */}
        <div className="performance-dashboard__strava">
          {stravaConnected ? (
            <div className="performance-dashboard__strava-connected">
              <div className="performance-dashboard__strava-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="#FC4C02" d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
              </div>
              <span>Connecté à Strava</span>
            </div>
          ) : (
            <button className="performance-dashboard__strava-connect glass glass--button">
              <div className="performance-dashboard__strava-icon">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="#FC4C02" d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
              </div>
              <span>Connecter Strava</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Navigation par onglets */}
      <div className="performance-dashboard__tabs">
        <button
          className={`performance-dashboard__tab ${
            activeTab === 'overview' ? 'performance-dashboard__tab--active' : ''
          }`}
          onClick={() => setActiveTab('overview')}
        >
          Vue d'ensemble
        </button>
        <button
          className={`performance-dashboard__tab ${
            activeTab === 'activities' ? 'performance-dashboard__tab--active' : ''
          }`}
          onClick={() => setActiveTab('activities')}
        >
          Activités
        </button>
        <button
          className={`performance-dashboard__tab ${
            activeTab === 'routes' ? 'performance-dashboard__tab--active' : ''
          }`}
          onClick={() => setActiveTab('routes')}
        >
          Parcours
        </button>
        <button
          className={`performance-dashboard__tab ${
            activeTab === 'achievements' ? 'performance-dashboard__tab--active' : ''
          }`}
          onClick={() => setActiveTab('achievements')}
        >
          Réalisations
        </button>
      </div>
      
      {/* Contenu principal du tableau de bord */}
      {activeTab === 'overview' && (
        <motion.div
          className="performance-dashboard__content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Statistiques */}
          <div className="performance-dashboard__stats-row">
            <motion.div
              className="performance-dashboard__stat-card glass glass--premium"
              variants={itemVariants}
            >
              <div className="performance-dashboard__stat-icon stat-icon--distance">
                🚴‍♂️
              </div>
              <div className="performance-dashboard__stat-content">
                <h3 className="performance-dashboard__stat-title">Distance</h3>
                <div className="performance-dashboard__stat-value">
                  {formatNumber(totalDistance)} km
                </div>
                <div className="performance-dashboard__stat-caption">
                  Distance totale parcourue
                </div>
              </div>
            </motion.div>
            
            <motion.div
              className="performance-dashboard__stat-card glass glass--premium"
              variants={itemVariants}
            >
              <div className="performance-dashboard__stat-icon stat-icon--elevation">
                ⛰️
              </div>
              <div className="performance-dashboard__stat-content">
                <h3 className="performance-dashboard__stat-title">Dénivelé</h3>
                <div className="performance-dashboard__stat-value">
                  {formatNumber(totalElevation)} m
                </div>
                <div className="performance-dashboard__stat-caption">
                  Dénivelé total positif
                </div>
              </div>
            </motion.div>
            
            <motion.div
              className="performance-dashboard__stat-card glass glass--premium"
              variants={itemVariants}
            >
              <div className="performance-dashboard__stat-icon stat-icon--achievements">
                🏆
              </div>
              <div className="performance-dashboard__stat-content">
                <h3 className="performance-dashboard__stat-title">Réalisations</h3>
                <div className="performance-dashboard__stat-value">
                  {achievements?.length || 0}
                </div>
                <div className="performance-dashboard__stat-caption">
                  Badges et récompenses
                </div>
              </div>
            </motion.div>
            
            <motion.div
              className="performance-dashboard__stat-card glass glass--premium"
              variants={itemVariants}
            >
              <div className="performance-dashboard__stat-icon stat-icon--routes">
                🗺️
              </div>
              <div className="performance-dashboard__stat-content">
                <h3 className="performance-dashboard__stat-title">Parcours</h3>
                <div className="performance-dashboard__stat-value">
                  {favoriteRoutes?.length || 0}
                </div>
                <div className="performance-dashboard__stat-caption">
                  Itinéraires favoris
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Graphique */}
          <motion.div
            className="performance-dashboard__chart-card glass glass--premium"
            variants={itemVariants}
          >
            <div className="performance-dashboard__chart-header">
              <h3 className="performance-dashboard__chart-title">
                Progression
              </h3>
              <div className="performance-dashboard__chart-controls">
                <button
                  className={`performance-dashboard__chart-button ${
                    chartType === 'elevation' ? 'performance-dashboard__chart-button--active' : ''
                  }`}
                  onClick={() => setChartType('elevation')}
                >
                  Dénivelé
                </button>
                <button
                  className={`performance-dashboard__chart-button ${
                    chartType === 'distance' ? 'performance-dashboard__chart-button--active' : ''
                  }`}
                  onClick={() => setChartType('distance')}
                >
                  Distance
                </button>
              </div>
            </div>
            
            <div className="performance-dashboard__chart">
              {loading ? (
                <div className="performance-dashboard__chart-loading">
                  <div className="spinner"></div>
                  <span>Chargement des données...</span>
                </div>
              ) : activityData.length > 0 ? (
                <div className="performance-dashboard__chart-container" ref={elevationChartRef}></div>
              ) : (
                <div className="performance-dashboard__chart-empty">
                  <div className="performance-dashboard__chart-empty-icon">📊</div>
                  <div className="performance-dashboard__chart-empty-text">
                    Connectez votre compte Strava pour visualiser vos statistiques
                  </div>
                </div>
              )}
            </div>
          </motion.div>
          
          {/* Activités récentes */}
          <motion.div
            className="performance-dashboard__recent-activities glass glass--premium"
            variants={itemVariants}
          >
            <h3 className="performance-dashboard__section-title">
              Activités récentes
            </h3>
            {recentActivities && recentActivities.length > 0 ? (
              <div className="performance-dashboard__activities-list">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="performance-dashboard__activity-item">
                    <div className="performance-dashboard__activity-icon">
                      {activity.type === 'ride' ? '🚴‍♂️' : '🥾'}
                    </div>
                    <div className="performance-dashboard__activity-details">
                      <div className="performance-dashboard__activity-name">
                        {activity.name || `Sortie du ${new Date(activity.date).toLocaleDateString('fr-FR')}`}
                      </div>
                      <div className="performance-dashboard__activity-stats">
                        <span>{formatNumber(activity.distance, 1)} km</span>
                        <span>⛰️ {formatNumber(activity.elevation)} m</span>
                        <span>⏱️ {activity.duration}</span>
                      </div>
                    </div>
                    <div className="performance-dashboard__activity-date">
                      {new Date(activity.date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="performance-dashboard__empty-state">
                <div className="performance-dashboard__empty-icon">🚴‍♂️</div>
                <div className="performance-dashboard__empty-text">
                  Aucune activité récente
                </div>
                <button className="performance-dashboard__empty-action glass glass--button">
                  Ajouter une activité
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
      
      {/* Contenu des autres onglets (à implémenter) */}
      {activeTab !== 'overview' && (
        <div className="performance-dashboard__content">
          <div className="performance-dashboard__placeholder glass glass--premium">
            <div className="performance-dashboard__placeholder-icon">
              {activeTab === 'activities' ? '🚴‍♂️' : activeTab === 'routes' ? '🗺️' : '🏆'}
            </div>
            <h3 className="performance-dashboard__placeholder-title">
              {activeTab === 'activities' ? 'Activités' : activeTab === 'routes' ? 'Parcours' : 'Réalisations'}
            </h3>
            <p className="performance-dashboard__placeholder-text">
              Cette section est en cours de développement
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

PerformanceDashboard.propTypes = {
  userData: PropTypes.shape({
    name: PropTypes.string,
    avatar: PropTypes.string,
    level: PropTypes.number,
    totalDistance: PropTypes.number,
    totalElevation: PropTypes.number,
    achievements: PropTypes.array,
    favoriteRoutes: PropTypes.array,
    recentActivities: PropTypes.array
  }),
  activityData: PropTypes.array,
  stravaConnected: PropTypes.bool,
  weatherService: PropTypes.object,
  loading: PropTypes.bool
};

export default PerformanceDashboard;
