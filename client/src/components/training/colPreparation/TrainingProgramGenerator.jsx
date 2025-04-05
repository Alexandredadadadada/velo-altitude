import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  LinearProgress, 
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  alpha,
  Paper
} from '@mui/material';
import { 
  FitnessCenter, 
  DirectionsBike, 
  TrendingUp,
  Terrain,
  Speed,
  StackedLineChart,
  Timer,
  CalendarMonth,
  Whatshot,
  DoneOutline,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Composant pour la génération visuelle du programme d'entraînement
 * Affiche une animation et des étapes pour la génération du programme
 */
const TrainingProgramGenerator = ({ selectedCol, userCapabilities, loading }) => {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // Liste des étapes du processus de génération
  const generationSteps = [
    {
      label: 'Analyse du profil du col',
      description: 'Nous analysons les caractéristiques spécifiques du col',
      icon: <Terrain />,
      detailItems: [
        `Dénivelé: ${selectedCol?.elevation || 0}m`,
        `Distance: ${selectedCol?.distance || 0}km`,
        `Pente moyenne: ${selectedCol?.avgGradient || 0}%`,
        `Pente maximale: ${selectedCol?.maxGradient || 0}%`,
        `Difficulté: ${
          selectedCol?.difficulty === 'easy' ? 'Facile' :
          selectedCol?.difficulty === 'medium' ? 'Modéré' :
          selectedCol?.difficulty === 'hard' ? 'Difficile' : 'Extrême'
        }`
      ]
    },
    {
      label: 'Évaluation de vos capacités',
      description: 'Nous évaluons vos capacités actuelles et objectifs',
      icon: <FitnessCenter />,
      detailItems: [
        `FTP: ${userCapabilities.ftp}W (${Math.round((userCapabilities.ftp / userCapabilities.weight) * 10) / 10} W/kg)`,
        `Niveau d'expérience: ${
          userCapabilities.experience === 'beginner' ? 'Débutant' :
          userCapabilities.experience === 'intermediate' ? 'Intermédiaire' :
          userCapabilities.experience === 'advanced' ? 'Avancé' : 'Expert'
        }`,
        `Disponibilité: ${userCapabilities.weeklyHours} heures/semaine`,
        `Force spécifique: ${userCapabilities.strengthTraining ? 'Incluse' : 'Non incluse'}`
      ]
    },
    {
      label: 'Analyse des exigences',
      description: 'Nous déterminons les exigences physiologiques pour ce col',
      icon: <SpeedIcon />,
      detailItems: [
        'Analyse du profil de puissance requis',
        'Évaluation de l\'endurance spécifique nécessaire',
        'Calcul des zones d\'intensité optimales',
        `Estimation du temps d'ascension cible: ${Math.round(selectedCol?.elevation / (userCapabilities.ftp / userCapabilities.weight) * 0.1)} minutes`
      ]
    },
    {
      label: 'Structuration du programme',
      description: 'Nous créons la structure optimale du programme',
      icon: <StackedLineChart />,
      detailItems: [
        'Définition des phases d\'entraînement',
        'Répartition optimale du volume et de l\'intensité',
        'Intégration des sessions spécifiques',
        'Planification de la progression'
      ]
    },
    {
      label: 'Personnalisation',
      description: 'Nous adaptons le programme à vos contraintes',
      icon: <CalendarMonth />,
      detailItems: [
        `Adaptation au planning: ${userCapabilities.weeklyHours} heures/semaine`,
        `Jours préférés: ${userCapabilities.preferredTrainingDays.map(day => ['L', 'Ma', 'Me', 'J', 'V', 'S', 'D'][day-1]).join(', ')}`,
        'Optimisation de la récupération',
        'Ajustement selon vos facteurs limitants'
      ]
    },
    {
      label: 'Finalisation',
      description: 'Nous finalisons et optimisons votre programme',
      icon: <DoneOutline />,
      detailItems: [
        'Vérification de la cohérence globale',
        'Optimisation des séances clés',
        'Ajout de conseils spécifiques',
        'Préparation de l\'export'
      ]
    }
  ];
  
  // Animation pour avancer automatiquement dans les étapes
  useEffect(() => {
    if (currentStep < generationSteps.length && !loading) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => {
          if (prev < generationSteps.length - 1) {
            return prev + 1;
          }
          setAnalysisComplete(true);
          return prev;
        });
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, generationSteps.length, loading]);
  
  // Afficher les détails après un certain délai
  useEffect(() => {
    if (analysisComplete) {
      const timer = setTimeout(() => {
        setShowDetails(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [analysisComplete]);
  
  // Animation pour les étapes
  const stepVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    },
    exit: { 
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 }
    }
  };
  
  // Animation pour les résumés
  const summaryVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };
  
  const summaryItemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };
  
  // Obtenir l'icône de phase en fonction du nom
  const getPhaseIcon = (phaseName) => {
    if (phaseName.includes('base')) return <DirectionsBike />;
    if (phaseName.includes('spécifique')) return <TrendingUp />;
    if (phaseName.includes('affûtage')) return <Whatshot />;
    return <FitnessCenter />;
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Génération de votre programme personnalisé
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Notre système analyse les caractéristiques du col et vos capacités pour créer un programme d'entraînement entièrement personnalisé.
      </Typography>
      
      {/* Barre de progression */}
      <Box sx={{ mb: 4 }}>
        <LinearProgress 
          variant="determinate" 
          value={Math.min(100, (currentStep / (generationSteps.length - 1)) * 100)}
          sx={{ height: 8, borderRadius: 4 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Analyse
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Structuration
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Finalisation
          </Typography>
        </Box>
      </Box>
      
      {/* Affichage de l'étape actuelle */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: 120,
        mb: 4
      }}>
        <AnimatePresence mode="wait">
          {loading ? (
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={60} />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Initialisation...
              </Typography>
            </Box>
          ) : currentStep < generationSteps.length && !analysisComplete ? (
            <motion.div
              key={currentStep}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={stepVariants}
              style={{ textAlign: 'center', width: '100%' }}
            >
              <Box 
                sx={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  borderRadius: '50%',
                  mb: 2
                }}
              >
                {generationSteps[currentStep].icon}
              </Box>
              <Typography variant="h6" gutterBottom>
                {generationSteps[currentStep].label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {generationSteps[currentStep].description}
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <List dense>
                  {generationSteps[currentStep].detailItems.map((item, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemText 
                        primary={item} 
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          color: 'text.secondary'
                        }}
                        sx={{ textAlign: 'center' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={summaryVariants}
              style={{ width: '100%' }}
            >
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box 
                  sx={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                    borderRadius: '50%',
                    mb: 2
                  }}
                >
                  <DoneOutline />
                </Box>
                <Typography variant="h6" gutterBottom>
                  Programme généré avec succès
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Votre programme personnalisé pour le {selectedCol?.name} est prêt ! 
                  Consultez le résumé ci-dessous et passez à l'étape suivante pour valider.
                </Typography>
              </Box>
              
              {showDetails && (
                <Grid container spacing={3}>
                  {/* Résumé des caractéristiques du programme */}
                  <Grid item xs={12} md={6}>
                    <motion.div variants={summaryItemVariants}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            Structure du programme
                          </Typography>
                          
                          <List dense>
                            <ListItem>
                              <ListItemIcon>
                                <CalendarMonth fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Durée du programme" 
                                secondary={`${Math.min(12, Math.round((new Date(userCapabilities.raceDate) - new Date()) / (1000 * 60 * 60 * 24 * 7)))} semaines`}
                              />
                            </ListItem>
                            
                            <ListItem>
                              <ListItemIcon>
                                <Timer fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Volume hebdomadaire" 
                                secondary={`${userCapabilities.weeklyHours} heures`}
                              />
                            </ListItem>
                            
                            <ListItem>
                              <ListItemIcon>
                                <Whatshot fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="TSS hebdomadaire" 
                                secondary={`${300 + Math.round(userCapabilities.ftp / 3)} points`}
                              />
                            </ListItem>
                            
                            <ListItem>
                              <ListItemIcon>
                                <FitnessCenter fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary="Entraînement en force" 
                                secondary={userCapabilities.strengthTraining ? 'Inclus' : 'Non inclus'}
                              />
                            </ListItem>
                          </List>
                          
                          <Divider sx={{ my: 2 }} />
                          
                          <Typography variant="subtitle1" gutterBottom>
                            Phases du programme
                          </Typography>
                          
                          {['Phase de base', 'Phase spécifique', 'Phase d\'affûtage'].map((phase, index) => (
                            <motion.div
                              key={index}
                              variants={summaryItemVariants}
                              custom={index}
                            >
                              <Paper 
                                elevation={0} 
                                sx={{ 
                                  p: 1.5, 
                                  mb: 1.5, 
                                  bgcolor: alpha(theme.palette.background.default, 0.7),
                                  border: `1px solid ${theme.palette.divider}`
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <Box 
                                    sx={{ 
                                      p: 1, 
                                      borderRadius: '50%', 
                                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                                      color: theme.palette.primary.main
                                    }}
                                  >
                                    {getPhaseIcon(phase)}
                                  </Box>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2">{phase}</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                      <Chip 
                                        label={`${Math.round(Math.min(12, Math.round((new Date(userCapabilities.raceDate) - new Date()) / (1000 * 60 * 60 * 24 * 7))) * [0.4, 0.4, 0.2][index])} semaines`} 
                                        size="small" 
                                        sx={{ height: 24 }}
                                      />
                                      <Chip 
                                        label={index === 0 ? 'Endurance & Force' : index === 1 ? 'Seuil & Spécificité' : 'Affûtage'} 
                                        size="small" 
                                        sx={{ height: 24 }}
                                      />
                                    </Box>
                                  </Box>
                                </Box>
                              </Paper>
                            </motion.div>
                          ))}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                  
                  {/* Résumé des séances clés */}
                  <Grid item xs={12} md={6}>
                    <motion.div variants={summaryItemVariants}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            Séances clés
                          </Typography>
                          
                          {[
                            { 
                              name: 'Sortie longue progressive', 
                              type: 'endurance',
                              description: 'Développement de l\'endurance de base avec intensité progressive',
                              duration: 180,
                              phase: 'Base',
                              intensity: 'Z2-Z3'
                            },
                            { 
                              name: 'Intervals au seuil', 
                              type: 'threshold',
                              description: 'Développement de la puissance au seuil lactique',
                              duration: 90,
                              phase: 'Spécifique',
                              intensity: 'Z4'
                            },
                            { 
                              name: 'Simulation de sections', 
                              type: 'specific',
                              description: `Simulation des sections difficiles du ${selectedCol?.name}`,
                              duration: 120,
                              phase: 'Spécifique',
                              intensity: 'Z3-Z4'
                            },
                            { 
                              name: 'Rappels d\'intensité', 
                              type: 'sharpening',
                              description: 'Sessions courtes mais intenses pour maintenir la forme',
                              duration: 60,
                              phase: 'Affûtage',
                              intensity: 'Z5'
                            }
                          ].map((session, index) => (
                            <motion.div
                              key={index}
                              variants={summaryItemVariants}
                              custom={index}
                            >
                              <Paper 
                                elevation={0} 
                                sx={{ 
                                  p: 2, 
                                  mb: 2, 
                                  bgcolor: alpha(theme.palette.background.default, 0.7),
                                  border: `1px solid ${theme.palette.divider}`
                                }}
                              >
                                <Typography variant="subtitle2" gutterBottom>
                                  {session.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                  {session.description}
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                  <Chip 
                                    label={`${Math.floor(session.duration / 60)}h${session.duration % 60}min`} 
                                    size="small" 
                                    icon={<Timer fontSize="small" />}
                                    sx={{ height: 24 }}
                                  />
                                  <Chip 
                                    label={session.phase} 
                                    size="small" 
                                    icon={<CalendarMonth fontSize="small" />}
                                    sx={{ height: 24 }}
                                  />
                                  <Chip 
                                    label={session.intensity} 
                                    size="small" 
                                    icon={<SpeedIcon fontSize="small" />}
                                    sx={{ 
                                      height: 24,
                                      bgcolor: 
                                        session.intensity.includes('Z1') || session.intensity.includes('Z2') ? alpha(theme.palette.success.main, 0.1) :
                                        session.intensity.includes('Z3') ? alpha(theme.palette.info.main, 0.1) :
                                        session.intensity.includes('Z4') ? alpha(theme.palette.warning.main, 0.1) :
                                        alpha(theme.palette.error.main, 0.1),
                                      color: 
                                        session.intensity.includes('Z1') || session.intensity.includes('Z2') ? theme.palette.success.main :
                                        session.intensity.includes('Z3') ? theme.palette.info.main :
                                        session.intensity.includes('Z4') ? theme.palette.warning.main :
                                        theme.palette.error.main
                                    }}
                                  />
                                </Box>
                              </Paper>
                            </motion.div>
                          ))}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                </Grid>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default TrainingProgramGenerator;
