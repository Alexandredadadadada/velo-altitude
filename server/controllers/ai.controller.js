console.log('Loading AI Controller module...');

const aiService = require('../services/ai.service');
const cacheService = require('../services/cache.service');
const monitoringService = require('../services/api-monitoring.service');
const logger = require('../config/logger');

/**
 * Handle chat request with AI assistant
 */
exports.handleChatRequest = async (req, res) => {
  try {
    console.log('Handling chat request...');
    const { message, history, context, language } = req.body;
    const response = await aiService.processChat(message, history, context, language);
    res.json(response);
  } catch (error) {
    console.error('AI Chat Error:', error);
    monitoringService.logError('ai_chat', error);
    res.status(500).json({ error: 'Error processing chat request' });
  }
};

/**
 * Get suggested questions based on user profile
 */
exports.getSuggestions = async (req, res) => {
  try {
    console.log('Getting suggestions...');
    const userId = req.user.id;
    const language = req.query.language || 'fr';
    const suggestions = await aiService.getSuggestions(userId, language);
    res.json({ suggestions });
  } catch (error) {
    console.error('AI Suggestions Error:', error);
    monitoringService.logError('ai_suggestions', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
};

/**
 * Get route recommendations
 */
exports.getRouteRecommendations = async (req, res) => {
  try {
    console.log('Getting route recommendations...');
    const response = await aiService.getRouteRecommendations(req.body);
    res.json(response);
  } catch (error) {
    console.error('AI Route Recommendations Error:', error);
    monitoringService.logError('ai_route_recommendations', error);
    res.status(500).json({ error: 'Failed to get route recommendations' });
  }
};

/**
 * Get training advice
 */
exports.getTrainingAdvice = async (req, res) => {
  try {
    console.log('Getting training advice...');
    const response = await aiService.getTrainingAdvice(req.body);
    res.json(response);
  } catch (error) {
    console.error('AI Training Advice Error:', error);
    monitoringService.logError('ai_training_advice', error);
    res.status(500).json({ error: 'Failed to get training advice' });
  }
};

/**
 * Get nutrition advice
 */
exports.getNutritionAdvice = async (req, res) => {
  try {
    console.log('Getting nutrition advice...');
    const response = await aiService.getNutritionAdvice(req.body);
    res.json(response);
  } catch (error) {
    console.error('AI Nutrition Advice Error:', error);
    monitoringService.logError('ai_nutrition_advice', error);
    res.status(500).json({ error: 'Failed to get nutrition advice' });
  }
};

/**
 * Clear chat history
 */
exports.clearChatHistory = async (req, res) => {
  try {
    console.log('Clearing chat history...');
    const { userId } = req.params;
    await aiService.clearChatHistory(userId);
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error('Clear Chat History Error:', error);
    monitoringService.logError('clear_chat_history', error);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
};
