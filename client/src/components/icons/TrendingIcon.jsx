import React from 'react';
import { SvgIcon } from '@mui/material';

/**
 * Composant d'icône personnalisé "Trending"
 * Créé pour remplacer l'icône manquante dans Material UI
 * 
 * @param {Object} props - Propriétés du composant
 * @returns {JSX.Element} - Composant icône SVG
 */
const TrendingIcon = (props) => {
  return (
    <SvgIcon {...props}>
      {/* Combinaison de TrendingUp avec une visualisation de données */}
      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z" />
      <path d="M6 18h2v2H6zm4 0h2v2h-2zm4 0h2v2h-2z" />
    </SvgIcon>
  );
};

export default TrendingIcon;
