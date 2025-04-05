/**
 * Module de traduction (i18n) pour l'application Grand Est Cyclisme
 * Permet de gérer les traductions dans plusieurs langues européennes
 */

const I18n = (function() {
  // Langues supportées
  const supportedLanguages = ['fr', 'en', 'de', 'it', 'es'];
  
  // Langue par défaut
  let currentLanguage = 'fr';
  
  // Dictionnaires de traduction
  const translations = {
    // Français (langue par défaut)
    'fr': {
      // Navigation
      'nav.home': 'Accueil',
      'nav.map': 'Carte',
      'nav.weather': 'Météo',
      'nav.strava': 'Strava',
      'nav.assistant': 'Assistant',
      'nav.settings': 'Paramètres',
      
      // Carte
      'map.title': 'Carte Cycliste',
      'map.search': 'Rechercher un lieu',
      'map.filter': 'Filtrer les cols',
      'map.difficulty': 'Difficulté',
      'map.distance': 'Distance',
      'map.elevation': 'Dénivelé',
      'map.route': 'Calculer un itinéraire',
      'map.isochrone': 'Zone accessible',
      'map.cols': 'Cols cyclistes',
      'map.segments': 'Segments Strava',
      'map.weather': 'Couche météo',
      
      // Météo
      'weather.title': 'Conditions météo',
      'weather.current': 'Conditions actuelles',
      'weather.forecast': 'Prévisions',
      'weather.temperature': 'Température',
      'weather.wind': 'Vent',
      'weather.humidity': 'Humidité',
      'weather.precipitation': 'Précipitations',
      'weather.pressure': 'Pression',
      'weather.visibility': 'Visibilité',
      'weather.conditions': 'Conditions cyclables',
      'weather.excellent': 'Excellentes',
      'weather.good': 'Bonnes',
      'weather.fair': 'Moyennes',
      'weather.poor': 'Difficiles',
      'weather.bad': 'Déconseillées',
      
      // Strava
      'strava.connect': 'Se connecter avec Strava',
      'strava.activities': 'Mes activités',
      'strava.segments': 'Segments populaires',
      'strava.stats': 'Statistiques',
      'strava.efforts': 'Efforts',
      'strava.upload': 'Importer une activité',
      'strava.route': 'Créer un itinéraire',
      'strava.challenge': 'Défis',
      'strava.ranking': 'Classement',
      
      // Assistant IA
      'ai.title': 'Assistant Cycliste',
      'ai.placeholder': 'Posez une question sur le cyclisme...',
      'ai.suggestions': 'Suggestions',
      'ai.routes': 'Itinéraires recommandés',
      'ai.weather': 'Prévisions météo pour le cyclisme',
      'ai.training': 'Conseils d\'entraînement',
      'ai.cols': 'Information sur les cols',
      
      // Profil de col
      'col.details': 'Détails du col',
      'col.altitude': 'Altitude',
      'col.length': 'Longueur',
      'col.grade': 'Pente moyenne',
      'col.difficulty': 'Difficulté',
      'col.open': 'État d\'ouverture',
      'col.surface': 'État de la route',
      'col.description': 'Description',
      'col.weather': 'Météo au sommet',
      'col.nearby': 'Cols à proximité',
      'col.comments': 'Commentaires',
      
      // Général
      'general.loading': 'Chargement...',
      'general.error': 'Erreur',
      'general.retry': 'Réessayer',
      'general.save': 'Enregistrer',
      'general.cancel': 'Annuler',
      'general.close': 'Fermer',
      'general.yes': 'Oui',
      'general.no': 'Non',
      'general.back': 'Retour',
      'general.next': 'Suivant',
      'general.show': 'Afficher',
      'general.hide': 'Masquer'
    },
    
    // Anglais
    'en': {
      // Navigation
      'nav.home': 'Home',
      'nav.map': 'Map',
      'nav.weather': 'Weather',
      'nav.strava': 'Strava',
      'nav.assistant': 'Assistant',
      'nav.settings': 'Settings',
      
      // Carte
      'map.title': 'Cycling Map',
      'map.search': 'Search a location',
      'map.filter': 'Filter passes',
      'map.difficulty': 'Difficulty',
      'map.distance': 'Distance',
      'map.elevation': 'Elevation',
      'map.route': 'Calculate route',
      'map.isochrone': 'Accessible area',
      'map.cols': 'Mountain passes',
      'map.segments': 'Strava segments',
      'map.weather': 'Weather layer',
      
      // Météo
      'weather.title': 'Weather conditions',
      'weather.current': 'Current conditions',
      'weather.forecast': 'Forecast',
      'weather.temperature': 'Temperature',
      'weather.wind': 'Wind',
      'weather.humidity': 'Humidity',
      'weather.precipitation': 'Precipitation',
      'weather.pressure': 'Pressure',
      'weather.visibility': 'Visibility',
      'weather.conditions': 'Cycling conditions',
      'weather.excellent': 'Excellent',
      'weather.good': 'Good',
      'weather.fair': 'Fair',
      'weather.poor': 'Poor',
      'weather.bad': 'Not recommended',
      
      // Strava
      'strava.connect': 'Connect with Strava',
      'strava.activities': 'My activities',
      'strava.segments': 'Popular segments',
      'strava.stats': 'Statistics',
      'strava.efforts': 'Efforts',
      'strava.upload': 'Upload activity',
      'strava.route': 'Create route',
      'strava.challenge': 'Challenges',
      'strava.ranking': 'Ranking',
      
      // Assistant IA
      'ai.title': 'Cycling Assistant',
      'ai.placeholder': 'Ask a question about cycling...',
      'ai.suggestions': 'Suggestions',
      'ai.routes': 'Recommended routes',
      'ai.weather': 'Cycling weather forecast',
      'ai.training': 'Training advice',
      'ai.cols': 'Mountain pass information',
      
      // Profil de col
      'col.details': 'Pass details',
      'col.altitude': 'Altitude',
      'col.length': 'Length',
      'col.grade': 'Average gradient',
      'col.difficulty': 'Difficulty',
      'col.open': 'Open status',
      'col.surface': 'Road surface',
      'col.description': 'Description',
      'col.weather': 'Summit weather',
      'col.nearby': 'Nearby passes',
      'col.comments': 'Comments',
      
      // Général
      'general.loading': 'Loading...',
      'general.error': 'Error',
      'general.retry': 'Retry',
      'general.save': 'Save',
      'general.cancel': 'Cancel',
      'general.close': 'Close',
      'general.yes': 'Yes',
      'general.no': 'No',
      'general.back': 'Back',
      'general.next': 'Next',
      'general.show': 'Show',
      'general.hide': 'Hide'
    },
    
    // Allemand
    'de': {
      // Navigation
      'nav.home': 'Startseite',
      'nav.map': 'Karte',
      'nav.weather': 'Wetter',
      'nav.strava': 'Strava',
      'nav.assistant': 'Assistent',
      'nav.settings': 'Einstellungen',
      
      // Carte
      'map.title': 'Radfahrkarte',
      'map.search': 'Ort suchen',
      'map.filter': 'Pässe filtern',
      'map.difficulty': 'Schwierigkeit',
      'map.distance': 'Entfernung',
      'map.elevation': 'Höhe',
      'map.route': 'Route berechnen',
      'map.isochrone': 'Erreichbarer Bereich',
      'map.cols': 'Bergpässe',
      'map.segments': 'Strava-Segmente',
      'map.weather': 'Wetterschicht',
      
      // Météo
      'weather.title': 'Wetterbedingungen',
      'weather.current': 'Aktuelle Bedingungen',
      'weather.forecast': 'Vorhersage',
      'weather.temperature': 'Temperatur',
      'weather.wind': 'Wind',
      'weather.humidity': 'Luftfeuchtigkeit',
      'weather.precipitation': 'Niederschlag',
      'weather.pressure': 'Luftdruck',
      'weather.visibility': 'Sichtweite',
      'weather.conditions': 'Radbedingungen',
      'weather.excellent': 'Ausgezeichnet',
      'weather.good': 'Gut',
      'weather.fair': 'Mittel',
      'weather.poor': 'Schwierig',
      'weather.bad': 'Nicht empfohlen',
      
      // Plus de traductions pour l'allemand...
    },
    
    // Italien - traductions partielles
    'it': {
      'nav.home': 'Home',
      'nav.map': 'Mappa',
      'nav.weather': 'Meteo',
      'nav.strava': 'Strava',
      'nav.assistant': 'Assistente',
      'nav.settings': 'Impostazioni',
      
      // Traductions partielles, à compléter...
    },
    
    // Espagnol - traductions partielles
    'es': {
      'nav.home': 'Inicio',
      'nav.map': 'Mapa',
      'nav.weather': 'Clima',
      'nav.strava': 'Strava',
      'nav.assistant': 'Asistente',
      'nav.settings': 'Configuración',
      
      // Traductions partielles, à compléter...
    }
  };
  
  /**
   * Détecte la langue du navigateur de l'utilisateur
   * @returns {string} Code de langue (fr, en, de, it, es)
   */
  function detectBrowserLanguage() {
    const browserLang = (navigator.language || navigator.userLanguage).substr(0, 2).toLowerCase();
    return supportedLanguages.includes(browserLang) ? browserLang : 'en';
  }
  
  /**
   * Initialise le module de traduction
   */
  function init() {
    // Récupérer la langue depuis localStorage ou utiliser celle du navigateur
    currentLanguage = localStorage.getItem('userLanguage') || detectBrowserLanguage();
    
    // Créer l'interface de sélection de langue
    createLanguageSwitcher();
    
    // Appliquer les traductions
    translateUI();
    
    // Écouter les changements de langue
    document.addEventListener('languageChanged', (e) => {
      translateUI();
    });
  }
  
  /**
   * Crée le sélecteur de langue dans l'interface
   */
  function createLanguageSwitcher() {
    // Vérifier si l'élément existe déjà
    if (document.getElementById('language-switcher')) {
      return;
    }
    
    const switcher = document.createElement('div');
    switcher.id = 'language-switcher';
    switcher.className = 'language-switcher';
    
    // Ajouter le titre
    const title = document.createElement('div');
    title.className = 'language-title';
    title.textContent = 'Language / Langue';
    switcher.appendChild(title);
    
    // Créer les boutons pour chaque langue
    const langContainer = document.createElement('div');
    langContainer.className = 'language-buttons';
    
    const languageNames = {
      'fr': 'Français',
      'en': 'English',
      'de': 'Deutsch',
      'it': 'Italiano',
      'es': 'Español'
    };
    
    supportedLanguages.forEach(lang => {
      const btn = document.createElement('button');
      btn.className = 'language-btn' + (lang === currentLanguage ? ' active' : '');
      btn.dataset.lang = lang;
      btn.textContent = languageNames[lang];
      
      btn.addEventListener('click', () => {
        setLanguage(lang);
        
        // Mettre à jour les classes actives
        document.querySelectorAll('.language-btn').forEach(el => {
          el.classList.remove('active');
        });
        btn.classList.add('active');
      });
      
      langContainer.appendChild(btn);
    });
    
    switcher.appendChild(langContainer);
    
    // Ajouter le sélecteur au document
    const navbarRight = document.querySelector('.navbar-right') || document.body;
    navbarRight.appendChild(switcher);
    
    // Ajouter les styles
    if (!document.getElementById('language-switcher-styles')) {
      const style = document.createElement('style');
      style.id = 'language-switcher-styles';
      style.textContent = `
        .language-switcher {
          position: relative;
          margin-left: 15px;
        }
        
        .language-title {
          font-size: 12px;
          color: #777;
          margin-bottom: 5px;
        }
        
        .language-buttons {
          display: flex;
          gap: 5px;
        }
        
        .language-btn {
          padding: 5px 8px;
          font-size: 12px;
          background: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 3px;
          cursor: pointer;
        }
        
        .language-btn.active {
          background: #1F497D;
          color: white;
          border-color: #1F497D;
        }
        
        @media (max-width: 767px) {
          .language-switcher {
            margin-left: 0;
            margin-top: 10px;
            width: 100%;
          }
          
          .language-buttons {
            justify-content: space-between;
          }
          
          .language-btn {
            flex: 1;
            text-align: center;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  /**
   * Change la langue de l'application
   * @param {string} lang Code de langue (fr, en, de, it, es)
   */
  function setLanguage(lang) {
    if (supportedLanguages.includes(lang)) {
      currentLanguage = lang;
      localStorage.setItem('userLanguage', lang);
      
      // Déclencher un événement pour informer les autres modules
      document.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { language: lang } 
      }));
      
      // Mettre à jour l'interface
      translateUI();
    }
  }
  
  /**
   * Traduit l'interface utilisateur complète
   */
  function translateUI() {
    // Traduire tous les éléments avec l'attribut data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = translate(key);
      
      // Si l'élément est un input avec placeholder
      if (element.hasAttribute('placeholder')) {
        element.setAttribute('placeholder', translation);
      } 
      // Autres éléments
      else {
        element.textContent = translation;
      }
    });
    
    // Mettre à jour l'attribut lang du document
    document.documentElement.lang = currentLanguage;
  }
  
  /**
   * Traduit une clé de traduction dans la langue actuelle
   * @param {string} key Clé de traduction
   * @param {Object} params Paramètres pour les substitutions (optionnel)
   * @returns {string} Texte traduit
   */
  function translate(key, params = {}) {
    // Récupérer la traduction
    let text = '';
    
    if (translations[currentLanguage] && translations[currentLanguage][key]) {
      text = translations[currentLanguage][key];
    } else if (translations['en'] && translations['en'][key]) {
      // Fallback sur l'anglais
      text = translations['en'][key];
    } else {
      // Fallback sur la clé elle-même
      text = key;
    }
    
    // Remplacer les paramètres dans la traduction
    Object.keys(params).forEach(param => {
      text = text.replace(new RegExp(`{${param}}`, 'g'), params[param]);
    });
    
    return text;
  }
  
  /**
   * Récupère la langue actuelle
   * @returns {string} Code de langue (fr, en, de, it, es)
   */
  function getCurrentLanguage() {
    return currentLanguage;
  }
  
  /**
   * Ajoute des traductions personnalisées au dictionnaire
   * @param {string} lang Code de langue (fr, en, de, it, es)
   * @param {Object} newTranslations Nouvelles traductions à ajouter
   */
  function addTranslations(lang, newTranslations) {
    if (!supportedLanguages.includes(lang)) {
      console.error(`Langue non supportée: ${lang}`);
      return;
    }
    
    // Fusionner les nouvelles traductions avec les existantes
    translations[lang] = {...translations[lang], ...newTranslations};
  }
  
  // Exposer l'API publique
  return {
    init,
    setLanguage,
    translate,
    getCurrentLanguage,
    addTranslations,
    supportedLanguages
  };
})();

// Initialiser le module lorsque le document est chargé
document.addEventListener('DOMContentLoaded', function() {
  I18n.init();
});
