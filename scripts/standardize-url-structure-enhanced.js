/**
 * Script de standardisation avancée des URLs et slugs
 * Velo-Altitude
 * 
 * Ce script standardise les URLs selon la structure définie :
 * - Cols : /cols/[pays]/[nom-du-col]
 * - Programmes : /entrainement/[niveau]/[nom-du-programme]
 * - Recettes : /nutrition/[categorie]/[nom-de-recette]
 * - Défis : /defis/[type]/[nom-du-defi]
 */

const fs = require('fs');
const path = require('path');
const slugify = require('slugify');
const chalk = require('chalk');

// Configuration
const CONFIG = {
  rootDir: path.resolve(__dirname, '..'),
  srcDir: path.resolve(__dirname, '../src'),
  serverDataDir: path.resolve(__dirname, '../server/data'),
  outputReportDir: path.resolve(__dirname, '../docs'),
  netlifyConfigPath: path.resolve(__dirname, '../netlify.toml'),
  urlStructure: {
    cols: {
      pattern: '/cols/:country/:slug',
      dataPath: 'server/data/cols',
      targetPath: 'server/data/cols',
      redirectFrom: ['/cols/:slug']
    },
    training: {
      pattern: '/entrainement/:level/:slug',
      dataPath: 'server/data/training',
      targetPath: 'server/data/training',
      redirectFrom: ['/training/:slug', '/entrainement/:slug']
    },
    nutrition: {
      pattern: '/nutrition/:category/:slug',
      dataPath: 'server/data/nutrition',
      targetPath: 'server/data/nutrition',
      redirectFrom: ['/nutrition/:slug', '/nutrition/recipes/:slug']
    },
    challenges: {
      pattern: '/defis/:type/:slug',
      dataPath: 'server/data/seven-majors',
      targetPath: 'server/data/challenges',
      redirectFrom: ['/7-majeurs/:slug', '/seven-majors/:slug']
    },
    visualization: {
      pattern: '/visualisation-3d/:country/:slug',
      dataPath: 'server/data/visualization',
      targetPath: 'server/data/visualization',
      redirectFrom: ['/routes/:slug', '/visualisation-3d/:slug']
    },
    community: {
      pattern: '/communaute/:section/:slug',
      dataPath: 'server/data/community',
      targetPath: 'server/data/community',
      redirectFrom: ['/social/:slug', '/challenges/:slug', '/communaute/:slug']
    }
  }
};

// Crée les répertoires nécessaires
function createDirectories() {
  console.log(chalk.blue('Création des répertoires pour la structure standardisée...'));
  
  Object.values(CONFIG.urlStructure).forEach(section => {
    const targetDir = path.resolve(CONFIG.rootDir, section.targetPath);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(chalk.green(`✓ Répertoire créé: ${section.targetPath}`));
    }
    
    // Pour les cols, créer des sous-répertoires par pays
    if (section.pattern.includes(':country')) {
      const countries = ['france', 'italie', 'espagne', 'suisse', 'autres'];
      countries.forEach(country => {
        const countryDir = path.join(targetDir, country);
        if (!fs.existsSync(countryDir)) {
          fs.mkdirSync(countryDir, { recursive: true });
          console.log(chalk.green(`✓ Sous-répertoire créé: ${section.targetPath}/${country}`));
        }
      });
    }
    
    // Pour la nutrition, créer des sous-répertoires par catégorie
    if (section.pattern.includes(':category')) {
      const categories = ['recettes', 'plans', 'guides'];
      categories.forEach(category => {
        const categoryDir = path.join(targetDir, category);
        if (!fs.existsSync(categoryDir)) {
          fs.mkdirSync(categoryDir, { recursive: true });
          console.log(chalk.green(`✓ Sous-répertoire créé: ${section.targetPath}/${category}`));
        }
      });
    }
    
    // Pour l'entraînement, créer des sous-répertoires par niveau
    if (section.pattern.includes(':level')) {
      const levels = ['debutant', 'intermediaire', 'avance'];
      levels.forEach(level => {
        const levelDir = path.join(targetDir, level);
        if (!fs.existsSync(levelDir)) {
          fs.mkdirSync(levelDir, { recursive: true });
          console.log(chalk.green(`✓ Sous-répertoire créé: ${section.targetPath}/${level}`));
        }
      });
    }
    
    // Pour les défis, créer des sous-répertoires par type
    if (section.pattern.includes(':type')) {
      const types = ['7-majeurs', 'saisonniers', 'thematiques'];
      types.forEach(type => {
        const typeDir = path.join(targetDir, type);
        if (!fs.existsSync(typeDir)) {
          fs.mkdirSync(typeDir, { recursive: true });
          console.log(chalk.green(`✓ Sous-répertoire créé: ${section.targetPath}/${type}`));
        }
      });
    }
  });
}

// Déterminer le pays d'un col basé sur son nom ou sa description
function determineColCountry(col) {
  const name = col.name || '';
  const description = col.description || '';
  const fullText = `${name} ${description}`.toLowerCase();
  
  if (/alpe d'huez|ventoux|galibier|tourmalet|izoard|france|français/i.test(fullText)) {
    return 'france';
  } else if (/stelvio|mortirolo|gavia|giro|italie|italien/i.test(fullText)) {
    return 'italie';
  } else if (/angliru|veleta|espagne|espagnol/i.test(fullText)) {
    return 'espagne';
  } else if (/grimsel|suisse|alpes suisses/i.test(fullText)) {
    return 'suisse';
  } else {
    return 'autres';
  }
}

