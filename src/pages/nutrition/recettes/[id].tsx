import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Chip, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon,
  ListItemText, 
  Button, 
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import Head from 'next/head';
import { useRouter } from 'next/router';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CheckIcon from '@mui/icons-material/Check';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NextLink from 'next/link';
import { APIOrchestrator } from '../../../api/orchestration';
import { Recipe } from '../../../types';

const RecipeDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const theme = useTheme();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [relatedRecipes, setRelatedRecipes] = useState<Recipe[]>([]);
  const apiOrchestrator = new APIOrchestrator();

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const recipeData = await apiOrchestrator.getRecipeById(id as string);
        setRecipe(recipeData);
        
        // Récupérer des recettes similaires (même catégorie ou tags)
        const allRecipes = await apiOrchestrator.getAllRecipes();
        const similar = allRecipes
          .filter(r => r.id !== recipeData.id)
          .filter(r => 
            r.category === recipeData.category || 
            r.tags.some(tag => recipeData.tags.includes(tag))
          )
          .slice(0, 3);
        
        setRelatedRecipes(similar);
        setError(null);
      } catch (err) {
        console.error(`Erreur lors du chargement de la recette ${id}:`, err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  // Fonction pour obtenir les informations liées à la catégorie
  const getCategoryInfo = () => {
    if (!recipe) return null;
    
    switch (recipe.category) {
      case 'before':
        return { 
          label: 'Avant effort', 
          color: theme.palette.info.main,
          icon: <FitnessCenterIcon />,
          description: 'Idéal pour préparer votre organisme avant une ascension de col.'
        };
      case 'during':
        return { 
          label: 'Pendant effort', 
          color: theme.palette.warning.main,
          icon: <LocalFireDepartmentIcon />,
          description: 'Conçu pour maintenir votre énergie pendant les montées difficiles.'
        };
      case 'after':
        return { 
          label: 'Récupération', 
          color: theme.palette.success.main,
          icon: <RestaurantIcon />,
          description: 'Parfait pour favoriser la récupération après un effort intense.'
        };
      case 'special':
        return { 
          label: 'Spécial cols', 
          color: theme.palette.secondary.main,
          icon: <LocalFireDepartmentIcon />,
          description: 'Adapté aux défis spécifiques des cols et aux ingrédients disponibles en altitude.'
        };
      default:
        return { 
          label: 'Recette', 
          color: theme.palette.primary.main,
          icon: <RestaurantIcon />,
          description: 'Recette nutritive adaptée aux cyclistes.'
        };
    }
  };

  const categoryInfo = recipe ? getCategoryInfo() : null;
  const placeholder = recipe ? `https://placehold.co/1200x800/e2e8f0/1e293b?text=${encodeURIComponent(recipe.name)}` : '';

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Box display="flex" justifyContent="center" alignItems="center">
          <CircularProgress />
          <Typography variant="h6" ml={2}>
            Chargement de la recette...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          Erreur lors du chargement de la recette: {error.message}
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/nutrition/recettes')}
        >
          Retour aux recettes
        </Button>
      </Container>
    );
  }

  if (!recipe) {
    return (
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <Alert severity="warning" sx={{ mb: 4 }}>
          Recette non trouvée
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/nutrition/recettes')}
        >
          Retour aux recettes
        </Button>
      </Container>
    );
  }

  return (
    <>
      <Head>
        <title>{recipe.name} | Recettes | Velo-Altitude</title>
        <meta name="description" content={recipe.description} />
      </Head>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Fil d'Ariane */}
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />} 
          aria-label="breadcrumb"
          sx={{ mb: 4 }}
        >
          <Link component={NextLink} href="/" underline="hover" color="inherit">
            Accueil
          </Link>
          <Link component={NextLink} href="/nutrition" underline="hover" color="inherit">
            Nutrition
          </Link>
          <Link component={NextLink} href="/nutrition/recettes" underline="hover" color="inherit">
            Recettes
          </Link>
          <Typography color="text.primary">{recipe.name}</Typography>
        </Breadcrumbs>

        {/* En-tête */}
        <Box mb={4}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h3" component="h1" gutterBottom>
                {recipe.name}
              </Typography>
              
              <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                <Chip 
                  icon={categoryInfo?.icon} 
                  label={categoryInfo?.label} 
                  sx={{ 
                    backgroundColor: categoryInfo?.color,
                    color: '#fff',
                    fontWeight: 'bold'
                  }} 
                />
                
                {recipe.tags.map((tag) => (
                  <Chip 
                    key={tag} 
                    label={tag} 
                    variant="outlined" 
                    size="small" 
                  />
                ))}
              </Box>
            </Box>
            
            <Button 
              variant="outlined" 
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/nutrition/recettes')}
            >
              Retour aux recettes
            </Button>
          </Box>
          
          <Typography variant="body1" paragraph>
            {recipe.description}
          </Typography>
        </Box>

        {/* Contenu principal */}
        <Grid container spacing={4}>
          {/* Colonne de gauche */}
          <Grid item xs={12} md={8}>
            <Box mb={4}>
              <Box 
                component="img" 
                src={recipe.imageUrl || placeholder} 
                alt={recipe.name}
                sx={{ 
                  width: '100%', 
                  borderRadius: 2,
                  maxHeight: 500,
                  objectFit: 'cover',
                  boxShadow: 3
                }} 
              />
            </Box>
            
            {/* Informations nutritionnelles */}
            <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
              <Typography variant="h5" gutterBottom>
                Informations nutritionnelles
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="primary">
                      {recipe.nutritionFacts.calories}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Calories (kcal)
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                      {recipe.nutritionFacts.protein}g
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Protéines
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" sx={{ color: theme.palette.info.main }}>
                      {recipe.nutritionFacts.carbs}g
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Glucides
                    </Typography>
                    {recipe.nutritionFacts.sugar && (
                      <Typography variant="caption" color="text.secondary">
                        (dont {recipe.nutritionFacts.sugar}g de sucres)
                      </Typography>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" sx={{ color: theme.palette.warning.main }}>
                      {recipe.nutritionFacts.fat}g
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Lipides
                    </Typography>
                    {recipe.nutritionFacts.saturatedFat && (
                      <Typography variant="caption" color="text.secondary">
                        (dont {recipe.nutritionFacts.saturatedFat}g saturés)
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              
              <Grid container spacing={2}>
                {recipe.nutritionFacts.fiber && (
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2">
                      Fibres: {recipe.nutritionFacts.fiber}g
                    </Typography>
                  </Grid>
                )}
                
                {recipe.nutritionFacts.sodium && (
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2">
                      Sodium: {recipe.nutritionFacts.sodium}mg
                    </Typography>
                  </Grid>
                )}
                
                {recipe.nutritionFacts.potassium && (
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2">
                      Potassium: {recipe.nutritionFacts.potassium}mg
                    </Typography>
                  </Grid>
                )}
                
                {recipe.nutritionFacts.calcium && (
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2">
                      Calcium: {recipe.nutritionFacts.calcium}mg
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
            
            {/* Instructions */}
            <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
              <Typography variant="h5" gutterBottom>
                Instructions
              </Typography>
              
              <List>
                {recipe.instructions.map((instruction, index) => (
                  <ListItem 
                    key={index}
                    alignItems="flex-start"
                    sx={{ 
                      py: 1,
                      px: 0,
                      borderBottom: index < recipe.instructions.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider'
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Box 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="center" 
                        sx={{ 
                          width: 28, 
                          height: 28, 
                          borderRadius: '50%', 
                          bgcolor: 'primary.main',
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      >
                        {index + 1}
                      </Box>
                    </ListItemIcon>
                    <ListItemText 
                      primary={instruction} 
                      primaryTypographyProps={{ 
                        variant: 'body1', 
                        style: { whiteSpace: 'pre-line' } 
                      }} 
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
            
            {/* Conseils nutritionnels */}
            <Paper elevation={2} sx={{ p: 3, mb: { xs: 4, md: 0 }, borderRadius: 2 }}>
              <Typography variant="h5" gutterBottom>
                Conseils nutritionnels pour les cyclistes
              </Typography>
              
              <Box bgcolor={categoryInfo?.color} sx={{ p: 2, borderRadius: 1, color: 'white', mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {categoryInfo?.label} - {categoryInfo?.description}
                </Typography>
              </Box>
              
              <Typography variant="body1" paragraph>
                Cette recette est spécialement conçue pour les cyclistes qui affrontent des cols difficiles. 
                Elle fournit un équilibre optimal de nutriments pour supporter l'effort intense de l'ascension.
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Riche en glucides complexes pour une libération progressive d'énergie"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Contient des protéines de qualité pour soutenir la fonction musculaire"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Apporte des électrolytes essentiels pour compenser la perte due à la transpiration"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Facilement digestible pour éviter l'inconfort pendant l'effort"
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
          
          {/* Colonne de droite */}
          <Grid item xs={12} md={4}>
            {/* Informations de base */}
            <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Informations de la recette
              </Typography>
              
              <Box display="flex" alignItems="center" mb={2}>
                <AccessTimeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body1">
                  Temps de préparation: {recipe.prepTime} minutes
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" mb={2}>
                <LocalFireDepartmentIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body1">
                  Calories par portion: {recipe.nutritionFacts.calories} kcal
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center">
                <RestaurantIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body1">
                  Nombre de portions: {recipe.servings}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" gutterBottom>
                Difficulté:
              </Typography>
              <Box>
                <Chip 
                  label={
                    recipe.difficulty === 'easy' ? 'Facile' : 
                    recipe.difficulty === 'medium' ? 'Moyenne' : 
                    'Difficile'
                  }
                  color={
                    recipe.difficulty === 'easy' ? 'success' : 
                    recipe.difficulty === 'medium' ? 'primary' : 
                    'error'
                  }
                  size="small"
                />
              </Box>
            </Paper>
            
            {/* Ingrédients */}
            <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Ingrédients
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Pour {recipe.servings} portions
              </Typography>
              
              <List>
                {recipe.ingredients.map((ingredient, index) => (
                  <ListItem 
                    key={index}
                    sx={{ 
                      py: 1,
                      px: 0,
                      borderBottom: index < recipe.ingredients.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider'
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <CheckIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography variant="body1">
                          {ingredient.name}
                        </Typography>
                      }
                      secondary={`${ingredient.quantity} ${ingredient.unit}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
            
            {/* Recettes similaires */}
            {relatedRecipes.length > 0 && (
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Recettes similaires
                </Typography>
                
                <Box display="flex" flexDirection="column" gap={2}>
                  {relatedRecipes.map((relatedRecipe) => (
                    <Card 
                      key={relatedRecipe.id} 
                      elevation={1}
                      sx={{ 
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)'
                        }
                      }}
                      onClick={() => router.push(`/nutrition/recettes/${relatedRecipe.id}`)}
                    >
                      <Box display="flex">
                        <Box 
                          sx={{ 
                            width: 100, 
                            height: 100,
                            backgroundImage: `url(${relatedRecipe.imageUrl || `https://placehold.co/100x100/e2e8f0/1e293b?text=${encodeURIComponent(relatedRecipe.name)}`})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }} 
                        />
                        <CardContent sx={{ flex: 1, py: 1.5 }}>
                          <Typography variant="subtitle1" noWrap>
                            {relatedRecipe.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {relatedRecipe.prepTime} min • {relatedRecipe.calories} kcal
                          </Typography>
                          <Chip 
                            label={
                              relatedRecipe.category === 'before' ? 'Avant effort' : 
                              relatedRecipe.category === 'during' ? 'Pendant effort' : 
                              relatedRecipe.category === 'after' ? 'Récupération' : 
                              'Spécial cols'
                            }
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        </CardContent>
                      </Box>
                    </Card>
                  ))}
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default RecipeDetailPage;
