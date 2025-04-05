/**
 * strava.js - Module de gestion de l'intégration Strava pour Grand Est Cyclisme
 * Permet de se connecter à Strava, récupérer et afficher les activités cyclistes
 */

// État de l'authentification
let isAuthenticated = false;
let athlete = null;

/**
 * Initialise l'intégration Strava
 * @param {string} authButtonId ID du bouton de connexion Strava
 * @param {string} activitiesContainerId ID du conteneur pour les activités
 * @param {string} statsContainerId ID du conteneur pour les statistiques
 */
function initStrava(authButtonId, activitiesContainerId, statsContainerId) {
  // Récupérer l'état d'authentification depuis le serveur
  checkAuthStatus()
    .then(status => {
      isAuthenticated = status.isAuthenticated;
      athlete = status.athlete;
      
      // Mettre à jour l'interface en fonction de l'état d'authentification
      updateAuthUI(authButtonId);
      
      // Si l'utilisateur est authentifié, récupérer ses activités et statistiques
      if (isAuthenticated) {
        fetchActivities(activitiesContainerId);
        fetchAthleteStats(statsContainerId);
      }
    })
    .catch(error => {
      console.error('Erreur lors de l\'initialisation Strava:', error);
    });
  
  // Configurer l'événement de clic sur le bouton d'authentification
  const authButton = document.getElementById(authButtonId);
  if (authButton) {
    authButton.addEventListener('click', () => {
      if (!isAuthenticated) {
        // Redirection vers la page d'authentification Strava
        window.location.href = '/api/strava/auth';
      } else {
        // Déconnexion de Strava
        logout()
          .then(() => {
            isAuthenticated = false;
            athlete = null;
            updateAuthUI(authButtonId);
            clearContainer(activitiesContainerId);
            clearContainer(statsContainerId);
          })
          .catch(error => {
            console.error('Erreur lors de la déconnexion:', error);
          });
      }
    });
  }
}

/**
 * Vérifie l'état d'authentification Strava
 * @returns {Promise} Promesse résolue avec l'état d'authentification
 */
function checkAuthStatus() {
  return fetch('/api/strava/status')
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur lors de la vérification de l\'état d\'authentification');
      }
      return response.json();
    })
    .then(data => {
      return {
        isAuthenticated: data.isAuthenticated,
        athlete: data.athlete
      };
    });
}

/**
 * Met à jour l'interface utilisateur en fonction de l'état d'authentification
 * @param {string} authButtonId ID du bouton d'authentification
 */
function updateAuthUI(authButtonId) {
  const authButton = document.getElementById(authButtonId);
  if (!authButton) return;
  
  if (isAuthenticated && athlete) {
    // Utilisateur connecté
    authButton.textContent = 'Déconnexion Strava';
    authButton.classList.remove('strava-connect');
    authButton.classList.add('strava-disconnect');
    
    // Afficher les informations de l'athlète
    const athleteInfoContainer = document.getElementById('athlete-info');
    if (athleteInfoContainer) {
      athleteInfoContainer.innerHTML = `
        <div class="athlete-profile">
          <img src="${athlete.profile}" alt="${athlete.firstname} ${athlete.lastname}" class="athlete-avatar">
          <div class="athlete-details">
            <h3>${athlete.firstname} ${athlete.lastname}</h3>
            <p>${athlete.city}, ${athlete.country}</p>
          </div>
        </div>
      `;
    }
  } else {
    // Utilisateur non connecté
    authButton.textContent = 'Se connecter avec Strava';
    authButton.classList.remove('strava-disconnect');
    authButton.classList.add('strava-connect');
    
    // Effacer les informations de l'athlète
    const athleteInfoContainer = document.getElementById('athlete-info');
    if (athleteInfoContainer) {
      athleteInfoContainer.innerHTML = `
        <div class="strava-promo">
          <h3>Connectez-vous à Strava</h3>
          <p>Synchronisez vos activités cyclistes et analysez vos performances</p>
        </div>
      `;
    }
  }
}

/**
 * Récupère les activités cyclistes de l'utilisateur
 * @param {string} containerId ID du conteneur pour afficher les activités
 * @param {number} page Numéro de page (pour pagination)
 * @param {number} perPage Nombre d'activités par page
 * @returns {Promise} Promesse résolue avec les données d'activités
 */
