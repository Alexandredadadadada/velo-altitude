// models/route-alternatives.model.js - Modèle pour les itinéraires alternatifs
const axios = require('axios');
const config = require('../config/api.config');
const routePlannerModel = require('./route-planner.model');

/**
 * Classe pour la gestion des itinéraires alternatifs
 */
class RouteAlternativesModel {
  /**
   * Génère des itinéraires alternatifs en fonction des conditions météo
   * @param {string} routeId - ID de l'itinéraire principal
   * @param {Object} weatherConditions - Conditions météo actuelles ou prévues
   * @returns {Promise<Array>} - Liste d'itinéraires alternatifs
   */
  async generateWeatherBasedAlternatives(routeId, weatherConditions) {
    try {
      const route = routePlannerModel.getRouteById(routeId);
      if (!route) {
        throw new Error(`Itinéraire avec l'ID ${routeId} non trouvé`);
      }

      // Analyse des conditions météo
      const weatherIssues = this._analyzeWeatherIssues(weatherConditions);
      
      if (weatherIssues.length === 0) {
        return {
          originalRoute: route,
          alternatives: [],
          message: "Les conditions météo sont favorables, l'itinéraire original est recommandé"
        };
      }

      // Générer des alternatives en fonction des problèmes météo identifiés
      const alternatives = await this._createAlternatives(route, weatherIssues);
      
      return {
        originalRoute: route,
        weatherIssues,
        alternatives
      };
    } catch (error) {
      console.error('Erreur lors de la génération d\'alternatives basées sur la météo:', error);
      throw error;
    }
  }

  /**
   * Analyse les conditions météo pour identifier les problèmes potentiels
   * @param {Object} weatherConditions - Conditions météo
   * @returns {Array} - Liste des problèmes identifiés
   * @private
   */
  _analyzeWeatherIssues(weatherConditions) {
    const issues = [];

    // Vérifier la pluie
    if (weatherConditions.precipitation > 5) {
      issues.push({
        type: 'rain',
        severity: weatherConditions.precipitation > 20 ? 'high' : 'medium',
        description: `Pluie prévue (${weatherConditions.precipitation}mm)`
      });
    }

    // Vérifier le vent
    if (weatherConditions.windSpeed > 30) {
      issues.push({
        type: 'wind',
        severity: weatherConditions.windSpeed > 50 ? 'high' : 'medium',
        description: `Vent fort prévu (${weatherConditions.windSpeed}km/h)`
      });
    }

    // Vérifier la température
    if (weatherConditions.temperature < 5) {
      issues.push({
        type: 'cold',
        severity: weatherConditions.temperature < 0 ? 'high' : 'medium',
        description: `Températures basses (${weatherConditions.temperature}°C)`
      });
    } else if (weatherConditions.temperature > 30) {
      issues.push({
        type: 'heat',
        severity: weatherConditions.temperature > 35 ? 'high' : 'medium',
        description: `Températures élevées (${weatherConditions.temperature}°C)`
      });
    }

    // Vérifier les orages
    if (weatherConditions.stormRisk) {
      issues.push({
        type: 'storm',
        severity: 'high',
        description: 'Risque d\'orages'
      });
    }

    return issues;
  }

  /**
   * Crée des itinéraires alternatifs en fonction des problèmes météo
   * @param {Object} originalRoute - Itinéraire original
   * @param {Array} weatherIssues - Problèmes météo identifiés
   * @returns {Promise<Array>} - Liste d'itinéraires alternatifs
   * @private
   */
  async _createAlternatives(originalRoute, weatherIssues) {
    const alternatives = [];
    
    // Pour chaque type de problème météo, créer une alternative adaptée
    const hasHighSeverityIssues = weatherIssues.some(issue => issue.severity === 'high');
    
    // Alternative 1: Itinéraire abrité (pour vent, pluie, orages)
    if (weatherIssues.some(issue => ['rain', 'wind', 'storm'].includes(issue.type))) {
      alternatives.push(this._createShelteredRoute(originalRoute, weatherIssues));
    }
    
    // Alternative 2: Itinéraire plus court (pour chaleur, froid)
    if (weatherIssues.some(issue => ['heat', 'cold'].includes(issue.type))) {
      alternatives.push(this._createShorterRoute(originalRoute, weatherIssues));
    }
    
    // Alternative 3: Itinéraire de secours (pour conditions extrêmes)
    if (hasHighSeverityIssues) {
      alternatives.push(this._createEmergencyRoute(originalRoute, weatherIssues));
    }
    
    return alternatives;
  }

