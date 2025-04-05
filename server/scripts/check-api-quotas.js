#!/usr/bin/env node

/**
 * Script de vérification des quotas d'API
 * Fournit un rapport sur l'utilisation des quotas d'API
 */
const apiQuotaMonitor = require('../services/api-quota-monitor.service');
const Table = require('cli-table3');
const colors = require('colors/safe');

// Fonction principale
async function main() {
  try {
    console.log(colors.cyan('\n=== Rapport des Quotas d\'API - Tableau de Bord Européen de Cyclisme ===\n'));
    
    // Récupérer les quotas de toutes les API
    const quotas = apiQuotaMonitor.checkAllQuotas();
    
    // Créer un tableau pour l'affichage des résultats
    const table = new Table({
      head: ['API', 'Utilisé', 'Restant', '% Utilisé', 'Réinitialisation', 'Statut'],
      colWidths: [15, 10, 10, 10, 20, 10]
    });
    
    // Ajouter les données de chaque API au tableau
    for (const [apiName, apiQuota] of Object.entries(quotas)) {
      let statusText = '';
      let used = apiQuota.used || 0;
      let usedPercent = apiQuota.percentUsed || 0;
      
      // Définir le statut en fonction du pourcentage utilisé
      if (usedPercent >= 90) {
        statusText = colors.red('CRITIQUE');
      } else if (usedPercent >= 70) {
        statusText = colors.yellow('ALERTE');
      } else {
        statusText = colors.green('OK');
      }
      
      // Formater l'heure de réinitialisation
      let resetTime = 'N/A';
      if (apiQuota.resetTime) {
        resetTime = new Date(apiQuota.resetTime).toLocaleString();
      }
      
      // Ajouter à la table
      table.push([
        apiName,
        used,
        apiQuota.remaining,
        `${usedPercent.toFixed(1)}%`,
        resetTime,
        statusText
      ]);
    }
    
    // Afficher le tableau
    console.log(table.toString());
    
    // Récupérer les alertes récentes
    const alerts = apiQuotaMonitor.getAlerts();
    
    if (alerts.length > 0) {
      console.log(colors.yellow('\n=== Alertes Récentes ===\n'));
      
      const alertsTable = new Table({
        head: ['API', 'Type', 'Message', 'Date'],
        colWidths: [15, 15, 40, 20]
      });
      
      alerts.forEach(alert => {
        alertsTable.push([
          alert.apiName,
          alert.type.replace('_', ' ').toUpperCase(),
          alert.message,
          new Date(alert.timestamp).toLocaleString()
        ]);
      });
      
      console.log(alertsTable.toString());
    } else {
      console.log(colors.green('\nAucune alerte active.'));
    }
    
    console.log('\nPour plus de détails, consultez le tableau de bord administrateur.');
  } catch (error) {
    console.error(colors.red('Erreur lors de la vérification des quotas:'), error);
    process.exit(1);
  }
}

// Exécuter le programme
main();
