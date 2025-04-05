import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const TrainingCalendar = ({ trainingType, trainingLevel, animationComplexity }) => {
  // Training session types
  const sessionTypes = {
    endurance: {
      color: '#3498db',
      title: 'Endurance',
      icon: '🚴'
    },
    interval: {
      color: '#e74c3c',
      title: 'Intervalles',
      icon: '⏱️'
    },
    recovery: {
      color: '#2ecc71',
      title: 'Récupération',
      icon: '🧘'
    },
    strength: {
      color: '#f39c12',
      title: 'Force',
      icon: '💪'
    },
    rest: {
      color: '#95a5a6',
      title: 'Repos',
      icon: '😴'
    }
  };
  
  // Training intensity levels
  const intensityLevels = {
    beginner: 0.7,
    intermediate: 0.85,
    advanced: 1
  };
  
  // Training plans based on training type
  const trainingPlans = {
    endurance: {
      monday: { type: 'endurance', duration: 60, intensity: 0.7 },
      tuesday: { type: 'interval', duration: 45, intensity: 0.85 },
      wednesday: { type: 'recovery', duration: 30, intensity: 0.5 },
      thursday: { type: 'endurance', duration: 75, intensity: 0.75 },
      friday: { type: 'strength', duration: 45, intensity: 0.8 },
      saturday: { type: 'endurance', duration: 120, intensity: 0.7 },
      sunday: { type: 'rest', duration: 0, intensity: 0 }
    },
    climbing: {
      monday: { type: 'endurance', duration: 60, intensity: 0.7 },
      tuesday: { type: 'interval', duration: 60, intensity: 0.9 },
      wednesday: { type: 'strength', duration: 45, intensity: 0.85 },
      thursday: { type: 'recovery', duration: 30, intensity: 0.5 },
      friday: { type: 'interval', duration: 60, intensity: 0.9 },
      saturday: { type: 'endurance', duration: 150, intensity: 0.75 },
      sunday: { type: 'rest', duration: 0, intensity: 0 }
    },
    sprint: {
      monday: { type: 'endurance', duration: 45, intensity: 0.7 },
      tuesday: { type: 'interval', duration: 60, intensity: 0.95 },
      wednesday: { type: 'strength', duration: 60, intensity: 0.9 },
      thursday: { type: 'recovery', duration: 30, intensity: 0.5 },
      friday: { type: 'interval', duration: 45, intensity: 1 },
      saturday: { type: 'endurance', duration: 90, intensity: 0.7 },
      sunday: { type: 'rest', duration: 0, intensity: 0 }
    }
  };
  
  // State for storing the current plan adjusted for level
  const [currentPlan, setCurrentPlan] = useState({});
  const [activeDay, setActiveDay] = useState('monday');
  
  // Update the plan when training type or level changes
  useEffect(() => {
    const basePlan = trainingPlans[trainingType];
    const levelIntensity = intensityLevels[trainingLevel];
    
    // Adjust plan based on level
    const adjustedPlan = {};
    Object.entries(basePlan).forEach(([day, session]) => {
      adjustedPlan[day] = {
        ...session,
        duration: Math.round(session.duration * levelIntensity),
        intensity: Math.min(session.intensity * levelIntensity, 1)
      };
    });
    
    setCurrentPlan(adjustedPlan);
  }, [trainingType, trainingLevel]);
  
  // Get the display format for intensity
  const getIntensityDisplay = (intensity) => {
    if (intensity === 0) return '-';
    return `${Math.round(intensity * 100)}%`;
  };
  
  // Days of the week mapping
  const days = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche'
  };
  
  return (
    <CalendarContainer>
      <DaysList>
        {Object.entries(days).map(([dayKey, dayName]) => (
          <DayItem 
            key={dayKey}
            onClick={() => setActiveDay(dayKey)}
            active={activeDay === dayKey}
          >
            <DayName>{dayName}</DayName>
            {currentPlan[dayKey] && (
              <SessionIcon 
                color={sessionTypes[currentPlan[dayKey].type].color}
              >
                {sessionTypes[currentPlan[dayKey].type].icon}
              </SessionIcon>
            )}
          </DayItem>
        ))}
      </DaysList>
      
      <SessionDetailsContainer>
        {currentPlan[activeDay] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            key={activeDay + currentPlan[activeDay].type}
          >
            <SessionHeader>
              <SessionTitle>
                <SessionTypeIcon 
                  color={sessionTypes[currentPlan[activeDay].type].color}
                >
                  {sessionTypes[currentPlan[activeDay].type].icon}
                </SessionTypeIcon>
                <h4>{sessionTypes[currentPlan[activeDay].type].title}</h4>
              </SessionTitle>
              
              {currentPlan[activeDay].type !== 'rest' && (
                <IntensityBadge 
                  intensity={currentPlan[activeDay].intensity}
                >
                  {getIntensityDisplay(currentPlan[activeDay].intensity)}
                </IntensityBadge>
              )}
            </SessionHeader>
            
            {currentPlan[activeDay].type !== 'rest' ? (
              <>
                <SessionStats>
                  <StatItem>
                    <StatLabel>Durée</StatLabel>
                    <StatValue>{currentPlan[activeDay].duration} min</StatValue>
                  </StatItem>
                  
                  <StatItem>
                    <StatLabel>Calories</StatLabel>
                    <StatValue>~{Math.round(currentPlan[activeDay].duration * 10 * currentPlan[activeDay].intensity)}</StatValue>
                  </StatItem>
                  
                  <StatItem>
                    <StatLabel>TSS</StatLabel>
                    <StatValue>{Math.round(currentPlan[activeDay].duration * currentPlan[activeDay].intensity * 1.2)}</StatValue>
                  </StatItem>
                </SessionStats>
                
                <SessionDescription>
                  {getSessionDescription(trainingType, currentPlan[activeDay].type, trainingLevel)}
                </SessionDescription>
                
                {animationComplexity !== 'low' && (
                  <SessionIntensityGraph>
                    <IntensityGraph 
                      type={currentPlan[activeDay].type} 
                      intensity={currentPlan[activeDay].intensity}
                    />
                  </SessionIntensityGraph>
                )}
              </>
            ) : (
              <RestDayMessage>
                Journée de repos. Récupérez et préparez-vous pour vos prochaines séances d'entraînement.
              </RestDayMessage>
            )}
          </motion.div>
        )}
      </SessionDetailsContainer>
    </CalendarContainer>
  );
};

