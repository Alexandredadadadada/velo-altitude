/**
 * map.js - Module de gestion des cartes et itinéraires pour Grand Est Cyclisme
 * Utilise l'API Mapbox pour l'affichage des cartes et OpenRouteService pour les itinéraires
 */

// Configuration de l'API Mapbox (la clé est injectée par le serveur)
let mapboxToken = '';
let mapInstance = null;
let currentRouteLayer = null;

// Points de repère des cols cyclistes dans le Grand Est
const cyclingPoints = {
  grandBallon: [7.0997, 47.9017],
  colDonon: [7.1510, 48.5103],
  colSchlucht: [7.0057, 48.0559],
  colGrossePierre: [6.9583, 48.0372],
  plancheBellesFilles: [6.7662, 47.7644]
};

/**
 * Initialise la carte Mapbox dans le conteneur spécifié
 * @param {string} containerId ID du conteneur HTML
 * @param {string} token Token d'accès Mapbox
 * @param {Array} startCoords Coordonnées de départ [longitude, latitude]
 */
function initMap(containerId, token, startCoords = [6.8770, 48.1000]) {
  // Enregistrer le token pour les utilisations futures
  mapboxToken = token;
  
  // Charger la bibliothèque Mapbox
  mapboxgl.accessToken = token;
  
  // Créer l'instance de carte
  mapInstance = new mapboxgl.Map({
    container: containerId,
    style: 'mapbox://styles/mapbox/outdoors-v12', // Style adapté au cyclisme
    center: startCoords, // Centrer sur le Grand Est (Vosges)
    zoom: 9,
    pitch: 40, // Inclinaison pour une meilleure visualisation du relief
    bearing: 0
  });
  
  // Ajouter les contrôles de navigation
  mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
  mapInstance.addControl(new mapboxgl.ScaleControl(), 'bottom-left');
  mapInstance.addControl(new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    trackUserLocation: true
  }), 'top-right');
  
  // Ajouter le contrôle de style (satellite, terrain, etc.)
  mapInstance.addControl(new mapboxgl.StyleSwitcherControl({
    styles: [
      { title: 'Outdoor', uri: 'mapbox://styles/mapbox/outdoors-v12' },
      { title: 'Satellite', uri: 'mapbox://styles/mapbox/satellite-streets-v12' },
      { title: 'Light', uri: 'mapbox://styles/mapbox/light-v11' }
    ]
  }), 'top-right');
  
  // Attendre que la carte soit chargée
  mapInstance.on('load', () => {
    // Ajouter les marqueurs pour les cols cyclistes
    addCyclingMarkers();
    
    // Configurer l'interaction 3D pour le relief
    setupTerrainControls();
    
    // Événement personnalisé pour indiquer que la carte est prête
    document.dispatchEvent(new CustomEvent('mapReady'));
  });
  
  // Ajouter une fonction pour les tests fonctionnels
  window.mapInstance = mapInstance;
  
  return mapInstance;
}

/**
 * Ajoute des marqueurs pour les cols cyclistes importants
 */
