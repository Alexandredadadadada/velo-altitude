import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  TextField, 
  InputAdornment, 
  Slider,
  Button,
  Divider,
  Card,
  CardContent,
  Tooltip,
  IconButton,
  Alert,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import { 
  DirectionsBike,
  Speed,
  FitnessCenter,
  QuestionMark,
  Info,
  Help,
  Refresh,
  Calculate,
  RestartAlt
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';

// Enregistrer les composants nécessaires pour Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

/**
 * Composant pour l'évaluation de la forme dans le simulateur d'entraînement
 * Permet de renseigner et calculer les paramètres de forme du cycliste
 */
const FitnessAssessmentStep = ({ userProfile, onProfileChange }) => {
  const theme = useTheme();
  
  // États locaux
  const [tempProfile, setTempProfile] = useState({
    ...userProfile,
    weight: userProfile.weight || 70,
    height: userProfile.height || 178,
    age: userProfile.age || 35,
    ftp: userProfile.ftp || 220,
    experience: userProfile.experience || 'intermediate', // beginner, intermediate, advanced, expert
    weeklyHours: userProfile.weeklyHours || 8,
    recentActivities: userProfile.recentActivities || []
  });
  
  const [showFtpCalculator, setShowFtpCalculator] = useState(false);
  const [ftpTestType, setFtpTestType] = useState('20min');
  const [ftpTestValue, setFtpTestValue] = useState('');
  const [calculatedFtp, setCalculatedFtp] = useState(null);
  
  // États pour les cartes d'info
  const [showWeightInfo, setShowWeightInfo] = useState(false);
  const [showFtpInfo, setShowFtpInfo] = useState(false);
  
  // Mettre à jour le profil parent
  const handleSaveProfile = () => {
    onProfileChange(tempProfile);
  };
  
  // Mettre à jour un champ du profil local
  const handleProfileChange = (field, value) => {
    setTempProfile({
      ...tempProfile,
      [field]: value
    });
  };
  
  // Calculer la FTP à partir d'un test
  const calculateFtp = () => {
    if (!ftpTestValue || isNaN(parseFloat(ftpTestValue))) return;
    
    const testValueNum = parseFloat(ftpTestValue);
    let calculatedValue = 0;
    
    switch(ftpTestType) {
      case '20min':
        calculatedValue = Math.round(testValueNum * 0.95);
        break;
      case '60min':
        calculatedValue = Math.round(testValueNum);
        break;
      case '5min':
        calculatedValue = Math.round(testValueNum * 0.79);
        break;
      case 'ramp':
        calculatedValue = Math.round(testValueNum * 0.75);
        break;
      default:
        calculatedValue = testValueNum;
    }
    
    setCalculatedFtp(calculatedValue);
  };
  
  // Appliquer la FTP calculée au profil
  const applyCalculatedFtp = () => {
    if (calculatedFtp) {
      handleProfileChange('ftp', calculatedFtp);
      setShowFtpCalculator(false);
      setCalculatedFtp(null);
      setFtpTestValue('');
    }
  };
  
  // Calculer le rapport poids/puissance (W/kg)
  const calculatePowerToWeight = () => {
    const ftp = tempProfile.ftp || 0;
    const weight = tempProfile.weight || 1; // éviter division par zéro
    return (ftp / weight).toFixed(2);
  };
  
  // Déterminer la catégorie de puissance
  const getPowerCategory = () => {
    const powerToWeight = parseFloat(calculatePowerToWeight());
    
    if (powerToWeight < 2) return { category: 'Débutant', color: theme.palette.info.main };
    if (powerToWeight < 3) return { category: 'Intermédiaire', color: theme.palette.success.main };
    if (powerToWeight < 4) return { category: 'Avancé', color: theme.palette.warning.main };
    return { category: 'Elite', color: theme.palette.error.main };
  };
  
  // Données pour le graphique de zones de puissance
  const powerZonesData = {
    labels: ['Z1 (Récup)', 'Z2 (Endurance)', 'Z3 (Tempo)', 'Z4 (Seuil)', 'Z5 (VO2max)', 'Z6 (Anaérobie)', 'Z7 (Neuromuscul.)'],
    datasets: [
      {
        label: 'Puissance (watts)',
        data: tempProfile.ftp ? [
          Math.round(tempProfile.ftp * 0.55),
          Math.round(tempProfile.ftp * 0.75),
          Math.round(tempProfile.ftp * 0.85),
          Math.round(tempProfile.ftp * 1),
          Math.round(tempProfile.ftp * 1.16),
          Math.round(tempProfile.ftp * 1.5),
          Math.round(tempProfile.ftp * 2)
        ] : [100, 150, 190, 220, 255, 300, 400],
        backgroundColor: [
          alpha(theme.palette.info.main, 0.5),
          alpha(theme.palette.success.light, 0.5),
          alpha(theme.palette.success.main, 0.5),
          alpha(theme.palette.warning.light, 0.5),
          alpha(theme.palette.warning.main, 0.5),
          alpha(theme.palette.error.light, 0.5),
          alpha(theme.palette.error.main, 0.5)
        ],
        borderColor: theme.palette.primary.main,
        borderWidth: 1
      }
    ]
  };
  
  // Options pour le graphique de zones de puissance
  const powerZonesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Puissance (watts)'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.parsed.y} watts`;
          }
        }
      }
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Évaluation de votre forme actuelle
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Entrez vos données actuelles pour que nous puissions vous créer un programme d'entraînement personnalisé pour les cols sélectionnés.
      </Typography>
      
      <Grid container spacing={3}>
        {/* Informations de base */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              borderRadius: 2,
              height: '100%',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Informations personnelles
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Poids (kg)"
                  type="number"
                  value={tempProfile.weight}
                  onChange={(e) => handleProfileChange('weight', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          size="small"
                          onClick={() => setShowWeightInfo(!showWeightInfo)}
                        >
                          <Help fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  size="small"
                />
                
                {showWeightInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Alert severity="info" sx={{ mt: 1, fontSize: '0.75rem' }}>
                      Votre poids actuel est utilisé pour calculer votre rapport poids/puissance, un indicateur crucial pour la performance en montée.
                    </Alert>
                  </motion.div>
                )}
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Taille (cm)"
                  type="number"
                  value={tempProfile.height}
                  onChange={(e) => handleProfileChange('height', parseFloat(e.target.value) || 0)}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Âge"
                  type="number"
                  value={tempProfile.age}
                  onChange={(e) => handleProfileChange('age', parseFloat(e.target.value) || 0)}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Heures d'entraînement / semaine"
                  type="number"
                  value={tempProfile.weeklyHours}
                  onChange={(e) => handleProfileChange('weeklyHours', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">h</InputAdornment>
                  }}
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  Niveau d'expérience
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  {['beginner', 'intermediate', 'advanced', 'expert'].map((level) => (
                    <Button
                      key={level}
                      variant={tempProfile.experience === level ? "contained" : "outlined"}
                      color={tempProfile.experience === level ? "primary" : "inherit"}
                      size="small"
                      onClick={() => handleProfileChange('experience', level)}
                      sx={{ textTransform: 'none', flex: 1 }}
                    >
                      {level === 'beginner' && 'Débutant'}
                      {level === 'intermediate' && 'Intermédiaire'}
                      {level === 'advanced' && 'Avancé'}
                      {level === 'expert' && 'Expert'}
                    </Button>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Seuil Fonctionnel de Puissance (FTP) */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              borderRadius: 2,
              height: '100%',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Seuil Fonctionnel de Puissance (FTP)
              </Typography>
              
              <IconButton 
                size="small"
                onClick={() => setShowFtpInfo(!showFtpInfo)}
              >
                <Help fontSize="small" />
              </IconButton>
            </Box>
            
            {showFtpInfo && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Alert severity="info" sx={{ mb: 2, fontSize: '0.75rem' }}>
                  La FTP est la puissance maximale que vous pouvez maintenir pendant environ une heure. C'est la référence pour calculer vos zones d'entraînement.
                </Alert>
              </motion.div>
            )}
            
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <TextField
                    fullWidth
                    label="Votre FTP (watts)"
                    type="number"
                    value={tempProfile.ftp}
                    onChange={(e) => handleProfileChange('ftp', parseFloat(e.target.value) || 0)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">W</InputAdornment>
                    }}
                    size="small"
                  />
                </Grid>
                
                <Grid item>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Calculate />}
                    onClick={() => setShowFtpCalculator(!showFtpCalculator)}
                  >
                    Calculer
                  </Button>
                </Grid>
              </Grid>
            </Box>
            
            {showFtpCalculator && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    mb: 2, 
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                    border: `1px dashed ${theme.palette.divider}`
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Calculateur de FTP
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        {[
                          { id: '20min', label: 'Test 20 min' },
                          { id: '60min', label: 'Test 60 min' },
                          { id: '5min', label: 'Test 5 min' },
                          { id: 'ramp', label: 'Test Ramp' }
                        ].map((test) => (
                          <Button
                            key={test.id}
                            variant={ftpTestType === test.id ? "contained" : "outlined"}
                            color={ftpTestType === test.id ? "primary" : "inherit"}
                            size="small"
                            onClick={() => setFtpTestType(test.id)}
                            sx={{ textTransform: 'none', fontSize: '0.7rem', minWidth: 0 }}
                          >
                            {test.label}
                          </Button>
                        ))}
                      </Stack>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label={`Puissance moyenne (${ftpTestType === 'ramp' ? 'dernier palier' : 'watts'})`}
                        type="number"
                        value={ftpTestValue}
                        onChange={(e) => setFtpTestValue(e.target.value)}
                        size="small"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          variant="contained" 
                          size="small"
                          onClick={calculateFtp}
                          disabled={!ftpTestValue}
                        >
                          Calculer
                        </Button>
                        
                        <Button 
                          variant="outlined" 
                          size="small"
                          startIcon={<RestartAlt />}
                          onClick={() => {
                            setFtpTestValue('');
                            setCalculatedFtp(null);
                          }}
                        >
                          Réinitialiser
                        </Button>
                      </Box>
                    </Grid>
                    
                    {calculatedFtp && (
                      <Grid item xs={12}>
                        <Alert severity="success" sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            FTP estimée : <strong>{calculatedFtp} watts</strong>
                          </Typography>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color="success"
                            sx={{ mt: 1 }}
                            onClick={applyCalculatedFtp}
                          >
                            Appliquer cette valeur
                          </Button>
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </motion.div>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Rapport Poids/Puissance
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4" component="span" color={getPowerCategory().color} fontWeight="bold">
                {calculatePowerToWeight()}
              </Typography>
              <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                W/kg
              </Typography>
              <Chip 
                label={getPowerCategory().category} 
                size="small" 
                sx={{ ml: 2, bgcolor: alpha(getPowerCategory().color, 0.1), color: getPowerCategory().color }}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Ce ratio est particulièrement important pour la performance en montée. Plus il est élevé, plus vous serez rapide dans les cols.
            </Typography>
          </Paper>
        </Grid>
        
        {/* Zones d'entraînement */}
        <Grid item xs={12}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Vos zones d'entraînement basées sur votre FTP ({tempProfile.ftp} watts)
            </Typography>
            
            <Box sx={{ height: 250, mb: 2 }}>
              <Line options={powerZonesOptions} data={powerZonesData} />
            </Box>
            
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Zone 1-2 : Endurance
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(tempProfile.ftp * 0.55)} - {Math.round(tempProfile.ftp * 0.75)} watts
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Zone 3-4 : Tempo/Seuil
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(tempProfile.ftp * 0.76)} - {Math.round(tempProfile.ftp * 1)} watts
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Zone 5 : VO2max
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(tempProfile.ftp * 1.01)} - {Math.round(tempProfile.ftp * 1.2)} watts
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined" sx={{ bgcolor: alpha(theme.palette.error.main, 0.1) }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Zone 6-7 : Anaérobie
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(tempProfile.ftp * 1.21)} - {Math.round(tempProfile.ftp * 2.5)} watts
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Actions */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleSaveProfile}
              disabled={!tempProfile.ftp || !tempProfile.weight}
            >
              Enregistrer mon profil
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FitnessAssessmentStep;
