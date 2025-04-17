console.log('Loading module...');
console.log('Loading AI Routes...');
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authMiddleware } = require('../middleware/auth');
const { securityMiddleware } = require('../middleware/security');
const { monitoringService } = require('../services/monitoring');

// Apply middleware to all AI routes
router.use(authMiddleware.verifyToken);
router.use(securityMiddleware.rateLimit);
router.use(securityMiddleware.validateContentType);
router.use(monitoringService.trackAPIUsage);

// Route pour obtenir une réponse de l'assistant IA
router.post('/assistant', (req, res, next) => {
  console.log('Received chat request');
  aiController.handleChatRequest(req, res, next);
});

// Route pour obtenir des suggestions basées sur le profil
router.get('/suggestions', (req, res, next) => {
  console.log('Received suggestions request');
  aiController.getSuggestions(req, res, next);
});

// Route pour obtenir des recommandations d'itinéraires
router.post('/route-recommendations', (req, res, next) => {
  console.log('Received route recommendations request');
  aiController.getRouteRecommendations(req, res, next);
});

// Route pour obtenir des conseils d'entraînement
router.post('/training-advice', (req, res, next) => {
  console.log('Received training advice request');
  aiController.getTrainingAdvice(req, res, next);
});

// Route pour obtenir des conseils nutritionnels
router.post('/nutrition-advice', (req, res, next) => {
  console.log('Received nutrition advice request');
  aiController.getNutritionAdvice(req, res, next);
});

// Route pour gérer l'historique des conversations
router.delete('/history/:userId', authMiddleware.verifyOwnership, (req, res, next) => {
  console.log('Received chat history deletion request');
  aiController.clearChatHistory(req, res, next);
});

module.exports = router;
