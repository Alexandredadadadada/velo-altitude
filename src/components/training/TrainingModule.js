import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import HIITTemplates from './HIITTemplates';
import PerformanceTracker from './PerformanceTracker';
import WorkoutPlanner from './WorkoutPlanner';
import FTPCalculator from './FTPCalculator';
import FTPHistory from './FTPHistory';
import TrainingZoneChart from './TrainingZoneChart';
import ZoneBasedWorkoutGenerator from './ZoneBasedWorkoutGenerator';
import { Container, Grid, Paper, Tabs, Tab, Box, Typography, Divider, Button, Alert, Snackbar } from '@mui/material';
import { 
  FitnessCenter, 
  Speed, 
  Timeline, 
  EventNote, 
  DirectionsBike,
  ShowChart,
  History,
  Straighten
} from '@mui/icons-material';
import AnimatedTransition from '../common/AnimatedTransition';
import ErrorBoundary from '../common/ErrorBoundary';
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
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [calculatedFTP, setCalculatedFTP] = useState(null);
  const [ftpHistory, setFtpHistory] = useState([]);
  
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
        
        // Mock FTP history
        const mockFtpHistory = [
          {
            ftp: 240,
            powerToWeight: 3.33,
            method: 'Test 20 minutes',
            testDate: '2024-12-15T10:00:00.000Z'
          },
          {
            ftp: 248,
            powerToWeight: 3.44,
            method: 'Test Ramp',
            testDate: '2025-01-20T10:00:00.000Z'
          },
          {
            ftp: 260,
            powerToWeight: 3.61,
            method: 'Test 8 minutes',
            testDate: '2025-03-01T10:00:00.000Z'
          }
        ];
        
        setUserProfile(mockProfile);
        setUserWorkouts(mockWorkouts);
        setFtpHistory(mockFtpHistory);
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
    showNotification('Séance d\'entraînement enregistrée avec succès', 'success');
    return workoutWithId;
  };
  
  // Handle updating user profile
  const handleUpdateProfile = (updatedProfile) => {
    // In a real app, this would make an API call to update the profile
    setUserProfile(prevProfile => ({
      ...prevProfile,
      ...updatedProfile
    }));
    
    showNotification('Profil mis à jour avec succès', 'success');
  };
  
  // Handle saving a new FTP value
  const handleSaveFTP = (ftpData) => {
    setCalculatedFTP(ftpData);
    
    // Add to FTP history
    const newFtpRecord = {
      ftp: ftpData.ftp,
      powerToWeight: ftpData.powerToWeight,
      method: ftpData.method,
      testDate: ftpData.testDate.toISOString()
    };
    
    setFtpHistory(prev => [...prev, newFtpRecord]);
    
    // Update user profile with new FTP value
    handleUpdateProfile({
      ftp: ftpData.ftp,
      ftpTestDate: ftpData.testDate,
      ftpTestMethod: ftpData.method
    });
    
    showNotification(`Nouveau FTP de ${ftpData.ftp}W enregistré avec succès`, 'success');
    
    // Optionally switch to history view
    setTimeout(() => setActiveView('ftp-history'), 1500);
  };
  
  // Handle removing an FTP record
  const handleDeleteFtpRecord = (index) => {
    setFtpHistory(prev => {
      const newHistory = [...prev];
      newHistory.splice(index, 1);
      return newHistory;
    });
    
    showNotification('Enregistrement FTP supprimé', 'info');
  };
  
  // Show notification message
  const showNotification = (message, severity = 'info') => {
    setNotification({ 
      open: true, 
      message, 
      severity 
    });
  };
  
  // Close notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  // Generate views for the training module
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
          <Typography variant="subtitle1">{t('loading')}</Typography>
        </Box>
      );
    }
    
    if (!userProfile) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="warning">{t('profileNotFound')}</Alert>
        </Box>
      );
    }
    
    switch(activeView) {
      case 'templates':
        return (
          <ErrorBoundary>
            <AnimatedTransition type="fade">
              <Container maxWidth="lg" sx={{ py: 3 }}>
                <HIITTemplates 
                  userProfile={userProfile}
                  onSaveWorkout={handleSaveWorkout}
                />
              </Container>
            </AnimatedTransition>
          </ErrorBoundary>
        );
      case 'performance':
        return (
          <ErrorBoundary>
            <AnimatedTransition type="fade">
              <Container maxWidth="lg" sx={{ py: 3 }}>
                <PerformanceTracker 
                  workouts={userWorkouts}
                  userProfile={userProfile}
                />
              </Container>
            </AnimatedTransition>
          </ErrorBoundary>
        );
      case 'planner':
        return (
          <ErrorBoundary>
            <AnimatedTransition type="fade">
              <Container maxWidth="lg" sx={{ py: 3 }}>
                <WorkoutPlanner
                  userProfile={userProfile}
                  onSaveWorkout={handleSaveWorkout}
                />
              </Container>
            </AnimatedTransition>
          </ErrorBoundary>
        );
      case 'zone-workouts':
        return (
          <ErrorBoundary>
            <AnimatedTransition type="fade">
              <Container maxWidth="lg" sx={{ py: 3 }}>
                <ZoneBasedWorkoutGenerator
                  userProfile={userProfile}
                  onSaveWorkout={handleSaveWorkout}
                />
              </Container>
            </AnimatedTransition>
          </ErrorBoundary>
        );
      case 'ftp':
        return (
          <ErrorBoundary>
            <AnimatedTransition type="fade">
              <Container maxWidth="lg" sx={{ py: 3 }}>
                <Grid container spacing={4}>
                  <Grid item xs={12}>
                    <FTPCalculator 
                      userProfile={userProfile}
                      onSaveFTP={handleSaveFTP}
                    />
                  </Grid>
                  
                  {calculatedFTP && (
                    <Grid item xs={12}>
                      <TrainingZoneChart 
                        zones={calculatedFTP.zones}
                        ftp={calculatedFTP.ftp}
                      />
                    </Grid>
                  )}
                </Grid>
              </Container>
            </AnimatedTransition>
          </ErrorBoundary>
        );
      case 'ftp-history':
        return (
          <ErrorBoundary>
            <AnimatedTransition type="fade">
              <Container maxWidth="lg" sx={{ py: 3 }}>
                <FTPHistory 
                  ftpHistory={ftpHistory}
                  onDeleteRecord={handleDeleteFtpRecord}
                />
              </Container>
            </AnimatedTransition>
          </ErrorBoundary>
        );
      default:
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">{t('selectTrainingView')}</Typography>
          </Box>
        );
    }
  };
  
  return (
    <Paper elevation={2} className="training-module">
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }} className="training-header">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FitnessCenter sx={{ mr: 1 }} />
            <Typography variant="h5" component="h2">
              {t('trainingModule')}
            </Typography>
          </Box>
          
          {userProfile && (
            <Box className="user-profile-summary">
              <Typography variant="subtitle1" component="span" sx={{ mr: 2 }}>
                {userProfile.name}
              </Typography>
              <Typography variant="body2" component="span" sx={{ mr: 2 }}>
                {t(userProfile.level)}
              </Typography>
              <Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>
                FTP: {userProfile.ftp}W
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
      
      <Tabs
        value={activeView}
        onChange={(e, newValue) => setActiveView(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        className="training-navigation"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab 
          value="templates" 
          label={t('hiitTemplates')} 
          icon={<DirectionsBike />} 
          iconPosition="start"
        />
        <Tab 
          value="performance" 
          label={t('performanceTracker')} 
          icon={<ShowChart />} 
          iconPosition="start"
        />
        <Tab 
          value="planner" 
          label={t('workoutPlanner')} 
          icon={<EventNote />} 
          iconPosition="start"
        />
        <Tab 
          value="zone-workouts" 
          label={t('seanceZones')} 
          icon={<Straighten />} 
          iconPosition="start"
        />
        <Tab 
          value="ftp" 
          label={t('ftpCalculator')} 
          icon={<Speed />} 
          iconPosition="start"
        />
        <Tab 
          value="ftp-history" 
          label={t('ftpHistory')} 
          icon={<History />} 
          iconPosition="start"
        />
      </Tabs>
      
      <Box className="training-content">
        {renderContent()}
      </Box>
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

TrainingModule.propTypes = {
  userId: PropTypes.string,
  initialView: PropTypes.oneOf(['templates', 'performance', 'planner', 'zone-workouts', 'ftp', 'ftp-history'])
};

export default TrainingModule;
