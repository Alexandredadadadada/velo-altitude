import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import Chart from 'chart.js/auto';

const HydrationPlanner = ({ weight, activityLevel, dailyNeeds, animationComplexity }) => {
  const [rideDetails, setRideDetails] = useState({
    duration: 120,
    intensity: 'moderate',
    temperature: 20,
    humidity: 50
  });
  
  const [hydrationPlan, setHydrationPlan] = useState({
    totalNeeds: 0,
    hourlyRate: 0,
    preRideAmount: 0,
    duringRideAmount: 0,
    postRideAmount: 0,
    electrolytes: false
  });
  
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  // Calcul du plan d'hydratation basé sur les détails de sortie
  useEffect(() => {
    calculateHydrationPlan();
  }, [rideDetails, weight]);
  
  const calculateHydrationPlan = () => {
    // Facteurs de base pour l'hydratation pendant l'effort
    const intensityFactors = {
      light: 500,
      moderate: 700,
      high: 900,
      veryHigh: 1100
    };
    
    // Ajustement pour la température
    const temperatureFactor = Math.max(0, (rideDetails.temperature - 15) * 20);
    
    // Ajustement pour l'humidité
    const humidityFactor = Math.max(0, (rideDetails.humidity - 40) * 2);
    
    // Calcul du volume horaire de base
    const baseHourlyRate = intensityFactors[rideDetails.intensity];
    
    // Ajustements environnementaux
    const adjustedHourlyRate = baseHourlyRate + temperatureFactor + humidityFactor;
    
    // Ajustement pour le poids
    const weightAdjustedRate = adjustedHourlyRate * (weight / 70);
    
    // Calcul des volumes pour les différentes phases
    const totalDuration = rideDetails.duration / 60; // Convertir en heures
    const totalDuringRide = Math.round(weightAdjustedRate * totalDuration);
    
    // Recommandations pré et post-effort
    const preRideAmount = Math.round(totalDuration < 2 ? 500 : 750);
    const postRideAmount = Math.round(totalDuringRide * 0.5);
    
    // Besoin d'électrolytes?
    const needsElectrolytes = rideDetails.temperature > 25 || 
                             rideDetails.humidity > 60 || 
                             rideDetails.duration > 180 ||
                             rideDetails.intensity === 'high' || 
                             rideDetails.intensity === 'veryHigh';
    
    // Mise à jour de l'état
    setHydrationPlan({
      totalNeeds: totalDuringRide + preRideAmount + postRideAmount,
      hourlyRate: Math.round(weightAdjustedRate),
      preRideAmount,
      duringRideAmount: totalDuringRide,
      postRideAmount,
      electrolytes: needsElectrolytes
    });
  };
  
  // Créer et mettre à jour le graphique
  useEffect(() => {
    if (chartRef.current) {
      // Détruire le graphique précédent s'il existe
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      
      const ctx = chartRef.current.getContext('2d');
      
      // Données pour le graphique
      const data = {
        labels: ['Pré-sortie', 'Pendant la sortie', 'Post-sortie'],
        datasets: [
          {
            label: 'Volume d\'hydratation (ml)',
            data: [
              hydrationPlan.preRideAmount,
              hydrationPlan.duringRideAmount,
              hydrationPlan.postRideAmount
            ],
            backgroundColor: [
              'rgba(52, 152, 219, 0.6)',
              'rgba(46, 204, 113, 0.6)',
              'rgba(155, 89, 182, 0.6)'
            ],
            borderColor: [
              'rgba(52, 152, 219, 1)',
              'rgba(46, 204, 113, 1)',
              'rgba(155, 89, 182, 1)'
            ],
            borderWidth: 1
          }
        ]
      };
      
      // Options du graphique
      const options = {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: 'white'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.raw} ml`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        },
        animation: {
          duration: animationComplexity === 'low' ? 0 : 1000
        }
      };
      
      // Créer le graphique
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: options
      });
    }
  }, [hydrationPlan, animationComplexity]);
  
  // Gérer les changements de valeurs
  const handleDetailChange = (field, value) => {
    setRideDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Intensités d'effort
  const intensityOptions = [
    { value: 'light', label: 'Légère (récupération active)', sweatRate: 'Faible' },
    { value: 'moderate', label: 'Modérée (endurance)', sweatRate: 'Modérée' },
    { value: 'high', label: 'Élevée (intervalles, seuil)', sweatRate: 'Élevée' },
    { value: 'veryHigh', label: 'Très élevée (compétition)', sweatRate: 'Très élevée' }
  ];
  
  // Conseils d'hydratation basés sur le plan
  const getHydrationTips = () => {
    const tips = [];
    
    // Conseils généraux
    tips.push(`Buvez ${hydrationPlan.preRideAmount} ml 1-2 heures avant votre sortie.`);
    
    if (rideDetails.duration > 60) {
      tips.push(`Visez un apport de ${hydrationPlan.hourlyRate} ml par heure pendant l'effort.`);
    }
    
    if (hydrationPlan.electrolytes) {
      tips.push("Incluez des électrolytes dans votre boisson pour remplacer le sodium perdu par la transpiration.");
    }
    
    if (rideDetails.temperature > 25) {
      tips.push("Par temps chaud, augmentez votre consommation de 20-30% au-delà des recommandations standard.");
    }
    
    tips.push(`Après l'effort, consommez au moins ${hydrationPlan.postRideAmount} ml pour favoriser la récupération.`);
    
    return tips;
  };
  
  const hydrationTips = getHydrationTips();
  
  // Distribution recommandée des boissons
  const getDrinkingSchedule = () => {
    const hourlyRate = hydrationPlan.hourlyRate;
    const duration = rideDetails.duration;
    const hours = Math.ceil(duration / 60);
    
    // Créer un calendrier de consommation
    const schedule = [];
    
    for (let i = 0; i < hours; i++) {
      // Ajuster pour la dernière heure incomplète
      const isLastHour = i === hours - 1;
      const lastHourFraction = isLastHour ? (duration % 60) / 60 : 1;
      const hourAmount = Math.round(hourlyRate * (isLastHour && duration % 60 !== 0 ? lastHourFraction : 1));
      
      // Diviser en portions
      const portions = [];
      
      if (hourAmount > 400) {
        // Toutes les 15 minutes
        const portionSize = Math.round(hourAmount / 4);
        for (let j = 0; j < 4; j++) {
          if (i * 60 + j * 15 < duration) {
            portions.push({
              time: `${i}h${j * 15 > 0 ? j * 15 : '00'}`,
              amount: portionSize
            });
          }
        }
      } else {
        // Toutes les 20 minutes
        const portionSize = Math.round(hourAmount / 3);
        for (let j = 0; j < 3; j++) {
          if (i * 60 + j * 20 < duration) {
            portions.push({
              time: `${i}h${j * 20 > 0 ? j * 20 : '00'}`,
              amount: portionSize
            });
          }
        }
      }
      
      schedule.push({
        hour: i + 1,
        total: hourAmount,
        portions
      });
    }
    
    return schedule;
  };
  
  const drinkingSchedule = getDrinkingSchedule();
  
  return (
    <HydrationContainer>
      <PlannerSection>
        <SectionTitle>Planifiez votre hydratation</SectionTitle>
        <FormGrid>
          <FormGroup>
            <FormLabel>Durée de sortie (minutes)</FormLabel>
            <FormInput
              type="number"
              value={rideDetails.duration}
              onChange={(e) => handleDetailChange('duration', parseInt(e.target.value) || 30)}
              min="30"
              max="480"
            />
          </FormGroup>
          
          <FormGroup>
            <FormLabel>Intensité de l'effort</FormLabel>
            <FormSelect
              value={rideDetails.intensity}
              onChange={(e) => handleDetailChange('intensity', e.target.value)}
            >
              {intensityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FormSelect>
          </FormGroup>
          
          <FormGroup>
            <FormLabel>Température (°C)</FormLabel>
            <FormInput
              type="number"
              value={rideDetails.temperature}
              onChange={(e) => handleDetailChange('temperature', parseInt(e.target.value) || 0)}
              min="0"
              max="45"
            />
          </FormGroup>
          
          <FormGroup>
            <FormLabel>Humidité (%)</FormLabel>
            <FormInput
              type="number"
              value={rideDetails.humidity}
              onChange={(e) => handleDetailChange('humidity', parseInt(e.target.value) || 0)}
              min="0"
              max="100"
            />
          </FormGroup>
        </FormGrid>
        
        <HydrationInfoCards>
          <InfoCard highlight={hydrationPlan.electrolytes}>
            <InfoIcon>{hydrationPlan.electrolytes ? '⚠️' : '💧'}</InfoIcon>
            <InfoContent>
              <InfoTitle>
                {hydrationPlan.electrolytes 
                  ? 'Électrolytes recommandés'
                  : 'Eau suffisante'}
              </InfoTitle>
              <InfoDescription>
                {hydrationPlan.electrolytes
                  ? 'Les conditions nécessitent un apport en électrolytes pour prévenir l\'hyponatrémie.'
                  : 'De l\'eau pure devrait suffire pour cette sortie et ces conditions.'}
              </InfoDescription>
            </InfoContent>
          </InfoCard>
          
          <InfoCard>
            <InfoIcon>🔄</InfoIcon>
            <InfoContent>
              <InfoTitle>Volume quotidien</InfoTitle>
              <InfoDescription>
                N'oubliez pas de maintenir votre hydratation quotidienne de base ({dailyNeeds} ml) en plus du plan d'hydratation spécifique à l'effort.
              </InfoDescription>
            </InfoContent>
          </InfoCard>
        </HydrationInfoCards>
      </PlannerSection>
      
      <ResultsSection>
        <SectionTitle>Votre plan d'hydratation</SectionTitle>
        
        <HydrationSummary>
          <SummaryCard>
            <SummaryIcon>💧</SummaryIcon>
            <SummaryContent>
              <SummaryValue>{hydrationPlan.totalNeeds} ml</SummaryValue>
              <SummaryLabel>Volume total</SummaryLabel>
            </SummaryContent>
          </SummaryCard>
          
          <SummaryCard>
            <SummaryIcon>⏱️</SummaryIcon>
            <SummaryContent>
              <SummaryValue>{hydrationPlan.hourlyRate} ml</SummaryValue>
              <SummaryLabel>Par heure</SummaryLabel>
            </SummaryContent>
          </SummaryCard>
          
          <SummaryCard>
            <SummaryIcon>🧪</SummaryIcon>
            <SummaryContent>
              <SummaryValue>{hydrationPlan.electrolytes ? 'Oui' : 'Non'}</SummaryValue>
              <SummaryLabel>Électrolytes</SummaryLabel>
            </SummaryContent>
          </SummaryCard>
        </HydrationSummary>
        
        <ChartContainer>
          <canvas ref={chartRef}></canvas>
        </ChartContainer>
        
        <TipsSection>
          <TipsTitle>Conseils d'hydratation</TipsTitle>
          <TipsList>
            {hydrationTips.map((tip, index) => (
              <TipItem key={index}>
                <TipBullet>•</TipBullet>
                <TipText>{tip}</TipText>
              </TipItem>
            ))}
          </TipsList>
        </TipsSection>
        
        <ScheduleSection>
          <ScheduleTitle>Planning de consommation détaillé</ScheduleTitle>
          <ScheduleDescription>
            Pour maintenir une hydratation optimale, suivez ce planning pendant votre sortie :
          </ScheduleDescription>
          
          <ScheduleTable>
            <ScheduleHeader>
              <ScheduleHeaderCell width="20%">Heure</ScheduleHeaderCell>
              <ScheduleHeaderCell width="25%">À boire</ScheduleHeaderCell>
              <ScheduleHeaderCell width="55%">Recommandation</ScheduleHeaderCell>
            </ScheduleHeader>
            
            {drinkingSchedule.map((hourSchedule, hourIndex) => (
              <React.Fragment key={hourIndex}>
                <ScheduleRow header>
                  <ScheduleCell bold colSpan={2}>Heure {hourSchedule.hour}</ScheduleCell>
                  <ScheduleCell bold>{hourSchedule.total} ml au total</ScheduleCell>
                </ScheduleRow>
                
                {hourSchedule.portions.map((portion, portionIndex) => (
                  <ScheduleRow key={`${hourIndex}-${portionIndex}`}>
                    <ScheduleCell>{portion.time}</ScheduleCell>
                    <ScheduleCell>{portion.amount} ml</ScheduleCell>
                    <ScheduleCell>
                      {portion.amount > 250 
                        ? 'Divisez en plusieurs gorgées sur quelques minutes' 
                        : 'Buvez en une ou deux gorgées'}
                    </ScheduleCell>
                  </ScheduleRow>
                ))}
              </React.Fragment>
            ))}
          </ScheduleTable>
        </ScheduleSection>
      </ResultsSection>
    </HydrationContainer>
  );
};

// Styled Components
const HydrationContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 30px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const PlannerSection = styled.div`
  background: rgba(0, 0, 0, 0.1);
  border-radius: 15px;
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SectionTitle = styled.h3`
  font-size: 1.5rem;
  margin: 0;
  color: white;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FormLabel = styled.label`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
`;

const FormInput = styled.input`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  padding: 10px 15px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.15);
  }
  
  &::-webkit-inner-spin-button, 
  &::-webkit-outer-spin-button { 
    -webkit-appearance: none;
    margin: 0;
  }
`;

const FormSelect = styled.select`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  padding: 10px 15px;
  font-size: 1rem;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 20px;
  
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.5);
    background-color: rgba(255, 255, 255, 0.15);
  }
  
  option {
    background: #136a8a;
    color: white;
  }
`;

const HydrationInfoCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 10px;
`;

const InfoCard = styled.div`
  display: flex;
  gap: 15px;
  background: ${props => props.highlight ? 'rgba(231, 76, 60, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 10px;
  padding: 15px;
  border-left: ${props => props.highlight ? '3px solid #e74c3c' : '3px solid rgba(255, 255, 255, 0.2)'};
`;

const InfoIcon = styled.div`
  font-size: 1.5rem;
`;

const InfoContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const InfoTitle = styled.h4`
  font-size: 1.1rem;
  margin: 0;
  color: white;
`;

const InfoDescription = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  line-height: 1.4;
`;

const ResultsSection = styled.div`
  background: rgba(0, 0, 0, 0.1);
  border-radius: 15px;
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 25px;
`;

const HydrationSummary = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 15px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const SummaryCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
  
  @media (max-width: 768px) {
    justify-content: space-between;
  }
`;

const SummaryIcon = styled.div`
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 45px;
  height: 45px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
`;

const SummaryContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const SummaryValue = styled.div`
  font-size: 1.3rem;
  font-weight: 700;
  color: white;
`;

const SummaryLabel = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
`;

const ChartContainer = styled.div`
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 20px;
  height: 250px;
`;

const TipsSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 20px;
`;

const TipsTitle = styled.h4`
  font-size: 1.2rem;
  margin: 0 0 15px 0;
  color: white;
`;

const TipsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TipItem = styled.div`
  display: flex;
  gap: 10px;
`;

const TipBullet = styled.div`
  color: #3498db;
  font-size: 1.2rem;
  line-height: 1;
`;

const TipText = styled.div`
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
`;

const ScheduleSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 20px;
`;

const ScheduleTitle = styled.h4`
  font-size: 1.2rem;
  margin: 0 0 10px 0;
  color: white;
`;

const ScheduleDescription = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 20px 0;
`;

const ScheduleTable = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ScheduleHeader = styled.div`
  display: flex;
  background: rgba(0, 0, 0, 0.2);
  padding: 10px 15px;
`;

const ScheduleHeaderCell = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  width: ${props => props.width || 'auto'};
`;

const ScheduleRow = styled.div`
  display: flex;
  background: ${props => props.header ? 'rgba(52, 152, 219, 0.2)' : 'transparent'};
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px 15px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const ScheduleCell = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, ${props => props.bold ? '1' : '0.8'});
  font-weight: ${props => props.bold ? '600' : '400'};
  width: ${props => props.width || 'auto'};
  flex: ${props => props.flex || '1'};
  ${props => props.colSpan && `grid-column: span ${props.colSpan};`}
`;

export default HydrationPlanner;
