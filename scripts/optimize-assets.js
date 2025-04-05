/**
 * Script d'optimisation des assets pour le déploiement
 * Optimise les images, les fichiers CSS et JS pour améliorer les performances
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const chalk = require('chalk');
const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');
const imageminSvgo = require('imagemin-svgo');
const { minify } = require('terser');
const CleanCSS = require('clean-css');
const glob = promisify(require('glob'));
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const statAsync = promisify(fs.stat);
const mkdirAsync = promisify(fs.mkdir);

// Configuration
const config = {
  // Répertoires à traiter
  directories: {
    images: [
      path.join(__dirname, '..', 'client', 'public', 'images'),
      path.join(__dirname, '..', 'client', 'public', 'assets', 'images')
    ],
    css: [
      path.join(__dirname, '..', 'client', 'public', 'css'),
      path.join(__dirname, '..', 'client', 'public', 'assets', 'css')
    ],
    js: [
      path.join(__dirname, '..', 'client', 'public', 'js'),
      path.join(__dirname, '..', 'client', 'public', 'assets', 'js')
    ]
  },
  // Extensions de fichiers à traiter
  extensions: {
    images: ['.jpg', '.jpeg', '.png', '.svg', '.gif'],
    css: ['.css'],
    js: ['.js']
  },
  // Répertoire de sortie pour les fichiers optimisés
  outputDir: path.join(__dirname, '..', 'dist', 'optimized-assets'),
  // Seuil de taille des fichiers à optimiser (en octets)
  sizeThreshold: 10 * 1024, // 10 Ko
  // Options pour l'optimisation des images
  imagemin: {
    jpeg: {
      quality: 80,
      progressive: true
    },
    png: {
      quality: [0.6, 0.8]
    },
    svg: {
      plugins: [
        { removeViewBox: false },
        { cleanupIDs: false }
      ]
    }
  },
  // Options pour l'optimisation des CSS
  cleanCSS: {
    level: 2
  },
  // Options pour l'optimisation des JS
  terser: {
    compress: {
      drop_console: true,
      drop_debugger: true
    },
    mangle: true
  }
};

// Statistiques d'optimisation
const stats = {
  images: { count: 0, originalSize: 0, optimizedSize: 0 },
  css: { count: 0, originalSize: 0, optimizedSize: 0 },
  js: { count: 0, originalSize: 0, optimizedSize: 0 },
  total: { count: 0, originalSize: 0, optimizedSize: 0 }
};

/**
 * Trouve tous les fichiers correspondant aux critères dans les répertoires spécifiés
 * @param {Array} directories - Liste des répertoires à parcourir
 * @param {Array} extensions - Liste des extensions de fichiers à inclure
 * @returns {Array} - Liste des chemins de fichiers trouvés
 */
async function findFiles(directories, extensions) {
  const allFiles = [];
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(chalk.yellow(`Le répertoire ${dir} n'existe pas, il sera ignoré.`));
      continue;
    }
    
    const pattern = path.join(dir, '**', `*+(${extensions.join('|')})`);
    const files = await glob(pattern, { nodir: true });
    allFiles.push(...files);
  }
  
  return allFiles;
}

/**
 * Crée le répertoire de sortie s'il n'existe pas
 * @param {String} outputPath - Chemin du répertoire de sortie
 */
async function createOutputDir(outputPath) {
  if (!fs.existsSync(outputPath)) {
    await mkdirAsync(outputPath, { recursive: true });
  }
}

/**
 * Calcule le chemin de sortie pour un fichier
 * @param {String} filePath - Chemin du fichier d'entrée
 * @param {String} baseOutputDir - Répertoire de base pour la sortie
 * @returns {String} - Chemin du fichier de sortie
 */
function getOutputPath(filePath, baseOutputDir) {
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  const outputPath = path.join(baseOutputDir, relativePath);
  const outputDir = path.dirname(outputPath);
  
  return { outputPath, outputDir };
}

