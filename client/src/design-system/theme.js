/**
 * Thème Velo-Altitude
 * Système de design unifié pour l'expérience cyclisme de montagne
 */

import { colors } from './tokens/colors';
import { typography } from './tokens/typography';
import { spacing } from './tokens/spacing';

// Thème principal MUI customisé
const veloAltitudeTheme = {
  // Palette de couleurs
  palette: {
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
      contrastText: colors.primary.contrast,
    },
    secondary: {
      main: colors.secondary.main,
      light: colors.secondary.light,
      dark: colors.secondary.dark,
      contrastText: colors.secondary.contrast,
    },
    error: {
      main: colors.functional.error,
    },
    warning: {
      main: colors.functional.warning,
    },
    info: {
      main: colors.functional.info,
    },
    success: {
      main: colors.functional.success,
    },
    background: {
      default: colors.neutral.paper,
      paper: colors.neutral.white,
      altitude: colors.overlay.altitude,
    },
    text: {
      primary: colors.neutral.grey[900],
      secondary: colors.neutral.grey[700],
      disabled: colors.neutral.grey[500],
    },
    action: {
      active: colors.accent.orange,
      hover: colors.primary.light,
    },
    divider: colors.neutral.grey[300],
  },

  // Typographie
  typography: {
    fontFamily: typography.fontFamily.body,
    h1: typography.styles.h1,
    h2: typography.styles.h2,
    h3: typography.styles.h3,
    h4: typography.styles.h4,
    h5: typography.styles.h5,
    h6: typography.styles.h6,
    body1: typography.styles.body1,
    body2: typography.styles.body2,
    button: typography.styles.button,
    caption: typography.styles.caption,
    overline: typography.styles.overline,
  },

  // Gestion des espacements
  spacing: (factor) => `${spacing.unit * factor}px`,

  // Thème des composants
  components: {
    // Style par défaut des boutons
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: spacing.defaults.button.borderRadius || 8,
          padding: `${spacing.defaults.button.paddingY}px ${spacing.defaults.button.paddingX}px`,
          fontWeight: typography.fontWeight.medium,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
        containedPrimary: {
          background: `linear-gradient(45deg, ${colors.primary.dark} 0%, ${colors.primary.main} 100%)`,
          '&:hover': {
            background: `linear-gradient(45deg, ${colors.primary.main} 0%, ${colors.primary.light} 100%)`,
          },
        },
        containedSecondary: {
          background: `linear-gradient(45deg, ${colors.secondary.dark} 0%, ${colors.secondary.main} 100%)`,
          '&:hover': {
            background: `linear-gradient(45deg, ${colors.secondary.main} 0%, ${colors.secondary.light} 100%)`,
          },
        },
      },
    },

    // Style des cartes
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: spacing.defaults.card.borderRadius,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },

    // Style des entrées formulaire
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary.light,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary.main,
              borderWidth: 2,
            },
          },
        },
      },
    },

    // Style des badges
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontWeight: typography.fontWeight.medium,
          fontSize: '0.7rem',
        },
      },
    },

    // Style personnalisé pour le menu de navigation
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.neutral.white,
          color: colors.neutral.grey[900],
          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },

  // Points de rupture responsive
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },

  // Arrondis et ombres
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.05)',
    '0px 6px 12px rgba(0, 0, 0, 0.08)',
    // ... autres niveaux d'ombre
    '0px 20px 40px rgba(0, 0, 0, 0.2)',
  ],

  // Transitions
  transitions: {
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
  },

  // Extensions personnalisées pour Velo-Altitude
  veloAltitude: {
    // Couleurs spécifiques aux cols
    colsColors: colors.cols,
    
    // Palette de difficulté
    difficulty: colors.difficulty,
    
    // Typographie technique
    techTypography: typography.styles.techData,
    
    // Typographie spécifique altitude
    altitudeTypography: typography.styles.altitude,
    
    // Animations et transitions personnalisées
    animations: {
      colorShift: 'background-position 3s ease infinite',
      elevationHover: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
      pageTransition: 'transform 0.4s ease-out, opacity 0.4s ease-out',
      expandCollapse: 'height 0.3s ease, opacity 0.3s ease',
      badgeCompleted: 'scale 0.5s cubic-bezier(0.17, 0.67, 0.83, 0.67)',
    },
    
    // Éléments de gradient pour effets visuels
    gradients: {
      altitude: 'linear-gradient(180deg, #8DA9D4 0%, #1C3E72 100%)',
      orangeAccent: 'linear-gradient(45deg, #E76F51 0%, #F4A261 100%)',
      difficulty: {
        easy: 'linear-gradient(90deg, #4CAF50 0%, #81C784 100%)',
        medium: 'linear-gradient(90deg, #3066BE 0%, #5B8DEF 100%)',
        hard: 'linear-gradient(90deg, #FF9800 0%, #FFB74D 100%)',
        veryHard: 'linear-gradient(90deg, #E25F4C 0%, #FF8A80 100%)',
        extreme: 'linear-gradient(90deg, #212121 0%, #424242 100%)',
      },
    },
    
    // Configuration BatteryOptimizer
    batteryOptimizer: {
      thresholds: {
        critical: 10,
        low: 20,
        medium: 40,
        high: 70,
      },
      renderQualities: {
        critical: {
          polygonReduction: 0.8,
          textureQuality: 'low',
          effectsEnabled: false,
          animationsEnabled: false,
        },
        low: {
          polygonReduction: 0.6,
          textureQuality: 'medium',
          effectsEnabled: false,
          animationsEnabled: 'minimal',
        },
        medium: {
          polygonReduction: 0.3,
          textureQuality: 'medium',
          effectsEnabled: 'minimal',
          animationsEnabled: true,
        },
        high: {
          polygonReduction: 0,
          textureQuality: 'high',
          effectsEnabled: true,
          animationsEnabled: true,
        },
      },
    },
  },
};

// Mode sombre
const darkTheme = {
  ...veloAltitudeTheme,
  palette: {
    ...veloAltitudeTheme.palette,
    mode: 'dark',
    background: {
      default: colors.dark.background,
      paper: colors.dark.surface,
    },
    text: {
      primary: colors.neutral.grey[100],
      secondary: colors.neutral.grey[300],
    },
    primary: {
      main: colors.dark.primary,
    },
    secondary: {
      main: colors.dark.secondary,
    },
  },
};

export { veloAltitudeTheme as default, darkTheme };
