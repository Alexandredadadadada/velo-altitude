/**
 * Service de visualisation unifié pour les cols
 * Combine les fonctionnalités de SimpleColVisualization et Col3DVisualization
 */

import { SCALE_FACTORS } from '../../config/visualizationConfig';

export interface Col {
  name: string;
  elevation: number;
  length: number;
  avgGradient: number;
  startElevation?: number;
  coordinates?: [number, number][];
  maxGradient?: number;
  climbs?: {
    name?: string;
    gradient?: number;
    length?: number;
    startDistance?: number;
  }[];
}

export interface ElevationPoint {
  distance: number;
  elevation: number;
  gradient?: number;
}

export interface ElevationProfile {
  start: number;
  summit: number;
  distance: number;
  gradient: number;
  maxGradient?: number;
}

export interface VisualizationData {
  elevationProfile: ElevationProfile;
  points: ElevationPoint[];
  terrainData?: {
    vertices: number[];
    indices: number[];
    normals: number[];
    uvs: number[];
  };
}

export class UnifiedColVisualization {
  private horizontalExaggeration: number;
  private verticalExaggeration: number;

  constructor(config?: { 
    horizontalExaggeration?: number;
    verticalExaggeration?: number;
  }) {
    this.horizontalExaggeration = config?.horizontalExaggeration || SCALE_FACTORS.horizontalExaggeration;
    this.verticalExaggeration = config?.verticalExaggeration || SCALE_FACTORS.verticalExaggeration;
  }

  /**
   * Transforme un col en données de visualisation 2D
   * @param col Données du col
   * @returns Données de visualisation
   */
  public transformColTo2D(col: Col): VisualizationData {
    // Déterminer l'élévation de départ
    const startElevation = col.startElevation || this.estimateStartElevation(col);
    
    // Générer les points du profil d'élévation
    const points = this.generateElevationPoints(startElevation, col.elevation, col.length, col.avgGradient);
    
    // Appliquer des variations pour rendre le profil plus réaliste si maxGradient est disponible
    const enhancedPoints = col.maxGradient 
      ? this.enhanceElevationProfile(points, col.maxGradient)
      : points;
    
    // Intégrer les sections spécifiques (climbs) si disponibles
    const finalPoints = col.climbs 
      ? this.incorporateClimbSections(enhancedPoints, col.climbs, col.length)
      : enhancedPoints;
    
    return {
      elevationProfile: {
        start: startElevation,
        summit: col.elevation,
        distance: col.length,
        gradient: col.avgGradient,
        maxGradient: col.maxGradient
      },
      points: finalPoints
    };
  }

  /**
   * Transforme un col en données de visualisation 3D
   * @param col Données du col
   * @returns Données de visualisation avec terrainData pour THREE.js
   */
  public transformColTo3D(col: Col): VisualizationData {
    // Obtenir d'abord les données 2D
    const data2D = this.transformColTo2D(col);
    
    // Générer les données de terrain pour THREE.js
    const terrainData = this.generateTerrainData(data2D.points, col.length);
    
    // Retourner les données combinées
    return {
      ...data2D,
      terrainData
    };
  }

  /**
   * Estime l'élévation de départ en fonction de l'élévation du sommet, de la longueur et de la pente
   * @param col Données du col
   * @returns Élévation estimée du point de départ
   */
  private estimateStartElevation(col: Col): number {
    // Calcul: élévation sommet - (longueur * pente moyenne / 100)
    const elevationDifference = (col.length * col.avgGradient) / 100 * 1000;
    return Math.max(0, col.elevation - elevationDifference);
  }

  /**
   * Génère les points du profil d'élévation
   * @param startElevation Élévation du point de départ
   * @param summitElevation Élévation du sommet
   * @param length Longueur en km
   * @param avgGradient Pente moyenne en pourcentage
   * @returns Tableau de points (distance, élévation)
   */
  private generateElevationPoints(
    startElevation: number,
    summitElevation: number,
    length: number,
    avgGradient: number
  ): ElevationPoint[] {
    const points: ElevationPoint[] = [];
    const elevationDifference = summitElevation - startElevation;
    const numPoints = Math.max(50, Math.floor(length * 10)); // 10 points par km, minimum 50 points
    
    for (let i = 0; i <= numPoints; i++) {
      const distanceRatio = i / numPoints;
      const distance = length * distanceRatio;
      
      // Calcul d'élévation avec une légère courbe (fonction cubique)
      const easingFactor = this.easeInOutCubic(distanceRatio);
      const elevation = startElevation + elevationDifference * easingFactor;
      
      // Calcul du gradient local (pente)
      const gradient = i > 0 
        ? ((elevation - points[i-1].elevation) / (distance - points[i-1].distance)) * 100 / 1000
        : avgGradient;
      
      points.push({
        distance,
        elevation,
        gradient
      });
    }
    
    return points;
  }

