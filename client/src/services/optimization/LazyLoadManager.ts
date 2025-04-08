import React, { ComponentType, lazy } from 'react';
import { PreloadManager } from './components/PreloadManager';

/**
 * Options de chargement paresseux pour les composants
 */
export interface LazyLoadOptions {
  // Options d'intersection observer
  viewport?: {
    threshold?: number;
    rootMargin?: string;
  };
  // Délai avant chargement (ms)
  delay?: number;
  // Priorité de chargement
  priority?: 'critical' | 'high' | 'normal' | 'low';
  // Activer le préchargement
  preload?: boolean;
  // Configuration de placeholder
  placeholder?: React.ReactNode;
  // Stratégie en cas d'erreur
  errorHandling?: {
    maxRetries?: number;
    fallback?: React.ReactNode;
    retryDelay?: number;
  };
}

/**
 * Informations sur un composant lazy-loadé
 */
interface LazyComponentInfo {
  id: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  loadStatus: 'pending' | 'loading' | 'loaded' | 'error';
  loadTime?: number;
  retries: number;
  size?: number;
  component: React.LazyExoticComponent<ComponentType<any>>;
}

/**
 * Gestionnaire de chargement paresseux
 * Optimise le chargement des composants React en fonction de la priorité et de la visibilité
 */
export class LazyLoadManager {
  private componentRegistry: Map<string, LazyComponentInfo>;
  private preloadManager: PreloadManager;
  private intersectionObserver?: IntersectionObserver;
  private perfMetrics: {
    loadTimes: Record<string, number>;
    chunkSizes: Record<string, number>;
    errors: Array<{ id: string, error: Error, timestamp: number }>;
  };
  
  private config = {
    preload: {
      viewport: {
        threshold: 0.1,
        rootMargin: '100px'
      },
      priority: {
        critical: ['ColDetail', 'WeatherWidget'],
        high: ['TrainingModule', 'ColVisualisation3D'],
        normal: ['CommunityFeatures', 'NutritionModule'],
        low: ['ProfileSettings', 'AdminPanel']
      }
    },
    chunks: {
      maxSize: 200 * 1024, // 200KB
      splitting: true
    },
    loadingStrategies: {
      route: {
        preload: true,
        prefetch: ['adjacentRoutes'],
        timeout: 3000
      },
      component: {
        threshold: 0.1,
        distance: '200px',
        delay: 100
      },
      media: {
        quality: {
          initial: 'low',
          upgrade: 'auto'
        },
        timeout: 5000
      }
    },
    errorHandling: {
      maxRetries: 3,
      backoff: 'exponential',
      timeout: 10000
    }
  };

  /**
   * Crée une nouvelle instance du gestionnaire de chargement paresseux
   * @param customConfig Configuration personnalisée (optionnelle)
   */
  constructor(customConfig?: Partial<typeof LazyLoadManager.prototype.config>) {
    // Fusion de la configuration par défaut avec la configuration personnalisée
    if (customConfig) {
      this.config = this.mergeConfigs(this.config, customConfig);
    }
    
    this.componentRegistry = new Map();
    this.preloadManager = new PreloadManager();
    this.perfMetrics = {
      loadTimes: {},
      chunkSizes: {},
      errors: []
    };
    
    this.setupIntersectionObserver();
    this.setupPerformanceObserver();
  }

