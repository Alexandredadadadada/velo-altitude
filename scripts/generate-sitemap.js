/**
 * Script de génération de sitemap pour Velo-Altitude
 * 
 * Ce script analyse les données du site et génère un sitemap.xml
 * qui liste toutes les URLs du site pour faciliter l'indexation
 * par les moteurs de recherche.
 * 
 * Usage: node generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');
const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');

// Configuration
const SITE_URL = 'https://www.velo-altitude.com';
const DATA_DIR = path.join(__dirname, '../src/data');
const OUTPUT_DIR = path.join(__dirname, '../public');
const LANGUAGES = ['fr', 'en'];

// Priorités des différentes sections
const PRIORITIES = {
  home: 1.0,
  cols: 0.9,
  colDetail: 0.8,
  training: 0.8,
  trainingDetail: 0.7,
  nutrition: 0.8,
  recipeDetail: 0.7,
  sevenMajors: 0.9,
  sevenMajorsDetail: 0.8,
  blog: 0.6,
  blogPost: 0.5,
  static: 0.4
};

// Fréquences de modification
const CHANGE_FREQ = {
  home: 'daily',
  cols: 'weekly',
  colDetail: 'monthly',
  training: 'weekly',
  trainingDetail: 'monthly',
  nutrition: 'weekly',
  recipeDetail: 'monthly',
  sevenMajors: 'weekly',
  sevenMajorsDetail: 'monthly',
  blog: 'daily',
  blogPost: 'weekly',
  static: 'monthly'
};

/**
 * Génère les URLs pour la page d'accueil
 */
function generateHomeUrls() {
  const urls = [];
  
  // Page d'accueil pour chaque langue
  LANGUAGES.forEach(lang => {
    const url = lang === 'fr' ? SITE_URL : `${SITE_URL}/${lang}`;
    urls.push({
      url,
      changefreq: CHANGE_FREQ.home,
      priority: PRIORITIES.home,
      links: LANGUAGES.map(l => ({
        lang: l,
        url: l === 'fr' ? SITE_URL : `${SITE_URL}/${l}`
      }))
    });
  });
  
  return urls;
}

/**
 * Génère les URLs pour les pages statiques
 */
function generateStaticPageUrls() {
  const staticPages = [
    { path: 'about', translations: { fr: 'a-propos', en: 'about' } },
    { path: 'contact', translations: { fr: 'contact', en: 'contact' } },
    { path: 'faq', translations: { fr: 'faq', en: 'faq' } },
    { path: 'terms', translations: { fr: 'conditions-utilisation', en: 'terms' } },
    { path: 'privacy', translations: { fr: 'politique-confidentialite', en: 'privacy' } }
  ];
  
  const urls = [];
  
  staticPages.forEach(page => {
    LANGUAGES.forEach(lang => {
      const pagePath = page.translations[lang];
      const url = lang === 'fr' 
        ? `${SITE_URL}/${pagePath}` 
        : `${SITE_URL}/${lang}/${pagePath}`;
      
      urls.push({
        url,
        changefreq: CHANGE_FREQ.static,
        priority: PRIORITIES.static,
        links: LANGUAGES.map(l => ({
          lang: l,
          url: l === 'fr' 
            ? `${SITE_URL}/${page.translations[l]}` 
            : `${SITE_URL}/${l}/${page.translations[l]}`
        }))
      });
    });
  });
  
  return urls;
}

/**
 * Génère les URLs pour les sections principales
 */
function generateMainSectionUrls() {
  const mainSections = [
    { path: 'cols', priority: PRIORITIES.cols, changefreq: CHANGE_FREQ.cols },
    { path: 'training', priority: PRIORITIES.training, changefreq: CHANGE_FREQ.training },
    { path: 'nutrition', priority: PRIORITIES.nutrition, changefreq: CHANGE_FREQ.nutrition },
    { path: 'seven-majors', priority: PRIORITIES.sevenMajors, changefreq: CHANGE_FREQ.sevenMajors }
  ];
  
  const urls = [];
  
  mainSections.forEach(section => {
    LANGUAGES.forEach(lang => {
      const url = lang === 'fr' 
        ? `${SITE_URL}/${section.path}` 
        : `${SITE_URL}/${lang}/${section.path}`;
      
      urls.push({
        url,
        changefreq: section.changefreq,
        priority: section.priority,
        links: LANGUAGES.map(l => ({
          lang: l,
          url: l === 'fr' 
            ? `${SITE_URL}/${section.path}` 
            : `${SITE_URL}/${l}/${section.path}`
        }))
      });
    });
  });
  
  return urls;
}

