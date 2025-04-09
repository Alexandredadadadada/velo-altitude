/**
 * Tests pour le service et composant UnifiedColVisualization
 */

import { UnifiedColVisualization } from '../services/visualization/UnifiedColVisualization';

// Données de test
const testCol = {
  name: "Col du Test",
  elevation: 2000,
  length: 12.5,
  avgGradient: 7.5,
  startElevation: 800,
  maxGradient: 10.5,
  climbs: [
    { name: "Passage difficile", gradient: 12, length: 2, startDistance: 5 },
    { name: "Section finale", gradient: 9, length: 3, startDistance: 9 }
  ]
};

describe('UnifiedColVisualization Service', () => {
  let visualizationService;

  beforeEach(() => {
    visualizationService = new UnifiedColVisualization();
  });

  test('transformColTo2D génère un profil d\'élévation valide', () => {
    const result = visualizationService.transformColTo2D(testCol);
    
    // Validation de la structure
    expect(result).toHaveProperty('elevationProfile');
    expect(result).toHaveProperty('points');
    expect(Array.isArray(result.points)).toBe(true);
    
    // Validation des données d'élévation
    expect(result.elevationProfile.start).toEqual(testCol.startElevation);
    expect(result.elevationProfile.summit).toEqual(testCol.elevation);
    expect(result.elevationProfile.distance).toEqual(testCol.length);
    expect(result.elevationProfile.gradient).toEqual(testCol.avgGradient);
    
    // Validation des points générés
    expect(result.points.length).toBeGreaterThan(0);
    
    // Premier point à l'élévation de départ
    expect(result.points[0].distance).toBe(0);
    expect(result.points[0].elevation).toBeCloseTo(testCol.startElevation, 0);
    
    // Dernier point à l'élévation du sommet
    const lastPoint = result.points[result.points.length - 1];
    expect(lastPoint.distance).toBeCloseTo(testCol.length, 1);
    expect(lastPoint.elevation).toBeCloseTo(testCol.elevation, 0);
  });

  test('transformColTo3D génère des données de terrain', () => {
    const result = visualizationService.transformColTo3D(testCol);
    
    // Vérification que les données 2D sont présentes
    expect(result).toHaveProperty('elevationProfile');
    expect(result).toHaveProperty('points');
    
    // Vérification des données de terrain 3D
    expect(result).toHaveProperty('terrainData');
    expect(result.terrainData).toHaveProperty('vertices');
    expect(result.terrainData).toHaveProperty('indices');
    expect(result.terrainData).toHaveProperty('normals');
    expect(result.terrainData).toHaveProperty('uvs');
    
    // Vérification que les données sont des tableaux avec contenu
    expect(Array.isArray(result.terrainData.vertices)).toBe(true);
    expect(result.terrainData.vertices.length).toBeGreaterThan(0);
    expect(Array.isArray(result.terrainData.indices)).toBe(true);
    expect(result.terrainData.indices.length).toBeGreaterThan(0);
  });

  test('calcul correct du dénivelé', () => {
    const result = visualizationService.transformColTo2D(testCol);
    const elevationGain = result.elevationProfile.summit - result.elevationProfile.start;
    
    // Vérification que le dénivelé est cohérent avec les données
    expect(elevationGain).toEqual(testCol.elevation - testCol.startElevation);
    
    // Test avec un col sans startElevation défini
    const colWithoutStart = { ...testCol };
    delete colWithoutStart.startElevation;
    
    const result2 = visualizationService.transformColTo2D(colWithoutStart);
    
    // Vérification que startElevation a été estimé correctement
    const expectedStartElevation = testCol.elevation - (testCol.length * testCol.avgGradient) / 100 * 1000;
    expect(result2.elevationProfile.start).toBeCloseTo(expectedStartElevation, 0);
  });

  test('intégration des sections spéciales (climbs)', () => {
    const result = visualizationService.transformColTo2D(testCol);
    
    // On trouve l'index des points correspondant aux climbs
    const firstClimbDistance = testCol.climbs[0].startDistance;
    const firstClimbIndex = result.points.findIndex(p => p.distance >= firstClimbDistance);
    
    // On vérifie que la section a un gradient plus élevé
    expect(result.points[firstClimbIndex].gradient).toBeGreaterThanOrEqual(testCol.avgGradient);
    
    // Test sans sections
    const colWithoutClimbs = { ...testCol, climbs: [] };
    const result2 = visualizationService.transformColTo2D(colWithoutClimbs);
    
    // Le profil devrait tout de même être généré
    expect(result2.points.length).toBeGreaterThan(0);
  });
});

// Note: Les tests du composant React nécessiteraient Jest avec un environnement DOM
// et des outils comme React Testing Library ou Enzyme
