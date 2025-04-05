/**
 * Tests unitaires pour le service de modération des avis
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../app');
const RouteReview = require('../models/route-review.model');
const Route = require('../models/route.model');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const reviewModerationService = require('../services/review-moderation.service').getInstance();

// Configuration de la base de données en mémoire pour les tests
let mongoServer;

// Mock du service de notification
jest.mock('../services/notification.service', () => {
  return {
    getInstance: jest.fn().mockReturnValue({
      sendNotification: jest.fn().mockResolvedValue(true)
    })
  };
});

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

const testAdmin = {
  _id: new mongoose.Types.ObjectId(),
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  password: 'hashedPassword',
  isAdmin: true
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
  comment: 'Paysages magnifiques et peu de circulation',
  flags: 0,
  flaggedBy: [],
  hidden: false,
  moderationStatus: 'none'
};

const testReviewWithInappropriateContent = {
  _id: new mongoose.Types.ObjectId(),
  route: testRoute._id,
  user: testUser._id,
  rating: 2,
  comment: 'Cette route est terrible, c\'est une arnaque complète!',
  flags: 0,
  flaggedBy: [],
  hidden: false,
  moderationStatus: 'none'
};

// Générer un token JWT valide pour les tests
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, email: user.email, isAdmin: user.isAdmin },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

describe('Review Moderation Tests', () => {
  beforeAll(async () => {
    // Démarrer la base de données en mémoire
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Initialiser le service de modération
    await reviewModerationService.initialize();
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
    await User.create(testAdmin);
    await Route.create(testRoute);
  });
  
  describe('POST /api/moderation/reviews/:reviewId/report', () => {
    it('should report a review', async () => {
      const token = generateToken(testUser);
      
      // Créer un avis
      const createdReview = await RouteReview.create(testReview);
      
      const response = await request(app)
        .post(`/api/moderation/reviews/${createdReview._id}/report`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          reason: 'Contenu inapproprié'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.moderated).toBe(false);
      
      // Vérifier que le signalement a bien été ajouté
      const reportedReview = await RouteReview.findById(createdReview._id);
      expect(reportedReview.flags).toBe(1);
      expect(reportedReview.flaggedBy).toContainEqual(testUser._id);
      expect(reportedReview.flagDetails).toHaveLength(1);
      expect(reportedReview.flagDetails[0].reason).toBe('Contenu inapproprié');
    });
    
    it('should not allow reporting the same review twice by the same user', async () => {
      const token = generateToken(testUser);
      
      // Créer un avis déjà signalé par l'utilisateur
      const reviewWithFlag = {
        ...testReview,
        flags: 1,
        flaggedBy: [testUser._id],
        flagDetails: [{
          user: testUser._id,
          reason: 'Contenu inapproprié',
          date: new Date()
        }]
      };
      
      const createdReview = await RouteReview.create(reviewWithFlag);
      
      const response = await request(app)
        .post(`/api/moderation/reviews/${createdReview._id}/report`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          reason: 'Nouveau signalement'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('déjà signalé');
      
      // Vérifier que le signalement n'a pas été modifié
      const reportedReview = await RouteReview.findById(createdReview._id);
      expect(reportedReview.flags).toBe(1);
      expect(reportedReview.flagDetails).toHaveLength(1);
    });
    
    it('should automatically moderate a review with inappropriate content', async () => {
      const token = generateToken(testUser);
      
      // Créer un avis avec contenu inapproprié
      const createdReview = await RouteReview.create(testReviewWithInappropriateContent);
      
      const response = await request(app)
        .post(`/api/moderation/reviews/${createdReview._id}/report`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          reason: 'Contenu inapproprié'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.moderated).toBe(true);
      
      // Vérifier que l'avis a bien été modéré automatiquement
      const moderatedReview = await RouteReview.findById(createdReview._id);
      expect(moderatedReview.hidden).toBe(true);
      expect(moderatedReview.moderationStatus).toBe('pending');
    });
    
    it('should automatically moderate a review after reaching the flag threshold', async () => {
      // Créer plusieurs utilisateurs pour les signalements
      const users = [];
      for (let i = 0; i < 3; i++) {
        const user = {
          _id: new mongoose.Types.ObjectId(),
          firstName: `User${i}`,
          lastName: 'Test',
          email: `user${i}@example.com`,
          password: 'hashedPassword',
          isAdmin: false
        };
        await User.create(user);
        users.push(user);
      }
      
      // Créer un avis
      const createdReview = await RouteReview.create(testReview);
      
      // Signaler l'avis par 3 utilisateurs différents
      for (let i = 0; i < 3; i++) {
        const token = generateToken(users[i]);
        
        const response = await request(app)
          .post(`/api/moderation/reviews/${createdReview._id}/report`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            reason: `Signalement ${i+1}`
          });
        
        if (i < 2) {
          expect(response.body.data.moderated).toBe(false);
        } else {
          // Le troisième signalement devrait déclencher la modération automatique
          expect(response.body.data.moderated).toBe(true);
        }
      }
      
      // Vérifier que l'avis a bien été modéré automatiquement après le 3e signalement
      const moderatedReview = await RouteReview.findById(createdReview._id);
      expect(moderatedReview.flags).toBe(3);
      expect(moderatedReview.hidden).toBe(true);
      expect(moderatedReview.moderationStatus).toBe('pending');
    });
  });
  
  describe('POST /api/moderation/reviews/:reviewId/moderate', () => {
    it('should allow an admin to approve a review', async () => {
      const token = generateToken(testAdmin);
      
      // Créer un avis en attente de modération
      const pendingReview = {
        ...testReview,
        hidden: true,
        moderationStatus: 'pending',
        flags: 3
      };
      
      const createdReview = await RouteReview.create(pendingReview);
      
      const response = await request(app)
        .post(`/api/moderation/reviews/${createdReview._id}/moderate`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          action: 'approve',
          note: 'Contenu approprié après vérification'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.action).toBe('approve');
      
      // Vérifier que l'avis a bien été approuvé
      const approvedReview = await RouteReview.findById(createdReview._id);
      expect(approvedReview.hidden).toBe(false);
      expect(approvedReview.moderationStatus).toBe('approved');
      expect(approvedReview.moderationNote).toBe('Contenu approprié après vérification');
      expect(approvedReview.moderatedBy.toString()).toBe(testAdmin._id.toString());
    });
    
    it('should allow an admin to reject a review', async () => {
      const token = generateToken(testAdmin);
      
      // Créer un avis en attente de modération
      const pendingReview = {
        ...testReview,
        hidden: true,
        moderationStatus: 'pending',
        flags: 3
      };
      
      const createdReview = await RouteReview.create(pendingReview);
      
      const response = await request(app)
        .post(`/api/moderation/reviews/${createdReview._id}/moderate`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          action: 'reject',
          note: 'Contenu inapproprié'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.action).toBe('reject');
      
      // Vérifier que l'avis a bien été rejeté
      const rejectedReview = await RouteReview.findById(createdReview._id);
      expect(rejectedReview.hidden).toBe(true);
      expect(rejectedReview.moderationStatus).toBe('rejected');
      expect(rejectedReview.moderationNote).toBe('Contenu inapproprié');
      expect(rejectedReview.moderatedBy.toString()).toBe(testAdmin._id.toString());
    });
    
    it('should allow an admin to edit a review', async () => {
      const token = generateToken(testAdmin);
      
      // Créer un avis en attente de modération
      const pendingReview = {
        ...testReview,
        hidden: true,
        moderationStatus: 'pending',
        flags: 3
      };
      
      const createdReview = await RouteReview.create(pendingReview);
      
      const response = await request(app)
        .post(`/api/moderation/reviews/${createdReview._id}/moderate`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          action: 'edit',
          content: 'Contenu modifié par un administrateur',
          note: 'Contenu modifié pour respecter les règles'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.action).toBe('edit');
      
      // Vérifier que l'avis a bien été modifié
      const editedReview = await RouteReview.findById(createdReview._id);
      expect(editedReview.hidden).toBe(false);
      expect(editedReview.moderationStatus).toBe('edited');
      expect(editedReview.comment).toBe('Contenu modifié par un administrateur');
      expect(editedReview.moderationNote).toBe('Contenu modifié pour respecter les règles');
      expect(editedReview.moderatedBy.toString()).toBe(testAdmin._id.toString());
    });
    
    it('should allow an admin to delete a review', async () => {
      const token = generateToken(testAdmin);
      
      // Créer un avis en attente de modération
      const pendingReview = {
        ...testReview,
        hidden: true,
        moderationStatus: 'pending',
        flags: 3
      };
      
      const createdReview = await RouteReview.create(pendingReview);
      
      const response = await request(app)
        .post(`/api/moderation/reviews/${createdReview._id}/moderate`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          action: 'delete'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.action).toBe('delete');
      
      // Vérifier que l'avis a bien été supprimé
      const deletedReview = await RouteReview.findById(createdReview._id);
      expect(deletedReview).toBeNull();
    });
    
    it('should not allow a non-admin to moderate reviews', async () => {
      const token = generateToken(testUser);
      
      // Créer un avis en attente de modération
      const pendingReview = {
        ...testReview,
        hidden: true,
        moderationStatus: 'pending',
        flags: 3
      };
      
      const createdReview = await RouteReview.create(pendingReview);
      
      const response = await request(app)
        .post(`/api/moderation/reviews/${createdReview._id}/moderate`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          action: 'approve'
        });
      
      expect(response.status).toBe(403); // Forbidden
      expect(response.body.success).toBe(false);
      
      // Vérifier que l'avis n'a pas été modifié
      const unchangedReview = await RouteReview.findById(createdReview._id);
      expect(unchangedReview.moderationStatus).toBe('pending');
      expect(unchangedReview.moderatedBy).toBeUndefined();
    });
  });
  
  describe('GET /api/moderation/pending', () => {
    it('should allow an admin to get pending reviews', async () => {
      const token = generateToken(testAdmin);
      
      // Créer plusieurs avis en attente de modération
      const pendingReviews = [];
      for (let i = 0; i < 5; i++) {
        const review = {
          ...testReview,
          _id: new mongoose.Types.ObjectId(),
          comment: `Avis en attente ${i+1}`,
          hidden: true,
          moderationStatus: 'pending',
          flags: 3
        };
        pendingReviews.push(review);
      }
      
      await RouteReview.insertMany(pendingReviews);
      
      const response = await request(app)
        .get('/api/moderation/pending')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination.total).toBe(5);
    });
    
    it('should not allow a non-admin to get pending reviews', async () => {
      const token = generateToken(testUser);
      
      const response = await request(app)
        .get('/api/moderation/pending')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(403); // Forbidden
      expect(response.body.success).toBe(false);
    });
  });
  
  describe('GET /api/moderation/history', () => {
    it('should allow an admin to get moderation history', async () => {
      const token = generateToken(testAdmin);
      
      // Créer plusieurs avis modérés
      const moderatedReviews = [];
      for (let i = 0; i < 5; i++) {
        const status = ['approved', 'rejected', 'edited'][i % 3];
        const review = {
          ...testReview,
          _id: new mongoose.Types.ObjectId(),
          comment: `Avis modéré ${i+1}`,
          hidden: status === 'rejected',
          moderationStatus: status,
          moderatedBy: testAdmin._id,
          moderatedAt: new Date()
        };
        moderatedReviews.push(review);
      }
      
      await RouteReview.insertMany(moderatedReviews);
      
      const response = await request(app)
        .get('/api/moderation/history')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination.total).toBe(5);
    });
    
    it('should not allow a non-admin to get moderation history', async () => {
      const token = generateToken(testUser);
      
      const response = await request(app)
        .get('/api/moderation/history')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(403); // Forbidden
      expect(response.body.success).toBe(false);
    });
  });
});
