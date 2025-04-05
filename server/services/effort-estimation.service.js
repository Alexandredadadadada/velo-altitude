/**
 * Service d'estimation d'effort pour les itinéraires cyclistes
 * Calcule l'effort requis en fonction des conditions environnementales et du profil du cycliste
 */

const logger = require('../utils/logger');
const NodeCache = require('node-cache');

class EffortEstimationService {
  constructor() {
    // Cache pour les estimations (TTL de 6 heures)
    this.cache = new NodeCache({ stdTTL: 21600 });
    
    logger.info('Service d\'estimation d\'effort initialisé');
  }
  
  /**
   * Estime l'effort requis pour un itinéraire en fonction des conditions environnementales
   * @param {Object} route - Données de l'itinéraire
   * @param {Object} environmentalConditions - Conditions environnementales prédites
   * @param {Object} riderProfile - Profil du cycliste
   * @returns {Object} Estimation de l'effort
   */
  async estimateEffort(route, environmentalConditions, riderProfile) {
    try {
      // Générer une clé de cache unique
      const cacheKey = this.generateCacheKey(route.id, environmentalConditions.timestamp, riderProfile.id);
      
      // Vérifier si l'estimation est en cache
      const cachedEstimation = this.cache.get(cacheKey);
      if (cachedEstimation) {
        logger.info('Estimation récupérée depuis le cache');
        return {
          ...cachedEstimation,
          fromCache: true
        };
      }
      
      // Calculer l'effort de base en fonction du profil de l'itinéraire
      const baseEffort = this.calculateBaseEffort(route);
      
      // Ajuster en fonction des conditions environnementales
      const environmentalFactor = this.calculateEnvironmentalFactor(environmentalConditions);
      
      // Ajuster en fonction du profil du cycliste
      const riderFactor = this.calculateRiderFactor(riderProfile);
      
      // Calculer l'effort total
      const totalEffort = baseEffort * environmentalFactor * riderFactor;
      
      // Estimer le temps et la dépense énergétique
      const timeEstimate = this.estimateTime(route, totalEffort, riderProfile);
      const energyEstimate = this.estimateEnergy(route, totalEffort, riderProfile);
      
      const estimation = {
        routeId: route.id,
        effort: {
          score: Math.round(totalEffort * 100),
          category: this.getEffortCategory(totalEffort),
          baseEffort: Math.round(baseEffort * 100),
          environmentalFactor: parseFloat(environmentalFactor.toFixed(2)),
          riderFactor: parseFloat(riderFactor.toFixed(2))
        },
        estimates: {
          time: timeEstimate,
          energy: energyEstimate
        },
        recommendations: this.generateRecommendations(route, environmentalConditions, totalEffort, riderProfile),
        timestamp: new Date().toISOString(),
        fromCache: false
      };
      
      // Stocker en cache
      this.cache.set(cacheKey, estimation);
      
      return estimation;
    } catch (error) {
      logger.error(`Erreur lors de l'estimation de l'effort: ${error.message}`);
      throw new Error(`Échec de l'estimation de l'effort: ${error.message}`);
    }
  }
  
  /**
   * Calcule l'effort de base en fonction du profil de l'itinéraire
   * @param {Object} route - Données de l'itinéraire
   * @returns {number} Effort de base (0-1)
   */
  calculateBaseEffort(route) {
    // Facteurs principaux : distance, dénivelé, pente moyenne
    const distanceFactor = route.distance / 100; // Normalisé pour 100km
    const elevationFactor = route.elevation_gain / 1000; // Normalisé pour 1000m
    
    // Calculer la pente moyenne
    const avgGradient = route.elevation_gain / (route.distance * 10); // en %
    const gradientFactor = Math.pow(avgGradient / 5, 1.5); // Effet exponentiel des pentes
    
    // Facteur de surface (route, gravel, etc.)
    const surfaceFactor = this.getSurfaceFactor(route.surface_type || 'road');
    
    // Combiner les facteurs (avec pondération)
    return (distanceFactor * 0.4) + (elevationFactor * 0.4) + (gradientFactor * 0.15) + (surfaceFactor * 0.05);
  }
  
