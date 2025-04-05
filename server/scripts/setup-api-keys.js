/**
 * Script pour vérifier la disponibilité des clés API dans les variables d'environnement
 * Ce script vérifie que toutes les clés API nécessaires sont configurées comme variables d'environnement
 */
const dotenv = require('dotenv');
const path = require('path');
const { logger } = require('../utils/logger');

// Charger les variables d'environnement (pour le développement local uniquement)
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Liste des services et leurs clés API correspondantes
const services = [
  { 
    name: 'openRouteService', 
    envKey: 'OPENROUTE_API_KEY'
  },
  { 
    name: 'strava', 
    envKey: 'STRAVA_CLIENT_SECRET'
  },
  { 
    name: 'weatherService', 
    envKey: 'OPENWEATHER_API_KEY'
  },
  { 
    name: 'openai', 
    envKey: 'OPENAI_API_KEY'
  },
  { 
    name: 'mapbox', 
    envKey: 'MAPBOX_SECRET_TOKEN'
  }
];

// Vérifier la disponibilité des clés API
logger.info('=== Vérification des clés API ===');
let allKeysAvailable = true;

services.forEach(service => {
  const { name, envKey } = service;
  
  if (process.env[envKey]) {
    logger.info(`✓ ${name}: Clé API disponible dans les variables d'environnement`);
  } else {
    logger.error(`✗ ${name}: Clé API manquante (${envKey})`);
    allKeysAvailable = false;
  }
});

if (allKeysAvailable) {
  logger.info('=== Toutes les clés API sont disponibles ===');
} else {
  logger.warn('=== Certaines clés API sont manquantes ===');
  logger.info('Les clés manquantes doivent être configurées comme variables d\'environnement dans Netlify');
}
