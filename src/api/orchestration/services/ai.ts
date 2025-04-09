import axios from 'axios';
import apiMetricsService from '../../../../src/monitoring/api-metrics';
import monitoringService from '../../../../src/monitoring';

export interface AthleteData {
  id: string;
  name: string;
  weight?: number;
  height?: number;
  ftp?: number;
  activities?: any[];
  preferences?: {
    trainingDays?: string[];
    preferredIntensity?: string;
    cyclingGoals?: string[];
    preferredTerrain?: string[];
  };
  routes?: any[];
  experience?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatContext {
  userProfile?: any;
  recentActivities?: any[];
  weatherData?: any;
  equipment?: any[];
  goals?: string[];
  language?: string;
}

export class AIService {
  private claudeApiKey: string;
  private openaiApiKey: string;
  
  constructor() {
    this.claudeApiKey = process.env.CLAUDE_API_KEY || '';
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
  }
  
  // Generate training recommendations based on athlete data
  async generateTrainingRecommendations(athleteData: AthleteData) {
    const startTime = Date.now();
    let success = false;
    let usedFallback = false;
    let provider = 'claude';
    
    try {
      // Try Claude first
      try {
        if (this.claudeApiKey) {
          const startApiCall = Date.now();
          const result = await this.claudeRecommendation(athleteData);
          const duration = Date.now() - startApiCall;
          
          // Track successful API call
          apiMetricsService.trackAPICall(
            'claude',
            'training_recommendations',
            duration,
            true,
            { athleteId: athleteData.id }
          );
          
          success = true;
          return result;
        }
      } catch (error) {
        console.warn('Claude API failed, falling back to OpenAI', error);
        
        // Track API error
        apiMetricsService.trackAPIError(
          'claude',
          'training_recommendations',
          error as Error,
          { athleteId: athleteData.id }
        );
        
        // Use fallback
        usedFallback = true;
        provider = 'openai';
      }
      
      // Fallback to OpenAI
      if (this.openaiApiKey) {
        const startApiCall = Date.now();
        const result = await this.openaiRecommendation(athleteData);
        const duration = Date.now() - startApiCall;
        
        // Track successful fallback API call
        apiMetricsService.trackAPICall(
          'openai',
          'training_recommendations',
          duration,
          true,
          { athleteId: athleteData.id, fallback: true }
        );
        
        // Track fallback usage
        if (usedFallback) {
          apiMetricsService.trackFallbackUsage(
            'claude',
            'openai',
            'api_error',
            { athleteId: athleteData.id }
          );
        }
        
        success = true;
        return result;
      }
      
      throw new Error('No AI service available');
    } catch (error) {
      // Track overall failure
      monitoringService.trackError(
        'All AI services failed for training recommendations',
        error as Error,
        { athleteId: athleteData.id, providers: usedFallback ? ['claude', 'openai'] : [provider] }
      );
      
      throw error;
    } finally {
      // Track overall duration
      const totalTime = Date.now() - startTime;
      monitoringService.trackMetric('ai_request_time', totalTime, {
        operation: 'generateTrainingRecommendations',
        usedFallback,
        success
      });
    }
  }

  // Get nutritional recommendations for cycling
  async getNutritionRecommendations(athleteData: AthleteData, routeDetails: any) {
    const startTime = Date.now();
    let success = false;
    let usedFallback = false;
    
    try {
      try {
        if (this.claudeApiKey) {
          const startApiCall = Date.now();
          const result = await this.claudeNutritionRecommendation(athleteData, routeDetails);
          const duration = Date.now() - startApiCall;
          
          // Track successful API call
          apiMetricsService.trackAPICall(
            'claude',
            'nutrition_recommendations',
            duration,
            true,
            { 
              athleteId: athleteData.id,
              routeId: routeDetails.id || 'unknown'
            }
          );
          
          success = true;
          return result;
        }
      } catch (error) {
        console.warn('Claude API failed for nutrition recommendations, falling back to OpenAI', error);
        
        // Track API error
        apiMetricsService.trackAPIError(
          'claude',
          'nutrition_recommendations',
          error as Error,
          { 
            athleteId: athleteData.id,
            routeId: routeDetails.id || 'unknown'
          }
        );
        
        usedFallback = true;
      }
      
      if (this.openaiApiKey) {
        const startApiCall = Date.now();
        const result = await this.openAINutritionRecommendation(athleteData, routeDetails);
        const duration = Date.now() - startApiCall;
        
        // Track successful fallback API call
        apiMetricsService.trackAPICall(
          'openai',
          'nutrition_recommendations',
          duration,
          true,
          { 
            athleteId: athleteData.id,
            routeId: routeDetails.id || 'unknown',
            fallback: true
          }
        );
        
        // Track fallback usage
        if (usedFallback) {
          apiMetricsService.trackFallbackUsage(
            'claude',
            'openai',
            'api_error',
            { 
              athleteId: athleteData.id,
              routeId: routeDetails.id || 'unknown'
            }
          );
        }
        
        success = true;
        return result;
      }
      
      throw new Error('No AI service available for nutrition recommendations');
    } catch (error) {
      // Track overall failure
      monitoringService.trackError(
        'All AI services failed for nutrition recommendations',
        error as Error,
        { 
          athleteId: athleteData.id,
          routeId: routeDetails.id || 'unknown'
        }
      );
      
      throw error;
    } finally {
      // Track overall duration
      const totalTime = Date.now() - startTime;
      monitoringService.trackMetric('ai_request_time', totalTime, {
        operation: 'getNutritionRecommendations',
        usedFallback,
        success
      });
    }
  }

