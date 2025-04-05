import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ErrorDisplay from './ErrorDisplay';

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the app
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to error monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // You could add Sentry, LogRocket, or other error reporting here
    if (process.env.NODE_ENV === 'production' && window.trackError) {
      window.trackError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  }

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { fallback, children } = this.props;
    
    if (hasError) {
      // You can render any custom fallback UI
      if (fallback) {
        return typeof fallback === 'function' 
          ? fallback(error, this.resetError) 
          : fallback;
      }
      
      return (
        <ErrorDisplay 
          message="Une erreur inattendue s'est produite"
          error={error}
          retry={this.resetError}
          errorInfo={errorInfo}
        />
      );
    }

    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func])
};

export default ErrorBoundary;