// Function to get session descriptions
const getSessionDescription = (trainingType, sessionType, level) => {
  const descriptions = {
    endurance: {
      endurance: {
        beginner: "Sortie à basse intensité pour développer votre endurance de base. Maintenez une cadence régulière et une respiration contrôlée.",
        intermediate: "Sortie en endurance avec quelques sections à intensité modérée. Concentrez-vous sur le maintien d'un effort constant.",
        advanced: "Sortie longue avec des sections à intensité spécifique pour optimiser votre endurance. Gardez un rythme soutenu."
      },
      interval: {
        beginner: "Intervalles courts 30/30 pour vous initier au travail fractionné. Récupération active entre les efforts.",
        intermediate: "Intervalles de type 4x4 minutes à intensité élevée avec récupération active de 2 minutes.",
        advanced: "Intervalles de type pyramide : 1-2-3-4-3-2-1 minutes à haute intensité avec récupération égale à la moitié du temps d'effort."
      },
      recovery: {
        beginner: "Sortie très légère pour favoriser la récupération. Évitez tout effort intense.",
        intermediate: "Sortie de récupération à faible intensité avec quelques accélérations en fin de session.",
        advanced: "Sortie de récupération avec technique de pédalage et mobilité articulaire."
      },
      strength: {
        beginner: "Exercices de renforcement musculaire ciblés sur les jambes et le core.",
        intermediate: "Séance de force avec des répétitions à basse cadence et résistance élevée.",
        advanced: "Travail spécifique de force-endurance avec alternance de montées en danseuse et assis."
      }
    },
    climbing: {
      endurance: {
        beginner: "Entraînement sur terrain vallonné avec un rythme régulier pour préparer les ascensions.",
        intermediate: "Sortie avec sections de montée à intensité modérée. Travaillez votre rythme en montée.",
        advanced: "Sortie longue avec plusieurs ascensions à un rythme soutenu pour développer l'endurance en montée."
      },
      interval: {
        beginner: "Intervalles en côte de 2 minutes à intensité modérée avec récupération complète.",
        intermediate: "Répétitions en côte de 5 minutes à intensité élevée avec récupération en descente.",
        advanced: "Intervalles en côte de 8 minutes à seuil avec récupération incomplète. Terminer par un effort maximal."
      },
      recovery: {
        beginner: "Sortie sur terrain plat à intensité très faible.",
        intermediate: "Sortie facile avec travail technique sur le placement en côte.",
        advanced: "Récupération active avec des exercices de pédalage en souplesse et des étirements dynamiques."
      },
      strength: {
        beginner: "Exercices de renforcement spécifiques pour les quadriceps et les fessiers.",
        intermediate: "Séance de force-endurance avec répétitions de montées en danseuse.",
        advanced: "Entraînement spécifique avec alternance de cadences en montée et travail en seuil."
      }
    },
    sprint: {
      endurance: {
        beginner: "Sortie facile avec quelques accélérations courtes pour préparer le travail de sprint.",
        intermediate: "Sortie d'endurance avec intégration de sprints courts (10s) toutes les 10 minutes.",
        advanced: "Sortie de base avec sections d'accélération progressive et travail de relance."
      },
      interval: {
        beginner: "Intervalles courts de 15s à intensité élevée avec récupération longue.",
        intermediate: "Séries de sprints de 20s avec récupération incomplète entre les répétitions.",
        advanced: "Entraînement de sprints spécifiques : départs arrêtés, sprints en côte, sprints lancés."
      },
      recovery: {
        beginner: "Sortie très légère pour favoriser la récupération musculaire.",
        intermediate: "Sortie de récupération avec quelques accélérations légères pour maintenir la réactivité.",
        advanced: "Récupération active avec travail technique sur la position et l'aérodynamisme."
      },
      strength: {
        beginner: "Exercices de renforcement pour développer la puissance explosive.",
        intermediate: "Travail spécifique de force-vitesse avec résistance variable.",
        advanced: "Entraînement combiné de force maximale et explosive avec travail de coordination."
      }
    }
  };
  
  return descriptions[trainingType][sessionType][level] || "Description non disponible.";
};

