/**
 * Service pour la gestion des cols
 * Utilise RealApiOrchestrator pour les opérations de données
 */

import { ColData } from '../types';
import RealApiOrchestrator from './api/RealApiOrchestrator';

/**
 * Interface pour les données de terrain 3D
 */
interface Terrain3DPoint {
  x: number;
  y: number;
  z: number;
  gradient?: number;
}

/**
 * Interface pour les points d'intérêt sur un col
 */
interface PointOfInterest {
  id: string;
  name: string;
  type: 'summit' | 'viewpoint' | 'water' | 'shelter' | 'danger';
  position: {
    x: number;
    y: number;
    z: number;
  };
  description?: string;
}

/**
 * Service pour la gestion des cols
 */
class ColService {
  /**
   * Récupère tous les cols
   * @returns Liste des cols
   */
  async getAllCols(): Promise<ColData[]> {
    try {
      const cols = await RealApiOrchestrator.getAllCols();
      return this.mapToColData(cols);
    } catch (error) {
      console.error('[ColService] Error fetching all cols:', error);
      throw error;
    }
  }

  /**
   * Récupère un col par son ID
   * @param id ID du col
   * @returns Détails du col
   */
  async getColById(id: string): Promise<ColData> {
    try {
      const col = await RealApiOrchestrator.getColById(id);
      return this.mapToColData([col])[0];
    } catch (error) {
      console.error(`[ColService] Error fetching col with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Récupère les cols par région
   * @param region Région des cols
   * @returns Liste des cols dans la région
   */
  async getColsByRegion(region: string): Promise<ColData[]> {
    try {
      const cols = await RealApiOrchestrator.getColsByRegion(region);
      return this.mapToColData(cols);
    } catch (error) {
      console.error(`[ColService] Error fetching cols for region ${region}:`, error);
      throw error;
    }
  }

  /**
   * Récupère les cols par difficulté
   * @param difficulty Niveau de difficulté
   * @returns Liste des cols de cette difficulté
   */
  async getColsByDifficulty(difficulty: number): Promise<ColData[]> {
    try {
      const cols = await RealApiOrchestrator.getColsByDifficulty(difficulty.toString());
      return this.mapToColData(cols);
    } catch (error) {
      console.error(`[ColService] Error fetching cols with difficulty ${difficulty}:`, error);
      throw error;
    }
  }

  /**
   * Recherche des cols par terme de recherche
   * @param query Terme de recherche
   * @returns Liste des cols correspondants
   */
  async searchCols(query: string): Promise<ColData[]> {
    try {
      const cols = await RealApiOrchestrator.searchCols(query);
      return this.mapToColData(cols);
    } catch (error) {
      console.error(`[ColService] Error searching cols with query "${query}":`, error);
      throw error;
    }
  }

  /**
   * Récupère les données de terrain 3D pour un col
   * @param colId ID du col
   * @returns Données de terrain 3D
   */
  async getCol3DTerrainData(colId: string): Promise<Terrain3DPoint[]> {
    try {
      // Utiliser l'API d'orchestration pour récupérer les données de terrain 3D
      // Note: Cette méthode doit être implémentée dans RealApiOrchestrator
      // return await RealApiOrchestrator.getCol3DTerrainData(colId);
      
      // Fallback pour le développement - données de terrain simplifiées
      console.warn('[ColService] Using fallback terrain data for development');
      return this.getFallbackTerrainData();
    } catch (error) {
      console.error(`[ColService] Error fetching 3D terrain data for col ${colId}:`, error);
      // Fallback pour le développement - données de terrain simplifiées
      if (process.env.NODE_ENV === 'development') {
        console.warn('[ColService] Using fallback terrain data for development');
        return this.getFallbackTerrainData();
      }
      throw error;
    }
  }

  /**
   * Convertit les données brutes de col en objets ColData
   * @param cols Données brutes de cols
   * @returns Objets ColData formatés
   */
  private mapToColData(cols: any[]): ColData[] {
    return cols.map(col => ({
      id: col.id || '',
      name: col.name || '',
      altitude: typeof col.altitude === 'number' ? col.altitude : parseFloat(col.altitude) || 0,
      length: typeof col.length === 'number' ? col.length : parseFloat(col.length) || 0,
      gradient: typeof col.gradient === 'number' ? col.gradient : parseFloat(col.gradient) || 0,
      difficulty: typeof col.difficulty === 'number' ? col.difficulty : parseInt(col.difficulty) || 1,
      region: col.region || '',
      country: col.country || '',
      coordinates: {
        lat: typeof col.coordinates?.lat === 'number' ? col.coordinates.lat : 
             (typeof col.lat === 'number' ? col.lat : parseFloat(col.lat) || 0),
        lng: typeof col.coordinates?.lng === 'number' ? col.coordinates.lng : 
             (typeof col.lng === 'number' ? col.lng : parseFloat(col.lng) || 0)
      }
    }));
  }

  /**
   * Génère des données de terrain de secours pour le développement
   * @returns Données de terrain simplifiées
   */
  private getFallbackTerrainData(): Terrain3DPoint[] {
    // Générer un terrain simple pour le développement
    const terrainPoints: Terrain3DPoint[] = [];
    const length = 20;
    const width = 10;
    
    for (let x = 0; x < length; x++) {
      for (let z = 0; z < width; z++) {
        // Générer une hauteur basée sur une fonction sinusoïdale pour simuler un col
        const normalizedX = x / length;
        const normalizedZ = z / width;
        const centerDistance = Math.sqrt(
          Math.pow(normalizedX - 0.5, 2) + Math.pow(normalizedZ - 0.5, 2)
        );
        
        // Hauteur basée sur la distance au centre
        let y = Math.sin(normalizedX * Math.PI) * 2;
        y += (1 - centerDistance) * 3;
        
        // Ajouter un peu de bruit aléatoire
        y += Math.random() * 0.2 - 0.1;
        
        // Calculer le gradient (pente)
        const gradient = Math.cos(normalizedX * Math.PI) * 10;
        
        terrainPoints.push({
          x,
          y,
          z,
          gradient
        });
      }
    }
    
    return terrainPoints;
  }
}

// Créer une instance et l'exporter
const colService = new ColService();
export default colService;
