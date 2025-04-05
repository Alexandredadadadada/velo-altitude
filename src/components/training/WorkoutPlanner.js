import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

/**
 * WorkoutPlanner component for scheduling and planning cycling workouts
 */
const WorkoutPlanner = ({ userProfile, workouts, onSaveWorkout }) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [plannedWorkouts, setPlannedWorkouts] = useState([]);
  const [workoutTemplates, setWorkoutTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isAddingWorkout, setIsAddingWorkout] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load workout templates and planned workouts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Mock delay for API call simulation
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Generate templates based on user profile
        const mockTemplates = generateWorkoutTemplates(userProfile);
        setWorkoutTemplates(mockTemplates);
        
        // Generate mock planned workouts
        const mockPlannedWorkouts = generateMockPlannedWorkouts();
        setPlannedWorkouts(mockPlannedWorkouts);
        
        if (mockTemplates.length > 0) {
          setSelectedTemplate(mockTemplates[0]);
        }
      } catch (error) {
        console.error('Error loading workout plans:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [userProfile]);
  
  /**
   * Generate workout templates based on user profile
   */
  const generateWorkoutTemplates = (profile) => {
    if (!profile) return [];
    
    const { level, ftp, preferences } = profile;
    const focusAreas = preferences?.focusAreas || ['endurance'];
    
    const templates = [
      {
        id: 'recovery-ride',
        name: t('recoveryRide'),
        type: 'recovery',
        description: t('recoveryRideDesc'),
        duration: 30,
        intensity: 'low',
        metrics: {
          targetPower: Math.round(ftp * 0.6),
          targetHr: level === 'beginner' ? 120 : 130
        }
      },
      {
        id: 'endurance-ride',
        name: t('enduranceRide'),
        type: 'endurance',
        description: t('enduranceRideDesc'),
        duration: 90,
        intensity: 'medium-low',
        metrics: {
          targetPower: Math.round(ftp * 0.75),
          targetHr: level === 'beginner' ? 130 : 140
        }
      },
      {
        id: 'tempo-ride',
        name: t('tempoRide'),
        type: 'endurance',
        description: t('tempoRideDesc'),
        duration: 60,
        intensity: 'medium',
        metrics: {
          targetPower: Math.round(ftp * 0.85),
          targetHr: level === 'beginner' ? 140 : 150
        }
      },
      {
        id: 'sweet-spot',
        name: t('sweetSpot'),
        type: 'hiit',
        description: t('sweetSpotDesc'),
        duration: 75,
        intensity: 'medium-high',
        metrics: {
          targetPower: Math.round(ftp * 0.9),
          targetHr: level === 'beginner' ? 150 : 160
        }
      },
      {
        id: 'threshold',
        name: t('threshold'),
        type: 'hiit',
        description: t('thresholdDesc'),
        duration: 60,
        intensity: 'high',
        metrics: {
          targetPower: Math.round(ftp * 0.95),
          targetHr: level === 'beginner' ? 160 : 170
        }
      },
      {
        id: 'vo2max',
        name: t('vo2max'),
        type: 'hiit',
        description: t('vo2maxDesc'),
        duration: 45,
        intensity: 'very-high',
        metrics: {
          targetPower: Math.round(ftp * 1.1),
          targetHr: level === 'beginner' ? 170 : 180
        }
      }
    ];
    
    // Add specific focus area workouts
    if (focusAreas.includes('climbing')) {
      templates.push({
        id: 'climbing',
        name: t('climbingWorkout'),
        type: 'hiit',
        description: t('climbingWorkoutDesc'),
        duration: 60,
        intensity: 'high',
        metrics: {
          targetPower: Math.round(ftp * 0.93),
          targetHr: level === 'beginner' ? 160 : 170
        }
      });
    }
    
    if (focusAreas.includes('sprinting')) {
      templates.push({
        id: 'sprint',
        name: t('sprintWorkout'),
        type: 'hiit',
        description: t('sprintWorkoutDesc'),
        duration: 45,
        intensity: 'very-high',
        metrics: {
          targetPower: Math.round(ftp * 1.3),
          targetHr: level === 'beginner' ? 170 : 180
        }
      });
    }
    
    return templates;
  };
  
  /**
   * Generate mock planned workouts
   */
  const generateMockPlannedWorkouts = () => {
    const today = new Date();
    const mockPlanned = [];
    
    // Add a few planned workouts in the future
    for (let i = 1; i <= 10; i++) {
      // Skip some days to make it look realistic
      if (i % 3 === 0) continue;
      
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + i);
      
      mockPlanned.push({
        id: `planned-${i}`,
        date: futureDate.toISOString().split('T')[0],
        templateId: i % 5 === 0 ? 'recovery-ride' : 
                  i % 4 === 0 ? 'threshold' : 
                  i % 3 === 0 ? 'endurance-ride' : 
                  i % 2 === 0 ? 'sweet-spot' : 'tempo-ride',
        name: i % 5 === 0 ? t('recoveryRide') : 
              i % 4 === 0 ? t('threshold') : 
              i % 3 === 0 ? t('enduranceRide') : 
              i % 2 === 0 ? t('sweetSpot') : t('tempoRide'),
        type: i % 4 === 0 || i % 2 === 0 ? 'hiit' : 'endurance',
        duration: i % 5 === 0 ? 30 : 
                 i % 3 === 0 ? 90 : 60,
        notes: ''
      });
    }
    
    return mockPlanned;
  };
  
  /**
   * Handle date selection from calendar
   */
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setIsAddingWorkout(false);
  };
  
  /**
   * Handle template selection
   */
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };
  
  /**
   * Start adding a new workout
   */
  const handleAddWorkout = () => {
    setIsAddingWorkout(true);
  };
  
  /**
   * Save a planned workout for the selected date
   */
  const handleSavePlannedWorkout = () => {
    if (!selectedTemplate) return;
    
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    const newPlannedWorkout = {
      id: `planned-${Date.now()}`,
      date: dateStr,
      templateId: selectedTemplate.id,
      name: selectedTemplate.name,
      type: selectedTemplate.type,
      duration: selectedTemplate.duration,
      notes: document.getElementById('workout-notes').value || ''
    };
    
    setPlannedWorkouts([...plannedWorkouts, newPlannedWorkout]);
    setIsAddingWorkout(false);
  };
  
  /**
   * Remove a planned workout
   */
  const handleRemoveWorkout = (workoutId) => {
    setPlannedWorkouts(plannedWorkouts.filter(w => w.id !== workoutId));
  };
  
  /**
   * Start a workout now (convert planned to actual)
   */
  const handleStartWorkout = (workout) => {
    const template = workoutTemplates.find(t => t.id === workout.templateId);
    
    if (!template) return;
    
    // Create an actual workout from the planned one
    const actualWorkout = {
      type: workout.type,
      templateId: workout.templateId,
      name: workout.name,
      duration: workout.duration,
      tss: Math.round(workout.duration * (template.metrics?.targetPower / (userProfile?.ftp || 200)) * 100 / 60),
      metrics: {
        averagePower: template.metrics?.targetPower || 200,
        normalizedPower: Math.round((template.metrics?.targetPower || 200) * 1.05),
        averageHr: template.metrics?.targetHr || 150,
        maxHr: Math.round((template.metrics?.targetHr || 150) * 1.1),
        calories: Math.round(workout.duration * 10),
        elevation: 0
      },
      intervals: []
    };
    
    // Add intervals if it's a HIIT workout
    if (workout.type === 'hiit') {
      actualWorkout.intervals = [
        { power: Math.round(template.metrics?.targetPower * 1.1), duration: 180, rest: 120 },
        { power: Math.round(template.metrics?.targetPower * 1.15), duration: 180, rest: 120 },
        { power: Math.round(template.metrics?.targetPower * 1.2), duration: 180, rest: 120 }
      ];
    }
    
    onSaveWorkout(actualWorkout);
    
    // Remove from planned workouts
    handleRemoveWorkout(workout.id);
    
    alert(t('workoutStarted'));
  };
  
  /**
   * Get workouts for the selected date
   */
  const getWorkoutsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return plannedWorkouts.filter(w => w.date === dateStr);
  };
  
  /**
   * Render calendar tile contents
   */
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const dateWorkouts = getWorkoutsForDate(date);
    
    if (dateWorkouts.length === 0) return null;
    
    return (
      <div className="workout-date-indicator">
        {dateWorkouts.map((workout, index) => (
          <div 
            key={index} 
            className={`workout-indicator ${workout.type}`}
            title={workout.name}
          />
        ))}
      </div>
    );
  };
  
  /**
   * Get class for intensity level
   */
  const getIntensityClass = (intensity) => {
    switch (intensity) {
      case 'low': return 'intensity-low';
      case 'medium-low': return 'intensity-medium-low';
      case 'medium': return 'intensity-medium';
      case 'medium-high': return 'intensity-medium-high';
      case 'high': return 'intensity-high';
      case 'very-high': return 'intensity-very-high';
      default: return 'intensity-medium';
    }
  };
  
  // Loading state
  if (loading) {
    return <div className="workout-planner-loading">{t('loadingWorkoutPlanner')}</div>;
  }
  
  // Selected date in ISO format for comparison
  const selectedDateStr = selectedDate.toISOString().split('T')[0];
  
  // Workouts for the selected date
  const dateWorkouts = plannedWorkouts.filter(w => w.date === selectedDateStr);
  
  return (
    <div className="workout-planner">
      <div className="planner-main">
        <div className="planner-calendar">
          <Calendar
            onChange={handleDateChange}
            value={selectedDate}
            tileContent={tileContent}
            minDate={new Date()}
          />
        </div>
        
        <div className="planner-details">
          <h3>{t('selectedDate')}: {selectedDateStr}</h3>
          
          {dateWorkouts.length === 0 ? (
            <div className="no-workouts">
              <p>{t('noWorkoutsPlanned')}</p>
              <button 
                className="add-workout-button"
                onClick={handleAddWorkout}
              >
                <i className="fas fa-plus"></i> {t('addWorkout')}
              </button>
            </div>
          ) : (
            <div className="date-workouts">
              <h4>{t('plannedWorkouts')}</h4>
              {dateWorkouts.map((workout, index) => (
                <div key={index} className="planned-workout-card">
                  <div className="workout-header">
                    <h5>{workout.name}</h5>
                    <div className="workout-actions">
                      <button 
                        className="start-workout-button"
                        onClick={() => handleStartWorkout(workout)}
                      >
                        <i className="fas fa-play"></i>
                      </button>
                      <button 
                        className="remove-workout-button"
                        onClick={() => handleRemoveWorkout(workout.id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  <div className="workout-type">{t(workout.type)}</div>
                  <div className="workout-duration">{workout.duration} {t('min')}</div>
                  {workout.notes && <div className="workout-notes">{workout.notes}</div>}
                </div>
              ))}
              
              <button 
                className="add-workout-button"
                onClick={handleAddWorkout}
              >
                <i className="fas fa-plus"></i> {t('addAnotherWorkout')}
              </button>
            </div>
          )}
          
          {isAddingWorkout && (
            <div className="add-workout-form">
              <h4>{t('addWorkoutTo')} {selectedDateStr}</h4>
              
              <div className="template-selector">
                <h5>{t('selectWorkoutTemplate')}</h5>
                <div className="templates-grid">
                  {workoutTemplates.map((template, index) => (
                    <div 
                      key={index}
                      className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''} ${template.type}`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <h5>{template.name}</h5>
                      <div className={`template-intensity ${getIntensityClass(template.intensity)}`}>
                        {t(template.intensity)}
                      </div>
                      <div className="template-duration">{template.duration} {t('min')}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="workout-notes-input">
                <label htmlFor="workout-notes">{t('workoutNotes')}:</label>
                <textarea 
                  id="workout-notes" 
                  rows="3" 
                  placeholder={t('enterNotesPlaceholder')}
                ></textarea>
              </div>
              
              <div className="form-actions">
                <button 
                  className="save-workout-button"
                  onClick={handleSavePlannedWorkout}
                  disabled={!selectedTemplate}
                >
                  {t('savePlannedWorkout')}
                </button>
                <button 
                  className="cancel-button"
                  onClick={() => setIsAddingWorkout(false)}
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="training-recommendations">
        <h3>{t('trainingRecommendations')}</h3>
        <div className="recommendation-cards">
          <div className="recommendation-card">
            <h4>{t('weeklyTraining')}</h4>
            <p>{t('weeklyTrainingRecommendation')}</p>
            <ul>
              <li>{t('hiitSessions')}: 2-3</li>
              <li>{t('enduranceSessions')}: 1-2</li>
              <li>{t('recoverySessions')}: 1</li>
              <li>{t('restDays')}: 2</li>
            </ul>
          </div>
          
          <div className="recommendation-card">
            <h4>{t('monthlyCycle')}</h4>
            <p>{t('monthlyCycleRecommendation')}</p>
            <ul>
              <li>{t('week1')}: {t('buildPhase')}</li>
              <li>{t('week2')}: {t('intensityPhase')}</li>
              <li>{t('week3')}: {t('peakPhase')}</li>
              <li>{t('week4')}: {t('recoveryPhase')}</li>
            </ul>
          </div>
          
          <div className="recommendation-card">
            <h4>{t('focusAreas')}</h4>
            <p>{t('basedOnProfile')}</p>
            <ul>
              {userProfile?.preferences?.focusAreas.map((area, index) => (
                <li key={index}>{t(area)}: {t(`${area}Recommendation`)}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

WorkoutPlanner.propTypes = {
  userProfile: PropTypes.object,
  workouts: PropTypes.array,
  onSaveWorkout: PropTypes.func.isRequired
};

export default WorkoutPlanner;
