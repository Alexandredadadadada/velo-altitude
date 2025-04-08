/**
 * Script de migration vers les services unifiés
 * 
 * Ce script:
 * 1. Identifie les importations des anciens services
 * 2. Modifie ces importations pour utiliser les nouveaux services unifiés
 * 3. Met à jour les références dans le code
 * 
 * Usage: node migrate-to-unified-services.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const SRC_DIR = path.resolve(__dirname, '../src');
const DRY_RUN = process.argv.includes('--dry-run');
const BACKUP_FILES = !process.argv.includes('--no-backup');

// Mappings des services à remplacer
const SERVICES_MAPPING = [
  {
    category: 'API Services',
    oldImports: [
      /import.*from ['"]\.\.\/services\/api-manager\.service(\.js)?['"]/,
      /import.*from ['"]\.\.\/services\/api-monitoring\.service(\.js)?['"]/,
      /import.*from ['"]\.\.\/services\/api-monitor\.service(\.js)?['"]/
    ],
    newImport: "import { UnifiedAPIService } from '../services/api/unified-api-service';",
    instanceReplacements: [
      { from: /new ApiManager\(/g, to: 'new UnifiedAPIService(' },
      { from: /new ApiMonitor\(/g, to: 'new UnifiedAPIService(' },
      { from: /ApiManager\./g, to: 'UnifiedAPIService.' },
      { from: /apiManager\./g, to: 'apiService.' },
      { from: /apiMonitor\./g, to: 'apiService.' }
    ]
  },
  {
    category: 'Weather Services',
    oldImports: [
      /import.*from ['"]\.\.\/services\/weather(\.js)?['"]/,
      /import.*from ['"]\.\.\/services\/weather-service(\.js)?['"]/,
      /import.*from ['"]\.\.\/services\/meteo(\.js)?['"]/
    ],
    newImport: "import UnifiedWeatherService from '../services/weather/unified-weather-service';",
    instanceReplacements: [
      { from: /new WeatherService\(/g, to: 'new UnifiedWeatherService(' },
      { from: /new MeteoService\(/g, to: 'new UnifiedWeatherService(' },
      { from: /weatherService\./g, to: 'weatherService.' },
      { from: /meteoService\./g, to: 'weatherService.' }
    ]
  },
  {
    category: 'Strava Services',
    oldImports: [
      /import.*from ['"]\.\.\/services\/strava(\.js)?['"]/,
      /import.*from ['"]\.\.\/services\/strava-service(\.js)?['"]/,
      /import.*from ['"]\.\.\/services\/strava-api(\.js)?['"]/
    ],
    newImport: "import UnifiedStravaService from '../services/strava/unified-strava-service';",
    instanceReplacements: [
      { from: /new StravaService\(/g, to: 'new UnifiedStravaService(' },
      { from: /new StravaApi\(/g, to: 'new UnifiedStravaService(' },
      { from: /stravaService\./g, to: 'stravaService.' },
      { from: /stravaApi\./g, to: 'stravaService.' }
    ]
  },
  {
    category: 'Monitoring Services',
    oldImports: [
      /import.*from ['"]\.\.\/services\/monitoring(\.js)?['"]/,
      /import.*from ['"]\.\.\/services\/analytics(\.js)?['"]/,
      /import.*from ['"]\.\.\/services\/tracker(\.js)?['"]/
    ],
    newImport: "import monitoringService, { usePerformanceMonitoring } from '../services/monitoring/unified-monitoring-service';",
    instanceReplacements: [
      { from: /new MonitoringService\(/g, to: 'monitoringService' },
      { from: /new Analytics\(/g, to: 'monitoringService' },
      { from: /new Tracker\(/g, to: 'monitoringService' },
      { from: /monitoringService\.trackEvent/g, to: 'monitoringService.trackUserEvent' },
      { from: /analytics\.track/g, to: 'monitoringService.trackUserEvent' },
      { from: /tracker\.log/g, to: 'monitoringService.log' }
    ]
  }
];

/**
 * Trouve et analyse tous les fichiers source
 */
