/**
 * Script de génération de sitemap et standardisation des URLs
 * Velo-Altitude
 * 
 * Ce script analyse la structure du site, standardise les URLs
 * et génère un fichier sitemap.xml pour améliorer le référencement.
 */

const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

// Configuration
const CONFIG = {
  baseUrl: 'https://velo-altitude.com',
  outputDir: path.join(__dirname, '../public'),
  dataDir: path.join(__dirname, '../src/data'),
  colsDir: path.join(__dirname, '../src/data/cols'),
  routesFile: path.join(__dirname, '../src/routes.js'),
  reportPath: path.join(__dirname, '../docs/sitemap-report.md'),
  // Sections principales du site
  mainSections: [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/cols', priority: '0.9', changefreq: 'weekly' },
    { path: '/entrainement', priority: '0.8', changefreq: 'monthly' },
    { path: '/nutrition', priority: '0.8', changefreq: 'monthly' },
    { path: '/7-majeurs', priority: '0.9', changefreq: 'weekly' },
    { path: '/visualisation-3d', priority: '0.8', changefreq: 'monthly' },
    { path: '/communaute', priority: '0.7', changefreq: 'weekly' }
  ]
};

// Charger les données des cols
function loadColsData() {
  console.log('Chargement des données des cols...');
  
  let allCols = [];
  
  try {
    // Essayer de charger depuis colsData.js
    const colsDataPath = path.join(CONFIG.dataDir, 'colsData.js');
    if (fs.existsSync(colsDataPath)) {
      delete require.cache[require.resolve(colsDataPath)];
      const colsData = require(colsDataPath);
      
      if (typeof colsData.getAllCols === 'function') {
        allCols = colsData.getAllCols();
        console.log(`✓ Chargé ${allCols.length} cols depuis colsData.js`);
      }
    }
    
    // Si aucun col n'a été chargé, essayer de charger depuis les fichiers individuels
    if (allCols.length === 0 && fs.existsSync(CONFIG.colsDir)) {
      const colFiles = fs.readdirSync(CONFIG.colsDir)
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(CONFIG.colsDir, file));
      
      colFiles.forEach(filePath => {
        try {
          delete require.cache[require.resolve(filePath)];
          const colsData = require(filePath);
          
          if (Array.isArray(colsData)) {
            allCols = [...allCols, ...colsData];
          } else if (colsData.default && Array.isArray(colsData.default)) {
            allCols = [...allCols, ...colsData.default];
          }
        } catch (error) {
          console.error(`Erreur lors du chargement de ${filePath}: ${error.message}`);
        }
      });
      
      console.log(`✓ Chargé ${allCols.length} cols depuis les fichiers individuels`);
    }
  } catch (error) {
    console.error(`Erreur lors du chargement des cols: ${error.message}`);
  }
  
  return allCols;
}

// Charger les données des programmes d'entraînement
function loadTrainingData() {
  console.log('Chargement des données d\'entraînement...');
  
  let trainingPrograms = [];
  
  try {
    const trainingDir = path.join(CONFIG.dataDir, 'training');
    
    if (fs.existsSync(trainingDir)) {
      const trainingFiles = fs.readdirSync(trainingDir)
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(trainingDir, file));
      
      trainingFiles.forEach(filePath => {
        try {
          delete require.cache[require.resolve(filePath)];
          const trainingData = require(filePath);
          
          if (Array.isArray(trainingData)) {
            trainingPrograms = [...trainingPrograms, ...trainingData];
          } else if (trainingData.default && Array.isArray(trainingData.default)) {
            trainingPrograms = [...trainingPrograms, ...trainingData.default];
          }
        } catch (error) {
          console.error(`Erreur lors du chargement de ${filePath}: ${error.message}`);
        }
      });
    }
  } catch (error) {
    console.error(`Erreur lors du chargement des programmes d'entraînement: ${error.message}`);
  }
  
  console.log(`✓ Chargé ${trainingPrograms.length} programmes d'entraînement`);
  return trainingPrograms;
}

