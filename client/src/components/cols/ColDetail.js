import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Card, CardContent, Typography, Grid, Divider, 
  Button, Chip, CircularProgress, Paper, Tabs, Tab,
  useMediaQuery, useTheme, Container, Badge, Tooltip
} from '@mui/material';
import { 
  Terrain as TerrainIcon, 
  Visibility as VisibilityIcon,
  NavigationRounded as NavigationIcon,
  LocationOn as LocationIcon,
  Hotel as HotelIcon,
  ShowChart as LineChartIcon,
  ThreeDRotation as ThreeDIcon,
  AccessTime as AccessTimeIcon,
  Flight as FlightIcon,
  VrpanoOutlined as FlyThroughIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import ColVisualization3D from './ColVisualization3D';
import ColFlyThrough from './ColFlyThrough';
import ColService from '../../services/colService';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import ColWeatherForecast from './ColWeatherForecast';

// Composant d'information et visualisation de cols cyclistes
const ColDetail = ({ colId }) => {
  const [col, setCol] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [elevationData, setElevationData] = useState([]);
  const [terrain3DData, setTerrain3DData] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  
  // Theme et Media Queries pour le responsive
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Charger les données du col
  useEffect(() => {
    const fetchColData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les détails du col
        const colData = await ColService.getColById(colId);
        setCol(colData);
        
        // Récupérer les données d'élévation pour le graphique
        const elevData = await ColService.getColElevationData(colId);
        setElevationData(elevData);
        
        // Récupérer les données de terrain pour la visualisation 3D
        const terrainData = await ColService.getCol3DTerrainData(colId);
        setTerrain3DData(terrainData);
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des données du col:', err);
        setError('Impossible de charger les données du col. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };
    
    if (colId) {
      fetchColData();
    }
  }, [colId]);

  // Gérer le changement d'onglet - optimisé avec useCallback
  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  // Afficher un indicateur de chargement
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={isMobile ? "200px" : "400px"}>
        <CircularProgress aria-label="Chargement des données du col" />
      </Box>
    );
  }

  // Afficher un message d'erreur
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={isMobile ? "200px" : "400px"}>
        <Typography color="error" role="alert">{error}</Typography>
      </Box>
    );
  }

  // Si aucun col n'est sélectionné ou trouvé
  if (!col) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={isMobile ? "200px" : "400px"}>
        <Typography variant="subtitle1">
          Sélectionnez un col pour voir ses détails
        </Typography>
      </Box>
    );
  }

  // Rendu du composant
  return (
    <Card elevation={3}>
      <CardContent sx={{ p: isMobile ? 1.5 : 3 }}>
        {/* En-tête avec nom et difficulté */}
        <Box 
          mb={2} 
          display="flex" 
          flexDirection={isMobile ? "column" : "row"} 
          justifyContent={isMobile ? "center" : "space-between"} 
          alignItems={isMobile ? "center" : "flex-start"}
          gap={isMobile ? 1 : 0}
        >
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            component="h1"
            align={isMobile ? "center" : "left"}
          >
            {col.name}
          </Typography>
          <Chip 
            icon={<TerrainIcon />} 
            label={col.difficulty} 
            color={
              col.difficulty === 'Difficile' ? 'error' : 
              col.difficulty === 'Modéré' ? 'warning' : 'success'
            }
            size={isMobile ? "small" : "medium"}
            aria-label={`Difficulté: ${col.difficulty}`}
          />
        </Box>
        
        {/* Image du col avec lazy loading */}
        <Box mb={2}>
          <LazyLoadImage
            src={col.imageUrl} 
            alt={`Vue du col ${col.name}`}
            effect="blur"
            style={{ 
              width: '100%', 
              height: isMobile ? '180px' : '250px', 
              objectFit: 'cover', 
              borderRadius: '8px' 
            }}
            wrapperClassName="lazy-image-wrapper"
          />
        </Box>
        
        <Typography 
          variant="body1" 
          paragraph 
          sx={{ 
            mb: 3,
            fontSize: isMobile ? '0.9rem' : '1rem',
            textAlign: isMobile ? 'justify' : 'left'
          }}
        >
          {col.description}
        </Typography>
        
        {/* Statistiques clés */}
        <Grid container spacing={isMobile ? 1 : 3} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={6} md={4}>
            <Paper sx={{ p: isMobile ? 1 : 2, height: '100%' }}>
              <Box display="flex" alignItems="center" mb={0.5}>
                <TerrainIcon color="primary" sx={{ mr: 0.5, fontSize: isMobile ? '1rem' : '1.25rem' }} />
                <Typography variant={isMobile ? "body2" : "h6"}>Altitude</Typography>
              </Box>
              <Typography 
                variant={isMobile ? "h6" : "h4"} 
                component="p" 
                align="center"
                sx={{ mt: isMobile ? 0.5 : 1 }}
              >
                {col.altitude} m
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={6} md={4}>
            <Paper sx={{ p: isMobile ? 1 : 2, height: '100%' }}>
              <Box display="flex" alignItems="center" mb={0.5}>
                <AccessTimeIcon color="primary" sx={{ mr: 0.5, fontSize: isMobile ? '1rem' : '1.25rem' }} />
                <Typography variant={isMobile ? "body2" : "h6"}>Longueur</Typography>
              </Box>
              <Typography 
                variant={isMobile ? "h6" : "h4"} 
                component="p" 
                align="center"
                sx={{ mt: isMobile ? 0.5 : 1 }}
              >
                {col.length} km
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <Paper sx={{ p: isMobile ? 1 : 2, height: '100%' }}>
              <Box display="flex" alignItems="center" mb={0.5}>
                <NavigationIcon color="primary" sx={{ mr: 0.5, fontSize: isMobile ? '1rem' : '1.25rem' }} />
                <Typography variant={isMobile ? "body2" : "h6"}>Pente moyenne</Typography>
              </Box>
              <Typography 
                variant={isMobile ? "h6" : "h4"} 
                component="p" 
                align="center"
                sx={{ mt: isMobile ? 0.5 : 1 }}
              >
                {col.avgGradient}%
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Météo */}
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          component="h2" 
          sx={{ mb: isMobile ? 1 : 2, mt: 3 }}
        >
          Météo et conditions
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <ColWeatherForecast col={col} />
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {/* Onglets */}
        <Box sx={{ mb: 2 }}>
          <Tabs 
            value={currentTab} 
            onChange={handleChangeTab}
            variant="scrollable"
            scrollButtons={isMobile ? "auto" : "desktop"}
            allowScrollButtonsMobile
            aria-label="Onglets de visualisation du col"
          >
            <Tab 
              label={isMobile ? "Profil" : "Profil d'élévation"} 
              icon={<LineChartIcon />} 
              id={`tab-chart-${colId}`}
              aria-controls={`tabpanel-chart-${colId}`}
              iconPosition="start"
            />
            <Tab 
              label={isMobile ? "3D" : "Visualisation 3D"} 
              icon={<ThreeDIcon />} 
              id={`tab-3d-${colId}`}
              aria-controls={`tabpanel-3d-${colId}`}
              iconPosition="start"
            />
            <Tab 
              label={isMobile ? "Fly" : "Fly-through"} 
              icon={<FlyThroughIcon />} 
              id={`tab-fly-${colId}`}
              aria-controls={`tabpanel-fly-${colId}`}
              iconPosition="start"
            />
          </Tabs>
        </Box>
        
        {/* Contenu des onglets */}
        <Box sx={{ mb: 3 }}>
          {/* Onglet Profil d'élévation */}
          <Box 
            role="tabpanel" 
            id={`tabpanel-chart-${colId}`}
            hidden={currentTab !== 0} 
            sx={{ 
              height: isMobile ? '250px' : isTablet ? '300px' : '400px', 
              mb: 2 
            }}
            aria-labelledby={`tab-chart-${colId}`}
          >
            {currentTab === 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={elevationData}
                  margin={{ 
                    top: 10, 
                    right: isMobile ? 5 : 30, 
                    left: isMobile ? 5 : 20, 
                    bottom: 10 
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="distance" 
                    label={{ 
                      value: 'Distance (km)', 
                      position: 'insideBottomRight', 
                      offset: -10,
                      fontSize: isMobile ? 10 : 12
                    }} 
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Élévation (m)', 
                      angle: -90, 
                      position: 'insideLeft',
                      fontSize: isMobile ? 10 : 12
                    }} 
                    domain={['dataMin - 50', 'dataMax + 50']}
                    tick={{ fontSize: isMobile ? 10 : 12 }}
                  />
                  <RechartsTooltip 
                    formatter={(value) => [`${value} m`, 'Élévation']} 
                    labelFormatter={(value) => `Distance: ${value} km`} 
                    contentStyle={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="elevation" 
                    stroke="#2196F3" 
                    dot={false} 
                    strokeWidth={isMobile ? 1.5 : 2} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Box>
          
          {/* Onglet Visualisation 3D - hauteur adaptative pour les appareils mobiles */}
          <Box 
            role="tabpanel" 
            id={`tabpanel-3d-${colId}`}
            hidden={currentTab !== 1} 
            sx={{ 
              height: isMobile ? '300px' : isTablet ? '350px' : '450px', 
              mb: 2 
            }}
            aria-labelledby={`tab-3d-${colId}`}
          >
            {currentTab === 1 && terrain3DData && (
              <ColVisualization3D 
                colId={colId}
                colData={terrain3DData.coordinates}
                pointsOfInterest={terrain3DData.pointsOfInterest}
                isMobile={isMobile}
              />
            )}
          </Box>

          {/* Nouvel onglet: Fly-through */}
          <Box 
            role="tabpanel" 
            id={`tabpanel-fly-${colId}`}
            hidden={currentTab !== 2} 
            sx={{ 
              height: isMobile ? '350px' : isTablet ? '400px' : '500px', 
              mb: 2 
            }}
            aria-labelledby={`tab-fly-${colId}`}
          >
            {currentTab === 2 && terrain3DData && (
              <ColFlyThrough 
                colId={colId}
                colData={terrain3DData.coordinates}
                pointsOfInterest={terrain3DData.pointsOfInterest}
                elevationData={elevationData}
                isMobile={isMobile}
              />
            )}
          </Box>
        </Box>
        
        {/* Points d'intérêt */}
        <Typography 
          variant={isMobile ? "h6" : "h5"} 
          component="h2" 
          sx={{ mb: isMobile ? 1 : 2 }}
        >
          Points d'intérêt
        </Typography>
        
        <Grid container spacing={isMobile ? 1 : 2}>
          {col.terrainData.pointsOfInterest.map((poi, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper 
                sx={{ 
                  p: isMobile ? 1.5 : 2,
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
              >
                <Box display="flex" alignItems="center" mb={1}>
                  {poi.type === 'viewpoint' && (
                    <VisibilityIcon 
                      color="primary" 
                      sx={{ mr: 1, fontSize: isMobile ? '1.1rem' : '1.25rem' }} 
                      aria-hidden="true"
                    />
                  )}
                  {poi.type === 'rest' && (
                    <HotelIcon 
                      color="primary" 
                      sx={{ mr: 1, fontSize: isMobile ? '1.1rem' : '1.25rem' }} 
                      aria-hidden="true"
                    />
                  )}
                  {poi.type === 'summit' && (
                    <TerrainIcon 
                      color="primary" 
                      sx={{ mr: 1, fontSize: isMobile ? '1.1rem' : '1.25rem' }} 
                      aria-hidden="true"
                    />
                  )}
                  <Typography 
                    variant={isMobile ? "subtitle1" : "h6"}
                    sx={{ fontSize: isMobile ? '0.9rem' : 'inherit' }}
                  >
                    {poi.name}
                  </Typography>
                </Box>
                <Typography 
                  variant="body2" 
                  color="textSecondary"
                  sx={{ fontSize: isMobile ? '0.8rem' : 'inherit' }}
                >
                  À {poi.distance} km du départ
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
        
        {/* Boutons d'action */}
        <Box 
          mt={3} 
          display="flex" 
          flexDirection={isMobile ? "column" : "row"} 
          justifyContent={isMobile ? "center" : "space-between"}
          gap={isMobile ? 1 : 0}
        >
          <Button 
            variant="outlined" 
            color="primary"
            fullWidth={isMobile}
            aria-label="Voir le col sur la carte"
          >
            Voir sur la carte
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            fullWidth={isMobile}
            startIcon={<FlyThroughIcon />}
            onClick={() => setCurrentTab(2)}
            sx={{ mt: isMobile ? 1 : 0, mx: isMobile ? 0 : 1 }}
            aria-label="Explorer le col en Fly-through"
          >
            Explorer en Fly-through
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            fullWidth={isMobile}
            sx={{ mt: isMobile ? 1 : 0 }}
            aria-label="Ajouter le col à mon itinéraire"
          >
            Ajouter à mon itinéraire
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default React.memo(ColDetail);
