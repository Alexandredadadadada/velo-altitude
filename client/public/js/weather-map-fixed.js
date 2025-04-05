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
  
  // Déclaration des fonctions pour éviter les problèmes de référence
  var createUIElements;
  var addEventListeners;
  var loadInitialWeatherData;
  var calculateRegionsToLoad;
  var loadWeatherDataForRegion;
  var updateWeatherLayer;
  var updateWeatherLegend;
  var toggleWeatherLayer;
  var refreshWeatherData;
  var updateUI;
  
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
   * Met à jour l'interface utilisateur
   */
  updateUI = function() {
    // Code pour mettre à jour l'interface utilisateur
    if (elements.weatherControl) {
      // Mettre à jour les textes selon la langue
      if (window.I18n) {
        elements.weatherControl.querySelector('.control-title').textContent = I18n.translate('weather.title');
        elements.weatherControl.querySelector('label[for="weather-layer-toggle"]').textContent = I18n.translate('map.weather');
        
        // Mettre à jour les options du sélecteur
        const select = elements.weatherControl.querySelector('#weather-layer-type');
        select.options[0].textContent = I18n.translate('weather.temperature');
        select.options[1].textContent = I18n.translate('weather.precipitation');
        select.options[2].textContent = I18n.translate('weather.wind');
        select.options[3].textContent = I18n.translate('weather.clouds');
      }
    }
    
    // Mettre à jour la légende
    updateWeatherLegend(state.selectedWeatherType);
  };
  
  /**
   * Crée les éléments d'interface utilisateur pour la couche météo
   */
  createUIElements = function() {
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
  };
  
  /**
   * Met à jour la légende selon le type de données météo sélectionné
   * @param {string} type Type de données météo
   */
  updateWeatherLegend = function(type) {
    if (!elements.weatherLegend) return;
    
    let legendHTML = '<div class="legend-title">';
    
    switch (type) {
      case 'temperature':
        legendHTML += (window.I18n ? I18n.translate('weather.temperature') : 'Température');
        legendHTML += '</div><div class="legend-gradient temperature">';
        legendHTML += '<span class="min">-10°C</span>';
        legendHTML += '<span class="max">35°C</span>';
        break;
      case 'precipitation':
        legendHTML += (window.I18n ? I18n.translate('weather.precipitation') : 'Précipitations');
        legendHTML += '</div><div class="legend-gradient precipitation">';
        legendHTML += '<span class="min">0 mm</span>';
        legendHTML += '<span class="max">25+ mm</span>';
        break;
      case 'wind':
        legendHTML += (window.I18n ? I18n.translate('weather.wind') : 'Vent');
        legendHTML += '</div><div class="legend-gradient wind">';
        legendHTML += '<span class="min">0 km/h</span>';
        legendHTML += '<span class="max">60+ km/h</span>';
        break;
      case 'clouds':
        legendHTML += (window.I18n ? I18n.translate('weather.clouds') : 'Nuages');
        legendHTML += '</div><div class="legend-gradient clouds">';
        legendHTML += '<span class="min">0%</span>';
        legendHTML += '<span class="max">100%</span>';
        break;
    }
    
    legendHTML += '</div>';
    
    // Mettre à jour la légende
    elements.weatherLegend.innerHTML = legendHTML;
  };
  
  /**
   * Active ou désactive la couche météo
   * @param {boolean} visible Visibilité de la couche
   */
  toggleWeatherLayer = function(visible) {
    state.weatherLayerVisible = visible;
    
    if (visible) {
      elements.weatherOverlay.style.display = 'block';
      elements.weatherLegend.style.display = 'block';
      
      // Charger les données météo si nécessaire
      const bounds = mapInstance.getBounds();
      const zoom = mapInstance.getZoom();
      state.currentZoom = zoom;
      
      const regions = calculateRegionsToLoad(bounds, zoom);
      regions.forEach(loadWeatherDataForRegion);
      
      updateWeatherLayer();
    } else {
      elements.weatherOverlay.style.display = 'none';
      elements.weatherLegend.style.display = 'none';
    }
  };
  
  /**
   * Met à jour la couche météo avec les données actuelles
   */
  updateWeatherLayer = function() {
    if (!state.weatherLayerVisible || !elements.weatherOverlay) return;
    
    // Vider les marqueurs existants
    state.weatherMarkers.forEach(marker => {
      if (marker.element && marker.element.parentNode) {
        marker.element.parentNode.removeChild(marker.element);
      }
    });
    state.weatherMarkers = [];
    
    // Parcourir toutes les données météo disponibles
    for (const regionKey in state.weatherData) {
      if (state.weatherData.hasOwnProperty(regionKey)) {
        const regionData = state.weatherData[regionKey];
        
        // Créer des marqueurs météo pour cette région
        regionData.locations.forEach(location => {
          createWeatherMarker(location);
        });
      }
    }
  };
  
  /**
   * Crée un marqueur météo sur la carte
   * @param {Object} location Données de localisation et météo
   */
  function createWeatherMarker(location) {
    // Créer l'élément DOM pour le marqueur
    const markerElement = document.createElement('div');
    markerElement.className = 'weather-marker';
    
    // Adapter le contenu en fonction du type de données météo sélectionné
    let value, unit, className;
    
    switch (state.selectedWeatherType) {
      case 'temperature':
        value = location.temp;
        unit = '°C';
        className = getTemperatureClassName(value);
        break;
      case 'precipitation':
        value = location.precip;
        unit = 'mm';
        className = getPrecipitationClassName(value);
        break;
      case 'wind':
        value = location.wind;
        unit = 'km/h';
        className = getWindClassName(value);
        break;
      case 'clouds':
        value = location.clouds;
        unit = '%';
        className = getCloudsClassName(value);
        break;
    }
    
    markerElement.classList.add(className);
    markerElement.innerHTML = '<span class="value">' + value + unit + '</span>';
    
    // Positionner le marqueur sur la carte
    const markerPosition = mapInstance.project([location.lng, location.lat]);
    markerElement.style.left = markerPosition.x + 'px';
    markerElement.style.top = markerPosition.y + 'px';
    
    // Ajouter le marqueur à la couche
    elements.weatherOverlay.appendChild(markerElement);
    
    // Stocker le marqueur pour le nettoyage ultérieur
    state.weatherMarkers.push({
      element: markerElement,
      location: location
    });
  }
  
  /**
   * Détermine la classe CSS à appliquer en fonction de la température
   * @param {number} temp Température en °C
   * @returns {string} Nom de la classe CSS
   */
  function getTemperatureClassName(temp) {
    if (temp < -5) return 'temp-very-cold';
    if (temp < 5) return 'temp-cold';
    if (temp < 15) return 'temp-cool';
    if (temp < 25) return 'temp-warm';
    if (temp < 30) return 'temp-hot';
    return 'temp-very-hot';
  }
  
  /**
   * Détermine la classe CSS à appliquer en fonction des précipitations
   * @param {number} precip Précipitations en mm
   * @returns {string} Nom de la classe CSS
   */
  function getPrecipitationClassName(precip) {
    if (precip === 0) return 'precip-none';
    if (precip < 2) return 'precip-very-light';
    if (precip < 5) return 'precip-light';
    if (precip < 10) return 'precip-moderate';
    if (precip < 20) return 'precip-heavy';
    return 'precip-very-heavy';
  }
  
  /**
   * Détermine la classe CSS à appliquer en fonction du vent
   * @param {number} wind Vitesse du vent en km/h
   * @returns {string} Nom de la classe CSS
   */
  function getWindClassName(wind) {
    if (wind < 5) return 'wind-calm';
    if (wind < 15) return 'wind-light';
    if (wind < 30) return 'wind-moderate';
    if (wind < 50) return 'wind-strong';
    return 'wind-very-strong';
  }
  
  /**
   * Détermine la classe CSS à appliquer en fonction de la nébulosité
   * @param {number} clouds Couverture nuageuse en %
   * @returns {string} Nom de la classe CSS
   */
  function getCloudsClassName(clouds) {
    if (clouds < 10) return 'clouds-clear';
    if (clouds < 30) return 'clouds-few';
    if (clouds < 60) return 'clouds-scattered';
    if (clouds < 90) return 'clouds-broken';
    return 'clouds-overcast';
  }
  
  /**
   * Calcule quelles régions doivent être chargées en fonction des limites de la carte
   * @param {Object} bounds Limites de la carte (LngLatBounds)
   * @param {number} zoom Niveau de zoom actuel
   * @returns {Array} Liste des régions à charger
   */
  calculateRegionsToLoad = function(bounds, zoom) {
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
    
    // Parcourir la grille dans les limites de la carte
    for (let lat = Math.floor(bounds.south / gridSize) * gridSize; lat <= Math.ceil(bounds.north / gridSize) * gridSize; lat += gridSize) {
      for (let lng = Math.floor(bounds.west / gridSize) * gridSize; lng <= Math.ceil(bounds.east / gridSize) * gridSize; lng += gridSize) {
        regions.push({
          lat: parseFloat(lat.toFixed(1)),
          lng: parseFloat(lng.toFixed(1)),
          size: gridSize
        });
      }
    }
    
    return regions;
  };
  
  /**
   * Charge les données météo pour une région donnée
   * @param {Object} region Région à charger
   */
  loadWeatherDataForRegion = function(region) {
    const regionKey = region.lat + '_' + region.lng + '_' + region.size;
    
    // Vérifier si les données sont déjà en cours de chargement
    if (state.loadingRegions[regionKey]) return;
    
    // Vérifier si les données sont déjà en cache et toujours valides
    if (config.enableCaching && state.weatherData[regionKey]) {
      const cacheAge = (new Date() - state.weatherData[regionKey].timestamp) / 1000 / 60;
      if (cacheAge < config.cacheTTL) {
        // Données en cache toujours valides
        return;
      }
    }
    
    // Marquer la région comme étant en cours de chargement
    state.loadingRegions[regionKey] = true;
    
    // Simuler le chargement des données (dans un projet réel, ce serait un appel API)
    setTimeout(function() {
      // Simuler des données météo aléatoires pour cette région
      const locations = [];
      
      // Nombre de points météo en fonction de la taille de la grille
      const numPoints = Math.max(1, Math.round(10 / region.size));
      
      for (let i = 0; i < numPoints; i++) {
        const locationLat = region.lat + (Math.random() - 0.5) * region.size;
        const locationLng = region.lng + (Math.random() - 0.5) * region.size;
        
        locations.push({
          lat: parseFloat(locationLat.toFixed(3)),
          lng: parseFloat(locationLng.toFixed(3)),
          temp: parseFloat((Math.random() * 30 - 5).toFixed(1)),
          precip: parseFloat((Math.random() * 20).toFixed(1)),
          wind: parseFloat((Math.random() * 50).toFixed(1)),
          clouds: parseFloat((Math.random() * 100).toFixed(0))
        });
      }
      
      // Stocker les données en cache
      state.weatherData[regionKey] = {
        timestamp: new Date(),
        locations: locations
      };
      
      // Marquer la région comme n'étant plus en cours de chargement
      delete state.loadingRegions[regionKey];
      
      // Mettre à jour la couche météo si elle est visible
      if (state.weatherLayerVisible) {
        updateWeatherLayer();
      }
    }, 500);
  };
  
  /**
   * Ajoute les écouteurs d'événements nécessaires
   */
  addEventListeners = function() {
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
  };
  
  /**
   * Charge les données météo initiales pour l'Europe
   */
  loadInitialWeatherData = function() {
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
  };
  
  /**
   * Rafraîchit les données météo
   */
  refreshWeatherData = function() {
    // Effacer les données en cache
    state.weatherData = {};
    
    // Recharger les données pour les régions visibles
    if (state.weatherLayerVisible && mapInstance) {
      const bounds = mapInstance.getBounds();
      const zoom = mapInstance.getZoom();
      
      const regions = calculateRegionsToLoad(bounds, zoom);
      regions.forEach(loadWeatherDataForRegion);
    }
    
    // Mettre à jour la dernière mise à jour
    state.lastUpdate = new Date();
  };
  
  // API publique
  return {
    init: init,
    toggle: toggleWeatherLayer,
    refresh: refreshWeatherData,
    setLanguage: function(lang) {
      config.language = lang;
      updateUI();
    },
    getWeatherData: function() {
      return state.weatherData;
    }
  };
})();
