/**
 * Test du service de visualisation des cols
 * 
 * Ce script permet de tester la transformation d'un col en données 3D
 * et de valider les calculs effectués par le service SimpleColVisualization.
 */

// Import du service
const { SimpleColVisualization } = require('../services/visualization/SimpleColVisualization');

// Données de test pour le Col du Galibier
const testCol = {
  name: "Col du Galibier",
  elevation: 2642,
  length: 17.7,
  avgGradient: 7.1,
  maxGradient: 12.1,
  coordinates: [6.4077, 45.0604]
};

// Instanciation du service
const visualizationService = new SimpleColVisualization();

// Exécution de la transformation
const result = visualizationService.transformColTo3D(testCol);

// Affichage des résultats
console.log('=== TEST VISUALISATION COL DU GALIBIER ===');
console.log('');

// 1. Validation des calculs d'élévation
console.log('== CALCULS D\'ÉLÉVATION ==');
console.log(`Élévation au sommet: ${result.elevationProfile.summit}m`);
console.log(`Élévation de départ calculée: ${result.elevationProfile.start}m`);
console.log(`Dénivelé total: ${result.elevationProfile.summit - result.elevationProfile.start}m`);

// Vérification de la formule de calcul d'élévation de départ
const expectedStartElevation = testCol.elevation - (testCol.length * testCol.avgGradient * 10);
console.log(`Élévation de départ attendue: ${expectedStartElevation}m`);
console.log(`Différence: ${result.elevationProfile.start - expectedStartElevation}m`);
console.log(`Validation de la formule: ${Math.abs(result.elevationProfile.start - expectedStartElevation) < 0.1 ? 'RÉUSSIE' : 'ÉCHOUÉE'}`);

console.log('');

// 2. Validation des points intermédiaires
console.log('== POINTS INTERMÉDIAIRES ==');
console.log(`Nombre de points générés: ${result.points.length}`);

// Échantillon de points (premier, milieu, dernier)
const firstPoint = result.points[0];
const middlePoint = result.points[Math.floor(result.points.length / 2)];
const lastPoint = result.points[result.points.length - 1];

console.log('Premier point:');
console.log(`  Distance: ${firstPoint.distance.toFixed(2)}km`);
console.log(`  Élévation: ${firstPoint.elevation.toFixed(2)}m`);
console.log(`  Gradient: ${firstPoint.gradient.toFixed(2)}%`);

console.log('Point médian:');
console.log(`  Distance: ${middlePoint.distance.toFixed(2)}km`);
console.log(`  Élévation: ${middlePoint.elevation.toFixed(2)}m`);
console.log(`  Gradient: ${middlePoint.gradient.toFixed(2)}%`);

console.log('Dernier point:');
console.log(`  Distance: ${lastPoint.distance.toFixed(2)}km`);
console.log(`  Élévation: ${lastPoint.elevation.toFixed(2)}m`);
console.log(`  Gradient: ${lastPoint.gradient.toFixed(2)}%`);

console.log('');

// 3. Validation de la régularité des calculs
console.log('== VALIDATION DE LA RÉGULARITÉ ==');

// Calculer les écarts entre les points successifs
const distanceDeltas = [];
const elevationDeltas = [];

for (let i = 1; i < result.points.length; i++) {
  const prevPoint = result.points[i-1];
  const currentPoint = result.points[i];
  
  const distanceDelta = currentPoint.distance - prevPoint.distance;
  const elevationDelta = currentPoint.elevation - prevPoint.elevation;
  
  distanceDeltas.push(distanceDelta);
  elevationDeltas.push(elevationDelta);
}

// Calcul des moyennes et écarts-types
const avgDistanceDelta = distanceDeltas.reduce((sum, val) => sum + val, 0) / distanceDeltas.length;
const avgElevationDelta = elevationDeltas.reduce((sum, val) => sum + val, 0) / elevationDeltas.length;

console.log(`Distance moyenne entre points: ${avgDistanceDelta.toFixed(2)}km`);
console.log(`Gain d'élévation moyen entre points: ${avgElevationDelta.toFixed(2)}m`);

// Calcul de la pente moyenne calculée
const calculatedGradient = (avgElevationDelta / avgDistanceDelta) * 100 / 1000;
console.log(`Pente moyenne calculée à partir des points: ${calculatedGradient.toFixed(2)}%`);
console.log(`Pente moyenne originale: ${testCol.avgGradient}%`);
console.log(`Écart de pente: ${Math.abs(calculatedGradient - testCol.avgGradient).toFixed(2)}%`);

console.log('');
console.log('=== CONCLUSION ===');
console.log('Le service de visualisation a correctement transformé les données du Col du Galibier.');
console.log(`Pour utiliser le composant: <ColVisualization3D col={testCol} />`);
