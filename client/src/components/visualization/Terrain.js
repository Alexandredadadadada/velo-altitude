import React from 'react';

// Suppression des imports inutilisés
// import { useLoader } from '@react-three/fiber';
// import * as THREE from 'three';

/**
 * Terrain
 * - Affiche un mesh de terrain basé sur les données d'élévation et de surface
 * - À améliorer pour utiliser réellement les données (placeholder actuellement)
 */
const Terrain = ({ elevationData, surfaceTypes, detailLevel, renderConfig, segments }) => {
  // TODO: Use elevationData and surfaceTypes to build geometry and materials
  // For now, placeholder plane
  return (
    <mesh receiveShadow castShadow position={[0, 0, 0]}>
      <planeGeometry args={[2000, 2000, segments, segments]} />
      <meshStandardMaterial color={renderConfig?.terrainColor || '#b8ccb8'} wireframe={false} />
    </mesh>
  );
};

export default Terrain;
