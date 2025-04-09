/**
 * Types et interfaces pour les données de terrain 3D
 */

import { GeoLocation } from './ColTypes';

/**
 * Données de base du terrain 3D
 */
export interface TerrainData {
  id: string;
  colId: string;
  boundingBox: BoundingBox;
  resolution: number; // Résolution en mètres par pixel
  heightmap: string; // URL vers l'image de la heightmap
  texture: string; // URL vers la texture du terrain
  normal: string; // URL vers la carte des normales
  metadata: TerrainMetadata;
}

/**
 * Boîte englobante du terrain
 */
export interface BoundingBox {
  north: number; // Latitude maximale
  south: number; // Latitude minimale
  east: number; // Longitude maximale
  west: number; // Longitude minimale
  maxElevation: number; // Élévation maximale
  minElevation: number; // Élévation minimale
}

/**
 * Métadonnées du terrain
 */
export interface TerrainMetadata {
  source: string; // Source des données
  dateGenerated: Date; // Date de génération
  attribution: string; // Attribution des données
  resolution: number; // Résolution en mètres par pixel
  dimensions: {
    width: number; // Largeur de la heightmap en pixels
    height: number; // Hauteur de la heightmap en pixels
  };
  verticalExaggeration: number; // Facteur d'exagération verticale
}

/**
 * Données de la route sur le terrain
 */
export interface RouteData {
  id: string;
  colId: string;
  path: GeoLocation[]; // Points de la route
  elevations: number[]; // Élévations correspondantes aux points
  totalLength: number; // Longueur totale en km
  metadata: RouteMetadata;
}

/**
 * Métadonnées de la route
 */
export interface RouteMetadata {
  source: string; // Source des données
  dateGenerated: Date; // Date de génération
  attribution: string; // Attribution des données
  gradeProfile: GradeSegment[]; // Profil de pente
}

/**
 * Segment de pente de la route
 */
export interface GradeSegment {
  startDistance: number; // Distance de début en km
  endDistance: number; // Distance de fin en km
  grade: number; // Pente en pourcentage
  length: number; // Longueur du segment en km
}

/**
 * Options de visualisation 3D
 */
export interface Visualization3DOptions {
  verticalExaggeration: number; // Facteur d'exagération verticale
  textureQuality: 'low' | 'medium' | 'high'; // Qualité de la texture
  wireframe: boolean; // Afficher le wireframe
  shadows: boolean; // Activer les ombres
  lighting: 'basic' | 'realistic' | 'dramatic'; // Type d'éclairage
  animateRoute: boolean; // Animer la route
  showPOIs: boolean; // Afficher les points d'intérêt
  weatherEffects: boolean; // Afficher les effets météo
  levelOfDetail: 'low' | 'medium' | 'high'; // Niveau de détail
  cameraMode: 'free' | 'follow' | 'orbit'; // Mode de caméra
}

/**
 * Niveau de détail pour le terrain
 */
export interface LODLevel {
  distance: number; // Distance à partir de laquelle ce niveau est utilisé
  resolution: number; // Facteur de résolution (1 = pleine résolution)
}

/**
 * Performance metrics pour la visualisation 3D
 */
export interface Performance3DMetrics {
  frameRate: number; // Images par seconde
  drawCalls: number; // Nombre d'appels de dessin
  triangles: number; // Nombre de triangles
  memoryUsage: number; // Utilisation mémoire en Mo
  loadTime: number; // Temps de chargement en ms
  renderTime: number; // Temps de rendu d'une image en ms
}

/**
 * Effets météorologiques 3D
 */
export interface Weather3DEffects {
  rainIntensity: number; // Intensité de la pluie (0-1)
  snowIntensity: number; // Intensité de la neige (0-1)
  fogDensity: number; // Densité du brouillard (0-1)
  cloudCover: number; // Couverture nuageuse (0-1)
  windStrength: number; // Force du vent (0-1)
  lightingIntensity: number; // Intensité de l'éclairage (0-1)
  sunPosition: { x: number, y: number, z: number }; // Position du soleil
}

/**
 * Informations sur les shaders utilisés
 */
export interface ShaderInfo {
  terrain: string; // Shader du terrain
  sky: string; // Shader du ciel
  water: string; // Shader de l'eau
  vegetation: string; // Shader de la végétation
}

/**
 * Options d'exportation 3D
 */
export interface Export3DOptions {
  format: '3ds' | 'obj' | 'fbx' | 'glb' | 'gltf'; // Format d'exportation
  includeTextures: boolean; // Inclure les textures
  resolution: 'low' | 'medium' | 'high'; // Résolution d'exportation
  scale: number; // Échelle d'exportation
}
