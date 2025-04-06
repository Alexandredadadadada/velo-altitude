import { ColsService } from './services/cols';
import { AchievementsService } from './services/achievements';
import { WeatherService } from './services/weather';
import { MapboxService } from './services/mapbox';
import { WindyService, WindyPluginOptions } from './services/windy';
import { SocialService, SocialPlatform } from './services/social';
import { User, Col, Challenge, Certification, Badge, UserRanking, Achievement } from '../../types';

/**
 * Orchestrateur API qui centralise l'accès à tous les services
 * de l'application Velo-Altitude.
 */
export class APIOrchestrator {
  private colsService: ColsService;
  private achievementsService: AchievementsService;
  private weatherService: WeatherService;
  private mapboxService: MapboxService;
  private windyService: WindyService;
  private socialService: SocialService;
  
  constructor() {
    this.colsService = new ColsService();
    this.achievementsService = new AchievementsService();
    this.weatherService = new WeatherService();
    this.mapboxService = new MapboxService();
    this.windyService = new WindyService();
    this.socialService = new SocialService();
  }
  
  // ===== COLS ET DÉFIS =====
  
  /**
   * Récupère tous les cols disponibles
   */
  async getAllCols(): Promise<Col[]> {
    return this.colsService.getAllCols();
  }
  
  /**
   * Recherche des cols par nom, région ou pays
   */
  async searchCols(query: string): Promise<Col[]> {
    return this.colsService.searchCols(query);
  }
  
  /**
   * Récupère un col par son ID
   */
  async getColById(id: string): Promise<Col> {
    return this.colsService.getColById(id);
  }
  
  /**
   * Récupère les cols d'une région spécifique
   */
  async getColsByRegion(region: string): Promise<Col[]> {
    return this.colsService.getColsByRegion(region);
  }
  
  /**
   * Récupère les cols par niveau de difficulté
   */
  async getColsByDifficulty(difficulty: string): Promise<Col[]> {
    return this.colsService.getColsByDifficulty(difficulty);
  }
  
  // ===== DÉFIS "7 MAJEURS" =====
  
  /**
   * Crée un nouveau défi "7 Majeurs"
   */
  async createChallenge(
    userId: string, 
    name: string, 
    description: string, 
    colIds: string[], 
    isPublic: boolean
  ): Promise<Challenge> {
    // Récupération des cols à partir de leurs IDs
    const cols: Col[] = await Promise.all(
      colIds.map(id => this.colsService.getColById(id))
    );
    
    // Calcul des statistiques du défi
    const stats = this.colsService.calculateChallengeStats(cols);
    
    // Création du défi
    const challenge: any = {
      name,
      description,
      createdBy: userId,
      isPublic,
      cols: colIds, // On stocke les IDs des cols
      totalElevation: stats.totalElevation,
      totalDistance: stats.totalDistance,
      difficulty: stats.difficulty,
      createdAt: new Date().toISOString()
    };
    
    return this.colsService.createChallenge(challenge);
  }
  
  /**
   * Récupère tous les défis publics
   */
  async getPublicChallenges(): Promise<Challenge[]> {
    return this.colsService.getPublicChallenges();
  }
  
  /**
   * Récupère les défis d'un utilisateur
   */
  async getUserChallenges(userId: string): Promise<Challenge[]> {
    return this.colsService.getUserChallenges(userId);
  }
  
  /**
   * Récupère un défi par son ID
   */
  async getChallengeById(id: string): Promise<Challenge> {
    return this.colsService.getChallengeById(id);
  }
  
  /**
   * Met à jour un défi existant
   */
  async updateChallenge(
    id: string, 
    challengeData: Partial<Challenge>
  ): Promise<Challenge> {
    return this.colsService.updateChallenge(id, challengeData);
  }
  
  /**
   * Supprime un défi
   */
  async deleteChallenge(id: string): Promise<void> {
    return this.colsService.deleteChallenge(id);
  }
  
  /**
   * Génère un fichier GPX pour un défi
   */
  async generateGpxForChallenge(challengeId: string): Promise<string> {
    return this.colsService.generateGpxForChallenge(challengeId);
  }
  
  // ===== CERTIFICATIONS ET BADGES =====
  
  /**
   * Soumet une preuve de réalisation d'un défi
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
    return this.achievementsService.submitChallengeCertification(
      challengeId,
      userId,
      proofData
    );
  }
  
  /**
   * Récupère les certifications d'un utilisateur
   */
  async getUserCertifications(userId: string): Promise<Certification[]> {
    return this.achievementsService.getUserCertifications(userId);
  }
  
  /**
   * Récupère les certifications d'un défi spécifique
   */
  async getChallengeCertifications(challengeId: string): Promise<Certification[]> {
    return this.achievementsService.getChallengeCertifications(challengeId);
  }
  
  /**
   * Récupère tous les badges d'un utilisateur
   */
  async getUserBadges(userId: string): Promise<Badge[]> {
    return this.achievementsService.getUserBadges(userId);
  }
  
