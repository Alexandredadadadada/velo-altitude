import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import styled from 'styled-components';
import { useInView } from 'react-intersection-observer';

// Sous-composants
import MacroChart from './nutrition/MacroChart';
import NutritionCalculator from './nutrition/NutritionCalculator';
import HydrationPlanner from './nutrition/HydrationPlanner';
import RecipeSuggestions from './nutrition/RecipeSuggestions';

const NutritionSection = ({ animationComplexity, className }) => {
  const [ref, inView] = useInView({
    threshold: 0.2,
    triggerOnce: true
  });
  
  const controls = useAnimation();
  
  // États pour les calculs nutritionnels
  const [userProfile, setUserProfile] = useState({
    weight: 70,
    height: 175,
    age: 35,
    gender: 'male',
    activityLevel: 'moderate'
  });
  
  const [nutritionNeeds, setNutritionNeeds] = useState({
    calories: 2500,
    carbs: 313,
    protein: 125,
    fat: 83,
    hydration: 3000
  });
  
  const [activeTab, setActiveTab] = useState('calculator');
  
  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [inView, controls]);
  
  // Calcule les besoins nutritionnels en fonction du profil
  useEffect(() => {
    calculateNutritionNeeds(userProfile);
  }, [userProfile]);
  
  const calculateNutritionNeeds = (profile) => {
    // Formule de Harris-Benedict pour le métabolisme de base
    let bmr;
    if (profile.gender === 'male') {
      bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
    } else {
      bmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
    }
    
    // Facteur d'activité
    const activityFactors = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      veryActive: 1.9
    };
    
    const calories = Math.round(bmr * activityFactors[profile.activityLevel]);
    
    // Répartition des macronutriments pour un cycliste
    const carbs = Math.round((calories * 0.5) / 4); // 50% des calories, 4 calories par gramme
    const protein = Math.round((calories * 0.2) / 4); // 20% des calories, 4 calories par gramme
    const fat = Math.round((calories * 0.3) / 9); // 30% des calories, 9 calories par gramme
    
    // Hydratation recommandée en ml
    const hydration = Math.round(profile.weight * 35 + (profile.activityLevel === 'active' || profile.activityLevel === 'veryActive' ? 500 : 0));
    
    setNutritionNeeds({
      calories,
      carbs,
      protein,
      fat,
      hydration
    });
  };
  
  // Modifie le profil utilisateur
  const handleProfileChange = (field, value) => {
    setUserProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
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
  
  // Contenu des onglets
  const renderTabContent = () => {
    switch(activeTab) {
      case 'calculator':
        return (
          <NutritionCalculator 
            userProfile={userProfile}
            nutritionNeeds={nutritionNeeds}
            onProfileChange={handleProfileChange}
            animationComplexity={animationComplexity}
          />
        );
      case 'macros':
        return (
          <MacroChart 
            nutritionNeeds={nutritionNeeds}
            animationComplexity={animationComplexity}
          />
        );
      case 'hydration':
        return (
          <HydrationPlanner 
            weight={userProfile.weight}
            activityLevel={userProfile.activityLevel}
            dailyNeeds={nutritionNeeds.hydration}
            animationComplexity={animationComplexity}
          />
        );
      case 'recipes':
        return (
          <RecipeSuggestions
            nutritionNeeds={nutritionNeeds}
            animationComplexity={animationComplexity}
          />
        );
      default:
        return null;
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
      <SectionHeader variants={itemVariants}>
        <h2>Nutrition optimisée pour cyclistes</h2>
        <p>Des plans alimentaires personnalisés, des calculs précis et des conseils adaptés à votre profil et vos objectifs</p>
      </SectionHeader>
      
      <TabsContainer variants={itemVariants}>
        <TabButton 
          active={activeTab === 'calculator'} 
          onClick={() => setActiveTab('calculator')}
        >
          Calculateur
        </TabButton>
        <TabButton 
          active={activeTab === 'macros'} 
          onClick={() => setActiveTab('macros')}
        >
          Macronutriments
        </TabButton>
        <TabButton 
          active={activeTab === 'hydration'} 
          onClick={() => setActiveTab('hydration')}
        >
          Hydratation
        </TabButton>
        <TabButton 
          active={activeTab === 'recipes'} 
          onClick={() => setActiveTab('recipes')}
        >
          Recettes
        </TabButton>
      </TabsContainer>
      
      <TabContent variants={itemVariants}>
        {renderTabContent()}
      </TabContent>
      
      <NutritionTips variants={itemVariants}>
        <TipCard>
          <TipIcon>⚡</TipIcon>
          <TipContent>
            <TipTitle>Avant l'effort</TipTitle>
            <TipDescription>
              Consommez un repas riche en glucides complexes 2-3h avant de pédaler pour optimiser vos réserves d'énergie.
            </TipDescription>
          </TipContent>
        </TipCard>
        
        <TipCard>
          <TipIcon>🚴</TipIcon>
          <TipContent>
            <TipTitle>Pendant l'effort</TipTitle>
            <TipDescription>
              Visez 30-60g de glucides par heure d'exercice pour maintenir votre glycémie et prévenir la fatigue.
            </TipDescription>
          </TipContent>
        </TipCard>
        
        <TipCard>
          <TipIcon>🔄</TipIcon>
          <TipContent>
            <TipTitle>Récupération</TipTitle>
            <TipDescription>
              Dans les 30 minutes après l'effort, consommez un ratio de 3:1 de glucides et protéines pour optimiser la récupération.
            </TipDescription>
          </TipContent>
        </TipCard>
      </NutritionTips>
    </SectionContainer>
  );
};

// Styled Components
const SectionContainer = styled(motion.section)`
  padding: 100px 20px;
  background: linear-gradient(135deg, #136a8a 0%, #267871 100%);
  position: relative;
  overflow: hidden;
  color: white;
`;

const SectionHeader = styled(motion.div)`
  text-align: center;
  margin-bottom: 60px;
  
  h2 {
    font-size: 3rem;
    margin-bottom: 20px;
    color: white;
    
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

const TabsContainer = styled(motion.div)`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 40px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    gap: 5px;
  }
`;

const TabButton = styled.button`
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 30px;
  cursor: pointer;
  font-weight: ${props => props.active ? '600' : '400'};
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  @media (max-width: 768px) {
    padding: 10px 15px;
    font-size: 0.9rem;
  }
`;

const TabContent = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 60px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const NutritionTips = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TipCard = styled.div`
  display: flex;
  gap: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 25px;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
`;

const TipIcon = styled.div`
  font-size: 2rem;
  background: rgba(255, 255, 255, 0.2);
  height: 60px;
  width: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const TipContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TipTitle = styled.h4`
  font-size: 1.3rem;
  margin: 0;
  color: white;
`;

const TipDescription = styled.p`
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
`;

export default NutritionSection;