function addCyclingMarkers() {
  // Créer des marqueurs personnalisés pour chaque col
  Object.entries(cyclingPoints).forEach(([name, coords]) => {
    // Créer un élément HTML pour le marqueur personnalisé
    const el = document.createElement('div');
    el.className = 'cycling-marker';
    el.style.backgroundImage = `url(/images/summits/${name}.jpg)`;
    el.style.width = '30px';
    el.style.height = '30px';
    el.style.backgroundSize = 'cover';
    el.style.borderRadius = '50%';
    el.style.border = '2px solid #1F497D';
    el.style.cursor = 'pointer';
    
    // Formatter le nom du col pour l'affichage
    const displayName = name
      .replace(/([A-Z])/g, ' $1') // Ajouter des espaces avant les majuscules
      .replace(/^./, str => str.toUpperCase()) // Première lettre en majuscule
      .replace(/([a-z])([A-Z])/g, '$1 $2'); // Ajouter des espaces entre les camelCase
    
    // Créer et ajouter le marqueur
    const marker = new mapboxgl.Marker(el)
      .setLngLat(coords)
      .setPopup(new mapboxgl.Popup({ offset: 25 })
        .setHTML(`<h3>${displayName}</h3><p>Altitude: ??? m</p>`))
      .addTo(mapInstance);
    
    // Récupérer l'altitude via l'API d'élévation
    getElevation(coords).then(elevation => {
      if (elevation && elevation.data && elevation.data.geometry && elevation.data.geometry.coordinates) {
        const altitude = Math.round(elevation.data.geometry.coordinates[0][2]);
        
        // Mettre à jour le popup avec l'altitude
        marker.setPopup(new mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <h3>${displayName}</h3>
            <p>Altitude: ${altitude} m</p>
            <button class="btn btn-sm btn-primary show-col-detail" data-col="${name}">Détails</button>
          `));
        
        // Ajouter un événement pour afficher les détails du col
        marker.getElement().addEventListener('click', () => {
          setTimeout(() => {
            const detailButton = document.querySelector(`.show-col-detail[data-col="${name}"]`);
            if (detailButton) {
              detailButton.addEventListener('click', () => showColDetails(name, coords, altitude));
            }
          }, 100);
        });
      }
    });
  });
}

/**
 * Affiche les détails d'un col
 * @param {string} colName Nom du col
 * @param {Array} coords Coordonnées du col
 * @param {number} altitude Altitude du col
 */
function showColDetails(colName, coords, altitude) {
  // Récupérer les données météo pour le col
  if (window.weatherModule) {
    window.weatherModule.fetchCurrentWeather(coords[1], coords[0])
      .then(weatherData => {
        // Afficher une modal avec les détails du col
        createColModal(colName, coords, altitude, weatherData);
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des données météo pour le col:', error);
        createColModal(colName, coords, altitude);
      });
  } else {
    createColModal(colName, coords, altitude);
  }
}

/**
 * Crée une modal avec les détails d'un col
 * @param {string} colName Nom du col
 * @param {Array} coords Coordonnées du col
 * @param {number} altitude Altitude du col
 * @param {object} weatherData Données météo (facultatif)
 */
function createColModal(colName, coords, altitude, weatherData = null) {
  // Formatter le nom du col pour l'affichage
  const displayName = colName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/([a-z])([A-Z])/g, '$1 $2');
  
  // Créer l'élément modal
  const modal = document.createElement('div');
  modal.className = 'col-detail-modal';
  
  // Définir le contenu HTML
  let weatherHTML = '';
  if (weatherData) {
    const temp = Math.round(weatherData.main.temp);
    const description = weatherData.weather[0].description;
    const windSpeed = Math.round(weatherData.wind.speed * 3.6); // Conversion en km/h
    const windDirection = getWindDirection(weatherData.wind.deg);
    
    weatherHTML = `
      <div class="col-weather">
        <h4>Conditions actuelles</h4>
        <div class="weather-details">
          <div class="weather-icon">
            <img src="https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png" alt="${description}">
          </div>
          <div class="weather-data">
            <div class="temp">${temp}°C</div>
            <div class="description">${description}</div>
            <div class="wind">Vent: ${windSpeed} km/h ${windDirection}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  // Récupérer les segments Strava si disponibles
  let stravaHTML = '';
  if (window.stravaIntegration && window.stravaIntegration.fetchSegmentsNearby) {
    stravaHTML = `
      <div class="col-strava">
        <h4>Segments Strava</h4>
        <div id="col-strava-segments">
          <p>Chargement des segments...</p>
        </div>
      </div>
    `;
  }
  
  // Calculer l'URL Google Maps pour la navigation
  const googleMapsURL = `https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}&travelmode=driving`;
  
  modal.innerHTML = `
    <div class="col-detail-content">
      <div class="col-detail-header">
        <h3>${displayName}</h3>
        <button class="close-modal">&times;</button>
      </div>
      <div class="col-detail-body">
        <div class="col-image">
          <img src="/images/summits/${colName}.jpg" alt="${displayName}" onerror="this.src='/images/default-col.jpg'">
        </div>
        <div class="col-info">
          <p><strong>Altitude:</strong> ${altitude} m</p>
          <p><strong>Coordonnées:</strong> ${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}</p>
          <div class="col-actions">
            <a href="${googleMapsURL}" target="_blank" class="btn btn-sm btn-outline-primary">
              <i class="fas fa-directions"></i> S'y rendre
            </a>
            <button class="btn btn-sm btn-outline-primary show-elevation-profile" data-col="${colName}">
              <i class="fas fa-mountain"></i> Profil d'élévation
            </button>
          </div>
        </div>
        ${weatherHTML}
        ${stravaHTML}
      </div>
    </div>
  `;
  
  // Ajouter la modal au document
  document.body.appendChild(modal);
  
  // Configurer le bouton de fermeture
  const closeButton = modal.querySelector('.close-modal');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }
  
  // Configurer le bouton de profil d'élévation
  const elevationButton = modal.querySelector('.show-elevation-profile');
  if (elevationButton) {
    elevationButton.addEventListener('click', () => {
      showElevationProfile(colName, coords);
    });
  }
  
  // Charger les segments Strava si disponibles
  if (window.stravaIntegration && window.stravaIntegration.fetchSegmentsNearby) {
    window.stravaIntegration.fetchSegmentsNearby(coords[1], coords[0], 1000)
      .then(segments => {
        const segmentsContainer = modal.querySelector('#col-strava-segments');
        if (segmentsContainer && segments && segments.length > 0) {
          segmentsContainer.innerHTML = '';
          
          // Créer une liste des segments
          const segmentsList = document.createElement('ul');
          segmentsList.className = 'segments-list';
          
          segments.slice(0, 5).forEach(segment => {
            const segmentItem = document.createElement('li');
            segmentItem.className = 'segment-item';
            segmentItem.innerHTML = `
              <div class="segment-name">${segment.name}</div>
              <div class="segment-stats">
                <span><i class="fas fa-ruler-horizontal"></i> ${(segment.distance / 1000).toFixed(1)} km</span>
                <span><i class="fas fa-mountain"></i> ${Math.round(segment.total_elevation_gain)} m</span>
                <span><i class="fas fa-trophy"></i> KOM: ${formatDuration(segment.xoms.kom)}</span>
              </div>
            `;
            segmentsList.appendChild(segmentItem);
          });
          
          segmentsContainer.appendChild(segmentsList);
        } else if (segmentsContainer) {
          segmentsContainer.innerHTML = '<p>Aucun segment trouvé à proximité.</p>';
        }
      })
      .catch(error => {
        console.error('Erreur lors du chargement des segments Strava:', error);
        const segmentsContainer = modal.querySelector('#col-strava-segments');
        if (segmentsContainer) {
          segmentsContainer.innerHTML = '<p>Impossible de charger les segments Strava.</p>';
        }
      });
  }
}

/**
 * Affiche le profil d'élévation pour un col
 * @param {string} colName Nom du col
 * @param {Array} coords Coordonnées du col
 */
function showElevationProfile(colName, coords) {
  // Créer un modal pour le profil d'élévation
  const modal = document.createElement('div');
  modal.className = 'elevation-profile-modal';
  
  // Définir le contenu HTML
  modal.innerHTML = `
    <div class="elevation-profile-content">
      <div class="elevation-profile-header">
        <h3>Profil d'élévation - ${colName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
        <button class="close-modal">&times;</button>
      </div>
      <div class="elevation-profile-body">
        <div class="elevation-options">
          <select id="elevation-route-select">
            <option value="north">Versant Nord</option>
            <option value="south">Versant Sud</option>
            <option value="east">Versant Est</option>
            <option value="west">Versant Ouest</option>
          </select>
          <div class="elevation-stats" id="elevation-stats"></div>
        </div>
        <div id="elevation-chart" style="width: 100%; height: 300px;"></div>
      </div>
    </div>
  `;
  
  // Ajouter la modal au document
  document.body.appendChild(modal);
  
  // Configurer le bouton de fermeture
  const closeButton = modal.querySelector('.close-modal');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  }
  
  // Récupérer et afficher le profil d'élévation pour le versant sélectionné
  const routeSelect = modal.querySelector('#elevation-route-select');
  if (routeSelect) {
    // Fonction pour charger le profil d'élévation
    const loadElevationProfile = (direction) => {
      const statsContainer = modal.querySelector('#elevation-stats');
      const chartContainer = modal.querySelector('#elevation-chart');
      
      if (statsContainer) {
        statsContainer.innerHTML = '<div class="loading-spinner"></div>';
      }
      
      // Ici, on simulerait l'appel API pour récupérer le profil d'élévation
      // Pour la démo, générons des données fictives
      setTimeout(() => {
        // Données fictives de profil d'élévation
        const distance = 8 + Math.random() * 4; // Entre 8 et 12 km
        const elevationGain = 500 + Math.random() * 300; // Entre 500 et 800 m
        const avgGradient = 6 + Math.random() * 3; // Entre 6% et 9%
        const maxGradient = avgGradient + 3 + Math.random() * 4; // Entre 3% et 7% de plus que la moyenne
        
        // Mettre à jour les statistiques
        if (statsContainer) {
          statsContainer.innerHTML = `
            <div class="stat-item">
              <div class="stat-value">${distance.toFixed(1)} km</div>
              <div class="stat-label">Distance</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${Math.round(elevationGain)} m</div>
              <div class="stat-label">Dénivelé</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${avgGradient.toFixed(1)}%</div>
              <div class="stat-label">Pente moyenne</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${maxGradient.toFixed(1)}%</div>
              <div class="stat-label">Pente max</div>
            </div>
          `;
        }
        
        // Générer des données pour le graphique
        const points = Math.ceil(distance * 10); // Un point tous les 100m
        const elevationData = [];
        let currentElevation = altitude - elevationGain;
        
        for (let i = 0; i <= points; i++) {
          const distancePoint = (i / points) * distance;
          // Simuler une montée avec quelques variations
          const progress = i / points;
          const randomFactor = Math.sin(progress * Math.PI * 3) * 20; // Variations aléatoires
          const elevationPoint = currentElevation + (progress * elevationGain) + randomFactor;
          
          elevationData.push({
            distance: distancePoint,
            elevation: elevationPoint
          });
        }
        
        // Dessiner le graphique avec d3.js (on suppose que c'est déjà chargé)
        if (chartContainer && window.d3) {
          drawElevationChart(chartContainer, elevationData);
        } else if (chartContainer) {
          chartContainer.innerHTML = `
            <div class="elevation-chart-placeholder">
              <div style="width: 100%; height: 100%; background: linear-gradient(to top right, #ddd, #fff); position: relative;">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0,100 L10,80 L20,85 L30,70 L40,75 L50,60 L60,50 L70,40 L80,30 L90,25 L100,10" stroke="#1F497D" stroke-width="3" fill="none"></path>
                </svg>
                <div style="position: absolute; bottom: 10px; left: 10px;">0 km</div>
                <div style="position: absolute; bottom: 10px; right: 10px;">${distance.toFixed(1)} km</div>
                <div style="position: absolute; top: 10px; left: 10px;">${Math.round(altitude)} m</div>
                <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%);">Distance (km)</div>
                <div style="position: absolute; top: 50%; left: 10px; transform: translateY(-50%); writing-mode: vertical-rl; text-orientation: mixed;">Altitude (m)</div>
              </div>
            </div>
          `;
        }
      }, 1000);
    };
    
    // Charger le profil initial
    loadElevationProfile(routeSelect.value);
    
    // Configurer l'événement de changement
    routeSelect.addEventListener('change', () => {
      loadElevationProfile(routeSelect.value);
    });
  }
}

/**
 * Obtient la direction du vent en texte
 * @param {number} degrees Direction du vent en degrés
 * @returns {string} Direction du vent en texte
 */
function getWindDirection(degrees) {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

/**
 * Formate une durée en secondes en format lisible
 * @param {number} seconds Durée en secondes
 * @returns {string} Durée formatée (ex: "2h 30m")
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Dessine un graphique de profil d'élévation
 * @param {HTMLElement} container Conteneur pour le graphique
 * @param {Array} data Données d'élévation
 */
function drawElevationChart(container, data) {
  // Nettoyer le conteneur
  container.innerHTML = '';
  
  // Dimensions et marges
  const margin = { top: 20, right: 30, bottom: 30, left: 40 };
  const width = container.clientWidth - margin.left - margin.right;
  const height = container.clientHeight - margin.top - margin.bottom;
  
  // Créer le SVG
  const svg = d3.select(container).append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Échelles X et Y
  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.distance)])
    .range([0, width]);
  
  const y = d3.scaleLinear()
    .domain([d3.min(data, d => d.elevation) * 0.9, d3.max(data, d => d.elevation) * 1.1])
    .range([height, 0]);
  
  // Ligne
  const line = d3.line()
    .x(d => x(d.distance))
    .y(d => y(d.elevation))
    .curve(d3.curveMonotoneX);
  
  // Axes
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d} km`));
  
  svg.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${Math.round(d)} m`));
  
  // Dessiner la ligne
  svg.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#1F497D')
    .attr('stroke-width', 3)
    .attr('d', line);
  
  // Remplissage sous la ligne
  svg.append('path')
    .datum(data)
    .attr('fill', 'rgba(31, 73, 125, 0.2)')
    .attr('d', d3.area()
      .x(d => x(d.distance))
      .y0(height)
      .y1(d => y(d.elevation))
      .curve(d3.curveMonotoneX)
    );
  
  // Points de pente maximale
  const maxGradientPoints = findMaxGradientPoints(data);
  
  svg.selectAll('.max-gradient-point')
    .data(maxGradientPoints)
    .enter().append('circle')
    .attr('class', 'max-gradient-point')
    .attr('cx', d => x(d.distance))
    .attr('cy', d => y(d.elevation))
    .attr('r', 4)
    .attr('fill', '#E63946');
    
  // Ajouter des tooltips pour les points de pente maximale
  maxGradientPoints.forEach(point => {
    svg.append('g')
      .attr('class', 'max-gradient-label')
      .attr('transform', `translate(${x(point.distance)},${y(point.elevation) - 15})`)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text(`${point.gradient.toFixed(1)}%`);
  });
}

