/**
 * Utilitaires pour la validation API
 * 
 * Ce fichier contient des fonctions utilitaires pour la validation des API,
 * notamment pour générer et sauvegarder des rapports.
 */

import fs from 'fs';
import path from 'path';

/**
 * Sauvegarde un rapport de validation dans le dossier docs
 * 
 * @param {string} reportType - Type de rapport (ex: 'public-endpoints', 'auth', etc.)
 * @param {string} content - Contenu du rapport au format markdown
 */
export const saveValidationReport = (reportType, content) => {
  try {
    // En environnement Node.js
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      const docsDir = path.resolve(process.cwd(), '../../docs');
      const filename = `API_VALIDATION_${reportType.toUpperCase()}_${getDateString()}.md`;
      const filepath = path.join(docsDir, filename);
      
      // Vérifier si le dossier docs existe, sinon le créer
      if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
      }
      
      // Écrire le fichier
      fs.writeFileSync(filepath, content, 'utf8');
      console.log(`Rapport de validation sauvegardé dans: ${filepath}`);
      
      // Mettre à jour le rapport principal si nécessaire
      updateMainReport(docsDir, reportType, content);
      
      return filepath;
    } 
    // En environnement navigateur
    else if (typeof window !== 'undefined') {
      // Créer un blob et proposer le téléchargement
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `API_VALIDATION_${reportType.toUpperCase()}_${getDateString()}.md`;
      a.click();
      URL.revokeObjectURL(url);
      
      console.log(`Rapport de validation téléchargé: ${a.download}`);
      return a.download;
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du rapport:', error);
    return null;
  }
};

/**
 * Met à jour le rapport principal de validation API
 * 
 * @param {string} docsDir - Chemin vers le dossier docs
 * @param {string} reportType - Type de rapport mis à jour
 * @param {string} content - Contenu du rapport
 */
const updateMainReport = (docsDir, reportType, content) => {
  try {
    const mainReportPath = path.join(docsDir, 'API_VALIDATION_REPORT.md');
    
    // Si le rapport principal existe déjà, le mettre à jour
    if (fs.existsSync(mainReportPath)) {
      let mainReport = fs.readFileSync(mainReportPath, 'utf8');
      
      // Extraire la section "Endpoints Status Summary" du rapport principal
      const summaryMatch = mainReport.match(/## Endpoints Status Summary([\s\S]*?)(?=##|$)/);
      if (summaryMatch) {
        const summarySectionContent = summaryMatch[0];
        
        // Mettre à jour les statuts des endpoints testés
        let updatedSummarySection = summarySectionContent;
        
        // Analyser le nouveau rapport pour les résultats
        const lines = content.split('\n');
        const resultTableLines = lines.filter(line => line.includes('|') && (line.includes('✅') || line.includes('❌')));
        
        // Pour chaque ligne de résultat, mettre à jour le statut dans le rapport principal
        resultTableLines.forEach(line => {
          const match = line.match(/\| ([^|]+) \| ([^|]+) \|/);
          if (match) {
            const endpoint = match[1].trim();
            const status = match[2].includes('✅') ? '✅ Réussi' : '❌ Échoué';
            
            // Remplacer le statut dans le rapport principal
            const endpointRegex = new RegExp(`\\| ${endpoint} \\| .\\w+ Pending \\\|`);
            updatedSummarySection = updatedSummarySection.replace(endpointRegex, `| ${endpoint} | ${status} |`);
          }
        });
        
        // Remplacer la section dans le rapport principal
        mainReport = mainReport.replace(summarySectionContent, updatedSummarySection);
        
        // Écrire le rapport mis à jour
        fs.writeFileSync(mainReportPath, mainReport, 'utf8');
        console.log(`Rapport principal mis à jour avec les résultats des tests ${reportType}`);
      }
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rapport principal:', error);
  }
};

/**
 * Retourne une chaîne de date formatée pour les noms de fichiers
 * 
 * @returns {string} Date au format YYYY-MM-DD
 */
const getDateString = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/**
 * Génère un rapport sur les problèmes de sécurité API identifiés
 * 
 * @param {Array} securityIssues - Liste des problèmes de sécurité identifiés
 * @returns {string} Rapport au format markdown
 */
export const generateSecurityReport = (securityIssues) => {
  let report = `# Rapport de Sécurité API\n\n`;
  report += `## Date: ${new Date().toLocaleString()}\n\n`;
  report += `## Problèmes Identifiés\n\n`;
  
  if (securityIssues.length === 0) {
    report += `Aucun problème de sécurité n'a été identifié lors des tests.\n`;
  } else {
    securityIssues.forEach((issue, index) => {
      report += `### ${index + 1}. ${issue.title}\n\n`;
      report += `**Sévérité:** ${issue.severity}\n\n`;
      report += `**Description:** ${issue.description}\n\n`;
      report += `**Endpoint concerné:** ${issue.endpoint}\n\n`;
      report += `**Recommandation:** ${issue.recommendation}\n\n`;
      report += `---\n\n`;
    });
  }
  
  return report;
};

/**
 * Analyse les entêtes réseau et identifie les problèmes potentiels
 * 
 * @param {Object} headers - Entêtes HTTP de la réponse
 * @returns {Array} Liste des problèmes identifiés
 */
export const analyzeResponseHeaders = (headers) => {
  const issues = [];
  
  // Vérifier les entêtes de sécurité courants
  if (!headers['strict-transport-security']) {
    issues.push({
      type: 'missing_header',
      header: 'Strict-Transport-Security',
      risk: 'moyen',
      description: 'Protection HTTPS manquante. Risque de downgrade vers HTTP.'
    });
  }
  
  if (!headers['content-security-policy']) {
    issues.push({
      type: 'missing_header',
      header: 'Content-Security-Policy',
      risk: 'moyen',
      description: 'Politique de sécurité du contenu manquante. Risque XSS accru.'
    });
  }
  
  if (!headers['x-content-type-options']) {
    issues.push({
      type: 'missing_header',
      header: 'X-Content-Type-Options',
      risk: 'faible',
      description: 'Protection contre le MIME-sniffing manquante.'
    });
  }
  
  return issues;
};

export default {
  saveValidationReport,
  generateSecurityReport,
  analyzeResponseHeaders
};
