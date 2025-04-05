import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Grid, Paper, Divider, Chip, Button, Card, CardContent,
  List, ListItem, ListItemText, ListItemIcon, Tab, Tabs, Breadcrumbs, Link,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
  CircularProgress, Alert, LinearProgress, Container
} from '@mui/material';
import { 
  Fastfood, DirectionsBike, WhatshotOutlined, FitnessCenterOutlined, 
  Schedule, TimerOutlined, Restaurant, WaterDrop, NavigateNext, ArrowBack,
  BookmarkBorderOutlined, BookmarkOutlined, InfoOutlined, Print, Share
} from '@mui/icons-material';
import nutritionPlans from '../../data/nutritionPlans';
import nutritionRecipes from '../../data/nutritionRecipes';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Composant d'affichage détaillé d'un plan nutritionnel spécifique
 * Affiche les stratégies, recommandations et exemples de repas pour un type d'effort
 */
const NutritionPlanDetail = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    // Récupération du plan nutritionnel
    const loadPlan = () => {
      try {
        setLoading(true);
        
        if (!planId || !nutritionPlans[planId]) {
          setError('Plan nutritionnel non trouvé');
          setLoading(false);
          return;
        }
        
        setPlan(nutritionPlans[planId]);
        
        // Vérifier si ce plan est dans les favoris de l'utilisateur
        if (user && user.id) {
          // Cette logique serait normalement gérée par un appel API
          const isFav = localStorage.getItem(`favorite_plan_${user.id}_${planId}`) === 'true';
          setIsFavorite(isFav);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement du plan nutritionnel');
        setLoading(false);
      }
    };
    
    loadPlan();
  }, [planId, user]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleToggleFavorite = () => {
    if (user && user.id) {
      const newStatus = !isFavorite;
      setIsFavorite(newStatus);
      
      // En production, ceci serait un appel API
      localStorage.setItem(`favorite_plan_${user.id}_${planId}`, newStatus.toString());
    } else {
      // Rediriger vers la page de connexion ou afficher un message
      alert('Veuillez vous connecter pour ajouter ce plan à vos favoris');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Convertir pourcentage en représentation visuelle
  const renderMacroPercentage = (percentage) => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress 
            variant="determinate" 
            value={percentage} 
            sx={{ 
              height: 10, 
              borderRadius: 5,
              backgroundColor: 'grey.300',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 
                  percentage > 60 ? 'success.main' :
                  percentage > 30 ? 'warning.main' :
                  'error.main'
              }
            }}
          />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="text.secondary">{`${percentage}%`}</Typography>
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !plan) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Alert severity="error">
          {error || 'Plan nutritionnel non trouvé'}
        </Alert>
      </Box>
    );
  }

  // Trouver des recettes associées à ce type de plan
  const associatedRecipes = planId === 'endurance' 
    ? [...nutritionRecipes.preRide, ...nutritionRecipes.duringRide, ...nutritionRecipes.postRide]
    : planId === 'highIntensity'
      ? [...nutritionRecipes.preRide, ...nutritionRecipes.duringRide, ...nutritionRecipes.postRide]
      : planId === 'mountain'
        ? [...nutritionRecipes.preRide, ...nutritionRecipes.duringRide, ...nutritionRecipes.postRide, ...nutritionRecipes.colSpecific]
        : [];

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mb: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link component={RouterLink} to="/" color="inherit">
            Accueil
          </Link>
          <Link component={RouterLink} to="/nutrition" color="inherit">
            Nutrition
          </Link>
          <Link component={RouterLink} to="/nutrition/plans" color="inherit">
            Plans
          </Link>
          <Typography color="text.primary">{plan.name}</Typography>
        </Breadcrumbs>

        {/* En-tête avec actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button 
            startIcon={<ArrowBack />} 
            variant="outlined" 
            onClick={() => navigate(-1)}
          >
            Retour
          </Button>
          <Box>
            <IconButton onClick={handleToggleFavorite} color={isFavorite ? 'primary' : 'default'}>
              {isFavorite ? <BookmarkOutlined /> : <BookmarkBorderOutlined />}
            </IconButton>
            <IconButton onClick={handlePrint}>
              <Print />
            </IconButton>
            <IconButton>
              <Share />
            </IconButton>
          </Box>
        </Box>

        {/* Titre et description */}
        <Typography variant="h4" component="h1" gutterBottom>
          {plan.name}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {plan.description}
        </Typography>

        {/* Public cible */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Recommandé pour :
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {plan.suitableFor.map((target, index) => (
              <Chip 
                key={index} 
                label={target} 
                icon={<DirectionsBike />} 
                variant="outlined" 
                color="primary" 
              />
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Onglets */}
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Aperçu" />
          <Tab label="Stratégie nutritionnelle" />
          <Tab label="Recettes recommandées" />
          <Tab label="Suppléments" />
        </Tabs>

        {/* Contenu des onglets */}
        <Box sx={{ mb: 4 }}>
          {/* Tab 1: Aperçu */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Répartition des macronutriments
                    </Typography>
                    <Box sx={{ my: 2 }}>
                      <Typography variant="body2" gutterBottom>Glucides</Typography>
                      {renderMacroPercentage(plan.macroRatio.carbs)}
                    </Box>
                    <Box sx={{ my: 2 }}>
                      <Typography variant="body2" gutterBottom>Protéines</Typography>
                      {renderMacroPercentage(plan.macroRatio.protein)}
                    </Box>
                    <Box sx={{ my: 2 }}>
                      <Typography variant="body2" gutterBottom>Lipides</Typography>
                      {renderMacroPercentage(plan.macroRatio.fat)}
                    </Box>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Stratégie d'hydratation
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <TimerOutlined />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Avant l'effort" 
                          secondary={plan.hydrationStrategy.beforeRide} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <DirectionsBike />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Pendant l'effort" 
                          secondary={plan.hydrationStrategy.duringRide} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <WaterDrop />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Électrolytes" 
                          secondary={plan.hydrationStrategy.electrolytes} 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Exemples de repas
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="primary">
                        Avant l'effort
                      </Typography>
                      {plan.timingStrategies.preworkout.examples.map((meal, index) => (
                        <Box key={index} sx={{ mt: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {meal.meal}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {meal.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                            <Chip 
                              label={`${meal.nutrients.calories} kcal`} 
                              size="small" 
                              variant="outlined" 
                              icon={<WhatshotOutlined fontSize="small" />}
                            />
                            <Chip 
                              label={`${meal.nutrients.carbs}g glucides`} 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" color="primary">
                        Pendant l'effort
                      </Typography>
                      {plan.timingStrategies.duringWorkout.examples.slice(0, 2).map((food, index) => (
                        <Box key={index} sx={{ mt: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {food.food} ({food.portion})
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                            <Chip 
                              label={`${food.nutrients.calories} kcal`} 
                              size="small" 
                              variant="outlined" 
                              icon={<WhatshotOutlined fontSize="small" />}
                            />
                            <Chip 
                              label={`${food.nutrients.carbs}g glucides`} 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Tab 2: Stratégie nutritionnelle */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Stratégie nutritionnelle détaillée
                    </Typography>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Avant l'effort ({plan.timingStrategies.preworkout.timing})
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {plan.timingStrategies.preworkout.description}
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Macronutriment</TableCell>
                              <TableCell align="right">Pourcentage</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell>Glucides</TableCell>
                              <TableCell align="right">{plan.timingStrategies.preworkout.macroRatio.carbs}%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Protéines</TableCell>
                              <TableCell align="right">{plan.timingStrategies.preworkout.macroRatio.protein}%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Lipides</TableCell>
                              <TableCell align="right">{plan.timingStrategies.preworkout.macroRatio.fat}%</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Pendant l'effort ({plan.timingStrategies.duringWorkout.timing})
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {plan.timingStrategies.duringWorkout.description}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Stratégie:</strong> {plan.timingStrategies.duringWorkout.strategy}
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Macronutriment</TableCell>
                              <TableCell align="right">Pourcentage</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell>Glucides</TableCell>
                              <TableCell align="right">{plan.timingStrategies.duringWorkout.macroRatio.carbs}%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Protéines</TableCell>
                              <TableCell align="right">{plan.timingStrategies.duringWorkout.macroRatio.protein}%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Lipides</TableCell>
                              <TableCell align="right">{plan.timingStrategies.duringWorkout.macroRatio.fat}%</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Après l'effort ({plan.timingStrategies.postWorkout.timing})
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {plan.timingStrategies.postWorkout.description}
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Macronutriment</TableCell>
                              <TableCell align="right">Pourcentage</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell>Glucides</TableCell>
                              <TableCell align="right">{plan.timingStrategies.postWorkout.macroRatio.carbs}%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Protéines</TableCell>
                              <TableCell align="right">{plan.timingStrategies.postWorkout.macroRatio.protein}%</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Lipides</TableCell>
                              <TableCell align="right">{plan.timingStrategies.postWorkout.macroRatio.fat}%</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Tab 3: Recettes recommandées */}
          {activeTab === 2 && (
            <Grid container spacing={2}>
              {associatedRecipes.length > 0 ? (
                associatedRecipes.map((recipe) => (
                  <Grid item xs={12} sm={6} md={4} key={recipe.id}>
                    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {recipe.name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          <Chip 
                            label={recipe.category} 
                            size="small" 
                            variant="outlined" 
                            icon={<Restaurant fontSize="small" />}
                          />
                          <Chip 
                            label={`${recipe.prepTime + (recipe.cookTime || 0)} min`} 
                            size="small" 
                            variant="outlined" 
                            icon={<Schedule fontSize="small" />}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {recipe.timing}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Calories:</strong> {recipe.nutritionalInfo.calories} kcal
                        </Typography>
                        <Typography variant="body2">
                          <strong>Macros:</strong> {recipe.nutritionalInfo.macros.carbs}g glucides, {recipe.nutritionalInfo.macros.protein}g protéines, {recipe.nutritionalInfo.macros.fat}g lipides
                        </Typography>
                      </CardContent>
                      <Box sx={{ p: 2, pt: 0 }}>
                        <Button 
                          component={RouterLink} 
                          to={`/nutrition/recipes/${recipe.id}`} 
                          variant="outlined" 
                          fullWidth
                        >
                          Voir la recette
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Aucune recette spécifique disponible pour ce plan nutritionnel.
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}

          {/* Tab 4: Suppléments */}
          {activeTab === 3 && (
            <Grid container spacing={3}>
              {plan.supplementsRecommended.map((supplement, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {supplement.name}
                      </Typography>
                      <List>
                        <ListItem>
                          <ListItemIcon>
                            <InfoOutlined />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Dosage" 
                            secondary={supplement.dosage} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <TimerOutlined />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Timing" 
                            secondary={supplement.timing} 
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <FitnessCenterOutlined />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Bénéfices" 
                            secondary={supplement.benefits} 
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {plan.supplementsRecommended.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Aucun supplément spécifique recommandé pour ce plan nutritionnel.
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default NutritionPlanDetail;