  /**
   * Crée un itinéraire abrité (vallées, forêts)
   * @param {Object} originalRoute - Itinéraire original
   * @param {Array} issues - Problèmes météo
   * @returns {Object} - Itinéraire alternatif
   * @private
   */
  _createShelteredRoute(originalRoute, issues) {
    // Simuler la création d'un itinéraire plus abrité
    // Dans une implémentation réelle, utiliserait des services de cartographie et d'élévation

    return {
      id: `${originalRoute.id}-sheltered`,
      name: `${originalRoute.name} (Version abritée)`,
      type: 'sheltered',
      reason: issues.map(issue => issue.description).join(', '),
      description: "Version modifiée privilégiant les vallées, forêts et routes abritées du vent",
      totalDistance: Math.round(originalRoute.totalDistance * 1.1), // Généralement un peu plus long
      totalElevation: Math.round(originalRoute.totalElevation * 0.8), // Moins de dénivelé
      estimatedTime: Math.round(originalRoute.totalDistance * 1.1 / 20 * 60), // Temps estimé en minutes
      difficultyChange: "Légèrement plus facile",
      segments: this._generateModifiedSegments(originalRoute.segments, 'sheltered')
    };
  }

  /**
   * Crée un itinéraire plus court
   * @param {Object} originalRoute - Itinéraire original
   * @param {Array} issues - Problèmes météo
   * @returns {Object} - Itinéraire alternatif
   * @private
   */
  _createShorterRoute(originalRoute, issues) {
    // Calculer une version raccourcie de l'itinéraire
    const reductionFactor = issues.some(issue => issue.severity === 'high') ? 0.5 : 0.7;
    
    return {
      id: `${originalRoute.id}-shorter`,
      name: `${originalRoute.name} (Version raccourcie)`,
      type: 'shorter',
      reason: issues.map(issue => issue.description).join(', '),
      description: "Version raccourcie conservant les points d'intérêt principaux",
      totalDistance: Math.round(originalRoute.totalDistance * reductionFactor),
      totalElevation: Math.round(originalRoute.totalElevation * reductionFactor),
      estimatedTime: Math.round(originalRoute.totalDistance * reductionFactor / 20 * 60),
      difficultyChange: "Significativement plus facile",
      segments: this._generateModifiedSegments(originalRoute.segments, 'shorter', reductionFactor)
    };
  }

  /**
   * Crée un itinéraire de secours (pour conditions extrêmes)
   * @param {Object} originalRoute - Itinéraire original
   * @param {Array} issues - Problèmes météo
   * @returns {Object} - Itinéraire alternatif
   * @private
   */
  _createEmergencyRoute(originalRoute, issues) {
    return {
      id: `${originalRoute.id}-emergency`,
      name: `${originalRoute.name} (Plan de secours)`,
      type: 'emergency',
      reason: `Conditions extrêmes: ${issues.filter(i => i.severity === 'high').map(i => i.description).join(', ')}`,
      description: "Itinéraire de secours minimal avec options d'évacuation",
      totalDistance: Math.round(originalRoute.totalDistance * 0.3),
      totalElevation: Math.round(originalRoute.totalElevation * 0.2),
      estimatedTime: Math.round(originalRoute.totalDistance * 0.3 / 20 * 60),
      difficultyChange: "Beaucoup plus facile",
      segments: this._generateModifiedSegments(originalRoute.segments, 'emergency', 0.3),
      safetyPoints: this._generateSafetyPoints(originalRoute)
    };
  }

