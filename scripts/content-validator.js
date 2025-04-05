/**
 * Script de validation et d'analyse de cohérence du contenu
 * Velo-Altitude
 * 
 * Ce script vérifie la qualité et la cohérence de tous les contenus
 * et génère un rapport détaillé des problèmes à résoudre.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const chalk = require('chalk') || { green: (text) => text, red: (text) => text, yellow: (text) => text, blue: (text) => text, cyan: (text) => text };

// Chemins des répertoires
const DATA_DIRS = {
  cols: path.join(__dirname, '../server/data/cols/enriched'),
  training: path.join(__dirname, '../server/data/training'),
  nutrition: {
    recipes: path.join(__dirname, '../server/data/nutrition/recipes'),
    plans: path.join(__dirname, '../server/data/nutrition/plans')
  }
};

// Chemin du rapport
const REPORT_PATH = path.join(__dirname, '../docs/CONTENT_QUALITY_REPORT.md');

// Définition des structures attendues
const EXPECTED_STRUCTURES = {
  cols: [
    'id', 'name', 'slug', 'country', 'region', 'altitude', 'length', 'gradient',
    'difficulty', 'description', 'coordinates', 'elevation_profile', 'images',
    'videos', 'three_d_model', 'weather', 'services', 'testimonials', 
    'related_cols', 'status', 'completeness', 'last_updated'
  ],
  training: [
    'id', 'name', 'slug', 'type', 'level', 'duration', 'description', 'weeks',
    'variations', 'target_cols', 'related_nutrition', 'videos', 'status',
    'completeness', 'last_updated'
  ],
  recipes: [
    'id', 'name', 'slug', 'category', 'duration', 'description', 'ingredients',
    'instructions', 'nutrition_facts', 'benefits', 'image', 'videos',
    'related_cols', 'related_training', 'status', 'completeness', 'last_updated'
  ],
  plans: [
    'id', 'name', 'slug', 'category', 'description', 'days', 'recipes',
    'supplements', 'hydration', 'variations', 'related_cols',
    'related_training', 'status', 'completeness', 'last_updated'
  ]
};

// Champs critiques qui doivent être remplis
const CRITICAL_FIELDS = {
  cols: ['name', 'slug', 'country', 'altitude', 'coordinates', 'description.fr'],
  training: ['name', 'slug', 'level', 'weeks', 'description.fr'],
  recipes: ['name', 'slug', 'category', 'ingredients', 'instructions', 'description.fr'],
  plans: ['name', 'slug', 'category', 'days', 'description.fr']
};

/**
 * Vérifie la présence d'un champ, même profondément imbriqué
 * @param {Object} obj Objet à vérifier
 * @param {string} path Chemin du champ (ex: "description.fr")
 * @returns {boolean} True si le champ existe et est non vide
 */
function hasField(obj, path) {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (!current || typeof current !== 'object') {
      return false;
    }
    current = current[part];
  }
  
  if (Array.isArray(current)) {
    return current.length > 0;
  }
  
  return current !== undefined && current !== null && current !== '';
}

/**
 * Valide la structure d'un objet par rapport à la structure attendue
 * @param {Object} obj Objet à valider
 * @param {Array} expectedFields Liste des champs attendus
 * @returns {Object} Résultat de la validation
 */
function validateStructure(obj, expectedFields) {
  const missing = [];
  const present = [];
  
  expectedFields.forEach(field => {
    if (!hasField(obj, field)) {
      missing.push(field);
    } else {
      present.push(field);
    }
  });
  
  const completeness = Math.round((present.length / expectedFields.length) * 100);
  
  return {
    missing,
    present,
    completeness
  };
}

/**
 * Vérifie les champs critiques manquants
 * @param {Object} obj Objet à vérifier
 * @param {Array} criticalFields Liste des champs critiques
 * @returns {Array} Liste des champs critiques manquants
 */
function checkCriticalFields(obj, criticalFields) {
  return criticalFields.filter(field => !hasField(obj, field));
}

