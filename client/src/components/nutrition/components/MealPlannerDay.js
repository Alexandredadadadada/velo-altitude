import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  LinearProgress,
  IconButton,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Paper,
  useTheme
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ArrowDownward as ArrowDownIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { Droppable, Draggable } from 'react-beautiful-dnd';

/**
 * Affiche une journée dans le planificateur de repas
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.day - Données du jour
 * @param {Object} props.dayTotals - Totaux nutritionnels du jour
 * @param {Object} props.nutritionTarget - Objectifs nutritionnels
 * @param {Function} props.onRemoveMeal - Fonction pour supprimer un repas
 * @param {boolean} props.isMobile - Indique si l'affichage est sur mobile
 */
export const MealPlannerDay = ({ day, dayTotals, nutritionTarget, onRemoveMeal, isMobile }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  
  // Calcul des pourcentages pour la barre de progression
  const caloriesPercent = Math.min(100, Math.round((dayTotals.calories / (nutritionTarget.calories || 2000)) * 100));
  const proteinPercent = Math.min(100, Math.round((dayTotals.protein / (nutritionTarget.protein || 150)) * 100));
  const carbsPercent = Math.min(100, Math.round((dayTotals.carbs / (nutritionTarget.carbs || 200)) * 100));
  const fatPercent = Math.min(100, Math.round((dayTotals.fat / (nutritionTarget.fat || 55)) * 100));
  
  // Définir les couleurs en fonction du pourcentage
  const getProgressColor = (percent) => {
    if (percent < 70) return theme.palette.warning.main;
    if (percent > 110) return theme.palette.error.main;
    return theme.palette.success.main;
  };
  
  /**
   * Formater la date pour l'affichage
   * 
   * @param {string} dateStr - Date au format YYYY-MM-DD
   * @returns {string} Date formatée
   */
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    
    const options = { 
      weekday: isMobile ? 'short' : 'long', 
      day: 'numeric', 
      month: 'short'
    };
    
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };
  
  /**
   * Vérifier s'il s'agit du jour actuel
   * 
   * @param {string} dateStr - Date au format YYYY-MM-DD
   * @returns {boolean} Vrai si c'est le jour actuel
   */
  const isToday = (dateStr) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    return dateStr === todayStr;
  };
  
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        ...(isToday(day.date) && {
          borderColor: theme.palette.primary.main,
          borderWidth: 2,
        }),
      }}
    >
      <CardHeader
        title={
          <Typography variant={isMobile ? "body1" : "h6"} component="h3">
            {formatDate(day.date)}
            {isToday(day.date) && (
              <Chip
                label={t('nutrition.planner.today')}
                color="primary"
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        }
        sx={{
          backgroundColor: theme.palette.grey[100],
          pb: 1,
        }}
      />
      
      <CardContent sx={{ p: 1, "&:last-child": { pb: 1 } }}>
        {/* Synthèse nutritionnelle du jour */}
        <Paper elevation={0} sx={{ p: 1, mb: 1, bgcolor: theme.palette.grey[50] }}>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            <strong>{t('nutrition.macros.daily_calories')}:</strong> {dayTotals.calories} / {nutritionTarget.calories || '?'} kcal
          </Typography>
          <LinearProgress
            variant="determinate"
            value={caloriesPercent}
            sx={{
              mb: 1,
              height: 8,
              borderRadius: 5,
              bgcolor: theme.palette.grey[200],
              '& .MuiLinearProgress-bar': {
                bgcolor: getProgressColor(caloriesPercent),
              },
            }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Tooltip title={`${t('nutrition.macros.protein')}: ${dayTotals.protein}g / ${nutritionTarget.protein || '?'}g`}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
                <Typography variant="caption">P</Typography>
                <LinearProgress
                  variant="determinate"
                  value={proteinPercent}
                  sx={{
                    width: '100%',
                    height: 6,
                    borderRadius: 5,
                    bgcolor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getProgressColor(proteinPercent),
                    },
                  }}
                />
              </Box>
            </Tooltip>
            
            <Tooltip title={`${t('nutrition.macros.carbs')}: ${dayTotals.carbs}g / ${nutritionTarget.carbs || '?'}g`}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
                <Typography variant="caption">C</Typography>
                <LinearProgress
                  variant="determinate"
                  value={carbsPercent}
                  sx={{
                    width: '100%',
                    height: 6,
                    borderRadius: 5,
                    bgcolor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getProgressColor(carbsPercent),
                    },
                  }}
                />
              </Box>
            </Tooltip>
            
            <Tooltip title={`${t('nutrition.macros.fat')}: ${dayTotals.fat}g / ${nutritionTarget.fat || '?'}g`}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
                <Typography variant="caption">F</Typography>
                <LinearProgress
                  variant="determinate"
                  value={fatPercent}
                  sx={{
                    width: '100%',
                    height: 6,
                    borderRadius: 5,
                    bgcolor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      bgcolor: getProgressColor(fatPercent),
                    },
                  }}
                />
              </Box>
            </Tooltip>
          </Box>
        </Paper>
        
        {/* Zone de dépôt pour le glisser-déposer */}
        <Droppable droppableId={`day-${day.date}`}>
          {(provided, snapshot) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{
                minHeight: 100,
                bgcolor: snapshot.isDraggingOver ? theme.palette.action.hover : 'transparent',
                transition: 'background-color 0.2s ease',
                borderRadius: 1,
                p: 1,
              }}
            >
              {day.meals.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 100,
                    color: theme.palette.text.secondary,
                    border: `1px dashed ${theme.palette.divider}`,
                    borderRadius: 1,
                  }}
                >
                  <ArrowDownIcon color="action" />
                  <Typography variant="body2" align="center">
                    {t('nutrition.planner.drop_meals_here')}
                  </Typography>
                </Box>
              ) : (
                <List dense disablePadding>
                  {day.meals.map((meal, index) => (
                    <Draggable key={meal.id} draggableId={meal.id} index={index}>
                      {(provided, snapshot) => (
                        <ListItem
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{
                            mb: 1,
                            p: 1,
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.divider}`,
                            bgcolor: snapshot.isDragging
                              ? theme.palette.primary.light
                              : theme.palette.background.paper,
                            '&:hover': {
                              bgcolor: theme.palette.action.hover,
                            },
                            transition: 'transform 0.2s, background-color 0.2s',
                            transform: snapshot.isDragging ? 'scale(1.02)' : 'scale(1)',
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography variant="subtitle2" component="span">
                                {meal.title}
                              </Typography>
                            }
                            secondary={
                              <React.Fragment>
                                <Typography variant="caption" display="block">
                                  {`${meal.calories} kcal | ${meal.protein}g P | ${meal.carbs}g C | ${meal.fat}g F`}
                                </Typography>
                                <Box sx={{ mt: 0.5 }}>
                                  {meal.foods.slice(0, 2).map((food) => (
                                    <Chip
                                      key={food.id}
                                      label={food.name}
                                      size="small"
                                      sx={{ mr: 0.5, mb: 0.5, fontSize: '0.7rem' }}
                                    />
                                  ))}
                                  {meal.foods.length > 2 && (
                                    <Chip
                                      label={`+${meal.foods.length - 2}`}
                                      size="small"
                                      variant="outlined"
                                      sx={{ mb: 0.5, fontSize: '0.7rem' }}
                                    />
                                  )}
                                </Box>
                              </React.Fragment>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Tooltip title={t('common.delete')}>
                              <IconButton 
                                edge="end" 
                                aria-label="delete"
                                onClick={() => onRemoveMeal(meal.id)}
                                size="small"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                      )}
                    </Draggable>
                  ))}
                </List>
              )}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </CardContent>
    </Card>
  );
};

export default MealPlannerDay;
