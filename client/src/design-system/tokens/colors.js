/**
 * Système de couleurs Velo-Altitude
 * Palette optimisée pour l'expérience cyclisme de montagne
 */

export const colors = {
  // Couleurs primaires
  primary: {
    main: '#1C3E72',
    light: '#3A66A7',
    dark: '#0E2548',
    contrast: '#FFFFFF'
  },
  
  // Couleurs secondaires - Verts alpins
  secondary: {
    main: '#2D6A4F',
    light: '#40916C',
    dark: '#1B4332',
    contrast: '#FFFFFF'
  },
  
  // Accents et actions
  accent: {
    orange: '#E76F51', // Points d'action et accomplissements
    red: '#D33F49',    // Défi et difficultés
    yellow: '#F9C74F', // Parcours et itinéraires
  },
  
  // Palette de difficulté
  difficulty: {
    easy: '#4CAF50',
    medium: '#3066BE',
    hard: '#FF9800',
    veryHard: '#E25F4C',
    extreme: '#212121'
  },
  
  // Tons neutres
  neutral: {
    rock: '#A49E8D',    // Roche alpine
    rockLight: '#C4BFB2',
    paper: '#F7F7F2',
    white: '#FFFFFF',
    black: '#000000',
    grey: {
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121'
    }
  },
  
  // Couleurs transparentes pour overlays
  overlay: {
    light: 'rgba(255, 255, 255, 0.8)',
    dark: 'rgba(0, 0, 0, 0.7)',
    primaryLight: 'rgba(28, 62, 114, 0.1)',
    primaryMedium: 'rgba(28, 62, 114, 0.3)',
    primaryHeavy: 'rgba(28, 62, 114, 0.7)',
    gradientLight: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 100%)',
    gradientDark: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)',
    altitude: 'linear-gradient(180deg, #8DA9D4 0%, #1C3E72 100%)'
  },
  
  // Mode sombre
  dark: {
    background: '#121826',
    surface: '#1E2132',
    primary: '#3A66A7',
    secondary: '#40916C'
  },
  
  // Couleurs fonctionnelles
  functional: {
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#D33F49',
    info: '#2196F3',
  },
  
  // Couleurs spécifiques aux cols
  cols: {
    bonette: '#3843BC',
    stelvio: '#D33F49',
    galibier: '#388E3C',
    angliru: '#F57C00',
    izoard: '#7B1FA2',
    tourmalet: '#1976D2',
    ventoux: '#CFD8DC'
  }
};

export default colors;
