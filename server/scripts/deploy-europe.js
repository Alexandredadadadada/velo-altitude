/**
 * Script de déploiement pour Dashboard-Velo (Version européenne)
 * Ce script prépare et déploie l'application pour une audience européenne
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// Configuration du déploiement
const config = {
  // Environnement cible
  environment: process.env.DEPLOY_ENV || 'staging',
  
  // Régions de déploiement
  regions: {
    primary: process.env.PRIMARY_REGION || 'eu-west-1', // Europe (Irlande)
    secondary: [
      'eu-central-1', // Europe (Francfort)
      'eu-west-2',    // Europe (Londres)
      'eu-west-3',    // Europe (Paris)
      'eu-north-1'    // Europe (Stockholm)
    ]
  },
  
  // Configuration des CDN
  cdn: {
    enabled: process.env.USE_CDN === 'true',
    provider: process.env.CDN_PROVIDER || 'cloudfront',
    distributionId: process.env.CDN_DISTRIBUTION_ID
  },
  
  // Configuration de la base de données
  database: {
    type: process.env.DB_TYPE || 'mongodb',
    uri: process.env.DB_URI,
    replicaSet: process.env.DB_REPLICA_SET === 'true'
  },
  
  // Configuration des quotas API par défaut
  defaultQuotas: {
    daily: parseInt(process.env.DEFAULT_DAILY_QUOTA) || 10000,
    hourly: parseInt(process.env.DEFAULT_HOURLY_QUOTA) || 1000,
    perMinute: parseInt(process.env.DEFAULT_PER_MINUTE_QUOTA) || 100
  }
};

/**
 * Vérifie les prérequis pour le déploiement
 */
