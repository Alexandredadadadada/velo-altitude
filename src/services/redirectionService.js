/**
 * Service de redirection pour Velo-Altitude
 * 
 * Ce service gère les redirections intelligentes selon les anciens et nouveaux schémas d'URL
 * Il permet aussi de gérer les URL canoniques pour l'optimisation SEO
 */

// Table de correspondance pour les anciennes URL vers les nouvelles
const redirectionMap = {
  // Redirections des cols
  '/mountain-passes': '/cols',
  '/col/': '/cols/',
  '/mountain-pass/': '/cols/',
  
  // Redirections des programmes d'entraînement
  '/training': '/programs',
  '/training/plan/': '/programs/',
  '/training/program/': '/programs/',
  
  // Redirections des plans nutritionnels
  '/nutrition-plans': '/nutrition',
  '/nutrition-plan/': '/nutrition/',
  '/recipes/': '/nutrition/recipes/',
  
  // Redirections des défis
  '/user-challenges': '/challenges',
  '/challenge/': '/challenges/',
  
  // Redirections diverses
  '/user-profile': '/profile',
  '/route-planner': '/routes'
};

/**
 * Détermine si l'URL actuelle nécessite une redirection
 * @param {string} currentPath - Chemin d'URL actuel
 * @returns {string|null} - URL de redirection ou null si aucune redirection n'est nécessaire
 */
export const getRedirection = (currentPath) => {
  // Si l'URL correspond exactement à une entrée dans la table de redirection
  if (redirectionMap[currentPath]) {
    return redirectionMap[currentPath];
  }
  
  // Vérification des correspondances partielles
  for (const [oldPattern, newPattern] of Object.entries(redirectionMap)) {
    if (currentPath.startsWith(oldPattern)) {
      // Récupérer la partie variable de l'URL (l'identifiant)
      const remainingPath = currentPath.substring(oldPattern.length);
      // Construire la nouvelle URL
      return `${newPattern}${remainingPath}`;
    }
  }
  
  // Gérer les cas spéciaux (exemple: gestion des paramètres de requête)
  if (currentPath.includes('?')) {
    const [path, queryString] = currentPath.split('?');
    const redirectPath = getRedirection(path);
    if (redirectPath) {
      return `${redirectPath}?${queryString}`;
    }
  }
  
  // Aucune redirection nécessaire
  return null;
};

/**
 * Génère l'URL canonique pour la page actuelle
 * @param {string} currentPath - Chemin d'URL actuel
 * @param {object} params - Paramètres de requête à inclure ou à exclure
 * @param {array} includeParams - Liste des paramètres à conserver dans l'URL canonique
 * @returns {string} - URL canonique complète
 */
export const getCanonicalUrl = (currentPath, params = {}, includeParams = []) => {
  // URL de base du site
  const baseUrl = process.env.REACT_APP_SITE_URL || 'https://velo-altitude.com';
  
  // Vérifie si une redirection est nécessaire
  const redirectPath = getRedirection(currentPath);
  const normalizedPath = redirectPath || currentPath;
  
  // Nettoyer le chemin d'accès (supprimer les doubles slashes, etc.)
  const cleanPath = normalizedPath.replace(/\/+/g, '/');
  
  // Ajouter les paramètres de requête à conserver
  let queryString = '';
  if (includeParams.length > 0 && Object.keys(params).length > 0) {
    const filteredParams = includeParams.reduce((acc, param) => {
      if (params[param] !== undefined) {
        acc[param] = params[param];
      }
      return acc;
    }, {});
    
    if (Object.keys(filteredParams).length > 0) {
      queryString = '?' + new URLSearchParams(filteredParams).toString();
    }
  }
  
  return `${baseUrl}${cleanPath}${queryString}`;
};

/**
 * Gère les redirections pour les sujets entre catégories
 * Par exemple, rediriger un article qui parle d'entrainement pour un col spécifique
 * @param {string} contentType - Type de contenu actuel
 * @param {string} id - Identifiant du contenu
 * @param {object} contentData - Données du contenu
 * @returns {string|null} - URL de redirection ou null
 */
export const getContentTypeRedirection = (contentType, id, contentData) => {
  // Cas où un contenu a été déplacé vers une autre catégorie
  if (contentData.movedTo) {
    return `/${contentData.movedTo.category}/${contentData.movedTo.id}`;
  }
  
  // Cas où un contenu a été fusionné avec un autre
  if (contentData.mergedWith) {
    return `/${contentData.mergedWith.category}/${contentData.mergedWith.id}`;
  }
  
  // Cas où on pourrait avoir plusieurs URL valides pour le même contenu
  // (choisir l'URL canonique)
  if (contentType === 'nutrition' && contentData.type === 'recipe') {
    return `/nutrition/recipes/${id}`;
  }
  
  // Pas de redirection spéciale requise
  return null;
};

/**
 * Génère les métadonnées pour les liens alternatifs (hreflang)
 * @param {string} currentPath - Chemin d'URL actuel
 * @param {Array} availableLanguages - Langues disponibles pour ce contenu
 * @returns {Array} - Tableau d'objets {lang, url} pour chaque langue disponible
 */
export const getAlternateLanguageUrls = (currentPath, availableLanguages = ['fr', 'en']) => {
  const baseUrl = process.env.REACT_APP_SITE_URL || 'https://velo-altitude.com';
  
  return availableLanguages.map(lang => {
    // Construire l'URL pour cette langue
    // Si la langue est dans le chemin, la remplacer; sinon, l'ajouter
    let langPath = currentPath;
    
    // Si nous avons un format /lang/path
    if (/^\/[a-z]{2}\//i.test(currentPath)) {
      langPath = currentPath.replace(/^\/[a-z]{2}\//i, `/${lang}/`);
    } 
    // Si nous avons un format /path et que nous devons ajouter la langue
    else if (lang !== 'fr') { // fr est la langue par défaut, pas de préfixe
      langPath = `/${lang}${currentPath}`;
    }
    
    return {
      lang: lang,
      url: `${baseUrl}${langPath}`
    };
  });
};

/**
 * Détecte si l'URL est une URL obsolète et suggère une alternative
 * @param {string} currentPath - Chemin d'URL actuel
 * @returns {object|null} - Informations sur la redirection suggérée ou null
 */
export const detectDeprecatedUrl = (currentPath) => {
  // Liste des schémas d'URL obsolètes avec suggestions
  const deprecatedPatterns = [
    {
      pattern: /^\/mountain-pass\/(.+)$/,
      suggestion: (matches) => `/cols/${matches[1]}`,
      message: "Cette URL est obsolète. Découvrez notre nouvelle page de col avec plus d'informations."
    },
    {
      pattern: /^\/training\/plan\/(.+)$/,
      suggestion: (matches) => `/programs/${matches[1]}`,
      message: "Cette URL est obsolète. Consultez notre programme d'entraînement mis à jour."
    },
    {
      pattern: /^\/recipe\/(.+)$/,
      suggestion: (matches) => `/nutrition/recipes/${matches[1]}`,
      message: "Cette URL est obsolète. Découvrez notre nouvelle section recettes."
    }
  ];
  
  for (const { pattern, suggestion, message } of deprecatedPatterns) {
    const matches = currentPath.match(pattern);
    if (matches) {
      return {
        isDeprecated: true,
        currentPath,
        suggestedPath: suggestion(matches),
        message
      };
    }
  }
  
  return null;
};

export default {
  getRedirection,
  getCanonicalUrl,
  getContentTypeRedirection,
  getAlternateLanguageUrls,
  detectDeprecatedUrl
};
