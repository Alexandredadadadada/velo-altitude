import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Card, Button, Row, Col, Badge, Form, Tab, Tabs, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBicycle, faRunning, faDumbbell, faHeartbeat, 
  faChartLine, faMountain, faClock, faFilter, faStar
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../common/NotificationSystem';
import TrainingSystem, { TRAINING_TYPES } from '../../services/TrainingSystem';
import FTPService from '../../services/FTPEstimationService';

/**
 * Bibliothèque complète d'entraînements
 * Intègre tous les types d'entraînements dans une interface unifiée
 */
const WorkoutLibrary = ({ userProfile, onSelectWorkout, onSaveWorkout }) => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState('all');
  const [workouts, setWorkouts] = useState([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [filters, setFilters] = useState({
    duration: [0, 180],
    intensity: [0, 5],
    type: 'all',
    difficulty: 0
  });
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);

  // Charger les entraînements
  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        setLoading(true);
        
        // Simulation d'appel API (à remplacer par un appel réel)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Générer des entraînements selon le profil
        const workoutLibrary = generateWorkoutLibrary(userProfile);
        setWorkouts(workoutLibrary);
        setFilteredWorkouts(workoutLibrary);
        
        // Générer des recommandations
        if (userProfile) {
          const userRecommendations = TrainingSystem.getTrainingRecommendations(
            userProfile, 
            [] // Historique d'entraînement à intégrer
          );
          setRecommendations(userRecommendations);
        }
        
        notify.success('Bibliothèque d\'entraînements chargée');
      } catch (error) {
        console.error('Erreur lors du chargement des entraînements:', error);
        notify.error('Impossible de charger les entraînements', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadWorkouts();
  }, [userProfile, notify]);

  // Filtrer les entraînements selon les critères
  useEffect(() => {
    let filtered = [...workouts];
    
    // Filtrer par onglet actif (type d'entraînement)
    if (activeTab !== 'all') {
      filtered = filtered.filter(workout => workout.type === activeTab);
    }
    
    // Filtrer par durée
    filtered = filtered.filter(workout => 
      workout.duration >= filters.duration[0] && 
      workout.duration <= filters.duration[1]
    );
    
    // Filtrer par intensité
    filtered = filtered.filter(workout => 
      workout.intensityLevel >= filters.intensity[0] && 
      workout.intensityLevel <= filters.intensity[1]
    );
    
    // Filtrer par difficulté
    if (filters.difficulty > 0) {
      filtered = filtered.filter(workout => 
        workout.difficulty === filters.difficulty
      );
    }
    
    setFilteredWorkouts(filtered);
  }, [activeTab, filters, workouts]);

  /**
   * Génère une bibliothèque d'entraînements adaptée au profil utilisateur
   */
  const generateWorkoutLibrary = (profile) => {
    if (!profile) {
      return getDefaultWorkouts();
    }
    
    // Valider et ajuster la FTP si nécessaire
    const ftp = FTPService.validateFTP(profile.ftp, profile);
    const level = profile.level || 'intermediate';
    
    let allWorkouts = [];
    
    // Ajouter des entraînements d'endurance
    allWorkouts = [...allWorkouts, ...generateEnduranceWorkouts(ftp, level)];
    
    // Ajouter des entraînements au seuil
    allWorkouts = [...allWorkouts, ...generateThresholdWorkouts(ftp, level)];
    
    // Ajouter des entraînements VO2max
    allWorkouts = [...allWorkouts, ...generateVO2maxWorkouts(ftp, level)];
    
    // Ajouter des entraînements de récupération
    allWorkouts = [...allWorkouts, ...generateRecoveryWorkouts(ftp)];
    
    // Ajouter des entraînements de force
    allWorkouts = [...allWorkouts, ...generateStrengthWorkouts(ftp, level)];
    
    // Ajouter des entraînements en montagne si pertinent
    if (profile.preferred_terrain === 'mountain' || profile.cyclist_type === 'climber') {
      allWorkouts = [...allWorkouts, ...generateClimbingWorkouts(ftp, level)];
    }
    
    // Ajouter des entraînements HIIT avancés pour niveaux appropriés
    if (level === 'intermediate' || level === 'advanced' || level === 'elite') {
      allWorkouts = [...allWorkouts, ...generateHIITWorkouts(ftp, level)];
    }
    
    return allWorkouts;
  };

  /**
   * Fournit une bibliothèque d'entraînements par défaut
   */
  const getDefaultWorkouts = () => {
    // FTP par défaut pour les exemples
    const defaultFtp = 200;
    
    // Combiner des entraînements de base de différents types
    return [
      ...generateEnduranceWorkouts(defaultFtp, 'intermediate').slice(0, 3),
      ...generateThresholdWorkouts(defaultFtp, 'intermediate').slice(0, 2),
      ...generateRecoveryWorkouts(defaultFtp).slice(0, 1),
      ...generateVO2maxWorkouts(defaultFtp, 'intermediate').slice(0, 1)
    ];
  };

  /**
   * Génère des entraînements d'endurance
   */
  const generateEnduranceWorkouts = (ftp, level) => {
    // Ajuster l'intensité selon le niveau
    const intensityMap = {
      'beginner': 0.65,
      'intermediate': 0.7,
      'advanced': 0.75,
      'elite': 0.75
    };
    
    const baseIntensity = intensityMap[level] || 0.7;
    
    return [
      {
        id: 'endurance-foundation',
        name: 'Fondation d\'Endurance',
        type: TRAINING_TYPES.ENDURANCE,
        description: 'Développez votre endurance aérobie fondamentale avec cette sortie stable en zone 2.',
        duration: 90, // minutes
        intensityLevel: 2,
        difficulty: level === 'beginner' ? 2 : 1,
        targetPower: Math.round(ftp * baseIntensity),
        terrain: 'flat',
        intervals: [
          { type: 'warmup', duration: 10*60, power: Math.round(ftp * 0.6) },
          { type: 'steady', duration: 70*60, power: Math.round(ftp * baseIntensity) },
          { type: 'cooldown', duration: 10*60, power: Math.round(ftp * 0.5) }
        ]
      },
      {
        id: 'endurance-builder',
        name: 'Construction d\'Endurance',
        type: TRAINING_TYPES.ENDURANCE,
        description: 'Sortie longue pour développer l\'endurance aérobie et la capacité à utiliser les graisses comme carburant.',
        duration: 120,
        intensityLevel: 2,
        difficulty: level === 'beginner' ? 3 : 2,
        targetPower: Math.round(ftp * baseIntensity),
        terrain: 'mixed',
        intervals: [
          { type: 'warmup', duration: 15*60, power: Math.round(ftp * 0.6) },
          { type: 'steady', duration: 90*60, power: Math.round(ftp * baseIntensity) },
          { type: 'cooldown', duration: 15*60, power: Math.round(ftp * 0.5) }
        ]
      },
      {
        id: 'tempo-intervals',
        name: 'Intervalles Tempo',
        type: TRAINING_TYPES.TEMPO,
        description: 'Alternance entre zone d\'endurance et zone tempo pour améliorer l\'économie et la tolérance à l\'acide lactique.',
        duration: 75,
        intensityLevel: 3,
        difficulty: 2,
        targetPower: Math.round(ftp * 0.85),
        terrain: 'mixed',
        intervals: [
          { type: 'warmup', duration: 10*60, power: Math.round(ftp * 0.6) },
          { type: 'steady', duration: 15*60, power: Math.round(ftp * 0.75) },
          { type: 'steady', duration: 10*60, power: Math.round(ftp * 0.85) },
          { type: 'recovery', duration: 5*60, power: Math.round(ftp * 0.6) },
          { type: 'steady', duration: 10*60, power: Math.round(ftp * 0.75) },
          { type: 'steady', duration: 10*60, power: Math.round(ftp * 0.85) },
          { type: 'recovery', duration: 5*60, power: Math.round(ftp * 0.6) },
          { type: 'cooldown', duration: 10*60, power: Math.round(ftp * 0.5) }
        ]
      }
    ];
  };

  /**
   * Génère des entraînements au seuil
   */
  const generateThresholdWorkouts = (ftp, level) => {
    // Ajuster les paramètres selon le niveau
    const levelParams = {
      beginner: {
        intensity: 0.9,
        intervalDuration: 5*60,
        sets: 3
      },
      intermediate: {
        intensity: 0.95,
        intervalDuration: 8*60,
        sets: 3
      },
      advanced: {
        intensity: 1.0,
        intervalDuration: 10*60,
        sets: 3
      },
      elite: {
        intensity: 1.02,
        intervalDuration: 12*60,
        sets: 3
      }
    };
    
    const params = levelParams[level] || levelParams.intermediate;
    
    return [
      {
        id: 'threshold-classic',
        name: 'Seuil Classique',
        type: TRAINING_TYPES.THRESHOLD,
        description: 'Intervalles au seuil pour améliorer votre puissance soutenue et repousser votre seuil lactique.',
        duration: 60,
        intensityLevel: 4,
        difficulty: level === 'beginner' ? 3 : 2,
        targetPower: Math.round(ftp * params.intensity),
        terrain: 'flat',
        intervals: [
          { type: 'warmup', duration: 10*60, power: Math.round(ftp * 0.65) },
          { 
            type: 'threshold', 
            duration: params.intervalDuration, 
            power: Math.round(ftp * params.intensity) 
          },
          { 
            type: 'recovery', 
            duration: Math.round(params.intervalDuration/2), 
            power: Math.round(ftp * 0.5) 
          },
          { 
            type: 'threshold', 
            duration: params.intervalDuration, 
            power: Math.round(ftp * params.intensity) 
          },
          { 
            type: 'recovery', 
            duration: Math.round(params.intervalDuration/2), 
            power: Math.round(ftp * 0.5) 
          },
          { 
            type: 'threshold', 
            duration: params.intervalDuration, 
            power: Math.round(ftp * params.intensity) 
          },
          { type: 'cooldown', duration: 10*60, power: Math.round(ftp * 0.5) }
        ]
      },
      {
        id: 'threshold-progessive',
        name: 'Seuil Progressif',
        type: TRAINING_TYPES.THRESHOLD,
        description: 'Intervalles au seuil avec intensité progressive pour simuler des conditions de course.',
        duration: 75,
        intensityLevel: 4,
        difficulty: 3,
        targetPower: Math.round(ftp * params.intensity),
        terrain: 'mixed',
        intervals: [
          { type: 'warmup', duration: 12*60, power: Math.round(ftp * 0.65) },
          { type: 'threshold', duration: 4*60, power: Math.round(ftp * 0.9) },
          { type: 'threshold', duration: 4*60, power: Math.round(ftp * 0.95) },
          { type: 'threshold', duration: 4*60, power: Math.round(ftp * 1.0) },
          { type: 'recovery', duration: 5*60, power: Math.round(ftp * 0.5) },
          { type: 'threshold', duration: 4*60, power: Math.round(ftp * 0.9) },
          { type: 'threshold', duration: 4*60, power: Math.round(ftp * 0.95) },
          { type: 'threshold', duration: 4*60, power: Math.round(ftp * 1.0) },
          { type: 'recovery', duration: 5*60, power: Math.round(ftp * 0.5) },
          { type: 'threshold', duration: 4*60, power: Math.round(ftp * 0.9) },
          { type: 'threshold', duration: 4*60, power: Math.round(ftp * 0.95) },
          { type: 'threshold', duration: 4*60, power: Math.round(ftp * 1.0) },
          { type: 'cooldown', duration: 12*60, power: Math.round(ftp * 0.5) }
        ]
      }
    ];
  };

  /**
   * Génère des entraînements VO2max
   */
  const generateVO2maxWorkouts = (ftp, level) => {
    // À implémenter selon le niveau
    // Ces entraînements seraient plus intenses et adaptés aux niveaux plus avancés
    return [];
  };

  /**
   * Génère des entraînements de récupération
   */
  const generateRecoveryWorkouts = (ftp) => {
    return [
      {
        id: 'active-recovery',
        name: 'Récupération Active',
        type: TRAINING_TYPES.RECOVERY,
        description: 'Sortie légère pour favoriser la récupération tout en maintenant le mouvement.',
        duration: 45,
        intensityLevel: 1,
        difficulty: 1,
        targetPower: Math.round(ftp * 0.55),
        terrain: 'flat',
        intervals: [
          { type: 'warmup', duration: 5*60, power: Math.round(ftp * 0.5) },
          { type: 'steady', duration: 35*60, power: Math.round(ftp * 0.55) },
          { type: 'cooldown', duration: 5*60, power: Math.round(ftp * 0.5) }
        ]
      }
    ];
  };

  /**
   * Génère des entraînements de force
   */
  const generateStrengthWorkouts = (ftp, level) => {
    // À implémenter
    return [];
  };

  /**
   * Génère des entraînements en montagne
   */
  const generateClimbingWorkouts = (ftp, level) => {
    // À implémenter
    return [];
  };

  /**
   * Génère des entraînements HIIT avancés
   */
  const generateHIITWorkouts = (ftp, level) => {
    // À implémenter - pourrait appeler la fonction existante dans HIITTemplates
    return [];
  };

  /**
   * Sélectionne un entraînement
   */
  const handleSelectWorkout = (workout) => {
    setSelectedWorkout(workout);
    
    if (onSelectWorkout) {
      onSelectWorkout(workout);
    }
  };

  /**
   * Sauvegarde un entraînement dans le calendrier utilisateur
   */
  const handleSaveWorkout = () => {
    if (!selectedWorkout) {
      notify.warning('Aucun entraînement sélectionné');
      return;
    }
    
    try {
      // Traitement pour la sauvegarde
      if (onSaveWorkout) {
        const result = onSaveWorkout({
          ...selectedWorkout,
          date: new Date().toISOString(),
          userId: userProfile?.id
        });
        
        if (result) {
          notify.success('Entraînement ajouté à votre calendrier');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'entraînement:', error);
      notify.error('Impossible de sauvegarder l\'entraînement', error);
    }
  };

  /**
   * Met à jour les filtres
   */
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Icônes pour les types d'entraînement
  const typeIcons = {
    [TRAINING_TYPES.ENDURANCE]: faBicycle,
    [TRAINING_TYPES.TEMPO]: faChartLine,
    [TRAINING_TYPES.THRESHOLD]: faHeartbeat,
    [TRAINING_TYPES.VO2MAX]: faRunning,
    [TRAINING_TYPES.HIIT]: faChartLine,
    [TRAINING_TYPES.RECOVERY]: faHeartbeat,
    [TRAINING_TYPES.STRENGTH]: faDumbbell,
    [TRAINING_TYPES.CLIMBING]: faMountain
  };

  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-2">Chargement de la bibliothèque d'entraînements...</p>
      </div>
    );
  }

  return (
    <div className="workout-library">
      <div className="heading mb-4">
        <h2>Bibliothèque d'Entraînements</h2>
        <p className="text-muted">
          Explorez notre collection complète d'entraînements adaptés à votre profil
        </p>
      </div>

      {recommendations && recommendations.message && (
        <Alert variant="info" className="mb-4">
          <Alert.Heading>Recommandations personnalisées</Alert.Heading>
          <p>{recommendations.message}</p>
          {recommendations.focusAreas && recommendations.focusAreas.length > 0 && (
            <div className="mt-2">
              <strong>Domaines à privilégier:</strong>
              <div className="d-flex flex-wrap gap-2 mt-1">
                {recommendations.focusAreas.map((area, idx) => (
                  <Badge bg="primary" key={idx}>{area}</Badge>
                ))}
              </div>
            </div>
          )}
        </Alert>
      )}

      <div className="filters-container mb-4">
        <Card>
          <Card.Header>
            <FontAwesomeIcon icon={faFilter} className="me-2" />
            Filtres
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Durée (minutes)</Form.Label>
                  <div className="d-flex align-items-center">
                    <Form.Control 
                      type="number" 
                      min="0"
                      max="300"
                      value={filters.duration[0]}
                      onChange={(e) => handleFilterChange('duration', [parseInt(e.target.value) || 0, filters.duration[1]])}
                      className="me-2"
                    />
                    <span>à</span>
                    <Form.Control 
                      type="number"
                      min="0"
                      max="300" 
                      value={filters.duration[1]}
                      onChange={(e) => handleFilterChange('duration', [filters.duration[0], parseInt(e.target.value) || 180])}
                      className="ms-2"
                    />
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Niveau d'intensité (1-5)</Form.Label>
                  <div className="d-flex align-items-center">
                    <Form.Control 
                      type="number" 
                      min="1"
                      max="5"
                      value={filters.intensity[0]}
                      onChange={(e) => handleFilterChange('intensity', [parseInt(e.target.value) || 1, filters.intensity[1]])}
                      className="me-2"
                    />
                    <span>à</span>
                    <Form.Control 
                      type="number"
                      min="1"
                      max="5" 
                      value={filters.intensity[1]}
                      onChange={(e) => handleFilterChange('intensity', [filters.intensity[0], parseInt(e.target.value) || 5])}
                      className="ms-2"
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Difficulté</Form.Label>
                  <div className="d-flex">
                    {[0, 1, 2, 3].map(level => (
                      <Button 
                        key={level}
                        variant={filters.difficulty === level ? 'primary' : 'outline-primary'}
                        className="me-2"
                        onClick={() => handleFilterChange('difficulty', level)}
                      >
                        {level === 0 ? 'Tous' : Array(level).fill('★').join('')}
                      </Button>
                    ))}
                  </div>
                </Form.Group>
              </Col>
              <Col md={6} className="d-flex align-items-end">
                <Button 
                  variant="secondary" 
                  className="mb-3"
                  onClick={() => setFilters({
                    duration: [0, 180],
                    intensity: [0, 5],
                    type: 'all',
                    difficulty: 0
                  })}
                >
                  Réinitialiser les filtres
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>

      <Tabs
        activeKey={activeTab}
        onSelect={(key) => setActiveTab(key)}
        className="mb-4"
      >
        <Tab eventKey="all" title="Tous les types">
          {/* Contenu affiché ci-dessous */}
        </Tab>
        <Tab 
          eventKey={TRAINING_TYPES.ENDURANCE} 
          title={
            <><FontAwesomeIcon icon={faBicycle} className="me-2" />{t('training.endurance')}</>
          }
        >
          {/* Contenu affiché ci-dessous */}
        </Tab>
        <Tab 
          eventKey={TRAINING_TYPES.THRESHOLD} 
          title={
            <><FontAwesomeIcon icon={faHeartbeat} className="me-2" />{t('training.threshold')}</>
          }
        >
          {/* Contenu affiché ci-dessous */}
        </Tab>
        <Tab 
          eventKey={TRAINING_TYPES.HIIT} 
          title={
            <><FontAwesomeIcon icon={faChartLine} className="me-2" />{t('training.hiit')}</>
          }
        >
          {/* Contenu affiché ci-dessous */}
        </Tab>
        <Tab 
          eventKey={TRAINING_TYPES.RECOVERY} 
          title={
            <><FontAwesomeIcon icon={faHeartbeat} className="me-2" />{t('training.recovery')}</>
          }
        >
          {/* Contenu affiché ci-dessous */}
        </Tab>
      </Tabs>

      <div className="workouts-container">
        {filteredWorkouts.length === 0 ? (
          <Alert variant="warning">
            Aucun entraînement ne correspond aux critères sélectionnés. Essayez d'ajuster vos filtres.
          </Alert>
        ) : (
          <Row xs={1} md={2} lg={3} className="g-4">
            {filteredWorkouts.map(workout => (
              <Col key={workout.id}>
                <Card 
                  className={`h-100 workout-card ${selectedWorkout?.id === workout.id ? 'border-primary' : ''}`}
                  onClick={() => handleSelectWorkout(workout)}
                >
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <div>
                      <FontAwesomeIcon 
                        icon={typeIcons[workout.type] || faBicycle} 
                        className="me-2" 
                      />
                      {t(`trainingTypes.${workout.type}`)}
                    </div>
                    <Badge 
                      bg={
                        workout.intensityLevel <= 2 ? 'success' : 
                        workout.intensityLevel <= 3 ? 'info' : 
                        workout.intensityLevel <= 4 ? 'warning' : 'danger'
                      }
                    >
                      Niveau {workout.intensityLevel}
                    </Badge>
                  </Card.Header>
                  <Card.Body>
                    <Card.Title>{workout.name}</Card.Title>
                    <div className="mb-2">
                      <FontAwesomeIcon icon={faClock} className="me-2 text-muted" />
                      <span>{workout.duration} min</span>
                      <span className="ms-3">
                        {Array(workout.difficulty).fill('★').join('')}
                      </span>
                    </div>
                    <Card.Text>{workout.description}</Card.Text>
                  </Card.Body>
                  <Card.Footer>
                    <Button 
                      variant={selectedWorkout?.id === workout.id ? "primary" : "outline-primary"} 
                      size="sm" 
                      className="w-100"
                    >
                      {selectedWorkout?.id === workout.id ? "Sélectionné" : "Sélectionner"}
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>

      {selectedWorkout && (
        <div className="selected-workout-actions mt-4 d-flex justify-content-end">
          <Button 
            variant="success" 
            onClick={handleSaveWorkout}
          >
            <FontAwesomeIcon icon={faStar} className="me-2" />
            Ajouter à mon calendrier
          </Button>
        </div>
      )}
    </div>
  );
};

WorkoutLibrary.propTypes = {
  userProfile: PropTypes.shape({
    id: PropTypes.string,
    ftp: PropTypes.number,
    level: PropTypes.string,
    age: PropTypes.number,
    weight: PropTypes.number,
    preferred_terrain: PropTypes.string,
    cyclist_type: PropTypes.string
  }),
  onSelectWorkout: PropTypes.func,
  onSaveWorkout: PropTypes.func
};

export default WorkoutLibrary;
