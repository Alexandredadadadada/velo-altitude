import { createTheme } from '@mui/material/styles';
import { red, blue, green, grey, orange } from '@mui/material/colors';
import themeManager from '../utils/ThemeManager';

/**
 * Thème Material-UI pour la plateforme de cyclisme européenne
 * Supporte les modes clair et sombre avec une attention particulière à l'accessibilité
 * 
 * Ce fichier définit les thèmes pour Material-UI et les intègre avec le ThemeManager existant
 */

// Couleurs du thème Cyclisme Europe
const cyclingColors = {
  primary: {
    main: '#1565c0', // Bleu européen
    dark: '#0d47a1',
    light: '#42a5f5',
  },
  secondary: {
    main: '#ff6f00', // Orange dynamique pour l'énergie du cyclisme
    dark: '#e65100',
    light: '#ff9800',
  },
  tertiary: {
    main: '#00897b', // Vert teal pour les accents et la nature
    dark: '#00695c',
    light: '#26a69a',
  },
  // Palette pour les niveaux de difficulté des cols
  difficulty: {
    hc: '#9c27b0',     // Violet pour les cols Hors Catégorie
    cat1: '#e53935',   // Rouge pour les cols de catégorie 1
    cat2: '#fb8c00',   // Orange pour les cols de catégorie 2
    cat3: '#fdd835',   // Jaune pour les cols de catégorie 3
    cat4: '#43a047',   // Vert pour les cols de catégorie 4
  },
};

// Configuration commune entre les thèmes clair et sombre
const commonConfig = {
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.2rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.8rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.3rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.1rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
      defaultProps: {
        // Amélioration de l'accessibilité
        disableElevation: false, // Conserver l'élévation pour l'affordance visuelle
      },
    },
    MuiButtonBase: {
      defaultProps: {
        // Amélioration de la navigation au clavier
        disableRipple: false,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          overflow: 'hidden',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px',
          '&:last-child': {
            paddingBottom: '24px',
          },
        },
      },
    },
    // Composants avec focus amélioré pour l'accessibilité
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: 'hover',
      },
      styleOverrides: {
        root: {
          fontWeight: 500,
          '&:focus': {
            outline: '2px solid currentColor',
            outlineOffset: '2px',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          '&.Mui-focusVisible': {
            outline: '2px solid currentColor',
            outlineOffset: '2px',
          },
        },
      },
    },
  },
};

// Création du thème clair
const lightTheme = createTheme({
  ...commonConfig,
  palette: {
    mode: 'light',
    primary: {
      main: cyclingColors.primary.main,
      dark: cyclingColors.primary.dark,
      light: cyclingColors.primary.light,
      contrastText: '#ffffff',
    },
    secondary: {
      main: cyclingColors.secondary.main,
      dark: cyclingColors.secondary.dark,
      light: cyclingColors.secondary.light,
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
    error: {
      main: red[700],
    },
    warning: {
      main: orange[800],
    },
    info: {
      main: blue[600],
    },
    success: {
      main: green[600],
    },
    // Couleurs personnalisées pour les catégories de cols
    difficulty: {
      hc: cyclingColors.difficulty.hc,
      cat1: cyclingColors.difficulty.cat1,
      cat2: cyclingColors.difficulty.cat2,
      cat3: cyclingColors.difficulty.cat3,
      cat4: cyclingColors.difficulty.cat4,
    },
  },
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.05),0px 1px 1px 0px rgba(0,0,0,0.03),0px 1px 3px 0px rgba(0,0,0,0.05)',
    '0px 3px 5px -1px rgba(0,0,0,0.08),0px 5px 8px 0px rgba(0,0,0,0.06),0px 1px 14px 0px rgba(0,0,0,0.04)',
    // Ajout d'ombres plus prononcées pour meilleure hiérarchie visuelle
    '0px 4px 6px -2px rgba(0,0,0,0.12),0px 8px 10px -5px rgba(0,0,0,0.08)',
    '0px 6px 8px -3px rgba(0,0,0,0.15),0px 12px 16px -6px rgba(0,0,0,0.1)',
  ],
});

// Création du thème sombre
const darkTheme = createTheme({
  ...commonConfig,
  palette: {
    mode: 'dark',
    primary: {
      main: cyclingColors.primary.light, // Version plus claire pour le mode sombre
      dark: cyclingColors.primary.main,
      light: '#64b5f6',
      contrastText: '#ffffff',
    },
    secondary: {
      main: cyclingColors.secondary.light, // Version plus claire pour le mode sombre
      dark: cyclingColors.secondary.main,
      light: '#ffb74d',
      contrastText: '#000000', // Texte noir pour meilleur contraste
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.9)', // Augmenté pour meilleur contraste
      secondary: 'rgba(255, 255, 255, 0.75)', // Augmenté pour meilleur contraste
      disabled: 'rgba(255, 255, 255, 0.5)',
    },
    divider: 'rgba(255, 255, 255, 0.15)', // Augmenté pour meilleur contraste
    error: {
      main: red[400],
    },
    warning: {
      main: orange[300],
    },
    info: {
      main: blue[300],
    },
    success: {
      main: green[400],
    },
    // Couleurs personnalisées pour les catégories de cols (ajustées pour le mode sombre)
    difficulty: {
      hc: '#ce93d8', // Version plus claire pour le mode sombre
      cat1: '#ef5350',
      cat2: '#ffb74d',
      cat3: '#fff176',
      cat4: '#66bb6a',
    },
  },
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
    '0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)',
    // Ajout d'ombres plus prononcées pour meilleure hiérarchie visuelle
    '0px 4px 6px -2px rgba(0,0,0,0.3),0px 8px 10px -5px rgba(0,0,0,0.25)',
    '0px 6px 8px -3px rgba(0,0,0,0.35),0px 12px 16px -6px rgba(0,0,0,0.3)',
  ],
});

/**
 * Fonction pour obtenir le thème Material-UI actuel en fonction du mode sombre
 * @returns {Object} Le thème Material-UI approprié
 */
export const getCurrentTheme = () => {
  return themeManager.isDarkModeEnabled() ? darkTheme : lightTheme;
};

/**
 * Fonction pour s'abonner aux changements de thème
 * @param {Function} callback - Fonction à appeler lors du changement de thème
 * @returns {Function} - Fonction pour se désabonner
 */
export const subscribeToThemeChanges = (callback) => {
  themeManager.addThemeListener(callback);
  return () => themeManager.removeThemeListener(callback);
};

/**
 * Fonction pour basculer entre les modes clair et sombre
 * @returns {boolean} - Le nouvel état du mode sombre
 */
export const toggleTheme = () => {
  return themeManager.toggleDarkMode();
};

export { lightTheme, darkTheme, cyclingColors };
export default getCurrentTheme;
