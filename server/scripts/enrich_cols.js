// Script Node.js pour enrichir automatiquement les fichiers de cols manquants
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data/cols/enriched');

// Valeurs par défaut pour enrichissement
const defaultValues = {
  length_km: 10.0,
  avg_gradient: 6.5,
  max_elevation: 2000,
  weather_patterns: "Variable, risque d'orage en été, neige possible hors saison.",
  records: {
    pro: { name: "N/A", time: "--:--" },
    amateur: { name: "N/A", time: "--:--" }
  }
};

function enrichCol(col) {
  if (col.length_km === undefined && col.length !== undefined) {
    col.length_km = col.length;
  } else if (col.length_km === undefined) {
    col.length_km = defaultValues.length_km;
  }
  if (col.avg_gradient === undefined && col.gradient && col.gradient.avg !== undefined) {
    col.avg_gradient = col.gradient.avg;
  } else if (col.avg_gradient === undefined) {
    col.avg_gradient = defaultValues.avg_gradient;
  }
  if (col.max_elevation === undefined && col.altitude !== undefined) {
    col.max_elevation = col.altitude;
  } else if (col.max_elevation === undefined) {
    col.max_elevation = defaultValues.max_elevation;
  }
  if (col.weather_patterns === undefined && col.weather && col.weather.historical_data && col.weather.historical_data.note) {
    col.weather_patterns = col.weather.historical_data.note;
  } else if (col.weather_patterns === undefined) {
    col.weather_patterns = defaultValues.weather_patterns;
  }
  if (col.records === undefined) {
    if (col.records) {
      col.records = col.records;
    } else {
      col.records = defaultValues.records;
    }
  }
  return col;
}

function main() {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  files.forEach(file => {
    const filePath = path.join(DATA_DIR, file);
    const col = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const enriched = enrichCol(col);
    fs.writeFileSync(filePath, JSON.stringify(enriched, null, 2));
    console.log('Enrichi:', file);
  });
  console.log('Enrichissement automatique terminé.');
}

main();
