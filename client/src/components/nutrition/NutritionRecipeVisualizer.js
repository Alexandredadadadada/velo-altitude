import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Chip, 
  CircularProgress, 
  IconButton, 
  Tooltip, 
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardMedia,
  CardContent,
  Divider,
  Rating
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Timer as TimerIcon, 
  LocalFireDepartment as CalorieIcon, 
  Restaurant as MealIcon, 
  FitnessCenter as ProteinIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

/**
 * Composant de visualisation détaillée et interactive des recettes adaptées aux cyclistes
 */
const NutritionRecipeVisualizer = ({ recipe, userProfile, onSave, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [servings, setServings] = useState(recipe?.defaultServings || 1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showNutritionDialog, setShowNutritionDialog] = useState(false);
  const timerRef = useRef(null);
  const [activeTimer, setActiveTimer] = useState(null);
  
  // Vérifier si la recette est dans les favoris de l'utilisateur
  useEffect(() => {
    if (userProfile && userProfile.preferences && recipe) {
      setIsFavorite(userProfile.preferences.includes(recipe.id));
    }
    
    // Simuler le chargement
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [recipe, userProfile]);
  
  // Gérer les changements de portions
  const handleServingChange = (increment) => {
    setServings(prev => {
      const newValue = prev + increment;
      return newValue > 0 ? newValue : 1;
    });
  };
  
  // Gérer l'ajout/suppression des favoris
  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
    if (onSave) {
      onSave(recipe.id, !isFavorite);
    }
  };
  
  // Démarrer/arrêter un minuteur pour une étape
  const handleTimerToggle = (duration) => {
    if (activeTimer === null) {
      // Démarrer un nouveau minuteur
      let timeRemaining = duration * 60; // convertir en secondes
      setActiveTimer(timeRemaining);
      
      timerRef.current = setInterval(() => {
        setActiveTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Arrêter le minuteur existant
      clearInterval(timerRef.current);
      setActiveTimer(null);
    }
  };
  
  // Nettoyer le minuteur lors du démontage
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Calculer les macronutriments ajustés en fonction des portions
  const calculateAdjustedNutrition = () => {
    if (!recipe || !recipe.nutrition) return null;
    
    const factor = servings / recipe.defaultServings;
    
    return {
      calories: Math.round(recipe.nutrition.calories * factor),
      protein: Math.round(recipe.nutrition.protein * factor),
      carbs: Math.round(recipe.nutrition.carbs * factor),
      fat: Math.round(recipe.nutrition.fat * factor),
      fiber: Math.round(recipe.nutrition.fiber * factor),
      sugar: Math.round(recipe.nutrition.sugar * factor)
    };
  };
  
  // Générer les données pour le graphique de macronutriments
  const generateMacroData = () => {
    const nutrition = calculateAdjustedNutrition();
    if (!nutrition) return [];
    
    return [
      { name: 'Protéines', value: nutrition.protein * 4, color: '#4CAF50' },
      { name: 'Glucides', value: nutrition.carbs * 4, color: '#FFC107' },
      { name: 'Lipides', value: nutrition.fat * 9, color: '#FF5722' }
    ];
  };
  
  // Formater le temps du minuteur
  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (isLoading || !recipe) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="400px"
        width="100%"
      >
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Chargement de la recette...
        </Typography>
      </Box>
    );
  }
  
  // Calculer la nutrition ajustée
  const adjustedNutrition = calculateAdjustedNutrition();
  const macroData = generateMacroData();
  
  return (
    <Box>
      {/* En-tête de la recette */}
      <Box 
        sx={{ 
          position: 'relative', 
          height: '300px', 
          mb: 2,
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${recipe.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.7)'
          }}
        />
        
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 3,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))'
          }}
        >
          <Typography variant="h4" color="white" gutterBottom>
            {recipe.title}
          </Typography>
          
          <Box display="flex" alignItems="center" sx={{ mb: 1 }}>
            <Rating 
              value={recipe.rating || 4.5} 
              precision={0.5} 
              readOnly 
              sx={{ 
                '& .MuiRating-iconFilled': { color: 'white' },
                '& .MuiRating-iconEmpty': { color: 'rgba(255, 255, 255, 0.5)' }
              }}
            />
            <Typography variant="body2" color="white" sx={{ ml: 1 }}>
              ({recipe.reviewCount || 24} avis)
            </Typography>
          </Box>
          
          <Box display="flex" flexWrap="wrap" gap={1}>
            {recipe.tags && recipe.tags.map((tag, index) => (
              <Chip 
                key={index} 
                label={tag} 
                size="small" 
                sx={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                  color: 'white' 
                }} 
              />
            ))}
          </Box>
        </Box>
        
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <IconButton 
            onClick={handleFavoriteToggle}
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.5)' }
            }}
          >
            {isFavorite ? 
              <FavoriteIcon color="error" /> : 
              <FavoriteBorderIcon sx={{ color: 'white' }} />
            }
          </IconButton>
        </Box>
        
        <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
          <IconButton 
            onClick={onClose}
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.5)' }
            }}
          >
            <CloseIcon sx={{ color: 'white' }} />
          </IconButton>
        </Box>
      </Box>
      
      {/* Informations de base */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={3}>
          <InfoCard
            icon={<TimerIcon color="primary" />}
            label="Temps"
            value={`${recipe.cookTime} min`}
          />
        </Grid>
        <Grid item xs={3}>
          <InfoCard
            icon={<CalorieIcon sx={{ color: '#FF5722' }} />}
            label="Calories"
            value={`${adjustedNutrition.calories} kcal`}
          />
        </Grid>
        <Grid item xs={3}>
          <InfoCard
            icon={<MealIcon color="success" />}
            label="Portions"
            value={
              <Box display="flex" alignItems="center">
                <IconButton 
                  size="small" 
                  onClick={() => handleServingChange(-1)}
                  disabled={servings <= 1}
                >
                  <RemoveIcon fontSize="small" />
                </IconButton>
                <Typography variant="body1" sx={{ mx: 1 }}>
                  {servings}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => handleServingChange(1)}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            }
          />
        </Grid>
        <Grid item xs={3}>
          <InfoCard
            icon={<ProteinIcon color="info" />}
            label="Protéines"
            value={`${adjustedNutrition.protein} g`}
          />
        </Grid>
      </Grid>
      
      {/* Description */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
        <Typography variant="body1" paragraph>
          {recipe.description}
        </Typography>
        
        {recipe.cyclistBenefits && (
          <>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Bénéfices pour le cycliste
            </Typography>
            <Typography variant="body2" paragraph>
              {recipe.cyclistBenefits}
            </Typography>
          </>
        )}
        
        <Box display="flex" justifyContent="space-between">
          <Button 
            variant="outlined" 
            startIcon={<InfoIcon />}
            onClick={() => setShowNutritionDialog(true)}
          >
            Détails nutritionnels
          </Button>
          
          <Box>
            <IconButton color="primary">
              <PrintIcon />
            </IconButton>
            <IconButton color="primary">
              <ShareIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>
      
      {/* Ingrédients */}
      <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
        <Typography variant="h6" gutterBottom>
          Ingrédients
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          {recipe.ingredients && recipe.ingredients.map((ingredient, index) => {
            // Ajuster les quantités en fonction des portions
            const quantity = ingredient.quantity * (servings / recipe.defaultServings);
            
            return (
              <Grid item xs={12} sm={6} key={index}>
                <Box display="flex" alignItems="center" py={0.5}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      mr: 1.5
                    }}
                  />
                  <Typography variant="body1">
                    {quantity % 1 === 0 ? quantity : quantity.toFixed(1)} {ingredient.unit} {ingredient.name}
                    {ingredient.note && (
                      <Typography component="span" variant="body2" color="text.secondary">
                        {' '}- {ingredient.note}
                      </Typography>
                    )}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
      
      {/* Guide étape par étape */}
      <Paper sx={{ p: 3, mb: 3, position: 'relative' }} elevation={1}>
        <Typography variant="h6" gutterBottom>
          Instructions
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {/* Minuteur flottant */}
        {activeTimer !== null && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{
              position: 'absolute',
              right: 20,
              top: 20,
              backgroundColor: 'primary.main',
              color: 'white',
              p: 1,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <TimerIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              {formatTime(activeTimer)}
            </Typography>
            <IconButton 
              size="small" 
              onClick={() => handleTimerToggle(0)} 
              sx={{ color: 'white', ml: 1 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
        
        {recipe.steps && recipe.steps.map((step, index) => (
          <StepCard
            key={index}
            step={step}
            index={index}
            isCurrent={index === currentStep}
            isCompleted={index < currentStep}
            onClick={() => setCurrentStep(index)}
            onTimerStart={handleTimerToggle}
          />
        ))}
        
        <Box display="flex" justifyContent="space-between" mt={3}>
          <Button
            variant="outlined"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep(prev => prev - 1)}
          >
            Étape précédente
          </Button>
          
          <Button
            variant="contained"
            disabled={currentStep >= (recipe.steps?.length || 0) - 1}
            onClick={() => setCurrentStep(prev => prev + 1)}
          >
            Étape suivante
          </Button>
        </Box>
      </Paper>
      
      {/* Modal des détails nutritionnels */}
      <Dialog 
        open={showNutritionDialog} 
        onClose={() => setShowNutritionDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Détails nutritionnels
          <IconButton
            onClick={() => setShowNutritionDialog(false)}
            sx={{ position: 'absolute', right: 12, top: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Typography variant="subtitle1" gutterBottom>
                Répartition des macronutriments
              </Typography>
              
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={macroData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {macroData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value) => [`${value} kcal`, null]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              
              <Typography variant="body2" align="center">
                Total: {adjustedNutrition.calories} kcal
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={7}>
              <Typography variant="subtitle1" gutterBottom>
                Information nutritionnelle détaillée
              </Typography>
              
              <NutritionTable nutrition={adjustedNutrition} />
              
              {recipe.nutritionNotes && (
                <Box mt={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Notes nutritionnelles:
                  </Typography>
                  <Typography variant="body2">
                    {recipe.nutritionNotes}
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowNutritionDialog(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Carte d'information simple
const InfoCard = ({ icon, label, value }) => (
  <Paper 
    sx={{ 
      p: 2, 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}
  >
    <Box sx={{ mb: 1 }}>
      {icon}
    </Box>
    <Typography variant="caption" align="center" color="text.secondary">
      {label}
    </Typography>
    {typeof value === 'string' ? (
      <Typography variant="body1" align="center" fontWeight="bold">
        {value}
      </Typography>
    ) : value}
  </Paper>
);

// Carte d'étape interactive
const StepCard = ({ step, index, isCurrent, isCompleted, onClick, onTimerStart }) => (
  <Paper
    component={motion.div}
    whileHover={{ scale: 1.01 }}
    sx={{
      p: 2,
      mb: 2,
      cursor: 'pointer',
      borderLeft: isCurrent ? '4px solid' : isCompleted ? '4px solid' : '1px solid',
      borderColor: isCurrent ? 'primary.main' : isCompleted ? 'success.main' : 'divider',
      backgroundColor: isCurrent ? 'rgba(25, 118, 210, 0.05)' : 'inherit',
      transition: 'all 0.2s ease'
    }}
    onClick={onClick}
    elevation={isCurrent ? 2 : 1}
  >
    <Box display="flex" alignItems="flex-start">
      <Box
        sx={{
          minWidth: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: isCurrent ? 'primary.main' : isCompleted ? 'success.main' : 'grey.300',
          color: isCurrent || isCompleted ? 'white' : 'text.primary',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 2,
          mt: 0.5
        }}
      >
        <Typography variant="body2">
          {index + 1}
        </Typography>
      </Box>
      
      <Box flex={1}>
        <Typography variant="body1" paragraph sx={{ mb: 1 }}>
          {step.instruction}
        </Typography>
        
        {step.tip && (
          <Typography 
            variant="body2" 
            sx={{ 
              fontStyle: 'italic', 
              color: 'text.secondary',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              p: 1,
              borderRadius: 1
            }}
          >
            Astuce: {step.tip}
          </Typography>
        )}
        
        {step.timerDuration && (
          <Button
            size="small"
            startIcon={<TimerIcon />}
            onClick={(e) => {
              e.stopPropagation();
              onTimerStart(step.timerDuration);
            }}
            sx={{ mt: 1 }}
          >
            Minuteur: {step.timerDuration} min
          </Button>
        )}
      </Box>
    </Box>
  </Paper>
);

// Table des informations nutritionnelles
const NutritionTable = ({ nutrition }) => (
  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
    <Grid container>
      <NutritionRow 
        label="Calories" 
        value={`${nutrition.calories} kcal`} 
        isHeader 
      />
      <NutritionRow 
        label="Protéines" 
        value={`${nutrition.protein} g`} 
        percent={Math.round((nutrition.protein * 4 / nutrition.calories) * 100)} 
        color="#4CAF50"
      />
      <NutritionRow 
        label="Glucides" 
        value={`${nutrition.carbs} g`} 
        percent={Math.round((nutrition.carbs * 4 / nutrition.calories) * 100)} 
        color="#FFC107"
      />
      <NutritionRow 
        label="dont Sucres" 
        value={`${nutrition.sugar} g`} 
        isSubItem 
      />
      <NutritionRow 
        label="Fibres" 
        value={`${nutrition.fiber} g`} 
        isSubItem 
      />
      <NutritionRow 
        label="Lipides" 
        value={`${nutrition.fat} g`} 
        percent={Math.round((nutrition.fat * 9 / nutrition.calories) * 100)} 
        color="#FF5722"
      />
      {nutrition.saturatedFat && (
        <NutritionRow 
          label="dont Saturés" 
          value={`${nutrition.saturatedFat} g`} 
          isSubItem 
        />
      )}
    </Grid>
  </Box>
);

// Ligne du tableau nutritionnel
const NutritionRow = ({ label, value, percent, isHeader, isSubItem, color }) => (
  <Grid 
    container 
    sx={{ 
      p: isHeader ? 1.5 : 1,
      borderBottom: '1px solid',
      borderColor: 'divider',
      backgroundColor: isHeader ? 'action.selected' : isSubItem ? 'action.hover' : 'inherit',
      pl: isSubItem ? 4 : 2
    }}
  >
    <Grid item xs={6}>
      <Typography 
        variant={isHeader ? "subtitle1" : "body2"}
        fontWeight={isHeader ? "bold" : "regular"}
      >
        {label}
      </Typography>
    </Grid>
    <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
      <Typography 
        variant={isHeader ? "subtitle1" : "body2"}
        fontWeight={isHeader ? "bold" : "regular"}
      >
        {value}
      </Typography>
      
      {percent && (
        <Box sx={{ ml: 1, flex: 1, display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              flex: 1,
              height: 8,
              backgroundColor: 'grey.200',
              borderRadius: 1,
              mr: 1
            }}
          >
            <Box
              sx={{
                width: `${percent}%`,
                height: '100%',
                backgroundColor: color,
                borderRadius: 1
              }}
            />
          </Box>
          <Typography variant="caption">
            {percent}%
          </Typography>
        </Box>
      )}
    </Grid>
  </Grid>
);

export default NutritionRecipeVisualizer;
