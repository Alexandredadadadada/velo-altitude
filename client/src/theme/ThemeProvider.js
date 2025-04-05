import React, { useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getCurrentTheme, subscribeToThemeChanges } from './materialTheme';
import themeManager from '../utils/ThemeManager';

/**
 * Fournisseur de thème global pour l'application
 * Gère le mode clair/sombre et applique le thème Material-UI à tous les composants
 * 
 * @param {Object} props - Propriétés du composant
 * @param {React.ReactNode} props.children - Composants enfants
 */
const ThemeProvider = ({ children }) => {
  // Initialisation du gestionnaire de thème
  useEffect(() => {
    if (!themeManager.isInitialized) {
      themeManager.initialize();
    }
  }, []);

  // État local pour le thème actuel
  const [theme, setTheme] = useState(getCurrentTheme());

  // Écoute des changements de thème
  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(getCurrentTheme());
    };
    
    // S'abonner aux changements
    const unsubscribe = subscribeToThemeChanges(handleThemeChange);
    
    // Mise à jour initiale
    handleThemeChange();
    
    // Nettoyage lors du démontage
    return unsubscribe;
  }, []);

  return (
    <MuiThemeProvider theme={theme}>
      {/* CssBaseline normalise les styles CSS pour une expérience cohérente */}
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default ThemeProvider;
