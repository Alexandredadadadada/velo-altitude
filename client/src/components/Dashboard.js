import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  Tabs, 
  Tab, 
  Container, 
  useTheme, 
  alpha, 
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Card,
  CardContent
} from '@mui/material';
import { motion } from 'framer-motion';

// Composants essentiels
import ColVisualization3D from './visualization/ColVisualization3D';
import ColComparison from './visualization/ColComparison';
import AlternativeRoutes from './visualization/AlternativeRoutes';
import WeatherDashboard from './weather/WeatherDashboard';
import TrainingModule from './training/TrainingModule';
import SocialHub from './social/SocialHub';
import FTPCalculator from './training/FTPCalculator';
import NutritionCalculator from './nutrition/NutritionCalculator';
import TrainingZoneChart from './training/TrainingZoneChart';

// Widgets pour le dashboard
import RecentColsWidget from './dashboard/RecentColsWidget';
import MajorChallengeProgressWidget from './dashboard/MajorChallengeProgressWidget';
import FavoriteColsWeatherWidget from './dashboard/FavoriteColsWeatherWidget';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import PersonIcon from '@mui/icons-material/Person';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import ShowChartIcon from '@mui/icons-material/ShowChart';

import './Dashboard.css';

const fetchColsList = async () => {
  try {
    // Simulate API call - replace with actual API call
    return [
      { id: '1', name: 'Col du Galibier', elevation: 2642 },
      { id: '2', name: 'Col de la Planche des Belles Filles', elevation: 1148 },
      { id: '3', name: 'Mont Ventoux', elevation: 1909 },
      { id: '4', name: 'Ballon d\'Alsace', elevation: 1247 }
    ];
  } catch (error) {
    console.error('Error fetching cols list:', error);
    return [];
  }
};

// Mock API service for fetching routes data
const fetchRoutesList = async () => {
  try {
    // Simulate API call - replace with actual API call
    return [
      { id: '1', name: 'Route des Crêtes', mainPass: '1' },
      { id: '2', name: 'Circuit des Ballons', mainPass: '4' },
      { id: '3', name: 'Ascension du Ventoux', mainPass: '3' }
    ];
  } catch (error) {
    console.error('Error fetching routes list:', error);
    return [];
  }
};

