/**
 * Script de génération de données structurées pour Velo-Altitude
 * 
 * Ce script analyse les données du site et génère des fichiers JSON-LD
 * pour améliorer l'indexation par les moteurs de recherche.
 * 
 * Usage: node generate-structured-data.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SITE_URL = 'https://www.velo-altitude.com';
const DATA_DIR = path.join(__dirname, '../src/data');
const OUTPUT_DIR = path.join(__dirname, '../public/structured-data');
const LANGUAGES = ['fr', 'en'];

// Créer le répertoire de sortie s'il n'existe pas
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Génère le schéma pour l'organisation
 */
function generateOrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    "name": "Velo-Altitude",
    "url": SITE_URL,
    "logo": {
      "@type": "ImageObject",
      "url": `${SITE_URL}/images/logo.png`,
      "width": 600,
      "height": 60
    },
    "sameAs": [
      "https://www.facebook.com/veloaltitude",
      "https://www.instagram.com/veloaltitude",
      "https://www.youtube.com/c/veloaltitude",
      "https://www.strava.com/clubs/veloaltitude"
    ]
  };

  // Écrire le fichier
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'organization.json'),
    JSON.stringify(schema, null, 2)
  );

  console.log('✅ Schéma Organization généré');
}

/**
 * Génère le schéma pour le site web
 */
function generateWebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    "url": SITE_URL,
    "name": "Velo-Altitude",
    "description": "Plateforme complète dédiée au cyclisme de montagne avec cols, entraînements, nutrition et défis",
    "publisher": {
      "@id": `${SITE_URL}/#organization`
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  // Écrire le fichier
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'website.json'),
    JSON.stringify(schema, null, 2)
  );

  console.log('✅ Schéma WebSite généré');
}

/**
 * Génère les schémas pour les cols
 */
function generateColsSchemas() {
  try {
    // Lire le répertoire des cols
    const colsDir = path.join(DATA_DIR, 'cols/enriched');
    if (!fs.existsSync(colsDir)) {
      console.log('⚠️ Répertoire des cols non trouvé');
      return;
    }

    const colFiles = fs.readdirSync(colsDir).filter(file => file.endsWith('.json'));
    console.log(`🔍 Traitement de ${colFiles.length} cols...`);

    // Créer le répertoire de sortie pour les cols
    const colsOutputDir = path.join(OUTPUT_DIR, 'cols');
    if (!fs.existsSync(colsOutputDir)) {
      fs.mkdirSync(colsOutputDir, { recursive: true });
    }

    // Traiter chaque col
    colFiles.forEach(file => {
      const colData = JSON.parse(fs.readFileSync(path.join(colsDir, file), 'utf8'));
      const colSlug = file.replace('.json', '');
      
      // Générer le schéma pour chaque langue
      LANGUAGES.forEach(lang => {
        const colUrl = lang === 'fr' 
          ? `${SITE_URL}/cols/${colSlug}` 
          : `${SITE_URL}/${lang}/cols/${colSlug}`;

        const schema = {
          "@context": "https://schema.org",
          "@type": ["TouristAttraction", "Place"],
          "@id": `${colUrl}/#place`,
          "name": colData.name,
          "description": colData.description?.[lang] || colData.description?.fr || colData.description,
          "url": colUrl,
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": colData.coordinates?.summit?.lat || colData.coordinates?.lat,
            "longitude": colData.coordinates?.summit?.lng || colData.coordinates?.lng,
            "elevation": colData.altitude
          },
          "address": {
            "@type": "PostalAddress",
            "addressCountry": colData.country,
            "addressRegion": colData.region
          },
          "image": colData.images && colData.images.length > 0 
            ? `${SITE_URL}${colData.images[0]}` 
            : `${SITE_URL}/images/cols/default-col.jpg`,
          "additionalProperty": [
            {
              "@type": "PropertyValue",
              "name": "Altitude",
              "value": `${colData.altitude} m`
            },
            {
              "@type": "PropertyValue",
              "name": "Longueur",
              "value": `${colData.length} km`
            },
            {
              "@type": "PropertyValue",
              "name": "Pente moyenne",
              "value": `${colData.averageGradient || colData.gradient}%`
            }
          ],
          "isAccessibleForFree": true,
          "touristType": ["Cyclists", "Mountain enthusiasts"],
          "inLanguage": lang
        };

        // Écrire le fichier
        const outputFileName = lang === 'fr' 
          ? `${colSlug}.json` 
          : `${colSlug}.${lang}.json`;
        
        fs.writeFileSync(
          path.join(colsOutputDir, outputFileName),
          JSON.stringify(schema, null, 2)
        );
      });
    });

    console.log(`✅ Schémas générés pour ${colFiles.length} cols`);
  } catch (error) {
    console.error('❌ Erreur lors de la génération des schémas pour les cols:', error);
  }
}

