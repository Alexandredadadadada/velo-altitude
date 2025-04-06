import { StravaService } from './services/strava';
import { MapboxService } from './services/mapbox';
import { WeatherService } from './services/weather';
import { RouteService } from './services/route';
import { AIService } from './services/ai';
import { ColsService } from './services/cols';
import { CacheService } from '../../utils/cache';
import { NutritionService } from './services/nutrition';

export class APIOrchestrator {
  private stravaService: StravaService;
  private mapboxService: MapboxService;
  private weatherService: WeatherService;
  private routeService: RouteService;
  private aiService: AIService;
  private colsService: ColsService;
  private cacheService: CacheService;
  private nutritionService: NutritionService;

  constructor() {
    this.stravaService = new StravaService();
    this.mapboxService = new MapboxService();
    this.weatherService = new WeatherService();
    this.routeService = new RouteService();
    this.aiService = new AIService();
    this.colsService = new ColsService();
    this.cacheService = new CacheService();
    this.nutritionService = new NutritionService();

    // Apply caching to frequently used methods
    this.applyCaching();
  }

  private applyCaching() {
    // Cache athlete profile for 1 hour (3600 seconds)
    this.stravaService.getAthleteProfile = this.cacheService.cached(
      this.stravaService.getAthleteProfile.bind(this.stravaService),
      () => 'athlete_profile',
      3600
    );

    // Cache weather data for 30 minutes (1800 seconds)
    this.weatherService.getWeatherForCoordinates = this.cacheService.cached(
      this.weatherService.getWeatherForCoordinates.bind(this.weatherService),
      (coordinates) => `weather_${coordinates.join('_')}`,
      1800
    );

    // Cache elevation data for 24 hours (86400 seconds) as it rarely changes
    this.mapboxService.getElevationForRoute = this.cacheService.cached(
      this.mapboxService.getElevationForRoute.bind(this.mapboxService),
      (coordinates) => `elevation_${coordinates[0].join('_')}_${coordinates[coordinates.length-1].join('_')}`,
      86400
    );
  }

  // Public API methods

  // Get athlete profile with activities
  async getAthleteWithActivities(limit = 10) {
    const athlete = await this.stravaService.getAthleteProfile();
    const activities = await this.stravaService.getActivities({ per_page: limit });

    return {
      ...athlete,
      activities
    };
  }

  // Get comprehensive route data with weather and elevation
  async getRouteWithWeatherAndElevation(routeId: string) {
    const route = await this.routeService.getRouteById(routeId);
    const coordinates = route.coordinates || [];

    // Get weather data for start and end points
    const startWeather = coordinates.length > 0 ? 
      await this.weatherService.getWeatherForCoordinates(coordinates[0]) : null;

    const endWeather = coordinates.length > 1 ? 
      await this.weatherService.getWeatherForCoordinates(coordinates[coordinates.length - 1]) : null;

    // Get elevation data
    const elevationData = await this.mapboxService.getElevationForRoute(coordinates);

    // Calculate route statistics
    const routeStats = await this.routeService.getRouteStats(coordinates);

    return {
      ...route,
      weather: {
        start: startWeather,
        end: endWeather
      },
      elevation: elevationData,
      statistics: routeStats
    };
  }

  // Plan a new route between points
  async planRoute(start: [number, number], end: [number, number], waypoints: [number, number][] = []) {
    // Get route from OpenRoute service
    const routeData = await this.routeService.getRoute(start, end, waypoints);

    // Extract coordinates from the route
    const coordinates = routeData.features[0].geometry.coordinates;

    // Get elevation data
    const elevationData = await this.mapboxService.getElevationForRoute(coordinates);

    // Get weather forecast for the route
    const weatherData = await this.weatherService.getWeatherForRoute(coordinates);

    return {
      route: routeData,
      elevation: elevationData,
      weather: weatherData
    };
  }

