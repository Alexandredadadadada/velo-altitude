/**
 * Script de génération de rapport sur le contenu standardisé
 * Velo-Altitude
 * 
 * Ce script analyse tous les contenus après standardisation et génère
 * un rapport complet incluant les statistiques, les doublons potentiels
 * et les éléments nécessitant une attention particulière.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const chalk = require('chalk') || { green: (text) => text, red: (text) => text, yellow: (text) => text, blue: (text) => text };

// Chemins des répertoires standardisés
const STANDARD_DIRS = {
  cols: path.join(__dirname, '../server/data/cols/enriched'),
  training: path.join(__dirname, '../server/data/training'),
  nutrition: {
    recipes: path.join(__dirname, '../server/data/nutrition/recipes'),
    plans: path.join(__dirname, '../server/data/nutrition/plans')
  },
  skills: path.join(__dirname, '../server/data/skills')
};

// Chemin du rapport
const REPORT_PATH = path.join(__dirname, '../docs/CONTENT_STANDARDIZATION_REPORT.md');

/**
 * Analyse les cols standardisés
 * @returns {Object} Statistiques sur les cols
 */
function analyzeColsContent() {
  console.log(chalk.blue('Analyse des cols standardisés...'));
  
  const stats = {
    total: 0,
    byCountry: {},
    byRegion: {},
    byDifficulty: {},
    completeness: {
      excellent: 0,    // 90-100%
      good: 0,         // 70-89%
      partial: 0,      // 40-69%
      minimal: 0       // 0-39%
    },
    potentialDuplicates: [],
    missingCriticalData: []
  };
  
  if (!fs.existsSync(STANDARD_DIRS.cols)) {
    console.log(chalk.yellow(`! Répertoire des cols standardisés non trouvé: ${STANDARD_DIRS.cols}`));
    return stats;
  }
  
  // Lire tous les fichiers de cols
  const files = fs.readdirSync(STANDARD_DIRS.cols).filter(file => file.endsWith('.json'));
  stats.total = files.length;
  
  const colNames = new Map(); // Pour détecter les doublons
  
  files.forEach(file => {
    try {
      const colData = JSON.parse(fs.readFileSync(path.join(STANDARD_DIRS.cols, file), 'utf8'));
      
      // Compléter les statistiques par pays
      stats.byCountry[colData.country] = (stats.byCountry[colData.country] || 0) + 1;
      
      // Compléter les statistiques par région
      stats.byRegion[colData.region] = (stats.byRegion[colData.region] || 0) + 1;
      
      // Compléter les statistiques par difficulté
      const difficultyLevel = Math.floor(colData.difficulty);
      stats.byDifficulty[difficultyLevel] = (stats.byDifficulty[difficultyLevel] || 0) + 1;
      
      // Évaluer la complétude
      if (colData.completeness >= 90) {
        stats.completeness.excellent++;
      } else if (colData.completeness >= 70) {
        stats.completeness.good++;
      } else if (colData.completeness >= 40) {
        stats.completeness.partial++;
      } else {
        stats.completeness.minimal++;
      }
      
      // Détecter les doublons potentiels
      const normalizedName = colData.name.toLowerCase().trim();
      if (colNames.has(normalizedName)) {
        stats.potentialDuplicates.push({
          name: colData.name,
          files: [colNames.get(normalizedName), file]
        });
      } else {
        colNames.set(normalizedName, file);
      }
      
      // Vérifier les données critiques manquantes
      const criticalFields = ['altitude', 'length', 'gradient', 'coordinates'];
      const missingFields = criticalFields.filter(field => {
        if (field === 'gradient') {
          return !colData.gradient || (!colData.gradient.avg && colData.gradient.avg !== 0);
        } else if (field === 'coordinates') {
          return !colData.coordinates || 
                 !colData.coordinates.start || 
                 !colData.coordinates.summit ||
                 (!colData.coordinates.start.lat && colData.coordinates.start.lat !== 0);
        }
        return !colData[field] && colData[field] !== 0;
      });
      
      if (missingFields.length > 0) {
        stats.missingCriticalData.push({
          name: colData.name,
          file: file,
          missingFields: missingFields
        });
      }
      
    } catch (error) {
      console.log(chalk.red(`✗ Erreur lors de l'analyse de ${file}: ${error.message}`));
    }
  });
  
  console.log(chalk.green(`✓ Analyse de ${stats.total} cols terminée`));
  return stats;
}

