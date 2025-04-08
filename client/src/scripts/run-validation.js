/**
 * Script d'exécution de la validation API
 * 
 * Ce script exécute les tests de validation API et génère des rapports détaillés.
 * Il peut être exécuté depuis la ligne de commande ou depuis un navigateur.
 */

import validatePublicEndpoints from './api-validation-public';
import { saveValidationReport } from './validation-utils';

/**
 * Exécute les tests de validation et génère les rapports
 */
const runValidation = async () => {
  console.log('Début de la validation API...');
  
  // Validation des endpoints publics
  console.log('\n=== VALIDATION DES ENDPOINTS PUBLICS ===\n');
  const publicResults = await validatePublicEndpoints();
  
  // Générer un rapport complet de validation
  const fullReport = generateFullReport(publicResults);
  
  // Sauvegarder le rapport complet
  saveValidationReport('full', fullReport);
  
  console.log('\nValidation API terminée. Consultez les rapports générés dans le dossier "docs".');
  
  return {
    publicResults,
    fullReport
  };
};

/**
 * Génère un rapport complet de validation basé sur tous les résultats
 * 
 * @param {Object} publicResults - Résultats des tests des endpoints publics
 * @returns {string} Rapport complet au format markdown
 */
const generateFullReport = (publicResults) => {
  const date = new Date().toLocaleString();
  
  let report = `# Rapport de Validation API Complet\n\n`;
  report += `## Informations Générales\n\n`;
  report += `- **Date de validation:** ${date}\n`;
  report += `- **Version de l'application:** 1.0.0\n\n`;
  
  // Résumé général
  report += `## Résumé Général\n\n`;
  report += `| Catégorie | Tests | Réussis | Échoués | Taux de réussite |\n`;
  report += `|-----------|-------|---------|---------|----------------|\n`;
  
  const publicTotal = publicResults.results.length;
  const publicPassed = publicResults.results.filter(r => r.success).length;
  const publicFailed = publicTotal - publicPassed;
  const publicSuccessRate = Math.round(publicPassed/publicTotal*100);
  
  report += `| Endpoints Publics | ${publicTotal} | ${publicPassed} | ${publicFailed} | ${publicSuccessRate}% |\n`;
  report += `| **Total** | **${publicTotal}** | **${publicPassed}** | **${publicFailed}** | **${publicSuccessRate}%** |\n\n`;
  
  // Section Endpoints Publics
  report += `## Endpoints Publics\n\n`;
  
  // Cols
  report += `### Endpoints Cols\n\n`;
  report += `| Endpoint | Statut | Format de Réponse | Notes |\n`;
  report += `|----------|--------|-------------------|-------|\n`;
  
  publicResults.results.filter(r => r.endpoint.includes('Col') && !r.endpoint.includes('Weather'))
    .forEach(result => {
      const status = result.success ? '✅ Réussi' : '❌ Échoué';
      const format = result.responseFormat || 'N/A';
      const notes = result.success ? '' : `Erreur: ${result.error} (${result.statusCode || 'N/A'})`;
      
      report += `| ${result.endpoint} | ${status} | ${format} | ${notes} |\n`;
    });
  
  // Météo
  report += `\n### Endpoints Météo\n\n`;
  report += `| Endpoint | Statut | Format de Réponse | Notes |\n`;
  report += `|----------|--------|-------------------|-------|\n`;
  
  publicResults.results.filter(r => r.endpoint.includes('Weather') || r.endpoint.includes('Forecast'))
    .forEach(result => {
      const status = result.success ? '✅ Réussi' : '❌ Échoué';
      const format = result.responseFormat || 'N/A';
      const notes = result.success ? '' : `Erreur: ${result.error} (${result.statusCode || 'N/A'})`;
      
      report += `| ${result.endpoint} | ${status} | ${format} | ${notes} |\n`;
    });
  
  // Recherche
  report += `\n### Endpoints Recherche\n\n`;
  report += `| Endpoint | Statut | Format de Réponse | Notes |\n`;
  report += `|----------|--------|-------------------|-------|\n`;
  
  publicResults.results.filter(r => r.endpoint.includes('search'))
    .forEach(result => {
      const status = result.success ? '✅ Réussi' : '❌ Échoué';
      const format = result.responseFormat || 'N/A';
      const notes = result.success ? '' : `Erreur: ${result.error} (${result.statusCode || 'N/A'})`;
      
      report += `| ${result.endpoint} | ${status} | ${format} | ${notes} |\n`;
    });
  
  // Autres endpoints
  const otherEndpoints = publicResults.results.filter(r => 
    !r.endpoint.includes('Col') && 
    !r.endpoint.includes('Weather') && 
    !r.endpoint.includes('search')
  );
  
  if (otherEndpoints.length > 0) {
    report += `\n### Autres Endpoints\n\n`;
    report += `| Endpoint | Statut | Format de Réponse | Notes |\n`;
    report += `|----------|--------|-------------------|-------|\n`;
    
    otherEndpoints.forEach(result => {
      const status = result.success ? '✅ Réussi' : '❌ Échoué';
      const format = result.responseFormat || 'N/A';
      const notes = result.success ? '' : `Erreur: ${result.error} (${result.statusCode || 'N/A'})`;
      
      report += `| ${result.endpoint} | ${status} | ${format} | ${notes} |\n`;
    });
  }
  
  // Problèmes identifiés
  report += `\n## Problèmes Identifiés\n\n`;
  
  const failedEndpoints = publicResults.results.filter(r => !r.success);
  
  if (failedEndpoints.length > 0) {
    failedEndpoints.forEach((result, index) => {
      report += `### ${index + 1}. ${result.endpoint}\n\n`;
      report += `- **Statut d'erreur:** ${result.statusCode || 'N/A'}\n`;
      report += `- **Message d'erreur:** ${result.error}\n`;
      report += `- **Cause possible:** `;
      
      // Suggérer des causes possibles basées sur le code d'erreur
      if (result.statusCode === 404) {
        report += `L'endpoint n'existe pas ou l'URL est incorrecte. Vérifier la cohérence entre la documentation et l'implémentation.\n`;
      } else if (result.statusCode === 401 || result.statusCode === 403) {
        report += `Problème d'authentification ou d'autorisation. Cet endpoint pourrait nécessiter une authentification.\n`;
      } else if (result.statusCode >= 500) {
        report += `Erreur serveur. Le backend pourrait avoir un problème interne ou une erreur de configuration.\n`;
      } else {
        report += `Cause non déterminée. Vérifier la configuration de l'API et les paramètres de requête.\n`;
      }
      
      report += `\n`;
    });
  } else {
    report += `Aucun problème identifié lors des tests des endpoints publics.\n`;
  }
  
  // Analyse de la documentation vs implémentation
  report += `\n## Analyse Documentation vs Implémentation\n\n`;
  report += `Pour une analyse détaillée des écarts entre la documentation API et l'implémentation, consultez le document [API_DOCUMENTATION_VS_IMPLEMENTATION.md](./API_DOCUMENTATION_VS_IMPLEMENTATION.md).\n\n`;
  
  // Recommandations
  report += `\n## Recommandations\n\n`;
  
  if (failedEndpoints.length > 0) {
    report += `### Correctifs Prioritaires\n\n`;
    
    failedEndpoints.forEach((result, index) => {
      report += `${index + 1}. **${result.endpoint}** - `;
      
      if (result.statusCode === 404) {
        report += `Vérifier que l'URL implémentée correspond à celle utilisée par le backend.\n`;
      } else if (result.statusCode === 401 || result.statusCode === 403) {
        report += `Implémenter la gestion d'authentification appropriée pour cet endpoint.\n`;
      } else if (result.statusCode >= 500) {
        report += `Contacter l'équipe backend pour résoudre l'erreur serveur.\n`;
      } else {
        report += `Vérifier les paramètres et le format de la requête.\n`;
      }
    });
    
    report += `\n`;
  }
  
  report += `### Améliorations Générales\n\n`;
  report += `1. **Standardisation des URLs** - Aligner toutes les URLs d'API sur un format cohérent (avec ou sans préfixe /api/).\n`;
  report += `2. **Validation de données** - Ajouter une validation des données côté client avant d'envoyer des requêtes au serveur.\n`;
  report += `3. **Gestion des erreurs** - Améliorer la gestion des erreurs pour fournir des messages plus descriptifs aux utilisateurs.\n`;
  report += `4. **Documentation** - Mettre à jour la documentation API pour refléter l'implémentation réelle.\n`;
  report += `5. **Tests unitaires** - Ajouter des tests unitaires pour chaque méthode du RealApiOrchestrator.\n`;
  
  // Plan d'action pour la suite
  report += `\n## Prochaines Étapes\n\n`;
  report += `1. Compléter la validation des endpoints protégés (nécessitant authentification)\n`;
  report += `2. Tester le mécanisme de rafraîchissement des tokens\n`;
  report += `3. Valider les intégrations externes (Strava, etc.)\n`;
  report += `4. Mesurer les performances des appels API et identifier les points d'optimisation\n`;
  
  return report;
};

