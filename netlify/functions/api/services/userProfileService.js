/**
 * User Profile Service for Velo-Altitude API
 * 
 * Provides optimized access to user profiles with advanced caching strategies
 * Implements user preferences, activity tracking, and performance analytics
 */

const cache = require('../../../utils/cacheService');
const dbManager = require('../../../utils/dbManager');
const monitoringService = require('../../../utils/monitoringService');

// Cache configuration
const CACHE_CONFIG = {
  profile: {
    ttl: 15 * 60 * 1000, // 15 minutes
    segment: 'user:profile'
  },
  preferences: {
    ttl: 30 * 60 * 1000, // 30 minutes
    segment: 'user:preferences'
  },
  achievements: {
    ttl: 60 * 60 * 1000, // 1 hour
    segment: 'user:achievements'
  },
  stats: {
    ttl: 3 * 60 * 60 * 1000, // 3 hours
    segment: 'user:stats'
  }
};

/**
 * Get user profile by ID
 * @param {string} userId - User ID
 * @param {Object} options - Options
 * @returns {Promise<Object>} User profile
 */
async function getUserProfile(userId, options = {}) {
  try {
    const { includePreferences = true, includeStats = true } = options;
    
    // Generate cache key
    const cacheKey = `profile:${userId}`;
    
    // Check cache
    const cachedProfile = cache.get(cacheKey, CACHE_CONFIG.profile.segment);
    
    if (cachedProfile) {
      return cachedProfile;
    }
    
    // Get user from database
    const user = await dbManager.executeQuery(
      async () => {
        const db = await dbManager.connectMongoose();
        const User = db.model('User');
        
        // Select fields based on options
        let selectFields = '-password -refreshToken -__v';
        
        if (!includePreferences) {
          selectFields += ' -preferences';
        }
        
        return await User.findById(userId).select(selectFields);
      },
      'getUserProfile'
    );
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Convert to plain object
    const profile = user.toObject ? user.toObject() : user;
    
    // Add user stats if requested
    if (includeStats) {
      profile.stats = await getUserStats(userId);
    }
    
    // Cache profile
    cache.set(cacheKey, profile, {
      ttl: CACHE_CONFIG.profile.ttl,
      segment: CACHE_CONFIG.profile.segment
    });
    
    return profile;
  } catch (error) {
    console.error('[UserProfileService] Error getting user profile:', error);
    
    // Log error for monitoring
    monitoringService.recordError({
      type: 'service_error',
      service: 'userProfileService',
      function: 'getUserProfile',
      message: error.message,
      userId
    });
    
    throw new Error(`Failed to get user profile: ${error.message}`);
  }
}

/**
 * Get user preferences
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User preferences
 */
async function getUserPreferences(userId) {
  try {
    // Generate cache key
    const cacheKey = `preferences:${userId}`;
    
    // Check cache
    const cachedPreferences = cache.get(cacheKey, CACHE_CONFIG.preferences.segment);
    
    if (cachedPreferences) {
      return cachedPreferences;
    }
    
    // Get preferences from database
    const preferences = await dbManager.executeQuery(
      async () => {
        const db = await dbManager.connectMongoose();
        const User = db.model('User');
        
        const user = await User.findById(userId).select('preferences');
        
        return user ? user.preferences : null;
      },
      'getUserPreferences'
    );
    
    if (!preferences) {
      return {
        language: 'fr',
        units: 'metric',
        theme: 'light',
        notifications: {
          email: true,
          push: true
        },
        privacy: {
          shareActivity: false,
          showProfile: true
        }
      };
    }
    
    // Cache preferences
    cache.set(cacheKey, preferences, {
      ttl: CACHE_CONFIG.preferences.ttl,
      segment: CACHE_CONFIG.preferences.segment
    });
    
    return preferences;
  } catch (error) {
    console.error('[UserProfileService] Error getting user preferences:', error);
    
    // Log error for monitoring
    monitoringService.recordError({
      type: 'service_error',
      service: 'userProfileService',
      function: 'getUserPreferences',
      message: error.message,
      userId
    });
    
    // Return default preferences on error
    return {
      language: 'fr',
      units: 'metric',
      theme: 'light',
      notifications: {
        email: true,
        push: true
      },
      privacy: {
        shareActivity: false,
        showProfile: true
      }
    };
  }
}

/**
 * Update user preferences
 * @param {string} userId - User ID
 * @param {Object} preferences - User preferences
 * @returns {Promise<Object>} Updated preferences
 */
