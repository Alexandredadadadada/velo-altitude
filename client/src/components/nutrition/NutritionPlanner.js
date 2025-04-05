import React, { memo, useMemo, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Divider,
  Alert,
  CircularProgress,
  Grid,
  Button,
  IconButton,
  Badge,
  useMediaQuery,
  useTheme,
  SwipeableDrawer
} from '@mui/material';
import {
  CalculateOutlined as CalculateIcon,
  RestaurantMenuOutlined as RestaurantMenuIcon,
  MenuBookOutlined as MenuBookIcon,
  BookmarkOutlined as SavedSearchIcon,
  InfoOutlined as InfoIcon,
  ArrowBackOutlined as BackIcon
} from '@mui/icons-material';

// Hooks personnalisés
import useNutritionPlanner from './hooks/useNutritionPlanner';

// Composants
// Utilisation de React.lazy pour charger les composants à la demande
const NutritionCalculator = lazy(() => import('./components/NutritionCalculator'));
const NutritionResults = lazy(() => import('./components/NutritionResults'));
const MealPlan = lazy(() => import('./components/MealPlan'));
const FoodJournal = lazy(() => import('./components/FoodJournal'));
const SavedPlans = lazy(() => import('./components/SavedPlans'));
import Breadcrumbs from '../common/Breadcrumbs';

/**
 * Composant principal pour la planification nutritionnelle des cyclistes
 * Standardisé avec Material-UI et optimisé avec React.memo pour éviter les re-renders inutiles
 */
