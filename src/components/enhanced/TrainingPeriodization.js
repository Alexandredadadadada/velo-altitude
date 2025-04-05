import React, { useState } from 'react';
import {
  Paper, Typography, Box, Grid, Button, Chip, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, IconButton, Card, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import {
  Today, ArrowForward, HelpOutline, Event, TimelineOutlined
} from '@mui/icons-material';

/**
 * Composant de périodisation annuelle pour les cyclistes
 * Permet d'organiser le calendrier d'entraînement sur toute l'année
 */
const TrainingPeriodization = ({ userId }) => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedPhase, setSelectedPhase] = useState('base1');
  
  // Phases d'entraînement disponibles
  const trainingPhases = [
    { id: 'preparation', name: 'Préparation', duration: '4-6 semaines', color: '#e3f2fd' },
    { id: 'base1', name: 'Base 1', duration: '4-6 semaines', color: '#bbdefb' },
    { id: 'base2', name: 'Base 2', duration: '4-6 semaines', color: '#90caf9' },
    { id: 'build1', name: 'Construction 1', duration: '3-4 semaines', color: '#64b5f6' },
    { id: 'build2', name: 'Construction 2', duration: '3-4 semaines', color: '#42a5f5' },
    { id: 'peak', name: 'Pic de forme', duration: '2-3 semaines', color: '#2196f3' },
    { id: 'race', name: 'Compétition', duration: 'Variable', color: '#1976d2' },
    { id: 'recovery', name: 'Récupération', duration: '1-3 semaines', color: '#cfd8dc' }
  ];
  
  // Description des phases d'entraînement
  const phaseDescriptions = {
    preparation: {
      focus: 'Adaptation physiologique de base',
      volume: 'Faible à modéré',
      intensity: 'Très basse',
      workouts: [
        'Sorties longues en zone 1-2',
        'Force en salle de musculation',
        'Technique de pédalage'
      ]
    },
    base1: {
      focus: 'Endurance aérobie fondamentale',
      volume: 'Modéré à élevé',
      intensity: 'Basse',
      workouts: [
        'Sorties longues en zone 2',
        'Travail de cadence',
        'Introduction d\'intervalles en zone 3'
      ]
    },
    base2: {
      focus: 'Renforcement de l\'endurance aérobie',
      volume: 'Élevé',
      intensity: 'Modérée',
      workouts: [
        'Volume important en zone 2',
import EnhancedMetaTags from '../common/EnhancedMetaTags';
        'Intervalles en sweet spot (88-93% FTP)',
        'Travail de la puissance au seuil'
      ]
    },
    build1: {
      focus: 'Développement de la puissance au seuil',
      volume: 'Modéré à élevé',
      intensity: 'Modérée à élevée',
      workouts: [
        'Intervalles au seuil (zone 4)',
        'Sweet spot prolongé',
        'Entraînements spécifiques terrain'
      ]
    },
    build2: {
      focus: 'Amélioration de la puissance et VO2max',
      volume: 'Modéré',
      intensity: 'Élevée',
      workouts: [
        'Intervalles courts haute intensité',
        'Travail VO2max (zone 5)',
        'Enchaînements spécifiques'
      ]
    },
    peak: {
      focus: 'Affûtage et préparation finale',
      volume: 'Bas à modéré',
      intensity: 'Très élevée',
      workouts: [
        'Intensité spécifique compétition',
        'Réduction du volume',
        'Simulations de course'
      ]
    },
    race: {
      focus: 'Maintien de la forme et récupération',
      volume: 'Variable',
      intensity: 'Variable',
      workouts: [
        'Maintien de l\'intensité',
        'Récupération entre compétitions',
        'Affûtage pré-compétition'
      ]
    },
    recovery: {
      focus: 'Récupération et régénération',
      volume: 'Très bas',
      intensity: 'Très basse',
      workouts: [
        'Sorties légères de récupération',
        'Activités alternatives',
        'Repos actif'
      ]
    }
  };

  // Calendrier annuel avec 12 mois
  const annualCalendar = [
    { month: 'Janvier', phase: 'preparation' },
    { month: 'Février', phase: 'base1' },
    { month: 'Mars', phase: 'base2' },
    { month: 'Avril', phase: 'build1' },
    { month: 'Mai', phase: 'build2' },
    { month: 'Juin', phase: 'peak' },
    { month: 'Juillet', phase: 'race' },
    { month: 'Août', phase: 'race' },
    { month: 'Septembre', phase: 'recovery' },
    { month: 'Octobre', phase: 'preparation' },
    { month: 'Novembre', phase: 'base1' },
    { month: 'Décembre', phase: 'base2' }
  ];

  // Rendu du composant
  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "ExercisePlan",
          "name": "Programme d'Entraînement Cycliste",
          "description": "Plans d'entraînement spécifiques pour préparer les ascensions de cols.",
          "url": "https://velo-altitude.com/trainingperiodization"
        }
      </script>
      <EnhancedMetaTags
        title="Programmes d'Entraînement | Velo-Altitude"
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="article"
        imageUrl="/images/og-image.jpg"
      />
    <Paper elevation={0} variant="outlined" sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
          Périodisation annuelle
        </Typography>
        <Tooltip title="Planifiez votre progression annuelle en cycles d'entraînement">
          <IconButton size="small">
            <HelpOutline fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Calendrier annuel */}
      <Grid container spacing={1} sx={{ mb: 3 }}>
        {annualCalendar.map((item, index) => (
          <Grid item xs={1} key={index}>
            <Box
              onClick={() => setSelectedPhase(item.phase)}
              sx={{
                p: 1,
                height: 60,
                bgcolor: trainingPhases.find(phase => phase.id === item.phase)?.color,
                borderRadius: 1,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: selectedPhase === item.phase ? 1 : 0.7,
                border: selectedPhase === item.phase ? '2px solid' : 'none',
                borderColor: 'primary.main',
                '&:hover': { opacity: 1 }
              }}
            >
              <Typography variant="caption" fontWeight="bold">
                {item.month.substring(0, 3)}
              </Typography>
              <Typography variant="caption" fontSize={10}>
                {trainingPhases.find(phase => phase.id === item.phase)?.name}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Détails de la phase sélectionnée */}
      {selectedPhase && phaseDescriptions[selectedPhase] && (
        <Card variant="outlined" sx={{ mb: 3 }}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Phase: {trainingPhases.find(phase => phase.id === selectedPhase)?.name}
              </Typography>
              <Chip 
                size="small" 
                label={trainingPhases.find(phase => phase.id === selectedPhase)?.duration} 
                sx={{ ml: 2 }}
              />
            </Box>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">Objectif principal</Typography>
                <Typography variant="body2">{phaseDescriptions[selectedPhase].focus}</Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">Volume</Typography>
                <Typography variant="body2">{phaseDescriptions[selectedPhase].volume}</Typography>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="text.secondary">Intensité</Typography>
                <Typography variant="body2">{phaseDescriptions[selectedPhase].intensity}</Typography>
              </Grid>
            </Grid>
          </Box>
          
          {/* Entraînements recommandés */}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Entraînements recommandés</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {phaseDescriptions[selectedPhase].workouts.map((workout, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TimelineOutlined fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2">{workout}</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
      
      {/* Programmes spécialisés */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Programmes spécialisés
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Button 
              variant="outlined" 
              fullWidth
              startIcon={<Event />}
              sx={{ justifyContent: 'flex-start', py: 1 }}
            >
              Programme perte de poids
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button 
              variant="outlined" 
              fullWidth
              startIcon={<Event />}
              sx={{ justifyContent: 'flex-start', py: 1 }}
            >
              Programme endurance
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Button 
              variant="outlined" 
              fullWidth
              startIcon={<Event />}
              sx={{ justifyContent: 'flex-start', py: 1 }}
            >
              Programme puissance
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      {/* Note informative */}
      <Typography variant="caption" color="text.secondary">
        Ce calendrier est basé sur un modèle de périodisation traditionnel. Adaptez-le selon vos objectifs 
        personnels et votre calendrier de compétitions.
      </Typography>
    </Paper>
  );
};

export default TrainingPeriodization;
