/**
 * Composant de test pour le système météorologique avancé
 * Permet de valider le fonctionnement et les performances des services météorologiques
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Paper, 
  Divider, 
  Switch, 
  FormControlLabel,
  Slider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Importer les services
import { WeatherSystemIntegration } from '../../services/weather/WeatherSystemIntegration';
import { AdvancedWeatherMonitoring } from '../../services/monitoring/AdvancedWeatherMonitoring';
import { WeatherPredictionSystem } from '../../services/weather/WeatherPredictionSystem';
import { GPUResourceManager } from '../../services/weather/GPUResourceManager';
import { DynamicAdaptationSystem } from '../../services/weather/DynamicAdaptationSystem';
import { getDeviceCapabilities } from '../../utils/device';
import { WeatherVisualizationService } from '../../services/visualization/WeatherVisualizationService';
import { RealApiOrchestrator } from '../../api/orchestration/RealApiOrchestrator';

// Importer le composant d'exécution de tests
import WeatherTestRunner from './WeatherTestRunner';

// Enregistrer les composants ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Interface pour TabPanel
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Composant TabPanel
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`weather-tabpanel-${index}`}
      aria-labelledby={`weather-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

/**
 * Composant principal de test
 */
export const WeatherSystemTest: React.FC = () => {
  // État des systèmes
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  
  // Options de configuration
  const [proactiveOptimization, setProactiveOptimization] = useState<boolean>(true);
  const [prediction, setPrediction] = useState<boolean>(true);
  const [autoAdapt, setAutoAdapt] = useState<boolean>(true);
  
  // Métriques
  const [fps, setFps] = useState<number>(60);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  const [particleCount, setParticleCount] = useState<number>(0);
  const [apiLatency, setApiLatency] = useState<number>(0);
  
  // Historique des métriques pour les graphiques
  const [fpsHistory, setFpsHistory] = useState<number[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<number[]>([]);
  const [timeLabels, setTimeLabels] = useState<string[]>([]);
  
  // État des effets météo
  const [activeEffect, setActiveEffect] = useState<string>('clear');
  const [effectIntensity, setEffectIntensity] = useState<number>(0.5);
  
  // Optimisations
  const [optimizationHistory, setOptimizationHistory] = useState<Array<{
    timestamp: string;
    strategy: string;
    impact: string;
  }>>([]);
  
  // Prédictions
  const [predictions, setPredictions] = useState<string[]>([]);
  
  // Référence aux systèmes
  const systemRef = useRef<{
    weatherSystem?: WeatherSystemIntegration;
    monitoring?: AdvancedWeatherMonitoring;
  }>({});
  
  // Initialiser les systèmes au chargement
  useEffect(() => {
    const initializeSystems = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Créer le système de monitoring
        const deviceCapabilities = getDeviceCapabilities();
        const monitoring = new AdvancedWeatherMonitoring(deviceCapabilities);
        
        // Créer le système de prédiction
        const predictionSystem = new WeatherPredictionSystem();
        
        // Créer le gestionnaire de ressources
        const resourceManager = new GPUResourceManager(deviceCapabilities);
        
        // Créer le système d'adaptation
        const adaptationSystem = new DynamicAdaptationSystem();
        
        // Créer le système d'intégration
        const weatherSystem = new WeatherSystemIntegration(
          monitoring,
          predictionSystem,
          resourceManager,
          adaptationSystem
        );
        
        // Configurer les options
        weatherSystem.configure({
          proactiveOptimization,
          prediction,
          autoAdapt
        });
        
        // Initialiser le système
        await weatherSystem.initialize();
        
        // Stocker les références
        systemRef.current = {
          weatherSystem,
          monitoring
        };
        
        // S'abonner aux résultats d'optimisation
        weatherSystem.onOptimizationResult((result) => {
          if (result.applied && result.strategy) {
            setOptimizationHistory(prev => [
              {
                timestamp: new Date().toLocaleTimeString(),
                strategy: result.strategy || 'unknown',
                impact: JSON.stringify(result.impact || {})
              },
              ...prev.slice(0, 9) // Garder les 10 dernières
            ]);
          }
        });
        
        // Initialisation terminée
        setIsInitialized(true);
        
        // Démarrer la simulation des métriques
        startMetricsSimulation();
      } catch (error) {
        console.error('Failed to initialize weather systems:', error);
        setError('Échec de l\'initialisation des systèmes météorologiques: ' + 
          (error instanceof Error ? error.message : String(error)));
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeSystems();
    
    // Nettoyage
    return () => {
      if (systemRef.current.weatherSystem) {
        systemRef.current.weatherSystem.dispose();
      }
    };
  }, []);
  
  // Mettre à jour la configuration quand les options changent
  useEffect(() => {
    if (systemRef.current.weatherSystem && isInitialized) {
      systemRef.current.weatherSystem.configure({
        proactiveOptimization,
        prediction,
        autoAdapt
      });
    }
  }, [proactiveOptimization, prediction, autoAdapt, isInitialized]);
  
  // Simulation des métriques pour la démo
  const startMetricsSimulation = () => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeLabel = now.toLocaleTimeString();
      
      // Simuler des FPS
      const baseFps = 60;
      let currentFps = baseFps;
      
      // Réduire le FPS en fonction de l'effet actif
      if (activeEffect !== 'clear') {
        const effectImpact = {
          'light_rain': 5,
          'heavy_rain': 15,
          'snow': 10,
          'fog': 8
        };
        
        const impact = effectImpact[activeEffect as keyof typeof effectImpact] || 0;
        currentFps = Math.max(10, baseFps - impact * effectIntensity);
      }
      
      // Ajouter une variation aléatoire
      currentFps += (Math.random() - 0.5) * 5;
      currentFps = Math.min(60, Math.max(10, currentFps));
      
      // Simuler l'utilisation mémoire
      let currentMemory = memoryUsage;
      currentMemory += (Math.random() - 0.4) * 2; // Tendance à augmenter légèrement
      currentMemory = Math.min(100, Math.max(10, currentMemory));
      
      // Simuler le nombre de particules
      let particles = 0;
      if (activeEffect === 'light_rain') {
        particles = 7500 * effectIntensity;
      } else if (activeEffect === 'heavy_rain') {
        particles = 15000 * effectIntensity;
      } else if (activeEffect === 'snow') {
        particles = 10000 * effectIntensity;
      } else if (activeEffect === 'fog') {
        particles = 3000 * effectIntensity;
      }
      
      // Simuler la latence API
      const latency = 50 + Math.random() * 100;
      
      // Mettre à jour les états
      setFps(Math.round(currentFps));
      setMemoryUsage(currentMemory);
      setParticleCount(Math.round(particles));
      setApiLatency(Math.round(latency));
      
      // Mettre à jour l'historique
      setFpsHistory(prev => [...prev.slice(-19), Math.round(currentFps)]);
      setMemoryHistory(prev => [...prev.slice(-19), currentMemory]);
      setTimeLabels(prev => [...prev.slice(-19), timeLabel]);
      
      // Simuler les métriques envoyées au monitoring
      if (systemRef.current.monitoring) {
        systemRef.current.monitoring.trackMetrics({
          fps: currentFps,
          frameTime: 1000 / currentFps,
          particleCount: particles,
          apiLatency: latency,
          memoryUsage: currentMemory
        });
      }
      
      // Simuler l'effet météo
      if (systemRef.current.weatherSystem && activeEffect !== 'clear') {
        systemRef.current.weatherSystem.notifyWeatherEffectActivated(
          activeEffect,
          'col-test-1',
          { latitude: 45.0, longitude: 6.0, altitude: 2000 }
        );
        
        // Simuler les prédictions
        if (prediction) {
          const possibleNextEffects = {
            'clear': ['light_rain', 'fog', 'clear'],
            'light_rain': ['heavy_rain', 'clear', 'light_rain'],
            'heavy_rain': ['light_rain', 'heavy_rain', 'clear'],
            'snow': ['light_snow', 'clear', 'snow'],
            'fog': ['clear', 'light_rain', 'fog']
          };
          
          const nextEffects = possibleNextEffects[activeEffect as keyof typeof possibleNextEffects] || ['clear'];
          setPredictions(nextEffects);
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  };
  
  // Changer l'effet météo
  const handleEffectChange = (effect: string) => {
    if (systemRef.current.weatherSystem && activeEffect !== 'clear') {
      systemRef.current.weatherSystem.notifyWeatherEffectDeactivated(activeEffect);
    }
    
    setActiveEffect(effect);
    
    if (systemRef.current.weatherSystem && effect !== 'clear') {
      systemRef.current.weatherSystem.notifyWeatherEffectActivated(
        effect,
        'col-test-1',
        { latitude: 45.0, longitude: 6.0, altitude: 2000 }
      );
    }
  };
  
  // Configuration des graphiques
  const fpsChartData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'FPS',
        data: fpsHistory,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      }
    ],
  };
  
  const memoryChartData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Mémoire (%)',
        data: memoryHistory,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      }
    ],
  };
  
  const chartOptions = {
    responsive: true,
    animation: {
      duration: 0 // Désactiver les animations pour de meilleures performances
    },
    scales: {
      y: {
        beginAtZero: false
      }
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Test du Système Météorologique
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper sx={{ mb: 3, p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={proactiveOptimization}
                      onChange={(e) => setProactiveOptimization(e.target.checked)}
                    />
                  }
                  label="Optimisation Proactive"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={prediction}
                      onChange={(e) => setPrediction(e.target.checked)}
                    />
                  }
                  label="Prédiction Météo"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoAdapt}
                      onChange={(e) => setAutoAdapt(e.target.checked)}
                    />
                  }
                  label="Adaptation Automatique"
                />
              </Grid>
            </Grid>
          </Paper>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Métriques" />
              <Tab label="Effets Météo" />
              <Tab label="Optimisations" />
              <Tab label="Tests RealApiOrchestrator" />
              <Tab label="Tests Manuels" />
            </Tabs>
          </Box>
          
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Métriques en Temps Réel
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          FPS
                        </Typography>
                        <Typography variant="h5">
                          {fps}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Mémoire
                        </Typography>
                        <Typography variant="h5">
                          {memoryUsage.toFixed(1)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Particules
                        </Typography>
                        <Typography variant="h5">
                          {particleCount.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Latence API
                        </Typography>
                        <Typography variant="h5">
                          {apiLatency}ms
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      État du Système
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Effet Actif
                        </Typography>
                        <Typography variant="body1">
                          {activeEffect}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Intensité
                        </Typography>
                        <Typography variant="body1">
                          {(effectIntensity * 100).toFixed(0)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Prochains effets prédits
                        </Typography>
                        <Typography variant="body1">
                          {predictions.join(', ') || 'Aucune prédiction'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Historique des performances
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Line options={chartOptions} data={fpsChartData} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Line options={chartOptions} data={memoryChartData} />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
          
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Effet météorologique
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Type d'effet</InputLabel>
                    <Select
                      value={activeEffect}
                      onChange={(e) => handleEffectChange(e.target.value)}
                    >
                      <MenuItem value="clear">Ciel dégagé</MenuItem>
                      <MenuItem value="light_rain">Pluie légère</MenuItem>
                      <MenuItem value="heavy_rain">Forte pluie</MenuItem>
                      <MenuItem value="snow">Neige</MenuItem>
                      <MenuItem value="fog">Brouillard</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Typography gutterBottom>
                    Intensité
                  </Typography>
                  <Slider
                    value={effectIntensity}
                    onChange={(e, newValue) => setEffectIntensity(newValue as number)}
                    min={0}
                    max={1}
                    step={0.01}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Prévisualisation
                  </Typography>
                  <Box
                    sx={{
                      height: 200,
                      backgroundColor: 'action.hover',
                      borderRadius: 1,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Visualisation simplifiée pour la démo */}
                    {activeEffect === 'light_rain' && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundImage: 'linear-gradient(0deg, rgba(0,0,255,0.1) 0%, rgba(0,0,255,0) 100%)',
                          opacity: effectIntensity,
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: '-10px',
                            left: 0,
                            width: '100%',
                            height: '10px',
                            background: 'rgba(255,255,255,0.5)',
                            animation: 'rain 1s linear infinite',
                            boxShadow: '0 0 50px 50px rgba(255,255,255,0.5)'
                          }
                        }}
                      />
                    )}
                    
                    {activeEffect === 'heavy_rain' && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundImage: 'linear-gradient(0deg, rgba(0,0,255,0.2) 0%, rgba(0,0,255,0) 100%)',
                          opacity: effectIntensity,
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: '-10px',
                            left: 0,
                            width: '100%',
                            height: '10px',
                            background: 'rgba(255,255,255,0.7)',
                            animation: 'rain 0.5s linear infinite',
                            boxShadow: '0 0 50px 50px rgba(255,255,255,0.7)'
                          }
                        }}
                      />
                    )}
                    
                    {activeEffect === 'snow' && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)',
                          backgroundSize: '10px 10px',
                          backgroundPosition: '0 0',
                          opacity: effectIntensity,
                          animation: 'snow 10s linear infinite'
                        }}
                      />
                    )}
                    
                    {activeEffect === 'fog' && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(255,255,255,0.7)',
                          opacity: effectIntensity
                        }}
                      />
                    )}
                    
                    <Typography
                      variant="body2"
                      sx={{
                        position: 'absolute',
                        bottom: 10,
                        left: 10,
                        color: 'text.primary',
                        fontWeight: 'bold'
                      }}
                    >
                      {activeEffect === 'clear' ? 'Pas d\'effet actif' : `${activeEffect} (${(effectIntensity * 100).toFixed(0)}%)`}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
          
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Historique des Optimisations
                  </Typography>
                  {optimizationHistory.length === 0 ? (
                    <Alert severity="info">
                      Aucune optimisation n'a encore été appliquée. Essayez d'activer des effets météorologiques intenses pour déclencher des optimisations.
                    </Alert>
                  ) : (
                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                      {optimizationHistory.map((opt, index) => (
                        <Paper key={index} sx={{ p: 2, mb: 1 }}>
                          <Grid container>
                            <Grid item xs={3}>
                              <Typography variant="caption" color="text.secondary">
                                {opt.timestamp}
                              </Typography>
                            </Grid>
                            <Grid item xs={5}>
                              <Typography variant="body2" fontWeight="bold">
                                {opt.strategy}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2">
                                Impact: {opt.impact}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </Box>
                  )}
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Déclencher des Optimisations
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <Button 
                        variant="outlined" 
                        fullWidth
                        onClick={() => {
                          setMemoryUsage(85);
                          setFps(25);
                        }}
                      >
                        Simuler Problème de Mémoire
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button 
                        variant="outlined" 
                        fullWidth
                        onClick={() => {
                          setFps(15);
                        }}
                      >
                        Simuler Problème de FPS
                      </Button>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Button 
                        variant="outlined" 
                        fullWidth
                        onClick={() => {
                          handleEffectChange('heavy_rain');
                          setEffectIntensity(1.0);
                        }}
                      >
                        Simuler Conditions Météo Extrêmes
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
          
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Test d'Intégration avec RealApiOrchestrator
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Cette section permet de vérifier que le système météorologique s'intègre correctement avec RealApiOrchestrator, en suivant notre stratégie de refactorisation pour éliminer le mocking intrusif.
                  </Typography>
                  
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={async () => {
                      try {
                        setIsLoading(true);
                        
                        // Obtenir l'orchestrateur
                        const orchestrator = RealApiOrchestrator.getInstance();
                        
                        // Tester l'intégration avec le service météo
                        const weatherService = await orchestrator.getWeatherService();
                        
                        if (weatherService) {
                          // Obtenir des données météo
                          const testLocation = { 
                            latitude: 45.0, 
                            longitude: 6.0, 
                            altitude: 2000 
                          };
                          
                          const weatherData = await weatherService.getColWindConditions(
                            'col-test-1',
                            testLocation
                          );
                          
                          // Afficher les résultats
                          setOptimizationHistory(prev => [
                            {
                              timestamp: new Date().toLocaleTimeString(),
                              strategy: 'API Integration Test',
                              impact: JSON.stringify(weatherData)
                            },
                            ...prev
                          ]);
                          
                          setError(null);
                        } else {
                          setError('Weather service not available from RealApiOrchestrator');
                        }
                      } catch (err) {
                        setError('Failed to test RealApiOrchestrator integration: ' + 
                          (err instanceof Error ? err.message : String(err)));
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  >
                    Tester l'Intégration API
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>
          
          <TabPanel value={activeTab} index={4}>
            <WeatherTestRunner />
          </TabPanel>
        </>
      )}
      
      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Ce composant permet de tester le système météorologique avancé de Velo-Altitude, y compris la prédiction, l'adaptation et l'optimisation.
        </Typography>
      </Box>
    </Box>
  );
};

export default WeatherSystemTest;
