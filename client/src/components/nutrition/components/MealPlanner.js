import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper,
  Tabs, 
  Tab, 
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Tooltip,
  Alert
} from '@mui/material';
import { 
  ArrowBackIos as ArrowBackIcon,
  ArrowForwardIos as ArrowForwardIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Print as PrintIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import useMealPlanner from '../hooks/useMealPlanner';
import useNutritionPlanner from '../hooks/useNutritionPlanner';
import { MealPlannerDay } from './MealPlannerDay';

// Chargement paresseux des composants secondaires
const SavePlanDialog = lazy(() => import('./MealPlannerDialogs').then(module => ({ default: module.SavePlanDialog })));
const NutritionInfoDialog = lazy(() => import('./MealPlannerDialogs').then(module => ({ default: module.NutritionInfoDialog })));

/**
 * Composant de planification des repas
 * Permet aux utilisateurs de planifier leurs repas sur une semaine entière
 * et d'organiser un plan alimentaire basé sur leurs objectifs nutritionnels
 */
const MealPlanner = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);
  const [openNutritionInfo, setOpenNutritionInfo] = useState(false);
  
  // Hooks personnalisés
  const { 
    savedPlans, 
    planName, 
    showSaveForm, 
    currentWeek, 
    weeklyTotals,
    loading, 
    error,
    setPlanName, 
    setShowSaveForm, 
    loadSavedPlans, 
    generateMealPlan, 
    savePlan, 
    deletePlan,
    addMealToDay,
    removeMealFromDay,
    getDayTotals,
    changeWeek
  } = useMealPlanner();
  
  const { nutritionResults } = useNutritionPlanner();
  
  // État local pour les glisser-déposer
  const [suggestions, setSuggestions] = useState([]);
  
  // Générer des suggestions de repas lors du changement des résultats nutritionnels
  useEffect(() => {
    if (nutritionResults && nutritionResults.dailyIntake) {
      const newSuggestions = generateMealPlan(nutritionResults);
      setSuggestions(newSuggestions);
    }
  }, [nutritionResults, generateMealPlan]);
  
  // Charger les plans sauvegardés au montage du composant
  useEffect(() => {
    loadSavedPlans();
  }, [loadSavedPlans]);
  
  /**
   * Gère le changement d'onglet
   */
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  /**
   * Gère le début du glisser-déposer
   */
  const onDragStart = () => {
    if (isMobile) {
      // Vibration sur appareils mobiles pour feedback tactile
      if (window.navigator.vibrate) {
        window.navigator.vibrate(100);
      }
    }
  };
  
  /**
   * Gère la fin du glisser-déposer
   */
  const onDragEnd = (result) => {
    const { source, destination } = result;
    
    // Abandon si pas de destination ou même position
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;
    
    // Si c'est un repas suggéré déplacé vers un jour
    if (source.droppableId === 'suggestions' && destination.droppableId.startsWith('day-')) {
      const meal = suggestions[source.index];
      const dateStr = destination.droppableId.replace('day-', '');
      
      // Ajouter le repas au jour
      addMealToDay(dateStr, meal);
    }
    
    // Si c'est un déplacement entre jours
    if (source.droppableId.startsWith('day-') && destination.droppableId.startsWith('day-')) {
      const sourceDateStr = source.droppableId.replace('day-', '');
      const destDateStr = destination.droppableId.replace('day-', '');
      
      const sourceDay = currentWeek.find(day => day.date === sourceDateStr);
      if (sourceDay && sourceDay.meals.length > source.index) {
        const meal = sourceDay.meals[source.index];
        
        // Supprimer du jour source et ajouter au jour destination
        removeMealFromDay(sourceDateStr, meal.id);
        addMealToDay(destDateStr, meal);
      }
    }
  };
  
  /**
   * Gère la sauvegarde d'un plan
   */
  const handleSavePlan = () => {
    try {
      if (!planName.trim()) {
        // Afficher un message d'erreur
        return;
      }
      
      // Créer un plan à partir de la semaine actuelle
      const allMeals = currentWeek.flatMap(day => day.meals);
      
      savePlan(allMeals, planName, nutritionResults);
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };
  
  /**
   * Retourne les composants pour l'onglet actif
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Planificateur hebdomadaire
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2
            }}>
              <Button 
                startIcon={<ArrowBackIcon />} 
                onClick={() => changeWeek(-1)}
                size={isMobile ? "small" : "medium"}
              >
                {t('nutrition.planner.previous_week')}
              </Button>
              <Typography variant={isMobile ? "subtitle1" : "h6"} component="h2">
                {currentWeek.length > 0 && `${currentWeek[0].date} - ${currentWeek[6].date}`}
              </Typography>
              <Button 
                endIcon={<ArrowForwardIcon />} 
                onClick={() => changeWeek(1)}
                size={isMobile ? "small" : "medium"}
              >
                {t('nutrition.planner.next_week')}
              </Button>
            </Box>
            
            <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
              <Grid container spacing={2}>
                {/* Jours de la semaine */}
                {currentWeek.map((day) => (
                  <Grid item xs={12} md={isMobile ? 12 : 6} lg={4} key={day.date}>
                    <MealPlannerDay 
                      day={day} 
                      dayTotals={getDayTotals(day.date)}
                      nutritionTarget={nutritionResults?.dailyIntake || {}}
                      onRemoveMeal={(mealId) => removeMealFromDay(day.date, mealId)}
                      isMobile={isMobile}
                    />
                  </Grid>
                ))}
              </Grid>
              
              {/* Section des suggestions */}
              <Paper 
                elevation={3} 
                sx={{ 
                  mt: 2, 
                  p: 2, 
                  position: 'sticky', 
                  bottom: 0, 
                  zIndex: 10,
                  backgroundColor: theme.palette.background.paper,
                  borderTop: `1px solid ${theme.palette.divider}`
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" component="h3">
                    {t('nutrition.planner.suggestions')}
                  </Typography>
                  <Button 
                    startIcon={<InfoIcon />}
                    onClick={() => setOpenNutritionInfo(true)}
                    size={isMobile ? "small" : "medium"}
                  >
                    {t('nutrition.planner.nutrition_info')}
                  </Button>
                </Box>
                
                <Droppable droppableId="suggestions" direction={isMobile ? "vertical" : "horizontal"}>
                  {(provided) => (
                    <Grid 
                      container 
                      spacing={2} 
                      ref={provided.innerRef} 
                      {...provided.droppableProps}
                    >
                      {suggestions.map((meal, index) => (
                        <Draggable key={meal.id} draggableId={meal.id} index={index}>
                          {(provided, snapshot) => (
                            <Grid item xs={12} sm={6} md={3} 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{
                                transition: 'transform 0.2s',
                                transform: snapshot.isDragging ? 'scale(1.02)' : 'scale(1)',
                                zIndex: snapshot.isDragging ? 100 : 1
                              }}
                            >
                              <Card 
                                variant="outlined"
                                sx={{ 
                                  backgroundColor: theme.palette.primary.light,
                                  color: theme.palette.primary.contrastText,
                                  '&:hover': {
                                    boxShadow: theme.shadows[4]
                                  }
                                }}
                              >
                                <CardContent sx={{ pb: 1 }}>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {meal.title}
                                  </Typography>
                                  <Typography variant="body2">
                                    {`${meal.calories} kcal | ${meal.protein}g P | ${meal.carbs}g C | ${meal.fat}g L`}
                                  </Typography>
                                  <Box sx={{ mt: 1 }}>
                                    {meal.foods.slice(0, 2).map((food) => (
                                      <Chip 
                                        key={food.id} 
                                        label={food.name} 
                                        size="small" 
                                        sx={{ mr: 0.5, mb: 0.5 }}
                                      />
                                    ))}
                                    {meal.foods.length > 2 && (
                                      <Chip 
                                        label={`+${meal.foods.length - 2}`} 
                                        size="small" 
                                        sx={{ mb: 0.5 }}
                                      />
                                    )}
                                  </Box>
                                </CardContent>
                                <CardActions>
                                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                    {t('nutrition.planner.drag_instruction')}
                                  </Typography>
                                </CardActions>
                              </Card>
                            </Grid>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Grid>
                  )}
                </Droppable>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<SaveIcon />}
                    onClick={() => setShowSaveForm(true)}
                  >
                    {t('nutrition.planner.save_plan')}
                  </Button>
                </Box>
              </Paper>
            </DragDropContext>
          </Box>
        );
      
      case 1: // Plans sauvegardés
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('nutrition.planner.saved_plans')}
            </Typography>
            
            {savedPlans.length === 0 ? (
              <Alert severity="info">
                {t('nutrition.planner.no_saved_plans')}
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {savedPlans.map((plan) => (
                  <Grid item xs={12} sm={6} md={4} key={plan.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" component="h3">
                          {plan.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(plan.createdAt).toLocaleDateString()}
                        </Typography>
                        
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            {t('nutrition.macros.daily_calories')}: {plan.nutritionSummary.calories} kcal
                          </Typography>
                          <Typography variant="body2">
                            {t('nutrition.macros.protein')}: {plan.nutritionSummary.protein}g ({Math.round(plan.macroRatio.protein * 100)}%)
                          </Typography>
                          <Typography variant="body2">
                            {t('nutrition.macros.carbs')}: {plan.nutritionSummary.carbs}g ({Math.round(plan.macroRatio.carbs * 100)}%)
                          </Typography>
                          <Typography variant="body2">
                            {t('nutrition.macros.fat')}: {plan.nutritionSummary.fat}g ({Math.round(plan.macroRatio.fat * 100)}%)
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          startIcon={<PrintIcon />}
                          onClick={() => window.print()}
                        >
                          {t('nutrition.planner.print')}
                        </Button>
                        <Button 
                          size="small" 
                          color="error" 
                          startIcon={<DeleteIcon />}
                          onClick={() => deletePlan(plan.id)}
                        >
                          {t('nutrition.planner.delete')}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons={isMobile ? "auto" : false}
          aria-label="Meal planner tabs"
        >
          <Tab label={t('nutrition.planner.weekly_planner')} id="tab-0" aria-controls="tabpanel-0" />
          <Tab label={t('nutrition.planner.saved_plans')} id="tab-1" aria-controls="tabpanel-1" />
        </Tabs>
      </Box>
      
      {/* Afficher un spinner lors du chargement */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {/* Afficher les erreurs */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Contenu principal */}
      <Box 
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {renderTabContent()}
      </Box>
      
      {/* Dialogues */}
      <Suspense fallback={<CircularProgress />}>
        {showSaveForm && (
          <SavePlanDialog
            open={showSaveForm}
            planName={planName}
            onNameChange={(e) => setPlanName(e.target.value)}
            onSave={handleSavePlan}
            onClose={() => setShowSaveForm(false)}
          />
        )}
        
        {openNutritionInfo && (
          <NutritionInfoDialog
            open={openNutritionInfo}
            nutritionResults={nutritionResults}
            weeklyTotals={weeklyTotals}
            onClose={() => setOpenNutritionInfo(false)}
          />
        )}
      </Suspense>
    </Box>
  );
};

export default MealPlanner;
