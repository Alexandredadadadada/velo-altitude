// Script Node.js pour valider la cohérence des fichiers cols enrichis

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data/cols/enriched');

function validateCol(col, filename) {
  const required = ['id', 'name', 'country', 'region', 'length_km', 'avg_gradient', 'max_elevation', 'difficulty', 'description', 'coordinates', 'elevation_profile', 'images', 'videos', 'weather_patterns', 'records'];
  let ok = true;
  required.forEach(key => {
    if (!(key in col)) {
      console.error(`[${filename}] Champ manquant: ${key}`);
      ok = false;
    }
  });
  if (!col.id || !col.name) {
    console.error(`[${filename}] id ou name manquant`);
    ok = false;
  }
  return ok;
}

function main() {
  let ok = true;
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  files.forEach(file => {
    const col = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
    ok = validateCol(col, file) && ok;
  });
  if (ok) {
  } else {
  }
}

main();
