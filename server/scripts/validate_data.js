// Script Node.js pour valider la cohérence des données training et nutrition

const fs = require('fs');
const path = require('path');

const TRAINING_PATH = path.join(__dirname, '../data/training/index.json');
const RECIPES_PATH = path.join(__dirname, '../data/nutrition/recipes/index.json');

function validateArray(arr, type) {
  let valid = true;
  arr.forEach((item, idx) => {
    if (!item.id || !item.slug || !item.name || !item.completeness || !item.status) {
      console.error(`[${type}] Erreur à l'index ${idx}: champs obligatoires manquants.`);
      valid = false;
    }
    if (item.completeness !== 100) {
      console.warn(`[${type}] ${item.name}: complétude != 100`);
    }
  });
  return valid;
}

function main() {
  let ok = true;
  if (fs.existsSync(TRAINING_PATH)) {
    const trainings = JSON.parse(fs.readFileSync(TRAINING_PATH, 'utf8'));
    ok = validateArray(trainings, 'training') && ok;
  }
  if (fs.existsSync(RECIPES_PATH)) {
    const recipes = JSON.parse(fs.readFileSync(RECIPES_PATH, 'utf8'));
    ok = validateArray(recipes, 'recipe') && ok;
  }
  if (ok) {
  } else {
  }
}

main();
