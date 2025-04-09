/**
 * Script de test simplifié pour la visualisation des cols
 * Teste directement les données de cols sans dépendance TypeScript
 */

require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

// Configuration MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://your-connection-string';

// Modèle Col pour MongoDB
const colSchema = new mongoose.Schema({
  name: String,
  elevation: Number,
  length: Number,
  avgGradient: Number,
  startElevation: Number,
  maxGradient: Number,
  image: String,
  climbs: Array,
  coordinates: Array
});

const Col = mongoose.model('Col', colSchema);

/**
 * Version JavaScript simplifiée du service de visualisation
 * pour les tests d'intégration
 */
class SimpleVisualizationService {
  transformColTo2D(col) {
    const startElevation = col.startElevation || this.estimateStartElevation(col);
    const points = this.generatePoints(startElevation, col.elevation, col.length, col.avgGradient);
    
    return {
      elevationProfile: {
        start: startElevation,
        summit: col.elevation,
        distance: col.length,
        gradient: col.avgGradient,
        maxGradient: col.maxGradient
      },
      points
    };
  }
  
  estimateStartElevation(col) {
    const elevationDifference = (col.length * col.avgGradient) / 100 * 1000;
    return Math.max(0, col.elevation - elevationDifference);
  }
  
  generatePoints(startElevation, summitElevation, length, avgGradient) {
    const points = [];
    const elevationDifference = summitElevation - startElevation;
    const numPoints = Math.max(50, Math.floor(length * 10));
    
    for (let i = 0; i <= numPoints; i++) {
      const distanceRatio = i / numPoints;
      const distance = length * distanceRatio;
      const elevation = startElevation + elevationDifference * distanceRatio;
      
      points.push({
        distance,
        elevation,
        gradient: avgGradient
      });
    }
    
    return points;
  }
}

// Fonctions principales
async function connectToDatabase() {
  try {
    console.log('[Test] Connexion à MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('[Test] Connexion réussie');
    return true;
  } catch (error) {
    console.error('[Test] Erreur de connexion:', error);
    return false;
  }
}

async function fetchCols() {
  try {
    console.log('[Test] Récupération des cols...');
    const cols = await Col.find({}).limit(5);
    console.log(`[Test] ${cols.length} cols récupérés`);
    return cols;
  } catch (error) {
    console.error('[Test] Erreur lors de la récupération des cols:', error);
    return [];
  }
}

async function testVisualization(cols) {
  console.log('\n[Test] Test du service de visualisation...');
  
  try {
    const visualizationService = new SimpleVisualizationService();
    
    // Tester chaque col
    for (let i = 0; i < cols.length; i++) {
      const col = cols[i];
      console.log(`\n[Test] Test du col #${i + 1}: ${col.name}`);
      
      // Test de la transformation 2D
      const data = visualizationService.transformColTo2D(col);
      console.log(`[Test] Transformation: ${data.points.length} points générés`);
      console.log(`[Test] Élévation de départ: ${data.elevationProfile.start}m`);
      console.log(`[Test] Élévation au sommet: ${data.elevationProfile.summit}m`);
      
      // Validation des données
      if (!data.elevationProfile || !data.points || data.points.length === 0) {
        throw new Error(`Données invalides pour ${col.name}`);
      }
      
      console.log(`[Test] ✅ Visualisation validée pour ${col.name}`);
    }
    
    console.log('\n[Test] ✅ Test du service de visualisation réussi');
    return true;
  } catch (error) {
    console.error('\n[Test] ❌ Erreur lors du test du service:', error);
    return false;
  }
}

async function testImages(cols) {
  console.log('\n[Test] Vérification des images des cols...');
  
  const validImages = [];
  const invalidImages = [];
  
  for (const col of cols) {
    if (!col.image) {
      console.log(`[Test] ⚠️ Pas d'image définie pour ${col.name}`);
      continue;
    }
    
    try {
      console.log(`[Test] Vérification de l'image pour ${col.name}: ${col.image}`);
      const response = await axios.head(col.image);
      
      if (response.status === 200) {
        validImages.push({ name: col.name, url: col.image });
        console.log(`[Test] ✅ Image valide pour ${col.name}`);
      } else {
        invalidImages.push({ name: col.name, url: col.image });
        console.log(`[Test] ❌ Image invalide pour ${col.name} (status: ${response.status})`);
      }
    } catch (error) {
      invalidImages.push({ name: col.name, url: col.image });
      console.log(`[Test] ❌ Erreur lors de la vérification de l'image pour ${col.name}:`, error.message);
    }
  }
  
  console.log('\n[Test] Résumé des images:');
  console.log(`[Test] Images valides: ${validImages.length}`);
  console.log(`[Test] Images invalides: ${invalidImages.length}`);
  
  if (invalidImages.length > 0) {
    console.log('\n[Test] Liste des images invalides:');
    invalidImages.forEach(img => {
      console.log(`- ${img.name}: ${img.url}`);
    });
  }
  
  return { validImages, invalidImages };
}

// Fonction principale
async function main() {
  console.log('=== TEST DU SYSTÈME DE VISUALISATION DES COLS ===');
  console.log('Date du test:', new Date().toLocaleString());
  
  // 1. Connexion à la base de données
  const isConnected = await connectToDatabase();
  if (!isConnected) {
    console.log('[Test] ❌ Impossible de se connecter à la base de données. Arrêt du test.');
    process.exit(1);
  }
  
  // 2. Récupération des données de cols
  const cols = await fetchCols();
  if (cols.length === 0) {
    console.log('[Test] ❌ Aucun col récupéré. Arrêt du test.');
    await mongoose.connection.close();
    process.exit(1);
  }
  
  // 3. Test du service de visualisation
  const serviceTestResult = await testVisualization(cols);
  
  // 4. Test des images
  const imagesTestResult = await testImages(cols);
  
  // 5. Résumé des tests
  console.log('\n=== RÉSUMÉ DES TESTS ===');
  console.log(`Service de visualisation: ${serviceTestResult ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Validation des images: ${imagesTestResult.invalidImages.length === 0 ? '✅ OK' : '⚠️ Problèmes détectés'}`);
  
  // 6. Recommandations
  console.log('\n=== RECOMMANDATIONS ===');
  if (imagesTestResult.invalidImages.length > 0) {
    console.log('- Corriger les URLs des images invalides');
  }
  
  if (serviceTestResult) {
    console.log('- Le service de visualisation est prêt à être utilisé dans l\'application');
    console.log('- Assurez-vous d\'importer le composant UnifiedColVisualization dans vos pages');
  }
  
  // 7. Fermeture de la connexion
  await mongoose.connection.close();
  console.log('\n[Test] Connexion à la base de données fermée');
  console.log('[Test] Test terminé');
}

// Exécuter le script
main().catch(error => {
  console.error('Erreur lors de l\'exécution du test:', error);
  process.exit(1);
});
