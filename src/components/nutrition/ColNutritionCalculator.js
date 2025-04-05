/**
 * ColNutritionCalculator - Calculateur de nutrition spécifique aux cols
 * 
 * Ce composant permet de calculer les besoins nutritionnels précis pour une ascension de col,
 * en tenant compte du profil du col, des conditions météo et des données personnelles.
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, TextField, MenuItem, 
  Slider, Button, Divider, CircularProgress, Stepper, 
  Step, StepLabel, StepContent, Chip, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  DirectionsBike, WbSunny, Thermostat, 
  ExpandMore, Terrain, Restaurant, WaterDrop, 
  Timeline, AccessTime, ArrowForward 
} from '@mui/icons-material';
import { fetchColDetails } from '../../services/dataService';
import { trackSEOInteraction } from '../../services/analyticsService';
import { Link } from 'react-router-dom';

// Styles personnalisés
const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(2),
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: -8,
    left: 0,
    width: 50,
    height: 3,
    backgroundColor: theme.palette.primary.main,
  }
}));

const StyledTable = styled(TableContainer)(({ theme }) => ({
  '& th': {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
  }
}));

const SectionCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  overflow: 'visible',
}));

// Constantes pour les calculs
const DEFAULT_WEIGHT = 75; // kg
const CALORIES_PER_KG_PER_KM_FLAT = 0.75; // kcal/kg/km sur plat
const CALORIES_EXTRA_UPHILL_MULTIPLIER = 7.5; // multiplicateur pour la montée par % de pente
const WATER_BASE_HOUR = 0.5; // L/heure base
const WATER_TEMP_MODIFIER = 0.1; // L/heure en plus par 5°C au-dessus de 20°C

/**
 * Calculateur de nutrition pour les cols
 */
