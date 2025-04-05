import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, CardContent, Typography, Grid, Box, 
  Button, TextField, InputAdornment, Chip, 
  Select, MenuItem, FormControl, InputLabel, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Snackbar, Alert, CircularProgress,
  IconButton, Slider, Switch, FormControlLabel,
  Tooltip, Badge, Divider, Radio, RadioGroup
} from '@mui/material';
import { 
  Search, Add, Favorite, FavoriteBorder, Share, FilterList, Map, 
  Download, CloudUpload, Route, Timeline, Delete, Edit,
  TrendingUp, FileDownload, Visibility, Refresh, LocationOn,
  Close
} from '@mui/icons-material';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import { Line } from 'react-chartjs-2';
import StravaIntegration from './StravaIntegration';
import RouteService from '../../services/routeService';
import SocialService from '../../services/socialService';
import StravaService from '../../services/stravaService';
import AuthService from '../../services/authService';
import WeatherService from '../../services/weatherService';
import { Chart, registerables } from 'chart.js';
import 'leaflet/dist/leaflet.css';
import FileUploader from '../common/FileUploader';

// Enregistrer les composants Chart.js
Chart.register(...registerables);

/**
 * RouteSharing component for sharing and discovering cycling routes
 * @param {Object} props - Component properties
 * @param {string} props.userId - Current user ID
 */
