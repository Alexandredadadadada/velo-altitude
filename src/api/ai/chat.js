/**
 * AI Chat API Endpoint
 * Handles chat requests to AI models (Claude/OpenAI)
 */

import { cacheService } from '../../services/cache';
import { monitoringService } from '../../services/monitoring';
import { securityMiddleware } from '../middleware/security';

// Initialize Anthropic client for Claude API
const anthropic = {
  apiKey: process.env.CLAUDE_API_KEY,
  apiUrl: 'https://api.anthropic.com/v1/messages'
};

// Initialize OpenAI client
const openai = {
  apiKey: process.env.OPENAI_API_KEY,
  apiUrl: 'https://api.openai.com/v1/chat/completions'
};

/**
 * Handle AI chat request
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const handleChatRequest = async (req, res) => {
  // Apply security middleware
  securityMiddleware.rateLimit(req, res);
  securityMiddleware.validateInput(req);
  
  try {
    const { model, messages, temperature, maxTokens, topP, context, userId, language } = req.body;
    
    // Start performance monitoring
    const perfMetric = monitoringService.startMetric('ai_chat_request');
    
    // Check if response is in cache
    const cacheKey = generateCacheKey(messages, context, language);
    const cachedResponse = cacheService.get(cacheKey, 'ai_responses');
    
    if (cachedResponse) {
      monitoringService.recordMetric('ai_chat_cache_hit', 1);
      monitoringService.endMetric(perfMetric);
      return res.status(200).json(cachedResponse);
    }
    
    // Determine which AI provider to use
    const aiProvider = process.env.AI_PROVIDER || 'claude';
    let completion, suggestedQueries;
    
    if (aiProvider === 'claude' && anthropic.apiKey) {
      // Call Claude API
      const response = await callClaudeAPI({
        model: model || 'claude-3-haiku-20240307',
        maxTokens: maxTokens || 4096,
        temperature: temperature || 0.7,
        topP: topP || 0.9,
        messages: formatMessagesForClaude(messages, context, language)
      });
      
      completion = response.completion;
      suggestedQueries = await generateSuggestedQueries(messages, context, language, 'claude');
    } else if (openai.apiKey) {
      // Call OpenAI API
      const response = await callOpenAIAPI({
        model: model || 'gpt-3.5-turbo',
        maxTokens: maxTokens || 4096,
        temperature: temperature || 0.7,
        topP: topP || 0.9,
        messages: formatMessagesForOpenAI(messages, context, language)
      });
      
      completion = response.completion;
      suggestedQueries = await generateSuggestedQueries(messages, context, language, 'openai');
    } else {
      throw new Error('No AI service available');
    }
    
    // Prepare response object
    const responseObject = {
      message: completion,
      suggestedQueries
    };
    
    // Cache response
    cacheService.set(cacheKey, responseObject, 'ai_responses', 30 * 60); // Cache for 30 minutes
    
    // Save chat history if userId is provided
    if (userId) {
      saveUserChatHistory(userId, messages, completion);
    }
    
    // End performance monitoring
    monitoringService.endMetric(perfMetric);
    
    return res.status(200).json(responseObject);
  } catch (error) {
    monitoringService.logError('ai_chat', error);
    return res.status(500).json({ error: 'Error processing AI request', details: error.message });
  }
};

/**
 * Call Claude API
 * @param {Object} params - Claude API parameters
 * @returns {Object} Claude API response
 */