/**
 * Lit et analyse tous les fichiers d'un répertoire
 * @param {string} dir Chemin du répertoire
 * @param {Array} expectedFields Structure attendue
 * @param {Array} criticalFields Champs critiques
 * @returns {Object} Résultats de l'analyse
 */
function analyzeDirectory(dir, expectedFields, criticalFields) {
  console.log(chalk.blue(`Analyse du répertoire ${dir}...`));
  
  const results = {
    total: 0,
    validStructure: 0,
    invalidStructure: [],
    missingCritical: [],
    completeness: {
      excellent: 0, // 90-100%
      good: 0,      // 70-89%
      partial: 0,   // 40-69%
      minimal: 0    // 0-39%
    },
    similarNames: [],
    incoherentSlugs: []
  };
  
  if (!fs.existsSync(dir)) {
    console.log(chalk.yellow(`! Répertoire non trouvé: ${dir}`));
    return results;
  }
  
  // Lire tous les fichiers JSON
  const files = fs.readdirSync(dir).filter(file => file.endsWith('.json') && file !== 'index.json');
  results.total = files.length;
  
  // Map pour détecter les noms similaires
  const normalizedNames = new Map();
  
  files.forEach(file => {
    try {
      const filePath = path.join(dir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      // Valider la structure
      const validation = validateStructure(data, expectedFields);
      
      // Vérifier si tous les champs attendus sont présents
      if (validation.missing.length === 0) {
        results.validStructure++;
      } else {
        results.invalidStructure.push({
          file,
          name: data.name || 'Sans nom',
          missingFields: validation.missing
        });
      }
      
      // Vérifier les champs critiques
      const missingCritical = checkCriticalFields(data, criticalFields);
      if (missingCritical.length > 0) {
        results.missingCritical.push({
          file,
          name: data.name || 'Sans nom',
          missingCritical
        });
      }
      
      // Évaluer la complétude
      if (validation.completeness >= 90) {
        results.completeness.excellent++;
      } else if (validation.completeness >= 70) {
        results.completeness.good++;
      } else if (validation.completeness >= 40) {
        results.completeness.partial++;
      } else {
        results.completeness.minimal++;
      }
      
      // Vérifier l'incohérence entre nom et slug
      if (data.name && data.slug) {
        const expectedSlug = data.name.toLowerCase()
          .replace(/[àáâãäå]/g, 'a')
          .replace(/[èéêë]/g, 'e')
          .replace(/[ìíîï]/g, 'i')
          .replace(/[òóôõö]/g, 'o')
          .replace(/[ùúûü]/g, 'u')
          .replace(/[ç]/g, 'c')
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        
        if (data.slug !== expectedSlug && !expectedSlug.includes(data.slug) && !data.slug.includes(expectedSlug)) {
          results.incoherentSlugs.push({
            file,
            name: data.name,
            currentSlug: data.slug,
            expectedSlug
          });
        }
      }
      
      // Détecter les noms similaires
      if (data.name) {
        const normalizedName = data.name.toLowerCase()
          .replace(/[àáâãäå]/g, 'a')
          .replace(/[èéêë]/g, 'e')
          .replace(/[ìíîï]/g, 'i')
          .replace(/[òóôõö]/g, 'o')
          .replace(/[ùúûü]/g, 'u')
          .replace(/[ç]/g, 'c')
          .trim();
        
        if (normalizedNames.has(normalizedName)) {
          const existing = normalizedNames.get(normalizedName);
          
          // Vérifier si déjà identifié comme similaire
          const alreadyExists = results.similarNames.some(
            sim => sim.files.includes(file) && sim.files.includes(existing.file)
          );
          
          if (!alreadyExists) {
            results.similarNames.push({
              originalName: existing.name,
              similarName: data.name,
              files: [existing.file, file]
            });
          }
        } else {
          normalizedNames.set(normalizedName, {
            name: data.name,
            file
          });
        }
      }
      
    } catch (error) {
      console.log(chalk.red(`✗ Erreur lors de l'analyse de ${file}: ${error.message}`));
    }
  });
  
  console.log(chalk.green(`✓ Analyse de ${results.total} fichiers terminée`));
  return results;
}

/**
 * Vérifie les références croisées entre les contenus
 * @param {Object} colsData Données des cols
 * @param {Object} trainingData Données des programmes d'entraînement
 * @param {Object} nutritionData Données des plans nutritionnels
 * @returns {Object} Résultats de l'analyse des références
 */
function analyzeReferences(colsData, trainingData, nutritionData) {
  console.log(chalk.blue('Analyse des références croisées...'));
  
  const results = {
    invalidColReferences: [],
    invalidTrainingReferences: [],
    invalidNutritionReferences: []
  };
  
  const colSlugs = new Set();
  const trainingSlugs = new Set();
  const recipeSlugs = new Set();
  const planSlugs = new Set();
  
  // Collecter tous les slugs existants
  if (fs.existsSync(DATA_DIRS.cols)) {
    fs.readdirSync(DATA_DIRS.cols)
      .filter(file => file.endsWith('.json') && file !== 'index.json')
      .forEach(file => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(DATA_DIRS.cols, file), 'utf8'));
          if (data.slug) {
            colSlugs.add(data.slug);
          }
        } catch (error) {
          // Ignorer les erreurs
        }
      });
  }
  
  if (fs.existsSync(DATA_DIRS.training)) {
    fs.readdirSync(DATA_DIRS.training)
      .filter(file => file.endsWith('.json') && file !== 'index.json')
      .forEach(file => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(DATA_DIRS.training, file), 'utf8'));
          if (data.slug) {
            trainingSlugs.add(data.slug);
          }
        } catch (error) {
          // Ignorer les erreurs
        }
      });
  }
  
  if (fs.existsSync(DATA_DIRS.nutrition.recipes)) {
    fs.readdirSync(DATA_DIRS.nutrition.recipes)
      .filter(file => file.endsWith('.json') && file !== 'index.json')
      .forEach(file => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(DATA_DIRS.nutrition.recipes, file), 'utf8'));
          if (data.slug) {
            recipeSlugs.add(data.slug);
          }
        } catch (error) {
          // Ignorer les erreurs
        }
      });
  }
  
  if (fs.existsSync(DATA_DIRS.nutrition.plans)) {
    fs.readdirSync(DATA_DIRS.nutrition.plans)
      .filter(file => file.endsWith('.json') && file !== 'index.json')
      .forEach(file => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(DATA_DIRS.nutrition.plans, file), 'utf8'));
          if (data.slug) {
            planSlugs.add(data.slug);
          }
        } catch (error) {
          // Ignorer les erreurs
        }
      });
  }
  
  // Vérifier les références aux cols
  if (fs.existsSync(DATA_DIRS.training)) {
    fs.readdirSync(DATA_DIRS.training)
      .filter(file => file.endsWith('.json') && file !== 'index.json')
      .forEach(file => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(DATA_DIRS.training, file), 'utf8'));
          
          if (data.target_cols && Array.isArray(data.target_cols)) {
            const invalidRefs = data.target_cols.filter(slug => !colSlugs.has(slug));
            
            if (invalidRefs.length > 0) {
              results.invalidColReferences.push({
                from: `training/${file}`,
                name: data.name || 'Sans nom',
                invalidRefs
              });
            }
          }
        } catch (error) {
          // Ignorer les erreurs
        }
      });
  }
  
  // Vérifier les références aux programmes d'entraînement
  if (fs.existsSync(DATA_DIRS.nutrition.plans)) {
    fs.readdirSync(DATA_DIRS.nutrition.plans)
      .filter(file => file.endsWith('.json') && file !== 'index.json')
      .forEach(file => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(DATA_DIRS.nutrition.plans, file), 'utf8'));
          
          if (data.related_training && Array.isArray(data.related_training)) {
            const invalidRefs = data.related_training.filter(slug => !trainingSlugs.has(slug));
            
            if (invalidRefs.length > 0) {
              results.invalidTrainingReferences.push({
                from: `nutrition/plans/${file}`,
                name: data.name || 'Sans nom',
                invalidRefs
              });
            }
          }
        } catch (error) {
          // Ignorer les erreurs
        }
      });
  }
  
  // Vérifier les références aux recettes
  if (fs.existsSync(DATA_DIRS.nutrition.plans)) {
    fs.readdirSync(DATA_DIRS.nutrition.plans)
      .filter(file => file.endsWith('.json') && file !== 'index.json')
      .forEach(file => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(DATA_DIRS.nutrition.plans, file), 'utf8'));
          
          if (data.recipes && Array.isArray(data.recipes)) {
            const invalidRefs = data.recipes.filter(slug => !recipeSlugs.has(slug));
            
            if (invalidRefs.length > 0) {
              results.invalidNutritionReferences.push({
                from: `nutrition/plans/${file}`,
                name: data.name || 'Sans nom',
                invalidRefs
              });
            }
          }
        } catch (error) {
          // Ignorer les erreurs
        }
      });
  }
  
  console.log(chalk.green(`✓ Analyse des références croisées terminée`));
  return results;
}

