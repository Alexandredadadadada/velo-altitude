import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  TextField, 
  InputAdornment,
  Button,
  Tabs,
  Tab,
  Pagination,
  CircularProgress,
  Alert,
  Snackbar,
  Fade,
  useMediaQuery,
  Divider,
  Chip,
  Skeleton
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { 
  Search as SearchIcon,
  TravelExplore as ExploreIcon,
  Restaurant as MealIcon,
  DirectionsBike as BikeIcon,
  Bookmark as BookmarkIcon,
  Favorite as FavoriteIcon,
  Add as AddIcon,
  SortByAlpha as SortIcon
} from '@mui/icons-material';

// Import des composants personnalisés
import EnhancedRecipeCard from './EnhancedRecipeCard';
import VisualFilterSystem from './VisualFilterSystem';
import nutritionService from '../../../services/nutritionService';
import { useAuth } from '../../../contexts/AuthContext';

// Styles personnalisés
const GalleryContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(8),
}));

const GalleryHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius * 3,
    transition: theme.transitions.create(['box-shadow']),
    '&:hover': {
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    },
    '&.Mui-focused': {
      boxShadow: '0 2px 15px rgba(0,0,0,0.1)',
    },
  },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  '& .MuiTab-root': {
    textTransform: 'none',
    fontWeight: 600,
    minWidth: 120,
  },
  '& .MuiTabs-indicator': {
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
}));

