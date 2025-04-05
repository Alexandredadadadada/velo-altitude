/**
 * Script de génération automatique du sitemap.xml
 * 
 * Ce script analyse les routes de l'application et génère un fichier sitemap.xml
 * pour améliorer l'indexation par les moteurs de recherche.
 * 
 * Usage: node generateSitemap.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SITE_URL = 'https://www.velo-altitude.com';
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');
const LANGUAGES = ['fr', 'en'];
const DEFAULT_CHANGE_FREQ = 'weekly';
const DEFAULT_PRIORITY = '0.7';

// Routes principales de l'application
const mainRoutes = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/cols', changefreq: 'weekly', priority: '0.9' },
  { path: '/training', changefreq: 'weekly', priority: '0.9' },
  { path: '/nutrition', changefreq: 'weekly', priority: '0.9' },
  { path: '/seven-majors', changefreq: 'weekly', priority: '0.9' },
  { path: '/coach', changefreq: 'weekly', priority: '0.8' },
  { path: '/routes', changefreq: 'weekly', priority: '0.8' },
  { path: '/social', changefreq: 'weekly', priority: '0.7' },
  { path: '/sitemap', changefreq: 'monthly', priority: '0.5' },
];

// Cols emblématiques
const colsRoutes = [
  { path: '/cols/bonette', changefreq: 'monthly', priority: '0.8' },
  { path: '/cols/galibier', changefreq: 'monthly', priority: '0.8' },
  { path: '/cols/stelvio', changefreq: 'monthly', priority: '0.8' },
  { path: '/cols/tourmalet', changefreq: 'monthly', priority: '0.8' },
  { path: '/cols/izoard', changefreq: 'monthly', priority: '0.8' },
  { path: '/cols/angliru', changefreq: 'monthly', priority: '0.8' },
  { path: '/cols/mortirolo', changefreq: 'monthly', priority: '0.8' },
];

// Programmes d'entraînement
const trainingRoutes = [
  { path: '/training/plan-haute-montagne', changefreq: 'monthly', priority: '0.7' },
  { path: '/training/prep-montagne', changefreq: 'monthly', priority: '0.7' },
  { path: '/training/haute-altitude', changefreq: 'monthly', priority: '0.7' },
  { path: '/training/programs/col-crusher', changefreq: 'monthly', priority: '0.7' },
  { path: '/training/programs/endurance-builder', changefreq: 'monthly', priority: '0.7' },
  { path: '/training/programs/alpine-climber', changefreq: 'monthly', priority: '0.7' },
  { path: '/training/programs/power-intervals', changefreq: 'monthly', priority: '0.7' },
];

// Plans nutritionnels et recettes
const nutritionRoutes = [
  { path: '/nutrition/nutrition-plan-endurance', changefreq: 'monthly', priority: '0.7' },
  { path: '/nutrition/nutrition-plan-gran-fondo', changefreq: 'monthly', priority: '0.7' },
  { path: '/nutrition/nutrition-plan-mountain', changefreq: 'monthly', priority: '0.7' },
  { path: '/nutrition/recipes/energy-oatmeal', changefreq: 'monthly', priority: '0.7' },
  { path: '/nutrition/recipes/recovery-smoothie', changefreq: 'monthly', priority: '0.7' },
  { path: '/nutrition/recipes/protein-pasta', changefreq: 'monthly', priority: '0.7' },
  { path: '/nutrition/recipes/homemade-energy-bars', changefreq: 'monthly', priority: '0.7' },
  { path: '/nutrition/recipes/hydration-drink', changefreq: 'monthly', priority: '0.7' },
];

// Défis communautaires
const challengeRoutes = [
  { path: '/challenges/above-2500-challenge', changefreq: 'monthly', priority: '0.6' },
  { path: '/challenges/alpes-giants-challenge', changefreq: 'monthly', priority: '0.6' },
];

// Pages légales et informatives
const infoRoutes = [
  { path: '/about/team', changefreq: 'monthly', priority: '0.5' },
  { path: '/about/contact', changefreq: 'monthly', priority: '0.5' },
  { path: '/about/privacy', changefreq: 'monthly', priority: '0.5' },
  { path: '/about/terms', changefreq: 'monthly', priority: '0.5' },
];

// Combiner toutes les routes
const allRoutes = [
  ...mainRoutes,
  ...colsRoutes,
  ...trainingRoutes,
  ...nutritionRoutes,
  ...challengeRoutes,
  ...infoRoutes
];

// Générer le contenu XML du sitemap
function generateSitemapXml() {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml"\n';
  xml += '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n';
  xml += '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n\n';

  // Ajouter chaque URL au sitemap
  allRoutes.forEach(route => {
    const url = route.path;
    const changefreq = route.changefreq || DEFAULT_CHANGE_FREQ;
    const priority = route.priority || DEFAULT_PRIORITY;
    const lastmod = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

    xml += '  <url>\n';
    xml += `    <loc>${SITE_URL}${url}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>${changefreq}</changefreq>\n`;
    xml += `    <priority>${priority}</priority>\n`;
    
    // Ajouter les liens hreflang pour l'internationalisation
    LANGUAGES.forEach(lang => {
      const langPath = lang === 'fr' ? url : `/en${url}`;
      xml += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${SITE_URL}${langPath}"/>\n`;
    });
    
    xml += '  </url>\n';
  });

  xml += '</urlset>\n';
  return xml;
}

// Écrire le sitemap dans un fichier
function writeSitemapToFile(xml) {
  try {
    fs.writeFileSync(OUTPUT_PATH, xml);
    console.log(`Sitemap généré avec succès: ${OUTPUT_PATH}`);
    console.log(`Nombre total d'URLs: ${allRoutes.length}`);
  } catch (error) {
    console.error('Erreur lors de l\'écriture du sitemap:', error);
  }
}

// Exécuter la génération du sitemap
const sitemapXml = generateSitemapXml();
writeSitemapToFile(sitemapXml);

// Ajouter le script au package.json:
// "scripts": {
//   "generate-sitemap": "node scripts/generateSitemap.js"
// }
