/**
 * Service de données pour Velo-Altitude
 * 
 * Ce service centralise l'accès aux données pour toutes les catégories
 * et gère les requêtes pour les contenus connexes et le contenu principal.
 */

import axios from 'axios';
import { ENV } from '../config/environment';

// URL de base de l'API
const API_BASE_URL = ENV.app.apiUrl || 'https://api.velo-altitude.com';

/**
 * Récupère les données d'une catégorie
 * @param {string} category - Catégorie (cols, programs, nutrition, challenges)
 * @param {string} subcategory - Sous-catégorie (optionnel)
 * @returns {Promise<Array>} - Tableau d'éléments de la catégorie
 */
export const fetchCategoryData = async (category, subcategory = null) => {
  try {
    let endpoint = `${API_BASE_URL}/${category}`;
    
    // Ajouter la sous-catégorie si spécifiée
    if (subcategory) {
      endpoint += `/${subcategory}`;
    }
    
    const response = await axios.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération des données de ${category}:`, error);
    throw new Error(error.message || 'Erreur lors de la récupération des données');
  }
};

/**
 * Récupère un élément spécifique
 * @param {string} category - Catégorie (cols, programs, nutrition, challenges)
 * @param {string} id - Identifiant ou slug de l'élément
 * @returns {Promise<Object>} - Données de l'élément
 */
export const fetchItemById = async (category, id) => {
  try {
    const endpoint = `${API_BASE_URL}/${category}/${id}`;
    const response = await axios.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'élément ${id}:`, error);
    throw new Error(error.message || 'Élément non trouvé');
  }
};

/**
 * Récupère les contenus connexes pour un élément
 * @param {string} category - Catégorie de l'élément actuel
 * @param {string} subcategory - Sous-catégorie (optionnel)
 * @param {string} itemId - Identifiant de l'élément actuel
 * @param {string} language - Langue (fr/en)
 * @returns {Promise<Object>} - Objets de contenu connexe par type de relation
 */
export const fetchRelatedContent = async (category, subcategory = null, itemId = null, language = 'fr') => {
  // Si nous sommes sur une page de catégorie sans item spécifique
  if (!itemId) {
    return fetchCategoryRecommendations(category, subcategory, language);
  }
  
  try {
    const endpoint = `${API_BASE_URL}/related/${category}/${itemId}?lang=${language}`;
    const response = await axios.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des contenus connexes:', error);
    // En cas d'erreur, retourner un objet vide plutôt que de propager l'erreur
    return {};
  }
};

/**
 * Récupère des recommandations générales pour une catégorie
 * Utilisé quand on n'a pas d'élément spécifique (pages d'index)
 * @param {string} category - Catégorie 
 * @param {string} subcategory - Sous-catégorie (optionnel)
 * @param {string} language - Langue (fr/en)
 * @returns {Promise<Object>} - Objets de recommandations
 */
const fetchCategoryRecommendations = async (category, subcategory = null, language = 'fr') => {
  try {
    let endpoint = `${API_BASE_URL}/recommendations/${category}`;
    
    // Ajouter la sous-catégorie si spécifiée
    if (subcategory) {
      endpoint += `/${subcategory}`;
    }
    
    endpoint += `?lang=${language}`;
    
    const response = await axios.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des recommandations:', error);
    // Données de secours en cas d'erreur API
    return {
      popular: [],
      recent: [],
      featured: []
    };
  }
};

/**
 * Recherche dans toutes les catégories
 * @param {string} query - Terme de recherche
 * @param {string} language - Langue (fr/en)
 * @returns {Promise<Object>} - Résultats par catégorie
 */
export const searchAllCategories = async (query, language = 'fr') => {
  try {
    const endpoint = `${API_BASE_URL}/search?q=${encodeURIComponent(query)}&lang=${language}`;
    const response = await axios.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    throw new Error(error.message || 'Erreur lors de la recherche');
  }
};

/**
 * Version fallback locale pour les démonstrations et le développement
 * Simule des données pour le cas où l'API n'est pas disponible
 * Ces données sont utilisées uniquement en développement
 */
