/**
 * Service de Gestion du Sitemap
 * Fournit des fonctionnalités pour générer et gérer le sitemap du site
 */

import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ENV } from '../config/environment';

// Constantes
const BASE_URL = ENV.app.siteUrl || 'https://velo-altitude.com';
const CURRENT_DATE = format(new Date(), 'yyyy-MM-dd');
const API_BASE_URL = ENV.app.apiUrl || 'https://api.velo-altitude.com';

/**
 * Génère le contenu XML du sitemap principal
 * @returns {string} - Contenu XML du sitemap
 */
export const generateMainSitemap = async () => {
  try {
    // Récupérer la liste des sections principales
    const sections = [
      { url: '/', changefreq: 'daily', priority: '1.0' },
      { url: '/cols', changefreq: 'weekly', priority: '0.9' },
      { url: '/programs', changefreq: 'weekly', priority: '0.9' },
      { url: '/nutrition', changefreq: 'weekly', priority: '0.9' },
      { url: '/challenges', changefreq: 'weekly', priority: '0.9' },
      { url: '/coach', changefreq: 'monthly', priority: '0.7' },
      { url: '/routes', changefreq: 'monthly', priority: '0.7' },
      { url: '/social', changefreq: 'daily', priority: '0.8' },
      { url: '/seven-majors', changefreq: 'monthly', priority: '0.9' }
    ];
    
    // Générer le XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Ajouter les sections principales
    sections.forEach(section => {
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}${section.url}</loc>\n`;
      xml += `    <changefreq>${section.changefreq}</changefreq>\n`;
      xml += `    <priority>${section.priority}</priority>\n`;
      xml += `    <lastmod>${CURRENT_DATE}</lastmod>\n`;
      xml += '  </url>\n';
    });
    
    xml += '</urlset>';
    
    return xml;
  } catch (error) {
    console.error('Erreur lors de la génération du sitemap principal:', error);
    throw new Error('Erreur lors de la génération du sitemap principal');
  }
};

/**
 * Génère le sitemap des cols
 * @returns {string} - Contenu XML du sitemap des cols
 */
export const generateColsSitemap = async () => {
  try {
    // Récupérer la liste des cols depuis l'API
    const response = await axios.get(`${API_BASE_URL}/cols`);
    const cols = response.data;
    
    // Générer le XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Ajouter la page principale des cols
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/cols</loc>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += `    <lastmod>${CURRENT_DATE}</lastmod>\n`;
    xml += '  </url>\n';
    
    // Ajouter les sous-catégories
    const subcategories = ['alpes', 'pyrenees', 'massif-central', 'vosges', 'jura', 'italie', 'espagne', 'suisse'];
    subcategories.forEach(subcat => {
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}/cols/${subcat}</loc>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += `    <lastmod>${CURRENT_DATE}</lastmod>\n`;
      xml += '  </url>\n';
    });
    
    // Ajouter chaque col
    cols.forEach(col => {
      xml += '  <url>\n';
      xml += `    <loc>${BASE_URL}/cols/${col.slug}</loc>\n`;
      xml += '    <changefreq>monthly</changefreq>\n';
      xml += '    <priority>0.6</priority>\n';
      xml += `    <lastmod>${col.last_updated || CURRENT_DATE}</lastmod>\n`;
      
      // Ajouter les hreflang si le contenu existe en plusieurs langues
      if (col.name && col.name.en) {
        xml += `    <xhtml:link rel="alternate" hreflang="fr" href="${BASE_URL}/cols/${col.slug}" />\n`;
        xml += `    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/en/cols/${col.slug}" />\n`;
      }
      
      xml += '  </url>\n';
    });
    
    xml += '</urlset>';
    
    return xml;
  } catch (error) {
    console.error('Erreur lors de la génération du sitemap des cols:', error);
    // En cas d'erreur, générer un sitemap minimal
    return generateFallbackColsSitemap();
  }
};

/**
 * Génère un sitemap de secours pour les cols en cas d'erreur API
 * @returns {string} - Contenu XML du sitemap de secours
 */
const generateFallbackColsSitemap = () => {
  // Données de secours
  const fallbackCols = [
    { slug: 'alpe-dhuez', last_updated: '2023-10-15' },
    { slug: 'col-du-tourmalet', last_updated: '2023-10-10' },
    { slug: 'col-du-galibier', last_updated: '2023-09-20' },
    { slug: 'col-de-la-bonette', last_updated: '2023-09-15' },
    { slug: 'col-izoard', last_updated: '2023-09-05' },
    { slug: 'col-du-telegraphe', last_updated: '2023-08-25' },
    { slug: 'mont-ventoux', last_updated: '2023-08-20' },
    { slug: 'passo-dello-stelvio', last_updated: '2023-08-15' }
  ];
  
  // Générer le XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Ajouter la page principale des cols et les sous-catégories
  xml += '  <url>\n';
  xml += `    <loc>${BASE_URL}/cols</loc>\n`;
  xml += '    <changefreq>weekly</changefreq>\n';
  xml += '    <priority>0.8</priority>\n';
  xml += `    <lastmod>${CURRENT_DATE}</lastmod>\n`;
  xml += '  </url>\n';
  
  // Ajouter les sous-catégories
  const subcategories = ['alpes', 'pyrenees', 'italie', 'espagne'];
  subcategories.forEach(subcat => {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/cols/${subcat}</loc>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += `    <lastmod>${CURRENT_DATE}</lastmod>\n`;
    xml += '  </url>\n';
  });
  
  // Ajouter les cols de secours
  fallbackCols.forEach(col => {
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}/cols/${col.slug}</loc>\n`;
    xml += '    <changefreq>monthly</changefreq>\n';
    xml += '    <priority>0.6</priority>\n';
    xml += `    <lastmod>${col.last_updated}</lastmod>\n`;
    xml += '  </url>\n';
  });
  
  xml += '</urlset>';
  
  return xml;
};

/**
 * Génère un sitemap index contenant tous les autres sitemaps
 * @returns {string} - Contenu XML du sitemap index
 */
export const generateSitemapIndex = async () => {
  // Liste des sitemaps
  const sitemaps = [
    { name: 'sitemap-main.xml', lastmod: CURRENT_DATE },
    { name: 'sitemap-cols.xml', lastmod: CURRENT_DATE },
    { name: 'sitemap-programs.xml', lastmod: CURRENT_DATE },
    { name: 'sitemap-nutrition.xml', lastmod: CURRENT_DATE },
    { name: 'sitemap-challenges.xml', lastmod: CURRENT_DATE }
  ];
  
  // Générer le XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Ajouter chaque sitemap
  sitemaps.forEach(sitemap => {
    xml += '  <sitemap>\n';
    xml += `    <loc>${BASE_URL}/${sitemap.name}</loc>\n`;
    xml += `    <lastmod>${sitemap.lastmod}</lastmod>\n`;
    xml += '  </sitemap>\n';
  });
  
  xml += '</sitemapindex>';
  
  return xml;
};

/**
 * Configure les entêtes HTTP pour optimiser l'indexation
 * @param {Object} headers - Objet headers HTTP à modifier
 * @returns {Object} - Objet headers modifié
 */
export const configureIndexationHeaders = (headers = {}) => {
  // Entêtes pour améliorer l'indexation
  headers['X-Robots-Tag'] = 'index, follow';
  headers['Link'] = `<${BASE_URL}/sitemap.xml>; rel="sitemap"`;
  return headers;
};

export default {
  generateMainSitemap,
  generateColsSitemap,
  generateSitemapIndex,
  configureIndexationHeaders
};
