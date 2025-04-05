/**
 * Service pour gérer les couleurs d'itinéraires en fonction de leur difficulté
 * @module services/route-color.service
 */

const logger = require('../utils/logger');

/**
 * Service pour la gestion des couleurs d'itinéraires selon leur difficulté
 */
class RouteColorService {
  constructor() {
    // Palettes de couleurs pour les différents niveaux de difficulté
    this.difficultyColors = {
      // Vert - facile
      easy: {
        baseColor: '#4CAF50',
        gradient: ['#81C784', '#4CAF50', '#2E7D32'],
        cssClass: 'route-easy',
        gpxColor: 'Green'
      },
      // Bleu - modéré
      moderate: {
        baseColor: '#2196F3',
        gradient: ['#64B5F6', '#2196F3', '#1565C0'],
        cssClass: 'route-moderate',
        gpxColor: 'Blue'
      },
      // Orange - difficile
      difficult: {
        baseColor: '#FF9800',
        gradient: ['#FFB74D', '#FF9800', '#EF6C00'],
        cssClass: 'route-difficult',
        gpxColor: 'Orange'
      },
      // Rouge - très difficile
      very_difficult: {
        baseColor: '#F44336',
        gradient: ['#E57373', '#F44336', '#C62828'],
        cssClass: 'route-very-difficult',
        gpxColor: 'Red'
      },
      // Violet - extrêmement difficile
      extreme: {
        baseColor: '#9C27B0',
        gradient: ['#BA68C8', '#9C27B0', '#7B1FA2'],
        cssClass: 'route-extreme',
        gpxColor: 'Purple'
      },
      // Noir - challenge exceptionnel
      challenge: {
        baseColor: '#212121',
        gradient: ['#616161', '#424242', '#212121'],
        cssClass: 'route-challenge',
        gpxColor: 'Black'
      }
    };
    
    // Seuils de difficulté en fonction des pentes, dénivelés, etc.
    this.thresholds = {
      // Basé sur le gradient moyen en pourcentage
      avgGradient: {
        easy: 2.5,         // 0-2.5%
        moderate: 5,        // 2.5-5%
        difficult: 8,       // 5-8%
        very_difficult: 11, // 8-11%
        extreme: 14         // 11-14%
        // > 14% = challenge
      },
      // Basé sur le dénivelé positif en mètres
      elevationGain: {
        easy: 300,           // 0-300m
        moderate: 800,       // 300-800m
        difficult: 1500,     // 800-1500m
        very_difficult: 2500,// 1500-2500m
        extreme: 3500        // 2500-3500m
        // > 3500m = challenge
      },
      // Basé sur la distance en km
      distance: {
        easy: 15,            // 0-15km
        moderate: 30,        // 15-30km
        difficult: 60,       // 30-60km
        very_difficult: 100, // 60-100km
        extreme: 150         // 100-150km
        // > 150km = challenge
      }
    };
  }

