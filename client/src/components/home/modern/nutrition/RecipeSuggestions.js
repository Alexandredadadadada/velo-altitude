import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

// Données fictives pour les suggestions de recettes
const mockRecipes = [
  {
    id: 1,
    title: 'Porridge énergétique',
    type: 'pre-ride',
    calories: 450,
    protein: 15,
    carbs: 65,
    fat: 12,
    preparationTime: 10,
    image: '/assets/images/nutrition/porridge.jpg',
    ingredients: ['Flocons d\'avoine', 'Lait', 'Banane', 'Miel', 'Noix'],
    difficulty: 'Facile'
  },
  {
    id: 2,
    title: 'Barre énergétique maison',
    type: 'during-ride',
    calories: 220,
    protein: 5,
    carbs: 40,
    fat: 8,
    preparationTime: 30,
    image: '/assets/images/nutrition/energy-bar.jpg',
    ingredients: ['Dattes', 'Noix', 'Graines de chia', 'Miel', 'Flocons d\'avoine'],
    difficulty: 'Moyenne'
  },
  {
    id: 3,
    title: 'Smoothie récupération',
    type: 'post-ride',
    calories: 350,
    protein: 25,
    carbs: 45,
    fat: 5,
    preparationTime: 5,
    image: '/assets/images/nutrition/recovery-smoothie.jpg',
    ingredients: ['Banane', 'Protéine whey', 'Lait d\'amande', 'Myrtilles', 'Miel'],
    difficulty: 'Facile'
  },
  {
    id: 4,
    title: 'Bowl de quinoa et légumes',
    type: 'pre-ride',
    calories: 520,
    protein: 18,
    carbs: 80,
    fat: 15,
    preparationTime: 25,
    image: '/assets/images/nutrition/quinoa-bowl.jpg',
    ingredients: ['Quinoa', 'Avocat', 'Tomates cerises', 'Oeuf', 'Épinards'],
    difficulty: 'Moyenne'
  }
];

const RecipeSuggestions = ({ nutritionNeeds, animationComplexity = 'medium' }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredRecipes, setFilteredRecipes] = useState(mockRecipes);
  
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredRecipes(mockRecipes);
    } else {
      setFilteredRecipes(mockRecipes.filter(recipe => recipe.type === activeFilter));
    }
  }, [activeFilter]);

  // Animations adaptées selon la complexité
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: animationComplexity === 'high' ? 0.2 : 0.1,
        duration: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: animationComplexity === 'high' ? 0.5 : 0.3 }
    }
  };

  return (
    <Container
      as={motion.div}
      variants={animationComplexity !== 'none' ? containerVariants : {}}
      initial={animationComplexity !== 'none' ? "hidden" : false}
      animate={animationComplexity !== 'none' ? "visible" : false}
    >
      <Header>
        <Title>Suggestions de recettes adaptées</Title>
        <Description>
          Basé sur votre profil et vos besoins nutritionnels pour le cyclisme
        </Description>
      </Header>
      
      <FilterContainer>
        <FilterButton 
          active={activeFilter === 'all'} 
          onClick={() => setActiveFilter('all')}
        >
          Toutes
        </FilterButton>
        <FilterButton 
          active={activeFilter === 'pre-ride'} 
          onClick={() => setActiveFilter('pre-ride')}
        >
          Avant sortie
        </FilterButton>
        <FilterButton 
          active={activeFilter === 'during-ride'} 
          onClick={() => setActiveFilter('during-ride')}
        >
          Pendant sortie
        </FilterButton>
        <FilterButton 
          active={activeFilter === 'post-ride'} 
          onClick={() => setActiveFilter('post-ride')}
        >
          Récupération
        </FilterButton>
      </FilterContainer>

      <RecipesGrid>
        {filteredRecipes.map(recipe => (
          <RecipeCard
            key={recipe.id}
            as={motion.div}
            variants={animationComplexity !== 'none' ? itemVariants : {}}
          >
            <RecipeImage>
              <img src={recipe.image} alt={recipe.title} />
              <RecipeType>{recipe.type === 'pre-ride' ? 'Avant sortie' : 
                          recipe.type === 'during-ride' ? 'Pendant sortie' : 'Récupération'}</RecipeType>
            </RecipeImage>
            <RecipeContent>
              <RecipeTitle>{recipe.title}</RecipeTitle>
              <RecipeStats>
                <Stat><Label>Calories:</Label> {recipe.calories} kcal</Stat>
                <Stat><Label>Protéines:</Label> {recipe.protein}g</Stat>
                <Stat><Label>Glucides:</Label> {recipe.carbs}g</Stat>
              </RecipeStats>
              <RecipeDetails>
                <PrepTime>
                  <Icon className="fas fa-clock" />
                  {recipe.preparationTime} min
                </PrepTime>
                <Difficulty>
                  <Icon className="fas fa-signal" />
                  {recipe.difficulty}
                </Difficulty>
              </RecipeDetails>
              <IngredientsList>
                {recipe.ingredients.map((ingredient, index) => (
                  <Ingredient key={index}>{ingredient}</Ingredient>
                ))}
              </IngredientsList>
              <ViewRecipeButton>
                Voir recette complète
              </ViewRecipeButton>
            </RecipeContent>
          </RecipeCard>
        ))}
      </RecipesGrid>
      
      <MoreButton>
        Découvrir plus de recettes
        <i className="fas fa-chevron-right"></i>
      </MoreButton>
    </Container>
  );
};

