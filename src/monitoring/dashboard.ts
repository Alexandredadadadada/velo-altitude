/**
 * Tableau de bord de monitoring des performances pour Velo-Altitude
 * Visualise et analyse les métriques de performance pour faciliter l'optimisation
 */

import enhancedPerformanceMonitoring from '../utils/enhancedPerformanceMonitoring';
import { ENV } from '../config/environment';

// Types pour le tableau de bord
interface PerformanceDashboardOptions {
  element?: HTMLElement;
  autoRefresh?: boolean;
  refreshInterval?: number;
  historySize?: number;
}

interface MetricHistory {
  timestamp: number;
  value: number;
}

interface DashboardMetrics {
  interaction: {
    avg: number;
    p95: number;
    count: number;
    history: {
      avg: MetricHistory[];
      p95: MetricHistory[];
    };
  };
  loading: {
    critical: {
      avg: number;
      max: number;
      history: {
        avg: MetricHistory[];
        max: MetricHistory[];
      };
    };
    resources: Map<string, {
      current: number;
      history: MetricHistory[];
    }>;
  };
  cache: {
    hitRate: number;
    size: number;
    history: {
      hitRate: MetricHistory[];
    };
    byKey: Record<string, {
      hits: number;
      misses: number;
      rate: number;
    }>;
  };
  webVitals: {
    fcp: number;
    lcp: number;
    cls: number;
    fid: number;
    ttfb: number;
    history: {
      fcp: MetricHistory[];
      lcp: MetricHistory[];
      cls: MetricHistory[];
    };
  };
}

/**
 * Tableau de bord de performances
 */
