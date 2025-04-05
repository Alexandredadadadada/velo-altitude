import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Tabs, 
  Tab, 
  Card, 
  CardContent, 
  CardMedia, 
  Button, 
  Divider,
  IconButton,
  Chip,
  useTheme,
  alpha,
  Container,
  LinearProgress
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  FitnessCenter,
  DirectionsBike,
  Terrain,
  TrendingUp,
  Today,
  History,
  Favorite,
  Share,
  WbSunny,
  AcUnit
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Importation des widgets
import TodayTrainingWidget from '../dashboard/TodayTrainingWidget';
import { OptimizedVisualizationLoader } from '../../utils/OptimizedVisualizationLoader';

// Chargement optimisé du graphique des zones
const OptimizedZoneChart = React.lazy(() => import('./charts/OptimizedZoneChart'));

/**
 * Dashboard principal de la section Entraînement
 * Point d'entrée central pour accéder à tous les outils et fonctionnalités d'entraînement
 */
const TrainingDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // État pour les onglets
  const [tabValue, setTabValue] = useState(0);
  
  // Données factices pour la démo - à remplacer par des API calls
  const userProfile = {
    name: "Thomas",
    ftp: 265,
    weight: 72,
    trainingPhase: "Préparation",
    nextWorkout: {
      title: "Intervalles Seuil",
      scheduledFor: new Date(),
      duration: 75, // minutes
      tss: 85
    },
    weekProgress: 65, // en pourcentage
    weeklyGoal: 8, // heures
    weeklyCompleted: 5.2 // heures
  };
  
  const trainingZones = [
    { id: 1, name: "Récupération", min: 0, max: 144, color: theme.palette.info.light },
    { id: 2, name: "Endurance", min: 145, max: 198, color: theme.palette.info.main },
    { id: 3, name: "Tempo", min: 199, max: 225, color: theme.palette.success.light },
    { id: 4, name: "Seuil", min: 226, max: 265, color: theme.palette.success.main },
    { id: 5, name: "VO2 Max", min: 266, max: 305, color: theme.palette.warning.main },
    { id: 6, name: "Anaérobie", min: 306, max: 350, color: theme.palette.error.light },
    { id: 7, name: "Neuromuscul.", min: 351, max: 500, color: theme.palette.error.main }
  ];
  
  const weatherData = {
    current: {
      temp: 18,
      condition: "Ensoleillé",
      wind: 12,
      icon: <WbSunny />
    },
    forecast: [
      { day: "Lun", temp: 19, icon: <WbSunny />, condition: "Ensoleillé" },
      { day: "Mar", temp: 17, icon: <WbSunny />, condition: "Ensoleillé" },
      { day: "Mer", temp: 14, icon: <AcUnit />, condition: "Pluie" },
      { day: "Jeu", temp: 13, icon: <AcUnit />, condition: "Pluie" },
      { day: "Ven", temp: 16, icon: <WbSunny />, condition: "Nuageux" }
    ]
  };
  
  const recommendedTools = [
    {
      id: "training-zones",
      title: "Zones d'Entraînement",
      description: "Comprendre et visualiser vos zones de puissance",
      icon: <FitnessCenter sx={{ fontSize: 40 }} />,
      color: theme.palette.primary.main,
      path: "/training/zones"
    },
    {
      id: "col-simulator",
      title: "Simulateur de Cols",
      description: "Préparez-vous pour les cols de vos rêves",
      icon: <Terrain sx={{ fontSize: 40 }} />,
      color: theme.palette.secondary.main,
      path: "/training/simulator"
    },
    {
      id: "calendar",
      title: "Calendrier d'Entraînement",
      description: "Planifiez votre programme sur plusieurs semaines",
      icon: <Today sx={{ fontSize: 40 }} />,
      color: theme.palette.success.main,
      path: "/training/calendar"
    },
    {
      id: "progress",
      title: "Suivi de Progression",
      description: "Visualisez l'évolution de vos performances",
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      color: theme.palette.warning.main,
      path: "/training/progress"
    }
  ];
  
  // Gestionnaire de changement d'onglet
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Navigation vers les outils
  const navigateToTool = (path) => {
    navigate(path);
  };
  
  // Rendu des différents onglets du dashboard
  const renderTabContent = () => {
    switch (tabValue) {
      case 0:
        return renderDashboardTab();
      case 1:
        return renderTrainingZonesTab();
      case 2:
        return renderColSimulatorTab();
      case 3:
        return renderProgressTab();
      case 4:
        return renderCalendarTab();
      default:
        return renderDashboardTab();
    }
  };
  
  // Onglet principal du dashboard
  const renderDashboardTab = () => {
    return (
      <Grid container spacing={3}>
        {/* Widget d'entraînement du jour */}
        <Grid item xs={12} md={8}>
          <Card
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            sx={{ height: '100%' }}
          >
            <CardContent>
              <TodayTrainingWidget userProfile={userProfile} />
            </CardContent>
          </Card>
        </Grid>
        
        {/* Widget météo */}
        <Grid item xs={12} md={4}>
          <Card
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            sx={{ height: '100%' }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Météo Cycliste
                </Typography>
              </Box>
              
              {/* Météo actuelle */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: '50%', 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  mr: 2
                }}>
                  {weatherData.current.icon}
                </Box>
                
                <Box>
                  <Typography variant="h3" component="div">
                    {weatherData.current.temp}°
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {weatherData.current.condition}, {weatherData.current.wind} km/h
                  </Typography>
                </Box>
              </Box>
              
              {/* Prévisions */}
              <Typography variant="subtitle2" gutterBottom>
                Prévisions pour le vélo
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                {weatherData.forecast.map((day, index) => (
                  <Box key={index} sx={{ textAlign: 'center', px: 1 }}>
                    <Typography variant="body2">{day.day}</Typography>
                    <Box sx={{ color: day.temp >= 15 ? theme.palette.success.main : theme.palette.info.main }}>
                      {day.icon}
                    </Box>
                    <Typography variant="body2">{day.temp}°</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Progression hebdomadaire */}
        <Grid item xs={12}>
          <Card
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Progression Hebdomadaire
                </Typography>
                
                <Box>
                  <Chip 
                    label={`${userProfile.weeklyCompleted}/${userProfile.weeklyGoal}h`} 
                    color="primary" 
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip 
                    label={`${userProfile.weekProgress}%`} 
                    color={userProfile.weekProgress >= 60 ? "success" : "warning"} 
                    size="small"
                  />
                </Box>
              </Box>
              
              <LinearProgress 
                variant="determinate" 
                value={userProfile.weekProgress} 
                sx={{ 
                  height: 10, 
                  borderRadius: 5,
                  mb: 2
                }}
              />
              
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">TSS Total</Typography>
                    <Typography variant="h6">486</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Dénivelé</Typography>
                    <Typography variant="h6">1240 m</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Distance</Typography>
                    <Typography variant="h6">142 km</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Séances</Typography>
                    <Typography variant="h6">4/6</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Zones d'entraînement */}
        <Grid item xs={12}>
          <Card
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Vos Zones d'Entraînement
                </Typography>
                
                <Button 
                  variant="text" 
                  color="primary"
                  size="small"
                  onClick={() => navigateToTool("/training/zones")}
                >
                  Détails
                </Button>
              </Box>
              
              <Box sx={{ height: 200 }}>
                <React.Suspense fallback={<Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</Box>}>
                  <OptimizedZoneChart 
                    trainingZones={trainingZones}
                    userProfile={userProfile}
                    height={200}
                  />
                </React.Suspense>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Outils recommandés */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Outils d'Entraînement Recommandés
          </Typography>
          
          <Grid container spacing={2}>
            {recommendedTools.map((tool) => (
              <Grid item xs={12} sm={6} md={3} key={tool.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 6
                    }
                  }}
                  component={motion.div}
                  whileHover={{ scale: 1.02 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + parseInt(tool.id.split('-')[1]) * 0.1 }}
                  onClick={() => navigateToTool(tool.path)}
                >
                  <Box 
                    sx={{ 
                      height: 120, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: alpha(tool.color, 0.1)
                    }}
                  >
                    <Box 
                      sx={{ 
                        color: tool.color,
                        transform: 'scale(1.5)'
                      }}
                    >
                      {tool.icon}
                    </Box>
                  </Box>
                  
                  <CardContent>
                    <Typography variant="subtitle1" component="h3" gutterBottom>
                      {tool.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      {tool.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    );
  };
  
  // Onglet des zones d'entraînement
  const renderTrainingZonesTab = () => {
    // Dans une implémentation réelle, on aurait importé le composant EnhancedTrainingZones
    // et on l'afficherait ici directement
    const EnhancedTrainingZones = React.lazy(() => import('./EnhancedTrainingZones'));
    
    return (
      <Box>
        <React.Suspense fallback={<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>Chargement...</Box>}>
          <EnhancedTrainingZones userProfile={userProfile} />
        </React.Suspense>
      </Box>
    );
  };
  
  // Onglet du simulateur de cols
  const renderColSimulatorTab = () => {
    // Dans une implémentation réelle, on aurait importé le composant ColTrainingSimulator
    // et on l'afficherait ici directement
    const ColTrainingSimulator = React.lazy(() => import('./simulators/ColTrainingSimulator'));
    
    return (
      <Box>
        <React.Suspense fallback={<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>Chargement...</Box>}>
          <ColTrainingSimulator />
        </React.Suspense>
      </Box>
    );
  };
  
  // Onglet de progression
  const renderProgressTab = () => {
    return (
      <Box sx={{ textAlign: 'center', py: 5 }}>
        <FitnessCenter sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Suivi de Progression
        </Typography>
        <Typography variant="body1" paragraph>
          Cette section permettrait de visualiser l'évolution de vos performances au fil du temps.
        </Typography>
        <Button variant="contained" color="primary">
          Analyser mes performances
        </Button>
      </Box>
    );
  };
  
  // Onglet du calendrier
  const renderCalendarTab = () => {
    return (
      <Box sx={{ textAlign: 'center', py: 5 }}>
        <Today sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Calendrier d'Entraînement
        </Typography>
        <Typography variant="body1" paragraph>
          Cette section permettrait de planifier vos entraînements sur plusieurs semaines.
        </Typography>
        <Button variant="contained" color="primary">
          Créer un plan d'entraînement
        </Button>
      </Box>
    );
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ width: '100%', py: 3 }}>
        {/* En-tête */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            Dashboard d'Entraînement
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary"
            paragraph
          >
            Bienvenue dans votre espace d'entraînement personnel. Explorez les outils disponibles, suivez votre progression et créez des plans d'entraînement personnalisés.
          </Typography>
        </Box>
        
        {/* Onglets */}
        <Box sx={{ mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="onglets d'entraînement"
            sx={{
              '& .MuiTab-root': {
                minWidth: 130,
                fontWeight: 600,
              }
            }}
          >
            <Tab 
              icon={<DashboardIcon />} 
              label="Dashboard" 
              iconPosition="start"
            />
            <Tab 
              icon={<FitnessCenter />} 
              label="Zones d'Entraînement" 
              iconPosition="start"
            />
            <Tab 
              icon={<Terrain />} 
              label="Simulateur de Cols" 
              iconPosition="start"
            />
            <Tab 
              icon={<TrendingUp />} 
              label="Progression" 
              iconPosition="start"
            />
            <Tab 
              icon={<Today />} 
              label="Calendrier" 
              iconPosition="start"
            />
          </Tabs>
        </Box>
        
        {/* Contenu de l'onglet actif */}
        <Box sx={{ py: 2 }}>
          {renderTabContent()}
        </Box>
      </Box>
    </Container>
  );
};

export default TrainingDashboard;
