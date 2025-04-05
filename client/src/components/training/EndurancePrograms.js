import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Chip,
  CircularProgress,
  Paper,
  Alert,
  IconButton,
  Tooltip,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from '@mui/material';
import {
  DirectionsRun as RunIcon,
  Timer as TimerIcon,
  CalendarMonth as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  FitnessCenter as FitnessIcon,
  Terrain as TerrainIcon,
  Speed as SpeedIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { useNotification } from '../common/NotificationSystem';

/**
 * Composant de programmes d'entraînement d'endurance et fractionné
 * Permet de suivre et planifier des programmes d'entraînement sur plusieurs semaines
 */
const EndurancePrograms = ({ userProfile, onSaveProgram }) => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [userLevel, setUserLevel] = useState(userProfile?.level || 'intermediate');
  const [userGoal, setUserGoal] = useState('endurance');
  const [weeklyHours, setWeeklyHours] = useState(6);
  const [programLength, setProgramLength] = useState(8);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [userProgress, setUserProgress] = useState({});

  // Objectifs d'entraînement disponibles
  const trainingGoals = [
    { value: 'endurance', label: t('enduranceGoal'), icon: <RunIcon /> },
    { value: 'climbing', label: t('climbingGoal'), icon: <TerrainIcon /> },
    { value: 'speed', label: t('speedGoal'), icon: <SpeedIcon /> },
    { value: 'race', label: t('raceGoal'), icon: <CalendarIcon /> },
    { value: 'ftp', label: t('ftpGoal'), icon: <TrendingUpIcon /> }
  ];

  // Niveaux d'expérience
  const experienceLevels = [
    { value: 'beginner', label: t('beginner') },
    { value: 'intermediate', label: t('intermediate') },
    { value: 'advanced', label: t('advanced') },
    { value: 'elite', label: t('elite') }
  ];

  // Charger les programmes d'entraînement
  useEffect(() => {
    if (userProfile) {
      loadPrograms();
    }
  }, [userProfile]);

  // Charger les programmes d'entraînement
  const loadPrograms = () => {
    setLoading(true);
    
    // Simuler un délai d'API
    setTimeout(() => {
      const mockPrograms = [
        {
          id: 'endurance-base-8',
          name: t('enduranceBase'),
          description: t('enduranceBaseDesc'),
          goal: 'endurance',
          level: 'beginner',
          weeks: 8,
          hoursPerWeek: { min: 4, target: 6, max: 8 },
          structure: generateEnduranceBaseProgram(8, 6),
          metrics: {
            endurance: 80,
            strength: 40,
            speed: 20,
            technique: 30,
            recovery: 60
          }
        },
        {
          id: 'ftp-builder-12',
          name: t('ftpBuilder'),
          description: t('ftpBuilderDesc'),
          goal: 'ftp',
          level: 'intermediate',
          weeks: 12,
          hoursPerWeek: { min: 6, target: 8, max: 10 },
          structure: generateFTPBuilderProgram(12, 8),
          metrics: {
            endurance: 60,
            strength: 70,
            speed: 50,
            technique: 40,
            recovery: 40
          }
        },
        {
          id: 'climbing-specialist-10',
          name: t('climbingSpecialist'),
          description: t('climbingSpecialistDesc'),
          goal: 'climbing',
          level: 'intermediate',
          weeks: 10,
          hoursPerWeek: { min: 5, target: 7, max: 9 },
          structure: generateClimbingProgram(10, 7),
          metrics: {
            endurance: 70,
            strength: 80,
            speed: 30,
            technique: 60,
            recovery: 50
          }
        },
        {
          id: 'race-preparation-16',
          name: t('racePreparation'),
          description: t('racePreparationDesc'),
          goal: 'race',
          level: 'advanced',
          weeks: 16,
          hoursPerWeek: { min: 8, target: 10, max: 14 },
          structure: generateRaceProgram(16, 10),
          metrics: {
            endurance: 90,
            strength: 70,
            speed: 80,
            technique: 70,
            recovery: 60
          }
        },
        {
          id: 'criterium-speed-8',
          name: t('criteriumSpeed'),
          description: t('criteriumSpeedDesc'),
          goal: 'speed',
          level: 'advanced',
          weeks: 8,
          hoursPerWeek: { min: 6, target: 8, max: 10 },
          structure: generateSpeedProgram(8, 8),
          metrics: {
            endurance: 50,
            strength: 60,
            speed: 90,
            technique: 80,
            recovery: 40
          }
        }
      ];
      
      setPrograms(mockPrograms);
      
      // Simuler un programme en cours
      const mockProgress = {
        programId: 'endurance-base-8',
        currentWeek: 3,
        completedWorkouts: [
          { week: 1, day: 1, completed: true },
          { week: 1, day: 2, completed: true },
          { week: 1, day: 3, completed: true },
          { week: 1, day: 4, completed: true },
          { week: 2, day: 1, completed: true },
          { week: 2, day: 2, completed: true },
          { week: 2, day: 3, completed: true },
          { week: 2, day: 4, completed: false },
          { week: 3, day: 1, completed: true },
          { week: 3, day: 2, completed: false }
        ],
        metrics: {
          ftpStart: 250,
          ftpCurrent: 258,
          weeklyTSS: [320, 345, 210],
          weeklyHours: [5.5, 6.2, 3.8]
        }
      };
      
      setUserProgress(mockProgress);
      
      // Sélectionner le programme en cours ou le premier programme
      const currentProgram = mockPrograms.find(p => p.id === mockProgress.programId) || mockPrograms[0];
      setSelectedProgram(currentProgram);
      setCurrentWeek(mockProgress.currentWeek);
      
      setLoading(false);
    }, 800);
  };

  // Générer un programme d'endurance de base
  const generateEnduranceBaseProgram = (weeks, hoursPerWeek) => {
    const program = [];
    
    for (let week = 1; week <= weeks; week++) {
      const weekData = {
        week,
        theme: week <= 3 ? 'foundation' : (week <= 6 ? 'build' : 'consolidation'),
        days: []
      };
      
      // Jour 1: Endurance longue
      weekData.days.push({
        day: 1,
        type: 'endurance',
        title: t('longEndurance'),
        duration: 90 + (week > 4 ? 15 : 0) + (week > 6 ? 15 : 0),
        intensity: 'Z2',
        description: t('longEnduranceDesc'),
        tss: 80 + week * 2
      });
      
      // Jour 2: Récupération active ou repos
      if (week % 4 !== 0) { // Semaine normale
        weekData.days.push({
          day: 2,
          type: 'recovery',
          title: t('activeRecovery'),
          duration: 45,
          intensity: 'Z1',
          description: t('activeRecoveryDesc'),
          tss: 30
        });
      } else { // Semaine de récupération
        weekData.days.push({
          day: 2,
          type: 'rest',
          title: t('rest'),
          duration: 0,
          intensity: 'Rest',
          description: t('restDesc'),
          tss: 0
        });
      }
      
      // Jour 3: Tempo ou Sweet Spot
      weekData.days.push({
        day: 3,
        type: 'tempo',
        title: week <= 4 ? t('tempoRide') : t('sweetSpot'),
        duration: 60 + (week > 3 ? 15 : 0),
        intensity: week <= 4 ? 'Z3' : 'Z3-Z4',
        description: week <= 4 ? t('tempoRideDesc') : t('sweetSpotDesc'),
        tss: 65 + week * 3
      });
      
      // Jour 4: Endurance moyenne
      weekData.days.push({
        day: 4,
        type: 'endurance',
        title: t('moderateEndurance'),
        duration: 75 + (week > 5 ? 15 : 0),
        intensity: 'Z2',
        description: t('moderateEnduranceDesc'),
        tss: 70 + week * 1.5
      });
      
      program.push(weekData);
    }
    
    return program;
  };

  // Générer un programme de développement FTP
  const generateFTPBuilderProgram = (weeks, hoursPerWeek) => {
    const program = [];
    
    for (let week = 1; week <= weeks; week++) {
      const isRecoveryWeek = week % 4 === 0;
      const phase = week <= 4 ? 'base' : (week <= 8 ? 'build' : 'specialty');
      
      const weekData = {
        week,
        theme: isRecoveryWeek ? 'recovery' : phase,
        days: []
      };
      
      // Jour 1: Endurance longue avec intervalles
      weekData.days.push({
        day: 1,
        type: 'endurance',
        title: t('enduranceWithIntervals'),
        duration: 90 + (week > 4 ? 20 : 0) + (week > 8 ? 20 : 0),
        intensity: isRecoveryWeek ? 'Z2' : 'Z2-Z4',
        description: isRecoveryWeek ? t('enduranceRecoveryDesc') : t('enduranceIntervalsDesc'),
        tss: isRecoveryWeek ? 80 : (90 + week * 2)
      });
      
      // Jour 2: Récupération ou VO2max
      if (isRecoveryWeek) {
        weekData.days.push({
          day: 2,
          type: 'recovery',
          title: t('activeRecovery'),
          duration: 45,
          intensity: 'Z1',
          description: t('activeRecoveryDesc'),
          tss: 30
        });
      } else if (phase === 'specialty') {
        weekData.days.push({
          day: 2,
          type: 'vo2max',
          title: t('vo2maxIntervals'),
          duration: 75,
          intensity: 'Z5',
          description: t('vo2maxIntervalsDesc'),
          tss: 100 + (week - 8) * 5
        });
      } else {
        weekData.days.push({
          day: 2,
          type: 'threshold',
          title: t('thresholdIntervals'),
          duration: 60 + (week > 4 ? 15 : 0),
          intensity: 'Z4',
          description: t('thresholdIntervalsDesc'),
          tss: 80 + week * 3
        });
      }
      
      // Jour 3: Récupération active
      weekData.days.push({
        day: 3,
        type: 'recovery',
        title: t('activeRecovery'),
        duration: 45,
        intensity: 'Z1',
        description: t('activeRecoveryDesc'),
        tss: 30
      });
      
      // Jour 4: Sweet Spot ou Threshold
      weekData.days.push({
        day: 4,
        type: phase === 'base' ? 'sweetspot' : 'threshold',
        title: phase === 'base' ? t('sweetSpot') : t('thresholdWork'),
        duration: 75 + (week > 6 ? 15 : 0),
        intensity: phase === 'base' ? 'Z3-Z4' : 'Z4',
        description: phase === 'base' ? t('sweetSpotDesc') : t('thresholdWorkDesc'),
        tss: isRecoveryWeek ? 70 : (85 + week * 2.5)
      });
      
      // Jour 5: Endurance ou repos
      if (isRecoveryWeek) {
        weekData.days.push({
          day: 5,
          type: 'rest',
          title: t('rest'),
          duration: 0,
          intensity: 'Rest',
          description: t('restDesc'),
          tss: 0
        });
      } else {
        weekData.days.push({
          day: 5,
          type: 'endurance',
          title: t('enduranceRide'),
          duration: 60,
          intensity: 'Z2',
          description: t('enduranceRideDesc'),
          tss: 60
        });
      }
      
      program.push(weekData);
    }
    
    return program;
  };

  // Générer un programme d'escalade
  const generateClimbingProgram = (weeks, hoursPerWeek) => {
    const program = [];
    
    for (let week = 1; week <= weeks; week++) {
      const isRecoveryWeek = week % 4 === 0;
      const phase = week <= 3 ? 'strength' : (week <= 7 ? 'power' : 'specificity');
      
      const weekData = {
        week,
        theme: isRecoveryWeek ? 'recovery' : phase,
        days: []
      };
      
      // Jour 1: Endurance avec montées
      weekData.days.push({
        day: 1,
        type: 'climbing',
        title: t('enduranceClimbing'),
        duration: 90 + (week > 3 ? 15 : 0) + (week > 6 ? 15 : 0),
        intensity: 'Z2-Z3',
        description: t('enduranceClimbingDesc'),
        tss: isRecoveryWeek ? 80 : (90 + week * 2)
      });
      
      // Jour 2: Force ou récupération
      if (isRecoveryWeek) {
        weekData.days.push({
          day: 2,
          type: 'recovery',
          title: t('activeRecovery'),
          duration: 45,
          intensity: 'Z1',
          description: t('activeRecoveryDesc'),
          tss: 30
        });
      } else if (phase === 'strength') {
        weekData.days.push({
          day: 2,
          type: 'strength',
          title: t('strengthTraining'),
          duration: 60,
          intensity: 'Z3-Z5',
          description: t('strengthTrainingDesc'),
          tss: 75 + week * 3
        });
      } else {
        weekData.days.push({
          day: 2,
          type: 'power',
          title: t('powerIntervals'),
          duration: 75,
          intensity: 'Z5',
          description: t('powerIntervalsDesc'),
          tss: 90 + week * 2
        });
      }
      
      // Jour 3: Récupération active
      weekData.days.push({
        day: 3,
        type: 'recovery',
        title: t('activeRecovery'),
        duration: 45,
        intensity: 'Z1',
        description: t('activeRecoveryDesc'),
        tss: 30
      });
      
      // Jour 4: Répétitions de montées
      weekData.days.push({
        day: 4,
        type: 'climbing',
        title: t('climbRepeats'),
        duration: 75 + (week > 5 ? 15 : 0),
        intensity: phase === 'specificity' ? 'Z4-Z5' : 'Z3-Z4',
        description: t('climbRepeatsDesc'),
        tss: isRecoveryWeek ? 70 : (85 + week * 2.5)
      });
      
      // Jour 5: Endurance longue ou repos
      if (isRecoveryWeek) {
        weekData.days.push({
          day: 5,
          type: 'rest',
          title: t('rest'),
          duration: 0,
          intensity: 'Rest',
          description: t('restDesc'),
          tss: 0
        });
      } else {
        weekData.days.push({
          day: 5,
          type: 'endurance',
          title: t('longEndurance'),
          duration: 120 + (week > 6 ? 30 : 0),
          intensity: 'Z2',
          description: t('longEnduranceDesc'),
          tss: 100 + week * 3
        });
      }
      
      program.push(weekData);
    }
    
    return program;
  };

  // Générer un programme de course
  const generateRaceProgram = (weeks, hoursPerWeek) => {
    const program = [];
    
    for (let week = 1; week <= weeks; week++) {
      const isRecoveryWeek = week % 4 === 0;
      const isTaperWeek = week === weeks || week === weeks - 1;
      const phase = week <= 6 ? 'base' : (week <= 12 ? 'build' : (isTaperWeek ? 'taper' : 'peak'));
      
      const weekData = {
        week,
        theme: isRecoveryWeek ? 'recovery' : phase,
        days: []
      };
      
      // Jour 1: Endurance longue
      weekData.days.push({
        day: 1,
        type: 'endurance',
        title: t('longEndurance'),
        duration: isTaperWeek ? 90 : (120 + (week > 6 ? 30 : 0)),
        intensity: 'Z2',
        description: t('longEnduranceDesc'),
        tss: isTaperWeek ? 80 : (110 + week * 2)
      });
      
      // Jour 2: Intervalles ou récupération
      if (isRecoveryWeek || isTaperWeek) {
        weekData.days.push({
          day: 2,
          type: 'recovery',
          title: t('activeRecovery'),
          dur
(Content truncated due to size limit. Use line ranges to read in chunks)