const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { isAuthenticated, isAdmin } = require('../middleware/auth.middleware');

// Chemin des fichiers de configuration
const CONFIG_DIR = path.join(process.cwd(), 'config');
const API_CONFIGS_FILE = path.join(CONFIG_DIR, 'api-configs.json');
const NOTIFICATION_SETTINGS_FILE = path.join(CONFIG_DIR, 'notification-settings.json');
const SCHEDULE_SETTINGS_FILE = path.join(CONFIG_DIR, 'schedule-settings.json');
const THRESHOLD_SETTINGS_FILE = path.join(CONFIG_DIR, 'threshold-settings.json');

// Vérifier/créer le répertoire de configuration
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Configurations par défaut
const DEFAULT_API_CONFIGS = [
  {
    name: 'Strava',
    description: 'API pour récupérer les données d\'activités sportives',
    key: '',
    dailyLimit: 1000,
    isActive: true,
    testEndpoint: 'https://www.strava.com/api/v3/athlete',
    refreshTokenUrl: 'https://www.strava.com/oauth/token',
    monitoringEnabled: true
  },
  {
    name: 'OpenWeatherMap',
    description: 'API météorologique pour les conditions des cols',
    key: '',
    dailyLimit: 1000,
    isActive: true,
    testEndpoint: 'https://api.openweathermap.org/data/2.5/weather',
    refreshTokenUrl: '',
    monitoringEnabled: true
  }
];

const DEFAULT_NOTIFICATION_SETTINGS = {
  emailEnabled: true,
  smsEnabled: false,
  slackEnabled: false,
  emailRecipients: 'admin@cyclisme-europe.eu',
  smsRecipients: '',
  slackWebhook: ''
};

const DEFAULT_SCHEDULE_SETTINGS = {
  dailyReport: '0 8 * * *',
  weeklyReport: '0 9 * * 1',
  monthlyReport: '0 10 1 * *',
  monitoringInterval: '0 */6 * * *'
};

const DEFAULT_THRESHOLD_SETTINGS = {
  quotaWarning: 70,
  quotaCritical: 90,
  responseTimeWarning: 1000,
  responseTimeCritical: 3000
};

/**
 * Vérifie si un fichier existe, sinon crée le fichier avec des données par défaut
 * @param {string} filePath - Chemin du fichier
 * @param {object} defaultData - Données par défaut
 */
function ensureConfigFile(filePath, defaultData) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    console.log(`Fichier de configuration créé: ${filePath}`);
  }
}

// S'assurer que tous les fichiers de configuration existent
ensureConfigFile(API_CONFIGS_FILE, DEFAULT_API_CONFIGS);
ensureConfigFile(NOTIFICATION_SETTINGS_FILE, DEFAULT_NOTIFICATION_SETTINGS);
ensureConfigFile(SCHEDULE_SETTINGS_FILE, DEFAULT_SCHEDULE_SETTINGS);
ensureConfigFile(THRESHOLD_SETTINGS_FILE, DEFAULT_THRESHOLD_SETTINGS);

/**
 * Lire un fichier de configuration
 * @param {string} filePath - Chemin du fichier
 * @param {object} defaultData - Données par défaut en cas d'erreur
 * @returns {object} - Données de configuration
 */
function readConfigFile(filePath, defaultData) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Erreur lors de la lecture du fichier ${filePath}:`, error);
    return defaultData;
  }
}

/**
 * Écrire dans un fichier de configuration
 * @param {string} filePath - Chemin du fichier
 * @param {object} data - Données à écrire
 * @returns {boolean} - Succès ou échec de l'écriture
 */
function writeConfigFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Erreur lors de l'écriture du fichier ${filePath}:`, error);
    return false;
  }
}

// Route pour récupérer les configurations des API
router.get('/api-configs', isAuthenticated, isAdmin, (req, res) => {
  const configs = readConfigFile(API_CONFIGS_FILE, DEFAULT_API_CONFIGS);
  
  // Masquer les clés API dans la réponse
  const sanitizedConfigs = configs.map(config => ({
    ...config,
    key: config.key ? '••••••••' : ''
  }));
  
  res.json({ configs: sanitizedConfigs });
});

// Route pour mettre à jour les configurations des API
router.post('/api-configs', isAuthenticated, isAdmin, (req, res) => {
  const { configs } = req.body;
  
  if (!configs || !Array.isArray(configs)) {
    return res.status(400).json({ error: 'Format de données invalide' });
  }
  
  // Récupérer les configurations existantes pour préserver les clés API
  const existingConfigs = readConfigFile(API_CONFIGS_FILE, DEFAULT_API_CONFIGS);
  
  // Mettre à jour les configurations en préservant les clés API sauf si une nouvelle est fournie
  const updatedConfigs = configs.map(newConfig => {
    const existingConfig = existingConfigs.find(ec => ec.name === newConfig.name);
    
    // Si la clé est masquée (••••••••), conserver l'ancienne clé
    if (newConfig.key === '••••••••' && existingConfig) {
      return { ...newConfig, key: existingConfig.key };
    }
    
    return newConfig;
  });
  
  const success = writeConfigFile(API_CONFIGS_FILE, updatedConfigs);
  
  if (success) {
    res.json({ message: 'Configurations des API mises à jour avec succès' });
  } else {
    res.status(500).json({ error: 'Erreur lors de la mise à jour des configurations' });
  }
});

