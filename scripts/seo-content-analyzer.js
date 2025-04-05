/**
 * Script d'analyse de contenu SEO pour Velo-Altitude
 * 
 * Ce script analyse le contenu du site et fournit des recommandations
 * pour améliorer le référencement naturel.
 */

const fs = require('fs');
const path = require('path');
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();

// Configuration
const DATA_DIR = path.join(__dirname, '../src/data');
const OUTPUT_DIR = path.join(__dirname, '../reports');
const LANGUAGES = ['fr', 'en'];

// Mots-clés importants par section
const KEYWORDS = {
  cols: [
    'col', 'ascension', 'montée', 'cyclisme', 'vélo', 'altitude', 'dénivelé', 
    'pente', 'pourcentage', 'difficulté', 'sommet', 'tour de france'
  ],
  training: [
    'entraînement', 'programme', 'cyclisme', 'performance', 'puissance', 'watts',
    'intensité', 'récupération', 'progression', 'montagne', 'cols'
  ],
  nutrition: [
    'nutrition', 'cyclisme', 'recette', 'énergie', 'hydratation', 'glucides',
    'protéines', 'récupération', 'performance', 'endurance'
  ],
  sevenMajors: [
    'défi', 'challenge', 'cols', 'cyclisme', 'montagne', 'ascension', 'majeurs',
    'mythiques', 'légendaires', 'tour', 'giro', 'vuelta'
  ]
};

// Longueurs recommandées pour le contenu
const RECOMMENDED_LENGTHS = {
  title: { min: 50, max: 60 },
  description: { min: 120, max: 160 },
  content: { min: 300, max: 2000 }
};

// Créer le répertoire de sortie s'il n'existe pas
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Analyse la densité des mots-clés dans un texte
 */
function analyzeKeywordDensity(text, keywords) {
  if (!text) return { density: 0, count: 0, total: 0 };
  
  const tokens = tokenizer.tokenize(text.toLowerCase());
  const total = tokens.length;
  
  if (total === 0) return { density: 0, count: 0, total: 0 };
  
  let count = 0;
  keywords.forEach(keyword => {
    const regex = new RegExp(keyword.toLowerCase(), 'g');
    const matches = text.toLowerCase().match(regex);
    if (matches) count += matches.length;
  });
  
  return {
    density: (count / total) * 100,
    count,
    total
  };
}

/**
 * Analyse la lisibilité d'un texte (score de Flesch)
 */
function analyzeReadability(text) {
  if (!text) return { score: 0, level: 'Non évaluable' };
  
  // Calcul simplifié du score de Flesch
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = tokenizer.tokenize(text);
  const syllables = words.reduce((count, word) => {
    return count + (word.length > 7 ? 3 : word.length > 4 ? 2 : 1);
  }, 0);
  
  if (sentences.length === 0 || words.length === 0) {
    return { score: 0, level: 'Non évaluable' };
  }
  
  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  // Formule de Flesch adaptée
  const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  
  let level;
  if (score >= 90) level = 'Très facile';
  else if (score >= 80) level = 'Facile';
  else if (score >= 70) level = 'Assez facile';
  else if (score >= 60) level = 'Standard';
  else if (score >= 50) level = 'Assez difficile';
  else if (score >= 30) level = 'Difficile';
  else level = 'Très difficile';
  
  return { score, level };
}

/**
 * Analyse le contenu d'un texte et fournit des recommandations
 */
function analyzeContent(text, type, keywords) {
  if (!text) return { recommendations: ['Aucun contenu à analyser'] };
  
  const recommendations = [];
  
  // Vérifier la longueur
  const length = text.length;
  const recommendedLength = RECOMMENDED_LENGTHS[type];
  
  if (length < recommendedLength.min) {
    recommendations.push(`Le texte est trop court (${length} caractères). Recommandation: au moins ${recommendedLength.min} caractères.`);
  } else if (length > recommendedLength.max && type !== 'content') {
    recommendations.push(`Le texte est trop long (${length} caractères). Recommandation: maximum ${recommendedLength.max} caractères.`);
  }
  
  // Analyser la densité des mots-clés
  const keywordAnalysis = analyzeKeywordDensity(text, keywords);
  
  if (keywordAnalysis.density < 1) {
    recommendations.push(`La densité de mots-clés est trop faible (${keywordAnalysis.density.toFixed(2)}%). Essayez d'inclure plus de mots-clés pertinents.`);
  } else if (keywordAnalysis.density > 5) {
    recommendations.push(`La densité de mots-clés est trop élevée (${keywordAnalysis.density.toFixed(2)}%). Risque de sur-optimisation.`);
  }
  
  // Analyser la lisibilité
  if (type === 'content') {
    const readability = analyzeReadability(text);
    
    if (readability.score < 60) {
      recommendations.push(`La lisibilité du texte est ${readability.level} (score: ${readability.score.toFixed(2)}). Essayez de simplifier le texte.`);
    }
  }
  
  return {
    length,
    keywordDensity: keywordAnalysis.density,
    recommendations
  };
}

/**
 * Analyse les cols
 */