function fetchActivities(containerId, page = 1, perPage = 10) {
  return fetch(`/api/strava/activities?page=${page}&per_page=${perPage}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des activités');
      }
      return response.json();
    })
    .then(data => {
      if (data.success && data.data) {
        // Afficher les activités dans le conteneur
        displayActivities(containerId, data.data);
        return data.data;
      } else {
        throw new Error('Données d\'activités invalides');
      }
    });
}

/**
 * Affiche les activités cyclistes dans le conteneur spécifié
 * @param {string} containerId ID du conteneur
 * @param {Array} activities Liste des activités
 */
function displayActivities(containerId, activities) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Effacer le contenu existant
  container.innerHTML = '';
  
  // Créer l'en-tête de la section
  const header = document.createElement('h2');
  header.textContent = 'Vos activités récentes';
  container.appendChild(header);
  
  // Si aucune activité, afficher un message
  if (!activities || activities.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.className = 'empty-activities';
    emptyMessage.textContent = 'Aucune activité récente trouvée';
    container.appendChild(emptyMessage);
    return;
  }
  
  // Créer une liste pour les activités
  const activityList = document.createElement('ul');
  activityList.className = 'activity-list';
  
  // Parcourir les activités et les afficher
  activities.forEach(activity => {
    const activityItem = document.createElement('li');
    activityItem.className = 'activity-item';
    
    // Convertir les valeurs numériques
    const distance = (activity.distance / 1000).toFixed(2); // En km
    const elevation = Math.round(activity.total_elevation_gain); // En mètres
    const movingTime = formatDuration(activity.moving_time); // Formatage du temps
    
    // Convertir la date
    const date = new Date(activity.start_date);
    const formattedDate = date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Définir une couleur en fonction du type d'activité
    let activityColor = '#1F497D'; // Couleur par défaut
    if (activity.type === 'Ride') activityColor = '#FF6B35';
    else if (activity.type === 'Run') activityColor = '#4CAF50';
    else if (activity.type === 'Swim') activityColor = '#3A6EA5';
    
    // Créer le HTML pour l'activité
    activityItem.innerHTML = `
      <div class="activity-header" style="border-left: 4px solid ${activityColor}">
        <h3>${activity.name}</h3>
        <span class="activity-date">${formattedDate}</span>
      </div>
      <div class="activity-body">
        <div class="activity-stats">
          <div class="stat">
            <i class="fas fa-route"></i>
            <span>${distance} km</span>
          </div>
          <div class="stat">
            <i class="fas fa-mountain"></i>
            <span>${elevation} m</span>
          </div>
          <div class="stat">
            <i class="fas fa-stopwatch"></i>
            <span>${movingTime}</span>
          </div>
        </div>
        <div class="activity-details">
          <button class="view-activity" data-id="${activity.id}">
            Voir les détails
          </button>
        </div>
      </div>
    `;
    
    // Ajouter l'élément à la liste
    activityList.appendChild(activityItem);
    
    // Ajouter un gestionnaire d'événement pour le bouton de détails
    const viewButton = activityItem.querySelector('.view-activity');
    viewButton.addEventListener('click', () => {
      fetchActivityDetails(activity.id)
        .then(details => {
          displayActivityDetails(details);
          
          // Si l'activité a des coordonnées de départ/fin, afficher sur la carte
          if (details.start_latlng && details.end_latlng && window.cyclingMap) {
            const start = [details.start_latlng[1], details.start_latlng[0]];
            const end = [details.end_latlng[1], details.end_latlng[0]];
            window.cyclingMap.calculateRoute(start, end);
          }
        })
        .catch(error => {
          console.error('Erreur lors de la récupération des détails:', error);
        });
    });
  });
  
  // Ajouter la liste au conteneur
  container.appendChild(activityList);
  
  // Ajouter un bouton pour charger plus d'activités
  const loadMoreButton = document.createElement('button');
  loadMoreButton.className = 'load-more-activities';
  loadMoreButton.textContent = 'Charger plus d\'activités';
  loadMoreButton.addEventListener('click', () => {
    const nextPage = Math.ceil(activities.length / perPage) + 1;
    fetchActivities(containerId, nextPage, perPage);
  });
  
  container.appendChild(loadMoreButton);
}

/**
 * Récupère les détails d'une activité spécifique
 * @param {string} activityId ID de l'activité
 * @returns {Promise} Promesse résolue avec les détails de l'activité
 */
function fetchActivityDetails(activityId) {
  return fetch(`/api/strava/activities/${activityId}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des détails de l\'activité');
      }
      return response.json();
    })
    .then(data => {
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error('Données de détails d\'activité invalides');
      }
    });
}

