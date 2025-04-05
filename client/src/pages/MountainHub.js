import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Container, Typography, Box, Paper } from '@mui/material';
import LoadingFallback from '../components/common/LoadingFallback';
import { useFeatureFlags } from '../hooks/useFeatureFlags';

// Lazy loading des composants du module Montagne
const MountainDashboard = lazy(() => import('../components/mountain/components/MountainDashboard'));
const ColSpecificTraining = lazy(() => import('../components/mountain/components/ColSpecificTraining'));
const ColSpecificNutrition = lazy(() => import('../components/mountain/components/ColSpecificNutrition'));
const RegionalTrainingPlans = lazy(() => import('../components/mountain/components/RegionalTrainingPlans'));

/**
 * Page principale pour le module Montagne
 * Gère les sous-routes et l'affichage des différents composants
 */
function MountainHub() {
  const { enableMountainModule } = useFeatureFlags();

  // Si le module n'est pas activé, afficher un message
  if (!enableMountainModule) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Module Montagne
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Ce module est actuellement désactivé. Veuillez contacter l'administrateur pour plus d'informations.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Suspense fallback={<LoadingFallback type="content" />}>
        <Routes>
          <Route index element={<Navigate to="/mountain/dashboard" replace />} />
          <Route path="dashboard" element={<MountainDashboard />} />
          <Route path="training" element={<ColSpecificTraining />} />
          <Route path="nutrition" element={<ColSpecificNutrition />} />
          <Route path="regional" element={<RegionalTrainingPlans selectedRegion="alpes" />} />
          <Route path="regional/:region" element={
            <RegionalTrainingPlanWithParams />
          } />
          <Route path="*" element={<Navigate to="/mountain/dashboard" replace />} />
        </Routes>
      </Suspense>
    </Container>
  );
}

// Composant d'adaptation pour passer les paramètres d'URL à RegionalTrainingPlans
function RegionalTrainingPlanWithParams() {
  const { region } = useParams();
  return <RegionalTrainingPlans selectedRegion={region || 'alpes'} />;
}

export default MountainHub;
