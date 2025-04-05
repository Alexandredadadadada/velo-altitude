/**
 * weather.js - Module de gestion météo pour Grand Est Cyclisme
 * Permet d'accéder aux prévisions météo pour la planification des sorties cyclistes
 */

// Cache pour les données météo
const weatherCache = {
  current: null,
  forecast: null,
  lastUpdate: null
};

/**
 * Initialise le module météo
 * @param {string} weatherWidgetId ID du widget météo
 * @param {string} forecastContainerId ID du conteneur pour les prévisions
 * @param {Array} defaultLocation Coordonnées par défaut [latitude, longitude]
 */
function initWeather(weatherWidgetId, forecastContainerId, defaultLocation = [48.6833, 6.2]) {
  // Récupérer les données météo actuelles
  fetchCurrentWeather(defaultLocation[0], defaultLocation[1])
    .then(weatherData => {
      // Mettre à jour le widget météo
      updateWeatherWidget(weatherWidgetId, weatherData);
      
      // Mettre les données en cache
      weatherCache.current = weatherData;
      weatherCache.lastUpdate = new Date();
    })
    .catch(error => {
      console.error('Erreur lors de la récupération des données météo:', error);
    });
  
  // Récupérer les prévisions météo
  fetchWeatherForecast(defaultLocation[0], defaultLocation[1])
    .then(forecastData => {
      // Afficher les prévisions météo
      displayWeatherForecast(forecastContainerId, forecastData);
      
      // Mettre les données en cache
      weatherCache.forecast = forecastData;
    })
    .catch(error => {
      console.error('Erreur lors de la récupération des prévisions météo:', error);
    });
  
  // Configurer le rafraîchissement des données toutes les 30 minutes
  setInterval(() => {
    fetchCurrentWeather(defaultLocation[0], defaultLocation[1])
      .then(weatherData => {
        updateWeatherWidget(weatherWidgetId, weatherData);
        weatherCache.current = weatherData;
        weatherCache.lastUpdate = new Date();
      });
    
    fetchWeatherForecast(defaultLocation[0], defaultLocation[1])
      .then(forecastData => {
        displayWeatherForecast(forecastContainerId, forecastData);
        weatherCache.forecast = forecastData;
      });
  }, 30 * 60 * 1000); // 30 minutes
}

/**
 * Récupère les données météo actuelles pour une localisation
 * @param {number} lat Latitude
 * @param {number} lon Longitude
 * @returns {Promise} Promesse résolue avec les données météo
 */
