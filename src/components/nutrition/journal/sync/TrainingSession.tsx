import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Collapse,
  Divider,
  Card,
  CardContent,
  useTheme,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  DirectionsBike as DirectionsBikeIcon,
  Timer as TimerIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingUp as TrendingUpIcon,
  LocalFireDepartment as LocalFireDepartmentIcon,
  Restaurant as RestaurantIcon,
  Whatshot as WhatshotIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

// Interface pour les propriétés du composant
interface TrainingSessionProps {
  session: any;
  nutritionPlan: any;
}

// Interface pour la section de recommandation nutritionnelle
interface NutritionTipProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  timing: string;
  foods: string[];
}

// Composant pour les conseils nutritionnels
const NutritionTip: React.FC<NutritionTipProps> = ({ title, description, icon, timing, foods }) => {
  const theme = useTheme();
  
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
          {icon}
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        
        <Typography variant="body2" paragraph>
          {description}
        </Typography>
        
        <Chip 
          size="small" 
          label={timing}
          color="secondary"
          sx={{ mb: 2 }}
        />
        
        <Typography variant="caption" display="block" gutterBottom color="text.secondary">
          Aliments recommandés:
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {foods.map((food, index) => (
            <Chip 
              key={index}
              size="small"
              label={food}
              variant="outlined"
              color="primary"
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

const TrainingSession: React.FC<TrainingSessionProps> = ({ session, nutritionPlan }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(isSameDay(new Date(session.date), new Date()));
  
  // Formatage de la date
  const formattedDate = format(new Date(session.date), 'EEEE d MMMM', { locale: fr });
  
  // Calcul de l'intensité de l'entraînement (1-5)
  const intensityLevel = Math.ceil(session.intensityScore / 20);
  
  // Génération des puces d'intensité
  const renderIntensityDots = () => {
    const dots = [];
    for (let i = 0; i < 5; i++) {
      dots.push(
        <Box
          key={i}
          component="span"
          sx={{
            display: 'inline-block',
            width: 10,
            height: 10,
            borderRadius: '50%',
            mx: 0.5,
            bgcolor: i < intensityLevel 
              ? theme.palette.error.main 
              : theme.palette.grey[300]
          }}
        />
      );
    }
    return dots;
  };
  
  // Fonction pour obtenir les recommandations selon le type d'entraînement
  const getRecommendations = () => {
    let recommendations = {
      pre: {
        title: 'Avant l\'entraînement',
        description: 'Privilégiez les glucides complexes pour une énergie durable.',
        icon: <TimerIcon color="info" />,
        timing: '1-2h avant',
        foods: ['Porridge d\'avoine', 'Banane', 'Pain complet', 'Miel']
      },
      during: {
        title: 'Pendant l\'effort',
        description: 'Hydratation et glucides rapides pour maintenir l\'énergie.',
        icon: <DirectionsBikeIcon color="success" />,
        timing: 'Toutes les 20-30 min',
        foods: ['Boisson isotonique', 'Gel énergétique', 'Banane', 'Barre de céréales']
      },
      post: {
        title: 'Après l\'effort',
        description: 'Récupération avec protéines et glucides pour réparer les muscles.',
        icon: <LocalFireDepartmentIcon color="error" />,
        timing: 'Dans les 30 min',
        foods: ['Boisson protéinée', 'Yaourt grec', 'Fruits secs', 'Œufs']
      }
    };
    
    // Ajustements selon l'intensité
    if (intensityLevel >= 4) {
      recommendations.pre.foods.push('Riz blanc');
      recommendations.during.foods.push('Maltodextrine');
      recommendations.post.description = 'Récupération intense avec protéines et glucides pour réparer les muscles fatigués.';
      recommendations.post.foods.push('Shake de récupération complet');
    }
    
    // Ajustements selon le type d'entraînement
    if (session.type === 'Endurance') {
      recommendations.pre.description = 'Privilégiez les glucides complexes pour une énergie sur la durée.';
      recommendations.during.description = 'Hydratation régulière et apports caloriques constants.';
    } else if (session.type === 'Intensité' || session.type === 'HIIT') {
      recommendations.pre.description = 'Glucides facilement digestibles pour une énergie explosive.';
      recommendations.during.description = 'Hydratation et apports en glucides rapides entre les intervalles.';
      recommendations.pre.foods = ['Riz blanc', 'Banane', 'Pain blanc', 'Miel'];
    } else if (session.type === 'Ascension') {
      recommendations.pre.description = 'Charge glycémique importante avant un col difficile.';
      recommendations.during.description = 'Apports caloriques réguliers pour maintenir la puissance sur la durée.';
      recommendations.during.foods.push('Barres énergétiques spéciales montée');
    }
    
    return recommendations;
  };

  const recommendations = getRecommendations();
  
  return (
    <Paper 
      sx={{ 
        p: 3,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: isSameDay(new Date(session.date), new Date()) 
          ? `0 0 0 2px ${theme.palette.primary.main}` 
          : 'none'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              textTransform: 'capitalize'
            }}
          >
            <DirectionsBikeIcon color="primary" />
            {formattedDate}
            {isSameDay(new Date(session.date), new Date()) && (
              <Chip size="small" label="Aujourd'hui" color="primary" />
            )}
          </Typography>
          
          <Typography variant="h6" component="div" gutterBottom>
            {session.title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mt: 1 }}>
            <Chip 
              icon={<DirectionsBikeIcon />} 
              label={session.type} 
              size="small"
              color={
                session.type === 'Endurance' ? 'info' :
                session.type === 'Intensité' ? 'error' :
                session.type === 'HIIT' ? 'warning' :
                session.type === 'Ascension' ? 'success' : 'default'
              }
            />
            
            <Chip 
              icon={<TimerIcon />} 
              label={`${session.duration} min`} 
              size="small"
              variant="outlined"
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <WhatshotIcon fontSize="small" color="error" />
              <Typography variant="caption" sx={{ mr: 1 }}>Intensité:</Typography>
              {renderIntensityDots()}
            </Box>
            
            <Chip 
              icon={<LocalFireDepartmentIcon />} 
              label={`${session.estimatedCaloriesBurn} kcal`} 
              size="small"
              variant="outlined"
              color="error"
            />
          </Box>
        </Box>
        
        <IconButton onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      
      <Collapse in={expanded}>
        <Divider sx={{ my: 2 }} />
        
        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RestaurantIcon color="primary" />
            Recommandations nutritionnelles pour cette séance
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={4}>
              <NutritionTip 
                title={recommendations.pre.title}
                description={recommendations.pre.description}
                icon={recommendations.pre.icon}
                timing={recommendations.pre.timing}
                foods={recommendations.pre.foods}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <NutritionTip 
                title={recommendations.during.title}
                description={recommendations.during.description}
                icon={recommendations.during.icon}
                timing={recommendations.during.timing}
                foods={recommendations.during.foods}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <NutritionTip 
                title={recommendations.post.title}
                description={recommendations.post.description}
                icon={recommendations.post.icon}
                timing={recommendations.post.timing}
                foods={recommendations.post.foods}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            {nutritionPlan ? (
              <Button 
                variant="contained" 
                color="primary"
                component="a"
                href={`/nutrition/plans/${nutritionPlan.id}?date=${session.date}`}
              >
                Voir mon plan nutritionnel adapté
              </Button>
            ) : (
              <Button 
                variant="contained" 
                color="primary"
                component="a"
                href="/nutrition/plans/create"
              >
                Créer un plan nutritionnel adapté
              </Button>
            )}
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default TrainingSession;
