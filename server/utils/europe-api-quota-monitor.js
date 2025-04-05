/**
 * Utilitaire de monitoring des quotas d'API pour une couverture européenne
 * Vérifie que les quotas sont suffisants pour supporter le trafic à l'échelle européenne
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
const dotenv = require('dotenv');
const logger = require('../config/logger');

// Charger les variables d'environnement
dotenv.config();

// Configuration des seuils d'alerte pour l'échelle européenne
const QUOTA_THRESHOLDS = {
  // Mapbox - Cartographie (besoin élevé pour l'Europe entière)
  mapbox: {
    daily: {
      warning: 400000, // 80% de 500,000
      critical: 450000 // 90% de 500,000
    },
    monthly: {
      warning: 800000, // 80% de 1,000,000
      critical: 900000 // 90% de 1,000,000
    }
  },
  // OpenWeatherMap - Données météo (besoin modéré à élevé)
  openweathermap: {
    daily: {
      warning: 8000, // 80% de 10,000
      critical: 9000 // 90% de 10,000
    },
    monthly: {
      warning: 240000, // 80% de 300,000
      critical: 270000 // 90% de 300,000
    }
  },
  // OpenRouteService - Calcul d'itinéraires (besoin élevé)
  openrouteservice: {
    daily: {
      warning: 16000, // 80% de 20,000
      critical: 18000 // 90% de 20,000
    },
    monthly: {
      warning: 400000, // 80% de 500,000
      critical: 450000 // 90% de 500,000
    }
  },
  // Strava - Intégration activités (besoin modéré)
  strava: {
    daily: {
      warning: 8000, // 80% de 10,000
      critical: 9000 // 90% de 10,000
    },
    fifteenMinute: {
      warning: 80, // 80% de 100
      critical: 90 // 90% de 100
    }
  },
  // OpenAI - Coach virtuel (besoin faible à modéré)
  openai: {
    daily: {
      warning: 80000, // 80% de 100,000 tokens
      critical: 90000 // 90% de 100,000 tokens
    },
    minute: {
      warning: 8, // 80% de 10
      critical: 9 // 90% de 10
    }
  },
  // Claude - Coach virtuel alternatif (besoin faible à modéré)
  claude: {
    daily: {
      warning: 80000, // 80% de 100,000 tokens
      critical: 90000 // 90% de 100,000 tokens
    },
    minute: {
      warning: 4, // 80% de 5
      critical: 4.5 // 90% de 5
    }
  }
};

// Estimation de l'utilisation par pays (facteur multiplicateur par rapport à la France)
const COUNTRY_USAGE_FACTORS = {
  'fr': 1.0,   // France (référence)
  'de': 1.2,   // Allemagne (20% plus d'utilisateurs)
  'it': 0.8,   // Italie
  'es': 0.7,   // Espagne
  'be': 0.3,   // Belgique
  'ch': 0.2,   // Suisse
  'nl': 0.4,   // Pays-Bas
  'at': 0.2,   // Autriche
  'uk': 1.0,   // Royaume-Uni
  'other': 1.0 // Autres pays européens
};

// Total du facteur d'utilisation pour l'Europe
const TOTAL_EUROPE_FACTOR = Object.values(COUNTRY_USAGE_FACTORS).reduce((sum, factor) => sum + factor, 0);

/**
 * Vérifie les quotas d'API pour une couverture européenne
 * @param {Object} options - Options de vérification
 * @returns {Promise<Object>} Résultat de la vérification
 */
async function checkApiQuotasForEurope(options = {}) {
  const results = {
    timestamp: new Date(),
    status: 'ok',
    apis: {},
    recommendations: []
  };
  
  try {
    // Vérifier Mapbox
    await checkMapboxQuota(results);
    
    // Vérifier OpenWeatherMap
    await checkOpenWeatherMapQuota(results);
    
    // Vérifier OpenRouteService
    await checkOpenRouteServiceQuota(results);
    
    // Vérifier Strava
    await checkStravaQuota(results);
    
    // Vérifier OpenAI
    await checkOpenAIQuota(results);
    
    // Vérifier Claude
    await checkClaudeQuota(results);
    
    // Déterminer le statut global
    if (Object.values(results.apis).some(api => api.status === 'critical')) {
      results.status = 'critical';
    } else if (Object.values(results.apis).some(api => api.status === 'warning')) {
      results.status = 'warning';
    }
    
    // Générer des recommandations
    generateRecommendations(results);
    
    // Afficher les résultats si demandé
    if (options.display) {
      displayResults(results);
    }
    
    // Sauvegarder les résultats si demandé
    if (options.save) {
      saveResults(results, options.outputPath);
    }
    
    return results;
  } catch (error) {
    logger.error(`Erreur lors de la vérification des quotas API: ${error.message}`);
    results.status = 'error';
    results.error = error.message;
    return results;
  }
}

