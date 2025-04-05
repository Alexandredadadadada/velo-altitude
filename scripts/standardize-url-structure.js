/**
 * Script de standardisation des URLs et de la structure du contenu
 * Velo-Altitude
 * 
 * Ce script analyse et standardise les URLs de toutes les pages du site
 * pour assurer une cohérence et une optimisation SEO.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const chalk = require('chalk') || { green: (text) => text, red: (text) => text, yellow: (text) => text, blue: (text) => text };
const slugify = require('slugify');

// Configuration des URLs
const URL_CONFIG = {
  baseUrl: 'https://velo-altitude.com',
  locales: ['fr', 'en', 'de', 'it', 'es'],
  defaultLocale: 'fr',
  patterns: {
    cols: '/:locale/cols/:slug',
    training: '/:locale/entrainement/:slug',
    nutrition: '/:locale/nutrition/:slug',
    recipes: '/:locale/nutrition/recettes/:slug',
    guides: '/:locale/guides/:slug',
    community: '/:locale/communaute/:slug',
    challenges: '/:locale/defis/:slug',
    sevenMajors: '/:locale/defis/7-majeurs/:slug'
  }
};

// Fonction pour générer une URL standardisée
const generateStandardUrl = (type, slug, locale = URL_CONFIG.defaultLocale) => {
  if (!URL_CONFIG.patterns[type]) {
    console.log(chalk.red(`Type d'URL inconnu: ${type}`));
    return null;
  }
  
  return URL_CONFIG.patterns[type]
    .replace(':locale', locale)
    .replace(':slug', slug);
};

// Fonction pour standardiser un slug
const standardizeSlug = (name) => {
  return slugify(name, {
    lower: true,
    strict: true,
    locale: 'fr'  // Pour gérer correctement les accents français
  });
};

// Fonction pour trouver tous les fichiers JS et JSON dans un répertoire (récursivement)
const findAllFiles = (directory, extensions = ['.js', '.json']) => {
  let results = [];
  
  if (!fs.existsSync(directory)) {
    return results;
  }
  
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(findAllFiles(filePath, extensions));
    } else {
      if (extensions.some(ext => file.endsWith(ext))) {
        results.push(filePath);
      }
    }
  }
  
  return results;
};

// Fonction pour analyser et standardiser les URLs dans un fichier
const standardizeUrlsInFile = (filePath) => {
  console.log(chalk.blue(`Traitement du fichier ${filePath}...`));
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Rechercher les modèles d'URL non standardisés
    const urlPatterns = [
      // URLs absolues non standardisées
      { 
        regex: /["'](https?:\/\/velo-altitude\.com\/[^"']*?)["']/g,
        handler: (match, url) => {
          // Analyser l'URL pour déterminer son type et extraire le slug
          const urlParts = url.replace(/^https?:\/\/velo-altitude\.com\//, '').split('/');
          let type, slug, locale;
          
          if (URL_CONFIG.locales.includes(urlParts[0])) {
            locale = urlParts[0];
            
            if (urlParts[1] === 'cols' && urlParts.length > 2) {
              type = 'cols';
              slug = urlParts[2];
            } else if (['entrainement', 'training'].includes(urlParts[1]) && urlParts.length > 2) {
              type = 'training';
              slug = urlParts[2];
            } else if (urlParts[1] === 'nutrition') {
              if (urlParts[2] === 'recettes' && urlParts.length > 3) {
                type = 'recipes';
                slug = urlParts[3];
              } else if (urlParts.length > 2) {
                type = 'nutrition';
                slug = urlParts[2];
              }
            } else if (urlParts[1] === 'guides' && urlParts.length > 2) {
              type = 'guides';
              slug = urlParts[2];
            } else if (urlParts[1] === 'defis') {
              if (urlParts[2] === '7-majeurs' && urlParts.length > 3) {
                type = 'sevenMajors';
                slug = urlParts[3];
              } else if (urlParts.length > 2) {
                type = 'challenges';
                slug = urlParts[2];
              }
            } else if (['communaute', 'community'].includes(urlParts[1]) && urlParts.length > 2) {
              type = 'community';
              slug = urlParts[2];
            }
            
            if (type && slug) {
              // Standardiser le slug
              const standardSlug = standardizeSlug(slug);
              
              if (standardSlug !== slug) {
                const standardUrl = generateStandardUrl(type, standardSlug, locale);
                const fullStandardUrl = `${URL_CONFIG.baseUrl}${standardUrl}`;
                
                console.log(chalk.yellow(`  URL non standard trouvée: ${url}`));
                console.log(chalk.green(`  → Standardisée en: ${fullStandardUrl}`));
                
                // Remplacer l'URL dans le contenu
                const quote = match.charAt(0); // Préserver le type de guillemet
                return `${quote}${fullStandardUrl}${quote}`;
              }
            }
          }
          
          return match; // Conserver l'URL originale si elle ne peut pas être standardisée
        }
      },
      
      // URLs relatives non standardisées
      {
        regex: /["'](\/[^"']*?)["']/g,
        handler: (match, url) => {
          // Traiter uniquement les URLs relatives qui semblent être des liens internes
          if (url.startsWith('/static/') || url.startsWith('/images/') || url.startsWith('/assets/')) {
            return match; // Ignorer les ressources statiques
          }
          
          const urlParts = url.split('/').filter(Boolean);
          let type, slug, locale;
          
          if (URL_CONFIG.locales.includes(urlParts[0])) {
            locale = urlParts[0];
            
            // Même logique que pour les URLs absolues
            if (urlParts[1] === 'cols' && urlParts.length > 2) {
              type = 'cols';
              slug = urlParts[2];
            } else if (['entrainement', 'training'].includes(urlParts[1]) && urlParts.length > 2) {
              type = 'training';
              slug = urlParts[2];
            } else if (urlParts[1] === 'nutrition') {
              if (urlParts[2] === 'recettes' && urlParts.length > 3) {
                type = 'recipes';
                slug = urlParts[3];
              } else if (urlParts.length > 2) {
                type = 'nutrition';
                slug = urlParts[2];
              }
            } else if (urlParts[1] === 'guides' && urlParts.length > 2) {
              type = 'guides';
              slug = urlParts[2];
            } else if (urlParts[1] === 'defis') {
              if (urlParts[2] === '7-majeurs' && urlParts.length > 3) {
                type = 'sevenMajors';
                slug = urlParts[3];
              } else if (urlParts.length > 2) {
                type = 'challenges';
                slug = urlParts[2];
              }
            } else if (['communaute', 'community'].includes(urlParts[1]) && urlParts.length > 2) {
              type = 'community';
              slug = urlParts[2];
            }
            
            if (type && slug) {
              // Standardiser le slug
              const standardSlug = standardizeSlug(slug);
              
              if (standardSlug !== slug) {
                const standardUrl = generateStandardUrl(type, standardSlug, locale);
                
                console.log(chalk.yellow(`  URL relative non standard trouvée: ${url}`));
                console.log(chalk.green(`  → Standardisée en: ${standardUrl}`));
                
                // Remplacer l'URL dans le contenu
                const quote = match.charAt(0); // Préserver le type de guillemet
                return `${quote}${standardUrl}${quote}`;
              }
            }
          }
          
          return match; // Conserver l'URL originale si elle ne peut pas être standardisée
        }
      }
    ];
    
    // Appliquer les transformations
    for (const pattern of urlPatterns) {
      const originalContent = content;
      content = content.replace(pattern.regex, pattern.handler);
      
      if (content !== originalContent) {
        modified = true;
      }
    }
    
    // Sauvegarder le fichier si des modifications ont été apportées
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(chalk.green(`✓ Fichier modifié: ${filePath}`));
      return true;
    } else {
      console.log(chalk.blue(`- Aucune modification nécessaire: ${filePath}`));
      return false;
    }
    
  } catch (error) {
    console.log(chalk.red(`✗ Erreur lors du traitement de ${filePath}: ${error.message}`));
    return false;
  }
};

// Fonction pour générer un rapport de standardisation des URLs
const generateUrlReport = (results) => {
  const reportPath = path.join(__dirname, '../docs/url-standardization-report.md');
  
  let report = '# Rapport de Standardisation des URLs - Velo-Altitude\n\n';
  report += `Date: ${new Date().toISOString().split('T')[0]}\n\n`;
  
  // Statistiques
  const totalFiles = results.length;
  const modifiedFiles = results.filter(r => r.modified).length;
  
  report += '## Statistiques\n\n';
  report += `- Fichiers analysés: ${totalFiles}\n`;
  report += `- Fichiers modifiés: ${modifiedFiles} (${Math.round(modifiedFiles/totalFiles*100)}%)\n\n`;
  
  // Structure d'URL standardisée
  report += '## Structure d\'URL standardisée\n\n';
  report += '| Type de contenu | Modèle d\'URL |\n';
  report += '|----------------|-------------|\n';
  
  Object.entries(URL_CONFIG.patterns).forEach(([type, pattern]) => {
    report += `| ${type} | \`${pattern}\` |\n`;
  });
  
  report += '\n## Détails des modifications\n\n';
  
  // Détails des fichiers modifiés
  results.filter(r => r.modified).forEach(result => {
    report += `### ${path.basename(result.file)}\n\n`;
    report += `Chemin: \`${result.file}\`\n\n`;
    
    if (result.changes && result.changes.length > 0) {
      report += '| URL d\'origine | URL standardisée |\n';
      report += '|--------------|------------------|\n';
      
      result.changes.forEach(change => {
        report += `| \`${change.original}\` | \`${change.standardized}\` |\n`;
      });
    }
    
    report += '\n';
  });
  
  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(chalk.green(`✓ Rapport de standardisation des URLs généré: ${reportPath}`));
};

// Fonction pour standardiser les slugs dans les fichiers de données
const standardizeDataSlugs = (filePath) => {
  console.log(chalk.blue(`Standardisation des slugs dans ${filePath}...`));
  
  try {
    let data;
    let modified = false;
    const changes = [];
    
    // Charger les données
    if (filePath.endsWith('.json')) {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else if (filePath.endsWith('.js')) {
      // Pour les fichiers JS, on tente de les évaluer
      try {
        delete require.cache[require.resolve(filePath)];
        data = require(filePath);
        
        // Si c'est un module avec export default
        if (data && data.default) {
          data = data.default;
        }
      } catch (error) {
        console.log(chalk.red(`Impossible de charger le module JS: ${error.message}`));
        return { file: filePath, modified: false };
      }
    }
    
    if (!data) {
      return { file: filePath, modified: false };
    }
    
    // Traiter les données (tableau ou objet unique)
    const items = Array.isArray(data) ? data : [data];
    
    items.forEach(item => {
      if (item.name && (item.slug || item.id)) {
        const standardSlug = standardizeSlug(item.name);
        
        if (item.slug && item.slug !== standardSlug) {
          console.log(chalk.yellow(`  Slug non standard trouvé: ${item.slug}`));
          console.log(chalk.green(`  → Standardisé en: ${standardSlug}`));
          
          changes.push({
            original: item.slug,
            standardized: standardSlug
          });
          
          item.slug = standardSlug;
          modified = true;
        }
        
        // Si pas de slug mais un ID qui pourrait être utilisé comme slug
        if (!item.slug && item.id && item.id !== standardSlug) {
          console.log(chalk.yellow(`  ID non standard utilisé comme slug: ${item.id}`));
          console.log(chalk.green(`  → Ajout d'un slug standardisé: ${standardSlug}`));
          
          changes.push({
            original: item.id,
            standardized: standardSlug
          });
          
          item.slug = standardSlug;
          modified = true;
        }
      }
    });
    
    // Sauvegarder les modifications
    if (modified) {
      if (filePath.endsWith('.json')) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      } else if (filePath.endsWith('.js')) {
        // Pour les fichiers JS, c'est plus compliqué
        // On crée un fichier JSON standardisé à côté
        const jsonPath = filePath.replace(/\.js$/, '-standardized.json');
        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
        console.log(chalk.green(`✓ Version standardisée sauvegardée: ${jsonPath}`));
      }
      
      console.log(chalk.green(`✓ Slugs standardisés dans: ${filePath}`));
    } else {
      console.log(chalk.blue(`- Aucune standardisation de slug nécessaire: ${filePath}`));
    }
    
    return { file: filePath, modified, changes };
    
  } catch (error) {
    console.log(chalk.red(`✗ Erreur lors de la standardisation des slugs dans ${filePath}: ${error.message}`));
    return { file: filePath, modified: false, error: error.message };
  }
};

// Fonction principale
async function main() {
  console.log(chalk.blue('=== Standardisation des URLs et des slugs - Velo-Altitude ===\n'));
  
  // Répertoires à analyser
  const directories = [
    path.join(__dirname, '../src'),
    path.join(__dirname, '../server'),
    path.join(__dirname, '../public')
  ];
  
  // Trouver tous les fichiers
  let allFiles = [];
  directories.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = findAllFiles(dir);
      console.log(chalk.blue(`Trouvé ${files.length} fichiers dans ${dir}`));
      allFiles = [...allFiles, ...files];
    } else {
      console.log(chalk.yellow(`! Répertoire non trouvé: ${dir}`));
    }
  });
  
  console.log(chalk.blue(`\nStandardisation des URLs dans ${allFiles.length} fichiers...`));
  
  // Standardiser les URLs dans tous les fichiers
  const urlResults = [];
  for (const file of allFiles) {
    const modified = standardizeUrlsInFile(file);
    urlResults.push({ file, modified });
  }
  
  // Trouver les fichiers de données
  const dataFiles = [
    ...findAllFiles(path.join(__dirname, '../src/data')),
    ...findAllFiles(path.join(__dirname, '../server/data'))
  ];
  
  console.log(chalk.blue(`\nStandardisation des slugs dans ${dataFiles.length} fichiers de données...`));
  
  // Standardiser les slugs dans les fichiers de données
  const slugResults = [];
  for (const file of dataFiles) {
    const result = standardizeDataSlugs(file);
    slugResults.push(result);
  }
  
  // Générer le rapport
  generateUrlReport([...urlResults, ...slugResults]);
  
  console.log(chalk.green('\n✓ Standardisation terminée avec succès'));
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red('Erreur lors de l\'exécution du script:', error));
});
