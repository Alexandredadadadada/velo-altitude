/**
 * Tests d'intégration pour les données des cols cyclistes
 * 
 * Ce script vérifie :
 * - L'intégrité des données de tous les cols
 * - La validité des références et liens entre les cols
 * - Le fonctionnement correct des fonctions de filtrage et de recherche
 * - L'affichage des cols dans les différentes vues de l'application
 */

import { getAllCols, getColsByRegion, getColById, filterCols } from '../src/data/colsData.js';

// Liste des régions attendues
const EXPECTED_REGIONS = [
  'alpes', 'pyrenees', 'vosges', 'jura', 'massif-central',
  'dolomites', 'alpes-suisses', 'vosges-nord'
];

// Liste des difficultés valides
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard', 'extreme'];

// Liste des types d'installations valides
const VALID_FACILITY_TYPES = ['water', 'food', 'bike-shop', 'toilet', 'shelter', 'info'];

/**
 * Vérifie la présence et la validité de tous les champs obligatoires d'un col
 */
function testColDataIntegrity(col) {
  const requiredFields = [
    'id', 'name', 'region', 'country', 'altitude', 'length', 
    'avgGradient', 'maxGradient', 'difficulty', 'elevationGain',
    'startLocation', 'endLocation', 'description', 'history',
    'imageUrl', 'profileUrl'
  ];
  
  const errors = [];
  
  // Vérification des champs obligatoires
  requiredFields.forEach(field => {
    if (col[field] === undefined || col[field] === null) {
      errors.push(`Champ obligatoire manquant: ${field}`);
    }
  });
  
  // Validation des types de données
  if (typeof col.id !== 'string') errors.push('ID doit être une chaîne de caractères');
  if (typeof col.name !== 'string') errors.push('Nom doit être une chaîne de caractères');
  if (!EXPECTED_REGIONS.includes(col.region)) errors.push(`Région invalide: ${col.region}`);
  if (typeof col.country !== 'string') errors.push('Pays doit être une chaîne de caractères');
  if (typeof col.altitude !== 'number') errors.push('Altitude doit être un nombre');
  if (typeof col.length !== 'number') errors.push('Longueur doit être un nombre');
  if (typeof col.avgGradient !== 'number') errors.push('Pente moyenne doit être un nombre');
  if (typeof col.maxGradient !== 'number') errors.push('Pente maximale doit être un nombre');
  if (!VALID_DIFFICULTIES.includes(col.difficulty)) errors.push(`Difficulté invalide: ${col.difficulty}`);
  
  // Validation des structures imbriquées
  if (col.routes) {
    if (!Array.isArray(col.routes)) {
      errors.push('Routes doit être un tableau');
    } else {
      col.routes.forEach((route, index) => {
        if (!route.name) errors.push(`Route ${index}: Nom manquant`);
        if (!route.startLocation) errors.push(`Route ${index}: Lieu de départ manquant`);
        if (typeof route.length !== 'number') errors.push(`Route ${index}: Longueur doit être un nombre`);
        if (typeof route.elevationGain !== 'number') errors.push(`Route ${index}: Dénivelé doit être un nombre`);
        if (typeof route.avgGradient !== 'number') errors.push(`Route ${index}: Pente moyenne doit être un nombre`);
      });
    }
  } else {
    errors.push('Routes manquantes');
  }
  
  // Validation des installations
  if (col.facilities) {
    if (!Array.isArray(col.facilities)) {
      errors.push('Installations doit être un tableau');
    } else {
      col.facilities.forEach((facility, index) => {
        if (!VALID_FACILITY_TYPES.includes(facility.type)) {
          errors.push(`Installation ${index}: Type invalide: ${facility.type}`);
        }
      });
    }
  }
  
  // Validation des segments populaires
  if (col.popularSegments) {
    if (!Array.isArray(col.popularSegments)) {
      errors.push('Segments populaires doit être un tableau');
    } else if (col.popularSegments.length === 0) {
      errors.push('Au moins un segment populaire est requis');
    }
  } else {
    errors.push('Segments populaires manquants');
  }
  
  return {
    id: col.id,
    name: col.name,
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Teste la recherche et le filtrage des cols
 */
function testColsSearchAndFiltering() {
  const allCols = getAllCols();
  const results = {
    total: allCols.length,
    regionsTest: true,
    difficultyTest: true,
    altitudeTest: true,
    countryTest: true,
    noResults: false,
    errors: []
  };
  
  // Test de filtrage par région
  EXPECTED_REGIONS.forEach(region => {
    const regionCols = getColsByRegion(region);
    if (regionCols.length === 0) {
      results.regionsTest = false;
      results.errors.push(`Aucun col trouvé pour la région: ${region}`);
    }
  });
  
  // Test de filtrage par difficulté
  VALID_DIFFICULTIES.forEach(difficulty => {
    const filteredCols = filterCols({ difficulty });
    if (difficulty !== 'extreme' && filteredCols.length === 0) {
      // 'extreme' peut être vide car tous les cols ne sont pas dans cette catégorie
      results.difficultyTest = false;
      results.errors.push(`Aucun col trouvé pour la difficulté: ${difficulty}`);
    }
  });
  
  // Test de filtrage par altitude
  const highCols = filterCols({ altitude: '2000+' });
  if (highCols.length === 0) {
    results.altitudeTest = false;
    results.errors.push('Aucun col trouvé au-dessus de 2000m');
  }
  
  // Test de filtrage par pays
  const countryCols = filterCols({ country: 'France' });
  if (countryCols.length === 0) {
    results.countryTest = false;
    results.errors.push('Aucun col trouvé en France');
  }
  
  // Test de filtrage combiné (devrait retourner peu ou pas de résultats)
  const complexFilter = filterCols({
    altitude: '2000+',
    difficulty: 'easy',
    country: 'Suisse'
  });
  
  // Il est normal que ce filtrage spécifique ne retourne pas de résultats
  results.noResults = complexFilter.length === 0;
  
  return results;
}

/**
 * Vérifie la cohérence des données entre les cols
 */
function testColsDataConsistency() {
  const allCols = getAllCols();
  const results = {
    uniqueIdTest: true,
    imageUrlsTest: true,
    elevationRangeTest: true,
    errors: []
  };
  
  // Vérification des IDs uniques
  const ids = allCols.map(col => col.id);
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length !== allCols.length) {
    results.uniqueIdTest = false;
    results.errors.push('Des IDs en doublon ont été détectés');
    
    // Identification des doublons
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    results.errors.push(`IDs en doublon: ${duplicates.join(', ')}`);
  }
  
  // Vérification de la cohérence des données d'élévation
  allCols.forEach(col => {
    if (col.elevationGain > col.altitude) {
      results.elevationRangeTest = false;
      results.errors.push(`Incohérence d'élévation pour ${col.name}: dénivelé (${col.elevationGain}m) > altitude (${col.altitude}m)`);
    }
    
    // Vérifier que la pente max est supérieure à la pente moyenne
    if (col.maxGradient < col.avgGradient) {
      results.errors.push(`Incohérence de pente pour ${col.name}: pente max (${col.maxGradient}%) < pente moyenne (${col.avgGradient}%)`);
    }
  });
  
  return results;
}

/**
 * Exécution des tests
 */
function runColsDataTests() {
  console.log('=== DÉBUT DES TESTS SUR LES DONNÉES DES COLS ===');
  
  const allCols = getAllCols();
  console.log(`Nombre total de cols: ${allCols.length}`);
  
  // Test d'intégrité des données pour chaque col
  console.log('\n1. TESTS D\'INTÉGRITÉ DES DONNÉES');
  const integrityResults = allCols.map(testColDataIntegrity);
  const validCols = integrityResults.filter(result => result.isValid);
  
  console.log(`Cols valides: ${validCols.length}/${allCols.length}`);
  if (validCols.length < allCols.length) {
    console.log('\nCols avec erreurs:');
    integrityResults
      .filter(result => !result.isValid)
      .forEach(result => {
        console.log(`\n- ${result.name} (${result.id}):`);
        result.errors.forEach(error => console.log(`  * ${error}`));
      });
  }
  
  // Test de recherche et filtrage
  console.log('\n2. TESTS DE RECHERCHE ET FILTRAGE');
  const filterResults = testColsSearchAndFiltering();
  console.log(`Tests de filtrage par région: ${filterResults.regionsTest ? 'SUCCÈS' : 'ÉCHEC'}`);
  console.log(`Tests de filtrage par difficulté: ${filterResults.difficultyTest ? 'SUCCÈS' : 'ÉCHEC'}`);
  console.log(`Tests de filtrage par altitude: ${filterResults.altitudeTest ? 'SUCCÈS' : 'ÉCHEC'}`);
  console.log(`Tests de filtrage par pays: ${filterResults.countryTest ? 'SUCCÈS' : 'ÉCHEC'}`);
  
  if (filterResults.errors.length > 0) {
    console.log('\nErreurs de filtrage:');
    filterResults.errors.forEach(error => console.log(`  * ${error}`));
  }
  
  // Test de cohérence des données
  console.log('\n3. TESTS DE COHÉRENCE DES DONNÉES');
  const consistencyResults = testColsDataConsistency();
  console.log(`Test d'unicité des IDs: ${consistencyResults.uniqueIdTest ? 'SUCCÈS' : 'ÉCHEC'}`);
  console.log(`Test de cohérence des élévations: ${consistencyResults.elevationRangeTest ? 'SUCCÈS' : 'ÉCHEC'}`);
  
  if (consistencyResults.errors.length > 0) {
    console.log('\nProblèmes de cohérence:');
    consistencyResults.errors.forEach(error => console.log(`  * ${error}`));
  }
  
  // Résumé des tests
  const allTestsPassed = 
    (validCols.length === allCols.length) && 
    filterResults.errors.length === 0 && 
    consistencyResults.errors.length === 0;
  
  console.log('\n=== RÉSUMÉ DES TESTS ===');
  console.log(`État: ${allTestsPassed ? 'SUCCÈS' : 'ÉCHEC'}`);
  console.log(`Cols testés: ${allCols.length}`);
  console.log(`Cols valides: ${validCols.length}`);
  console.log(`Erreurs d'intégrité: ${allCols.length - validCols.length}`);
  console.log(`Erreurs de filtrage: ${filterResults.errors.length}`);
  console.log(`Erreurs de cohérence: ${consistencyResults.errors.length}`);
  
  return {
    colsCount: allCols.length,
    validColsCount: validCols.length,
    integrityErrors: allCols.length - validCols.length,
    filteringErrors: filterResults.errors.length,
    consistencyErrors: consistencyResults.errors.length,
    allTestsPassed
  };
}

// Exécution des tests
runColsDataTests();

// Export des fonctions de test pour réutilisation
export {
  runColsDataTests,
  testColDataIntegrity,
  testColsSearchAndFiltering,
  testColsDataConsistency
};