// Intensity graph component
const IntensityGraph = ({ type, intensity }) => {
  // Different intensity profile patterns for different training types
  const getPattern = () => {
    // Scale the height based on intensity (0-100)
    const scaleHeight = (h) => Math.round(h * intensity * 100);
    
    switch (type) {
      case 'endurance':
        return [40, 42, 45, 43, 45, 47, 45, 43, 42, 40].map(scaleHeight);
      case 'interval':
        return [30, 90, 40, 90, 40, 90, 40, 90, 30].map(scaleHeight);
      case 'recovery':
        return [30, 32, 35, 33, 30, 32, 30, 32, 30].map(scaleHeight);
      case 'strength':
        return [30, 80, 30, 80, 30, 80, 30, 80, 30].map(scaleHeight);
      default:
        return [40, 40, 40, 40, 40, 40, 40, 40, 40, 40].map(scaleHeight);
    }
  };
  
  const intensityPattern = getPattern();
  const maxHeight = 100;
  
  // Color mapping based on training type
  const colorMap = {
    endurance: '#3498db',
    interval: '#e74c3c',
    recovery: '#2ecc71',
    strength: '#f39c12'
  };
  
  return (
    <GraphContainer>
      {intensityPattern.map((height, index) => (
        <GraphBar 
          key={index}
          height={height}
          color={colorMap[type] || '#3498db'}
          style={{
            animationDelay: `${index * 0.1}s`
          }}
        />
      ))}
      
      <GraphAxis>
        <AxisLabel>0%</AxisLabel>
        <AxisLabel>50%</AxisLabel>
        <AxisLabel>100%</AxisLabel>
      </GraphAxis>
    </GraphContainer>
  );
};

// Styled Components
const CalendarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  overflow: hidden;
`;

const DaysList = styled.div`
  display: flex;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  padding: 5px;
  
  &::-webkit-scrollbar {
    height: 5px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 10px;
  }
`;

const DayItem = styled.div`
  padding: 12px 20px;
  min-width: 100px;
  text-align: center;
  cursor: pointer;
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  border-radius: 10px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
`;

const DayName = styled.div`
  font-weight: 600;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
`;

const SessionIcon = styled.div`
  font-size: 1.2rem;
  height: 24px;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.color || 'rgba(255, 255, 255, 0.1)'};
  border-radius: 50%;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
`;

const SessionDetailsContainer = styled.div`
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 15px;
  min-height: 200px;
`;

const SessionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const SessionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  h4 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: white;
  }
`;

const SessionTypeIcon = styled.div`
  font-size: 1.5rem;
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.color || 'rgba(255, 255, 255, 0.1)'};
  border-radius: 50%;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
`;

const IntensityBadge = styled.div`
  background: ${props => {
    const intensity = props.intensity || 0;
    if (intensity < 0.6) return 'rgba(46, 204, 113, 0.8)';
    if (intensity < 0.8) return 'rgba(243, 156, 18, 0.8)';
    return 'rgba(231, 76, 60, 0.8)';
  }};
  padding: 5px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  color: white;
`;

const SessionStats = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 25px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 15px;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 5px;
`;

const StatValue = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
`;

const SessionDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin-bottom: 25px;
`;

const RestDayMessage = styled.div`
  padding: 30px 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  line-height: 1.6;
`;

const SessionIntensityGraph = styled.div`
  margin-top: 20px;
`;

const GraphContainer = styled.div`
  height: 100px;
  display: flex;
  align-items: flex-end;
  gap: 5px;
  padding-bottom: 25px;
  position: relative;
`;

const GraphBar = styled.div`
  width: 100%;
  height: ${props => Math.min(props.height || 10, 100)}%;
  background: ${props => props.color || '#3498db'};
  border-radius: 4px;
  transition: height 0.5s ease;
  animation: pulse 1.5s infinite alternate;
  
  @keyframes pulse {
    0% {
      opacity: 0.7;
    }
    100% {
      opacity: 1;
    }
  }
`;

const GraphAxis = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 5px;
`;

const AxisLabel = styled.div`
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
`;

export default TrainingCalendar;
