import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Box, 
  Stepper, 
  Step, 
  StepLabel,
  StepContent,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TimerIcon from '@mui/icons-material/Timer';
import SpeedIcon from '@mui/icons-material/Speed';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';

/**
 * ColSpecificTraining - Composant pour l'entraînement spécifique aux cols
 * Génère des plans d'entraînement adaptés aux caractéristiques du col sélectionné
 */
function ColSpecificTraining({ selectedRegion, selectedCol }) {
  const theme = useTheme();
  const [trainingPlan, setTrainingPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [userMetrics, setUserMetrics] = useState({
    ftp: 250, // FTP par défaut
    weight: 70, // Poids par défaut en kg
    experience: 'intermediate' // Niveau d'expérience par défaut
  });

  useEffect(() => {
    // Reset le plan d'entraînement quand le col change
    if (selectedCol) {
      setTrainingPlan(null);
    }
  }, [selectedCol]);

  // Génère un plan d'entraînement basé sur le col sélectionné
  const generateTrainingPlan = async () => {
    if (!selectedCol) return;
    
    setLoading(true);
    
    try {
      // Appel à l'API pour générer un plan d'entraînement
      // En production, cette partie serait remplacée par un appel réel à l'API
      // const response = await axios.post('/api/training/generate-plan', {
      //   colId: selectedCol.id,
      //   userMetrics
      // });
      // setTrainingPlan(response.data);
      
      // Pour le moment, on utilise un plan mocké
      setTimeout(() => {
        setTrainingPlan(generateMockTrainingPlan(selectedCol, userMetrics));
        setLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error("Erreur lors de la génération du plan d'entraînement:", error);
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  // Met à jour les métriques utilisateur (FTP, poids, etc.)
  const updateUserMetric = (metric, value) => {
    setUserMetrics(prev => ({
      ...prev,
      [metric]: value
    }));
  };

  // Génère des zones d'entraînement basées sur la FTP
  const generateTrainingZones = (ftp) => {
    return [
      { zone: 1, name: "Récupération active", min: Math.round(ftp * 0), max: Math.round(ftp * 0.55) },
      { zone: 2, name: "Endurance", min: Math.round(ftp * 0.56), max: Math.round(ftp * 0.75) },
      { zone: 3, name: "Tempo", min: Math.round(ftp * 0.76), max: Math.round(ftp * 0.90) },
      { zone: 4, name: "Seuil", min: Math.round(ftp * 0.91), max: Math.round(ftp * 1.05) },
      { zone: 5, name: "VO2max", min: Math.round(ftp * 1.06), max: Math.round(ftp * 1.20) },
      { zone: 6, name: "Capacité anaérobie", min: Math.round(ftp * 1.21), max: Math.round(ftp * 1.50) },
      { zone: 7, name: "Sprint", min: Math.round(ftp * 1.51), max: "MAX" }
    ];
  };
  
  // Affichage si aucun col n'est sélectionné
  if (!selectedCol) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <FitnessCenterIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Sélectionnez un col pour générer un plan d'entraînement
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choisissez un col dans l'onglet Dashboard pour visualiser un plan d'entraînement spécifique.
        </Typography>
      </Paper>
    );
  }
  
  return (
    <Grid container spacing={3}>
      {/* Informations sur le col sélectionné */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <FitnessCenterIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
            </Grid>
            <Grid item xs>
              <Typography variant="h5">
                Plan d'entraînement: {selectedCol.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {selectedCol.altitude}m • {selectedCol.length}km • {selectedCol.gradient}% • Difficulté: {selectedCol.difficulty}/10
              </Typography>
            </Grid>
            <Grid item>
              {!trainingPlan && !loading && (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={generateTrainingPlan}
                >
                  Générer un plan
                </Button>
              )}
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Chargement */}
      {loading && (
        <Grid item xs={12}>
          <Paper sx={{ p: 5, textAlign: 'center' }}>
            <CircularProgress />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Génération de votre plan d'entraînement personnalisé...
            </Typography>
          </Paper>
        </Grid>
      )}
      
      {/* Plan d'entraînement */}
      {trainingPlan && !loading && (
        <>
          {/* Aperçu du plan */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Aperçu du plan
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Durée totale
                </Typography>
                <Typography variant="h4" color="primary">
                  {trainingPlan.duration} semaines
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Focus d'entraînement
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {trainingPlan.focus.map((focus, index) => (
                  <Chip 
                    key={index}
                    label={focus}
                    color={
                      focus === 'Endurance' ? 'success' : 
                      focus === 'Force' ? 'error' :
                      focus === 'Seuil' ? 'warning' : 'info'
                    }
                    size="small"
                  />
                ))}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Zones d'entraînement (basées sur votre FTP: {userMetrics.ftp}W)
              </Typography>
              <List dense>
                {generateTrainingZones(userMetrics.ftp).map((zone) => (
                  <ListItem key={zone.zone} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: 
                            zone.zone <= 2 ? 'success.main' : 
                            zone.zone <= 4 ? 'warning.main' : 'error.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 'bold'
                        }}
                      >
                        {zone.zone}
                      </Box>
                    </ListItemIcon>
                    <ListItemText 
                      primary={zone.name} 
                      secondary={`${zone.min} - ${zone.max} W`} 
                      sx={{ my: 0 }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
          
          {/* Progression du plan */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Progression sur {trainingPlan.duration} semaines
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Ce plan a été créé spécifiquement pour préparer l'ascension de {selectedCol.name}.
                Les séances sont adaptées à vos métriques et aux caractéristiques du col.
              </Alert>
              
              <Stepper activeStep={activeStep} orientation="vertical">
                {trainingPlan.weeks.map((week, index) => (
                  <Step key={index}>
                    <StepLabel>
                      <Typography variant="subtitle1">
                        Semaine {index + 1}: {week.focus}
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" paragraph>
                        {week.description}
                      </Typography>
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Séances clés:
                      </Typography>
                      
                      {week.workouts.map((workout, workoutIndex) => (
                        <Card key={workoutIndex} variant="outlined" sx={{ mb: 2 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <DirectionsBikeIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                              <Typography variant="subtitle1">
                                {workout.name}
                              </Typography>
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {workout.description}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              <Chip 
                                icon={<TimerIcon />} 
                                label={`${workout.duration}`} 
                                size="small" 
                                variant="outlined"
                              />
                              <Chip 
                                icon={<SpeedIcon />} 
                                label={`Zone ${workout.zone}`} 
                                size="small" 
                                color={
                                  workout.zone <= 2 ? 'success' : 
                                  workout.zone <= 4 ? 'warning' : 'error'
                                }
                                variant="outlined"
                              />
                              <Chip 
                                icon={<WhatshotIcon />} 
                                label={`TSS: ${workout.tss}`} 
                                size="small" 
                                variant="outlined"
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                      
                      <Box sx={{ mb: 2, mt: 2 }}>
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          sx={{ mr: 1 }}
                          disabled={index === trainingPlan.weeks.length - 1}
                        >
                          {index === trainingPlan.weeks.length - 1 ? 'Terminer' : 'Semaine suivante'}
                        </Button>
                        <Button
                          disabled={index === 0}
                          onClick={handleBack}
                          sx={{ mr: 1 }}
                        >
                          Précédent
                        </Button>
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
              
              {activeStep === trainingPlan.weeks.length && (
                <Paper square elevation={0} sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircleOutlineIcon sx={{ color: 'success.main', mr: 1, fontSize: 30 }} />
                    <Typography variant="h6">
                      Plan d'entraînement complet!
                    </Typography>
                  </Box>
                  <Typography paragraph>
                    Vous avez parcouru toutes les semaines du plan d'entraînement. Suivez ce programme pour être prêt à affronter {selectedCol.name}.
                  </Typography>
                  <Button onClick={handleReset} variant="outlined">
                    Revoir le plan
                  </Button>
                </Paper>
              )}
            </Paper>
          </Grid>
        </>
      )}
    </Grid>
  );
}

// Fonction pour générer un plan d'entraînement mocké
function generateMockTrainingPlan(col, userMetrics) {
  // Adaptations basées sur les caractéristiques du col
  const duration = col.difficulty > 8 ? 8 : col.difficulty > 6 ? 6 : 4;
  
  // Détermine le focus d'entraînement en fonction des caractéristiques du col
  const focus = [];
  
  if (col.length > 20) focus.push('Endurance');
  if (col.gradient > 8) focus.push('Force');
  if (col.altitude > 2000) focus.push('Altitude');
  if (col.difficulty > 7) focus.push('Seuil');
  
  // Génère les semaines d'entraînement
  const weeks = [];
  
  for (let i = 0; i < duration; i++) {
    // Phase du plan (préparation, construction, spécialisation, affûtage)
    const phase = i < duration * 0.25 ? 'préparation' : 
                 i < duration * 0.6 ? 'construction' :
                 i < duration * 0.85 ? 'spécialisation' : 'affûtage';
    
    // Focus de la semaine basé sur la phase et les caractéristiques du col
    let weekFocus = '';
    let description = '';
    
    if (phase === 'préparation') {
      weekFocus = 'Base aérobie';
      description = `Développement de l'endurance de base avec un volume modéré et une intensité faible. Accent sur des sorties longues en zone 2 pour préparer le corps aux charges plus importantes à venir.`;
    } else if (phase === 'construction') {
      if (col.gradient > 8 && i % 2 === 0) {
        weekFocus = 'Force-endurance';
        description = `Développement de la force spécifique nécessaire pour les pentes raides de ${col.name}. Inclut des intervalles à basse cadence et des répétitions en montée.`;
      } else {
        weekFocus = 'Endurance et seuil';
        description = `Augmentation progressive de l'intensité avec des intervalles au seuil. Prépare le système aérobie à soutenir des efforts prolongés comme ceux requis sur ${col.name}.`;
      }
    } else if (phase === 'spécialisation') {
      if (col.altitude > 2000) {
        weekFocus = 'Simulation d\'altitude';
        description = `Préparation spécifique pour les exigences d'altitude de ${col.name}. Sessions d'intervalles ciblant le système aérobie et la capacité tampon musculaire.`;
      } else {
        weekFocus = 'Spécificité';
        description = `Sessions qui reproduisent les exigences exactes de ${col.name}, avec des intervalles reproduisant le profil du col et des efforts similaires.`;
      }
    } else {
      weekFocus = 'Affûtage';
      description = `Réduction du volume tout en maintenant l'intensité pour optimiser la fraîcheur et la forme avant de tenter ${col.name}. Focus sur la récupération et les sessions de qualité courtes.`;
    }
    
    // Génère des séances d'entraînement pour la semaine
    const workouts = [];
    
    // Séance clé 1
    if (phase === 'préparation') {
      workouts.push({
        name: 'Endurance longue',
        description: `Sortie longue en zone 2 pour développer l'endurance aérobie et l'efficacité métabolique.`,
        duration: '3-4h',
        zone: 2,
        tss: 150
      });
    } else if (phase === 'construction') {
      workouts.push({
        name: 'Intervalles au seuil',
        description: `3-4 x 10-15 minutes en zone 4 avec 5 minutes de récupération. Développe la capacité à maintenir un effort élevé sur les sections difficiles de ${col.name}.`,
        duration: '1h30-2h',
        zone: 4,
        tss: 120
      });
    } else if (phase === 'spécialisation') {
      workouts.push({
        name: `Simulation ${col.name}`,
        description: `Session qui reproduit l'effort requis pour gravir ${col.name}, avec des changements d'intensité correspondant au profil du col.`,
        duration: `${Math.round(col.length / 15 * 60)} min`,
        zone: 3,
        tss: 140
      });
    } else {
      workouts.push({
        name: 'Activation pré-événement',
        description: 'Session courte avec quelques accélérations pour maintenir le système neuromusculaire en éveil sans accumuler de fatigue.',
        duration: '1h',
        zone: '1-5',
        tss: 60
      });
    }
    
    // Séance clé 2
    if (phase === 'préparation') {
      workouts.push({
        name: 'Tempo varié',
        description: 'Alternance de périodes en zone 3 et zone 2 pour développer l\'efficacité aérobie.',
        duration: '1h30-2h',
        zone: '2-3',
        tss: 90
      });
    } else if (phase === 'construction') {
      if (col.gradient > 8) {
        workouts.push({
          name: 'Force en montée',
          description: `5-8 répétitions de 5 minutes en montée à basse cadence (50-60 rpm) pour développer la force spécifique nécessaire sur les pentes de ${col.name}.`,
          duration: '1h30',
          zone: '3-4',
          tss: 110
        });
      } else {
        workouts.push({
          name: 'Sweet Spot prolongé',
          description: '2 x 20 minutes à 88-93% de FTP pour développer l\'endurance au seuil.',
          duration: '1h30',
          zone: '3-4',
          tss: 100
        });
      }
    } else if (phase === 'spécialisation') {
      if (col.altitude > 2000) {
        workouts.push({
          name: 'Intervalles VO2max',
          description: '5-6 x 3 minutes en zone 5 avec 3 minutes de récupération pour améliorer la capacité aérobie et l\'adaptation à l\'altitude.',
          duration: '1h15',
          zone: 5,
          tss: 110
        });
      } else {
        workouts.push({
          name: 'Changements de rythme',
          description: `Session avec des changements fréquents d'intensité pour simuler les variations de pente sur ${col.name}.`,
          duration: '1h30',
          zone: '3-5',
          tss: 120
        });
      }
    } else {
      workouts.push({
        name: 'Affûtage spécifique',
        description: 'Quelques intervalles courts au seuil pour maintenir les adaptations sans accumuler de fatigue.',
        duration: '1h',
        zone: 4,
        tss: 70
      });
    }
    
    // Ajoute une troisième séance pour les phases de construction et spécialisation
    if (phase === 'construction' || phase === 'spécialisation') {
      if (col.length > 20) {
        workouts.push({
          name: 'Endurance spécifique',
          description: `Sortie longue avec des sections en zone 3 pour simuler l'endurance requise sur ${col.name}.`,
          duration: '3-4h',
          zone: '2-3',
          tss: 180
        });
      } else if (phase === 'spécialisation') {
        workouts.push({
          name: 'Sessions à intensité mixte',
          description: 'Entraînement qui combine des efforts de différentes intensités pour préparer tous les systèmes énergétiques.',
          duration: '2h',
          zone: '1-5',
          tss: 140
        });
      }
    }
    
    weeks.push({
      focus: weekFocus,
      description,
      workouts
    });
  }
  
  return {
    duration,
    focus,
    weeks,
    colId: col.id,
    userFtp: userMetrics.ftp,
    userWeight: userMetrics.weight
  };
}

export default ColSpecificTraining;
