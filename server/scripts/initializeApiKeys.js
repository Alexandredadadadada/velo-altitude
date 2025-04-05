/**
 * Script de vérification des clés API
 * Dashboard-Velo.com
 * 
 * Ce script vérifie que toutes les variables d'environnement nécessaires pour les clés API
 * sont correctement configurées.
 */

require('dotenv').config({ path: '../../.env' });
const chalk = require('chalk') || { green: (text) => text, red: (text) => text, yellow: (text) => text, blue: (text) => text };

// Configuration des services et leurs clés API
const services = [
  {
    name: 'openRouteService',
    envKey: 'OPENROUTE_API_KEY',
    description: 'Service de routage et calcul d\'itinéraires'
  },
  {
    name: 'strava',
    envKeys: ['STRAVA_CLIENT_SECRET', 'STRAVA_CLIENT_ID', 'STRAVA_REFRESH_TOKEN'],
    description: 'Intégration Strava pour données d\'activité'
  },
  {
    name: 'weatherService',
    envKey: 'OPENWEATHER_API_KEY',
    description: 'Service météorologique'
  },
  {
    name: 'mapbox',
    envKeys: ['MAPBOX_SECRET_TOKEN', 'MAPBOX_PUBLIC_TOKEN'],
    description: 'Service de cartographie'
  },
  {
    name: 'openai',
    envKey: 'OPENAI_API_KEY',
    description: 'Intégration IA pour suggestions personnalisées'
  },
  {
    name: 'mongodb',
    envKey: 'MONGODB_URI',
    description: 'Base de données'
  }
];

console.log(chalk.blue('\n======================================'));
console.log(chalk.blue(' Vérification des clés API disponibles'));
console.log(chalk.blue('======================================\n'));

let allKeysPresent = true;
let missingKeys = [];

// Vérifier les variables d'environnement pour chaque service
for (const service of services) {
  console.log(chalk.blue(`\n[${service.name}] - ${service.description}`));
  
  if (service.envKey) {
    // Service avec une seule clé
    const keyValue = process.env[service.envKey];
    if (keyValue) {
      console.log(chalk.green(`✓ ${service.envKey} est correctement configurée`));
    } else {
      console.log(chalk.red(`✗ ${service.envKey} n'est pas configurée`));
      allKeysPresent = false;
      missingKeys.push(service.envKey);
    }
  } else if (service.envKeys) {
    // Service avec plusieurs clés
    for (const envKey of service.envKeys) {
      const keyValue = process.env[envKey];
      if (keyValue) {
        console.log(chalk.green(`✓ ${envKey} est correctement configurée`));
      } else {
        console.log(chalk.red(`✗ ${envKey} n'est pas configurée`));
        allKeysPresent = false;
        missingKeys.push(envKey);
      }
    }
  }
}

console.log(chalk.blue('\n======================================'));

if (allKeysPresent) {
  console.log(chalk.green('\n✓ Toutes les clés API sont correctement configurées'));
  console.log(chalk.green('✓ Le système est prêt à être utilisé'));
} else {
  console.log(chalk.red('\n✗ Certaines clés API sont manquantes. Veuillez configurer les variables d\'environnement suivantes:'));
  missingKeys.forEach(key => {
    console.log(chalk.yellow(`  - ${key}`));
  });
  console.log('\nAssurez-vous de configurer ces variables dans votre fichier .env ou directement sur votre plateforme de déploiement (Netlify, Vercel, etc.)');
}

console.log(chalk.blue('\nConseil: Pour déployer sur Netlify, configurez ces variables dans "Settings > Build & deploy > Environment variables"'));
