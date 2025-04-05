import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format, addDays } from 'date-fns';

/**
 * Hook personnalisé pour gérer la logique de création et de manipulation des plans d'entraînement
 * 
 * @returns {Object} Fonctions et données relatives aux plans d'entraînement
 */
export const useTrainingPlan = () => {
  const { t } = useTranslation();
  const [customPlan, setCustomPlan] = useState(null);

  /**
   * Configurations de périodisation selon l'objectif
   */
  const periodization = useMemo(() => ({
    general: {
      buildup: 0.30, // 30% du temps en construction
      peak: 0.55,    // 55% du temps en pic/développement
      taper: 0.15    // 15% du temps en affûtage
    },
    performance: {
      buildup: 0.25, // 25% du temps en construction
      peak: 0.65,    // 65% du temps en pic/développement
      taper: 0.10    // 10% du temps en affûtage
    },
    endurance: {
      buildup: 0.40, // 40% du temps en construction
      peak: 0.45,    // 45% du temps en pic/développement
      taper: 0.15    // 15% du temps en affûtage
    }
  }), []);

  /**
   * Calcule le TSS (Training Stress Score) hebdomadaire
   * 
   * @param {Array} schedule - Programme d'entraînement de la semaine
   * @param {Object} zones - Zones d'entraînement
   * @param {Object} weekConfig - Configuration de la semaine (phase, type)
   * @returns {number} TSS calculé pour la semaine
   */
  const calculateWeeklyTSS = useCallback((schedule, zones, weekConfig) => {
    let baseTSS = 0;
    
    // Calculer le TSS de base pour chaque jour
    schedule.forEach(day => {
      if (day.workout.includes(t('training.workouts.rest'))) {
        // Jour de repos
        baseTSS += 0;
      } else if (day.workout.includes(t('training.workouts.intervals'))) {
        // Intervalles - TSS élevé
        baseTSS += 100;
      } else if (day.workout.includes(t('training.workouts.power'))) {
        // Développement de puissance - TSS moyen-élevé
        baseTSS += 90;
      } else if (day.workout.includes(t('training.workouts.long_ride'))) {
        // Sortie longue - TSS variable selon la durée
        const durationMatch = day.workout.match(/(\d+)h/);
        const duration = durationMatch ? parseInt(durationMatch[1]) : 3;
        baseTSS += 70 * duration;
      } else {
        // Endurance - TSS modéré
        const durationMatch = day.workout.match(/(\d+)h/);
        const duration = durationMatch ? parseInt(durationMatch[1]) : 1;
        baseTSS += 60 * duration;
      }
    });
    
    // Ajuster le TSS en fonction de la phase et du type de semaine
    let adjustedTSS = baseTSS;
    
    if (weekConfig.type === 'recovery') {
      adjustedTSS *= 0.7; // Semaine de récupération: 70% du TSS normal
    } else if (weekConfig.type === 'intensive') {
      adjustedTSS *= 1.2; // Semaine intensive: 120% du TSS normal
    } else if (weekConfig.type === 'taper') {
      adjustedTSS *= 0.5; // Affûtage: 50% du TSS normal
    }
    
    return Math.round(adjustedTSS);
  }, [t]);

  /**
   * Génère un plan d'entraînement personnalisé
   * 
   * @param {Object} config - Configuration du plan
   * @param {string} config.goal - Objectif du plan
   * @param {string} config.experience - Niveau d'expérience
   * @param {number} config.weeklyHours - Heures d'entraînement par semaine
   * @param {number} config.planDuration - Durée du plan en semaines
   * @param {string} config.startDate - Date de début du plan
   * @param {Object} config.zones - Zones d'entraînement
   * @returns {Object} Plan d'entraînement généré
   */
  const generatePlan = useCallback(({ goal, experience, weeklyHours, planDuration, startDate, zones }) => {
    // Jours de la semaine
    const daysOfWeek = [
      t('common.monday'), t('common.tuesday'), t('common.wednesday'), 
      t('common.thursday'), t('common.friday'), t('common.saturday'), 
      t('common.sunday')
    ];
    
    // Structure de base pour la semaine
    const weeklyStructure = [];
    
    // Répartir les séances selon le niveau et l'objectif
    for (let i = 0; i < 7; i++) {
      let workout = '';
      
      // Déterminer le type de séance selon le jour et l'objectif
      if (i === 0) { // Lundi - Récupération
        workout = `${t('training.workouts.rest')}`;
      } else if (i === 2 && goal !== 'endurance') { // Mercredi - Intervalles
        const intervalType = goal === 'performance' ? 'Z5' : 'Z4';
        const intervalCount = goal === 'performance' ? 5 : 2;
        const intervalDuration = goal === 'performance' ? '3min' : '15min';
        
        workout = `${t('training.workouts.intervals')} - ${intervalCount}x${intervalDuration} ${intervalType}`;
      } else if (i === 4 && goal === 'performance') { // Vendredi - Développement de puissance
        workout = `${t('training.workouts.power')} - 30min, Z4-Z5`;
      } else if (i === 5) { // Samedi - Sortie longue
        const duration = Math.round(weeklyHours * 0.4); // 40% du volume hebdomadaire
        workout = `${t('training.workouts.long_ride')} - ${duration}h, Z2`;
      } else {
        // Jours d'endurance
        const duration = Math.max(1, Math.round(weeklyHours * 0.15)); // 15% du volume hebdomadaire
        workout = `${t('training.workouts.endurance')} - ${duration}h, Z2`;
      }
      
      weeklyStructure.push({
        day: daysOfWeek[i],
        workout
      });
    }
    
    // Créer la structure complète du plan
    const weeks = [];
    for (let week = 1; week <= planDuration; week++) {
      // Déterminer la phase actuelle (build-up, peak, taper)
      let phase, type;
      const progress = week / planDuration;
      
      if (progress <= periodization[goal].buildup) {
        phase = 'buildup';
        // Alterner semaines normales et semaines de récupération (1 sur 4)
        type = week % 4 === 0 ? 'recovery' : 'normal';
      } else if (progress <= periodization[goal].buildup + periodization[goal].peak) {
        phase = 'peak';
        // Alterner semaines intensives et semaines de récupération (1 sur 3)
        type = week % 3 === 0 ? 'recovery' : (week % 3 === 1 ? 'intensive' : 'normal');
      } else {
        phase = 'taper';
        type = 'taper';
      }
      
      // Calculer le TSS (Training Stress Score) pour cette semaine
      const tss = calculateWeeklyTSS(weeklyStructure, zones, { phase, type });
      
      // Ajouter la semaine au plan
      weeks.push({
        week,
        phase,
        type,
        tss,
        schedule: [...weeklyStructure] // Copie pour éviter les références
      });
    }
    
    // Créer le plan personnalisé
    const newPlan = {
      name: `${t(`training.goals.${goal}`)} ${t('training.plan')} - ${t(`training.levels.${experience}`)}`,
      goal,
      level: experience,
      weeklyHours,
      duration: planDuration,
      startDate,
      weeks
    };
    
    setCustomPlan(newPlan);
    return newPlan;
  }, [t, calculateWeeklyTSS, periodization]);

  /**
   * Exporte le plan au format JSON
   */
  const exportPlan = useCallback(() => {
    if (!customPlan) return null;
    
    try {
      const fileName = `training_plan_${customPlan.goal}_${customPlan.level}.json`;
      const json = JSON.stringify(customPlan, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      
      // Créer un lien de téléchargement
      const link = document.createElement('a');
      link.href = href;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Nettoyer
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      
      return true;
    } catch (error) {
      console.error('Error exporting plan:', error);
      return false;
    }
  }, [customPlan]);

  /**
   * Convertit le plan en événements de calendrier
   * 
   * @returns {Array|null} Événements du calendrier ou null en cas d'échec
   */
  const convertPlanToCalendarEvents = useCallback(() => {
    if (!customPlan || !customPlan.weeks || !customPlan.startDate) {
      return null;
    }
    
    const events = [];
    const startDateObj = new Date(customPlan.startDate);
    
    // Pour chaque semaine du plan
    customPlan.weeks.forEach((week, weekIndex) => {
      // Pour chaque jour de la semaine
      week.schedule.forEach((day, dayIndex) => {
        // Calculer la date de l'événement
        const eventDate = addDays(startDateObj, weekIndex * 7 + dayIndex);
        
        // Déterminer le type d'événement en fonction du workout
        let eventType = 'Endurance';
        if (day.workout.includes(t('training.workouts.intervals'))) {
          eventType = 'Intervals';
        } else if (day.workout.includes(t('training.workouts.power'))) {
          eventType = 'Power';
        } else if (day.workout.includes(t('training.workouts.long_ride'))) {
          eventType = 'LongRide';
        } else if (day.workout.includes(t('training.workouts.rest'))) {
          eventType = 'Rest';
        }
        
        // Créer l'événement
        const event = {
          id: `training-${weekIndex}-${dayIndex}`,
          title: `${t('training.workout')}: ${day.workout}`,
          type: eventType,
          date: format(eventDate, 'yyyy-MM-dd') + 'T09:00:00Z', // Heure par défaut: 9h00
          description: `${t('training.week')} ${week.week}, ${t(`training.phases.${week.phase}`)}`,
          category: 'training',
          tss: Math.round(week.tss / 7), // TSS quotidien approximatif
        };
        
        events.push(event);
      });
    });
    
    // Stocker les événements dans le localStorage pour être récupérés par le calendrier
    localStorage.setItem('trainingPlanEvents', JSON.stringify(events));
    return events;
  }, [customPlan, t]);

  return {
    customPlan,
    setCustomPlan,
    generatePlan,
    exportPlan,
    convertPlanToCalendarEvents
  };
};

export default useTrainingPlan;
