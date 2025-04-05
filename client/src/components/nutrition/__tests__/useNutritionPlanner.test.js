import { renderHook, act } from '@testing-library/react-hooks';
import { NotificationContext } from '../../../context/NotificationContext';
import useNutritionPlanner from '../hooks/useNutritionPlanner';

// Mock des dépendances
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

describe('useNutritionPlanner Hook', () => {
  const mockNotify = jest.fn();
  const wrapper = ({ children }) => (
    <NotificationContext.Provider value={{ notify: mockNotify }}>
      {children}
    </NotificationContext.Provider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useNutritionPlanner(), { wrapper });
    
    expect(result.current.userProfile).toEqual({
      age: 30,
      gender: 'male',
      weight: 70,
      height: 175,
      activityLevel: 'moderate',
      goal: 'maintain'
    });
    expect(result.current.dailyCalories).toBe(0);
    expect(result.current.macroSplit).toEqual({
      protein: 30,
      carbs: 50,
      fat: 20
    });
    expect(result.current.mealPlan).toEqual([]);
    expect(result.current.savedPlans).toEqual([]);
  });

  test('should update profile correctly', () => {
    const { result } = renderHook(() => useNutritionPlanner(), { wrapper });
    
    act(() => {
      result.current.handleProfileChange('age', 25);
    });
    expect(result.current.userProfile.age).toBe(25);
    
    act(() => {
      result.current.handleProfileChange('gender', 'female');
    });
    expect(result.current.userProfile.gender).toBe('female');
  });

  test('should validate form correctly', () => {
    const { result } = renderHook(() => useNutritionPlanner(), { wrapper });
    
    // Valides par défaut
    let isValid;
    act(() => {
      isValid = result.current.validateForm();
    });
    expect(isValid).toBe(true);
    
    // Age invalide
    act(() => {
      result.current.handleProfileChange('age', 10);
      isValid = result.current.validateForm();
    });
    expect(isValid).toBe(false);
    expect(result.current.validationErrors.age).toBeDefined();
    
    // Poids invalide
    act(() => {
      result.current.handleProfileChange('age', 30); // Remettre une valeur valide
      result.current.handleProfileChange('weight', 30); // Trop bas
      isValid = result.current.validateForm();
    });
    expect(isValid).toBe(false);
    expect(result.current.validationErrors.weight).toBeDefined();
  });

  test('should calculate calories correctly', () => {
    const { result } = renderHook(() => useNutritionPlanner(), { wrapper });
    
    // Homme, 30 ans, 70kg, 175cm, activité modérée, maintien
    act(() => {
      result.current.calculateNutrition();
    });
    
    // Formule BMR = 10 * weight + 6.25 * height - 5 * age + 5 (homme)
    // Pour un homme de 30 ans, 70kg, 175cm: 
    // BMR = 10 * 70 + 6.25 * 175 - 5 * 30 + 5 = 1653.75
    // Avec activité modérée (facteur 1.55): 1653.75 * 1.55 = 2563.3125
    // Arrondi: 2563
    
    // Le résultat peut varier légèrement en fonction de l'implémentation exacte
    expect(result.current.dailyCalories).toBeGreaterThan(2400);
    expect(result.current.dailyCalories).toBeLessThan(2700);
    
    // Test avec un autre profil
    act(() => {
      result.current.handleProfileChange('gender', 'female');
      result.current.handleProfileChange('weight', 60);
      result.current.handleProfileChange('height', 165);
      result.current.calculateNutrition();
    });
    
    // Formule BMR = 10 * weight + 6.25 * height - 5 * age - 161 (femme)
    // Pour une femme de 30 ans, 60kg, 165cm:
    // BMR = 10 * 60 + 6.25 * 165 - 5 * 30 - 161 = 1328.75
    // Avec activité modérée (facteur 1.55): 1328.75 * 1.55 = 2059.5625
    // Arrondi: 2060
    
    expect(result.current.dailyCalories).toBeGreaterThan(1900);
    expect(result.current.dailyCalories).toBeLessThan(2200);
  });

  test('should adjust calories based on goal', () => {
    const { result } = renderHook(() => useNutritionPlanner(), { wrapper });
    
    // Test avec objectif de perte de poids
    act(() => {
      result.current.handleProfileChange('goal', 'lose');
      result.current.calculateNutrition();
    });
    
    const loseCalories = result.current.dailyCalories;
    
    // Test avec objectif de prise de masse
    act(() => {
      result.current.handleProfileChange('goal', 'gain');
      result.current.calculateNutrition();
    });
    
    const gainCalories = result.current.dailyCalories;
    
    // Test avec objectif de maintien
    act(() => {
      result.current.handleProfileChange('goal', 'maintain');
      result.current.calculateNutrition();
    });
    
    const maintainCalories = result.current.dailyCalories;
    
    // Vérifier que les calories sont ajustées correctement selon l'objectif
    expect(loseCalories).toBeLessThan(maintainCalories);
    expect(gainCalories).toBeGreaterThan(maintainCalories);
  });

  test('should update macro splits correctly', () => {
    const { result } = renderHook(() => useNutritionPlanner(), { wrapper });
    
    act(() => {
      result.current.handleMacroSplitChange('protein', 35);
      result.current.handleMacroSplitChange('carbs', 45);
      result.current.handleMacroSplitChange('fat', 20);
    });
    
    expect(result.current.macroSplit).toEqual({
      protein: 35,
      carbs: 45,
      fat: 20
    });
    
    // Test de l'ajustement automatique (total = 100%)
    act(() => {
      result.current.handleMacroSplitChange('protein', 40);
    });
    
    // Si protein passe à 40, les autres devraient être ajustés pour maintenir le ratio entre eux
    // et garder un total de 100%
    expect(result.current.macroSplit.protein).toBe(40);
    expect(result.current.macroSplit.protein + result.current.macroSplit.carbs + result.current.macroSplit.fat).toBe(100);
  });

  test('should save and load plans correctly', () => {
    const { result } = renderHook(() => useNutritionPlanner(), { wrapper });
    
    // Configurer et calculer un plan
    act(() => {
      result.current.handleProfileChange('weight', 75);
      result.current.handleProfileChange('goal', 'gain');
      result.current.calculateNutrition();
    });
    
    const calories = result.current.dailyCalories;
    
    // Sauvegarder le plan
    act(() => {
      result.current.savePlan('Test Plan');
    });
    
    expect(result.current.savedPlans.length).toBe(1);
    expect(result.current.savedPlans[0].name).toBe('Test Plan');
    expect(result.current.savedPlans[0].calories).toBe(calories);
    
    // Charger le plan
    act(() => {
      // Modifier le profil pour vérifier le chargement
      result.current.handleProfileChange('weight', 65);
      result.current.calculateNutrition();
      
      // Puis charger le plan sauvegardé
      result.current.loadPlan(0);
    });
    
    expect(result.current.userProfile.weight).toBe(75);
    expect(result.current.userProfile.goal).toBe('gain');
    expect(result.current.dailyCalories).toBe(calories);
  });
});
