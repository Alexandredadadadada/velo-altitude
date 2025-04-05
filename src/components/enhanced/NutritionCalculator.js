import React, { useState, useEffect, useRef } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Slider,
  FormHelperText,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab
} from '@mui/material';
import {
  DirectionsBike,
  Straighten,
  MonitorWeight,
  Accessibility,
  Timeline,
  Speed,
  LocalFireDepartment,
  WaterDrop,
  Fastfood,
  EggAlt,
  Cake,
  Opacity,
  RestaurantMenu,
  Event,
  Science,
  Timer,
  Restaurant,
  LocalDining
} from '@mui/icons-material';
import nutritionService from '../../services/nutritionService';
import monitoringService from '../../services/monitoringService';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * Calculateur nutritionnel pour les cyclistes
 * Permet de calculer les besoins caloriques et en macronutriments en fonction du profil et des objectifs
 */
const NutritionCalculator = ({ userId }) => {
  // État du formulaire
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    age: '',
    gender: 'male',
    activityLevel: 'moderatelyActive',
    goals: 'performance',
    trainingDuration: 60,
    trainingType: 'endurance', // Type d'entraînement (endurance, intensité, etc.)
    trainingIntensity: 'moderate', // Intensité de l'entraînement
    weeklyDistance: 100, // Distance hebdomadaire en km
    upcomingEvent: false, // Préparation pour un événement
    eventType: '', // Type d'événement (course, granfondo, etc.)
    eventDate: null // Date de l'événement
  });

  // États pour le traitement et les résultats
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Niveaux d'activité
  const activityLevels = [
    { value: 'sedentary', label: 'Sédentaire (peu ou pas d\'exercice)' },
    { value: 'lightlyActive', label: 'Légèrement actif (exercice léger 1-3 jours/semaine)' },
    { value: 'moderatelyActive', label: 'Modérément actif (exercice modéré 3-5 jours/semaine)' },
    { value: 'veryActive', label: 'Très actif (exercice intense 6-7 jours/semaine)' },
    { value: 'extremelyActive', label: 'Extrêmement actif (exercice intense quotidien ou athlète professionnel)' }
  ];

  // Objectifs nutritionnels
  const nutritionGoals = [
    { value: 'weightLoss', label: 'Perte de poids' },
    { value: 'maintenance', label: 'Maintien du poids' },
    { value: 'performance', label: 'Performance optimale' }
  ];

  // Types d'entraînement pour cyclistes
  const trainingTypes = [
    { value: 'endurance', label: 'Endurance (longue distance, intensité modérée)' },
    { value: 'tempo', label: 'Tempo/Sweet Spot (intensité soutenue)' },
    { value: 'threshold', label: 'Seuil (intervalles à haute intensité)' },
    { value: 'vo2max', label: 'VO2max (intervalles très intenses)' },
    { value: 'sprint', label: 'Sprint/Force (efforts explosifs)' },
    { value: 'recovery', label: 'Récupération (intensité très faible)' }
  ];

  // Intensités d'entraînement
  const trainingIntensities = [
    { value: 'low', label: 'Faible (Zone 1-2: <75% FCM)' },
    { value: 'moderate', label: 'Modérée (Zone 3: 75-85% FCM)' },
    { value: 'high', label: 'Élevée (Zone 4: 85-95% FCM)' },
    { value: 'very_high', label: 'Très élevée (Zone 5-6: >95% FCM)' }
  ];

  // Types d'événements
  const eventTypes = [
    { value: 'race', label: 'Course (compétition)' },
    { value: 'granfondo', label: 'Cyclosportive/Gran Fondo' },
    { value: 'century', label: 'Century Ride (100+ km)' },
    { value: 'multi_day', label: 'Événement multi-jours' }
  ];

  // Références pour le suivi des performances
  const renderStartTime = useRef(Date.now());
  const interactionCount = useRef(0);
  const formComplexity = useRef('simple');
  const calculationStartTime = useRef(null);

  // Gérer les changements de champ
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Incrémentation du compteur d'interactions
    interactionCount.current += 1;
    
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Mise à jour de la complexité du formulaire
    updateFormComplexity();
    
    // Effacer l'erreur correspondante
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  // Gérer le changement de durée d'entraînement via le slider
  const handleSliderChange = (event, newValue) => {
    setFormData({
      ...formData,
      trainingDuration: newValue
    });
  };

  // Évaluer la complexité du formulaire basée sur les champs remplis
  const updateFormComplexity = () => {
    // Compter le nombre de champs remplis
    const filledFields = Object.values(formData).filter(val => 
      val !== '' && val !== null && val !== false).length;
    
    if (filledFields >= 10 || formData.upcomingEvent) {
      formComplexity.current = 'complete';
    } else if (filledFields >= 6) {
      formComplexity.current = 'advanced';
    } else {
      formComplexity.current = 'simple';
    }
  };

  // Validation du formulaire
  const validateForm = () => {
    let errors = {};
    let isValid = true;

    if (!formData.weight || formData.weight <= 0) {
      errors.weight = 'Veuillez entrer un poids valide';
      isValid = false;
    }

    if (!formData.height || formData.height <= 0) {
      errors.height = 'Veuillez entrer une taille valide';
      isValid = false;
    }

    if (!formData.age || formData.age <= 0 || formData.age > 120) {
      errors.age = 'Veuillez entrer un âge valide';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Enregistrement des métriques d'interaction
    monitoringService.trackUserInteraction('nutrition_calculator', 'submit', {
      formComplexity: formComplexity.current,
      interactionCount: interactionCount.current,
      fieldsCount: Object.keys(formData).length
    });
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setLoading(true);
    setError(null);
    calculationStartTime.current = Date.now();
    
    try {
      // Envoi des données au service de nutrition
      const nutritionResults = await nutritionService.calculateNutrition({
        ...formData,
        userId
      });
      
      setResults(nutritionResults);
      
      // Suivi des performances de calcul
      const calculationTime = Date.now() - calculationStartTime.current;
      monitoringService.trackApiPerformance('nutrition_calculation', calculationTime, {
        success: true,
        formComplexity: formComplexity.current,
        resultSize: JSON.stringify(nutritionResults).length
      });
      
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors du calcul nutritionnel');
      
      // Suivi des erreurs
      monitoringService.trackApiPerformance('nutrition_calculation', 
        Date.now() - calculationStartTime.current, {
        success: false,
        errorType: err.name,
        errorMessage: err.message
      });
      
    } finally {
      setLoading(false);
    }
  };

  // Rendu de la section de résultats
  const renderResults = () => {
    if (!results) return null;

    return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "name": "Guide Nutritionnel pour Cyclistes",
          "description": "Conseils et recettes adaptés aux cyclistes pour optimiser les performances en montagne.",
          "url": "https://velo-altitude.com/nutritioncalculator"
        }
      </script>
      <EnhancedMetaTags
        title="Nutrition pour Cyclistes | Velo-Altitude"
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="article"
        imageUrl="/images/og-image.jpg"
      />
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Vos besoins nutritionnels
          </Typography>
          <Typography variant="body2" paragraph>
            Basés sur votre profil et vos objectifs, voici vos besoins nutritionnels quotidiens estimés.
          </Typography>
        </Grid>

        {/* Carte des calories */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalFireDepartment color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Besoins caloriques</Typography>
              </Box>
              <Typography variant="h3" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                {results.dailyCalories} kcal
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Métabolisme de base (BMR)</Typography>
                  <Typography variant="h6">{results.bmr} kcal</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Dépense énergétique totale</Typography>
                  <Typography variant="h6">{results.tdee} kcal</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Carte des macronutriments */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Fastfood color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Macronutriments</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Cake sx={{ color: '#4CAF50', fontSize: 40 }} />
                    <Typography variant="h6">{results.macronutrients.carbs.grams}g</Typography>
                    <Typography variant="body2" color="text.secondary">Glucides</Typography>
                    <Typography variant="caption">({results.macronutrients.carbs.percentage}%)</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <EggAlt sx={{ color: '#2196F3', fontSize: 40 }} />
                    <Typography variant="h6">{results.macronutrients.protein.grams}g</Typography>
                    <Typography variant="body2" color="text.secondary">Protéines</Typography>
                    <Typography variant="caption">({results.macronutrients.protein.percentage}%)</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Opacity sx={{ color: '#FF9800', fontSize: 40 }} />
                    <Typography variant="h6">{results.macronutrients.fat.grams}g</Typography>
                    <Typography variant="body2" color="text.secondary">Lipides</Typography>
                    <Typography variant="caption">({results.macronutrients.fat.percentage}%)</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Carte d'hydratation */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WaterDrop color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Besoins en hydratation</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5">{results.hydration.base}L</Typography>
                    <Typography variant="body2" color="text.secondary">Base quotidienne</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5">{results.hydration.training}L</Typography>
                    <Typography variant="body2" color="text.secondary">Pendant l'entraînement</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5">{results.hydration.total}L</Typography>
                    <Typography variant="body2" color="text.secondary">Total recommandé</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recommandations */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recommandations personnalisées
              </Typography>
              <Tabs 
                value={tabValue} 
                onChange={(event, newValue) => setTabValue(newValue)} 
                variant="fullWidth" 
                sx={{ mb: 2 }}
              >
                <Tab label="Avant" />
                <Tab label="Pendant" />
                <Tab label="Après" />
                <Tab label="Quotidien" />
              </Tabs>
              
              {tabValue === 0 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Nutrition pré-entraînement
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <RestaurantMenu color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="3-4 heures avant l'effort"
                        secondary={`Repas complet de ${Math.round(results.dailyCalories * 0.25)} kcal avec ${Math.round(results.macronutrients.carbs.grams * 0.3)}g de glucides complexes, ${Math.round(results.macronutrients.protein.grams * 0.2)}g de protéines maigres et hydratation.`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Cake color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="60 minutes avant l'effort"
                        secondary={`Collation légère de ${Math.round(results.dailyCalories * 0.1)} kcal avec ${Math.round(results.macronutrients.carbs.grams * 0.1)}g de glucides simples et facilement digestibles.`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <WaterDrop color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Hydratation"
                        secondary="400-600ml d'eau ou boisson isotonique légère dans les 2 heures précédant l'effort."
                      />
                    </ListItem>
                  </List>
                </Box>
              )}
              
              {tabValue === 1 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Nutrition pendant l'effort
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Cake color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Apport glucidique"
                        secondary={`${formData.trainingIntensity === 'high' || formData.trainingIntensity === 'very_high' ? '60-90g' : '30-60g'} de glucides par heure d'effort sous forme de gels, barres ou boissons.`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <WaterDrop color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Hydratation pendant l'effort"
                        secondary={`500-1000ml par heure selon l'intensité et la température. Augmentez de 200ml par tranche de 5°C au-dessus de 25°C.`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Science color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Électrolytes"
                        secondary="Intégrez 400-700mg de sodium par litre pour les efforts > 90 minutes ou par temps chaud."
                      />
                    </ListItem>
                  </List>
                </Box>
              )}
              
              {tabValue === 2 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Nutrition post-entraînement
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Timer color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Fenêtre anabolique (30 minutes)"
                        secondary={`Consommez ${Math.round(results.macronutrients.carbs.grams * 0.25)}g de glucides et ${Math.round(results.macronutrients.protein.grams * 0.25)}g de protéines dans les 30 minutes suivant l'effort.`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Restaurant color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Repas complet (2 heures après)"
                        secondary={`Repas équilibré de ${Math.round(results.dailyCalories * 0.3)} kcal avec ${Math.round(results.macronutrients.carbs.grams * 0.3)}g de glucides, ${Math.round(results.macronutrients.protein.grams * 0.3)}g de protéines et des graisses saines.`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <WaterDrop color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Réhydratation"
                        secondary="150% du poids perdu pendant l'effort. Exemple: si vous avez perdu 1kg, buvez 1.5L d'eau avec électrolytes."
                      />
                    </ListItem>
                  </List>
                </Box>
              )}
              
              {tabValue === 3 && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Nutrition quotidienne
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <DirectionsBike color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Périodisation nutritionnelle"
                        secondary={`Adaptez votre apport selon le type d'effort: ${Math.round(results.dailyCalories * 1.1)} kcal les jours d'intensité, ${Math.round(results.dailyCalories * 0.9)} kcal les jours de récupération.`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <RestaurantMenu color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Répartition des repas"
                        secondary="Répartissez vos macronutriments sur 4-6 repas par jour pour maintenir un niveau d'énergie stable."
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <LocalDining color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Aliments à privilégier"
                        secondary="Glucides complexes (riz, pâtes complètes, patates douces), protéines maigres (poulet, poisson, légumineuses), graisses saines (avocat, huile d'olive, fruits à coque)."
                      />
                    </ListItem>
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  // Effet pour le suivi du temps de rendu
  useEffect(() => {
    // Mesure du temps de rendu initial
    const renderTime = Date.now() - renderStartTime.current;
    
    // Envoi des métriques de performance au service de monitoring
    monitoringService.trackComponentPerformance('NutritionCalculator', renderTime, {
      userId: userId || 'anonymous'
    });
    
    // Réinitialisation du compteur d'interactions lors du montage du composant
    interactionCount.current = 0;
    
    // Suivi de la session
    const sessionTracker = setInterval(() => {
      // Envoyer périodiquement des métriques d'utilisation
      if (interactionCount.current > 0) {
        monitoringService.trackUserEngagement('nutrition_calculator', {
          interactionsSinceLastCheck: interactionCount.current,
          formComplexity: formComplexity.current,
          hasResults: results !== null
        });
        
        // Réinitialiser le compteur après l'envoi
        interactionCount.current = 0;
      }
    }, 30000); // Vérification toutes les 30 secondes
    
    // Nettoyage
    return () => {
      clearInterval(sessionTracker);
      // Enregistrer les métriques de session complète
      monitoringService.trackComponentUnmount('NutritionCalculator', {
        sessionDuration: Date.now() - renderStartTime.current,
        generatedResults: results !== null
      });
    };
  }, [userId, results]);

  // Rendu principal du composant
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Calculateur nutritionnel
        </Typography>
        <Typography variant="body2" paragraph>
          Calculez vos besoins énergétiques et nutritionnels personnalisés en fonction de votre profil et de vos objectifs.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Informations personnelles */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Informations personnelles
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Poids (kg)"
                name="weight"
                type="number"
                value={formData.weight}
                onChange={handleChange}
                error={!!formErrors.weight}
                helperText={formErrors.weight}
                InputProps={{
                  startAdornment: <MonitorWeight color="action" sx={{ mr: 1 }} />,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Taille (cm)"
                name="height"
                type="number"
                value={formData.height}
                onChange={handleChange}
                error={!!formErrors.height}
                helperText={formErrors.height}
                InputProps={{
                  startAdornment: <Straighten color="action" sx={{ mr: 1 }} />,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Âge"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                error={!!formErrors.age}
                helperText={formErrors.age}
                InputProps={{
                  startAdornment: <Accessibility color="action" sx={{ mr: 1 }} />,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="gender-label">Genre</InputLabel>
                <Select
                  labelId="gender-label"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  label="Genre"
                >
                  <MenuItem value="male">Homme</MenuItem>
                  <MenuItem value="female">Femme</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="activity-level-label">Niveau d'activité</InputLabel>
                <Select
                  labelId="activity-level-label"
                  name="activityLevel"
                  value={formData.activityLevel}
                  onChange={handleChange}
                  label="Niveau d'activité"
                >
                  {activityLevels.map((level) => (
                    <MenuItem key={level.value} value={level.value}>
                      {level.label}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>En dehors de vos séances de cyclisme</FormHelperText>
              </FormControl>
            </Grid>

            {/* Objectifs et entraînement */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Objectifs et entraînement
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="goals-label">Objectif principal</InputLabel>
                <Select
                  labelId="goals-label"
                  name="goals"
                  value={formData.goals}
                  onChange={handleChange}
                  label="Objectif principal"
                >
                  {nutritionGoals.map((goal) => (
                    <MenuItem key={goal.value} value={goal.value}>
                      {goal.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography gutterBottom>
                Durée moyenne d'entraînement (minutes/jour)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DirectionsBike color="action" sx={{ mr: 2 }} />
                <Slider
                  name="trainingDuration"
                  value={formData.trainingDuration}
                  onChange={handleSliderChange}
                  min={0}
                  max={240}
                  step={15}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 60, label: '60' },
                    { value: 120, label: '120' },
                    { value: 180, label: '180' },
                    { value: 240, label: '240' }
                  ]}
                  valueLabelDisplay="auto"
                  sx={{ flex: 1 }}
                />
              </Box>
            </Grid>

            {/* Profil d'entraînement cycliste */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Profil d'entraînement cycliste
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Type d'entraînement principal</InputLabel>
                <Select
                  name="trainingType"
                  value={formData.trainingType}
                  onChange={handleChange}
                  label="Type d'entraînement principal"
                >
                  {trainingTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Sélectionnez votre type d'entraînement le plus fréquent</FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Intensité moyenne</InputLabel>
                <Select
                  name="trainingIntensity"
                  value={formData.trainingIntensity}
                  onChange={handleChange}
                  label="Intensité moyenne"
                >
                  {trainingIntensities.map((intensity) => (
                    <MenuItem key={intensity.value} value={intensity.value}>
                      {intensity.label}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Intensité moyenne de vos entraînements</FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Distance hebdomadaire (km)"
                name="weeklyDistance"
                type="number"
                value={formData.weeklyDistance}
                onChange={handleChange}
                InputProps={{
                  startAdornment: <DirectionsBike color="action" sx={{ mr: 1 }} />,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset" sx={{ mt: 1 }}>
                <Typography variant="body2" gutterBottom>
                  Préparation pour un événement spécifique?
                </Typography>
                <Grid container spacing={1}>
                  <Grid item>
                    <Button 
                      variant={formData.upcomingEvent ? "contained" : "outlined"} 
                      size="small"
                      onClick={() => setFormData({...formData, upcomingEvent: true})}
                    >
                      Oui
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button 
                      variant={!formData.upcomingEvent ? "contained" : "outlined"} 
                      size="small"
                      onClick={() => setFormData({...formData, upcomingEvent: false, eventType: '', eventDate: null})}
                    >
                      Non
                    </Button>
                  </Grid>
                </Grid>
              </FormControl>
            </Grid>

            {formData.upcomingEvent && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Type d'événement</InputLabel>
                    <Select
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleChange}
                      label="Type d'événement"
                    >
                      {eventTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombre de jours avant l'événement"
                    name="eventDate"
                    type="number"
                    value={formData.eventDate}
                    onChange={handleChange}
                    InputProps={{
                      startAdornment: <Event color="action" sx={{ mr: 1 }} />,
                    }}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={24} /> : <Timeline />}
              >
                {loading ? 'Calcul en cours...' : 'Calculer mes besoins'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Affichage des résultats */}
      {results && renderResults()}
    </Box>
  );
};

export default NutritionCalculator;
