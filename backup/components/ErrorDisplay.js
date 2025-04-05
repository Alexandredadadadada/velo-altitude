import React from 'react';
import PropTypes from 'prop-types';

/**
 * ErrorDisplay Component
 * Displays error messages to users with optional retry functionality
 * and detailed error information for developers in development mode
 */
const ErrorDisplay = ({ 
  message, 
  error, 
  retry = null, 
  className = '',
  showDetails = process.env.NODE_ENV !== 'production'
}) => {
  // Format error details if available
  const getErrorDetails = () => {
    if (!error) return null;
    
    let details = '';
    
    if (typeof error === 'string') {
      details = error;
    } else if (error instanceof Error) {
      details = `${error.name}: ${error.message}`;
      if (error.stack && process.env.NODE_ENV !== 'production') {
        details += `\n${error.stack}`;
      }
    } else if (typeof error === 'object') {
      try {
        details = JSON.stringify(error, null, 2);
      } catch (e) {
        details = 'Error object could not be serialized';
      }
    }
    
    return details;
  };
  
  const errorDetails = getErrorDetails();
  
  return (
    <div 
      className={`error-display ${className}`}
      role="alert"
      aria-live="assertive"
      style={{
        padding: '1.5rem',
        borderRadius: '8px',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        border: '1px solid rgba(244, 67, 54, 0.3)',
        color: '#d32f2f',
        margin: '1rem 0',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
    >
      <div className="error-icon" style={{ marginBottom: '1rem' }}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      
      <h3 className="error-title" style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>
        {message || 'Une erreur est survenue'}
      </h3>
      
      {showDetails && errorDetails && (
        <div className="error-details" style={{
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          padding: '0.75rem',
          borderRadius: '4px',
          marginTop: '1rem',
          marginBottom: '1rem',
          overflowX: 'auto',
          fontSize: '0.9rem',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap'
        }}>
          {errorDetails}
        </div>
      )}
      
      {retry && (
        <button 
          onClick={retry}
          className="retry-button"
          style={{
            backgroundColor: '#d32f2f',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
            marginTop: '1rem',
            transition: 'background-color 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b71c1c'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#d32f2f'}
        >
          Réessayer
        </button>
      )}
    </div>
  );
};

ErrorDisplay.propTypes = {
  message: PropTypes.string,
  error: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.instanceOf(Error)
  ]),
  retry: PropTypes.func,
  className: PropTypes.string,
  showDetails: PropTypes.bool
};

export default ErrorDisplay;
