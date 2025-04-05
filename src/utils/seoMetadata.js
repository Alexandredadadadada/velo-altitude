/**
 * Métadonnées SEO pour les différentes sections du site Velo-Altitude
 * Ce fichier contient des métadonnées optimisées pour le référencement
 * à utiliser dans les composants avec react-helmet
 */

// Métadonnées par défaut pour le site
export const defaultMetadata = {
  fr: {
    title: "Velo-Altitude | La référence du cyclisme de montagne",
    description: "Découvrez Velo-Altitude, le dashboard complet pour les cyclistes de montagne avec des informations détaillées sur les cols, des programmes d'entraînement et des conseils nutritionnels.",
    keywords: "cyclisme, montagne, cols, vélo, entraînement cycliste, nutrition cycliste, Alpes, Pyrénées",
    ogImage: "https://www.velo-altitude.com/images/og-image-fr.jpg",
    twitterCard: "summary_large_image",
    canonical: "https://www.velo-altitude.com",
    alternateLanguages: [
      { hreflang: "fr", href: "https://www.velo-altitude.com" },
      { hreflang: "en", href: "https://www.velo-altitude.com/en" },
      { hreflang: "x-default", href: "https://www.velo-altitude.com" }
    ]
  },
  en: {
    title: "Velo-Altitude | The Mountain Cycling Reference",
    description: "Discover Velo-Altitude, the complete dashboard for mountain cyclists with detailed information on mountain passes, training programs and nutritional advice.",
    keywords: "cycling, mountain, cols, bicycle, cyclist training, cyclist nutrition, Alps, Pyrenees",
    ogImage: "https://www.velo-altitude.com/images/og-image-en.jpg",
    twitterCard: "summary_large_image",
    canonical: "https://www.velo-altitude.com/en",
    alternateLanguages: [
      { hreflang: "fr", href: "https://www.velo-altitude.com" },
      { hreflang: "en", href: "https://www.velo-altitude.com/en" },
      { hreflang: "x-default", href: "https://www.velo-altitude.com" }
    ]
  }
};

// Métadonnées pour la section Cols
export const colsMetadata = {
  fr: {
    title: "Cols | Velo-Altitude",
    description: "Explorez notre catalogue détaillé de cols de montagne avec profils d'élévation 3D, données techniques et conseils pour les cyclistes.",
    keywords: "cols cyclisme, montée vélo, Alpes, Pyrénées, Galibier, Tourmalet, Stelvio, profil cols",
    ogImage: "https://www.velo-altitude.com/images/cols-og-image-fr.jpg",
  },
  en: {
    title: "Mountain Passes | Velo-Altitude",
    description: "Explore our detailed catalog of mountain passes with 3D elevation profiles, technical data and advice for cyclists.",
    keywords: "cycling climbs, bicycle ascent, Alps, Pyrenees, Galibier, Tourmalet, Stelvio, climb profiles",
    ogImage: "https://www.velo-altitude.com/images/cols-og-image-en.jpg",
  }
};

// Métadonnées pour la section Entraînement
export const trainingMetadata = {
  fr: {
    title: "Programmes d'Entraînement | Velo-Altitude",
    description: "Améliorez vos performances en montagne avec nos programmes d'entraînement spécialisés pour cyclistes de tous niveaux.",
    keywords: "entraînement cyclisme, programme vélo, préparation col, HIIT cyclisme, puissance cycliste, endurance montagne",
    ogImage: "https://www.velo-altitude.com/images/training-og-image-fr.jpg",
  },
  en: {
    title: "Training Programs | Velo-Altitude",
    description: "Improve your mountain performance with our specialized training programs for cyclists of all levels.",
    keywords: "cycling training, bike program, climb preparation, cycling HIIT, cyclist power, mountain endurance",
    ogImage: "https://www.velo-altitude.com/images/training-og-image-en.jpg",
  }
};

// Métadonnées pour la section Nutrition
export const nutritionMetadata = {
  fr: {
    title: "Nutrition Cycliste | Velo-Altitude",
    description: "Optimisez votre alimentation avec nos recettes et plans nutritionnels spécialement conçus pour les cyclistes de montagne.",
    keywords: "nutrition cyclisme, alimentation vélo, recettes cyclistes, hydratation cyclisme, récupération nutritionnelle, énergie montagne",
    ogImage: "https://www.velo-altitude.com/images/nutrition-og-image-fr.jpg",
  },
  en: {
    title: "Cyclist Nutrition | Velo-Altitude",
    description: "Optimize your diet with our recipes and nutritional plans specially designed for mountain cyclists.",
    keywords: "cycling nutrition, bike diet, cyclist recipes, cycling hydration, nutritional recovery, mountain energy",
    ogImage: "https://www.velo-altitude.com/images/nutrition-og-image-en.jpg",
  }
};

