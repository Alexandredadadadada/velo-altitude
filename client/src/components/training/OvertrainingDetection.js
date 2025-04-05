import React, { useState, useEffect } from 'react';
import { 
  Paper, Typography, Box, Alert, AlertTitle, 
  List, ListItem, ListItemIcon, ListItemText,
  LinearProgress, Divider, Button, Accordion,
  AccordionSummary, AccordionDetails, Chip, Grid,
  Card, CardContent, Tooltip
} from '@mui/material';
import { 
  Warning, DirectionsBike, Error, CheckCircle,
  Sleep, SportsScore, Restaurant, Battery20,
  ExpandMore, Insights, TrendingDown, LocalFireDepartment,
  FitnessCenter, Opacity, WaterDrop, EmojiFoodBeverage,
  EggAlt, Monitor, Cake, Bolt
} from '@mui/icons-material';
import trainingService from '../../services/trainingService';
import nutritionService from '../../services/nutritionService';

/**
 * Composant de détection de surmenage et recommandations de récupération
 * Analyse les habitudes d'entraînement pour alerter sur les risques de surmenage
 */
const OvertrainingDetection = ({ userId, recentActivities, nutritionData }) => {
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [overtrainingData, setOvertrainingData] = useState(null);
  const [recoveryExpanded, setRecoveryExpanded] = useState(false);
  const [nutritionExpanded, setNutritionExpanded] = useState(false);
  const [integratedAnalysis, setIntegratedAnalysis] = useState(null);

  useEffect(() => {
    if (userId && recentActivities && recentActivities.length > 0) {
      analyzeTrainingLoad();
      
      // Créer une analyse intégrée nutrition-entraînement si les deux ensembles de données sont disponibles
      if (nutritionData && overtrainingData) {
        // Cet état pourrait être utilisé pour afficher des recommandations intégrées supplémentaires
        setIntegratedAnalysis({
          overtraining: overtrainingData,
          nutrition: nutritionData
        });
      }
    }
  }, [userId, recentActivities, nutritionData]);

  // Analyser la charge d'entraînement pour détecter le surmenage
  const analyzeTrainingLoad = async () => {
    try {
      setLoadingAnalysis(true);
      
      // En production, remplacer par un appel API réel
      // const analysis = await trainingService.getOvertrainingAnalysis(userId);
      
      // Simulation d'analyse pour démonstration
      const analysis = simulateOvertrainingAnalysis(recentActivities);
      
      setOvertrainingData(analysis);
    } catch (error) {
      console.error("Erreur lors de l'analyse du surmenage:", error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Simulation d'analyse pour démonstration
  const simulateOvertrainingAnalysis = (activities) => {
    // Calculer la charge d'entraînement des 7 derniers jours
    const last7DaysActivities = activities
      .filter(a => new Date(a.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    // Calculer la charge d'entraînement des 7 jours précédents
    const previous7DaysActivities = activities
      .filter(a => {
        const activityDate = new Date(a.date);
        return activityDate >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) 
            && activityDate < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      });
    
    // Calculer l'intensité moyenne sur les deux périodes
    const currentIntensity = last7DaysActivities.reduce((sum, a) => sum + (a.heartRateAvg || 0), 0) / 
      (last7DaysActivities.length || 1);
    const previousIntensity = previous7DaysActivities.reduce((sum, a) => sum + (a.heartRateAvg || 0), 0) / 
      (previous7DaysActivities.length || 1);
    
    // Calculer le volume total (en minutes)
    const currentVolume = last7DaysActivities.reduce((sum, a) => sum + (a.duration || 0), 0) / 60;
    const previousVolume = previous7DaysActivities.reduce((sum, a) => sum + (a.duration || 0), 0) / 60;
    
    // Calculer le ratio aigu:chronique (ACWR)
    const acwrVolume = previous7DaysActivities.length > 0 ? currentVolume / previousVolume : 1;
    
    // Analyser les données nutritionnelles si disponibles
    const nutritionAssessment = nutritionData ? analyzeNutritionalStatus(nutritionData, currentVolume) : null;
    
    // Générer les signaux de surmenage
    const signals = [];
    
    if (acwrVolume > 1.5) {
      signals.push({
        type: 'critical',
        title: 'Augmentation brutale du volume',
        description: `Augmentation de ${((acwrVolume - 1) * 100).toFixed(0)}% du temps d'entraînement par rapport à la semaine précédente`,
        icon: <TrendingDown />
      });
    } else if (acwrVolume > 1.3) {
      signals.push({
        type: 'warning',
        title: "Volume d'entraînement élevé",
        description: `Augmentation de ${((acwrVolume - 1) * 100).toFixed(0)}% du temps d'entraînement par rapport à la semaine précédente`,
        icon: <Insights />
      });
    }
    
    // Vérifier la fréquence des entraînements intensifs
    const intenseWorkouts = last7DaysActivities.filter(a => (a.intensity || 0) > 7);
    if (intenseWorkouts.length > 3) {
      signals.push({
        type: 'critical',
        title: 'Trop d\'entraînements intensifs',
        description: `${intenseWorkouts.length} séances intensives en 7 jours sans récupération suffisante`,
        icon: <Battery20 />
      });
    }
    
    // Vérifier les jours de repos
    const last7Days = [...Array(7)].map((_, i) => new Date(Date.now() - i * 24 * 60 * 60 * 1000));
    const trainingDates = last7DaysActivities.map(a => new Date(a.date).toDateString());
    const restDays = last7Days.filter(date => !trainingDates.includes(date.toDateString()));
    
    if (restDays.length < 2) {
      signals.push({
        type: 'warning',
        title: 'Récupération insuffisante',
        description: 'Moins de 2 jours de repos complet dans la semaine',
        icon: <Sleep />
      });
    }
    
    // Ajouter des signaux basés sur les données nutritionnelles si disponibles
    if (nutritionData && nutritionAssessment) {
      if (nutritionAssessment.proteinDeficit) {
        signals.push({
          type: 'warning',
          title: 'Apport insuffisant en protéines',
          description: `Votre apport quotidien en protéines de ${nutritionAssessment.currentProtein}g est inférieur aux ${nutritionAssessment.recommendedProtein}g recommandés pour votre charge d'entraînement`,
          icon: <EggAlt />
        });
      }
      
      if (nutritionAssessment.calorieDeficit > 500) {
        signals.push({
          type: 'warning',
          title: 'Déficit calorique important',
          description: `Déficit de ${nutritionAssessment.calorieDeficit} kcal/jour avec votre charge d'entraînement actuelle. Cela peut compromettre votre récupération.`,
          icon: <LocalFireDepartment />
        });
      }
      
      if (nutritionAssessment.hydrationConcern) {
        signals.push({
          type: 'info',
          title: 'Hydratation à surveiller',
          description: `Avec votre volume d'entraînement actuel, visez ${nutritionAssessment.recommendedHydration}L d'eau par jour minimum`,
          icon: <Opacity />
        });
      }
    }
    
    // Générer des recommandations personnalisées
    const recommendations = [
      // Recommandations existantes
    ];
    
    // Ajouter des recommandations nutritionnelles spécifiques
    if (nutritionData && nutritionAssessment) {
      if (nutritionAssessment.proteinDeficit) {
        recommendations.push({
          title: "Augmenter les protéines",
          description: `Visez ${nutritionAssessment.recommendedProtein}g de protéines par jour (${(nutritionAssessment.recommendedProtein / (nutritionData.weight || 70)).toFixed(1)}g/kg) pour favoriser la récupération musculaire.`,
          priority: 'high',
          icon: <EggAlt color="secondary" />
        });
      }
      
      if (nutritionAssessment.calorieDeficit > 300) {
        recommendations.push({
          title: "Ajuster l'apport calorique",
          description: `Augmentez votre apport de ${nutritionAssessment.calorieDeficit} kcal les jours d'entraînement pour maintenir votre énergie et améliorer votre récupération.`,
          priority: nutritionAssessment.calorieDeficit > 500 ? 'high' : 'medium',
          icon: <LocalFireDepartment color="warning" />
        });
      }
      
      if (nutritionAssessment.carbsRatioLow) {
        recommendations.push({
          title: "Optimiser les glucides",
          description: `Augmentez votre ratio de glucides à ${nutritionAssessment.recommendedCarbsPercentage}% de votre apport calorique total (env. ${nutritionAssessment.recommendedCarbsGrams}g) pour maintenir vos réserves de glycogène.`,
          priority: 'medium',
          icon: <Cake color="primary" />
        });
      }
      
      if (nutritionAssessment.preWorkoutNutrition) {
        recommendations.push({
          title: "Collation pré-entraînement",
          description: "Consommez une collation riche en glucides 1-2h avant l'effort (40-60g) pour optimiser votre performance.",
          priority: 'medium',
          icon: <EmojiFoodBeverage color="info" />
        });
      }
    }

    // Générer un statut global
    let status = 'optimal';
    if (signals.some(s => s.type === 'critical')) {
      status = 'critical';
    } else if (signals.some(s => s.type === 'warning')) {
      status = 'warning';
    }
    
    // Calculer un score de récupération (0-100)
    let recoveryScore = 100;
    if (status === 'critical') recoveryScore = 40;
    else if (status === 'warning') recoveryScore = 65;
    else recoveryScore = 85;
    
    return {
      status,
      signals,
      recommendations,
      metrics: {
        acwrVolume: acwrVolume,
        restDays: 7 - last7DaysActivities.length,
        intenseSessions: intenseWorkouts.length,
        volumeTrend: previousVolume > 0 ? Math.round((currentVolume - previousVolume) / previousVolume * 100) : 0,
        nutrition: nutritionAssessment
      }
    };
  };

  // Ajouter une nouvelle fonction pour analyser le statut nutritionnel
  const analyzeNutritionalStatus = (nutritionData, trainingVolume) => {
    if (!nutritionData) return null;
    
    // Extraire les données nutritionnelles
    const { weight, dailyCalories, macronutrients } = nutritionData;
    
    // Calculer les besoins caloriques approximatifs basés sur le volume d'entraînement
    // Formule simplifiée: 2000 kcal (base) + 10 kcal par minute d'entraînement hebdomadaire (répartis sur la semaine)
    const estimatedDailyCalories = 2000 + (trainingVolume * 10) / 7; 
    
    // Estimer le déficit/surplus calorique
    const calorieDeficit = dailyCalories ? estimatedDailyCalories - dailyCalories : 0;
    
    // Calculer les besoins en protéines en fonction du poids et du volume d'entraînement
    // 1.6g/kg pour les cyclistes avec entraînement modéré, jusqu'à 2.0g/kg pour les entraînements intenses
    const proteinFactor = trainingVolume > 600 ? 2.0 : trainingVolume > 300 ? 1.8 : 1.6;
    const recommendedProtein = Math.round(proteinFactor * (weight || 70));
    
    // Extraire l'apport actuel en protéines
    const currentProtein = macronutrients && dailyCalories ? 
      Math.round((macronutrients.protein.percentage / 100) * dailyCalories / 4) : 0;
    
    // Déterminer si l'apport en protéines est suffisant
    const proteinDeficit = currentProtein && currentProtein < recommendedProtein * 0.8;
    
    // Calculer les besoins en hydratation basés sur le volume d'entraînement
    // 2L minimum + 0.5L par heure d'entraînement quotidien
    const recommendedHydration = 2 + (trainingVolume / 60 / 7) * 0.5;
    
    // Évaluer le ratio de glucides
    const currentCarbsPercentage = macronutrients ? macronutrients.carbs.percentage : 0;
    // Les cyclistes avec volume élevé devraient avoir 55-65% de glucides
    const recommendedCarbsPercentage = trainingVolume > 600 ? 65 : trainingVolume > 300 ? 60 : 55;
    const carbsRatioLow = currentCarbsPercentage && currentCarbsPercentage < recommendedCarbsPercentage - 10;
    
    // Calculer la quantité de glucides recommandée en grammes
    const recommendedCarbsGrams = Math.round((recommendedCarbsPercentage / 100) * estimatedDailyCalories / 4);
    
    // Déterminer si une attention particulière à la nutrition avant l'effort est nécessaire
    const preWorkoutNutrition = trainingVolume > 400;
    
    // Déterminer si l'hydratation est une préoccupation
    const hydrationConcern = trainingVolume > 300;
    
    return {
      calorieDeficit,
      proteinDeficit,
      currentProtein,
      recommendedProtein,
      hydrationConcern,
      recommendedHydration,
      carbsRatioLow,
      recommendedCarbsPercentage,
      recommendedCarbsGrams,
      preWorkoutNutrition
    };
  };

  // Mettre à jour la méthode renderNutritionMetrics pour utiliser les données nutritionnelles externes
  const renderNutritionMetrics = () => {
    // Si nous avons des données nutritionnelles et une analyse de surmenage
    if (nutritionData && overtrainingData && overtrainingData.metrics.nutrition) {
      const nutritionMetrics = overtrainingData.metrics.nutrition;
      
      return (
        <>
          <Typography variant="subtitle2" gutterBottom>
            Équilibre Nutrition & Entraînement
          </Typography>
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Tooltip title="Apport protéique journalier recommandé">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                    <EggAlt fontSize="small" sx={{ mr: 0.5 }} />
                    Protéines
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {nutritionMetrics.currentProtein || 0}g / {nutritionMetrics.recommendedProtein}g
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, ((nutritionMetrics.currentProtein || 0) / nutritionMetrics.recommendedProtein) * 100)} 
                    color={nutritionMetrics.proteinDeficit ? "warning" : "success"}
                    sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                  />
                </Box>
              </Tooltip>
            </Grid>
            
            <Grid item xs={6}>
              <Tooltip title="Équilibre calorique par rapport à votre dépense estimée">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocalFireDepartment fontSize="small" sx={{ mr: 0.5 }} />
                    Calories
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {nutritionData.dailyCalories ? (
                      nutritionMetrics.calorieDeficit > 0 ? 
                        `Déficit: ${nutritionMetrics.calorieDeficit} kcal` : 
                        `Surplus: ${-nutritionMetrics.calorieDeficit} kcal`
                    ) : 'Non configuré'}
                  </Typography>
                  {nutritionData.dailyCalories && (
                    <LinearProgress 
                      variant="determinate" 
                      value={50 - (nutritionMetrics.calorieDeficit / 40)} 
                      color={Math.abs(nutritionMetrics.calorieDeficit) > 500 ? "warning" : "success"}
                      sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                    />
                  )}
                </Box>
              </Tooltip>
            </Grid>
            
            <Grid item xs={6}>
              <Tooltip title="Apport en glucides pour la reconstitution du glycogène">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Cake fontSize="small" sx={{ mr: 0.5 }} />
                    Glucides
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {nutritionData.macronutrients ? 
                      `${nutritionData.macronutrients.carbs.percentage}% / ${nutritionMetrics.recommendedCarbsPercentage}%` : 
                      'Non configuré'}
                  </Typography>
                  {nutritionData.macronutrients && (
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(100, (nutritionData.macronutrients.carbs.percentage / nutritionMetrics.recommendedCarbsPercentage) * 100)} 
                      color={nutritionMetrics.carbsRatioLow ? "warning" : "success"}
                      sx={{ mt: 0.5, height: 4, borderRadius: 2 }}
                    />
                  )}
                </Box>
              </Tooltip>
            </Grid>
            
            <Grid item xs={6}>
              <Tooltip title="Hydratation recommandée quotidienne">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Opacity fontSize="small" sx={{ mr: 0.5 }} />
                    Hydratation
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {nutritionMetrics.recommendedHydration.toFixed(1)}L / jour
                  </Typography>
                </Box>
              </Tooltip>
            </Grid>
          </Grid>
        </>
      );
    } else if (nutritionData) {
      // Si nous avons des données nutritionnelles mais pas d'analyse
      return (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Données nutritionnelles
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Apport calorique: {nutritionData.dailyCalories || 'Non configuré'} kcal/jour
          </Typography>
          {nutritionData.macronutrients && (
            <Typography variant="body2" color="text.secondary">
              Ratio G/P/L: {nutritionData.macronutrients.carbs.percentage}/{nutritionData.macronutrients.protein.percentage}/{nutritionData.macronutrients.fat.percentage}
            </Typography>
          )}
        </Box>
      );
    } else {
      // Si aucune donnée nutritionnelle n'est disponible
      return (
        <Alert severity="info" sx={{ mt: 1 }}>
          <AlertTitle>Nutrition non configurée</AlertTitle>
          Configurez vos données nutritionnelles pour obtenir des recommandations personnalisées.
        </Alert>
      );
    }
  };

  // Couleur en fonction du statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'critical': return 'error.main';
      case 'warning': return 'warning.main';
      case 'optimal': return 'success.main';
      default: return 'text.primary';
    }
  };

  // Icône en fonction du statut
  const getStatusIcon = (status) => {
    switch (status) {
      case 'critical': return <Error color="error" />;
      case 'warning': return <Warning color="warning" />;
      case 'optimal': return <CheckCircle color="success" />;
      default: return <DirectionsBike />;
    }
  };

  // Rendu du composant
  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
          Détection de surmenage
        </Typography>
      </Box>
      
      {loadingAnalysis ? (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
            Analyse de votre charge d'entraînement...
          </Typography>
        </Box>
      ) : overtrainingData ? (
        <Box>
          <Alert 
            severity={overtrainingData.status === 'optimal' ? 'success' : 
                     overtrainingData.status === 'warning' ? 'warning' : 'error'}
            icon={getStatusIcon(overtrainingData.status)}
            sx={{ mb: 2 }}
          >
            <AlertTitle>
              {overtrainingData.status === 'optimal' ? 'Charge d\'entraînement optimale' : 
               overtrainingData.status === 'warning' ? 'Attention à la fatigue' : 'Risque de surmenage détecté'}
            </AlertTitle>
            {overtrainingData.status === 'optimal' 
              ? 'Votre équilibre entraînement/récupération est idéal pour progresser.' 
              : 'Certains signaux indiquent un risque de surmenage. Consultez les détails ci-dessous.'}
          </Alert>
          
          {/* Score de récupération */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Score de récupération
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ flexGrow: 1, mr: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={overtrainingData.recoveryScore} 
                  color={
                    overtrainingData.recoveryScore < 50 ? 'error' : 
                    overtrainingData.recoveryScore < 75 ? 'warning' : 'success'
                  }
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Typography 
                variant="h6" 
                color={
                  overtrainingData.recoveryScore < 50 ? 'error' : 
                  overtrainingData.recoveryScore < 75 ? 'warning.main' : 'success.main'
                }
              >
                {overtrainingData.recoveryScore}%
              </Typography>
            </Box>
          </Box>
          
          {/* Signaux de surmenage */}
          {overtrainingData.signals.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Signaux détectés
              </Typography>
              <List dense disablePadding>
                {overtrainingData.signals.map((signal, index) => (
                  <ListItem key={index} sx={{ 
                    bgcolor: signal.type === 'critical' ? 'error.lighter' : 'warning.lighter',
                    borderRadius: 1,
                    mb: 1
                  }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {signal.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={signal.title}
                      secondary={signal.description}
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          
          {/* Recommandations */}
          {overtrainingData.recommendations.length > 0 && (
            <Accordion 
              expanded={recoveryExpanded || overtrainingData.status === 'critical'} 
              onChange={() => setRecoveryExpanded(!recoveryExpanded)}
              elevation={0}
              sx={{ 
                bgcolor: 'background.default', 
                border: '1px solid',
                borderColor: 'divider',
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle2">
                  Recommandations de récupération
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense disablePadding>
                  {overtrainingData.recommendations.map((rec, index) => (
                    <ListItem key={index} alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        {rec.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight="medium">
                              {rec.title}
                            </Typography>
                            {rec.priority === 'high' && (
                              <Chip 
                                label="Prioritaire" 
                                size="small" 
                                color="error" 
                                sx={{ ml: 1, height: 20 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {rec.description}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}
          
          {/* Métriques */}
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Métriques de charge
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Ratio aigu:chronique
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {overtrainingData.metrics.acwrVolume.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Jours de repos
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {overtrainingData.metrics.restDays}/7
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Séances intenses
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {overtrainingData.metrics.intenseSessions}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Évolution du volume
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {overtrainingData.metrics.volumeTrend}%
                </Typography>
              </Grid>
            </Grid>
          </Box>
          
          {/* Métriques nutritionnelles */}
          {overtrainingData.metrics.nutrition && (
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              {renderNutritionMetrics()}
            </Box>
          )}
          
          {/* Recommandations nutritionnelles */}
          {nutritionData && (
            <Accordion 
              expanded={nutritionExpanded} 
              onChange={() => setNutritionExpanded(!nutritionExpanded)}
              elevation={0}
              sx={{ 
                mt: 2,
                bgcolor: 'background.default', 
                border: '1px solid',
                borderColor: 'divider',
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle2">
                  Recommandations nutritionnelles
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense disablePadding>
                  {overtrainingData.recommendations
                    .filter(rec => rec.icon && (rec.icon.type === LocalFireDepartment || 
                                         rec.icon.type === FitnessCenter || 
                                         rec.icon.type === WaterDrop ||
                                         rec.icon.type === EggAlt ||
                                         rec.icon.type === EmojiFoodBeverage ||
                                         rec.icon.type === Cake))
                    .map((rec, index) => (
                      <ListItem key={index} alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {rec.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight="medium">
                                {rec.title}
                              </Typography>
                              {rec.priority === 'high' && (
                                <Chip 
                                  label="Prioritaire" 
                                  size="small" 
                                  color="error" 
                                  sx={{ ml: 1, height: 20 }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {rec.description}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>
      ) : (
        <Alert severity="info">
          Données d'entraînement insuffisantes pour analyser les risques de surmenage.
        </Alert>
      )}
    </Paper>
  );
};

export default OvertrainingDetection;
