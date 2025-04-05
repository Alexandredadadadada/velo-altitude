import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Card, Button, Row, Col, Tab, Tabs, Badge, 
  ListGroup, Form, Alert, Modal, Image
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrophy, faUsers, faCalendarAlt, faRoute, 
  faHeartbeat, faComment, faShare, faThumbsUp, faCheck
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../common/NotificationSystem';

/**
 * Composant pour la communauté de cyclistes et les défis
 */
const CyclingCommunity = ({ userProfile, onJoinChallenge, onLeaveChallenge }) => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState('challenges');
  const [challenges, setChallenges] = useState([]);
  const [groups, setGroups] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [comment, setComment] = useState('');

  // Simuler le chargement des données
  useEffect(() => {
    const loadCommunityData = async () => {
      try {
        setLoading(true);
        
        // Simulation d'un appel API
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Charger les défis
        setChallenges(getMockChallenges());
        
        // Charger les groupes
        setGroups(getMockGroups());
        
        // Charger le fil d'activité
        setFeed(getMockFeed());
      } catch (error) {
        console.error('Erreur lors du chargement des données de communauté:', error);
        notify.error('Impossible de charger les données de communauté');
      } finally {
        setLoading(false);
      }
    };
    
    loadCommunityData();
  }, [notify]);

  /**
   * Données mockées pour les défis
   */
  const getMockChallenges = () => {
    return [
      {
        id: 'c1',
        title: 'Tour des Vosges',
        description: 'Parcourez 300 km à travers les Vosges en 7 jours.',
        type: 'distance',
        target: 300,
        unit: 'km',
        startDate: '2025-04-10',
        endDate: '2025-04-17',
        participants: 28,
        difficulty: 'medium',
        badge: '/assets/badges/vosges.png',
        joined: false,
        progress: 0,
        leaderboard: [
          { userId: 'u1', name: 'Thomas D.', progress: 220, rank: 1 },
          { userId: 'u2', name: 'Sophie M.', progress: 180, rank: 2 },
          { userId: 'u3', name: 'Laurent F.', progress: 150, rank: 3 }
        ]
      },
      {
        id: 'c2',
        title: 'Challenge du Grimpeur',
        description: 'Accumulez 5000m de dénivelé positif en un mois.',
        type: 'elevation',
        target: 5000,
        unit: 'm',
        startDate: '2025-04-01',
        endDate: '2025-04-30',
        participants: 42,
        difficulty: 'hard',
        badge: '/assets/badges/climber.png',
        joined: true,
        progress: 2100,
        leaderboard: [
          { userId: 'u4', name: 'Marie L.', progress: 3800, rank: 1 },
          { userId: 'u5', name: 'Claude T.', progress: 3200, rank: 2 },
          { userId: userProfile?.id || 'current', name: userProfile?.name || 'Vous', progress: 2100, rank: 3 }
        ]
      },
      {
        id: 'c3',
        title: '30 jours de HIIT',
        description: 'Complétez 30 séances HIIT en 30 jours pour améliorer votre VO2max.',
        type: 'workouts',
        target: 30,
        unit: 'séances',
        startDate: '2025-04-01',
        endDate: '2025-04-30',
        participants: 16,
        difficulty: 'medium',
        badge: '/assets/badges/hiit.png',
        joined: true,
        progress: 12,
        leaderboard: [
          { userId: 'u6', name: 'Michel P.', progress: 15, rank: 1 },
          { userId: userProfile?.id || 'current', name: userProfile?.name || 'Vous', progress: 12, rank: 2 },
          { userId: 'u7', name: 'Anne S.', progress: 10, rank: 3 }
        ]
      }
    ];
  };

  /**
   * Données mockées pour les groupes
   */
  const getMockGroups = () => {
    return [
      {
        id: 'g1',
        name: 'Grand Est Grimpeurs',
        description: 'Groupe dédié aux passionnés d\'ascensions dans le Grand Est.',
        members: 124,
        type: 'public',
        location: 'Grand Est',
        joined: true,
        avatar: '/assets/groups/climbers.jpg',
        nextEvent: {
          title: 'Sortie Col de la Schlucht',
          date: '2025-04-12',
          participants: 18
        }
      },
      {
        id: 'g2',
        name: 'Cyclosportifs Nancy',
        description: 'Entraînements et sorties pour les cyclosportifs nancéiens.',
        members: 78,
        type: 'public',
        location: 'Nancy',
        joined: false,
        avatar: '/assets/groups/nancy.jpg',
        nextEvent: {
          title: 'Entraînement préparation La Granfondo',
          date: '2025-04-15',
          participants: 12
        }
      },
      {
        id: 'g3',
        name: 'Endurance Champagne',
        description: 'Spécialistes des longues distances en Champagne-Ardenne.',
        members: 96,
        type: 'private',
        location: 'Champagne-Ardenne',
        joined: false,
        avatar: '/assets/groups/champagne.jpg',
        nextEvent: {
          title: 'Brevet des 200km',
          date: '2025-04-20',
          participants: 25
        }
      }
    ];
  };

  /**
   * Données mockées pour le fil d'activité
   */
  const getMockFeed = () => {
    return [
      {
        id: 'f1',
        type: 'workout',
        userId: 'u8',
        userName: 'Julie M.',
        userAvatar: '/assets/avatars/julie.jpg',
        title: 'Séance HIIT au seuil',
        description: 'Belle séance intensive avec 6 x 3 minutes au seuil.',
        data: {
          duration: 62,
          power: 210,
          tss: 85
        },
        likes: 12,
        comments: 3,
        timestamp: '2025-04-03T14:30:00',
        liked: false
      },
      {
        id: 'f2',
        type: 'ride',
        userId: 'u9',
        userName: 'Pierre D.',
        userAvatar: '/assets/avatars/pierre.jpg',
        title: 'Tour du Lac de Pierre-Percée',
        description: 'Sortie de 80km avec 1200m de dénivelé. Route parfaite!',
        data: {
          distance: 80,
          elevation: 1200,
          duration: 180
        },
        likes: 24,
        comments: 8,
        timestamp: '2025-04-03T12:15:00',
        liked: true
      },
      {
        id: 'f3',
        type: 'achievement',
        userId: 'u10',
        userName: 'Caroline B.',
        userAvatar: '/assets/avatars/caroline.jpg',
        title: 'Badge "Grimpeur Confirmé" obtenu!',
        description: 'Caroline a atteint 25 000m de dénivelé ce mois-ci!',
        data: {
          badgeName: 'Grimpeur Confirmé',
          badgeImage: '/assets/badges/advanced-climber.png'
        },
        likes: 35,
        comments: 12,
        timestamp: '2025-04-02T18:45:00',
        liked: false
      }
    ];
  };

  /**
   * Rejoindre un défi
   */
  const handleJoinChallenge = (challenge) => {
    try {
      const updatedChallenges = challenges.map(c => {
        if (c.id === challenge.id) {
          return { ...c, joined: true };
        }
        return c;
      });
      
      setChallenges(updatedChallenges);
      
      if (onJoinChallenge) {
        onJoinChallenge(challenge.id);
      }
      
      notify.success(`Vous avez rejoint le défi "${challenge.title}"`);
    } catch (error) {
      console.error('Erreur lors de la participation au défi:', error);
      notify.error('Impossible de rejoindre le défi');
    }
  };

  /**
   * Quitter un défi
   */
  const handleLeaveChallenge = (challenge) => {
    try {
      const updatedChallenges = challenges.map(c => {
        if (c.id === challenge.id) {
          return { ...c, joined: false };
        }
        return c;
      });
      
      setChallenges(updatedChallenges);
      
      if (onLeaveChallenge) {
        onLeaveChallenge(challenge.id);
      }
      
      notify.info(`Vous avez quitté le défi "${challenge.title}"`);
    } catch (error) {
      console.error('Erreur lors du départ du défi:', error);
      notify.error('Impossible de quitter le défi');
    }
  };

  /**
   * Rejoindre un groupe
   */
  const handleJoinGroup = (group) => {
    try {
      const updatedGroups = groups.map(g => {
        if (g.id === group.id) {
          return { ...g, joined: true };
        }
        return g;
      });
      
      setGroups(updatedGroups);
      notify.success(`Vous avez rejoint le groupe "${group.name}"`);
    } catch (error) {
      console.error('Erreur lors de la participation au groupe:', error);
      notify.error('Impossible de rejoindre le groupe');
    }
  };

  /**
   * Aimer une publication
   */
  const handleLike = (item) => {
    try {
      const updatedFeed = feed.map(f => {
        if (f.id === item.id) {
          return { 
            ...f, 
            liked: !f.liked, 
            likes: f.liked ? f.likes - 1 : f.likes + 1 
          };
        }
        return f;
      });
      
      setFeed(updatedFeed);
    } catch (error) {
      console.error('Erreur lors de l\'action J\'aime:', error);
      notify.error('Impossible d\'aimer cette publication');
    }
  };

  /**
   * Ouvrir la modale de détails
   */
  const openDetailsModal = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  /**
   * Fermer la modale de détails
   */
  const closeDetailsModal = () => {
    setSelectedItem(null);
    setShowModal(false);
    setComment('');
  };

  /**
   * Ajouter un commentaire
   */
  const handleAddComment = () => {
    if (!comment.trim()) return;
    
    try {
      const updatedFeed = feed.map(f => {
        if (f.id === selectedItem.id) {
          return { 
            ...f, 
            comments: f.comments + 1
          };
        }
        return f;
      });
      
      setFeed(updatedFeed);
      setComment('');
      notify.success('Commentaire ajouté');
      
      // Dans une application réelle, il faudrait envoyer le commentaire au serveur
      setTimeout(() => {
        closeDetailsModal();
      }, 1000);
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      notify.error('Impossible d\'ajouter le commentaire');
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
   * Déterminer la couleur du badge de difficulté
   */
  const getDifficultyBadgeColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'primary';
    }
  };

  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className="text-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="mt-2">Chargement de la communauté...</p>
      </div>
    );
  }

  return (
    <div className="cycling-community">
      <div className="heading mb-4">
        <h2>Communauté & Défis</h2>
        <p className="text-muted">
          Rejoignez des défis, participez à des groupes et suivez l'activité de vos amis cyclistes
        </p>
      </div>
      
      <Tabs
        activeKey={activeTab}
        onSelect={(key) => setActiveTab(key)}
        className="mb-4"
      >
        <Tab 
          eventKey="challenges" 
          title={
            <><FontAwesomeIcon icon={faTrophy} className="me-2" />Défis</>
          }
        >
          <div className="challenges-container">
            <Row xs={1} md={2} lg={3} className="g-4">
              {challenges.map(challenge => (
                <Col key={challenge.id}>
                  <Card className="h-100 challenge-card">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <Badge 
                        bg={getDifficultyBadgeColor(challenge.difficulty)}
                        className="me-2"
                      >
                        {t(`difficulty.${challenge.difficulty}`)}
                      </Badge>
                      <small className="text-muted">
                        <FontAwesomeIcon icon={faUsers} className="me-1" />
                        {challenge.participants} participants
                      </small>
                    </Card.Header>
                    <Card.Body>
                      <Card.Title className="mb-3">{challenge.title}</Card.Title>
                      <Card.Text>{challenge.description}</Card.Text>
                      
                      <div className="mb-3">
                        <Badge bg="secondary" className="me-2">
                          <FontAwesomeIcon icon={faCalendarAlt} className="me-1" />
                          {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
                        </Badge>
                      </div>
                      
                      <div className="challenge-target mb-3">
                        <div className="d-flex justify-content-between">
                          <span>Objectif:</span>
                          <strong>{challenge.target} {challenge.unit}</strong>
                        </div>
                        
                        {challenge.joined && (
                          <>
                            <div className="d-flex justify-content-between mt-1">
                              <span>Votre progression:</span>
                              <strong>{challenge.progress} {challenge.unit}</strong>
                            </div>
                            <div className="progress mt-2">
                              <div 
                                className="progress-bar bg-success" 
                                role="progressbar" 
                                style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                                aria-valuenow={(challenge.progress / challenge.target) * 100}
                                aria-valuemin="0" 
                                aria-valuemax="100"
                              >
                                {Math.round((challenge.progress / challenge.target) * 100)}%
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="d-flex justify-content-between mt-3">
                        <Button 
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => openDetailsModal(challenge)}
                        >
                          Voir les détails
                        </Button>
                        
                        {challenge.joined ? (
                          <Button 
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleLeaveChallenge(challenge)}
                          >
                            Quitter le défi
                          </Button>
                        ) : (
                          <Button 
                            variant="primary"
                            size="sm"
                            onClick={() => handleJoinChallenge(challenge)}
                          >
                            Rejoindre le défi
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </Tab>
        
        <Tab 
          eventKey="groups" 
          title={
            <><FontAwesomeIcon icon={faUsers} className="me-2" />Groupes</>
          }
        >
          <div className="groups-container">
            <Row xs={1} md={2} lg={3} className="g-4">
              {groups.map(group => (
                <Col key={group.id}>
                  <Card className="h-100 group-card">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <Badge 
                        bg={group.type === 'public' ? 'success' : 'info'}
                        className="me-2"
                      >
                        {group.type === 'public' ? 'Public' : 'Privé'}
                      </Badge>
                      <small className="text-muted">
                        <FontAwesomeIcon icon={faUsers} className="me-1" />
                        {group.members} membres
                      </small>
                    </Card.Header>
                    <Card.Body>
                      <Card.Title className="mb-3">{group.name}</Card.Title>
                      <Card.Text>{group.description}</Card.Text>
                      
                      <div className="mb-3">
                        <Badge bg="secondary" className="me-2">
                          <FontAwesomeIcon icon={faRoute} className="me-1" />
                          {group.location}
                        </Badge>
                      </div>
                      
                      {group.nextEvent && (
                        <Alert variant="info" className="next-event p-2">
                          <div className="d-flex justify-content-between align-items-center">
                            <small>
                              <strong>Prochain événement:</strong> {group.nextEvent.title}
                            </small>
                            <small>{formatDate(group.nextEvent.date)}</small>
                          </div>
                        </Alert>
                      )}
                      
                      <div className="d-flex justify-content-between mt-3">
                        <Button 
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => openDetailsModal(group)}
                        >
                          Voir le groupe
                        </Button>
                        
                        {group.joined ? (
                          <Button 
                            variant="success"
                            size="sm"
                            disabled
                          >
                            <FontAwesomeIcon icon={faCheck} className="me-1" />
                            Membre
                          </Button>
                        ) : (
                          <Button 
                            variant="primary"
                            size="sm"
                            onClick={() => handleJoinGroup(group)}
                          >
                            Rejoindre
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </Tab>
        
        <Tab 
          eventKey="feed" 
          title={
            <><FontAwesomeIcon icon={faHeartbeat} className="me-2" />Activités</>
          }
        >
          <div className="feed-container">
            <ListGroup>
              {feed.map(item => (
                <ListGroup.Item key={item.id} className="feed-item p-3">
                  <div className="d-flex">
                    <div className="me-3">
                      <Image 
                        src={item.userAvatar || '/assets/avatars/default.jpg'} 
                        roundedCircle 
                        width={50} 
                        height={50} 
                      />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between">
                        <div>
                          <h5 className="mb-1">{item.userName}</h5>
                          <h6 className="mb-2">{item.title}</h6>
                        </div>
                        <small className="text-muted">
                          {new Date(item.timestamp).toLocaleString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </small>
                      </div>
                      
                      <p>{item.description}</p>
                      
                      {item.type === 'workout' && (
                        <div className="activity-stats d-flex">
                          <Badge bg="light" text="dark" className="me-2">
                            <FontAwesomeIcon icon={faClock} className="me-1" />
                            {item.data.duration} min
                          </Badge>
                          <Badge bg="light" text="dark" className="me-2">
                            <FontAwesomeIcon icon={faHeartbeat} className="me-1" />
                            {item.data.power} W
                          </Badge>
                          <Badge bg="light" text="dark">
                            TSS: {item.data.tss}
                          </Badge>
                        </div>
                      )}
                      
                      {item.type === 'ride' && (
                        <div className="activity-stats d-flex">
                          <Badge bg="light" text="dark" className="me-2">
                            <FontAwesomeIcon icon={faRoute} className="me-1" />
                            {item.data.distance} km
                          </Badge>
                          <Badge bg="light" text="dark" className="me-2">
                            <FontAwesomeIcon icon={faMountain} className="me-1" />
                            {item.data.elevation} m
                          </Badge>
                          <Badge bg="light" text="dark">
                            <FontAwesomeIcon icon={faClock} className="me-1" />
                            {Math.floor(item.data.duration / 60)}h{(item.data.duration % 60).toString().padStart(2, '0')}
                          </Badge>
                        </div>
                      )}
                      
                      <div className="feed-actions d-flex mt-3">
                        <Button 
                          variant={item.liked ? "primary" : "outline-primary"} 
                          size="sm"
                          className="me-2"
                          onClick={() => handleLike(item)}
                        >
                          <FontAwesomeIcon icon={faThumbsUp} className="me-1" />
                          {item.likes}
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          className="me-2"
                          onClick={() => openDetailsModal(item)}
                        >
                          <FontAwesomeIcon icon={faComment} className="me-1" />
                          {item.comments}
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                        >
                          <FontAwesomeIcon icon={faShare} className="me-1" />
                          Partager
                        </Button>
                      </div>
                    </div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </div>
        </Tab>
      </Tabs>
      
      {/* Modale de détails */}
      <Modal show={showModal} onHide={closeDetailsModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedItem?.title || 'Détails'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <div className="details-content">
              {/* Contenu spécifique selon le type d'élément sélectionné */}
              {activeTab === 'challenges' && (
                <div className="challenge-details">
                  <p>{selectedItem.description}</p>
                  
                  <div className="mb-3">
                    <h5>Classement</h5>
                    <ListGroup>
                      {selectedItem.leaderboard.map((leader, index) => (
                        <ListGroup.Item 
                          key={index}
                          className={leader.userId === userProfile?.id ? 'bg-light' : ''}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <Badge bg="primary" className="me-2">#{leader.rank}</Badge>
                              {leader.name}
                            </div>
                            <div>
                              {leader.progress} {selectedItem.unit}
                            </div>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                  
                  <div className="challenge-dates mb-3">
                    <h5>Dates</h5>
                    <p>
                      <strong>Début:</strong> {formatDate(selectedItem.startDate)}
                      <br />
                      <strong>Fin:</strong> {formatDate(selectedItem.endDate)}
                    </p>
                  </div>
                </div>
              )}
              
              {activeTab === 'feed' && (
                <div className="feed-details">
                  <div className="d-flex mb-3">
                    <Image 
                      src={selectedItem.userAvatar || '/assets/avatars/default.jpg'} 
                      roundedCircle 
                      width={60} 
                      height={60}
                      className="me-3" 
                    />
                    <div>
                      <h5>{selectedItem.userName}</h5>
                      <p className="text-muted">
                        {new Date(selectedItem.timestamp).toLocaleString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h5>{selectedItem.title}</h5>
                    <p>{selectedItem.description}</p>
                  </div>
                  
                  <hr />
                  
                  <div className="comments-section mb-3">
                    <h5>Commentaires ({selectedItem.comments})</h5>
                    <div className="comments-placeholder text-center my-4">
                      <p className="text-muted">Les commentaires seraient chargés depuis le serveur ici.</p>
                    </div>
                  </div>
                  
                  <div className="add-comment">
                    <Form.Group className="mb-3">
                      <Form.Label>Ajouter un commentaire</Form.Label>
                      <Form.Control 
                        as="textarea" 
                        rows={2}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Votre commentaire..."
                      />
                    </Form.Group>
                    <Button 
                      variant="primary"
                      onClick={handleAddComment}
                      disabled={!comment.trim()}
                    >
                      <FontAwesomeIcon icon={faComment} className="me-2" />
                      Commenter
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeDetailsModal}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

CyclingCommunity.propTypes = {
  userProfile: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    level: PropTypes.string,
    avatar: PropTypes.string
  }),
  onJoinChallenge: PropTypes.func,
  onLeaveChallenge: PropTypes.func
};

export default CyclingCommunity;
