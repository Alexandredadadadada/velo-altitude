/**
 * Environnement de test pour le système d'authentification Auth0
 * Permet de tester les flux d'authentification de manière isolée
 */
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from '../../auth/AuthCore';
import LoginTest from './LoginTest';
import ProtectedRouteTest from './ProtectedRouteTest';
import ApiTest from './ApiTest';

const AuthTestApp = () => {
  return (
    <AuthProvider>
      <div className="auth-test-container" style={styles.container}>
        <h1 style={styles.header}>Test d'Authentification Velo-Altitude</h1>
        <p style={styles.description}>
          Cet environnement permet de tester les fonctionnalités d'authentification
          sans perturber l'application principale.
        </p>
        
        <BrowserRouter basename="/auth-test">
          <nav style={styles.navigation}>
            <ul style={styles.navList}>
              <li style={styles.navItem}>
                <Link to="/" style={styles.link}>Accueil</Link>
              </li>
              <li style={styles.navItem}>
                <Link to="/login" style={styles.link}>Test de Login</Link>
              </li>
              <li style={styles.navItem}>
                <Link to="/protected" style={styles.link}>Route Protégée</Link>
              </li>
              <li style={styles.navItem}>
                <Link to="/api" style={styles.link}>Test API</Link>
              </li>
            </ul>
          </nav>

          <div style={styles.content}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginTest />} />
              <Route path="/protected" element={<ProtectedRouteTest />} />
              <Route path="/api" element={<ApiTest />} />
            </Routes>
          </div>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
};

// Composant Home simple
const Home = () => (
  <div style={styles.homeContainer}>
    <h2>Test du Système d'Authentification</h2>
    <p>
      Cette page vous permet de tester les différentes fonctionnalités du système
      d'authentification refactorisé utilisant Auth0.
    </p>
    <h3>Fonctionnalités testables</h3>
    <ul>
      <li>Connexion/Déconnexion via Auth0</li>
      <li>Récupération et affichage des informations utilisateur</li>
      <li>Vérification des routes protégées</li>
      <li>Appels API authentifiés (avec ajout automatique du token)</li>
      <li>Rafraîchissement automatique du token</li>
    </ul>
    <div style={styles.note}>
      <strong>Note:</strong> Utilisez les liens dans la navigation pour tester chaque aspect.
    </div>
  </div>
);

// Styles pour l'interface de test
const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f7fa',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  header: {
    color: '#2c3e50',
    borderBottom: '2px solid #3498db',
    paddingBottom: '10px',
  },
  description: {
    color: '#7f8c8d',
    marginBottom: '20px',
  },
  navigation: {
    backgroundColor: '#34495e',
    padding: '10px 20px',
    borderRadius: '5px',
    marginBottom: '20px',
  },
  navList: {
    display: 'flex',
    listStyleType: 'none',
    padding: 0,
    margin: 0,
    justifyContent: 'space-around',
  },
  navItem: {
    margin: '0 10px',
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    fontWeight: 'bold',
    padding: '5px 10px',
    borderRadius: '3px',
    transition: 'background-color 0.3s',
  },
  content: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '5px',
    minHeight: '300px',
  },
  homeContainer: {
    lineHeight: '1.6',
  },
  note: {
    backgroundColor: '#fffde7',
    padding: '10px 15px',
    borderLeft: '4px solid #ffc107',
    marginTop: '20px',
  }
};

export default AuthTestApp;
