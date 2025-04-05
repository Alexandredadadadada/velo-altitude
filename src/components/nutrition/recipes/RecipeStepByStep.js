import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Stepper, 
  Step, 
  StepLabel, 
  StepContent,
  Button,
  IconButton,
  Card,
  CardMedia,
  MobileStepper,
  Dialog,
  DialogContent,
  useMediaQuery,
  Zoom,
  Fade,
  Grow
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import {
  KeyboardArrowLeft,
  KeyboardArrowRight,
  KeyboardArrowUp,
  KeyboardArrowDown,
  ZoomIn,
  FullscreenExit,
  Print,
  AccessTime,
  Check,
  Close,
  PlayCircleOutline,
  PauseCircleOutline
} from '@mui/icons-material';

// Style pour le conteneur principal
const StepperContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(4),
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  position: 'relative',
  overflow: 'hidden'
}));

// Style pour les images des étapes
const StepImage = styled(CardMedia)(({ theme }) => ({
  height: 280,
  borderRadius: theme.spacing(1),
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  cursor: 'pointer',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.03)'
  }
}));

// Style pour la vue immersive
const ImmersiveView = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  zIndex: 1300,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center'
}));

// Style pour les boutons d'étape
const StepButton = styled(Button)(({ theme, active }) => ({
  marginRight: theme.spacing(1),
  marginBottom: theme.spacing(1),
  fontWeight: active ? 'bold' : 'normal',
  backgroundColor: active ? theme.palette.primary.main : theme.palette.grey[200],
  color: active ? theme.palette.primary.contrastText : theme.palette.text.primary,
  '&:hover': {
    backgroundColor: active ? theme.palette.primary.dark : theme.palette.grey[300],
  }
}));

