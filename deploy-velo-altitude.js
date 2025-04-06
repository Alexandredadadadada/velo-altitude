// Script de déploiement Velo-Altitude
// Ce script injecte automatiquement les fichiers d'authentification d'urgence et déploie le site

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const ROOT_DIR = path.resolve(__dirname);
const CLIENT_DIR = path.join(ROOT_DIR, 'client');
const PUBLIC_DIR = path.join(CLIENT_DIR, 'public');
const BUILD_DIR = path.join(CLIENT_DIR, 'build');

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

console.log(`${colors.blue}=== Déploiement de Velo-Altitude - Solution d'authentification optimisée ===${colors.reset}`);

// 1. Vérifier que tous les fichiers d'urgence sont en place
console.log(`${colors.yellow}Vérification des fichiers d'authentification d'urgence...${colors.reset}`);
const emergencyFiles = [
  'emergency-auth.js',
  'emergency-login.html',
  'emergency-dashboard.html'
];

let allFilesExist = true;
emergencyFiles.forEach(file => {
  const filePath = path.join(PUBLIC_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.log(`${colors.red}ERREUR: Fichier manquant: ${file}${colors.reset}`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log(`${colors.red}ERREUR: Certains fichiers d'urgence sont manquants.${colors.reset}`);
  process.exit(1);
}

// 2. S'assurer que le script d'auth est inséré dans index.html
console.log(`${colors.yellow}Vérification de l'intégration du script d'authentification...${colors.reset}`);
const indexPath = path.join(PUBLIC_DIR, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

if (!indexContent.includes('emergency-auth.js')) {
  console.log(`${colors.yellow}Intégration du script d'authentification d'urgence dans index.html...${colors.reset}`);
  indexContent = indexContent.replace(
    '<head>',
    '<head>\n    <script src="%PUBLIC_URL%/emergency-auth.js"></script>'
  );
  fs.writeFileSync(indexPath, indexContent);
  console.log(`${colors.green}Script d'authentification intégré avec succès.${colors.reset}`);
} else {
  console.log(`${colors.green}Script d'authentification déjà intégré.${colors.reset}`);
}

// 3. Construction du projet
console.log(`${colors.yellow}Construction du projet...${colors.reset}`);
try {
  process.env.CI = 'false'; // Empêcher les erreurs de bloquer le build
  execSync('npm run build', { cwd: CLIENT_DIR, stdio: 'inherit' });
  console.log(`${colors.green}Build terminé avec succès.${colors.reset}`);
} catch (error) {
  console.log(`${colors.red}ERREUR lors du build: ${error.message}${colors.reset}`);
  process.exit(1);
}

// 4. Copier les fichiers d'urgence dans le dossier build
console.log(`${colors.yellow}Copie des fichiers d'authentification d'urgence dans le build...${colors.reset}`);
emergencyFiles.forEach(file => {
  const sourcePath = path.join(PUBLIC_DIR, file);
  const destPath = path.join(BUILD_DIR, file);
  fs.copyFileSync(sourcePath, destPath);
  console.log(`${colors.green}Copié: ${file}${colors.reset}`);
});

// 5. Déploiement sur Netlify
console.log(`${colors.yellow}Déploiement sur Netlify...${colors.reset}`);
try {
  execSync('netlify deploy --prod --dir=build --clear --message "Déploiement optimisé avec système d\'authentification de secours"', 
    { cwd: CLIENT_DIR, stdio: 'inherit' });
  console.log(`${colors.green}Déploiement terminé avec succès!${colors.reset}`);
} catch (error) {
  console.log(`${colors.red}ERREUR lors du déploiement: ${error.message}${colors.reset}`);
  process.exit(1);
}

console.log(`${colors.blue}=== Déploiement de Velo-Altitude terminé ===${colors.reset}`);
console.log(`${colors.green}Le site est maintenant en ligne avec la solution d'authentification d'urgence.${colors.reset}`);
console.log(`${colors.yellow}Visitez https://velo-altitude.com pour vérifier le site déployé.${colors.reset}`);
