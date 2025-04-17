import React from 'react';
import { Box } from '@mui/material';

/**
 * TrailInfoItem
 * - Élément d'info de sentier, centré
 */
const TrailInfoItem = ({ children }) => (
  <Box sx={{ flex: 1, textAlign: 'center' }}>
    {children}
  </Box>
);

export default TrailInfoItem;
