/**
 * Service de validation des données pour l'intégration entre modules
 * Assure l'intégrité et la cohérence des données entre les différents services
 */

class DataValidator {
  /**
   * Valide un profil nutritionnel
   * @param {Object} nutritionProfile - Profil nutritionnel à valider
   * @returns {Object} Résultat de la validation avec erreurs éventuelles
   */
  validateNutritionProfile(nutritionProfile) {
    const errors = [];
    const warnings = [];
    
    // Vérifier les champs obligatoires
    if (!nutritionProfile) {
      errors.push('Profil nutritionnel manquant');
      return { isValid: false, errors, warnings };
    }
    
    // Vérifier les métriques de base
    if (!nutritionProfile.metrics) {
      errors.push('Métriques utilisateur manquantes');
    } else {
      const { weight, height, age } = nutritionProfile.metrics;
      
      if (!weight) warnings.push('Poids non spécifié');
      if (!height) warnings.push('Taille non spécifiée');
      if (!age) warnings.push('Âge non spécifié');
      
      // Vérifier que les valeurs sont dans des plages raisonnables
      if (weight && (weight < 30 || weight > 200)) {
        warnings.push(`Poids suspect: ${weight} kg`);
      }
      
      if (height && (height < 120 || height > 220)) {
        warnings.push(`Taille suspecte: ${height} cm`);
      }
      
      if (age && (age < 12 || age > 100)) {
        warnings.push(`Âge suspect: ${age} ans`);
      }
    }
    
    // Vérifier les objectifs nutritionnels
    if (!nutritionProfile.goals) {
      warnings.push('Objectifs nutritionnels non définis');
    } else {
      const validGoalTypes = ['performance', 'weightLoss', 'maintenance', 'muscle', 'recovery'];
      if (!validGoalTypes.includes(nutritionProfile.goals.type)) {
        warnings.push(`Type d'objectif non reconnu: ${nutritionProfile.goals.type}`);
      }
    }
    
    // Vérifier l'apport calorique
    if (nutritionProfile.dailyCalories) {
      if (nutritionProfile.dailyCalories < 1200 || nutritionProfile.dailyCalories > 6000) {
        warnings.push(`Apport calorique suspect: ${nutritionProfile.dailyCalories} kcal`);
      }
    } else {
      warnings.push('Apport calorique quotidien non défini');
    }
    
    // Vérifier la répartition des macronutriments
    if (nutritionProfile.macroDistribution) {
      const { carbs, protein, fat } = nutritionProfile.macroDistribution;
      const total = (carbs || 0) + (protein || 0) + (fat || 0);
      
      if (Math.abs(total - 100) > 2) { // Tolérance de 2%
        warnings.push(`Répartition des macros incorrecte (total: ${total}%)`);
      }
    } else {
      warnings.push('Répartition des macronutriments non définie');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      data: nutritionProfile
    };
  }

