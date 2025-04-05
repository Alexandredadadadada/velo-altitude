import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  Stack
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Public as GlobeIcon,
  Terrain as TerrainIcon,
  RouteOutlined as RouteIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

/**
 * Composant pour la recherche et le filtrage des cols
 */
const ColSearchTab = ({ 
  cols, 
  loading, 
  filters, 
  onFilterChange, 
  onResetFilters,
  onSelectCol,
  onViewDetails,
  selectedColsIds
}) => {
  const { t } = useTranslation();
  const [filteredResults, setFilteredResults] = useState([]);
  
  // Mémoriser les pays et régions uniques pour les filtres
  const uniqueCountries = useMemo(() => {
    // Vérifier que les cols ont la propriété location et country
    const countries = [...new Set(cols
      .filter(col => col.location && col.location.country)
      .map(col => col.location.country))];
    return countries.sort();
  }, [cols]);
  
  const uniqueRegions = useMemo(() => {
    // Vérifier que les cols ont la propriété location et region
    const regions = [...new Set(cols
      .filter(col => col.location && col.location.region)
      .map(col => col.location.region))];
    return regions.sort();
  }, [cols]);
  
  // Appliquer les filtres aux cols
  useEffect(() => {
    let results = [...cols];
    
    // Filtrer par région
    if (filters.region) {
      results = results.filter(col => 
        col.location && col.location.region === filters.region
      );
    }
    
    // Filtrer par pays
    if (filters.country) {
      results = results.filter(col => 
        col.location && col.location.country === filters.country
      );
    }
    
    // Filtrer par altitude minimale
    if (filters.minAltitude) {
      results = results.filter(col => col.elevation >= parseInt(filters.minAltitude));
    }
    
    // Filtrer par altitude maximale
    if (filters.maxAltitude) {
      results = results.filter(col => col.elevation <= parseInt(filters.maxAltitude));
    }
    
    // Filtrer par difficulté
    if (filters.difficulty) {
      results = results.filter(col => col.difficulty === filters.difficulty);
    }
    
    // Filtrer par recherche textuelle
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      results = results.filter(col => 
        col.name.toLowerCase().includes(query) || 
        (col.location && col.location.region && col.location.region.toLowerCase().includes(query)) ||
        (col.location && col.location.country && col.location.country.toLowerCase().includes(query))
      );
    }
    
    setFilteredResults(results);
  }, [cols, filters]);
  
  // Fonction pour créer le composant de carte du col
  const renderColCard = (col) => {
    const isSelected = selectedColsIds.includes(col.id);
    
    return (
      <Card elevation={3} key={col.id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardMedia
          component="img"
          height="140"
          image={col.imageUrl || '/images/cols/default-col.jpg'}
          alt={col.name}
          sx={{ objectFit: 'cover' }}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6" gutterBottom component="div" noWrap>
            {col.name}
          </Typography>
          
          {col.location && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <GlobeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" noWrap>
                {col.location.region && col.location.country 
                  ? `${col.location.region}, ${col.location.country}`
                  : col.location.region || col.location.country || t('common.unknown', 'Inconnu')}
              </Typography>
            </Box>
          )}
          
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TerrainIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {col.elevation}m
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <RouteIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {col.distance}km
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SpeedIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {col.avgGradient}%
              </Typography>
            </Box>
          </Stack>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            <Chip 
              size="small" 
              label={`${t('cols.difficulty', 'Difficulté')}: ${col.difficulty}`} 
              color={
                col.difficulty === 'extreme' ? 'error' :
                col.difficulty === 'hard' ? 'warning' :
                col.difficulty === 'medium' ? 'info' :
                'success'
              }
            />
            
            <Chip
              size="small"
              label={`${t('cols.elevation', 'Dénivelé')}: ${col.elevation}m`}
              variant="outlined"
            />
          </Box>
        </CardContent>
        
        <CardActions>
          <Tooltip title={t('challenges.seven_majors.view_details', 'Voir les détails')}>
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => onViewDetails(col)}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Button
            size="small"
            variant="contained"
            color={isSelected ? "success" : "primary"}
            startIcon={<AddIcon />}
            onClick={() => onSelectCol(col)}
            disabled={isSelected}
          >
            {isSelected 
              ? t('challenges.seven_majors.already_added', 'Déjà ajouté') 
              : t('challenges.seven_majors.add_to_challenge', 'Ajouter au défi')}
          </Button>
        </CardActions>
      </Card>
    );
  };
  
  return (
    <Box>
      {/* Filtres de recherche */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SearchIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                {t('challenges.seven_majors.search_cols', 'Recherche de cols')}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label={t('common.search', 'Rechercher')}
              name="searchQuery"
              value={filters.searchQuery}
              onChange={onFilterChange}
              placeholder={t('challenges.seven_majors.search_cols_placeholder', 'Rechercher par nom, région...')}
              InputProps={{
                endAdornment: <SearchIcon color="action" />
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel id="country-select-label">{t('cols.country', 'Pays')}</InputLabel>
              <Select
                labelId="country-select-label"
                name="country"
                value={filters.country}
                label={t('cols.country', 'Pays')}
                onChange={onFilterChange}
              >
                <MenuItem value="">
                  <em>{t('common.all', 'Tous')}</em>
                </MenuItem>
                {uniqueCountries.map(country => (
                  <MenuItem key={country} value={country}>{country}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel id="region-select-label">{t('cols.region', 'Région')}</InputLabel>
              <Select
                labelId="region-select-label"
                name="region"
                value={filters.region}
                label={t('cols.region', 'Région')}
                onChange={onFilterChange}
              >
                <MenuItem value="">
                  <em>{t('common.all', 'Tous')}</em>
                </MenuItem>
                {uniqueRegions.map(region => (
                  <MenuItem key={region} value={region}>{region}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel id="difficulty-select-label">{t('cols.difficulty', 'Difficulté')}</InputLabel>
              <Select
                labelId="difficulty-select-label"
                name="difficulty"
                value={filters.difficulty}
                label={t('cols.difficulty', 'Difficulté')}
                onChange={onFilterChange}
              >
                <MenuItem value="">
                  <em>{t('common.all', 'Tous')}</em>
                </MenuItem>
                <MenuItem value="extreme">Extrême</MenuItem>
                <MenuItem value="hard">Difficile</MenuItem>
                <MenuItem value="medium">Moyen</MenuItem>
                <MenuItem value="easy">Facile</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4} md={2}>
            <TextField
              fullWidth
              type="number"
              label={t('cols.min_altitude', 'Altitude min')}
              name="minAltitude"
              value={filters.minAltitude}
              onChange={onFilterChange}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4} md={2}>
            <TextField
              fullWidth
              type="number"
              label={t('cols.max_altitude', 'Altitude max')}
              name="maxAltitude"
              value={filters.maxAltitude}
              onChange={onFilterChange}
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4} md="auto">
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              startIcon={<FilterIcon />}
              onClick={onResetFilters}
            >
              {t('common.reset_filters', 'Réinitialiser')}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Résultats de recherche */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredResults.length > 0 ? (
        <Grid container spacing={3}>
          {filteredResults.map(col => (
            <Grid item key={col.id} xs={12} sm={6} md={4} lg={3}>
              {renderColCard(col)}
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info" sx={{ mt: 2 }}>
          {t('challenges.seven_majors.no_results', 'Aucun résultat trouvé')}
        </Alert>
      )}
    </Box>
  );
};

export default ColSearchTab;