async function analyzeSourceFiles() {
  console.log('\n🔍 Analyse des fichiers source...');
  
  const sourceFiles = glob.sync(`${SRC_DIR}/**/*.{js,jsx,ts,tsx}`, {
    ignore: ['**/node_modules/**', '**/build/**']
  });
  
  console.log(`📁 ${sourceFiles.length} fichiers trouvés`);
  
  let totalFilesToModify = 0;
  let modifiedFiles = 0;
  
  for (const file of sourceFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    let hasModifications = false;
    
    for (const serviceMapping of SERVICES_MAPPING) {
      // Vérifier si le fichier importe un ancien service
      const hasOldImports = serviceMapping.oldImports.some(regex => regex.test(content));
      
      if (hasOldImports) {
        // Remplacer les imports
        for (const oldImportRegex of serviceMapping.oldImports) {
          if (oldImportRegex.test(content)) {
            content = content.replace(oldImportRegex, serviceMapping.newImport);
            hasModifications = true;
          }
        }
        
        // Remplacer les instances et appels de méthodes
        for (const replacement of serviceMapping.instanceReplacements) {
          if (replacement.from.test(content)) {
            content = content.replace(replacement.from, replacement.to);
            hasModifications = true;
          }
        }
      }
    }
    
    if (hasModifications) {
      totalFilesToModify++;
      const relPath = path.relative(SRC_DIR, file);
      
      if (DRY_RUN) {
        console.log(`⚠️ Modifications nécessaires: ${relPath}`);
      } else {
        // Créer une sauvegarde si demandé
        if (BACKUP_FILES) {
          fs.writeFileSync(`${file}.bak`, originalContent);
        }
        
        // Écrire le nouveau contenu
        fs.writeFileSync(file, content);
        modifiedFiles++;
        console.log(`✅ Fichier mis à jour: ${relPath}`);
      }
    }
  }
  
  return { totalFilesToModify, modifiedFiles };
}

/**
 * Vérifie les fichiers inutiles qui peuvent être supprimés
 */
function findObsoleteFiles() {
  console.log('\n🔍 Recherche des fichiers obsolètes...');
  
  const obsoleteServices = [
    'api-manager.service.js',
    'api-monitoring.service.js',
    'api-monitor.service.js',
    'weather.service.js',
    'weather-service.js',
    'meteo.service.js',
    'strava.service.js',
    'strava-api.service.js',
    'monitoring.service.js',
    'analytics.service.js',
    'tracker.service.js'
  ];
  
  const serviceDirs = [
    path.join(SRC_DIR, 'services'),
    path.join(SRC_DIR, 'server/services')
  ];
  
  const obsoleteFiles = [];
  
  for (const dir of serviceDirs) {
    if (!fs.existsSync(dir)) continue;
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      if (obsoleteServices.includes(file)) {
        obsoleteFiles.push(path.join(dir, file));
      }
    }
  }
  
  return obsoleteFiles;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🚀 MIGRATION VERS LES SERVICES UNIFIÉS');
  console.log('=======================================');
  
  if (DRY_RUN) {
    console.log('⚠️ MODE SIMULATION: Aucun fichier ne sera modifié');
  }
  
  try {
    // Étape 1: Analyser les fichiers source
    const { totalFilesToModify, modifiedFiles } = await analyzeSourceFiles();
    
    // Étape 2: Trouver les fichiers obsolètes
    const obsoleteFiles = findObsoleteFiles();
    
    // Générer un rapport
    console.log('\n📊 RAPPORT DE MIGRATION:');
    console.log('------------------------');
    console.log(`Fichiers nécessitant des modifications: ${totalFilesToModify}`);
    
    if (!DRY_RUN) {
      console.log(`Fichiers modifiés avec succès: ${modifiedFiles}`);
    }
    
    console.log(`\nFichiers obsolètes détectés: ${obsoleteFiles.length}`);
    
    if (obsoleteFiles.length > 0) {
      console.log('\nFichiers pouvant être supprimés:');
      obsoleteFiles.forEach(file => {
        const relPath = path.relative(SRC_DIR, file);
        console.log(`- ${relPath}`);
      });
      
      // Créer un script pour supprimer ces fichiers
      const deleteScript = `#!/bin/bash
# Script de suppression des fichiers obsolètes
# Généré le ${new Date().toISOString()}

echo "Suppression des fichiers obsolètes..."

${obsoleteFiles.map(file => `rm "${file}"`).join('\n')}

echo "Done!"`;
      
      fs.writeFileSync(path.join(__dirname, 'delete-obsolete-files.sh'), deleteScript);
      console.log('\n✅ Script de suppression généré: delete-obsolete-files.sh');
    }
    
    console.log('\n✅ Analyse terminée!');
    
    if (DRY_RUN) {
      console.log('\n⚙️ Pour exécuter les modifications réelles, relancez sans --dry-run');
    }
    
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();
