import React from 'react';
import PropTypes from 'prop-types';
import { Card, Badge, Button, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFire, faClock, faHeartbeat, 
  faRoute, faInfoCircle, faPlus 
} from '@fortawesome/free-solid-svg-icons';

/**
 * Composant affichant une carte de séance HIIT avec ses détails principaux
 */
const HIITWorkoutCard = ({ workout, onSelect, showAddButton = true }) => {
  // Vérification des props pour éviter les erreurs de type
  if (!workout) {
    console.error('HIITWorkoutCard - Erreur: Aucun workout n\'a été fourni');
    return <Card className="mb-3 workout-card-error">Données d'entraînement indisponibles</Card>;
  }

  // Formater la durée en minutes
  const formatDuration = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      return '0:00';
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Obtenir la couleur correspondant à l'intensité
  const getIntensityColor = (intensity) => {
    switch (intensity) {
      case 'low':
        return 'success';
      case 'medium':
        return 'info';
      case 'medium-high':
        return 'primary';
      case 'high':
        return 'warning';
      case 'very-high':
      case 'max':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  // Formater le texte d'intensité
  const formatIntensity = (intensity) => {
    switch (intensity) {
      case 'low':
        return 'Faible';
      case 'medium':
        return 'Moyenne';
      case 'medium-high':
        return 'Moyenne-élevée';
      case 'high':
        return 'Élevée';
      case 'very-high':
        return 'Très élevée';
      case 'max':
        return 'Maximale';
      default:
        return intensity;
    }
  };

  // Formater le terrain
  const formatTerrain = (terrain) => {
    switch (terrain) {
      case 'flat':
        return 'Plat';
      case 'rolling':
        return 'Vallonné';
      case 'hilly':
        return 'Collines';
      case 'mountainous':
        return 'Montagneux';
      case 'any':
        return 'Tous terrains';
      default:
        return terrain;
    }
  };

  return (
    <Card className="mb-3 h-100 workout-card">
      <Card.Header className={`bg-${getIntensityColor(workout.intensity || 'medium')} text-white`}>
        <h5 className="mb-0">{workout.name || 'Entraînement HIIT'}</h5>
      </Card.Header>
      <Card.Body>
        <Row className="mb-3">
          <Col>
            <div className="d-flex align-items-center mb-2">
              <FontAwesomeIcon icon={faFire} className="me-2 text-danger" />
              <span>Intensité: {formatIntensity(workout.intensity || 'medium')}</span>
            </div>
            <div className="d-flex align-items-center mb-2">
              <FontAwesomeIcon icon={faClock} className="me-2 text-primary" />
              <span>Durée: {formatDuration(workout.duration || workout.totalTime || 0)} min</span>
            </div>
          </Col>
          <Col>
            <div className="d-flex align-items-center mb-2">
              <FontAwesomeIcon icon={faHeartbeat} className="me-2 text-danger" />
              <span>Zone: {workout.targetZone || 'N/A'}</span>
            </div>
            <div className="d-flex align-items-center mb-2">
              <FontAwesomeIcon icon={faRoute} className="me-2 text-success" />
              <span>Terrain: {formatTerrain(workout.terrain || 'any')}</span>
            </div>
          </Col>
        </Row>
        
        <p className="workout-description">{workout.description || 'Aucune description disponible'}</p>
        
        <div className="d-flex justify-content-between align-items-center mt-3">
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={() => typeof onSelect === 'function' ? onSelect(workout, 'details') : null}
          >
            <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
            Détails
          </Button>
          
          {showAddButton && (
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => typeof onSelect === 'function' ? onSelect(workout, 'add') : null}
            >
              <FontAwesomeIcon icon={faPlus} className="me-1" />
              Ajouter à mon plan
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

// Définition des PropTypes pour validation
HIITWorkoutCard.propTypes = {
  workout: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    description: PropTypes.string,
    intensity: PropTypes.string,
    duration: PropTypes.number,
    totalTime: PropTypes.number,
    targetZone: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    terrain: PropTypes.string
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  showAddButton: PropTypes.bool
};

export default HIITWorkoutCard;
