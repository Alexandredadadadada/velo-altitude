/**
 * HOC pour faciliter la migration des composants utilisant des styles CSS legacy
 * vers le design system de Velo-Altitude
 */
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { migrateStylesToDesignSystem } from '../utils/styleUtils';
import theme from '../design-system/theme';

/**
 * HOC qui enveloppe un composant avec le ThemeProvider et migre les styles inline
 * @param {React.ComponentType} Component - Composant à envelopper
 * @returns {React.FC} - Composant enveloppé avec les styles migrés
 */
const withDesignSystemStyles = (Component) => {
  const WithDesignSystemStyles = (props) => {
    // Si des styles inline sont fournis, les migrer vers le design system
    const migratedProps = { ...props };
    
    if (migratedProps.style) {
      migratedProps.style = migrateStylesToDesignSystem(migratedProps.style);
    }
    
    // Si des classes CSS sont utilisées, nous les laissons intactes pour le moment
    // Une migration complète nécessiterait une approche plus avancée avec styled-components ou emotion
    
    return (
      <ThemeProvider theme={theme}>
        <Component {...migratedProps} />
      </ThemeProvider>
    );
  };
  
  WithDesignSystemStyles.displayName = `WithDesignSystemStyles(${Component.displayName || Component.name || 'Component'})`;
  
  return WithDesignSystemStyles;
};

export default withDesignSystemStyles;
