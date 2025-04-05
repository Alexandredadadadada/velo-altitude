import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import useNutritionCalculator from './useNutritionCalculator';
import useMealPlanner from './useMealPlanner';
import useFoodJournal from './useFoodJournal';
import axios from 'axios';

/**
 * Hook personnalisé pour gérer l'état et la logique du Planificateur de Nutrition
 * Centralise les états et logiques des sous-composants (calculateur, plan de repas, journal alimentaire)
 * Optimisé avec useCallback et useMemo pour minimiser les re-renders
 */
const useNutritionPlanner = () => {
  // État de l'onglet actif
  const [activeTab, setActiveTab] = useState(0);
  const [showResults, setShowResults] = useState(false);
  
  // Hooks personnalisés
  const nutritionCalculator = useNutritionCalculator();
  const mealPlanner = useMealPlanner();
  const foodJournal = useFoodJournal();
  
  // Cache local pour les résultats des calculs et plans générés
  const calculationCache = useRef(new Map());
  const planGenerationCache = useRef(new Map());
  
  // État pour suivre les requêtes en cours
  const pendingRequests = useRef({});
  
  // Extraction des données et fonctions pertinentes des hooks
  const {
    userProfile,
    setUserProfile,
    calculatorResults,
    calculateNutrition: originalCalculateNutrition,
    error: calculatorError,
    loading: calculatorLoading
  } = nutritionCalculator;
  
  const {
    savedPlans,
    planName,
    showSaveForm,
    setPlanName,
    setShowSaveForm,
    loadSavedPlans,
    generateMealPlan: originalGenerateMealPlan,
    savePlan,
    deletePlan,
    error: plannerError,
    loading: plannerLoading
  } = mealPlanner;
  
  // Génère un plan de repas basé sur les résultats du calculateur
  const [mealPlan, setMealPlan] = useState([]);
  
  // Version optimisée de calculateNutrition avec cache local
  const calculateNutrition = useCallback(async (profileData) => {
    // Créer une clé de cache basée sur les données d'entrée
    const cacheKey = JSON.stringify(profileData);
    
    // Vérifier si les calculs sont déjà en cache
    if (calculationCache.current.has(cacheKey)) {
      const cachedResults = calculationCache.current.get(cacheKey);
      return cachedResults;
    }
    
    // Vérifier si une requête identique est déjà en cours
    if (pendingRequests.current[cacheKey]) {
      return pendingRequests.current[cacheKey];
    }
    
    // Créer une promesse pour la requête en cours
    const resultPromise = originalCalculateNutrition(profileData);
    pendingRequests.current[cacheKey] = resultPromise;
    
    try {
      const results = await resultPromise;
      
      // Stocker les résultats dans le cache local
      calculationCache.current.set(cacheKey, results);
      
      // Limiter la taille du cache (max 20 entrées)
      if (calculationCache.current.size > 20) {
        const firstKey = calculationCache.current.keys().next().value;
        calculationCache.current.delete(firstKey);
      }
      
      return results;
    } catch (error) {
      throw error;
    } finally {
      // Nettoyer la référence à la requête en cours
      delete pendingRequests.current[cacheKey];
    }
  }, [originalCalculateNutrition]);
  
  // Version optimisée de generateMealPlan avec cache local
  const generateMealPlan = useCallback((nutritionResults) => {
    if (!nutritionResults) return [];
    
    // Créer une clé de cache basée sur les résultats nutritionnels
    const cacheKey = JSON.stringify(nutritionResults);
    
    // Vérifier si le plan est déjà en cache
    if (planGenerationCache.current.has(cacheKey)) {
      return planGenerationCache.current.get(cacheKey);
    }
    
    // Générer un nouveau plan
    const generatedPlan = originalGenerateMealPlan(nutritionResults);
    
    // Stocker le plan dans le cache local
    planGenerationCache.current.set(cacheKey, generatedPlan);
    
    // Limiter la taille du cache (max 10 entrées)
    if (planGenerationCache.current.size > 10) {
      const firstKey = planGenerationCache.current.keys().next().value;
      planGenerationCache.current.delete(firstKey);
    }
    
    return generatedPlan;
  }, [originalGenerateMealPlan]);
  
  // Gère les changements d'onglets avec useCallback pour optimisation
  const handleTabChange = useCallback((event, newValue) => {
    // Seulement mettre à jour si la valeur change pour éviter les re-renders inutiles
    if (activeTab !== newValue) {
      setActiveTab(newValue);
    }
  }, [activeTab]);
  
  // Affiche les résultats et génère un plan de repas basé sur les calculs
  // Optimisé pour éviter les re-calculs inutiles
  useEffect(() => {
    if (calculatorResults && !mealPlan.length) {
      setShowResults(true);
      const generatedMealPlan = generateMealPlan(calculatorResults);
      setMealPlan(generatedMealPlan);
    }
  }, [calculatorResults, mealPlan.length, generateMealPlan]);
  
  // Charge les plans sauvegardés au montage du composant
  // Utilise AbortController pour annuler les requêtes si le composant est démonté
  useEffect(() => {
    const controller = new AbortController();
    loadSavedPlans(controller.signal);
    
    return () => {
      controller.abort();
    };
  }, [loadSavedPlans]);
  
  // Gère la sauvegarde d'un plan avec useCallback et gestion des erreurs améliorée
  const handleSavePlan = useCallback((mealPlan, name, nutritionResults) => {
    if (!mealPlan || !name || !nutritionResults) {
      console.error('Missing required data for saving plan');
      return Promise.reject(new Error('Données manquantes pour sauvegarder le plan'));
    }
    
    return savePlan(mealPlan, name, nutritionResults);
  }, [savePlan]);
  
  // Vérification si les plans ont été calculés et si un plan de repas a été généré
  // Utilise une comparaison peu coûteuse pour éviter les recalculs inutiles
  const hasCalculatedPlan = useMemo(() => 
    Boolean(calculatorResults && mealPlan && mealPlan.length > 0), 
    [calculatorResults, mealPlan]
  );
  
  // Utilisez useMemo pour calculer l'erreur globale et l'état de chargement
  const error = useMemo(() => 
    calculatorError || plannerError || foodJournal.error, 
    [calculatorError, plannerError, foodJournal.error]
  );
  
  const loading = useMemo(() => 
    calculatorLoading || plannerLoading || foodJournal.loading, 
    [calculatorLoading, plannerLoading, foodJournal.loading]
  );
  
  // Création d'une fonction pour réinitialiser le calculateur
  const resetCalculator = useCallback(() => {
    setShowResults(false);
    setMealPlan([]);
  }, []);
  
  // Configuration d'un intercepteur Axios pour ajouter un cache-control
  useEffect(() => {
    const reqInterceptor = axios.interceptors.request.use(config => {
      if (config.url && config.url.includes('/api/nutrition')) {
        config.headers = config.headers || {};
        config.headers['Cache-Control'] = 'max-age=300'; // 5 minutes
      }
      return config;
    });
    
    return () => {
      axios.interceptors.request.eject(reqInterceptor);
    };
  }, []);
  
  // Préchargement intelligent des données
  useEffect(() => {
    // Si l'utilisateur est sur l'onglet calculateur et a des résultats
    // Précharger les données de l'onglet plan de repas
    if (activeTab === 0 && calculatorResults) {
      const preloadPlanData = async () => {
        try {
          generateMealPlan(calculatorResults);
        } catch (error) {
          console.error('Error preloading meal plan data:', error);
        }
      };
      
      preloadPlanData();
    }
  }, [activeTab, calculatorResults, generateMealPlan]);
  
  return {
    // États
    activeTab,
    showResults,
    userProfile,
    calculatorResults,
    mealPlan,
    savedPlans,
    planName,
    showSaveForm,
    hasCalculatedPlan,
    error,
    loading,
    
    // Fonctions
    setActiveTab,
    setUserProfile,
    calculateNutrition,
    setPlanName,
    setShowSaveForm,
    handleTabChange,
    handleSavePlan,
    resetCalculator,
    deletePlan,
    
    // Hook du journal alimentaire
    foodJournal
  };
};

export default useNutritionPlanner;