  /**
   * Calcule le facteur d'ajustement environnemental
   * @param {Object} conditions - Conditions environnementales
   * @returns {number} Facteur environnemental (0.7-1.5)
   */
  calculateEnvironmentalFactor(conditions) {
    // Facteurs : température, vent, précipitations, qualité de l'air
    let factor = 1.0;
    
    // Température (optimale autour de 15-20°C)
    const avgTemp = conditions.overallPrediction.summary.includes('temperature') ? 
                    this.extractTemperatureFromSummary(conditions.overallPrediction.summary) : 
                    18; // Valeur par défaut

    if (avgTemp < 5) factor += 0.1 * (5 - avgTemp) / 5; // Plus froid = plus difficile
    if (avgTemp > 25) factor += 0.05 * (avgTemp - 25) / 5; // Plus chaud = plus difficile
    
    // Impact des précipitations
    if (conditions.overallPrediction.summary.includes('précipitation') || 
        conditions.overallPrediction.summary.includes('pluie')) {
      factor += 0.2;
    }
    
    // Impact du vent
    if (conditions.overallPrediction.summary.includes('vent fort')) {
      factor += 0.3;
    } else if (conditions.overallPrediction.summary.includes('vent')) {
      factor += 0.15;
    }
    
    // Qualité de l'air
    if (conditions.overallPrediction.summary.includes('qualité de l\'air dégradée')) {
      factor += 0.1;
    }
    
    // Limiter le facteur à une plage raisonnable
    return Math.max(0.7, Math.min(1.5, factor));
  }
  
  /**
   * Extrait la température d'un résumé textuel
   * @param {string} summary - Résumé des conditions
   * @returns {number} Température approximative
   */
  extractTemperatureFromSummary(summary) {
    // Valeur par défaut
    return 18;
  }
  
  /**
   * Calcule le facteur d'ajustement du cycliste
   * @param {Object} profile - Profil du cycliste
   * @returns {number} Facteur cycliste (0.7-1.3)
   */
  calculateRiderFactor(profile) {
    // Facteurs : niveau, âge, poids, expérience
    let factor = 1.0;
    
    // Niveau (débutant, intermédiaire, avancé, expert)
    switch (profile.level) {
      case 'beginner':
        factor += 0.3;
        break;
      case 'intermediate':
        factor += 0.1;
        break;
      case 'advanced':
        factor -= 0.1;
        break;
      case 'expert':
        factor -= 0.2;
        break;
      default:
        // Niveau intermédiaire par défaut
        factor += 0.1;
    }
    
    // Âge (optimal autour de 25-35 ans)
    if (profile.age) {
      if (profile.age < 25) factor += 0.05;
      if (profile.age > 35) factor += 0.01 * (profile.age - 35) / 5;
    }
    
    // Poids (impact sur les montées)
    if (profile.weight) {
      const weightFactor = (profile.weight - 70) / 100;
      factor += weightFactor;
    }
    
    // Expérience spécifique
    if (profile.mountain_experience) factor -= 0.05;
    if (profile.endurance_experience) factor -= 0.05;
    
    // Limiter le facteur à une plage raisonnable
    return Math.max(0.7, Math.min(1.3, factor));
  }
  
  /**
   * Obtient le facteur de surface selon le type
   * @param {string} surfaceType - Type de surface
   * @returns {number} Facteur de surface (0-1)
   */
  getSurfaceFactor(surfaceType) {
    const surfaceFactors = {
      'road': 0.1,      // Route goudronnée
      'gravel': 0.3,    // Chemin gravillonné
      'trail': 0.5,     // Sentier
      'mountain': 0.7,  // Chemin de montagne
      'technical': 0.9  // Terrain technique
    };
    
    return surfaceFactors[surfaceType] || 0.1; // Route par défaut
  }
  
