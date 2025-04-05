import React, { useState, useEffect, Suspense } from 'react';
import { 
  Container, 
  Grid, 
  Typography, 
  Paper, 
  Box, 
  Tabs, 
  Tab, 
  Card, 
  CardHeader, 
  CardContent, 
  Alert, 
  Button, 
  Divider,
  Routes,
  Route,
  useNavigate,
  useLocation
} from '@mui/material';
import { 
  CalendarMonth as CalendarIcon, 
  FitnessCenter as DumbbellIcon, 
  Timeline as ChartIcon, 
  Settings as UserSettingsIcon,
  DirectionsBike as BikeIcon, 
  Favorite as HeartbeatIcon, 
  Build as ToolboxIcon,
  FilterList as FilterIcon,
  FormatListBulleted as ListIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../components/common/NotificationSystem';

// Import de l'utilitaire de lazy loading
import { lazyLoad, LoadingFallback } from '../utils/lazyLoadHelper';

// Lazy load des composants d'entraînement
const TrainingModule = lazyLoad(() => import('../components/training/TrainingModule'), {
  moduleName: 'Module d\'entraînement',
  skeletonType: 'content'
});

const WorkoutLibrary = lazyLoad(() => import('../components/training/WorkoutLibrary'), {
  moduleName: 'Bibliothèque d\'entraînements',
  skeletonType: 'complex'
});

const HIITBuilder = lazyLoad(() => import('../components/training/HIITBuilder'), {
  moduleName: 'Générateur HIIT',
  skeletonType: 'content'
});

const HIITVisualizer = lazyLoad(() => import('../components/training/HIITVisualizer'), {
  moduleName: 'Visualiseur HIIT',
  skeletonType: 'content'
});

const CyclingCoach = lazyLoad(() => import('../components/coach/CyclingCoach'), {
  moduleName: 'Coach virtuel',
  skeletonType: 'complex'
});

const TrainingProgramsExplorer = lazyLoad(() => import('../components/training/TrainingProgramsExplorer'), {
  moduleName: 'Explorateur de programmes',
  skeletonType: 'complex',
  minDelay: 500
});

// Services et utilitaires
import UserService from '../services/UserService';
import TrainingSystem from '../services/TrainingSystem';

/**
 * Tableau de bord principal pour l'écosystème d'entraînement
 */
const TrainingDashboard = () => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    const path = location.pathname.split('/').pop();
    if (path === 'training') return 'overview';
    return path;
  });
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [trainingStats, setTrainingStats] = useState(null);
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [showVisualizer, setShowVisualizer] = useState(false);

  // Charger le profil utilisateur et les statistiques
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        // Simulation d'appel API
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Profil utilisateur (à remplacer par un appel réel à l'API)
        const mockUserProfile = {
          id: 'u123',
          name: 'Jean Dupont',
          age: 35,
          weight: 75,
          height: 182,
          ftp: 240,
          level: 'intermediate',
          cyclist_type: 'all-rounder',
          preferred_terrain: 'mixed',
          weekly_hours: 8,
          hrmax: 185,
          hrrest: 52,
          created_at: '2024-07-15'
        };
        
        setUserProfile(mockUserProfile);
        
        // Statistiques d'entraînement (à remplacer par des données réelles)
        setTrainingStats({
          totalWorkouts: 124,
          totalHours: 187,
          totalTSS: 9580,
          ftpProgress: [
            { date: '2025-01-01', value: 220 },
            { date: '2025-02-01', value: 230 },
            { date: '2025-03-01', value: 240 }
          ],
          weeklyVolume: [12, 8, 10, 6, 9, 11, 7, 12],
          lastWorkouts: [
            { id: 'w1', type: 'HIIT', name: 'Intervals 4x4', date: '2025-04-01', tss: 98 },
            { id: 'w2', type: 'ENDURANCE', name: 'Endurance longue', date: '2025-03-29', tss: 120 },
            { id: 'w3', type: 'THRESHOLD', name: 'Sweet Spot', date: '2025-03-27', tss: 85 }
          ]
        });
        
        // Plan hebdomadaire (à remplacer par des données réelles)
        setWeeklyPlan(generateWeeklyPlan(mockUserProfile));
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
        notify.error('Impossible de charger les données utilisateur');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [notify]);
  
  // Surveiller les changements de route pour mettre à jour l'onglet actif
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path === 'training') {
      setActiveTab('overview');
    } else if (['library', 'programs', 'hiitBuilder', 'coach'].includes(path)) {
      setActiveTab(path);
    }
  }, [location.pathname]);

  /**
   * Génère un plan hebdomadaire basé sur le profil utilisateur
   */
  const generateWeeklyPlan = (profile) => {
    if (!profile) return [];
    
    return TrainingSystem.generateWeeklyPlan(profile);
  };

  /**
   * Gestion de la sélection d'un entraînement
   */
  const handleSelectWorkout = (workout) => {
    setSelectedWorkout(workout);
    
    // Option: naviguer vers la page de détail
    // history.push(`/training/workout/${workout.id}`);
  };

  /**
   * Sauvegarder un entraînement
   */
  const handleSaveWorkout = (workout) => {
    try {
      // Logique de sauvegarde (à remplacer par un appel API)
      console.log('Sauvegarde de l\'entraînement:', workout);
      
      notify.success('Entraînement sauvegardé avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'entraînement:', error);
      notify.error('Erreur lors de la sauvegarde');
      return false;
    }
  };

  /**
   * Visualiser un entraînement
   */
  const handlePreviewWorkout = (workout) => {
    setSelectedWorkout(workout);
    setShowVisualizer(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Terminer un entraînement
   */
  const handleWorkoutComplete = (stats) => {
    // Traiter les statistiques d'entraînement
    console.log('Workout completed with stats:', stats);
    
    // Notification de succès
    notify.success(t('training.workout_completed'));
    
    // Retour à la bibliothèque
    setSelectedWorkout(null);
    setShowVisualizer(false);
  };
  
  /**
   * Gestion du changement d'onglet
   */
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    navigate(`/training/${newValue === 'overview' ? '' : newValue}`);
  };
  
  /**
   * Gestion de la sélection d'un programme d'entraînement
   */
  const handleSelectProgram = (program) => {
    console.log('Selected program:', program);
    
    // TODO: Implémenter l'ajout au calendrier ou autre action
    notify.success(t('training.program_selected', { name: program.title }));
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label={t('training.navigation')}
        >
          <Tab 
            value="overview"
            label={t('training.overview')} 
            icon={<BikeIcon />} 
            iconPosition="start"
          />
          <Tab 
            value="programs"
            label={t('training.programs')} 
            icon={<FilterIcon />} 
            iconPosition="start"
          />
          <Tab 
            value="library"
            label={t('training.workout_library')} 
            icon={<ListIcon />} 
            iconPosition="start"
          />
          <Tab 
            value="hiitBuilder"
            label={t('training.hiit_builder')} 
            icon={<ToolboxIcon />}
            iconPosition="start" 
          />
          <Tab 
            value="coach"
            label={t('training.coach')} 
            icon={<HeartbeatIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>
      
      <Routes>
        <Route path="/" element={
          <Box>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <Typography>{t('common.loading')}...</Typography>
              </Box>
            ) : (
              <Grid container spacing={4}>
                <Grid item xs={12} md={8}>
                  <Card sx={{ mb: 4 }}>
                    <CardHeader
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarIcon sx={{ mr: 1 }} />
                          {t('training.weekly_plan')}
                        </Box>
                      }
                    />
                    <CardContent>
                      {userProfile ? (
                        <Box>
                          {weeklyPlan.length > 0 ? (
                            weeklyPlan.map((day, index) => (
                              <Paper
                                key={index}
                                elevation={0}
                                variant="outlined"
                                sx={{ p: 2, mb: 2 }}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {day.day}
                                  </Typography>
                                  {day.workout ? (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => handleSelectWorkout(day.workout)}
                                    >
                                      {t('training.view_details')}
                                    </Button>
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">
                                      {t('training.rest_day')}
                                    </Typography>
                                  )}
                                </Box>
                                {day.workout && (
                                  <>
                                    <Typography variant="body1">
                                      {day.workout.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                      <DumbbellIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                      <Typography variant="body2" color="text.secondary">
                                        {day.workout.type} • {day.workout.duration} min • {day.workout.intensity}
                                      </Typography>
                                    </Box>
                                  </>
                                )}
                              </Paper>
                            ))
                          ) : (
                            <Alert severity="info">
                              {t('training.no_plan_available')}
                            </Alert>
                          )}
                          
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button
                              variant="outlined"
                              startIcon={<CalendarIcon />}
                              onClick={() => setWeeklyPlan(generateWeeklyPlan(userProfile))}
                            >
                              {t('training.regenerate_plan')}
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Alert severity="warning">
                          {t('training.profile_incomplete')}
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardHeader
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <UserSettingsIcon sx={{ mr: 1 }} />
                          {t('training.profile')}
                        </Box>
                      }
                    />
                    <CardContent>
                      {userProfile ? (
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {userProfile.name}
                          </Typography>
                          
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                {t('training.profile.level')}
                              </Typography>
                              <Typography variant="body1">
                                {t(`training.levels.${userProfile.level}`)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                {t('training.profile.ftp')}
                              </Typography>
                              <Typography variant="body1">
                                {userProfile.ftp} W
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                {t('training.profile.cyclist_type')}
                              </Typography>
                              <Typography variant="body1">
                                {t(`training.cyclist_types.${userProfile.cyclist_type}`)}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">
                                {t('training.profile.weekly_hours')}
                              </Typography>
                              <Typography variant="body1">
                                {userProfile.weekly_hours} h
                              </Typography>
                            </Grid>
                          </Grid>
                          
                          <Button
                            variant="outlined"
                            fullWidth
                            component="a"
                            href="/profile/settings"
                          >
                            {t('training.edit_profile')}
                          </Button>
                        </Box>
                      ) : (
                        <Alert severity="warning">
                          {t('training.profile_incomplete')}
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card sx={{ mt: 3 }}>
                    <CardHeader
                      title={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ChartIcon sx={{ mr: 1 }} />
                          {t('training.stats_title')}
                        </Box>
                      }
                    />
                    <CardContent>
                      {trainingStats ? (
                        <Box>
                          <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {t('training.stats.workouts')}
                              </Typography>
                              <Typography variant="h6">
                                {trainingStats.totalWorkouts}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {t('training.stats.hours')}
                              </Typography>
                              <Typography variant="h6">
                                {trainingStats.totalHours}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {t('training.stats.tss')}
                              </Typography>
                              <Typography variant="h6">
                                {trainingStats.totalTSS}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {t('training.stats.ftp_progress')}
                              </Typography>
                              <Typography variant="h6" color="success.main">
                                +{trainingStats.ftpProgress[trainingStats.ftpProgress.length - 1].value - 
                                  trainingStats.ftpProgress[0].value} W
                              </Typography>
                            </Grid>
                          </Grid>
                          
                          <Button 
                            variant="outlined" 
                            fullWidth
                            href="/visualizations"
                          >
                            {t('training.view_detailed_analytics')}
                          </Button>
                        </Box>
                      ) : (
                        <Alert severity="info">
                          {t('training.no_stats_available')}
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        } />
        <Route path="/programs" element={
          <Suspense fallback={<LoadingFallback moduleName="Explorateur de programmes" />}>
            <TrainingProgramsExplorer 
              userProfile={userProfile} 
              onProgramSelect={handleSelectProgram} 
            />
          </Suspense>
        } />
        <Route path="/library" element={
          <Suspense fallback={<LoadingFallback moduleName="Bibliothèque d'entraînements" />}>
            <WorkoutLibrary 
              userProfile={userProfile}
              onSelectWorkout={handleSelectWorkout}
              onSaveWorkout={handleSaveWorkout}
            />
          </Suspense>
        } />
        <Route path="/hiitBuilder" element={
          <Suspense fallback={<LoadingFallback moduleName="Générateur HIIT" />}>
            <HIITBuilder 
              userProfile={userProfile}
              onSaveWorkout={handleSaveWorkout}
              onPreviewWorkout={handlePreviewWorkout}
            />
          </Suspense>
        } />
        <Route path="/coach" element={
          <Suspense fallback={<LoadingFallback moduleName="Coach virtuel" />}>
            <CyclingCoach 
              userProfile={userProfile}
              onRecommendWorkout={handlePreviewWorkout}
            />
          </Suspense>
        } />
      </Routes>
      
      {/* HIIT Visualizer Dialog (ne dépend pas des routes) */}
      {showVisualizer && selectedWorkout && (
        <Suspense fallback={<LoadingFallback moduleName="Visualiseur HIIT" />}>
          <HIITVisualizer
            workout={selectedWorkout}
            open={showVisualizer}
            onClose={() => setShowVisualizer(false)}
            onWorkoutComplete={handleWorkoutComplete}
          />
        </Suspense>
      )}
    </Container>
  );
};

export default TrainingDashboard;
