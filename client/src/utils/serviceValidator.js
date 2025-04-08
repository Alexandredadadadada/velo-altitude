/**
 * Service Validator
 * Utilitaire pour valider le fonctionnement des services refactorisés
 * Peut être exécuté dans la console du navigateur pour vérifier que les services
 * fonctionnent correctement en production.
 */

import nutritionService from '../services/nutritionService';
import optimizedDataService from '../services/optimizedDataService';

class ServiceValidator {
  constructor() {
    this.results = {
      success: [],
      errors: []
    };
    this.userId = 'test-user'; // ID utilisateur de test
  }

  /**
   * Exécute tous les tests de validation
   */
  async validateAll() {
    console.group('🧪 Validation des services refactorisés');
    console.log('Démarrage de la validation...');
    
    try {
      // Tests du service de nutrition
      await this.validateNutritionService();
      
      // Tests du service de données optimisées
      await this.validateOptimizedDataService();
      
      // Afficher le résumé
      this.displaySummary();
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      this.results.errors.push({
        service: 'global',
        method: 'validateAll',
        error: error.message
      });
      this.displaySummary();
    }
    
    console.groupEnd();
    return this.results;
  }

  /**
   * Valide le service de nutrition
   */
  async validateNutritionService() {
    console.group('Service de nutrition');
    
    try {
      // Test getUserNutritionData
      await this.testMethod(
        'nutritionService', 
        'getUserNutritionData', 
        () => nutritionService.getUserNutritionData(this.userId)
      );
      
      // Test getRecipes
      await this.testMethod(
        'nutritionService', 
        'getRecipes', 
        () => nutritionService.getRecipes()
      );
      
      // Test getNutritionRecipeById (avec un ID fictif)
      await this.testMethod(
        'nutritionService', 
        'getNutritionRecipeById', 
        () => nutritionService.getNutritionRecipeById('recipe-1')
      );
      
    } catch (error) {
      console.error('Erreur lors de la validation du service de nutrition:', error);
    }
    
    console.groupEnd();
  }

  /**
   * Valide le service de données optimisées
   */
  async validateOptimizedDataService() {
    console.group('Service de données optimisées');
    
    try {
      // Test getColData (tous les cols)
      await this.testMethod(
        'optimizedDataService', 
        'getColData (all)', 
        () => optimizedDataService.getColData(null)
      );
      
      // Test getColData (col spécifique)
      await this.testMethod(
        'optimizedDataService', 
        'getColData (specific)', 
        () => optimizedDataService.getColData('col-1')
      );
      
      // Test getTrainingPrograms
      await this.testMethod(
        'optimizedDataService', 
        'getTrainingPrograms', 
        () => optimizedDataService.getTrainingPrograms()
      );
      
      // Test getNutritionRecipes
      await this.testMethod(
        'optimizedDataService', 
        'getNutritionRecipes', 
        () => optimizedDataService.getNutritionRecipes()
      );
      
      // Test getUserProfile
      await this.testMethod(
        'optimizedDataService', 
        'getUserProfile', 
        () => optimizedDataService.getUserProfile(this.userId)
      );
      
      // Test getWeatherData
      await this.testMethod(
        'optimizedDataService', 
        'getWeatherData', 
        () => optimizedDataService.getWeatherData('col-1')
      );
      
      // Test du cache
      console.log('Test du cache...');
      await this.testCaching();
      
    } catch (error) {
      console.error('Erreur lors de la validation du service de données optimisées:', error);
    }
    
    console.groupEnd();
  }

  /**
   * Teste une méthode spécifique d'un service
   */
  async testMethod(service, method, callback) {
    console.log(`Test de ${service}.${method}...`);
    
    try {
      const startTime = performance.now();
      const result = await callback();
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      console.log(`✅ ${service}.${method} - OK (${duration}ms)`);
      console.log('Résultat:', result);
      
      this.results.success.push({
        service,
        method,
        duration,
        resultType: Array.isArray(result) ? 'array' : typeof result,
        resultSize: Array.isArray(result) ? result.length : 
                   (typeof result === 'object' ? Object.keys(result).length : 0)
      });
    } catch (error) {
      console.error(`❌ ${service}.${method} - ERREUR:`, error);
      
      this.results.errors.push({
        service,
        method,
        error: error.message
      });
    }
  }

  /**
   * Teste le fonctionnement du cache dans optimizedDataService
   */
  async testCaching() {
    try {
      console.log('Premier appel à getColData (devrait appeler l\'API)...');
      const startTime1 = performance.now();
      await optimizedDataService.getColData(null);
      const endTime1 = performance.now();
      const duration1 = Math.round(endTime1 - startTime1);
      
      console.log('Deuxième appel à getColData (devrait utiliser le cache)...');
      const startTime2 = performance.now();
      await optimizedDataService.getColData(null);
      const endTime2 = performance.now();
      const duration2 = Math.round(endTime2 - startTime2);
      
      const isCachingWorking = duration2 < duration1;
      
      if (isCachingWorking) {
        console.log(`✅ Cache - OK (Premier appel: ${duration1}ms, Deuxième appel: ${duration2}ms)`);
        this.results.success.push({
          service: 'optimizedDataService',
          method: 'cache',
          duration1,
          duration2
        });
      } else {
        console.warn(`⚠️ Cache - ATTENTION (Premier appel: ${duration1}ms, Deuxième appel: ${duration2}ms)`);
        this.results.errors.push({
          service: 'optimizedDataService',
          method: 'cache',
          error: 'Le deuxième appel n\'est pas plus rapide que le premier'
        });
      }
      
      // Test forceRefresh
      console.log('Troisième appel avec forceRefresh (devrait ignorer le cache)...');
      const startTime3 = performance.now();
      await optimizedDataService.getColData(null, { forceRefresh: true });
      const endTime3 = performance.now();
      const duration3 = Math.round(endTime3 - startTime3);
      
      console.log(`Appel avec forceRefresh: ${duration3}ms`);
      
    } catch (error) {
      console.error('Erreur lors du test de cache:', error);
      this.results.errors.push({
        service: 'optimizedDataService',
        method: 'cache',
        error: error.message
      });
    }
  }

  /**
   * Affiche un résumé des résultats de validation
   */
  displaySummary() {
    console.group('📊 Résumé de la validation');
    
    const totalTests = this.results.success.length + this.results.errors.length;
    const successRate = Math.round((this.results.success.length / totalTests) * 100);
    
    console.log(`Tests réussis: ${this.results.success.length}/${totalTests} (${successRate}%)`);
    
    if (this.results.errors.length > 0) {
      console.group('❌ Erreurs');
      this.results.errors.forEach(error => {
        console.log(`${error.service}.${error.method}: ${error.error}`);
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }
}

// Créer une instance pour utilisation dans la console
const serviceValidator = new ServiceValidator();

// Fonction pour exécuter la validation depuis la console
window.validateServices = async () => {
  return await serviceValidator.validateAll();
};

export default serviceValidator;
