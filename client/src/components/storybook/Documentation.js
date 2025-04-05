/**
 * Documentation Storybook pour les composants UI
 * Facilite la maintenance et la réutilisation des composants
 */

// Ce fichier sert de template pour la documentation des composants UI
// Les composants sont organisés par catégories fonctionnelles

import React from 'react';
import { Button } from 'react-bootstrap';

// Modèle de documentation pour chaque composant
const ComponentTemplate = {
  title: 'Nom du composant',
  component: Button, // Remplacer par le composant réel
  parameters: {
    docs: {
      description: {
        component: 'Description détaillée du composant et de son usage'
      }
    }
  },
  argTypes: {
    // Définition des propriétés contrôlables dans Storybook
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'success', 'warning', 'danger', 'info'],
      description: 'Variante du bouton selon le design system'
    }
  }
};

// Exemples de documentation pour les principaux composants UI
export const UIComponents = {
  
  // Documentation pour les états de chargement
  LoadingStates: {
    title: 'Common/Loading States',
    parameters: {
      docs: {
        description: {
          component: `
# États de chargement
Composants pour afficher différents états de chargement dans l'application, conformes au design system.

## Variantes disponibles
- **LoadingOverlay**: Superposition semi-transparente pour indiquer le chargement d'une section
- **SkeletonLoader**: Placeholders animés pendant le chargement des données
- **Visualization3DLoader**: Indicateur spécifique pour le chargement des visualisations 3D
- **DataTransition**: Transitions fluides lors du changement de données

## Accessibilité
Tous les composants respectent les normes WCAG 2.1 AA avec les attributs ARIA appropriés.
          `
        }
      }
    },
    argTypes: {
      variant: {
        control: { type: 'select' },
        options: ['overlay', 'fullscreen', 'inline'],
        description: 'Type d\'affichage du chargement'
      },
      message: {
        control: 'text',
        description: 'Message à afficher pendant le chargement'
      },
      isLoading: {
        control: 'boolean',
        description: 'État de chargement'
      }
    }
  },
  
  // Documentation pour les points d'intérêt interactifs
  InteractivePoint: {
    title: 'Visualization/Interactive Point',
    parameters: {
      docs: {
        description: {
          component: `
# Points d'intérêt interactifs
Composant pour afficher des points d'intérêt cliquables dans les visualisations 3D.

## Caractéristiques
- Animation au survol et au clic
- Infobulles contextuelles
- Différents types de points (eau, vue, technique, etc.)
- Support complet des lecteurs d'écran

## Performance
Optimisé pour minimiser l'impact sur les performances 3D avec:
- Rendu conditionnel basé sur la distance
- Détails adaptatifs selon le niveau de performance
          `
        }
      }
    },
    argTypes: {
      type: {
        control: { type: 'select' },
        options: ['info', 'water', 'view', 'technical', 'danger', 'refreshment', 'photo'],
        description: 'Type de point d\'intérêt'
      },
      title: {
        control: 'text',
        description: 'Titre du point d\'intérêt'
      },
      color: {
        control: 'color',
        description: 'Couleur principale du point'
      },
      size: {
        control: { type: 'range', min: 0.1, max: 2, step: 0.1 },
        description: 'Taille du point'
      }
    }
  },
  
  // Documentation pour le thème sombre
  DarkMode: {
    title: 'Theme/Dark Mode',
    parameters: {
      docs: {
        description: {
          component: `
# Mode sombre
Système de thème sombre pour l'application entière.

## Implémentation
- Basé sur des variables CSS avec des fallbacks pour compatibilité
- Transition fluide entre les modes clair et sombre
- Contraste optimisé pour une meilleure lisibilité
- Support des préférences système via \`prefers-color-scheme\`

## Utilisation
\`\`\`jsx
// Pour activer ou désactiver le mode sombre
ThemeManager.toggleDarkMode(enabled);

// Pour écouter les changements de thème
ThemeManager.addThemeListener(callback);
\`\`\`
          `
        }
      }
    },
    argTypes: {
      enabled: {
        control: 'boolean',
        description: 'Activation du mode sombre'
      },
      useSystemPreference: {
        control: 'boolean',
        description: 'Utiliser la préférence système'
      }
    }
  },
  
  // Documentation pour les visualisations 3D
  Visualization3D: {
    title: 'Visualization/3D Terrain',
    parameters: {
      docs: {
        description: {
          component: `
# Visualisation 3D de terrain
Composant de visualisation immersive des cols et routes cyclistes.

## Fonctionnalités
- Rendu 3D haute fidélité du terrain
- Contrôles intuitifs (rotation, zoom, survol)
- Points d'intérêt interactifs
- Adaptation automatique aux performances du périphérique
- Optimisation mobile

## Optimisation des performances
- Niveaux de détail adaptatifs (LOD)
- Chargement progressif des textures
- Réduction dynamique de la qualité sur les appareils moins puissants
- Compatibilité avec Safari mobile améliorée

## Accessibilité
- Navigation au clavier
- Descriptions audio alternatives
- Contraste optimisé des étiquettes
          `
        }
      }
    },
    argTypes: {
      qualityPreset: {
        control: { type: 'select' },
        options: ['low', 'medium', 'high', 'auto'],
        description: 'Préréglage de qualité graphique'
      },
      showLabels: {
        control: 'boolean',
        description: 'Afficher les étiquettes sur le terrain'
      },
      interactivePoints: {
        control: 'object',
        description: 'Configuration des points d\'intérêt'
      }
    }
  },
  
  // Documentation pour Safari Mobile Compatibility
  SafariMobileCompatibility: {
    title: 'Utility/Safari Mobile Compatibility',
    parameters: {
      docs: {
        description: {
          component: `
# Compatibilité Safari Mobile
Solutions pour les problèmes spécifiques à Safari mobile.

## Problèmes identifiés et solutions
1. **Bugs de positionnement Flexbox**
   - Utilisation de \`position: relative\` pour forcer un nouveau contexte
   - Fallbacks pour les propriétés CSS non supportées

2. **Problèmes de scroll**
   - Utilisation de \`-webkit-overflow-scrolling: touch\` 
   - Correction des problèmes de momentum scroll

3. **Rendu WebGL**
   - Détection des limitations WebGL sur iOS
   - Mode de compatibilité avec rendu simplifié
   - Fallback vers rendu 2D pour les anciennes versions

## Utilisation
\`\`\`jsx
// Détection de Safari mobile
const isSafariMobile = BrowserDetection.isSafariMobile();

// Application du correctif approprié
if (isSafariMobile) {
  SafariCompat.applyFixes(element, options);
}
\`\`\`
          `
        }
      }
    },
    argTypes: {
      fixScrolling: {
        control: 'boolean',
        description: 'Appliquer le correctif de défilement'
      },
      fixFlexbox: {
        control: 'boolean',
        description: 'Appliquer le correctif Flexbox'
      },
      fixWebGL: {
        control: 'boolean',
        description: 'Appliquer le correctif WebGL'
      }
    }
  }
};

