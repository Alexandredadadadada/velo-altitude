import React from 'react';
import { Box, Paper } from '@mui/material';

/**
 * OverlayContainer
 * - Conteneur d'UI pour les overlays flottants sur la visualisation 3D
 */
const OverlayContainer = ({ children }) => (
  <Paper elevation={3} sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10, minWidth: 280, maxWidth: 380, maxHeight: '90vh', overflow: 'auto', p: 2 }}>
    <Box>
      {children}
    </Box>
  </Paper>
);

export default OverlayContainer;
