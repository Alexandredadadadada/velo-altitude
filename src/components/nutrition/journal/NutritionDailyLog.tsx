import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  Divider,
  Chip,
  Button,
  useTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  LinearProgress,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  WarningAmber as WarningAmberIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { format, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

ChartJS.register(ArcElement, ChartTooltip, Legend);

// Fonction pour formater la date 
const formatDate = (date: Date): string => {
  return format(date, 'EEEE d MMMM yyyy', { locale: fr });
};

// Fonction pour trouver le nom de la catégorie de repas
const getMealCategoryName = (categoryId: string): string => {
  const categories: { [key: string]: string } = {
    'breakfast': 'Petit-déjeuner',
    'morning_snack': 'Collation matinale',
    'lunch': 'Déjeuner',
    'afternoon_snack': 'Collation après-midi',
    'pre_workout': 'Avant entraînement',
    'during_workout': 'Pendant entraînement',
    'post_workout': 'Après entraînement',
    'dinner': 'Dîner',
    'evening_snack': 'Collation nocturne'
  };
  
  return categories[categoryId] || categoryId;
};

interface NutritionDailyLogProps {
  entries: any[];
  date: Date;
  onDateChange: (date: Date) => void;
  onDeleteEntry: (entryId: string) => void;
  nutritionPlan?: any;
  onEditEntry?: (entry: any) => void;
}

const NutritionDailyLog: React.FC<NutritionDailyLogProps> = ({
  entries,
  date,
  onDateChange,
  onDeleteEntry,
  nutritionPlan,
  onEditEntry
}) => {
  const theme = useTheme();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [dailySummary, setDailySummary] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  const [calorieTarget, setCalorieTarget] = useState(2000); // Valeur par défaut
  const [macroTargets, setMacroTargets] = useState({
    protein: 0,
    carbs: 0,
    fat: 0
  });

  // Calculer les totaux quotidiens
  useEffect(() => {
    if (entries.length === 0) {
      setDailySummary({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      });
      return;
    }

    const totals = entries.reduce((acc, entry) => {
      if (entry.nutritionSummary) {
        return {
          calories: acc.calories + entry.nutritionSummary.calories,
          protein: acc.protein + entry.nutritionSummary.protein,
          carbs: acc.carbs + entry.nutritionSummary.carbs,
          fat: acc.fat + entry.nutritionSummary.fat
        };
      }
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    setDailySummary(totals);
  }, [entries]);

  // Définir les objectifs en fonction du plan nutritionnel
  useEffect(() => {
    if (nutritionPlan) {
      setCalorieTarget(nutritionPlan.dailyCalories);
      
      const proteinGrams = Math.round(nutritionPlan.dailyCalories * nutritionPlan.macroRatio.protein / 100 / 4);
      const carbsGrams = Math.round(nutritionPlan.dailyCalories * nutritionPlan.macroRatio.carbs / 100 / 4);
      const fatGrams = Math.round(nutritionPlan.dailyCalories * nutritionPlan.macroRatio.fat / 100 / 9);
      
      setMacroTargets({
        protein: proteinGrams,
        carbs: carbsGrams,
        fat: fatGrams
      });
    } else {
      // Valeurs par défaut si aucun plan n'est lié
      setCalorieTarget(2000);
      setMacroTargets({
        protein: 125, // ~25% des calories
        carbs: 250,   // ~50% des calories
        fat: 55       // ~25% des calories
      });
    }
  }, [nutritionPlan]);

  // Configuration des données pour le graphique en anneau
  const chartData = {
    labels: ['Protéines', 'Glucides', 'Lipides'],
    datasets: [
      {
        data: [dailySummary.protein * 4, dailySummary.carbs * 4, dailySummary.fat * 9],
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.info.main,
          theme.palette.warning.main
        ],
        borderColor: [
          theme.palette.primary.dark,
          theme.palette.info.dark,
          theme.palette.warning.dark
        ],
        borderWidth: 1
      }
    ]
  };

  // Options du graphique
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${value} kcal (${Math.round(value / dailySummary.calories * 100)}%)`;
          }
        }
      }
    },
    cutout: '70%'
  };

  // Changement de jour
  const handlePreviousDay = () => {
    onDateChange(subDays(date, 1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(date, 1));
  };

  const handleTodayClick = () => {
    onDateChange(new Date());
  };

  // Gestion de la suppression
  const handleDeleteClick = (entryId: string) => {
    setConfirmDeleteId(entryId);
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteId) {
      onDeleteEntry(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  // Calcul du pourcentage des objectifs atteints
  const calculatePercentage = (value: number, target: number) => {
    if (target === 0) return 0;
    const percentage = (value / target) * 100;
    return Math.min(percentage, 100); // Cap à 100%
  };

  return (
    <>
      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={!!confirmDeleteId}
        onClose={handleCancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Êtes-vous sûr de vouloir supprimer cette entrée du journal alimentaire ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Annuler</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sélecteur de date */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handlePreviousDay} aria-label="jour précédent">
            <ChevronLeftIcon />
          </IconButton>
          
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              mx: 1, 
              fontWeight: 'medium',
              textTransform: 'capitalize'
            }}
          >
            {formatDate(date)}
          </Typography>
          
          <IconButton onClick={handleNextDay} aria-label="jour suivant">
            <ChevronRightIcon />
          </IconButton>
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<TodayIcon />}
            onClick={handleTodayClick}
            sx={{ ml: 2 }}
          >
            Aujourd'hui
          </Button>
        </Box>
        
        <DatePicker
          label="Sélectionner une date"
          value={date}
          onChange={(newDate) => {
            if (newDate) {
              onDateChange(newDate);
            }
          }}
          renderInput={(params) => <Box component="div" sx={{ display: 'none' }}>{params.inputProps.value}</Box>}
        />
      </Box>

      {/* Récapitulatif journalier */}
      <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Récapitulatif journalier
            </Typography>
            
            <Box sx={{ height: 200, position: 'relative', mb: 2 }}>
              <Doughnut data={chartData} options={chartOptions} />
              {dailySummary.calories > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}
                >
                  <Typography variant="h5" component="div">
                    {dailySummary.calories}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    kcal
                  </Typography>
                </Box>
              )}
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Chip 
                label={`Objectif: ${calorieTarget} kcal`} 
                color="primary" 
                variant="outlined"
                size="small"
              />
              
              {dailySummary.calories > 0 && (
                <Typography 
                  variant="caption" 
                  component="div" 
                  color={dailySummary.calories > calorieTarget ? "error.main" : "success.main"}
                  sx={{ mt: 1 }}
                >
                  {dailySummary.calories < calorieTarget ? 
                    `${calorieTarget - dailySummary.calories} kcal restantes` : 
                    `${dailySummary.calories - calorieTarget} kcal en excès`}
                </Typography>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Progression des macronutriments
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Protéines</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {dailySummary.protein}g / {macroTargets.protein}g
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={calculatePercentage(dailySummary.protein, macroTargets.protein)}
                sx={{ 
                  height: 10, 
                  borderRadius: 5,
                  bgcolor: `${theme.palette.primary.main}20`,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: theme.palette.primary.main
                  }
                }}
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Glucides</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {dailySummary.carbs}g / {macroTargets.carbs}g
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={calculatePercentage(dailySummary.carbs, macroTargets.carbs)}
                sx={{ 
                  height: 10, 
                  borderRadius: 5,
                  bgcolor: `${theme.palette.info.main}20`,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: theme.palette.info.main
                  }
                }}
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Lipides</Typography>
                <Typography variant="body2" fontWeight="medium">
                  {dailySummary.fat}g / {macroTargets.fat}g
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={calculatePercentage(dailySummary.fat, macroTargets.fat)}
                sx={{ 
                  height: 10, 
                  borderRadius: 5,
                  bgcolor: `${theme.palette.warning.main}20`,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: theme.palette.warning.main
                  }
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 4 }}>
              {dailySummary.calories > 0 ? (
                <>
                  <Chip 
                    icon={<CheckCircleIcon />} 
                    label={`${Math.round(dailySummary.protein * 4 / dailySummary.calories * 100)}% de protéines`} 
                    color="primary" 
                    variant="outlined" 
                  />
                  <Chip 
                    icon={<CheckCircleIcon />} 
                    label={`${Math.round(dailySummary.carbs * 4 / dailySummary.calories * 100)}% de glucides`} 
                    color="info" 
                    variant="outlined" 
                  />
                  <Chip 
                    icon={<CheckCircleIcon />} 
                    label={`${Math.round(dailySummary.fat * 9 / dailySummary.calories * 100)}% de lipides`} 
                    color="warning" 
                    variant="outlined" 
                  />
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Aucune donnée nutritionnelle pour cette journée
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Liste des repas */}
      <Typography variant="h6" gutterBottom>
        Repas de la journée
      </Typography>
      
      {entries.length === 0 ? (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 2
          }}
        >
          <Typography variant="body1" paragraph>
            Aucun repas enregistré pour cette journée
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
          >
            Ajouter un repas
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {entries
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((entry) => (
              <Grid item xs={12} key={entry.id}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ pb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Chip 
                            label={entry.time} 
                            size="small" 
                            color="primary" 
                            sx={{ mr: 2 }} 
                          />
                          <Typography variant="h6" component="div">
                            {getMealCategoryName(entry.mealCategory)}
                          </Typography>
                        </Box>
                        
                        {entry.notes && (
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {entry.notes}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box>
                        <Tooltip title="Modifier">
                          <IconButton 
                            size="small" 
                            onClick={() => onEditEntry && onEditEntry(entry)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Supprimer">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteClick(entry.id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ mb: 2 }} />
                    
                    <Grid container spacing={2}>
                      {/* Aliments du repas */}
                      <Grid item xs={12} md={8}>
                        <Typography variant="subtitle2" gutterBottom>
                          Aliments ({entry.foods.length})
                        </Typography>
                        
                        <Box sx={{ maxHeight: 300, overflow: 'auto', pr: 1 }}>
                          {entry.foods.map((food: any, index: number) => (
                            <Paper 
                              key={index} 
                              variant="outlined" 
                              sx={{ 
                                p: 1, 
                                mb: 1, 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar 
                                  sx={{ 
                                    width: 32, 
                                    height: 32, 
                                    mr: 2,
                                    bgcolor: food.isCustom ? theme.palette.info.light : theme.palette.primary.light,
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  {food.name.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2">
                                    {food.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {food.quantity}g
                                  </Typography>
                                </Box>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip 
                                  label={`${food.calories} kcal`} 
                                  size="small" 
                                  sx={{ 
                                    height: 24,
                                    fontSize: '0.7rem'
                                  }} 
                                />
                                
                                <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                  P: {food.protein}g • G: {food.carbs}g • L: {food.fat}g
                                </Typography>
                              </Box>
                            </Paper>
                          ))}
                        </Box>
                      </Grid>
                      
                      {/* Résumé du repas */}
                      <Grid item xs={12} md={4}>
                        <Typography variant="subtitle2" gutterBottom>
                          Résumé du repas
                        </Typography>
                        
                        <Box 
                          sx={{ 
                            bgcolor: theme.palette.grey[50], 
                            p: 2, 
                            borderRadius: 1,
                            height: 'calc(100% - 24px)'
                          }}
                        >
                          <Grid container spacing={1}>
                            <Grid item xs={12}>
                              <Box sx={{ textAlign: 'center', mb: 2 }}>
                                <Typography variant="h5" component="div" color="error.main">
                                  {entry.nutritionSummary?.calories || 0} kcal
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                  Protéines
                                </Typography>
                                <Typography variant="body1" color="primary.main" fontWeight="medium">
                                  {entry.nutritionSummary?.protein || 0}g
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {Math.round((entry.nutritionSummary?.protein || 0) * 4 / (entry.nutritionSummary?.calories || 1) * 100)}%
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                  Glucides
                                </Typography>
                                <Typography variant="body1" color="info.main" fontWeight="medium">
                                  {entry.nutritionSummary?.carbs || 0}g
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {Math.round((entry.nutritionSummary?.carbs || 0) * 4 / (entry.nutritionSummary?.calories || 1) * 100)}%
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid item xs={4}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                  Lipides
                                </Typography>
                                <Typography variant="body1" color="warning.main" fontWeight="medium">
                                  {entry.nutritionSummary?.fat || 0}g
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {Math.round((entry.nutritionSummary?.fat || 0) * 9 / (entry.nutritionSummary?.calories || 1) * 100)}%
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>
      )}
    </>
  );
};

export default NutritionDailyLog;
