/**
 * Tableau de Bord API - Dashboard-Velo
 * Script principal pour la gestion du tableau de bord des quotas API
 * Plateforme européenne de cyclisme
 */

// Configuration
const API_BASE_URL = '/api/dashboard';
const REFRESH_INTERVAL = 60000; // 1 minute
let authToken = localStorage.getItem('auth_token') || null;
let refreshTimers = {};
let selectedRegion = 'all'; // Région sélectionnée (par défaut: toutes)
let selectedCountry = 'all'; // Pays sélectionné (par défaut: tous)

// Liste des pays européens
const EUROPEAN_COUNTRIES = [
  { code: 'all', name: 'Tous les pays' },
  { code: 'fr', name: 'France' },
  { code: 'de', name: 'Allemagne' },
  { code: 'it', name: 'Italie' },
  { code: 'es', name: 'Espagne' },
  { code: 'be', name: 'Belgique' },
  { code: 'nl', name: 'Pays-Bas' },
  { code: 'ch', name: 'Suisse' },
  { code: 'at', name: 'Autriche' },
  { code: 'gb', name: 'Royaume-Uni' },
  { code: 'ie', name: 'Irlande' },
  { code: 'dk', name: 'Danemark' },
  { code: 'se', name: 'Suède' },
  { code: 'no', name: 'Norvège' },
  { code: 'fi', name: 'Finlande' },
  { code: 'pt', name: 'Portugal' },
  { code: 'pl', name: 'Pologne' },
  { code: 'cz', name: 'République tchèque' },
  { code: 'sk', name: 'Slovaquie' },
  { code: 'hu', name: 'Hongrie' }
];

// Régions européennes
const EUROPEAN_REGIONS = [
  { code: 'all', name: 'Toutes les régions' },
  { code: 'western', name: 'Europe occidentale' },
  { code: 'eastern', name: 'Europe orientale' },
  { code: 'northern', name: 'Europe du Nord' },
  { code: 'southern', name: 'Europe du Sud' },
  { code: 'central', name: 'Europe centrale' }
];

// État global
const state = {
  status: {},
  analytics: {},
  realTime: {},
  recommendations: {},
  predictions: {},
  charts: {}
};

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  // Vérifier l'authentification
  checkAuthentication()
    .then(() => {
      // Initialiser les composants du tableau de bord
      initializeDashboard();
      
      // Charger les données initiales
      loadAllData();
      
      // Configurer les écouteurs d'événements
      setupEventListeners();
      
      // Configurer les rafraîchissements automatiques
      setupAutoRefresh();
    })
    .catch(error => {
      console.error('Erreur d\'authentification:', error);
      redirectToLogin();
    });
});

/**
 * Configure les écouteurs d'événements pour les interactions utilisateur
 */
function setupEventListeners() {
  // Bouton de rafraîchissement global
  document.getElementById('refresh-data').addEventListener('click', () => {
    loadAllData();
  });
  
  // Boutons de rafraîchissement individuels
  document.querySelectorAll('.refresh-button').forEach(button => {
    const target = button.getAttribute('data-target');
    button.addEventListener('click', () => {
      refreshSection(target);
    });
  });
  
  // Changement de période pour le graphique d'utilisation
  document.getElementById('usage-chart-period').addEventListener('change', (e) => {
    loadAnalytics(e.target.value);
  });
  
  // Date d'évaluation des risques
  document.getElementById('risk-date').addEventListener('change', (e) => {
    loadRiskAssessment(e.target.value);
  });
  
  // Filtres par pays et région
  if (document.getElementById('country-filter')) {
    document.getElementById('country-filter').addEventListener('change', (e) => {
      selectedCountry = e.target.value;
      loadAllData();
    });
  }
  
  if (document.getElementById('region-filter')) {
    document.getElementById('region-filter').addEventListener('change', (e) => {
      selectedRegion = e.target.value;
      loadAllData();
    });
  }
  
  // Boutons d'action
  document.getElementById('reset-limits-btn').addEventListener('click', () => {
    showConfirmationModal(
      'Réinitialiser les limites',
      'Êtes-vous sûr de vouloir réinitialiser toutes les limites de quota? Cette action ne peut pas être annulée.',
      resetLimits
    );
  });
  
  document.getElementById('clear-cache-btn').addEventListener('click', () => {
    showConfirmationModal(
      'Vider le cache',
      'Êtes-vous sûr de vouloir vider le cache d\'itinéraires? Cette action ne peut pas être annulée.',
      clearCache
    );
  });
  
  document.getElementById('export-data-btn').addEventListener('click', exportData);
  
  // Boutons de nettoyage des logs
  document.getElementById('clear-activity-log').addEventListener('click', () => {
    document.getElementById('activity-log').innerHTML = '';
  });
  
  document.getElementById('clear-error-log').addEventListener('click', () => {
    document.getElementById('error-log').innerHTML = '';
  });
}