  /**
   * Calcule la difficulté d'un itinéraire à partir de ses caractéristiques
   * @param {Object} routeStats - Statistiques de l'itinéraire
   * @returns {String} - Niveau de difficulté (easy, moderate, difficult, very_difficult, extreme, challenge)
   */
  calculateRouteDifficulty(routeStats) {
    try {
      const { avgGradient, elevationGain, distance, maxGradient } = routeStats;
      
      // Scores par catégorie (0-5)
      let gradientScore = 0;
      let elevationScore = 0;
      let distanceScore = 0;
      let bonusScore = 0; // Pour des facteurs spéciaux comme gradient max
      
      // Score du gradient moyen
      if (avgGradient <= this.thresholds.avgGradient.easy) {
        gradientScore = 1;
      } else if (avgGradient <= this.thresholds.avgGradient.moderate) {
        gradientScore = 2;
      } else if (avgGradient <= this.thresholds.avgGradient.difficult) {
        gradientScore = 3;
      } else if (avgGradient <= this.thresholds.avgGradient.very_difficult) {
        gradientScore = 4;
      } else if (avgGradient <= this.thresholds.avgGradient.extreme) {
        gradientScore = 5;
      } else {
        gradientScore = 6; // Au-dessus du seuil "extreme"
      }
      
      // Score du dénivelé
      if (elevationGain <= this.thresholds.elevationGain.easy) {
        elevationScore = 1;
      } else if (elevationGain <= this.thresholds.elevationGain.moderate) {
        elevationScore = 2;
      } else if (elevationGain <= this.thresholds.elevationGain.difficult) {
        elevationScore = 3;
      } else if (elevationGain <= this.thresholds.elevationGain.very_difficult) {
        elevationScore = 4;
      } else if (elevationGain <= this.thresholds.elevationGain.extreme) {
        elevationScore = 5;
      } else {
        elevationScore = 6;
      }
      
      // Score de la distance
      if (distance <= this.thresholds.distance.easy) {
        distanceScore = 1;
      } else if (distance <= this.thresholds.distance.moderate) {
        distanceScore = 2;
      } else if (distance <= this.thresholds.distance.difficult) {
        distanceScore = 3;
      } else if (distance <= this.thresholds.distance.very_difficult) {
        distanceScore = 4;
      } else if (distance <= this.thresholds.distance.extreme) {
        distanceScore = 5;
      } else {
        distanceScore = 6;
      }
      
      // Bonus pour gradient max
      if (maxGradient && maxGradient > 15) {
        bonusScore += Math.min(3, Math.floor((maxGradient - 15) / 5));
      }
      
      // Score global (pondéré)
      // Le gradient moyen a plus de poids pour les parcours courts à moyens
      // Le dénivelé et la distance ont plus de poids pour les longs parcours
      let totalScore;
      
      if (distance <= this.thresholds.distance.moderate) {
        totalScore = (gradientScore * 0.5) + (elevationScore * 0.3) + (distanceScore * 0.2) + (bonusScore * 0.1);
      } else {
        totalScore = (gradientScore * 0.3) + (elevationScore * 0.4) + (distanceScore * 0.3) + (bonusScore * 0.1);
      }
      
      // Déterminer la difficulté en fonction du score total
      if (totalScore <= 1.5) {
        return 'easy';
      } else if (totalScore <= 2.5) {
        return 'moderate';
      } else if (totalScore <= 3.5) {
        return 'difficult';
      } else if (totalScore <= 4.5) {
        return 'very_difficult';
      } else if (totalScore <= 5.5) {
        return 'extreme';
      } else {
        return 'challenge';
      }
    } catch (error) {
      logger.error('Erreur lors du calcul de la difficulté d\'itinéraire', {
        error: error.message,
        stack: error.stack
      });
      
      // Par défaut, retourner 'moderate' en cas d'erreur
      return 'moderate';
    }
  }

  /**
   * Récupère la couleur de base pour un niveau de difficulté donné
   * @param {String} difficulty - Niveau de difficulté
   * @returns {String} - Code couleur hexadécimal
   */
  getColorForDifficulty(difficulty) {
    return this.difficultyColors[difficulty]?.baseColor || this.difficultyColors.moderate.baseColor;
  }

  /**
   * Récupère le dégradé de couleurs pour un niveau de difficulté donné
   * @param {String} difficulty - Niveau de difficulté
   * @returns {Array} - Dégradé de couleurs
   */
  getGradientForDifficulty(difficulty) {
    return this.difficultyColors[difficulty]?.gradient || this.difficultyColors.moderate.gradient;
  }

  /**
   * Récupère la classe CSS pour un niveau de difficulté donné
   * @param {String} difficulty - Niveau de difficulté
   * @returns {String} - Nom de la classe CSS
   */
  getCssClassForDifficulty(difficulty) {
    return this.difficultyColors[difficulty]?.cssClass || this.difficultyColors.moderate.cssClass;
  }

