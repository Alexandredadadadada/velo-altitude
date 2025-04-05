import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Card, Form, Button, Spinner, ListGroup, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, faBicycle, faChartLine, faHeartbeat, 
  faUtensils, faDumbbell, faRunning, faRobot, faUser
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../common/NotificationSystem';

/**
 * Assistant Coach IA pour le cyclisme
 * Fournit des conseils personnalisés, des réponses aux questions et des analyses
 */
const CyclingCoach = ({ userProfile, activityData }) => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const messagesEndRef = useRef(null);
  
  // Message de bienvenue initial
  useEffect(() => {
    const welcomeMessage = {
      id: 'welcome',
      sender: 'coach',
      text: userProfile?.firstName 
        ? `Bonjour ${userProfile.firstName} ! Je suis votre coach cyclisme personnel. Comment puis-je vous aider aujourd'hui ?` 
        : "Bonjour ! Je suis votre coach cyclisme personnel. Comment puis-je vous aider aujourd'hui ?",
      timestamp: new Date(),
      category: 'general'
    };
    
    setMessages([welcomeMessage]);
    
    // Suggestions initiales
    generateSuggestions();
  }, [userProfile]);
  
  // Défiler automatiquement vers le dernier message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Générer des suggestions basées sur le profil et l'historique
  const generateSuggestions = () => {
    const defaultSuggestions = [
      { text: "Comment améliorer mon endurance ?", category: "training" },
      { text: "Que manger avant une sortie longue ?", category: "nutrition" },
      { text: "Quels exercices pour renforcer mes jambes ?", category: "strength" },
      { text: "Comment calculer ma FTP ?", category: "performance" }
    ];
    
    // Ajouter des suggestions personnalisées basées sur le profil utilisateur
    let personalizedSuggestions = [...defaultSuggestions];
    
    if (userProfile) {
      // Suggestions basées sur le niveau
      if (userProfile.level === 'beginner') {
        personalizedSuggestions.push(
          { text: "Conseils pour débuter en cyclisme", category: "training" },
          { text: "Quelle devrait être ma cadence de pédalage ?", category: "technique" }
        );
      } else if (userProfile.level === 'intermediate') {
        personalizedSuggestions.push(
          { text: "Comment progresser au seuil ?", category: "training" },
          { text: "Exercices de puissance pour cols", category: "training" }
        );
      } else if (userProfile.level === 'advanced' || userProfile.level === 'elite') {
        personalizedSuggestions.push(
          { text: "Optimiser ma récupération entre les séances", category: "recovery" },
          { text: "Stratégies de course pour compétition", category: "performance" }
        );
      }
      
      // Suggestions basées sur l'âge
      if (userProfile.age && userProfile.age > 50) {
        personalizedSuggestions.push(
          { text: "Conseils cyclisme pour seniors", category: "training" },
          { text: "Récupération après 50 ans", category: "recovery" }
        );
      }
    }
    
    // Ajouter des suggestions basées sur les données d'activité récentes
    if (activityData && activityData.length > 0) {
      const recentActivity = activityData[0];
      
      // Si longue sortie récente
      if (recentActivity.duration > 180) { // plus de 3h
        personalizedSuggestions.push(
          { text: "Récupérer après ma longue sortie", category: "recovery" },
          { text: "Nutrition post-effort prolongé", category: "nutrition" }
        );
      }
      
      // Si intensité élevée récente
      if (recentActivity.intensity && recentActivity.intensity > 0.8) {
        personalizedSuggestions.push(
          { text: "Planifier après un effort intense", category: "training" },
          { text: "Optimiser ma récupération active", category: "recovery" }
        );
      }
    }
    
    // Suggestions aléatoires mais pertinentes
    setSuggestions(shuffle(personalizedSuggestions).slice(0, 5));
  };
  
  // Mélanger un tableau (pour les suggestions)
  const shuffle = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };
  
  // Envoyer un message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: input.trim(),
      timestamp: new Date(),
      category: 'general'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Simuler l'appel à une API (à remplacer par un appel réel)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Déterminer la catégorie de la question
      const category = determineCategory(input.trim());
      
      // Générer une réponse adaptée
      const coachResponse = await generateCoachResponse(input.trim(), category, userProfile, activityData);
      
      setMessages(prev => [...prev, {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: coachResponse.text,
        additionalInfo: coachResponse.additionalInfo,
        links: coachResponse.links,
        category: category,
        timestamp: new Date()
      }]);
      
      // Rafraîchir les suggestions
      generateSuggestions();
      
    } catch (error) {
      console.error('Erreur de communication avec le coach IA:', error);
      notify.error('Impossible de communiquer avec le coach IA', error);
      
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        sender: 'coach',
        text: "Désolé, j'ai rencontré un problème technique. Pouvez-vous reformuler votre question ?",
        timestamp: new Date(),
        category: 'error'
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Utiliser une suggestion
  const handleUseSuggestion = (suggestion) => {
    setInput(suggestion.text);
    // Focus sur l'input
    document.getElementById('coach-input').focus();
  };
  
  // Déterminer la catégorie d'une question
  const determineCategory = (text) => {
    const lowerText = text.toLowerCase();
    
    const categories = {
      training: ['entraînement', 'séance', 'interval', 'hiit', 'sortie', 'volume', 'intensité'],
      nutrition: ['manger', 'nutrition', 'alimentation', 'hydratation', 'boisson', 'repas'],
      recovery: ['récupération', 'repos', 'sommeil', 'fatigue', 'surmenage'],
      performance: ['ftp', 'puissance', 'performance', 'améliorer', 'progression'],
      technique: ['technique', 'position', 'cadence', 'pédalage', 'aérodynamique'],
      equipment: ['vélo', 'matériel', 'équipement', 'roues', 'pneus', 'guidon', 'selle'],
      strength: ['musculation', 'force', 'exercice', 'renforcement', 'gainage'],
      health: ['santé', 'blessure', 'douleur', 'courbature', 'médical']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  };
  
  // Générer une réponse de coach contextualisée
  const generateCoachResponse = async (question, category, profile, activities) => {
    // Cette fonction simule une réponse d'IA - à remplacer par un appel API réel
    
    // Réponses pré-définies basées sur la catégorie
    const responses = {
      training: [
        "Pour améliorer votre endurance, commencez par augmenter progressivement la durée de vos sorties longues de 10% par semaine. Variez également l'intensité avec des séances en zone 2 (65-75% de FTP) pour construire une base aérobie solide.",
        "Pour progresser en cyclisme, la constance est clé. Visez 3-4 sorties par semaine avec une variété d'intensités. Incluez une sortie longue, une séance d'intervalles et une ou deux sorties de récupération."
      ],
      nutrition: [
        "Avant une sortie longue, privilégiez un repas riche en glucides complexes 2-3h avant (pâtes, riz, pain complet). Pendant l'effort, visez 60-90g de glucides par heure selon l'intensité, et hydratez-vous avec 500-750ml d'eau par heure.",
        "Pour la récupération post-effort, consommez des protéines (15-25g) et des glucides dans les 30 minutes suivant la fin. Un ratio de 3:1 glucides/protéines est idéal pour reconstituer les réserves de glycogène."
      ],
      recovery: [
        "La récupération est aussi importante que l'entraînement. Alternez jours intenses et jours faciles, dormez 7-9h par nuit, et utilisez des techniques comme le massage, les bains froids ou la compression pour accélérer la récupération musculaire.",
        "Pour éviter le surentraînement, surveillez votre fréquence cardiaque au repos. Une augmentation de plus de 7-10% est un signal d'alarme indiquant que votre corps a besoin de plus de récupération."
      ],
      performance: [
        "Pour estimer votre FTP (seuil fonctionnel de puissance), effectuez un test de 20 minutes à intensité maximale soutenable. Multipliez la puissance moyenne par 0.95 pour obtenir une estimation de votre FTP.",
        "Pour améliorer votre puissance au seuil, intégrez des intervalles de 8-20 minutes à 90-105% de votre FTP, avec une récupération égale à 50% du temps d'effort."
      ]
    };
    
    // Personnalisation basée sur le profil
    let profileContext = "";
    if (profile) {
      if (profile.ftp) {
        profileContext += `Avec votre FTP actuelle de ${profile.ftp}W, `;
      }
      
      if (profile.level) {
        const levelMap = {
          beginner: "en tant que débutant",
          intermediate: "à votre niveau intermédiaire",
          advanced: "en tant que cycliste avancé",
          elite: "en tant que cycliste d'élite"
        };
        profileContext += levelMap[profile.level] || "";
      }
    }
    
    // Sélection d'une réponse
    let responseText = "";
    if (responses[category] && responses[category].length > 0) {
      responseText = responses[category][Math.floor(Math.random() * responses[category].length)];
      
      // Ajouter le contexte du profil si disponible
      if (profileContext) {
        responseText = profileContext + ", " + responseText.charAt(0).toLowerCase() + responseText.slice(1);
      }
    } else {
      // Réponse générique
      responseText = "Votre question sur " + category + " est intéressante. L'équilibre entre entraînement, récupération et nutrition est essentiel pour progresser. N'hésitez pas à me poser des questions plus spécifiques pour obtenir des conseils adaptés à votre situation.";
    }
    
    // Informations supplémentaires
    let additionalInfo = null;
    let links = null;
    
    // Ajouter des informations pertinentes selon la catégorie
    if (category === 'training') {
      additionalInfo = {
        title: "Zones d'entraînement",
        content: "Zone 1: <55% FTP (récupération)\nZone 2: 56-75% FTP (endurance)\nZone 3: 76-90% FTP (tempo)\nZone 4: 91-105% FTP (seuil)\nZone 5: 106-120% FTP (VO2max)\nZone 6: 121-150% FTP (anaérobie)\nZone 7: >150% FTP (sprint)"
      };
      
      links = [
        { text: "Guide complet des zones d'entraînement", url: "#/articles/zones-entrainement" },
        { text: "Programmation cycliste avancée", url: "#/articles/programmation-cycliste" }
      ];
    } else if (category === 'nutrition') {
      additionalInfo = {
        title: "Apports recommandés pour cyclistes",
        content: "Entraînement: 5-7g de glucides/kg de poids corporel/jour\nCompétition: 8-10g de glucides/kg/jour\nProtéines: 1.2-1.6g/kg/jour\nLipides: 1g/kg/jour"
      };
    }
    
    return {
      text: responseText,
      additionalInfo,
      links
    };
  };
  
  // Filtrer les messages par catégorie
  const filteredMessages = activeCategory === 'all' 
    ? messages 
    : messages.filter(m => m.category === activeCategory || m.sender === 'user');
  
  // Icônes pour les catégories
  const categoryIcons = {
    training: faRunning,
    nutrition: faUtensils,
    performance: faChartLine,
    recovery: faHeartbeat,
    equipment: faBicycle,
    strength: faDumbbell,
    general: faRobot
  };
  
  return (
    <div className="cycling-coach">
      <Card className="chat-container">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0">
              <FontAwesomeIcon icon={faRobot} className="me-2" />
              Coach Cyclisme IA
            </h3>
            <div className="category-filters">
              <Button 
                variant={activeCategory === 'all' ? 'primary' : 'outline-primary'} 
                size="sm"
                onClick={() => setActiveCategory('all')}
                className="me-1"
              >
                Tous
              </Button>
              {['training', 'nutrition', 'performance', 'recovery'].map(cat => (
                <Button 
                  key={cat}
                  variant={activeCategory === cat ? 'primary' : 'outline-primary'} 
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                  className="me-1"
                >
                  <FontAwesomeIcon 
                    icon={categoryIcons[cat] || faRobot} 
                    className="me-1" 
                  />
                  {t(`categories.${cat}`)}
                </Button>
              ))}
            </div>
          </div>
        </Card.Header>
        
        <Card.Body className="chat-messages">
          <ListGroup variant="flush">
            {filteredMessages.map(message => (
              <ListGroup.Item 
                key={message.id} 
                className={`message ${message.sender}`}
              >
                <div className="message-header">
                  <span className="message-sender">
                    <FontAwesomeIcon 
                      icon={message.sender === 'coach' ? faRobot : faUser} 
                      className="me-2" 
                    />
                    {message.sender === 'coach' ? 'Coach IA' : 'Vous'}
                  </span>
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                
                <div className="message-content">
                  {message.text}
                </div>
                
                {message.additionalInfo && (
                  <div className="additional-info mt-2">
                    <h6>{message.additionalInfo.title}</h6>
                    <pre className="info-content p-2 bg-light rounded">
                      {message.additionalInfo.content}
                    </pre>
                  </div>
                )}
                
                {message.links && message.links.length > 0 && (
                  <div className="resource-links mt-2">
                    <h6>Ressources complémentaires:</h6>
                    <ul className="ps-3">
                      {message.links.map((link, idx) => (
                        <li key={idx}>
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            {link.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {message.sender === 'coach' && message.category && message.category !== 'general' && (
                  <Badge 
                    bg="light" 
                    text="dark" 
                    className="mt-2 category-badge"
                  >
                    <FontAwesomeIcon 
                      icon={categoryIcons[message.category] || faRobot} 
                      className="me-1" 
                    />
                    {t(`categories.${message.category}`)}
                  </Badge>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
          <div ref={messagesEndRef} />
        </Card.Body>
        
        <Card.Footer>
          {suggestions.length > 0 && (
            <div className="suggestions mb-3">
              <div className="suggestion-chips d-flex flex-wrap gap-2">
                {suggestions.map((suggestion, idx) => (
                  <Badge 
                    key={idx} 
                    bg="light" 
                    text="primary" 
                    className="suggestion-chip p-2 cursor-pointer"
                    onClick={() => handleUseSuggestion(suggestion)}
                  >
                    <FontAwesomeIcon 
                      icon={categoryIcons[suggestion.category] || faRobot} 
                      className="me-1" 
                    />
                    {suggestion.text}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <Form onSubmit={handleSendMessage}>
            <div className="input-group">
              <Form.Control
                id="coach-input"
                type="text"
                placeholder="Posez une question sur le cyclisme, l'entraînement, la nutrition..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <Button 
                variant="primary" 
                type="submit"
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <FontAwesomeIcon icon={faPaperPlane} />
                )}
              </Button>
            </div>
          </Form>
        </Card.Footer>
      </Card>
      
      <style jsx="true">{`
        .cycling-coach {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .chat-container {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          max-height: 500px;
        }
        
        .message {
          margin-bottom: 8px;
          padding: 10px 15px;
          border-radius: 8px;
          max-width: 85%;
        }
        
        .message.user {
          background-color: #f0f0f0;
          align-self: flex-end;
          margin-left: auto;
        }
        
        .message.coach {
          background-color: #f8f9fa;
          border-left: 3px solid #0d6efd;
        }
        
        .message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 0.85rem;
        }
        
        .message-time {
          color: #6c757d;
          font-size: 0.75rem;
        }
        
        .cursor-pointer {
          cursor: pointer;
        }
        
        .suggestion-chip:hover {
          background-color: #e9ecef !important;
        }
        
        .category-badge {
          font-size: 0.7rem;
        }
        
        .info-content {
          font-size: 0.8rem;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
};

CyclingCoach.propTypes = {
  userProfile: PropTypes.shape({
    id: PropTypes.string,
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    ftp: PropTypes.number,
    level: PropTypes.string,
    age: PropTypes.number,
    weight: PropTypes.number
  }),
  activityData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      date: PropTypes.string,
      duration: PropTypes.number,
      distance: PropTypes.number,
      intensity: PropTypes.number
    })
  )
};

CyclingCoach.defaultProps = {
  activityData: []
};

export default CyclingCoach;
