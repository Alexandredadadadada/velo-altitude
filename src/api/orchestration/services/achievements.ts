import axios from 'axios';
import { Achievement, Badge, Certification, UserRanking } from '../../../types';

/**
 * Service qui gère les certifications, badges et classements pour les défis
 * Seven Majors et autres accomplissements cyclistes
 */
export class AchievementsService {
  private apiBaseUrl: string;
  
  constructor() {
    this.apiBaseUrl = '/api/achievements';
  }
  
  // ========== CERTIFICATIONS ==========
  
  /**
   * Soumettre une preuve de réalisation d'un défi
   * @param challengeId ID du défi
   * @param userId ID de l'utilisateur
   * @param proofData Données de preuve (Strava, fichier GPX, photos)
   */
  async submitChallengeCertification(
    challengeId: string, 
    userId: string, 
    proofData: {
      stravaActivityId?: string;
      gpxFile?: File;
      photoUrls?: string[];
      completionDate: string;
      description?: string;
    }
  ): Promise<Certification> {
    try {
      const formData = new FormData();
      formData.append('challengeId', challengeId);
      formData.append('userId', userId);
      formData.append('completionDate', proofData.completionDate);
      
      if (proofData.stravaActivityId) {
        formData.append('stravaActivityId', proofData.stravaActivityId);
      }
      
      if (proofData.gpxFile) {
        formData.append('gpxFile', proofData.gpxFile);
      }
      
      if (proofData.photoUrls) {
        formData.append('photoUrls', JSON.stringify(proofData.photoUrls));
      }
      
      if (proofData.description) {
        formData.append('description', proofData.description);
      }
      
      const response = await axios.post(`${this.apiBaseUrl}/certifications`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la soumission de la certification:', error);
      throw error;
    }
  }
  
  /**
   * Obtenir les certifications de l'utilisateur
   */
  async getUserCertifications(userId: string): Promise<Certification[]> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/users/${userId}/certifications`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des certifications:', error);
      throw error;
    }
  }
  
  /**
   * Obtenir les certifications d'un défi spécifique
   */
  async getChallengeCertifications(challengeId: string): Promise<Certification[]> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/challenges/${challengeId}/certifications`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des certifications du défi:', error);
      throw error;
    }
  }
  
  /**
   * Récupère une certification par son ID
   */
  async getCertificationById(certificationId: string): Promise<Certification> {
    // En production, ceci ferait un appel à l'API backend
    const response = await axios.get(`${this.apiBaseUrl}/certifications/${certificationId}`);
    return response.data;
  }
  
  // ========== BADGES ==========
  
  /**
   * Obtenir tous les badges d'un utilisateur
   */
  async getUserBadges(userId: string): Promise<Badge[]> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/users/${userId}/badges`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des badges:', error);
      throw error;
    }
  }
  
  /**
   * Obtenir les badges disponibles pour un défi
   */
  async getChallengeBadges(challengeId: string): Promise<Badge[]> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/challenges/${challengeId}/badges`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des badges du défi:', error);
      throw error;
    }
  }
  
  // ========== CLASSEMENTS ==========
  
  /**
   * Obtenir le classement global des utilisateurs pour un défi
   */
  async getChallengeRankings(
    challengeId: string,
    options: {
      limit?: number;
      offset?: number;
      sortBy?: 'time' | 'date' | 'kudos';
    } = {}
  ): Promise<UserRanking[]> {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/challenges/${challengeId}/rankings`, {
        params: options
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des classements:', error);
      throw error;
    }
  }
  
  /**
   * Obtenir la position de l'utilisateur dans le classement d'un défi
   */
  async getUserRankingForChallenge(userId: string, challengeId: string): Promise<UserRanking> {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/users/${userId}/challenges/${challengeId}/ranking`
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du classement utilisateur:', error);
      throw error;
    }
  }
  
  // ========== PARTAGE SOCIAL ==========
  
  /**
   * Générer une image de partage pour un accomplissement
   */
  async generateSharingImage(
    certificationId: string,
    options: {
      template?: 'standard' | 'detailed' | 'minimal';
      includeMap?: boolean;
      includeElevation?: boolean;
      includeStats?: boolean;
    } = {}
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${this.apiBaseUrl}/certifications/${certificationId}/share-image`,
        options,
        { responseType: 'blob' }
      );
      
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Erreur lors de la génération de l\'image de partage:', error);
      throw error;
    }
  }
  
  /**
   * Partager un accomplissement sur les réseaux sociaux
   */
  async shareAchievement(
    certificationId: string,
    platform: 'twitter' | 'facebook' | 'instagram' | 'strava',
    message?: string
  ): Promise<{ success: boolean; url: string }> {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/certifications/${certificationId}/share`, {
        platform,
        message
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors du partage de l\'accomplissement:', error);
      throw error;
    }
  }
}