const Dashboard = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [cols, setCols] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedCol, setSelectedCol] = useState(null);
  const [selectedCols, setSelectedCols] = useState({ col1: null, col2: null });
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [weatherRouteData, setWeatherRouteData] = useState(null);
  const [socialView, setSocialView] = useState('feed');
  const [userData, setUserData] = useState(null);
  const [recentlyViewedCols, setRecentlyViewedCols] = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [favoriteCols, setFavoriteCols] = useState([]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [colsData, routesData] = await Promise.all([
          fetchColsList(),
          fetchRoutesList()
        ]);

        setCols(colsData);
        setRoutes(routesData);

        // Set default selections if data is available
        if (colsData.length > 0) {
          setSelectedCol(colsData[0].id);
          setSelectedCols({ 
            col1: colsData[0].id, 
            col2: colsData.length > 1 ? colsData[1].id : colsData[0].id 
          });
        }

        if (routesData.length > 0) {
          setSelectedRoute(routesData[0].id);
        }

        // Simulation des cols récemment visités
        setRecentlyViewedCols([
          {
            id: '1',
            name: 'Col du Galibier',
            altitude: 2642,
            averageGradient: 7.3,
            difficulty: 4,
            location: { region: 'Hautes-Alpes', country: 'France' },
            lastVisited: new Date(Date.now() - 24 * 60 * 60 * 1000),
            images: { thumbnail: '/images/cols/galibier_thumb.jpg' }
          },
          {
            id: '2',
            name: 'Col de la Planche des Belles Filles',
            altitude: 1148,
            averageGradient: 8.5,
            difficulty: 3,
            location: { region: 'Haute-Saône', country: 'France' },
            lastVisited: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            images: { thumbnail: '/images/cols/planche_thumb.jpg' }
          },
          {
            id: '3',
            name: 'Mont Ventoux',
            altitude: 1909,
            averageGradient: 7.1,
            difficulty: 5,
            location: { region: 'Vaucluse', country: 'France' },
            lastVisited: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            images: { thumbnail: '/images/cols/ventoux_thumb.jpg' }
          },
          {
            id: '4',
            name: 'Ballon d\'Alsace',
            altitude: 1247,
            averageGradient: 6.8,
            difficulty: 3,
            location: { region: 'Territoire de Belfort', country: 'France' },
            lastVisited: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            images: { thumbnail: '/images/cols/ballon_thumb.jpg' }
          }
        ]);

        // Simulation des défis actifs
        setActiveChallenges([
          {
            id: 'challenge-1',
            name: 'Conquête des Vosges',
            status: 'active',
            progress: 42,
            completedCols: 3,
            totalCols: 7,
            nextStep: 'Col du Grand Ballon',
            badges: [
              { name: 'Premier Col', unlocked: true, description: 'Premier col conquis' },
              { name: 'Mi-Parcours', unlocked: false, description: 'Atteindre la moitié du défi' }
            ]
          },
          {
            id: 'challenge-2',
            name: 'Les Géants des Alpes',
            status: 'in-progress',
            progress: 28,
            completedCols: 2,
            totalCols: 7,
            nextStep: 'Col du Télégraphe',
            badges: [
              { name: 'Première Ascension', unlocked: true, description: 'Première ascension réalisée' }
            ]
          }
        ]);

        // Simulation des cols favoris
        setFavoriteCols([
          {
            id: '1',
            name: 'Col du Galibier',
            altitude: 2642,
            averageGradient: 7.3,
            location: { lat: 45.0579, lng: 6.4078, region: 'Hautes-Alpes', country: 'France' },
            images: { thumbnail: '/images/cols/galibier_thumb.jpg' }
          },
          {
            id: '3',
            name: 'Mont Ventoux',
            altitude: 1909,
            averageGradient: 7.1,
            location: { lat: 44.1740, lng: 5.2786, region: 'Vaucluse', country: 'France' },
            images: { thumbnail: '/images/cols/ventoux_thumb.jpg' }
          }
        ]);

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Prepare sample data for the 3D visualization
  const sampleElevationData = {
    width: 10,
    heights: Array(10).fill().map(() => Array(10).fill(100).map(() => Math.random() * 200 + 800))
  };

  const sampleSurfaceTypes = {
    dominant: 'asphalt',
    sections: [
      { start: 0, end: 50, type: 'asphalt' },
      { start: 50, end: 75, type: 'gravel' },
      { start: 75, end: 100, type: 'dirt' }
    ]
  };

  const samplePointsOfInterest = [
    { x: 1, z: 2, elevation: 120, name: 'Viewpoint', type: 'panorama' },
    { x: 5, z: 5, elevation: 140, name: 'Water Source', type: 'water' },
    { x: 8, z: 3, elevation: 110, name: 'Danger Zone', type: 'danger' }
  ];

  // Prepare navigation tabs
  const navigationTabs = [
    { id: 'visualization3D', label: t('3dVisualization') },
    { id: 'comparison', label: t('colsComparison') },
    { id: 'alternativeRoutes', label: t('alternativeRoutes') },
    { id: 'weatherDashboard', label: t('weatherDashboard') },
    { id: 'trainingModule', label: t('training') },
    { id: 'socialHub', label: t('socialHub') }
  ];

  // Handle social sub-navigation
  const handleSocialViewChange = (view) => {
    setSocialView(view);
  };

  // Rendu du dashboard principal
  const renderDashboard = () => {
    return (
      <Box sx={{ py: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Tableau de bord
        </Typography>
        
        <Grid container spacing={3}>
          {/* Section des widgets principaux */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              {/* Widget des cols récemment consultés */}
              <Grid item xs={12}>
                <RecentColsWidget cols={recentlyViewedCols} />
              </Grid>
              
              {/* Widget de progression des défis "7 Majeurs" */}
              <Grid item xs={12} md={6}>
                <MajorChallengeProgressWidget challenges={activeChallenges} />
              </Grid>
              
              {/* Widget météo pour les cols favoris */}
              <Grid item xs={12} md={6}>
                <FavoriteColsWeatherWidget favoriteCols={favoriteCols} />
              </Grid>
            </Grid>
          </Grid>
          
          {/* Section des accès rapides aux outils */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: 'background.paper',
                boxShadow: theme.shadows[1],
                height: '100%'
              }}
            >
              <Typography variant="h6" gutterBottom>
                Outils rapides
              </Typography>
              
              <Grid container spacing={2}>
                {/* Calculatrice FTP */}
                <Grid item xs={12}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[3]
                      },
                      borderRadius: 2
                    }}
                    onClick={() => setActiveTab('ftp')}
                  >
                    <CardContent sx={{ 
                      p: 2,
                      '&:last-child': { pb: 2 },
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Box 
                        sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.1), 
                          borderRadius: '50%', 
                          p: 1.5,
                          mr: 2,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <ShowChartIcon sx={{ color: theme.palette.primary.main }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Calculatrice FTP
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          6 méthodes de calcul et zones d'entraînement
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Calculatrice de nutrition */}
                <Grid item xs={12}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[3]
                      },
                      borderRadius: 2
                    }}
                    onClick={() => setActiveTab('nutrition')}
                  >
                    <CardContent sx={{ 
                      p: 2,
                      '&:last-child': { pb: 2 },
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Box 
                        sx={{ 
                          bgcolor: alpha(theme.palette.success.main, 0.1), 
                          borderRadius: '50%', 
                          p: 1.5,
                          mr: 2,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <LocalDiningIcon sx={{ color: theme.palette.success.main }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Calculatrice Nutrition
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Besoins caloriques et plans alimentaires
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Visualisation 3D */}
                <Grid item xs={12}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[3]
                      },
                      borderRadius: 2
                    }}
                    onClick={() => setActiveTab('visualization')}
                  >
                    <CardContent sx={{ 
                      p: 2,
                      '&:last-child': { pb: 2 },
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Box 
                        sx={{ 
                          bgcolor: alpha(theme.palette.info.main, 0.1), 
                          borderRadius: '50%', 
                          p: 1.5,
                          mr: 2,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <DirectionsBikeIcon sx={{ color: theme.palette.info.main }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Visualisation 3D Cols
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Modèles interactifs avec données d'élévation
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                {/* Programmes d'entraînement */}
                <Grid item xs={12}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[3]
                      },
                      borderRadius: 2
                    }}
                    onClick={() => setActiveTab('trainingModule')}
                  >
                    <CardContent sx={{ 
                      p: 2,
                      '&:last-child': { pb: 2 },
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Box 
                        sx={{ 
                          bgcolor: alpha(theme.palette.warning.main, 0.1), 
                          borderRadius: '50%', 
                          p: 1.5,
                          mr: 2,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <FitnessCenterIcon sx={{ color: theme.palette.warning.main }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Programmes d'entraînement
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Plans spécifiques pour vos objectifs
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Section statistiques d'utilisation */}
          <Grid item xs={12}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: 'background.paper',
                boxShadow: theme.shadows[1]
              }}
            >
              <Typography variant="h6" gutterBottom>
                Vos statistiques
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h3" color="primary.main" fontWeight={700}>
                      12
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Cols explorés
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h3" color="primary.main" fontWeight={700}>
                      2
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Défis en cours
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h3" color="primary.main" fontWeight={700}>
                      5
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Badges obtenus
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Typography variant="h3" color="primary.main" fontWeight={700}>
                      245
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      W/kg FTP estimé
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Rendu de la calculatrice FTP
  const renderFTPCalculator = () => {
    return (
      <Box sx={{ py: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3 }}>
          Calculatrice FTP et Zones d'Entraînement
        </Typography>
        <FTPCalculator />
      </Box>
    );
  };

  // Rendu de la calculatrice de nutrition
  const renderNutritionCalculator = () => {
    return (
      <Box sx={{ py: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3 }}>
          Calculatrice de Nutrition
        </Typography>
        <NutritionCalculator />
      </Box>
    );
  };

  if (loading) {
    return <div className="dashboard-loading">{t('loading')}</div>;
  }

  return (
    <div className="dashboard-container">
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        minHeight: '100vh'
      }}>
        {/* Navigation latérale */}
        <Box 
          sx={{ 
            width: { xs: '100%', md: 80 },
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: { xs: 'row', md: 'column' },
            justifyContent: { xs: 'space-around', md: 'flex-start' },
            py: { xs: 1, md: 3 },
            position: { md: 'sticky' },
            top: 0,
            height: { md: '100vh' },
            zIndex: 10
          }}
        >
          <Tooltip title="Tableau de bord" placement="right">
            <IconButton 
              color={activeTab === 'dashboard' ? 'primary' : 'default'}
              onClick={() => setActiveTab('dashboard')}
              sx={{ 
                mb: { md: 2 },
                width: { md: 48 },
                height: { md: 48 },
                mx: 'auto'
              }}
            >
              <DashboardIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Visualisation 3D" placement="right">
            <IconButton 
              color={activeTab === 'visualization' ? 'primary' : 'default'}
              onClick={() => setActiveTab('visualization')}
              sx={{ 
                mb: { md: 2 },
                width: { md: 48 },
                height: { md: 48 },
                mx: 'auto'
              }}
            >
              <DirectionsBikeIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Calculatrice FTP" placement="right">
            <IconButton 
              color={activeTab === 'ftp' ? 'primary' : 'default'}
              onClick={() => setActiveTab('ftp')}
              sx={{ 
                mb: { md: 2 },
                width: { md: 48 },
                height: { md: 48 },
                mx: 'auto'
              }}
            >
              <ShowChartIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Nutrition" placement="right">
            <IconButton 
              color={activeTab === 'nutrition' ? 'primary' : 'default'}
              onClick={() => setActiveTab('nutrition')}
              sx={{ 
                mb: { md: 2 },
                width: { md: 48 },
                height: { md: 48 },
                mx: 'auto'
              }}
            >
              <LocalDiningIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Entraînement" placement="right">
            <IconButton 
              color={activeTab === 'trainingModule' ? 'primary' : 'default'}
              onClick={() => setActiveTab('trainingModule')}
              sx={{ 
                mb: { md: 2 },
                width: { md: 48 },
                height: { md: 48 },
                mx: 'auto'
              }}
            >
              <FitnessCenterIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Profil" placement="right">
            <IconButton 
              color={activeTab === 'profile' ? 'primary' : 'default'}
              onClick={() => setActiveTab('profile')}
              sx={{ 
                mb: { md: 2 },
                width: { md: 48 },
                height: { md: 48 },
                mx: 'auto',
                mt: { md: 'auto' }
              }}
            >
              <PersonIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* Contenu principal */}
        <Box sx={{ flex: 1, p: { xs: 2, md: 4 } }}>
          <Container maxWidth="xl">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'visualization' && (
              <div className="visualization-tab">
                <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3 }}>
                  Visualisation 3D des Cols
                </Typography>
                
                <div className="visualization-selector">
                  <label htmlFor="col-select">{t('selectCol')}: </label>
                  <select 
                    id="col-select"
                    value={selectedCol || ''}
                    onChange={(e) => setSelectedCol(e.target.value)}
                  >
                    {cols.map(col => (
                      <option key={col.id} value={col.id}>{col.name} ({col.elevation}m)</option>
                    ))}
                  </select>
                </div>

                <div className="visualization-container">
                  {selectedCol && (
                    <ColVisualization3D 
                      passId={selectedCol}
                      elevationData={sampleElevationData}
                      surfaceTypes={sampleSurfaceTypes}
                      pointsOfInterest={samplePointsOfInterest}
                    />
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'ftp' && renderFTPCalculator()}
            {activeTab === 'nutrition' && renderNutritionCalculator()}
            
            {activeTab === 'comparison' && (
              <div className="comparison-tab">
                <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3 }}>
                  Comparaison de Cols
                </Typography>
                
                <div className="comparison-selector">
                  <div>
                    <label htmlFor="col1-select">{t('firstCol')}: </label>
                    <select 
                      id="col1-select"
                      value={selectedCols.col1 || ''}
                      onChange={(e) => setSelectedCols({...selectedCols, col1: e.target.value})}
                    >
                      {cols.map(col => (
                        <option key={col.id} value={col.id}>{col.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="col2-select">{t('secondCol')}: </label>
                    <select 
                      id="col2-select"
                      value={selectedCols.col2 || ''}
                      onChange={(e) => setSelectedCols({...selectedCols, col2: e.target.value})}
                    >
                      {cols.map(col => (
                        <option key={col.id} value={col.id}>{col.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="comparison-container">
                  {selectedCols.col1 && selectedCols.col2 && (
                    <ColComparison 
                      pass1Id={selectedCols.col1}
                      pass2Id={selectedCols.col2}
                    />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'alternativeRoutes' && (
              <div className="alternatives-tab">
                <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3 }}>
                  Routes Alternatives
                </Typography>
                
                <div className="route-selector">
                  <label htmlFor="route-select">{t('selectRoute')}: </label>
                  <select 
                    id="route-select"
                    value={selectedRoute || ''}
                    onChange={(e) => setSelectedRoute(e.target.value)}
                  >
                    {routes.map(route => (
                      <option key={route.id} value={route.id}>{route.name}</option>
                    ))}
                  </select>
                </div>

                <div className="alternatives-container">
                  {selectedRoute && (
                    <AlternativeRoutes mainRouteId={selectedRoute} />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'weatherDashboard' && weatherRouteData && (
              <div className="weather-dashboard-tab">
                <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3 }}>
                  Météo des Itinéraires
                </Typography>
                
                <WeatherDashboard 
                  routeId="route-1"
                  routeData={weatherRouteData}
                />
              </div>
            )}

            {activeTab === 'trainingModule' && (
              <div className="training-module-tab">
                <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3 }}>
                  Module d'Entraînement
                </Typography>
                
                <TrainingModule />
              </div>
            )}

            {activeTab === 'socialHub' && (
              <div className="social-hub-tab">
                <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3 }}>
                  Communauté
                </Typography>
                
                <SocialHub 
                  userId="user123" 
                  initialView={socialView}
                  onViewChange={handleSocialViewChange}
                />
              </div>
            )}
          </Container>
        </Box>
      </Box>

      <div className="dashboard-footer">
        <p> 2025 Grand Est Cyclisme</p>
      </div>
    </div>
  );
};

export default Dashboard;
