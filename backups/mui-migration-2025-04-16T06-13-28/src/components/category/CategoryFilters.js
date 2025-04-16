/**
 * Système de filtres avancés pour les pages de catégorie
 * 
 * Ce composant implémente des filtres optimisés pour chaque type de contenu :
 * - Cols : altitude, difficulté, longueur, gradient, région
 * - Entraînement : niveau, durée, objectif
 * - Nutrition : type, temps de préparation, timing (avant/pendant/après)
 * - Défis : difficulté, nombre de cols, distance, dénivelé
 */

import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Chip,
  TextField,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  useMediaQuery
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FilterListIcon from '@material-ui/icons/FilterList';
import SearchIcon from '@material-ui/icons/Search';
import { makeStyles, useTheme } from '@material-ui/core/styles';

// Styles pour le composant
const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  filterTitle: {
    marginBottom: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    '& svg': {
      marginRight: theme.spacing(1),
    },
  },
  filtersGrid: {
    marginBottom: theme.spacing(2),
  },
  filterItem: {
    marginBottom: theme.spacing(3),
  },
  activeFilters: {
    display: 'flex',
    flexWrap: 'wrap',
    padding: theme.spacing(2, 0),
    '& > *': {
      margin: theme.spacing(0.5),
    },
  },
  sortContainer: {
    marginLeft: 'auto',
    minWidth: 150,
  },
  controlsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(2),
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  accordionRoot: {
    boxShadow: 'none',
    '&:before': {
      display: 'none',
    },
    border: `1px solid ${theme.palette.divider}`,
  },
  accordionSummary: {
    backgroundColor: theme.palette.grey[50],
  },
  sliderContainer: {
    padding: theme.spacing(0, 2),
    marginTop: theme.spacing(2),
  },
  mobileFiltersButton: {
    marginBottom: theme.spacing(2),
  },
  searchField: {
    marginBottom: theme.spacing(2),
  },
  multiSelectGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    '& > *': {
      margin: theme.spacing(0.5),
    },
  },
}));

/**
 * Composant principal de filtres
 */
