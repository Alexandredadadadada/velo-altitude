/**
 * Module d'intégration Météo-Carte pour l'application Grand Est Cyclisme
 * Permet d'afficher les conditions météo directement sur la carte à l'échelle européenne
 */

// Utilisation d'une IIFE standard pour éviter les problèmes de minification avec Terser
var WeatherMap = (function() {
  // Configuration
  var config = {
    tileSize: 50,          // Taille des tuiles météo en pixels
    refreshInterval: 30,   // Intervalle de rafraîchissement en minutes
    defaultOpacity: 0.7,   // Opacité par défaut de la couche météo
    enableCaching: true,   // Activer la mise en cache des données
    cacheTTL: 60,          // Durée de vie du cache en minutes
    useDynamicLoading: true, // Charger dynamiquement les données selon le zoom
    language: 'fr'         // Langue par défaut (sera remplacée par I18n.getCurrentLanguage())
  };
  
  // État interne
  var state = {
    initialized: false,
    weatherLayerVisible: false,
    weatherMarkers: [],
    weatherTiles: {},
    loadingRegions: {},
    currentZoom: 0,
    weatherData: {},
    selectedWeatherType: 'temperature', // temperature, precipitation, wind, etc.
    lastUpdate: null
  };
  
  // Références aux éléments DOM
  var elements = {
    mapContainer: null,
    weatherOverlay: null,
    weatherControl: null,
    weatherLegend: null
  };
  
  // Référence à l'instance de la carte
  var mapInstance = null;
  
  /**
   * Initialise le module d'intégration météo-carte
   * @param {Object} map Instance de mapboxgl.Map
   */
  function init(map) {
    if (!map) {
      console.error('WeatherMap: L\'instance de carte est requise pour l\'initialisation');
      return;
    }
    
    // Stocker la référence à la carte
    mapInstance = map;
    elements.mapContainer = map.getContainer();
    
    // Mise à jour de la langue si le module I18n est disponible
    if (window.I18n) {
      config.language = I18n.getCurrentLanguage();
      
      // Écouter les changements de langue
      document.addEventListener('languageChanged', function(e) {
        config.language = e.detail.language;
        updateUI();
      });
    }
    
    // Créer les éléments DOM
    createUIElements();
    
    // Ajouter les écouteurs d'événements
    addEventListeners();
    
    // Charger les données météo européennes initiales
    loadInitialWeatherData();
    
    // Configurer le rechargement périodique
    setInterval(refreshWeatherData, config.refreshInterval * 60 * 1000);
    
    state.initialized = true;
    console.info('Module WeatherMap initialisé');
  }
  
  /**
   * Crée les éléments d'interface utilisateur pour la couche météo
   */
  function createUIElements() {
    // Couche météo par-dessus la carte
    elements.weatherOverlay = document.createElement('div');
    elements.weatherOverlay.className = 'weather-map-overlay';
    elements.weatherOverlay.style.display = 'none';
    elements.mapContainer.appendChild(elements.weatherOverlay);
    
    // Contrôle pour activer/désactiver la couche météo
    elements.weatherControl = document.createElement('div');
    elements.weatherControl.className = 'weather-layer-control';
    elements.weatherControl.innerHTML = [
      '<div class="control-title">' + (window.I18n ? I18n.translate('weather.title') : 'Conditions météo') + '</div>',
      '<div class="weather-layer-toggle">',
      '  <input type="checkbox" id="weather-layer-toggle" />',
      '  <label for="weather-layer-toggle">' + (window.I18n ? I18n.translate('map.weather') : 'Couche météo') + '</label>',
      '</div>',
      '<div class="weather-layer-type">',
      '  <select id="weather-layer-type">',
      '    <option value="temperature">' + (window.I18n ? I18n.translate('weather.temperature') : 'Température') + '</option>',
      '    <option value="precipitation">' + (window.I18n ? I18n.translate('weather.precipitation') : 'Précipitations') + '</option>',
      '    <option value="wind">' + (window.I18n ? I18n.translate('weather.wind') : 'Vent') + '</option>',
      '    <option value="clouds">' + (window.I18n ? I18n.translate('weather.clouds') : 'Nuages') + '</option>',
      '  </select>',
      '</div>'
    ].join('');
    
    elements.mapContainer.appendChild(elements.weatherControl);
    
    // Légende météo
    elements.weatherLegend = document.createElement('div');
    elements.weatherLegend.className = 'weather-legend';
    elements.weatherLegend.style.display = 'none';
    elements.mapContainer.appendChild(elements.weatherLegend);
    
    // Initialiser avec la légende de température par défaut
    updateWeatherLegend('temperature');
  }
  
  /**
   * Ajoute les écouteurs d'événements nécessaires
   */
  function addEventListeners() {
    // Écouter les changements de la case à cocher
    document.getElementById('weather-layer-toggle').addEventListener('change', function(e) {
      toggleWeatherLayer(e.target.checked);
    });
    
    // Écouter les changements de type de données météo
    document.getElementById('weather-layer-type').addEventListener('change', function(e) {
      state.selectedWeatherType = e.target.value;
      updateWeatherLayer();
      updateWeatherLegend(state.selectedWeatherType);
    });
    
    // Écouter les événements de la carte
    mapInstance.on('moveend', function() {
      if (state.weatherLayerVisible) {
        const bounds = mapInstance.getBounds();
        const zoom = mapInstance.getZoom();
        
        // Vérifier si le zoom a changé
        if (state.currentZoom !== zoom) {
          state.currentZoom = zoom;
        }
        
        // Charger les données pour les nouvelles régions visibles
        const regions = calculateRegionsToLoad(bounds, zoom);
        regions.forEach(loadWeatherDataForRegion);
      }
    });
  }
  
  /**
   * Charge les données météo initiales pour l'Europe
   */
  function loadInitialWeatherData() {
    // Coordonnées approximatives de l'Europe
    const europeBounds = {
      south: 35.0,
      west: -10.0,
      north: 60.0,
      east: 30.0
    };
    
    // Utiliser un zoom moyen pour déterminer la taille de la grille
    const regions = calculateRegionsToLoad(europeBounds, 5);
    regions.forEach(loadWeatherDataForRegion);
  }
  
  /**
   * Calcule quelles régions doivent être chargées en fonction des limites de la carte
   * @param {Object} bounds Limites de la carte (LngLatBounds)
   * @param {number} zoom Niveau de zoom actuel
   * @returns {Array} Liste des régions à charger
   */
  function calculateRegionsToLoad(bounds, zoom) {
    // Déterminer la taille de la grille en fonction du zoom
    let gridSize;
    
    if (zoom < 4) {
      gridSize = 10.0; // Grande grille pour les vues éloignées
    } else if (zoom < 7) {
      gridSize = 5.0;  // Grille moyenne
    } else if (zoom < 10) {
      gridSize = 2.0;  // Grille plus fine
    } else {
      gridSize = 1.0;  // Grille fine pour les zooms proches
    }
    
    const regions = [];
    
    // Diviser la zone visible en régions
    for (let lat = Math.floor(bounds.south / gridSize) * gridSize; lat <= Math.ceil(bounds.north / gridSize) * gridSize; lat += gridSize) {
      for (let lng = Math.floor(bounds.west / gridSize) * gridSize; lng <= Math.ceil(bounds.east / gridSize) * gridSize; lng += gridSize) {
        regions.push({
          id: lat + "," + lng + "," + gridSize,
          bounds: {
            south: lat,
            west: lng,
            north: lat + gridSize,
            east: lng + gridSize
          },
          gridSize: gridSize
        });
      }
    }
    
    return regions;
  }
  
  /**
   * Charge les données météo pour une région spécifique
   * @param {Object} region Information sur la région à charger
   */
  function loadWeatherDataForRegion(region) {
    // Éviter de charger des données déjà en cours de chargement
    if (state.loadingRegions[region.id]) {
      return;
    }
    
    // Marquer la région comme en cours de chargement
    state.loadingRegions[region.id] = true;
    
    // Vérifier si des données de cache sont disponibles
    if (config.enableCaching && window.CacheManager) {
      const cachedData = CacheManager.get("weather_region_" + region.id);
      if (cachedData) {
        // Vérifier si les données sont toujours valides
        const cacheAge = (Date.now() - cachedData.timestamp) / (60 * 1000); // minutes
        if (cacheAge < config.cacheTTL) {
          // Utiliser les données du cache
          processWeatherData(region.id, cachedData.data);
          state.loadingRegions[region.id] = false;
          return;
        }
      }
    }
    
    // Construire les paramètres de la requête
    var params = new URLSearchParams({
      southLat: region.bounds.south,
      westLng: region.bounds.west,
      northLat: region.bounds.north,
      eastLng: region.bounds.east,
      gridSize: region.gridSize,
      lang: config.language
    });
    
    // Faire la requête API
    fetch("/api/weather/region?" + params.toString())
      .then(function(response) {
        if (!response.ok) {
          throw new Error("Erreur HTTP " + response.status);
        }
        return response.json();
      })
      .then(function(data) {
        // Mettre en cache les données
        if (config.enableCaching && window.CacheManager) {
          CacheManager.set("weather_region_" + region.id, {
            data: data,
            timestamp: Date.now()
          }, config.cacheTTL * 60); // TTL en secondes
        }
        
        // Traiter les données reçues
        processWeatherData(region.id, data);
      })
      .catch(function(error) {
        console.error("Erreur lors du chargement des données météo pour la région " + region.id + ":", error);
      })
      .finally(function() {
        // Marquer la région comme terminée, qu'il y ait eu une erreur ou non
        state.loadingRegions[region.id] = false;
      });
  }
  
  /**
   * Traite les données météo reçues pour une région
   * @param {string} regionId Identifiant de la région
   * @param {Object} data Données météo
   */
  function processWeatherData(regionId, data) {
    // Stocker les données
    state.weatherData[regionId] = data;
    
    // Si la couche météo est visible, mettre à jour l'affichage
    if (state.weatherLayerVisible) {
      updateWeatherLayer();
    }
  }
  
  /**
   * Rafraîchit les données météo pour toutes les régions visibles
   */
  function refreshWeatherData() {
    // Ne rafraîchir que si la couche météo est visible
    if (!state.weatherLayerVisible) {
      return;
    }
    
    console.info('Rafraîchissement des données météo...');
    
    // Récupérer les limites visibles de la carte
    const bounds = mapInstance.getBounds();
    const zoom = mapInstance.getZoom();
    
    // Calculer les régions à charger
    const regions = calculateRegionsToLoad(bounds, zoom);
    
    // Charger les données pour chaque région
    regions.forEach(loadWeatherDataForRegion);
    
    // Mettre à jour la date de dernière mise à jour
    state.lastUpdate = new Date();
  }
  
  /**
   * Active ou désactive la couche météo
   * @param {boolean} visible Visibilité de la couche
   */
  function toggleWeatherLayer(visible) {
    state.weatherLayerVisible = visible;
    elements.weatherOverlay.style.display = visible ? 'block' : 'none';
    elements.weatherLegend.style.display = visible ? 'block' : 'none';
    
    if (visible) {
      // Charger les données pour la vue actuelle si nécessaire
      refreshWeatherData();
    }
  }
  
  /**
   * Met à jour l'affichage de la couche météo
   */
  function updateWeatherLayer() {
    // Fonction à implémenter pour mettre à jour visuellement la couche météo
    console.log("Mise à jour de la couche météo avec le type: " + state.selectedWeatherType);
  }
  
  /**
   * Met à jour la légende en fonction du type de données météo sélectionné
   * @param {string} type Type de données météo
   */
  function updateWeatherLegend(type) {
    // Fonction à implémenter pour mettre à jour la légende
    console.log("Mise à jour de la légende pour le type: " + type);
  }
  
  /**
   * Met à jour les éléments d'interface utilisateur (langue, etc.)
   */
  function updateUI() {
    // Fonction à implémenter pour mettre à jour l'interface
    console.log("Mise à jour de l'interface avec la langue: " + config.language);
  }
  
  // API publique
  return {
    init: init,
    toggleWeatherLayer: toggleWeatherLayer,
    refresh: refreshWeatherData,
    getState: function() {
      return { ...state };
    }
  };
})();

// Assurez-vous que WeatherMap est accessible globalement
window.WeatherMap = WeatherMap;
