import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Chip,
  TextField,
  InputAdornment,
  Autocomplete,
  Button,
  IconButton,
  Divider,
  Paper,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Search,
  LocationOn,
  ArrowUpward,
  FilterList,
  Delete,
  Add,
  Favorite,
  FavoriteBorder
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Composant pour la sélection des cols dans le simulateur d'entraînement
 * Permet de rechercher, filtrer et sélectionner des cols pour l'entraînement
 */
const ColSelectionStep = ({ selectedCols = [], onColsChange, availableCols = [] }) => {
  const theme = useTheme();
  
  // États
  const [search, setSearch] = useState('');
  const [filteredCols, setFilteredCols] = useState(availableCols);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    region: [],
    difficulte: [],
    altitude: [0, 3000],
    distance: [0, 100]
  });
  const [favorites, setFavorites] = useState([]);
  
  // Régions disponibles (générées à partir des cols)
  const regions = [...new Set(availableCols.map(col => col.region))];
  
  // Niveaux de difficulté
  const difficultyLevels = ['Facile', 'Modéré', 'Difficile', 'Très difficile', 'Extrême'];
  
  // Effet pour filtrer les cols selon la recherche et les filtres
  useEffect(() => {
    let filtered = [...availableCols];
    
    // Filtre par recherche
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(col => 
        col.name.toLowerCase().includes(searchLower) || 
        col.region.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtre par région
    if (filters.region.length > 0) {
      filtered = filtered.filter(col => filters.region.includes(col.region));
    }
    
    // Filtre par difficulté
    if (filters.difficulte.length > 0) {
      filtered = filtered.filter(col => filters.difficulte.includes(col.difficulty));
    }
    
    // Filtre par altitude
    filtered = filtered.filter(col => 
      col.altitude >= filters.altitude[0] && 
      col.altitude <= filters.altitude[1]
    );
    
    // Filtre par distance
    filtered = filtered.filter(col => 
      col.distance >= filters.distance[0] && 
      col.distance <= filters.distance[1]
    );
    
    setFilteredCols(filtered);
  }, [search, filters, availableCols]);
  
  // Ajouter un col à la sélection
  const addCol = (col) => {
    if (selectedCols.findIndex(c => c.id === col.id) === -1) {
      onColsChange([...selectedCols, col]);
    }
  };
  
  // Retirer un col de la sélection
  const removeCol = (colId) => {
    onColsChange(selectedCols.filter(col => col.id !== colId));
  };
  
  // Ajouter/retirer des favoris
  const toggleFavorite = (colId) => {
    if (favorites.includes(colId)) {
      setFavorites(favorites.filter(id => id !== colId));
    } else {
      setFavorites([...favorites, colId]);
    }
  };
  
  // Mise à jour des filtres
  const handleFilterChange = (filterType, value) => {
    setFilters({
      ...filters,
      [filterType]: value
    });
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Sélectionnez les cols pour votre programme d'entraînement
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choisissez les cols que vous souhaitez gravir. Le simulateur générera un programme d'entraînement adapté à ces cols et à votre niveau actuel.
      </Typography>
      
      {/* Barre de recherche et filtres */}
      <Paper
        elevation={1}
        sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Rechercher un col par nom ou région..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="primary" />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                startIcon={<FilterList />}
                onClick={() => setShowFilters(!showFilters)}
                color="primary"
                variant={showFilters ? "contained" : "outlined"}
                size="small"
              >
                Filtres {showFilters ? '(Masquer)' : '(Afficher)'}
              </Button>
            </Box>
          </Grid>
        </Grid>
        
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6} lg={3}>
                    <Autocomplete
                      multiple
                      options={regions}
                      value={filters.region}
                      onChange={(e, newValue) => handleFilterChange('region', newValue)}
                      renderInput={(params) => <TextField {...params} label="Régions" size="small" />}
                      size="small"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6} lg={3}>
                    <Autocomplete
                      multiple
                      options={difficultyLevels}
                      value={filters.difficulte}
                      onChange={(e, newValue) => handleFilterChange('difficulte', newValue)}
                      renderInput={(params) => <TextField {...params} label="Difficulté" size="small" />}
                      size="small"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6} lg={3}>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="caption" color="text.secondary">
                        Altitude (m) : {filters.altitude[0]} - {filters.altitude[1]}
                      </Typography>
                      {/* Slider pour l'altitude à implémenter */}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6} lg={3}>
                    <Box sx={{ width: '100%' }}>
                      <Typography variant="caption" color="text.secondary">
                        Distance (km) : {filters.distance[0]} - {filters.distance[1]}
                      </Typography>
                      {/* Slider pour la distance à implémenter */}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Paper>
      
      {/* Liste des cols sélectionnés */}
      {selectedCols.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Cols sélectionnés ({selectedCols.length})
          </Typography>
          
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              borderRadius: 2,
              bgcolor: alpha(theme.palette.success.main, 0.05),
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
            }}
          >
            <Grid container spacing={2}>
              {selectedCols.map(col => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={`selected-${col.id}`}>
                  <Card 
                    elevation={2} 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)'
                      }
                    }}
                    component={motion.div}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="120"
                        image={col.image || `https://source.unsplash.com/random/400x200/?mountain,${col.id}`}
                        alt={col.name}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          p: 1
                        }}
                      >
                        <IconButton 
                          size="small"
                          onClick={() => removeCol(col.id)}
                          sx={{ 
                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                            '&:hover': { bgcolor: alpha(theme.palette.error.light, 0.9) }
                          }}
                        >
                          <Delete fontSize="small" color="error" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <CardContent sx={{ flexGrow: 1, py: 1.5, px: 2 }}>
                      <Typography variant="subtitle2" component="h3" noWrap>
                        {col.name}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" fontSize="0.75rem" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <LocationOn fontSize="inherit" sx={{ mr: 0.5 }} />
                        {col.region}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', mt: 1, gap: 0.5, flexWrap: 'wrap' }}>
                        <Chip 
                          label={`${col.altitude}m`} 
                          size="small" 
                          variant="outlined"
                          icon={<ArrowUpward fontSize="small" />}
                        />
                        <Chip 
                          label={col.difficulty} 
                          size="small"
                          variant="outlined"
                          color={
                            col.difficulty === 'Extrême' ? 'error' :
                            col.difficulty === 'Très difficile' ? 'warning' :
                            col.difficulty === 'Difficile' ? 'secondary' :
                            'primary'
                          }
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
      )}
      
      {/* Liste des cols disponibles */}
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Cols disponibles ({filteredCols.length})
        </Typography>
        
        <Grid container spacing={2}>
          {filteredCols.length > 0 ? (
            filteredCols.map(col => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={`available-${col.id}`}>
                <Card 
                  elevation={1} 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    cursor: 'pointer',
                    opacity: selectedCols.some(c => c.id === col.id) ? 0.6 : 1,
                    '&:hover': {
                      boxShadow: 4
                    }
                  }}
                  component={motion.div}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => addCol(col)}
                >
                  <Box sx={{ position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="120"
                      image={col.image || `https://source.unsplash.com/random/400x200/?mountain,${col.id}`}
                      alt={col.name}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        justifyContent: 'space-between',
                        p: 1
                      }}
                    >
                      <Chip 
                        label={`${col.distance} km`} 
                        size="small" 
                        sx={{ 
                          bgcolor: 'rgba(255, 255, 255, 0.85)',
                          fontSize: '0.7rem',
                          height: 24
                        }} 
                      />
                      
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(col.id);
                        }}
                        sx={{ 
                          bgcolor: 'rgba(255, 255, 255, 0.85)',
                          width: 24,
                          height: 24
                        }}
                      >
                        {favorites.includes(col.id) ? (
                          <Favorite fontSize="small" color="error" />
                        ) : (
                          <FavoriteBorder fontSize="small" />
                        )}
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1, py: 1.5, px: 2 }}>
                    <Typography variant="subtitle2" component="h3" noWrap>
                      {col.name}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" fontSize="0.75rem" sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationOn fontSize="inherit" sx={{ mr: 0.5 }} />
                      {col.region}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', mt: 1, gap: 0.5, flexWrap: 'wrap' }}>
                      <Chip 
                        label={`${col.altitude}m`} 
                        size="small" 
                        variant="outlined"
                        icon={<ArrowUpward fontSize="small" />}
                      />
                      <Chip 
                        label={col.difficulty} 
                        size="small"
                        variant="outlined"
                        color={
                          col.difficulty === 'Extrême' ? 'error' :
                          col.difficulty === 'Très difficile' ? 'warning' :
                          col.difficulty === 'Difficile' ? 'secondary' :
                          'primary'
                        }
                      />
                    </Box>
                  </CardContent>
                  
                  {!selectedCols.some(c => c.id === col.id) && (
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        inset: 0, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        bgcolor: 'rgba(0, 0, 0, 0)',
                        opacity: 0,
                        transition: '0.2s all',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.3)',
                          opacity: 1
                        }
                      }}
                    >
                      <Button 
                        variant="contained" 
                        color="primary"
                        startIcon={<Add />}
                        size="small"
                      >
                        Ajouter
                      </Button>
                    </Box>
                  )}
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Aucun col correspondant aux critères de recherche
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default ColSelectionStep;