/**
 * Analyse les programmes d'entraînement standardisés
 * @returns {Object} Statistiques sur les programmes
 */
function analyzeTrainingContent() {
  console.log(chalk.blue('Analyse des programmes d\'entraînement standardisés...'));
  
  const stats = {
    total: 0,
    byType: {},
    byLevel: {},
    byDuration: {
      short: 0,       // 1-4 semaines
      medium: 0,      // 5-8 semaines
      long: 0         // 9+ semaines
    },
    completeness: {
      excellent: 0,    // 90-100%
      good: 0,         // 70-89%
      partial: 0,      // 40-69%
      minimal: 0       // 0-39%
    },
    potentialDuplicates: [],
    missingCriticalData: []
  };
  
  if (!fs.existsSync(STANDARD_DIRS.training)) {
    console.log(chalk.yellow(`! Répertoire des programmes standardisés non trouvé: ${STANDARD_DIRS.training}`));
    return stats;
  }
  
  // Lire tous les fichiers de programmes
  const files = fs.readdirSync(STANDARD_DIRS.training).filter(file => file.endsWith('.json') && file !== 'index.json');
  stats.total = files.length;
  
  const programNames = new Map(); // Pour détecter les doublons
  
  files.forEach(file => {
    try {
      const programData = JSON.parse(fs.readFileSync(path.join(STANDARD_DIRS.training, file), 'utf8'));
      
      // Compléter les statistiques par type
      stats.byType[programData.type] = (stats.byType[programData.type] || 0) + 1;
      
      // Compléter les statistiques par niveau
      stats.byLevel[programData.level] = (stats.byLevel[programData.level] || 0) + 1;
      
      // Compléter les statistiques par durée
      if (programData.duration <= 4) {
        stats.byDuration.short++;
      } else if (programData.duration <= 8) {
        stats.byDuration.medium++;
      } else {
        stats.byDuration.long++;
      }
      
      // Évaluer la complétude
      if (programData.completeness >= 90) {
        stats.completeness.excellent++;
      } else if (programData.completeness >= 70) {
        stats.completeness.good++;
      } else if (programData.completeness >= 40) {
        stats.completeness.partial++;
      } else {
        stats.completeness.minimal++;
      }
      
      // Détecter les doublons potentiels
      const normalizedName = programData.name.toLowerCase().trim();
      if (programNames.has(normalizedName)) {
        stats.potentialDuplicates.push({
          name: programData.name,
          files: [programNames.get(normalizedName), file]
        });
      } else {
        programNames.set(normalizedName, file);
      }
      
      // Vérifier les données critiques manquantes
      const criticalFields = ['type', 'level', 'duration', 'weeks'];
      const missingFields = criticalFields.filter(field => {
        if (field === 'weeks') {
          return !programData.weeks || programData.weeks.length === 0;
        }
        return !programData[field] && programData[field] !== 0;
      });
      
      if (missingFields.length > 0) {
        stats.missingCriticalData.push({
          name: programData.name,
          file: file,
          missingFields: missingFields
        });
      }
      
    } catch (error) {
      console.log(chalk.red(`✗ Erreur lors de l'analyse de ${file}: ${error.message}`));
    }
  });
  
  console.log(chalk.green(`✓ Analyse de ${stats.total} programmes terminée`));
  return stats;
}

