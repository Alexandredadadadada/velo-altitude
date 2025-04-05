/**
 * Outil de détection des doublons pour Velo-Altitude
 * Version: 1.0
 * Date: 6 avril 2025
 * 
 * Cet outil analyse les fichiers JSON et JS contenant des données
 * pour détecter les doublons potentiels dans:
 * - Cols
 * - Plans nutritionnels
 * - Plans d'entraînement
 * - Recettes
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

// Conversion de fs.readFile en version Promise
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

// Configuration
const CONFIG = {
  basePath: path.resolve(__dirname, '../'),
  outputPath: path.resolve(__dirname, '../docs/content-duplicates-report.md'),
  // Seuils de similarité (0-1, où 1 est identique)
  thresholds: {
    nameThreshold: 0.8,      // Similarité des noms
    locationThreshold: 0.95, // Similarité des emplacements (pour les cols)
    contentThreshold: 0.7,   // Similarité générale du contenu
  }
};

// Fichiers à analyser
const FILES_TO_SCAN = {
  cols: [
    'server/data/cols-index.json',
    'server/data/european-cols-enriched-final.json',
    'server/data/european-cols-enriched-final2.json',
    'server/data/european-cols-enriched-part1.json',
    'server/data/european-cols-enriched-part2.json',
    'server/data/european-cols-enriched-part3.json',
    'server/data/european-cols-enriched-part4.json',
    'server/data/european-cols-enriched-part5.json',
    'server/data/european-cols-enriched-east1.json',
    'server/data/european-cols-enriched-east2.json',
    'client/src/data/remainingCols.js',
    'client/src/data/remainingCols2.js',
    'client/src/data/remainingCols3.js'
  ],
  nutrition: [
    'server/data/nutrition-plans.json',
    'client/src/data/nutritionRecipes.js',
    'client/src/data/additionalNutritionRecipes1.js',
    'client/src/data/additionalNutritionRecipes2.js'
  ],
  training: [
    'server/data/training-plans.json',
    'server/data/training-plans-enhanced/plan-haute-montagne.json',
    'client/src/data/trainingPrograms.js',
    'client/src/data/remainingTrainingPrograms.js',
    'client/src/data/remainingTrainingPrograms2.js',
    'client/src/data/specialTrainingPrograms.js',
    'client/src/data/specialTrainingPrograms2.js',
    'client/src/data/hiitWorkouts.js'
  ]
};

// Fonction utilitaire pour calculer la distance de Levenshtein (similarité de chaîne)
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // Initialisation de la matrice
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Calcul de la distance
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // Substitution
          Math.min(
            matrix[i][j - 1] + 1,   // Insertion
            matrix[i - 1][j] + 1    // Suppression
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Fonction pour calculer la similarité entre deux chaînes (0-1)
function stringSimilarity(s1, s2) {
  if (!s1 || !s2) return 0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  
  if (longerLength === 0) {
    return 1.0;
  }
  
  return (longerLength - levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase())) / longerLength;
}

// Fonction pour calculer la similarité entre deux emplacements géographiques
function locationSimilarity(loc1, loc2) {
  if (!loc1 || !loc2) return 0;
  if (!loc1.latitude || !loc1.longitude || !loc2.latitude || !loc2.longitude) return 0;
  
  // Distance entre deux points géographiques (formule haversine simplifiée)
  const lat1 = parseFloat(loc1.latitude);
  const lon1 = parseFloat(loc1.longitude);
  const lat2 = parseFloat(loc2.latitude);
  const lon2 = parseFloat(loc2.longitude);
  
  // Si les coordonnées sont très proches (moins de 1km), on considère que c'est le même lieu
  const distance = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2)) * 111; // approximation en km
  
  // Retourne une similarité entre 0 et 1
  return distance < 1 ? 1 : Math.max(0, 1 - (distance / 10)); // similarité décroît avec la distance
}

// Fonction pour extraire les objets d'un fichier JavaScript
async function extractObjectsFromJS(filePath) {
  try {
    const content = await readFile(path.resolve(CONFIG.basePath, filePath), 'utf8');
    
    // Définition des patterns pour extraire les données JS
    const exportDefaultPattern = /export\s+default\s+(\[[\s\S]*?\]);/;
    const exportConstPattern = /export\s+const\s+\w+\s*=\s*(\[[\s\S]*?\]);/;
    const constPattern = /const\s+\w+\s*=\s*(\[[\s\S]*?\]);/;
    
    // Recherche des motifs
    let match = content.match(exportDefaultPattern) || 
                content.match(exportConstPattern) ||
                content.match(constPattern);
    
    if (match && match[1]) {
      // Convertir le texte JS en JSON valide pour pouvoir l'analyser
      const jsonStr = match[1]
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Convertir les clés en format JSON
        .replace(/'/g, '"')                                  // Remplacer les apostrophes par des guillemets
        .replace(/,(\s*[\]}])/g, '$1');                      // Supprimer les virgules traînantes

      try {
        return JSON.parse(jsonStr);
      } catch (e) {
        console.error(`Erreur lors du parsing de ${filePath}:`, e);
        return [];
      }
    }
    return [];
  } catch (error) {
    console.error(`Erreur lors de la lecture de ${filePath}:`, error);
    return [];
  }
}

// Fonction pour lire et parser un fichier JSON
async function readJSONFile(filePath) {
  try {
    const content = await readFile(path.resolve(CONFIG.basePath, filePath), 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Erreur lors de la lecture de ${filePath}:`, error);
    return null;
  }
}

// Fonction pour extraire les données pertinentes d'un fichier
async function extractData(filePath) {
  if (filePath.endsWith('.js')) {
    return await extractObjectsFromJS(filePath);
  } else if (filePath.endsWith('.json')) {
    const data = await readJSONFile(filePath);
    
    // Déterminer la structure du fichier JSON
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === 'object') {
      // Récupérer la première propriété qui est un tableau
      for (const prop in data) {
        if (Array.isArray(data[prop])) {
          return data[prop];
        }
      }
    }
  }
  return [];
}

// Fonction pour comparer deux objets et déterminer si ce sont des doublons
function areDuplicates(item1, item2, type) {
  // Si les IDs sont identiques, c'est un doublon évident
  if (item1.id && item2.id && item1.id === item2.id) {
    return { 
      isDuplicate: true, 
      reason: 'ID identique', 
      similarity: 1.0 
    };
  }
  
  // Comparaison par nom
  const nameSimilarity = stringSimilarity(
    type === 'cols' ? (item1.name || item1.nom) : item1.name, 
    type === 'cols' ? (item2.name || item2.nom) : item2.name
  );
  
  if (nameSimilarity > CONFIG.thresholds.nameThreshold) {
    // Pour les cols, vérifier aussi l'emplacement
    if (type === 'cols' && item1.location && item2.location) {
      const locSimilarity = locationSimilarity(item1.location, item2.location);
      
      if (locSimilarity > CONFIG.thresholds.locationThreshold) {
        return { 
          isDuplicate: true, 
          reason: 'Nom et localisation similaires', 
          similarity: (nameSimilarity + locSimilarity) / 2 
        };
      }
    } else {
      // Pour les autres types, se fier à la similarité du nom
      return { 
        isDuplicate: true, 
        reason: 'Noms similaires', 
        similarity: nameSimilarity 
      };
    }
  }
  
  return { isDuplicate: false };
}

// Fonction principale pour analyser un type de contenu
async function analyzeContentType(type, files) {
  console.log(`Analyse des ${type}...`);
  
  let allItems = [];
  let fileMapping = {}; // Pour savoir de quel fichier provient chaque élément
  
  // Collecter tous les éléments de tous les fichiers
  for (const file of files) {
    try {
      const items = await extractData(file);
      if (items && items.length > 0) {
        items.forEach(item => {
          allItems.push(item);
          fileMapping[allItems.length - 1] = file;
        });
        console.log(`${file}: ${items.length} éléments extraits`);
      } else {
        console.log(`${file}: Aucun élément trouvé ou erreur d'extraction`);
      }
    } catch (error) {
      console.error(`Erreur lors de l'analyse de ${file}:`, error);
    }
  }
  
  console.log(`Total: ${allItems.length} éléments pour les ${type}`);
  
  // Recherche des doublons
  let duplicates = [];
  
  for (let i = 0; i < allItems.length; i++) {
    for (let j = i + 1; j < allItems.length; j++) {
      const result = areDuplicates(allItems[i], allItems[j], type);
      
      if (result.isDuplicate) {
        duplicates.push({
          type,
          item1: {
            source: fileMapping[i],
            data: allItems[i]
          },
          item2: {
            source: fileMapping[j],
            data: allItems[j]
          },
          reason: result.reason,
          similarity: result.similarity
        });
      }
    }
  }
  
  return duplicates;
}

// Fonction pour générer un rapport au format Markdown
async function generateReport(duplicates) {
  let report = `# Rapport de détection des doublons - Velo-Altitude
  
Date de génération: ${new Date().toLocaleString()}
Total des doublons potentiels détectés: ${duplicates.length}

## Résumé

| Type de contenu | Nombre de doublons |
|-----------------|---------------------|
| Cols | ${duplicates.filter(d => d.type === 'cols').length} |
| Plans nutritionnels | ${duplicates.filter(d => d.type === 'nutrition').length} |
| Plans d'entraînement | ${duplicates.filter(d => d.type === 'training').length} |

## Liste détaillée des doublons

`;

  // Trier les doublons par type, puis par similarité décroissante
  duplicates.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type.localeCompare(b.type);
    }
    return b.similarity - a.similarity;
  });

  let currentType = null;
  
  for (const dup of duplicates) {
    if (currentType !== dup.type) {
      currentType = dup.type;
      report += `\n### ${currentType.charAt(0).toUpperCase() + currentType.slice(1)}\n\n`;
    }
    
    const item1Name = dup.item1.data.name || dup.item1.data.nom || dup.item1.data.id || 'Sans nom';
    const item2Name = dup.item2.data.name || dup.item2.data.nom || dup.item2.data.id || 'Sans nom';
    
    report += `#### ${item1Name} / ${item2Name}\n\n`;
    report += `- **Confiance**: ${Math.round(dup.similarity * 100)}%\n`;
    report += `- **Raison**: ${dup.reason}\n`;
    report += `- **Sources**:\n`;
    report += `  - ${dup.item1.source}\n`;
    report += `  - ${dup.item2.source}\n\n`;
    
    // Afficher les différences spécifiques en fonction du type
    if (dup.type === 'cols') {
      const showProp = (prop, label) => {
        const val1 = dup.item1.data[prop];
        const val2 = dup.item2.data[prop];
        if (val1 || val2) {
          report += `- **${label}**: ${val1 || 'Non spécifié'} / ${val2 || 'Non spécifié'}\n`;
        }
      };
      
      showProp('altitude', 'Altitude');
      if (dup.item1.data.location && dup.item2.data.location) {
        const loc1 = dup.item1.data.location;
        const loc2 = dup.item2.data.location;
        report += `- **Coordonnées**: ${loc1.latitude},${loc1.longitude} / ${loc2.latitude},${loc2.longitude}\n`;
      }
    }
    
    report += `\n---\n\n`;
  }
  
  report += `\n## Recommandations
  
1. Pour chaque doublon, choisir la version la plus complète et à jour.
2. En cas de données contradictoires, privilégier:
   - La source la plus récente
   - Le fichier enrichi plutôt que l'index simple
   - Les données contenant plus d'informations détaillées

3. Après résolution, mettre à jour l'index unifié et supprimer les doublons.
  
`;

  await writeFile(CONFIG.outputPath, report);
  return report;
}

// Fonction principale
async function main() {
  console.log('Démarrage de la détection des doublons...');
  
  // Analyser chaque type de contenu
  const colsDuplicates = await analyzeContentType('cols', FILES_TO_SCAN.cols);
  const nutritionDuplicates = await analyzeContentType('nutrition', FILES_TO_SCAN.nutrition);
  const trainingDuplicates = await analyzeContentType('training', FILES_TO_SCAN.training);
  
  // Fusionner tous les doublons
  const allDuplicates = [
    ...colsDuplicates,
    ...nutritionDuplicates,
    ...trainingDuplicates
  ];
  
  // Génération du rapport
  await generateReport(allDuplicates);
  
  console.log(`Détection terminée. ${allDuplicates.length} doublons potentiels trouvés.`);
  console.log(`Rapport généré dans: ${CONFIG.outputPath}`);
}

// Exécution du script
main().catch(console.error);
