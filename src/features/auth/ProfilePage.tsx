/**
 * User Profile Page Component
 * 
 * Displays authenticated user information and account details
 * Provides options to manage account and subscription
 */

import React from 'react';
import { useAuth } from './authContext';
import monitoringService from '../../monitoring';
import styles from './AuthPages.module.css';

const ProfilePage: React.FC = () => {
  const { user, isLoading, logout } = useAuth();

  // Handle logout
  const handleLogout = () => {
    logout();
    monitoringService.trackEvent('user_logout');
  };

  // If still loading authentication data
  if (isLoading) {
    return (
      <div className={styles.loadingSpinner}>
        <span>Chargement des données utilisateur...</span>
      </div>
    );
  }

  // If no user is authenticated
  if (!user) {
    return (
      <div className={styles.unauthorizedContainer}>
        <div className={styles.unauthorizedIcon}>⚠️</div>
        <h1 className={styles.unauthorizedTitle}>Non connecté</h1>
        <p className={styles.unauthorizedMessage}>
          Vous devez être connecté pour accéder à cette page.
        </p>
        <a href="/login" className={`${styles.profileButton} ${styles.primaryButton}`}>
          Se connecter
        </a>
      </div>
    );
  }

  // Format creation date
  const createdAt = user.updated_at 
    ? new Date(user.updated_at).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Non disponible';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileHeader}>
        <div className={styles.avatar}>
          {user.picture ? (
            <img src={user.picture} alt={`Avatar de ${user.name}`} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {getInitials(user.name || 'User')}
            </div>
          )}
        </div>

        <div className={styles.profileInfo}>
          <h1 className={styles.profileName}>{user.name}</h1>
          <p className={styles.profileEmail}>{user.email}</p>
          <div className={styles.profileActions}>
            <button 
              className={`${styles.profileButton} ${styles.secondaryButton}`}
              onClick={handleLogout}
            >
              Se déconnecter
            </button>
            <a 
              href="https://velo-altitude.eu.auth0.com/u/reset-password"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.profileButton} ${styles.secondaryButton}`}
            >
              Changer de mot de passe
            </a>
          </div>
        </div>
      </div>

      <div className={styles.profileDetails}>
        <div className={styles.detailCard}>
          <h3>Informations du compte</h3>
          <p><strong>ID:</strong> {user.sub}</p>
          <p><strong>Dernière mise à jour:</strong> {createdAt}</p>
          <p><strong>Vérification de l'email:</strong> {user.email_verified ? 'Vérifié' : 'Non vérifié'}</p>
        </div>

        <div className={styles.detailCard}>
          <h3>Type d'abonnement</h3>
          <p>
            <strong>Niveau:</strong>{' '}
            {user['https://velo-altitude.com/roles']?.includes('Premium') ? 'Premium' : 'Standard'}
          </p>
          <p><strong>État:</strong> Actif</p>
          
          {!user['https://velo-altitude.com/roles']?.includes('Premium') && (
            <div className={styles.upgradeContainer}>
              <h4 className={styles.upgradeTitle}>Passer à Premium</h4>
              <p className={styles.upgradeDescription}>
                Obtenez un accès illimité aux prévisions météorologiques des cols et aux visualisations 3D avancées.
              </p>
              <a 
                href="/pricing" 
                className={`${styles.profileButton} ${styles.primaryButton}`}
              >
                Voir les offres
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
