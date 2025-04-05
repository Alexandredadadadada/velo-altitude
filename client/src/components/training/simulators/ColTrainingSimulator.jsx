import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  Divider,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Alert,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  PlayArrow, 
  Pause, 
  Refresh, 
  Save, 
  Share, 
  ArrowBack, 
  ArrowForward,
  FitnessCenter,
  Terrain,
  Speed,
  TrendingUp,
  Tour
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { OptimizedVisualizationLoader } from '../../../utils/OptimizedVisualizationLoader';

// Imports différés pour les sous-composants intensifs
const ColSelectionStep = React.lazy(() => import('./simulator-steps/ColSelectionStep'));
const FitnessAssessmentStep = React.lazy(() => import('./simulator-steps/FitnessAssessmentStep'));
const WorkoutGenerationStep = React.lazy(() => import('./simulator-steps/WorkoutGenerationStep'));
const SimulationResultsStep = React.lazy(() => import('./simulator-steps/SimulationResultsStep'));

// Données de test - à remplacer par des API calls
import { sampleCols, sampleUserProfile } from '../../../data/sampleData';

/**
 * Simulateur d'entraînement spécifique pour les cols
 * Permet de générer des plans d'entraînement personnalisés en fonction des cols sélectionnés
 * S'intègre avec le système des "7 Majeurs"
 */
