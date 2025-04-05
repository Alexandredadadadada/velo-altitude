import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Box,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Slider,
  Divider,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  List
} from '@mui/material';
import {
  DirectionsBike,
  Speed,
  ShowChart,
  Timeline,
  TrendingUp,
  Science,
  Info,
  AccessTime,
  FitnessCenter,
  SportsMartialArts,
  MonitorWeight
} from '@mui/icons-material';
import AnimatedTransition from '../common/AnimatedTransition';
import TouchFriendlyControl from '../common/TouchFriendlyControl';

/**
 * FTPCalculator Component
 * Implements 6 different methods to calculate a cyclist's Functional Threshold Power
 * and displays training zones based on the calculated FTP
 */
const FTPCalculator = ({ 
  userProfile, 
  onSaveFTP = null,
  className = '' 
}) => {
  // State for selected method
  const [selectedMethod, setSelectedMethod] = useState(0);
  
  // Input state for all methods
  const [inputValues, setInputValues] = useState({
    '20min': { power: '' },
    '60min': { power: '' },
    'ramp': { finalPower: '', weight: userProfile?.weight || '' },
    '8min': { power: '' },
    '5min': { power: '' },
    'lactate': { power: '', lactate: '' }
  });
  
  // State for calculation results
  const [result, setResult] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState(null);
  
  // Update weight from user profile if available
  useEffect(() => {
    if (userProfile?.weight) {
      setInputValues(prev => ({
        ...prev,
        'ramp': {
          ...prev.ramp,
          weight: userProfile.weight
        }
      }));
    }
  }, [userProfile]);
  
  // Methods configuration
  const methods = [
    { 
      id: '20min', 
      name: 'Test 20 minutes',
      description: 'Après un bon échauffement, réalisez un effort maximal de 20 minutes. Votre FTP est estimé à 95% de la puissance moyenne maintenue pendant ce test.',
      factor: 0.95,
      icon: <AccessTime />,
      fields: [
        { 
          name: 'power', 
          label: 'Puissance moyenne sur 20 minutes (watts)',
          type: 'number',
          required: true,
          min: 100,
          max: 500,
          icon: <Speed />
        }
      ]
    },
    { 
      id: '60min', 
      name: 'Test 60 minutes',
      description: 'Ce test est le plus précis mais aussi le plus exigeant. Votre FTP est directement égale à la puissance moyenne maintenue pendant un effort maximal de 60 minutes.',
      factor: 1.0,
      icon: <AccessTime />,
      fields: [
        { 
          name: 'power', 
          label: 'Puissance moyenne sur 60 minutes (watts)',
          type: 'number',
          required: true,
          min: 100,
          max: 500,
          icon: <Speed />
        }
      ]
    },
    { 
      id: 'ramp', 
      name: 'Test Ramp',
      description: 'Un test progressif où la puissance augmente régulièrement jusqu\'à épuisement. Votre FTP est estimée à 75% de la puissance maximale atteinte.',
      factor: 0.75,
      icon: <TrendingUp />,
      fields: [
        { 
          name: 'finalPower', 
          label: 'Puissance finale atteinte (watts)',
          type: 'number',
          required: true,
          min: 100,
          max: 600,
          icon: <Speed />
        },
        { 
          name: 'weight', 
          label: 'Poids (kg)',
          type: 'number',
          required: true,
          min: 40,
          max: 120,
          icon: <MonitorWeight />
        }
      ]
    },
    { 
      id: '8min', 
      name: 'Test 8 minutes',
      description: 'Réalisez un effort maximal de 8 minutes après un bon échauffement. Votre FTP est estimée à 90% de la puissance moyenne maintenue.',
      factor: 0.9,
      icon: <AccessTime />,
      fields: [
        { 
          name: 'power', 
          label: 'Puissance moyenne sur 8 minutes (watts)',
          type: 'number',
          required: true,
          min: 100,
          max: 600,
          icon: <Speed />
        }
      ]
    },
    { 
      id: '5min', 
      name: 'Test 5 minutes',
      description: 'Un test court mais intense. Réalisez un effort maximal de 5 minutes après échauffement. Votre FTP est estimée à 85% de la puissance moyenne.',
      factor: 0.85,
      icon: <AccessTime />,
      fields: [
        { 
          name: 'power', 
          label: 'Puissance moyenne sur 5 minutes (watts)',
          type: 'number',
          required: true,
          min: 100,
          max: 700,
          icon: <Speed />
        }
      ]
    },
    { 
      id: 'lactate', 
      name: 'Seuil Lactate',
      description: 'Basée sur des tests en laboratoire qui mesurent directement le taux de lactate dans le sang. Si vous connaissez votre seuil lactate, entrez la puissance correspondante.',
      factor: 1.0,
      icon: <Science />,
      fields: [
        { 
          name: 'power', 
          label: 'Puissance au seuil lactate (watts)',
          type: 'number',
          required: true,
          min: 100,
          max: 500,
          icon: <Speed />
        },
        { 
          name: 'lactate', 
          label: 'Taux de lactate (mmol/L)',
          type: 'number',
          required: false,
          min: 2,
          max: 8,
          icon: <Science />
        }
      ]
    }
  ];
  
  // Handle tab change
  const handleMethodChange = (event, newValue) => {
    setSelectedMethod(newValue);
    setError(null);
  };
  
  // Handle input change
  const handleInputChange = (methodId, field, value) => {
    setInputValues(prev => ({
      ...prev,
      [methodId]: {
        ...prev[methodId],
        [field]: value
      }
    }));
  };
  
  // Handle form submission
  const handleCalculate = () => {
    const methodId = methods[selectedMethod].id;
    const methodData = methods[selectedMethod];
    const inputs = inputValues[methodId];
    
    // Validate inputs
    let isValid = true;
    let validationError = null;
    
    methodData.fields.forEach(field => {
      if (field.required && (!inputs[field.name] || inputs[field.name] === '')) {
        isValid = false;
        validationError = `Le champ ${field.label} est requis`;
      }
      
      const value = Number(inputs[field.name]);
      if (inputs[field.name] && (isNaN(value) || value < field.min || value > field.max)) {
        isValid = false;
        validationError = `${field.label} doit être entre ${field.min} et ${field.max}`;
      }
    });
    
    if (!isValid) {
      setError(validationError);
      return;
    }
    
    // Simulate calculation delay
    setCalculating(true);
    setError(null);
    
    setTimeout(() => {
      try {
        // Calculate FTP based on method
        let ftp = 0;
        let powerToWeight = 0;
        
        switch (methodId) {
          case '20min':
            ftp = Math.round(Number(inputs.power) * methodData.factor);
            break;
          case '60min':
            ftp = Math.round(Number(inputs.power) * methodData.factor);
            break;
          case 'ramp':
            ftp = Math.round(Number(inputs.finalPower) * methodData.factor);
            powerToWeight = Number(inputs.weight) > 0 ? 
              (ftp / Number(inputs.weight)).toFixed(2) : 0;
            break;
          case '8min':
            ftp = Math.round(Number(inputs.power) * methodData.factor);
            break;
          case '5min':
            ftp = Math.round(Number(inputs.power) * methodData.factor);
            break;
          case 'lactate':
            ftp = Math.round(Number(inputs.power) * methodData.factor);
            break;
          default:
            ftp = 0;
        }
        
        // Calculate power to weight if not already calculated
        if (!powerToWeight && userProfile?.weight && userProfile.weight > 0) {
          powerToWeight = (ftp / userProfile.weight).toFixed(2);
        }
        
        // Calculate training zones
        const zones = calculateTrainingZones(ftp);
        
        // Set result
        setResult({
          ftp,
          powerToWeight,
          method: methodData.name,
          zones,
          testDate: new Date()
        });
        
        // Save if callback provided
        if (onSaveFTP) {
          onSaveFTP({
            ftp,
            powerToWeight,
            method: methodData.name,
            zones,
            testDate: new Date()
          });
        }
      } catch (err) {
        console.error('Error calculating FTP:', err);
        setError('Une erreur est survenue lors du calcul du FTP');
      } finally {
        setCalculating(false);
      }
    }, 800);
  };
  
  // Calculate training zones based on FTP
  const calculateTrainingZones = (ftp) => {
    return {
      z1: { min: 0, max: Math.round(ftp * 0.55), name: 'Récupération active', description: 'Très facile, récupération' },
      z2: { min: Math.round(ftp * 0.56), max: Math.round(ftp * 0.75), name: 'Endurance', description: 'Longues sorties, rythme modéré' },
      z3: { min: Math.round(ftp * 0.76), max: Math.round(ftp * 0.9), name: 'Tempo', description: 'Effort soutenu mais contrôlé' },
      z4: { min: Math.round(ftp * 0.91), max: Math.round(ftp * 1.05), name: 'Seuil', description: 'Proche de la limite, développe le seuil' },
      z5: { min: Math.round(ftp * 1.06), max: Math.round(ftp * 1.2), name: 'VO2 Max', description: 'Intervalles intensifs, développe VO2max' },
      z6: { min: Math.round(ftp * 1.21), max: Math.round(ftp * 1.5), name: 'Anaérobie', description: 'Efforts courts et très intenses' },
      z7: { min: Math.round(ftp * 1.51), max: Infinity, name: 'Neuromuscular', description: 'Sprints et efforts maximaux' }
    };
  };
  
  // Render input fields for the selected method
  const renderInputFields = () => {
    const methodId = methods[selectedMethod].id;
    const methodFields = methods[selectedMethod].fields;
    
    return (
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {methodFields.map((field) => (
          <Grid item xs={12} sm={6} key={field.name}>
            <TextField
              label={field.label}
              type={field.type}
              value={inputValues[methodId][field.name]}
              onChange={(e) => handleInputChange(methodId, field.name, e.target.value)}
              fullWidth
              required={field.required}
              InputProps={{
                startAdornment: field.icon,
                inputProps: { min: field.min, max: field.max }
              }}
              error={error && !inputValues[methodId][field.name]}
              helperText={error && !inputValues[methodId][field.name] ? 'Ce champ est requis' : ''}
            />
          </Grid>
        ))}
        
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCalculate}
            disabled={calculating}
            startIcon={calculating ? <CircularProgress size={20} /> : <Speed />}
            fullWidth
          >
            {calculating ? 'Calcul en cours...' : 'Calculer mon FTP'}
          </Button>
        </Grid>
        
        {error && (
          <Grid item xs={12}>
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          </Grid>
        )}
      </Grid>
    );
  };
  
  // Render results section
  const renderResults = () => {
    if (!result) return null;
    
    return (
      <AnimatedTransition type="fade-up">
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ mb: 3 }} />
          
          <Typography variant="h5" gutterBottom>
            Résultats
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="subtitle1" color="textSecondary">
                    Votre FTP estimé (Méthode: {result.method})
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', mt: 1 }}>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {result.ftp}
                    </Typography>
                    <Typography variant="h5" color="textSecondary" sx={{ ml: 1 }}>
                      W
                    </Typography>
                  </Box>
                  
                  {result.powerToWeight > 0 && (
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      Rapport puissance/poids: <strong>{result.powerToWeight} W/kg</strong>
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Interprétation du FTP
                  </Typography>
                  
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <DirectionsBike color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="C'est la puissance que vous pouvez théoriquement maintenir pendant environ 1 heure"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Timeline color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Utilisé pour définir vos zones d'entraînement et mesurer vos progrès"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <ShowChart color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="À retester tous les 4-8 semaines pour suivre votre progression"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Zones d'entraînement
              </Typography>
              
              <TableContainer component={Paper} elevation={1}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Zone</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>% FTP</TableCell>
                      <TableCell>Puissance (W)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Zone 1</TableCell>
                      <TableCell>{result.zones.z1.name}</TableCell>
                      <TableCell>&lt; 55%</TableCell>
                      <TableCell>0 - {result.zones.z1.max} W</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Zone 2</TableCell>
                      <TableCell>{result.zones.z2.name}</TableCell>
                      <TableCell>56-75%</TableCell>
                      <TableCell>{result.zones.z2.min} - {result.zones.z2.max} W</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Zone 3</TableCell>
                      <TableCell>{result.zones.z3.name}</TableCell>
                      <TableCell>76-90%</TableCell>
                      <TableCell>{result.zones.z3.min} - {result.zones.z3.max} W</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Zone 4</TableCell>
                      <TableCell>{result.zones.z4.name}</TableCell>
                      <TableCell>91-105%</TableCell>
                      <TableCell>{result.zones.z4.min} - {result.zones.z4.max} W</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Zone 5</TableCell>
                      <TableCell>{result.zones.z5.name}</TableCell>
                      <TableCell>106-120%</TableCell>
                      <TableCell>{result.zones.z5.min} - {result.zones.z5.max} W</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Zone 6</TableCell>
                      <TableCell>{result.zones.z6.name}</TableCell>
                      <TableCell>121-150%</TableCell>
                      <TableCell>{result.zones.z6.min} - {result.zones.z6.max} W</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Zone 7</TableCell>
                      <TableCell>{result.zones.z7.name}</TableCell>
                      <TableCell>&gt; 150%</TableCell>
                      <TableCell>&gt; {result.zones.z7.min} W</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Box>
      </AnimatedTransition>
    );
  };
  
  return (
    <Card className={`ftp-calculator ${className}`} elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <FitnessCenter sx={{ mr: 1 }} />
          <Typography variant="h5" component="h2">
            Calculateur FTP
          </Typography>
          <Tooltip title="Le FTP (Functional Threshold Power) est la puissance maximale que vous pouvez maintenir pendant environ une heure. C'est une mesure clé pour déterminer vos zones d'entraînement.">
            <IconButton size="small" sx={{ ml: 1 }}>
              <Info fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={selectedMethod}
            onChange={handleMethodChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="Méthodes de calcul FTP"
          >
            {methods.map((method, index) => (
              <Tab 
                key={method.id} 
                label={method.name} 
                icon={method.icon} 
                iconPosition="start"
                id={`tab-${index}`}
                aria-controls={`tabpanel-${index}`}
              />
            ))}
          </Tabs>
        </Box>
        
        <Box role="tabpanel" sx={{ py: 3 }}>
          <Typography variant="body1" paragraph>
            {methods[selectedMethod].description}
          </Typography>
          
          {renderInputFields()}
        </Box>
        
        {renderResults()}
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Conseils pour le Test FTP
          </Typography>
          
          <List dense>
            <ListItem>
              <ListItemIcon>
                <DirectionsBike color="primary" />
              </ListItemIcon>
              <ListItemText primary="Réalisez le test lorsque vous êtes bien reposé" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <DirectionsBike color="primary" />
              </ListItemIcon>
              <ListItemText primary="Effectuez un échauffement complet de 15-20 minutes" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <DirectionsBike color="primary" />
              </ListItemIcon>
              <ListItemText primary="Choisissez un parcours plat ou utilisez un home trainer" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <DirectionsBike color="primary" />
              </ListItemIcon>
              <ListItemText primary="Maintenez un effort constant pendant toute la durée du test" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <DirectionsBike color="primary" />
              </ListItemIcon>
              <ListItemText primary="Refaites le test toutes les 6-8 semaines pour suivre votre progression" />
            </ListItem>
          </List>
        </Box>
      </CardContent>
    </Card>
  );
};

FTPCalculator.propTypes = {
  userProfile: PropTypes.shape({
    weight: PropTypes.number
  }),
  onSaveFTP: PropTypes.func,
  className: PropTypes.string
};

export default FTPCalculator;
