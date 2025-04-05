/**
 * Tests unitaires pour les services et contrôleurs de nutrition
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const mongoose = require('mongoose');
const { expect } = chai;
const { MongoMemoryServer } = require('mongodb-memory-server');

const NutritionService = require('../services/nutrition.service');
const NutritionData = require('../models/nutrition.model');
const CacheService = require('../services/cache.service');

chai.use(chaiHttp);

describe('Service de Nutrition', () => {
  let mongoServer;
  let mockUser;
  let mockNutritionData;
  let cacheStub;

  before(async () => {
    // Créer une instance MongoDB en mémoire pour les tests
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Créer un utilisateur de test
    mockUser = {
      _id: new mongoose.Types.ObjectId(),
      username: 'testuser',
      email: 'test@example.com',
      profile: {
        age: 35,
        gender: 'male',
        weight: 70,
        height: 175,
        activityLevel: 'moderate'
      }
    };

    // Simuler le service de cache
    cacheStub = sinon.stub(CacheService, 'getCache').returns({
      get: sinon.stub().returns(null),
      set: sinon.stub().returns(true),
      del: sinon.stub().returns(true)
    });
  });

  after(async () => {
    cacheStub.restore();
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Créer des données nutritionnelles de test
    mockNutritionData = new NutritionData({
      userId: mockUser._id,
      preferences: {
        dietaryRestrictions: ['vegetarian'],
        allergies: ['nuts'],
        preferredFoods: ['spinach', 'quinoa', 'blueberries'],
        avoidedFoods: ['processed sugar'],
        mealFrequency: 5
      },
      currentGoal: 'performance',
      nutritionalNeeds: null
    });

    await mockNutritionData.save();
  });

  afterEach(async () => {
    await NutritionData.deleteMany({});
  });

  describe('calculateNutritionalNeeds', () => {
    it('devrait calculer correctement les besoins nutritionnels de base', async () => {
      const userProfile = {
        age: 35,
        gender: 'male',
        weight: 70, // kg
        height: 175, // cm
        activityLevel: 'moderate'
      };

      const trainingLoad = {
        weeklyHours: 8,
        intensity: 'medium',
        focusAreas: ['endurance']
      };

      const result = await NutritionService.calculateNutritionalNeeds(userProfile, trainingLoad);

      expect(result).to.be.an('object');
      expect(result.calories).to.be.a('number');
      expect(result.macronutrients).to.be.an('object');
      expect(result.macronutrients.carbs).to.be.a('number');
      expect(result.macronutrients.protein).to.be.a('number');
      expect(result.macronutrients.fat).to.be.a('number');
      expect(result.hydration).to.be.an('object');
      
      // Vérifier que les valeurs sont dans des plages raisonnables
      expect(result.calories).to.be.at.least(1800);
      expect(result.calories).to.be.at.most(3500);
      expect(result.macronutrients.carbs).to.be.at.least(200);
      expect(result.macronutrients.protein).to.be.at.least(80);
      expect(result.macronutrients.fat).to.be.at.least(40);
    });

    it('devrait ajuster les besoins nutritionnels en fonction de l\'intensité de l\'entraînement', async () => {
      const userProfile = {
        age: 35,
        gender: 'male',
        weight: 70,
        height: 175,
        activityLevel: 'moderate'
      };

      // Cas d'entraînement intensif
      const highTrainingLoad = {
        weeklyHours: 15,
        intensity: 'high',
        focusAreas: ['performance', 'mountain']
      };

      // Cas d'entraînement léger
      const lightTrainingLoad = {
        weeklyHours: 4,
        intensity: 'low',
        focusAreas: ['recovery']
      };

      const highResult = await NutritionService.calculateNutritionalNeeds(userProfile, highTrainingLoad);
      const lightResult = await NutritionService.calculateNutritionalNeeds(userProfile, lightTrainingLoad);

      // L'entraînement intensif devrait nécessiter plus de calories
      expect(highResult.calories).to.be.greaterThan(lightResult.calories);
      
      // L'entraînement intensif devrait nécessiter plus de glucides
      expect(highResult.macronutrients.carbs).to.be.greaterThan(lightResult.macronutrients.carbs);
      
      // Les deux devraient recommander une hydratation adéquate
      expect(highResult.hydration.baseNeeds).to.equal(lightResult.hydration.baseNeeds);
      expect(highResult.hydration.trainingNeeds).to.be.greaterThan(lightResult.hydration.trainingNeeds);
    });
  });

  describe('generateNutritionPlan', () => {
    it('devrait générer un plan nutritionnel personnalisé', async () => {
      const userProfile = {
        _id: mockUser._id,
        age: 35,
        gender: 'male',
        weight: 70,
        height: 175,
        activityLevel: 'moderate'
      };

      const planParams = {
        goal: 'performance',
        preferences: {
          dietaryRestrictions: ['vegetarian'],
          allergies: ['nuts']
        },
        trainingPhase: 'base'
      };

      const result = await NutritionService.generateNutritionPlan(userProfile, planParams);

      expect(result).to.be.an('object');
      expect(result.name).to.be.a('string');
      expect(result.type).to.equal('performance');
      expect(result.dailyCalories).to.be.a('number');
      expect(result.macronutrients).to.be.an('object');
      expect(result.dailyPlans).to.be.an('object');
      expect(result.supplements).to.be.an('array');
      
      // Vérifier que le plan respecte les préférences
      expect(result.personalizedNotes).to.include.members([
        'Plan adapté pour un régime végétarien',
        'Recettes et options sans noix'
      ]);
    });
  });

  describe('generateEventStrategy', () => {
    it('devrait générer une stratégie nutritionnelle pour un événement', async () => {
      const eventParams = {
        eventName: 'Grand Prix des Ardennes',
        eventType: 'road_race',
        distance: 120, // km
        elevation: 1800, // m
        expectedDuration: 3.5, // heures
        weather: {
          temperature: 25, // °C
          conditions: 'sunny'
        }
      };

      const userProfile = {
        _id: mockUser._id,
        weight: 70,
        activityLevel: 'moderate',
        preferences: {
          dietaryRestrictions: ['vegetarian']
        }
      };

      const result = await NutritionService.generateEventStrategy(userProfile, eventParams);

      expect(result).to.be.an('object');
      expect(result.eventName).to.equal('Grand Prix des Ardennes');
      expect(result.caloriesBurned).to.be.a('number');
      expect(result.nutritionStrategy).to.be.an('object');
      expect(result.nutritionStrategy.before).to.be.an('object');
      expect(result.nutritionStrategy.during).to.be.an('object');
      expect(result.nutritionStrategy.after).to.be.an('object');
      expect(result.personalizedTips).to.be.an('array');
      
      // Vérifier l'estimation calorique
      // Course de 120km avec 1800m D+ ≈ 2500-3500 calories
      expect(result.caloriesBurned).to.be.at.least(2500);
      expect(result.caloriesBurned).to.be.at.most(3500);
    });
  });

  describe('analyzeFoodJournal', () => {
    it('devrait analyser un journal alimentaire et fournir des recommandations', async () => {
      // Créer un journal alimentaire de test pour l'utilisateur
      mockNutritionData.foodJournal = [
        {
          name: 'Oatmeal with berries',
          calories: 350,
          macros: { carbs: 55, protein: 12, fat: 8 },
          category: 'grains',
          timing: 'breakfast',
          date: new Date()
        },
        {
          name: 'Greek yogurt',
          calories: 180,
          macros: { carbs: 8, protein: 25, fat: 5 },
          category: 'dairy',
          timing: 'morning_snack',
          date: new Date()
        },
        {
          name: 'Quinoa salad',
          calories: 450,
          macros: { carbs: 65, protein: 15, fat: 10 },
          category: 'grains',
          timing: 'lunch',
          date: new Date()
        }
      ];
      
      await mockNutritionData.save();

      const result = await NutritionService.analyzeFoodJournal(mockUser._id.toString());

      expect(result).to.be.an('object');
      expect(result.analysis).to.be.an('object');
      expect(result.analysis.total).to.be.an('object');
      expect(result.analysis.total.calories).to.equal(980);
      expect(result.analysis.macroDistribution).to.be.an('object');
      expect(result.recommendations).to.be.an('array');
      expect(result.recommendations.length).to.be.greaterThan(0);
    });
  });
});
