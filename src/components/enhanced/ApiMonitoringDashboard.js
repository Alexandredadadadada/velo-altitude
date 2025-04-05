import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Card, Row, Col, Table, Badge, Button, 
  Spinner, Alert, Tabs, Tab, ListGroup, ProgressBar 
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
import EnhancedMetaTags from '../common/EnhancedMetaTags';
  faCheckCircle, faExclamationTriangle, faTimesCircle, 
  faSync, faCloudRain, faRunning, faRoute, faUsers
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
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/apimonitoringdashboard"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
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
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState({
    status: false,
    token: false,
    activities: false,
    segments: false,
    clubs: false,
    routes: false
  });

  // Charger les données initiales
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Fonction pour charger toutes les données du tableau de bord
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statusResponse, statsResponse] = await Promise.all([
        axios.get('/api/monitoring/status'),
        axios.get('/api/monitoring/statistics')
      ]);

      setSystemStatus(statusResponse.data);
      setStatistics(statsResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Rafraîchir manuellement le token Strava
  const refreshStravaToken = async () => {
    try {
      setRefreshing({ ...refreshing, token: true });
      await axios.post('/api/monitoring/strava/refresh-token');
      await loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setRefreshing({ ...refreshing, token: false });
    }
  };

  // Rafraîchir manuellement les données Strava
  const refreshStravaData = async (dataType) => {
    try {
      setRefreshing({ ...refreshing, [dataType]: true });
      await axios.post('/api/monitoring/strava/refresh-data', { dataType });
      await loadDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setRefreshing({ ...refreshing, [dataType]: false });
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
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ApiMonitoringDashboard;
