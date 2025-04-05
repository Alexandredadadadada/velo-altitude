/**
 * DuringEventSection - Section du guide sur la nutrition pendant un événement longue distance
 */
import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, Slider, InputAdornment,
  TextField, List, ListItem, ListItemIcon, ListItemText, 
  Divider, Chip, Card, CardContent, Button, Alert
} from '@mui/material';
import { 
  DirectionsBike, LocalFireDepartment, WaterDrop, AccessTime,
  RestaurantMenu, Warning, Loop, TrendingUp, ArrowDownward
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styles personnalisés
const SectionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const HighlightBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
  color: theme.palette.primary.contrastText
}));

const CalculatorPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  border: `1px solid ${theme.palette.primary.light}`,
}));

const PhasesGrid = styled(Grid)(({ theme }) => ({
  '& .MuiPaper-root': {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
}));

/**
 * Section sur la nutrition pendant un événement longue distance
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.content - Contenu de la section
 */
const DuringEventSection = ({ content = {} }) => {
  // États pour le calculateur interactif
  const [weight, setWeight] = useState(70);
  const [duration, setDuration] = useState(4);
  const [intensity, setIntensity] = useState(65);
  const [temperature, setTemperature] = useState(20);
  
  // Données de secours en cas de contenu manquant
  const defaultContent = {
    title: "Nutrition pendant l'effort longue distance",
    intro: "La nutrition pendant l'effort est cruciale pour maintenir votre performance sur les longues distances. Votre stratégie doit équilibrer les glucides, les électrolytes et l'hydratation pour éviter les coups de fatigue et les crampes.",
    principles: [
      {
        title: "Apport glucidique",
        description: "Visez entre 60-90g de glucides par heure, selon l'intensité et la durée.",
        icon: "LocalFireDepartment",
        tips: [
          "Commencez à consommer des glucides dans les 15-20 premières minutes",
          "Alternez entre liquides, gels et solides pour éviter la lassitude gustative",
          "Utilisez un mix de glucose et fructose (ratio 2:1) pour optimiser l'absorption"
        ]
      },
      {
        title: "Hydratation",
        description: "Buvez 500-800ml/heure, ajustez selon la température et l'humidité.",
        icon: "WaterDrop",
        tips: [
          "Utilisez la couleur de votre urine comme indicateur (jaune pâle = bien hydraté)",
          "Ajoutez des électrolytes si l'effort dépasse 2h ou par temps chaud",
          "Ne vous surhydratez pas (risque d'hyponatrémie)"
        ]
      },
      {
        title: "Timing et régularité",
        description: "Adoptez une stratégie 'peu et souvent' plutôt que de grandes quantités.",
        icon: "AccessTime",
        tips: [
          "Programmez des alarmes toutes les 15-20 minutes pour vous rappeler de vous alimenter",
          "Adaptez votre consommation aux difficultés du parcours",
          "Prévenez la faim plutôt que d'y répondre (mangez avant de ressentir la faim)"
        ]
      }
    ],
    phases: [
      {
        title: "Phase 1: 0-2h",
        description: "Début d'effort, énergie principalement issue des réserves de glycogène.",
        needs: "40-60g de glucides/heure, 500-700ml de liquide/heure",
        recommendations: "Boissons énergétiques, barres tendres, bananes"
      },
      {
        title: "Phase 2: 2-4h",
        description: "Phase intermédiaire, début de fatigue métabolique possible.",
        needs: "60-80g de glucides/heure, 500-700ml de liquide/heure",
        recommendations: "Alternez gels énergétiques, barres, boissons isotoniques"
      },
      {
        title: "Phase 3: 4h+",
        description: "Endurance prolongée, risque élevé de fatigue et manque d'appétit.",
        needs: "80-90g de glucides/heure, 600-800ml de liquide/heure + électrolytes",
        recommendations: "Sandwichs salés, purées de fruits, boissons à teneur élevée en glucides"
      }
    ],
    products: [
      {
        type: "Gels énergétiques",
        benefits: "Absorption rapide, pratiques à transporter et consommer",
        timing: "Toutes les 30-45 minutes selon les besoins",
        caution: "Peuvent causer des troubles digestifs, toujours consommer avec de l'eau"
      },
      {
        type: "Barres énergétiques",
        benefits: "Apport plus soutenu, sensation de satiété",
        timing: "Toutes les 60-90 minutes",
        caution: "Plus difficiles à mâcher et digérer pendant l'effort intense"
      },
      {
        type: "Boissons isotoniques",
        benefits: "Hydratation et glucides combinés, absorption rapide",
        timing: "Consommation continue, 150-200ml toutes les 15 minutes",
        caution: "Vérifiez la concentration en glucides (6-8% est idéale)"
      },
      {
        type: "Aliments solides",
        benefits: "Variété gustative, apport nutritionnel complet",
        timing: "Pendant les sections plates ou les ravitaillements",
        caution: "Digestion plus lente, évitez en période d'effort intense"
      }
    ],
    emergencySituations: [
      {
        problem: "Coup de fatigue",
        solution: "30-40g de glucides rapides (gel ou boisson concentrée) + 15 minutes de pédalage facile",
        prevention: "Nutrition régulière, ne pas attendre la faim"
      },
      {
        problem: "Crampes",
        solution: "Boisson avec électrolytes, étirements légers, réduction momentanée de l'intensité",
        prevention: "Hydratation avec électrolytes, entraînement adapté, échauffement adéquat"
      },
      {
        problem: "Problèmes gastriques",
        solution: "Réduire l'intensité, passer à des liquides, siroter de l'eau",
        prevention: "Tester vos produits à l'avance, commencer la nutrition dès le début de l'effort"
      }
    ]
  };
  
  // Utiliser le contenu fourni ou les données par défaut
  const {
    title = defaultContent.title,
    intro = defaultContent.intro,
    principles = defaultContent.principles,
    phases = defaultContent.phases,
    products = defaultContent.products,
    emergencySituations = defaultContent.emergencySituations
  } = content;

  // Calcul des besoins pour le calculateur interactif
  const calculateNeeds = () => {
    // Calories par heure basées sur le poids et l'intensité
    const caloriesPerHour = weight * 7 * (intensity / 100);
    
    // Glucides recommandés (g/heure)
    const carbsPerHour = Math.round((duration <= 2.5) 
      ? 30 + (intensity / 100) * 30 
      : 60 + (intensity / 100) * 30);
    
    // Liquide recommandé (ml/heure)
    const baseFluid = 500;
    const tempFactor = Math.max(0, (temperature - 15) * 20);
    const fluidPerHour = Math.round(baseFluid + tempFactor);
    
    // Sodium recommandé (mg/heure)
    const sodiumPerHour = Math.round(500 + (temperature > 25 ? 300 : 0));
    
    return {
      calories: Math.round(caloriesPerHour),
      carbs: carbsPerHour,
      fluid: fluidPerHour,
      sodium: sodiumPerHour
    };
  };
  
  const needs = calculateNeeds();

  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom>
        {title}
      </Typography>
      
      <Typography variant="body1" paragraph>
        {intro}
      </Typography>
      
      {/* Calculateur interactif */}
      <CalculatorPaper elevation={1}>
        <Typography variant="h5" gutterBottom>
          Calculateur de besoins pendant l'effort
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box mb={3}>
              <Typography id="weight-slider" gutterBottom>
                Poids (kg)
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <Slider
                    value={weight}
                    onChange={(e, newValue) => setWeight(newValue)}
                    aria-labelledby="weight-slider"
                    min={40}
                    max={120}
                  />
                </Grid>
                <Grid item>
                  <TextField
                    value={weight}
                    onChange={(e) => setWeight(Math.max(40, Math.min(120, Number(e.target.value))))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                    }}
                    variant="outlined"
                    size="small"
                    style={{ width: 80 }}
                  />
                </Grid>
              </Grid>
            </Box>
            
            <Box mb={3}>
              <Typography id="duration-slider" gutterBottom>
                Durée prévue (heures)
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <Slider
                    value={duration}
                    onChange={(e, newValue) => setDuration(newValue)}
                    aria-labelledby="duration-slider"
                    min={1}
                    max={10}
                    step={0.5}
                  />
                </Grid>
                <Grid item>
                  <TextField
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, Math.min(10, Number(e.target.value))))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">h</InputAdornment>,
                    }}
                    variant="outlined"
                    size="small"
                    style={{ width: 80 }}
                  />
                </Grid>
              </Grid>
            </Box>
            
            <Box mb={3}>
              <Typography id="intensity-slider" gutterBottom>
                Intensité (% de FCM)
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <Slider
                    value={intensity}
                    onChange={(e, newValue) => setIntensity(newValue)}
                    aria-labelledby="intensity-slider"
                    min={50}
                    max={90}
                  />
                </Grid>
                <Grid item>
                  <TextField
                    value={intensity}
                    onChange={(e) => setIntensity(Math.max(50, Math.min(90, Number(e.target.value))))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    variant="outlined"
                    size="small"
                    style={{ width: 80 }}
                  />
                </Grid>
              </Grid>
            </Box>
            
            <Box mb={3}>
              <Typography id="temperature-slider" gutterBottom>
                Température (°C)
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <Slider
                    value={temperature}
                    onChange={(e, newValue) => setTemperature(newValue)}
                    aria-labelledby="temperature-slider"
                    min={0}
                    max={40}
                  />
                </Grid>
                <Grid item>
                  <TextField
                    value={temperature}
                    onChange={(e) => setTemperature(Math.max(0, Math.min(40, Number(e.target.value))))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">°C</InputAdornment>,
                    }}
                    variant="outlined"
                    size="small"
                    style={{ width: 80 }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <HighlightBox>
              <Typography variant="h6" gutterBottom>
                Vos besoins nutritionnels par heure
              </Typography>
              
              <Box display="flex" alignItems="center" mb={2}>
                <LocalFireDepartment sx={{ mr: 1, color: 'white' }} />
                <Typography variant="body1" sx={{ flex: 1 }}>
                  Calories
                </Typography>
                <Typography variant="h6">
                  {needs.calories} kcal
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" mb={2}>
                <RestaurantMenu sx={{ mr: 1, color: 'white' }} />
                <Typography variant="body1" sx={{ flex: 1 }}>
                  Glucides
                </Typography>
                <Typography variant="h6">
                  {needs.carbs} g
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" mb={2}>
                <WaterDrop sx={{ mr: 1, color: 'white' }} />
                <Typography variant="body1" sx={{ flex: 1 }}>
                  Liquide
                </Typography>
                <Typography variant="h6">
                  {needs.fluid} ml
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center">
                <Loop sx={{ mr: 1, color: 'white' }} />
                <Typography variant="body1" sx={{ flex: 1 }}>
                  Sodium
                </Typography>
                <Typography variant="h6">
                  {needs.sodium} mg
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.3)' }} />
              
              <Alert severity="info" sx={{ bgcolor: 'rgba(255,255,255,0.9)' }}>
                {duration > 3 
                  ? "Pour cette durée, alternez entre différentes sources de glucides pour optimiser l'absorption"
                  : "Pour cette durée, privilégiez des sources de glucides facilement absorbables"}
              </Alert>
            </HighlightBox>
          </Grid>
        </Grid>
      </CalculatorPaper>
      
      {/* Principes clés */}
      <SectionPaper elevation={1}>
        <Typography variant="h5" gutterBottom>
          Principes clés de la nutrition pendant l'effort
        </Typography>
        
        <Grid container spacing={3}>
          {principles.map((principle, idx) => (
            <Grid item xs={12} md={4} key={idx}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Box display="flex" alignItems="center" mb={1}>
                  {principle.icon === "LocalFireDepartment" && <LocalFireDepartment color="primary" sx={{ mr: 1 }} />}
                  {principle.icon === "WaterDrop" && <WaterDrop color="primary" sx={{ mr: 1 }} />}
                  {principle.icon === "AccessTime" && <AccessTime color="primary" sx={{ mr: 1 }} />}
                  <Typography variant="h6">
                    {principle.title}
                  </Typography>
                </Box>
                
                <Typography variant="body2" paragraph>
                  {principle.description}
                </Typography>
                
                <Box flex={1}>
                  <List dense>
                    {principle.tips.map((tip, tipIdx) => (
                      <ListItem key={tipIdx} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <TrendingUp fontSize="small" color="secondary" />
                        </ListItemIcon>
                        <ListItemText primary={tip} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </SectionPaper>
      
      {/* Phases de l'effort */}
      <SectionPaper elevation={1}>
        <Typography variant="h5" gutterBottom>
          Stratégie par phases d'effort
        </Typography>
        
        <PhasesGrid container spacing={3}>
          {phases.map((phase, idx) => (
            <Grid item xs={12} md={4} key={idx}>
              <Paper 
                elevation={2} 
                sx={{ 
                  borderLeft: idx === 0 
                    ? '4px solid #4CAF50' 
                    : idx === 1 
                      ? '4px solid #FFA000' 
                      : '4px solid #F44336'
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {phase.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {phase.description}
                  </Typography>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Besoins:
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {phase.needs}
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Recommandations:
                  </Typography>
                  <Typography variant="body2">
                    {phase.recommendations}
                  </Typography>
                </CardContent>
              </Paper>
            </Grid>
          ))}
        </PhasesGrid>
      </SectionPaper>
      
      {/* Types de produits */}
      <Typography variant="h5" gutterBottom>
        Types de nutrition pendant l'effort
      </Typography>
      
      <Grid container spacing={2} mb={3}>
        {products.map((product, idx) => (
          <Grid item xs={12} sm={6} key={idx}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {product.type}
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Avantages:</strong> {product.benefits}
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Timing:</strong> {product.timing}
              </Typography>
              
              <Box display="flex" alignItems="center">
                <Warning fontSize="small" color="warning" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {product.caution}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      {/* Situations d'urgence */}
      <Typography variant="h5" gutterBottom>
        Situations d'urgence nutritionnelle
      </Typography>
      
      {emergencySituations.map((situation, idx) => (
        <Paper key={idx} sx={{ p: 2, mb: 2, borderLeft: '4px solid #ff5722' }}>
          <Typography variant="h6" gutterBottom>
            {situation.problem}
          </Typography>
          
          <Box display="flex" alignItems="flex-start" mb={1}>
            <ArrowDownward color="error" sx={{ mr: 1, mt: 0.5 }} />
            <Box>
              <Typography variant="subtitle2">
                Solution immédiate:
              </Typography>
              <Typography variant="body2" paragraph>
                {situation.solution}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="flex-start">
            <TrendingUp color="primary" sx={{ mr: 1, mt: 0.5 }} />
            <Box>
              <Typography variant="subtitle2">
                Prévention:
              </Typography>
              <Typography variant="body2">
                {situation.prevention}
              </Typography>
            </Box>
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default DuringEventSection;
