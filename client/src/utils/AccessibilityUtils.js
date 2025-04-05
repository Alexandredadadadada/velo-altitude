/**
 * Utilitaires pour améliorer l'accessibilité de l'application
 * Conformes aux normes WCAG 2.1 niveau AA
 */

/**
 * Génère les attributs ARIA appropriés pour les composants interactifs
 * @param {string} role - Rôle ARIA (button, link, checkbox, etc.)
 * @param {Object} options - Options supplémentaires
 * @returns {Object} - Attributs ARIA à propager au composant
 */
export const getAriaProps = (role, options = {}) => {
  const baseProps = {
    role: role,
  };

  // Options communes
  if (options.label) {
    baseProps['aria-label'] = options.label;
  }
  
  if (options.description) {
    baseProps['aria-description'] = options.description;
  }

  if (options.hidden !== undefined) {
    baseProps['aria-hidden'] = options.hidden;
  }

  // Attributs spécifiques selon le rôle
  switch (role) {
    case 'button':
      if (options.pressed !== undefined) {
        baseProps['aria-pressed'] = options.pressed;
      }
      if (options.expanded !== undefined) {
        baseProps['aria-expanded'] = options.expanded;
      }
      if (options.disabled !== undefined) {
        baseProps['aria-disabled'] = options.disabled;
      }
      if (options.controls) {
        baseProps['aria-controls'] = options.controls;
      }
      break;
      
    case 'checkbox':
    case 'switch':
      if (options.checked !== undefined) {
        baseProps['aria-checked'] = options.checked;
      }
      if (options.disabled !== undefined) {
        baseProps['aria-disabled'] = options.disabled;
      }
      break;
      
    case 'link':
      if (options.current !== undefined) {
        baseProps['aria-current'] = options.current;
      }
      break;
      
    case 'listbox':
    case 'combobox':
      if (options.expanded !== undefined) {
        baseProps['aria-expanded'] = options.expanded;
      }
      if (options.activedescendant) {
        baseProps['aria-activedescendant'] = options.activedescendant;
      }
      if (options.controls) {
        baseProps['aria-controls'] = options.controls;
      }
      if (options.owns) {
        baseProps['aria-owns'] = options.owns;
      }
      break;
      
    case 'option':
      if (options.selected !== undefined) {
        baseProps['aria-selected'] = options.selected;
      }
      break;
      
    case 'progressbar':
    case 'slider':
      if (options.valuemin !== undefined) {
        baseProps['aria-valuemin'] = options.valuemin;
      }
      if (options.valuemax !== undefined) {
        baseProps['aria-valuemax'] = options.valuemax;
      }
      if (options.valuenow !== undefined) {
        baseProps['aria-valuenow'] = options.valuenow;
      }
      if (options.valuetext) {
        baseProps['aria-valuetext'] = options.valuetext;
      }
      break;
      
    case 'alert':
    case 'alertdialog':
      if (options.live) {
        baseProps['aria-live'] = options.live;
      } else {
        baseProps['aria-live'] = role === 'alert' ? 'assertive' : 'polite';
      }
      if (options.atomic !== undefined) {
        baseProps['aria-atomic'] = options.atomic;
      }
      break;
      
    case 'tab':
      if (options.selected !== undefined) {
        baseProps['aria-selected'] = options.selected;
      }
      if (options.controls) {
        baseProps['aria-controls'] = options.controls;
      }
      break;
      
    case 'tabpanel':
      if (options.labelledby) {
        baseProps['aria-labelledby'] = options.labelledby;
      }
      break;
      
    case 'menu':
      if (options.expanded !== undefined) {
        baseProps['aria-expanded'] = options.expanded;
      }
      break;
      
    case 'menuitem':
      if (options.hasSubmenu !== undefined) {
        baseProps['aria-haspopup'] = options.hasSubmenu;
      }
      break;
      
    case 'tooltip':
      baseProps['role'] = 'tooltip';
      break;
      
    default:
      // Attributs génériques pour d'autres rôles
      break;
  }
  
  // Attributs pour les relations
  if (options.labelledby) {
    baseProps['aria-labelledby'] = options.labelledby;
  }
  
  if (options.describedby) {
    baseProps['aria-describedby'] = options.describedby;
  }

  // Support pour les attributs personnalisés
  if (options.customAttributes) {
    Object.assign(baseProps, options.customAttributes);
  }
  
  return baseProps;
};

/**
 * Vérifie le contraste des couleurs selon WCAG
 * @param {string} foreground - Couleur du texte (format hex)
 * @param {string} background - Couleur d'arrière-plan (format hex)
 * @returns {Object} - Résultats de l'analyse de contraste
 */