  /**
   * Fonction d'assouplissement cubique pour rendre les transitions plus naturelles
   * @param x Valeur entre 0 et 1
   * @returns Valeur transformée entre 0 et 1
   */
  private easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  /**
   * Améliore le profil d'élévation en ajoutant des variations de pente
   * @param points Points du profil initial
   * @param maxGradient Pente maximale du col
   * @returns Points améliorés avec variations
   */
  private enhanceElevationProfile(points: ElevationPoint[], maxGradient: number): ElevationPoint[] {
    if (points.length < 3) return points;
    
    const enhancedPoints = [...points];
    const numSections = Math.floor(Math.random() * 3) + 2; // 2 à 4 sections plus difficiles
    
    for (let i = 0; i < numSections; i++) {
      // Sélectionne une section aléatoire (évite le début et la fin)
      const startIdx = Math.floor(Math.random() * (points.length / 2)) + Math.floor(points.length / 4);
      const sectionLength = Math.floor(Math.random() * (points.length / 8)) + 3; // Section de taille variable
      
      // Applique une pente plus élevée à cette section
      const sectionGradient = maxGradient * (0.8 + Math.random() * 0.2); // 80-100% de la pente max
      
      for (let j = 0; j < sectionLength && (startIdx + j) < points.length - 1; j++) {
        const currentIdx = startIdx + j;
        const nextIdx = currentIdx + 1;
        
        // Calcule la nouvelle élévation basée sur la pente plus élevée
        const distanceDiff = points[nextIdx].distance - points[currentIdx].distance;
        const elevationIncrease = (distanceDiff * sectionGradient) / 100 * 1000;
        
        // Met à jour les points suivants
        if (nextIdx < enhancedPoints.length) {
          enhancedPoints[nextIdx].elevation = enhancedPoints[currentIdx].elevation + elevationIncrease;
          enhancedPoints[nextIdx].gradient = sectionGradient;
        }
      }
    }
    
    // Lisse le profil après les modifications
    return this.smoothProfile(enhancedPoints);
  }

  /**
   * Incorpore les sections spécifiques (climbs) dans le profil
   * @param points Points du profil
   * @param climbs Sections spécifiques du col
   * @param totalLength Longueur totale du col
   * @returns Points avec sections intégrées
   */
  private incorporateClimbSections(
    points: ElevationPoint[],
    climbs: Col['climbs'],
    totalLength: number
  ): ElevationPoint[] {
    if (!climbs || climbs.length === 0) return points;
    
    const modifiedPoints = [...points];
    
    climbs.forEach(climb => {
      if (!climb.gradient || !climb.length) return;
      
      const startDistance = climb.startDistance || 0;
      const endDistance = startDistance + climb.length;
      
      // Trouve les index des points correspondant aux distances
      const startIdx = modifiedPoints.findIndex(p => p.distance >= startDistance);
      const endIdx = modifiedPoints.findIndex(p => p.distance >= endDistance) || modifiedPoints.length - 1;
      
      if (startIdx >= 0 && endIdx > startIdx) {
        const startElevation = modifiedPoints[startIdx].elevation;
        const elevationGain = (climb.length * climb.gradient) / 100 * 1000;
        
        // Ajuste les élévations pour cette section
        for (let i = startIdx + 1; i <= endIdx; i++) {
          const ratio = (modifiedPoints[i].distance - modifiedPoints[startIdx].distance) / climb.length;
          modifiedPoints[i].elevation = startElevation + elevationGain * ratio;
          modifiedPoints[i].gradient = climb.gradient;
        }
        
        // Recalcule les élévations des points après cette section
        if (endIdx < modifiedPoints.length - 1) {
          const remainingDistance = totalLength - modifiedPoints[endIdx].distance;
          const remainingElevation = points[points.length - 1].elevation - modifiedPoints[endIdx].elevation;
          const remainingGradient = remainingDistance > 0 ? (remainingElevation / remainingDistance) * 100 / 1000 : 0;
          
          for (let i = endIdx + 1; i < modifiedPoints.length; i++) {
            const distanceFromEnd = modifiedPoints[i].distance - modifiedPoints[endIdx].distance;
            modifiedPoints[i].elevation = modifiedPoints[endIdx].elevation + (distanceFromEnd * remainingGradient) / 100 * 1000;
          }
        }
      }
    });
    
    // Lisse le profil final
    return this.smoothProfile(modifiedPoints);
  }

