/**
 * Script d'optimisation SEO des composants React
 * Velo-Altitude
 * 
 * Ce script analyse les composants React du projet et les améliore
 * pour une meilleure optimisation SEO, en ajoutant les balises
 * nécessaires et en standardisant la structure.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const chalk = require('chalk') || { green: (text) => text, red: (text) => text, yellow: (text) => text, blue: (text) => text };

// Configuration
const CONFIG = {
  componentsDir: path.join(__dirname, '../src/components'),
  pagesDir: path.join(__dirname, '../src/pages'),
  enhancedMetaTagsPath: path.join(__dirname, '../src/components/common/EnhancedMetaTags.js'),
  optimizedImagePath: path.join(__dirname, '../src/components/common/OptimizedImage.js'),
  backupDir: path.join(__dirname, '../src/components/backup')
};

// Modèles d'importation à ajouter
const IMPORT_TEMPLATES = {
  enhancedMetaTags: "import EnhancedMetaTags from '../common/EnhancedMetaTags';",
  optimizedImage: "import OptimizedImage from '../common/OptimizedImage';",
  structuredData: "import { generateStructuredData } from '../../utils/schemaTemplates';"
};

// Modèles de composants à insérer
const COMPONENT_TEMPLATES = {
  enhancedMetaTags: (props) => `<EnhancedMetaTags
  title="${props.title || '{title}'}"
  description="${props.description || '{description}'}"
  canonicalUrl="${props.canonicalUrl || '{canonicalUrl}'}"
  imageUrl="${props.imageUrl || '{imageUrl}'}"
  type="${props.type || 'article'}"
  locale="${props.locale || '{locale}'}"
  alternateUrls={${props.alternateUrls || '{alternateUrls}'}}
/>`,
  structuredData: (props) => `<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(
      generateStructuredData({
        type: "${props.type || 'TouristAttraction'}",
        name: ${props.name || '{name}'},
        description: ${props.description || '{description}'},
        image: ${props.image || '{imageUrl}'},
        url: ${props.url || 'window.location.href'}
      })
    )
  }}
/>`
};

// Fonction pour créer le répertoire de sauvegarde
function createBackupDirectory() {
  console.log(chalk.blue('Création du répertoire de sauvegarde...'));
  
  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    console.log(chalk.green(`✓ Répertoire de sauvegarde créé: ${CONFIG.backupDir}`));
  } else {
    console.log(chalk.yellow(`! Répertoire de sauvegarde existant: ${CONFIG.backupDir}`));
  }
}

// Fonction pour trouver tous les fichiers JS/JSX dans un répertoire (récursivement)
function findReactFiles(directory) {
  let results = [];
  
  if (!fs.existsSync(directory)) {
    return results;
  }
  
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(findReactFiles(filePath));
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      // Exclure les fichiers de test et les fichiers de configuration
      if (!file.includes('.test.') && !file.includes('.config.') && !file.includes('.stories.')) {
        results.push(filePath);
      }
    }
  }
  
  return results;
}

// Fonction pour analyser un fichier React et déterminer s'il s'agit d'un composant de page
function analyzeReactFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifier s'il s'agit d'un composant React
    const isReactComponent = content.includes('import React') || 
                             content.includes('from "react"') ||
                             content.includes('from \'react\'');
    
    if (!isReactComponent) {
      return { filePath, isPage: false, needsOptimization: false };
    }
    
    // Vérifier s'il s'agit d'un composant de page (contient un export default et retourne du JSX)
    const isPage = content.includes('export default') && 
                  (content.includes('return (') || content.includes('return('));
    
    // Vérifier s'il a besoin d'optimisation SEO
    const hasEnhancedMetaTags = content.includes('EnhancedMetaTags');
    const hasStructuredData = content.includes('application/ld+json') || 
                             content.includes('generateStructuredData');
    const hasOptimizedImage = content.includes('OptimizedImage');
    
    // Vérifier s'il s'agit d'un composant qui affiche du contenu principal
    const isPotentialContentPage = content.includes('className="page"') ||
                                  content.includes('className="container"') ||
                                  content.includes('<main') ||
                                  content.includes('<article') ||
                                  content.includes('<section');
    
    // Déterminer si le composant a besoin d'optimisation
    const needsOptimization = isPage && isPotentialContentPage && 
                             (!hasEnhancedMetaTags || !hasStructuredData || !hasOptimizedImage);
    
    return {
      filePath,
      isPage,
      isPotentialContentPage,
      hasEnhancedMetaTags,
      hasStructuredData,
      hasOptimizedImage,
      needsOptimization
    };
    
  } catch (error) {
    console.log(chalk.red(`✗ Erreur lors de l'analyse de ${filePath}: ${error.message}`));
    return { filePath, isPage: false, needsOptimization: false, error: error.message };
  }
}

// Fonction pour optimiser un fichier React
function optimizeReactFile(fileInfo) {
  console.log(chalk.blue(`Optimisation de ${fileInfo.filePath}...`));
  
  try {
    // Lire le contenu du fichier
    let content = fs.readFileSync(fileInfo.filePath, 'utf8');
    
    // Créer une sauvegarde
    const backupPath = path.join(CONFIG.backupDir, path.basename(fileInfo.filePath));
    fs.writeFileSync(backupPath, content, 'utf8');
    
    // Ajouter les imports manquants
    if (!fileInfo.hasEnhancedMetaTags) {
      // Trouver la dernière ligne d'import
      const lastImportIndex = content.lastIndexOf('import ');
      const lastImportLineEnd = content.indexOf('\n', lastImportIndex);
      
      if (lastImportIndex !== -1 && lastImportLineEnd !== -1) {
        // Insérer l'import après la dernière ligne d'import
        content = content.substring(0, lastImportLineEnd + 1) + 
                 IMPORT_TEMPLATES.enhancedMetaTags + '\n' + 
                 content.substring(lastImportLineEnd + 1);
      }
    }
    
    if (!fileInfo.hasStructuredData && !content.includes('schemaTemplates')) {
      // Trouver la dernière ligne d'import
      const lastImportIndex = content.lastIndexOf('import ');
      const lastImportLineEnd = content.indexOf('\n', lastImportIndex);
      
      if (lastImportIndex !== -1 && lastImportLineEnd !== -1) {
        // Insérer l'import après la dernière ligne d'import
        content = content.substring(0, lastImportLineEnd + 1) + 
                 IMPORT_TEMPLATES.structuredData + '\n' + 
                 content.substring(lastImportLineEnd + 1);
      }
    }
    
    // Extraire le titre et la description pour les métadonnées
    let title = '';
    let description = '';
    
    // Rechercher un titre dans le contenu
    const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/s) || 
                      content.match(/title=["'](.*?)["']/);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
    
    // Rechercher une description dans le contenu
    const descriptionMatch = content.match(/description=["'](.*?)["']/) || 
                            content.match(/<p[^>]*>(.*?)<\/p>/s);
    if (descriptionMatch) {
      description = descriptionMatch[1].trim();
    }
    
    // Ajouter les composants SEO manquants
    if (!fileInfo.hasEnhancedMetaTags) {
      // Trouver le début du rendu JSX (après le return)
      const returnIndex = content.indexOf('return (');
      const jsxStartIndex = content.indexOf('<', returnIndex);
      
      if (jsxStartIndex !== -1) {
        // Insérer le composant EnhancedMetaTags au début du JSX
        const metaTagsComponent = COMPONENT_TEMPLATES.enhancedMetaTags({
          title,
          description
        });
        
        content = content.substring(0, jsxStartIndex) + 
                 '<>\n      ' + metaTagsComponent + '\n\n      ' + 
                 content.substring(jsxStartIndex);
        
        // Ajouter la balise de fermeture si nécessaire
        if (!content.includes('</Fragment>') && !content.includes('</>\n')) {
          const lastJsxCloseIndex = content.lastIndexOf('</');
          const lastJsxCloseEndIndex = content.indexOf('>', lastJsxCloseIndex);
          
          if (lastJsxCloseIndex !== -1 && lastJsxCloseEndIndex !== -1) {
            content = content.substring(0, lastJsxCloseEndIndex + 1) + 
                     '\n    </>' + 
                     content.substring(lastJsxCloseEndIndex + 1);
          }
        }
      }
    }
    
    if (!fileInfo.hasStructuredData) {
      // Trouver l'emplacement après EnhancedMetaTags ou au début du JSX
      let insertionIndex;
      
      if (content.includes('EnhancedMetaTags')) {
        insertionIndex = content.indexOf('>', content.indexOf('EnhancedMetaTags')) + 1;
      } else {
        const returnIndex = content.indexOf('return (');
        insertionIndex = content.indexOf('<', returnIndex) + 1;
        
        // Avancer jusqu'à la fin de la première balise
        while (insertionIndex < content.length && content[insertionIndex] !== '>') {
          insertionIndex++;
        }
        insertionIndex++;
      }
      
      if (insertionIndex !== -1) {
        // Insérer le composant StructuredData
        const structuredDataComponent = '\n      ' + COMPONENT_TEMPLATES.structuredData({
          name: title ? `"${title}"` : undefined,
          description: description ? `"${description}"` : undefined
        }) + '\n';
        
        content = content.substring(0, insertionIndex) + 
                 structuredDataComponent + 
                 content.substring(insertionIndex);
      }
    }
    
    // Remplacer les balises img standard par OptimizedImage
    if (!fileInfo.hasOptimizedImage && content.includes('<img')) {
      // Ajouter l'import si nécessaire
      if (!content.includes('OptimizedImage')) {
        const lastImportIndex = content.lastIndexOf('import ');
        const lastImportLineEnd = content.indexOf('\n', lastImportIndex);
        
        if (lastImportIndex !== -1 && lastImportLineEnd !== -1) {
          content = content.substring(0, lastImportLineEnd + 1) + 
                   IMPORT_TEMPLATES.optimizedImage + '\n' + 
                   content.substring(lastImportLineEnd + 1);
        }
      }
      
      // Remplacer les balises img par OptimizedImage
      content = content.replace(
        /<img\s+([^>]*?)src=["'](.*?)["']([^>]*?)>/g,
        (match, beforeSrc, src, afterSrc) => {
          // Extraire les attributs
          const altMatch = match.match(/alt=["'](.*?)["']/);
          const alt = altMatch ? altMatch[1] : '';
          
          const widthMatch = match.match(/width=["'](.*?)["']/);
          const width = widthMatch ? widthMatch[1] : '100%';
          
          const heightMatch = match.match(/height=["'](.*?)["']/);
          const height = heightMatch ? heightMatch[1] : 'auto';
          
          // Construire le composant OptimizedImage
          return `<OptimizedImage src="${src}" alt="${alt}" width="${width}" height="${height}" />`;
        }
      );
    }
    
    // Sauvegarder le fichier optimisé
    fs.writeFileSync(fileInfo.filePath, content, 'utf8');
    console.log(chalk.green(`✓ Fichier optimisé: ${fileInfo.filePath}`));
    
    return true;
  } catch (error) {
    console.log(chalk.red(`✗ Erreur lors de l'optimisation de ${fileInfo.filePath}: ${error.message}`));
    return false;
  }
}

// Fonction pour générer un rapport d'optimisation
function generateOptimizationReport(results) {
  const reportPath = path.join(__dirname, '../docs/seo-optimization-report.md');
  
  let report = '# Rapport d\'Optimisation SEO des Composants React - Velo-Altitude\n\n';
  report += `Date: ${new Date().toISOString().split('T')[0]}\n\n`;
  
  // Statistiques
  const totalFiles = results.length;
  const pagesCount = results.filter(r => r.isPage).length;
  const contentPagesCount = results.filter(r => r.isPotentialContentPage).length;
  const optimizedCount = results.filter(r => r.optimized).length;
  
  report += '## Statistiques\n\n';
  report += `- Fichiers React analysés: ${totalFiles}\n`;
  report += `- Composants de page: ${pagesCount}\n`;
  report += `- Pages de contenu: ${contentPagesCount}\n`;
  report += `- Composants optimisés: ${optimizedCount}\n\n`;
  
  // État SEO avant optimisation
  const beforeOptimization = {
    withEnhancedMetaTags: results.filter(r => r.hasEnhancedMetaTags).length,
    withStructuredData: results.filter(r => r.hasStructuredData).length,
    withOptimizedImage: results.filter(r => r.hasOptimizedImage).length
  };
  
  report += '## État SEO avant optimisation\n\n';
  report += `- Composants avec EnhancedMetaTags: ${beforeOptimization.withEnhancedMetaTags} (${Math.round(beforeOptimization.withEnhancedMetaTags/contentPagesCount*100)}%)\n`;
  report += `- Composants avec Structured Data: ${beforeOptimization.withStructuredData} (${Math.round(beforeOptimization.withStructuredData/contentPagesCount*100)}%)\n`;
  report += `- Composants avec OptimizedImage: ${beforeOptimization.withOptimizedImage} (${Math.round(beforeOptimization.withOptimizedImage/contentPagesCount*100)}%)\n\n`;
  
  // État SEO après optimisation
  const afterOptimization = {
    withEnhancedMetaTags: beforeOptimization.withEnhancedMetaTags + results.filter(r => r.optimized && !r.hasEnhancedMetaTags).length,
    withStructuredData: beforeOptimization.withStructuredData + results.filter(r => r.optimized && !r.hasStructuredData).length,
    withOptimizedImage: beforeOptimization.withOptimizedImage + results.filter(r => r.optimized && !r.hasOptimizedImage).length
  };
  
  report += '## État SEO après optimisation\n\n';
  report += `- Composants avec EnhancedMetaTags: ${afterOptimization.withEnhancedMetaTags} (${Math.round(afterOptimization.withEnhancedMetaTags/contentPagesCount*100)}%)\n`;
  report += `- Composants avec Structured Data: ${afterOptimization.withStructuredData} (${Math.round(afterOptimization.withStructuredData/contentPagesCount*100)}%)\n`;
  report += `- Composants avec OptimizedImage: ${afterOptimization.withOptimizedImage} (${Math.round(afterOptimization.withOptimizedImage/contentPagesCount*100)}%)\n\n`;
  
  // Détails des composants optimisés
  report += '## Composants optimisés\n\n';
  
  results.filter(r => r.optimized).forEach(result => {
    const relativePath = path.relative(__dirname, result.filePath).replace(/\\/g, '/');
    report += `### ${path.basename(result.filePath)}\n\n`;
    report += `- Chemin: \`${relativePath}\`\n`;
    report += `- Optimisations appliquées:\n`;
    
    if (!result.hasEnhancedMetaTags) {
      report += `  - Ajout du composant EnhancedMetaTags\n`;
    }
    
    if (!result.hasStructuredData) {
      report += `  - Ajout de données structurées (JSON-LD)\n`;
    }
    
    if (!result.hasOptimizedImage) {
      report += `  - Remplacement des balises img par OptimizedImage\n`;
    }
    
    report += '\n';
  });
  
  // Composants restant à optimiser manuellement
  const remainingToOptimize = results.filter(r => r.needsOptimization && !r.optimized);
  
  if (remainingToOptimize.length > 0) {
    report += '## Composants à optimiser manuellement\n\n';
    
    remainingToOptimize.forEach(result => {
      const relativePath = path.relative(__dirname, result.filePath).replace(/\\/g, '/');
      report += `- ${path.basename(result.filePath)} (\`${relativePath}\`)\n`;
    });
  }
  
  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(chalk.green(`✓ Rapport d'optimisation généré: ${reportPath}`));
}

// Fonction principale
async function main() {
  console.log(chalk.blue('=== Optimisation SEO des composants React - Velo-Altitude ===\n'));
  
  // Créer le répertoire de sauvegarde
  createBackupDirectory();
  
  // Trouver tous les fichiers React
  console.log(chalk.blue('Recherche des fichiers React...'));
  
  const componentFiles = findReactFiles(CONFIG.componentsDir);
  const pageFiles = findReactFiles(CONFIG.pagesDir);
  const allFiles = [...componentFiles, ...pageFiles];
  
  console.log(chalk.green(`✓ ${allFiles.length} fichiers React trouvés (${componentFiles.length} composants, ${pageFiles.length} pages)`));
  
  // Analyser les fichiers
  console.log(chalk.blue('\nAnalyse des fichiers React...'));
  
  const analysisResults = allFiles.map(analyzeReactFile);
  
  const pageComponents = analysisResults.filter(r => r.isPage);
  const contentPages = analysisResults.filter(r => r.isPotentialContentPage);
  const componentsToOptimize = analysisResults.filter(r => r.needsOptimization);
  
  console.log(chalk.green(`✓ Analyse terminée: ${pageComponents.length} composants de page, ${contentPages.length} pages de contenu`));
  console.log(chalk.yellow(`! ${componentsToOptimize.length} composants nécessitent une optimisation SEO`));
  
  // Optimiser les composants
  console.log(chalk.blue('\nOptimisation des composants...'));
  
  const optimizationResults = [];
  
  for (const fileInfo of componentsToOptimize) {
    const optimized = optimizeReactFile(fileInfo);
    optimizationResults.push({
      ...fileInfo,
      optimized
    });
  }
  
  const successCount = optimizationResults.filter(r => r.optimized).length;
  console.log(chalk.green(`✓ Optimisation terminée: ${successCount}/${componentsToOptimize.length} composants optimisés avec succès`));
  
  // Générer le rapport
  generateOptimizationReport([...analysisResults.filter(r => !r.needsOptimization), ...optimizationResults]);
  
  console.log(chalk.green('\n✓ Processus d\'optimisation SEO terminé avec succès'));
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red('Erreur lors de l\'exécution du script:', error));
});