/**
 * Génère les URLs pour les cols
 */
function generateColUrls() {
  try {
    const urls = [];
    const colsDir = path.join(DATA_DIR, 'cols/enriched');
    
    if (!fs.existsSync(colsDir)) {
      console.log('⚠️ Répertoire des cols non trouvé');
      return urls;
    }
    
    const colFiles = fs.readdirSync(colsDir).filter(file => file.endsWith('.json'));
    console.log(`🔍 Traitement de ${colFiles.length} cols pour le sitemap...`);
    
    colFiles.forEach(file => {
      const colData = JSON.parse(fs.readFileSync(path.join(colsDir, file), 'utf8'));
      const colSlug = file.replace('.json', '');
      
      // Générer les URLs pour chaque langue
      LANGUAGES.forEach(lang => {
        const region = colData.region?.toLowerCase().replace(/\s+/g, '-') || 'default';
        const url = lang === 'fr' 
          ? `${SITE_URL}/cols/${region}/${colSlug}` 
          : `${SITE_URL}/${lang}/cols/${region}/${colSlug}`;
        
        // Générer les liens alternatifs pour chaque langue
        const links = LANGUAGES.map(l => ({
          lang: l,
          url: l === 'fr' 
            ? `${SITE_URL}/cols/${region}/${colSlug}` 
            : `${SITE_URL}/${l}/cols/${region}/${colSlug}`
        }));
        
        urls.push({
          url,
          changefreq: CHANGE_FREQ.colDetail,
          priority: PRIORITIES.colDetail,
          lastmod: colData.updated_at || new Date().toISOString(),
          links
        });
      });
    });
    
    return urls;
  } catch (error) {
    console.error('❌ Erreur lors de la génération des URLs pour les cols:', error);
    return [];
  }
}

/**
 * Génère les URLs pour les programmes d'entraînement
 */
function generateTrainingUrls() {
  try {
    const urls = [];
    const trainingDir = path.join(DATA_DIR, 'training');
    
    if (!fs.existsSync(trainingDir)) {
      console.log('⚠️ Répertoire des programmes d\'entraînement non trouvé');
      return urls;
    }
    
    const trainingFiles = fs.readdirSync(trainingDir).filter(file => file.endsWith('.json'));
    console.log(`🔍 Traitement de ${trainingFiles.length} programmes d'entraînement pour le sitemap...`);
    
    trainingFiles.forEach(file => {
      const programData = JSON.parse(fs.readFileSync(path.join(trainingDir, file), 'utf8'));
      const programSlug = file.replace('.json', '');
      
      // Générer les URLs pour chaque langue
      LANGUAGES.forEach(lang => {
        const url = lang === 'fr' 
          ? `${SITE_URL}/training/programs/${programSlug}` 
          : `${SITE_URL}/${lang}/training/programs/${programSlug}`;
        
        // Générer les liens alternatifs pour chaque langue
        const links = LANGUAGES.map(l => ({
          lang: l,
          url: l === 'fr' 
            ? `${SITE_URL}/training/programs/${programSlug}` 
            : `${SITE_URL}/${l}/training/programs/${programSlug}`
        }));
        
        urls.push({
          url,
          changefreq: CHANGE_FREQ.trainingDetail,
          priority: PRIORITIES.trainingDetail,
          lastmod: programData.updated_at || new Date().toISOString(),
          links
        });
      });
    });
    
    return urls;
  } catch (error) {
    console.error('❌ Erreur lors de la génération des URLs pour les programmes d\'entraînement:', error);
    return [];
  }
}

/**
 * Génère les URLs pour les recettes
 */
