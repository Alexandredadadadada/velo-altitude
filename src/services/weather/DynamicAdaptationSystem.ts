/**
 * Système d'adaptation dynamique pour la visualisation météorologique
 * Analyse l'impact des adaptations précédentes pour optimiser les futures décisions
 */

import { PerformanceMetrics } from '../monitoring/WeatherVisualizationMonitoring';
import { DeviceCapabilities } from '../../utils/device';

// Interface pour les entrées d'adaptation
export interface AdaptationEntry {
  timestamp: number;
  metrics: PerformanceMetrics;
  adaptation: string;
  impact: number;  // Impact mesuré sur les performances (-1 à 1)
  context: {
    batteryLevel?: number;
    networkType?: string;
    colId?: string;
    weatherType?: string;
    deviceCapabilities: DeviceCapabilities;
  };
}

// Interface pour les stratégies d'adaptation
export interface AdaptationStrategy {
  id: string;
  name: string;
  description: string;
  priority: number;
  condition: (metrics: PerformanceMetrics, context: any) => boolean;
  apply: () => Promise<void>;
  revert: () => Promise<void>;
  estimatedImpact: {
    fps: number;
    memoryUsage: number;
    batteryDrain: number;
  };
}

/**
 * Classe principale pour l'adaptation dynamique
 */
export class DynamicAdaptationSystem {
  // Historique des adaptations
  private adaptationHistory: AdaptationEntry[] = [];
  
  // Taille maximale de l'historique
  private maxHistorySize: number = 100;
  
  // Stratégies d'adaptation disponibles
  private strategies: AdaptationStrategy[] = [];
  
  // Dernières métriques
  private lastMetrics?: PerformanceMetrics;
  
  // État d'adaptation actuel
  private activeAdaptations: Set<string> = new Set();
  
  // Délai minimum entre adaptations (ms)
  private adaptationCooldown: number = 10000;
  
  // Dernier timestamp d'adaptation
  private lastAdaptationTime: number = 0;
  
  // Callbacks pour les changements d'adaptation
  private adaptationCallbacks: Array<(strategy: AdaptationStrategy, active: boolean) => void> = [];

  /**
   * Constructeur
   * @param initialStrategies Stratégies initiales
   */
  constructor(initialStrategies: AdaptationStrategy[] = []) {
    // Enregistrer les stratégies initiales
    this.strategies = [...initialStrategies];
    
    // Ajouter les stratégies par défaut
    this.addDefaultStrategies();
    
    // Trier les stratégies par priorité
    this.sortStrategies();
    
    console.log(`Dynamic Adaptation System initialized with ${this.strategies.length} strategies`);
  }
  
  /**
   * Analyse l'impact des adaptations précédentes
   * @returns Map des impacts par stratégie
   */
  public analyzeAdaptationImpact(): Map<string, number> {
    const impacts = new Map<string, number>();
    const counts = new Map<string, number>();
    
    // Analyser l'historique des adaptations
    this.adaptationHistory.forEach((entry) => {
      const currentImpact = impacts.get(entry.adaptation) || 0;
      const currentCount = counts.get(entry.adaptation) || 0;
      
      impacts.set(entry.adaptation, currentImpact + entry.impact);
      counts.set(entry.adaptation, currentCount + 1);
    });
    
    // Calculer l'impact moyen
    const averageImpacts = new Map<string, number>();
    impacts.forEach((totalImpact, strategy) => {
      const count = counts.get(strategy) || 1;
      averageImpacts.set(strategy, totalImpact / count);
    });
    
    return averageImpacts;
  }
  
