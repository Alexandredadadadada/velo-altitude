import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Grid, 
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CardActionArea
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import TerrainIcon from '@mui/icons-material/Terrain';
import RouteIcon from '@mui/icons-material/Route';
import View3dIcon from '@mui/icons-material/ViewInAr';
import { Col } from '../../types';
import { useRouter } from 'next/router';

interface ColsGridProps {
  cols: Col[];
  loading: boolean;
  error: Error | null;
  onSearch: (query: string) => void;
  onSelectCol?: (col: Col) => void;
  selectedCols?: Col[];
}

const ColsGrid: React.FC<ColsGridProps> = ({
  cols,
  loading,
  error,
  onSearch,
  onSelectCol,
  selectedCols = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const router = useRouter();
  
  // Extraire toutes les régions uniques pour le filtre
  const regions = [...new Set(cols.map(col => col.region))];
  
  // Filtrer les cols en fonction des critères sélectionnés
  const filteredCols = cols.filter(col => {
    const matchesRegion = regionFilter ? col.region === regionFilter : true;
    const matchesDifficulty = difficultyFilter ? col.difficulty === difficultyFilter : true;
    return matchesRegion && matchesDifficulty;
  });
  
  // Vérifier si un col est déjà sélectionné
  const isColSelected = (col: Col) => {
    return selectedCols.some(selectedCol => selectedCol.id === col.id);
  };
  
  const handleSearch = () => {
    onSearch(searchQuery);
  };
  
  // Effectuer la recherche lors de la pression sur Entrée
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Réinitialiser les filtres
  const resetFilters = () => {
    setRegionFilter('');
    setDifficultyFilter('');
  };
  
  // Naviguer vers la page de visualisation 3D
  const handleView3D = (col: Col, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la sélection du col
    router.push(`/col-3d-viewer?colId=${col.id}`);
  };
  
  // Formatage de la difficulté pour l'affichage
  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'info';
      case 'hard': return 'warning';
      case 'extreme': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Barre de recherche */}
      <Box mb={4} display="flex" alignItems="center" gap={2}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Rechercher un col par nom..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Rechercher'}
        </Button>
      </Box>
      
      {/* Filtres */}
      <Box mb={4} display="flex" flexWrap="wrap" gap={2}>
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel id="region-filter-label">Région</InputLabel>
          <Select
            labelId="region-filter-label"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            label="Région"
          >
            <MenuItem value="">Toutes les régions</MenuItem>
            {regions.map(region => (
              <MenuItem key={region} value={region}>{region}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel id="difficulty-filter-label">Difficulté</InputLabel>
          <Select
            labelId="difficulty-filter-label"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            label="Difficulté"
          >
            <MenuItem value="">Toutes les difficultés</MenuItem>
            <MenuItem value="easy">Facile</MenuItem>
            <MenuItem value="medium">Moyen</MenuItem>
            <MenuItem value="hard">Difficile</MenuItem>
            <MenuItem value="extreme">Extrême</MenuItem>
          </Select>
        </FormControl>
        
        <Button 
          variant="outlined" 
          startIcon={<FilterListIcon />}
          onClick={resetFilters}
          disabled={!regionFilter && !difficultyFilter}
        >
          Réinitialiser les filtres
        </Button>
      </Box>
      
      {/* Affichage des résultats */}
      {error ? (
        <Box p={4} textAlign="center">
          <Typography color="error" variant="h6" gutterBottom>
            Une erreur est survenue
          </Typography>
          <Typography color="error">{error.message}</Typography>
        </Box>
      ) : loading ? (
        <Box p={4} textAlign="center">
          <CircularProgress size={40} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Chargement des cols...
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredCols.length > 0 ? (
            filteredCols.map(col => (
              <Grid item key={col.id} xs={12} sm={6} md={4} lg={3}>
                <Card 
                  elevation={isColSelected(col) ? 8 : 2} 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: isColSelected(col) ? '2px solid' : 'none',
                    borderColor: 'primary.main',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <CardActionArea 
                    onClick={() => onSelectCol && onSelectCol(col)}
                    disabled={!onSelectCol}
                    sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                  >
                    <CardMedia
                      component="img"
                      height="140"
                      image={col.imageUrl || '/images/default-col.jpg'}
                      alt={col.name}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h5" component="div">
                        {col.name}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Chip 
                          label={col.region}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip 
                          label={col.country}
                          size="small"
                          variant="outlined"
                        />
                        <Chip 
                          label={col.difficulty === 'easy' ? 'Facile' : 
                                 col.difficulty === 'medium' ? 'Moyen' : 
                                 col.difficulty === 'hard' ? 'Difficile' : 'Extrême'}
                          size="small"
                          color={getDifficultyColor(col.difficulty) as any}
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box display="flex" alignItems="center">
                          <TerrainIcon sx={{ mr: 1, fontSize: '1rem', color: 'primary.main' }} />
                          <Typography variant="body2">
                            {col.elevation}m d'altitude
                          </Typography>
                        </Box>
                        
                        <Box display="flex" alignItems="center">
                          <RouteIcon sx={{ mr: 1, fontSize: '1rem', color: 'primary.main' }} />
                          <Typography variant="body2">
                            {col.length}km à {col.avgGradient}% de moyenne
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Pente max: {col.maxGradient}%
                        </Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                  
                  {/* Bouton de visualisation 3D */}
                  <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<View3dIcon />}
                      onClick={(e) => handleView3D(col, e)}
                    >
                      Vue 3D
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))
          ) : (
            <Box width="100%" p={4} textAlign="center">
              <Typography variant="h6">
                Aucun col trouvé avec les critères sélectionnés.
              </Typography>
            </Box>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default ColsGrid;
