import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
  useMediaQuery,
  CircularProgress
} from '@mui/material';

/**
 * Boîte de dialogue pour sauvegarder un plan de repas
 * 
 * @param {Object} props - Propriétés du composant
 * @param {boolean} props.open - État d'ouverture de la boîte de dialogue
 * @param {string} props.planName - Nom du plan
 * @param {Function} props.onNameChange - Gestionnaire de changement de nom
 * @param {Function} props.onSave - Gestionnaire de sauvegarde
 * @param {Function} props.onClose - Gestionnaire de fermeture
 */
export const SavePlanDialog = ({ open, planName, onNameChange, onSave, onClose }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      aria-labelledby="save-plan-dialog-title"
    >
      <DialogTitle id="save-plan-dialog-title">
        {t('nutrition.planner.save_plan')}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="plan-name"
            label={t('nutrition.planner.plan_name')}
            type="text"
            fullWidth
            variant="outlined"
            value={planName}
            onChange={onNameChange}
            required
            inputProps={{
              'aria-label': t('nutrition.planner.plan_name'),
              maxLength: 50,
            }}
            helperText={t('nutrition.planner.plan_name_helper')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            {t('common.cancel')}
          </Button>
          <Button 
            type="submit" 
            color="primary" 
            variant="contained"
            disabled={!planName.trim()}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

/**
 * Boîte de dialogue pour afficher les informations nutritionnelles
 * 
 * @param {Object} props - Propriétés du composant
 * @param {boolean} props.open - État d'ouverture de la boîte de dialogue
 * @param {Object} props.nutritionResults - Résultats de l'analyse nutritionnelle
 * @param {Object} props.weeklyTotals - Totaux hebdomadaires
 * @param {Function} props.onClose - Gestionnaire de fermeture
 */
export const NutritionInfoDialog = ({ open, nutritionResults, weeklyTotals, onClose }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  if (!nutritionResults) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
  
  // Calcul des pourcentages pour la semaine
  const dailyTarget = nutritionResults.dailyIntake || {};
  const weeklyTarget = {
    calories: dailyTarget.calories * 7,
    protein: dailyTarget.protein * 7,
    carbs: dailyTarget.carbs * 7,
    fat: dailyTarget.fat * 7
  };
  
  const weeklyPercent = {
    calories: Math.round((weeklyTotals.calories / weeklyTarget.calories) * 100) || 0,
    protein: Math.round((weeklyTotals.protein / weeklyTarget.protein) * 100) || 0,
    carbs: Math.round((weeklyTotals.carbs / weeklyTarget.carbs) * 100) || 0,
    fat: Math.round((weeklyTotals.fat / weeklyTarget.fat) * 100) || 0
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      aria-labelledby="nutrition-info-dialog-title"
    >
      <DialogTitle id="nutrition-info-dialog-title">
        {t('nutrition.planner.nutrition_info')}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {/* Objectifs quotidiens */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              {t('nutrition.planner.daily_targets')}
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('nutrition.planner.nutrient')}</TableCell>
                    <TableCell align="right">{t('nutrition.planner.target')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{t('nutrition.macros.daily_calories')}</TableCell>
                    <TableCell align="right">{dailyTarget.calories} kcal</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t('nutrition.macros.protein')}</TableCell>
                    <TableCell align="right">
                      {dailyTarget.protein}g ({Math.round(nutritionResults.macroRatio.protein * 100)}%)
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t('nutrition.macros.carbs')}</TableCell>
                    <TableCell align="right">
                      {dailyTarget.carbs}g ({Math.round(nutritionResults.macroRatio.carbs * 100)}%)
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t('nutrition.macros.fat')}</TableCell>
                    <TableCell align="right">
                      {dailyTarget.fat}g ({Math.round(nutritionResults.macroRatio.fat * 100)}%)
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {t('nutrition.planner.target_explanation')}
              </Typography>
            </Box>
          </Grid>
          
          {/* Progression hebdomadaire */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              {t('nutrition.planner.weekly_progress')}
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('nutrition.planner.nutrient')}</TableCell>
                    <TableCell align="right">{t('nutrition.planner.current')}</TableCell>
                    <TableCell align="right">{t('nutrition.planner.weekly_target')}</TableCell>
                    <TableCell align="right">{t('nutrition.planner.progress')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{t('nutrition.macros.calories')}</TableCell>
                    <TableCell align="right">{weeklyTotals.calories} kcal</TableCell>
                    <TableCell align="right">{weeklyTarget.calories} kcal</TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        color: weeklyPercent.calories < 70 
                          ? theme.palette.warning.main 
                          : weeklyPercent.calories > 110 
                            ? theme.palette.error.main 
                            : theme.palette.success.main 
                      }}
                    >
                      {weeklyPercent.calories}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t('nutrition.macros.protein')}</TableCell>
                    <TableCell align="right">{weeklyTotals.protein}g</TableCell>
                    <TableCell align="right">{weeklyTarget.protein}g</TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        color: weeklyPercent.protein < 70 
                          ? theme.palette.warning.main 
                          : weeklyPercent.protein > 110 
                            ? theme.palette.error.main 
                            : theme.palette.success.main 
                      }}
                    >
                      {weeklyPercent.protein}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t('nutrition.macros.carbs')}</TableCell>
                    <TableCell align="right">{weeklyTotals.carbs}g</TableCell>
                    <TableCell align="right">{weeklyTarget.carbs}g</TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        color: weeklyPercent.carbs < 70 
                          ? theme.palette.warning.main 
                          : weeklyPercent.carbs > 110 
                            ? theme.palette.error.main 
                            : theme.palette.success.main 
                      }}
                    >
                      {weeklyPercent.carbs}%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>{t('nutrition.macros.fat')}</TableCell>
                    <TableCell align="right">{weeklyTotals.fat}g</TableCell>
                    <TableCell align="right">{weeklyTarget.fat}g</TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        color: weeklyPercent.fat < 70 
                          ? theme.palette.warning.main 
                          : weeklyPercent.fat > 110 
                            ? theme.palette.error.main 
                            : theme.palette.success.main 
                      }}
                    >
                      {weeklyPercent.fat}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          
          {/* Conseils nutritionnels */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              {t('nutrition.planner.nutrition_tips')}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" paragraph>
                <strong>{t('nutrition.tips.protein_importance')}:</strong> {t('nutrition.tips.protein_description')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('nutrition.tips.carbs_timing')}:</strong> {t('nutrition.tips.carbs_description')}
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>{t('nutrition.tips.hydration')}:</strong> {t('nutrition.tips.hydration_description')}
              </Typography>
              <Typography variant="body2">
                <strong>{t('nutrition.tips.recovery')}:</strong> {t('nutrition.tips.recovery_description')}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Boîte de dialogue pour afficher les détails d'un repas
 * 
 * @param {Object} props - Propriétés du composant
 * @param {boolean} props.open - État d'ouverture de la boîte de dialogue
 * @param {Object} props.meal - Repas à afficher
 * @param {Function} props.onClose - Gestionnaire de fermeture
 */
export const MealDetailsDialog = ({ open, meal, onClose }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  if (!meal) {
    return null;
  }
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      aria-labelledby="meal-details-dialog-title"
    >
      <DialogTitle id="meal-details-dialog-title">
        {meal.title}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {t('nutrition.planner.nutritional_info')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 1, 
                  textAlign: 'center',
                  backgroundColor: theme.palette.primary.light,
                  color: theme.palette.primary.contrastText
                }}
              >
                <Typography variant="h6">{meal.calories}</Typography>
                <Typography variant="caption">{t('nutrition.macros.kcal')}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 1, 
                  textAlign: 'center',
                  backgroundColor: theme.palette.success.light,
                  color: theme.palette.success.contrastText
                }}
              >
                <Typography variant="h6">{meal.protein}g</Typography>
                <Typography variant="caption">{t('nutrition.macros.protein_short')}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 1, 
                  textAlign: 'center',
                  backgroundColor: theme.palette.warning.light,
                  color: theme.palette.warning.contrastText
                }}
              >
                <Typography variant="h6">{meal.carbs}g</Typography>
                <Typography variant="caption">{t('nutrition.macros.carbs_short')}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 1, 
                  textAlign: 'center',
                  backgroundColor: theme.palette.error.light,
                  color: theme.palette.error.contrastText
                }}
              >
                <Typography variant="h6">{meal.fat}g</Typography>
                <Typography variant="caption">{t('nutrition.macros.fat_short')}</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          {t('nutrition.planner.ingredients')}
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('nutrition.planner.food')}</TableCell>
                <TableCell align="right">{t('nutrition.planner.quantity')}</TableCell>
                <TableCell align="right">Kcal</TableCell>
                <TableCell align="right">P</TableCell>
                <TableCell align="right">C</TableCell>
                <TableCell align="right">F</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {meal.foods.map((food) => (
                <TableRow key={food.id}>
                  <TableCell component="th" scope="row">
                    {food.name}
                  </TableCell>
                  <TableCell align="right">{food.quantity}g</TableCell>
                  <TableCell align="right">{food.calories}</TableCell>
                  <TableCell align="right">{food.protein}g</TableCell>
                  <TableCell align="right">{food.carbs}g</TableCell>
                  <TableCell align="right">{food.fat}g</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default {
  SavePlanDialog,
  NutritionInfoDialog,
  MealDetailsDialog
};
