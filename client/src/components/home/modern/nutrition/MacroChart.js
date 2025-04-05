import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import Chart from 'chart.js/auto';

const MacroChart = ({ nutritionNeeds, animationComplexity }) => {
  const doughnutChartRef = useRef(null);
  const doughnutChartInstance = useRef(null);
  const lineChartRef = useRef(null);
  const lineChartInstance = useRef(null);
  
  const [activeNutrient, setActiveNutrient] = useState('carbs');
  const [mealTime, setMealTime] = useState('breakfast');
  
  // Couleurs pour les macronutriments
  const macroColors = {
    carbs: '#f1c40f',   // Jaune
    protein: '#3498db', // Bleu
    fat: '#e74c3c'      // Rouge
  };
  
  // Noms des macronutriments
  const macroNames = {
    carbs: 'Glucides',
    protein: 'Protéines',
    fat: 'Lipides'
  };
  
  // Répartition des macros par type de repas
  const mealDistribution = {
    breakfast: {
      carbs: 0.3,
      protein: 0.2,
      fat: 0.2
    },
    lunch: {
      carbs: 0.3,
      protein: 0.4,
      fat: 0.3
    },
    dinner: {
      carbs: 0.2,
      protein: 0.3,
      fat: 0.4
    },
    snacks: {
      carbs: 0.2,
      protein: 0.1,
      fat: 0.1
    }
  };
  
  // Noms des repas
  const mealNames = {
    breakfast: 'Petit-déjeuner',
    lunch: 'Déjeuner',
    dinner: 'Dîner',
    snacks: 'Collations'
  };
  
  // Initialisation et mise à jour du graphique en anneau (macro répartition)
  useEffect(() => {
    if (doughnutChartRef.current) {
      // Détruire le graphique précédent s'il existe
      if (doughnutChartInstance.current) {
        doughnutChartInstance.current.destroy();
      }
      
      const ctx = doughnutChartRef.current.getContext('2d');
      
      // Données des macros en grammes
      const macroData = [
        nutritionNeeds.carbs, 
        nutritionNeeds.protein, 
        nutritionNeeds.fat
      ];
      
      // Données des macros en calories
      const calorieData = [
        nutritionNeeds.carbs * 4,  // 4 calories par gramme de glucides
        nutritionNeeds.protein * 4, // 4 calories par gramme de protéines
        nutritionNeeds.fat * 9      // 9 calories par gramme de lipides
      ];
      
      // Création du graphique en anneau
      doughnutChartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Glucides', 'Protéines', 'Lipides'],
          datasets: [{
            data: macroData,
            backgroundColor: [macroColors.carbs, macroColors.protein, macroColors.fat],
            borderColor: 'rgba(255, 255, 255, 0.5)',
            borderWidth: 1,
            hoverOffset: 15
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: 'white',
                font: {
                  size: 14
                },
                padding: 20
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw || 0;
                  const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((value / total) * 100);
                  const calories = context.dataIndex === 0 ? value * 4 : 
                                  context.dataIndex === 1 ? value * 4 : value * 9;
                  return `${label}: ${value}g (${percentage}%, ${calories} kcal)`;
                }
              }
            }
          },
          cutout: '70%',
          animation: {
            animateRotate: animationComplexity !== 'low',
            animateScale: animationComplexity !== 'low'
          }
        }
      });
      
      // Animation lorsque le composant est monté
      if (animationComplexity !== 'low') {
        gsap.from('.doughnut-center-text', {
          opacity: 0,
          scale: 0.8,
          duration: 1,
          ease: 'elastic.out(1, 0.5)',
          delay: 0.5
        });
      }
    }
  }, [nutritionNeeds, animationComplexity]);
  
  // Initialisation et mise à jour du graphique linéaire (distribution par repas)
  useEffect(() => {
    if (lineChartRef.current) {
      // Détruire le graphique précédent s'il existe
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
      }
      
      const ctx = lineChartRef.current.getContext('2d');
      
      // Données pour chaque repas
      const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];
      const mealLabels = meals.map(meal => mealNames[meal]);
      
      // Calcul des quantités par repas
      const datasets = [
        {
          label: 'Glucides (g)',
          data: meals.map(meal => Math.round(nutritionNeeds.carbs * mealDistribution[meal].carbs)),
          backgroundColor: `${macroColors.carbs}40`,
          borderColor: macroColors.carbs,
          tension: 0.3,
          fill: true
        },
        {
          label: 'Protéines (g)',
          data: meals.map(meal => Math.round(nutritionNeeds.protein * mealDistribution[meal].protein)),
          backgroundColor: `${macroColors.protein}40`,
          borderColor: macroColors.protein,
          tension: 0.3,
          fill: true
        },
        {
          label: 'Lipides (g)',
          data: meals.map(meal => Math.round(nutritionNeeds.fat * mealDistribution[meal].fat)),
          backgroundColor: `${macroColors.fat}40`,
          borderColor: macroColors.fat,
          tension: 0.3,
          fill: true
        }
      ];
      
      // Création du graphique linéaire
      lineChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: mealLabels,
          datasets: datasets
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: 'white',
                padding: 15
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false
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
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          },
          animation: {
            duration: animationComplexity === 'low' ? 0 : 1000
          }
        }
      });
    }
  }, [nutritionNeeds, animationComplexity]);
  
  // Changement de macronutriment actif
  const handleMacroClick = (macro) => {
    setActiveNutrient(macro);
    
    // Animation de transition
    if (animationComplexity !== 'low') {
      gsap.to('.nutrient-details', {
        opacity: 0,
        y: -20,
        duration: 0.3,
        onComplete: () => {
          gsap.to('.nutrient-details', {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out'
          });
        }
      });
    }
  };
  
  // Changement de repas actif
  const handleMealClick = (meal) => {
    setMealTime(meal);
  };
  
  // Obtenir les sources alimentaires recommandées par macro
  const getFoodSources = (macro) => {
    const foodSources = {
      carbs: [
        { name: 'Pâtes complètes', quantity: '80g', timing: 'avant' },
        { name: 'Riz basmati', quantity: '70g', timing: 'avant' },
        { name: 'Patate douce', quantity: '150g', timing: 'avant' },
        { name: 'Banane', quantity: '1 moyenne', timing: 'pendant' },
        { name: 'Barre énergétique', quantity: '1 unité', timing: 'pendant' },
        { name: 'Gel énergétique', quantity: '1 sachet', timing: 'pendant' },
        { name: 'Boisson maltodextrine', quantity: '500ml', timing: 'pendant' }
      ],
      protein: [
        { name: 'Blanc de poulet', quantity: '120g', timing: 'après' },
        { name: 'Thon en conserve', quantity: '100g', timing: 'après' },
        { name: 'Œufs', quantity: '2 unités', timing: 'après' },
        { name: 'Yaourt grec', quantity: '150g', timing: 'après' },
        { name: 'Fromage blanc', quantity: '100g', timing: 'après' },
        { name: 'Protéines whey', quantity: '25g', timing: 'après' },
        { name: 'Lentilles', quantity: '60g', timing: 'avant' }
      ],
      fat: [
        { name: 'Avocat', quantity: '1/2', timing: 'avant' },
        { name: 'Huile d'olive', quantity: '1 c. à soupe', timing: 'avant' },
        { name: 'Noix', quantity: '30g', timing: 'avant' },
        { name: 'Amandes', quantity: '25g', timing: 'avant' },
        { name: 'Beurre de cacahuète', quantity: '1 c. à soupe', timing: 'avant' },
        { name: 'Graines de chia', quantity: '1 c. à soupe', timing: 'avant' },
        { name: 'Saumon', quantity: '100g', timing: 'après' }
      ]
    };
    
    return foodSources[macro];
  };
  
  // Caractéristiques et fonctions des macronutriments
  const getMacroInfo = (macro) => {
    const macroInfo = {
      carbs: {
        title: 'Glucides - Le carburant principal',
        description: 'Les glucides sont la source d\'énergie principale pour les cyclistes, particulièrement lors d\'efforts intenses et prolongés. Ils se stockent sous forme de glycogène dans les muscles et le foie.',
        timing: 'Avant et pendant l\'effort',
        benefits: ['Énergie rapide', 'Prévention de la fatigue', 'Amélioration des performances', 'Préservation du glycogène']
      },
      protein: {
        title: 'Protéines - La réparation musculaire',
        description: 'Les protéines sont essentielles pour la réparation et la croissance musculaire. Elles participent à la récupération après l\'effort et au maintien de la masse musculaire.',
        timing: 'Après l\'effort principalement',
        benefits: ['Réparation musculaire', 'Récupération accélérée', 'Prévention des blessures', 'Maintien de la masse maigre']
      },
      fat: {
        title: 'Lipides - L\'énergie d\'endurance',
        description: 'Les lipides constituent une réserve d\'énergie importante pour les efforts de longue durée. Ils sont particulièrement utilisés lors d\'exercices à intensité modérée.',
        timing: 'Quotidiennement, moins avant l\'effort',
        benefits: ['Énergie prolongée', 'Absorption des vitamines', 'Anti-inflammatoire', 'Satiété']
      }
    };
    
    return macroInfo[macro];
  };
  
  // Calculer les besoins spécifiques pour le repas et le nutriment sélectionnés
  const calculateMealNutrients = () => {
    return {
      carbs: Math.round(nutritionNeeds.carbs * mealDistribution[mealTime].carbs),
      protein: Math.round(nutritionNeeds.protein * mealDistribution[mealTime].protein),
      fat: Math.round(nutritionNeeds.fat * mealDistribution[mealTime].fat)
    };
  };
  
  const mealNutrients = calculateMealNutrients();
  const macroInfo = getMacroInfo(activeNutrient);
  const foodSources = getFoodSources(activeNutrient);
  
  return (
    <ChartContainer>
      <ChartsRow>
        {/* Graphique en anneau des macronutriments */}
        <DoughnutChartContainer>
          <ChartHeading>Répartition des macronutriments</ChartHeading>
          <ChartDescription>
            Visualisez l'équilibre des macronutriments recommandé pour optimiser vos performances cyclistes
          </ChartDescription>
          <RelativeContainer>
            <canvas ref={doughnutChartRef}></canvas>
            <DoughnutCenterText className="doughnut-center-text">
              <CalorieValue>{nutritionNeeds.calories}</CalorieValue>
              <CalorieLabel>kcal / jour</CalorieLabel>
            </DoughnutCenterText>
          </RelativeContainer>
          <MacroButtons>
            {Object.entries(macroNames).map(([key, name]) => (
              <MacroButton
                key={key}
                active={activeNutrient === key}
                color={macroColors[key]}
                onClick={() => handleMacroClick(key)}
              >
                {name}
              </MacroButton>
            ))}
          </MacroButtons>
        </DoughnutChartContainer>
        
        {/* Information sur les macronutriments */}
        <NutrientDetailsContainer className="nutrient-details">
          <NutrientTitle color={macroColors[activeNutrient]}>
            {macroInfo.title}
          </NutrientTitle>
          <NutrientDescription>
            {macroInfo.description}
          </NutrientDescription>
          <NutrientTiming>
            <TimingIcon>⏱️</TimingIcon>
            <TimingText><strong>Timing optimal:</strong> {macroInfo.timing}</TimingText>
          </NutrientTiming>
          <NutrientBenefits>
            <BenefitsTitle>Bénéfices:</BenefitsTitle>
            <BenefitsList>
              {macroInfo.benefits.map((benefit, index) => (
                <BenefitItem key={index}>
                  <BenefitIcon color={macroColors[activeNutrient]}>✓</BenefitIcon>
                  <BenefitText>{benefit}</BenefitText>
                </BenefitItem>
              ))}
            </BenefitsList>
          </NutrientBenefits>
        </NutrientDetailsContainer>
      </ChartsRow>
      
      <ChartDivider />
      
      {/* Distribution par repas */}
      <MealDistributionContainer>
        <ChartHeading>Distribution par repas</ChartHeading>
        <ChartDescription>
          Répartition optimale des nutriments au cours de la journée pour soutenir votre entraînement
        </ChartDescription>
        
        <MealButtons>
          {Object.entries(mealNames).map(([key, name]) => (
            <MealButton
              key={key}
              active={mealTime === key}
              onClick={() => handleMealClick(key)}
            >
              {name}
            </MealButton>
          ))}
        </MealButtons>
        
        <MealDetailContent>
          <MealChart>
            <canvas ref={lineChartRef}></canvas>
          </MealChart>
          
          <MealNutrientDetail>
            <MealTitle>{mealNames[mealTime]}</MealTitle>
            <NutrientValues>
              {Object.entries(mealNutrients).map(([nutrient, value]) => (
                <NutrientValue key={nutrient}>
                  <NutrientDot color={macroColors[nutrient]} />
                  <NutrientName>{macroNames[nutrient]}</NutrientName>
                  <NutrientAmount>{value}g</NutrientAmount>
                </NutrientValue>
              ))}
              <NutrientValue>
                <NutrientDot color="#9b59b6" />
                <NutrientName>Calories</NutrientName>
                <NutrientAmount>
                  {Math.round(
                    mealNutrients.carbs * 4 + 
                    mealNutrients.protein * 4 + 
                    mealNutrients.fat * 9
                  )} kcal
                </NutrientAmount>
              </NutrientValue>
            </NutrientValues>
            
            <RecommendedFoods>
              <FoodsTitle>Sources recommandées de {macroNames[activeNutrient].toLowerCase()}:</FoodsTitle>
              <FoodsList>
                {foodSources.slice(0, 5).map((food, index) => (
                  <FoodItem key={index}>
                    <FoodName>{food.name}</FoodName>
                    <FoodInfo>
                      <FoodQuantity>{food.quantity}</FoodQuantity>
                      <FoodTiming>
                        {food.timing === 'avant' ? '🔵 Avant' : 
                         food.timing === 'pendant' ? '🟢 Pendant' : '🟠 Après'}
                      </FoodTiming>
                    </FoodInfo>
                  </FoodItem>
                ))}
              </FoodsList>
            </RecommendedFoods>
          </MealNutrientDetail>
        </MealDetailContent>
      </MealDistributionContainer>
    </ChartContainer>
  );
};

