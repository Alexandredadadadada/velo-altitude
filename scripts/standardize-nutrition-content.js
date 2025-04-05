/**
 * Script de standardisation des plans nutritionnels et recettes
 * Velo-Altitude
 * 
 * Ce script normalise les données nutritionnelles et les organise
 * selon une structure standard dans le répertoire cible.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const chalk = require('chalk') || { green: (text) => text, red: (text) => text, yellow: (text) => text, blue: (text) => text };

// Chemins des répertoires sources
const SOURCE_DIRS = [
  path.join(__dirname, '../server/data'),
  path.join(__dirname, '../client/src/data')
];

// Chemin du répertoire cible
const TARGET_DIR = path.join(__dirname, '../server/data/nutrition');

// Structure standard pour une recette
const STANDARD_RECIPE = {
  id: '',                      // Identifiant unique
  name: '',                    // Nom de la recette
  slug: '',                    // Slug pour l'URL
  category: '',                // Catégorie (pré-effort, récupération, etc.)
  duration: {                  // Durée de préparation
    prep: 0,                   // Temps de préparation en minutes
    cook: 0,                   // Temps de cuisson en minutes
    total: 0                   // Temps total en minutes
  },
  description: {               // Description en plusieurs langues
    fr: '',
    en: ''
  },
  ingredients: [],             // Liste des ingrédients
  instructions: [],            // Étapes de préparation
  nutrition_facts: {           // Valeurs nutritionnelles
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sodium: 0
  },
  benefits: [],                // Bénéfices pour le cycliste
  image: '',                   // URL de l'image
  videos: [],                  // Vidéos explicatives
  related_cols: [],            // Cols pour lesquels cette recette est recommandée
  related_training: [],        // Programmes d'entraînement associés
  status: 'active',            // Statut
  completeness: 0,             // Niveau de complétude
  last_updated: ''             // Date de dernière mise à jour
};

// Structure standard pour un plan nutritionnel
const STANDARD_NUTRITION_PLAN = {
  id: '',                      // Identifiant unique
  name: '',                    // Nom du plan
  slug: '',                    // Slug pour l'URL
  category: '',                // Catégorie (endurance, compétition, etc.)
  description: {               // Description en plusieurs langues
    fr: '',
    en: ''
  },
  days: [],                    // Plan jour par jour
  recipes: [],                 // Recettes associées
  supplements: [],             // Suppléments recommandés
  hydration: {},               // Conseils d'hydratation
  variations: [],              // Variations selon les besoins
  related_cols: [],            // Cols pour lesquels ce plan est recommandé
  related_training: [],        // Programmes d'entraînement associés
  status: 'active',            // Statut
  completeness: 0,             // Niveau de complétude
  last_updated: ''             // Date de dernière mise à jour
};

/**
 * Crée les répertoires cibles s'ils n'existent pas
 */
function createTargetDirectories() {
  console.log(chalk.blue('Création des répertoires pour les plans nutritionnels...'));
  
  const dirs = [
    TARGET_DIR,
    path.join(TARGET_DIR, 'recipes'),
    path.join(TARGET_DIR, 'plans')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(chalk.green(`✓ Répertoire créé: ${dir}`));
    } else {
      console.log(chalk.yellow(`! Répertoire existant: ${dir}`));
    }
  });
}

/**
 * Trouve tous les fichiers contenant des données nutritionnelles
 * @returns {Object} Fichiers trouvés, séparés par type
 */
function findNutritionFiles() {
  console.log(chalk.blue('Recherche des fichiers de nutrition...'));
  
  const files = {
    recipes: [],
    plans: []
  };
  
  SOURCE_DIRS.forEach(dir => {
    if (fs.existsSync(dir)) {
      // Parcourir les fichiers du répertoire principal
      fs.readdirSync(dir).forEach(file => {
        if (file.endsWith('.json') || file.endsWith('.js')) {
          if (file.includes('recipe') || file.includes('recette')) {
            files.recipes.push(path.join(dir, file));
          } else if (file.includes('nutrition') || file.includes('plan')) {
            files.plans.push(path.join(dir, file));
          }
        }
      });
      
      // Vérifier les sous-répertoires
      ['nutrition', 'recipes', 'plans'].forEach(subDir => {
        const fullSubDir = path.join(dir, subDir);
        if (fs.existsSync(fullSubDir) && fs.statSync(fullSubDir).isDirectory()) {
          fs.readdirSync(fullSubDir).forEach(file => {
            if (file.endsWith('.json') || file.endsWith('.js')) {
              if (subDir === 'recipes' || file.includes('recipe') || file.includes('recette')) {
                files.recipes.push(path.join(fullSubDir, file));
              } else {
                files.plans.push(path.join(fullSubDir, file));
              }
            }
          });
        }
      });
    }
  });
  
  console.log(chalk.green(`✓ Trouvé ${files.recipes.length} fichiers de recettes`));
  console.log(chalk.green(`✓ Trouvé ${files.plans.length} fichiers de plans nutritionnels\n`));
  
  return files;
}

