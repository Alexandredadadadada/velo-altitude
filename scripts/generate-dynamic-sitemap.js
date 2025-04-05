/**
 * Système de génération de sitemap dynamique pour Velo-Altitude
 * 
 * Ce script génère un sitemap.xml complet qui :
 * - Reflète la nouvelle structure d'URL standardisée
 * - Implémente des priorités et fréquences appropriées par type de contenu
 * - Inclut des sitemaps spécifiques pour les images et vidéos
 * - Optimise l'indexation par les moteurs de recherche
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Configuration
const CONFIG = {
  rootDir: path.resolve(__dirname, '..'),
  outputDir: path.resolve(__dirname, '../public'),
  serverDataDir: path.resolve(__dirname, '../server/data'),
  baseUrl: 'https://velo-altitude.com',
  lastModified: new Date().toISOString().split('T')[0],
  contentTypes: [
    {
      name: 'Cols',
      dirPath: 'server/data/cols',
      urlPattern: '/cols/:country/:slug',
      priority: 1.0,
      changefreq: 'monthly',
      hasImages: true,
      hasVideos: true
    },
    {
      name: 'Programmes d\'entraînement',
      dirPath: 'server/data/training',
      urlPattern: '/entrainement/:level/:slug',
      priority: 0.8,
      changefreq: 'monthly',
      hasImages: true,
      hasVideos: false
    },
    {
      name: 'Contenu nutritionnel',
      dirPath: 'server/data/nutrition',
      urlPattern: '/nutrition/:category/:slug',
      priority: 0.7,
      changefreq: 'monthly',
      hasImages: true,
      hasVideos: false
    },
    {
      name: 'Défis',
      dirPath: 'server/data/challenges',
      urlPattern: '/defis/:type/:slug',
      priority: 0.9,
      changefreq: 'weekly',
      hasImages: true,
      hasVideos: false
    },
    {
      name: 'Visualisations 3D',
      dirPath: 'server/data/visualization',
      urlPattern: '/visualisation-3d/:country/:slug',
      priority: 0.9,
      changefreq: 'monthly',
      hasImages: true,
      hasVideos: true
    },
    {
      name: 'Communauté',
      dirPath: 'server/data/community',
      urlPattern: '/communaute/:section/:slug',
      priority: 0.6,
      changefreq: 'weekly',
      hasImages: true,
      hasVideos: false
    }
  ],
  // Pages statiques principales
  staticPages: [
    { url: '/', priority: 1.0, changefreq: 'weekly' },
    { url: '/cols', priority: 0.9, changefreq: 'weekly' },
    { url: '/entrainement', priority: 0.8, changefreq: 'weekly' },
    { url: '/nutrition', priority: 0.8, changefreq: 'weekly' },
    { url: '/defis', priority: 0.8, changefreq: 'weekly' },
    { url: '/visualisation-3d', priority: 0.8, changefreq: 'monthly' },
    { url: '/communaute', priority: 0.7, changefreq: 'daily' },
    { url: '/a-propos', priority: 0.5, changefreq: 'monthly' },
    { url: '/contact', priority: 0.5, changefreq: 'monthly' },
    { url: '/mentions-legales', priority: 0.3, changefreq: 'yearly' },
    { url: '/confidentialite', priority: 0.3, changefreq: 'yearly' }
  ]
};

// Récupérer toutes les données d'un répertoire
function getDataFromDirectory(dirPath, subCategory = null) {
  const fullPath = path.resolve(CONFIG.rootDir, dirPath, subCategory || '');
  
  if (!fs.existsSync(fullPath)) {
    return [];
  }
  
  const items = [];
  const files = fs.readdirSync(fullPath, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(fullPath, file.name);
    
    if (file.isDirectory()) {
      // Récursion pour les sous-répertoires
      const subItems = getDataFromDirectory(dirPath, path.join(subCategory || '', file.name));
      items.push(...subItems);
    } else if (file.name.endsWith('.json')) {
      try {
        // Lire le fichier JSON
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Ajouter des métadonnées sur le fichier
        items.push({
          ...data,
          _filePath: filePath,
          _fileName: file.name,
          _subCategory: subCategory,
          _lastMod: fs.statSync(filePath).mtime.toISOString().split('T')[0]
        });
      } catch (error) {
        console.error(chalk.red(`Erreur lors de la lecture de ${filePath}: ${error.message}`));
      }
    }
  }
  
  return items;
}

// Générer l'URL complète pour un élément
function generateUrl(urlPattern, item) {
  let url = urlPattern;
  
  // Remplacer les paramètres dans le pattern
  if (item._subCategory) {
    url = url.replace(':country', item._subCategory)
             .replace(':level', item._subCategory)
             .replace(':category', item._subCategory)
             .replace(':type', item._subCategory)
             .replace(':section', item._subCategory);
  }
  
  if (item.slug) {
    url = url.replace(':slug', item.slug);
  } else if (item.id) {
    url = url.replace(':slug', item.id);
  }
  
  return url;
}

// Générer les entrées du sitemap principal
function generateSitemapEntries(contentType, items) {
  console.log(chalk.blue(`Génération des entrées du sitemap pour ${contentType.name}...`));
  
  let entries = '';
  
  items.forEach(item => {
    const relativeUrl = generateUrl(contentType.urlPattern, item);
    const fullUrl = `${CONFIG.baseUrl}${relativeUrl}`;
    const lastmod = item._lastMod || item.last_updated || CONFIG.lastModified;
    
    entries += `  <url>\n`;
    entries += `    <loc>${fullUrl}</loc>\n`;
    entries += `    <lastmod>${lastmod}</lastmod>\n`;
    entries += `    <changefreq>${contentType.changefreq}</changefreq>\n`;
    entries += `    <priority>${contentType.priority}</priority>\n`;
    
    // Ajouter des extensions pour les images si disponibles
    if (contentType.hasImages && item.images && item.images.length > 0) {
      item.images.forEach(img => {
        if (typeof img === 'string') {
          const imgUrl = img.startsWith('http') ? img : `${CONFIG.baseUrl}${img}`;
          entries += `    <image:image>\n`;
          entries += `      <image:loc>${imgUrl}</image:loc>\n`;
          
          // Ajouter le titre et la légende si disponibles
          if (item.name) {
            const title = typeof item.name === 'object' ? item.name.fr : item.name;
            entries += `      <image:title>${escapeXml(title)}</image:title>\n`;
          }
          
          entries += `    </image:image>\n`;
        }
      });
    }
    
    // Ajouter des extensions pour les vidéos si disponibles
    if (contentType.hasVideos && item.videos && item.videos.length > 0) {
      item.videos.forEach(video => {
        if (typeof video === 'object' && video.url) {
          const videoUrl = video.url.startsWith('http') ? video.url : `${CONFIG.baseUrl}${video.url}`;
          entries += `    <video:video>\n`;
          entries += `      <video:thumbnail_loc>${CONFIG.baseUrl}${video.thumbnail || '/images/video-thumbnail-default.jpg'}</video:thumbnail_loc>\n`;
          entries += `      <video:title>${escapeXml(video.title || item.name)}</video:title>\n`;
          entries += `      <video:description>${escapeXml(video.description || item.description || '')}</video:description>\n`;
          entries += `      <video:content_loc>${videoUrl}</video:content_loc>\n`;
          entries += `      <video:player_loc>${videoUrl}</video:player_loc>\n`;
          entries += `      <video:duration>${video.duration || 0}</video:duration>\n`;
          entries += `    </video:video>\n`;
        }
      });
    }
    
    entries += `  </url>\n`;
  });
  
  return entries;
}

// Générer les entrées pour les pages statiques
function generateStaticPageEntries() {
  console.log(chalk.blue('Génération des entrées du sitemap pour les pages statiques...'));
  
  let entries = '';
  
  CONFIG.staticPages.forEach(page => {
    const fullUrl = `${CONFIG.baseUrl}${page.url}`;
    
    entries += `  <url>\n`;
    entries += `    <loc>${fullUrl}</loc>\n`;
    entries += `    <lastmod>${CONFIG.lastModified}</lastmod>\n`;
    entries += `    <changefreq>${page.changefreq}</changefreq>\n`;
    entries += `    <priority>${page.priority}</priority>\n`;
    entries += `  </url>\n`;
  });
  
  return entries;
}

// Générer les entrées pour les catégories et sous-catégories
function generateCategoryEntries() {
  console.log(chalk.blue('Génération des entrées du sitemap pour les catégories...'));
  
  let entries = '';
  
  CONFIG.contentTypes.forEach(contentType => {
    // Page principale de la catégorie
    const mainUrl = contentType.urlPattern.split('/')[1];
    const fullUrl = `${CONFIG.baseUrl}/${mainUrl}`;
    
    entries += `  <url>\n`;
    entries += `    <loc>${fullUrl}</loc>\n`;
    entries += `    <lastmod>${CONFIG.lastModified}</lastmod>\n`;
    entries += `    <changefreq>weekly</changefreq>\n`;
    entries += `    <priority>0.8</priority>\n`;
    entries += `  </url>\n`;
    
    // Sous-catégories si détectées
    const subCategories = new Set();
    
    // Parcourir les fichiers pour détecter les sous-catégories existantes
    const dirPath = path.resolve(CONFIG.rootDir, contentType.dirPath);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath, { withFileTypes: true });
      
      files.forEach(file => {
        if (file.isDirectory()) {
          subCategories.add(file.name);
        }
      });
    }
    
    // Ajouter les entrées pour chaque sous-catégorie
    subCategories.forEach(subCategory => {
      let subCategoryUrl = '';
      
      if (contentType.urlPattern.includes(':country')) {
        subCategoryUrl = `/${mainUrl}/${subCategory}`;
      } else if (contentType.urlPattern.includes(':level')) {
        subCategoryUrl = `/${mainUrl}/${subCategory}`;
      } else if (contentType.urlPattern.includes(':category')) {
        subCategoryUrl = `/${mainUrl}/${subCategory}`;
      } else if (contentType.urlPattern.includes(':type')) {
        subCategoryUrl = `/${mainUrl}/${subCategory}`;
      } else if (contentType.urlPattern.includes(':section')) {
        subCategoryUrl = `/${mainUrl}/${subCategory}`;
      }
      
      if (subCategoryUrl) {
        const fullSubCategoryUrl = `${CONFIG.baseUrl}${subCategoryUrl}`;
        
        entries += `  <url>\n`;
        entries += `    <loc>${fullSubCategoryUrl}</loc>\n`;
        entries += `    <lastmod>${CONFIG.lastModified}</lastmod>\n`;
        entries += `    <changefreq>weekly</changefreq>\n`;
        entries += `    <priority>0.7</priority>\n`;
        entries += `  </url>\n`;
      }
    });
  });
  
  return entries;
}

// Échapper les caractères spéciaux XML
function escapeXml(unsafe) {
  if (!unsafe) {
    return '';
  }
  
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Générer le sitemap principal
function generateMainSitemap(allItems) {
  console.log(chalk.blue('\nGénération du sitemap principal...'));
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
`;
  
  // Ajouter les entrées des pages statiques
  sitemap += generateStaticPageEntries();
  
  // Ajouter les entrées pour les catégories et sous-catégories
  sitemap += generateCategoryEntries();
  
  // Ajouter les entrées pour chaque type de contenu
  CONFIG.contentTypes.forEach(contentType => {
    const items = allItems[contentType.name] || [];
    sitemap += generateSitemapEntries(contentType, items);
  });
  
  sitemap += `</urlset>`;
  
  // Écrire le fichier
  const mainSitemapPath = path.join(CONFIG.outputDir, 'sitemap.xml');
  fs.writeFileSync(mainSitemapPath, sitemap);
  console.log(chalk.green(`✓ Sitemap principal généré: ${mainSitemapPath}`));
  
  return mainSitemapPath;
}

// Générer un sitemap d'index pour plusieurs sitemaps
function generateSitemapIndex(sitemaps) {
  console.log(chalk.blue('\nGénération de l\'index sitemap...'));
  
  let sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;
  
  sitemaps.forEach(sitemap => {
    const relativePath = path.basename(sitemap);
    sitemapIndex += `  <sitemap>\n`;
    sitemapIndex += `    <loc>${CONFIG.baseUrl}/${relativePath}</loc>\n`;
    sitemapIndex += `    <lastmod>${CONFIG.lastModified}</lastmod>\n`;
    sitemapIndex += `  </sitemap>\n`;
  });
  
  sitemapIndex += `</sitemapindex>`;
  
  // Écrire le fichier
  const indexPath = path.join(CONFIG.outputDir, 'sitemap-index.xml');
  fs.writeFileSync(indexPath, sitemapIndex);
  console.log(chalk.green(`✓ Index de sitemap généré: ${indexPath}`));
}

// Générer un sitemap spécifique pour les images
function generateImageSitemap(allItems) {
  console.log(chalk.blue('\nGénération du sitemap spécifique pour les images...'));
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;
  
  // Filtrer les types de contenu avec des images
  const contentTypesWithImages = CONFIG.contentTypes.filter(type => type.hasImages);
  
  // Ajouter les entrées pour chaque type de contenu avec des images
  contentTypesWithImages.forEach(contentType => {
    const items = allItems[contentType.name] || [];
    
    items.forEach(item => {
      if (item.images && item.images.length > 0) {
        const relativeUrl = generateUrl(contentType.urlPattern, item);
        const fullUrl = `${CONFIG.baseUrl}${relativeUrl}`;
        
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${fullUrl}</loc>\n`;
        
        item.images.forEach(img => {
          if (typeof img === 'string') {
            const imgUrl = img.startsWith('http') ? img : `${CONFIG.baseUrl}${img}`;
            sitemap += `    <image:image>\n`;
            sitemap += `      <image:loc>${imgUrl}</image:loc>\n`;
            
            // Ajouter le titre et la légende si disponibles
            if (item.name) {
              const title = typeof item.name === 'object' ? item.name.fr : item.name;
              sitemap += `      <image:title>${escapeXml(title)}</image:title>\n`;
            }
            
            if (item.description) {
              const desc = typeof item.description === 'object' ? item.description.fr : item.description;
              const shortDesc = escapeXml(desc).substring(0, 200) + (desc.length > 200 ? '...' : '');
              sitemap += `      <image:caption>${shortDesc}</image:caption>\n`;
            }
            
            sitemap += `    </image:image>\n`;
          }
        });
        
        sitemap += `  </url>\n`;
      }
    });
  });
  
  sitemap += `</urlset>`;
  
  // Écrire le fichier
  const imageSitemapPath = path.join(CONFIG.outputDir, 'sitemap-images.xml');
  fs.writeFileSync(imageSitemapPath, sitemap);
  console.log(chalk.green(`✓ Sitemap images généré: ${imageSitemapPath}`));
  
  return imageSitemapPath;
}

// Générer un sitemap spécifique pour les vidéos
function generateVideoSitemap(allItems) {
  console.log(chalk.blue('\nGénération du sitemap spécifique pour les vidéos...'));
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
`;
  
  // Filtrer les types de contenu avec des vidéos
  const contentTypesWithVideos = CONFIG.contentTypes.filter(type => type.hasVideos);
  
  // Ajouter les entrées pour chaque type de contenu avec des vidéos
  contentTypesWithVideos.forEach(contentType => {
    const items = allItems[contentType.name] || [];
    
    items.forEach(item => {
      if (item.videos && item.videos.length > 0) {
        const relativeUrl = generateUrl(contentType.urlPattern, item);
        const fullUrl = `${CONFIG.baseUrl}${relativeUrl}`;
        
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${fullUrl}</loc>\n`;
        
        item.videos.forEach(video => {
          if (typeof video === 'object' && video.url) {
            const videoUrl = video.url.startsWith('http') ? video.url : `${CONFIG.baseUrl}${video.url}`;
            sitemap += `    <video:video>\n`;
            sitemap += `      <video:thumbnail_loc>${CONFIG.baseUrl}${video.thumbnail || '/images/video-thumbnail-default.jpg'}</video:thumbnail_loc>\n`;
            sitemap += `      <video:title>${escapeXml(video.title || item.name)}</video:title>\n`;
            sitemap += `      <video:description>${escapeXml(video.description || item.description || '')}</video:description>\n`;
            sitemap += `      <video:content_loc>${videoUrl}</video:content_loc>\n`;
            sitemap += `      <video:player_loc>${videoUrl}</video:player_loc>\n`;
            sitemap += `      <video:duration>${video.duration || 0}</video:duration>\n`;
            sitemap += `    </video:video>\n`;
          }
        });
        
        sitemap += `  </url>\n`;
      }
    });
  });
  
  sitemap += `</urlset>`;
  
  // Écrire le fichier
  const videoSitemapPath = path.join(CONFIG.outputDir, 'sitemap-videos.xml');
  fs.writeFileSync(videoSitemapPath, sitemap);
  console.log(chalk.green(`✓ Sitemap vidéos généré: ${videoSitemapPath}`));
  
  return videoSitemapPath;
}

// Générer un fichier robots.txt optimisé
function generateRobotsTxt(sitemaps) {
  console.log(chalk.blue('\nGénération du fichier robots.txt...'));
  
  let robotsTxt = `# robots.txt pour Velo-Altitude
# Généré le ${new Date().toISOString().split('T')[0]}

User-agent: *
Disallow: /admin/
Disallow: /api/
Disallow: /login
Disallow: /register
Disallow: /account

# Sitemaps
`;
  
  sitemaps.forEach(sitemap => {
    const relativePath = path.basename(sitemap);
    robotsTxt += `Sitemap: ${CONFIG.baseUrl}/${relativePath}\n`;
  });
  
  // Ajouter des directives spécifiques pour les bots connus
  robotsTxt += `
# Directives spécifiques pour Google
User-agent: Googlebot
Allow: /

# Directives spécifiques pour Bing
User-agent: Bingbot
Allow: /

# Directives spécifiques pour les images
User-agent: Googlebot-Image
Allow: /images/
Allow: /photos/
Allow: /assets/

# Directives spécifiques pour les news
User-agent: Googlebot-News
Disallow: /

# Période d'exploration
Crawl-delay: 5
`;
  
  // Écrire le fichier
  const robotsTxtPath = path.join(CONFIG.outputDir, 'robots.txt');
  fs.writeFileSync(robotsTxtPath, robotsTxt);
  console.log(chalk.green(`✓ Fichier robots.txt généré: ${robotsTxtPath}`));
}

// Générer un document de bonnes pratiques pour le référencement
function generateSeoGuide() {
  console.log(chalk.blue('\nGénération du guide de bonnes pratiques SEO...'));
  
  let guide = `# Guide de Référencement (SEO) - Velo-Altitude

*Généré le ${new Date().toISOString().split('T')[0]}*

Ce document explique la stratégie de référencement (SEO) mise en place pour Velo-Altitude, notamment la structure des sitemaps, les priorités d'indexation et les bonnes pratiques pour maintenir une visibilité optimale dans les moteurs de recherche.

## Structure des Sitemaps

Le système de sitemaps de Velo-Altitude est organisé comme suit:

1. **sitemap.xml** - Le sitemap principal incluant toutes les URLs du site
2. **sitemap-images.xml** - Sitemap spécifique pour les images, optimisé pour Google Images
3. **sitemap-videos.xml** - Sitemap spécifique pour les vidéos
4. **sitemap-index.xml** - Index des sitemaps (utile lorsque le sitemap principal dépasse 50 000 URLs)

Cette architecture permet une indexation efficace et ciblée du contenu par les moteurs de recherche.

## Priorités et Fréquences de Mise à Jour

Les priorités d'indexation ont été définies selon l'importance des contenus:

| Type de contenu | Priorité | Fréquence de mise à jour |
|-----------------|----------|---------------------------|
`;
  
  // Ajouter les priorités pour chaque type de contenu
  CONFIG.contentTypes.forEach(contentType => {
    guide += `| ${contentType.name} | ${contentType.priority} | ${contentType.changefreq} |\n`;
  });
  
  guide += `
| Pages d'accueil | 1.0 | weekly |
| Pages de catégories | 0.8 | weekly |
| Pages statiques | 0.5 | monthly |

## Optimisation des Sitemaps

### Sitemap principal

Le sitemap principal inclut:
- Toutes les URLs du site
- Dates de dernière modification
- Priorités d'indexation
- Fréquences de mise à jour
- Intégration des extensions pour images et vidéos

### Sitemap d'images

Le sitemap d'images est optimisé pour:
- Améliorer l'indexation des images dans Google Images
- Fournir des titres et légendes pour chaque image
- Associer correctement les images aux pages correspondantes

### Sitemap de vidéos

Le sitemap de vidéos permet:
- Une meilleure visibilité dans les résultats de recherche vidéo
- L'affichage de miniatures pertinentes
- La communication des métadonnées importantes (durée, description)

## Maintenance du Référencement

### Génération régulière des sitemaps

Exécutez régulièrement le script de génération des sitemaps pour maintenir leur actualité:

\`\`\`bash
node scripts/generate-dynamic-sitemap.js
\`\`\`

### Soumission aux moteurs de recherche

Après chaque mise à jour majeure du contenu, soumettez le sitemap aux outils pour webmasters:
- Google Search Console
- Bing Webmaster Tools

### Surveillance de l'indexation

Vérifiez régulièrement les statistiques d'indexation dans Google Search Console pour:
- Identifier les problèmes d'indexation
- Surveiller la couverture des pages
- Repérer les erreurs d'exploration

## Recommandations pour l'ajout de contenu

1. **Images**: Incluez toujours des attributs alt descriptifs
2. **Vidéos**: Ajoutez des miniatures, titres et descriptions
3. **URLs**: Respectez la structure standardisée établie
4. **Métadonnées**: Complétez tous les champs de métadonnées (titles, descriptions)

## Intégration avec les autres systèmes SEO

Le système de sitemaps fonctionne en coordination avec:
- Les redirections intelligentes pour préserver l'historique SEO
- Les métadonnées optimisées pour chaque type de contenu
- Le système de breadcrumbs structurés
- L'optimisation des liens internes

Cette approche globale garantit une stratégie SEO cohérente et efficace.
`;
  
  // Écrire le fichier
  const seoGuidePath = path.join(CONFIG.rootDir, 'docs', 'SEO_GUIDE.md');
  fs.writeFileSync(seoGuidePath, guide);
  console.log(chalk.green(`✓ Guide de bonnes pratiques SEO généré: ${seoGuidePath}`));
}

// Fonction principale
async function main() {
  console.log(chalk.cyan('=== Génération de Sitemap Dynamique - Velo-Altitude ===\n'));
  
  // S'assurer que le répertoire de sortie existe
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    console.log(chalk.green(`✓ Répertoire de sortie créé: ${CONFIG.outputDir}`));
  }
  
  // Récupérer toutes les données pour chaque type de contenu
  const allItems = {};
  
  console.log(chalk.blue('Récupération des données...'));
  CONFIG.contentTypes.forEach(contentType => {
    const items = getDataFromDirectory(contentType.dirPath);
    allItems[contentType.name] = items;
    console.log(chalk.green(`✓ ${items.length} éléments récupérés pour ${contentType.name}`));
  });
  
  // Générer les différents sitemaps
  const mainSitemap = generateMainSitemap(allItems);
  const imageSitemap = generateImageSitemap(allItems);
  const videoSitemap = generateVideoSitemap(allItems);
  
  // Générer l'index des sitemaps
  const sitemaps = [mainSitemap, imageSitemap, videoSitemap];
  generateSitemapIndex(sitemaps);
  
  // Générer le fichier robots.txt
  generateRobotsTxt(sitemaps);
  
  // Générer le guide de bonnes pratiques SEO
  generateSeoGuide();
  
  console.log(chalk.cyan('\n=== Génération de Sitemap Dynamique terminée avec succès ==='));
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red(`Erreur lors de l'exécution du script: ${error.message}`));
});
