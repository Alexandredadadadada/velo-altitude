/**
 * MapRouteSelector.js
 * Composant pour sélectionner un itinéraire sur une carte interactive
 * Utilise l'intégration Mapbox existante
 */
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Divider,
  Button,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  DirectionsBike,
  TrendingUp,
  Place,
  Check as CheckIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material';

import 'mapbox-gl/dist/mapbox-gl.css';
import mapboxgl from 'mapbox-gl';
import RouteService from '../../../services/routeService';
import { brandConfig } from '../../../config/branding';

// Configurer l'API Mapbox
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN';

/**
 * Composant pour sélectionner un itinéraire sur une carte
 */
const MapRouteSelector = ({ onSelectRoute, selectedRouteId }) => {
  const { t } = useTranslation();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [routes, setRoutes] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [favoriteRoutes, setFavoriteRoutes] = useState([]);
  const [activeFilters, setActiveFilters] = useState({
    region: [],
    difficulty: [],
    distance: { min: 0, max: 200 }
  });

  const routeColors = {
    highlighted: '#FF4500', // Orange vif pour l'itinéraire survolé/sélectionné
    selected: '#FF0000', // Rouge pour l'itinéraire sélectionné
    regular: '#3388FF' // Bleu pour les autres itinéraires
  };

  // Charger les itinéraires au montage du composant
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        const response = await RouteService.getAllRoutes();
        setRoutes(response);
        setFilteredRoutes(response);
        
        // Initialiser la sélection si un ID est fourni
        if (selectedRouteId) {
          const selected = response.find(r => r.id === selectedRouteId);
          if (selected) {
            setSelectedRoute(selected);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des itinéraires:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
    
    // Récupérer les itinéraires favoris depuis le localStorage
    const storedFavorites = localStorage.getItem('favoriteRoutes');
    if (storedFavorites) {
      try {
        setFavoriteRoutes(JSON.parse(storedFavorites));
      } catch (e) {
        console.error('Erreur lors de la récupération des favoris:', e);
      }
    }
  }, [selectedRouteId]);

  // Initialiser la carte après chargement des itinéraires
  useEffect(() => {
    if (!mapLoaded && !loading && routes.length > 0 && mapContainer.current) {
      initializeMap();
    }
  }, [loading, routes, mapLoaded]);

  // Mettre à jour les itinéraires affichés sur la carte quand les filtres changent
  useEffect(() => {
    if (map.current && mapLoaded) {
      updateRoutesOnMap();
    }
  }, [filteredRoutes, selectedRoute, mapLoaded]);

  // Filtrer les itinéraires lors de la recherche
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredRoutes(routes);
      return;
    }
    
    const searchLower = search.toLowerCase();
    const filtered = routes.filter(route => 
      route.name.toLowerCase().includes(searchLower) ||
      route.region.toLowerCase().includes(searchLower) ||
      route.difficulty.toLowerCase().includes(searchLower)
    );
    
    setFilteredRoutes(filtered);
  }, [search, routes]);

  // Initialiser la carte Mapbox
  const initializeMap = () => {
    if (map.current) return; // Éviter de réinitialiser la carte
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v11',
      center: [7.752111, 48.573405], // Centre sur Strasbourg par défaut
      zoom: 9
    });
    
    map.current.on('load', () => {
      setMapLoaded(true);
      updateRoutesOnMap();
      
      // Si un itinéraire est déjà sélectionné, zoomer dessus
      if (selectedRoute && selectedRoute.coordinates) {
        zoomToRoute(selectedRoute);
      }
    });
  };

  // Mettre à jour les itinéraires affichés sur la carte
  const updateRoutesOnMap = () => {
    if (!map.current || !mapLoaded) return;
    
    // Supprimer les sources et couches existantes
    filteredRoutes.forEach(route => {
      const sourceId = `route-source-${route.id}`;
      if (map.current.getSource(sourceId)) {
        const layerId = `route-layer-${route.id}`;
        if (map.current.getLayer(layerId)) {
          map.current.removeLayer(layerId);
        }
        map.current.removeSource(sourceId);
      }
    });
    
    // Ajouter les itinéraires filtrés à la carte
    filteredRoutes.forEach(route => {
      if (!route.coordinates || !Array.isArray(route.coordinates) || route.coordinates.length < 2) {
        return;
      }
      
      const sourceId = `route-source-${route.id}`;
      const layerId = `route-layer-${route.id}`;
      
      // Déterminer la couleur de l'itinéraire
      let routeColor = routeColors.regular;
      if (selectedRoute && route.id === selectedRoute.id) {
        routeColor = routeColors.selected;
      }
      
      // Créer la source de données
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route.coordinates
          }
        }
      });
      
      // Ajouter la couche pour afficher l'itinéraire
      map.current.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': routeColor,
          'line-width': selectedRoute && route.id === selectedRoute.id ? 5 : 3,
          'line-opacity': selectedRoute && route.id === selectedRoute.id ? 1 : 0.7
        }
      });
      
      // Ajouter des événements d'interaction avec l'itinéraire
      map.current.on('mouseenter', layerId, () => {
        map.current.getCanvas().style.cursor = 'pointer';
        
        if (!selectedRoute || route.id !== selectedRoute.id) {
          map.current.setPaintProperty(layerId, 'line-color', routeColors.highlighted);
          map.current.setPaintProperty(layerId, 'line-width', 4);
        }
      });
      
      map.current.on('mouseleave', layerId, () => {
        map.current.getCanvas().style.cursor = '';
        
        if (!selectedRoute || route.id !== selectedRoute.id) {
          map.current.setPaintProperty(layerId, 'line-color', routeColors.regular);
          map.current.setPaintProperty(layerId, 'line-width', 3);
        }
      });
      
      map.current.on('click', layerId, () => {
        handleRouteSelect(route);
      });
    });
  };

  // Zoomer sur un itinéraire
  const zoomToRoute = (route) => {
    if (!map.current || !mapLoaded || !route.coordinates || route.coordinates.length < 2) return;
    
    // Créer une boîte englobante pour l'itinéraire
    const bounds = new mapboxgl.LngLatBounds();
    
    route.coordinates.forEach(coord => {
      bounds.extend(coord);
    });
    
    // Zoomer sur la boîte englobante
    map.current.fitBounds(bounds, {
      padding: 50,
      maxZoom: 14
    });
  };

  // Gérer la sélection d'un itinéraire
  const handleRouteSelect = (route) => {
    setSelectedRoute(route);
    zoomToRoute(route);
  };

  // Confirmer la sélection de l'itinéraire
  const handleConfirmSelection = () => {
    if (selectedRoute) {
      onSelectRoute(selectedRoute);
    }
  };

  // Ajouter/retirer un itinéraire des favoris
  const toggleFavorite = (routeId) => {
    let updatedFavorites;
    
    if (favoriteRoutes.includes(routeId)) {
      updatedFavorites = favoriteRoutes.filter(id => id !== routeId);
    } else {
      updatedFavorites = [...favoriteRoutes, routeId];
    }
    
    setFavoriteRoutes(updatedFavorites);
    localStorage.setItem('favoriteRoutes', JSON.stringify(updatedFavorites));
  };

  // Vérifier si un itinéraire est en favoris
  const isFavorite = (routeId) => {
    return favoriteRoutes.includes(routeId);
  };

  return (
    <Box sx={{ height: 600, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        {t('selectRoute')}
      </Typography>
      
      <Grid container spacing={2} sx={{ height: '100%' }}>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <TextField
              placeholder={t('searchRoutes')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              margin="normal"
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}>
                      <CloseIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <Paper 
              elevation={2} 
              sx={{ 
                flex: 1, 
                overflow: 'auto', 
                mt: 1,
                p: 0
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : filteredRoutes.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    {t('noRoutesFound')}
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {filteredRoutes.map((route, index) => (
                    <React.Fragment key={route.id}>
                      {index > 0 && <Divider />}
                      <ListItem
                        button
                        selected={selectedRoute && selectedRoute.id === route.id}
                        onClick={() => handleRouteSelect(route)}
                        sx={{ 
                          pl: 2,
                          bgcolor: selectedRoute && selectedRoute.id === route.id ? 'rgba(0, 0, 0, 0.04)' : 'inherit'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {route.name}
                              {selectedRoute && selectedRoute.id === route.id && (
                                <CheckIcon color="primary" fontSize="small" sx={{ ml: 1 }} />
                              )}
                            </Box>
                          }
                          secondary={
                            <Grid container spacing={1}>
                              <Grid item xs={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <DirectionsBike fontSize="small" sx={{ mr: 0.5, fontSize: '0.875rem' }} />
                                  <Typography variant="caption">
                                    {route.distance} km
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <TrendingUp fontSize="small" sx={{ mr: 0.5, fontSize: '0.875rem' }} />
                                  <Typography variant="caption">
                                    {route.elevationGain} m
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Place fontSize="small" sx={{ mr: 0.5, fontSize: '0.875rem' }} />
                                  <Typography variant="caption">
                                    {route.region || t('unknownRegion')}
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(route.id);
                            }}
                          >
                            {isFavorite(route.id) ? (
                              <StarIcon color="warning" />
                            ) : (
                              <StarBorderIcon />
                            )}
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
            
            <Button
              variant="contained"
              color="primary"
              disabled={!selectedRoute}
              onClick={handleConfirmSelection}
              sx={{ mt: 2 }}
              fullWidth
            >
              {t('confirmSelection')}
            </Button>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={3} 
            sx={{ 
              height: '100%', 
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 1
            }}
          >
            <Box
              ref={mapContainer}
              sx={{
                height: '100%',
                width: '100%'
              }}
            />
            {!mapLoaded && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  bgcolor: 'rgba(255, 255, 255, 0.7)'
                }}
              >
                <CircularProgress />
              </Box>
            )}
            
            {selectedRoute && (
              <Paper 
                elevation={2} 
                sx={{ 
                  position: 'absolute', 
                  bottom: 16, 
                  left: 16, 
                  p: 1.5,
                  maxWidth: '80%',
                  borderRadius: 1
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  {selectedRoute.name}
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DirectionsBike color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {selectedRoute.distance} km
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUp color="secondary" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {selectedRoute.elevationGain} m
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Chip 
                  label={selectedRoute.difficulty}
                  size="small"
                  color="primary"
                  sx={{ mt: 1 }}
                />
              </Paper>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

MapRouteSelector.propTypes = {
  onSelectRoute: PropTypes.func.isRequired,
  selectedRouteId: PropTypes.string
};

export default MapRouteSelector;
