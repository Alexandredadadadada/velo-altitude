/**
 * Script de régénération des profils d'élévation des cols
 * 
 * Usage: 
 *   npm run regenerate-cols -- --concurrency=3 --backup=true
 *   
 * Options:
 *   --concurrency=N     Nombre de cols à traiter en parallèle (défaut: 3)
 *   --backup=true|false Créer une sauvegarde avant la régénération (défaut: true)
 *   --validate=true|false Valider les données générées (défaut: true)
 *   --force=true|false  Forcer la régénération même si le cache existe (défaut: false)
 *   --test=true|false   Mode test sur un nombre limité de cols (défaut: false)
 */

import { ColRegenerationService } from '../src/services/col/ColRegenerationService';
import { RegenerationOptions } from '../src/services/col/types';

// Analyser les arguments de ligne de commande
function parseArgs(): RegenerationOptions {
  const args = process.argv.slice(2);
  
  const options: RegenerationOptions = {
    concurrency: 3,
    backup: true,
    validateData: true,
    forceRefresh: false,
    testMode: false
  };

  args.forEach(arg => {
    const [key, value] = arg.replace('--', '').split('=');
    
    switch (key) {
      case 'concurrency':
        options.concurrency = parseInt(value, 10);
        break;
      case 'backup':
        options.backup = value === 'true';
        break;
      case 'validate':
        options.validateData = value === 'true';
        break;
      case 'force':
        options.forceRefresh = value === 'true';
        break;
      case 'test':
        options.testMode = value === 'true';
        break;
    }
  });

  return options;
}

// Fonction principale
async function main() {
  try {
    console.log('=== Régénération des profils d\'élévation des cols ===');
    
    // Analyser les options
    const options = parseArgs();
    console.log('Options:', JSON.stringify(options, null, 2));
    
    // Créer le service de régénération
    const service = new ColRegenerationService();
    
    // Mode test ou régénération complète
    if (options.testMode) {
      console.log('Mode test - régénération de quelques cols seulement');
      
      // Récupérer les IDs des 3 cols les plus populaires
      const repository = service['repository'];
      const cols = await repository.getAll();
      cols.sort((a, b) => b.avgGradient - a.avgGradient);
      const testCols = cols.slice(0, 3);
      
      console.log(`Cols sélectionnés pour le test: ${testCols.map(c => c.name).join(', ')}`);
      
      for (const col of testCols) {
        console.log(`\nTest de régénération pour "${col.name}"`);
        const profile = await service.regenerateCol(col._id);
        
        console.log(`Profil généré avec ${profile.points.length} points et ${profile.segments.length} segments`);
        console.log(`Élévation: ${profile.minElevation}m - ${profile.maxElevation}m (dénivelé: ${profile.totalAscent}m)`);
        console.log(`Segments:`);
        
        profile.segments.forEach((segment, i) => {
          console.log(`  ${i+1}. ${segment.length.toFixed(1)}km @ ${segment.avgGradient.toFixed(1)}% (${segment.classification})`);
        });
      }
      
      console.log('\nTest terminé avec succès!');
      
    } else {
      // Régénération complète
      console.log('Démarrage de la régénération complète...');
      const results = await service.regenerateAll(options);
      
      console.log('\n=== Régénération terminée ===');
      console.log(`Cols traités: ${results.colsProcessed}`);
      console.log(`Erreurs: ${results.errors}`);
      console.log(`Cache hits: ${results.cacheHits}`);
      console.log(`Appels API: ${results.apiCalls}`);
      console.log(`Temps total: ${results.totalTime / 1000}s`);
      console.log(`Temps moyen par col: ${results.averageTimePerCol / 1000}s`);
      
      if (results.errors > 0) {
        console.log('\nDétails des erreurs:');
        results.errorDetails.forEach((error, i) => {
          console.log(`  ${i+1}. "${error.colName}": ${error.error}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Erreur lors de la régénération:', error);
    process.exit(1);
  }
}

// Exécuter le script
main().catch(console.error);
