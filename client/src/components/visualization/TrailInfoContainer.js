import React from 'react';
import { Box } from '@mui/material';

/**
 * TrailInfoContainer
 * - Conteneur horizontal pour les infos de sentier (difficulté, distance, dénivelé)
 */
const TrailInfoContainer = ({ children }) => (
  <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, mt: 2, mb: 1 }}>
    {children}
  </Box>
);

export default TrailInfoContainer;
