/**
 * Script de migration progressive pour Velo-Altitude
 * Exécute les étapes de migration une par une pour faciliter le débogage
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Utiliser un polyfill simple pour chalk
const chalk = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`
};

// Configuration des étapes de migration
const migrationSteps = {
  step1: {
    name: 'Mise à jour MUI',
    description: 'Migration de Material-UI v4 vers MUI v5',
    tasks: [
      {
        name: 'Analyse des dépendances',
        command: 'npm run verify:deps',
        autoRun: true
      },
      {
        name: 'Préparation de la migration MUI',
        command: 'npm run migrate:mui',
        autoRun: true
      },
      {
        name: 'Désinstallation de Material-UI v4',
        command: 'npm uninstall @material-ui/core @material-ui/icons @material-ui/lab @material-ui/styles',
        requireConfirmation: true
      },
      {
        name: 'Installation de MUI v5',
        command: 'npm install @mui/material @mui/icons-material @mui/lab @mui/styles @emotion/react @emotion/styled',
        requireConfirmation: true
      },
      {
        name: 'Vérification après migration',
        command: 'npm run verify:deps',
        autoRun: true
      }
    ]
  },
  
  step2: {
    name: 'Optimisation Webpack Base',
    description: 'Configuration Webpack simplifiée mais efficace',
    tasks: [
      {
        name: 'Test de compilation avec config simplifiée',
        command: 'npm run build:safe',
        autoRun: true
      },
      {
        name: 'Analyse du bundle',
        command: 'npm run build:safe:analyze',
        autoRun: true
      },
      {
        name: 'Vérification des performances',
        command: 'npm run verify',
        autoRun: true
      }
    ]
  },
  
  step3: {
    name: 'Optimisations Avancées',
    description: 'Activation progressive des fonctionnalités avancées',
    tasks: [
      {
        name: 'Mettre à jour webpack.config.simple.js avec tree-shaking avancé',
        action: activateAdvancedTreeShaking,
        autoRun: true
      },
      {
        name: 'Mettre à jour webpack.config.simple.js avec optimisation d\'images',
        action: activateImageOptimization,
        autoRun: true
      },
      {
        name: 'Activer la compression Brotli/Gzip',
        action: activateCompression,
        autoRun: true
      },
      {
        name: 'Test de build avec toutes les optimisations',
        command: 'npm run build:safe',
        autoRun: true
      },
      {
        name: 'Analyse finale du bundle',
        command: 'npm run build:safe:analyze',
        autoRun: true
      },
      {
        name: 'Vérification finale des performances',
        command: 'npm run verify',
        autoRun: true
      }
    ]
  }
};

// Fonction principale
async function runMigrationStep(stepId) {
  // Vérifier que l'étape existe
  if (!migrationSteps[stepId]) {
    console.error(chalk.red(`❌ Étape inconnue: ${stepId}`));
    console.log(chalk.yellow('Les étapes disponibles sont:'));
    Object.keys(migrationSteps).forEach(key => {
      console.log(chalk.cyan(`  - ${key}: ${migrationSteps[key].name}`));
    });
    process.exit(1);
  }
  
  const step = migrationSteps[stepId];
  console.log(chalk.blue(`🚀 Démarrage de l'étape: ${step.name}`));
  console.log(chalk.cyan(`📝 ${step.description}`));
  console.log(chalk.yellow('Cette étape comporte les tâches suivantes:'));
  
  step.tasks.forEach((task, index) => {
    console.log(chalk.cyan(`  ${index + 1}. ${task.name}`));
    if (task.command) {
      console.log(chalk.gray(`     Commande: ${task.command}`));
    }
  });
  
  console.log('\n');
  
  // Exécuter les tâches
  for (let i = 0; i < step.tasks.length; i++) {
    const task = step.tasks[i];
    console.log(chalk.blue(`⏳ [${i + 1}/${step.tasks.length}] Exécution: ${task.name}`));
    
    try {
      if (task.command) {
        // Demander confirmation si nécessaire
        if (task.requireConfirmation) {
          console.log(chalk.yellow(`⚠️ Cette commande nécessite une confirmation: ${task.command}`));
          
          const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
          });
          
          const userConfirmation = await new Promise(resolve => {
            readline.question('Voulez-vous exécuter cette commande? (o/n) ', answer => {
              readline.close();
              resolve(answer.toLowerCase() === 'o' || answer.toLowerCase() === 'oui');
            });
          });
          
          if (!userConfirmation) {
            console.log(chalk.yellow('❌ Commande ignorée par l\'utilisateur.'));
            continue;
          }
        }
        
        // Exécuter la commande
        console.log(chalk.gray(`$ ${task.command}`));
        execSync(task.command, { stdio: 'inherit' });
        
      } else if (task.action && typeof task.action === 'function') {
        // Exécuter l'action
        await task.action();
      }
      
      console.log(chalk.green(`✅ Tâche terminée avec succès: ${task.name}`));
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors de l'exécution de la tâche: ${task.name}`));
      console.error(chalk.red(error.message));
      
      // Demander à l'utilisateur s'il souhaite continuer
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const userContinue = await new Promise(resolve => {
        readline.question('Voulez-vous continuer malgré l\'erreur? (o/n) ', answer => {
          readline.close();
          resolve(answer.toLowerCase() === 'o' || answer.toLowerCase() === 'oui');
        });
      });
      
      if (!userContinue) {
        console.log(chalk.yellow('⛔ Migration interrompue par l\'utilisateur.'));
        process.exit(1);
      }
    }
    
    console.log('\n');
  }
  
  console.log(chalk.green(`🎉 Étape de migration terminée avec succès: ${step.name}`));
  
  // Créer un rapport de l'étape
  const reportPath = path.join(__dirname, `../migration-reports/step-${stepId}-report.json`);
  
  // Créer le répertoire des rapports s'il n'existe pas
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  // Écrire le rapport
  fs.writeFileSync(reportPath, JSON.stringify({
    step: step.name,
    description: step.description,
    completedAt: new Date().toISOString(),
    tasks: step.tasks.map(task => ({
      name: task.name,
      command: task.command
    }))
  }, null, 2));
  
  console.log(chalk.green(`📝 Rapport de migration sauvegardé dans ${reportPath}`));
  
  // Afficher la prochaine étape si disponible
  const stepKeys = Object.keys(migrationSteps);
  const currentIndex = stepKeys.indexOf(stepId);
  
  if (currentIndex < stepKeys.length - 1) {
    const nextStepId = stepKeys[currentIndex + 1];
    const nextStep = migrationSteps[nextStepId];
    
    console.log(chalk.blue(`👉 Prochaine étape: ${nextStep.name}`));
    console.log(chalk.cyan(`   Exécutez: npm run progressive:${nextStepId}`));
  } else {
    console.log(chalk.blue('🏁 Toutes les étapes de migration sont terminées!'));
  }
}

// Fonctions d'action pour les optimisations avancées

async function activateAdvancedTreeShaking() {
  console.log(chalk.blue('🔧 Activation du tree-shaking avancé dans webpack.config.simple.js...'));
  
  const configPath = path.resolve(__dirname, '../webpack.config.simple.js');
  let configContent = fs.readFileSync(configPath, 'utf8');
  
  // Rechercher la section d'optimisation
  const optimizationRegex = /optimization:\s*{[^}]*}/gs;
  const optimizationMatch = configContent.match(optimizationRegex);
  
  if (!optimizationMatch) {
    throw new Error('Section d\'optimisation non trouvée dans webpack.config.simple.js');
  }
  
  // Ajouter la configuration avancée de tree-shaking
  const currentOptimization = optimizationMatch[0];
  const improvedOptimization = currentOptimization.replace(
    'optimization: {',
    `optimization: {
      usedExports: true,
      providedExports: true,
      sideEffects: true,
      innerGraph: true,
      mangleExports: isProduction ? 'deterministic' : false,`
  );
  
  // Mettre à jour le contenu
  configContent = configContent.replace(optimizationRegex, improvedOptimization);
  
  // Sauvegarder le fichier
  fs.writeFileSync(configPath, configContent);
  
  console.log(chalk.green('✅ Tree-shaking avancé activé dans webpack.config.simple.js'));
}

async function activateImageOptimization() {
  console.log(chalk.blue('🔧 Activation de l\'optimisation d\'images dans webpack.config.simple.js...'));
  
  const configPath = path.resolve(__dirname, '../webpack.config.simple.js');
  let configContent = fs.readFileSync(configPath, 'utf8');
  
  // Rechercher la règle pour les images
  const imageRuleRegex = /test:\s*\/\\.\(png\|jpg\|jpeg\|gif\)\\$\/i,\s*type:\s*'asset\/resource',/g;
  const imageRuleMatch = configContent.match(imageRuleRegex);
  
  if (!imageRuleMatch) {
    throw new Error('Règle pour les images non trouvée dans webpack.config.simple.js');
  }
  
  // Améliorer la règle d'images
  const improvedImageRule = `test: /\\.(png|jpg|jpeg|gif)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 10 * 1024 // 10kb
            }
          },`;
  
  // Mettre à jour le contenu
  configContent = configContent.replace(imageRuleRegex, improvedImageRule);
  
  // Sauvegarder le fichier
  fs.writeFileSync(configPath, configContent);
  
  console.log(chalk.green('✅ Optimisation d\'images activée dans webpack.config.simple.js'));
}

async function activateCompression() {
  console.log(chalk.blue('🔧 Activation de la compression dans webpack.config.simple.js...'));
  
  const configPath = path.resolve(__dirname, '../webpack.config.simple.js');
  let configContent = fs.readFileSync(configPath, 'utf8');
  
  // Vérifier si CompressionPlugin est déjà importé
  if (!configContent.includes('CompressionPlugin')) {
    // Ajouter l'import
    const compressionImport = "const CompressionPlugin = require('compression-webpack-plugin');\n";
    // Trouver la dernière importation et ajouter après
    const lastImportIndex = configContent.lastIndexOf('require(');
    const lastImportLineEnd = configContent.indexOf('\n', lastImportIndex);
    
    configContent = 
      configContent.substring(0, lastImportLineEnd + 1) + 
      compressionImport + 
      configContent.substring(lastImportLineEnd + 1);
  }
  
  // Trouver l'endroit où ajouter le plugin de compression
  const pluginsArrayRegex = /plugins:\s*\[\s*/;
  const pluginsArrayMatch = configContent.match(pluginsArrayRegex);
  
  if (!pluginsArrayMatch) {
    throw new Error('Array de plugins non trouvé dans webpack.config.simple.js');
  }
  
  // Ajouter le plugin de compression s'il n'existe pas déjà
  if (!configContent.includes('CompressionPlugin')) {
    const compressionPlugin = `
      // Compression Gzip
      isProduction && new CompressionPlugin({
        algorithm: 'gzip',
        test: /\\.(js|css|html|svg)$/,
        threshold: 10240,
        minRatio: 0.8,
      }),`;
    
    // Insérer après le début de l'array de plugins
    const pluginsStart = configContent.indexOf('[', configContent.indexOf('plugins:'));
    const insertPosition = pluginsStart + 1;
    
    configContent = 
      configContent.substring(0, insertPosition) + 
      compressionPlugin + 
      configContent.substring(insertPosition);
  }
  
  // Sauvegarder le fichier
  fs.writeFileSync(configPath, configContent);
  
  console.log(chalk.green('✅ Compression activée dans webpack.config.simple.js'));
}

// Exécuter le script
const stepId = process.argv[2];

if (!stepId) {
  console.error(chalk.red('❌ Veuillez spécifier une étape de migration.'));
  console.log(chalk.yellow('Les étapes disponibles sont:'));
  Object.keys(migrationSteps).forEach(key => {
    console.log(chalk.cyan(`  - ${key}: ${migrationSteps[key].name}`));
  });
  process.exit(1);
}

runMigrationStep(stepId).catch(error => {
  console.error(chalk.red('❌ Erreur lors de la migration:'), error);
  process.exit(1);
});
