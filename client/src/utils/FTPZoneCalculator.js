/**
 * Calculateur optimisé de zones FTP (Functional Threshold Power)
 * Gère les valeurs extrêmes et différents modèles de zones d'entraînement
 */

class FTPZoneCalculator {
  constructor() {
    // Limites min et max pour validation FTP
    this.MIN_FTP = 50;   // Valeur minimale raisonnable
    this.MAX_FTP = 500;  // Valeur maximale raisonnable pour la plupart des cyclistes
    this.SUPER_MAX_FTP = 700; // Valeur maximale absolue (pros, champions mondiaux)
    
    // Modèles de zones disponibles
    this.zoneModels = {
      coggan: 'coggan',    // Modèle classique à 7 zones de Coggan
      seiler: 'seiler',    // Modèle 3 zones de Seiler
      british: 'british',  // Modèle 6 zones British Cycling
      custom: 'custom'     // Modèle personnalisé
    };
    
    // Modèle par défaut
    this.defaultModel = this.zoneModels.coggan;
  }

  /**
   * Valide et normalise une valeur FTP
   * @param {number} ftp - Valeur FTP à valider
   * @param {Object} userProfile - Profil utilisateur pour estimation alternative
   * @returns {number} - Valeur FTP validée
   */
  validateFTP(ftp, userProfile = {}) {
    if (!ftp || typeof ftp !== 'number' || isNaN(ftp)) {
      console.warn('FTP invalide, estimation basée sur le profil');
      return this._estimateFTPFromProfile(userProfile);
    }
    
    // Gestion des valeurs extrêmes basses
    if (ftp < this.MIN_FTP) {
      console.warn(`FTP trop basse (${ftp}W), ajustée au minimum: ${this.MIN_FTP}W`);
      return this.MIN_FTP;
    }
    
    // Gestion des valeurs extrêmes hautes
    if (ftp > this.SUPER_MAX_FTP) {
      console.warn(`FTP potentiellement érronée (${ftp}W), limitée à: ${this.SUPER_MAX_FTP}W`);
      return this.SUPER_MAX_FTP;
    }
    
    // Avertissement pour valeurs élevées mais possibles
    if (ftp > this.MAX_FTP) {
      console.warn(`FTP très élevée détectée (${ftp}W). Valeurs >500W typiques uniquement pour cyclistes élites/pros.`);
    }
    
    return ftp;
  }

  /**
   * Estime la FTP en fonction du profil utilisateur
   * @param {Object} userProfile - Profil utilisateur
   * @returns {number} - FTP estimée
   * @private
   */
  _estimateFTPFromProfile(userProfile) {
    const { weight, gender, level, age } = userProfile;
    
    // Valeurs par défaut si profil incomplet
    if (!weight || typeof weight !== 'number' || weight <= 0) {
      const defaultFTP = {
        beginner: 150,
        intermediate: 200,
        advanced: 250,
        elite: 300
      }[level] || 200;
      
      console.info(`Profil incomplet. FTP par défaut: ${defaultFTP}W`);
      return defaultFTP;
    }
    
    // Coefficients watts/kg selon niveau et genre
    const ftpMultipliers = {
      beginner: { male: 2.0, female: 1.8 },
      intermediate: { male: 2.8, female: 2.5 },
      advanced: { male: 3.5, female: 3.2 },
      elite: { male: 4.5, female: 4.0 }
    };
    
    // Déterminer le niveau et le genre
    const userLevel = level && ftpMultipliers[level] ? level : 'intermediate';
    const userGender = gender === 'female' ? 'female' : 'male';
    
    // Calculer FTP estimée
    const multiplier = ftpMultipliers[userLevel][userGender];
    const estimatedFTP = Math.round(weight * multiplier);
    
    // Appliquer ajustement lié à l'âge si disponible
    let ageFactor = 1;
    if (age && typeof age === 'number' && age > 0) {
      if (age > 35) {
        // Réduction progressive après 35 ans (environ 0.5% par an)
        ageFactor = 1 - ((age - 35) * 0.005);
      } else if (age < 20) {
        // Réduction pour les très jeunes
        ageFactor = 0.9 + ((age - 15) * 0.02);
      }
      
      // Limite les ajustements extrêmes
      ageFactor = Math.max(0.8, Math.min(1, ageFactor));
    }
    
    const finalFTP = Math.round(estimatedFTP * ageFactor);
    console.info(`FTP estimée: ${finalFTP}W (${finalFTP/weight} W/kg)`);
    
    return finalFTP;
  }