/**
 * Analyse les recettes standardisées
 * @returns {Object} Statistiques sur les recettes
 */
function analyzeRecipesContent() {
  console.log(chalk.blue('Analyse des recettes standardisées...'));
  
  const stats = {
    total: 0,
    byCategory: {},
    byDuration: {
      quick: 0,       // <30 minutes
      medium: 0,      // 30-60 minutes
      long: 0         // >60 minutes
    },
    completeness: {
      excellent: 0,    // 90-100%
      good: 0,         // 70-89%
      partial: 0,      // 40-69%
      minimal: 0       // 0-39%
    },
    potentialDuplicates: [],
    missingCriticalData: []
  };
  
  if (!fs.existsSync(STANDARD_DIRS.nutrition.recipes)) {
    console.log(chalk.yellow(`! Répertoire des recettes standardisées non trouvé: ${STANDARD_DIRS.nutrition.recipes}`));
    return stats;
  }
  
  // Lire tous les fichiers de recettes
  const files = fs.readdirSync(STANDARD_DIRS.nutrition.recipes).filter(file => file.endsWith('.json') && file !== 'index.json');
  stats.total = files.length;
  
  const recipeNames = new Map(); // Pour détecter les doublons
  
  files.forEach(file => {
    try {
      const recipeData = JSON.parse(fs.readFileSync(path.join(STANDARD_DIRS.nutrition.recipes, file), 'utf8'));
      
      // Compléter les statistiques par catégorie
      stats.byCategory[recipeData.category] = (stats.byCategory[recipeData.category] || 0) + 1;
      
      // Compléter les statistiques par durée
      const totalDuration = recipeData.duration.total || 
                            (recipeData.duration.prep + recipeData.duration.cook);
      
      if (totalDuration < 30) {
        stats.byDuration.quick++;
      } else if (totalDuration <= 60) {
        stats.byDuration.medium++;
      } else {
        stats.byDuration.long++;
      }
      
      // Évaluer la complétude
      if (recipeData.completeness >= 90) {
        stats.completeness.excellent++;
      } else if (recipeData.completeness >= 70) {
        stats.completeness.good++;
      } else if (recipeData.completeness >= 40) {
        stats.completeness.partial++;
      } else {
        stats.completeness.minimal++;
      }
      
      // Détecter les doublons potentiels
      const normalizedName = recipeData.name.toLowerCase().trim();
      if (recipeNames.has(normalizedName)) {
        stats.potentialDuplicates.push({
          name: recipeData.name,
          files: [recipeNames.get(normalizedName), file]
        });
      } else {
        recipeNames.set(normalizedName, file);
      }
      
      // Vérifier les données critiques manquantes
      const criticalFields = ['category', 'ingredients', 'instructions', 'nutrition_facts'];
      const missingFields = criticalFields.filter(field => {
        if (field === 'ingredients' || field === 'instructions') {
          return !recipeData[field] || recipeData[field].length === 0;
        } else if (field === 'nutrition_facts') {
          return !recipeData.nutrition_facts || 
                 (!recipeData.nutrition_facts.calories && 
                  recipeData.nutrition_facts.calories !== 0);
        }
        return !recipeData[field];
      });
      
      if (missingFields.length > 0) {
        stats.missingCriticalData.push({
          name: recipeData.name,
          file: file,
          missingFields: missingFields
        });
      }
      
    } catch (error) {
      console.log(chalk.red(`✗ Erreur lors de l'analyse de ${file}: ${error.message}`));
    }
  });
  
  console.log(chalk.green(`✓ Analyse de ${stats.total} recettes terminée`));
  return stats;
}

/**
 * Analyse les plans nutritionnels standardisés
 * @returns {Object} Statistiques sur les plans
 */
