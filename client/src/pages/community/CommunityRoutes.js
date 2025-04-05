import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

// Chargement paresseux des composants pour optimiser les performances
const CommunityDashboard = lazy(() => import('../CommunityDashboard'));
const CommunityStatsPage = lazy(() => import('./CommunityStatsPage'));
const EventsSection = lazy(() => import('./EventsSection'));
const ChallengesSection = lazy(() => import('./ChallengesSection'));
const RegionSection = lazy(() => import('./RegionSection'));

// Composant de chargement
const LoadingComponent = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
    <CircularProgress />
    <Typography variant="body2" sx={{ ml: 2 }}>
      Chargement en cours...
    </Typography>
  </Box>
);

/**
 * Configuration des routes pour la section communauté
 */
const CommunityRoutes = () => {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <Routes>
        <Route path="/" element={<CommunityDashboard />} />
        <Route path="/stats" element={<CommunityStatsPage />} />
        <Route path="/events/*" element={<EventsSection />} />
        <Route path="/challenges/*" element={<ChallengesSection />} />
        <Route path="/region/*" element={<RegionSection />} />
        <Route path="*" element={<Navigate to="/community" replace />} />
      </Routes>
    </Suspense>
  );
};

export default CommunityRoutes;