  /**
   * Lisse le profil d'élévation pour éviter les changements trop abrupts
   * @param points Points du profil
   * @returns Points lissés
   */
  private smoothProfile(points: ElevationPoint[]): ElevationPoint[] {
    if (points.length < 3) return points;
    
    const smoothedPoints = [...points];
    
    // Conserve les points de départ et d'arrivée
    for (let i = 1; i < points.length - 1; i++) {
      // Moyenne pondérée avec les points voisins
      smoothedPoints[i].elevation = (
        points[i-1].elevation * 0.25 +
        points[i].elevation * 0.5 +
        points[i+1].elevation * 0.25
      );
    }
    
    return smoothedPoints;
  }

  /**
   * Génère les données de terrain pour THREE.js
   * @param points Points du profil d'élévation
   * @param length Longueur du col
   * @returns Données de terrain (vertices, indices, normals, uvs)
   */
  private generateTerrainData(points: ElevationPoint[], length: number): VisualizationData['terrainData'] {
    // Nombre de segments dans le sens de la largeur et de la longueur
    const widthSegments = 32;
    const lengthSegments = points.length - 1;
    
    // Largeur du terrain (perpendiculaire à la route)
    const terrainWidth = length * 0.4; // 40% de la longueur
    
    // Arrays pour stocker les données du terrain
    const vertices: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    
    // Générer les sommets et les UVs
    for (let z = 0; z <= lengthSegments; z++) {
      const u = z / lengthSegments;
      const pointIdx = Math.min(z, points.length - 1);
      
      for (let x = 0; x <= widthSegments; x++) {
        const v = x / widthSegments;
        
        // Position dans l'espace
        const xPos = (v - 0.5) * terrainWidth;                         // Position X (largeur)
        const zPos = u * length * this.horizontalExaggeration;          // Position Z (longueur)
        const yPos = points[pointIdx].elevation * this.verticalExaggeration / 1000; // Position Y (hauteur)
        
        // Modifier l'élévation pour créer un terrain de chaque côté de la route
        let elevationOffset = 0;
        
        if (Math.abs(v - 0.5) > 0.05) { // En dehors de la route
          // Ajouter des variations naturelles de terrain
          const distFromCenter = Math.abs(v - 0.5) - 0.05;
          const randomFactor = Math.sin(xPos * 0.2) * Math.cos(zPos * 0.3) * 0.5 + 0.5;
          elevationOffset = -distFromCenter * 0.3 * randomFactor; // Pente descendante avec variations
        }
        
        // Ajouter les sommets
        vertices.push(xPos, yPos + elevationOffset, zPos);
        
        // Normales temporaires (seront recalculées)
        normals.push(0, 1, 0);
        
        // Coordonnées UV
        uvs.push(u, v);
      }
    }
    
    // Générer les indices pour les faces triangulaires
    for (let z = 0; z < lengthSegments; z++) {
      for (let x = 0; x < widthSegments; x++) {
        const a = (widthSegments + 1) * z + x;
        const b = (widthSegments + 1) * z + x + 1;
        const c = (widthSegments + 1) * (z + 1) + x;
        const d = (widthSegments + 1) * (z + 1) + x + 1;
        
        // Deux triangles par quad
        indices.push(a, c, b);
        indices.push(c, d, b);
      }
    }
    
    return {
      vertices,
      indices,
      normals,
      uvs
    };
  }
}

export default UnifiedColVisualization;