const NutritionPlanner = memo(() => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Utilisation du hook personnalisé qui centralise la logique et les états
  const {
    // États
    activeTab,
    showResults,
    userProfile,
    calculatorResults,
    mealPlan,
    savedPlans,
    planName,
    showSaveForm,
    hasCalculatedPlan,
    error,
    loading,
    
    // Fonctions
    setUserProfile,
    calculateNutrition,
    setPlanName,
    setShowSaveForm,
    handleTabChange,
    handleSavePlan,
    resetCalculator,
    deletePlan,
    
    // Hook du journal alimentaire
    foodJournal
  } = useNutritionPlanner();
  
  // Composant de chargement pour Suspense
  const renderLoader = useMemo(() => (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
      <CircularProgress aria-label="Chargement en cours" />
    </Box>
  ), []);

  // Rendu des onglets adaptatif pour mobile et desktop
  const renderTabs = useMemo(() => (
    <Tabs
      value={activeTab}
      onChange={handleTabChange}
      indicatorColor="primary"
      textColor="primary"
      variant={isMobile ? "scrollable" : "fullWidth"}
      scrollButtons={isMobile ? "auto" : false}
      aria-label="Navigation planificateur nutritionnel"
      sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        '& .MuiTab-root': {
          minWidth: isMobile ? 'auto' : 0,
          padding: isMobile ? '6px 12px' : '12px 16px'
        }
      }}
    >
      <Tab 
        icon={<CalculateIcon />} 
        label={isMobile ? '' : t('nutrition.tab_calculator')} 
        iconPosition="start"
        aria-label={t('nutrition.tab_calculator')}
        sx={{ fontWeight: activeTab === 0 ? 'bold' : 'normal' }}
      />
      <Tab 
        icon={<RestaurantMenuIcon />} 
        label={isMobile ? '' : t('nutrition.tab_meal_plan')} 
        iconPosition="start"
        aria-label={t('nutrition.tab_meal_plan')}
        sx={{ fontWeight: activeTab === 1 ? 'bold' : 'normal' }}
        disabled={!calculatorResults}
      />
      <Tab 
        icon={<MenuBookIcon />} 
        label={isMobile ? '' : t('nutrition.tab_food_journal')} 
        iconPosition="start"
        aria-label={t('nutrition.tab_food_journal')}
        sx={{ fontWeight: activeTab === 2 ? 'bold' : 'normal' }}
      />
      <Tab 
        icon={
          <Badge 
            color="primary" 
            badgeContent={savedPlans?.length || 0} 
            showZero={false}
          >
            <SavedSearchIcon />
          </Badge>
        } 
        label={isMobile ? '' : t('nutrition.tab_saved_plans')} 
        iconPosition="start"
        aria-label={t('nutrition.tab_saved_plans')}
        sx={{ fontWeight: activeTab === 3 ? 'bold' : 'normal' }}
      />
    </Tabs>
  ), [activeTab, handleTabChange, isMobile, t, calculatorResults, savedPlans]);
  
  return (
    <Container maxWidth="lg" sx={{ mb: 6, mt: 3, px: { xs: 1, sm: 2, md: 3 } }}>
      {/* Breadcrumbs pour la navigation */}
      <Box mb={3} role="navigation" aria-label="Fil d'Ariane">
        <Breadcrumbs />
      </Box>
      
      {/* En-tête de page */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('nutrition.planner_title')}
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {t('nutrition.planner_description')}
        </Typography>
      </Box>
      
      {/* Navigation par onglets */}
      <Paper elevation={2} sx={{ mb: 4 }}>
        {renderTabs}
      </Paper>
      
      {/* Contenu de l'onglet actif */}
      <Box>
        <Suspense fallback={renderLoader}>
          {/* Onglet Calculateur nutritionnel */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <NutritionCalculator
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                  onCalculate={calculateNutrition}
                  loading={loading && activeTab === 0}
                  error={error && activeTab === 0}
                />
                
                {showResults && calculatorResults && (
                  <Box sx={{ mt: 3 }}>
                    <NutritionResults calculatorResults={calculatorResults} />
                  </Box>
                )}
              </Grid>
            </Grid>
          )}
          
          {/* Onglet Plan de repas */}
          {activeTab === 1 && (
            <Box>
              {!hasCalculatedPlan ? (
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                  <Alert 
                    severity="info" 
                    icon={<InfoIcon />}
                    action={
                      <Button 
                        color="inherit" 
                        size="small" 
                        startIcon={<CalculateIcon />}
                        onClick={() => handleTabChange(null, 0)}
                      >
                        {t('nutrition.go_to_calculator')}
                      </Button>
                    }
                    sx={{ mb: 2 }}
                  >
                    {t('nutrition.calculate_first')}
                  </Alert>
                </Paper>
              ) : (
                <>
                  <Box mb={3} display="flex" alignItems="center">
                    <IconButton 
                      onClick={() => handleTabChange(null, 0)} 
                      sx={{ mr: 1 }}
                      color="primary"
                      aria-label="retour au calculateur"
                    >
                      <BackIcon />
                    </IconButton>
                    <Typography variant="h6">
                      {t('nutrition.your_results')}
                    </Typography>
                  </Box>
                  
                  <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                    <NutritionResults calculatorResults={calculatorResults} />
                  </Paper>
                  
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h5" gutterBottom>
                      {t('nutrition.your_meal_plan')}
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    
                    <MealPlan
                      mealPlan={mealPlan}
                      nutritionResults={calculatorResults}
                      onSavePlan={handleSavePlan}
                      showSaveForm={showSaveForm}
                      setShowSaveForm={setShowSaveForm}
                      planName={planName}
                      setPlanName={setPlanName}
                    />
                  </Box>
                </>
              )}
            </Box>
          )}
          
          {/* Onglet Journal alimentaire */}
          {activeTab === 2 && (
            <Box>
              <FoodJournal
                foodJournal={foodJournal.foodJournal}
                journalDates={foodJournal.journalDates}
                foodSearch={foodJournal.foodSearch}
                searchResults={foodJournal.searchResults}
                selectedFood={foodJournal.selectedFood}
                selectedMeal={foodJournal.selectedMeal}
                foodQuantity={foodJournal.foodQuantity}
                setFoodSearch={foodJournal.setFoodSearch}
                setSelectedMeal={foodJournal.setSelectedMeal}
                setFoodQuantity={foodJournal.setFoodQuantity}
                changeJournalDate={foodJournal.changeJournalDate}
                selectFood={foodJournal.selectFood}
                addFoodToJournal={foodJournal.addFoodToJournal}
                removeFoodFromJournal={foodJournal.removeFoodFromJournal}
                loading={loading && activeTab === 2}
                error={error && activeTab === 2}
                isMobile={isMobile}
              />
            </Box>
          )}
          
          {/* Onglet Plans sauvegardés */}
          {activeTab === 3 && (
            <Box>
              {loading ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress aria-label="Chargement des plans sauvegardés" />
                </Box>
              ) : (
                <SavedPlans
                  savedPlans={savedPlans}
                  deletePlan={deletePlan}
                  error={error && activeTab === 3}
                  isMobile={isMobile}
                />
              )}
            </Box>
          )}
        </Suspense>
      </Box>
    </Container>
  );
});

export default NutritionPlanner;
