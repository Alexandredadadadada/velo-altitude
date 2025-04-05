import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Slider, 
  TextField, 
  MenuItem, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton,
  Tooltip,
  Divider,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { 
  WaterDrop, 
  Thermostat, 
  DirectionsBike, 
  AccessTime, 
  Straighten, 
  Info, 
  Edit, 
  RestartAlt, 
  OpacityOutlined,
  ThermostatAuto,
  Lightbulb
} from '@mui/icons-material';
import AnimatedTransition from '../common/AnimatedTransition';
import SkeletonLoader from '../common/SkeletonLoader';
import TouchFriendlyControl from '../common/TouchFriendlyControl';

/**
 * HydrationPlanner Component
 * Calculates hydration needs based on user profile, environmental conditions, 
 * and training parameters, providing a detailed hydration plan
 */
const HydrationPlanner = ({ 
  userProfile,
  initialRideData = {},
  onSavePlan = null,
  className = '' 
}) => {
  // Default values for ride data
  const defaultRideData = {
    duration: 120, // minutes
    temperature: 25, // °C
    intensity: 'moderate', // low, moderate, high, very_high
    humidity: 50, // %
    elevation: 500, // meters
    weight: userProfile?.weight || 70, // kg
  };
  
  // State for ride data
  const [rideData, setRideData] = useState({ ...defaultRideData, ...initialRideData });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(true);
  
  // Additional state for hydration strategy
  const [hydrationStrategy, setHydrationStrategy] = useState({
    carbohydrateConcentration: 6, // % (g per 100ml)
    sodiumConcentration: 400, // mg/L
    drinkingFrequency: 15, // minutes
    useElectrolytes: true
  });
  
  // Hydration plan calculated based on ride data
  const hydrationPlan = useMemo(() => 
    calculateHydrationPlan(rideData, hydrationStrategy),
    [rideData, hydrationStrategy]
  );
  
  // Effect to load plan when user profile changes
  useEffect(() => {
    if (userProfile?.weight && userProfile.weight !== rideData.weight) {
      setRideData(prev => ({ ...prev, weight: userProfile.weight }));
    }
  }, [userProfile]);
  
  // Effect to simulate loading state for better UX
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/hydrationplanner"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
  }, [rideData, hydrationStrategy]);
  
  // Handle ride data changes
  const handleRideDataChange = (field, value) => {
    setRideData(prev => ({ ...prev, [field]: value }));
  };
  
  // Handle slider change
  const handleSliderChange = (field) => (_, value) => {
    handleRideDataChange(field, value);
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    handleRideDataChange(name, value);
  };
  
  // Handle hydration strategy change
  const handleStrategyChange = (field, value) => {
    setHydrationStrategy(prev => ({ ...prev, [field]: value }));
  };
  
  // Reset to defaults
  const handleReset = () => {
    setRideData(defaultRideData);
    setHydrationStrategy({
      carbohydrateConcentration: 6,
      sodiumConcentration: 400,
      drinkingFrequency: 15,
      useElectrolytes: true
    });
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
    
    // Save plan when exiting edit mode
    if (editMode && onSavePlan) {
      onSavePlan({
        rideData,
        hydrationStrategy,
        plan: hydrationPlan
      });
    }
  };
  
  // Render input section
  const renderInputSection = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="h3">
            Paramètres de sortie
          </Typography>
          <Box>
            <TouchFriendlyControl 
              onPress={toggleEditMode}
              ariaLabel={editMode ? "Sauvegarder" : "Modifier"}
            >
              <IconButton color="primary" size="small">
                {editMode ? <Info /> : <Edit />}
              </IconButton>
            </TouchFriendlyControl>
            {editMode && (
              <TouchFriendlyControl 
                onPress={handleReset}
                ariaLabel="Réinitialiser"
              >
                <IconButton color="secondary" size="small">
                  <RestartAlt />
                </IconButton>
              </TouchFriendlyControl>
            )}
          </Box>
        </Box>
      </Grid>
      
      {/* Duration */}
      <Grid item xs={12} sm={6} md={4}>
        <Typography gutterBottom display="flex" alignItems="center">
          <AccessTime fontSize="small" sx={{ mr: 1 }} />
          Durée: {rideData.duration} min
        </Typography>
        {editMode ? (
          <Slider
            value={rideData.duration}
            onChange={handleSliderChange('duration')}
            min={30}
            max={480}
            step={15}
            marks={[
              { value: 60, label: '1h' },
              { value: 180, label: '3h' },
              { value: 360, label: '6h' }
            ]}
          />
        ) : (
          <Box sx={{ height: 40 }} />
        )}
      </Grid>
      
      {/* Temperature */}
      <Grid item xs={12} sm={6} md={4}>
        <Typography gutterBottom display="flex" alignItems="center">
          <Thermostat fontSize="small" sx={{ mr: 1 }} />
          Température: {rideData.temperature}°C
        </Typography>
        {editMode ? (
          <Slider
            value={rideData.temperature}
            onChange={handleSliderChange('temperature')}
            min={0}
            max={40}
            marks={[
              { value: 10, label: '10°' },
              { value: 25, label: '25°' },
              { value: 35, label: '35°' }
            ]}
          />
        ) : (
          <Box sx={{ height: 40 }} />
        )}
      </Grid>
      
      {/* Intensity */}
      <Grid item xs={12} sm={6} md={4}>
        <Typography gutterBottom display="flex" alignItems="center">
          <DirectionsBike fontSize="small" sx={{ mr: 1 }} />
          Intensité
        </Typography>
        {editMode ? (
          <FormControl fullWidth size="small">
            <Select
              name="intensity"
              value={rideData.intensity}
              onChange={handleInputChange}
            >
              <MenuItem value="low">Faible (Z1-Z2)</MenuItem>
              <MenuItem value="moderate">Modérée (Z2-Z3)</MenuItem>
              <MenuItem value="high">Élevée (Z3-Z4)</MenuItem>
              <MenuItem value="very_high">Très élevée (Z5+)</MenuItem>
            </Select>
          </FormControl>
        ) : (
          <Typography variant="body2">
            {rideData.intensity === 'low' && 'Faible (Z1-Z2)'}
            {rideData.intensity === 'moderate' && 'Modérée (Z2-Z3)'}
            {rideData.intensity === 'high' && 'Élevée (Z3-Z4)'}
            {rideData.intensity === 'very_high' && 'Très élevée (Z5+)'}
          </Typography>
        )}
      </Grid>
      
      {/* Humidity */}
      {(showAdvanced || !editMode) && (
        <Grid item xs={12} sm={6} md={4}>
          <Typography gutterBottom display="flex" alignItems="center">
            <OpacityOutlined fontSize="small" sx={{ mr: 1 }} />
            Humidité: {rideData.humidity}%
          </Typography>
          {editMode ? (
            <Slider
              value={rideData.humidity}
              onChange={handleSliderChange('humidity')}
              min={10}
              max={90}
              marks={[
                { value: 30, label: '30%' },
                { value: 60, label: '60%' },
              ]}
            />
          ) : (
            <Box sx={{ height: 40 }} />
          )}
        </Grid>
      )}
      
      {/* Elevation */}
      {(showAdvanced || !editMode) && (
        <Grid item xs={12} sm={6} md={4}>
          <Typography gutterBottom display="flex" alignItems="center">
            <Straighten fontSize="small" sx={{ mr: 1 }} />
            Dénivelé: {rideData.elevation}m
          </Typography>
          {editMode ? (
            <Slider
              value={rideData.elevation}
              onChange={handleSliderChange('elevation')}
              min={0}
              max={3000}
              step={100}
              marks={[
                { value: 500, label: '500m' },
                { value: 1500, label: '1500m' },
              ]}
            />
          ) : (
            <Box sx={{ height: 40 }} />
          )}
        </Grid>
      )}
      
      {/* Weight */}
      {(showAdvanced || !editMode) && (
        <Grid item xs={12} sm={6} md={4}>
          <Typography gutterBottom display="flex" alignItems="center">
            <WaterDrop fontSize="small" sx={{ mr: 1 }} />
            Poids: {rideData.weight}kg
          </Typography>
          {editMode ? (
            <Slider
              value={rideData.weight}
              onChange={handleSliderChange('weight')}
              min={40}
              max={120}
              marks={[
                { value: 60, label: '60kg' },
                { value: 80, label: '80kg' },
                { value: 100, label: '100kg' },
              ]}
            />
          ) : (
            <Box sx={{ height: 40 }} />
          )}
        </Grid>
      )}
      
      {/* Toggle advanced parameters */}
      {editMode && (
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
            <TouchFriendlyControl
              onPress={() => setShowAdvanced(!showAdvanced)}
              ariaLabel={showAdvanced ? "Masquer les paramètres avancés" : "Afficher les paramètres avancés"}
            >
              <Typography 
                color="primary" 
                variant="button" 
                sx={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center',
                  '&:hover': { textDecoration: 'underline' } 
                }}
              >
                {showAdvanced ? "Masquer les paramètres avancés" : "Afficher les paramètres avancés"}
              </Typography>
            </TouchFriendlyControl>
          </Box>
        </Grid>
      )}
      
      {/* Advanced hydration strategy */}
      {showAdvanced && editMode && (
        <>
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="h6" component="h3" sx={{ mt: 2, mb: 1 }}>
              Stratégie d'hydratation avancée
            </Typography>
          </Grid>
          
          {/* Carbohydrate concentration */}
          <Grid item xs={12} sm={6}>
            <Typography gutterBottom display="flex" alignItems="center">
              <Lightbulb fontSize="small" sx={{ mr: 1 }} />
              Concentration en glucides: {hydrationStrategy.carbohydrateConcentration}%
              <Tooltip title="Pourcentage de glucides dans votre boisson (grammes pour 100ml)">
                <IconButton size="small">
                  <Info fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <Slider
              value={hydrationStrategy.carbohydrateConcentration}
              onChange={(_, value) => handleStrategyChange('carbohydrateConcentration', value)}
              min={0}
              max={12}
              step={1}
              marks={[
                { value: 0, label: '0%' },
                { value: 6, label: '6%' },
                { value: 12, label: '12%' }
              ]}
            />
          </Grid>
          
          {/* Sodium concentration */}
          <Grid item xs={12} sm={6}>
            <Typography gutterBottom display="flex" alignItems="center">
              <ThermostatAuto fontSize="small" sx={{ mr: 1 }} />
              Concentration en sodium: {hydrationStrategy.sodiumConcentration} mg/L
              <Tooltip title="Quantité de sodium dans votre boisson en milligrammes par litre">
                <IconButton size="small">
                  <Info fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <Slider
              value={hydrationStrategy.sodiumConcentration}
              onChange={(_, value) => handleStrategyChange('sodiumConcentration', value)}
              min={0}
              max={1000}
              step={50}
              marks={[
                { value: 0, label: '0' },
                { value: 400, label: '400' },
                { value: 800, label: '800' }
              ]}
            />
          </Grid>
          
          {/* Drinking frequency */}
          <Grid item xs={12} sm={6}>
            <Typography gutterBottom display="flex" alignItems="center">
              <AccessTime fontSize="small" sx={{ mr: 1 }} />
              Fréquence de consommation: {hydrationStrategy.drinkingFrequency} min
            </Typography>
            <Slider
              value={hydrationStrategy.drinkingFrequency}
              onChange={(_, value) => handleStrategyChange('drinkingFrequency', value)}
              min={5}
              max={30}
              step={5}
              marks={[
                { value: 10, label: '10min' },
                { value: 20, label: '20min' },
              ]}
            />
          </Grid>
        </>
      )}
    </Grid>
  );
  
  // Render results
  const renderResults = () => {
    if (loading) {
      return <SkeletonLoader type="text" lines={10} />;
    }
    
    return (
      <AnimatedTransition type="fade">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ 
              p: 2, 
              bgcolor: 'primary.main', 
              color: 'primary.contrastText',
              borderRadius: 1
            }}>
              <Typography variant="h6" component="h3">
                Plan d'hydratation personnalisé
              </Typography>
              <Typography variant="body2">
                Basé sur vos paramètres et les conditions environnementales
              </Typography>
            </Box>
          </Grid>
          
          {/* Summary */}
          <Grid item xs={12} md={6}>
            <TableContainer component={Paper} elevation={0} variant="outlined">
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row">Besoin total en eau</TableCell>
                    <TableCell align="right">{hydrationPlan.totalWater} ml</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Taux de consommation</TableCell>
                    <TableCell align="right">{hydrationPlan.ratePerHour} ml/h</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Quantité par ravitaillement</TableCell>
                    <TableCell align="right">{hydrationPlan.amountPerServing} ml</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Glucides totaux</TableCell>
                    <TableCell align="right">{hydrationPlan.totalCarbohydrates} g</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Sodium total</TableCell>
                    <TableCell align="right">{hydrationPlan.totalSodium} mg</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Risque de déshydratation</TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        color: getDehydrationRiskColor(hydrationPlan.dehydrationRisk),
                        fontWeight: 'bold'
                      }}
                    >
                      {hydrationPlan.dehydrationRisk}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          
          {/* Hourly breakdown */}
          <Grid item xs={12} md={6}>
            <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ maxHeight: 250, overflow: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Temps</TableCell>
                    <TableCell align="right">Eau (ml)</TableCell>
                    <TableCell align="right">Glucides (g)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hydrationPlan.hourlyBreakdown.map((hour) => (
                    <TableRow key={hour.time}>
                      <TableCell component="th" scope="row">{hour.time}</TableCell>
                      <TableCell align="right">{hour.water}</TableCell>
                      <TableCell align="right">{hour.carbs}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
          
          {/* Recommendations */}
          <Grid item xs={12}>
            <Paper elevation={0} variant="outlined" sx={{ p: 2, borderLeft: 4, borderColor: 'primary.main' }}>
              <Typography variant="subtitle2" gutterBottom>
                Recommandations personnalisées:
              </Typography>
              <Typography variant="body2" component="div">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {hydrationPlan.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </AnimatedTransition>
    );
  };
  
  return (
    <Card className={`hydration-planner ${className}`} elevation={2}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom display="flex" alignItems="center">
          <WaterDrop fontSize="small" sx={{ mr: 1 }} />
          Planificateur d'Hydratation
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        {renderInputSection()}
        
        <Divider sx={{ my: 3 }} />
        
        {renderResults()}
      </CardContent>
    </Card>
  );
};

