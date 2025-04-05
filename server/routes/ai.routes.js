// ai.routes.js - Routes pour l'intégration avec l'API OpenAI
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');

// Route pour obtenir une réponse de l'assistant IA
router.post('/assistant', aiController.getAssistantResponse);

// Route pour obtenir des recommandations d'itinéraires
router.post('/route-recommendations', aiController.getRouteRecommendations);

// Route pour obtenir des conseils d'entraînement
router.post('/training-advice', aiController.getTrainingAdvice);

// Route pour obtenir des conseils nutritionnels
router.post('/nutrition-advice', aiController.getNutritionAdvice);

module.exports = router;
