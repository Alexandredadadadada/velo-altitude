/**
 * DailyNutritionWidget - Widget de nutrition quotidienne pour le Dashboard
 * 
 * Ce composant affiche un résumé du plan nutritionnel quotidien, adapté aux
 * entraînements prévus pour la journée, avec des rappels d'hydratation contextuels.
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, Grid, Chip, Divider, 
  CircularProgress, Button, LinearProgress 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  WaterDrop, Restaurant, DirectionsBike, Timer, LocalFireDepartment, 
  TrendingUp, Fastfood, ArrowForward 
} from '@mui/icons-material';
import { fetchUserTrainingData, fetchDailyNutrition } from '../../services/dataService';
import { trackSEOInteraction } from '../../services/analyticsService';
import { Link } from 'react-router-dom';

// Styles personnalisés
const ProgressLabel = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(0.5),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const MacroProgressBar = styled(LinearProgress)(({ theme, value, color }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    backgroundColor: color,
  },
}));

const HydrationAlert = styled(Box)(({ theme, urgency }) => ({
  backgroundColor: urgency === 'high' 
    ? theme.palette.error.light 
    : urgency === 'medium'
      ? theme.palette.warning.light
      : theme.palette.primary.light,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1.5),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
}));

/**
 * Widget de nutrition quotidienne
 * 
 * @param {Object} props - Propriétés du composant
 * @param {string} props.userId - ID de l'utilisateur
 */