/**
 * Charge les données de statut du système
 */
async function loadStatusData() {
  try {
    const response = await fetch(`${API_BASE_URL}/status?country=${selectedCountry}&region=${selectedRegion}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    state.status = data;
    
    updateStatusIndicators(data);
    updateQuotaMetrics(data);
    
  } catch (error) {
    console.error('Erreur lors du chargement des données de statut:', error);
    showError('Erreur lors du chargement des données de statut.');
  }
}

/**
 * Charge les données d'analytique
 */
async function loadAnalytics(period = 30) {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics?period=${period}&country=${selectedCountry}&region=${selectedRegion}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    state.analytics = data;
    
    updateUsageChart(data, period);
    updateEndpointsChart(data);
    updateHourlyChart(data);
    updateResponseTimeChart(data);
    updateCountryDistributionChart(data);
    
  } catch (error) {
    console.error('Erreur lors du chargement des données d\'analytique:', error);
    showError('Erreur lors du chargement des données d\'analytique.');
  }
}

/**
 * Charge les données en temps réel
 */
async function loadRealTimeData() {
  try {
    const response = await fetch(`${API_BASE_URL}/real-time?country=${selectedCountry}&region=${selectedRegion}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    state.realTime = data;
    
    // Mettre à jour les logs d'activité
    updateActivityLog(data.recentActivity);
    
    // Mettre à jour les logs d'erreurs
    updateErrorLog(data.recentErrors);
    
  } catch (error) {
    console.error('Erreur lors du chargement des données en temps réel:', error);
    showError('Erreur lors du chargement des données en temps réel.');
  }
}

/**
 * Charge les recommandations
 */
async function loadRecommendations() {
  try {
    const response = await fetch(`${API_BASE_URL}/recommendations?country=${selectedCountry}&region=${selectedRegion}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    state.recommendations = data;
    
    // Mettre à jour les insights de prédiction
    updatePredictionInsights(data.insights);
    
  } catch (error) {
    console.error('Erreur lors du chargement des recommandations:', error);
    showError('Erreur lors du chargement des recommandations.');
  }
}

/**
 * Charge les prédictions
 */
async function loadPredictions() {
  try {
    const response = await fetch(`${API_BASE_URL}/predictions?country=${selectedCountry}&region=${selectedRegion}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    state.predictions = data;
    
    // Mettre à jour le graphique de prédiction
    updatePredictionChart(data);
    
    // Mettre à jour le tableau de prédictions
    updatePredictionTable(data.predictions);
    
    // Initialiser la date d'évaluation des risques si elle n'est pas déjà définie
    const riskDateInput = document.getElementById('risk-date');
    if (!riskDateInput.value && data.predictions.length > 0) {
      riskDateInput.value = data.predictions[0].date;
      loadRiskAssessment(data.predictions[0].date);
    }
    
  } catch (error) {
    console.error('Erreur lors du chargement des prédictions:', error);
    showError('Erreur lors du chargement des prédictions.');
  }
}

/**
 * Met à jour le graphique de distribution par pays
 */
function updateCountryDistributionChart(data) {
  if (!state.charts.countryDistributionChart || !data.countryDistribution) {
    return;
  }
  
  const chart = state.charts.countryDistributionChart;
  
  // Mettre à jour les données du graphique
  chart.data.labels = data.countryDistribution.map(item => item.country);
  chart.data.datasets[0].data = data.countryDistribution.map(item => item.count);
  
  // Mettre à jour le graphique
  chart.update();
}

/**
 * Initialise le graphique de distribution par pays
 */
function initializeCountryDistributionChart() {
  const countryChartCtx = document.getElementById('country-distribution-chart');
  
  if (!countryChartCtx) {
    return;
  }
  
  state.charts.countryDistributionChart = new Chart(countryChartCtx.getContext('2d'), {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Requêtes par pays',
        data: [],
        backgroundColor: [
          '#1A73E8', '#34A853', '#FA7B17', '#EA4335', '#5F6368',
          '#185ABC', '#137333', '#E37400', '#C5221F', '#3C4043',
          '#1967D2', '#188038', '#F29900', '#D93025', '#9AA0A6',
          '#4285F4', '#0F9D58', '#F4B400', '#DB4437', '#757575'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Distribution des requêtes par pays'
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Pays'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Nombre de requêtes'
          }
        }
      }
    }
  });
}

