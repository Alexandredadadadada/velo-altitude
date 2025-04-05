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
  Error as ErrorIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import nutritionService from '../../services/nutritionService';
import trainingService from '../../services/trainingService';
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
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        setIntegrationStatus(prev => ({
          ...prev,
          loading: false,
          error: 'Une erreur est survenue lors de la récupération des données. Veuillez réessayer.'
        }));
      }
    };

    fetchData();
  }, [user]);

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
          description: 'Votre apport calorique dépasse vos besoins pour atteindre votre objectif de perte de poids. Envisagez de réduire votre apport de 200-300 kcal.',
          icon: <Info color="info" />
        });
      } else {
        recommendations.push({
          type: 'success',
          title: 'Équilibre calorique optimal',
          description: 'Votre apport calorique est bien adapté à votre charge d\'entraînement et vos objectifs.',
          icon: <Check color="success" />
        });
      }
    }
    
    // Vérifier la récupération et le risque de surentraînement
    if (training.recoveryScore && training.fatigueLevel) {
      if (training.recoveryScore < 30 && training.fatigueLevel > 7) {
        recommendations.push({
          type: 'error',
          title: 'Risque de surentraînement',
          description: 'Votre niveau de fatigue est élevé et votre récupération est faible. Augmentez votre apport en protéines (1.6-2g/kg) et en glucides les jours suivants, et envisagez une semaine de récupération.',
          icon: <ErrorIcon color="error" />
        });
      } else if (training.recoveryScore < 50) {
        recommendations.push({
          type: 'warning',
          title: 'Récupération compromise',
          description: 'Votre récupération est sous-optimale. Assurez-vous de consommer suffisamment de protéines après l\'effort (20-30g) et de glucides pour restaurer le glycogène musculaire.',
          icon: <Warning color="warning" />
        });
      }
    }
    
    // Recommandations spécifiques avant les événements importants
    if (training.upcomingEvents && training.upcomingEvents.length > 0) {
      const nextEvent = training.upcomingEvents[0];
      const daysUntilEvent = Math.ceil((new Date(nextEvent.date) - new Date()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilEvent <= 7) {
        recommendations.push({
          type: 'info',
          title: `Préparation pour ${nextEvent.name} (dans ${daysUntilEvent} jours)`,
          description: `Commencez votre charge en glucides 3 jours avant l'événement. Visez 8-10g/kg de poids corporel par jour pendant les 48h précédant l'effort.`,
          icon: <DirectionsBike color="primary" />
        });
      }
    }
    
    setRecommendations(recommendations);
  };

  // Synchroniser les données nutritionnelles avec le plan d'entraînement
  const handleSyncNutritionWithTraining = async () => {
    if (!user || !user.id || !nutritionData || !trainingData) return;
    
    try {
      setIntegrationStatus(prev => ({ ...prev, loading: true }));
      
      // Appel au service pour synchroniser les données
      const result = await nutritionService.syncWithTrainingPlan(
        user.id,
        nutritionData.id,
        trainingData.id
      );
      
      // Mettre à jour les données avec le résultat synchronisé
      setNutritionData(result.nutritionData);
      setTrainingData(result.trainingData);
      
      // Générer de nouvelles recommandations
      generateRecommendations(result.nutritionData, result.trainingData);
      
      setIntegrationStatus(prev => ({
        ...prev,
        loading: false,
        nutritionReady: true,
        trainingReady: true
      }));
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      setIntegrationStatus(prev => ({
        ...prev,
        loading: false,
        error: 'Échec de la synchronisation des données nutritionnelles avec le plan d\'entraînement.'
      }));
    }
  };

  // Gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Rendu des recommandations intégrées
  const renderRecommendations = () => {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recommandations personnalisées
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {recommendations.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Aucune recommandation disponible. Complétez votre profil nutritionnel et votre plan d'entraînement pour recevoir des conseils personnalisés.
            </Typography>
          ) : (
            <List>
              {recommendations.map((recommendation, index) => (
                <ListItem key={index} sx={{ bgcolor: recommendation.type === 'error' ? 'error.50' : recommendation.type === 'warning' ? 'warning.50' : recommendation.type === 'success' ? 'success.50' : 'info.50', mb: 1, borderRadius: 1 }}>
                  <ListItemIcon>
                    {recommendation.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={recommendation.title} 
                    secondary={recommendation.description} 
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    );
  };

  // Rendu du résumé nutritionnel
  const renderNutritionSummary = () => {
    if (!nutritionData) return null;
    
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Résumé nutritionnel
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocalFireDepartment color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Calories quotidiennes</Typography>
                  <Typography variant="h6">{nutritionData.dailyCalories} kcal</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Restaurant color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Glucides</Typography>
                  <Typography variant="h6">{nutritionData.macronutrients?.carbs?.grams}g ({nutritionData.macronutrients?.carbs?.percentage}%)</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FitnessCenter color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Protéines</Typography>
                  <Typography variant="h6">{nutritionData.macronutrients?.protein?.grams}g ({nutritionData.macronutrients?.protein?.percentage}%)</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Opacity color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Lipides</Typography>
                  <Typography variant="h6">{nutritionData.macronutrients?.fat?.grams}g ({nutritionData.macronutrients?.fat?.percentage}%)</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // Rendu du résumé d'entraînement
  const renderTrainingSummary = () => {
    if (!trainingData) return null;
    
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Résumé d'entraînement
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DirectionsBike color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Charge hebdomadaire</Typography>
                  <Typography variant="h6">{trainingData.weeklyLoad} TSS</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Speed color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Phase actuelle</Typography>
                  <Typography variant="h6">{trainingData.currentPhase}</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DirectionsBike color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Récupération</Typography>
                  <Typography variant="h6">{trainingData.recoveryScore}/100</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DirectionsBike color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">Prochain événement</Typography>
                  <Typography variant="h6">
                    {trainingData.upcomingEvents && trainingData.upcomingEvents.length > 0 
                      ? trainingData.upcomingEvents[0].name 
                      : 'Aucun'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
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
            Synchroniser
          </Button>
        </Box>
        
        <Typography variant="body1" paragraph>
          Optimisez votre nutrition en fonction de votre planification d'entraînement et recevez des recommandations personnalisées.
        </Typography>
        
        {integrationStatus.loading ? (
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
            
            {renderRecommendations()}
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {renderNutritionSummary()}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderTrainingSummary()}
              </Grid>
            </Grid>
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
