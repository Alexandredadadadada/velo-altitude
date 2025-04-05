/**
 * BeforeEventSection - Section du guide sur la préparation nutritionnelle avant un événement longue distance
 */
import React from 'react';
import { 
  Box, Typography, Paper, Grid, List, ListItem, 
  ListItemIcon, ListItemText, Divider, Accordion,
  AccordionSummary, AccordionDetails, Chip
} from '@mui/material';
import { 
  ExpandMore, CalendarToday, RestaurantMenu, 
  DinnerDining, Opacity, Notifications, Info
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
}));

const InfoChip = styled(Chip)(({ theme }) => ({
  marginRight: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

/**
 * Section sur la préparation nutritionnelle avant un événement longue distance
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.content - Contenu de la section
 */
const BeforeEventSection = ({ content = {} }) => {
  // Données de secours en cas de contenu manquant
  const defaultContent = {
    title: "Préparation nutritionnelle avant l'événement",
    intro: "Une bonne préparation nutritionnelle dans les jours précédant votre événement longue distance est aussi importante que l'entraînement lui-même. Découvrez comment optimiser votre alimentation pour maximiser vos performances et votre endurance.",
    timelines: [
      {
        title: "7 jours avant",
        points: [
          "Commencez à augmenter progressivement votre apport en glucides",
          "Maintenez une hydratation optimale tout au long de la journée",
          "Limitez l'alcool et les aliments très épicés ou gras"
        ]
      },
      {
        title: "3 jours avant",
        points: [
          "Augmentez vos glucides à 8-10g/kg de poids corporel",
          "Réduisez légèrement les fibres pour éviter les problèmes digestifs",
          "Testez vos repas de compétition lors de vos derniers entraînements"
        ]
      },
      {
        title: "Veille de l'événement",
        points: [
          "Repas riche en glucides et modéré en protéines le soir",
          "Hydratation constante sans excès (urine légèrement jaune pâle)",
          "Évitez les aliments nouveaux ou à risque digestif"
        ]
      },
      {
        title: "Jour J (avant le départ)",
        points: [
          "Petit-déjeuner complet 2-3h avant le départ",
          "Dernière collation légère 30-60min avant",
          "400-600ml d'eau ou boisson d'effort dans l'heure précédant le départ"
        ]
      }
    ],
    carboLoading: {
      title: "Charge glucidique optimale",
      description: "La stratégie de charge en glucides, ou 'carbo-loading', permet de maximiser vos réserves de glycogène pour les événements de plus de 90 minutes.",
      steps: [
        "Commencez par un entraînement d'épuisement glycogénique 7 jours avant",
        "Augmentez progressivement l'apport en glucides jusqu'à 8-10g/kg/jour",
        "Réduisez le volume d'entraînement dans les 2-3 jours précédant l'événement",
        "Privilégiez les glucides à index glycémique moyen à élevé la veille"
      ],
      warning: "Cette stratégie n'est pas nécessaire pour des événements de moins de 90 minutes et peut provoquer une sensation de lourdeur chez certains cyclistes."
    },
    meals: [
      {
        title: "Petit-déjeuner idéal (3h avant)",
        description: "Porridge à l'avoine avec banane, miel et amandes + yaourt grec + jus d'orange",
        macros: "100g de glucides, 20g de protéines, 15g de lipides"
      },
      {
        title: "Collation pré-départ (1h avant)",
        description: "Barre énergétique ou banane + 20g de boisson d'effort",
        macros: "40g de glucides, 5g de protéines, 5g de lipides"
      }
    ],
    hydration: {
      title: "Stratégie d'hydratation pré-événement",
      steps: [
        "Visez 2L d'eau ou plus par jour dans les 48h précédant l'événement",
        "Ajoutez des électrolytes si la météo prévue est chaude",
        "Évitez la surhydratation: vos urines doivent être jaune pâle, pas totalement claires",
        "Cessez de boire de grands volumes 60 minutes avant le départ pour éviter les arrêts toilettes"
      ]
    },
    supplements: [
      {
        name: "Créatine",
        timing: "3-5g/jour pendant 7 jours avant",
        benefit: "Améliore l'endurance et la puissance sur les efforts répétés",
        caution: "Peut causer une légère rétention d'eau"
      },
      {
        name: "Bêta-alanine",
        timing: "4-6g/jour pendant 2-4 semaines avant",
        benefit: "Réduit l'acidité musculaire et retarde la fatigue",
        caution: "Peut provoquer des picotements cutanés temporaires"
      },
      {
        name: "Caféine",
        timing: "3-6mg/kg, 60 minutes avant le départ",
        benefit: "Améliore la vigilance et l'endurance, réduit la perception de l'effort",
        caution: "Peut causer nervosité et problèmes digestifs chez certains"
      }
    ]
  };
  
  // Utiliser le contenu fourni ou les données par défaut
  const {
    title = defaultContent.title,
    intro = defaultContent.intro,
    timelines = defaultContent.timelines,
    carboLoading = defaultContent.carboLoading,
    meals = defaultContent.meals,
    hydration = defaultContent.hydration,
    supplements = defaultContent.supplements
  } = content;

  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom>
        {title}
      </Typography>
      
      <Typography variant="body1" paragraph>
        {intro}
      </Typography>
      
      {/* Timeline de préparation */}
      <SectionPaper elevation={1}>
        <Typography variant="h5" gutterBottom>
          Calendrier de préparation
        </Typography>
        
        <Grid container spacing={3}>
          {timelines.map((timeline, idx) => (
            <Grid item xs={12} md={6} lg={3} key={idx}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  height: '100%',
                  bgcolor: idx === timelines.length - 1 ? 'primary.light' : 'background.paper',
                  color: idx === timelines.length - 1 ? 'white' : 'inherit'
                }}
              >
                <Box display="flex" alignItems="center" mb={1}>
                  <CalendarToday sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {timeline.title}
                  </Typography>
                </Box>
                
                <List dense>
                  {timeline.points.map((point, pointIdx) => (
                    <ListItem key={pointIdx} sx={{ py: 0.5 }}>
                      <ListItemText primary={point} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </SectionPaper>
      
      {/* Charge glucidique */}
      <SectionPaper elevation={1}>
        <Typography variant="h5" gutterBottom>
          {carboLoading.title}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {carboLoading.description}
        </Typography>
        
        <List>
          {carboLoading.steps.map((step, idx) => (
            <ListItem key={idx}>
              <ListItemIcon>
                <RestaurantMenu color="primary" />
              </ListItemIcon>
              <ListItemText primary={step} />
            </ListItem>
          ))}
        </List>
        
        <Box bgcolor="warning.light" p={2} borderRadius={1} mt={2}>
          <Typography variant="body2">
            <Info fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
            {carboLoading.warning}
          </Typography>
        </Box>
      </SectionPaper>
      
      {/* Repas recommandés */}
      <SectionPaper elevation={1}>
        <Typography variant="h5" gutterBottom>
          Repas recommandés avant l'événement
        </Typography>
        
        <Grid container spacing={3}>
          {meals.map((meal, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Box display="flex" alignItems="center" mb={1}>
                  <DinnerDining color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {meal.title}
                  </Typography>
                </Box>
                
                <Typography variant="body1" paragraph>
                  {meal.description}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  Apports: {meal.macros}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </SectionPaper>
      
      {/* Hydratation */}
      <SectionPaper elevation={1}>
        <Box display="flex" alignItems="center" mb={2}>
          <Opacity color="primary" sx={{ mr: 1, fontSize: 30 }} />
          <Typography variant="h5">
            {hydration.title}
          </Typography>
        </Box>
        
        <List>
          {hydration.steps.map((step, idx) => (
            <ListItem key={idx}>
              <ListItemIcon>
                <Opacity color="info" />
              </ListItemIcon>
              <ListItemText primary={step} />
            </ListItem>
          ))}
        </List>
      </SectionPaper>
      
      {/* Suppléments */}
      <Typography variant="h5" gutterBottom>
        Suppléments potentiels
      </Typography>
      
      {supplements.map((supplement, idx) => (
        <Accordion key={idx} sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography>{supplement.name}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box mb={1}>
              <InfoChip 
                label={`Timing: ${supplement.timing}`} 
                size="small" 
                icon={<Notifications fontSize="small" />}
              />
            </Box>
            <Typography variant="body2" paragraph>
              <strong>Bénéfice:</strong> {supplement.benefit}
            </Typography>
            <Typography variant="body2" color="warning.main">
              <strong>Précaution:</strong> {supplement.caution}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default BeforeEventSection;
