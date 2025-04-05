import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, CardMedia, 
  CardActionArea, Chip, TextField, InputAdornment, CircularProgress, 
  FormControl, InputLabel, Select, MenuItem, Divider, Button, 
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Rating, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import { 
  Search, FilterList, Add, Favorite, FavoriteBorder, Print, 
  Restaurant, DirectionsBike, FitnessCenter, Whatshot, AccessTime,
  Share, BookmarkBorder, Bookmark, Close, Edit, Cake, EmojiEvents,
  Healing, SupervisorAccount, Timer
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import nutritionService from '../../services/nutritionService';

/**
 * Bibliothèque de recettes adaptées aux cyclistes
 * Permet de consulter, rechercher et filtrer des recettes optimisées pour les cyclistes
 * avec valeurs nutritionnelles détaillées et recommendations selon le type d'effort
 */
const RecipeLibrary = () => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    mealType: 'all',
    difficulty: 'all',
    prepTime: 'all',
    dietaryPreference: 'all',
    trainingPhase: 'all',
    nutrientFocus: 'all'
  });
  const [openRecipeDialog, setOpenRecipeDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [favorites, setFavorites] = useState([]);

  // Catégories de recettes
  const mealTypes = [
    { id: 'all', label: 'Toutes les recettes' },
    { id: 'breakfast', label: 'Petit-déjeuner', icon: <Restaurant /> },
    { id: 'pre-ride', label: 'Avant l\'effort', icon: <DirectionsBike /> },
    { id: 'during-ride', label: 'Pendant l\'effort', icon: <Whatshot /> },
    { id: 'post-ride', label: 'Récupération', icon: <FitnessCenter /> },
    { id: 'lunch', label: 'Déjeuner', icon: <Restaurant /> },
    { id: 'dinner', label: 'Dîner', icon: <Restaurant /> },
    { id: 'snack', label: 'Collation', icon: <Restaurant /> },
    { id: 'carb-loading', label: 'Charge glucidique', icon: <Cake /> },
    { id: 'race-day', label: 'Jour de course', icon: <EmojiEvents /> },
    { id: 'recovery-week', label: 'Semaine de récupération', icon: <Healing /> },
    { id: 'training-camp', label: 'Stage d\'entraînement', icon: <SupervisorAccount /> }
  ];

  // Filtres supplémentaires pour types d'entraînement
  const trainingPhaseFilters = [
    { id: 'all', label: 'Toutes les phases' },
    { id: 'base', label: 'Phase de base (volume)' },
    { id: 'build', label: 'Phase de construction (intensité)' },
    { id: 'peak', label: 'Phase de pic (compétition)' },
    { id: 'recovery', label: 'Phase de récupération' }
  ];

  // Filtres supplémentaires pour focus nutritionnel
  const nutrientFocusFilters = [
    { id: 'all', label: 'Tous les focus' },
    { id: 'high-carb', label: 'Riche en glucides' },
    { id: 'high-protein', label: 'Riche en protéines' },
    { id: 'balanced', label: 'Équilibré' },
    { id: 'recovery', label: 'Récupération optimale' },
    { id: 'hydration', label: 'Hydratation' },
    { id: 'energy-dense', label: 'Haute densité énergétique' },
    { id: 'low-fiber', label: 'Faible en fibres (pré-course)' }
  ];

  // Récupération des recettes
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        // Récupération des recettes via le service nutritionnel
        const recipesData = await nutritionService.getRecipes();
        setRecipes(recipesData);
        setFilteredRecipes(recipesData);
        
        // Récupération des favoris
        if (user && user.id) {
          const userFavorites = await nutritionService.getUserFavoriteRecipes(user.id);
          setFavorites(userFavorites.map(fav => fav.id));
        }
      } catch (err) {
        console.error('Erreur lors du chargement des recettes:', err);
        setError('Impossible de charger les recettes. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [user]);

  // Filtrage des recettes lors de la recherche ou changement de filtres
  useEffect(() => {
    const applyFilters = () => {
      let result = [...recipes];
      
      // Filtre de recherche textuelle
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(recipe => 
          recipe.name.toLowerCase().includes(term) || 
          recipe.description.toLowerCase().includes(term) ||
          recipe.ingredients.some(ing => ing.name.toLowerCase().includes(term))
        );
      }
      
      // Filtres par catégorie
      if (filters.mealType !== 'all') {
        result = result.filter(recipe => recipe.mealType === filters.mealType);
      }
      
      if (filters.difficulty !== 'all') {
        result = result.filter(recipe => recipe.difficulty === filters.difficulty);
      }
      
      if (filters.prepTime !== 'all') {
        // Conversion du temps de préparation en minutes pour la comparaison
        const maxTime = {
          'quick': 15,
          'medium': 30,
          'long': 60
        }[filters.prepTime];
        
        if (maxTime) {
          result = result.filter(recipe => recipe.prepTimeMinutes <= maxTime);
        }
      }
      
      if (filters.dietaryPreference !== 'all') {
        result = result.filter(recipe => 
          recipe.dietaryTags && recipe.dietaryTags.includes(filters.dietaryPreference)
        );
      }
      
      if (filters.trainingPhase !== 'all') {
        result = result.filter(recipe => recipe.trainingPhase === filters.trainingPhase);
      }
      
      if (filters.nutrientFocus !== 'all') {
        result = result.filter(recipe => recipe.nutrientFocus === filters.nutrientFocus);
      }
      
      // Afficher seulement les favoris si l'onglet Favoris est actif
      if (activeTab === 1) {
        result = result.filter(recipe => favorites.includes(recipe.id));
      }
      
      setFilteredRecipes(result);
    };
    
    applyFilters();
  }, [searchTerm, filters, recipes, favorites, activeTab]);

  // Gestion des changements de filtres
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Ouvrir le dialogue détaillé d'une recette
  const handleRecipeClick = (recipe) => {
    setSelectedRecipe(recipe);
    setOpenRecipeDialog(true);
  };

  // Fermer le dialogue détaillé
  const handleCloseRecipeDialog = () => {
    setOpenRecipeDialog(false);
  };

  // Changer d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Ajouter/Retirer une recette des favoris
  const handleToggleFavorite = async (recipeId) => {
    try {
      if (!user) {
        // Afficher un message pour inciter à la connexion si non connecté
        setError('Connectez-vous pour ajouter des recettes à vos favoris.');
        return;
      }
      
      if (favorites.includes(recipeId)) {
        // Retirer des favoris
        await nutritionService.removeFromFavorites(user.id, recipeId);
        setFavorites(prev => prev.filter(id => id !== recipeId));
      } else {
        // Ajouter aux favoris
        await nutritionService.addToFavorites(user.id, recipeId);
        setFavorites(prev => [...prev, recipeId]);
      }
    } catch (err) {
      console.error('Erreur lors de la modification des favoris:', err);
      setError('Impossible de modifier vos favoris. Veuillez réessayer.');
    }
  };

  // Ajouter une recette au plan de repas (fonctionnalité à développer)
  const handleAddToPlan = (recipe) => {
    // À implémenter: intégration avec le planificateur de repas
    console.log('Ajouter au plan de repas:', recipe);
    // Placeholder pour la future fonctionnalité
    alert('Fonctionnalité bientôt disponible: Ajout de recettes au plan de repas');
  };

  // Imprimer une recette
  const handlePrintRecipe = (recipe) => {
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${recipe.name}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #1976d2; }
            .recipe-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .recipe-meta { color: #666; margin-bottom: 15px; }
            .ingredients { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .instructions { line-height: 1.6; }
            .nutrition { margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px; }
            table { width: 100%; border-collapse: collapse; }
            table th, table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <h1>${recipe.name}</h1>
          <div class="recipe-meta">
            <p>Temps de préparation: ${recipe.prepTimeMinutes} minutes | Difficulté: ${recipe.difficulty}</p>
            <p>Type de repas: ${mealTypes.find(t => t.id === recipe.mealType)?.label || recipe.mealType}</p>
          </div>
          <p>${recipe.description}</p>
          
          <div class="ingredients">
            <h2>Ingrédients</h2>
            <ul>
              ${recipe.ingredients.map(ing => `<li>${ing.quantity} ${ing.name}</li>`).join('')}
            </ul>
          </div>
          
          <div class="instructions">
            <h2>Instructions</h2>
            <ol>
              ${recipe.instructions.map(step => `<li>${step}</li>`).join('')}
            </ol>
          </div>
          
          <div class="nutrition">
            <h2>Valeurs nutritionnelles</h2>
            <table>
              <tr>
                <th>Calories</th>
                <th>Glucides</th>
                <th>Protéines</th>
                <th>Lipides</th>
              </tr>
              <tr>
                <td>${recipe.nutrition.calories} kcal</td>
                <td>${recipe.nutrition.carbs}g</td>
                <td>${recipe.nutrition.protein}g</td>
                <td>${recipe.nutrition.fat}g</td>
              </tr>
            </table>
          </div>
          
          <div class="notes">
            <h2>Notes pour cyclistes</h2>
            <p>${recipe.cyclingNotes || 'Aucune note spécifique'}</p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // Rendu des cartes de recettes
  const renderRecipeCards = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ p: 3 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      );
    }

    if (filteredRecipes.length === 0) {
      return (
        <Box sx={{ p: 3 }}>
          <Typography variant="subtitle1">
            Aucune recette ne correspond à vos critères. Essayez de modifier vos filtres.
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {filteredRecipes.map(recipe => (
          <Grid item xs={12} sm={6} md={4} key={recipe.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardActionArea onClick={() => handleRecipeClick(recipe)}>
                <CardMedia
                  component="img"
                  height="160"
                  image={recipe.image || 'https://via.placeholder.com/160x120?text=Recette'}
                  alt={recipe.name}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="div" noWrap>
                    {recipe.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {recipe.description.substring(0, 80)}...
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccessTime fontSize="small" color="action" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      {recipe.prepTimeMinutes} min
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip 
                      size="small" 
                      label={mealTypes.find(t => t.id === recipe.mealType)?.label} 
                      color="primary" 
                      variant="outlined"
                    />
                    {recipe.dietaryTags && recipe.dietaryTags.slice(0, 2).map(tag => (
                      <Chip key={tag} size="small" label={tag} />
                    ))}
                  </Box>
                </CardContent>
              </CardActionArea>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
                <IconButton 
                  aria-label="ajouter aux favoris" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(recipe.id);
                  }} 
                  color={favorites.includes(recipe.id) ? "error" : "default"}
                >
                  {favorites.includes(recipe.id) ? <Favorite /> : <FavoriteBorder />}
                </IconButton>
                <IconButton 
                  aria-label="ajouter au plan" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToPlan(recipe);
                  }}
                >
                  <BookmarkBorder />
                </IconButton>
                <IconButton 
                  aria-label="imprimer la recette" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrintRecipe(recipe);
                  }}
                >
                  <Print />
                </IconButton>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  // Rendu du dialogue de recette détaillée
  const renderRecipeDialog = () => {
    if (!selectedRecipe) return null;

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
            <Grid item xs={12} md={5}>
              <CardMedia
                component="img"
                image={selectedRecipe.image || 'https://via.placeholder.com/400x300?text=Recette'}
                alt={selectedRecipe.name}
                sx={{ borderRadius: 1, mb: 2 }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccessTime color="action" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {selectedRecipe.prepTimeMinutes} minutes
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Tags:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  <Chip 
                    label={mealTypes.find(t => t.id === selectedRecipe.mealType)?.label} 
                    color="primary" 
                  />
                  {selectedRecipe.dietaryTags && selectedRecipe.dietaryTags.map(tag => (
                    <Chip key={tag} label={tag} variant="outlined" />
                  ))}
                </Box>
              </Box>
              <Typography variant="subtitle2" gutterBottom>Valeurs nutritionnelles:</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nutriment</TableCell>
                      <TableCell align="right">Quantité</TableCell>
                      <TableCell align="right">% Quotidien*</TableCell>
                      <TableCell align="right">Importance cyclisme</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Calories</TableCell>
                      <TableCell align="right">{selectedRecipe.nutrition.calories} kcal</TableCell>
                      <TableCell align="right">{Math.round((selectedRecipe.nutrition.calories / 2500) * 100)}%</TableCell>
                      <TableCell align="right">
                        <Rating
                          value={4}
                          readOnly
                          icon={<Whatshot color="primary" fontSize="inherit" />}
                          emptyIcon={<Whatshot fontSize="inherit" />}
                          max={4}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Glucides</TableCell>
                      <TableCell align="right">{selectedRecipe.nutrition.carbs}g</TableCell>
                      <TableCell align="right">{Math.round((selectedRecipe.nutrition.carbs / 300) * 100)}%</TableCell>
                      <TableCell align="right">
                        <Rating
                          value={selectedRecipe.mealType === 'during-ride' || selectedRecipe.mealType === 'pre-ride' ? 4 : 3}
                          readOnly
                          icon={<Whatshot color="primary" fontSize="inherit" />}
                          emptyIcon={<Whatshot fontSize="inherit" />}
                          max={4}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Protéines</TableCell>
                      <TableCell align="right">{selectedRecipe.nutrition.protein}g</TableCell>
                      <TableCell align="right">{Math.round((selectedRecipe.nutrition.protein / 140) * 100)}%</TableCell>
                      <TableCell align="right">
                        <Rating
                          value={selectedRecipe.mealType === 'post-ride' ? 4 : 3}
                          readOnly
                          icon={<Whatshot color="primary" fontSize="inherit" />}
                          emptyIcon={<Whatshot fontSize="inherit" />}
                          max={4}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Lipides</TableCell>
                      <TableCell align="right">{selectedRecipe.nutrition.fat}g</TableCell>
                      <TableCell align="right">{Math.round((selectedRecipe.nutrition.fat / 70) * 100)}%</TableCell>
                      <TableCell align="right">
                        <Rating
                          value={selectedRecipe.mealType === 'during-ride' ? 1 : 2}
                          readOnly
                          icon={<Whatshot color="primary" fontSize="inherit" />}
                          emptyIcon={<Whatshot fontSize="inherit" />}
                          max={4}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Sodium</TableCell>
                      <TableCell align="right">{selectedRecipe.nutrition.sodium}mg</TableCell>
                      <TableCell align="right">{Math.round((selectedRecipe.nutrition.sodium / 2400) * 100)}%</TableCell>
                      <TableCell align="right">
                        <Rating
                          value={selectedRecipe.mealType === 'during-ride' || selectedRecipe.mealType === 'post-ride' ? 4 : 2}
                          readOnly
                          icon={<Whatshot color="primary" fontSize="inherit" />}
                          emptyIcon={<Whatshot fontSize="inherit" />}
                          max={4}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Potassium</TableCell>
                      <TableCell align="right">{selectedRecipe.nutrition.potassium || '~'}mg</TableCell>
                      <TableCell align="right">{selectedRecipe.nutrition.potassium ? Math.round((selectedRecipe.nutrition.potassium / 3500) * 100) : '~'}%</TableCell>
                      <TableCell align="right">
                        <Rating
                          value={3}
                          readOnly
                          icon={<Whatshot color="primary" fontSize="inherit" />}
                          emptyIcon={<Whatshot fontSize="inherit" />}
                          max={4}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Glycémie</TableCell>
                      <TableCell align="right">{selectedRecipe.nutrition.glycemicIndex || '~'} (indice)</TableCell>
                      <TableCell align="right">-</TableCell>
                      <TableCell align="right">
                        <Rating
                          value={selectedRecipe.mealType === 'during-ride' ? 4 : 2}
                          readOnly
                          icon={<Whatshot color="primary" fontSize="inherit" />}
                          emptyIcon={<Whatshot fontSize="inherit" />}
                          max={4}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  * Pourcentages basés sur un régime de 2500 kcal pour un cycliste moyen. Vos besoins peuvent varier.
                </Typography>
              </TableContainer>
            </Grid>
            <Grid item xs={12} md={7}>
              <Typography variant="body1" paragraph>
                {selectedRecipe.description}
              </Typography>
              <Typography variant="h6" gutterBottom>Ingrédients</Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                {selectedRecipe.ingredients.map((ing, index) => (
                  <Box component="li" key={index} sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>{ing.quantity}</strong> {ing.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Instructions</Typography>
              <Box component="ol" sx={{ pl: 2 }}>
                {selectedRecipe.instructions.map((step, index) => (
                  <Box component="li" key={index} sx={{ mb: 1 }}>
                    <Typography variant="body2">{step}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
          <Box>
            <Button 
              startIcon={favorites.includes(selectedRecipe.id) ? <Favorite /> : <FavoriteBorder />}
              onClick={() => handleToggleFavorite(selectedRecipe.id)}
              color={favorites.includes(selectedRecipe.id) ? "error" : "primary"}
            >
              {favorites.includes(selectedRecipe.id) ? 'Retiré des favoris' : 'Ajouter aux favoris'}
            </Button>
          </Box>
          <Box>
            <Button startIcon={<Print />} onClick={() => handlePrintRecipe(selectedRecipe)} sx={{ mr: 1 }}>
              Imprimer
            </Button>
            <Button 
              variant="contained" 
              startIcon={<BookmarkBorder />}
              onClick={() => handleAddToPlan(selectedRecipe)}
            >
              Ajouter au plan de repas
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>Bibliothèque de recettes pour cyclistes</Typography>
        <Typography variant="body2" paragraph>
          Explorez notre collection de recettes spécialement conçues pour les cyclistes, avec des options adaptées 
          pour chaque moment de votre entraînement. Toutes les recettes incluent des valeurs nutritionnelles détaillées.
        </Typography>
        
        {/* Barre de recherche et filtres */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              placeholder="Rechercher une recette..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Type de repas</InputLabel>
              <Select
                value={filters.mealType}
                onChange={(e) => handleFilterChange('mealType', e.target.value)}
                label="Type de repas"
              >
                {mealTypes.map(type => (
                  <MenuItem key={type.id} value={type.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {type.icon && <Box sx={{ mr: 1 }}>{type.icon}</Box>}
                      {type.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Difficulté</InputLabel>
              <Select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                label="Difficulté"
              >
                <MenuItem value="all">Toutes</MenuItem>
                <MenuItem value="easy">Facile</MenuItem>
                <MenuItem value="medium">Moyenne</MenuItem>
                <MenuItem value="hard">Complexe</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Temps de préparation</InputLabel>
              <Select
                value={filters.prepTime}
                onChange={(e) => handleFilterChange('prepTime', e.target.value)}
                label="Temps de préparation"
              >
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="quick">Rapide (&lt; 15min)</MenuItem>
                <MenuItem value="medium">Moyen (&lt; 30min)</MenuItem>
                <MenuItem value="long">Long (&lt; 60min)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Préférences alimentaires</InputLabel>
              <Select
                value={filters.dietaryPreference}
                onChange={(e) => handleFilterChange('dietaryPreference', e.target.value)}
                label="Préférences alimentaires"
              >
                <MenuItem value="all">Toutes</MenuItem>
                <MenuItem value="vegetarian">Végétarien</MenuItem>
                <MenuItem value="vegan">Végan</MenuItem>
                <MenuItem value="gluten-free">Sans gluten</MenuItem>
                <MenuItem value="high-protein">Riche en protéines</MenuItem>
                <MenuItem value="high-carb">Riche en glucides</MenuItem>
                <MenuItem value="keto">Cétogène</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Phase d'entraînement</InputLabel>
              <Select
                value={filters.trainingPhase}
                onChange={(e) => handleFilterChange('trainingPhase', e.target.value)}
                label="Phase d'entraînement"
              >
                {trainingPhaseFilters.map(phase => (
                  <MenuItem key={phase.id} value={phase.id}>
                    {phase.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Focus nutritionnel</InputLabel>
              <Select
                value={filters.nutrientFocus}
                onChange={(e) => handleFilterChange('nutrientFocus', e.target.value)}
                label="Focus nutritionnel"
              >
                {nutrientFocusFilters.map(focus => (
                  <MenuItem key={focus.id} value={focus.id}>
                    {focus.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {/* Onglets */}
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tab label="Toutes les recettes" />
          <Tab label="Mes favoris" />
        </Tabs>
        
        {/* Affichage des recettes */}
        {renderRecipeCards()}
        {renderRecipeDialog()}
      </Paper>
    </Box>
  );
};

export default RecipeLibrary;