// Styled Components
const ChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 40px;
`;

const ChartsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const DoughnutChartContainer = styled.div`
  background: rgba(0, 0, 0, 0.1);
  border-radius: 15px;
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ChartHeading = styled.h3`
  font-size: 1.5rem;
  margin: 0;
  color: white;
`;

const ChartDescription = styled.p`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
`;

const RelativeContainer = styled.div`
  position: relative;
  margin: 20px 0;
`;

const DoughnutCenterText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
`;

const CalorieValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: white;
`;

const CalorieLabel = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
`;

const MacroButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 10px;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
`;

const MacroButton = styled.button`
  background: ${props => props.active ? `${props.color}` : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.active ? '#000' : 'white'};
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: ${props => props.active ? '600' : '400'};
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.active ? `${props.color}` : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const NutrientDetailsContainer = styled.div`
  background: rgba(0, 0, 0, 0.1);
  border-radius: 15px;
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const NutrientTitle = styled.h3`
  font-size: 1.5rem;
  margin: 0;
  color: ${props => props.color || 'white'};
`;

const NutrientDescription = styled.p`
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
`;

const NutrientTiming = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: 8px;
  margin-top: 5px;
`;

const TimingIcon = styled.div`
  font-size: 1.2rem;
`;

const TimingText = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
`;