// Charger les données nutritionnelles
function loadNutritionData() {
  console.log('Chargement des données nutritionnelles...');
  
  let nutritionData = [];
  
  try {
    // Essayer de charger les recettes
    const recipesPath = path.join(CONFIG.dataDir, 'nutritionRecipes.js');
    if (fs.existsSync(recipesPath)) {
      delete require.cache[require.resolve(recipesPath)];
      const recipes = require(recipesPath);
      
      if (Array.isArray(recipes)) {
        nutritionData = [...nutritionData, ...recipes];
      } else if (recipes.default && Array.isArray(recipes.default)) {
        nutritionData = [...nutritionData, ...recipes.default];
      }
    }
    
    // Essayer de charger les plans nutritionnels
    const plansPath = path.join(CONFIG.dataDir, 'nutritionPlans.js');
    if (fs.existsSync(plansPath)) {
      delete require.cache[require.resolve(plansPath)];
      const plans = require(plansPath);
      
      if (Array.isArray(plans)) {
        nutritionData = [...nutritionData, ...plans];
      } else if (plans.default && Array.isArray(plans.default)) {
        nutritionData = [...nutritionData, ...plans.default];
      }
    }
  } catch (error) {
    console.error(`Erreur lors du chargement des données nutritionnelles: ${error.message}`);
  }
  
  console.log(`✓ Chargé ${nutritionData.length} éléments nutritionnels`);
  return nutritionData;
}

