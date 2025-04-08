import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  MdFilterList, MdSearch, MdClose, MdMap, MdList, 
  MdStar, MdStarBorder, MdArrowUpward, MdTune,
  MdLocationOn, MdOutlineDirectionsBike, MdTerrain
} from 'react-icons/md';
import { ColFilterPanel } from './ColFilterPanel';
import { ColCard } from './ColCard';
import './ColExplorerView.css';

/**
 * Interface premium pour l'explorateur de cols
 * Intègre le Weather Service optimisé et le Cache Service du backend
 * 
 * @component
 */
export const ColExplorerView = () => {
  const [cols, setCols] = useState([]);
  const [filteredCols, setFilteredCols] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'map'
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    difficulty: [],
    elevation: [0, 3000],
    distance: [0, 100],
    gradient: [0, 20],
    regions: [],
    completed: null, // null, true, false
    favorite: false,
    sort: 'name' // 'name', 'elevation', 'difficulty', 'distance', 'gradient'
  });
  
  const searchInputRef = useRef(null);
  const mapRef = useRef(null);
  
  // Animation des cartes
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.05,
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    }),
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };
  
  // Charger les données des cols
  // Dans un vrai scénario, cela ferait appel au Weather Service et au Cache Service
  useEffect(() => {
    const fetchCols = async () => {
      try {
        setIsLoading(true);
        
        // Simuler l'appel API - Dans une vraie implémentation, ceci utiliserait 
        // les services backend optimisés avec cache et JWT
        setTimeout(() => {
          const mockCols = generateMockCols();
          setCols(mockCols);
          setFilteredCols(mockCols);
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        setError('Erreur lors du chargement des cols. Veuillez réessayer.');
        setIsLoading(false);
      }
    };
    
    fetchCols();
  }, []);
  
  // Filtrer les cols lorsque les filtres changent
  useEffect(() => {
    if (cols.length === 0) return;
    
    const applyFilters = () => {
      let result = [...cols];
      
      // Filtre de recherche
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        result = result.filter(col => 
          col.name.toLowerCase().includes(query) || 
          col.region.toLowerCase().includes(query)
        );
      }
      
      // Difficulté
      if (activeFilters.difficulty.length > 0) {
        result = result.filter(col => 
          activeFilters.difficulty.includes(col.difficulty)
        );
      }
      
      // Élévation
      result = result.filter(col => 
        col.elevation >= activeFilters.elevation[0] && 
        col.elevation <= activeFilters.elevation[1]
      );
      
      // Distance
      result = result.filter(col => 
        col.distance >= activeFilters.distance[0] && 
        col.distance <= activeFilters.distance[1]
      );
      
      // Pente
      result = result.filter(col => 
        col.gradient >= activeFilters.gradient[0] && 
        col.gradient <= activeFilters.gradient[1]
      );
      
      // Régions
      if (activeFilters.regions.length > 0) {
        result = result.filter(col => 
          activeFilters.regions.includes(col.region)
        );
      }
      
      // Complété
      if (activeFilters.completed !== null) {
        result = result.filter(col => col.completed === activeFilters.completed);
      }
      
      // Favoris
      if (activeFilters.favorite) {
        result = result.filter(col => col.favorite);
      }
      
      // Tri
      result.sort((a, b) => {
        switch (activeFilters.sort) {
          case 'elevation':
            return b.elevation - a.elevation;
          case 'difficulty':
            return b.difficulty - a.difficulty;
          case 'distance':
            return b.distance - a.distance;
          case 'gradient':
            return b.gradient - a.gradient;
          case 'name':
          default:
            return a.name.localeCompare(b.name);
        }
      });
      
      setFilteredCols(result);
    };
    
    applyFilters();
  }, [cols, searchQuery, activeFilters]);
  
  // Générer des cols de test
  const generateMockCols = () => {
    const regions = ['Alpes', 'Pyrénées', 'Vosges', 'Jura', 'Massif central'];
    const cols = [];
    
    for (let i = 1; i <= 20; i++) {
      const region = regions[Math.floor(Math.random() * regions.length)];
      const difficulty = Math.floor(Math.random() * 5) + 1;
      const elevation = Math.floor(Math.random() * 2000) + 500;
      const distance = Math.floor(Math.random() * 30) + 5;
      const gradient = Math.floor(Math.random() * 12) + 4;
      
      cols.push({
        id: i,
        name: `Col de ${['la Madeleine', 'Tourmalet', 'Galibier', 'Aubisque', 'Izoard', 'Ventoux', 'Bonette', 'Ballon', 'Grand Colombier', 'Croix de Fer'][i % 10]}${i > 10 ? ' ' + i : ''}`,
        region,
        elevation,
        distance,
        gradient,
        difficulty,
        completed: Math.random() > 0.7,
        favorite: Math.random() > 0.8,
        image: `https://source.unsplash.com/random/400x300/?mountain,col,${i}`,
        weather: {
          current: {
            temp: Math.floor(Math.random() * 20) + 5,
            conditions: ['Ensoleillé', 'Nuageux', 'Partiellement nuageux', 'Pluvieux'][Math.floor(Math.random() * 4)],
            wind: Math.floor(Math.random() * 30) + 5
          },
          forecast: Array(5).fill().map((_, index) => ({
            day: new Date(Date.now() + 86400000 * (index + 1)).toLocaleDateString('fr-FR', { weekday: 'short' }),
            temp: Math.floor(Math.random() * 20) + 5,
            conditions: ['Ensoleillé', 'Nuageux', 'Partiellement nuageux', 'Pluvieux'][Math.floor(Math.random() * 4)]
          }))
        }
      });
    }
    
    return cols;
  };
  
  // Gérer la recherche
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Effacer la recherche
  const clearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };
  
  // Basculer l'affichage des filtres
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  // Mettre à jour les filtres
  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };
  
  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setActiveFilters({
      difficulty: [],
      elevation: [0, 3000],
      distance: [0, 100],
      gradient: [0, 20],
      regions: [],
      completed: null,
      favorite: false,
      sort: 'name'
    });
    setSearchQuery('');
  };
  
  // Gérer l'ajout/suppression des favoris
  const handleToggleFavorite = (colId) => {
    setCols(prev => 
      prev.map(col => 
        col.id === colId 
          ? { ...col, favorite: !col.favorite } 
          : col
      )
    );
  };
  
  // Calculer le nombre de filtres actifs (hors tri)
  const getActiveFilterCount = () => {
    let count = 0;
    
    if (activeFilters.difficulty.length > 0) count++;
    if (activeFilters.elevation[0] > 0 || activeFilters.elevation[1] < 3000) count++;
    if (activeFilters.distance[0] > 0 || activeFilters.distance[1] < 100) count++;
    if (activeFilters.gradient[0] > 0 || activeFilters.gradient[1] < 20) count++;
    if (activeFilters.regions.length > 0) count++;
    if (activeFilters.completed !== null) count++;
    if (activeFilters.favorite) count++;
    
    return count;
  };
  
  return (
    <div className="col-explorer">
      <div className="col-explorer-header glass">
        <div className="col-explorer-title-section">
          <h1 className="col-explorer-title">Explorateur de Cols</h1>
          <p className="col-explorer-subtitle">
            Découvrez les plus beaux cols cyclistes avec données météo en temps réel
          </p>
        </div>
        
        <div className="col-explorer-actions">
          <div className="col-explorer-search">
            <div className="col-search-input-wrapper">
              <MdSearch className="col-search-icon" />
              <input
                type="text"
                placeholder="Rechercher un col..."
                className="col-search-input"
                value={searchQuery}
                onChange={handleSearch}
                ref={searchInputRef}
              />
              {searchQuery && (
                <button className="col-search-clear" onClick={clearSearch}>
                  <MdClose />
                </button>
              )}
            </div>
          </div>
          
          <div className="col-explorer-view-toggle">
            <button 
              className={`col-view-button ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Vue grille"
            >
              <MdList />
            </button>
            <button 
              className={`col-view-button ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
              aria-label="Vue carte"
            >
              <MdMap />
            </button>
          </div>
          
          <button 
            className="col-filter-button"
            onClick={toggleFilters}
            aria-label="Filtres"
            data-active-count={getActiveFilterCount()}
          >
            {showFilters ? <MdClose /> : <MdFilterList />}
            <span>Filtres</span>
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {showFilters && (
          <motion.div
            className="col-filter-panel-container"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <ColFilterPanel 
              activeFilters={activeFilters}
              onFilterChange={handleFilterChange}
              onReset={resetFilters}
              regions={['Alpes', 'Pyrénées', 'Vosges', 'Jura', 'Massif central']}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {isLoading ? (
        <div className="col-explorer-loading glass">
          <div className="col-explorer-loader"></div>
          <p>Chargement des cols...</p>
        </div>
      ) : error ? (
        <div className="col-explorer-error glass">
          <p>{error}</p>
          <button className="col-retry-button glass glass--button">
            Réessayer
          </button>
        </div>
      ) : (
        <div className={`col-explorer-content ${viewMode === 'map' ? 'map-view' : 'grid-view'}`}>
          {viewMode === 'grid' ? (
            <>
              <div className="col-results-info glass">
                <div className="col-results-count">
                  {filteredCols.length} col{filteredCols.length > 1 ? 's' : ''} trouvé{filteredCols.length > 1 ? 's' : ''}
                </div>
                <div className="col-results-sort">
                  <label htmlFor="sort-select">Trier par:</label>
                  <select 
                    id="sort-select"
                    value={activeFilters.sort}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="col-sort-select"
                  >
                    <option value="name">Nom</option>
                    <option value="elevation">Altitude</option>
                    <option value="difficulty">Difficulté</option>
                    <option value="distance">Distance</option>
                    <option value="gradient">Pente</option>
                  </select>
                </div>
              </div>
              
              {filteredCols.length === 0 ? (
                <div className="col-explorer-empty glass">
                  <div className="col-empty-icon">
                    <MdTerrain />
                  </div>
                  <h3>Aucun col ne correspond à vos critères</h3>
                  <p>Essayez de modifier vos filtres pour trouver des cols.</p>
                  <button className="col-reset-button glass glass--button" onClick={resetFilters}>
                    Réinitialiser les filtres
                  </button>
                </div>
              ) : (
                <div className="col-grid">
                  <AnimatePresence>
                    {filteredCols.map((col, index) => (
                      <motion.div
                        key={col.id}
                        className="col-grid-item"
                        custom={index}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                      >
                        <ColCard 
                          col={col} 
                          onToggleFavorite={handleToggleFavorite} 
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          ) : (
            <div className="col-map-container glass" ref={mapRef}>
              <div className="col-map-placeholder">
                <p>Carte interactive des cols</p>
                <p className="col-map-note">Dans une implémentation réelle, cette section afficherait une carte interactive avec les cols, intégrant les données météo en temps réel du Weather Service.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
