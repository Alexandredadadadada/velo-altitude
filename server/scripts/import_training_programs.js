// Script Node.js pour import batch de programmes d'entraînement – Sprint Excellence 2025

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/training/index.json');

const newPrograms = [
  {
    id: 'hiit-004',
    slug: 'hiit-puissance-max',
    name: 'HIIT Puissance Maximale',
    type: 'hiit',
    level: 'avancé',
    duration: 1,
    completeness: 100,
    status: 'active'
  },
  {
    id: 'hiit-005',
    slug: 'hiit-endurance-intense',
    name: 'HIIT Endurance Intense',
    type: 'hiit',
    level: 'intermédiaire',
    duration: 1,
    completeness: 100,
    status: 'active'
  },
  {
    id: 'hiit-006',
    slug: 'hiit-sprints-courts',
    name: 'HIIT Sprints Courts',
    type: 'hiit',
    level: 'débutant',
    duration: 1,
    completeness: 100,
    status: 'active'
  }
];

function importPrograms() {
  let programs = [];
  if (fs.existsSync(DATA_PATH)) {
    programs = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  }
  // Ajoute sans doublons
  newPrograms.forEach(newProg => {
    if (!programs.find(p => p.id === newProg.id)) {
      programs.push(newProg);
    }
  });
  fs.writeFileSync(DATA_PATH, JSON.stringify(programs, null, 2));
  console.log('Import batch terminé. Programmes ajoutés:', newPrograms.length);
}

importPrograms();