  /**
   * Calcule toutes les zones d'entraînement selon un modèle choisi
   * @param {number} ftp - Valeur FTP
   * @param {string} model - Modèle de zones (coggan, seiler, british, custom)
   * @param {Object} customParams - Paramètres personnalisés (pour modèle custom)
   * @returns {Object} - Zones calculées
   */
  calculateZones(ftp, model = this.defaultModel, customParams = null) {
    // Valider FTP
    const validFTP = this.validateFTP(ftp);
    
    // Sélectionner la fonction de calcul selon le modèle
    switch(model) {
      case this.zoneModels.seiler:
        return this._calculateSeilerZones(validFTP);
      case this.zoneModels.british:
        return this._calculateBritishCyclingZones(validFTP);
      case this.zoneModels.custom:
        return this._calculateCustomZones(validFTP, customParams);
      case this.zoneModels.coggan:
      default:
        return this._calculateCogganZones(validFTP);
    }
  }

  /**
   * Calcule les zones selon le modèle Coggan (7 zones)
   * @param {number} ftp - Valeur FTP
   * @returns {Object} - Zones calculées
   * @private
   */
  _calculateCogganZones(ftp) {
    return {
      model: 'Coggan (7 zones)',
      ftp,
      zones: [
        {
          zone: 1,
          name: 'Récupération Active',
          description: 'Très facile, récupération',
          percentFTP: { min: 0, max: 55 },
          wattsRange: { min: 0, max: Math.round(ftp * 0.55) },
          hrRange: { min: 0, max: 68 }, // % de FCmax
          trainingBenefit: 'Récupération, augmentation du flux sanguin',
          rpe: '1-2/10'
        },
        {
          zone: 2,
          name: 'Endurance',
          description: 'Effort prolongé confortable',
          percentFTP: { min: 56, max: 75 },
          wattsRange: { min: Math.round(ftp * 0.56), max: Math.round(ftp * 0.75) },
          hrRange: { min: 69, max: 83 },
          trainingBenefit: 'Endurance aérobie, économie, capillarisation',
          rpe: '2-3/10'
        },
        {
          zone: 3,
          name: 'Tempo',
          description: 'Effort soutenu, conversation difficile',
          percentFTP: { min: 76, max: 90 },
          wattsRange: { min: Math.round(ftp * 0.76), max: Math.round(ftp * 0.90) },
          hrRange: { min: 84, max: 94 },
          trainingBenefit: 'Amélioration du seuil anaérobie, endurance musculaire',
          rpe: '3-4/10'
        },
        {
          zone: 4,
          name: 'Seuil',
          description: 'Effort dur mais soutenable (40-60min)',
          percentFTP: { min: 91, max: 105 },
          wattsRange: { min: Math.round(ftp * 0.91), max: Math.round(ftp * 1.05) },
          hrRange: { min: 95, max: 105 },
          trainingBenefit: 'Augmentation de la FTP, tolérance au lactate',
          rpe: '4-6/10'
        },
        {
          zone: 5,
          name: 'VO2Max',
          description: 'Très dur, soutenable 3-8min',
          percentFTP: { min: 106, max: 120 },
          wattsRange: { min: Math.round(ftp * 1.06), max: Math.round(ftp * 1.20) },
          hrRange: { min: 106, max: 120 },
          trainingBenefit: 'Puissance aérobie maximale, capacité cardiaque',
          rpe: '7-8/10'
        },
        {
          zone: 6,
          name: 'Capacité Anaérobie',
          description: 'Sprint court, 30s-2min',
          percentFTP: { min: 121, max: 150 },
          wattsRange: { min: Math.round(ftp * 1.21), max: Math.round(ftp * 1.50) },
          hrRange: { min: 121, max: 'Max' },
          trainingBenefit: 'Capacité anaérobie, tolérance au lactate élevée',
          rpe: '8-9/10'
        },
        {
          zone: 7,
          name: 'Puissance Neuromusculaire',
          description: 'Sprints maximaux <30s',
          percentFTP: { min: 151, max: 'Max' },
          wattsRange: { min: Math.round(ftp * 1.51), max: 'Max' },
          hrRange: { min: 'NA', max: 'NA' }, // Non applicable pour efforts courts
          trainingBenefit: 'Recrutement musculaire, coordination neuromusculaire',
          rpe: '10/10'
        }
      ]
    };
  }

