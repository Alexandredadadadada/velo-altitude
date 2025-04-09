/**
 * Exemple d'utilisation du composant UnifiedColVisualization
 * 
 * Cet exemple montre comment intégrer la visualisation des cols
 * dans une application React existante
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ColVisualization from '../components/visualization/UnifiedColVisualization';
import { VISUALIZATION_TYPES } from '../config/visualizationConfig';

// Composant d'exemple
const ColVisualizationExample = () => {
  const [cols, setCols] = useState([]);
  const [selectedCol, setSelectedCol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visualizationType, setVisualizationType] = useState(VISUALIZATION_TYPES.PROFILE_2D);
  
  // Charger les données des cols
  useEffect(() => {
    const fetchCols = async () => {
      try {
        setLoading(true);
        // Remplacer par votre API endpoint
        const response = await axios.get('/api/cols');
        setCols(response.data);
        
        // Sélectionner le premier col par défaut s'il y en a
        if (response.data.length > 0) {
          setSelectedCol(response.data[0]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des cols:', err);
        setError('Impossible de charger les données des cols');
        setLoading(false);
      }
    };
    
    fetchCols();
  }, []);
  
  // Gérer la sélection d'un col
  const handleColSelect = (event) => {
    const colId = event.target.value;
    const col = cols.find(c => c.id === colId);
    setSelectedCol(col);
  };
  
  // Changer le type de visualisation
  const handleVisualizationTypeChange = (type) => {
    setVisualizationType(type);
  };
  
  // Événement de visualisation prête
  const handleVisualizationReady = (data) => {
    console.log('Visualisation prête:', data);
  };
  
  // Exemple de col statique (si l'API n'est pas disponible)
  const exampleCol = {
    id: 'example-1',
    name: 'Col du Galibier',
    elevation: 2642,
    length: 18.1,
    avgGradient: 6.9,
    maxGradient: 10.1,
    startElevation: 1400,
    climbs: [
      { name: 'Plan Lachat', gradient: 8.0, length: 3.5, startDistance: 7.5 },
      { name: 'Virage des Valloires', gradient: 9.2, length: 2.3, startDistance: 12.8 }
    ]
  };
  
  if (loading) {
    return <div>Chargement des cols...</div>;
  }
  
  if (error) {
    return (
      <div>
        <p>{error}</p>
        <h3>Utilisation d'un exemple statique :</h3>
        <ColVisualization 
          col={exampleCol}
          visualizationType={visualizationType}
          quality="auto"
          height="400px"
          showStats={true}
          onVisualizationReady={handleVisualizationReady}
        />
      </div>
    );
  }
  
  return (
    <div className="col-visualization-example">
      <h2>Explorateur de Cols</h2>
      
      {/* Sélection du col */}
      <div className="col-selector">
        <label htmlFor="col-select">Choisir un col :</label>
        <select 
          id="col-select" 
          value={selectedCol?.id || ''} 
          onChange={handleColSelect}
        >
          {cols.map(col => (
            <option key={col.id} value={col.id}>
              {col.name} ({col.elevation}m, {col.length}km)
            </option>
          ))}
        </select>
      </div>
      
      {/* Sélection du type de visualisation */}
      <div className="visualization-type-selector">
        <button 
          className={visualizationType === VISUALIZATION_TYPES.PROFILE_2D ? 'active' : ''}
          onClick={() => handleVisualizationTypeChange(VISUALIZATION_TYPES.PROFILE_2D)}
        >
          Profil 2D
        </button>
        <button 
          className={visualizationType === VISUALIZATION_TYPES.TERRAIN_3D ? 'active' : ''}
          onClick={() => handleVisualizationTypeChange(VISUALIZATION_TYPES.TERRAIN_3D)}
        >
          Terrain 3D
        </button>
        <button 
          className={visualizationType === 'auto' ? 'active' : ''}
          onClick={() => handleVisualizationTypeChange('auto')}
        >
          Auto (adaptatif)
        </button>
      </div>
      
      {/* Composant de visualisation */}
      {selectedCol && (
        <ColVisualization 
          col={selectedCol}
          visualizationType={visualizationType}
          quality="auto"
          height="500px"
          showStats={true}
          onVisualizationReady={handleVisualizationReady}
        />
      )}
      
      {/* Utilisation de l'exemple */}
      {!selectedCol && (
        <div>
          <p>Aucun col sélectionné, affichage d'un exemple :</p>
          <ColVisualization 
            col={exampleCol}
            visualizationType={visualizationType}
            quality="auto"
            height="500px"
            showStats={true}
            onVisualizationReady={handleVisualizationReady}
          />
        </div>
      )}
    </div>
  );
};

export default ColVisualizationExample;
