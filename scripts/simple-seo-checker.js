/**
 * Script simple de vérification SEO pour Velo-Altitude
 * 
 * Ce script analyse les composants React et les fichiers de données
 * pour identifier les problèmes SEO les plus courants et générer un rapport.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  componentsDir: path.join(__dirname, '../src/components'),
  pagesDir: path.join(__dirname, '../src/pages'),
  dataDir: path.join(__dirname, '../src/data'),
  reportPath: path.join(__dirname, '../docs/simple-seo-report.md')
};

// Fonction pour trouver tous les fichiers JS/JSX dans un répertoire (récursivement)
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

// Fonction pour analyser un fichier React
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
    
    // Vérifier les éléments SEO
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
    
    // Vérifier s'il s'agit d'une page principale
    const isMainPage = content.includes('export default') && 
                      (content.includes('return (') || content.includes('return('));
    
    // Calculer un score SEO simple
    let seoScore = 0;
    let maxScore = 0;
    
    if (isMainPage) {
      seoScore += hasHelmet || hasMetaTags ? 20 : 0;
      seoScore += hasStructuredData ? 20 : 0;
      seoScore += hasOptimizedImages ? 15 : 0;
      seoScore += hasAltTags ? 15 : 0;
      seoScore += hasSemanticHTML ? 15 : 0;
      maxScore = 85;
    } else {
      seoScore += hasOptimizedImages ? 15 : 0;
      seoScore += hasAltTags ? 15 : 0;
      seoScore += hasSemanticHTML ? 15 : 0;
      maxScore = 45;
    }
    
    // Identifier les problèmes
    const issues = [];
    
    if (isMainPage && !hasHelmet && !hasMetaTags) {
      issues.push("Pas de balises meta ou Helmet pour le SEO");
    }
    
    if (isMainPage && !hasStructuredData) {
      issues.push("Pas de données structurées (JSON-LD)");
    }
    
    if (!hasOptimizedImages && content.includes('<img')) {
      issues.push("Images non optimisées (pas de lazy loading, srcSet, etc.)");
    }
    
    if (!hasAltTags && content.includes('<img')) {
      issues.push("Images sans attributs alt");
    }
    
    if (!hasSemanticHTML && isMainPage) {
      issues.push("Pas de HTML sémantique (article, section, main, etc.)");
    }
    
    return {
      file: filePath,
      fileName,
      isMainPage,
      seoScore,
      maxScore,
      scorePercentage: Math.round((seoScore / maxScore) * 100),
      issues
    };
    
  } catch (error) {
    console.error(`Erreur lors de l'analyse de ${filePath}: ${error.message}`);
    return null;
  }
}

// Fonction pour analyser un fichier de données
function analyzeDataFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // Vérifier s'il s'agit d'un fichier de données
    const isDataFile = content.includes('export default') || 
                      content.includes('module.exports');
    
    if (!isDataFile) {
      return null;
    }
    
    // Vérifier les éléments SEO dans les données
    const hasSlug = content.includes('slug:') || content.includes('"slug"');
    const hasDescription = content.includes('description:') || 
                          content.includes('"description"');
    const hasImages = content.includes('imageUrl:') || 
                     content.includes('"imageUrl"') || 
                     content.includes('images:') || 
                     content.includes('"images"');
    const hasAlt = content.includes('alt:') || content.includes('"alt"');
    
    // Calculer un score SEO simple
    let seoScore = 0;
    
    seoScore += hasSlug ? 25 : 0;
    seoScore += hasDescription ? 25 : 0;
    seoScore += hasImages ? 25 : 0;
    seoScore += hasAlt ? 25 : 0;
    
    // Identifier les problèmes
    const issues = [];
    
    if (!hasSlug) {
      issues.push("Pas de slugs pour les URLs SEO-friendly");
    }
    
    if (!hasDescription) {
      issues.push("Pas de descriptions pour le contenu");
    }
    
    if (!hasImages) {
      issues.push("Pas d'images référencées");
    }
    
    if (!hasAlt && hasImages) {
      issues.push("Images sans textes alternatifs");
    }
    
    return {
      file: filePath,
      fileName,
      isDataFile: true,
      seoScore,
      maxScore: 100,
      scorePercentage: seoScore,
      issues
    };
    
  } catch (error) {
    console.error(`Erreur lors de l'analyse de ${filePath}: ${error.message}`);
    return null;
  }
}

// Fonction pour générer un rapport
function generateReport(results) {
  const componentResults = results.filter(r => r && !r.isDataFile);
  const dataResults = results.filter(r => r && r.isDataFile);
  
  // Calculer les statistiques
  const totalComponents = componentResults.length;
  const totalDataFiles = dataResults.length;
  
  const avgComponentScore = componentResults.reduce((sum, r) => sum + r.scorePercentage, 0) / totalComponents;
  const avgDataScore = dataResults.reduce((sum, r) => sum + r.scorePercentage, 0) / totalDataFiles;
  
  const lowScoringComponents = componentResults.filter(r => r.scorePercentage < 50);
  const lowScoringData = dataResults.filter(r => r.scorePercentage < 50);
  
  // Générer le rapport
  let report = '# Rapport SEO Simplifié - Velo-Altitude\n\n';
  report += `Date: ${new Date().toISOString().split('T')[0]}\n\n`;
  
  // Résumé
  report += '## Résumé\n\n';
  report += `- Composants React analysés: ${totalComponents}\n`;
  report += `- Fichiers de données analysés: ${totalDataFiles}\n`;
  report += `- Score SEO moyen des composants: ${avgComponentScore.toFixed(1)}%\n`;
  report += `- Score SEO moyen des données: ${avgDataScore.toFixed(1)}%\n`;
  report += `- Composants avec score faible (<50%): ${lowScoringComponents.length}\n`;
  report += `- Fichiers de données avec score faible (<50%): ${lowScoringData.length}\n\n`;
  
  // Problèmes courants
  report += '## Problèmes SEO courants\n\n';
  
  const allIssues = {};
  results.forEach(r => {
    if (r && r.issues) {
      r.issues.forEach(issue => {
        if (!allIssues[issue]) allIssues[issue] = 0;
        allIssues[issue]++;
      });
    }
  });
  
  Object.entries(allIssues)
    .sort((a, b) => b[1] - a[1])
    .forEach(([issue, count]) => {
      report += `- ${issue}: ${count} occurrences\n`;
    });
  
  // Composants avec score faible
  if (lowScoringComponents.length > 0) {
    report += '\n## Composants React à améliorer en priorité\n\n';
    
    lowScoringComponents
      .sort((a, b) => a.scorePercentage - b.scorePercentage)
      .forEach(comp => {
        report += `### ${comp.fileName} (Score: ${comp.scorePercentage}%)\n\n`;
        report += `- Chemin: \`${path.relative(__dirname, comp.file).replace(/\\/g, '/')}\`\n`;
        report += `- Problèmes:\n`;
        
        comp.issues.forEach(issue => {
          report += `  - ${issue}\n`;
        });
        
        report += '\n';
      });
  }
  
  // Fichiers de données avec score faible
  if (lowScoringData.length > 0) {
    report += '\n## Fichiers de données à améliorer en priorité\n\n';
    
    lowScoringData
      .sort((a, b) => a.scorePercentage - b.scorePercentage)
      .forEach(data => {
        report += `### ${data.fileName} (Score: ${data.scorePercentage}%)\n\n`;
        report += `- Chemin: \`${path.relative(__dirname, data.file).replace(/\\/g, '/')}\`\n`;
        report += `- Problèmes:\n`;
        
        data.issues.forEach(issue => {
          report += `  - ${issue}\n`;
        });
        
        report += '\n';
      });
  }
  
  // Recommandations
  report += '\n## Recommandations générales\n\n';
  report += '1. **Ajouter des métadonnées SEO** à toutes les pages principales:\n';
  report += '   - Utiliser le composant `EnhancedMetaTags` pour gérer les balises meta\n';
  report += '   - Inclure title, description, canonical URL, et Open Graph tags\n\n';
  
  report += '2. **Implémenter des données structurées** (JSON-LD):\n';
  report += '   - Utiliser le script `generate-structured-data.js` pour générer des données structurées\n';
  report += '   - Ajouter des schémas appropriés pour chaque type de contenu\n\n';
  
  report += '3. **Optimiser les images**:\n';
  report += '   - Remplacer les balises `<img>` par le composant `OptimizedImage`\n';
  report += '   - Ajouter des attributs alt descriptifs à toutes les images\n';
  report += '   - Implémenter le lazy loading et les formats d\'image modernes\n\n';
  
  report += '4. **Standardiser les URLs**:\n';
  report += '   - Utiliser le script `standardize-url-structure.js` pour uniformiser les URLs\n';
  report += '   - S\'assurer que tous les contenus ont des slugs SEO-friendly\n\n';
  
  report += '5. **Utiliser du HTML sémantique**:\n';
  report += '   - Structurer les pages avec des balises `<article>`, `<section>`, `<main>`, etc.\n';
  report += '   - Améliorer l\'accessibilité avec des landmarks ARIA appropriés\n\n';
  
  return report;
}

// Fonction principale
function main() {
  console.log('=== Analyse SEO simplifiée - Velo-Altitude ===\n');
  
  // Trouver tous les fichiers
  console.log('Recherche des fichiers...');
  
  const componentFiles = [
    ...findFiles(CONFIG.componentsDir),
    ...findFiles(CONFIG.pagesDir)
  ];
  
  const dataFiles = findFiles(CONFIG.dataDir);
  
  console.log(`Trouvé ${componentFiles.length} fichiers de composants et ${dataFiles.length} fichiers de données\n`);
  
  // Analyser les fichiers
  console.log('Analyse des fichiers...');
  
  const componentResults = componentFiles.map(file => analyzeReactFile(file)).filter(Boolean);
  const dataResults = dataFiles.map(file => analyzeDataFile(file)).filter(Boolean);
  
  const results = [...componentResults, ...dataResults];
  
  console.log(`Analyse terminée: ${results.length} fichiers analysés\n`);
  
  // Générer le rapport
  console.log('Génération du rapport...');
  
  const report = generateReport(results);
  fs.writeFileSync(CONFIG.reportPath, report, 'utf8');
  
  console.log(`Rapport généré: ${CONFIG.reportPath}\n`);
  console.log('=== Analyse terminée avec succès ===');
}

// Exécuter la fonction principale
try {
  main();
} catch (error) {
  console.error(`Erreur lors de l'exécution du script: ${error.message}`);
}
