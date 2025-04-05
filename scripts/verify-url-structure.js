/**
 * Script de vérification et d'optimisation de la structure d'URL
 * Velo-Altitude
 * 
 * Ce script analyse la structure actuelle des URLs du site,
 * vérifie que tous les liens sont valides et propose des améliorations
 * pour une meilleure expérience utilisateur et un meilleur référencement.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  baseUrl: 'https://velo-altitude.com',
  srcDir: path.join(__dirname, '../src'),
  serverDataDir: path.join(__dirname, '../server/data'),
  reportPath: path.join(__dirname, '../docs/url-structure-report.md'),
  // Structure d'URL recommandée
  recommendedUrls: {
    cols: '/cols/:slug',
    colsList: '/cols',
    colsRegion: '/cols/region/:region',
    training: '/entrainement/:slug',
    trainingList: '/entrainement',
    trainingLevel: '/entrainement/niveau/:level',
    nutrition: '/nutrition',
    nutritionRecipes: '/nutrition/recettes/:slug',
    nutritionPlans: '/nutrition/plans/:slug',
    sevenMajors: '/7-majeurs/:slug',
    sevenMajorsList: '/7-majeurs',
    visualization: '/visualisation-3d/:slug',
    visualizationList: '/visualisation-3d',
    community: '/communaute',
    communityEvents: '/communaute/evenements',
    communityRides: '/communaute/sorties'
  }
};

// Trouver tous les fichiers JS/JSX dans un répertoire (récursivement)
function findFiles(directory, extensions = ['.js', '.jsx']) {
  let results = [];
  
  if (!fs.existsSync(directory)) {
    return results;
  }
  
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(findFiles(filePath, extensions));
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  }
  
  return results;
}

// Extraire les liens d'un fichier
function extractLinks(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const links = [];
    
    // Extraire les liens des balises <Link> de React Router
    const linkRegex = /<Link\s+[^>]*to=["']([^"']*)["'][^>]*>/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      links.push(match[1]);
    }
    
    // Extraire les liens des balises <a>
    const aRegex = /<a\s+[^>]*href=["']([^"']*)["'][^>]*>/g;
    while ((match = aRegex.exec(content)) !== null) {
      links.push(match[1]);
    }
    
    // Extraire les liens des routes React Router
    const routeRegex = /<Route\s+[^>]*path=["']([^"']*)["'][^>]*>/g;
    while ((match = routeRegex.exec(content)) !== null) {
      links.push(match[1]);
    }
    
    // Extraire les liens des redirections
    const redirectRegex = /<Redirect\s+[^>]*to=["']([^"']*)["'][^>]*>/g;
    while ((match = redirectRegex.exec(content)) !== null) {
      links.push(match[1]);
    }
    
    // Extraire les liens des navigations programmatiques
    const navigateRegex = /navigate\(["']([^"']*)["']\)/g;
    while ((match = navigateRegex.exec(content)) !== null) {
      links.push(match[1]);
    }
    
    // Extraire les liens des histoires de navigation
    const historyRegex = /history\.push\(["']([^"']*)["']\)/g;
    while ((match = historyRegex.exec(content)) !== null) {
      links.push(match[1]);
    }
    
    return links;
  } catch (error) {
    console.error(`Erreur lors de l'extraction des liens de ${filePath}: ${error.message}`);
    return [];
  }
}

// Vérifier si un lien est valide
function isValidLink(link) {
  // Ignorer les liens externes et les ancres
  if (link.startsWith('http') || link.startsWith('#')) {
    return true;
  }
  
  // Ignorer les liens avec des variables
  if (link.includes('${') || link.includes('{')) {
    return true;
  }
  
  // Vérifier si le lien correspond à une route définie
  const routes = Object.values(CONFIG.recommendedUrls);
  
  // Remplacer les paramètres de route par des regex
  const routePatterns = routes.map(route => {
    return new RegExp('^' + route.replace(/:\w+/g, '[^/]+') + '$');
  });
  
  return routePatterns.some(pattern => pattern.test(link));
}

// Analyser les routes React Router
function analyzeRoutes() {
  console.log('Analyse des routes React Router...');
  
  const appJsPath = path.join(CONFIG.srcDir, 'App.js');
  if (!fs.existsSync(appJsPath)) {
    console.log(`⚠️ Fichier App.js non trouvé: ${appJsPath}`);
    return { routes: [], issues: [] };
  }
  
  const content = fs.readFileSync(appJsPath, 'utf8');
  const routes = [];
  const issues = [];
  
  // Extraire les routes
  const routeRegex = /<Route\s+[^>]*path=["']([^"']*)["'][^>]*element=\{<([^>]*)\/?\s*>\}/g;
  let match;
  while ((match = routeRegex.exec(content)) !== null) {
    const path = match[1];
    const component = match[2];
    
    routes.push({ path, component });
    
    // Vérifier si la route correspond à la structure recommandée
    const isRecommended = Object.values(CONFIG.recommendedUrls).some(url => {
      // Convertir les paramètres de route en regex
      const pattern = new RegExp('^' + url.replace(/:\w+/g, '[^/]+') + '$');
      return pattern.test(path);
    });
    
    if (!isRecommended && !path.includes('*')) {
      issues.push({
        type: 'route',
        path,
        component,
        message: `Route non conforme à la structure recommandée: ${path}`
      });
    }
  }
  
  console.log(`✓ ${routes.length} routes analysées, ${issues.length} problèmes identifiés`);
  
  return { routes, issues };
}

// Analyser tous les liens dans le code source
function analyzeLinks() {
  console.log('\nAnalyse des liens dans le code source...');
  
  const files = findFiles(CONFIG.srcDir);
  let allLinks = [];
  const issues = [];
  
  files.forEach(filePath => {
    const links = extractLinks(filePath);
    
    links.forEach(link => {
      // Ignorer les liens externes, les ancres et les liens avec des variables
      if (link.startsWith('http') || link.startsWith('#') || link.includes('${') || link.includes('{')) {
        return;
      }
      
      allLinks.push({ link, file: filePath });
      
      if (!isValidLink(link)) {
        issues.push({
          type: 'link',
          link,
          file: filePath,
          message: `Lien non conforme à la structure recommandée: ${link}`
        });
      }
    });
  });
  
  console.log(`✓ ${allLinks.length} liens analysés, ${issues.length} problèmes identifiés`);
  
  return { links: allLinks, issues };
}

// Vérifier la correspondance entre les données et les routes
function checkDataRouteConsistency() {
  console.log('\nVérification de la correspondance entre les données et les routes...');
  
  const issues = [];
  
  // Vérifier les cols
  const colsDir = path.join(CONFIG.serverDataDir, 'cols/enriched');
  if (fs.existsSync(colsDir)) {
    const colFiles = fs.readdirSync(colsDir)
      .filter(file => file.endsWith('.json'));
    
    colFiles.forEach(file => {
      const slug = file.replace('.json', '');
      const colUrl = `/cols/${slug}`;
      
      // Vérifier si l'URL est conforme à la structure recommandée
      if (!isValidLink(colUrl)) {
        issues.push({
          type: 'data',
          file,
          url: colUrl,
          message: `URL de col non conforme à la structure recommandée: ${colUrl}`
        });
      }
    });
    
    console.log(`✓ ${colFiles.length} fichiers de cols vérifiés`);
  } else {
    console.log(`⚠️ Répertoire de cols non trouvé: ${colsDir}`);
  }
  
  // Vérifier les programmes d'entraînement
  const trainingDir = path.join(CONFIG.serverDataDir, 'training');
  if (fs.existsSync(trainingDir)) {
    const trainingFiles = fs.readdirSync(trainingDir)
      .filter(file => file.endsWith('.json'));
    
    trainingFiles.forEach(file => {
      const slug = file.replace('.json', '');
      const trainingUrl = `/entrainement/${slug}`;
      
      // Vérifier si l'URL est conforme à la structure recommandée
      if (!isValidLink(trainingUrl)) {
        issues.push({
          type: 'data',
          file,
          url: trainingUrl,
          message: `URL de programme d'entraînement non conforme à la structure recommandée: ${trainingUrl}`
        });
      }
    });
    
    console.log(`✓ ${trainingFiles.length} fichiers d'entraînement vérifiés`);
  } else {
    console.log(`⚠️ Répertoire d'entraînement non trouvé: ${trainingDir}`);
  }
  
  // Vérifier les recettes
  const recipesDir = path.join(CONFIG.serverDataDir, 'nutrition/recipes');
  if (fs.existsSync(recipesDir)) {
    const recipeFiles = fs.readdirSync(recipesDir)
      .filter(file => file.endsWith('.json'));
    
    recipeFiles.forEach(file => {
      const slug = file.replace('.json', '');
      const recipeUrl = `/nutrition/recettes/${slug}`;
      
      // Vérifier si l'URL est conforme à la structure recommandée
      if (!isValidLink(recipeUrl)) {
        issues.push({
          type: 'data',
          file,
          url: recipeUrl,
          message: `URL de recette non conforme à la structure recommandée: ${recipeUrl}`
        });
      }
    });
    
    console.log(`✓ ${recipeFiles.length} fichiers de recettes vérifiés`);
  } else {
    console.log(`⚠️ Répertoire de recettes non trouvé: ${recipesDir}`);
  }
  
  return issues;
}

// Générer un rapport sur la structure d'URL
function generateReport(routesAnalysis, linksAnalysis, dataIssues) {
  console.log('\nGénération du rapport...');
  
  let report = '# Rapport sur la Structure d\'URL - Velo-Altitude\n\n';
  report += `*Date: ${new Date().toISOString().split('T')[0]}*\n\n`;
  
  // Statistiques
  report += '## Statistiques\n\n';
  report += `- Routes analysées: ${routesAnalysis.routes.length}\n`;
  report += `- Liens analysés: ${linksAnalysis.links.length}\n`;
  report += `- Problèmes de routes: ${routesAnalysis.issues.length}\n`;
  report += `- Problèmes de liens: ${linksAnalysis.issues.length}\n`;
  report += `- Problèmes de correspondance données/routes: ${dataIssues.length}\n\n`;
  
  // Structure d'URL recommandée
  report += '## Structure d\'URL recommandée\n\n';
  report += '```\n';
  Object.entries(CONFIG.recommendedUrls).forEach(([key, url]) => {
    report += `${url}\n`;
  });
  report += '```\n\n';
  
  // Problèmes de routes
  if (routesAnalysis.issues.length > 0) {
    report += '## Problèmes de routes\n\n';
    routesAnalysis.issues.forEach(issue => {
      report += `- **${issue.path}** (${issue.component}): ${issue.message}\n`;
    });
    report += '\n';
  }
  
  // Problèmes de liens
  if (linksAnalysis.issues.length > 0) {
    report += '## Problèmes de liens\n\n';
    linksAnalysis.issues.forEach(issue => {
      const relativePath = path.relative(CONFIG.srcDir, issue.file);
      report += `- **${issue.link}** (${relativePath}): ${issue.message}\n`;
    });
    report += '\n';
  }
  
  // Problèmes de correspondance données/routes
  if (dataIssues.length > 0) {
    report += '## Problèmes de correspondance données/routes\n\n';
    dataIssues.forEach(issue => {
      report += `- **${issue.url}** (${issue.file}): ${issue.message}\n`;
    });
    report += '\n';
  }
  
  // Recommandations
  report += '## Recommandations\n\n';
  report += '1. **Standardiser toutes les routes** selon la structure recommandée\n';
  report += '2. **Mettre à jour tous les liens** dans le code source pour qu\'ils correspondent à la structure recommandée\n';
  report += '3. **Configurer des redirections** pour les anciennes URLs vers les nouvelles\n';
  report += '4. **Utiliser des slugs cohérents** pour tous les contenus\n';
  report += '5. **Ajouter des balises canoniques** sur toutes les pages\n\n';
  
  // Exemple de mise à jour de routes
  report += '## Exemple de mise à jour de routes\n\n';
  report += '```jsx\n';
  report += '<Routes>\n';
  report += '  <Route path="/" element={<Home />} />\n';
  report += '  <Route path="/cols" element={<ColsExplorer />} />\n';
  report += '  <Route path="/cols/:slug" element={<EnhancedColDetail />} />\n';
  report += '  <Route path="/cols/region/:region" element={<ColsExplorer />} />\n';
  report += '  <Route path="/entrainement" element={<TrainingModule />} />\n';
  report += '  <Route path="/entrainement/:slug" element={<EnhancedTrainingDetail />} />\n';
  report += '  <Route path="/nutrition" element={<NutritionPlanner />} />\n';
  report += '  <Route path="/nutrition/recettes/:slug" element={<EnhancedRecipeDetail />} />\n';
  report += '  <Route path="/nutrition/plans/:slug" element={<NutritionPlanner />} />\n';
  report += '  <Route path="/7-majeurs" element={<SevenMajorsChallenge />} />\n';
  report += '  <Route path="/7-majeurs/:slug" element={<SevenMajorsChallenge />} />\n';
  report += '  <Route path="/visualisation-3d" element={<EnhancedRouteAlternatives />} />\n';
  report += '  <Route path="/visualisation-3d/:slug" element={<EnhancedRouteAlternatives />} />\n';
  report += '  <Route path="/communaute" element={<EnhancedSocialHub />} />\n';
  report += '  <Route path="/communaute/evenements" element={<EnhancedSocialHub />} />\n';
  report += '  <Route path="/communaute/sorties" element={<EnhancedSocialHub />} />\n';
  report += '  <Route path="*" element={<NotFound />} />\n';
  report += '</Routes>\n';
  report += '```\n\n';
  
  // Exemple de redirections
  report += '## Exemple de redirections\n\n';
  report += '```jsx\n';
  report += '// Dans un composant de redirection\n';
  report += 'const redirects = {\n';
  report += '  \'/training\': \'/entrainement\',\n';
  report += '  \'/training/:id\': \'/entrainement/:id\',\n';
  report += '  \'/nutrition/:id\': \'/nutrition/plans/:id\',\n';
  report += '  \'/seven-majors\': \'/7-majeurs\',\n';
  report += '  \'/seven-majors/:id\': \'/7-majeurs/:id\',\n';
  report += '  \'/routes\': \'/visualisation-3d\',\n';
  report += '  \'/routes/:id\': \'/visualisation-3d/:id\',\n';
  report += '  \'/social\': \'/communaute\',\n';
  report += '  \'/challenges\': \'/communaute/evenements\'\n';
  report += '};\n';
  report += '```\n';
  
  // Écrire le rapport
  fs.writeFileSync(CONFIG.reportPath, report, 'utf8');
  console.log(`✓ Rapport généré: ${CONFIG.reportPath}`);
}

// Générer un fichier de redirections pour Netlify
function generateNetlifyRedirects() {
  console.log('\nGénération du fichier de redirections Netlify...');
  
  const redirects = [
    '/training/* /entrainement/:splat 301',
    '/nutrition/recipes/* /nutrition/recettes/:splat 301',
    '/seven-majors/* /7-majeurs/:splat 301',
    '/routes/* /visualisation-3d/:splat 301',
    '/social/* /communaute/:splat 301',
    '/challenges/* /communaute/evenements/:splat 301'
  ];
  
  const netlifyToml = `
# Fichier de configuration Netlify pour Velo-Altitude
# Redirections pour standardiser les URLs

[build]
  publish = "build"

[[redirects]]
  from = "/training/*"
  to = "/entrainement/:splat"
  status = 301

[[redirects]]
  from = "/nutrition/recipes/*"
  to = "/nutrition/recettes/:splat"
  status = 301

[[redirects]]
  from = "/seven-majors/*"
  to = "/7-majeurs/:splat"
  status = 301

[[redirects]]
  from = "/routes/*"
  to = "/visualisation-3d/:splat"
  status = 301

[[redirects]]
  from = "/social/*"
  to = "/communaute/:splat"
  status = 301

[[redirects]]
  from = "/challenges/*"
  to = "/communaute/evenements/:splat"
  status = 301

# Fallback pour SPA
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;
  
  const netlifyTomlPath = path.join(__dirname, '../netlify.toml');
  fs.writeFileSync(netlifyTomlPath, netlifyToml, 'utf8');
  
  console.log(`✓ Fichier de redirections Netlify généré: ${netlifyTomlPath}`);
}

// Fonction principale
async function main() {
  console.log('=== Vérification et optimisation de la structure d\'URL - Velo-Altitude ===\n');
  
  // Analyser les routes
  const routesAnalysis = analyzeRoutes();
  
  // Analyser les liens
  const linksAnalysis = analyzeLinks();
  
  // Vérifier la correspondance entre les données et les routes
  const dataIssues = checkDataRouteConsistency();
  
  // Générer un rapport
  generateReport(routesAnalysis, linksAnalysis, dataIssues);
  
  // Générer un fichier de redirections Netlify
  generateNetlifyRedirects();
  
  console.log('\n=== Vérification terminée avec succès ===');
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(`Erreur lors de l'exécution du script: ${error.message}`);
});