/**
 * Trouve les points de pente maximale dans les données d'élévation
 * @param {Array} data Données d'élévation
 * @returns {Array} Points de pente maximale
 */
function findMaxGradientPoints(data) {
  const gradients = [];
  
  // Calculer les gradients entre les points
  for (let i = 1; i < data.length; i++) {
    const distanceDiff = (data[i].distance - data[i-1].distance) * 1000; // Conversion en mètres
    const elevationDiff = data[i].elevation - data[i-1].elevation;
    const gradient = (elevationDiff / distanceDiff) * 100; // En pourcentage
    
    gradients.push({
      index: i,
      gradient: gradient,
      distance: data[i].distance,
      elevation: data[i].elevation
    });
  }
  
  // Trier par gradient descendant
  gradients.sort((a, b) => b.gradient - a.gradient);
  
  // Retourner les 3 points de pente maximale
  return gradients.slice(0, 3);
}

/**
 * Configure le contrôle de terrain 3D
 */
function setupTerrainControls() {
  // Ajouter la source de terrain 3D si elle n'existe pas déjà
  if (!mapInstance.getSource('mapbox-dem')) {
    mapInstance.addSource('mapbox-dem', {
      'type': 'raster-dem',
      'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
      'tileSize': 512,
      'maxzoom': 14
    });
    
    // Ajouter la couche de terrain
    mapInstance.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
    
    // Ajouter l'effet d'ombrage du relief
    mapInstance.addLayer({
      'id': 'sky',
      'type': 'sky',
      'paint': {
        'sky-type': 'atmosphere',
        'sky-atmosphere-sun': [0.0, 0.0],
        'sky-atmosphere-sun-intensity': 15
      }
    });
  }
}