/**
 * Standardise les données d'une recette
 * @param {Object} recipeData Données de la recette
 * @returns {Object} Recette standardisée
 */
function standardizeRecipeData(recipeData) {
  // Créer un objet avec la structure standard
  const standardRecipe = JSON.parse(JSON.stringify(STANDARD_RECIPE));
  
  // Remplir avec les données disponibles
  standardRecipe.id = recipeData.id || recipeData.recipeId || '';
  standardRecipe.name = recipeData.name || recipeData.title || recipeData.nom || '';
  standardRecipe.slug = recipeData.slug || recipeData.id || 
    standardRecipe.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  
  standardRecipe.category = recipeData.category || recipeData.categorie || '';
  
  // Durée
  if (recipeData.duration) {
    standardRecipe.duration = recipeData.duration;
  } else if (recipeData.temps || recipeData.time) {
    const time = recipeData.temps || recipeData.time;
    standardRecipe.duration.prep = time.preparation || 0;
    standardRecipe.duration.cook = time.cuisson || time.cooking || 0;
    standardRecipe.duration.total = time.total || (standardRecipe.duration.prep + standardRecipe.duration.cook);
  }
  
  // Description
  if (typeof recipeData.description === 'string') {
    standardRecipe.description.fr = recipeData.description;
  } else if (recipeData.description) {
    standardRecipe.description = { ...standardRecipe.description, ...recipeData.description };
  }
  
  // Ingrédients et instructions
  standardRecipe.ingredients = recipeData.ingredients || [];
  standardRecipe.instructions = recipeData.instructions || recipeData.steps || recipeData.etapes || [];
  
  // Valeurs nutritionnelles
  if (recipeData.nutrition_facts || recipeData.nutritionFacts || recipeData.nutrition) {
    const nutrition = recipeData.nutrition_facts || recipeData.nutritionFacts || recipeData.nutrition;
    standardRecipe.nutrition_facts = {
      calories: nutrition.calories || 0,
      protein: nutrition.protein || nutrition.proteine || 0,
      carbs: nutrition.carbs || nutrition.carbohydrates || nutrition.glucides || 0,
      fat: nutrition.fat || nutrition.lipides || 0,
      fiber: nutrition.fiber || nutrition.fibre || 0,
      sodium: nutrition.sodium || 0
    };
  }
  
  // Autres propriétés
  standardRecipe.benefits = recipeData.benefits || recipeData.benefices || [];
  standardRecipe.image = recipeData.image || recipeData.photo || '';
  standardRecipe.videos = recipeData.videos || [];
  standardRecipe.related_cols = recipeData.related_cols || recipeData.cols || [];
  standardRecipe.related_training = recipeData.related_training || recipeData.training || [];
  standardRecipe.status = recipeData.status || 'active';
  
  // Calculer la complétude
  const totalFields = Object.keys(STANDARD_RECIPE).length;
  let filledFields = 0;
  
  // Compter les champs remplis
  Object.entries(standardRecipe).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length > 0) filledFields++;
    else if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) filledFields++;
    else if (value && typeof value !== 'object') filledFields++;
  });
  
  standardRecipe.completeness = Math.round((filledFields / totalFields) * 100);
  standardRecipe.last_updated = recipeData.last_updated || recipeData.updated || new Date().toISOString();
  
  return standardRecipe;
}

/**
 * Standardise les données d'un plan nutritionnel
 * @param {Object} planData Données du plan
 * @returns {Object} Plan standardisé
 */
