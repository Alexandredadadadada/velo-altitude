/**
 * weather-map-fixed.js
 * Version corrigée pour éviter les problèmes de minification avec Terser
 * Utilise une IIFE (Immediately Invoked Function Expression) pour encapsuler le code
 */
(function() {
  // Configuration globale
  const config = {
    apiKey: 'YOUR_WEATHER_API_KEY',
    mapboxToken: 'YOUR_MAPBOX_TOKEN',
    defaultZoom: 12,
    refreshInterval: 30 * 60 * 1000, // 30 minutes en millisecondes
    weatherIcons: {
      'clear': '/images/weather/clear.svg',
      'clouds': '/images/weather/clouds.svg',
      'rain': '/images/weather/rain.svg',
      'snow': '/images/weather/snow.svg',
      'fog': '/images/weather/fog.svg',
      'thunderstorm': '/images/weather/thunderstorm.svg'
    }
  };

  // Classe WeatherMap pour l'affichage météo sur la carte
  class WeatherMap {
    constructor(containerId, options = {}) {
      this.container = document.getElementById(containerId);
      if (!this.container) {
        console.error(`Container with id ${containerId} not found`);
        return;
      }
      
      this.options = Object.assign({
        center: [48.8566, 2.3522], // Paris par défaut
        zoom: config.defaultZoom,
        weatherProvider: 'openweathermap',
        showControls: true,
        showLegend: true
      }, options);
      
      this.map = null;
      this.weatherData = null;
      this.markers = [];
      
      this.init();
    }
    
    async init() {
      try {
        // Initialiser la carte
        this.initMap();
        
        // Charger les données météo si des coordonnées sont spécifiées
        if (this.options.coordinates) {
          await this.loadWeatherData(this.options.coordinates);
        }
        
        // Ajouter des contrôles si demandé
        if (this.options.showControls) {
          this.addControls();
        }
        
        // Ajouter une légende si demandée
        if (this.options.showLegend) {
          this.addLegend();
        }
      } catch (error) {
        console.error('Error initializing weather map:', error);
        this.showErrorMessage();
      }
    }
    
    initMap() {
      // Vérifier si mapboxgl est disponible
      if (!window.mapboxgl) {
        throw new Error('Mapbox GL JS is not loaded');
      }
      
      mapboxgl.accessToken = config.mapboxToken;
      
      this.map = new mapboxgl.Map({
        container: this.container,
        style: 'mapbox://styles/mapbox/outdoors-v11',
        center: this.options.center,
        zoom: this.options.zoom,
        attributionControl: true
      });
      
      // Ajouter les contrôles de navigation
      this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Gérer le chargement de la carte
      this.map.on('load', () => {
        console.log('Map loaded successfully');
        this.mapLoaded = true;
        
        // Si des données météo ont été chargées avant que la carte ne soit prête
        if (this.weatherData) {
          this.displayWeatherData();
        }
      });
      
      // Gérer les erreurs de chargement
      this.map.on('error', (e) => {
        console.error('Error loading map:', e);
        this.showErrorMessage('Impossible de charger la carte');
      });
    }
    
    async loadWeatherData(coordinates) {
      try {
        const [lat, lng] = coordinates;
        const weatherData = await this.fetchWeatherData(lat, lng);
        this.weatherData = weatherData;
        
        // Afficher les données si la carte est déjà chargée
        if (this.mapLoaded) {
          this.displayWeatherData();
        }
        
        return weatherData;
      } catch (error) {
        console.error('Error loading weather data:', error);
        this.showErrorMessage('Données météo indisponibles');
        return null;
      }
    }
    
    async fetchWeatherData(lat, lng) {
      // Simulation d'API météo (à remplacer par votre propre implémentation)
      return {
        current: {
          temp: 22,
          humidity: 65,
          wind_speed: 12,
          weather: [{ id: 800, main: 'Clear', icon: '01d' }]
        },
        daily: [
          {
            dt: Date.now() / 1000,
            temp: { day: 22, min: 18, max: 25 },
            weather: [{ id: 800, main: 'Clear', icon: '01d' }]
          },
          {
            dt: Date.now() / 1000 + 86400,
            temp: { day: 20, min: 17, max: 23 },
            weather: [{ id: 801, main: 'Clouds', icon: '02d' }]
          },
          {
            dt: Date.now() / 1000 + 172800,
            temp: { day: 19, min: 15, max: 21 },
            weather: [{ id: 500, main: 'Rain', icon: '10d' }]
          }
        ]
      };
    }
    
    displayWeatherData() {
      // Nettoyer les marqueurs existants
      this.clearMarkers();
      
      if (!this.weatherData) return;
      
      // Créer un marqueur pour les conditions actuelles
      this.addWeatherMarker(
        this.options.center,
        this.weatherData.current
      );
    }
    
    addWeatherMarker(coordinates, data) {
      // Créer un élément DOM pour le marqueur
      const el = document.createElement('div');
      el.className = 'weather-marker';
      
      // Déterminer l'icône à utiliser
      const weatherCondition = data.weather[0].main.toLowerCase();
      const iconUrl = config.weatherIcons[weatherCondition] || config.weatherIcons.clear;
      
      // Définir le contenu HTML du marqueur
      el.innerHTML = `
        <div class="weather-icon">
          <img src="${iconUrl}" alt="${data.weather[0].main}">
        </div>
        <div class="weather-info">
          <div class="temperature">${Math.round(data.temp)}°C</div>
          <div class="condition">${data.weather[0].main}</div>
        </div>
      `;
      
      // Créer le marqueur et l'ajouter à la carte
      const marker = new mapboxgl.Marker(el)
        .setLngLat(coordinates)
        .addTo(this.map);
      
      // Stocker le marqueur pour pouvoir le supprimer plus tard
      this.markers.push(marker);
      
      return marker;
    }
    
    clearMarkers() {
      this.markers.forEach(marker => marker.remove());
      this.markers = [];
    }
    
    addControls() {
      // Ajouter des contrôles personnalisés à la carte
      const controlDiv = document.createElement('div');
      controlDiv.className = 'weather-controls';
      controlDiv.innerHTML = `
        <button class="refresh-button" title="Rafraîchir les données météo">
          <span class="refresh-icon">↻</span>
        </button>
      `;
      
      // Ajouter le contrôle à la carte
      this.container.appendChild(controlDiv);
      
      // Gérer le clic sur le bouton de rafraîchissement
      const refreshButton = controlDiv.querySelector('.refresh-button');
      refreshButton.addEventListener('click', () => {
        if (this.options.coordinates) {
          this.loadWeatherData(this.options.coordinates);
        }
      });
    }
    
    addLegend() {
      // Ajouter une légende à la carte
      const legendDiv = document.createElement('div');
      legendDiv.className = 'weather-legend';
      legendDiv.innerHTML = `
        <h3>Légende</h3>
        <div class="legend-item">
          <img src="${config.weatherIcons.clear}" alt="Clair">
          <span>Clair</span>
        </div>
        <div class="legend-item">
          <img src="${config.weatherIcons.clouds}" alt="Nuageux">
          <span>Nuageux</span>
        </div>
        <div class="legend-item">
          <img src="${config.weatherIcons.rain}" alt="Pluie">
          <span>Pluie</span>
        </div>
      `;
      
      // Ajouter la légende à la carte
      this.container.appendChild(legendDiv);
    }
    
    showErrorMessage(message = 'Une erreur est survenue') {
      // Afficher un message d'erreur dans le conteneur de la carte
      const errorDiv = document.createElement('div');
      errorDiv.className = 'weather-error';
      errorDiv.textContent = message;
      
      this.container.appendChild(errorDiv);
      
      // Supprimer le message après quelques secondes
      setTimeout(() => {
        errorDiv.remove();
      }, 5000);
    }
  }

  // Exposer la classe WeatherMap au niveau global pour qu'elle soit accessible
  window.WeatherMap = WeatherMap;
})();
