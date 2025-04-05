import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Badge, Tabs, Tab, Alert } from 'react-bootstrap';
import { useParams, useHistory } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, faPlay, faSave, faCalendarAlt, 
  faShareAlt, faEdit, faTrash, faHeartbeat,
  faClock, faChartLine, faPowerOff, faMountain
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../components/common/NotificationSystem';

// Import des composants d'entraînement
import HIITVisualizer from '../components/training/HIITVisualizer';

// Services et utilitaires
import FTPService from '../services/FTPEstimationService';

/**
 * Page de détail pour un entraînement spécifique
 */
const WorkoutDetail = () => {
  const { id } = useParams();
  const history = useHistory();
  const { t } = useTranslation();
  const { notify } = useNotification();
  const [workout, setWorkout] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState([]);

  // Charger les données de l'entraînement et du profil utilisateur
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Simulation d'appel API
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Profil utilisateur (à remplacer par un appel réel à l'API)
        const mockUserProfile = {
          id: 'u123',
          name: 'Jean Dupont',
          age: 35,
          weight: 75,
          height: 182,
          ftp: 240,
          level: 'intermediate',
          cyclist_type: 'all-rounder',
          preferred_terrain: 'mixed',
          weekly_hours: 8,
          hrmax: 185,
          hrrest: 52,
          created_at: '2024-07-15'
        };
        
        setUserProfile(mockUserProfile);
        
        // Entraînement (à remplacer par un appel réel à l'API)
        // Dans une application réelle, vous feriez un appel API avec l'ID pour obtenir les détails
        const mockWorkout = getMockWorkout(id, mockUserProfile.ftp);
        
        if (!mockWorkout) {
          notify.error('Entraînement introuvable');
          history.push('/training');
          return;
        }
        
        setWorkout(mockWorkout);
        
        // Historique d'entraînement (à remplacer par un appel réel à l'API)
        setWorkoutHistory(getMockWorkoutHistory(id));
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        notify.error('Impossible de charger les détails de l\'entraînement');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, history, notify]);

  /**
   * Récupère un entraînement mocké basé sur l'ID
   */
  const getMockWorkout = (workoutId, ftp = 200) => {
    // Dans une application réelle, cette fonction serait remplacée par un appel API
    
    // Simuler un entraînement au seuil
    if (workoutId === 'threshold-classic' || workoutId === 'w1') {
      return {
        id: 'threshold-classic',
        name: 'Seuil Classique',
        type: 'THRESHOLD',
        description: 'Intervalles au seuil pour améliorer votre puissance soutenue et repousser votre seuil lactique.',
        duration: 60,
        intensityLevel: 4,
        difficulty: 2,
        targetPower: Math.round(ftp * 0.95),
        terrain: 'flat',
        tss: 85,
        intervals: [
          { type: 'warmup', duration: 10*60, power: Math.round(ftp * 0.65) },
          { type: 'threshold', duration: 8*60, power: Math.round(ftp * 0.95) },
          { type: 'recovery', duration: 4*60, power: Math.round(ftp * 0.5) },
          { type: 'threshold', duration: 8*60, power: Math.round(ftp * 0.95) },
          { type: 'recovery', duration: 4*60, power: Math.round(ftp * 0.5) },
          { type: 'threshold', duration: 8*60, power: Math.round(ftp * 0.95) },
          { type: 'cooldown', duration: 10*60, power: Math.round(ftp * 0.5) }
        ]
      };
    }
    
    // Simuler un entraînement d'endurance
    if (workoutId === 'endurance-foundation' || workoutId === 'w2') {
      return {
        id: 'endurance-foundation',
        name: 'Fondation d\'Endurance',
        type: 'ENDURANCE',
        description: 'Développez votre endurance aérobie fondamentale avec cette sortie stable en zone 2.',
        duration: 90,
        intensityLevel: 2,
        difficulty: 1,
        targetPower: Math.round(ftp * 0.7),
        terrain: 'flat',
        tss: 70,
        intervals: [
          { type: 'warmup', duration: 10*60, power: Math.round(ftp * 0.6) },
          { type: 'steady', duration: 70*60, power: Math.round(ftp * 0.7) },
          { type: 'cooldown', duration: 10*60, power: Math.round(ftp * 0.5) }
        ]
      };
    }
    
    // Simuler un entraînement HIIT
    if (workoutId === 'hiit-vo2max' || workoutId === 'w3') {
      return {
        id: 'hiit-vo2max',
        name: 'HIIT VO2max',
        type: 'HIIT',
        description: 'Intervalles à haute intensité pour développer votre VO2max et votre capacité anaérobie.',
        duration: 60,
        intensityLevel: 5,
        difficulty: 3,
        targetPower: ftp,
        terrain: 'flat',
        tss: 100,
        intervals: [
          { type: 'warmup', duration: 10*60, power: Math.round(ftp * 0.65) },
          { type: 'recovery', duration: 2*60, power: Math.round(ftp * 0.5) },
          { type: 'vo2max', duration: 3*60, power: Math.round(ftp * 1.15) },
          { type: 'recovery', duration: 3*60, power: Math.round(ftp * 0.5) },
          { type: 'vo2max', duration: 3*60, power: Math.round(ftp * 1.15) },
          { type: 'recovery', duration: 3*60, power: Math.round(ftp * 0.5) },
          { type: 'vo2max', duration: 3*60, power: Math.round(ftp * 1.15) },
          { type: 'recovery', duration: 3*60, power: Math.round(ftp * 0.5) },
          { type: 'vo2max', duration: 3*60, power: Math.round(ftp * 1.15) },
          { type: 'recovery', duration: 3*60, power: Math.round(ftp * 0.5) },
          { type: 'vo2max', duration: 3*60, power: Math.round(ftp * 1.15) },
          { type: 'cooldown', duration: 10*60, power: Math.round(ftp * 0.5) }
        ]
      };
    }
    
    // Entraînement par défaut si l'ID ne correspond à aucun cas connu
    return {
      id: workoutId,
      name: 'Entraînement personnalisé',
      type: 'CUSTOM',
      description: 'Description non disponible pour cet entraînement personnalisé.',
      duration: 45,
      intensityLevel: 3,
      difficulty: 2,
      targetPower: Math.round(ftp * 0.8),
      terrain: 'mixed',
      tss: 65,
      intervals: [
        { type: 'warmup', duration: 10*60, power: Math.round(ftp * 0.6) },
        { type: 'steady', duration: 30*60, power: Math.round(ftp * 0.8) },
        { type: 'cooldown', duration: 5*60, power: Math.round(ftp * 0.5) }
      ]
    };
  };

  /**
   * Récupère l'historique mockée d'un entraînement
   */
  const getMockWorkoutHistory = (workoutId) => {
    // Dans une application réelle, cette fonction serait remplacée par un appel API
    return [
      {
        id: 'h1',
        date: '2025-03-20',
        completed: true,
        duration: 60,
        avgPower: 210,
        normalizedPower: 230,
        tss: 85,
        ifactor: 0.92,
        heartRate: {
          avg: 145,
          max: 172
        },
        zones: {
          z1: 12, // % du temps passé en zone 1
          z2: 18,
          z3: 10,
          z4: 52,
          z5: 8,
          z6: 0,
          z7: 0
        }
      },
      {
        id: 'h2',
        date: '2025-02-25',
        completed: true,
        duration: 62,
        avgPower: 205,
        normalizedPower: 225,
        tss: 83,
        ifactor: 0.90,
        heartRate: {
          avg: 148,
          max: 175
        },
        zones: {
          z1: 14,
          z2: 20,
          z3: 12,
          z4: 47,
          z5: 7,
          z6: 0,
          z7: 0
        }
      },
      {
        id: 'h3',
        date: '2025-01-30',
        completed: false, // Entraînement non terminé
        duration: 45, // Sur 60 prévus
        avgPower: 208,
        normalizedPower: 220,
        tss: 62,
        ifactor: 0.88,
        heartRate: {
          avg: 146,
          max: 168
        },
        zones: {
          z1: 15,
          z2: 22,
          z3: 15,
          z4: 42,
          z5: 6,
          z6: 0,
          z7: 0
        }
      }
    ];
  };

  /**
   * Démarrer l'entraînement
   */
  const handleStartWorkout = () => {
    setShowVisualizer(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Terminer un entraînement
   */
  const handleWorkoutComplete = (stats) => {
    try {
      console.log('Entraînement terminé avec les statistiques:', stats);
      notify.success(`Entraînement terminé! TSS: ${stats.tss}`);
      
      // Mise à jour des statistiques (à remplacer par un appel API)
      // Logique pour mettre à jour les statistiques utilisateur
      
      setShowVisualizer(false);
    } catch (error) {
      console.error('Erreur lors de la finalisation de l\'entraînement:', error);
      notify.error('Erreur lors de la finalisation');
    }
  };

  /**
   * Planifier l'entraînement pour plus tard
   */
  const handleScheduleWorkout = () => {
    try {
      // Logique pour planifier l'entraînement
      notify.success('Entraînement ajouté à votre calendrier');
    } catch (error) {
      console.error('Erreur lors de la planification:', error);
      notify.error('Impossible de planifier l\'entraînement');
    }
  };

  /**
   * Formater la date
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  /**
   * Obtenir la couleur pour le type d'entraînement
   */
  const getTypeColor = (type) => {
    switch (type) {
      case 'RECOVERY': return 'success';
      case 'ENDURANCE': return 'info';
      case 'THRESHOLD': return 'warning';
      case 'HIIT': return 'danger';
      default: return 'secondary';
    }
  };

  // Affichage pendant le chargement
  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement des détails de l'entraînement...</p>
        </div>
      </Container>
    );
  }

  // Si l'entraînement n'a pas été trouvé
  if (!workout) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Entraînement introuvable</Alert.Heading>
          <p>L'entraînement demandé n'existe pas ou a été supprimé.</p>
          <Button 
            variant="outline-danger"
            onClick={() => history.push('/training')}
          >
            Retour aux entraînements
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Button 
          variant="link" 
          className="p-0 text-decoration-none"
          onClick={() => history.push('/training')}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Retour aux entraînements
        </Button>
        
        <div>
          <Button 
            variant="outline-secondary" 
            className="me-2"
            onClick={() => notify.info('Fonctionnalité de partage non implémentée')}
          >
            <FontAwesomeIcon icon={faShareAlt} className="me-2" />
            Partager
          </Button>
          <Button 
            variant="outline-danger"
            onClick={() => notify.info('Fonctionnalité de suppression non implémentée')}
          >
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            Supprimer
          </Button>
        </div>
      </div>
      
      {showVisualizer && (
        <Card className="mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0">Visualiseur d'entraînement</h3>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => setShowVisualizer(false)}
            >
              Fermer
            </Button>
          </Card.Header>
          <Card.Body>
            <HIITVisualizer 
              workout={workout}
              onComplete={handleWorkoutComplete}
              onSave={() => notify.success('Entraînement sauvegardé')}
            />
          </Card.Body>
        </Card>
      )}
      
      <div className="workout-header mb-4">
        <h1>{workout.name}</h1>
        <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
          <Badge 
            bg={getTypeColor(workout.type)} 
            className="me-2 py-2 px-3"
          >
            {workout.type}
          </Badge>
          
          <Badge bg="secondary" className="me-2">
            <FontAwesomeIcon icon={faClock} className="me-1" />
            {workout.duration} min
          </Badge>
          
          <Badge bg="secondary" className="me-2">
            <FontAwesomeIcon icon={faHeartbeat} className="me-1" />
            TSS: {workout.tss}
          </Badge>
          
          <Badge bg="secondary" className="me-2">
            <FontAwesomeIcon icon={faPowerOff} className="me-1" />
            {workout.targetPower} W
          </Badge>
          
          <Badge bg="secondary">
            <FontAwesomeIcon icon={faMountain} className="me-1" />
            {t(`terrain.${workout.terrain}`)}
          </Badge>
        </div>
        
        <p className="lead">{workout.description}</p>
        
        <div className="workout-actions mb-4">
          <Button 
            variant="primary" 
            size="lg"
            className="me-2"
            onClick={handleStartWorkout}
          >
            <FontAwesomeIcon icon={faPlay} className="me-2" />
            Démarrer l'entraînement
          </Button>
          
          <Button 
            variant="outline-primary" 
            className="me-2"
            onClick={handleScheduleWorkout}
          >
            <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
            Planifier
          </Button>
          
          <Button 
            variant="outline-secondary"
            onClick={() => notify.info('Fonctionnalité d\'édition non implémentée')}
          >
            <FontAwesomeIcon icon={faEdit} className="me-2" />
            Modifier
          </Button>
        </div>
      </div>
      
      <Tabs
        activeKey={activeTab}
        onSelect={(key) => setActiveTab(key)}
        className="mb-4"
      >
        <Tab 
          eventKey="details" 
          title="Détails de l'entraînement"
        >
          <Card>
            <Card.Body>
              <h4 className="mb-3">Structure de l'entraînement</h4>
              
              <div className="workout-structure mb-4">
                {workout.intervals.map((interval, index) => {
                  const intervalColors = {
                    warmup: 'info',
                    recovery: 'secondary',
                    steady: 'success',
                    threshold: 'warning',
                    vo2max: 'danger',
                    anaerobic: 'dark',
                    sprint: 'dark',
                    cooldown: 'primary'
                  };
                  
                  const color = intervalColors[interval.type] || 'secondary';
                  const durationMinutes = Math.floor(interval.duration / 60);
                  const durationSeconds = interval.duration % 60;
                  
                  return (
                    <div 
                      key={index} 
                      className={`workout-interval mb-2 p-3 border-start border-5 border-${color}`}
                      style={{ backgroundColor: `var(--bs-${color}-bg-subtle)` }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h5 className="mb-1">{t(`intervals.${interval.type}`)}</h5>
                          <div>
                            <Badge 
                              bg={color} 
                              className="me-2"
                            >
                              {interval.power} W
                            </Badge>
                            <Badge 
                              bg="light" 
                              text="dark"
                            >
                              {durationMinutes}:{durationSeconds.toString().padStart(2, '0')}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-end">
                          {userProfile?.ftp && (
                            <div className="ftp-percentage">
                              <span className="d-block">{Math.round((interval.power / userProfile.ftp) * 100)}% FTP</span>
                              <small className="text-muted">
                                Zone {FTPService.calculatePowerZones(userProfile.ftp)
                                  .findIndex(zone => 
                                    interval.power >= zone.min && interval.power <= zone.max
                                  ) + 1}
                              </small>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <h4 className="mb-3">Objectifs</h4>
              <p>
                Cet entraînement vise à améliorer votre {workout.type === 'THRESHOLD' ? 'seuil lactique' : 
                  workout.type === 'ENDURANCE' ? 'endurance aérobie' :
                  workout.type === 'HIIT' ? 'VO2max et puissance anaérobie' : 
                  'condition physique générale'
                }.
              </p>
              
              <h4 className="mb-3">Conseils d'exécution</h4>
              <ul>
                <li>Maintenir une cadence de pédalage constante (85-95 rpm)</li>
                <li>Rester bien hydraté tout au long de la séance</li>
                <li>Suivre attentivement les intervalles de récupération</li>
                {workout.type === 'THRESHOLD' && (
                  <li>Maintenir une respiration régulière pendant les intervalles au seuil</li>
                )}
                {workout.type === 'HIIT' && (
                  <li>Maximiser l'effort pendant les intervalles à haute intensité</li>
                )}
              </ul>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab 
          eventKey="history" 
          title="Historique"
        >
          <Card>
            <Card.Body>
              <h4 className="mb-3">Vos performances précédentes</h4>
              
              {workoutHistory.length > 0 ? (
                <div className="workout-history">
                  {workoutHistory.map((history, index) => (
                    <Card 
                      key={index} 
                      className="mb-3"
                      border={history.completed ? 'success' : 'warning'}
                    >
                      <Card.Header className="d-flex justify-content-between">
                        <div>{formatDate(history.date)}</div>
                        {history.completed ? (
                          <Badge bg="success">Terminé</Badge>
                        ) : (
                          <Badge bg="warning">Incomplet</Badge>
                        )}
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={6}>
                            <div className="mb-3">
                              <h5>Métriques de puissance</h5>
                              <div className="d-flex justify-content-between">
                                <span>Puissance moyenne:</span>
                                <strong>{history.avgPower} W</strong>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span>Puissance normalisée:</span>
                                <strong>{history.normalizedPower} W</strong>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span>Facteur d'intensité:</span>
                                <strong>{history.ifactor}</strong>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span>TSS:</span>
                                <strong>{history.tss}</strong>
                              </div>
                            </div>
                          </Col>
                          
                          <Col md={6}>
                            <div className="mb-3">
                              <h5>Métriques cardiaques</h5>
                              <div className="d-flex justify-content-between">
                                <span>FC moyenne:</span>
                                <strong>{history.heartRate.avg} bpm</strong>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span>FC max:</span>
                                <strong>{history.heartRate.max} bpm</strong>
                              </div>
                              <div className="d-flex justify-content-between">
                                <span>Durée:</span>
                                <strong>{history.duration} min</strong>
                              </div>
                            </div>
                          </Col>
                        </Row>
                        
                        <h5 className="mb-2">Répartition des zones</h5>
                        <div className="zone-distribution">
                          <div className="d-flex" style={{ height: '30px' }}>
                            {Object.entries(history.zones).map(([zone, percentage], idx) => (
                              <div 
                                key={zone}
                                className={`zone-${zone}`}
                                style={{ 
                                  width: `${percentage}%`,
                                  backgroundColor: 
                                    idx === 0 ? '#91c8e4' : // Z1
                                    idx === 1 ? '#7cb342' : // Z2
                                    idx === 2 ? '#4b89dc' : // Z3
                                    idx === 3 ? '#f7ca18' : // Z4
                                    idx === 4 ? '#e84c3d' : // Z5
                                    idx === 5 ? '#9a59b5' : // Z6
                                    '#2d3e50',              // Z7
                                  height: '100%',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  color: idx >= 3 ? 'white' : 'black',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                {percentage > 8 && `${percentage}%`}
                              </div>
                            ))}
                          </div>
                          <div className="d-flex justify-content-between mt-1">
                            <small>Z1</small>
                            <small>Z2</small>
                            <small>Z3</small>
                            <small>Z4</small>
                            <small>Z5</small>
                            <small>Z6</small>
                            <small>Z7</small>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert variant="info">
                  Vous n'avez pas encore effectué cet entraînement. Les données historiques apparaîtront ici après l'avoir terminé.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab 
          eventKey="similar" 
          title="Entraînements similaires"
        >
          <Card>
            <Card.Body>
              <h4 className="mb-3">Entraînements similaires recommandés</h4>
              
              <Alert variant="info">
                <Alert.Heading>Fonction en développement</Alert.Heading>
                <p>
                  Les recommandations d'entraînements similaires seront disponibles dans une prochaine mise à jour.
                </p>
              </Alert>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default WorkoutDetail;