// Route pour récupérer les paramètres de notification
router.get('/notification-settings', isAuthenticated, isAdmin, (req, res) => {
  const settings = readConfigFile(NOTIFICATION_SETTINGS_FILE, DEFAULT_NOTIFICATION_SETTINGS);
  res.json({ settings });
});

// Route pour mettre à jour les paramètres de notification
router.post('/notification-settings', isAuthenticated, isAdmin, (req, res) => {
  const { settings } = req.body;
  
  if (!settings) {
    return res.status(400).json({ error: 'Format de données invalide' });
  }
  
  const success = writeConfigFile(NOTIFICATION_SETTINGS_FILE, settings);
  
  if (success) {
    res.json({ message: 'Paramètres de notification mis à jour avec succès' });
  } else {
    res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres' });
  }
});

// Route pour récupérer les paramètres de planification
router.get('/schedule-settings', isAuthenticated, isAdmin, (req, res) => {
  const settings = readConfigFile(SCHEDULE_SETTINGS_FILE, DEFAULT_SCHEDULE_SETTINGS);
  res.json({ settings });
});

// Route pour mettre à jour les paramètres de planification
router.post('/schedule-settings', isAuthenticated, isAdmin, (req, res) => {
  const { settings } = req.body;
  
  if (!settings) {
    return res.status(400).json({ error: 'Format de données invalide' });
  }
  
  const success = writeConfigFile(SCHEDULE_SETTINGS_FILE, settings);
  
  if (success) {
    // Redémarrer les tâches planifiées si nécessaire
    // Note: cela nécessiterait un mécanisme pour redémarrer le planificateur
    
    res.json({ message: 'Paramètres de planification mis à jour avec succès' });
  } else {
    res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres' });
  }
});

// Route pour récupérer les paramètres de seuil
router.get('/threshold-settings', isAuthenticated, isAdmin, (req, res) => {
  const settings = readConfigFile(THRESHOLD_SETTINGS_FILE, DEFAULT_THRESHOLD_SETTINGS);
  res.json({ settings });
});

// Route pour mettre à jour les paramètres de seuil
router.post('/threshold-settings', isAuthenticated, isAdmin, (req, res) => {
  const { settings } = req.body;
  
  if (!settings) {
    return res.status(400).json({ error: 'Format de données invalide' });
  }
  
  const success = writeConfigFile(THRESHOLD_SETTINGS_FILE, settings);
  
  if (success) {
    res.json({ message: 'Paramètres de seuil mis à jour avec succès' });
  } else {
    res.status(500).json({ error: 'Erreur lors de la mise à jour des paramètres' });
  }
});

// Route pour tester les notifications
router.post('/test-notification', isAuthenticated, isAdmin, async (req, res) => {
  const { type } = req.body; // 'email', 'sms', 'slack'
  
  if (!type || !['email', 'sms', 'slack'].includes(type)) {
    return res.status(400).json({ error: 'Type de notification invalide' });
  }
  
  try {
    const apiNotificationService = require('../services/api-notification.service');
    
    const result = await apiNotificationService.sendTestNotification(type);
    
    if (result) {
      res.json({ message: `Notification de test ${type} envoyée avec succès` });
    } else {
      res.status(500).json({ error: `Échec de l'envoi de la notification de test ${type}` });
    }
  } catch (error) {
    console.error(`Erreur lors de l'envoi de la notification de test:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour tester une connexion API
router.post('/test-api-connection', isAuthenticated, isAdmin, async (req, res) => {
  const { apiName } = req.body;
  
  if (!apiName) {
    return res.status(400).json({ error: 'Nom de l\'API requis' });
  }
  
  try {
    const configs = readConfigFile(API_CONFIGS_FILE, DEFAULT_API_CONFIGS);
    const apiConfig = configs.find(config => config.name === apiName);
    
    if (!apiConfig) {
      return res.status(404).json({ error: 'Configuration API non trouvée' });
    }
    
    if (!apiConfig.testEndpoint) {
      return res.status(400).json({ error: 'Endpoint de test non configuré pour cette API' });
    }
    
    // Implémenter la logique de test de connexion
    const axios = require('axios');
    const startTime = Date.now();
    
    let response;
    try {
      // Construire l'URL de test avec la clé API si nécessaire
      let testUrl = apiConfig.testEndpoint;
      if (apiConfig.key && !testUrl.includes('?')) {
        testUrl += `?api_key=${apiConfig.key}`;
      } else if (apiConfig.key) {
        testUrl += `&api_key=${apiConfig.key}`;
      }
      
      response = await axios.get(testUrl, { timeout: 5000 });
      
      const responseTime = Date.now() - startTime;
      
      res.json({
        success: true,
        message: `Connexion réussie à l'API ${apiName}`,
        responseTime,
        status: response.status,
        statusText: response.statusText
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      res.status(200).json({
        success: false,
        message: `Échec de connexion à l'API ${apiName}: ${error.message}`,
        responseTime,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
    }
  } catch (error) {
    console.error(`Erreur lors du test de connexion API:`, error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
