import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Paper,
  Slider,
  TextField,
  InputAdornment,
  FormHelperText,
  useTheme
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import NoMealsIcon from '@mui/icons-material/NoMeals';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import EggAltIcon from '@mui/icons-material/EggAlt';
import GrassIcon from '@mui/icons-material/Grass';
import SetMealIcon from '@mui/icons-material/SetMeal';
import { PlanFormData } from '../PlanForm';

interface DietaryPreferencesStepProps {
  formData: PlanFormData;
  updateFormData: (data: Partial<PlanFormData>) => void;
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

// Allergènes communs
const commonAllergies = [
  'Gluten',
  'Lactose',
  'Arachides',
  'Fruits à coque',
  'Soja',
  'Œufs',
  'Poisson',
  'Crustacés',
  'Sulfites'
];

// Intolérances alimentaires
const commonIntolerances = [
  'Lactose',
  'Fructose',
  'FODMAPs',
  'Histamine',
  'Gluten (non-cœliaque)',
  'Caféine',
  'Sorbitol',
  'Salicylates'
];

// Catégories d'aliments
const foodCategories = [
  'Viandes rouges',
  'Volailles',
  'Poissons',
  'Fruits de mer',
  'Produits laitiers',
  'Fromages',
  'Œufs',
  'Légumes',
  'Fruits',
  'Céréales',
  'Légumineuses',
  'Noix et graines',
  'Matières grasses'
];

// Aliments populaires pour cyclistes
const popularCyclistFoods = [
  'Bananes',
  'Avoine',
  'Riz',
  'Pâtes complètes',
  'Patates douces',
  'Œufs',
  'Poulet',
  'Saumon',
  'Yaourt grec',
  'Fromage blanc',
  'Amandes',
  'Beurre de cacahuète',
  'Chocolat noir',
  'Myrtilles',
  'Épinards',
  'Quinoa',
  'Lentilles',
  'Miel',
  'Dattes'
];

// Suppléments utilisés en cyclisme
const cyclingSupplements = [
  'Électrolytes',
  'Protéines en poudre',
  'BCAA',
  'Créatine',
  'Bêta-alanine',
  'Caféine',
  'Multivitamines',
  'Magnésium',
  'Fer',
  'Vitamine D',
  'Oméga-3',
  'Probiotiques',
  'Gels énergétiques',
  'Barres énergétiques',
  'Boissons de récupération'
];

const DietaryPreferencesStep: React.FC<DietaryPreferencesStepProps> = ({ formData, updateFormData }) => {
  const theme = useTheme();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      updateFormData({ [name]: value });
    }
  };

  const handleMultiSelectChange = (event: React.ChangeEvent<{ value: unknown }>, field: keyof PlanFormData) => {
    const {
      target: { value },
    } = event;
    
    updateFormData({ 
      [field]: typeof value === 'string' ? value.split(',') : value 
    });
  };

  const dietTypeInfo = {
    standard: {
      title: "Standard",
      description: "Alimentation équilibrée incluant tous les groupes alimentaires",
      icon: <RestaurantIcon fontSize="medium" />
    },
    vegetarian: {
      title: "Végétarien",
      description: "Exclut viandes et poissons, inclut œufs et produits laitiers",
      icon: <GrassIcon fontSize="medium" />
    },
    vegan: {
      title: "Végétalien",
      description: "Exclut tous les produits d'origine animale",
      icon: <GrassIcon fontSize="medium" />
    },
    pescatarian: {
      title: "Pescétarien",
      description: "Inclut poissons, exclut viandes",
      icon: <SetMealIcon fontSize="medium" />
    },
    low_carb: {
      title: "Faible en glucides",
      description: "Limite les glucides, favorise protéines et graisses",
      icon: <LocalDiningIcon fontSize="medium" />
    },
    keto: {
      title: "Cétogène",
      description: "Très faible en glucides, riche en graisses",
      icon: <EggAltIcon fontSize="medium" />
    },
    mediterranean: {
      title: "Méditerranéen",
      description: "Riche en huile d'olive, poissons, légumes et fruits frais",
      icon: <LocalDiningIcon fontSize="medium" />
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Préférences alimentaires
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Personnalisez votre plan nutritionnel en fonction de vos préférences, restrictions et habitudes alimentaires.
      </Typography>

      <Paper elevation={1} sx={{ p: 3, my: 3, bgcolor: theme.palette.background.paper }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="medium">
          Type d'alimentation
        </Typography>

        <FormControl fullWidth sx={{ mt: 1 }}>
          <InputLabel id="diet-type-label">Type d'alimentation</InputLabel>
          <Select
            labelId="diet-type-label"
            name="dietType"
            value={formData.dietType}
            onChange={handleSelectChange}
            label="Type d'alimentation"
          >
            {Object.entries(dietTypeInfo).map(([key, info]) => (
              <MenuItem value={key} key={key}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {info.icon}
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="body1">{info.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{info.description}</Typography>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            Sélectionnez le type d'alimentation qui correspond le mieux à vos habitudes actuelles
          </FormHelperText>
        </FormControl>
      </Paper>

      <Paper elevation={1} sx={{ p: 3, my: 3, bgcolor: theme.palette.background.paper }}>
        <Box display="flex" alignItems="center" mb={2}>
          <NoMealsIcon color="error" sx={{ mr: 1 }} />
          <Typography variant="subtitle1" fontWeight="medium">
            Restrictions alimentaires
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="allergies-label">Allergies</InputLabel>
              <Select
                labelId="allergies-label"
                multiple
                value={formData.allergies}
                onChange={(e) => handleMultiSelectChange(e, 'allergies')}
                input={<OutlinedInput label="Allergies" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
                MenuProps={MenuProps}
              >
                {commonAllergies.map((allergen) => (
                  <MenuItem key={allergen} value={allergen}>
                    <Checkbox checked={formData.allergies.indexOf(allergen) > -1} />
                    <ListItemText primary={allergen} />
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Sélectionnez toutes vos allergies alimentaires
              </FormHelperText>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="intolerances-label">Intolérances</InputLabel>
              <Select
                labelId="intolerances-label"
                multiple
                value={formData.intolerances}
                onChange={(e) => handleMultiSelectChange(e, 'intolerances')}
                input={<OutlinedInput label="Intolérances" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
                MenuProps={MenuProps}
              >
                {commonIntolerances.map((intolerance) => (
                  <MenuItem key={intolerance} value={intolerance}>
                    <Checkbox checked={formData.intolerances.indexOf(intolerance) > -1} />
                    <ListItemText primary={intolerance} />
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Sélectionnez toutes vos intolérances alimentaires
              </FormHelperText>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="excluded-foods-label">Aliments à éviter</InputLabel>
              <Select
                labelId="excluded-foods-label"
                multiple
                value={formData.excludedFoods}
                onChange={(e) => handleMultiSelectChange(e, 'excludedFoods')}
                input={<OutlinedInput label="Aliments à éviter" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
                MenuProps={MenuProps}
              >
                {foodCategories.map((food) => (
                  <MenuItem key={food} value={food}>
                    <Checkbox checked={formData.excludedFoods.indexOf(food) > -1} />
                    <ListItemText primary={food} />
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Sélectionnez les aliments ou catégories que vous souhaitez éviter
              </FormHelperText>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={1} sx={{ p: 3, my: 3, bgcolor: theme.palette.background.paper }}>
        <Box display="flex" alignItems="center" mb={2}>
          <RestaurantIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="subtitle1" fontWeight="medium">
            Préférences et habitudes
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="preferred-foods-label">Aliments préférés</InputLabel>
              <Select
                labelId="preferred-foods-label"
                multiple
                value={formData.preferredFoods}
                onChange={(e) => handleMultiSelectChange(e, 'preferredFoods')}
                input={<OutlinedInput label="Aliments préférés" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
                MenuProps={MenuProps}
              >
                {popularCyclistFoods.map((food) => (
                  <MenuItem key={food} value={food}>
                    <Checkbox checked={formData.preferredFoods.indexOf(food) > -1} />
                    <ListItemText primary={food} />
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Sélectionnez les aliments que vous préférez inclure dans votre plan
              </FormHelperText>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <Typography gutterBottom>
                Nombre de repas par jour
              </Typography>
              <Slider
                value={formData.mealFrequency}
                onChange={(_, value) => updateFormData({ mealFrequency: value as number })}
                step={1}
                marks={[
                  { value: 3, label: '3' },
                  { value: 4, label: '4' },
                  { value: 5, label: '5' },
                  { value: 6, label: '6' }
                ]}
                min={3}
                max={6}
                valueLabelDisplay="auto"
              />
              <FormHelperText>
                {formData.mealFrequency === 3 
                  ? 'Structure classique: petit-déjeuner, déjeuner, dîner' 
                  : formData.mealFrequency === 4
                  ? 'Inclut une collation stratégique'
                  : formData.mealFrequency === 5
                  ? 'Inclut deux collations réparties dans la journée'
                  : 'Repas plus fréquents et moins volumineux'}
              </FormHelperText>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="supplements-label">Suppléments utilisés</InputLabel>
              <Select
                labelId="supplements-label"
                multiple
                value={formData.supplementsUsed}
                onChange={(e) => handleMultiSelectChange(e, 'supplementsUsed')}
                input={<OutlinedInput label="Suppléments utilisés" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
                MenuProps={MenuProps}
              >
                {cyclingSupplements.map((supplement) => (
                  <MenuItem key={supplement} value={supplement}>
                    <Checkbox checked={formData.supplementsUsed.indexOf(supplement) > -1} />
                    <ListItemText primary={supplement} />
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Sélectionnez les suppléments que vous utilisez actuellement
              </FormHelperText>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={1} sx={{ p: 3, my: 3, bgcolor: theme.palette.background.paper }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="subtitle1" fontWeight="medium">
            Personnalisation du plan
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nom du plan"
              name="planName"
              value={formData.planName}
              onChange={handleChange}
              placeholder="Ex: Mon plan d'ascension cols"
              helperText="Donnez un nom à votre plan nutritionnel"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="planDescription"
              value={formData.planDescription}
              onChange={handleChange}
              placeholder="Ex: Plan nutritionnel pour ma préparation aux cols des Alpes"
              multiline
              rows={2}
              helperText="Décrivez l'objectif de ce plan nutritionnel"
            />
          </Grid>
        </Grid>
      </Paper>

      <Box mt={4}>
        <Typography variant="body2" color="text.secondary">
          Ces informations nous permettent de personnaliser votre plan en fonction de vos préférences et restrictions alimentaires.
        </Typography>
      </Box>
    </Box>
  );
};

export default DietaryPreferencesStep;
