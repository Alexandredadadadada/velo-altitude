/**
 * Modèles de données structurées Schema.org pour Velo-Altitude
 * Ces modèles permettent d'améliorer la compréhension du contenu par les moteurs de recherche
 * et d'obtenir des rich snippets dans les résultats de recherche.
 */

/**
 * Génère un schéma pour une fiche de col
 * 
 * @param {Object} col - Les données du col
 * @returns {Object} - Le schéma Schema.org pour le col
 */
export const generateColSchema = (col) => {
  return {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    "name": col.name,
    "description": col.description,
    "url": `https://www.velo-altitude.com/cols/${col.id}`,
    "elevation": col.altitude,
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": col.coordinates.lat,
      "longitude": col.coordinates.lng
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": col.country,
      "addressRegion": col.region || col.location.split(',')[1]?.trim() || ""
    },
    "image": col.images && col.images.length > 0 ? col.images[0] : null,
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Longueur",
        "value": `${col.length} km`
      },
      {
        "@type": "PropertyValue",
        "name": "Pente moyenne",
        "value": `${col.averageGradient}%`
      },
      {
        "@type": "PropertyValue",
        "name": "Pente maximale",
        "value": `${col.maxGradient}%`
      },
      {
        "@type": "PropertyValue",
        "name": "Difficulté",
        "value": col.difficulty
      }
    ],
    "amenityFeature": col.services ? col.services.map(service => ({
      "@type": "LocationFeatureSpecification",
      "name": service.name,
      "value": true,
      "description": service.description || null
    })) : [],
    "openingHoursSpecification": col.openingMonths ? {
      "@type": "OpeningHoursSpecification",
      "name": "Période d'ouverture",
      "description": `Ouvert pendant les mois de ${col.openingMonths.join(', ')}`
    } : null,
    "review": col.reviews ? col.reviews.map(review => ({
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating,
        "bestRating": "5"
      },
      "author": {
        "@type": "Person",
        "name": review.user
      },
      "datePublished": review.date,
      "reviewBody": review.comment
    })) : [],
    "aggregateRating": col.reviews && col.reviews.length > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": col.reviews.reduce((acc, review) => acc + review.rating, 0) / col.reviews.length,
      "reviewCount": col.reviews.length
    } : null
  };
};

/**
 * Generate structured data for a training program
 * @param {Object} program - The training program data
 * @returns {Object} - Schema.org structured data for the training program
 */
export const generateTrainingProgramSchema = (program) => {
  if (!program) return null;

  // Calculate total duration in minutes
  const totalDurationMinutes = program.weeks.reduce((total, week) => {
    const weekDuration = week.sessions.reduce((weekTotal, session) => {
      return weekTotal + (session.duration || 0);
    }, 0);
    return total + weekDuration;
  }, 0);

  // Format duration in ISO 8601 format
  const formattedDuration = `P${program.duration}W`;

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": program.name,
    "description": program.description,
    "provider": {
      "@type": "Organization",
      "name": "Velo-Altitude",
      "url": "https://www.velo-altitude.com"
    },
    "timeRequired": formattedDuration,
    "educationalLevel": program.level,
    "audience": {
      "@type": "Audience",
      "audienceType": program.targetAudience
    },
    "teaches": program.objectives.join(", "),
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "courseMode": "online",
      "courseWorkload": `${program.sessionsPerWeek} séances par semaine`,
      "instructor": {
        "@type": "Person",
        "name": program.coach?.name || "Coach Velo-Altitude",
        "jobTitle": program.coach?.credentials || "Entraîneur cyclisme"
      }
    },
    "offers": {
      "@type": "Offer",
      "availability": "https://schema.org/InStock",
      "price": "0",
      "priceCurrency": "EUR"
    }
  };
};

/**
 * Génère un schéma pour un programme d'entraînement
 * 
 * @param {Object} program - Les données du programme d'entraînement
 * @returns {Object} - Le schéma Schema.org pour le programme
 */
export const generateTrainingProgramSchemaFr = (program) => {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": program.name,
    "description": program.description,
    "url": `https://www.velo-altitude.com/training/${program.id}`,
    "provider": {
      "@type": "Organization",
      "name": "Velo-Altitude",
      "url": "https://www.velo-altitude.com"
    },
    "audience": {
      "@type": "Audience",
      "audienceType": program.level
    },
    "timeRequired": program.duration,
    "educationalLevel": program.level,
    "teaches": program.objectives ? program.objectives.join(', ') : "",
    "hasCourseInstance": program.sessions ? program.sessions.map((session, index) => ({
      "@type": "CourseInstance",
      "name": `Session ${index + 1}: ${session.name}`,
      "description": session.description,
      "courseWorkload": `${session.duration} minutes`
    })) : [],
    "image": program.image || null,
    "keywords": program.keywords ? program.keywords.join(', ') : ""
  };
};

/**
 * Génère un schéma pour une recette nutritionnelle
 * 
 * @param {Object} recipe - Les données de la recette
 * @returns {Object} - Le schéma Schema.org pour la recette
 */
