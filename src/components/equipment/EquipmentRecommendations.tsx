import React from 'react';
import { useEquipmentRecommendations } from '../../hooks/useApi';
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
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import BuildIcon from '@mui/icons-material/Build';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import WatchIcon from '@mui/icons-material/Watch';

interface EquipmentRecommendationsProps {
  routeId: string;
}

const EquipmentRecommendations: React.FC<EquipmentRecommendationsProps> = ({ routeId }) => {
  const { data, loading, error } = useEquipmentRecommendations(routeId);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
        <Typography variant="body1" ml={2}>
          Génération de vos recommandations d'équipement...
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
          Aucune recommandation d'équipement disponible. Veuillez sélectionner un itinéraire valide.
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
      title: 'Configuration du vélo', 
      icon: <TwoWheelerIcon />,
      color: 'primary',
      content: extractSection(recommendationText, '1. Bike Setup', '2. Clothing Recommendations')
    },
    { 
      title: 'Vêtements recommandés', 
      icon: <CheckroomIcon />,
      color: 'secondary',
      content: extractSection(recommendationText, '2. Clothing Recommendations', '3. Essential Gear')
    },
    { 
      title: 'Équipement essentiel', 
      icon: <BuildIcon />,
      color: 'error',
      content: extractSection(recommendationText, '3. Essential Gear', '4. Nutrition Storage')
    },
    { 
      title: 'Stockage nutritionnel', 
      icon: <LunchDiningIcon />,
      color: 'success',
      content: extractSection(recommendationText, '4. Nutrition Storage', '5. Electronics')
    },
    { 
      title: 'Électronique', 
      icon: <WatchIcon />,
      color: 'info',
      content: extractSection(recommendationText, '5. Electronics', '')
    }
  ];

  // Détails de l'itinéraire et de la météo pour contextualiser les recommandations
  const routeDetails = data.route;
  const weatherData = routeDetails.weather?.start;

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Recommandations d'équipement
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Ces recommandations sont spécifiquement adaptées pour l'itinéraire "{routeDetails.name || 'sélectionné'}" 
        et les conditions météorologiques prévues.
      </Alert>
      
      <Divider sx={{ mb: 3 }} />

      {weatherData && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary.main">
              Conditions météorologiques prises en compte
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <img 
                  src={`https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`}
                  alt={weatherData.weather[0].description}
                  width={80}
                  height={80}
                />
              </Grid>
              
              <Grid item xs>
                <Typography variant="h5">
                  {Math.round(weatherData.main.temp)}°C, {weatherData.weather[0].description}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ressenti: {Math.round(weatherData.main.feels_like)}°C
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Humidité: {weatherData.main.humidity}%, Vent: {Math.round(weatherData.wind.speed * 3.6)} km/h
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="secondary.main">
                <Box display="flex" alignItems="center">
                  <TwoWheelerIcon sx={{ mr: 1 }} />
                  Caractéristiques du parcours
                </Box>
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary={`Distance: ${routeDetails.statistics?.distance ? Math.round(routeDetails.statistics.distance) : '?'} km`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={`Dénivelé: ${routeDetails.statistics?.elevationGain ? Math.round(routeDetails.statistics.elevationGain) : '?'} m`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={`Pente max: ${routeDetails.statistics?.grade ? routeDetails.statistics.grade.toFixed(1) : '?'}%`} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary={`Point culminant: ${routeDetails.statistics?.highestPoint ? Math.round(routeDetails.statistics.highestPoint) : '?'} m`} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom color="error.main">
                <Box display="flex" alignItems="center">
                  <BuildIcon sx={{ mr: 1 }} />
                  Éléments à ne pas oublier
                </Box>
              </Typography>
              
              <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
                <Chip label="Multi-tool" color="primary" />
                <Chip label="Chambre à air" color="primary" />
                <Chip label="Pompe" color="primary" />
                <Chip label="Coupe-vent" color="secondary" />
                <Chip label="Lunettes" color="secondary" />
                <Chip label="Crème solaire" color="warning" />
                <Chip label="Batterie externe" color="info" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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

export default EquipmentRecommendations;
