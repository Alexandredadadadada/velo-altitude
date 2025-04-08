/**
 * Utilitaire de surveillance de performance
 * 
 * Ce module intègre et configure la collecte automatique des métriques Web Vitals
 * et autres indicateurs de performance spécifiques à Velo-Altitude.
 */

import { onCLS, onLCP, onINP, onFID, onTTFB } from 'web-vitals';

// Liste des métriques à surveiller (utilisée pour les rapports et le filtrage)
const WEB_VITALS = ['CLS', 'LCP', 'INP', 'FID', 'TTFB'];

// Budgets de performance définis dans PERFORMANCE_BUDGETS.md
const performanceBudgets = {
  LCP: 2500, // 2.5s
  INP: 200,  // 200ms
  CLS: 0.1,  // 0.1 score
  FID: 100,  // 100ms (legacy mais toujours utile)
  TTFB: 800, // 800ms
};

/**
 * Formatte une métrique pour l'affichage et le reporting
 * @param {Object} metric Métrique Web Vitals
 * @returns {Object} Métrique formatée avec statut
 */
const formatMetric = (metric) => {
  const name = metric.name;
  const value = metric.value;
  const budget = performanceBudgets[name];
  
  let status = 'good';
  
  // Déterminer le statut de la métrique en fonction du budget
  if (name === 'CLS') {
    if (value > budget) {
      status = 'poor';
    } else if (value > budget * 0.5) {
      status = 'needs-improvement';
    }
  } else {
    if (value > budget) {
      status = 'poor';
    } else if (value > budget * 0.8) {
      status = 'needs-improvement';
    }
  }
  
  return {
    name,
    value: name === 'CLS' ? value.toFixed(3) : Math.round(value),
    valueRaw: value,
    status,
    delta: metric.delta,
    id: metric.id,
    budget,
    entries: metric.entries
  };
};

/**
 * Enregistre les métriques de performance (console, analytics, etc.)
 * @param {Object} metric Métrique Web Vitals
 */
const reportWebVitals = (metric) => {
  const formattedMetric = formatMetric(metric);
  
  // 1. Log dans la console pour le développement
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${metric.name}: `, formattedMetric);
  }
  
  // 2. Envoyer à l'analytics (quand configuré)
  if (window.gtag) {
    window.gtag('event', 'web_vitals', {
      event_category: 'Web Vitals',
      event_action: metric.name,
      event_value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }
  
  // 3. Stockage local pour la visualisation dans l'interface de dev
  storeMetric(formattedMetric);
  
  // 4. Alerter en cas de dépassement critique
  if (formattedMetric.status === 'poor') {
    console.warn(`[Performance Warning] ${metric.name} (${formattedMetric.value}) exceeds budget (${formattedMetric.budget})`);
  }
};

/**
 * Stocke les métriques dans le localStorage pour utilisation ultérieure
 * @param {Object} metric Métrique formatée
 */
const storeMetric = (metric) => {
  try {
    // Récupérer les métriques existantes
    const storedMetrics = JSON.parse(localStorage.getItem('velo-altitude-metrics') || '{}');
    
    // Ajouter la nouvelle métrique
    storedMetrics[metric.name] = {
      ...metric,
      timestamp: Date.now()
    };
    
    // Sauvegarder les métriques mises à jour
    localStorage.setItem('velo-altitude-metrics', JSON.stringify(storedMetrics));
  } catch (e) {
    console.error('Could not store performance metrics:', e);
  }
};

/**
 * Démarre le monitoring des métriques Web Vitals
 */
export const initWebVitalsMonitoring = () => {
  // Enregistrer les métriques Web Vitals standards
  onCLS(reportWebVitals);
  onLCP(reportWebVitals);
  onINP(reportWebVitals);
  onFID(reportWebVitals);
  onTTFB(reportWebVitals);
  
  console.log('[Performance] Web Vitals monitoring initialized');
};

/**
 * Mesure de performance personnalisée pour les éléments spécifiques de Velo-Altitude
 * @param {string} name Nom de la métrique
 * @param {function} callback Fonction à mesurer
 * @returns {any} Résultat de la fonction callback
 */
export const measurePerformance = (name, callback) => {
  const startTime = performance.now();
  const startMark = `${name}_start`;
  const endMark = `${name}_end`;
  const measureName = `${name}_duration`;
  
  // Marquer le début
  performance.mark(startMark);
  
  try {
    // Exécuter la fonction
    const result = callback();
    
    // S'il s'agit d'une promesse, mesurer lorsqu'elle se résout
    if (result instanceof Promise) {
      return result.finally(() => {
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
        
        const duration = performance.now() - startTime;
        console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      });
    }
    
    // Sinon, mesurer immédiatement
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
    
    const duration = performance.now() - startTime;
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    
    return result;
  } catch (error) {
    // En cas d'erreur, enregistrer quand même la mesure
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
    
    const duration = performance.now() - startTime;
    console.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms:`, error);
    
    throw error;
  }
};

