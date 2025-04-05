import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  Divider, 
  IconButton, 
  Button, 
  Grid, 
  CircularProgress, 
  Breadcrumbs,
  Link,
  useMediaQuery,
  Tooltip,
  Snackbar,
  Alert,
  Zoom,
  Fade
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { 
  ArrowBack as ArrowBackIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Restaurant as RestaurantIcon,
  DirectionsBike as BikeIcon,
  Timer as TimerIcon
} from '@mui/icons-material';

// Import des composants personnalisés
import NutritionInfographic from '../../components/nutrition/recipes/NutritionInfographic';
import RecipeStepByStep from '../../components/nutrition/recipes/RecipeStepByStep';
import nutritionService from '../../services/nutritionService';
import { useAuth } from '../../contexts/AuthContext';
import SEO from '../../components/common/SEO';

// Styles personnalisés
const RecipeHero = styled(Box)(({ theme }) => ({
  position: 'relative',
  height: 400,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  color: 'white',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  marginBottom: theme.spacing(4),
  [theme.breakpoints.down('sm')]: {
    height: 300,
    padding: theme.spacing(3),
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 100%)',
    zIndex: 1
  }
}));

const RecipeContent = styled(Paper)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  padding: theme.spacing(4),
  position: 'relative',
  zIndex: 2,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  }
}));

const RecipeTitle = styled(Typography)(({ theme }) => ({
  position: 'relative',
  zIndex: 2,
  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
  [theme.breakpoints.down('sm')]: {
    fontSize: '2rem',
  }
}));

const RecipeTag = styled(Box)(({ theme }) => ({
  display: 'inline-block',
  padding: '4px 10px',
  borderRadius: 20,
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  color: theme.palette.text.primary,
  marginRight: theme.spacing(1),
  marginBottom: theme.spacing(1),
  fontSize: '0.875rem',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: 4
}));

const ActionButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  borderRadius: theme.shape.borderRadius * 2,
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: theme.shadows[2],
  '&:hover': {
    boxShadow: theme.shadows[4],
  }
}));

