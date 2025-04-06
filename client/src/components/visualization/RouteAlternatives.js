import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMapGL, { Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './RouteAlternatives.css';

// Constantes pour les styles de carte
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || process.env.REACT_APP_MAPBOX_TOKEN || 'pk.placeholder'; // Utiliser la variable d'environnement
const mapStyle = 'mapbox://styles/mapbox/outdoors-v11';

// Icônes pour les conditions météo
const weatherIcons = {
  rain: { icon: '🌧️', color: '#3498db', text: 'Pluie' },
  wind: { icon: '💨', color: '#7f8c8d', text: 'Vent' },
  cold: { icon: '❄️', color: '#9b59b6', text: 'Froid' },
  heat: { icon: '🔥', color: '#e74c3c', text: 'Chaleur' },
  storm: { icon: '⚡', color: '#f39c12', text: 'Orage' }
};

// Composant pour les conditions météo
const WeatherConditions = ({ issues }) => {
  if (!issues || issues.length === 0) {
    return (
      <div className="route-weather-conditions favorable">
        <div className="weather-icon">☀️</div>
        <div className="weather-info">
          <h4>Conditions favorables</h4>
          <p>Aucun problème météo identifié pour cet itinéraire</p>
        </div>
      </div>
    );
  }

  return (
    <div className="route-weather-conditions unfavorable">
      <div className="weather-icons">
        {issues.map((issue, index) => (
          <div 
            key={index} 
            className="weather-icon" 
            style={{ backgroundColor: weatherIcons[issue.type]?.color }}
          >
            {weatherIcons[issue.type]?.icon}
          </div>
        ))}
      </div>
      <div className="weather-info">
        <h4>Conditions défavorables</h4>
        <ul>
          {issues.map((issue, index) => (
            <li key={index} className={`severity-${issue.severity}`}>{issue.description}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Composant principal pour les itinéraires alternatifs
const RouteAlternatives = ({ routeId }) => {
  const [alternatives, setAlternatives] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('weather');
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [viewState, setViewState] = useState({
    longitude: 2.3488,  // Centre de la France
    latitude: 46.8534,
    zoom: 6
  });

  // Simuler les conditions météo (dans une application réelle, ces données viendraient d'une API météo)
  const [weatherConditions, setWeatherConditions] = useState({
    precipitation: 18,
    temperature: 28,
    windSpeed: 35,
    stormRisk: false
  });

  // Profil utilisateur (dans une application réelle, ces données viendraient du profil authentifié)
  const [userProfile, setUserProfile] = useState({
    level: 'intermediate', // beginner, intermediate, advanced, expert
    withChildren: false,
    preferences: ['cultural', 'landscape']
  });

  // Charger les alternatives basées sur la météo
  useEffect(() => {
    setLoading(true);
    axios.get(`/api/route-alternatives/${routeId}/weather-alternatives`, {
      params: weatherConditions
    })
      .then(response => {
        if (response.data.status === 'success') {
          setAlternatives(prev => ({ ...prev, weather: response.data.data }));
        } else {
          console.error('Erreur dans la réponse:', response.data);
        }
      })
      .catch(err => {
        console.error('Erreur lors de la récupération des alternatives météo:', err);
        setError(`Erreur lors de la récupération des alternatives: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [routeId, weatherConditions]);

  // Charger les variantes basées sur le profil
  useEffect(() => {
    setLoading(true);
    axios.post(`/api/route-alternatives/${routeId}/profile-variants`, userProfile)
      .then(response => {
        if (response.data.status === 'success') {
          setAlternatives(prev => ({ ...prev, profile: response.data.data }));
        } else {
          console.error('Erreur dans la réponse:', response.data);
        }
      })
      .catch(err => {
        console.error('Erreur lors de la récupération des variantes de profil:', err);
        setError(`Erreur lors de la récupération des variantes: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [routeId, userProfile]);

  // Fonction pour mettre à jour les conditions météo
  const updateWeatherCondition = (condition, value) => {
    setWeatherConditions(prev => ({ ...prev, [condition]: value }));
  };

  // Fonction pour mettre à jour le profil utilisateur
  const updateUserProfile = (field, value) => {
    setUserProfile(prev => {
      if (field === 'preferences') {
        // Si la préférence existe déjà, la retirer, sinon l'ajouter
        const updatedPreferences = prev.preferences.includes(value)
          ? prev.preferences.filter(pref => pref !== value)
          : [...prev.preferences, value];
        
        return { ...prev, preferences: updatedPreferences };
      }
      return { ...prev, [field]: value };
    });
  };

  // Sélectionner le bon tableau de routes à afficher selon l'onglet actif
  const getRoutesToDisplay = () => {
    if (!alternatives) return [];
    
    if (activeTab === 'weather') {
      return [
        alternatives.weather?.originalRoute,
        ...(alternatives.weather?.alternatives || [])
      ].filter(Boolean);
    }
    
    if (activeTab === 'profile') {
      return [
        alternatives.profile?.originalRoute,
        ...(alternatives.profile?.variants || [])
      ].filter(Boolean);
    }
    
    return [];
  };

  const routes = getRoutesToDisplay();
  const selectedRoute = routes[selectedRouteIndex] || null;

  // Centrer la carte sur l'itinéraire sélectionné
  useEffect(() => {
    if (selectedRoute && selectedRoute.boundingBox) {
      setViewState({
        longitude: (selectedRoute.boundingBox[0] + selectedRoute.boundingBox[2]) / 2,
        latitude: (selectedRoute.boundingBox[1] + selectedRoute.boundingBox[3]) / 2,
        zoom: 10
      });
    }
  }, [selectedRouteIndex, selectedRoute]);

  if (loading && !alternatives) {
    return <div className="route-alternatives-loading">Chargement des alternatives...</div>;
  }

  if (error) {
    return <div className="route-alternatives-error">Erreur: {error}</div>;
  }

  return (
    <div className="route-alternatives-container">
      <div className="route-alternatives-header">
        <h2>Alternatives d'itinéraires</h2>
        <div className="route-alternatives-tabs">
          <button
            className={activeTab === 'weather' ? 'active' : ''}
            onClick={() => setActiveTab('weather')}
          >
            Alternatives météo
          </button>
          <button
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            Variantes de profil
          </button>
        </div>
      </div>

      {activeTab === 'weather' && (
        <div className="weather-controls">
          <h3>Conditions météo actuelles</h3>
          <div className="weather-sliders">
            <div className="weather-slider">
              <label>Précipitation (mm): {weatherConditions.precipitation}mm</label>
              <input
                type="range"
                min="0"
                max="50"
                value={weatherConditions.precipitation}
                onChange={(e) => updateWeatherCondition('precipitation', parseInt(e.target.value))}
              />
            </div>
            <div className="weather-slider">
              <label>Température (°C): {weatherConditions.temperature}°C</label>
              <input
                type="range"
                min="-10"
                max="40"
                value={weatherConditions.temperature}
                onChange={(e) => updateWeatherCondition('temperature', parseInt(e.target.value))}
              />
            </div>
            <div className="weather-slider">
              <label>Vitesse du vent (km/h): {weatherConditions.windSpeed}km/h</label>
              <input
                type="range"
                min="0"
                max="100"
                value={weatherConditions.windSpeed}
                onChange={(e) => updateWeatherCondition('windSpeed', parseInt(e.target.value))}
              />
            </div>
            <div className="weather-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={weatherConditions.stormRisk}
                  onChange={(e) => updateWeatherCondition('stormRisk', e.target.checked)}
                />
                Risque d'orage
              </label>
            </div>
          </div>

          {alternatives?.weather && (
            <WeatherConditions issues={alternatives.weather.weatherIssues || []} />
          )}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="profile-controls">
          <h3>Votre profil</h3>
          <div className="profile-selectors">
            <div className="profile-selector">
              <label>Niveau</label>
              <div className="profile-buttons">
                {['beginner', 'intermediate', 'advanced', 'expert'].map(level => (
                  <button
                    key={level}
                    className={userProfile.level === level ? 'active' : ''}
                    onClick={() => updateUserProfile('level', level)}
                  >
                    {level === 'beginner' ? 'Débutant' : 
                     level === 'intermediate' ? 'Intermédiaire' :
                     level === 'advanced' ? 'Avancé' : 'Expert'}
                  </button>
                ))}
              </div>
            </div>
            <div className="profile-selector">
              <label>Voyagez-vous avec des enfants?</label>
              <div className="profile-buttons">
                <button
                  className={userProfile.withChildren ? 'active' : ''}
                  onClick={() => updateUserProfile('withChildren', true)}
                >
                  Oui
                </button>
                <button
                  className={!userProfile.withChildren ? 'active' : ''}
                  onClick={() => updateUserProfile('withChildren', false)}
                >
                  Non
                </button>
              </div>
            </div>
            <div className="profile-selector">
              <label>Préférences (sélectionnez-en plusieurs)</label>
              <div className="profile-buttons">
                {[
                  { id: 'cultural', label: 'Culture' },
                  { id: 'performance', label: 'Performance' },
                  { id: 'relaxed', label: 'Détente' },
                  { id: 'landscape', label: 'Paysages' }
                ].map(pref => (
                  <button
                    key={pref.id}
                    className={userProfile.preferences.includes(pref.id) ? 'active' : ''}
                    onClick={() => updateUserProfile('preferences', pref.id)}
                  >
                    {pref.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {alternatives?.profile && (
            <div className="recommended-profile">
              <h4>Profil recommandé pour vous: </h4>
              <span className="recommended-type">
                {alternatives.profile.recommendedType === 'sportive' ? 'Sportif' : 
                 alternatives.profile.recommendedType === 'touristic' ? 'Touristique' : 'Famille'}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="route-comparison-container">
        <div className="route-list">
          <h3>Itinéraires disponibles</h3>
          <div className="route-buttons">
            {routes.map((route, index) => (
              <button
                key={route.id || index}
                className={`route-button ${selectedRouteIndex === index ? 'active' : ''} ${route.type || ''}`}
                onClick={() => setSelectedRouteIndex(index)}
              >
                <span className="route-name">{route.name}</span>
                {route.reason && <span className="route-reason">{route.reason}</span>}
                {route.suitability && (
                  <div className="route-suitability">
                    <div className="suitability-bar" style={{ width: `${route.suitability.score}%` }}></div>
                    <span className="suitability-text">{route.suitability.description}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="route-details">
          {selectedRoute ? (
            <>
              <div className="route-map">
                <ReactMapGL
                  {...viewState}
                  onMove={evt => setViewState(evt.viewState)}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle={mapStyle}
                  mapboxAccessToken={MAPBOX_TOKEN}
                >
                  {/* Dans une implémentation réelle, nous ajouterions des couches
                      pour visualiser les itinéraires sur la carte */}
                </ReactMapGL>
              </div>

              <div className="route-info-panel">
                <h3>{selectedRoute.name}</h3>
                <p>{selectedRoute.description}</p>
                
                <div className="route-stats">
                  <div className="stat-item">
                    <span className="stat-label">Distance</span>
                    <span className="stat-value">{selectedRoute.totalDistance} km</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Dénivelé</span>
                    <span className="stat-value">{selectedRoute.totalElevation} m</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Durée estimée</span>
                    <span className="stat-value">
                      {Math.floor(selectedRoute.estimatedTime / 60)}h{selectedRoute.estimatedTime % 60 ? ` ${selectedRoute.estimatedTime % 60}min` : ''}
                    </span>
                  </div>
                  {selectedRoute.difficultyChange && (
                    <div className="stat-item">
                      <span className="stat-label">Changement de difficulté</span>
                      <span className="stat-value">{selectedRoute.difficultyChange}</span>
                    </div>
                  )}
                </div>

                {selectedRoute.highlights && selectedRoute.highlights.length > 0 && (
                  <div className="route-highlights">
                    <h4>Points forts</h4>
                    <ul>
                      {selectedRoute.highlights.map((highlight, idx) => (
                        <li key={idx}>{highlight}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {selectedRoute.safetyPoints && selectedRoute.safetyPoints.length > 0 && (
                  <div className="route-safety">
                    <h4>Points de sécurité</h4>
                    <ul>
                      {selectedRoute.safetyPoints.map((point, idx) => (
                        <li key={idx}>{point.name} - {point.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="route-actions">
                  <button className="btn-primary">Utiliser cet itinéraire</button>
                  <button className="btn-secondary">Télécharger GPX</button>
                  <button className="btn-secondary">Voir détails</button>
                </div>
              </div>
            </>
          ) : (
            <div className="no-route-selected">
              Sélectionnez un itinéraire pour voir ses détails
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteAlternatives;
