import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { gsap } from 'gsap';
import { motion } from 'framer-motion';

const MuscleDiagram = ({ activeMuscles = [], animationComplexity }) => {
  const svgRef = useRef(null);
  
  // Mapping of muscle groups to their SVG element IDs and display names
  const muscleGroups = {
    quadriceps: { id: 'quads', name: 'Quadriceps', color: '#e74c3c', percentage: 85 },
    hamstrings: { id: 'hamstrings', name: 'Ischio-jambiers', color: '#3498db', percentage: 65 },
    calves: { id: 'calves', name: 'Mollets', color: '#2ecc71', percentage: 75 },
    gluteals: { id: 'glutes', name: 'Fessiers', color: '#f39c12', percentage: 80 },
    core: { id: 'core', name: 'Core', color: '#9b59b6', percentage: 60 },
    lower_back: { id: 'lower-back', name: 'Bas du dos', color: '#1abc9c', percentage: 50 },
    upper_body: { id: 'upper-body', name: 'Haut du corps', color: '#34495e', percentage: 30 }
  };
  
  // Animation for the active muscles
  useEffect(() => {
    if (svgRef.current && animationComplexity !== 'low') {
      // Reset all muscles to inactive state
      Object.values(muscleGroups).forEach(group => {
        const element = svgRef.current.querySelector(`#${group.id}`);
        if (element) {
          gsap.set(element, {
            fill: 'rgba(255, 255, 255, 0.1)',
            stroke: 'rgba(255, 255, 255, 0.3)',
            strokeWidth: 1
          });
        }
      });
      
      // Animate active muscles
      activeMuscles.forEach(muscleKey => {
        const muscle = muscleGroups[muscleKey];
        if (muscle) {
          const element = svgRef.current.querySelector(`#${muscle.id}`);
          if (element) {
            gsap.to(element, {
              fill: muscle.color,
              stroke: 'rgba(255, 255, 255, 0.8)',
              strokeWidth: 2,
              duration: 0.5,
              ease: 'power2.out'
            });
            
            // Add pulsing animation for active muscles
            gsap.to(element, {
              opacity: 0.6,
              duration: 1.2,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut'
            });
          }
        }
      });
    }
  }, [activeMuscles, muscleGroups, animationComplexity]);
  
  return (
    <DiagramContainer>
      <MuscleVisualization>
        <SVGContainer 
          ref={svgRef}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 200 400"
        >
          {/* Simplified human body outline */}
          <path 
            d="M100,30 Q120,30 130,40 Q140,50 140,70 L140,150 Q140,170 130,180 Q120,190 110,190 L90,190 Q80,190 70,180 Q60,170 60,150 L60,70 Q60,50 70,40 Q80,30 100,30 Z" 
            fill="rgba(255, 255, 255, 0.05)" 
            stroke="rgba(255, 255, 255, 0.2)" 
            strokeWidth="1"
          />
          
          {/* Head shape */}
          <circle 
            cx="100" 
            cy="20" 
            r="15" 
            fill="rgba(255, 255, 255, 0.05)" 
            stroke="rgba(255, 255, 255, 0.2)" 
            strokeWidth="1"
          />
          
          {/* Arms */}
          <path 
            d="M60,80 Q50,90 40,110 Q30,130 40,150 Q45,160 55,165" 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.2)" 
            strokeWidth="1"
          />
          <path 
            d="M140,80 Q150,90 160,110 Q170,130 160,150 Q155,160 145,165" 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.2)" 
            strokeWidth="1"
          />
          
          {/* Legs */}
          <path 
            d="M90,190 Q85,230 80,280 Q75,330 80,370" 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.2)" 
            strokeWidth="1"
          />
          <path 
            d="M110,190 Q115,230 120,280 Q125,330 120,370" 
            fill="none" 
            stroke="rgba(255, 255, 255, 0.2)" 
            strokeWidth="1"
          />
          
          {/* Muscle groups */}
          {/* Upper Body */}
          <path 
            id="upper-body" 
            d="M100,40 Q115,40 125,50 Q135,60 135,80 L135,100 Q135,110 125,115 Q115,120 100,120 Q85,120 75,115 Q65,110 65,100 L65,80 Q65,60 75,50 Q85,40 100,40 Z" 
            fill="rgba(255, 255, 255, 0.1)" 
            stroke="rgba(255, 255, 255, 0.3)" 
            strokeWidth="1"
          />
          
          {/* Core */}
          <path 
            id="core" 
            d="M100,120 Q115,120 125,125 Q135,130 135,150 L135,170 Q135,180 125,185 Q115,190 100,190 Q85,190 75,185 Q65,180 65,170 L65,150 Q65,130 75,125 Q85,120 100,120 Z" 
            fill="rgba(255, 255, 255, 0.1)" 
            stroke="rgba(255, 255, 255, 0.3)" 
            strokeWidth="1"
          />
          
          {/* Lower Back */}
          <path 
            id="lower-back" 
            d="M85,155 Q85,160 90,165 Q95,170 100,170 Q105,170 110,165 Q115,160 115,155 Q115,150 110,145 Q105,140 100,140 Q95,140 90,145 Q85,150 85,155 Z" 
            fill="rgba(255, 255, 255, 0.1)" 
            stroke="rgba(255, 255, 255, 0.3)" 
            strokeWidth="1"
            transform="translate(0, 20)"
          />
          
          {/* Glutes */}
          <path 
            id="glutes" 
            d="M85,190 Q85,200 90,210 Q95,220 100,220 Q105,220 110,210 Q115,200 115,190 Q115,185 110,180 Q105,175 100,175 Q95,175 90,180 Q85,185 85,190 Z" 
            fill="rgba(255, 255, 255, 0.1)" 
            stroke="rgba(255, 255, 255, 0.3)" 
            strokeWidth="1"
          />
          
          {/* Quadriceps */}
          <path 
            id="quads" 
            d="M85,220 Q83,250 80,280 Q77,310 80,340 L120,340 Q123,310 120,280 Q117,250 115,220 Q105,230 100,230 Q95,230 85,220 Z" 
            fill="rgba(255, 255, 255, 0.1)" 
            stroke="rgba(255, 255, 255, 0.3)" 
            strokeWidth="1"
          />
          
          {/* Hamstrings */}
          <path 
            id="hamstrings" 
            d="M85,220 Q83,250 80,280 Q77,310 80,340 L120,340 Q123,310 120,280 Q117,250 115,220 Z" 
            fill="rgba(255, 255, 255, 0.1)" 
            stroke="rgba(255, 255, 255, 0.3)" 
            strokeWidth="1"
            transform="translate(0, 10) scale(0.8, 0.8) translate(20, 50) rotate(180, 100, 280)"
          />
          
          {/* Calves */}
          <path 
            id="calves" 
            d="M85,340 Q83,350 80,370 L120,370 Q117,350 115,340 Z" 
            fill="rgba(255, 255, 255, 0.1)" 
            stroke="rgba(255, 255, 255, 0.3)" 
            strokeWidth="1"
            transform="scale(0.8, 1) translate(20, 0)"
          />
        </SVGContainer>
        
        {/* Active muscle labels around the diagram */}
        <LabelsContainer>
          {activeMuscles.map(muscleKey => {
            const muscle = muscleGroups[muscleKey];
            if (muscle) {
              return (
                <MuscleLabelContainer
                  key={muscleKey}
                  muscleType={muscleKey}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <MuscleLabelDot color={muscle.color} />
                  <MuscleLabelText>
                    <MuscleName>{muscle.name}</MuscleName>
                    <MusclePercentage>{muscle.percentage}%</MusclePercentage>
                  </MuscleLabelText>
                </MuscleLabelContainer>
              );
            }
            return null;
          })}
        </LabelsContainer>
      </MuscleVisualization>
      
      <MuscleInfoContainer>
        <InfoHeader>
          <InfoTitle>Groupes musculaires sollicités</InfoTitle>
          <InfoSubtitle>
            Répartition des efforts lors de l'entraînement
          </InfoSubtitle>
        </InfoHeader>
        
        <MuscleBarChart>
          {activeMuscles.map((muscleKey, index) => {
            const muscle = muscleGroups[muscleKey];
            if (muscle) {
              return (
                <MuscleBarContainer key={muscleKey}>
                  <MuscleBarLabel>{muscle.name}</MuscleBarLabel>
                  <MuscleBarWrapper>
                    <MuscleBar
                      width={muscle.percentage}
                      color={muscle.color}
                      style={{
                        animationDelay: `${index * 0.1}s`
                      }}
                    />
                  </MuscleBarWrapper>
                  <MuscleBarValue>{muscle.percentage}%</MuscleBarValue>
                </MuscleBarContainer>
              );
            }
            return null;
          })}
        </MuscleBarChart>
        
        <TrainingTips>
          <TipIcon>💡</TipIcon>
          <TipText>
            {getTipForMuscles(activeMuscles)}
          </TipText>
        </TrainingTips>
      </MuscleInfoContainer>
    </DiagramContainer>
  );
};

