/**
 * Tests unitaires pour le contrôleur des avis sur les itinéraires
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../app');
const RouteReview = require('../models/route-review.model');
const Route = require('../models/route.model');
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
  isAdmin: false
};

const testRoute = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Route de test',
  user: testUser._id,
  distance: 50,
  elevation: { gain: 500 },
  difficulty: 'medium',
  isPublic: true,
  start: { coordinates: [7.75, 48.58] },
  end: { coordinates: [7.85, 48.65] }
};

const testReview = {
  _id: new mongoose.Types.ObjectId(),
  route: testRoute._id,
  user: testUser._id,
  rating: 4,
  title: 'Très belle route',
  comment: 'Paysages magnifiques et peu de circulation',
  difficultyRating: 3,
  sceneryRating: 5,
  surfaceRating: 4,
  trafficRating: 4,
  completedRoute: true,
  likes: 0,
  likedBy: [],
  flags: 0,
  flaggedBy: []
};

// Générer un token JWT valide pour les tests
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email, isAdmin: user.isAdmin },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

describe('Route Review Controller Tests', () => {
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
    await Route.create(testRoute);
  });
  
  describe('POST /api/routes/:routeId/reviews', () => {
    it('should create a new review', async () => {
      const token = generateToken(testUser);
      
      const response = await request(app)
        .post(`/api/routes/${testRoute._id}/reviews`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 4,
          title: 'Très belle route',
          comment: 'Paysages magnifiques et peu de circulation',
          difficultyRating: 3,
          sceneryRating: 5,
          surfaceRating: 4,
          trafficRating: 4
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.rating).toBe(4);
      
      // Vérifier que l'avis a bien été créé en base
      const createdReview = await RouteReview.findById(response.body.data.id);
      expect(createdReview).not.toBeNull();
      expect(createdReview.rating).toBe(4);
      expect(createdReview.user.toString()).toBe(testUser._id.toString());
      expect(createdReview.route.toString()).toBe(testRoute._id.toString());
    });
    
    it('should not allow creating multiple reviews for the same route by the same user', async () => {
      const token = generateToken(testUser);
      
      // Créer un premier avis
      await RouteReview.create(testReview);
      
      // Tenter de créer un second avis
      const response = await request(app)
        .post(`/api/routes/${testRoute._id}/reviews`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 5,
          title: 'Second avis',
          comment: 'Ceci ne devrait pas être autorisé'
        });
      
      expect(response.status).toBe(409); // Conflict
      expect(response.body.success).toBe(false);
    });
    
    it('should return 404 for non-existent route', async () => {
      const token = generateToken(testUser);
      const fakeRouteId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .post(`/api/routes/${fakeRouteId}/reviews`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 4,
          title: 'Avis sur route inexistante',
          comment: 'Ceci ne devrait pas fonctionner'
        });
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('GET /api/routes/:routeId/reviews', () => {
    it('should get all reviews for a route', async () => {
      const token = generateToken(testUser);
      
      // Créer un avis
      await RouteReview.create(testReview);
      
      const response = await request(app)
        .get(`/api/routes/${testRoute._id}/reviews`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].rating).toBe(testReview.rating);
      expect(response.body.pagination).toHaveProperty('total', 1);
      expect(response.body.meta.stats).toHaveProperty('avgRating');
    });
    
    it('should return empty array for route with no reviews', async () => {
      const token = generateToken(testUser);
      
      const response = await request(app)
        .get(`/api/routes/${testRoute._id}/reviews`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(0);
      expect(response.body.pagination).toHaveProperty('total', 0);
    });
  });
  
  describe('PUT /api/reviews/:reviewId', () => {
    it('should update an existing review', async () => {
      const token = generateToken(testUser);
      
      // Créer un avis
      const createdReview = await RouteReview.create(testReview);
      
      const response = await request(app)
        .put(`/api/reviews/${createdReview._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 5,
          title: 'Titre mis à jour',
          comment: 'Commentaire mis à jour'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Vérifier que l'avis a bien été mis à jour
      const updatedReview = await RouteReview.findById(createdReview._id);
      expect(updatedReview.rating).toBe(5);
      expect(updatedReview.title).toBe('Titre mis à jour');
      expect(updatedReview.comment).toBe('Commentaire mis à jour');
    });
    
    it('should not allow updating a review by another user', async () => {
      const otherUser = {
        _id: new mongoose.Types.ObjectId(),
        firstName: 'Other',
        lastName: 'User',
        email: 'other@example.com',
        password: 'hashedPassword',
        isAdmin: false
      };
      
      await User.create(otherUser);
      const token = generateToken(otherUser);
      
      // Créer un avis
      const createdReview = await RouteReview.create(testReview);
      
      const response = await request(app)
        .put(`/api/reviews/${createdReview._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          rating: 1,
          title: 'Tentative de modification',
          comment: 'Ceci ne devrait pas être autorisé'
        });
      
      expect(response.status).toBe(403); // Forbidden
      expect(response.body.success).toBe(false);
      
      // Vérifier que l'avis n'a pas été modifié
      const unchangedReview = await RouteReview.findById(createdReview._id);
      expect(unchangedReview.rating).toBe(testReview.rating);
      expect(unchangedReview.title).toBe(testReview.title);
    });
  });
  
  describe('DELETE /api/reviews/:reviewId', () => {
    it('should delete a review', async () => {
      const token = generateToken(testUser);
      
      // Créer un avis
      const createdReview = await RouteReview.create(testReview);
      
      const response = await request(app)
        .delete(`/api/reviews/${createdReview._id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Vérifier que l'avis a bien été supprimé
      const deletedReview = await RouteReview.findById(createdReview._id);
      expect(deletedReview).toBeNull();
    });
    
    it('should not allow deleting a review by another user', async () => {
      const otherUser = {
        _id: new mongoose.Types.ObjectId(),
        firstName: 'Other',
        lastName: 'User',
        email: 'other@example.com',
        password: 'hashedPassword',
        isAdmin: false
      };
      
      await User.create(otherUser);
      const token = generateToken(otherUser);
      
      // Créer un avis
      const createdReview = await RouteReview.create(testReview);
      
      const response = await request(app)
        .delete(`/api/reviews/${createdReview._id}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(403); // Forbidden
      expect(response.body.success).toBe(false);
      
      // Vérifier que l'avis n'a pas été supprimé
      const unchangedReview = await RouteReview.findById(createdReview._id);
      expect(unchangedReview).not.toBeNull();
    });
  });
  
  describe('POST /api/reviews/:reviewId/like', () => {
    it('should toggle like on a review', async () => {
      const token = generateToken(testUser);
      
      // Créer un avis
      const createdReview = await RouteReview.create(testReview);
      
      // Ajouter un j'aime
      const response = await request(app)
        .post(`/api/reviews/${createdReview._id}/like`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.likes).toBe(1);
      expect(response.body.data.liked).toBe(true);
      
      // Vérifier que le j'aime a bien été ajouté
      const likedReview = await RouteReview.findById(createdReview._id);
      expect(likedReview.likes).toBe(1);
      expect(likedReview.likedBy).toContainEqual(testUser._id);
      
      // Retirer le j'aime
      const secondResponse = await request(app)
        .post(`/api/reviews/${createdReview._id}/like`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body.data.likes).toBe(0);
      expect(secondResponse.body.data.liked).toBe(false);
      
      // Vérifier que le j'aime a bien été retiré
      const unlikedReview = await RouteReview.findById(createdReview._id);
      expect(unlikedReview.likes).toBe(0);
      expect(unlikedReview.likedBy).not.toContainEqual(testUser._id);
    });
  });
});
