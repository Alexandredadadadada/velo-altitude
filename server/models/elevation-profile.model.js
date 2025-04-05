// models/elevation-profile.model.js - Modèle pour les profils d'élévation enrichis
const axios = require('axios');
const config = require('../config/api.config');

/**
 * Classe pour l'analyse et l'enrichissement des profils d'élévation
 */
class ElevationProfileModel {
  /**
   * Analyse un profil d'élévation et génère des données enrichies
   * @param {Array} elevationData - Tableau de points d'élévation [distance, altitude]
   * @returns {Object} Données enrichies du profil
   */
  analyzeProfile(elevationData) {
    if (!elevationData || !Array.isArray(elevationData) || elevationData.length < 2) {
      throw new Error('Données d\'élévation invalides');
    }
    
    // Calcul des indicateurs de base
    const maxElevation = Math.max(...elevationData.map(point => point[1]));
    const minElevation = Math.min(...elevationData.map(point => point[1]));
    const totalElevationGain = this._calculateElevationGain(elevationData);
    const totalDistance = elevationData[elevationData.length - 1][0] - elevationData[0][0];
    const averageGradient = (totalElevationGain / totalDistance) * 100;
    
    // Recherche du pourcentage maximum
    const gradientsBySegment = this._calculateSegmentGradients(elevationData);
    const maxGradient = Math.max(...gradientsBySegment.map(segment => segment.gradient));
    const maxGradientSegment = gradientsBySegment.find(segment => segment.gradient === maxGradient);
    
    // Identification des sections clés
    const keySegments = this._identifyKeySegments(gradientsBySegment);
    
    // Segmentation par difficulté
    const segmentsByDifficulty = this._segmentByDifficulty(gradientsBySegment);
    
    return {
      summary: {
        maxElevation,
        minElevation,
        totalElevationGain,
        totalDistance,
        averageGradient,
        maxGradient,
        maxGradientLocation: maxGradientSegment ? maxGradientSegment.startDistance : null,
        maxGradientLength: maxGradientSegment ? maxGradientSegment.length : null
      },
      keySegments,
      segmentsByDifficulty,
      difficultyScore: this._calculateDifficultyScore(elevationData, gradientsBySegment),
      comparisonUCI: this._compareToUCIScale(maxGradient, averageGradient, totalDistance)
    };
  }
  
  /**
   * Calcule le gain total d'élévation (uniquement montées)
   * @param {Array} elevationData - Tableau de points d'élévation
   * @returns {number} Gain d'élévation total en mètres
   * @private
   */
  _calculateElevationGain(elevationData) {
    let gain = 0;
    for (let i = 1; i < elevationData.length; i++) {
      const elevationDiff = elevationData[i][1] - elevationData[i-1][1];
      if (elevationDiff > 0) {
        gain += elevationDiff;
      }
    }
    return gain;
  }
  
  /**
   * Calcule le pourcentage de pente pour chaque segment du profil
   * @param {Array} elevationData - Tableau de points d'élévation
   * @returns {Array} Tableau d'objets segment avec gradient
   * @private
   */
  _calculateSegmentGradients(elevationData) {
    const segments = [];
    const segmentSize = 0.5; // Taille de segment en km
    
    for (let i = 0; i < elevationData.length - 1; i++) {
      const startDistance = elevationData[i][0];
      const startElevation = elevationData[i][1];
      
      // Cherche le point de fin du segment (environ segmentSize km plus loin)
      let j = i + 1;
      while (j < elevationData.length && elevationData[j][0] - startDistance < segmentSize) {
        j++;
      }
      
      // Si on a atteint la fin des données avant la taille souhaitée, prendre le dernier point
      if (j >= elevationData.length) {
        j = elevationData.length - 1;
      }
      
      const endDistance = elevationData[j][0];
      const endElevation = elevationData[j][1];
      
      const horizontalDistance = endDistance - startDistance;
      
      // Éviter division par zéro
      if (horizontalDistance > 0) {
        const elevationChange = endElevation - startElevation;
        const gradient = (elevationChange / horizontalDistance) * 100;
        
        segments.push({
          startDistance,
          endDistance,
          length: horizontalDistance,
          startElevation,
          endElevation,
          gradient: parseFloat(gradient.toFixed(1))
        });
      }
      
      // Avancer au prochain segment
      i = j - 1;
    }
    
    return segments;
  }
  
