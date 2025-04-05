import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Button,
  IconButton,
  Paper,
  Tooltip,
  useTheme,
  alpha,
  Slider,
  Divider,
  Zoom,
  Collapse,
  useMediaQuery,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TerrainIcon from '@mui/icons-material/Terrain';
import FlagIcon from '@mui/icons-material/Flag';
import PublicIcon from '@mui/icons-material/Public';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Composant de galerie de cols pour le sélecteur 7 Majeurs
 * Affiche les cols disponibles avec filtres et recherche
 */
const ColsGallery = ({ cols, selectedCols, onColSelect }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filteredCols, setFilteredCols] = useState(cols);
  const [sort, setSort] = useState('name');
  const [hoveredCol, setHoveredCol] = useState(null);
  const [lastFilterChange, setLastFilterChange] = useState(Date.now());
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    countries: [],
    regions: [],
    altitudeRange: [0, 3000],
    difficultyRange: [1, 5],
  });
  
  // Références pour l'animation de défilement
  const scrollRef = useRef(null);
  
  // Extraire les pays et régions uniques pour les filtres
  const uniqueCountries = [...new Set(cols.map(col => col.location?.country).filter(Boolean))];
  const uniqueRegions = [...new Set(cols.map(col => col.location?.region).filter(Boolean))];
  
  // Filtrer les cols en fonction de la recherche et des filtres
  useEffect(() => {
    let result = [...cols];
    
    // Filtre de recherche
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(col => 
        col.name.toLowerCase().includes(search) || 
        col.location?.country?.toLowerCase().includes(search) ||
        col.location?.region?.toLowerCase().includes(search)
      );
    }
    
    // Filtres pays et régions
    if (filters.countries.length > 0) {
      result = result.filter(col => filters.countries.includes(col.location?.country));
    }
    
    if (filters.regions.length > 0) {
      result = result.filter(col => filters.regions.includes(col.location?.region));
    }
    
    // Filtre altitude
    result = result.filter(col => 
      col.altitude >= filters.altitudeRange[0] && 
      col.altitude <= filters.altitudeRange[1]
    );
    
    // Filtre difficulté
    result = result.filter(col => 
      col.difficulty >= filters.difficultyRange[0] && 
      col.difficulty <= filters.difficultyRange[1]
    );
    
    // Tri des résultats
    result.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'altitude':
          return b.altitude - a.altitude;
        case 'difficulty':
          return b.difficulty - a.difficulty;
        case 'length':
          return b.length - a.length;
        default:
          return 0;
      }
    });
    
    setFilteredCols(result);
    // Marquer le moment du changement de filtre pour l'animation
    setLastFilterChange(Date.now());
  }, [cols, searchTerm, filters, sort]);
  
  // Gestionnaire pour la sélection d'un filtre de pays
  const handleCountryFilter = (country) => {
    setFilters(prev => {
      const newCountries = prev.countries.includes(country)
        ? prev.countries.filter(c => c !== country)
        : [...prev.countries, country];
      
      return { ...prev, countries: newCountries };
    });
  };
  
  // Gestionnaire pour la sélection d'un filtre de région
  const handleRegionFilter = (region) => {
    setFilters(prev => {
      const newRegions = prev.regions.includes(region)
        ? prev.regions.filter(r => r !== region)
        : [...prev.regions, region];
      
      return { ...prev, regions: newRegions };
    });
  };
  
  // Gestionnaire pour le changement de plage d'altitude
  const handleAltitudeChange = (event, newValue) => {
    setFilters(prev => ({ ...prev, altitudeRange: newValue }));
  };
  
  // Gestionnaire pour le changement de plage de difficulté
  const handleDifficultyChange = (event, newValue) => {
    setFilters(prev => ({ ...prev, difficultyRange: newValue }));
  };
  
  // Gestionnaire pour la réinitialisation des filtres
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilters({
      countries: [],
      regions: [],
      altitudeRange: [0, 3000],
      difficultyRange: [1, 5],
    });
    setSort('name');
    setShowFilters(false);
    
    // Faire défiler vers le haut
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  };

  // Gestionnaire pour le survol d'un col
  const handleColHover = (col) => {
    setHoveredCol(col);
  };

  // Gestionnaire pour la fin du survol
  const handleColLeave = () => {
    setHoveredCol(null);
  };
  
  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        overflow: 'hidden',
        background: theme => theme.palette.mode === 'dark'
          ? alpha(theme.palette.background.paper, 0.4)
          : alpha(theme.palette.background.paper, 0.7),
        backdropFilter: 'blur(8px)',
        boxShadow: theme => theme.palette.mode === 'dark'
          ? '0 8px 32px rgba(0,0,0,0.2)'
          : '0 8px 32px rgba(0,0,0,0.07)',
        border: '1px solid',
        borderColor: theme => theme.palette.mode === 'dark'
          ? alpha(theme.palette.divider, 0.1)
          : alpha(theme.palette.divider, 0.5),
      }}
    >
      {/* En-tête avec barre de recherche et boutons de filtre */}
      <Box 
        sx={{ 
          p: { xs: 2, md: 3 },
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            fullWidth
            placeholder="Rechercher un col..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton 
                    size="small" 
                    onClick={() => setSearchTerm('')}
                    edge="end"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: '20px',
                backgroundColor: alpha(theme.palette.background.paper, 0.5),
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                },
                pr: searchTerm ? 0.5 : 2,
              }
            }}
          />
          
          <Tooltip title={showFilters ? "Masquer les filtres" : "Afficher les filtres"}>
            <Button
              variant={showFilters ? "contained" : "outlined"}
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? "primary" : "inherit"}
              startIcon={showFilters ? <TuneIcon /> : <FilterListIcon />}
              sx={{
                borderRadius: '20px',
                minWidth: '44px',
                whiteSpace: 'nowrap',
                px: 2,
                backgroundColor: showFilters 
                  ? 'primary.main' 
                  : alpha(theme.palette.background.paper, 0.5),
                borderColor: alpha(theme.palette.divider, 0.2),
                '&:hover': {
                  backgroundColor: showFilters 
                    ? 'primary.dark' 
                    : alpha(theme.palette.background.paper, 0.8),
                }
              }}
            >
              {!isMobile && "Filtres"}
            </Button>
          </Tooltip>
        </Box>
        
        {/* Panneau de filtres */}
        <Collapse in={showFilters}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                background: alpha(theme.palette.background.paper, 0.5),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <Grid container spacing={3}>
                {/* Filtres pays */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Pays
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {uniqueCountries.map(country => (
                      <Chip
                        key={country}
                        label={country}
                        size="small"
                        onClick={() => handleCountryFilter(country)}
                        sx={{
                          borderRadius: '16px',
                          backgroundColor: filters.countries.includes(country)
                            ? 'primary.main'
                            : alpha(theme.palette.action.selected, 0.1),
                          color: filters.countries.includes(country)
                            ? 'primary.contrastText'
                            : 'text.primary',
                          fontWeight: filters.countries.includes(country) ? 600 : 400,
                          '&:hover': {
                            backgroundColor: filters.countries.includes(country)
                              ? 'primary.dark'
                              : alpha(theme.palette.action.selected, 0.2),
                          },
                          transition: 'all 0.2s ease',
                        }}
                        icon={filters.countries.includes(country) && (
                          <PublicIcon fontSize="small" sx={{ color: 'inherit' }} />
                        )}
                      />
                    ))}
                  </Box>
                </Grid>
                
                {/* Filtres régions */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Régions
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {uniqueRegions.map(region => (
                      <Chip
                        key={region}
                        label={region}
                        size="small"
                        onClick={() => handleRegionFilter(region)}
                        sx={{
                          borderRadius: '16px',
                          backgroundColor: filters.regions.includes(region)
                            ? 'primary.main'
                            : alpha(theme.palette.action.selected, 0.1),
                          color: filters.regions.includes(region)
                            ? 'primary.contrastText'
                            : 'text.primary',
                          fontWeight: filters.regions.includes(region) ? 600 : 400,
                          '&:hover': {
                            backgroundColor: filters.regions.includes(region)
                              ? 'primary.dark'
                              : alpha(theme.palette.action.selected, 0.2),
                          },
                          transition: 'all 0.2s ease',
                        }}
                        icon={filters.regions.includes(region) && (
                          <FlagIcon fontSize="small" sx={{ color: 'inherit' }} />
                        )}
                      />
                    ))}
                  </Box>
                </Grid>
                
                {/* Filtre altitude */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Altitude ({filters.altitudeRange[0]} - {filters.altitudeRange[1]} m)
                  </Typography>
                  <Box sx={{ px: 2, mt: 2 }}>
                    <Slider
                      value={filters.altitudeRange}
                      onChange={handleAltitudeChange}
                      min={0}
                      max={3000}
                      step={100}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(value) => `${value} m`}
                      marks={[
                        { value: 0, label: '0 m' },
                        { value: 1500, label: '1500 m' },
                        { value: 3000, label: '3000 m' },
                      ]}
                      sx={{
                        color: 'primary.main',
                        '& .MuiSlider-thumb': {
                          '&:hover, &.Mui-focusVisible': {
                            boxShadow: `0px 0px 0px 8px ${alpha(theme.palette.primary.main, 0.16)}`,
                          },
                        },
                      }}
                    />
                  </Box>
                </Grid>
                
                {/* Filtre difficulté */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Difficulté ({filters.difficultyRange[0]} - {filters.difficultyRange[1]})
                  </Typography>
                  <Box sx={{ px: 2, mt: 2 }}>
                    <Slider
                      value={filters.difficultyRange}
                      onChange={handleDifficultyChange}
                      min={1}
                      max={5}
                      step={1}
                      valueLabelDisplay="auto"
                      marks={[
                        { value: 1, label: '1' },
                        { value: 3, label: '3' },
                        { value: 5, label: '5' },
                      ]}
                      sx={{
                        color: 'primary.main',
                        '& .MuiSlider-thumb': {
                          '&:hover, &.Mui-focusVisible': {
                            boxShadow: `0px 0px 0px 8px ${alpha(theme.palette.primary.main, 0.16)}`,
                          },
                        },
                      }}
                    />
                  </Box>
                </Grid>
                
                {/* Options de tri et réinitialisation */}
                <Grid item xs={12}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2
                  }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Trier par
                      </Typography>
                      <ToggleButtonGroup
                        value={sort}
                        exclusive
                        onChange={(e, newSort) => newSort && setSort(newSort)}
                        size="small"
                        sx={{
                          '& .MuiToggleButton-root': {
                            borderRadius: '4px',
                            px: 1.5,
                            py: 0.5,
                            textTransform: 'none',
                            fontWeight: 500,
                            borderColor: alpha(theme.palette.divider, 0.3),
                            '&.Mui-selected': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              borderColor: alpha(theme.palette.primary.main, 0.5),
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                              }
                            }
                          }
                        }}
                      >
                        <ToggleButton value="name">Nom</ToggleButton>
                        <ToggleButton value="altitude">Altitude</ToggleButton>
                        <ToggleButton value="difficulty">Difficulté</ToggleButton>
                        <ToggleButton value="length">Distance</ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                    
                    <Button
                      variant="outlined"
                      color="inherit"
                      onClick={handleResetFilters}
                      startIcon={<CloseIcon />}
                      sx={{ 
                        borderRadius: '20px',
                        borderColor: alpha(theme.palette.divider, 0.2),
                        color: theme.palette.text.secondary,
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.background.paper, 0.8),
                          borderColor: alpha(theme.palette.divider, 0.5),
                        }
                      }}
                    >
                      Réinitialiser les filtres
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </motion.div>
        </Collapse>
        
        {/* Résumé des filtres appliqués */}
        {(filters.countries.length > 0 || 
          filters.regions.length > 0 || 
          filters.altitudeRange[0] > 0 || 
          filters.altitudeRange[1] < 3000 ||
          filters.difficultyRange[0] > 1 ||
          filters.difficultyRange[1] < 5 ||
          searchTerm) && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
              <FilterListIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
              Filtres actifs:
            </Typography>
            
            {searchTerm && (
              <Chip 
                label={`Recherche: "${searchTerm}"`} 
                size="small"
                onDelete={() => setSearchTerm('')}
                sx={{ borderRadius: '20px' }}
              />
            )}
            
            {filters.countries.map(country => (
              <Chip 
                key={country}
                label={`Pays: ${country}`} 
                size="small"
                onDelete={() => handleCountryFilter(country)}
                sx={{ borderRadius: '20px' }}
              />
            ))}
            
            {filters.regions.map(region => (
              <Chip 
                key={region}
                label={`Région: ${region}`} 
                size="small"
                onDelete={() => handleRegionFilter(region)}
                sx={{ borderRadius: '20px' }}
              />
            ))}
            
            {(filters.altitudeRange[0] > 0 || filters.altitudeRange[1] < 3000) && (
              <Chip 
                label={`Altitude: ${filters.altitudeRange[0]}-${filters.altitudeRange[1]} m`} 
                size="small"
                onDelete={() => setFilters(prev => ({ ...prev, altitudeRange: [0, 3000] }))}
                sx={{ borderRadius: '20px' }}
              />
            )}
            
            {(filters.difficultyRange[0] > 1 || filters.difficultyRange[1] < 5) && (
              <Chip 
                label={`Difficulté: ${filters.difficultyRange[0]}-${filters.difficultyRange[1]}`} 
                size="small"
                onDelete={() => setFilters(prev => ({ ...prev, difficultyRange: [1, 5] }))}
                sx={{ borderRadius: '20px' }}
              />
            )}
          </Box>
        )}
      </Box>
      
      {/* Liste des cols */}
      <Box 
        ref={scrollRef}
        sx={{ 
          flexGrow: 1, 
          overflowY: 'auto',
          p: { xs: 2, md: 3 },
          pt: 2
        }}
      >
        <motion.div
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Grid container spacing={2}>
            {filteredCols.map((col) => {
              const isSelected = selectedCols.some(c => c.id === col.id);
              
              return (
                <Grid item xs={12} sm={6} md={4} key={`${col.id}-${lastFilterChange}`}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 300,
                      damping: 24,
                      duration: 0.3 
                    }}
                    whileHover={{ 
                      scale: 1.02, 
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                    onClick={() => onColSelect(col)}
                    onMouseEnter={() => handleColHover(col)}
                    onMouseLeave={handleColLeave}
                    style={{ height: '100%', cursor: 'pointer' }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        bgcolor: isSelected 
                          ? alpha(theme.palette.primary.main, 0.03)
                          : 'background.paper',
                        '&:hover': {
                          borderColor: isSelected 
                            ? theme.palette.primary.main
                            : alpha(theme.palette.primary.main, 0.3),
                        },
                        ...(isSelected && {
                          borderColor: theme.palette.primary.main,
                          boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.5)}`,
                        }),
                      }}
                    >
                      {/* Image du col */}
                      <Box 
                        sx={{ 
                          position: 'relative', 
                          pt: '56.25%' /* 16:9 aspect ratio */
                        }}
                      >
                        <CardMedia
                          component="img"
                          image={col.images?.thumbnail || '/images/cols/default-thumb.jpg'}
                          alt={col.name}
                          sx={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.5s ease',
                            ...(hoveredCol?.id === col.id && {
                              transform: 'scale(1.05)',
                            })
                          }}
                        />
                        
                        {/* Badge d'altitude */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            bgcolor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            backdropFilter: 'blur(5px)',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <TerrainIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem' }} />
                          {col.altitude} m
                        </Box>
                        
                        {/* Badge de difficulté */}
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 12,
                            left: 12,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {[...Array(5)].map((_, i) => (
                            <Box
                              key={i}
                              sx={{
                                width: i < col.difficulty ? 16 : 12,
                                height: i < col.difficulty ? 6 : 4,
                                bgcolor: i < col.difficulty 
                                  ? 'primary.main' 
                                  : alpha('#fff', 0.3),
                                borderRadius: '2px',
                                mx: 0.2,
                                transition: 'all 0.2s ease',
                                ...(hoveredCol?.id === col.id && i < col.difficulty && {
                                  width: 18,
                                  height: 7,
                                })
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                      
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Typography 
                          variant="subtitle1" 
                          component="h3" 
                          fontWeight={600}
                          gutterBottom
                          sx={{ 
                            color: isSelected ? 'primary.main' : 'text.primary',
                            transition: 'color 0.3s ease',
                          }}
                        >
                          {col.name}
                        </Typography>
                        
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}
                        >
                          <PublicIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7, fontSize: '1rem' }} />
                          {col.location?.country}{col.location?.region ? `, ${col.location.region}` : ''}
                        </Typography>
                        
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mt: 1
                          }}
                        >
                          <Tooltip title="Longueur">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <TrendingUpIcon color="primary" fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} />
                              <Typography variant="body2" fontWeight={500}>
                                {col.length} km
                              </Typography>
                            </Box>
                          </Tooltip>
                          
                          <Tooltip title="Pente moyenne">
                            <Typography variant="body2" fontWeight={500} sx={{ display: 'flex', alignItems: 'center' }}>
                              {col.averageGradient}%
                            </Typography>
                          </Tooltip>
                        </Box>
                      </CardContent>
                      
                      {/* Superposition de sélection */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: alpha(theme.palette.primary.main, 0.2),
                              backdropFilter: 'blur(2px)',
                              zIndex: 2
                            }}
                          >
                            <Box
                              sx={{
                                borderRadius: '50%',
                                width: 50,
                                height: 50,
                                bgcolor: 'primary.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                              }}
                            >
                              <CheckIcon sx={{ color: 'white', fontSize: '1.8rem' }} />
                            </Box>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </motion.div>
      </Box>
    </Paper>
  );
};

export default ColsGallery;
