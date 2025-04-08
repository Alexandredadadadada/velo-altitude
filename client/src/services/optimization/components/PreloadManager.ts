/**
 * Gestionnaire de préchargement pour les composants React
 * Permet de précharger des composants avant qu'ils ne soient nécessaires
 */

interface PreloadOptions {
  priority?: 'critical' | 'high' | 'normal' | 'low';
  timeout?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Classe pour gérer le préchargement des composants
 */
export class PreloadManager {
  private preloadQueue: Map<string, {
    importFn: () => Promise<any>;
    priority: string;
    status: 'pending' | 'loading' | 'loaded' | 'error';
  }>;
  
  private preloadTimeouts: Map<string, NodeJS.Timeout>;
  
  constructor() {
    this.preloadQueue = new Map();
    this.preloadTimeouts = new Map();
  }
  
  /**
   * Ajoute un composant à la file d'attente de préchargement
   * @param id Identifiant du composant
   * @param importFn Fonction d'importation
   * @param options Options de préchargement
   */
  public enqueue(id: string, importFn: () => Promise<any>, options: PreloadOptions = {}): void {
    const { priority = 'normal' } = options;
    
    // Si le composant est déjà dans la file d'attente, mettre à jour sa priorité
    if (this.preloadQueue.has(id)) {
      const item = this.preloadQueue.get(id)!;
      if (this.getPriorityValue(priority) > this.getPriorityValue(item.priority as any)) {
        item.priority = priority;
        this.preloadQueue.set(id, item);
      }
      return;
    }
    
    // Ajouter le composant à la file d'attente
    this.preloadQueue.set(id, {
      importFn,
      priority,
      status: 'pending'
    });
    
    // Si la priorité est critique, précharger immédiatement
    if (priority === 'critical') {
      this.preload(id, options);
    }
  }
  
  /**
   * Précharge un composant
   * @param id Identifiant du composant
   * @param options Options de préchargement
   */
  public preload(id: string, options: PreloadOptions = {}): void {
    const { timeout = 10000, onSuccess, onError } = options;
    
    const item = this.preloadQueue.get(id);
    if (!item) {
      console.warn(`[PreloadManager] Component ${id} not found in preload queue`);
      return;
    }
    
    // Si le composant est déjà chargé ou en cours de chargement, ne rien faire
    if (item.status === 'loaded' || item.status === 'loading') {
      return;
    }
    
    // Mettre à jour le statut
    item.status = 'loading';
    this.preloadQueue.set(id, item);
    
    // Configurer un timeout
    const timeoutId = setTimeout(() => {
      console.warn(`[PreloadManager] Preload timeout for component ${id}`);
      this.preloadTimeouts.delete(id);
      
      // Mettre à jour le statut
      const currentItem = this.preloadQueue.get(id);
      if (currentItem && currentItem.status === 'loading') {
        currentItem.status = 'pending';
        this.preloadQueue.set(id, currentItem);
      }
    }, timeout);
    
    this.preloadTimeouts.set(id, timeoutId);
    
    // Précharger le composant
    item.importFn()
      .then(() => {
        // Annuler le timeout
        if (this.preloadTimeouts.has(id)) {
          clearTimeout(this.preloadTimeouts.get(id)!);
          this.preloadTimeouts.delete(id);
        }
        
        // Mettre à jour le statut
        const currentItem = this.preloadQueue.get(id);
        if (currentItem) {
          currentItem.status = 'loaded';
          this.preloadQueue.set(id, currentItem);
        }
        
        // Appeler le callback de succès
        if (onSuccess) {
          onSuccess();
        }
      })
      .catch((error) => {
        console.error(`[PreloadManager] Error preloading component ${id}:`, error);
        
        // Annuler le timeout
        if (this.preloadTimeouts.has(id)) {
          clearTimeout(this.preloadTimeouts.get(id)!);
          this.preloadTimeouts.delete(id);
        }
        
        // Mettre à jour le statut
        const currentItem = this.preloadQueue.get(id);
        if (currentItem) {
          currentItem.status = 'error';
          this.preloadQueue.set(id, currentItem);
        }
        
        // Appeler le callback d'erreur
        if (onError) {
          onError(error);
        }
      });
  }
  
  /**
   * Précharge tous les composants d'une priorité donnée
   * @param minPriority Priorité minimale à précharger
   */
  public preloadByPriority(minPriority: 'critical' | 'high' | 'normal' | 'low'): void {
    const minPriorityValue = this.getPriorityValue(minPriority);
    
    // Précharger tous les composants dont la priorité est supérieure ou égale à minPriority
    for (const [id, item] of this.preloadQueue.entries()) {
      const itemPriorityValue = this.getPriorityValue(item.priority as any);
      if (itemPriorityValue >= minPriorityValue && item.status === 'pending') {
        this.preload(id);
      }
    }
  }
  
  /**
   * Convertit une priorité en valeur numérique
   * @param priority Priorité
   * @returns Valeur numérique de la priorité
   */
  private getPriorityValue(priority: 'critical' | 'high' | 'normal' | 'low'): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }
  
  /**
   * Nettoie les ressources du gestionnaire
   */
  public cleanup(): void {
    // Annuler tous les timeouts
    for (const timeoutId of this.preloadTimeouts.values()) {
      clearTimeout(timeoutId);
    }
    
    // Vider les files d'attente
    this.preloadQueue.clear();
    this.preloadTimeouts.clear();
  }
}

export default PreloadManager;
