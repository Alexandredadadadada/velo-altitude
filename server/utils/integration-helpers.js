/**
 * Utilitaires d'intégration pour Dashboard-Velo
 * Facilite l'intégration entre le backend et les visualisations 3D/cartes interactives
 */

const ApiQuotaManager = require('./apiQuotaManager');
const QuotaAnalytics = require('./quota-analytics');
const RouteCache = require('./routeCache');

/**
 * Classe d'aide à l'intégration pour les visualisations 3D et cartes interactives
 */
class IntegrationHelpers {
  constructor() {
    this.apiQuotaManager = ApiQuotaManager.getInstance();
    this.quotaAnalytics = QuotaAnalytics.getInstance();
    this.routeCache = RouteCache.getInstance();
  }

  /**
   * Singleton pattern
   * @returns {IntegrationHelpers} Instance unique
   */
  static getInstance() {
    if (!IntegrationHelpers.instance) {
      IntegrationHelpers.instance = new IntegrationHelpers();
    }
    return IntegrationHelpers.instance;
  }

  /**
   * Récupère les données de visualisation filtrées par pays/région
   * @param {string} visualizationType - Type de visualisation (heatmap, routes, elevation, etc.)
   * @param {Object} options - Options de filtrage
   * @param {string} options.country - Code du pays (optionnel)
   * @param {string} options.region - Code de la région (optionnel)
   * @param {number} options.limit - Nombre maximum d'éléments à retourner
   * @returns {Promise<Object>} Données de visualisation
   */
  async getVisualizationData(visualizationType, options = {}) {
    const { country, region, limit = 1000 } = options;
    
    try {
      let data;
      
      switch (visualizationType) {
        case 'heatmap':
          data = await this.quotaAnalytics.getHeatmapData(limit);
          break;
        case 'routes':
          data = await this.routeCache.getPopularRoutes(limit);
          break;
        case 'elevation':
          data = await this.quotaAnalytics.getElevationProfiles(limit);
          break;
        case 'usage':
          data = await this.quotaAnalytics.getUsagePatterns(limit);
          break;
        default:
          throw new Error(`Type de visualisation non pris en charge: ${visualizationType}`);
      }
      
      // Filtrer les données par pays/région
      return this.filterDataByGeography(data, country, region);
    } catch (error) {
      console.error(`Erreur lors de la récupération des données de visualisation: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Filtre les données en fonction du pays et de la région
   * @param {Object} data - Données à filtrer
   * @param {string} country - Code du pays (optionnel)
   * @param {string} region - Code de la région (optionnel)
   * @returns {Object} Données filtrées
   */
  filterDataByGeography(data, country, region) {
    // Si aucun filtre n'est appliqué, retourner les données telles quelles
    if (!country && !region) {
      return data;
    }
    
    // Définir les pays par région
    const regionCountries = {
      western: ['fr', 'be', 'nl', 'lu'],
      eastern: ['pl', 'cz', 'sk', 'hu', 'ro', 'bg'],
      northern: ['dk', 'se', 'no', 'fi', 'ee', 'lv', 'lt'],
      southern: ['es', 'pt', 'it', 'gr', 'hr', 'si'],
      central: ['de', 'at', 'ch']
    };
    
    // Filtrer par pays
    if (country) {
      return this.filterByCountry(data, country);
    }
    
    // Filtrer par région
    if (region && regionCountries[region]) {
      const countriesInRegion = regionCountries[region];
      return this.filterByCountries(data, countriesInRegion);
    }
    
    return data;
  }
  
  /**
   * Filtre les données pour un pays spécifique
   * @param {Object} data - Données à filtrer
   * @param {string} country - Code du pays
   * @returns {Object} Données filtrées
   */
  filterByCountry(data, country) {
    if (!data || !country) return data;
    
    // Créer une copie profonde des données
    const filteredData = JSON.parse(JSON.stringify(data));
    
    // Filtrer les points de données (pour les heatmaps, routes, etc.)
    if (Array.isArray(filteredData.points)) {
      filteredData.points = filteredData.points.filter(point => 
        point.country === country || point.countryCode === country
      );
    }
    
    // Filtrer les itinéraires
    if (Array.isArray(filteredData.routes)) {
      filteredData.routes = filteredData.routes.filter(route => 
        route.country === country || route.countryCode === country
      );
    }
    
    // Filtrer les statistiques
    if (filteredData.statistics) {
      if (filteredData.statistics.byCountry && filteredData.statistics.byCountry[country]) {
        filteredData.statistics.overall = filteredData.statistics.byCountry[country];
      }
    }
    
    return filteredData;
  }
  
  /**
   * Filtre les données pour plusieurs pays
   * @param {Object} data - Données à filtrer
   * @param {Array<string>} countries - Liste des codes de pays
   * @returns {Object} Données filtrées
   */
  filterByCountries(data, countries) {
    if (!data || !Array.isArray(countries) || countries.length === 0) return data;
    
    // Créer une copie profonde des données
    const filteredData = JSON.parse(JSON.stringify(data));
    
    // Filtrer les points de données
    if (Array.isArray(filteredData.points)) {
      filteredData.points = filteredData.points.filter(point => 
        countries.includes(point.country) || countries.includes(point.countryCode)
      );
    }
    
    // Filtrer les itinéraires
    if (Array.isArray(filteredData.routes)) {
      filteredData.routes = filteredData.routes.filter(route => 
        countries.includes(route.country) || countries.includes(route.countryCode)
      );
    }
    
    // Agréger les statistiques pour tous les pays de la région
    if (filteredData.statistics && filteredData.statistics.byCountry) {
      const regionalStats = {
        requestCount: 0,
        successCount: 0,
        errorCount: 0,
        avgResponseTime: 0,
        totalResponseTime: 0,
        sampleCount: 0
      };
      
      let validCountriesCount = 0;
      
      countries.forEach(country => {
        const countryStats = filteredData.statistics.byCountry[country];
        if (countryStats) {
          validCountriesCount++;
          regionalStats.requestCount += countryStats.requestCount || 0;
          regionalStats.successCount += countryStats.successCount || 0;
          regionalStats.errorCount += countryStats.errorCount || 0;
          regionalStats.totalResponseTime += (countryStats.avgResponseTime || 0) * (countryStats.sampleCount || 0);
          regionalStats.sampleCount += countryStats.sampleCount || 0;
        }
      });
      
      if (regionalStats.sampleCount > 0) {
        regionalStats.avgResponseTime = regionalStats.totalResponseTime / regionalStats.sampleCount;
      }
      
      filteredData.statistics.overall = regionalStats;
    }
    
    return filteredData;
  }
  
  /**
   * Récupère les métadonnées des pays pour l'intégration avec les cartes
   * @returns {Object} Métadonnées des pays
   */
  getCountryMetadata() {
    return {
      countries: [
        { code: 'fr', name: 'France', region: 'western' },
        { code: 'de', name: 'Allemagne', region: 'central' },
        { code: 'it', name: 'Italie', region: 'southern' },
        { code: 'es', name: 'Espagne', region: 'southern' },
        { code: 'be', name: 'Belgique', region: 'western' },
        { code: 'nl', name: 'Pays-Bas', region: 'western' },
        { code: 'ch', name: 'Suisse', region: 'central' },
        { code: 'at', name: 'Autriche', region: 'central' },
        { code: 'gb', name: 'Royaume-Uni', region: 'western' },
        { code: 'ie', name: 'Irlande', region: 'western' },
        { code: 'dk', name: 'Danemark', region: 'northern' },
        { code: 'se', name: 'Suède', region: 'northern' },
        { code: 'no', name: 'Norvège', region: 'northern' },
        { code: 'fi', name: 'Finlande', region: 'northern' },
        { code: 'pt', name: 'Portugal', region: 'southern' },
        { code: 'pl', name: 'Pologne', region: 'eastern' },
        { code: 'cz', name: 'République tchèque', region: 'eastern' },
        { code: 'sk', name: 'Slovaquie', region: 'eastern' },
        { code: 'hu', name: 'Hongrie', region: 'eastern' },
        { code: 'ro', name: 'Roumanie', region: 'eastern' },
        { code: 'bg', name: 'Bulgarie', region: 'eastern' },
        { code: 'gr', name: 'Grèce', region: 'southern' },
        { code: 'hr', name: 'Croatie', region: 'southern' },
        { code: 'si', name: 'Slovénie', region: 'southern' },
        { code: 'ee', name: 'Estonie', region: 'northern' },
        { code: 'lv', name: 'Lettonie', region: 'northern' },
        { code: 'lt', name: 'Lituanie', region: 'northern' },
        { code: 'lu', name: 'Luxembourg', region: 'western' }
      ],
      regions: [
        { code: 'western', name: 'Europe occidentale' },
        { code: 'eastern', name: 'Europe orientale' },
        { code: 'northern', name: 'Europe du Nord' },
        { code: 'southern', name: 'Europe du Sud' },
        { code: 'central', name: 'Europe centrale' }
      ]
    };
  }
  
  /**
   * Récupère les limites géographiques des pays pour l'intégration avec les cartes
   * @returns {Object} Limites géographiques des pays
   */
  getCountryBounds() {
    return {
      'fr': { lat: [42.5, 51.0], lng: [-4.5, 8.0] },
      'de': { lat: [47.3, 55.0], lng: [5.9, 15.0] },
      'it': { lat: [36.6, 47.1], lng: [6.7, 18.5] },
      'es': { lat: [36.0, 43.8], lng: [-9.3, 3.3] },
      'be': { lat: [49.5, 51.5], lng: [2.5, 6.4] },
      'nl': { lat: [50.8, 53.5], lng: [3.3, 7.2] },
      'ch': { lat: [45.8, 47.8], lng: [6.0, 10.5] },
      'at': { lat: [46.4, 49.0], lng: [9.5, 17.2] },
      'gb': { lat: [49.9, 58.7], lng: [-8.2, 1.8] },
      'ie': { lat: [51.4, 55.4], lng: [-10.5, -6.0] },
      'dk': { lat: [54.5, 57.8], lng: [8.0, 15.2] },
      'se': { lat: [55.3, 69.1], lng: [11.1, 24.2] },
      'no': { lat: [58.0, 71.2], lng: [4.5, 31.0] },
      'fi': { lat: [59.8, 70.1], lng: [20.6, 31.5] },
      'pt': { lat: [37.0, 42.2], lng: [-9.5, -6.2] },
      'pl': { lat: [49.0, 54.8], lng: [14.1, 24.2] },
      'cz': { lat: [48.5, 51.1], lng: [12.1, 18.9] },
      'sk': { lat: [47.7, 49.6], lng: [16.8, 22.6] },
      'hu': { lat: [45.7, 48.6], lng: [16.1, 22.9] },
      'ro': { lat: [43.6, 48.3], lng: [20.3, 29.7] },
      'bg': { lat: [41.2, 44.2], lng: [22.4, 28.6] },
      'gr': { lat: [35.0, 41.7], lng: [19.4, 28.2] },
      'hr': { lat: [42.4, 46.5], lng: [13.5, 19.4] },
      'si': { lat: [45.4, 46.9], lng: [13.4, 16.6] },
      'ee': { lat: [57.5, 59.7], lng: [21.8, 28.2] },
      'lv': { lat: [55.7, 58.1], lng: [20.8, 28.2] },
      'lt': { lat: [53.9, 56.5], lng: [21.0, 26.8] },
      'lu': { lat: [49.4, 50.2], lng: [5.7, 6.5] }
    };
  }
}

module.exports = IntegrationHelpers;