function generateRecipeUrls() {
  try {
    const urls = [];
    const recipesDir = path.join(DATA_DIR, 'nutrition/recipes');
    
    if (!fs.existsSync(recipesDir)) {
      console.log('⚠️ Répertoire des recettes non trouvé');
      return urls;
    }
    
    const recipeFiles = fs.readdirSync(recipesDir).filter(file => file.endsWith('.json'));
    console.log(`🔍 Traitement de ${recipeFiles.length} recettes pour le sitemap...`);
    
    recipeFiles.forEach(file => {
      const recipeData = JSON.parse(fs.readFileSync(path.join(recipesDir, file), 'utf8'));
      const recipeSlug = file.replace('.json', '');
      
      // Générer les URLs pour chaque langue
      LANGUAGES.forEach(lang => {
        const url = lang === 'fr' 
          ? `${SITE_URL}/nutrition/recipes/${recipeSlug}` 
          : `${SITE_URL}/${lang}/nutrition/recipes/${recipeSlug}`;
        
        // Générer les liens alternatifs pour chaque langue
        const links = LANGUAGES.map(l => ({
          lang: l,
          url: l === 'fr' 
            ? `${SITE_URL}/nutrition/recipes/${recipeSlug}` 
            : `${SITE_URL}/${l}/nutrition/recipes/${recipeSlug}`
        }));
        
        urls.push({
          url,
          changefreq: CHANGE_FREQ.recipeDetail,
          priority: PRIORITIES.recipeDetail,
          lastmod: recipeData.created_at || new Date().toISOString(),
          links
        });
      });
    });
    
    return urls;
  } catch (error) {
    console.error('❌ Erreur lors de la génération des URLs pour les recettes:', error);
    return [];
  }
}

/**
 * Génère les URLs pour les défis 7 Majeurs
 */
function generateSevenMajorsUrls() {
  try {
    const urls = [];
    const challengesDir = path.join(DATA_DIR, 'seven-majors');
    
    if (!fs.existsSync(challengesDir)) {
      console.log('⚠️ Répertoire des défis 7 Majeurs non trouvé');
      return urls;
    }
    
    const challengeFiles = fs.readdirSync(challengesDir).filter(file => file.endsWith('.json'));
    console.log(`🔍 Traitement de ${challengeFiles.length} défis 7 Majeurs pour le sitemap...`);
    
    challengeFiles.forEach(file => {
      const challengeData = JSON.parse(fs.readFileSync(path.join(challengesDir, file), 'utf8'));
      const challengeSlug = file.replace('.json', '');
      
      // Générer les URLs pour chaque langue
      LANGUAGES.forEach(lang => {
        const url = lang === 'fr' 
          ? `${SITE_URL}/seven-majors/${challengeSlug}` 
          : `${SITE_URL}/${lang}/seven-majors/${challengeSlug}`;
        
        // Générer les liens alternatifs pour chaque langue
        const links = LANGUAGES.map(l => ({
          lang: l,
          url: l === 'fr' 
            ? `${SITE_URL}/seven-majors/${challengeSlug}` 
            : `${SITE_URL}/${l}/seven-majors/${challengeSlug}`
        }));
        
        urls.push({
          url,
          changefreq: CHANGE_FREQ.sevenMajorsDetail,
          priority: PRIORITIES.sevenMajorsDetail,
          lastmod: challengeData.updated_at || new Date().toISOString(),
          links
        });
      });
    });
    
    return urls;
  } catch (error) {
    console.error('❌ Erreur lors de la génération des URLs pour les défis 7 Majeurs:', error);
    return [];
  }
}

/**
 * Génère le sitemap.xml
 */
async function generateSitemap() {
  try {
    console.log('🚀 Début de la génération du sitemap...');
    
    // Collecter toutes les URLs
    const urls = [
      ...generateHomeUrls(),
      ...generateMainSectionUrls(),
      ...generateStaticPageUrls(),
      ...generateColUrls(),
      ...generateTrainingUrls(),
      ...generateRecipeUrls(),
      ...generateSevenMajorsUrls()
    ];
    
    console.log(`📊 Total d'URLs générées: ${urls.length}`);
    
    // Créer le stream de sitemap
    const stream = new SitemapStream({ hostname: SITE_URL });
    
    // Ajouter toutes les URLs au stream
    const data = Readable.from(urls).pipe(stream);
    
    // Convertir le stream en XML
    const sitemap = await streamToPromise(data);
    
    // Écrire le fichier sitemap.xml
    fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'), sitemap.toString());
    
    console.log('✅ Sitemap généré avec succès!');
  } catch (error) {
    console.error('❌ Erreur lors de la génération du sitemap:', error);
  }
}

// Exécuter la génération du sitemap
generateSitemap();