/**
 * Mesure les performances de rendu 3D
 * @param {Object} renderer Renderer WebGL/Three.js
 * @returns {Object} Objet pour arrêter la surveillance
 */
export const monitor3DPerformance = (renderer) => {
  if (!renderer) {
    console.warn('[Performance] Cannot monitor 3D performance: no renderer provided');
    return { stop: () => {} };
  }
  
  let frameCount = 0;
  let lastTime = performance.now();
  let fps = 0;
  let running = true;
  
  // Fonction de mesure FPS
  const measureFPS = () => {
    if (!running) return;
    
    frameCount++;
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;
    
    // Mettre à jour le FPS chaque seconde
    if (deltaTime >= 1000) {
      fps = (frameCount * 1000) / deltaTime;
      
      // Stocker dans localStorage pour l'interface de dev
      try {
        const storedMetrics = JSON.parse(localStorage.getItem('velo-altitude-metrics') || '{}');
        storedMetrics.FPS = {
          name: 'FPS',
          value: Math.round(fps),
          valueRaw: fps,
          timestamp: Date.now(),
          status: fps >= 50 ? 'good' : (fps >= 30 ? 'needs-improvement' : 'poor')
        };
        localStorage.setItem('velo-altitude-metrics', JSON.stringify(storedMetrics));
      } catch (e) {
        console.error('Could not store FPS metrics:', e);
      }
      
      // Alerter si les FPS sont trop bas
      if (fps < 30) {
        console.warn(`[Performance Warning] Low frame rate: ${Math.round(fps)} FPS`);
      }
      
      // Réinitialiser le compteur
      frameCount = 0;
      lastTime = currentTime;
    }
    
    // Continuer à mesurer
    requestAnimationFrame(measureFPS);
  };
  
  // Démarrer la mesure
  measureFPS();
  
  return {
    stop: () => {
      running = false;
    },
    getFPS: () => fps
  };
};

/**
 * Récupère les métriques stockées
 * @returns {Object} Toutes les métriques collectées
 */
export const getStoredMetrics = () => {
  try {
    return JSON.parse(localStorage.getItem('velo-altitude-metrics') || '{}');
  } catch (e) {
    console.error('Could not retrieve performance metrics:', e);
    return {};
  }
};

/**
 * Interface de développement pour visualiser et tester les performances
 * (À utiliser uniquement en développement)
 */
export const createDevPerformancePanel = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  // Créer le panneau uniquement en mode développement
  const panel = document.createElement('div');
  panel.id = 'dev-performance-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px;
    font-family: monospace;
    font-size: 12px;
    border-radius: 4px;
    z-index: 9999;
    max-width: 300px;
    max-height: 400px;
    overflow: auto;
  `;
  
  // Ajouter au document
  document.body.appendChild(panel);
  
  // Fonction de mise à jour
  const updatePanel = () => {
    const metrics = getStoredMetrics();
    panel.innerHTML = '<h3>Performance Metrics</h3>';
    
    Object.values(metrics).forEach(metric => {
      const color = metric.status === 'good' ? 'green' : (metric.status === 'needs-improvement' ? 'orange' : 'red');
      panel.innerHTML += `<div>${metric.name}: <span style="color: ${color}">${metric.value}</span></div>`;
    });
  };
  
  // Mettre à jour périodiquement
  setInterval(updatePanel, 1000);
  
  return panel;
};

/**
 * Exporte les fonctions principales pour l'initialisation et l'utilisation
 */
const performanceMonitoring = {
  initWebVitalsMonitoring,
  measurePerformance,
  monitor3DPerformance,
  getStoredMetrics,
  createDevPerformancePanel,
  WEB_VITALS
};

export default performanceMonitoring;