async function updateUserPreferences(userId, preferences) {
  try {
    // Validate preferences
    if (!preferences || typeof preferences !== 'object') {
      throw new Error('Invalid preferences object');
    }
    
    // Update preferences in database
    const updatedPreferences = await dbManager.executeQuery(
      async () => {
        const db = await dbManager.connectMongoose();
        const User = db.model('User');
        
        const user = await User.findById(userId);
        
        if (!user) {
          throw new Error('User not found');
        }
        
        // Update only provided preferences
        user.preferences = {
          ...user.preferences,
          ...preferences
        };
        
        await user.save();
        
        return user.preferences;
      },
      'updateUserPreferences'
    );
    
    // Update cache
    const cacheKey = `preferences:${userId}`;
    cache.set(cacheKey, updatedPreferences, {
      ttl: CACHE_CONFIG.preferences.ttl,
      segment: CACHE_CONFIG.preferences.segment
    });
    
    // Invalidate profile cache
    cache.del(`profile:${userId}`, CACHE_CONFIG.profile.segment);
    
    return updatedPreferences;
  } catch (error) {
    console.error('[UserProfileService] Error updating user preferences:', error);
    
    // Log error for monitoring
    monitoringService.recordError({
      type: 'service_error',
      service: 'userProfileService',
      function: 'updateUserPreferences',
      message: error.message,
      userId
    });
    
    throw new Error(`Failed to update user preferences: ${error.message}`);
  }
}

/**
 * Get user achievements
 * @param {string} userId - User ID
 * @returns {Promise<Array<Object>>} User achievements
 */
async function getUserAchievements(userId) {
  try {
    // Generate cache key
    const cacheKey = `achievements:${userId}`;
    
    // Check cache
    const cachedAchievements = cache.get(cacheKey, CACHE_CONFIG.achievements.segment);
    
    if (cachedAchievements) {
      return cachedAchievements;
    }
    
    // Get achievements from database
    const achievements = await dbManager.executeQuery(
      async () => {
        const db = await dbManager.connectMongoose();
        const Achievement = db.model('Achievement');
        
        return await Achievement.find({ userId }).sort({ earnedDate: -1 });
      },
      'getUserAchievements'
    );
    
    // Cache achievements
    cache.set(cacheKey, achievements, {
      ttl: CACHE_CONFIG.achievements.ttl,
      segment: CACHE_CONFIG.achievements.segment
    });
    
    return achievements;
  } catch (error) {
    console.error('[UserProfileService] Error getting user achievements:', error);
    
    // Log error for monitoring
    monitoringService.recordError({
      type: 'service_error',
      service: 'userProfileService',
      function: 'getUserAchievements',
      message: error.message,
      userId
    });
    
    return [];
  }
}

/**
 * Get user stats
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User stats
 */
async function getUserStats(userId) {
  try {
    // Generate cache key
    const cacheKey = `stats:${userId}`;
    
    // Check cache
    const cachedStats = cache.get(cacheKey, CACHE_CONFIG.stats.segment);
    
    if (cachedStats) {
      return cachedStats;
    }
    
    // Get stats from database
    const stats = await dbManager.executeQuery(
      async () => {
        const db = await dbManager.connectMongoose();
        const Activity = db.model('Activity');
        const Col = db.model('Col');
        const Route = db.model('Route');
        
        // Get activity stats
        const activityStats = await Activity.aggregate([
          { $match: { userId: userId } },
          { $group: {
            _id: null,
            totalActivities: { $sum: 1 },
            totalDistance: { $sum: '$distance' },
            totalElevation: { $sum: '$elevationGain' },
            totalTime: { $sum: '$movingTime' }
          }}
        ]);
        
        // Get cols stats
        const colsClimbed = await Col.countDocuments({ 
          'ascents.userId': userId 
        });
        
        // Get routes stats
        const routesCompleted = await Route.countDocuments({ 
          'completions.userId': userId 
        });
        
        return {
          activities: activityStats.length > 0 ? {
            count: activityStats[0].totalActivities || 0,
            totalDistance: Math.round(activityStats[0].totalDistance || 0),
            totalElevation: Math.round(activityStats[0].totalElevation || 0),
            totalTime: activityStats[0].totalTime || 0
          } : {
            count: 0,
            totalDistance: 0,
            totalElevation: 0,
            totalTime: 0
          },
          cols: {
            climbed: colsClimbed
          },
          routes: {
            completed: routesCompleted
          },
          lastUpdated: new Date()
        };
      },
      'getUserStats'
    );
    
    // Cache stats
    cache.set(cacheKey, stats, {
      ttl: CACHE_CONFIG.stats.ttl,
      segment: CACHE_CONFIG.stats.segment
    });
    
    return stats;
  } catch (error) {
    console.error('[UserProfileService] Error getting user stats:', error);
    
    // Log error for monitoring
    monitoringService.recordError({
      type: 'service_error',
      service: 'userProfileService',
      function: 'getUserStats',
      message: error.message,
      userId
    });
    
    return {
      activities: {
        count: 0,
        totalDistance: 0,
        totalElevation: 0,
        totalTime: 0
      },
      cols: {
        climbed: 0
      },
      routes: {
        completed: 0
      },
      lastUpdated: new Date()
    };
  }
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<Object>} Updated profile
 */
