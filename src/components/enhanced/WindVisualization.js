import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

// Wind arrow component for 3D visualization
const WindArrow = ({ position, direction, speed, color }) => {
  const arrowRef = useRef();
  
  useEffect(() => {
    if (arrowRef.current) {
      // Set arrow direction
      const radians = (direction * Math.PI) / 180;
      arrowRef.current.rotation.y = radians;
      
      // Scale arrow based on wind speed
      const baseScale = Math.min(0.5 + (speed / 20), 2.0);
      arrowRef.current.scale.set(baseScale, baseScale, baseScale * 2); // Longer in z-direction
    }
  }, [direction, speed]);
  
  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/windvisualization"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    <group ref={arrowRef} position={position}>
      {/* Arrow body */}
      <mesh>
        <cylinderGeometry args={[0.1, 0.1, 1, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Arrow head */}
      <mesh position={[0, 0, 0.6]}>
        <coneGeometry args={[0.2, 0.4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
};

// Wind visualization legend component
const WindLegend = ({ items }) => {
  const { t } = useTranslation();
  
  return (
    <div className="wind-legend">
      <h4>{t('windLegend')}</h4>
      <div className="legend-items">
        {items.map((item, index) => (
          <div key={index} className="legend-item">
            <span 
              className="color-square" 
              style={{ backgroundColor: item.color }}
            />
            <span>{item.label}: {item.range}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main 3D terrain component with wind visualization
const WindTerrain = ({ elevationData, windData }) => {
  const meshRef = useRef();

  useEffect(() => {
    if (!elevationData || !meshRef.current) return;
    
    // Similar to ColVisualization3D, configure the terrain geometry
    const geometry = meshRef.current.geometry;
    const positionAttribute = geometry.getAttribute('position');
    
    // Apply elevation data to the geometry
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = Math.floor(i % elevationData.width);
      const z = Math.floor(i / elevationData.width);
      
      if (elevationData.heights[z] && elevationData.heights[z][x] !== undefined) {
        positionAttribute.setY(i, elevationData.heights[z][x] * 0.1); // Scale for visualization
      }
    }
    
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
  }, [elevationData]);
  
  return (
    <>
      {/* Terrain mesh */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10, 100, 100]} />
        <meshStandardMaterial 
          color="#a0a0a0"
          wireframe={false}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      
      {/* Wind arrows */}
      {windData && windData.map((wind, index) => {
        // Get color based on wind speed
        let color;
        if (wind.speed < 10) color = '#3388ff'; // Light wind
        else if (wind.speed < 20) color = '#ffaa00'; // Moderate wind
        else if (wind.speed < 30) color = '#ff7700'; // Strong wind
        else color = '#ff0000'; // Very strong wind
        
        return (
          <WindArrow
            key={index}
            position={[wind.x, wind.elevation * 0.1 + 0.5, wind.z]}
            direction={wind.direction}
            speed={wind.speed}
            color={color}
          />
        );
      })}
    </>
  );
};

// Wind data display panel
const WindDataPanel = ({ windData, currentLocation }) => {
  const { t } = useTranslation();
  
  if (!currentLocation || !windData) return null;
  
  const getCurrentWindData = () => {
    // Find closest wind data point to current location
    if (!windData.length) return null;
    
    // Just use the first one for demonstration, in real app would find closest
    return windData[0];
  };
  
  const currentWind = getCurrentWindData();
  
  if (!currentWind) return null;
  
  // Get wind condition description
  const getWindCondition = (speed) => {
    if (speed < 5) return 'calm';
    if (speed < 15) return 'moderate';
    if (speed < 30) return 'strong';
    return 'extreme';
  };
  
  // Get directional description
  const getWindDirectionDesc = (direction) => {
    const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'north'];
    const index = Math.round(direction / 45) % 8;
    return directions[index];
  };
  
  return (
    <div className="wind-data-panel">
      <h3>{t('windConditions')}</h3>
      <div className="wind-speed">
        <span className="label">{t('speed')}: </span>
        <span className="value">{currentWind.speed} km/h</span>
        <span className="description">
          ({t(getWindCondition(currentWind.speed))})
        </span>
      </div>
      <div className="wind-direction">
        <span className="label">{t('direction')}: </span>
        <span className="value">{currentWind.direction}°</span>
        <span className="description">
          ({t('from')} {t(getWindDirectionDesc(currentWind.direction))})
        </span>
      </div>
      <div className="wind-gusts">
        <span className="label">{t('gusts')}: </span>
        <span className="value">{currentWind.gusts || Math.round(currentWind.speed * 1.3)} km/h</span>
      </div>
      <div className={`wind-impact ${getWindCondition(currentWind.speed)}`}>
        {t('cyclingImpact')}: {t(`${getWindCondition(currentWind.speed)}Impact`)}
      </div>
    </div>
  );
};

// Main component for wind visualization
const WindVisualization = ({ passId, elevationData, windData, currentLocation }) => {
  const { t } = useTranslation();
  const [cameraPosition, setCameraPosition] = useState([0, 5, 10]);
  
  // Define legend items
  const legendItems = [
    { color: '#3388ff', label: t('lightWind'), range: '0-10 km/h' },
    { color: '#ffaa00', label: t('moderateWind'), range: '10-20 km/h' },
    { color: '#ff7700', label: t('strongWind'), range: '20-30 km/h' },
    { color: '#ff0000', label: t('extremeWind'), range: '>30 km/h' }
  ];
  
  // Handle view changes
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
      default:
        setCameraPosition([0, 5, 10]);
    }
  };
  
  return (
    <main className="wind-visualization-container">
      <div className="visualization-header">
        <h2>{t('windVisualization')}</h2>
        <div className="view-controls">
          <button onClick={() => handleViewChange('top')}>{t('topView')}</button>
          <button onClick={() => handleViewChange('side')}>{t('sideView')}</button>
          <button onClick={() => handleViewChange('front')}>{t('frontView')}</button>
        </div>
      </div>
      
      <article className="visualization-content">
        <main className="canvas-container" style={{ height: '400px' }}>
          <Canvas camera={{ position: cameraPosition, fov: 45 }} shadows>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
            
            <WindTerrain elevationData={elevationData} windData={windData} />
            
            <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
          </Canvas>
        </div>
        
        <div className="visualization-data">
          <WindDataPanel windData={windData} currentLocation={currentLocation} />
          <WindLegend items={legendItems} />
        </div>
      </div>
    </div>
  );
};

WindVisualization.propTypes = {
  passId: PropTypes.string.isRequired,
  elevationData: PropTypes.object.isRequired,
  windData: PropTypes.array.isRequired,
  currentLocation: PropTypes.object
};

// Default wind data for development
WindVisualization.defaultProps = {
  windData: [],
  currentLocation: null
};

export default WindVisualization;