const ColNutritionCalculator = () => {
  // États pour les entrées utilisateur
  const [selectedCol, setSelectedCol] = useState('');
  const [userWeight, setUserWeight] = useState(DEFAULT_WEIGHT);
  const [temperature, setTemperature] = useState(20);
  const [intensity, setIntensity] = useState(7);
  const [loading, setLoading] = useState(false);
  const [colData, setColData] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [result, setResult] = useState(null);
  
  // Liste de cols disponibles (normalement chargée depuis l'API)
  const availableCols = [
    { id: 'alpe-dhuez', name: "L'Alpe d'Huez", length: 13.8, gradient: 8.1, altitude: 1860 },
    { id: 'col-du-tourmalet', name: "Col du Tourmalet", length: 19, gradient: 7.4, altitude: 2115 },
    { id: 'passo-dello-stelvio', name: "Passo dello Stelvio", length: 24.3, gradient: 7.4, altitude: 2758 },
    { id: 'col-du-galibier', name: "Col du Galibier", length: 18.1, gradient: 6.9, altitude: 2642 },
    { id: 'mont-ventoux', name: "Mont Ventoux", length: 21.5, gradient: 7.5, altitude: 1909 }
  ];

  // Charger les détails du col sélectionné
  useEffect(() => {
    if (selectedCol) {
      setLoading(true);
      
      // Simuler une requête API (remplacer par un appel API réel)
      setTimeout(() => {
        const col = availableCols.find(c => c.id === selectedCol);
        setColData(col);
        setLoading(false);
      }, 800);
      
      // Enregistrer l'interaction pour le SEO
      trackSEOInteraction('nutrition', 'col_calculator', `select_col_${selectedCol}`);
    }
  }, [selectedCol]);

  // Effectuer le calcul des besoins nutritionnels
  const calculateNutrition = () => {
    if (!colData) return;
    
    // Calculer le temps estimé (en heures) basé sur la longueur, le gradient et l'intensité
    const estimatedSpeed = Math.max(5, 22 - (colData.gradient * 1.8) - ((10 - intensity) * 1.2));
    const estimatedTimeHours = colData.length / estimatedSpeed;
    
    // Calculer les calories basées sur le poids, la distance et le gradient
    const flatCalories = userWeight * colData.length * CALORIES_PER_KG_PER_KM_FLAT;
    const uphillExtra = userWeight * colData.length * colData.gradient * CALORIES_EXTRA_UPHILL_MULTIPLIER / 100;
    const totalCalories = Math.round(flatCalories + uphillExtra);
    
    // Calculer les besoins en hydratation basés sur le temps et la température
    const tempExtraMod = Math.max(0, (temperature - 20) / 5) * WATER_TEMP_MODIFIER;
    const hydrationNeed = Math.round((WATER_BASE_HOUR + tempExtraMod) * estimatedTimeHours * 10) / 10;
    
    // Répartition des macronutriments
    const carbs = Math.round(totalCalories * 0.6 / 4); // 60% des calories, 4 kcal par g
    const protein = Math.round(totalCalories * 0.15 / 4); // 15% des calories, 4 kcal par g
    const fat = Math.round(totalCalories * 0.25 / 9); // 25% des calories, 9 kcal par g
    
    // Stratégie de répartition sur le parcours
    const sections = [
      {
        name: 'Avant le départ (2h)',
        carbs: Math.round(carbs * 0.25),
        protein: Math.round(protein * 0.3),
        fat: Math.round(fat * 0.3),
        calories: Math.round(totalCalories * 0.25),
        hydration: Math.round(hydrationNeed * 0.2 * 10) / 10
      },
      {
        name: 'Première moitié',
        carbs: Math.round(carbs * 0.35),
        protein: Math.round(protein * 0.3),
        fat: Math.round(fat * 0.3),
        calories: Math.round(totalCalories * 0.35),
        hydration: Math.round(hydrationNeed * 0.4 * 10) / 10
      },
      {
        name: 'Deuxième moitié',
        carbs: Math.round(carbs * 0.25),
        protein: Math.round(protein * 0.2),
        fat: Math.round(fat * 0.25),
        calories: Math.round(totalCalories * 0.25),
        hydration: Math.round(hydrationNeed * 0.4 * 10) / 10
      },
      {
        name: 'Récupération (1h)',
        carbs: Math.round(carbs * 0.15),
        protein: Math.round(protein * 0.2),
        fat: Math.round(fat * 0.15),
        calories: Math.round(totalCalories * 0.15),
        hydration: Math.round(hydrationNeed * 0.2 * 10) / 10
      }
    ];
    
    // Recommandations de produits
    const recommendations = [
      {
        section: 'Avant',
        items: [
          { name: 'Porridge aux fruits', carbs: 45, protein: 12, fat: 8, link: '/nutrition/recipes/porridge-cycliste' },
          { name: 'Pancakes protéinés', carbs: 30, protein: 15, fat: 7, link: '/nutrition/recipes/protein-pancakes' }
        ]
      },
      {
        section: 'Pendant',
        items: [
          { name: 'Barres énergétiques maison', carbs: 25, protein: 5, fat: 6, link: '/nutrition/recipes/homemade-energy-bars' },
          { name: 'Gel énergétique', carbs: 22, protein: 0, fat: 0, link: '/nutrition/recipes/gel-energy-homemade' },
          { name: 'Boisson isotonique', carbs: 18, protein: 0, fat: 0, link: '/nutrition/recipes/isotonic-drink' }
        ]
      },
      {
        section: 'Après',
        items: [
          { name: 'Smoothie récupération', carbs: 35, protein: 20, fat: 5, link: '/nutrition/recipes/recovery-smoothie' },
          { name: 'Bowl protéiné', carbs: 40, protein: 25, fat: 10, link: '/nutrition/recipes/protein-recovery-bowl' }
        ]
      }
    ];
    
    // Compiler les résultats
    setResult({
      totalCalories,
      carbs,
      protein,
      fat,
      hydrationNeed,
      estimatedTimeHours: Math.round(estimatedTimeHours * 10) / 10,
      sections,
      recommendations,
      colData
    });
    
    // Passer à l'étape suivante
    setActiveStep(2);
    
    // Tracker l'interaction pour le SEO
    trackSEOInteraction('nutrition', 'col_calculator', 'calculation_completed');
  };

  // Gérer les changements d'étapes
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setResult(null);
  };

  // Étapes du processus
  const steps = [
    {
      label: 'Sélection du col',
      content: (
        <Box>
          <SectionTitle variant="h6">Choisissez un col</SectionTitle>
          <TextField
            select
            fullWidth
            value={selectedCol}
            onChange={(e) => setSelectedCol(e.target.value)}
            label="Col à grimper"
            margin="normal"
            helperText="Sélectionnez le col pour lequel vous souhaitez préparer votre nutrition"
          >
            {availableCols.map((col) => (
              <MenuItem key={col.id} value={col.id}>
                {col.name} ({col.length}km, {col.gradient}%)
              </MenuItem>
            ))}
          </TextField>
          
          {loading && <CircularProgress size={24} sx={{ mt: 2 }} />}
          
          {colData && (
            <Box mt={3}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {colData.name}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Distance
                    </Typography>
                    <Typography variant="body1">
                      {colData.length} km
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Pente moyenne
                    </Typography>
                    <Typography variant="body1">
                      {colData.gradient}%
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Altitude
                    </Typography>
                    <Typography variant="body1">
                      {colData.altitude}m
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </Box>
      )
    },
    {
      label: 'Vos informations',
      content: (
        <Box>
          <SectionTitle variant="h6">Vos informations personnelles</SectionTitle>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Poids (kg)"
                value={userWeight}
                onChange={(e) => setUserWeight(Math.max(40, Math.min(150, Number(e.target.value))))}
                margin="normal"
                inputProps={{ min: 40, max: 150 }}
                helperText="Votre poids en kilogrammes"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box mt={2}>
                <Typography gutterBottom>
                  Température prévue: {temperature}°C
                </Typography>
                <Slider
                  value={temperature}
                  onChange={(e, newValue) => setTemperature(newValue)}
                  step={1}
                  min={0}
                  max={40}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box mt={2}>
                <Typography gutterBottom>
                  Intensité d'effort prévue (1-10): {intensity}
                </Typography>
                <Slider
                  value={intensity}
                  onChange={(e, newValue) => setIntensity(newValue)}
                  step={1}
                  marks
                  min={1}
                  max={10}
                  valueLabelDisplay="auto"
                />
                <Typography variant="caption" color="text.secondary">
                  1 = très faible, 10 = effort maximal
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )
    },
    {
      label: 'Résultats',
      content: result && (
        <Box>
          <SectionTitle variant="h6">Vos besoins nutritionnels pour {result.colData.name}</SectionTitle>
          
          <SectionCard>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={7}>
                  <Typography variant="subtitle1" gutterBottom>
                    <Timeline sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Résumé
                  </Typography>
                  
                  <Box display="flex" justifyContent="space-between" mb={2}>
                    <Chip 
                      icon={<Restaurant />} 
                      label={`${result.totalCalories} kcal`} 
                      color="primary"
                    />
                    <Chip 
                      icon={<WaterDrop />} 
                      label={`${result.hydrationNeed}L d'eau`} 
                      color="info"
                    />
                    <Chip 
                      icon={<AccessTime />} 
                      label={`${result.estimatedTimeHours}h estimées`} 
                      color="secondary"
                    />
                  </Box>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'warning.light' }}>
                        <Typography variant="body2" color="warning.contrastText">Glucides</Typography>
                        <Typography variant="h6" color="warning.contrastText">{result.carbs}g</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'success.light' }}>
                        <Typography variant="body2" color="success.contrastText">Protéines</Typography>
                        <Typography variant="h6" color="success.contrastText">{result.protein}g</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={4}>
                      <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'info.light' }}>
                        <Typography variant="body2" color="info.contrastText">Lipides</Typography>
                        <Typography variant="h6" color="info.contrastText">{result.fat}g</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>
                
                <Grid item xs={12} md={5}>
                  <Typography variant="subtitle1" gutterBottom>
                    <Terrain sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Profil du col
                  </Typography>
                  
                  <Box px={1}>
                    <Typography variant="body2">
                      Distance: {result.colData.length} km
                    </Typography>
                    <Typography variant="body2">
                      Pente moyenne: {result.colData.gradient}%
                    </Typography>
                    <Typography variant="body2">
                      Dénivelé: ~{Math.round(result.colData.length * 10 * result.colData.gradient)}m
                    </Typography>
                    <Typography variant="body2">
                      Conditions: {temperature}°C, Intensité {intensity}/10
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </SectionCard>
          
          <SectionCard>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                <Timeline sx={{ verticalAlign: 'middle', mr: 1 }} />
                Répartition par phases
              </Typography>
              
              <StyledTable component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Phase</TableCell>
                      <TableCell align="right">Calories</TableCell>
                      <TableCell align="right">Glucides</TableCell>
                      <TableCell align="right">Protéines</TableCell>
                      <TableCell align="right">Lipides</TableCell>
                      <TableCell align="right">Eau</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.sections.map((section, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {section.name}
                        </TableCell>
                        <TableCell align="right">{section.calories} kcal</TableCell>
                        <TableCell align="right">{section.carbs}g</TableCell>
                        <TableCell align="right">{section.protein}g</TableCell>
                        <TableCell align="right">{section.fat}g</TableCell>
                        <TableCell align="right">{section.hydration}L</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </StyledTable>
            </CardContent>
          </SectionCard>
          
          <SectionCard>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                <Restaurant sx={{ verticalAlign: 'middle', mr: 1 }} />
                Suggestions d'aliments
              </Typography>
              
              {result.recommendations.map((rec, index) => (
                <Box key={index} mb={index < result.recommendations.length - 1 ? 3 : 0}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    {rec.section}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {rec.items.map((item, idx) => (
                      <Grid item xs={12} sm={6} md={4} key={idx}>
                        <Paper variant="outlined" sx={{ p: 1.5 }}>
                          <Typography variant="body2" gutterBottom>
                            <Link to={item.link} style={{ textDecoration: 'none', color: 'inherit' }}>
                              {item.name}
                            </Link>
                          </Typography>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">
                              G: {item.carbs}g
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              P: {item.protein}g
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              L: {item.fat}g
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
              
              <Box mt={3} textAlign="right">
                <Button 
                  variant="contained" 
                  color="primary" 
                  component={Link} 
                  to="/nutrition/category/col-specific"
                >
                  Voir toutes les recettes pour cols
                  <ArrowForward sx={{ ml: 1 }} />
                </Button>
              </Box>
            </CardContent>
          </SectionCard>
        </Box>
      )
    }
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <DirectionsBike color="primary" sx={{ fontSize: 32, mr: 2 }} />
          <Typography variant="h5" component="h1">
            Calculateur de nutrition pour cols
          </Typography>
        </Box>
        
        <Typography variant="body1" paragraph color="text.secondary">
          Optimisez votre alimentation pour vos ascensions. Notre calculateur prend en compte le profil du col,
          les conditions météo et vos caractéristiques personnelles pour vous fournir des recommandations précises.
        </Typography>
        
        <Divider sx={{ my: 3 }} />
        
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={index}>
              <StepLabel>{step.label}</StepLabel>
              <StepContent>
                {step.content}
                <Box sx={{ mb: 2, mt: 3 }}>
                  <div>
                    <Button
                      variant="contained"
                      onClick={index === 1 ? calculateNutrition : handleNext}
                      sx={{ mt: 1, mr: 1 }}
                      disabled={(index === 0 && !colData) || (index === 2)}
                    >
                      {index === 1 ? 'Calculer' : 'Continuer'}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={handleBack}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Retour
                    </Button>
                  </div>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
        
        {activeStep === steps.length && (
          <Paper square elevation={0} sx={{ p: 3 }}>
            <Typography>Calcul terminé - vous pouvez désormais suivre ces recommandations pour votre ascension</Typography>
            <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
              Recommencer
            </Button>
          </Paper>
        )}
      </Paper>
    </Container>
  );
};

export default ColNutritionCalculator;