  // Get personalized training recommendations
  async getTrainingRecommendations() {
    // Get athlete data
    const athleteData = await this.getAthleteWithActivities(20);

    // Generate recommendations
    const recommendations = await this.aiService.generateTrainingRecommendations(athleteData);

    return {
      athlete: athleteData,
      recommendations
    };
  }

  // Get nutrition recommendations for a specific route
  async getNutritionRecommendations(routeId: string) {
    // Get athlete data and route details
    const athleteData = await this.stravaService.getAthleteProfile();
    const routeDetails = await this.getRouteWithWeatherAndElevation(routeId);

    // Generate nutrition recommendations
    const recommendations = await this.aiService.getNutritionRecommendations(
      athleteData,
      routeDetails
    );

    return {
      athlete: athleteData,
      route: routeDetails,
      recommendations
    };
  }

  // Get equipment recommendations based on route and current weather
  async getEquipmentRecommendations(routeId: string) {
    const routeDetails = await this.getRouteWithWeatherAndElevation(routeId);

    // Generate equipment recommendations
    const recommendations = await this.aiService.getEquipmentRecommendations(
      routeDetails,
      routeDetails.weather
    );

    return {
      route: routeDetails,
      recommendations
    };
  }

  // Upload activity to Strava
  async uploadActivity(file: File, activityData: any) {
    return this.stravaService.uploadActivity(file, activityData);
  }

  // Get static map image for a route
  getRouteMapImageUrl(routeId: string, width = 800, height = 600) {
    // This would need to fetch the route first in a real implementation
    // For simplicity, we'll assume route coordinates are available
    return `/api/routes/${routeId}/map?width=${width}&height=${height}`;
  }

  // Clear cache for specific entities
  clearCache(entity: string, id?: string) {
    if (entity === 'athlete') {
      this.cacheService.remove('athlete_profile');
    } else if (entity === 'route' && id) {
      this.cacheService.remove(`route_${id}`);
    } else {
      this.cacheService.clear();
    }
  }

  // Nouvelles méthodes pour la fonctionnalité "Les 7 Majeurs"
  async getAllCols() {
    const cacheKey = 'all_cols';
    const cachedData = this.cacheService.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const cols = await this.colsService.getAllCols();
    this.cacheService.set(cacheKey, cols, 3600); // Cache pendant 1 heure

    return cols;
  }

  async searchCols(query: string) {
    const cacheKey = `search_cols_${query}`;
    const cachedData = this.cacheService.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const cols = await this.colsService.searchCols(query);
    this.cacheService.set(cacheKey, cols, 3600); // Cache pendant 1 heure

    return cols;
  }

  async getColById(id: string) {
    const cacheKey = `col_${id}`;
    const cachedData = this.cacheService.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const col = await this.colsService.getColById(id);
    this.cacheService.set(cacheKey, col, 3600); // Cache pendant 1 heure

    return col;
  }

  async getUserChallenges(userId: string) {
    return this.colsService.getUserChallenges(userId);
  }

  async getPublicChallenges() {
    const cacheKey = 'public_challenges';
    const cachedData = this.cacheService.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const challenges = await this.colsService.getPublicChallenges();
    this.cacheService.set(cacheKey, challenges, 1800); // Cache pendant 30 minutes

    return challenges;
  }

  async createChallenge(userId: string, name: string, description: string, colIds: string[], isPublic: boolean) {
    // Récupérer les informations complètes des cols sélectionnés
    const colPromises = colIds.map(id => this.getColById(id));
    const cols = await Promise.all(colPromises);

    // Calculer les statistiques du défi
    const stats = this.colsService.calculateChallengeStats(cols);

    // Créer le défi
    const challenge = await this.colsService.createChallenge({
      name,
      description,
      createdBy: userId,
      isPublic,
      cols,
      ...stats
    });

    // Invalider le cache des défis publics si ce défi est public
    if (isPublic) {
      this.cacheService.remove('public_challenges');
    }

    return challenge;
  }

