import React from 'react';
import { useNutritionRecommendations } from '../../hooks/useApi';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Paper, 
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RestoreIcon from '@mui/icons-material/Restore';
import SpaIcon from '@mui/icons-material/Spa';

interface NutritionRecommendationsProps {
  routeId: string;
}

const NutritionRecommendations: React.FC<NutritionRecommendationsProps> = ({ routeId }) => {
  const { data, loading, error } = useNutritionRecommendations(routeId);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
        <Typography variant="body1" ml={2}>
          Génération de vos recommandations nutritionnelles...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4} color="error.main">
        <ErrorOutlineIcon />
        <Typography variant="body1" ml={2}>
          Erreur lors de la génération des recommandations: {error.message}
        </Typography>
      </Box>
    );
  }

  if (!data || !data.recommendations) {
    return (
      <Box p={4}>
        <Typography variant="body1">
          Aucune recommandation nutritionnelle disponible. Veuillez sélectionner un itinéraire valide.
        </Typography>
      </Box>
    );
  }

  // Parse les recommandations générées par l'IA pour l'affichage
  const recommendationText = data.recommendations;

  // Conversion du texte en HTML avec préservation des sauts de ligne et formatage
  const formatRecommendation = (section: string) => {
    return { __html: section.replace(/\n/g, '<br/>') };
  };

  // Extraction des sections des recommandations
  const sections = [
    { 
      title: 'Alimentation avant sortie', 
      icon: <RestaurantIcon />,
      color: 'primary',
      content: extractSection(recommendationText, '1. Pre-Ride Nutrition', '2. During-Ride Fueling Strategy')
    },
    { 
      title: 'Alimentation pendant l\'effort', 
      icon: <AccessTimeIcon />,
      color: 'secondary',
      content: extractSection(recommendationText, '2. During-Ride Fueling Strategy', '3. Hydration Plan')
    },
    { 
      title: 'Plan d\'hydratation', 
      icon: <LocalDrinkIcon />,
      color: 'info',
      content: extractSection(recommendationText, '3. Hydration Plan', '4. Post-Ride Recovery Nutrition')
    },
    { 
      title: 'Récupération après l\'effort', 
      icon: <RestoreIcon />,
      color: 'success',
      content: extractSection(recommendationText, '4. Post-Ride Recovery Nutrition', '5. Key Nutrients for Mountain Climbing Performance')
    },
    { 
      title: 'Nutriments clés pour la performance', 
      icon: <SpaIcon />,
      color: 'warning',
      content: extractSection(recommendationText, '5. Key Nutrients for Mountain Climbing Performance', '')
    }
  ];

  // Détails de l'itinéraire pour contextualiser les recommandations
  const routeDetails = data.route;

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Plan nutritionnel personnalisé
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Ce plan nutritionnel est spécifiquement adapté pour votre profil et l'itinéraire "{routeDetails.name || 'sélectionné'}" 
        {routeDetails.statistics && ` (${Math.round(routeDetails.statistics.distance)} km, ${Math.round(routeDetails.statistics.elevationGain)}m D+)`}.
      </Alert>
      
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary.main">
                <Box display="flex" alignItems="center">
                  <AccessTimeIcon sx={{ mr: 1 }} />
                  Durée estimée de l'effort
                </Box>
              </Typography>
              <Typography variant="h4">
                {routeDetails.statistics?.distance 
                  ? `${Math.round(routeDetails.statistics.distance * 4)} min` 
                  : 'Non disponible'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Basé sur une vitesse moyenne de 15 km/h
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="secondary.main">
                <Box display="flex" alignItems="center">
                  <LocalDrinkIcon sx={{ mr: 1 }} />
                  Besoins hydriques estimés
                </Box>
              </Typography>
              <Typography variant="h4">
                {routeDetails.statistics?.distance 
                  ? `${Math.round(routeDetails.statistics.distance * 0.5)} L` 
                  : 'Non disponible'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Calculé selon distance et conditions météo
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box mb={2}>
        <Typography variant="h6" gutterBottom>
          Détails nutritionnels
        </Typography>
        
        <Box display="flex" flexWrap="wrap" gap={1} mt={2} mb={3}>
          <Chip 
            label="Protéines"
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip 
            label="Glucides complexes"
            size="small"
            color="secondary"
            variant="outlined"
          />
          <Chip 
            label="Électrolytes"
            size="small"
            color="info"
            variant="outlined"
          />
          <Chip 
            label="Antioxydants"
            size="small"
            color="success"
            variant="outlined"
          />
          <Chip 
            label="Acides gras essentiels"
            size="small"
            color="warning"
            variant="outlined"
          />
        </Box>
      </Box>

      <Box mt={4}>
        {sections.map((section, index) => (
          <Accordion key={index} defaultExpanded={index === 0}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                {section.icon}
                <Typography variant="h6">{section.title}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography 
                variant="body1" 
                component="div"
                dangerouslySetInnerHTML={formatRecommendation(section.content)}
              />
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Paper>
  );
};

// Fonction pour extraire une section spécifique des recommandations textuelles
function extractSection(text: string, startMarker: string, endMarker: string): string {
  const startIndex = text.indexOf(startMarker);
  
  if (startIndex === -1) {
    return "Information non disponible";
  }
  
  let endIndex = text.length;
  if (endMarker && text.indexOf(endMarker) !== -1) {
    endIndex = text.indexOf(endMarker);
  }
  
  return text.substring(startIndex + startMarker.length, endIndex).trim();
}

export default NutritionRecommendations;
