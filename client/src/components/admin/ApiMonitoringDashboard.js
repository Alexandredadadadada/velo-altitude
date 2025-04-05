import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Card, Row, Col, Table, Badge, Button, 
  Spinner, Alert, Tabs, Tab, ListGroup, ProgressBar,
  Accordion
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, faExclamationTriangle, faTimesCircle, 
  faSync, faCloudRain, faRunning, faRoute, faUsers,
  faChartBar, faServer, faHistory, faTrash
} from '@fortawesome/free-solid-svg-icons';

// Composant pour afficher l'état d'un service avec un indicateur coloré
const ServiceStatus = ({ status }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'healthy':
        return <FontAwesomeIcon icon={faCheckCircle} className="text-success" />;
      case 'warning':
        return <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning" />;
      case 'error':
      case 'critical':
        return <FontAwesomeIcon icon={faTimesCircle} className="text-danger" />;
      case 'inactive':
        return <FontAwesomeIcon icon={faTimesCircle} className="text-secondary" />;
      default:
        return <FontAwesomeIcon icon={faExclamationTriangle} className="text-info" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'healthy':
        return <Badge bg="success">Opérationnel</Badge>;
      case 'warning':
        return <Badge bg="warning">Avertissement</Badge>;
      case 'error':
        return <Badge bg="danger">Erreur</Badge>;
      case 'critical':
        return <Badge bg="danger">Critique</Badge>;
      case 'inactive':
        return <Badge bg="secondary">Inactif</Badge>;
      default:
        return <Badge bg="info">Inconnu</Badge>;
    }
  };

  return (
    <div className="d-flex align-items-center">
      {getStatusIcon()}
      <span className="ms-2">{getStatusText()}</span>
    </div>
  );
};