/**
 * Charge l'évaluation des risques pour une date spécifique
 */
async function loadRiskAssessment(date) {
  if (!date) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/risk-assessment?date=${date}&country=${selectedCountry}&region=${selectedRegion}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Mettre à jour l'affichage du niveau de risque
    updateRiskDisplay(data);
    
  } catch (error) {
    console.error('Erreur lors du chargement de l\'évaluation des risques:', error);
    showError('Erreur lors du chargement de l\'évaluation des risques.');
  }
}

/**
 * Initialise tous les graphiques du tableau de bord
 */
function initializeCharts() {
  // Graphique d'utilisation quotidienne
  const usageChartCtx = document.getElementById('usage-chart').getContext('2d');
  state.charts.usageChart = new Chart(usageChartCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Utilisation',
          data: [],
          borderColor: '#1A73E8',
          backgroundColor: 'rgba(26, 115, 232, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        },
        {
          label: 'Limite',
          data: [],
          borderColor: '#EA4335',
          backgroundColor: 'rgba(234, 67, 53, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Nombre de requêtes'
          }
        }
      }
    }
  });
  
  // Graphique des endpoints
  const endpointsChartCtx = document.getElementById('endpoints-chart').getContext('2d');
  state.charts.endpointsChart = new Chart(endpointsChartCtx, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          '#1A73E8',
          '#34A853',
          '#FA7B17',
          '#EA4335',
          '#5F6368'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
        }
      }
    }
  });
  
  // Graphique de répartition horaire
  const hourlyChartCtx = document.getElementById('hourly-chart').getContext('2d');
  state.charts.hourlyChart = new Chart(hourlyChartCtx, {
    type: 'bar',
    data: {
      labels: Array.from({ length: 24 }, (_, i) => `${i}h`),
      datasets: [{
        label: 'Requêtes par heure',
        data: Array(24).fill(0),
        backgroundColor: 'rgba(26, 115, 232, 0.7)',
        borderColor: '#1A73E8',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Heure'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Nombre de requêtes'
          }
        }
      }
    }
  });
  
  // Graphique des temps de réponse
  const responseTimeChartCtx = document.getElementById('response-time-chart').getContext('2d');
  state.charts.responseTimeChart = new Chart(responseTimeChartCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Temps de réponse moyen (ms)',
        data: [],
        borderColor: '#FA7B17',
        backgroundColor: 'rgba(250, 123, 23, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Temps (ms)'
          }
        }
      }
    }
  });
  
  // Graphique de prédiction
  const predictionChartCtx = document.getElementById('prediction-chart').getContext('2d');
  state.charts.predictionChart = new Chart(predictionChartCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Historique',
          data: [],
          borderColor: '#1A73E8',
          backgroundColor: 'rgba(26, 115, 232, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        },
        {
          label: 'Prédiction',
          data: [],
          borderColor: '#34A853',
          backgroundColor: 'rgba(52, 168, 83, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0.3,
          fill: true
        },
        {
          label: 'Limite',
          data: [],
          borderColor: '#EA4335',
          backgroundColor: 'rgba(234, 67, 53, 0.1)',
          borderWidth: 2,
          borderDash: [5, 5],
          tension: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Nombre de requêtes'
          }
        }
      }
    }
  });
  
  // Initialiser le graphique de distribution par pays
  initializeCountryDistributionChart();
}
