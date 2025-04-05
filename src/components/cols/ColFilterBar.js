import React from 'react';
import {
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Slider,
  Typography,
  Box,
  Chip,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  FilterList,
  Clear,
  TrendingUp,
  Straighten,
  Landscape
} from '@mui/icons-material';
import './ColFilterBar.css';

const regions = [
  { value: 'all', label: 'Toutes les régions' },
  { value: 'alpes', label: 'Alpes' },
  { value: 'pyrenees', label: 'Pyrénées' },
  { value: 'vosges', label: 'Vosges' },
  { value: 'jura', label: 'Jura' },
  { value: 'massif-central', label: 'Massif Central' },
  { value: 'dolomites', label: 'Dolomites' },
  { value: 'alps-switzerland', label: 'Alpes Suisses' }
];

const difficulties = [
  { value: 'all', label: 'Toutes les difficultés' },
  { value: 'easy', label: 'Facile' },
  { value: 'medium', label: 'Moyen' },
  { value: 'hard', label: 'Difficile' },
  { value: 'extreme', label: 'Extrême' }
];

const ColFilterBar = ({ filters, setFilters, resetFilters, colsCount }) => {
  const handleChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRangeChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderActiveFilters = () => {
    const activeFilters = [];

    if (filters.region !== 'all') {
      const regionLabel = regions.find(r => r.value === filters.region)?.label;
      activeFilters.push({ key: 'region', label: `Région: ${regionLabel}` });
    }

    if (filters.difficulty !== 'all') {
      const difficultyLabel = difficulties.find(d => d.value === filters.difficulty)?.label;
      activeFilters.push({ key: 'difficulty', label: `Difficulté: ${difficultyLabel}` });
    }

    if (filters.altitude[0] > 0 || filters.altitude[1] < 3500) {
      activeFilters.push({ key: 'altitude', label: `Altitude: ${filters.altitude[0]}m - ${filters.altitude[1]}m` });
    }

    if (filters.length[0] > 0 || filters.length[1] < 30) {
      activeFilters.push({ key: 'length', label: `Longueur: ${filters.length[0]}km - ${filters.length[1]}km` });
    }

    if (filters.gradient[0] > 0 || filters.gradient[1] < 15) {
      activeFilters.push({ key: 'gradient', label: `Pente moyenne: ${filters.gradient[0]}% - ${filters.gradient[1]}%` });
    }

    if (filters.withWeatherOnly) {
      activeFilters.push({ key: 'withWeatherOnly', label: 'Avec données météo uniquement' });
    }

    return activeFilters;
  };

  const handleRemoveFilter = (key) => {
    if (key === 'altitude') {
      setFilters(prev => ({ ...prev, altitude: [0, 3500] }));
    } else if (key === 'length') {
      setFilters(prev => ({ ...prev, length: [0, 30] }));
    } else if (key === 'gradient') {
      setFilters(prev => ({ ...prev, gradient: [0, 15] }));
    } else if (key === 'withWeatherOnly') {
      setFilters(prev => ({ ...prev, withWeatherOnly: false }));
    } else {
      setFilters(prev => ({ ...prev, [key]: 'all' }));
    }
  };

  return (
    <div className="col-filter-bar">
      <Paper elevation={2} className="filter-paper">
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" component="h2">
            <FilterList sx={{ verticalAlign: 'middle', mr: 1 }} />
            Filtrer les cols
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<Clear />}
            onClick={resetFilters}
            size="small"
          >
            Réinitialiser
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="region-select-label">Région</InputLabel>
              <Select
                labelId="region-select-label"
                value={filters.region}
                label="Région"
                onChange={(e) => handleChange('region', e.target.value)}
              >
                {regions.map((region) => (
                  <MenuItem key={region.value} value={region.value}>
                    {region.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="difficulty-select-label">Difficulté</InputLabel>
              <Select
                labelId="difficulty-select-label"
                value={filters.difficulty}
                label="Difficulté"
                onChange={(e) => handleChange('difficulty', e.target.value)}
              >
                {difficulties.map((difficulty) => (
                  <MenuItem key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ width: '100%' }}>
              <Typography variant="body2" gutterBottom display="flex" alignItems="center">
                <Landscape fontSize="small" sx={{ mr: 1 }} />
                Altitude (m)
              </Typography>
              <Slider
                value={filters.altitude}
                onChange={(e, newValue) => handleRangeChange('altitude', newValue)}
                valueLabelDisplay="auto"
                min={0}
                max={3500}
                step={100}
              />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">{filters.altitude[0]}m</Typography>
                <Typography variant="caption">{filters.altitude[1]}m</Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ width: '100%' }}>
              <Typography variant="body2" gutterBottom display="flex" alignItems="center">
                <TrendingUp fontSize="small" sx={{ mr: 1 }} />
                Pente moyenne (%)
              </Typography>
              <Slider
                value={filters.gradient}
                onChange={(e, newValue) => handleRangeChange('gradient', newValue)}
                valueLabelDisplay="auto"
                min={0}
                max={15}
                step={0.5}
              />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">{filters.gradient[0]}%</Typography>
                <Typography variant="caption">{filters.gradient[1]}%</Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ width: '100%' }}>
              <Typography variant="body2" gutterBottom display="flex" alignItems="center">
                <Straighten fontSize="small" sx={{ mr: 1 }} />
                Longueur (km)
              </Typography>
              <Slider
                value={filters.length}
                onChange={(e, newValue) => handleRangeChange('length', newValue)}
                valueLabelDisplay="auto"
                min={0}
                max={30}
                step={1}
              />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">{filters.length[0]}km</Typography>
                <Typography variant="caption">{filters.length[1]}km</Typography>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={9}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.withWeatherOnly}
                    onChange={(e) => handleChange('withWeatherOnly', e.target.checked)}
                    name="withWeatherOnly"
                  />
                }
                label="Afficher uniquement les cols avec données météo"
              />
            </FormGroup>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Filtres actifs:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {colsCount} cols trouvés
            </Typography>
          </Box>

          <Box className="active-filters">
            {renderActiveFilters().map((filter) => (
              <Chip
                key={filter.key}
                label={filter.label}
                onDelete={() => handleRemoveFilter(filter.key)}
                size="small"
                className="filter-chip"
              />
            ))}
            {renderActiveFilters().length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Aucun filtre actif
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    </div>
  );
};

export default ColFilterBar;