  /**
   * Calcule les zones selon le modèle Seiler (3 zones)
   * @param {number} ftp - Valeur FTP
   * @returns {Object} - Zones calculées
   * @private
   */
  _calculateSeilerZones(ftp) {
    return {
      model: 'Seiler (3 zones)',
      ftp,
      zones: [
        {
          zone: 1,
          name: 'Basse Intensité',
          description: 'Effort facile à modéré',
          percentFTP: { min: 0, max: 85 },
          wattsRange: { min: 0, max: Math.round(ftp * 0.85) },
          hrRange: { min: 0, max: 87 },
          trainingBenefit: 'Endurance fondamentale, récupération',
          rpe: '1-3/10'
        },
        {
          zone: 2,
          name: 'Seuil',
          description: 'Entre les deux seuils ventilatoires',
          percentFTP: { min: 86, max: 100 },
          wattsRange: { min: Math.round(ftp * 0.86), max: Math.round(ftp * 1.00) },
          hrRange: { min: 88, max: 100 },
          trainingBenefit: 'Amélioration du seuil lactique',
          rpe: '4-6/10'
        },
        {
          zone: 3,
          name: 'Haute Intensité',
          description: 'Au-dessus du seuil respiratoire',
          percentFTP: { min: 101, max: 'Max' },
          wattsRange: { min: Math.round(ftp * 1.01), max: 'Max' },
          hrRange: { min: 101, max: 'Max' },
          trainingBenefit: 'Puissance aérobie et anaérobie maximale',
          rpe: '7-10/10'
        }
      ]
    };
  }

