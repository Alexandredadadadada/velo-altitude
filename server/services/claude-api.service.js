/**
 * Service d'intégration avec l'API Claude d'Anthropic
 * Fournit les fonctionnalités d'IA avancées pour les recommandations et analyses
 */

const axios = require('axios');
const logger = require('../utils/logger');

class ClaudeApiService {
  constructor() {
    // Vérifier que la clé API est configurée
    if (!process.env.CLAUDE_API_KEY) {
      logger.error('CLAUDE_API_KEY non configurée dans les variables d\'environnement');
      throw new Error('CLAUDE_API_KEY manquante');
    }
    
    this.apiKey = process.env.CLAUDE_API_KEY;
    this.baseUrl = 'https://api.anthropic.com/v1';
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      }
    });
    
    logger.info('Service Claude API initialisé');
  }
  
  /**
   * Génère une réponse via l'API Claude
   * @param {string} prompt - Le prompt à envoyer à Claude
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<string>} - La réponse générée
   */
  async generateResponse(prompt, options = {}) {
    try {
      const defaultOptions = {
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        temperature: 0.7
      };
      
      const requestOptions = { ...defaultOptions, ...options };
      
      const response = await this.client.post('/messages', {
        model: requestOptions.model,
        max_tokens: requestOptions.max_tokens,
        temperature: requestOptions.temperature,
        messages: [
          { role: 'user', content: prompt }
        ]
      });
      
      return response.data.content[0].text;
    } catch (error) {
      logger.error(`Erreur lors de l'appel à Claude API: ${error.message}`);
      throw new Error(`Échec de la génération de réponse: ${error.message}`);
    }
  }
}

module.exports = new ClaudeApiService();
