import optimizedDataService from '../services/optimizedDataService';
import RealApiOrchestrator from '../services/api/RealApiOrchestrator';
import RealApiOrchestratorPart2 from '../services/api/RealApiOrchestratorPart2';

// Mock les orchestrateurs d'API pour isoler les tests
jest.mock('../services/api/RealApiOrchestrator', () => {
  return {
    __esModule: true,
    default: {
      getAllCols: jest.fn(),
      getColById: jest.fn(),
      getUserProfile: jest.fn(),
    }
  };
});

jest.mock('../services/api/RealApiOrchestratorPart2', () => {
  return {
    __esModule: true,
    default: {
      getUserTrainingPlans: jest.fn(),
      getNutritionRecipes: jest.fn(),
      getColWeather: jest.fn(),
    }
  };
});

describe('OptimizedDataService', () => {
  beforeEach(() => {
    // Réinitialiser tous les mocks avant chaque test
    jest.clearAllMocks();
    
    // Vider le cache du service
    optimizedDataService.clearCache();
  });
  
  // Test pour getColData
  describe('getColData', () => {
    test('appelle l\'API orchestrator correctement sans mock data', async () => {
      // Préparer les données de test
      const mockColData = [
        { id: 'col1', name: 'Col du Tourmalet', elevation: 2115 },
        { id: 'col2', name: 'Col du Galibier', elevation: 2642 }
      ];
      
      // Configurer le mock pour retourner les données de test
      RealApiOrchestrator.getAllCols.mockResolvedValue(mockColData);
      
      // Appeler la méthode à tester
      const result = await optimizedDataService.getColData();
      
      // Vérifier que l'orchestrateur d'API a été appelé correctement
      expect(RealApiOrchestrator.getAllCols).toHaveBeenCalled();
      
      // Vérifier que le résultat est celui attendu
      expect(result).toEqual(mockColData);
    });
    
    test('met en cache les résultats pour les appels suivants', async () => {
      // Préparer les données de test
      const mockColData = [{ id: 'col1', name: 'Col du Tourmalet' }];
      
      // Configurer le mock pour retourner les données de test
      RealApiOrchestrator.getAllCols.mockResolvedValue(mockColData);
      
      // Premier appel - devrait appeler l'API
      await optimizedDataService.getColData();
      
      // Deuxième appel - devrait utiliser le cache
      await optimizedDataService.getColData();
      
      // Vérifier que l'API n'a été appelée qu'une seule fois
      expect(RealApiOrchestrator.getAllCols).toHaveBeenCalledTimes(1);
    });
    
    test('force l\'actualisation lorsque forceRefresh est true', async () => {
      // Préparer les données de test
      const mockColData = [{ id: 'col1', name: 'Col du Tourmalet' }];
      
      // Configurer le mock pour retourner les données de test
      RealApiOrchestrator.getAllCols.mockResolvedValue(mockColData);
      
      // Premier appel - devrait appeler l'API
      await optimizedDataService.getColData();
      
      // Deuxième appel avec forceRefresh - devrait appeler l'API à nouveau
      await optimizedDataService.getColData(null, { forceRefresh: true });
      
      // Vérifier que l'API a été appelée deux fois
      expect(RealApiOrchestrator.getAllCols).toHaveBeenCalledTimes(2);
    });

    test('appelle getColById quand un ID de col est fourni', async () => {
      // Préparer les données de test
      const mockColData = { id: 'col1', name: 'Col du Tourmalet', elevation: 2115 };
      
      // Configurer le mock pour retourner les données de test
      RealApiOrchestrator.getColById.mockResolvedValue(mockColData);
      
      // Appeler la méthode à tester avec un ID
      const result = await optimizedDataService.getColData('col1');
      
      // Vérifier que l'orchestrateur d'API a été appelé correctement
      expect(RealApiOrchestrator.getColById).toHaveBeenCalledWith('col1');
      
      // Vérifier que le résultat est celui attendu
      expect(result).toEqual(mockColData);
    });
  });

  // Test pour getTrainingPrograms
  describe('getTrainingPrograms', () => {
    test('appelle l\'API orchestrator correctement sans mock data', async () => {
      // Préparer les données de test
      const mockPrograms = [
        { id: 'program1', name: 'Débutant en montagne', level: 'beginner' },
        { id: 'program2', name: 'Préparation Grand Fond', level: 'advanced' }
      ];
      
      // Configurer le mock pour retourner les données de test
      RealApiOrchestratorPart2.getUserTrainingPlans.mockResolvedValue(mockPrograms);
      
      // Appeler la méthode à tester
      const result = await optimizedDataService.getTrainingPrograms();
      
      // Vérifier que l'orchestrateur d'API a été appelé correctement
      expect(RealApiOrchestratorPart2.getUserTrainingPlans).toHaveBeenCalled();
      
      // Vérifier que le résultat est celui attendu
      expect(result).toEqual(mockPrograms);
    });
  });

  // Test pour getNutritionRecipes
  describe('getNutritionRecipes', () => {
    test('appelle l\'API orchestrator correctement sans mock data', async () => {
      // Préparer les données de test
      const mockRecipes = [
        { id: 'recipe1', name: 'Barres énergétiques maison', category: 'snack' },
        { id: 'recipe2', name: 'Boisson isotonique naturelle', category: 'drink' }
      ];
      
      // Configurer le mock pour retourner les données de test
      RealApiOrchestratorPart2.getNutritionRecipes.mockResolvedValue(mockRecipes);
      
      // Appeler la méthode à tester
      const result = await optimizedDataService.getNutritionRecipes();
      
      // Vérifier que l'orchestrateur d'API a été appelé correctement
      expect(RealApiOrchestratorPart2.getNutritionRecipes).toHaveBeenCalled();
      
      // Vérifier que le résultat est celui attendu
      expect(result).toEqual(mockRecipes);
    });
  });

  // Test pour getUserProfile
  describe('getUserProfile', () => {
    test('appelle l\'API orchestrator correctement sans mock data', async () => {
      // Préparer les données de test
      const mockProfile = {
        id: 'user123',
        name: 'Jean Cycliste',
        level: 'intermediate',
        preferences: {
          notifications: true,
          language: 'fr'
        }
      };
      
      // Configurer le mock pour retourner les données de test
      RealApiOrchestrator.getUserProfile.mockResolvedValue(mockProfile);
      
      // Appeler la méthode à tester
      const result = await optimizedDataService.getUserProfile('user123');
      
      // Vérifier que l'orchestrateur d'API a été appelé correctement
      expect(RealApiOrchestrator.getUserProfile).toHaveBeenCalledWith('user123');
      
      // Vérifier que le résultat est celui attendu
      expect(result).toEqual(mockProfile);
    });
  });

  // Test pour getWeatherData
  describe('getWeatherData', () => {
    test('appelle l\'API orchestrator correctement', async () => {
      // Préparer les données de test
      const mockWeatherData = {
        temperature: 15,
        conditions: 'Ensoleillé',
        windSpeed: 10,
        precipitation: 0
      };
      
      // Configurer le mock pour retourner les données de test
      RealApiOrchestratorPart2.getColWeather.mockResolvedValue(mockWeatherData);
      
      // Appeler la méthode à tester
      const result = await optimizedDataService.getWeatherData('col1');
      
      // Vérifier que l'orchestrateur d'API a été appelé correctement
      expect(RealApiOrchestratorPart2.getColWeather).toHaveBeenCalledWith('col1');
      
      // Vérifier que le résultat est celui attendu
      expect(result).toEqual(mockWeatherData);
    });
  });
});
