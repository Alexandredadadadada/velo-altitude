/**
 * Script de vérification du déploiement pour Velo-Altitude
 * Vérifie que toutes les conditions nécessaires au déploiement sont remplies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Chargement des variables d'environnement
require('dotenv').config();

async function verifyDeploymentReadiness() {
  console.log('\n🔍 VÉRIFICATION DE LA PRÉPARATION AU DÉPLOIEMENT\n');
  
  const checks = {
    configFiles: [
      { path: '../netlify.toml', critical: true },
      { path: '../webpack.config.js', critical: true },
      { path: '../.env', critical: false }
    ],
    
    scripts: [
      'build',
      'build:prod',
      'postbuild',
      'clean'
    ],
    
    criticalDependencies: [
      'webpack',
      'react',
      'mongoose',
      'express',
      '@auth0/auth0-react'
    ]
  };

  // Variables pour suivre les résultats
  let hasErrors = false;
  let warnings = [];

  // 1. Vérification des fichiers de configuration
  console.log('📁 Vérification des fichiers de configuration...');
  for (const file of checks.configFiles) {
    const filePath = path.resolve(__dirname, file.path);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${path.basename(filePath)} trouvé`);
    } else {
      if (file.critical) {
        console.error(`❌ ${path.basename(filePath)} manquant (CRITIQUE)`);
        hasErrors = true;
      } else {
        const warning = `⚠️ ${path.basename(filePath)} manquant (NON CRITIQUE)`;
        console.warn(warning);
        warnings.push(warning);
      }
    }
  }

  // 2. Vérification des scripts package.json
  console.log('\n📜 Vérification des scripts...');
  const packageJsonPath = path.resolve(__dirname, '../package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json non trouvé');
    hasErrors = true;
  } else {
    try {
      const packageJson = require(packageJsonPath);
      for (const script of checks.scripts) {
        if (packageJson.scripts && packageJson.scripts[script]) {
          console.log(`✅ Script ${script} trouvé`);
        } else {
          console.error(`❌ Script ${script} manquant`);
          hasErrors = true;
        }
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la lecture de package.json: ${error.message}`);
      hasErrors = true;
    }
  }

  // 3. Vérification des dépendances critiques
  console.log('\n📦 Vérification des dépendances...');
  
  // Vérifier d'abord que node_modules existe
  const nodeModulesPath = path.resolve(__dirname, '../node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.error('❌ Dossier node_modules non trouvé. Exécutez npm install d\'abord.');
    hasErrors = true;
  } else {
    for (const dep of checks.criticalDependencies) {
      const depPath = path.join(nodeModulesPath, dep);
      if (fs.existsSync(depPath)) {
        console.log(`✅ ${dep} installé`);
      } else {
        try {
          // Essayer de résoudre le module
          require.resolve(dep);
          console.log(`✅ ${dep} accessible`);
        } catch (e) {
          console.error(`❌ ${dep} manquant ou inaccessible`);
          hasErrors = true;
        }
      }
    }
  }

  // 4. Vérification des variables d'environnement critiques
  console.log('\n🔐 Vérification des variables d\'environnement...');
  const requiredEnvVars = [
    'MONGODB_URI',
    'MONGODB_DB_NAME',
    'AUTH0_CLIENT_ID',
    'AUTH0_ISSUER_BASE_URL',
    'MAPBOX_TOKEN'
  ];

  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingEnvVars.length > 0) {
    const warning = `⚠️ Variables d'environnement manquantes localement: ${missingEnvVars.join(', ')}`;
    console.warn(warning);
    warnings.push(warning);
    console.log('ℹ️ Ces variables sont configurées dans Netlify et ne sont pas requises localement');
  } else {
    console.log('✅ Toutes les variables d\'environnement critiques sont configurées');
  }

  // 5. Vérification de la connexion MongoDB (si les variables sont définies)
  if (process.env.MONGODB_URI) {
    console.log('\n🗄️ Vérification de la connexion MongoDB...');
    try {
      // Utilisation d'un script simple pour tester la connexion
      const testDbScript = path.resolve(__dirname, 'simple-verify.js');
      if (fs.existsSync(testDbScript)) {
        console.log('ℹ️ Exécution du script de vérification MongoDB...');
        try {
          execSync(`node "${testDbScript}"`, { stdio: 'inherit' });
          console.log('✅ Connexion MongoDB réussie');
        } catch (error) {
          console.error('❌ Échec de la vérification MongoDB');
          hasErrors = true;
        }
      } else {
        console.warn('⚠️ Script de vérification MongoDB non trouvé. Connexion non testée.');
        warnings.push('Script de vérification MongoDB non trouvé');
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la vérification MongoDB: ${error.message}`);
      hasErrors = true;
    }
  } else {
    const warning = '⚠️ Variables MongoDB non définies. Connexion non testée.';
    console.warn(warning);
    warnings.push(warning);
  }

  // 6. Test de build minimal (sans exécuter le build complet pour gagner du temps)
  console.log('\n🏗️ Vérification de la configuration webpack...');
  try {
    execSync('npx webpack --version', { stdio: 'pipe' });
    console.log('✅ webpack est accessible');
    
    const webpackConfigPath = path.resolve(__dirname, '../webpack.config.js');
    const webpackConfig = fs.readFileSync(webpackConfigPath, 'utf8');
    
    // Vérifier des éléments clés dans la configuration webpack
    if (webpackConfig.includes('module.exports') && 
        webpackConfig.includes('output') && 
        webpackConfig.includes('rules')) {
      console.log('✅ Configuration webpack valide');
    } else {
      console.warn('⚠️ Configuration webpack pourrait être incomplète');
      warnings.push('Configuration webpack potentiellement incomplète');
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la vérification webpack: ${error.message}`);
    hasErrors = true;
  }

  // 7. Vérification des scripts de déploiement
  console.log('\n🚀 Vérification des scripts de déploiement...');
  const deployScripts = [
    { path: '../scripts/clean.js', critical: true },
    { path: '../scripts/post-build.js', critical: true },
    { path: '../scripts/deploy-complete.js', critical: true }
  ];
  
  for (const script of deployScripts) {
    const scriptPath = path.resolve(__dirname, script.path);
    if (fs.existsSync(scriptPath)) {
      console.log(`✅ ${path.basename(scriptPath)} trouvé`);
    } else {
      if (script.critical) {
        console.error(`❌ ${path.basename(scriptPath)} manquant (CRITIQUE)`);
        hasErrors = true;
      } else {
        const warning = `⚠️ ${path.basename(scriptPath)} manquant (NON CRITIQUE)`;
        console.warn(warning);
        warnings.push(warning);
      }
    }
  }

  // Résumé
  console.log('\n📊 RÉSUMÉ DE LA VÉRIFICATION:');
  if (hasErrors) {
    console.error('❌ Des erreurs critiques ont été détectées. Corrigez-les avant de déployer.');
    if (warnings.length > 0) {
      console.warn('\n⚠️ Avertissements (non bloquants):');
      warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    process.exit(1);
  } else {
    if (warnings.length > 0) {
      console.warn('\n⚠️ Avertissements (non bloquants):');
      warnings.forEach(warning => console.warn(`  - ${warning}`));
      console.log('\n✅ VÉRIFICATION TERMINÉE AVEC AVERTISSEMENTS: Le déploiement peut continuer mais vérifiez les avertissements.');
    } else {
      console.log('\n✅ VÉRIFICATION TERMINÉE AVEC SUCCÈS: Tout est prêt pour le déploiement !');
    }
  }
}

// Exécuter la vérification
verifyDeploymentReadiness().catch(error => {
  console.error(`\n❌ ERREUR NON GÉRÉE: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