/**
 * Met à jour les statistiques d'optimisation
 * @param {String} type - Type de fichier (images, css, js)
 * @param {Number} originalSize - Taille originale en octets
 * @param {Number} optimizedSize - Taille optimisée en octets
 */
function updateStats(type, originalSize, optimizedSize) {
  stats[type].count++;
  stats[type].originalSize += originalSize;
  stats[type].optimizedSize += optimizedSize;
  
  stats.total.count++;
  stats.total.originalSize += originalSize;
  stats.total.optimizedSize += optimizedSize;
}

/**
 * Optimise les images
 * @param {Array} files - Liste des fichiers à optimiser
 * @param {String} baseOutputDir - Répertoire de base pour la sortie
 */
async function optimizeImages(files, baseOutputDir) {
  console.log(chalk.blue(`\nOptimisation de ${files.length} images...`));
  
  for (const file of files) {
    try {
      const { outputPath, outputDir } = getOutputPath(file, baseOutputDir);
      await createOutputDir(outputDir);
      
      const fileStats = await statAsync(file);
      if (fileStats.size < config.sizeThreshold) {
        // Copier simplement les petits fichiers sans optimisation
        await fs.promises.copyFile(file, outputPath);
        console.log(chalk.gray(`Copié (trop petit pour optimisation): ${path.basename(file)}`));
        continue;
      }
      
      const fileExt = path.extname(file).toLowerCase();
      const plugins = [];
      
      if (['.jpg', '.jpeg'].includes(fileExt)) {
        plugins.push(imageminJpegtran(config.imagemin.jpeg));
      } else if (fileExt === '.png') {
        plugins.push(imageminPngquant(config.imagemin.png));
      } else if (fileExt === '.svg') {
        plugins.push(imageminSvgo({ plugins: config.imagemin.svg.plugins }));
      }
      
      if (plugins.length > 0) {
        const imageData = await readFileAsync(file);
        const optimizedImage = await imagemin.buffer(imageData, { plugins });
        await writeFileAsync(outputPath, optimizedImage);
        
        const originalSize = imageData.length;
        const optimizedSize = optimizedImage.length;
        const savings = originalSize - optimizedSize;
        const savingsPercent = (savings / originalSize * 100).toFixed(2);
        
        updateStats('images', originalSize, optimizedSize);
        
        console.log(chalk.green(`Optimisé: ${path.basename(file)} - Économie: ${savingsPercent}% (${formatBytes(savings)})`));
      } else {
        // Format non pris en charge, copier simplement
        await fs.promises.copyFile(file, outputPath);
        console.log(chalk.gray(`Copié (format non pris en charge): ${path.basename(file)}`));
      }
    } catch (error) {
      console.error(chalk.red(`Erreur lors de l'optimisation de ${file}: ${error.message}`));
    }
  }
}

/**
 * Optimise les fichiers CSS
 * @param {Array} files - Liste des fichiers à optimiser
 * @param {String} baseOutputDir - Répertoire de base pour la sortie
 */
async function optimizeCSS(files, baseOutputDir) {
  console.log(chalk.blue(`\nOptimisation de ${files.length} fichiers CSS...`));
  
  const cleanCSS = new CleanCSS(config.cleanCSS);
  
  for (const file of files) {
    try {
      const { outputPath, outputDir } = getOutputPath(file, baseOutputDir);
      await createOutputDir(outputDir);
      
      const fileStats = await statAsync(file);
      if (fileStats.size < config.sizeThreshold) {
        // Copier simplement les petits fichiers sans optimisation
        await fs.promises.copyFile(file, outputPath);
        console.log(chalk.gray(`Copié (trop petit pour optimisation): ${path.basename(file)}`));
        continue;
      }
      
      const css = await readFileAsync(file, 'utf8');
      const result = cleanCSS.minify(css);
      
      if (result.errors.length > 0) {
        throw new Error(`Erreurs CSS: ${result.errors.join(', ')}`);
      }
      
      await writeFileAsync(outputPath, result.styles);
      
      const originalSize = css.length;
      const optimizedSize = result.styles.length;
      const savings = originalSize - optimizedSize;
      const savingsPercent = (savings / originalSize * 100).toFixed(2);
      
      updateStats('css', originalSize, optimizedSize);
      
      console.log(chalk.green(`Optimisé: ${path.basename(file)} - Économie: ${savingsPercent}% (${formatBytes(savings)})`));
    } catch (error) {
      console.error(chalk.red(`Erreur lors de l'optimisation de ${file}: ${error.message}`));
    }
  }
}

