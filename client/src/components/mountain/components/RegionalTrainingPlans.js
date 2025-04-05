import React, { useState } from 'react';
import { 
  Grid, Paper, Typography, Card, CardContent, CardMedia, 
  Box, Tabs, Tab, Button, Divider, List, ListItem, 
  ListItemText, ListItemIcon, Chip 
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TerrainIcon from '@mui/icons-material/Terrain';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import EventIcon from '@mui/icons-material/Event';
import { useTheme } from '@mui/material/styles';

/**
 * RegionalTrainingPlans - Composant pour les plans d'entraînement spécifiques par région
 */
function RegionalTrainingPlans({ selectedRegion }) {
  const theme = useTheme();
  const [activePlan, setActivePlan] = useState(0);

  // Données des régions
  const regionData = {
    alpes: {
      title: "Alpes",
      description: "Préparez-vous pour les longues ascensions alpines, caractérisées par des cols de haute altitude et des pentes variées.",
      image: "https://www.cyclingcols.com/sites/default/files/col/alpe_d_huez.jpg",
      characteristics: [
        "Cols de haute altitude (>2000m)",
        "Ascensions longues (15-30km)",
        "Pentes modérées à raides (6-10%)",
        "Changements de température fréquents"
      ],
      plans: [
        {
          title: "Plan Alpine Explorer",
          duration: "8 semaines",
          difficulty: "Intermédiaire/Avancé",
          description: "Programme conçu pour développer l'endurance aérobie et l'efficacité en montée, essentielles pour les longues ascensions alpines.",
          keyWorkouts: [
            "Sorties longues avec sections en Z3",
            "Répétitions en montée (2-3 x 20min)",
            "Sweet spot prolongé (2 x 30min)",
            "Simulation d'altitude (si disponible)"
          ],
          weeklyHours: "8-12",
          focus: ["Endurance", "Seuil", "Altitude"]
        },
        {
          title: "Plan Summit Crusher",
          duration: "12 semaines",
          difficulty: "Avancé",
          description: "Programme intensif pour les cyclistes expérimentés visant des performances optimales sur les cols mythiques des Alpes.",
          keyWorkouts: [
            "Blocs pyramidaux (Z2→Z4→Z5→Z4→Z2)",
            "Entraînements spécifiques à basse cadence",
            "Simulations de cols avec micro-récupérations",
            "Sessions d'endurance prolongée (4-6h)"
          ],
          weeklyHours: "12-15",
          focus: ["Performance", "Spécificité", "Mental"]
        }
      ]
    },
    pyrenees: {
      title: "Pyrénées",
      description: "Préparez-vous aux cols pyrénéens, souvent plus courts mais plus raides que leurs homologues alpins.",
      image: "https://www.cyclingcols.com/sites/default/files/col/tourmalet.jpg",
      characteristics: [
        "Cols à fort pourcentage (8-12%)",
        "Ascensions de longueur moyenne (10-20km)",
        "Conditions climatiques parfois extrêmes",
        "Enchaînements de cols rapprochés"
      ],
      plans: [
        {
          title: "Plan Pyrénées Power",
          duration: "6 semaines",
          difficulty: "Intermédiaire",
          description: "Programme axé sur le développement de la force spécifique nécessaire pour les pentes raides des Pyrénées.",
          keyWorkouts: [
            "Intervalles de force (4-6 x 5min à basse cadence)",
            "Séances mixtes force-endurance",
            "Entraînements en côte avec changements de rythme",
            "Récupération active entre les blocs intensifs"
          ],
          weeklyHours: "6-10",
          focus: ["Force", "Seuil", "Récupération"]
        },
        {
          title: "Plan Tourmalet Challenge",
          duration: "10 semaines",
          difficulty: "Avancé",
          description: "Programme complet pour préparer une semaine de cyclisme dans les Pyrénées avec enchaînements de cols majeurs.",
          keyWorkouts: [
            "Blocs d'intensité variable (Z3-Z5)",
            "Simulations d'enchaînements de cols",
            "Sessions heat training (si disponible)",
            "Travail spécifique sur les transitions plat-montée"
          ],
          weeklyHours: "10-14",
          focus: ["Endurance spécifique", "Thermorégulation", "Mental"]
        }
      ]
    },
    dolomites: {
      title: "Dolomites",
      description: "Préparez-vous pour les cols techniques des Dolomites, caractérisés par des changements de pente fréquents et des virages en épingle.",
      image: "https://www.cyclingcols.com/sites/default/files/col/stelvio%20N%20%281%29.jpg",
      characteristics: [
        "Profils irréguliers avec changements de pente",
        "Nombreux virages en épingle",
        "Ascensions techniques",
        "Beauté des paysages (facteur mental)"
      ],
      plans: [
        {
          title: "Plan Dolomites Technique",
          duration: "6 semaines",
          difficulty: "Intermédiaire",
          description: "Programme axé sur la maîtrise technique et les changements de rythme nécessaires dans les Dolomites.",
          keyWorkouts: [
            "Intervalles à intensité variable",
            "Travail technique en virage",
            "Sessions avec changements fréquents de position",
            "Renforcement du haut du corps"
          ],
          weeklyHours: "7-10",
          focus: ["Technique", "Puissance variable", "Agilité"]
        },
        {
          title: "Plan Stelvio Master",
          duration: "9 semaines",
          difficulty: "Avancé",
          description: "Programme intensif pour affronter les cols légendaires des Dolomites comme le Stelvio et ses 48 virages en épingle.",
          keyWorkouts: [
            "Séances spécifiques de simulation Stelvio",
            "Travail d'accélération post-virage",
            "Blocs de 30/30 pour l'adaptation aux changements",
            "Sessions longues avec focus technique"
          ],
          weeklyHours: "10-14",
          focus: ["Endurance spécifique", "VO2max", "Technique avancée"]
        }
      ]
    },
    ardennes: {
      title: "Ardennes & Flandres",
      description: "Préparez-vous pour les courtes mais intenses montées des Ardennes et des Flandres, souvent sur des secteurs pavés.",
      image: "https://www.cyclingcols.com/sites/default/files/col/huy%20%285%29.JPG",
      characteristics: [
        "Montées courtes et explosives (0.5-3km)",
        "Pentes très raides (jusqu'à 20%)",
        "Secteurs pavés fréquents",
        "Conditions météo changeantes"
      ],
      plans: [
        {
          title: "Plan Classics Preparation",
          duration: "5 semaines",
          difficulty: "Tous niveaux",
          description: "Programme pour développer l'explosivité et la récupération rapide nécessaires pour les montées des classiques.",
          keyWorkouts: [
            "Répétitions courtes à haute intensité",
            "Travail de seuil en côte (30s-3min)",
            "Entraînements sur pavés (si disponible)",
            "Sessions de force maximale"
          ],
          weeklyHours: "5-8",
          focus: ["Puissance", "Explosivité", "Technique pavés"]
        },
        {
          title: "Plan Ardennes Expert",
          duration: "8 semaines",
          difficulty: "Intermédiaire/Avancé",
          description: "Programme complet pour maîtriser les particularités des côtes des Ardennes, comme le Mur de Huy.",
          keyWorkouts: [
            "Micro-intervalles à très haute intensité",
            "Travail spécifique en danseuse",
            "Simulation de courses Ardennaises",
            "Séances avec multiples efforts courts"
          ],
          weeklyHours: "8-12",
          focus: ["Puissance anaérobie", "Capacité de récupération", "Technique spécifique"]
        }
      ]
    }
  };

  const currentRegion = regionData[selectedRegion] || regionData.alpes;
  
  const handlePlanChange = (index) => {
    setActivePlan(index);
  };

  return (
    <Grid container spacing={3}>
      {/* En-tête de la région */}
      <Grid item xs={12}>
        <Paper 
          sx={{ 
            p: 0, 
            overflow: 'hidden',
            borderRadius: 2,
            position: 'relative'
          }}
        >
          <Box
            sx={{
              height: 200,
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1
              }
            }}
          >
            <CardMedia
              component="img"
              height="200"
              image={currentRegion.image}
              alt={currentRegion.title}
              sx={{ objectFit: 'cover' }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                p: 3,
                zIndex: 2,
                color: 'white'
              }}
            >
              <Typography variant="h4" component="h1" gutterBottom>
                Plans d'entraînement: {currentRegion.title}
              </Typography>
              <Typography variant="subtitle1">
                {currentRegion.description}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Caractéristiques de la région */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3, height: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TerrainIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="h6">
              Caractéristiques
            </Typography>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <List dense>
            {currentRegion.characteristics.map((item, index) => (
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
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Plans disponibles
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {currentRegion.plans.map((plan, index) => (
                <Button
                  key={index}
                  variant={activePlan === index ? "contained" : "outlined"}
                  color="primary"
                  onClick={() => handlePlanChange(index)}
                  startIcon={<FitnessCenterIcon />}
                  fullWidth
                >
                  {plan.title}
                </Button>
              ))}
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Détails du plan */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          {currentRegion.plans.length > 0 && (
            <>
              <Typography variant="h5" gutterBottom>
                {currentRegion.plans[activePlan].title}
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                <Chip
                  icon={<EventIcon />}
                  label={`Durée: ${currentRegion.plans[activePlan].duration}`}
                  variant="outlined"
                />
                <Chip
                  icon={<FitnessCenterIcon />}
                  label={`Difficulté: ${currentRegion.plans[activePlan].difficulty}`}
                  variant="outlined"
                  color={
                    currentRegion.plans[activePlan].difficulty.includes('Avancé') ? 'error' :
                    currentRegion.plans[activePlan].difficulty.includes('Intermédiaire') ? 'warning' : 'success'
                  }
                />
                <Chip
                  icon={<DirectionsBikeIcon />}
                  label={`${currentRegion.plans[activePlan].weeklyHours}h/semaine`}
                  variant="outlined"
                />
              </Box>
              
              <Typography variant="body1" paragraph>
                {currentRegion.plans[activePlan].description}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Focus d'entraînement
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {currentRegion.plans[activePlan].focus.map((item, index) => (
                    <Chip 
                      key={index}
                      label={item}
                      color={
                        item.includes('Endurance') ? 'success' :
                        item.includes('Puissance') ? 'error' :
                        item.includes('Mental') ? 'secondary' : 'primary'
                      }
                    />
                  ))}
                </Box>
              </Box>
              
              <Typography variant="subtitle1" gutterBottom>
                Séances clés
              </Typography>
              <List>
                {currentRegion.plans[activePlan].keyWorkouts.map((workout, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <DirectionsBikeIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={workout} />
                  </ListItem>
                ))}
              </List>
              
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                >
                  Télécharger le plan complet
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Le plan détaillé inclut un calendrier hebdomadaire complet, des séances détaillées et des recommandations nutritionnelles.
                </Typography>
              </Box>
            </>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}

export default RegionalTrainingPlans;