export const getFallbackData = (category, subcategory = null) => {
  // Données de démonstration pour chaque catégorie
  const fallbackData = {
    cols: [
      {
        id: 'alpe-dhuez',
        slug: 'alpe-dhuez',
        name: { fr: "L'Alpe d'Huez", en: "Alpe d'Huez" },
        description: {
          fr: "L'un des cols les plus emblématiques du Tour de France avec ses 21 virages numérotés et ses pentes exigeantes.",
          en: "One of the most iconic climbs of the Tour de France with its 21 numbered hairpins and challenging slopes."
        },
        altitude: 1860,
        length: 13.8,
        gradient: 8.1,
        difficulty: 4,
        region: 'Alps',
        country: 'France',
        image: '/images/cols/alpe-dhuez.jpg',
        featured: 5,
        tags: ['Tour de France', 'Iconic', 'Alps'],
        last_updated: '2025-03-15'
      },
      {
        id: 'tourmalet',
        slug: 'col-du-tourmalet',
        name: { fr: "Col du Tourmalet", en: "Col du Tourmalet" },
        description: {
          fr: "Le géant des Pyrénées, le col le plus fréquemment gravi dans l'histoire du Tour de France.",
          en: "The giant of the Pyrenees, the most frequently climbed pass in Tour de France history."
        },
        altitude: 2115,
        length: 19,
        gradient: 7.4,
        difficulty: 5,
        region: 'Pyrenees',
        country: 'France',
        image: '/images/cols/tourmalet.jpg',
        featured: 5,
        tags: ['Tour de France', 'Pyrenees', 'Iconic'],
        last_updated: '2025-03-10'
      },
      {
        id: 'stelvio',
        slug: 'passo-dello-stelvio',
        name: { fr: "Passo dello Stelvio", en: "Stelvio Pass" },
        description: {
          fr: "Le col alpin par excellence avec ses 48 virages en épingle légendaires et ses panoramas à couper le souffle.",
          en: "The quintessential Alpine pass with its 48 legendary hairpin turns and breathtaking panoramas."
        },
        altitude: 2758,
        length: 24.3,
        gradient: 7.4,
        difficulty: 5,
        region: 'Alps',
        country: 'Italy',
        image: '/images/cols/stelvio.jpg',
        featured: 5,
        tags: ['Giro d\'Italia', 'Alps', 'Iconic'],
        last_updated: '2025-02-28'
      }
    ],
    programs: [
      {
        id: 'alps-preparation',
        slug: 'preparation-cols-alpes',
        name: { fr: "Préparation Cols des Alpes", en: "Alps Pass Preparation" },
        description: {
          fr: "Programme complet de 12 semaines pour préparer efficacement une semaine de cyclisme dans les Alpes.",
          en: "Complete 12-week program to effectively prepare for a week of cycling in the Alps."
        },
        level: 3,
        duration: 12,
        sessions: 36,
        intensity: 4,
        image: '/images/programs/alps-prep.jpg',
        featured: 5,
        tags: ['Alps', 'Endurance', 'Climbing'],
        last_updated: '2025-03-20'
      },
      {
        id: 'climbing-specialist',
        slug: 'specialiste-grimpe',
        name: { fr: "Spécialiste Grimpe", en: "Climbing Specialist" },
        description: {
          fr: "Huit semaines d'entraînement focalisées sur l'amélioration de vos capacités en montée.",
          en: "Eight weeks of training focused on improving your climbing abilities."
        },
        level: 4,
        duration: 8,
        sessions: 24,
        intensity: 4,
        image: '/images/programs/climbing-specialist.jpg',
        featured: 4,
        tags: ['Climbing', 'Power', 'Technique'],
        last_updated: '2025-03-05'
      }
    ],
    nutrition: [
      {
        id: 'col-day-nutrition',
        slug: 'nutrition-jour-col',
        name: { fr: "Nutrition Jour de Col", en: "Pass Day Nutrition" },
        description: {
          fr: "Plan nutritionnel complet pour optimiser votre alimentation avant, pendant et après l'ascension d'un col.",
          en: "Complete nutritional plan to optimize your diet before, during, and after climbing a pass."
        },
        type: 'plan',
        timing: ['before', 'during', 'after'],
        prepTime: 30,
        calories: 2500,
        image: '/images/nutrition/col-day.jpg',
        featured: 5,
        tags: ['Performance', 'Recovery', 'Hydration'],
        last_updated: '2025-03-25'
      },
      {
        id: 'energy-bars',
        slug: 'barres-energie-maison',
        name: { fr: "Barres d'Énergie Maison", en: "Homemade Energy Bars" },
        description: {
          fr: "Recettes de barres énergétiques naturelles et économiques, parfaites pour vos sorties en montagne.",
          en: "Recipes for natural and economical energy bars, perfect for your mountain rides."
        },
        type: 'recipe',
        timing: ['during'],
        prepTime: 45,
        calories: 220,
        image: '/images/nutrition/energy-bars.jpg',
        featured: 4,
        tags: ['Recipe', 'Energy', 'Natural'],
        last_updated: '2025-02-15'
      }
    ],
    challenges: [
      {
        id: 'seven-majors-alps',
        slug: 'sept-majeurs-alpes',
        name: { fr: "Les 7 Majeurs des Alpes", en: "The 7 Majors of the Alps" },
        description: {
          fr: "Le défi ultime regroupant les 7 cols les plus emblématiques des Alpes françaises.",
          en: "The ultimate challenge bringing together the 7 most iconic passes of the French Alps."
        },
        difficulty: 5,
        colCount: 7,
        totalDistance: 350,
        totalElevation: 12000,
        region: 'Alps',
        image: '/images/challenges/seven-majors-alps.jpg',
        featured: 5,
        tags: ['Alps', 'Iconic', 'Multi-day'],
        last_updated: '2025-03-30'
      },
      {
        id: 'pyrenees-trilogy',
        slug: 'trilogie-pyreneenne',
        name: { fr: "Trilogie Pyrénéenne", en: "Pyrenean Trilogy" },
        description: {
          fr: "Trois cols mythiques des Pyrénées à conquérir en trois jours: Tourmalet, Aubisque et Peyresourde.",
          en: "Three mythical Pyrenean passes to conquer in three days: Tourmalet, Aubisque, and Peyresourde."
        },
        difficulty: 4,
        colCount: 3,
        totalDistance: 180,
        totalElevation: 5500,
        region: 'Pyrenees',
        image: '/images/challenges/pyrenees-trilogy.jpg',
        featured: 4,
        tags: ['Pyrenees', 'Tour de France', 'Trilogy'],
        last_updated: '2025-03-18'
      }
    ]
  };
  
  // Si une sous-catégorie est spécifiée, filtrer les résultats
  if (subcategory && fallbackData[category]) {
    // Logique de filtrage simplifiée pour la démonstration
    return fallbackData[category].filter(item => {
      if (subcategory === 'alps' && item.region === 'Alps') return true;
      if (subcategory === 'pyrenees' && item.region === 'Pyrenees') return true;
      if (subcategory === 'famous' && item.featured >= 4) return true;
      if (subcategory === 'easy' && item.difficulty <= 2) return true;
      if (subcategory === 'challenge' && item.difficulty >= 4) return true;
      if (subcategory === 'col-specific' && item.tags?.includes('Climbing')) return true;
      if (subcategory === 'recovery' && item.tags?.includes('Recovery')) return true;
      return false;
    });
  }
  
  return fallbackData[category] || [];
};