export const checkColorContrast = (foreground, background) => {
  // Conversion des couleurs hex en RGB
  const hexToRgb = (hex) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  // Calcul de la luminance relative selon WCAG
  const calculateLuminance = (rgb) => {
    const { r, g, b } = rgb;
    const [R, G, B] = [r, g, b].map(val => {
      val = val / 255;
      return val <= 0.03928
        ? val / 12.92
        : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };
  
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);
  
  if (!fgRgb || !bgRgb) {
    return { error: "Format de couleur invalide" };
  }
  
  const fgLuminance = calculateLuminance(fgRgb);
  const bgLuminance = calculateLuminance(bgRgb);
  
  // Calcul du ratio de contraste
  const contrastRatio = 
    (Math.max(fgLuminance, bgLuminance) + 0.05) / 
    (Math.min(fgLuminance, bgLuminance) + 0.05);
  
  return {
    ratio: contrastRatio.toFixed(2),
    aa: {
      normalText: contrastRatio >= 4.5,
      largeText: contrastRatio >= 3.0
    },
    aaa: {
      normalText: contrastRatio >= 7.0,
      largeText: contrastRatio >= 4.5
    }
  };
};

/**
 * Crée un ID unique pour les relations ARIA
 * @param {string} prefix - Préfixe pour l'ID
 * @returns {string} - ID unique
 */
export const generateAriaId = (prefix) => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Vérifie si la taille de texte respecte les standards d'accessibilité
 * @param {number} size - Taille en pixels
 * @returns {boolean} - Si la taille est accessible
 */
export const isAccessibleFontSize = (size) => {
  return size >= 16; // 16px est généralement considéré comme le minimum accessible
};

/**
 * Gère l'accessibilité des messages d'erreur de formulaire
 * @param {string} inputId - ID du champ de formulaire
 * @param {string} errorMessage - Message d'erreur
 * @returns {Object} - Attributs ARIA pour le champ et le message d'erreur
 */
export const formErrorAttributes = (inputId, errorMessage) => {
  const errorId = `${inputId}-error`;
  
  return {
    input: {
      'aria-invalid': !!errorMessage,
      'aria-describedby': errorMessage ? errorId : undefined
    },
    error: {
      id: errorId,
      role: 'alert',
      'aria-live': 'assertive'
    }
  };
};

/**
 * Applique les propriétés d'accessibilité à une image
 * @param {Object} options - Options pour l'image
 * @returns {Object} - Attributs pour l'image
 */
export const getImageAccessibilityProps = (options = {}) => {
  const props = {};
  
  // Si l'image est décorative, elle doit être ignorée par les technologies d'assistance
  if (options.decorative) {
    props.alt = "";
    props.role = "presentation";
    props['aria-hidden'] = true;
  } else {
    // Sinon, elle doit avoir un texte alternatif
    props.alt = options.alt || "";
    
    // Pour les images complexes, on peut ajouter une description longue
    if (options.longDescription) {
      props['aria-describedby'] = options.descriptionId;
    }
  }
  
  return props;
};

/**
 * Détermine si la hiérarchie des titres est correcte
 * @param {Array} headings - Liste des niveaux de titres dans l'ordre d'apparition
 * @returns {Object} - Résultat de la validation avec erreurs éventuelles
 */
export const validateHeadingHierarchy = (headings) => {
  const result = {
    valid: true,
    errors: []
  };
  
  if (!headings.length) {
    return result;
  }
  
  // Vérifie si la page commence par un h1
  if (headings[0] !== 1) {
    result.valid = false;
    result.errors.push('La page devrait commencer par un titre h1');
  }
  
  // Vérifie si les niveaux de titre sont séquentiels (pas de saut de plus d'un niveau)
  for (let i = 1; i < headings.length; i++) {
    const current = headings[i];
    const previous = headings[i - 1];
    
    if (current > previous + 1) {
      result.valid = false;
      result.errors.push(`Saut de niveau de titre non séquentiel de h${previous} à h${current}`);
    }
  }
  
  return result;
};

/**
 * Hook personnalisé pour la prise en charge des raccourcis clavier
 * @param {Object} keyHandlers - Map des touches et handlers associés
 * @returns {Function} - Gestionnaire d'événement à attacher
 */
export const createKeyboardHandler = (keyHandlers) => {
  return (event) => {
    // Support des combinaisons avec modificateurs (Ctrl, Alt, Shift)
    const key = event.key.toLowerCase();
    const withCtrl = event.ctrlKey ? 'ctrl+' : '';
    const withAlt = event.altKey ? 'alt+' : '';
    const withShift = event.shiftKey ? 'shift+' : '';
    
    const fullKey = `${withCtrl}${withAlt}${withShift}${key}`;
    
    // Exécute le handler correspondant s'il existe
    if (keyHandlers[fullKey]) {
      keyHandlers[fullKey](event);
    } else if (keyHandlers[key]) {
      keyHandlers[key](event);
    }
  };
};

export default {
  getAriaProps,
  checkColorContrast,
  generateAriaId,
  isAccessibleFontSize,
  formErrorAttributes,
  getImageAccessibilityProps,
  validateHeadingHierarchy,
  createKeyboardHandler
};
