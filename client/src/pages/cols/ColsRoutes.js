import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

// Chargement paresseux des composants pour optimiser les performances
const ColsExplorer = lazy(() => import('../ColsExplorer'));
const ColsComparisonPage = lazy(() => import('../ColsComparisonPage'));
const ColDetail = lazy(() => import('../../components/cols/ColDetail'));
const SevenMajorsChallenge = lazy(() => import('../../components/challenges/SevenMajorsChallenge'));

// Composant de chargement
const LoadingComponent = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 4, minHeight: '50vh' }}>
    <CircularProgress size={40} />
    <Typography variant="body1" sx={{ mt: 2 }}>
      Chargement des données des cols...
    </Typography>
  </Box>
);

/**
 * Configuration des routes pour la section des cols
 */
const ColsRoutes = () => {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <Routes>
        <Route path="/" element={<ColsExplorer />} />
        <Route path="/compare" element={<ColsComparisonPage />} />
        <Route path="/detail/:colId" element={<ColDetail standalone={true} />} />
        <Route path="/seven-majors/*" element={<SevenMajorsChallenge />} />
        <Route path="*" element={<Navigate to="/cols" replace />} />
      </Routes>
    </Suspense>
  );
};

export default ColsRoutes;
