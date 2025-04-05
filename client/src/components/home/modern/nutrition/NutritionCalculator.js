import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const NutritionCalculator = ({ userProfile, nutritionNeeds, onProfileChange, animationComplexity }) => {
  const [idealWeight, setIdealWeight] = useState(0);
  const [cyclingLevel, setCyclingLevel] = useState('amateur');
  const [additionalInfo, setAdditionalInfo] = useState({
    weeklyDistance: 150,
    showAdvanced: false,
    raceDay: false
  });
  
  // Calculer le poids idéal (formule de Lorentz simplifiée)
  useEffect(() => {
    let weight;
    if (userProfile.gender === 'male') {
      weight = userProfile.height - 100 - ((userProfile.height - 150) / 4);
    } else {
      weight = userProfile.height - 100 - ((userProfile.height - 150) / 2.5);
    }
    setIdealWeight(Math.round(weight));
  }, [userProfile.height, userProfile.gender]);
  
  // Options des formulaires
  const genderOptions = [
    { value: 'male', label: 'Homme' },
    { value: 'female', label: 'Femme' }
  ];
  
  const activityLevelOptions = [
    { value: 'sedentary', label: 'Sédentaire (peu ou pas d\'activité)', factor: 1.2 },
    { value: 'light', label: 'Légèrement actif (1-3 jours/semaine)', factor: 1.375 },
    { value: 'moderate', label: 'Modérément actif (3-5 jours/semaine)', factor: 1.55 },
    { value: 'active', label: 'Très actif (6-7 jours/semaine)', factor: 1.725 },
    { value: 'veryActive', label: 'Athlète (2x par jour)', factor: 1.9 }
  ];
  
  const cyclingLevelOptions = [
    { value: 'beginner', label: 'Débutant', calorieAdjust: 1 },
    { value: 'amateur', label: 'Amateur', calorieAdjust: 1.1 },
    { value: 'intermediate', label: 'Intermédiaire', calorieAdjust: 1.2 },
    { value: 'advanced', label: 'Avancé', calorieAdjust: 1.3 },
    { value: 'pro', label: 'Professionnel', calorieAdjust: 1.4 }
  ];
  
  // Gérer les changements de valeurs dans les formulaires
  const handleNumberChange = (field, value, min, max) => {
    const numValue = parseInt(value) || min;
    const clampedValue = Math.min(Math.max(numValue, min), max);
    onProfileChange(field, clampedValue);
  };
  
  const handleSelectChange = (field, value) => {
    onProfileChange(field, value);
  };
  
  const handleAdditionalInfoChange = (field, value) => {
    setAdditionalInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Calculer les ajustements pour la journée de course
  const getRaceDayAdjustments = () => {
    if (!additionalInfo.raceDay) return null;
    
    const baseCarbs = nutritionNeeds.carbs;
    const adjustedCarbs = Math.round(baseCarbs * 1.5);
    const adjustedProtein = Math.round(nutritionNeeds.protein * 0.9);
    const adjustedFat = Math.round(nutritionNeeds.fat * 0.7);
    
    // Calculer les nouvelles calories
    const adjustedCalories = Math.round(
      adjustedCarbs * 4 + adjustedProtein * 4 + adjustedFat * 9
    );
    
    return {
      calories: adjustedCalories,
      carbs: adjustedCarbs,
      protein: adjustedProtein,
      fat: adjustedFat,
      carbsPercentage: Math.round((adjustedCarbs * 4 / adjustedCalories) * 100),
      proteinPercentage: Math.round((adjustedProtein * 4 / adjustedCalories) * 100),
      fatPercentage: Math.round((adjustedFat * 9 / adjustedCalories) * 100)
    };
  };
  
  const raceDayData = getRaceDayAdjustments();
  
  // Calculer les pourcentages des macronutriments
  const carbsPercentage = Math.round((nutritionNeeds.carbs * 4 / nutritionNeeds.calories) * 100);
  const proteinPercentage = Math.round((nutritionNeeds.protein * 4 / nutritionNeeds.calories) * 100);
  const fatPercentage = Math.round((nutritionNeeds.fat * 9 / nutritionNeeds.calories) * 100);
  
  return (
    <CalculatorContainer>
      <FormSection>
        <SectionTitle>Profil personnel</SectionTitle>
        <FormGrid>
          <FormGroup>
            <FormLabel>Âge</FormLabel>
            <FormInput
              type="number"
              value={userProfile.age}
              onChange={(e) => handleNumberChange('age', e.target.value, 18, 100)}
              min="18"
              max="100"
            />
          </FormGroup>
          
          <FormGroup>
            <FormLabel>Genre</FormLabel>
            <FormSelect
              value={userProfile.gender}
              onChange={(e) => handleSelectChange('gender', e.target.value)}
            >
              {genderOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FormSelect>
          </FormGroup>
          
          <FormGroup>
            <FormLabel>Poids (kg)</FormLabel>
            <FormInput
              type="number"
              value={userProfile.weight}
              onChange={(e) => handleNumberChange('weight', e.target.value, 40, 150)}
              min="40"
              max="150"
            />
          </FormGroup>
          
          <FormGroup>
            <FormLabel>Taille (cm)</FormLabel>
            <FormInput
              type="number"
              value={userProfile.height}
              onChange={(e) => handleNumberChange('height', e.target.value, 140, 220)}
              min="140"
              max="220"
            />
          </FormGroup>
          
          <FormGroup wide>
            <FormLabel>Niveau d'activité</FormLabel>
            <FormSelect
              value={userProfile.activityLevel}
              onChange={(e) => handleSelectChange('activityLevel', e.target.value)}
            >
              {activityLevelOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FormSelect>
          </FormGroup>
          
          <FormGroup wide>
            <FormLabel>Niveau de cyclisme</FormLabel>
            <FormSelect
              value={cyclingLevel}
              onChange={(e) => setCyclingLevel(e.target.value)}
            >
              {cyclingLevelOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </FormSelect>
          </FormGroup>
        </FormGrid>
        
        <AdvancedToggle onClick={() => handleAdditionalInfoChange('showAdvanced', !additionalInfo.showAdvanced)}>
          {additionalInfo.showAdvanced ? 'Masquer les options avancées' : 'Afficher les options avancées'}
        </AdvancedToggle>
        
        {additionalInfo.showAdvanced && (
          <AdvancedOptions>
            <FormGroup>
              <FormLabel>Distance hebdomadaire (km)</FormLabel>
              <FormInput
                type="number"
                value={additionalInfo.weeklyDistance}
                onChange={(e) => handleAdditionalInfoChange('weeklyDistance', parseInt(e.target.value) || 0)}
                min="0"
                max="1000"
              />
            </FormGroup>
            
            <FormGroup>
              <FormCheckboxContainer>
                <FormCheckbox 
                  type="checkbox" 
                  checked={additionalInfo.raceDay} 
                  onChange={(e) => handleAdditionalInfoChange('raceDay', e.target.checked)}
                />
                <FormCheckboxLabel>Jour de compétition</FormCheckboxLabel>
              </FormCheckboxContainer>
            </FormGroup>
          </AdvancedOptions>
        )}
        
        <WeightStatusContainer>
          <WeightStatusLabel>Poids idéal estimé (performance):</WeightStatusLabel>
          <WeightStatusValue>{idealWeight} kg</WeightStatusValue>
        </WeightStatusContainer>
      </FormSection>
      
      <ResultsSection>
        <SectionTitle>Vos besoins nutritionnels quotidiens</SectionTitle>
        
        <ResultsGrid>
          <ResultCard>
            <ResultIcon>🔥</ResultIcon>
            <ResultContent>
              <ResultValue>{nutritionNeeds.calories}</ResultValue>
              <ResultLabel>Calories</ResultLabel>
            </ResultContent>
          </ResultCard>
          
          <ResultCard>
            <ResultIcon>🍚</ResultIcon>
            <ResultContent>
              <ResultValue>{nutritionNeeds.carbs}g</ResultValue>
              <ResultLabel>Glucides ({carbsPercentage}%)</ResultLabel>
            </ResultContent>
          </ResultCard>
          
          <ResultCard>
            <ResultIcon>🥩</ResultIcon>
            <ResultContent>
              <ResultValue>{nutritionNeeds.protein}g</ResultValue>
              <ResultLabel>Protéines ({proteinPercentage}%)</ResultLabel>
            </ResultContent>
          </ResultCard>
          
          <ResultCard>
            <ResultIcon>🥑</ResultIcon>
            <ResultContent>
              <ResultValue>{nutritionNeeds.fat}g</ResultValue>
              <ResultLabel>Lipides ({fatPercentage}%)</ResultLabel>
            </ResultContent>
          </ResultCard>
          
          <ResultCard>
            <ResultIcon>💧</ResultIcon>
            <ResultContent>
              <ResultValue>{nutritionNeeds.hydration}ml</ResultValue>
              <ResultLabel>Hydratation</ResultLabel>
            </ResultContent>
          </ResultCard>
        </ResultsGrid>
        
        {additionalInfo.raceDay && raceDayData && (
          <RaceDaySection>
            <RaceDayTitle>Ajustements pour jour de compétition</RaceDayTitle>
            <RaceDayDescription>
              Pour une performance optimale, augmentez vos glucides et réduisez légèrement les lipides.
            </RaceDayDescription>
            
            <RaceDayGrid>
              <RaceDayCard>
                <RaceDayValue>{raceDayData.calories}</RaceDayValue>
                <RaceDayLabel>Calories</RaceDayLabel>
              </RaceDayCard>
              
              <RaceDayCard highlight>
                <RaceDayValue>{raceDayData.carbs}g</RaceDayValue>
                <RaceDayLabel>Glucides ({raceDayData.carbsPercentage}%)</RaceDayLabel>
                <RaceDayChange>+{Math.round((raceDayData.carbs - nutritionNeeds.carbs) / nutritionNeeds.carbs * 100)}%</RaceDayChange>
              </RaceDayCard>
              
              <RaceDayCard>
                <RaceDayValue>{raceDayData.protein}g</RaceDayValue>
                <RaceDayLabel>Protéines ({raceDayData.proteinPercentage}%)</RaceDayLabel>
                <RaceDayChange negative>-{Math.round((nutritionNeeds.protein - raceDayData.protein) / nutritionNeeds.protein * 100)}%</RaceDayChange>
              </RaceDayCard>
              
              <RaceDayCard>
                <RaceDayValue>{raceDayData.fat}g</RaceDayValue>
                <RaceDayLabel>Lipides ({raceDayData.fatPercentage}%)</RaceDayLabel>
                <RaceDayChange negative>-{Math.round((nutritionNeeds.fat - raceDayData.fat) / nutritionNeeds.fat * 100)}%</RaceDayChange>
              </RaceDayCard>
            </RaceDayGrid>
          </RaceDaySection>
        )}
        
        <CalorieAdjustment>
          <NoteContainer>
            <NoteIcon>ℹ️</NoteIcon>
            <NoteText>
              Note : Ces calculs sont basés sur des estimations pour un cycliste de niveau {
                cyclingLevelOptions.find(option => option.value === cyclingLevel)?.label.toLowerCase()
              }. Ajustez ces valeurs en fonction de vos besoins spécifiques et consultez un nutritionniste pour un plan personnalisé.
            </NoteText>
          </NoteContainer>
        </CalorieAdjustment>
      </ResultsSection>
    </CalculatorContainer>
  );
};

// Styled Components
const CalculatorContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const FormSection = styled.div`
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
  grid-column: ${props => props.wide ? 'span 2' : 'auto'};
  
  @media (max-width: 600px) {
    grid-column: span 1;
  }
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

const AdvancedToggle = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  cursor: pointer;
  padding: 5px 0;
  text-decoration: underline;
  align-self: flex-start;
  
  &:hover {
    color: white;
  }
`;

const AdvancedOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FormCheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const FormCheckbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: #3498db;
`;

const FormCheckboxLabel = styled.label`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
`;

const WeightStatusContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 15px 20px;
  border-radius: 10px;
  margin-top: 10px;
`;

const WeightStatusLabel = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
`;

const WeightStatusValue = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
`;

const ResultsSection = styled.div`
  background: rgba(0, 0, 0, 0.1);
  border-radius: 15px;
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const ResultCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    background: rgba(255, 255, 255, 0.15);
  }
  
  &:first-child {
    grid-column: span 2;
    
    @media (max-width: 600px) {
      grid-column: span 1;
    }
  }
`;

const ResultIcon = styled.div`
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
`;

const ResultContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const ResultValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
`;

const ResultLabel = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
`;

const CalorieAdjustment = styled.div`
  margin-top: 20px;
`;

const NoteContainer = styled.div`
  display: flex;
  gap: 15px;
  background: rgba(255, 255, 255, 0.05);
  padding: 15px;
  border-radius: 10px;
  border-left: 3px solid rgba(255, 255, 255, 0.2);
`;

const NoteIcon = styled.div`
  font-size: 1.5rem;
`;

const NoteText = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.5;
  margin: 0;
`;

const RaceDaySection = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin-top: 10px;
  border-left: 3px solid #e74c3c;
`;

const RaceDayTitle = styled.h4`
  font-size: 1.2rem;
  margin: 0 0 10px 0;
  color: white;
`;

const RaceDayDescription = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 15px 0;
`;

const RaceDayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const RaceDayCard = styled.div`
  background: ${props => props.highlight ? 'rgba(231, 76, 60, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  border: ${props => props.highlight ? '1px solid rgba(231, 76, 60, 0.5)' : 'none'};
`;

const RaceDayValue = styled.div`
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
`;

const RaceDayLabel = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 4px;
`;

const RaceDayChange = styled.div`
  font-size: 0.8rem;
  color: ${props => props.negative ? '#e74c3c' : '#2ecc71'};
  font-weight: 600;
`;

export default NutritionCalculator;