  /**
   * Identifie les sections clés du profil (pentes raides, sections longues, etc.)
   * @param {Array} gradientsBySegment - Segments avec gradients
   * @returns {Array} Sections clés identifiées
   * @private
   */
  _identifyKeySegments(gradientsBySegment) {
    const keySegments = [];
    
    // Identifier les segments avec pente > 8%
    const steepSegments = gradientsBySegment.filter(segment => segment.gradient > 8);
    
    // Regrouper les segments raides consécutifs
    let currentGroup = [];
    for (let i = 0; i < steepSegments.length; i++) {
      const currentSegment = steepSegments[i];
      
      if (currentGroup.length === 0) {
        currentGroup.push(currentSegment);
        continue;
      }
      
      const lastSegment = currentGroup[currentGroup.length - 1];
      
      // Si les segments sont consécutifs (ou très proches)
      if (Math.abs(currentSegment.startDistance - lastSegment.endDistance) < 0.1) {
        currentGroup.push(currentSegment);
      } else {
        // Traiter le groupe actuel s'il est assez long
        this._processKeySegmentGroup(currentGroup, keySegments);
        currentGroup = [currentSegment];
      }
    }
    
    // Traiter le dernier groupe
    this._processKeySegmentGroup(currentGroup, keySegments);
    
    return keySegments;
  }
  
  /**
   * Traite un groupe de segments pour déterminer s'il constitue une section clé
   * @param {Array} group - Groupe de segments
   * @param {Array} keySegments - Tableau de sections clés à remplir
   * @private
   */
  _processKeySegmentGroup(group, keySegments) {
    if (group.length === 0) return;
    
    // Calculer la longueur totale du groupe
    const groupLength = group.reduce((sum, segment) => sum + segment.length, 0);
    
    // Calculer le gradient moyen du groupe
    const totalElevation = group[group.length - 1].endElevation - group[0].startElevation;
    const avgGradient = (totalElevation / groupLength) * 100;
    
    // Si le groupe est assez long (> 1km) ou très raide (> 10%)
    if (groupLength > 1 || avgGradient > 10) {
      keySegments.push({
        startDistance: group[0].startDistance,
        endDistance: group[group.length - 1].endDistance,
        length: groupLength,
        avgGradient: parseFloat(avgGradient.toFixed(1)),
        maxGradient: Math.max(...group.map(segment => segment.gradient)),
        elevationGain: totalElevation,
        type: avgGradient > 10 ? 'section très difficile' : 'section difficile'
      });
    }
  }
  
  /**
   * Segmente le profil par niveaux de difficulté
   * @param {Array} gradientsBySegment - Segments avec gradients
   * @returns {Object} Segments groupés par niveau de difficulté
   * @private
   */
  _segmentByDifficulty(gradientsBySegment) {
    // Définition des niveaux de difficulté
    const difficultyLevels = {
      easy: { min: 0, max: 4, color: '#4CAF50', segments: [] },
      moderate: { min: 4, max: 7, color: '#FFC107', segments: [] },
      difficult: { min: 7, max: 10, color: '#FF9800', segments: [] },
      veryDifficult: { min: 10, max: 15, color: '#F44336', segments: [] },
      extreme: { min: 15, max: 100, color: '#9C27B0', segments: [] }
    };
    
    // Classer chaque segment
    gradientsBySegment.forEach(segment => {
      if (segment.gradient <= difficultyLevels.easy.max) {
        difficultyLevels.easy.segments.push(segment);
      } else if (segment.gradient <= difficultyLevels.moderate.max) {
        difficultyLevels.moderate.segments.push(segment);
      } else if (segment.gradient <= difficultyLevels.difficult.max) {
        difficultyLevels.difficult.segments.push(segment);
      } else if (segment.gradient <= difficultyLevels.veryDifficult.max) {
        difficultyLevels.veryDifficult.segments.push(segment);
      } else {
        difficultyLevels.extreme.segments.push(segment);
      }
    });
    
    // Calculer les statistiques pour chaque niveau
    Object.keys(difficultyLevels).forEach(level => {
      const segments = difficultyLevels[level].segments;
      difficultyLevels[level].totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
      difficultyLevels[level].percentage = gradientsBySegment.length > 0 
        ? (segments.length / gradientsBySegment.length) * 100 
        : 0;
    });
    
    return difficultyLevels;
  }
  