  /**
   * Génère des segments modifiés pour l'itinéraire alternatif
   * @param {Array} originalSegments - Segments originaux
   * @param {string} alternativeType - Type d'alternative
   * @param {number} reductionFactor - Facteur de réduction (pour shorter/emergency)
   * @returns {Array} - Segments modifiés
   * @private
   */
  _generateModifiedSegments(originalSegments, alternativeType, reductionFactor = 1) {
    if (alternativeType === 'sheltered') {
      // Simuler des segments plus abrités
      return originalSegments.map(segment => ({
        name: `${segment.name} (version abritée)`,
        distance: Math.round(segment.distance * 1.1),
        elevation: Math.round(segment.elevation * 0.8),
        averageGradient: segment.averageGradient * 0.8,
        description: `Version modifiée privilégiant les routes forestières et abritées`,
        points: segment.points
      }));
    } else if (alternativeType === 'shorter' || alternativeType === 'emergency') {
      // Pour les versions raccourcies, prendre uniquement un sous-ensemble des segments
      const segmentsToKeep = Math.max(2, Math.ceil(originalSegments.length * reductionFactor));
      const selectedSegments = [];
      
      // Toujours garder le premier et dernier segment
      selectedSegments.push({...originalSegments[0], 
        distance: Math.round(originalSegments[0].distance * 0.8),
        elevation: Math.round(originalSegments[0].elevation * 0.7)
      });
      
      // Si nous avons plus de 2 segments à garder, ajouter quelques segments du milieu
      if (segmentsToKeep > 2 && originalSegments.length > 2) {
        const step = Math.floor((originalSegments.length - 2) / (segmentsToKeep - 2));
        for (let i = 1; i < segmentsToKeep - 1; i++) {
          const index = Math.min(i * step, originalSegments.length - 2);
          selectedSegments.push({...originalSegments[index],
            distance: Math.round(originalSegments[index].distance * 0.8),
            elevation: Math.round(originalSegments[index].elevation * 0.7)
          });
        }
      }
      
      // Ajouter le dernier segment
      selectedSegments.push({...originalSegments[originalSegments.length - 1],
        distance: Math.round(originalSegments[originalSegments.length - 1].distance * 0.8),
        elevation: Math.round(originalSegments[originalSegments.length - 1].elevation * 0.7)
      });
      
      return selectedSegments;
    }
    
    return originalSegments;
  }

  /**
   * Génère des points de sécurité pour l'itinéraire d'urgence
   * @param {Object} route - Itinéraire original
   * @returns {Array} - Points de sécurité
   * @private
   */
  _generateSafetyPoints(route) {
    // Dans une implémentation réelle, utiliserait des données géographiques pour identifier
    // des abris, refuges, gares, etc.
    return [
      {
        name: "Point d'évacuation 1",
        type: "refuge",
        description: "Refuge accessible en cas d'urgence",
        coordinates: [0, 0] // À remplacer par de vraies coordonnées
      },
      {
        name: "Point d'évacuation 2",
        type: "village",
        description: "Village avec commerces et transports",
        coordinates: [0, 0] // À remplacer par de vraies coordonnées
      }
    ];
  }

