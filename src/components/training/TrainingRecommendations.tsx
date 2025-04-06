import React from 'react';
import { useTrainingRecommendations } from '../../hooks/useApi';
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
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import TimelineIcon from '@mui/icons-material/Timeline';
import RestoreIcon from '@mui/icons-material/Restore';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const TrainingRecommendations: React.FC = () => {
  const { data, loading, error } = useTrainingRecommendations();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
        <Typography variant="body1" ml={2}>
          Génération de votre plan d'entraînement personnalisé...
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
          Aucune recommandation d'entraînement disponible. Veuillez vous connecter avec Strava pour obtenir des recommandations personnalisées.
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
      title: 'Planning hebdomadaire', 
      icon: <TimelineIcon />,
      color: 'primary',
      content: extractSection(recommendationText, '1. Weekly Schedule', '2. Key Workouts')
    },
    { 
      title: 'Séances clés', 
      icon: <FitnessCenterIcon />,
      color: 'secondary',
      content: extractSection(recommendationText, '2. Key Workouts', '3. Specific Mountain Climbing Focus')
    },
    { 
      title: 'Focus sur l\'escalade', 
      icon: <DirectionsBikeIcon />,
      color: 'success',
      content: extractSection(recommendationText, '3. Specific Mountain Climbing Focus', '4. Recovery Recommendations')
    },
    { 
      title: 'Récupération', 
      icon: <RestoreIcon />,
      color: 'info',
      content: extractSection(recommendationText, '4. Recovery Recommendations', '5. Progress Tracking Metrics')
    },
    { 
      title: 'Suivi des progrès', 
      icon: <TrendingUpIcon />,
      color: 'warning',
      content: extractSection(recommendationText, '5. Progress Tracking Metrics', '')
    }
  ];

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Plan d'entraînement personnalisé
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Ce plan d'entraînement est généré spécifiquement pour vous en fonction de vos données Strava et est optimisé pour l'escalade en montagne.
      </Alert>
      
      <Divider sx={{ mb: 3 }} />

      <Box mb={2}>
        <Typography variant="h6" gutterBottom>
          Profil athlète analysé
        </Typography>
        
        <Box display="flex" flexWrap="wrap" gap={1} mt={2} mb={3}>
          {data.athlete.weight && (
            <Chip 
              label={`Poids: ${data.athlete.weight} kg`}
              size="small"
              color="default"
              variant="outlined"
            />
          )}
          {data.athlete.ftp && (
            <Chip 
              label={`FTP: ${data.athlete.ftp} W`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          <Chip 
            label={`${data.athlete.activities?.length || 0} activités analysées`}
            size="small"
            color="info"
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

export default TrainingRecommendations;
