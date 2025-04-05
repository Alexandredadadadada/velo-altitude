/**
 * GroupRideFilters.js
 * Composant de filtrage pour les sorties de groupe
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Button,
  Slider,
  Typography,
  Divider,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterAlt as FilterIcon,
  RestartAlt as ResetIcon
} from '@mui/icons-material';

// Constantes pour les options de filtre
const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
  { value: 'expert', label: 'Expert' }
];

const TERRAIN_OPTIONS = [
  { value: 'flat', label: 'Plat' },
  { value: 'hilly', label: 'Vallonné' },
  { value: 'mountain', label: 'Montagneux' },
  { value: 'mixed', label: 'Mixte' }
];

const REGION_OPTIONS = [
  { value: 'Alsace', label: 'Alsace' },
  { value: 'Lorraine', label: 'Lorraine' },
  { value: 'Champagne-Ardenne', label: 'Champagne-Ardenne' },
  { value: 'Vosges', label: 'Vosges' },
  { value: 'Forêt-Noire', label: 'Forêt-Noire' },
  { value: 'Jura', label: 'Jura' },
  { value: 'Ardennes', label: 'Ardennes' }
];

/**
 * Composant de filtres pour les sorties de groupe
 */
const GroupRideFilters = ({ filters, onApplyFilters, onResetFilters }) => {
  const { t } = useTranslation();
  const [localFilters, setLocalFilters] = useState(filters);
  const [speedRange, setSpeedRange] = useState([
    filters.minSpeed !== '' ? Number(filters.minSpeed) : 15,
    filters.maxSpeed !== '' ? Number(filters.maxSpeed) : 35
  ]);

  // Gérer les changements de valeur des filtres
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters({
      ...localFilters,
      [name]: value
    });
  };

  // Gérer les changements de plage de vitesse
  const handleSpeedRangeChange = (event, newValue) => {
    setSpeedRange(newValue);
    setLocalFilters({
      ...localFilters,
      minSpeed: newValue[0],
      maxSpeed: newValue[1]
    });
  };

  // Appliquer les filtres
  const handleApplyFilters = () => {
    onApplyFilters({
      ...localFilters,
      minSpeed: speedRange[0],
      maxSpeed: speedRange[1]
    });
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    const resetFilters = {
      region: '',
      levelRequired: '',
      terrainType: '',
      fromDate: new Date().toISOString().split('T')[0],
      minSpeed: '',
      maxSpeed: '',
      search: ''
    };
    setLocalFilters(resetFilters);
    setSpeedRange([15, 35]);
    onResetFilters();
  };

  return (
    <div className="group-ride-filters">
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              name="search"
              label={t('search')}
              variant="outlined"
              fullWidth
              size="small"
              value={localFilters.search}
              onChange={handleFilterChange}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              name="fromDate"
              label={t('dateFrom')}
              type="date"
              fullWidth
              size="small"
              value={localFilters.fromDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('region')}</InputLabel>
              <Select
                name="region"
                value={localFilters.region}
                onChange={handleFilterChange}
                label={t('region')}
              >
                <MenuItem value="">{t('allRegions')}</MenuItem>
                {REGION_OPTIONS.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>{t('levelRequired')}</InputLabel>
            <Select
              name="levelRequired"
              value={localFilters.levelRequired}
              onChange={handleFilterChange}
              label={t('levelRequired')}
            >
              <MenuItem value="">{t('allLevels')}</MenuItem>
              {LEVEL_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>{t('terrainType')}</InputLabel>
            <Select
              name="terrainType"
              value={localFilters.terrainType}
              onChange={handleFilterChange}
              label={t('terrainType')}
            >
              <MenuItem value="">{t('allTerrains')}</MenuItem>
              {TERRAIN_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box sx={{ px: 1 }}>
            <Typography variant="body2" gutterBottom>
              {t('averageSpeed')}: {speedRange[0]} - {speedRange[1]} km/h
            </Typography>
            <Slider
              value={speedRange}
              onChange={handleSpeedRangeChange}
              min={10}
              max={45}
              step={1}
              size="small"
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value} km/h`}
            />
          </Box>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleResetFilters}
          startIcon={<ResetIcon />}
          sx={{ mr: 1 }}
        >
          {t('reset')}
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleApplyFilters}
          startIcon={<FilterIcon />}
        >
          {t('applyFilters')}
        </Button>
      </Box>
      
      {/* Indicateurs de filtres actifs */}
      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {Object.entries(localFilters).map(([key, value]) => {
          if (!value || (key === 'fromDate' && value === new Date().toISOString().split('T')[0])) return null;
          
          let label = '';
          
          if (key === 'region') {
            const region = REGION_OPTIONS.find(r => r.value === value);
            label = region ? region.label : value;
          } else if (key === 'levelRequired') {
            const level = LEVEL_OPTIONS.find(l => l.value === value);
            label = level ? level.label : value;
          } else if (key === 'terrainType') {
            const terrain = TERRAIN_OPTIONS.find(t => t.value === value);
            label = terrain ? terrain.label : value;
          } else if (key === 'minSpeed' || key === 'maxSpeed') {
            return null; // Géré par la plage de vitesse
          } else if (key === 'search') {
            label = `"${value}"`;
          } else if (key === 'fromDate') {
            const date = new Date(value);
            label = date.toLocaleDateString();
          }
          
          if (!label) return null;
          
          return (
            <Chip
              key={key}
              label={`${t(key)}: ${label}`}
              onDelete={() => {
                const newFilters = { ...localFilters };
                if (key === 'fromDate') {
                  newFilters[key] = new Date().toISOString().split('T')[0];
                } else {
                  newFilters[key] = '';
                }
                setLocalFilters(newFilters);
              }}
              size="small"
              color="primary"
              variant="outlined"
            />
          );
        })}
      </Box>
    </div>
  );
};

GroupRideFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  onApplyFilters: PropTypes.func.isRequired,
  onResetFilters: PropTypes.func.isRequired
};

export default GroupRideFilters;
