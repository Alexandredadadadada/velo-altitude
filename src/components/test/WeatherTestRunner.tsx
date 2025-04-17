/**
 * Composant d'exécution des tests météorologiques
 * Intègre les cas de tests définis dans weather-verification.ts
 * à l'interface graphique de test WeatherSystemTest
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Chip,
  Divider,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  CardActions,
  FormControlLabel,
  Switch,
  Grid
} from '@mui/material';
import { 
  weatherTests, 
  WeatherTestCase, 
  runTest, 
  setupBaseVisualization,
  listAllTests
} from '../../tests/manual/weather-verification';

// Interface pour les résultats de test
interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  notes?: string;
  metrics?: {
    fps: number;
    memoryUsage: number;
    particleCount: number;
    apiLatency?: number;
  };
  startTime?: Date;
  endTime?: Date;
}

/**
 * Composant d'exécution des tests météorologiques
 */
export const WeatherTestRunner: React.FC = () => {
  // État actuel du test
  const [selectedTest, setSelectedTest] = useState<WeatherTestCase | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentResult, setCurrentResult] = useState<TestResult | null>(null);
  const [showCompleted, setShowCompleted] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Métriques simulées
  const [metrics, setMetrics] = useState<{
    fps: number;
    memoryUsage: number;
    particleCount: number;
    apiLatency: number;
  }>({
    fps: 60,
    memoryUsage: 0,
    particleCount: 0,
    apiLatency: 0
  });
  
  // Au chargement initial
  useEffect(() => {
    try {
      // Préparer l'environnement de test
      setupBaseVisualization();
      console.log('Environnement de test initialisé');
      
      // Charger les résultats précédents du localStorage
      const savedResults = localStorage.getItem('weather-test-results');
      if (savedResults) {
        setTestResults(JSON.parse(savedResults));
      }
    } catch (err) {
      setError(`Erreur d'initialisation: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);
  
  // Sauvegarder les résultats
  useEffect(() => {
    if (testResults.length > 0) {
      localStorage.setItem('weather-test-results', JSON.stringify(testResults));
    }
  }, [testResults]);
  
  // Sélectionner un test
  const handleSelectTest = (test: WeatherTestCase) => {
    setSelectedTest(test);
    setActiveStep(0);
    
    try {
      // Configurer le test
      test.setup();
      
      // Initialiser le résultat
      const result: TestResult = {
        name: test.name,
        status: 'pending',
        startTime: new Date()
      };
      
      setCurrentResult(result);
      
      // Mettre à jour les métriques pour simuler le test
      updateMetricsForTest(test);
      
    } catch (err) {
      setError(`Erreur de configuration du test: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Simuler les métriques en fonction du test
  const updateMetricsForTest = (test: WeatherTestCase) => {
    // Métriques de base par défaut
    let baseFps = 60;
    let baseMemory = 30;
    let baseParticles = 1000;
    let baseLatency = 50;
    
    // Ajuster en fonction du test sélectionné
    switch(test.name) {
      case "Rendu GPU des effets de pluie":
        baseFps = 45;
        baseMemory = 70;
        baseParticles = 15000;
        break;
        
      case "Fallback CPU pour effets météo":
        baseFps = 30;
        baseMemory = 40;
        baseParticles = 5000;
        break;
        
      case "Transitions entre conditions météo":
        baseFps = 50;
        baseMemory = 60;
        baseParticles = 8000;
        break;
        
      case "Compatibilité avec les services météo existants":
        baseFps = 55;
        baseMemory = 50;
        baseParticles = 7500;
        baseLatency = 120;
        break;
        
      case "Persistance des réglages GPU":
        baseFps = 58;
        baseMemory = 65;
        baseParticles = 12000;
        break;
    }
    
    // Ajouter une variation aléatoire
    const randomizeFps = () => baseFps + (Math.random() - 0.5) * 10;
    const randomizeMemory = () => baseMemory + (Math.random() - 0.3) * 15;
    const randomizeParticles = () => baseParticles + (Math.random() - 0.5) * 2000;
    const randomizeLatency = () => baseLatency + (Math.random() - 0.5) * 30;
    
    // Mettre à jour les métriques périodiquement
    const updateInterval = setInterval(() => {
      setMetrics({
        fps: Math.round(randomizeFps()),
        memoryUsage: Math.round(randomizeMemory() * 10) / 10,
        particleCount: Math.round(randomizeParticles()),
        apiLatency: Math.round(randomizeLatency())
      });
    }, 1000);
    
    // Nettoyer l'intervalle quand le test change
    return () => clearInterval(updateInterval);
  };
  
  // Passer à l'étape suivante
  const handleNext = () => {
    if (!selectedTest) return;
    
    if (activeStep < selectedTest.steps.length) {
      setActiveStep(activeStep + 1);
    } else {
      // Terminer le test
      if (currentResult) {
        const completedResult: TestResult = {
          ...currentResult,
          status: 'completed',
          endTime: new Date(),
          metrics: {
            fps: metrics.fps,
            memoryUsage: metrics.memoryUsage,
            particleCount: metrics.particleCount,
            apiLatency: metrics.apiLatency
          }
        };
        
        // Ajouter aux résultats
        setTestResults(prev => [completedResult, ...prev]);
        setCurrentResult(null);
        setSelectedTest(null);
      }
    }
  };
  
  // Revenir à l'étape précédente
  const handleBack = () => {
    setActiveStep(Math.max(0, activeStep - 1));
  };
  
  // Annuler le test
  const handleCancel = () => {
    if (currentResult) {
      const failedResult: TestResult = {
        ...currentResult,
        status: 'failed',
        endTime: new Date(),
        notes: 'Test annulé par l\'utilisateur'
      };
      
      // Ajouter aux résultats
      setTestResults(prev => [failedResult, ...prev]);
    }
    
    setCurrentResult(null);
    setSelectedTest(null);
    setActiveStep(0);
  };
  
  // Effacer l'historique des résultats
  const handleClearHistory = () => {
    setTestResults([]);
    localStorage.removeItem('weather-test-results');
  };
  
  // Générer une couleur pour le niveau de priorité
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };
  
  // Générer une couleur pour le statut du test
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'info';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // Obtenir une icône pour l'état du test
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'running':
        return '🔄';
      case 'failed':
        return '❌';
      default:
        return '⏳';
    }
  };
  
  return (
    <Box sx={{ mt: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Liste des tests disponibles */}
        <Grid item xs={12} md={selectedTest ? 4 : 12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Tests Météorologiques Disponibles
            </Typography>
            
            <List>
              {weatherTests.map((test, index) => (
                <React.Fragment key={index}>
                  <ListItem
                    button
                    onClick={() => handleSelectTest(test)}
                    disabled={!!selectedTest}
                    selected={selectedTest?.name === test.name}
                  >
                    <ListItemText
                      primary={test.name}
                      secondary={`${test.steps.length} étapes`}
                    />
                    <Chip 
                      label={test.priority}
                      size="small"
                      color={getPriorityColor(test.priority)}
                    />
                  </ListItem>
                  {index < weatherTests.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
          
          {/* Historique des résultats */}
          {!selectedTest && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Historique des Tests
                </Typography>
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showCompleted}
                        onChange={(e) => setShowCompleted(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Afficher les tests réussis"
                  />
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={handleClearHistory} 
                    disabled={testResults.length === 0}
                    sx={{ ml: 1 }}
                  >
                    Effacer
                  </Button>
                </Box>
              </Box>
              
              {testResults.length === 0 ? (
                <Alert severity="info">
                  Aucun test n'a encore été exécuté
                </Alert>
              ) : (
                <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {testResults
                    .filter(result => showCompleted || result.status !== 'completed')
                    .map((result, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <span>{getStatusIcon(result.status)}</span>
                              <Typography sx={{ ml: 1 }}>
                                {result.name}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {result.startTime ? new Date(result.startTime).toLocaleString() : ''}
                              </Typography>
                              {result.metrics && (
                                <Typography variant="caption" display="block">
                                  FPS: {result.metrics.fps} | Mémoire: {result.metrics.memoryUsage}% | Particules: {result.metrics.particleCount.toLocaleString()}
                                </Typography>
                              )}
                              {result.notes && (
                                <Typography variant="caption" display="block">
                                  {result.notes}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <Chip 
                          label={result.status}
                          size="small"
                          color={getStatusColor(result.status)}
                        />
                      </ListItem>
                    ))}
                </List>
              )}
            </Paper>
          )}
        </Grid>
        
        {/* Exécution du test sélectionné */}
        {selectedTest && (
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6">
                Exécution du test: {selectedTest.name}
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Stepper activeStep={activeStep} orientation="vertical">
                  {selectedTest.steps.map((step, index) => (
                    <Step key={index}>
                      <StepLabel>{`Étape ${index + 1}`}</StepLabel>
                      <StepContent>
                        <Typography>{step}</Typography>
                        
                        {/* Métriques en temps réel pour cette étape */}
                        <Card variant="outlined" sx={{ mt: 2, mb: 2 }}>
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom>
                              Métriques en temps réel
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={3}>
                                <Typography variant="caption" color="text.secondary">
                                  FPS
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {metrics.fps}
                                </Typography>
                              </Grid>
                              <Grid item xs={3}>
                                <Typography variant="caption" color="text.secondary">
                                  Mémoire
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {metrics.memoryUsage}%
                                </Typography>
                              </Grid>
                              <Grid item xs={3}>
                                <Typography variant="caption" color="text.secondary">
                                  Particules
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {metrics.particleCount.toLocaleString()}
                                </Typography>
                              </Grid>
                              <Grid item xs={3}>
                                <Typography variant="caption" color="text.secondary">
                                  Latence API
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {metrics.apiLatency}ms
                                </Typography>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                        
                        <Box sx={{ mb: 2 }}>
                          <div>
                            <Button
                              variant="contained"
                              onClick={handleNext}
                              sx={{ mt: 1, mr: 1 }}
                            >
                              {index === selectedTest.steps.length - 1 ? 'Terminer' : 'Suivant'}
                            </Button>
                            <Button
                              disabled={index === 0}
                              onClick={handleBack}
                              sx={{ mt: 1, mr: 1 }}
                            >
                              Précédent
                            </Button>
                            <Button
                              color="error"
                              onClick={handleCancel}
                              sx={{ mt: 1, mr: 1 }}
                            >
                              Annuler
                            </Button>
                          </div>
                        </Box>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
                
                {activeStep === selectedTest.steps.length && (
                  <Paper square elevation={0} sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Résultat attendu:
                    </Typography>
                    <Typography paragraph>
                      {selectedTest.expectedResult}
                    </Typography>
                    
                    <Card variant="outlined" sx={{ mt: 2, mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle2" gutterBottom>
                          Métriques finales
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={3}>
                            <Typography variant="caption" color="text.secondary">
                              FPS
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {metrics.fps}
                            </Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography variant="caption" color="text.secondary">
                              Mémoire
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {metrics.memoryUsage}%
                            </Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography variant="caption" color="text.secondary">
                              Particules
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {metrics.particleCount.toLocaleString()}
                            </Typography>
                          </Grid>
                          <Grid item xs={3}>
                            <Typography variant="caption" color="text.secondary">
                              Latence API
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {metrics.apiLatency}ms
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                    
                    <Button 
                      onClick={handleNext} 
                      variant="contained"
                      color="success"
                      sx={{ mr: 1 }}
                    >
                      Marquer comme réussi
                    </Button>
                    <Button 
                      onClick={handleCancel}
                      color="error"
                    >
                      Marquer comme échoué
                    </Button>
                  </Paper>
                )}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default WeatherTestRunner;
