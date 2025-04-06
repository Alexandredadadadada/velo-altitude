import React, { useState, useEffect } from 'react';
import ReactMapGL, { Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import axios from 'axios';
import Pass3DViewer from './Pass3DViewer';
import './PassVisualizer.css';

// Constantes pour les styles de carte
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || process.env.REACT_APP_MAPBOX_TOKEN || 'pk.placeholder'; // Utiliser la variable d'environnement
const mapStyle = 'mapbox://styles/mapbox/outdoors-v11';

// Constantes pour les types de vues
const VIEW_TYPES = {
  MAP_2D: '2d',
  PROFILE: 'profile',
  VIEW_3D: '3d'
};

// Composant principal pour la visualisation intégrée des cols
const PassVisualizer = ({ passId }) => {
  const [passData, setPassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState(VIEW_TYPES.MAP_2D);
  const [viewState, setViewState] = useState({
    longitude: 2.3488,
    latitude: 46.8534,
    zoom: 9
  });
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [annotations, setAnnotations] = useState([]);

  // Charger les données du col
  useEffect(() => {
    setLoading(true);
    
    // Récupérer les données de visualisation du col
    axios.get(`/api/visualization/passes/${passId}/visualization`)
      .then(response => {
        if (response.data.status === 'success') {
          setPassData(response.data.data);
          
          // Centrer la carte sur le col
          if (response.data.data.coordinates) {
            const middlePoint = Math.floor(response.data.data.coordinates.length / 2);
            setViewState({
              longitude: response.data.data.coordinates[middlePoint][0],
              latitude: response.data.data.coordinates[middlePoint][1],
              zoom: 12
            });
          }
        } else {
          setError('Erreur lors du chargement des données');
        }
      })
      .catch(err => {
        console.error('Erreur lors de la récupération des données du col:', err);
        setError(`Erreur lors de la récupération des données: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [passId]);

  // Préparer les données pour le graphique d'élévation
  const prepareElevationData = () => {
    if (!passData || !passData.elevationProfile) return [];
    
    return passData.elevationProfile.map(point => ({
      distance: point[0],
      elevation: point[1],
      gradient: point[2] || 0
    }));
  };

  // Gérer le clic sur un point du profil d'élévation
  const handleProfilePointClick = (data) => {
    setSelectedPoint(data);
    
    // Trouver les coordonnées correspondantes sur la carte pour centrer la vue
    if (passData && passData.coordinates) {
      const closestPoint = passData.coordinates.reduce((closest, point, index) => {
        const distance = Math.abs(point[2] - data.distance);
        if (distance < closest.distance) {
          return { index, distance, coords: [point[0], point[1]] };
        }
        return closest;
      }, { index: 0, distance: Infinity, coords: [0, 0] });
      
      // Centrer la carte sur ce point
      setViewState({
        ...viewState,
        longitude: closestPoint.coords[0],
        latitude: closestPoint.coords[1],
        zoom: 14
      });
    }
  };

  // Gérer le changement de type de vue
  const handleViewChange = (newView) => {
    setActiveView(newView);
  };

  // Définir la couleur en fonction de la pente
  const getColorForGradient = (gradient) => {
    if (gradient <= 4) return '#4CAF50'; // Vert
    if (gradient <= 7) return '#FFC107'; // Jaune
    if (gradient <= 10) return '#FF9800'; // Orange
    if (gradient <= 15) return '#F44336'; // Rouge
    return '#9C27B0'; // Violet
  };

  if (loading) {
    return <div className="pass-visualizer-loading">Chargement des données...</div>;
  }

  if (error) {
    return <div className="pass-visualizer-error">Erreur: {error}</div>;
  }

  if (!passData) {
    return <div className="pass-visualizer-error">Aucune donnée disponible pour ce col</div>;
  }

  return (
    <div className="pass-visualizer-container">
      <div className="pass-visualizer-header">
        <h2>{passData.name}</h2>
        <div className="pass-visualizer-info">
          <div className="info-item">
            <span className="info-label">Distance</span>
            <span className="info-value">{passData.length} km</span>
          </div>
          <div className="info-item">
            <span className="info-label">Dénivelé</span>
            <span className="info-value">{passData.summary?.elevationGain || 0} m</span>
          </div>
          <div className="info-item">
            <span className="info-label">Pente moyenne</span>
            <span className="info-value">{passData.summary?.averageGradient.toFixed(1) || 0}%</span>
          </div>
          <div className="info-item">
            <span className="info-label">Pente max</span>
            <span className="info-value">{passData.summary?.maxGradient.toFixed(1) || 0}%</span>
          </div>
          <div className="info-item">
            <span className="info-label">Difficulté</span>
            <span className="info-value">{passData.difficulty}</span>
          </div>
        </div>
      </div>
      
      <div className="pass-visualizer-tabs">
        <button
          className={activeView === VIEW_TYPES.MAP_2D ? 'active' : ''}
          onClick={() => handleViewChange(VIEW_TYPES.MAP_2D)}
        >
          <i className="fas fa-map"></i> Carte 2D
        </button>
        <button
          className={activeView === VIEW_TYPES.PROFILE ? 'active' : ''}
          onClick={() => handleViewChange(VIEW_TYPES.PROFILE)}
        >
          <i className="fas fa-chart-line"></i> Profil d'élévation
        </button>
        <button
          className={activeView === VIEW_TYPES.VIEW_3D ? 'active' : ''}
          onClick={() => handleViewChange(VIEW_TYPES.VIEW_3D)}
        >
          <i className="fas fa-cube"></i> Visualisation 3D
        </button>
      </div>
      
      <TransitionGroup>
        <CSSTransition key={activeView} timeout={300} classNames="fade">
          <div className="pass-visualizer-content">
            {activeView === VIEW_TYPES.MAP_2D && (
              <div className="pass-visualizer-map">
                <ReactMapGL
                  {...viewState}
                  onMove={evt => setViewState(evt.viewState)}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle={mapStyle}
                  mapboxAccessToken={MAPBOX_TOKEN}
                >
                  {/* Dans une implémentation réelle, nous ajouterions des couches
                      pour visualiser le col sur la carte */}
                  
                  {/* Points d'intérêt */}
                  {passData.keyPoints && passData.keyPoints.map((point, idx) => (
                    <div 
                      key={idx}
                      className="map-marker"
                      style={{
                        left: `${point.x}px`,
                        top: `${point.y}px`,
                        backgroundColor: point.type === 'start' ? '#4CAF50' :
                                         point.type === 'summit' ? '#F44336' :
                                         '#2196F3'
                      }}
                    >
                      <div className="map-marker-label">{point.name}</div>
                    </div>
                  ))}
                </ReactMapGL>
                
                {/* Légende */}
                <div className="map-legend">
                  <h3>Légende</h3>
                  <div className="legend-items">
                    {passData.colorScale && passData.colorScale.map((item, idx) => (
                      <div key={idx} className="legend-item">
                        <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                        <span className="legend-label">{item.gradient} - {item.difficulty}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Annotations superposées */}
                {annotations.map((annotation, idx) => (
                  <div key={idx} className={`map-annotation ${annotation.type}`} style={{ left: annotation.x, top: annotation.y }}>
                    <div className="annotation-marker"></div>
                    <div className="annotation-content">
                      <h4>{annotation.title}</h4>
                      <p>{annotation.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {activeView === VIEW_TYPES.PROFILE && (
              <div className="pass-visualizer-profile">
                <div className="profile-chart">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                      data={prepareElevationData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                      onClick={(data) => {
                        if (data && data.activePayload && data.activePayload[0]) {
                          handleProfilePointClick(data.activePayload[0].payload);
                        }
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="distance" 
                        label={{ value: 'Distance (km)', position: 'insideBottom', offset: -10 }} 
                      />
                      <YAxis 
                        label={{ value: 'Altitude (m)', angle: -90, position: 'insideLeft' }} 
                      />
                      <Tooltip 
                        formatter={(value, name, props) => {
                          if (name === 'elevation') return [`${value} m`, 'Altitude'];
                          if (name === 'gradient') return [`${value}%`, 'Pente'];
                          return [value, name];
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="elevation" 
                        stroke="#8884d8" 
                        dot={false} 
                        strokeWidth={3} 
                        isAnimationActive={false} 
                      />
                      {/* Ajouter des marques pour les segments colorés selon la pente */}
                      {passData.segmentsByDifficulty && passData.segmentsByDifficulty.flatMap(diffCategory => 
                        diffCategory.segments.map((segment, idx) => (
                          <Line 
                            key={`${diffCategory.difficulty}-${idx}`}
                            type="monotone" 
                            dataKey="elevation" 
                            stroke={diffCategory.color} 
                            strokeWidth={5}
                            dot={false}
                            activeDot={false}
                            isAnimationActive={false}
                            name={`${diffCategory.difficulty} (${segment.avgGradient.toFixed(1)}%)`}
                            // Dans une implémentation réelle, nous filtrerions les points pour n'inclure que ceux du segment
                          />
                        ))
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Informations sur le point sélectionné */}
                {selectedPoint && (
                  <div className="profile-point-info">
                    <h3>Point sélectionné</h3>
                    <div className="point-details">
                      <div className="detail-item">
                        <span className="detail-label">Distance</span>
                        <span className="detail-value">{selectedPoint.distance.toFixed(1)} km</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Altitude</span>
                        <span className="detail-value">{selectedPoint.elevation} m</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Pente</span>
                        <span className="detail-value">{selectedPoint.gradient.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Segments clés */}
                <div className="profile-key-segments">
                  <h3>Segments clés</h3>
                  <div className="segments-list">
                    {passData.keyPoints && passData.keyPoints.filter(p => p.type === 'key_segment').map((segment, idx) => (
                      <div key={idx} className={`segment-item severity-${segment.severity}`}>
                        <div className="segment-header">
                          <h4>{segment.name}</h4>
                          <span className="segment-gradient">{segment.gradient.toFixed(1)}%</span>
                        </div>
                        <div className="segment-details">
                          <span>Du km {segment.distanceStart.toFixed(1)} au km {segment.distanceEnd.toFixed(1)}</span>
                          <span>Longueur: {segment.length.toFixed(1)} km</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {activeView === VIEW_TYPES.VIEW_3D && (
              <div className="pass-visualizer-3d">
                <Pass3DViewer passId={passId} />
              </div>
            )}
          </div>
        </CSSTransition>
      </TransitionGroup>
      
      <div className="pass-visualizer-actions">
        <button className="btn-secondary" onClick={() => window.history.back()}>
          Retour à la liste
        </button>
        <button className="btn-primary">
          Ajouter à mon itinéraire
        </button>
        <button className="btn-secondary">
          Télécharger GPX
        </button>
        <button className="btn-secondary">
          Comparer avec un autre col
        </button>
      </div>
    </div>
  );
};

export default PassVisualizer;