// Exemples de composants pour chaque type
export const LoadingStateStory = () => (
  <div className="story-container">
    <h3>États de chargement</h3>
    <div className="story-grid">
      <div className="story-item">
        <h4>LoadingOverlay</h4>
        <div className="preview-container">
          <div style={{ height: '200px', position: 'relative' }}>
            <div className="loading-container overlay">
              <div className="loading-spinner">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Chargement</span>
                </div>
              </div>
              <p className="loading-message">Chargement des données...</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="story-item">
        <h4>SkeletonLoader</h4>
        <div className="preview-container">
          <div className="skeleton-container">
            <div className="skeleton-item">
              <div className="skeleton-title skeleton"></div>
              <div className="skeleton-text skeleton"></div>
              <div className="skeleton-text skeleton"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const InteractivePointStory = () => (
  <div className="story-container">
    <h3>Points d'intérêt</h3>
    <div className="story-grid">
      <div className="story-item">
        <h4>InteractivePoint (Aperçu)</h4>
        <div className="preview-container">
          <div className="interactive-point-preview">
            <div className="interactive-point-tooltip">
              <div className="interactive-point-header">
                <i className="fas fa-mountain point-icon point-view"></i>
                <h3>Point de vue</h3>
              </div>
              <div className="interactive-point-content">
                <p>Vue panoramique sur la vallée du Rhin.</p>
                <div className="interactive-point-details">
                  <div className="detail-item">
                    <i className="fas fa-road"></i>
                    <span>12.5 km</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-mountain"></i>
                    <span>850 m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Documentation pour les maquettes Phase 2
export const Phase2Mockups = {
  title: 'Design/Phase 2 Mockups',
  parameters: {
    docs: {
      description: {
        component: `
# Maquettes pour la Phase 2
Designs préliminaires pour les fonctionnalités sociales et communautaires de la phase 2.

## Fonctionnalités planifiées
1. **Profils sociaux avancés**
   - Badges de progression
   - Statistiques de cyclisme personnalisées
   - Système de réputation communautaire

2. **Défis et compétitions**
   - Défis hebdomadaires/mensuels
   - Tableaux de classement interactifs
   - Système de récompenses virtuelles

3. **Planification de sorties en groupe**
   - Calendrier d'événements
   - Coordination en temps réel
   - Intégration météo pour suggestions
        `
      }
    }
  }
};

// Export par défaut pour usage dans Storybook
export default {
  title: 'Grand Est Cyclisme/Documentation',
  parameters: {
    docs: {
      description: {
        component: `
# Grand Est Cyclisme - Documentation UI
Bibliothèque de composants UI pour le projet Grand Est Cyclisme.

Cette documentation fournit des exemples interactifs, des conseils d'utilisation et des directives de design pour tous les composants de l'interface utilisateur.

## Principes de design
- **Immersion** - Expériences visuelles qui permettent aux utilisateurs de "ressentir" les parcours
- **Clarté** - Hiérarchie d'information intuitive et navigation fluide 
- **Feedback** - Système cohérent de feedback pour confirmer les actions utilisateur
- **Accessibilité** - Conformité WCAG 2.1 niveau AA pour tous les composants

## Comment utiliser cette documentation
Explorez les composants par catégorie dans le menu de gauche. Chaque composant inclut:
- Documentation complète
- Propriétés et options configurables
- Exemples interactifs
- Considérations d'accessibilité
        `
      }
    }
  }
};
