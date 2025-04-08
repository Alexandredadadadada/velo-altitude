/**
 * Composant de test pour vérifier la fonctionnalité de optimizedDataService refactorisé
 * Ce composant appelle directement les méthodes du service pour tester leur fonctionnement
 */
import React, { useState, useEffect } from 'react';
import optimizedDataService from '../../services/optimizedDataService';
import { Box, Typography, CircularProgress, Alert, Paper, Grid, Divider, Button } from '@mui/material';

const OptimizedServiceTest = () => {
  const [loading, setLoading] = useState({
    cols: false,
    training: false,
    nutrition: false,
    user: false
  });
  const [data, setData] = useState({
    cols: null,
    training: null,
    nutrition: null,
    user: null
  });
  const [errors, setErrors] = useState({
    cols: null,
    training: null,
    nutrition: null,
    user: null
  });

  // Fonction pour tester getColData
  const testColData = async () => {
    setLoading(prev => ({ ...prev, cols: true }));
    setErrors(prev => ({ ...prev, cols: null }));
    
    try {
      const colData = await optimizedDataService.getColData(null, {
        fields: ['id', 'name', 'location', 'elevation'],
        language: 'fr'
      });
      
      console.log('Cols data:', colData);
      setData(prev => ({ ...prev, cols: colData }));
    } catch (error) {
      console.error('Error testing col data:', error);
      setErrors(prev => ({ ...prev, cols: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, cols: false }));
    }
  };

  // Fonction pour tester getTrainingPrograms
  const testTrainingPrograms = async () => {
    setLoading(prev => ({ ...prev, training: true }));
    setErrors(prev => ({ ...prev, training: null }));
    
    try {
      const programs = await optimizedDataService.getTrainingPrograms({
        page: 1,
        pageSize: 5,
        level: 'intermediate'
      });
      
      console.log('Training programs:', programs);
      setData(prev => ({ ...prev, training: programs }));
    } catch (error) {
      console.error('Error testing training programs:', error);
      setErrors(prev => ({ ...prev, training: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, training: false }));
    }
  };

  // Fonction pour tester getNutritionRecipes
  const testNutritionRecipes = async () => {
    setLoading(prev => ({ ...prev, nutrition: true }));
    setErrors(prev => ({ ...prev, nutrition: null }));
    
    try {
      const recipes = await optimizedDataService.getNutritionRecipes({
        page: 1,
        pageSize: 5,
        category: 'recovery'
      });
      
      console.log('Nutrition recipes:', recipes);
      setData(prev => ({ ...prev, nutrition: recipes }));
    } catch (error) {
      console.error('Error testing nutrition recipes:', error);
      setErrors(prev => ({ ...prev, nutrition: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, nutrition: false }));
    }
  };

  // Fonction pour tester getUserProfile
  const testUserProfile = async () => {
    setLoading(prev => ({ ...prev, user: true }));
    setErrors(prev => ({ ...prev, user: null }));
    
    try {
      const userId = 'current'; // Ou un ID valide selon votre API
      const profile = await optimizedDataService.getUserProfile(userId);
      
      console.log('User profile:', profile);
      setData(prev => ({ ...prev, user: profile }));
    } catch (error) {
      console.error('Error testing user profile:', error);
      setErrors(prev => ({ ...prev, user: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, user: false }));
    }
  };

  // Afficher les résultats des tests ou les erreurs
  const renderResults = (section) => {
    if (loading[section]) {
      return <CircularProgress size={24} />;
    }
    
    if (errors[section]) {
      return <Alert severity="error">{errors[section]}</Alert>;
    }
    
    if (data[section]) {
      return (
        <Box sx={{ maxHeight: 300, overflow: 'auto', padding: 2 }}>
          <pre>{JSON.stringify(data[section], null, 2)}</pre>
        </Box>
      );
    }
    
    return <Typography variant="body2" color="text.secondary">Cliquez sur Tester pour vérifier ce service</Typography>;
  };

  return (
    <Paper elevation={3} sx={{ padding: 3, margin: 2 }}>
      <Typography variant="h4" gutterBottom>
        Test du Service Optimized Data
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 3 }}>
        Ce composant teste la version refactorisée de optimizedDataService qui utilise directement RealApiOrchestrator
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Données des Cols</Typography>
              <Button 
                variant="contained" 
                onClick={testColData}
                disabled={loading.cols}
              >
                Tester
              </Button>
            </Box>
            <Divider sx={{ my: 2 }} />
            {renderResults('cols')}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Programmes d'Entraînement</Typography>
              <Button 
                variant="contained" 
                onClick={testTrainingPrograms}
                disabled={loading.training}
              >
                Tester
              </Button>
            </Box>
            <Divider sx={{ my: 2 }} />
            {renderResults('training')}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Recettes Nutritionnelles</Typography>
              <Button 
                variant="contained" 
                onClick={testNutritionRecipes}
                disabled={loading.nutrition}
              >
                Tester
              </Button>
            </Box>
            <Divider sx={{ my: 2 }} />
            {renderResults('nutrition')}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Profil Utilisateur</Typography>
              <Button 
                variant="contained" 
                onClick={testUserProfile}
                disabled={loading.user}
              >
                Tester
              </Button>
            </Box>
            <Divider sx={{ my: 2 }} />
            {renderResults('user')}
          </Paper>
        </Grid>
      </Grid>
      
      <Alert severity="info" sx={{ mt: 3 }}>
        Note: Consultez la console du navigateur pour des logs plus détaillés des réponses et d'éventuelles erreurs.
      </Alert>
    </Paper>
  );
};

export default OptimizedServiceTest;