  /**
   * Génère des itinéraires adaptés au profil du cycliste
   * @param {string} routeId - ID de l'itinéraire principal
   * @param {Object} cyclistProfile - Profil du cycliste
   * @returns {Promise<Array>} - Itinéraires adaptés
   */
  async generateProfileBasedRoutes(routeId, cyclistProfile) {
    try {
      const route = routePlannerModel.getRouteById(routeId);
      if (!route) {
        throw new Error(`Itinéraire avec l'ID ${routeId} non trouvé`);
      }

      const variants = [];
      
      // Créer des variantes en fonction du niveau et des préférences
      variants.push(this._createSportiveVariant(route, cyclistProfile));
      variants.push(this._createTouristicVariant(route, cyclistProfile));
      variants.push(this._createFamilyVariant(route, cyclistProfile));
      
      return {
        originalRoute: route,
        profile: cyclistProfile,
        recommendedType: this._determineRecommendedVariant(cyclistProfile),
        variants
      };
    } catch (error) {
      console.error('Erreur lors de la génération d\'itinéraires basés sur le profil:', error);
      throw error;
    }
  }

  /**
   * Détermine la variante recommandée selon le profil
   * @param {Object} profile - Profil du cycliste
   * @returns {string} - Type de variante recommandée
   * @private
   */
  _determineRecommendedVariant(profile) {
    if (profile.level === 'expert' || profile.level === 'advanced') {
      return 'sportive';
    }
    
    if (profile.withChildren || profile.level === 'beginner') {
      return 'family';
    }
    
    if (profile.preferences && profile.preferences.includes('cultural')) {
      return 'touristic';
    }
    
    return 'touristic'; // Par défaut
  }

  /**
   * Crée une variante sportive de l'itinéraire
   * @param {Object} route - Itinéraire original
   * @param {Object} profile - Profil du cycliste
   * @returns {Object} - Variante sportive
   * @private
   */
  _createSportiveVariant(route, profile) {
    return {
      id: `${route.id}-sportive`,
      name: `${route.name} (Version sportive)`,
      type: 'sportive',
      description: "Version privilégiant les cols et les défis sportifs",
      suitability: this._calculateSuitability(profile, 'sportive'),
      totalDistance: Math.round(route.totalDistance * 1.2),
      totalElevation: Math.round(route.totalElevation * 1.4),
      difficultyLevel: "Difficile",
      highlights: [
        "Cols supplémentaires",
        "Sections chronométrées Strava",
        "Passages techniques"
      ],
      segments: this._generateVariantSegments(route.segments, 'sportive')
    };
  }

  /**
   * Crée une variante touristique de l'itinéraire
   * @param {Object} route - Itinéraire original
   * @param {Object} profile - Profil du cycliste
   * @returns {Object} - Variante touristique
   * @private
   */
  _createTouristicVariant(route, profile) {
    return {
      id: `${route.id}-touristic`,
      name: `${route.name} (Version touristique)`,
      type: 'touristic',
      description: "Version privilégiant les points d'intérêt culturels et gastronomiques",
      suitability: this._calculateSuitability(profile, 'touristic'),
      totalDistance: Math.round(route.totalDistance * 1.1),
      totalElevation: Math.round(route.totalElevation * 0.9),
      difficultyLevel: "Modéré",
      highlights: [
        "Sites historiques",
        "Vues panoramiques",
        "Arrêts gastronomiques"
      ],
      segments: this._generateVariantSegments(route.segments, 'touristic')
    };
  }

  /**
   * Crée une variante familiale de l'itinéraire
   * @param {Object} route - Itinéraire original
   * @param {Object} profile - Profil du cycliste
   * @returns {Object} - Variante familiale
   * @private
   */
  _createFamilyVariant(route, profile) {
    return {
      id: `${route.id}-family`,
      name: `${route.name} (Version famille)`,
      type: 'family',
      description: "Version adaptée aux familles avec enfants et cyclistes débutants",
      suitability: this._calculateSuitability(profile, 'family'),
      totalDistance: Math.round(route.totalDistance * 0.7),
      totalElevation: Math.round(route.totalElevation * 0.5),
      difficultyLevel: "Facile",
      highlights: [
        "Pistes cyclables sécurisées",
        "Aires de pique-nique",
        "Points d'intérêt pour enfants"
      ],
      segments: this._generateVariantSegments(route.segments, 'family')
    };
  }

