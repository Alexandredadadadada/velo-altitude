import React, { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid,
  Divider,
  Paper,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip
} from '@mui/material';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import SaveIcon from '@mui/icons-material/Save';
import InfoIcon from '@mui/icons-material/Info';
import DeleteIcon from '@mui/icons-material/Delete';
import BreakfastDiningIcon from '@mui/icons-material/BreakfastDining';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import DinnerDiningIcon from '@mui/icons-material/DinnerDining';
import EmojiFoodBeverageIcon from '@mui/icons-material/EmojiFoodBeverage';

/**
 * Composant pour l'affichage et la gestion d'un plan de repas
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Array} props.mealPlan - Plan de repas à afficher
 * @param {Object} props.nutritionResults - Résultats des calculs nutritionnels
 * @param {Function} props.onSavePlan - Fonction pour sauvegarder le plan
 * @param {boolean} props.showSaveForm - Afficher le formulaire de sauvegarde
 * @param {Function} props.setShowSaveForm - Définir l'affichage du formulaire
 * @param {string} props.planName - Nom du plan
 * @param {Function} props.setPlanName - Définir le nom du plan
 */
const MealPlan = memo(({
  mealPlan,
  nutritionResults,
  onSavePlan,
  showSaveForm,
  setShowSaveForm,
  planName,
  setPlanName
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(null);
  
  if (!mealPlan || mealPlan.length === 0) {
    return null;
  }
  
  // Fonction pour obtenir l'icône correspondant au type de repas
  const getMealIcon = (mealName) => {
    const icons = {
      breakfast: <BreakfastDiningIcon />,
      lunch: <LunchDiningIcon />,
      dinner: <DinnerDiningIcon />,
      snack: <EmojiFoodBeverageIcon />
    };
    return icons[mealName] || <RestaurantMenuIcon />;
  };
  
  // Gestion du clic sur un repas pour l'expansion
  const handleMealClick = (mealId) => {
    if (expanded === mealId) {
      setExpanded(null);
    } else {
      setExpanded(mealId);
    }
  };
  
  return (
    <Card elevation={2}>
      <CardHeader
        title={t('nutrition.meal_plan')}
        avatar={<RestaurantMenuIcon />}
        subheader={t('nutrition.meal_plan_subtitle')}
        action={
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={() => setShowSaveForm(true)}
            size="small"
          >
            {t('nutrition.save_plan')}
          </Button>
        }
      />
      
      <CardContent>
        <Grid container spacing={2}>
          {mealPlan.map((meal) => (
            <Grid item xs={12} key={meal.id}>
              <Paper 
                elevation={0} 
                variant="outlined"
                sx={{ 
                  p: 2,
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: 2,
                    cursor: 'pointer'
                  }
                }}
                onClick={() => handleMealClick(meal.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {getMealIcon(meal.name)}
                    <Typography variant="h6" sx={{ ml: 1 }}>
                      {meal.title}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Chip 
                      label={`${meal.calories} kcal`} 
                      size="small" 
                      color="primary"
                      sx={{ mr: 1 }} 
                    />
                    <Tooltip title={t('nutrition.meal_details')}>
                      <IconButton size="small">
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                
                {expanded === meal.id && (
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={4}>
                        <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                          <Typography variant="caption" display="block">
                            {t('nutrition.macros.protein')}
                          </Typography>
                          <Typography variant="subtitle1" color="success.main">
                            {meal.protein}g
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={4}>
                        <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                          <Typography variant="caption" display="block">
                            {t('nutrition.macros.carbs')}
                          </Typography>
                          <Typography variant="subtitle1" color="primary.main">
                            {meal.carbs}g
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={4}>
                        <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
                          <Typography variant="caption" display="block">
                            {t('nutrition.macros.fat')}
                          </Typography>
                          <Typography variant="subtitle1" color="warning.main">
                            {meal.fat}g
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                    
                    <Typography variant="subtitle1" gutterBottom>
                      {t('nutrition.suggested_foods')}
                    </Typography>
                    
                    <List disablePadding>
                      {meal.foods && meal.foods.map((food) => (
                        <ListItem 
                          key={food.id}
                          disablePadding
                          sx={{ 
                            py: 0.5,
                            borderBottom: '1px dashed rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          <ListItemText
                            primary={food.name}
                            secondary={`${food.calories} kcal | P: ${food.protein}g | C: ${food.carbs}g | F: ${food.fat}g`}
                            primaryTypographyProps={{ variant: 'body2' }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {food.portion}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
        
        {/* Formulaire de sauvegarde */}
        <Dialog 
          open={showSaveForm} 
          onClose={() => setShowSaveForm(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>{t('nutrition.save_meal_plan')}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label={t('nutrition.plan_name')}
              type="text"
              fullWidth
              variant="outlined"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSaveForm(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={() => onSavePlan(mealPlan, planName, nutritionResults)}
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={!planName.trim()}
            >
              {t('common.save')}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
});

export default MealPlan;
