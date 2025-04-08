/**
 * Unauthorized Page Component
 * 
 * Displayed when a user tries to access a protected resource without
 * the required permissions or authentication
 */

import React from 'react';
import { FaLock, FaArrowLeft, FaCrown } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './authContext';
import styles from './AuthPages.module.css';

const UnauthorizedPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className={styles.unauthorizedContainer}>
      <div className={styles.unauthorizedIcon}>
        <FaLock />
      </div>
      <h1 className={styles.unauthorizedTitle}>Accès Refusé</h1>
      
      <p className={styles.unauthorizedMessage}>
        {isAuthenticated 
          ? "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource." 
          : "Vous devez être connecté pour accéder à cette page."}
      </p>
      
      <div className={styles.upgradeContainer}>
        <h4 className={styles.upgradeTitle}><FaCrown /> Besoin d'un accès plus étendu ?</h4>
        <p className={styles.upgradeDescription}>
          Passez à un compte Premium pour accéder à toutes les fonctionnalités de Velo-Altitude.
        </p>
        <Link to="/pricing" className={`${styles.profileButton} ${styles.primaryButton}`}>
          Voir les offres
        </Link>
      </div>
      
      <div className={styles.actionsContainer}>
        <Link to="/" className={`${styles.profileButton} ${styles.secondaryButton}`}>
          <FaArrowLeft /> Retour à l'accueil
        </Link>
        
        {!isAuthenticated && (
          <Link to="/login" className={`${styles.profileButton} ${styles.primaryButton}`}>
            Se connecter
          </Link>
        )}
      </div>
    </div>
  );
};

export default UnauthorizedPage;
