import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Button,
  useTheme,
  Divider,
  Chip,
  Tooltip
} from '@mui/material';
import { 
  Directions as DirectionsIcon,
  DirectionsBike as DirectionsBikeIcon,
  LocalFireDepartment as LocalFireDepartmentIcon,
  FitnessCenter as FitnessCenterIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarTodayIcon,
  Info as InfoIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import { APIOrchestrator } from '../../../api/orchestration';
import CalorieBurnChart from './sync/CalorieBurnChart';
import TrainingSession from './sync/TrainingSession';
import NutritionRecommendations from './sync/NutritionRecommendations';

// Interface pour les propriétés du composant
interface NutritionTrainingSyncProps {
  nutritionPlan?: any;
}

// Interface TabPanel pour les onglets
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Composant TabPanel 
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`training-sync-tabpanel-${index}`}
      aria-labelledby={`training-sync-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const NutritionTrainingSync: React.FC<NutritionTrainingSyncProps> = ({ nutritionPlan }) => {
  const theme = useTheme();
  
  // États
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainingSessions, setTrainingSessions] = useState<any[]>([]);
  const [nutritionRecommendations, setNutritionRecommendations] = useState<any | null>(null);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [stravaData, setStravaData] = useState<any | null>(null);
  
  // Récupération des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const api = new APIOrchestrator();
        
        // Vérifier si Strava est connecté
        const stravaStatus = await api.checkStravaConnection();
        setStravaConnected(stravaStatus.connected);
        
        // Récupérer les séances d'entraînement à venir
        const sessions = await api.getUpcomingTrainingSessions();
        setTrainingSessions(sessions);
        
        // Récupérer les données Strava si connecté
        if (stravaStatus.connected) {
          const stravaActivities = await api.getStravaActivities();
          setStravaData(stravaActivities);
        }
        
        // Récupérer les recommandations nutritionnelles selon l'entraînement
        const recommendations = await api.getNutritionTrainingRecommendations(nutritionPlan?.id);
        setNutritionRecommendations(recommendations);
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération des données:', err);
        setError('Impossible de charger les données. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [nutritionPlan]);

  // Gestion du changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Connexion à Strava
  const handleStravaConnect = async () => {
    try {
      const api = new APIOrchestrator();
      const authUrl = await api.getStravaAuthUrl();
      window.location.href = authUrl;
    } catch (err) {
      console.error('Erreur lors de la connexion à Strava:', err);
      setError('Impossible de se connecter à Strava. Veuillez réessayer plus tard.');
    }
  };

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SyncIcon color="primary" />
          Synchronisation Nutrition & Entraînement
        </Typography>
        
        {!stravaConnected ? (
          <Button 
            variant="contained" 
            color="warning" 
            startIcon={<DirectionsBikeIcon />}
            onClick={handleStravaConnect}
          >
            Connecter Strava
          </Button>
        ) : (
          <Chip 
            icon={<DirectionsBikeIcon />} 
            label="Strava connecté" 
            color="success" 
            variant="outlined" 
          />
        )}
      </Box>
      
      {error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Tabs de navigation */}
          <Paper sx={{ borderRadius: 2 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab 
                icon={<CalendarTodayIcon />} 
                label="Séances à venir" 
                id="training-sync-tab-0"
                aria-controls="training-sync-tabpanel-0"
              />
              <Tab 
                icon={<TrendingUpIcon />} 
                label="Dépenses énergétiques" 
                id="training-sync-tab-1"
                aria-controls="training-sync-tabpanel-1"
              />
              <Tab 
                icon={<LocalFireDepartmentIcon />} 
                label="Recommandations" 
                id="training-sync-tab-2"
                aria-controls="training-sync-tabpanel-2"
              />
            </Tabs>
            
            {/* Panneau: Séances à venir */}
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ p: 3 }}>
                {trainingSessions.length === 0 ? (
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 4, 
                      textAlign: 'center',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body1" paragraph>
                      Aucune séance d'entraînement programmée pour les prochains jours.
                    </Typography>
                    <Button 
                      variant="contained" 
                      component="a"
                      href="/entrainement/programmes"
                    >
                      Voir les programmes d'entraînement
                    </Button>
                  </Paper>
                ) : (
                  <Grid container spacing={3}>
                    {trainingSessions.map((session) => (
                      <Grid item xs={12} key={session.id}>
                        <TrainingSession 
                          session={session}
                          nutritionPlan={nutritionPlan}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            </TabPanel>
            
            {/* Panneau: Dépenses énergétiques */}
            <TabPanel value={activeTab} index={1}>
              <Box sx={{ p: 3 }}>
                {!stravaConnected ? (
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 4, 
                      textAlign: 'center',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body1" paragraph>
                      Connectez votre compte Strava pour visualiser vos dépenses énergétiques réelles.
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="warning"
                      startIcon={<DirectionsBikeIcon />}
                      onClick={handleStravaConnect}
                    >
                      Connecter Strava
                    </Button>
                  </Paper>
                ) : (
                  <CalorieBurnChart 
                    stravaData={stravaData}
                    nutritionData={nutritionRecommendations}
                  />
                )}
              </Box>
            </TabPanel>
            
            {/* Panneau: Recommandations */}
            <TabPanel value={activeTab} index={2}>
              <Box sx={{ p: 3 }}>
                <NutritionRecommendations 
                  recommendations={nutritionRecommendations}
                  trainingSessions={trainingSessions}
                  nutritionPlan={nutritionPlan}
                />
              </Box>
            </TabPanel>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default NutritionTrainingSync;
