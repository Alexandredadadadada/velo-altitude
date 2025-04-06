import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  Button
} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { NutritionPlan } from '../../../types';

interface PlanRecommendationsProps {
  plan: NutritionPlan;
}

const PlanRecommendations: React.FC<PlanRecommendationsProps> = ({ plan }) => {
  const theme = useTheme();

  // Recommandations spécifiques selon l'objectif
  const getGoalSpecificRecommendations = () => {
    switch (plan.targetGoal) {
      case 'climbing':
        return {
          title: 'Recommandations pour l\'ascension de cols',
          recommendations: [
            'Optez pour des repas légers mais riches en glucides la veille d\'une ascension',
            'Maintenez un rapport poids/puissance optimal par une alimentation adaptée',
            'Augmentez votre consommation de glucides à 8-10g/kg de poids corporel les jours précédant un col difficile',
            'Prenez un petit-déjeuner riche en glucides 3h avant le départ',
            'Emportez suffisamment de ravitaillement pour l\'ascension (60g de glucides/heure)'
          ],
          icon: <DirectionsBikeIcon fontSize="large" sx={{ color: theme.palette.secondary.main }} />
        };
      case 'endurance':
        return {
          title: 'Recommandations pour l\'endurance',
          recommendations: [
            'Priorisez les glucides complexes à faible indice glycémique pour une énergie durable',
            'Répartissez les protéines (1.5-1.8g/kg de poids) sur l\'ensemble de la journée',
            'Hydratez-vous avec 500-750ml d\'eau par heure selon les conditions climatiques',
            'Incluez des graisses saines dans votre alimentation (avocats, huile d\'olive, noix)',
            'Consommez 60-90g de glucides par heure lors des efforts de plus de 2h30'
          ],
          icon: <MonitorHeartIcon fontSize="large" sx={{ color: theme.palette.info.main }} />
        };
      case 'performance':
        return {
          title: 'Recommandations pour la performance',
          recommendations: [
            'Périodisez votre apport en glucides selon vos sessions d\'entraînement',
            'Adoptez la stratégie "train low, compete high" pour maximiser les adaptations métaboliques',
            'Intégrez des sessions d\'entraînement le matin à jeun (avec précaution)',
            'Optimisez la fenêtre anabolique en consommant 20-25g de protéines dans les 30 min après l\'effort',
            'Expérimentez différents types de ravitaillement en compétition (gels, barres, boissons)'
          ],
          icon: <EmojiEventsIcon fontSize="large" sx={{ color: theme.palette.warning.main }} />
        };
      case 'weight_loss':
        return {
          title: 'Recommandations pour la perte de poids',
          recommendations: [
            'Créez un déficit calorique modéré (300-500 kcal/jour) pour préserver la masse musculaire',
            'Augmentez la consommation de protéines (1.8-2.2g/kg) pour maintenir la satiété',
            'Privilégiez les aliments à faible densité calorique et riches en nutriments',
            'Planifiez vos repas post-entraînement pour maximiser la récupération',
            'Évitez les restrictions trop sévères qui pourraient compromettre vos performances'
          ],
          icon: <LocalFireDepartmentIcon fontSize="large" sx={{ color: theme.palette.success.main }} />
        };
      default:
        return {
          title: 'Recommandations nutritionnelles générales',
          recommendations: [
            'Adaptez votre alimentation à votre volume d\'entraînement',
            'Hydratez-vous régulièrement tout au long de la journée',
            'Privilégiez les aliments non transformés et d\'origine végétale',
            'Variez vos sources de protéines, glucides et lipides',
            'Écoutez les signaux de faim et de satiété de votre corps'
          ],
          icon: <RestaurantIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />
        };
    }
  };

  const goalRecommendations = getGoalSpecificRecommendations();

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Suivi et Recommandations
      </Typography>

      <Grid container spacing={3}>
        {/* Recommandations spécifiques à l'objectif */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: '100%', borderColor: theme.palette.primary.main }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                {goalRecommendations.icon}
                <Typography variant="h6" component="h3" sx={{ ml: 2 }}>
                  {goalRecommendations.title}
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <List dense>
                {goalRecommendations.recommendations.map((recommendation, index) => (
                  <ListItem key={index} alignItems="flex-start">
                    <ListItemIcon sx={{ minWidth: '36px' }}>
                      <CheckCircleOutlineIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={recommendation}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Hydratation et électrolytes */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <WaterDropIcon fontSize="large" sx={{ color: theme.palette.info.main }} />
                <Typography variant="h6" component="h3" sx={{ ml: 2 }}>
                  Hydratation et Électrolytes
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" gutterBottom>
                  Besoins quotidiens en fluides
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Objectif: {Math.round(plan.userWeight * 0.03 * 1000)} ml par jour au minimum
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Pendant l'entraînement
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Box sx={{ p: 1, bgcolor: theme.palette.background.default, borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Effort modéré
                        </Typography>
                        <Typography variant="body2">
                          500-750 ml/heure
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ p: 1, bgcolor: theme.palette.background.default, borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Effort intense
                        </Typography>
                        <Typography variant="body2">
                          750-1000 ml/heure
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Électrolytes recommandés
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  <Chip label="Sodium: 500-700 mg/L" size="small" />
                  <Chip label="Potassium: 150-200 mg/L" size="small" />
                  <Chip label="Magnésium: 10-30 mg/L" size="small" />
                  <Chip label="Calcium: 20-60 mg/L" size="small" />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Adaptation à l'entraînement */}
          <Card variant="outlined">
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <DirectionsBikeIcon fontSize="large" sx={{ color: theme.palette.secondary.main }} />
                <Typography variant="h6" component="h3" sx={{ ml: 2 }}>
                  Adaptation à l'entraînement
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: theme.palette.background.default, borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Jours d'entraînement léger
                    </Typography>
                    <Typography variant="body2">
                      Glucides: {Math.round(plan.userWeight * 3)} - {Math.round(plan.userWeight * 4)} g
                    </Typography>
                    <Typography variant="body2">
                      Calories: {Math.round(plan.dailyCalories * 0.9)} kcal
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ p: 2, bgcolor: theme.palette.background.default, borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Jours d'entraînement intense
                    </Typography>
                    <Typography variant="body2">
                      Glucides: {Math.round(plan.userWeight * 6)} - {Math.round(plan.userWeight * 8)} g
                    </Typography>
                    <Typography variant="body2">
                      Calories: {Math.round(plan.dailyCalories * 1.2)} kcal
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => window.open('/nutrition/recettes?category=recovery', '_blank')}
                >
                  Voir les recettes de récupération
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PlanRecommendations;
