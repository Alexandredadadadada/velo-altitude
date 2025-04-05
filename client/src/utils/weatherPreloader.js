/**
 * Utilitaire de préchargement des données météo pour les cols et itinéraires populaires
 * Optimise les performances en chargeant en arrière-plan les données météo pour les destinations fréquentes
 */
import axios from 'axios';
import weatherCache from './weatherCache';
import { popular_locations } from '../data/popular-locations';

class WeatherPreloader {
  constructor() {
    this.isInitialized = false;
    this.isPreloading = false;
    this.preloadQueue = [];
    this.preloadInterval = null;
    this.syncInProgress = false;
    this.stats = {
      totalPreloaded: 0,
      lastPreloadTime: null,
      successCount: 0,
      errorCount: 0
    };
  }

  /**
   * Initialise le préchargeur de données météo
   * @param {Object} options Options de configuration
   */
  initialize(options = {}) {
    if (this.isInitialized) return;
    
    const defaultOptions = {
      preloadPopularOnStart: true,
      preloadInterval: 30 * 60 * 1000, // 30 minutes
      concurrentPreloads: 2,
      enableSync: true
    };
    
    this.options = { ...defaultOptions, ...options };
    this.isInitialized = true;
    
    console.log('[WeatherPreloader] ⚡ Préchargeur de données météo initialisé');
    
    // Précharger les données météo pour les cols populaires au démarrage
    if (this.options.preloadPopularOnStart) {
      this.preloadPopularLocations();
    }
    
    // Configurer la synchronisation périodique
    if (this.options.enableSync && this.options.preloadInterval > 0) {
      this.preloadInterval = setInterval(() => {
        this.preloadPopularLocations();
      }, this.options.preloadInterval);
      
      console.log(`[WeatherPreloader] 🔄 Synchronisation planifiée toutes les ${this.options.preloadInterval / 60000} minutes`);
    }
  }

  /**
   * Précharge les données météo pour les cols et itinéraires populaires
   */
  async preloadPopularLocations() {
    if (this.syncInProgress) {
      console.log('[WeatherPreloader] ⏳ Synchronisation déjà en cours');
      return;
    }
    
    this.syncInProgress = true;
    console.log('[WeatherPreloader] 🔄 Démarrage de la synchronisation des données météo');
    
    try {
      // Ajouter les cols populaires à la file d'attente de préchargement
      this.preloadQueue = [...popular_locations];
      
      // Mélanger la file pour éviter de toujours précharger les mêmes données en premier
      this.shuffleQueue();
      
      // Démarrer le préchargement
      await this.startPreloading();
      
      this.stats.lastPreloadTime = new Date();
      console.log(`[WeatherPreloader] ✅ Synchronisation terminée avec ${this.stats.successCount} succès et ${this.stats.errorCount} erreurs`);
    } catch (error) {
      console.error('[WeatherPreloader] ❌ Erreur lors de la synchronisation:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Précharge les données météo pour une location spécifique
   * @param {Object} location Objet contenant latitude, longitude et nom
   */
  async preloadLocation(location) {
    if (!location || !location.lat || !location.lng) {
      console.error('[WeatherPreloader] ❌ Données de localisation invalides');
      return;
    }
    
    try {
      console.log(`[WeatherPreloader] 🔍 Préchargement des données météo pour ${location.name || 'lieu inconnu'}`);
      
      // Récupérer les données météo actuelles
      const currentWeather = await axios.get(`/api/weather/current?lat=${location.lat}&lon=${location.lng}`);
      
      // Stocker dans le cache
      weatherCache.getWeatherData(
        location.lat.toString(),
        location.lng.toString(),
        async () => currentWeather.data
      );
      
      // Récupérer également les prévisions
      const forecast = await axios.get(`/api/weather/forecast?lat=${location.lat}&lon=${location.lng}`);
      
      // Stocker dans le cache avec une clé différente pour les prévisions
      weatherCache.getWeatherData(
        `forecast_${location.lat}`,
        `forecast_${location.lng}`,
        async () => forecast.data
      );
      
      this.stats.successCount++;
      this.stats.totalPreloaded++;
      
      return true;
    } catch (error) {
      console.error(`[WeatherPreloader] ❌ Erreur lors du préchargement pour ${location.name || 'lieu inconnu'}:`, error);
      this.stats.errorCount++;
      return false;
    }
  }

  /**
   * Démarre le processus de préchargement en parallèle
   * @returns {Promise<void>}
   */
  async startPreloading() {
    this.isPreloading = true;
    
    // Réinitialiser les compteurs
    this.stats.successCount = 0;
    this.stats.errorCount = 0;
    
    // Précharger en parallèle avec une limite de concurrence
    const concurrentPreloads = this.options.concurrentPreloads || 2;
    const tasks = [];
    
    for (let i = 0; i < concurrentPreloads && this.preloadQueue.length > 0; i++) {
      tasks.push(this.processPreloadQueue());
    }
    
    await Promise.all(tasks);
    this.isPreloading = false;
  }

  /**
   * Traite la file d'attente de préchargement, un élément à la fois
   * @returns {Promise<void>}
   */
  async processPreloadQueue() {
    while (this.preloadQueue.length > 0) {
      const location = this.preloadQueue.shift();
      await this.preloadLocation(location);
      
      // Petite pause entre les requêtes pour éviter les limitations d'API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  /**
   * Mélange la file d'attente de préchargement
   */
  shuffleQueue() {
    for (let i = this.preloadQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.preloadQueue[i], this.preloadQueue[j]] = [this.preloadQueue[j], this.preloadQueue[i]];
    }
  }

  /**
   * Ajoute une location à la file de préchargement
   * @param {Object} location Objet contenant latitude, longitude et nom
   */
  addToPreloadQueue(location) {
    if (!location || !location.lat || !location.lng) return;
    
    this.preloadQueue.push(location);
    
    // Si le préchargement n'est pas en cours, le démarrer
    if (!this.isPreloading && !this.syncInProgress) {
      this.startPreloading();
    }
  }

  /**
   * Arrête le préchargeur et nettoie les ressources
   */
  shutdown() {
    if (this.preloadInterval) {
      clearInterval(this.preloadInterval);
    }
    
    this.isInitialized = false;
    this.preloadQueue = [];
    console.log('[WeatherPreloader] 🛑 Préchargeur de données météo arrêté');
  }

  /**
   * Obtient les statistiques du préchargeur
   * @returns {Object} Statistiques
   */
  getStats() {
    return {
      ...this.stats,
      queueLength: this.preloadQueue.length,
      isPreloading: this.isPreloading,
      isSyncing: this.syncInProgress
    };
  }
}

// Créer une instance singleton
const weatherPreloader = new WeatherPreloader();

export default weatherPreloader;