  /**
   * Calcule un score de difficulté personnalisé (échelle 0-100)
   * @param {Array} elevationData - Données d'élévation brutes
   * @param {Array} gradientsBySegment - Segments analysés
   * @returns {Object} Score et catégorie de difficulté
   * @private
   */
  _calculateDifficultyScore(elevationData, gradientsBySegment) {
    // Facteurs pour le calcul de difficulté
    const lengthFactor = 0.2;      // 20% pour la longueur
    const elevationFactor = 0.35;  // 35% pour le dénivelé total
    const gradientFactor = 0.45;   // 45% pour les pourcentages de pente
    
    // Calculs des composantes
    const totalDistance = elevationData[elevationData.length - 1][0] - elevationData[0][0];
    const distanceScore = Math.min(totalDistance / 25, 1); // Normalisé à 25km max
    
    const totalElevation = this._calculateElevationGain(elevationData);
    const elevationScore = Math.min(totalElevation / 2000, 1); // Normalisé à 2000m max
    
    // Score basé sur les pentes
    let gradientScore = 0;
    if (gradientsBySegment.length > 0) {
      // Pondération: pentes fortes plus importantes
      const steepSegmentsRatio = gradientsBySegment.filter(s => s.gradient > 7).length / gradientsBySegment.length;
      const verysteepSegmentsRatio = gradientsBySegment.filter(s => s.gradient > 10).length / gradientsBySegment.length;
      const maxGradient = Math.max(...gradientsBySegment.map(s => s.gradient));
      
      // Normalisation du gradient maximum (15% considéré comme maximum)
      const normalizedMaxGradient = Math.min(maxGradient / 15, 1);
      
      gradientScore = (steepSegmentsRatio * 0.3) + (verysteepSegmentsRatio * 0.4) + (normalizedMaxGradient * 0.3);
    }
    
    // Score global (0-100)
    const rawScore = (distanceScore * lengthFactor + 
                      elevationScore * elevationFactor + 
                      gradientScore * gradientFactor) * 100;
    
    const score = Math.round(rawScore);
    
    // Catégorisation
    let category;
    if (score < 25) category = 'Facile';
    else if (score < 50) category = 'Modéré';
    else if (score < 75) category = 'Difficile';
    else if (score < 90) category = 'Très difficile';
    else category = 'Extrême';
    
    return {
      score,
      category,
      components: {
        distance: Math.round(distanceScore * 100),
        elevation: Math.round(elevationScore * 100),
        gradient: Math.round(gradientScore * 100)
      }
    };
  }
  
  /**
   * Compare le col à l'échelle de difficulté UCI
   * @param {number} maxGradient - Pourcentage maximum
   * @param {number} averageGradient - Pourcentage moyen
   * @param {number} length - Longueur totale
   * @returns {Object} Comparaison à l'échelle UCI
   * @private
   */
  _compareToUCIScale(maxGradient, averageGradient, length) {
    // Catégories UCI: HC, 1, 2, 3, 4
    let uciCategory;
    
    if (length > 15 && averageGradient > 7) {
      uciCategory = 'HC';
    } else if (length > 10 && averageGradient > 6) {
      uciCategory = '1';
    } else if (length > 5 && averageGradient > 5) {
      uciCategory = '2';
    } else if (length > 3 && averageGradient > 4) {
      uciCategory = '3';
    } else {
      uciCategory = '4';
    }
    
    return {
      category: uciCategory,
      description: this._getUCICategoryDescription(uciCategory)
    };
  }
  
  /**
   * Retourne la description d'une catégorie UCI
   * @param {string} category - Catégorie UCI
   * @returns {string} Description
   * @private
   */
  _getUCICategoryDescription(category) {
    switch (category) {
      case 'HC':
        return 'Hors Catégorie - Les cols les plus difficiles';
      case '1':
        return 'Catégorie 1 - Cols très difficiles';
      case '2':
        return 'Catégorie 2 - Cols difficiles';
      case '3':
        return 'Catégorie 3 - Cols modérément difficiles';
      case '4':
        return 'Catégorie 4 - Cols faciles';
      default:
        return 'Non catégorisé';
    }
  }
  