// Function to generate tips based on active muscles
const getTipForMuscles = (activeMuscles) => {
  // If quadriceps is the primary muscle being worked
  if (activeMuscles.includes('quadriceps') && activeMuscles.includes('gluteals')) {
    return "Pour optimiser le travail de vos quadriceps et fessiers, alternez entre position assise et en danseuse lors des montées.";
  }
  
  // If core is being worked
  if (activeMuscles.includes('core')) {
    return "Renforcer votre ceinture abdominale améliore votre stabilité sur le vélo et prévient les douleurs lombaires.";
  }
  
  // If working hamstrings
  if (activeMuscles.includes('hamstrings')) {
    return "Pour développer vos ischio-jambiers, concentrez-vous sur la phase de tirage lors du pédalage (remontée de la pédale).";
  }
  
  // If working calves
  if (activeMuscles.includes('calves')) {
    return "Des mollets bien entraînés améliorent votre efficacité sur les montées raides et en danseuse.";
  }
  
  // Default tip
  return "Un entraînement équilibré sollicitant tous les groupes musculaires est essentiel pour prévenir les blessures et optimiser vos performances.";
};

// Styled Components
const DiagramContainer = styled.div`
  display: flex;
  gap: 40px;
  
  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 30px;
  }
`;

const MuscleVisualization = styled.div`
  display: flex;
  flex: 1;
  position: relative;
`;

