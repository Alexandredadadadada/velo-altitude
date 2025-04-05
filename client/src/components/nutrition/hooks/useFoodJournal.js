import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import debounce from 'lodash/debounce';

/**
 * Hook personnalisé pour gérer le journal alimentaire
 * Optimisé avec useMemo et useCallback pour minimiser les re-renders
 * Utilise debounce pour la recherche d'aliments
 * 
 * @returns {Object} Fonctions et données pour le journal alimentaire
 */
const useFoodJournal = () => {
  const { t } = useTranslation();
  const [foodSearch, setFoodSearchRaw] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState('breakfast');
  const [foodQuantity, setFoodQuantity] = useState(100);
  const [journalDates, setJournalDates] = useState([
    new Date().toISOString().split('T')[0]
  ]);
  const [foodJournal, setFoodJournal] = useState({
    date: new Date().toISOString().split('T')[0],
    meals: [],
    totals: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Debounce pour la recherche d'aliments
  const debouncedSearch = useMemo(
    () => 
      debounce((searchTerm) => {
        if (searchTerm.length >= 2) {
          searchFoods(searchTerm);
        } else {
          setSearchResults([]);
        }
      }, 300),
    []
  );
  
  // Wrapper pour le state setter de foodSearch avec debounce
  const setFoodSearch = useCallback((value) => {
    setFoodSearchRaw(value);
    debouncedSearch(value);
  }, [debouncedSearch]);
  
  /**
   * Charge le journal alimentaire pour la date sélectionnée
   */
  const loadFoodJournal = useCallback(() => {
    try {
      const date = new Date().toISOString().split('T')[0]; // Date actuelle par défaut
      const journalKey = `foodJournal_${date}`;
      const storedJournal = localStorage.getItem(journalKey);
      
      if (storedJournal) {
        setFoodJournal(JSON.parse(storedJournal));
      } else {
        // Créer un nouveau journal vide pour cette date
        setFoodJournal({
          date: date,
          meals: [
            { name: 'breakfast', title: t('nutrition.meals.breakfast'), foods: [] },
            { name: 'lunch', title: t('nutrition.meals.lunch'), foods: [] },
            { name: 'snack', title: t('nutrition.meals.snack'), foods: [] },
            { name: 'dinner', title: t('nutrition.meals.dinner'), foods: [] }
          ],
          totals: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          }
        });
      }
      
      // Charger les dates pour lesquelles un journal existe
      const allDates = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('foodJournal_')) {
          allDates.push(key.replace('foodJournal_', ''));
        }
      }
      setJournalDates([...new Set([date, ...allDates])].sort());
      
    } catch (error) {
      console.error('Error loading food journal:', error);
      setError('Erreur lors du chargement du journal alimentaire');
    }
  }, [t]);
  
  /**
   * Change la date active pour le journal
   * 
   * @param {string} date - Nouvelle date active
   */
  const changeJournalDate = useCallback((date) => {
    try {
      // Sauvegarder le journal actuel avant de changer de date
      const currentJournalKey = `foodJournal_${foodJournal.date}`;
      localStorage.setItem(currentJournalKey, JSON.stringify(foodJournal));
      
      // Charger le journal pour la nouvelle date
      const newJournalKey = `foodJournal_${date}`;
      const storedJournal = localStorage.getItem(newJournalKey);
      
      if (storedJournal) {
        setFoodJournal(JSON.parse(storedJournal));
      } else {
        // Créer un nouveau journal vide pour cette date
        setFoodJournal({
          date: date,
          meals: [
            { name: 'breakfast', title: t('nutrition.meals.breakfast'), foods: [] },
            { name: 'lunch', title: t('nutrition.meals.lunch'), foods: [] },
            { name: 'snack', title: t('nutrition.meals.snack'), foods: [] },
            { name: 'dinner', title: t('nutrition.meals.dinner'), foods: [] }
          ],
          totals: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
          }
        });
      }
    } catch (error) {
      console.error('Error changing journal date:', error);
      setError('Erreur lors du changement de date');
    }
  }, [foodJournal, t]);
  
  /**
   * Base de données alimentaire pour la recherche
   * En production, ceci serait remplacé par un appel API réel
   */
  const foodDatabase = useMemo(() => [
    { 
      id: 'food1', 
      name: 'Poulet grillé', 
      calories: 165, 
      protein: 31, 
      carbs: 0, 
      fat: 3.6,
      category: 'protein',
      tags: ['meat', 'protein', 'low-carb']
    },
    { 
      id: 'food2', 
      name: 'Riz blanc cuit', 
      calories: 130, 
      protein: 2.7, 
      carbs: 28, 
      fat: 0.3,
      category: 'carbs',
      tags: ['grain', 'carbs', 'gluten-free']
    },
    { 
      id: 'food3', 
      name: 'Oeuf entier', 
      calories: 72, 
      protein: 6.3, 
      carbs: 0.4, 
      fat: 5,
      category: 'protein',
      tags: ['protein', 'breakfast', 'vegetarian']
    },
    { 
      id: 'food4', 
      name: 'Pain complet', 
      calories: 80, 
      protein: 4, 
      carbs: 15, 
      fat: 1,
      category: 'carbs',
      tags: ['grain', 'breakfast', 'fiber']
    },
    { 
      id: 'food5', 
      name: 'Banane', 
      calories: 89, 
      protein: 1.1, 
      carbs: 22.8, 
      fat: 0.3,
      category: 'fruit',
      tags: ['fruit', 'snack', 'potassium']
    },
    { 
      id: 'food6', 
      name: 'Yaourt nature', 
      calories: 59, 
      protein: 3.5, 
      carbs: 4.7, 
      fat: 3.3,
      category: 'dairy',
      tags: ['dairy', 'breakfast', 'calcium']
    },
    { 
      id: 'food7', 
      name: 'Avocat', 
      calories: 160, 
      protein: 2, 
      carbs: 8.5, 
      fat: 14.7,
      category: 'fat',
      tags: ['fat', 'fruit', 'healthy-fat']
    },
    { 
      id: 'food8', 
      name: 'Barre énergétique', 
      calories: 200, 
      protein: 10, 
      carbs: 25, 
      fat: 7,
      category: 'snack',
      tags: ['snack', 'energy', 'workout']
    },
    { 
      id: 'food9', 
      name: 'Pâtes cuites', 
      calories: 131, 
      protein: 5.5, 
      carbs: 25.1, 
      fat: 1.1,
      category: 'carbs',
      tags: ['carbs', 'dinner', 'grain']
    },
    { 
      id: 'food10', 
      name: 'Saumon', 
      calories: 206, 
      protein: 22, 
      carbs: 0, 
      fat: 13,
      category: 'protein',
      tags: ['fish', 'protein', 'omega-3']
    },
    { 
      id: 'food11', 
      name: 'Amandes', 
      calories: 576, 
      protein: 21, 
      carbs: 22, 
      fat: 49,
      category: 'fat',
      tags: ['nuts', 'snack', 'healthy-fat']
    },
    { 
      id: 'food12', 
      name: 'Fromage cheddar', 
      calories: 402, 
      protein: 25, 
      carbs: 1.3, 
      fat: 33,
      category: 'fat',
      tags: ['dairy', 'protein', 'fat']
    },
    { 
      id: 'food13', 
      name: 'Brocoli cuit', 
      calories: 55, 
      protein: 3.7, 
      carbs: 11.2, 
      fat: 0.6,
      category: 'vegetable',
      tags: ['vegetable', 'fiber', 'low-calorie']
    },
    { 
      id: 'food14', 
      name: 'Patates douces', 
      calories: 86, 
      protein: 1.6, 
      carbs: 20.1, 
      fat: 0.1,
      category: 'carbs',
      tags: ['carbs', 'vegetable', 'fiber']
    },
    { 
      id: 'food15', 
      name: 'Boisson de récupération', 
      calories: 140, 
      protein: 20, 
      carbs: 15, 
      fat: 1,
      category: 'recovery',
      tags: ['recovery', 'protein', 'post-workout']
    }
  ], []);
  
  /**
   * Recherche des aliments selon le terme de recherche
   * @param {string} searchTerm - Terme de recherche
   */
  const searchFoods = useCallback((searchTerm) => {
    try {
      setLoading(true);
      setError(null);
      
      // Simuler un délai de chargement comme un appel API réel
      setTimeout(() => {
        if (!searchTerm || searchTerm.length < 2) {
          setSearchResults([]);
          setLoading(false);
          return;
        }
        
        const term = searchTerm.toLowerCase();
        
        // Recherche par nom et tags
        let results = foodDatabase.filter(food => 
          food.name.toLowerCase().includes(term) || 
          food.category.toLowerCase().includes(term) ||
          food.tags.some(tag => tag.toLowerCase().includes(term))
        );
        
        // Trier les résultats par pertinence
        results = results.sort((a, b) => {
          // Priorité aux correspondances exactes dans le nom
          const aStartsWithTerm = a.name.toLowerCase().startsWith(term);
          const bStartsWithTerm = b.name.toLowerCase().startsWith(term);
          
          if (aStartsWithTerm && !bStartsWithTerm) return -1;
          if (!aStartsWithTerm && bStartsWithTerm) return 1;
          
          // Puis par nom alphabétique
          return a.name.localeCompare(b.name);
        });
        
        setSearchResults(results);
        setLoading(false);
      }, 300); // Simuler un délai réseau
      
    } catch (error) {
      console.error('Error searching foods:', error);
      setError('Erreur lors de la recherche d\'aliments');
      setLoading(false);
    }
  }, [foodDatabase]);
  
  /**
   * Sélectionne un aliment des résultats de recherche
   * 
   * @param {Object} food - Aliment sélectionné
   */
  const selectFood = useCallback((food) => {
    setSelectedFood(food);
  }, []);
  
  /**
   * Calcule les valeurs nutritionnelles d'un aliment en fonction de la quantité
   * 
   * @param {Object} food - Aliment
   * @param {number} quantity - Quantité en grammes
   * @returns {Object} Valeurs nutritionnelles calculées
   */
  const calculateNutritionValues = useCallback((food, quantity) => {
    if (!food) return null;
    
    const ratio = quantity / 100;
    return {
      id: `${food.id}_${Date.now()}`, // Identifiant unique
      name: food.name,
      quantity: quantity,
      calories: Math.round(food.calories * ratio),
      protein: Math.round(food.protein * ratio * 10) / 10,
      carbs: Math.round(food.carbs * ratio * 10) / 10,
      fat: Math.round(food.fat * ratio * 10) / 10
    };
  }, []);
  
  /**
   * Ajoute un aliment au journal
   */
  const addFoodToJournal = useCallback(() => {
    try {
      if (!selectedFood || foodQuantity <= 0) return;
      
      // Calculer les valeurs nutritionnelles en fonction de la quantité
      const foodToAdd = calculateNutritionValues(selectedFood, foodQuantity);
      
      // Créer une copie du journal actuel
      const updatedJournal = { ...foodJournal };
      
      // Trouver le repas correspondant ou en créer un nouveau
      let meal = updatedJournal.meals.find(m => m.name === selectedMeal);
      if (!meal) {
        meal = { 
          name: selectedMeal, 
          title: t(`nutrition.meals.${selectedMeal}`), 
          foods: [] 
        };
        updatedJournal.meals.push(meal);
      }
      
      // Ajouter l'aliment au repas
      meal.foods.push(foodToAdd);
      
      // Recalculer les totaux de manière optimisée avec reduce
      const totals = updatedJournal.meals.reduce(
        (journalTotals, currentMeal) => {
          const mealTotals = currentMeal.foods.reduce(
            (mealSums, food) => {
              return {
                calories: mealSums.calories + food.calories,
                protein: mealSums.protein + food.protein,
                carbs: mealSums.carbs + food.carbs,
                fat: mealSums.fat + food.fat
              };
            },
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          );
          
          return {
            calories: journalTotals.calories + mealTotals.calories,
            protein: journalTotals.protein + mealTotals.protein,
            carbs: journalTotals.carbs + mealTotals.carbs,
            fat: journalTotals.fat + mealTotals.fat
          };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      
      // Arrondir les valeurs calculées
      updatedJournal.totals = {
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein * 10) / 10,
        carbs: Math.round(totals.carbs * 10) / 10,
        fat: Math.round(totals.fat * 10) / 10
      };
      
      // Mettre à jour l'état et sauvegarder dans le localStorage
      setFoodJournal(updatedJournal);
      const journalKey = `foodJournal_${updatedJournal.date}`;
      localStorage.setItem(journalKey, JSON.stringify(updatedJournal));
      
      // Réinitialiser la sélection
      setSelectedFood(null);
      setFoodSearchRaw('');
      setSearchResults([]);
      setFoodQuantity(100);
    } catch (error) {
      console.error('Error adding food to journal:', error);
      setError('Erreur lors de l\'ajout d\'un aliment au journal');
    }
  }, [foodJournal, selectedFood, selectedMeal, foodQuantity, t, calculateNutritionValues]);
  
  /**
   * Supprime un aliment du journal
   * 
   * @param {string} mealName - Nom du repas
   * @param {string} foodId - Identifiant de l'aliment à supprimer
   */
  const removeFoodFromJournal = useCallback((mealName, foodId) => {
    try {
      // Créer une copie du journal actuel
      const updatedJournal = { ...foodJournal };
      
      // Trouver le repas correspondant
      const mealIndex = updatedJournal.meals.findIndex(m => m.name === mealName);
      if (mealIndex === -1) return;
      
      // Supprimer l'aliment du repas
      updatedJournal.meals[mealIndex].foods = updatedJournal.meals[mealIndex].foods.filter(
        f => f.id !== foodId
      );
      
      // Recalculer les totaux de manière optimisée avec reduce
      const totals = updatedJournal.meals.reduce(
        (journalTotals, currentMeal) => {
          const mealTotals = currentMeal.foods.reduce(
            (mealSums, food) => {
              return {
                calories: mealSums.calories + food.calories,
                protein: mealSums.protein + food.protein,
                carbs: mealSums.carbs + food.carbs,
                fat: mealSums.fat + food.fat
              };
            },
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          );
          
          return {
            calories: journalTotals.calories + mealTotals.calories,
            protein: journalTotals.protein + mealTotals.protein,
            carbs: journalTotals.carbs + mealTotals.carbs,
            fat: journalTotals.fat + mealTotals.fat
          };
        },
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
      
      // Arrondir les valeurs calculées
      updatedJournal.totals = {
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein * 10) / 10,
        carbs: Math.round(totals.carbs * 10) / 10,
        fat: Math.round(totals.fat * 10) / 10
      };
      
      // Mettre à jour l'état et sauvegarder dans le localStorage
      setFoodJournal(updatedJournal);
      const journalKey = `foodJournal_${updatedJournal.date}`;
      localStorage.setItem(journalKey, JSON.stringify(updatedJournal));
    } catch (error) {
      console.error('Error removing food from journal:', error);
      setError('Erreur lors de la suppression d\'un aliment du journal');
    }
  }, [foodJournal]);
  
  // Nettoyage du debounce au démontage du composant
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);
  
  // Charger le journal au montage du composant
  useEffect(() => {
    loadFoodJournal();
  }, [loadFoodJournal]);
  
  return {
    foodJournal,
    journalDates,
    foodSearch,
    searchResults,
    selectedFood,
    selectedMeal,
    foodQuantity,
    loading,
    error,
    setFoodSearch,
    setSelectedMeal,
    setFoodQuantity,
    changeJournalDate,
    selectFood,
    addFoodToJournal,
    removeFoodFromJournal
  };
};

export default useFoodJournal;
