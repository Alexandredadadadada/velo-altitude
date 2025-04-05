/**
 * Adaptateur pour assurer la compatibilité entre Material UI et notre système de gestion d'erreurs
 * Cet adaptateur permet de capturer et gérer correctement les erreurs spécifiques aux composants Material UI
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import useErrorHandler from '../hooks/useErrorHandler';

/**
 * Adaptateur qui enveloppe les composants Material UI pour une meilleure gestion des erreurs
 * @param {Object} props - Propriétés du composant
 * @param {React.ReactNode} props.children - Composants enfants à envelopper
 * @param {string} props.componentName - Nom du composant Material UI (pour le reporting)
 */
const MaterialUIErrorAdapter = ({ children, componentName = 'MUIComponent' }) => {
  const theme = useTheme();
  const { tryCatch } = useErrorHandler();
  
  // Fonction qui enveloppe le rendu dans un try/catch
  const safeRender = () => {
    return tryCatch(
      () => children,
      {
        errorMessage: `Erreur dans le composant Material UI: ${componentName}`,
        severity: 'error',
        showError: true,
        // Renvoyer un élément vide en cas d'erreur pour éviter de casser le rendu
        fallback: <div className="mui-error-placeholder" style={{ 
          padding: theme.spacing(1),
          margin: theme.spacing(1),
          borderRadius: theme.shape.borderRadius,
          backgroundColor: theme.palette.error.light,
          color: theme.palette.error.contrastText,
          opacity: 0.7,
          fontSize: '0.75rem',
          textAlign: 'center'
        }}>
          Erreur de rendu du composant
        </div>
      }
    );
  };

  return safeRender();
};

MaterialUIErrorAdapter.propTypes = {
  children: PropTypes.node.isRequired,
  componentName: PropTypes.string
};

export default MaterialUIErrorAdapter;

/**
 * HOC pour envelopper facilement un composant Material UI avec l'adaptateur
 * @param {React.ComponentType} Component - Composant Material UI à envelopper
 * @param {string} componentName - Nom du composant (pour le reporting)
 */
export const withMUIErrorHandling = (Component, componentName) => {
  const WithErrorHandling = (props) => (
    <MaterialUIErrorAdapter componentName={componentName || Component.displayName || Component.name}>
      <Component {...props} />
    </MaterialUIErrorAdapter>
  );
  
  WithErrorHandling.displayName = `WithMUIErrorHandling(${componentName || Component.displayName || Component.name})`;
  
  return WithErrorHandling;
};
