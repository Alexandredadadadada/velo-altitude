import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import HIITTemplates from './HIITTemplates';
import PerformanceTracker from './PerformanceTracker';
import WorkoutPlanner from './WorkoutPlanner';
import './TrainingModule.css';

/**
 * TrainingModule component provides cycling training functionalities including HIIT templates
 * and performance tracking visualizations
 */
const TrainingModule = ({ userId, initialView = 'templates' }) => {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState(initialView);
  const [userProfile, setUserProfile] = useState(null);
  const [userWorkouts, setUserWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load user profile and workout data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Mock data - would be replaced with actual API calls
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock user profile
        const mockProfile = {
          id: userId || 'user-1',
          name: 'Jean Cycliste',
          level: 'intermediate', // beginner, intermediate, advanced, elite
          ftp: 260, // Functional Threshold Power
          maxHr: 185, // Max heart rate
          restingHr: 52, // Resting heart rate
          weight: 72, // kg
          preferences: {
            workoutDuration: 60, // preferred workout duration in minutes
            focusAreas: ['endurance', 'climbing'], // focus areas for training
            outdoorRiding: true // preference for indoor vs outdoor
          }
        };
        
        // Mock workout history
        const mockWorkouts = [
          {
            id: 'workout-1',
            date: '2025-03-28',
            type: 'hiit',
            templateId: 'hiit-1',
            duration: 45, // minutes
            tss: 65, // Training Stress Score
            metrics: {
              averagePower: 230,
              normalizedPower: 245,
              averageHr: 152,
              maxHr: 178,
              calories: 540,
              elevation: 320
            },
            intervals: [
              { power: 240, duration: 180, rest: 120 },
              { power: 250, duration: 180, rest: 120 },
              { power: 255, duration: 180, rest: 120 },
              { power: 260, duration: 180, rest: 120 },
              { power: 265, duration: 180, rest: 120 }
            ]
          },
          {
            id: 'workout-2',
            date: '2025-03-30',
            type: 'endurance',
            templateId: 'endurance-1',
            duration: 120,
            tss: 85,
            metrics: {
              averagePower: 195,
              normalizedPower: 210,
              averageHr: 142,
              maxHr: 158,
              calories: 1240,
              elevation: 850
            }
          },
          {
            id: 'workout-3',
            date: '2025-04-01',
            type: 'hiit',
            templateId: 'hiit-2',
            duration: 60,
            tss: 75,
            metrics: {
              averagePower: 235,
              normalizedPower: 255,
              averageHr: 155,
              maxHr: 182,
              calories: 680,
              elevation: 420
            },
            intervals: [
              { power: 250, duration: 60, rest: 60 },
              { power: 255, duration: 60, rest: 60 },
              { power: 260, duration: 60, rest: 60 },
              { power: 270, duration: 60, rest: 60 },
              { power: 275, duration: 60, rest: 60 },
              { power: 280, duration: 60, rest: 60 },
              { power: 285, duration: 60, rest: 60 },
              { power: 290, duration: 60, rest: 60 }
            ]
          }
        ];
        
        setUserProfile(mockProfile);
        setUserWorkouts(mockWorkouts);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId]);
  
  // Handle saving a new workout
  const handleSaveWorkout = (newWorkout) => {
    // In a real app, this would make an API call to save the workout
    const workoutWithId = {
      ...newWorkout,
      id: `workout-${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    
    setUserWorkouts(prevWorkouts => [...prevWorkouts, workoutWithId]);
    return workoutWithId;
  };
  
  // Handle updating user profile
  const handleUpdateProfile = (updatedProfile) => {
    // In a real app, this would make an API call to update the profile
    setUserProfile(prevProfile => ({
      ...prevProfile,
      ...updatedProfile
    }));
  };
  
  // Generate views for the training module
  const renderContent = () => {
    if (loading) {
      return <div className="training-module-loading">{t('loadingTrainingData')}</div>;
    }
    
    switch (activeView) {
      case 'templates':
        return (
          <HIITTemplates 
            userProfile={userProfile}
            onSaveWorkout={handleSaveWorkout}
          />
        );
      case 'performance':
        return (
          <PerformanceTracker 
            userProfile={userProfile}
            workouts={userWorkouts}
          />
        );
      case 'planner':
        return (
          <WorkoutPlanner 
            userProfile={userProfile}
            workouts={userWorkouts}
            onSaveWorkout={handleSaveWorkout}
          />
        );
      default:
        return <div>{t('selectTrainingView')}</div>;
    }
  };
  
  return (
    <div className="training-module">
      <div className="training-header">
        <h2>{t('trainingModule')}</h2>
        
        {userProfile && (
          <div className="user-profile-summary">
            <span className="user-name">{userProfile.name}</span>
            <span className="user-level">{t(userProfile.level)}</span>
            <span className="user-ftp">FTP: {userProfile.ftp}w</span>
          </div>
        )}
      </div>
      
      <div className="training-navigation">
        <button 
          className={`training-nav-button ${activeView === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveView('templates')}
        >
          <i className="fas fa-th-large"></i>
          {t('hiitTemplates')}
        </button>
        <button 
          className={`training-nav-button ${activeView === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveView('performance')}
        >
          <i className="fas fa-chart-line"></i>
          {t('performanceTracker')}
        </button>
        <button 
          className={`training-nav-button ${activeView === 'planner' ? 'active' : ''}`}
          onClick={() => setActiveView('planner')}
        >
          <i className="fas fa-calendar-alt"></i>
          {t('workoutPlanner')}
        </button>
      </div>
      
      <div className="training-content">
        {renderContent()}
      </div>
    </div>
  );
};

TrainingModule.propTypes = {
  userId: PropTypes.string,
  initialView: PropTypes.oneOf(['templates', 'performance', 'planner'])
};

export default TrainingModule;
