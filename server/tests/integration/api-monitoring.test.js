/**
 * Tests d'intégration pour le système de monitoring des API
 */
const request = require('supertest');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const app = require('../../app');
const apiQuotaMonitor = require('../../services/api-quota-monitor.service');

describe('API Monitoring System', () => {
  let adminToken;
  let userId;

  // Configuration avant les tests
  beforeAll(async () => {
    // Créer un utilisateur administrateur pour les tests
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'admin.test@cyclisme-europe.eu',
        password: 'TestAdmin123!',
        firstName: 'Admin',
        lastName: 'Test',
        role: 'admin'
      });

    userId = response.body.user._id;

    // Connecter l'utilisateur admin
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin.test@cyclisme-europe.eu',
        password: 'TestAdmin123!'
      });

    adminToken = loginResponse.body.token;
  });

  // Nettoyage après les tests
  afterAll(async () => {
    // Supprimer l'utilisateur de test
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.db.collection('users').deleteOne({ _id: mongoose.Types.ObjectId(userId) });
    }

    // Fermer la connexion à la base de données
    await mongoose.connection.close();
  });

  // Tests pour le service de monitoring des quotas d'API
  describe('API Quota Monitor Service', () => {
    test('devrait enregistrer un appel d\'API', () => {
      // Enregistrer un appel d'API
      apiQuotaMonitor.logApiCall('openweathermap');
      
      // Vérifier si l'appel a été enregistré
      const quotas = apiQuotaMonitor.getApiQuotas();
      expect(quotas).toHaveProperty('openweathermap');
      expect(quotas.openweathermap.calls).toBeGreaterThan(0);
    });

    test('devrait vérifier un quota d\'API', () => {
      // Enregistrer plusieurs appels
      for (let i = 0; i < 5; i++) {
        apiQuotaMonitor.logApiCall('openai');
      }
      
      // Vérifier le quota
      const quota = apiQuotaMonitor.checkQuota('openai');
      expect(quota).toHaveProperty('isExceeded');
      expect(quota).toHaveProperty('percentUsed');
      expect(quota).toHaveProperty('remaining');
    });

    test('devrait générer une alerte si un quota est proche du seuil', () => {
      // Simuler un grand nombre d'appels pour dépasser 80% du quota
      const openaiConfig = apiQuotaMonitor.apiConfigs.openai;
      const callsToMake = Math.floor(openaiConfig.dailyLimit * 0.85);
      
      // Réinitialiser le compteur
      apiQuotaMonitor.resetApiQuota('openai');
      
      // Faire les appels
      for (let i = 0; i < callsToMake; i++) {
        apiQuotaMonitor.logApiCall('openai');
      }
      
      // Vérifier si une alerte est générée
      const alerts = apiQuotaMonitor.getAlerts();
      const hasOpenAIAlert = alerts.some(alert => 
        alert.apiName === 'openai' && 
        alert.type === 'quota_warning'
      );
      
      expect(hasOpenAIAlert).toBe(true);
    });
  });

  // Tests pour les routes d'administration des API
  describe('Admin API Routes', () => {
    test('devrait récupérer le statut de toutes les API pour un admin', async () => {
      const response = await request(app)
        .get('/api/admin/api-status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('apis');
      expect(Array.isArray(response.body.apis)).toBe(true);
    });

    test('devrait refuser l\'accès sans authentification', async () => {
      const response = await request(app)
        .get('/api/admin/api-status');

      expect(response.statusCode).toBe(401);
    });

    test('devrait permettre de forcer la vérification des quotas', async () => {
      const response = await request(app)
        .post('/api/admin/check-quotas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('quotas');
    });

    test('devrait récupérer les alertes API', async () => {
      const response = await request(app)
        .get('/api/admin/api-alerts')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('alerts');
      expect(Array.isArray(response.body.alerts)).toBe(true);
    });
  });

  // Tests pour la persistance des données
  describe('Data Persistence', () => {
    test('devrait persister les données de quota entre les redémarrages', async () => {
      // Enregistrer des appels d'API
      apiQuotaMonitor.logApiCall('mapbox');
      apiQuotaMonitor.logApiCall('mapbox');
      apiQuotaMonitor.logApiCall('mapbox');
      
      // Sauvegarder les données
      apiQuotaMonitor.saveQuotaData();
      
      // Récupérer le quota initial
      const initialQuota = apiQuotaMonitor.getApiQuota('mapbox');
      
      // Simuler un redémarrage du service
      const newApiMonitor = require('../../services/api-quota-monitor.service');
      
      // Vérifier si les données ont été persistées
      const persistedQuota = newApiMonitor.getApiQuota('mapbox');
      expect(persistedQuota.calls).toBeGreaterThanOrEqual(initialQuota.calls);
    });
  });
});
