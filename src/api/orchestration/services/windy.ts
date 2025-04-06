import axios from 'axios';

// Types for Windy Plugins API integration
export interface WindyPluginOptions {
  model: 'ecmwf' | 'gfs' | 'iconEu' | 'nam';
  overlay: 'wind' | 'temp' | 'rain' | 'clouds' | 'pressure' | 'gust';
  level: 'surface' | '850h' | '700h' | '500h';
  timestamp?: number;
  particlesAnim?: boolean;
  isolines?: boolean;
  arrowsDisplay?: boolean;
  customOptions?: Record<string, any>;
}

/**
 * Service pour l'intégration avec les plugins Windy pour les visualisations
 * météorologiques avancées sur les parcours cyclistes.
 */
export class WindyService {
  private pluginsApiKey: string;
  
  constructor() {
    this.pluginsApiKey = process.env.WINDY_PLUGINS_API || '';
    if (!this.pluginsApiKey) {
      console.warn('Windy Plugins API key is not available');
    }
  }
  
  /**
   * Génère une URL pour intégrer une visualisation Windy à un emplacement spécifique
   * @param coordinates - Coordonnées [longitude, latitude]
   * @param options - Options de configuration du plugin
   * @param width - Largeur de l'iframe en pixels
   * @param height - Hauteur de l'iframe en pixels
   */
  getWindyMapUrl(
    coordinates: [number, number],
    options: Partial<WindyPluginOptions> = {},
    width = 800,
    height = 600
  ): string {
    const [lon, lat] = coordinates;
    
    // Options par défaut
    const defaultOptions: WindyPluginOptions = {
      model: 'ecmwf',
      overlay: 'wind',
      level: 'surface',
      particlesAnim: true,
      isolines: true,
      arrowsDisplay: false
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Construire l'URL avec les paramètres
    const baseUrl = 'https://embed.windy.com/embed2.html';
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      zoom: '9',
      overlay: mergedOptions.overlay,
      level: mergedOptions.level,
      product: mergedOptions.model,
      menu: 'true',
      message: 'true',
      marker: 'true',
      calendar: 'now',
      pressure: mergedOptions.isolines ? 'true' : 'false',
      type: 'map',
      location: 'coordinates',
      metricWind: 'km/h',
      metricTemp: '°C',
      radarRange: '-1',
      ...(this.pluginsApiKey && { key: this.pluginsApiKey }),
      ...(mergedOptions.timestamp && { timestamp: mergedOptions.timestamp.toString() }),
      ...(mergedOptions.particlesAnim !== undefined && { particles: mergedOptions.particlesAnim ? 'on' : 'off' }),
      ...(mergedOptions.customOptions || {})
    });
    
    return `${baseUrl}?${params.toString()}`;
  }
  
  /**
   * Génère un code d'intégration (iframe) pour une visualisation Windy
   */
  getWindyEmbedCode(
    coordinates: [number, number],
    options: Partial<WindyPluginOptions> = {},
    width = 800,
    height = 600
  ): string {
    const url = this.getWindyMapUrl(coordinates, options, width, height);
    
    return `<iframe 
      src="${url}" 
      width="${width}" 
      height="${height}" 
      frameborder="0"
      loading="lazy"
      allowfullscreen
      title="Prévisions Windy pour cyclistes"
    ></iframe>`;
  }
  
  /**
   * Génère une URL Windy pour visualiser un parcours complet
   * @param coordinates - Tableau de coordonnées [longitude, latitude][]
   */
  getWindyRouteMapUrl(
    coordinates: [number, number][],
    options: Partial<WindyPluginOptions> = {},
    width = 800,
    height = 600
  ): string {
    // Pour un parcours, utiliser les coordonnées du milieu comme point central
    const midPointIndex = Math.floor(coordinates.length / 2);
    const centerCoordinates = coordinates[midPointIndex];
    
    // Générer l'URL de base
    let url = this.getWindyMapUrl(centerCoordinates, options, width, height);
    
    // Ajouter les points du parcours
    // Format: &p1lat=40.712&p1lon=-74.006&p2lat=34.052&p2lon=-118.243&p3lat=...
    coordinates.forEach((coord, index) => {
      const [lon, lat] = coord;
      url += `&p${index + 1}lat=${lat}&p${index + 1}lon=${lon}`;
    });
    
    return url;
  }
  
  /**
   * Récupère les données météo pour un point spécifique via une API externe
   * puisque l'API Windy Plugin est principalement pour l'affichage
   * @param coordinates - Coordonnées [longitude, latitude]
   */
  async getForecastData(coordinates: [number, number]) {
    // Utiliser OpenWeatherMap comme source de données complémentaire
    // car l'API Windy Plugin ne fournit pas de données brutes
    const [lon, lat] = coordinates;
    const openWeatherApiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!openWeatherApiKey) {
      throw new Error('OpenWeather API key is required for data retrieval');
    }
    
    try {
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
        params: {
          lat,
          lon,
          appid: openWeatherApiKey,
          units: 'metric'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      throw error;
    }
  }
  
  /**
   * Calcule la vitesse et direction du vent pour un affichage vectoriel
   * @param windSpeed - Vitesse du vent
   * @param windDeg - Direction du vent en degrés
   */
  calculateWindVector(windSpeed: number, windDeg: number): { u: number; v: number } {
    // Convertir degrés en radians (0° = vent du nord, 90° = vent d'est)
    const angleRad = (windDeg * Math.PI) / 180;
    
    // Composantes U et V du vent
    // U = composante est-ouest (positive vers l'est)
    // V = composante nord-sud (positive vers le nord)
    const u = windSpeed * Math.sin(angleRad);
    const v = windSpeed * Math.cos(angleRad);
    
    return { u, v };
  }
  
  /**
   * Génère un code de couleur pour la vitesse du vent selon l'échelle de Beaufort
   * @param windSpeed - Vitesse du vent en km/h
   */
  getWindColorCode(windSpeed: number): string {
    if (windSpeed < 2) return '#cccccc'; // Calme
    if (windSpeed < 6) return '#99ffcc'; // Très légère brise
    if (windSpeed < 12) return '#99ccff'; // Légère brise
    if (windSpeed < 20) return '#66ccff'; // Petite brise
    if (windSpeed < 29) return '#3399ff'; // Jolie brise
    if (windSpeed < 39) return '#3366ff'; // Bonne brise
    if (windSpeed < 50) return '#ffcc66'; // Vent frais
    if (windSpeed < 62) return '#ff9966'; // Grand frais
    if (windSpeed < 75) return '#ff6666'; // Coup de vent
    if (windSpeed < 89) return '#ff3366'; // Fort coup de vent
    if (windSpeed < 103) return '#cc3366'; // Tempête
    if (windSpeed < 118) return '#cc0066'; // Violente tempête
    return '#990066'; // Ouragan
  }
}
