/**
 * Context Providers for AI Chatbox
 * Functions to provide user-specific context to the AI assistant
 */

import { stravaService } from '../strava';
import { weatherService } from '../weather';
import { getUserEquipment, getUserGoals, getUserProfile } from '../../api/user';
import { monitoring } from '../monitoring';

/**
 * Collection of context provider functions
 * Each provider fetches specific user context data
 */
export const contextProviders = {
  /**
   * Get user profile information
   * @returns {Promise<Object>} User profile data
   */
  profile: async () => {
    try {
      const profile = await getUserProfile();
      return {
        name: profile.name,
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        gender: profile.gender,
        ftp: profile.ftp,
        experience: profile.cyclingExperience,
        weeklyHours: profile.weeklyTrainingHours,
        preferredTerrain: profile.preferredTerrain
      };
    } catch (error) {
      monitoring.logError('contextProviders', 'Failed to get user profile', error);
      return null;
    }
  },
  
  /**
   * Get recent user activities from Strava
   * @returns {Promise<Object>} Recent activities data
   */
  activities: async () => {
    try {
      const activities = await stravaService.getAthleteActivities({
        per_page: 10 // Get 10 most recent activities
      });
      
      // Transform activities into a format better suited for AI analysis
      return activities.map(activity => ({
        id: activity.id,
        name: activity.name,
        type: activity.type,
        date: activity.start_date,
        distance: activity.distance,
        movingTime: activity.moving_time,
        elevationGain: activity.total_elevation_gain,
        averageSpeed: activity.average_speed,
        maxSpeed: activity.max_speed,
        averageWatts: activity.average_watts,
        maxWatts: activity.max_watts,
        kilojoules: activity.kilojoules,
        startLatLng: activity.start_latlng,
        endLatLng: activity.end_latlng
      }));
    } catch (error) {
      monitoring.logError('contextProviders', 'Failed to get activities', error);
      return null;
    }
  },
  
  /**
   * Get current weather for user's location
   * @returns {Promise<Object>} Current weather data
   */
  weather: async () => {
    try {
      // Get user's location from profile
      const profile = await getUserProfile();
      
      if (!profile.location || !profile.location.lat || !profile.location.lon) {
        return null;
      }
      
      const weather = await weatherService.getColWeather(
        profile.location.lat, 
        profile.location.lon
      );
      
      return {
        location: profile.location.name || 'Unknown',
        current: {
          temp: weather.main.temp,
          feels_like: weather.main.feels_like,
          humidity: weather.main.humidity,
          wind_speed: weather.wind.speed,
          wind_direction: weather.wind.deg,
          conditions: weather.weather[0].main,
          description: weather.weather[0].description,
          icon: weather.weather[0].icon
        }
      };
    } catch (error) {
      monitoring.logError('contextProviders', 'Failed to get weather', error);
      return null;
    }
  },
  
  /**
   * Get user's equipment information
   * @returns {Promise<Object>} Equipment data
   */
  equipment: async () => {
    try {
      const equipment = await getUserEquipment();
      
      return {
        bikes: equipment.bikes.map(bike => ({
          name: bike.name,
          type: bike.type,
          brand: bike.brand,
          model: bike.model,
          weight: bike.weight,
          components: {
            groupset: bike.groupset,
            wheelset: bike.wheelset,
            tires: bike.tires
          },
          totalDistance: bike.totalDistance
        })),
        accessories: equipment.accessories,
        defaultBikeId: equipment.defaultBikeId
      };
    } catch (error) {
      monitoring.logError('contextProviders', 'Failed to get equipment', error);
      return null;
    }
  },
  
  /**
   * Get user's goals and targets
   * @returns {Promise<Object>} Goals data
   */
  goals: async () => {
    try {
      const goals = await getUserGoals();
      
      return {
        season: {
          focus: goals.seasonFocus,
          targetEvents: goals.targetEvents,
          startDate: goals.seasonStartDate,
          endDate: goals.seasonEndDate
        },
        performance: {
          ftp: goals.targetFtp,
          weight: goals.targetWeight,
          climbingAbility: goals.targetClimbingAbility,
          endurance: goals.targetEndurance
        },
        challenges: goals.challenges.map(challenge => ({
          name: challenge.name,
          date: challenge.date,
          type: challenge.type,
          targetTime: challenge.targetTime,
          importance: challenge.importance
        }))
      };
    } catch (error) {
      monitoring.logError('contextProviders', 'Failed to get goals', error);
      return null;
    }
  }
};

export default contextProviders;
