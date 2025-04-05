import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { TextureLoader } from 'three/src/loaders/TextureLoader';

// Composant pour le terrain 3D
const Terrain = ({ elevationData, surfaceTypes }) => {
  const meshRef = useRef();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Création de la géométrie du terrain basée sur les données d'élévation
  useEffect(() => {
    if (!meshRef.current) return;
    
    try {
      // Validation des données d'élévation
      if (!elevationData || !elevationData.heights || !Array.isArray(elevationData.heights) || 
          !elevationData.width || !elevationData.heights.length) {
        setError('Données d\'élévation invalides ou manquantes');
        return;
      }
      
      const geometry = meshRef.current.geometry;
      const positionAttribute = geometry.getAttribute('position');
      
      // Appliquer les données d'élévation à la géométrie
      for (let i = 0; i < positionAttribute.count; i++) {
        const x = Math.floor(i % elevationData.width);
        const z = Math.floor(i / elevationData.width);
        
        if (elevationData.heights[z] && typeof elevationData.heights[z][x] === 'number') {
          positionAttribute.setY(i, elevationData.heights[z][x] * 0.1); // Échelle ajustable
        }
      }
      
      positionAttribute.needsUpdate = true;
      geometry.computeVertexNormals();
      setIsLoading(false);
    } catch (err) {
      console.error('Erreur lors de la création du terrain 3D:', err);
      setError('Erreur lors de la génération du terrain');
    }
  }, [elevationData]);
  
  // Gestion sécurisée du chargement des textures
  const textureUrls = [
    '/textures/asphalt.jpg',
    '/textures/gravel.jpg',
    '/textures/dirt.jpg'
  ];
  
  // Utilisation de useLoader avec gestion des erreurs
  const textures = useLoader(TextureLoader, textureUrls, 
    // onProgress callback
    (progress) => {
      // Le chargement est en cours
    },
    // onError callback
    (error) => {
      console.error('Erreur lors du chargement des textures:', error);
      setError('Erreur lors du chargement des textures');
    }
  );
  
  // Destructuration des textures
  const [asphaltTexture, gravelTexture, dirtTexture] = textures;
  
  // Configuration des textures
  React.useEffect(() => {
    textures.forEach(texture => {
      if (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 4);
      }
    });
  }, [textures]);
  
  // Déterminer la texture à utiliser en fonction du type de surface, avec valeur par défaut
  const texture = !surfaceTypes ? dirtTexture :
                 surfaceTypes.dominant === 'asphalt' ? asphaltTexture :
                 surfaceTypes.dominant === 'gravel' ? gravelTexture : 
                 dirtTexture;
  
  // Affichage d'une erreur si le chargement a échoué
  if (error) {
    return (
      <Text position={[0, 0, 0]} fontSize={0.5} color="red">
        {error}
      </Text>
    );
  }
  
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10, 10, 100, 100]} />
      <meshStandardMaterial 
        map={texture} 
        displacementMap={texture} 
        displacementScale={0.2}
        roughness={0.8} 
        metalness={0.2}
        transparent={isLoading}
        opacity={isLoading ? 0.5 : 1}
      />
    </mesh>
  );
};

// Composant pour les points d'intérêt
const PointOfInterest = ({ position, label, type }) => {
  // Validation des props
  if (!position || !Array.isArray(position) || position.length !== 3 || 
      position.some(coord => typeof coord !== 'number')) {
    console.warn('Position invalide pour le point d\'intérêt:', label);
    return null;
  }
  
  const iconColors = {
    panorama: 'hotpink',
    danger: 'red',
    water: 'blue',
    food: 'green'
  };
  
  const color = iconColors[type] || 'yellow';
  
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={[0, 0.2, 0]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="black"
      >
        {label || 'Point d\'intérêt'}
      </Text>
    </group>
  );
};

// Composant principal
const ColVisualization3D = ({ passId, elevationData, surfaceTypes, pointsOfInterest }) => {
  // États
  const [cameraPosition, setCameraPosition] = useState([0, 5, 10]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Valider les données d'entrée
  useEffect(() => {
    setIsLoading(true);
    
    try {
      // Vérifier les données d'élévation
      if (!elevationData || !elevationData.heights || !elevationData.width) {
        setError('Données d\'élévation manquantes ou invalides');
        setIsLoading(false);
        return;
      }
      
      // Vérifier les points d'intérêt
      if (pointsOfInterest && (!Array.isArray(pointsOfInterest) || 
          pointsOfInterest.some(poi => !poi.x || !poi.z))) {
        console.warn('Certains points d\'intérêt ont un format invalide');
      }
      
      setError(null);
      setIsLoading(false);
    } catch (err) {
      console.error('Erreur lors de l\'initialisation de la visualisation 3D:', err);
      setError('Erreur d\'initialisation de la visualisation');
      setIsLoading(false);
    }
  }, [elevationData, pointsOfInterest]);
  
  // Fonction pour ajuster la vue
  const handleViewChange = (view) => {
    switch(view) {
      case 'top':
        setCameraPosition([0, 10, 0]);
        break;
      case 'side':
        setCameraPosition([10, 5, 0]);
        break;
      case 'front':
        setCameraPosition([0, 5, 10]);
        break;
      case 'default':
      default:
        setCameraPosition([5, 5, 5]);
    }
  };
  
  // Gérer les cas d'erreur ou de chargement
  if (error) {
    return (
      <div className="col-visualization-error" style={{ 
        height: '500px', 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8d7da',
        color: '#721c24'
      }}>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="col-visualization-container" style={{ height: '500px', width: '100%' }}>
      <div className="visualization-controls" style={{ marginBottom: '10px' }}>
        <button onClick={() => handleViewChange('top')}>Vue du dessus</button>
        <button onClick={() => handleViewChange('side')}>Vue latérale</button>
        <button onClick={() => handleViewChange('front')}>Vue frontale</button>
        <button onClick={() => handleViewChange('default')}>Vue par défaut</button>
      </div>
      
      {isLoading ? (
        <div style={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <p>Chargement de la visualisation 3D...</p>
        </div>
      ) : (
        <Canvas camera={{ position: cameraPosition, fov: 45 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, 10, -5]} intensity={0.5} color="#b9d5ff" />
          
          {/* Terrain 3D */}
          <Terrain elevationData={elevationData} surfaceTypes={surfaceTypes} />
          
          {/* Points d'intérêt */}
          {pointsOfInterest?.filter(poi => poi && typeof poi.x === 'number' && typeof poi.z === 'number')
            .map((poi, index) => (
              <PointOfInterest 
                key={index}
                position={[poi.x, (poi.elevation || 0) * 0.1 + 0.2, poi.z]} 
                label={poi.name || `Point ${index + 1}`}
                type={poi.type || 'default'}
              />
            ))}
          
          {/* Contrôles de caméra */}
          <OrbitControls 
            enableZoom={true} 
            enablePan={true} 
            enableRotate={true}
            minDistance={1}
            maxDistance={20}
          />
        </Canvas>
      )}
    </div>
  );
};

export default ColVisualization3D;