/**
 * Génère les schémas pour les programmes d'entraînement
 */
function generateTrainingSchemas() {
  try {
    // Lire le répertoire des programmes d'entraînement
    const trainingDir = path.join(DATA_DIR, 'training');
    if (!fs.existsSync(trainingDir)) {
      console.log('⚠️ Répertoire des programmes d\'entraînement non trouvé');
      return;
    }

    const trainingFiles = fs.readdirSync(trainingDir).filter(file => file.endsWith('.json'));
    console.log(`🔍 Traitement de ${trainingFiles.length} programmes d'entraînement...`);

    // Créer le répertoire de sortie pour les programmes
    const trainingOutputDir = path.join(OUTPUT_DIR, 'training');
    if (!fs.existsSync(trainingOutputDir)) {
      fs.mkdirSync(trainingOutputDir, { recursive: true });
    }

    // Traiter chaque programme
    trainingFiles.forEach(file => {
      const programData = JSON.parse(fs.readFileSync(path.join(trainingDir, file), 'utf8'));
      const programSlug = file.replace('.json', '');
      
      // Générer le schéma pour chaque langue
      LANGUAGES.forEach(lang => {
        const programUrl = lang === 'fr' 
          ? `${SITE_URL}/training/${programSlug}` 
          : `${SITE_URL}/${lang}/training/${programSlug}`;

        const schema = {
          "@context": "https://schema.org",
          "@type": "Course",
          "@id": `${programUrl}/#course`,
          "name": programData.name[lang] || programData.name.fr,
          "description": programData.description[lang] || programData.description.fr,
          "url": programUrl,
          "provider": {
            "@type": "Organization",
            "name": "Velo-Altitude",
            "url": SITE_URL
          },
          "timeRequired": `P${programData.duration}W`, // Format ISO 8601 pour la durée
          "educationalLevel": programData.level,
          "audience": {
            "@type": "Audience",
            "audienceType": programData.target_audience[lang] || programData.target_audience.fr
          },
          "teaches": "Mountain cycling performance",
          "hasCourseInstance": programData.weeks.map((week, index) => ({
            "@type": "CourseInstance",
            "name": week.title[lang] || week.title.fr,
            "courseWorkload": `P1W` // Une semaine
          })),
          "inLanguage": lang
        };

        // Écrire le fichier
        const outputFileName = lang === 'fr' 
          ? `${programSlug}.json` 
          : `${programSlug}.${lang}.json`;
        
        fs.writeFileSync(
          path.join(trainingOutputDir, outputFileName),
          JSON.stringify(schema, null, 2)
        );
      });
    });

    console.log(`✅ Schémas générés pour ${trainingFiles.length} programmes d'entraînement`);
  } catch (error) {
    console.error('❌ Erreur lors de la génération des schémas pour les programmes d\'entraînement:', error);
  }
}

/**
 * Génère les schémas pour les recettes
 */
