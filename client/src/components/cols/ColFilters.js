import React, { useState, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import {
  Paper, Box, Typography, Divider, Button, 
  Stack, FormControl, InputLabel, Select, MenuItem, 
  Slider, TextField, InputAdornment, IconButton,
  useTheme, useMediaQuery, Chip, Tooltip,
  FormGroup, FormControlLabel, Checkbox
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  Terrain as TerrainIcon,
  WbSunny as SunnyIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';

// Liste des régions disponibles
const regions = ['Vosges', 'Jura', 'Alpes', 'Massif Central', 'Pyrénées'];

// Niveaux de difficulté
const difficulties = ['Facile', 'Modéré', 'Difficile'];

// Types de surface
const surfaces = ['Asphalte', 'Gravier', 'Mixte'];

// Niveaux de difficulté technique
const technicalDifficulties = ['1', '2', '3', '4', '5'];

// Saisons recommandées
const seasons = ['Printemps', 'Été', 'Automne', 'Hiver'];

/**
 * Composant de filtres pour les cols
 * Permet de rechercher, filtrer et trier les cols selon différents critères
 * Optimisé avec memo et useCallback pour éviter les re-renders inutiles
 */
const ColFilters = memo(({ 
  searchTerm, 
  filterRegion, 
  filterDifficulty, 
  filterElevation, 
  filtersOpen,
  filterSurface = [],
  filterTechnicalDifficulty = '',
  filterSeasons = [],
  onSearchChange,
  onRegionChange,
  onDifficultyChange, 
  onElevationChange,
  onFiltersOpenChange,
  onResetFilters,
  onSurfaceChange,
  onTechnicalDifficultyChange,
  onSeasonsChange,
  isMobile = false // Nouveau paramètre pour le mode mobile
}) => {
  // Déterminer si les filtres avancés sont ouverts
  const [showAdvanced, setShowAdvanced] = useState(false);
  const theme = useTheme();
  
  // Vérifier si des filtres sont actifs
  const hasActiveFilters = filterRegion || filterDifficulty || 
    filterElevation[0] > 0 || filterElevation[1] < 3000 ||
    filterSurface.length > 0 || filterTechnicalDifficulty || filterSeasons.length > 0;

  // Gestion du changement de recherche
  const handleSearchChange = useCallback((e) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  // Gestion du changement de région
  const handleRegionChange = useCallback((e) => {
    onRegionChange(e.target.value);
  }, [onRegionChange]);

  // Gestion du changement de difficulté
  const handleDifficultyChange = useCallback((e) => {
    onDifficultyChange(e.target.value);
  }, [onDifficultyChange]);

  // Gestion du changement d'altitude
  const handleElevationChange = useCallback((e, newValue) => {
    onElevationChange(newValue);
  }, [onElevationChange]);

  // Gestion de la réinitialisation des filtres
  const handleResetFilters = useCallback(() => {
    onResetFilters();
  }, [onResetFilters]);

  // Gestion du changement de surface
  const handleSurfaceChange = useCallback((surface) => {
    const newSurfaces = [...filterSurface];
    const index = newSurfaces.indexOf(surface);
    
    if (index === -1) {
      newSurfaces.push(surface);
    } else {
      newSurfaces.splice(index, 1);
    }
    
    onSurfaceChange(newSurfaces);
  }, [filterSurface, onSurfaceChange]);

  // Gestion du changement de difficulté technique
  const handleTechnicalDifficultyChange = useCallback((e) => {
    onTechnicalDifficultyChange(e.target.value);
  }, [onTechnicalDifficultyChange]);

  // Gestion du changement de saisons
  const handleSeasonChange = useCallback((season) => {
    const newSeasons = [...filterSeasons];
    const index = newSeasons.indexOf(season);
    
    if (index === -1) {
      newSeasons.push(season);
    } else {
      newSeasons.splice(index, 1);
    }
    
    onSeasonsChange(newSeasons);
  }, [filterSeasons, onSeasonsChange]);

  // Gestion de l'affichage/masquage des filtres avancés
  const toggleAdvancedFilters = useCallback(() => {
    setShowAdvanced(prev => !prev);
  }, []);

  // Styles communs pour les papers
  const paperStyle = {
    p: isMobile ? 1.5 : 2, 
    mb: isMobile ? 2 : 3,
    borderRadius: '8px'
  };

  return (
    <>
      {/* Champ de recherche */}
      <Paper 
        elevation={2} 
        sx={paperStyle}
        aria-label="Recherche de cols"
      >
        <TextField
          fullWidth
          placeholder="Rechercher un col..."
          value={searchTerm}
          onChange={handleSearchChange}
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
                  onClick={() => onSearchChange('')}
                  edge="end"
                  aria-label="Effacer la recherche"
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
          variant="outlined"
          size={isMobile ? "small" : "medium"}
          aria-label="Rechercher par nom ou région"
        />
      </Paper>
      
      {/* Section de filtres */}
      <Paper 
        elevation={2} 
        sx={paperStyle}
        aria-label="Filtres des cols"
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={isMobile ? 1 : 2}>
          <Box display="flex" alignItems="center">
            <FilterIcon sx={{ 
              verticalAlign: 'middle', 
              mr: 1,
              fontSize: isMobile ? '1.2rem' : '1.5rem'
            }} />
            <Typography variant={isMobile ? "subtitle1" : "h6"} component="h2">
              Filtres
            </Typography>
            {hasActiveFilters && (
              <Chip 
                size="small" 
                color="primary" 
                label="Actifs" 
                sx={{ ml: 1 }}
                aria-label="Filtres actifs"
              />
            )}
          </Box>
          <Button 
            size="small" 
            onClick={handleResetFilters}
            startIcon={<ClearIcon />}
            aria-label="Réinitialiser tous les filtres"
            disabled={!hasActiveFilters}
          >
            {isMobile ? 'Reset' : 'Réinitialiser'}
          </Button>
        </Box>
        
        <Divider sx={{ mb: isMobile ? 1.5 : 2 }} />
        
        <Stack spacing={isMobile ? 2 : 3}>
          <FormControl fullWidth size={isMobile ? "small" : "medium"}>
            <InputLabel id="region-label">Région</InputLabel>
            <Select
              labelId="region-label"
              value={filterRegion}
              label="Région"
              onChange={handleRegionChange}
              aria-label="Filtrer par région"
            >
              <MenuItem value="">Toutes les régions</MenuItem>
              {regions.map(region => (
                <MenuItem key={region} value={region}>{region}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth size={isMobile ? "small" : "medium"}>
            <InputLabel id="difficulty-label">Difficulté</InputLabel>
            <Select
              labelId="difficulty-label"
              value={filterDifficulty}
              label="Difficulté"
              onChange={handleDifficultyChange}
              aria-label="Filtrer par difficulté"
            >
              <MenuItem value="">Toutes les difficultés</MenuItem>
              {difficulties.map(difficulty => (
                <MenuItem key={difficulty} value={difficulty}>{difficulty}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box>
            <Box display="flex" alignItems="center">
              <Typography gutterBottom variant={isMobile ? "body2" : "body1"}>
                Altitude (m)
              </Typography>
              <Tooltip title="Filtrer les cols par plage d'altitude">
                <IconButton size="small" sx={{ ml: 0.5 }} aria-label="Info sur l'altitude">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Slider
              value={filterElevation}
              onChange={handleElevationChange}
              valueLabelDisplay="auto"
              min={0}
              max={3000}
              step={100}
              aria-label="Filtrer par altitude"
              size={isMobile ? "small" : "medium"}
            />
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {filterElevation[0]} m
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filterElevation[1]} m
              </Typography>
            </Box>
          </Box>
          
          {/* Bouton pour afficher/masquer les filtres avancés */}
          <Button
            variant="text"
            color="primary"
            onClick={toggleAdvancedFilters}
            endIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandIcon />}
            sx={{ alignSelf: 'flex-start' }}
            aria-expanded={showAdvanced}
            aria-controls="advanced-filters"
          >
            {isMobile 
              ? (showAdvanced ? 'Masquer avancés' : 'Filtres avancés')
              : (showAdvanced ? 'Masquer les filtres avancés' : 'Afficher les filtres avancés')
            }
          </Button>
          
          {/* Filtres avancés */}
          {showAdvanced && (
            <Box mt={2} id="advanced-filters" role="region" aria-label="Filtres avancés">
              <Divider sx={{ mb: isMobile ? 1.5 : 2 }} />
              <Stack spacing={isMobile ? 2 : 3}>
                <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                  <InputLabel id="category-label">Catégorie</InputLabel>
                  <Select
                    labelId="category-label"
                    value=""
                    label="Catégorie"
                    aria-label="Filtrer par catégorie"
                  >
                    <MenuItem value="">Toutes les catégories</MenuItem>
                    <MenuItem value="HC">Hors Catégorie</MenuItem>
                    <MenuItem value="1">Catégorie 1</MenuItem>
                    <MenuItem value="2">Catégorie 2</MenuItem>
                    <MenuItem value="3">Catégorie 3</MenuItem>
                    <MenuItem value="4">Catégorie 4</MenuItem>
                  </Select>
                </FormControl>
                
                <Box>
                  <Typography gutterBottom variant={isMobile ? "body2" : "body1"}>
                    Longueur (km)
                  </Typography>
                  <Slider
                    value={[0, 30]}
                    valueLabelDisplay="auto"
                    min={0}
                    max={30}
                    step={1}
                    size={isMobile ? "small" : "medium"}
                    aria-label="Filtrer par longueur"
                  />
                </Box>
                
                <Box>
                  <Typography gutterBottom variant={isMobile ? "body2" : "body1"}>
                    Pente moyenne (%)
                  </Typography>
                  <Slider
                    value={[0, 15]}
                    valueLabelDisplay="auto"
                    min={0}
                    max={15}
                    step={0.5}
                    size={isMobile ? "small" : "medium"}
                    aria-label="Filtrer par pente moyenne"
                  />
                </Box>

                {/* Nouveau filtre: Type de surface */}
                <Box>
                  <Typography 
                    gutterBottom 
                    variant={isMobile ? "body2" : "body1"}
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    <TerrainIcon sx={{ mr: 1, fontSize: isMobile ? '1rem' : '1.25rem' }} />
                    Type de surface
                  </Typography>
                  <FormGroup row>
                    {surfaces.map(surface => (
                      <FormControlLabel
                        key={surface}
                        control={
                          <Checkbox 
                            checked={filterSurface.includes(surface)}
                            onChange={() => handleSurfaceChange(surface)}
                            size={isMobile ? "small" : "medium"}
                          />
                        }
                        label={surface}
                      />
                    ))}
                  </FormGroup>
                </Box>

                {/* Nouveau filtre: Difficulté technique */}
                <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                  <InputLabel id="technical-difficulty-label">Difficulté technique</InputLabel>
                  <Select
                    labelId="technical-difficulty-label"
                    value={filterTechnicalDifficulty}
                    onChange={handleTechnicalDifficultyChange}
                    label="Difficulté technique"
                    aria-label="Filtrer par difficulté technique"
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    {technicalDifficulties.map(diff => (
                      <MenuItem key={diff} value={diff}>
                        {diff === '1' ? '1 - Facile' : 
                         diff === '2' ? '2 - Simple' :
                         diff === '3' ? '3 - Modérée' :
                         diff === '4' ? '4 - Difficile' :
                         '5 - Très difficile'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Nouveau filtre: Saisons recommandées */}
                <Box>
                  <Typography 
                    gutterBottom 
                    variant={isMobile ? "body2" : "body1"}
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    <CalendarIcon sx={{ mr: 1, fontSize: isMobile ? '1rem' : '1.25rem' }} />
                    Saisons recommandées
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {seasons.map(season => (
                      <Chip
                        key={season}
                        label={season}
                        onClick={() => handleSeasonChange(season)}
                        color={filterSeasons.includes(season) ? "primary" : "default"}
                        variant={filterSeasons.includes(season) ? "filled" : "outlined"}
                        size={isMobile ? "small" : "medium"}
                        icon={season === 'Été' ? <SunnyIcon /> : undefined}
                      />
                    ))}
                  </Box>
                </Box>
              </Stack>
            </Box>
          )}
        </Stack>
      </Paper>
    </>
  );
});

ColFilters.propTypes = {
  // État des filtres
  searchTerm: PropTypes.string.isRequired,
  filterRegion: PropTypes.string.isRequired,
  filterDifficulty: PropTypes.string.isRequired,
  filterElevation: PropTypes.arrayOf(PropTypes.number).isRequired,
  filtersOpen: PropTypes.bool.isRequired,
  filterSurface: PropTypes.arrayOf(PropTypes.string),
  filterTechnicalDifficulty: PropTypes.string,
  filterSeasons: PropTypes.arrayOf(PropTypes.string),
  
  // Fonctions de callback
  onSearchChange: PropTypes.func.isRequired,
  onRegionChange: PropTypes.func.isRequired,
  onDifficultyChange: PropTypes.func.isRequired,
  onElevationChange: PropTypes.func.isRequired,
  onFiltersOpenChange: PropTypes.func.isRequired,
  onResetFilters: PropTypes.func.isRequired,
  onSurfaceChange: PropTypes.func,
  onTechnicalDifficultyChange: PropTypes.func,
  onSeasonsChange: PropTypes.func,
  
  // Option pour le mode mobile
  isMobile: PropTypes.bool
};

export default ColFilters;
