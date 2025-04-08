import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdArrowBack, MdLocationOn, MdTerrain, MdOutlineDirectionsBike, 
  MdSpeed, MdStar, MdStarBorder, MdWbSunny, MdCloud, MdWaterDrop,
  MdInfo, MdPhotoLibrary, MdMap, MdTimeline, MdPeople, 
  MdNavigation, MdThreeDRotation, MdAdd, MdShare, MdBookmark
} from 'react-icons/md';
import { ElevationProfile } from './ElevationProfile';
import { ColGallery } from './ColGallery';
import { Col3DVisualization } from './Col3DVisualization';
import { ColStatistics } from './ColStatistics';
import { ColComments } from './ColComments';
import './ColDetailView.css';

/**
 * Vue détaillée d'un col
 * Intègre la visualisation 3D et les services backend optimisés
 * 
 * @component
 */
export const ColDetailView = () => {
  const { colId } = useParams();
  const [col, setCol] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [isFavorite, setIsFavorite] = useState(false);
  const [is3DLoaded, setIs3DLoaded] = useState(false);
  const [show3DVisualization, setShow3DVisualization] = useState(false);
  
  const mapRef = useRef(null);
  const elevationRef = useRef(null);
  
  // Animation des onglets
  const tabVariants = {
    inactive: { opacity: 0.7, y: 5 },
    active: { opacity: 1, y: 0 },
    hover: { opacity: 0.9, y: 2 }
  };
  
  // Animation du contenu des onglets
  const tabContentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      transition: { duration: 0.3 } 
    }
  };
  
  // Charger les données du col
  useEffect(() => {
    const fetchColDetails = async () => {
      try {
        setIsLoading(true);
        
        // Dans une vraie implémentation, ceci utiliserait 
        // les services backend optimisés avec cache et JWT
        setTimeout(() => {
          const mockCol = generateMockColDetail(parseInt(colId));
          setCol(mockCol);
          setIsFavorite(mockCol.favorite);
          setIsLoading(false);
        }, 1500);
      } catch (err) {
        setError('Erreur lors du chargement des détails du col. Veuillez réessayer.');
        setIsLoading(false);
      }
    };
    
    fetchColDetails();
  }, [colId]);
  
  // Générer des données de test détaillées pour un col
  const generateMockColDetail = (id) => {
    const regions = ['Alpes', 'Pyrénées', 'Vosges', 'Jura', 'Massif central'];
    const region = regions[id % regions.length];
    const difficulty = (id % 5) + 1;
    const elevation = 1000 + (id * 200) % 2000;
    const distance = 5 + (id * 3) % 25;
    const gradient = 4 + (id * 2) % 12;
    
    const mockCol = {
      id,
      name: `Col de ${['la Madeleine', 'Tourmalet', 'Galibier', 'Aubisque', 'Izoard', 'Ventoux', 'Bonette', 'Ballon', 'Grand Colombier', 'Croix de Fer'][id % 10]}`,
      region,
      elevation,
      distance,
      gradient,
      difficulty,
      completed: Math.random() > 0.5,
      favorite: Math.random() > 0.5,
      description: `Un col mythique situé dans les ${region}, culminant à ${elevation}m d'altitude. Ce col offre des panoramas exceptionnels sur les massifs environnants. La montée s'étend sur ${distance}km avec une pente moyenne de ${gradient}%.`,
      image: `https://source.unsplash.com/random/1200x800/?mountain,col,${id}`,
      weather: {
        current: {
          temp: Math.floor(Math.random() * 20) + 5,
          conditions: ['Ensoleillé', 'Nuageux', 'Partiellement nuageux', 'Pluvieux'][Math.floor(Math.random() * 4)],
          wind: Math.floor(Math.random() * 30) + 5,
          humidity: Math.floor(Math.random() * 40) + 40
        },
        forecast: Array(7).fill().map((_, index) => ({
          day: new Date(Date.now() + 86400000 * (index + 1)).toLocaleDateString('fr-FR', { weekday: 'short' }),
          temp: Math.floor(Math.random() * 20) + 5,
          conditions: ['Ensoleillé', 'Nuageux', 'Partiellement nuageux', 'Pluvieux'][Math.floor(Math.random() * 4)],
          wind: Math.floor(Math.random() * 30) + 5,
          humidity: Math.floor(Math.random() * 40) + 40
        }))
      },
      location: {
        latitude: 45 + (id / 100),
        longitude: 6 + (id / 100)
      },
      stats: {
        averageTime: Math.floor(Math.random() * 120) + 30,
        fastestTime: Math.floor(Math.random() * 60) + 20,
        totalAscents: Math.floor(Math.random() * 1000) + 100,
        thisYear: Math.floor(Math.random() * 200) + 50,
        kudos: Math.floor(Math.random() * 500) + 100
      },
      elevationData: Array(100).fill().map((_, i) => ({
        distance: i * (distance / 100),
        elevation: 500 + (i / 5) * (elevation - 500) + Math.sin(i / 3) * 50
      })),
      gallery: Array(8).fill().map((_, i) => ({
        id: i + 1,
        url: `https://source.unsplash.com/random/800x600/?mountain,cycling,${id},${i}`,
        title: `Vue ${i+1} du ${['sommet', 'versant nord', 'versant sud', 'panorama', 'virage', 'descente', 'montée', 'col'][i % 8]}`,
        author: ['Pierre', 'Sophie', 'Marc', 'Émilie', 'Thomas', 'Julie'][i % 6]
      })),
      comments: Array(5).fill().map((_, i) => ({
        id: i + 1,
        user: {
          name: ['Pierre', 'Sophie', 'Marc', 'Émilie', 'Thomas', 'Julie'][i % 6],
          avatar: `https://i.pravatar.cc/150?img=${(i + id) % 70}`
        },
        date: new Date(Date.now() - (i * 86400000 * 2)).toLocaleDateString('fr-FR'),
        rating: Math.floor(Math.random() * 3) + 3,
        text: [
          "Une montée superbe mais exigeante ! Les derniers kilomètres sont particulièrement difficiles.",
          "Vue imprenable au sommet, ça vaut vraiment la peine d'effort pour y arriver.",
          "J'y suis allé un jour de beau temps, le paysage était à couper le souffle.",
          "Col mythique à faire absolument. Prévoyez de l'eau en quantité par temps chaud.",
          "Montée régulière mais qui peut sembler interminable. La satisfaction est immense une fois au sommet !"
        ][i % 5]
      })),
      nearbyActivities: Array(3).fill().map((_, i) => ({
        id: i + 1,
        type: ['restaurant', 'hébergement', 'point d\'eau', 'café', 'boutique'][i % 5],
        name: [`Le Refuge du ${region}`, `Auberge du Col`, `Café des Cyclistes`][i % 3],
        distance: Math.floor(Math.random() * 5) + 1
      }))
    };
    
    return mockCol;
  };
  
  // Obtenir l'icône météo en fonction des conditions
  const getWeatherIcon = (conditions) => {
    if (!conditions) return <MdWbSunny />;
    
    const condition = conditions.toLowerCase();
    if (condition.includes('ensoleillé')) return <MdWbSunny />;
    if (condition.includes('nuageux')) return <MdCloud />;
    if (condition.includes('pluie') || condition.includes('pluvieux')) return <MdWaterDrop />;
    
    return <MdWbSunny />;
  };
  
  // Basculer l'état favori
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Dans une vraie implémentation, une requête API serait faite ici
  };
  
  // Calculer la couleur de pente (gradient) en fonction de la valeur
  const getGradientColor = (gradient) => {
    if (gradient < 6) return 'easy';
    if (gradient < 9) return 'moderate';
    if (gradient < 12) return 'hard';
    return 'extreme';
  };
  
  // Formater l'élévation pour l'affichage
  const formatElevation = (elevation) => {
    return new Intl.NumberFormat('fr-FR').format(elevation) + 'm';
  };
  
  // Basculer l'affichage de la visualisation 3D
  const toggle3DVisualization = () => {
    setShow3DVisualization(!show3DVisualization);
  };
  
  // Hanlde 3D loading complete
  const handle3DLoadComplete = () => {
    setIs3DLoaded(true);
  };
  
  return (
    <div className="col-detail-view">
      {isLoading ? (
        <div className="col-detail-loading glass">
          <div className="col-detail-loader"></div>
          <p>Chargement des détails du col...</p>
        </div>
      ) : error ? (
        <div className="col-detail-error glass">
          <p>{error}</p>
          <Link to="/cols" className="col-back-button glass glass--button">
            <MdArrowBack />
            <span>Retour aux cols</span>
          </Link>
        </div>
      ) : col ? (
        <>
          <div className="col-detail-header">
            <div className="col-detail-image-container">
              <img src={col.image} alt={col.name} className="col-detail-image" />
              <div className="col-detail-header-overlay"></div>
              
              <Link to="/cols" className="col-back-button glass">
                <MdArrowBack />
                <span>Retour</span>
              </Link>
              
              <motion.button 
                className="col-detail-favorite-button glass"
                onClick={toggleFavorite}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isFavorite ? 
                  <MdStar className="favorite-icon active" /> : 
                  <MdStarBorder className="favorite-icon" />
                }
              </motion.button>
              
              <div className="col-detail-actions">
                <motion.button 
                  className="col-detail-action-button glass"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MdBookmark />
                </motion.button>
                <motion.button 
                  className="col-detail-action-button glass"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MdShare />
                </motion.button>
                <motion.button 
                  className="col-detail-action-button glass"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MdAdd />
                </motion.button>
              </div>
            </div>
            
            <div className="col-detail-info-container glass">
              <div className="col-detail-primary-info">
                <h1 className="col-detail-title">{col.name}</h1>
                
                <div className="col-detail-region">
                  <MdLocationOn />
                  <span>{col.region}</span>
                </div>
                
                <div className="col-detail-stats">
                  <div className="col-detail-stat">
                    <MdTerrain className="col-detail-stat-icon" />
                    <span className="col-detail-stat-value">{formatElevation(col.elevation)}</span>
                    <span className="col-detail-stat-label">Altitude</span>
                  </div>
                  
                  <div className="col-detail-stat">
                    <MdOutlineDirectionsBike className="col-detail-stat-icon" />
                    <span className="col-detail-stat-value">{col.distance}km</span>
                    <span className="col-detail-stat-label">Distance</span>
                  </div>
                  
                  <div className="col-detail-stat">
                    <MdSpeed className="col-detail-stat-icon" />
                    <span className={`col-detail-stat-value gradient-${getGradientColor(col.gradient)}`}>
                      {col.gradient}%
                    </span>
                    <span className="col-detail-stat-label">Pente moy.</span>
                  </div>
                </div>
                
                <div className="col-detail-difficulty">
                  <span className="col-detail-difficulty-label">Difficulté:</span>
                  <div className="col-detail-difficulty-dots">
                    {Array(5).fill().map((_, i) => (
                      <span 
                        key={i} 
                        className={`col-detail-difficulty-dot ${i < col.difficulty ? 'active' : ''}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="col-detail-weather-preview">
                <div className="col-detail-current-weather">
                  <div className="col-detail-weather-icon">
                    {getWeatherIcon(col.weather?.current?.conditions)}
                  </div>
                  <div className="col-detail-weather-temp">
                    {col.weather?.current?.temp}°C
                  </div>
                </div>
                
                <div className="col-detail-weather-conditions">
                  {col.weather?.current?.conditions}
                </div>
                
                <div className="col-detail-weather-meta">
                  <div className="col-detail-weather-wind">
                    <span>Vent:</span> {col.weather?.current?.wind} km/h
                  </div>
                  <div className="col-detail-weather-humidity">
                    <span>Humidité:</span> {col.weather?.current?.humidity}%
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-detail-content-tabs glass">
            <motion.button
              className={`col-detail-tab ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
              variants={tabVariants}
              initial="inactive"
              animate={activeTab === 'info' ? 'active' : 'inactive'}
              whileHover="hover"
            >
              <MdInfo />
              <span>Infos</span>
            </motion.button>
            
            <motion.button
              className={`col-detail-tab ${activeTab === 'elevation' ? 'active' : ''}`}
              onClick={() => setActiveTab('elevation')}
              variants={tabVariants}
              initial="inactive"
              animate={activeTab === 'elevation' ? 'active' : 'inactive'}
              whileHover="hover"
            >
              <MdTimeline />
              <span>Profil</span>
            </motion.button>
            
            <motion.button
              className={`col-detail-tab ${activeTab === 'map' ? 'active' : ''}`}
              onClick={() => setActiveTab('map')}
              variants={tabVariants}
              initial="inactive"
              animate={activeTab === 'map' ? 'active' : 'inactive'}
              whileHover="hover"
            >
              <MdMap />
              <span>Carte</span>
            </motion.button>
            
            <motion.button
              className={`col-detail-tab ${activeTab === 'gallery' ? 'active' : ''}`}
              onClick={() => setActiveTab('gallery')}
              variants={tabVariants}
              initial="inactive"
              animate={activeTab === 'gallery' ? 'active' : 'inactive'}
              whileHover="hover"
            >
              <MdPhotoLibrary />
              <span>Photos</span>
            </motion.button>
            
            <motion.button
              className={`col-detail-tab ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
              variants={tabVariants}
              initial="inactive"
              animate={activeTab === 'stats' ? 'active' : 'inactive'}
              whileHover="hover"
            >
              <MdPeople />
              <span>Stats</span>
            </motion.button>
          </div>
          
          <div className="col-detail-content glass">
            <AnimatePresence mode="wait">
              {activeTab === 'info' && (
                <motion.div
                  key="info"
                  className="col-detail-info-tab"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <div className="col-detail-description">
                    <h2>À propos de ce col</h2>
                    <p>{col.description}</p>
                    
                    <div className="col-3d-preview-container">
                      <motion.button
                        className="col-3d-button glass glass--button"
                        onClick={toggle3DVisualization}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <MdThreeDRotation />
                        <span>Visualisation 3D du col</span>
                      </motion.button>
                      
                      {show3DVisualization && (
                        <div className="col-3d-preview glass">
                          <Col3DVisualization 
                            colData={col} 
                            onLoadComplete={handle3DLoadComplete} 
                          />
                          
                          {!is3DLoaded && (
                            <div className="col-3d-loading">
                              <div className="col-3d-loader"></div>
                              <p>Chargement de la visualisation 3D...</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <h3>Prévisions météo</h3>
                    <div className="col-weather-forecast-detailed">
                      {col.weather.forecast.map((day, index) => (
                        <div key={index} className="col-weather-day">
                          <div className="col-weather-day-name">{day.day}</div>
                          <div className="col-weather-day-icon">
                            {getWeatherIcon(day.conditions)}
                          </div>
                          <div className="col-weather-day-temp">{day.temp}°C</div>
                          <div className="col-weather-day-conditions">
                            {day.conditions}
                          </div>
                          <div className="col-weather-day-meta">
                            <div className="col-weather-day-wind">
                              <span>Vent:</span> {day.wind} km/h
                            </div>
                            <div className="col-weather-day-humidity">
                              <span>Hum:</span> {day.humidity}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <h3>Activités à proximité</h3>
                    <div className="col-nearby-activities">
                      {col.nearbyActivities.map(activity => (
                        <div key={activity.id} className="col-nearby-activity glass">
                          <div className="col-activity-type">
                            {activity.type}
                          </div>
                          <div className="col-activity-name">
                            {activity.name}
                          </div>
                          <div className="col-activity-distance">
                            à {activity.distance} km
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <h3>Commentaires et avis</h3>
                    <ColComments comments={col.comments} />
                  </div>
                </motion.div>
              )}
              
              {activeTab === 'elevation' && (
                <motion.div
                  key="elevation"
                  className="col-detail-elevation-tab"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  ref={elevationRef}
                >
                  <h2>Profil d'élévation</h2>
                  <ElevationProfile data={col.elevationData} />
                </motion.div>
              )}
              
              {activeTab === 'map' && (
                <motion.div
                  key="map"
                  className="col-detail-map-tab"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  ref={mapRef}
                >
                  <h2>Carte du col</h2>
                  <div className="col-map-container">
                    <div className="col-map-placeholder">
                      <p>Carte interactive du col</p>
                      <p className="col-map-note">
                        Dans une implémentation réelle, cette section afficherait une carte interactive 
                        avec le tracé du col, des points d'intérêt et les conditions météo en temps réel.
                      </p>
                      
                      <div className="col-map-mock">
                        <div className="col-map-coordinates">
                          <MdNavigation className="col-map-icon" />
                          <span>Coordonnées: {col.location.latitude.toFixed(5)}, {col.location.longitude.toFixed(5)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {activeTab === 'gallery' && (
                <motion.div
                  key="gallery"
                  className="col-detail-gallery-tab"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h2>Galerie photos</h2>
                  <ColGallery images={col.gallery} />
                </motion.div>
              )}
              
              {activeTab === 'stats' && (
                <motion.div
                  key="stats"
                  className="col-detail-stats-tab"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <h2>Statistiques</h2>
                  <ColStatistics stats={col.stats} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <div className="col-detail-not-found glass">
          <h2>Col non trouvé</h2>
          <p>Le col que vous recherchez n'existe pas ou a été supprimé.</p>
          <Link to="/cols" className="col-back-button glass glass--button">
            <MdArrowBack />
            <span>Retour aux cols</span>
          </Link>
        </div>
      )}
    </div>
  );
};