export const generateRecipeSchema = (recipe) => {
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": recipe.name,
    "description": recipe.description,
    "url": `https://www.velo-altitude.com/nutrition/recipes/${recipe.id}`,
    "author": {
      "@type": "Organization",
      "name": "Velo-Altitude",
      "url": "https://www.velo-altitude.com"
    },
    "image": recipe.image || null,
    "recipeCategory": recipe.category,
    "recipeCuisine": recipe.cuisine || "Cuisine sportive",
    "keywords": recipe.keywords ? recipe.keywords.join(', ') : "",
    "recipeYield": recipe.servings || "1 portion",
    "prepTime": recipe.prepTime ? `PT${recipe.prepTime}M` : null,
    "cookTime": recipe.cookTime ? `PT${recipe.cookTime}M` : null,
    "totalTime": recipe.totalTime ? `PT${recipe.totalTime}M` : null,
    "nutrition": recipe.nutrition ? {
      "@type": "NutritionInformation",
      "calories": recipe.nutrition.calories ? `${recipe.nutrition.calories} calories` : null,
      "carbohydrateContent": recipe.nutrition.carbs ? `${recipe.nutrition.carbs}g` : null,
      "proteinContent": recipe.nutrition.protein ? `${recipe.nutrition.protein}g` : null,
      "fatContent": recipe.nutrition.fat ? `${recipe.nutrition.fat}g` : null
    } : null,
    "recipeIngredient": recipe.ingredients || [],
    "recipeInstructions": recipe.instructions ? recipe.instructions.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "text": step
    })) : [],
    "suitableForDiet": recipe.dietType ? recipe.dietType.map(diet => diet) : []
  };
};

/**
 * Génère un schéma pour un plan nutritionnel
 * 
 * @param {Object} plan - Les données du plan nutritionnel
 * @returns {Object} - Le schéma Schema.org pour le plan nutritionnel
 */
export const generateNutritionPlanSchema = (plan) => {
  return {
    "@context": "https://schema.org",
    "@type": "Diet",
    "name": plan.name,
    "description": plan.description,
    "url": `https://www.velo-altitude.com/nutrition/${plan.id}`,
    "creator": {
      "@type": "Organization",
      "name": "Velo-Altitude",
      "url": "https://www.velo-altitude.com"
    },
    "dietFeatures": plan.features || [],
    "expertConsiderations": plan.considerations || [],
    "risks": plan.risks || [],
    "endorsers": plan.endorsers ? plan.endorsers.map(endorser => ({
      "@type": "Person",
      "name": endorser.name,
      "jobTitle": endorser.title
    })) : []
  };
};

/**
 * Génère un schéma pour un défi cycliste
 * 
 * @param {Object} challenge - Les données du défi
 * @returns {Object} - Le schéma Schema.org pour le défi
 */
export const generateChallengeSchema = (challenge) => {
  return {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    "name": challenge.name,
    "description": challenge.description,
    "url": `https://www.velo-altitude.com/challenges/${challenge.id}`,
    "startDate": challenge.startDate,
    "endDate": challenge.endDate,
    "location": {
      "@type": "Place",
      "name": challenge.location,
      "address": {
        "@type": "PostalAddress",
        "addressCountry": challenge.country,
        "addressRegion": challenge.region || ""
      }
    },
    "organizer": {
      "@type": "Organization",
      "name": "Velo-Altitude",
      "url": "https://www.velo-altitude.com"
    },
    "performer": {
      "@type": "SportsTeam",
      "name": "Participants Velo-Altitude"
    },
    "image": challenge.image || null,
    "eventStatus": "EventScheduled",
    "eventAttendanceMode": "OfflineEventAttendanceMode",
    "offers": {
      "@type": "Offer",
      "availability": "InStock",
      "price": challenge.price || "0",
      "priceCurrency": "EUR",
      "validFrom": challenge.registrationStart || challenge.startDate
    }
  };
};

/**
 * Génère un schéma pour la page d'accueil
 * 
 * @returns {Object} - Le schéma Schema.org pour la page d'accueil
 */
export const generateHomePageSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Velo-Altitude",
    "url": "https://www.velo-altitude.com",
    "description": "Plateforme complète dédiée au cyclisme de montagne, conçue pour devenir le plus grand dashboard vélo d'Europe",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.velo-altitude.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };
};

/**
 * Génère un schéma pour l'organisation Velo-Altitude
 * 
 * @returns {Object} - Le schéma Schema.org pour l'organisation
 */
export const generateOrganizationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Velo-Altitude",
    "url": "https://www.velo-altitude.com",
    "logo": "https://www.velo-altitude.com/images/logo.png",
    "sameAs": [
      "https://www.facebook.com/veloaltitude",
      "https://www.instagram.com/veloaltitude",
      "https://www.youtube.com/veloaltitude",
      "https://www.strava.com/clubs/veloaltitude"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+33-1-23-45-67-89",
      "contactType": "customer service",
      "email": "contact@velo-altitude.com",
      "availableLanguage": ["French", "English"]
    }
  };
};

/**
 * Génère un schéma BreadcrumbList pour le fil d'Ariane
 * 
 * @param {Array} items - Les éléments du fil d'Ariane
 * @returns {Object} - Le schéma Schema.org pour le fil d'Ariane
 */
export const generateBreadcrumbSchema = (items) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
};
