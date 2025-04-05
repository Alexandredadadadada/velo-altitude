/**
 * Système de redirections avancées pour Velo-Altitude
 * 
 * Ce script génère un système de redirections intelligentes qui :
 * - Détecte les anciennes URL et redirige vers la nouvelle structure
 * - Crée des règles de redirection dynamiques pour gérer les variations de paramètres
 * - Optimise les redirections pour préserver le référencement
 * - Documente toutes les règles dans un fichier REDIRECTIONS.md
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Configuration
const CONFIG = {
  rootDir: path.resolve(__dirname, '..'),
  serverDataDir: path.resolve(__dirname, '../server/data'),
  srcDir: path.resolve(__dirname, '../src'),
  docsDir: path.resolve(__dirname, '../docs'),
  outputRedirectionsDoc: path.resolve(__dirname, '../docs/REDIRECTIONS.md'),
  outputNetlifyConfig: path.resolve(__dirname, '../netlify.toml'),
  oldUrlPatterns: [
    // Anciens modèles d'URL génériques
    { pattern: '/cols/:slug', newPattern: '/cols/:country/:slug' },
    { pattern: '/training/:slug', newPattern: '/entrainement/:level/:slug' },
    { pattern: '/nutrition/:slug', newPattern: '/nutrition/:category/:slug' },
    { pattern: '/nutrition/recipes/:slug', newPattern: '/nutrition/recettes/:slug' },
    { pattern: '/7-majeurs/:slug', newPattern: '/defis/7-majeurs/:slug' },
    { pattern: '/seven-majors/:slug', newPattern: '/defis/7-majeurs/:slug' },
    { pattern: '/routes/:slug', newPattern: '/visualisation-3d/:country/:slug' },
    { pattern: '/visualisation-3d/:slug', newPattern: '/visualisation-3d/:country/:slug' },
    { pattern: '/social/:slug', newPattern: '/communaute/:section/:slug' },
    { pattern: '/challenges/:slug', newPattern: '/communaute/evenements/:slug' },
    
    // Anciens chemins de catégories
    { pattern: '/training', newPattern: '/entrainement' },
    { pattern: '/nutrition/recipes', newPattern: '/nutrition/recettes' },
    { pattern: '/seven-majors', newPattern: '/defis/7-majeurs' },
    { pattern: '/routes', newPattern: '/visualisation-3d' },
    { pattern: '/social', newPattern: '/communaute' },
    { pattern: '/challenges', newPattern: '/communaute/evenements' },
    
    // Anciens chemins avec paramètres de recherche
    { pattern: '/cols?region=:region', newPattern: '/cols/:region' },
    { pattern: '/training?level=:level', newPattern: '/entrainement/:level' },
    { pattern: '/nutrition?type=:category', newPattern: '/nutrition/:category' }
  ],
  // Mappings spécifiques pour les URLs qui ne suivent pas un modèle générique
  specificRedirects: [
    // Format: { from: '/ancien-chemin', to: '/nouveau-chemin' }
    { from: '/alpe-d-huez', to: '/cols/france/alpe-d-huez' },
    { from: '/mont-ventoux', to: '/cols/france/mont-ventoux' },
    { from: '/col-du-tourmalet', to: '/cols/france/col-du-tourmalet' },
    { from: '/col-du-galibier', to: '/cols/france/col-du-galibier' },
    { from: '/stelvio', to: '/cols/italie/passo-dello-stelvio' },
    { from: '/mortirolo', to: '/cols/italie/passo-del-mortirolo' },
    { from: '/plan-debutant', to: '/entrainement/debutant/plan-premier-col' },
    { from: '/nutrition-montagne', to: '/nutrition/guides/nutrition-montagne' }
  ]
};

// Fonction pour scanner les fichiers et trouver les anciennes URL utilisées
function scanFilesForOldUrls() {
  console.log(chalk.blue('Scan des fichiers pour identifier les anciennes URLs...'));
  
  const oldUrlsFound = {};
  
  // Parcourir tous les fichiers JS/JSX dans src
  function scanDirectory(dir) {
    if (!fs.existsSync(dir)) {
      return;
    }
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanDirectory(fullPath);
      } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          // Rechercher les anciennes URL dans le code
          CONFIG.oldUrlPatterns.forEach(pattern => {
            // Convertir le pattern en regex pour la recherche
            const regexPattern = pattern.pattern
              .replace(/:[a-zA-Z]+/g, '[\\w-]+') // :param devient [\\w-]+
              .replace(/\?/g, '\\?')             // échapper les points d'interrogation
              .replace(/\//g, '\\/');            // échapper les /
            
            const regex = new RegExp(`["'](${regexPattern})["']`, 'g');
            let match;
            
            while ((match = regex.exec(content)) !== null) {
              const url = match[1];
              if (!oldUrlsFound[url]) {
                oldUrlsFound[url] = {
                  count: 0,
                  files: []
                };
              }
              
              oldUrlsFound[url].count++;
              const relPath = path.relative(CONFIG.rootDir, fullPath);
              if (!oldUrlsFound[url].files.includes(relPath)) {
                oldUrlsFound[url].files.push(relPath);
              }
            }
          });
        } catch (error) {
          console.error(chalk.red(`Erreur lors de la lecture de ${fullPath}: ${error.message}`));
        }
      }
    }
  }
  
  scanDirectory(CONFIG.srcDir);
  
  console.log(chalk.green(`✓ Scan terminé, ${Object.keys(oldUrlsFound).length} anciennes URLs identifiées`));
  return oldUrlsFound;
}

// Générer les règles de redirection Netlify
function generateNetlifyRedirects(oldUrlsFound) {
  console.log(chalk.blue('\nGénération des règles de redirection Netlify...'));
  
  let netlifyConfig = `
# Configuration Netlify pour Velo-Altitude
# Redirections avancées pour préserver la compatibilité et le référencement

[build]
  publish = "build"

`;
  
  // Ajouter les redirections spécifiques d'abord (priorité plus élevée)
  CONFIG.specificRedirects.forEach(redirect => {
    netlifyConfig += `
[[redirects]]
  from = "${redirect.from}"
  to = "${redirect.to}"
  status = 301
  force = true
`;
  });
  
  // Ajouter les redirections basées sur les modèles
  CONFIG.oldUrlPatterns.forEach(pattern => {
    // Convertir le pattern en syntaxe de redirection Netlify
    let fromPattern = pattern.pattern.replace(/:[a-zA-Z]+/g, '*');
    let toPattern = pattern.newPattern;
    
    // Gérer les paramètres de recherche spécialement
    if (fromPattern.includes('?')) {
      const [basePath, queryParams] = fromPattern.split('?');
      let splats = 0;
      
      // Pour les redirections avec paramètres de recherche, utiliser la syntaxe :splat
      if (queryParams) {
        const newQueryParams = queryParams.replace(/\*+/g, () => {
          splats++;
          return `:splat${splats > 1 ? splats : ''}`;
        });
        
        fromPattern = `${basePath}?${newQueryParams}`;
        
        // Ajuster le pattern de destination pour utiliser les splats
        splats = 0;
        toPattern = pattern.newPattern.replace(/:[a-zA-Z]+/g, () => {
          splats++;
          return `:splat${splats > 1 ? splats : ''}`;
        });
      }
    } else {
      // Pour les redirections de chemins simples, utiliser :splat
      fromPattern = fromPattern.replace(/\*/g, ':splat');
      toPattern = toPattern.replace(/:[a-zA-Z]+/g, ':splat');
    }
    
    netlifyConfig += `
[[redirects]]
  from = "${fromPattern}"
  to = "${toPattern}"
  status = 301
  force = true
`;
  });
  
  // Ajouter les redirections pour les URL spécifiques trouvées lors du scan
  Object.entries(oldUrlsFound).forEach(([oldUrl, info]) => {
    // Vérifier si l'URL correspond à un motif connu
    let matched = false;
    
    for (const pattern of CONFIG.oldUrlPatterns) {
      const regexPattern = pattern.pattern
        .replace(/:[a-zA-Z]+/g, '([\\w-]+)') // :param devient un groupe de capture
        .replace(/\?/g, '\\?')               // échapper les points d'interrogation
        .replace(/\//g, '\\/');              // échapper les /
      
      const regex = new RegExp(`^${regexPattern}$`);
      const match = oldUrl.match(regex);
      
      if (match) {
        matched = true;
        break;
      }
    }
    
    // Si l'URL ne correspond à aucun motif, ajouter une redirection spécifique
    if (!matched && !oldUrl.startsWith('http')) {
      netlifyConfig += `
[[redirects]]
  from = "${oldUrl}"
  to = "/not-found?old-url=${encodeURIComponent(oldUrl)}"
  status = 302
`;
    }
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
  fs.writeFileSync(CONFIG.outputNetlifyConfig, netlifyConfig);
  console.log(chalk.green(`✓ Fichier de redirections Netlify généré: ${CONFIG.outputNetlifyConfig}`));
  
  return netlifyConfig;
}

// Générer la documentation des redirections
function generateRedirectionsDoc(oldUrlsFound, netlifyConfig) {
  console.log(chalk.blue('\nGénération de la documentation des redirections...'));
  
  let doc = `# Documentation des Redirections - Velo-Altitude

*Généré le ${new Date().toISOString().split('T')[0]}*

Ce document détaille le système de redirections mis en place pour Velo-Altitude, permettant de préserver la compatibilité avec les anciennes URLs et d'optimiser le référencement.

## Principes du système de redirections

- **Redirections 301** (permanentes) pour préserver le référencement
- **Règles génériques** basées sur des modèles d'URL pour faciliter la maintenance
- **Redirections spécifiques** pour les cas particuliers et les URLs populaires
- **Préservation des paramètres** importants dans les nouvelles URLs
- **Fallback intelligent** pour les URLs non reconnues

## Modèles de redirection

Le système utilise les modèles de redirection suivants pour transformer les anciennes URLs en nouvelles URLs selon la structure standardisée:

| Ancien modèle | Nouveau modèle |
|---------------|---------------|
`;
  
  // Ajouter les modèles de redirection
  CONFIG.oldUrlPatterns.forEach(pattern => {
    doc += `| \`${pattern.pattern}\` | \`${pattern.newPattern}\` |\n`;
  });
  
  doc += `
## Redirections spécifiques

Certaines URLs populaires ou spécifiques bénéficient de redirections dédiées:

| Ancienne URL | Nouvelle URL |
|--------------|--------------|
`;
  
  // Ajouter les redirections spécifiques
  CONFIG.specificRedirects.forEach(redirect => {
    doc += `| \`${redirect.from}\` | \`${redirect.to}\` |\n`;
  });
  
  doc += `
## Anciennes URLs détectées

Le scan du code source a révélé l'utilisation des anciennes URLs suivantes:

`;
  
  // Ajouter les anciennes URLs trouvées dans le scan
  if (Object.keys(oldUrlsFound).length > 0) {
    Object.entries(oldUrlsFound).forEach(([url, info]) => {
      doc += `### \`${url}\`\n`;
      doc += `- **Occurrences**: ${info.count}\n`;
      doc += `- **Fichiers**: ${info.files.join(', ')}\n\n`;
    });
  } else {
    doc += `Aucune ancienne URL n'a été détectée dans le code source.\n\n`;
  }
  
  doc += `
## Configuration Netlify

Les redirections sont implémentées dans Netlify via le fichier \`netlify.toml\`. Voici un extrait des règles de redirection:

\`\`\`toml
${netlifyConfig.split('\n').filter(line => line.trim() !== '' && !line.includes('# Fallback')).slice(0, 20).join('\n')}
...
\`\`\`

## Recommandations pour les développeurs

1. **Ne plus utiliser les anciennes URLs** dans le code - mettez à jour tous les liens internes
2. **Vérifier régulièrement les logs de redirection** dans Netlify pour identifier des modèles manquants
3. **Tester les redirections** avant de déployer des changements majeurs
4. **Mettre à jour ce document** lorsque de nouvelles redirections sont ajoutées

## Tests de redirection

Pour tester les redirections, utilisez cette commande:

\`\`\`bash
node scripts/test-redirects.js
\`\`\`

## Impacts sur le SEO

Les redirections 301 transmettent environ 90-99% du "link juice" à la nouvelle URL, ce qui permet de préserver la plupart de la valeur SEO des pages existantes. Toutefois, il est recommandé de:

1. **Mettre à jour les liens internes** dès que possible
2. **Informer les sites partenaires** des nouvelles URLs
3. **Mettre à jour le sitemap** pour inclure uniquement les nouvelles URLs
4. **Vérifier dans Search Console** que les redirections sont correctement interprétées par Google
`;
  
  // Écrire le document
  fs.writeFileSync(CONFIG.outputRedirectionsDoc, doc);
  console.log(chalk.green(`✓ Documentation des redirections générée: ${CONFIG.outputRedirectionsDoc}`));
}

// Fonction pour créer un script de test des redirections
function createRedirectsTestScript() {
  console.log(chalk.blue('\nCréation du script de test des redirections...'));
  
  const testScriptPath = path.join(__dirname, 'test-redirects.js');
  
  const scriptContent = `/**
 * Script de test des redirections pour Velo-Altitude
 * 
 * Ce script vérifie que les redirections configurées dans netlify.toml
 * fonctionnent correctement selon les modèles définis.
 */

const fetch = require('node-fetch');
const chalk = require('chalk');

// URLs de test (anciennes URLs) à vérifier
const TEST_URLS = [
${CONFIG.specificRedirects.map(r => `  '${r.from}',`).join('\n')}
  '/cols/alpe-d-huez',
  '/training/debutant',
  '/nutrition/recipes/energy-bars',
  '/7-majeurs/alpes-challenge',
  '/routes/galibier',
  '/social/events',
  '/challenges/summer'
];

// Fonction pour tester une URL
async function testRedirect(url) {
  try {
    // Construire l'URL complète pour le test (remplacer par votre domaine de staging)
    const testUrl = \`https://staging.velo-altitude.com\${url}\`;
    
    // Effectuer une requête HEAD pour voir la redirection
    const response = await fetch(testUrl, { method: 'HEAD', redirect: 'manual' });
    
    // Vérifier le statut et l'URL de redirection
    if (response.status === 301 || response.status === 302) {
      const location = response.headers.get('location');
      console.log(chalk.green(\`✓ \${url} -> \${location} (\${response.status})\`));
      return { url, success: true, status: response.status, location };
    } else if (response.status === 200) {
      console.log(chalk.yellow(\`! \${url} -> Pas de redirection (200)\`));
      return { url, success: false, status: 200, message: 'Pas de redirection' };
    } else {
      console.log(chalk.red(\`✗ \${url} -> Erreur (\${response.status})\`));
      return { url, success: false, status: response.status, message: 'Erreur' };
    }
  } catch (error) {
    console.error(chalk.red(\`✗ \${url} -> \${error.message}\`));
    return { url, success: false, error: error.message };
  }
}

// Fonction principale
async function main() {
  console.log(chalk.cyan('=== Test des redirections - Velo-Altitude ===\\n'));
  
  const results = [];
  
  // Tester toutes les URLs
  for (const url of TEST_URLS) {
    const result = await testRedirect(url);
    results.push(result);
  }
  
  // Résumé
  console.log(chalk.cyan('\\n=== Résumé ==='));
  const successful = results.filter(r => r.success).length;
  console.log(\`Redirections réussies: \${successful}/\${results.length}\`);
  
  if (successful !== results.length) {
    console.log(chalk.yellow('\\nURLs problématiques:'));
    results.filter(r => !r.success).forEach(r => {
      console.log(chalk.yellow(\`- \${r.url}: \${r.message || r.error}\`));
    });
  }
}

// Exécuter le script
main().catch(error => {
  console.error(chalk.red(\`Erreur: \${error.message}\`));
});
`;
  
  fs.writeFileSync(testScriptPath, scriptContent);
  console.log(chalk.green(`✓ Script de test des redirections créé: ${testScriptPath}`));
}

// Fonction principale
async function main() {
  console.log(chalk.cyan('=== Génération du système de redirections avancées - Velo-Altitude ===\n'));
  
  // Scanner les fichiers pour trouver les anciennes URLs
  const oldUrlsFound = scanFilesForOldUrls();
  
  // Générer les redirections Netlify
  const netlifyConfig = generateNetlifyRedirects(oldUrlsFound);
  
  // Générer la documentation des redirections
  generateRedirectionsDoc(oldUrlsFound, netlifyConfig);
  
  // Créer le script de test des redirections
  createRedirectsTestScript();
  
  console.log(chalk.cyan('\n=== Génération du système de redirections terminée avec succès ==='));
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red(`Erreur lors de l'exécution du script: ${error.message}`));
});