  /**
   * Calcule l'adéquation entre un profil et une variante
   * @param {Object} profile - Profil du cycliste
   * @param {string} variantType - Type de variante
   * @returns {Object} - Score et description
   * @private
   */
  _calculateSuitability(profile, variantType) {
    let score = 50; // Score de base
    
    // Ajustement selon le niveau
    if (variantType === 'sportive') {
      if (profile.level === 'expert') score += 40;
      else if (profile.level === 'advanced') score += 30;
      else if (profile.level === 'intermediate') score += 10;
      else score -= 20;
    } else if (variantType === 'family') {
      if (profile.level === 'beginner') score += 40;
      else if (profile.level === 'intermediate') score += 20;
      else if (profile.level === 'advanced') score -= 10;
      else score -= 20;
      
      if (profile.withChildren) score += 30;
    } else if (variantType === 'touristic') {
      if (profile.level === 'intermediate') score += 30;
      else if (profile.level === 'beginner') score += 20;
      else if (profile.level === 'advanced') score += 10;
    }
    
    // Ajustement selon les préférences
    if (profile.preferences) {
      if (variantType === 'sportive' && profile.preferences.includes('performance')) score += 20;
      if (variantType === 'touristic' && profile.preferences.includes('cultural')) score += 20;
      if (variantType === 'family' && profile.preferences.includes('relaxed')) score += 20;
    }
    
    // Limiter le score entre 0 et 100
    score = Math.max(0, Math.min(100, score));
    
    // Déterminer la description
    let description;
    if (score >= 80) description = "Parfaitement adapté";
    else if (score >= 60) description = "Bien adapté";
    else if (score >= 40) description = "Moyennement adapté";
    else description = "Peu adapté";
    
    return { score, description };
  }

  /**
   * Génère des segments pour une variante spécifique
   * @param {Array} originalSegments - Segments originaux
   * @param {string} variantType - Type de variante
   * @returns {Array} - Segments modifiés
   * @private
   */
  _generateVariantSegments(originalSegments, variantType) {
    if (variantType === 'sportive') {
      return originalSegments.map(segment => ({
        name: segment.name,
        distance: Math.round(segment.distance * 1.2),
        elevation: Math.round(segment.elevation * 1.4),
        averageGradient: segment.averageGradient * 1.2,
        description: `Version sportive incluant des sections plus difficiles`,
        points: segment.points,
        highlights: ["Section KOM Strava", "Col supplémentaire"]
      }));
    } else if (variantType === 'touristic') {
      return originalSegments.map(segment => ({
        name: segment.name,
        distance: Math.round(segment.distance * 1.1),
        elevation: Math.round(segment.elevation * 0.9),
        averageGradient: segment.averageGradient * 0.9,
        description: `Version touristique passant par des sites d'intérêt`,
        points: segment.points,
        highlights: ["Château historique", "Vue panoramique", "Restaurant étoilé"]
      }));
    } else if (variantType === 'family') {
      // Pour la version famille, réduire le nombre de segments
      const simplifiedSegments = [];
      const segmentsToKeep = Math.max(2, Math.ceil(originalSegments.length * 0.6));
      
      for (let i = 0; i < segmentsToKeep; i++) {
        const index = Math.floor((i / segmentsToKeep) * originalSegments.length);
        simplifiedSegments.push({
          name: originalSegments[index].name,
          distance: Math.round(originalSegments[index].distance * 0.7),
          elevation: Math.round(originalSegments[index].elevation * 0.5),
          averageGradient: originalSegments[index].averageGradient * 0.6,
          description: `Version simplifiée adaptée aux familles`,
          points: originalSegments[index].points,
          highlights: ["Piste cyclable sécurisée", "Aire de jeux", "Point d'eau"]
        });
      }
      
      return simplifiedSegments;
    }
    
    return originalSegments;
  }
}

module.exports = new RouteAlternativesModel();
