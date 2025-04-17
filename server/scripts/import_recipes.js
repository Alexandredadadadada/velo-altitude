// Script Node.js pour import batch de recettes cyclistes – Sprint Excellence 2025

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/nutrition/recipes/index.json');

const newRecipes = [
  {
    id: 'recette-004',
    slug: 'gaufres-energie-banane',
    name: 'Gaufres énergie banane',
    type: 'pré-ride',
    calories: 210,
    carbs: 38,
    protein: 5,
    fat: 4,
    completeness: 100,
    status: 'active'
  },
  {
    id: 'recette-005',
    slug: 'gel-energie-fruits-rouges',
    name: 'Gel énergie fruits rouges',
    type: 'pendant effort',
    calories: 60,
    carbs: 15,
    protein: 0,
    fat: 0,
    completeness: 100,
    status: 'active'
  },
  {
    id: 'recette-006',
    slug: 'omelette-recup-proteinee',
    name: 'Omelette récup protéinée',
    type: 'récupération',
    calories: 250,
    carbs: 5,
    protein: 20,
    fat: 16,
    completeness: 100,
    status: 'active'
  }
];

function importRecipes() {
  let recipes = [];
  if (fs.existsSync(DATA_PATH)) {
    recipes = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  }
  // Ajoute sans doublons
  newRecipes.forEach(newRec => {
    if (!recipes.find(r => r.id === newRec.id)) {
      recipes.push(newRec);
    }
  });
  fs.writeFileSync(DATA_PATH, JSON.stringify(recipes, null, 2));
  console.log('Import batch terminé. Recettes ajoutées:', newRecipes.length);
}

importRecipes();
