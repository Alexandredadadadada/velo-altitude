import React from 'react';
import { SvgIcon } from '@mui/material';

/**
 * Composant d'icône personnalisé "TrendingFlat"
 * Créé pour remplacer l'icône manquante dans Material UI
 * 
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element} - Composant icône SVG
 */
const TrendingFlatIcon = (props) => {
  return (
    <SvgIcon {...props}>
      <path d="M22 12l-4-4v3H3v2h15v3z" />
    </SvgIcon>
  );
};

export default TrendingFlatIcon;