// Composant principal du tableau de bord
const ApiMonitoringDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [apiMetrics, setApiMetrics] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [serviceMetrics, setServiceMetrics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState({
    status: false,
    token: false,
    activities: false,
    segments: false,
    clubs: false,
    routes: false,
    metrics: false
  });

  // Charger les données initiales
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Effet pour charger les métriques détaillées d'un service lorsqu'il est sélectionné
  useEffect(() => {
    if (selectedService) {
      loadServiceMetrics(selectedService);
    }
  }, [selectedService]);

  // Fonction pour charger toutes les données du tableau de bord
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusResponse, statsResponse, metricsResponse] = await Promise.all([
        axios.get('/api/monitoring/status'),
        axios.get('/api/monitoring/statistics'),
        axios.get('/api/monitoring/api-metrics')
      ]);

      setSystemStatus(statusResponse.data);
      setStatistics(statsResponse.data);
      setApiMetrics(metricsResponse.data.metrics);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Charger les métriques détaillées pour un service spécifique
  const loadServiceMetrics = async (serviceName) => {
    try {
      setRefreshing({ ...refreshing, metrics: true });
      const response = await axios.get(`/api/monitoring/api-metrics/${serviceName}`);
      setServiceMetrics(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setServiceMetrics(null);
    } finally {
      setRefreshing({ ...refreshing, metrics: false });
    }
  };

  // Réinitialiser les métriques d'API
  const resetApiMetrics = async (serviceName = null) => {
    try {
      setRefreshing({ ...refreshing, metrics: true });
      const payload = serviceName ? { serviceName } : {};
      await axios.post('/api/monitoring/reset-metrics', payload);
      await loadDashboardData();
      if (selectedService) {
        await loadServiceMetrics(selectedService);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setRefreshing({ ...refreshing, metrics: false });
    }
  };

  // Formater une date ISO en format local
  const formatDate = (isoDate) => {
    if (!isoDate) return 'Jamais';
    return new Date(isoDate).toLocaleString();
  };

  // Formater un timestamp en durée relative (x heures, x minutes)
  const formatTimeDifference = (timestamp) => {
    if (!timestamp) return 'Indéfini';
    
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) {
      return `Il y a ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `Il y a ${hours} heure${hours !== 1 ? 's' : ''}`;
    }
    
    const days = Math.floor(hours / 24);
    return `Il y a ${days} jour${days !== 1 ? 's' : ''}`;
  };

  // Afficher un état de chargement
  if (loading && !systemStatus) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p>Chargement du tableau de bord...</p>
      </Container>
    );
  }

  // Afficher les erreurs
  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Erreur lors du chargement des données</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex justify-content-end">
            <Button onClick={loadDashboardData} variant="outline-danger">
              Réessayer
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  // Fonction utilitaire pour calculer le taux d'erreur global
  const calculateErrorRate = (services) => {
    const totalCalls = services.reduce((total, service) => total + service.totalCalls, 0);
    const totalErrors = services.reduce((total, service) => total + service.errorCount, 0);
    
    if (totalCalls === 0) return 0;
    return ((totalErrors / totalCalls) * 100).toFixed(1);
  };

  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">Tableau de bord de Monitoring des API</h1>
      
      {/* Actions rapides */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>Actions rapides</Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-2">
                <Button 
                  variant="primary" 
                  onClick={loadDashboardData}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner as="span" size="sm" animation="border" role="status" className="me-2" />
                      Rafraîchissement...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSync} className="me-2" />
                      Rafraîchir le tableau de bord
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline-primary" 
                  onClick={refreshStravaToken}
                  disabled={refreshing.token}
                >
                  {refreshing.token ? (
                    <>
                      <Spinner as="span" size="sm" animation="border" role="status" className="me-2" />
                      Rafraîchissement...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSync} className="me-2" />
                      Rafraîchir le token Strava
                    </>
                  )}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Résumé des statuts */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>État global du système</Card.Header>
            <Card.Body>
              <Table hover>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>État</th>
                    <th>Dernière mise à jour</th>
                  </tr>
                </thead>
                <tbody>
                  {systemStatus && Object.entries(systemStatus.services).map(([service, data]) => (
                    <tr key={service}>
                      <td>
                        {service === 'stravaToken' && 'Token Strava'}
                        {service === 'apiQuota' && 'Quotas API'}
                        {service === 'weatherNotification' && 'Notifications météo'}
                        {service === 'stravaDataRefresh' && 'Données Strava'}
                      </td>
                      <td>
                        <ServiceStatus status={data.status} />
                      </td>
                      <td>
                        {service === 'stravaToken' && data.details.accessTokenStatus.lastRefreshed && 
                          formatTimeDifference(data.details.accessTokenStatus.lastRefreshed)}
                        {service === 'stravaDataRefresh' && 
                          Object.entries(data.details.status).map(([dataType, info]) => 
                            info.lastRefresh ? `${dataType}: ${formatTimeDifference(info.lastRefresh)}` : null
                          ).filter(Boolean)[0] || 'Jamais'}
                        {(service === 'apiQuota' || service === 'weatherNotification') && 
                          formatTimeDifference(systemStatus.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="text-muted mt-2">
                <small>Dernière mise à jour: {formatDate(systemStatus?.timestamp)}</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>Utilisation des API</Card.Header>
            <Card.Body>
              {statistics && Object.entries(statistics).map(([apiName, data]) => (
                <div key={apiName} className="mb-3">
                  <h6>{apiName}</h6>
                  {data.quotaUsage && (
                    <>
                      <div className="d-flex justify-content-between">
                        <span>Quota journalier:</span>
                        <span>{data.quotaUsage.day.used} / {data.quotaUsage.day.limit}</span>
                      </div>
                      <ProgressBar 
                        now={parseFloat(data.quotaUsage.day.percentage)} 
                        variant={
                          parseFloat(data.quotaUsage.day.percentage) > 90 ? 'danger' :
                          parseFloat(data.quotaUsage.day.percentage) > 75 ? 'warning' : 'success'
                        }
                        className="mb-2"
                      />
                      
                      <div className="d-flex justify-content-between">
                        <span>Quota 15 minutes:</span>
                        <span>{data.quotaUsage.fifteenMin.used} / {data.quotaUsage.fifteenMin.limit}</span>
                      </div>
                      <ProgressBar 
                        now={parseFloat(data.quotaUsage.fifteenMin.percentage)} 
                        variant={
                          parseFloat(data.quotaUsage.fifteenMin.percentage) > 90 ? 'danger' :
                          parseFloat(data.quotaUsage.fifteenMin.percentage) > 75 ? 'warning' : 'success'
                        }
                      />
                    </>
                  )}
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Onglets détaillés */}
      <Card>
        <Card.Header>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
          >
            <Tab eventKey="overview" title="Vue d'ensemble" />
            <Tab eventKey="strava" title="Strava" />
            <Tab eventKey="weather" title="Météo" />
            <Tab eventKey="quotas" title="Quotas" />
            <Tab eventKey="api-metrics" title="Métriques API" />
          </Tabs>
        </Card.Header>
        
        <Card.Body>
          {/* Onglet vue d'ensemble */}
          {activeTab === 'overview' && (
            <Row>
              <Col md={6}>
                <h5>Accès aux API</h5>
                <ListGroup className="mb-4">
                  {statistics && Object.entries(statistics).map(([apiName, data]) => (
                    <ListGroup.Item key={apiName} className="d-flex justify-content-between align-items-center">
                      <div>{apiName}</div>
                      <div>
                        <Badge bg={data.status === 'healthy' ? 'success' : 'danger'}>
                          {data.status === 'healthy' ? 'Opérationnel' : 'Problème'}
                        </Badge>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Col>
              
              <Col md={6}>
                <h5>Dernières mises à jour</h5>
                {systemStatus && systemStatus.services.stravaDataRefresh && (
                  <ListGroup className="mb-4">
                    {Object.entries(systemStatus.services.stravaDataRefresh.details.status).map(([dataType, info]) => (
                      <ListGroup.Item key={dataType} className="d-flex justify-content-between align-items-center">
                        <div>
                          {dataType === 'activities' && <FontAwesomeIcon icon={faRunning} className="me-2" />}
                          {dataType === 'segments' && <FontAwesomeIcon icon={faRoute} className="me-2" />}
                          {dataType === 'clubs' && <FontAwesomeIcon icon={faUsers} className="me-2" />}
                          {dataType === 'routes' && <FontAwesomeIcon icon={faRoute} className="me-2" />}
                          {dataType}
                        </div>
                        <div>
                          {info.lastRefresh ? (
                            formatTimeDifference(info.lastRefresh)
                          ) : (
                            <Badge bg="secondary">Jamais</Badge>
                          )}
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Col>
            </Row>
          )}
          
          {/* Onglet Strava */}
          {activeTab === 'strava' && systemStatus && (
            <Row>
              <Col md={6}>
                <h5>Statut du token</h5>
                <Card className="mb-4">
                  <Card.Body>
                    <div className="mb-3">
                      <strong>Expiration du token:</strong>{' '}
                      {systemStatus.services.stravaToken.details.accessTokenStatus.isExpired ? (
                        <Badge bg="danger">Expiré</Badge>
                      ) : (
                        <Badge bg="success">Valide</Badge>
                      )}
                    </div>
                    
                    <div className="mb-3">
                      <strong>Dernier rafraîchissement:</strong>{' '}
                      {formatDate(systemStatus.services.stravaToken.details.accessTokenStatus.lastRefreshed)}
                    </div>
                    
                    <div className="mb-3">
                      <strong>Expire dans:</strong>{' '}
                      {systemStatus.services.stravaToken.details.accessTokenStatus.expiresIn} secondes
                    </div>
                    
                    <Button 
                      variant="primary" 
                      onClick={refreshStravaToken}
                      disabled={refreshing.token}
                    >
                      {refreshing.token ? (
                        <>
                          <Spinner as="span" size="sm" animation="border" role="status" className="me-2" />
                          Rafraîchissement...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faSync} className="me-2" />
                          Rafraîchir maintenant
                        </>
                      )}
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
              
              <Col md={6}>
                <h5>Données Strava</h5>
                <ListGroup className="mb-4">
                  {Object.entries(systemStatus.services.stravaDataRefresh.details.status).map(([dataType, info]) => (
                    <ListGroup.Item key={dataType}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong className="text-capitalize">{dataType}</strong>
                        <div>
                          {info.inProgress ? (
                            <Badge bg="info">En cours</Badge>
                          ) : info.error ? (
                            <Badge bg="danger">Erreur</Badge>
                          ) : (
                            <Badge bg="success">{info.totalItems} éléments</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="text-muted">
                          {info.lastRefresh ? 
                            `Dernière mise à jour: ${formatDate(info.lastRefresh)}` : 
                            'Jamais mis à jour'}
                        </small>
                        
                        <Button 
                          size="sm" 
                          variant="outline-primary"
                          onClick={() => refreshStravaData(dataType)}
                          disabled={refreshing[dataType]}
                        >
                          {refreshing[dataType] ? (
                            <Spinner as="span" size="sm" animation="border" role="status" />
                          ) : (
                            <FontAwesomeIcon icon={faSync} />
                          )}
                        </Button>
                      </div>
                      
                      {info.error && (
                        <Alert variant="danger" className="mt-2 mb-0">
                          <small>{info.error}</small>
                        </Alert>
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
                
                <Button 
                  variant="primary" 
                  onClick={() => refreshStravaData('all')}
                  disabled={refreshing.activities || refreshing.segments || refreshing.clubs || refreshing.routes}
                >
                  <FontAwesomeIcon icon={faSync} className="me-2" />
                  Tout rafraîchir
                </Button>
              </Col>
            </Row>
          )}
          
          {/* Onglet Météo */}
          {activeTab === 'weather' && systemStatus && (
            <Row>
              <Col md={12}>
                <h5>Notifications météo</h5>
                <Card>
                  <Card.Body>
                    <div className="mb-3">
                      <strong>Statut:</strong>{' '}
                      <ServiceStatus status={systemStatus.services.weatherNotification.status} />
                    </div>
                    
                    {systemStatus.services.weatherNotification.details && (
                      <>
                        <h6>Emplacements surveillés</h6>
                        {systemStatus.services.weatherNotification.details.locations && 
                         systemStatus.services.weatherNotification.details.locations.length > 0 ? (
                          <ListGroup className="mb-3">
                            {systemStatus.services.weatherNotification.details.locations.map((location, index) => (
                              <ListGroup.Item key={index} className="d-flex align-items-center">
                                <FontAwesomeIcon icon={faCloudRain} className="me-2" />
                                {location.city || `${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`}
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        ) : (
                          <Alert variant="info">
                            Aucun emplacement n'est actuellement surveillé.
                          </Alert>
                        )}
                        
                        <div className="mb-3">
                          <strong>Intervalle de vérification:</strong>{' '}
                          {systemStatus.services.weatherNotification.details.checkInterval || 'Non configuré'}
                        </div>
                        
                        <div className="mb-3">
                          <strong>Dernière vérification:</strong>{' '}
                          {systemStatus.services.weatherNotification.details.lastCheck ? 
                            formatDate(systemStatus.services.weatherNotification.details.lastCheck) : 
                            'Jamais'}
                        </div>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
          
          {/* Onglet Quotas */}
          {activeTab === 'quotas' && statistics && (
            <Row>
              <Col md={12}>
                <h5>Gestion des quotas d'API</h5>
                <Table responsive>
                  <thead>
                    <tr>
                      <th>API</th>
                      <th>Quota 15min</th>
                      <th>Quota journalier</th>
                      <th>Utilisation</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(statistics).map(([apiName, data]) => (
                      <tr key={apiName}>
                        <td>{apiName}</td>
                        <td>
                          {data.quotaUsage?.fifteenMin.used} / {data.quotaUsage?.fifteenMin.limit}
                          <ProgressBar 
                            now={parseFloat(data.quotaUsage?.fifteenMin.percentage || 0)} 
                            variant={
                              parseFloat(data.quotaUsage?.fifteenMin.percentage || 0) > 90 ? 'danger' :
                              parseFloat(data.quotaUsage?.fifteenMin.percentage || 0) > 75 ? 'warning' : 'success'
                            }
                            className="mt-1"
                            style={{ height: '5px' }}
                          />
                        </td>
                        <td>
                          {data.quotaUsage?.day.used} / {data.quotaUsage?.day.limit}
                          <ProgressBar 
                            now={parseFloat(data.quotaUsage?.day.percentage || 0)} 
                            variant={
                              parseFloat(data.quotaUsage?.day.percentage || 0) > 90 ? 'danger' :
                              parseFloat(data.quotaUsage?.day.percentage || 0) > 75 ? 'warning' : 'success'
                            }
                            className="mt-1"
                            style={{ height: '5px' }}
                          />
                        </td>
                        <td>
                          <small>
                            Réinitialisation quota 15min: {formatTimeDifference(data.resetTimes?.fifteenMin)}
                            <br />
                            Réinitialisation quota journalier: {formatTimeDifference(data.resetTimes?.day)}
                          </small>
                        </td>
                        <td>
                          <ServiceStatus status={
                            parseFloat(data.quotaUsage?.day.percentage || 0) > 90 || 
                            parseFloat(data.quotaUsage?.fifteenMin.percentage || 0) > 90 ? 'critical' :
                            parseFloat(data.quotaUsage?.day.percentage || 0) > 75 || 
                            parseFloat(data.quotaUsage?.fifteenMin.percentage || 0) > 75 ? 'warning' : 'healthy'
                          } />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Col>
            </Row>
          )}
          
          {/* Onglet Métriques API */}
          {activeTab === 'api-metrics' && (
            <>
              <Row className="mb-4">
                <Col md={12}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>Métriques des services API</h5>
                    <div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-2"
                        onClick={() => loadDashboardData()}
                        disabled={loading || refreshing.metrics}
                      >
                        <FontAwesomeIcon icon={faSync} className={refreshing.metrics ? "fa-spin" : ""} />
                        <span className="ms-1">Actualiser</span>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => resetApiMetrics()}
                        disabled={loading || refreshing.metrics}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                        <span className="ms-1">Réinitialiser toutes les métriques</span>
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>
              
              {apiMetrics && (
                <Row>
                  <Col md={4}>
                    <Card className="mb-4">
                      <Card.Header className="bg-light">
                        <h6 className="mb-0">Services</h6>
                      </Card.Header>
                      <ListGroup variant="flush">
                        {Object.keys(apiMetrics).map(serviceName => (
                          <ListGroup.Item 
                            key={serviceName}
                            action
                            active={selectedService === serviceName}
                            onClick={() => setSelectedService(serviceName)}
                            className="d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <FontAwesomeIcon icon={faServer} className="me-2" />
                              {serviceName}
                            </div>
                            <Badge bg={
                              apiMetrics[serviceName].errorCount > 0 ? 'danger' : 
                              apiMetrics[serviceName].totalCalls > 1000 ? 'warning' : 'success'
                            } pill>
                              {apiMetrics[serviceName].totalCalls}
                            </Badge>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </Card>
                    
                    <Card>
                      <Card.Header className="bg-light">
                        <h6 className="mb-0">Statistiques globales</h6>
                      </Card.Header>
                      <ListGroup variant="flush">
                        <ListGroup.Item>
                          <div className="d-flex justify-content-between">
                            <span>Total des appels API</span>
                            <strong>
                              {Object.values(apiMetrics).reduce((total, service) => total + service.totalCalls, 0)}
                            </strong>
                          </div>
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <div className="d-flex justify-content-between">
                            <span>Total des erreurs</span>
                            <strong className={
                              Object.values(apiMetrics).reduce((total, service) => total + service.errorCount, 0) > 0 ? 'text-danger' : ''
                            }>
                              {Object.values(apiMetrics).reduce((total, service) => total + service.errorCount, 0)}
                            </strong>
                          </div>
                        </ListGroup.Item>
                        <ListGroup.Item>
                          <div className="d-flex justify-content-between">
                            <span>Taux d'erreur global</span>
                            <strong className={
                              calculateErrorRate(Object.values(apiMetrics)) > 5 ? 'text-danger' :
                              calculateErrorRate(Object.values(apiMetrics)) > 1 ? 'text-warning' : 'text-success'
                            }>
                              {calculateErrorRate(Object.values(apiMetrics))}%
                            </strong>
                          </div>
                        </ListGroup.Item>
                      </ListGroup>
                    </Card>
                  </Col>
                  
                  <Col md={8}>
                    {selectedService && serviceMetrics ? (
                      <Card>
                        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">Métriques détaillées : {selectedService}</h6>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => resetApiMetrics(selectedService)}
                            disabled={refreshing.metrics}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                            <span className="ms-1">Réinitialiser</span>
                          </Button>
                        </Card.Header>
                        <Card.Body>
                          <Row className="mb-4">
                            <Col md={3}>
                              <Card className="text-center h-100 border-0">
                                <Card.Body>
                                  <h3 className="mb-0">{serviceMetrics.metrics.totalCalls}</h3>
                                  <small className="text-muted">Appels totaux</small>
                                </Card.Body>
                              </Card>
                            </Col>
                            <Col md={3}>
                              <Card className="text-center h-100 border-0">
                                <Card.Body>
                                  <h3 className={serviceMetrics.metrics.errorCount > 0 ? 'text-danger mb-0' : 'mb-0'}>
                                    {serviceMetrics.metrics.errorCount}
                                  </h3>
                                  <small className="text-muted">Erreurs</small>
                                </Card.Body>
                              </Card>
                            </Col>
                            <Col md={3}>
                              <Card className="text-center h-100 border-0">
                                <Card.Body>
                                  <h3 className="mb-0">
                                    {serviceMetrics.metrics.cacheHits || 0}
                                  </h3>
                                  <small className="text-muted">Cache Hits</small>
                                </Card.Body>
                              </Card>
                            </Col>
                            <Col md={3}>
                              <Card className="text-center h-100 border-0">
                                <Card.Body>
                                  <h3 className="mb-0">
                                    {serviceMetrics.metrics.avgResponseTime ? 
                                      `${serviceMetrics.metrics.avgResponseTime.toFixed(0)}ms` : 'N/A'}
                                  </h3>
                                  <small className="text-muted">Temps moyen</small>
                                </Card.Body>
                              </Card>
                            </Col>
                          </Row>
                          
                          <Accordion defaultActiveKey="0" className="mb-3">
                            <Accordion.Item eventKey="0">
                              <Accordion.Header>
                                <FontAwesomeIcon icon={faChartBar} className="me-2" />
                                Statistiques par endpoint
                              </Accordion.Header>
                              <Accordion.Body>
                                {serviceMetrics.metrics.endpoints && Object.keys(serviceMetrics.metrics.endpoints).length > 0 ? (
                                  <Table striped bordered hover responsive size="sm">
                                    <thead>
                                      <tr>
                                        <th>Endpoint</th>
                                        <th>Appels</th>
                                        <th>Erreurs</th>
                                        <th>Temps moyen</th>
                                        <th>Cache</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {Object.entries(serviceMetrics.metrics.endpoints).map(([endpoint, data]) => (
                                        <tr key={endpoint}>
                                          <td>{endpoint}</td>
                                          <td>{data.calls}</td>
                                          <td className={data.errors > 0 ? 'text-danger' : ''}>
                                            {data.errors} {data.errors > 0 && `(${((data.errors / data.calls) * 100).toFixed(1)}%)`}
                                          </td>
                                          <td>{data.avgResponseTime ? `${data.avgResponseTime.toFixed(0)}ms` : 'N/A'}</td>
                                          <td>{data.cacheHits || 0}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                ) : (
                                  <Alert variant="info">Aucune donnée d'endpoint disponible</Alert>
                                )}
                              </Accordion.Body>
                            </Accordion.Item>
                            
                            {serviceMetrics.metrics.timeSeriesData && (
                              <Accordion.Item eventKey="1">
                                <Accordion.Header>
                                  <FontAwesomeIcon icon={faHistory} className="me-2" />
                                  Historique des appels
                                </Accordion.Header>
                                <Accordion.Body>
                                  <Table striped bordered hover responsive size="sm">
                                    <thead>
                                      <tr>
                                        <th>Période</th>
                                        <th>Appels</th>
                                        <th>Erreurs</th>
                                        <th>Temps moyen</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {serviceMetrics.metrics.timeSeriesData.map((entry, index) => (
                                        <tr key={index}>
                                          <td>{formatDate(entry.timestamp)}</td>
                                          <td>{entry.calls}</td>
                                          <td className={entry.errors > 0 ? 'text-danger' : ''}>
                                            {entry.errors}
                                          </td>
                                          <td>
                                            {entry.avgResponseTime ? `${entry.avgResponseTime.toFixed(0)}ms` : 'N/A'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                </Accordion.Body>
                              </Accordion.Item>
                            )}
                            
                            {serviceMetrics.metrics.recentErrors && serviceMetrics.metrics.recentErrors.length > 0 && (
                              <Accordion.Item eventKey="2">
                                <Accordion.Header>
                                  <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                                  Erreurs récentes
                                </Accordion.Header>
                                <Accordion.Body>
                                  <ListGroup variant="flush">
                                    {serviceMetrics.metrics.recentErrors.map((error, index) => (
                                      <ListGroup.Item key={index} className="text-danger">
                                        <div>
                                          <strong>{error.endpoint || 'N/A'}</strong> - {formatDate(error.timestamp)}
                                        </div>
                                        <div><small>{error.message}</small></div>
                                      </ListGroup.Item>
                                    ))}
                                  </ListGroup>
                                </Accordion.Body>
                              </Accordion.Item>
                            )}
                          </Accordion>
                        </Card.Body>
                      </Card>
                    ) : (
                      <div className="d-flex justify-content-center align-items-center h-100">
                        <div className="text-center text-muted my-5">
                          <FontAwesomeIcon icon={faServer} size="3x" className="mb-3" />
                          <h5>Sélectionnez un service pour voir ses métriques détaillées</h5>
                        </div>
                      </div>
                    )}
                  </Col>
                </Row>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ApiMonitoringDashboard;