/**
 * Génère un rapport détaillé basé sur les résultats des analyses
 * @param {Object} results Résultats des analyses
 */
function generateReport(results) {
  console.log(chalk.blue('Génération du rapport de qualité du contenu...'));
  
  let report = `# Rapport de qualité du contenu Velo-Altitude

*Date de génération: ${new Date().toLocaleDateString('fr-FR')}*

Ce rapport détaille la qualité et la cohérence du contenu, identifie les problèmes
et fournit des recommandations pour améliorer la standardisation.

## Synthèse

| Type | Nombre | Structure valide | Complétude >90% | Complétude <40% | Doublons potentiels |
|------|--------|------------------|-----------------|-----------------|---------------------|
| Cols | ${results.cols.total} | ${results.cols.validStructure} | ${results.cols.completeness.excellent} | ${results.cols.completeness.minimal} | ${results.cols.similarNames.length} |
| Programmes d'entraînement | ${results.training.total} | ${results.training.validStructure} | ${results.training.completeness.excellent} | ${results.training.completeness.minimal} | ${results.training.similarNames.length} |
| Recettes | ${results.recipes.total} | ${results.recipes.validStructure} | ${results.recipes.completeness.excellent} | ${results.recipes.completeness.minimal} | ${results.recipes.similarNames.length} |
| Plans nutritionnels | ${results.plans.total} | ${results.plans.validStructure} | ${results.plans.completeness.excellent} | ${results.plans.completeness.minimal} | ${results.plans.similarNames.length} |

## Problèmes identifiés

### 1. Doublons potentiels

`;

  // Doublons dans les cols
  if (results.cols.similarNames.length === 0) {
    report += `#### Cols
✓ Aucun doublon détecté

`;
  } else {
    report += `#### Cols

`;
    results.cols.similarNames.forEach(item => {
      report += `- **${item.originalName}** et **${item.similarName}** dans les fichiers: ${item.files.join(', ')}\n`;
    });
    report += '\n';
  }

  // Doublons dans les programmes d'entraînement
  if (results.training.similarNames.length === 0) {
    report += `#### Programmes d'entraînement
✓ Aucun doublon détecté

`;
  } else {
    report += `#### Programmes d'entraînement

`;
    results.training.similarNames.forEach(item => {
      report += `- **${item.originalName}** et **${item.similarName}** dans les fichiers: ${item.files.join(', ')}\n`;
    });
    report += '\n';
  }

  // Champs critiques manquants
  report += `### 2. Données critiques manquantes

`;

  // Cols
  if (results.cols.missingCritical.length === 0) {
    report += `#### Cols
✓ Tous les cols contiennent les données critiques requises

`;
  } else {
    report += `#### Cols

`;
    results.cols.missingCritical.forEach(item => {
      report += `- **${item.name}** (${item.file}): Champs manquants: ${item.missingCritical.join(', ')}\n`;
    });
    report += '\n';
  }

  // Programmes d'entraînement
  if (results.training.missingCritical.length === 0) {
    report += `#### Programmes d'entraînement
✓ Tous les programmes contiennent les données critiques requises

`;
  } else {
    report += `#### Programmes d'entraînement

`;
    results.training.missingCritical.forEach(item => {
      report += `- **${item.name}** (${item.file}): Champs manquants: ${item.missingCritical.join(', ')}\n`;
    });
    report += '\n';
  }

  // Incohérences dans les slugs
  report += `### 3. Incohérences entre nom et slug

`;

  // Cols
  if (results.cols.incoherentSlugs.length === 0) {
    report += `#### Cols
✓ Tous les slugs sont cohérents avec les noms

`;
  } else {
    report += `#### Cols

`;
    results.cols.incoherentSlugs.forEach(item => {
      report += `- **${item.name}**: Slug actuel: \`${item.currentSlug}\`, Slug attendu: \`${item.expectedSlug}\`\n`;
    });
    report += '\n';
  }

  // Programmes d'entraînement
  if (results.training.incoherentSlugs.length === 0) {
    report += `#### Programmes d'entraînement
✓ Tous les slugs sont cohérents avec les noms

`;
  } else {
    report += `#### Programmes d'entraînement

`;
    results.training.incoherentSlugs.forEach(item => {
      report += `- **${item.name}**: Slug actuel: \`${item.currentSlug}\`, Slug attendu: \`${item.expectedSlug}\`\n`;
    });
    report += '\n';
  }

  // Références invalides
  report += `### 4. Références invalides entre contenus

`;

  // Références aux cols
  if (results.references.invalidColReferences.length === 0) {
    report += `#### Références aux cols
✓ Toutes les références aux cols sont valides

`;
  } else {
    report += `#### Références aux cols

`;
    results.references.invalidColReferences.forEach(item => {
      report += `- Dans **${item.name}** (${item.from}): ${item.invalidRefs.join(', ')}\n`;
    });
    report += '\n';
  }

  // Références aux programmes d'entraînement
  if (results.references.invalidTrainingReferences.length === 0) {
    report += `#### Références aux programmes d'entraînement
✓ Toutes les références aux programmes sont valides

`;
  } else {
    report += `#### Références aux programmes d'entraînement

`;
    results.references.invalidTrainingReferences.forEach(item => {
      report += `- Dans **${item.name}** (${item.from}): ${item.invalidRefs.join(', ')}\n`;
    });
    report += '\n';
  }

  // Structures invalides
  report += `### 5. Structures incomplètes

`;

  // Cols
  if (results.cols.invalidStructure.length === 0) {
    report += `#### Cols
✓ Tous les cols ont une structure complète

`;
  } else {
    report += `#### Cols

`;
    // Limiter à 10 exemples maximum pour ne pas surcharger le rapport
    const examples = results.cols.invalidStructure.slice(0, 10);
    examples.forEach(item => {
      report += `- **${item.name}** (${item.file}): Champs manquants: ${item.missingFields.join(', ')}\n`;
    });
    
    if (results.cols.invalidStructure.length > 10) {
      report += `- ... et ${results.cols.invalidStructure.length - 10} autres cols avec structure incomplète\n`;
    }
    report += '\n';
  }

  // Programmes d'entraînement
  if (results.training.invalidStructure.length === 0) {
    report += `#### Programmes d'entraînement
✓ Tous les programmes ont une structure complète

`;
  } else {
    report += `#### Programmes d'entraînement

`;
    results.training.invalidStructure.forEach(item => {
      report += `- **${item.name}** (${item.file}): Champs manquants: ${item.missingFields.join(', ')}\n`;
    });
    report += '\n';
  }

  // Recommandations
  report += `## Recommandations

Sur la base des problèmes identifiés, voici les recommandations pour améliorer la qualité du contenu :

1. **Résoudre les doublons identifiés** en fusionnant les fichiers correspondants
   - Priorité: ${results.cols.similarNames.length > 0 ? 'Haute' : 'Basse'}
   
2. **Compléter les données critiques manquantes** pour les ${results.cols.missingCritical.length + results.training.missingCritical.length} éléments concernés
   - Priorité: ${(results.cols.missingCritical.length + results.training.missingCritical.length) > 0 ? 'Haute' : 'Basse'}
   
3. **Standardiser les slugs** pour les ${results.cols.incoherentSlugs.length + results.training.incoherentSlugs.length} éléments dont le slug ne correspond pas au nom
   - Priorité: ${(results.cols.incoherentSlugs.length + results.training.incoherentSlugs.length) > 0 ? 'Moyenne' : 'Basse'}
   
4. **Corriger les références invalides** entre les différents types de contenu
   - Priorité: ${(results.references.invalidColReferences.length + results.references.invalidTrainingReferences.length) > 0 ? 'Haute' : 'Basse'}
   
5. **Enrichir les contenus à faible complétude** (${results.cols.completeness.minimal + results.training.completeness.minimal + results.recipes.completeness.minimal + results.plans.completeness.minimal} au total)
   - Priorité: ${(results.cols.completeness.minimal + results.training.completeness.minimal) > 0 ? 'Moyenne' : 'Basse'}

## Plan d'action proposé

1. Exécuter le script de fusion des doublons identifiés
2. Mettre à jour manuellement les contenus avec données critiques manquantes
3. Standardiser les slugs incohérents via le script de standardisation
4. Vérifier et corriger les références croisées
5. Enrichir progressivement les contenus incomplets

Ce rapport sera mis à jour régulièrement pour suivre les progrès de standardisation du contenu.`;

  // Écrire le rapport
  fs.writeFileSync(REPORT_PATH, report, 'utf8');
  console.log(chalk.green(`✓ Rapport de qualité du contenu généré: ${REPORT_PATH}`));
}

