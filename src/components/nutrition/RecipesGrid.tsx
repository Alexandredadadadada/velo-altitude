import React, { useState } from 'react';
import { 
  Grid, 
  Box, 
  TextField, 
  InputAdornment, 
  Typography, 
  Chip,
  CircularProgress,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RecipeCard from './RecipeCard';
import { Recipe } from '../../types';
import { useRouter } from 'next/router';

interface RecipesGridProps {
  recipes: Recipe[];
  loading?: boolean;
  error?: Error | null;
  onSearch?: (query: string) => void;
  onCategoryChange?: (category: string) => void;
  onTagSelect?: (tag: string) => void;
}

const RecipesGrid: React.FC<RecipesGridProps> = ({ 
  recipes, 
  loading = false,
  error = null,
  onSearch,
  onCategoryChange,
  onTagSelect
}) => {
  const theme = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const itemsPerPage = 12;
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Filtrer les recettes en fonction de la recherche
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = !searchQuery || 
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || recipe.category === selectedCategory;
    
    const matchesDifficulty = selectedDifficulty === 'all' || recipe.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRecipes.length / itemsPerPage);
  const displayedRecipes = filteredRecipes.slice(startIndex, endIndex);

  // Extraire tous les tags uniques des recettes
  const allTags = Array.from(new Set(recipes.flatMap(recipe => recipe.tags))).sort();

  // Gérer la recherche
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setPage(1); // Réinitialiser la page lors d'une nouvelle recherche
    
    if (onSearch) {
      onSearch(query);
    }
  };

  // Gérer le changement de catégorie
  const handleCategoryChange = (e: SelectChangeEvent) => {
    const category = e.target.value;
    setSelectedCategory(category);
    setPage(1); // Réinitialiser la page lors d'un changement de filtre
    
    if (onCategoryChange) {
      onCategoryChange(category);
    }
  };

  // Gérer le changement de difficulté
  const handleDifficultyChange = (e: SelectChangeEvent) => {
    setSelectedDifficulty(e.target.value);
    setPage(1); // Réinitialiser la page lors d'un changement de filtre
  };

  // Gérer le clic sur un tag
  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    setPage(1);
    
    if (onTagSelect) {
      onTagSelect(tag);
    }
  };

  // Naviguer vers la page de détails de recette
  const handleRecipeClick = (recipeId: string) => {
    router.push(`/nutrition/recettes/${recipeId}`);
  };

  return (
    <Box>
      {/* Barre de recherche et filtres */}
      <Box 
        sx={{ 
          mb: 4, 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          alignItems: { md: 'center' },
          justifyContent: 'space-between'
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Rechercher une recette..."
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: { md: '50%' } }}
        />
        
        <Box 
          display="flex" 
          flexDirection={{ xs: 'column', sm: 'row' }}
          gap={2}
        >
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="category-filter-label">Catégorie</InputLabel>
            <Select
              labelId="category-filter-label"
              value={selectedCategory}
              label="Catégorie"
              onChange={handleCategoryChange}
              size="small"
              startAdornment={
                <InputAdornment position="start">
                  <FilterListIcon fontSize="small" />
                </InputAdornment>
              }
            >
              <MenuItem value="all">Toutes</MenuItem>
              <MenuItem value="before">
                <Box display="flex" alignItems="center">
                  <FitnessCenterIcon fontSize="small" sx={{ mr: 1, color: theme.palette.info.main }} />
                  Avant effort
                </Box>
              </MenuItem>
              <MenuItem value="during">
                <Box display="flex" alignItems="center">
                  <LocalFireDepartmentIcon fontSize="small" sx={{ mr: 1, color: theme.palette.warning.main }} />
                  Pendant effort
                </Box>
              </MenuItem>
              <MenuItem value="after">
                <Box display="flex" alignItems="center">
                  <RestaurantIcon fontSize="small" sx={{ mr: 1, color: theme.palette.success.main }} />
                  Récupération
                </Box>
              </MenuItem>
              <MenuItem value="special">
                <Box display="flex" alignItems="center">
                  <LocalFireDepartmentIcon fontSize="small" sx={{ mr: 1, color: theme.palette.secondary.main }} />
                  Spécial cols
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="difficulty-filter-label">Difficulté</InputLabel>
            <Select
              labelId="difficulty-filter-label"
              value={selectedDifficulty}
              label="Difficulté"
              onChange={handleDifficultyChange}
              size="small"
            >
              <MenuItem value="all">Toutes</MenuItem>
              <MenuItem value="easy">Facile</MenuItem>
              <MenuItem value="medium">Moyenne</MenuItem>
              <MenuItem value="hard">Difficile</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      {/* Afficher les tags populaires */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Tags populaires:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {allTags.slice(0, 15).map((tag) => (
            <Chip 
              key={tag} 
              label={tag} 
              size="small" 
              variant={searchQuery === tag ? "filled" : "outlined"}
              color={searchQuery === tag ? "primary" : "default"}
              onClick={() => handleTagClick(tag)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
      </Box>
      
      {/* Messages d'erreur ou de chargement */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Erreur lors du chargement des recettes: {error.message}
        </Alert>
      )}
      
      {/* Résultats de la recherche */}
      {!loading && !error && displayedRecipes.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Aucune recette ne correspond à votre recherche. Essayez d'autres termes ou filtres.
        </Alert>
      )}
      
      {/* Grille de recettes */}
      <Grid container spacing={3}>
        {displayedRecipes.map((recipe) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={recipe.id}>
            <RecipeCard 
              recipe={recipe} 
              onClick={() => handleRecipeClick(recipe.id)}
            />
          </Grid>
        ))}
      </Grid>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={(_, newPage) => setPage(newPage)} 
            color="primary" 
          />
        </Box>
      )}
      
      {/* Indicateur de résultats */}
      {!loading && filteredRecipes.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          Affichage de {startIndex + 1}-{Math.min(endIndex, filteredRecipes.length)} sur {filteredRecipes.length} recettes
        </Typography>
      )}
    </Box>
  );
};

export default RecipesGrid;