// Générer le sitemap XML
function generateSitemap(cols, trainingPrograms, nutritionData) {
  console.log('\nGénération du sitemap XML...');
  
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Ajouter les sections principales
  CONFIG.mainSections.forEach(section => {
    sitemap += '  <url>\n';
    sitemap += `    <loc>${CONFIG.baseUrl}${section.path}</loc>\n`;
    sitemap += `    <changefreq>${section.changefreq}</changefreq>\n`;
    sitemap += `    <priority>${section.priority}</priority>\n`;
    sitemap += '  </url>\n';
  });
  
  // Ajouter les cols
  cols.forEach(col => {
    const slug = col.slug || (col.name ? slugify(col.name, { lower: true, strict: true }) : null);
    
    if (slug) {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${CONFIG.baseUrl}/cols/${slug}</loc>\n`;
      sitemap += '    <changefreq>monthly</changefreq>\n';
      sitemap += '    <priority>0.7</priority>\n';
      sitemap += '  </url>\n';
    }
  });
  
  // Ajouter les programmes d'entraînement
  trainingPrograms.forEach(program => {
    const slug = program.slug || (program.name ? slugify(program.name, { lower: true, strict: true }) : null);
    
    if (slug) {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${CONFIG.baseUrl}/entrainement/${slug}</loc>\n`;
      sitemap += '    <changefreq>monthly</changefreq>\n';
      sitemap += '    <priority>0.6</priority>\n';
      sitemap += '  </url>\n';
    }
  });
  
  // Ajouter les éléments nutritionnels
  nutritionData.forEach(item => {
    const slug = item.slug || (item.name ? slugify(item.name, { lower: true, strict: true }) : null);
    const type = item.type === 'plan' ? 'plans' : 'recettes';
    
    if (slug) {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${CONFIG.baseUrl}/nutrition/${type}/${slug}</loc>\n`;
      sitemap += '    <changefreq>monthly</changefreq>\n';
      sitemap += '    <priority>0.6</priority>\n';
      sitemap += '  </url>\n';
    }
  });
  
  sitemap += '</urlset>';
  
  // Sauvegarder le sitemap
  const sitemapPath = path.join(CONFIG.outputDir, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap, 'utf8');
  
  console.log(`✓ Sitemap généré: ${sitemapPath}`);
  return sitemap;
}

// Générer un rapport sur les URLs
function generateReport(cols, trainingPrograms, nutritionData, sitemap) {
  console.log('\nGénération du rapport d\'URLs...');
  
  let report = '# Rapport de standardisation des URLs - Velo-Altitude\n\n';
  report += `*Date: ${new Date().toISOString().split('T')[0]}*\n\n`;
  
  // Statistiques
  report += '## Statistiques\n\n';
  report += `- URLs principales: ${CONFIG.mainSections.length}\n`;
  report += `- URLs de cols: ${cols.length}\n`;
  report += `- URLs de programmes d'entraînement: ${trainingPrograms.length}\n`;
  report += `- URLs de contenu nutritionnel: ${nutritionData.length}\n`;
  report += `- Total d'URLs dans le sitemap: ${(sitemap.match(/<url>/g) || []).length}\n\n`;
  
  // Structure d'URL
  report += '## Structure d\'URL standardisée\n\n';
  report += '```\n';
  report += '/                                  # Page d\'accueil\n';
  report += '/cols                              # Liste des cols\n';
  report += '/cols/{slug}                       # Détail d\'un col\n';
  report += '/entrainement                      # Liste des programmes d\'entraînement\n';
  report += '/entrainement/{slug}               # Détail d\'un programme\n';
  report += '/nutrition                         # Page principale nutrition\n';
  report += '/nutrition/recettes                # Liste des recettes\n';
  report += '/nutrition/recettes/{slug}         # Détail d\'une recette\n';
  report += '/nutrition/plans                   # Liste des plans nutritionnels\n';
  report += '/nutrition/plans/{slug}            # Détail d\'un plan\n';
  report += '/7-majeurs                         # Concept "Les 7 Majeurs"\n';
  report += '/7-majeurs/{slug}                  # Défi spécifique\n';
  report += '/visualisation-3d                  # Visualisation 3D des cols\n';
  report += '/visualisation-3d/{slug}           # Visualisation 3D d\'un col spécifique\n';
  report += '/communaute                        # Page communauté\n';
  report += '/communaute/evenements             # Événements communautaires\n';
  report += '/communaute/sorties                # Sorties organisées\n';
  report += '```\n\n';
  
  // Recommandations
  report += '## Recommandations\n\n';
  report += '1. **Mettre à jour les routes React Router** pour suivre cette structure d\'URL\n';
  report += '2. **Configurer des redirections** pour les anciennes URLs vers les nouvelles\n';
  report += '3. **Ajouter le sitemap.xml** au fichier robots.txt\n';
  report += '4. **Soumettre le sitemap** à Google Search Console et Bing Webmaster Tools\n';
  report += '5. **Standardiser les slugs** pour tous les contenus\n';
  report += '6. **Implémenter des balises canoniques** sur toutes les pages\n\n';
  
  // Exemple de robots.txt
  report += '## Exemple de robots.txt\n\n';
  report += '```\n';
  report += 'User-agent: *\n';
  report += 'Allow: /\n\n';
  report += 'Sitemap: https://velo-altitude.com/sitemap.xml\n';
  report += '```\n\n';
  
  // Écrire le rapport
  fs.writeFileSync(CONFIG.reportPath, report, 'utf8');
  console.log(`✓ Rapport généré: ${CONFIG.reportPath}`);
}

// Générer un fichier robots.txt
function generateRobotsTxt() {
  console.log('\nGénération du fichier robots.txt...');
  
  const robotsTxt = `# robots.txt for Velo-Altitude
User-agent: *
Allow: /

Sitemap: ${CONFIG.baseUrl}/sitemap.xml
`;
  
  const robotsPath = path.join(CONFIG.outputDir, 'robots.txt');
  fs.writeFileSync(robotsPath, robotsTxt, 'utf8');
  
  console.log(`✓ Fichier robots.txt généré: ${robotsPath}`);
}

// Fonction principale
async function main() {
  console.log('=== Génération de sitemap et standardisation des URLs - Velo-Altitude ===\n');
  
  // S'assurer que le répertoire de sortie existe
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  
  // Charger les données
  const cols = loadColsData();
  const trainingPrograms = loadTrainingData();
  const nutritionData = loadNutritionData();
  
  // Générer le sitemap
  const sitemap = generateSitemap(cols, trainingPrograms, nutritionData);
  
  // Générer le robots.txt
  generateRobotsTxt();
  
  // Générer le rapport
  generateReport(cols, trainingPrograms, nutritionData, sitemap);
  
  console.log('\n=== Génération terminée avec succès ===');
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(`Erreur lors de l'exécution du script: ${error.message}`);
});