// Styled components
const Container = styled.div`
  width: 100%;
  padding: 20px;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h3`
  font-size: 1.8rem;
  margin-bottom: 10px;
  color: #2c3e50;
`;

const Description = styled.p`
  font-size: 1.1rem;
  color: #7f8c8d;
  max-width: 600px;
  margin: 0 auto;
`;

const FilterContainer = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 25px;
`;

const FilterButton = styled.button`
  padding: 8px 16px;
  border-radius: 30px;
  border: none;
  background-color: ${props => props.active ? '#3498db' : '#ecf0f1'};
  color: ${props => props.active ? 'white' : '#34495e'};
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.active ? '#2980b9' : '#dfe6e9'};
  }
`;

const RecipesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
`;

const RecipeCard = styled.div`
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  background-color: white;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
  }
`;

const RecipeImage = styled.div`
  height: 180px;
  position: relative;
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }
  
  ${RecipeCard}:hover & img {
    transform: scale(1.05);
  }
`;

const RecipeType = styled.span`
  position: absolute;
  top: 15px;
  right: 15px;
  background-color: rgba(52, 152, 219, 0.9);
  color: white;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
`;

const RecipeContent = styled.div`
  padding: 20px;
`;

const RecipeTitle = styled.h4`
  font-size: 1.3rem;
  margin: 0 0 15px;
  color: #2c3e50;
`;

const RecipeStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 15px;
`;

const Stat = styled.div`
  font-size: 0.9rem;
  color: #34495e;
  display: flex;
  flex-direction: column;
`;

const Label = styled.span`
  font-size: 0.75rem;
  color: #7f8c8d;
  margin-bottom: 2px;
`;

const RecipeDetails = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 0.9rem;
`;

const PrepTime = styled.div`
  display: flex;
  align-items: center;
  color: #7f8c8d;
`;

const Difficulty = styled.div`
  display: flex;
  align-items: center;
  color: #7f8c8d;
`;

const Icon = styled.i`
  margin-right: 5px;
  color: #3498db;
`;

const IngredientsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 15px;
`;

const Ingredient = styled.span`
  background-color: #f1f5f9;
  color: #34495e;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
`;

const ViewRecipeButton = styled.button`
  width: 100%;
  padding: 10px;
  border: none;
  background-color: #3498db;
  color: white;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2980b9;
  }
`;

const MoreButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 0 auto;
  padding: 12px 25px;
  background-color: transparent;
  border: 2px solid #3498db;
  color: #3498db;
  font-weight: bold;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #3498db;
    color: white;
  }
  
  i {
    font-size: 0.8rem;
  }
`;

export default RecipeSuggestions;
