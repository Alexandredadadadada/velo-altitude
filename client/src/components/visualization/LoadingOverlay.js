import React from 'react';
import { Box } from '@mui/material';

/**
 * LoadingOverlay
 * - Overlay semi-transparent pour afficher un indicateur de chargement
 */
const LoadingOverlay = ({ children }) => (
  <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', bgcolor: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
    {children}
  </Box>
);

export default LoadingOverlay;