/**
 * Fonction de démonstration pour les contenus connexes
 * @returns {Object} Données de démonstration
 */
export const getFallbackRelatedContent = () => {
  return {
    same_region: [
      {
        id: 'col-galibier',
        name: { fr: "Col du Galibier", en: "Col du Galibier" },
        category: 'cols',
        region: 'Alps',
        difficulty: 5,
        altitude: 2642,
        image: '/images/cols/galibier.jpg'
      },
      {
        id: 'col-croix-fer',
        name: { fr: "Col de la Croix de Fer", en: "Col de la Croix de Fer" },
        category: 'cols',
        region: 'Alps',
        difficulty: 4,
        altitude: 2067,
        image: '/images/cols/croix-fer.jpg'
      }
    ],
    similar_difficulty: [
      {
        id: 'col-izoard',
        name: { fr: "Col d'Izoard", en: "Col d'Izoard" },
        category: 'cols',
        region: 'Alps',
        difficulty: 4,
        altitude: 2360,
        image: '/images/cols/izoard.jpg'
      }
    ],
    complementary_training: [
      {
        id: 'alpe-dhuez-program',
        name: { fr: "Programme Alpe d'Huez", en: "Alpe d'Huez Program" },
        category: 'programs',
        level: 4,
        duration: 8,
        image: '/images/programs/alpe-dhuez.jpg'
      }
    ],
    related_nutrition: [
      {
        id: 'altitude-hydration',
        name: { fr: "Hydratation en Altitude", en: "Altitude Hydration" },
        category: 'nutrition',
        type: 'plan',
        image: '/images/nutrition/altitude-hydration.jpg'
      }
    ]
  };
};

// Exportation par défaut
export default {
  fetchCategoryData,
  fetchItemById,
  fetchRelatedContent,
  searchAllCategories,
  getFallbackData,
  getFallbackRelatedContent
};