  /**
   * Analyse l'impact des adaptations en fonction du contexte
   * @param context Contexte spécifique (batterie, réseau, etc.)
   * @returns Map des impacts par stratégie pour ce contexte
   */
  public analyzeContextSpecificImpact(context: Partial<AdaptationEntry['context']>): Map<string, number> {
    const impacts = new Map<string, number>();
    const counts = new Map<string, number>();
    
    // Filtrer l'historique des adaptations par contexte
    const relevantEntries = this.adaptationHistory.filter(entry => {
      // Vérifier si le contexte correspond
      let matches = true;
      
      if (context.batteryLevel !== undefined) {
        const batteryRange = 0.1; // Marge de 10%
        matches = matches && entry.context.batteryLevel !== undefined && 
          Math.abs(entry.context.batteryLevel - context.batteryLevel) <= batteryRange;
      }
      
      if (context.networkType !== undefined) {
        matches = matches && entry.context.networkType === context.networkType;
      }
      
      if (context.weatherType !== undefined) {
        matches = matches && entry.context.weatherType === context.weatherType;
      }
      
      return matches;
    });
    
    // Calculer l'impact pour le contexte spécifique
    relevantEntries.forEach((entry) => {
      const currentImpact = impacts.get(entry.adaptation) || 0;
      const currentCount = counts.get(entry.adaptation) || 0;
      
      impacts.set(entry.adaptation, currentImpact + entry.impact);
      counts.set(entry.adaptation, currentCount + 1);
    });
    
    // Calculer l'impact moyen
    const averageImpacts = new Map<string, number>();
    impacts.forEach((totalImpact, strategy) => {
      const count = counts.get(strategy) || 1;
      averageImpacts.set(strategy, totalImpact / count);
    });
    
    return averageImpacts;
  }
  
  /**
   * Suggère la meilleure adaptation basée sur les métriques actuelles
   * @param metrics Métriques de performance actuelles
   * @param context Contexte actuel
   * @returns Meilleure stratégie d'adaptation ou null
   */
  public suggestAdaptation(
    metrics: PerformanceMetrics,
    context: Partial<AdaptationEntry['context']>
  ): AdaptationStrategy | null {
    // Vérifier si nous sommes en période de cooldown
    const now = Date.now();
    if (now - this.lastAdaptationTime < this.adaptationCooldown) {
      return null;
    }
    
    // Mettre à jour les dernières métriques
    this.lastMetrics = metrics;
    
    // Filtrer les stratégies applicables
    const applicableStrategies = this.strategies.filter(strategy => 
      strategy.condition(metrics, context) && !this.activeAdaptations.has(strategy.id)
    );
    
    if (applicableStrategies.length === 0) {
      return null;
    }
    
    // Déterminer les impacts pour le contexte actuel
    const contextImpacts = this.analyzeContextSpecificImpact(context);
    
    // Si nous n'avons pas assez de données pour ce contexte, utiliser l'impact global
    const impacts = contextImpacts.size > 0 ? contextImpacts : this.analyzeAdaptationImpact();
    
    // Trier par impact estimé et priorité
    applicableStrategies.sort((a, b) => {
      const impactA = impacts.get(a.id) || 0;
      const impactB = impacts.get(b.id) || 0;
      
      // D'abord par impact
      if (impactA !== impactB) {
        return impactB - impactA;
      }
      
      // Ensuite par priorité
      return b.priority - a.priority;
    });
    
    // Retourner la meilleure stratégie
    return applicableStrategies[0] || null;
  }
  
  /**
   * Gère un problème de performance en suggérant et appliquant une adaptation
   * @param issue Description du problème
   * @param context Contexte actuel
   * @returns Stratégie appliquée ou null
   */
  public async handleIssue(
    issue: { 
      type: string;
      severity: 'warning' | 'critical';
      metrics: PerformanceMetrics;
    },
    context: Partial<AdaptationEntry['context']>
  ): Promise<AdaptationStrategy | null> {
    console.log(`Handling performance issue: ${issue.type} (${issue.severity})`);
    
    // Suggérer une adaptation
    const strategy = this.suggestAdaptation(issue.metrics, context);
    
    if (!strategy) {
      console.log('No suitable adaptation found');
      return null;
    }
    
    try {
      // Appliquer l'adaptation
      console.log(`Applying adaptation strategy: ${strategy.name}`);
      await strategy.apply();
      
      // Enregistrer l'adaptation
      this.activeAdaptations.add(strategy.id);
      this.lastAdaptationTime = Date.now();
      
      // Notifier les callbacks
      this.notifyAdaptationChange(strategy, true);
      
      return strategy;
    } catch (error) {
      console.error(`Failed to apply adaptation ${strategy.id}:`, error);
      return null;
    }
  }
  
