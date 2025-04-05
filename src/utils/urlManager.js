/**
 * urlManager.js
 * 
 * Système de gestion des URLs pour Velo-Altitude
 * Ce module centralise la création et la manipulation des URLs du site
 * pour garantir une structure cohérente et optimisée pour le SEO.
 */

/**
 * Configuration des URLs par section
 */
const URL_CONFIG = {
  // Configuration de base
  BASE_URL: 'https://www.velo-altitude.com',
  DEFAULT_LANG: 'fr',
  
  // Structure des sections principales
  SECTIONS: {
    COLS: 'cols',
    TRAINING: 'training',
    NUTRITION: 'nutrition',
    SEVEN_MAJORS: 'seven-majors',
    COMMUNITY: 'community',
    ABOUT: 'about',
    SITEMAP: 'sitemap'
  },
  
  // Sous-sections
  SUBSECTIONS: {
    NUTRITION: {
      RECIPES: 'recipes',
      PLANS: 'plans',
      HYDRATION: 'hydration',
      CALCULATOR: 'calculator'
    },
    TRAINING: {
      PROGRAMS: 'programs',
      HIIT: 'hiit',
      PERFORMANCE: 'performance',
      RECOVERY: 'recovery'
    },
    COMMUNITY: {
      CHALLENGES: 'challenges',
      EVENTS: 'events',
      FORUM: 'forum',
      STORIES: 'stories'
    },
    ABOUT: {
      TEAM: 'team',
      CONTACT: 'contact',
      PRIVACY: 'privacy',
      TERMS: 'terms'
    }
  },
  
  // Paramètres d'URL standardisés
  PARAMS: {
    LANG: 'lang',
    UNIT: 'unit',
    DIFFICULTY: 'difficulty',
    DURATION: 'duration',
    ALTITUDE: 'altitude',
    SORT: 'sort',
    PAGE: 'page'
  }
};

/**
 * Génère une URL pour un col
 * @param {string} colSlug - Slug du col
 * @param {string} lang - Code de langue (optionnel)
 * @returns {string} URL complète
 */
export const getColUrl = (colSlug, lang = URL_CONFIG.DEFAULT_LANG) => {
  const langPrefix = lang === URL_CONFIG.DEFAULT_LANG ? '' : `/${lang}`;
  return `${langPrefix}/${URL_CONFIG.SECTIONS.COLS}/${colSlug}`;
};

/**
 * Génère une URL pour un programme d'entraînement
 * @param {string} programSlug - Slug du programme
 * @param {string} lang - Code de langue (optionnel)
 * @returns {string} URL complète
 */
export const getTrainingProgramUrl = (programSlug, lang = URL_CONFIG.DEFAULT_LANG) => {
  const langPrefix = lang === URL_CONFIG.DEFAULT_LANG ? '' : `/${lang}`;
  return `${langPrefix}/${URL_CONFIG.SECTIONS.TRAINING}/${programSlug}`;
};

/**
 * Génère une URL pour une recette
 * @param {string} recipeSlug - Slug de la recette
 * @param {string} lang - Code de langue (optionnel)
 * @returns {string} URL complète
 */
export const getRecipeUrl = (recipeSlug, lang = URL_CONFIG.DEFAULT_LANG) => {
  const langPrefix = lang === URL_CONFIG.DEFAULT_LANG ? '' : `/${lang}`;
  const subsection = URL_CONFIG.SUBSECTIONS.NUTRITION.RECIPES;
  return `${langPrefix}/${URL_CONFIG.SECTIONS.NUTRITION}/${subsection}/${recipeSlug}`;
};

/**
 * Génère une URL pour un plan nutritionnel
 * @param {string} planSlug - Slug du plan
 * @param {string} lang - Code de langue (optionnel)
 * @returns {string} URL complète
 */
export const getNutritionPlanUrl = (planSlug, lang = URL_CONFIG.DEFAULT_LANG) => {
  const langPrefix = lang === URL_CONFIG.DEFAULT_LANG ? '' : `/${lang}`;
  const subsection = URL_CONFIG.SUBSECTIONS.NUTRITION.PLANS;
  return `${langPrefix}/${URL_CONFIG.SECTIONS.NUTRITION}/${subsection}/${planSlug}`;
};

/**
 * Génère une URL pour un défi "7 Majeurs"
 * @param {string} challengeSlug - Slug du défi
 * @param {string} lang - Code de langue (optionnel)
 * @returns {string} URL complète
 */
export const getSevenMajorsUrl = (challengeSlug, lang = URL_CONFIG.DEFAULT_LANG) => {
  const langPrefix = lang === URL_CONFIG.DEFAULT_LANG ? '' : `/${lang}`;
  return `${langPrefix}/${URL_CONFIG.SECTIONS.SEVEN_MAJORS}/${challengeSlug}`;
};

/**
 * Génère une URL pour une page de communauté
 * @param {string} subsection - Sous-section (challenges, events, forum, stories)
 * @param {string} itemSlug - Slug de l'élément (optionnel)
 * @param {string} lang - Code de langue (optionnel)
 * @returns {string} URL complète
 */
