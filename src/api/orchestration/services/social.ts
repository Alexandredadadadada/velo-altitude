import axios from 'axios';
import { Certification, Challenge } from '../../../types';

export type SocialPlatform = 'twitter' | 'facebook' | 'instagram' | 'strava';

interface SharingOptions {
  message?: string;
  imageUrl?: string;
  hashtags?: string[];
  includeMap?: boolean;
  includeStats?: boolean;
}

/**
 * Service pour gérer les intégrations avec les APIs des réseaux sociaux
 * Permet le partage d'accomplissements, de défis et d'activités cyclistes.
 */
export class SocialService {
  // Clés API pour chaque plateforme
  private twitterApiKey: string;
  private facebookAppId: string;
  private instagramAccessToken: string;
  
  constructor() {
    this.twitterApiKey = process.env.TWITTER_API_KEY || '';
    this.facebookAppId = process.env.FACEBOOK_APP_ID || '';
    this.instagramAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN || '';
    
    if (!this.twitterApiKey) {
      console.warn('Twitter API key is not available');
    }
    
    if (!this.facebookAppId) {
      console.warn('Facebook App ID is not available');
    }
    
    if (!this.instagramAccessToken) {
      console.warn('Instagram Access Token is not available');
    }
  }
  
  /**
   * Partage un accomplissement sur les réseaux sociaux
   * @param certification - Certification à partager
   * @param platform - Plateforme sociale cible
   * @param options - Options de partage
   */
  async shareAchievement(
    certification: Certification,
    platform: SocialPlatform,
    options: SharingOptions = {}
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      switch (platform) {
        case 'twitter':
          return await this.shareToTwitter(certification, options);
        case 'facebook':
          return await this.shareToFacebook(certification, options);
        case 'instagram':
          return await this.shareToInstagram(certification, options);
        case 'strava':
          return await this.shareToStrava(certification, options);
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      console.error(`Error sharing to ${platform}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Partage un défi sur les réseaux sociaux
   * @param challenge - Défi à partager
   * @param platform - Plateforme sociale cible
   * @param options - Options de partage
   */
  async shareChallenge(
    challenge: Challenge,
    platform: SocialPlatform,
    options: SharingOptions = {}
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Construction d'un message spécifique aux défis
      const challengeOptions = {
        ...options,
        message: options.message || `J'ai créé un défi "7 Majeurs" : ${challenge.name}. Rejoignez-moi sur Velo-Altitude !`,
        hashtags: [...(options.hashtags || []), 'VeloAltitude', '7Majeurs', 'Cyclisme']
      };
      
      switch (platform) {
        case 'twitter':
          return await this.shareToTwitter(challenge, challengeOptions, 'challenge');
        case 'facebook':
          return await this.shareToFacebook(challenge, challengeOptions, 'challenge');
        case 'instagram':
          return await this.shareToInstagram(challenge, challengeOptions, 'challenge');
        case 'strava':
          // Strava n'est pas adapté au partage de défis
          return {
            success: false,
            error: 'Le partage de défis n\'est pas disponible sur Strava'
          };
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      console.error(`Error sharing to ${platform}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Partage sur Twitter
   * @private
   */
  private async shareToTwitter(
    content: Certification | Challenge,
    options: SharingOptions = {},
    contentType: 'certification' | 'challenge' = 'certification'
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    if (!this.twitterApiKey) {
      return {
        success: false,
        error: 'Twitter API key is not available'
      };
    }
    
    const defaultMessage = contentType === 'certification'
      ? `J'ai réussi le défi ${(content as Certification).challengeName} sur Velo-Altitude !`
      : `Découvrez mon défi "${(content as Challenge).name}" sur Velo-Altitude !`;
    
    const message = options.message || defaultMessage;
    const hashtags = options.hashtags || ['VeloAltitude', 'Cyclisme', 'Cols'];
    const hashtagsString = hashtags.map(tag => `#${tag}`).join(' ');
    
    // Utilisation de l'API Twitter v2
    try {
      const response = await axios.post(
        'https://api.twitter.com/2/tweets',
        {
          text: `${message} ${hashtagsString}`,
          ...(options.imageUrl && { media: { media_ids: [await this.uploadMediaToTwitter(options.imageUrl)] } })
        },
        {
          headers: {
            'Authorization': `Bearer ${this.twitterApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        url: `https://twitter.com/i/status/${response.data.data.id}`
      };
    } catch (error) {
      console.error('Twitter API error:', error);
      // Fallback: si l'API échoue, générer un lien de partage
      const encodedText = encodeURIComponent(`${message} ${hashtagsString}`);
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
      
      if (options.imageUrl) {
        console.warn('Image sharing via intent URL is not supported by Twitter');
      }
      
      return {
        success: true,
        url: shareUrl
      };
    }
  }
  
  /**
   * Upload de média sur Twitter (pour les images)
   * @private
   */
  private async uploadMediaToTwitter(imageUrl: string): Promise<string> {
    // Télécharger l'image d'abord
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(imageResponse.data, 'binary');
    
    // Upload vers Twitter
    const response = await axios.post(
      'https://upload.twitter.com/1.1/media/upload.json',
      buffer,
      {
        headers: {
          'Authorization': `Bearer ${this.twitterApiKey}`,
          'Content-Type': 'application/octet-stream'
        }
      }
    );
    
    return response.data.media_id_string;
  }
  
  /**
   * Partage sur Facebook
   * @private
   */
  private async shareToFacebook(
    content: Certification | Challenge,
    options: SharingOptions = {},
    contentType: 'certification' | 'challenge' = 'certification'
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    if (!this.facebookAppId) {
      // Fallback: générer un lien d'intention de partage si l'API n'est pas disponible
      const defaultMessage = contentType === 'certification'
        ? `J'ai réussi le défi ${(content as Certification).challengeName} sur Velo-Altitude !`
        : `Découvrez mon défi "${(content as Challenge).name}" sur Velo-Altitude !`;
      
      const message = options.message || defaultMessage;
      const encodedText = encodeURIComponent(message);
      
      // Génération d'une URL absolue pour l'application
      const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://velo-altitude.fr';
      const contentUrl = contentType === 'certification'
        ? `${appBaseUrl}/certifications/${(content as Certification).id}`
        : `${appBaseUrl}/challenges/${(content as Challenge).id}`;
      
      const encodedUrl = encodeURIComponent(contentUrl);
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
      
      return {
        success: true,
        url: shareUrl
      };
    }
    
    // Implémentation avec l'API Facebook non montrée ici car nécessite un serveur backend
    // pour une véritable intégration OAuth
    
    // Retourner le lien d'intention de partage comme solution temporaire
    return this.getFacebookShareUrl(content, options, contentType);
  }
  
  /**
   * Génère une URL de partage pour Facebook
   * @private
   */
  private getFacebookShareUrl(
    content: Certification | Challenge,
    options: SharingOptions = {},
    contentType: 'certification' | 'challenge' = 'certification'
  ): { success: boolean; url: string } {
    const defaultMessage = contentType === 'certification'
      ? `J'ai réussi le défi ${(content as Certification).challengeName} sur Velo-Altitude !`
      : `Découvrez mon défi "${(content as Challenge).name}" sur Velo-Altitude !`;
    
    const message = options.message || defaultMessage;
    const encodedText = encodeURIComponent(message);
    
    // Génération d'une URL absolue pour l'application
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://velo-altitude.fr';
    const contentUrl = contentType === 'certification'
      ? `${appBaseUrl}/certifications/${(content as Certification).id}`
      : `${appBaseUrl}/challenges/${(content as Challenge).id}`;
    
    const encodedUrl = encodeURIComponent(contentUrl);
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    
    return {
      success: true,
      url: shareUrl
    };
  }
  
  /**
   * Partage sur Instagram
   * @private
   */
  private async shareToInstagram(
    content: Certification | Challenge,
    options: SharingOptions = {},
    contentType: 'certification' | 'challenge' = 'certification'
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    // Note: Instagram n'a pas d'API de partage direct comme Twitter
    // L'approche est plutôt de générer une story ou un post via l'API Graph
    
    if (!this.instagramAccessToken) {
      return {
        success: false,
        error: 'Instagram direct sharing requires a mobile app integration. Please use the Instagram app to share this content.'
      };
    }
    
    // L'API complète n'est pas implémentée ici car elle nécessite une approbation
    // de Meta pour l'utilisation de l'API Graph Instagram
    
    return {
      success: false,
      error: 'Instagram API sharing is currently not implemented. Please use the Instagram app to share this content manually.'
    };
  }
  
  /**
   * Partage sur Strava (activités uniquement)
   * @private
   */
  private async shareToStrava(
    certification: Certification,
    options: SharingOptions = {}
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    // Strava n'a pas d'API de partage social
    // Le partage sur Strava se fait via la création d'une activité
    
    // Pour créer une activité, nous avons besoin du service Strava
    // mais nous manquons probablement le fichier GPX ou les données d'activité
    // C'est normalement géré par le StravaService
    
    return {
      success: false,
      error: 'Sharing to Strava is done by uploading an activity using the Strava service.'
    };
  }
  
  /**
   * Vérifie si une plateforme est configurée avec des clés API valides
   */
  isPlatformConfigured(platform: SocialPlatform): boolean {
    switch (platform) {
      case 'twitter':
        return !!this.twitterApiKey;
      case 'facebook':
        return !!this.facebookAppId;
      case 'instagram':
        return !!this.instagramAccessToken;
      case 'strava':
        return true; // La configuration Strava est gérée par le StravaService
      default:
        return false;
    }
  }
  
  /**
   * Récupère les plateformes configurées disponibles pour le partage
   */
  getConfiguredPlatforms(): SocialPlatform[] {
    const platforms: SocialPlatform[] = [];
    
    if (this.isPlatformConfigured('twitter')) {
      platforms.push('twitter');
    }
    
    if (this.isPlatformConfigured('facebook')) {
      platforms.push('facebook');
    }
    
    if (this.isPlatformConfigured('instagram')) {
      platforms.push('instagram');
    }
    
    // Strava est toujours disponible via le StravaService
    platforms.push('strava');
    
    return platforms;
  }
}
