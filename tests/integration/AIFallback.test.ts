import { jest } from '@jest/globals';
import axios from 'axios';
import { AIService } from '../../src/api/orchestration/services/ai';

// Mock axios
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

// Mock environment variables
process.env.CLAUDE_API_KEY = 'mock-claude-key';
process.env.OPENAI_API_KEY = 'mock-openai-key';

// Mock monitoring service
jest.mock('../../src/monitoring', () => ({
  default: {
    trackEvent: jest.fn(),
    trackError: jest.fn(),
    trackMetric: jest.fn(),
    logApiCall: jest.fn()
  }
}));

// Mock caching service
jest.mock('../../src/services/cache', () => ({
  cacheService: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn(),
    invalidate: jest.fn()
  }
}));

describe('AI Service Fallback Tests', () => {
  let aiService: AIService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    aiService = new AIService();
  });
  
  describe('Claude to OpenAI Fallback', () => {
    const mockAthleteData = {
      username: 'testUser',
      age: 35,
      weight: 75,
      height: 180,
      ftp: 250,
      trainingDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
      trainingHoursPerWeek: 8,
      preferredTerrains: ['mountains', 'hills'],
      cyclingExperience: 'intermediate'
    };

    it('should use Claude as primary service when available', async () => {
      // Mock successful response from Claude
      mockAxios.post.mockImplementationOnce((url) => {
        if (url.includes('anthropic.com')) {
          return Promise.resolve({
            data: {
              content: [{ text: 'Claude training recommendation response' }]
            }
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const result = await aiService.generateTrainingRecommendations(mockAthleteData);
      
      // Verify Claude was called and result was processed
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'mock-claude-key'
          })
        })
      );
      expect(result).toBe('Claude training recommendation response');
    });

    it('should fall back to OpenAI when Claude API fails', async () => {
      // Mock Claude failure then OpenAI success
      mockAxios.post.mockImplementationOnce((url) => {
        if (url.includes('anthropic.com')) {
          return Promise.reject(new Error('Claude service unavailable'));
        }
        return Promise.resolve({});
      }).mockImplementationOnce((url) => {
        if (url.includes('openai.com')) {
          return Promise.resolve({
            data: {
              choices: [{ message: { content: 'OpenAI training recommendation response' } }]
            }
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const result = await aiService.generateTrainingRecommendations(mockAthleteData);
      
      // Verify OpenAI fallback occurred
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-openai-key'
          })
        })
      );
      expect(result).toBe('OpenAI training recommendation response');
    });
    
    it('should handle complete failure when both Claude and OpenAI are unavailable', async () => {
      // Mock both services failing
      mockAxios.post.mockRejectedValue(new Error('AI services unavailable'));

      try {
        await aiService.generateTrainingRecommendations(mockAthleteData);
        fail('Should have thrown an error when all AI providers fail');
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toBe('No AI service available');
      }
      
      // Verify monitoring was called to track the complete failure
      const monitoring = require('../../src/monitoring').default;
      expect(monitoring.trackError).toHaveBeenCalled();
    });
  });

  describe('AI Chat Service Fallback', () => {
    const mockMessages = [
      { role: 'user', content: 'How can I improve my climbing performance?' }
    ];
    
    const mockContext = {
      profile: {
        experience: 'intermediate',
        preferredTerrains: ['mountains']
      }
    };

    it('should use Claude for chat when available', async () => {
      // Mock successful response from Claude
      mockAxios.post.mockImplementationOnce((url) => {
        if (url.includes('anthropic.com')) {
          return Promise.resolve({
            data: {
              content: [{ text: 'Claude chat response about climbing' }]
            }
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const result = await aiService.sendChatMessage(mockMessages, mockContext);
      
      // Verify Claude was used for chat
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.any(Object),
        expect.any(Object)
      );
      expect(result).toBe('Claude chat response about climbing');
    });

    it('should fall back to OpenAI for chat when Claude fails', async () => {
      // Mock Claude failure then OpenAI success
      mockAxios.post.mockImplementationOnce((url) => {
        if (url.includes('anthropic.com')) {
          return Promise.reject(new Error('Claude service unavailable'));
        }
        return Promise.resolve({});
      }).mockImplementationOnce((url) => {
        if (url.includes('openai.com')) {
          return Promise.resolve({
            data: {
              choices: [{ message: { content: 'OpenAI chat response about climbing' } }]
            }
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const result = await aiService.sendChatMessage(mockMessages, mockContext);
      
      // Verify OpenAI fallback occurred for chat
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.any(Object),
        expect.any(Object)
      );
      expect(result).toBe('OpenAI chat response about climbing');
    });

    it('should handle different prompt formats between Claude and OpenAI', async () => {
      // Mock Claude failure then OpenAI success
      mockAxios.post.mockImplementationOnce((url) => {
        if (url.includes('anthropic.com')) {
          return Promise.reject(new Error('Claude service unavailable'));
        }
        return Promise.resolve({});
      }).mockImplementationOnce((url) => {
        if (url.includes('openai.com')) {
          return Promise.resolve({
            data: {
              choices: [{ message: { content: 'OpenAI response' } }]
            }
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      await aiService.sendChatMessage(mockMessages, mockContext);
      
      // Extract the message format sent to OpenAI
      const openAICall = mockAxios.post.mock.calls.find(call => 
        call[0].includes('openai.com')
      );
      
      expect(openAICall).toBeDefined();
      const messageFormat = openAICall?.[1].messages;
      
      // Verify the correct message format transformation for OpenAI
      expect(messageFormat).toBeDefined();
      expect(Array.isArray(messageFormat)).toBe(true);
      
      // Should include a system message
      const systemMessage = messageFormat.find(m => m.role === 'system');
      expect(systemMessage).toBeDefined();
      
      // Should include the user message
      const userMessage = messageFormat.find(m => m.role === 'user');
      expect(userMessage).toBeDefined();
      expect(userMessage.content).toBe('How can I improve my climbing performance?');
    });
  });
  
  describe('Nutrition Recommendations Fallback', () => {
    const mockAthleteData = { weight: 75, experience: 'intermediate' };
    const mockRouteDetails = { distance: 100, elevation: 2000 };

    it('should fall back to OpenAI for nutrition recommendations when Claude fails', async () => {
      // Mock Claude failure then OpenAI success
      mockAxios.post.mockImplementationOnce((url) => {
        if (url.includes('anthropic.com')) {
          return Promise.reject(new Error('Claude service unavailable'));
        }
        return Promise.resolve({});
      }).mockImplementationOnce((url) => {
        if (url.includes('openai.com')) {
          return Promise.resolve({
            data: {
              choices: [{ message: { content: 'OpenAI nutrition recommendation' } }]
            }
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      const result = await aiService.getNutritionRecommendations(mockAthleteData, mockRouteDetails);
      
      expect(result).toBe('OpenAI nutrition recommendation');
    });
  });
});
