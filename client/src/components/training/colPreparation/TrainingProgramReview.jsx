import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Chip,
  Divider,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  useTheme,
  alpha,
  Tooltip,
  Stack
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon, 
  CalendarMonth, 
  DirectionsBike, 
  Description,
  Download,
  Share,
  Print,
  Edit,
  Save,
  Favorite,
  AddTask,
  Event,
  Terrain,
  Timer,
  Speed,
  FitnessCenter
} from '@mui/icons-material';
import { motion } from 'framer-motion';

/**
 * Composant de résumé et validation du programme d'entraînement
 * Permet de consulter le programme généré et de le sauvegarder
 */
const TrainingProgramReview = ({ program, onSave, loading }) => {
  const theme = useTheme();
  const [activeAccordion, setActiveAccordion] = useState('overview');
  
  // Gérer le changement d'accordéon
  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setActiveAccordion(isExpanded ? panel : '');
  };
  
  if (!program) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Chargement du programme...
        </Typography>
      </Box>
    );
  }
  
  // Animation pour l'entrée du conteneur
  const containerAnimation = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };
  
  const itemAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };
  
  // Formater une durée en minutes en format lisible
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? mins + 'min' : ''}` : `${mins}min`;
  };
  
  // Déterminer la couleur en fonction de la zone d'intensité
  const getZoneColor = (zone) => {
    if (zone.includes('Z1')) return theme.palette.success.light;
    if (zone.includes('Z2')) return theme.palette.success.main;
    if (zone.includes('Z3')) return theme.palette.info.main;
    if (zone.includes('Z4')) return theme.palette.warning.main;
    if (zone.includes('Z5')) return theme.palette.error.main;
    return theme.palette.primary.main;
  };
  
  // Obtenir l'icône en fonction du type d'entraînement
  const getWorkoutIcon = (type) => {
    switch (type) {
      case 'endurance': return <DirectionsBike />;
      case 'threshold': return <Speed />;
      case 'strength': return <FitnessCenter />;
      case 'recovery': return <Timer />;
      case 'specific': return <Terrain />;
      case 'sharpening': return <Favorite />;
      default: return <DirectionsBike />;
    }
  };
  
  // Calculer les statistiques du programme
  const programStats = {
    totalHours: program.phases.reduce((total, phase) => {
      const weeklyHours = program.weeklyHours || 0;
      return total + (phase.durationWeeks * weeklyHours);
    }, 0),
    totalTSS: program.phases.reduce((total, phase) => {
      const weeklyTSS = phase.weeklyTSS || 0;
      return total + (phase.durationWeeks * weeklyTSS);
    }, 0),
    workoutsCount: program.phases.reduce((total, phase) => {
      // Estimation du nombre de séances par semaine (3-5 selon les heures)
      const weeklyWorkouts = Math.min(5, Math.max(3, Math.round(program.weeklyHours / 2)));
      return total + (phase.durationWeeks * weeklyWorkouts);
    }, 0),
    keyWorkoutsCount: program.phases.reduce((total, phase) => {
      return total + (phase.keyWorkouts?.length || 0);
    }, 0)
  };
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerAnimation}
    >
      <Box>
        <motion.div variants={itemAnimation}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Révision du programme
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Voici votre programme d'entraînement personnalisé pour l'ascension du {program.colName}.
              Vérifiez les détails et sauvegardez-le pour commencer votre préparation.
            </Typography>
          </Box>
        </motion.div>
        
        {/* En-tête du programme */}
        <motion.div variants={itemAnimation}>
          <Card 
            sx={{ 
              mb: 4,
              borderLeft: `4px solid ${theme.palette.primary.main}`,
              bgcolor: alpha(theme.palette.primary.main, 0.05)
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h5" component="div" gutterBottom>
                    {program.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {program.description}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip
                      icon={<CalendarMonth />}
                      label={`${program.durationWeeks} semaines`}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      icon={<Event />}
                      label={`Date cible: ${new Date(program.targetDate).toLocaleDateString()}`}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      icon={<Terrain />}
                      label={`${program.colName} (${program.colCharacteristics.elevation}m)`}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Tooltip title="Télécharger en PDF">
                    <IconButton>
                      <Download />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Partager">
                    <IconButton>
                      <Share />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Imprimer">
                    <IconButton>
                      <Print />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Statistiques du programme */}
        <motion.div variants={itemAnimation}>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {[
              { icon: <Timer />, label: 'Heures totales', value: programStats.totalHours, unit: 'h' },
              { icon: <Speed />, label: 'TSS total', value: programStats.totalTSS, unit: 'points' },
              { icon: <DirectionsBike />, label: 'Séances prévues', value: programStats.workoutsCount, unit: '' },
              { icon: <FitnessCenter />, label: 'Séances clés', value: programStats.keyWorkoutsCount, unit: '' }
            ].map((stat, index) => (
              <Grid item xs={6} sm={3} key={index}>
                <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                  <Box sx={{ color: theme.palette.primary.main, mb: 1 }}>
                    {stat.icon}
                  </Box>
                  <Typography variant="h6" component="div">
                    {stat.value}{stat.unit}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </motion.div>
        
        {/* Accordéons avec les détails */}
        <motion.div variants={itemAnimation}>
          <Box sx={{ mb: 4 }}>
            <Accordion 
              expanded={activeAccordion === 'overview'} 
              onChange={handleAccordionChange('overview')}
              disableGutters
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Aperçu du programme</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Caractéristiques du col
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                            Distance
                          </TableCell>
                          <TableCell>{program.colCharacteristics.totalDistance} km</TableCell>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                            Dénivelé
                          </TableCell>
                          <TableCell>{program.colCharacteristics.totalElevation} m</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                            Pente moyenne
                          </TableCell>
                          <TableCell>{program.colCharacteristics.avgGradient}%</TableCell>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                            Pente maximale
                          </TableCell>
                          <TableCell>{program.colCharacteristics.maxGradient}%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                            Difficulté
                          </TableCell>
                          <TableCell>
                            {program.colCharacteristics.difficulty === 'easy' ? 'Facile' :
                             program.colCharacteristics.difficulty === 'medium' ? 'Modéré' :
                             program.colCharacteristics.difficulty === 'hard' ? 'Difficile' : 'Extrême'}
                          </TableCell>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'medium' }}>
                            Temps estimé
                          </TableCell>
                          <TableCell>{formatDuration(program.colCharacteristics.estimatedTime)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Exigences physiques
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    {Object.entries(program.requiredCapabilities).map(([key, value]) => (
                      <Chip 
                        key={key}
                        label={`${key}: ${value}`}
                        size="small"
                        color={value === 'high' ? 'warning' : value === 'medium' ? 'info' : 'success'}
                      />
                    ))}
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Planning hebdomadaire
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Jour</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Durée</TableCell>
                          <TableCell>Intensité</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(program.weeklySchedule).map(([day, workout]) => (
                          <TableRow key={day}>
                            <TableCell component="th" scope="row">
                              {day}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {getWorkoutIcon(workout.type)}
                                <Typography variant="body2">
                                  {workout.name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              {workout.duration > 0 ? formatDuration(workout.duration) : '-'}
                            </TableCell>
                            <TableCell>
                              {workout.type !== 'rest' && (
                                <Chip 
                                  label={
                                    workout.type === 'endurance' ? 'Z2-Z3' :
                                    workout.type === 'threshold' ? 'Z4' :
                                    workout.type === 'strength' ? 'Z3 (force)' :
                                    workout.type === 'recovery' ? 'Z1-Z2' : 'Z3-Z4'
                                  }
                                  size="small"
                                  sx={{ 
                                    height: 20,
                                    bgcolor: alpha(
                                      workout.type === 'endurance' ? theme.palette.success.main :
                                      workout.type === 'threshold' ? theme.palette.warning.main :
                                      workout.type === 'strength' ? theme.palette.info.main :
                                      workout.type === 'recovery' ? theme.palette.success.light :
                                      theme.palette.error.main,
                                      0.1
                                    ),
                                    color: 
                                      workout.type === 'endurance' ? theme.palette.success.main :
                                      workout.type === 'threshold' ? theme.palette.warning.main :
                                      workout.type === 'strength' ? theme.palette.info.main :
                                      workout.type === 'recovery' ? theme.palette.success.light :
                                      theme.palette.error.main
                                  }}
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </AccordionDetails>
            </Accordion>
            
            <Accordion 
              expanded={activeAccordion === 'phases'} 
              onChange={handleAccordionChange('phases')}
              disableGutters
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Phases du programme</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={3}>
                  {program.phases.map((phase, phaseIndex) => (
                    <Paper 
                      key={phaseIndex} 
                      variant="outlined" 
                      sx={{ p: 2 }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                        <Box>
                          <Typography variant="subtitle1" gutterBottom>
                            {phase.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {phase.description}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            <Chip
                              label={`${phase.durationWeeks} semaines`}
                              size="small"
                              icon={<CalendarMonth fontSize="small" />}
                            />
                            <Chip
                              label={`${phase.weeklyTSS} TSS/semaine`}
                              size="small"
                              icon={<Speed fontSize="small" />}
                            />
                            {phase.focus.map((focus, focusIndex) => (
                              <Chip
                                key={focusIndex}
                                label={focus}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Box>
                        
                        <Box 
                          sx={{ 
                            p: 1.5, 
                            borderRadius: '50%', 
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main
                          }}
                        >
                          {phaseIndex === 0 ? <DirectionsBike /> : 
                           phaseIndex === 1 ? <Speed /> : 
                           <Timer />}
                        </Box>
                      </Box>
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Séances clés
                      </Typography>
                      
                      <Grid container spacing={2}>
                        {phase.keyWorkouts.map((workout, workoutIndex) => (
                          <Grid item xs={12} sm={6} key={workoutIndex}>
                            <Card variant="outlined">
                              <CardContent sx={{ pb: 1 }}>
                                <Typography variant="subtitle2">
                                  {workout.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {workout.description}
                                </Typography>
                                
                                <Divider sx={{ my: 1 }} />
                                
                                <Box sx={{ mb: 1 }}>
                                  <Grid container spacing={1}>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" color="text.secondary">
                                        Durée
                                      </Typography>
                                      <Typography variant="body2">
                                        {formatDuration(workout.duration)}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" color="text.secondary">
                                        TSS
                                      </Typography>
                                      <Typography variant="body2">
                                        {workout.tss} points
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                </Box>
                                
                                <Typography variant="caption" color="text.secondary">
                                  Structure
                                </Typography>
                                
                                {workout.intervals.map((interval, intervalIndex) => (
                                  <Box 
                                    key={intervalIndex}
                                    sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: 1,
                                      py: 0.5,
                                      borderBottom: intervalIndex < workout.intervals.length - 1 ? `1px dashed ${theme.palette.divider}` : 'none'
                                    }}
                                  >
                                    <Box 
                                      sx={{ 
                                        width: 12, 
                                        height: 12, 
                                        borderRadius: '50%', 
                                        bgcolor: getZoneColor(interval.zone),
                                        flexShrink: 0
                                      }} 
                                    />
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="body2">
                                        {interval.name}
                                      </Typography>
                                      {interval.details && (
                                        <Typography variant="caption" color="text.secondary">
                                          {interval.details}
                                        </Typography>
                                      )}
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Typography variant="body2" fontWeight="medium">
                                        {formatDuration(interval.duration)}
                                      </Typography>
                                      <Chip 
                                        label={interval.zone} 
                                        size="small"
                                        sx={{ 
                                          height: 20,
                                          fontSize: '0.7rem',
                                          bgcolor: alpha(getZoneColor(interval.zone), 0.1),
                                          color: getZoneColor(interval.zone)
                                        }}
                                      />
                                    </Box>
                                  </Box>
                                ))}
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Paper>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
            
            <Accordion 
              expanded={activeAccordion === 'actions'} 
              onChange={handleAccordionChange('actions')}
              disableGutters
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Actions et prochaines étapes</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="body2" paragraph>
                    Votre programme est prêt à être utilisé. Voici quelques actions possibles :
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <AddTask color="primary" />
                            <Typography variant="subtitle2">
                              Ajouter au calendrier
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            Intégrez le programme à votre calendrier d'entraînement pour suivre votre progression.
                          </Typography>
                          <Button 
                            variant="outlined" 
                            color="primary" 
                            startIcon={<CalendarMonth />}
                            fullWidth
                          >
                            Ajouter
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={4}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Edit color="primary" />
                            <Typography variant="subtitle2">
                              Personnaliser
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            Adaptez le programme à vos besoins spécifiques ou à vos contraintes d'emploi du temps.
                          </Typography>
                          <Button 
                            variant="outlined" 
                            color="primary" 
                            startIcon={<Edit />}
                            fullWidth
                          >
                            Modifier
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={4}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Share color="primary" />
                            <Typography variant="subtitle2">
                              Partager
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            Partagez votre programme avec vos amis ou votre coach pour obtenir des retours.
                          </Typography>
                          <Button 
                            variant="outlined" 
                            color="primary" 
                            startIcon={<Share />}
                            fullWidth
                          >
                            Partager
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        </motion.div>
        
        {/* Boutons d'action */}
        <motion.div variants={itemAnimation}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<Save />}
              size="large"
              onClick={onSave}
              disabled={loading}
            >
              {loading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer le programme'
              )}
            </Button>
            
            <Button 
              variant="outlined" 
              startIcon={<Description />}
              size="large"
            >
              Exporter en PDF
            </Button>
          </Box>
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default TrainingProgramReview;
