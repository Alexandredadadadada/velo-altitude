/**
 * Utilitaire pour l'API OpenAI
 * Fournit des fonctions pour interagir avec l'API OpenAI
 */
const { Configuration, OpenAIApi } = require('openai');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

class OpenAIUtils {
  constructor() {
    // Initialiser le client OpenAI
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(configuration);
    this.defaultModel = 'gpt-4-turbo';
  }
  
  /**
   * Génère une réponse textuelle à partir d'un prompt
   * @param {string} prompt - Le prompt à envoyer à l'API
   * @param {Object} options - Options supplémentaires pour la requête
   * @param {string} options.model - Modèle à utiliser (par défaut: gpt-4-turbo)
   * @param {number} options.temperature - Température (créativité) de 0 à 1
   * @param {number} options.maxTokens - Nombre maximal de tokens en réponse
   * @returns {Promise<string>} - Texte généré
   */
  async generateText(prompt, options = {}) {
    try {
      const {
        model = this.defaultModel,
        temperature = 0.7,
        maxTokens = 1000,
      } = options;
      
      const response = await this.openai.createCompletion({
        model,
        prompt,
        temperature,
        max_tokens: maxTokens,
      });
      
      return response.data.choices[0].text.trim();
    } catch (error) {
      console.error('Erreur OpenAI API:', error);
      throw new Error(`Erreur lors de la génération de texte: ${error.message}`);
    }
  }
  
  /**
   * Génère une réponse avec le modèle de chat
   * @param {Array} messages - Messages à envoyer à l'API au format [{ role, content }]
   * @param {Object} options - Options supplémentaires pour la requête
   * @param {string} options.model - Modèle à utiliser (par défaut: gpt-4-turbo)
   * @param {number} options.temperature - Température (créativité) de 0 à 1
   * @returns {Promise<string>} - Texte généré
   */
  async chatCompletion(messages, options = {}) {
    try {
      const {
        model = this.defaultModel,
        temperature = 0.7,
      } = options;
      
      const response = await this.openai.createChatCompletion({
        model,
        messages,
        temperature,
      });
      
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Erreur OpenAI Chat API:', error);
      throw new Error(`Erreur lors de la génération de chat: ${error.message}`);
    }
  }
  
  /**
   * Génère des suggestions d'itinéraires à partir d'une description
   * @param {string} description - Description de la sortie souhaitée
   * @param {Object} constraints - Contraintes (distance, dénivelé, difficulté)
   * @returns {Promise<string>} - Suggestions d'itinéraires
   */
  async generateRouteIdeas(description, constraints = {}) {
    const { distance, elevation, difficulty, region } = constraints;
    
    const prompt = `
      Tu es un assistant spécialisé en cyclisme pour la région Grand Est en France.
      Génère des idées d'itinéraires cyclistes détaillées à partir de cette description:
      "${description}"
      
      ${distance ? `Distance souhaitée: environ ${distance} km` : ''}
      ${elevation ? `Dénivelé souhaité: environ ${elevation} m` : ''}
      ${difficulty ? `Niveau de difficulté: ${difficulty}` : ''}
      ${region ? `Région spécifique: ${region}` : ''}
      
      Pour chaque suggestion, inclus:
      1. Nom de l'itinéraire
      2. Points de départ et d'arrivée
      3. Distance et dénivelé estimés
      4. Points d'intérêt le long du parcours
      5. Difficulté et type de terrain
    `;
    
    return this.chatCompletion([{ role: 'user', content: prompt }]);
  }
  
  /**
   * Génère des conseils d'entraînement personnalisés
   * @param {Object} athleteProfile - Profil de l'athlète
   * @param {string} goal - Objectif d'entraînement
   * @returns {Promise<string>} - Plan d'entraînement
   */
  async generateTrainingPlan(athleteProfile, goal) {
    const { level, availableHours, ftp, pastActivities } = athleteProfile;
    
    const prompt = `
      Tu es un coach cycliste professionnel.
      Génère un plan d'entraînement hebdomadaire personnalisé pour un cycliste avec le profil suivant:

      Niveau: ${level}
      Disponibilité: ${availableHours} heures/semaine
      FTP: ${ftp || 'Non spécifié'} watts
      Objectif: ${goal}
      
      Si pertinent, base-toi sur ces activités récentes:
      ${pastActivities ? JSON.stringify(pastActivities) : 'Aucune activité récente'}
      
      Ton plan doit être structuré par jour de la semaine et inclure:
      1. Type de sortie (endurance, intervalles, récupération, etc.)
      2. Durée et intensité
      3. Objectifs spécifiques de chaque séance
      4. Conseils sur la récupération
    `;
    
    return this.chatCompletion([{ role: 'user', content: prompt }]);
  }
}

// Exporter une instance unique
module.exports = new OpenAIUtils();
