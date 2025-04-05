import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Speed,
  Whatshot,
  MonitorHeart,
  Terrain,
  DirectionsBike
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import integrationService from '../../services/integrationService';
import routeService from '../../services/routeService';
import { formatDistance } from '../../utils/formatters';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { Style, Stroke, Fill, CircleStyle } from 'ol/style';
import { HeatmapLayer } from 'ol/layer';
import 'ol/ol.css';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * Composant affichant une carte de chaleur d'effort sur les itinéraires favoris
 * Visualise différentes métriques comme la vitesse, l'intensité, etc.
 */
const RouteHeatMap = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatmapLayerRef = useRef(null);
  
  // États
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('power');
  const [radius, setRadius] = useState(10);
  const [blur, setBlur] = useState(15);
  const [activities, setActivities] = useState([]);
  const [routeData, setRouteData] = useState(null);
  
  // Initialisation de la carte
  useEffect(() => {
    if (!mapInstanceRef.current && mapRef.current) {
      mapInstanceRef.current = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSM()
          })
        ],
        view: new View({
          center: fromLonLat([2.3522, 48.8566]),
          zoom: 13
        })
      });
    }
    
    return () => {
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/routeheatmap"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined);
        mapInstanceRef.current = null;
      }
    };
  }, []);
  
  // Chargement des itinéraires favoris
  useEffect(() => {
    const fetchFavoriteRoutes = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await routeService.getFavoriteRoutes(user.id);
        setRoutes(response);
        
        if (response.length > 0) {
          setSelectedRoute(response[0].id);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des itinéraires favoris:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFavoriteRoutes();
  }, [user]);
  
  // Chargement des données d'activité pour la route sélectionnée
  useEffect(() => {
    const fetchActivitiesForRoute = async () => {
      if (!selectedRoute || !user) return;
      
      try {
        setLoading(true);
        
        // Charger les détails de l'itinéraire
        const routeDetails = await routeService.getRouteById(selectedRoute);
        setRouteData(routeDetails);
        
        // Centre la carte sur l'itinéraire
        if (mapInstanceRef.current && routeDetails.coordinates && routeDetails.coordinates.length > 0) {
          const centerPoint = routeDetails.coordinates[Math.floor(routeDetails.coordinates.length / 2)];
          mapInstanceRef.current.getView().setCenter(fromLonLat([centerPoint[0], centerPoint[1]]));
          mapInstanceRef.current.getView().setZoom(13);
        }
        
        // Charger les activités sur cet itinéraire
        const routeActivities = await integrationService.getActivitiesForRoute(
          user.id,
          selectedRoute
        );
        
        setActivities(routeActivities);
        
        // Dessiner l'itinéraire et la heatmap
        drawRouteAndHeatmap(routeDetails, routeActivities);
        
      } catch (error) {
        console.error('Erreur lors du chargement des activités pour l\'itinéraire:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivitiesForRoute();
  }, [selectedRoute, user]);
  
  // Mise à jour de la heatmap lorsque les paramètres changent
  useEffect(() => {
    if (activities.length > 0 && routeData) {
      drawRouteAndHeatmap(routeData, activities);
    }
  }, [selectedMetric, radius, blur]);
  
  // Dessiner l'itinéraire et la heatmap sur la carte
  const drawRouteAndHeatmap = (route, routeActivities) => {
    if (!mapInstanceRef.current) return;
    
    // Supprimer les couches existantes
    const layers = mapInstanceRef.current.getLayers().getArray();
    for (let i = layers.length - 1; i > 0; i--) {
      mapInstanceRef.current.removeLayer(layers[i]);
    }
    
    // Créer une couche pour l'itinéraire
    const routeCoordinates = route.coordinates.map(coord => fromLonLat([coord[0], coord[1]]));
    
    const routeFeature = new Feature({
      geometry: new LineString(routeCoordinates)
    });
    
    const routeLayer = new VectorLayer({
      source: new VectorSource({
        features: [routeFeature]
      }),
      style: new Style({
        stroke: new Stroke({
          color: theme.palette.primary.main,
          width: 4
        })
      }),
      zIndex: 10
    });
    
    mapInstanceRef.current.addLayer(routeLayer);
    
    // Créer des données pour la heatmap en fonction de la métrique sélectionnée
    if (routeActivities.length > 0) {
      const heatmapPoints = [];
      
      routeActivities.forEach(activity => {
        if (!activity.detailedData || !activity.detailedData.length) return;
        
        activity.detailedData.forEach(point => {
          const coordinates = fromLonLat([point.longitude, point.latitude]);
          
          let weight = 0;
          switch (selectedMetric) {
            case 'power':
              weight = point.power ? point.power / 400 : 0.3;
              break;
            case 'heartrate':
              weight = point.heartRate ? point.heartRate / 200 : 0.3;
              break;
            case 'speed':
              weight = point.speed ? point.speed / 50 : 0.3;
              break;
            case 'cadence':
              weight = point.cadence ? point.cadence / 120 : 0.3;
              break;
            case 'elevation':
              // Pour l'élévation, on s'intéresse au gradient
              weight = point.gradient ? Math.abs(point.gradient) / 15 : 0.3;
              break;
            default:
              weight = 0.5;
          }
          
          // Limiter le poids entre 0 et 1
          weight = Math.min(Math.max(weight, 0), 1);
          
          const heatmapPoint = new Feature({
            geometry: new Point(coordinates),
            weight: weight
          });
          
          heatmapPoints.push(heatmapPoint);
        });
      });
      
      // Créer la couche heatmap
      if (heatmapLayerRef.current) {
        mapInstanceRef.current.removeLayer(heatmapLayerRef.current);
      }
      
      heatmapLayerRef.current = new HeatmapLayer({
        source: new VectorSource({
          features: heatmapPoints
        }),
        blur: blur,
        radius: radius,
        gradient: getGradientForMetric(selectedMetric),
        opacity: 0.8,
        zIndex: 5
      });
      
      mapInstanceRef.current.addLayer(heatmapLayerRef.current);
    }
  };
  
  // Obtenir le gradient de couleur en fonction de la métrique
  const getGradientForMetric = (metric) => {
    switch (metric) {
      case 'power':
        return ['#a3e635', '#84cc16', '#65a30d', '#4d7c0f', '#3f6212'];
      case 'heartrate':
        return ['#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb'];
      case 'speed':
        return ['#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309'];
      case 'cadence':
        return ['#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9'];
      case 'elevation':
        return ['#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8'];
      default:
        return ['#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7'];
    }
  };
  
  // Obtenir l'icône pour la métrique
  const getMetricIcon = (metric) => {
    switch (metric) {
      case 'power':
        return <Whatshot />;
      case 'heartrate':
        return <MonitorHeart />;
      case 'speed':
        return <Speed />;
      case 'cadence':
        return <DirectionsBike />;
      case 'elevation':
        return <Terrain />;
      default:
        return <Speed />;
    }
  };
  
  // Gérer le changement d'itinéraire
  const handleRouteChange = (event) => {
    setSelectedRoute(event.target.value);
  };
  
  // Gérer le changement de métrique
  const handleMetricChange = (event, newMetric) => {
    if (newMetric !== null) {
      setSelectedMetric(newMetric);
    }
  };
  
  // Gérer le changement de rayon
  const handleRadiusChange = (event, newValue) => {
    setRadius(newValue);
  };
  
  // Gérer le changement de flou
  const handleBlurChange = (event, newValue) => {
    setBlur(newValue);
  };
  
  return (
    <Paper 
      variant="outlined" 
      sx={{ 
        p: 3, 
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Carte de chaleur d'effort
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Visualisez vos efforts sur vos itinéraires favoris avec différentes métriques
        </Typography>
      </Box>
      
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <FormControl fullWidth sx={{ minWidth: 200 }}>
          <InputLabel id="route-select-label">Itinéraire</InputLabel>
          <Select
            labelId="route-select-label"
            id="route-select"
            value={selectedRoute}
            label="Itinéraire"
            onChange={handleRouteChange}
            disabled={loading || routes.length === 0}
          >
            {routes.map((route) => (
              <MenuItem key={route.id} value={route.id}>
                {route.title} ({formatDistance(route.distance)})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
            Métrique:
          </Typography>
          <ToggleButtonGroup
            value={selectedMetric}
            exclusive
            onChange={handleMetricChange}
            aria-label="metric"
            size="small"
            sx={{ flexGrow: 1 }}
          >
            <ToggleButton value="power" aria-label="puissance">
              <Tooltip title="Puissance">
                <Whatshot />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="heartrate" aria-label="fréquence cardiaque">
              <Tooltip title="Fréquence cardiaque">
                <MonitorHeart />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="speed" aria-label="vitesse">
              <Tooltip title="Vitesse">
                <Speed />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="cadence" aria-label="cadence">
              <Tooltip title="Cadence">
                <DirectionsBike />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="elevation" aria-label="dénivelé">
              <Tooltip title="Dénivelé/Pente">
                <Terrain />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Stack>
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mb: 3 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography id="radius-slider" gutterBottom>
            Rayon des points
          </Typography>
          <Slider
            value={radius}
            onChange={handleRadiusChange}
            aria-labelledby="radius-slider"
            valueLabelDisplay="auto"
            min={5}
            max={30}
          />
        </Box>
        
        <Box sx={{ flexGrow: 1 }}>
          <Typography id="blur-slider" gutterBottom>
            Flou
          </Typography>
          <Slider
            value={blur}
            onChange={handleBlurChange}
            aria-labelledby="blur-slider"
            valueLabelDisplay="auto"
            min={5}
            max={30}
          />
        </Box>
      </Box>
      
      <Box 
        sx={{ 
          position: 'relative',
          height: 500,
          bgcolor: '#f0f0f0',
          borderRadius: 1,
          overflow: 'hidden'
        }}
      >
        {loading && (
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              bgcolor: 'rgba(255,255,255,0.7)'
            }}
          >
            <CircularProgress />
          </Box>
        )}
        
        <Box
          ref={mapRef}
          sx={{
            width: '100%',
            height: '100%'
          }}
        />
        
        {/* Légende */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            bgcolor: 'background.paper',
            borderRadius: 1,
            p: 1,
            boxShadow: 2,
            zIndex: 5
          }}
        >
          <Typography variant="caption" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
            {selectedMetric === 'power' ? 'Puissance' :
             selectedMetric === 'heartrate' ? 'Fréquence cardiaque' :
             selectedMetric === 'speed' ? 'Vitesse' :
             selectedMetric === 'cadence' ? 'Cadence' : 'Pente'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ 
              width: 150,
              height: 10,
              background: `linear-gradient(to right, ${getGradientForMetric(selectedMetric).join(', ')})`
            }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: 0.5 }}>
              <Typography variant="caption">
                {selectedMetric === 'power' ? 'Faible' :
                 selectedMetric === 'heartrate' ? 'Repos' :
                 selectedMetric === 'speed' ? 'Lent' :
                 selectedMetric === 'cadence' ? 'Faible' : 'Plat'}
              </Typography>
              <Typography variant="caption">
                {selectedMetric === 'power' ? 'Élevée' :
                 selectedMetric === 'heartrate' ? 'Max' :
                 selectedMetric === 'speed' ? 'Rapide' :
                 selectedMetric === 'cadence' ? 'Élevée' : 'Raide'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {activities.length === 0 ? (
            "Aucune activité n'a été enregistrée sur cet itinéraire. Parcourez cet itinéraire et enregistrez votre activité pour voir votre carte de chaleur d'effort."
          ) : (
            `Visualisation basée sur ${activities.length} activité${activities.length > 1 ? 's' : ''} sur cet itinéraire.`
          )}
        </Typography>
      </Box>
    </Paper>
  );
};

export default RouteHeatMap;