  /**
   * Calcule les zones selon le modèle British Cycling (6 zones)
   * @param {number} ftp - Valeur FTP
   * @returns {Object} - Zones calculées
   * @private
   */
  _calculateBritishCyclingZones(ftp) {
    return {
      model: 'British Cycling (6 zones)',
      ftp,
      zones: [
        {
          zone: 1,
          name: 'Récupération Active',
          description: 'Très facile, conversation normale',
          percentFTP: { min: 0, max: 60 },
          wattsRange: { min: 0, max: Math.round(ftp * 0.60) },
          hrRange: { min: 0, max: 72 },
          trainingBenefit: 'Récupération, développement technique',
          rpe: '1-2/10'
        },
        {
          zone: 2,
          name: 'Endurance',
          description: 'Effort prolongé contrôlé',
          percentFTP: { min: 61, max: 80 },
          wattsRange: { min: Math.round(ftp * 0.61), max: Math.round(ftp * 0.80) },
          hrRange: { min: 73, max: 86 },
          trainingBenefit: 'Endurance aérobie, adaptation métabolique',
          rpe: '3-4/10'
        },
        {
          zone: 3,
          name: 'Tempo',
          description: 'Effort soutenu, conversation limitée',
          percentFTP: { min: 81, max: 93 },
          wattsRange: { min: Math.round(ftp * 0.81), max: Math.round(ftp * 0.93) },
          hrRange: { min: 87, max: 94 },
          trainingBenefit: 'Endurance musculaire, approche du seuil',
          rpe: '5-6/10'
        },
        {
          zone: 4,
          name: 'Seuil Lactique',
          description: 'Juste sous le seuil, inconfortable mais soutenable',
          percentFTP: { min: 94, max: 105 },
          wattsRange: { min: Math.round(ftp * 0.94), max: Math.round(ftp * 1.05) },
          hrRange: { min: 95, max: 102 },
          trainingBenefit: 'Élévation du seuil lactique',
          rpe: '7/10'
        },
        {
          zone: 5,
          name: 'Capacité Aérobie',
          description: 'Intervalles soutenus 3-10min',
          percentFTP: { min: 106, max: 125 },
          wattsRange: { min: Math.round(ftp * 1.06), max: Math.round(ftp * 1.25) },
          hrRange: { min: 103, max: 'Max' },
          trainingBenefit: 'Développement du VO2max, capacité aérobie',
          rpe: '8-9/10'
        },
        {
          zone: 6,
          name: 'Capacité Anaérobie',
          description: 'Efforts courts maximaux',
          percentFTP: { min: 126, max: 'Max' },
          wattsRange: { min: Math.round(ftp * 1.26), max: 'Max' },
          hrRange: { min: 'NA', max: 'NA' },
          trainingBenefit: 'Puissance maximale, recrutement musculaire',
          rpe: '10/10'
        }
      ]
    };
  }

  /**
   * Calcule des zones personnalisées
   * @param {number} ftp - Valeur FTP
   * @param {Object} params - Paramètres personnalisés
   * @returns {Object} - Zones calculées
   * @private
   */
  _calculateCustomZones(ftp, params) {
    // Paramètres requis avec validation
    if (!params || !Array.isArray(params.zones) || params.zones.length === 0) {
      console.warn('Paramètres personnalisés invalides, utilisation du modèle Coggan');
      return this._calculateCogganZones(ftp);
    }
    
    // Créer structure de retour avec nom de modèle personnalisé
    return {
      model: params.modelName || 'Personnalisé',
      ftp,
      zones: params.zones.map(zone => {
        // Calcul des valeurs en watts basées sur les pourcentages
        const minWatts = zone.percentFTP.min === 'Max' 
          ? 'Max' 
          : Math.round(ftp * (zone.percentFTP.min / 100));
          
        const maxWatts = zone.percentFTP.max === 'Max' 
          ? 'Max' 
          : Math.round(ftp * (zone.percentFTP.max / 100));
          
        return {
          ...zone,
          wattsRange: { min: minWatts, max: maxWatts }
        };
      })
    };
  }

