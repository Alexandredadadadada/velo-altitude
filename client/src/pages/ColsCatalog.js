import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia,
  CardActions,
  Button, 
  TextField, 
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Slider,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Divider,
  Chip,
  IconButton,
  Paper,
  CircularProgress,
  Pagination,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Terrain as TerrainIcon,
  DirectionsBike as BikeIcon,
  Straighten as LengthIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  Image as ImageIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getColsByFilters, getMostPopularCols } from '../services/colsService';

/**
 * Page du catalogue des cols cyclistes
 */
const ColsCatalog = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // États pour la gestion des cols
  const [cols, setCols] = useState([]);
  const [filteredCols, setFilteredCols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;
  
  // États pour les filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    difficulty: '',
    region: '',
    country: '',
    minElevation: 0,
    maxElevation: 3000,
    minLength: 0,
    minGradient: 0
  });
  const [sortBy, setSortBy] = useState('name');
  const [showFilters, setShowFilters] = useState(!isMobile);
  
  // Valeurs de difficulté pour le filtre
  const difficultyLevels = [
    { value: '1', label: 'Facile (1/5)' },
    { value: '2', label: 'Modéré (2/5)' },
    { value: '3', label: 'Difficile (3/5)' },
    { value: '4', label: 'Très difficile (4/5)' },
    { value: '5', label: 'Extrême (5/5)' }
  ];
  
  // Régions pour le filtre
  const regions = [
    { value: 'alpes', label: 'Alpes' },
    { value: 'pyrenees', label: 'Pyrénées' },
    { value: 'jura', label: 'Jura' },
    { value: 'massif-central', label: 'Massif Central' },
    { value: 'vosges', label: 'Vosges' },
    { value: 'grand-est', label: 'Grand Est' },
    { value: 'autre', label: 'Autre' }
  ];
  
  // Pays pour le filtre
  const countries = [
    { value: 'france', label: 'France' },
    { value: 'italy', label: 'Italie' },
    { value: 'spain', label: 'Espagne' },
    { value: 'switzerland', label: 'Suisse' },
    { value: 'belgium', label: 'Belgique' },
    { value: 'luxembourg', label: 'Luxembourg' },
    { value: 'germany', label: 'Allemagne' },
    { value: 'other', label: 'Autre' }
  ];
  
  // Options de tri
  const sortOptions = [
    { value: 'name', label: 'Nom (A-Z)' },
    { value: 'name_desc', label: 'Nom (Z-A)' },
    { value: 'elevation', label: 'Altitude (croissant)' },
    { value: 'elevation_desc', label: 'Altitude (décroissant)' },
    { value: 'length', label: 'Distance (croissant)' },
    { value: 'length_desc', label: 'Distance (décroissant)' },
    { value: 'gradient', label: 'Pente (croissant)' },
    { value: 'gradient_desc', label: 'Pente (décroissant)' },
    { value: 'difficulty', label: 'Difficulté (croissant)' },
    { value: 'difficulty_desc', label: 'Difficulté (décroissant)' },
    { value: 'popularity', label: 'Popularité' }
  ];
  
  // Charger les cols au chargement initial
  useEffect(() => {
    const fetchCols = async () => {
      try {
        setLoading(true);
        const popularCols = await getMostPopularCols(100); // On récupère un nombre important pour avoir assez de données
        setCols(popularCols);
        setFilteredCols(popularCols);
        setTotalPages(Math.ceil(popularCols.length / itemsPerPage));
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des cols:', err);
        setError('Impossible de charger les cols. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCols();
  }, []);
  
  // Appliquer les filtres et la recherche
  useEffect(() => {
    // Filtrer les cols en fonction des critères
    let filtered = [...cols];
    
    // Filtre par recherche textuelle
    if (searchQuery) {
      filtered = filtered.filter(col => 
        col.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (col.location?.region && col.location.region.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (col.location?.country && col.location.country.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Filtre par difficulté
    if (filters.difficulty) {
      filtered = filtered.filter(col => 
        col.difficulty === parseInt(filters.difficulty)
      );
    }
    
    // Filtre par région
    if (filters.region) {
      filtered = filtered.filter(col => 
        col.location?.region?.toLowerCase() === filters.region
      );
    }
    
    // Filtre par pays
    if (filters.country) {
      filtered = filtered.filter(col => 
        col.location?.country?.toLowerCase() === filters.country
      );
    }
    
    // Filtre par altitude
    filtered = filtered.filter(col => 
      col.statistics.summit_elevation >= filters.minElevation &&
      col.statistics.summit_elevation <= filters.maxElevation
    );
    
    // Filtre par longueur
    if (filters.minLength > 0) {
      filtered = filtered.filter(col => 
        col.statistics.length >= filters.minLength
      );
    }
    
    // Filtre par pente
    if (filters.minGradient > 0) {
      filtered = filtered.filter(col => 
        col.statistics.avg_gradient >= filters.minGradient
      );
    }
    
    // Tri des résultats
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'elevation':
          return a.statistics.summit_elevation - b.statistics.summit_elevation;
        case 'elevation_desc':
          return b.statistics.summit_elevation - a.statistics.summit_elevation;
        case 'length':
          return a.statistics.length - b.statistics.length;
        case 'length_desc':
          return b.statistics.length - a.statistics.length;
        case 'gradient':
          return a.statistics.avg_gradient - b.statistics.avg_gradient;
        case 'gradient_desc':
          return b.statistics.avg_gradient - a.statistics.avg_gradient;
        case 'difficulty':
          return a.difficulty - b.difficulty;
        case 'difficulty_desc':
          return b.difficulty - a.difficulty;
        case 'popularity':
          return (b.popularity || 0) - (a.popularity || 0);
        default:
          return 0;
      }
    });
    
    setFilteredCols(filtered);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setPage(1); // Réinitialiser à la première page après un changement de filtre
  }, [cols, searchQuery, filters, sortBy]);
  
  // Pagination - obtenir les éléments de la page actuelle
  const getCurrentPageItems = () => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCols.slice(startIndex, endIndex);
  };
  
  // Gérer le changement de page
  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Gérer le changement de recherche
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };
  
  // Gérer le changement de filtre
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Gérer le changement de tri
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };
  
  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setSearchQuery('');
    setFilters({
      difficulty: '',
      region: '',
      country: '',
      minElevation: 0,
      maxElevation: 3000,
      minLength: 0,
      minGradient: 0
    });
    setSortBy('name');
  };
  
  // Naviguer vers la page de détail d'un col
  const navigateToColDetail = (colId) => {
    navigate(`/cols/${colId}`);
  };
  
  // Formater l'affichage de la difficulté
  const renderDifficultyStars = (difficulty) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <StarIcon 
          key={i} 
          fontSize="small" 
          sx={{ 
            color: i <= difficulty ? 'warning.main' : 'text.disabled',
            width: 16,
            height: 16
          }} 
        />
      );
    }
    return (
      <Box display="flex" alignItems="center">
        {stars}
      </Box>
    );
  };
  
  // Obtenir la couleur correspondant à la difficulté
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 1:
        return theme.palette.success.main;
      case 2:
        return theme.palette.success.dark;
      case 3:
        return theme.palette.warning.main;
      case 4:
        return theme.palette.warning.dark;
      case 5:
        return theme.palette.error.main;
      default:
        return theme.palette.info.main;
    }
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        mb={4}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Catalogue des Cols
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Découvrez notre sélection de cols cyclistes, filtrez selon vos préférences et explorez les détails.
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Panneau de filtres */}
        <Grid item xs={12} md={3}>
          <Paper 
            elevation={2}
            sx={{ 
              p: 2, 
              mb: { xs: 2, md: 0 },
              position: { md: 'sticky' },
              top: { md: 24 },
              maxHeight: { md: 'calc(100vh - 48px)' },
              overflowY: { md: 'auto' }
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Filtres</Typography>
              <Button 
                size="small" 
                onClick={() => setShowFilters(!showFilters)}
                startIcon={<FilterIcon />}
                sx={{ display: { xs: 'flex', md: 'none' } }}
              >
                {showFilters ? 'Masquer' : 'Afficher'}
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box
              sx={{ 
                display: showFilters ? 'block' : { xs: 'none', md: 'block' },
                transition: 'all 0.3s ease'
              }}
            >
              <TextField
                fullWidth
                label="Rechercher un col"
                variant="outlined"
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 3 }}
              />
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="difficulty-select-label">Difficulté</InputLabel>
                <Select
                  labelId="difficulty-select-label"
                  id="difficulty-select"
                  value={filters.difficulty}
                  label="Difficulté"
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                >
                  <MenuItem value="">Toutes</MenuItem>
                  {difficultyLevels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="region-select-label">Région</InputLabel>
                <Select
                  labelId="region-select-label"
                  id="region-select"
                  value={filters.region}
                  label="Région"
                  onChange={(e) => handleFilterChange('region', e.target.value)}
                >
                  <MenuItem value="">Toutes</MenuItem>
                  {regions.map((region) => (
                    <MenuItem key={region.value} value={region.value}>
                      {region.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="country-select-label">Pays</InputLabel>
                <Select
                  labelId="country-select-label"
                  id="country-select"
                  value={filters.country}
                  label="Pays"
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                >
                  <MenuItem value="">Tous</MenuItem>
                  {countries.map((country) => (
                    <MenuItem key={country.value} value={country.value}>
                      {country.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Box sx={{ mb: 3 }}>
                <Typography id="elevation-range-slider" gutterBottom>
                  Altitude (m)
                </Typography>
                <Slider
                  value={[filters.minElevation, filters.maxElevation]}
                  onChange={(e, newValue) => {
                    handleFilterChange('minElevation', newValue[0]);
                    handleFilterChange('maxElevation', newValue[1]);
                  }}
                  valueLabelDisplay="auto"
                  min={0}
                  max={3000}
                  step={100}
                  aria-labelledby="elevation-range-slider"
                />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption">{filters.minElevation} m</Typography>
                  <Typography variant="caption">{filters.maxElevation} m</Typography>
                </Box>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography id="length-slider" gutterBottom>
                  Longueur minimale (km)
                </Typography>
                <Slider
                  value={filters.minLength}
                  onChange={(e, newValue) => handleFilterChange('minLength', newValue)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={50}
                  step={1}
                  aria-labelledby="length-slider"
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography id="gradient-slider" gutterBottom>
                  Pente moyenne minimale (%)
                </Typography>
                <Slider
                  value={filters.minGradient}
                  onChange={(e, newValue) => handleFilterChange('minGradient', newValue)}
                  valueLabelDisplay="auto"
                  min={0}
                  max={15}
                  step={0.5}
                  aria-labelledby="gradient-slider"
                />
              </Box>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="sort-select-label">Trier par</InputLabel>
                <Select
                  labelId="sort-select-label"
                  id="sort-select"
                  value={sortBy}
                  label="Trier par"
                  onChange={handleSortChange}
                  startAdornment={
                    <InputAdornment position="start">
                      <SortIcon />
                    </InputAdornment>
                  }
                >
                  {sortOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Button
                fullWidth
                variant="outlined"
                onClick={resetFilters}
              >
                Réinitialiser les filtres
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Liste des cols */}
        <Grid item xs={12} md={9}>
          <Box mb={3}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography>
                  {filteredCols.length} cols trouvés
                </Typography>
                <FormControl variant="outlined" size="small" sx={{ width: 200 }}>
                  <InputLabel id="sort-mobile-label">Trier par</InputLabel>
                  <Select
                    labelId="sort-mobile-label"
                    value={sortBy}
                    onChange={handleSortChange}
                    label="Trier par"
                  >
                    {sortOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Paper>
          </Box>
          
          {loading ? (
            <Box display="flex" justifyContent="center" my={5}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box bgcolor="error.light" p={3} borderRadius={1}>
              <Typography color="error">{error}</Typography>
            </Box>
          ) : filteredCols.length === 0 ? (
            <Box 
              bgcolor="background.paper" 
              p={5} 
              textAlign="center" 
              borderRadius={1} 
              boxShadow={1}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Aucun col ne correspond à vos critères
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={resetFilters} 
                sx={{ mt: 2 }}
              >
                Réinitialiser les filtres
              </Button>
            </Box>
          ) : (
            <>
              <Grid container spacing={2}>
                {getCurrentPageItems().map((col) => (
                  <Grid 
                    item 
                    xs={12} 
                    sm={6} 
                    md={4} 
                    key={col.id}
                    component={motion.div}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: 6
                        }
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="160"
                        image={col.images?.[0] || '/assets/default-col.jpg'}
                        alt={col.name}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="div" gutterBottom noWrap>
                          {col.name}
                        </Typography>
                        
                        <Box display="flex" alignItems="center" mb={1}>
                          {renderDifficultyStars(col.difficulty)}
                          <Chip 
                            label={`${col.difficulty}/5`} 
                            size="small" 
                            sx={{ 
                              ml: 1, 
                              bgcolor: getDifficultyColor(col.difficulty),
                              color: 'white'
                            }} 
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {col.location?.region}, {col.location?.country}
                        </Typography>
                        
                        <Grid container spacing={1} sx={{ mt: 1 }}>
                          <Grid item xs={6}>
                            <Box display="flex" alignItems="center">
                              <TerrainIcon fontSize="small" sx={{ color: 'primary.main', mr: 0.5 }} />
                              <Typography variant="body2">
                                {col.statistics.summit_elevation} m
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box display="flex" alignItems="center">
                              <LengthIcon fontSize="small" sx={{ color: 'primary.main', mr: 0.5 }} />
                              <Typography variant="body2">
                                {col.statistics.length} km
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box display="flex" alignItems="center">
                              <BikeIcon fontSize="small" sx={{ color: 'primary.main', mr: 0.5 }} />
                              <Typography variant="body2">
                                {col.statistics.elevation_gain} m
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box display="flex" alignItems="center">
                              <TerrainIcon fontSize="small" sx={{ color: 'primary.main', mr: 0.5 }} />
                              <Typography variant="body2">
                                {col.statistics.avg_gradient}%
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                      
                      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                        <Box display="flex" alignItems="center">
                          <IconButton size="small">
                            <FavoriteBorderIcon fontSize="small" />
                          </IconButton>
                          <Box display="flex" alignItems="center" ml={1}>
                            <ImageIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                            <Typography variant="caption">
                              {col.images?.length || 0}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" ml={1}>
                            <CommentIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                            <Typography variant="caption">
                              {col.reviews?.length || 0}
                            </Typography>
                          </Box>
                        </Box>
                        <Button 
                          size="small" 
                          onClick={() => navigateToColDetail(col.id)}
                          color="primary"
                        >
                          Détails
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={4}>
                  <Pagination 
                    count={totalPages} 
                    page={page} 
                    onChange={handlePageChange} 
                    color="primary" 
                    showFirstButton 
                    showLastButton
                    size={isMobile ? 'small' : 'medium'}
                  />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default ColsCatalog;