// Métadonnées pour la section 7 Majeurs
export const sevenMajorsMetadata = {
  fr: {
    title: "Les 7 Majeurs | Velo-Altitude",
    description: "Créez votre propre défi des 7 cols majeurs et rejoignez la communauté des grimpeurs passionnés de Velo-Altitude.",
    keywords: "7 majeurs cyclisme, défi cols, challenge montagne, cols mythiques, parcours cyclistes, GPX cols",
    ogImage: "https://www.velo-altitude.com/images/seven-majors-og-image-fr.jpg",
  },
  en: {
    title: "The 7 Majors | Velo-Altitude",
    description: "Create your own 7 major passes challenge and join the Velo-Altitude passionate climbers community.",
    keywords: "7 majors cycling, climb challenge, mountain challenge, mythical passes, cycling routes, GPX climbs",
    ogImage: "https://www.velo-altitude.com/images/seven-majors-og-image-en.jpg",
  }
};

// Métadonnées pour les recettes spécifiques
export const recipeMetadata = {
  // Recette: Energy Oatmeal
  "energy-oatmeal": {
    fr: {
      title: "Porridge Énergétique pour Cyclistes | Recettes Velo-Altitude",
      description: "Préparez ce porridge énergétique riche en glucides complexes, parfait avant une sortie en montagne. Recette optimisée pour les cyclistes.",
      keywords: "porridge cycliste, petit-déjeuner vélo, recette énergie, glucides cyclisme, nutrition avant effort",
      ogImage: "https://www.velo-altitude.com/images/recipes/energy-oatmeal-fr.jpg",
      phase: "avant-effort",
      recipeType: "petit-déjeuner"
    },
    en: {
      title: "Energy Oatmeal for Cyclists | Velo-Altitude Recipes",
      description: "Prepare this energy oatmeal rich in complex carbohydrates, perfect before a mountain ride. Recipe optimized for cyclists.",
      keywords: "cyclist oatmeal, cycling breakfast, energy recipe, cycling carbs, pre-ride nutrition",
      ogImage: "https://www.velo-altitude.com/images/recipes/energy-oatmeal-en.jpg",
      phase: "pre-ride",
      recipeType: "breakfast"
    }
  },
  
  // Recette: Recovery Smoothie
  "recovery-smoothie": {
    fr: {
      title: "Smoothie de Récupération | Recettes Velo-Altitude",
      description: "Accélérez votre récupération après une sortie intense avec ce smoothie riche en protéines et antioxydants. Idéal pour les cyclistes de montagne.",
      keywords: "smoothie récupération, boisson après vélo, protéines cyclisme, antioxydants cyclistes, nutrition après effort",
      ogImage: "https://www.velo-altitude.com/images/recipes/recovery-smoothie-fr.jpg",
      phase: "après-effort",
      recipeType: "boisson"
    },
    en: {
      title: "Recovery Smoothie | Velo-Altitude Recipes",
      description: "Accelerate your recovery after an intense ride with this smoothie rich in proteins and antioxidants. Ideal for mountain cyclists.",
      keywords: "recovery smoothie, post-cycling drink, cycling proteins, cyclist antioxidants, post-ride nutrition",
      ogImage: "https://www.velo-altitude.com/images/recipes/recovery-smoothie-en.jpg",
      phase: "post-ride",
      recipeType: "drink"
    }
  },
  
  // Recette: Protein Pasta
  "protein-pasta": {
    fr: {
      title: "Pâtes Protéinées pour Cyclistes | Recettes Velo-Altitude",
      description: "Rechargez vos réserves de glycogène et favorisez la récupération musculaire avec ces pâtes riches en protéines. Parfait après une longue ascension.",
      keywords: "pâtes protéinées, repas cycliste, récupération musculaire, glycogène vélo, dîner après col",
      ogImage: "https://www.velo-altitude.com/images/recipes/protein-pasta-fr.jpg",
      phase: "après-effort",
      recipeType: "plat principal"
    },
    en: {
      title: "Protein Pasta for Cyclists | Velo-Altitude Recipes",
      description: "Replenish your glycogen stores and promote muscle recovery with these protein-rich pasta. Perfect after a long climb.",
      keywords: "protein pasta, cyclist meal, muscle recovery, cycling glycogen, post-climb dinner",
      ogImage: "https://www.velo-altitude.com/images/recipes/protein-pasta-en.jpg",
      phase: "post-ride",
      recipeType: "main dish"
    }
  },
  
  // Recette: Homemade Energy Bars
  "homemade-energy-bars": {
    fr: {
      title: "Barres Énergétiques Maison | Recettes Velo-Altitude",
      description: "Préparez vos propres barres énergétiques adaptées au cyclisme de montagne. Économiques et personnalisables selon vos besoins nutritionnels.",
      keywords: "barres énergétiques maison, snack cyclisme, énergie vélo, nutrition pendant effort, collation cycliste",
      ogImage: "https://www.velo-altitude.com/images/recipes/homemade-energy-bars-fr.jpg",
      phase: "pendant-effort",
      recipeType: "en-route"
    },
    en: {
      title: "Homemade Energy Bars | Velo-Altitude Recipes",
      description: "Prepare your own energy bars adapted to mountain cycling. Economical and customizable according to your nutritional needs.",
      keywords: "homemade energy bars, cycling snack, bike energy, during-ride nutrition, cyclist snack",
      ogImage: "https://www.velo-altitude.com/images/recipes/homemade-energy-bars-en.jpg",
      phase: "during-ride",
      recipeType: "on-the-go"
    }
  },
  
  // Recette: Hydration Drink
  "hydration-drink": {
    fr: {
      title: "Boisson d'Hydratation pour Cyclistes | Recettes Velo-Altitude",
      description: "Préparez votre propre boisson d'hydratation avec électrolytes pour maintenir vos performances lors des ascensions en altitude.",
      keywords: "boisson hydratation, électrolytes cyclisme, hydratation montagne, boisson isotonique maison, eau cycliste",
      ogImage: "https://www.velo-altitude.com/images/recipes/hydration-drink-fr.jpg",
      phase: "pendant-effort",
      recipeType: "boisson"
    },
    en: {
      title: "Hydration Drink for Cyclists | Velo-Altitude Recipes",
      description: "Prepare your own hydration drink with electrolytes to maintain your performance during high-altitude climbs.",
      keywords: "hydration drink, cycling electrolytes, mountain hydration, homemade isotonic drink, cyclist water",
      ogImage: "https://www.velo-altitude.com/images/recipes/hydration-drink-en.jpg",
      phase: "during-ride",
      recipeType: "drink"
    }
  }
};