const DailyNutritionWidget = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [nutritionPlan, setNutritionPlan] = useState(null);
  const [trainingData, setTrainingData] = useState(null);
  const [currentTime] = useState(new Date());
  
  // Déterminer la salutation en fonction de l'heure
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Petit-déjeuner";
    if (hour < 14) return "Déjeuner";
    if (hour < 18) return "Goûter";
    return "Dîner";
  };
  
  useEffect(() => {
    const loadData = async () => {
      try {
        // Récupérer les données d'entraînement pour adapter les recommandations
        const training = await fetchUserTrainingData(userId);
        setTrainingData(training);
        
        // Récupérer les recommandations nutritionnelles
        const nutrition = await fetchDailyNutrition(userId, training);
        setNutritionPlan(nutrition);
        
        // Enregistrer l'interaction pour le SEO
        trackSEOInteraction('nutrition', 'daily_widget', 'view');
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        
        // Utiliser des données de secours en cas d'erreur
        setTrainingData({
          planned: true,
          title: "Sortie endurance",
          duration: 120,
          intensity: "modérée",
          type: "vélo"
        });
        
        setNutritionPlan({
          calories: {
            goal: 2600,
            current: 1200
          },
          macros: {
            carbs: { goal: 325, current: 150 },
            protein: { goal: 130, current: 60 },
            fat: { goal: 87, current: 40 }
          },
          hydration: {
            goal: 2.8,
            current: 0.8,
            nextReminder: "Maintenant",
            urgency: "medium"
          },
          currentMeal: {
            name: getGreeting(),
            recommendations: [
              { 
                id: "energy-oatmeal", 
                name: "Porridge énergétique", 
                calories: 450, 
                timeToMake: 10,
                tags: ["pre-workout", "breakfast"] 
              },
              { 
                id: "protein-yogurt", 
                name: "Yaourt protéiné aux fruits rouges", 
                calories: 320, 
                timeToMake: 5,
                tags: ["recovery", "quick"] 
              }
            ]
          },
          suggestedSnack: {
            id: "endurance-bars",
            name: "Barres énergétiques maison",
            desc: "Parfait pour votre sortie prévue"
          }
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [userId, currentTime]);
  
  // Calculer le pourcentage d'un objectif atteint
  const getPercentage = (current, goal) => {
    return Math.min(100, Math.round((current / goal) * 100));
  };
  
  // Gérer les clics sur les recettes recommandées
  const handleRecipeClick = (recipeId) => {
    trackSEOInteraction('recipe', recipeId, 'click_from_widget');
  };
  
  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 2, height: '100%', minHeight: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Box textAlign="center">
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Chargement de vos données nutritionnelles...
          </Typography>
        </Box>
      </Paper>
    );
  }
  
  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Nutrition du jour
        </Typography>
        <Chip 
          icon={<LocalFireDepartment fontSize="small" />}
          label={`${nutritionPlan.calories.current} / ${nutritionPlan.calories.goal} kcal`}
          color="primary"
          size="small"
        />
      </Box>
      
      {/* Affichage de l'entraînement prévu */}
      {trainingData && trainingData.planned && (
        <Box bgcolor="primary.light" p={1.5} borderRadius={1} mb={2} display="flex" alignItems="center">
          <DirectionsBike sx={{ color: 'white', mr: 1 }} />
          <Box>
            <Typography variant="body2" color="white" fontWeight="medium">
              {trainingData.title}
            </Typography>
            <Typography variant="caption" color="white">
              {trainingData.duration} min • Intensité {trainingData.intensity}
            </Typography>
          </Box>
        </Box>
      )}
      
      {/* Progression des macronutriments */}
      <Box mb={2}>
        <ProgressLabel variant="body2">
          <span>Glucides</span>
          <span>{nutritionPlan.macros.carbs.current}g / {nutritionPlan.macros.carbs.goal}g</span>
        </ProgressLabel>
        <MacroProgressBar 
          variant="determinate" 
          value={getPercentage(nutritionPlan.macros.carbs.current, nutritionPlan.macros.carbs.goal)} 
          color="#FF9800"
        />
        
        <ProgressLabel variant="body2" mt={1}>
          <span>Protéines</span>
          <span>{nutritionPlan.macros.protein.current}g / {nutritionPlan.macros.protein.goal}g</span>
        </ProgressLabel>
        <MacroProgressBar 
          variant="determinate" 
          value={getPercentage(nutritionPlan.macros.protein.current, nutritionPlan.macros.protein.goal)} 
          color="#4CAF50"
        />
        
        <ProgressLabel variant="body2" mt={1}>
          <span>Lipides</span>
          <span>{nutritionPlan.macros.fat.current}g / {nutritionPlan.macros.fat.goal}g</span>
        </ProgressLabel>
        <MacroProgressBar 
          variant="determinate" 
          value={getPercentage(nutritionPlan.macros.fat.current, nutritionPlan.macros.fat.goal)} 
          color="#2196F3"
        />
      </Box>
      
      {/* Alerte d'hydratation */}
      <HydrationAlert urgency={nutritionPlan.hydration.urgency}>
        <WaterDrop sx={{ color: 'white', mr: 1 }} />
        <Box flex={1}>
          <Typography variant="body2" color="white" fontWeight="medium">
            Hydratation: {nutritionPlan.hydration.current}L / {nutritionPlan.hydration.goal}L
          </Typography>
          <Typography variant="caption" color="white">
            Prochain rappel: {nutritionPlan.hydration.nextReminder}
          </Typography>
        </Box>
      </HydrationAlert>
      
      {/* Recommandations pour le repas actuel */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          {nutritionPlan.currentMeal.name} suggéré
        </Typography>
        
        <Grid container spacing={1}>
          {nutritionPlan.currentMeal.recommendations.map((recipe, idx) => (
            <Grid item xs={12} key={idx}>
              <Paper 
                variant="outlined" 
                sx={{ p: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                onClick={() => handleRecipeClick(recipe.id)}
                component={Link}
                to={`/nutrition/recipes/${recipe.id}`}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2">
                      {recipe.name}
                    </Typography>
                    <Box display="flex" alignItems="center" mt={0.5}>
                      <LocalFireDepartment sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {recipe.calories} kcal
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mx: 1 }}>•</Typography>
                      <Timer sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {recipe.timeToMake} min
                      </Typography>
                    </Box>
                  </Box>
                  <ArrowForward fontSize="small" color="action" />
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
      
      {/* Suggestion de collation */}
      {nutritionPlan.suggestedSnack && (
        <Box mt={2}>
          <Typography variant="subtitle2" gutterBottom>
            À préparer pour plus tard
          </Typography>
          
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 1.5, 
              bgcolor: 'secondary.light', 
              cursor: 'pointer',
              '&:hover': { bgcolor: 'secondary.main' }
            }}
            onClick={() => handleRecipeClick(nutritionPlan.suggestedSnack.id)}
            component={Link}
            to={`/nutrition/recipes/${nutritionPlan.suggestedSnack.id}`}
          >
            <Box display="flex" alignItems="center">
              <Fastfood sx={{ color: 'white', mr: 1 }} />
              <Box>
                <Typography variant="body2" color="white">
                  {nutritionPlan.suggestedSnack.name}
                </Typography>
                <Typography variant="caption" color="white">
                  {nutritionPlan.suggestedSnack.desc}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}
      
      {/* Lien vers plus d'outils */}
      <Box mt={2} textAlign="right">
        <Button 
          variant="text" 
          color="primary" 
          size="small"
          endIcon={<TrendingUp />}
          component={Link}
          to="/nutrition/tools"
        >
          Tous les outils nutrition
        </Button>
      </Box>
    </Paper>
  );
};

// Données de démonstration pour les développeurs
const demoTrainingData = {
  planned: true,
  title: "Sortie endurance",
  duration: 120,
  intensity: "modérée",
  type: "vélo"
};

const demoNutritionPlan = {
  calories: {
    goal: 2600,
    current: 1200
  },
  macros: {
    carbs: { goal: 325, current: 150 },
    protein: { goal: 130, current: 60 },
    fat: { goal: 87, current: 40 }
  },
  hydration: {
    goal: 2.8,
    current: 0.8,
    nextReminder: "Maintenant",
    urgency: "medium"
  },
  currentMeal: {
    name: "Déjeuner",
    recommendations: [
      { 
        id: "energy-oatmeal", 
        name: "Porridge énergétique", 
        calories: 450, 
        timeToMake: 10,
        tags: ["pre-workout", "breakfast"] 
      },
      { 
        id: "protein-yogurt", 
        name: "Yaourt protéiné aux fruits rouges", 
        calories: 320, 
        timeToMake: 5,
        tags: ["recovery", "quick"] 
      }
    ]
  },
  suggestedSnack: {
    id: "endurance-bars",
    name: "Barres énergétiques maison",
    desc: "Parfait pour votre sortie prévue"
  }
};

export default DailyNutritionWidget;
