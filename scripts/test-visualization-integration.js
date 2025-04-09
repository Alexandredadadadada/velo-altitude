/**
 * Script de test pour la visualisation des cols
 * Vérifie l'intégration complète du système de visualisation
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { JSDOM } = require('jsdom');
const { UnifiedColVisualization } = require('../src/services/visualization/UnifiedColVisualization');

// Configuration de l'environnement de test
const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = window;
global.document = window.document;

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

// Connexion MongoDB
async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://your-connection-string';
    console.log('[Test] Connexion à MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('[Test] Connexion réussie');
    return true;
  } catch (error) {
    console.error('[Test] Erreur de connexion:', error);
    return false;
  }
}

// Récupérer les données des cols
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

// Test du service de visualisation
function testVisualizationService(cols) {
  console.log('\n[Test] Test du service de visualisation...');
  
  try {
    const visualizationService = new UnifiedColVisualization();
    
    // Tester chaque col
    cols.forEach((col, index) => {
      console.log(`\n[Test] Test du col #${index + 1}: ${col.name}`);
      
      // Test de la transformation 2D
      const data2D = visualizationService.transformColTo2D(col);
      console.log(`[Test] Transformation 2D: ${data2D.points.length} points générés`);
      console.log(`[Test] Élévation de départ: ${data2D.elevationProfile.start}m`);
      console.log(`[Test] Élévation au sommet: ${data2D.elevationProfile.summit}m`);
      console.log(`[Test] Distance: ${data2D.elevationProfile.distance}km`);
      console.log(`[Test] Pente moyenne: ${data2D.elevationProfile.gradient}%`);
      
      // Test de la transformation 3D
      const data3D = visualizationService.transformColTo3D(col);
      console.log(`[Test] Transformation 3D: ${data3D.terrainData.vertices.length / 3} vertices générés`);
      
      // Validation élémentaire des données
      if (!data2D.elevationProfile || !data2D.points || data2D.points.length === 0) {
        throw new Error(`Données 2D invalides pour ${col.name}`);
      }
      
      if (!data3D.terrainData || !data3D.terrainData.vertices || data3D.terrainData.vertices.length === 0) {
        throw new Error(`Données 3D invalides pour ${col.name}`);
      }
      
      console.log(`[Test] ✅ Visualisation validée pour ${col.name}`);
    });
    
    console.log('\n[Test] ✅ Test du service de visualisation réussi');
    return true;
  } catch (error) {
    console.error('\n[Test] ❌ Erreur lors du test du service:', error);
    return false;
  }
}

// Test des images
async function testImages(cols) {
  console.log('\n[Test] Vérification des images des cols...');
  
  try {
    const axios = require('axios');
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
    
    return invalidImages.length === 0;
  } catch (error) {
    console.error('\n[Test] ❌ Erreur lors du test des images:', error);
    return false;
  }
}

// Test de performance
function testPerformance(cols) {
  console.log('\n[Test] Test de performance...');
  
  try {
    const visualizationService = new UnifiedColVisualization();
    const iterations = 100;
    
    // Test de performance du service 2D
    console.log(`[Test] Test de performance pour la visualisation 2D (${iterations} itérations)...`);
    const startTime2D = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      const colIndex = i % cols.length;
      visualizationService.transformColTo2D(cols[colIndex]);
    }
    
    const duration2D = Date.now() - startTime2D;
    const average2D = duration2D / iterations;
    console.log(`[Test] Performance 2D: ${duration2D}ms total, ${average2D.toFixed(2)}ms par col`);
    
    // Test de performance du service 3D
    console.log(`[Test] Test de performance pour la visualisation 3D (${iterations} itérations)...`);
    const startTime3D = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      const colIndex = i % cols.length;
      visualizationService.transformColTo3D(cols[colIndex]);
    }
    
    const duration3D = Date.now() - startTime3D;
    const average3D = duration3D / iterations;
    console.log(`[Test] Performance 3D: ${duration3D}ms total, ${average3D.toFixed(2)}ms par col`);
    
    // Résumé et recommandations
    console.log('\n[Test] Résumé de performance:');
    console.log(`[Test] - Visualisation 2D: ${average2D.toFixed(2)}ms par col`);
    console.log(`[Test] - Visualisation 3D: ${average3D.toFixed(2)}ms par col`);
    
    // Évaluation
    let recommendedMode;
    
    if (average3D < 50) {
      recommendedMode = 'terrain-3d';
      console.log('[Test] ✅ Performance excellente: Le mode 3D est recommandé pour tous les appareils.');
    } else if (average3D < 150) {
      recommendedMode = 'auto';
      console.log('[Test] ✅ Performance correcte: Le mode adaptatif est recommandé (3D sur desktop, 2D sur mobile).');
    } else {
      recommendedMode = 'profile-2d';
      console.log('[Test] ⚠️ Performance limitée: Le mode 2D est recommandé pour garantir une bonne expérience.');
    }
    
    return {
      average2D,
      average3D,
      recommendedMode
    };
  } catch (error) {
    console.error('\n[Test] ❌ Erreur lors du test de performance:', error);
    return null;
  }
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
  const serviceTestResult = testVisualizationService(cols);
  
  // 4. Test des images
  const imagesTestResult = await testImages(cols);
  
  // 5. Test de performance
  const performanceResult = testPerformance(cols);
  
  // 6. Résumé des tests
  console.log('\n=== RÉSUMÉ DES TESTS ===');
  console.log(`Service de visualisation: ${serviceTestResult ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Validation des images: ${imagesTestResult ? '✅ OK' : '⚠️ Problèmes détectés'}`);
  console.log(`Performance: ${performanceResult ? '✅ OK' : '⚠️ Non évaluée'}`);
  
  if (performanceResult) {
    console.log(`Mode recommandé: ${performanceResult.recommendedMode}`);
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
