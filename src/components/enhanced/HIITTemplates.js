import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useNotification } from '../common/NotificationSystem';
import FTPService from '../../services/FTPEstimationService';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * HIITTemplates component displays and allows customization of HIIT workout templates
 */
const HIITTemplates = ({ userProfile, onSaveWorkout }) => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customizedTemplate, setCustomizedTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load HIIT templates based on user profile
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        setError(null); // Réinitialiser les erreurs précédentes
        
        // Vérification du profil utilisateur
        if (!userProfile) {
          throw new Error('Profil utilisateur manquant ou incomplet');
        }
        
        // Mock delay for API call simulation
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Generate templates based on user level and FTP
        const mockTemplates = generateHIITTemplates(userProfile);
        setTemplates(mockTemplates);
        
        // Default select the first template
        if (mockTemplates.length > 0) {
          setSelectedTemplate(mockTemplates[0]);
          setCustomizedTemplate(mockTemplates[0]);
          
          // Notification de succès
          notify.success('Templates HIIT chargés avec succès', {
            title: 'Chargement terminé'
          });
        } else {
          throw new Error('Aucun template HIIT n\'a pu être généré');
        }
      } catch (error) {
        console.error('Error loading HIIT templates:', error);
        setError(error.message || 'Erreur lors du chargement des templates HIIT');
        
        // Notification d'erreur
        notify.error('Impossible de charger les templates HIIT', error, {
          title: 'Erreur de chargement'
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (userProfile) {
      loadTemplates();
    }
  }, [userProfile, notify, t]);
  
  /**
   * Generate HIIT templates based on user profile
   */
  const generateHIITTemplates = (profile) => {
    if (!profile) {
      console.error('Profil utilisateur manquant pour la génération des templates HIIT');
      return [];
    }
    
    // Vérification et correction des valeurs FTP et niveau
    let { level = 'intermediate' } = profile;
    
    // Utilisation du service FTP pour valider et normaliser la FTP
    const ftp = FTPService.validateFTP(profile.ftp, profile);
    
    // Validation du niveau utilisateur
    if (!['beginner', 'intermediate', 'advanced', 'elite'].includes(level)) {
      console.warn(`Niveau utilisateur invalide: ${level}, utilisation du niveau intermédiaire par défaut`);
      level = 'intermediate';
    }
    
    console.info(`Génération des templates HIIT avec FTP=${ftp}W et level=${level}`);
    
    const templates = [];
    
    try {
      // HIIT Templates based on user level and FTP
      if (level === 'beginner') {
        // Beginner templates with lower intensity and more rest
        templates.push({
          id: 'hiit-beginner-1',
          name: 'Pyramid de Récupération',
          description: t('beginnerPyramidDesc', 'Intervalles de durée progressive adaptés aux débutants'),
          difficulty: 1,
          duration: 30, // minutes
          intervals: generatePyramidIntervals(ftp, 0.7, 0.85, 30, 60, 60, [30, 60, 90, 60, 30])
        });
        
        templates.push({
          id: 'hiit-beginner-2',
          name: 'Intervalles Débutant',
          description: t('beginnerIntervalsDesc', 'Intervalles courts à intensité modérée pour débutants'),
          difficulty: 1,
          duration: 35,
          intervals: generateIntervals(ftp, 0.75, 45, 90, 6)
        });
      } else if (level === 'intermediate') {
        // Intermediate templates with moderate intensity
        templates.push({
          id: 'hiit-intermediate-1',
          name: 'Ladder Classique',
          description: t('intervalLadderDesc', 'Intervalles en échelle pour améliorer l\'endurance et la puissance'),
          difficulty: 2,
          duration: 45,
          intervals: generateLadderIntervals(ftp, 0.85, 0.95, [30, 60, 90, 120, 120, 90, 60, 30], 60)
        });
        
        templates.push({
          id: 'hiit-intermediate-2',
          name: 'Over-Under 90/105',
          description: t('overUnderDesc', 'Alternance d\'intensité pour stimuler le seuil lactique'),
          difficulty: 2,
          duration: 40,
          intervals: generateOverUnderIntervals(ftp, 0.9, 1.05, 180, 30, 4)
        });
      } else if (level === 'advanced') {
        // Advanced templates with higher intensity
        templates.push({
          id: 'hiit-advanced-1',
          name: 'VO2max Intense',
          description: t('vo2maxDesc', 'Stimulation intense de VO2max avec intervalles courts à haute intensité'),
          difficulty: 3,
          duration: 50,
          intervals: generateIntervals(ftp, 1.1, 30, 30, 10, 3)
        });
        
        templates.push({
          id: 'hiit-advanced-2',
          name: 'Pyramide Avancée',
          description: t('advancedPyramidDesc', 'Pyramide difficile pour cyclistes avancés'),
          difficulty: 3,
          duration: 60,
          intervals: generatePyramidIntervals(ftp, 0.9, 1.1, 30, 180, 60, [30, 60, 120, 180, 120, 60, 30])
        });
      } else if (level === 'elite') {
        // Elite templates with very high intensity
        templates.push({
          id: 'hiit-elite-1',
          name: 'Sprints Supramaximaux',
          description: t('sprintsDesc', 'Sprints courts très intenses pour cyclistes de compétition'),
          difficulty: 3,
          duration: 45,
          intervals: generateIntervals(ftp, 1.3, 15, 45, 12, 3)
        });
        
        templates.push({
          id: 'hiit-elite-2',
          name: 'Over-Under Elite',
          description: t('eliteOverUnderDesc', 'Over-under de compétition pour cyclistes d\'élite'),
          difficulty: 3,
          duration: 65,
          intervals: generateOverUnderIntervals(ftp, 0.95, 1.2, 240, 30, 5)
        });
      }
      
      // Ajouter des templates communs à tous les niveaux
      templates.push({
        id: 'hiit-common-1',
        name: '30/30 Classique',
        description: t('thirtyThirtyDesc', 'Intervalles 30/30 classiques pour tous niveaux'),
        difficulty: level === 'beginner' ? 2 : (level === 'intermediate' ? 1 : 1),
        duration: 40,
        intervals: generateIntervals(
          ftp, 
          level === 'beginner' ? 0.9 : (level === 'intermediate' ? 1.0 : 1.05), 
          30, 
          30, 
          10,
          2
        )
      });
      
    } catch (error) {
      console.error('Erreur lors de la génération des templates HIIT', error);
      notify.error('Erreur lors de la génération des templates', error, {
        details: 'Un template par défaut a été fourni à la place'
      });
      
      // Ajouter un template de secours en cas d'erreur
      templates.push({
        id: 'hiit-fallback',
        name: 'Entraînement par Défaut',
        description: 'Entraînement par intervalles standard',
        difficulty: 1,
        duration: 30,
        intervals: generateIntervals(ftp || 200, 0.8, 60, 60, 5)
      });
    }
    
    // Filtrer les templates qui n'ont pas d'intervalles valides
    const validTemplates = templates.filter(template => 
      template.intervals && 
      Array.isArray(template.intervals) && 
      template.intervals.length > 0
    );
    
    if (validTemplates.length === 0) {
      console.error('Aucun template valide n\'a pu être généré');
      notify.warning('Aucun template valide n\'a pu être généré, utilisation d\'un template de secours');
      
      // Ajouter un template minimal de dernier recours
      validTemplates.push({
        id: 'hiit-emergency',
        name: 'Intervalles Simples',
        description: 'Entraînement par intervalles de base',
        difficulty: 1,
        duration: 20,
        intervals: [
          { type: 'work', power: Math.round((ftp || 200) * 0.75), duration: 60, restDuration: 60 },
          { type: 'work', power: Math.round((ftp || 200) * 0.75), duration: 60, restDuration: 60 },
          { type: 'work', power: Math.round((ftp || 200) * 0.75), duration: 60, restDuration: 60 },
          { type: 'work', power: Math.round((ftp || 200) * 0.75), duration: 60, restDuration: 0 }
        ]
      });
    }
    
    return validTemplates;
  };

  /**
   * Generate standard intervals with same power and duration
   */
  const generateIntervals = (ftp, intensityFactor, workDuration, restDuration, count, sets = 1) => {
    // Validation des paramètres
    if (!ftp || ftp <= 0) {
      console.error('FTP invalide pour la génération d\'intervalles');
      ftp = 200; // Valeur par défaut
    }
    
    if (intensityFactor <= 0 || intensityFactor > 2) {
      console.warn(`Facteur d'intensité invalide (${intensityFactor}), utilisation d'une valeur par défaut (0.8)`);
      intensityFactor = 0.8;
    }
    
    if (workDuration <= 0) workDuration = 30;
    if (restDuration < 0) restDuration = 30;
    if (count <= 0) count = 5;
    if (sets <= 0) sets = 1;
    
    const intervals = [];
    
    // Arrondir la puissance au watt près pour éviter les valeurs décimales
    const power = Math.round(ftp * intensityFactor);
    
    for (let set = 0; set < sets; set++) {
      // Ajouter repos entre les séries (sauf première série)
      if (set > 0) {
        intervals.push({
          power: Math.round(ftp * 0.4), // 40% FTP pour récupération entre séries
          duration: 120, // 2 minutes de récupération entre séries
          type: 'rest',
          setRest: true
        });
      }
      
      for (let i = 0; i < count; i++) {
        // Interval d'effort
        intervals.push({
          power: power,
          duration: workDuration,
          type: 'work'
        });
        
        // Interval de récupération (sauf après le dernier de la série)
        if (i < count - 1 || set < sets - 1) {
          intervals.push({
            power: Math.round(ftp * 0.4), // 40% FTP pour récupération
            duration: restDuration,
            type: 'rest'
          });
        }
      }
    }
    
    return intervals;
  };
  
  /**
   * Generate pyramid intervals with increasing then decreasing durations
   */
  const generatePyramidIntervals = (ftp, minIntensity, maxIntensity, minDuration, maxDuration, restDuration, durations) => {
    // Validation des paramètres
    if (!ftp || ftp <= 0) ftp = 200;
    if (minIntensity <= 0 || minIntensity > 2) minIntensity = 0.7;
    if (maxIntensity <= 0 || maxIntensity > 2 || maxIntensity < minIntensity) maxIntensity = minIntensity + 0.2;
    if (minDuration <= 0) minDuration = 30;
    if (maxDuration <= 0 || maxDuration < minDuration) maxDuration = minDuration * 2;
    if (restDuration < 0) restDuration = 30;
    
    const intervals = [];
    
    // Si durations est spécifié, l'utiliser
    if (Array.isArray(durations) && durations.length > 0) {
      const stepCount = durations.length;
      durations.forEach((duration, index) => {
        // Calculer l'intensité progressive
        const progressFactor = index / (stepCount - 1);
        const intensity = minIntensity + progressFactor * (maxIntensity - minIntensity);
        
        intervals.push({
          power: Math.round(ftp * intensity),
          duration: duration,
          type: 'work'
        });
        
        if (index < durations.length - 1) {
          intervals.push({
            power: Math.round(ftp * 0.4), // 40% FTP pour récupération
            duration: restDuration,
            type: 'rest'
          });
        }
      });
    } else {
      // Générer une pyramide automatique
      // Code pour créer une pyramide par défaut
      // (non implémenté ici car durations est toujours fourni dans ce composant)
    }
    
    return intervals;
  };
  
  /**
   * Generate ladder intervals with varying durations
   */
  const generateLadderIntervals = (ftp, minIntensity, maxIntensity, durations, restDuration) => {
    // Validation des paramètres d'entrée
    if (!ftp || typeof ftp !== 'number' || ftp <= 0) {
      console.error('FTP invalide dans generateLadderIntervals', { ftp });
      ftp = 200; // Valeur par défaut sécurisée
    }
    
    if (typeof minIntensity !== 'number' || minIntensity <= 0 || minIntensity > 1.5) {
      console.error('Intensité minimale invalide dans generateLadderIntervals', { minIntensity });
      minIntensity = 0.75; // Valeur par défaut sécurisée
    }
    
    if (typeof maxIntensity !== 'number' || maxIntensity <= 0 || 
        maxIntensity > 1.5 || maxIntensity < minIntensity) {
      console.error('Intensité maximale invalide dans generateLadderIntervals', { maxIntensity });
      maxIntensity = minIntensity + 0.1; // Valeur par défaut sécurisée basée sur minIntensity
    }
    
    if (!Array.isArray(durations) || durations.length === 0) {
      console.error('Durées invalides dans generateLadderIntervals', { durations });
      durations = [30, 60, 90]; // Valeurs par défaut sécurisées
    }
    
    // S'assurer que restDuration est un nombre valide
    if (typeof restDuration !== 'number' || restDuration < 0) {
      console.error('Durée de repos invalide dans generateLadderIntervals', { restDuration });
      restDuration = 60; // Valeur par défaut sécurisée
    }
    
    const intervals = [];
    const steps = durations.length;
    
    // Calculer l'incrément d'intensité pour chaque échelon
    const intensityIncrement = (maxIntensity - minIntensity) / (steps - 1 || 1);
    
    durations.forEach((duration, index) => {
      // Validation de la durée
      if (typeof duration !== 'number' || duration <= 0) {
        console.warn(`Durée invalide à l'index ${index}`, { duration });
        duration = 30; // Valeur par défaut sécurisée
      }
      
      // Calculer l'intensité pour cet échelon
      const intensity = minIntensity + (intensityIncrement * index);
      
      // Calculer la puissance basée sur l'intensité et la FTP
      const power = Math.round(ftp * intensity);
      
      // Ajouter l'intervalle d'effort
      intervals.push({
        type: 'work',
        power,
        intensity: intensity,
        duration: duration,
        restDuration: index < durations.length - 1 ? restDuration : 0
      });
    });
    
    return intervals;
  };

  /**
   * Generate over-under intervals with alternating intensity
   */
  const generateOverUnderIntervals = (ftp, lowerIntensity, higherIntensity, totalDuration, switchTime, count) => {
    // Validation des paramètres d'entrée
    if (!ftp || typeof ftp !== 'number' || ftp <= 0) {
      console.error('FTP invalide dans generateOverUnderIntervals', { ftp });
      ftp = 200; // Valeur par défaut sécurisée
    }
    
    if (typeof lowerIntensity !== 'number' || lowerIntensity <= 0 || lowerIntensity > 1.2) {
      console.error('Intensité basse invalide dans generateOverUnderIntervals', { lowerIntensity });
      lowerIntensity = 0.85; // Valeur par défaut sécurisée
    }
    
    if (typeof higherIntensity !== 'number' || higherIntensity <= 0 || 
        higherIntensity > 1.5 || higherIntensity <= lowerIntensity) {
      console.error('Intensité haute invalide dans generateOverUnderIntervals', { higherIntensity });
      higherIntensity = lowerIntensity + 0.1; // Valeur par défaut sécurisée basée sur lowerIntensity
    }
    
    if (typeof totalDuration !== 'number' || totalDuration <= 0) {
      console.error('Durée totale invalide dans generateOverUnderIntervals', { totalDuration });
      totalDuration = 300; // Valeur par défaut sécurisée (5 minutes)
    }
    
    if (typeof switchTime !== 'number' || switchTime <= 0 || switchTime >= totalDuration) {
      console.error('Temps de changement invalide dans generateOverUnderIntervals', { switchTime });
      switchTime = 30; // Valeur par défaut sécurisée
    }
    
    if (typeof count !== 'number' || count <= 0) {
      console.error('Nombre d\'intervalles invalide dans generateOverUnderIntervals', { count });
      count = 4; // Valeur par défaut sécurisée
    }
    
    const intervals = [];
    
    // Calculer la puissance pour les intensités haute et basse
    const lowerPower = Math.round(ftp * lowerIntensity);
    const higherPower = Math.round(ftp * higherIntensity);
    
    // Calculer le temps de récupération entre les répétitions (1:1 ou rapport personnalisé)
    const restDuration = Math.round(totalDuration / 2);
    
    for (let i = 0; i < count; i++) {
      // Interval principal avec alternance over/under
      intervals.push({
        type: 'over-under',
        power: lowerPower, // Puissance de base
        secondaryPower: higherPower, // Puissance des pics
        intensity: lowerIntensity,
        secondaryIntensity: higherIntensity,
        duration: totalDuration,
        switchTime: switchTime,
        restDuration: i < count - 1 ? restDuration : 0
      });
    }
    
    return intervals;
  };
  
  /**
   * Handle template selection
   */
  const handleSelectTemplate = (template) => {
    try {
      if (!template) {
        throw new Error('Template invalide');
      }
      
      setSelectedTemplate(template);
      // Créer une copie profonde pour éviter de modifier l'original
      setCustomizedTemplate(JSON.parse(JSON.stringify(template)));
    } catch (error) {
      console.error('Erreur lors de la sélection du template:', error);
      setError(`Erreur lors de la sélection du template: ${error.message}`);
    }
  };
  
  /**
   * Handle interval adjustment
   */
  const handleAdjustInterval = (index, field, value) => {
    if (index < 0 || !customizedTemplate || !customizedTemplate.intervals) {
      console.error('Index invalide ou template non disponible', { index, customizedTemplate });
      notify.error('Impossible de modifier l\'intervalle', { 
        details: 'Données d\'intervalle non disponibles' 
      });
      return;
    }
    
    if (!customizedTemplate.intervals[index]) {
      console.error('Intervalle non trouvé à l\'index spécifié', { index, intervals: customizedTemplate.intervals });
      notify.error('Intervalle non trouvé');
      return;
    }
    
    // Créer une copie profonde pour éviter les modifications par référence
    const updatedTemplate = JSON.parse(JSON.stringify(customizedTemplate));
    
    // Valider et convertir la valeur entrée
    let numericValue = parseFloat(value);
    
    // Gérer les valeurs non numériques
    if (isNaN(numericValue)) {
      console.warn(`Valeur non numérique entrée pour ${field}:`, value);
      notify.warning(`Valeur invalide pour ${field === 'power' ? 'la puissance' : 'la durée'}`);
      
      // Utiliser la valeur actuelle en cas d'entrée non valide
      if (field === 'power') {
        numericValue = updatedTemplate.intervals[index].power || 0;
      } else if (field === 'duration' || field === 'restDuration') {
        numericValue = updatedTemplate.intervals[index][field] || 0;
      } else {
        // Pour tout autre champ, conserver la valeur existante
        return;
      }
    }
    
    // Appliquer des limites spécifiques selon le champ
    if (field === 'power') {
      // Limiter la puissance entre 50% et 150% de la FTP
      const ftp = userProfile?.ftp || 200;
      const validatedFtp = FTPService.validateFTP(ftp, userProfile);
      const minPower = Math.round(validatedFtp * 0.5);
      const maxPower = Math.round(validatedFtp * 1.5);
      
      if (numericValue < minPower) {
        console.warn(`Puissance trop basse (${numericValue}W), limitée à ${minPower}W`);
        notify.info(`Puissance ajustée au minimum (${minPower}W)`);
        numericValue = minPower;
      } else if (numericValue > maxPower) {
        console.warn(`Puissance trop élevée (${numericValue}W), limitée à ${maxPower}W`);
        notify.info(`Puissance ajustée au maximum (${maxPower}W)`);
        numericValue = maxPower;
      }
      
      // Mettre à jour l'intensité correspondante
      updatedTemplate.intervals[index].intensity = parseFloat((numericValue / validatedFtp).toFixed(2));
    } else if (field === 'duration' || field === 'restDuration') {
      // Limiter la durée entre 5 et 600 secondes (10 minutes)
      if (numericValue < 5) {
        console.warn(`Durée trop courte (${numericValue}s), limitée à 5s`);
        notify.info(`Durée ajustée au minimum (5s)`);
        numericValue = 5;
      } else if (numericValue > 600) {
        console.warn(`Durée trop longue (${numericValue}s), limitée à 600s`);
        notify.info(`Durée ajustée au maximum (10 minutes)`);
        numericValue = 600;
      }
    }
    
    // Mettre à jour l'intervalle
    updatedTemplate.intervals[index][field] = numericValue;
    
    // Mettre à jour la durée totale de l'entraînement
    updatedTemplate.duration = calculateWorkoutDuration(updatedTemplate.intervals);
    
    // Mettre à jour le state
    setCustomizedTemplate(updatedTemplate);
  };

  /**
   * Calculate total workout duration in minutes
   */
  const calculateWorkoutDuration = (intervals) => {
    if (!intervals || !Array.isArray(intervals)) {
      console.error('Intervalles invalides pour le calcul de durée', { intervals });
      notify.error('Erreur lors du calcul de la durée');
      return 0;
    }
    
    try {
      // Calculer la durée totale en secondes
      const totalSeconds = intervals.reduce((total, interval) => {
        // Vérification des valeurs pour éviter NaN
        const workDuration = typeof interval.duration === 'number' ? interval.duration : 0;
        const restDuration = typeof interval.restDuration === 'number' ? interval.restDuration : 0;
        
        return total + workDuration + restDuration;
      }, 0);
      
      // Ajouter 5 minutes pour l'échauffement et la récupération
      const warmupCooldownSeconds = 5 * 60;
      const totalWorkoutSeconds = totalSeconds + warmupCooldownSeconds;
      
      // Convertir en minutes et arrondir
      return Math.ceil(totalWorkoutSeconds / 60);
    } catch (error) {
      console.error('Erreur lors du calcul de la durée de l\'entraînement', error);
      notify.error('Erreur lors du calcul de la durée', error);
      return 0;
    }
  };

  /**
   * Handle saving the workout
   */
  const handleSaveWorkout = () => {
    try {
      if (!customizedTemplate) {
        throw new Error('Aucun template n\'est sélectionné');
      }
      
      const zoneMap = {
        0.6: 1, // zone 1 - récupération
        0.75: 2, // zone 2 - endurance
        0.85: 3, // zone 3 - tempo
        0.95: 4, // zone 4 - seuil
        1.05: 5, // zone 5 - VO2max
        1.2: 6,  // zone 6 - anaérobie
        1.5: 7   // zone 7 - neuromuscular
      };
      
      // Déterminer la zone cible principale en fonction des intervalles
      let totalIntensity = 0;
      let totalDuration = 0;
      
      customizedTemplate.intervals.forEach(interval => {
        if (interval.type === 'work' || !interval.type) {
          const intensityValue = interval.intensity || interval.power / (userProfile?.ftp || 200);
          const duration = interval.duration || 0;
          
          totalIntensity += intensityValue * duration;
          totalDuration += duration;
        }
      });
      
      const avgIntensity = totalIntensity / (totalDuration || 1);
      
      // Déterminer la zone cible
      let targetZone = 3; // Default to zone 3
      for (const [intensity, zone] of Object.entries(zoneMap)) {
        if (avgIntensity <= parseFloat(intensity)) {
          targetZone = zone;
          break;
        }
      }
      
      const workout = {
        ...customizedTemplate,
        targetZone,
        date: new Date().toISOString(),
        userId: userProfile?.id
      };
      
      // Appeler la fonction de sauvegarde parentale
      const savedWorkout = onSaveWorkout(workout);
      
      if (savedWorkout) {
        notify.success('L\'entraînement a été enregistré avec succès', {
          title: 'Sauvegarde réussie'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'entraînement', error);
      notify.error('Impossible de sauvegarder l\'entraînement', error);
    }
  };

  /**
   * Render interval visualization
   */
  const renderIntervalVisualization = (intervals) => {
    try {
      if (!intervals || !Array.isArray(intervals) || intervals.length === 0) {
        return <div className="visualization-error">Intervalles non disponibles</div>;
      }
      
      // Préparer les données pour le graphique
      const chartData = intervals.map((interval, index) => ({
        name: `${index + 1}`,
        power: interval.power || 0,
        type: interval.type || 'work'
      }));
      
      // Déterminer la couleur en fonction du type d'intervalle
      const getBarColor = (entry) => {
        return entry.type === 'work' ? '#ff4757' : 
              (entry.type === 'rest' ? '#2ed573' : 
              (entry.setRest ? '#1e90ff' : '#ffa502'));
      };
      
      return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/hiittemplates"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
        <div className="interval-visualization">
          <h4>{t('powerProfile', 'Profil de puissance')}</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 'dataMax + 20']} />
              <Tooltip 
                formatter={(value) => [`${value}W`, 'Puissance']}
                labelFormatter={(value) => `Intervalle ${value}`}
              />
              <Bar 
                dataKey="power" 
                name="Puissance"
                fill="#8884d8" 
                stroke="#8884d8"
                fillOpacity={0.8}
                barSize={20}
                isAnimationActive={false}
                data={chartData}
              >
                {
                  chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                  ))
                }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    } catch (error) {
      console.error('Erreur lors de la génération de la visualisation:', error);
      return <div className="visualization-error">Erreur d'affichage: {error.message}</div>;
    }
  };
  
  // Affichage des erreurs
  if (error) {
    return (
      <div className="hiit-templates-error">
        <div className="alert alert-danger">
          <h4>Erreur :</h4>
          <p>{error}</p>
          <button 
            className="btn btn-primary mt-3"
            onClick={() => setError(null)}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (loading) {
    return <div className="hiit-templates-loading">{t('loadingTemplates', 'Chargement des templates...')}</div>;
  }
  
  return (
    <div className="hiit-templates">
      <div className="templates-list">
        <h3>{t('availableTemplates', 'Templates disponibles')}</h3>
        <div className="templates-grid">
          {templates.map(template => (
            <div 
              key={template.id}
              className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
              onClick={() => handleSelectTemplate(template)}
            >
              <h4>{template.name}</h4>
              <div className="template-difficulty">
                {Array(template.difficulty).fill().map((_, i) => (
                  <span key={i} className="difficulty-star">★</span>
                ))}
                {Array(3 - template.difficulty).fill().map((_, i) => (
                  <span key={i} className="difficulty-star empty">☆</span>
                ))}
              </div>
              <div className="template-duration">{template.duration} {t('min', 'min')}</div>
              <div className="template-description">{template.description}</div>
            </div>
          ))}
        </div>
      </div>
      
      {customizedTemplate && (
        <div className="template-customization">
          <h3>{t('customizeWorkout', 'Personnaliser l\'entraînement')}</h3>
          
          {renderIntervalVisualization(customizedTemplate.intervals)}
          
          <div className="intervals-table">
            <h4>{t('intervals', 'Intervalles')}</h4>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('power', 'Puissance')}</th>
                  <th>{t('duration', 'Durée')}</th>
                  <th>{t('rest', 'Récupération')}</th>
                </tr>
              </thead>
              <tbody>
                {customizedTemplate.intervals.map((interval, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <input 
                        type="number" 
                        value={interval.power}
                        onChange={(e) => handleAdjustInterval(index, 'power', e.target.value)}
                        min={Math.round(userProfile?.ftp * 0.5) || 100}
                        max={Math.round(userProfile?.ftp * 1.5) || 400}
                      />
                      <span>W</span>
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={interval.duration}
                        onChange={(e) => handleAdjustInterval(index, 'duration', e.target.value)}
                        min={10}
                        max={600}
                      />
                      <span>{t('sec', 'sec')}</span>
                    </td>
                    <td>
                      <input 
                        type="number" 
                        value={interval.restDuration || 0}
                        onChange={(e) => handleAdjustInterval(index, 'restDuration', e.target.value)}
                        min={0}
                        max={600}
                      />
                      <span>{t('sec', 'sec')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="template-actions">
            <button 
              className="template-save-button"
              onClick={handleSaveWorkout}
            >
              {t('saveWorkout', 'Enregistrer')}
            </button>
            <button 
              className="template-reset-button"
              onClick={() => setCustomizedTemplate({...selectedTemplate})}
            >
              {t('resetChanges', 'Réinitialiser')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

HIITTemplates.propTypes = {
  userProfile: PropTypes.shape({
    id: PropTypes.string,
    level: PropTypes.string,
    ftp: PropTypes.number
  }),
  onSaveWorkout: PropTypes.func.isRequired
};

export default HIITTemplates;