// Métadonnées pour les programmes d'entraînement spécifiques
export const trainingProgramMetadata = {
  // Programme: Col Crusher
  "col-crusher": {
    fr: {
      title: "Programme Col Crusher | Entraînement Velo-Altitude",
      description: "Programme intensif de 8 semaines pour améliorer votre puissance en montée et conquérir les cols les plus difficiles.",
      keywords: "entraînement cols, puissance montée, programme cyclisme montagne, préparation cols difficiles, seuil lactique",
      ogImage: "https://www.velo-altitude.com/images/training/col-crusher-fr.jpg",
      duration: "8 semaines",
      level: "intermédiaire-avancé",
      focus: "puissance en montée"
    },
    en: {
      title: "Col Crusher Program | Velo-Altitude Training",
      description: "Intensive 8-week program to improve your climbing power and conquer the most difficult mountain passes.",
      keywords: "climb training, climbing power, mountain cycling program, difficult climbs preparation, lactate threshold",
      ogImage: "https://www.velo-altitude.com/images/training/col-crusher-en.jpg",
      duration: "8 weeks",
      level: "intermediate-advanced",
      focus: "climbing power"
    }
  },
  
  // Programme: Endurance Builder
  "endurance-builder": {
    fr: {
      title: "Programme Endurance Builder | Entraînement Velo-Altitude",
      description: "Développez votre endurance pour les longues journées en montagne avec ce programme progressif de 12 semaines.",
      keywords: "endurance cyclisme, fond vélo, programme longue distance, préparation gran fondo, cyclisme montagne",
      ogImage: "https://www.velo-altitude.com/images/training/endurance-builder-fr.jpg",
      duration: "12 semaines",
      level: "tous niveaux",
      focus: "endurance"
    },
    en: {
      title: "Endurance Builder Program | Velo-Altitude Training",
      description: "Develop your endurance for long mountain days with this progressive 12-week program.",
      keywords: "cycling endurance, bike base, long distance program, gran fondo preparation, mountain cycling",
      ogImage: "https://www.velo-altitude.com/images/training/endurance-builder-en.jpg",
      duration: "12 weeks",
      level: "all levels",
      focus: "endurance"
    }
  },
  
  // Programme: Alpine Climber
  "alpine-climber": {
    fr: {
      title: "Programme Alpine Climber | Entraînement Velo-Altitude",
      description: "Programme spécialisé de 10 semaines pour maîtriser les longues ascensions alpines et améliorer votre technique de grimpe.",
      keywords: "grimper cols, technique montée, programme alpes, cyclisme haute montagne, ascensions longues",
      ogImage: "https://www.velo-altitude.com/images/training/alpine-climber-fr.jpg",
      duration: "10 semaines",
      level: "intermédiaire",
      focus: "technique de grimpe"
    },
    en: {
      title: "Alpine Climber Program | Velo-Altitude Training",
      description: "Specialized 10-week program to master long alpine climbs and improve your climbing technique.",
      keywords: "climbing passes, ascent technique, alps program, high mountain cycling, long climbs",
      ogImage: "https://www.velo-altitude.com/images/training/alpine-climber-en.jpg",
      duration: "10 weeks",
      level: "intermediate",
      focus: "climbing technique"
    }
  },
  
  // Programme: Power Intervals
  "power-intervals": {
    fr: {
      title: "Programme Power Intervals | Entraînement Velo-Altitude",
      description: "Programme de 6 semaines axé sur les intervalles de haute intensité pour développer votre puissance explosive en montée.",
      keywords: "intervalles cyclisme, HIIT vélo, puissance explosive, entraînement fractionné, watts cyclisme",
      ogImage: "https://www.velo-altitude.com/images/training/power-intervals-fr.jpg",
      duration: "6 semaines",
      level: "avancé",
      focus: "puissance explosive"
    },
    en: {
      title: "Power Intervals Program | Velo-Altitude Training",
      description: "6-week program focused on high-intensity intervals to develop your explosive climbing power.",
      keywords: "cycling intervals, bike HIIT, explosive power, interval training, cycling watts",
      ogImage: "https://www.velo-altitude.com/images/training/power-intervals-en.jpg",
      duration: "6 weeks",
      level: "advanced",
      focus: "explosive power"
    }
  }
};

