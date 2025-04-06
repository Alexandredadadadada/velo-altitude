import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Card,
  CardContent,
  CardActions,
  Divider,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  Tooltip,
  IconButton
} from '@mui/material';
import { 
  FoodBank as FoodBankIcon,
  Restaurant as RestaurantIcon,
  DirectionsBike as DirectionsBikeIcon,
  ExpandMore as ExpandMoreIcon,
  LocalFireDepartment as LocalFireDepartmentIcon,
  FitnessCenter as FitnessCenterIcon,
  EmojiEvents as EmojiEventsIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { APIOrchestrator } from '../../../../api/orchestration';

// Interface pour les propriétés du composant
interface NutritionRecommendationsProps {
  recommendations: any;
  trainingSessions: any[];
  nutritionPlan: any;
}

// Interface pour les articles alimentaires recommandés
interface FoodItem {
  id: string;
  name: string;
  category: string;
  timing: 'pre' | 'during' | 'post';
  description: string;
  benefits: string[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  example: string;
}

const NutritionRecommendations: React.FC<NutritionRecommendationsProps> = ({ 
  recommendations,
  trainingSessions,
  nutritionPlan
}) => {
  const theme = useTheme();
  const [expandedAccordion, setExpandedAccordion] = useState<string | false>('panel1');
  const [addedToJournal, setAddedToJournal] = useState<Record<string, boolean>>({});
  
  // Gestion du changement d'accordéon
  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedAccordion(isExpanded ? panel : false);
  };
  
  // Ajout d'un aliment au journal
  const handleAddToJournal = async (foodItem: FoodItem) => {
    try {
      const api = new APIOrchestrator();
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Déterminer le repas selon le timing
      let mealType = '';
      switch (foodItem.timing) {
        case 'pre':
          mealType = 'petit-déjeuner';
          break;
        case 'during':
          mealType = 'déjeuner';
          break;
        case 'post':
          mealType = 'dîner';
          break;
      }
      
      // Créer l'entrée pour le journal
      const entry = {
        date: today,
        mealType,
        foodName: foodItem.name,
        portion: 1,
        calories: foodItem.macros.calories,
        protein: foodItem.macros.protein,
        carbs: foodItem.macros.carbs,
        fat: foodItem.macros.fat,
        notes: `Recommandé pour ${foodItem.timing === 'pre' ? 'avant' : foodItem.timing === 'during' ? 'pendant' : 'après'} l'entraînement`
      };
      
      // Ajouter au journal
      await api.createNutritionLogEntry(entry);
      
      // Mettre à jour l'état local
      setAddedToJournal(prev => ({
        ...prev,
        [foodItem.id]: true
      }));
      
      // Réinitialiser après 3 secondes pour l'effet visuel
      setTimeout(() => {
        setAddedToJournal(prev => ({
          ...prev,
          [foodItem.id]: false
        }));
      }, 3000);
      
    } catch (err) {
      console.error('Erreur lors de l\'ajout au journal:', err);
    }
  };
  
  // Formatage de la date
  const getFormattedDate = (daysToAdd: number = 0) => {
    const date = addDays(new Date(), daysToAdd);
    return format(date, 'EEEE d MMMM', { locale: fr });
  };
  
  // Générer des recommandations selon les entraînements
  const generateRecommendations = () => {
    if (!recommendations || !recommendations.foodRecommendations) {
      return {
        pre: [],
        during: [],
        post: []
      };
    }
    
    // Copier les recommandations de l'API
    const preWorkout = [...recommendations.foodRecommendations.pre];
    const duringWorkout = [...recommendations.foodRecommendations.during];
    const postWorkout = [...recommendations.foodRecommendations.post];
    
    // Évaluer le type d'entraînement principal des prochains jours
    const upcomingTrainingTypes = trainingSessions
      .slice(0, 3)
      .map(session => session.type);
    
    const hasHighIntensity = upcomingTrainingTypes.some(type => 
      type === 'Intensité' || type === 'HIIT'
    );
    
    const hasEndurance = upcomingTrainingTypes.some(type => 
      type === 'Endurance'
    );
    
    const hasClimb = upcomingTrainingTypes.some(type => 
      type === 'Ascension'
    );
    
    // Ajuster les recommandations selon les types d'entraînement
    if (hasHighIntensity) {
      // Ajouter des aliments spécifiques pour l'intensité
      preWorkout.push({
        id: 'high-carb-breakfast',
        name: 'Petit-déjeuner riche en glucides',
        category: 'Repas',
        timing: 'pre',
        description: 'Repas riche en glucides facilement assimilables pour préparer une séance intense',
        benefits: ['Énergie explosive', 'Glycogène musculaire', 'Prévention de la fatigue précoce'],
        macros: {
          calories: 450,
          protein: 15,
          carbs: 75,
          fat: 10
        },
        example: 'Porridge d\'avoine avec miel, banane et myrtilles + toast avec confiture'
      });
    }
    
    if (hasEndurance) {
      // Ajouter des aliments spécifiques pour l'endurance
      duringWorkout.push({
        id: 'slow-release-energy-bar',
        name: 'Barre énergétique à libération lente',
        category: 'En-cas',
        timing: 'during',
        description: 'Barre spécialement conçue pour les sorties longues avec libération progressive d\'énergie',
        benefits: ['Énergie constante', 'Prévention des coups de fatigue', 'Digestion facile'],
        macros: {
          calories: 220,
          protein: 5,
          carbs: 40,
          fat: 6
        },
        example: 'Barre aux dattes, amandes et graines de chia'
      });
    }
    
    if (hasClimb) {
      // Ajouter des aliments spécifiques pour l'ascension
      preWorkout.push({
        id: 'mountain-breakfast',
        name: 'Petit-déjeuner spécial ascension',
        category: 'Repas',
        timing: 'pre',
        description: 'Repas complet pour préparer une ascension difficile',
        benefits: ['Réserves d\'énergie maximales', 'Hydratation optimisée', 'Prévention des crampes'],
        macros: {
          calories: 550,
          protein: 20,
          carbs: 85,
          fat: 15
        },
        example: 'Riz au lait avec fruits secs, omelette aux légumes et toast complet avec avocat'
      });
      
      duringWorkout.push({
        id: 'electrolyte-drink',
        name: 'Boisson électrolytique',
        category: 'Boisson',
        timing: 'during',
        description: 'Formule équilibrée en électrolytes pour prévenir les crampes en montée',
        benefits: ['Hydratation optimale', 'Prévention des crampes', 'Performance soutenue'],
        macros: {
          calories: 120,
          protein: 0,
          carbs: 30,
          fat: 0
        },
        example: 'Boisson isotonique avec sodium, potassium et magnésium'
      });
    }
    
    return {
      pre: preWorkout,
      during: duringWorkout,
      post: postWorkout
    };
  };

  const foodRecommendations = generateRecommendations();
  
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FoodBankIcon color="primary" />
          Recommandations nutritionnelles selon votre calendrier d'entraînement
        </Typography>
        
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 2, 
            bgcolor: `${theme.palette.info.main}10`,
            borderColor: theme.palette.info.main,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}
        >
          <InfoIcon color="info" />
          <Typography variant="body2">
            Ces recommandations sont personnalisées en fonction de vos prochaines séances d'entraînement
            et de vos objectifs. Elles s'adaptent automatiquement à l'intensité et au type de vos séances prévues.
          </Typography>
        </Paper>
      </Box>
      
      <Accordion 
        expanded={expandedAccordion === 'panel1'} 
        onChange={handleAccordionChange('panel1')}
        sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
          sx={{ bgcolor: theme.palette.background.default }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RestaurantIcon color="primary" />
            <Typography variant="subtitle1">
              Avant l'entraînement ({foodRecommendations.pre.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {foodRecommendations.pre.length === 0 ? (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  Aucune recommandation spécifique disponible.
                </Typography>
              </Grid>
            ) : (
              foodRecommendations.pre.map((food: FoodItem) => (
                <Grid item xs={12} md={6} key={food.id}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle2">
                          {food.name}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={food.category} 
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {food.description}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        {food.benefits.map((benefit, index) => (
                          <Chip 
                            key={index}
                            size="small"
                            label={benefit}
                            sx={{ mr: 1, mb: 1 }}
                            color="success"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                        <Typography variant="caption" color="error.main">
                          {food.macros.calories} kcal
                        </Typography>
                        <Typography variant="caption" color="primary.main">
                          P: {food.macros.protein}g
                        </Typography>
                        <Typography variant="caption" color="info.main">
                          G: {food.macros.carbs}g
                        </Typography>
                        <Typography variant="caption" color="warning.main">
                          L: {food.macros.fat}g
                        </Typography>
                      </Box>
                      
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                        Exemple: {food.example}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small"
                        startIcon={addedToJournal[food.id] ? <CheckIcon /> : <AddIcon />}
                        color={addedToJournal[food.id] ? "success" : "primary"}
                        onClick={() => handleAddToJournal(food)}
                        disabled={addedToJournal[food.id]}
                      >
                        {addedToJournal[food.id] ? 'Ajouté au journal' : 'Ajouter au journal'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      <Accordion 
        expanded={expandedAccordion === 'panel2'} 
        onChange={handleAccordionChange('panel2')}
        sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel2-content"
          id="panel2-header"
          sx={{ bgcolor: theme.palette.background.default }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DirectionsBikeIcon color="success" />
            <Typography variant="subtitle1">
              Pendant l'entraînement ({foodRecommendations.during.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {foodRecommendations.during.length === 0 ? (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  Aucune recommandation spécifique disponible.
                </Typography>
              </Grid>
            ) : (
              foodRecommendations.during.map((food: FoodItem) => (
                <Grid item xs={12} md={6} key={food.id}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle2">
                          {food.name}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={food.category} 
                          color="success"
                          variant="outlined"
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {food.description}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        {food.benefits.map((benefit, index) => (
                          <Chip 
                            key={index}
                            size="small"
                            label={benefit}
                            sx={{ mr: 1, mb: 1 }}
                            color="success"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                        <Typography variant="caption" color="error.main">
                          {food.macros.calories} kcal
                        </Typography>
                        <Typography variant="caption" color="primary.main">
                          P: {food.macros.protein}g
                        </Typography>
                        <Typography variant="caption" color="info.main">
                          G: {food.macros.carbs}g
                        </Typography>
                        <Typography variant="caption" color="warning.main">
                          L: {food.macros.fat}g
                        </Typography>
                      </Box>
                      
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                        Exemple: {food.example}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small"
                        startIcon={addedToJournal[food.id] ? <CheckIcon /> : <AddIcon />}
                        color={addedToJournal[food.id] ? "success" : "primary"}
                        onClick={() => handleAddToJournal(food)}
                        disabled={addedToJournal[food.id]}
                      >
                        {addedToJournal[food.id] ? 'Ajouté au journal' : 'Ajouter au journal'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      <Accordion 
        expanded={expandedAccordion === 'panel3'} 
        onChange={handleAccordionChange('panel3')}
        sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel3-content"
          id="panel3-header"
          sx={{ bgcolor: theme.palette.background.default }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalFireDepartmentIcon color="error" />
            <Typography variant="subtitle1">
              Après l'entraînement ({foodRecommendations.post.length})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {foodRecommendations.post.length === 0 ? (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  Aucune recommandation spécifique disponible.
                </Typography>
              </Grid>
            ) : (
              foodRecommendations.post.map((food: FoodItem) => (
                <Grid item xs={12} md={6} key={food.id}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle2">
                          {food.name}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={food.category} 
                          color="error"
                          variant="outlined"
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {food.description}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        {food.benefits.map((benefit, index) => (
                          <Chip 
                            key={index}
                            size="small"
                            label={benefit}
                            sx={{ mr: 1, mb: 1 }}
                            color="success"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                      
                      <Divider sx={{ my: 1 }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                        <Typography variant="caption" color="error.main">
                          {food.macros.calories} kcal
                        </Typography>
                        <Typography variant="caption" color="primary.main">
                          P: {food.macros.protein}g
                        </Typography>
                        <Typography variant="caption" color="info.main">
                          G: {food.macros.carbs}g
                        </Typography>
                        <Typography variant="caption" color="warning.main">
                          L: {food.macros.fat}g
                        </Typography>
                      </Box>
                      
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                        Exemple: {food.example}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small"
                        startIcon={addedToJournal[food.id] ? <CheckIcon /> : <AddIcon />}
                        color={addedToJournal[food.id] ? "success" : "primary"}
                        onClick={() => handleAddToJournal(food)}
                        disabled={addedToJournal[food.id]}
                      >
                        {addedToJournal[food.id] ? 'Ajouté au journal' : 'Ajouter au journal'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      {/* Conseils spécifiques pour les objectifs */}
      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEventsIcon color="warning" />
          Conseils personnalisés selon vos objectifs
        </Typography>
        
        <List>
          {recommendations && recommendations.goalSpecificAdvice ? (
            recommendations.goalSpecificAdvice.map((advice: string, index: number) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <FitnessCenterIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={advice} />
              </ListItem>
            ))
          ) : (
            <ListItem>
              <ListItemIcon>
                <WarningIcon color="warning" />
              </ListItemIcon>
              <ListItemText primary="Définissez vos objectifs dans votre profil pour recevoir des conseils personnalisés." />
            </ListItem>
          )}
        </List>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Button 
            variant="outlined" 
            component="a"
            href="/nutrition/plans"
            sx={{ mr: 2 }}
          >
            Voir tous mes plans
          </Button>
          
          <Button 
            variant="contained" 
            component="a"
            href="/nutrition/journal"
          >
            Aller au journal alimentaire
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default NutritionRecommendations;
