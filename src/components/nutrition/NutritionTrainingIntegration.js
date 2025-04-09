import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  DirectionsBike,
  Restaurant,
  Speed,
  LocalFireDepartment,
  FitnessCenter,
  Sync,
  ArrowForward,
  Info,
  Check,
  Warning,
  Error as ErrorIcon,
  WaterDrop,
  Notifications
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import nutritionService from '../../services/nutritionService';
import trainingService from '../../services/trainingService';
import trainingNutritionSync from '../../services/orchestration/TrainingNutritionSync';
import dataValidator from '../../services/orchestration/DataValidator';
import stateManager from '../../services/orchestration/StateManager';
import { useNutritionTraining } from '../../hooks/useNutritionTraining';
import NutritionCalculator from './NutritionCalculator';
import MealPlanner from './MealPlanner';

/**
 * Composant d'intégration entre le calculateur nutritionnel, le planificateur de repas
 * et le tableau de bord d'entraînement pour une expérience utilisateur cohérente
 */
const NutritionTrainingIntegration = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [nutritionData, setNutritionData] = useState(null);
  const [trainingData, setTrainingData] = useState(null);
  const [integrationStatus, setIntegrationStatus] = useState({
    loading: true,
    error: null,
    nutritionReady: false,
    trainingReady: false
  });
  const [recommendations, setRecommendations] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [syncDetails, setSyncDetails] = useState(null);
  
  // Utiliser notre hook personnalisé pour la gestion de l'intégration
  const nutritionTraining = useNutritionTraining(user?.id, { autoLoad: true });

  // Récupérer les données nutritionnelles et d'entraînement
  useEffect(() => {
    if (!user || !user.id) return;

    const fetchData = async () => {
      try {
        setIntegrationStatus(prev => ({ ...prev, loading: true, error: null }));
        
        // Récupération parallèle des données nutritionnelles et d'entraînement
        const [nutritionResult, trainingResult] = await Promise.all([
          nutritionService.getUserNutritionData(user.id),
          trainingService.getUserTrainingData(user.id)
        ]);
        
        setNutritionData(nutritionResult);
        setTrainingData(trainingResult);
        
        // Mettre à jour le gestionnaire d'état
        stateManager.updateNutritionState(nutritionResult);
        stateManager.updateTrainingState(trainingResult);
        
        // Vérifier si les deux ensembles de données sont prêts
        setIntegrationStatus(prev => ({
          ...prev,
          nutritionReady: !!nutritionResult,
          trainingReady: !!trainingResult,
          loading: false
        }));
        
        // Générer des recommandations basées sur les deux ensembles de données
        if (nutritionResult && trainingResult) {
          generateRecommendations(nutritionResult, trainingResult);
          
          // Valider la compatibilité des données
          const compatibilityCheck = dataValidator.validateCompatibility(
            nutritionResult,
            trainingResult
          );
          
          setValidationResults(compatibilityCheck);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        setIntegrationStatus(prev => ({
          ...prev,
          loading: false,
          error: 'Une erreur est survenue lors de la récupération des données. Veuillez réessayer.'
        }));
        
        // Mettre à jour le gestionnaire d'état
        stateManager.syncError(error);
      }
    };

    fetchData();
  }, [user]);

  // Synchroniser avec les états du hook personnalisé
  useEffect(() => {
    if (nutritionTraining.nutritionData) {
      setNutritionData(nutritionTraining.nutritionData);
    }
    
    if (nutritionTraining.trainingData) {
      setTrainingData(nutritionTraining.trainingData);
    }
    
    if (nutritionTraining.recommendations.length > 0) {
      setRecommendations(nutritionTraining.recommendations);
    }
    
    // Mettre à jour l'état d'intégration
    setIntegrationStatus(prev => ({
      ...prev,
      loading: nutritionTraining.isLoading,
      error: nutritionTraining.error,
      nutritionReady: !!nutritionTraining.nutritionData,
      trainingReady: !!nutritionTraining.trainingData
    }));
  }, [nutritionTraining]);

  // Générer des recommandations personnalisées basées sur les données nutritionnelles et d'entraînement
  const generateRecommendations = (nutrition, training) => {
    const recommendations = [];
    
    // Vérifier l'équilibre calorique par rapport à la charge d'entraînement
    if (nutrition.dailyCalories && training.weeklyLoad) {
      const dailyTrainingBurn = training.weeklyLoad / 7;
      const calorieBalance = nutrition.dailyCalories - dailyTrainingBurn;
      
      if (training.goal === 'performance' && calorieBalance < 0) {
        recommendations.push({
          type: 'warning',
          title: 'Déficit calorique',
          description: 'Votre apport calorique actuel pourrait être insuffisant pour soutenir votre charge d\'entraînement. Envisagez d\'augmenter votre apport de 300-500 kcal les jours d\'entraînement.',
          icon: <Warning color="warning" />
        });
      } else if (training.goal === 'weightLoss' && calorieBalance > 0) {
        recommendations.push({
          type: 'info',
          title: 'Surplus calorique',
          description: 'Votre apport calorique est supérieur à vos dépenses, ce qui peut ralentir votre perte de poids. Considérez une réduction modérée ou une augmentation de l\'intensité d\'entraînement.',
          icon: <Info color="info" />
        });
      }
    }
    
    // Recommandations sur les protéines
    if (nutrition.metrics && nutrition.metrics.weight && nutrition.macroDistribution) {
      const weight = nutrition.metrics.weight;
      const proteinIntake = (nutrition.dailyCalories * (nutrition.macroDistribution.protein / 100)) / 4; // g de protéines
      const proteinPerKg = proteinIntake / weight;
      
      if (training.goal === 'strength' && proteinPerKg < 1.6) {
        recommendations.push({
          type: 'info',
          title: 'Apport en protéines',
          description: `Pour un objectif de force/puissance, un apport de 1.6-2.0g de protéines par kg de poids corporel est recommandé. Votre apport actuel est d'environ ${proteinPerKg.toFixed(1)}g/kg.`,
          icon: <Info color="info" />
        });
      }
    }
    
    // Recommandations d'hydratation
    if (training.weeklyVolume && training.weeklyVolume > 10) { // Plus de 10 heures d'entraînement par semaine
      recommendations.push({
        type: 'info',
        title: 'Hydratation',
        description: 'Avec votre volume d\'entraînement élevé, assurez-vous de consommer 3-4L d\'eau par jour, avec un supplément d\'électrolytes lors des entraînements de plus de 90 minutes.',
        icon: <WaterDrop color="info" />
      });
    }
    
    // Recommandations sur le timing nutritionnel
    if (training.upcomingWorkouts && training.upcomingWorkouts.length > 0) {
      const nextWorkout = training.upcomingWorkouts[0];
      const intensityTypes = ['threshold', 'interval', 'vo2max'];
      const isHighIntensity = intensityTypes.includes(nextWorkout.type);
      
      if (isHighIntensity) {
        recommendations.push({
          type: 'info',
          title: 'Préparation séance intense',
          description: `Pour votre prochaine séance ${nextWorkout.name} (${nextWorkout.scheduledDate}), prévoyez un repas riche en glucides 2-3h avant, et une collation de récupération avec protéines et glucides dans les 30min après l'effort.`,
          icon: <FitnessCenter color="primary" />
        });
      }
    }
    
    setRecommendations(recommendations);
  };

  // Synchroniser les données nutritionnelles avec le plan d'entraînement
  const handleSyncNutritionWithTraining = async () => {
    if (!trainingData || !nutritionData) {
      return;
    }

    try {
      // Indiquer le début de la synchronisation
      setIntegrationStatus(prev => ({ ...prev, loading: true, error: null }));
      stateManager.beginSync();
      
      // Appeler le service de synchronisation
      const syncResult = await trainingNutritionSync.updateNutritionPlan(trainingData);
      
      // Mettre à jour les données nutritionnelles et l'état de synchronisation
      setNutritionData(syncResult.nutritionPlan);
      setSyncDetails(syncResult.syncDetails);
      stateManager.syncSuccess(syncResult);
      
      // Générer de nouvelles recommandations
      generateRecommendations(syncResult.nutritionPlan, trainingData);
      
      // Mettre à jour l'état d'intégration
      setIntegrationStatus(prev => ({
        ...prev,
        loading: false,
        nutritionReady: true,
        error: null
      }));
      
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      
      setIntegrationStatus(prev => ({
        ...prev,
        loading: false,
        error: 'Échec de la synchronisation: ' + error.message
      }));
      
      stateManager.syncError(error);
    }
  };

  // Gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Rendu des recommandations intégrées
  const renderRecommendations = () => {
    if (recommendations.length === 0) {
      return (
        <Alert severity="info" sx={{ mb: 3 }}>
          Aucune recommandation disponible. Synchronisez vos données pour obtenir des conseils personnalisés.
        </Alert>
      );
    }

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Recommandations Personnalisées</Typography>
        <Grid container spacing={2}>
          {recommendations.map((rec, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Alert 
                severity={rec.type === 'warning' ? 'warning' : 'info'} 
                icon={rec.icon || undefined}
                sx={{ height: '100%' }}
              >
                <AlertTitle>{rec.title}</AlertTitle>
                {rec.description}
              </Alert>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  // Rendu du résumé nutritionnel
  const renderNutritionSummary = () => {
    if (!nutritionData) {
      return (
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6">Profil Nutritionnel</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}>
              <Typography variant="body2" color="text.secondary">
                Aucune donnée nutritionnelle disponible
              </Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6">Profil Nutritionnel</Typography>
          <Divider sx={{ my: 1.5 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Restaurant color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Calories quotidiennes</Typography>
                  <Typography variant="h6">{nutritionData.dailyCalories || 'N/A'} kcal</Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Restaurant color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Objectif</Typography>
                  <Typography variant="h6">{nutritionData.goals?.type || 'Non défini'}</Typography>
                </Box>
              </Box>
            </Grid>
            
            {nutritionData.macroDistribution && (
              <>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Glucides</Typography>
                      <Typography variant="h6">{nutritionData.macroDistribution.carbs || 0}%</Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Protéines</Typography>
                      <Typography variant="h6">{nutritionData.macroDistribution.protein || 0}%</Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Lipides</Typography>
                      <Typography variant="h6">{nutritionData.macroDistribution.fat || 0}%</Typography>
                    </Box>
                  </Box>
                </Grid>
              </>
            )}
            
            {syncDetails && (
              <Grid item xs={12}>
                <Alert severity="success" sx={{ mt: 1 }}>
                  <AlertTitle>Synchronisation réussie</AlertTitle>
                  <Typography variant="body2">
                    {syncDetails.message || 'Plan nutritionnel adapté à votre entraînement'}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // Rendu du résumé d'entraînement
  const renderTrainingSummary = () => {
    if (!trainingData) {
      return (
        <Card variant="outlined" sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6">Plan d'Entraînement</Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '150px' }}>
              <Typography variant="body2" color="text.secondary">
                Aucun plan d'entraînement disponible
              </Typography>
            </Box>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6">Plan d'Entraînement</Typography>
          <Divider sx={{ my: 1.5 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DirectionsBike color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Charge hebdomadaire</Typography>
                  <Typography variant="h6">{trainingData.weeklyLoad || 'N/A'} TSS</Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DirectionsBike color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Objectif</Typography>
                  <Typography variant="h6">{trainingData.goal || 'Non défini'}</Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DirectionsBike color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Volume hebdomadaire</Typography>
                  <Typography variant="h6">{trainingData.weeklyVolume || 0} heures</Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DirectionsBike color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Récupération</Typography>
                  <Typography variant="h6">{trainingData.recoveryScore}/100</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Prochain entraînement</Typography>
              {trainingData.upcomingWorkouts && trainingData.upcomingWorkouts.length > 0 ? (
                <Box sx={{ mt: 1, border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
                  <Typography variant="body2" fontWeight="bold">
                    {trainingData.upcomingWorkouts[0].name}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {trainingData.upcomingWorkouts[0].scheduledDate}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {trainingData.upcomingWorkouts[0].duration} min
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aucun entraînement planifié
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // Rendu des résultats de validation
  const renderValidationResults = () => {
    if (!validationResults) return null;
    
    const { isCompatible, issues, suggestions } = validationResults;
    
    if (isCompatible && suggestions.length === 0) return null;
    
    return (
      <Box sx={{ mb: 3 }}>
        <Alert severity={isCompatible ? "info" : "warning"}>
          <AlertTitle>
            {isCompatible ? "Suggestions d'optimisation" : "Points d'attention"}
          </AlertTitle>
          
          {issues && issues.length > 0 && (
            <List dense disablePadding>
              {issues.map((issue, idx) => (
                <ListItem key={`issue-${idx}`} sx={{ py: 0 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <Warning fontSize="small" color="warning" />
                  </ListItemIcon>
                  <ListItemText primary={issue} />
                </ListItem>
              ))}
            </List>
          )}
          
          {suggestions && suggestions.length > 0 && (
            <List dense disablePadding sx={{ mt: issues && issues.length ? 1 : 0 }}>
              {suggestions.map((suggestion, idx) => (
                <ListItem key={`suggestion-${idx}`} sx={{ py: 0 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <Info fontSize="small" color="info" />
                  </ListItemIcon>
                  <ListItemText primary={suggestion} />
                </ListItem>
              ))}
            </List>
          )}
        </Alert>
      </Box>
    );
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Intégration Nutrition & Entraînement</Typography>
          <Button
            variant="contained"
            startIcon={<Sync />}
            onClick={handleSyncNutritionWithTraining}
            disabled={integrationStatus.loading || !nutritionData || !trainingData}
          >
            {integrationStatus.loading ? <CircularProgress size={24} color="inherit" /> : 'Synchroniser'}
          </Button>
        </Box>
        
        <Typography variant="body1" paragraph>
          Optimisez votre nutrition en fonction de votre planification d'entraînement et recevez des recommandations personnalisées.
        </Typography>
        
        {integrationStatus.loading && !nutritionData && !trainingData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : integrationStatus.error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {integrationStatus.error}
          </Alert>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              <Chip 
                icon={<Check />} 
                label="Calcul nutritionnel" 
                color={integrationStatus.nutritionReady ? "success" : "default"} 
                variant={integrationStatus.nutritionReady ? "filled" : "outlined"} 
              />
              <ArrowForward sx={{ mx: 1 }} />
              <Chip 
                icon={<Check />} 
                label="Plan d'entraînement" 
                color={integrationStatus.trainingReady ? "success" : "default"} 
                variant={integrationStatus.trainingReady ? "filled" : "outlined"} 
              />
              <ArrowForward sx={{ mx: 1 }} />
              <Chip 
                icon={<Check />} 
                label="Recommandations" 
                color={recommendations.length > 0 ? "success" : "default"} 
                variant={recommendations.length > 0 ? "filled" : "outlined"} 
              />
            </Box>
            
            {renderValidationResults()}
            {renderRecommendations()}
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {renderNutritionSummary()}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderTrainingSummary()}
              </Grid>
            </Grid>
            
            {trainingData && trainingData.upcomingWorkouts && trainingData.upcomingWorkouts.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<Notifications />}
                  onClick={() => nutritionTraining.getRecommendationsForWorkout(trainingData.upcomingWorkouts[0].id)}
                  disabled={nutritionTraining.isLoading}
                >
                  Obtenir des recommandations détaillées pour le prochain entraînement
                </Button>
              </Box>
            )}
          </>
        )}
      </Paper>
      
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Calculateur nutritionnel" />
        <Tab label="Planificateur de repas" />
      </Tabs>
      
      {activeTab === 0 && (
        <NutritionCalculator />
      )}
      
      {activeTab === 1 && (
        <MealPlanner nutritionData={nutritionData} userId={user?.id} />
      )}
    </Box>
  );
};

export default NutritionTrainingIntegration;
