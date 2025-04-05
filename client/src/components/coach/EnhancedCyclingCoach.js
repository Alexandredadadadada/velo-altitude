import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  Card, Container, Row, Col, Form, Button, Spinner, 
  ListGroup, Badge, Tabs, Tab, Alert, Accordion
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPaperPlane, faBicycle, faChartLine, faHeartbeat, 
  faUtensils, faDumbbell, faRunning, faRobot, faUser,
  faHistory, faLightbulb, faBookmark, faTrash, faStar,
  faInfoCircle, faExclamationTriangle, faCheck, faTimes,
  faMapMarkedAlt, faCalendarAlt, faClock, faRoute
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../common/NotificationSystem';
import axios from 'axios';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './EnhancedCyclingCoach.css';

/**
 * Assistant Coach IA amélioré pour le cyclisme
 * Fournit des conseils personnalisés, des réponses aux questions et des analyses
 * Intégration avec OpenAI et Claude pour des réponses intelligentes
 */
const EnhancedCyclingCoach = ({ userProfile, activityData, stravaData, weatherData }) => {
  const { t, i18n } = useTranslation();
  const { notify } = useNotification();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [savedMessages, setSavedMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [aiModel, setAiModel] = useState('claude'); // 'claude' ou 'openai'
  const [showSettings, setShowSettings] = useState(false);
  const [contextOptions, setContextOptions] = useState({
    includeProfile: true,
    includeActivities: true,
    includeWeather: true,
    includeStrava: true
  });
  const [analysisMode, setAnalysisMode] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Catégories pour filtrer les suggestions
  const categories = [
    { id: 'all', name: t('allCategories'), icon: faLightbulb },
    { id: 'training', name: t('training'), icon: faBicycle },
    { id: 'nutrition', name: t('nutrition'), icon: faUtensils },
    { id: 'recovery', name: t('recovery'), icon: faHeartbeat },
    { id: 'performance', name: t('performance'), icon: faChartLine },
    { id: 'technique', name: t('technique'), icon: faRoute },
    { id: 'equipment', name: t('equipment'), icon: faDumbbell },
    { id: 'planning', name: t('planning'), icon: faCalendarAlt }
  ];
  
  // Message de bienvenue initial
  useEffect(() => {
    const welcomeMessage = {
      id: 'welcome',
      sender: 'coach',
      text: userProfile?.firstName 
        ? t('welcomeMessageWithName', { name: userProfile.firstName }) 
        : t('welcomeMessage'),
      timestamp: new Date(),
      category: 'general'
    };
    
    setMessages([welcomeMessage]);
    
    // Charger les messages sauvegardés
    loadSavedMessages();
    
    // Suggestions initiales
    generateSuggestions();
  }, [userProfile, i18n.language]);
  
  // Défiler automatiquement vers le dernier message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Charger les messages sauvegardés depuis le localStorage
  const loadSavedMessages = useCallback(() => {
    try {
      const saved = localStorage.getItem('cyclingCoachSavedMessages');
      if (saved) {
        setSavedMessages(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages sauvegardés:', error);
    }
  }, []);

  // Sauvegarder un message
  const saveMessage = useCallback((message) => {
    try {
      const updatedSaved = [...savedMessages, {
        ...message,
        savedAt: new Date().toISOString()
      }];
      setSavedMessages(updatedSaved);
      localStorage.setItem('cyclingCoachSavedMessages', JSON.stringify(updatedSaved));
      notify.success(t('messageSaved'), { title: t('success') });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du message:', error);
      notify.error(t('errorSavingMessage'), { title: t('error') });
    }
  }, [savedMessages, notify, t]);

  // Supprimer un message sauvegardé
  const deleteSavedMessage = useCallback((index) => {
    try {
      const updatedSaved = [...savedMessages];
      updatedSaved.splice(index, 1);
      setSavedMessages(updatedSaved);
      localStorage.setItem('cyclingCoachSavedMessages', JSON.stringify(updatedSaved));
      notify.success(t('messageDeleted'), { title: t('success') });
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error);
      notify.error(t('errorDeletingMessage'), { title: t('error') });
    }
  }, [savedMessages, notify, t]);
  
  // Générer des suggestions basées sur le profil et l'historique
  const generateSuggestions = useCallback(() => {
    const defaultSuggestions = [
      { text: t('suggestionEndurance'), category: "training" },
      { text: t('suggestionNutrition'), category: "nutrition" },
      { text: t('suggestionStrength'), category: "strength" },
      { text: t('suggestionFTP'), category: "performance" }
    ];
    
    // Ajouter des suggestions personnalisées basées sur le profil utilisateur
    let personalizedSuggestions = [...defaultSuggestions];
    
    if (userProfile) {
      // Suggestions basées sur le niveau
      if (userProfile.level === 'beginner') {
        personalizedSuggestions.push(
          { text: t('suggestionBeginner1'), category: "training" },
          { text: t('suggestionBeginner2'), category: "technique" }
        );
      } else if (userProfile.level === 'intermediate') {
        personalizedSuggestions.push(
          { text: t('suggestionIntermediate1'), category: "training" },
          { text: t('suggestionIntermediate2'), category: "training" }
        );
      } else if (userProfile.level === 'advanced' || userProfile.level === 'elite') {
        personalizedSuggestions.push(
          { text: t('suggestionAdvanced1'), category: "recovery" },
          { text: t('suggestionAdvanced2'), category: "performance" }
        );
      }
      
      // Suggestions basées sur l'âge
      if (userProfile.age && userProfile.age > 50) {
        personalizedSuggestions.push(
          { text: t('suggestionSenior1'), category: "training" },
          { text: t('suggestionSenior2'), category: "recovery" }
        );
      }
    }
    
    // Ajouter des suggestions basées sur les données d'activité récentes
    if (activityData && activityData.length > 0) {
      const recentActivity = activityData[0];
      
      // Si longue sortie récente
      if (recentActivity.duration > 180) { // plus de 3h
        personalizedSuggestions.push(
          { text: t('suggestionLongRide1'), category: "recovery" },
          { text: t('suggestionLongRide2'), category: "nutrition" }
        );
      }
      
      // Si intensité élevée récente
      if (recentActivity.intensity && recentActivity.intensity > 0.8) {
        personalizedSuggestions.push(
          { text: t('suggestionHighIntensity1'), category: "training" },
          { text: t('suggestionHighIntensity2'), category: "recovery" }
        );
      }
    }
    
    // Suggestions basées sur la météo
    if (weatherData) {
      if (weatherData.temperature > 30) {
        personalizedSuggestions.push(
          { text: t('suggestionHotWeather'), category: "nutrition" }
        );
      } else if (weatherData.temperature < 5) {
        personalizedSuggestions.push(
          { text: t('suggestionColdWeather'), category: "equipment" }
        );
      }
      
      if (weatherData.precipitation > 5) {
        personalizedSuggestions.push(
          { text: t('suggestionRainyWeather'), category: "equipment" }
        );
      }
    }
    
    // Suggestions aléatoires mais pertinentes
    const shuffled = shuffle(personalizedSuggestions);
    
    // Filtrer par catégorie active si nécessaire
    const filtered = activeCategory === 'all' 
      ? shuffled 
      : shuffled.filter(s => s.category === activeCategory);
    
    setSuggestions(filtered.slice(0, 5));
  }, [userProfile, activityData, weatherData, activeCategory, t]);
  
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
    e?.preventDefault();
    
    if (!input.trim() && !selectedActivity) return;
    
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: input.trim() || (selectedActivity ? t('analyzeActivityRequest', { activity: selectedActivity.name }) : ''),
      timestamp: new Date(),
      category: 'general'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Préparer le contexte
      const context = {};
      
      if (contextOptions.includeProfile && userProfile) {
        context.profile = userProfile;
      }
      
      if (contextOptions.includeActivities && activityData) {
        context.activities = activityData.slice(0, 5); // Limiter aux 5 dernières activités
      }
      
      if (contextOptions.includeWeather && weatherData) {
        context.weather = weatherData;
      }
      
      if (contextOptions.includeStrava && stravaData) {
        context.strava = stravaData;
      }
      
      // Ajouter l'historique récent des messages
      context.history = messages
        .slice(-5) // Limiter aux 5 derniers messages
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));
      
      let response;
      
      if (analysisMode && selectedActivity) {
        // Appel à l'API pour analyser une activité spécifique
        response = await axios.post('/api/virtual-coach/analyze-workout', {
          userId: userProfile?.id,
          activityId: selectedActivity.id,
          options: {
            detailLevel: 'detailed',
            compareToPrevious: true
          }
        });
        
        // Réinitialiser le mode d'analyse
        setAnalysisMode(false);
        setSelectedActivity(null);
      } else {
        // Appel à l'API pour une réponse normale
        response = await axios.post('/api/virtual-coach/answer', {
          userId: userProfile?.id,
          question: input.trim(),
          domain: determineCategory(input.trim()),
          includeUserContext: true,
          model: aiModel,
          context
        });
      }
      
      if (response.data && response.data.success) {
        const responseData = response.data.data;
        
        // Déterminer la catégorie de la réponse
        const category = responseData.domain || determineCategory(input.trim());
        
        // Construire la réponse du coach
        const coachResponse = {
          id: `coach-${Date.now()}`,
          sender: 'coach',
          text: responseData.answer || responseData.overview,
          additionalInfo: responseData.insights || responseData.recommendations,
          links: responseData.sources,
          metrics: responseData.metrics,
          strengths: responseData.strengths,
          improvements: responseData.improvements,
          category: category,
          timestamp: new Date(),
          confidence: responseData.confidence
        };
        
        setMessages(prev => [...prev, coachResponse]);
        
        // Rafraîchir les suggestions
        generateSuggestions();
      } else {
        throw new Error(response.data?.message || t('unknownError'));
      }
    } catch (error) {
      console.error('Erreur de communication avec le coach IA:', error);
      notify.error(error.message || t('aiCommunicationError'), { title: t('error') });
      
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        sender: 'coach',
        text: t('errorMessage'),
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
    inputRef.current?.focus();
  };
  
  // Déterminer la catégorie d'une question
  const determineCategory = (text) => {
    const lowerText = text.toLowerCase();
    
    const categoryKeywords = {
      training: ['entraînement', 'séance', 'interval', 'hiit', 'sortie', 'volume', 'intensité', 'training', 'workout', 'session'],
      nutrition: ['manger', 'nutrition', 'alimentation', 'hydratation', 'boisson', 'repas', 'food', 'eat', 'diet', 'hydration'],
      recovery: ['récupération', 'repos', 'sommeil', 'fatigue', 'surmenage', 'recovery', 'rest', 'sleep', 'fatigue', 'overtraining'],
      performance: ['ftp', 'puissance', 'performance', 'améliorer', 'progression', 'power', 'improve', 'progress', 'watts'],
      technique: ['technique', 'position', 'cadence', 'pédalage', 'aérodynamique', 'technique', 'position', 'cadence', 'pedaling', 'aerodynamic'],
      equipment: ['vélo', 'matériel', 'équipement', 'roues', 'pneus', 'guidon', 'selle', 'bike', 'equipment', 'wheels', 'tires', 'handlebar', 'saddle'],
      strength: ['musculation', 'force', 'exercice', 'renforcement', 'gainage', 'strength', 'exercise', 'core', 'gym'],
      health: ['santé', 'blessure', 'douleur', 'courbature', 'médical', 'health', 'injury', 'pain', 'soreness', 'medical']
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  };
  
  // Formater la date
  const formatDate = (date) => {
    return new Date(date).toLocaleTimeString(i18n.language, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Changer la catégorie active pour les suggestions
  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    // Régénérer les suggestions avec la nouvelle catégorie
    setTimeout(() => generateSuggestions(), 0);
  };
  
  // Démarrer l'analyse d'une activité
  const startActivityAnalysis = (activity) => {
    setAnalysisMode(true);
    setSelectedActivity(activity);
    handleSendMessage();
  };
  
  // Rendu du composant
  return (
    <Container fluid className="enhanced-coach-container">
      <Card className="coach-card">
        <Card.Header className="coach-header">
          <div className="coach-title">
            <FontAwesomeIcon icon={faRobot} className="coach-icon" />
            <h3>{t('cyclingCoach')}</h3>
          </div>
          <div className="coach-controls">
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={() => setShowSettings(!showSettings)}
              aria-label={t('settings')}
            >
              <FontAwesomeIcon icon={faInfoCircle} />
            </Button>
          </div>
        </Card.Header>
        
        {showSettings && (
          <Card.Body className="coach-settings">
            <h5>{t('coachSettings')}</h5>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>{t('aiModel')}</Form.Label>
                <Form.Select 
                  value={aiModel} 
                  onChange={(e) => setAiModel(e.target.value)}
                >
                  <option value="claude">{t('claudeModel')}</option>
                  <opt
(Content truncated due to size limit. Use line ranges to read in chunks)