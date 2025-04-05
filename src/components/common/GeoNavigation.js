import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import './GeoNavigation.css';

/**
 * Composant de navigation géographique hiérarchique
 * Permet de naviguer facilement entre pays, régions et départements à l'échelle européenne
 */
const GeoNavigation = ({ 
  onSelectLocation, 
  initialLocation = null,
  showMap = true 
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCountry, setActiveCountry] = useState(null);
  const [activeRegion, setActiveRegion] = useState(null);
  const [activeDepartment, setActiveDepartment] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState('countries'); // 'countries', 'regions', 'departments', 'map'
  const searchRef = useRef(null);
  const searchDebounce = useRef(null);

  // Navigation précédente/suivante
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [historyPosition, setHistoryPosition] = useState(-1);

  // Initialiser avec la localisation fournie
  useEffect(() => {
    if (initialLocation) {
      if (initialLocation.country) {
        setActiveCountry(initialLocation.country);
        if (initialLocation.region) {
          setActiveRegion(initialLocation.region);
          setView('regions');
          if (initialLocation.department) {
            setActiveDepartment(initialLocation.department);
            setView('departments');
          }
        }
      }
    }
  }, [initialLocation]);

  // Recherche avec debounce
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    if (searchDebounce.current) {
      clearTimeout(searchDebounce.current);
    }

    searchDebounce.current = setTimeout(() => {
      setIsLoading(true);
      
      // Simuler une recherche API (à remplacer par votre vrai API)
      fetchLocationSuggestions(searchTerm)
        .then(results => {
          setSuggestions(results);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Erreur de recherche:', error);
          setIsLoading(false);
        });
    }, 300);

    return () => {
      if (searchDebounce.current) {
        clearTimeout(searchDebounce.current);
      }
    };
  }, [searchTerm]);

  // Gestion de l'historique de navigation
  useEffect(() => {
    const currentLocation = {
      view,
      country: activeCountry,
      region: activeRegion,
      department: activeDepartment
    };
    
    if (historyPosition >= 0 && JSON.stringify(currentLocation) === JSON.stringify(navigationHistory[historyPosition])) {
      return; // Évite les doublons dans l'historique lors des navigations back/forward
    }

    // Ajouter la nouvelle entrée d'historique et supprimer les entrées futures si on navigue depuis un point d'historique antérieur
    const newHistory = [...navigationHistory.slice(0, historyPosition + 1), currentLocation];
    setNavigationHistory(newHistory);
    setHistoryPosition(newHistory.length - 1);
  }, [view, activeCountry, activeRegion, activeDepartment]);

  // Navigation dans l'historique
  const goBack = () => {
    if (historyPosition > 0) {
      const prevPosition = historyPosition - 1;
      const prevLocation = navigationHistory[prevPosition];
      
      setView(prevLocation.view);
      setActiveCountry(prevLocation.country);
      setActiveRegion(prevLocation.region);
      setActiveDepartment(prevLocation.department);
      
      setHistoryPosition(prevPosition);
    }
  };

  const goForward = () => {
    if (historyPosition < navigationHistory.length - 1) {
      const nextPosition = historyPosition + 1;
      const nextLocation = navigationHistory[nextPosition];
      
      setView(nextLocation.view);
      setActiveCountry(nextLocation.country);
      setActiveRegion(nextLocation.region);
      setActiveDepartment(nextLocation.department);
      
      setHistoryPosition(nextPosition);
    }
  };

  // Sélection d'un pays
  const handleSelectCountry = (country) => {
    setActiveCountry(country);
    setActiveRegion(null);
    setActiveDepartment(null);
    setView('regions');
    
    if (onSelectLocation) {
      onSelectLocation({ country });
    }
  };

  // Sélection d'une région
  const handleSelectRegion = (region) => {
    setActiveRegion(region);
    setActiveDepartment(null);
    setView('departments');
    
    if (onSelectLocation) {
      onSelectLocation({ country: activeCountry, region });
    }
  };

  // Sélection d'un département
  const handleSelectDepartment = (department) => {
    setActiveDepartment(department);
    
    if (onSelectLocation) {
      onSelectLocation({ country: activeCountry, region: activeRegion, department });
    }
  };

  // Sélection d'une suggestion de recherche
  const handleSelectSuggestion = (suggestion) => {
    const location = {
      country: suggestion.country,
      region: suggestion.region || null,
      department: suggestion.department || null
    };
    
    setActiveCountry(location.country);
    setActiveRegion(location.region);
    setActiveDepartment(location.department);
    
    if (location.department) {
      setView('departments');
    } else if (location.region) {
      setView('regions');
    } else {
      setView('regions');
    }
    
    setSearchTerm('');
    setSuggestions([]);
    
    if (onSelectLocation) {
      onSelectLocation(location);
    }
  };

  // Génération du fil d'Ariane
  const renderBreadcrumbs = () => {
    return (
      <div className="geo-breadcrumbs" role="navigation" aria-label={t('navigation.breadcrumb')}>
        <button 
          className="breadcrumb-item home"
          onClick={() => {
            setView('countries');
            setActiveCountry(null);
            setActiveRegion(null);
            setActiveDepartment(null);
          }}
          aria-label={t('navigation.home')}
        >
          <i className="fas fa-globe-europe" aria-hidden="true"></i>
        </button>
        
        {activeCountry && (
          <>
            <span className="breadcrumb-separator">/</span>
            <button 
              className="breadcrumb-item"
              onClick={() => {
                setView('regions');
                setActiveRegion(null);
                setActiveDepartment(null);
              }}
            >
              {activeCountry.name}
            </button>
          </>
        )}
        
        {activeRegion && (
          <>
            <span className="breadcrumb-separator">/</span>
            <button 
              className="breadcrumb-item"
              onClick={() => {
                setView('departments');
                setActiveDepartment(null);
              }}
            >
              {activeRegion.name}
            </button>
          </>
        )}
        
        {activeDepartment && (
          <>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item active">
              {activeDepartment.name}
            </span>
          </>
        )}
      </div>
    );
  };

  // Rendu des résultats de recherche
  const renderSearchResults = () => {
    if (suggestions.length === 0) {
      return searchTerm.length >= 2 && !isLoading ? (
        <div className="geo-search-no-results">
          {t('search.noResults')}
        </div>
      ) : null;
    }

    return (
      <ul className="geo-search-results" role="listbox" aria-label={t('search.suggestions')}>
        {suggestions.map((suggestion, index) => (
          <li 
            key={`suggestion-${index}`}
            role="option"
            className="geo-search-result-item"
            onClick={() => handleSelectSuggestion(suggestion)}
          >
            <div className="result-icon">
              {suggestion.type === 'country' && <i className="fas fa-flag" aria-hidden="true"></i>}
              {suggestion.type === 'region' && <i className="fas fa-map" aria-hidden="true"></i>}
              {suggestion.type === 'department' && <i className="fas fa-map-marker-alt" aria-hidden="true"></i>}
              {suggestion.type === 'city' && <i className="fas fa-city" aria-hidden="true"></i>}
            </div>
            <div className="result-content">
              <div className="result-name">{suggestion.name}</div>
              <div className="result-path">
                {suggestion.country.name}
                {suggestion.region && ` > ${suggestion.region.name}`}
                {suggestion.department && ` > ${suggestion.department.name}`}
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  // Rendu de la vue des pays
  const renderCountriesView = () => {
    // Liste des pays européens (à remplacer par des données réelles)
    const europeanCountries = getEuropeanCountries();
    
    return (
      <div className="geo-countries-grid">
        {europeanCountries.map(country => (
          <div 
            key={country.code}
            className="geo-country-card"
            onClick={() => handleSelectCountry(country)}
          >
            <div className="country-flag">
              <img src={country.flagUrl} alt={`${country.name} flag`} />
            </div>
            <div className="country-name">{country.name}</div>
          </div>
        ))}
      </div>
    );
  };

  // Rendu de la vue des régions
  const renderRegionsView = () => {
    if (!activeCountry) return null;
    
    // Liste des régions du pays actif (à remplacer par des données réelles)
    const regions = getRegionsByCountry(activeCountry.code);
    
    return (
      <div className="geo-regions-container">
        <h2>{t('navigation.regionsIn', { country: activeCountry.name })}</h2>
        <div className="geo-regions-grid">
          {regions.map(region => (
            <div 
              key={region.code}
              className="geo-region-card"
              onClick={() => handleSelectRegion(region)}
            >
              <div className="region-image">
                <img src={region.imageUrl} alt={region.name} />
              </div>
              <div className="region-name">{region.name}</div>
              <div className="region-stats">
                <span>{region.colsCount} {t('navigation.cols')}</span>
                <span>{region.routesCount} {t('navigation.routes')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Rendu de la vue des départements
  const renderDepartmentsView = () => {
    if (!activeCountry || !activeRegion) return null;
    
    // Liste des départements de la région active (à remplacer par des données réelles)
    const departments = getDepartmentsByRegion(activeRegion.code);
    
    return (
      <div className="geo-departments-container">
        <h2>{t('navigation.departmentsIn', { region: activeRegion.name })}</h2>
        <div className="geo-departments-grid">
          {departments.map(department => (
            <div 
              key={department.code}
              className="geo-department-card"
              onClick={() => handleSelectDepartment(department)}
            >
              <div className="department-name">{department.name}</div>
              <div className="department-code">{department.code}</div>
              <div className="department-stats">
                <div className="stat-item">
                  <i className="fas fa-mountain" aria-hidden="true"></i>
                  <span>{department.colsCount} {t('navigation.cols')}</span>
                </div>
                <div className="stat-item">
                  <i className="fas fa-road" aria-hidden="true"></i>
                  <span>{department.routesCount} {t('navigation.routes')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Rendu principal du composant
  return (
    <div className="geo-navigation">
      <div className="geo-navigation-controls">
        <div className="geo-nav-history">
          <button 
            className="nav-history-button" 
            onClick={goBack} 
            disabled={historyPosition <= 0}
            aria-label={t('navigation.back')}
          >
            <i className="fas fa-arrow-left" aria-hidden="true"></i>
          </button>
          <button 
            className="nav-history-button" 
            onClick={goForward} 
            disabled={historyPosition >= navigationHistory.length - 1}
            aria-label={t('navigation.forward')}
          >
            <i className="fas fa-arrow-right" aria-hidden="true"></i>
          </button>
        </div>
        
        {renderBreadcrumbs()}
        
        <div className="geo-search-container">
          <div className="geo-search-input-wrapper">
            <input
              ref={searchRef}
              type="text"
              className="geo-search-input"
              placeholder={t('search.placeholderGeo')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label={t('search.geoSearch')}
            />
            {isLoading ? (
              <span className="search-loader" aria-label={t('general.loading')}>
                <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
              </span>
            ) : (
              searchTerm ? (
                <button 
                  className="search-clear-button" 
                  onClick={() => setSearchTerm('')}
                  aria-label={t('search.clear')}
                >
                  <i className="fas fa-times" aria-hidden="true"></i>
                </button>
              ) : (
                <span className="search-icon">
                  <i className="fas fa-search" aria-hidden="true"></i>
                </span>
              )
            )}
          </div>
          {renderSearchResults()}
        </div>
        
        <div className="geo-view-toggle">
          <button 
            className={`view-toggle-button ${view === 'map' ? 'active' : ''}`}
            onClick={() => setView('map')}
            aria-label={t('navigation.mapView')}
            disabled={!showMap}
          >
            <i className="fas fa-map" aria-hidden="true"></i>
          </button>
          <button 
            className={`view-toggle-button ${view !== 'map' ? 'active' : ''}`}
            onClick={() => setView(activeRegion ? 'departments' : (activeCountry ? 'regions' : 'countries'))}
            aria-label={t('navigation.listView')}
          >
            <i className="fas fa-list" aria-hidden="true"></i>
          </button>
        </div>
      </div>
      
      <div className="geo-navigation-content">
        {view === 'countries' && renderCountriesView()}
        {view === 'regions' && renderRegionsView()}
        {view === 'departments' && renderDepartmentsView()}
        {view === 'map' && showMap && (
          <div className="geo-map-container">
            {/* Ici, intégrez votre composant de carte */}
            <div className="map-placeholder">
              {t('map.loading')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Fonctions d'aide pour simuler l'accès aux données géographiques
// À remplacer par des appels API réels

function fetchLocationSuggestions(query) {
  // Simulation d'une recherche API
  return new Promise((resolve) => {
    setTimeout(() => {
      // Données factices pour démonstration
      const allLocations = [
        { type: 'country', name: 'France', country: { name: 'France', code: 'FR' } },
        { type: 'country', name: 'Italie', country: { name: 'Italie', code: 'IT' } },
        { type: 'region', name: 'Auvergne-Rhône-Alpes', country: { name: 'France', code: 'FR' }, region: { name: 'Auvergne-Rhône-Alpes', code: 'ARA' } },
        { type: 'region', name: 'Alpes-Maritimes', country: { name: 'France', code: 'FR' }, region: { name: 'Provence-Alpes-Côte d\'Azur', code: 'PACA' } },
        { type: 'department', name: 'Haute-Savoie', country: { name: 'France', code: 'FR' }, region: { name: 'Auvergne-Rhône-Alpes', code: 'ARA' }, department: { name: 'Haute-Savoie', code: '74' } },
        { type: 'city', name: 'Annecy', country: { name: 'France', code: 'FR' }, region: { name: 'Auvergne-Rhône-Alpes', code: 'ARA' }, department: { name: 'Haute-Savoie', code: '74' } }
      ];
      
      // Filtrer les résultats selon la requête
      const results = allLocations.filter(location => 
        location.name.toLowerCase().includes(query.toLowerCase())
      );
      
      resolve(results);
    }, 500);
  });
}

function getEuropeanCountries() {
  return [
    { name: 'France', code: 'FR', flagUrl: '/images/flags/fr.svg' },
    { name: 'Italie', code: 'IT', flagUrl: '/images/flags/it.svg' },
    { name: 'Espagne', code: 'ES', flagUrl: '/images/flags/es.svg' },
    { name: 'Allemagne', code: 'DE', flagUrl: '/images/flags/de.svg' },
    { name: 'Suisse', code: 'CH', flagUrl: '/images/flags/ch.svg' },
    { name: 'Belgique', code: 'BE', flagUrl: '/images/flags/be.svg' },
    { name: 'Pays-Bas', code: 'NL', flagUrl: '/images/flags/nl.svg' },
    { name: 'Autriche', code: 'AT', flagUrl: '/images/flags/at.svg' }
    // Ajouter d'autres pays européens selon les besoins
  ];
}

function getRegionsByCountry(countryCode) {
  // Exemple pour la France
  if (countryCode === 'FR') {
    return [
      { name: 'Auvergne-Rhône-Alpes', code: 'ARA', imageUrl: '/images/regions/auvergne-rhone-alpes.jpg', colsCount: 247, routesCount: 189 },
      { name: 'Provence-Alpes-Côte d\'Azur', code: 'PACA', imageUrl: '/images/regions/paca.jpg', colsCount: 183, routesCount: 156 },
      { name: 'Occitanie', code: 'OCC', imageUrl: '/images/regions/occitanie.jpg', colsCount: 172, routesCount: 143 },
      { name: 'Grand Est', code: 'GE', imageUrl: '/images/regions/grand-est.jpg', colsCount: 78, routesCount: 65 },
      { name: 'Bourgogne-Franche-Comté', code: 'BFC', imageUrl: '/images/regions/bourgogne-franche-comte.jpg', colsCount: 53, routesCount: 47 }
      // Ajouter d'autres régions françaises
    ];
  }
  
  // Exemple pour l'Italie
  if (countryCode === 'IT') {
    return [
      { name: 'Piémont', code: 'PIE', imageUrl: '/images/regions/piemont.jpg', colsCount: 186, routesCount: 157 },
      { name: 'Lombardie', code: 'LOM', imageUrl: '/images/regions/lombardie.jpg', colsCount: 143, routesCount: 121 },
      { name: 'Trentin-Haut-Adige', code: 'TRE', imageUrl: '/images/regions/trentin.jpg', colsCount: 178, routesCount: 153 }
      // Ajouter d'autres régions italiennes
    ];
  }
  
  // Ajouter d'autres pays au besoin
  return [];
}

function getDepartmentsByRegion(regionCode) {
  // Exemple pour Auvergne-Rhône-Alpes
  if (regionCode === 'ARA') {
    return [
      { name: 'Haute-Savoie', code: '74', colsCount: 87, routesCount: 73 },
      { name: 'Savoie', code: '73', colsCount: 92, routesCount: 78 },
      { name: 'Isère', code: '38', colsCount: 68, routesCount: 59 },
      { name: 'Ain', code: '01', colsCount: 32, routesCount: 27 }
      // Ajouter d'autres départements
    ];
  }
  
  // Exemple pour Provence-Alpes-Côte d'Azur
  if (regionCode === 'PACA') {
    return [
      { name: 'Alpes-Maritimes', code: '06', colsCount: 76, routesCount: 64 },
      { name: 'Hautes-Alpes', code: '05', colsCount: 82, routesCount: 71 },
      { name: 'Alpes-de-Haute-Provence', code: '04', colsCount: 58, routesCount: 49 }
      // Ajouter d'autres départements
    ];
  }
  
  // Ajouter d'autres régions au besoin
  return [];
}

GeoNavigation.propTypes = {
  onSelectLocation: PropTypes.func,
  initialLocation: PropTypes.shape({
    country: PropTypes.object,
    region: PropTypes.object,
    department: PropTypes.object
  }),
  showMap: PropTypes.bool
};

export default GeoNavigation;