function checkPrerequisites() {
  console.log('Vérification des prérequis pour le déploiement...');
  
  // Vérifier que Node.js est installé
  try {
    const nodeVersion = execSync('node --version').toString().trim();
    console.log(`✅ Node.js ${nodeVersion} détecté`);
  } catch (error) {
    console.error('❌ Node.js n\'est pas installé ou n\'est pas accessible');
    process.exit(1);
  }
  
  // Vérifier que les outils AWS sont installés si nécessaire
  if (config.environment === 'production' || config.environment === 'staging') {
    try {
      const awsVersion = execSync('aws --version').toString().trim();
      console.log(`✅ AWS CLI ${awsVersion} détecté`);
    } catch (error) {
      console.error('❌ AWS CLI n\'est pas installé ou n\'est pas accessible');
      process.exit(1);
    }
  }
  
  // Vérifier que les variables d'environnement requises sont définies
  const requiredEnvVars = ['DB_URI', 'JWT_SECRET', 'API_KEY_OPENROUTE'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnvVars.length > 0) {
    console.error(`❌ Variables d'environnement manquantes: ${missingEnvVars.join(', ')}`);
    process.exit(1);
  }
  
  console.log('✅ Toutes les variables d'environnement requises sont définies');
  
  // Vérifier que les fichiers requis existent
  const requiredFiles = [
    path.join(__dirname, '..', 'server.js'),
    path.join(__dirname, '..', 'package.json'),
    path.join(__dirname, '..', 'public', 'dashboard', 'index.html')
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    console.error(`❌ Fichiers manquants: ${missingFiles.join(', ')}`);
    process.exit(1);
  }
  
  console.log('✅ Tous les fichiers requis sont présents');
  console.log('✅ Prérequis vérifiés avec succès');
}

/**
 * Prépare l'application pour le déploiement
 */
function prepareApplication() {
  console.log(`Préparation de l'application pour le déploiement en ${config.environment}...`);
  
  // Créer un fichier de configuration pour l'environnement
  const envConfig = {
    NODE_ENV: config.environment,
    PORT: process.env.PORT || 3000,
    DB_URI: config.database.uri,
    JWT_SECRET: process.env.JWT_SECRET,
    API_KEY_OPENROUTE: process.env.API_KEY_OPENROUTE,
    DEFAULT_DAILY_QUOTA: config.defaultQuotas.daily,
    DEFAULT_HOURLY_QUOTA: config.defaultQuotas.hourly,
    DEFAULT_PER_MINUTE_QUOTA: config.defaultQuotas.perMinute,
    ENABLE_CACHE: true,
    CACHE_TTL: 86400, // 24 heures en secondes
    LOG_LEVEL: config.environment === 'production' ? 'info' : 'debug'
  };
  
  // Écrire le fichier de configuration
  const envFilePath = path.join(__dirname, '..', `.env.${config.environment}`);
  const envFileContent = Object.entries(envConfig)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(envFilePath, envFileContent);
  console.log(`✅ Fichier de configuration ${envFilePath} créé`);
  
  // Installer les dépendances
  console.log('Installation des dépendances...');
  execSync('npm install --production', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  console.log('✅ Dépendances installées');
  
  // Construire l'application si nécessaire
  if (fs.existsSync(path.join(__dirname, '..', 'package.json'))) {
    const packageJson = require(path.join(__dirname, '..', 'package.json'));
    
    if (packageJson.scripts && packageJson.scripts.build) {
      console.log('Construction de l\'application...');
      execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
      console.log('✅ Application construite');
    }
  }
  
  // Mettre à jour les quotas par défaut
  updateDefaultQuotas();
  
  console.log('✅ Application préparée pour le déploiement');
}

/**
 * Met à jour les quotas par défaut pour l'audience européenne
 */
function updateDefaultQuotas() {
  console.log('Mise à jour des quotas par défaut pour l\'audience européenne...');
  
  // Chemin vers le fichier de configuration des quotas
  const quotaConfigPath = path.join(__dirname, '..', 'config', 'quota-config.js');
  
  // Vérifier si le fichier existe
  if (!fs.existsSync(quotaConfigPath)) {
    console.log('⚠️ Fichier de configuration des quotas non trouvé, création...');
    
    // Créer le répertoire de configuration s'il n'existe pas
    const configDir = path.join(__dirname, '..', 'config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Contenu du fichier de configuration des quotas
    const quotaConfigContent = `/**
 * Configuration des quotas API pour Dashboard-Velo
 * Adapté pour une audience européenne
 */

module.exports = {
  // Quotas par défaut
  default: {
    daily: ${config.defaultQuotas.daily},
    hourly: ${config.defaultQuotas.hourly},
    perMinute: ${config.defaultQuotas.perMinute}
  },
  
  // Quotas par région
  regions: {
    western: {
      daily: ${config.defaultQuotas.daily * 1.2},
      hourly: ${config.defaultQuotas.hourly * 1.2},
      perMinute: ${config.defaultQuotas.perMinute * 1.2}
    },
    eastern: {
      daily: ${config.defaultQuotas.daily * 0.8},
      hourly: ${config.defaultQuotas.hourly * 0.8},
      perMinute: ${config.defaultQuotas.perMinute * 0.8}
    },
    northern: {
      daily: ${config.defaultQuotas.daily * 0.9},
      hourly: ${config.defaultQuotas.hourly * 0.9},
      perMinute: ${config.defaultQuotas.perMinute * 0.9}
    },
    southern: {
      daily: ${config.defaultQuotas.daily * 1.1},
      hourly: ${config.defaultQuotas.hourly * 1.1},
      perMinute: ${config.defaultQuotas.perMinute * 1.1}
    },
    central: {
      daily: ${config.defaultQuotas.daily * 1.3},
      hourly: ${config.defaultQuotas.hourly * 1.3},
      perMinute: ${config.defaultQuotas.perMinute * 1.3}
    }
  },
  
  // Quotas par pays (prioritaires sur les quotas par région)
  countries: {
    fr: {
      daily: ${config.defaultQuotas.daily * 1.5},
      hourly: ${config.defaultQuotas.hourly * 1.5},
      perMinute: ${config.defaultQuotas.perMinute * 1.5}
    },
    de: {
      daily: ${config.defaultQuotas.daily * 1.4},
      hourly: ${config.defaultQuotas.hourly * 1.4},
      perMinute: ${config.defaultQuotas.perMinute * 1.4}
    },
    it: {
      daily: ${config.defaultQuotas.daily * 1.2},
      hourly: ${config.defaultQuotas.hourly * 1.2},
      perMinute: ${config.defaultQuotas.perMinute * 1.2}
    },
    es: {
      daily: ${config.defaultQuotas.daily * 1.2},
      hourly: ${config.defaultQuotas.hourly * 1.2},
      perMinute: ${config.defaultQuotas.perMinute * 1.2}
    }
  },
  
  // Configuration de la récupération après dépassement de quota
  recovery: {
    strategy: 'gradual', // 'immediate' ou 'gradual'
    gradualRate: 0.1,    // 10% de récupération par minute
    cooldownPeriod: 300  // 5 minutes de période de refroidissement
  },
  
  // Configuration du circuit breaker
  circuitBreaker: {
    failureThreshold: 50,     // Nombre d'échecs avant ouverture
    resetTimeout: 30000,      // 30 secondes avant tentative de fermeture
    halfOpenSuccessThreshold: 5 // Nombre de succès en état semi-ouvert avant fermeture
  }
};`;
    
    // Écrire le fichier de configuration des quotas
    fs.writeFileSync(quotaConfigPath, quotaConfigContent);
    console.log(`✅ Fichier de configuration des quotas créé: ${quotaConfigPath}`);
  } else {
    console.log('Mise à jour du fichier de configuration des quotas existant...');
    
    // Lire le fichier de configuration des quotas existant
    let quotaConfig = fs.readFileSync(quotaConfigPath, 'utf8');
    
    // Mettre à jour les quotas par défaut
    quotaConfig = quotaConfig.replace(
      /daily:\s*\d+/g,
      `daily: ${config.defaultQuotas.daily}`
    ).replace(
      /hourly:\s*\d+/g,
      `hourly: ${config.defaultQuotas.hourly}`
    ).replace(
      /perMinute:\s*\d+/g,
      `perMinute: ${config.defaultQuotas.perMinute}`
    );
    
    // Écrire le fichier de configuration des quotas mis à jour
    fs.writeFileSync(quotaConfigPath, quotaConfig);
    console.log(`✅ Fichier de configuration des quotas mis à jour: ${quotaConfigPath}`);
  }
}

/**
 * Déploie l'application
 */
function deployApplication() {
  console.log(`Déploiement de l'application en ${config.environment}...`);
  
  if (config.environment === 'development') {
    console.log('Déploiement en environnement de développement, aucune action nécessaire.');
    return;
  }
  
  if (config.environment === 'production' || config.environment === 'staging') {
    // Déploiement sur AWS
    deployToAWS();
  } else {
    console.log(`Environnement ${config.environment} non pris en charge pour le déploiement.`);
  }
}

/**
 * Déploie l'application sur AWS
 */
function deployToAWS() {
  console.log('Déploiement sur AWS...');
  
  // Vérifier que les variables d'environnement AWS sont définies
  const requiredAwsEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
  const missingAwsEnvVars = requiredAwsEnvVars.filter(varName => !process.env[varName]);
  
  if (missingAwsEnvVars.length > 0) {
    console.error(`❌ Variables d'environnement AWS manquantes: ${missingAwsEnvVars.join(', ')}`);
    process.exit(1);
  }
  
  try {
    // Créer un package de déploiement
    console.log('Création du package de déploiement...');
    
    // Nom du package
    const packageName = `dashboard-velo-${config.environment}-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
    const packagePath = path.join(__dirname, '..', packageName);
    
    // Créer une archive ZIP
    execSync(`zip -r ${packageName} . -x "*.git*" -x "node_modules/*" -x "*.zip"`, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    
    console.log(`✅ Package de déploiement créé: ${packagePath}`);
    
    // Télécharger le package sur S3
    console.log('Téléchargement du package sur S3...');
    execSync(`aws s3 cp ${packagePath} s3://dashboard-velo-deployments/${config.environment}/${packageName}`, {
      stdio: 'inherit'
    });
    
    console.log('✅ Package téléchargé sur S3');
    
    // Déployer sur Elastic Beanstalk ou EC2 selon la configuration
    // Note: Cette partie dépend de votre infrastructure AWS spécifique
    console.log('Déploiement sur les serveurs AWS...');
    
    // Exemple de déploiement sur Elastic Beanstalk
    execSync(`aws elasticbeanstalk create-application-version --application-name dashboard-velo --version-label ${config.environment}-${new Date().toISOString().replace(/[:.]/g, '-')} --source-bundle S3Bucket=dashboard-velo-deployments,S3Key=${config.environment}/${packageName}`, {
      stdio: 'inherit'
    });
    
    execSync(`aws elasticbeanstalk update-environment --environment-name dashboard-velo-${config.environment} --version-label ${config.environment}-${new Date().toISOString().replace(/[:.]/g, '-')}`, {
      stdio: 'inherit'
    });
    
    console.log('✅ Application déployée sur AWS Elastic Beanstalk');
    
    // Nettoyer les fichiers temporaires
    fs.unlinkSync(packagePath);
    console.log('✅ Fichiers temporaires nettoyés');
    
  } catch (error) {
    console.error(`❌ Erreur lors du déploiement sur AWS: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Exécution principale
 */
function main() {
  console.log('=== Déploiement de Dashboard-Velo (Version européenne) ===');
  console.log(`Environnement: ${config.environment}`);
  console.log(`Région principale: ${config.regions.primary}`);
  console.log(`Régions secondaires: ${config.regions.secondary.join(', ')}`);
  console.log('=====================================================');
  
  // Vérifier les prérequis
  checkPrerequisites();
  
  // Préparer l'application
  prepareApplication();
  
  // Déployer l'application
  deployApplication();
  
  console.log('=== Déploiement terminé avec succès ===');
}

// Exécuter le script
main();