  /**
   * Crée un composant à chargement paresseux avec des optimisations
   * @param importFn Fonction d'importation du composant
   * @param options Options de chargement
   * @returns Composant React à chargement paresseux
   */
  public createLazyComponent<T extends ComponentType<any>>(
    id: string, 
    importFn: () => Promise<{ default: T }>, 
    options: LazyLoadOptions = {}
  ): React.LazyExoticComponent<T> {
    // Définir les options par défaut
    const {
      delay = this.config.loadingStrategies.component.delay,
      priority = 'normal',
      preload = false,
      errorHandling = {}
    } = options;
    
    // Créer une fonction d'importation améliorée
    const enhancedImport = () => {
      // Marquer le début du chargement
      const startTime = performance.now();
      this.updateComponentStatus(id, 'loading');
      
      // Ajouter un délai intentionnel si nécessaire (pour déboguer ou pour des raisons UX)
      const importPromise = Promise.all([
        importFn(),
        new Promise(resolve => setTimeout(resolve, delay))
      ]).then(([moduleExports]) => {
        // Calculer le temps de chargement
        const loadTime = performance.now() - startTime;
        
        // Mettre à jour les métriques
        this.perfMetrics.loadTimes[id] = loadTime;
        
        // Mettre à jour le statut du composant
        this.updateComponentStatus(id, 'loaded');
        
        return moduleExports;
      }).catch(error => {
        // Gérer les erreurs
        this.handleImportError(id, error, importFn, errorHandling);
        throw error;
      });
      
      return importPromise;
    };
    
    // Créer le composant lazy
    const lazyComponent = React.lazy(enhancedImport);
    
    // Enregistrer le composant
    this.componentRegistry.set(id, {
      id,
      priority,
      loadStatus: 'pending',
      retries: 0,
      component: lazyComponent
    });
    
    // Précharger si nécessaire
    if (preload || this.shouldPreload(id, priority)) {
      this.preloadComponent(id, importFn);
    }
    
    return lazyComponent;
  }

  /**
   * Précharge un composant
   * @param id Identifiant du composant
   * @param importFn Fonction d'importation
   */
  public preloadComponent(id: string, importFn: () => Promise<any>): void {
    this.preloadManager.preload(id, importFn);
  }

  /**
   * Précharge tous les composants d'une priorité donnée
   * @param priority Priorité minimale à précharger
   */
  public preloadByPriority(priority: 'critical' | 'high' | 'normal' | 'low'): void {
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    
    for (const [id, info] of this.componentRegistry.entries()) {
      if (priorityOrder[info.priority] <= priorityOrder[priority] && info.loadStatus === 'pending') {
        // Récupérer la fonction d'importation du registre
        const importFn = this.getImportFnForComponent(id);
        if (importFn) {
          this.preloadComponent(id, importFn);
        }
      }
    }
  }

  /**
   * Crée un wrapper d'optimisation à utiliser avec un composant
   * @param id Identifiant du composant
   * @param options Options d'optimisation
   * @returns HOC pour optimiser le chargement
   */
  public createOptimizationWrapper<P extends object>(
    id: string,
    options: LazyLoadOptions = {}
  ): (Component: React.ComponentType<P>) => React.FC<P> {
    return (Component: React.ComponentType<P>) => {
      const OptimizedComponent: React.FC<P> = (props) => {
        // Référence à l'élément DOM
        const ref = React.useRef<HTMLDivElement>(null);
        
        // État pour suivre si le composant est dans la viewport
        const [isVisible, setIsVisible] = React.useState(
          options.priority === 'critical' || options.preload
        );
        
        // Effet pour observer la visibilité
        React.useEffect(() => {
          if (!ref.current || isVisible) return;
          
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  setIsVisible(true);
                  observer.disconnect();
                }
              });
            },
            {
              threshold: options.viewport?.threshold || this.config.preload.viewport.threshold,
              rootMargin: options.viewport?.rootMargin || this.config.preload.viewport.rootMargin
            }
          );
          
          observer.observe(ref.current);
          