  // Get equipment recommendations based on route and weather
  async getEquipmentRecommendations(routeDetails: any, weatherData: any) {
    const startTime = Date.now();
    let success = false;
    let usedFallback = false;
    
    try {
      try {
        if (this.claudeApiKey) {
          const startApiCall = Date.now();
          const result = await this.claudeEquipmentRecommendation(routeDetails, weatherData);
          const duration = Date.now() - startApiCall;
          
          // Track successful API call
          apiMetricsService.trackAPICall(
            'claude',
            'equipment_recommendations',
            duration,
            true,
            { 
              routeId: routeDetails.id || 'unknown',
              weatherCondition: weatherData.condition || 'unknown'
            }
          );
          
          success = true;
          return result;
        }
      } catch (error) {
        console.warn('Claude API failed for equipment recommendations, falling back to OpenAI', error);
        
        // Track API error
        apiMetricsService.trackAPIError(
          'claude',
          'equipment_recommendations',
          error as Error,
          { 
            routeId: routeDetails.id || 'unknown',
            weatherCondition: weatherData.condition || 'unknown'
          }
        );
        
        usedFallback = true;
      }
      
      if (this.openaiApiKey) {
        const startApiCall = Date.now();
        const result = await this.openAIEquipmentRecommendation(routeDetails, weatherData);
        const duration = Date.now() - startApiCall;
        
        // Track successful fallback API call
        apiMetricsService.trackAPICall(
          'openai',
          'equipment_recommendations',
          duration,
          true,
          { 
            routeId: routeDetails.id || 'unknown',
            weatherCondition: weatherData.condition || 'unknown',
            fallback: true
          }
        );
        
        // Track fallback usage
        if (usedFallback) {
          apiMetricsService.trackFallbackUsage(
            'claude',
            'openai',
            'api_error',
            { 
              routeId: routeDetails.id || 'unknown',
              weatherCondition: weatherData.condition || 'unknown'
            }
          );
        }
        
        success = true;
        return result;
      }
      
      throw new Error('No AI service available for equipment recommendations');
    } catch (error) {
      // Track overall failure
      monitoringService.trackError(
        'All AI services failed for equipment recommendations',
        error as Error,
        { 
          routeId: routeDetails.id || 'unknown',
          weatherCondition: weatherData.condition || 'unknown'
        }
      );
      
      throw error;
    } finally {
      // Track overall duration
      const totalTime = Date.now() - startTime;
      monitoringService.trackMetric('ai_request_time', totalTime, {
        operation: 'getEquipmentRecommendations',
        usedFallback,
        success
      });
    }
  }

