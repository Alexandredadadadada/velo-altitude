// Script Node.js pour import batch de cols enrichis – Sprint Excellence 2025

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data/cols/enriched');

const newCols = [
  {
    filename: 'col-de-la-madeleine.json',
    data: {
      id: 'col-de-la-madeleine',
      name: 'Col de la Madeleine',
      country: 'France',
      region: 'Alpes',
      length_km: 19.2,
      avg_gradient: 7.9,
      max_elevation: 2000,
      difficulty: 9,
      description: {
        fr: "Un col mythique des Alpes, incontournable du Tour de France.",
        en: "A legendary Alpine pass, a must in the Tour de France."
      },
      coordinates: [45.395, 6.327],
      elevation_profile: [0, 400, 800, 1200, 1600, 2000],
      images: ["madeleine1.jpg", "madeleine2.jpg"],
      videos: ["https://youtu.be/madeleine-col"],
      weather_patterns: "Frais, risque d’orage en été.",
      records: {
        pro: { name: "Nairo Quintana", time: "54:15" },
        amateur: { name: "Jean Dupont", time: "1:20:00" }
      }
    }
  },
  {
    filename: 'col-d-izoard.json',
    data: {
      id: 'col-d-izoard',
      name: 'Col d’Izoard',
      country: 'France',
      region: 'Alpes',
      length_km: 19,
      avg_gradient: 6.0,
      max_elevation: 2360,
      difficulty: 8,
      description: {
        fr: "Célèbre pour la Casse Déserte, paysage lunaire unique.",
        en: "Famous for the Casse Déserte, a unique lunar landscape."
      },
      coordinates: [44.820, 6.742],
      elevation_profile: [0, 400, 900, 1500, 2000, 2360],
      images: ["izoard1.jpg", "izoard2.jpg"],
      videos: ["https://youtu.be/izoard-col"],
      weather_patterns: "Sec, vent fréquent.",
      records: {
        pro: { name: "Chris Froome", time: "51:30" },
        amateur: { name: "Pierre Martin", time: "1:18:00" }
      }
    }
  }
];

function importCols() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  newCols.forEach(col => {
    const filePath = path.join(DATA_DIR, col.filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(col.data, null, 2));
      console.log('Col ajouté:', col.data.name);
    } else {
      console.log('Déjà présent:', col.data.name);
    }
  });
}

importCols();
