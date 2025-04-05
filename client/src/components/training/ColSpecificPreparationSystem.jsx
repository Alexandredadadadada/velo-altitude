import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Tabs, 
  Tab, 
  Button, 
  CircularProgress, 
  Stepper,
  Step,
  StepLabel,
  Divider,
  Alert,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Terrain, 
  FitnessCenter, 
  DirectionsBike, 
  CalendarMonth,
  Done,
  TrendingUp,
  StackedLineChart
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Importation des sous-composants
import ColSelector from './colPreparation/ColSelector';
import UserCapabilityAnalyzer from './colPreparation/UserCapabilityAnalyzer';
import TrainingProgramGenerator from './colPreparation/TrainingProgramGenerator';
import TrainingProgramReview from './colPreparation/TrainingProgramReview';

/**
 * Système de génération de programmes d'entraînement spécifiques pour chaque col
 * Adapte les recommandations au profil de l'utilisateur et aux caractéristiques du col
 */
const ColSpecificPreparationSystem = ({ userProfile, colsData }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // États pour la génération de programme
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedCol, setSelectedCol] = useState(null);
  const [userCapabilities, setUserCapabilities] = useState({
    ftp: userProfile?.ftp || 250,
    weight: userProfile?.weight || 70,
    experience: userProfile?.experience || 'intermediate',
    weeklyHours: userProfile?.weeklyHours || 8,
    preferredTrainingDays: userProfile?.preferredTrainingDays || [1, 3, 5, 6], // Lundi, Mercredi, Vendredi, Samedi
    raceDate: null,
    stravaData: null,
    previousColTimes: {},
    strengthTraining: userProfile?.strengthTraining || false,
    limitingFactors: []
  });
  const [generatedProgram, setGeneratedProgram] = useState(null);
  const [error, setError] = useState(null);
  
  // Étapes du processus
  const steps = [
    { 
      label: 'Sélection du col', 
      description: 'Choisissez le col que vous souhaitez préparer',
      icon: <Terrain />
    },
    { 
      label: 'Analyse du profil', 
      description: 'Analysons vos capacités et objectifs',
      icon: <StackedLineChart />
    },
    { 
      label: 'Génération du programme', 
      description: 'Création d\'un programme sur mesure',
      icon: <FitnessCenter />
    },
    { 
      label: 'Validation et planification', 
      description: 'Révision et intégration au calendrier',
      icon: <CalendarMonth />
    }
  ];
  
  // Chargement des données Strava de l'utilisateur si disponibles
  useEffect(() => {
    if (userProfile?.stravaConnected) {
      setLoading(true);
      
      // Simule le chargement des données Strava
      setTimeout(() => {
        const mockStravaData = {
          recentRides: [
            { id: 'strava-1', name: 'Sortie matinale', distance: 45, elevation: 650, time: 7200, power: 196, heartRate: 142 },
            { id: 'strava-2', name: 'Col de la Madeleine', distance: 80, elevation: 1800, time: 14400, power: 188, heartRate: 156 },
            { id: 'strava-3', name: 'Sortie récupération', distance: 30, elevation: 200, time: 3600, power: 145, heartRate: 124 }
          ],
          powerCurve: {
            '5s': 850,
            '30s': 650,
            '1min': 450,
            '5min': 340,
            '20min': 280,
            '60min': 255
          },
          trainingLoad: {
            ctl: 85, // Chronic Training Load
            atl: 95, // Acute Training Load
            tsb: -10, // Training Stress Balance
            weeklyTSS: [320, 350, 280, 400, 360, 290, 330, 310] // 8 dernières semaines
          }
        };
        
        setUserCapabilities(prev => ({
          ...prev,
          stravaData: mockStravaData
        }));
        
        setLoading(false);
      }, 1500);
    }
  }, [userProfile]);
  
  // Gestion de la navigation entre les étapes
  const handleNext = useCallback(() => {
    if (activeStep === 0 && !selectedCol) {
      setError('Veuillez sélectionner un col pour continuer');
      return;
    }
    
    if (activeStep === 1 && !userCapabilities.raceDate) {
      setError('Veuillez définir une date cible pour votre ascension');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    // Simulation d'un traitement
    setTimeout(() => {
      setLoading(false);
      
      // Génération du programme à l'étape 2
      if (activeStep === 2) {
        generateTrainingProgram();
      }
      
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }, 1000);
  }, [activeStep, selectedCol, userCapabilities]);
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError(null);
  };
  
  const handleReset = () => {
    setActiveStep(0);
    setSelectedCol(null);
    setGeneratedProgram(null);
    setError(null);
  };
  
  // Sélection d'un col
  const handleColSelect = (col) => {
    setSelectedCol(col);
    setError(null);
  };
  
  // Mise à jour des capacités utilisateur
  const handleCapabilitiesChange = (field, value) => {
    setUserCapabilities(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };
  
  // Génération du programme d'entraînement
  const generateTrainingProgram = useCallback(() => {
    if (!selectedCol || !userCapabilities.raceDate) return;
    
    setLoading(true);
    
    // Calculer la durée du programme en semaines
    const today = new Date();
    const targetDate = new Date(userCapabilities.raceDate);
    const timeDiff = targetDate.getTime() - today.getTime();
    const weeksDiff = Math.ceil(timeDiff / (1000 * 3600 * 24 * 7));
    
    // Génération d'un programme fictif
    // Dans un environnement réel, cela ferait appel à un algorithme avancé
    setTimeout(() => {
      // Analyser les caractéristiques du col
      const colCharacteristics = {
        totalDistance: selectedCol.distance,
        totalElevation: selectedCol.elevation,
        maxGradient: selectedCol.maxGradient,
        avgGradient: selectedCol.avgGradient,
        sections: selectedCol.sections || [],
        difficulty: selectedCol.difficulty || 'medium',
        estimatedTime: Math.round(selectedCol.elevation / (userCapabilities.ftp / userCapabilities.weight) * 6) // Estimation simplifiée
      };
      
      // Déterminer les exigences en termes de capacités physiques
      const requiredCapabilities = {
        threshold: colCharacteristics.avgGradient > 8 ? 'high' : 'medium',
        vo2max: colCharacteristics.maxGradient > 12 ? 'high' : 'medium',
        endurance: colCharacteristics.totalDistance > 15 ? 'high' : 'medium',
        strength: colCharacteristics.avgGradient > 7 ? 'high' : 'medium',
        technique: selectedCol.technicality || 'low'
      };
      
      // Générer un programme adapté aux caractéristiques du col et de l'utilisateur
      const program = {
        id: `program-${Date.now()}`,
        name: `Programme spécifique pour ${selectedCol.name}`,
        description: `Programme d'entraînement personnalisé pour préparer l'ascension du ${selectedCol.name} en ${colCharacteristics.estimatedTime} minutes.`,
        durationWeeks: Math.min(weeksDiff, 12), // Maximum 12 semaines
        targetDate: userCapabilities.raceDate,
        colId: selectedCol.id,
        colName: selectedCol.name,
        colCharacteristics,
        requiredCapabilities,
        phases: [
          {
            name: 'Phase de base',
            durationWeeks: Math.round(Math.min(weeksDiff, 12) * 0.4),
            focus: ['Endurance', 'Force'],
            description: 'Développement de l\'endurance de base et de la force spécifique pour la montée',
            weeklyTSS: 300 + Math.round(userCapabilities.ftp / 3),
            keyWorkouts: [
              {
                name: 'Sortie longue progressive',
                type: 'endurance',
                description: 'Sortie longue avec augmentation progressive de l\'intensité',
                duration: 180, // minutes
                tss: 150,
                intervals: [
                  { name: 'Échauffement', duration: 20, zone: 'Z1-Z2' },
                  { name: 'Bloc principal', duration: 140, zone: 'Z2-Z3' },
                  { name: 'Retour au calme', duration: 20, zone: 'Z1' }
                ]
              },
              {
                name: 'Travail de force en côte',
                type: 'strength',
                description: 'Intervals de force en côte à faible cadence',
                duration: 90, // minutes
                tss: 100,
                intervals: [
                  { name: 'Échauffement', duration: 15, zone: 'Z1-Z2' },
                  { name: 'Intervals', duration: 60, zone: 'Z3-Z4', details: '6x5min en Z3-Z4 à 50-60rpm / 5min récup' },
                  { name: 'Retour au calme', duration: 15, zone: 'Z1' }
                ]
              }
            ]
          },
          {
            name: 'Phase spécifique',
            durationWeeks: Math.round(Math.min(weeksDiff, 12) * 0.4),
            focus: ['Seuil', 'Simulation'],
            description: 'Développement de la capacité à maintenir une haute intensité sur la durée',
            weeklyTSS: 350 + Math.round(userCapabilities.ftp / 3),
            keyWorkouts: [
              {
                name: 'Intervals au seuil',
                type: 'threshold',
                description: 'Développement de la puissance au seuil lactique',
                duration: 90, // minutes
                tss: 120,
                intervals: [
                  { name: 'Échauffement', duration: 15, zone: 'Z1-Z2' },
                  { name: 'Intervals', duration: 60, zone: 'Z4', details: '3x15min en Z4 / 5min récup' },
                  { name: 'Retour au calme', duration: 15, zone: 'Z1' }
                ]
              },
              {
                name: 'Simulation de sections',
                type: 'specific',
                description: `Simulation des sections difficiles du ${selectedCol.name}`,
                duration: 120, // minutes
                tss: 140,
                intervals: [
                  { name: 'Échauffement', duration: 20, zone: 'Z1-Z2' },
                  { name: 'Section 1', duration: 15, zone: 'Z4', details: `Simulation de la pente à ${colCharacteristics.maxGradient}%` },
                  { name: 'Récupération', duration: 10, zone: 'Z1-Z2' },
                  { name: 'Section 2', duration: 20, zone: 'Z3', details: 'Section longue à gradient modéré' },
                  { name: 'Récupération', duration: 10, zone: 'Z1-Z2' },
                  { name: 'Section 3', duration: 15, zone: 'Z4', details: 'Section finale avec accélération' },
                  { name: 'Retour au calme', duration: 30, zone: 'Z1-Z2' }
                ]
              }
            ]
          },
          {
            name: 'Phase d\'affûtage',
            durationWeeks: Math.max(1, Math.round(Math.min(weeksDiff, 12) * 0.2)),
            focus: ['Affûtage', 'Récupération'],
            description: 'Réduction du volume et maintien de l\'intensité pour optimiser la fraîcheur',
            weeklyTSS: 200 + Math.round(userCapabilities.ftp / 4),
            keyWorkouts: [
              {
                name: 'Rappels d\'intensité',
                type: 'sharpening',
                description: 'Sessions courtes mais intenses pour maintenir la forme',
                duration: 60, // minutes
                tss: 70,
                intervals: [
                  { name: 'Échauffement', duration: 15, zone: 'Z1-Z2' },
                  { name: 'Intervals', duration: 30, zone: 'Z4-Z5', details: '6x2min en Z5 / 3min récup' },
                  { name: 'Retour au calme', duration: 15, zone: 'Z1' }
                ]
              },
              {
                name: 'Reconnaissance finale',
                type: 'specific',
                description: `Reconnaissance du ${selectedCol.name} à intensité modérée`,
                duration: 120, // minutes
                tss: 100,
                intervals: [
                  { name: 'Échauffement', duration: 15, zone: 'Z1-Z2' },
                  { name: 'Montée', duration: 75, zone: 'Z2-Z3', details: 'Reconnaissance à 70-80% de l\'intensité cible' },
                  { name: 'Descente et retour', duration: 30, zone: 'Z1' }
                ]
              }
            ]
          }
        ],
        weeklySchedule: generateWeeklySchedule(userCapabilities.preferredTrainingDays, userCapabilities.weeklyHours)
      };
      
      setGeneratedProgram(program);
      setLoading(false);
    }, 2000);
  }, [selectedCol, userCapabilities]);
  
  // Génération d'un calendrier hebdomadaire basé sur les préférences de l'utilisateur
  const generateWeeklySchedule = (preferredDays, weeklyHours) => {
    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const schedule = {};
    
    // Initialiser tous les jours comme repos
    daysOfWeek.forEach(day => {
      schedule[day] = { type: 'rest', name: 'Repos', duration: 0 };
    });
    
    // Répartir les entraînements selon les jours préférés
    const sortedDays = [...preferredDays].sort();
    
    // Exemple de répartition (simplifié)
    if (sortedDays.length > 0) {
      // Jour 1: Endurance longue
      schedule[daysOfWeek[sortedDays[0] - 1]] = {
        type: 'endurance',
        name: 'Sortie longue',
        duration: Math.round(weeklyHours * 0.4 * 60), // 40% du volume hebdomadaire
        tss: Math.round(weeklyHours * 0.4 * 60 * 0.6) // TSS approximatif
      };
      
      // Autres jours: répartition des entraînements
      if (sortedDays.length > 1) {
        schedule[daysOfWeek[sortedDays[1] - 1]] = {
          type: 'threshold',
          name: 'Intervals au seuil',
          duration: Math.round(weeklyHours * 0.25 * 60), // 25% du volume hebdomadaire
          tss: Math.round(weeklyHours * 0.25 * 60 * 0.85) // TSS approximatif
        };
      }
      
      if (sortedDays.length > 2) {
        schedule[daysOfWeek[sortedDays[2] - 1]] = {
          type: 'strength',
          name: 'Force spécifique',
          duration: Math.round(weeklyHours * 0.2 * 60), // 20% du volume hebdomadaire
          tss: Math.round(weeklyHours * 0.2 * 60 * 0.75) // TSS approximatif
        };
      }
      
      if (sortedDays.length > 3) {
        schedule[daysOfWeek[sortedDays[3] - 1]] = {
          type: 'recovery',
          name: 'Sortie récupération',
          duration: Math.round(weeklyHours * 0.15 * 60), // 15% du volume hebdomadaire
          tss: Math.round(weeklyHours * 0.15 * 60 * 0.4) // TSS approximatif
        };
      }
    }
    
    return schedule;
  };
  
  // Enregistrement du programme généré
  const handleSaveProgram = () => {
    if (!generatedProgram) return;
    
    setLoading(true);
    
    // Simuler une sauvegarde
    setTimeout(() => {
      setLoading(false);
      navigate('/training/programs/' + generatedProgram.id);
    }, 1000);
  };
  
  // Rendu du contenu basé sur l'étape active
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <ColSelector 
            cols={colsData} 
            selectedCol={selectedCol} 
            onSelectCol={handleColSelect}
            userProfile={userProfile}
          />
        );
      case 1:
        return (
          <UserCapabilityAnalyzer 
            userCapabilities={userCapabilities}
            onChange={handleCapabilitiesChange}
            selectedCol={selectedCol}
          />
        );
      case 2:
        return (
          <TrainingProgramGenerator 
            selectedCol={selectedCol}
            userCapabilities={userCapabilities}
            loading={loading}
          />
        );
      case 3:
        return (
          <TrainingProgramReview 
            program={generatedProgram}
            onSave={handleSaveProgram}
            loading={loading}
          />
        );
      default:
        return 'Étape inconnue';
    }
  };
  
  // Animation pour l'entrée du composant
  const containerAnimation = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerAnimation}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.background.paper, 0.7),
          backdropFilter: 'blur(10px)'
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Préparation spécifique pour ascension de col
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Générez un programme d'entraînement personnalisé pour préparer l'ascension d'un col spécifique.
            Le système analysera vos capacités actuelles et créera un plan adapté à vos objectifs et contraintes.
          </Typography>
        </Box>
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel 
                StepIconProps={{ 
                  icon: step.icon 
                }}
              >
                <Typography variant="body2">{step.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {step.description}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mt: 2, minHeight: 400 }}>
          {getStepContent(activeStep)}
        </Box>
        
        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 4 }}>
          <Button
            color="inherit"
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Retour
          </Button>
          <Box sx={{ flex: '1 1 auto' }} />
          
          {activeStep === steps.length - 1 ? (
            <Button 
              variant="contained"
              color="primary"
              onClick={handleReset}
              disabled={loading}
            >
              Nouveau programme
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
            >
              {loading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                  Traitement...
                </>
              ) : (
                'Suivant'
              )}
            </Button>
          )}
        </Box>
      </Paper>
    </motion.div>
  );
};

export default ColSpecificPreparationSystem;