/**
 * Calculate hydration plan based on ride data and strategy
 */
const calculateHydrationPlan = (rideData, strategy) => {
  // Extract data
  const { duration, temperature, intensity, humidity, elevation, weight } = rideData;
  const { carbohydrateConcentration, sodiumConcentration, drinkingFrequency } = strategy;
  
  // Base fluid loss per hour based on weight (ml)
  const baseFluidLoss = 500; // Base case
  
  // Adjust for temperature (higher temperature = more fluid loss)
  const temperatureFactor = 1 + Math.max(0, (temperature - 20) * 0.05);
  
  // Adjust for intensity
  const intensityFactors = {
    low: 0.8,
    moderate: 1.0,
    high: 1.3,
    very_high: 1.6
  };
  
  // Adjust for humidity
  const humidityFactor = 1 + Math.max(0, (humidity - 50) * 0.01);
  
  // Adjust for elevation (higher elevation = more fluid loss due to drier air and lower pressure)
  const elevationFactor = 1 + Math.min(0.2, elevation / 5000);
  
  // Adjust for weight (heavier riders lose more fluid)
  const weightFactor = weight / 70;
  
  // Calculate fluid loss per hour (ml)
  let fluidLossPerHour = baseFluidLoss * 
    temperatureFactor * 
    intensityFactors[intensity] * 
    humidityFactor * 
    elevationFactor * 
    weightFactor;
  
  // Round to nearest 50ml
  fluidLossPerHour = Math.round(fluidLossPerHour / 50) * 50;
  
  // Total fluid needed for the ride
  const totalFluid = Math.round((fluidLossPerHour * duration) / 60);
  
  // Amount to drink per serving based on drinking frequency
  const servingsPerHour = 60 / drinkingFrequency;
  const amountPerServing = Math.round(fluidLossPerHour / servingsPerHour);
  
  // Calculate carbohydrate intake
  const totalCarbs = Math.round((totalFluid * carbohydrateConcentration) / 100);
  
  // Calculate sodium intake
  const totalSodium = Math.round((totalFluid * sodiumConcentration) / 1000);
  
  // Generate hourly breakdown
  const hourlyBreakdown = [];
  const fullHours = Math.floor(duration / 60);
  const remainingMinutes = duration % 60;
  
  for (let hour = 0; hour < fullHours; hour++) {
    hourlyBreakdown.push({
      time: `${hour}:00 - ${hour+1}:00`,
      water: Math.round(fluidLossPerHour),
      carbs: Math.round((fluidLossPerHour * carbohydrateConcentration) / 100)
    });
  }
  
  if (remainingMinutes > 0) {
    const partialHourWater = Math.round((fluidLossPerHour * remainingMinutes) / 60);
    hourlyBreakdown.push({
      time: `${fullHours}:00 - ${fullHours}:${remainingMinutes}`,
      water: partialHourWater,
      carbs: Math.round((partialHourWater * carbohydrateConcentration) / 100)
    });
  }
  
  // Determine dehydration risk
  let dehydrationRisk = 'Faible';
  if (temperature > 30 && humidity > 60) {
    dehydrationRisk = 'Élevé';
  } else if (temperature > 25 || humidity > 70 || intensity === 'very_high') {
    dehydrationRisk = 'Modéré';
  }
  
  // Generate recommendations
  const recommendations = [];
  
  // Basic recommendations
  recommendations.push(`Commencez bien hydraté : buvez 500ml d'eau 2 heures avant le départ.`);
  
  if (temperature > 30) {
    recommendations.push(`Pour les conditions chaudes (${temperature}°C), augmentez votre consommation de liquides de 20% et considérez l'ajout de glace dans vos bidons.`);
  }
  
  if (duration > 180) {
    recommendations.push(`Pour les sorties longues (>${Math.floor(duration/60)}h), alternez entre l'eau et les boissons énergétiques pour éviter la fatigue gustative.`);
  }
  
  if (carbohydrateConcentration > 8) {
    recommendations.push(`Votre concentration en glucides est élevée (${carbohydrateConcentration}%). Pour éviter les problèmes digestifs, assurez-vous de tester cette formulation avant un événement important.`);
import EnhancedMetaTags from '../common/EnhancedMetaTags';
  }
  
  if (elevation > 1500) {
    recommendations.push(`La haute altitude augmente les pertes hydriques respiratoires. Augmentez votre consommation d'eau de 10% pour chaque 1000m d'altitude.`);
  }
  
  if (dehydrationRisk === 'Élevé') {
    recommendations.push(`Risque élevé de déshydratation : surveillez attentivement vos urines (elles doivent rester claires) et votre fréquence cardiaque (une augmentation soudaine peut indiquer une déshydratation).`);
  }
  
  return {
    totalWater: totalFluid,
    ratePerHour: fluidLossPerHour,
    amountPerServing,
    totalCarbohydrates: totalCarbs,
    totalSodium,
    dehydrationRisk,
    hourlyBreakdown,
    recommendations
  };
};

/**
 * Get color for dehydration risk level
 */
const getDehydrationRiskColor = (risk) => {
  switch (risk) {
    case 'Élevé':
      return 'error.main';
    case 'Modéré':
      return 'warning.main';
    default:
      return 'success.main';
  }
};

HydrationPlanner.propTypes = {
  userProfile: PropTypes.shape({
    weight: PropTypes.number
  }),
  initialRideData: PropTypes.shape({
    duration: PropTypes.number,
    temperature: PropTypes.number,
    intensity: PropTypes.string,
    humidity: PropTypes.number,
    elevation: PropTypes.number,
    weight: PropTypes.number
  }),
  onSavePlan: PropTypes.func,
  className: PropTypes.string
};

export default HydrationPlanner;
