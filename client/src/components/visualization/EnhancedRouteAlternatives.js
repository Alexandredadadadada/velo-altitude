import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  Box, Typography, Paper, CircularProgress, Button, Alert, 
  Tabs, Tab, Slider, Switch, FormControlLabel, Chip, Divider,
  Grid, Card, CardContent, CardActions, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { 
  Map, Source, Layer, NavigationControl, GeolocateControl, 
  FullscreenControl, ScaleControl, Popup, Marker
} from 'react-map-gl';
import {
  WbSunny, Opacity, Air, Thermostat, Bolt, 
  Favorite, FavoriteBorder, Share, Download, 
  DirectionsBike, Terrain, Timer, Info, 
  CompareArrows, Save, Close, Add
} from '@mui/icons-material';
import 'mapbox-gl/dist/mapbox-gl.css';
import './RouteAlternatives.css';
import { useTranslation } from 'react-i18next';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { useNotification } from '../common/NotificationSystem';
import RouteService from '../../services/routeService';
import WeatherService from '../../services/weatherService';
import SocialService from '../../services/socialService';
import AuthService from '../../services/authService';

// Enregistrer les composants Chart.js
Chart.register(...registerables);

// Récupérer le token Mapbox depuis les variables d'environnement
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoiZ3JhbmRlc3RjeWNsaXNtZSIsImEiOiJjbGc2ZnZjZXIwMGRtM2VvYXB5eHUyOXZqIn0.7eL5k6rDlG_KBwE_XTjafQ';
const mapStyle = 'mapbox://styles/mapbox/outdoors-v11';

// Icônes pour les conditions météo
const weatherIcons = {
  rain: { icon: <Opacity />, color: '#3498db', text: 'Pluie' },
  wind: { icon: <Air />, color: '#7f8c8d', text: 'Vent' },
  cold: { icon: <Thermostat />, color: '#9b59b6', text: 'Froid' },
  heat: { icon: <Thermostat />, color: '#e74c3c', text: 'Chaleur' },
  storm: { icon: <Bolt />, color: '#f39c12', text: 'Orage' }
};

/**
 * Composant pour les conditions météo
 */
