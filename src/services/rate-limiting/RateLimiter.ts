/**
 * Service de gestion des limites d'API
 * Permet de suivre les quotas d'API et de gérer les délais entre les requêtes
 */
export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private retryAfter: number;
  private requests: Map<string, RequestInfo[]>;

  constructor(options: RateLimiterOptions = {}) {
    this.windowMs = options.windowMs || 60000; // Fenêtre de 1 minute par défaut
    this.maxRequests = options.maxRequests || 40; // 40 requêtes par fenêtre par défaut
    this.retryAfter = options.retryAfter || 2000; // 2 secondes d'attente par défaut
    this.requests = new Map();
  }

  /**
   * Vérifie si l'utilisateur a atteint sa limite de requêtes
   * @param userId Identifiant de l'utilisateur
   */
  async checkLimit(userId: string = 'anonymous'): Promise<void> {
    const rateLimitInfo = await this.getRateLimitInfo(userId);
    
    // Si l'utilisateur a atteint sa limite, attendre
    if (rateLimitInfo.remaining <= 0) {
      const waitTime = rateLimitInfo.resetTime - Date.now();
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime + this.retryAfter));
      }
    }
    
    // Enregistrer la requête
    this.trackRequest(userId);
  }

  /**
   * Récupère les informations de limite d'API pour un utilisateur
   * @param userId Identifiant de l'utilisateur
   */
  async getRateLimitInfo(userId: string = 'anonymous'): Promise<RateLimitInfo> {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Nettoyer les anciennes requêtes
    const validRequests = userRequests.filter(req => 
      now - req.timestamp < this.windowMs
    );
    
    // Mettre à jour la liste des requêtes
    this.requests.set(userId, validRequests);
    
    // Calculer le temps restant avant réinitialisation
    const oldestRequest = validRequests[0];
    const resetTime = oldestRequest 
      ? oldestRequest.timestamp + this.windowMs
      : now;
    
    return {
      limit: this.maxRequests,
      remaining: this.maxRequests - validRequests.length,
      resetTime: resetTime
    };
  }

  /**
   * Enregistre une requête pour un utilisateur
   * @param userId Identifiant de l'utilisateur
   */
  private trackRequest(userId: string): void {
    const userRequests = this.requests.get(userId) || [];
    userRequests.push({
      timestamp: Date.now()
    });
    this.requests.set(userId, userRequests);
  }
}

interface RequestInfo {
  timestamp: number;
}

export interface RateLimitInfo {
  limit: number;      // Nombre maximum de requêtes par fenêtre
  remaining: number;  // Nombre de requêtes restantes
  resetTime: number;  // Horodatage de réinitialisation
}

export interface RateLimiterOptions {
  windowMs?: number;    // Durée de la fenêtre en millisecondes
  maxRequests?: number; // Nombre maximum de requêtes par fenêtre
  retryAfter?: number;  // Délai d'attente après limite atteinte
}
