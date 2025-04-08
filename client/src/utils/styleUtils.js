/**
 * Utilitaires pour assurer la cohérence des styles
 * Ce fichier facilite la migration des styles CSS personnalisés vers le design system
 */

import colors from '../design-system/tokens/colors';
import theme from '../design-system/theme';

/**
 * Convertit une variable CSS root en valeur du design system
 * @param {string} cssVar - Variable CSS (ex: 'var(--primary)')
 * @returns {string} - Valeur correspondante dans le design system
 */
export const convertCssVarToTheme = (cssVar) => {
  // Extraire le nom de la variable
  const varName = cssVar.replace('var(--', '').replace(')', '');
  
  // Table de correspondance entre variables CSS et design system
  const mappings = {
    'primary': colors.primary.main,
    'primary-light': colors.primary.light,
    'primary-dark': colors.primary.dark,
    'secondary': colors.secondary.main,
    'secondary-light': colors.secondary.light,
    'secondary-dark': colors.secondary.dark,
    'background-primary': colors.neutral.white,
    'background-secondary': colors.neutral.paper,
    'background-tertiary': colors.neutral.grey[100],
    'surface': colors.neutral.white,
    'border': colors.neutral.grey[300],
    'divider': colors.neutral.grey[300],
    'text-primary': colors.neutral.grey[900],
    'text-secondary': colors.neutral.grey[700],
    'text-tertiary': colors.neutral.grey[600],
    'text-muted': colors.neutral.grey[500],
    'success': colors.functional.success,
    'warning': colors.functional.warning,
    'danger': colors.functional.error,
    'info': colors.functional.info,
  };
  
  return mappings[varName] || cssVar;
};

/**
 * Convertit les styles legacy en valeurs du design system
 * @param {Object} styles - Objet de styles legacy
 * @returns {Object} - Styles mis à jour avec les valeurs du design system
 */
export const migrateStylesToDesignSystem = (styles) => {
  const migratedStyles = {};
  
  Object.entries(styles).forEach(([key, value]) => {
    // Si la valeur est une chaîne et contient 'var(--'
    if (typeof value === 'string' && value.includes('var(--')) {
      migratedStyles[key] = convertCssVarToTheme(value);
    } 
    // Si la valeur est un objet (styles imbriqués)
    else if (typeof value === 'object' && value !== null) {
      migratedStyles[key] = migrateStylesToDesignSystem(value);
    } 
    // Autres cas
    else {
      migratedStyles[key] = value;
    }
  });
  
  return migratedStyles;
};

/**
 * Obtient la valeur d'une couleur du design system à partir d'une clé de chemin
 * @param {string} path - Chemin vers la couleur (ex: 'primary.main')
 * @returns {string} - Valeur de la couleur
 */
export const getColorFromPath = (path) => {
  const parts = path.split('.');
  let result = colors;
  
  for (const part of parts) {
    if (result[part] !== undefined) {
      result = result[part];
    } else {
      return null;
    }
  }
  
  return typeof result === 'string' ? result : null;
};

/**
 * Obtient la valeur d'espacement du design system
 * @param {number} factor - Facteur d'espacement
 * @returns {string} - Valeur d'espacement avec unité
 */
export const getSpacing = (factor) => {
  return theme.spacing(factor);
};

export default {
  convertCssVarToTheme,
  migrateStylesToDesignSystem,
  getColorFromPath,
  getSpacing
};