          return () => observer.disconnect();
        }, [ref, isVisible]);
        
        // Rendu conditionnel
        return (
          <div ref={ref} style={{ minHeight: isVisible ? 'auto' : '10px' }}>
            {isVisible ? <Component {...props} /> : options.placeholder || null}
          </div>
        );
      };
      
      OptimizedComponent.displayName = `Optimized(${id})`;
      
      return OptimizedComponent;
    };
  }

  /**
   * Retourne les métriques de performance
   */
  public getMetrics() {
    return {
      ...this.perfMetrics,
      components: Array.from(this.componentRegistry.entries()).map(([_, info]) => ({
        id: info.id,
        priority: info.priority,
        status: info.loadStatus,
        loadTime: info.loadTime || 0,
        size: info.size || 0
      }))
    };
  }

  /**
   * Détermine si un composant doit être préchargé
   * @param id Identifiant du composant
   * @param priority Priorité du composant
   */
  private shouldPreload(id: string, priority: string): boolean {
    // Précharger les composants critiques
    if (priority === 'critical') return true;
    
    // Vérifier si l'id est dans la liste des préchargements par priorité
    for (const [prio, components] of Object.entries(this.config.preload.priority)) {
      if (prio === priority && components.includes(id)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Met à jour le statut d'un composant
   * @param id Identifiant du composant
   * @param status Nouveau statut
   */
  private updateComponentStatus(id: string, status: 'pending' | 'loading' | 'loaded' | 'error'): void {
    const component = this.componentRegistry.get(id);
    
    if (component) {
      component.loadStatus = status;
      
      if (status === 'loaded') {
        component.loadTime = performance.now();
      }
      
      this.componentRegistry.set(id, component);
    }
  }

  /**
   * Gère les erreurs d'importation de composant
   * @param id Identifiant du composant
   * @param error Erreur survenue
   * @param importFn Fonction d'importation
   * @param errorHandling Options de gestion d'erreur
   */
  private handleImportError(
    id: string,
    error: Error,
    importFn: () => Promise<any>,
    errorHandling: Partial<LazyLoadOptions['errorHandling']> = {}
  ): void {
    // Mettre à jour le statut
    this.updateComponentStatus(id, 'error');
    
    // Journaliser l'erreur
    console.error(`[LazyLoadManager] Error loading component ${id}:`, error);
    
    // Enregistrer l'erreur dans les métriques
    this.perfMetrics.errors.push({
      id,
      error,
      timestamp: Date.now()
    });
    
    // Récupérer le composant du registre
    const component = this.componentRegistry.get(id);
    
    if (component) {
      // Incrémenter le compteur de tentatives
      component.retries += 1;
      
      // Vérifier si on peut réessayer
      const maxRetries = errorHandling.maxRetries || this.config.errorHandling.maxRetries;
      
      if (component.retries < maxRetries) {
        // Calculer le délai de nouvelle tentative (backoff exponentiel)
        const retryDelay = errorHandling.retryDelay || Math.pow(2, component.retries) * 1000;
        
        // Réessayer après le délai
        setTimeout(() => {
          this.updateComponentStatus(id, 'loading');
          importFn().catch(newError => {
            this.handleImportError(id, newError, importFn, errorHandling);
          });
        }, retryDelay);
      }
    }
  }

  /**
   * Configure l'observateur d'intersection pour les composants
   */
  private setupIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-component-id');
            if (id) {
              const importFn = this.getImportFnForComponent(id);
              if (importFn) {
                this.preloadComponent(id, importFn);
              }
            }
          }
        });
      },
      {
        threshold: this.config.preload.viewport.threshold,
        rootMargin: this.config.preload.viewport.rootMargin
      }
    );
  }

  /**
   * Configure l'observateur de performance
   */
  private setupPerformanceObserver(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'resource' && entry.initiatorType === 'script') {
            // Essayer d'extraire l'ID du composant du nom du chunk
            const match = entry.name.match(/chunk-([a-zA-Z0-9_-]+)-[a-f0-9]+\.js$/);
            if (match) {
              const componentId = match[1];
              this.perfMetrics.chunkSizes[componentId] = entry.encodedBodySize;
              
              // Mettre à jour la taille dans le registre
              const component = this.componentRegistry.get(componentId);
              if (component) {
                component.size = entry.encodedBodySize;
                this.componentRegistry.set(componentId, component);
              }
            }
          }
        });
      });
      
      observer.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Récupère la fonction d'importation pour un composant
   * @param id Identifiant du composant
   */
  private getImportFnForComponent(id: string): (() => Promise<any>) | null {
    // Cette méthode serait implémentée pour extraire dynamiquement
    // la fonction d'importation en fonction de l'ID du composant
    
    // Mapping des ID aux fonctions d'importation
    const importMapping: Record<string, () => Promise<any>> = {
      'ColDetail': () => import('../../components/cols/unified/ColDetail'),
      'WeatherWidget': () => import('../../components/weather/WeatherWidget'),
      'ColVisualisation3D': () => import('../../components/cols/unified/Visualization3D'),
      'TrainingModule': () => import('../../components/training/TrainingModule'),
      'CommunityFeatures': () => import('../../components/community/CommunityFeatures'),
      'NutritionModule': () => import('../../components/nutrition/NutritionModule'),
      'ProfileSettings': () => import('../../components/profile/ProfileSettings'),
      'AdminPanel': () => import('../../components/admin/AdminPanel')
    };
    
    return importMapping[id] || null;
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

// Export d'une instance singleton pour utilisation globale
export const lazyLoadManager = new LazyLoadManager();