/**
 * Calcule et affiche un itinéraire cyclable entre deux points
 * @param {Array} start Coordonnées du point de départ [longitude, latitude]
 * @param {Array} end Coordonnées du point d'arrivée [longitude, latitude]
 * @param {Array} waypoints Points intermédiaires facultatifs
 * @returns {Promise} Promesse résolue avec les données de l'itinéraire
 */
function calculateRoute(start, end, waypoints = []) {
  // Construire les données de la requête
  const requestData = {
    start,
    end,
    waypoints
  };
  
  // Appeler l'API de calcul d'itinéraire
  return fetch('/api/routes/calculate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Erreur lors du calcul de l\'itinéraire');
    }
    return response.json();
  })
  .then(data => {
    if (data.success && data.data) {
      // Afficher l'itinéraire sur la carte
      displayRoute(data.data);
      return data.data;
    } else {
      throw new Error('Données d\'itinéraire invalides');
    }
  });
}

/**
 * Affiche un itinéraire sur la carte
 * @param {object} routeData Données GeoJSON de l'itinéraire
 */
function displayRoute(routeData) {
  // Supprimer l'itinéraire existant s'il y en a un
  if (currentRouteLayer && mapInstance.getLayer('route')) {
    mapInstance.removeLayer('route');
    mapInstance.removeSource('route');
  }
  
  // Ajouter la nouvelle source de données pour l'itinéraire
  mapInstance.addSource('route', {
    type: 'geojson',
    data: routeData
  });
  
  // Ajouter la couche d'itinéraire
  mapInstance.addLayer({
    id: 'route',
    type: 'line',
    source: 'route',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#FF6B35',
      'line-width': 5,
      'line-opacity': 0.8
    }
  });
  
  // Enregistrer la référence à la couche d'itinéraire
  currentRouteLayer = 'route';
  
  // Ajuster la vue pour montrer l'itinéraire complet
  if (routeData.features && routeData.features.length > 0) {
    const coordinates = routeData.features[0].geometry.coordinates;
    
    // Créer une boîte englobante pour l'itinéraire
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
    
    // Ajuster la vue à la boîte englobante
    mapInstance.fitBounds(bounds, {
      padding: 40,
      bearing: 0,
      maxZoom: 14
    });
  }
  
  // Afficher des informations sur l'itinéraire si disponibles
  if (routeData.features && routeData.features[0].properties) {
    const properties = routeData.features[0].properties;
    const distance = (properties.summary.distance / 1000).toFixed(2); // En km
    const duration = Math.round(properties.summary.duration / 60); // En minutes
    const ascent = properties.summary.ascent || 0;
    const descent = properties.summary.descent || 0;
    
    // Construire le HTML pour les informations d'itinéraire
    const routeInfoHTML = `
      <div class="route-info">
        <h3>Détails de l'itinéraire</h3>
        <ul>
          <li><strong>Distance:</strong> ${distance} km</li>
          <li><strong>Durée estimée:</strong> ${duration} min</li>
          <li><strong>Dénivelé positif:</strong> ${Math.round(ascent)} m</li>
          <li><strong>Dénivelé négatif:</strong> ${Math.round(descent)} m</li>
        </ul>
      </div>
    `;
    
    // Mettre à jour le conteneur d'informations d'itinéraire s'il existe
    const routeInfoContainer = document.getElementById('route-info');
    if (routeInfoContainer) {
      routeInfoContainer.innerHTML = routeInfoHTML;
    }
  }
}