export const performanceDashboard = {
  // Métriques du tableau de bord
  metrics: {
    interaction: {
      avg: 0,
      p95: 0,
      count: 0,
      history: {
        avg: [],
        p95: []
      }
    },
    loading: {
      critical: {
        avg: 0,
        max: 0,
        history: {
          avg: [],
          max: []
        }
      },
      resources: new Map()
    },
    cache: {
      hitRate: 0,
      size: 0,
      history: {
        hitRate: []
      },
      byKey: {}
    },
    webVitals: {
      fcp: 0,
      lcp: 0,
      cls: 0,
      fid: 0,
      ttfb: 0,
      history: {
        fcp: [],
        lcp: [],
        cls: []
      }
    }
  } as DashboardMetrics,
  
  // Options de configuration
  options: {
    autoRefresh: true,
    refreshInterval: 5000,
    historySize: 100
  } as PerformanceDashboardOptions,
  
  // Référence au timer de rafraîchissement
  refreshTimer: null as number | null,
  
  /**
   * Initialise le tableau de bord
   */
  init(options: Partial<PerformanceDashboardOptions> = {}): void {
    // Fusionner les options
    this.options = { ...this.options, ...options };
    
    // Mettre à jour les métriques initiales
    this.updateMetrics();
    
    // Configurer le rafraîchissement automatique
    if (this.options.autoRefresh) {
      this.startAutoRefresh();
    }
    
    console.info('Tableau de bord de performance initialisé');
  },
  
  /**
   * Démarre le rafraîchissement automatique
   */
  startAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.refreshTimer = window.setInterval(() => {
      this.updateMetrics();
      this.renderDashboard();
    }, this.options.refreshInterval);
  },
  
  /**
   * Arrête le rafraîchissement automatique
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  },
  
  /**
   * Met à jour les métriques du tableau de bord
   */
  updateMetrics(): void {
    const now = Date.now();
    const perfMetrics = enhancedPerformanceMonitoring.metrics;
    
    // Mettre à jour les métriques d'interaction
    this.metrics.interaction.avg = perfMetrics.interactions.avg;
    this.metrics.interaction.p95 = perfMetrics.interactions.p95;
    this.metrics.interaction.count = perfMetrics.interactions.count;
    
    // Ajouter à l'historique
    this.metrics.interaction.history.avg.push({
      timestamp: now,
      value: perfMetrics.interactions.avg
    });
    this.metrics.interaction.history.p95.push({
      timestamp: now,
      value: perfMetrics.interactions.p95
    });
    
    // Limiter la taille de l'historique
    if (this.metrics.interaction.history.avg.length > this.options.historySize) {
      this.metrics.interaction.history.avg.shift();
      this.metrics.interaction.history.p95.shift();
    }
    
    // Mettre à jour les métriques de chargement
    this.metrics.loading.critical.avg = perfMetrics.loading.critical.avg;
    this.metrics.loading.critical.max = perfMetrics.loading.critical.max;
    
    // Ajouter à l'historique
    this.metrics.loading.critical.history.avg.push({
      timestamp: now,
      value: perfMetrics.loading.critical.avg
    });
    this.metrics.loading.critical.history.max.push({
      timestamp: now,
      value: perfMetrics.loading.critical.max
    });
    
    // Limiter la taille de l'historique
    if (this.metrics.loading.critical.history.avg.length > this.options.historySize) {
      this.metrics.loading.critical.history.avg.shift();
      this.metrics.loading.critical.history.max.shift();
    }
    
    // Mettre à jour les métriques des ressources
    perfMetrics.loading.resources.forEach((duration, resource) => {
      if (!this.metrics.loading.resources.has(resource)) {
        this.metrics.loading.resources.set(resource, {
          current: duration,
          history: []
        });
      }
      
      const resourceMetrics = this.metrics.loading.resources.get(resource)!;
      resourceMetrics.current = duration;
      
      resourceMetrics.history.push({
        timestamp: now,
        value: duration
      });
      
      // Limiter la taille de l'historique
      if (resourceMetrics.history.length > this.options.historySize) {
        resourceMetrics.history.shift();
      }
    });
    
    // Mettre à jour les métriques de cache
    this.metrics.cache.hitRate = perfMetrics.cache.hitRate;
    this.metrics.cache.size = perfMetrics.cache.size;
    
    // Ajouter à l'historique
    this.metrics.cache.history.hitRate.push({
      timestamp: now,
      value: perfMetrics.cache.hitRate
    });
    
    // Limiter la taille de l'historique
    if (this.metrics.cache.history.hitRate.length > this.options.historySize) {
      this.metrics.cache.history.hitRate.shift();
    }
    
    // Mettre à jour les détails par clé de cache
    this.metrics.cache.byKey = {};
    Object.entries(perfMetrics.cache.byKey).forEach(([key, stats]) => {
      const total = stats.hits + stats.misses;
      const rate = total > 0 ? stats.hits / total : 0;
      
      this.metrics.cache.byKey[key] = {
        hits: stats.hits,
        misses: stats.misses,
        rate
      };
    });
    
    // Mettre à jour les métriques Web Vitals
    this.metrics.webVitals.fcp = perfMetrics.vitals.fcp;
    this.metrics.webVitals.lcp = perfMetrics.vitals.lcp;
    this.metrics.webVitals.cls = perfMetrics.vitals.cls;
    this.metrics.webVitals.fid = perfMetrics.vitals.fid;
    this.metrics.webVitals.ttfb = perfMetrics.vitals.ttfb;
    
    // Ajouter à l'historique (uniquement si des valeurs sont disponibles)
    if (perfMetrics.vitals.fcp > 0) {
      this.metrics.webVitals.history.fcp.push({
        timestamp: now,
        value: perfMetrics.vitals.fcp
      });
    }
    
    if (perfMetrics.vitals.lcp > 0) {
      this.metrics.webVitals.history.lcp.push({
        timestamp: now,
        value: perfMetrics.vitals.lcp
      });
    }
    
    if (perfMetrics.vitals.cls > 0) {
      this.metrics.webVitals.history.cls.push({
        timestamp: now,
        value: perfMetrics.vitals.cls
      });
    }
    
    // Limiter la taille de l'historique
    if (this.metrics.webVitals.history.fcp.length > this.options.historySize) {
      this.metrics.webVitals.history.fcp.shift();
      this.metrics.webVitals.history.lcp.shift();
      this.metrics.webVitals.history.cls.shift();
    }
  },
  
  /**
   * Rend le tableau de bord dans l'élément spécifié
   */
  renderDashboard(): void {
    const element = this.options.element;
    if (!element) return;
    
    // Générer le contenu HTML
    element.innerHTML = this.generateDashboardHTML();
    
    // Initialiser les graphiques si la bibliothèque Chart.js est disponible
    if (typeof window !== 'undefined' && 'Chart' in window) {
      this.initCharts();
    }
  },
  
  /**
   * Génère le HTML du tableau de bord
   */
  generateDashboardHTML(): string {
    return `
      <div class="performance-dashboard">
        <h2>Tableau de bord de performance</h2>
        <p>Dernière mise à jour: ${new Date().toLocaleTimeString()}</p>
        
        <div class="dashboard-grid">
          <div class="dashboard-card">
            <h3>Web Vitals</h3>
            <div class="metrics-grid">
              <div class="metric">
                <span class="metric-label">FCP</span>
                <span class="metric-value ${this.getMetricClass(this.metrics.webVitals.fcp, 2000, 4000)}">
                  ${Math.round(this.metrics.webVitals.fcp)}ms
                </span>
              </div>
              <div class="metric">
                <span class="metric-label">LCP</span>
                <span class="metric-value ${this.getMetricClass(this.metrics.webVitals.lcp, 2500, 4000)}">
                  ${Math.round(this.metrics.webVitals.lcp)}ms
                </span>
              </div>
              <div class="metric">
                <span class="metric-label">CLS</span>
                <span class="metric-value ${this.getMetricClass(this.metrics.webVitals.cls, 0.1, 0.25)}">
                  ${this.metrics.webVitals.cls.toFixed(3)}
                </span>
              </div>
              <div class="metric">
                <span class="metric-label">FID</span>
                <span class="metric-value ${this.getMetricClass(this.metrics.webVitals.fid, 100, 300)}">
                  ${Math.round(this.metrics.webVitals.fid)}ms
                </span>
              </div>
              <div class="metric">
                <span class="metric-label">TTFB</span>
                <span class="metric-value ${this.getMetricClass(this.metrics.webVitals.ttfb, 600, 1000)}">
                  ${Math.round(this.metrics.webVitals.ttfb)}ms
                </span>
              </div>
            </div>
            <div class="chart-container">
              <canvas id="webVitalsChart"></canvas>
            </div>
          </div>
          
          <div class="dashboard-card">
            <h3>Interactions utilisateur</h3>
            <div class="metrics-grid">
              <div class="metric">
                <span class="metric-label">Temps moyen</span>
                <span class="metric-value ${this.getMetricClass(this.metrics.interaction.avg, 100, 200)}">
                  ${Math.round(this.metrics.interaction.avg)}ms
                </span>
              </div>
              <div class="metric">
                <span class="metric-label">P95</span>
                <span class="metric-value ${this.getMetricClass(this.metrics.interaction.p95, 200, 400)}">
                  ${Math.round(this.metrics.interaction.p95)}ms
                </span>
              </div>
              <div class="metric">
                <span class="metric-label">Nombre</span>
                <span class="metric-value">
                  ${this.metrics.interaction.count}
                </span>
              </div>
            </div>
            <div class="chart-container">
              <canvas id="interactionChart"></canvas>
            </div>
          </div>
          
          <div class="dashboard-card">
            <h3>Cache</h3>
            <div class="metrics-grid">
              <div class="metric">
                <span class="metric-label">Taux de succès</span>
                <span class="metric-value ${this.getMetricClass(this.metrics.cache.hitRate * 100, 80, 50, true)}">
                  ${Math.round(this.metrics.cache.hitRate * 100)}%
                </span>
              </div>
              <div class="metric">
                <span class="metric-label">Nombre de clés</span>
                <span class="metric-value">
                  ${this.metrics.cache.size}
                </span>
              </div>
            </div>
            <div class="chart-container">
              <canvas id="cacheChart"></canvas>
            </div>
          </div>
          
          <div class="dashboard-card">
            <h3>Ressources critiques</h3>
            <div class="metrics-grid">
              <div class="metric">
                <span class="metric-label">Temps moyen</span>
                <span class="metric-value ${this.getMetricClass(this.metrics.loading.critical.avg, 1000, 2000)}">
                  ${Math.round(this.metrics.loading.critical.avg)}ms
                </span>
              </div>
              <div class="metric">
                <span class="metric-label">Maximum</span>
                <span class="metric-value ${this.getMetricClass(this.metrics.loading.critical.max, 2000, 4000)}">
                  ${Math.round(this.metrics.loading.critical.max)}ms
                </span>
              </div>
            </div>
            <div class="chart-container">
              <canvas id="resourcesChart"></canvas>
            </div>
          </div>
        </div>
        
        <div class="dashboard-tables">
          <div class="dashboard-table">
            <h3>Détails des ressources</h3>
            <table>
              <thead>
                <tr>
                  <th>Ressource</th>
                  <th>Temps de chargement</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${this.generateResourcesTableRows()}
              </tbody>
            </table>
          </div>
          
          <div class="dashboard-table">
            <h3>Performance du cache</h3>
            <table>
              <thead>
                <tr>
                  <th>Clé</th>
                  <th>Succès</th>
                  <th>Échecs</th>
                  <th>Taux</th>
                </tr>
              </thead>
              <tbody>
                ${this.generateCacheTableRows()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },
  
  /**
   * Génère les lignes du tableau des ressources
   */
  generateResourcesTableRows(): string {
    let html = '';
    
    this.metrics.loading.resources.forEach((data, resource) => {
      const statusClass = this.getMetricClass(data.current, 1000, 2000);
      
      html += `
        <tr>
          <td>${resource}</td>
          <td>${Math.round(data.current)}ms</td>
          <td class="${statusClass}">${this.getStatusText(data.current, 1000, 2000)}</td>
        </tr>
      `;
    });
    
    if (html === '') {
      html = '<tr><td colspan="3">Aucune ressource suivie</td></tr>';
    }
    
    return html;
  },
  
  /**
   * Génère les lignes du tableau du cache
   */
  generateCacheTableRows(): string {
    let html = '';
    
    Object.entries(this.metrics.cache.byKey).forEach(([key, stats]) => {
      const ratePercent = Math.round(stats.rate * 100);
      const statusClass = this.getMetricClass(ratePercent, 80, 50, true);
      
      html += `
        <tr>
          <td>${key}</td>
          <td>${stats.hits}</td>
          <td>${stats.misses}</td>
          <td class="${statusClass}">${ratePercent}%</td>
        </tr>
      `;
    });
    
    if (html === '') {
      html = '<tr><td colspan="4">Aucune donnée de cache</td></tr>';
    }
    
    return html;
  },
  
  /**
   * Initialise les graphiques
   */
  initCharts(): void {
    // @ts-ignore - Chart est disponible globalement si Chart.js est chargé
    const Chart = window.Chart;
    
    // Graphique Web Vitals
    const webVitalsChart = new Chart(
      document.getElementById('webVitalsChart'),
      {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'FCP',
              data: this.metrics.webVitals.history.fcp.map(item => ({
                x: item.timestamp,
                y: item.value
              })),
              borderColor: 'rgba(54, 162, 235, 1)',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              tension: 0.4
            },
            {
              label: 'LCP',
              data: this.metrics.webVitals.history.lcp.map(item => ({
                x: item.timestamp,
                y: item.value
              })),
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              tension: 0.4
            }
          ]
        },
        options: {
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'minute'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Milliseconds'
              }
            }
          }
        }
      }
    );
    
    // Graphique des interactions
    const interactionChart = new Chart(
      document.getElementById('interactionChart'),
      {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'Moyenne',
              data: this.metrics.interaction.history.avg.map(item => ({
                x: item.timestamp,
                y: item.value
              })),
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.4
            },
            {
              label: 'P95',
              data: this.metrics.interaction.history.p95.map(item => ({
                x: item.timestamp,
                y: item.value
              })),
              borderColor: 'rgba(153, 102, 255, 1)',
              backgroundColor: 'rgba(153, 102, 255, 0.2)',
              tension: 0.4
            }
          ]
        },
        options: {
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'minute'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Milliseconds'
              }
            }
          }
        }
      }
    );
    
    // Graphique du cache
    const cacheChart = new Chart(
      document.getElementById('cacheChart'),
      {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'Taux de succès',
              data: this.metrics.cache.history.hitRate.map(item => ({
                x: item.timestamp,
                y: item.value * 100
              })),
              borderColor: 'rgba(255, 159, 64, 1)',
              backgroundColor: 'rgba(255, 159, 64, 0.2)',
              tension: 0.4
            }
          ]
        },
        options: {
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'minute'
              }
            },
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Pourcentage'
              }
            }
          }
        }
      }
    );
    
    // Graphique des ressources
    const resourcesChart = new Chart(
      document.getElementById('resourcesChart'),
      {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'Moyenne',
              data: this.metrics.loading.critical.history.avg.map(item => ({
                x: item.timestamp,
                y: item.value
              })),
              borderColor: 'rgba(201, 203, 207, 1)',
              backgroundColor: 'rgba(201, 203, 207, 0.2)',
              tension: 0.4
            },
            {
              label: 'Maximum',
              data: this.metrics.loading.critical.history.max.map(item => ({
                x: item.timestamp,
                y: item.value
              })),
              borderColor: 'rgba(255, 205, 86, 1)',
              backgroundColor: 'rgba(255, 205, 86, 0.2)',
              tension: 0.4
            }
          ]
        },
        options: {
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'minute'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Milliseconds'
              }
            }
          }
        }
      }
    );
  },
  
  /**
   * Obtient la classe CSS basée sur la valeur de la métrique
   */
  getMetricClass(value: number, warningThreshold: number, errorThreshold: number, inverse: boolean = false): string {
    if (inverse) {
      // Pour les métriques où une valeur plus élevée est meilleure (taux de succès du cache)
      if (value >= warningThreshold) {
        return 'metric-good';
      } else if (value >= errorThreshold) {
        return 'metric-warning';
      } else {
        return 'metric-error';
      }
    } else {
      // Pour les métriques où une valeur plus basse est meilleure (temps de chargement)
      if (value <= warningThreshold) {
        return 'metric-good';
      } else if (value <= errorThreshold) {
        return 'metric-warning';
      } else {
        return 'metric-error';
      }
    }
  },
  
  /**
   * Obtient le texte de statut basé sur la valeur de la métrique
   */
  getStatusText(value: number, warningThreshold: number, errorThreshold: number, inverse: boolean = false): string {
    const metricClass = this.getMetricClass(value, warningThreshold, errorThreshold, inverse);
    
    switch (metricClass) {
      case 'metric-good':
        return 'Bon';
      case 'metric-warning':
        return 'À surveiller';
      case 'metric-error':
        return 'Problématique';
      default:
        return 'Inconnu';
    }
  },
  
  /**
   * Exporte les métriques pour un rapport
   */
  exportMetrics(): object {
    return {
      timestamp: Date.now(),
      metrics: this.metrics,
      environment: ENV.environment,
      userAgent: navigator.userAgent
    };
  },
  
  /**
   * Génère et télécharge un rapport de performance
   */
  downloadReport(): void {
    const reportData = JSON.stringify(this.exportMetrics(), null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `velo-altitude-performance-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }
};

export default performanceDashboard;
