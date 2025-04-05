import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { 
  Container, 
  Grid, 
  Typography, 
  Paper, 
  Box, 
  Tab, 
  Tabs, 
  CircularProgress, 
  Alert, 
  Button,
  Snackbar,
  IconButton
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import nutritionService from '../services/nutritionService';
import { lazyLoad, LoadingFallback } from '../utils/lazyLoadHelper';
import { Close as CloseIcon, Refresh as RefreshIcon } from '@mui/icons-material';

// Interface pour l'affichage des données nutritionnelles du cycliste
const NutritionPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [notification, setNotification] = useState(null);
  const [timeoutId, setTimeoutId] = useState(null);

  // Lazy load des composants pour optimiser les performances
  const NutritionDashboard = lazyLoad(() => import('../components/nutrition/NutritionDashboard'), {
    moduleName: 'Tableau de bord nutritionnel',
    skeletonType: 'complex'
  });

  const NutritionCalculator = lazyLoad(() => import('../components/nutrition/NutritionCalculator'), {
    moduleName: 'Calculateur nutritionnel',
    skeletonType: 'content'
  });

  const NutritionRecommendations = lazyLoad(() => import('../components/nutrition/NutritionRecommendations'), {
    moduleName: 'Recommandations nutritionnelles',
    skeletonType: 'card'
  });

  const MealPlanner = lazyLoad(() => import('../components/nutrition/MealPlanner'), {
    moduleName: 'Planificateur de repas',
    skeletonType: 'complex',
    minDelay: 500
  });

  const NutritionRecipesExplorer = lazyLoad(() => import('../components/nutrition/NutritionRecipesExplorer'), {
    moduleName: 'Explorateur de recettes',
    skeletonType: 'complex'
  });

  // Récupérer les données nutritionnelles de l'utilisateur
  const fetchNutritionData = useCallback(async () => {
    if (!user || !user.id) {
      setError("Vous devez être connecté pour accéder à cette page.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Configurer un timeout pour éviter une attente trop longue
      const timeout = setTimeout(() => {
        setError("La requête a pris trop de temps. Veuillez réessayer.");
        setLoading(false);
      }, 8000);
      
      const data = await nutritionService.getUserNutritionData(user.id);
      
      // Annuler le timeout si la requête a réussi
      clearTimeout(timeout);
      
      if (!data) {
        throw new Error("Aucune donnée nutritionnelle disponible.");
      }
      
      // Vérifier si les données sont complètes
      const isDataComplete = checkDataCompleteness(data);
      if (!isDataComplete) {
        setNotification({
          severity: 'warning',
          message: 'Certaines données de votre profil sont incomplètes. Complétez votre profil pour des recommandations plus précises.'
        });
      }
      
      setNutritionData(data);
    } catch (err) {
      console.error("Erreur lors de la récupération des données nutritionnelles:", err);
      setError("Impossible de charger vos données nutritionnelles. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Vérifier si les données du profil sont complètes
  const checkDataCompleteness = (data) => {
    if (!data) return false;
    
    // Vérifier les données essentielles
    const hasMetrics = data.metrics && 
                      data.metrics.weight && 
                      data.metrics.height && 
                      data.metrics.age;
                      
    const hasGoals = data.goals && 
                    data.goals.type;
                    
    const hasActivity = data.metrics && 
                       data.metrics.activityLevel;
    
    return hasMetrics && hasGoals && hasActivity;
  };

  // Charger les données au montage du composant
  useEffect(() => {
    fetchNutritionData();
    
    // Nettoyer le timeout en cas de démontage du composant
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [fetchNutritionData]);

  // Gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Fermer les notifications
  const handleCloseNotification = () => {
    setNotification(null);
  };

  // Rafraîchir les données
  const handleRefresh = () => {
    fetchNutritionData();
  };

  // Afficher un message d'erreur si l'utilisateur n'est pas connecté
  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Vous devez être connecté pour accéder à cette page.
        </Alert>
      </Container>
    );
  }

  // Afficher un indicateur de chargement
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>Chargement de vos données nutritionnelles...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* En-tête */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Nutrition
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Actualiser
          </Button>
        </Box>
        <Typography variant="body1">
          Optimisez votre alimentation pour améliorer vos performances cyclistes et votre récupération.
        </Typography>
      </Paper>
      
      {/* Affichage des erreurs */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Réessayer
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      {/* Navigation par onglets */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Tableau de bord" />
          <Tab label="Calculateur nutritionnel" />
          <Tab label="Recommandations" />
          <Tab label="Planificateur de repas" />
          <Tab label="Explorateur de recettes" />
        </Tabs>
      </Box>
      
      {/* Contenu des onglets */}
      <Box sx={{ mt: 2 }}>
        {/* Tableau de bord nutritionnel */}
        {currentTab === 0 && (
          <Suspense fallback={<LoadingFallback moduleName="Tableau de bord nutritionnel" />}>
            <NutritionDashboard 
              nutritionData={nutritionData} 
              userId={user.id} 
              onRefresh={handleRefresh} 
            />
          </Suspense>
        )}
        
        {/* Calculateur nutritionnel */}
        {currentTab === 1 && (
          <Suspense fallback={<LoadingFallback moduleName="Calculateur nutritionnel" />}>
            <NutritionCalculator 
              userId={user.id} 
              nutritionData={nutritionData} 
              onCalculationComplete={(data) => {
                // Mise à jour des données nutritionnelles avec les nouveaux calculs
                setNutritionData(prevData => ({
                  ...prevData,
                  calculations: data
                }));
                
                // Afficher une notification de succès
                setNotification({
                  severity: 'success',
                  message: 'Calculs nutritionnels mis à jour avec succès !'
                });
              }}
            />
          </Suspense>
        )}
        
        {/* Recommandations nutritionnelles */}
        {currentTab === 2 && (
          <Suspense fallback={<LoadingFallback moduleName="Recommandations nutritionnelles" />}>
            <NutritionRecommendations 
              userId={user.id} 
              nutritionData={nutritionData} 
            />
          </Suspense>
        )}
        
        {/* Planificateur de repas */}
        {currentTab === 3 && (
          <Suspense fallback={<LoadingFallback moduleName="Planificateur de repas" />}>
            <MealPlanner 
              nutritionData={nutritionData} 
              userId={user.id} 
            />
          </Suspense>
        )}
        
        {/* Explorateur de recettes */}
        {currentTab === 4 && (
          <Suspense fallback={<LoadingFallback moduleName="Explorateur de recettes" />}>
            <NutritionRecipesExplorer 
              userProfile={nutritionData ? {
                goal: nutritionData.goals?.type || 'performance',
                dietaryRestrictions: nutritionData.preferences?.dietaryRestrictions || [],
                weight: nutritionData.metrics?.weight,
                preferences: nutritionData.preferences?.favoriteRecipes || []
              } : null}
            />
          </Suspense>
        )}
      </Box>
      
      {/* Notifications */}
      <Snackbar
        open={notification !== null}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        message={notification?.message}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={handleCloseNotification}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        ContentProps={{
          sx: { 
            backgroundColor: notification?.severity === 'success' ? 'success.main' : 
                            notification?.severity === 'warning' ? 'warning.main' : 
                            notification?.severity === 'error' ? 'error.main' : 'info.main' 
          }
        }}
      />
    </Container>
  );
};

export default NutritionPage;
