import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Tooltip,
  Divider,
  Paper,
  useTheme
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  CheckCircle,
  AccessTime,
  DirectionsBike,
  TrendingUp,
  Speed,
  Whatshot,
  FlagCircle
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { fr } from 'date-fns/locale';
import trainingService from '../../services/trainingService';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatDistance, formatDuration, formatPercentage } from '../../utils/formatters';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * Composant pour la gestion des objectifs d'entraînement
 */
const TrainingGoals = () => {
  const theme = useTheme();
  const { user } = useAuth();
  
  // États pour les données et l'interface
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    type: 'distance',
    target: 0,
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    description: ''
  });
  
  // Types d'objectifs possibles
  const goalTypes = [
    { value: 'distance', label: 'Distance (km)', icon: <DirectionsBike /> },
    { value: 'elevation', label: 'Dénivelé (m)', icon: <TrendingUp /> },
    { value: 'duration', label: 'Durée (heures)', icon: <AccessTime /> },
    { value: 'speed', label: 'Vitesse moyenne (km/h)', icon: <Speed /> },
    { value: 'calories', label: 'Calories (kcal)', icon: <Whatshot /> },
    { value: 'activities', label: 'Nombre de sorties', icon: <FlagCircle /> }
  ];
  
  // Charger les objectifs d'entraînement
  useEffect(() => {
    const fetchGoals = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const data = await trainingService.getTrainingGoals(user.id);
        setGoals(data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des objectifs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGoals();
  }, [user]);
  
  // Ouvrir la boîte de dialogue d'ajout d'objectif
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };
  
  // Fermer la boîte de dialogue
  const handleCloseDialog = () => {
    setOpenDialog(false);
    // Réinitialiser le formulaire
    setNewGoal({
      title: '',
      type: 'distance',
      target: 0,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      description: ''
    });
  };
  
  // Gérer les changements dans le formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGoal(prev => ({ ...prev, [name]: value }));
  };
  
  // Gérer le changement de date
  const handleDateChange = (name, date) => {
    setNewGoal(prev => ({ ...prev, [name]: date }));
  };
  
  // Créer un nouvel objectif
  const handleCreateGoal = async () => {
    try {
      const goalData = {
        ...newGoal,
        userId: user.id,
        progress: 0,
        completed: false,
        createdAt: new Date()
      };
      
      const createdGoal = await trainingService.createTrainingGoal(goalData);
      setGoals(prev => [...prev, createdGoal]);
      handleCloseDialog();
    } catch (error) {
      console.error('Erreur lors de la création de l\'objectif:', error);
    }
  };
  
  // Supprimer un objectif
  const handleDeleteGoal = async (goalId) => {
    try {
      await trainingService.deleteTrainingGoal(goalId);
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'objectif ${goalId}:`, error);
    }
  };
  
  // Obtenir la couleur correspondant au progrès
  const getProgressColor = (progress) => {
    if (progress < 25) return theme.palette.error.main;
    if (progress < 50) return theme.palette.warning.main;
    if (progress < 75) return theme.palette.info.main;
    return theme.palette.success.main;
  };
  
  // Obtenir l'icône correspondant au type d'objectif
  const getGoalTypeIcon = (type) => {
    const goalType = goalTypes.find(gt => gt.value === type);
    return goalType ? goalType.icon : <FlagCircle />;
  };

  // Formater la valeur cible en fonction du type d'objectif
  const formatTargetValue = (type, value) => {
    switch (type) {
      case 'distance':
        return formatDistance(value);
      case 'duration':
        return formatDuration(value * 3600); // Convertir heures en secondes
      case 'elevation':
        return `${value} m`;
      case 'speed':
        return `${value} km/h`;
      case 'calories':
        return `${value} kcal`;
      case 'activities':
        return `${value} sorties`;
      default:
        return value;
    }
  };
  
  // Vérifier si l'objectif est en retard
  const isGoalBehindSchedule = (goal) => {
    if (goal.completed) return false;
    
    const now = new Date();
    const start = new Date(goal.startDate);
    const end = new Date(goal.endDate);
    
    // Calculer le pourcentage de temps écoulé
    const totalDuration = end - start;
    const elapsed = now - start;
    const timePercentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    
    // L'objectif est en retard si le pourcentage de progrès est significativement 
    // inférieur au pourcentage de temps écoulé
    return (timePercentage - goal.progress) > 15;
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "ExercisePlan",
          "name": "Programme d'Entraînement Cycliste",
          "description": "Plans d'entraînement spécifiques pour préparer les ascensions de cols.",
          "url": "https://velo-altitude.com/traininggoals"
        }
      </script>
      <EnhancedMetaTags
        title="Programmes d'Entraînement | Velo-Altitude"
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="article"
        imageUrl="/images/og-image.jpg"
      />
  };
  
  return (
    <Box className="training-goals-container">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Objectifs d'entraînement
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenDialog}
        >
          Nouvel objectif
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <LinearProgress sx={{ width: '100%' }} />
        </Box>
      ) : goals.length === 0 ? (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 3, 
            textAlign: 'center',
            borderStyle: 'dashed',
            borderColor: theme.palette.divider
          }}
        >
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Vous n'avez pas encore d'objectifs d'entraînement.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleOpenDialog}
            sx={{ mt: 1 }}
          >
            Créer votre premier objectif
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {goals.map((goal) => (
            <Grid item xs={12} sm={6} md={4} key={goal.id}>
              <Card 
                variant="outlined" 
                sx={{ 
                  height: '100%',
                  position: 'relative',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  },
                  bgcolor: goal.completed ? 'rgba(76, 175, 80, 0.08)' : 'background.paper'
                }}
              >
                {/* Badge de statut */}
                {goal.completed ? (
                  <Chip
                    icon={<CheckCircle fontSize="small" />}
                    label="Objectif atteint"
                    color="success"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 1
                    }}
                  />
                ) : isGoalBehindSchedule(goal) && (
                  <Chip
                    icon={<AccessTime fontSize="small" />}
                    label="En retard"
                    color="warning"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 1
                    }}
                  />
                )}
                
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ mr: 1, color: theme.palette.primary.main }}>
                      {getGoalTypeIcon(goal.type)}
                    </Box>
                    <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
                      {goal.title}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {goal.description}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        Progrès
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatPercentage(goal.progress / 100, 0)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={goal.progress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.palette.grey[200],
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          backgroundColor: getProgressColor(goal.progress)
                        }
                      }}
                    />
                  </Box>
                  
                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Objectif
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {formatTargetValue(goal.type, goal.target)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Échéance
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(goal.endDate)}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Tooltip title="Modifier">
                      <IconButton size="small" color="primary" sx={{ mr: 1 }}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Boîte de dialogue pour créer un nouvel objectif */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Créer un nouvel objectif</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Titre de l'objectif"
              name="title"
              value={newGoal.title}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              select
              label="Type d'objectif"
              name="type"
              value={newGoal.type}
              onChange={handleInputChange}
              margin="normal"
              required
            >
              {goalTypes.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                      {option.icon}
                    </Box>
                    {option.label}
                  </Box>
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              fullWidth
              label={`Objectif (${
                newGoal.type === 'distance' ? 'km' :
                newGoal.type === 'duration' ? 'heures' :
                newGoal.type === 'elevation' ? 'm' :
                newGoal.type === 'speed' ? 'km/h' :
                newGoal.type === 'calories' ? 'kcal' : 'sorties'
              })`}
              name="target"
              type="number"
              value={newGoal.target}
              onChange={handleInputChange}
              margin="normal"
              required
              InputProps={{
                inputProps: { min: 1 }
              }}
            />
            
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
              <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
                <DatePicker
                  label="Date de début"
                  value={newGoal.startDate}
                  onChange={(date) => handleDateChange('startDate', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <DatePicker
                  label="Date de fin"
                  value={newGoal.endDate}
                  onChange={(date) => handleDateChange('endDate', date)}
                  slotProps={{ textField: { fullWidth: true } }}
                  minDate={newGoal.startDate}
                />
              </Box>
            </LocalizationProvider>
            
            <TextField
              fullWidth
              label="Description (optionnel)"
              name="description"
              value={newGoal.description}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button 
            variant="contained" 
            onClick={handleCreateGoal}
            disabled={!newGoal.title || newGoal.target <= 0}
          >
            Créer l'objectif
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrainingGoals;