export const getCommunityUrl = (subsection, itemSlug = null, lang = URL_CONFIG.DEFAULT_LANG) => {
  const langPrefix = lang === URL_CONFIG.DEFAULT_LANG ? '' : `/${lang}`;
  const baseUrl = `${langPrefix}/${URL_CONFIG.SECTIONS.COMMUNITY}/${subsection}`;
  return itemSlug ? `${baseUrl}/${itemSlug}` : baseUrl;
};

/**
 * Génère une URL pour une page à propos
 * @param {string} subsection - Sous-section (team, contact, privacy, terms)
 * @param {string} lang - Code de langue (optionnel)
 * @returns {string} URL complète
 */
export const getAboutUrl = (subsection, lang = URL_CONFIG.DEFAULT_LANG) => {
  const langPrefix = lang === URL_CONFIG.DEFAULT_LANG ? '' : `/${lang}`;
  return `${langPrefix}/${URL_CONFIG.SECTIONS.ABOUT}/${subsection}`;
};

/**
 * Génère une URL pour une page de liste avec filtres
 * @param {string} section - Section principale
 * @param {string} subsection - Sous-section (optionnel)
 * @param {Object} params - Paramètres de filtre (optionnel)
 * @param {string} lang - Code de langue (optionnel)
 * @returns {string} URL complète
 */
export const getFilteredListUrl = (section, subsection = null, params = {}, lang = URL_CONFIG.DEFAULT_LANG) => {
  const langPrefix = lang === URL_CONFIG.DEFAULT_LANG ? '' : `/${lang}`;
  const baseUrl = subsection 
    ? `${langPrefix}/${section}/${subsection}` 
    : `${langPrefix}/${section}`;
  
  // Construction des paramètres d'URL
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      queryParams.append(key, value);
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

/**
 * Génère une URL canonique complète (avec domaine)
 * @param {string} path - Chemin relatif
 * @returns {string} URL canonique complète
 */
export const getCanonicalUrl = (path) => {
  // Supprime le slash initial si présent pour éviter les doubles slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${URL_CONFIG.BASE_URL}/${cleanPath}`;
};

/**
 * Génère les URLs alternatives pour l'internationalisation (hreflang)
 * @param {string} path - Chemin relatif sans préfixe de langue
 * @param {Array} languages - Langues disponibles
 * @returns {Array} Liste d'objets {lang, url}
 */
export const getAlternateUrls = (path, languages = ['fr', 'en']) => {
  return languages.map(lang => {
    const langPrefix = lang === URL_CONFIG.DEFAULT_LANG ? '' : `/${lang}`;
    const relativePath = path.startsWith('/') ? path.substring(1) : path;
    return {
      lang,
      url: `${URL_CONFIG.BASE_URL}${langPrefix}/${relativePath}`
    };
  });
};

/**
 * Analyse une URL pour extraire ses composants
 * @param {string} url - URL à analyser
 * @returns {Object} Composants de l'URL (section, subsection, slug, params)
 */
export const parseUrl = (url) => {
  try {
    // Supprime le domaine et le préfixe de langue si présents
    let path = url;
    if (path.startsWith(URL_CONFIG.BASE_URL)) {
      path = path.substring(URL_CONFIG.BASE_URL.length);
    }
    
    // Sépare le chemin des paramètres
    const [pathPart, queryPart] = path.split('?');
    
    // Divise le chemin en segments
    const segments = pathPart.split('/').filter(segment => segment.length > 0);
    
    // Détecte si le premier segment est un code de langue
    let lang = URL_CONFIG.DEFAULT_LANG;
    let startIndex = 0;
    
    if (segments.length > 0 && segments[0].length === 2) {
      lang = segments[0];
      startIndex = 1;
    }
    
    // Extrait la section, sous-section et slug
    const section = segments[startIndex] || '';
    const subsection = segments[startIndex + 1] || '';
    const slug = segments[startIndex + 2] || '';
    
    // Parse les paramètres d'URL
    const params = {};
    if (queryPart) {
      const searchParams = new URLSearchParams(queryPart);
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }
    }
    
    return {
      lang,
      section,
      subsection,
      slug,
      params
    };
  } catch (error) {
    console.error('Erreur lors de l\'analyse de l\'URL:', error);
    return {
      lang: URL_CONFIG.DEFAULT_LANG,
      section: '',
      subsection: '',
      slug: '',
      params: {}
    };
  }
};

/**
 * Vérifie si une URL est valide selon la structure définie
 * @param {string} url - URL à vérifier
 * @returns {boolean} True si l'URL est valide
 */
export const isValidUrl = (url) => {
  const { section, subsection } = parseUrl(url);
  
  // Vérifie si la section principale est valide
  const isValidSection = Object.values(URL_CONFIG.SECTIONS).includes(section);
  
  // Vérifie si la sous-section est valide pour la section donnée
  let isValidSubsection = true;
  if (subsection && URL_CONFIG.SUBSECTIONS[section.toUpperCase()]) {
    isValidSubsection = Object.values(URL_CONFIG.SUBSECTIONS[section.toUpperCase()]).includes(subsection);
  }
  
  return isValidSection && isValidSubsection;
};

export default {
  URL_CONFIG,
  getColUrl,
  getTrainingProgramUrl,
  getRecipeUrl,
  getNutritionPlanUrl,
  getSevenMajorsUrl,
  getCommunityUrl,
  getAboutUrl,
  getFilteredListUrl,
  getCanonicalUrl,
  getAlternateUrls,
  parseUrl,
  isValidUrl
};
