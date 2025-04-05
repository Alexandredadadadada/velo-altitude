const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const User = require('../../models/user.model');
const jwt = require('jsonwebtoken');
const config = require('../../config');

describe('API Integration Tests', () => {
  let authToken;
  let testUserId;
  
  // Avant tous les tests
  beforeAll(async () => {
    // Créer un utilisateur de test
    const testUser = new User({
      email: 'test@example.com',
      password: await User.hashPassword('password123'),
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    });
    
    await testUser.save();
    testUserId = testUser._id;
    
    // Générer un token JWT
    authToken = jwt.sign(
      { userId: testUserId, email: testUser.email },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });
  
  // Après tous les tests
  afterAll(async () => {
    // Supprimer l'utilisateur de test
    await User.findByIdAndDelete(testUserId);
    
    // Fermer la connexion à la base de données
    await mongoose.connection.close();
  });
  
  // Test d'authentification
  describe('Authentication Flow', () => {
    test('Should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
    });
    
    test('Should fail login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
    });
    
    test('Should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', 'test@example.com');
    });
    
    test('Should reject access to protected route without token', async () => {
      const response = await request(app)
        .get('/api/users/profile');
      
      expect(response.status).toBe(401);
    });
  });
  
  // Test des fonctionnalités sociales
  describe('Social Features', () => {
    let postId;
    
    test('Should create a new post', async () => {
      const response = await request(app)
        .post('/api/social/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test post content',
          activity: {
            type: 'ride',
            distance: 50,
            duration: 7200,
            elevation: 500
          }
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body.content).toBe('Test post content');
      expect(response.body.author).toBe(testUserId.toString());
      
      postId = response.body._id;
    });
    
    test('Should get posts feed', async () => {
      const response = await request(app)
        .get('/api/social/posts')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
    
    test('Should add comment to post', async () => {
      const response = await request(app)
        .post(`/api/social/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test comment'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('content', 'Test comment');
      expect(response.body).toHaveProperty('author');
    });
    
    test('Should like a post', async () => {
      const response = await request(app)
        .post(`/api/social/posts/${postId}/like`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('likes');
      expect(response.body.likes).toContain(testUserId.toString());
    });
  });
  
  // Test des fonctionnalités d'entraînement
  describe('Training Features', () => {
    test('Should get training zones based on FTP', async () => {
      const response = await request(app)
        .get('/api/training/zones')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ ftp: 250 });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('zones');
      expect(response.body.zones.length).toBe(7); // 7 zones d'entraînement
      expect(response.body.zones[0]).toHaveProperty('min');
      expect(response.body.zones[0]).toHaveProperty('max');
      expect(response.body.zones[0]).toHaveProperty('name');
    });
    
    test('Should get personalized training plan', async () => {
      const response = await request(app)
        .post('/api/training/plan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          goal: 'endurance',
          level: 'intermediate',
          hoursPerWeek: 8,
          durationWeeks: 8
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('plan');
      expect(response.body.plan).toHaveProperty('weeks');
      expect(Array.isArray(response.body.plan.weeks)).toBe(true);
      expect(response.body.plan.weeks.length).toBe(8);
    });
  });
  
  // Test des fonctionnalités environnementales
  describe('Environmental Features', () => {
    test('Should get weather forecast for location', async () => {
      const response = await request(app)
        .get('/api/environmental/weather')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          lat: 48.8566,
          lng: 2.3522
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('current');
      expect(response.body).toHaveProperty('forecast');
      expect(Array.isArray(response.body.forecast)).toBe(true);
    });
    
    test('Should get air quality for location', async () => {
      const response = await request(app)
        .get('/api/environmental/air-quality')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ 
          lat: 48.8566,
          lng: 2.3522
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('aqi');
      expect(response.body).toHaveProperty('components');
    });
    
    test('Should get environmental conditions for route', async () => {
      // Créer d'abord un itinéraire
      const routeResponse = await request(app)
        .post('/api/routes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Route',
          points: [
            { lat: 48.8566, lng: 2.3522, elevation: 35 },
            { lat: 48.8600, lng: 2.3400, elevation: 40 },
            { lat: 48.8650, lng: 2.3300, elevation: 45 }
          ],
          distance: 5,
          elevation_gain: 10
        });
      
      expect(routeResponse.status).toBe(201);
      const routeId = routeResponse.body._id;
      
      // Obtenir les conditions environnementales pour cet itinéraire
      const response = await request(app)
        .get(`/api/environmental/route/${routeId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('points');
      expect(Array.isArray(response.body.points)).toBe(true);
      expect(response.body.points[0]).toHaveProperty('weather');
      expect(response.body.points[0]).toHaveProperty('airQuality');
    });
  });
  
  // Test des cols et des itinéraires
  describe('Cols and Routes Features', () => {
    test('Should get all cols', async () => {
      const response = await request(app)
        .get('/api/cols')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('location');
      expect(response.body[0]).toHaveProperty('statistics');
    });
    
    test('Should get col details', async () => {
      // Récupérer d'abord la liste des cols
      const colsResponse = await request(app)
        .get('/api/cols')
        .set('Authorization', `Bearer ${authToken}`);
      
      const colId = colsResponse.body[0].id;
      
      const response = await request(app)
        .get(`/api/cols/${colId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', colId);
      expect(response.body).toHaveProperty('elevation_profile');
      expect(response.body).toHaveProperty('history');
      expect(response.body).toHaveProperty('practical_info');
    });
    
    test('Should get all cycling routes', async () => {
      const response = await request(app)
        .get('/api/routes')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('statistics');
      expect(response.body[0]).toHaveProperty('points');
    });
    
    test('Should get route details', async () => {
      // Récupérer d'abord la liste des routes
      const routesResponse = await request(app)
        .get('/api/routes')
        .set('Authorization', `Bearer ${authToken}`);
      
      const routeId = routesResponse.body[0].id;
      
      const response = await request(app)
        .get(`/api/routes/${routeId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', routeId);
      expect(response.body).toHaveProperty('waypoints');
      expect(response.body).toHaveProperty('points_of_interest');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('narrative');
    });
  });
  
  // Test des plans d'entraînement et de nutrition
  describe('Training and Nutrition Plans Features', () => {
    test('Should get all training plans', async () => {
      const response = await request(app)
        .get('/api/training-plans')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('objective');
      expect(response.body[0]).toHaveProperty('level');
    });
    
    test('Should get training plan details', async () => {
      // Récupérer d'abord la liste des plans d'entraînement
      const plansResponse = await request(app)
        .get('/api/training-plans')
        .set('Authorization', `Bearer ${authToken}`);
      
      const planId = plansResponse.body[0].id;
      
      const response = await request(app)
        .get(`/api/training-plans/${planId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', planId);
      expect(response.body).toHaveProperty('weekly_structure');
      expect(Array.isArray(response.body.weekly_structure)).toBe(true);
      expect(response.body).toHaveProperty('progression');
      expect(response.body).toHaveProperty('expert_tips');
    });
    
    test('Should get all nutrition plans', async () => {
      const response = await request(app)
        .get('/api/nutrition-plans')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('type');
    });
    
    test('Should get nutrition plan details', async () => {
      // Récupérer d'abord la liste des plans de nutrition
      const plansResponse = await request(app)
        .get('/api/nutrition-plans')
        .set('Authorization', `Bearer ${authToken}`);
      
      const planId = plansResponse.body[0].id;
      
      const response = await request(app)
        .get(`/api/nutrition-plans/${planId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', planId);
      expect(response.body).toHaveProperty('daily_calories');
      expect(response.body).toHaveProperty('macronutrients');
      expect(response.body).toHaveProperty('daily_menus');
      expect(Array.isArray(response.body.daily_menus)).toBe(true);
    });
  });
});