  // Chat with the AI assistant
  async sendChatMessage(messages: ChatMessage[], context?: ChatContext) {
    const startTime = Date.now();
    let success = false;
    let usedFallback = false;
    
    try {
      try {
        if (this.claudeApiKey) {
          const startApiCall = Date.now();
          const result = await this.claudeChatMessage(messages, context);
          const duration = Date.now() - startApiCall;
          
          // Track successful API call
          apiMetricsService.trackAPICall(
            'claude',
            'chat_message',
            duration,
            true,
            { 
              messageCount: messages.length,
              hasContext: !!context
            }
          );
          
          success = true;
          return result;
        }
      } catch (error) {
        console.warn('Claude API failed for chat message, falling back to OpenAI', error);
        
        // Track API error
        apiMetricsService.trackAPIError(
          'claude',
          'chat_message',
          error as Error,
          { 
            messageCount: messages.length,
            hasContext: !!context
          }
        );
        
        usedFallback = true;
      }
      
      if (this.openaiApiKey) {
        const startApiCall = Date.now();
        const result = await this.openAIChatMessage(messages, context);
        const duration = Date.now() - startApiCall;
        
        // Track successful fallback API call
        apiMetricsService.trackAPICall(
          'openai',
          'chat_message',
          duration,
          true,
          { 
            messageCount: messages.length,
            hasContext: !!context,
            fallback: true
          }
        );
        
        // Track fallback usage
        if (usedFallback) {
          apiMetricsService.trackFallbackUsage(
            'claude',
            'openai',
            'api_error',
            { 
              messageCount: messages.length,
              hasContext: !!context
            }
          );
        }
        
        success = true;
        return result;
      }
      
      throw new Error('No AI service available for chat');
    } catch (error) {
      // Track overall failure
      monitoringService.trackError(
        'All AI services failed for chat message',
        error as Error,
        { 
          messageCount: messages.length,
          hasContext: !!context
        }
      );
      
      throw error;
    } finally {
      // Track overall duration
      const totalTime = Date.now() - startTime;
      monitoringService.trackMetric('ai_request_time', totalTime, {
        operation: 'sendChatMessage',
        usedFallback,
        success
      });
    }
  }

  // Generate suggested queries based on conversation history
  async getSuggestedQueries(messages: ChatMessage[], context?: ChatContext) {
    const startTime = Date.now();
    let success = false;
    let usedFallback = false;
    
    try {
      try {
        if (this.claudeApiKey) {
          const startApiCall = Date.now();
          const result = await this.claudeSuggestedQueries(messages, context);
          const duration = Date.now() - startApiCall;
          
          // Track successful API call
          apiMetricsService.trackAPICall(
            'claude',
            'suggested_queries',
            duration,
            true,
            { 
              messageCount: messages.length,
              hasContext: !!context
            }
          );
          
          success = true;
          return result;
        }
      } catch (error) {
        console.warn('Claude API failed for suggested queries, falling back to OpenAI', error);
        
        // Track API error
        apiMetricsService.trackAPIError(
          'claude',
          'suggested_queries',
          error as Error,
          { 
            messageCount: messages.length,
            hasContext: !!context
          }
        );
        
        usedFallback = true;
      }
      
      if (this.openaiApiKey) {
        const startApiCall = Date.now();
        const result = await this.openAISuggestedQueries(messages, context);
        const duration = Date.now() - startApiCall;
        
        // Track successful fallback API call
        apiMetricsService.trackAPICall(
          'openai',
          'suggested_queries',
          duration,
          true,
          { 
            messageCount: messages.length,
            hasContext: !!context,
            fallback: true
          }
        );
        
        // Track fallback usage
        if (usedFallback) {
          apiMetricsService.trackFallbackUsage(
            'claude',
            'openai',
            'api_error',
            { 
              messageCount: messages.length,
              hasContext: !!context
            }
          );
        }
        
        success = true;
        return result;
      }
      
      throw new Error('No AI service available for suggested queries');
    } catch (error) {
      // Track overall failure
      monitoringService.trackError(
        'All AI services failed for suggested queries',
        error as Error,
        { 
          messageCount: messages.length,
          hasContext: !!context
        }
      );
      
      throw error;
    } finally {
      // Track overall duration
      const totalTime = Date.now() - startTime;
      monitoringService.trackMetric('ai_request_time', totalTime, {
        operation: 'getSuggestedQueries',
        usedFallback,
        success
      });
    }
  }