  /**
   * Enregistre l'impact d'une adaptation
   * @param strategyId ID de la stratégie
   * @param metrics Métriques après l'adaptation
   * @param context Contexte lors de l'adaptation
   */
  public recordAdaptationImpact(
    strategyId: string,
    metrics: PerformanceMetrics,
    context: Partial<AdaptationEntry['context']>
  ): void {
    if (!this.lastMetrics) {
      console.warn(`Cannot record impact for ${strategyId} without previous metrics`);
      return;
    }
    
    // Calculer l'impact sur le FPS
    const fpsBefore = this.lastMetrics.fps || 0;
    const fpsAfter = metrics.fps || 0;
    const fpsImpact = (fpsAfter - fpsBefore) / Math.max(1, fpsBefore);
    
    // Calculer l'impact sur l'utilisation mémoire
    const memoryBefore = this.lastMetrics.memoryUsage || 0;
    const memoryAfter = metrics.memoryUsage || 0;
    const memoryImpact = -(memoryAfter - memoryBefore) / Math.max(1, memoryBefore);
    
    // Calculer l'impact global (pondéré)
    const impact = fpsImpact * 0.7 + memoryImpact * 0.3;
    
    // Créer l'entrée d'adaptation
    const entry: AdaptationEntry = {
      timestamp: Date.now(),
      metrics,
      adaptation: strategyId,
      impact,
      context: {
        ...context,
        deviceCapabilities: context.deviceCapabilities || { 
          isMobile: false,
          isTouchDevice: false,
          hasWebGL2: false,
          devicePixelRatio: 1,
          performanceLevel: 'medium'
        }
      }
    };
    
    // Ajouter à l'historique
    this.adaptationHistory.push(entry);
    
    // Limiter la taille de l'historique
    if (this.adaptationHistory.length > this.maxHistorySize) {
      this.adaptationHistory.shift();
    }
    
    console.log(`Recorded impact for ${strategyId}: ${impact.toFixed(3)}`);
  }
  
  /**
   * Désactive une stratégie d'adaptation
   * @param strategyId ID de la stratégie
   */
  public async deactivateStrategy(strategyId: string): Promise<boolean> {
    if (!this.activeAdaptations.has(strategyId)) {
      return false;
    }
    
    const strategy = this.strategies.find(s => s.id === strategyId);
    if (!strategy) {
      this.activeAdaptations.delete(strategyId);
      return false;
    }
    
    try {
      // Annuler l'adaptation
      await strategy.revert();
      
      // Mettre à jour l'état
      this.activeAdaptations.delete(strategyId);
      
      // Notifier les callbacks
      this.notifyAdaptationChange(strategy, false);
      
      console.log(`Deactivated adaptation strategy: ${strategy.name}`);
      return true;
    } catch (error) {
      console.error(`Failed to deactivate adaptation ${strategyId}:`, error);
      return false;
    }
  }
  
  /**
   * Ajoute une stratégie d'adaptation
   * @param strategy Stratégie à ajouter
   */
  public addStrategy(strategy: AdaptationStrategy): void {
    // Vérifier si la stratégie existe déjà
    const existingIndex = this.strategies.findIndex(s => s.id === strategy.id);
    if (existingIndex >= 0) {
      // Remplacer la stratégie existante
      this.strategies[existingIndex] = strategy;
    } else {
      // Ajouter la nouvelle stratégie
      this.strategies.push(strategy);
    }
    
    // Trier les stratégies
    this.sortStrategies();
    
    console.log(`Added/updated adaptation strategy: ${strategy.name}`);
  }
  
  /**
   * Supprime une stratégie d'adaptation
   * @param strategyId ID de la stratégie à supprimer
   * @returns True si la stratégie a été trouvée et supprimée
   */
  public removeStrategy(strategyId: string): boolean {
    const initialLength = this.strategies.length;
    this.strategies = this.strategies.filter(s => s.id !== strategyId);
    
    const removed = initialLength > this.strategies.length;
    if (removed) {
      console.log(`Removed adaptation strategy: ${strategyId}`);
    }
    
    return removed;
  }
  
