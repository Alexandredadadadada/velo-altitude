import React from 'react';
import { SvgIcon } from '@mui/material';

/**
 * Composant d'icône personnalisé "TrendingDown"
 * Créé pour remplacer l'icône manquante dans Material UI
 * 
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element} - Composant icône SVG
 */
const TrendingDownIcon = (props) => {
  return (
    <SvgIcon {...props}>
      <path d="M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z" />
    </SvgIcon>
  );
};

export default TrendingDownIcon;
