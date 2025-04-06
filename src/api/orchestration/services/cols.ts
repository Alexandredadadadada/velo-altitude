import axios from 'axios';
import { Col, Challenge } from '../../../types';

export class ColsService {
  private apiBaseUrl: string;
  
  constructor() {
    this.apiBaseUrl = '/api/cols';
  }
  
  // Obtenir tous les cols disponibles
  async getAllCols(): Promise<Col[]> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des cols:', error);
      throw error;
    }
  }
  
  // Rechercher des cols par nom, région ou pays
  async searchCols(query: string): Promise<Col[]> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/search`, {
        params: { query }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche des cols:', error);
      throw error;
    }
  }
  
  // Obtenir un col par son ID
  async getColById(id: string): Promise<Col> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du col ${id}:`, error);
      throw error;
    }
  }
  
  // Obtenir les cols d'une région spécifique
  async getColsByRegion(region: string): Promise<Col[]> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/region/${region}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des cols de la région ${region}:`, error);
      throw error;
    }
  }
  
  // Obtenir les cols par niveau de difficulté
  async getColsByDifficulty(difficulty: string): Promise<Col[]> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/difficulty/${difficulty}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des cols de difficulté ${difficulty}:`, error);
      throw error;
    }
  }
  
  // Créer un nouveau défi "7 Majeurs"
  async createChallenge(challenge: Omit<Challenge, 'id' | 'createdAt'>): Promise<Challenge> {
    try {
      const response = await axios.post(`/api/challenges`, challenge);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du défi:', error);
      throw error;
    }
  }
  
  // Obtenir tous les défis publics
  async getPublicChallenges(): Promise<Challenge[]> {
    try {
      const response = await axios.get(`/api/challenges/public`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des défis publics:', error);
      throw error;
    }
  }
  
  // Obtenir les défis d'un utilisateur
  async getUserChallenges(userId: string): Promise<Challenge[]> {
    try {
      const response = await axios.get(`/api/users/${userId}/challenges`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des défis de l'utilisateur ${userId}:`, error);
      throw error;
    }
  }
  
  // Obtenir un défi par son ID
  async getChallengeById(id: string): Promise<Challenge> {
    try {
      const response = await axios.get(`/api/challenges/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du défi ${id}:`, error);
      throw error;
    }
  }
  
  // Mettre à jour un défi existant
  async updateChallenge(id: string, challenge: Partial<Challenge>): Promise<Challenge> {
    try {
      const response = await axios.put(`/api/challenges/${id}`, challenge);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du défi ${id}:`, error);
      throw error;
    }
  }
  
  // Supprimer un défi
  async deleteChallenge(id: string): Promise<void> {
    try {
      await axios.delete(`/api/challenges/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression du défi ${id}:`, error);
      throw error;
    }
  }
  
  // Générer un parcours au format GPX pour un défi
  async generateGpxForChallenge(challengeId: string): Promise<string> {
    try {
      const response = await axios.get(`/api/challenges/${challengeId}/gpx`, {
        responseType: 'blob'
      });
      
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error(`Erreur lors de la génération du GPX pour le défi ${challengeId}:`, error);
      throw error;
    }
  }
  
  // Calculer les statistiques d'un défi à partir des cols sélectionnés
  calculateChallengeStats(cols: Col[]): Pick<Challenge, 'totalElevation' | 'totalDistance' | 'difficulty'> {
    if (!cols.length) {
      return {
        totalElevation: 0,
        totalDistance: 0,
        difficulty: 0
      };
    }
    
    // Calculer l'élévation totale (somme des dénivelés des cols)
    const totalElevation = cols.reduce((sum, col) => sum + col.elevation, 0);
    
    // Calculer la distance totale (somme des longueurs des cols)
    const totalDistance = cols.reduce((sum, col) => sum + col.length, 0);
    
    // Calculer un score de difficulté basé sur la pente moyenne, la longueur et l'élévation
    const difficulty = cols.reduce((sum, col) => {
      const colDifficulty = (col.avgGradient * 10) + (col.length / 5) + (col.elevation / 100);
      return sum + colDifficulty;
    }, 0) / cols.length;
    
    return {
      totalElevation,
      totalDistance,
      difficulty: Math.round(difficulty * 10) / 10 // Arrondi à une décimale
    };
  }
}