// Composant principal de galerie de recettes améliorée
const RecipeGalleryEnhanced = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // États
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('popular');
  const [page, setPage] = useState(1);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const recipesPerPage = isMobile ? 6 : isTablet ? 9 : 12;
  
  // Récupération des recettes
  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      
      // Récupération des recettes via le service de nutrition
      const data = await nutritionService.getRecipes();
      setRecipes(data);
      
      // Récupération des favoris si l'utilisateur est connecté
      if (user && user.id) {
        const userFavorites = await nutritionService.getUserFavorites();
        setFavorites(userFavorites);
        
        const userSaved = await nutritionService.getUserSaved();
        setSaved(userSaved);
      }
      
      // Appliquer les filtres initiaux
      applyFilters(data, {}, searchTerm);
    } catch (error) {
      console.error('Erreur lors de la récupération des recettes:', error);
      showSnackbar(`Erreur: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm]);
  
  // Initialisation
  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);
  
  // Fonction d'application des filtres
  const applyFilters = (recipeList, activeFilters, term = '') => {
    if (!recipeList || recipeList.length === 0) return [];
    
    // Filtrer par terme de recherche
    let result = [...recipeList];
    
    if (term.trim() !== '') {
      const searchLower = term.toLowerCase();
      result = result.filter(recipe => 
        recipe.title.toLowerCase().includes(searchLower) ||
        recipe.description.toLowerCase().includes(searchLower) ||
        (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }
    
    // Filtre par type de repas
    if (activeFilters.mealType && activeFilters.mealType.length > 0) {
      result = result.filter(recipe => 
        recipe.category && activeFilters.mealType.includes(recipe.category)
      );
    }
    
    // Filtre par objectif d'entraînement
    if (activeFilters.trainingGoal && activeFilters.trainingGoal.length > 0) {
      result = result.filter(recipe => 
        recipe.trainingGoal && activeFilters.trainingGoal.includes(recipe.trainingGoal)
      );
    }
    
    // Filtre par préférence alimentaire
    if (activeFilters.dietaryPreference && activeFilters.dietaryPreference.length > 0) {
      result = result.filter(recipe => 
        recipe.dietary && activeFilters.dietaryPreference.some(pref => recipe.dietary.includes(pref))
      );
    }
    
    // Filtre par temps de préparation
    if (activeFilters.minTime !== undefined || activeFilters.maxTime !== undefined) {
      const minTime = activeFilters.minTime || 0;
      const maxTime = activeFilters.maxTime || Number.MAX_SAFE_INTEGER;
      
      result = result.filter(recipe => 
        recipe.prepTime >= minTime && recipe.prepTime <= maxTime
      );
    }
    
    // Filtre par calories
    if (activeFilters.minCalories !== undefined || activeFilters.maxCalories !== undefined) {
      const minCal = activeFilters.minCalories || 0;
      const maxCal = activeFilters.maxCalories || Number.MAX_SAFE_INTEGER;
      
      result = result.filter(recipe => 
        recipe.calories >= minCal && recipe.calories <= maxCal
      );
    }
    
    // Filtres avancés
    if (activeFilters.showRated) {
      result = result.filter(recipe => recipe.rating >= 4.0);
    }
    
    if (activeFilters.showPopular) {
      result = result.filter(recipe => recipe.reviewsCount > 10);
    }
    
    if (activeFilters.inSeason) {
      // Détermine les aliments de saison actuels
      const currentMonth = new Date().getMonth();
      result = result.filter(recipe => 
        recipe.seasonal && recipe.seasonal.includes(currentMonth)
      );
    }
    
    if (activeFilters.hdPhotos) {
      result = result.filter(recipe => recipe.hqImageUrl);
    }
    
    // Filtre des onglets
    if (activeTab === 1) { // Mes favoris
      result = result.filter(recipe => favorites.includes(recipe.id));
    } else if (activeTab === 2) { // Mes enregistrés
      result = result.filter(recipe => saved.includes(recipe.id));
    }
    
    // Tri
    switch(sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'popular':
        result.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'prepTime':
        result.sort((a, b) => (a.prepTime || 999) - (b.prepTime || 999));
        break;
      case 'calories':
        result.sort((a, b) => (a.calories || 999) - (b.calories || 999));
        break;
      case 'title-asc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }
    
    setFilteredRecipes(result);
    setPage(1);
  };
  
  // Gestion de la recherche
  const handleSearchChange = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    applyFilters(recipes, filters, term);
  };
  
  // Gestion du changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Re-appliquer les filtres avec le nouvel onglet
    setTimeout(() => {
      applyFilters(recipes, filters, searchTerm);
    }, 0);
  };
  
  // Gestion du changement de page
  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Gestion des filtres
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    applyFilters(recipes, newFilters, searchTerm);
  };
  
  // Gestion des favoris
  const handleFavoriteToggle = async (recipeId) => {
    try {
      if (!user || !user.id) {
        navigate('/login', { state: { redirectUrl: '/nutrition/recipes' } });
        return;
      }
      
      if (favorites.includes(recipeId)) {
        await nutritionService.removeFromFavorites(recipeId);
        setFavorites(favorites.filter(id => id !== recipeId));
        showSnackbar('Recette retirée des favoris', 'success');
      } else {
        await nutritionService.addToFavorites(recipeId);
        setFavorites([...favorites, recipeId]);
        showSnackbar('Recette ajoutée aux favoris', 'success');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des favoris:', error);
      showSnackbar(`Erreur: ${error.message}`, 'error');
    }
  };
  
  // Gestion des recettes sauvegardées
  const handleSaveToggle = async (recipeId) => {
    try {
      if (!user || !user.id) {
        navigate('/login', { state: { redirectUrl: '/nutrition/recipes' } });
        return;
      }
      
      if (saved.includes(recipeId)) {
        await nutritionService.removeFromSaved(recipeId);
        setSaved(saved.filter(id => id !== recipeId));
        showSnackbar('Recette retirée des enregistrements', 'success');
      } else {
        await nutritionService.addToSaved(recipeId);
        setSaved([...saved, recipeId]);
        showSnackbar('Recette enregistrée pour plus tard', 'success');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des enregistrements:', error);
      showSnackbar(`Erreur: ${error.message}`, 'error');
    }
  };
  
  // Gestion du tri
  const handleSortChange = (value) => {
    setSortBy(value);
    applyFilters(recipes, filters, searchTerm);
  };
  
  // Gestion de l'ouverture d'une recette
  const handleOpenRecipe = (recipeId) => {
    navigate(`/nutrition/recipes/${recipeId}`);
  };
  
  // Affichage des snackbars
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  // Pagination des recettes
  const paginatedRecipes = filteredRecipes.slice(
    (page - 1) * recipesPerPage,
    page * recipesPerPage
  );
  
  // Calcul du nombre de pages
  const pageCount = Math.ceil(filteredRecipes.length / recipesPerPage);
  
  return (
    <GalleryContainer maxWidth="xl">
      <GalleryHeader>
        <Typography variant="h4" component="h1" gutterBottom>
          Recettes pour Cyclistes
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Découvrez plus de 100 recettes adaptées à vos besoins en nutrition sportive
        </Typography>
        
        <Box sx={{ mt: 4, mb: 3 }}>
          <SearchField
            fullWidth
            variant="outlined"
            placeholder="Rechercher une recette, un ingrédient, ou un type d'effort..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        <StyledTabs 
          value={activeTab} 
          onChange={handleTabChange}
          centered={isMobile}
          variant={isMobile ? "fullWidth" : "standard"}
        >
          <Tab 
            icon={<ExploreIcon />} 
            iconPosition="start" 
            label="Toutes les recettes" 
          />
          <Tab 
            icon={<FavoriteIcon />} 
            iconPosition="start" 
            label={`Mes favoris${favorites.length > 0 ? ` (${favorites.length})` : ''}`} 
          />
          <Tab 
            icon={<BookmarkIcon />} 
            iconPosition="start" 
            label={`Enregistrées${saved.length > 0 ? ` (${saved.length})` : ''}`} 
          />
        </StyledTabs>
      </GalleryHeader>
      
      {/* Système de filtres visuels */}
      <VisualFilterSystem 
        onFiltersChange={handleFiltersChange}
        activeFilters={filters}
        recipeCount={filteredRecipes.length}
        loading={loading}
      />
      
      {/* Options de tri */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="subtitle1" component="div">
          {filteredRecipes.length} {filteredRecipes.length > 1 ? 'recettes trouvées' : 'recette trouvée'}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SortIcon sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" mr={1} color="text.secondary">
            Trier par:
          </Typography>
          
          {/* Options de tri rapide */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            <Chip
              label="Populaires"
              size="small"
              clickable
              color={sortBy === 'popular' ? 'primary' : 'default'}
              onClick={() => handleSortChange('popular')}
            />
            <Chip
              label="Récents"
              size="small"
              clickable
              color={sortBy === 'recent' ? 'primary' : 'default'}
              onClick={() => handleSortChange('recent')}
            />
            <Chip
              label="Mieux notés"
              size="small"
              clickable
              color={sortBy === 'rating' ? 'primary' : 'default'}
              onClick={() => handleSortChange('rating')}
            />
            <Chip
              label="Préparation rapide"
              size="small"
              clickable
              color={sortBy === 'prepTime' ? 'primary' : 'default'}
              onClick={() => handleSortChange('prepTime')}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            />
            <Chip
              label="Moins caloriques"
              size="small"
              clickable
              color={sortBy === 'calories' ? 'primary' : 'default'}
              onClick={() => handleSortChange('calories')}
              sx={{ display: { xs: 'none', md: 'flex' } }}
            />
          </Box>
        </Box>
      </Box>
      
      {/* Grille de recettes */}
      {loading ? (
        <Grid container spacing={3}>
          {[...Array(recipesPerPage)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <EnhancedRecipeCard loading={true} />
            </Grid>
          ))}
        </Grid>
      ) : filteredRecipes.length === 0 ? (
        <Paper 
          sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            textAlign: 'center',
            borderRadius: 2
          }}
        >
          <MealIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Aucune recette trouvée
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Essayez de modifier vos filtres ou votre recherche pour trouver des recettes.
          </Typography>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={() => {
              setFilters({});
              setSearchTerm('');
              applyFilters(recipes, {}, '');
            }}
          >
            Réinitialiser tous les filtres
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedRecipes.map((recipe) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={recipe.id}>
                <Fade in={true} style={{ transitionDelay: '100ms' }}>
                  <Box>
                    <EnhancedRecipeCard
                      recipe={recipe}
                      isFavorite={favorites.includes(recipe.id)}
                      isSaved={saved.includes(recipe.id)}
                      onFavoriteToggle={handleFavoriteToggle}
                      onSaveToggle={handleSaveToggle}
                    />
                  </Box>
                </Fade>
              </Grid>
            ))}
            
            {/* Option "Créer une recette" pour utilisateurs connectés */}
            {user && user.id && (
              <Grid item xs={12} sm={6} md={4} lg={3}>
                <Fade in={true} style={{ transitionDelay: '100ms' }}>
                  <Paper 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 3,
                      borderRadius: 3,
                      border: `2px dashed ${theme.palette.primary.light}`,
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(66, 66, 66, 0.5)' : 'rgba(250, 250, 250, 0.8)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(66, 66, 66, 0.8)' : 'rgba(250, 250, 250, 1)',
                        transform: 'translateY(-5px)',
                        boxShadow: theme.shadows[8],
                        cursor: 'pointer'
                      },
                      minHeight: 350
                    }}
                    onClick={() => navigate('/nutrition/recipes/create')}
                  >
                    <AddIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom textAlign="center">
                      Créer ma propre recette
                    </Typography>
                    <Typography variant="body2" color="text.secondary" textAlign="center">
                      Partagez vos recettes favorites avec la communauté
                    </Typography>
                  </Paper>
                </Fade>
              </Grid>
            )}
          </Grid>
          
          {/* Pagination */}
          {pageCount > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Pagination 
                count={pageCount} 
                page={page} 
                onChange={handlePageChange}
                color="primary"
                size={isMobile ? "small" : "medium"}
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}
      
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
    </GalleryContainer>
  );
};

export default RecipeGalleryEnhanced;
