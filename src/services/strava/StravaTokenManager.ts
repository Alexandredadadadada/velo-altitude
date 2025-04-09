/**
 * Gestionnaire de tokens Strava
 * 
 * Responsable de:
 * - Stockage sécurisé des tokens d'accès et de rafraîchissement
 * - Rafraîchissement automatique des tokens expirés
 * - Révocation des tokens lors de la déconnexion
 * - Gestion du flux d'authentification OAuth
 */

import axios from 'axios';
import { TokenResponse, StravaTokens, TokenManagerConfig } from './types';
import { cacheService } from '../cache';
import { monitoringService } from '../monitoring';

// Configuration par défaut
const DEFAULT_CONFIG: TokenManagerConfig = {
  storageType: 'database',
  refreshBuffer: 300, // 5 minutes avant expiration
};

export class StravaTokenManager {
  private config: TokenManagerConfig;
  private clientId: string;
  private clientSecret: string;
  
  /**
   * Constructeur
   * @param clientId ID client Strava
   * @param clientSecret Secret client Strava
   * @param config Configuration optionnelle
   */
  constructor(
    clientId: string,
    clientSecret: string,
    config: Partial<TokenManagerConfig> = {}
  ) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (!this.clientId || !this.clientSecret) {
      console.error('StravaTokenManager: Client ID ou Client Secret manquant');
      throw new Error('Configuration Strava incomplète');
    }
    
