import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { RadioGroup, Checkbox } from '../common/PremiumFormFields';
import './PrivacySettings.css';

/**
 * Paramètres de confidentialité pour la page de profil utilisateur
 * 
 * Ce composant permet aux utilisateurs de gérer leurs préférences de confidentialité
 * et de sécurité en s'intégrant avec le Security Middleware et l'Authentication Middleware
 */
export const PrivacySettings = ({ isEditing, formData, onChange }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportConfirm, setShowExportConfirm] = useState(false);
  
  // Animation des sections
  const sectionVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
    }
  };
  
  return (
    <div className="privacy-settings">
      <p className="privacy-settings-intro">
        Gérez vos paramètres de confidentialité, de sécurité et vos données personnelles. 
        Ces options déterminent qui peut voir vos informations et comment vos données sont utilisées.
      </p>
      
      <motion.div 
        className="privacy-section"
        variants={sectionVariants}
        initial="initial"
        animate="animate"
      >
        <h2 className="privacy-section-title">Visibilité des données</h2>
        
        <div className="privacy-options">
          <div className="privacy-option">
            <RadioGroup
              name="profileVisibility"
              label="Profil"
              options={[
                { label: 'Public (visible par tous)', value: 'public' },
                { label: 'Amis seulement', value: 'friends' },
                { label: 'Privé (visible uniquement par vous)', value: 'private' }
              ]}
              value={formData.profileVisibility}
              onChange={onChange}
              disabled={!isEditing}
              direction="vertical"
            />
            <div className="privacy-option-description">
              Détermine qui peut voir votre profil, vos statistiques et votre historique d'activités.
            </div>
          </div>
          
          <div className="privacy-option">
            <RadioGroup
              name="activityVisibility"
              label="Activités"
              options={[
                { label: 'Public (visible par tous)', value: 'public' },
                { label: 'Amis seulement', value: 'friends' },
                { label: 'Privé (visible uniquement par vous)', value: 'private' }
              ]}
              value={formData.activityVisibility}
              onChange={onChange}
              disabled={!isEditing}
              direction="vertical"
            />
            <div className="privacy-option-description">
              Contrôle qui peut voir vos activités de cyclisme, y compris les parcours, les temps et les performances.
            </div>
          </div>
          
          <div className="privacy-option">
            <RadioGroup
              name="locationVisibility"
              label="Localisation"
              options={[
                { label: 'Précise (ville et pays)', value: 'precise' },
                { label: 'Approximative (pays uniquement)', value: 'approximate' },
                { label: 'Masquée', value: 'hidden' }
              ]}
              value={formData.locationVisibility || 'precise'}
              onChange={onChange}
              disabled={!isEditing}
              direction="vertical"
            />
            <div className="privacy-option-description">
              Détermine comment votre localisation est affichée sur votre profil et vos activités.
            </div>
          </div>
        </div>
      </motion.div>
      
      <motion.div 
        className="privacy-section"
        variants={sectionVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
      >
        <h2 className="privacy-section-title">Sécurité du compte</h2>
        
        <div className="privacy-options security-options">
          <div className="privacy-option">
            <button 
              className="change-password-button glass glass--button"
              disabled={!isEditing}
            >
              Changer le mot de passe
            </button>
            <div className="privacy-option-description">
              Il est recommandé de modifier votre mot de passe régulièrement et d'utiliser un mot de passe unique.
            </div>
          </div>
          
          <div className="privacy-option">
            <div className="two-factor-auth">
              <div className="two-factor-auth-header">
                <h3 className="two-factor-auth-title">Authentification à deux facteurs (2FA)</h3>
                <div className={`two-factor-auth-status ${formData.twoFactorEnabled ? 'enabled' : 'disabled'}`}>
                  {formData.twoFactorEnabled ? 'Activée' : 'Désactivée'}
                </div>
              </div>
              
              <div className="privacy-option-description">
                L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire en demandant une vérification 
                via votre téléphone en plus de votre mot de passe.
              </div>
              
              <button 
                className={`two-factor-auth-button glass glass--button ${formData.twoFactorEnabled ? 'disable' : 'enable'}`}
                disabled={!isEditing}
              >
                {formData.twoFactorEnabled ? 'Désactiver la 2FA' : 'Activer la 2FA'}
              </button>
            </div>
          </div>
          
          <div className="privacy-option">
            <div className="login-sessions">
              <h3 className="login-sessions-title">Sessions actives</h3>
              
              <div className="session-list">
                <div className="session-item current">
                  <div className="session-info">
                    <div className="session-device">Chrome sur Windows</div>
                    <div className="session-location">Strasbourg, France</div>
                    <div className="session-time">Actuelle</div>
                  </div>
                  <div className="session-current-badge">Cet appareil</div>
                </div>
                
                <div className="session-item">
                  <div className="session-info">
                    <div className="session-device">Firefox sur MacOS</div>
                    <div className="session-location">Paris, France</div>
                    <div className="session-time">Il y a 2 jours</div>
                  </div>
                  <button className="session-logout-button" disabled={!isEditing}>
                    Déconnecter
                  </button>
                </div>
                
                <div className="session-item">
                  <div className="session-info">
                    <div className="session-device">Application mobile (iOS)</div>
                    <div className="session-location">Strasbourg, France</div>
                    <div className="session-time">Il y a 3 heures</div>
                  </div>
                  <button className="session-logout-button" disabled={!isEditing}>
                    Déconnecter
                  </button>
                </div>
              </div>
              
              <button 
                className="logout-all-button glass glass--button"
                disabled={!isEditing}
              >
                Déconnecter tous les appareils
              </button>
            </div>
          </div>
        </div>
      </motion.div>
      
      <motion.div 
        className="privacy-section"
        variants={sectionVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
      >
        <h2 className="privacy-section-title">Données personnelles</h2>
        
        <div className="privacy-options">
          <div className="privacy-option">
            <h3 className="data-management-title">Gérer vos données</h3>
            
            <div className="data-management-actions">
              <button 
                className="export-data-button glass glass--button"
                onClick={() => setShowExportConfirm(true)}
                disabled={!isEditing || showExportConfirm}
              >
                Exporter mes données
              </button>
              
              <button 
                className="delete-account-button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={!isEditing || showDeleteConfirm}
              >
                Supprimer mon compte
              </button>
            </div>
            
            {showExportConfirm && (
              <div className="confirmation-dialog">
                <h4 className="confirmation-title">Exporter vos données</h4>
                <p className="confirmation-message">
                  Nous préparerons une archive contenant toutes vos données personnelles, activités et statistiques.
                  Vous recevrez un email avec un lien de téléchargement dans les 24 heures.
                </p>
                <div className="confirmation-actions">
                  <button 
                    className="confirmation-cancel"
                    onClick={() => setShowExportConfirm(false)}
                  >
                    Annuler
                  </button>
                  <button 
                    className="confirmation-confirm glass glass--button"
                    onClick={() => {
                      // Logique d'exportation des données
                      setShowExportConfirm(false);
                    }}
                  >
                    Confirmer l'exportation
                  </button>
                </div>
              </div>
            )}
            
            {showDeleteConfirm && (
              <div className="confirmation-dialog delete-confirmation">
                <h4 className="confirmation-title">Supprimer votre compte</h4>
                <p className="confirmation-message">
                  Attention : Cette action est irréversible. Toutes vos données, activités et statistiques seront 
                  définitivement supprimées. Votre compte ne pourra pas être récupéré.
                </p>
                <div className="delete-verification">
                  <Checkbox
                    id="delete_confirm_checkbox"
                    name="delete_confirm_checkbox"
                    label="Je comprends que cette action est irréversible"
                    checked={false}
                    onChange={() => {}}
                    variant="filled"
                    color="accent"
                  />
                </div>
                <div className="confirmation-actions">
                  <button 
                    className="confirmation-cancel"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Annuler
                  </button>
                  <button 
                    className="confirmation-confirm delete-confirm-button"
                    onClick={() => {
                      // Logique de suppression du compte
                      setShowDeleteConfirm(false);
                    }}
                  >
                    Supprimer définitivement
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="privacy-option">
            <h3 className="data-sharing-title">Partage des données</h3>
            
            <div className="data-sharing-options">
              <Checkbox
                id="data_sharing_analytics"
                name="data_sharing_analytics"
                label="Autoriser l'utilisation anonyme de mes données pour améliorer le service"
                checked={formData.dataSharing?.analytics || true}
                onChange={onChange}
                disabled={!isEditing}
                helperText="Nous utilisons des données anonymisées pour améliorer nos algorithmes et services."
              />
              
              <Checkbox
                id="data_sharing_research"
                name="data_sharing_research"
                label="Contribuer à la recherche sur les habitudes de cyclisme (anonyme)"
                checked={formData.dataSharing?.research || false}
                onChange={onChange}
                disabled={!isEditing}
                helperText="Vos données anonymisées peuvent aider à améliorer les infrastructures cyclables et la sécurité."
              />
              
              <Checkbox
                id="data_sharing_marketing"
                name="data_sharing_marketing"
                label="Autoriser l'utilisation de mes données pour des recommandations personnalisées"
                checked={formData.dataSharing?.marketing || false}
                onChange={onChange}
                disabled={!isEditing}
                helperText="Nous pourrons vous recommander des parcours, événements et équipements plus pertinents."
              />
            </div>
          </div>
        </div>
      </motion.div>
      
      <motion.div 
        className="privacy-settings-footer"
        variants={sectionVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.3 }}
      >
        <p className="privacy-settings-note">
          Pour plus d'informations sur notre utilisation de vos données, veuillez consulter notre 
          <a href="/privacy-policy" className="privacy-link">Politique de confidentialité</a> et nos
          <a href="/terms" className="privacy-link">Conditions d'utilisation</a>.
        </p>
      </motion.div>
    </div>
  );
};

PrivacySettings.propTypes = {
  isEditing: PropTypes.bool.isRequired,
  formData: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};
