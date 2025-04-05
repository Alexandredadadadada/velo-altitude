#!/usr/bin/env node

/**
 * Script de test complet du système de monitoring
 * Exécute tous les composants de monitoring et génère un rapport
 */
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const dotenv = require('dotenv');
const Table = require('cli-table3');
const colors = require('colors/safe');

// Charger les variables d'environnement
dotenv.config();

// Configuration
const outputDir = path.resolve(process.cwd(), 'logs');
const timestamp = new Date().toISOString().replace(/:/g, '-');
const reportFile = path.join(outputDir, `monitoring-test-${timestamp}.log`);

// Vérifier que le répertoire existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Log initial
const log = (message) => {
  const timestampedMessage = `[${new Date().toISOString()}] ${message}`;
  console.log(timestampedMessage);
  fs.appendFileSync(reportFile, timestampedMessage + '\n');
};

// Exécuter un script et retourner la sortie
const runScript = (scriptPath, args = []) => {
  return new Promise((resolve, reject) => {
    const command = `node ${scriptPath} ${args.join(' ')}`;
    log(`Exécution de: ${command}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log(colors.red(`Erreur d'exécution pour ${scriptPath}:`));
        log(error.message);
        return reject(error);
      }
      
      if (stderr) {
        log(colors.yellow(`Avertissements pour ${scriptPath}:`));
        log(stderr);
      }
      
      resolve(stdout);
    });
  });
};

// Fonction principale
async function main() {
  try {
    log(colors.cyan('=== TEST COMPLET DU SYSTÈME DE MONITORING ==='));
    log(`Date de début: ${new Date().toLocaleString()}`);
    
    // 1. Vérification des API
    log(colors.cyan('\n--- 1. VÉRIFICATION DE L\'ÉTAT DES API ---'));
    const apiHealthOutput = await runScript(path.join(__dirname, 'api-health-check.js'));
    log(apiHealthOutput);
    
    // 2. Vérification des quotas
    log(colors.cyan('\n--- 2. VÉRIFICATION DES QUOTAS D\'API ---'));
    const quotaCheckOutput = await runScript(path.join(__dirname, 'check-api-quotas.js'));
    log(quotaCheckOutput);
    
    // 3. Mettre à jour les conditions des cols
    log(colors.cyan('\n--- 3. MISE À JOUR DES CONDITIONS DES COLS ---'));
    
    // Importer dynamiquement le service
    const colsConditionsService = require('../services/cols-conditions-monitor.service');
    log('Lancement de la mise à jour des conditions des cols...');
    
    try {
      await colsConditionsService.updateAllColsConditions();
      log(colors.green('Mise à jour des conditions des cols terminée avec succès'));
      
      // Afficher les alertes des cols
      const alerts = colsConditionsService.getActiveAlerts();
      if (alerts.length > 0) {
        log(`${alerts.length} alertes actives pour les cols`);
        
        const alertsTable = new Table({
          head: ['Col', 'Type', 'Sévérité', 'Message'],
          colWidths: [15, 15, 10, 50]
        });
        
        alerts.forEach(alert => {
          alertsTable.push([
            alert.colName,
            alert.type,
            alert.severity,
            alert.message
          ]);
        });
        
        log(alertsTable.toString());
      } else {
        log('Aucune alerte active pour les cols');
      }
    } catch (error) {
      log(colors.red(`Erreur lors de la mise à jour des conditions: ${error.message}`));
    }
    
    // 4. Test de connexion à la base de données
    log(colors.cyan('\n--- 4. TEST DE CONNEXION À LA BASE DE DONNÉES ---'));
    try {
      const mongoose = require('mongoose');
      
      if (mongoose.connection.readyState !== 1) {
        log('Connexion à la base de données...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cycling-dashboard', {
          useNewUrlParser: true,
          useUnifiedTopology: true
        });
        log(colors.green('Connexion à la base de données établie'));
      } else {
        log(colors.green('Déjà connecté à la base de données'));
      }
      
      // Vérifier les modèles
      const models = Object.keys(mongoose.models);
      log(`Modèles disponibles: ${models.join(', ')}`);
      
      // Fermer la connexion
      await mongoose.connection.close();
      log('Connexion à la base de données fermée');
    } catch (error) {
      log(colors.red(`Erreur de connexion à la base de données: ${error.message}`));
    }
    
    // 5. Vérification des fichiers de logs
    log(colors.cyan('\n--- 5. VÉRIFICATION DES FICHIERS DE LOGS ---'));
    const logFiles = fs.readdirSync(outputDir)
      .filter(file => file.endsWith('.log'))
      .sort((a, b) => {
        const statsA = fs.statSync(path.join(outputDir, a));
        const statsB = fs.statSync(path.join(outputDir, b));
        return statsB.mtime.getTime() - statsA.mtime.getTime();
      });
    
    const logsTable = new Table({
      head: ['Fichier', 'Taille', 'Dernière modification'],
      colWidths: [40, 15, 30]
    });
    
    logFiles.slice(0, 10).forEach(file => {
      const stats = fs.statSync(path.join(outputDir, file));
      logsTable.push([
        file,
        `${(stats.size / 1024).toFixed(2)} KB`,
        stats.mtime.toLocaleString()
      ]);
    });
    
    log(`Derniers fichiers de logs (${logFiles.length} au total):`);
    log(logsTable.toString());
    
    // Résumé final
    log(colors.cyan('\n=== RÉSUMÉ DU TEST ==='));
    log(`Date de fin: ${new Date().toLocaleString()}`);
    log(`Rapport complet disponible dans: ${reportFile}`);
    log(colors.green('Test du système de monitoring terminé avec succès'));
    
  } catch (error) {
    log(colors.red(`Erreur lors du test: ${error.message}`));
    log(colors.red(error.stack));
    process.exit(1);
  }
}

// Exécuter le programme
main().catch(error => {
  console.error(colors.red(`Erreur fatale: ${error.message}`));
  process.exit(1);
});
