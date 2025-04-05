/**
 * Service de gestion des données européennes pour le cyclisme
 * Fournit l'accès aux informations géographiques, climatiques et nutritionnelles spécifiques aux régions européennes
 */

import { 
  europeanCountries, 
  regionsByCountry, 
  regionalNutrition, 
  terrainTypes, 
  windLevels, 
  hydrationRecommendations 
} from '../data/european-regions';

class EuropeanDataService {
  /**
   * Récupère la liste complète des pays européens
   * @returns {Promise<Array>} Liste des pays européens
   */
  getCountries() {
    return new Promise(resolve => resolve(europeanCountries));
  }

  /**
   * Récupère les régions d'un pays spécifique
   * @param {string} country - Nom du pays
   * @returns {Promise<Array>} Liste des régions du pays
   */
  getRegionsByCountry(country) {
    return new Promise(resolve => {
      if (!country || !regionsByCountry[country]) {
        resolve([]);
      } else {
        resolve(regionsByCountry[country]);
      }
    });
  }

  /**
   * Récupère les informations nutritionnelles spécifiques à une région
   * @param {string} region - Code de la région
   * @returns {Promise<Object|null>} Données nutritionnelles régionales
   */
  getRegionalNutrition(region) {
    return new Promise(resolve => {
      if (!region || !regionalNutrition[region]) {
        resolve(null);
      } else {
        resolve(regionalNutrition[region]);
      }
    });
  }

  /**
   * Récupère les types de terrain disponibles avec leurs facteurs énergétiques
   * @returns {Promise<Array>} Liste des types de terrain
   */
  getTerrainTypes() {
    return new Promise(resolve => resolve(terrainTypes));
  }

  /**
   * Récupère les niveaux de vent avec leurs facteurs énergétiques
   * @returns {Promise<Array>} Liste des niveaux de vent
   */
  getWindLevels() {
    return new Promise(resolve => resolve(windLevels));
  }

  /**
   * Calcule les facteurs environnementaux pour les besoins énergétiques et d'hydratation
   * @param {Object} conditions - Conditions environnementales
   * @returns {Promise<Object>} Facteurs calculés
   */
  calculateEnvironmentalFactors(conditions) {
    return new Promise(resolve => {
      const { temperature, altitude, humidity, wind, terrain } = conditions;
      
      // 1. Facteur de terrain
      const terrainFactor = terrainTypes.find(t => t.value === terrain)?.energyFactor || 1.0;
      
      // 2. Facteur de vent
      const windFactor = windLevels.find(w => w.value === wind)?.energyFactor || 1.0;
      
      // 3. Facteur d'altitude (augmentation de 3% par 1000m)
      const altitudeFactor = 1 + (altitude / 1000) * 0.03;
      
      // 4. Facteur de température pour l'énergie
      let energyTempFactor = 1.0;
      if (temperature < 5) {
        // Augmentation du métabolisme par temps froid
        energyTempFactor = 1.1;
      } else if (temperature > 25) {
        // Augmentation des besoins en effort par temps chaud
        energyTempFactor = 1.05 + (temperature - 25) * 0.01; // +1% par degré au-dessus de 25°C
      }
      
      // Facteur énergétique global
      const energyFactor = terrainFactor * windFactor * altitudeFactor * energyTempFactor;
      
      // Facteur d'hydratation
      let hydrationFactor = 1.0;
      
      // Facteur de température pour l'hydratation
      for (const [key, data] of Object.entries(hydrationRecommendations.temperature)) {
        if (temperature >= data.range[0] && temperature <= data.range[1]) {
          hydrationFactor *= data.baseFactor;
          break;
        }
      }
      
      // Facteur d'humidité
      for (const [key, data] of Object.entries(hydrationRecommendations.humidity)) {
        if (humidity >= data.range[0] && humidity <= data.range[1]) {
          hydrationFactor *= data.factor;
          break;
        }
      }
      
      // Facteur d'altitude pour l'hydratation
      for (const [key, data] of Object.entries(hydrationRecommendations.altitude)) {
        if (altitude >= data.range[0] && altitude <= data.range[1]) {
          hydrationFactor *= data.factor;
          break;
        }
      }
      
      resolve({
        energyFactor: parseFloat(energyFactor.toFixed(2)),
        hydrationFactor: parseFloat(hydrationFactor.toFixed(2)),
        components: {
          terrain: terrainFactor,
          wind: windFactor,
          altitude: altitudeFactor,
          temperature: energyTempFactor
        },
        recommendations: {
          hydration: this.getHydrationRecommendation(temperature, altitude, humidity)
        }
      });
    });
  }
  
  /**
   * Génère une recommandation d'hydratation textuelle basée sur les conditions
   * @param {number} temperature - Température en °C
   * @param {number} altitude - Altitude en mètres
   * @param {number} humidity - Humidité en %
   * @returns {string} Recommandation textuelle
   */
  getHydrationRecommendation(temperature, altitude, humidity) {
    let recommendation = '';
    
    // Recommandation basée sur la température
    if (temperature < 5) {
      recommendation += "Même par temps froid, buvez régulièrement pour maintenir votre niveau d'hydratation. ";
    } else if (temperature >= 5 && temperature < 15) {
      recommendation += "Hydratez-vous toutes les 20 minutes. ";
    } else if (temperature >= 15 && temperature < 25) {
      recommendation += "Buvez régulièrement, environ 500-750ml par heure. ";
    } else if (temperature >= 25 && temperature < 32) {
      recommendation += "Augmentez votre consommation d'eau de 20%, buvez au moins 750ml par heure. ";
    } else {
      recommendation += "Condition de forte chaleur: doublez votre apport hydrique et ajoutez des électrolytes. ";
    }
    
    // Ajout pour l'altitude
    if (altitude > 1500) {
      recommendation += "En altitude, vos besoins en eau augmentent de 20% supplémentaires. ";
    }
    
    // Ajout pour l'humidité
    if (humidity > 70) {
      recommendation += "L'humidité élevée augmente la transpiration: compensez avec des électrolytes. ";
    } else if (humidity < 30) {
      recommendation += "Air sec: votre transpiration s'évapore rapidement, restez vigilant sur votre hydratation. ";
    }
    
    return recommendation;
  }
  
  /**
   * Récupère les recommandations nutritionnelles adaptées à un type d'effort spécifique dans une région
   * @param {string} region - Code de la région
   * @param {string} effortType - Type d'effort (before, during, after)
   * @returns {Promise<Array>} Aliments recommandés
   */
  getRegionalNutritionForEffort(region, effortType) {
    return new Promise(resolve => {
      const regionalData = regionalNutrition[region];
      if (!regionalData) {
        resolve([]);
        return;
      }
      
      // Alimentations recommandées selon le type d'effort
      let recommendations = [];
      
      if (effortType === 'before') {
        // Aliments riches en glucides complexes
        recommendations = regionalData.foods.filter(food => 
          food.nutrients && food.nutrients.carbs > 15 && food.nutrients.fat < 15);
      } else if (effortType === 'during') {
        // Aliments à énergie rapide
        recommendations = regionalData.foods.filter(food => 
          food.nutrients && food.nutrients.carbs > 20 && food.nutrients.protein < 10);
      } else if (effortType === 'after') {
        // Aliments riches en protéines pour la récupération
        recommendations = regionalData.foods.filter(food => 
          food.nutrients && food.nutrients.protein > 10);
      }
      
      resolve(recommendations);
    });
  }
}

export default new EuropeanDataService();
