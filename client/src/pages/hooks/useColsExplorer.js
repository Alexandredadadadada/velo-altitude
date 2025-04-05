import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ColService from '../../services/colService';
import weatherPreloader from '../../utils/weatherPreloader';
import { useLocalStorage } from '../../hooks/useLocalStorage';

/**
 * Hook personnalisé pour gérer la logique de l'explorateur de cols
 * @returns {Object} État et fonctions pour l'explorateur de cols
 */
const useColsExplorer = () => {
  const [cols, setCols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedColId, setSelectedColId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterElevation, setFilterElevation] = useState([0, 3000]);
  const [filterSurface, setFilterSurface] = useState([]);
  const [filterTechnicalDifficulty, setFilterTechnicalDifficulty] = useState('');
  const [filterSeasons, setFilterSeasons] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useLocalStorage('colFavorites', []);
  const itemsPerPage = 10;
  
  const location = useLocation();
  const navigate = useNavigate();
  
  /**
   * Déterminer la section active basée sur l'URL
   */
  const getActiveSection = useCallback(() => {
    if (location.pathname.includes('/seven-majors')) {
      return 'seven-majors';
    }
    return 'explorer';
  }, [location.pathname]);
  
  const activeSection = useMemo(() => getActiveSection(), [getActiveSection]);
  
  /**
   * Charger les cols avec filtres - optimisé avec debounce
   */
  const fetchCols = useCallback(async () => {
    try {
      setLoading(true);

      // Préparation des options de filtrage
      const options = {
        region: filterRegion || undefined,
        difficulty: filterDifficulty || undefined,
        minElevation: filterElevation[0] || undefined,
        maxElevation: filterElevation[1] || undefined,
        surface: filterSurface.length > 0 ? filterSurface : undefined,
        technicalDifficulty: filterTechnicalDifficulty || undefined,
        seasons: filterSeasons.length > 0 ? filterSeasons : undefined
      };

      const data = await ColService.getAllCols(options);
      setCols(data);
      
      // Sélectionner le premier col si aucun n'est sélectionné
      if (data.length > 0 && !selectedColId) {
        setSelectedColId(data[0].id);
        
        // Précharger les données météo pour ce col
        if (data[0].latitude && data[0].longitude) {
          weatherPreloader.addToPreloadQueue({
            lat: data[0].latitude,
            lng: data[0].longitude,
            name: data[0].name
          });
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des cols:', err);
      setError('Impossible de charger la liste des cols. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  }, [filterRegion, filterDifficulty, filterElevation, filterSurface, filterTechnicalDifficulty, filterSeasons, selectedColId]);
  
  // Effectuer le chargement initial et à chaque changement de filtre
  useEffect(() => {
    // Utiliser un délai pour éviter les requêtes trop fréquentes
    const debounceTimer = setTimeout(() => {
      fetchCols();
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [fetchCols]);
  
  /**
   * Filtrer les cols par terme de recherche
   */
  const filteredCols = useMemo(() => 
    cols.filter(col => {
      // Si le terme de recherche est vide, ne pas filtrer
      if (!searchTerm.trim()) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        col.name.toLowerCase().includes(searchLower) ||
        (col.region && col.region.toLowerCase().includes(searchLower)) ||
        (col.location && col.location.toLowerCase().includes(searchLower))
      );
    }),
    [cols, searchTerm]
  );
  
  /**
   * Calculer la pagination
   */
  const paginatedCols = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCols.slice(startIndex, endIndex);
  }, [filteredCols, page, itemsPerPage]);
  
  const pageCount = useMemo(() => 
    Math.ceil(filteredCols.length / itemsPerPage),
    [filteredCols.length, itemsPerPage]
  );
  
  // Réinitialiser la page quand les filtres changent
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterRegion, filterDifficulty, filterElevation, filterSurface, filterTechnicalDifficulty, filterSeasons]);
  
  /**
   * Gérer la sélection d'un col
   */
  const handleColSelect = useCallback((colId) => {
    setSelectedColId(colId);
    
    // Précharger les données météo lorsqu'un col est sélectionné
    const selectedCol = cols.find(col => col.id === colId);
    if (selectedCol && selectedCol.latitude && selectedCol.longitude) {
      weatherPreloader.addToPreloadQueue({
        lat: selectedCol.latitude,
        lng: selectedCol.longitude,
        name: selectedCol.name
      });
    }
  }, [cols]);
  
  /**
   * Ajouter/retirer un col des favoris
   */
  const toggleFavorite = useCallback((colId) => {
    setFavorites(prevFavorites => {
      if (prevFavorites.includes(colId)) {
        return prevFavorites.filter(id => id !== colId);
      } else {
        return [...prevFavorites, colId];
      }
    });
  }, [setFavorites]);
  
  /**
   * Réinitialiser tous les filtres
   */
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setFilterRegion('');
    setFilterDifficulty('');
    setFilterElevation([0, 3000]);
    setFilterSurface([]);
    setFilterTechnicalDifficulty('');
    setFilterSeasons([]);
  }, []);
  
  /**
   * Naviguer vers une section spécifique
   */
  const navigateToSection = useCallback((section) => {
    if (section === 'explorer') {
      navigate('/cols');
    } else if (section === 'seven-majors') {
      navigate('/cols/seven-majors');
    }
  }, [navigate]);
  
  return {
    cols,
    loading,
    error,
    selectedColId,
    searchTerm,
    filterRegion,
    filterDifficulty,
    filterElevation,
    filterSurface,
    filterTechnicalDifficulty,
    filterSeasons,
    filtersOpen,
    page,
    activeSection,
    filteredCols,
    paginatedCols,
    pageCount,
    favorites,
    toggleFavorite,
    setSearchTerm,
    setFilterRegion,
    setFilterDifficulty,
    setFilterElevation,
    setFilterSurface,
    setFilterTechnicalDifficulty,
    setFilterSeasons,
    setFiltersOpen,
    setPage,
    handleColSelect,
    resetFilters,
    navigateToSection
  };
};

export default useColsExplorer;
