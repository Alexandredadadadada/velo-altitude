import React, { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip,
  Avatar,
  Stack
} from '@mui/material';
import SavedSearchIcon from '@mui/icons-material/SavedSearch';
import DeleteIcon from '@mui/icons-material/Delete';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DescriptionIcon from '@mui/icons-material/Description';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import GrainIcon from '@mui/icons-material/Grain';
import RiceBowlIcon from '@mui/icons-material/RiceBowl';
import OilBarrelIcon from '@mui/icons-material/OilBarrel';

/**
 * Composant pour l'affichage et la gestion des plans de repas sauvegardés
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Array} props.savedPlans - Liste des plans sauvegardés
 * @param {Function} props.deletePlan - Fonction pour supprimer un plan
 */
const SavedPlans = memo(({
  savedPlans,
  deletePlan
}) => {
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  if (!savedPlans || savedPlans.length === 0) {
    return (
      <Card elevation={2}>
        <CardHeader
          title={t('nutrition.saved_plans')}
          avatar={<SavedSearchIcon />}
          subheader={t('nutrition.saved_plans_subtitle')}
        />
        
        <CardContent>
          <Paper 
            elevation={0} 
            variant="outlined" 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              bgcolor: 'background.default'
            }}
          >
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {t('nutrition.no_saved_plans')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('nutrition.create_plan_instruction')}
            </Typography>
          </Paper>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card elevation={2}>
      <CardHeader
        title={t('nutrition.saved_plans')}
        avatar={<SavedSearchIcon />}
        subheader={t('nutrition.saved_plans_subtitle')}
      />
      
      <CardContent>
        <Grid container spacing={2}>
          {savedPlans.map((plan) => (
            <Grid item xs={12} md={6} key={plan.id}>
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
                onClick={() => setSelectedPlan(plan)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <RestaurantIcon color="primary" />
                    <Typography variant="h6" sx={{ ml: 1 }}>
                      {plan.name}
                    </Typography>
                  </Box>
                  
                  <IconButton 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(plan);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {new Date(plan.createdAt).toLocaleDateString()}
                </Typography>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Chip 
                    icon={<WhatshotIcon />}
                    label={`${plan.nutritionSummary.calories} kcal`}
                    size="small"
                    color="primary"
                  />
                  
                  <Box>
                    <Chip 
                      avatar={<Avatar>P</Avatar>}
                      label={`${plan.macroRatio.protein}%`}
                      size="small"
                      sx={{ mr: 0.5 }}
                    />
                    <Chip 
                      avatar={<Avatar>C</Avatar>}
                      label={`${plan.macroRatio.carbs}%`}
                      size="small"
                      sx={{ mr: 0.5 }}
                    />
                    <Chip 
                      avatar={<Avatar>F</Avatar>}
                      label={`${plan.macroRatio.fat}%`}
                      size="small"
                    />
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  {t('nutrition.meal_count', { count: plan.meals.length })}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
        
        {/* Dialogue de détails du plan */}
        <Dialog 
          open={Boolean(selectedPlan)} 
          onClose={() => setSelectedPlan(null)}
          maxWidth="md"
          fullWidth
        >
          {selectedPlan && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DescriptionIcon sx={{ mr: 1 }} />
                  {selectedPlan.name}
                </Box>
              </DialogTitle>
              
              <DialogContent dividers>
                <Typography variant="caption" color="text.secondary">
                  {t('nutrition.created_on')}: {new Date(selectedPlan.createdAt).toLocaleDateString()}
                </Typography>
                
                <Paper sx={{ p: 2, my: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {t('nutrition.nutrition_summary')}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <WhatshotIcon color="error" />
                        <Typography variant="body1">
                          {selectedPlan.nutritionSummary.calories} kcal
                        </Typography>
                      </Stack>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <GrainIcon color="success" />
                        <Typography variant="body2">
                          {t('nutrition.macros.protein')}: {selectedPlan.nutritionSummary.protein}g ({selectedPlan.macroRatio.protein}%)
                        </Typography>
                      </Stack>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <RiceBowlIcon color="primary" />
                        <Typography variant="body2">
                          {t('nutrition.macros.carbs')}: {selectedPlan.nutritionSummary.carbs}g ({selectedPlan.macroRatio.carbs}%)
                        </Typography>
                      </Stack>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <OilBarrelIcon color="warning" />
                        <Typography variant="body2">
                          {t('nutrition.macros.fat')}: {selectedPlan.nutritionSummary.fat}g ({selectedPlan.macroRatio.fat}%)
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </Paper>
                
                <Typography variant="h6" gutterBottom>
                  {t('nutrition.meals')}
                </Typography>
                
                <List>
                  {selectedPlan.meals.map((meal) => (
                    <ListItem key={meal.id} alignItems="flex-start">
                      <ListItemText
                        primary={meal.title}
                        secondary={
                          <>
                            <Typography variant="body2" component="span" display="block">
                              {t('nutrition.calories')}: {meal.calories} kcal | 
                              P: {meal.protein}g | 
                              C: {meal.carbs}g | 
                              F: {meal.fat}g
                            </Typography>
                            
                            {meal.foods && meal.foods.length > 0 && (
                              <List dense disablePadding>
                                {meal.foods.map((food) => (
                                  <ListItem key={food.id} dense disablePadding>
                                    <ListItemText
                                      primary={food.name}
                                      secondary={`${food.calories} kcal | P: ${food.protein}g | C: ${food.carbs}g | F: ${food.fat}g`}
                                      primaryTypographyProps={{ variant: 'body2' }}
                                      secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </DialogContent>
              
              <DialogActions>
                <Button onClick={() => setSelectedPlan(null)}>
                  {t('common.close')}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
        
        {/* Dialogue de confirmation de suppression */}
        <Dialog 
          open={Boolean(confirmDelete)} 
          onClose={() => setConfirmDelete(null)}
        >
          <DialogTitle>
            {t('nutrition.confirm_delete')}
          </DialogTitle>
          
          <DialogContent>
            <Typography variant="body1">
              {t('nutrition.delete_plan_confirmation', { name: confirmDelete?.name })}
            </Typography>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setConfirmDelete(null)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={() => {
                deletePlan(confirmDelete.id);
                setConfirmDelete(null);
              }}
              color="error"
            >
              {t('common.delete')}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
});

export default SavedPlans;
