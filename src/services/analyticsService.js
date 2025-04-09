/**
 * Service d'analyses et métriques SEO pour Velo-Altitude
 * 
 * Ce service permet de suivre les performances SEO du site et
 * d'intégrer plusieurs outils d'analyse dans une interface unifiée.
 */

import { ENV } from '../config/environment';

// Configuration des outils d'analyse
const ANALYTICS_CONFIG = {
  googleAnalyticsId: ENV.analytics.googleAnalyticsId,
  googleSearchConsole: ENV.analytics.googleSearchConsole,
  matomoUrl: ENV.analytics.matomoUrl,
  matomoSiteId: ENV.analytics.matomoSiteId,
  dataLayerName: ENV.analytics.dataLayerName
};

/**
 * Initialise les outils d'analyse
 */
export const initializeAnalytics = () => {
  // Initialisation de Google Analytics
  initGoogleAnalytics();
  
  // Initialisation de Matomo si configuré
  if (ANALYTICS_CONFIG.matomoUrl && ANALYTICS_CONFIG.matomoSiteId) {
    initMatomo();
  }
  
  console.log('Services d\'analyse initialisés');
};

/**
 * Initialise Google Analytics
 */
const initGoogleAnalytics = () => {
  // Création du script GA
  if (!window[ANALYTICS_CONFIG.dataLayerName]) {
    window[ANALYTICS_CONFIG.dataLayerName] = [];
  }
  
  window.gtag = function() {
    window[ANALYTICS_CONFIG.dataLayerName].push(arguments);
  };
  
  window.gtag('js', new Date());
  window.gtag('config', ANALYTICS_CONFIG.googleAnalyticsId, {
    send_page_view: false, // On désactive l'envoi automatique pour le gérer manuellement
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure'
  });
  
  // Insertion du script GA
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.googleAnalyticsId}`;
  document.head.appendChild(script);
};

/**
 * Initialise Matomo
 */
const initMatomo = () => {
  window._paq = window._paq || [];
  window._paq.push(['trackPageView']);
  window._paq.push(['enableLinkTracking']);
  
  // Insertion du script Matomo
  const u = ANALYTICS_CONFIG.matomoUrl;
  window._paq.push(['setTrackerUrl', u + 'matomo.php']);
  window._paq.push(['setSiteId', ANALYTICS_CONFIG.matomoSiteId]);
  
  const script = document.createElement('script');
  script.async = true;
  script.src = u + 'matomo.js';
  document.head.appendChild(script);
};

/**
 * Enregistre une visite de page
 * @param {string} path - Chemin de la page visitée
 * @param {string} title - Titre de la page
 * @param {Object} customDimensions - Dimensions personnalisées
 */
export const trackPageView = (path, title, customDimensions = {}) => {
  // Google Analytics
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
      page_location: window.location.origin + path,
      ...customDimensions
    });
  }
  
  // Matomo
  if (window._paq) {
    window._paq.push(['setCustomUrl', path]);
    window._paq.push(['setDocumentTitle', title]);
    
    // Ajouter les dimensions personnalisées
    Object.entries(customDimensions).forEach(([key, value]) => {
      window._paq.push(['setCustomDimension', key, value]);
    });
    
    window._paq.push(['trackPageView']);
  }
};

/**
 * Suit un événement personnalisé
 * @param {string} category - Catégorie de l'événement
 * @param {string} action - Action effectuée
 * @param {string} label - Libellé (optionnel)
 * @param {number} value - Valeur (optionnel)
 */
export const trackEvent = (category, action, label = null, value = null) => {
  // Google Analytics
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
  
  // Matomo
  if (window._paq) {
    window._paq.push(['trackEvent', category, action, label, value]);
  }
};

/**
 * Suit les conversions (inscriptions, achats, etc.)
 * @param {string} type - Type de conversion
 * @param {Object} data - Données associées
 */
export const trackConversion = (type, data = {}) => {
  // Google Analytics - Événement de conversion
  if (window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: `${ANALYTICS_CONFIG.googleAnalyticsId}/${type}`,
      ...data
    });
  }
  
  // Matomo - Goal
  if (window._paq) {
    // Mapping des types de conversion aux ID de goals Matomo
    const goalMapping = {
      'sign_up': 1,
      'newsletter': 2,
      'challenge_created': 3,
      'challenge_completed': 4
    };
    
    if (goalMapping[type]) {
      window._paq.push(['trackGoal', goalMapping[type], data.value || 0]);
    }
  }
};

/**
 * Suit les interactions utilisateur avec les contenus SEO
 * @param {string} contentType - Type de contenu (col, programme, etc.)
 * @param {string} contentId - ID du contenu
 * @param {string} interactionType - Type d'interaction
 */
export const trackSEOInteraction = (contentType, contentId, interactionType) => {
  trackEvent('seo_content', interactionType, `${contentType}:${contentId}`);
  
  // Suivi spécifique pour certaines interactions importantes pour le SEO
  switch (interactionType) {
    case 'scroll_depth_100':
      // L'utilisateur a lu tout le contenu
      trackEvent('engagement', 'full_content_viewed', contentType);
      break;
    case 'time_on_page_2min':
      // L'utilisateur est resté 2 minutes sur la page
      trackEvent('engagement', 'significant_time_spent', contentType);
      break;
    case 'click_related':
      // L'utilisateur a cliqué sur du contenu connexe
      trackEvent('navigation', 'internal_link_click', 'related_content');
      break;
    case 'social_share':
      // L'utilisateur a partagé le contenu
      trackConversion('content_share', { content_type: contentType, content_id: contentId });
      break;
  }
};

/**
 * Suit les performances SEO et les diffuse aux outils d'analyse
 * @param {Object} metrics - Métriques de performance
 */
export const trackSEOPerformance = (metrics) => {
  // Metrics contient des données comme LCP, FID, CLS, etc.
  if (window.gtag) {
    window.gtag('event', 'web_vitals', {
      event_category: 'Web Vitals',
      event_label: metrics.name,
      value: Math.round(metrics.value),
      metric_id: metrics.id,
      metric_value: metrics.value,
      metric_delta: metrics.delta
    });
  }
  
  // Matomo
  if (window._paq) {
    window._paq.push(['trackEvent', 'Performance', metrics.name, metrics.id, Math.round(metrics.value)]);
  }
};

/**
 * Collecte et envoie les métriques Core Web Vitals
 */
export const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry); // Cumulative Layout Shift
      getFID(onPerfEntry); // First Input Delay
      getFCP(onPerfEntry); // First Contentful Paint
      getLCP(onPerfEntry); // Largest Contentful Paint
      getTTFB(onPerfEntry); // Time to First Byte
    });
  }
};

/**
 * Génère et envoie un rapport de performances SEO
 * @returns {Promise<Object>} - Résultats du rapport
 */
export const generateSEOReport = async () => {
  // Simulation d'une analyse SEO
  const seoReport = {
    timestamp: new Date().toISOString(),
    scores: {
      performance: Math.round(Math.random() * 30 + 70), // 70-100
      accessibility: Math.round(Math.random() * 20 + 80), // 80-100
      bestPractices: Math.round(Math.random() * 15 + 85), // 85-100
      seo: Math.round(Math.random() * 10 + 90), // 90-100
    },
    insights: {
      improvement_areas: [],
      strengths: []
    }
  };
  
  // Envoi des données pour analyse
  trackEvent('seo_report', 'generated', 'site_wide', null);
  
  return seoReport;
};

export default {
  initializeAnalytics,
  trackPageView,
  trackEvent,
  trackConversion,
  trackSEOInteraction,
  trackSEOPerformance,
  reportWebVitals,
  generateSEOReport
};