// Exécution autonome du script en environnement Node.js
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  runValidation().then(() => {
    process.exit(0);
  }).catch(err => {
    console.error('Erreur lors de la validation:', err);
    process.exit(1);
  });
}

// Bouton d'exécution pour l'environnement navigateur
if (typeof window !== 'undefined' && window.document) {
  console.log('Exécutez ce script en appuyant sur le bouton ci-dessous');
  
  const button = document.createElement('button');
  button.innerText = 'Exécuter la Validation API Complète';
  button.style.padding = '10px';
  button.style.margin = '20px';
  button.style.backgroundColor = '#007BFF';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  
  button.onclick = async () => {
    const resultsContainer = document.createElement('pre');
    resultsContainer.style.padding = '20px';
    resultsContainer.style.backgroundColor = '#f5f5f5';
    resultsContainer.style.border = '1px solid #ddd';
    resultsContainer.style.borderRadius = '4px';
    resultsContainer.style.overflow = 'auto';
    resultsContainer.style.maxHeight = '80vh';
    
    document.body.appendChild(resultsContainer);
    
    resultsContainer.innerText = 'Validation API en cours...\n\n';
    
    try {
      const oldLog = console.log;
      console.log = (...args) => {
        oldLog(...args);
        resultsContainer.innerText += args.join(' ') + '\n';
      };
      
      await runValidation();
      
      console.log = oldLog;
    } catch (error) {
      resultsContainer.innerText += `\n\nErreur lors de la validation: ${error.message}`;
    }
  };
  
  document.body.appendChild(button);
}

export default runValidation;
