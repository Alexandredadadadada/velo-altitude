/**
 * Tests d'intégration pour le service de notification d'API
 */
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const apiNotificationService = require('../../services/api-notification.service');

// Mock pour nodemailer
jest.mock('nodemailer');

describe('API Notification Service', () => {
  // Configuration avant les tests
  beforeAll(async () => {
    // Configurer le mock pour l'envoi d'emails
    const mockSendMail = jest.fn().mockResolvedValue({
      messageId: 'test-message-id'
    });
    
    const mockTransporter = {
      sendMail: mockSendMail
    };
    
    nodemailer.createTransport.mockReturnValue(mockTransporter);
    
    // Connecter à la base de données si nécessaire
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cycling-dashboard-test', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    }
  });

  // Nettoyage après les tests
  afterAll(async () => {
    // Fermer la connexion à la base de données
    await mongoose.connection.close();
    
    // Réinitialiser les mocks
    jest.clearAllMocks();
  });
  
  // Initialiser les services
  beforeEach(() => {
    // Nettoyer l'historique des notifications
    apiNotificationService.notificationHistory = new Map();
  });

  describe('Configuration du Service', () => {
    test('devrait initialiser correctement la configuration', () => {
      expect(apiNotificationService).toHaveProperty('emailConfig');
      expect(apiNotificationService).toHaveProperty('smsConfig');
      expect(apiNotificationService).toHaveProperty('slackConfig');
      expect(apiNotificationService).toHaveProperty('cooldownPeriods');
    });
  });

  describe('Création d\'Alertes', () => {
    test('devrait créer une alerte de quota', () => {
      // Espionner la méthode sendAlert
      const sendAlertSpy = jest.spyOn(apiNotificationService, 'sendAlert').mockResolvedValue(true);
      
      // Créer une alerte de quota
      apiNotificationService.createQuotaAlert('openai', 90, 100, '2025-04-05T00:00:00Z');
      
      // Vérifier si sendAlert a été appelé avec les bons paramètres
      expect(sendAlertSpy).toHaveBeenCalled();
      
      // Vérifier les arguments
      const alertArg = sendAlertSpy.mock.calls[0][0];
      const channelsArg = sendAlertSpy.mock.calls[0][1];
      
      expect(alertArg).toHaveProperty('apiName', 'openai');
      expect(alertArg).toHaveProperty('type');
      expect(alertArg.type).toContain('quota');
      expect(alertArg).toHaveProperty('subject');
      expect(alertArg).toHaveProperty('message');
      expect(alertArg).toHaveProperty('details');
      expect(channelsArg).toContain('email');
      
      // Restaurer le mock
      sendAlertSpy.mockRestore();
    });
    
    test('devrait créer une alerte d\'erreur', () => {
      // Espionner la méthode sendAlert
      const sendAlertSpy = jest.spyOn(apiNotificationService, 'sendAlert').mockResolvedValue(true);
      
      // Créer une alerte d'erreur
      apiNotificationService.createErrorAlert('strava', 'Erreur d\'authentification', { status: 401 });
      
      // Vérifier si sendAlert a été appelé avec les bons paramètres
      expect(sendAlertSpy).toHaveBeenCalled();
      
      // Vérifier les arguments
      const alertArg = sendAlertSpy.mock.calls[0][0];
      const channelsArg = sendAlertSpy.mock.calls[0][1];
      
      expect(alertArg).toHaveProperty('apiName', 'strava');
      expect(alertArg).toHaveProperty('type', 'error');
      expect(alertArg).toHaveProperty('subject');
      expect(alertArg).toHaveProperty('message');
      expect(alertArg).toHaveProperty('details');
      expect(alertArg.details).toHaveProperty('status', 401);
      expect(channelsArg).toContain('email');
      expect(channelsArg).toContain('slack');
      
      // Restaurer le mock
      sendAlertSpy.mockRestore();
    });
    
    test('devrait créer une alerte de latence', () => {
      // Espionner la méthode sendAlert
      const sendAlertSpy = jest.spyOn(apiNotificationService, 'sendAlert').mockResolvedValue(true);
      
      // Créer une alerte de latence
      apiNotificationService.createLatencyAlert('openrouteservice', 3500, { endpoint: '/directions' });
      
      // Vérifier si sendAlert a été appelé avec les bons paramètres
      expect(sendAlertSpy).toHaveBeenCalled();
      
      // Vérifier les arguments
      const alertArg = sendAlertSpy.mock.calls[0][0];
      const channelsArg = sendAlertSpy.mock.calls[0][1];
      
      expect(alertArg).toHaveProperty('apiName', 'openrouteservice');
      expect(alertArg).toHaveProperty('type', 'latency');
      expect(alertArg).toHaveProperty('subject');
      expect(alertArg).toHaveProperty('message');
      expect(alertArg).toHaveProperty('details');
      expect(alertArg.details).toHaveProperty('responseTime', 3500);
      expect(alertArg.details).toHaveProperty('endpoint', '/directions');
      expect(channelsArg).toContain('email');
      expect(channelsArg).toContain('slack');
      
      // Restaurer le mock
      sendAlertSpy.mockRestore();
    });
    
    test('devrait créer une alerte de condition de col', () => {
      // Espionner la méthode sendAlert
      const sendAlertSpy = jest.spyOn(apiNotificationService, 'sendAlert').mockResolvedValue(true);
      
      // Créer une alerte de condition de col
      apiNotificationService.createColConditionAlert(
        'Col du Ballon d\'Alsace', 
        'closed', 
        'Le col est fermé en raison de chutes de neige', 
        { temperature: -5, snowDepth: '20cm' }
      );
      
      // Vérifier si sendAlert a été appelé avec les bons paramètres
      expect(sendAlertSpy).toHaveBeenCalled();
      
      // Vérifier les arguments
      const alertArg = sendAlertSpy.mock.calls[0][0];
      const channelsArg = sendAlertSpy.mock.calls[0][1];
      
      expect(alertArg).toHaveProperty('apiName', 'ColsMonitor');
      expect(alertArg).toHaveProperty('type');
      expect(alertArg.type).toContain('col_condition');
      expect(alertArg).toHaveProperty('subject');
      expect(alertArg).toHaveProperty('message');
      expect(alertArg).toHaveProperty('details');
      expect(alertArg.details).toHaveProperty('colName', 'Col du Ballon d\'Alsace');
      expect(alertArg.details).toHaveProperty('status', 'closed');
      expect(alertArg.details).toHaveProperty('temperature', -5);
      expect(alertArg.details).toHaveProperty('snowDepth', '20cm');
      expect(channelsArg).toContain('email');
      expect(channelsArg).toContain('slack');
      
      // Restaurer le mock
      sendAlertSpy.mockRestore();
    });
  });

  describe('Gestion des Notifications', () => {
    test('devrait respecter le délai de refroidissement', async () => {
      // Espionner la méthode d'envoi d'email
      const sendEmailSpy = jest.spyOn(apiNotificationService, 'sendEmailAlert').mockResolvedValue(true);
      
      // Créer une alerte
      const alert = {
        apiName: 'test-api',
        type: 'quota_warning',
        subject: 'Test Alert',
        message: 'This is a test alert',
        details: { test: true }
      };
      
      // Envoyer l'alerte une première fois
      await apiNotificationService.sendAlert(alert, ['email']);
      
      // Vérifier que l'email a été envoyé
      expect(sendEmailSpy).toHaveBeenCalledTimes(1);
      
      // Réinitialiser le mock
      sendEmailSpy.mockClear();
      
      // Envoyer l'alerte une seconde fois immédiatement
      await apiNotificationService.sendAlert(alert, ['email']);
      
      // Vérifier que l'email n'a pas été envoyé de nouveau (délai de refroidissement)
      expect(sendEmailSpy).not.toHaveBeenCalled();
      
      // Restaurer le mock
      sendEmailSpy.mockRestore();
    });
    
    test('devrait envoyer une notification par email', async () => {
      // Espionner la méthode de journalisation
      const logAlertSpy = jest.spyOn(apiNotificationService, 'logAlert').mockImplementation(() => {});
      
      // Configurer un transporteur email mock
      apiNotificationService.emailTransporter = {
        sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
      };
      apiNotificationService.emailConfig.enabled = true;
      
      // Créer une alerte
      const alert = {
        apiName: 'test-api',
        type: 'quota_warning',
        subject: 'Test Email Alert',
        message: 'This is a test email alert',
        details: { test: true }
      };
      
      // Envoyer l'alerte
      const result = await apiNotificationService.sendEmailAlert(alert);
      
      // Vérifier que l'email a été envoyé
      expect(result).toBe(true);
      expect(apiNotificationService.emailTransporter.sendMail).toHaveBeenCalled();
      
      // Vérifier les arguments
      const mailOptions = apiNotificationService.emailTransporter.sendMail.mock.calls[0][0];
      expect(mailOptions).toHaveProperty('subject', alert.subject);
      expect(mailOptions).toHaveProperty('html');
      expect(mailOptions.html).toContain(alert.message);
      
      // Restaurer les mocks
      logAlertSpy.mockRestore();
    });
  });

  describe('Journalisation des Alertes', () => {
    test('devrait journaliser les alertes', () => {
      // Mocker la fonction fs.appendFileSync
      const mockAppendFileSync = jest.spyOn(fs, 'appendFileSync').mockImplementation(() => {});
      const mockExistsSync = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      
      // Créer une alerte
      const alert = {
        apiName: 'test-api',
        type: 'error',
        subject: 'Test Log Alert',
        message: 'This is a test log alert',
        details: { test: true }
      };
      
      // Journaliser l'alerte
      apiNotificationService.logAlert(alert);
      
      // Vérifier que l'alerte a été journalisée
      expect(mockAppendFileSync).toHaveBeenCalled();
      
      // Vérifier les arguments
      const logPath = mockAppendFileSync.mock.calls[0][0];
      const logData = mockAppendFileSync.mock.calls[0][1];
      
      expect(logPath).toContain('logs/alerts.log');
      expect(logData).toContain('test-api');
      expect(logData).toContain('error');
      expect(logData).toContain('Test Log Alert');
      
      // Restaurer les mocks
      mockAppendFileSync.mockRestore();
      mockExistsSync.mockRestore();
    });
  });
});
