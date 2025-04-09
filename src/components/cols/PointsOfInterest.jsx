import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FaMapMarkerAlt, FaWater, FaParking, FaUtensils, FaMountain, FaCamera, FaBiking, 
         FaSearch, FaTimes, FaStar, FaFilter, FaInfoCircle, FaSpinner } from 'react-icons/fa';
import { GiWaterBottle, GiMountainCave } from 'react-icons/gi';
import colService from '../../services/cols';
import './PointsOfInterest.css';

/**
 * Composant affichant les points d'intérêt pour un col spécifique
 * Inclut une carte interactive, des filtres avancés et une liste détaillée des points
 * Optimisé avec système de cache et performances améliorées pour appareils mobiles
 */
const PointsOfInterest = ({ colId, points: initialPoints, coordinates }) => {
  // États principaux
  const [points, setPoints] = useState(initialPoints || []);
  const [loading, setLoading] = useState(!initialPoints);
  const [error, setError] = useState(null);
  const [activeFilters, setActiveFilters] = useState(['all']);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // États pour la recherche et le tri
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('distance');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [imageLoadingQueue, setImageLoadingQueue] = useState([]); // Pour le lazy loading des images
  
  // Références
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const clusterRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  
  // Constantes pour la mise en cache
  const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes
  const CACHE_KEY = `poi_${colId}`;
  
  // Liste des catégories disponibles avec traduction
  const CATEGORIES = {
    'all': 'Tous',
    'restaurant': 'Restaurants',
    'water': 'Points d\'eau',
    'water_fountain': 'Fontaines',
    'parking': 'Parkings',
    'viewpoint': 'Points de vue',
    'photo_spot': 'Spots photos',
    'cycling_services': 'Services vélo',
    'cave': 'Grottes',
    'shelter': 'Abris'
  };
  
  // Icônes pour les différentes catégories
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'restaurant':
        return <FaUtensils />;
      case 'water':
        return <FaWater />;
      case 'water_fountain':
        return <GiWaterBottle />;
      case 'parking':
        return <FaParking />;
      case 'viewpoint':
        return <FaMountain />;
      case 'photo_spot':
        return <FaCamera />;
      case 'cycling_services':
        return <FaBiking />;
      case 'cave':
        return <GiMountainCave />;
      case 'shelter':
        return <FaMapMarkerAlt />; 
      default:
        return <FaMapMarkerAlt />;
    }
  };
  
  // Fonction pour récupérer les données de cache
  const getFromCache = () => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          console.log('Utilisation des points d\'intérêt en cache');
          return data;
        }
      }
    } catch (err) {
      console.warn('Erreur lors de la récupération du cache:', err);
    }
    return null;
  };
  
  // Fonction pour sauvegarder les données en cache
  const saveToCache = (data) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.warn('Erreur lors de la sauvegarde en cache:', err);
    }
  };
  
  // Chargement des points d'intérêt
  const fetchPoints = useCallback(async (ignoreCache = false) => {
    if (initialPoints && initialPoints.length > 0 && !ignoreCache) {
      return; // Points déjà fournis
    }
    
    if (!colId) {
      setError("Identifiant du col manquant");
      setLoading(false);
      return;
    }
    
    // Vérifier le cache sauf si refresh forcé
    if (!ignoreCache) {
      const cachedPoints = getFromCache();
      if (cachedPoints) {
        setPoints(cachedPoints);
        setLoading(false);
        return;
      }
    }
    
    try {
      ignoreCache ? setRefreshing(true) : setLoading(true);
      
      // Ajouter un léger délai pour montrer le spinner de rafraîchissement
      const fetchedPoints = await colService.getPointsOfInterest(colId);
      
      // Calcul de distance par rapport aux coordonnées du col
      const pointsWithDistance = fetchedPoints.map(point => {
        if (coordinates && point.coordinates) {
          const distance = calculateDistance(
            coordinates.latitude, 
            coordinates.longitude,
            point.coordinates.latitude,
            point.coordinates.longitude
          );
          return { ...point, distance };
        }
        return point;
      });
      
      setPoints(pointsWithDistance);
      saveToCache(pointsWithDistance);
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error('Erreur lors du chargement des points d\'intérêt:', err);
      setError("Impossible de charger les points d'intérêt. Veuillez réessayer plus tard.");
      setLoading(false);
      setRefreshing(false);
    }
  }, [colId, initialPoints, coordinates]);
  
  // Formule de Haversine pour calculer la distance entre deux coordonnées
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return parseFloat(distance.toFixed(1)); // Distance en km avec 1 décimale
  };
  
  // Effet pour charger les points d'intérêt au chargement
  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);
  
  // Initialisation et gestion de la carte
  useEffect(() => {
    if (!coordinates || !points.length || !mapContainerRef.current || mapLoaded) {
      return;
    }
    
    // Fonction pour initialiser la carte
    const initMap = async () => {
      try {
        // Ici, on simule l'initialisation d'une carte (peut être remplacé par Leaflet, Google Maps, etc.)
        console.log('Initialisation de la carte avec coordonnées:', coordinates);
        
        // Dans une implémentation réelle, on initialiserait la carte ainsi :
        // import L from 'leaflet';
        // const map = L.map(mapContainerRef.current).setView([coordinates.latitude, coordinates.longitude], 13);
        // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        // mapRef.current = map;
        
        // Pour notre démonstration, on marque simplement comme chargée
        setTimeout(() => {
          setMapLoaded(true);
        }, 500);
        
        // Simulation de marqueurs et clustering
        // const markers = L.markerClusterGroup();
        // points.forEach(point => {
        //   const marker = L.marker([point.coordinates.latitude, point.coordinates.longitude]);
        //   marker.bindPopup(`<b>${point.name}</b><br>${point.description}`);
        //   markers.addLayer(marker);
        //   markersRef.current.push(marker);
        // });
        // map.addLayer(markers);
        // clusterRef.current = markers;
      } catch (err) {
        console.error('Erreur lors de l\'initialisation de la carte:', err);
      }
    };
    
    initMap();
  }, [coordinates, points, mapLoaded]);
  
  // Gestionnaire de changement de filtre
  const handleFilterChange = useCallback((newFilter) => {
    setActiveFilters(prev => {
      if (newFilter === 'all') {
        // Si on sélectionne "Tous", on désactive les autres filtres
        return ['all'];
      } else if (prev.includes(newFilter)) {
        // Si le filtre est déjà actif, on le retire
        const updated = prev.filter(f => f !== newFilter);
        // Si aucun filtre n'est actif, on revient à "Tous"
        return updated.length === 0 ? ['all'] : updated;
      } else {
        // Sinon on l'ajoute et on retire "Tous" s'il est présent
        const updated = prev.filter(f => f !== 'all');
        return [...updated, newFilter];
      }
    });
    
    // Ne pas réinitialiser la sélection si on change juste les filtres
    if (selectedPoint && selectedPoint.category && 
      (newFilter === 'all' || newFilter === selectedPoint.category)) {
      // Garder le point sélectionné s'il correspond au nouveau filtre
    } else {
      setSelectedPoint(null);
    }
  }, [selectedPoint]);
  
  // Gestionnaire de sélection d'un point
  const handlePointSelect = useCallback((point) => {
    setSelectedPoint(prev => prev && prev.id === point.id ? null : point);
    
    // Dans une implémentation réelle, on centrerait la carte sur ce point
    // et on ouvrirait le popup correspondant
    // if (mapRef.current && point.coordinates) {
    //   mapRef.current.setView([point.coordinates.latitude, point.coordinates.longitude], 15);
    //   
    //   // Trouver le marqueur correspondant
    //   markersRef.current.forEach(marker => {
    //     const pos = marker.getLatLng();
    //     if (Math.abs(pos.lat - point.coordinates.latitude) < 0.0001 && 
    //         Math.abs(pos.lng - point.coordinates.longitude) < 0.0001) {
    //       marker.openPopup();
    //     }
    //   });
    // }
  }, []);
  
  // Gestionnaire de recherche
  const handleSearch = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Utilisation d'un délai pour éviter trop de recherches pendant la frappe
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      // La recherche sera appliquée par le useMemo ci-dessous
    }, 300);
  }, []);
  
  // Gestionnaire de tri
  const handleSortChange = useCallback((e) => {
    setSortOption(e.target.value);
  }, []);
  
  // Fonction pour forcer un rafraîchissement des données
  const handleRefresh = useCallback(() => {
    fetchPoints(true); // Ignorer le cache
  }, [fetchPoints]);
  
  // Application des filtres, recherche et tri aux points d'intérêt
  const filteredAndSortedPoints = useMemo(() => {
    // Filtrage par catégorie
    let result = points;
    
    if (!activeFilters.includes('all')) {
      result = points.filter(point => activeFilters.includes(point.category));
    }
    
    // Recherche textuelle
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(point => 
        point.name.toLowerCase().includes(query) || 
        (point.description && point.description.toLowerCase().includes(query))
      );
    }
    
    // Tri
    return result.sort((a, b) => {
      switch (sortOption) {
        case 'distance':
          return (a.distance || 0) - (b.distance || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          const ratingA = a.reviews ? a.reviews.reduce((sum, r) => sum + r.rating, 0) / a.reviews.length : 0;
          const ratingB = b.reviews ? b.reviews.reduce((sum, r) => sum + r.rating, 0) / b.reviews.length : 0;
          return ratingB - ratingA; // Du plus haut au plus bas
        default:
          return 0;
      }
    });
  }, [points, activeFilters, searchQuery, sortOption]);
  
  // Gestion du lazy loading des images
  useEffect(() => {
    if (selectedPoint && selectedPoint.images && selectedPoint.images.length > 0) {
      // Ajouter les images à la file d'attente de chargement
      setImageLoadingQueue(selectedPoint.images.map(img => img.url));
    } else {
      setImageLoadingQueue([]);
    }
  }, [selectedPoint]);
  
  // Observer d'intersection pour lazy loading
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !selectedPoint) {
      return;
    }
    
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    }, observerOptions);
    
    // Observer toutes les images avec data-src
    const lazyImages = document.querySelectorAll('.detail-image img[data-src]');
    lazyImages.forEach(img => observer.observe(img));
    
    return () => {
      lazyImages.forEach(img => observer.unobserve(img));
    };
  }, [selectedPoint, imageLoadingQueue]);
  
  // Rendu du chargement
  if (loading) {
    return (
      <div className="poi-loading">
        <div className="spinner"></div>
        <p>Chargement des points d'intérêt...</p>
      </div>
    );
  }
  
  // Rendu de l'erreur
  if (error) {
    return (
      <div className="poi-error">
        <p>{error}</p>
        <button className="retry-button" onClick={handleRefresh}>
          Réessayer
        </button>
      </div>
    );
  }
  
  // Aucun point d'intérêt
  if (!points || points.length === 0) {
    return (
      <div className="poi-empty">
        <FaMapMarkerAlt className="empty-icon" />
        <h3>Aucun point d'intérêt</h3>
        <p>Aucun point d'intérêt n'a été enregistré pour ce col.</p>
      </div>
    );
  }
  
  return (
    <div className="points-of-interest">
      {/* Barre d'outils avec recherche, tri et rafraîchissement */}
      <div className="poi-toolbar">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un point d'intérêt..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
          />
          {searchQuery && (
            <button 
              className="clear-search" 
              onClick={() => setSearchQuery('')}
              aria-label="Effacer la recherche"
            >
              <FaTimes />
            </button>
          )}
        </div>
        
        <div className="toolbar-actions">
          <select 
            value={sortOption} 
            onChange={handleSortChange}
            className="sort-select"
            aria-label="Trier par"
          >
            <option value="distance">Distance</option>
            <option value="name">Nom</option>
            <option value="rating">Notation</option>
          </select>
          
          <button 
            className="filter-toggle"
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            aria-label="Afficher/masquer les filtres"
          >
            <FaFilter />
            <span>Filtres</span>
            {activeFilters.length > 0 && !activeFilters.includes('all') && (
              <span className="filter-count">{activeFilters.length}</span>
            )}
          </button>
          
          <button 
            className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Rafraîchir les données"
          >
            {refreshing ? <FaSpinner className="spinning" /> : <FaInfoCircle />}
          </button>
        </div>
      </div>
      
      {/* Panneau de filtres étendu */}
      {showFiltersPanel && (
        <div className="filters-panel">
          <div className="filters-grid">
            {Object.entries(CATEGORIES).map(([key, label]) => (
              <button 
                key={key}
                className={`filter-chip ${activeFilters.includes(key) ? 'active' : ''}`}
                onClick={() => handleFilterChange(key)}
              >
                {key !== 'all' && getCategoryIcon(key)}
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Indicateur de rafraîchissement */}
      {refreshing && (
        <div className="refreshing-indicator">
          <div className="spinner-small"></div>
          <span>Mise à jour des données...</span>
        </div>
      )}
      
      {/* Conteneur de carte */}
      <div className="map-container" ref={mapContainerRef}>
        {!mapLoaded ? (
          <div className="map-loading">
            <div className="spinner"></div>
            <p>Chargement de la carte...</p>
          </div>
        ) : (
          <div className="map-placeholder">
            Carte interactive des points d'intérêt
            {/* Ici sera rendue la carte par la librairie de cartographie */}
          </div>
        )}
      </div>
      
      {/* Liste des points filtrés */}
      <div className="poi-list">
        <h3>Points d'intérêt {filteredAndSortedPoints.length !== points.length && 
            `(${filteredAndSortedPoints.length}/${points.length})`}</h3>
            
        {filteredAndSortedPoints.length === 0 ? (
          <div className="poi-no-results">
            <p>Aucun résultat ne correspond à votre recherche.</p>
            <button 
              className="reset-filters" 
              onClick={() => {
                setSearchQuery('');
                setActiveFilters(['all']);
              }}
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="poi-items">
            {filteredAndSortedPoints.map((point) => (
              <div 
                key={point.id || point.name} 
                className={`poi-item ${selectedPoint && selectedPoint.id === point.id ? 'selected' : ''}`}
                onClick={() => handlePointSelect(point)}
              >
                <div className="poi-icon">
                  {getCategoryIcon(point.category)}
                </div>
                <div className="poi-content">
                  <h4 className="poi-name">{point.name}</h4>
                  <p className="poi-description">{point.description}</p>
                  <div className="poi-meta">
                    {point.distance !== undefined && (
                      <span className="poi-distance">{point.distance} km</span>
                    )}
                    {point.reviews && point.reviews.length > 0 && (
                      <span className="poi-rating">
                        <FaStar />
                        {(point.reviews.reduce((sum, r) => sum + r.rating, 0) / point.reviews.length).toFixed(1)}
                      </span>
                    )}
                    <span className="poi-category">{CATEGORIES[point.category] || point.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Détails du point sélectionné */}
      {selectedPoint && (
        <div className="poi-details">
          <div className="detail-header">
            <button 
              className="close-details" 
              onClick={() => setSelectedPoint(null)}
              aria-label="Fermer les détails"
            >
              <FaTimes />
            </button>
            <h3 className="detail-name">{selectedPoint.name}</h3>
            
            <div className="detail-category">
              {getCategoryIcon(selectedPoint.category)}
              <span>{CATEGORIES[selectedPoint.category] || selectedPoint.category}</span>
            </div>
          </div>
          
          <div className="detail-content">
            <div className="detail-main">
              <p className="detail-description">{selectedPoint.description}</p>
              
              <div className="detail-meta">
                {selectedPoint.distance !== undefined && (
                  <div className="meta-item">
                    <span className="meta-label">Distance:</span>
                    <span className="meta-value">{selectedPoint.distance} km</span>
                  </div>
                )}
                
                {selectedPoint.altitude && (
                  <div className="meta-item">
                    <span className="meta-label">Altitude:</span>
                    <span className="meta-value">{selectedPoint.altitude} m</span>
                  </div>
                )}
                
                {selectedPoint.openingHours && (
                  <div className="meta-item">
                    <span className="meta-label">Horaires:</span>
                    <span className="meta-value">{selectedPoint.openingHours}</span>
                  </div>
                )}
                
                {selectedPoint.contact && (
                  <div className="meta-item">
                    <span className="meta-label">Contact:</span>
                    <span className="meta-value">{selectedPoint.contact}</span>
                  </div>
                )}
                
                {selectedPoint.website && (
                  <div className="meta-item">
                    <span className="meta-label">Site web:</span>
                    <a href={selectedPoint.website} target="_blank" rel="noopener noreferrer" className="meta-link">
                      {selectedPoint.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {selectedPoint.images && selectedPoint.images.length > 0 && (
            <div className="detail-images">
              <h4>Photos</h4>
              <div className="image-grid">
                {selectedPoint.images.map((image, index) => (
                  <div key={index} className="detail-image">
                    {/* Image avec lazy loading */}
                    <img 
                      src={index < 2 ? image.url : undefined} 
                      data-src={index >= 2 ? image.url : undefined}
                      alt={image.caption || `${selectedPoint.name} - Photo ${index + 1}`} 
                      loading="lazy"
                    />
                    {image.caption && <div className="image-caption">{image.caption}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {selectedPoint.reviews && selectedPoint.reviews.length > 0 && (
            <div className="detail-reviews">
              <h4>Avis ({selectedPoint.reviews.length})</h4>
              <div className="reviews-list">
                {selectedPoint.reviews.map((review, index) => (
                  <div key={index} className="review">
                    <div className="review-header">
                      <span className="review-author">{review.author}</span>
                      <div className="review-rating">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < review.rating ? 'star filled' : 'star'}>★</span>
                        ))}
                      </div>
                    </div>
                    <p className="review-text">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

PointsOfInterest.propTypes = {
  colId: PropTypes.string.isRequired,
  points: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    category: PropTypes.string.isRequired,
    coordinates: PropTypes.shape({
      latitude: PropTypes.number.isRequired,
      longitude: PropTypes.number.isRequired
    }),
    altitude: PropTypes.number,
    distance: PropTypes.number,
    openingHours: PropTypes.string,
    contact: PropTypes.string,
    website: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.shape({
      url: PropTypes.string.isRequired,
      caption: PropTypes.string
    })),
    reviews: PropTypes.arrayOf(PropTypes.shape({
      author: PropTypes.string.isRequired,
      rating: PropTypes.number.isRequired,
      text: PropTypes.string
    }))
  })),
  coordinates: PropTypes.shape({
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired
  })
};

export default PointsOfInterest;
