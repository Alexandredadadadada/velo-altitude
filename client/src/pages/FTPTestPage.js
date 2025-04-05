import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ProgressBar, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalculator, faHeartbeat, faClock, 
  faChartLine, faInfoCircle, faCheck
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../components/common/NotificationSystem';

// Services
import FTPService from '../services/FTPEstimationService';
import UserService from '../services/UserService';

/**
 * Page de test et d'estimation de FTP
 */
const FTPTestPage = () => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testType, setTestType] = useState('20min');
  const [testData, setTestData] = useState({
    weight: '',
    level: 'intermediate',
    power20min: '',
    power8min: '',
    power5min: '',
    power1min: ''
  });
  const [estimatedFTP, setEstimatedFTP] = useState(null);
  const [powerZones, setPowerZones] = useState(null);
  const [showTestInstructions, setShowTestInstructions] = useState(false);
  const [activeTest, setActiveTest] = useState(null);
  const [testProgress, setTestProgress] = useState(0);
  const [testTimer, setTestTimer] = useState(0);
  const [testInterval, setTestInterval] = useState(null);

  // Charger le profil utilisateur
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const profile = await UserService.getCurrentUserProfile();
        setUserProfile(profile);
        
        // Pré-remplir les données du formulaire si disponibles
        if (profile) {
          setTestData(prevData => ({
            ...prevData,
            weight: profile.weight || '',
            level: profile.level || 'intermediate'
          }));
          
          // Si la FTP est définie, calculer les zones
          if (profile.ftp && !powerZones) {
            const zones = FTPService.calculatePowerZones(profile.ftp);
            setPowerZones(zones);
            setEstimatedFTP(profile.ftp);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        notify.error('Impossible de charger votre profil');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [notify]);

  // Gérer les changements de formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTestData({
      ...testData,
      [name]: value
    });
  };

  // Estimer la FTP basée sur les données fournies
  const estimateFTP = () => {
    try {
      let ftp = null;
      
      switch (testType) {
        case 'weight':
          if (!testData.weight) {
            notify.warning('Veuillez entrer votre poids');
            return;
          }
          ftp = FTPService.estimateFTPFromWeight(
            parseFloat(testData.weight), 
            testData.level
          );
          break;
          
        case '20min':
          if (!testData.power20min) {
            notify.warning('Veuillez entrer votre puissance moyenne sur 20 minutes');
            return;
          }
          ftp = FTPService.estimateFTPFrom20MinTest(
            parseFloat(testData.power20min)
          );
          break;
          
        case '8min':
          if (!testData.power8min) {
            notify.warning('Veuillez entrer votre puissance moyenne sur 8 minutes');
            return;
          }
          ftp = FTPService.estimateFTPFrom8MinTest(
            parseFloat(testData.power8min)
          );
          break;
          
        case '5min':
          if (!testData.power5min) {
            notify.warning('Veuillez entrer votre puissance moyenne sur 5 minutes');
            return;
          }
          ftp = FTPService.estimateFTPFrom5MinTest(
            parseFloat(testData.power5min)
          );
          break;
          
        case '1min':
          if (!testData.power1min) {
            notify.warning('Veuillez entrer votre puissance moyenne sur 1 minute');
            return;
          }
          ftp = FTPService.estimateFTPFrom1MinTest(
            parseFloat(testData.power1min)
          );
          break;
          
        default:
          notify.error('Type de test non reconnu');
          return;
      }
      
      if (ftp) {
        setEstimatedFTP(ftp);
        const zones = FTPService.calculatePowerZones(ftp);
        setPowerZones(zones);
        notify.success(`FTP estimée: ${ftp}W`);
      } else {
        notify.error('Impossible d\'estimer la FTP avec les données fournies');
      }
    } catch (error) {
      console.error('Erreur lors de l\'estimation de la FTP:', error);
      notify.error('Erreur de calcul');
    }
  };

  // Sauvegarder la FTP estimée dans le profil utilisateur
  const saveFTP = async () => {
    if (!estimatedFTP) {
      notify.warning('Aucune FTP estimée à sauvegarder');
      return;
    }
    
    try {
      if (!userProfile) {
        notify.warning('Vous devez être connecté pour sauvegarder votre FTP');
        return;
      }
      
      const updatedProfile = {
        ...userProfile,
        ftp: estimatedFTP
      };
      
      await UserService.updateUserProfile(updatedProfile);
      notify.success('FTP sauvegardée dans votre profil');
      
      // Mettre à jour le profil local
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la FTP:', error);
      notify.error('Impossible de sauvegarder la FTP');
    }
  };

  // Démarrer un test chronométré
  const startTimedTest = (duration) => {
    if (activeTest) {
      notify.warning('Un test est déjà en cours');
      return;
    }
    
    setActiveTest(duration);
    setTestProgress(0);
    setTestTimer(duration * 60); // Convertir en secondes
    
    const interval = setInterval(() => {
      setTestTimer(prevTimer => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          setTestInterval(null);
          setActiveTest(null);
          notify.success(`Test de ${duration} minutes terminé!`);
          return 0;
        }
        
        // Mettre à jour la progression
        const progress = 100 - ((prevTimer - 1) / (duration * 60) * 100);
        setTestProgress(progress);
        
        return prevTimer - 1;
      });
    }, 1000);
    
    setTestInterval(interval);
    notify.info(`Test de ${duration} minutes démarré`);
  };

  // Arrêter un test en cours
  const stopTimedTest = () => {
    if (testInterval) {
      clearInterval(testInterval);
      setTestInterval(null);
    }
    
    setActiveTest(null);
    setTestProgress(0);
    notify.info('Test arrêté');
  };

  // Formater le temps pour l'affichage
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Affichage du formulaire de test spécifique
  const renderTestForm = () => {
    switch (testType) {
      case 'weight':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Poids (kg)</Form.Label>
            <Form.Control
              type="number"
              name="weight"
              value={testData.weight}
              onChange={handleInputChange}
              placeholder="Entrez votre poids en kg"
            />
            <Form.Label className="mt-3">Niveau</Form.Label>
            <Form.Select
              name="level"
              value={testData.level}
              onChange={handleInputChange}
            >
              <option value="beginner">Débutant (1.5-2.5 W/kg)</option>
              <option value="intermediate">Intermédiaire (2.5-3.2 W/kg)</option>
              <option value="advanced">Avancé (3.2-4.0 W/kg)</option>
              <option value="elite">Elite (4.0-5.5 W/kg)</option>
            </Form.Select>
            <div className="text-muted mt-2">
              <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
              Cette méthode fournit une estimation approximative basée sur des moyennes statistiques.
            </div>
          </Form.Group>
        );
        
      case '20min':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Puissance moyenne sur 20 minutes (watts)</Form.Label>
            <Form.Control
              type="number"
              name="power20min"
              value={testData.power20min}
              onChange={handleInputChange}
              placeholder="Entrez votre puissance moyenne"
            />
            <div className="d-grid gap-2 mt-3">
              <Button 
                variant="outline-primary"
                onClick={() => setShowTestInstructions(!showTestInstructions)}
              >
                <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
                {showTestInstructions ? 'Masquer les instructions' : 'Afficher les instructions du test'}
              </Button>
              
              {!activeTest ? (
                <Button 
                  variant="primary"
                  onClick={() => startTimedTest(20)}
                >
                  <FontAwesomeIcon icon={faClock} className="me-1" />
                  Démarrer un test de 20 minutes
                </Button>
              ) : (
                <Button 
                  variant="danger"
                  onClick={stopTimedTest}
                >
                  Arrêter le test
                </Button>
              )}
            </div>
          </Form.Group>
        );
        
      case '8min':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Puissance moyenne sur 8 minutes (watts)</Form.Label>
            <Form.Control
              type="number"
              name="power8min"
              value={testData.power8min}
              onChange={handleInputChange}
              placeholder="Entrez votre puissance moyenne"
            />
            <div className="d-grid gap-2 mt-3">
              <Button 
                variant="outline-primary"
                onClick={() => setShowTestInstructions(!showTestInstructions)}
              >
                <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
                {showTestInstructions ? 'Masquer les instructions' : 'Afficher les instructions du test'}
              </Button>
              
              {!activeTest ? (
                <Button 
                  variant="primary"
                  onClick={() => startTimedTest(8)}
                >
                  <FontAwesomeIcon icon={faClock} className="me-1" />
                  Démarrer un test de 8 minutes
                </Button>
              ) : (
                <Button 
                  variant="danger"
                  onClick={stopTimedTest}
                >
                  Arrêter le test
                </Button>
              )}
            </div>
          </Form.Group>
        );
        
      case '5min':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Puissance moyenne sur 5 minutes (watts)</Form.Label>
            <Form.Control
              type="number"
              name="power5min"
              value={testData.power5min}
              onChange={handleInputChange}
              placeholder="Entrez votre puissance moyenne"
            />
            <div className="d-grid gap-2 mt-3">
              <Button 
                variant="outline-primary"
                onClick={() => setShowTestInstructions(!showTestInstructions)}
              >
                <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
                {showTestInstructions ? 'Masquer les instructions' : 'Afficher les instructions du test'}
              </Button>
              
              {!activeTest ? (
                <Button 
                  variant="primary"
                  onClick={() => startTimedTest(5)}
                >
                  <FontAwesomeIcon icon={faClock} className="me-1" />
                  Démarrer un test de 5 minutes
                </Button>
              ) : (
                <Button 
                  variant="danger"
                  onClick={stopTimedTest}
                >
                  Arrêter le test
                </Button>
              )}
            </div>
          </Form.Group>
        );
        
      case '1min':
        return (
          <Form.Group className="mb-3">
            <Form.Label>Puissance moyenne sur 1 minute (watts)</Form.Label>
            <Form.Control
              type="number"
              name="power1min"
              value={testData.power1min}
              onChange={handleInputChange}
              placeholder="Entrez votre puissance moyenne"
            />
            <div className="d-grid gap-2 mt-3">
              <Button 
                variant="outline-primary"
                onClick={() => setShowTestInstructions(!showTestInstructions)}
              >
                <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
                {showTestInstructions ? 'Masquer les instructions' : 'Afficher les instructions du test'}
              </Button>
              
              {!activeTest ? (
                <Button 
                  variant="primary"
                  onClick={() => startTimedTest(1)}
                >
                  <FontAwesomeIcon icon={faClock} className="me-1" />
                  Démarrer un test de 1 minute
                </Button>
              ) : (
                <Button 
                  variant="danger"
                  onClick={stopTimedTest}
                >
                  Arrêter le test
                </Button>
              )}
            </div>
          </Form.Group>
        );
        
      default:
        return null;
    }
  };

  // Instructions du test
  const renderTestInstructions = () => {
    if (!showTestInstructions) return null;
    
    const instructions = {
      '20min': {
        title: 'Test FTP de 20 minutes',
        steps: [
          'Échauffez-vous pendant 10-15 minutes, incluant 2-3 accélérations courtes',
          'Pédalez à la puissance maximale que vous pouvez maintenir pendant 20 minutes complètes',
          'Essayez de maintenir une puissance constante tout au long du test',
          'La FTP est calculée comme 95% de votre puissance moyenne sur 20 minutes',
          'Ce test est considéré comme le plus précis pour estimer la FTP'
        ]
      },
      '8min': {
        title: 'Test FTP de 8 minutes',
        steps: [
          'Échauffez-vous pendant 10-15 minutes, incluant 2-3 accélérations courtes',
          'Pédalez à la puissance maximale que vous pouvez maintenir pendant 8 minutes complètes',
          'Essayez de maintenir une puissance constante tout au long du test',
          'La FTP est calculée comme 90% de votre puissance moyenne sur 8 minutes',
          'Ce test est une bonne alternative au test de 20 minutes si vous manquez de temps'
        ]
      },
      '5min': {
        title: 'Test FTP de 5 minutes',
        steps: [
          'Échauffez-vous pendant 10 minutes, incluant 2-3 accélérations courtes',
          'Pédalez à la puissance maximale que vous pouvez maintenir pendant 5 minutes complètes',
          'Essayez de maintenir une puissance constante tout au long du test',
          'La FTP est calculée comme 85% de votre puissance moyenne sur 5 minutes',
          'Ce test est moins précis mais utile pour les débutants ou en cas de contrainte de temps'
        ]
      },
      '1min': {
        title: 'Test de puissance maximale sur 1 minute',
        steps: [
          'Échauffez-vous pendant 10 minutes, incluant 1-2 accélérations courtes',
          'Pédalez à la puissance maximale que vous pouvez maintenir pendant 1 minute complète',
          'Donnez tout ce que vous avez durant cette minute',
          'La FTP est estimée approximativement à 75% de votre puissance sur 1 minute',
          'Ce test mesure principalement votre puissance anaérobie et donne une estimation grossière de la FTP'
        ]
      },
      'weight': {
        title: 'Estimation basée sur le poids et le niveau',
        steps: [
          'Cette méthode utilise votre poids et votre niveau d\'expérience pour estimer votre FTP',
          'Les cyclistes débutants ont généralement une FTP de 1.5-2.5 W/kg',
          'Les cyclistes intermédiaires ont généralement une FTP de 2.5-3.2 W/kg',
          'Les cyclistes avancés ont généralement une FTP de 3.2-4.0 W/kg',
          'Les cyclistes élites ont généralement une FTP de 4.0-5.5 W/kg',
          'Cette méthode fournit seulement une estimation grossière et devrait être affinée par un test réel'
        ]
      }
    };
    
    const currentInstructions = instructions[testType] || instructions['20min'];
    
    return (
      <Alert variant="info" className="mt-3">
        <Alert.Heading>{currentInstructions.title}</Alert.Heading>
        <ol>
          {currentInstructions.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </Alert>
    );
  };

  // Afficher les zones de puissance
  const renderPowerZones = () => {
    if (!powerZones) return null;
    
    return (
      <div className="power-zones mt-4">
        <h4 className="mb-3">Vos zones de puissance</h4>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Zone</th>
              <th>Nom</th>
              <th>Plage (watts)</th>
              <th>% FTP</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(powerZones).map(([zone, data], index) => (
              <tr key={zone}>
                <td>Zone {index + 1}</td>
                <td>{data.name}</td>
                <td>{data.min} - {data.max === Infinity ? '∞' : data.max} W</td>
                <td>
                  {Math.round((data.min / estimatedFTP) * 100)}% - 
                  {data.max === Infinity ? '∞' : Math.round((data.max / estimatedFTP) * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  // Affichage pendant le chargement
  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2">Chargement des outils d'estimation FTP...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="heading mb-4">
        <h1>
          <FontAwesomeIcon icon={faCalculator} className="me-3" />
          Test et Estimation FTP
        </h1>
        <p className="lead">
          Déterminez votre FTP (Functional Threshold Power) pour personnaliser vos entraînements
        </p>
      </div>
      
      {userProfile?.ftp && (
        <Alert variant="info" className="mb-4">
          <Alert.Heading>
            <FontAwesomeIcon icon={faCheck} className="me-2" />
            Votre FTP actuelle
          </Alert.Heading>
          <p className="mb-0">
            Votre FTP actuelle enregistrée est de <strong>{userProfile.ftp} watts</strong>
            {userProfile.weight ? ` (${(userProfile.ftp / userProfile.weight).toFixed(1)} W/kg)` : ''}.
          </p>
        </Alert>
      )}
      
      <Row className="g-4">
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h3 className="mb-0">Choisissez votre méthode d'estimation</h3>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-4">
                <Form.Label>Méthode d'estimation</Form.Label>
                <Form.Select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                >
                  <option value="20min">Test de 20 minutes (méthode recommandée)</option>
                  <option value="8min">Test de 8 minutes</option>
                  <option value="5min">Test de 5 minutes</option>
                  <option value="1min">Test de 1 minute</option>
                  <option value="weight">Basée sur le poids et le niveau</option>
                </Form.Select>
              </Form.Group>
              
              {activeTest && (
                <div className="test-progress mb-4">
                  <h4>Test en cours: {activeTest} minutes</h4>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Temps restant: {formatTime(testTimer)}</span>
                    <span>Progression: {Math.round(testProgress)}%</span>
                  </div>
                  <ProgressBar 
                    now={testProgress} 
                    variant="primary" 
                    className="mb-3" 
                    style={{ height: '10px' }}
                  />
                </div>
              )}
              
              {renderTestForm()}
              {renderTestInstructions()}
              
              <div className="d-grid gap-2 mt-4">
                <Button 
                  variant="primary" 
                  onClick={estimateFTP}
                  disabled={activeTest !== null}
                >
                  <FontAwesomeIcon icon={faCalculator} className="me-2" />
                  Estimer ma FTP
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={6}>
          <Card>
            <Card.Header>
              <h3 className="mb-0">Résultats</h3>
            </Card.Header>
            <Card.Body>
              {estimatedFTP ? (
                <div className="ftp-results">
                  <div className="text-center mb-4">
                    <h1 className="display-4">{estimatedFTP} W</h1>
                    {userProfile?.weight && (
                      <h3>
                        {(estimatedFTP / userProfile.weight).toFixed(1)} W/kg
                      </h3>
                    )}
                    <p className="text-muted">Votre FTP estimée</p>
                  </div>
                  
                  <div className="d-grid gap-2 mb-4">
                    <Button 
                      variant="success" 
                      onClick={saveFTP}
                    >
                      <FontAwesomeIcon icon={faSave} className="me-2" />
                      Sauvegarder cette FTP dans mon profil
                    </Button>
                  </div>
                  
                  {renderPowerZones()}
                </div>
              ) : (
                <div className="text-center my-5">
                  <FontAwesomeIcon 
                    icon={faChartLine} 
                    size="4x" 
                    className="text-secondary mb-3" 
                  />
                  <p>
                    Complétez un test ou utilisez la méthode basée sur le poids pour estimer votre FTP.
                    Les résultats apparaîtront ici.
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
          
          <Card className="mt-4">
            <Card.Header>
              <h3 className="mb-0">À propos de la FTP</h3>
            </Card.Header>
            <Card.Body>
              <p>
                La <strong>FTP (Functional Threshold Power)</strong> représente la puissance maximale que vous pouvez 
                maintenir pendant environ une heure. C'est une métrique fondamentale pour le cyclisme d'entraînement.
              </p>
              
              <h5>Pourquoi la FTP est-elle importante?</h5>
              <ul>
                <li>Elle sert de base pour calculer vos zones d'entraînement personnalisées</li>
                <li>Elle permet de mesurer précisément votre progression au fil du temps</li>
                <li>Elle aide à structurer vos entraînements avec des intensités adaptées</li>
                <li>Elle permet de comparer objectivement vos performances</li>
              </ul>
              
              <h5>Conseils pour un test FTP précis</h5>
              <ul>
                <li>Réalisez le test lorsque vous êtes bien reposé</li>
                <li>Mangez correctement 2-3 heures avant le test</li>
                <li>Effectuez un bon échauffement avant de commencer</li>
                <li>Choisissez un parcours plat ou utilisez un home trainer</li>
                <li>Essayez de maintenir une cadence constante (85-95 rpm)</li>
                <li>Refaites le test toutes les 4-8 semaines pour suivre votre progression</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default FTPTestPage;