async function updateUserProfile(userId, profileData) {
  try {
    // Validate profile data
    if (!profileData || typeof profileData !== 'object') {
      throw new Error('Invalid profile data');
    }
    
    // Prevent updating sensitive fields
    const safeProfileData = { ...profileData };
    delete safeProfileData.password;
    delete safeProfileData.email;
    delete safeProfileData.role;
    delete safeProfileData.refreshToken;
    
    // Update profile in database
    const updatedProfile = await dbManager.executeQuery(
      async () => {
        const db = await dbManager.connectMongoose();
        const User = db.model('User');
        
        const user = await User.findByIdAndUpdate(
          userId,
          { $set: safeProfileData },
          { new: true, runValidators: true }
        ).select('-password -refreshToken -__v');
        
        if (!user) {
          throw new Error('User not found');
        }
        
        return user;
      },
      'updateUserProfile'
    );
    
    // Invalidate cache
    cache.del(`profile:${userId}`, CACHE_CONFIG.profile.segment);
    
    return updatedProfile;
  } catch (error) {
    console.error('[UserProfileService] Error updating user profile:', error);
    
    // Log error for monitoring
    monitoringService.recordError({
      type: 'service_error',
      service: 'userProfileService',
      function: 'updateUserProfile',
      message: error.message,
      userId
    });
    
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
}

/**
 * Get user activity feed
 * @param {string} userId - User ID
 * @param {Object} options - Options
 * @returns {Promise<Array<Object>>} User activity feed
 */
async function getUserActivityFeed(userId, options = {}) {
  try {
    const { limit = 10, page = 1, type } = options;
    
    // Get activity feed from database
    const activityFeed = await dbManager.executeQuery(
      async () => {
        const db = await dbManager.connectMongoose();
        const ActivityFeed = db.model('ActivityFeed');
        
        // Build query
        const query = { userId };
        
        if (type) {
          query.type = type;
        }
        
        return await ActivityFeed.find(query)
          .sort({ timestamp: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('relatedUsers', 'firstName lastName profileImage');
      },
      'getUserActivityFeed'
    );
    
    return activityFeed;
  } catch (error) {
    console.error('[UserProfileService] Error getting user activity feed:', error);
    
    // Log error for monitoring
    monitoringService.recordError({
      type: 'service_error',
      service: 'userProfileService',
      function: 'getUserActivityFeed',
      message: error.message,
      userId
    });
    
    return [];
  }
}

/**
 * Add activity to user feed
 * @param {string} userId - User ID
 * @param {Object} activity - Activity data
 * @returns {Promise<Object>} Created activity
 */
async function addUserActivity(userId, activity) {
  try {
    // Validate activity
    if (!activity || !activity.type) {
      throw new Error('Invalid activity data');
    }
    
    // Add activity to database
    const newActivity = await dbManager.executeQuery(
      async () => {
        const db = await dbManager.connectMongoose();
        const ActivityFeed = db.model('ActivityFeed');
        
        const activityData = {
          userId,
          type: activity.type,
          data: activity.data || {},
          relatedUsers: activity.relatedUsers || [],
          timestamp: new Date()
        };
        
        return await ActivityFeed.create(activityData);
      },
      'addUserActivity'
    );
    
    return newActivity;
  } catch (error) {
    console.error('[UserProfileService] Error adding user activity:', error);
    
    // Log error for monitoring
    monitoringService.recordError({
      type: 'service_error',
      service: 'userProfileService',
      function: 'addUserActivity',
      message: error.message,
      userId
    });
    
    throw new Error(`Failed to add user activity: ${error.message}`);
  }
}

/**
 * Invalidate user cache
 * @param {string} userId - User ID
 */
function invalidateUserCache(userId) {
  // Clear all user-related caches
  cache.del(`profile:${userId}`, CACHE_CONFIG.profile.segment);
  cache.del(`preferences:${userId}`, CACHE_CONFIG.preferences.segment);
  cache.del(`achievements:${userId}`, CACHE_CONFIG.achievements.segment);
  cache.del(`stats:${userId}`, CACHE_CONFIG.stats.segment);
}

module.exports = {
  getUserProfile,
  getUserPreferences,
  updateUserPreferences,
  getUserAchievements,
  getUserStats,
  updateUserProfile,
  getUserActivityFeed,
  addUserActivity,
  invalidateUserCache
};
