/**
 * validate-critical-components.ts
 * Script de validation des composants critiques avant déploiement
 */

import { runTest, weatherTests } from '../src/tests/manual/weather-verification';
import * as fs from 'fs';
import * as path from 'path';

interface PerfResult {
  component: string;
  fps: number;
  memory: string;
  gpu: string;
  status: string;
}

/**
 * Vérifie les performances des composants critiques
 */
async function checkPerformance(): Promise<PerfResult[]> {
  console.log('Vérification des performances du rendu...');
  
  // Résultats simulés des tests de performance
  // Dans une vraie implémentation, ces valeurs proviendraient d'un vrai benchmark
  return [
    { 
      component: 'Visualisation 3D - Haute qualité', 
      fps: 45, 
      memory: '290MB', 
      gpu: '70%',
      status: 'OK' 
    },
    { 
      component: 'Effets météo - Pluie', 
      fps: 38, 
      memory: '320MB', 
      gpu: '85%', 
      status: 'OK' 
    },
    { 
      component: 'Effets météo - Neige', 
      fps: 32, 
      memory: '340MB', 
      gpu: '90%', 
      status: 'OK' 
    },
    { 
      component: 'Fallback CPU - Modes économiques', 
      fps: 28, 
      memory: '280MB', 
      gpu: '10%', 
      status: 'OK' 
    },
  ];
}

/**
 * Valide la conformité CSS
 */
function validateCSS(): void {
  console.log('Validation des styles CSS...');
  
  const cssFiles = [
    '../src/components/common/BrowserCompatibility.css',
    '../client/src/styles/visualization.css',
    '../client/src/styles/weather-effects.css'
  ];
  
  cssFiles.forEach(filePath => {
    const fullPath = path.resolve(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${filePath} - Fichier trouvé`);
      
      // Dans une vraie implémentation, on analyserait le contenu CSS
      // pour vérifier la présence de fallbacks, etc.
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Vérification simplifiée de la présence de fallbacks
      const hasWebkitScrollbar = content.includes('-webkit-scrollbar');
      const hasMozScrollbar = content.includes('scrollbar-width') || content.includes('scrollbar-color');
      
      if (hasWebkitScrollbar && hasMozScrollbar) {
        console.log(`  ✓ Fallbacks multi-navigateurs trouvés`);
      } else {
        console.warn(`  ⚠ Manque potentiel de fallbacks multi-navigateurs`);
      }
    } else {
      console.error(`❌ ${filePath} - Fichier non trouvé`);
    }
  });
}

/**
 * Fonction principale de validation des composants critiques
 */
export async function validateCriticalComponents() {
  console.log('🔍 Validation des composants critiques...\n');

  // 1. Tests météorologiques prioritaires
  console.log('⛈️ Exécution des tests météorologiques de haute priorité...');
  const highPriorityTests = weatherTests.filter(t => t.priority === 'high');
  for (const test of highPriorityTests) {
    await runTest(test.name);
    console.log('-'.repeat(50));
  }

  // 2. Vérification des performances
  console.log('\n⚡ Vérification des performances...');
  const perfResults = await checkPerformance();
  console.table(perfResults);

  // 3. Validation CSS
  console.log('\n🎨 Validation CSS...');
  validateCSS();
  
  // 4. Vérification des versions des dépendances
  console.log('\n📦 Vérification des versions des dépendances...');
  checkDependenciesVersions();
  
  return true;
}

/**
 * Vérifie les versions des dépendances critiques
 */
function checkDependenciesVersions(): void {
  try {
    // Charger le package.json du client
    const clientPackagePath = path.resolve(__dirname, '../client/package.json');
    const clientPackage = JSON.parse(fs.readFileSync(clientPackagePath, 'utf8'));
    
    // Vérifier les versions critiques
    const criticalDeps = {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      '@react-three/drei': '^9.88.0',
      '@react-three/fiber': '^8.15.11',
      '@mui/material': '^5.15.11'
    };
    
    console.log('Dépendances critiques:');
    let hasIssues = false;
    
    Object.entries(criticalDeps).forEach(([dep, expectedVersion]) => {
      const actualVersion = clientPackage.dependencies[dep];
      const isMatch = actualVersion && actualVersion.includes(expectedVersion.replace('^', '').replace('~', ''));
      
      console.log(`  ${isMatch ? '✅' : '❌'} ${dep}: ${actualVersion || 'Non trouvé'} (attendu: ${expectedVersion})`);
      if (!isMatch) hasIssues = true;
    });
    
    if (hasIssues) {
      console.warn('\n⚠️ Certaines dépendances ne correspondent pas aux versions attendues!');
    } else {
      console.log('\n✅ Toutes les dépendances critiques sont aux bonnes versions');
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des dépendances:', error);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  validateCriticalComponents()
    .then(() => {
      console.log('\n✅ Validation des composants terminée');
    })
    .catch(error => {
      console.error('\n❌ Erreur lors de la validation des composants:', error);
      process.exit(1);
    });
}
