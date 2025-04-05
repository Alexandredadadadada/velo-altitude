import React, { useState, useEffect } from 'react';
import {
  Grid, Paper, Typography, Card, CardContent, Box, Tabs, Tab, Divider,
  List, ListItem, ListItemText, ListItemIcon, Button, CircularProgress,
  Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import TimerIcon from '@mui/icons-material/Timer';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { useTheme } from '@mui/material/styles';

/**
 * ColSpecificNutrition - Composant pour les plans nutritionnels spécifiques aux cols
 */
function ColSpecificNutrition({ selectedRegion, selectedCol }) {
  const theme = useTheme();
  const [nutritionPlan, setNutritionPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [userProfile, setUserProfile] = useState({
    weight: 70,
    goal: 'performance'
  });

  useEffect(() => {
    if (selectedCol) {
      setNutritionPlan(null);
    }
  }, [selectedCol]);

  const generateNutritionPlan = () => {
    if (!selectedCol) return;
    
    setLoading(true);
    
    // Simuler un chargement de données
    setTimeout(() => {
      setNutritionPlan(generateMockNutritionPlan(selectedCol, userProfile));
      setLoading(false);
    }, 1500);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (!selectedCol) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <RestaurantIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Sélectionnez un col pour générer un plan nutritionnel
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choisissez un col dans l'onglet Dashboard pour obtenir des recommandations nutritionnelles adaptées.
        </Typography>
      </Paper>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* En-tête */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <RestaurantIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
            </Grid>
            <Grid item xs>
              <Typography variant="h5">
                Plan nutritionnel: {selectedCol.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {selectedCol.altitude}m • {selectedCol.length}km • Difficulté: {selectedCol.difficulty}/10
              </Typography>
            </Grid>
            <Grid item>
              {!nutritionPlan && !loading && (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={generateNutritionPlan}
                >
                  Générer un plan
                </Button>
              )}
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Chargement */}
      {loading && (
        <Grid item xs={12}>
          <Paper sx={{ p: 5, textAlign: 'center' }}>
            <CircularProgress />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Génération de votre plan nutritionnel personnalisé...
            </Typography>
          </Paper>
        </Grid>
      )}

      {/* Plan nutritionnel */}
      {nutritionPlan && !loading && (
        <>
          {/* Résumé */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Résumé nutritionnel
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Besoins caloriques estimés
                </Typography>
                <Typography variant="h4" color="primary">
                  {nutritionPlan.caloriesPerHour} kcal/h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pendant l'ascension de {selectedCol.name}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Hydratation recommandée
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalDrinkIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                <Typography variant="h5" color="info.main">
                  {nutritionPlan.hydrationPerHour} ml/h
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Caractéristiques clés
              </Typography>
              <List dense>
                {nutritionPlan.keyFeatures.map((feature, index) => (
                  <ListItem key={index}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Box
                        component="span"
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: theme.palette.primary.main,
                          display: 'inline-block',
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
          
          {/* Détails du plan */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                Ce plan nutritionnel est adapté aux caractéristiques de {selectedCol.name} et à vos objectifs de performance.
              </Alert>
              
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
                indicatorColor="primary"
                textColor="primary"
                sx={{ mb: 3 }}
              >
                <Tab label="Avant" icon={<ScheduleIcon />} />
                <Tab label="Pendant" icon={<TimerIcon />} />
                <Tab label="Après" icon={<RestaurantIcon />} />
              </Tabs>

              {/* Contenu de chaque onglet */}
              <Box role="tabpanel" hidden={tabValue !== 0}>
                {tabValue === 0 && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Préparation (24-48h avant)
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {nutritionPlan.beforeCol.description}
                    </Typography>
                    
                    <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Repas</TableCell>
                            <TableCell>Aliments recommandés</TableCell>
                            <TableCell align="right">Macros</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {nutritionPlan.beforeCol.meals.map((meal) => (
                            <TableRow key={meal.name}>
                              <TableCell>{meal.name}</TableCell>
                              <TableCell>{meal.foods.join(', ')}</TableCell>
                              <TableCell align="right">{meal.macros}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Conseils spécifiques:
                    </Typography>
                    <List dense>
                      {nutritionPlan.beforeCol.tips.map((tip, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={tip} />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </Box>

              <Box role="tabpanel" hidden={tabValue !== 1}>
                {tabValue === 1 && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Pendant l'ascension
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {nutritionPlan.duringCol.description}
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12} sm={6}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom>
                              Hydratation
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                              <Typography variant="h4" component="div">
                                {nutritionPlan.hydrationPerHour}
                              </Typography>
                              <Typography variant="subtitle1" color="text.secondary" sx={{ ml: 0.5 }}>
                                ml/heure
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {nutritionPlan.duringCol.hydrationStrategy}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom>
                              Nutrition
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                              <Typography variant="h4" component="div">
                                {nutritionPlan.caloriesPerHour}
                              </Typography>
                              <Typography variant="subtitle1" color="text.secondary" sx={{ ml: 0.5 }}>
                                kcal/heure
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {nutritionPlan.duringCol.calorieStrategy}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Aliments et suppléments recommandés:
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Options</TableCell>
                            <TableCell align="right">Timing</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {nutritionPlan.duringCol.foods.map((food) => (
                            <TableRow key={food.type}>
                              <TableCell>{food.type}</TableCell>
                              <TableCell>{food.options.join(', ')}</TableCell>
                              <TableCell align="right">{food.timing}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}
              </Box>

              <Box role="tabpanel" hidden={tabValue !== 2}>
                {tabValue === 2 && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Récupération post-col
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {nutritionPlan.afterCol.description}
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={12}>
                        <Card variant="outlined" sx={{ bgcolor: 'primary.light' }}>
                          <CardContent>
                            <Typography variant="subtitle2" color="white" gutterBottom>
                              Fenêtre de récupération optimale
                            </Typography>
                            <Typography variant="h5" color="white">
                              30 minutes post-effort
                            </Typography>
                            <Typography variant="body2" color="white" sx={{ opacity: 0.8 }}>
                              {nutritionPlan.afterCol.windowStrategy}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Plan de récupération en 3 phases:
                    </Typography>
                    <List>
                      {nutritionPlan.afterCol.phases.map((phase, index) => (
                        <ListItem key={index} alignItems="flex-start">
                          <ListItemIcon>
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                bgcolor: theme.palette.primary.main,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold'
                              }}
                            >
                              {index + 1}
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={phase.title}
                            secondary={
                              <>
                                <Typography component="span" variant="body2" color="text.primary">
                                  {phase.timing}
                                </Typography>
                                {" — " + phase.description}
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </Box>
            </Paper>
          </Grid>
        </>
      )}
    </Grid>
  );
}

// Fonction pour générer un plan nutritionnel mocké
function generateMockNutritionPlan(col, userProfile) {
  // Calculs basés sur le col et le profil utilisateur
  const caloriesPerHour = Math.round(
    (col.gradient > 8 ? 650 : col.gradient > 6 ? 550 : 450) *
    (userProfile.weight / 70)
  );
  
  const hydrationPerHour = Math.round(
    (col.altitude > 2000 ? 800 : 700) *
    (userProfile.weight / 70)
  );
  
  // Ajustements basés sur l'altitude
  const altitudeAdjustment = col.altitude > 2500 ? "haute altitude" : 
                            col.altitude > 2000 ? "altitude moyenne" : "faible altitude";
  
  // Caractéristiques clés basées sur le col
  const keyFeatures = [];
  
  if (col.altitude > 2000) {
    keyFeatures.push("Stratégie adaptée à l'altitude");
    keyFeatures.push("Focus sur l'hydratation renforcée");
  }
  
  if (col.gradient > 8) {
    keyFeatures.push("Support nutritionnel pour forte pente");
    keyFeatures.push("Apports énergétiques fractionnés");
  }
  
  if (col.length > 15) {
    keyFeatures.push("Plan pour effort prolongé");
    keyFeatures.push("Rotation des sources de glucides");
  }
  
  keyFeatures.push("Électrolytes adaptés à l'effort montagne");

  return {
    caloriesPerHour,
    hydrationPerHour,
    keyFeatures,
    colId: col.id,
    userWeight: userProfile.weight,
    
    // Recommandations avant le col
    beforeCol: {
      description: `Pour préparer votre ascension de ${col.name} (${altitudeAdjustment}), nous recommandons une stratégie de supercompensation glucidique modérée sur les 48h précédant l'effort, avec un focus sur l'hydratation et les électrolytes.`,
      meals: [
        {
          name: "Dîner (J-2)",
          foods: ["Pâtes complètes", "Patate douce", "Protéine maigre", "Légumes verts"],
          macros: "60% G, 20% P, 20% L"
        },
        {
          name: "Déjeuner (J-1)",
          foods: ["Riz", "Légumineuses", "Poisson/Poulet", "Avocat"],
          macros: "65% G, 20% P, 15% L"
        },
        {
          name: "Petit-déjeuner (Jour J)",
          foods: ["Flocons d'avoine", "Fruits secs", "Yaourt grec", "Miel"],
          macros: "70% G, 15% P, 15% L"
        }
      ],
      tips: [
        `Augmentez votre consommation d'eau à 45ml/kg de poids corporel les 24h avant de gravir ${col.name}`,
        "Limitez les aliments riches en fibres la veille pour éviter les problèmes digestifs",
        "Consommez 3-5mg/kg de caféine 60 minutes avant le début de l'ascension",
        "Intégrez des sources de sodium dans vos repas pour optimiser l'hydratation"
      ]
    },
    
    // Recommandations pendant le col
    duringCol: {
      description: `L'ascension de ${col.name} nécessite une stratégie nutritionnelle adaptée à sa longueur et son gradient. Voici les recommandations pour maintenir votre énergie tout au long de l'effort.`,
      hydrationStrategy: `Pour cette ascension en ${altitudeAdjustment}, buvez régulièrement en petites quantités (150-200ml toutes les 15-20 minutes).`,
      calorieStrategy: `Visez ${caloriesPerHour} kcal/heure réparties en apports réguliers pour maintenir votre glycémie stable.`,
      foods: [
        {
          type: "Boissons",
          options: ["Boisson isotonique", "Eau + électrolytes", "Boisson de maltodextrine"],
          timing: "Toutes les 15-20 min"
        },
        {
          type: "Glucides solides",
          options: ["Barre énergétique", "Banane", "Pain d'épices", "Riz gluant"],
          timing: "Toutes les 45-60 min"
        },
        {
          type: "Gels énergétiques",
          options: ["Gel + caféine", "Gel + électrolytes", "Gel + acides aminés"],
          timing: "Sections difficiles"
        },
        {
          type: "Électrolytes",
          options: ["Pastilles effervescentes", "Capsules de sel", "Boisson électrolytique"],
          timing: "Selon transpiration"
        }
      ]
    },
    
    // Recommandations après le col
    afterCol: {
      description: `Après l'effort intense de l'ascension de ${col.name}, votre corps a besoin d'une stratégie de récupération optimisée pour restaurer les réserves énergétiques, réparer les tissus musculaires et réhydrater l'organisme.`,
      windowStrategy: "Apport combiné de protéines (20-25g) et glucides (1g/kg de poids corporel) dans les 30 minutes post-effort",
      phases: [
        {
          title: "Récupération immédiate (0-30 min)",
          timing: "Immédiatement après l'effort",
          description: "Boisson de récupération riche en électrolytes avec ratio glucides/protéines de 3:1 ou 4:1. Exemple: shake protéiné avec banane et miel."
        },
        {
          title: "Repas de récupération (1-2h)",
          timing: "1-2 heures après l'effort",
          description: "Repas complet équilibré riche en glucides complexes, protéines de qualité et graisses saines. Exemple: quinoa avec poulet, légumes et avocat."
        },
        {
          title: "Récupération prolongée (3-24h)",
          timing: "Jusqu'au lendemain",
          description: "Poursuite de l'hydratation et stratégie alimentaire équilibrée avec apport augmenté en antioxydants. Monitoring de la couleur des urines pour vérifier l'hydratation."
        }
      ]
    }
  };
}

export default ColSpecificNutrition;
