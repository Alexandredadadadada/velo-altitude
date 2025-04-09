/**
 * run-validation.ts
 * Script principal pour exécuter toutes les validations avant déploiement
 */

import { validateCriticalComponents } from './validate-critical-components';
import { checkBrowserCompatibility } from './browser-compatibility';
import { verifyDependencies } from './verify-dependencies';
import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  component: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILURE';
  message: string;
}

/**
 * Créer un rapport de validation au format Markdown
 */
function generateValidationReport(results: ValidationResult[]): void {
  const reportPath = path.resolve(__dirname, '../VALIDATION_REPORT.md');
  const date = new Date().toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const statusEmojis = {
    'SUCCESS': '✅',
    'WARNING': '⚠️',
    'FAILURE': '❌'
  };
  
  let reportContent = `# Rapport de Validation - Velo-Altitude v2.1\n\n`;
  reportContent += `**Date de validation:** ${date}\n\n`;
  
  // Résumé
  reportContent += `## Résumé\n\n`;
  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  const warningCount = results.filter(r => r.status === 'WARNING').length;
  const failureCount = results.filter(r => r.status === 'FAILURE').length;
  
  reportContent += `- **Succès:** ${successCount}/${results.length}\n`;
  reportContent += `- **Avertissements:** ${warningCount}/${results.length}\n`;
  reportContent += `- **Échecs:** ${failureCount}/${results.length}\n\n`;
  
  // Tableau détaillé
  reportContent += `## Détails des Validations\n\n`;
  reportContent += `| Composant | Statut | Message |\n`;
  reportContent += `|-----------|--------|--------|\n`;
  
  results.forEach(result => {
    reportContent += `| ${result.component} | ${statusEmojis[result.status]} ${result.status} | ${result.message} |\n`;
  });
  
  // Recommandations
  reportContent += `\n## Recommandations\n\n`;
  
  if (failureCount > 0) {
    reportContent += `❌ **Action requise:** Corriger les problèmes critiques avant de procéder au déploiement.\n\n`;
    
    const failures = results.filter(r => r.status === 'FAILURE');
    reportContent += `### Problèmes critiques à résoudre:\n\n`;
    failures.forEach((failure, index) => {
      reportContent += `${index + 1}. **${failure.component}:** ${failure.message}\n`;
    });
  } else if (warningCount > 0) {
    reportContent += `⚠️ **Attention requise:** Vérifier les avertissements avant de procéder au déploiement.\n\n`;
    
    const warnings = results.filter(r => r.status === 'WARNING');
    reportContent += `### Points d'attention:\n\n`;
    warnings.forEach((warning, index) => {
      reportContent += `${index + 1}. **${warning.component}:** ${warning.message}\n`;
    });
  } else {
    reportContent += `✅ **Prêt pour déploiement:** Tous les tests ont passé avec succès.\n`;
  }
  
  reportContent += `\n## Prochaines étapes\n\n`;
  
  if (failureCount === 0) {
    reportContent += `1. Exécuter \`npm run build:prod\` pour créer le build de production\n`;
    reportContent += `2. Vérifier manuellement les tests de compatibilité navigateur\n`;
    reportContent += `3. Procéder au déploiement avec \`npm run deploy\`\n`;
  } else {
    reportContent += `1. Résoudre les problèmes identifiés\n`;
    reportContent += `2. Relancer la validation avec \`npm run validate\`\n`;
    reportContent += `3. Une fois tous les problèmes résolus, procéder au build et déploiement\n`;
  }
  
  reportContent += `\n---\n\n`;
  reportContent += `*Ce rapport a été généré automatiquement par le script de validation. Pour plus de détails, consultez les logs dans la console.*\n`;
  
  fs.writeFileSync(reportPath, reportContent);
  console.log(`📄 Rapport de validation généré: ${reportPath}`);
}

/**
 * Exécute toutes les validations et génère un rapport
 */
async function runFullValidation(): Promise<void> {
  console.log('🚀 Démarrage de la validation complète...\n');
  
  const results: ValidationResult[] = [];
  
  try {
    // 1. Vérification des dépendances
    console.log('\n========================');
    console.log('📦 VÉRIFICATION DES DÉPENDANCES');
    console.log('========================\n');
    
    const depsResult = await verifyDependencies();
    results.push({
      component: 'Dépendances',
      status: depsResult ? 'SUCCESS' : 'WARNING',
      message: depsResult ? 'Toutes les dépendances sont compatibles' : 'Vérifiez les avertissements sur les dépendances'
    });
    
    // 2. Validation des composants critiques
    console.log('\n========================');
    console.log('🔍 VALIDATION DES COMPOSANTS');
    console.log('========================\n');
    
    const componentsResult = await validateCriticalComponents();
    results.push({
      component: 'Composants Critiques',
      status: componentsResult ? 'SUCCESS' : 'FAILURE',
      message: componentsResult ? 'Tous les composants critiques fonctionnent correctement' : 'Problèmes détectés dans les composants critiques'
    });
    
    // 3. Vérification de compatibilité navigateur
    console.log('\n========================');
    console.log('🌐 COMPATIBILITÉ NAVIGATEUR');
    console.log('========================\n');
    
    const browserResult = await checkBrowserCompatibility();
    results.push({
      component: 'Compatibilité Navigateur',
      status: browserResult ? 'SUCCESS' : 'WARNING',
      message: browserResult ? 'Compatibilité navigateur vérifiée' : 'Points d\'attention sur la compatibilité navigateur'
    });
    
    // 4. Vérification du fichier PROJECT_STATUS.md
    console.log('\n========================');
    console.log('📋 VÉRIFICATION DE LA DOCUMENTATION');
    console.log('========================\n');
    
    const statusPath = path.resolve(__dirname, '../PROJECT_STATUS.md');
    const releaseNotesPath = path.resolve(__dirname, '../RELEASE_NOTES_v2.1.md');
    
    const statusExists = fs.existsSync(statusPath);
    const releaseNotesExist = fs.existsSync(releaseNotesPath);
    
    if (statusExists && releaseNotesExist) {
      console.log('✅ Documentation vérifiée (PROJECT_STATUS.md et RELEASE_NOTES_v2.1.md)');
      results.push({
        component: 'Documentation',
        status: 'SUCCESS',
        message: 'Toute la documentation requise est présente'
      });
    } else {
      console.warn('⚠️ Documentation incomplète');
      results.push({
        component: 'Documentation',
        status: 'WARNING',
        message: !statusExists ? 'PROJECT_STATUS.md manquant' : 'RELEASE_NOTES_v2.1.md manquant'
      });
    }
    
    // Générer le rapport de validation
    generateValidationReport(results);
    
    // Afficher le résultat final
    const hasFailures = results.some(r => r.status === 'FAILURE');
    
    if (hasFailures) {
      console.error('\n❌ Validation échouée! Consultez le rapport pour plus de détails.');
      process.exit(1);
    } else {
      const hasWarnings = results.some(r => r.status === 'WARNING');
      if (hasWarnings) {
        console.warn('\n⚠️ Validation terminée avec des avertissements. Consultez le rapport pour plus de détails.');
      } else {
        console.log('\n✅ Validation complète terminée avec succès!');
      }
    }
  } catch (error) {
    console.error('\n❌ Erreur lors de la validation:', error);
    
    results.push({
      component: 'Validation',
      status: 'FAILURE',
      message: `Erreur inattendue: ${error.message}`
    });
    
    generateValidationReport(results);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  runFullValidation();
}

export { runFullValidation };
