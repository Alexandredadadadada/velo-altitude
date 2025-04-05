/**
 * Utilitaire pour l'API Claude (Anthropic)
 * Fournit des fonctions pour interagir avec l'API Claude
 */
const axios = require('axios');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

class ClaudeApiUtils {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY;
    this.baseUrl = 'https://api.anthropic.com/v1';
    this.defaultModel = 'claude-3-opus-20240229';
    this.apiVersion = '2023-06-01';
  }
  
  /**
   * Génère une réponse textuelle à partir d'un prompt
   * @param {string} prompt - Le prompt à envoyer à l'API
   * @param {Object} options - Options supplémentaires pour la requête
   * @param {string} options.model - Modèle à utiliser
   * @param {number} options.maxTokens - Nombre maximal de tokens en réponse
   * @param {number} options.temperature - Température (créativité) de 0 à 1
   * @returns {Promise<string>} - Texte généré
   */
  async generateText(prompt, options = {}) {
    try {
      const {
        model = this.defaultModel,
        maxTokens = 1000,
        temperature = 0.7
      } = options;
      
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          model,
          max_tokens: maxTokens,
          temperature,
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': this.apiVersion,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.content[0].text;
    } catch (error) {
      console.error('Erreur Claude API:', error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Génère une réponse à partir d'une série de messages
   * @param {Array} messages - Messages à envoyer à l'API au format [{ role, content }]
   * @param {Object} options - Options supplémentaires pour la requête
   * @param {string} options.model - Modèle à utiliser
   * @param {number} options.maxTokens - Nombre maximal de tokens en réponse
   * @param {number} options.temperature - Température (créativité) de 0 à 1
   * @returns {Promise<string>} - Texte généré
   */
  async generateConversation(messages, options = {}) {
    try {
      const {
        model = this.defaultModel,
        maxTokens = 1000,
        temperature = 0.7
      } = options;
      
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          model,
          max_tokens: maxTokens,
          temperature,
          messages
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': this.apiVersion,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.content[0].text;
    } catch (error) {
      console.error('Erreur Claude API:', error.response?.data || error.message);
      throw error;
    }
  }
  
  /**
   * Analyse un itinéraire cycliste et génère des recommandations
   * @param {Object} routeData - Données de l'itinéraire à analyser
   * @returns {Promise<Object>} - Recommandations et analyse
   */
  async analyzeRoute(routeData) {
    const prompt = `
      Tu es un expert en cyclisme avec une connaissance approfondie de la région Grand Est en France.
      Analyse cet itinéraire cycliste et fournis des recommandations:
      
      ${JSON.stringify(routeData, null, 2)}
      
      Dans ton analyse, inclus:
      1. Points forts de l'itinéraire
      2. Difficultés à anticiper
      3. Meilleures périodes pour réaliser ce parcours
      4. Conseils pour le matériel et l'équipement
      5. Suggestions d'alternatives pour certains segments si pertinent
    `;
    
    const analysis = await this.generateText(prompt);
    
    // Structurer la réponse
    return {
      analysis,
      routeId: routeData.id,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Génère une description détaillée d'un col cycliste
   * @param {Object} colData - Données du col
   * @returns {Promise<string>} - Description détaillée
   */
  async generateColDescription(colData) {
    const prompt = `
      Tu es un guide cycliste spécialisé dans les cols et montées de la région Grand Est.
      Génère une description détaillée et attrayante de ce col cycliste:
      
      ${JSON.stringify(colData, null, 2)}
      
      Ta description doit être vivante et inclure:
      1. L'expérience globale et les sensations de l'ascension
      2. Les aspects historiques ou culturels intéressants du col
      3. Les défis spécifiques et comment les aborder (pentes, virages)
      4. Les vues et points d'intérêt remarquables
      5. Des conseils pratiques pour bien réussir cette ascension
    `;
    
    return this.generateText(prompt);
  }
}

// Exporter une instance unique
module.exports = new ClaudeApiUtils();