const RouteSharing = ({ userId }) => {
  const [routes, setRoutes] = useState([]);
  const [userRoutes, setUserRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    distance: 'all',
    elevation: 'all',
    difficulty: 'all',
    region: 'all',
    surface: 'all' // Ajout d'un filtre pour le type de surface
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [createRouteDialog, setCreateRouteDialog] = useState(false);
  const [newRouteData, setNewRouteData] = useState({
    name: '',
    description: '',
    region: 'Alsace',
    difficulty: 'Modéré',
    surface: 'Asphalte',
    points_of_interest: [],
    points: []
  });
  const [uploadedGpxFile, setUploadedGpxFile] = useState(null);
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const [processingGpx, setProcessingGpx] = useState(false);
  const [newPointOfInterest, setNewPointOfInterest] = useState('');
  const [routeWeather, setRouteWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const elevationChartRef = useRef(null);

  // Fetch routes data on component mount
  useEffect(() => {
    fetchRoutesData();
  }, [userId]);

  const fetchRoutesData = async () => {
    try {
      setLoading(true);
      
      // Vérifier que les services sont disponibles
      if (!RouteService || !RouteService.getAllRoutes || !RouteService.getUserRoutes) {
        throw new Error('Service de gestion des itinéraires non disponible');
      }
      
      if (!userId) {
        console.warn('Aucun ID utilisateur fourni, les itinéraires personnels ne seront pas chargés');
      }
      
      // Utilisation du service pour récupérer les données
      const [allRoutes, userRoutesData] = await Promise.all([
        RouteService.getAllRoutes(),
        userId ? RouteService.getUserRoutes(userId) : []
      ]);
      
      // Valider les données reçues
      if (!allRoutes || !Array.isArray(allRoutes)) {
        throw new Error('Format de données invalide pour les itinéraires');
      }
      
      // Normaliser les données
      const normalizedRoutes = allRoutes.map(route => ({
        ...route,
        distance: typeof route.distance === 'number' ? route.distance : 0,
        elevationGain: typeof route.elevationGain === 'number' ? route.elevationGain : 0,
        favorites: typeof route.favorites === 'number' ? route.favorites : 0
      }));
      
      const normalizedUserRoutes = Array.isArray(userRoutesData) 
        ? userRoutesData.map(route => ({
            ...route,
            distance: typeof route.distance === 'number' ? route.distance : 0,
            elevationGain: typeof route.elevationGain === 'number' ? route.elevationGain : 0,
            favorites: typeof route.favorites === 'number' ? route.favorites : 0
          }))
        : [];
      
      setRoutes(normalizedRoutes);
      setUserRoutes(normalizedUserRoutes);
      setLoading(false);
      
      // Optionnellement, récupérer les alertes météo après le chargement des itinéraires
      if (normalizedRoutes.length > 0) {
        fetchWeatherAlertsForFavorites()
          .catch(weatherError => {
            console.error('Erreur lors de la récupération des alertes météo:', weatherError);
          });
      }
    } catch (error) {
      console.error('Error fetching routes data:', error);
      setAlert({
        open: true,
        message: `Erreur lors du chargement des itinéraires: ${error.message || 'Veuillez réessayer'}`,
        severity: 'error'
      });
      setRoutes([]);
      setUserRoutes([]);
      setLoading(false);
    }
  };
  
  // Filter routes based on search term and filters
  const filteredRoutes = routes.filter(route => {
    // Search term filter
    if (searchTerm && !route.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !route.location.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Distance filter
    if (filterOptions.distance !== 'all') {
      const [min, max] = filterOptions.distance.split('-').map(Number);
      if (route.distance < min || (max && route.distance > max)) {
        return false;
      }
    }
    
    // Elevation filter
    if (filterOptions.elevation !== 'all') {
      const [min, max] = filterOptions.elevation.split('-').map(Number);
      if (route.elevationGain < min || (max && route.elevationGain > max)) {
        return false;
      }
    }
    
    // Difficulty filter
    if (filterOptions.difficulty !== 'all' && route.difficulty !== filterOptions.difficulty) {
      return false;
    }
    
    // Region filter
    if (filterOptions.region !== 'all' && route.region !== filterOptions.region) {
      return false;
    }
    
    // Surface filter
    if (filterOptions.surface !== 'all' && route.surface !== filterOptions.surface) {
      return false;
    }
    
    return true;
  });
  
  // Toggle route favorite status
  const handleToggleFavorite = async (routeId) => {
    if (!routeId) {
      console.error('ID d\'itinéraire invalide');
      return;
    }
    
    if (!userId) {
      setAlert({
        open: true,
        message: 'Vous devez être connecté pour ajouter un itinéraire en favori',
        severity: 'warning'
      });
      return;
    }
    
    try {
      // Trouver l'itinéraire dans la liste
      const routeIndex = routes.findIndex(route => route.id === routeId);
      if (routeIndex === -1) {
        console.error(`Itinéraire avec l'ID ${routeId} non trouvé`);
        return;
      }
      
      const currentRoute = routes[routeIndex];
      const newFavoriteStatus = !currentRoute.userFavorited;
      
      // Mettre à jour l'état de façon optimiste
      const updatedRoutes = [...routes];
      updatedRoutes[routeIndex] = {
        ...currentRoute,
        userFavorited: newFavoriteStatus,
        favorites: Math.max(0, currentRoute.favorites + (newFavoriteStatus ? 1 : -1)),
        favoriteLoading: true
      };
      setRoutes(updatedRoutes);
      
      // Appel API
      const response = await RouteService.toggleFavorite(routeId, newFavoriteStatus);
      
      // Valider la réponse
      if (!response || typeof response.success !== 'boolean') {
        throw new Error('Réponse invalide du serveur');
      }
      
      if (!response.success) {
        throw new Error(response.message || 'Échec de la mise à jour des favoris');
      }
      
      // Mise à jour finale avec confirmation du serveur
      const finalRoutes = [...routes];
      const finalRouteIndex = finalRoutes.findIndex(route => route.id === routeId);
      
      if (finalRouteIndex !== -1) {
        finalRoutes[finalRouteIndex] = {
          ...finalRoutes[finalRouteIndex],
          userFavorited: newFavoriteStatus,
          favorites: response.favoriteCount || finalRoutes[finalRouteIndex].favorites,
          favoriteLoading: false
        };
        
        setRoutes(finalRoutes);
      }
      
      // Si c'est maintenant un favori, récupérer les alertes météo
      if (newFavoriteStatus) {
        fetchWeatherAlertsForFavorites()
          .catch(weatherError => {
            console.error('Erreur lors de la récupération des alertes météo:', weatherError);
          });
      }
      
      setAlert({
        open: true,
        message: newFavoriteStatus 
          ? 'Itinéraire ajouté aux favoris' 
          : 'Itinéraire retiré des favoris',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      
      // Restaurer l'état précédent en cas d'erreur
      const originalRouteIndex = routes.findIndex(route => route.id === routeId);
      if (originalRouteIndex !== -1) {
        const originalRoute = routes[originalRouteIndex];
        const revertedRoutes = [...routes];
        
        revertedRoutes[originalRouteIndex] = {
          ...originalRoute,
          userFavorited: !originalRoute.userFavorited,
          favorites: Math.max(0, originalRoute.favorites + (originalRoute.userFavorited ? -1 : 1)),
          favoriteLoading: false
        };
        
        setRoutes(revertedRoutes);
      }
      
      setAlert({
        open: true,
        message: `Erreur lors de la mise à jour des favoris: ${error.message || 'Veuillez réessayer'}`,
        severity: 'error'
      });
    }
  };
  
  // Open route details dialog
  const handleViewRoute = (route) => {
    setSelectedRoute(route);
    setShowRouteDialog(true);
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setFilterOptions({
      distance: 'all',
      elevation: 'all',
      difficulty: 'all',
      region: 'all',
      surface: 'all'
    });
    setSearchTerm('');
  };
  
  // Handle strava activity shared
  const handleStravaActivityShared = async (activityData) => {
    try {
      setLoading(true);
      
      // Call API to convert Strava activity to a route
      const newRoute = await StravaService.convertActivityToRoute(activityData);
      
      // Update local state with the new route
      setRoutes(prevRoutes => [...prevRoutes, newRoute]);
      setUserRoutes(prevUserRoutes => [...prevUserRoutes, newRoute]);
      
      setAlert({
        open: true,
        message: `${activityData.name} a été partagé avec succès !`,
        severity: 'success'
      });
      setLoading(false);
    } catch (error) {
      console.error('Error sharing Strava activity:', error);
      setAlert({
        open: true,
        message: 'Erreur lors du partage de l\'activité Strava. Veuillez réessayer.',
        severity: 'error'
      });
      setLoading(false);
    }
  };
  
  // Fermer alert
  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };
  
  // Gérer le téléchargement de fichier GPX
  const handleGpxProcessing = async (file) => {
    if (!file) {
      setAlert({
        open: true,
        message: 'Aucun fichier sélectionné',
        severity: 'error'
      });
      return;
    }
    
    // Vérifier le type de fichier
    if (file.type !== 'application/gpx+xml' && !file.name.toLowerCase().endsWith('.gpx')) {
      setAlert({
        open: true,
        message: 'Format de fichier non valide. Veuillez importer un fichier GPX.',
        severity: 'error'
      });
      return;
    }
    
    setProcessingGpx(true);
    
    try {
      // Utiliser FileReader pour lire le contenu du fichier
      const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Erreur lors de la lecture du fichier'));
        
        reader.readAsText(file);
      });
      
      if (!fileContent) {
        throw new Error('Contenu du fichier vide ou invalide');
      }
      
      // Parser le XML du GPX
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(fileContent, 'text/xml');
      
      // Vérifier si le XML est valide
      const parseError = xmlDoc.getElementsByTagName('parsererror');
      if (parseError.length > 0) {
        throw new Error('Erreur lors du parsing du fichier GPX: format XML invalide');
      }
      
      // Récupérer les points du tracé
      const trackPoints = xmlDoc.getElementsByTagName('trkpt');
      if (!trackPoints || trackPoints.length === 0) {
        throw new Error('Aucun point de tracé trouvé dans le fichier GPX');
      }
      
      // Extraire les données des points
      const points = [];
      for (let i = 0; i < trackPoints.length; i++) {
        const point = trackPoints[i];
        const lat = parseFloat(point.getAttribute('lat'));
        const lng = parseFloat(point.getAttribute('lon'));
        
        if (isNaN(lat) || isNaN(lng)) {
          console.warn(`Point avec coordonnées invalides ignoré: lat=${point.getAttribute('lat')}, lon=${point.getAttribute('lon')}`);
          continue;
        }
        
        const elevationElement = point.getElementsByTagName('ele')[0];
        const elevation = elevationElement 
          ? parseFloat(elevationElement.textContent) 
          : undefined;
        
        points.push({
          lat,
          lng,
          elevation: !isNaN(elevation) ? elevation : undefined
        });
      }
      
      if (points.length === 0) {
        throw new Error('Aucun point valide trouvé dans le fichier GPX');
      }
      
      // Mettre à jour l'état avec les données extraites
      setNewRouteData(prevData => ({
        ...prevData,
        points,
        // Extraire le nom du tracé si disponible
        name: prevData.name || extractTrackNameFromGpx(xmlDoc) || 'Nouvel itinéraire'
      }));
      
      setUploadedGpxFile(file);
      
      setAlert({
        open: true,
        message: `Fichier GPX importé avec succès (${points.length} points)`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error processing GPX file:', error);
      setAlert({
        open: true,
        message: `Erreur lors du traitement du fichier GPX: ${error.message}`,
        severity: 'error'
      });
      
      // Réinitialiser les données du nouveau tracé
      setNewRouteData(prevData => ({
        ...prevData,
        points: []
      }));
      
      setUploadedGpxFile(null);
    } finally {
      setProcessingGpx(false);
    }
  };
  
  // Extraire le nom du tracé depuis le fichier GPX
  const extractTrackNameFromGpx = (xmlDoc) => {
    try {
      // Essayer de récupérer le nom depuis différents emplacements possibles dans le fichier GPX
      const nameElements = [
        ...Array.from(xmlDoc.getElementsByTagName('name')),
        ...Array.from(xmlDoc.getElementsByTagName('trk')).map(trk => trk.getElementsByTagName('name')[0])
      ].filter(Boolean);
      
      if (nameElements.length > 0 && nameElements[0].textContent) {
        return nameElements[0].textContent.trim();
      }
      
      return null;
    } catch (error) {
      console.warn('Erreur lors de l\'extraction du nom du tracé:', error);
      return null;
    }
  };
  
  // Créer un nouvel itinéraire
  const handleCreateRoute = async () => {
    if (!userId) {
      setAlert({
        open: true,
        message: 'Vous devez être connecté pour créer un itinéraire',
        severity: 'warning'
      });
      return;
    }
    
    if (!newRouteData.name.trim()) {
      setAlert({
        open: true,
        message: 'Veuillez ajouter un nom à votre itinéraire',
        severity: 'warning'
      });
      return;
    }
    
    if (newRouteData.points.length === 0) {
      setAlert({
        open: true,
        message: 'Aucune donnée de trajet. Veuillez importer un fichier GPX ou ajouter des points.',
        severity: 'warning'
      });
      return;
    }
    
    try {
      // Préparer les données de l'itinéraire
      const routeData = {
        ...newRouteData,
        user_id: userId,
        created_at: new Date().toISOString(),
        favorites: 0,
        userFavorited: false
      };
      
      // Ajouter des propriétés calculées si elles ne sont pas déjà présentes
      if (!routeData.distance && routeData.points.length > 1) {
        routeData.distance = Math.round(calculateRouteDistance(routeData.points) * 10) / 10;
      }
      
      if (!routeData.elevationGain && routeData.points.length > 1) {
        routeData.elevationGain = calculateElevationGain(routeData.points);
      }
      
      // Appel API
      const createdRoute = await RouteService.createRoute(routeData);
      
      if (!createdRoute || !createdRoute.id) {
        throw new Error('Réponse invalide du serveur lors de la création de l\'itinéraire');
      }
      
      // Mise à jour de l'état
      setRoutes(prevRoutes => [createdRoute, ...prevRoutes]);
      setUserRoutes(prevUserRoutes => [createdRoute, ...prevUserRoutes]);
      
      // Réinitialiser le formulaire
      setNewRouteData({
        name: '',
        description: '',
        region: 'Alsace',
        difficulty: 'Modéré',
        surface: 'Asphalte',
        points_of_interest: [],
        points: []
      });
      setUploadedGpxFile(null);
      
      // Fermer la boîte de dialogue
      setCreateRouteDialog(false);
      
      // Afficher une notification
      setAlert({
        open: true,
        message: 'Itinéraire créé avec succès !',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error creating route:', error);
      setAlert({
        open: true,
        message: `Erreur lors de la création de l'itinéraire: ${error.message || 'Veuillez réessayer'}`,
        severity: 'error'
      });
    }
  };
  
  // Fonction utilitaire pour calculer la distance d'un itinéraire
  const calculateRouteDistance = (points) => {
    try {
      let totalDistance = 0;
      
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        
        if (!p1 || !p2 || !p1.lat || !p1.lng || !p2.lat || !p2.lng) {
          continue; // Ignorer les points invalides
        }
        
        // Calcul de la distance entre deux points GPS en utilisant la formule haversine
        const R = 6371; // Rayon de la Terre en km
        const dLat = (p2.lat - p1.lat) * Math.PI / 180;
        const dLon = (p2.lng - p1.lng) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        totalDistance += distance;
      }
      
      return totalDistance;
    } catch (error) {
      console.error('Erreur lors du calcul de la distance:', error);
      return 0;
    }
  };
  
  // Fonction utilitaire pour calculer le dénivelé
  const calculateElevationGain = (points) => {
    try {
      let gain = 0;
      
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        
        if (!p1 || !p2 || p1.elevation === undefined || p2.elevation === undefined) {
          continue; // Ignorer les points sans données d'élévation
        }
        
        const diff = p2.elevation - p1.elevation;
        if (diff > 0) {
          gain += diff;
        }
      }
      
      return Math.round(gain);
    } catch (error) {
      console.error('Erreur lors du calcul du dénivelé:', error);
      return 0;
    }
  };
  
  // Ajouter un point d'intérêt
  const handleAddPointOfInterest = () => {
    if (!newPointOfInterest.trim()) return;
    
    setNewRouteData({
      ...newRouteData,
      points_of_interest: [...newRouteData.points_of_interest, newPointOfInterest.trim()]
    });
    
    setNewPointOfInterest('');
  };
  
  // Supprimer un point d'intérêt
  const handleRemovePointOfInterest = (index) => {
    const updatedPOIs = [...newRouteData.points_of_interest];
    updatedPOIs.splice(index, 1);
    
    setNewRouteData({
      ...newRouteData,
      points_of_interest: updatedPOIs
    });
  };
  
  // Exporter un itinéraire au format GPX
  const handleExportGpx = async (route) => {
    try {
      const gpxContent = await RouteService.generateGpxFromRoute(route);
      
      // Créer un élément <a> pour télécharger le fichier
      const element = document.createElement('a');
      const file = new Blob([gpxContent], {type: 'application/gpx+xml'});
      element.href = URL.createObjectURL(file);
      element.download = `${route.name.replace(/\s+/g, '_')}.gpx`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      setAlert({
        open: true,
        message: 'Export GPX réussi',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting GPX:', error);
      setAlert({
        open: true,
        message: 'Erreur lors de l\'export GPX',
        severity: 'error'
      });
    }
  };
  
  // Récupérer les données météo pour un itinéraire
  const fetchRouteWeather = async (route) => {
    if (!route || !route.mapCenter) return;
    
    try {
      setWeatherLoading(true);
      const weatherData = await WeatherService.getWeatherForLocation(
        route.mapCenter[0],
        route.mapCenter[1]
      );
      
      setRouteWeather(weatherData);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setWeatherLoading(false);
    }
  };
  
  // Récupérer les alertes météo pour tous les itinéraires favoris
  const fetchWeatherAlertsForFavorites = async () => {
    if (!userId) {
      console.warn('Impossible de récupérer les alertes météo : utilisateur non connecté');
      return;
    }
    
    // Filtrer les itinéraires favoris
    const favoriteRoutes = routes.filter(route => route.userFavorited);
    
    if (favoriteRoutes.length === 0) {
      // Pas d'itinéraires favoris à vérifier
      setWeatherAlerts([]);
      return;
    }
    
    try {
      // Récupérer les alertes pour chaque itinéraire favori
      const alertPromises = favoriteRoutes.map(async (route) => {
        if (!route.id || !route.location) {
          return null; // Ignorer les itinéraires sans ID ou localisation
        }
        
        try {
          const weatherData = await WeatherService.getRouteWeatherAlerts(route.id);
          
          if (!weatherData || !Array.isArray(weatherData.alerts)) {
            console.warn(`Données météo invalides pour l'itinéraire ${route.id}`);
            return null;
          }
          
          return weatherData.alerts.map(alert => ({
            ...alert,
            routeId: route.id,
            routeName: route.name
          }));
        } catch (routeError) {
          console.warn(`Erreur lors de la récupération des alertes pour l'itinéraire ${route.id}:`, routeError);
          return null;
        }
      });
      
      // Attendre toutes les requêtes et filtrer les réponses nulles
      const alertResults = await Promise.all(alertPromises);
      const validAlerts = alertResults
        .filter(Boolean)
        .flat()
        .filter(alert => alert && alert.type && alert.description);
      
      // Mettre à jour l'état avec les alertes récupérées
      setWeatherAlerts(validAlerts);
      
      // Notifier l'utilisateur si des alertes sont présentes
      if (validAlerts.length > 0) {
        setAlert({
          open: true,
          message: `${validAlerts.length} alerte(s) météo pour vos itinéraires favoris`,
          severity: 'warning'
        });
      }
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
      // Ne pas afficher d'erreur à l'utilisateur, car cette fonctionnalité est secondaire
      setWeatherAlerts([]);
    }
  };
  
  // Charger les alertes météo lors de l'initialisation
  useEffect(() => {
    if (!loading && routes.length > 0 && userId) {
      fetchWeatherAlertsForFavorites();
    }
  }, [loading, routes, userId]);

  if (loading && activeTab !== 2) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Chargement des itinéraires...
        </Typography>
      </Box>
    );
  }
  
  return (
    <div className="route-sharing-container">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Partage d'itinéraires
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Découvrez et partagez vos itinéraires cyclistes préférés dans la région Grand Est
        </Typography>
      </Box>
      
      {/* Tabs for All Routes / My Routes */}
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Tous les itinéraires" />
          <Tab label="Mes itinéraires" />
          <Tab label="Favoris" />
        </Tabs>
      </Box>
      
      {/* Search and Filter Bar */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          variant="outlined"
          placeholder="Rechercher un itinéraire..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, minWidth: '200px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        
        <Button 
          variant="outlined" 
          startIcon={<FilterList />}
          onClick={() => setShowFilters(!showFilters)}
        >
          Filtres
        </Button>
        
        <StravaIntegration onActivityShared={handleStravaActivityShared} />
      </Box>
      
      {/* Filter options */}
      {showFilters && (
        <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Distance</InputLabel>
                <Select
                  value={filterOptions.distance}
                  label="Distance"
                  onChange={(e) => setFilterOptions({...filterOptions, distance: e.target.value})}
                >
                  <MenuItem value="all">Toutes distances</MenuItem>
                  <MenuItem value="0-30">0 - 30 km</MenuItem>
                  <MenuItem value="30-60">30 - 60 km</MenuItem>
                  <MenuItem value="60-100">60 - 100 km</MenuItem>
                  <MenuItem value="100-999">Plus de 100 km</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Dénivelé</InputLabel>
                <Select
                  value={filterOptions.elevation}
                  label="Dénivelé"
                  onChange={(e) => setFilterOptions({...filterOptions, elevation: e.target.value})}
                >
                  <MenuItem value="all">Tous dénivelés</MenuItem>
                  <MenuItem value="0-300">0 - 300 m</MenuItem>
                  <MenuItem value="300-700">300 - 700 m</MenuItem>
                  <MenuItem value="700-1200">700 - 1200 m</MenuItem>
                  <MenuItem value="1200-9999">Plus de 1200 m</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Difficulté</InputLabel>
                <Select
                  value={filterOptions.difficulty}
                  label="Difficulté"
                  onChange={(e) => setFilterOptions({...filterOptions, difficulty: e.target.value})}
                >
                  <MenuItem value="all">Toutes difficultés</MenuItem>
                  <MenuItem value="Facile">Facile</MenuItem>
                  <MenuItem value="Modéré">Modéré</MenuItem>
                  <MenuItem value="Difficile">Difficile</MenuItem>
                  <MenuItem value="Très difficile">Très difficile</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Région</InputLabel>
                <Select
                  value={filterOptions.region}
                  label="Région"
                  onChange={(e) => setFilterOptions({...filterOptions, region: e.target.value})}
                >
                  <MenuItem value="all">Toutes régions</MenuItem>
                  <MenuItem value="Alsace">Alsace</MenuItem>
                  <MenuItem value="Lorraine">Lorraine</MenuItem>
                  <MenuItem value="Champagne-Ardenne">Champagne-Ardenne</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Surface</InputLabel>
                <Select
                  value={filterOptions.surface}
                  label="Surface"
                  onChange={(e) => setFilterOptions({...filterOptions, surface: e.target.value})}
                >
                  <MenuItem value="all">Toutes surfaces</MenuItem>
                  <MenuItem value="Asphalte">Asphalte</MenuItem>
                  <MenuItem value="Piste cyclable">Piste cyclable</MenuItem>
                  <MenuItem value="Chemin">Chemin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={handleResetFilters} sx={{ mr: 1 }}>
                  Réinitialiser
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}
      
      {/* Weather Alerts Banner */}
      {weatherAlerts.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setWeatherAlerts([])}
            >
              <Close fontSize="inherit" />
            </IconButton>
          }
        >
          <AlertTitle>Alertes météo sur vos itinéraires</AlertTitle>
          {weatherAlerts.map((alert, index) => (
            <Box key={index} sx={{ mb: index < weatherAlerts.length - 1 ? 1 : 0 }}>
              <Typography variant="body2" gutterBottom>
                <strong>{alert.routeName}</strong>: {alert.description}
              </Typography>
            </Box>
          ))}
        </Alert>
      )}
      
      {/* Routes Display */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {/* Routes Grid */}
          <Grid container spacing={3}>
            {(activeTab === 0 ? filteredRoutes : 
              activeTab === 1 ? userRoutes : 
              routes.filter(route => route.userFavorited)
            ).map((route) => (
              <Grid item xs={12} sm={6} md={4} key={route.id}>
                <RouteCard 
                  route={route} 
                  onToggleFavorite={handleToggleFavorite}
                  onViewRoute={handleViewRoute}
                  isOwner={route.createdBy.id === userId}
                />
              </Grid>
            ))}
          </Grid>
          
          {/* Empty state */}
          {(activeTab === 0 && filteredRoutes.length === 0) ||
           (activeTab === 1 && userRoutes.length === 0) ||
           (activeTab === 2 && routes.filter(route => route.userFavorited).length === 0) ? (
            <Box sx={{ textAlign: 'center', my: 4 }}>
              <Typography variant="h6" color="text.secondary">
                {activeTab === 0 ? 'Aucun itinéraire trouvé avec ces critères.' :
                 activeTab === 1 ? 'Vous n\'avez pas encore créé d\'itinéraires.' :
                 'Vous n\'avez pas encore de favoris.'}
              </Typography>
              {activeTab === 1 && (
                <Button 
                  variant="contained" 
                  startIcon={<Add />} 
                  sx={{ mt: 2 }}
                  onClick={() => setCreateRouteDialog(true)}
                >
                  Créer un itinéraire
                </Button>
              )}
              {activeTab === 2 && (
                <Button 
                  variant="contained" 
                  sx={{ mt: 2 }}
                  onClick={() => setActiveTab(0)}
                >
                  Explorer les itinéraires
                </Button>
              )}
            </Box>
          ) : null}
        </Box>
      )}
      
      {/* Route Detail Dialog */}
      <Dialog 
        open={showRouteDialog} 
        onClose={() => setShowRouteDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedRoute && (
          <>
            <DialogTitle>
              {selectedRoute.name}
              <Typography variant="subtitle1" color="text.secondary">
                {selectedRoute.location}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2, height: '300px', width: '100%' }}>
                <MapContainer 
                  center={selectedRoute.mapCenter} 
                  zoom={12} 
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Polyline 
                    positions={selectedRoute.points.map(p => [p.lat, p.lng])}
                    color="blue"
                  />
                  {selectedRoute.points_of_interest?.map((poi, index) => (
                    <Marker 
                      key={index} 
                      position={selectedRoute.points[Math.min(index, selectedRoute.points.length - 1)]}
                    >
                      <Popup>{poi}</Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </Box>
              
              {/* Profil d'élévation */}
              <Box sx={{ mt: 3, mb: 2, height: '200px', width: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Profil d'élévation
                </Typography>
                {selectedRoute?.elevation_profile ? (
                  <Line
                    data={{
                      labels: selectedRoute.elevation_profile.map((point, index) => 
                        `${(index / selectedRoute.elevation_profile.length * selectedRoute.distance).toFixed(1)} km`
                      ),
                      datasets: [
                        {
                          label: 'Altitude (m)',
                          data: selectedRoute.elevation_profile.map(point => point.elevation),
                          fill: true,
                          backgroundColor: 'rgba(75, 192, 192, 0.2)',
                          borderColor: 'rgba(75, 192, 192, 1)',
                          tension: 0.4,
                          pointRadius: 0,
                          pointHoverRadius: 4
                        }
                      ]
                    }}
                    options={{
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          title: {
                            display: true,
                            text: 'Altitude (m)'
                          }
                        },
                        x: {
                          title: {
                            display: true,
                            text: 'Distance (km)'
                          },
                          ticks: {
                            maxTicksLimit: 10
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                    <Typography color="text.secondary">
                      Profil d'élévation non disponible
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2">Distance</Typography>
                  <Typography variant="body1">{selectedRoute.distance} km</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2">Dénivelé</Typography>
                  <Typography variant="body1">{selectedRoute.elevationGain} m</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2">Difficulté</Typography>
                  <Typography variant="body1">{selectedRoute.difficulty}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="subtitle2">Surface</Typography>
                  <Typography variant="body1">{selectedRoute.surface}</Typography>
                </Grid>
              </Grid>
              
              <Typography variant="subtitle2">Description</Typography>
              <Typography variant="body1" paragraph>{selectedRoute.description}</Typography>
              
              <Typography variant="subtitle2">Points d'intérêt</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {selectedRoute.points_of_interest?.map((poi, index) => (
                  <Chip key={index} label={poi} size="small" />
                ))}
              </Box>
              
              <Typography variant="subtitle2">Créé par</Typography>
              <Typography variant="body1">{selectedRoute.createdBy.name}</Typography>
              
              {/* Météo */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Conditions météo actuelles
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<Refresh />}
                  onClick={() => fetchRouteWeather(selectedRoute)}
                  disabled={weatherLoading}
                  sx={{ mb: 2 }}
                >
                  {weatherLoading ? 'Chargement...' : 'Actualiser la météo'}
                </Button>
                
                {weatherLoading ? (
                  <Box display="flex" alignItems="center">
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography variant="body2">Chargement des données météo...</Typography>
                  </Box>
                ) : routeWeather ? (
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Paper elevation={0} variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">{routeWeather.temperature}°C</Typography>
                        <Typography variant="body2">Température</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper elevation={0} variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">{routeWeather.wind_speed} km/h</Typography>
                        <Typography variant="body2">Vent</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper elevation={0} variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">{routeWeather.precipitation_probability}%</Typography>
                        <Typography variant="body2">Risque de précipitation</Typography>
                      </Paper>
                    </Grid>
                    
                    {routeWeather.alerts && routeWeather.alerts.length > 0 && (
                      <Grid item xs={12}>
                        <Alert severity="warning" sx={{ mt: 1 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Alertes météo:
                          </Typography>
                          {routeWeather.alerts.map((alert, index) => (
                            <Typography key={index} variant="body2">
                              • {alert.description}
                            </Typography>
                          ))}
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Cliquez sur "Actualiser la météo" pour voir les conditions actuelles.
                  </Typography>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => handleToggleFavorite(selectedRoute.id)}
                startIcon={selectedRoute.userFavorited ? <Favorite color="error" /> : <FavoriteBorder />}
              >
                {selectedRoute.userFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              </Button>
              <Button 
                onClick={() => handleExportGpx(selectedRoute)}
                startIcon={<FileDownload />}
              >
                Exporter GPX
              </Button>
              <Button 
                onClick={() => setShowRouteDialog(false)}
              >
                Fermer
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Create Route Dialog */}
      <Dialog 
        open={createRouteDialog} 
        onClose={() => setCreateRouteDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Créer un itinéraire
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                label="Nom de l'itinéraire"
                value={newRouteData.name}
                onChange={(e) => setNewRouteData({...newRouteData, name: e.target.value})}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                label="Description de l'itinéraire"
                value={newRouteData.description}
                onChange={(e) => setNewRouteData({...newRouteData, description: e.target.value})}
                fullWidth
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Région</InputLabel>
                <Select
                  value={newRouteData.region}
                  label="Région"
                  onChange={(e) => setNewRouteData({...newRouteData, region: e.target.value})}
                >
                  <MenuItem value="Alsace">Alsace</MenuItem>
                  <MenuItem value="Lorraine">Lorraine</MenuItem>
                  <MenuItem value="Champagne-Ardenne">Champagne-Ardenne</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Difficulté</InputLabel>
                <Select
                  value={newRouteData.difficulty}
                  label="Difficulté"
                  onChange={(e) => setNewRouteData({...newRouteData, difficulty: e.target.value})}
                >
                  <MenuItem value="Facile">Facile</MenuItem>
                  <MenuItem value="Modéré">Modéré</MenuItem>
                  <MenuItem value="Difficile">Difficile</MenuItem>
                  <MenuItem value="Très difficile">Très difficile</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Surface</InputLabel>
                <Select
                  value={newRouteData.surface}
                  label="Surface"
                  onChange={(e) => setNewRouteData({...newRouteData, surface: e.target.value})}
                >
                  <MenuItem value="Asphalte">Asphalte</MenuItem>
                  <MenuItem value="Piste cyclable">Piste cyclable</MenuItem>
                  <MenuItem value="Chemin">Chemin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FileUploader 
                onFileUpload={(file) => {
                  setUploadedGpxFile(file);
                  handleGpxProcessing(file);
                }}
                acceptedFileTypes={['.gpx', 'application/gpx+xml']}
                buttonText={processingGpx ? "Traitement en cours..." : "Importer un fichier GPX"}
                loading={processingGpx}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Points d'intérêt
              </Typography>
              <Box display="flex" alignItems="center" mb={1}>
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Ajouter un point d'intérêt"
                  value={newPointOfInterest}
                  onChange={(e) => setNewPointOfInterest(e.target.value)}
                  fullWidth
                  sx={{ mr: 1 }}
                />
                <Button 
                  variant="contained" 
                  onClick={handleAddPointOfInterest}
                  disabled={!newPointOfInterest.trim()}
                >
                  Ajouter
                </Button>
              </Box>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {newRouteData.points_of_interest.map((poi, index) => (
                  <Chip 
                    key={index} 
                    label={poi} 
                    onDelete={() => handleRemovePointOfInterest(index)}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCreateRouteDialog(false)}
          >
            Annuler
          </Button>
          <Button 
            variant="contained"
            onClick={handleCreateRoute}
            disabled={processingGpx || !newRouteData.name.trim() || newRouteData.points.length === 0}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notifications */}
      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

// Route card component
const RouteCard = ({ route, onToggleFavorite, onViewRoute, isOwner }) => {
  return (
    <Card className="route-card">
      <Box 
        className="route-card-image" 
        sx={{ 
          height: 160, 
          backgroundImage: `url(${route.previewImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative'
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8, 
            bgcolor: 'rgba(255,255,255,0.8)',
            borderRadius: '50%',
            p: 0.5
          }}
        >
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(route.id);
            }}
            sx={{ minWidth: 'auto', p: 0.5 }}
          >
            {route.userFavorited ? 
              <Favorite color="error" /> : 
              <FavoriteBorder />
            }
          </Button>
        </Box>
        
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            bgcolor: 'rgba(0,0,0,0.6)',
            color: 'white',
            p: 1
          }}
        >
          <Typography variant="subtitle1" noWrap>
            {route.name}
          </Typography>
          <Typography variant="body2" noWrap>
            {route.location}
          </Typography>
        </Box>
      </Box>
      
      <CardContent>
        <Box display="flex" justifyContent="space-between" mb={1}>
          <Typography variant="body2">
            {route.distance} km
          </Typography>
          <Typography variant="body2">
            {route.elevationGain} m D+
          </Typography>
          <Chip 
            label={route.difficulty} 
            color={getDifficultyColor(route.difficulty)}
            size="small"
          />
        </Box>
        
        <Typography variant="body2" color="textSecondary" noWrap>
          {route.description.substring(0, 60)}...
        </Typography>
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Box display="flex" alignItems="center">
            <Favorite fontSize="small" color="action" />
            <Typography variant="body2" ml={0.5}>
              {route.favorites}
            </Typography>
          </Box>
          
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => onViewRoute(route)}
          >
            Détails
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

// Get color based on difficulty
const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'Facile':
      return 'success';
    case 'Modéré':
      return 'info';
    case 'Difficile':
      return 'warning';
    case 'Très difficile':
      return 'error';
    default:
      return 'default';
  }
};

export default RouteSharing;
