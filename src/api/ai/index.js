/**
 * AI API Routes
 * Routes for AI-related functionality
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { securityMiddleware } from '../middleware/security';
import { monitoringService } from '../../services/monitoring';
import chat from './chat';

const router = Router();

// Apply middleware to all AI routes
router.use(authMiddleware.verifyToken);
router.use(securityMiddleware.rateLimit);
router.use(securityMiddleware.validateContentType);
router.use(monitoringService.trackAPIUsage);

/**
 * @route POST /api/ai/chat
 * @desc Process chat message with AI assistant
 * @access Private
 */
router.post('/chat', chat.handleChatRequest);

/**
 * @route GET /api/ai/suggestions
 * @desc Get suggested questions based on user profile
 * @access Private
 */
router.get('/suggestions', async (req, res) => {
  try {
    const userId = req.user.id;
    const language = req.query.language || 'fr';
    
    // In a real implementation, this would use the AI service
    // to generate personalized suggestions based on user data
    
    // For now, return static suggestions based on language
    const suggestions = language === 'fr' 
      ? [
          "Comment améliorer mon endurance cycliste ?",
          "Quels exercices pour grimper plus vite ?",
          "Nutrition avant une sortie longue ?",
          "Comment ajuster ma position sur le vélo ?"
        ]
      : [
          "How can I improve my cycling endurance?",
          "What exercises help climb faster?",
          "Nutrition before a long ride?",
          "How should I adjust my bike position?"
        ];
    
    res.json({ suggestions });
  } catch (error) {
    monitoringService.logError('ai_suggestions', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

/**
 * @route DELETE /api/ai/history/:userId
 * @desc Clear chat history for a user
 * @access Private
 */
router.delete('/history/:userId', authMiddleware.verifyOwnership, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // This would connect to your database service
    // For now, we'll just log it
    console.log(`Clearing chat history for user ${userId}`);
    
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    monitoringService.logError('clear_chat_history', error);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
});

export default router;