    console.info(`StravaTokenManager: Initialisé avec stockage ${this.config.storageType}`);
  }
  
  /**
   * Récupère les tokens d'un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Tokens ou null si non trouvés
   */
  async getTokens(userId: string): Promise<StravaTokens | null> {
    try {
      // Récupérer les tokens depuis le cache si possible
      const cacheKey = `strava:tokens:${userId}`;
      const cachedTokens = await cacheService.get<StravaTokens>(cacheKey, {
        segment: 'auth',
      });
      
      if (cachedTokens.hit && cachedTokens.value) {
        return cachedTokens.value;
      }
      
      // Sinon, récupérer depuis le stockage principal
      let tokens: StravaTokens | null = null;
      
      switch (this.config.storageType) {
        case 'database':
          tokens = await this.getTokensFromDatabase(userId);
          break;
        case 'redis':
          tokens = await this.getTokensFromRedis(userId);
          break;
        case 'memory':
          tokens = await this.getTokensFromMemory(userId);
          break;
      }
      
      // Mettre en cache si trouvé
      if (tokens) {
        const ttl = Math.max(0, tokens.expiresAt - Date.now() / 1000 - 60);
        await cacheService.set(cacheKey, tokens, {
          segment: 'auth',
          ttl: Math.floor(ttl),
        });
      }
      
      return tokens;
    } catch (error) {
      console.error(`StravaTokenManager: Erreur lors de la récupération des tokens pour ${userId}`, error);
      monitoringService.trackError('strava_token_get_error', error as Error, { userId });
      return null;
    }
  }
  
  /**
   * Stocke les tokens d'un utilisateur
   * @param userId ID de l'utilisateur
   * @param tokens Tokens à stocker
   */
  async saveTokens(userId: string, tokens: StravaTokens): Promise<void> {
    try {
      // Stocker dans le stockage principal
      switch (this.config.storageType) {
        case 'database':
          await this.saveTokensToDatabase(userId, tokens);
          break;
        case 'redis':
          await this.saveTokensToRedis(userId, tokens);
          break;
        case 'memory':
          await this.saveTokensToMemory(userId, tokens);
          break;
      }
      
      // Mettre à jour le cache
      const cacheKey = `strava:tokens:${userId}`;
      const ttl = Math.max(0, tokens.expiresAt - Date.now() / 1000 - 60);
      await cacheService.set(cacheKey, tokens, {
        segment: 'auth',
        ttl: Math.floor(ttl),
      });
      
      console.info(`StravaTokenManager: Tokens sauvegardés pour ${userId}, expiration dans ${ttl}s`);
    } catch (error) {
      console.error(`StravaTokenManager: Erreur lors de la sauvegarde des tokens pour ${userId}`, error);
      monitoringService.trackError('strava_token_save_error', error as Error, { userId });
    }
  }
  
  /**
   * Supprime les tokens d'un utilisateur
   * @param userId ID de l'utilisateur
   */
  async deleteTokens(userId: string): Promise<void> {
    try {
      // Supprimer du stockage principal
      switch (this.config.storageType) {
        case 'database':
          await this.deleteTokensFromDatabase(userId);
          break;
        case 'redis':
          await this.deleteTokensFromRedis(userId);
          break;
        case 'memory':
          await this.deleteTokensFromMemory(userId);
          break;
      }
      
      // Invalider le cache
      const cacheKey = `strava:tokens:${userId}`;
      await cacheService.invalidate(cacheKey, 'auth');
      
      console.info(`StravaTokenManager: Tokens supprimés pour ${userId}`);
    } catch (error) {
      console.error(`StravaTokenManager: Erreur lors de la suppression des tokens pour ${userId}`, error);
      monitoringService.trackError('strava_token_delete_error', error as Error, { userId });
    }
  }
  
  /**
   * Vérifie si les tokens sont valides et les rafraîchit si nécessaire
   * @param userId ID de l'utilisateur
   * @returns Tokens valides ou null en cas d'erreur
   */
  async getValidTokens(userId: string): Promise<StravaTokens | null> {
    try {
      const tokens = await this.getTokens(userId);
      
      if (!tokens) {
        console.warn(`StravaTokenManager: Aucun token trouvé pour ${userId}`);
        return null;
      }
      
      // Vérifier si le token a besoin d'être rafraîchi
      const now = Math.floor(Date.now() / 1000);
      if (tokens.expiresAt - now <= this.config.refreshBuffer) {
        console.info(`StravaTokenManager: Rafraîchissement du token pour ${userId} (expire dans ${tokens.expiresAt - now}s)`);
        
        // Rafraîchir le token
        return await this.refreshTokens(userId, tokens);
      }
      
      return tokens;
    } catch (error) {
      console.error(`StravaTokenManager: Erreur lors de la validation des tokens pour ${userId}`, error);
      monitoringService.trackError('strava_token_validation_error', error as Error, { userId });
      return null;
    }
  }
  
  /**
   * Rafraîchit les tokens expirés
   * @param userId ID de l'utilisateur
   * @param tokens Tokens actuels
   * @returns Nouveaux tokens ou null en cas d'erreur
   */
  async refreshTokens(userId: string, tokens: StravaTokens): Promise<StravaTokens | null> {
    try {
      // Appeler l'API Strava pour rafraîchir le token
      const response = await axios.post<TokenResponse>(
        'https://www.strava.com/oauth/token',
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: tokens.refreshToken,
        }
      );
      
      // Créer les nouveaux tokens
      const newTokens: StravaTokens = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: response.data.expires_at,
      };
      
      // Sauvegarder les nouveaux tokens
      await this.saveTokens(userId, newTokens);
      
      monitoringService.trackEvent('strava_token_refreshed', {
        userId,
        expiresIn: response.data.expires_in,
      });
      
      return newTokens;
    } catch (error) {
      console.error(`StravaTokenManager: Erreur lors du rafraîchissement des tokens pour ${userId}`, error);
      monitoringService.trackError('strava_token_refresh_error', error as Error, { userId });
      
      // Si l'erreur indique un token de rafraîchissement invalide, supprimer les tokens
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        await this.deleteTokens(userId);
      }
      
      return null;
    }
  }
  
  /**
   * Traite le code d'autorisation après l'authentification OAuth
   * @param code Code d'autorisation
   * @param userId ID de l'utilisateur
   * @returns Tokens ou null en cas d'erreur
   */
  async handleAuthorizationCode(code: string, userId: string): Promise<StravaTokens | null> {
    try {
      // Échanger le code contre des tokens
      const response = await axios.post<TokenResponse>(
        'https://www.strava.com/oauth/token',
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
        }
      );
      
      // Créer les tokens
      const tokens: StravaTokens = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: response.data.expires_at,
      };
      
      // Sauvegarder les tokens
      await this.saveTokens(userId, tokens);
      
      monitoringService.trackEvent('strava_user_authorized', {
        userId,
        stravaAthleteId: response.data.athlete?.id,
      });
      
      return tokens;
    } catch (error) {
      console.error(`StravaTokenManager: Erreur lors de l'échange du code d'autorisation pour ${userId}`, error);
      monitoringService.trackError('strava_authorization_error', error as Error, { userId });
      return null;
    }
  }
  
  /**
   * Révoque l'accès Strava d'un utilisateur
   * @param userId ID de l'utilisateur
   * @returns true si succès, false sinon
   */
  async revokeAccess(userId: string): Promise<boolean> {
    try {
      const tokens = await this.getTokens(userId);
      
      if (!tokens) {
        return true; // Aucun token à révoquer
      }
      
      // Révoquer le token d'accès via l'API Strava
      await axios.post(
        'https://www.strava.com/oauth/deauthorize',
        {
          access_token: tokens.accessToken,
        }
      );
      
      // Supprimer les tokens locaux
      await this.deleteTokens(userId);
      
      monitoringService.trackEvent('strava_access_revoked', { userId });
      
      return true;
    } catch (error) {
      console.error(`StravaTokenManager: Erreur lors de la révocation de l'accès pour ${userId}`, error);
      monitoringService.trackError('strava_revoke_error', error as Error, { userId });
      
      // Supprimer quand même les tokens locaux en cas d'erreur
      try {
        await this.deleteTokens(userId);
      } catch (deleteError) {
        // Ignorer les erreurs de suppression
      }
      
      return false;
    }
  }
  
  /**
   * Vérifie si un utilisateur est connecté à Strava
   * @param userId ID de l'utilisateur
   * @returns true si connecté, false sinon
   */
  async isConnected(userId: string): Promise<boolean> {
    const tokens = await this.getTokens(userId);
    return tokens !== null;
  }
  
  /**
   * Crée une URL d'autorisation pour l'authentification OAuth
   * @param redirectUri URI de redirection après autorisation
   * @param scope Portée d'autorisation
   * @param state État pour la validation CSRF
   * @returns URL d'autorisation
   */
  createAuthorizationUrl(
    redirectUri: string,
    scope: string[] = ['read', 'activity:read_all'],
    state?: string
  ): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      approval_prompt: 'auto',
      scope: scope.join(','),
    });
    
    if (state) {
      params.append('state', state);
    }
    
    return `https://www.strava.com/oauth/authorize?${params.toString()}`;
  }
  
  // Méthodes d'accès au stockage
  // Ces méthodes devraient être remplacées par des implémentations réelles
  
  private async getTokensFromDatabase(userId: string): Promise<StravaTokens | null> {
    try {
      // TODO: Implémenter l'accès à la base de données
      // Exemple avec MongoDB:
      // const doc = await db.collection('stravaTokens').findOne({ userId });
      // return doc ? { accessToken: doc.accessToken, refreshToken: doc.refreshToken, expiresAt: doc.expiresAt } : null;
      
      // Pour l'instant, utiliser le stockage mémoire
      return this.getTokensFromMemory(userId);
    } catch (error) {
      console.error(`Erreur lors de la récupération des tokens depuis la base de données pour ${userId}`, error);
      return null;
    }
  }
  
  private async saveTokensToDatabase(userId: string, tokens: StravaTokens): Promise<void> {
    try {
      // TODO: Implémenter l'accès à la base de données
      // Exemple avec MongoDB:
      // await db.collection('stravaTokens').updateOne(
      //   { userId },
      //   { $set: { ...tokens, updatedAt: new Date() } },
      //   { upsert: true }
      // );
      
      // Pour l'instant, utiliser le stockage mémoire
      await this.saveTokensToMemory(userId, tokens);
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde des tokens dans la base de données pour ${userId}`, error);
      throw error;
    }
  }
  
  private async deleteTokensFromDatabase(userId: string): Promise<void> {
    try {
      // TODO: Implémenter l'accès à la base de données
      // Exemple avec MongoDB:
      // await db.collection('stravaTokens').deleteOne({ userId });
      
      // Pour l'instant, utiliser le stockage mémoire
      await this.deleteTokensFromMemory(userId);
    } catch (error) {
      console.error(`Erreur lors de la suppression des tokens de la base de données pour ${userId}`, error);
      throw error;
    }
  }
  
  private async getTokensFromRedis(userId: string): Promise<StravaTokens | null> {
    try {
      // TODO: Implémenter l'accès à Redis
      // Exemple avec Redis:
      // const json = await redis.get(`strava:tokens:${userId}`);
      // return json ? JSON.parse(json) : null;
      
      // Pour l'instant, utiliser le stockage mémoire
      return this.getTokensFromMemory(userId);
    } catch (error) {
      console.error(`Erreur lors de la récupération des tokens depuis Redis pour ${userId}`, error);
      return null;
    }
  }
  
  private async saveTokensToRedis(userId: string, tokens: StravaTokens): Promise<void> {
    try {
      // TODO: Implémenter l'accès à Redis
      // Exemple avec Redis:
      // const ttl = Math.max(0, tokens.expiresAt - Math.floor(Date.now() / 1000));
      // await redis.set(`strava:tokens:${userId}`, JSON.stringify(tokens), 'EX', ttl);
      
      // Pour l'instant, utiliser le stockage mémoire
      await this.saveTokensToMemory(userId, tokens);
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde des tokens dans Redis pour ${userId}`, error);
      throw error;
    }
  }
  
  private async deleteTokensFromRedis(userId: string): Promise<void> {
    try {
      // TODO: Implémenter l'accès à Redis
      // Exemple avec Redis:
      // await redis.del(`strava:tokens:${userId}`);
      
      // Pour l'instant, utiliser le stockage mémoire
      await this.deleteTokensFromMemory(userId);
    } catch (error) {
      console.error(`Erreur lors de la suppression des tokens de Redis pour ${userId}`, error);
      throw error;
    }
  }
  
  // Stockage mémoire temporaire (pour le développement uniquement)
  private memoryStorage: Map<string, StravaTokens> = new Map();
  
  private async getTokensFromMemory(userId: string): Promise<StravaTokens | null> {
    return this.memoryStorage.get(userId) || null;
  }
  
  private async saveTokensToMemory(userId: string, tokens: StravaTokens): Promise<void> {
    this.memoryStorage.set(userId, tokens);
  }
  
  private async deleteTokensFromMemory(userId: string): Promise<void> {
    this.memoryStorage.delete(userId);
  }
}

// Créer une instance par défaut
const tokenManager = new StravaTokenManager(
  process.env.STRAVA_CLIENT_ID || '',
  process.env.STRAVA_CLIENT_SECRET || '',
  {
    storageType: (process.env.NODE_ENV === 'production') ? 'database' : 'memory',
    refreshBuffer: 300, // 5 minutes
  }
);

export default tokenManager;