  /**
   * Récupère la couleur GPX pour un niveau de difficulté donné
   * @param {String} difficulty - Niveau de difficulté
   * @returns {String} - Nom de la couleur au format GPX
   */
  getGpxColorForDifficulty(difficulty) {
    return this.difficultyColors[difficulty]?.gpxColor || this.difficultyColors.moderate.gpxColor;
  }

  /**
   * Génère un code CSS pour les couleurs d'itinéraires
   * @returns {String} - Code CSS
   */
  generateRouteColorsCss() {
    let css = `/* Styles pour les couleurs d'itinéraires par difficulté - Généré automatiquement */\n\n`;
    
    // Styles pour chaque niveau de difficulté
    Object.entries(this.difficultyColors).forEach(([difficulty, colorData]) => {
      const { baseColor, gradient, cssClass } = colorData;
      
      // Style pour polyline sur la carte
      css += `.${cssClass} {\n`;
      css += `  stroke: ${baseColor};\n`;
      css += `  stroke-width: 4px;\n`;
      css += `  stroke-opacity: 0.8;\n`;
      css += `}\n\n`;
      
      // Style pour le hover
      css += `.${cssClass}:hover {\n`;
      css += `  stroke-width: 6px;\n`;
      css += `  stroke-opacity: 1;\n`;
      css += `  cursor: pointer;\n`;
      css += `}\n\n`;
      
      // Style pour le marker de difficulté
      css += `.${cssClass}-marker {\n`;
      css += `  background-color: ${baseColor};\n`;
      css += `  border: 2px solid #ffffff;\n`;
      css += `  box-shadow: 0 1px 3px rgba(0,0,0,0.3);\n`;
      css += `}\n\n`;
      
      // Style pour le profil d'élévation
      css += `.${cssClass}-elevation-profile {\n`;
      css += `  background: linear-gradient(to right, ${gradient.join(', ')});\n`;
      css += `}\n\n`;
      
      // Style pour les badges de difficulté
      css += `.badge-${difficulty} {\n`;
      css += `  background-color: ${baseColor};\n`;
      css += `  color: #ffffff;\n`;
      css += `  font-weight: bold;\n`;
      css += `  padding: 0.25rem 0.5rem;\n`;
      css += `  border-radius: 0.25rem;\n`;
      css += `}\n\n`;
    });
    
    return css;
  }

  /**
   * Génère un objet de styles pour un itinéraire sur Leaflet
   * @param {String} difficulty - Niveau de difficulté
   * @returns {Object} - Objet de styles Leaflet
   */
  getLeafletStyleForDifficulty(difficulty) {
    const colorData = this.difficultyColors[difficulty] || this.difficultyColors.moderate;
    
    return {
      color: colorData.baseColor,
      weight: 4,
      opacity: 0.8,
      className: colorData.cssClass,
      // Mise en évidence lors du survol
      highlightOptions: {
        weight: 6,
        opacity: 1,
        color: colorData.gradient[0] // Couleur plus claire pour le hover
      }
    };
  }

  /**
   * Génère un objet de styles pour le segment d'une pente spécifique
   * @param {Number} gradient - Pourcentage de pente
   * @returns {Object} - Objet de styles Leaflet
   */
  getGradientSegmentStyle(gradient) {
    let difficulty;
    
    // Déterminer la difficulté en fonction de la pente
    if (gradient <= this.thresholds.avgGradient.easy) {
      difficulty = 'easy';
    } else if (gradient <= this.thresholds.avgGradient.moderate) {
      difficulty = 'moderate';
    } else if (gradient <= this.thresholds.avgGradient.difficult) {
      difficulty = 'difficult';
    } else if (gradient <= this.thresholds.avgGradient.very_difficult) {
      difficulty = 'very_difficult';
    } else if (gradient <= this.thresholds.avgGradient.extreme) {
      difficulty = 'extreme';
    } else {
      difficulty = 'challenge';
    }
    
    return this.getLeafletStyleForDifficulty(difficulty);
  }
}

module.exports = new RouteColorService();