/**
 * Fonction principale
 */
async function main() {
  console.log(chalk.blue('=== Validation et analyse de la cohérence du contenu ===\n'));
  
  // Analyser les cols
  console.log(chalk.cyan('\n=== Analyse des cols ===\n'));
  const colsResults = analyzeDirectory(
    DATA_DIRS.cols,
    EXPECTED_STRUCTURES.cols,
    CRITICAL_FIELDS.cols
  );
  
  // Analyser les programmes d'entraînement
  console.log(chalk.cyan('\n=== Analyse des programmes d\'entraînement ===\n'));
  const trainingResults = analyzeDirectory(
    DATA_DIRS.training,
    EXPECTED_STRUCTURES.training,
    CRITICAL_FIELDS.training
  );
  
  // Analyser les recettes
  console.log(chalk.cyan('\n=== Analyse des recettes ===\n'));
  const recipesResults = analyzeDirectory(
    DATA_DIRS.nutrition.recipes,
    EXPECTED_STRUCTURES.recipes,
    CRITICAL_FIELDS.recipes
  );
  
  // Analyser les plans nutritionnels
  console.log(chalk.cyan('\n=== Analyse des plans nutritionnels ===\n'));
  const plansResults = analyzeDirectory(
    DATA_DIRS.nutrition.plans,
    EXPECTED_STRUCTURES.plans,
    CRITICAL_FIELDS.plans
  );
  
  // Analyser les références croisées
  const referencesResults = analyzeReferences(
    colsResults,
    trainingResults,
    {
      recipes: recipesResults,
      plans: plansResults
    }
  );
  
  // Générer le rapport
  generateReport({
    cols: colsResults,
    training: trainingResults,
    recipes: recipesResults,
    plans: plansResults,
    references: referencesResults
  });
  
  console.log(chalk.green('\n✓ Analyse terminée avec succès\n'));
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red('Erreur lors de l\'exécution du script:', error));
});