function analyzePlansContent() {
  console.log(chalk.blue('Analyse des plans nutritionnels standardisés...'));
  
  const stats = {
    total: 0,
    byCategory: {},
    completeness: {
      excellent: 0,    // 90-100%
      good: 0,         // 70-89%
      partial: 0,      // 40-69%
      minimal: 0       // 0-39%
    },
    potentialDuplicates: [],
    missingCriticalData: []
  };
  
  if (!fs.existsSync(STANDARD_DIRS.nutrition.plans)) {
    console.log(chalk.yellow(`! Répertoire des plans nutritionnels standardisés non trouvé: ${STANDARD_DIRS.nutrition.plans}`));
    return stats;
  }
  
  // Lire tous les fichiers de plans
  const files = fs.readdirSync(STANDARD_DIRS.nutrition.plans).filter(file => file.endsWith('.json') && file !== 'index.json');
  stats.total = files.length;
  
  const planNames = new Map(); // Pour détecter les doublons
  
  files.forEach(file => {
    try {
      const planData = JSON.parse(fs.readFileSync(path.join(STANDARD_DIRS.nutrition.plans, file), 'utf8'));
      
      // Compléter les statistiques par catégorie
      stats.byCategory[planData.category] = (stats.byCategory[planData.category] || 0) + 1;
      
      // Évaluer la complétude
      if (planData.completeness >= 90) {
        stats.completeness.excellent++;
      } else if (planData.completeness >= 70) {
        stats.completeness.good++;
      } else if (planData.completeness >= 40) {
        stats.completeness.partial++;
      } else {
        stats.completeness.minimal++;
      }
      
      // Détecter les doublons potentiels
      const normalizedName = planData.name.toLowerCase().trim();
      if (planNames.has(normalizedName)) {
        stats.potentialDuplicates.push({
          name: planData.name,
          files: [planNames.get(normalizedName), file]
        });
      } else {
        planNames.set(normalizedName, file);
      }
      
      // Vérifier les données critiques manquantes
      const criticalFields = ['category', 'days'];
      const missingFields = criticalFields.filter(field => {
        if (field === 'days') {
          return !planData.days || planData.days.length === 0;
        }
        return !planData[field];
      });
      
      if (missingFields.length > 0) {
        stats.missingCriticalData.push({
          name: planData.name,
          file: file,
          missingFields: missingFields
        });
      }
      
    } catch (error) {
      console.log(chalk.red(`✗ Erreur lors de l'analyse de ${file}: ${error.message}`));
    }
  });
  
  console.log(chalk.green(`✓ Analyse de ${stats.total} plans nutritionnels terminée`));
  return stats;
}

/**
 * Génère le rapport complet
 * @param {Object} stats Statistiques collectées
 */
