import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, CardMedia, 
  CardActionArea, CardActions, Chip, TextField, InputAdornment, 
  CircularProgress, FormControl, InputLabel, Select, MenuItem, 
  Divider, Button, Dialog, DialogTitle, DialogContent, DialogActions, 
  IconButton, Tabs, Tab, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, ListItem, ListItemIcon, ListItemText, Rating,
  List, Tooltip, Avatar, Badge, Container, Alert
} from '@mui/material';
import { 
  Search, FilterList, Favorite, FavoriteBorder, Print, 
  Restaurant, DirectionsBike, FitnessCenter, Whatshot, AccessTime,
  Share, BookmarkBorder, Bookmark, Close, PlaylistAdd, Timer,
  CheckCircle, ExpandMore, ExpandLess, PersonOutline, CheckCircleOutline
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import recipesIndex from '../../data/recipesIndex';
import { Link } from 'react-router-dom';

/**
 * Explorateur unifié de recettes adaptées aux cyclistes
 * Permet de consulter, rechercher, filtrer et organiser toutes les recettes disponibles
 * selon différents critères (moment de consommation, objectifs, propriétés diététiques)
 */
const NutritionRecipesExplorer = ({ userProfile }) => {
  const theme = useTheme();
  const { user } = useAuth();
  
  // États pour la gestion des recettes et des filtres
  const [allRecipes, setAllRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour les dialogues et interactions utilisateur
  const [openRecipeDialog, setOpenRecipeDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeObjective, setActiveObjective] = useState('all');
  const [activeDietaryProperty, setActiveDietaryProperty] = useState('all');
  const [favorites, setFavorites] = useState([]);
  const [mealPlanOpen, setMealPlanOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMeal, setSelectedMeal] = useState('');
  
  // Filtres avancés
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    difficulty: 'all',
    prepTime: 'all',
    cookTime: 'all',
    calories: 'all'
  });

  // Options pour les jours et repas (pour l'ajout au plan de repas)
  const dayOptions = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const mealOptions = ['Petit-déjeuner', 'Collation matin', 'Déjeuner', 'Collation après-midi', 'Dîner'];
  
  // Récupération des recettes au chargement du composant
  useEffect(() => {
    const loadRecipes = async () => {
      try {
        setLoading(true);
        // Utilisation de notre index centralisé des recettes
        const recipes = recipesIndex.allRecipes;
        setAllRecipes(recipes);
        setFilteredRecipes(recipes);
        
        // Chargement des favoris (à implémenter avec un service backend)
        if (user && user.id) {
          // Simulation de récupération des favoris
          // À remplacer par un appel API réel
          const userFavorites = localStorage.getItem(`favorites_${user.id}`) || '[]';
          setFavorites(JSON.parse(userFavorites));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des recettes", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadRecipes();
  }, [user]);
  
  // Mise à jour des recettes filtrées lorsque les filtres changent
  useEffect(() => {
    applyFilters();
  }, [searchTerm, activeTab, activeCategory, activeObjective, activeDietaryProperty, advancedFilters]);
  
  /**
   * Applique tous les filtres sélectionnés aux recettes
   */
  const applyFilters = () => {
    let results = [...allRecipes];
    
    // Filtre par onglet (Toutes les recettes / Favoris)
    if (activeTab === 1) {
      results = results.filter(recipe => favorites.includes(recipe.id));
    }
    
    // Filtre par terme de recherche
    if (searchTerm.trim() !== '') {
      const searchTermLower = searchTerm.toLowerCase();
      results = results.filter(recipe => {
        const nameMatch = recipe.name.toLowerCase().includes(searchTermLower);
        const categoryMatch = recipe.category?.toLowerCase().includes(searchTermLower);
        const ingredientsMatch = recipe.ingredients?.some(ingredient => 
          ingredient.toLowerCase().includes(searchTermLower)
        );
        
        return nameMatch || categoryMatch || ingredientsMatch;
      });
    }
    
    // Filtre par catégorie (moment de la journée/effort)
    if (activeCategory !== 'all') {
      // Utiliser les catégories de recettes de l'index
      results = recipesIndex.getRecipesByCategory(activeCategory);
      
      // Appliquer les autres filtres actifs si nécessaire
      if (activeTab === 1) {
        results = results.filter(recipe => favorites.includes(recipe.id));
      }
    }
    
    // Filtre par objectif
    if (activeObjective !== 'all') {
      // Utiliser les objectifs de l'index
      results = recipesIndex.getRecipesByObjective(activeObjective);
      
      // Appliquer les autres filtres actifs
      if (activeTab === 1) {
        results = results.filter(recipe => favorites.includes(recipe.id));
      }
    }
    
    // Filtre par propriété diététique
    if (activeDietaryProperty !== 'all') {
      // Utiliser les propriétés diététiques de l'index
      results = recipesIndex.getRecipesByDietaryProperty(activeDietaryProperty);
      
      // Appliquer les autres filtres actifs
      if (activeTab === 1) {
        results = results.filter(recipe => favorites.includes(recipe.id));
      }
    }
    
    // Filtres avancés
    if (advancedFilters.difficulty !== 'all') {
      results = results.filter(recipe => {
        if (advancedFilters.difficulty === 'easy') return recipe.difficulty?.toLowerCase() === 'facile';
        if (advancedFilters.difficulty === 'medium') return recipe.difficulty?.toLowerCase() === 'moyen';
        if (advancedFilters.difficulty === 'hard') return recipe.difficulty?.toLowerCase() === 'complexe' || recipe.difficulty?.toLowerCase() === 'difficile';
        return true;
      });
    }
    
    if (advancedFilters.prepTime !== 'all') {
      results = results.filter(recipe => {
        if (advancedFilters.prepTime === 'quick') return recipe.prepTime <= 15;
        if (advancedFilters.prepTime === 'medium') return recipe.prepTime <= 30 && recipe.prepTime > 15;
        if (advancedFilters.prepTime === 'long') return recipe.prepTime > 30;
        return true;
      });
    }
    
    if (advancedFilters.cookTime !== 'all') {
      results = results.filter(recipe => {
        if (advancedFilters.cookTime === 'quick') return recipe.cookTime <= 15;
        if (advancedFilters.cookTime === 'medium') return recipe.cookTime <= 30 && recipe.cookTime > 15;
        if (advancedFilters.cookTime === 'long') return recipe.cookTime > 30;
        return true;
      });
    }
    
    if (advancedFilters.calories !== 'all') {
      results = results.filter(recipe => {
        if (advancedFilters.calories === 'low') return recipe.nutritionalInfo?.calories <= 300;
        if (advancedFilters.calories === 'medium') return recipe.nutritionalInfo?.calories <= 600 && recipe.nutritionalInfo?.calories > 300;
        if (advancedFilters.calories === 'high') return recipe.nutritionalInfo?.calories > 600;
        return true;
      });
    }
    
    setFilteredRecipes(results);
  };

  /**
   * Gestion des changements de filtres
   */
  const handleFilterChange = (filterType, value) => {
    if (filterType === 'category') {
      setActiveCategory(value);
      // Réinitialiser les autres filtres principaux pour éviter les conflits
      setActiveObjective('all');
      setActiveDietaryProperty('all');
    } else if (filterType === 'objective') {
      setActiveObjective(value);
      // Réinitialiser les autres filtres principaux
      setActiveCategory('all');
      setActiveDietaryProperty('all');
    } else if (filterType === 'dietary') {
      setActiveDietaryProperty(value);
      // Réinitialiser les autres filtres principaux
      setActiveCategory('all');
      setActiveObjective('all');
    } else if (filterType === 'advanced') {
      setAdvancedFilters(prev => ({
        ...prev,
        [value.key]: value.value
      }));
    }
  };
  
  /**
   * Gestion du changement de terme de recherche
   */
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  /**
   * Ouvrir le dialogue détaillé d'une recette
   */
  const handleRecipeClick = (recipe) => {
    setSelectedRecipe(recipe);
    setOpenRecipeDialog(true);
  };
  
  /**
   * Fermer le dialogue détaillé
   */
  const handleCloseRecipeDialog = () => {
    setOpenRecipeDialog(false);
  };
  
  /**
   * Changer d'onglet (Toutes les recettes / Favoris)
   */
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  /**
   * Ajouter/Retirer une recette des favoris
   */
  const handleToggleFavorite = (recipeId) => {
    let newFavorites = [...favorites];
    
    if (newFavorites.includes(recipeId)) {
      // Retirer des favoris
      newFavorites = newFavorites.filter(id => id !== recipeId);
    } else {
      // Ajouter aux favoris
      newFavorites.push(recipeId);
    }
    
    setFavorites(newFavorites);
    
    // Sauvegarder dans le localStorage (temporaire) ou via API
    if (user && user.id) {
      localStorage.setItem(`favorites_${user.id}`, JSON.stringify(newFavorites));
    }
  };
  
  /**
   * Ouvrir le dialogue d'ajout au plan de repas
   */
  const handleAddToPlan = (recipe) => {
    setSelectedRecipe(recipe);
    setMealPlanOpen(true);
  };
  
  /**
   * Fermer le dialogue d'ajout au plan de repas
   */
  const handleCloseMealPlan = () => {
    setMealPlanOpen(false);
    setSelectedDay('');
    setSelectedMeal('');
  };
  
  /**
   * Ajouter la recette au plan de repas
   */
  const handleAddToMealPlan = () => {
    if (!selectedDay || !selectedMeal) return;
    
    // Logique d'ajout au plan de repas (à intégrer avec un service)
    console.log(`Recette "${selectedRecipe.name}" ajoutée au ${selectedMeal} du ${selectedDay}`);
    
    // Fermer le dialogue
    handleCloseMealPlan();
    
    // Afficher une notification de succès (à implémenter)
  };
  
  /**
   * Basculer l'affichage des filtres avancés
   */
  const toggleAdvancedFilters = () => {
    setShowAdvancedFilters(!showAdvancedFilters);
  };
  
  /**
   * Imprimer une recette
   */
  const handlePrintRecipe = (recipe) => {
    // Créer une fenêtre d'impression avec mise en forme adaptée
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert("Veuillez autoriser les popups pour imprimer la recette.");
      return;
    }
    
    // Contenu HTML de la recette formatée pour impression
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${recipe.name}</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 {
            color: #1976d2;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
          }
          .recipe-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 14px;
            color: #666;
          }
          .ingredients {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .instructions {
            margin-bottom: 20px;
          }
          .instructions ol {
            padding-left: 20px;
          }
          .nutrition {
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
          }
          .nutrition-table {
            width: 100%;
            border-collapse: collapse;
          }
          .nutrition-table td {
            padding: 5px;
            border-bottom: 1px solid #eee;
          }
          .tips {
            font-style: italic;
            border-left: 3px solid #1976d2;
            padding-left: 15px;
            margin-top: 20px;
          }
          @media print {
            body {
              font-size: 12pt;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <h1>${recipe.name}</h1>
        
        <div class="recipe-info">
          <span>Catégorie: ${recipe.category || 'Non spécifiée'}</span>
          <span>Difficulté: ${recipe.difficulty || 'Non spécifiée'}</span>
          <span>Préparation: ${recipe.prepTime || '0'} min</span>
          <span>Cuisson: ${recipe.cookTime || '0'} min</span>
          <span>Portions: ${recipe.servings || '1'}</span>
        </div>
        
        <div class="ingredients">
          <h2>Ingrédients</h2>
          <ul>
            ${recipe.ingredients?.map(ingredient => `<li>${ingredient}</li>`).join('') || 'Aucun ingrédient spécifié'}
          </ul>
        </div>
        
        <div class="instructions">
          <h2>Instructions</h2>
          <ol>
            ${recipe.instructions?.map(step => `<li>${step}</li>`).join('') || 'Aucune instruction spécifiée'}
          </ol>
        </div>
        
        ${recipe.nutritionalInfo ? `
          <div class="nutrition">
            <h2>Informations nutritionnelles</h2>
            <p>Par portion</p>
            <table class="nutrition-table">
              <tr>
                <td><strong>Calories</strong></td>
                <td>${recipe.nutritionalInfo.calories} kcal</td>
              </tr>
              ${recipe.nutritionalInfo.macros ? `
                <tr>
                  <td><strong>Glucides</strong></td>
                  <td>${recipe.nutritionalInfo.macros.carbs}g</td>
                </tr>
                <tr>
                  <td><strong>Protéines</strong></td>
                  <td>${recipe.nutritionalInfo.macros.protein}g</td>
                </tr>
                <tr>
                  <td><strong>Lipides</strong></td>
                  <td>${recipe.nutritionalInfo.macros.fat}g</td>
                </tr>
                <tr>
                  <td><strong>Fibres</strong></td>
                  <td>${recipe.nutritionalInfo.macros.fiber}g</td>
                </tr>
              ` : ''}
            </table>
          </div>
        ` : ''}
        
        ${recipe.tips ? `
          <div class="tips">
            <h3>Conseils</h3>
            <p>${recipe.tips}</p>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Recette proposée par Dashboard-Vélo - Grand Est Cyclisme</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  /**
   * Générer des recommandations personnalisées pour l'utilisateur
   */
  const getPersonalizedRecommendations = () => {
    if (!userProfile) return [];
    
    // Utiliser le moteur de recommandation de l'index de recettes
    return recipesIndex.recommend(userProfile, 5);
  };

  /**
   * Rendu des cartes de recettes
   */
  const renderRecipeCards = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (filteredRecipes.length === 0) {
      return (
        <Alert severity="info" sx={{ my: 2 }}>
          Aucune recette ne correspond à vos critères. Essayez de modifier vos filtres.
        </Alert>
      );
    }
    
    return (
      <Grid container spacing={3}>
        {/* Recommandations personnalisées si l'utilisateur est connecté et a un profil */}
        {userProfile && activeTab === 0 && activeCategory === 'all' && 
         activeObjective === 'all' && activeDietaryProperty === 'all' && searchTerm === '' && (
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
              Recommandations personnalisées
            </Typography>
            <Grid container spacing={2}>
              {getPersonalizedRecommendations().map(recipe => (
                <Grid item xs={12} sm={6} md={4} key={`rec-${recipe.id}`}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      boxShadow: 3,
                      '&:hover': { boxShadow: 6 },
                      border: `2px solid ${theme.palette.primary.main}`,
                      position: 'relative'
                    }}
                  >
                    <Badge 
                      badgeContent="Recommandé" 
                      color="primary"
                      sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        '& .MuiBadge-badge': {
                          fontSize: '0.7rem',
                          height: 'auto',
                          padding: '0 8px'
                        }
                      }}
                    />
                    {renderRecipeCard(recipe)}
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Divider sx={{ mt: 4, mb: 3 }} />
          </Grid>
        )}
        
        {/* Affichage de toutes les recettes filtrées */}
        {filteredRecipes.map(recipe => (
          <Grid item xs={12} sm={6} md={4} key={recipe.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                '&:hover': { boxShadow: 3 }
              }}
            >
              {renderRecipeCard(recipe)}
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  /**
   * Rendu d'une carte de recette individuelle
   */
  const renderRecipeCard = (recipe) => {
    const isFavorite = favorites.includes(recipe.id);
    
    return (
      <>
        <CardActionArea 
          onClick={() => handleRecipeClick(recipe)}
          sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
        >
          <CardMedia
            component="img"
            height="160"
            image={`/images/recipes/${recipe.image || 'default-recipe.jpg'}`}
            alt={recipe.name}
            sx={{ objectFit: 'cover' }}
          />
          <CardContent sx={{ flexGrow: 1 }}>
            <Typography gutterBottom variant="h6" component="div" noWrap>
              {recipe.name}
            </Typography>
            
            <Box sx={{ mb: 1.5 }}>
              <Chip 
                size="small" 
                label={recipe.category || 'Non catégorisé'} 
                sx={{ mr: 0.5, mb: 0.5 }}
                color="primary"
                variant="outlined"
              />
              <Chip 
                size="small" 
                label={recipe.timing || 'Toute occasion'} 
                sx={{ mr: 0.5, mb: 0.5 }}
                color="secondary"
                variant="outlined"
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AccessTime sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                {recipe.prepTime + (recipe.cookTime || 0)} min
              </Typography>
              <Box sx={{ mx: 1, height: 16, borderLeft: 1, borderColor: 'divider' }} />
              <Typography variant="body2" color="text.secondary">
                {recipe.difficulty || 'Facile'}
              </Typography>
            </Box>
            
            {recipe.nutritionalInfo && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                <Chip 
                  size="small" 
                  label={`${recipe.nutritionalInfo.calories || '0'} kcal`} 
                  sx={{ height: 22, fontSize: '0.7rem' }}
                />
                {recipe.nutritionalInfo.macros && (
                  <>
                    <Chip 
                      size="small" 
                      label={`Glucides: ${recipe.nutritionalInfo.macros.carbs || '0'}g`} 
                      sx={{ height: 22, fontSize: '0.7rem' }}
                    />
                    <Chip 
                      size="small" 
                      label={`Protéines: ${recipe.nutritionalInfo.macros.protein || '0'}g`} 
                      sx={{ height: 22, fontSize: '0.7rem' }}
                    />
                  </>
                )}
              </Box>
            )}
          </CardContent>
        </CardActionArea>
        
        <CardActions>
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              handleToggleFavorite(recipe.id);
            }}
            color={isFavorite ? 'error' : 'default'}
          >
            {isFavorite ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
          
          <IconButton 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleAddToPlan(recipe);
            }}
          >
            <PlaylistAdd />
          </IconButton>
          
          <IconButton 
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handlePrintRecipe(recipe);
            }}
          >
            <Print />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {userProfile && userProfile.preferences && userProfile.preferences.includes(recipe.id) && (
            <Tooltip title="Recommandé pour votre profil">
              <CheckCircleOutline color="success" />
            </Tooltip>
          )}
        </CardActions>
      </>
    );
  };
  
  /**
   * Rendu du dialogue de recette détaillée
   */
  const renderRecipeDialog = () => {
    if (!selectedRecipe) return null;
    
    const isFavorite = favorites.includes(selectedRecipe.id);
    
    return (
      <Dialog
        open={openRecipeDialog}
        onClose={handleCloseRecipeDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pr: 6 }}>
          {selectedRecipe.name}
          <IconButton
            aria-label="close"
            onClick={handleCloseRecipeDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Image et informations générales */}
            <Grid item xs={12} md={5}>
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="250"
                  image={`/images/recipes/${selectedRecipe.image || 'default-recipe.jpg'}`}
                  alt={selectedRecipe.name}
                  sx={{ borderRadius: 1, mb: 2 }}
                />
                <IconButton
                  onClick={() => handleToggleFavorite(selectedRecipe.id)}
                  sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8,
                    backgroundColor: 'rgba(255,255,255,0.7)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.9)'
                    }
                  }}
                  color={isFavorite ? 'error' : 'default'}
                >
                  {isFavorite ? <Favorite /> : <FavoriteBorder />}
                </IconButton>
              </Box>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Informations générales
                </Typography>
                
                <List dense disablePadding>
                  <ListItem disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Restaurant fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Catégorie" 
                      secondary={selectedRecipe.category || 'Non spécifié'} 
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <DirectionsBike fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Moment de consommation" 
                      secondary={selectedRecipe.timing || 'Flexible'} 
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <AccessTime fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Temps de préparation" 
                      secondary={`${selectedRecipe.prepTime || '0'} min`} 
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Timer fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Temps de cuisson" 
                      secondary={`${selectedRecipe.cookTime || '0'} min`} 
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <PersonOutline fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Portions" 
                      secondary={selectedRecipe.servings || '1'} 
                    />
                  </ListItem>
                </List>
              </Paper>
              
              {/* Informations nutritionnelles */}
              {selectedRecipe.nutritionalInfo && (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Valeurs nutritionnelles (par portion)
                  </Typography>
                  
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell component="th" scope="row">Calories</TableCell>
                          <TableCell align="right">{selectedRecipe.nutritionalInfo.calories} kcal</TableCell>
                        </TableRow>
                        
                        {selectedRecipe.nutritionalInfo.macros && (
                          <>
                            <TableRow>
                              <TableCell component="th" scope="row">Glucides</TableCell>
                              <TableCell align="right">{selectedRecipe.nutritionalInfo.macros.carbs}g</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell component="th" scope="row">Protéines</TableCell>
                              <TableCell align="right">{selectedRecipe.nutritionalInfo.macros.protein}g</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell component="th" scope="row">Lipides</TableCell>
                              <TableCell align="right">{selectedRecipe.nutritionalInfo.macros.fat}g</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell component="th" scope="row">Fibres</TableCell>
                              <TableCell align="right">{selectedRecipe.nutritionalInfo.macros.fiber}g</TableCell>
                            </TableRow>
                          </>
                        )}
                        
                        {selectedRecipe.nutritionalInfo.micros && (
                          <>
                            {Object.entries(selectedRecipe.nutritionalInfo.micros).map(([key, value]) => (
                              <TableRow key={key}>
                                <TableCell component="th" scope="row">
                                  {key.charAt(0).toUpperCase() + key.slice(1)}
                                </TableCell>
                                <TableCell align="right">{value} mg</TableCell>
                              </TableRow>
                            ))}
                          </>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </Grid>
            
            {/* Ingrédients et instructions */}
            <Grid item xs={12} md={7}>
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Ingrédients
                </Typography>
                
                <List dense>
                  {selectedRecipe.ingredients?.map((ingredient, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckCircle fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={ingredient} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Instructions
                </Typography>
                
                <List>
                  {selectedRecipe.instructions?.map((step, index) => (
                    <ListItem key={index} alignItems="flex-start" sx={{ py: 1 }}>
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            bgcolor: 'primary.main',
                            fontSize: '0.875rem'
                          }}
                        >
                          {index + 1}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText primary={step} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
              
              {/* Bénéfices et conseils */}
              {selectedRecipe.benefits && selectedRecipe.benefits.length > 0 && (
                <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'secondary.light' }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Bénéfices pour les cyclistes
                  </Typography>
                  
                  <List dense>
                    {selectedRecipe.benefits.map((benefit, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircleOutline fontSize="small" color="secondary" />
                        </ListItemIcon>
                        <ListItemText primary={benefit} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
              
              {selectedRecipe.tips && (
                <Paper variant="outlined" sx={{ p: 2, borderColor: 'warning.main' }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Conseils du coach nutrition
                  </Typography>
                  <Typography variant="body2">{selectedRecipe.tips}</Typography>
                </Paper>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={() => handleAddToPlan(selectedRecipe)}
            startIcon={<PlaylistAdd />}
          >
            Ajouter au plan
          </Button>
          <Button 
            onClick={() => handlePrintRecipe(selectedRecipe)}
            startIcon={<Print />}
          >
            Imprimer
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCloseRecipeDialog}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  /**
   * Rendu du dialogue d'ajout au plan de repas
   */
  const renderMealPlanDialog = () => {
    return (
      <Dialog
        open={mealPlanOpen}
        onClose={handleCloseMealPlan}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Ajouter au plan de repas
          <IconButton
            aria-label="close"
            onClick={handleCloseMealPlan}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>
            {selectedRecipe?.name}
          </Typography>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Jour</InputLabel>
            <Select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              label="Jour"
            >
              {dayOptions.map(day => (
                <MenuItem key={day} value={day}>{day}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Repas</InputLabel>
            <Select
              value={selectedMeal}
              onChange={(e) => setSelectedMeal(e.target.value)}
              label="Repas"
            >
              {mealOptions.map(meal => (
                <MenuItem key={meal} value={meal}>{meal}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseMealPlan}>
            Annuler
          </Button>
          <Button 
            variant="contained" 
            onClick={handleAddToMealPlan}
            disabled={!selectedDay || !selectedMeal}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Explorateur de recettes
        </Typography>
        <Typography variant="body1" paragraph color="text.secondary">
          Découvrez des recettes spécialement conçues pour les cyclistes, adaptées à vos besoins
          nutritionnels selon l'intensité et la durée de vos sorties.
        </Typography>
        
        {/* Barre de recherche */}
        <TextField
          fullWidth
          placeholder="Rechercher une recette, un ingrédient..."
          variant="outlined"
          value={searchTerm}
          onChange={handleSearchChange}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
        />
        
        {/* Onglets principaux */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
        >
          <Tab label="Toutes les recettes" />
          <Tab label="Mes favoris" />
        </Tabs>
        
        {/* Filtres principaux */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Catégorie</InputLabel>
              <Select
                value={activeCategory}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                label="Catégorie"
              >
                <MenuItem value="all">Toutes les catégories</MenuItem>
                {Object.values(recipesIndex.categories).map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Objectif</InputLabel>
              <Select
                value={activeObjective}
                onChange={(e) => handleFilterChange('objective', e.target.value)}
                label="Objectif"
              >
                <MenuItem value="all">Tous les objectifs</MenuItem>
                {Object.values(recipesIndex.objectives).map(objective => (
                  <MenuItem key={objective.id} value={objective.id}>
                    {objective.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Propriétés diététiques</InputLabel>
              <Select
                value={activeDietaryProperty}
                onChange={(e) => handleFilterChange('dietary', e.target.value)}
                label="Propriétés diététiques"
              >
                <MenuItem value="all">Toutes les propriétés</MenuItem>
                {Object.values(recipesIndex.dietaryProperties).map(property => (
                  <MenuItem key={property.id} value={property.id}>
                    {property.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {/* Bouton de filtres avancés */}
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={showAdvancedFilters ? <ExpandLess /> : <ExpandMore />}
            onClick={toggleAdvancedFilters}
            size="small"
            variant="outlined"
          >
            Filtres avancés
          </Button>
        </Box>
        
        {/* Filtres avancés */}
        {showAdvancedFilters && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Difficulté</InputLabel>
                <Select
                  value={advancedFilters.difficulty}
                  onChange={(e) => handleFilterChange('advanced', { key: 'difficulty', value: e.target.value })}
                  label="Difficulté"
                >
                  <MenuItem value="all">Toutes</MenuItem>
                  <MenuItem value="easy">Facile</MenuItem>
                  <MenuItem value="medium">Moyenne</MenuItem>
                  <MenuItem value="hard">Complexe</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Temps de préparation</InputLabel>
                <Select
                  value={advancedFilters.prepTime}
                  onChange={(e) => handleFilterChange('advanced', { key: 'prepTime', value: e.target.value })}
                  label="Temps de préparation"
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="quick">Rapide (&lt; 15min)</MenuItem>
                  <MenuItem value="medium">Moyen (&lt; 30min)</MenuItem>
                  <MenuItem value="long">Long (&gt; 30min)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Temps de cuisson</InputLabel>
                <Select
                  value={advancedFilters.cookTime}
                  onChange={(e) => handleFilterChange('advanced', { key: 'cookTime', value: e.target.value })}
                  label="Temps de cuisson"
                >
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="quick">Rapide (&lt; 15min)</MenuItem>
                  <MenuItem value="medium">Moyen (&lt; 30min)</MenuItem>
                  <MenuItem value="long">Long (&gt; 30min)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Calories</InputLabel>
                <Select
                  value={advancedFilters.calories}
                  onChange={(e) => handleFilterChange('advanced', { key: 'calories', value: e.target.value })}
                  label="Calories"
                >
                  <MenuItem value="all">Toutes</MenuItem>
                  <MenuItem value="low">Faible (&lt; 300 kcal)</MenuItem>
                  <MenuItem value="medium">Moyen (&lt; 600 kcal)</MenuItem>
                  <MenuItem value="high">Élevé (&gt; 600 kcal)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}
        
        {/* Statistiques de filtrage */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {filteredRecipes.length} recette{filteredRecipes.length > 1 ? 's' : ''} trouvée{filteredRecipes.length > 1 ? 's' : ''}
          </Typography>
        </Box>
        
        {/* Affichage des recettes */}
        {renderRecipeCards()}
      </Paper>
      
      {/* Dialogues */}
      {renderRecipeDialog()}
      {renderMealPlanDialog()}
    </Box>
  );
};

export default NutritionRecipesExplorer;