const NutrientBenefits = styled.div`
  margin-top: 10px;
`;

const BenefitsTitle = styled.h4`
  font-size: 1.1rem;
  margin: 0 0 10px 0;
  color: white;
`;

const BenefitsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BenefitItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const BenefitIcon = styled.div`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${props => props.color || '#3498db'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  font-weight: bold;
`;

const BenefitText = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
`;

const ChartDivider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 10px 0;
`;

const MealDistributionContainer = styled.div`
  background: rgba(0, 0, 0, 0.1);
  border-radius: 15px;
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const MealButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
`;

const MealButton = styled.button`
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: ${props => props.active ? '600' : '400'};
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const MealDetailContent = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 30px;
  margin-top: 20px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const MealChart = styled.div`
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 20px;
`;

const MealNutrientDetail = styled.div`
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const MealTitle = styled.h4`
  font-size: 1.3rem;
  margin: 0;
  color: white;
`;

const NutrientValues = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const NutrientValue = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const NutrientDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.color || '#3498db'};
`;

const NutrientName = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  flex: 1;
`;

const NutrientAmount = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: white;
`;

const RecommendedFoods = styled.div`
  margin-top: 10px;
`;

const FoodsTitle = styled.h5`
  font-size: 1rem;
  margin: 0 0 15px 0;
  color: white;
`;

const FoodsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const FoodItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 15px;
  border-radius: 8px;
`;

const FoodName = styled.div`
  font-size: 0.9rem;
  color: white;
`;

const FoodInfo = styled.div`
  display: flex;
  gap: 15px;
`;

const FoodQuantity = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(0, 0, 0, 0.2);
  padding: 3px 8px;
  border-radius: 4px;
`;

const FoodTiming = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
`;

export default MacroChart;
