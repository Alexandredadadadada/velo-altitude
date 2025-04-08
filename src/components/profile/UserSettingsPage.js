import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TextField, TextArea, Checkbox, RadioGroup } from '../common/PremiumFormFields';
import PremiumLoaders from '../common/PremiumLoaders';
import EmptyStates from '../common/EmptyStates';
import { ProfileTabs } from './ProfileTabs';
import { NotificationSettings } from './NotificationSettings';
import { PrivacySettings } from './PrivacySettings';
import '../../design-system/styles/glassmorphism.scss';
import './UserSettingsPage.css';

/**
 * Page de paramètres utilisateur premium
 * 
 * Cette interface permet aux utilisateurs de gérer leur profil, 
 * leurs préférences et leurs informations personnelles avec une 
 * expérience visuelle élégante et immersive
 */
const UserSettingsPage = ({ userId, isUserLoggedIn = true }) => {
  // États pour les différentes sections de paramètres
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Données utilisateur
  const [userProfile, setUserProfile] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    location: '',
    birthdate: '',
    gender: '',
    weight: '',
    height: '',
    profileVisibility: 'public',
    activityVisibility: 'friends',
    language: 'fr',
    units: 'metric',
    theme: 'system',
    newsletterSubscription: true,
    stravaConnected: false
  });
  
  // État pour les erreurs de formulaire
  const [formErrors, setFormErrors] = useState({});
  
  // Récupération des données utilisateur depuis l'API
  useEffect(() => {
    if (isUserLoggedIn && userId) {
      const fetchUserProfile = async () => {
        setLoading(true);
        setError(null);
        
        try {
          // Simuler un appel API au service de profil utilisateur
          // À remplacer par un véritable appel API
          const mockApiCall = () => {
            return new Promise((resolve) => {
              setTimeout(() => {
                resolve({
                  id: userId,
                  firstName: 'Thomas',
                  lastName: 'Dupont',
                  email: 'thomas.dupont@example.com',
                  bio: 'Passionné de cyclisme et d\'ascensions en montagne.',
                  location: 'Strasbourg, France',
                  birthdate: '1988-05-15',
                  gender: 'male',
                  weight: '72',
                  height: '178',
                  profileVisibility: 'public',
                  activityVisibility: 'friends',
                  language: 'fr',
                  units: 'metric',
                  theme: 'system',
                  newsletterSubscription: true,
                  stravaConnected: true,
                  stravaData: {
                    username: 'thomas_dupont',
                    profileUrl: 'https://www.strava.com/athletes/12345678',
                    lastSync: '2025-04-06T14:30:00Z'
                  }
                });
              }, 1500);
            });
          };
          
          // Récupérer les données
          const data = await mockApiCall();
          setUserProfile(data);
          setFormData(data);
          setLoading(false);
        } catch (err) {
          setError('Impossible de charger les données du profil. Veuillez réessayer.');
          setLoading(false);
        }
      };
      
      fetchUserProfile();
    }
  }, [isUserLoggedIn, userId]);
  
  // Gestion des changements de champs de formulaire
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    // Effacer le message de succès lors de la modification
    if (successMessage) {
      setSuccessMessage('');
    }
    
    // Mise à jour du formulaire
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Valider le champ modifié
    validateField(name, newValue);
  };
  
  // Validation des champs du formulaire
  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'email':
        if (value && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
          error = 'Adresse email invalide';
        }
        break;
      case 'firstName':
      case 'lastName':
        if (value && value.length < 2) {
          error = `${name === 'firstName' ? 'Prénom' : 'Nom'} trop court`;
        }
        break;
      case 'weight':
        if (value && (isNaN(value) || parseFloat(value) <= 0 || parseFloat(value) > 250)) {
          error = 'Poids invalide';
        }
        break;
      case 'height':
        if (value && (isNaN(value) || parseFloat(value) <= 0 || parseFloat(value) > 250)) {
          error = 'Taille invalide';
        }
        break;
      case 'birthdate':
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (value && !dateRegex.test(value)) {
          error = 'Format de date invalide (AAAA-MM-JJ)';
        }
        break;
      default:
        break;
    }
    
    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));
    
    return !error;
  };
  
  // Validation complète du formulaire
  const validateForm = () => {
    const fieldsToValidate = ['email', 'firstName', 'lastName', 'weight', 'height', 'birthdate'];
    let isValid = true;
    
    fieldsToValidate.forEach(field => {
      if (!validateField(field, formData[field])) {
        isValid = false;
      }
    });
    
    return isValid;
  };
  
  // Enregistrement des modifications
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    setSavingChanges(true);
    setError(null);
    
    try {
      // Simuler un appel API pour sauvegarder les données
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mise à jour du profil avec les nouvelles données
      setUserProfile({...formData});
      setIsEditing(false);
      setSavingChanges(false);
      setSuccessMessage('Vos modifications ont été enregistrées avec succès.');
      
      // Masquer le message de succès après 5 secondes
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      setError('Une erreur est survenue lors de l\'enregistrement des modifications.');
      setSavingChanges(false);
    }
  };
  
  // Annulation des modifications
  const handleCancel = () => {
    setFormData(userProfile);
    setFormErrors({});
    setIsEditing(false);
    setSuccessMessage('');
  };
  
  // Déconnexion du compte Strava
  const handleDisconnectStrava = async () => {
    setSavingChanges(true);
    
    try {
      // Simuler un appel API pour déconnecter Strava
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFormData(prev => ({
        ...prev,
        stravaConnected: false,
        stravaData: null
      }));
      
      setSavingChanges(false);
      setSuccessMessage('Votre compte Strava a été déconnecté avec succès.');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      setError('Une erreur est survenue lors de la déconnexion de Strava.');
      setSavingChanges(false);
    }
  };
  
  // Connexion au compte Strava
  const handleConnectStrava = async () => {
    setSavingChanges(true);
    
    try {
      // Simuler un appel API pour connecter Strava
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFormData(prev => ({
        ...prev,
        stravaConnected: true,
        stravaData: {
          username: 'thomas_dupont',
          profileUrl: 'https://www.strava.com/athletes/12345678',
          lastSync: new Date().toISOString()
        }
      }));
      
      setSavingChanges(false);
      setSuccessMessage('Votre compte Strava a été connecté avec succès.');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (err) {
      setError('Une erreur est survenue lors de la connexion à Strava.');
      setSavingChanges(false);
    }
  };
  
  // Si l'utilisateur n'est pas connecté, afficher un état vide
  if (!isUserLoggedIn) {
    return (
      <div className="user-settings-page">
        <EmptyStates.ProfileEmptyState
          onConnect={() => {}}
          onSignUp={() => {}}
          serviceName="Strava"
        />
      </div>
    );
  }
  
  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <div className="user-settings-page user-settings-page--loading">
        <PremiumLoaders.PulseLoader size="large" />
      </div>
    );
  }
  
  // Afficher un message d'erreur en cas d'échec de chargement
  if (error && !userProfile) {
    return (
      <div className="user-settings-page">
        <EmptyStates.BasicEmptyState
          icon="⚠️"
          title="Erreur de chargement"
          description={error}
          actionLabel="Réessayer"
          onAction={() => window.location.reload()}
          variant="centered"
        />
      </div>
    );
  }
  
  // Animations pour les éléments de la page
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    }
  };
  
  return (
    <div className="user-settings-page">
      <motion.div 
        className="user-settings-container glass glass--premium"
        variants={pageVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div className="user-settings-header" variants={itemVariants}>
          <h1 className="user-settings-title">Paramètres du compte</h1>
          <p className="user-settings-subtitle">
            Gérez vos informations personnelles et vos préférences
          </p>
        </motion.div>
        
        {successMessage && (
          <motion.div 
            className="user-settings-success"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {successMessage}
          </motion.div>
        )}
        
        {error && (
          <motion.div 
            className="user-settings-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {error}
          </motion.div>
        )}
        
        <motion.div className="user-settings-tabs" variants={itemVariants}>
          <ProfileTabs 
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </motion.div>
        
        <motion.div className="user-settings-content" variants={itemVariants}>
          {activeTab === 'profile' && (
            <div className="user-settings-profile">
              <div className="user-settings-section">
                <h2 className="user-settings-section-title">Informations personnelles</h2>
                
                <div className="user-settings-form-row">
                  <TextField
                    id="firstName"
                    name="firstName"
                    label="Prénom"
                    value={formData.firstName}
                    onChange={handleChange}
                    error={formErrors.firstName}
                    disabled={!isEditing}
                    variant="filled"
                    size="medium"
                  />
                  
                  <TextField
                    id="lastName"
                    name="lastName"
                    label="Nom"
                    value={formData.lastName}
                    onChange={handleChange}
                    error={formErrors.lastName}
                    disabled={!isEditing}
                    variant="filled"
                    size="medium"
                  />
                </div>
                
                <div className="user-settings-form-row">
                  <TextField
                    id="email"
                    name="email"
                    label="Adresse email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={formErrors.email}
                    disabled={!isEditing}
                    variant="filled"
                    size="medium"
                    fullWidth
                  />
                </div>
                
                <div className="user-settings-form-row">
                  <TextArea
                    id="bio"
                    name="bio"
                    label="Biographie"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Parlez de vous, de votre passion pour le cyclisme..."
                    disabled={!isEditing}
                    rows={4}
                    variant="filled"
                    size="medium"
                    fullWidth
                  />
                </div>
                
                <div className="user-settings-form-row">
                  <TextField
                    id="location"
                    name="location"
                    label="Localisation"
                    value={formData.location}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Ville, Pays"
                    variant="filled"
                    size="medium"
                    fullWidth
                  />
                </div>
              </div>
              
              <div className="user-settings-section">
                <h2 className="user-settings-section-title">Données sportives</h2>
                
                <div className="user-settings-form-row">
                  <TextField
                    id="birthdate"
                    name="birthdate"
                    label="Date de naissance"
                    type="date"
                    value={formData.birthdate}
                    onChange={handleChange}
                    error={formErrors.birthdate}
                    disabled={!isEditing}
                    variant="filled"
                    size="medium"
                    helperText="Format : AAAA-MM-JJ"
                  />
                  
                  <RadioGroup
                    name="gender"
                    label="Genre"
                    options={[
                      { label: 'Homme', value: 'male' },
                      { label: 'Femme', value: 'female' },
                      { label: 'Non précisé', value: 'other' }
                    ]}
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={!isEditing}
                    direction="horizontal"
                  />
                </div>
                
                <div className="user-settings-form-row">
                  <TextField
                    id="weight"
                    name="weight"
                    label="Poids (kg)"
                    type="number"
                    value={formData.weight}
                    onChange={handleChange}
                    error={formErrors.weight}
                    disabled={!isEditing}
                    variant="filled"
                    size="medium"
                  />
                  
                  <TextField
                    id="height"
                    name="height"
                    label="Taille (cm)"
                    type="number"
                    value={formData.height}
                    onChange={handleChange}
                    error={formErrors.height}
                    disabled={!isEditing}
                    variant="filled"
                    size="medium"
                  />
                </div>
              </div>
              
              <div className="user-settings-section">
                <h2 className="user-settings-section-title">Intégration Strava</h2>
                
                <div className="user-settings-strava">
                  {formData.stravaConnected ? (
                    <div className="user-settings-strava-connected">
                      <div className="user-settings-strava-info">
                        <div className="user-settings-strava-logo">
                          <svg viewBox="0 0 24 24" width="32" height="32">
                            <path fill="#FC4C02" d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                          </svg>
                        </div>
                        <div className="user-settings-strava-details">
                          <h3 className="user-settings-strava-username">
                            {formData.stravaData?.username || 'Utilisateur Strava'}
                          </h3>
                          <p className="user-settings-strava-sync">
                            Dernière synchronisation : {formData.stravaData?.lastSync 
                              ? new Date(formData.stravaData.lastSync).toLocaleString() 
                              : 'Non disponible'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="user-settings-strava-actions">
                        <button 
                          className="user-settings-strava-sync-button glass glass--button"
                          disabled={!isEditing || savingChanges}
                        >
                          Synchroniser maintenant
                        </button>
                        
                        <button 
                          className="user-settings-strava-disconnect-button"
                          onClick={handleDisconnectStrava}
                          disabled={!isEditing || savingChanges}
                        >
                          Déconnecter
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="user-settings-strava-disconnected">
                      <p className="user-settings-strava-message">
                        Connectez votre compte Strava pour synchroniser automatiquement vos activités et performances.
                      </p>
                      
                      <button 
                        className="user-settings-strava-connect-button"
                        onClick={handleConnectStrava}
                        disabled={!isEditing || savingChanges}
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20">
                          <path fill="#FFFFFF" d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                        </svg>
                        <span>Connecter avec Strava</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'preferences' && (
            <div className="user-settings-preferences">
              <div className="user-settings-section">
                <h2 className="user-settings-section-title">Préférences d'affichage</h2>
                
                <div className="user-settings-form-row">
                  <RadioGroup
                    name="language"
                    label="Langue"
                    options={[
                      { label: 'Français', value: 'fr' },
                      { label: 'English', value: 'en' }
                    ]}
                    value={formData.language}
                    onChange={handleChange}
                    disabled={!isEditing}
                    direction="horizontal"
                  />
                </div>
                
                <div className="user-settings-form-row">
                  <RadioGroup
                    name="units"
                    label="Unités"
                    options={[
                      { label: 'Métrique (km, m, kg)', value: 'metric' },
                      { label: 'Impérial (miles, ft, lb)', value: 'imperial' }
                    ]}
                    value={formData.units}
                    onChange={handleChange}
                    disabled={!isEditing}
                    direction="horizontal"
                  />
                </div>
                
                <div className="user-settings-form-row">
                  <RadioGroup
                    name="theme"
                    label="Thème"
                    options={[
                      { label: 'Clair', value: 'light' },
                      { label: 'Sombre', value: 'dark' },
                      { label: 'Système', value: 'system' }
                    ]}
                    value={formData.theme}
                    onChange={handleChange}
                    disabled={!isEditing}
                    direction="horizontal"
                  />
                </div>
              </div>
              
              <div className="user-settings-section">
                <h2 className="user-settings-section-title">Confidentialité</h2>
                
                <div className="user-settings-form-row">
                  <RadioGroup
                    name="profileVisibility"
                    label="Visibilité du profil"
                    options={[
                      { label: 'Public', value: 'public' },
                      { label: 'Amis seulement', value: 'friends' },
                      { label: 'Privé', value: 'private' }
                    ]}
                    value={formData.profileVisibility}
                    onChange={handleChange}
                    disabled={!isEditing}
                    direction="horizontal"
                  />
                </div>
                
                <div className="user-settings-form-row">
                  <RadioGroup
                    name="activityVisibility"
                    label="Visibilité des activités"
                    options={[
                      { label: 'Public', value: 'public' },
                      { label: 'Amis seulement', value: 'friends' },
                      { label: 'Privé', value: 'private' }
                    ]}
                    value={formData.activityVisibility}
                    onChange={handleChange}
                    disabled={!isEditing}
                    direction="horizontal"
                  />
                </div>
              </div>
              
              <div className="user-settings-section">
                <h2 className="user-settings-section-title">Communications</h2>
                
                <div className="user-settings-form-row">
                  <Checkbox
                    id="newsletterSubscription"
                    name="newsletterSubscription"
                    label="S'abonner à la newsletter (actualités, nouveaux parcours et événements)"
                    checked={formData.newsletterSubscription}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'notifications' && (
            <NotificationSettings
              isEditing={isEditing}
              formData={formData}
              onChange={handleChange}
            />
          )}
          
          {activeTab === 'privacy' && (
            <PrivacySettings
              isEditing={isEditing}
              formData={formData}
              onChange={handleChange}
            />
          )}
        </motion.div>
        
        <motion.div className="user-settings-actions" variants={itemVariants}>
          {isEditing ? (
            <>
              <button 
                className="user-settings-cancel-button"
                onClick={handleCancel}
                disabled={savingChanges}
              >
                Annuler
              </button>
              
              <button 
                className="user-settings-save-button glass glass--button"
                onClick={handleSave}
                disabled={savingChanges}
              >
                {savingChanges ? (
                  <div className="user-settings-spinner"></div>
                ) : (
                  'Enregistrer les modifications'
                )}
              </button>
            </>
          ) : (
            <button 
              className="user-settings-edit-button glass glass--button"
              onClick={() => setIsEditing(true)}
            >
              Modifier le profil
            </button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default UserSettingsPage;
