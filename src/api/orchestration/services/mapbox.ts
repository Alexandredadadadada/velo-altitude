import axios from 'axios';

const MAPBOX_BASE_URL = 'https://api.mapbox.com';

export class MapboxService {
  private accessToken: string;
  
  constructor() {
    this.accessToken = process.env.MAPBOX_TOKEN || '';
    if (!this.accessToken) {
      console.warn('Mapbox token is not available');
    }
  }
  
  // Get elevation data for a route
  async getElevationForRoute(coordinates: [number, number][]) {
    // Format coordinates for Mapbox API
    const formattedCoords = coordinates.map(coord => coord.join(',')).join(';');
    
    return axios.get(`${MAPBOX_BASE_URL}/v4/surface/mapbox.mapbox-terrain-v2/tilequery/${formattedCoords}`, {
      params: {
        access_token: this.accessToken,
        layers: 'contour',
        limit: 50
      }
    }).then(response => {
      // Process and return elevation data
      return response.data.features.map((feature: any) => ({
        coordinate: feature.geometry.coordinates,
        elevation: feature.properties.ele
      }));
    });
  }
  
  // Get directions for cycling
  async getCyclingDirections(start: [number, number], end: [number, number], waypoints: [number, number][] = []) {
    const waypointsStr = waypoints.map(wp => wp.join(',')).join(';');
    const coordinatesStr = `${start.join(',')};${waypointsStr ? waypointsStr + ';' : ''}${end.join(',')}`;
    
    return axios.get(`${MAPBOX_BASE_URL}/directions/v5/mapbox/cycling/${coordinatesStr}`, {
      params: {
        access_token: this.accessToken,
        geometries: 'geojson',
        steps: true,
        overview: 'full',
        annotations: 'distance,duration,speed'
      }
    }).then(response => response.data);
  }
  
  // Get map style for cycling
  async getMapStyle() {
    return axios.get(`${MAPBOX_BASE_URL}/styles/v1/mapbox/outdoors-v11`, {
      params: {
        access_token: this.accessToken
      }
    }).then(response => response.data);
  }
  
  // Get static map image for a route
  getStaticMapImageUrl(coordinates: [number, number][], width = 800, height = 600, zoom = 12) {
    const path = coordinates.map(coord => coord.join(',')).join(';');
    const center = coordinates[Math.floor(coordinates.length / 2)].join(',');
    
    return `${MAPBOX_BASE_URL}/styles/v1/mapbox/outdoors-v11/static/path-5+f44-0.5(${encodeURIComponent(path)})/auto/${width}x${height}?access_token=${this.accessToken}`;
  }
  
  // Geocode a location name to coordinates
  async geocode(location: string) {
    return axios.get(`${MAPBOX_BASE_URL}/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json`, {
      params: {
        access_token: this.accessToken,
        limit: 5
      }
    }).then(response => response.data);
  }
  
  // Reverse geocode: get location name from coordinates
  async reverseGeocode(coordinates: [number, number]) {
    return axios.get(`${MAPBOX_BASE_URL}/geocoding/v5/mapbox.places/${coordinates.join(',')}.json`, {
      params: {
        access_token: this.accessToken,
        limit: 1
      }
    }).then(response => response.data);
  }
}