const SVGContainer = styled.svg`
  width: 100%;
  max-width: 250px;
  height: auto;
  margin: 0 auto;
`;

const LabelsContainer = styled.div`
  position: absolute;
  top: 10px;
  left: 60%;
  display: flex;
  flex-direction: column;
  gap: 15px;
  
  @media (max-width: 1024px) {
    position: relative;
    top: 0;
    left: 0;
    margin-top: 20px;
  }
`;

const MuscleLabelContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  top: ${props => {
    // Position labels based on muscle type
    switch (props.muscleType) {
      case 'quadriceps': return '200px';
      case 'hamstrings': return '250px';
      case 'calves': return '300px';
      case 'gluteals': return '150px';
      case 'core': return '100px';
      case 'lower_back': return '120px';
      case 'upper_body': return '50px';
      default: return '0';
    }
  }};
`;

const MuscleLabelDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.color || '#ffffff'};
  box-shadow: 0 0 10px ${props => props.color || 'rgba(255, 255, 255, 0.5)'};
`;

const MuscleLabelText = styled.div`
  display: flex;
  flex-direction: column;
`;

const MuscleName = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
`;

const MusclePercentage = styled.span`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
`;

const MuscleInfoContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InfoHeader = styled.div`
  margin-bottom: 10px;
`;

const InfoTitle = styled.h4`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 10px 0;
  color: white;
`;

const InfoSubtitle = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
`;

const MuscleBarChart = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const MuscleBarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const MuscleBarLabel = styled.span`
  font-size: 0.9rem;
  width: 120px;
  color: rgba(255, 255, 255, 0.9);
  text-align: right;
`;

const MuscleBarWrapper = styled.div`
  flex: 1;
  height: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  overflow: hidden;
`;

const MuscleBar = styled.div`
  height: 100%;
  width: ${props => props.width || 0}%;
  background-color: ${props => props.color || '#3498db'};
  border-radius: 5px;
  transition: width 1s ease;
  animation: animate-bar 1.5s ease-out;
  
  @keyframes animate-bar {
    0% {
      width: 0;
    }
    100% {
      width: ${props => props.width || 0}%;
    }
  }
`;

const MuscleBarValue = styled.span`
  font-size: 0.9rem;
  width: 40px;
  color: rgba(255, 255, 255, 0.9);
`;

const TrainingTips = styled.div`
  margin-top: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border-left: 4px solid #f39c12;
  display: flex;
  align-items: flex-start;
  gap: 15px;
`;

const TipIcon = styled.div`
  font-size: 1.5rem;
`;

const TipText = styled.p`
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
`;

export default MuscleDiagram;