const ColTrainingSimulator = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // États pour le stepper
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState({});
  
  // États des données
  const [selectedCols, setSelectedCols] = useState([]);
  const [userProfile, setUserProfile] = useState(sampleUserProfile);
  const [generatedWorkouts, setGeneratedWorkouts] = useState([]);
  const [simulationResults, setSimulationResults] = useState(null);
  
  // État de l'interface
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [simulationRunning, setSimulationRunning] = useState(false);
  
  // Étapes du simulateur
  const steps = [
    { 
      label: 'Sélection des cols', 
      description: 'Choisissez les cols pour lesquels vous souhaitez vous entraîner',
      icon: <Terrain />
    },
    { 
      label: 'Évaluation de forme', 
      description: 'Analysons votre niveau actuel pour personnaliser votre programme',
      icon: <FitnessCenter />
    },
    { 
      label: 'Génération du programme', 
      description: 'Création d\'un programme d\'entraînement sur mesure',
      icon: <Speed />
    },
    { 
      label: 'Simulation des résultats', 
      description: 'Visualisez vos progrès attendus sur les cols sélectionnés',
      icon: <TrendingUp />
    }
  ];
  
  // Fonctions de navigation du stepper
  const handleNext = () => {
    // Valider l'étape actuelle avant de continuer
    if (validateCurrentStep()) {
      const newCompleted = { ...completed };
      newCompleted[activeStep] = true;
      setCompleted(newCompleted);
      setActiveStep(prevActiveStep => prevActiveStep + 1);
    }
  };
  
  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };
  
  const handleReset = () => {
    setActiveStep(0);
    setCompleted({});
    setSelectedCols([]);
    setGeneratedWorkouts([]);
    setSimulationResults(null);
    setSimulationRunning(false);
    setError(null);
  };
  
  // Validation de l'étape actuelle
  const validateCurrentStep = () => {
    switch (activeStep) {
      case 0: // Sélection des cols
        if (selectedCols.length === 0) {
          setError("Veuillez sélectionner au moins un col");
          return false;
        }
        setError(null);
        return true;
        
      case 1: // Évaluation de forme
        if (!userProfile.ftp || !userProfile.weight) {
          setError("Veuillez compléter votre profil d'entraînement");
          return false;
        }
        setError(null);
        return true;
        
      case 2: // Génération du programme
        if (generatedWorkouts.length === 0) {
          setError("Veuillez générer un programme d'entraînement");
          return false;
        }
        setError(null);
        return true;
        
      case 3: // Simulation des résultats
        return true;
        
      default:
        return true;
    }
  };
  
  // Lancer la simulation d'entraînement
  const startSimulation = () => {
    setSimulationRunning(true);
    setLoading(true);
    
    // Simulation du chargement et du traitement
    setTimeout(() => {
      // Calcul simulé des résultats d'entraînement
      const results = {
        initialTime: selectedCols.map(col => ({
          colId: col.id,
          time: col.estimatedTime,
          power: userProfile.ftp * 0.75
        })),
        projectedTime: selectedCols.map(col => ({
          colId: col.id,
          // Environ 5-15% d'amélioration selon la difficulté du col
          time: col.estimatedTime * (0.85 + (Math.random() * 0.1)),
          power: userProfile.ftp * (0.75 + (Math.random() * 0.1))
        })),
        progressionCurve: Array.from({ length: 12 }, (_, i) => ({
          week: i + 1,
          power: userProfile.ftp * (1 + (i * 0.01)),
          endurance: 100 * (1 + (i * 0.015)),
          recovery: 100 * (1 + (i * 0.005))
        }))
      };
      
      setSimulationResults(results);
      setLoading(false);
    }, 2500);
  };
  
  // Arrêter la simulation
  const stopSimulation = () => {
    setSimulationRunning(false);
  };
  
  // Rendu de l'étape actuelle
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <React.Suspense fallback={<Box sx={{ p: 3, textAlign: 'center' }}>Chargement de la sélection de cols...</Box>}>
            <ColSelectionStep 
              selectedCols={selectedCols}
              onColsChange={setSelectedCols}
              availableCols={sampleCols}
            />
          </React.Suspense>
        );
        
      case 1:
        return (
          <React.Suspense fallback={<Box sx={{ p: 3, textAlign: 'center' }}>Chargement de l'évaluation de forme...</Box>}>
            <FitnessAssessmentStep 
              userProfile={userProfile}
              onProfileChange={setUserProfile}
            />
          </React.Suspense>
        );
        
      case 2:
        return (
          <React.Suspense fallback={<Box sx={{ p: 3, textAlign: 'center' }}>Chargement de la génération du programme...</Box>}>
            <WorkoutGenerationStep 
              selectedCols={selectedCols}
              userProfile={userProfile}
              onWorkoutsGenerated={setGeneratedWorkouts}
              generatedWorkouts={generatedWorkouts}
            />
          </React.Suspense>
        );
        
      case 3:
        return (
          <React.Suspense fallback={<Box sx={{ p: 3, textAlign: 'center' }}>Chargement de la simulation...</Box>}>
            <SimulationResultsStep 
              selectedCols={selectedCols}
              userProfile={userProfile}
              generatedWorkouts={generatedWorkouts}
              simulationResults={simulationResults}
              isRunning={simulationRunning}
              onStart={startSimulation}
              onStop={stopSimulation}
            />
          </React.Suspense>
        );
        
      default:
        return 'Étape inconnue';
    }
  };
  
  // Sauvegarder le programme d'entraînement
  const saveTrainingProgram = () => {
    // Logique pour sauvegarder le programme (API call, localStorage, etc.)
    console.log('Programme sauvegardé :', {
      selectedCols,
      userProfile,
      generatedWorkouts,
      simulationResults
    });
    
    // Afficher une notification de succès (à implémenter)
  };
  
  // Partager le programme d'entraînement
  const shareTrainingProgram = () => {
    // Logique pour générer un lien de partage ou autre
    console.log('Programme partagé');
    
    // Afficher une notification avec le lien (à implémenter)
  };
  
  // Intégrer aux défis des 7 Majeurs
  const navigateToMajorChallenge = () => {
    // Navigation vers la page des défis avec les cols préremplis
    navigate('/challenges/major', { 
      state: { 
        selectedCols, 
        fromTrainingSimulator: true 
      } 
    });
  };

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      {/* En-tête */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          background: `linear-gradient(145deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white'
        }}
        component={motion.div}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Simulateur d'Entraînement pour les Cols
            </Typography>
            <Typography variant="body1">
              Générez un programme personnalisé et visualisez vos progrès potentiels sur vos cols préférés
            </Typography>
          </Box>
          
          <Tooltip title="Intégrer avec le défi des 7 Majeurs">
            <IconButton 
              color="inherit" 
              onClick={navigateToMajorChallenge}
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.3)' } }}
            >
              <Tour />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>
      
      {/* Stepper */}
      <Stepper 
        activeStep={activeStep} 
        alternativeLabel={!isMobile}
        orientation={isMobile ? 'vertical' : 'horizontal'}
        sx={{ mb: 3 }}
      >
        {steps.map((step, index) => (
          <Step key={step.label} completed={completed[index]}>
            <StepLabel 
              StepIconProps={{ 
                icon: step.icon || index + 1 
              }}
              optional={!isMobile && index === activeStep ? (
                <Typography variant="caption">{step.description}</Typography>
              ) : null}
            >
              {step.label}
              {isMobile && <Typography variant="caption" display="block">{step.description}</Typography>}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {/* Message d'erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Contenu de l'étape */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: { xs: 2, md: 3 }, 
          borderRadius: 2,
          minHeight: 400
        }}
      >
        {getStepContent(activeStep)}
      </Paper>
      
      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          disabled={activeStep === 0}
          onClick={handleBack}
          startIcon={<ArrowBack />}
        >
          Retour
        </Button>
        
        <Box>
          {activeStep === steps.length - 1 && simulationResults && (
            <>
              <Button 
                variant="contained" 
                color="success" 
                sx={{ mr: 1 }}
                onClick={saveTrainingProgram}
                startIcon={<Save />}
              >
                Sauvegarder
              </Button>
              
              <Button 
                variant="outlined" 
                color="primary" 
                sx={{ mr: 1 }}
                onClick={shareTrainingProgram}
                startIcon={<Share />}
              >
                Partager
              </Button>
            </>
          )}
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={activeStep === steps.length - 1 ? handleReset : handleNext}
            endIcon={activeStep === steps.length - 1 ? <Refresh /> : <ArrowForward />}
          >
            {activeStep === steps.length - 1 ? 'Recommencer' : 'Suivant'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ColTrainingSimulator;
