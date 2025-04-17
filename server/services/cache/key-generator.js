// Structured cache key generator for Velo-Altitude
class CacheKeyGenerator {
  static userKey(userId) {
    return `velo:user:${userId}`;
  }
  static colKey(colId) {
    return `velo:col:${colId}`;
  }
  static weatherKey(location, date) {
    return `velo:weather:${location}:${date || 'current'}`;
  }
  static stravaKey(userId, activityType) {
    return `velo:strava:${userId}:${activityType || 'all'}`;
  }
}

module.exports = CacheKeyGenerator;
