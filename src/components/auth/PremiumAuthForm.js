import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { TextField, Checkbox } from '../common/PremiumFormFields';
import '../../design-system/styles/glassmorphism.scss';
import './PremiumAuthForm.css';

/**
 * Formulaire d'authentification premium avec animations et effets visuels
 * 
 * Ce composant s'intègre parfaitement avec le middleware d'authentification backend,
 * offrant un processus de connexion et d'inscription fluide et sécurisé
 */
const PremiumAuthForm = ({
  type = 'login', // 'login', 'register', 'forgot-password'
  onSubmit,
  onToggleForm,
  onForgotPassword,
  loading = false,
  error = null,
  className = ''
}) => {
  // États pour les formulaires
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // États pour la validation
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  
  // Réinitialisation des erreurs en cas de changement de type de formulaire
  useEffect(() => {
    setErrors({});
    setTouched({});
    setSubmitAttempted(false);
  }, [type]);
  
  // Validation des champs
  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        return !value || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value) 
          ? 'Adresse email invalide' 
          : '';
      case 'password':
        return !value || value.length < 8 
          ? 'Le mot de passe doit contenir au moins 8 caractères' 
          : '';
      case 'confirmPassword':
        return value !== password 
          ? 'Les mots de passe ne correspondent pas' 
          : '';
      case 'firstName':
      case 'lastName':
        return !value 
          ? `Le ${name === 'firstName' ? 'prénom' : 'nom'} est requis` 
          : '';
      default:
        return '';
    }
  };
  
  // Mise à jour des champs avec validation
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    // Mise à jour de l'état correspondant
    switch (name) {
      case 'email': setEmail(value); break;
      case 'password': setPassword(value); break;
      case 'confirmPassword': setConfirmPassword(value); break;
      case 'firstName': setFirstName(value); break;
      case 'lastName': setLastName(value); break;
      case 'rememberMe': setRememberMe(checked); break;
      default: break;
    }
    
    // Validation
    if (touched[name] || submitAttempted) {
      setErrors(prev => ({
        ...prev,
        [name]: validateField(name, newValue)
      }));
    }
  };
  
  // Marquer un champ comme "touché" lors du focus
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };
  
  // Valider tous les champs requis pour le type de formulaire actuel
  const validateForm = () => {
    const fieldsToValidate = {
      login: ['email', 'password'],
      register: ['email', 'password', 'confirmPassword', 'firstName', 'lastName'],
      'forgot-password': ['email']
    };
    
    const requiredFields = fieldsToValidate[type];
    const newErrors = {};
    
    requiredFields.forEach(field => {
      const fieldValue = {
        email,
        password,
        confirmPassword,
        firstName,
        lastName
      }[field];
      
      const error = validateField(field, fieldValue);
      if (error) {
        newErrors[field] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitAttempted(true);
    
    if (validateForm()) {
      const formData = {
        email,
        password,
        ...(type === 'register' && {
          confirmPassword,
          firstName,
          lastName
        }),
        ...(type === 'login' && {
          rememberMe
        })
      };
      
      onSubmit(formData);
    }
  };
  
  // Basculer l'affichage du mot de passe
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };
  
  // Animations pour le formulaire
  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    }
  };
  
  // Configuration du formulaire selon le type
  const formConfig = {
    login: {
      title: 'Connexion',
      submitText: 'Se connecter',
      toggleText: 'Pas encore de compte ?',
      toggleAction: 'Créer un compte',
      forgotText: 'Mot de passe oublié ?',
      hasRememberMe: true
    },
    register: {
      title: 'Créer un compte',
      submitText: 'S\'inscrire',
      toggleText: 'Déjà un compte ?',
      toggleAction: 'Se connecter',
      forgotText: null,
      hasRememberMe: false
    },
    'forgot-password': {
      title: 'Réinitialiser le mot de passe',
      submitText: 'Envoyer le lien',
      toggleText: 'Retour à la',
      toggleAction: 'connexion',
      forgotText: null,
      hasRememberMe: false
    }
  };
  
  const { title, submitText, toggleText, toggleAction, forgotText, hasRememberMe } = formConfig[type];
  
  return (
    <div className={`auth-form-container glass glass--premium ${className}`}>
      <AnimatePresence mode="wait">
        <motion.form
          key={type}
          className="auth-form"
          onSubmit={handleSubmit}
          variants={formVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div className="auth-form__header" variants={itemVariants}>
            <h2 className="auth-form__title">{title}</h2>
          </motion.div>
          
          {error && (
            <motion.div 
              className="auth-form__error"
              variants={itemVariants}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}
          
          <div className="auth-form__fields">
            {/* Champs nom et prénom pour l'inscription */}
            {type === 'register' && (
              <motion.div className="auth-form__name-fields" variants={itemVariants}>
                <TextField
                  id="firstName"
                  name="firstName"
                  label="Prénom"
                  value={firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.firstName || submitAttempted ? errors.firstName : ''}
                  required
                  disabled={loading}
                  variant="filled"
                  size="medium"
                />
                
                <TextField
                  id="lastName"
                  name="lastName"
                  label="Nom"
                  value={lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.lastName || submitAttempted ? errors.lastName : ''}
                  required
                  disabled={loading}
                  variant="filled"
                  size="medium"
                />
              </motion.div>
            )}
            
            {/* Champ email pour tous les types de formulaire */}
            <motion.div variants={itemVariants}>
              <TextField
                id="email"
                name="email"
                type="email"
                label="Adresse email"
                value={email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.email || submitAttempted ? errors.email : ''}
                required
                disabled={loading}
                variant="filled"
                size="medium"
                fullWidth
                icon={
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V8L12 13L20 8V18ZM12 11L4 6H20L12 11Z" />
                  </svg>
                }
              />
            </motion.div>
            
            {/* Champs de mot de passe (sauf pour réinitialisation) */}
            {type !== 'forgot-password' && (
              <motion.div variants={itemVariants}>
                <TextField
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Mot de passe"
                  value={password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password || submitAttempted ? errors.password : ''}
                  required
                  disabled={loading}
                  variant="filled"
                  size="medium"
                  fullWidth
                  icon={
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                      <path d="M12 17C10.89 17 10 16.1 10 15C10 13.89 10.89 13 12 13C13.1 13 14 13.89 14 15C14 16.1 13.1 17 12 17ZM18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM8.9 6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8H8.9V6ZM18 20H6V10H18V20Z" />
                    </svg>
                  }
                  endIcon={
                    <div onClick={togglePasswordVisibility}>
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <path d="M12 6C15.79 6 19.17 8.13 20.82 11.5C19.17 14.87 15.79 17 12 17C8.21 17 4.83 14.87 3.18 11.5C4.83 8.13 8.21 6 12 6ZM12 4C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 11.5C21.27 7.11 17 4 12 4ZM12 9C13.38 9 14.5 10.12 14.5 11.5C14.5 12.88 13.38 14 12 14C10.62 14 9.5 12.88 9.5 11.5C9.5 10.12 10.62 9 12 9ZM12 7C9.52 7 7.5 9.02 7.5 11.5C7.5 13.98 9.52 16 12 16C14.48 16 16.5 13.98 16.5 11.5C16.5 9.02 14.48 7 12 7Z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <path d="M12 6C15.79 6 19.17 8.13 20.82 11.5C20.23 12.72 19.4 13.77 18.41 14.62L19.82 16.03C21.21 14.8 22.31 13.26 23 11.5C21.27 7.11 17 4 12 4C10.73 4 9.51 4.2 8.36 4.57L10.01 6.22C10.66 6.09 11.32 6 12 6ZM10.93 7.14L13 9.21C13.57 9.46 14.03 9.92 14.28 10.49L16.35 12.56C16.43 12.22 16.5 11.86 16.5 11.5C16.5 9.02 14.48 7 12 7C11.64 7 11.28 7.07 10.93 7.14ZM2.01 3.87L4.69 6.55C3.06 7.83 1.77 9.53 1 11.5C2.73 15.89 7 19 12 19C13.52 19 14.98 18.71 16.32 18.18L19.74 21.6L21.15 20.19L3.42 2.45L2.01 3.87ZM9.51 11.37L12.12 13.98C12.08 14 12.04 14 12 14C10.62 14 9.5 12.88 9.5 11.5C9.5 11.45 9.5 11.42 9.51 11.37ZM6.11 7.97L7.86 9.72C7.63 10.27 7.5 10.87 7.5 11.5C7.5 13.98 9.52 16 12 16C12.63 16 13.23 15.87 13.77 15.64L14.75 16.62C13.87 16.86 12.95 17 12 17C8.21 17 4.83 14.87 3.18 11.5C3.88 10.07 4.9 8.89 6.11 7.97Z" />
                        </svg>
                      )}
                    </div>
                  }
                  onEndIconClick={togglePasswordVisibility}
                />
              </motion.div>
            )}
            
            {/* Confirmation de mot de passe pour l'inscription */}
            {type === 'register' && (
              <motion.div variants={itemVariants}>
                <TextField
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  label="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.confirmPassword || submitAttempted ? errors.confirmPassword : ''}
                  required
                  disabled={loading}
                  variant="filled"
                  size="medium"
                  fullWidth
                />
              </motion.div>
            )}
            
            {/* Option "Se souvenir de moi" pour la connexion */}
            {type === 'login' && hasRememberMe && (
              <motion.div className="auth-form__remember-forgot" variants={itemVariants}>
                <Checkbox
                  id="rememberMe"
                  name="rememberMe"
                  label="Se souvenir de moi"
                  checked={rememberMe}
                  onChange={handleChange}
                  size="small"
                  disabled={loading}
                />
                
                {forgotText && onForgotPassword && (
                  <button
                    type="button"
                    className="auth-form__forgot-button"
                    onClick={onForgotPassword}
                    disabled={loading}
                  >
                    {forgotText}
                  </button>
                )}
              </motion.div>
            )}
          </div>
          
          <motion.button
            type="submit"
            className="auth-form__submit-button glass glass--button"
            disabled={loading}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <div className="auth-form__spinner"></div>
            ) : (
              submitText
            )}
          </motion.button>
          
          {onToggleForm && (
            <motion.div className="auth-form__toggle" variants={itemVariants}>
              <span className="auth-form__toggle-text">{toggleText}</span>
              <button
                type="button"
                className="auth-form__toggle-button"
                onClick={() => onToggleForm(type === 'login' ? 'register' : 'login')}
                disabled={loading}
              >
                {toggleAction}
              </button>
            </motion.div>
          )}
          
          {type === 'login' && (
            <motion.div className="auth-form__social" variants={itemVariants}>
              <div className="auth-form__social-divider">
                <span>Ou connectez-vous avec</span>
              </div>
              
              <div className="auth-form__social-buttons">
                <button
                  type="button"
                  className="auth-form__social-button auth-form__social-button--strava"
                  disabled={loading}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#FC4C02" d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                  </svg>
                  <span>Strava</span>
                </button>
                <button
                  type="button"
                  className="auth-form__social-button auth-form__social-button--google"
                  disabled={loading}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Google</span>
                </button>
              </div>
            </motion.div>
          )}
        </motion.form>
      </AnimatePresence>
      
      <div className="auth-form__decoration">
        <div className="auth-form__decoration-circle auth-form__decoration-circle--1"></div>
        <div className="auth-form__decoration-circle auth-form__decoration-circle--2"></div>
        <div className="auth-form__decoration-circle auth-form__decoration-circle--3"></div>
      </div>
    </div>
  );
};

PremiumAuthForm.propTypes = {
  type: PropTypes.oneOf(['login', 'register', 'forgot-password']),
  onSubmit: PropTypes.func.isRequired,
  onToggleForm: PropTypes.func,
  onForgotPassword: PropTypes.func,
  loading: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string
};

export default PremiumAuthForm;
