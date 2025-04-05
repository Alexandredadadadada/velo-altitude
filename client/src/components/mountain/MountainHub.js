import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Tabs, Tab, Box, CircularProgress } from '@mui/material';
import { useFeatureFlags } from '../../services/featureFlags';
import { useTheme } from '@mui/material/styles';
import TerrainIcon from '@mui/icons-material/Terrain';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ExploreIcon from '@mui/icons-material/Explore';
import ColSpecificTraining from './components/ColSpecificTraining';
import ColSpecificNutrition from './components/ColSpecificNutrition';
import RegionalTrainingPlans from './components/RegionalTrainingPlans';
import MountainDashboard from './components/MountainDashboard';

/**
 * MountainHub - Composant principal pour le module Montagne
 * Regroupe les fonctionnalités liées à la préparation spécifique pour les cols européens
 */
function MountainHub() {
  const theme = useTheme();
  const { isEnabled } = useFeatureFlags();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('alpes');
  const [selectedCol, setSelectedCol] = useState(null);

  // Vérifier si le module Montagne est activé
  const mountainModuleEnabled = isEnabled('enableMountainModule');
  const colSpecificTrainingEnabled = isEnabled('enableColSpecificTraining');
  const colSpecificNutritionEnabled = isEnabled('enableColSpecificNutrition');
  const regionalTrainingPlansEnabled = isEnabled('enableRegionalTrainingPlans');

  useEffect(() => {
    // Simuler un chargement initial
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRegionChange = (region) => {
    setSelectedRegion(region);
  };

  const handleColSelect = (col) => {
    setSelectedCol(col);
  };

  if (!mountainModuleEnabled) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="text.secondary">
            Le module Montagne est actuellement désactivé.
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Chargement du module Montagne...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          background: `linear-gradient(120deg, ${theme.palette.primary.main}22, ${theme.palette.secondary.main}22)`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <TerrainIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
          </Grid>
          <Grid item xs>
            <Typography variant="h4" component="h1" gutterBottom>
              Module Montagne
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Préparation spécifique pour les cols européens - Entraînements et nutrition adaptés
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        variant="fullWidth" 
        indicatorColor="primary"
        textColor="primary"
        aria-label="mountain module tabs"
        sx={{ mb: 3 }}
      >
        <Tab icon={<ExploreIcon />} label="Dashboard" />
        {colSpecificTrainingEnabled && <Tab icon={<FitnessCenterIcon />} label="Entraînement" />}
        {colSpecificNutritionEnabled && <Tab icon={<RestaurantIcon />} label="Nutrition" />}
        {regionalTrainingPlansEnabled && <Tab icon={<TerrainIcon />} label="Plans Régionaux" />}
      </Tabs>

      <Box role="tabpanel" hidden={activeTab !== 0}>
        {activeTab === 0 && (
          <MountainDashboard 
            onRegionChange={handleRegionChange}
            onColSelect={handleColSelect}
            selectedRegion={selectedRegion}
            selectedCol={selectedCol}
          />
        )}
      </Box>

      <Box role="tabpanel" hidden={activeTab !== 1}>
        {activeTab === 1 && colSpecificTrainingEnabled && (
          <ColSpecificTraining 
            selectedRegion={selectedRegion}
            selectedCol={selectedCol}
          />
        )}
      </Box>

      <Box role="tabpanel" hidden={activeTab !== 2}>
        {activeTab === 2 && colSpecificNutritionEnabled && (
          <ColSpecificNutrition 
            selectedRegion={selectedRegion}
            selectedCol={selectedCol}
          />
        )}
      </Box>

      <Box role="tabpanel" hidden={activeTab !== 3}>
        {activeTab === 3 && regionalTrainingPlansEnabled && (
          <RegionalTrainingPlans 
            selectedRegion={selectedRegion}
          />
        )}
      </Box>
    </Container>
  );
}

export default MountainHub;
