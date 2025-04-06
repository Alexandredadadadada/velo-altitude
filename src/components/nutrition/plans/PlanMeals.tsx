import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  Chip,
  Button,
  useTheme,
  Card,
  CardContent,
  CardActions,
  Grid,
  Divider,
  Avatar
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AddIcon from '@mui/icons-material/Add';
import { NutritionPlan, Recipe, PlanMeal } from '../../../types';
import { useRouter } from 'next/router';

interface PlanMealsProps {
  plan: NutritionPlan;
  recommendedRecipes?: Recipe[];
}

const PlanMeals: React.FC<PlanMealsProps> = ({ plan, recommendedRecipes = [] }) => {
  const theme = useTheme();
  const router = useRouter();
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  
  const toggleExpand = (mealName: string) => {
    setExpandedMeal(expandedMeal === mealName ? null : mealName);
  };

  const handleRecipeClick = (recipeId: string) => {
    router.push(`/nutrition/recettes/${recipeId}`);
  };

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" component="h2">
          Repas journaliers
        </Typography>
        <Button 
          startIcon={<RestaurantIcon />} 
          variant="outlined" 
          size="small"
          onClick={() => router.push(`/nutrition/journal?planId=${plan.id}`)}
        >
          Journal alimentaire
        </Button>
      </Box>
      
      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
        <Table sx={{ minWidth: 650 }} aria-label="plan meals table">
          <TableHead sx={{ bgcolor: theme.palette.background.default }}>
            <TableRow>
              <TableCell width="40px" />
              <TableCell>Repas</TableCell>
              <TableCell>Heure</TableCell>
              <TableCell align="right">Calories</TableCell>
              <TableCell align="right">Protéines</TableCell>
              <TableCell align="right">Glucides</TableCell>
              <TableCell align="right">Lipides</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plan.meals.map((meal) => (
              <React.Fragment key={meal.name}>
                <TableRow 
                  sx={{ 
                    '&:hover': { 
                      bgcolor: theme.palette.action.hover 
                    },
                    cursor: 'pointer'
                  }}
                  onClick={() => toggleExpand(meal.name)}
                >
                  <TableCell>
                    <IconButton
                      aria-label="expand row"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(meal.name);
                      }}
                    >
                      {expandedMeal === meal.name ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                  </TableCell>
                  <TableCell component="th" scope="row">
                    <Typography variant="body1" fontWeight="medium">
                      {meal.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <AccessTimeIcon color="action" fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        {meal.time}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="medium">
                      {meal.calories} kcal
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip 
                      label={`${meal.macros.protein} g`} 
                      size="small" 
                      sx={{ 
                        bgcolor: `${theme.palette.primary.main}22`,
                        color: theme.palette.primary.main,
                        fontWeight: 'medium'
                      }} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Chip 
                      label={`${meal.macros.carbs} g`} 
                      size="small" 
                      sx={{ 
                        bgcolor: `${theme.palette.info.main}22`,
                        color: theme.palette.info.main,
                        fontWeight: 'medium'
                      }} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Chip 
                      label={`${meal.macros.fat} g`} 
                      size="small" 
                      sx={{ 
                        bgcolor: `${theme.palette.warning.main}22`,
                        color: theme.palette.warning.main,
                        fontWeight: 'medium'
                      }} 
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                    <Collapse in={expandedMeal === meal.name} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 2 }}>
                        <Typography variant="h6" gutterBottom component="div">
                          Aliments recommandés
                        </Typography>
                        
                        {meal.suggestedFoods && meal.suggestedFoods.length > 0 ? (
                          <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                            {meal.suggestedFoods.map((food, index) => (
                              <Chip 
                                key={index} 
                                label={food} 
                                variant="outlined" 
                                color="primary" 
                              />
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" paragraph>
                            Aucun aliment spécifique suggéré. Voir les recommandations de recettes ci-dessous.
                          </Typography>
                        )}
                        
                        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                          Recettes recommandées pour ce repas
                        </Typography>
                        
                        <Grid container spacing={2}>
                          {/* Filtre les recettes recommandées qui correspondent à ce repas */}
                          {recommendedRecipes
                            .filter(recipe => {
                              if (meal.name.toLowerCase().includes('petit-déjeuner')) return recipe.category === 'breakfast';
                              if (meal.name.toLowerCase().includes('collation')) return recipe.category === 'snack';
                              if (meal.name.toLowerCase().includes('déjeuner')) return recipe.category === 'lunch';
                              if (meal.name.toLowerCase().includes('dîner')) return recipe.category === 'dinner';
                              return true;
                            })
                            .slice(0, 3) // Limitez à 3 recettes par repas
                            .map(recipe => (
                              <Grid item xs={12} sm={6} md={4} key={recipe.id}>
                                <Card 
                                  variant="outlined" 
                                  sx={{ 
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                      transform: 'translateY(-4px)',
                                      boxShadow: 2
                                    }
                                  }}
                                  onClick={() => handleRecipeClick(recipe.id)}
                                >
                                  <CardContent sx={{ pb: 1 }}>
                                    <Box display="flex" alignItems="center" mb={1}>
                                      {recipe.image ? (
                                        <Avatar 
                                          src={recipe.image} 
                                          alt={recipe.title}
                                          variant="rounded"
                                          sx={{ width: 56, height: 56, mr: 2 }}
                                        />
                                      ) : (
                                        <Avatar 
                                          sx={{ 
                                            width: 56, 
                                            height: 56, 
                                            mr: 2,
                                            bgcolor: theme.palette.primary.main 
                                          }}
                                        >
                                          <RestaurantIcon />
                                        </Avatar>
                                      )}
                                      <Box>
                                        <Typography variant="subtitle1" component="div">
                                          {recipe.title}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          {recipe.prepTime} min • {recipe.calories} kcal
                                        </Typography>
                                      </Box>
                                    </Box>
                                    
                                    <Divider sx={{ my: 1 }} />
                                    
                                    <Typography 
                                      variant="body2" 
                                      color="text.secondary"
                                      sx={{
                                        display: '-webkit-box',
                                        overflow: 'hidden',
                                        WebkitBoxOrient: 'vertical',
                                        WebkitLineClamp: 2,
                                        minHeight: '40px'
                                      }}
                                    >
                                      {recipe.description}
                                    </Typography>
                                  </CardContent>
                                  <CardActions>
                                    <Button size="small">Voir la recette</Button>
                                  </CardActions>
                                </Card>
                              </Grid>
                            ))}
                            
                          {/* Bouton pour voir plus de recettes */}
                          <Grid item xs={12} sm={6} md={4}>
                            <Card 
                              variant="outlined" 
                              sx={{ 
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                p: 2,
                                cursor: 'pointer',
                                bgcolor: theme.palette.action.hover
                              }}
                              onClick={() => router.push('/nutrition/recettes')}
                            >
                              <AddIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
                              <Typography variant="body1" align="center">
                                Voir plus de recettes
                              </Typography>
                            </Card>
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
            <TableRow sx={{ bgcolor: theme.palette.action.hover }}>
              <TableCell colSpan={3} component="th" scope="row">
                <Typography variant="subtitle1" fontWeight="medium">
                  Total journalier
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography fontWeight="bold">
                  {plan.dailyCalories} kcal
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography fontWeight="bold">
                  {Math.round(plan.dailyCalories * plan.macroRatio.protein / 100 / 4)} g
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography fontWeight="bold">
                  {Math.round(plan.dailyCalories * plan.macroRatio.carbs / 100 / 4)} g
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography fontWeight="bold">
                  {Math.round(plan.dailyCalories * plan.macroRatio.fat / 100 / 9)} g
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle1" gutterBottom>
          Recommandations pour le cyclisme
        </Typography>
        
        <Typography variant="body2" paragraph>
          Adaptez votre alimentation en fonction du type d'effort prévu :
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color={theme.palette.primary.main} gutterBottom>
                Avant l'effort
              </Typography>
              <Typography variant="body2">
                Privilégiez les glucides complexes 2-3h avant l'effort (céréales complètes, pâtes, riz).
                Limitez les graisses et les fibres pour éviter l'inconfort digestif.
                Assurez-vous d'être bien hydraté.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color={theme.palette.info.main} gutterBottom>
                Pendant l'effort
              </Typography>
              <Typography variant="body2">
                Pour les efforts de plus d'1h30, consommez 30-60g de glucides par heure
                (barres énergétiques, gels, boissons sportives).
                Maintenez une hydratation régulière, environ 500-750ml/heure selon les conditions.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color={theme.palette.success.main} gutterBottom>
                Après l'effort
              </Typography>
              <Typography variant="body2">
                Dans les 30 minutes suivant l'effort, privilégiez les protéines (15-25g) combinées
                aux glucides pour favoriser la récupération musculaire. Réhydratez-vous avec de l'eau
                et des boissons contenant des électrolytes.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default PlanMeals;