  private async claudeRecommendation(athleteData: AthleteData) {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a professional cycling coach. Based on this athlete data, provide a personalized training plan focused on mountain climbing:
          ${JSON.stringify(athleteData, null, 2)}
          
          Format the response in these sections:
          1. Weekly Schedule (based on available training days)
          2. Key Workouts (2-3 structured sessions)
          3. Specific Mountain Climbing Focus
          4. Recovery Recommendations
          5. Progress Tracking Metrics`
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.claudeApiKey,
        'anthropic-version': '2023-06-01'
      }
    });
    
    return response.data.content[0].text;
  }
  
  private async openaiRecommendation(athleteData: AthleteData) {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional cycling coach providing personalized training advice for mountain climbing.'
        },
        {
          role: 'user',
          content: `Based on this athlete data, provide a personalized training plan focused on mountain climbing:
          ${JSON.stringify(athleteData, null, 2)}
          
          Format the response in these sections:
          1. Weekly Schedule (based on available training days)
          2. Key Workouts (2-3 structured sessions)
          3. Specific Mountain Climbing Focus
          4. Recovery Recommendations
          5. Progress Tracking Metrics`
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`
      }
    });
    
    return response.data.choices[0].message.content;
  }
  
  private async claudeNutritionRecommendation(athleteData: AthleteData, routeDetails: any) {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a sports nutritionist specializing in cycling. Based on this athlete data and route details, provide nutritional recommendations:
          
          Athlete: ${JSON.stringify(athleteData, null, 2)}
          
          Route: ${JSON.stringify(routeDetails, null, 2)}
          
          Format the response in these sections:
          1. Pre-Ride Nutrition (timing and meal composition)
          2. During-Ride Fueling Strategy (by hour)
          3. Hydration Plan (based on weather and intensity)
          4. Post-Ride Recovery Nutrition
          5. Key Nutrients for Mountain Climbing Performance`
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.claudeApiKey,
        'anthropic-version': '2023-06-01'
      }
    });
    
    return response.data.content[0].text;
  }
  
  private async openAINutritionRecommendation(athleteData: AthleteData, routeDetails: any) {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a sports nutritionist specializing in cycling nutrition strategies.'
        },
        {
          role: 'user',
          content: `Based on this athlete data and route details, provide nutritional recommendations:
          
          Athlete: ${JSON.stringify(athleteData, null, 2)}
          
          Route: ${JSON.stringify(routeDetails, null, 2)}
          
          Format the response in these sections:
          1. Pre-Ride Nutrition (timing and meal composition)
          2. During-Ride Fueling Strategy (by hour)
          3. Hydration Plan (based on weather and intensity)
          4. Post-Ride Recovery Nutrition
          5. Key Nutrients for Mountain Climbing Performance`
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`
      }
    });
    
    return response.data.choices[0].message.content;
  }
  
  private async claudeEquipmentRecommendation(routeDetails: any, weatherData: any) {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a cycling equipment expert. Based on these route details and weather conditions, recommend equipment and gear:
          
          Route: ${JSON.stringify(routeDetails, null, 2)}
          
          Weather: ${JSON.stringify(weatherData, null, 2)}
          
          Format the response in these sections:
          1. Bike Setup (gearing, tire selection)
          2. Clothing Recommendations (layers, weather protection)
          3. Essential Gear (tools, safety equipment)
          4. Nutrition Storage
          5. Electronics (recommended settings)`
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.claudeApiKey,
        'anthropic-version': '2023-06-01'
      }
    });
    
    return response.data.content[0].text;
  }
  
  private async openAIEquipmentRecommendation(routeDetails: any, weatherData: any) {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a cycling equipment expert with specialized knowledge of mountain climbing gear.'
        },
        {
          role: 'user',
          content: `Based on these route details and weather conditions, recommend equipment and gear:
          
          Route: ${JSON.stringify(routeDetails, null, 2)}
          
          Weather: ${JSON.stringify(weatherData, null, 2)}
          
          Format the response in these sections:
          1. Bike Setup (gearing, tire selection)
          2. Clothing Recommendations (layers, weather protection)
          3. Essential Gear (tools, safety equipment)
          4. Nutrition Storage
          5. Electronics (recommended settings)`
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`
      }
    });
    
    return response.data.choices[0].message.content;
  }
  
  private async claudeChatMessage(messages: ChatMessage[], context?: ChatContext) {
    // Convert our message format to Claude's format
    const claudeMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));
    
    // Add context as a system message if provided
    let systemContent = 'You are a cycling assistant for Velo-Altitude, specializing in training advice, nutrition, route planning, and equipment recommendations.';
    
    if (context) {
      systemContent += ' Here is some context about the user:\n\n';
      
      if (context.userProfile) {
        systemContent += `User Profile: ${JSON.stringify(context.userProfile, null, 2)}\n\n`;
      }
      
      if (context.recentActivities && context.recentActivities.length > 0) {
        systemContent += `Recent Activities: ${JSON.stringify(context.recentActivities, null, 2)}\n\n`;
      }
      
      if (context.weatherData) {
        systemContent += `Current Weather: ${JSON.stringify(context.weatherData, null, 2)}\n\n`;
      }
      
      if (context.equipment && context.equipment.length > 0) {
        systemContent += `User Equipment: ${JSON.stringify(context.equipment, null, 2)}\n\n`;
      }
      
      if (context.goals && context.goals.length > 0) {
        systemContent += `User Goals: ${context.goals.join(', ')}\n\n`;
      }
      
      if (context.language) {
        systemContent += `Respond in: ${context.language}`;
      }
    }
    
    // Add system message at the beginning
    claudeMessages.unshift({
      role: 'user',
      content: `<system>${systemContent}</system>\n\n`
    });
    
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: claudeMessages
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.claudeApiKey,
        'anthropic-version': '2023-06-01'
      }
    });
    
    return response.data.content[0].text;
  }
  
  private async openAIChatMessage(messages: ChatMessage[], context?: ChatContext) {
    // Convert our message format to OpenAI's format
    const openaiMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add context as a system message if provided
    let systemContent = 'You are a cycling assistant for Velo-Altitude, specializing in training advice, nutrition, route planning, and equipment recommendations.';
    
    if (context) {
      systemContent += ' Here is some context about the user:\n\n';
      
      if (context.userProfile) {
        systemContent += `User Profile: ${JSON.stringify(context.userProfile, null, 2)}\n\n`;
      }
      
      if (context.recentActivities && context.recentActivities.length > 0) {
        systemContent += `Recent Activities: ${JSON.stringify(context.recentActivities, null, 2)}\n\n`;
      }
      
      if (context.weatherData) {
        systemContent += `Current Weather: ${JSON.stringify(context.weatherData, null, 2)}\n\n`;
      }
      
      if (context.equipment && context.equipment.length > 0) {
        systemContent += `User Equipment: ${JSON.stringify(context.equipment, null, 2)}\n\n`;
      }
      
      if (context.goals && context.goals.length > 0) {
        systemContent += `User Goals: ${context.goals.join(', ')}\n\n`;
      }
      
      if (context.language) {
        systemContent += `Respond in: ${context.language}`;
      }
    }
    
    // Add system message at the beginning
    openaiMessages.unshift({
      role: 'system',
      content: systemContent
    });
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: openaiMessages
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`
      }
    });
    
    return response.data.choices[0].message.content;
  }
  
  private async claudeSuggestedQueries(messages: ChatMessage[], context?: ChatContext) {
    // Similar to chat message but with a specific prompt for generating suggestions
    const systemContent = 'You are a cycling assistant that generates relevant follow-up questions based on the conversation history. Generate 3-5 concise, cycling-related questions the user might want to ask next.';
    
    // Convert our message format to Claude's format
    const claudeMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));
    
    // Add system message at the beginning
    claudeMessages.push({
      role: 'user',
      content: `<system>${systemContent}</system>\n\nBased on this conversation, generate 3-5 brief, relevant follow-up questions about cycling that the user might want to ask next. Keep each suggestion under 60 characters. Format as a JSON array of strings only.`
    });
    
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-haiku-20240307',
      max_tokens: 400,
      messages: claudeMessages
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.claudeApiKey,
        'anthropic-version': '2023-06-01'
      }
    });
    
    // Parse the response text as JSON array
    try {
      const text = response.data.content[0].text;
      // Extract JSON array from possible text explanation - using standard regex without 's' flag
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
      // If no array is found but there's a comma-separated list, convert it
      const lines = text.split('\n').filter(line => line.trim() !== '').map(line => line.replace(/^\d+\.\s*/, '').trim());
      if (lines.length > 0) {
        return lines;
      }
      return [];
    } catch (error) {
      console.error('Failed to parse suggested queries', error);
      return [];
    }
  }
  
  private async openAISuggestedQueries(messages: ChatMessage[], context?: ChatContext) {
    // Convert our message format to OpenAI's format
    const openaiMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add system message for generating suggestions
    openaiMessages.push({
      role: 'system',
      content: 'Generate 3-5 brief, relevant follow-up questions about cycling that the user might want to ask next based on the conversation history. Keep each suggestion under 60 characters. Format as a JSON array of strings only.'
    });
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: openaiMessages,
      temperature: 0.7
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`
      }
    });
    
    // Parse the response text as JSON array
    try {
      const text = response.data.choices[0].message.content;
      // Extract JSON array from possible text explanation - using standard regex without 's' flag
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        return JSON.parse(match[0]);
      }
      // If no array is found but there's a comma-separated list, convert it
      const lines = text.split('\n').filter(line => line.trim() !== '').map(line => line.replace(/^\d+\.\s*/, '').trim());
      if (lines.length > 0) {
        return lines;
      }
      return [];
    } catch (error) {
      console.error('Failed to parse suggested queries', error);
      return [];
    }
  }
}
