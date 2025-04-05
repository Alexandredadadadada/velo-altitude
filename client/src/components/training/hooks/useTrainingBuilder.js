import { useState, useCallback, useMemo, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { format } from 'date-fns';
import { NotificationContext } from '../../../context/NotificationContext';

// Hooks personnalisés
import useTrainingPlan from './useTrainingPlan';
import useTrainingZones from './useTrainingZones';

/**
 * Hook personnalisé pour centraliser la logique du builder de plans d'entraînement
 * Optimisé avec useCallback et useMemo pour éviter les re-renders inutiles
 */
const useTrainingBuilder = () => {
  const { t } = useTranslation();
  const { notify } = useContext(NotificationContext);
  const history = useHistory();
  
  // États pour le formulaire
  const [goal, setGoal] = useState('general');
  const [experience, setExperience] = useState('intermediate');
  const [weeklyHours, setWeeklyHours] = useState(8);
  const [planDuration, setPlanDuration] = useState(12);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [validationErrors, setValidationErrors] = useState({});
  
  // Hooks personnalisés
  const zones = useTrainingZones(experience);
  const { 
    customPlan, 
    generatePlan, 
    exportPlan, 
    convertPlanToCalendarEvents 
  } = useTrainingPlan();
  
  /**
   * Valide le formulaire avant génération du plan
   */
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!weeklyHours || weeklyHours < 3 || weeklyHours > 20) {
      errors.weeklyHours = t('training.validation.weeklyHours');
    }
    
    if (!planDuration || planDuration < 4 || planDuration > 24) {
      errors.planDuration = t('training.validation.planDuration');
    }
    
    if (!startDate) {
      errors.startDate = t('training.validation.startDate');
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [weeklyHours, planDuration, startDate, t]);
  
  /**
   * Gère la mise à jour d'un champ du formulaire et efface les erreurs correspondantes
   */
  const handleFieldChange = useCallback((field, value) => {
    switch (field) {
      case 'goal':
        setGoal(value);
        break;
      case 'experience':
        setExperience(value);
        break;
      case 'weeklyHours':
        setWeeklyHours(value);
        break;
      case 'planDuration':
        setPlanDuration(value);
        break;
      case 'startDate':
        setStartDate(value);
        break;
      default:
        break;
    }
    
    // Efface l'erreur correspondante si elle existe
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [validationErrors]);
  
  /**
   * Gère la génération d'un nouveau plan d'entraînement
   */
  const handleGeneratePlan = useCallback(() => {
    if (!validateForm()) {
      return;
    }
    
    setFormSubmitted(true);
    
    const newPlan = generatePlan({
      goal,
      experience,
      weeklyHours,
      planDuration,
      startDate,
      zones
    });
    
    if (newPlan) {
      notify(t('training.planGenerated'), 'success');
    }
  }, [goal, experience, weeklyHours, planDuration, startDate, zones, generatePlan, notify, t, validateForm]);
  
  /**
   * Gère l'exportation du plan en format JSON
   */
  const handleExportPlan = useCallback(() => {
    const result = exportPlan();
    if (result) {
      notify(t('training.planExported'), 'success');
    } else {
      notify(t('common.error'), 'error');
    }
  }, [exportPlan, notify, t]);
  
  /**
   * Gère l'ajout du plan au calendrier
   */
  const handleAddToCalendar = useCallback(() => {
    const events = convertPlanToCalendarEvents();
    if (events) {
      notify(t('training.planAddedToCalendar'), 'success');
      history.push('/calendar');
    } else {
      notify(t('training.noPlanToExport'), 'error');
    }
  }, [convertPlanToCalendarEvents, history, notify, t]);
  
  /**
   * Réinitialise le formulaire
   */
  const resetForm = useCallback(() => {
    setGoal('general');
    setExperience('intermediate');
    setWeeklyHours(8);
    setPlanDuration(12);
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setFormSubmitted(false);
    setValidationErrors({});
  }, []);
  
  /**
   * Détermine si un plan a été créé en utilisant useMemo pour éviter les recalculs inutiles
   */
  const hasPlan = useMemo(() => customPlan !== null, [customPlan]);
  
  return {
    // État du formulaire
    goal,
    experience,
    weeklyHours,
    planDuration,
    startDate,
    formSubmitted,
    validationErrors,
    customPlan,
    zones,
    hasPlan,
    
    // Gestionnaires d'événements
    handleFieldChange,
    handleGeneratePlan,
    handleExportPlan,
    handleAddToCalendar,
    resetForm
  };
};

export default useTrainingBuilder;
