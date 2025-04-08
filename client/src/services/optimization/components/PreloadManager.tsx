import React, { useEffect } from 'react';

/**
 * Interface pour les options de préchargement
 */
export interface PreloadOptions {
  delay?: number;
  priority?: 'critical' | 'high' | 'normal' | 'low';
  signal?: AbortSignal;
}

/**
 * Gestionnaire de préchargement
 * Optimise le chargement anticipé des composants et des ressources
 */
export class PreloadManager {
  private preloadRegistry: Map<string, { 
    importFn: () => Promise<any>;
    status: 'pending' | 'loading' | 'loaded' | 'error';
    timestamp: number;
    priority: string;
  }>;
  private preloadQueue: Array<{ id: string; priority: number }>;
  private isProcessingQueue: boolean;
  
  private config = {
    concurrency: {
      critical: 5,
      high: 3,
      normal: 2,
      low: 1
    },
    delay: {
      critical: 0,
      high: 200,
      normal: 500,
      low: 1000
    },
    priorityValues: {
      critical: 100,
      high: 75,
      normal: 50,
      low: 25
    },
    timeout: 30000, // 30 secondes
    retryOnError: true,
    maxRetries: 2
  };

  /**
   * Crée une nouvelle instance du gestionnaire de préchargement
   */
  constructor(customConfig?: Partial<typeof PreloadManager.prototype.config>) {
    // Fusion de la configuration par défaut avec la configuration personnalisée
    if (customConfig) {
      this.config = this.mergeConfigs(this.config, customConfig);
    }
    
    this.preloadRegistry = new Map();
    this.preloadQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Précharge une ressource (composant, image, etc.)
   * @param id Identifiant unique de la ressource
   * @param importFn Fonction d'importation ou URL
   * @param options Options de préchargement
   */
  public preload(
    id: string,
    importFn: () => Promise<any>,
    options: PreloadOptions = {}
  ): void {
    // Vérifier si la ressource est déjà préchargée ou en cours de préchargement
    if (this.preloadRegistry.has(id)) {
      const existing = this.preloadRegistry.get(id)!;
      if (existing.status === 'loaded' || existing.status === 'loading') {
        return;
      }
    }
    
    // Déterminer la priorité
    const priority = options.priority || 'normal';
    
    // Ajouter à la registry
    this.preloadRegistry.set(id, {
      importFn,
      status: 'pending',
      timestamp: Date.now(),
      priority
    });
    
    // Ajouter à la file d'attente
    const priorityValue = this.config.priorityValues[priority as keyof typeof this.config.priorityValues] || this.config.priorityValues.normal;
    this.preloadQueue.push({ id, priority: priorityValue });
    
    // Trier la file d'attente par priorité (décroissante)
    this.preloadQueue.sort((a, b) => b.priority - a.priority);
    
    // Traiter la file d'attente
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  /**
   * Précharge une liste de ressources
   * @param items Liste des ressources à précharger
   * @param options Options de préchargement
   */
  public preloadBatch(
    items: Array<{ id: string; importFn: () => Promise<any>; priority?: string }>,
    options: PreloadOptions = {}
  ): void {
    items.forEach(item => {
      this.preload(item.id, item.importFn, { 
        ...options, 
        priority: (item.priority || options.priority) as PreloadOptions['priority']
      });
    });
  }

  /**
   * Précharge un URL (image, script, etc.)
   * @param url URL à précharger
   * @param type Type de ressource
   */
  public preloadURL(
    url: string,
    type: 'image' | 'stylesheet' | 'script' | 'font' | 'fetch' = 'image'
  ): Promise<any> {
    const id = `url:${url}`;
    
    // Créer une fonction d'importation adaptée au type
    let importFn: () => Promise<any>;
    
    switch (type) {
      case 'image':
        importFn = () => new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve({ type: 'image', url });
          img.onerror = reject;
          img.src = url;
        });
        break;
      case 'stylesheet':
        importFn = () => new Promise((resolve, reject) => {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = url;
          link.onload = () => resolve({ type: 'stylesheet', url });
          link.onerror = reject;
          document.head.appendChild(link);
        });
        break;
      case 'script':
        importFn = () => new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = url;
          script.async = true;
          script.onload = () => resolve({ type: 'script', url });
          script.onerror = reject;
          document.head.appendChild(script);
        });
        break;
      case 'font':
        importFn = () => new Promise((resolve, reject) => {
          const fontLoader = new FontFace('CustomFont', `url(${url})`);
          fontLoader.load()
            .then(font => {
              (document.fonts as any).add(font);
              resolve({ type: 'font', url });
            })
            .catch(reject);
        });
        break;
      case 'fetch':
      default:
        importFn = () => fetch(url).then(res => res.json());
        break;
    }
    
    // Précharger avec la fonction d'importation créée
    const promise = new Promise<any>((resolve, reject) => {
      this.preload(id, importFn, { priority: 'normal' });
      
      // Surveiller le statut de préchargement
      const checkStatus = () => {
        const resource = this.preloadRegistry.get(id);
        
        if (resource) {
          if (resource.status === 'loaded') {
            resolve({ status: 'loaded', id });
          } else if (resource.status === 'error') {
            reject(new Error(`Failed to preload ${url}`));
          } else {
            setTimeout(checkStatus, 100);
          }
        } else {
          reject(new Error(`Resource ${id} not found in registry`));
        }
      };
      
      checkStatus();
    });
    
    return promise;
  }

  /**
   * Vérifie si une ressource est déjà préchargée
   * @param id Identifiant de la ressource
   */
  public isPreloaded(id: string): boolean {
    const resource = this.preloadRegistry.get(id);
    return resource !== undefined && resource.status === 'loaded';
  }

  /**
   * Nettoie les ressources expirées ou en erreur
   */
  public cleanup(): void {
    const now = Date.now();
    const timeoutThreshold = now - this.config.timeout;
    
    for (const [id, resource] of this.preloadRegistry.entries()) {
      // Supprimer les ressources en erreur
      if (resource.status === 'error') {
        this.preloadRegistry.delete(id);
      }
      
      // Supprimer les ressources en attente trop anciennes
      if (resource.status === 'pending' && resource.timestamp < timeoutThreshold) {
        this.preloadRegistry.delete(id);
      }
    }
    
    // Nettoyer la file d'attente
    this.preloadQueue = this.preloadQueue.filter(item => this.preloadRegistry.has(item.id));
  }

  /**
   * Traite la file d'attente de préchargement
   */
  private processQueue(): void {
    if (this.preloadQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }
    
    this.isProcessingQueue = true;
    
    // Déterminer le nombre maximum de préchargements simultanés
    const activeCritical = this.countActiveByPriority('critical');
    const activeHigh = this.countActiveByPriority('high');
    const activeNormal = this.countActiveByPriority('normal');
    const activeLow = this.countActiveByPriority('low');
    
    const maxConcurrent = {
      critical: this.config.concurrency.critical - activeCritical,
      high: this.config.concurrency.high - activeHigh,
      normal: this.config.concurrency.normal - activeNormal,
      low: this.config.concurrency.low - activeLow
    };
    
    // Pour chaque item dans la file d'attente
    const processed: string[] = [];
    
    for (const queueItem of this.preloadQueue) {
      const resource = this.preloadRegistry.get(queueItem.id);
      
      if (!resource || resource.status !== 'pending') continue;
      
      // Déterminer la priorité
      const priority = resource.priority as keyof typeof maxConcurrent;
      
      // Vérifier si on peut précharger cette ressource maintenant
      if (maxConcurrent[priority] > 0) {
        maxConcurrent[priority]--;
        processed.push(queueItem.id);
        
        // Mettre à jour le statut
        resource.status = 'loading';
        this.preloadRegistry.set(queueItem.id, resource);
        
        // Appliquer un délai en fonction de la priorité
        const delay = this.config.delay[priority as keyof typeof this.config.delay] || 0;
        
        setTimeout(() => {
          this.executePreload(queueItem.id, resource.importFn);
        }, delay);
      }
    }
    
    // Supprimer les éléments traités de la file d'attente
    this.preloadQueue = this.preloadQueue.filter(item => !processed.includes(item.id));
    
    // Si la file d'attente n'est pas vide, planifier le prochain traitement
    if (this.preloadQueue.length > 0) {
      setTimeout(() => this.processQueue(), 100);
    } else {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Compte le nombre de ressources actives par priorité
   * @param priority Priorité à compter
   */
  private countActiveByPriority(priority: string): number {
    let count = 0;
    
    for (const [_, resource] of this.preloadRegistry.entries()) {
      if (resource.status === 'loading' && resource.priority === priority) {
        count++;
      }
    }
    
    return count;
  }

  /**
   * Exécute le préchargement d'une ressource
   * @param id Identifiant de la ressource
   * @param importFn Fonction d'importation
   */
  private executePreload(id: string, importFn: () => Promise<any>): void {
    importFn()
      .then(() => {
        // Mise à jour du statut
        const resource = this.preloadRegistry.get(id);
        if (resource) {
          resource.status = 'loaded';
          this.preloadRegistry.set(id, resource);
        }
      })
      .catch(error => {
        console.error(`[PreloadManager] Error preloading ${id}:`, error);
        
        // Mise à jour du statut
        const resource = this.preloadRegistry.get(id);
        if (resource) {
          resource.status = 'error';
          this.preloadRegistry.set(id, resource);
          
          // Réessayer si configuré
          if (this.config.retryOnError) {
            // Implémenter la logique de retry
            setTimeout(() => {
              resource.status = 'pending';
              this.preloadRegistry.set(id, resource);
              
              // Ajouter à nouveau à la file d'attente
              this.preloadQueue.push({ 
                id, 
                priority: this.config.priorityValues[resource.priority as keyof typeof this.config.priorityValues] || this.config.priorityValues.normal 
              });
              
              // Trier la file d'attente
              this.preloadQueue.sort((a, b) => b.priority - a.priority);
              
              // Traiter la file d'attente
              if (!this.isProcessingQueue) {
                this.processQueue();
              }
            }, 1000);
          }
        }
      });
  }

  /**
   * Fusionne deux objets de configuration
   * @param defaultConfig Configuration par défaut
   * @param customConfig Configuration personnalisée
   */
  private mergeConfigs(defaultConfig: any, customConfig: any): any {
    const result = { ...defaultConfig };
    
    for (const key in customConfig) {
      if (typeof customConfig[key] === 'object' && !Array.isArray(customConfig[key])) {
        result[key] = this.mergeConfigs(defaultConfig[key] || {}, customConfig[key]);
      } else {
        result[key] = customConfig[key];
      }
    }
    
    return result;
  }
}

/**
 * Composant React pour précharger des ressources
 */
export interface PreloadComponentProps {
  id: string;
  importFn: () => Promise<any>;
  priority?: 'critical' | 'high' | 'normal' | 'low';
  children?: React.ReactNode;
}

/**
 * Composant qui précharge une ressource lors du montage
 */
export const PreloadComponent: React.FC<PreloadComponentProps> = ({
  id,
  importFn,
  priority = 'normal',
  children
}) => {
  // Référence à l'instance du gestionnaire
  const preloadManager = React.useMemo(() => new PreloadManager(), []);
  
  // Précharger au montage
  useEffect(() => {
    preloadManager.preload(id, importFn, { priority });
  }, [id, importFn, priority, preloadManager]);
  
  return <>{children}</>;
};

/**
 * Composant qui précharge plusieurs ressources
 */
export interface PreloadBatchProps {
  items: Array<{
    id: string;
    importFn: () => Promise<any>;
    priority?: 'critical' | 'high' | 'normal' | 'low';
  }>;
  children?: React.ReactNode;
}

/**
 * Composant qui précharge plusieurs ressources lors du montage
 */
export const PreloadBatch: React.FC<PreloadBatchProps> = ({
  items,
  children
}) => {
  // Référence à l'instance du gestionnaire
  const preloadManager = React.useMemo(() => new PreloadManager(), []);
  
  // Précharger au montage
  useEffect(() => {
    preloadManager.preloadBatch(items);
  }, [items, preloadManager]);
  
  return <>{children}</>;
};

/**
 * Hook pour précharger des ressources
 * @param id Identifiant de la ressource
 * @param importFn Fonction d'importation
 * @param options Options de préchargement
 */
export function usePreload(
  id: string,
  importFn: () => Promise<any>,
  options: PreloadOptions = {}
): boolean {
  // Référence à l'instance du gestionnaire
  const preloadManager = React.useMemo(() => new PreloadManager(), []);
  
  // État pour suivre si la ressource est préchargée
  const [isPreloaded, setIsPreloaded] = React.useState(preloadManager.isPreloaded(id));
  
  // Précharger au montage
  useEffect(() => {
    if (!isPreloaded) {
      preloadManager.preload(id, importFn, options);
      
      // Surveiller l'état de préchargement
      const interval = setInterval(() => {
        if (preloadManager.isPreloaded(id)) {
          setIsPreloaded(true);
          clearInterval(interval);
        }
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [id, importFn, options, preloadManager, isPreloaded]);
  
  return isPreloaded;
}
