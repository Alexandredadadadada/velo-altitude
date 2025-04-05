/**
 * Système typographique Velo-Altitude
 * Optimisé pour lisibilité sur tous les appareils et cohérence visuelle
 */

export const typography = {
  // Familles de polices
  fontFamily: {
    title: '"Montserrat", "Helvetica Neue", sans-serif',
    body: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
    mono: '"Roboto Mono", "Courier New", monospace',
  },
  
  // Tailles de base (en rem)
  fontSize: {
    xs: 0.75,    // 12px
    sm: 0.875,   // 14px
    base: 1,     // 16px
    md: 1.125,   // 18px
    lg: 1.25,    // 20px
    xl: 1.5,     // 24px
    '2xl': 1.875, // 30px
    '3xl': 2.25,  // 36px
    '4xl': 3,     // 48px
    '5xl': 4,     // 64px
  },
  
  // Poids de police
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  // Hauteurs de ligne
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Espacement des lettres
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  
  // Styles composés pour usage courant
  styles: {
    // Titres
    h1: {
      fontFamily: '"Montserrat", "Helvetica Neue", sans-serif',
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontFamily: '"Montserrat", "Helvetica Neue", sans-serif',
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Montserrat", "Helvetica Neue", sans-serif',
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '0',
    },
    h4: {
      fontFamily: '"Montserrat", "Helvetica Neue", sans-serif',
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0',
    },
    h5: {
      fontFamily: '"Montserrat", "Helvetica Neue", sans-serif',
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0',
    },
    h6: {
      fontFamily: '"Montserrat", "Helvetica Neue", sans-serif',
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0',
    },
    
    // Corps de texte
    body1: {
      fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    
    // Données techniques
    techData: {
      fontFamily: '"Roboto Mono", "Courier New", monospace',
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0',
    },
    
    // Altitude (pour les grandes valeurs d'altitude)
    altitude: {
      fontFamily: '"Montserrat", "Helvetica Neue", sans-serif',
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: '-0.01em',
    },
    
    // Éléments d'interface
    button: {
      fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.75,
      letterSpacing: '0.02857em',
      textTransform: 'uppercase',
    },
    caption: {
      fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.66,
      letterSpacing: '0.03333em',
    },
    overline: {
      fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: 2.66,
      letterSpacing: '0.08333em',
      textTransform: 'uppercase',
    },
  },
  
  // Adaptations responsive
  responsive: {
    mobile: {
      h1: { fontSize: '2.25rem' },
      h2: { fontSize: '1.875rem' },
      h3: { fontSize: '1.5rem' },
      h4: { fontSize: '1.25rem' },
      h5: { fontSize: '1.125rem' },
      h6: { fontSize: '1rem' },
      altitude: { fontSize: '2rem' },
    }
  }
};

export default typography;
