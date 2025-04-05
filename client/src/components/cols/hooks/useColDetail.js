import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import weatherCache from '../../../utils/weatherCache';

/**
 * Hook personnalisé pour gérer les données et la logique du détail d'un col
 * 
 * @param {string} colId - Identifiant du col
 * @returns {Object} Données et fonctions pour le détail du col
 */
const useColDetail = (colId) => {
  const { t } = useTranslation();
  
  // États pour les données
  const [col, setCol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSide, setSelectedSide] = useState(null);
  const [elevationProfile, setElevationProfile] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareCol, setCompareCol] = useState(null);
  const [similarCols, setSimilarCols] = useState([]);
  const [userNotes, setUserNotes] = useState('');
  const [showNotesForm, setShowNotesForm] = useState(false);

  /**
   * Récupère les données du col
   */
  const fetchColData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Simuler un appel API pour récupérer les données du col
      const response = await fetch(`/api/cols/${colId}`);
      if (!response.ok) {
        throw new Error(`Error fetching col data: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCol(data);
      
      // Définir le côté par défaut
      if (data.climbData) {
        const defaultSide = Object.keys(data.climbData)[0];
        setSelectedSide(defaultSide);
        fetchElevationProfile(colId, defaultSide);
      }
      
      // Vérifier si le col est dans les favoris
      const favorites = JSON.parse(localStorage.getItem('favoriteCols') || '[]');
      setIsFavorite(favorites.includes(colId));
      
      // Charger les notes utilisateur
      const notes = localStorage.getItem(`colNotes_${colId}`);
      if (notes) {
        setUserNotes(notes);
      }
      
      // Charger les cols similaires
      fetchSimilarCols(data);
      
      // Charger les données météo
      if (data.location && data.location.coordinates) {
        fetchWeatherData(data.location.coordinates.lat, data.location.coordinates.lng);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [colId]);

  /**
   * Récupère le profil d'élévation pour un côté spécifique
   * @param {string} colId - ID du col
   * @param {string} side - Côté de l'ascension
   */
  const fetchElevationProfile = useCallback(async (colId, side) => {
    try {
      // Simuler un appel API pour récupérer le profil d'élévation
      const response = await fetch(`/api/cols/${colId}/elevation/${side}`);
      if (!response.ok) {
        throw new Error(`Error fetching elevation profile: ${response.statusText}`);
      }
      
      const data = await response.json();
      setElevationProfile(data);
    } catch (err) {
      console.error('Error fetching elevation profile:', err);
      setElevationProfile(null);
    }
  }, []);

  /**
   * Récupère les données météo pour une position géographique
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   */
  const fetchWeatherData = useCallback(async (lat, lng) => {
    try {
      // Utiliser le système de cache pour les données météo
      const weatherFetchFunction = async (latitude, longitude) => {
        const response = await fetch(`/api/weather?lat=${latitude}&lng=${longitude}`);
        if (!response.ok) {
          throw new Error(`Error fetching weather data: ${response.statusText}`);
        }
        return await response.json();
      };
      
      const data = await weatherCache.getWeatherData(lat, lng, weatherFetchFunction);
      setWeatherData(data);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setWeatherData(null);
    }
  }, []);

  /**
   * Récupère les cols similaires
   * @param {Object} colData - Données du col actuel
   */
  const fetchSimilarCols = useCallback(async (colData) => {
    try {
      // Simuler un appel API pour récupérer les cols similaires
      const response = await fetch(`/api/cols/similar?altitude=${colData.altitude}&region=${colData.location.region}`);
      if (!response.ok) {
        throw new Error(`Error fetching similar cols: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Filtrer pour exclure le col actuel
      const filteredData = data.filter(col => col.id !== colId);
      setSimilarCols(filteredData);
    } catch (err) {
      console.error('Error fetching similar cols:', err);
      setSimilarCols([]);
    }
  }, [colId]);

  /**
   * Récupère les données d'un col pour comparaison
   * @param {string} compareColId - ID du col à comparer
   */
  const fetchCompareCol = useCallback(async (compareColId) => {
    try {
      // Simuler un appel API pour récupérer les données du col à comparer
      const response = await fetch(`/api/cols/${compareColId}`);
      if (!response.ok) {
        throw new Error(`Error fetching compare col data: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCompareCol(data);
    } catch (err) {
      console.error('Error fetching compare col:', err);
      setCompareCol(null);
    }
  }, []);

  /**
   * Change le côté sélectionné et charge le profil d'élévation correspondant
   * @param {string} side - Côté de l'ascension
   */
  const handleSideChange = useCallback((side) => {
    setSelectedSide(side);
    fetchElevationProfile(colId, side);
  }, [colId, fetchElevationProfile]);

  /**
   * Ajoute ou retire le col des favoris
   */
  const toggleFavorite = useCallback(() => {
    const favorites = JSON.parse(localStorage.getItem('favoriteCols') || '[]');
    
    if (isFavorite) {
      const newFavorites = favorites.filter(id => id !== colId);
      localStorage.setItem('favoriteCols', JSON.stringify(newFavorites));
      setIsFavorite(false);
    } else {
      favorites.push(colId);
      localStorage.setItem('favoriteCols', JSON.stringify(favorites));
      setIsFavorite(true);
    }
  }, [colId, isFavorite]);

  /**
   * Active ou désactive le mode de comparaison
   */
  const toggleCompareMode = useCallback(() => {
    setCompareMode(prevMode => {
      if (!prevMode && similarCols.length > 0) {
        // Si on active le mode comparaison et qu'il y a des cols similaires,
        // charger le premier col similaire par défaut
        fetchCompareCol(similarCols[0].id);
      }
      return !prevMode;
    });
  }, [fetchCompareCol, similarCols]);

  /**
   * Change le col à comparer
   * @param {Object} e - Événement de changement
   */
  const handleCompareColChange = useCallback((e) => {
    fetchCompareCol(e.target.value);
  }, [fetchCompareCol]);

  /**
   * Sauvegarde les notes utilisateur
   */
  const saveUserNotes = useCallback(() => {
    localStorage.setItem(`colNotes_${colId}`, userNotes);
    setShowNotesForm(false);
  }, [colId, userNotes]);

  /**
   * Partage le col via l'API Web Share ou copie le lien
   */
  const shareCol = useCallback(() => {
    if (!col) return;
    
    if (navigator.share) {
      navigator.share({
        title: col.name,
        text: `Découvrez le ${col.name} (${col.altitude}m) sur Grand Est Cyclisme`,
        url: window.location.href
      })
      .catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback pour les navigateurs qui ne supportent pas l'API Web Share
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert(t('cols.share_link_copied')))
        .catch(err => console.error('Error copying to clipboard:', err));
    }
  }, [col, t]);

  // Charger les données du col au montage du composant
  useEffect(() => {
    if (colId) {
      fetchColData();
    }
  }, [colId, fetchColData]);

  return {
    // Données
    col,
    loading,
    error,
    selectedSide,
    elevationProfile,
    weatherData,
    isFavorite,
    compareMode,
    compareCol,
    similarCols,
    userNotes,
    showNotesForm,
    
    // Setters
    setUserNotes,
    setShowNotesForm,
    
    // Fonctions
    handleSideChange,
    toggleFavorite,
    toggleCompareMode,
    handleCompareColChange,
    saveUserNotes,
    shareCol,
    fetchElevationProfile
  };
};

export default useColDetail;