  /**
   * Ajoute un callback pour les changements d'adaptation
   * @param callback Fonction appelée lors d'un changement
   * @returns Fonction pour supprimer le callback
   */
  public onAdaptationChange(
    callback: (strategy: AdaptationStrategy, active: boolean) => void
  ): () => void {
    this.adaptationCallbacks.push(callback);
    
    return () => {
      this.adaptationCallbacks = this.adaptationCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Nettoie les ressources
   */
  public dispose(): void {
    // Désactiver toutes les adaptations actives
    const promises = Array.from(this.activeAdaptations).map(id => 
      this.deactivateStrategy(id)
    );
    
    Promise.all(promises).then(() => {
      console.log('All adaptations deactivated');
    });
    
    // Vider l'historique
    this.adaptationHistory = [];
    this.adaptationCallbacks = [];
  }
  
  /**
   * Notifie les callbacks d'un changement d'adaptation
   */
  private notifyAdaptationChange(strategy: AdaptationStrategy, active: boolean): void {
    this.adaptationCallbacks.forEach(callback => {
      try {
        callback(strategy, active);
      } catch (error) {
        console.error('Error in adaptation change callback:', error);
      }
    });
  }
  
  /**
   * Trie les stratégies par priorité
   */
  private sortStrategies(): void {
    this.strategies.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Ajoute les stratégies d'adaptation par défaut
   */
  private addDefaultStrategies(): void {
    // Réduction des particules
    this.strategies.push({
      id: 'reduce_particles',
      name: 'Réduction des particules',
      description: 'Réduit le nombre de particules pour les effets météorologiques',
      priority: 80,
      condition: (metrics, context) => {
        return (metrics.fps || 0) < 30 && (metrics.particleCount || 0) > 5000;
      },
      apply: async () => {
        console.log('Applying particle reduction');
        // L'implémentation dépend de votre système de rendu
      },
      revert: async () => {
        console.log('Reverting particle reduction');
        // L'implémentation dépend de votre système de rendu
      },
      estimatedImpact: {
        fps: 10,
        memoryUsage: -5,
        batteryDrain: -10
      }
    });
    
    // Désactivation des post-effets
    this.strategies.push({
      id: 'disable_postprocessing',
      name: 'Désactivation des post-effets',
      description: 'Désactive les effets de post-traitement comme le bloom',
      priority: 70,
      condition: (metrics, context) => {
        return (metrics.fps || 0) < 25 && context.deviceCapabilities?.performanceLevel !== 'high';
      },
      apply: async () => {
        console.log('Disabling post-processing effects');
        // L'implémentation dépend de votre système de rendu
      },
      revert: async () => {
        console.log('Re-enabling post-processing effects');
        // L'implémentation dépend de votre système de rendu
      },
      estimatedImpact: {
        fps: 15,
        memoryUsage: -2,
        batteryDrain: -15
      }
    });
    
    // Réduction de la résolution
    this.strategies.push({
      id: 'reduce_resolution',
      name: 'Réduction de la résolution',
      description: 'Réduit la résolution du rendu pour améliorer les performances',
      priority: 60,
      condition: (metrics, context) => {
        return (metrics.fps || 0) < 20;
      },
      apply: async () => {
        console.log('Reducing render resolution');
        // L'implémentation dépend de votre système de rendu
      },
      revert: async () => {
        console.log('Restoring render resolution');
        // L'implémentation dépend de votre système de rendu
      },
      estimatedImpact: {
        fps: 20,
        memoryUsage: 0,
        batteryDrain: -20
      }
    });
    
    // Mode économie de batterie
    this.strategies.push({
      id: 'battery_saver',
      name: 'Mode économie de batterie',
      description: 'Réduit la fréquence des mises à jour météo',
      priority: 90,
      condition: (metrics, context) => {
        return context.batteryLevel !== undefined && context.batteryLevel < 0.2;
      },
      apply: async () => {
        console.log('Activating battery saver mode');
        // L'implémentation dépend de votre système
      },
      revert: async () => {
        console.log('Deactivating battery saver mode');
        // L'implémentation dépend de votre système
      },
      estimatedImpact: {
        fps: 5,
        memoryUsage: 0,
        batteryDrain: -30
      }
    });
    
    // Optimisation réseau
    this.strategies.push({
      id: 'network_optimization',
      name: 'Optimisation réseau',
      description: 'Réduit la fréquence des requêtes API et augmente la durée du cache',
      priority: 75,
      condition: (metrics, context) => {
        return context.networkType === '2g' || context.networkType === 'slow-2g';
      },
      apply: async () => {
        console.log('Applying network optimizations');
        // L'implémentation dépend de votre système
      },
      revert: async () => {
        console.log('Reverting network optimizations');
        // L'implémentation dépend de votre système
      },
      estimatedImpact: {
        fps: 0,
        memoryUsage: 5,
        batteryDrain: -10
      }
    });
  }
}
