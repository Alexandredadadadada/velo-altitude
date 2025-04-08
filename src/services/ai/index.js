/**
 * AI Service
 * Handles communication with AI backend services (Claude/OpenAI)
 */

import { monitoring } from '../monitoring';
import { apiOrchestrator } from '../../api';
import { AI_CONFIG } from './config';
import { i18n } from '../../i18n';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
const MODEL = 'claude-3.7-sonnet'; // Default model

/**
 * AI configuration for cycling-specific assistant
 */
export const aiConfig = {
  model: process.env.REACT_APP_AI_MODEL || MODEL,
  temperature: 0.7,
  maxTokens: 2000,
  contextWindow: 10000,
  specializations: ['cycling', 'training', 'nutrition']
};

/**
 * Service for handling AI functionality
 */
class AIService {
  /**
   * Send a message to the AI assistant
   * @param {Object} params - Parameters for the message
   * @param {string} params.message - User message
   * @param {Array} params.history - Chat history
   * @param {Object} params.context - User context data
   * @param {string} params.language - User language preference
   * @returns {Promise<Object>} AI response
   */
  async sendMessage(params) {
    try {
      const { message, history = [], context = {}, language = 'fr' } = params;
      
      // Prepare message payload
      const payload = {
        message,
        history: history.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        })),
        context,
        language
      };
      
      // Send to API
      const response = await apiOrchestrator.sendAIChatMessage(payload);
      
      return {
        message: response.message,
        suggestedQueries: response.suggestedQueries || []
      };
    } catch (error) {
      console.error('Error sending message to AI:', error);
      throw new Error(i18n.t('ai.errors.messageSendFailed'));
    }
  }
  
  /**
   * Get suggested queries for the AI assistant
   * @param {string} language - User language
   * @returns {Promise<Array>} Suggested queries
   */
  async getSuggestedQueries(language = 'fr') {
    try {
      return await apiOrchestrator.getAISuggestions(language);
    } catch (error) {
      console.error('Error getting suggested queries:', error);
      
      // Return default suggestions if API fails
      return this.getDefaultSuggestions(language);
    }
  }
  
  /**
   * Save chat history for a user
   * @param {string} userId - User ID
   * @param {Array} messages - Chat messages
   * @returns {Promise<void>}
   */
  async saveChatHistory(userId, messages) {
    if (!userId) return;
    
    try {
      await apiOrchestrator.saveAIChatHistory(userId, messages);
    } catch (error) {
      console.error('Error saving chat history:', error);
      // Fall back to local storage
      localStorage.setItem(`chat_history_${userId}`, JSON.stringify(messages));
    }
  }
  
  /**
   * Get chat history for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Chat messages
   */
  async getChatHistory(userId) {
    if (!userId) return [];
    
    try {
      // First try local storage
      const localHistory = localStorage.getItem(`chat_history_${userId}`);
      if (localHistory) {
        return JSON.parse(localHistory);
      }
      
      // Implementation for backend fetch will be added later
      // For now, return empty array if not in localStorage
      return [];
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }
  
  /**
   * Clear chat history for a user
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async clearChatHistory(userId) {
    if (!userId) return;
    
    try {
      await apiOrchestrator.clearAIChatHistory(userId);
    } catch (error) {
      console.error('Error clearing chat history:', error);
      // Fall back to clearing local storage
      localStorage.removeItem(`chat_history_${userId}`);
    }
  }
  
  /**
   * Generate training recommendations
   * @param {Object} athleteData - Athlete profile data
   * @returns {Promise<string>} Training recommendations
   */
  async generateTrainingRecommendations(athleteData) {
    try {
      // Implementation using specialized AI module
      // For now, return mock response
      return `
## Programme d'Entraînement Personnalisé

### Semaine Type
- Lundi: Récupération active (30-45 min, faible intensité)
- Mardi: Intervalles courts (8x1min à FTP+20%, 2min récup)
- Mercredi: Endurance (90-120 min, 65-75% FTP)
- Jeudi: Récupération ou Off
- Vendredi: Sweet Spot (2x20min à 88-94% FTP)
- Samedi: Sortie longue avec dénivelé (3-4h)
- Dimanche: Récupération ou Off

### Progressions suggérées
- Semaine 1-2: Adaptation
- Semaine 3-4: Construction
- Semaine 5: Récupération
- Semaine 6-8: Spécificité (simulation montées)

Continuez ce cycle en ajustant l'intensité et le volume selon vos progrès.
      `;
    } catch (error) {
      console.error('Error generating training recommendations:', error);
      throw new Error(i18n.t('ai.errors.recommendationFailed'));
    }
  }
  
  /**
   * Generate nutritional advice
   * @param {Object} athleteData - Athlete profile data
   * @param {Object} routeDetails - Details about the planned route
   * @returns {Promise<string>} Nutritional advice
   */
  async generateNutritionalAdvice(athleteData, routeDetails) {
    try {
      // Implementation using specialized AI module
      // For now, return mock response
      return `
## Plan Nutritionnel

### Avant la Sortie (${routeDetails.distance}km, ${routeDetails.elevation}m D+)

- 2-3h avant: Repas riche en glucides complexes (100-150g)
  - Exemple: Porridge d'avoine avec banane et miel
  - Hydratation: 500ml eau avec électrolytes

### Pendant l'Effort

- Consommez 60-90g de glucides/heure
- Hydratation: 500-750ml/heure selon température
- Pour cette sortie spécifique:
  - Première heure: 1 barre énergétique
  - Heures suivantes: Alterner gel et boisson énergétique
  - Pour les cols: Prévoir un gel 15min avant chaque montée

### Après l'Effort

- Dans les 30min: Collation 4:1 (glucides:protéines)
  - Exemple: Smoothie avec banane, lait et protéine
- Repas complet dans les 2h
  - Privilégier glucides, protéines de qualité et légumes

Adaptez selon vos sensations et la température extérieure.
      `;
    } catch (error) {
      console.error('Error generating nutritional advice:', error);
      throw new Error(i18n.t('ai.errors.nutritionAdviceFailed'));
    }
  }
  
  /**
   * Get default suggested queries
   * @param {string} language - User language
   * @returns {Array} Default suggested queries
   */
  getDefaultSuggestions(language = 'fr') {
    return language === 'fr' 
      ? AI_CONFIG.defaultSuggestions.fr
      : AI_CONFIG.defaultSuggestions.en;
  }
}

export const aiService = new AIService();
