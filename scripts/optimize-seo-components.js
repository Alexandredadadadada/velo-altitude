/**
 * Script d'optimisation SEO des composants React
 * Velo-Altitude
 * 
 * Ce script analyse les composants React et les optimise pour le SEO
 * en ajoutant des balises meta, des données structurées et des éléments HTML sémantiques.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  componentsDir: path.join(__dirname, '../src/components'),
  pagesDir: path.join(__dirname, '../src/pages'),
  outputDir: path.join(__dirname, '../src/components/enhanced'),
  backupDir: path.join(__dirname, '../backup/components'),
  reportPath: path.join(__dirname, '../docs/seo-components-report.md'),
  // Composants prioritaires à optimiser
  priorityComponents: [
    'ColDetail.js',
    'ColsList.js',
    'HomePage.js',
    'NutritionPage.js',
    'TrainingPage.js',
    'SevenMajorsChallenge.js'
  ]
};

// Créer les répertoires nécessaires
function ensureDirectoriesExist() {
  [CONFIG.outputDir, CONFIG.backupDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Trouver tous les fichiers JS/JSX dans un répertoire (récursivement)
function findFiles(directory, extensions = ['.js', '.jsx']) {
  let results = [];
  
  if (!fs.existsSync(directory)) {
    return results;
  }
  
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(findFiles(filePath, extensions));
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  }
  
  return results;
}

// Analyser un fichier React pour déterminer s'il nécessite une optimisation SEO
function analyzeReactFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // Vérifier s'il s'agit d'un composant React
    const isReactComponent = content.includes('import React') || 
                            content.includes('from "react"') ||
                            content.includes('from \'react\'');
    
    if (!isReactComponent) {
      return null;
    }
    
    // Vérifier s'il s'agit d'une page ou d'un composant majeur
    const isMainComponent = content.includes('export default') && 
                           (content.includes('return (') || content.includes('return('));
    
    // Vérifier les éléments SEO existants
    const hasHelmet = content.includes('<Helmet') || content.includes('useHelmet');
    const hasMetaTags = content.includes('<meta') || 
                       content.includes('EnhancedMetaTags') || 
                       content.includes('MetaTags');
    const hasStructuredData = content.includes('application/ld+json') || 
                             content.includes('structuredData') || 
                             content.includes('SchemaOrg');
    const hasOptimizedImages = content.includes('OptimizedImage') || 
                              content.includes('loading="lazy"') || 
                              content.includes('srcSet');
    const hasAltTags = content.includes('alt=') && content.includes('<img');
    const hasSemanticHTML = content.includes('<article') || 
                           content.includes('<section') || 
                           content.includes('<main') || 
                           content.includes('<nav') || 
                           content.includes('<header') || 
                           content.includes('<footer');
    
    // Déterminer si le composant est prioritaire
    const isPriority = CONFIG.priorityComponents.includes(fileName);
    
    return {
      filePath,
      fileName,
      isMainComponent,
      isPriority,
      seoElements: {
        hasHelmet,
        hasMetaTags,
        hasStructuredData,
        hasOptimizedImages,
        hasAltTags,
        hasSemanticHTML
      },
      needsOptimization: isMainComponent && (!hasHelmet || !hasMetaTags || !hasStructuredData || !hasSemanticHTML)
    };
  } catch (error) {
    console.error(`Erreur lors de l'analyse de ${filePath}: ${error.message}`);
    return null;
  }
}

// Optimiser un composant React pour le SEO
function optimizeReactComponent(component) {
  try {
    console.log(`Optimisation de ${component.fileName}...`);
    
    // Lire le contenu du fichier
    const content = fs.readFileSync(component.filePath, 'utf8');
    
    // Créer une sauvegarde
    const backupPath = path.join(CONFIG.backupDir, component.fileName);
    fs.writeFileSync(backupPath, content, 'utf8');
    
    let optimizedContent = content;
    
    // Ajouter les imports nécessaires s'ils n'existent pas déjà
    if (!component.seoElements.hasHelmet && !component.seoElements.hasMetaTags) {
      // Ajouter l'import pour EnhancedMetaTags
      if (!optimizedContent.includes('import EnhancedMetaTags')) {
        const importStatement = `import EnhancedMetaTags from '../common/EnhancedMetaTags';\n`;
        
        // Trouver la position après les imports
        const importEndIndex = optimizedContent.lastIndexOf('import');
        const importEndLine = optimizedContent.indexOf('\n', importEndIndex) + 1;
        
        optimizedContent = 
          optimizedContent.substring(0, importEndLine) + 
          importStatement + 
          optimizedContent.substring(importEndLine);
      }
    }
    
    // Ajouter les imports pour OptimizedImage si nécessaire
    if (!component.seoElements.hasOptimizedImages && optimizedContent.includes('<img')) {
      const importStatement = `import OptimizedImage from '../common/OptimizedImage';\n`;
      
      // Trouver la position après les imports
      const importEndIndex = optimizedContent.lastIndexOf('import');
      const importEndLine = optimizedContent.indexOf('\n', importEndIndex) + 1;
      
      optimizedContent = 
        optimizedContent.substring(0, importEndLine) + 
        importStatement + 
        optimizedContent.substring(importEndLine);
    }
    
    // Ajouter les balises meta si elles n'existent pas
    if (!component.seoElements.hasMetaTags && !component.seoElements.hasHelmet) {
      // Déterminer le type de contenu pour les meta tags
      let contentType = 'website';
      let contentTitle = '';
      
      if (component.fileName.includes('Col')) {
        contentType = 'article';
        contentTitle = 'Détail du Col | Velo-Altitude';
      } else if (component.fileName.includes('Nutrition')) {
        contentType = 'article';
        contentTitle = 'Nutrition pour Cyclistes | Velo-Altitude';
      } else if (component.fileName.includes('Training')) {
        contentType = 'article';
        contentTitle = 'Programmes d\'Entraînement | Velo-Altitude';
      } else if (component.fileName.includes('Challenge')) {
        contentType = 'article';
        contentTitle = 'Défis Cyclistes | Velo-Altitude';
      } else if (component.fileName.includes('Home')) {
        contentTitle = 'Velo-Altitude | Le Dashboard Vélo pour Cols et Montagne';
      }
      
      // Trouver où insérer les meta tags (après le début du return)
      const returnIndex = optimizedContent.indexOf('return (');
      if (returnIndex !== -1) {
        const openingBracketIndex = optimizedContent.indexOf('(', returnIndex);
        const nextLineIndex = optimizedContent.indexOf('\n', openingBracketIndex) + 1;
        
        // Créer les meta tags
        const metaTags = `      <EnhancedMetaTags
        title="${contentTitle}"
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="${contentType}"
        imageUrl="/images/og-image.jpg"
      />\n`;
        
        optimizedContent = 
          optimizedContent.substring(0, nextLineIndex) + 
          metaTags + 
          optimizedContent.substring(nextLineIndex);
      }
    }
    
    // Ajouter des données structurées si elles n'existent pas
    if (!component.seoElements.hasStructuredData && component.isMainComponent) {
      // Déterminer le type de schéma à ajouter
      let schemaType = 'WebSite';
      let schemaName = 'Velo-Altitude';
      let schemaDescription = 'La plateforme complète pour les cyclistes passionnés de cols et de montagne.';
      
      if (component.fileName.includes('Col')) {
        schemaType = 'SportsActivity';
        schemaName = '{col.name}';
        schemaDescription = '{col.description}';
      } else if (component.fileName.includes('Nutrition')) {
        schemaType = 'Article';
        schemaName = 'Guide Nutritionnel pour Cyclistes';
        schemaDescription = 'Conseils et recettes adaptés aux cyclistes pour optimiser les performances en montagne.';
      } else if (component.fileName.includes('Training')) {
        schemaType = 'ExercisePlan';
        schemaName = 'Programme d\'Entraînement Cycliste';
        schemaDescription = 'Plans d\'entraînement spécifiques pour préparer les ascensions de cols.';
      }
      
      // Trouver où insérer les données structurées (après le début du return)
      const returnIndex = optimizedContent.indexOf('return (');
      if (returnIndex !== -1) {
        const openingBracketIndex = optimizedContent.indexOf('(', returnIndex);
        const nextLineIndex = optimizedContent.indexOf('\n', openingBracketIndex) + 1;
        
        // Créer les données structurées
        const structuredData = `      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "${schemaType}",
          "name": "${schemaName}",
          "description": "${schemaDescription}",
          "url": "https://velo-altitude.com${component.fileName.includes('Home') ? '/' : '/' + component.fileName.replace('.js', '').toLowerCase()}"
        }
      </script>\n`;
        
        optimizedContent = 
          optimizedContent.substring(0, nextLineIndex) + 
          structuredData + 
          optimizedContent.substring(nextLineIndex);
      }
    }
    
    // Remplacer les balises img par OptimizedImage si nécessaire
    if (!component.seoElements.hasOptimizedImages && optimizedContent.includes('<img')) {
      // Regex pour trouver les balises img
      const imgRegex = /<img\s+([^>]*)src=["']([^"']*)["']([^>]*)>/g;
      
      optimizedContent = optimizedContent.replace(imgRegex, (match, before, src, after) => {
        // Extraire l'attribut alt s'il existe
        let alt = '';
        const altMatch = (before + after).match(/alt=["']([^"']*)["']/);
        if (altMatch) {
          alt = altMatch[1];
        } else {
          // Générer un alt par défaut
          alt = "Image Velo-Altitude";
        }
        
        return `<OptimizedImage src="${src}" alt="${alt}" />`;
      });
    }
    
    // Ajouter des balises HTML sémantiques si nécessaires
    if (!component.seoElements.hasSemanticHTML && component.isMainComponent) {
      // Remplacer les div principaux par des balises sémantiques
      const divRegex = /<div\s+([^>]*)className=["']([^"']*container|[^"']*main|[^"']*content)["']([^>]*)>/g;
      
      optimizedContent = optimizedContent.replace(divRegex, (match, before, className, after) => {
        if (className.includes('container') || className.includes('main')) {
          return `<main ${before}className="${className}"${after}>`;
        } else if (className.includes('content')) {
          return `<article ${before}className="${className}"${after}>`;
        }
        return match;
      });
      
      // Remplacer les fermetures de div correspondantes
      // Note: ceci est une approximation simplifiée, une analyse AST serait plus précise
      optimizedContent = optimizedContent.replace(/<\/div>(\s*)<\/main>/g, '</main>');
      optimizedContent = optimizedContent.replace(/<\/div>(\s*)<\/article>/g, '</article>');
    }
    
    // Sauvegarder le fichier optimisé
    const outputPath = path.join(CONFIG.outputDir, component.fileName);
    fs.writeFileSync(outputPath, optimizedContent, 'utf8');
    
    console.log(`✓ Optimisation terminée: ${outputPath}`);
    
    return {
      ...component,
      optimized: true,
      outputPath
    };
  } catch (error) {
    console.error(`Erreur lors de l'optimisation de ${component.fileName}: ${error.message}`);
    return {
      ...component,
      optimized: false,
      error: error.message
    };
  }
}

// Générer un rapport sur les optimisations effectuées
function generateReport(components, optimizedComponents) {
  console.log('\nGénération du rapport...');
  
  let report = '# Rapport d\'Optimisation SEO des Composants React - Velo-Altitude\n\n';
  report += `*Date: ${new Date().toISOString().split('T')[0]}*\n\n`;
  
  // Statistiques
  report += '## Statistiques\n\n';
  report += `- Composants React analysés: ${components.length}\n`;
  report += `- Composants nécessitant une optimisation: ${components.filter(c => c.needsOptimization).length}\n`;
  report += `- Composants optimisés avec succès: ${optimizedComponents.filter(c => c.optimized).length}\n`;
  report += `- Composants prioritaires optimisés: ${optimizedComponents.filter(c => c.isPriority && c.optimized).length}/${components.filter(c => c.isPriority).length}\n\n`;
  
  // Détails des optimisations
  report += '## Détails des optimisations\n\n';
  
  optimizedComponents.forEach(comp => {
    report += `### ${comp.fileName}\n\n`;
    report += `- Chemin: \`${path.relative(__dirname, comp.filePath).replace(/\\/g, '/')}\`\n`;
    report += `- Type: ${comp.isMainComponent ? 'Composant principal' : 'Composant secondaire'}\n`;
    report += `- Priorité: ${comp.isPriority ? 'Haute' : 'Normale'}\n`;
    report += `- Statut: ${comp.optimized ? '✅ Optimisé' : '❌ Échec'}\n`;
    
    if (comp.optimized) {
      report += `- Optimisations effectuées:\n`;
      if (!comp.seoElements.hasMetaTags) report += `  - Ajout de balises meta\n`;
      if (!comp.seoElements.hasStructuredData) report += `  - Ajout de données structurées\n`;
      if (!comp.seoElements.hasOptimizedImages) report += `  - Optimisation des images\n`;
      if (!comp.seoElements.hasSemanticHTML) report += `  - Ajout de HTML sémantique\n`;
      report += `- Fichier optimisé: \`${path.relative(__dirname, comp.outputPath).replace(/\\/g, '/')}\`\n`;
    } else if (comp.error) {
      report += `- Erreur: ${comp.error}\n`;
    }
    
    report += '\n';
  });
  
  // Recommandations
  report += '## Recommandations\n\n';
  report += '1. **Remplacer les composants originaux** par leurs versions optimisées\n';
  report += '2. **Vérifier manuellement** les optimisations pour s\'assurer qu\'elles n\'affectent pas le fonctionnement\n';
  report += '3. **Compléter les meta tags** avec des informations plus spécifiques pour chaque page\n';
  report += '4. **Améliorer les données structurées** en ajoutant plus de détails (coordonnées GPS, dates, etc.)\n';
  report += '5. **Optimiser les images** restantes et ajouter des attributs alt descriptifs\n\n';
  
  // Écrire le rapport
  fs.writeFileSync(CONFIG.reportPath, report, 'utf8');
  console.log(`✓ Rapport généré: ${CONFIG.reportPath}`);
}

// Fonction principale
async function main() {
  console.log('=== Optimisation SEO des composants React - Velo-Altitude ===\n');
  
  // S'assurer que les répertoires existent
  ensureDirectoriesExist();
  
  // Trouver tous les fichiers React
  console.log('Recherche des fichiers React...');
  const componentFiles = [
    ...findFiles(CONFIG.componentsDir),
    ...findFiles(CONFIG.pagesDir)
  ];
  console.log(`✓ ${componentFiles.length} fichiers trouvés\n`);
  
  // Analyser les composants
  console.log('Analyse des composants...');
  const components = componentFiles
    .map(file => analyzeReactFile(file))
    .filter(Boolean);
  
  const componentsToOptimize = components
    .filter(comp => comp.needsOptimization || comp.isPriority)
    .sort((a, b) => {
      // Trier par priorité puis par besoin d'optimisation
      if (a.isPriority && !b.isPriority) return -1;
      if (!a.isPriority && b.isPriority) return 1;
      if (a.needsOptimization && !b.needsOptimization) return -1;
      if (!a.needsOptimization && b.needsOptimization) return 1;
      return 0;
    });
  
  console.log(`✓ ${componentsToOptimize.length} composants à optimiser\n`);
  
  // Optimiser les composants
  console.log('Optimisation des composants...');
  const optimizedComponents = [];
  
  for (const component of componentsToOptimize) {
    const optimized = optimizeReactComponent(component);
    optimizedComponents.push(optimized);
  }
  
  // Générer un rapport
  generateReport(components, optimizedComponents);
  
  console.log('\n=== Optimisation terminée avec succès ===');
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(`Erreur lors de l'exécution du script: ${error.message}`);
});
