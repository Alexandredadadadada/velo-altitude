import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Grid, Paper, Divider, Chip, Button, Card, CardContent,
  List, ListItem, ListItemText, ListItemIcon, Breadcrumbs, Link, Container,
  Alert, CircularProgress, IconButton, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Accordion, AccordionSummary, AccordionDetails,
  Tooltip, LinearProgress
} from '@mui/material';
import { 
  DirectionsBike, NavigateNext, ArrowBack, BookmarkBorderOutlined,
  BookmarkOutlined, Print, Share, ExpandMore, WhatshotOutlined,
  TimerOutlined, FitnessCenterOutlined, SpeedOutlined, WarningOutlined,
  CheckCircleOutlined, InfoOutlined, WatchLaterOutlined, TrendingUp,
  TrendingDown, SportsScore, SettingsOutlined
} from '@mui/icons-material';
import trainingWorkouts from '../../data/trainingWorkouts';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Composant affichant les détails d'une séance d'entraînement spécifique
 * avec toutes les instructions, variantes et conseils
 */
const WorkoutDetail = () => {
  const { workoutType, workoutId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [expanded, setExpanded] = useState('mainSection');

  useEffect(() => {
    const loadWorkout = () => {
      try {
        setLoading(true);
        
        // Vérifier si le type et l'id de l'entraînement sont valides
        if (!workoutType || !workoutId || !trainingWorkouts[workoutType]) {
          setError(`Type d'entraînement non trouvé: ${workoutType}`);
          setLoading(false);
          return;
        }
        
        // Trouver l'entraînement spécifique
        const foundWorkout = trainingWorkouts[workoutType].find(w => w.id === workoutId);
        
        if (!foundWorkout) {
          setError(`Entraînement non trouvé: ${workoutId}`);
          setLoading(false);
          return;
        }
        
        setWorkout(foundWorkout);
        
        // Vérifier si cet entraînement est dans les favoris de l'utilisateur
        if (user && user.id) {
          // Cette logique serait normalement gérée par un appel API
          const isFav = localStorage.getItem(`favorite_workout_${user.id}_${workoutId}`) === 'true';
          setIsFavorite(isFav);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement de l\'entraînement:', err);
        setError('Erreur lors du chargement de l\'entraînement');
        setLoading(false);
      }
    };
    
    loadWorkout();
  }, [workoutType, workoutId, user]);

  const handleToggleFavorite = () => {
    if (user && user.id) {
      const newStatus = !isFavorite;
      setIsFavorite(newStatus);
      
      // En production, ceci serait un appel API
      localStorage.setItem(`favorite_workout_${user.id}_${workoutId}`, newStatus.toString());
    } else {
      // Rediriger vers la page de connexion ou afficher un message
      alert('Veuillez vous connecter pour ajouter cet entraînement à vos favoris');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExpandChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  // Affiche une représentation visuelle de l'intensité
  const renderIntensityBar = (intensity) => {
    // Intensité sur une échelle de 1 à 10
    const intensityValue = Math.min(Math.max(parseInt(intensity, 10) || 5, 1), 10) * 10;
    
    let color = 'success.main';
    if (intensityValue > 70) color = 'error.main';
    else if (intensityValue > 50) color = 'warning.main';
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress 
            variant="determinate" 
            value={intensityValue} 
            sx={{ 
              height: 8, 
              borderRadius: 5,
              backgroundColor: 'grey.300',
              '& .MuiLinearProgress-bar': {
                backgroundColor: color
              }
            }}
          />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="text.secondary">{intensityValue/10}/10</Typography>
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !workout) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Alert severity="error">
          {error || 'Entraînement non trouvé'}
        </Alert>
      </Box>
    );
  }

  // Traduire le type d'entraînement en français
  const getWorkoutTypeTranslation = (type) => {
    const translations = {
      power: 'Puissance',
      endurance: 'Endurance',
      recovery: 'Récupération',
      vo2max: 'VO2max',
      threshold: 'Seuil'
    };
    
    return translations[type] || type;
  };

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mb: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link component={RouterLink} to="/" color="inherit">
            Accueil
          </Link>
          <Link component={RouterLink} to="/training" color="inherit">
            Entraînement
          </Link>
          <Link component={RouterLink} to="/training/workouts" color="inherit">
            Séances
          </Link>
          <Link component={RouterLink} to={`/training/workouts/${workoutType}`} color="inherit">
            {getWorkoutTypeTranslation(workoutType)}
          </Link>
          <Typography color="text.primary">{workout.name}</Typography>
        </Breadcrumbs>

        {/* En-tête avec actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button 
            startIcon={<ArrowBack />} 
            variant="outlined" 
            onClick={() => navigate(-1)}
          >
            Retour
          </Button>
          <Box>
            <IconButton onClick={handleToggleFavorite} color={isFavorite ? 'primary' : 'default'}>
              {isFavorite ? <BookmarkOutlined /> : <BookmarkBorderOutlined />}
            </IconButton>
            <IconButton onClick={handlePrint}>
              <Print />
            </IconButton>
            <IconButton>
              <Share />
            </IconButton>
          </Box>
        </Box>

        {/* Titre et description */}
        <Typography variant="h4" component="h1" gutterBottom>
          {workout.name}
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item>
            <Chip 
              label={workout.type}
              color="primary"
              icon={<DirectionsBike />}
            />
          </Grid>
          <Grid item>
            <Chip 
              label={`${workout.duration}`}
              color="secondary"
              icon={<TimerOutlined />}
            />
          </Grid>
          <Grid item>
            <Chip 
              label={workout.focus}
              variant="outlined"
              icon={<FitnessCenterOutlined />}
            />
          </Grid>
          <Grid item>
            <Chip 
              label={workout.targetZone}
              variant="outlined"
              icon={<SpeedOutlined />}
            />
          </Grid>
        </Grid>

        <Typography variant="subtitle1" color="text.secondary" paragraph>
          {workout.focus}
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* Carte d'aperçu */}
        <Card variant="outlined" sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Intensité globale
                </Typography>
                {renderIntensityBar(workout.targetZone.match(/\d+/g) ? workout.targetZone.match(/\d+/g)[0] : 5)}
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Équipement requis
                  </Typography>
                  <List dense>
                    {workout.requiredEquipment.map((equipment, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <SettingsOutlined fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={equipment} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Bénéfices physiologiques
                </Typography>
                <List dense>
                  {workout.physiologicalBenefits.map((benefit, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircleOutlined fontSize="small" color="success" />
                      </ListItemIcon>
                      <ListItemText primary={benefit} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Structure détaillée de l'entraînement */}
        <Typography variant="h5" gutterBottom>
          Structure de l'entraînement
        </Typography>

        <Accordion 
          expanded={expanded === 'mainSection'} 
          onChange={handleExpandChange('mainSection')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography sx={{ width: '33%', flexShrink: 0 }}>
              Structure principale
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
              Détail des phases de l'entraînement
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Phase</TableCell>
                    <TableCell>Durée</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workout.structure.warmup && (
                    <TableRow>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TrendingUp color="warning" sx={{ mr: 1 }} />
                          Échauffement
                        </Box>
                      </TableCell>
                      <TableCell>{workout.structure.warmup.duration}</TableCell>
                      <TableCell>{workout.structure.warmup.description}</TableCell>
                    </TableRow>
                  )}
                  {workout.structure.mainSet && (
                    <TableRow>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <WhatshotOutlined color="error" sx={{ mr: 1 }} />
                          Corps principal
                        </Box>
                      </TableCell>
                      <TableCell>
                        {workout.structure.mainSet.intervals ? (
                          <Typography variant="body2">{workout.structure.mainSet.intervals}</Typography>
                        ) : (
                          <Typography variant="body2">Variable</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {workout.structure.mainSet.recovery && (
                          <Typography variant="body2" paragraph>
                            <strong>Récupération:</strong> {workout.structure.mainSet.recovery}
                          </Typography>
                        )}
                        {workout.structure.mainSet.cues && (
                          <Typography variant="body2">
                            <strong>Consignes:</strong> {workout.structure.mainSet.cues}
                          </Typography>
                        )}
                        {workout.structure.mainSet.pattern && (
                          <Typography variant="body2">
                            <strong>Structure:</strong> {workout.structure.mainSet.pattern}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                  {workout.structure.entireWorkout && (
                    <TableRow>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <DirectionsBike color="primary" sx={{ mr: 1 }} />
                          Séance complète
                        </Box>
                      </TableCell>
                      <TableCell>{workout.duration}</TableCell>
                      <TableCell>
                        {workout.structure.entireWorkout.description}
                        {workout.structure.entireWorkout.pattern && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Structure:</strong> {workout.structure.entireWorkout.pattern}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                  {workout.structure.cooldown && (
                    <TableRow>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TrendingDown color="success" sx={{ mr: 1 }} />
                          Retour au calme
                        </Box>
                      </TableCell>
                      <TableCell>{workout.structure.cooldown.duration}</TableCell>
                      <TableCell>{workout.structure.cooldown.description}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>

        {/* Adaptations selon le niveau */}
        <Accordion 
          expanded={expanded === 'adaptationsSection'} 
          onChange={handleExpandChange('adaptationsSection')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography sx={{ width: '33%', flexShrink: 0 }}>
              Adaptations par niveau
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
              Comment adapter la séance selon votre niveau
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Niveau</TableCell>
                    <TableCell>Adaptation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {workout.adaptations.beginner && (
                    <TableRow>
                      <TableCell>
                        <Chip 
                          label="Débutant" 
                          size="small" 
                          color="success" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{workout.adaptations.beginner}</TableCell>
                    </TableRow>
                  )}
                  {workout.adaptations.intermediate && (
                    <TableRow>
                      <TableCell>
                        <Chip 
                          label="Intermédiaire" 
                          size="small" 
                          color="warning" 
                          variant="outlined" 
                        />
                      </TableCell>
                      <TableCell>{workout.adaptations.intermediate}</TableCell>
                    </TableRow>
                  )}
                  {workout.adaptations.advanced && (
                    <TableRow>
                      <TableCell>
                        <Chip 
                          label="Avancé" 
                          size="small" 
                          color="error" 
                          variant="outlined" 
                        />
                      </TableCell>
                      <TableCell>{workout.adaptations.advanced}</TableCell>
                    </TableRow>
                  )}
                  {workout.adaptations.all && (
                    <TableRow>
                      <TableCell>
                        <Chip 
                          label="Tous niveaux" 
                          size="small" 
                          color="info" 
                          variant="outlined" 
                        />
                      </TableCell>
                      <TableCell>{workout.adaptations.all}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>

        {/* Progression et variantes */}
        {workout.progressionVariants && (
          <Accordion 
            expanded={expanded === 'progressionSection'} 
            onChange={handleExpandChange('progressionSection')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography sx={{ width: '33%', flexShrink: 0 }}>
                Progression et variantes
              </Typography>
              <Typography sx={{ color: 'text.secondary' }}>
                Comment faire évoluer cette séance dans le temps
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {workout.progressionVariants.map((variant, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <TrendingUp />
                    </ListItemIcon>
                    <ListItemText primary={variant} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        )}

        {/* Conseils et recommandations */}
        <Accordion 
          expanded={expanded === 'tipsSection'} 
          onChange={handleExpandChange('tipsSection')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography sx={{ width: '33%', flexShrink: 0 }}>
              Conseils et recommandations
            </Typography>
            <Typography sx={{ color: 'text.secondary' }}>
              Astuces pour optimiser cette séance
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Conseils d'exécution
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2">
                  {workout.tips}
                </Typography>
              </Paper>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Fréquence recommandée
                  </Typography>
                  <Chip 
                    label={workout.recommendedFrequency} 
                    color="primary" 
                    icon={<WatchLaterOutlined />}
                    variant="outlined"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                {workout.recovery && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Récupération nécessaire
                    </Typography>
                    <Chip 
                      label={workout.recovery} 
                      color="secondary" 
                      icon={<SportsScore />}
                      variant="outlined"
                    />
                  </Box>
                )}
              </Grid>
            </Grid>

            {workout.nutritionStrategy && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Stratégie nutritionnelle
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          Avant l'effort
                        </Typography>
                        <Typography variant="body2">
                          {workout.nutritionStrategy.beforeRide}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          Pendant l'effort
                        </Typography>
                        <Typography variant="body2">
                          {workout.nutritionStrategy.duringRide}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          Après l'effort
                        </Typography>
                        <Typography variant="body2">
                          {workout.nutritionStrategy.afterRide}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {workout.complementaryPractices && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Pratiques complémentaires
                </Typography>
                <List>
                  {workout.complementaryPractices.map((practice, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <InfoOutlined color="info" />
                      </ListItemIcon>
                      <ListItemText primary={practice} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Alerte de précaution */}
        <Alert severity="warning" sx={{ mt: 4 }}>
          <Typography variant="subtitle2">
            Consultez un professionnel de santé avant de commencer un nouveau programme d'entraînement,
            particulièrement si vous avez des problèmes de santé ou des blessures préexistantes.
          </Typography>
        </Alert>
      </Paper>
    </Container>
  );
};

export default WorkoutDetail;