  /**
   * Détermine la catégorie d'effort à partir d'un score
   * @param {number} effortScore - Score d'effort (0-1)
   * @returns {string} Catégorie d'effort
   */
  getEffortCategory(effortScore) {
    const score = effortScore * 100;
    
    if (score < 30) return 'Facile';
    if (score < 50) return 'Modéré';
    if (score < 70) return 'Difficile';
    if (score < 85) return 'Très difficile';
    return 'Extrême';
  }
  
  /**
   * Estime le temps nécessaire pour compléter l'itinéraire
   * @param {Object} route - Données de l'itinéraire
   * @param {number} effortScore - Score d'effort
   * @param {Object} riderProfile - Profil du cycliste
   * @returns {Object} Estimation de temps
   */
  estimateTime(route, effortScore, riderProfile) {
    // Déterminer la vitesse moyenne en fonction du niveau et des conditions
    let baseSpeed;
    
    switch (riderProfile.level) {
      case 'beginner':
        baseSpeed = 18; // km/h
        break;
      case 'intermediate':
        baseSpeed = 25; // km/h
        break;
      case 'advanced':
        baseSpeed = 30; // km/h
        break;
      case 'expert':
        baseSpeed = 35; // km/h
        break;
      default:
        baseSpeed = 25; // km/h (par défaut intermédiaire)
    }
    
    // Ajuster la vitesse en fonction de l'effort
    const adjustedSpeed = baseSpeed * (1 - (effortScore * 0.5));
    
    // Calculer le temps total en heures
    const totalTimeHours = route.distance / 1000 / adjustedSpeed;
    
    // Convertir en heures et minutes
    const hours = Math.floor(totalTimeHours);
    const minutes = Math.round((totalTimeHours - hours) * 60);
    
    // Calculer les temps min et max (±15%)
    const minTimeHours = totalTimeHours * 0.85;
    const maxTimeHours = totalTimeHours * 1.15;
    
    const minHours = Math.floor(minTimeHours);
    const minMinutes = Math.round((minTimeHours - minHours) * 60);
    
    const maxHours = Math.floor(maxTimeHours);
    const maxMinutes = Math.round((maxTimeHours - maxHours) * 60);
    
    return {
      avgSpeed: Math.round(adjustedSpeed * 10) / 10,
      total: {
        hours,
        minutes,
        formatted: `${hours}h${minutes < 10 ? '0' : ''}${minutes}`
      },
      range: {
        min: {
          hours: minHours,
          minutes: minMinutes,
          formatted: `${minHours}h${minMinutes < 10 ? '0' : ''}${minMinutes}`
        },
        max: {
          hours: maxHours,
          minutes: maxMinutes,
          formatted: `${maxHours}h${maxMinutes < 10 ? '0' : ''}${maxMinutes}`
        }
      }
    };
  }
  
  /**
   * Estime la dépense énergétique pour l'itinéraire
   * @param {Object} route - Données de l'itinéraire
   * @param {number} effortScore - Score d'effort
   * @param {Object} riderProfile - Profil du cycliste
   * @returns {Object} Estimation énergétique
   */
  estimateEnergy(route, effortScore, riderProfile) {
    // Poids de base (si non spécifié)
    const weight = riderProfile.weight || 70; // kg
    
    // Calcul basé sur la formule simplifiée des kcal
    // kcal = MET × poids (kg) × durée (heures)
    
    // MET varie selon l'intensité (3-14 pour le cyclisme)
    let metValue;
    
    const effortCategory = this.getEffortCategory(effortScore);
    switch (effortCategory) {
      case 'Facile':
        metValue = 5;
        break;
      case 'Modéré':
        metValue = 7;
        break;
      case 'Difficile':
        metValue = 10;
        break;
      case 'Très difficile':
        metValue = 12;
        break;
      case 'Extrême':
        metValue = 14;
        break;
      default:
        metValue = 7;
    }
    
    // Durée estimée (en heures)
    const estimatedTime = route.distance / 1000 / this.estimateTime(route, effortScore, riderProfile).avgSpeed;
    
    // Calcul des calories
    const calories = Math.round(metValue * weight * estimatedTime);
    
    // Calcul des glucides nécessaires (environ 1g pour 4 kcal dépensées pendant l'exercice)
    const carbs = Math.round(calories / 4 * 0.7); // 70% des calories devraient venir des glucides
    
    return {
      calories,
      carbs,
      hydration: Math.round(estimatedTime * 500) // ~500ml par heure
    };
  }
  
