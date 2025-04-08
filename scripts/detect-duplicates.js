/**
 * Script de détection des composants et services dupliqués
 * Velo-Altitude Cleanup Agent
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const SRC_DIR = path.resolve(__dirname, '../src');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const SERVICES_DIR = path.join(SRC_DIR, 'services');
const SERVER_SERVICES_DIR = path.join(SRC_DIR, 'server/services');

// Résultats
const results = {
  duplicateComponents: [],
  redundantServices: [],
  enhancedVersions: []
};

/**
 * Calcule un hash de contenu pour détecter les doublons
 */
function generateFileHash(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Ignorer les commentaires et espaces pour une meilleure détection
  const normalizedContent = content
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // Remove comments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  return crypto
    .createHash('md5')
    .update(normalizedContent)
    .digest('hex');
}

/**
 * Analyse les composants pour détecter les doublons et versions améliorées
 */
function analyzeComponents() {
  console.log('\n🔍 Analyse des composants...');
  
  // Récupérer tous les fichiers de composants
  const componentFiles = findFilesRecursive(COMPONENTS_DIR, ['.js', '.jsx', '.ts', '.tsx']);
  
  // Mapper les composants par nom de base (sans chemin)
  const componentsByName = new Map();
  const componentsByContent = new Map();
  
  componentFiles.forEach(file => {
    const baseName = path.basename(file, path.extname(file))
      .replace(/Enhanced|Advanced|Improved|New|Old|Legacy|V\d+/i, '')
      .toLowerCase();
    
    if (!componentsByName.has(baseName)) {
      componentsByName.set(baseName, []);
    }
    componentsByName.get(baseName).push(file);
    
    // Vérifier les doublons exacts par contenu
    const contentHash = generateFileHash(file);
    if (!componentsByContent.has(contentHash)) {
      componentsByContent.set(contentHash, []);
    }
    componentsByContent.get(contentHash).push(file);
  });
  
  // Trouver les doublons par contenu
  componentsByContent.forEach((files, hash) => {
    if (files.length > 1) {
      results.duplicateComponents.push({
        hash,
        files: files.map(f => path.relative(SRC_DIR, f)),
        isExactDuplicate: true
      });
    }
  });
  
  // Trouver les versions améliorées
  componentsByName.forEach((files, name) => {
    if (files.length > 1) {
      const enhanced = files.filter(f => {
        const baseName = path.basename(f);
        return /Enhanced|Advanced|Improved/i.test(baseName);
      });
      
      const regular = files.filter(f => {
        const baseName = path.basename(f);
        return !/Enhanced|Advanced|Improved|Legacy|Old/i.test(baseName);
      });
      
      const legacy = files.filter(f => {
        const baseName = path.basename(f);
        return /Legacy|Old/i.test(baseName);
      });
      
      if (enhanced.length > 0 && (regular.length > 0 || legacy.length > 0)) {
        results.enhancedVersions.push({
          componentName: name,
          enhanced: enhanced.map(f => path.relative(SRC_DIR, f)),
          regular: regular.map(f => path.relative(SRC_DIR, f)),
          legacy: legacy.map(f => path.relative(SRC_DIR, f))
        });
      } else if (!results.duplicateComponents.some(dc => 
        dc.files.some(f => files.includes(f)))
      ) {
        // Ajouter aux doublons si pas déjà détecté comme exact duplicate
        results.duplicateComponents.push({
          componentName: name,
          files: files.map(f => path.relative(SRC_DIR, f)),
          isExactDuplicate: false
        });
      }
    }
  });
}

/**
 * Analyse les services pour détecter les redondances
 */
