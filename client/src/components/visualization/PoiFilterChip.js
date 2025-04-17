import React from 'react';
import { Chip } from '@mui/material';

/**
 * PoiFilterChip
 * - Chip interactif pour filtrer les POIs par type
 */
const PoiFilterChip = ({ active, onClick, children }) => (
  <Chip
    label={children}
    color={active ? 'primary' : 'default'}
    variant={active ? 'filled' : 'outlined'}
    onClick={onClick}
    sx={{ m: 0.5, fontWeight: active ? 'bold' : 'normal' }}
  />
);

export default PoiFilterChip;
