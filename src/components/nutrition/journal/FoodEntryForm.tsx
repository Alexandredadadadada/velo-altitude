import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  FormHelperText,
  useTheme,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Collapse,
  Divider
} from '@mui/material';
import { 
  RestaurantMenu as RestaurantMenuIcon,
  Today as TodayIcon,
  AccessTime as AccessTimeIcon,
  SaveAlt as SaveAltIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { APIOrchestrator } from '../../../api/orchestration';
import { formatToTimeZone } from 'date-fns-timezone';

// Définition des catégories de repas
const mealCategories = [
  { id: 'breakfast', name: 'Petit-déjeuner' },
  { id: 'morning_snack', name: 'Collation matinale' },
  { id: 'lunch', name: 'Déjeuner' },
  { id: 'afternoon_snack', name: 'Collation après-midi' },
  { id: 'pre_workout', name: 'Avant entraînement' },
  { id: 'during_workout', name: 'Pendant entraînement' },
  { id: 'post_workout', name: 'Après entraînement' },
  { id: 'dinner', name: 'Dîner' },
  { id: 'evening_snack', name: 'Collation nocturne' }
];

interface FoodEntryFormProps {
  onSave: (entry: any) => void;
  onCancel: () => void;
  linkedPlan?: any;
  date?: Date;
  initialEntry?: any; // Pour l'édition d'une entrée existante
}

const FoodEntryForm: React.FC<FoodEntryFormProps> = ({ 
  onSave, 
  onCancel, 
  linkedPlan, 
  date = new Date(),
  initialEntry 
}) => {
  const theme = useTheme();
  const isEditMode = !!initialEntry;

  // État du formulaire
  const [formData, setFormData] = useState({
    entryDate: date,
    entryTime: date,
    mealCategory: initialEntry?.mealCategory || 'breakfast',
    foods: initialEntry?.foods || [],
    notes: initialEntry?.notes || '',
  });

  // États pour la recherche et la sélection d'aliments
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedFood, setSelectedFood] = useState<any | null>(null);
  const [quantity, setQuantity] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [customFood, setCustomFood] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    isValid: false
  });

  // Validation du formulaire personnalisé
  useEffect(() => {
    setCustomFood(prev => ({
      ...prev,
      isValid: 
        prev.name.trim() !== '' && 
        !isNaN(Number(prev.calories)) && 
        !isNaN(Number(prev.protein)) && 
        !isNaN(Number(prev.carbs)) && 
        !isNaN(Number(prev.fat))
    }));
  }, [customFood.name, customFood.calories, customFood.protein, customFood.carbs, customFood.fat]);

  // Recherche d'aliments
  useEffect(() => {
    const searchFoods = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const api = new APIOrchestrator();
        const results = await api.searchFoods(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Erreur lors de la recherche d\'aliments:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchFoods, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Ajout d'un aliment à la liste
  const handleAddFood = () => {
    if (!selectedFood) return;

    const newFood = {
      ...selectedFood,
      quantity,
      calories: Math.round(selectedFood.calories * quantity / 100),
      protein: Math.round(selectedFood.protein * quantity / 100 * 10) / 10,
      carbs: Math.round(selectedFood.carbs * quantity / 100 * 10) / 10,
      fat: Math.round(selectedFood.fat * quantity / 100 * 10) / 10,
    };

    setFormData(prev => ({
      ...prev,
      foods: [...prev.foods, newFood]
    }));

    // Réinitialisation
    setSelectedFood(null);
    setQuantity(100);
    setSearchQuery('');
  };

  // Ajout d'un aliment personnalisé
  const handleAddCustomFood = () => {
    if (!customFood.isValid) return;

    const newFood = {
      id: `custom-${Date.now()}`,
      name: customFood.name,
      quantity,
      calories: Math.round(Number(customFood.calories) * quantity / 100),
      protein: Math.round(Number(customFood.protein) * quantity / 100 * 10) / 10,
      carbs: Math.round(Number(customFood.carbs) * quantity / 100 * 10) / 10,
      fat: Math.round(Number(customFood.fat) * quantity / 100 * 10) / 10,
      isCustom: true
    };

    setFormData(prev => ({
      ...prev,
      foods: [...prev.foods, newFood]
    }));

    // Réinitialisation
    setCustomFood({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      isValid: false
    });
  };

  // Suppression d'un aliment de la liste
  const handleRemoveFood = (index: number) => {
    setFormData(prev => ({
      ...prev,
      foods: prev.foods.filter((_, i) => i !== index)
    }));
  };

  // Calcul des totaux nutritionnels
  const calculateTotals = () => {
    return formData.foods.reduce((totals, food) => {
      return {
        calories: totals.calories + food.calories,
        protein: totals.protein + food.protein,
        carbs: totals.carbs + food.carbs,
        fat: totals.fat + food.fat
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.foods.length === 0) return;

    const totals = calculateTotals();
    
    // Création de l'entrée
    const newEntry = {
      id: initialEntry?.id || `entry-${Date.now()}`,
      date: formatToTimeZone(formData.entryDate, 'YYYY-MM-DD', { timeZone: 'Europe/Paris' }),
      time: formatToTimeZone(formData.entryTime, 'HH:mm', { timeZone: 'Europe/Paris' }),
      mealCategory: formData.mealCategory,
      foods: formData.foods,
      notes: formData.notes,
      nutritionSummary: totals,
      linkedPlanId: linkedPlan?.id || null
    };

    try {
      const api = new APIOrchestrator();
      
      if (isEditMode) {
        await api.updateNutritionLogEntry(newEntry);
      } else {
        await api.createNutritionLogEntry(newEntry);
      }
      
      onSave(newEntry);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'entrée:', error);
      // Idéalement, afficher un message d'erreur à l'utilisateur
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
      <Typography variant="h6" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RestaurantMenuIcon color="primary" />
        {isEditMode ? 'Modifier une entrée' : 'Ajouter une entrée au journal'}
      </Typography>
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Date et heure */}
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="Date"
              value={formData.entryDate}
              onChange={(newDate) => {
                if (newDate) {
                  setFormData(prev => ({ ...prev, entryDate: newDate }));
                }
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  fullWidth 
                  required
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <TodayIcon color="action" />
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TimePicker
              label="Heure"
              value={formData.entryTime}
              onChange={(newTime) => {
                if (newTime) {
                  setFormData(prev => ({ ...prev, entryTime: newTime }));
                }
              }}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  fullWidth 
                  required
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccessTimeIcon color="action" />
                      </InputAdornment>
                    )
                  }}
                />
              )}
            />
          </Grid>
          
          {/* Catégorie de repas */}
          <Grid item xs={12} sm={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="meal-category-label">Catégorie de repas</InputLabel>
              <Select
                labelId="meal-category-label"
                id="meal-category"
                value={formData.mealCategory}
                label="Catégorie de repas"
                onChange={(e) => setFormData(prev => ({ ...prev, mealCategory: e.target.value }))}
              >
                {mealCategories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Recherche d'aliments */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Ajouter des aliments
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
              <Autocomplete
                fullWidth
                loading={loading}
                options={searchResults}
                getOptionLabel={(option) => option.name}
                value={selectedFood}
                onChange={(_, newValue) => setSelectedFood(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Rechercher un aliment"
                    variant="outlined"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      )
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.calories} kcal | P: {option.protein}g | G: {option.carbs}g | L: {option.fat}g
                      </Typography>
                    </Box>
                  </li>
                )}
              />

              <TextField
                label="Quantité (g)"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                InputProps={{ inputProps: { min: 1 } }}
                sx={{ width: 150 }}
              />

              <Button
                variant="contained"
                color="primary"
                onClick={handleAddFood}
                disabled={!selectedFood}
                startIcon={<AddIcon />}
              >
                Ajouter
              </Button>
            </Box>
            
            {/* Toggle mode avancé */}
            <Button
              variant="text"
              color="primary"
              onClick={() => setAdvancedMode(!advancedMode)}
              endIcon={<ExpandMoreIcon sx={{ 
                transform: advancedMode ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s'
              }} />}
              sx={{ mb: 2 }}
            >
              {advancedMode ? 'Masquer' : 'Afficher'} le mode avancé
            </Button>
            
            {/* Formulaire d'aliment personnalisé */}
            <Collapse in={advancedMode}>
              <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Ajouter un aliment personnalisé
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Nom de l'aliment"
                      value={customFood.name}
                      onChange={(e) => setCustomFood(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      label="Calories (kcal)"
                      type="number"
                      value={customFood.calories}
                      onChange={(e) => setCustomFood(prev => ({ ...prev, calories: e.target.value }))}
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      label="Protéines (g)"
                      type="number"
                      value={customFood.protein}
                      onChange={(e) => setCustomFood(prev => ({ ...prev, protein: e.target.value }))}
                      InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      label="Glucides (g)"
                      type="number"
                      value={customFood.carbs}
                      onChange={(e) => setCustomFood(prev => ({ ...prev, carbs: e.target.value }))}
                      InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      label="Lipides (g)"
                      type="number"
                      value={customFood.fat}
                      onChange={(e) => setCustomFood(prev => ({ ...prev, fat: e.target.value }))}
                      InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleAddCustomFood}
                        disabled={!customFood.isValid}
                        startIcon={<AddIcon />}
                      >
                        Ajouter
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Card>
            </Collapse>
          </Grid>

          {/* Liste des aliments ajoutés */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Aliments ajoutés ({formData.foods.length})
            </Typography>
            
            {formData.foods.length === 0 ? (
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  backgroundColor: theme.palette.grey[50]
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Aucun aliment ajouté. Utilisez la recherche ci-dessus pour ajouter des aliments à votre entrée.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {formData.foods.map((food, index) => (
                  <Grid item xs={12} key={index}>
                    <Card variant="outlined">
                      <CardContent sx={{ py: 1 }}>
                        <Grid container alignItems="center">
                          <Grid item xs={12} sm={4}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                sx={{ 
                                  width: 40, 
                                  height: 40, 
                                  mr: 2,
                                  bgcolor: food.isCustom ? theme.palette.info.light : theme.palette.primary.light
                                }}
                              >
                                {food.name.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body1">
                                  {food.name}
                                  {food.isCustom && (
                                    <Chip 
                                      label="Personnalisé" 
                                      size="small" 
                                      color="info" 
                                      sx={{ ml: 1, height: 20 }} 
                                    />
                                  )}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Quantité: {food.quantity}g
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                              <Chip 
                                label={`${food.calories} kcal`} 
                                size="small" 
                                sx={{ bgcolor: theme.palette.error.light, color: theme.palette.error.contrastText }}
                              />
                              <Chip 
                                label={`Protéines: ${food.protein}g`} 
                                size="small" 
                                sx={{ bgcolor: theme.palette.primary.light, color: theme.palette.primary.contrastText }}
                              />
                              <Chip 
                                label={`Glucides: ${food.carbs}g`} 
                                size="small" 
                                sx={{ bgcolor: theme.palette.info.light, color: theme.palette.info.contrastText }}
                              />
                              <Chip 
                                label={`Lipides: ${food.fat}g`} 
                                size="small" 
                                sx={{ bgcolor: theme.palette.warning.light, color: theme.palette.warning.contrastText }}
                              />
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={2} sx={{ textAlign: 'right' }}>
                            <IconButton 
                              color="error" 
                              onClick={() => handleRemoveFood(index)}
                              size="small"
                            >
                              <CancelIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                
                {/* Résumé nutritionnel */}
                <Grid item xs={12}>
                  <Card 
                    sx={{ 
                      mt: 2, 
                      bgcolor: theme.palette.grey[50],
                      borderColor: theme.palette.primary.main
                    }}
                    variant="outlined"
                  >
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Résumé nutritionnel
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center', p: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Calories
                            </Typography>
                            <Typography variant="h6" color="error.main">
                              {calculateTotals().calories} kcal
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center', p: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Protéines
                            </Typography>
                            <Typography variant="h6" color="primary.main">
                              {calculateTotals().protein}g
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center', p: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Glucides
                            </Typography>
                            <Typography variant="h6" color="info.main">
                              {calculateTotals().carbs}g
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Box sx={{ textAlign: 'center', p: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Lipides
                            </Typography>
                            <Typography variant="h6" color="warning.main">
                              {calculateTotals().fat}g
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes (optionnel)"
              multiline
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Ajoutez des notes sur ce repas, comment vous vous êtes senti, etc."
            />
          </Grid>

          {/* Boutons d'action */}
          <Grid item xs={12}>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={onCancel}
                startIcon={<CancelIcon />}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={formData.foods.length === 0}
                startIcon={<SaveAltIcon />}
              >
                {isEditMode ? 'Mettre à jour' : 'Enregistrer'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default FoodEntryForm;