function analyzeServices() {
  console.log('\n🔍 Analyse des services...');
  
  // Services à rechercher
  const serviceCategories = [
    {
      name: 'API Services',
      patterns: ['api', 'apimanager', 'apiservice']
    },
    {
      name: 'Weather Services',
      patterns: ['weather', 'meteo', 'forecast']
    },
    {
      name: 'Strava Services',
      patterns: ['strava']
    },
    {
      name: 'Monitoring Services',
      patterns: ['monitor', 'analytics', 'tracking']
    }
  ];
  
  const serviceFiles = [
    ...findFilesRecursive(SERVICES_DIR, ['.js', '.jsx', '.ts', '.tsx']),
    ...findFilesRecursive(SERVER_SERVICES_DIR, ['.js', '.jsx', '.ts', '.tsx'])
  ];
  
  // Catégoriser les services
  serviceCategories.forEach(category => {
    const matchingServices = serviceFiles.filter(file => {
      const filename = path.basename(file).toLowerCase();
      return category.patterns.some(pattern => filename.includes(pattern));
    });
    
    if (matchingServices.length > 1) {
      results.redundantServices.push({
        category: category.name,
        services: matchingServices.map(f => path.relative(SRC_DIR, f))
      });
    }
  });
}

/**
 * Trouve tous les fichiers récursivement
 */
function findFilesRecursive(dir, extensions) {
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️ Directory doesn't exist: ${dir}`);
    return [];
  }
  
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(findFilesRecursive(filePath, extensions));
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

/**
 * Génère un rapport de nettoyage avec recommandations
 */
function generateCleanupReport() {
  console.log('\n📊 RAPPORT DE NETTOYAGE - VELO-ALTITUDE\n');
  
  // Rapport des composants dupliqués
  if (results.duplicateComponents.length > 0) {
    console.log(`\n🔄 COMPOSANTS DUPLIQUÉS: ${results.duplicateComponents.length}`);
    results.duplicateComponents.forEach(duplicate => {
      console.log(`\n  ${duplicate.isExactDuplicate ? '⚠️ Doublons exacts' : '⚠️ Doublons probables'}: ${duplicate.componentName || ''}`);
      duplicate.files.forEach(file => {
        console.log(`    - ${file}`);
      });
    });
  } else {
    console.log('✅ Aucun composant dupliqué détecté');
  }
  
  // Rapport des versions améliorées
  if (results.enhancedVersions.length > 0) {
    console.log(`\n🔄 VERSIONS AMÉLIORÉES: ${results.enhancedVersions.length}`);
    results.enhancedVersions.forEach(version => {
      console.log(`\n  ⚙️ Composant: ${version.componentName}`);
      console.log('    Versions améliorées:');
      version.enhanced.forEach(file => {
        console.log(`      ✅ ${file} [GARDER]`);
      });
      console.log('    Versions standard:');
      version.regular.forEach(file => {
        console.log(`      ❌ ${file} [SUPPRIMER]`);
      });
      if (version.legacy.length > 0) {
        console.log('    Versions obsolètes:');
        version.legacy.forEach(file => {
          console.log(`      ❌ ${file} [SUPPRIMER]`);
        });
      }
    });
  }
  
  // Rapport des services redondants
  if (results.redundantServices.length > 0) {
    console.log(`\n🔄 SERVICES REDONDANTS: ${results.redundantServices.length}`);
    results.redundantServices.forEach(category => {
      console.log(`\n  ⚙️ Catégorie: ${category.category}`);
      console.log('    Services:');
      category.services.forEach(service => {
        console.log(`      - ${service}`);
      });
      console.log('    ➡️ Recommandation: Consolider en un service unifié');
    });
  } else {
    console.log('✅ Aucun service redondant détecté');
  }
  
  // Enregistrer le rapport dans un fichier
  const reportData = {
    date: new Date().toISOString(),
    results
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'cleanup-report.json'),
    JSON.stringify(reportData, null, 2)
  );
  
  console.log('\n✅ Rapport sauvegardé dans cleanup-report.json');
}

/**
 * Fonction principale
 */
function main() {
  console.log('🚀 VELO-ALTITUDE CLEANUP AGENT');
  console.log('Analyse du code pour détecter les redondances et doublons...');
  
  try {
    analyzeComponents();
    analyzeServices();
    generateCleanupReport();
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  }
}

// Exécuter le script
main();
