import React, { useState, useEffect } from 'react';
import { ColVisualization } from '../components/visualization';
import { VISUALIZATION_TYPES } from '../config/visualizationConfig';
import './ColVisualizationDemo.css';

// Données d'exemple pour les tests
const testCols = [
  {
    id: "galibier",
    name: "Col du Galibier",
    elevation: 2642,
    length: 18.1,
    avgGradient: 6.9,
    startElevation: 1400,
    maxGradient: 10.1,
    image: "https://images.unsplash.com/photo-1472791108553-c9405341e398",
    climbs: [
      { name: "Plan Lachat", gradient: 8.0, length: 3.5, startDistance: 7.5 },
      { name: "Virage des Valloires", gradient: 9.2, length: 2.3, startDistance: 12.8 }
    ]
  },
  {
    id: "alpe-huez",
    name: "Alpe d'Huez",
    elevation: 1860,
    length: 13.8,
    avgGradient: 8.1,
    startElevation: 720,
    maxGradient: 13.0,
    image: "https://images.unsplash.com/photo-1467173472333-9f0e0397d785"
  },
  {
    id: "tourmalet",
    name: "Col du Tourmalet",
    elevation: 2115,
    length: 19.0,
    avgGradient: 7.4,
    startElevation: 850,
    maxGradient: 10.5,
    image: "https://images.unsplash.com/photo-1455581580-92fa937ccfaf"
  },
  {
    id: "ventoux",
    name: "Mont Ventoux",
    elevation: 1909,
    length: 21.5,
    avgGradient: 7.5,
    startElevation: 300,
    maxGradient: 12.0,
    image: "https://images.unsplash.com/photo-1557646581-cf0226184399"
  },
  {
    id: "izoard",
    name: "Col d'Izoard",
    elevation: 2360,
    length: 15.9,
    avgGradient: 6.8,
    startElevation: 1280,
    maxGradient: 10.0,
    image: "https://images.unsplash.com/photo-1497492637206-77c65160f365"
  }
];

/**
 * Page de démonstration du composant de visualisation des cols
 */
const ColVisualizationDemo = () => {
  const [selectedCol, setSelectedCol] = useState(testCols[0]);
  const [visualizationType, setVisualizationType] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);
  
  // Simuler un chargement lors du changement de col
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [selectedCol]);
  
  // Gérer le changement de col
  const handleColChange = (colId) => {
    const col = testCols.find(c => c.id === colId);
    setSelectedCol(col);
  };
  
  // Gérer le changement de type de visualisation
  const handleTypeChange = (type) => {
    setVisualizationType(type);
  };
  
  // Callback lorsque la visualisation est prête
  const handleVisualizationReady = (data) => {
    setMetrics({
      renderTime: new Date().toLocaleTimeString(),
      pointCount: data.points?.length || 0,
      type: data.type
    });
  };
  
  return (
    <div className="col-visualization-demo">
      <header className="demo-header">
        <h1>Démonstration des Visualisations de Cols</h1>
        <p>Cette page présente le composant unifié de visualisation des cols</p>
      </header>
      
      <div className="demo-controls">
        <div className="control-group">
          <label>Sélectionner un col:</label>
          <div className="button-group">
            {testCols.map(col => (
              <button 
                key={col.id}
                className={selectedCol?.id === col.id ? 'active' : ''}
                onClick={() => handleColChange(col.id)}
              >
                {col.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="control-group">
          <label>Type de visualisation:</label>
          <div className="button-group">
            <button 
              className={visualizationType === 'auto' ? 'active' : ''}
              onClick={() => handleTypeChange('auto')}
            >
              Auto
            </button>
            <button 
              className={visualizationType === VISUALIZATION_TYPES.PROFILE_2D ? 'active' : ''}
              onClick={() => handleTypeChange(VISUALIZATION_TYPES.PROFILE_2D)}
            >
              2D
            </button>
            <button 
              className={visualizationType === VISUALIZATION_TYPES.TERRAIN_3D ? 'active' : ''}
              onClick={() => handleTypeChange(VISUALIZATION_TYPES.TERRAIN_3D)}
            >
              3D
            </button>
            <button 
              className={visualizationType === VISUALIZATION_TYPES.MINI_PROFILE ? 'active' : ''}
              onClick={() => handleTypeChange(VISUALIZATION_TYPES.MINI_PROFILE)}
            >
              Mini
            </button>
          </div>
        </div>
      </div>
      
      <div className="visualization-container">
        {loading ? (
          <div className="loading-placeholder">
            <div className="spinner"></div>
            <p>Chargement de la visualisation...</p>
          </div>
        ) : (
          <ColVisualization 
            col={selectedCol}
            visualizationType={visualizationType}
            quality="auto"
            height="500px"
            showStats={true}
            onVisualizationReady={handleVisualizationReady}
          />
        )}
      </div>
      
      {metrics && (
        <div className="metrics-panel">
          <h3>Métriques de rendu</h3>
          <ul>
            <li><strong>Heure de rendu:</strong> {metrics.renderTime}</li>
            <li><strong>Type de visualisation:</strong> {metrics.type}</li>
            <li><strong>Points générés:</strong> {metrics.pointCount}</li>
          </ul>
        </div>
      )}
      
      <div className="col-details">
        <h2>Détails du {selectedCol.name}</h2>
        
        <div className="detail-grid">
          <div className="detail-card">
            <h3>Profil</h3>
            <ul>
              <li><strong>Altitude:</strong> {selectedCol.elevation}m</li>
              <li><strong>Longueur:</strong> {selectedCol.length}km</li>
              <li><strong>Pente moyenne:</strong> {selectedCol.avgGradient}%</li>
              <li><strong>Pente max:</strong> {selectedCol.maxGradient}%</li>
              <li><strong>Dénivelé:</strong> {selectedCol.elevation - selectedCol.startElevation}m</li>
            </ul>
          </div>
          
          <div className="detail-card">
            <h3>Image</h3>
            <div className="col-image">
              <img src={selectedCol.image} alt={selectedCol.name} />
            </div>
          </div>
          
          {selectedCol.climbs && selectedCol.climbs.length > 0 && (
            <div className="detail-card">
              <h3>Sections</h3>
              <ul>
                {selectedCol.climbs.map((climb, index) => (
                  <li key={index}>
                    <strong>{climb.name}:</strong> {climb.length}km à {climb.gradient}% 
                    (km {climb.startDistance} à {climb.startDistance + climb.length})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="comparison-section">
        <h2>Comparaison des cols</h2>
        <div className="mini-visualizations">
          {testCols.map(col => (
            <div 
              key={col.id} 
              className={`mini-card ${selectedCol?.id === col.id ? 'selected' : ''}`}
              onClick={() => handleColChange(col.id)}
            >
              <h4>{col.name}</h4>
              <div className="mini-viz">
                <ColVisualization 
                  col={col}
                  visualizationType={VISUALIZATION_TYPES.MINI_PROFILE}
                  height="120px"
                  showStats={false}
                />
              </div>
              <div className="mini-stats">
                <span>{col.elevation}m</span>
                <span>{col.length}km</span>
                <span>{col.avgGradient}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColVisualizationDemo;
