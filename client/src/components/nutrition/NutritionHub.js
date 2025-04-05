import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Container, Grid, Typography, Card, CardContent, CardMedia, 
  CardActionArea, Box, Breadcrumbs, Link, Paper, Divider, Button,
  List, ListItem, ListItemIcon, ListItemText, Chip, Stack
} from '@mui/material';
import { 
  NavigateNext, RestaurantMenu, WaterDrop, FitnessCenterOutlined, 
  BarChart, TimerOutlined, DirectionsBike, TrendingUp, 
  MenuBook, LocalCafe, EmojiEvents, HealthAndSafety
} from '@mui/icons-material';
import nutritionPlans from '../../data/nutritionPlans';
import nutritionRecipes from '../../data/nutritionRecipes';

/**
 * Hub de navigation principal pour la section Nutrition
 * Présente les différentes ressources disponibles avec des visuels attrayants
 */
const NutritionHub = () => {
  // Combiner tous les types de recettes pour avoir un count total
  const allRecipes = [
    ...nutritionRecipes.preRide, 
    ...nutritionRecipes.duringRide, 
    ...nutritionRecipes.postRide, 
    ...nutritionRecipes.colSpecific
  ];
  
  // Liste des plans nutritionnels
  const allPlans = Object.keys(nutritionPlans).map(key => ({
    id: key,
    name: nutritionPlans[key].name,
    description: nutritionPlans[key].description,
    icon: key === 'endurance' ? <DirectionsBike /> : 
          key === 'highIntensity' ? <FitnessCenterOutlined /> : 
          key === 'mountain' ? <TrendingUp /> : <RestaurantMenu />
  }));
  
  // Ressources nutritionnelles supplémentaires
  const nutritionResources = [
    {
      id: 'hydration',
      title: 'Guide d\'hydratation',
      description: 'Stratégies d\'hydratation optimales pour les cyclistes selon l\'effort et les conditions',
      icon: <WaterDrop />,
      link: '/nutrition/resources/hydration'
    },
    {
      id: 'supplements',
      title: 'Guide des suppléments',
      description: 'Quels suppléments sont utiles pour les cyclistes, quand et comment les utiliser',
      icon: <LocalCafe />,
      link: '/nutrition/resources/supplements'
    },
    {
      id: 'periodization',
      title: 'Périodisation nutritionnelle',
      description: 'Comment adapter votre alimentation selon les phases d\'entraînement et de compétition',
      icon: <BarChart />,
      link: '/nutrition/resources/periodization'
    },
    {
      id: 'recovery',
      title: 'Nutrition de récupération',
      description: 'Optimiser votre récupération grâce à des stratégies nutritionnelles adaptées',
      icon: <HealthAndSafety />,
      link: '/nutrition/resources/recovery'
    },
    {
      id: 'race-day',
      title: 'Nutrition jour de course',
      description: 'Préparer et gérer votre alimentation avant, pendant et après une compétition',
      icon: <EmojiEvents />,
      link: '/nutrition/resources/race-day'
    },
    {
      id: 'altitude',
      title: 'Nutrition en altitude',
      description: 'Adaptations nutritionnelles spécifiques pour la performance en altitude',
      icon: <TrendingUp />,
      link: '/nutrition/resources/altitude'
    }
  ];

  return (
    <Container maxWidth="lg">
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link component={RouterLink} to="/" color="inherit">
          Accueil
        </Link>
        <Typography color="text.primary">Nutrition</Typography>
      </Breadcrumbs>

      {/* En-tête */}
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Nutrition du Cycliste
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', mb: 3 }}>
          Des plans nutritionnels personnalisés, des recettes adaptées et des ressources 
          pour optimiser votre alimentation et booster vos performances.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button 
            variant="contained" 
            size="large" 
            startIcon={<RestaurantMenu />}
            component={RouterLink}
            to="/nutrition/recipes"
          >
            Explorer les recettes
          </Button>
          <Button 
            variant="outlined" 
            size="large" 
            startIcon={<DirectionsBike />}
            component={RouterLink}
            to="/nutrition/plans"
          >
            Voir les plans nutritionnels
          </Button>
        </Stack>
      </Box>

      {/* Cartes de navigation principales */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {/* Section des recettes améliorée */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardActionArea 
              component={RouterLink} 
              to="/nutrition/recipes"
              sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
            >
              <CardMedia
                component="img"
                height="180"
                image="/images/nutrition/recipes-explorer.jpg"
                alt="Explorateur de recettes"
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <RestaurantMenu color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="h3">
                    Explorateur de recettes
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Découvrez notre bibliothèque complète de recettes optimisées pour les cyclistes, 
                  avec filtres par objectif, timing et valeurs nutritionnelles.
                </Typography>
                <Box mt={2}>
                  <Chip size="small" label={`${allRecipes.length} recettes`} sx={{ mr: 1, mb: 1 }} />
                  <Chip size="small" label="Avant l'effort" color="primary" variant="outlined" sx={{ mr: 1, mb: 1 }} />
                  <Chip size="small" label="Récupération" color="secondary" variant="outlined" sx={{ mr: 1, mb: 1 }} />
                  <Chip size="small" label="Spécial cols" color="info" variant="outlined" sx={{ mb: 1 }} />
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Plans nutritionnels */}
        <Grid item xs={12} md={6}>
          <Card 
            elevation={3} 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.02)'
              }
            }}
          >
            <CardActionArea component={RouterLink} to="/nutrition/plans" sx={{ flexGrow: 1 }}>
              <CardMedia
                component="img"
                height="200"
                image="/images/nutrition/plans-header.jpg"
                alt="Plans nutritionnels"
                sx={{ objectFit: 'cover' }}
              />
              <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                  Plans Nutritionnels
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Des stratégies nutritionnelles complètes pour différents types d'efforts cyclistes, avec 
                  des recommandations détaillées sur la répartition des macronutriments et l'hydratation.
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" color="primary">
                      {allPlans.length} plans spécialisés
                    </Typography>
                  </Box>
                  <Chip 
                    icon={<DirectionsBike />} 
                    label="Adaptés par type d'effort" 
                    size="small" 
                    variant="outlined"
                  />
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      {/* Liste des plans disponibles */}
      <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 6 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Plans nutritionnels disponibles
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {allPlans.map(plan => (
            <Grid item xs={12} sm={6} md={4} key={plan.id}>
              <Card variant="outlined">
                <CardActionArea component={RouterLink} to={`/nutrition/plans/${plan.id}`}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ mr: 1, color: 'primary.main' }}>
                        {plan.icon}
                      </Box>
                      <Typography variant="h6" component="h3">
                        {plan.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {plan.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Ressources nutritionnelles */}
      <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 6 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Ressources nutritionnelles avancées
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {nutritionResources.map(resource => (
            <Grid item xs={12} sm={6} md={4} key={resource.id}>
              <Card variant="outlined">
                <CardActionArea component={RouterLink} to={resource.link}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ mr: 1, color: 'primary.main' }}>
                        {resource.icon}
                      </Box>
                      <Typography variant="h6" component="h3">
                        {resource.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {resource.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Services nutritionnels */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 6, 
          backgroundColor: 'primary.dark', 
          color: 'white',
          borderRadius: 2
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h5" component="h2" gutterBottom>
              Besoin d'un accompagnement personnalisé ?
            </Typography>
            <Typography variant="body1" paragraph>
              Nos nutritionnistes spécialisés en cyclisme peuvent élaborer un plan nutritionnel 
              sur mesure adapté à vos objectifs spécifiques, votre physiologie et votre calendrier d'entraînement.
            </Typography>
            <Button 
              variant="contained" 
              color="secondary" 
              size="large"
              component={RouterLink}
              to="/nutrition/consult"
            >
              Prendre rendez-vous
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <MenuBook sx={{ fontSize: 160, opacity: 0.6 }} />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* FAQ */}
      <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Questions fréquentes sur la nutrition
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <List>
          <ListItem>
            <ListItemIcon>
              <NavigateNext color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Quelle quantité de glucides dois-je consommer pendant l'effort ?" 
              secondary="La recommandation générale est de 30-60g par heure pour les efforts modérés, et jusqu'à 90g par heure pour les efforts intenses de plus de 2h30."
            />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemIcon>
              <NavigateNext color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Est-ce que je peux suivre un régime cétogène pour le cyclisme ?" 
              secondary="Bien que certains cyclistes expérimentent avec des approches faibles en glucides, les preuves scientifiques actuelles suggèrent que la plupart des cyclistes performent mieux avec une alimentation riche en glucides, surtout pour les efforts intenses."
            />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemIcon>
              <NavigateNext color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Quand dois-je manger avant une sortie ou une course ?" 
              secondary="Pour les efforts courts (<1h), un repas léger 1-2h avant peut suffire. Pour les efforts plus longs, un repas plus conséquent 2-3h avant est recommandé. L'objectif est d'avoir l'estomac relativement vide au début de l'effort tout en ayant des réserves énergétiques suffisantes."
            />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemIcon>
              <NavigateNext color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Comment dois-je m'hydrater pendant une sortie longue ?" 
              secondary="Visez 500-750ml par heure, davantage par temps chaud ou humide. Intégrez des électrolytes pour les sorties de plus de 90 minutes. La règle d'or : boire avant d'avoir soif, par petites gorgées régulières."
            />
          </ListItem>
        </List>
      </Paper>
    </Container>
  );
};

export default NutritionHub;
