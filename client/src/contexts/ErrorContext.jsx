import React, { createContext, useContext, useReducer, useCallback } from 'react';
import PropTypes from 'prop-types';
import ErrorNotification from '../components/common/ErrorNotification';

// Création du contexte
const ErrorContext = createContext();

// Actions pour le reducer
const ERROR_ACTIONS = {
  ADD_ERROR: 'ADD_ERROR',
  REMOVE_ERROR: 'REMOVE_ERROR',
  CLEAR_ERRORS: 'CLEAR_ERRORS'
};

// Reducer pour gérer l'état des erreurs
const errorReducer = (state, action) => {
  switch (action.type) {
    case ERROR_ACTIONS.ADD_ERROR:
      // Éviter les doublons en vérifiant si une erreur avec le même ID existe déjà
      if (state.some(error => error.id === action.payload.id)) {
        return state;
      }
      return [...state, action.payload];
    
    case ERROR_ACTIONS.REMOVE_ERROR:
      return state.filter(error => error.id !== action.payload);
    
    case ERROR_ACTIONS.CLEAR_ERRORS:
      return [];
    
    default:
      return state;
  }
};

/**
 * Fournisseur de contexte pour la gestion des erreurs
 */
export const ErrorProvider = ({ children }) => {
  // État des erreurs avec le reducer
  const [errors, dispatch] = useReducer(errorReducer, []);

  // Ajouter une erreur
  const addError = useCallback((error) => {
    // Si l'erreur n'a pas d'ID, en générer un
    if (!error.id) {
      error.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    dispatch({
      type: ERROR_ACTIONS.ADD_ERROR,
      payload: error
    });
    
    return error.id;
  }, []);

  // Supprimer une erreur
  const removeError = useCallback((errorId) => {
    dispatch({
      type: ERROR_ACTIONS.REMOVE_ERROR,
      payload: errorId
    });
  }, []);

  // Effacer toutes les erreurs
  const clearErrors = useCallback(() => {
    dispatch({ type: ERROR_ACTIONS.CLEAR_ERRORS });
  }, []);

  // Intercepter les erreurs d'API et les afficher automatiquement
  const handleApiError = useCallback((error) => {
    // Vérifier si l'erreur vient de notre API et contient déjà une structure d'erreur
    if (error.response?.data?.error) {
      addError(error.response.data.error);
      return error.response.data.error.id;
    }
    
    // Sinon, créer une erreur standard
    const errorObj = {
      type: 'api_error',
      message: error.message || 'Une erreur est survenue lors de la communication avec le serveur',
      severity: 'error',
      details: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method
      },
      notification: {
        type: 'toast',
        position: 'top-right',
        autoClose: 8000,
        requireConfirmation: false
      }
    };
    
    return addError(errorObj);
  }, [addError]);

  // Valeur du contexte
  const contextValue = {
    errors,
    addError,
    removeError,
    clearErrors,
    handleApiError
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
      
      {/* Afficher les notifications d'erreur */}
      {errors.map(error => (
        <ErrorNotification
          key={error.id}
          error={error}
          onClose={removeError}
          onConfirm={removeError}
        />
      ))}
    </ErrorContext.Provider>
  );
};

ErrorProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Hook personnalisé pour utiliser le contexte d'erreur
export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError doit être utilisé à l\'intérieur d\'un ErrorProvider');
  }
  return context;
};

export default ErrorContext;