const CategoryFilters = ({
  category,
  filters = [],
  activeFilters = {},
  onFilterChange,
  onSortChange,
  currentSort = 'featured',
  sortOptions = [],
  language = 'fr'
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // État local pour les filtres
  const [localFilters, setLocalFilters] = useState(activeFilters);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [tempRangeValues, setTempRangeValues] = useState({});
  
  // Synchroniser les filtres actifs avec l'état local
  useEffect(() => {
    setLocalFilters(activeFilters);
  }, [activeFilters]);
  
  // Gestionnaires d'événements
  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...localFilters,
      [key]: value
    };
    
    // Si la valeur est vide, supprimer le filtre
    if (value === '' || (Array.isArray(value) && value.length === 0)) {
      delete newFilters[key];
    }
    
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const handleSliderChange = (key, value) => {
    setTempRangeValues({
      ...tempRangeValues,
      [key]: value
    });
  };
  
  const handleSliderChangeCommitted = (key, min, max) => {
    const minKey = `${key}_min`;
    const maxKey = `${key}_max`;
    
    const newFilters = { ...localFilters };
    
    // Ajouter ou mettre à jour les valeurs min/max
    if (tempRangeValues[key]) {
      const [minValue, maxValue] = tempRangeValues[key];
      
      // Ajouter uniquement si différent des valeurs par défaut
      if (minValue > min) {
        newFilters[minKey] = minValue;
      } else {
        delete newFilters[minKey];
      }
      
      if (maxValue < max) {
        newFilters[maxKey] = maxValue;
      } else {
        delete newFilters[maxKey];
      }
    }
    
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const handleMultiSelectToggle = (key, value) => {
    const currentValues = localFilters[key] || [];
    let newValues;
    
    if (currentValues.includes(value)) {
      newValues = currentValues.filter(v => v !== value);
    } else {
      newValues = [...currentValues, value];
    }
    
    handleFilterChange(key, newValues);
  };
  
  const handleSortChange = (event) => {
    onSortChange(event.target.value);
  };
  
  const handleResetFilters = () => {
    setLocalFilters({});
    onFilterChange({});
    setTempRangeValues({});
  };
  
  const getFilterLabel = (filter, value) => {
    // Pour les filtres à options, récupérer le label correspondant
    if (filter.options) {
      const option = filter.options.find(opt => opt.value === value);
      return option?.label[language] || value;
    }
    
    // Pour les filtres numériques simples
    return value;
  };
  
  // Générer des chips pour les filtres actifs
  const renderActiveFilters = () => {
    if (Object.keys(localFilters).length === 0) return null;
    
    return (
      <Box className={classes.activeFilters}>
        {Object.entries(localFilters).map(([key, value]) => {
          // Trouver la définition du filtre
          const filter = filters.find(f => f.key === key || key.startsWith(`${f.key}_`));
          if (!filter) return null;
          
          const filterName = filter.label[language];
          
          // Filtres de plage (min/max)
          if (key.endsWith('_min')) {
            const baseKey = key.replace('_min', '');
            const filterObj = filters.find(f => f.key === baseKey);
            return (
              <Chip
                key={key}
                label={`${filterObj?.label[language] || baseKey} ≥ ${value}`}
                onDelete={() => {
                  const newFilters = { ...localFilters };
                  delete newFilters[key];
                  setLocalFilters(newFilters);
                  onFilterChange(newFilters);
                }}
                color="primary"
                variant="outlined"
                className={classes.chip}
              />
            );
          } else if (key.endsWith('_max')) {
            const baseKey = key.replace('_max', '');
            const filterObj = filters.find(f => f.key === baseKey);
            return (
              <Chip
                key={key}
                label={`${filterObj?.label[language] || baseKey} ≤ ${value}`}
                onDelete={() => {
                  const newFilters = { ...localFilters };
                  delete newFilters[key];
                  setLocalFilters(newFilters);
                  onFilterChange(newFilters);
                }}
                color="primary"
                variant="outlined"
                className={classes.chip}
              />
            );
          } 
          // Filtres multi-sélection
          else if (Array.isArray(value)) {
            return value.map(v => (
              <Chip
                key={`${key}-${v}`}
                label={`${filterName}: ${getFilterLabel(filter, v)}`}
                onDelete={() => {
                  handleMultiSelectToggle(key, v);
                }}
                color="primary"
                variant="outlined"
                className={classes.chip}
              />
            ));
          } 
          // Filtre de recherche
          else if (key === 'search') {
            return (
              <Chip
                key={key}
                label={`Recherche: ${value}`}
                onDelete={() => {
                  const newFilters = { ...localFilters };
                  delete newFilters[key];
                  setLocalFilters(newFilters);
                  onFilterChange(newFilters);
                }}
                color="primary"
                variant="outlined"
                className={classes.chip}
              />
            );
          } 
          // Filtres simples
          else {
            return (
              <Chip
                key={key}
                label={`${filterName}: ${getFilterLabel(filter, value)}`}
                onDelete={() => {
                  const newFilters = { ...localFilters };
                  delete newFilters[key];
                  setLocalFilters(newFilters);
                  onFilterChange(newFilters);
                }}
                color="primary"
                variant="outlined"
                className={classes.chip}
              />
            );
          }
        })}
        <Button 
          size="small" 
          onClick={handleResetFilters}
          variant="text"
        >
          Réinitialiser
        </Button>
      </Box>
    );
  };
  
  // Rendu des différents types de filtres
  const renderFilter = (filter) => {
    switch (filter.type) {
      case 'search':
        return (
          <TextField
            key={filter.key}
            label={filter.label[language]}
            variant="outlined"
            size="small"
            fullWidth
            value={localFilters[filter.key] || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="action" />,
            }}
            className={classes.searchField}
          />
        );
      
      case 'select':
        return (
          <FormControl 
            key={filter.key} 
            variant="outlined" 
            size="small"
            fullWidth
            className={classes.filterItem}
          >
            <InputLabel id={`filter-${filter.key}-label`}>
              {filter.label[language]}
            </InputLabel>
            <Select
              labelId={`filter-${filter.key}-label`}
              id={`filter-${filter.key}`}
              value={localFilters[filter.key] || ''}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              label={filter.label[language]}
            >
              <MenuItem value="">
                <em>Tous</em>
              </MenuItem>
              {filter.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label[language]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      
      case 'range':
        // Déterminer les valeurs actuelles
        const minKey = `${filter.key}_min`;
        const maxKey = `${filter.key}_max`;
        const currentValue = tempRangeValues[filter.key] || [
          localFilters[minKey] || filter.min,
          localFilters[maxKey] || filter.max
        ];
        
        return (
          <div key={filter.key} className={classes.filterItem}>
            <Typography id={`${filter.key}-slider-label`} gutterBottom>
              {filter.label[language]}
            </Typography>
            <div className={classes.sliderContainer}>
              <Slider
                value={currentValue}
                onChange={(e, newValue) => handleSliderChange(filter.key, newValue)}
                onChangeCommitted={(e, newValue) => 
                  handleSliderChangeCommitted(filter.key, filter.min, filter.max)
                }
                valueLabelDisplay="auto"
                min={filter.min}
                max={filter.max}
                step={filter.step || 1}
                marks={filter.marks}
                aria-labelledby={`${filter.key}-slider-label`}
                valueLabelFormat={(value) => 
                  `${value}${filter.unit ? ` ${filter.unit}` : ''}`
                }
              />
              <Box display="flex" justifyContent="space-between" mt={1}>
                <Typography variant="caption">
                  {filter.min}{filter.unit ? ` ${filter.unit}` : ''}
                </Typography>
                <Typography variant="caption">
                  {filter.max}{filter.unit ? ` ${filter.unit}` : ''}
                </Typography>
              </Box>
            </div>
          </div>
        );
      
      case 'multiSelect':
        return (
          <div key={filter.key} className={classes.filterItem}>
            <Typography gutterBottom>
              {filter.label[language]}
            </Typography>
            <div className={classes.multiSelectGrid}>
              {filter.options.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label[language]}
                  onClick={() => handleMultiSelectToggle(filter.key, option.value)}
                  color={(localFilters[filter.key] || []).includes(option.value) 
                    ? "primary" 
                    : "default"
                  }
                  className={classes.chip}
                />
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  // Version mobile des filtres (accordéon)
  const renderMobileFilters = () => {
    return (
      <>
        <Button
          className={classes.mobileFiltersButton}
          variant="outlined"
          color="primary"
          startIcon={<FilterListIcon />}
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          fullWidth
        >
          {Object.keys(localFilters).length > 0 
            ? `Filtres (${Object.keys(localFilters).length})` 
            : 'Filtres'
          }
        </Button>
        
        <Accordion 
          expanded={mobileFiltersOpen} 
          onChange={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className={classes.accordionRoot}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            className={classes.accordionSummary}
          >
            <Typography variant="subtitle1">Affiner les résultats</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <div style={{ width: '100%' }}>
              {filters.map(filter => renderFilter(filter))}
            </div>
          </AccordionDetails>
        </Accordion>
      </>
    );
  };
  
  // Version desktop des filtres
  const renderDesktopFilters = () => {
    return (
      <Paper className={classes.root} elevation={1}>
        <Typography variant="h6" className={classes.filterTitle}>
          <FilterListIcon />
          Filtrer les résultats
        </Typography>
        
        <Grid container spacing={3} className={classes.filtersGrid}>
          {filters.map(filter => (
            <Grid item xs={12} md={filter.type === 'search' ? 12 : 6} lg={4} key={filter.key}>
              {renderFilter(filter)}
            </Grid>
          ))}
        </Grid>
        
        <Divider />
        
        <div className={classes.controlsContainer}>
          {renderActiveFilters()}
          
          {sortOptions.length > 0 && (
            <FormControl 
              variant="outlined" 
              size="small"
              className={classes.sortContainer}
            >
              <InputLabel id="sort-select-label">Trier par</InputLabel>
              <Select
                labelId="sort-select-label"
                id="sort-select"
                value={currentSort}
                onChange={handleSortChange}
                label="Trier par"
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label[language]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </div>
      </Paper>
    );
  };
  
  return (
    <div>
      {isMobile ? renderMobileFilters() : renderDesktopFilters()}
      
      {/* Afficher les filtres actifs en version mobile */}
      {isMobile && renderActiveFilters()}
    </div>
  );
};

export default CategoryFilters;
