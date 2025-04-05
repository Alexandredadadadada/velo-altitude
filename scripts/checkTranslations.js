/**
 * Utilitaire pour vérifier l'exhaustivité des traductions
 * 
 * Cet outil analyse les fichiers de traduction pour identifier les chaînes manquantes
 * et génère un rapport détaillé de l'état des traductions.
 */

const fs = require('fs');
const path = require('path');

// Langues supportées par l'application
const languages = ['fr', 'en', 'de', 'it', 'es'];

// Répertoire des fichiers de traduction
const localesDir = path.join(__dirname, '../src/locales');

/**
 * Vérifie les traductions manquantes et génère un rapport
 */
function checkMissingTranslations() {
  console.log('Vérification des traductions pour les langues:', languages.join(', '));
  
  const results = {};
  
  // Charger les fichiers de traduction
  const translations = {};
  languages.forEach(lang => {
    try {
      const filePath = path.join(localesDir, `${lang}/translation.json`);
      console.log(`Chargement du fichier: ${filePath}`);
      
      translations[lang] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      console.log(`Fichier chargé avec succès pour ${lang}`);
    } catch (error) {
      console.error(`Erreur lors du chargement des traductions pour ${lang}:`, error);
      translations[lang] = {};
    }
  });
  
  // Utiliser le français comme référence (langue principale du projet)
  const referenceKeys = getAllKeys(translations['fr']);
  console.log(`Nombre total de clés dans la langue de référence (fr): ${referenceKeys.length}`);
  
  // Vérifier chaque langue
  languages.forEach(lang => {
    if (lang === 'fr') return; // Ignorer le français (référence)
    
    const langKeys = getAllKeys(translations[lang]);
    const missingKeys = referenceKeys.filter(key => !langKeys.includes(key));
    
    // Identifier les clés qui sont dans cette langue mais pas dans la référence
    const extraKeys = langKeys.filter(key => !referenceKeys.includes(key));
    
    results[lang] = {
      total: referenceKeys.length,
      translated: langKeys.length - extraKeys.length,
      missing: missingKeys.length,
      extra: extraKeys.length,
      missingKeys: missingKeys,
      extraKeys: extraKeys,
      completionPercentage: (((langKeys.length - extraKeys.length) / referenceKeys.length) * 100).toFixed(2) + '%'
    };
    
    console.log(`Analyse pour ${lang}: ${results[lang].completionPercentage} complété (${results[lang].missing} clés manquantes)`);
  });
  
  return results;
}

/**
 * Fonction récursive pour obtenir toutes les clés d'un objet de traduction
 * @param {Object} obj - Objet de traduction
 * @param {string} prefix - Préfixe pour la clé (utilisé pour la récursion)
 * @returns {Array} - Liste de toutes les clés
 */
function getAllKeys(obj, prefix = '') {
  let keys = [];
  
  Object.entries(obj).forEach(([key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      keys = [...keys, ...getAllKeys(value, newKey)];
    } else {
      keys.push(newKey);
    }
  });
  
  return keys;
}

/**
 * Génère un rapport au format Markdown
 * @param {Object} results - Résultats de l'analyse
 */
