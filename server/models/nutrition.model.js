/**
 * Modèle de données pour les informations nutritionnelles
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schéma pour les entrées de journal alimentaire
 */
const FoodJournalEntrySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  calories: {
    type: Number,
    required: true
  },
  macros: {
    carbs: {
      type: Number,
      required: true
    },
    protein: {
      type: Number,
      required: true
    },
    fat: {
      type: Number,
      required: true
    }
  },
  category: {
    type: String,
    enum: ['fruits', 'vegetables', 'protein', 'dairy', 'grains', 'processed', 'other'],
    default: 'other'
  },
  timing: {
    type: String,
    enum: ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack', 'during_exercise', 'post_exercise'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: String
});

/**
 * Schéma pour les préférences nutritionnelles de l'utilisateur
 */
const NutritionPreferencesSchema = new Schema({
  dietaryRestrictions: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'gluten_free', 'lactose_free', 'keto', 'paleo', 'none']
  }],
  allergies: [String],
  preferredFoods: [String],
  avoidedFoods: [String],
  mealFrequency: {
    type: Number,
    min: 2,
    max: 8,
    default: 3
  },
  preferredSupplements: [String]
});

/**
 * Schéma pour un plan nutritionnel personnalisé
 */
const PersonalizedNutritionPlanSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  basedOn: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  description: String,
  dailyCalories: Number,
  macronutrients: {
    carbs: String,
    protein: String,
    fat: String
  },
  dailyPlans: Schema.Types.Mixed,
  supplements: Schema.Types.Mixed,
  eventStrategies: Schema.Types.Mixed,
  personalizedNotes: [String],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

/**
 * Schéma principal pour les données nutritionnelles de l'utilisateur
 */
const NutritionDataSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  preferences: {
    type: NutritionPreferencesSchema,
    default: () => ({})
  },
  currentGoal: {
    type: String,
    enum: ['performance', 'weightLoss', 'recovery', 'maintenance'],
    default: 'maintenance'
  },
  foodJournal: [FoodJournalEntrySchema],
  plans: [PersonalizedNutritionPlanSchema],
  eventStrategies: [{
    eventId: String,
    eventName: String,
    eventDate: Date,
    strategy: Schema.Types.Mixed,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  nutritionalNeeds: {
    type: Schema.Types.Mixed,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Création d'index pour améliorer les performances des requêtes
NutritionDataSchema.index({ userId: 1, 'foodJournal.date': -1 });
NutritionDataSchema.index({ userId: 1, 'plans.isActive': 1 });

// Méthode pour calculer les statistiques nutritionnelles récentes
NutritionDataSchema.methods.getRecentStats = function(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const recentEntries = this.foodJournal.filter(entry => 
    new Date(entry.date) >= cutoffDate
  );
  
  if (recentEntries.length === 0) {
    return null;
  }
  
  const stats = {
    averageDailyCalories: 0,
    macroDistribution: {
      carbs: 0,
      protein: 0,
      fat: 0
    },
    categoryDistribution: {},
    daysTracked: 0
  };
  
  // Grouper les entrées par jour
  const entriesByDay = {};
  recentEntries.forEach(entry => {
    const dateStr = new Date(entry.date).toISOString().split('T')[0];
    if (!entriesByDay[dateStr]) {
      entriesByDay[dateStr] = [];
    }
    entriesByDay[dateStr].push(entry);
  });
  
  // Calculer les statistiques quotidiennes
  const dailyStats = Object.values(entriesByDay).map(dayEntries => {
    const calories = dayEntries.reduce((sum, entry) => sum + entry.calories, 0);
    const carbs = dayEntries.reduce((sum, entry) => sum + entry.macros.carbs, 0);
    const protein = dayEntries.reduce((sum, entry) => sum + entry.macros.protein, 0);
    const fat = dayEntries.reduce((sum, entry) => sum + entry.macros.fat, 0);
    
    const categories = {};
    dayEntries.forEach(entry => {
      if (!categories[entry.category]) {
        categories[entry.category] = 0;
      }
      categories[entry.category]++;
    });
    
    return { calories, carbs, protein, fat, categories };
  });
  
  // Calculer les moyennes
  stats.daysTracked = dailyStats.length;
  stats.averageDailyCalories = Math.round(
    dailyStats.reduce((sum, day) => sum + day.calories, 0) / stats.daysTracked
  );
  
  const totalCarbs = dailyStats.reduce((sum, day) => sum + day.carbs, 0);
  const totalProtein = dailyStats.reduce((sum, day) => sum + day.protein, 0);
  const totalFat = dailyStats.reduce((sum, day) => sum + day.fat, 0);
  
  // Calculer la distribution des macros en pourcentage
  const totalCaloricValue = (totalCarbs * 4) + (totalProtein * 4) + (totalFat * 9);
  if (totalCaloricValue > 0) {
    stats.macroDistribution.carbs = Math.round((totalCarbs * 4 / totalCaloricValue) * 100);
    stats.macroDistribution.protein = Math.round((totalProtein * 4 / totalCaloricValue) * 100);
    stats.macroDistribution.fat = Math.round((totalFat * 9 / totalCaloricValue) * 100);
  }
  
  // Calculer la distribution des catégories d'aliments
  const categoryCount = {};
  dailyStats.forEach(day => {
    Object.entries(day.categories).forEach(([category, count]) => {
      if (!categoryCount[category]) {
        categoryCount[category] = 0;
      }
      categoryCount[category] += count;
    });
  });
  
  const totalEntries = Object.values(categoryCount).reduce((sum, count) => sum + count, 0);
  if (totalEntries > 0) {
    stats.categoryDistribution = Object.entries(categoryCount).reduce((dist, [category, count]) => {
      dist[category] = Math.round((count / totalEntries) * 100);
      return dist;
    }, {});
  }
  
  return stats;
};

const NutritionData = mongoose.model('NutritionData', NutritionDataSchema);

module.exports = NutritionData;
