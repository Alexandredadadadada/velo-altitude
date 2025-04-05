/**
 * Tests d'intégration pour les services et contrôleurs de programmes intégrés
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const mongoose = require('mongoose');
const { expect } = chai;
const { MongoMemoryServer } = require('mongodb-memory-server');

const IntegratedProgramsService = require('../services/integrated-programs.service');
const TrainingProgramsService = require('../services/training-programs.service');
const NutritionService = require('../services/nutrition.service');
const UserService = require('../services/user.service');
const NutritionData = require('../models/nutrition.model');
const CacheService = require('../services/cache.service');

chai.use(chaiHttp);

describe('Service de Programmes Intégrés', () => {
  let mongoServer;
  let mockUser;
  let mockTrainingProgram;
  let mockNutritionPlan;
  let cacheStub;
  let trainingServiceStub;
  let nutritionServiceStub;
  let userServiceStub;

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
    
    // Créer des mocks pour les programmes d'entraînement et les plans nutritionnels
    mockTrainingProgram = {
      id: 'mock_training_program',
      name: 'Programme d\'entraînement endurance',
      type: 'endurance',
      weeklyHours: 8,
      weeklyWorkouts: {
        Monday: { type: 'recovery', duration: 60, intensity: 'low' },
        Tuesday: { type: 'intensity', duration: 90, intensity: 'high' },
        Wednesday: { type: 'endurance', duration: 120, intensity: 'medium' },
        Thursday: { type: 'recovery', duration: 45, intensity: 'low' },
        Friday: { type: 'intensity', duration: 75, intensity: 'high' },
        Saturday: { type: 'endurance', duration: 180, intensity: 'medium' },
        Sunday: { type: 'recovery', duration: 60, intensity: 'low' }
      },
      focusAreas: ['endurance', 'threshold'],
      duration: 28
    };
    
    mockNutritionPlan = {
      id: 'mock_nutrition_plan',
      name: 'Plan Nutrition Endurance',
      type: 'performance',
      dailyCalories: 2800,
      macronutrients: {
        carbs: '55-60%',
        protein: '15-20%',
        fat: '25-30%'
      },
      dailyPlans: {
        training_day: {
          breakfast: ['Avoine avec fruits et noix', 'Yaourt grec'],
          snack1: ['Banane', 'Barre énergétique maison'],
          lunch: ['Pâtes complètes avec sauce tomate et poulet', 'Salade verte'],
          snack2: ['Smoothie protéiné'],
          dinner: ['Saumon grillé', 'Quinoa', 'Légumes rôtis'],
          hydration: '3-4L d\'eau + boissons électrolytiques pendant l\'entraînement'
        },
        recovery_day: {
          breakfast: ['Œufs avec légumes et toast complet', 'Fruit'],
          snack1: ['Noix et baies'],
          lunch: ['Wrap au poulet et avocat', 'Soupe aux légumes'],
          snack2: ['Fromage cottage avec fruits'],
          dinner: ['Tofu sauté', 'Riz brun', 'Légumes verts'],
          hydration: '2.5-3L d\'eau'
        }
      },
      supplements: [
        { name: 'Protéine de lactosérum', timing: 'Post-entraînement', dosage: '20-25g' },
        { name: 'BCAA', timing: 'Pendant les longues sorties', dosage: '5-10g' },
        { name: 'Électrolytes', timing: 'Pendant l\'entraînement', dosage: 'Selon les recommandations' }
      ]
    };

    // Simuler le service de cache
    cacheStub = sinon.stub(CacheService, 'getCache').returns({
      get: sinon.stub().returns(null),
      set: sinon.stub().returns(true),
      del: sinon.stub().returns(true)
    });
    
    // Simuler les services de training, nutrition et user
    trainingServiceStub = sinon.stub(TrainingProgramsService, 'generateProgram').resolves(mockTrainingProgram);
    nutritionServiceStub = sinon.stub(NutritionService, 'generateNutritionPlan').resolves(mockNutritionPlan);
    userServiceStub = sinon.stub(UserService, 'getUserById').resolves(mockUser);
  });

  after(async () => {
    cacheStub.restore();
    trainingServiceStub.restore();
    nutritionServiceStub.restore();
    userServiceStub.restore();
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Créer des données nutritionnelles de test
    const mockNutritionData = new NutritionData({
      userId: mockUser._id,
      preferences: {
        dietaryRestrictions: ['vegetarian'],
        allergies: ['nuts'],
        preferredFoods: ['spinach', 'quinoa', 'blueberries'],
        avoidedFoods: ['processed sugar'],
        mealFrequency: 5
      },
      currentGoal: 'performance'
    });

    await mockNutritionData.save();
  });

  afterEach(async () => {
    await NutritionData.deleteMany({});
  });

  describe('generateIntegratedProgram', () => {
    it('devrait générer un programme intégré complet', async () => {
      const programParams = {
        type: 'endurance',
        weeklyHours: 8,
        focusAreas: ['endurance', 'threshold'],
        duration: 28,
        goal: 'performance',
        nutritionPreferences: {
          dietaryRestrictions: ['vegetarian'],
          allergies: ['nuts']
        }
      };

      const result = await IntegratedProgramsService.generateIntegratedProgram(
        mockUser._id.toString(),
        programParams
      );

      expect(result).to.be.an('object');
      expect(result.id).to.be.a('string');
      expect(result.name).to.be.a('string');
      expect(result.training).to.deep.equal(mockTrainingProgram);
      expect(result.nutrition).to.deep.equal(mockNutritionPlan);
      expect(result.recommendations).to.be.an('array');
      expect(result.recommendations.length).to.be.greaterThan(0);
    });
  });

  describe('_generateIntegratedRecommendations', () => {
    it('devrait générer des recommandations personnalisées intégrant entraînement et nutrition', async () => {
      const recommendations = await IntegratedProgramsService._generateIntegratedRecommendations(
        mockTrainingProgram,
        mockNutritionPlan,
        mockUser.profile
      );

      expect(recommendations).to.be.an('array');
      expect(recommendations.length).to.be.greaterThan(0);
      
      // Vérifier la présence de recommandations pour les jours d'intensité
      const intensityRecommendations = recommendations.filter(rec => 
        rec.includes('intensité') || rec.includes('Intensité')
      );
      expect(intensityRecommendations.length).to.be.greaterThan(0);
      
      // Vérifier la présence de recommandations pour les jours d'endurance
      const enduranceRecommendations = recommendations.filter(rec => 
        rec.includes('endurance') || rec.includes('Endurance')
      );
      expect(enduranceRecommendations.length).to.be.greaterThan(0);
      
      // Vérifier la présence de recommandations pour les jours de récupération
      const recoveryRecommendations = recommendations.filter(rec => 
        rec.includes('récupération') || rec.includes('Récupération')
      );
      expect(recoveryRecommendations.length).to.be.greaterThan(0);
    });
  });

  describe('_determineIntensity', () => {
    it('devrait déterminer correctement l\'intensité en fonction du type et des zones ciblées', () => {
      // Test pour haute intensité
      expect(IntegratedProgramsService._determineIntensity('performance', ['threshold'])).to.equal('high');
      
      // Test pour intensité moyenne
      expect(IntegratedProgramsService._determineIntensity('endurance', ['endurance'])).to.equal('medium');
      
      // Test pour basse intensité
      expect(IntegratedProgramsService._determineIntensity('recovery', ['recovery'])).to.equal('low');
      
      // Test pour le cas par défaut
      expect(IntegratedProgramsService._determineIntensity('unknown', ['unknown'])).to.equal('medium');
    });
  });

  describe('adjustIntegratedProgram', () => {
    it('devrait ajuster un programme intégré existant', async () => {
      // Modifier le mock du cache pour simuler un programme existant
      CacheService.getCache().get = sinon.stub().returns({
        id: 'mock_integrated_program',
        name: 'Programme intégré existant',
        training: mockTrainingProgram,
        nutrition: mockNutritionPlan,
        recommendations: ['Recommandation 1', 'Recommandation 2'],
        userId: mockUser._id.toString()
      });
      
      const adjustmentParams = {
        trainingAdjustments: {
          weeklyHours: 10,
          focusAreas: ['threshold', 'mountain']
        },
        nutritionAdjustments: {
          goal: 'performance',
          trainingPhase: 'peak'
        }
      };
      
      const result = await IntegratedProgramsService.adjustIntegratedProgram(
        mockUser._id.toString(),
        'mock_integrated_program',
        adjustmentParams
      );
      
      expect(result).to.be.an('object');
      expect(result.id).to.equal('mock_integrated_program');
      expect(result.updatedAt).to.be.instanceOf(Date);
      expect(result.recommendations).to.be.an('array');
    });
  });
});