function standardizePlanData(planData) {
  // Créer un objet avec la structure standard
  const standardPlan = JSON.parse(JSON.stringify(STANDARD_NUTRITION_PLAN));
  
  // Remplir avec les données disponibles
  standardPlan.id = planData.id || planData.planId || '';
  standardPlan.name = planData.name || planData.title || planData.nom || '';
  standardPlan.slug = planData.slug || planData.id || 
    standardPlan.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  
  standardPlan.category = planData.category || planData.categorie || '';
  
  // Description
  if (typeof planData.description === 'string') {
    standardPlan.description.fr = planData.description;
  } else if (planData.description) {
    standardPlan.description = { ...standardPlan.description, ...planData.description };
  }
  
  // Autres propriétés
  standardPlan.days = planData.days || planData.jours || [];
  standardPlan.recipes = planData.recipes || planData.recettes || [];
  standardPlan.supplements = planData.supplements || [];
  standardPlan.hydration = planData.hydration || planData.hydratation || {};
  standardPlan.variations = planData.variations || planData.variantes || [];
  standardPlan.related_cols = planData.related_cols || planData.cols || [];
  standardPlan.related_training = planData.related_training || planData.training || [];
  standardPlan.status = planData.status || 'active';
  
  // Calculer la complétude
  const totalFields = Object.keys(STANDARD_NUTRITION_PLAN).length;
  let filledFields = 0;
  
  // Compter les champs remplis
  Object.entries(standardPlan).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length > 0) filledFields++;
    else if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) filledFields++;
    else if (value && typeof value !== 'object') filledFields++;
  });
  
  standardPlan.completeness = Math.round((filledFields / totalFields) * 100);
  standardPlan.last_updated = planData.last_updated || planData.updated || new Date().toISOString();
  
  return standardPlan;
}

/**
 * Traite un fichier de recettes
 * @param {string} filePath Chemin du fichier
 */
function processRecipeFile(filePath) {
  console.log(chalk.blue(`Traitement du fichier de recettes: ${filePath}...`));
  
  try {
    let recipeData;
    
    if (filePath.endsWith('.json')) {
      // Lire le fichier JSON
      const rawData = fs.readFileSync(filePath, 'utf8');
      recipeData = JSON.parse(rawData);
    } else if (filePath.endsWith('.js')) {
      // Pour les fichiers JS, on les évalue dans un contexte sécurisé
      const content = fs.readFileSync(filePath, 'utf8');
      // Extraction basique des données
      const match = content.match(/module\.exports\s*=\s*({[\s\S]*})/);
      if (match) {
        recipeData = eval('(' + match[1] + ')');
      }
    }
    
    if (!recipeData) {
      console.log(chalk.yellow(`! Aucune donnée trouvée dans ${filePath}`));
      return;
    }
    
    // Gérer les formats différents (objet unique ou tableau d'objets)
    const recipes = Array.isArray(recipeData) ? recipeData : [recipeData];
    
    recipes.forEach(recipe => {
      if (!recipe.id && !recipe.name && !recipe.title) {
        console.log(chalk.yellow(`! Recette sans identifiant trouvée dans ${filePath}, ignorée`));
        return;
      }
      
      const standardRecipe = standardizeRecipeData(recipe);
      
      // Créer le fichier standardisé
      const targetFile = path.join(TARGET_DIR, 'recipes', `${standardRecipe.slug}.json`);
      fs.writeFileSync(targetFile, JSON.stringify(standardRecipe, null, 2), 'utf8');
      
      console.log(chalk.green(`✓ Recette standardisée: ${standardRecipe.name} -> ${targetFile}`));
    });
    
  } catch (error) {
    console.log(chalk.red(`✗ Erreur lors du traitement de ${filePath}: ${error.message}`));
  }
}

/**
 * Traite un fichier de plan nutritionnel
 * @param {string} filePath Chemin du fichier
 */
