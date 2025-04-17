import React from 'react';
import { Html } from '@react-three/drei';

const typeColors = {
  viewpoint: '#1976d2',
  restaurant: '#c62828',
  landmark: '#6d4c41',
  parking: '#388e3c',
  danger: '#fbc02d',
};

// Documentation rapide pour le composant POI
/**
 * PointOfInterest
 * - Affiche un POI sur la scène 3D avec une sphère colorée et un label
 * - Couleur et style selon le type et la sélection
 */
const PointOfInterest = ({ position, label, type, isSelected, onClick, detailLevel }) => (
  <group position={position}>
    <mesh onClick={onClick} castShadow>
      <sphereGeometry args={[isSelected ? 8 : 5, 16, 16]} />
      <meshStandardMaterial color={typeColors[type] || '#607d8b'} emissive={isSelected ? '#fff176' : '#000'} />
    </mesh>
    {detailLevel !== 'low' && (
      <Html distanceFactor={10} center style={{ pointerEvents: 'none' }}>
        <div style={{
          background: isSelected ? '#fffde7' : '#f5f5f5',
          color: '#222',
          borderRadius: 4,
          padding: '2px 6px',
          fontWeight: isSelected ? 'bold' : 'normal',
          fontSize: 12,
          boxShadow: isSelected ? '0 2px 8px #ffc' : 'none',
        }}>{label}</div>
      </Html>
    )}
  </group>
);

export default PointOfInterest;