function generateRecipeSchemas() {
  try {
    // Lire le répertoire des recettes
    const recipesDir = path.join(DATA_DIR, 'nutrition/recipes');
    if (!fs.existsSync(recipesDir)) {
      console.log('⚠️ Répertoire des recettes non trouvé');
      return;
    }

    const recipeFiles = fs.readdirSync(recipesDir).filter(file => file.endsWith('.json'));
    console.log(`🔍 Traitement de ${recipeFiles.length} recettes...`);

    // Créer le répertoire de sortie pour les recettes
    const recipesOutputDir = path.join(OUTPUT_DIR, 'nutrition/recipes');
    if (!fs.existsSync(recipesOutputDir)) {
      fs.mkdirSync(recipesOutputDir, { recursive: true });
    }

    // Traiter chaque recette
    recipeFiles.forEach(file => {
      const recipeData = JSON.parse(fs.readFileSync(path.join(recipesDir, file), 'utf8'));
      const recipeSlug = file.replace('.json', '');
      
      // Générer le schéma pour chaque langue
      LANGUAGES.forEach(lang => {
        const recipeUrl = lang === 'fr' 
          ? `${SITE_URL}/nutrition/recipes/${recipeSlug}` 
          : `${SITE_URL}/${lang}/nutrition/recipes/${recipeSlug}`;

        // Formatage des ingrédients
        const recipeIngredient = recipeData.ingredients.map(ingredient => 
          `${ingredient.quantity} ${ingredient.unit} ${ingredient.name[lang] || ingredient.name.fr}`
        );
        
        // Formatage des instructions
        const recipeInstructions = recipeData.instructions.map(instruction => ({
          "@type": "HowToStep",
          "text": instruction[lang] || instruction.fr
        }));

        const schema = {
          "@context": "https://schema.org",
          "@type": "Recipe",
          "@id": `${recipeUrl}/#recipe`,
          "name": recipeData.name[lang] || recipeData.name.fr,
          "url": recipeUrl,
          "image": recipeData.images && recipeData.images.length > 0 
            ? `${SITE_URL}${recipeData.images[0].url}` 
            : `${SITE_URL}/images/nutrition/default-recipe.jpg`,
          "author": {
            "@type": "Organization",
            "name": "Velo-Altitude"
          },
          "datePublished": recipeData.created_at,
          "description": recipeData.description 
            ? (recipeData.description[lang] || recipeData.description.fr) 
            : "",
          "prepTime": `PT${recipeData.preparation_time}M`,
          "cookTime": recipeData.cooking_time ? `PT${recipeData.cooking_time}M` : null,
          "totalTime": `PT${recipeData.preparation_time + (recipeData.cooking_time || 0)}M`,
          "recipeCategory": recipeData.category,
          "recipeCuisine": "Sport nutrition",
          "recipeYield": `${recipeData.portions} portions`,
          "recipeIngredient": recipeIngredient,
          "recipeInstructions": recipeInstructions,
          "nutrition": recipeData.nutritional_info ? {
            "@type": "NutritionInformation",
            "calories": `${recipeData.nutritional_info.per_portion.calories} calories`,
            "carbohydrateContent": `${recipeData.nutritional_info.per_portion.carbs}g`,
            "proteinContent": `${recipeData.nutritional_info.per_portion.protein}g`,
            "fatContent": `${recipeData.nutritional_info.per_portion.fat}g`,
            "fiberContent": `${recipeData.nutritional_info.per_portion.fiber}g`
          } : null,
          "suitableForDiet": "https://schema.org/SportsDiet",
          "keywords": `cyclisme, nutrition, ${recipeData.category}, ${recipeData.consumption_moment}`,
          "inLanguage": lang
        };

        // Écrire le fichier
        const outputFileName = lang === 'fr' 
          ? `${recipeSlug}.json` 
          : `${recipeSlug}.${lang}.json`;
        
        fs.writeFileSync(
          path.join(recipesOutputDir, outputFileName),
          JSON.stringify(schema, null, 2)
        );
      });
    });

    console.log(`✅ Schémas générés pour ${recipeFiles.length} recettes`);
  } catch (error) {
    console.error('❌ Erreur lors de la génération des schémas pour les recettes:', error);
  }
}

/**
 * Génère les schémas pour les défis "7 Majeurs"
 */