// Composant de visualisation pas-à-pas des recettes
const RecipeStepByStep = ({ 
  recipe, 
  compact = false, 
  initialStep = 0,
  autoplayEnabled = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(initialStep);
  const [skipped, setSkipped] = useState(new Set());
  const [zoomDialogOpen, setZoomDialogOpen] = useState(false);
  const [immersiveMode, setImmersiveMode] = useState(false);
  const [autoplay, setAutoplay] = useState(autoplayEnabled);
  const [progress, setProgress] = useState(0);
  const maxSteps = recipe?.instructions?.length || 0;
  const autoplayDuration = 10000; // 10 secondes par étape
  
  // Réinitialiser les étapes et le mode immersif lorsque la recette change
  useEffect(() => {
    setActiveStep(initialStep);
    setImmersiveMode(false);
    setAutoplay(autoplayEnabled);
    setSkipped(new Set());
  }, [recipe, initialStep, autoplayEnabled]);
  
  // Gestion de l'autoplay
  useEffect(() => {
    let timer;
    let progressTimer;
    
    if (autoplay && activeStep < maxSteps - 1) {
      // Timer pour l'avancement automatique des étapes
      timer = setTimeout(() => {
        setActiveStep((prevStep) => prevStep + 1);
        setProgress(0);
      }, autoplayDuration);
      
      // Timer pour la barre de progression
      const updateInterval = 100; // Mise à jour tous les 100ms
      progressTimer = setInterval(() => {
        setProgress((prevProgress) => {
          const newProgress = prevProgress + (100 * updateInterval / autoplayDuration);
          return newProgress > 100 ? 100 : newProgress;
        });
      }, updateInterval);
    }
    
    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, [autoplay, activeStep, maxSteps]);
  
  // Vérifier si une étape a été sautée
  const isStepSkipped = (step) => {
    return skipped.has(step);
  };
  
  // Passer à l'étape suivante
  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
    setProgress(0);
  };
  
  // Revenir à l'étape précédente
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setProgress(0);
  };
  
  // Sauter une étape
  const handleSkip = () => {
    if (!recipe.instructions[activeStep].optional) {
      throw new Error("Vous ne pouvez pas sauter une étape obligatoire.");
    }
    
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
    setProgress(0);
  };
  
  // Réinitialiser les étapes
  const handleReset = () => {
    setActiveStep(0);
    setSkipped(new Set());
    setProgress(0);
  };
  
  // Ouvrir/fermer le zoom sur l'image
  const handleZoomToggle = () => {
    setZoomDialogOpen(!zoomDialogOpen);
  };
  
  // Basculer en mode immersif
  const toggleImmersiveMode = () => {
    setImmersiveMode(!immersiveMode);
  };
  
  // Activer/désactiver l'autoplay
  const toggleAutoplay = () => {
    setAutoplay(!autoplay);
    setProgress(0);
  };
  
  // Aller directement à une étape spécifique
  const goToStep = (step) => {
    setActiveStep(step);
    setProgress(0);
  };
  
  // Récupérer l'image pour l'étape actuelle
  const getCurrentStepImage = () => {
    // Si nous avons des images d'étapes spécifiques, les utiliser
    if (recipe.stepImages && recipe.stepImages[activeStep]) {
      return recipe.stepImages[activeStep];
    }
    
    // Sinon, utiliser l'image principale de la recette
    return recipe.imageUrl;
  };
  
  // Si nous n'avons pas de recette, afficher un message
  if (!recipe || !recipe.instructions || recipe.instructions.length === 0) {
    return (
      <StepperContainer>
        <Typography variant="body1">
          Aucune instruction disponible pour cette recette.
        </Typography>
      </StepperContainer>
    );
  }
  
  // Affichage en mode immersif
  if (immersiveMode) {
    return (
      <ImmersiveView>
        <IconButton 
          onClick={toggleImmersiveMode}
          sx={{ position: 'absolute', top: 20, right: 20, color: 'white' }}
        >
          <FullscreenExit fontSize="large" />
        </IconButton>
        
        <Box sx={{ width: '80%', maxWidth: 1200 }}>
          <Fade in={true} timeout={500}>
            <Box>
              <Box 
                sx={{ 
                  height: '60vh', 
                  backgroundImage: `url(${getCurrentStepImage()})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: 2,
                  mb: 2
                }} 
              />
              
              <Typography variant="h4" color="white" gutterBottom>
                Étape {activeStep + 1}: {recipe.instructions[activeStep].title || `Instructions`}
              </Typography>
              
              <Typography variant="h6" color="white" sx={{ mb: 4 }}>
                {recipe.instructions[activeStep].text || recipe.instructions[activeStep]}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button 
                  onClick={handleBack}
                  disabled={activeStep === 0}
                  variant="contained"
                  sx={{ mr: 1 }}
                  startIcon={<KeyboardArrowLeft />}
                >
                  Précédent
                </Button>
                
                <Button
                  onClick={toggleAutoplay}
                  variant="contained"
                  color={autoplay ? "secondary" : "primary"}
                  startIcon={autoplay ? <PauseCircleOutline /> : <PlayCircleOutline />}
                >
                  {autoplay ? "Pause" : "Lecture automatique"}
                </Button>
                
                {activeStep === maxSteps - 1 ? (
                  <Button 
                    onClick={handleReset}
                    variant="contained"
                    color="success"
                    endIcon={<Check />}
                  >
                    Terminer
                  </Button>
                ) : (
                  <Button 
                    onClick={handleNext}
                    variant="contained"
                    endIcon={<KeyboardArrowRight />}
                  >
                    Suivant
                  </Button>
                )}
              </Box>
              
              {/* Barre de progression pour l'autoplay */}
              {autoplay && activeStep < maxSteps - 1 && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <Box 
                    sx={{ 
                      height: 4, 
                      width: `${progress}%`, 
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: 2,
                      transition: 'width 0.1s linear'
                    }} 
                  />
                </Box>
              )}
            </Box>
          </Fade>
        </Box>
      </ImmersiveView>
    );
  }
  
  // Affichage en mode compact (mobile)
  if (isMobile || compact) {
    return (
      <StepperContainer>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', pb: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Instructions de préparation
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
            {recipe.instructions.map((_, index) => (
              <StepButton 
                key={index}
                size="small"
                active={index === activeStep}
                onClick={() => goToStep(index)}
              >
                {index + 1}
              </StepButton>
            ))}
          </Box>
          
          <Grow in={true} timeout={500}>
            <Card>
              <StepImage
                image={getCurrentStepImage()}
                title={`Étape ${activeStep + 1}`}
                onClick={handleZoomToggle}
              />
            </Card>
          </Grow>
        </Box>
        
        <Box sx={{ p: 2, bgcolor: theme.palette.grey[50], borderRadius: 1, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Étape {activeStep + 1}: {recipe.instructions[activeStep].title || `Instructions`}
          </Typography>
          
          <Typography variant="body1" paragraph>
            {recipe.instructions[activeStep].text || recipe.instructions[activeStep]}
          </Typography>
          
          {recipe.instructions[activeStep].tip && (
            <Box sx={{ p: 1, bgcolor: theme.palette.info.light, borderRadius: 1, mt: 1 }}>
              <Typography variant="body2" fontStyle="italic">
                <strong>Astuce:</strong> {recipe.instructions[activeStep].tip}
              </Typography>
            </Box>
          )}
        </Box>
        
        <MobileStepper
          variant="dots"
          steps={maxSteps}
          position="static"
          activeStep={activeStep}
          nextButton={
            activeStep === maxSteps - 1 ? (
              <Button 
                size="small" 
                onClick={toggleImmersiveMode}
                color="primary"
              >
                Mode immersif
              </Button>
            ) : (
              <Button
                size="small"
                onClick={handleNext}
                disabled={activeStep === maxSteps - 1}
              >
                Suivant
                <KeyboardArrowRight />
              </Button>
            )
          }
          backButton={
            <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
              <KeyboardArrowLeft />
              Précédent
            </Button>
          }
        />
        
        {/* Dialog pour zoom sur l'image */}
        <Dialog
          open={zoomDialogOpen}
          onClose={handleZoomToggle}
          maxWidth="md"
          fullWidth
        >
          <DialogContent sx={{ p: 0, position: 'relative' }}>
            <IconButton
              onClick={handleZoomToggle}
              sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.7)' }}
            >
              <Close />
            </IconButton>
            <img 
              src={getCurrentStepImage()} 
              alt={`Étape ${activeStep + 1}`} 
              style={{ width: '100%', height: 'auto', display: 'block' }} 
            />
          </DialogContent>
        </Dialog>
      </StepperContainer>
    );
  }
  
  // Affichage en mode desktop standard
  return (
    <StepperContainer>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Préparation pas à pas
        </Typography>
        
        <Box>
          <Button
            startIcon={autoplay ? <PauseCircleOutline /> : <PlayCircleOutline />}
            onClick={toggleAutoplay}
            color={autoplay ? "secondary" : "primary"}
            sx={{ mr: 1 }}
          >
            {autoplay ? "Pause" : "Auto-play"}
          </Button>
          
          <Button
            startIcon={immersiveMode ? <FullscreenExit /> : <ZoomIn />}
            onClick={toggleImmersiveMode}
            color="primary"
            variant="outlined"
          >
            Mode immersif
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 3 }}>
        {/* Partie gauche: Image et contrôles */}
        <Box sx={{ flex: 1, maxWidth: isMobile ? '100%' : '45%' }}>
          <Grow in={true} timeout={500}>
            <Card sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
              <StepImage
                image={getCurrentStepImage()}
                title={`Étape ${activeStep + 1}`}
                onClick={handleZoomToggle}
                sx={{ height: 350 }}
              />
            </Card>
          </Grow>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
            {recipe.instructions.map((_, index) => (
              <StepButton 
                key={index}
                size="small"
                active={index === activeStep}
                onClick={() => goToStep(index)}
              >
                {index + 1}
              </StepButton>
            ))}
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<KeyboardArrowLeft />}
            >
              Précédent
            </Button>
            
            {activeStep === maxSteps - 1 ? (
              <Button 
                onClick={handleReset}
                variant="contained"
                color="success"
                endIcon={<Check />}
              >
                Terminer
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                variant="contained"
                endIcon={<KeyboardArrowRight />}
              >
                Suivant
              </Button>
            )}
          </Box>
          
          {/* Barre de progression pour l'autoplay */}
          {autoplay && activeStep < maxSteps - 1 && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <Box 
                sx={{ 
                  height: 4, 
                  width: `${progress}%`, 
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: 2,
                  transition: 'width 0.1s linear'
                }} 
              />
            </Box>
          )}
        </Box>
        
        {/* Partie droite: Stepper avec instructions */}
        <Box sx={{ flex: 1, maxWidth: isMobile ? '100%' : '55%' }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {recipe.instructions.map((step, index) => {
              const stepProps = {};
              const labelProps = {};
              
              if (isStepSkipped(index)) {
                stepProps.completed = false;
              }
              
              const stepContent = step.text || step;
              const stepTitle = step.title || `Étape ${index + 1}`;
              
              return (
                <Step key={index} {...stepProps}>
                  <StepLabel {...labelProps}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {stepTitle}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {stepContent}
                    </Typography>
                    
                    {step.tip && (
                      <Box sx={{ p: 1, bgcolor: theme.palette.info.light, borderRadius: 1, mb: 2 }}>
                        <Typography variant="body2" fontStyle="italic">
                          <strong>Astuce:</strong> {step.tip}
                        </Typography>
                      </Box>
                    )}
                    
                    {step.timers && step.timers.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {step.timers.map((timer, timerIndex) => (
                          <Chip
                            key={timerIndex}
                            icon={<AccessTime />}
                            label={`${timer.label}: ${timer.duration} min`}
                            color="primary"
                            variant="outlined"
                            size="small"
                          />
                        ))}
                      </Box>
                    )}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Button
                        disabled={index === 0}
                        onClick={handleBack}
                        startIcon={<KeyboardArrowUp />}
                        size="small"
                      >
                        Précédent
                      </Button>
                      
                      {index === maxSteps - 1 ? (
                        <Button 
                          onClick={handleReset}
                          variant="contained"
                          color="success"
                          size="small"
                          endIcon={<Check />}
                        >
                          Terminer
                        </Button>
                      ) : (
                        <Button
                          onClick={handleNext}
                          variant="contained"
                          size="small"
                          endIcon={<KeyboardArrowDown />}
                        >
                          Suivant
                        </Button>
                      )}
                    </Box>
                  </StepContent>
                </Step>
              );
            })}
          </Stepper>
          
          {activeStep === maxSteps && (
            <Paper square elevation={0} sx={{ p: 3, mt: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Félicitations! Votre recette est prête.
              </Typography>
              <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
                Recommencer
              </Button>
              <Button onClick={() => {/* Fonction d'impression */}} startIcon={<Print />}>
                Imprimer
              </Button>
            </Paper>
          )}
        </Box>
      </Box>
      
      {/* Dialog pour zoom sur l'image */}
      <Dialog
        open={zoomDialogOpen}
        onClose={handleZoomToggle}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={handleZoomToggle}
            sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.7)' }}
          >
            <Close />
          </IconButton>
          <img 
            src={getCurrentStepImage()} 
            alt={`Étape ${activeStep + 1}`} 
            style={{ width: '100%', height: 'auto', display: 'block' }} 
          />
          
          <Box 
            sx={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              right: 0, 
              p: 2, 
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white' 
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              Étape {activeStep + 1}: {recipe.instructions[activeStep].title || `Instructions`}
            </Typography>
            <Typography variant="body2">
              {recipe.instructions[activeStep].text || recipe.instructions[activeStep]}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </StepperContainer>
  );
};

export default RecipeStepByStep;
