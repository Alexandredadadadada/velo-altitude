import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Slider,
  Divider,
  Chip,
  Alert,
  Paper,
  Tooltip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  DirectionsBike,
  Timer,
  Speed,
  FlashOn,
  HelpOutline,
  Add,
  Save,
  PlayArrow
} from '@mui/icons-material';
import { generateZoneBasedWorkout, calculateTrainingZones } from '../../services/TrainingZoneService';
import AnimatedTransition from '../common/AnimatedTransition';
import TouchFriendlyControl from '../common/TouchFriendlyControl';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * Composant pour générer des séances d'entraînement basées sur les zones de puissance
 */
const ZoneBasedWorkoutGenerator = ({ userProfile, onSaveWorkout, className = '' }) => {
  // État pour les paramètres de la séance
  const [workoutParams, setWorkoutParams] = useState({
    type: 'sweetspot',
    duration: 60,
    name: '',
    description: ''
  });
  
  // État pour la séance générée
  const [generatedWorkout, setGeneratedWorkout] = useState(null);
  const [error, setError] = useState(null);
  
  // Types de séances disponibles
  const workoutTypes = [
    { id: 'sweetspot', name: 'Sweet Spot', description: 'Développement du seuil avec balance optimale entre intensité et récupération', icon: <Speed /> },
    { id: 'threshold', name: 'Seuil', description: 'Travail au seuil anaérobie pour augmenter directement votre FTP', icon: <FlashOn /> },
    { id: 'vo2max', name: 'VO2 Max', description: 'Intervalles à haute intensité pour améliorer votre capacité cardiovasculaire maximale', icon: <FlashOn /> },
    { id: 'endurance', name: 'Endurance', description: 'Travail en endurance pour développer les capacités aérobies de base', icon: <DirectionsBike /> },
    { id: 'anaerobic', name: 'Anaérobie', description: 'Développement de la puissance anaérobie et tolérance à l\'acide lactique', icon: <FlashOn /> }
  ];
  
  // Générer une séance basée sur les paramètres
  const handleGenerateWorkout = () => {
    try {
      if (!userProfile || !userProfile.ftp) {
        setError('Profil utilisateur incomplet. Veuillez définir votre FTP dans votre profil.');
        return;
      }
      
      const workout = generateZoneBasedWorkout(
        userProfile,
        workoutParams.type,
        workoutParams.duration
      );
      
      // Ajouter un nom et une description personnalisés si fournis
      if (workoutParams.name) {
        workout.name = workoutParams.name;
      }
      
      if (workoutParams.description) {
        workout.description = workoutParams.description;
      }
      
      setGeneratedWorkout(workout);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la génération de la séance:', err);
      setError(`Erreur lors de la génération de la séance: ${err.message}`);
    }
  };
  
  // Sauvegarder la séance
  const handleSaveWorkout = () => {
    if (!generatedWorkout) return;
    
    try {
      const savedWorkout = onSaveWorkout({
        ...generatedWorkout,
        type: workoutParams.type,
        workoutDate: new Date().toISOString()
      });
      
      // Réinitialiser le formulaire après sauvegarde
      setWorkoutParams({
        type: 'sweetspot',
        duration: 60,
        name: '',
        description: ''
      });
      setGeneratedWorkout(null);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de la séance:', err);
      setError(`Erreur lors de la sauvegarde: ${err.message}`);
    }
  };
  
  // Gérer les changements de paramètres
  const handleParamChange = (param, value) => {
    setWorkoutParams(prev => ({
      ...prev,
      [param]: value
    }));
  };
  
  // Formater la durée en hh:mm:ss
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hours > 0 ? hours : null,
      minutes.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].filter(Boolean).join(':');
  };
  
  // Déterminer la couleur de zone pour une intensité donnée
  const getZoneColor = (intensity) => {
    if (!userProfile?.ftp) return 'gray';
    
    const zones = calculateTrainingZones(userProfile.ftp);
    
    if (intensity <= 0.55) return zones.z1.color;
    if (intensity <= 0.75) return zones.z2.color;
    if (intensity <= 0.9) return zones.z3.color;
    if (intensity <= 1.05) return zones.z4.color;
    if (intensity <= 1.2) return zones.z5.color;
    if (intensity <= 1.5) return zones.z6.color;
    return zones.z7.color;
  };
  
  // Afficher le type de segment
  const getSegmentType = (type) => {
    switch(type) {
      case 'warmup': return 'Échauffement';
      case 'cooldown': return 'Récupération';
      case 'interval': return 'Intervalle';
      case 'recovery': return 'Récupération';
      case 'steady': return 'Effort constant';
      default: return type;
    }
  };
  
  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/zonebasedworkoutgenerator"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    <Card className={`zone-workout-generator ${className}`} elevation={2}>
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <DirectionsBike sx={{ mr: 1 }} />
          Générateur de séances par zones
          <Tooltip title="Créez des séances d'entraînement personnalisées basées sur vos zones de puissance définies par votre FTP">
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Paramètres de la séance
              </Typography>
              
              {!userProfile?.ftp ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Vous devez d'abord définir votre FTP dans le Calculateur FTP pour créer des séances optimisées.
                </Alert>
              ) : (
                <Box sx={{ mb: 2 }}>
                  <Chip 
                    icon={<Speed />} 
                    label={`FTP: ${userProfile.ftp}W`} 
                    color="primary" 
                    variant="outlined" 
                    size="small"
                  />
                </Box>
              )}
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Type d'entraînement</InputLabel>
                <Select
                  value={workoutParams.type}
                  onChange={(e) => handleParamChange('type', e.target.value)}
                  label="Type d'entraînement"
                >
                  {workoutTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {type.icon}
                        <Box sx={{ ml: 1 }}>
                          <Typography variant="body1">{type.name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                            {type.description}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>
                  Durée de la séance: {workoutParams.duration} minutes
                </Typography>
                <TouchFriendlyControl>
                  <Slider
                    value={workoutParams.duration}
                    onChange={(e, value) => handleParamChange('duration', value)}
                    min={20}
                    max={120}
                    step={5}
                    marks={[
                      { value: 30, label: '30m' },
                      { value: 60, label: '60m' },
                      { value: 90, label: '90m' }
                    ]}
                    valueLabelDisplay="auto"
                  />
                </TouchFriendlyControl>
              </Box>
              
              <TextField
                fullWidth
                label="Nom de la séance (optionnel)"
                value={workoutParams.name}
                onChange={(e) => handleParamChange('name', e.target.value)}
                margin="normal"
                placeholder="Ex: Sweet Spot du Mardi"
              />
              
              <TextField
                fullWidth
                label="Description personnalisée (optionnel)"
                value={workoutParams.description}
                onChange={(e) => handleParamChange('description', e.target.value)}
                margin="normal"
                multiline
                rows={2}
                placeholder="Ajoutez des notes ou instructions personnalisées"
              />
              
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 3 }}
                onClick={handleGenerateWorkout}
                startIcon={<DirectionsBike />}
                disabled={!userProfile?.ftp}
              >
                Générer la séance
              </Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            {generatedWorkout ? (
              <AnimatedTransition type="fade">
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      {generatedWorkout.name}
                    </Typography>
                    
                    <Chip
                      label={`TSS: ${generatedWorkout.tss}`}
                      color="secondary"
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" paragraph>
                    {generatedWorkout.description}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Structure de la séance
                  </Typography>
                  
                  <TableContainer sx={{ maxHeight: 300, mb: 2 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Segment</TableCell>
                          <TableCell>Durée</TableCell>
                          <TableCell>Puissance</TableCell>
                          <TableCell>% FTP</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {generatedWorkout.segments.map((segment, index) => {
                          let intensity = 0;
                          let power = 0;
                          
                          if (segment.type === 'warmup' || segment.type === 'cooldown') {
                            intensity = ((segment.startPower + segment.endPower) / 2) / userProfile.ftp;
                            power = `${segment.startPower}-${segment.endPower}W`;
                          } else {
                            intensity = segment.intensity || segment.power / userProfile.ftp;
                            power = `${segment.power}W`;
                          }
                          
                          const percentFTP = Math.round(intensity * 100);
                          const backgroundColor = getZoneColor(intensity);
                          
                          return (
                            <TableRow key={index} sx={{ 
                              '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                              backgroundColor: `${backgroundColor}22` // 22 = 13% opacity in hex
                            }}>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {getSegmentType(segment.type)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {segment.description}
                                </Typography>
                              </TableCell>
                              <TableCell>{formatDuration(segment.duration)}</TableCell>
                              <TableCell>{power}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={`${percentFTP}%`} 
                                  size="small"
                                  sx={{ 
                                    backgroundColor: backgroundColor,
                                    color: 'white',
                                    fontWeight: 'bold'
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PlayArrow />}
                      onClick={() => {}}
                      disabled
                    >
                      Démarrer
                    </Button>
                    
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<Save />}
                      onClick={handleSaveWorkout}
                    >
                      Enregistrer
                    </Button>
                  </Box>
                </Paper>
              </AnimatedTransition>
            ) : (
              <Paper elevation={1} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <Box sx={{ textAlign: 'center', p: 3 }}>
                  <DirectionsBike sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Générez votre séance
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Configurez les paramètres et cliquez sur "Générer la séance" pour créer un entraînement optimisé basé sur vos zones FTP
                  </Typography>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

ZoneBasedWorkoutGenerator.propTypes = {
  userProfile: PropTypes.shape({
    ftp: PropTypes.number,
    weight: PropTypes.number
  }),
  onSaveWorkout: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default ZoneBasedWorkoutGenerator;
