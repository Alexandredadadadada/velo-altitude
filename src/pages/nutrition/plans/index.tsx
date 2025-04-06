import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  Breadcrumbs,
  Link,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import Head from 'next/head';
import { useRouter } from 'next/router';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SpeedIcon from '@mui/icons-material/Speed';
import TerrainIcon from '@mui/icons-material/Terrain';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import NextLink from 'next/link';
import { APIOrchestrator } from '../../../api/orchestration';
import { NutritionPlan } from '../../../types';

const PlansNutritionnelsPage: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [userPlans, setUserPlans] = useState<NutritionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const apiOrchestrator = new APIOrchestrator();

  // Ce serait normalement récupéré du contexte d'authentification
  const mockUserId = "user123";

  useEffect(() => {
    const fetchUserPlans = async () => {
      setLoading(true);
      try {
        // Ceci serait normalement filtrés par utilisateur connecté
        const plans = await apiOrchestrator.getUserNutritionPlans(mockUserId);
        setUserPlans(plans);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des plans nutritionnels:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPlans();
  }, []);

  const handleCreatePlan = () => {
    router.push('/nutrition/plans/creer');
  };

  const handleViewPlan = (planId: string) => {
    router.push(`/nutrition/plans/${planId}`);
  };

  // Plans nutritionnels prédéfinis
  const predefinedPlans = [
    {
      id: 'climbing',
      title: 'Plan Ascension de Cols',
      description: 'Optimisé pour les cyclistes qui se préparent à gravir des cols difficiles. Équilibré en glucides complexes et protéines.',
      icon: <TerrainIcon fontSize="large" sx={{ color: theme.palette.secondary.main }} />,
      macros: { protein: 25, carbs: 55, fat: 20 },
      goal: 'climbing',
      color: theme.palette.secondary.main
    },
    {
      id: 'endurance',
      title: 'Plan Endurance',
      description: 'Adapté aux longues sorties et aux événements d\'endurance. Accent sur les sources d\'énergie durables et la récupération.',
      icon: <SpeedIcon fontSize="large" sx={{ color: theme.palette.info.main }} />,
      macros: { protein: 20, carbs: 60, fat: 20 },
      goal: 'endurance',
      color: theme.palette.info.main
    },
    {
      id: 'performance',
      title: 'Plan Performance',
      description: 'Maximisez votre puissance et votre vitesse. Idéal pour les cyclistes compétitifs cherchant à améliorer leurs résultats.',
      icon: <FitnessCenterIcon fontSize="large" sx={{ color: theme.palette.warning.main }} />,
      macros: { protein: 30, carbs: 50, fat: 20 },
      goal: 'performance',
      color: theme.palette.warning.main
    },
    {
      id: 'weight_loss',
      title: 'Plan Perte de Poids',
      description: 'Conçu pour les cyclistes cherchant à optimiser leur poids tout en maintenant leur énergie pour les entraînements.',
      icon: <TrendingUpIcon fontSize="large" sx={{ color: theme.palette.success.main }} />,
      macros: { protein: 35, carbs: 40, fat: 25 },
      goal: 'weight_loss',
      color: theme.palette.success.main
    }
  ];

  return (
    <>
      <Head>
        <title>Plans Nutritionnels | Nutrition | Velo-Altitude</title>
        <meta name="description" content="Plans nutritionnels personnalisés pour cyclistes - Optimisez votre alimentation selon vos objectifs d'ascension de cols et d'entraînement." />
      </Head>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Fil d'Ariane */}
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />} 
          aria-label="breadcrumb"
          sx={{ mb: 4 }}
        >
          <Link component={NextLink} href="/" underline="hover" color="inherit">
            Accueil
          </Link>
          <Link component={NextLink} href="/nutrition" underline="hover" color="inherit">
            Nutrition
          </Link>
          <Typography color="text.primary">Plans Nutritionnels</Typography>
        </Breadcrumbs>

        {/* En-tête */}
        <Box mb={4}>
          <Typography variant="h3" component="h1" gutterBottom>
            Plans Nutritionnels
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Optimisez votre alimentation pour atteindre vos objectifs cyclistes
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            size="large"
            onClick={handleCreatePlan}
            startIcon={<RestaurantIcon />}
            sx={{ mt: 2 }}
          >
            Créer mon plan personnalisé
          </Button>
        </Box>

        {/* Introduction explicative */}
        <Paper elevation={2} sx={{ p: 3, mb: 6, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom>
            Nutrition sur mesure pour cyclistes
          </Typography>
          
          <Typography variant="body1" paragraph>
            Un plan nutritionnel adapté est essentiel pour optimiser vos performances cyclistes, 
            particulièrement lors de l'ascension de cols exigeants. Nos plans personnalisés prennent 
            en compte vos objectifs spécifiques, votre physiologie et votre calendrier d'entraînement.
          </Typography>
          
          <Box mt={3}>
            <Stepper 
              activeStep={-1} 
              alternativeLabel
              orientation={isMobile ? "vertical" : "horizontal"}
            >
              <Step>
                <StepLabel>
                  <Typography variant="body2" fontWeight="medium">
                    Définissez vos objectifs
                  </Typography>
                </StepLabel>
              </Step>
              <Step>
                <StepLabel>
                  <Typography variant="body2" fontWeight="medium">
                    Renseignez votre profil
                  </Typography>
                </StepLabel>
              </Step>
              <Step>
                <StepLabel>
                  <Typography variant="body2" fontWeight="medium">
                    Obtenez votre plan personnalisé
                  </Typography>
                </StepLabel>
              </Step>
              <Step>
                <StepLabel>
                  <Typography variant="body2" fontWeight="medium">
                    Suivez vos progrès
                  </Typography>
                </StepLabel>
              </Step>
            </Stepper>
          </Box>
        </Paper>

        {/* Plans prédéfinis */}
        <Box mb={8}>
          <Typography variant="h4" component="h2" gutterBottom>
            Plans Nutritionnels Spécialisés
          </Typography>
          <Typography variant="body1" paragraph>
            Commencez avec l'un de nos plans prédéfinis, conçus par des nutritionnistes spécialisés 
            en cyclisme de montagne et optimisés pour différents objectifs.
          </Typography>
          
          <Grid container spacing={3}>
            {predefinedPlans.map((plan) => (
              <Grid item xs={12} md={6} lg={3} key={plan.id}>
                <Card 
                  elevation={3}
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderTop: `4px solid ${plan.color}`,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)'
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="center" mb={2}>
                      {plan.icon}
                    </Box>
                    <Typography variant="h5" component="h3" align="center" gutterBottom>
                      {plan.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {plan.description}
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle2" gutterBottom align="center">
                      Répartition des macronutriments
                    </Typography>
                    
                    <Box 
                      display="flex" 
                      justifyContent="space-between"
                      sx={{ mb: 2 }}
                    >
                      <Box 
                        sx={{ 
                          textAlign: 'center',
                          flex: 1
                        }}
                      >
                        <Typography 
                          variant="h6" 
                          sx={{ color: theme.palette.primary.main }}
                        >
                          {plan.macros.protein}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Protéines
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          textAlign: 'center',
                          flex: 1
                        }}
                      >
                        <Typography 
                          variant="h6" 
                          sx={{ color: theme.palette.info.main }}
                        >
                          {plan.macros.carbs}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Glucides
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          textAlign: 'center',
                          flex: 1
                        }}
                      >
                        <Typography 
                          variant="h6" 
                          sx={{ color: theme.palette.warning.main }}
                        >
                          {plan.macros.fat}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Lipides
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ p: 2 }}>
                    <Button 
                      fullWidth 
                      variant="contained"
                      color="primary"
                      onClick={() => router.push(`/nutrition/plans/creer?template=${plan.id}`)}
                    >
                      Utiliser ce modèle
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Plans de l'utilisateur */}
        <Box mb={6}>
          <Typography variant="h4" component="h2" gutterBottom>
            Mes Plans Nutritionnels
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ my: 2 }}>
              Erreur lors du chargement des plans nutritionnels: {error.message}
            </Alert>
          ) : userPlans.length === 0 ? (
            <Paper 
              elevation={0} 
              variant="outlined" 
              sx={{ 
                p: 4, 
                textAlign: 'center',
                borderRadius: 2
              }}
            >
              <RestaurantIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.6, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Vous n'avez pas encore de plans nutritionnels
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Créez votre premier plan personnalisé pour optimiser votre alimentation en fonction de vos objectifs cyclistes.
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleCreatePlan}
              >
                Créer mon premier plan
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {userPlans.map((plan) => (
                <Grid item xs={12} sm={6} md={4} key={plan.id}>
                  <Card 
                    elevation={3}
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 6
                      }
                    }}
                    onClick={() => handleViewPlan(plan.id)}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h5" component="h3" gutterBottom>
                        {plan.name}
                      </Typography>
                      
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2,
                          display: '-webkit-box',
                          overflow: 'hidden',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 2,
                          minHeight: '40px'
                        }}
                      >
                        {plan.description}
                      </Typography>
                      
                      <Box 
                        sx={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 2
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Objectif:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {plan.targetGoal === 'weight_loss' ? 'Perte de poids' :
                           plan.targetGoal === 'maintenance' ? 'Maintien' :
                           plan.targetGoal === 'performance' ? 'Performance' :
                           plan.targetGoal === 'endurance' ? 'Endurance' : 'Ascension de cols'}
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 2
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Calories:
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {plan.dailyCalories} kcal/jour
                        </Typography>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Macronutriments:
                      </Typography>
                      
                      <Box 
                        display="flex" 
                        justifyContent="space-between"
                      >
                        <Box 
                          sx={{ 
                            textAlign: 'center',
                            flex: 1
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            fontWeight="medium"
                            sx={{ color: theme.palette.primary.main }}
                          >
                            {plan.macroRatio.protein}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Protéines
                          </Typography>
                        </Box>
                        
                        <Box 
                          sx={{ 
                            textAlign: 'center',
                            flex: 1
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            fontWeight="medium"
                            sx={{ color: theme.palette.info.main }}
                          >
                            {plan.macroRatio.carbs}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Glucides
                          </Typography>
                        </Box>
                        
                        <Box 
                          sx={{ 
                            textAlign: 'center',
                            flex: 1
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            fontWeight="medium"
                            sx={{ color: theme.palette.warning.main }}
                          >
                            {plan.macroRatio.fat}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Lipides
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                    
                    <CardActions>
                      <Button 
                        size="small" 
                        fullWidth
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewPlan(plan.id);
                        }}
                      >
                        Voir les détails
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Informations nutritionnelles spécifiques au cyclisme */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            mb: 4, 
            borderRadius: 2,
            backgroundColor: theme.palette.background.paper
          }}
        >
          <Typography variant="h4" component="h2" gutterBottom>
            Nutrition adaptée à l'ascension de cols
          </Typography>
          
          <Typography variant="body1" paragraph>
            L'ascension de cols nécessite une stratégie nutritionnelle spécifique pour maintenir 
            l'énergie sur de longues périodes d'effort intense. Nos plans prennent en compte les 
            besoins uniques des cyclistes de montagne.
          </Typography>
          
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.info.main }}>
                  <Box component="span" display="inline-flex" alignItems="center">
                    <FitnessCenterIcon sx={{ mr: 1 }} />
                    Préparation d'ascension
                  </Box>
                </Typography>
                <Typography variant="body2" paragraph>
                  Dans les jours précédant un défi d'ascension majeur, chargez vos réserves de glycogène 
                  avec notre protocole nutritionnel spécifique. Nos plans incluent une stratégie progressive 
                  pour maximiser vos réserves d'énergie sans prise de poids inutile.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.warning.main }}>
                  <Box component="span" display="inline-flex" alignItems="center">
                    <TerrainIcon sx={{ mr: 1 }} />
                    Nutrition en altitude
                  </Box>
                </Typography>
                <Typography variant="body2" paragraph>
                  L'ascension des cols demande une attention particulière à l'hydratation et aux électrolytes. 
                  Nos plans incluent des recommandations spécifiques pour l'alimentation pendant l'effort 
                  en altitude, avec des stratégies pour prévenir la déshydratation et les crampes.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.success.main }}>
                  <Box component="span" display="inline-flex" alignItems="center">
                    <RestaurantIcon sx={{ mr: 1 }} />
                    Récupération optimisée
                  </Box>
                </Typography>
                <Typography variant="body2" paragraph>
                  La récupération après une ascension intense est cruciale pour votre progression. 
                  Nos plans incluent des protocoles de nutrition post-effort pour accélérer la récupération 
                  musculaire et reconstituer vos réserves énergétiques pour votre prochain défi.
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Box mt={3} textAlign="center">
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleCreatePlan}
              size="large"
            >
              Obtenir mon plan personnalisé
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default PlansNutritionnelsPage;