const WeatherConditions = ({ issues, t }) => {
  if (!issues || issues.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <WbSunny sx={{ mr: 2 }} />
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {t('favorableConditions')}
            </Typography>
            <Typography variant="body2">
              {t('noWeatherIssues')}
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', mr: 2 }}>
          {issues.map((issue, index) => (
            <Box 
              key={index} 
              sx={{ 
                mr: 1, 
                bgcolor: weatherIcons[issue.type]?.color,
                color: 'white',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {weatherIcons[issue.type]?.icon}
            </Box>
          ))}
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            {t('unfavorableConditions')}
          </Typography>
          <Box component="ul" sx={{ pl: 2, mt: 1, mb: 0 }}>
            {issues.map((issue, index) => (
              <Box 
                component="li" 
                key={index} 
                sx={{ 
                  color: issue.severity === 'high' ? 'error.main' : 
                         issue.severity === 'medium' ? 'warning.dark' : 'text.primary'
                }}
              >
                {issue.description}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

/**
 * Composant pour afficher les statistiques d'un itinéraire
 */
const RouteStats = ({ route, t }) => {
  if (!route) return null;
  
  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={6} sm={3}>
        <Paper sx={{ p: 1.5, textAlign: 'center' }}>
          <DirectionsBike sx={{ color: 'primary.main', mb: 1 }} />
          <Typography variant="body2" color="textSecondary">
            {t('distance')}
          </Typography>
          <Typography variant="h6">
            {route.distance.toFixed(1)} km
          </Typography>
        </Paper>
      </Grid>
      
      <Grid item xs={6} sm={3}>
        <Paper sx={{ p: 1.5, textAlign: 'center' }}>
          <Terrain sx={{ color: 'primary.main', mb: 1 }} />
          <Typography variant="body2" color="textSecondary">
            {t('elevation')}
          </Typography>
          <Typography variant="h6">
            {route.elevationGain} m
          </Typography>
        </Paper>
      </Grid>
      
      <Grid item xs={6} sm={3}>
        <Paper sx={{ p: 1.5, textAlign: 'center' }}>
          <Timer sx={{ color: 'primary.main', mb: 1 }} />
          <Typography variant="body2" color="textSecondary">
            {t('duration')}
          </Typography>
          <Typography variant="h6">
            {route.estimatedDuration} min
          </Typography>
        </Paper>
      </Grid>
      
      <Grid item xs={6} sm={3}>
        <Paper sx={{ p: 1.5, textAlign: 'center' }}>
          <Info sx={{ color: 'primary.main', mb: 1 }} />
          <Typography variant="body2" color="textSecondary">
            {t('difficulty')}
          </Typography>
          <Typography variant="h6">
            {route.difficulty}
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

/**
 * Composant pour afficher le profil d'élévation d'un itinéraire
 */
const ElevationProfile = ({ route, t }) => {
  if (!route || !route.elevationProfile) return null;
  
  const data = {
    labels: route.elevationProfile.map((_, index) => 
      `${(index * route.distance / route.elevationProfile.length).toFixed(1)} km`
    ),
    datasets: [
      {
        label: t('elevation'),
        data: route.elevationProfile,
        fill: true,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.4
      }
    ]
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${t('elevation')}: ${context.raw} m`;
          },
          title: function(context) {
            return context[0].label;
          }
        }
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: t('elevationMeters')
        }
      },
      x: {
        title: {
          display: true,
          text: t('distanceKm')
        },
        ticks: {
          maxTicksLimit: 10
        }
      }
    }
  };
  
  return (
    <Box sx={{ height: 200, mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        {t('elevationProfile')}
      </Typography>
      <Line data={data} options={options} />
    </Box>
  );
};

/**
 * Composant principal pour les itinéraires alternatifs
 */
const EnhancedRouteAlternatives = ({ routeId, userId }) => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const [alternatives, setAlternatives] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('weather');
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [viewState, setViewState] = useState({
    longitude: 2.3488,  // Centre de la France
    latitude: 46.8534,
    zoom: 6
  });
  const [popupInfo, setPopupInfo] = useState(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [favoriteRoutes, setFavoriteRoutes] = useState([]);
  const mapRef = useRef(null);

  // Conditions météo
  const [weatherConditions, setWeatherConditions] = useState({
    precipitation: 18,
    temperature: 28,
    windSpeed: 35,
    stormRisk: false
  });

  // Profil utilisateur
  const [userProfile, setUserProfile] = useState({
    level: 'intermediate', // beginner, intermediate, advanced, expert
    withChildren: false,
    preferences: ['cultural', 'landscape']
  });

  // Charger les favoris de l'utilisateur
  useEffect(() => {
    if (userId) {
      const loadFavorites = async () => {
        try {
          const userRoutes = await RouteService.getUserRoutes(userId);
          setFavoriteRoutes(userRoutes.map(route => route.id));
        } catch (error) {
          console.error('Erreur lors du chargement des favoris:', error);
        }
      };
      
      loadFavorites();
    }
  }, [userId]);

  // Charger les alternatives basées sur la météo
  useEffect(() => {
    setLoading(true);
    
    const fetchWeatherAlternatives = async () => {
      try {
        const response = await axios.get(`/api/route-alternatives/${routeId}/weather-alternatives`, {
          params: weatherConditions
        });
        
        if (response.data.status === 'success') {
          setAlternatives(prev => ({ ...prev, weather: response.data.data }));
        } else {
          console.error('Erreur dans la réponse:', response.data);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des alternatives météo:', err);
        setError(`Erreur lors de la récupération des alternatives: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeatherAlternatives();
  }, [routeId, weatherConditions]);

  // Charger les variantes basées sur le profil
  useEffect(() => {
    setLoading(true);
    
    const fetchProfileVariants = async () => {
      try {
        const response = await axios.post(`/api/route-alternatives/${routeId}/profile-variants`, userProfile);
        
        if (response.data.status === 'success') {
          setAlternatives(prev => ({ ...prev, profile: response.data.data }));
        } else {
          console.error('Erreur dans la réponse:', response.data);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des variantes de profil:', err);
        setError(`Erreur lors de la récupération des variantes: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileVariants();
  }, [routeId, userProfile]);

  // Fonction pour mettre à jour les conditions météo
  const updateWeatherCondition = (condition, value) => {
    setWeatherConditions(prev => ({ ...prev, [condition]: value }));
  };

  // Fonction pour mettre à jour le profil utilisateur
  const updateUserProfile = (field, value) => {
    setUserProfile(prev => {
      if (field === 'preferences') {
        // Si la préférence existe déjà, la retirer, sinon l'ajouter
        const updatedPreferences = prev.preferences.includes(value)
          ? prev.preferences.filter(pref => pref !== value)
          : [...prev.preferences, value];
        
        return { ...prev, preferences: updatedPreferences };
      }
      return { ...prev, [field]: value };
    });
  };

  // Sélectionner le bon tableau de routes à afficher selon l'onglet actif
  const getRoutesToDisplay = () => {
    if (!alternatives) return [];
    
    if (activeTab === 'weather') {
      return [
        alternatives.weather?.originalRoute,
        ...(alternatives.weather?.alternatives || [])
      ].filter(Boolean);
    }
    
    if (activeTab === 'profile') {
      return [
        alternatives.profile?.originalRoute,
        ...(alternatives.profile?.variants || [])
      ].filter(Boolean);
    }
    
    return [];
  };

  const routes = getRoutesToDisplay();
  const selectedRoute = routes[selectedRouteIndex] || null;

  // Centrer la carte sur l'itinéraire sélectionné
  useEffect(() => {
    if (selectedRoute && selectedRoute.boundingBox) {
      setViewState({
        longitude: (selectedRoute.boundingBox[0] + selectedRoute.boundingBox[2]) / 2,
        latitude: (selectedRoute.boundingBox[1] + selectedRoute.boundingBox[3]) / 2,
        zoom: 10
      });
      
      // Ajuster la vue pour afficher tout l'itinéraire
      if (mapRef.current) {
        const map = mapRef.current.getMap();
        map.fitBounds([
          [selectedRoute.boundingBox[0], selectedRoute.boundingBox[1]],
          [selectedRoute.boundingBox[2], selectedRoute.boundingBox[3]]
        ], { padding: 40 });
      }
    }
  }, [selectedRouteIndex, selectedRoute]);

  // Gérer le clic sur un point de l'itinéraire
  const handleMapClick = useCallback(event => {
    if (!selectedRoute || !selectedRoute.points) return;
    
    const { lng, lat } = event.lngLat;
    
    // Trouver le point le plus proche sur l'itinéraire
    let closestPoint = null;
    let minDistance = Infinity;
    
    selectedRoute.points.forEach(point => {
      const distance = Math.sqrt(
        Math.pow(point.longitude - lng, 2) + 
        Math.pow(point.latitude - lat, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });
    
    // Si le point est suffisamment proche, afficher le popup
    if (minDistance < 0.01) {
      setPopupInfo({
        longitude: closestPoint.longitude,
        latitude: closestPoint.latitude,
        elevation: closestPoint.elevation,
        distance: closestPoint.distance
      });
    } else {
      setPopupInfo(null);
    }
  }, [selectedRoute]);

  // Gérer l'ajout aux favoris
  const handleToggleFavorite = async (route) => {
    if (!userId) {
      notify.warning(t('loginRequired'), { title: t('warning') });
      return;
    }
    
    try {
      if (favoriteRoutes.includes(route.id)) {
        await RouteService.removeFavorite(userId, route.id);
        setFavoriteRoutes(prev => prev.filter(id => id !== route.id));
        notify.success(t('removedFromFavorites'), { title: t('success') });
      } else {
        await RouteService.addFavorite(userId, route.id);
        setFavoriteRoutes(prev => [...prev, route.id]);
        notify.success(t('addedToFavorites'), { title: t('success') });
      }
    } catch (error) {
      console.error('Erreur lors de la gestion des favoris:', error);
      notify.error(t('favoriteError'), { title: t('error') });
    }
  };

  // Gérer le partage d'itinéraire
  const handleShareRoute = (route) => {
    if (navigator.share) {
      navigator.share({
        title: route.name,
        text: route.description,
        url: `${window.location.origin}/routes/${route.id}`
      })
        .then(() => notify.success(t('routeShared'), { title: t('success') }))
        .catch(error => console.error('Erreur lors du partage:', error));
    } else {
      // Copier le lien dans le presse-papier
      const url = `${window.location.origin}/routes/${route.id}`;
      navigator.clipboard.writeText(url)
        .then(() => notify.success(t('linkCopied'), { title: t('success') }))
        .catch(error => console.error('Erreur lors de la copie:', error));
    }
  };

  // Gérer le téléchargement GPX
  const handleDownloadGpx = (route) => {
    // Créer le contenu GPX
    const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Grand Est Cyclisme" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${route.name}</name>
    <desc>${route.description}</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${route.name}</name>
    <trkseg>
      ${route.points.map(point => `
      <trkpt lat="${point.latitud
(Content truncated due to size limit. Use line ranges to read in chunks)