import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppRouter from './AppRouter';
import { SnackbarProvider } from 'notistack';
import { AnimatePresence } from 'framer-motion';
import ErrorBoundary from './components/error/ErrorBoundary';
import NotificationSystem from './components/notification/NotificationSystem';
import monitoringService from './services/monitoring/MonitoringService';
import AuthOptimizationBridge from './components/optimization/AuthOptimizationBridge';
// Importer le thème WOW depuis le design-system
import veloAltitudeTheme, { darkTheme as veloAltitudeDarkTheme } from './design-system/theme';
import './App.css';

interface ErrorData {
  error: Error;
  errorInfo?: React.ErrorInfo;
  moduleName?: string;
}

const App: React.FC = () => {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode === 'dark' || savedMode === 'light') ? savedMode : 'light';
  });

  const theme = mode === 'light' ? veloAltitudeTheme : veloAltitudeDarkTheme;

  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode');
    if (savedMode && (savedMode === 'light' || savedMode === 'dark')) {
      setMode(savedMode);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setMode('dark');
    }

    // Écouter les changements de préférence
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('themeMode')) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  useEffect(() => {
    // Initialiser avec l'ID de l'utilisateur si disponible
    const userId = localStorage.getItem('userId') || 'anonymous';
    monitoringService.init(userId);
    
    // Log de démarrage de l'application
    console.log('[App] Application démarrée avec succès');
  }, []);

  const toggleTheme = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  // Gestionnaire global des erreurs
  const handleApplicationError = (errorData: ErrorData) => {
    console.error('[App] Erreur globale capturée:', errorData);
    monitoringService.trackError(errorData.error, {
      componentStack: errorData.errorInfo?.componentStack,
      moduleName: errorData.moduleName || 'App'
    });
  };

  return (
    <ErrorBoundary 
      moduleName="Application" 
      onError={handleApplicationError}
      showErrorDetails={process.env.NODE_ENV !== 'production'}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {AnimatePresence({
          children: (
            <div key="app-router">
              <SnackbarProvider 
                maxSnack={3} 
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                autoHideDuration={4000}
              >
                <>
                  {/* Composant pont entre le système d'authentification et le registre d'optimisation */}
                  <AuthOptimizationBridge />
                  
                  {/* Bouton de bascule de thème */}
                  <div className="theme-toggle-container">
                    <button 
                      onClick={toggleTheme}
                      className={`theme-toggle-button ${mode}`}
                      aria-label={mode === 'light' ? 'Passer au mode sombre' : 'Passer au mode clair'}
                    >
                      {mode === 'light' ? '🌙' : '☀️'}
                    </button>
                  </div>
                  
                  <AppRouter />
                </>
                <NotificationSystem maxNotifications={5} />
              </SnackbarProvider>
            </div>
          )
        })}
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