/**
 * Récupère l'altitude pour une coordonnée spécifique
 * @param {Array} coordinates Coordonnées [longitude, latitude]
 * @returns {Promise} Promesse résolue avec les données d'élévation
 */
function getElevation(coordinates) {
  return fetch('/api/routes/elevation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      points: [coordinates]
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de l\'élévation');
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      return data;
    } else {
      throw new Error('Données d\'élévation invalides');
    }
  });
}

/**
 * Calcule et affiche une zone accessible (isochrone) depuis un point
 * @param {Array} center Coordonnées du point central [longitude, latitude]
 * @param {number} time Temps en minutes
 * @param {string} rangeType Type de portée ('time' ou 'distance')
 * @returns {Promise} Promesse résolue avec les données de l'isochrone
 */
function calculateIsochrone(center, time, rangeType = 'time') {
  // Construire les données de la requête
  const requestData = {
    center,
    range: time,
    rangeType
  };
  
  // Appeler l'API de calcul d'isochrone
  return fetch('/api/routes/isochrone', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Erreur lors du calcul de la zone accessible');
    }
    return response.json();
  })
  .then(data => {
    if (data.success && data.data) {
      // Afficher l'isochrone sur la carte
      displayIsochrone(data.data, time);
      return data.data;
    } else {
      throw new Error('Données d\'isochrone invalides');
    }
  });
}

