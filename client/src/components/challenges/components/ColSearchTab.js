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
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Public as GlobeIcon,
  Terrain as TerrainIcon
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
    const countries = [...new Set(cols.map(col => col.country))];
    return countries.sort();
  }, [cols]);
  
  const uniqueRegions = useMemo(() => {
    const regions = [...new Set(cols.map(col => col.region))];
    return regions.sort();
  }, [cols]);
  
  // Appliquer les filtres aux cols
  useEffect(() => {
    let results = [...cols];
    
    // Filtrer par région
    if (filters.region) {
      results = results.filter(col => col.region === filters.region);
    }
    
    // Filtrer par pays
    if (filters.country) {
      results = results.filter(col => col.country === filters.country);
    }
    
    // Filtrer par altitude minimale
    if (filters.minAltitude) {
      results = results.filter(col => col.altitude >= parseInt(filters.minAltitude));
    }
    
    // Filtrer par altitude maximale
    if (filters.maxAltitude) {
      results = results.filter(col => col.altitude <= parseInt(filters.maxAltitude));
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
        col.region.toLowerCase().includes(query) ||
        col.country.toLowerCase().includes(query)
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
          image={col.image || '/images/cols/placeholder.jpg'}
          alt={col.name}
          sx={{ objectFit: 'cover' }}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6" gutterBottom component="div" noWrap>
            {col.name}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <GlobeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {col.region}, {col.country}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TerrainIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {col.altitude}m • {col.length}km • {col.gradient}%
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            <Chip 
              size="small" 
              label={`${t('cols.difficulty')}: ${col.difficulty}`} 
              color={
                col.difficulty === 'HC' ? 'error' :
                col.difficulty === '1' ? 'warning' :
                col.difficulty === '2' ? 'success' :
                col.difficulty === '3' ? 'info' : 'default'
              }
            />
            
            {col.isPopular && (
              <Chip 
                size="small" 
                label={t('cols.popular')} 
                color="primary" 
              />
            )}
          </Box>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Tooltip title={t('common.view_details')}>
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => onViewDetails(col)}
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          
          <Button
            size="small"
            variant={isSelected ? "outlined" : "contained"}
            color={isSelected ? "secondary" : "primary"}
            startIcon={<AddIcon />}
            onClick={() => onSelectCol(col)}
            disabled={isSelected || selectedColsIds.length >= 7}
          >
            {isSelected ? t('challenges.seven_majors.added') : t('challenges.seven_majors.add_to_challenge')}
          </Button>
        </CardActions>
      </Card>
    );
  };
  
  return (
    <Box>
      {/* Filtres de recherche */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <TextField
              fullWidth
              label={t('challenges.search')}
              name="searchQuery"
              value={filters.searchQuery}
              onChange={onFilterChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel id="country-select-label">{t('cols.country')}</InputLabel>
              <Select
                labelId="country-select-label"
                name="country"
                value={filters.country}
                label={t('cols.country')}
                onChange={onFilterChange}
              >
                <MenuItem value="">
                  <em>{t('common.all')}</em>
                </MenuItem>
                {uniqueCountries.map(country => (
                  <MenuItem key={country} value={country}>{country}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel id="region-select-label">{t('cols.region')}</InputLabel>
              <Select
                labelId="region-select-label"
                name="region"
                value={filters.region}
                label={t('cols.region')}
                onChange={onFilterChange}
              >
                <MenuItem value="">
                  <em>{t('common.all')}</em>
                </MenuItem>
                {uniqueRegions.map(region => (
                  <MenuItem key={region} value={region}>{region}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel id="difficulty-select-label">{t('cols.difficulty')}</InputLabel>
              <Select
                labelId="difficulty-select-label"
                name="difficulty"
                value={filters.difficulty}
                label={t('cols.difficulty')}
                onChange={onFilterChange}
              >
                <MenuItem value="">
                  <em>{t('common.all')}</em>
                </MenuItem>
                <MenuItem value="HC">HC</MenuItem>
                <MenuItem value="1">1</MenuItem>
                <MenuItem value="2">2</MenuItem>
                <MenuItem value="3">3</MenuItem>
                <MenuItem value="4">4</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4} md={2}>
            <TextField
              fullWidth
              type="number"
              label={t('cols.min_altitude')}
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
              label={t('cols.max_altitude')}
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
              {t('common.reset_filters')}
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
          {t('challenges.seven_majors.no_results')}
        </Alert>
      )}
    </Box>
  );
};

export default ColSearchTab;
