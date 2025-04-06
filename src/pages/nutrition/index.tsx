import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Button, 
  Divider, 
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import Head from 'next/head';
import { useRouter } from 'next/router';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CalculateIcon from '@mui/icons-material/Calculate';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { APIOrchestrator } from '../../api/orchestration';
import { Recipe } from '../../types';
import RecipeCard from '../../components/nutrition/RecipeCard';

const NutritionPage: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const apiOrchestrator = new APIOrchestrator();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [featuredRecipes, setFeaturedRecipes] = useState<Recipe[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchFeaturedRecipes = async () => {
      setLoading(true);
      try {
        const allRecipes = await apiOrchestrator.getAllRecipes();
        
        // Sélectionner quelques recettes à mettre en avant
        const featured = allRecipes.slice(0, 8);
        setFeaturedRecipes(featured);
        
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des recettes:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedRecipes();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const navigateToAllRecipes = () => {
    router.push('/nutrition/recettes');
  };

  const navigateToRecipe = (recipeId: string) => {
    router.push(`/nutrition/recettes/${recipeId}`);
  };

  const navigateToPlans = () => {
    router.push('/nutrition/plans');
  };

  const navigateToCalculator = () => {
    router.push('/nutrition/calculateur');
  };

  // Section des fonctionnalités principales
  const features = [
    {
      title: "Recettes adaptées",
      description: "Plus de 100 recettes adaptées aux besoins spécifiques des cyclistes, classées par moment d'effort.",
      icon: <RestaurantIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />,
      action: navigateToAllRecipes
    },
    {
      title: "Plans nutritionnels",
      description: "Plans personnalisés selon vos objectifs, avec suivi des macronutriments et suggestions de repas.",
      icon: <FitnessCenterIcon fontSize="large" sx={{ color: theme.palette.secondary.main }} />,
      action: navigateToPlans
    },
    {
      title: "Calculateur nutritionnel",
      description: "Outils pour évaluer vos besoins caloriques et en nutriments en fonction de vos objectifs cyclistes.",
      icon: <CalculateIcon fontSize="large" sx={{ color: theme.palette.info.main }} />,
      action: navigateToCalculator
    }
  ];

  // Rendu des onglets
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Toutes les recettes
        return renderFeaturedRecipes();
      case 1: // Avant effort
        return renderCategoryRecipes('before');
      case 2: // Pendant effort
        return renderCategoryRecipes('during');
      case 3: // Récupération
        return renderCategoryRecipes('after');
      default:
        return renderFeaturedRecipes();
    }
  };

  // Afficher les recettes mises en avant
  const renderFeaturedRecipes = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ my: 2 }}>
          Erreur lors du chargement des recettes: {error.message}
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        {featuredRecipes.map((recipe) => (
          <Grid item xs={12} sm={6} md={3} key={recipe.id}>
            <RecipeCard recipe={recipe} onClick={() => navigateToRecipe(recipe.id)} />
          </Grid>
        ))}
      </Grid>
    );
  };

  // Afficher les recettes par catégorie
  const renderCategoryRecipes = (category: 'before' | 'during' | 'after' | 'special') => {
    const filteredRecipes = featuredRecipes.filter(recipe => recipe.category === category);
    
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ my: 2 }}>
          Erreur lors du chargement des recettes: {error.message}
        </Alert>
      );
    }

    if (filteredRecipes.length === 0) {
      return (
        <Alert severity="info" sx={{ my: 2 }}>
          Aucune recette disponible dans cette catégorie pour le moment.
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        {filteredRecipes.map((recipe) => (
          <Grid item xs={12} sm={6} md={3} key={recipe.id}>
            <RecipeCard recipe={recipe} onClick={() => navigateToRecipe(recipe.id)} />
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <>
      <Head>
        <title>Nutrition | Velo-Altitude</title>
        <meta name="description" content="Module nutrition pour cyclistes - Recettes adaptées, plans personnalisés et calculateur nutritionnel pour optimiser votre performance." />
      </Head>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* En-tête */}
        <Box mb={6}>
          <Typography variant="h3" component="h1" gutterBottom>
            Nutrition pour Cyclistes
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Optimisez votre alimentation pour améliorer vos performances en montagne
          </Typography>
        </Box>

        {/* Bannière principale */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            mb: 6, 
            borderRadius: 2,
            backgroundImage: 'linear-gradient(to right, #f5f7fa, #e4efe9)',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            gap: 4
          }}
        >
          <Box flex={1}>
            <Typography variant="h4" gutterBottom>
              Une nutrition adaptée à vos défis cyclistes
            </Typography>
            <Typography variant="body1" paragraph sx={{ mb: 3 }}>
              Découvrez comment une alimentation optimisée peut transformer votre expérience d'ascension des cols. 
              Notre module nutrition complet vous propose des recettes spécifiques, des plans personnalisés et des conseils pratiques pour chaque étape de votre préparation.
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                onClick={navigateToAllRecipes}
                startIcon={<RestaurantIcon />}
              >
                Explorer les recettes
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                size="large"
                onClick={navigateToCalculator}
                startIcon={<CalculateIcon />}
              >
                Calculer mes besoins
              </Button>
            </Box>
          </Box>
          <Box 
            sx={{ 
              flex: { md: 1 },
              width: { xs: '100%', md: 'auto' },
              height: { xs: 200, md: 300 },
              position: 'relative',
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Box 
              component="img" 
              src="/images/nutrition-header.jpg" 
              alt="Nutrition pour cyclistes" 
              sx={{ 
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </Box>
        </Paper>

        {/* Caractéristiques principales */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card 
                elevation={3} 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="center" mb={2}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" component="h2" align="center" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" align="center" paragraph>
                    {feature.description}
                  </Typography>
                </CardContent>
                <Box p={2} textAlign="center">
                  <Button 
                    variant="outlined" 
                    color="primary"
                    onClick={feature.action}
                  >
                    En savoir plus
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Recettes recommandées */}
        <Box mb={8}>
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            mb={3}
            flexDirection={{ xs: 'column', sm: 'row' }}
            gap={2}
          >
            <Typography variant="h4" component="h2">
              Recettes recommandées
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={navigateToAllRecipes}
            >
              Voir toutes les recettes
            </Button>
          </Box>

          <Paper elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant={isMobile ? "scrollable" : "fullWidth"}
              scrollButtons={isMobile ? "auto" : undefined}
              textColor="primary"
              indicatorColor="primary"
              aria-label="Onglets de recettes"
            >
              <Tab icon={<RestaurantIcon />} label="Recommandées" />
              <Tab 
                icon={<FitnessCenterIcon />} 
                label="Avant effort" 
                sx={{ color: activeTab === 1 ? theme.palette.info.main : 'inherit' }}
              />
              <Tab 
                icon={<LocalFireDepartmentIcon />} 
                label="Pendant effort" 
                sx={{ color: activeTab === 2 ? theme.palette.warning.main : 'inherit' }}
              />
              <Tab 
                icon={<TrendingUpIcon />} 
                label="Récupération" 
                sx={{ color: activeTab === 3 ? theme.palette.success.main : 'inherit' }}
              />
            </Tabs>
          </Paper>

          <Box py={2}>
            {renderTabContent()}
          </Box>
        </Box>

        {/* Section nutrition et performance */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            mb: 8, 
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <Typography variant="h4" component="h2" gutterBottom>
            Nutrition et Performance Cycliste
          </Typography>
          
          <Typography variant="body1" paragraph>
            L'alimentation joue un rôle crucial dans votre capacité à gravir les cols avec efficacité. 
            Une stratégie nutritionnelle adaptée vous permet d'optimiser votre énergie, d'améliorer votre endurance 
            et d'accélérer votre récupération.
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.info.main }}>
                  <Box component="span" display="inline-flex" alignItems="center">
                    <FitnessCenterIcon sx={{ mr: 1 }} />
                    Avant l'effort
                  </Box>
                </Typography>
                <Typography variant="body2" paragraph>
                  Préparez votre organisme avec des repas riches en glucides complexes pour constituer vos réserves d'énergie.
                  Privilégiez les aliments à index glycémique bas et modéré pour une libération progressive de l'énergie.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.warning.main }}>
                  <Box component="span" display="inline-flex" alignItems="center">
                    <LocalFireDepartmentIcon sx={{ mr: 1 }} />
                    Pendant l'effort
                  </Box>
                </Typography>
                <Typography variant="body2" paragraph>
                  Maintenez votre niveau d'énergie avec des glucides facilement assimilables. 
                  L'hydratation et l'apport en électrolytes sont essentiels, particulièrement lors des ascensions intenses.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.success.main }}>
                  <Box component="span" display="inline-flex" alignItems="center">
                    <TrendingUpIcon sx={{ mr: 1 }} />
                    Après l'effort
                  </Box>
                </Typography>
                <Typography variant="body2" paragraph>
                  Favorisez la récupération avec un ratio optimal de protéines et de glucides. 
                  Cette phase est cruciale pour la reconstruction musculaire et la reconstitution des réserves de glycogène.
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Box mt={3} textAlign="center">
            <Button 
              variant="contained" 
              color="primary"
              onClick={navigateToCalculator}
              startIcon={<CalculateIcon />}
            >
              Calculer mes besoins nutritionnels
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default NutritionPage;
