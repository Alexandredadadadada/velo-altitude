/**
 * Script de nettoyage pour la préparation du build
 * Supprime les répertoires et fichiers temporaires avant le build
 */

const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const logger = console;

// Répertoires à nettoyer
const directoriesToClean = [
  path.resolve(__dirname, '../build'),
  path.resolve(__dirname, '../.cache'),
  path.resolve(__dirname, '../dist')
];

// Fonction de nettoyage principale
async function cleanDirectories() {
  logger.info('🧹 Nettoyage des répertoires avant build...');
  
  try {
    // Traiter chaque répertoire
    for (const dir of directoriesToClean) {
      if (fs.existsSync(dir)) {
        logger.info(`Suppression de ${dir}...`);
        await new Promise((resolve, reject) => {
          rimraf(dir, (error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
        logger.info(`✅ ${dir} supprimé avec succès`);
      } else {
        logger.info(`ℹ️ ${dir} n'existe pas, aucune action nécessaire`);
      }
    }
    
    logger.info('✅ Nettoyage terminé avec succès');
  } catch (error) {
    logger.error(`❌ Erreur lors du nettoyage: ${error.message}`);
    // Ne pas faire échouer le build à cause d'une erreur de nettoyage
    logger.info('⚠️ Poursuite du processus malgré l\'erreur de nettoyage');
  }
}

// Exécuter la fonction de nettoyage
cleanDirectories();
