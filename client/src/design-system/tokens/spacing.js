/**
 * Système d'espacement Velo-Altitude
 * Basé sur une unité de 8px pour garantir cohérence et harmonie
 */

export const spacing = {
  // Unité de base = 8px
  unit: 8,
  
  // Multiplicateurs d'espacement (en px)
  base: 8,
  xs: 4,     // 0.5x
  sm: 8,     // 1x
  md: 16,    // 2x
  lg: 24,    // 3x
  xl: 32,    // 4x
  '2xl': 40, // 5x
  '3xl': 48, // 6x
  '4xl': 64, // 8x
  '5xl': 80, // 10x
  '6xl': 96, // 12x
  
  // Fonction utilitaire pour calculer l'espacement
  // Utilisation: spacing.get(2) => 16px (2x unité de base)
  get: (multiplier) => multiplier * 8,
  
  // Système de grille
  grid: {
    columns: {
      desktop: 12,
      tablet: 8,
      mobile: 4
    },
    gutter: {
      desktop: 24,
      tablet: 16,
      mobile: 8
    },
    margin: {
      desktop: 40,
      tablet: 24,
      mobile: 16
    }
  },
  
  // Spécifiques au contexte
  defaults: {
    // Composants cartes
    card: {
      padding: 16,
      margin: 8,
      gap: 12,
      borderRadius: 8
    },
    
    // Navigation
    nav: {
      height: 64,
      padding: 16
    },
    
    // Boutons
    button: {
      paddingX: 16,
      paddingY: 8,
      gap: 8
    },
    
    // Formulaires
    form: {
      gap: 24,
      inputPadding: 12
    },
    
    // Entêtes de section
    section: {
      marginTop: 48,
      marginBottom: 32
    },
    
    // Conteneurs
    container: {
      maxWidth: 1200,
      padding: 16
    }
  },
  
  // Media queries
  breakpoints: {
    xs: '0px',
    sm: '600px',
    md: '960px',
    lg: '1280px',
    xl: '1920px'
  }
};

export default spacing;