/**
 * Affiche une zone accessible (isochrone) sur la carte
 * @param {object} isochroneData Données GeoJSON de l'isochrone
 * @param {number} time Temps en minutes utilisé pour le calcul
 */
function displayIsochrone(isochroneData, time) {
  // Supprimer l'isochrone existant s'il y en a un
  if (mapInstance.getLayer('isochrone')) {
    mapInstance.removeLayer('isochrone');
    mapInstance.removeSource('isochrone');
  }
  
  // Ajouter la nouvelle source de données pour l'isochrone
  mapInstance.addSource('isochrone', {
    type: 'geojson',
    data: isochroneData
  });
  
  // Ajouter la couche d'isochrone
  mapInstance.addLayer({
    id: 'isochrone',
    type: 'fill',
    source: 'isochrone',
    layout: {},
    paint: {
      'fill-color': '#3A6EA5',
      'fill-opacity': 0.3,
      'fill-outline-color': '#1F497D'
    }
  });
  
  // Ajuster la vue pour montrer l'isochrone complet
  if (isochroneData.features && isochroneData.features.length > 0) {
    const coordinates = isochroneData.features[0].geometry.coordinates[0];
    
    // Créer une boîte englobante pour l'isochrone
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
    
    // Ajuster la vue à la boîte englobante
    mapInstance.fitBounds(bounds, {
      padding: 40
    });
    
    // Ajouter un popup avec des informations
    const center = isochroneData.features[0].properties.center;
    
    new mapboxgl.Popup()
      .setLngLat(center)
      .setHTML(`<h3>Zone accessible</h3><p>À ${time} minutes de vélo</p>`)
      .addTo(mapInstance);
  }
}

// Exporter les fonctions pour une utilisation externe
window.cyclingMap = {
  initMap,
  calculateRoute,
  displayRoute,
  calculateIsochrone,
  cyclingPoints
};
