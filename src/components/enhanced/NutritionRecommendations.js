import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme
} from '@mui/material';
import {
  Restaurant,
  ExpandMore,
  Fastfood,
  LocalDrink,
  DirectionsBike,
  EggAlt,
  FitnessCenter,
  Opacity,
  GrainOutlined,
  LocalFireDepartment,
  RestaurantMenu,
  AcUnit,
  SetMeal,
  Cake,
  Info
} from '@mui/icons-material';
import nutritionService from '../../services/nutritionService';

/**
 * Composant de recommandations nutritionnelles personnalisées
 * basées sur le profil, les objectifs et l'activité du cycliste
 */
const NutritionRecommendations = ({ userId, nutritionData }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Catégories de recommandations
  const categories = [
    { id: 'all', label: 'Tout', icon: <Restaurant /> },
    { id: 'macros', label: 'Macronutriments', icon: <Fastfood /> },
    { id: 'hydration', label: 'Hydratation', icon: <Opacity /> },
    { id: 'pre-workout', label: 'Avant l\'effort', icon: <DirectionsBike /> },
    { id: 'during-workout', label: 'Pendant l\'effort', icon: <LocalFireDepartment /> },
    { id: 'recovery', label: 'Récupération', icon: <FitnessCenter /> }
  ];

  // Récupérer les recommandations nutritionnelles
  useEffect(() => {
    if (nutritionData) {
      generateRecommendationsFromData(nutritionData);
    } else if (userId) {
      fetchRecommendations();
    }
  }, [userId, nutritionData]);

  // Récupération des données si non fournies
  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Récupérer les données du profil et d'activité de l'utilisateur
      const data = await nutritionService.getUserNutritionData(userId);
      
      if (!data) {
        throw new Error('Données indisponibles');
      }
      
      generateRecommendationsFromData(data);
    } catch (err) {
      console.error('Erreur lors de la récupération des recommandations:', err);
      setError('Impossible de charger les recommandations nutritionnelles.');
    } finally {
      setLoading(false);
    }
  };

  // Générer les recommandations à partir des données
  const generateRecommendationsFromData = (data) => {
    try {
      // Vérifier que les données essentielles sont présentes
      if (!data || !data.metrics || !data.goals) {
        throw new Error('Données incomplètes pour générer des recommandations');
      }
      
      // Récupérer les valeurs pertinentes (avec valeurs par défaut si manquantes)
      const weight = data.metrics.weight || 70;
      const height = data.metrics.height || 175;
      const age = data.metrics.age || 30;
      const gender = data.metrics.gender || 'male';
      const activity = data.metrics.activityLevel || 'moderate';
      const goal = data.goals.type || 'performance';
      const discipline = data.cycling?.discipline || 'road';
      const trainingHours = data.cycling?.weeklyHours || 8;
      
      // Calculer les besoins caloriques de base
      let bmr;
      if (gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }
      
      // Facteur d'activité
      const activityFactors = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
      };
      
      // Niveau d'entraînement hebdomadaire
      let trainingFactor = 1.0;
      if (trainingHours > 0) {
        // Ajouter environ 0.05 par heure d'entraînement hebdomadaire
        trainingFactor = 1.0 + (trainingHours * 0.05);
      }
      
      const tdee = bmr * activityFactors[activity] * trainingFactor;
      
      // Ajuster les calories selon l'objectif
      let targetCalories;
      let carbPercentage;
      let proteinPercentage;
      let fatPercentage;
      
      switch (goal) {
        case 'weight-loss':
          targetCalories = Math.round(tdee * 0.85); // Déficit de 15%
          carbPercentage = 40;
          proteinPercentage = 35;
          fatPercentage = 25;
          break;
        case 'performance':
          targetCalories = Math.round(tdee * 1.1); // Surplus de 10%
          carbPercentage = 60;
          proteinPercentage = 20;
          fatPercentage = 20;
          break;
        case 'maintenance':
        default:
          targetCalories = Math.round(tdee);
          carbPercentage = 50;
          proteinPercentage = 25;
          fatPercentage = 25;
      }
      
      // Calcul des grammes de macronutriments
      const carbGrams = Math.round((targetCalories * (carbPercentage / 100)) / 4);
      const proteinGrams = Math.round((targetCalories * (proteinPercentage / 100)) / 4);
      const fatGrams = Math.round((targetCalories * (fatPercentage / 100)) / 9);
      
      // Hydratation quotidienne de base (en litres)
      const baseHydration = Math.round(weight * 0.035 * 100) / 100;
      
      // Hydratation spécifique pour l'entraînement (en litres par heure)
      const workoutHydration = 0.5; // 500ml par heure en moyenne
      const dailyWorkoutHydration = Math.round((trainingHours / 7) * workoutHydration * 100) / 100;
      const totalHydration = baseHydration + dailyWorkoutHydration;
      
      // Générer les recommandations
      const recommendations = {
        macros: [
          {
            id: 'calorie-needs',
            title: 'Besoins caloriques',
            description: `Vos besoins caloriques quotidiens sont d'environ ${targetCalories} kcal, en fonction de votre objectif de ${goal === 'weight-loss' ? 'perte de poids' : (goal === 'performance' ? 'performance' : 'maintien')}.`,
            priority: 'high',
            icon: <LocalFireDepartment />
          },
          {
            id: 'carb-needs',
            title: 'Glucides',
            description: `Consommez environ ${carbGrams}g de glucides par jour (${carbPercentage}% de votre apport calorique). Privilégiez les sources complexes comme les céréales complètes, les légumineuses et les tubercules.`,
            priority: 'high',
            icon: <GrainOutlined />
          },
          {
            id: 'protein-needs',
            title: 'Protéines',
            description: `Visez ${proteinGrams}g de protéines par jour (${proteinPercentage}% de votre apport calorique), soit environ ${Math.round((proteinGrams / weight) * 10) / 10}g/kg de poids corporel. Alternez sources animales (viandes maigres, œufs, produits laitiers) et végétales (légumineuses, tofu).`,
            priority: 'high',
            icon: <EggAlt />
          },
          {
            id: 'fat-needs',
            title: 'Lipides',
            description: `Incluez ${fatGrams}g de lipides par jour (${fatPercentage}% de votre apport calorique). Privilégiez les bonnes graisses (huile d'olive, avocat, poissons gras, noix) et limitez les graisses saturées.`,
            priority: 'medium',
            icon: <Cake />
          }
        ],
        hydration: [
          {
            id: 'daily-hydration',
            title: 'Hydratation quotidienne',
            description: `Buvez au moins ${totalHydration}L d'eau par jour, dont ${baseHydration}L pour vos besoins de base et ${dailyWorkoutHydration}L supplémentaires pour compenser vos entraînements.`,
            priority: 'high',
            icon: <Opacity />
          },
          {
            id: 'hydration-tips',
            title: 'Conseils d\'hydratation',
            description: 'Buvez régulièrement tout au long de la journée, pas seulement quand vous avez soif. L\'eau plate est idéale, mais vous pouvez également inclure des tisanes et boissons peu sucrées.',
            priority: 'medium',
            icon: <LocalDrink />
          }
        ],
        'pre-workout': [
          {
            id: 'pre-workout-meal',
            title: 'Repas avant entraînement',
            description: `Consommez un repas riche en glucides complexes 2-3h avant l'effort (${Math.round(carbGrams * 0.25)}g de glucides). Par exemple: pâtes complètes avec sauce tomate, riz avec poulet, patate douce avec légumes.`,
            priority: 'high',
            icon: <RestaurantMenu />
          },
          {
            id: 'pre-workout-snack',
            title: 'Collation avant entraînement',
            description: `Pour un entraînement court, une petite collation 30-60min avant suffit (${Math.round(carbGrams * 0.1)}g de glucides): banane, barre de céréales, ou quelques dattes.`,
            priority: 'medium',
            icon: <Fastfood />
          },
          {
            id: 'caffeine-strategy',
            title: 'Caféine stratégique',
            description: 'La caféine peut améliorer vos performances. Consommez 200-300mg (1-2 tasses de café) 30-60min avant les séances importantes pour un effet optimal.',
import EnhancedMetaTags from '../common/EnhancedMetaTags';
            priority: 'low',
            icon: <LocalFireDepartment />
          }
        ],
        'during-workout': [
          {
            id: 'workout-hydration',
            title: 'Hydratation pendant l\'effort',
            description: `Buvez 500-750ml d'eau par heure d'entraînement. Pour les efforts de plus d'une heure, optez pour une boisson contenant des électrolytes et ${Math.round(carbGrams * 0.06)}g de glucides par heure.`,
            priority: 'high',
            icon: <Opacity />
          },
          {
            id: 'energy-for-long-rides',
            title: 'Énergie pour longues sorties',
            description: `Pour les efforts de plus de 90 minutes, consommez 60-90g de glucides par heure sous forme de gels, barres énergétiques ou fruits secs. Alternez différentes sources pour faciliter la digestion.`,
            priority: 'high',
            icon: <DirectionsBike />
          },
          {
            id: 'energy-for-intensity',
            title: 'Nutrition pour haute intensité',
            description: 'Pour les entraînements courts mais intenses, privilégiez les glucides à assimilation rapide comme les gels ou boissons énergétiques avec maltodextrine.',
            priority: 'medium',
            icon: <LocalFireDepartment />
          }
        ],
        recovery: [
          {
            id: 'recovery-window',
            title: 'Fenêtre de récupération',
            description: `Consommez ${Math.round(proteinGrams * 0.2)}g de protéines et ${Math.round(carbGrams * 0.25)}g de glucides dans les 30 minutes après l'effort pour optimiser la récupération musculaire.`,
            priority: 'high',
            icon: <FitnessCenter />
          },
          {
            id: 'recovery-meal',
            title: 'Repas de récupération',
            description: 'Dans les 2 heures suivant l\'effort, prenez un repas complet contenant protéines, glucides et légumes. Par exemple: saumon avec riz et légumes, poulet avec quinoa et salade, ou ragoût de lentilles avec légumes.',
            priority: 'high',
            icon: <SetMeal />
          },
          {
            id: 'hydration-recovery',
            title: 'Réhydratation',
            description: 'Buvez 1.5 fois le poids perdu pendant l\'effort pour restaurer l\'équilibre hydrique. Incluez des électrolytes, surtout après les efforts intenses ou par temps chaud.',
            priority: 'medium',
            icon: <Opacity />
          },
          {
            id: 'anti-inflammatory-foods',
            title: 'Aliments anti-inflammatoires',
            description: 'Incorporez des aliments riches en antioxydants et aux propriétés anti-inflammatoires: petits fruits, cerises, curcuma, gingembre, poissons gras, huile d\'olive.',
            priority: 'medium',
            icon: <AcUnit />
          }
        ]
      };
      
      // Recommandations spécifiques selon la discipline
      if (discipline === 'road') {
        recommendations['during-workout'].push({
          id: 'road-specific',
          title: 'Spécifique route',
          description: 'Pour les sorties de plusieurs heures, échelonnez votre alimentation. Mangez des aliments solides (barres, sandwichs fins) dans la première moitié, puis passez aux gels et liquides pour la fin de parcours.',
          priority: 'medium',
          icon: <DirectionsBike />
        });
      } else if (discipline === 'mtb') {
        recommendations['during-workout'].push({
          id: 'mtb-specific',
          title: 'Spécifique VTT',
          description: 'Les efforts en VTT sont souvent intermittents. Optez pour un mélange de glucides (fructose, glucose) et des collations faciles à manger sur des terrains techniques.',
          priority: 'medium',
          icon: <DirectionsBike />
        });
      } else if (discipline === 'track') {
        recommendations['pre-workout'].push({
          id: 'track-specific',
          title: 'Spécifique piste',
          description: 'Pour les épreuves explosives sur piste, augmentez légèrement votre apport en créatine (3-5g/jour) et favorisez les aliments riches en nitrates comme la betterave.',
          priority: 'medium',
          icon: <DirectionsBike />
        });
      }
      
      setRecommendations(recommendations);
    } catch (err) {
      console.error('Erreur lors de la génération des recommandations:', err);
      setError('Impossible de générer des recommandations précises avec les données disponibles.');
    }
  };

  // Filtrer les recommandations par catégorie
  const getFilteredRecommendations = () => {
    if (!recommendations) return [];
    
    if (selectedCategory === 'all') {
      return Object.keys(recommendations).flatMap(category => 
        recommendations[category].map(item => ({ ...item, category }))
      );
    }
    
    return recommendations[selectedCategory]?.map(item => ({ ...item, category: selectedCategory })) || [];
  };

  // Obtenir la couleur de priorité
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  // Rendu lorsque les données sont en cours de chargement
  if (loading) {
    return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "name": "Guide Nutritionnel pour Cyclistes",
          "description": "Conseils et recettes adaptés aux cyclistes pour optimiser les performances en montagne.",
          "url": "https://velo-altitude.com/nutritionrecommendations"
        }
      </script>
      <EnhancedMetaTags
        title="Nutrition pour Cyclistes | Velo-Altitude"
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="article"
        imageUrl="/images/og-image.jpg"
      />
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Rendu en cas d'erreur
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  // Rendu lorsqu'il n'y a pas de recommandations
  if (!recommendations) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        Pour obtenir des recommandations nutritionnelles personnalisées, veuillez compléter votre profil avec vos informations personnelles, objectifs et niveau d'activité.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Filtres par catégorie */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        {categories.map((category) => (
          <Chip
            key={category.id}
            icon={category.icon}
            label={category.label}
            onClick={() => setSelectedCategory(category.id)}
            color={selectedCategory === category.id ? 'primary' : 'default'}
            variant={selectedCategory === category.id ? 'filled' : 'outlined'}
            sx={{ mb: 1, '& .MuiChip-icon': { fontSize: '1.2rem' } }}
          />
        ))}
      </Box>

      {/* Recommandations filtrées */}
      <Grid container spacing={3}>
        {getFilteredRecommendations().map((recommendation) => (
          <Grid item xs={12} md={6} key={recommendation.id}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ 
                    mr: 2, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: `${getPriorityColor(recommendation.priority)}20`,
                    color: getPriorityColor(recommendation.priority),
                    borderRadius: '50%',
                    width: 40,
                    height: 40
                  }}>
                    {recommendation.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {recommendation.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {recommendation.description}
                    </Typography>
                  </Box>
                </Box>
                <Chip 
                  size="small" 
                  label={categories.find(c => c.id === recommendation.category)?.label || recommendation.category}
                  sx={{ 
                    mt: 2,
                    bgcolor: theme.palette.background.default,
                    color: theme.palette.text.secondary,
                    '& .MuiChip-label': { fontSize: '0.7rem' }
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Disclaimer */}
      <Alert 
        severity="info" 
        icon={<Info />}
        sx={{ mt: 4 }}
        variant="outlined"
      >
        Ces recommandations sont générales et doivent être adaptées à vos besoins et préférences individuelles. Consultez un professionnel de la nutrition pour des conseils personnalisés.
      </Alert>
    </Box>
  );
};

export default NutritionRecommendations;