function generateReport(results) {
  const reportContent = `# Rapport de Vérification des Traductions

Date: ${new Date().toISOString().split('T')[0]}

## Résumé

| Langue | Total | Traduit | Manquant | Supplémentaire | Complétude |
|--------|-------|---------|----------|---------------|------------|
${languages.filter(lang => lang !== 'fr').map(lang => {
  const r = results[lang];
  return `| ${lang.toUpperCase()} | ${r.total} | ${r.translated} | ${r.missing} | ${r.extra} | ${r.completionPercentage} |`;
}).join('\n')}

## Détails des Traductions Manquantes

${languages.filter(lang => lang !== 'fr').map(lang => {
  const r = results[lang];
  return `### ${lang.toUpperCase()} (${r.missingKeys.length} clés manquantes)

${r.missingKeys.length > 0 ? r.missingKeys.map(key => `- \`${key}\``).join('\n') : 'Aucune clé manquante'}

#### Clés supplémentaires (${r.extraKeys.length})
${r.extraKeys.length > 0 ? r.extraKeys.map(key => `- \`${key}\``).join('\n') : 'Aucune clé supplémentaire'}
`;
}).join('\n')}

## Recommandations

1. Compléter en priorité les traductions des sections les plus utilisées :
   - Interface principale de navigation
   - Module d'entraînement
   - Informations des cols
   - Messages d'erreur fréquents

2. Vérifier la cohérence des termes techniques dans toutes les langues

3. Nettoyer les clés supplémentaires qui ne sont plus utilisées dans la langue de référence

4. Envisager une révision linguistique par des locuteurs natifs pour les textes importants
`;

  const reportPath = path.join(__dirname, '../docs/translation_report.md');
  fs.writeFileSync(reportPath, reportContent);
  console.log(`Rapport généré: ${reportPath}`);
  
  return reportPath;
}

/**
 * Générer une liste des traductions manquantes pour une mise à jour facile
 * @param {Object} results - Résultats de l'analyse
 */
function generateMissingTranslationsTemplates(results) {
  const templatesDir = path.join(__dirname, '../src/locales/missing_translations');
  
  // Créer le répertoire s'il n'existe pas
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }
  
  // Pour chaque langue, créer un fichier JSON avec les clés manquantes
  languages.filter(lang => lang !== 'fr').forEach(lang => {
    const r = results[lang];
    
    // Créer un objet avec les clés manquantes organisées hiérarchiquement
    const missingTranslationsTemplate = {};
    
    r.missingKeys.forEach(key => {
      const keyParts = key.split('.');
      let currentObj = missingTranslationsTemplate;
      
      keyParts.forEach((part, index) => {
        if (index === keyParts.length - 1) {
          // Dernière partie de la clé - ajouter une valeur vide à compléter
          currentObj[part] = ''; // À traduire
        } else {
          // Partie intermédiaire - créer un objet si nécessaire
          if (!currentObj[part]) {
            currentObj[part] = {};
          }
          currentObj = currentObj[part];
        }
      });
    });
    
    const templatePath = path.join(templatesDir, `${lang}_missing.json`);
    fs.writeFileSync(templatePath, JSON.stringify(missingTranslationsTemplate, null, 2));
    console.log(`Template des traductions manquantes généré pour ${lang}: ${templatePath}`);
  });
}

/**
 * Fonction principale pour exécuter la vérification et générer les rapports
 */
function main() {
  console.log('Démarrage de la vérification des traductions...');
  
  // Vérifier que le répertoire des locales existe
  if (!fs.existsSync(localesDir)) {
    console.error(`Le répertoire des locales n'existe pas: ${localesDir}`);
    console.log('Création du répertoire...');
    fs.mkdirSync(localesDir, { recursive: true });
    
    // Créer des fichiers de traduction vides pour chaque langue
    languages.forEach(lang => {
      const langDir = path.join(localesDir, lang);
      fs.mkdirSync(langDir, { recursive: true });
      fs.writeFileSync(path.join(langDir, 'translation.json'), '{}');
    });
    
    console.log('Répertoires de base créés. Veuillez ajouter des traductions avant de relancer l\'outil.');
    return;
  }
  
  // Vérifier les traductions
  const results = checkMissingTranslations();
  
  // Générer le rapport
  const reportPath = generateReport(results);
  
  // Générer les templates pour les traductions manquantes
  generateMissingTranslationsTemplates(results);
  
  console.log('Vérification des traductions terminée.');
  console.log(`Rapport disponible: ${reportPath}`);
}

// Exécuter la fonction principale si le script est exécuté directement
if (require.main === module) {
  main();
}

module.exports = {
  checkMissingTranslations,
  generateReport,
  generateMissingTranslationsTemplates,
  main
};
