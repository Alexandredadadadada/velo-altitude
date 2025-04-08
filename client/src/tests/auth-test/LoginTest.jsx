/**
 * Composant de test pour les fonctionnalités de connexion/déconnexion
 * Utilise useAuth pour accéder au système d'authentification
 */
import React from 'react';
import { useSafeAuth } from '../../auth/AuthCore';

const LoginTest = () => {
  // Récupérer les fonctionnalités d'authentification via notre hook
  const { isAuthenticated, user, isAdmin, loading, error, login, logout } = useSafeAuth();

  // Gérer l'état de chargement
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Chargement de l'authentification...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>Test de Connexion/Déconnexion</h2>
      
      {/* Affichage de l'état d'authentification */}
      <div style={styles.statusBox}>
        <h3>État d'authentification :</h3>
        <p>
          <strong>Connecté :</strong> {isAuthenticated ? '✅ Oui' : '❌ Non'}
        </p>
        {isAuthenticated && (
          <p>
            <strong>Rôle administrateur :</strong> {isAdmin ? '✅ Oui' : '❌ Non'}
          </p>
        )}
      </div>

      {/* Affichage des informations utilisateur si connecté */}
      {isAuthenticated && user && (
        <div style={styles.userInfoBox}>
          <h3>Informations utilisateur :</h3>
          <div style={styles.userCard}>
            {user.picture && (
              <img 
                src={user.picture} 
                alt="Avatar utilisateur" 
                style={styles.avatar} 
              />
            )}
            <div style={styles.userDetails}>
              <p><strong>Nom :</strong> {user.name}</p>
              <p><strong>Email :</strong> {user.email}</p>
              <p><strong>ID Auth0 :</strong> <code>{user.sub}</code></p>
              <p><strong>Rôle :</strong> {user.role || 'Non défini'}</p>
            </div>
          </div>
          
          <div style={styles.tokenInfo}>
            <h4>Claims et Tokens</h4>
            <p>Ouvrez la console développeur pour voir plus de détails sur le token JWT</p>
            <button 
              onClick={() => console.log('User object:', user)} 
              style={styles.debugButton}
            >
              Afficher l'objet utilisateur dans la console
            </button>
          </div>
        </div>
      )}

      {/* Affichage des erreurs s'il y en a */}
      {error && (
        <div style={styles.errorBox}>
          <h3>Erreur :</h3>
          <p>{error.message || 'Une erreur est survenue lors de l\'authentification.'}</p>
        </div>
      )}

      {/* Boutons d'action */}
      <div style={styles.actionButtons}>
        {isAuthenticated ? (
          <button onClick={logout} style={styles.logoutButton}>
            Se déconnecter
          </button>
        ) : (
          <button onClick={login} style={styles.loginButton}>
            Se connecter
          </button>
        )}
      </div>

      {/* Section informative */}
      <div style={styles.infoSection}>
        <h3>Comment ça marche ?</h3>
        <p>
          Ce composant utilise le hook <code>useSafeAuth</code> pour accéder aux fonctionnalités 
          d'authentification. Il récupère l'état d'authentification, les informations utilisateur 
          et les fonctions de connexion/déconnexion.
        </p>
        <p>
          Lorsque vous cliquez sur "Se connecter", vous êtes redirigé vers Auth0 pour vous authentifier. 
          Après la connexion, Auth0 vous redirige vers cette page et le hook <code>useSafeAuth</code> 
          met à jour l'état en conséquence.
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
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
  },
  spinner: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #3498db',
    animation: 'spin 1s linear infinite',
    marginBottom: '15px',
  },
  statusBox: {
    backgroundColor: '#e8f4fd',
    padding: '15px',
    borderRadius: '5px',
    marginBottom: '20px',
  },
  userInfoBox: {
    backgroundColor: '#f0f4f8',
    padding: '15px',
    borderRadius: '5px',
    marginBottom: '20px',
  },
  userCard: {
    display: 'flex',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '5px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    marginRight: '20px',
  },
  userDetails: {
    flex: 1,
  },
  errorBox: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '15px',
    borderRadius: '5px',
    marginBottom: '20px',
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'center',
    margin: '25px 0',
  },
  loginButton: {
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  infoSection: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '5px',
    marginTop: '20px',
  },
  tokenInfo: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#fffde7',
    borderRadius: '5px',
  },
  debugButton: {
    backgroundColor: '#607d8b',
    color: 'white',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  }
};

export default LoginTest;
