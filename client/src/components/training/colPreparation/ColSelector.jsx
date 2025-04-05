import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  TextField, 
  InputAdornment,
  Chip,
  IconButton, 
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Pagination,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Search as SearchIcon,
  FilterList as FilterIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Terrain,
  Timeline,
  Speed,
  Info
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Composant de sélection de col pour la préparation d'entraînement spécifique
 * Permet de parcourir, filtrer et sélectionner un col parmi le catalogue
 */
const ColSelector = ({ cols = [], selectedCol, onSelectCol, userProfile }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    difficulty: '',
    region: '',
    elevation: '',
    favorites: false
  });
  const [filteredCols, setFilteredCols] = useState([]);
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState(userProfile?.favorites || []);
  const [recentlyViewed, setRecentlyViewed] = useState(userProfile?.recentCols || []);
  const itemsPerPage = 8;
  
  // Simuler le chargement des données
  useEffect(() => {
    setLoading(true);
    
    // Simuler un délai réseau
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Mettre à jour les cols filtrés lorsque les filtres changent
  useEffect(() => {
    if (!cols || cols.length === 0) return;
    
    let result = [...cols];
    
    // Filtrer par nom
    if (searchTerm) {
      result = result.filter(col => 
        col.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.region?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrer par difficulté
    if (filters.difficulty) {
      result = result.filter(col => col.difficulty === filters.difficulty);
    }
    
    // Filtrer par région
    if (filters.region) {
      result = result.filter(col => col.region === filters.region);
    }
    
    // Filtrer par dénivelé
    if (filters.elevation) {
      switch (filters.elevation) {
        case 'low':
          result = result.filter(col => col.elevation < 800);
          break;
        case 'medium':
          result = result.filter(col => col.elevation >= 800 && col.elevation < 1500);
          break;
        case 'high':
          result = result.filter(col => col.elevation >= 1500);
          break;
        default:
          break;
      }
    }
    
    // Filtrer par favoris
    if (filters.favorites) {
      result = result.filter(col => favorites.includes(col.id));
    }
    
    setFilteredCols(result);
    setPage(1); // Réinitialiser la pagination à la première page
  }, [cols, searchTerm, filters, favorites]);
  
  // Gérer le changement de page
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  // Gérer le changement de recherche
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Gérer le changement de filtre
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Ajouter/retirer un col des favoris
  const toggleFavorite = (colId) => {
    if (favorites.includes(colId)) {
      setFavorites(prev => prev.filter(id => id !== colId));
    } else {
      setFavorites(prev => [...prev, colId]);
    }
  };
  
  // Calculer les cols à afficher pour la page courante
  const paginatedCols = filteredCols.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  
  // Obtenir la liste des régions uniques
  const regions = [...new Set(cols.map(col => col.region))].filter(Boolean);
  
  // Animation pour les cartes de cols
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };
  
  // Rendu du sélecteur de cols
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Sélectionnez un col à préparer
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Choisissez le col que vous souhaitez préparer et nous vous créerons un programme d'entraînement spécifiquement adapté à ses caractéristiques.
      </Typography>
      
      {/* Filtres et recherche */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Rechercher un col..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            size="small"
          />
        </Grid>
        
        <Grid item xs={12} sm={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Difficulté</InputLabel>
                <Select
                  value={filters.difficulty}
                  label="Difficulté"
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                >
                  <MenuItem value="">Toutes</MenuItem>
                  <MenuItem value="easy">Facile</MenuItem>
                  <MenuItem value="medium">Modéré</MenuItem>
                  <MenuItem value="hard">Difficile</MenuItem>
                  <MenuItem value="extreme">Extrême</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Région</InputLabel>
                <Select
                  value={filters.region}
                  label="Région"
                  onChange={(e) => handleFilterChange('region', e.target.value)}
                >
                  <MenuItem value="">Toutes</MenuItem>
                  {regions.map(region => (
                    <MenuItem key={region} value={region}>{region}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Dénivelé</InputLabel>
                <Select
                  value={filters.elevation}
                  label="Dénivelé"
                  onChange={(e) => handleFilterChange('elevation', e.target.value)}
                >
                  <MenuItem value="">Tous</MenuItem>
                  <MenuItem value="low">&lt; 800m</MenuItem>
                  <MenuItem value="medium">800-1500m</MenuItem>
                  <MenuItem value="high">&gt; 1500m</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      
      {/* Liste des favoris et récemment consultés */}
      {(favorites.length > 0 || recentlyViewed.length > 0) && (
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            {favorites.length > 0 && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Favoris
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {favorites.map(favId => {
                    const favCol = cols.find(col => col.id === favId);
                    if (!favCol) return null;
                    
                    return (
                      <Chip 
                        key={favId}
                        label={favCol.name}
                        icon={<FavoriteIcon fontSize="small" />}
                        onClick={() => onSelectCol(favCol)}
                        clickable
                        sx={{ 
                          bgcolor: selectedCol?.id === favId ? alpha(theme.palette.primary.main, 0.1) : undefined,
                          borderColor: selectedCol?.id === favId ? theme.palette.primary.main : undefined,
                          borderWidth: selectedCol?.id === favId ? 1 : 0,
                          borderStyle: selectedCol?.id === favId ? 'solid' : undefined
                        }}
                      />
                    );
                  })}
                </Box>
              </Grid>
            )}
            
            {recentlyViewed.length > 0 && (
              <Grid item xs={12} md={favorites.length > 0 ? 6 : 12}>
                <Typography variant="subtitle2" gutterBottom>
                  Récemment consultés
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {recentlyViewed.map(recentId => {
                    const recentCol = cols.find(col => col.id === recentId);
                    if (!recentCol) return null;
                    
                    return (
                      <Chip 
                        key={recentId}
                        label={recentCol.name}
                        icon={<Terrain fontSize="small" />}
                        onClick={() => onSelectCol(recentCol)}
                        variant="outlined"
                        clickable
                        sx={{ 
                          bgcolor: selectedCol?.id === recentId ? alpha(theme.palette.primary.main, 0.1) : undefined,
                          borderColor: selectedCol?.id === recentId ? theme.palette.primary.main : undefined,
                          borderWidth: selectedCol?.id === recentId ? 1 : 0,
                          borderStyle: selectedCol?.id === recentId ? 'solid' : undefined
                        }}
                      />
                    );
                  })}
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      )}
      
      {/* Grille des cols */}
      {loading ? (
        <Grid container spacing={2}>
          {Array.from(new Array(4)).map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%' }}>
                <Skeleton variant="rectangular" height={140} />
                <CardContent>
                  <Skeleton variant="text" height={32} />
                  <Skeleton variant="text" />
                  <Skeleton variant="text" width="60%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          {filteredCols.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="subtitle1">
                Aucun col ne correspond à vos critères de recherche.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Essayez de modifier vos filtres ou votre recherche.
              </Typography>
            </Box>
          ) : (
            <>
              <Grid container spacing={2}>
                {paginatedCols.map((col, index) => (
                  <Grid item xs={12} sm={6} md={3} key={col.id}>
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={cardVariants}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                      <Card 
                        sx={{ 
                          height: '100%',
                          cursor: 'pointer',
                          borderColor: selectedCol?.id === col.id ? theme.palette.primary.main : 'transparent',
                          borderWidth: selectedCol?.id === col.id ? 2 : 1,
                          borderStyle: 'solid',
                          boxShadow: selectedCol?.id === col.id ? `0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}` : undefined
                        }}
                        onClick={() => onSelectCol(col)}
                      >
                        <CardMedia
                          sx={{ height: 140 }}
                          image={col.imageUrl || `https://source.unsplash.com/random/300x200/?mountain,${col.name}`}
                          title={col.name}
                        >
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              p: 1
                            }}
                          >
                            <Chip 
                              label={`${col.elevation}m`} 
                              size="small"
                              sx={{ 
                                bgcolor: alpha('#000', 0.6),
                                color: 'white',
                                height: 24
                              }}
                              icon={<Terrain style={{ color: 'white' }} />}
                            />
                            
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(col.id);
                              }}
                              sx={{ 
                                bgcolor: alpha('#000', 0.6),
                                color: 'white',
                                '&:hover': {
                                  bgcolor: alpha('#000', 0.7),
                                }
                              }}
                            >
                              {favorites.includes(col.id) ? (
                                <FavoriteIcon fontSize="small" sx={{ color: theme.palette.error.light }} />
                              ) : (
                                <FavoriteBorderIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Box>
                        </CardMedia>
                        
                        <CardContent>
                          <Typography variant="h6" component="div" gutterBottom noWrap>
                            {col.name}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {col.region} • {col.distance} km
                          </Typography>
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                            <Chip 
                              label={`${col.avgGradient}%`} 
                              size="small" 
                              icon={<Timeline fontSize="small" />}
                              sx={{ height: 24 }}
                            />
                            
                            <Chip 
                              label={
                                col.difficulty === 'easy' ? 'Facile' :
                                col.difficulty === 'medium' ? 'Modéré' :
                                col.difficulty === 'hard' ? 'Difficile' : 'Extrême'
                              }
                              size="small"
                              icon={<Speed fontSize="small" />}
                              sx={{ 
                                height: 24,
                                bgcolor: 
                                  col.difficulty === 'easy' ? alpha(theme.palette.success.main, 0.1) :
                                  col.difficulty === 'medium' ? alpha(theme.palette.info.main, 0.1) :
                                  col.difficulty === 'hard' ? alpha(theme.palette.warning.main, 0.1) :
                                  alpha(theme.palette.error.main, 0.1),
                                color: 
                                  col.difficulty === 'easy' ? theme.palette.success.main :
                                  col.difficulty === 'medium' ? theme.palette.info.main :
                                  col.difficulty === 'hard' ? theme.palette.warning.main :
                                  theme.palette.error.main
                              }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
              
              {/* Pagination */}
              {filteredCols.length > itemsPerPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination 
                    count={Math.ceil(filteredCols.length / itemsPerPage)} 
                    page={page} 
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </>
      )}
      
      {/* Affichage du col sélectionné */}
      {selectedCol && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Col sélectionné
          </Typography>
          
          <Card sx={{ overflow: 'hidden' }}>
            <Grid container>
              <Grid item xs={12} md={4}>
                <CardMedia
                  sx={{ height: { xs: 200, md: '100%' } }}
                  image={selectedCol.imageUrl || `https://source.unsplash.com/random/400x300/?mountain,${selectedCol.name}`}
                  title={selectedCol.name}
                />
              </Grid>
              
              <Grid item xs={12} md={8}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="h5" component="div" gutterBottom>
                        {selectedCol.name}
                      </Typography>
                      
                      <Typography variant="body1" paragraph>
                        {selectedCol.description || `Le ${selectedCol.name} est un col situé dans la région ${selectedCol.region}. Avec ses ${selectedCol.elevation} mètres de dénivelé et une pente moyenne de ${selectedCol.avgGradient}%, ce col est classé comme ${
                          selectedCol.difficulty === 'easy' ? 'facile' :
                          selectedCol.difficulty === 'medium' ? 'modéré' :
                          selectedCol.difficulty === 'hard' ? 'difficile' : 'extrême'
                        } et présente un véritable défi pour les cyclistes.`}
                      </Typography>
                    </Box>
                    
                    <IconButton
                      onClick={() => toggleFavorite(selectedCol.id)}
                      color={favorites.includes(selectedCol.id) ? 'error' : 'default'}
                    >
                      {favorites.includes(selectedCol.id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    </IconButton>
                  </Box>
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Région
                      </Typography>
                      <Typography variant="body1">
                        {selectedCol.region}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Altitude
                      </Typography>
                      <Typography variant="body1">
                        {selectedCol.altitude} m
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Dénivelé
                      </Typography>
                      <Typography variant="body1">
                        {selectedCol.elevation} m
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Distance
                      </Typography>
                      <Typography variant="body1">
                        {selectedCol.distance} km
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Pente moyenne
                      </Typography>
                      <Typography variant="body1">
                        {selectedCol.avgGradient}%
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Pente max
                      </Typography>
                      <Typography variant="body1">
                        {selectedCol.maxGradient}%
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Difficulté
                      </Typography>
                      <Typography variant="body1">
                        {selectedCol.difficulty === 'easy' ? 'Facile' :
                         selectedCol.difficulty === 'medium' ? 'Modéré' :
                         selectedCol.difficulty === 'hard' ? 'Difficile' : 'Extrême'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="text.secondary">
                        Technicité
                      </Typography>
                      <Typography variant="body1">
                        {selectedCol.technicality === 'low' ? 'Faible' :
                         selectedCol.technicality === 'medium' ? 'Moyenne' : 'Élevée'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Grid>
            </Grid>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default ColSelector;