/**
 * Optimise les fichiers JavaScript
 * @param {Array} files - Liste des fichiers à optimiser
 * @param {String} baseOutputDir - Répertoire de base pour la sortie
 */
async function optimizeJS(files, baseOutputDir) {
  console.log(chalk.blue(`\nOptimisation de ${files.length} fichiers JavaScript...`));
  
  for (const file of files) {
    try {
      const { outputPath, outputDir } = getOutputPath(file, baseOutputDir);
      await createOutputDir(outputDir);
      
      const fileStats = await statAsync(file);
      if (fileStats.size < config.sizeThreshold) {
        // Copier simplement les petits fichiers sans optimisation
        await fs.promises.copyFile(file, outputPath);
        console.log(chalk.gray(`Copié (trop petit pour optimisation): ${path.basename(file)}`));
        continue;
      }
      
      // Vérifier si le fichier est déjà minifié
      if (file.includes('.min.js')) {
        await fs.promises.copyFile(file, outputPath);
        console.log(chalk.gray(`Copié (déjà minifié): ${path.basename(file)}`));
        continue;
      }
      
      const js = await readFileAsync(file, 'utf8');
      const result = await minify(js, config.terser);
      
      if (result.error) {
        throw new Error(`Erreur JS: ${result.error}`);
      }
      
      await writeFileAsync(outputPath, result.code);
      
      const originalSize = js.length;
      const optimizedSize = result.code.length;
      const savings = originalSize - optimizedSize;
      const savingsPercent = (savings / originalSize * 100).toFixed(2);
      
      updateStats('js', originalSize, optimizedSize);
      
      console.log(chalk.green(`Optimisé: ${path.basename(file)} - Économie: ${savingsPercent}% (${formatBytes(savings)})`));
    } catch (error) {
      console.error(chalk.red(`Erreur lors de l'optimisation de ${file}: ${error.message}`));
    }
  }
}

/**
 * Formate un nombre d'octets en une chaîne lisible
 * @param {Number} bytes - Nombre d'octets
 * @returns {String} - Chaîne formatée
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Affiche les statistiques d'optimisation
 */
function displayStats() {
  console.log(chalk.bold('\n=== Statistiques d\'optimisation ===\n'));
  
  const types = ['images', 'css', 'js', 'total'];
  
  types.forEach(type => {
    if (type !== 'total' && stats[type].count === 0) return;
    
    const originalSize = formatBytes(stats[type].originalSize);
    const optimizedSize = formatBytes(stats[type].optimizedSize);
    const savings = formatBytes(stats[type].originalSize - stats[type].optimizedSize);
    const savingsPercent = stats[type].originalSize === 0 ? 0 : 
      ((stats[type].originalSize - stats[type].optimizedSize) / stats[type].originalSize * 100).toFixed(2);
    
    console.log(chalk.bold(`${type.charAt(0).toUpperCase() + type.slice(1)}:`));
    console.log(`  Fichiers traités: ${stats[type].count}`);
    console.log(`  Taille originale: ${originalSize}`);
    console.log(`  Taille optimisée: ${optimizedSize}`);
    console.log(`  Économie: ${savings} (${savingsPercent}%)`);
    console.log('');
  });
}

/**
 * Génère un rapport HTML des statistiques d'optimisation
 * @returns {String} - Rapport HTML
 */