/**
 * Vérifie les quotas Mapbox pour une couverture européenne
 * @param {Object} results - Objet de résultats à mettre à jour
 */
async function checkMapboxQuota(results) {
  try {
    // Mapbox n'a pas d'API pour vérifier les quotas, estimation basée sur l'utilisation
    const estimatedDailyUsage = 50000 * TOTAL_EUROPE_FACTOR; // Estimation pour l'Europe
    const estimatedMonthlyUsage = estimatedDailyUsage * 30;
    
    const mapboxStatus = {
      name: 'Mapbox',
      status: 'ok',
      quotas: {
        daily: {
          limit: 500000,
          estimated: Math.round(estimatedDailyUsage),
          percentUsed: Math.round((estimatedDailyUsage / 500000) * 100)
        },
        monthly: {
          limit: 1000000,
          estimated: Math.round(estimatedMonthlyUsage),
          percentUsed: Math.round((estimatedMonthlyUsage / 1000000) * 100)
        }
      },
      recommendations: []
    };
    
    // Vérifier les seuils
    if (estimatedMonthlyUsage >= QUOTA_THRESHOLDS.mapbox.monthly.critical) {
      mapboxStatus.status = 'critical';
      mapboxStatus.recommendations.push('Passer au plan Mapbox Enterprise immédiatement');
    } else if (estimatedMonthlyUsage >= QUOTA_THRESHOLDS.mapbox.monthly.warning) {
      mapboxStatus.status = 'warning';
      mapboxStatus.recommendations.push('Planifier une mise à niveau vers le plan Mapbox Enterprise');
    }
    
    results.apis.mapbox = mapboxStatus;
  } catch (error) {
    results.apis.mapbox = {
      name: 'Mapbox',
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Vérifie les quotas OpenWeatherMap pour une couverture européenne
 * @param {Object} results - Objet de résultats à mettre à jour
 */
async function checkOpenWeatherMapQuota(results) {
  try {
    // OpenWeatherMap n'a pas d'API pour vérifier les quotas, estimation basée sur l'utilisation
    const estimatedDailyUsage = 1000 * TOTAL_EUROPE_FACTOR; // Estimation pour l'Europe
    const estimatedMonthlyUsage = estimatedDailyUsage * 30;
    
    const openweathermapStatus = {
      name: 'OpenWeatherMap',
      status: 'ok',
      quotas: {
        daily: {
          limit: 10000,
          estimated: Math.round(estimatedDailyUsage),
          percentUsed: Math.round((estimatedDailyUsage / 10000) * 100)
        },
        monthly: {
          limit: 300000,
          estimated: Math.round(estimatedMonthlyUsage),
          percentUsed: Math.round((estimatedMonthlyUsage / 300000) * 100)
        }
      },
      recommendations: []
    };
    
    // Vérifier les seuils
    if (estimatedDailyUsage >= QUOTA_THRESHOLDS.openweathermap.daily.critical) {
      openweathermapStatus.status = 'critical';
      openweathermapStatus.recommendations.push('Passer au plan OpenWeatherMap Enterprise immédiatement');
    } else if (estimatedDailyUsage >= QUOTA_THRESHOLDS.openweathermap.daily.warning) {
      openweathermapStatus.status = 'warning';
      openweathermapStatus.recommendations.push('Planifier une mise à niveau vers le plan OpenWeatherMap Enterprise');
    }
    
    results.apis.openweathermap = openweathermapStatus;
  } catch (error) {
    results.apis.openweathermap = {
      name: 'OpenWeatherMap',
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Vérifie les quotas OpenRouteService pour une couverture européenne
 * @param {Object} results - Objet de résultats à mettre à jour
 */
async function checkOpenRouteServiceQuota(results) {
  try {
    // Tenter de récupérer les informations de quota depuis l'API
    let quotaInfo = null;
    
    try {
      const response = await axios.get(`https://api.openrouteservice.org/v2/status?api_key=${process.env.OPENROUTE_API_KEY}`);
      quotaInfo = response.data;
    } catch (error) {
      // En cas d'erreur, utiliser une estimation
      logger.warn(`Impossible de récupérer les quotas OpenRouteService: ${error.message}`);
    }
    
    // Estimation basée sur l'utilisation ou les données réelles
    const estimatedDailyUsage = quotaInfo ? 
      (quotaInfo.rate_limit.day - quotaInfo.rate_limit.remaining_day) * TOTAL_EUROPE_FACTOR :
      2000 * TOTAL_EUROPE_FACTOR;
    
    const estimatedMonthlyUsage = estimatedDailyUsage * 30;
    
    const openrouteserviceStatus = {
      name: 'OpenRouteService',
      status: 'ok',
      quotas: {
        daily: {
          limit: 20000,
          estimated: Math.round(estimatedDailyUsage),
          percentUsed: Math.round((estimatedDailyUsage / 20000) * 100),
          actual: quotaInfo ? (quotaInfo.rate_limit.day - quotaInfo.rate_limit.remaining_day) : null
        },
        monthly: {
          limit: 500000,
          estimated: Math.round(estimatedMonthlyUsage),
          percentUsed: Math.round((estimatedMonthlyUsage / 500000) * 100)
        }
      },
      recommendations: []
    };
    
    // Vérifier les seuils
    if (estimatedDailyUsage >= QUOTA_THRESHOLDS.openrouteservice.daily.critical) {
      openrouteserviceStatus.status = 'critical';
      openrouteserviceStatus.recommendations.push('Passer au plan OpenRouteService Premium immédiatement');
    } else if (estimatedDailyUsage >= QUOTA_THRESHOLDS.openrouteservice.daily.warning) {
      openrouteserviceStatus.status = 'warning';
      openrouteserviceStatus.recommendations.push('Planifier une mise à niveau vers le plan OpenRouteService Premium');
    }
    
    results.apis.openrouteservice = openrouteserviceStatus;
  } catch (error) {
    results.apis.openrouteservice = {
      name: 'OpenRouteService',
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Vérifie les quotas Strava pour une couverture européenne
 * @param {Object} results - Objet de résultats à mettre à jour
 */
async function checkStravaQuota(results) {
  try {
    // Tenter de récupérer les informations de quota depuis l'API
    let quotaInfo = null;
    
    try {
      const response = await axios.get('https://www.strava.com/api/v3/athlete', {
        headers: { 'Authorization': `Bearer ${process.env.STRAVA_ACCESS_TOKEN}` }
      });
      
      quotaInfo = {
        limit: parseInt(response.headers['x-ratelimit-limit'] || '100'),
        usage: parseInt(response.headers['x-ratelimit-usage'] || '0')
      };
    } catch (error) {
      // En cas d'erreur, utiliser une estimation
      logger.warn(`Impossible de récupérer les quotas Strava: ${error.message}`);
    }
    
    // Estimation basée sur l'utilisation ou les données réelles
    const estimatedDailyUsage = 1000 * TOTAL_EUROPE_FACTOR;
    const estimatedFifteenMinuteUsage = quotaInfo ? 
      quotaInfo.usage * TOTAL_EUROPE_FACTOR :
      10 * TOTAL_EUROPE_FACTOR;
    
    const stravaStatus = {
      name: 'Strava',
      status: 'ok',
      quotas: {
        fifteenMinute: {
          limit: 100,
          estimated: Math.round(estimatedFifteenMinuteUsage),
          percentUsed: Math.round((estimatedFifteenMinuteUsage / 100) * 100),
          actual: quotaInfo ? quotaInfo.usage : null
        },
        daily: {
          limit: 10000,
          estimated: Math.round(estimatedDailyUsage),
          percentUsed: Math.round((estimatedDailyUsage / 10000) * 100)
        }
      },
      recommendations: []
    };
    
    // Vérifier les seuils
    if (estimatedFifteenMinuteUsage >= QUOTA_THRESHOLDS.strava.fifteenMinute.critical) {
      stravaStatus.status = 'critical';
      stravaStatus.recommendations.push('Implémenter immédiatement un système de file d\'attente pour les requêtes Strava');
    } else if (estimatedFifteenMinuteUsage >= QUOTA_THRESHOLDS.strava.fifteenMinute.warning) {
      stravaStatus.status = 'warning';
      stravaStatus.recommendations.push('Optimiser les requêtes Strava et mettre en place un système de rate limiting');
    }
    
    if (estimatedDailyUsage >= QUOTA_THRESHOLDS.strava.daily.critical) {
      stravaStatus.status = 'critical';
      stravaStatus.recommendations.push('Contacter Strava pour négocier des limites plus élevées');
    } else if (estimatedDailyUsage >= QUOTA_THRESHOLDS.strava.daily.warning) {
      stravaStatus.status = 'warning';
      stravaStatus.recommendations.push('Planifier une négociation avec Strava pour des limites plus élevées');
    }
    
    results.apis.strava = stravaStatus;
  } catch (error) {
    results.apis.strava = {
      name: 'Strava',
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Vérifie les quotas OpenAI pour une couverture européenne
 * @param {Object} results - Objet de résultats à mettre à jour
 */
async function checkOpenAIQuota(results) {
  // OpenAI n'a pas d'API pour vérifier les quotas, estimation basée sur l'utilisation
  try {
    const estimatedDailyTokenUsage = 10000 * TOTAL_EUROPE_FACTOR;
    const estimatedMinuteUsage = 1 * TOTAL_EUROPE_FACTOR;
    
    const openaiStatus = {
      name: 'OpenAI',
      status: 'ok',
      quotas: {
        daily: {
          limit: 100000,
          estimated: Math.round(estimatedDailyTokenUsage),
          percentUsed: Math.round((estimatedDailyTokenUsage / 100000) * 100)
        },
        minute: {
          limit: 10,
          estimated: Math.round(estimatedMinuteUsage * 10) / 10,
          percentUsed: Math.round((estimatedMinuteUsage / 10) * 100)
        }
      },
      recommendations: []
    };
    
    // Vérifier les seuils
    if (estimatedDailyTokenUsage >= QUOTA_THRESHOLDS.openai.daily.critical) {
      openaiStatus.status = 'critical';
      openaiStatus.recommendations.push('Augmenter immédiatement la limite de tokens OpenAI');
    } else if (estimatedDailyTokenUsage >= QUOTA_THRESHOLDS.openai.daily.warning) {
      openaiStatus.status = 'warning';
      openaiStatus.recommendations.push('Planifier une augmentation de la limite de tokens OpenAI');
    }
    
    results.apis.openai = openaiStatus;
  } catch (error) {
    results.apis.openai = {
      name: 'OpenAI',
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Vérifie les quotas Claude pour une couverture européenne
 * @param {Object} results - Objet de résultats à mettre à jour
 */
async function checkClaudeQuota(results) {
  // Claude n'a pas d'API pour vérifier les quotas, estimation basée sur l'utilisation
  try {
    const estimatedDailyTokenUsage = 5000 * TOTAL_EUROPE_FACTOR;
    const estimatedMinuteUsage = 0.5 * TOTAL_EUROPE_FACTOR;
    
    const claudeStatus = {
      name: 'Claude',
      status: 'ok',
      quotas: {
        daily: {
          limit: 100000,
          estimated: Math.round(estimatedDailyTokenUsage),
          percentUsed: Math.round((estimatedDailyTokenUsage / 100000) * 100)
        },
        minute: {
          limit: 5,
          estimated: Math.round(estimatedMinuteUsage * 10) / 10,
          percentUsed: Math.round((estimatedMinuteUsage / 5) * 100)
        }
      },
      recommendations: []
    };
    
    // Vérifier les seuils
    if (estimatedDailyTokenUsage >= QUOTA_THRESHOLDS.claude.daily.critical) {
      claudeStatus.status = 'critical';
      claudeStatus.recommendations.push('Augmenter immédiatement la limite de tokens Claude');
    } else if (estimatedDailyTokenUsage >= QUOTA_THRESHOLDS.claude.daily.warning) {
      claudeStatus.status = 'warning';
      claudeStatus.recommendations.push('Planifier une augmentation de la limite de tokens Claude');
    }
    
    results.apis.claude = claudeStatus;
  } catch (error) {
    results.apis.claude = {
      name: 'Claude',
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Génère des recommandations globales basées sur les résultats
 * @param {Object} results - Résultats de la vérification
 */
function generateRecommendations(results) {
  // Recommandations générales pour l'échelle européenne
  results.recommendations.push('Mettre en place un système de monitoring des quotas API en temps réel');
  
  if (results.status === 'critical') {
    results.recommendations.push('URGENT: Mettre à niveau immédiatement les plans API pour supporter la couverture européenne');
    results.recommendations.push('Implémenter un système de dégradation gracieuse des fonctionnalités en cas de dépassement de quota');
  } else if (results.status === 'warning') {
    results.recommendations.push('Planifier la mise à niveau des plans API dans les 30 jours');
    results.recommendations.push('Optimiser l\'utilisation du cache pour réduire les appels API');
  }
  
  // Recommandations spécifiques par API
  let needsCachingOptimization = false;
  let needsRateLimiting = false;
  
  Object.values(results.apis).forEach(api => {
    if (api.status === 'warning' || api.status === 'critical') {
      needsCachingOptimization = true;
      
      if (api.name === 'Mapbox' || api.name === 'OpenWeatherMap' || api.name === 'OpenRouteService') {
        needsRateLimiting = true;
      }
    }
  });
  
  if (needsCachingOptimization) {
    results.recommendations.push('Optimiser la stratégie de cache Redis pour réduire les appels API');
    results.recommendations.push('Augmenter les TTL du cache pour les données statiques (cols, segments)');
  }
  
  if (needsRateLimiting) {
    results.recommendations.push('Implémenter un système de rate limiting intelligent avec priorité des requêtes');
    results.recommendations.push('Mettre en place un système de file d\'attente pour les requêtes non critiques');
  }
}

/**
 * Affiche les résultats dans la console
 * @param {Object} results - Résultats de la vérification
 */
function displayResults(results) {
  console.log('\n=== Vérification des quotas API pour une couverture européenne ===\n');
  
  // Afficher le statut global
  const statusColor = results.status === 'ok' ? 'green' : (results.status === 'warning' ? 'yellow' : 'red');
  console.log(`Statut global: ${chalk[statusColor](results.status.toUpperCase())}\n`);
  
  // Afficher les résultats par API
  console.log('Résultats par API:');
  Object.values(results.apis).forEach(api => {
    const apiStatusColor = api.status === 'ok' ? 'green' : (api.status === 'warning' ? 'yellow' : 'red');
    console.log(`- ${api.name}: ${chalk[apiStatusColor](api.status.toUpperCase())}`);
    
    if (api.quotas) {
      Object.entries(api.quotas).forEach(([quotaType, quota]) => {
        console.log(`  ${quotaType}: ${quota.estimated}/${quota.limit} (${quota.percentUsed}%)`);
      });
    }
    
    if (api.error) {
      console.log(`  Erreur: ${chalk.red(api.error)}`);
    }
    
    if (api.recommendations && api.recommendations.length > 0) {
      console.log(`  Recommandations:`);
      api.recommendations.forEach(rec => {
        console.log(`    - ${rec}`);
      });
    }
    
    console.log('');
  });
  
  // Afficher les recommandations globales
  console.log('Recommandations globales:');
  results.recommendations.forEach(rec => {
    console.log(`- ${rec}`);
  });
  
  console.log('\n=== Fin de la vérification ===\n');
}

/**
 * Sauvegarde les résultats dans un fichier JSON
 * @param {Object} results - Résultats de la vérification
 * @param {string} outputPath - Chemin du fichier de sortie
 */
function saveResults(results, outputPath) {
  const defaultPath = path.resolve(process.cwd(), 'logs/api-quota-europe-check.json');
  const filePath = outputPath || defaultPath;
  
  // Créer le répertoire si nécessaire
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Sauvegarder les résultats
  fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
  console.log(`Résultats sauvegardés dans ${filePath}`);
}

// Exporter les fonctions
module.exports = {
  checkApiQuotasForEurope,
  QUOTA_THRESHOLDS,
  COUNTRY_USAGE_FACTORS,
  TOTAL_EUROPE_FACTOR
};

// Exécuter le script si appelé directement
if (require.main === module) {
  checkApiQuotasForEurope({ display: true, save: true })
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error(chalk.red(`Erreur: ${error.message}`));
      process.exit(1);
    });
}