function generateSevenMajorsSchemas() {
  try {
    // Lire le répertoire des défis
    const challengesDir = path.join(DATA_DIR, 'seven-majors');
    if (!fs.existsSync(challengesDir)) {
      console.log('⚠️ Répertoire des défis "7 Majeurs" non trouvé');
      return;
    }

    const challengeFiles = fs.readdirSync(challengesDir).filter(file => file.endsWith('.json'));
    console.log(`🔍 Traitement de ${challengeFiles.length} défis "7 Majeurs"...`);

    // Créer le répertoire de sortie pour les défis
    const challengesOutputDir = path.join(OUTPUT_DIR, 'seven-majors');
    if (!fs.existsSync(challengesOutputDir)) {
      fs.mkdirSync(challengesOutputDir, { recursive: true });
    }

    // Traiter chaque défi
    challengeFiles.forEach(file => {
      const challengeData = JSON.parse(fs.readFileSync(path.join(challengesDir, file), 'utf8'));
      const challengeSlug = file.replace('.json', '');
      
      // Générer le schéma pour chaque langue
      LANGUAGES.forEach(lang => {
        const challengeUrl = lang === 'fr' 
          ? `${SITE_URL}/seven-majors/${challengeSlug}` 
          : `${SITE_URL}/${lang}/seven-majors/${challengeSlug}`;

        const schema = {
          "@context": "https://schema.org",
          "@type": "SportsEvent",
          "@id": `${challengeUrl}/#sportsevent`,
          "name": challengeData.name[lang] || challengeData.name.fr,
          "description": challengeData.description[lang] || challengeData.description.fr,
          "url": challengeUrl,
          "image": challengeData.images && challengeData.images.length > 0 
            ? `${SITE_URL}${challengeData.images[0].url}` 
            : `${SITE_URL}/images/seven-majors/default-challenge.jpg`,
          "startDate": challengeData.recommendations?.best_season?.[0], // Premier mois recommandé
          "endDate": challengeData.recommendations?.best_season?.[challengeData.recommendations.best_season.length - 1], // Dernier mois recommandé
          "location": {
            "@type": "Place",
            "name": challengeData.recommendations?.suggested_base || "Europe",
            "address": {
              "@type": "PostalAddress",
              "addressCountry": "France"
            }
          },
          "organizer": {
            "@type": "Organization",
            "name": "Velo-Altitude",
            "url": SITE_URL
          },
          "eventStatus": "https://schema.org/EventScheduled",
          "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
          "sport": "Cycling",
          "additionalProperty": [
            {
              "@type": "PropertyValue",
              "name": "Distance totale",
              "value": `${challengeData.total_distance} km`
            },
            {
              "@type": "PropertyValue",
              "name": "Dénivelé total",
              "value": `${challengeData.total_elevation} m`
            },
            {
              "@type": "PropertyValue",
              "name": "Durée estimée",
              "value": `${challengeData.estimated_completion_time?.min_days} à ${challengeData.estimated_completion_time?.max_days} jours`
            },
            {
              "@type": "PropertyValue",
              "name": "Difficulté",
              "value": challengeData.difficulty
            }
          ],
          "inLanguage": lang
        };

        // Écrire le fichier
        const outputFileName = lang === 'fr' 
          ? `${challengeSlug}.json` 
          : `${challengeSlug}.${lang}.json`;
        
        fs.writeFileSync(
          path.join(challengesOutputDir, outputFileName),
          JSON.stringify(schema, null, 2)
        );
      });
    });

    console.log(`✅ Schémas générés pour ${challengeFiles.length} défis "7 Majeurs"`);
  } catch (error) {
    console.error('❌ Erreur lors de la génération des schémas pour les défis "7 Majeurs":', error);
  }
}

/**
 * Génère un fichier index.json qui liste tous les schémas générés
 */
function generateIndex() {
  try {
    // Parcourir tous les fichiers générés
    const schemas = [];
    
    function scanDirectory(dir, baseUrl = '') {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          scanDirectory(filePath, `${baseUrl}/${file}`);
        } else if (file.endsWith('.json')) {
          const relativePath = path.relative(OUTPUT_DIR, filePath);
          const url = `${SITE_URL}${baseUrl}/${file.replace('.json', '')}`;
          
          schemas.push({
            path: relativePath,
            url: url
          });
        }
      });
    }
    
    scanDirectory(OUTPUT_DIR);
    
    // Écrire le fichier index
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'index.json'),
      JSON.stringify({
        generated: new Date().toISOString(),
        count: schemas.length,
        schemas: schemas
      }, null, 2)
    );
    
    console.log(`✅ Index généré avec ${schemas.length} schémas`);
  } catch (error) {
    console.error('❌ Erreur lors de la génération de l\'index:', error);
  }
}

// Exécuter la génération des schémas
console.log('🚀 Début de la génération des données structurées...');

generateOrganizationSchema();
generateWebsiteSchema();
generateColsSchemas();
generateTrainingSchemas();
generateRecipeSchemas();
generateSevenMajorsSchemas();
generateIndex();

console.log('✅ Génération des données structurées terminée!');
