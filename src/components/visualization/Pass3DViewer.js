import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Line } from '@react-three/drei';
import axios from 'axios';
import './Pass3DViewer.css';

// Composant pour afficher un marqueur dans la scène 3D
const Marker = ({ position, name, type, onClick }) => {
  const color = type === 'start' ? '#4CAF50' : 
                type === 'summit' ? '#F44336' : 
                type === 'panorama' ? '#2196F3' : 
                type === 'ravitaillement' ? '#FF9800' : 
                '#9C27B0';
                
  return (
    <group position={position} onClick={onClick}>
      <mesh>
        <sphereGeometry args={[5, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={[0, 8, 0]}
        color="white"
        fontSize={5}
        maxWidth={100}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.5}
        outlineColor="#000000"
      >
        {name}
      </Text>
    </group>
  );
};

// Composant pour créer la route 3D
const Route3D = ({ coordinates }) => {
  const points = coordinates.map(coord => 
    new THREE.Vector3(coord.position[0], coord.position[2], coord.position[1])
  );

  return (
    <Line
      points={points}
      color="#E91E63"
      lineWidth={5}
    />
  );
};

// Composant principal pour la visualisation 3D
const Pass3DViewer = ({ passId }) => {
  const [passData, setPassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [cameraPosition, setCameraPosition] = useState([0, 100, 200]);
  
  // Charger les données du col
  useEffect(() => {
    setLoading(true);
    axios.get(`/api/visualization/passes/${passId}/visualization-3d`)
      .then(response => {
        if (response.data.status === 'success') {
          setPassData(response.data.data);
          // Définir la position initiale de la caméra à partir des données
          if (response.data.data.camera && response.data.data.camera.initialPosition) {
            setCameraPosition(response.data.data.camera.initialPosition);
          }
        } else {
          setError('Erreur lors du chargement des données');
        }
      })
      .catch(err => {
        console.error('Erreur lors de la récupération des données 3D', err);
        setError(`Erreur lors de la récupération des données: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [passId]);

  // Gérer la sélection d'un marqueur
  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
  };

  // Fonction pour fermer le panneau d'info
  const closeInfoPanel = () => {
    setSelectedMarker(null);
  };

  if (loading) {
    return <div className="pass-3d-loading">Chargement de la visualisation 3D...</div>;
  }

  if (error) {
    return <div className="pass-3d-error">Erreur: {error}</div>;
  }

  if (!passData) {
    return <div className="pass-3d-error">Aucune donnée disponible pour ce col</div>;
  }

  return (
    <div className="pass-3d-container">
      <div className="pass-3d-header">
        <h2>{passData.name} - Visualisation 3D</h2>
        <div className="pass-3d-controls">
          <button onClick={() => setCameraPosition(passData.camera.initialPosition)}>
            Vue par défaut
          </button>
          <button onClick={() => setCameraPosition([0, 200, 0])}>
            Vue aérienne
          </button>
        </div>
      </div>
      
      <div className="pass-3d-viewer">
        <Canvas camera={{ position: cameraPosition, fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          
          {/* Terrain 3D */}
          <Route3D coordinates={passData.coordinates3D} />
          
          {/* Marqueurs */}
          {passData.markers && passData.markers.map((marker, idx) => (
            <Marker
              key={marker.id || idx}
              position={marker.position}
              name={marker.name}
              type={marker.type}
              onClick={() => handleMarkerClick(marker)}
            />
          ))}
          
          {/* Contrôles de caméra */}
          <OrbitControls target={passData.camera.lookAt || [0, 0, 0]} />
        </Canvas>
      </div>
      
      {/* Panneau d'information sur le marqueur sélectionné */}
      {selectedMarker && (
        <div className="pass-3d-info-panel">
          <div className="pass-3d-info-header">
            <h3>{selectedMarker.name}</h3>
            <button onClick={closeInfoPanel}>×</button>
          </div>
          <div className="pass-3d-info-content">
            <p>{selectedMarker.description || 'Pas de description disponible'}</p>
            {selectedMarker.type === 'start' && (
              <div className="pass-3d-elevation-info">
                <p>Altitude de départ: {selectedMarker.position[2]}m</p>
              </div>
            )}
            {selectedMarker.type === 'summit' && (
              <div className="pass-3d-elevation-info">
                <p>Altitude au sommet: {selectedMarker.position[2]}m</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="pass-3d-legend">
        <h3>Légende</h3>
        <div className="pass-3d-legend-item">
          <span className="legend-color start"></span>
          <span>Départ</span>
        </div>
        <div className="pass-3d-legend-item">
          <span className="legend-color summit"></span>
          <span>Sommet</span>
        </div>
        <div className="pass-3d-legend-item">
          <span className="legend-color panorama"></span>
          <span>Point de vue</span>
        </div>
        <div className="pass-3d-legend-item">
          <span className="legend-color ravitaillement"></span>
          <span>Ravitaillement</span>
        </div>
      </div>
      
      <div className="pass-3d-instructions">
        <p>
          <strong>Navigation :</strong> Cliquez et faites glisser pour pivoter la vue. 
          Utilisez la molette de la souris pour zoomer et dézoomer. 
          Cliquez sur un marqueur pour afficher plus d'informations.
        </p>
      </div>
    </div>
  );
};

export default Pass3DViewer;
