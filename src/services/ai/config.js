/**
 * AI Service Configuration
 * This file contains configuration for different AI models
 */

export const aiConfig = {
  // Claude AI configuration
  claude: {
    model: 'claude-3-haiku-20240307',
    temperature: 0.7,
    maxTokens: 1024,
    topP: 0.9,
    baseUrl: '/api/ai/claude',
  },
  
  // OpenAI configuration
  openai: {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1024,
    topP: 0.9,
    baseUrl: '/api/ai/openai',
  },
  
  // Response caching configuration
  cache: {
    enabled: true,
    ttl: 30 * 60 * 1000, // 30 minutes
    maxSize: 100, // Maximum number of cached responses
  },
  
  // Default language and fallback settings
  defaults: {
    language: 'fr',
    welcomeMessage: {
      fr: 'Bonjour ! Je suis votre assistant cyclisme. Comment puis-je vous aider aujourd\'hui ?',
      en: 'Hello! I\'m your cycling assistant. How can I help you today?'
    },
    errorMessage: {
      fr: 'Désolé, j\'ai rencontré une erreur. Veuillez réessayer.',
      en: 'Sorry, I encountered an error. Please try again.'
    }
  }
};