  /**
   * Calcule les apports caloriques optimaux pour chaque zone
   * @param {number} ftp - Valeur FTP
   * @param {number} weight - Poids en kg
   * @param {Object} options - Options additionnelles
   * @returns {Object} - Recommandations caloriques par zone
   */
  calculateCalorieRequirements(ftp, weight, options = {}) {
    const validFTP = this.validateFTP(ftp);
    
    // Validation du poids
    if (!weight || typeof weight !== 'number' || weight <= 0) {
      console.warn('Poids invalide pour le calcul calorique');
      weight = 70; // Valeur par défaut
    }
    
    // Calcul des zones standards
    const zones = this._calculateCogganZones(validFTP).zones;
    
    // Paramètres ajustables
    const efficiency = options.efficiency || 23; // % d'efficience énergétique typique
    const carbsPercentage = options.carbsPercentage || { // % de glucides par zone
      z1: 50, z2: 60, z3: 70, z4: 80, z5: 90, z6: 95, z7: 95
    };
    
    // Calculer les besoins pour chaque zone
    return zones.map(zone => {
      // Calculer puissance moyenne de la zone (watts)
      const zoneAvgWatts = (zone.wattsRange.min + 
                          (zone.wattsRange.max === 'Max' ? zone.wattsRange.min * 1.5 : zone.wattsRange.max)) / 2;
      
      // Convertir watts en calories/heure (3600s) avec efficience
      const wattsToKcal = (watts, hours) => (watts * 3.6 * hours) / (efficiency / 100);
      
      // Calculer calories/heure
      const caloriesPerHour = wattsToKcal(zoneAvgWatts, 1);
      
      // Calculer besoins en glucides (g/heure)
      // 1g de glucides = 4 kcal
      const carbsIndex = `z${zone.zone}`;
      const carbPercent = carbsPercentage[carbsIndex] || 70;
      const carbsPerHour = (caloriesPerHour * (carbPercent / 100)) / 4;
      
      // Calculer hydratation (ml/heure) - Formule simplifiée
      // Base: 500ml + ajustements selon intensité et poids
      const baseHydration = 500;
      const intensityFactor = zone.zone * 100;
      const weightFactor = weight * 4;
      const hydrationPerHour = baseHydration + intensityFactor + (weightFactor / 15);
      
      return {
        zone: zone.zone,
        name: zone.name,
        caloriesPerHour: Math.round(caloriesPerHour),
        carbsPerHour: Math.round(carbsPerHour),
        proteinPerHour: Math.round((caloriesPerHour * 0.1) / 4), // ~10% de protéines
        hydrationPerHour: Math.round(hydrationPerHour),
        recommendedFoods: this._getRecommendedFoods(zone.zone)
      };
    });
  }

  /**
   * Fournit des recommandations alimentaires selon la zone
   * @param {number} zoneNumber - Numéro de la zone
   * @returns {Array} - Aliments recommandés
   * @private
   */
  _getRecommendedFoods(zoneNumber) {
    // Recommandations par zone
    const recommendations = {
      1: [
        { name: 'Eau', type: 'hydration', portion: '500-700ml/h' },
        { name: 'Fruits frais', type: 'food', portion: 'Petite portion si nécessaire' }
      ],
      2: [
        { name: 'Eau + électrolytes', type: 'hydration', portion: '500-750ml/h' },
        { name: 'Barres énergétiques', type: 'food', portion: '1 toutes les 90min' },
        { name: 'Fruits secs', type: 'food', portion: 'Petite poignée/h' }
      ],
      3: [
        { name: 'Boisson isotonique', type: 'hydration', portion: '600-800ml/h' },
        { name: 'Barres énergétiques', type: 'food', portion: '1-2/h' },
        { name: 'Bananes', type: 'food', portion: '1/h' }
      ],
      4: [
        { name: 'Boisson isotonique', type: 'hydration', portion: '700-900ml/h' },
        { name: 'Gels énergétiques', type: 'food', portion: '1-2/h' },
        { name: 'Barres énergétiques', type: 'food', portion: '1/h' }
      ],
      5: [
        { name: 'Boisson isotonique + caféine', type: 'hydration', portion: '800-1000ml/h' },
        { name: 'Gels énergétiques', type: 'food', portion: '2-3/h' }
      ],
      6: [
        { name: 'Boisson isotonique + caféine', type: 'hydration', portion: 'Petites gorgées régulières' },
        { name: 'Gels énergétiques concentrés', type: 'food', portion: 'Selon durée des intervalles' }
      ],
      7: [
        { name: 'Hydratation entre efforts', type: 'hydration', portion: 'Selon besoin' },
        { name: 'Nutrition entre efforts', type: 'food', portion: 'Selon durée de récupération' }
      ]
    };
    
    return recommendations[zoneNumber] || recommendations[3];
  }
}

// Exporter une instance unique pour utilisation globale
const ftpZoneCalculator = new FTPZoneCalculator();
export default ftpZoneCalculator;
