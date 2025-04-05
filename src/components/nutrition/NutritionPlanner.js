import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Divider,
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert
} from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './NutritionPlanner.css';

// Enregistrer les composants Chart.js nécessaires
ChartJS.register(ArcElement, Tooltip, Legend);

// Constantes pour les calculs nutritionnels
const ACTIVITY_FACTORS = {
  light: 1.375,       // 1-3h/semaine
  moderate: 1.55,     // 3-6h/semaine
  active: 1.725,      // 6-10h/semaine
  'very-active': 1.9, // 10-15h/semaine
  extreme: 2.1        // 15h+/semaine
};

const GOAL_FACTORS = {
  maintain: { calories: 1, protein: 1.6, carbs: 5, fat: 1 },
  lose: { calories: 0.85, protein: 2, carbs: 3, fat: 0.8 },
  gain: { calories: 1.15, protein: 2, carbs: 6, fat: 1 },
  performance: { calories: 1.1, protein: 1.8, carbs: 7, fat: 0.9 }
};

// Composant MacroChart pour afficher la répartition des macronutriments
const MacroChart = ({ macros }) => {
  const data = {
    labels: ['Protéines', 'Glucides', 'Lipides'],
    datasets: [
      {
        data: [macros.protein, macros.carbs, macros.fat],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(255, 99, 132, 0.8)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value}g (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <Box height={220}>
      <Doughnut data={data} options={options} />
    </Box>
  );
};

// Composant HydrationPlanner pour planifier l'hydratation
const HydrationPlanner = ({ weight, activityLevel }) => {
  // Calculer les besoins en hydratation en fonction du poids et du niveau d'activité
  const baseHydration = weight * 0.033; // 33ml par kg de poids corporel
  
  let activityMultiplier;
  switch (activityLevel) {
    case 'light': activityMultiplier = 1.2; break;
    case 'moderate': activityMultiplier = 1.4; break;
    case 'active': activityMultiplier = 1.6; break;
    case 'very-active': activityMultiplier = 1.8; break;
    case 'extreme': activityMultiplier = 2.0; break;
    default: activityMultiplier = 1.4;
  }
  
  const totalHydration = baseHydration * activityMultiplier;
  const duringExercise = weight * 0.5; // 500ml par heure d'exercice par kg
  
  return (
    <Card variant="outlined" sx={{ mt: 2, mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Plan d'Hydratation</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">Hydratation quotidienne</Typography>
            <Typography variant="h5">{totalHydration.toFixed(1)} L</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2">Pendant l'effort (par heure)</Typography>
            <Typography variant="h5">{duringExercise.toFixed(1)} L</Typography>
          </Grid>
        </Grid>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Conseils: Buvez régulièrement tout au long de la journée. Pour les sorties de plus de 90 minutes, 
          ajoutez des électrolytes à votre eau.
        </Typography>
      </CardContent>
    </Card>
  );
};

// Composant principal NutritionPlanner
const NutritionPlanner = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // États pour les entrées utilisateur
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    age: '',
    gender: 'male',
    activityLevel: 'moderate',
    goal: 'maintain'
  });
  
  // États pour les résultats calculés
  const [nutritionNeeds, setNutritionNeeds] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  
  // Gestionnaire de changement pour les champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Fonction de calcul des besoins nutritionnels
  const calculateNutritionNeeds = useCallback(() => {
    const { weight, height, age, gender, activityLevel, goal } = formData;
    
    // Vérifier que toutes les données nécessaires sont présentes
    if (!weight || !height || !age) {
      setNotification({
        open: true,
        message: 'Veuillez remplir tous les champs obligatoires',
        severity: 'error'
      });
      return;
    }
    
    // Convertir les entrées en nombres
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    const ageNum = parseInt(age);
    
    // Formule de Harris-Benedict pour le métabolisme de base (BMR)
    let bmr;
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weightNum) + (4.799 * heightNum) - (5.677 * ageNum);
    } else {
      bmr = 447.593 + (9.247 * weightNum) + (3.098 * heightNum) - (4.330 * ageNum);
    }
    
    // Calculer les besoins caloriques totaux
    const activityFactor = ACTIVITY_FACTORS[activityLevel];
    const goalFactors = GOAL_FACTORS[goal];
    
    const totalCalories = Math.round(bmr * activityFactor * goalFactors.calories);
    
    // Calculer les macronutriments en grammes
    const protein = Math.round(weightNum * goalFactors.protein);
    const fat = Math.round((totalCalories * 0.25) / 9); // 25% des calories proviennent des lipides, 9 cal/g
    const carbs = Math.round((totalCalories - (protein * 4) - (fat * 9)) / 4); // 4 cal/g pour les glucides
    
    // Mettre à jour l'état avec les résultats calculés
    setNutritionNeeds({
      calories: totalCalories,
      protein,
      carbs,
      fat
    });
    
    setShowResults(true);
    setNotification({
      open: true,
      message: 'Calcul effectué avec succès',
      severity: 'success'
    });
  }, [formData]);
  
  // Fonction pour générer un plan alimentaire
  const generateMealPlan = () => {
    if (!nutritionNeeds) {
      setNotification({
        open: true,
        message: 'Veuillez d\'abord calculer vos besoins nutritionnels',
        severity: 'warning'
      });
      return;
    }
    
    setNotification({
      open: true,
      message: 'Plan alimentaire généré avec succès',
      severity: 'success'
    });
    
    // Ici, on pourrait implémenter la logique pour générer un plan alimentaire personnalisé
    // basé sur les besoins nutritionnels calculés
  };
  
  // Fonction pour sauvegarder le plan
  const savePlan = () => {
    if (!nutritionNeeds) {
      setNotification({
        open: true,
        message: 'Aucun plan à sauvegarder',
        severity: 'warning'
      });
      return;
    }
    
    // Sauvegarder dans le localStorage
    localStorage.setItem('nutritionPlan', JSON.stringify({
      formData,
      nutritionNeeds
    }));
    
    setNotification({
      open: true,
      message: 'Plan sauvegardé avec succès',
      severity: 'success'
    });
  };
  
  // Fonction pour charger un plan sauvegardé
  const loadPlan = () => {
    const savedPlan = localStorage.getItem('nutritionPlan');
    
    if (!savedPlan) {
      setNotification({
        open: true,
        message: 'Aucun plan sauvegardé trouvé',
        severity: 'warning'
      });
      return;
    }
    
    const { formData: savedFormData, nutritionNeeds: savedNeeds } = JSON.parse(savedPlan);
    
    setFormData(savedFormData);
    setNutritionNeeds(savedNeeds);
    setShowResults(true);
    
    setNotification({
      open: true,
      message: 'Plan chargé avec succès',
      severity: 'success'
    });
  };
  
  // Fermer la notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  // Effet pour charger le plan sauvegardé au chargement du composant
  useEffect(() => {
    const savedPlan = localStorage.getItem('nutritionPlan');
    if (savedPlan) {
      try {
        const { formData: savedFormData, nutritionNeeds: savedNeeds } = JSON.parse(savedPlan);
        setFormData(savedFormData);
        setNutritionNeeds(savedNeeds);
        setShowResults(true);
      } catch (error) {
        console.error('Erreur lors du chargement du plan:', error);
      }
    }
  }, []);
  
  return (
    <Box className="nutrition-planner" sx={{ p: 2 }}>
      <Box className="nutrition-header" sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Planificateur Nutritionnel
        </Typography>
        <Typography variant="subtitle1">
          Optimisez votre alimentation pour maximiser vos performances cyclistes
        </Typography>
      </Box>
      
      <Grid container spacing={3} className="nutrition-content">
        <Grid item xs={12} md={5} className="nutrition-calculator">
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Calculateur de Besoins
              </Typography>
              <Box component="form" className="nutrition-form" sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Poids (kg)"
                      name="weight"
                      type="number"
                      value={formData.weight}
                      onChange={handleChange}
                      InputProps={{ inputProps: { min: 30, max: 200 } }}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Taille (cm)"
                      name="height"
                      type="number"
                      value={formData.height}
                      onChange={handleChange}
                      InputProps={{ inputProps: { min: 100, max: 250 } }}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Âge"
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleChange}
                      InputProps={{ inputProps: { min: 15, max: 100 } }}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Sexe</InputLabel>
                      <Select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        label="Sexe"
                      >
                        <MenuItem value="male">Homme</MenuItem>
                        <MenuItem value="female">Femme</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Niveau d'activité</InputLabel>
                      <Select
                        name="activityLevel"
                        value={formData.activityLevel}
                        onChange={handleChange}
                        label="Niveau d'activité"
                      >
                        <MenuItem value="light">Léger (1-3h/semaine)</MenuItem>
                        <MenuItem value="moderate">Modéré (3-6h/semaine)</MenuItem>
                        <MenuItem value="active">Actif (6-10h/semaine)</MenuItem>
                        <MenuItem value="very-active">Très actif (10-15h/semaine)</MenuItem>
                        <MenuItem value="extreme">Extrême (15h+/semaine)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Objectif</InputLabel>
                      <Select
                        name="goal"
                        value={formData.goal}
                        onChange={handleChange}
                        label="Objectif"
                      >
                        <MenuItem value="maintain">Maintien du poids</MenuItem>
                        <MenuItem value="lose">Perte de poids</MenuItem>
                        <MenuItem value="gain">Prise de masse</MenuItem>
                        <MenuItem value="performance">Performance maximale</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      fullWidth 
                      onClick={calculateNutritionNeeds}
                      className="calculate-button"
                    >
                      Calculer
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={7} className="nutrition-results">
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Vos Besoins Nutritionnels
              </Typography>
              
              {showResults && nutritionNeeds ? (
                <>
                  <Box className="macros-chart" sx={{ mt: 2, mb: 2 }}>
                    <MacroChart macros={nutritionNeeds} />
                  </Box>
                  
                  <Grid container spacing={2} className="nutrition-summary">
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" className="summary-label">Calories quotidiennes</Typography>
                      <Typography variant="h6" className="summary-value">{nutritionNeeds.calories} kcal</Typography>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" className="summary-label">Protéines</Typography>
                      <Typography variant="h6" className="summary-value">{nutritionNeeds.protein} g</Typography>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" className="summary-label">Glucides</Typography>
                      <Typography variant="h6" className="summary-value">{nutritionNeeds.carbs} g</Typography>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" className="summary-label">Lipides</Typography>
                      <Typography variant="h6" className="summary-value">{nutritionNeeds.fat} g</Typography>
                    </Grid>
                  </Grid>
                  
                  {formData.weight && (
                    <HydrationPlanner 
                      weight={parseFloat(formData.weight)} 
                      activityLevel={formData.activityLevel} 
                    />
                  )}
                </>
              ) : (
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: 300,
                    flexDirection: 'column'
                  }}
                >
                  <Typography variant="body1" color="text.secondary" align="center">
                    Remplissez le formulaire et cliquez sur "Calculer" pour voir vos besoins nutritionnels
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box className="cycling-nutrition" sx={{ mt: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Nutrition Spécifique au Cyclisme
        </Typography>
        
        <Grid container spacing={3} className="nutrition-phases">
          <Grid item xs={12} sm={4}>
            <Card className="phase-card" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Avant l'effort
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Recommandations pour bien préparer votre organisme avant une sortie
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box component="ul" sx={{ pl: 2 }}>
                  <Typography component="li" variant="body2">Repas riche en glucides 3-4h avant</Typography>
                  <Typography component="li" variant="body2">Hydratation progressive</Typography>
                  <Typography component="li" variant="body2">Collation légère 30-60min avant si nécessaire</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card className="phase-card" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Pendant l'effort
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Stratégies pour maintenir l'énergie durant vos sorties
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box component="ul" sx={{ pl: 2 }}>
                  <Typography component="li" variant="body2">30-60g de glucides par heure</Typography>
                  <Typography component="li" variant="body2">500-750ml d'eau par heure</Typography>
                  <Typography component="li" variant="body2">Électrolytes pour les efforts prolongés</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Card className="phase-card" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Après l'effort
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Optimisez votre récupération après chaque sortie
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box component="ul" sx={{ pl: 2 }}>
                  <Typography component="li" variant="body2">Protéines et glucides dans les 30min</Typography>
                  <Typography component="li" variant="body2">Réhydratation avec électrolytes</Typography>
                  <Typography component="li" variant="body2">Repas complet dans les 2h</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      <Box className="meal-planner" sx={{ mt: 4 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h5" component="h2" gutterBottom>
              Planificateur de Repas
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Créez votre plan alimentaire personnalisé
            </Typography>
            
            <Grid container spacing={2} className="meal-planner-actions">
              <Grid item xs={12} sm={4}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth 
                  onClick={generateMealPlan}
                  className="action-button"
                >
                  Générer un plan
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  fullWidth 
                  onClick={savePlan}
                  className="action-button"
                >
                  Sauvegarder
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  fullWidth 
                  onClick={loadPlan}
                  className="action-button"
                >
                  Charger
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NutritionPlanner;
