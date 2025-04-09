const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function verifyDependencies() {
  console.log('\n=== VÉRIFICATION DES DÉPENDANCES ===\n');

  // 1. Vérifier les versions installées
  console.log('📦 Versions installées :');
  const packageJson = require('../package.json');
  const dependencies = {
    react: packageJson.dependencies.react,
    'react-dom': packageJson.dependencies['react-dom'],
    '@react-three/drei': packageJson.dependencies['@react-three/drei'],
    '@react-three/fiber': packageJson.dependencies['@react-three/fiber'],
    '@mui/material': packageJson.dependencies['@mui/material'],
    '@emotion/react': packageJson.dependencies['@emotion/react'],
    '@emotion/styled': packageJson.dependencies['@emotion/styled'],
    'three': packageJson.dependencies['three']
  };
  console.table(dependencies);

  // 2. Tester la présence des composants critiques
  console.log('\n🔨 Vérification des composants critiques :');
  const criticalComponents = [
    // Composants de visualisation principaux
    'src/components/visualization/UnifiedColVisualization.jsx',
    'src/components/visualization/EnhancedColVisualization3D.tsx',
    'src/components/visualization/ElevationViewer3D.tsx',
    // Composants météo
    'src/services/visualization/weather/Weather3DEffects.ts',
    'src/services/visualization/weather/WeatherGPUComputation.ts',
    'src/services/visualization/weather/WeatherVisualizationService.ts',
    'src/examples/WeatherVisualizationExample.tsx',
    // Composants UI
    'src/components/weather/WeatherWidget.jsx',
    'src/components/weather/WeatherDashboard.js'
  ];

  for (const component of criticalComponents) {
    try {
      if (fs.existsSync(path.join(__dirname, '..', component))) {
        console.log(`✅ ${path.basename(component)} existe`);
      } else {
        console.log(`⚠️ ${path.basename(component)} non trouvé à l'emplacement spécifié`);
      }
    } catch (err) {
      console.error(`❌ Erreur lors de la vérification de ${component}:`, err);
    }
  }

  // 3. Vérification des fichiers de configuration
  console.log('\n⚙️ Vérification des fichiers de configuration :');
  const configFiles = [
    'src/config/visualization/weatherPresets.ts',
    'src/config/visualization/managers/WeatherTransitionManager.ts',
    'src/config/visualization/types.ts'
  ];

  for (const file of configFiles) {
    try {
      if (fs.existsSync(path.join(__dirname, '..', file))) {
        console.log(`✅ ${path.basename(file)} existe`);
      } else {
        console.log(`⚠️ ${path.basename(file)} non trouvé`);
      }
    } catch (err) {
      console.error(`❌ Erreur lors de la vérification de ${file}:`, err);
    }
  }

  // 4. Vérification des services météo
  console.log('\n🌦️ Vérification des services météo :');
  const weatherServices = [
    'src/services/weather/enhanced-weather-service.ts',
    'src/services/weather/unified-weather-service.js',
    'src/services/cache/WeatherCache.ts'
  ];

  for (const service of weatherServices) {
    try {
      if (fs.existsSync(path.join(__dirname, '..', service))) {
        console.log(`✅ ${path.basename(service)} existe`);
      } else {
        console.log(`⚠️ ${path.basename(service)} non trouvé`);
      }
    } catch (err) {
      console.error(`❌ Erreur lors de la vérification de ${service}:`, err);
    }
  }

  // 5. Vérification de la compatibilité GPU
  console.log('\n🖥️ Vérification des fichiers liés au GPU :');
  const gpuFiles = [
    'src/services/visualization/weather/WeatherGPUComputation.ts',
    'src/config/visualization/types.ts'
  ];

  for (const file of gpuFiles) {
    try {
      if (fs.existsSync(path.join(__dirname, '..', file))) {
        console.log(`✅ ${path.basename(file)} existe`);
      } else {
        console.log(`⚠️ ${path.basename(file)} non trouvé`);
      }
    } catch (err) {
      console.error(`❌ Erreur lors de la vérification de ${file}:`, err);
    }
  }

  // 6. Tester le package.json pour les scripts
  console.log('\n📜 Vérification des scripts dans package.json :');
  const requiredScripts = ['build', 'build:fast', 'start', 'dev'];
  for (const script of requiredScripts) {
    if (packageJson.scripts[script]) {
      console.log(`✅ Script "${script}" présent`);
    } else {
      console.log(`❌ Script "${script}" manquant`);
    }
  }

  // 7. Vérifier les peer dependencies
  console.log('\n🔍 Vérification des peer dependencies :');
  try {
    execSync('npm ls react react-dom @react-three/drei @react-three/fiber @mui/material --depth=0', { stdio: 'inherit' });
    console.log('✅ Vérification des peer dependencies terminée');
  } catch (err) {
    console.warn('⚠️ Avertissements de peer dependencies (non bloquant)');
  }

  // 8. Résumé
  console.log('\n✅ Vérification des dépendances terminée !');
}

verifyDependencies().catch(err => {
  console.error('❌ Erreur lors de la vérification des dépendances:', err);
  process.exit(1);
});
