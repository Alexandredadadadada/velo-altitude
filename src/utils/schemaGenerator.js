/**
 * schemaGenerator.js
 * 
 * Générateur de données structurées (Schema.org) pour Velo-Altitude
 * Ce module centralise la création de schémas JSON-LD pour améliorer
 * la compréhension du contenu par les moteurs de recherche et obtenir
 * des rich snippets dans les résultats de recherche.
 */

/**
 * Configuration de base pour les schémas
 */
const SCHEMA_CONFIG = {
  ORGANIZATION: {
    name: "Velo-Altitude",
    url: "https://www.velo-altitude.com",
    logo: "https://www.velo-altitude.com/images/logo.png",
    sameAs: [
      "https://www.facebook.com/veloaltitude",
      "https://www.instagram.com/veloaltitude",
      "https://www.youtube.com/c/veloaltitude",
      "https://www.strava.com/clubs/veloaltitude"
    ]
  }
};

/**
 * Génère le schéma de l'organisation (WebSite et Organization)
 * @returns {Object} Schéma JSON-LD
 */
export const generateOrganizationSchema = () => {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SCHEMA_CONFIG.ORGANIZATION.url}/#organization`,
      "name": SCHEMA_CONFIG.ORGANIZATION.name,
      "url": SCHEMA_CONFIG.ORGANIZATION.url,
      "logo": {
        "@type": "ImageObject",
        "url": SCHEMA_CONFIG.ORGANIZATION.logo,
        "width": 600,
        "height": 60
      },
      "sameAs": SCHEMA_CONFIG.ORGANIZATION.sameAs
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SCHEMA_CONFIG.ORGANIZATION.url}/#website`,
      "url": SCHEMA_CONFIG.ORGANIZATION.url,
      "name": SCHEMA_CONFIG.ORGANIZATION.name,
      "publisher": {
        "@id": `${SCHEMA_CONFIG.ORGANIZATION.url}/#organization`
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${SCHEMA_CONFIG.ORGANIZATION.url}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    }
  ];
};

/**
 * Génère le schéma pour une page web générique
 * @param {Object} page - Informations sur la page
 * @returns {Object} Schéma JSON-LD
 */
export const generateWebPageSchema = (page) => {
  return {
    "@context": "https://schema.org",
    "@type": page.type || "WebPage",
    "@id": `${page.url}/#webpage`,
    "url": page.url,
    "name": page.title,
    "description": page.description,
    "isPartOf": {
      "@id": `${SCHEMA_CONFIG.ORGANIZATION.url}/#website`
    },
    "inLanguage": page.language || "fr",
    "datePublished": page.datePublished,
    "dateModified": page.dateModified || page.datePublished
  };
};

/**
 * Génère le schéma pour un col cycliste (TouristAttraction + Place)
 * @param {Object} col - Données du col
 * @param {string} url - URL complète de la page
 * @returns {Object} Schéma JSON-LD
 */
export const generateColSchema = (col, url) => {
  return {
    "@context": "https://schema.org",
    "@type": ["TouristAttraction", "Place"],
    "@id": `${url}/#place`,
    "name": col.name,
    "description": col.description,
    "url": url,
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": col.coordinates.summit.lat,
      "longitude": col.coordinates.summit.lng,
      "elevation": col.altitude
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": col.country,
      "addressRegion": col.region
    },
    "image": col.images && col.images.length > 0 ? col.images[0].url : null,
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Altitude",
        "value": `${col.altitude} m`
      },
      {
        "@type": "PropertyValue",
        "name": "Longueur",
        "value": `${col.length} km`
      },
      {
        "@type": "PropertyValue",
        "name": "Pente moyenne",
        "value": `${col.gradient}%`
      }
    ],
    "isAccessibleForFree": true,
    "touristType": ["Cyclists", "Mountain enthusiasts"],
    "inLanguage": "fr"
  };
};

/**
 * Génère le schéma pour un programme d'entraînement (Course)
 * @param {Object} program - Données du programme
 * @param {string} url - URL complète de la page
 * @returns {Object} Schéma JSON-LD
 */
