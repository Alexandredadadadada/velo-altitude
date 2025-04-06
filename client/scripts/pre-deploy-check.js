/**
 * Script de vérification pré-déploiement pour Velo-Altitude
 * 
 * Ce script vérifie que tous les fichiers essentiels sont présents et bien configurés
 * avant le déploiement en production, en particulier pour l'authentification.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Tableau des fichiers essentiels à vérifier
const criticalFiles = [
  {
    path: 'src/contexts/AuthContext.js',
    description: 'Contexte d\'authentification principal',
    checkContent: (content) => {
      return {
        success: content.includes('authService') && content.includes('useAuth'),
        message: 'Vérifiez que AuthContext.js intègre correctement authService et expose le hook useAuth'
      };
    }
  },
  {
    path: 'src/services/authService.js',
    description: 'Service d\'authentification',
    checkContent: (content) => {
      return {
        success: content.includes('setupAxiosInterceptor') && content.includes('refreshToken'),
        message: 'Le service d\'authentification doit configurer les intercepteurs Axios et gérer le rafraîchissement des tokens'
      };
    }
  },
  {
    path: 'src/index.js',
    description: 'Point d\'entrée de l\'application',
    checkContent: (content) => {
      return {
        success: content.includes('<AuthProvider>') && content.includes('ReactDOM.createRoot'),
        message: 'index.js doit envelopper le Router avec AuthProvider et utiliser createRoot pour le concurrent mode'
      };
    }
  },
  {
    path: 'public/auth-override.js',
    description: 'Script de secours d\'authentification',
    checkContent: (content) => {
      return {
        success: content.includes('AUTH_CONTEXT'),
        message: 'Le script auth-override.js doit définir window.AUTH_CONTEXT comme fallback'
      };
    }
  },
  {
    path: 'public/index.html',
    description: 'Page HTML principale',
    checkContent: (content) => {
      return {
        success: content.includes('auth-override.js'),
        message: 'Le script auth-override.js doit être inclus dans index.html avant le bundle React'
      };
    }
  }
];

// Vérification des fichiers de build
const buildFiles = [
  'build/static/js',
  'build/static/css',
  'build/_redirects',
  'build/index.html'
];

console.log(chalk.blue.bold('🔎 Vérification pré-déploiement Velo-Altitude'));
console.log(chalk.blue('================================================'));

// Vérifier l'existence du dossier client
const clientPath = path.resolve(__dirname, '..');
if (!fs.existsSync(clientPath)) {
  console.error(chalk.red.bold('❌ Le dossier client est introuvable!'));
  process.exit(1);
}

// Fonction pour vérifier un fichier
function checkFile(filePath, description, contentCheck) {
  const fullPath = path.join(clientPath, filePath);
  
  console.log(chalk.gray(`Vérification de ${filePath}...`));
  
  if (!fs.existsSync(fullPath)) {
    console.error(chalk.red(`❌ ERREUR: ${description} est introuvable à ${filePath}`));
    return false;
  }
  
  if (contentCheck) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const result = contentCheck(content);
    
    if (!result.success) {
      console.error(chalk.red(`❌ AVERTISSEMENT: ${description} - ${result.message}`));
      return false;
    }
  }
  
  console.log(chalk.green(`✅ ${description} - OK`));
  return true;
}

// Vérifier les fichiers essentiels
let allFilesOk = true;
console.log(chalk.blue.bold('\n📋 Vérification des fichiers essentiels:'));

criticalFiles.forEach(file => {
  const fileOk = checkFile(file.path, file.description, file.checkContent);
  allFilesOk = allFilesOk && fileOk;
});

// Vérifier le build si disponible
console.log(chalk.blue.bold('\n📦 Vérification du build (si disponible):'));

const buildPath = path.join(clientPath, 'build');
if (fs.existsSync(buildPath)) {
  buildFiles.forEach(file => {
    const fileOk = checkFile(file, `Fichier de build ${file}`, null);
    allFilesOk = allFilesOk && fileOk;
  });
} else {
  console.log(chalk.yellow('⚠️ Dossier build non trouvé - Exécutez npm run build avant le déploiement'));
}

// Résultat final
console.log(chalk.blue('\n================================================'));
if (allFilesOk) {
  console.log(chalk.green.bold('✅ Vérification complète: Le projet est prêt pour le déploiement!'));
  console.log(chalk.blue('\nPour déployer sur Netlify, exécutez:'));
  console.log(chalk.gray('npm run build'));
  console.log(chalk.gray('netlify deploy --prod'));
} else {
  console.log(chalk.red.bold('❌ Certaines vérifications ont échoué. Corrigez les problèmes avant le déploiement.'));
}

console.log(chalk.blue('\nPour un déploiement réussi, assurez-vous que:'));
console.log(chalk.gray('1. Les variables d\'environnement sont correctement configurées sur Netlify'));
console.log(chalk.gray('2. Le fichier _redirects est bien inclus dans le build'));
console.log(chalk.gray('3. Le hook useAuth est importé correctement dans tous les composants'));
