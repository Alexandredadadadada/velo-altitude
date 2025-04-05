import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

// Fix for default marker icons in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Service pour charger les données des itinéraires
const fetchRouteData = async (routeId) => {
  try {
    // Simuler un appel API - à remplacer par un vrai appel API
    const response = await fetch(`/api/routes/${routeId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch route data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching route data:', error);
    // Données fictives en cas d'erreur
    return {
      id: routeId,
      name: `Route ${routeId}`,
      mainRoute: {
        coordinates: [
          [48.8566, 2.3522],
          [48.85, 2.34],
          [48.84, 2.35],
          [48.83, 2.36]
        ],
        distance: 25,
        elevation: 650,
        surfaceType: 'asphalt'
      },
      alternatives: [
        {
          id: '1',
          name: 'Alternative 1',
          weatherCondition: 'rain',
          coordinates: [
            [48.8566, 2.3522],
            [48.85, 2.35],
            [48.84, 2.36],
            [48.83, 2.36]
          ],
          distance: 27,
          elevation: 600,
          surfaceType: 'gravel'
        },
        {
          id: '2',
          name: 'Alternative 2',
          weatherCondition: 'wind',
          coordinates: [
            [48.8566, 2.3522],
            [48.86, 2.34],
            [48.85, 2.36],
            [48.83, 2.36]
          ],
          distance: 30,
          elevation: 550,
          surfaceType: 'dirt'
        }
      ]
    };
  }
};

// Service pour obtenir les données météo
const fetchWeatherData = async (lat, lng) => {
  try {
    // Simuler un appel API - à remplacer par un vrai appel API
    return {
      temperature: Math.floor(Math.random() * 20) + 10,
      condition: ['sunny', 'cloudy', 'rainy', 'windy'][Math.floor(Math.random() * 4)],
      wind: {
        speed: Math.floor(Math.random() * 30),
        direction: Math.floor(Math.random() * 360)
      },
      precipitation: Math.floor(Math.random() * 100)
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
};

// Composant pour centrer la carte sur les coordonnées
const SetViewOnChange = ({ coordinates }) => {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      // Calculer les limites pour englober toutes les coordonnées
      const bounds = coordinates.reduce(
        (bounds, coord) => bounds.extend([coord[0], coord[1]]),
        L.latLngBounds(coordinates[0], coordinates[0])
      );
      
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coordinates, map]);
  
  return null;
};

const AlternativeRoutes = ({ mainRouteId }) => {
  const { t } = useTranslation();
  const [routeData, setRouteData] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState('sportif'); // sportif, touristique, famille
  
  const surfaceColors = {
    asphalt: '#3388ff',
    gravel: '#ff7800',
    dirt: '#6B4226'
  };
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await fetchRouteData(mainRouteId);
        setRouteData(data);
        
        // Obtenir la météo à partir du point de départ de l'itinéraire principal
        if (data?.mainRoute?.coordinates?.length > 0) {
          const [lat, lng] = data.mainRoute.coordinates[0];
          const weatherData = await fetchWeatherData(lat, lng);
          setWeather(weatherData);
        }
      } catch (err) {
        setError(err.message || 'Failed to load route data');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [mainRouteId]);

  const getRecommendedRoute = () => {
    if (!routeData || !weather) return routeData?.mainRoute;
    
    // Logique de recommandation basée sur le profil et la météo
    if (weather.condition === 'rainy') {
      // Pour la pluie, privilégier les routes asphaltées
      const asphaltRoutes = [
        routeData.mainRoute, 
        ...routeData.alternatives
      ].filter(route => route.surfaceType === 'asphalt');
      
      if (asphaltRoutes.length > 0) return asphaltRoutes[0];
    }
    
    if (weather.condition === 'windy' && weather.wind.speed > 20) {
      // Pour le vent fort, privilégier les itinéraires avec moins d'élévation
      const routes = [routeData.mainRoute, ...routeData.alternatives];
      return routes.reduce((prev, current) => 
        (prev.elevation < current.elevation) ? prev : current
      );
    }
    
    // Par défaut, selon le profil
    switch (selectedProfile) {
      case 'sportif':
        // Les sportifs préfèrent les itinéraires avec plus d'élévation
        const routes = [routeData.mainRoute, ...routeData.alternatives];
        return routes.reduce((prev, current) => 
          (prev.elevation > current.elevation) ? prev : current
        );
      case 'touristique':
        // Les touristes préfèrent les routes mixtes (gravel)
        const gravelRoutes = [
          routeData.mainRoute, 
          ...routeData.alternatives
        ].filter(route => route.surfaceType === 'gravel');
        
        if (gravelRoutes.length > 0) return gravelRoutes[0];
        break;
      case 'famille':
        // Les familles préfèrent les itinéraires plus courts
        const familyRoutes = [routeData.mainRoute, ...routeData.alternatives];
        return familyRoutes.reduce((prev, current) => 
          (prev.distance < current.distance) ? prev : current
        );
    }
    
    return routeData.mainRoute;
  };

  if (loading) {
    return <div className="loader">{t('loading')}</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!routeData) {
    return <div>{t('noRouteData')}</div>;
  }

  const recommendedRoute = getRecommendedRoute();
  const allCoordinates = [
    ...routeData.mainRoute.coordinates,
    ...(routeData.alternatives.flatMap(alt => alt.coordinates))
  ];

  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/alternativeroutes"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    <div className="alternative-routes">
      <div className="routes-header">
        <h2>{t('alternativeRoutes')}: {routeData.name}</h2>
        
        {weather && (
          <div className="weather-info">
            <div className="weather-condition">
              <span>{t('currentWeather')}: {t(weather.condition)}</span>
              <span>{weather.temperature}°C</span>
            </div>
            <div className="weather-detail">
              <span>{t('wind')}: {weather.wind.speed} km/h</span>
              <span>{t('precipitation')}: {weather.precipitation}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="profile-selector">
        <span>{t('cyclistProfile')}:</span>
        <button 
          className={selectedProfile === 'sportif' ? 'active' : ''} 
          onClick={() => setSelectedProfile('sportif')}
        >
          {t('sportif')}
        </button>
        <button 
          className={selectedProfile === 'touristique' ? 'active' : ''} 
          onClick={() => setSelectedProfile('touristique')}
        >
          {t('touristique')}
        </button>
        <button 
          className={selectedProfile === 'famille' ? 'active' : ''} 
          onClick={() => setSelectedProfile('famille')}
        >
          {t('famille')}
        </button>
      </div>

      <main className="map-container" style={{ height: '400px', width: '100%' }}>
        <MapContainer 
          center={[48.8566, 2.3522]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Itinéraire principal */}
          <Polyline 
            positions={routeData.mainRoute.coordinates}
            pathOptions={{ 
              color: surfaceColors[routeData.mainRoute.surfaceType] || '#3388ff',
              weight: recommendedRoute === routeData.mainRoute ? 6 : 3,
              dashArray: recommendedRoute === routeData.mainRoute ? null : '5, 5'
            }}
          >
            <Popup>
              <div>
                <h4>{routeData.name} ({t('mainRoute')})</h4>
                <p>{t('distance')}: {routeData.mainRoute.distance} km</p>
                <p>{t('elevation')}: {routeData.mainRoute.elevation} m</p>
                <p>{t('surface')}: {t(routeData.mainRoute.surfaceType)}</p>
              </div>
            </Popup>
          </Polyline>
          
          {/* Points de départ et d'arrivée */}
          <Marker position={routeData.mainRoute.coordinates[0]}>
            <Popup>{t('startPoint')}</Popup>
          </Marker>
          <Marker position={routeData.mainRoute.coordinates[routeData.mainRoute.coordinates.length - 1]}>
            <Popup>{t('endPoint')}</Popup>
          </Marker>
          
          {/* Alternatives */}
          {routeData.alternatives.map((alt, index) => (
            <Polyline 
              key={alt.id}
              positions={alt.coordinates}
              pathOptions={{ 
                color: surfaceColors[alt.surfaceType] || '#ff7800',
                weight: recommendedRoute === alt ? 6 : 3,
                dashArray: recommendedRoute === alt ? null : '5, 5'
              }}
            >
              <Popup>
                <div>
                  <h4>{alt.name}</h4>
                  <p>{t('recommendedFor')}: {t(alt.weatherCondition)}</p>
                  <p>{t('distance')}: {alt.distance} km</p>
                  <p>{t('elevation')}: {alt.elevation} m</p>
                  <p>{t('surface')}: {t(alt.surfaceType)}</p>
                </div>
              </Popup>
            </Polyline>
          ))}
          
          {/* Centrer la carte sur les itinéraires */}
          <SetViewOnChange coordinates={allCoordinates} />
        </MapContainer>
      </div>

      <div className="routes-info">
        <div className="recommended-route">
          <h3>{t('recommendedRoute')}</h3>
          <div className="route-card">
            <h4>{recommendedRoute === routeData.mainRoute ? routeData.name : recommendedRoute.name}</h4>
            <p>
              <strong>{t('distance')}:</strong> {recommendedRoute.distance} km<br />
              <strong>{t('elevation')}:</strong> {recommendedRoute.elevation} m<br />
              <strong>{t('surface')}:</strong> {t(recommendedRoute.surfaceType)}
            </p>
            <p className="recommendation-reason">
              {t('recommendationBasedOn')} {selectedProfile === 'sportif' 
                ? t('sportifPreferences') 
                : selectedProfile === 'touristique' 
                  ? t('touristiquePreferences')
                  : t('famillePreferences')
              }
              {weather && weather.condition !== 'sunny' && ` ${t('and')} ${t('current')} ${t(weather.condition)} ${t('conditions')}`}
            </p>
          </div>
        </div>

        <div className="routes-legend">
          <h3>{t('surfaceTypes')}</h3>
          <div className="legend-item">
            <span className="color-box" style={{ backgroundColor: surfaceColors.asphalt }}></span>
            <span>{t('asphalt')}</span>
          </div>
          <div className="legend-item">
            <span className="color-box" style={{ backgroundColor: surfaceColors.gravel }}></span>
            <span>{t('gravel')}</span>
          </div>
          <div className="legend-item">
            <span className="color-box" style={{ backgroundColor: surfaceColors.dirt }}></span>
            <span>{t('dirt')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlternativeRoutes;