function generateHtmlReport() {
  const types = ['images', 'css', 'js', 'total'];
  
  const typeRows = types.map(type => {
    if (type !== 'total' && stats[type].count === 0) return '';
    
    const originalSize = formatBytes(stats[type].originalSize);
    const optimizedSize = formatBytes(stats[type].optimizedSize);
    const savings = formatBytes(stats[type].originalSize - stats[type].optimizedSize);
    const savingsPercent = stats[type].originalSize === 0 ? 0 : 
      ((stats[type].originalSize - stats[type].optimizedSize) / stats[type].originalSize * 100).toFixed(2);
    
    return `
      <tr>
        <td>${type === 'total' ? '<strong>Total</strong>' : type.charAt(0).toUpperCase() + type.slice(1)}</td>
        <td>${stats[type].count}</td>
        <td>${originalSize}</td>
        <td>${optimizedSize}</td>
        <td>${savings}</td>
        <td>${savingsPercent}%</td>
      </tr>
    `;
  }).join('');
  
  const htmlReport = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport d'optimisation des assets - Grand Est Cyclisme</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 2px solid #ecf0f1;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f8f9fa;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .summary {
      margin-top: 30px;
      padding: 15px;
      border-radius: 5px;
      background-color: #d5f5e3;
      color: #27ae60;
    }
    .timestamp {
      margin-top: 30px;
      color: #7f8c8d;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <h1>Rapport d'optimisation des assets - Grand Est Cyclisme</h1>
  
  <table>
    <thead>
      <tr>
        <th>Type</th>
        <th>Fichiers traités</th>
        <th>Taille originale</th>
        <th>Taille optimisée</th>
        <th>Économie</th>
        <th>Pourcentage</th>
      </tr>
    </thead>
    <tbody>
      ${typeRows}
    </tbody>
  </table>
  
  <div class="summary">
    <strong>Résumé:</strong> ${stats.total.count} fichiers ont été traités, réduisant la taille totale de ${formatBytes(stats.total.originalSize - stats.total.optimizedSize)} (${((stats.total.originalSize - stats.total.optimizedSize) / stats.total.originalSize * 100).toFixed(2)}%).
  </div>
  
  <div class="timestamp">
    Rapport généré le ${new Date().toLocaleString('fr-FR')}
  </div>
</body>
</html>
  `;
  
  return htmlReport;
}

/**
 * Fonction principale
 */
async function main() {
  console.log(chalk.blue.bold('Optimisation des assets pour le déploiement...'));
  
  try {
    // Créer le répertoire de sortie principal
    await createOutputDir(config.outputDir);
    
    // Trouver tous les fichiers à optimiser
    const imageFiles = await findFiles(config.directories.images, config.extensions.images);
    const cssFiles = await findFiles(config.directories.css, config.extensions.css);
    const jsFiles = await findFiles(config.directories.js, config.extensions.js);
    
    // Optimiser les fichiers
    await optimizeImages(imageFiles, config.outputDir);
    await optimizeCSS(cssFiles, config.outputDir);
    await optimizeJS(jsFiles, config.outputDir);
    
    // Afficher les statistiques
    displayStats();
    
    // Générer un rapport HTML
    const htmlReport = generateHtmlReport();
    const reportPath = path.join(config.outputDir, 'optimization-report.html');
    
    await writeFileAsync(reportPath, htmlReport);
    console.log(chalk.blue(`\nRapport HTML généré: ${reportPath}`));
    
    console.log(chalk.green.bold('\nOptimisation des assets terminée avec succès !'));
    console.log(chalk.blue(`Les fichiers optimisés sont disponibles dans: ${config.outputDir}`));
  } catch (error) {
    console.error(chalk.red(`Erreur lors de l'optimisation des assets: ${error.message}`));
    process.exit(1);
  }
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red(`Erreur non gérée: ${error.message}`));
  process.exit(1);
});