const callClaudeAPI = async (params) => {
  try {
    const response = await fetch(anthropic.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropic.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return { completion: data.content[0].text };
  } catch (error) {
    monitoringService.logError('claude_api', error);
    throw error;
  }
};

/**
 * Call OpenAI API
 * @param {Object} params - OpenAI API parameters
 * @returns {Object} OpenAI API response
 */
const callOpenAIAPI = async (params) => {
  try {
    const response = await fetch(openai.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openai.apiKey}`
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return { completion: data.choices[0].message.content };
  } catch (error) {
    monitoringService.logError('openai_api', error);
    throw error;
  }
};

/**
 * Format messages for Claude API
 * @param {Array} messages - User/assistant messages
 * @param {Object} context - User context
 * @param {string} language - Preferred language
 * @returns {Array} Formatted messages for Claude
 */
const formatMessagesForClaude = (messages, context, language) => {
  // Convert message format to Claude's format
  const claudeMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content
  }));
  
  // Add context as a system message if provided
  let systemContent = 'You are a cycling assistant for Velo-Altitude, specializing in training advice, nutrition, route planning, and equipment recommendations.';
  
  if (context) {
    systemContent += ' Here is some context about the user:\n\n';
    
    if (context.profile) {
      systemContent += `User Profile: ${JSON.stringify(context.profile, null, 2)}\n\n`;
    }
    
    if (context.activities && context.activities.length > 0) {
      systemContent += `Recent Activities: ${JSON.stringify(context.activities, null, 2)}\n\n`;
    }
    
    if (context.weather) {
      systemContent += `Current Weather: ${JSON.stringify(context.weather, null, 2)}\n\n`;
    }
    
    if (context.equipment) {
      systemContent += `User Equipment: ${JSON.stringify(context.equipment, null, 2)}\n\n`;
    }
    
    if (context.goals) {
      systemContent += `User Goals: ${JSON.stringify(context.goals, null, 2)}\n\n`;
    }
  }
  
  // Add language preference
  if (language) {
    systemContent += `\nRespond in: ${language}`;
  }
  
  // Add system message at the beginning
  claudeMessages.unshift({
    role: 'user',
    content: `<system>${systemContent}</system>\n\n`
  });
  
  return claudeMessages;
};

/**
 * Format messages for OpenAI API
 * @param {Array} messages - User/assistant messages
 * @param {Object} context - User context
 * @param {string} language - Preferred language
 * @returns {Array} Formatted messages for OpenAI
 */
const formatMessagesForOpenAI = (messages, context, language) => {
  // Convert message format to OpenAI's format
  const openaiMessages = messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
  
  // Add context as a system message if provided
  let systemContent = 'You are a cycling assistant for Velo-Altitude, specializing in training advice, nutrition, route planning, and equipment recommendations.';
  
  if (context) {
    systemContent += ' Here is some context about the user:\n\n';
    
    if (context.profile) {
      systemContent += `User Profile: ${JSON.stringify(context.profile, null, 2)}\n\n`;
    }
    
    if (context.activities && context.activities.length > 0) {
      systemContent += `Recent Activities: ${JSON.stringify(context.activities, null, 2)}\n\n`;
    }
    
    if (context.weather) {
      systemContent += `Current Weather: ${JSON.stringify(context.weather, null, 2)}\n\n`;
    }
    
    if (context.equipment) {
      systemContent += `User Equipment: ${JSON.stringify(context.equipment, null, 2)}\n\n`;
    }
    
    if (context.goals) {
      systemContent += `User Goals: ${JSON.stringify(context.goals, null, 2)}\n\n`;
    }
  }
  
  // Add language preference
  if (language) {
    systemContent += `\nRespond in: ${language}`;
  }
  
  // Add system message at the beginning
  openaiMessages.unshift({
    role: 'system',
    content: systemContent
  });
  
  return openaiMessages;
};

/**
 * Generate suggested queries based on conversation
 * @param {Array} messages - Chat messages
 * @param {Object} context - User context
 * @param {string} language - Preferred language
 * @param {string} provider - AI provider (claude/openai)
 * @returns {Array} Suggested queries
 */
const generateSuggestedQueries = async (messages, context, language, provider) => {
  try {
    // Create a prompt specifically for generating suggestions
    const promptContent = 'Generate 3-5 brief, relevant follow-up questions about cycling that the user might want to ask next. Keep each suggestion under 60 characters. Format as a JSON array of strings only.';
    
    if (provider === 'claude' && anthropic.apiKey) {
      const claudeMessages = formatMessagesForClaude(messages, context, language);
      
      // Add suggestion-specific prompt
      claudeMessages.push({
        role: 'user',
        content: promptContent
      });
      
      const response = await callClaudeAPI({
        model: 'claude-3-haiku-20240307',
        maxTokens: 400,
        temperature: 0.7,
        messages: claudeMessages
      });
      
      return parseJsonResponse(response.completion);
    } else if (openai.apiKey) {
      const openaiMessages = formatMessagesForOpenAI(messages, context, language);
      
      // Add suggestion-specific prompt
      openaiMessages.push({
        role: 'user',
        content: promptContent
      });
      
      const response = await callOpenAIAPI({
        model: 'gpt-3.5-turbo',
        maxTokens: 400,
        temperature: 0.7,
        messages: openaiMessages
      });
      
      return parseJsonResponse(response.completion);
    }
    
    // Default suggestions if AI generation fails
    return getDefaultSuggestions(language);
  } catch (error) {
    monitoringService.logError('suggested_queries', error);
    return getDefaultSuggestions(language);
  }
};

/**
 * Parse JSON response from AI
 * @param {string} text - AI response text
 * @returns {Array} Parsed suggestions
 */
const parseJsonResponse = (text) => {
  try {
    // Extract JSON array from text
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    
    // If no array found, look for numbered list
    const lines = text.split('\n')
      .filter(line => line.trim() !== '')
      .map(line => line.replace(/^\d+\.\s*/, '').trim());
    
    if (lines.length > 0) {
      return lines;
    }
    
    return [];
  } catch (error) {
    monitoringService.logError('json_parse', error);
    return [];
  }
};

/**
 * Get default suggestions based on language
 * @param {string} language - User language
 * @returns {Array} Default suggestions
 */
const getDefaultSuggestions = (language) => {
  if (language === 'fr') {
    return [
      "Comment améliorer mon endurance ?",
      "Quels exercices pour grimper plus vite ?",
      "Conseils pour récupérer après une longue sortie ?",
      "Nutrition avant une compétition ?"
    ];
  }
  
  return [
    "How can I improve my endurance?",
    "Best exercises for climbing faster?",
    "Recovery tips after a long ride?",
    "Nutrition before a race?"
  ];
};

/**
 * Generate cache key for AI responses
 * @param {Array} messages - Chat messages
 * @param {Object} context - User context
 * @param {string} language - User language
 * @returns {string} Cache key
 */
const generateCacheKey = (messages, context, language) => {
  // Only use the last few messages for the cache key
  const recentMessages = messages.slice(-3);
  
  // Simplify context to avoid cache key bloat
  const simplifiedContext = context ? {
    hasProfile: !!context.profile,
    hasActivities: !!(context.activities && context.activities.length > 0),
    hasWeather: !!context.weather,
    hasEquipment: !!context.equipment,
    hasGoals: !!context.goals
  } : {};
  
  // Create a unique key based on messages, simplified context, and language
  const keyObject = {
    messages: recentMessages.map(m => ({ role: m.role, content: m.content })),
    context: simplifiedContext,
    language
  };
  
  return `chat_${JSON.stringify(keyObject)}`;
};

/**
 * Save user chat history
 * @param {string} userId - User ID
 * @param {Array} messages - Previous messages
 * @param {string} completion - AI response
 */
const saveUserChatHistory = async (userId, messages, completion) => {
  try {
    // This would connect to your database service
    // For now, we'll just log it
    console.log(`Saving chat history for user ${userId}`);
  } catch (error) {
    monitoringService.logError('save_chat_history', error);
  }
};

export default {
  handleChatRequest
};
