/**
 * Service de validation des données pour les cols
 */

import { 
  Col, 
  ValidationResult, 
  ElevationProfile, 
  WeatherInfo,
  DetailedCol
} from './types/ColTypes';

/**
 * Classe pour la validation des données des cols
 */
export class ColDataValidator {
  /**
   * Valide les données d'un col
   * @param col Données du col à valider
   * @returns Résultat de la validation
   */
  validateColData(col: Col): ValidationResult {
    const errors: string[] = [];
    
    // Validation des champs obligatoires
    if (!col.id) errors.push('ID du col manquant');
    if (!col.name) errors.push('Nom du col manquant');
    
    // Validation de la localisation
    if (!col.location) {
      errors.push('Localisation du col manquante');
    } else {
      if (typeof col.location.latitude !== 'number' || 
          col.location.latitude < -90 || 
          col.location.latitude > 90) {
        errors.push('Latitude invalide');
      }
      
      if (typeof col.location.longitude !== 'number' || 
          col.location.longitude < -180 || 
          col.location.longitude > 180) {
        errors.push('Longitude invalide');
      }
    }
    
    // Validation des données numériques
    if (typeof col.elevation !== 'number' || col.elevation < 0) {
      errors.push('Élévation invalide');
    }
    
    if (typeof col.length !== 'number' || col.length <= 0) {
      errors.push('Longueur invalide');
    }
    
    if (typeof col.grade !== 'number' || col.grade < 0 || col.grade > 100) {
      errors.push('Pente invalide');
    }
    
    // Validation de l'enum de difficulté
    if (!col.difficulty) {
      errors.push('Difficulté manquante');
    }
    
    // Validation des points d'intérêt
    if (col.pointsOfInterest) {
      col.pointsOfInterest.forEach((poi, index) => {
        if (!poi.id) errors.push(`Point d'intérêt ${index}: ID manquant`);
        if (!poi.name) errors.push(`Point d'intérêt ${index}: Nom manquant`);
        if (!poi.location) errors.push(`Point d'intérêt ${index}: Localisation manquante`);
        if (!poi.type) errors.push(`Point d'intérêt ${index}: Type manquant`);
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Valide les données d'élévation
   * @param data Données d'élévation à valider
   * @returns Résultat de la validation
   */
  validateElevationData(data: ElevationProfile): ValidationResult {
    const errors: string[] = [];
    
    if (!data.points || !Array.isArray(data.points) || data.points.length === 0) {
      errors.push('Points d\'élévation manquants ou invalides');
    } else {
      // Vérification des points individuels
      data.points.forEach((point, index) => {
        if (typeof point.distance !== 'number') {
          errors.push(`Point ${index}: Distance invalide`);
        }
        
        if (typeof point.elevation !== 'number') {
          errors.push(`Point ${index}: Élévation invalide`);
        }
      });
    }
    
    // Vérification des propriétés calculées
    if (typeof data.maxElevation !== 'number') {
      errors.push('Élévation maximale invalide');
    }
    
    if (typeof data.minElevation !== 'number') {
      errors.push('Élévation minimale invalide');
    }
    
    if (typeof data.totalAscent !== 'number' || data.totalAscent < 0) {
      errors.push('Montée totale invalide');
    }
    
    if (typeof data.totalDescent !== 'number' || data.totalDescent < 0) {
      errors.push('Descente totale invalide');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Valide les données météo
   * @param data Données météo à valider
   * @returns Résultat de la validation
   */
  validateWeatherData(data: WeatherInfo): ValidationResult {
    const errors: string[] = [];
    
    // Vérification des données météo actuelles
    if (!data.current) {
      errors.push('Données météo actuelles manquantes');
    } else {
      if (typeof data.current.temperature !== 'number') {
        errors.push('Température actuelle invalide');
      }
      
      if (typeof data.current.windSpeed !== 'number' || data.current.windSpeed < 0) {
        errors.push('Vitesse du vent actuelle invalide');
      }
      
      if (!data.current.weatherDescription) {
        errors.push('Description météo actuelle manquante');
      }
    }
    
    // Vérification des prévisions
    if (data.hourlyForecast && !Array.isArray(data.hourlyForecast)) {
      errors.push('Prévisions horaires invalides');
    }
    
    if (data.dailyForecast && !Array.isArray(data.dailyForecast)) {
      errors.push('Prévisions quotidiennes invalides');
    }
    
    // Vérification des alertes
    if (data.alerts && !Array.isArray(data.alerts)) {
      errors.push('Alertes météo invalides');
    }
    
    // Vérification des recommandations cyclistes
    if (!data.cyclingRecommendation) {
      errors.push('Recommandations cyclistes manquantes');
    } else {
      if (!data.cyclingRecommendation.recommendation) {
        errors.push('Niveau de recommandation manquant');
      }
      
      if (!data.cyclingRecommendation.description) {
        errors.push('Description de la recommandation manquante');
      }
    }
    
    // Vérification des données de source
    if (!data.dataSource) {
      errors.push('Source des données météo manquante');
    }
    
    // Vérification de la date de mise à jour
    if (!data.lastUpdated) {
      errors.push('Date de mise à jour des données météo manquante');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Valide les données complètes d'un col
   * @param col Données complètes du col à valider
   * @returns Résultat de la validation
   */
  validateDetailedColData(col: DetailedCol): ValidationResult {
    // Valider d'abord les données de base
    const baseValidation = this.validateColData(col);
    
    if (!baseValidation.isValid) {
      return baseValidation;
    }
    
    const errors: string[] = [];
    
    // Valider les données météo si présentes
    if (col.weatherInfo) {
      const weatherValidation = this.validateWeatherData(col.weatherInfo);
      if (!weatherValidation.isValid) {
        errors.push(...weatherValidation.errors);
      }
    }
    
    // Valider les données d'élévation si présentes
    if (col.elevationProfile) {
      const elevationValidation = this.validateElevationData(col.elevationProfile);
      if (!elevationValidation.isValid) {
        errors.push(...elevationValidation.errors);
      }
    }
    
    // Validation des panoramas
    if (col.panoramas) {
      col.panoramas.forEach((panorama, index) => {
        if (!panorama.id) errors.push(`Panorama ${index}: ID manquant`);
        if (!panorama.url) errors.push(`Panorama ${index}: URL manquante`);
        if (!panorama.location) errors.push(`Panorama ${index}: Localisation manquante`);
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