function analyzeCols() {
  try {
    const colsDir = path.join(DATA_DIR, 'cols/enriched');
    if (!fs.existsSync(colsDir)) {
      console.log('⚠️ Répertoire des cols non trouvé');
      return [];
    }

    const colFiles = fs.readdirSync(colsDir).filter(file => file.endsWith('.json'));
    console.log(`🔍 Analyse de ${colFiles.length} cols...`);
    
    const results = [];
    
    colFiles.forEach(file => {
      const colData = JSON.parse(fs.readFileSync(path.join(colsDir, file), 'utf8'));
      const colSlug = file.replace('.json', '');
      
      // Analyser le contenu pour chaque langue
      LANGUAGES.forEach(lang => {
        const description = colData.description?.[lang] || colData.description?.fr || colData.description;
        const history = colData.history?.[lang] || colData.history?.fr || colData.history;
        
        // Combiner les textes pour l'analyse du contenu
        const fullContent = `${description} ${history}`;
        
        // Analyser le titre, la description et le contenu complet
        const titleAnalysis = analyzeContent(colData.name, 'title', KEYWORDS.cols);
        const descriptionAnalysis = analyzeContent(description, 'description', KEYWORDS.cols);
        const contentAnalysis = analyzeContent(fullContent, 'content', KEYWORDS.cols);
        
        results.push({
          type: 'col',
          slug: colSlug,
          language: lang,
          name: colData.name,
          analyses: {
            title: titleAnalysis,
            description: descriptionAnalysis,
            content: contentAnalysis
          }
        });
      });
    });
    
    return results;
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse des cols:', error);
    return [];
  }
}

/**
 * Analyse les programmes d'entraînement
 */
function analyzeTrainingPrograms() {
  // Implémentation similaire à analyzeCols
  return [];
}

/**
 * Analyse les recettes
 */
function analyzeRecipes() {
  // Implémentation similaire à analyzeCols
  return [];
}

/**
 * Analyse les défis 7 Majeurs
 */
function analyzeSevenMajors() {
  // Implémentation similaire à analyzeCols
  return [];
}

/**
 * Génère un rapport d'analyse
 */
function generateReport(results) {
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalItems: results.length,
      itemsWithIssues: results.filter(r => 
        r.analyses.title.recommendations.length > 0 ||
        r.analyses.description.recommendations.length > 0 ||
        r.analyses.content.recommendations.length > 0
      ).length
    },
    details: results
  };
  
  // Écrire le rapport JSON
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'seo-content-analysis.json'),
    JSON.stringify(report, null, 2)
  );
  
  // Générer un rapport HTML plus lisible
  const htmlReport = generateHtmlReport(report);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'seo-content-analysis.html'),
    htmlReport
  );
  
  console.log(`✅ Rapport d'analyse généré avec ${report.summary.totalItems} éléments analysés.`);
  console.log(`⚠️ ${report.summary.itemsWithIssues} éléments nécessitent des améliorations.`);
}

/**
 * Génère un rapport HTML
 */
function generateHtmlReport(report) {
  // Template HTML simplifié pour le rapport
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Rapport d'analyse SEO - Velo-Altitude</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #1976d2; }
    .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .item { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
    .item-header { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; }
    .recommendations { background: #fff8e1; padding: 10px; border-left: 4px solid #ffc107; }
    .good { color: #4caf50; }
    .warning { color: #ff9800; }
    .error { color: #f44336; }
  </style>
</head>
<body>
  <h1>Rapport d'analyse SEO - Velo-Altitude</h1>
  <p>Généré le ${new Date(report.generatedAt).toLocaleString()}</p>
  
  <div class="summary">
    <h2>Résumé</h2>
    <p>Total d'éléments analysés: <strong>${report.summary.totalItems}</strong></p>
    <p>Éléments nécessitant des améliorations: <strong class="${report.summary.itemsWithIssues > 0 ? 'warning' : 'good'}">${report.summary.itemsWithIssues}</strong></p>
  </div>
  
  <h2>Détails de l'analyse</h2>
  ${report.details.map(item => `
    <div class="item">
      <div class="item-header">
        <h3>${item.name} (${item.type})</h3>
        <span>Langue: ${item.language}</span>
      </div>
      
      <h4>Titre</h4>
      <p>Longueur: ${item.analyses.title.length} caractères</p>
      <p>Densité de mots-clés: ${item.analyses.title.keywordDensity?.toFixed(2) || 0}%</p>
      ${item.analyses.title.recommendations.length > 0 ? `
        <div class="recommendations">
          <strong>Recommandations:</strong>
          <ul>
            ${item.analyses.title.recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
      ` : '<p class="good">Aucune recommandation</p>'}
      
      <h4>Description</h4>
      <p>Longueur: ${item.analyses.description.length} caractères</p>
      <p>Densité de mots-clés: ${item.analyses.description.keywordDensity?.toFixed(2) || 0}%</p>
      ${item.analyses.description.recommendations.length > 0 ? `
        <div class="recommendations">
          <strong>Recommandations:</strong>
          <ul>
            ${item.analyses.description.recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
      ` : '<p class="good">Aucune recommandation</p>'}
      
      <h4>Contenu</h4>
      <p>Longueur: ${item.analyses.content.length} caractères</p>
      <p>Densité de mots-clés: ${item.analyses.content.keywordDensity?.toFixed(2) || 0}%</p>
      ${item.analyses.content.recommendations.length > 0 ? `
        <div class="recommendations">
          <strong>Recommandations:</strong>
          <ul>
            ${item.analyses.content.recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
      ` : '<p class="good">Aucune recommandation</p>'}
    </div>
  `).join('')}
</body>
</html>`;
}

// Exécuter l'analyse
console.log('🚀 Début de l\'analyse du contenu SEO...');

const results = [
  ...analyzeCols(),
  ...analyzeTrainingPrograms(),
  ...analyzeRecipes(),
  ...analyzeSevenMajors()
];

generateReport(results);

console.log('✅ Analyse terminée!');