// Fonction pour obtenir les métadonnées d'une recette
export const getRecipeMetadata = (recipeId, language = 'fr') => {
  if (!recipeMetadata[recipeId]) {
    return nutritionMetadata[language]; // Fallback aux métadonnées générales de nutrition
  }
  return recipeMetadata[recipeId][language];
};

// Fonction pour obtenir les métadonnées d'un programme d'entraînement
export const getTrainingProgramMetadata = (programId, language = 'fr') => {
  if (!trainingProgramMetadata[programId]) {
    return trainingMetadata[language]; // Fallback aux métadonnées générales d'entraînement
  }
  return trainingProgramMetadata[programId][language];
};

// Fonction pour générer les balises meta pour les moteurs de recherche
export const generateMetaTags = (metadata) => {
  return [
    { name: "description", content: metadata.description },
    { name: "keywords", content: metadata.keywords },
    { property: "og:title", content: metadata.title },
    { property: "og:description", content: metadata.description },
    { property: "og:image", content: metadata.ogImage },
    { property: "og:type", content: "website" },
    { property: "og:url", content: metadata.canonical || defaultMetadata.fr.canonical },
    { name: "twitter:card", content: metadata.twitterCard || defaultMetadata.fr.twitterCard },
    { name: "twitter:title", content: metadata.title },
    { name: "twitter:description", content: metadata.description },
    { name: "twitter:image", content: metadata.ogImage }
  ];
};

// Fonction pour générer les balises link pour les langues alternatives
export const generateAlternateLanguageTags = (alternateLanguages) => {
  return alternateLanguages.map(lang => ({
    rel: "alternate",
    hreflang: lang.hreflang,
    href: lang.href
  }));
};
