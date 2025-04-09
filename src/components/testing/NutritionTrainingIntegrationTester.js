import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Grid,
  Divider,
  Card,
  CardContent,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Tab,
  Tabs
} from '@mui/material';
import {
  ExpandMore,
  Sync,
  CheckCircleOutline,
  ErrorOutline,
  Warning,
  PlayArrow,
  Stop,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import trainingNutritionSync from '../../services/orchestration/TrainingNutritionSync';
import dataValidator from '../../services/orchestration/DataValidator';
import stateManager from '../../services/orchestration/StateManager';
import { useNutritionTraining } from '../../hooks/useNutritionTraining';

/**
 * Composant pour tester l'intégration entre Nutrition et Entraînement
 * Permet de valider les services et hooks développés
 */
const NutritionTrainingIntegrationTester = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [testResults, setTestResults] = useState([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [stateSnapshot, setStateSnapshot] = useState(null);
  const [showJson, setShowJson] = useState(false);
  const [jsonContent, setJsonContent] = useState('');
  const [testConfig, setTestConfig] = useState({
    mockDataEnabled: true,
    testValidation: true,
    testSync: true,
    testStateManagement: true,
    testHook: true
  });

  // Instance du hook pour les tests d'intégration
  const nutritionTraining = useNutritionTraining(
    user?.id || 'test-user-id',
    { autoLoad: false }
  );

  // Observer les changements d'état du StateManager
  useEffect(() => {
    const nutritionSub = stateManager.nutritionState.subscribe(state => {
      if (state) {
        updateStateSnapshot();
      }
    });

    const trainingSub = stateManager.trainingState.subscribe(state => {
      if (state) {
        updateStateSnapshot();
      }
    });

    const syncSub = stateManager.syncState.subscribe(state => {
      if (state) {
        updateStateSnapshot();
      }
    });

    // Initialisation du snapshot d'état
    updateStateSnapshot();

    return () => {
      nutritionSub.unsubscribe();
      trainingSub.unsubscribe();
      syncSub.unsubscribe();
    };
  }, []);

  // Mise à jour du snapshot d'état
  const updateStateSnapshot = () => {
    setStateSnapshot({
      nutrition: stateManager.getNutritionState(),
      training: stateManager.getTrainingState(),
      sync: stateManager.getSyncState(),
      activeModules: stateManager.getActiveModules()
    });
  };

  // Gestion des changements de configuration de test
  const handleConfigChange = (key) => (event) => {
    setTestConfig({
      ...testConfig,
      [key]: event.target.checked
    });
  };

  // Exécution de tous les tests
  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    stateManager.resetAllStates();

    try {
      addTestResult('info', 'Démarrage des tests d\'intégration Nutrition-Entraînement');

      // Création de données fictives pour les tests
      const mockTrainingData = createMockTrainingData();
      const mockNutritionData = createMockNutritionData();

      // Mise à jour des états
      stateManager.updateTrainingState(mockTrainingData);
      stateManager.updateNutritionState(mockNutritionData);
      updateStateSnapshot();

      addTestResult('success', 'Données de test générées et états mis à jour');

      // Test du validateur de données
      if (testConfig.testValidation) {
        await testDataValidator(mockNutritionData, mockTrainingData);
      }

      // Test du service de synchronisation
      if (testConfig.testSync) {
        await testSyncService(mockTrainingData);
      }

      // Test du gestionnaire d'état
      if (testConfig.testStateManagement) {
        await testStateManager();
      }

      // Test du hook personnalisé
      if (testConfig.testHook) {
        await testCustomHook();
      }

      addTestResult('success', 'Tous les tests ont été complétés avec succès');
    } catch (error) {
      addTestResult('error', `Erreur lors de l'exécution des tests: ${error.message}`);
      console.error("Erreur de test:", error);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Test du validateur de données
  const testDataValidator = async (nutritionData, trainingData) => {
    addTestResult('info', 'Test du validateur de données...');

    try {
      // Validation du profil nutritionnel
      const nutritionValidation = dataValidator.validateNutritionProfile(nutritionData);
      addTestResult(
        nutritionValidation.isValid ? 'success' : 'warning',
        `Validation du profil nutritionnel: ${nutritionValidation.isValid ? 'Réussie' : 'Problèmes détectés'}`,
        nutritionValidation
      );

      // Validation du plan d'entraînement
      const trainingValidation = dataValidator.validateTrainingPlan(trainingData);
      addTestResult(
        trainingValidation.isValid ? 'success' : 'warning',
        `Validation du plan d'entraînement: ${trainingValidation.isValid ? 'Réussie' : 'Problèmes détectés'}`,
        trainingValidation
      );

      // Validation de la compatibilité
      const compatibilityValidation = dataValidator.validateCompatibility(nutritionData, trainingData);
      setValidationResult(compatibilityValidation);
      addTestResult(
        compatibilityValidation.isCompatible ? 'success' : 'warning',
        `Validation de compatibilité: ${compatibilityValidation.isCompatible ? 'Compatible' : 'Problèmes de compatibilité'}`,
        compatibilityValidation
      );

      return compatibilityValidation;
    } catch (error) {
      addTestResult('error', `Erreur du validateur: ${error.message}`);
      throw error;
    }
  };

  // Test du service de synchronisation
  const testSyncService = async (trainingData) => {
    addTestResult('info', 'Test du service de synchronisation...');

    try {
      stateManager.beginSync();
      addTestResult('info', 'État de synchronisation: En cours');

      // Appel du service de synchronisation
      const result = await trainingNutritionSync.updateNutritionPlan(trainingData);
      setSyncResult(result);

      stateManager.syncSuccess(result);
      addTestResult('success', 'Synchronisation réussie', result);

      return result;
    } catch (error) {
      stateManager.syncError(error);
      addTestResult('error', `Erreur de synchronisation: ${error.message}`);
      throw error;
    }
  };

  // Test du gestionnaire d'état
  const testStateManager = async () => {
    addTestResult('info', 'Test du gestionnaire d\'état...');

    try {
      // Test de l'activation des modules
      stateManager.setModuleActive('nutrition', true);
      stateManager.setModuleActive('training', true);
      stateManager.setModuleActive('cols', false);

      const activeModules = stateManager.getActiveModules();
      const bothActive = stateManager.areBothModulesActive();

      addTestResult(
        activeModules.includes('nutrition') && activeModules.includes('training') ? 'success' : 'error',
        `Activation des modules: ${activeModules.join(', ')}`,
        { activeModules, bothActive }
      );

      // Vérification que les deux modules requis sont actifs
      if (!bothActive) {
        throw new Error('Les modules Nutrition et Entraînement devraient être actifs');
      }

      // Mise à jour du snapshot d'état
      updateStateSnapshot();
      addTestResult('success', 'Test du gestionnaire d\'état réussi');

      return stateSnapshot;
    } catch (error) {
      addTestResult('error', `Erreur du gestionnaire d\'état: ${error.message}`);
      throw error;
    }
  };

  // Test du hook personnalisé
  const testCustomHook = async () => {
    addTestResult('info', 'Test du hook personnalisé useNutritionTraining...');

    try {
      // Simuler le chargement des données
      nutritionTraining.setMockMode(true);
      await nutritionTraining.loadData();

      addTestResult(
        nutritionTraining.nutritionData && nutritionTraining.trainingData ? 'success' : 'error',
        'Chargement des données via le hook',
        {
          nutritionDataLoaded: !!nutritionTraining.nutritionData,
          trainingDataLoaded: !!nutritionTraining.trainingData
        }
      );

      // Tester l'analyse de la distribution nutritionnelle
      const distribution = nutritionTraining.analyzeNutritionDistribution();
      addTestResult(
        distribution ? 'success' : 'warning',
        'Analyse de la distribution nutritionnelle',
        distribution
      );

      // Tester la génération de recommandations
      await nutritionTraining.generateRecommendations();
      addTestResult(
        nutritionTraining.recommendations.length > 0 ? 'success' : 'warning',
        `${nutritionTraining.recommendations.length} recommandations générées`,
        { recommendations: nutritionTraining.recommendations }
      );

      addTestResult('success', 'Test du hook personnalisé réussi');
      return nutritionTraining;
    } catch (error) {
      addTestResult('error', `Erreur dans le hook: ${error.message}`);
      throw error;
    }
  };

  // Ajout d'un résultat de test
  const addTestResult = (type, message, data = null) => {
    const result = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date().toLocaleTimeString(),
      data
    };

    setTestResults(prev => [...prev, result]);

    // Si des données sont fournies, les afficher en JSON
    if (data && showJson) {
      setJsonContent(JSON.stringify(data, null, 2));
    }

    console.log(`[Test ${type}]`, message, data || '');
  };

  // Création de données d'entraînement fictives
  const createMockTrainingData = () => {
    return {
      userId: user?.id || 'test-user-id',
      goal: 'performance',
      weeklyLoad: 450,
      weeklyVolume: 12,
      recoveryScore: 78,
      fatigueLevel: 6,
      upcomingWorkouts: [
        {
          id: 'workout-1',
          name: 'Intervalles VO2max',
          type: 'vo2max',
          scheduledDate: '2023-07-15',
          duration: 90,
          intensity: 9,
          tss: 120
        },
        {
          id: 'workout-2',
          name: 'Sortie longue Z2',
          type: 'endurance',
          scheduledDate: '2023-07-16',
          duration: 180,
          intensity: 5,
          tss: 150
        }
      ],
      lastWorkout: {
        id: 'last-workout',
        name: 'Seuil lactique',
        type: 'threshold',
        completedDate: '2023-07-12',
        duration: 75,
        tss: 90,
        powerData: {
          avgPower: 250,
          normalizedPower: 265,
          maxPower: 350
        }
      }
    };
  };

  // Création de données nutritionnelles fictives
  const createMockNutritionData = () => {
    return {
      userId: user?.id || 'test-user-id',
      dailyCalories: 2800,
      goals: {
        type: 'performance',
        targetWeight: null,
        weeklyChange: null
      },
      macroDistribution: {
        carbs: 55,
        protein: 25,
        fat: 20
      },
      metrics: {
        weight: 70,
        height: 178,
        age: 35,
        gender: 'male',
        activityLevel: 'very_active'
      },
      mealPlan: {
        breakfast: {
          calories: 600,
          items: [
            { name: 'Avoine', quantity: '80g', calories: 300 },
            { name: 'Banane', quantity: '1', calories: 100 },
            { name: 'Yaourt grec', quantity: '150g', calories: 150 },
            { name: 'Miel', quantity: '10g', calories: 30 },
            { name: 'Amandes', quantity: '10g', calories: 60 }
          ]
        },
        lunch: {
          calories: 800,
          items: [
            { name: 'Poulet grillé', quantity: '150g', calories: 250 },
            { name: 'Riz brun', quantity: '100g', calories: 350 },
            { name: 'Légumes', quantity: '200g', calories: 100 },
            { name: 'Huile d\'olive', quantity: '10g', calories: 90 }
          ]
        },
        dinner: {
          calories: 700,
          items: [
            { name: 'Saumon', quantity: '150g', calories: 300 },
            { name: 'Patate douce', quantity: '200g', calories: 200 },
            { name: 'Salade', quantity: '100g', calories: 30 },
            { name: 'Vinaigrette', quantity: '15g', calories: 70 },
            { name: 'Graines de chia', quantity: '15g', calories: 100 }
          ]
        },
        snacks: {
          calories: 700,
          items: [
            { name: 'Fruit', quantity: '2', calories: 180 },
            { name: 'Barre protéinée', quantity: '1', calories: 250 },
            { name: 'Fromage blanc', quantity: '150g', calories: 180 },
            { name: 'Chocolat noir', quantity: '20g', calories: 100 }
          ]
        }
      }
    };
  };

  // Affichage du résultat JSON
  const handleShowJson = (data) => {
    setJsonContent(JSON.stringify(data, null, 2));
    setShowJson(true);
  };

  // Changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Rendu des résultats de test
  const renderTestResults = () => {
    if (testResults.length === 0) {
      return (
        <Alert severity="info">
          Aucun test n'a encore été exécuté. Cliquez sur "Exécuter les tests" pour commencer.
        </Alert>
      );
    }

    return (
      <Box>
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {testResults.map((result) => (
            <ListItem
              key={result.id}
              sx={{
                mb: 1,
                borderLeft: 4,
                borderColor: 
                  result.type === 'success' ? 'success.main' : 
                  result.type === 'error' ? 'error.main' : 
                  result.type === 'warning' ? 'warning.main' : 'info.main',
                bgcolor: 'background.paper'
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {result.type === 'success' && <CheckCircleOutline color="success" sx={{ mr: 1 }} />}
                    {result.type === 'error' && <ErrorOutline color="error" sx={{ mr: 1 }} />}
                    {result.type === 'warning' && <Warning color="warning" sx={{ mr: 1 }} />}
                    {result.type === 'info' && <Refresh color="info" sx={{ mr: 1 }} />}
                    <Typography variant="subtitle1">{result.message}</Typography>
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {result.timestamp}
                  </Typography>
                }
              />
              {result.data && (
                <Button size="small" onClick={() => handleShowJson(result.data)}>
                  Détails
                </Button>
              )}
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  // Rendu des résultats de validation
  const renderValidationResult = () => {
    if (!validationResult) {
      return (
        <Alert severity="info">
          Aucun résultat de validation disponible. Exécutez les tests pour voir les résultats.
        </Alert>
      );
    }

    const { isCompatible, issues, suggestions } = validationResult;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Résultats de validation
          </Typography>
          <Alert severity={isCompatible ? "success" : "warning"} sx={{ mb: 2 }}>
            {isCompatible 
              ? "Les données nutritionnelles et d'entraînement sont compatibles" 
              : "Des problèmes de compatibilité ont été détectés"}
          </Alert>

          {issues && issues.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Problèmes détectés:</Typography>
              <List dense disablePadding>
                {issues.map((issue, idx) => (
                  <ListItem key={`issue-${idx}`}>
                    <ListItemText primary={issue} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {suggestions && suggestions.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>Suggestions:</Typography>
              <List dense disablePadding>
                {suggestions.map((suggestion, idx) => (
                  <ListItem key={`suggestion-${idx}`}>
                    <ListItemText primary={suggestion} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <Button 
            size="small" 
            variant="outlined" 
            onClick={() => handleShowJson(validationResult)}
            sx={{ mt: 2 }}
          >
            Voir JSON complet
          </Button>
        </CardContent>
      </Card>
    );
  };

  // Rendu du résultat de synchronisation
  const renderSyncResult = () => {
    if (!syncResult) {
      return (
        <Alert severity="info">
          Aucun résultat de synchronisation disponible. Exécutez les tests pour voir les résultats.
        </Alert>
      );
    }

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Résultats de synchronisation
          </Typography>
          <Alert severity="success" sx={{ mb: 2 }}>
            Synchronisation réussie entre les données d'entraînement et nutritionnelles
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Détails de synchronisation:</Typography>
              <List dense>
                {syncResult.syncDetails && Object.entries(syncResult.syncDetails).map(([key, value]) => (
                  <ListItem key={key}>
                    <ListItemText 
                      primary={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')} 
                      secondary={typeof value === 'object' ? JSON.stringify(value) : value} 
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Modifications appliquées:</Typography>
              {syncResult.changes && syncResult.changes.map((change, idx) => (
                <Alert key={idx} severity="info" sx={{ mb: 1 }}>
                  {change}
                </Alert>
              ))}
            </Grid>
          </Grid>

          <Button 
            size="small" 
            variant="outlined" 
            onClick={() => handleShowJson(syncResult)}
            sx={{ mt: 2 }}
          >
            Voir JSON complet
          </Button>
        </CardContent>
      </Card>
    );
  };

  // Rendu de l'état actuel
  const renderStateSnapshot = () => {
    if (!stateSnapshot) {
      return (
        <Alert severity="info">
          Aucun état disponible. Exécutez les tests pour voir l'état courant.
        </Alert>
      );
    }

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            État courant
          </Typography>
          
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>Modules Actifs</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {stateSnapshot.activeModules.map((module) => (
                  <Alert key={module} severity="success" icon={<CheckCircleOutline />} sx={{ mb: 1 }}>
                    {module}
                  </Alert>
                ))}
                {stateSnapshot.activeModules.length === 0 && (
                  <Alert severity="info">Aucun module actif</Alert>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography>État de synchronisation</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Alert 
                severity={
                  stateSnapshot.sync.status === 'success' ? 'success' : 
                  stateSnapshot.sync.status === 'error' ? 'error' : 
                  stateSnapshot.sync.status === 'syncing' ? 'info' :
                  'warning'
                }
              >
                Status: {stateSnapshot.sync.status}
              </Alert>
              {stateSnapshot.sync.lastSynced && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Dernière synchronisation: {new Date(stateSnapshot.sync.lastSynced).toLocaleString()}
                </Typography>
              )}
              {stateSnapshot.sync.error && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  Erreur: {stateSnapshot.sync.error}
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>

          <Button 
            size="small" 
            variant="outlined" 
            onClick={() => handleShowJson(stateSnapshot)}
            sx={{ mt: 2 }}
          >
            Voir JSON complet
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">Testeur d'Intégration Nutrition & Entraînement</Typography>
          <Button
            variant="contained"
            startIcon={isRunningTests ? <Stop /> : <PlayArrow />}
            onClick={runAllTests}
            disabled={isRunningTests}
            color={isRunningTests ? "error" : "primary"}
          >
            {isRunningTests ? 'Tests en cours...' : 'Exécuter les tests'}
          </Button>
        </Box>

        <Typography variant="body1" paragraph>
          Cet outil permet de tester l'intégration entre les modules Nutrition et Entraînement, 
          en validant le fonctionnement des services d'orchestration et des hooks développés.
        </Typography>

        {isRunningTests && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress />
          </Box>
        )}

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Résultats des tests" />
          <Tab label="Validation" />
          <Tab label="Synchronisation" />
          <Tab label="État" />
          {showJson && <Tab label="JSON" />}
        </Tabs>

        {activeTab === 0 && renderTestResults()}
        {activeTab === 1 && renderValidationResult()}
        {activeTab === 2 && renderSyncResult()}
        {activeTab === 3 && renderStateSnapshot()}
        
        {showJson && activeTab === 4 && (
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Données JSON</Typography>
                <TextField
                  multiline
                  fullWidth
                  minRows={10}
                  maxRows={20}
                  variant="outlined"
                  value={jsonContent}
                  InputProps={{
                    readOnly: true,
                    style: { fontFamily: 'monospace', fontSize: '0.85rem' }
                  }}
                />
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => setShowJson(false)}
                  sx={{ mt: 2 }}
                >
                  Fermer JSON
                </Button>
              </CardContent>
            </Card>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default NutritionTrainingIntegrationTester;
