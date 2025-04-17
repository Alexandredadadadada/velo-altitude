import React from 'react';
import { Chip } from '@mui/material';

/**
 * AdaptiveQualityFlag
 * - Chip pour activer/désactiver l'ajustement automatique de la qualité ou le mode éco
 */
const AdaptiveQualityFlag = ({ active, onClick, children }) => (
  <Chip
    label={children}
    color={active ? 'success' : 'default'}
    variant={active ? 'filled' : 'outlined'}
    onClick={onClick}
    sx={{ m: 0.5, fontWeight: active ? 'bold' : 'normal', cursor: 'pointer' }}
  />
);

export default AdaptiveQualityFlag;