export const generateTrainingProgramSchema = (program, url) => {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${url}/#course`,
    "name": program.name.fr,
    "description": program.description.fr,
    "url": url,
    "provider": {
      "@type": "Organization",
      "name": SCHEMA_CONFIG.ORGANIZATION.name,
      "url": SCHEMA_CONFIG.ORGANIZATION.url
    },
    "timeRequired": `P${program.duration}W`, // Format ISO 8601 pour la durée (ex: P8W = 8 semaines)
    "educationalLevel": program.level,
    "audience": {
      "@type": "Audience",
      "audienceType": program.target_audience.fr
    },
    "teaches": "Mountain cycling performance",
    "hasCourseInstance": program.weeks.map((week, index) => ({
      "@type": "CourseInstance",
      "name": week.title.fr,
      "courseWorkload": `P1W` // Une semaine
    })),
    "inLanguage": "fr"
  };
};

/**
 * Génère le schéma pour une recette (Recipe)
 * @param {Object} recipe - Données de la recette
 * @param {string} url - URL complète de la page
 * @returns {Object} Schéma JSON-LD
 */
export const generateRecipeSchema = (recipe, url) => {
  // Formatage des ingrédients
  const recipeIngredient = recipe.ingredients.map(ingredient => 
    `${ingredient.quantity} ${ingredient.unit} ${ingredient.name.fr}`
  );
  
  // Formatage des instructions
  const recipeInstructions = recipe.instructions.map(instruction => ({
    "@type": "HowToStep",
    "text": instruction.fr
  }));
  
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "@id": `${url}/#recipe`,
    "name": recipe.name.fr,
    "url": url,
    "image": recipe.images && recipe.images.length > 0 ? recipe.images[0].url : null,
    "author": {
      "@type": "Organization",
      "name": SCHEMA_CONFIG.ORGANIZATION.name
    },
    "datePublished": recipe.created_at,
    "description": recipe.description ? recipe.description.fr : "",
    "prepTime": `PT${recipe.preparation_time}M`, // Format ISO 8601 pour la durée (ex: PT20M = 20 minutes)
    "cookTime": recipe.cooking_time ? `PT${recipe.cooking_time}M` : null,
    "totalTime": `PT${recipe.preparation_time + (recipe.cooking_time || 0)}M`,
    "recipeCategory": recipe.category,
    "recipeCuisine": "Sport nutrition",
    "recipeYield": `${recipe.portions} portions`,
    "recipeIngredient": recipeIngredient,
    "recipeInstructions": recipeInstructions,
    "nutrition": {
      "@type": "NutritionInformation",
      "calories": `${recipe.nutritional_info.per_portion.calories} calories`,
      "carbohydrateContent": `${recipe.nutritional_info.per_portion.carbs}g`,
      "proteinContent": `${recipe.nutritional_info.per_portion.protein}g`,
      "fatContent": `${recipe.nutritional_info.per_portion.fat}g`,
      "fiberContent": `${recipe.nutritional_info.per_portion.fiber}g`
    },
    "suitableForDiet": "https://schema.org/SportsDiet",
    "keywords": `cyclisme, nutrition, ${recipe.category}, ${recipe.consumption_moment}`,
    "inLanguage": "fr"
  };
};

/**
 * Génère le schéma pour un défi "7 Majeurs" (SportsEvent)
 * @param {Object} challenge - Données du défi
 * @param {string} url - URL complète de la page
 * @returns {Object} Schéma JSON-LD
 */
export const generateSevenMajorsSchema = (challenge, url) => {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "@id": `${url}/#sportsevent`,
    "name": challenge.name.fr,
    "description": challenge.description.fr,
    "url": url,
    "image": challenge.images && challenge.images.length > 0 ? challenge.images[0].url : null,
    "startDate": challenge.recommendations.best_season[0], // Premier mois recommandé
    "endDate": challenge.recommendations.best_season[challenge.recommendations.best_season.length - 1], // Dernier mois recommandé
    "location": {
      "@type": "Place",
      "name": challenge.recommendations.suggested_base || "Europe",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "France"
      }
    },
    "organizer": {
      "@type": "Organization",
      "name": SCHEMA_CONFIG.ORGANIZATION.name,
      "url": SCHEMA_CONFIG.ORGANIZATION.url
    },
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "sport": "Cycling",
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Distance totale",
        "value": `${challenge.total_distance} km`
      },
      {
        "@type": "PropertyValue",
        "name": "Dénivelé total",
        "value": `${challenge.total_elevation} m`
      },
      {
        "@type": "PropertyValue",
        "name": "Durée estimée",
        "value": `${challenge.estimated_completion_time.min_days} à ${challenge.estimated_completion_time.max_days} jours`
      },
      {
        "@type": "PropertyValue",
        "name": "Difficulté",
        "value": challenge.difficulty
      }
    ],
    "inLanguage": "fr"
  };
};