  /**
   * Récupère les badges disponibles pour un défi
   */
  async getChallengeBadges(challengeId: string): Promise<Badge[]> {
    return this.achievementsService.getChallengeBadges(challengeId);
  }
  
  // ===== CLASSEMENTS =====
  
  /**
   * Récupère le classement global des utilisateurs pour un défi
   */
  async getChallengeRankings(
    challengeId: string,
    options: {
      limit?: number;
      offset?: number;
      sortBy?: 'time' | 'date' | 'kudos';
    } = {}
  ): Promise<UserRanking[]> {
    return this.achievementsService.getChallengeRankings(challengeId, options);
  }
  
  /**
   * Récupère la position de l'utilisateur dans le classement d'un défi
   */
  async getUserRankingForChallenge(
    userId: string,
    challengeId: string
  ): Promise<UserRanking> {
    return this.achievementsService.getUserRankingForChallenge(userId, challengeId);
  }
  
  // ===== PARTAGE SOCIAL =====
  
  /**
   * Génère une image de partage pour un accomplissement
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
    return this.achievementsService.generateSharingImage(certificationId, options);
  }
  
  /**
   * Partage un accomplissement sur les réseaux sociaux
   */
  async shareAchievement(
    certificationId: string,
    platform: SocialPlatform,
    message?: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    // Récupérer la certification complète
    const certification = await this.achievementsService.getCertificationById(certificationId);
    
    // Récupérer l'image de partage
    const imageUrl = await this.generateSharingImage(certificationId, {
      includeMap: true,
      includeStats: true
    });
    
    // Partager via le service social
    return this.socialService.shareAchievement(
      certification,
      platform,
      {
        message,
        imageUrl,
        hashtags: ['VeloAltitude', 'Cyclisme', '7Majeurs']
      }
    );
  }
  
  /**
   * Partage un défi sur les réseaux sociaux
   */
  async shareChallenge(
    challengeId: string,
    platform: SocialPlatform,
    message?: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    // Récupérer le défi complet
    const challenge: any = await this.colsService.getChallengeById(challengeId);
    
    // Générer l'URL de l'image statique pour la carte du défi
    const colIds: string[] = challenge.cols;
    const cols = await Promise.all(colIds.map(id => this.colsService.getColById(id)));
    const coordinates = cols.map(col => col.coordinates);
    const imageUrl = this.mapboxService.getStaticMapImageUrl(coordinates);
    
    // Partager via le service social
    return this.socialService.shareChallenge(
      challenge,
      platform,
      {
        message,
        imageUrl,
        hashtags: ['VeloAltitude', '7Majeurs', 'CyclismeDefi']
      }
    );
  }
  
  /**
   * Vérifie quelles plateformes sociales sont configurées et disponibles
   */
  getPlatformsAvailable(): SocialPlatform[] {
    return this.socialService.getConfiguredPlatforms();
  }
  
  // ===== MÉTÉO AVANCÉE (WINDY) =====
  
  /**
   * Obtient l'URL d'intégration Windy pour la visualisation météo d'un col
   */
  async getWindyMapUrlForCol(
    colId: string,
    options: Partial<WindyPluginOptions> = {},
    width = 800,
    height = 600
  ): Promise<string> {
    const col = await this.colsService.getColById(colId);
    return this.windyService.getWindyMapUrl(col.coordinates, options, width, height);
  }
  
  /**
   * Génère un code d'intégration iframe Windy pour un col
   */
  async getWindyEmbedCodeForCol(
    colId: string,
    options: Partial<WindyPluginOptions> = {},
    width = 800,
    height = 600
  ): Promise<string> {
    return this.colsService.getColById(colId).then(col => {
      return this.windyService.getWindyEmbedCode(col.coordinates, options, width, height);
    });
  }
  
  /**
   * Génère une URL Windy pour visualiser un défi "7 Majeurs" complet
   */
  async getWindyRouteMapUrlForChallenge(
    challengeId: string,
    options: Partial<WindyPluginOptions> = {},
    width = 800,
    height = 600
  ): Promise<string> {
    const challenge: any = await this.colsService.getChallengeById(challengeId);
    const colIds: string[] = challenge.cols;
    const cols = await Promise.all(colIds.map(id => this.colsService.getColById(id)));
    const coordinates = cols.map(col => col.coordinates);
    return this.windyService.getWindyRouteMapUrl(coordinates, options, width, height);
  }
  
  /**
   * Récupère les données météo pour un col spécifique
   */
  async getWeatherDataForCol(colId: string) {
    const col = await this.colsService.getColById(colId);
    return this.windyService.getForecastData(col.coordinates);
  }
  
  /**
   * Calcule la direction et la vitesse du vent à partir des composantes vectorielles
   */
  getWindVectorFromComponents(windSpeed: number, windDeg: number) {
    return this.windyService.calculateWindVector(windSpeed, windDeg);
  }
  
  /**
   * Génère un code couleur pour la vitesse du vent (utile pour les visualisations)
   */
  getWindColorCode(windSpeed: number) {
    return this.windyService.getWindColorCode(windSpeed);
  }
}
