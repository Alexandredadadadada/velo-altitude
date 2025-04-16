/**
 * AI API Client
 * Client-side API calls for AI functionality
 */

import { ENV } from '../../config/environment';

const API_BASE_URL = ENV.app.apiUrl || '';

/**
 * API client for AI-related endpoints
 */
export const aiClient = {
  /**
   * Send a chat message to the AI
   * @param {Object} payload - Message payload
   * @returns {Promise<Object>} AI response
   */
  async sendChatMessage(payload) {
    const response = await fetch(`${API_BASE_URL}/api/ai/assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`AI chat request failed: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get route recommendations
   * @param {Object} params - Parameters for recommendations
   * @returns {Promise<Object>} Recommendations
   */
  async getRouteRecommendations(params) {
    const response = await fetch(`${API_BASE_URL}/api/ai/route-recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`Failed to get route recommendations: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get training advice
   * @param {Object} params - Training parameters
   * @returns {Promise<Object>} Training advice
   */
  async getTrainingAdvice(params) {
    const response = await fetch(`${API_BASE_URL}/api/ai/training-advice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`Failed to get training advice: ${response.statusText}`);
    }

    return response.json();
  },

  /**
   * Get nutrition advice
   * @param {Object} params - Nutrition parameters
   * @returns {Promise<Object>} Nutrition advice
   */
  async getNutritionAdvice(params) {
    const response = await fetch(`${API_BASE_URL}/api/ai/nutrition-advice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`Failed to get nutrition advice: ${response.statusText}`);
    }

    return response.json();
  }
};

export default aiClient;