  /**
   * Valide un plan d'entraînement
   * @param {Object} trainingPlan - Plan d'entraînement à valider
   * @returns {Object} Résultat de la validation avec erreurs éventuelles
   */
  validateTrainingPlan(trainingPlan) {
    const errors = [];
    const warnings = [];
    
    // Vérifier les champs obligatoires
    if (!trainingPlan) {
      errors.push('Plan d\'entraînement manquant');
      return { isValid: false, errors, warnings };
    }
    
    // Vérifier l'utilisateur associé
    if (!trainingPlan.userId) {
      errors.push('ID utilisateur manquant dans le plan d\'entraînement');
    }
    
    // Vérifier les entraînements
    if (!trainingPlan.workouts || !Array.isArray(trainingPlan.workouts)) {
      errors.push('Liste d\'entraînements manquante ou invalide');
    } else if (trainingPlan.workouts.length === 0) {
      warnings.push('Plan d\'entraînement vide');
    } else {
      // Vérifier chaque entraînement
      trainingPlan.workouts.forEach((workout, index) => {
        if (!workout.id) {
          warnings.push(`Entraînement #${index + 1} sans identifiant`);
        }
        
        if (!workout.type) {
          warnings.push(`Entraînement #${index + 1} sans type défini`);
        }
        
        if (!workout.plannedDuration) {
          warnings.push(`Entraînement #${index + 1} sans durée planifiée`);
        } else if (workout.plannedDuration > 600) { // 10 heures max
          warnings.push(`Durée d'entraînement suspecte: ${workout.plannedDuration} minutes`);
        }
      });
    }
    
    // Vérifier l'objectif d'entraînement
    if (!trainingPlan.goal) {
      warnings.push('Objectif d\'entraînement non défini');
    } else {
      const validGoals = ['performance', 'endurance', 'strength', 'weightLoss', 'recovery', 'maintenance'];
      if (!validGoals.includes(trainingPlan.goal)) {
        warnings.push(`Objectif d'entraînement non reconnu: ${trainingPlan.goal}`);
      }
    }
    
    // Vérifier les métriques d'entraînement
    if (trainingPlan.metrics) {
      if (trainingPlan.metrics.ftp) {
        if (trainingPlan.metrics.ftp < 50 || trainingPlan.metrics.ftp > 500) {
          warnings.push(`FTP suspect: ${trainingPlan.metrics.ftp} watts`);
        }
      }
      
      if (trainingPlan.metrics.maxHR) {
        if (trainingPlan.metrics.maxHR < 120 || trainingPlan.metrics.maxHR > 220) {
          warnings.push(`FC max suspecte: ${trainingPlan.metrics.maxHR} bpm`);
        }
      }
    } else {
      warnings.push('Métriques d\'entraînement non définies');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      data: trainingPlan
    };
  }