  async generateGpxForChallenge(challengeId: string) {
    return this.colsService.generateGpxForChallenge(challengeId);
  }

  // ================= Nutrition API Methods =================

  // Recettes
  async getAllRecipes(): Promise<any[]> {
    return this.nutritionService.getAllRecipes();
  }

  async getRecipeById(id: string): Promise<any> {
    return this.nutritionService.getRecipeById(id);
  }

  async searchRecipes(query: string): Promise<any[]> {
    return this.nutritionService.searchRecipes(query);
  }

  async getRecipesByCategory(category: 'before' | 'during' | 'after' | 'special'): Promise<any[]> {
    return this.nutritionService.getRecipesByCategory(category);
  }

  async getRecipesByTags(tags: string[]): Promise<any[]> {
    return this.nutritionService.getRecipesByTags(tags);
  }

  async getRecipesForCol(colId: string): Promise<any[]> {
    return this.nutritionService.getRecipesForCol(colId);
  }

  async createRecipe(recipe: any): Promise<any> {
    return this.nutritionService.createRecipe(recipe);
  }

  async updateRecipe(id: string, recipe: any): Promise<any> {
    return this.nutritionService.updateRecipe(id, recipe);
  }

  async deleteRecipe(id: string): Promise<void> {
    return this.nutritionService.deleteRecipe(id);
  }

  // Plans nutritionnels
  async getUserNutritionPlans(userId: string): Promise<any[]> {
    return this.nutritionService.getUserNutritionPlans(userId);
  }

  async getNutritionPlanById(id: string): Promise<any> {
    return this.nutritionService.getNutritionPlanById(id);
  }

  async createNutritionPlan(plan: any): Promise<any> {
    return this.nutritionService.createNutritionPlan(plan);
  }

  async updateNutritionPlan(id: string, plan: any): Promise<any> {
    return this.nutritionService.updateNutritionPlan(id, plan);
  }

  async deleteNutritionPlan(id: string): Promise<void> {
    return this.nutritionService.deleteNutritionPlan(id);
  }
  
  async getRecommendedPlanTemplate(
    userMetrics: {
      weight: number;
      height: number;
      age: number;
      sex: 'M' | 'F';
      activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    },
    goal: 'weight_loss' | 'maintenance' | 'performance' | 'endurance' | 'climbing'
  ): Promise<any> {
    return this.nutritionService.getRecommendedPlanTemplate(userMetrics, goal);
  }

  // Journal nutritionnel
  async getUserNutritionLogs(userId: string, startDate?: string, endDate?: string): Promise<any[]> {
    return this.nutritionService.getUserNutritionLogs(userId, startDate, endDate);
  }

  async getNutritionLogById(id: string): Promise<any> {
    return this.nutritionService.getNutritionLogById(id);
  }

  async createNutritionLogEntry(entry: any): Promise<any> {
    return this.nutritionService.createNutritionLogEntry(entry);
  }

  async updateNutritionLogEntry(id: string, entry: any): Promise<any> {
    return this.nutritionService.updateNutritionLogEntry(id, entry);
  }

  async deleteNutritionLogEntry(id: string): Promise<void> {
    return this.nutritionService.deleteNutritionLogEntry(id);
  }

  // Préférences nutritionnelles
  async getUserNutritionPreferences(userId: string): Promise<any> {
    return this.nutritionService.getUserNutritionPreferences(userId);
  }

  async updateUserNutritionPreferences(userId: string, preferences: any): Promise<any> {
    return this.nutritionService.updateUserNutritionPreferences(userId, preferences);
  }

  // Calculateur nutritionnel
  async calculateDailyNeeds(
    userMetrics: {
      weight: number;
      height: number;
      age: number;
      sex: 'M' | 'F';
      activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    },
    goal: 'weight_loss' | 'maintenance' | 'performance' | 'endurance' | 'climbing'
  ): Promise<any> {
    return this.nutritionService.calculateDailyNeeds(userMetrics, goal);
  }
}