/**
 * Affiche les détails d'une activité dans une modale
 * @param {object} activityDetails Détails de l'activité
 */
function displayActivityDetails(activityDetails) {
  // Créer un élément de modale s'il n'existe pas déjà
  let modal = document.getElementById('activity-details-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'activity-details-modal';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }
  
  // Convertir les valeurs numériques
  const distance = (activityDetails.distance / 1000).toFixed(2); // En km
  const elevation = Math.round(activityDetails.total_elevation_gain); // En mètres
  const movingTime = formatDuration(activityDetails.moving_time); // Formatage du temps
  const avgSpeed = (activityDetails.average_speed * 3.6).toFixed(1); // En km/h
  const maxSpeed = (activityDetails.max_speed * 3.6).toFixed(1); // En km/h
  
  // Convertir la date
  const date = new Date(activityDetails.start_date);
  const formattedDate = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Créer le contenu de la modale
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${activityDetails.name}</h2>
        <span class="close-modal">&times;</span>
      </div>
      <div class="modal-body">
        <div class="activity-date-time">
          <p><i class="fas fa-calendar"></i> ${formattedDate} à ${formattedTime}</p>
        </div>
        <div class="activity-stats-grid">
          <div class="stat-card">
            <div class="stat-value">${distance} km</div>
            <div class="stat-label">Distance</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${elevation} m</div>
            <div class="stat-label">Dénivelé</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${movingTime}</div>
            <div class="stat-label">Durée</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${avgSpeed} km/h</div>
            <div class="stat-label">Vitesse moyenne</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${maxSpeed} km/h</div>
            <div class="stat-label">Vitesse max</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${activityDetails.calories || '—'}</div>
            <div class="stat-label">Calories</div>
          </div>
        </div>
        
        <div class="activity-description">
          ${activityDetails.description ? `<p>${activityDetails.description}</p>` : ''}
        </div>
        
        <div class="activity-map" id="activity-detail-map"></div>
        
        ${activityDetails.photos && activityDetails.photos.primary ? `
          <div class="activity-photo">
            <img src="${activityDetails.photos.primary.urls[600]}" alt="Photo de l'activité">
          </div>
        ` : ''}
      </div>
    </div>
  `;
  
  // Afficher la modale
  modal.style.display = 'block';
  
  // Configurer le bouton de fermeture
  const closeButton = modal.querySelector('.close-modal');
  closeButton.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  // Fermer la modale en cliquant en dehors du contenu
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  // Si l'activité a un polyline codé, l'afficher sur la carte
  if (activityDetails.map && activityDetails.map.polyline && window.mapboxgl) {
    // Créer une carte miniature pour l'activité
    const activityMap = new mapboxgl.Map({
      container: 'activity-detail-map',
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: activityDetails.start_latlng ? 
        [activityDetails.start_latlng[1], activityDetails.start_latlng[0]] : 
        [6.8770, 48.1000],
      zoom: 11
    });
    
    // Attendre que la carte soit chargée
    activityMap.on('load', () => {
      // Décoder le polyline
      const coordinates = decodePolyline(activityDetails.map.polyline);
      
      // Créer une source GeoJSON pour l'itinéraire
      activityMap.addSource('activity-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates.map(coord => [coord[1], coord[0]])
          }
        }
      });
      
      // Ajouter une couche pour l'itinéraire
      activityMap.addLayer({
        id: 'activity-route',
        type: 'line',
        source: 'activity-route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#FF6B35',
          'line-width': 4
        }
      });
      
      // Ajouter des marqueurs pour le début et la fin
      if (coordinates.length > 0) {
        // Marqueur de début
        const startEl = document.createElement('div');
        startEl.className = 'marker start-marker';
        startEl.style.backgroundColor = '#4CAF50';
        startEl.style.width = '15px';
        startEl.style.height = '15px';
        startEl.style.borderRadius = '50%';
        new mapboxgl.Marker(startEl)
          .setLngLat([coordinates[0][1], coordinates[0][0]])
          .addTo(activityMap);
        
        // Marqueur de fin
        const endEl = document.createElement('div');
        endEl.className = 'marker end-marker';
        endEl.style.backgroundColor = '#F44336';
        endEl.style.width = '15px';
        endEl.style.height = '15px';
        endEl.style.borderRadius = '50%';
        new mapboxgl.Marker(endEl)
          .setLngLat([coordinates[coordinates.length - 1][1], coordinates[coordinates.length - 1][0]])
          .addTo(activityMap);
        
        // Ajuster la vue pour montrer l'itinéraire complet
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend([coord[1], coord[0]]);
        }, new mapboxgl.LngLatBounds([coordinates[0][1], coordinates[0][0]], [coordinates[0][1], coordinates[0][0]]));
        
        activityMap.fitBounds(bounds, {
          padding: 40
        });
      }
    });
  }
}

/**
 * Récupère les statistiques de l'athlète
 * @param {string} containerId ID du conteneur pour afficher les statistiques
 * @returns {Promise} Promesse résolue avec les données de statistiques
 */
function fetchAthleteStats(containerId) {
  return fetch('/api/strava/stats')
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des statistiques');
      }
      return response.json();
    })
    .then(data => {
      if (data.success && data.data) {
        // Afficher les statistiques dans le conteneur
        displayAthleteStats(containerId, data.data);
        return data.data;
      } else {
        throw new Error('Données de statistiques invalides');
      }
    });
}

/**
 * Affiche les statistiques de l'athlète dans le conteneur spécifié
 * @param {string} containerId ID du conteneur
 * @param {object} stats Données de statistiques
 */
function displayAthleteStats(containerId, stats) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Extraire les statistiques pour le cyclisme (type "ride")
  const rideStats = stats.all_ride_totals || {};
  const recentRideStats = stats.recent_ride_totals || {};
  
  // Calculer les valeurs moyennes
  const totalRides = rideStats.count || 0;
  const totalDistance = ((rideStats.distance || 0) / 1000).toFixed(0); // En km
  const totalElevation = Math.round(rideStats.elevation_gain || 0); // En mètres
  const totalTime = formatDuration(rideStats.moving_time || 0);
  
  const recentRides = recentRideStats.count || 0;
  const recentDistance = ((recentRideStats.distance || 0) / 1000).toFixed(0); // En km
  const recentElevation = Math.round(recentRideStats.elevation_gain || 0); // En mètres
  
  // Générer le HTML pour les statistiques
  container.innerHTML = `
    <h2>Vos statistiques</h2>
    <div class="stats-grid">
      <div class="stats-card total-stats">
        <h3>Total de vos activités</h3>
        <div class="stats-content">
          <div class="stat-item">
            <div class="stat-value">${totalRides}</div>
            <div class="stat-label">Sorties</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${totalDistance}</div>
            <div class="stat-label">Kilomètres</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${totalElevation}</div>
            <div class="stat-label">Dénivelé (m)</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${totalTime}</div>
            <div class="stat-label">Temps total</div>
          </div>
        </div>
      </div>
      
      <div class="stats-card recent-stats">
        <h3>Activités des 4 dernières semaines</h3>
        <div class="stats-content">
          <div class="stat-item">
            <div class="stat-value">${recentRides}</div>
            <div class="stat-label">Sorties</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${recentDistance}</div>
            <div class="stat-label">Kilomètres</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${recentElevation}</div>
            <div class="stat-label">Dénivelé (m)</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Déconnecte l'utilisateur de Strava
 * @returns {Promise} Promesse résolue après la déconnexion
 */
function logout() {
  return fetch('/api/strava/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Erreur lors de la déconnexion');
    }
    return response.json();
  });
}

/**
 * Efface le contenu d'un conteneur
 * @param {string} containerId ID du conteneur
 */
function clearContainer(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }
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
 * Décode un polyline encodé en coordonnées
 * @param {string} encodedPolyline Polyline encodé
 * @returns {Array} Tableau de coordonnées [lat, lng]
 */
function decodePolyline(encodedPolyline) {
  const coordinates = [];
  let index = 0;
  const len = encodedPolyline.length;
  let lat = 0;
  let lng = 0;
  
  while (index < len) {
    let result = 1;
    let shift = 0;
    let b;
    do {
      b = encodedPolyline.charCodeAt(index++) - 63;
      result += (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    
    result = 1;
    shift = 0;
    do {
      b = encodedPolyline.charCodeAt(index++) - 63;
      result += (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    
    coordinates.push([lat * 1e-5, lng * 1e-5]);
  }
  
  return coordinates;
}

// Exporter les fonctions pour une utilisation externe
window.stravaIntegration = {
  initStrava,
  fetchActivities,
  fetchAthleteStats
};