function fetchCurrentWeather(lat, lon) {
  return fetch(`/api/weather/current?lat=${lat}&lon=${lon}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des données météo');
      }
      return response.json();
    })
    .then(data => {
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error('Données météo invalides');
      }
    });
}

/**
 * Récupère les prévisions météo pour une localisation
 * @param {number} lat Latitude
 * @param {number} lon Longitude
 * @returns {Promise} Promesse résolue avec les données de prévisions
 */
function fetchWeatherForecast(lat, lon) {
  return fetch(`/api/weather/forecast?lat=${lat}&lon=${lon}`)
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des prévisions météo');
      }
      return response.json();
    })
    .then(data => {
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error('Données de prévision invalides');
      }
    });
}

/**
 * Met à jour le widget météo avec les données actuelles
 * @param {string} widgetId ID du widget météo
 * @param {object} weatherData Données météo
 */
function updateWeatherWidget(widgetId, weatherData) {
  const widget = document.getElementById(widgetId);
  if (!widget) return;
  
  // Récupérer les informations principales
  const temp = Math.round(weatherData.main.temp);
  const feelsLike = Math.round(weatherData.main.feels_like);
  const description = weatherData.weather[0].description;
  const icon = weatherData.weather[0].icon;
  const windSpeed = (weatherData.wind.speed * 3.6).toFixed(1); // Conversion en km/h
  const windDir = getWindDirection(weatherData.wind.deg);
  const humidity = weatherData.main.humidity;
  const pressure = weatherData.main.pressure;
  const visibility = (weatherData.visibility / 1000).toFixed(1); // En km
  
  // Déterminer si les conditions sont favorables au cyclisme
  const isCyclingFriendly = evaluateCyclingConditions(weatherData);
  
  // Générer l'HTML du widget
  widget.innerHTML = `
    <div class="weather-widget ${isCyclingFriendly ? 'weather-good' : 'weather-warning'}">
      <div class="weather-main">
        <div class="weather-icon">
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
        </div>
        <div class="weather-info">
          <div class="weather-temp">${temp}°C</div>
          <div class="weather-desc">${description}</div>
        </div>
      </div>
      <div class="weather-details">
        <div class="weather-detail">
          <i class="fas fa-thermometer-half"></i>
          <span>Ressenti: ${feelsLike}°C</span>
        </div>
        <div class="weather-detail">
          <i class="fas fa-wind"></i>
          <span>Vent: ${windSpeed} km/h ${windDir}</span>
        </div>
        <div class="weather-detail">
          <i class="fas fa-tint"></i>
          <span>Humidité: ${humidity}%</span>
        </div>
      </div>
      <div class="weather-cycling-advice">
        ${isCyclingFriendly 
          ? '<span class="good-condition"><i class="fas fa-bicycle"></i> Conditions favorables pour le cyclisme</span>'
          : '<span class="poor-condition"><i class="fas fa-exclamation-triangle"></i> Conditions difficiles pour le cyclisme</span>'}
      </div>
    </div>
  `;
}

/**
 * Affiche les prévisions météo dans le conteneur spécifié
 * @param {string} containerId ID du conteneur pour les prévisions
 * @param {object} forecastData Données de prévisions
 */
function displayWeatherForecast(containerId, forecastData) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Nettoyer le conteneur
  container.innerHTML = '';
  
  // Créer l'en-tête pour les prévisions
  const header = document.createElement('h2');
  header.textContent = 'Prévisions météo';
  container.appendChild(header);
  
  // Créer le conteneur pour les cartes de prévision
  const forecastContainer = document.createElement('div');
  forecastContainer.className = 'forecast-container';
  
  // Grouper les prévisions par jour
  const dailyForecasts = groupForecastsByDay(forecastData.list);
  
  // Afficher les prévisions pour chaque jour
  Object.entries(dailyForecasts).forEach(([date, forecasts]) => {
    // Créer une carte pour chaque jour
    const dayCard = document.createElement('div');
    dayCard.className = 'forecast-day-card';
    
    // Formater la date
    const forecastDate = new Date(date);
    const dayName = forecastDate.toLocaleDateString('fr-FR', { weekday: 'long' });
    const dayMonth = forecastDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    
    // Déterminer les conditions moyennes pour la journée
    const avgTemp = Math.round(
      forecasts.reduce((sum, f) => sum + f.main.temp, 0) / forecasts.length
    );
    
    // Prendre l'icône de la prévision de midi (ou la première disponible)
    const midDayForecast = forecasts.find(f => {
      const hour = new Date(f.dt * 1000).getHours();
      return hour >= 11 && hour <= 14;
    }) || forecasts[0];
    
    const icon = midDayForecast.weather[0].icon;
    const description = midDayForecast.weather[0].description;
    
    // Évaluer si la journée est favorable au cyclisme
    const cyclingScore = evaluateCyclingDay(forecasts);
    let cyclingAdvice = '';
    let cyclingClass = '';
    
    if (cyclingScore > 7) {
      cyclingAdvice = 'Excellente journée pour le vélo !';
      cyclingClass = 'cycling-excellent';
    } else if (cyclingScore > 5) {
      cyclingAdvice = 'Bonne journée pour le vélo';
      cyclingClass = 'cycling-good';
    } else if (cyclingScore > 3) {
      cyclingAdvice = 'Conditions moyennes pour le vélo';
      cyclingClass = 'cycling-average';
    } else {
      cyclingAdvice = 'Conditions défavorables pour le vélo';
      cyclingClass = 'cycling-poor';
    }
    
    // Créer le contenu de la carte
    dayCard.innerHTML = `
      <div class="forecast-day-header">
        <div class="forecast-day-date">
          <div class="day-name">${dayName}</div>
          <div class="day-date">${dayMonth}</div>
        </div>
        <div class="forecast-day-icon">
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
        </div>
        <div class="forecast-day-temp">
          ${avgTemp}°C
        </div>
      </div>
      <div class="forecast-day-details">
        <div class="hourly-forecast">
          ${forecasts.map(forecast => {
            const hour = new Date(forecast.dt * 1000).getHours();
            const temp = Math.round(forecast.main.temp);
            const icon = forecast.weather[0].icon;
            return `
              <div class="hourly-item">
                <div class="hourly-time">${hour}h</div>
                <div class="hourly-icon">
                  <img src="https://openweathermap.org/img/wn/${icon}.png" alt="">
                </div>
                <div class="hourly-temp">${temp}°C</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      <div class="forecast-cycling-advice ${cyclingClass}">
        <i class="fas fa-bicycle"></i> ${cyclingAdvice}
      </div>
    `;
    
    // Ajouter la carte au conteneur
    forecastContainer.appendChild(dayCard);
  });
  
  // Ajouter le conteneur de prévisions au conteneur principal
  container.appendChild(forecastContainer);
}

/**
 * Groupe les prévisions par jour
 * @param {Array} forecastList Liste des prévisions
 * @returns {Object} Prévisions groupées par jour
 */
function groupForecastsByDay(forecastList) {
  const groupedForecasts = {};
  
  forecastList.forEach(forecast => {
    const date = new Date(forecast.dt * 1000);
    const dateKey = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    if (!groupedForecasts[dateKey]) {
      groupedForecasts[dateKey] = [];
    }
    
    groupedForecasts[dateKey].push(forecast);
  });
  
  return groupedForecasts;
}

/**
 * Évalue si les conditions météo sont favorables au cyclisme
 * @param {object} weatherData Données météo
 * @returns {boolean} Vrai si les conditions sont favorables
 */
function evaluateCyclingConditions(weatherData) {
  // Facteurs défavorables
  const rainCodes = [200, 201, 202, 230, 231, 232, 300, 301, 302, 310, 311, 312, 313, 314, 321, 500, 501, 502, 503, 504, 511, 520, 521, 522, 531];
  const snowCodes = [600, 601, 602, 611, 612, 613, 615, 616, 620, 621, 622];
  const stormCodes = [771, 781];
  
  const isRaining = rainCodes.includes(weatherData.weather[0].id);
  const isSnowing = snowCodes.includes(weatherData.weather[0].id);
  const isStormy = stormCodes.includes(weatherData.weather[0].id);
  const isTooCold = weatherData.main.temp < 5;
  const isTooHot = weatherData.main.temp > 32;
  const isWindy = weatherData.wind.speed > 8; // Environ 30 km/h
  
  // Retourner vrai si aucun facteur défavorable n'est présent
  return !(isRaining || isSnowing || isStormy || isTooCold || isTooHot || isWindy);
}

/**
 * Évalue la qualité d'une journée pour le cyclisme (note de 0 à 10)
 * @param {Array} forecasts Liste des prévisions pour la journée
 * @returns {number} Score de 0 (mauvais) à 10 (excellent)
 */
function evaluateCyclingDay(forecasts) {
  // Initialiser le score à 10
  let score = 10;
  
  // Compter les prévisions avec précipitations
  const rainForecasts = forecasts.filter(f => {
    const rainCodes = [200, 201, 202, 230, 231, 232, 300, 301, 302, 310, 311, 312, 313, 314, 321, 500, 501, 502, 503, 504, 511, 520, 521, 522, 531];
    return rainCodes.includes(f.weather[0].id);
  });
  
  // Réduire le score en fonction des précipitations
  score -= (rainForecasts.length / forecasts.length) * 5;
  
  // Vérifier la température moyenne
  const avgTemp = forecasts.reduce((sum, f) => sum + f.main.temp, 0) / forecasts.length;
  
  // Pénaliser les températures extrêmes
  if (avgTemp < 5) {
    score -= (5 - avgTemp) * 0.5; // Pénalisation progressive pour le froid
  } else if (avgTemp > 30) {
    score -= (avgTemp - 30) * 0.5; // Pénalisation progressive pour la chaleur
  }
  
  // Vérifier le vent moyen
  const avgWind = forecasts.reduce((sum, f) => sum + f.wind.speed, 0) / forecasts.length;
  
  // Pénaliser le vent fort
  if (avgWind > 5) { // > 18 km/h
    score -= (avgWind - 5) * 0.5;
  }
  
  // Limiter le score entre 0 et 10
  return Math.max(0, Math.min(10, score));
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

// Exporter les fonctions pour une utilisation externe
window.weatherModule = {
  initWeather,
  fetchCurrentWeather,
  fetchWeatherForecast,
  updateWeatherWidget,
  displayWeatherForecast
};