// Déterminer le niveau d'un programme d'entraînement
function determineTrainingLevel(program) {
  const difficulty = program.difficulty || '';
  const name = program.name || '';
  const fullText = `${name} ${difficulty}`.toLowerCase();
  
  if (/débutant|beginner|facile|easy|niveau 1/i.test(fullText)) {
    return 'debutant';
  } else if (/intermédiaire|intermediate|moyen|medium|niveau 2/i.test(fullText)) {
    return 'intermediaire';
  } else {
    return 'avance';
  }
}

// Déterminer la catégorie d'un contenu nutritionnel
function determineNutritionCategory(item) {
  const type = item.type || '';
  
  if (/recipe|recette/i.test(type)) {
    return 'recettes';
  } else if (/plan|planning/i.test(type)) {
    return 'plans';
  } else {
    return 'guides';
  }
}

// Déterminer le type d'un défi
function determineChallengeType(challenge) {
  const type = challenge.type || '';
  const name = challenge.name || '';
  const fullText = `${name} ${type}`.toLowerCase();
  
  if (/7 majeurs|seven majors/i.test(fullText)) {
    return '7-majeurs';
  } else if (/saison|season|hiver|été|winter|summer/i.test(fullText)) {
    return 'saisonniers';
  } else {
    return 'thematiques';
  }
}

// Standardiser un slug
function standardizeSlug(text) {
  return slugify(text, {
    replacement: '-',
    remove: /[*+~.()'"!:@]/g,
    lower: true,
    strict: true,
    locale: 'fr'
  });
}

// Générer le fichier de redirections Netlify
function generateNetlifyRedirects() {
  console.log(chalk.blue('\nGénération des redirections Netlify...'));
  
  let netlifyConfig = `
# Configuration Netlify pour Velo-Altitude
# Redirections pour standardiser les URLs

[build]
  publish = "build"

`;
  
  // Ajouter les redirections pour chaque section
  Object.entries(CONFIG.urlStructure).forEach(([key, section]) => {
    console.log(chalk.yellow(`Génération des redirections pour ${key}...`));
    
    section.redirectFrom.forEach(oldPattern => {
      netlifyConfig += `
[[redirects]]
  from = "${oldPattern}"
  to = "${section.pattern}"
  status = 301
`;
    });
  });
  
  // Ajouter la redirection fallback pour SPA
  netlifyConfig += `
# Fallback pour SPA
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;
  
  // Écrire le fichier netlify.toml
  fs.writeFileSync(CONFIG.netlifyConfigPath, netlifyConfig);
  console.log(chalk.green(`✓ Fichier de redirections Netlify généré: ${CONFIG.netlifyConfigPath}`));
}

// Générer le rapport de standardisation des URLs
function generateUrlReport() {
  console.log(chalk.blue('\nGénération du rapport de standardisation des URLs...'));
  
  let report = `# Rapport de Standardisation des URLs - Velo-Altitude

*Généré le ${new Date().toISOString().split('T')[0]}*

Ce rapport détaille la structure d'URL standardisée pour le site Velo-Altitude, conforme aux meilleures pratiques SEO et d'expérience utilisateur.

## Structure d'URL standardisée

`;
  
  Object.entries(CONFIG.urlStructure).forEach(([key, section]) => {
    report += `### ${key.charAt(0).toUpperCase() + key.slice(1)}\n\n`;
    report += `- **Pattern**: \`${section.pattern}\`\n`;
    report += `- **Redirections**:\n`;
    section.redirectFrom.forEach(oldPattern => {
      report += `  - \`${oldPattern}\` → \`${section.pattern}\`\n`;
    });
    report += `- **Répertoire de données**: \`${section.targetPath}\`\n\n`;
  });
  
  report += `## Guide d'implémentation

1. Ajout de nouvelles URLs:
   - Suivre rigoureusement les patterns définis
   - Utiliser des slugs normalisés (kebab-case, sans caractères spéciaux)
   - Placer les données dans les répertoires appropriés

2. Migration des anciennes URLs:
   - Les redirections sont définies dans le fichier \`netlify.toml\`
   - Toute ancienne URL doit être redirigée vers sa version standardisée

3. Paramètres d'URL:
   - Les paramètres de filtrage doivent utiliser la notation \`?param=valeur\`
   - Les paramètres de pagination doivent utiliser \`?page=n&limit=m\`

4. URLs multilingues:
   - Le préfixe de langue doit être ajouté au début de l'URL: \`/fr/cols/...\`, \`/en/cols/...\`
   - La langue par défaut (français) peut omettre le préfixe

## État de standardisation

- Fichier Netlify de redirections généré: \`netlify.toml\`
- Structure de répertoires créée selon le modèle standardisé
- Prochaine étape: migration des données vers la nouvelle structure
`;
  
  // Écrire le rapport
  const reportPath = path.join(CONFIG.outputReportDir, 'URL_STRUCTURE_REPORT.md');
  fs.writeFileSync(reportPath, report);
  console.log(chalk.green(`✓ Rapport de standardisation des URLs généré: ${reportPath}`));
}

// Fonction principale
async function main() {
  console.log(chalk.cyan('=== Standardisation avancée des URLs - Velo-Altitude ===\n'));
  
  // Créer les répertoires nécessaires
  createDirectories();
  
  // Générer le fichier de redirections Netlify
  generateNetlifyRedirects();
  
  // Générer le rapport
  generateUrlReport();
  
  console.log(chalk.cyan('\n=== Standardisation des URLs terminée avec succès ==='));
  console.log(chalk.yellow('\nPour finaliser la standardisation, exécutez les scripts complémentaires:'));
  console.log(chalk.yellow('1. node scripts/reorganize-content.js'));
  console.log(chalk.yellow('2. node scripts/update-react-components.js'));
  console.log(chalk.yellow('3. node scripts/validate-url-structure.js'));
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red(`Erreur lors de l'exécution du script: ${error.message}`));
});