  /**
   * Récupère les données météo historiques pour un col
   * @param {number} latitude - Latitude du col
   * @param {number} longitude - Longitude du col
   * @returns {Promise<Object>} Données météo historiques par mois
   */
  async getHistoricalWeather(latitude, longitude) {
    try {
      // Utilisation d'une API météo pour récupérer les normales mensuelles
      // Note: dans un environnement de production, il faudrait utiliser une vraie API
      //       comme Meteomatics, Visual Crossing ou OpenWeatherMap avec plans historiques
      
      // Simulation de données historiques
      const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ];
      
      // Générer des données sensibles en fonction de l'altitude basée sur lat/long
      // Plus on monte en latitude ou en altitude, plus il fait froid
      const altitude = await this._getAltitude(latitude, longitude);
      
      // Simulation de données climatiques
      const weatherData = months.map((month, index) => {
        // Les températures varient selon le mois et l'altitude
        const baseTempC = [5, 6, 10, 14, 18, 22, 25, 24, 20, 15, 10, 6][index]; // Base pour niveau de la mer
        const altitudeFactor = altitude / 100 * 0.65; // -0.65°C par 100m d'altitude
        const avgTempC = Math.round((baseTempC - altitudeFactor) * 10) / 10;
        
        // Précipitations
        // Plus élevées en montagne et à certaines saisons
        const baseRain = [80, 70, 65, 60, 70, 60, 50, 60, 70, 85, 90, 85][index];
        const rainFactor = 1 + (altitude / 1000); // Plus de pluie/neige en altitude
        const precipitation = Math.round(baseRain * rainFactor);
        
        // Jours de pluie
        const rainyDays = Math.round(precipitation / 8);
        
        // Vents - plus forts en altitude et en hiver/automne
        const windFactor = 1 + (altitude / 1000);
        const seasonFactor = [1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2][index];
        const avgWindKph = Math.round(15 * windFactor * seasonFactor);
        
        // Ensoleillement
        const sunshineHours = [3, 4, 5, 6, 8, 9, 10, 9, 7, 5, 3, 3][index];
        
        return {
          month,
          weather: {
            avgTempC,
            minTempC: Math.round((avgTempC - 5) * 10) / 10,
            maxTempC: Math.round((avgTempC + 5) * 10) / 10,
            precipitation, // mm
            rainyDays,
            snowDays: avgTempC < 3 ? Math.round(rainyDays * 0.7) : 0,
            avgWindKph,
            sunshineHours
          },
          cyclingSuitability: this._calculateCyclingSuitability(avgTempC, precipitation, avgWindKph)
        };
      });
      
      // Identifier les meilleures périodes pour le cyclisme
      const bestMonths = weatherData
        .filter(data => data.cyclingSuitability.score >= 70)
        .map(data => data.month);
      
      return {
        monthlyData: weatherData,
        bestMonths,
        unsuitable: weatherData
          .filter(data => data.cyclingSuitability.score < 40)
          .map(data => data.month)
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données météo historiques:', error);
      throw error;
    }
  }
  
  /**
   * Récupère l'altitude à partir des coordonnées
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @returns {Promise<number>} Altitude en mètres
   * @private
   */
  async _getAltitude(latitude, longitude) {
    try {
      // En production, utiliser un service comme OpenElevation ou Google Elevation API
      // Ici, simulation en fonction de la latitude
      return 1000 + Math.abs(latitude - 45) * 100;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'altitude:', error);
      return 500; // Valeur par défaut
    }
  }
  
  /**
   * Calcule un score de compatibilité pour le cyclisme
   * @param {number} avgTemp - Température moyenne
   * @param {number} precipitation - Précipitations
   * @param {number} windSpeed - Vitesse du vent
   * @returns {Object} Score et description
   * @private
   */
  _calculateCyclingSuitability(avgTemp, precipitation, windSpeed) {
    // Idéal: 15-25°C, <50mm précipitations, <15km/h vent
    let tempScore = 0;
    if (avgTemp >= 15 && avgTemp <= 25) {
      tempScore = 100;
    } else if (avgTemp >= 10 && avgTemp < 15) {
      tempScore = 80;
    } else if (avgTemp > 25 && avgTemp <= 30) {
      tempScore = 70;
    } else if (avgTemp >= 5 && avgTemp < 10) {
      tempScore = 60;
    } else if (avgTemp > 30 && avgTemp <= 35) {
      tempScore = 40;
    } else if (avgTemp >= 0 && avgTemp < 5) {
      tempScore = 30;
    } else {
      tempScore = 0; // Trop froid ou trop chaud
    }
    
    let precipScore = 0;
    if (precipitation <= 30) {
      precipScore = 100;
    } else if (precipitation <= 60) {
      precipScore = 80;
    } else if (precipitation <= 90) {
      precipScore = 60;
    } else if (precipitation <= 120) {
      precipScore = 40;
    } else if (precipitation <= 150) {
      precipScore = 20;
    } else {
      precipScore = 0;
    }
    
    let windScore = 0;
    if (windSpeed <= 10) {
      windScore = 100;
    } else if (windSpeed <= 15) {
      windScore = 90;
    } else if (windSpeed <= 20) {
      windScore = 70;
    } else if (windSpeed <= 25) {
      windScore = 50;
    } else if (windSpeed <= 30) {
      windScore = 30;
    } else {
      windScore = 0;
    }
    
    // Moyenne pondérée
    const score = Math.round(tempScore * 0.4 + precipScore * 0.4 + windScore * 0.2);
    
    // Description
    let description;
    if (score >= 80) {
      description = 'Conditions idéales pour le cyclisme';
    } else if (score >= 70) {
      description = 'Très bonnes conditions';
    } else if (score >= 60) {
      description = 'Bonnes conditions';
    } else if (score >= 50) {
      description = 'Conditions acceptables';
    } else if (score >= 40) {
      description = 'Conditions médiocres';
    } else if (score >= 20) {
      description = 'Conditions difficiles';
    } else {
      description = 'Conditions déconseillées';
    }
    
    return {
      score,
      description
    };
  }
}

module.exports = new ElevationProfileModel();
