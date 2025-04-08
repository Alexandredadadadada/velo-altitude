import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Card, Button, Tabs, Tab, Alert, Spinner, Badge } from 'react-bootstrap';
import Markdown from 'react-markdown';
import { useApiOrchestrator } from '../contexts/RealApiOrchestratorProvider';
import { useAuth } from '../contexts/AuthContext';

// Importer notre utilitaire de test d'API
import '../utils/browser-api-tester';

const ApiTestPage = () => {
  const apiOrchestrator = useApiOrchestrator();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('instructions');
  const [testResults, setTestResults] = useState(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [error, setError] = useState(null);
  const [showAuthAlert, setShowAuthAlert] = useState(!isAuthenticated);
  const [requestLog, setRequestLog] = useState([]);
  const resultsRef = useRef(null);
  
  useEffect(() => {
    // Vérifier si le testeur est disponible
    if (!window.veloApiTest) {
      setError("L'utilitaire de test d'API n'est pas disponible. Vérifiez que browser-api-tester.js est correctement chargé.");
    }
    
    // Exposer l'orchestrateur API à l'utilitaire de test
    if (apiOrchestrator) {
      window.__VELO_APP_CONTEXT = window.__VELO_APP_CONTEXT || {};
      window.__VELO_APP_CONTEXT.apiOrchestrator = apiOrchestrator;
    }
    
    // Ajouter une méthode pour mettre à jour les résultats depuis la console
    window.updateApiTestResults = (results) => {
      setTestResults(results);
      setActiveTab('results');
    };
    
    // Clean up
    return () => {
      if (window.__VELO_APP_CONTEXT) {
        delete window.__VELO_APP_CONTEXT.apiOrchestrator;
      }
      delete window.updateApiTestResults;
    };
  }, [apiOrchestrator]);
  
  useEffect(() => {
    // Surveiller les changements de statut d'authentification
    setShowAuthAlert(!isAuthenticated);
  }, [isAuthenticated]);
  
  // Écouter les requêtes HTTP si l'inspecteur est actif
  useEffect(() => {
    const checkRequestInspector = () => {
      if (window.requestInspector && window.requestInspector.requests) {
        setRequestLog([...window.requestInspector.requests]);
      }
    };
    
    // Vérifier toutes les 2 secondes
    const interval = setInterval(checkRequestInspector, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  const runTests = async (type) => {
    setIsRunningTests(true);
    setError(null);
    
    try {
      if (!window.veloApiTest) {
        throw new Error("L'utilitaire de test d'API n'est pas disponible.");
      }
      
      let results;
      
      if (type === 'public') {
        results = await window.veloApiTest.testPublicEndpoints();
      } else if (type === 'protected') {
        if (!isAuthenticated) {
          setShowAuthAlert(true);
          throw new Error("Vous devez être authentifié pour exécuter les tests d'endpoints protégés.");
        }
        results = await window.veloApiTest.testProtectedEndpoints();
      } else {
        results = await window.veloApiTest.runAll();
      }
      
      setTestResults(results);
      setActiveTab('results');
      
      // Faire défiler vers les résultats
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth' });
      }
      
      return results;
    } catch (error) {
      console.error("Erreur lors de l'exécution des tests:", error);
      setError(error.message || "Une erreur s'est produite lors de l'exécution des tests.");
      return null;
    } finally {
      setIsRunningTests(false);
    }
  };
  
  const generateReport = () => {
    if (!window.veloApiTest) {
      setError("L'utilitaire de test d'API n'est pas disponible.");
      return;
    }
    
    const report = window.veloApiTest.generateReport();
    setTestResults(report);
    setActiveTab('results');
    
    // Faire défiler vers les résultats
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    return report;
  };
  
  const exportReport = () => {
    if (!testResults) {
      setError("Aucun résultat de test à exporter.");
      return;
    }
    
    // Créer un blob avec le contenu markdown
    const blob = new Blob([testResults], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    // Créer un lien de téléchargement
    const a = document.createElement('a');
    a.href = url;
    a.download = `velo-altitude-api-validation-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    
    // Nettoyer
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };
  
  return (
    <Container>
      <PageHeader>
        <h1>Validation API</h1>
        <p>
          Cet outil permet de tester et valider l'intégration de l'API pour Velo-Altitude.
          Utilisez les boutons ci-dessous pour lancer les tests et générer un rapport.
        </p>
      </PageHeader>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          <Alert.Heading>Erreur</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}
      
      {showAuthAlert && (
        <Alert variant="warning" onClose={() => setShowAuthAlert(false)} dismissible>
          <Alert.Heading>Authentification requise</Alert.Heading>
          <p>Vous n'êtes pas connecté. Les tests d'endpoints protégés ne fonctionneront pas.</p>
          <Button variant="outline-info" onClick={() => navigate('/login')}>
            Se connecter
          </Button>
        </Alert>
      )}
      
      <ActionsPanel>
        <h2>Tests à exécuter</h2>
        <ButtonGroup>
          <Button 
            variant="success" 
            onClick={() => runTests('public')}
            disabled={isRunningTests}>
            {isRunningTests ? <Spinner size="sm" animation="border" /> : null}
            {' '}Tester les endpoints publics
          </Button>
          <Button 
            variant="primary" 
            onClick={() => runTests('protected')}
            disabled={isRunningTests || !isAuthenticated}>
            {isRunningTests ? <Spinner size="sm" animation="border" /> : null}
            {' '}Tester les endpoints protégés
          </Button>
          <Button 
            variant="info" 
            onClick={() => runTests('all')}
            disabled={isRunningTests}>
            {isRunningTests ? <Spinner size="sm" animation="border" /> : null}
            {' '}Exécuter tous les tests
          </Button>
        </ButtonGroup>
        
        <ResultsActions>
          <Button 
            variant="outline-secondary"
            onClick={generateReport}
            disabled={isRunningTests}>
            Générer un rapport
          </Button>
          <Button 
            variant="outline-primary"
            onClick={exportReport}
            disabled={!testResults || isRunningTests}>
            Exporter le rapport (.md)
          </Button>
        </ResultsActions>
      </ActionsPanel>
      
      <ResultsContainer ref={resultsRef}>
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3"
        >
          <Tab eventKey="instructions" title="Instructions">
            <InstructionsContent>
              <h3>Comment utiliser l'outil de validation API</h3>
              
              <h4>Prérequis</h4>
              <ul>
                <li>MSW est désactivé dans <code>index.js</code> pour permettre les appels à l'API réelle</li>
                <li>Vous devez être authentifié pour tester les endpoints protégés</li>
              </ul>
              
              <h4>Étapes</h4>
              <ol>
                <li>Cliquez sur "Tester les endpoints publics" pour valider les endpoints ne nécessitant pas d'authentification</li>
                <li>Connectez-vous à l'application si ce n'est pas déjà fait</li>
                <li>Cliquez sur "Tester les endpoints protégés" pour valider les endpoints nécessitant une authentification</li>
                <li>Consultez les résultats dans l'onglet "Résultats"</li>
                <li>Générez et exportez un rapport complet au format Markdown</li>
              </ol>
              
              <h4>Endpoints testés</h4>
              <p>L'outil teste automatiquement les endpoints suivants :</p>
              
              <h5>Endpoints publics</h5>
              <ul>
                <li><code>getAllCols()</code></li>
                <li><code>getColById(id)</code></li>
                <li><code>searchCols(query)</code></li>
                <li><code>getColsByRegion(region)</code></li>
                <li><code>getColsByDifficulty(difficulty)</code></li>
                <li><code>getColWeather(colId)</code></li>
                <li><code>getWeatherForecast(colId, days)</code></li>
                <li><code>getAllMajeurs7Challenges()</code></li>
              </ul>
              
              <h5>Endpoints protégés</h5>
              <ul>
                <li><code>getUserProfile(userId)</code></li>
                <li><code>updateUserProfile(userId, profileData)</code></li>
                <li><code>getUserActivities(userId)</code></li>
                <li><code>getUserTrainingPlans(userId)</code></li>
                <li><code>getUserNutritionPlan(userId)</code></li>
                <li><code>getMajeurs7Progress(userId, challengeId)</code></li>
                <li><code>getFTPHistory(userId)</code></li>
              </ul>
            </InstructionsContent>
          </Tab>
          
          <Tab eventKey="results" title="Résultats">
            {testResults ? (
              <MarkdownContainer>
                <Markdown>{testResults}</Markdown>
              </MarkdownContainer>
            ) : (
              <EmptyState>
                <p>Aucun résultat de test disponible.</p>
                <p>Exécutez les tests pour générer des résultats.</p>
              </EmptyState>
            )}
          </Tab>
          
          <Tab eventKey="requests" title={
            <span>
              Requêtes HTTP {requestLog.length > 0 && <Badge bg="info">{requestLog.length}</Badge>}
            </span>
          }>
            {requestLog.length > 0 ? (
              <RequestLogContainer>
                <h3>Journal des requêtes HTTP</h3>
                <table>
                  <thead>
                    <tr>
                      <th>URL</th>
                      <th>Méthode</th>
                      <th>Statut</th>
                      <th>Auth</th>
                      <th>Temps (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestLog.map((req, index) => (
                      <tr key={index}>
                        <td title={req.url}>{req.url.substring(0, 40)}{req.url.length > 40 ? '...' : ''}</td>
                        <td>{req.method}</td>
                        <td>
                          <StatusBadge status={req.status}>
                            {req.status}
                          </StatusBadge>
                        </td>
                        <td>{req.hasAuthHeader ? '✅' : '❌'}</td>
                        <td>{Math.round(req.responseTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </RequestLogContainer>
            ) : (
              <EmptyState>
                <p>Aucune requête HTTP capturée.</p>
                <p>Exécutez les tests pour voir les requêtes.</p>
              </EmptyState>
            )}
          </Tab>
        </Tabs>
      </ResultsContainer>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const PageHeader = styled.div`
  margin-bottom: 30px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 15px;
  
  h1 {
    font-size: 2.2rem;
    margin-bottom: 10px;
  }
`;

const ActionsPanel = styled(Card)`
  margin-bottom: 20px;
  padding: 20px;
  
  h2 {
    font-size: 1.5rem;
    margin-bottom: 15px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ResultsActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ResultsContainer = styled(Card)`
  padding: 20px;
  min-height: 400px;
`;

const InstructionsContent = styled.div`
  h3 {
    margin-bottom: 20px;
  }
  
  h4 {
    margin: 20px 0 10px;
  }
  
  ul, ol {
    margin-bottom: 15px;
    padding-left: 20px;
  }
  
  li {
    margin-bottom: 8px;
  }
  
  code {
    background-color: #f8f9fa;
    padding: 2px 4px;
    border-radius: 4px;
    font-size: 0.9em;
  }
`;

const MarkdownContainer = styled.div`
  padding: 15px;
  
  h1 {
    font-size: 1.8rem;
  }
  
  h2 {
    font-size: 1.5rem;
    margin-top: 30px;
  }
  
  h3 {
    font-size: 1.2rem;
    margin-top: 25px;
  }
  
  pre {
    background-color: #f8f9fa;
    padding: 15px;
    border-radius: 4px;
    overflow-x: auto;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
    
    td, th {
      border: 1px solid #ddd;
      padding: 8px;
    }
    
    th {
      background-color: #f2f2f2;
    }
    
    tr:nth-child(even) {
      background-color: #f8f9fa;
    }
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #6c757d;
  text-align: center;
  
  p {
    margin-bottom: 10px;
  }
`;

const RequestLogContainer = styled.div`
  h3 {
    margin-bottom: 15px;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    
    th, td {
      padding: 10px;
      border: 1px solid #ddd;
      text-align: left;
    }
    
    th {
      background-color: #f8f9fa;
    }
    
    tr:nth-child(even) {
      background-color: #f8f9fa;
    }
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  background-color: ${props => {
    if (props.status >= 200 && props.status < 300) return '#28a745';
    if (props.status >= 300 && props.status < 400) return '#17a2b8';
    if (props.status >= 400 && props.status < 500) return '#ffc107';
    if (props.status >= 500) return '#dc3545';
    return '#6c757d';
  }};
  color: white;
`;

export default ApiTestPage;
