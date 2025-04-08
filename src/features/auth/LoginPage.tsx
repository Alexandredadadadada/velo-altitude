/**
 * Login Page Component
 * 
 * Provides authentication using the enhanced PremiumAuthForm
 * Integrates with Auth0 for secure authentication
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './authContext';
import PremiumAuthForm from '../../components/auth/PremiumAuthForm';
import monitoringService from '../../monitoring';
import styles from './AuthPages.module.css';

const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading, login, error: authError } = useAuth();
  const [formType, setFormType] = useState<'login' | 'register' | 'forgot-password'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Get redirect path from localStorage or state
      const redirectPath = localStorage.getItem('auth_redirect_uri') || '/';
      localStorage.removeItem('auth_redirect_uri'); // Clean up
      navigate(redirectPath);
      monitoringService.trackEvent('login_auto_redirect', { redirectPath });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Handle form submission
  const handleSubmit = async (formData: any) => {
    try {
      setLoading(true);
      setError(null);

      if (formType === 'login') {
        // Use Auth0 for login
        login();
        monitoringService.trackEvent('login_attempt');
      } else if (formType === 'register') {
        // For registration, also use Auth0
        login();
        monitoringService.trackEvent('registration_attempt');
      } else if (formType === 'forgot-password') {
        // Handle password reset (currently redirects to Auth0)
        login();
        monitoringService.trackEvent('password_reset_attempt');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Une erreur est survenue lors de l\'authentification.');
      monitoringService.trackError('auth_form_error', err as Error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle between login and register forms
  const handleToggleForm = (type: 'login' | 'register' | 'forgot-password') => {
    setFormType(type);
    setError(null);
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    setFormType('forgot-password');
    setError(null);
  };

  // If still checking authentication status, show loading
  if (isLoading) {
    return (
      <div className={styles.authPageContainer}>
        <div className={styles.loadingSpinner}>
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authPageContainer}>
      <div className={styles.authFormContainer}>
        <PremiumAuthForm
          type={formType}
          onSubmit={handleSubmit}
          onToggleForm={handleToggleForm}
          onForgotPassword={handleForgotPassword}
          loading={loading}
          error={error || authError}
        />
      </div>
      
      <div className={styles.authInfo}>
        <h2>{formType === 'login' ? 'Connexion à Velo-Altitude' : 
             formType === 'register' ? 'Créer un compte' : 
             'Réinitialiser le mot de passe'}</h2>
        
        <div className={styles.authFeatures}>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>🔒</span>
            <span>Authentification sécurisée avec Auth0</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>🌦️</span>
            <span>Accès aux données météo des cols</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>🗺️</span>
            <span>Visualisations 3D personnalisées</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>📱</span>
            <span>Accessible sur tous vos appareils</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
