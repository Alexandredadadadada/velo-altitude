import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Chip,
  Button,
  Fade,
  useTheme,
  Slider,
  Collapse,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Tooltip,
  Divider,
  IconButton,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  FilterList as FilterIcon,
  RestaurantMenu as MealIcon,
  DirectionsBike as BikeIcon,
  AccessTime as TimeIcon,
  FitnessCenter as FitnessIcon,
  LocalFireDepartment as CalorieIcon,
  Grass as VegetarianIcon,
  EmojiEvents as CompetitionIcon,
  Cake as CarbIcon,
  Healing as RecoveryIcon,
  Psychology as BrainIcon,
  Close as CloseIcon,
  Tune as TuneIcon,
  Cookie as PreferenceIcon,
  ExpandMore as ExpandMoreIcon, 
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

// Conteneur principal des filtres
const FilterContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  transition: 'all 0.3s ease',
  overflow: 'hidden',
}));

// Style pour les puces de filtres actifs
const VisualFilterChip = styled(Chip)(({ theme, selected }) => ({
  margin: theme.spacing(0.5),
  transition: 'all 0.2s ease',
  fontWeight: selected ? 600 : 400,
  boxShadow: selected ? '0 3px 10px rgba(0,0,0,0.2)' : 'none',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
  },
}));

// Conteneur pour les filtres visuels
const FilterCategoryBox = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[50],
  transition: 'all 0.3s ease',
}));