function processPlanFile(filePath) {
  console.log(chalk.blue(`Traitement du fichier de plan nutritionnel: ${filePath}...`));
  
  try {
    let planData;
    
    if (filePath.endsWith('.json')) {
      // Lire le fichier JSON
      const rawData = fs.readFileSync(filePath, 'utf8');
      planData = JSON.parse(rawData);
    } else if (filePath.endsWith('.js')) {
      // Pour les fichiers JS, on les évalue dans un contexte sécurisé
      const content = fs.readFileSync(filePath, 'utf8');
      // Extraction basique des données
      const match = content.match(/module\.exports\s*=\s*({[\s\S]*})/);
      if (match) {
        planData = eval('(' + match[1] + ')');
      }
    }
    
    if (!planData) {
      console.log(chalk.yellow(`! Aucune donnée trouvée dans ${filePath}`));
      return;
    }
    
    // Gérer les formats différents (objet unique ou tableau d'objets)
    const plans = Array.isArray(planData) ? planData : [planData];
    
    plans.forEach(plan => {
      if (!plan.id && !plan.name && !plan.title) {
        console.log(chalk.yellow(`! Plan sans identifiant trouvé dans ${filePath}, ignoré`));
        return;
      }
      
      const standardPlan = standardizePlanData(plan);
      
      // Créer le fichier standardisé
      const targetFile = path.join(TARGET_DIR, 'plans', `${standardPlan.slug}.json`);
      fs.writeFileSync(targetFile, JSON.stringify(standardPlan, null, 2), 'utf8');
      
      console.log(chalk.green(`✓ Plan nutritionnel standardisé: ${standardPlan.name} -> ${targetFile}`));
    });
    
  } catch (error) {
    console.log(chalk.red(`✗ Erreur lors du traitement de ${filePath}: ${error.message}`));
  }
}

/**
 * Crée les fichiers d'index pour les recettes et les plans
 */
function createIndexFiles() {
  console.log(chalk.blue('\n=== Création des index ==='));
  
  // Index des recettes
  const recipesDir = path.join(TARGET_DIR, 'recipes');
  const recipesIndexPath = path.join(recipesDir, 'index.json');
  
  const recipes = [];
  
  if (fs.existsSync(recipesDir)) {
    fs.readdirSync(recipesDir).forEach(file => {
      if (file !== 'index.json' && file.endsWith('.json')) {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(recipesDir, file), 'utf8'));
          recipes.push({
            id: data.id,
            slug: data.slug,
            name: data.name,
            category: data.category,
            image: data.image,
            completeness: data.completeness,
            status: data.status
          });
        } catch (error) {
          console.log(chalk.yellow(`! Impossible de lire ${file}: ${error.message}`));
        }
      }
    });
  }
  
  fs.writeFileSync(recipesIndexPath, JSON.stringify(recipes, null, 2), 'utf8');
  console.log(chalk.green(`✓ Index des recettes créé avec ${recipes.length} recettes`));
  
  // Index des plans
  const plansDir = path.join(TARGET_DIR, 'plans');
  const plansIndexPath = path.join(plansDir, 'index.json');
  
  const plans = [];
  
  if (fs.existsSync(plansDir)) {
    fs.readdirSync(plansDir).forEach(file => {
      if (file !== 'index.json' && file.endsWith('.json')) {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(plansDir, file), 'utf8'));
          plans.push({
            id: data.id,
            slug: data.slug,
            name: data.name,
            category: data.category,
            completeness: data.completeness,
            status: data.status
          });
        } catch (error) {
          console.log(chalk.yellow(`! Impossible de lire ${file}: ${error.message}`));
        }
      }
    });
  }
  
  fs.writeFileSync(plansIndexPath, JSON.stringify(plans, null, 2), 'utf8');
  console.log(chalk.green(`✓ Index des plans créé avec ${plans.length} plans`));
  
  // Index global
  const mainIndexPath = path.join(TARGET_DIR, 'index.json');
  const mainIndex = {
    recipes: recipes.length,
    plans: plans.length,
    last_updated: new Date().toISOString()
  };
  
  fs.writeFileSync(mainIndexPath, JSON.stringify(mainIndex, null, 2), 'utf8');
  console.log(chalk.green(`✓ Index principal créé`));
}

/**
 * Fonction principale
 */
async function main() {
  console.log(chalk.blue('=== Standardisation des données nutritionnelles ===\n'));
  
  // Créer les répertoires cibles
  createTargetDirectories();
  
  // Trouver les fichiers
  const files = findNutritionFiles();
  
  // Traiter les recettes
  console.log(chalk.blue('\n=== Traitement des recettes ===\n'));
  files.recipes.forEach(processRecipeFile);
  
  // Traiter les plans nutritionnels
  console.log(chalk.blue('\n=== Traitement des plans nutritionnels ===\n'));
  files.plans.forEach(processPlanFile);
  
  // Créer les fichiers d'index
  createIndexFiles();
  
  console.log(chalk.green('\n✓ Standardisation des données nutritionnelles terminée'));
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red('Erreur lors de l\'exécution du script:', error));
});
