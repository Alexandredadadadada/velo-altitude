import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { EnhancedWeatherService } from '../../services/weather';
import './WeatherWidget.css';

// Icônes météo
import { 
  WiDaySunny, WiCloudy, WiRain, WiSnow, 
  WiThunderstorm, WiWindy, WiFog, WiDayCloudy,
  WiHumidity, WiBarometer, WiStrongWind
} from 'react-icons/wi';
import { FaExclamationTriangle, FaSync } from 'react-icons/fa';

/**
 * Composant d'affichage de la météo pour un col
 * Utilise l'EnhancedWeatherService pour récupérer et afficher des données météo détaillées
 * Implémente un système de mise en cache et de rafraîchissement périodique
 */
const WeatherWidget = ({ coordinates, elevation, showForecast = true, showAlerts = true, showHistory = false }) => {
  // États
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [windData, setWindData] = useState(null);
  const [safetyRecommendation, setSafetyRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('current');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Configuration du service météo
  const weatherService = new EnhancedWeatherService({
    alertsEnabled: true,
    predictionsEnabled: true,
    cacheTtl: 1800 // 30 minutes
  });

  // Obtenir le bon icône météo
  const getWeatherIcon = (weatherCode) => {
    switch (weatherCode) {
      case 'clear':
        return <WiDaySunny />;
      case 'clouds':
        return <WiCloudy />;
      case 'partly-cloudy':
        return <WiDayCloudy />;
      case 'rain':
        return <WiRain />;
      case 'snow':
        return <WiSnow />;
      case 'thunderstorm':
        return <WiThunderstorm />;
      case 'wind':
        return <WiWindy />;
      case 'fog':
        return <WiFog />;
      default:
        return <WiDaySunny />;
    }
  };

  // Déterminer la classe CSS pour les conditions de sécurité
  const getSafetyClass = (recommendation) => {
    if (!recommendation) return '';
    
    switch (recommendation.level) {
      case 'danger':
        return 'safety-danger';
      case 'warning':
        return 'safety-warning';
      case 'caution':
        return 'safety-caution';
      case 'favorable':
        return 'safety-favorable';
      default:
        return '';
    }
  };

  // Fonction pour charger les données météo
  const fetchWeatherData = async (showLoadingState = true) => {
    if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
      setError("Coordonnées géographiques manquantes");
      setLoading(false);
      return;
    }

    try {
      // Vérification du cache
      const cacheKey = `weather_${coordinates.latitude}_${coordinates.longitude}_${elevation}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData && !isRefreshing) {
        const { data, timestamp } = JSON.parse(cachedData);
        // Utiliser les données en cache si elles datent de moins de 30 minutes
        if (Date.now() - timestamp < 30 * 60 * 1000) {
          console.log('Utilisation des données météo en cache');
          setCurrentWeather(data.currentWeather);
          setForecast(data.forecast);
          setWindData(data.windData);
          setSafetyRecommendation(data.safetyRecommendation);
          setLastUpdated(new Date(timestamp));
          setLoading(false);
          return;
        }
      }
      
      if (showLoadingState) {
        setIsRefreshing(true);
      }

      const { latitude, longitude } = coordinates;
      
      // Charger les données météo actuelles via l'API spécifique aux cols de montagne
      const mountainWeatherData = await weatherService.getMountainPassWeather(latitude, longitude, elevation);
      setCurrentWeather(mountainWeatherData.current);
      
      // Charger les prévisions si demandées
      if (showForecast) {
        setForecast(mountainWeatherData.forecast || []);
      }

      // Données de vent détaillées
      const windDetails = await weatherService.getDetailedWindData(latitude, longitude, elevation);
      setWindData(windDetails);

      // Recommandations de sécurité basées sur les conditions météo et le vent
      const safety = await weatherService.getWindSafetyRecommendation(latitude, longitude, elevation);
      setSafetyRecommendation(safety);
      
      // Mettre en cache les données
      const dataToCache = {
        currentWeather: mountainWeatherData.current,
        forecast: mountainWeatherData.forecast || [],
        windData: windDetails,
        safetyRecommendation: safety
      };
      
      localStorage.setItem(cacheKey, JSON.stringify({
        data: dataToCache,
        timestamp: Date.now()
      }));
      
      setLastUpdated(new Date());
      setLoading(false);
      setIsRefreshing(false);
    } catch (err) {
      console.error('Erreur lors du chargement des données météo:', err);
      setError("Impossible de charger les données météo. Veuillez réessayer plus tard.");
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Chargement initial des données météo
  useEffect(() => {
    fetchWeatherData();
    
    // Mettre en place un rafraîchissement périodique des données (toutes les 30 minutes)
    const intervalId = setInterval(() => {
      console.log('Rafraîchissement automatique des données météo');
      fetchWeatherData(false);
    }, 30 * 60 * 1000);
    
    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(intervalId);
  }, [coordinates, elevation, showForecast, showHistory]);

  // Fonction pour rafraîchir manuellement les données
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchWeatherData();
  };

  // Formatage de la date
  const formatDate = (dateString) => {
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Formatage de l'heure
  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString('fr-FR', options);
  };

  // Rendu du chargement
  if (loading && !isRefreshing) {
    return (
      <div className="weather-loading">
        <div className="spinner"></div>
        <p>Chargement des données météo...</p>
      </div>
    );
  }

  // Rendu de l'erreur
  if (error) {
    return (
      <div className="weather-error">
        <p>{error}</p>
        <button className="retry-button" onClick={handleRefresh}>
          Réessayer
        </button>
      </div>
    );
  }

  // Rendu si pas de données
  if (!currentWeather) {
    return (
      <div className="weather-unavailable">
        <p>Données météo indisponibles pour ce col</p>
        <button className="retry-button" onClick={handleRefresh}>
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="weather-widget">
      {/* Navigation par onglets */}
      <div className="weather-tabs">
        <button 
          className={`weather-tab ${activeTab === 'current' ? 'active' : ''}`}
          onClick={() => setActiveTab('current')}
        >
          Météo actuelle
        </button>
        {showForecast && (
          <button 
            className={`weather-tab ${activeTab === 'forecast' ? 'active' : ''}`}
            onClick={() => setActiveTab('forecast')}
          >
            Prévisions
          </button>
        )}
        <button 
          className={`weather-tab ${activeTab === 'wind' ? 'active' : ''}`}
          onClick={() => setActiveTab('wind')}
        >
          Conditions de vent
        </button>
        {showHistory && (
          <button 
            className={`weather-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Historique
          </button>
        )}
      </div>

      {/* En-tête avec dernière mise à jour et bouton de rafraîchissement */}
      <div className="weather-header">
        {lastUpdated && (
          <span className="last-updated">
            Mise à jour: {formatTime(lastUpdated)}
          </span>
        )}
        <button 
          className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`} 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <FaSync /> {isRefreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
        </button>
      </div>

      {/* Indicateur de rafraîchissement */}
      {isRefreshing && (
        <div className="refreshing-indicator">
          <div className="spinner-small"></div>
          <span>Mise à jour des données...</span>
        </div>
      )}

      {/* Contenu de l'onglet sélectionné */}
      <div className="weather-tab-content">
        {/* Météo actuelle */}
        {activeTab === 'current' && (
          <div className="current-weather">
            <div className="current-main">
              <div className="weather-icon-large">
                {getWeatherIcon(currentWeather.weatherCode)}
              </div>
              <div className="current-details">
                <h2>{currentWeather.temperature}°C</h2>
                <p className="weather-description">{currentWeather.description}</p>
                <p className="weather-location">
                  {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)} | {elevation}m
                </p>
              </div>
            </div>

            {/* Affichage des alertes si activé */}
            {showAlerts && safetyRecommendation && safetyRecommendation.level !== 'favorable' && (
              <div className={`weather-alert ${getSafetyClass(safetyRecommendation)}`}>
                <FaExclamationTriangle />
                <div className="alert-content">
                  <h3>{safetyRecommendation.title}</h3>
                  <p>{safetyRecommendation.message}</p>
                </div>
              </div>
            )}

            <div className="current-details-grid">
              <div className="detail-item">
                <WiStrongWind />
                <div className="detail-content">
                  <span className="detail-value">{currentWeather.windSpeed} km/h</span>
                  <span className="detail-label">Vent</span>
                </div>
              </div>
              <div className="detail-item">
                <WiHumidity />
                <div className="detail-content">
                  <span className="detail-value">{currentWeather.humidity}%</span>
                  <span className="detail-label">Humidité</span>
                </div>
              </div>
              <div className="detail-item">
                <WiBarometer />
                <div className="detail-content">
                  <span className="detail-value">{currentWeather.pressure} hPa</span>
                  <span className="detail-label">Pression</span>
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-content">
                  <span className="detail-value">{currentWeather.feelsLike}°C</span>
                  <span className="detail-label">Ressenti</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prévisions */}
        {activeTab === 'forecast' && showForecast && (
          <div className="weather-forecast">
            <h3>Prévisions sur 7 jours</h3>
            <div className="forecast-grid">
              {forecast.map((day, index) => (
                <div key={index} className="forecast-day">
                  <div className="forecast-date">{formatDate(day.date)}</div>
                  <div className="forecast-icon">{getWeatherIcon(day.weatherCode)}</div>
                  <div className="forecast-temp">
                    <span className="temp-high">{day.tempMax}°</span>
                    <span className="temp-low">{day.tempMin}°</span>
                  </div>
                  <div className="forecast-wind">
                    <WiStrongWind /> {day.windSpeed} km/h
                  </div>
                  <div className="forecast-precip">
                    <WiRain /> {day.precipitation}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conditions de vent */}
        {activeTab === 'wind' && (
          <div className="wind-conditions">
            <h3>Conditions de vent détaillées</h3>
            
            {safetyRecommendation && (
              <div className={`wind-safety ${getSafetyClass(safetyRecommendation)}`}>
                <h4>Conditions cyclistes</h4>
                <p className="safety-level">{safetyRecommendation.title}</p>
                <p className="safety-message">{safetyRecommendation.message}</p>
              </div>
            )}

            {windData && (
              <div className="wind-details-grid">
                <div className="wind-detail">
                  <h4>Direction</h4>
                  <div className="wind-direction-indicator" style={{ transform: `rotate(${windData.direction}deg)` }}>
                    ↑
                  </div>
                  <span>{windData.directionText}</span>
                </div>
                
                <div className="wind-detail">
                  <h4>Vitesse</h4>
                  <div className="wind-speed-value">{windData.speed} km/h</div>
                  <span>Moyenne: {windData.averageSpeed} km/h</span>
                </div>
                
                <div className="wind-detail">
                  <h4>Rafales</h4>
                  <div className="wind-gust-value">{windData.gusts} km/h</div>
                  <span className={windData.gusts > 45 ? 'warning-text' : ''}>
                    {windData.gusts > 45 ? 'Dangereuses' : 'Modérées'}
                  </span>
                </div>
                
                <div className="wind-detail">
                  <h4>Stabilité</h4>
                  <div className="wind-stability-value">{windData.stability}</div>
                  <span>{windData.stabilityDescription}</span>
                </div>
              </div>
            )}
            
            <div className="wind-forecast">
              <h4>Évolution du vent sur 24h</h4>
              <div className="wind-chart">
                {/* Ici nous pourrions intégrer un graphique d'évolution du vent */}
                <div className="placeholder-chart">
                  Graphique d'évolution du vent indisponible en mode développement
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Historique météo */}
        {activeTab === 'history' && showHistory && (
          <div className="weather-history">
            <h3>Historique météo</h3>
            <p className="history-info">
              Données historiques des 30 derniers jours pour ce col.
            </p>
            
            <div className="history-stats">
              <div className="history-stat">
                <h4>Température moyenne</h4>
                <div className="stat-value">12.5°C</div>
              </div>
              <div className="history-stat">
                <h4>Jours de pluie</h4>
                <div className="stat-value">8/30</div>
              </div>
              <div className="history-stat">
                <h4>Vent moyen</h4>
                <div className="stat-value">18 km/h</div>
              </div>
              <div className="history-stat">
                <h4>Ensoleillement</h4>
                <div className="stat-value">65%</div>
              </div>
            </div>
            
            <div className="best-days">
              <h4>Meilleures journées pour le cyclisme</h4>
              <ul>
                <li>
                  <span className="day">Mardi 2 avril</span>
                  <span className="conditions">Ensoleillé, 18°C, vent 12km/h</span>
                </li>
                <li>
                  <span className="day">Samedi 6 avril</span>
                  <span className="conditions">Peu nuageux, 16°C, vent 8km/h</span>
                </li>
                <li>
                  <span className="day">Dimanche 7 avril</span>
                  <span className="conditions">Ensoleillé, 17°C, vent 10km/h</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

WeatherWidget.propTypes = {
  coordinates: PropTypes.shape({
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired
  }).isRequired,
  elevation: PropTypes.number.isRequired,
  showForecast: PropTypes.bool,
  showAlerts: PropTypes.bool,
  showHistory: PropTypes.bool
};

export default WeatherWidget;