// Composant principal de la page de recette améliorée
const EnhancedRecipePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // États
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Récupération des données de la recette
  useEffect(() => {
    const fetchRecipeData = async () => {
      try {
        setLoading(true);
        
        // Récupération de la recette
        const recipeData = await nutritionService.getRecipeById(id);
        if (!recipeData) {
          throw new Error('Recette non trouvée');
        }
        setRecipe(recipeData);
        
        // Vérification si la recette est favorite/sauvegardée
        if (user && user.id) {
          const favorites = await nutritionService.getUserFavorites();
          setIsFavorite(favorites.includes(id));
          
          const saved = await nutritionService.getUserSaved();
          setIsSaved(saved.includes(id));
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la recette:', error);
        showSnackbar(`Erreur: ${error.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecipeData();
  }, [id, user]);
  
  // Gestion des favoris
  const handleFavoriteToggle = async () => {
    try {
      if (!user || !user.id) {
        navigate('/login', { state: { redirectUrl: `/nutrition/recipes/${id}` } });
        return;
      }
      
      if (isFavorite) {
        await nutritionService.removeFromFavorites(user.id, id);
        setIsFavorite(false);
        showSnackbar('Recette retirée des favoris', 'success');
      } else {
        await nutritionService.addToFavorites(user.id, id);
        setIsFavorite(true);
        showSnackbar('Recette ajoutée aux favoris', 'success');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des favoris:', error);
      showSnackbar(`Erreur: ${error.message}`, 'error');
    }
  };
  
  // Gestion des recettes sauvegardées
  const handleSaveToggle = async () => {
    try {
      if (!user || !user.id) {
        navigate('/login', { state: { redirectUrl: `/nutrition/recipes/${id}` } });
        return;
      }
      
      if (isSaved) {
        await nutritionService.removeFromSaved(id);
        setIsSaved(false);
        showSnackbar('Recette retirée des enregistrements', 'success');
      } else {
        await nutritionService.addToSaved(id);
        setIsSaved(true);
        showSnackbar('Recette enregistrée pour plus tard', 'success');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des enregistrements:', error);
      showSnackbar(`Erreur: ${error.message}`, 'error');
    }
  };
  
  // Impression de la recette
  const handlePrint = () => {
    window.print();
  };
  
  // Partage de la recette
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        text: `Découvrez cette recette cycliste: ${recipe.title}`,
        url: window.location.href
      }).catch(error => {
        console.error('Erreur lors du partage:', error);
      });
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          showSnackbar('Lien copié dans le presse-papier', 'success');
        })
        .catch(error => {
          console.error('Erreur lors de la copie du lien:', error);
          showSnackbar('Erreur lors de la copie du lien', 'error');
        });
    }
  };
  
  // Affichage des snackbars
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  // Retour à la liste des recettes
  const handleBack = () => {
    navigate('/nutrition/recipes');
  };
  
  // Rendu conditionnel pendant le chargement
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Chargement de la recette...
        </Typography>
      </Container>
    );
  }
  
  // Rendu conditionnel si la recette n'est pas trouvée
  if (!recipe) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <RestaurantIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Recette non trouvée
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            La recette que vous recherchez n'existe pas ou a été supprimée.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Retour aux recettes
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <>
      <SEO 
        title={`${recipe.title} - Recettes pour Cyclistes | Velo-Altitude`}
        description={recipe.description || `Découvrez cette recette adaptée aux besoins nutritionnels des cyclistes.`}
        image={recipe.imageUrl || recipe.hqImageUrl}
        schemaType="Recipe"
        schema={{
          name: recipe.title,
          image: recipe.imageUrl || recipe.hqImageUrl,
          description: recipe.description,
          prepTime: `PT${recipe.prepTime}M`,
          cookTime: `PT${recipe.cookTime || 0}M`,
          totalTime: `PT${(recipe.prepTime || 0) + (recipe.cookTime || 0)}M`,
          recipeYield: recipe.servings || '2-4 portions',
          recipeCategory: recipe.category,
          recipeCuisine: 'Nutrition Sportive',
          keywords: recipe.tags ? recipe.tags.join(', ') : 'recette, cyclisme, nutrition sportive',
          nutrition: {
            '@type': 'NutritionInformation',
            calories: `${recipe.nutritionalInfo?.calories || 0} calories`,
            proteinContent: `${recipe.nutritionalInfo?.protein || 0}g`,
            carbohydrateContent: `${recipe.nutritionalInfo?.carbs || 0}g`,
            fatContent: `${recipe.nutritionalInfo?.fat || 0}g`
          }
        }}
      />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link color="inherit" onClick={handleBack} sx={{ cursor: 'pointer' }}>
            Nutrition
          </Link>
          <Link color="inherit" onClick={handleBack} sx={{ cursor: 'pointer' }}>
            Recettes
          </Link>
          <Typography color="text.primary">{recipe.title}</Typography>
        </Breadcrumbs>
        
        {/* En-tête de la recette avec image */}
        <RecipeHero sx={{ backgroundImage: `url(${recipe.hqImageUrl || recipe.imageUrl})` }}>
          <Zoom in={true} style={{ transitionDelay: '100ms' }}>
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
                {recipe.category && (
                  <RecipeTag>
                    <RestaurantIcon fontSize="small" />
                    {recipe.category}
                  </RecipeTag>
                )}
                {recipe.trainingGoal && (
                  <RecipeTag>
                    <BikeIcon fontSize="small" />
                    {recipe.trainingGoal}
                  </RecipeTag>
                )}
                {recipe.prepTime && (
                  <RecipeTag>
                    <TimerIcon fontSize="small" />
                    {recipe.prepTime} min
                  </RecipeTag>
                )}
              </Box>
              
              <RecipeTitle variant="h3" component="h1" gutterBottom>
                {recipe.title}
              </RecipeTitle>
              
              <Typography variant="subtitle1" sx={{ position: 'relative', zIndex: 2, mb: 2, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                {recipe.description}
              </Typography>
            </Box>
          </Zoom>
        </RecipeHero>
        
        {/* Boutons d'action */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', mb: 4 }}>
          <ActionButton
            variant="contained"
            color={isFavorite ? 'secondary' : 'primary'}
            startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            onClick={handleFavoriteToggle}
          >
            {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          </ActionButton>
          
          <ActionButton
            variant="outlined"
            color="primary"
            startIcon={isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
            onClick={handleSaveToggle}
          >
            {isSaved ? 'Sauvegardée' : 'Sauvegarder'}
          </ActionButton>
          
          <ActionButton
            variant="outlined"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
          >
            Imprimer
          </ActionButton>
          
          <ActionButton
            variant="outlined"
            color="primary"
            startIcon={<ShareIcon />}
            onClick={handleShare}
          >
            Partager
          </ActionButton>
        </Box>
        
        <Grid container spacing={4}>
          {/* Colonne principale */}
          <Grid item xs={12} md={8}>
            <RecipeContent elevation={1}>
              <Typography variant="h5" component="h2" gutterBottom>
                À propos de cette recette
              </Typography>
              
              <Typography variant="body1" paragraph>
                {recipe.longDescription || recipe.description}
              </Typography>
              
              {recipe.tips && (
                <Box sx={{ my: 3, p: 2, bgcolor: 'rgba(0, 150, 136, 0.08)', borderRadius: 2, border: '1px solid rgba(0, 150, 136, 0.2)' }}>
                  <Typography variant="h6" gutterBottom>
                    Conseils du nutritionniste
                  </Typography>
                  <Typography variant="body1">{recipe.tips}</Typography>
                </Box>
              )}
              
              <Divider sx={{ my: 4 }} />
              
              {/* Infographie nutritionnelle */}
              <Typography variant="h5" component="h2" gutterBottom>
                Valeurs nutritionnelles
              </Typography>
              
              <Box sx={{ my: 3 }}>
                <NutritionInfographic nutritionalInfo={recipe.nutritionalInfo} />
              </Box>
              
              <Divider sx={{ my: 4 }} />
              
              {/* Instructions de préparation */}
              <Typography variant="h5" component="h2" gutterBottom>
                Préparation
              </Typography>
              
              <RecipeStepByStep
                steps={recipe.steps}
                ingredients={recipe.ingredients}
                images={recipe.stepImages}
                servings={recipe.servings}
                activeStep={activeStep}
                onStepChange={setActiveStep}
              />
            </RecipeContent>
          </Grid>
          
          {/* Colonne latérale */}
          <Grid item xs={12} md={4}>
            {/* Informations complémentaires */}
            <RecipeContent elevation={1} sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Informations complémentaires
              </Typography>
              
              <Box sx={{ my: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Temps de préparation
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {recipe.prepTime} minutes
                </Typography>
              </Box>
              
              {recipe.cookTime && (
                <Box sx={{ my: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Temps de cuisson
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {recipe.cookTime} minutes
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ my: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Nombre de portions
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {recipe.servings || '2-4 portions'}
                </Typography>
              </Box>
              
              {recipe.difficulty && (
                <Box sx={{ my: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Difficulté
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {recipe.difficulty}
                  </Typography>
                </Box>
              )}
              
              {recipe.dietary && recipe.dietary.length > 0 && (
                <Box sx={{ my: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Régime alimentaire
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {recipe.dietary.map((diet, index) => (
                      <Chip key={index} label={diet} size="small" />
                    ))}
                  </Box>
                </Box>
              )}
              
              {recipe.tags && recipe.tags.length > 0 && (
                <Box sx={{ my: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {recipe.tags.map((tag, index) => (
                      <Chip 
                        key={index} 
                        label={tag} 
                        size="small" 
                        variant="outlined" 
                        onClick={() => navigate(`/nutrition/recipes?search=${tag}`)}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </RecipeContent>
            
            {/* Recommandations */}
            {recipe.recommendations && recipe.recommendations.length > 0 && (
              <RecipeContent elevation={1}>
                <Typography variant="h6" gutterBottom>
                  Recettes similaires
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  {recipe.recommendations.map((rec, index) => (
                    <Paper
                      key={index}
                      sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { boxShadow: theme.shadows[4] }
                      }}
                      onClick={() => navigate(`/nutrition/recipes/${rec.id}`)}
                    >
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: 1,
                          overflow: 'hidden',
                          mr: 2,
                          flexShrink: 0
                        }}
                      >
                        <img
                          src={rec.imageUrl}
                          alt={rec.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1">{rec.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {rec.category}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </RecipeContent>
            )}
          </Grid>
        </Grid>
      </Container>
      
      {/* Snackbar pour notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EnhancedRecipePage;
