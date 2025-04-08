/**
 * Script pour détecter et purger les styles CSS inutilisés
 * À lancer avec Node.js dans un environnement de développement
 * 
 * Usage: node purgeCss.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const PurgeCSS = require('purgecss').PurgeCSS;

// Configuration
const config = {
  // Fichiers CSS à analyser
  css: [
    path.resolve(__dirname, '../App.css'),
    path.resolve(__dirname, '../styles/**/*.css'),
  ],
  // Fichiers où chercher l'utilisation des classes CSS
  content: [
    path.resolve(__dirname, '../**/*.js'),
    path.resolve(__dirname, '../**/*.jsx'),
    path.resolve(__dirname, '../**/*.ts'),
    path.resolve(__dirname, '../**/*.tsx'),
    path.resolve(__dirname, '../**/*.html'),
  ],
  // Dossier de sortie pour les fichiers CSS purgés
  output: path.resolve(__dirname, '../styles/purged'),
  // Classes à toujours conserver, même si elles semblent inutilisées
  safelist: {
    standard: [
      // Classes essentielles pour le fonctionnement de l'application
      'App', 'App-main',
      // Classes pour les transitions de page
      'page-transition-enter', 'page-transition-enter-active', 
      'page-transition-exit', 'page-transition-exit-active',
      // Classes dynamiques qui pourraient ne pas être détectées
      /^dark-mode/, /^btn-/, /^card-/, /^modal-/, /^navbar-/,
      /^spinner/, /^skeleton/, /^visualization-/,
      // Classes MUI qui pourraient être utilisées dynamiquement
      /^Mui/, /^mui-/
    ],
    deep: [/^interactive-point/],
    greedy: [/dark-mode$/]
  },
  // Options supplémentaires
  options: {
    rejected: true, // Obtenez les classes rejetées (non utilisées)
    fontFace: true, // Supprimer les règles @font-face inutilisées
    keyframes: true, // Supprimer les keyframes inutilisés
    variables: true, // Conserver les variables CSS
  }
};

// Créer le dossier de sortie s'il n'existe pas
if (!fs.existsSync(config.output)) {
  fs.mkdirSync(config.output, { recursive: true });
}

async function runPurgeCSS() {
  try {
    console.log('Démarrage de PurgeCSS...');
    
    // Exécuter PurgeCSS
    const purgeCSSResults = await new PurgeCSS().purge({
      content: config.content,
      css: config.css,
      safelist: config.safelist,
      ...config.options
    });
    
    // Enregistrer les résultats
    purgeCSSResults.forEach(result => {
      // Extraire le nom du fichier à partir du chemin complet
      const fileName = path.basename(result.file);
      const outputPath = path.join(config.output, `purged-${fileName}`);
      
      // Écrire le fichier CSS purgé
      fs.writeFileSync(outputPath, result.css);
      
      // Calculer la taille avant/après
      const originalSize = fs.statSync(result.file).size;
      const purgedSize = result.css.length;
      const reduction = ((originalSize - purgedSize) / originalSize * 100).toFixed(2);
      
      console.log(`${fileName}: ${originalSize} -> ${purgedSize} bytes (${reduction}% réduit)`);
      
      // Enregistrer les classes rejetées dans un fichier de log
      if (result.rejected && result.rejected.length > 0) {
        const logPath = path.join(config.output, `rejected-${fileName}.log`);
        fs.writeFileSync(logPath, result.rejected.join('\n'));
        console.log(`${result.rejected.length} classes inutilisées trouvées dans ${fileName} (voir ${logPath})`);
      }
    });
    
    console.log(`\nTerminé ! Les fichiers CSS purgés sont disponibles dans ${config.output}`);
    console.log('IMPORTANT: Vérifiez manuellement les fichiers avant de remplacer les originaux');
    
  } catch (error) {
    console.error('Erreur lors de l\'exécution de PurgeCSS:', error);
  }
}

// Exécuter le script
runPurgeCSS();
