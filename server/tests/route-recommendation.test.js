/**
 * Tests unitaires pour le service de recommandation des routes
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../app');
const Route = require('../models/route.model');
const RouteReview = require('../models/route-review.model');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

// Configuration de la base de données en mémoire pour les tests
let mongoServer;

// Mock du service de cache
jest.mock('../services/cache.service', () => {
  return {
    getInstance: jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true)
    })
  };
});

// Données de test
const testUser = {
  _id: new mongoose.Types.ObjectId(),
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  password: 'hashedPassword',
  isAdmin: false,
  preferences: {
    maxDistance: 100,
    maxElevation: 1000,
    preferredRegions: ['Grand Est'],
    difficultyPreference: 'medium',
    sceneryImportance: 4,
    trafficAvoidance: 3
  }
};

// Créer plusieurs routes de test
const createTestRoutes = () => {
  const routes = [];
  
  // Route 1 - Route facile en Grand Est
  routes.push({
    _id: new mongoose.Types.ObjectId(),
    name: 'Route facile en Grand Est',
    user: testUser._id,
    distance: 30,
    elevation: { gain: 300 },
    difficulty: 'easy',
    region: 'Grand Est',
    isPublic: true,
    start: { coordinates: [7.75, 48.58] },
    end: { coordinates: [7.85, 48.65] },
    ratings: {
      average: 4.5,
      difficulty: 2,
      scenery: 4,
      surface: 4,
      traffic: 4,
      count: 10
    },
    cols: [
      { id: 'col1', name: 'Col du Petit Ballon', difficulty: 'easy' },
      { id: 'col2', name: 'Col de la Schlucht', difficulty: 'easy' }
    ]
  });
  
  // Route 2 - Route difficile en Grand Est
  routes.push({
    _id: new mongoose.Types.ObjectId(),
    name: 'Route difficile en Grand Est',
    user: testUser._id,
    distance: 80,
    elevation: { gain: 1800 },
    difficulty: 'hard',
    region: 'Grand Est',
    isPublic: true,
    start: { coordinates: [7.15, 48.28] },
    end: { coordinates: [7.35, 48.45] },
    ratings: {
      average: 4.2,
      difficulty: 4,
      scenery: 5,
      surface: 3,
      traffic: 4,
      count: 15
    },
    cols: [
      { id: 'col3', name: 'Col du Grand Ballon', difficulty: 'hard' },
      { id: 'col4', name: 'Col du Hundsruck', difficulty: 'medium' }
    ]
  });
  
  // Route 3 - Route moyenne en Alpes
  routes.push({
    _id: new mongoose.Types.ObjectId(),
    name: 'Route moyenne en Alpes',
    user: testUser._id,
    distance: 60,
    elevation: { gain: 1200 },
    difficulty: 'medium',
    region: 'Alpes',
    isPublic: true,
    start: { coordinates: [6.15, 45.28] },
    end: { coordinates: [6.35, 45.45] },
    ratings: {
      average: 4.8,
      difficulty: 3,
      scenery: 5,
      surface: 4,
      traffic: 5,
      count: 25
    },
    cols: [
      { id: 'col5', name: 'Col du Galibier', difficulty: 'hard' },
      { id: 'col6', name: 'Col du Lautaret', difficulty: 'medium' }
    ]
  });
  
  // Route 4 - Route peu appréciée
  routes.push({
    _id: new mongoose.Types.ObjectId(),
    name: 'Route peu appréciée',
    user: testUser._id,
    distance: 40,
    elevation: { gain: 500 },
    difficulty: 'medium',
    region: 'Grand Est',
    isPublic: true,
    start: { coordinates: [7.35, 48.38] },
    end: { coordinates: [7.55, 48.55] },
    ratings: {
      average: 2.5,
      difficulty: 3,
      scenery: 2,
      surface: 2,
      traffic: 2,
      count: 8
    },
    cols: [
      { id: 'col7', name: 'Col du Bonhomme', difficulty: 'medium' }
    ]
  });
  
  // Route 5 - Route similaire à la route 1
  routes.push({
    _id: new mongoose.Types.ObjectId(),
    name: 'Route similaire à la route 1',
    user: testUser._id,
    distance: 35,
    elevation: { gain: 350 },
    difficulty: 'easy',
    region: 'Grand Est',
    isPublic: true,
    start: { coordinates: [7.70, 48.53] },
    end: { coordinates: [7.90, 48.70] },
    ratings: {
      average: 4.3,
      difficulty: 2,
      scenery: 4,
      surface: 4,
      traffic: 4,
      count: 12
    },
    cols: [
      { id: 'col1', name: 'Col du Petit Ballon', difficulty: 'easy' },
      { id: 'col8', name: 'Col des Trois Épis', difficulty: 'easy' }
    ]
  });
  
  return routes;
};

// Générer un token JWT valide pour les tests
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email, isAdmin: user.isAdmin },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

describe('Route Recommendation Tests', () => {
  beforeAll(async () => {
    // Démarrer la base de données en mémoire
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });
  
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  
  beforeEach(async () => {
    // Nettoyer la base de données avant chaque test
    await User.deleteMany({});
    await Route.deleteMany({});
    await RouteReview.deleteMany({});
    
    // Créer les données de test
    await User.create(testUser);
    await Route.insertMany(createTestRoutes());
    
    // Créer quelques avis
    const routes = await Route.find();
    const reviews = [];
    
    // Avis pour la route 1
    reviews.push({
      route: routes[0]._id,
      user: testUser._id,
      rating: 5,
      comment: 'Superbe route facile, parfaite pour les débutants',
      difficultyRating: 2,
      sceneryRating: 5,
      surfaceRating: 4,
      trafficRating: 4
    });
    
    // Avis pour la route 2
    reviews.push({
      route: routes[1]._id,
      user: testUser._id,
      rating: 4,
      comment: 'Belle route mais difficile, réservée aux cyclistes expérimentés',
      difficultyRating: 4,
      sceneryRating: 5,
      surfaceRating: 3,
      trafficRating: 4
    });
    
    await RouteReview.insertMany(reviews);
  });
  
  describe('GET /api/recommendations/personalized', () => {
    it('should return personalized recommendations based on user preferences', async () => {
      const token = generateToken(testUser);
      
      const response = await request(app)
        .get('/api/recommendations/personalized')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('routes');
      expect(response.body.data.routes.length).toBeGreaterThan(0);
      
      // Vérifier que les recommandations sont adaptées aux préférences de l'utilisateur
      const routes = response.body.data.routes;
      
      // La première route devrait être dans la région préférée de l'utilisateur
      expect(routes[0].region).toBe('Grand Est');
      
      // Les routes devraient être triées par pertinence
      expect(routes[0].relevanceScore).toBeGreaterThanOrEqual(routes[1].relevanceScore);
    });
  });
  
  describe('GET /api/recommendations/similar/:routeId', () => {
    it('should return routes similar to the specified route', async () => {
      const token = generateToken(testUser);
      
      // Récupérer la première route
      const routes = await Route.find();
      const routeId = routes[0]._id;
      
      const response = await request(app)
        .get(`/api/recommendations/similar/${routeId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('routes');
      expect(response.body.data.routes.length).toBeGreaterThan(0);
      
      // Vérifier que les routes similaires ont des caractéristiques proches
      const similarRoutes = response.body.data.routes;
      const originalRoute = routes[0];
      
      // La route la plus similaire devrait avoir une difficulté proche
      expect(similarRoutes[0].difficulty).toBe(originalRoute.difficulty);
      
      // La route la plus similaire devrait avoir des cols en commun
      const originalCols = originalRoute.cols.map(col => col.id);
      const similarCols = similarRoutes[0].cols.map(col => col.id);
      
      const commonCols = originalCols.filter(col => similarCols.includes(col));
      expect(commonCols.length).toBeGreaterThan(0);
    });
  });
  
  describe('GET /api/recommendations/by-col/:colId', () => {
    it('should return routes containing the specified col', async () => {
      const token = generateToken(testUser);
      
      // Utiliser l'ID d'un col présent dans plusieurs routes
      const colId = 'col1';
      
      const response = await request(app)
        .get(`/api/recommendations/by-col/${colId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('routes');
      expect(response.body.data.routes.length).toBeGreaterThan(0);
      
      // Vérifier que toutes les routes contiennent le col spécifié
      const routes = response.body.data.routes;
      routes.forEach(route => {
        const colIds = route.cols.map(col => col.id);
        expect(colIds).toContain(colId);
      });
    });
  });
  
  describe('GET /api/recommendations/popular-cols', () => {
    it('should return statistics for popular cols', async () => {
      const token = generateToken(testUser);
      
      const response = await request(app)
        .get('/api/recommendations/popular-cols')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('cols');
      expect(response.body.data.cols.length).toBeGreaterThan(0);
      
      // Vérifier que les cols populaires ont des statistiques
      const cols = response.body.data.cols;
      cols.forEach(col => {
        expect(col).toHaveProperty('id');
        expect(col).toHaveProperty('name');
        expect(col).toHaveProperty('routeCount');
        expect(col).toHaveProperty('averageRating');
      });
      
      // Les cols devraient être triés par popularité
      expect(cols[0].routeCount).toBeGreaterThanOrEqual(cols[cols.length - 1].routeCount);
    });
  });
  
  describe('GET /api/recommendations/search', () => {
    it('should search routes with multiple filters', async () => {
      const token = generateToken(testUser);
      
      // Rechercher des routes faciles dans le Grand Est avec une bonne note
      const response = await request(app)
        .get('/api/recommendations/search')
        .query({
          difficulty: 'easy',
          region: 'Grand Est',
          minRating: 4,
          maxDistance: 50
        })
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('routes');
      expect(response.body.data.routes.length).toBeGreaterThan(0);
      
      // Vérifier que les résultats correspondent aux critères
      const routes = response.body.data.routes;
      routes.forEach(route => {
        expect(route.difficulty).toBe('easy');
        expect(route.region).toBe('Grand Est');
        expect(route.ratings.average).toBeGreaterThanOrEqual(4);
        expect(route.distance).toBeLessThanOrEqual(50);
      });
    });
    
    it('should handle pagination correctly', async () => {
      const token = generateToken(testUser);
      
      // Première page avec 2 résultats par page
      const response1 = await request(app)
        .get('/api/recommendations/search')
        .query({
          limit: 2,
          page: 1
        })
        .set('Authorization', `Bearer ${token}`);
      
      expect(response1.status).toBe(200);
      expect(response1.body.data.routes.length).toBeLessThanOrEqual(2);
      expect(response1.body.pagination.currentPage).toBe(1);
      
      // Deuxième page
      const response2 = await request(app)
        .get('/api/recommendations/search')
        .query({
          limit: 2,
          page: 2
        })
        .set('Authorization', `Bearer ${token}`);
      
      expect(response2.status).toBe(200);
      expect(response2.body.pagination.currentPage).toBe(2);
      
      // Les routes de la deuxième page devraient être différentes
      const routes1 = response1.body.data.routes.map(r => r._id);
      const routes2 = response2.body.data.routes.map(r => r._id);
      
      routes2.forEach(id => {
        expect(routes1).not.toContain(id);
      });
    });
  });
  
  describe('GET /api/recommendations/trending', () => {
    it('should return trending routes', async () => {
      const token = generateToken(testUser);
      
      const response = await request(app)
        .get('/api/recommendations/trending')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('routes');
      expect(response.body.data.routes.length).toBeGreaterThan(0);
      
      // Vérifier que les routes tendance ont de bonnes notes
      const routes = response.body.data.routes;
      routes.forEach(route => {
        expect(route.ratings.average).toBeGreaterThanOrEqual(4);
      });
      
      // Les routes devraient être triées par popularité
      expect(routes[0].ratings.count).toBeGreaterThanOrEqual(routes[routes.length - 1].ratings.count);
    });
  });
  
  describe('GET /api/recommendations/seasonal', () => {
    it('should return seasonal recommendations', async () => {
      const token = generateToken(testUser);
      
      const response = await request(app)
        .get('/api/recommendations/seasonal')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('routes');
      expect(response.body.data.routes.length).toBeGreaterThan(0);
      expect(response.body.data).toHaveProperty('season');
      
      // La saison devrait être définie
      expect(['spring', 'summer', 'autumn', 'winter']).toContain(response.body.data.season);
    });
  });
});
