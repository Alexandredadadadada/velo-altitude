/**
 * RecoverySection - Section du guide sur la récupération nutritionnelle après un événement longue distance
 */
import React from 'react';
import { 
  Box, Typography, Paper, Grid, List, ListItem, 
  ListItemIcon, ListItemText, Divider, Chip, Card,
  CardContent, CardMedia, Button, Timeline, TimelineItem,
  TimelineSeparator, TimelineConnector, TimelineContent,
  TimelineDot
} from '@mui/material';
import { 
  RestaurantMenu, WaterDrop, SportsBar, Alarm, 
  Favorite, AccessTime, CheckCircle, FitnessCenter
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styles personnalisés
const SectionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const RecipeCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[6],
  },
}));

const RecipeMedia = styled(CardMedia)(({ theme }) => ({
  height: 160,
}));

const NutrientChip = styled(Chip)(({ theme, color }) => ({
  margin: theme.spacing(0.5),
  backgroundColor: color,
  color: '#fff',
}));

/**
 * Section sur la récupération nutritionnelle après un événement longue distance
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.content - Contenu de la section
 */
const RecoverySection = ({ content = {} }) => {
  // Données de secours en cas de contenu manquant
  const defaultContent = {
    title: "Récupération nutritionnelle après l'effort",
    intro: "La récupération nutritionnelle est aussi importante que l'effort lui-même. Une stratégie optimale vous permettra de vous remettre plus rapidement et d'enchaîner les entraînements ou événements sans compromettre votre santé ou vos performances.",
    timeline: [
      {
        time: "0-30 minutes",
        title: "Fenêtre métabolique",
        description: "Cette période juste après l'effort est cruciale pour la récupération glycogénique.",
        recommendations: [
          "20-30g de protéines facilement digestibles",
          "1g de glucides par kg de poids corporel",
          "500-750ml de liquide avec électrolytes"
        ],
        examples: [
          "Boisson de récupération protéinée",
          "Yaourt grec + banane + miel",
          "Smoothie aux fruits + protéine de lactosérum"
        ]
      },
      {
        time: "1-2 heures",
        title: "Repas complet de récupération",
        description: "Premier repas structuré après l'effort.",
        recommendations: [
          "0.3-0.4g de protéines par kg de poids corporel",
          "1-1.2g de glucides par kg de poids corporel",
          "Inclure des légumes antioxydants et anti-inflammatoires"
        ],
        examples: [
          "Blanc de poulet + patate douce + légumes colorés",
          "Saumon + riz + épinards",
          "Omelette + pain complet + avocat + tomates"
        ]
      },
      {
        time: "2-24 heures",
        title: "Restauration complète",
        description: "Période de reconstitution des réserves et réparation musculaire.",
        recommendations: [
          "Manger toutes les 3-4 heures",
          "Privilegier les aliments riches en antioxydants",
          "Maintenir une bonne hydratation (urine claire)"
        ],
        examples: [
          "3-4 repas équilibrés",
          "Collations riches en protéines et glucides complexes",
          "2-3L d'eau tout au long de la journée"
        ]
      },
      {
        time: "24-72 heures",
        title: "Récupération prolongée",
        description: "Phase de super-compensation et réparation tissulaire avancée.",
        recommendations: [
          "Maintenir un apport protéique élevé (1.6-2g/kg/jour)",
          "Consommer suffisamment de lipides essentiels (oméga-3)",
          "Privilégier les aliments anti-inflammatoires naturels"
        ],
        examples: [
          "Poissons gras, noix, huiles de qualité",
          "Fruits rouges, curcuma, gingembre",
          "Hydratation constante"
        ]
      }
    ],
    keyNutrients: [
      {
        name: "Protéines",
        benefits: "Réparation musculaire, synthèse d'enzymes, soutien immunitaire",
        sources: "Viandes maigres, poissons, produits laitiers, légumineuses, protéines en poudre",
        timing: "20-40g par prise, réparties toutes les 3-4h",
        color: "#4CAF50"
      },
      {
        name: "Glucides",
        benefits: "Reconstitution du glycogène, soutien au système immunitaire, réduction du catabolisme",
        sources: "Pâtes, riz, pain, pommes de terre, fruits, légumes féculents",
        timing: "1-1.2g/kg dans les 2 premières heures, puis selon besoins énergétiques",
        color: "#FF9800"
      },
      {
        name: "Électrolytes",
        benefits: "Rééquilibrage hydrique, prévention des crampes, soutien neurologique",
        sources: "Bananes, pommes de terre, sel, boissons isotoniques, eau de coco",
        timing: "Dès la fin de l'effort, puis continuellement avec l'hydratation",
        color: "#2196F3"
      },
      {
        name: "Antioxydants",
        benefits: "Réduction des dommages oxydatifs, soutien immunitaire, anti-inflammatoire",
        sources: "Fruits colorés, légumes, thé vert, curcuma, cacao",
        timing: "Tout au long de la période de récupération",
        color: "#9C27B0"
      }
    ],
    recipes: [
      {
        title: "Smoothie de récupération express",
        timing: "0-30min après l'effort",
        ingredients: [
          "1 banane", 
          "200ml de lait d'amande", 
          "25g de protéine de lactosérum", 
          "1 cuillère à café de miel", 
          "1 pincée de sel"
        ],
        macros: "Protéines: 25g, Glucides: 35g, Lipides: 5g",
        image: "/images/nutrition/smoothie-recuperation.jpg"
      },
      {
        title: "Bowl de récupération complète",
        timing: "1-2h après l'effort",
        ingredients: [
          "100g de poulet grillé", 
          "150g de patate douce rôtie", 
          "Quinoa", 
          "Épinards frais", 
          "Avocat", 
          "Graines de courge"
        ],
        macros: "Protéines: 35g, Glucides: 65g, Lipides: 15g",
        image: "/images/nutrition/bowl-recuperation.jpg"
      },
      {
        title: "Tisane anti-inflammatoire",
        timing: "Soir après l'effort",
        ingredients: [
          "Gingembre frais", 
          "Curcuma", 
          "Citron", 
          "Miel", 
          "Poivre noir (pour absorption du curcuma)"
        ],
        macros: "Propriétés anti-inflammatoires et antioxydantes",
        image: "/images/nutrition/tisane-recuperation.jpg"
      }
    ],
    hydrationStrategy: {
      title: "Stratégie d'hydratation pour la récupération",
      steps: [
        "Pesez-vous avant et après l'effort pour connaître les pertes hydriques",
        "Consommez 150% du poids perdu en fluides dans les 4-6 heures suivant l'effort",
        "Ajoutez des électrolytes (sodium, potassium) si l'effort a été intense ou par temps chaud",
        "Espacez la consommation de liquide plutôt que de tout boire d'un coup"
      ],
      indicators: [
        "Urine jaune pâle (pas totalement claire)",
        "Absence de soif persistante",
        "Récupération de 70-80% du poids perdu dans les 4-6h"
      ]
    },
    commonMistakes: [
      {
        mistake: "Ne pas manger après l'effort car absence d'appétit",
        consequence: "Récupération retardée, risque accru de blessures, immunité diminuée",
        solution: "Commencer par des liquides nutritifs, puis passer progressivement aux solides"
      },
      {
        mistake: "Consommer exclusivement des protéines sans glucides",
        consequence: "Reconstitution lente du glycogène, récupération compromise",
        solution: "Toujours associer protéines et glucides dans un ratio d'environ 1:3 ou 1:4"
      },
      {
        mistake: "Se désintéresser de l'hydratation une fois l'effort terminé",
        consequence: "Déshydratation chronique, récupération musculaire retardée, détérioration cognitive",
        solution: "Intégrer l'hydratation à votre routine de récupération avec des alarmes régulières"
      },
      {
        mistake: "Célébrer avec excès d'alcool après un grand événement",
        consequence: "Déshydratation sévère, inflammation, perturbation du sommeil, mauvaise récupération",
        solution: "Si vous souhaitez célébrer, limitez-vous à un verre et compensez avec beaucoup d'eau"
      }
    ]
  };
  
  // Utiliser le contenu fourni ou les données par défaut
  const {
    title = defaultContent.title,
    intro = defaultContent.intro,
    timeline = defaultContent.timeline,
    keyNutrients = defaultContent.keyNutrients,
    recipes = defaultContent.recipes,
    hydrationStrategy = defaultContent.hydrationStrategy,
    commonMistakes = defaultContent.commonMistakes
  } = content;

  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom>
        {title}
      </Typography>
      
      <Typography variant="body1" paragraph>
        {intro}
      </Typography>
      
      {/* Timeline de récupération */}
      <SectionPaper elevation={1}>
        <Typography variant="h5" gutterBottom>
          Chronologie de récupération optimale
        </Typography>
        
        <Timeline position="alternate">
          {timeline.map((phase, idx) => (
            <TimelineItem key={idx}>
              <TimelineSeparator>
                <TimelineDot color={idx === 0 ? "secondary" : "primary"} variant={idx === 0 ? "filled" : "outlined"}>
                  <AccessTime />
                </TimelineDot>
                {idx < timeline.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" color="primary" fontWeight="bold">
                    {phase.time}
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {phase.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {phase.description}
                  </Typography>
                  
                  <Divider sx={{ my: 1.5 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Recommandations:
                  </Typography>
                  <List dense>
                    {phase.recommendations.map((rec, recIdx) => (
                      <ListItem key={recIdx} sx={{ py: 0.5 }}>
                        <ListItemIcon>
                          <CheckCircle color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                    Exemples:
                  </Typography>
                  <Box>
                    {phase.examples.map((ex, exIdx) => (
                      <Chip 
                        key={exIdx} 
                        label={ex} 
                        variant="outlined" 
                        size="small" 
                        sx={{ mr: 0.5, mb: 0.5 }} 
                      />
                    ))}
                  </Box>
                </Paper>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </SectionPaper>
      
      {/* Nutriments clés */}
      <SectionPaper elevation={1}>
        <Typography variant="h5" gutterBottom>
          Nutriments clés pour la récupération
        </Typography>
        
        <Grid container spacing={3}>
          {keyNutrients.map((nutrient, idx) => (
            <Grid item xs={12} md={6} key={idx}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  height: '100%',
                  borderLeft: `4px solid ${nutrient.color}`
                }}
              >
                <Box display="flex" alignItems="center" mb={1}>
                  <NutrientChip 
                    label={nutrient.name} 
                    color={nutrient.color}
                  />
                </Box>
                
                <Typography variant="body2" paragraph>
                  <strong>Bénéfices:</strong> {nutrient.benefits}
                </Typography>
                
                <Typography variant="body2" paragraph>
                  <strong>Sources:</strong> {nutrient.sources}
                </Typography>
                
                <Typography variant="body2">
                  <strong>Timing:</strong> {nutrient.timing}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </SectionPaper>
      
      {/* Recettes de récupération */}
      <SectionPaper elevation={1}>
        <Typography variant="h5" gutterBottom>
          Recettes de récupération
        </Typography>
        
        <Grid container spacing={3}>
          {recipes.map((recipe, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <RecipeCard>
                <RecipeMedia
                  image={recipe.image}
                  title={recipe.title}
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {recipe.title}
                  </Typography>
                  
                  <Box display="flex" alignItems="center" mb={1}>
                    <Alarm fontSize="small" color="action" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      {recipe.timing}
                    </Typography>
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Ingrédients:
                  </Typography>
                  <List dense>
                    {recipe.ingredients.map((ingredient, ingIdx) => (
                      <ListItem key={ingIdx} sx={{ py: 0.25 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <RestaurantMenu fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={ingredient} />
                      </ListItem>
                    ))}
                  </List>
                  
                  <Box mt={1}>
                    <Typography variant="body2" color="text.secondary">
                      {recipe.macros}
                    </Typography>
                  </Box>
                </CardContent>
                <Box p={2} pt={0} mt="auto">
                  <Button 
                    variant="outlined" 
                    size="small" 
                    fullWidth
                    component="a" 
                    href={`/nutrition/recipes?search=${encodeURIComponent(recipe.title)}`}
                  >
                    Voir la recette complète
                  </Button>
                </Box>
              </RecipeCard>
            </Grid>
          ))}
        </Grid>
      </SectionPaper>
      
      {/* Stratégie d'hydratation */}
      <SectionPaper elevation={1}>
        <Box display="flex" alignItems="center" mb={2}>
          <WaterDrop color="primary" sx={{ mr: 1, fontSize: 30 }} />
          <Typography variant="h5">
            {hydrationStrategy.title}
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="subtitle1" gutterBottom>
              Étapes clés:
            </Typography>
            <List>
              {hydrationStrategy.steps.map((step, idx) => (
                <ListItem key={idx}>
                  <ListItemIcon>
                    <WaterDrop color="info" />
                  </ListItemIcon>
                  <ListItemText primary={step} />
                </ListItem>
              ))}
            </List>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom>
              Indicateurs de bonne hydratation:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.light' }}>
              <List dense>
                {hydrationStrategy.indicators.map((indicator, idx) => (
                  <ListItem key={idx}>
                    <ListItemIcon>
                      <CheckCircle sx={{ color: 'white' }} />
                    </ListItemIcon>
                    <ListItemText primary={indicator} sx={{ color: 'white' }} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </SectionPaper>
      
      {/* Erreurs courantes */}
      <Typography variant="h5" gutterBottom>
        Erreurs courantes à éviter
      </Typography>
      
      {commonMistakes.map((mistake, idx) => (
        <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" color="error" gutterBottom>
            {mistake.mistake}
          </Typography>
          
          <Box display="flex" alignItems="flex-start" mb={1}>
            <Typography variant="subtitle2" sx={{ minWidth: 120 }}>
              Conséquence:
            </Typography>
            <Typography variant="body2">
              {mistake.consequence}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="flex-start">
            <Typography variant="subtitle2" sx={{ minWidth: 120 }}>
              Solution:
            </Typography>
            <Typography variant="body2">
              {mistake.solution}
            </Typography>
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default RecoverySection;
