/**
 * Script de migration de Material-UI v4 vers MUI v5
 * Ce script aide à la transition entre les deux versions en:
 * 1. Analysant les importations actuelles
 * 2. Générant les commandes de migration
 * 3. Créant un rapport des fichiers à mettre à jour
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

// Configuration
const config = {
  srcDir: path.resolve(__dirname, '../src'),
  componentDirs: ['components', 'features', 'pages'],
  backupDir: path.resolve(__dirname, '../backups/mui-migration'),
  v4Patterns: [
    /@material-ui\/core/g,
    /@material-ui\/icons/g,
    /@material-ui\/lab/g,
    /@material-ui\/styles/g
  ],
  v5Replacements: {
    '@material-ui/core': '@mui/material',
    '@material-ui/icons': '@mui/icons-material',
    '@material-ui/lab': '@mui/lab',
    '@material-ui/styles': '@mui/styles'
  },
  apiChanges: {
    // Composants renommés
    'makeStyles': 'styled',
    'withStyles': 'styled',
    'fade': 'alpha',
    // Props renommées
    'innerRef': 'ref',
    'onEnter': 'onEntering',
    'createMuiTheme': 'createTheme'
  }
};

// Créer le répertoire de sauvegarde
function createBackupDir() {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupDirWithTimestamp = `${config.backupDir}-${timestamp}`;
  
  if (!fs.existsSync(backupDirWithTimestamp)) {
    fs.mkdirSync(backupDirWithTimestamp, { recursive: true });
    console.log(chalk.green(`✅ Répertoire de sauvegarde créé: ${backupDirWithTimestamp}`));
  }
  
  return backupDirWithTimestamp;
}

// Analyser les fichiers pour les importations v4
function analyzeFiles() {
  console.log(chalk.blue('🔍 Analyse des fichiers pour les importations Material-UI v4...'));
  
  const affectedFiles = [];
  const processDir = (dir) => {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        processDir(filePath);
      } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
        const content = fs.readFileSync(filePath, 'utf8');
        let hasV4Import = false;
        
        for (const pattern of config.v4Patterns) {
          if (pattern.test(content)) {
            hasV4Import = true;
            break;
          }
        }
        
        if (hasV4Import) {
          affectedFiles.push(filePath);
        }
      }
    }
  };
  
  // Parcourir les répertoires de composants
  for (const componentDir of config.componentDirs) {
    const dirPath = path.join(config.srcDir, componentDir);
    if (fs.existsSync(dirPath)) {
      processDir(dirPath);
    }
  }
  
  console.log(chalk.green(`✅ Analyse terminée. ${affectedFiles.length} fichiers contiennent des importations Material-UI v4.`));
  return affectedFiles;
}

// Sauvegarder les fichiers avant modification
function backupFiles(files, backupDir) {
  console.log(chalk.blue('💾 Sauvegarde des fichiers avant migration...'));
  
  for (const file of files) {
    const relativePath = path.relative(path.resolve(__dirname, '..'), file);
    const backupPath = path.join(backupDir, relativePath);
    
    // Créer les répertoires parents si nécessaire
    const backupParentDir = path.dirname(backupPath);
    if (!fs.existsSync(backupParentDir)) {
      fs.mkdirSync(backupParentDir, { recursive: true });
    }
    
    // Copier le fichier
    fs.copyFileSync(file, backupPath);
  }
  
  console.log(chalk.green(`✅ ${files.length} fichiers sauvegardés dans ${backupDir}`));
}

// Générer les commandes npm pour la migration
function generateNpmCommands() {
  console.log(chalk.blue('📦 Génération des commandes npm pour la migration...'));
  
  const commands = [
    '# Commandes pour la migration de Material-UI v4 vers MUI v5',
    '',
    '# 1. Désinstaller les packages v4',
    'npm uninstall @material-ui/core @material-ui/icons @material-ui/lab @material-ui/styles',
    '',
    '# 2. Installer les packages v5 et leurs dépendances',
    'npm install @mui/material @mui/icons-material @mui/lab @mui/styles @emotion/react @emotion/styled',
    '',
    '# 3. Installer le codemod pour la migration automatique (optionnel)',
    'npx @mui/codemod v5.0.0/preset-safe ./src',
    '',
    '# 4. Vérifier les dépendances après migration',
    'npm run verify:deps'
  ];
  
  const commandsPath = path.resolve(__dirname, '../mui-migration-commands.sh');
  fs.writeFileSync(commandsPath, commands.join('\n'));
  
  console.log(chalk.green(`✅ Commandes npm générées dans ${commandsPath}`));
  return commandsPath;
}

// Générer un rapport de migration
function generateMigrationReport(files) {
  console.log(chalk.blue('📊 Génération du rapport de migration...'));
  
  const report = [
    '# Rapport de Migration Material-UI v4 -> MUI v5',
    '',
    `Date: ${new Date().toISOString()}`,
    '',
    '## Fichiers à mettre à jour',
    ''
  ];
  
  for (const file of files) {
    const relativePath = path.relative(path.resolve(__dirname, '..'), file);
    report.push(`- ${relativePath}`);
  }
  
  report.push('');
  report.push('## Changements d\'API importants');
  report.push('');
  
  for (const [oldApi, newApi] of Object.entries(config.apiChanges)) {
    report.push(`- \`${oldApi}\` -> \`${newApi}\``);
  }
  
  report.push('');
  report.push('## Étapes suivantes');
  report.push('');
  report.push('1. Exécuter les commandes npm générées');
  report.push('2. Mettre à jour les importations dans les fichiers listés');
  report.push('3. Tester l\'application après chaque mise à jour de fichier');
  report.push('4. Vérifier les styles et la compatibilité des composants');
  
  const reportPath = path.resolve(__dirname, '../mui-migration-report.md');
  fs.writeFileSync(reportPath, report.join('\n'));
  
  console.log(chalk.green(`✅ Rapport de migration généré dans ${reportPath}`));
  return reportPath;
}

// Fonction principale
function main() {
  console.log(chalk.blue('🚀 Démarrage de la migration Material-UI v4 -> MUI v5...'));
  
  try {
    // Créer le répertoire de sauvegarde
    const backupDir = createBackupDir();
    
    // Analyser les fichiers
    const affectedFiles = analyzeFiles();
    
    // Sauvegarder les fichiers
    backupFiles(affectedFiles, backupDir);
    
    // Générer les commandes npm
    const commandsPath = generateNpmCommands();
    
    // Générer le rapport de migration
    const reportPath = generateMigrationReport(affectedFiles);
    
    console.log(chalk.green('✅ Préparation de la migration terminée avec succès !'));
    console.log(chalk.cyan(`📋 Rapport: ${reportPath}`));
    console.log(chalk.cyan(`📜 Commandes: ${commandsPath}`));
    console.log(chalk.cyan(`🗄️ Sauvegarde: ${backupDir}`));
    
    console.log(chalk.yellow('\n⚠️ Attention: La migration nécessite des modifications manuelles pour adapter le code à l\'API de MUI v5.'));
    console.log(chalk.yellow('📚 Consultez la documentation officielle: https://mui.com/material-ui/migration/migration-v4/'));
    
  } catch (error) {
    console.error(chalk.red('❌ Erreur lors de la migration:'), error);
    process.exit(1);
  }
}

// Exécuter le script
main();
