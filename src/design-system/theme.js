/**
 * Velo-Altitude Design System - Theme Configuration
 * 
 * Système de design unifié pour l'application Velo-Altitude
 * Inspiré par les paysages montagneux, l'atmosphère alpine et 
 * l'expérience cycliste premium.
 */

// Palette de couleurs premium
const colors = {
  // Couleurs primaires
  primary: {
    main: '#1A4977',      // Bleu montagne profond
    light: '#2A6CAD',     // Bleu ciel alpin
    dark: '#0D2B4B',      // Bleu nuit
    contrast: '#FFFFFF',  // Texte sur fond primaire
  },
  
  // Couleurs secondaires
  secondary: {
    main: '#24A26F',      // Vert alpin
    light: '#36C389',     // Vert prairie
    dark: '#1A774F',      // Vert forêt
    contrast: '#FFFFFF',  // Texte sur fond secondaire
  },
  
  // Couleurs d'accentuation
  accent: {
    orange: '#FF6B35',    // Orange énergique (pour CTA, badges importants)
    gold: '#E6B54A',      // Or alpin (pour éléments premium, achievements)
    purple: '#7B68EE',    // Violet brume (pour éléments créatifs)
  },
  
  // Nuances de gris
  neutral: {
    white: '#FFFFFF',
    lightest: '#F8F9FA',  // Fond de page
    lighter: '#E9ECEF',   // Carte inactive, fond alternatif
    light: '#DEE2E6',     // Bordures légères
    medium: '#ADB5BD',    // Texte désactivé
    dark: '#495057',      // Texte secondaire
    darker: '#343A40',    // Texte primaire
    darkest: '#212529',   // Titres
    black: '#000000',
  },
  
  // Couleurs sémantiques
  feedback: {
    success: '#38B87C',   // Succès
    warning: '#FFBE0B',   // Avertissement
    error: '#E42535',     // Erreur
    info: '#3F9AE0',      // Information
  },
  
  // Gradients prédéfinis
  gradients: {
    primaryGradient: 'linear-gradient(120deg, #1A4977 0%, #2A6CAD 100%)',
    secondaryGradient: 'linear-gradient(120deg, #24A26F 0%, #36C389 100%)',
    sunriseGradient: 'linear-gradient(120deg, #FF6B35 0%, #E6B54A 100%)',
    glacierGradient: 'linear-gradient(120deg, #2A6CAD 0%, #7B68EE 100%)',
    neutralGradient: 'linear-gradient(120deg, #ADB5BD 0%, #DEE2E6 100%)',
    glassGradient: 'linear-gradient(120deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)',
  },
};

// Typographie harmonieuse et lisible
const typography = {
  fontFamily: {
    primary: '"Montserrat", "Helvetica Neue", Arial, sans-serif',
    secondary: '"Open Sans", "Helvetica Neue", Arial, sans-serif',
    display: '"Poppins", "Helvetica Neue", Arial, sans-serif',
    mono: '"JetBrains Mono", "Courier New", monospace',
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    md: '1.125rem',    // 18px
    lg: '1.25rem',     // 20px
    xl: '1.5rem',      // 24px
    '2xl': '1.875rem', // 30px
    '3xl': '2.25rem',  // 36px
    '4xl': '3rem',     // 48px
    '5xl': '4rem',     // 64px
  },
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// Système d'espacement cohérent
const spacing = {
  0: '0',
  1: '0.25rem',      // 4px
  2: '0.5rem',       // 8px
  3: '0.75rem',      // 12px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  8: '2rem',         // 32px
  10: '2.5rem',      // 40px
  12: '3rem',        // 48px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  32: '8rem',        // 128px
  40: '10rem',       // 160px
  48: '12rem',       // 192px
  56: '14rem',       // 224px
  64: '16rem',       // 256px
};

// Système de bordures
const borders = {
  width: {
    none: '0',
    thin: '1px',
    medium: '2px',
    thick: '4px',
  },
  radius: {
    none: '0',
    sm: '0.125rem',    // 2px
    md: '0.25rem',     // 4px
    lg: '0.5rem',      // 8px
    xl: '1rem',        // 16px
    '2xl': '1.5rem',   // 24px
    '3xl': '2rem',     // 32px
    full: '9999px',
  },
};

// Système d'ombres élégant
const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  outline: '0 0 0 3px rgba(66, 153, 225, 0.5)',
  
  // Effets spéciaux pour l'effet WOW
  glass: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  float: '0 10px 50px 0 rgba(0, 0, 0, 0.1)',
  premium: '0 20px 80px -15px rgba(66, 153, 225, 0.4)',
};

// Effets de glassmorphism
const glass = {
  default: {
    background: 'rgba(255, 255, 255, 0.65)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    shadow: shadows.glass,
  },
  dark: {
    background: 'rgba(25, 25, 25, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    shadow: shadows.glass,
  },
  colored: {
    background: 'rgba(26, 73, 119, 0.65)', // Couleur primaire avec transparence
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    shadow: shadows.glass,
  },
};

// Breakpoints pour le responsive design
const breakpoints = {
  xs: '0px',
  sm: '600px',
  md: '960px',
  lg: '1280px',
  xl: '1920px',
};

// Animations et transitions
const animations = {
  transition: {
    fast: '100ms',
    default: '200ms',
    slow: '400ms',
    xslow: '600ms',
  },
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
};

// Configuration des z-index
const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  elevated: 1,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
};

// Export du thème complet
const theme = {
  name: 'Velo-Altitude Premium',
  colors,
  typography,
  spacing,
  borders,
  shadows,
  glass,
  breakpoints,
  animations,
  zIndex,
};

export default theme;