  /**
   * Génère des recommandations spécifiques pour l'itinéraire
   * @param {Object} route - Données de l'itinéraire
   * @param {Object} conditions - Conditions environnementales
   * @param {number} effortScore - Score d'effort
   * @param {Object} riderProfile - Profil du cycliste
   * @returns {Array<Object>} Recommandations
   */
  generateRecommendations(route, conditions, effortScore, riderProfile) {
    const recommendations = [];
    const effortCategory = this.getEffortCategory(effortScore);
    
    // Recommandations d'équipement
    recommendations.push({
      type: 'equipment',
      title: 'Équipement recommandé',
      items: this.getEquipmentRecommendations(conditions, effortCategory)
    });
    
    // Recommandations de nutrition
    const energyEstimate = this.estimateEnergy(route, effortScore, riderProfile);
    recommendations.push({
      type: 'nutrition',
      title: 'Nutrition et hydratation',
      items: [
        `Emportez au moins ${Math.ceil(energyEstimate.hydration / 1000)} litres d'eau`,
        `Prévoyez environ ${energyEstimate.carbs}g de glucides pour l'effort`,
        'Alimentez-vous régulièrement pendant l\'effort (toutes les 30-45 minutes)'
      ]
    });
    
    // Recommandations de préparation
    recommendations.push({
      type: 'preparation',
      title: 'Préparation',
      items: [
        'Vérifiez votre vélo avant le départ (freins, pneus, transmission)',
        'Informez quelqu\'un de votre itinéraire et heure estimée de retour',
        'Téléchargez la trace GPS sur votre compteur',
        'Vérifiez les points de ravitaillement sur le parcours'
      ]
    });
    
    return recommendations;
  }
  
  /**
   * Détermine les recommandations d'équipement en fonction des conditions
   * @param {Object} conditions - Conditions environnementales
   * @param {string} effortCategory - Catégorie d'effort
   * @returns {Array<string>} Recommandations d'équipement
   */
  getEquipmentRecommendations(conditions, effortCategory) {
    const recommendations = [
      'Casque', 'Gants', 'Lunettes de soleil'
    ];
    
    // Conditions météo
    if (conditions.overallPrediction.summary.includes('pluie') || 
        conditions.overallPrediction.summary.includes('précipitation')) {
      recommendations.push('Veste imperméable', 'Surchaussures', 'Garde-boue');
    }
    
    // Température
    if (conditions.overallPrediction.summary.includes('froid') || 
        conditions.overallPrediction.summary.includes('fraîche')) {
      recommendations.push('Vêtements thermiques', 'Couvre-chaussures', 'Bonnet sous le casque');
    } else if (conditions.overallPrediction.summary.includes('chaud') || 
               conditions.overallPrediction.summary.includes('chaleur')) {
      recommendations.push('Crème solaire', 'Vêtements légers et respirants');
    }
    
    // Selon la difficulté
    if (effortCategory === 'Difficile' || effortCategory === 'Très difficile' || effortCategory === 'Extrême') {
      recommendations.push('Kit de réparation complet', 'Barres et gels énergétiques supplémentaires');
    }
    
    return recommendations;
  }
  
  /**
   * Génère une clé de cache unique
   * @param {string} routeId - ID de l'itinéraire
   * @param {string} timestamp - Horodatage des conditions
   * @param {string} riderId - ID du cycliste
   * @returns {string} Clé de cache
   */
  generateCacheKey(routeId, timestamp, riderId) {
    // Extraire la date du timestamp (sans l'heure)
    const date = timestamp.split('T')[0];
    return `effort_${routeId}_${date}_${riderId}`;
  }
}

module.exports = new EffortEstimationService();