  /**
   * Valide la compatibilité entre un profil nutritionnel et un plan d'entraînement
   * @param {Object} nutritionProfile - Profil nutritionnel
   * @param {Object} trainingPlan - Plan d'entraînement
   * @returns {Object} Résultat de la validation
   */
  validateCompatibility(nutritionProfile, trainingPlan) {
    const issues = [];
    const suggestions = [];
    
    // S'assurer que les deux objets existent
    if (!nutritionProfile || !trainingPlan) {
      return { 
        isCompatible: false, 
        issues: ['Données manquantes pour évaluer la compatibilité'],
        suggestions: []
      };
    }
    
    // Vérifier que les utilisateurs correspondent
    if (nutritionProfile.userId && trainingPlan.userId && 
        nutritionProfile.userId !== trainingPlan.userId) {
      issues.push('Les profils ne concernent pas le même utilisateur');
      return { isCompatible: false, issues, suggestions };
    }
    
    // Vérifier la compatibilité des objectifs
    if (nutritionProfile.goals && trainingPlan.goal) {
      const nutritionGoal = nutritionProfile.goals.type;
      const trainingGoal = trainingPlan.goal;
      
      // Détection d'incompatibilités entre objectifs
      if (nutritionGoal === 'weightLoss' && trainingGoal === 'performance') {
        issues.push('Incompatibilité: objectif perte de poids avec plan performance');
        suggestions.push('Ajuster l\'apport calorique pour maintenir les performances tout en perdant du poids plus lentement');
      }
      
      if (nutritionGoal === 'muscle' && trainingGoal === 'endurance') {
        issues.push('Incompatibilité: objectif prise de muscle avec plan endurance');
        suggestions.push('Augmenter l\'apport protéique pour compenser le volume d\'entraînement endurance');
      }
    }
    
    // Vérifier l'équilibre calorique
    if (nutritionProfile.dailyCalories && trainingPlan.workouts) {
      const dailyCalories = nutritionProfile.dailyCalories;
      
      // Calculer la dépense énergétique estimée des entraînements
      const weeklyWorkouts = trainingPlan.workouts.length;
      const averageWorkoutCalories = trainingPlan.workouts.reduce((sum, workout) => 
        sum + (workout.estimatedCalories || 0), 0) / weeklyWorkouts || 0;
      
      // Estimation des calories quotidiennes brûlées par les entraînements
      const dailyTrainingCalories = (averageWorkoutCalories * weeklyWorkouts) / 7;
      
      // Vérifier l'équilibre selon l'objectif
      if (trainingPlan.goal === 'performance' && dailyCalories < dailyTrainingCalories + 500) {
        issues.push('Apport calorique potentiellement insuffisant pour le volume d\'entraînement');
        suggestions.push(`Considérer une augmentation de l'apport calorique d'au moins ${Math.round(dailyTrainingCalories + 500 - dailyCalories)} kcal/jour`);
      }
      
      if (trainingPlan.goal === 'weightLoss' && dailyCalories > dailyTrainingCalories + 200) {
        issues.push('Apport calorique trop élevé pour l\'objectif de perte de poids');
        suggestions.push(`Considérer une réduction de l'apport calorique d'environ ${Math.round(dailyCalories - (dailyTrainingCalories + 200))} kcal/jour`);
      }
    }
    
    // Vérifier l'adéquation des macronutriments
    if (nutritionProfile.macroDistribution && trainingPlan.goal) {
      const { carbs, protein, fat } = nutritionProfile.macroDistribution;
      
      // Recommandations générales selon le type d'entraînement
      switch (trainingPlan.goal) {
        case 'endurance':
          if (carbs < 55) {
            issues.push('Apport en glucides insuffisant pour un plan endurance');
            suggestions.push(`Augmenter les glucides à au moins 55-65% de l'apport calorique total`);
          }
          break;
        case 'strength':
          if (protein < 25) {
            issues.push('Apport en protéines insuffisant pour un plan force/puissance');
            suggestions.push(`Augmenter les protéines à au moins 25-30% de l'apport calorique total`);
          }
          break;
        case 'recovery':
          if (protein < 20 || carbs < 50) {
            issues.push('Répartition des macros sous-optimale pour la récupération');
            suggestions.push('Assurer un bon équilibre protéines (20-25%) et glucides (50-60%) pour optimiser la récupération');
          }
          break;
      }
    }
    
    // Vérifier l'hydratation
    if (nutritionProfile.hydrationNeeds && trainingPlan.workouts) {
      const highIntensityWorkouts = trainingPlan.workouts.filter(w => 
        w.type === 'interval' || w.type === 'threshold' || w.type === 'vo2max').length;
      
      if (highIntensityWorkouts > 2 && (!nutritionProfile.hydrationNeeds.workoutDayExtra || 
          nutritionProfile.hydrationNeeds.workoutDayExtra < 750)) {
        suggestions.push('Augmenter l\'hydratation les jours d\'entraînement intense (au moins 750ml supplémentaires)');
      }
    }
    
    return {
      isCompatible: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Valide les recommandations nutritionnelles pour un entraînement
   * @param {Object} workout - Détails de l'entraînement
   * @param {Object} recommendations - Recommandations nutritionnelles
   * @returns {Object} Résultat de la validation
   */
  validateWorkoutRecommendations(workout, recommendations) {
    const errors = [];
    const warnings = [];
    
    if (!workout || !recommendations) {
      errors.push('Données insuffisantes pour valider les recommandations');
      return { isValid: false, errors, warnings };
    }
    
    // Vérifier la structure des recommandations
    const requiredTypes = ['pre', 'during', 'post'];
    
    for (const type of requiredTypes) {
      if (!recommendations[type]) {
        errors.push(`Recommandations pour la phase "${type}" manquantes`);
      } else {
        // Vérifier les données nutritionnelles de base
        const rec = recommendations[type];
        
        if (!rec.calories && type !== 'during') {
          warnings.push(`Calories non spécifiées pour la phase "${type}"`);
        }
        
        if (!rec.carbs) {
          warnings.push(`Glucides non spécifiés pour la phase "${type}"`);
        }
        
        if (!rec.hydration) {
          warnings.push(`Hydratation non spécifiée pour la phase "${type}"`);
        }
        
        // Vérifier la cohérence avec le type d'entraînement
        const workoutDuration = workout.plannedDuration || 0;
        
        if (type === 'during' && workoutDuration < 60 && rec.calories > 0) {
          warnings.push('Apport calorique pendant l\'effort non nécessaire pour un entraînement court');
        }
        
        if (type === 'during' && workoutDuration > 180 && (!rec.carbs || rec.carbs < 40)) {
          warnings.push('Apport en glucides insuffisant pendant un effort long');
        }
        
        if (type === 'post' && workout.type === 'interval' && (!rec.protein || rec.protein < 20)) {
          warnings.push('Apport en protéines post-entraînement insuffisant après un entraînement intense');
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      data: recommendations
    };
  }
}

export default new DataValidator();