/**
 * Génère le schéma pour un événement communautaire (Event)
 * @param {Object} event - Données de l'événement
 * @param {string} url - URL complète de la page
 * @returns {Object} Schéma JSON-LD
 */
export const generateEventSchema = (event, url) => {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "@id": `${url}/#event`,
    "name": event.name,
    "description": event.description,
    "url": url,
    "image": event.image,
    "startDate": event.startDate,
    "endDate": event.endDate,
    "location": {
      "@type": "Place",
      "name": event.location.name,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": event.location.city,
        "addressRegion": event.location.region,
        "addressCountry": event.location.country
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": event.location.coordinates.lat,
        "longitude": event.location.coordinates.lng
      }
    },
    "organizer": event.organizer ? {
      "@type": "Organization",
      "name": event.organizer.name,
      "url": event.organizer.url
    } : {
      "@type": "Organization",
      "name": SCHEMA_CONFIG.ORGANIZATION.name,
      "url": SCHEMA_CONFIG.ORGANIZATION.url
    },
    "eventStatus": event.status || "https://schema.org/EventScheduled",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "offers": event.registration ? {
      "@type": "Offer",
      "url": event.registration.url,
      "price": event.registration.price,
      "priceCurrency": event.registration.currency || "EUR",
      "availability": event.registration.available ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      "validFrom": event.registration.validFrom
    } : null,
    "performer": {
      "@type": "SportsTeam",
      "name": "Cyclistes"
    },
    "inLanguage": "fr"
  };
};

/**
 * Génère le schéma pour un article de blog (Article)
 * @param {Object} article - Données de l'article
 * @param {string} url - URL complète de la page
 * @returns {Object} Schéma JSON-LD
 */
export const generateArticleSchema = (article, url) => {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}/#article`,
    "headline": article.title,
    "description": article.description,
    "image": article.image,
    "url": url,
    "datePublished": article.datePublished,
    "dateModified": article.dateModified || article.datePublished,
    "author": {
      "@type": "Person",
      "name": article.author.name,
      "url": article.author.url
    },
    "publisher": {
      "@type": "Organization",
      "name": SCHEMA_CONFIG.ORGANIZATION.name,
      "logo": {
        "@type": "ImageObject",
        "url": SCHEMA_CONFIG.ORGANIZATION.logo,
        "width": 600,
        "height": 60
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "keywords": article.keywords.join(", "),
    "articleSection": article.category,
    "inLanguage": "fr"
  };
};

/**
 * Génère le schéma pour une FAQ (FAQPage)
 * @param {Array} faqs - Liste des questions/réponses
 * @param {string} url - URL complète de la page
 * @returns {Object} Schéma JSON-LD
 */
export const generateFAQSchema = (faqs, url) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${url}/#faqpage`,
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
};

/**
 * Génère le schéma pour un plan du site (ItemList)
 * @param {Array} items - Éléments du plan du site
 * @param {string} url - URL complète de la page
 * @returns {Object} Schéma JSON-LD
 */
export const generateSiteMapSchema = (items, url) => {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${url}/#sitemap`,
    "name": "Plan du site Velo-Altitude",
    "description": "Plan complet du site Velo-Altitude",
    "numberOfItems": items.length,
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "url": item.url
    }))
  };
};

/**
 * Génère le schéma pour une page de profil utilisateur (ProfilePage)
 * @param {Object} profile - Données du profil
 * @param {string} url - URL complète de la page
 * @returns {Object} Schéma JSON-LD
 */
export const generateProfileSchema = (profile, url) => {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${url}/#profilepage`,
    "name": `Profil de ${profile.name}`,
    "url": url,
    "mainEntity": {
      "@type": "Person",
      "name": profile.name,
      "description": profile.bio,
      "image": profile.avatar,
      "sameAs": profile.socialLinks
    }
  };
};

/**
 * Combine plusieurs schémas en un seul tableau pour insertion dans la page
 * @param  {...Object} schemas - Schémas à combiner
 * @returns {Array} Tableau de schémas combinés
 */
export const combineSchemas = (...schemas) => {
  return schemas.flat().filter(schema => schema !== null);
};

export default {
  generateOrganizationSchema,
  generateWebPageSchema,
  generateColSchema,
  generateTrainingProgramSchema,
  generateRecipeSchema,
  generateSevenMajorsSchema,
  generateEventSchema,
  generateArticleSchema,
  generateFAQSchema,
  generateSiteMapSchema,
  generateProfileSchema,
  combineSchemas
};
