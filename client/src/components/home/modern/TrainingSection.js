import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { gsap } from 'gsap';
import styled from 'styled-components';
import { useInView } from 'react-intersection-observer';
import Chart from 'chart.js/auto';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Custom components
import ProgressiveImage from '../../common/ProgressiveImage';
import { LOAD_PRIORITIES } from '../../../services/progressiveImageLoader';
import TrainingCalendar from './TrainingCalendar';
import MuscleDiagram from './MuscleDiagram';

const TrainingSection = ({ animationComplexity, className }) => {
  const [ref, inView] = useInView({
    threshold: 0.2,
    triggerOnce: true
  });
  
  const controls = useAnimation();
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const progressChartRef = useRef(null);
  const progressChartInstanceRef = useRef(null);
  
  // State for interactive elements
  const [activeTrainingType, setActiveTrainingType] = useState('endurance');
  const [trainingLevel, setTrainingLevel] = useState('intermediate');
  const [trainingProgress, setTrainingProgress] = useState(0);
  
  // Training data
  const trainingTypes = {
    endurance: {
      title: "Endurance & Fonds",
      description: "Développez votre capacité à maintenir un effort prolongé, essentiel pour les longues ascensions.",
      icon: "⏱️",
      metrics: {
        ftp: 250,
        vo2max: 52,
        thresholdHr: 170,
        weeklyHours: 8
      },
      muscles: ['quadriceps', 'hamstrings', 'calves', 'gluteals'],
      progressData: [10, 25, 40, 48, 60, 75, 85]
    },
    climbing: {
      title: "Grimpeur",
      description: "Spécialisez-vous dans les ascensions avec des exercices ciblés pour améliorer votre rapport poids/puissance.",
      icon: "🏔️",
      metrics: {
        ftp: 275,
        vo2max: 58,
        thresholdHr: 175,
        weeklyHours: 10
      },
      muscles: ['quadriceps', 'gluteals', 'calves', 'core'],
      progressData: [15, 28, 35, 50, 60, 68, 80]
    },
    sprint: {
      title: "Sprint & Puissance",
      description: "Développez votre puissance explosive pour les accélérations et les sections difficiles.",
      icon: "⚡",
      metrics: {
        ftp: 265,
        vo2max: 55,
        thresholdHr: 178,
        weeklyHours: 7
      },
      muscles: ['quadriceps', 'hamstrings', 'gluteals', 'upper_body'],
      progressData: [20, 35, 45, 60, 70, 85, 92]
    }
  };
  
  const trainingLevels = {
    beginner: {
      label: "Débutant",
      weeklyHours: 5,
      intensity: 0.7,
      color: "#3498db"
    },
    intermediate: {
      label: "Intermédiaire",
      weeklyHours: 8,
      intensity: 0.85,
      color: "#f39c12"
    },
    advanced: {
      label: "Avancé",
      weeklyHours: 12,
      intensity: 1,
      color: "#e74c3c"
    }
  };
  
  useEffect(() => {
    if (inView) {
      controls.start('visible');
      
      // Start progress animation
      gsap.to({}, {
        duration: 3,
        onUpdate: function() {
          const progress = Math.min(Math.round(this.progress() * 100), 100);
          setTrainingProgress(progress);
        }
      });
    }
  }, [inView, controls]);
  
  // Create and update performance chart
  useEffect(() => {
    if (chartRef.current && inView) {
      const ctx = chartRef.current.getContext('2d');
      
      // Destroy existing chart if it exists
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
      
      // Create new chart
      chartInstanceRef.current = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: ['Endurance', 'Puissance', 'Récupération', 'Technique', 'Mental'],
          datasets: [{
            label: 'Performance actuelle',
            data: [
              trainingTypes[activeTrainingType].metrics.ftp / 3,
              trainingTypes[activeTrainingType].metrics.vo2max,
              trainingTypes[activeTrainingType].metrics.thresholdHr / 2,
              70 + Math.random() * 20,
              75 + Math.random() * 15
            ],
            backgroundColor: 'rgba(52, 152, 219, 0.2)',
            borderColor: 'rgba(52, 152, 219, 1)',
            pointBackgroundColor: 'rgba(52, 152, 219, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(52, 152, 219, 1)'
          }, {
            label: 'Objectif',
            data: [
              (trainingTypes[activeTrainingType].metrics.ftp / 3) * 1.2,
              trainingTypes[activeTrainingType].metrics.vo2max * 1.15,
              (trainingTypes[activeTrainingType].metrics.thresholdHr / 2) * 1.1,
              95,
              95
            ],
            backgroundColor: 'rgba(231, 76, 60, 0.2)',
            borderColor: 'rgba(231, 76, 60, 1)',
            pointBackgroundColor: 'rgba(231, 76, 60, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(231, 76, 60, 1)'
          }]
        },
        options: {
          elements: {
            line: {
              tension: 0.2
            }
          },
          scales: {
            r: {
              angleLines: {
                display: true
              },
              suggestedMin: 0,
              suggestedMax: 100
            }
          }
        }
      });
    }
  }, [inView, activeTrainingType]);
  
  // Create and update progress chart
  useEffect(() => {
    if (progressChartRef.current && inView) {
      const ctx = progressChartRef.current.getContext('2d');
      
      // Destroy existing chart if it exists
      if (progressChartInstanceRef.current) {
        progressChartInstanceRef.current.destroy();
      }
      
      // Get progress data based on active training type
      const progressData = trainingTypes[activeTrainingType].progressData;
      
      // Create new chart
      progressChartInstanceRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Semaine 1', 'Semaine 2', 'Semaine 3', 'Semaine 4', 'Semaine 5', 'Semaine 6', 'Semaine 7'],
          datasets: [{
            label: 'Progression',
            data: progressData,
            backgroundColor: 'rgba(46, 204, 113, 0.2)',
            borderColor: 'rgba(46, 204, 113, 1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              max: 100
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Progression: ${context.parsed.y}%`;
                }
              }
            }
          }
        }
      });
    }
  }, [inView, activeTrainingType]);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.645, 0.045, 0.355, 1.000]
      }
    }
  };
  
  return (
    <SectionContainer
      ref={ref}
      className={className}
      initial="hidden"
      animate={controls}
      variants={containerVariants}
    >
      <GradientOverlay />
      
      <SectionHeader variants={itemVariants}>
        <h2>Optimisez votre entraînement</h2>
        <p>Des plans personnalisés, des visualisations avancées et des analyses détaillées pour vous aider à atteindre vos objectifs</p>
      </SectionHeader>
      
      <ContentGrid>
        <TrainingTypesContainer variants={itemVariants}>
          <h3>Programmes d'entraînement spécialisés</h3>
          
          <TrainingTypeCards>
            {Object.entries(trainingTypes).map(([key, type]) => (
              <TrainingTypeCard
                key={key}
                active={activeTrainingType === key}
                onClick={() => setActiveTrainingType(key)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <IconContainer>{type.icon}</IconContainer>
                <TrainingTypeTitle>{type.title}</TrainingTypeTitle>
                <TrainingTypeDescription>
                  {type.description}
                </TrainingTypeDescription>
              </TrainingTypeCard>
            ))}
          </TrainingTypeCards>
          
          <TrainingLevels>
            {Object.entries(trainingLevels).map(([key, level]) => (
              <TrainingLevelButton
                key={key}
                active={trainingLevel === key}
                color={level.color}
                onClick={() => setTrainingLevel(key)}
              >
                {level.label}
              </TrainingLevelButton>
            ))}
          </TrainingLevels>
        </TrainingTypesContainer>
        
        <VisualizationContainer variants={itemVariants}>
          <VisualizationTabs>
            <VisualizationTab active={true}>Métriques de performance</VisualizationTab>
            <VisualizationTab>Historique d'entraînement</VisualizationTab>
          </VisualizationTabs>
          
          <PerformanceChart>
            <canvas ref={chartRef}></canvas>
          </PerformanceChart>
          
          <ProgressContainer>
            <ProgressHeader>
              <h4>Progression de votre programme</h4>
              <ProgressPercentage>{trainingProgress}%</ProgressPercentage>
            </ProgressHeader>
            
            <ProgressChartContainer>
              <canvas ref={progressChartRef}></canvas>
            </ProgressChartContainer>
          </ProgressContainer>
        </VisualizationContainer>
        
        <TrainingCalendarContainer variants={itemVariants}>
          <h3>Planifiez votre semaine</h3>
          <TrainingCalendar
            trainingType={activeTrainingType}
            trainingLevel={trainingLevel}
            animationComplexity={animationComplexity}
          />
        </TrainingCalendarContainer>
        
        <MuscleDiagramContainer variants={itemVariants}>
          <h3>Zones musculaires travaillées</h3>
          <MuscleDiagram
            activeMuscles={trainingTypes[activeTrainingType].muscles}
            animationComplexity={animationComplexity}
          />
        </MuscleDiagramContainer>
      </ContentGrid>
    </SectionContainer>
  );
};

// Styled Components
const SectionContainer = styled(motion.section)`
  padding: 100px 20px;
  background: linear-gradient(135deg, #2c3e50 0%, #1a2430 100%);
  position: relative;
  overflow: hidden;
  color: white;
`;

const GradientOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 70% 30%, rgba(41, 128, 185, 0.3) 0%, transparent 70%);
  z-index: 0;
`;

const SectionHeader = styled(motion.div)`
  text-align: center;
  margin-bottom: 60px;
  position: relative;
  z-index: 1;
  
  h2 {
    font-size: 3rem;
    margin-bottom: 20px;
    background: linear-gradient(45deg, #3498db, #2ecc71);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    
    @media (max-width: 768px) {
      font-size: 2.2rem;
    }
  }
  
  p {
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.8);
    max-width: 700px;
    margin: 0 auto;
    
    @media (max-width: 768px) {
      font-size: 1rem;
    }
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 30px;
  position: relative;
  z-index: 1;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const TrainingTypesContainer = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  
  h3 {
    font-size: 1.8rem;
    margin-bottom: 25px;
    color: white;
    
    @media (max-width: 768px) {
      font-size: 1.5rem;
    }
  }
`;

const TrainingTypeCards = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 25px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TrainingTypeCard = styled(motion.div)`
  background: ${props => props.active ? 'rgba(52, 152, 219, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 15px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${props => props.active ? '0 10px 20px rgba(52, 152, 219, 0.3)' : 'none'};
  border: ${props => props.active ? '1px solid rgba(52, 152, 219, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)'};
  
  &:hover {
    background: rgba(52, 152, 219, 0.2);
  }
`;

const IconContainer = styled.div`
  font-size: 2rem;
  margin-bottom: 15px;
`;

const TrainingTypeTitle = styled.h4`
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: white;
`;

const TrainingTypeDescription = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
`;

const TrainingLevels = styled.div`
  display: flex;
  gap: 15px;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
`;

const TrainingLevelButton = styled.button`
  background: ${props => props.active ? props.color : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 50px;
  cursor: pointer;
  font-weight: ${props => props.active ? '600' : '400'};
  transition: all 0.3s ease;
  flex: 1;
  
  &:hover {
    background: ${props => props.color};
    opacity: ${props => props.active ? 1 : 0.7};
  }
`;

const VisualizationContainer = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
`;

const VisualizationTabs = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const VisualizationTab = styled.button`
  background: ${props => props.active ? 'rgba(52, 152, 219, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  color: white;
  cursor: pointer;
  font-weight: ${props => props.active ? '600' : '400'};
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(52, 152, 219, 0.2);
  }
`;

const PerformanceChart = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  height: 300px;
  
  @media (max-width: 768px) {
    height: 250px;
  }
`;

const ProgressContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  padding: 20px;
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  
  h4 {
    font-size: 1.2rem;
    margin: 0;
    color: white;
  }
`;

const ProgressPercentage = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: #2ecc71;
`;

const ProgressChartContainer = styled.div`
  height: 150px;
  
  @media (max-width: 768px) {
    height: 120px;
  }
`;

const TrainingCalendarContainer = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  
  h3 {
    font-size: 1.8rem;
    margin-bottom: 25px;
    color: white;
    
    @media (max-width: 768px) {
      font-size: 1.5rem;
    }
  }
`;

const MuscleDiagramContainer = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  
  h3 {
    font-size: 1.8rem;
    margin-bottom: 25px;
    color: white;
    
    @media (max-width: 768px) {
      font-size: 1.5rem;
    }
  }
`;

export default TrainingSection;
