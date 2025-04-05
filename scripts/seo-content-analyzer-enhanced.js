/**
 * Script d'analyse et d'optimisation du contenu pour SEO
 * Velo-Altitude
 * 
 * Ce script analyse le contenu du site, détecte les doublons,
 * vérifie la qualité SEO et propose des améliorations.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const chalk = require('chalk') || { green: (text) => text, red: (text) => text, yellow: (text) => text, blue: (text) => text };
const slugify = require('slugify');

// Configuration
const CONFIG = {
  minTitleLength: 30,
  maxTitleLength: 60,
  minDescriptionLength: 120,
  maxDescriptionLength: 160,
  minContentLength: 300,
  keywordDensityMin: 0.5,
  keywordDensityMax: 2.5,
  minImagesPerCol: 3,
  requiredFields: [
    'id', 'name', 'slug', 'altitude', 'length', 'avgGradient', 
    'difficulty', 'description', 'imageUrl'
  ]
};

// Chemins des répertoires
const SOURCE_DIRS = {
  cols: [
    path.join(__dirname, '../src/data/cols'),
    path.join(__dirname, '../src/data')
  ],
  training: [
    path.join(__dirname, '../src/data/training')
  ],
  nutrition: [
    path.join(__dirname, '../src/data/recipes')
  ]
};

// Fonction pour trouver tous les fichiers dans les répertoires
const findFiles = (directories, extension = '.js') => {
  let files = [];
  
  directories.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isFile() && file.endsWith(extension)) {
          files.push(filePath);
        }
      });
    }
  });
  
  return files;
};

// Fonction pour charger les données d'un fichier JS
const loadJsData = (filePath) => {
  try {
    // Supprimer le cache pour recharger le fichier
    delete require.cache[require.resolve(filePath)];
    return require(filePath);
  } catch (error) {
    console.log(chalk.red(`Erreur lors du chargement de ${filePath}: ${error.message}`));
    return null;
  }
};

// Fonction pour détecter les doublons
const findDuplicates = (items, fields = ['name', 'id']) => {
  const duplicates = [];
  const seen = {};
  
  items.forEach(item => {
    fields.forEach(field => {
      if (item[field]) {
        const value = item[field].toLowerCase();
        if (!seen[field]) seen[field] = {};
        
        if (seen[field][value]) {
          duplicates.push({
            field,
            value,
            items: [seen[field][value], item]
          });
        } else {
          seen[field][value] = item;
        }
      }
    });
  });
  
  return duplicates;
};

// Fonction pour vérifier la qualité SEO d'un élément
const analyzeSeoQuality = (item, type = 'col') => {
  const issues = [];
  
  // Vérifier les champs requis
  CONFIG.requiredFields.forEach(field => {
    if (!item[field] || (typeof item[field] === 'string' && item[field].trim() === '')) {
      issues.push(`Champ requis manquant: ${field}`);
    }
  });
  
  // Vérifier la longueur du titre (nom)
  if (item.name) {
    const titleLength = item.name.length;
    if (titleLength < CONFIG.minTitleLength) {
      issues.push(`Titre trop court (${titleLength} caractères). Minimum recommandé: ${CONFIG.minTitleLength}`);
    } else if (titleLength > CONFIG.maxTitleLength) {
      issues.push(`Titre trop long (${titleLength} caractères). Maximum recommandé: ${CONFIG.maxTitleLength}`);
    }
  }
  
  // Vérifier la description
  if (item.description) {
    let description = item.description;
    if (typeof description === 'object' && description.fr) {
      description = description.fr; // Utiliser la version française pour l'analyse
    }
    
    const descriptionLength = description.length;
    if (descriptionLength < CONFIG.minDescriptionLength) {
      issues.push(`Description trop courte (${descriptionLength} caractères). Minimum recommandé: ${CONFIG.minDescriptionLength}`);
    } else if (descriptionLength > CONFIG.maxDescriptionLength) {
      issues.push(`Description trop longue (${descriptionLength} caractères). Maximum recommandé: ${CONFIG.maxDescriptionLength}`);
    }
    
    // Analyser la densité de mots-clés (simplifiée)
    if (item.name && description) {
      const keywords = item.name.toLowerCase().split(' ');
      let keywordCount = 0;
      
      keywords.forEach(keyword => {
        if (keyword.length > 3) { // Ignorer les mots courts
          const descWords = description.toLowerCase().split(' ');
          const count = descWords.filter(word => word === keyword).length;
          keywordCount += count;
        }
      });
      
      const density = (keywordCount / description.split(' ').length) * 100;
      if (density < CONFIG.keywordDensityMin) {
        issues.push(`Densité de mots-clés trop faible (${density.toFixed(1)}%). Minimum recommandé: ${CONFIG.keywordDensityMin}%`);
      } else if (density > CONFIG.keywordDensityMax) {
        issues.push(`Densité de mots-clés trop élevée (${density.toFixed(1)}%). Maximum recommandé: ${CONFIG.keywordDensityMax}%`);
      }
    }
  }
  
  // Vérifier les images
  if (type === 'col') {
    const imageCount = item.images ? item.images.length : (item.imageUrl ? 1 : 0);
    if (imageCount < CONFIG.minImagesPerCol) {
      issues.push(`Nombre d'images insuffisant (${imageCount}). Minimum recommandé: ${CONFIG.minImagesPerCol}`);
    }
  }
  
  // Vérifier le slug
  if (item.slug) {
    const correctSlug = slugify(item.name, { lower: true, strict: true });
    if (item.slug !== correctSlug) {
      issues.push(`Slug non optimisé. Actuel: "${item.slug}", Recommandé: "${correctSlug}"`);
    }
  }
  
  return {
    item,
    issues,
    score: Math.max(0, 100 - (issues.length * 10))
  };
};

// Fonction pour générer un rapport d'analyse
const generateReport = (results) => {
  let report = '# Rapport d\'analyse SEO - Velo-Altitude\n\n';
  report += `Date: ${new Date().toISOString().split('T')[0]}\n\n`;
  
  // Résumé
  report += '## Résumé\n\n';
  
  const totalItems = results.length;
  const itemsWithIssues = results.filter(r => r.issues.length > 0).length;
  const averageScore = results.reduce((sum, r) => sum + r.score, 0) / totalItems;
  
  report += `- Total d'éléments analysés: ${totalItems}\n`;
  report += `- Éléments avec problèmes: ${itemsWithIssues} (${Math.round(itemsWithIssues/totalItems*100)}%)\n`;
  report += `- Score SEO moyen: ${averageScore.toFixed(1)}/100\n\n`;
  
  // Problèmes par catégorie
  const issueCategories = {};
  results.forEach(result => {
    result.issues.forEach(issue => {
      const category = issue.split(':')[0].trim();
      if (!issueCategories[category]) issueCategories[category] = 0;
      issueCategories[category]++;
    });
  });
  
  report += '## Problèmes par catégorie\n\n';
  Object.entries(issueCategories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      report += `- ${category}: ${count} occurrences\n`;
    });
  
  report += '\n## Détails par élément\n\n';
  
  // Trier par score
  results.sort((a, b) => a.score - b.score);
  
  results.forEach(result => {
    if (result.issues.length > 0) {
      report += `### ${result.item.name || result.item.id}\n\n`;
      report += `- Score: ${result.score}/100\n`;
      report += `- Problèmes:\n`;
      result.issues.forEach(issue => {
        report += `  - ${issue}\n`;
      });
      report += '\n';
    }
  });
  
  return report;
};

// Fonction pour améliorer automatiquement le contenu
const enhanceContent = (item) => {
  const enhanced = { ...item };
  
  // Corriger le slug
  if (item.name) {
    enhanced.slug = slugify(item.name, { lower: true, strict: true });
  }
  
  // Ajouter des champs manquants
  CONFIG.requiredFields.forEach(field => {
    if (!enhanced[field]) {
      switch (field) {
        case 'id':
          enhanced.id = enhanced.slug || `item-${Date.now()}`;
          break;
        case 'description':
          if (enhanced.name) {
            enhanced.description = {
              fr: `Découvrez ${enhanced.name}, une destination incontournable pour les cyclistes. Situé à ${enhanced.altitude || '?'} mètres d'altitude, ce col offre un défi sportif exceptionnel et des paysages à couper le souffle.`,
              en: `Discover ${enhanced.name}, a must-visit destination for cyclists. Located at ${enhanced.altitude || '?'} meters above sea level, this pass offers an exceptional sporting challenge and breathtaking landscapes.`
            };
          }
          break;
        case 'imageUrl':
          enhanced.imageUrl = `/images/placeholder.jpg`;
          break;
        default:
          enhanced[field] = '';
      }
    }
  });
  
  return enhanced;
};

// Fonction principale
async function main() {
  console.log(chalk.blue('=== Analyse et optimisation du contenu SEO - Velo-Altitude ===\n'));
  
  // Analyser les cols
  console.log(chalk.blue('\n=== Analyse des cols ===\n'));
  const colFiles = findFiles(SOURCE_DIRS.cols);
  
  let allCols = [];
  colFiles.forEach(filePath => {
    console.log(chalk.yellow(`Chargement de ${filePath}...`));
    const data = loadJsData(filePath);
    
    if (data) {
      // Gérer à la fois les tableaux et les objets uniques
      const cols = Array.isArray(data) ? data : 
                  (data.default && Array.isArray(data.default)) ? data.default : [data];
      
      allCols = [...allCols, ...cols];
      console.log(chalk.green(`✓ ${cols.length} cols chargés depuis ${filePath}`));
    }
  });
  
  console.log(chalk.blue(`\nRecherche de doublons parmi ${allCols.length} cols...`));
  const duplicates = findDuplicates(allCols);
  
  if (duplicates.length > 0) {
    console.log(chalk.red(`! ${duplicates.length} doublons trouvés:`));
    duplicates.forEach(dup => {
      console.log(chalk.red(`  - Doublon sur le champ "${dup.field}": "${dup.value}"`));
    });
  } else {
    console.log(chalk.green(`✓ Aucun doublon trouvé`));
  }
  
  console.log(chalk.blue('\nAnalyse de la qualité SEO des cols...'));
  const seoResults = allCols.map(col => analyzeSeoQuality(col, 'col'));
  
  const lowScoreCols = seoResults.filter(r => r.score < 70);
  if (lowScoreCols.length > 0) {
    console.log(chalk.yellow(`! ${lowScoreCols.length} cols ont un score SEO inférieur à 70/100`));
  }
  
  // Générer et sauvegarder le rapport
  const reportPath = path.join(__dirname, '../docs/seo-analysis-report.md');
  const report = generateReport(seoResults);
  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(chalk.green(`✓ Rapport d'analyse SEO généré: ${reportPath}`));
  
  // Améliorer automatiquement le contenu
  console.log(chalk.blue('\nAmélioration automatique du contenu...'));
  
  const enhancedColsDir = path.join(__dirname, '../src/data/enhanced');
  if (!fs.existsSync(enhancedColsDir)) {
    fs.mkdirSync(enhancedColsDir, { recursive: true });
  }
  
  // Améliorer et sauvegarder les cols avec un score faible
  lowScoreCols.forEach(result => {
    const enhanced = enhanceContent(result.item);
    const filePath = path.join(enhancedColsDir, `${enhanced.slug}.json`);
    fs.writeFileSync(filePath, JSON.stringify(enhanced, null, 2), 'utf8');
    console.log(chalk.green(`✓ Contenu amélioré pour "${enhanced.name}" -> ${filePath}`));
  });
  
  console.log(chalk.green('\n✓ Analyse et optimisation terminées avec succès'));
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red('Erreur lors de l\'exécution du script:', error));
});
