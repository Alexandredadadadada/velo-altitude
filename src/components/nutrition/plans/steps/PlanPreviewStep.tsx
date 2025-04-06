import React from 'react';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Stack,
  LinearProgress,
  TextField,
  useTheme
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { PlanFormData } from '../PlanForm';
import { NutritionPlan } from '../../../../types';

interface PlanPreviewStepProps {
  formData: PlanFormData;
  updateFormData: (data: Partial<PlanFormData>) => void;
  plan: NutritionPlan | null;
}

const PlanPreviewStep: React.FC<PlanPreviewStepProps> = ({ formData, updateFormData, plan }) => {
  const theme = useTheme();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const handleMacroChange = (macro: 'protein' | 'carbs' | 'fat', value: number) => {
    const newMacroRatio = { ...formData.macroRatio, [macro]: value };
    
    // Assurez-vous que le total est toujours 100%
    const total = newMacroRatio.protein + newMacroRatio.carbs + newMacroRatio.fat;
    if (total !== 100) {
      // Ajustez les autres macros proportionnellement
      const adjust = (100 - value) / (total - formData.macroRatio[macro]);
      
      if (macro === 'protein') {
        newMacroRatio.carbs = Math.round(newMacroRatio.carbs * adjust);
        newMacroRatio.fat = 100 - newMacroRatio.protein - newMacroRatio.carbs;
      } else if (macro === 'carbs') {
        newMacroRatio.fat = Math.round(newMacroRatio.fat * adjust);
        newMacroRatio.protein = 100 - newMacroRatio.carbs - newMacroRatio.fat;
      } else {
        newMacroRatio.protein = Math.round(newMacroRatio.protein * adjust);
        newMacroRatio.carbs = 100 - newMacroRatio.protein - newMacroRatio.fat;
      }
    }
    
    updateFormData({ macroRatio: newMacroRatio });
  };

  // Formater l'objectif pour l'affichage
  const formatGoal = (goal: string) => {
    switch (goal) {
      case 'weight_loss': return 'Perte de poids';
      case 'maintenance': return 'Maintien';
      case 'performance': return 'Performance';
      case 'endurance': return 'Endurance';
      case 'climbing': return 'Ascension de cols';
      default: return goal;
    }
  };

  // Formater le type de régime pour l'affichage
  const formatDietType = (dietType: string) => {
    switch (dietType) {
      case 'standard': return 'Standard';
      case 'vegetarian': return 'Végétarien';
      case 'vegan': return 'Végétalien';
      case 'pescatarian': return 'Pescétarien';
      case 'low_carb': return 'Faible en glucides';
      case 'keto': return 'Cétogène';
      case 'mediterranean': return 'Méditerranéen';
      default: return dietType;
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Aperçu de votre plan nutritionnel
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Vérifiez les détails de votre plan nutritionnel personnalisé et effectuez les derniers ajustements si nécessaire.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8}>
                <Typography variant="h5" gutterBottom>
                  {formData.planName}
                </Typography>
                <Typography variant="body1" paragraph>
                  {formData.planDescription}
                </Typography>
                
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Chip 
                    icon={<DirectionsBikeIcon />} 
                    label={formatGoal(formData.targetGoal)} 
                    color="primary" 
                    variant="outlined" 
                  />
                  <Chip 
                    icon={<RestaurantIcon />} 
                    label={formatDietType(formData.dietType)} 
                    color="secondary" 
                    variant="outlined" 
                  />
                </Stack>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    bgcolor: theme.palette.background.paper
                  }}
                >
                  <LocalFireDepartmentIcon 
                    sx={{ 
                      fontSize: 40, 
                      color: theme.palette.warning.main,
                      mb: 1
                    }} 
                  />
                  <Typography variant="h4" fontWeight="bold" align="center">
                    {formData.dailyCalories}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    calories par jour
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Répartition des macronutriments
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box sx={{ px: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Protéines: {formData.macroRatio.protein}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={formData.macroRatio.protein} 
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      bgcolor: theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        bgcolor: theme.palette.primary.main
                      }
                    }} 
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {Math.round(formData.dailyCalories * formData.macroRatio.protein / 100 / 4)} g
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box sx={{ px: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Glucides: {formData.macroRatio.carbs}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={formData.macroRatio.carbs} 
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      bgcolor: theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        bgcolor: theme.palette.info.main
                      }
                    }} 
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {Math.round(formData.dailyCalories * formData.macroRatio.carbs / 100 / 4)} g
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box sx={{ px: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Lipides: {formData.macroRatio.fat}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={formData.macroRatio.fat} 
                    sx={{ 
                      height: 10, 
                      borderRadius: 5,
                      bgcolor: theme.palette.grey[200],
                      '& .MuiLinearProgress-bar': {
                        bgcolor: theme.palette.warning.main
                      }
                    }} 
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {Math.round(formData.dailyCalories * formData.macroRatio.fat / 100 / 9)} g
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Ajuster les macronutriments (si nécessaire)
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Les valeurs sont automatiquement équilibrées pour totaliser 100%.
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Protéines (%)"
                    type="number"
                    value={formData.macroRatio.protein}
                    onChange={(e) => handleMacroChange('protein', parseInt(e.target.value))}
                    InputProps={{
                      inputProps: { min: 10, max: 50 }
                    }}
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Glucides (%)"
                    type="number"
                    value={formData.macroRatio.carbs}
                    onChange={(e) => handleMacroChange('carbs', parseInt(e.target.value))}
                    InputProps={{
                      inputProps: { min: 25, max: 70 }
                    }}
                    size="small"
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Lipides (%)"
                    type="number"
                    value={formData.macroRatio.fat}
                    onChange={(e) => handleMacroChange('fat', parseInt(e.target.value))}
                    InputProps={{
                      inputProps: { min: 15, max: 50 }
                    }}
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Répartition des repas
            </Typography>
            
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Repas</TableCell>
                    <TableCell>Heure</TableCell>
                    <TableCell align="right">Calories</TableCell>
                    <TableCell align="right">Protéines (g)</TableCell>
                    <TableCell align="right">Glucides (g)</TableCell>
                    <TableCell align="right">Lipides (g)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {plan?.meals.map((meal, index) => (
                    <TableRow key={index}>
                      <TableCell component="th" scope="row">
                        <Typography variant="body2" fontWeight="medium">
                          {meal.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <AccessTimeIcon color="action" fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {meal.time}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {meal.calories} kcal
                      </TableCell>
                      <TableCell align="right">
                        {meal.macros.protein} g
                      </TableCell>
                      <TableCell align="right">
                        {meal.macros.carbs} g
                      </TableCell>
                      <TableCell align="right">
                        {meal.macros.fat} g
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={2} component="th" scope="row">
                      <Typography variant="subtitle2">Total journalier</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2">
                        {formData.dailyCalories} kcal
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2">
                        {Math.round(formData.dailyCalories * formData.macroRatio.protein / 100 / 4)} g
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2">
                        {Math.round(formData.dailyCalories * formData.macroRatio.carbs / 100 / 4)} g
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2">
                        {Math.round(formData.dailyCalories * formData.macroRatio.fat / 100 / 9)} g
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Résumé du profil
              </Typography>
              
              <Divider sx={{ my: 1 }} />
              
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Âge:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {formData.age} ans
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Genre:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {formData.gender === 'male' ? 'Homme' : formData.gender === 'female' ? 'Femme' : 'Autre'}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Poids:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {formData.weight} kg
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Taille:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {formData.height} cm
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Niveau d'activité:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {formData.activityLevel === 'sedentary' ? 'Sédentaire' :
                     formData.activityLevel === 'light' ? 'Légèrement actif' :
                     formData.activityLevel === 'moderate' ? 'Modérément actif' :
                     formData.activityLevel === 'active' ? 'Très actif' : 'Extrêmement actif'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Objectifs cyclistes
              </Typography>
              
              <Divider sx={{ my: 1 }} />
              
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Objectif principal:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {formatGoal(formData.targetGoal)}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Fréquence d'entraînement:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {formData.trainingFrequency} séances/semaine
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Intensité:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    {formData.trainingIntensity === 'low' ? 'Faible' :
                     formData.trainingIntensity === 'medium' ? 'Moyenne' : 'Élevée'}
                  </Typography>
                </Grid>
                
                {formData.upcomingEvents && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Événement à venir:
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        {formData.eventType === 'short_race' ? 'Course courte distance' :
                         formData.eventType === 'long_race' ? 'Course longue distance' :
                         formData.eventType === 'stage_race' ? 'Course à étapes' :
                         formData.eventType === 'gran_fondo' ? 'Cyclosportive' :
                         formData.eventType === 'col_challenge' ? 'Défi d\'ascension de cols' : ''}
                      </Typography>
                    </Grid>
                    
                    {formData.eventDate && (
                      <>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Date de l'événement:
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">
                            {new Date(formData.eventDate).toLocaleDateString('fr-FR')}
                          </Typography>
                        </Grid>
                      </>
                    )}
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>

          <Card elevation={2} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Restrictions alimentaires
              </Typography>
              
              <Divider sx={{ my: 1 }} />
              
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Type d'alimentation:
                </Typography>
                <Typography variant="body2" paragraph>
                  {formatDietType(formData.dietType)}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Allergies:
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {formData.allergies.length > 0 ? (
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {formData.allergies.map((allergy) => (
                        <Chip key={allergy} label={allergy} size="small" />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2">Aucune allergie spécifiée</Typography>
                  )}
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Intolérances:
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {formData.intolerances.length > 0 ? (
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {formData.intolerances.map((intolerance) => (
                        <Chip key={intolerance} label={intolerance} size="small" />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2">Aucune intolérance spécifiée</Typography>
                  )}
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Aliments à éviter:
                </Typography>
                <Box>
                  {formData.excludedFoods.length > 0 ? (
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {formData.excludedFoods.map((food) => (
                        <Chip key={food} label={food} size="small" />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2">Aucun aliment spécifiquement exclu</Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box mt={4}>
        <Typography variant="body2" color="text.secondary">
          Veuillez vérifier attentivement tous les détails de votre plan nutritionnel. 
          Vous pouvez ajuster les ratios de macronutriments si nécessaire. Une fois le plan créé, 
          vous pourrez accéder à des recommandations de repas spécifiques et suivre votre 
          progression nutritionnelle.
        </Typography>
      </Box>
    </Box>
  );
};

export default PlanPreviewStep;
