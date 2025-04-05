import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Tooltip,
  LinearProgress,
  useTheme,
  Button,
  Collapse,
  Zoom,
  Fade
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  LocalFireDepartment as CalorieIcon,
  FitnessCenter as ProteinIcon,
  Grain as CarbIcon,
  Opacity as FatIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

// Animation pour le composant Chart Arc
const ChartArc = styled('div')(({ theme, value, color, size = 180 }) => ({
  position: 'relative',
  width: size,
  height: size,
  borderRadius: '50%',
  background: `conic-gradient(${color} ${value}%, #e0e0e0 0)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&::before': {
    content: '""',
    position: 'absolute',
    width: size * 0.8,
    height: size * 0.8,
    borderRadius: '50%',
    background: theme.palette.background.paper,
  }
}));

// Composant de barre de macro nutriments avec animation
const MacroProgressBar = styled(LinearProgress)(({ theme, color }) => ({
  height: 12,
  borderRadius: 6,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    borderRadius: 6,
    backgroundColor: color,
  },
}));

// InfoCard pour les valeurs nutritionnelles
const InfoCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 16,
  position: 'relative',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[6],
  },
}));

// Composant principal d'infographie nutritionnelle interactive
const NutritionInfographic = ({ nutritionData, userNeeds = null, compact = false }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(!compact);
  const [animate, setAnimate] = useState(false);
  const infoRef = useRef(null);
  
  // Données nutritionnelles par défaut si non fournies
  const defaultData = {
    calories: 250,
    protein: 15,
    carbs: 30,
    fat: 10,
    fiber: 5,
    sugar: 8,
    sodium: 300,
    vitamins: {
      A: 10, // % des AJR (Apports Journaliers Recommandés)
      C: 15,
      D: 5,
      E: 8,
      B12: 20
    },
    minerals: {
      iron: 15,
      calcium: 10,
      potassium: 12,
      magnesium: 8
    }
  };
  
  // Fusionner avec les données par défaut
  const data = { ...defaultData, ...nutritionData };
  
  // Besoins utilisateur par défaut (pour un cycliste moyen)
  const defaultUserNeeds = {
    calories: 2200,
    protein: 110, // g
    carbs: 300, // g
    fat: 70 // g
  };
  
  // Fusionner avec les besoins par défaut
  const needs = { ...defaultUserNeeds, ...userNeeds };
  
  // Calculer les pourcentages pour les graphiques
  const calculatePercentage = (value, max) => {
    return Math.min(Math.round((value / max) * 100), 100);
  };
  
  // Valeurs pour les graphiques
  const caloriePercentage = calculatePercentage(data.calories, needs.calories / 6); // Environ 1/6 des besoins journaliers
  const proteinPercentage = calculatePercentage(data.protein, needs.protein / 5);
  const carbPercentage = calculatePercentage(data.carbs, needs.carbs / 5);
  const fatPercentage = calculatePercentage(data.fat, needs.fat / 5);
  
  // Couleurs pour les différents macronutriments
  const colors = {
    calories: theme.palette.mode === 'dark' ? '#ff7043' : '#ff5722',
    protein: theme.palette.mode === 'dark' ? '#42a5f5' : '#1976d2',
    carbs: theme.palette.mode === 'dark' ? '#ffca28' : '#ff9800',
    fat: theme.palette.mode === 'dark' ? '#ab47bc' : '#9c27b0',
  };
  
  // Lancer l'animation lors du changement de visibilité
  useEffect(() => {
    if (expanded) {
      const timer = setTimeout(() => {
        setAnimate(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimate(false);
    }
  }, [expanded]);
  
  // Calculer la répartition des macronutriments
  const macroDistribution = {
    protein: Math.round((data.protein * 4 / data.calories) * 100),
    carbs: Math.round((data.carbs * 4 / data.calories) * 100),
    fat: Math.round((data.fat * 9 / data.calories) * 100),
  };
  
  // Ajuster pour assurer que la somme est 100%
  const adjustDistribution = (dist) => {
    const sum = dist.protein + dist.carbs + dist.fat;
    if (sum !== 100) {
      const factor = 100 / sum;
      return {
        protein: Math.round(dist.protein * factor),
        carbs: Math.round(dist.carbs * factor),
        fat: Math.round(dist.fat * factor),
      };
    }
    return dist;
  };
  
  const adjusted = adjustDistribution(macroDistribution);
  
  return (
    <Box ref={infoRef}>
      <Paper 
        elevation={3}
        sx={{
          p: 2,
          borderRadius: 3,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Valeurs Nutritionnelles
          </Typography>
          
          <Button
            startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setExpanded(!expanded)}
            size="small"
            color="primary"
            sx={{ minWidth: 0 }}
          >
            {expanded ? 'Réduire' : 'Voir plus'}
          </Button>
        </Box>
        
        <Collapse in={expanded} timeout={300}>
          <Grid container spacing={3}>
            {/* Vue d'ensemble des calories et macros */}
            <Grid item xs={12} md={5}>
              <InfoCard>
                <Typography variant="subtitle1" gutterBottom>
                  Répartition Énergétique
                </Typography>
                
                <Box sx={{ position: 'relative', my: 2 }}>
                  <ChartArc 
                    value={animate ? caloriePercentage : 0} 
                    color={colors.calories}
                    size={compact ? 140 : 180}
                    sx={{ transition: 'background 1.5s ease-out' }}
                  >
                    <Box sx={{ position: 'relative', textAlign: 'center' }}>
                      <CalorieIcon color="error" fontSize={compact ? "medium" : "large"} />
                      <Typography variant={compact ? "h6" : "h5"} fontWeight="bold">
                        {data.calories}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        kcal
                      </Typography>
                    </Box>
                  </ChartArc>
                </Box>
                
                <Fade in={animate} timeout={1000}>
                  <Box sx={{ width: '100%', mt: 2 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <Tooltip title="Glucides: fournissent l'énergie principale">
                          <Box sx={{ textAlign: 'center' }}>
                            <CarbIcon sx={{ color: colors.carbs }} />
                            <Typography variant="body2" fontWeight="bold">{adjusted.carbs}%</Typography>
                            <Typography variant="caption" color="text.secondary">Glucides</Typography>
                          </Box>
                        </Tooltip>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Tooltip title="Protéines: essentielles pour la récupération musculaire">
                          <Box sx={{ textAlign: 'center' }}>
                            <ProteinIcon sx={{ color: colors.protein }} />
                            <Typography variant="body2" fontWeight="bold">{adjusted.protein}%</Typography>
                            <Typography variant="caption" color="text.secondary">Protéines</Typography>
                          </Box>
                        </Tooltip>
                      </Grid>
                      
                      <Grid item xs={4}>
                        <Tooltip title="Lipides: importants pour l'absorption des vitamines">
                          <Box sx={{ textAlign: 'center' }}>
                            <FatIcon sx={{ color: colors.fat }} />
                            <Typography variant="body2" fontWeight="bold">{adjusted.fat}%</Typography>
                            <Typography variant="caption" color="text.secondary">Lipides</Typography>
                          </Box>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  </Box>
                </Fade>
              </InfoCard>
            </Grid>
            
            {/* Détail des macronutriments */}
            <Grid item xs={12} md={7}>
              <InfoCard>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Détail des Macronutriments
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ProteinIcon fontSize="small" sx={{ color: colors.protein, mr: 1 }} />
                        <Typography variant="body2">Protéines</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="bold">
                        {data.protein}g
                      </Typography>
                    </Box>
                    <Zoom in={animate} style={{ transitionDelay: animate ? '200ms' : '0ms' }}>
                      <Box>
                        <MacroProgressBar 
                          variant="determinate" 
                          value={animate ? proteinPercentage : 0} 
                          color={colors.protein}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {proteinPercentage}% de vos besoins pour une portion
                        </Typography>
                      </Box>
                    </Zoom>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CarbIcon fontSize="small" sx={{ color: colors.carbs, mr: 1 }} />
                        <Typography variant="body2">Glucides</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="bold">
                        {data.carbs}g
                      </Typography>
                    </Box>
                    <Zoom in={animate} style={{ transitionDelay: animate ? '400ms' : '0ms' }}>
                      <Box>
                        <MacroProgressBar 
                          variant="determinate" 
                          value={animate ? carbPercentage : 0} 
                          color={colors.carbs}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {carbPercentage}% de vos besoins pour une portion
                        </Typography>
                      </Box>
                    </Zoom>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FatIcon fontSize="small" sx={{ color: colors.fat, mr: 1 }} />
                        <Typography variant="body2">Lipides</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="bold">
                        {data.fat}g
                      </Typography>
                    </Box>
                    <Zoom in={animate} style={{ transitionDelay: animate ? '600ms' : '0ms' }}>
                      <Box>
                        <MacroProgressBar 
                          variant="determinate" 
                          value={animate ? fatPercentage : 0} 
                          color={colors.fat}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {fatPercentage}% de vos besoins pour une portion
                        </Typography>
                      </Box>
                    </Zoom>
                  </Box>
                  
                  {/* Informations complémentaires */}
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Tooltip title="Fibres alimentaires: favorisent une digestion saine">
                        <Box sx={{ 
                          p: 1, 
                          bgcolor: theme.palette.grey[100], 
                          borderRadius: 1,
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <Typography variant="body2">Fibres</Typography>
                          <Typography variant="body2" fontWeight="bold">{data.fiber}g</Typography>
                        </Box>
                      </Tooltip>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Tooltip title="Sucres: à consommer avec modération en dehors de l'effort">
                        <Box sx={{ 
                          p: 1, 
                          bgcolor: theme.palette.grey[100], 
                          borderRadius: 1,
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <Typography variant="body2">Sucres</Typography>
                          <Typography variant="body2" fontWeight="bold">{data.sugar}g</Typography>
                        </Box>
                      </Tooltip>
                    </Grid>
                  </Grid>
                </Box>
              </InfoCard>
            </Grid>
            
            {/* Informations complémentaires - visibles uniquement en mode étendu et non compact */}
            {!compact && (
              <Grid item xs={12}>
                <Fade in={animate} timeout={1000}>
                  <InfoCard>
                    <Typography variant="subtitle1" gutterBottom>
                      Apports en Micronutriments
                    </Typography>
                    
                    <Grid container spacing={2}>
                      {/* Vitamines */}
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                          Vitamines (% AJR)
                        </Typography>
                        
                        <Grid container spacing={1}>
                          {Object.entries(data.vitamins).map(([vitamin, value]) => (
                            <Grid item xs={6} key={vitamin}>
                              <Box sx={{ 
                                p: 1, 
                                bgcolor: theme.palette.grey[100], 
                                borderRadius: 1,
                                display: 'flex',
                                justifyContent: 'space-between'
                              }}>
                                <Typography variant="body2">Vitamine {vitamin}</Typography>
                                <Typography variant="body2" fontWeight="bold">{value}%</Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Grid>
                      
                      {/* Minéraux */}
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                          Minéraux (% AJR)
                        </Typography>
                        
                        <Grid container spacing={1}>
                          {Object.entries(data.minerals).map(([mineral, value]) => (
                            <Grid item xs={6} key={mineral}>
                              <Box sx={{ 
                                p: 1, 
                                bgcolor: theme.palette.grey[100], 
                                borderRadius: 1,
                                display: 'flex',
                                justifyContent: 'space-between'
                              }}>
                                <Typography variant="body2">
                                  {mineral.charAt(0).toUpperCase() + mineral.slice(1)}
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">{value}%</Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                      <InfoIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        Les pourcentages sont basés sur les Apports Journaliers Recommandés pour un cycliste avec une activité modérée.
                        Vos besoins peuvent varier en fonction de votre niveau d'activité, âge, sexe et objectifs.
                      </Typography>
                    </Box>
                  </InfoCard>
                </Fade>
              </Grid>
            )}
          </Grid>
        </Collapse>
      </Paper>
    </Box>
  );
};

export default NutritionInfographic;
