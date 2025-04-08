/**
 * Composant de test pour les routes protégées
 * Démontre l'utilisation des rôles et des contrôles d'accès
 */
import React, { useState } from 'react';
import { useSafeAuth } from '../../auth/AuthCore';

const ProtectedRouteTest = () => {
  const { isAuthenticated, isAdmin, user, loading, login } = useSafeAuth();
  const [selectedSection, setSelectedSection] = useState('user');

  // Gérer l'état de chargement
  if (loading) {
    return <div style={styles.loading}>Chargement...</div>;
  }

  // Rediriger vers la connexion si non authentifié
  if (!isAuthenticated) {
    return (
      <div style={styles.notAuthenticated}>
        <h2>Accès Restreint</h2>
        <p>Vous devez être connecté pour accéder à cette page.</p>
        <button onClick={login} style={styles.loginButton}>
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>Test des Routes Protégées</h2>
      
      <div style={styles.userStatus}>
        <p>
          <strong>Utilisateur connecté :</strong> {user?.name}
        </p>
        <p>
          <strong>Rôle :</strong> {isAdmin ? 'Administrateur' : 'Utilisateur standard'}
        </p>
      </div>

      <div style={styles.tabs}>
        <button 
          onClick={() => setSelectedSection('user')}
          style={{
            ...styles.tabButton,
            ...(selectedSection === 'user' ? styles.activeTab : {})
          }}
        >
          Zone Utilisateur
        </button>
        <button 
          onClick={() => setSelectedSection('admin')}
          style={{
            ...styles.tabButton,
            ...(selectedSection === 'admin' ? styles.activeTab : {})
          }}
        >
          Zone Admin
        </button>
      </div>

      <div style={styles.contentSection}>
        {selectedSection === 'user' ? (
          <div style={styles.userSection}>
            <h3>Zone Utilisateur</h3>
            <p>Cette section est accessible à tous les utilisateurs authentifiés.</p>
            <div style={styles.fakeContent}>
              <p>Voici quelques fonctionnalités accessibles à tous les utilisateurs :</p>
              <ul>
                <li>Consulter son profil</li>
                <li>Voir ses activités</li>
                <li>Planifier des itinéraires</li>
                <li>Participer à des groupes</li>
              </ul>
            </div>
          </div>
        ) : (
          <div style={styles.adminSection}>
            {isAdmin ? (
              <>
                <h3>Zone Admin</h3>
                <p>Cette section est réservée aux administrateurs.</p>
                <div style={styles.fakeContent}>
                  <p>Voici quelques fonctionnalités administratives :</p>
                  <ul>
                    <li>Gérer les utilisateurs</li>
                    <li>Modérer les contenus</li>
                    <li>Consulter les statistiques</li>
                    <li>Configurer l'application</li>
                  </ul>
                  <div style={styles.adminControls}>
                    <button style={styles.adminButton}>Paramètres système</button>
                    <button style={styles.adminButton}>Gérer les utilisateurs</button>
                    <button style={styles.adminButton}>Journal système</button>
                  </div>
                </div>
              </>
            ) : (
              <div style={styles.accessDenied}>
                <h3>Accès Refusé</h3>
                <p>Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
                <p>Seuls les utilisateurs avec le rôle <strong>admin</strong> peuvent y accéder.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={styles.infoSection}>
        <h3>Comment ça marche ?</h3>
        <p>
          Ce composant démontre l'utilisation du système de contrôle d'accès basé sur les rôles :
        </p>
        <ul>
          <li>La <strong>Zone Utilisateur</strong> est accessible à tous les utilisateurs authentifiés</li>
          <li>La <strong>Zone Admin</strong> vérifie la propriété <code>isAdmin</code> de <code>useSafeAuth</code></li>
          <li>Si l'utilisateur n'est pas connecté, une redirection vers la page de connexion est proposée</li>
        </ul>
        <p>
          Dans une application réelle, ces vérifications seraient implémentées au niveau du routeur
          à l'aide du composant <code>ProtectedRoute</code>.
        </p>
      </div>
    </div>
  );
};

// Styles pour le composant
const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
  },
  loading: {
    padding: '40px',
    textAlign: 'center',
    fontSize: '18px',
    color: '#666',
  },
  notAuthenticated: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  loginButton: {
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '15px',
  },
  userStatus: {
    backgroundColor: '#e3f2fd',
    padding: '10px 15px',
    borderRadius: '5px',
    marginBottom: '20px',
  },
  tabs: {
    display: 'flex',
    marginBottom: '20px',
    borderBottom: '1px solid #ddd',
  },
  tabButton: {
    padding: '10px 20px',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderBottom: '3px solid transparent',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  activeTab: {
    borderBottom: '3px solid #2196f3',
    backgroundColor: 'white',
  },
  contentSection: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '5px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    minHeight: '250px',
  },
  userSection: {
    animation: 'fadeIn 0.3s',
  },
  adminSection: {
    animation: 'fadeIn 0.3s',
  },
  fakeContent: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '5px',
    marginTop: '15px',
  },
  accessDenied: {
    backgroundColor: '#ffebee',
    padding: '20px',
    borderRadius: '5px',
    textAlign: 'center',
  },
  adminControls: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '20px',
  },
  adminButton: {
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  infoSection: {
    backgroundColor: '#f0f4f8',
    padding: '15px',
    borderRadius: '5px',
    marginTop: '30px',
  },
};

export default ProtectedRouteTest;