// Système de filtres visuels pour la galerie de recettes
const VisualFilterSystem = ({ 
  onFiltersChange, 
  activeFilters = {}, 
  recipeCount,
  loading = false 
}) => {
  const theme = useTheme();
  const [filters, setFilters] = useState(activeFilters);
  const [expanded, setExpanded] = useState(false);
  const [timeRange, setTimeRange] = useState([0, 120]);
  const [calorieRange, setCalorieRange] = useState([0, 1000]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Types de repas
  const mealTypes = [
    { id: 'breakfast', label: 'Petit-déjeuner', icon: <MealIcon />, color: '#FBC02D' },
    { id: 'pre-ride', label: "Avant l'effort", icon: <BikeIcon />, color: '#4CAF50' },
    { id: 'during-ride', label: "Pendant l'effort", icon: <BikeIcon />, color: '#FF9800' },
    { id: 'post-ride', label: 'Récupération', icon: <FitnessIcon />, color: '#2196F3' },
    { id: 'snack', label: 'Collation', icon: <CarbIcon />, color: '#9C27B0' }
  ];
  
  // Objectifs d'entraînement
  const trainingGoals = [
    { id: 'endurance', label: 'Endurance', icon: <BikeIcon />, color: '#26A69A' },
    { id: 'race-day', label: 'Jour de course', icon: <CompetitionIcon />, color: '#D32F2F' },
    { id: 'recovery', label: 'Récupération', icon: <RecoveryIcon />, color: '#7986CB' },
    { id: 'carb-loading', label: 'Charge glucidique', icon: <CarbIcon />, color: '#FFA000' },
    { id: 'mental-focus', label: 'Focus mental', icon: <BrainIcon />, color: '#5E35B1' }
  ];
  
  // Régimes alimentaires
  const dietaryPreferences = [
    { id: 'vegetarian', label: 'Végétarien', icon: <VegetarianIcon />, color: '#8BC34A' },
    { id: 'vegan', label: 'Végan', icon: <VegetarianIcon />, color: '#4CAF50' },
    { id: 'gluten-free', label: 'Sans gluten', icon: <PreferenceIcon />, color: '#FF7043' },
    { id: 'dairy-free', label: 'Sans lactose', icon: <PreferenceIcon />, color: '#29B6F6' },
    { id: 'high-protein', label: 'Riche en protéines', icon: <FitnessIcon />, color: '#5C6BC0' }
  ];
  
  // Temps de préparation
  const timeMarks = [
    { value: 0, label: '0 min' },
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 60, label: '1h' },
    { value: 120, label: '2h+' },
  ];
  
  // Apport calorique
  const calorieMarks = [
    { value: 0, label: '0 kcal' },
    { value: 250, label: '250' },
    { value: 500, label: '500' },
    { value: 750, label: '750' },
    { value: 1000, label: '1000+' },
  ];
  
  // Initialisation et mise à jour des filtres
  useEffect(() => {
    setFilters(activeFilters);
    
    // Si des filtres de temps sont actifs
    if (activeFilters.minTime !== undefined && activeFilters.maxTime !== undefined) {
      setTimeRange([activeFilters.minTime, activeFilters.maxTime]);
    }
    
    // Si des filtres de calories sont actifs
    if (activeFilters.minCalories !== undefined && activeFilters.maxCalories !== undefined) {
      setCalorieRange([activeFilters.minCalories, activeFilters.maxCalories]);
    }
  }, [activeFilters]);
  
  // Mise à jour des filtres
  const handleFilterChange = (category, value) => {
    // Mise à jour des filtres de type "sélection"
    if (category === 'mealType' || category === 'trainingGoal' || category === 'dietaryPreference') {
      const newFilters = { ...filters };
      
      // Si la catégorie n'existe pas encore, l'initialiser
      if (!newFilters[category]) {
        newFilters[category] = [];
      }
      
      // Ajouter ou retirer la valeur
      if (newFilters[category].includes(value)) {
        newFilters[category] = newFilters[category].filter(item => item !== value);
        // Si la liste est vide, supprimer la catégorie
        if (newFilters[category].length === 0) {
          delete newFilters[category];
        }
      } else {
        newFilters[category] = [...newFilters[category], value];
      }
      
      setFilters(newFilters);
      onFiltersChange(newFilters);
    }
  };
  
  // Mise à jour des filtres de temps
  const handleTimeRangeChange = (event, newValue) => {
    setTimeRange(newValue);
  };
  
  // Application des filtres de temps après relâchement
  const handleTimeRangeChangeCommitted = (event, newValue) => {
    const newFilters = { ...filters };
    
    // Ajout des filtres de temps
    if (newValue[0] > 0 || newValue[1] < 120) {
      newFilters.minTime = newValue[0];
      newFilters.maxTime = newValue[1];
    } else {
      // Suppression des filtres si toute la plage est sélectionnée
      delete newFilters.minTime;
      delete newFilters.maxTime;
    }
    
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };
  
  // Mise à jour des filtres de calories
  const handleCalorieRangeChange = (event, newValue) => {
    setCalorieRange(newValue);
  };
  
  // Application des filtres de calories après relâchement
  const handleCalorieRangeChangeCommitted = (event, newValue) => {
    const newFilters = { ...filters };
    
    // Ajout des filtres de calories
    if (newValue[0] > 0 || newValue[1] < 1000) {
      newFilters.minCalories = newValue[0];
      newFilters.maxCalories = newValue[1];
    } else {
      // Suppression des filtres si toute la plage est sélectionnée
      delete newFilters.minCalories;
      delete newFilters.maxCalories;
    }
    
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };
  
  // Réinitialisation de tous les filtres
  const handleResetFilters = () => {
    setFilters({});
    setTimeRange([0, 120]);
    setCalorieRange([0, 1000]);
    onFiltersChange({});
  };
  
  // Vérifier si un filtre est actif
  const isFilterActive = (category, value) => {
    return filters[category] && filters[category].includes(value);
  };
  
  // Compter le nombre de filtres actifs
  const countActiveFilters = () => {
    let count = 0;
    
    // Compter les filtres de sélection
    ['mealType', 'trainingGoal', 'dietaryPreference'].forEach(category => {
      if (filters[category]) {
        count += filters[category].length;
      }
    });
    
    // Compter les filtres de plage
    if (filters.minTime !== undefined || filters.maxTime !== undefined) count++;
    if (filters.minCalories !== undefined || filters.maxCalories !== undefined) count++;
    
    return count;
  };
  
  // Formater la plage de temps pour l'affichage
  const formatTimeRange = (range) => {
    const [min, max] = range;
    if (min === 0 && max === 120) return 'Toutes durées';
    if (max === 120) return `${min}+ min`;
    if (min === 0) return `0-${max} min`;
    return `${min}-${max} min`;
  };
  
  // Formater la plage de calories pour l'affichage
  const formatCalorieRange = (range) => {
    const [min, max] = range;
    if (min === 0 && max === 1000) return 'Toutes calories';
    if (max === 1000) return `${min}+ kcal`;
    if (min === 0) return `0-${max} kcal`;
    return `${min}-${max} kcal`;
  };
  
  // Créer une puce de filtre pour la plage de temps
  const timeRangeFilter = () => {
    if (filters.minTime === undefined && filters.maxTime === undefined) return null;
    
    return (
      <VisualFilterChip
        icon={<TimeIcon />}
        label={formatTimeRange([filters.minTime || 0, filters.maxTime || 120])}
        onDelete={() => {
          const newFilters = { ...filters };
          delete newFilters.minTime;
          delete newFilters.maxTime;
          setTimeRange([0, 120]);
          setFilters(newFilters);
          onFiltersChange(newFilters);
        }}
        color="primary"
        variant="outlined"
        selected={true}
      />
    );
  };
  
  // Créer une puce de filtre pour la plage de calories
  const calorieRangeFilter = () => {
    if (filters.minCalories === undefined && filters.maxCalories === undefined) return null;
    
    return (
      <VisualFilterChip
        icon={<CalorieIcon />}
        label={formatCalorieRange([filters.minCalories || 0, filters.maxCalories || 1000])}
        onDelete={() => {
          const newFilters = { ...filters };
          delete newFilters.minCalories;
          delete newFilters.maxCalories;
          setCalorieRange([0, 1000]);
          setFilters(newFilters);
          onFiltersChange(newFilters);
        }}
        color="primary"
        variant="outlined"
        selected={true}
      />
    );
  };
  
  return (
    <FilterContainer>
      {/* En-tête avec bouton d'expansion */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FilterIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          <Typography variant="h6">Filtres</Typography>
          {loading && <CircularProgress size={20} sx={{ ml: 2 }} />}
        </Box>
        
        <Box>
          <Button 
            variant="text" 
            color="primary"
            startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Réduire' : 'Développer'}
          </Button>
          {countActiveFilters() > 0 && (
            <Button 
              variant="text" 
              color="secondary"
              startIcon={<CloseIcon />}
              onClick={handleResetFilters}
              sx={{ ml: 1 }}
            >
              Réinitialiser
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Filtres actifs */}
      {countActiveFilters() > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Filtres actifs ({countActiveFilters()})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {/* Filtres de type repas */}
            {filters.mealType && filters.mealType.map(typeId => {
              const type = mealTypes.find(t => t.id === typeId);
              return type && (
                <VisualFilterChip
                  key={`meal-${typeId}`}
                  icon={type.icon}
                  label={type.label}
                  onDelete={() => handleFilterChange('mealType', typeId)}
                  sx={{ backgroundColor: theme.palette.mode === 'dark' ? `${type.color}33` : `${type.color}22`, 
                       color: type.color, borderColor: type.color }}
                  selected={true}
                  variant="outlined"
                />
              );
            })}
            
            {/* Filtres d'objectif d'entraînement */}
            {filters.trainingGoal && filters.trainingGoal.map(goalId => {
              const goal = trainingGoals.find(g => g.id === goalId);
              return goal && (
                <VisualFilterChip
                  key={`goal-${goalId}`}
                  icon={goal.icon}
                  label={goal.label}
                  onDelete={() => handleFilterChange('trainingGoal', goalId)}
                  sx={{ backgroundColor: theme.palette.mode === 'dark' ? `${goal.color}33` : `${goal.color}22`, 
                       color: goal.color, borderColor: goal.color }}
                  selected={true}
                  variant="outlined"
                />
              );
            })}
            
            {/* Filtres de préférence alimentaire */}
            {filters.dietaryPreference && filters.dietaryPreference.map(prefId => {
              const pref = dietaryPreferences.find(p => p.id === prefId);
              return pref && (
                <VisualFilterChip
                  key={`pref-${prefId}`}
                  icon={pref.icon}
                  label={pref.label}
                  onDelete={() => handleFilterChange('dietaryPreference', prefId)}
                  sx={{ backgroundColor: theme.palette.mode === 'dark' ? `${pref.color}33` : `${pref.color}22`, 
                       color: pref.color, borderColor: pref.color }}
                  selected={true}
                  variant="outlined"
                />
              );
            })}
            
            {/* Filtre de temps */}
            {timeRangeFilter()}
            
            {/* Filtre de calories */}
            {calorieRangeFilter()}
          </Box>
        </Box>
      )}
      
      {/* Résultats du filtre */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {loading ? 'Recherche en cours...' : `${recipeCount} recettes trouvées`}
        </Typography>
        
        <Button
          size="small"
          startIcon={<TuneIcon />}
          onClick={() => setShowAdvanced(!showAdvanced)}
          color="inherit"
        >
          {showAdvanced ? "Masquer les options avancées" : "Options avancées"}
        </Button>
      </Box>
      
      {/* Filtres détaillés - visibles uniquement en mode étendu */}
      <Collapse in={expanded} timeout={300}>
        <Box sx={{ mt: 1 }}>
          {/* Types de repas */}
          <FilterCategoryBox>
            <Typography variant="subtitle2" gutterBottom>
              Type de repas
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {mealTypes.map(type => (
                <VisualFilterChip
                  key={type.id}
                  icon={type.icon}
                  label={type.label}
                  onClick={() => handleFilterChange('mealType', type.id)}
                  sx={{ backgroundColor: isFilterActive('mealType', type.id) ? 
                       (theme.palette.mode === 'dark' ? `${type.color}33` : `${type.color}22`) : undefined,
                       color: isFilterActive('mealType', type.id) ? type.color : undefined,
                       borderColor: isFilterActive('mealType', type.id) ? type.color : undefined
                  }}
                  variant={isFilterActive('mealType', type.id) ? "outlined" : "filled"}
                  selected={isFilterActive('mealType', type.id)}
                />
              ))}
            </Box>
          </FilterCategoryBox>
          
          {/* Objectifs d'entraînement */}
          <FilterCategoryBox>
            <Typography variant="subtitle2" gutterBottom>
              Objectif d'entraînement
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {trainingGoals.map(goal => (
                <VisualFilterChip
                  key={goal.id}
                  icon={goal.icon}
                  label={goal.label}
                  onClick={() => handleFilterChange('trainingGoal', goal.id)}
                  sx={{ backgroundColor: isFilterActive('trainingGoal', goal.id) ? 
                       (theme.palette.mode === 'dark' ? `${goal.color}33` : `${goal.color}22`) : undefined,
                       color: isFilterActive('trainingGoal', goal.id) ? goal.color : undefined,
                       borderColor: isFilterActive('trainingGoal', goal.id) ? goal.color : undefined
                  }}
                  variant={isFilterActive('trainingGoal', goal.id) ? "outlined" : "filled"}
                  selected={isFilterActive('trainingGoal', goal.id)}
                />
              ))}
            </Box>
          </FilterCategoryBox>
          
          {/* Préférences alimentaires */}
          <FilterCategoryBox>
            <Typography variant="subtitle2" gutterBottom>
              Préférences alimentaires
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {dietaryPreferences.map(pref => (
                <VisualFilterChip
                  key={pref.id}
                  icon={pref.icon}
                  label={pref.label}
                  onClick={() => handleFilterChange('dietaryPreference', pref.id)}
                  sx={{ backgroundColor: isFilterActive('dietaryPreference', pref.id) ? 
                       (theme.palette.mode === 'dark' ? `${pref.color}33` : `${pref.color}22`) : undefined,
                       color: isFilterActive('dietaryPreference', pref.id) ? pref.color : undefined,
                       borderColor: isFilterActive('dietaryPreference', pref.id) ? pref.color : undefined
                  }}
                  variant={isFilterActive('dietaryPreference', pref.id) ? "outlined" : "filled"}
                  selected={isFilterActive('dietaryPreference', pref.id)}
                />
              ))}
            </Box>
          </FilterCategoryBox>
          
          {/* Temps de préparation */}
          <FilterCategoryBox>
            <Typography variant="subtitle2" gutterBottom>
              Temps de préparation
            </Typography>
            <Box sx={{ px: 2, mt: 4, mb: 2 }}>
              <Slider
                value={timeRange}
                onChange={handleTimeRangeChange}
                onChangeCommitted={handleTimeRangeChangeCommitted}
                valueLabelDisplay="auto"
                max={120}
                marks={timeMarks}
                valueLabelFormat={value => `${value} min`}
              />
            </Box>
          </FilterCategoryBox>
          
          {/* Calories */}
          <FilterCategoryBox>
            <Typography variant="subtitle2" gutterBottom>
              Calories
            </Typography>
            <Box sx={{ px: 2, mt: 4, mb: 2 }}>
              <Slider
                value={calorieRange}
                onChange={handleCalorieRangeChange}
                onChangeCommitted={handleCalorieRangeChangeCommitted}
                valueLabelDisplay="auto"
                max={1000}
                marks={calorieMarks}
                valueLabelFormat={value => `${value} kcal`}
              />
            </Box>
          </FilterCategoryBox>
          
          {/* Options avancées */}
          <Collapse in={showAdvanced} timeout={300}>
            <FilterCategoryBox>
              <Typography variant="subtitle2" gutterBottom>
                Options avancées
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormGroup>
                    <FormControlLabel 
                      control={
                        <Checkbox 
                          checked={filters.showRated} 
                          onChange={(e) => {
                            const newFilters = { ...filters, showRated: e.target.checked };
                            if (!e.target.checked) delete newFilters.showRated;
                            setFilters(newFilters);
                            onFiltersChange(newFilters);
                          }} 
                        />
                      } 
                      label="Recettes bien notées" 
                    />
                    <FormControlLabel 
                      control={
                        <Checkbox 
                          checked={filters.showPopular} 
                          onChange={(e) => {
                            const newFilters = { ...filters, showPopular: e.target.checked };
                            if (!e.target.checked) delete newFilters.showPopular;
                            setFilters(newFilters);
                            onFiltersChange(newFilters);
                          }} 
                        />
                      } 
                      label="Recettes populaires" 
                    />
                  </FormGroup>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormGroup>
                    <FormControlLabel 
                      control={
                        <Checkbox 
                          checked={filters.inSeason} 
                          onChange={(e) => {
                            const newFilters = { ...filters, inSeason: e.target.checked };
                            if (!e.target.checked) delete newFilters.inSeason;
                            setFilters(newFilters);
                            onFiltersChange(newFilters);
                          }} 
                        />
                      } 
                      label="Produits de saison" 
                    />
                    <FormControlLabel 
                      control={
                        <Checkbox 
                          checked={filters.hdPhotos} 
                          onChange={(e) => {
                            const newFilters = { ...filters, hdPhotos: e.target.checked };
                            if (!e.target.checked) delete newFilters.hdPhotos;
                            setFilters(newFilters);
                            onFiltersChange(newFilters);
                          }} 
                        />
                      } 
                      label="Avec photos HD" 
                    />
                  </FormGroup>
                </Grid>
              </Grid>
            </FilterCategoryBox>
          </Collapse>
        </Box>
      </Collapse>
    </FilterContainer>
  );
};

export default VisualFilterSystem;
