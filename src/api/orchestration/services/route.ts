import axios from 'axios';

const OPENROUTE_BASE_URL = 'https://api.openrouteservice.org';

export class RouteService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.OPENROUTE_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenRoute API key is not available');
    }
  }
  
  // Get a cycling route between two points
  async getRoute(start: [number, number], end: [number, number], waypoints: [number, number][] = []) {
    // Format coordinates for the OpenRoute API
    const coordinates = [start, ...waypoints, end];
    
    return axios.post(`${OPENROUTE_BASE_URL}/v2/directions/cycling-regular/geojson`, {
      coordinates
    }, {
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json'
      }
    }).then(response => response.data);
  }
  
  // Get route by ID (from database)
  async getRouteById(routeId: string) {
    // This would typically fetch from your database
    // Using MongoDB through an API endpoint
    return axios.get(`/api/routes/${routeId}`).then(response => response.data);
  }
  
  // Get elevation profile for a route
  async getElevationProfile(coordinates: [number, number][]) {
    return axios.post(`${OPENROUTE_BASE_URL}/v2/elevation/line`, {
      format: 'geojson',
      geometry: {
        coordinates,
        type: 'LineString'
      }
    }, {
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json'
      }
    }).then(response => response.data);
  }
  
  // Calculate route statistics
  async getRouteStats(coordinates: [number, number][]) {
    return axios.post(`${OPENROUTE_BASE_URL}/v2/elevation/line`, {
      format: 'geojson',
      geometry: {
        coordinates,
        type: 'LineString'
      }
    }, {
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json'
      }
    }).then(response => {
      const elevationData = response.data;
      
      // Calculate distance, elevation gain, etc.
      let totalDistance = 0;
      let totalElevationGain = 0;
      let totalElevationLoss = 0;
      let lowestPoint = Infinity;
      let highestPoint = -Infinity;
      
      // Process elevation data to extract statistics
      if (elevationData.geometry && elevationData.geometry.coordinates) {
        const coords = elevationData.geometry.coordinates;
        
        for (let i = 1; i < coords.length; i++) {
          const prevCoord = coords[i - 1];
          const currCoord = coords[i];
          
          // Distance calculation using Haversine formula
          totalDistance += this.haversineDistance(
            [prevCoord[0], prevCoord[1]],
            [currCoord[0], currCoord[1]]
          );
          
          // Elevation calculations
          const prevElevation = prevCoord[2] || 0;
          const currElevation = currCoord[2] || 0;
          const elevationDiff = currElevation - prevElevation;
          
          if (elevationDiff > 0) {
            totalElevationGain += elevationDiff;
          } else {
            totalElevationLoss += Math.abs(elevationDiff);
          }
          
          // Track lowest and highest points
          lowestPoint = Math.min(lowestPoint, currElevation);
          highestPoint = Math.max(highestPoint, currElevation);
        }
      }
      
      return {
        distance: totalDistance, // in kilometers
        elevationGain: totalElevationGain, // in meters
        elevationLoss: totalElevationLoss, // in meters
        lowestPoint, // in meters
        highestPoint, // in meters
        grade: totalDistance > 0 ? (totalElevationGain / (totalDistance * 1000)) * 100 : 0, // in percent
        originalData: elevationData
      };
    });
  }
  
  // Haversine formula to calculate distance between two points
  private haversineDistance(coord1: [number, number], coord2: [number, number]): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2[1] - coord1[1]);
    const dLon = this.toRad(coord2[0] - coord1[0]);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(coord1[1])) * Math.cos(this.toRad(coord2[1])) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  private toRad(degrees: number): number {
    return degrees * Math.PI / 180;
  }
}
