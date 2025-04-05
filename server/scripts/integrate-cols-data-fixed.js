// Intégration des données des cols européens dans le site web
const fs = require('fs');
const path = require('path');

// Chemins des fichiers de données
const part1Path = path.join(__dirname, '../../european-cols-data-part1-fixed.json');
const part2Path = path.join(__dirname, '../../european-cols-data-part2-fixed.json');
const part3Path = path.join(__dirname, '../../european-cols-data-part3-fixed.json');
const outputPath = path.join(__dirname, '../data/european-cols-enriched.json');

// Fonction pour fusionner les données des cols
async function mergeColsData() {
  try {
    // Lire les fichiers de données
    const part1Data = JSON.parse(fs.readFileSync(part1Path, 'utf8'));
    const part2Data = JSON.parse(fs.readFileSync(part2Path, 'utf8'));
    const part3Data = JSON.parse(fs.readFileSync(part3Path, 'utf8'));
    
    // Fusionner les données
    const mergedData = [...part1Data, ...part2Data, ...part3Data];
    
    // Trier les cols par altitude (du plus haut au plus bas)
    mergedData.sort((a, b) => b.altitude - a.altitude);
    
    // Ajouter des métadonnées
    const enrichedData = {
      metadata: {
        totalCols: mergedData.length,
        regions: [...new Set(mergedData.map(col => col.location.region))],
        countries: [...new Set(mergedData.map(col => col.location.country))],
        highestCol: mergedData[0].name,
        highestAltitude: mergedData[0].altitude,
        lastUpdated: new Date().toISOString()
      },
      cols: mergedData
    };
    
    // Écrire les données fusionnées dans le fichier de sortie
    fs.writeFileSync(outputPath, JSON.stringify(enrichedData, null, 2));
    
    console.log(`Données fusionnées avec succès. ${enrichedData.metadata.totalCols} cols européens intégrés.`);
    return enrichedData;
  } catch (error) {
    console.error('Erreur lors de la fusion des données des cols:', error);
    throw error;
  }
}

// Fonction pour générer les fichiers d'élévation manquants
async function generateElevationProfiles() {
  try {
    const enrichedData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    const elevationDir = path.join(__dirname, '../data/elevation');
    
    // Créer le répertoire d'élévation s'il n'existe pas
    if (!fs.existsSync(elevationDir)) {
      fs.mkdirSync(elevationDir, { recursive: true });
    }
    
    // Pour chaque col, générer des profils d'élévation s'ils n'existent pas
    for (const col of enrichedData.cols) {
      const colId = col.id;
      
      // Parcourir tous les côtés du col
      for (const side in col.climbData) {
        const sideData = col.climbData[side];
        const fileName = `${colId}-${side.replace(/Side$/, '').toLowerCase()}.json`;
        const filePath = path.join(elevationDir, fileName);
        
        // Vérifier si le fichier existe déjà
        if (!fs.existsSync(filePath)) {
          // Générer un profil d'élévation synthétique
          const elevationProfile = generateSyntheticElevationProfile(
            sideData.length,
            sideData.elevation,
            sideData.averageGradient,
            sideData.maxGradient
          );
          
          // Écrire le profil dans un fichier
          fs.writeFileSync(filePath, JSON.stringify(elevationProfile, null, 2));
          console.log(`Profil d'élévation généré pour ${col.name} (${side})`);
        }
      }
    }
    
    console.log('Génération des profils d\'élévation terminée.');
  } catch (error) {
    console.error('Erreur lors de la génération des profils d\'élévation:', error);
    throw error;
  }
}

// Fonction pour générer un profil d'élévation synthétique
function generateSyntheticElevationProfile(length, elevation, avgGradient, maxGradient) {
  // Nombre de points dans le profil (1 point tous les 100m)
  const numPoints = Math.ceil(length * 10);
  const profile = [];
  
  // Altitude de départ (altitude du sommet - dénivelé)
  let startAltitude = 0;
  
  // Générer des points avec une variation réaliste de la pente
  for (let i = 0; i < numPoints; i++) {
    const distance = (i / numPoints) * length;
    
    // Calculer un gradient variable pour ce segment
    // Plus élevé au milieu, plus faible au début et à la fin
    const normalizedPos = i / numPoints;
    const positionFactor = 4 * normalizedPos * (1 - normalizedPos); // Forme de cloche
    const segmentGradient = avgGradient + (maxGradient - avgGradient) * positionFactor * Math.random();
    
    // Calculer l'altitude pour ce point
    const altitudeGain = (distance / length) * elevation;
    const altitude = startAltitude + altitudeGain;
    
    // Ajouter une légère variation aléatoire pour plus de réalisme
    const randomVariation = Math.random() * 10 - 5; // Entre -5 et +5 mètres
    
    profile.push({
      distance: parseFloat(distance.toFixed(1)),
      altitude: parseFloat((altitude + randomVariation).toFixed(1)),
      gradient: parseFloat(segmentGradient.toFixed(1))
    });
  }
  
  // Ajouter le point final (sommet)
  profile.push({
    distance: parseFloat(length.toFixed(1)),
    altitude: parseFloat((startAltitude + elevation).toFixed(1)),
    gradient: 0
  });
  
  return profile;
}

// Fonction principale
async function main() {
  try {
    await mergeColsData();
    await generateElevationProfiles();
    console.log('Intégration des données des cols européens terminée avec succès.');
  } catch (error) {
    console.error('Erreur lors de l\'intégration des données:', error);
  }
}

// Exécuter la fonction principale
main();

module.exports = {
  mergeColsData,
  generateElevationProfiles
};
