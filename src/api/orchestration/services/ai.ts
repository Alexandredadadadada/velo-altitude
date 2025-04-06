import axios from 'axios';

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

export class AIService {
  private claudeApiKey: string;
  private openaiApiKey: string;
  
  constructor() {
    this.claudeApiKey = process.env.CLAUDE_API_KEY || '';
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
  }
  
  // Generate training recommendations based on athlete data
  async generateTrainingRecommendations(athleteData: AthleteData) {
    // Try Claude first
    try {
      if (this.claudeApiKey) {
        return await this.claudeRecommendation(athleteData);
      }
    } catch (error) {
      console.warn('Claude API failed, falling back to OpenAI', error);
    }
    
    // Fallback to OpenAI
    if (this.openaiApiKey) {
      return await this.openaiRecommendation(athleteData);
    }
    
    throw new Error('No AI service available');
  }
  
  // Get nutritional recommendations for cycling
  async getNutritionRecommendations(athleteData: AthleteData, routeDetails: any) {
    try {
      if (this.claudeApiKey) {
        return await this.claudeNutritionRecommendation(athleteData, routeDetails);
      }
    } catch (error) {
      console.warn('Claude API failed for nutrition recommendations, falling back to OpenAI', error);
    }
    
    if (this.openaiApiKey) {
      return await this.openAINutritionRecommendation(athleteData, routeDetails);
    }
    
    throw new Error('No AI service available for nutrition recommendations');
  }
  
  // Get equipment recommendations based on route and weather
  async getEquipmentRecommendations(routeDetails: any, weatherData: any) {
    try {
      if (this.claudeApiKey) {
        return await this.claudeEquipmentRecommendation(routeDetails, weatherData);
      }
    } catch (error) {
      console.warn('Claude API failed for equipment recommendations, falling back to OpenAI', error);
    }
    
    if (this.openaiApiKey) {
      return await this.openAIEquipmentRecommendation(routeDetails, weatherData);
    }
    
    throw new Error('No AI service available for equipment recommendations');
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
}
