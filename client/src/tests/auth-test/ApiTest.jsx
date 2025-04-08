/**
 * Composant de test pour les appels API authentifiés
 * Démontre comment les intercepteurs ajoutent automatiquement les tokens
 */
import React, { useState } from 'react';
import { useSafeAuth } from '../../auth/AuthCore';
import { api } from '../../config/apiConfig';
import RealApiOrchestrator from '../../services/api/RealApiOrchestrator';

// Endpoints de test pour différents scénarios
const TEST_ENDPOINTS = [
  {
    name: 'Profil utilisateur',
    method: 'getUserProfile',
    type: 'protected',
    description: 'Récupère les informations du profil utilisateur (route protégée)',
    implementation: async () => await RealApiOrchestrator.getUserProfile()
  },
  {
    name: 'Liste des cols',
    method: 'getAllCols',
    type: 'public',
    description: 'Récupère la liste des cols (route publique)',
    implementation: async () => await RealApiOrchestrator.getAllCols()
  },
  {
    name: 'Appel API direct avec token',
    method: 'directCall',
    type: 'protected',
    description: 'Démontre un appel API direct avec interception de token',
    implementation: async () => await api.get('/api/user/profile')
  }
];

const ApiTest = () => {
  const { isAuthenticated, user, loading, login } = useSafeAuth();
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Gérer l'appel API
  const handleApiCall = async (endpoint) => {
    setSelectedEndpoint(endpoint);
    setApiResponse(null);
    setApiError(null);
    setIsLoading(true);

    try {
      // Lancer l'appel à l'implémentation appropriée
      const response = await endpoint.implementation();
      setApiResponse(response);
      console.log(`API Response (${endpoint.name}):`, response);
    } catch (error) {
      setApiError(error);
      console.error(`API Error (${endpoint.name}):`, error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Chargement de l'authentification...</div>;
  }

  return (
    <div style={styles.container}>
      <h2>Test des Appels API Authentifiés</h2>

      {/* Statut d'authentification */}
      <div style={styles.statusBox}>
        <h3>Statut d'authentification</h3>
        {isAuthenticated ? (
          <div style={styles.authenticated}>
            <p>✅ Authentifié en tant que: <strong>{user?.name}</strong></p>
            <p>
              <small>Les tokens seront automatiquement attachés aux requêtes API</small>
            </p>
          </div>
        ) : (
          <div style={styles.notAuthenticated}>
            <p>❌ Non authentifié</p>
            <p>
              <small>Les appels API protégés échoueront sans token d'authentification</small>
            </p>
            <button onClick={login} style={styles.loginButton}>
              Se connecter
            </button>
          </div>
        )}
      </div>

      {/* Sélection des endpoints */}
      <div style={styles.endpointSelection}>
        <h3>Sélectionnez un endpoint à tester</h3>
        <div style={styles.endpoints}>
          {TEST_ENDPOINTS.map((endpoint) => (
            <div 
              key={endpoint.method}
              style={{
                ...styles.endpointCard,
                ...(endpoint.type === 'protected' 
                  ? styles.protectedEndpoint 
                  : styles.publicEndpoint)
              }}
              onClick={() => handleApiCall(endpoint)}
            >
              <h4>{endpoint.name}</h4>
              <p>{endpoint.description}</p>
              <div style={styles.endpointType}>
                {endpoint.type === 'protected' ? '🔒 Protégé' : '🌐 Public'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Résultats de l'appel API */}
      {selectedEndpoint && (
        <div style={styles.results}>
          <h3>Résultats pour : {selectedEndpoint.name}</h3>
          
          {isLoading && (
            <div style={styles.loadingResults}>
              <div style={styles.spinner}></div>
              <p>Chargement des données...</p>
            </div>
          )}
          
          {apiResponse && !isLoading && (
            <div style={styles.responseBox}>
              <h4>Réponse API</h4>
              <pre style={styles.jsonDisplay}>
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
              <p style={styles.successMessage}>
                ✅ L'appel API a réussi ! {selectedEndpoint.type === 'protected' && isAuthenticated && 
                  "Le token d'authentification a été automatiquement ajouté."}
              </p>
            </div>
          )}
          
          {apiError && !isLoading && (
            <div style={styles.errorBox}>
              <h4>Erreur API</h4>
              <p style={styles.errorMessage}>
                {apiError.message || "Une erreur s'est produite lors de l'appel API"}
              </p>
              {selectedEndpoint.type === 'protected' && !isAuthenticated && (
                <p style={styles.errorTip}>
                  💡 Cette erreur est probablement due au fait que vous n'êtes pas authentifié.
                  Connectez-vous pour obtenir un token valide.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Explications */}
      <div style={styles.infoSection}>
        <h3>Comment ça marche ?</h3>
        <p>
          Ce composant démontre l'utilisation des intercepteurs pour attacher automatiquement
          les tokens d'authentification aux requêtes API :
        </p>
        <ul>
          <li>
            <strong>Endpoints publics</strong> : Accessibles sans authentification
          </li>
          <li>
            <strong>Endpoints protégés</strong> : Nécessitent un token valide, qui est automatiquement 
            ajouté via l'intercepteur dans <code>apiConfig.js</code>
          </li>
        </ul>
        <p>
          L'implémentation utilise <code>RealApiOrchestrator</code> pour les appels métier 
          standards, et <code>api</code> pour les appels directs démontrant l'interception.
        </p>
        <div style={styles.note}>
          <strong>Note technique :</strong> Ouvrez la console développeur et l'onglet Réseau (Network)
          pour observer les en-têtes des requêtes et vérifier que le token est bien attaché.
        </div>
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
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px',
    color: '#666',
  },
  statusBox: {
    backgroundColor: '#f0f4f8',
    padding: '15px',
    borderRadius: '5px',
    marginBottom: '20px',
  },
  authenticated: {
    color: '#2e7d32',
  },
  notAuthenticated: {
    color: '#c62828',
  },
  loginButton: {
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '10px',
  },
  endpointSelection: {
    marginBottom: '25px',
  },
  endpoints: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
  },
  endpointCard: {
    width: 'calc(33.33% - 10px)',
    padding: '15px',
    borderRadius: '5px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    minWidth: '200px',
  },
  protectedEndpoint: {
    backgroundColor: '#e8f5e9',
    borderLeft: '4px solid #4caf50',
  },
  publicEndpoint: {
    backgroundColor: '#e3f2fd',
    borderLeft: '4px solid #2196f3',
  },
  endpointType: {
    fontSize: '12px',
    marginTop: '10px',
    fontWeight: 'bold',
  },
  results: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '5px',
    marginBottom: '25px',
  },
  loadingResults: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
  },
  spinner: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #3498db',
    animation: 'spin 1s linear infinite',
    marginBottom: '10px',
  },
  responseBox: {
    backgroundColor: '#f1f8e9',
    padding: '15px',
    borderRadius: '5px',
  },
  jsonDisplay: {
    backgroundColor: '#263238',
    color: '#eeffff',
    padding: '10px',
    borderRadius: '3px',
    overflow: 'auto',
    maxHeight: '300px',
  },
  successMessage: {
    color: '#2e7d32',
    fontWeight: 'bold',
    marginTop: '10px',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    padding: '15px',
    borderRadius: '5px',
  },
  errorMessage: {
    color: '#c62828',
    fontWeight: 'bold',
  },
  errorTip: {
    backgroundColor: '#fff8e1',
    padding: '10px',
    borderRadius: '4px',
    marginTop: '10px',
  },
  infoSection: {
    backgroundColor: '#f0f4f8',
    padding: '15px',
    borderRadius: '5px',
  },
  note: {
    backgroundColor: '#fff8e1',
    padding: '10px 15px',
    borderLeft: '4px solid #ffc107',
    marginTop: '15px',
    borderRadius: '2px',
  },
};

export default ApiTest;
