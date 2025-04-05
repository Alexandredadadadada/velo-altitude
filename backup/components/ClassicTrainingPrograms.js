import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Card, Button, Row, Col, Badge, Accordion, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBicycle, faMountain, faRoute, faHeart, 
  faCalendarAlt, faClock, faUserFriends 
} from '@fortawesome/free-solid-svg-icons';
import { useNotification } from '../common/NotificationSystem';
import FTPService from '../../services/FTPEstimationService';

/**
 * Composant de programmes d'entraînement classiques
 * Adapté pour différents profils de cyclistes: cyclotouristes, seniors, débutants, etc.
 */
const ClassicTrainingPrograms = ({ userProfile, onSaveWorkout }) => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userCategory, setUserCategory] = useState('general');

  // Déterminer la catégorie d'utilisateur basée sur le profil
  useEffect(() => {
    if (!userProfile) return;

    let category = 'general';
    
    // Âge > 60 ans = senior
    if (userProfile.age && userProfile.age > 60) {
      category = 'senior';
    } 
    // Niveau débutant = novice
    else if (userProfile.level === 'beginner') {
      category = 'novice';
    } 
    // Pratique de loisir = cyclotouriste
    else if (userProfile.cyclingType === 'touring') {
      category = 'cyclotouriste';
    }
    // Récupération post-blessure
    else if (userProfile.recoveryMode) {
      category = 'recovery';
    }
    
    setUserCategory(category);
  }, [userProfile]);

  // Charger les programmes adaptés au profil utilisateur
  useEffect(() => {
    const loadPrograms = async () => {
      try {
        setLoading(true);
        
        // Vérification du profil utilisateur
        if (!userProfile) {
          throw new Error('Profil utilisateur manquant ou incomplet');
        }
        
        // Simulation d'appel API (à remplacer par un appel réel)
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Générer les programmes selon la catégorie
        const availablePrograms = generateTrainingPrograms(userProfile, userCategory);
        setPrograms(availablePrograms);
        
        if (availablePrograms.length > 0) {
          setSelectedProgram(availablePrograms[0]);
          notify.success('Programmes d\'entraînement chargés avec succès');
        } else {
          throw new Error('Aucun programme adapté n\'a pu être trouvé');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des programmes:', error);
        notify.error('Impossible de charger les programmes d\'entraînement', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (userProfile) {
      loadPrograms();
    }
  }, [userProfile, userCategory, notify]);

  /**
   * Génère des programmes d'entraînement adaptés au profil utilisateur
   */
  const generateTrainingPrograms = (profile, category) => {
    const programs = [];
    
    // Valider la FTP
    const ftp = FTPService.validateFTP(profile.ftp, profile);
    
    // Programmes pour seniors
    if (category === 'senior') {
      programs.push({
        id: 'senior-endurance',
        name: 'Endurance Adaptée Seniors',
        description: 'Programme à intensité modérée pour développer l\'endurance tout en préservant les articulations',
        duration: 8, // semaines
        sessionsPerWeek: 3,
        difficulty: 1,
        focusAreas: ['endurance', 'santé cardiovasculaire'],
        suitable: ['60+', 'débutants', 'intermédiaires'],
        workouts: generateWorkoutsForSeniors(ftp, profile.age)
      });
      
      programs.push({
        id: 'senior-technique',
        name: 'Maîtrise Technique Senior',
        description: 'Amélioration des compétences techniques et de l\'équilibre à vitesse modérée',
        duration: 6,
        sessionsPerWeek: 2,
        difficulty: 1,
        focusAreas: ['équilibre', 'technique', 'coordination'],
        suitable: ['60+', 'tous niveaux'],
        workouts: generateTechniqueWorkouts(ftp, 'senior')
      });
    }
    
    // Programmes pour cyclotouristes
    else if (category === 'cyclotouriste') {
      programs.push({
        id: 'touring-longdistance',
        name: 'Préparation Longue Distance',
        description: 'Programme pour préparer des randonnées de plusieurs jours',
        duration: 12,
        sessionsPerWeek: 3,
        difficulty: 2,
        focusAreas: ['endurance', 'gestion d\'effort', 'récupération'],
        suitable: ['cyclotouristes', 'intermédiaires'],
        workouts: generateLongDistanceWorkouts(ftp)
      });
      
      programs.push({
        id: 'touring-climbing',
        name: 'Ascensions Pour Tous',
        description: 'Amélioration des capacités en montée à rythme touristique',
        duration: 8,
        sessionsPerWeek: 2,
        difficulty: 2,
        focusAreas: ['montagne', 'rythme', 'technique de grimpe'],
        suitable: ['cyclotouristes', 'tous niveaux'],
        workouts: generateClimbingWorkouts(ftp, 'touring')
      });
    }
    
    // Programmes pour débutants
    else if (category === 'novice') {
      programs.push({
        id: 'novice-basics',
        name: 'Fondamentaux Cyclistes',
        description: 'Programme d\'initiation aux bases du cyclisme',
        duration: 6,
        sessionsPerWeek: 2,
        difficulty: 1,
        focusAreas: ['technique', 'endurance de base', 'gestion d\'effort'],
        suitable: ['débutants'],
        workouts: generateNoviceWorkouts(ftp)
      });
      
      programs.push({
        id: 'novice-progress',
        name: 'Progression Douce',
        description: 'Évolution progressive des capacités sans stress',
        duration: 8,
        sessionsPerWeek: 3,
        difficulty: 1,
        focusAreas: ['endurance', 'confiance', 'technique'],
        suitable: ['débutants', 'reprise d\'activité'],
        workouts: generateProgressiveWorkouts(ftp, 'novice')
      });
    }
    
    // Programmes de récupération
    else if (category === 'recovery') {
      programs.push({
        id: 'recovery-program',
        name: 'Retour en Forme',
        description: 'Programme doux pour revenir progressivement après blessure ou interruption',
        duration: 4,
        sessionsPerWeek: 3,
        difficulty: 1,
        focusAreas: ['récupération active', 'renforcement doux'],
        suitable: ['convalescence', 'reprise'],
        workouts: generateRecoveryWorkouts(ftp)
      });
    }
    
    // Programmes généraux pour tous
    else {
      programs.push({
        id: 'general-endurance',
        name: 'Endurance Fondamentale',
        description: 'Développement des capacités d\'endurance générale',
        duration: 8,
        sessionsPerWeek: 3,
        difficulty: 2,
        focusAreas: ['endurance', 'constance'],
        suitable: ['tous niveaux'],
        workouts: generateEnduranceWorkouts(ftp, profile.level)
      });
      
      programs.push({
        id: 'general-balanced',
        name: 'Programme Équilibré',
        description: 'Combinaison d\'endurance, force et technique',
        duration: 10,
        sessionsPerWeek: 3,
        difficulty: 2,
        focusAreas: ['endurance', 'force', 'technique'],
        suitable: ['intermédiaires', 'avancés'],
        workouts: generateBalancedWorkouts(ftp, profile.level)
      });
    }
    
    // Ajouter un programme social pour tous
    programs.push({
      id: 'social-group',
      name: 'Sorties Conviviales',
      description: 'Programme de sorties en groupe avec aspects sociaux',
      duration: 'Permanent',
      sessionsPerWeek: 1,
      difficulty: 1,
      focusAreas: ['plaisir', 'social', 'découverte'],
      suitable: ['tous profils'],
      workouts: generateSocialWorkouts()
    });
    
    return programs;
  };

  /**
   * Génère des entraînements adaptés aux seniors
   */
  const generateWorkoutsForSeniors = (ftp, age) => {
    const intensity = age > 70 ? 0.6 : 0.65; // Ajustement selon l'âge
    
    return [
      {
        id: 'senior-workout-1',
        name: 'Fondation Cardiovasculaire',
        description: 'Travail d\'endurance à intensité modérée',
        duration: 60, // minutes
        targetPower: Math.round(ftp * intensity),
        intervals: [
          { type: 'warmup', duration: 10*60, power: Math.round(ftp * 0.5) },
          { type: 'steady', duration: 20*60, power: Math.round(ftp * intensity) },
          { type: 'recovery', duration: 5*60, power: Math.round(ftp * 0.5) },
          { type: 'steady', duration: 20*60, power: Math.round(ftp * intensity) },
          { type: 'cooldown', duration: 5*60, power: Math.round(ftp * 0.4) }
        ]
      },
      {
        id: 'senior-workout-2',
        name: 'Alternance Douce',
        description: 'Légères variations d\'intensité pour stimuler le système cardiovasculaire',
        duration: 45,
        targetPower: Math.round(ftp * intensity),
        intervals: [
          { type: 'warmup', duration: 10*60, power: Math.round(ftp * 0.5) },
          { type: 'steady', duration: 5*60, power: Math.round(ftp * 0.65) },
          { type: 'recovery', duration: 5*60, power: Math.round(ftp * 0.5) },
          { type: 'steady', duration: 5*60, power: Math.round(ftp * 0.7) },
          { type: 'recovery', duration: 5*60, power: Math.round(ftp * 0.5) },
          { type: 'steady', duration: 5*60, power: Math.round(ftp * 0.65) },
          { type: 'recovery', duration: 5*60, power: Math.round(ftp * 0.5) },
          { type: 'cooldown', duration: 5*60, power: Math.round(ftp * 0.4) }
        ]
      }
    ];
  };

  /**
   * Génère des entraînements techniques (pouvant être adaptés par catégorie)
   */
  const generateTechniqueWorkouts = (ftp, category) => {
    // Ajuster l'intensité selon la catégorie
    const intensity = category === 'senior' ? 0.65 :
                     (category === 'novice' ? 0.7 : 0.75);
    
    return [
      {
        id: `technique-${category}-1`,
        name: 'Maîtrise du Vélo',
        description: 'Exercices de technique de pilotage à faible intensité',
        duration: 60,
        targetPower: Math.round(ftp * intensity),
        structure: [
          { name: 'Échauffement', duration: 15 },
          { name: 'Exercices d\'équilibre', duration: 10 },
          { name: 'Travail de pédalage', duration: 15 },
          { name: 'Changements de position', duration: 10 },
          { name: 'Retour au calme', duration: 10 }
        ]
      },
      {
        id: `technique-${category}-2`,
        name: 'Agilité et Maniabilité',
        description: 'Amélioration des capacités de pilotage',
        duration: 45,
        targetPower: Math.round(ftp * intensity),
        structure: [
          { name: 'Échauffement', duration: 10 },
          { name: 'Slalom et virages', duration: 15 },
          { name: 'Freinage contrôlé', duration: 10 },
          { name: 'Retour au calme', duration: 10 }
        ]
      }
    ];
  };

  /**
   * Génère des entraînements pour longues distances (cyclotouristes)
   */
  const generateLongDistanceWorkouts = (ftp) => {
    return [
      {
        id: 'longdistance-1',
        name: 'Endurance Progressive',
        description: 'Construction progressive de l\'endurance sur longue durée',
        duration: 120,
        targetPower: Math.round(ftp * 0.7),
        intervals: [
          { type: 'warmup', duration: 15*60, power: Math.round(ftp * 0.6) },
          { type: 'steady', duration: 30*60, power: Math.round(ftp * 0.7) },
          { type: 'steady', duration: 30*60, power: Math.round(ftp * 0.75) },
          { type: 'steady', duration: 30*60, power: Math.round(ftp * 0.7) },
          { type: 'cooldown', duration: 15*60, power: Math.round(ftp * 0.6) }
        ]
      },
      {
        id: 'longdistance-2',
        name: 'Simulation Randonnée',
        description: 'Préparation aux changements de terrain sur longue distance',
        duration: 150,
        targetPower: Math.round(ftp * 0.7),
        terrain: [
          { name: 'Plat', duration: 30, intensity: 0.7 },
          { name: 'Montée douce', duration: 20, intensity: 0.75 },
          { name: 'Plat', duration: 15, intensity: 0.7 },
          { name: 'Montée modérée', duration: 15, intensity: 0.8 },
          { name: 'Descente', duration: 10, intensity: 0.5 },
          { name: 'Plat venteux', duration: 20, intensity: 0.75 },
          { name: 'Terrain varié', duration: 40, intensity: 0.7 }
        ]
      }
    ];
  };

  /**
   * Génère des entraînements de grimpe adaptés
   */
  const generateClimbingWorkouts = (ftp, category) => {
    const intensity = category === 'touring' ? 0.75 : 0.85;
    
    return [
      {
        id: `climbing-${category}-1`,
        name: 'Ascensions Rythmées',
        description: 'Travail de montée à cadence constante',
        duration: 75,
        targetPower: Math.round(ftp * intensity),
        intervals: [
          { type: 'warmup', duration: 15*60, power: Math.round(ftp * 0.6) },
          { type: 'climb', duration: 10*60, power: Math.round(ftp * intensity), cadence: 70 },
          { type: 'recovery', duration: 5*60, power: Math.round(ftp * 0.5) },
          { type: 'climb', duration: 10*60, power: Math.round(ftp * intensity), cadence: 80 },
          { type: 'recovery', duration: 5*60, power: Math.round(ftp * 0.5) },
          { type: 'climb', duration: 10*60, power: Math.round(ftp * intensity), cadence: 65 },
          { type: 'recovery', duration: 5*60, power: Math.round(ftp * 0.5) },
          { type: 'cooldown', duration: 10*60, power: Math.round(ftp * 0.5) }
        ]
      }
    ];
  };

  /**
   * Génère des entraînements pour débutants
   */
  const generateNoviceWorkouts = (ftp) => {
    return [
      {
        id: 'novice-1',
        name: 'Introduction au Cyclisme',
        description: 'Première approche structurée de l\'entraînement cycliste',
        duration: 45,
        targetPower: Math.round(ftp * 0.65),
        structure: [
          { name: 'Échauffement', duration: 10 },
          { name: 'Pédalage fluide', duration: 15 },
          { name: 'Exercices techniques', duration: 10 },
          { name: 'Retour au calme', duration: 10 }
        ]
      },
      {
        id: 'novice-2',
        name: 'Découverte du Rythme',
        description: 'Apprentissage de la gestion du rythme et de l\'effort',
        duration: 60,
        targetPower: Math.round(ftp * 0.65),
        intervals: [
          { type: 'warmup', duration: 10*60, power: Math.round(ftp * 0.5) },
          { type: 'steady', duration: 10*60, power: Math.round(ftp * 0.65) },
          { type: 'recovery', duration: 5*60, power: Math.round(ftp * 0.5) },
          { type: 'steady', duration: 10*60, power: Math.round(ftp * 0.7) },
          { type: 'recovery', duration: 5*60, power: Math.round(ftp * 0.5) },
          { type: 'steady', duration: 10*60, power: Math.round(ftp * 0.65) },
          { type: 'cooldown', duration: 10*60, power: Math.round(ftp * 0.5) }
        ]
      }
    ];
  };

  /**
   * Génère des entraînements à progression douce
   */
  const generateProgressiveWorkouts = (ftp, category) => {
    // À implémenter selon le cas d'usage
    return [];
  };

  /**
   * Génère des entraînements de récupération
   */
  const generateRecoveryWorkouts = (ftp) => {
    // À implémenter selon le cas d'usage
    return [];
  };

  /**
   * Génère des entraînements d'endurance fondamentale
   */
  const generateEnduranceWorkouts = (ftp, level) => {
    // À implémenter selon le cas d'usage
    return [];
  };

  /**
   * Génère des entraînements équilibrés
   */
  const generateBalancedWorkouts = (ftp, level) => {
    // À implémenter selon le cas d'usage
    return [];
  };

  /**
   * Génère des entraînements sociaux/groupe
   */
  const generateSocialWorkouts = () => {
    return [
      {
        id: 'social-1',
        name: 'Sortie Groupe Découverte',
        description: 'Parcours touristique à allure modérée en groupe',
        duration: 120, // 2h
        type: 'group',
        difficultyLevel: 'Tous niveaux',
        socialAspects: [
          'Pause café à mi-parcours',
          'Rythme adapté au plus lent',
          'Découverte de nouveaux itinéraires'
        ]
      }
    ];
  };

  /**
   * Sélectionne un programme spécifique
   */
  const handleSelectProgram = (program) => {
    setSelectedProgram(program);
    notify.info(`Programme sélectionné: ${program.name}`);
  };

  /**
   * S'inscrit à un programme d'entraînement
   */
  const handleEnrollProgram = () => {
    if (!selectedProgram) {
      notify.error('Aucun programme sélectionné');
      return;
    }

    try {
      // Traitement de l'inscription
      // À intégrer avec le backend
      
      notify.success(`Vous êtes inscrit au programme "${selectedProgram.name}"`, {
        title: 'Inscription réussie'
      });
      
    } catch (error) {
      console.error('Erreur lors de l\'inscription au programme:', error);
      notify.error('Impossible de s\'inscrire au programme', error);
    }
  };

  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-2">Chargement des programmes d'entraînement adaptés...</p>
      </div>
    );
  }

  // Rendu principal
  return (
    <div className="classic-training-programs">
      <div className="heading mb-4">
        <h2>Programmes d'Entraînement Adaptés</h2>
        <p className="text-muted">
          Programmes spécialement conçus pour votre profil: <strong>{t(`userCategory.${userCategory}`)}</strong>
        </p>
      </div>

      <Row xs={1} md={2} lg={3} className="g-4 mb-5">
        {programs.map(program => (
          <Col key={program.id}>
            <Card 
              className={`h-100 training-program-card ${selectedProgram?.id === program.id ? 'border-primary' : ''}`}
              onClick={() => handleSelectProgram(program)}
            >
              <Card.Body>
                <Card.Title>{program.name}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  {program.duration} semaines · {program.sessionsPerWeek} sessions/semaine
                </Card.Subtitle>
                <Card.Text>{program.description}</Card.Text>
                
                <div className="d-flex flex-wrap mb-2">
                  {program.focusAreas.map((area, idx) => (
                    <Badge bg="info" className="me-1 mb-1" key={idx}>{area}</Badge>
                  ))}
                </div>
                
                <div className="mt-3">
                  <div className="d-flex align-items-center mb-2">
                    <small className="text-muted me-2">Difficulté:</small>
                    <ProgressBar 
                      now={program.difficulty * 33.3} 
                      style={{ height: '8px', width: '100px' }} 
                      variant={program.difficulty === 1 ? 'success' : 
                              program.difficulty === 2 ? 'warning' : 'danger'} 
                    />
                  </div>
                  <small className="text-muted">
                    Adapté pour: {program.suitable.join(', ')}
                  </small>
                </div>
              </Card.Body>
              <Card.Footer>
                <Button 
                  variant={selectedProgram?.id === program.id ? "primary" : "outline-primary"} 
                  size="sm" 
                  className="w-100"
                >
                  {selectedProgram?.id === program.id ? "Sélectionné" : "Sélectionner"}
                </Button>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>

      {selectedProgram && (
        <div className="selected-program-details">
          <h3>Détails du Programme: {selectedProgram.name}</h3>
          
          <div className="program-overview mb-4">
            <Row>
              <Col md={8}>
                <p>{selectedProgram.description}</p>
                <div className="d-flex flex-wrap gap-3 mt-3">
                  <div>
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                    <span>{selectedProgram.duration} semaines</span>
                  </div>
                  <div>
                    <FontAwesomeIcon icon={faClock} className="me-2 text-primary" />
                    <span>{selectedProgram.sessionsPerWeek} sessions/semaine</span>
                  </div>
                  <div>
                    <FontAwesomeIcon icon={faBicycle} className="me-2 text-primary" />
                    <span>Difficulté: {Array(selectedProgram.difficulty).fill('●').join('')}</span>
                  </div>
                </div>
              </Col>
              <Col md={4} className="text-end">
                <Button variant="success" onClick={handleEnrollProgram}>
                  S'inscrire au Programme
                </Button>
              </Col>
            </Row>
          </div>

          {selectedProgram.workouts && selectedProgram.workouts.length > 0 ? (
            <div className="program-workouts">
              <h4 className="mb-3">Séances d'entraînement</h4>
              <Accordion defaultActiveKey="0">
                {selectedProgram.workouts.map((workout, idx) => (
                  <Accordion.Item eventKey={idx.toString()} key={workout.id}>
                    <Accordion.Header>
                      <div className="d-flex justify-content-between w-100 pe-4">
                        <span>{workout.name}</span>
                        <span className="text-muted">{workout.duration} min</span>
                      </div>
                    </Accordion.Header>
                    <Accordion.Body>
                      <p>{workout.description}</p>
                      
                      {workout.intervals && (
                        <div className="workout-intervals">
                          <h6>Structure de la séance:</h6>
                          <div className="intervals-timeline">
                            {/* Visualisation d'intervalles à implémenter */}
                            <p className="text-muted">Visualisation détaillée des intervalles à venir...</p>
                          </div>
                        </div>
                      )}
                      
                      {workout.structure && (
                        <div className="workout-structure">
                          <h6>Structure de la séance:</h6>
                          <ul className="list-group">
                            {workout.structure.map((phase, i) => (
                              <li className="list-group-item d-flex justify-content-between align-items-center" key={i}>
                                {phase.name}
                                <span className="badge bg-primary rounded-pill">{phase.duration} min</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {workout.terrain && (
                        <div className="workout-terrain">
                          <h6>Simulation de terrain:</h6>
                          <ul className="list-group">
                            {workout.terrain.map((section, i) => (
                              <li className="list-group-item d-flex justify-content-between align-items-center" key={i}>
                                {section.name}
                                <span className="badge bg-primary rounded-pill">{section.duration} min</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {workout.socialAspects && (
                        <div className="social-aspects mt-3">
                          <h6>Aspects sociaux:</h6>
                          <ul>
                            {workout.socialAspects.map((aspect, i) => (
                              <li key={i}>{aspect}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="text-end mt-3">
                        <Button variant="outline-primary" size="sm">
                          Voir les détails
                        </Button>
                        <Button variant="primary" size="sm" className="ms-2">
                          Ajouter au calendrier
                        </Button>
                      </div>
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </div>
          ) : (
            <div className="alert alert-info">
              Les détails des séances seront disponibles après l'inscription au programme.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

ClassicTrainingPrograms.propTypes = {
  userProfile: PropTypes.shape({
    id: PropTypes.string,
    ftp: PropTypes.number,
    level: PropTypes.string,
    age: PropTypes.number,
    weight: PropTypes.number,
    cyclingType: PropTypes.string,
    recoveryMode: PropTypes.bool
  }),
  onSaveWorkout: PropTypes.func
};

export default ClassicTrainingPrograms;