function generateReport(stats) {
  console.log(chalk.blue('Génération du rapport...'));
  
  let report = `# Rapport de standardisation du contenu Velo-Altitude

*Date de génération: ${new Date().toLocaleDateString('fr-FR')}*

Ce rapport présente l'état du contenu après standardisation. Il fournit des statistiques
sur les différents types de contenu, identifie les doublons potentiels et signale
les éléments nécessitant une attention particulière.

## Vue d'ensemble

| Type de contenu | Nombre total | Excellent | Bon | Partiel | Minimal |
|-----------------|--------------|-----------|-----|---------|---------|
| Cols | ${stats.cols.total} | ${stats.cols.completeness.excellent} | ${stats.cols.completeness.good} | ${stats.cols.completeness.partial} | ${stats.cols.completeness.minimal} |
| Programmes d'entraînement | ${stats.training.total} | ${stats.training.completeness.excellent} | ${stats.training.completeness.good} | ${stats.training.completeness.partial} | ${stats.training.completeness.minimal} |
| Recettes | ${stats.recipes.total} | ${stats.recipes.completeness.excellent} | ${stats.recipes.completeness.good} | ${stats.recipes.completeness.partial} | ${stats.recipes.completeness.minimal} |
| Plans nutritionnels | ${stats.plans.total} | ${stats.plans.completeness.excellent} | ${stats.plans.completeness.good} | ${stats.plans.completeness.partial} | ${stats.plans.completeness.minimal} |

## Cols (${stats.cols.total})

### Répartition par pays

`;

  // Ajouter les statistiques par pays
  Object.entries(stats.cols.byCountry).sort((a, b) => b[1] - a[1]).forEach(([country, count]) => {
    report += `- ${country || 'Non spécifié'}: ${count}\n`;
  });

  report += `\n### Répartition par région

`;

  // Ajouter les statistiques par région
  Object.entries(stats.cols.byRegion).sort((a, b) => b[1] - a[1]).forEach(([region, count]) => {
    report += `- ${region || 'Non spécifiée'}: ${count}\n`;
  });

  report += `\n### Répartition par niveau de difficulté

`;

  // Ajouter les statistiques par difficulté
  for (let i = 0; i <= 10; i++) {
    const count = stats.cols.byDifficulty[i] || 0;
    if (count > 0) {
      report += `- Niveau ${i}: ${count}\n`;
    }
  }

  report += `\n### Doublons potentiels

`;

  // Ajouter les doublons potentiels
  if (stats.cols.potentialDuplicates.length === 0) {
    report += `✓ Aucun doublon détecté\n`;
  } else {
    stats.cols.potentialDuplicates.forEach(dup => {
      report += `- **${dup.name}** trouvé dans: ${dup.files.join(', ')}\n`;
    });
  }

  report += `\n### Données critiques manquantes

`;

  // Ajouter les éléments avec données manquantes
  if (stats.cols.missingCriticalData.length === 0) {
    report += `✓ Tous les cols contiennent les données critiques\n`;
  } else {
    stats.cols.missingCriticalData.forEach(item => {
      report += `- **${item.name}** (${item.file}): ${item.missingFields.join(', ')}\n`;
    });
  }

  report += `\n## Programmes d'entraînement (${stats.training.total})

### Répartition par type

`;

  // Ajouter les statistiques par type de programme
  Object.entries(stats.training.byType).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    report += `- ${type || 'Non spécifié'}: ${count}\n`;
  });

  report += `\n### Répartition par niveau

`;

  // Ajouter les statistiques par niveau
  Object.entries(stats.training.byLevel).sort((a, b) => b[1] - a[1]).forEach(([level, count]) => {
    report += `- ${level || 'Non spécifié'}: ${count}\n`;
  });

  report += `\n### Répartition par durée

- Court (1-4 semaines): ${stats.training.byDuration.short}
- Moyen (5-8 semaines): ${stats.training.byDuration.medium}
- Long (9+ semaines): ${stats.training.byDuration.long}

### Doublons potentiels

`;

  // Ajouter les doublons potentiels
  if (stats.training.potentialDuplicates.length === 0) {
    report += `✓ Aucun doublon détecté\n`;
  } else {
    stats.training.potentialDuplicates.forEach(dup => {
      report += `- **${dup.name}** trouvé dans: ${dup.files.join(', ')}\n`;
    });
  }

  report += `\n### Données critiques manquantes

`;

  // Ajouter les éléments avec données manquantes
  if (stats.training.missingCriticalData.length === 0) {
    report += `✓ Tous les programmes contiennent les données critiques\n`;
  } else {
    stats.training.missingCriticalData.forEach(item => {
      report += `- **${item.name}** (${item.file}): ${item.missingFields.join(', ')}\n`;
    });
  }

  report += `\n## Recettes (${stats.recipes.total})

### Répartition par catégorie

`;

  // Ajouter les statistiques par catégorie de recette
  Object.entries(stats.recipes.byCategory).sort((a, b) => b[1] - a[1]).forEach(([category, count]) => {
    report += `- ${category || 'Non spécifiée'}: ${count}\n`;
  });

  report += `\n### Répartition par durée de préparation

- Rapide (<30 minutes): ${stats.recipes.byDuration.quick}
- Moyenne (30-60 minutes): ${stats.recipes.byDuration.medium}
- Longue (>60 minutes): ${stats.recipes.byDuration.long}

### Doublons potentiels

`;

  // Ajouter les doublons potentiels
  if (stats.recipes.potentialDuplicates.length === 0) {
    report += `✓ Aucun doublon détecté\n`;
  } else {
    stats.recipes.potentialDuplicates.forEach(dup => {
      report += `- **${dup.name}** trouvé dans: ${dup.files.join(', ')}\n`;
    });
  }

  report += `\n### Données critiques manquantes

`;

  // Ajouter les éléments avec données manquantes
  if (stats.recipes.missingCriticalData.length === 0) {
    report += `✓ Toutes les recettes contiennent les données critiques\n`;
  } else {
    stats.recipes.missingCriticalData.forEach(item => {
      report += `- **${item.name}** (${item.file}): ${item.missingFields.join(', ')}\n`;
    });
  }

  report += `\n## Plans nutritionnels (${stats.plans.total})

### Répartition par catégorie

`;

  // Ajouter les statistiques par catégorie de plan
  Object.entries(stats.plans.byCategory).sort((a, b) => b[1] - a[1]).forEach(([category, count]) => {
    report += `- ${category || 'Non spécifiée'}: ${count}\n`;
  });

  report += `\n### Doublons potentiels

`;

  // Ajouter les doublons potentiels
  if (stats.plans.potentialDuplicates.length === 0) {
    report += `✓ Aucun doublon détecté\n`;
  } else {
    stats.plans.potentialDuplicates.forEach(dup => {
      report += `- **${dup.name}** trouvé dans: ${dup.files.join(', ')}\n`;
    });
  }

  report += `\n### Données critiques manquantes

`;

  // Ajouter les éléments avec données manquantes
  if (stats.plans.missingCriticalData.length === 0) {
    report += `✓ Tous les plans contiennent les données critiques\n`;
  } else {
    stats.plans.missingCriticalData.forEach(item => {
      report += `- **${item.name}** (${item.file}): ${item.missingFields.join(', ')}\n`;
    });
  }

  report += `\n## Recommandations

Sur la base de cette analyse, voici les recommandations pour améliorer la qualité du contenu :

1. **Résoudre les doublons identifiés** en fusionnant ou supprimant les fichiers redondants
2. **Compléter les données critiques manquantes** pour améliorer la qualité et l'utilité du contenu
3. **Enrichir les contenus à complétude partielle ou minimale** pour atteindre au moins 70% de complétude
4. **Standardiser davantage la nomenclature des catégories** pour éviter les variantes orthographiques
5. **Vérifier la cohérence des relations entre contenus** (cols, programmes, plans nutritionnels)

## Prochaines étapes

1. Mettre à jour les routes et composants React pour utiliser la nouvelle structure d'URL
2. Vérifier les fonctionnalités de recherche et de filtrage avec la nouvelle organisation des données
3. Améliorer l'expérience utilisateur en tirant parti des données standardisées
4. Mettre en place un système de validation pour les nouvelles entrées de contenu`;

  // Écrire le rapport
  fs.writeFileSync(REPORT_PATH, report, 'utf8');
  console.log(chalk.green(`✓ Rapport généré: ${REPORT_PATH}`));
}

/**
 * Fonction principale
 */
async function main() {
  console.log(chalk.blue('=== Génération du rapport de standardisation ===\n'));
  
  // Collecter les statistiques
  const stats = {
    cols: analyzeColsContent(),
    training: analyzeTrainingContent(),
    recipes: analyzeRecipesContent(),
    plans: analyzePlansContent()
  };
  
  // Générer le rapport
  generateReport(stats);
  
  console.log(chalk.green('\n✓ Rapport de standardisation terminé'));
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red('Erreur lors de l\'exécution du script:', error));
});
