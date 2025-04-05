/**
 * CommonProblems - Section du guide sur les problèmes courants liés à la nutrition lors d'efforts longue distance
 */
import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, Accordion, AccordionSummary, 
  AccordionDetails, List, ListItem, ListItemIcon, ListItemText, 
  Divider, Card, CardContent, Alert, Tab, Tabs, Button
} from '@mui/material';
import { 
  ExpandMore, WarningAmber, LocalHospital, 
  CheckCircle, ErrorOutline, InfoOutlined, ArrowForward
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styles personnalisés
const SectionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const ProblemAccordion = styled(Accordion)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  '&:before': {
    display: 'none',
  },
}));

const SolutionItem = styled(ListItem)(({ theme }) => ({
  backgroundColor: theme.palette.success.light,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(1),
}));

const PreventionItem = styled(ListItem)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(1),
  color: theme.palette.primary.contrastText,
}));

const SeverityBox = styled(Box)(({ theme, severity }) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: severity === 'high' 
    ? theme.palette.error.light 
    : severity === 'medium'
      ? theme.palette.warning.light
      : theme.palette.info.light,
  color: theme.palette.getContrastText(
    severity === 'high' 
      ? theme.palette.error.light 
      : severity === 'medium'
        ? theme.palette.warning.light
        : theme.palette.info.light
  ),
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.5, 1),
  marginRight: theme.spacing(1),
}));

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`problem-tabpanel-${index}`}
    aria-labelledby={`problem-tab-${index}`}
    {...other}
  >
    {value === index && (
      <Box sx={{ py: 2 }}>
        {children}
      </Box>
    )}
  </div>
);

/**
 * Section sur les problèmes courants liés à la nutrition lors d'efforts longue distance
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.content - Contenu de la section
 */
const CommonProblems = ({ content = {} }) => {
  const [activeTab, setActiveTab] = useState(0);
  
  // Données de secours en cas de contenu manquant
  const defaultContent = {
    title: "Problèmes nutritionnels courants et solutions",
    intro: "Les événements longue distance s'accompagnent souvent de défis nutritionnels spécifiques qui peuvent compromettre votre performance ou même vous forcer à abandonner. Découvrez comment prévenir et résoudre ces problèmes.",
    categories: ["Digestifs", "Énergétiques", "Hydratation", "Crampes"],
    problems: [
      {
        category: "Digestifs",
        items: [
          {
            name: "Douleurs gastriques",
            description: "Douleurs, ballonnements ou sensation de plénitude dans l'estomac pendant l'effort.",
            causes: [
              "Consommation excessive de nourriture avant ou pendant l'effort",
              "Aliments trop riches en fibres, graisses ou protéines",
              "Intensité trop élevée après l'alimentation",
              "Déshydratation"
            ],
            solutions: [
              "Réduire temporairement l'intensité",
              "Passer à l'hydratation pure pendant 15-30 minutes",
              "Privilégier les glucides liquides plutôt que solides",
              "Respirer profondément et se concentrer sur la respiration abdominale"
            ],
            prevention: [
              "Tester vos produits nutritionnels à l'entraînement",
              "Éviter les nouveaux aliments le jour de l'événement",
              "Consommer des portions plus petites mais plus fréquentes",
              "Limiter les fibres 24h avant l'événement"
            ],
            severity: "medium"
          },
          {
            name: "Diarrhée du coureur",
            description: "Besoin urgent d'aller aux toilettes pendant l'effort, souvent accompagné de crampes intestinales.",
            causes: [
              "Anxiété et stress pré-événement",
              "Apport excessif en fructose ou autres sucres mal tolérés",
              "Déshydratation sévère",
              "Caféine ou autres stimulants en excès"
            ],
            solutions: [
              "S'arrêter aux toilettes dès que possible",
              "Se réhydrater avec une solution électrolytique",
              "Éviter les aliments solides pendant 1-2h",
              "Reprendre progressivement avec des glucides simples"
            ],
            prevention: [
              "Réduire la caféine avant l'événement",
              "S'échauffer à faible intensité",
              "Éviter les édulcorants artificiels et les boissons trop concentrées",
              "Tester un protocole nutritionnel de 'faible FODMAP' avant les événements importants"
            ],
            severity: "high"
          },
          {
            name: "Nausées",
            description: "Sensation de malaise et envie de vomir pendant l'effort.",
            causes: [
              "Déshydratation",
              "Hypoglycémie",
              "Chaleur excessive",
              "Intensité trop élevée"
            ],
            solutions: [
              "Réduire immédiatement l'intensité",
              "Siroter de petites quantités d'eau ou de boisson isotonique",
              "Rechercher l'ombre et la fraîcheur si possible",
              "Consommer une petite quantité de glucides rapides"
            ],
            prevention: [
              "Acclimater progressivement à la chaleur avant l'événement",
              "Surveiller son état d'hydratation",
              "Éviter les aliments très sucrés ou gras avant l'effort",
              "S'alimenter régulièrement pendant l'effort"
            ],
            severity: "medium"
          }
        ]
      },
      {
        category: "Énergétiques",
        items: [
          {
            name: "Fringale (Bonk)",
            description: "Chute brutale d'énergie et sensation de faiblesse intense, souvent accompagnée de confusion mentale.",
            causes: [
              "Épuisement des réserves de glycogène",
              "Apport insuffisant en glucides pendant l'effort",
              "Intensité trop élevée par rapport à l'apport énergétique",
              "Mauvaise planification nutritionnelle"
            ],
            solutions: [
              "Arrêter ou réduire drastiquement l'intensité",
              "Consommer 40-60g de glucides rapides (gel, boisson concentrée)",
              "Continuer à s'hydrater",
              "Reprendre progressivement après 15-20 minutes"
            ],
            prevention: [
              "Consommer 60-90g de glucides par heure d'effort",
              "Commencer à s'alimenter dès les 15 premières minutes",
              "Programmer des alarmes régulières pour s'alimenter",
              "Adapter l'intensité à son apport nutritionnel"
            ],
            severity: "high"
          },
          {
            name: "Fatigue musculaire précoce",
            description: "Sensation de jambes lourdes et de fatigue excessive avant la fin prévue de l'effort.",
            causes: [
              "Hydratation insuffisante",
              "Déséquilibre électrolytique (sodium, potassium)",
              "Manque de glucides ou mauvais timing d'ingestion",
              "Surentraînement préalable"
            ],
            solutions: [
              "Réduire l'intensité temporairement",
              "Consommer une boisson avec électrolytes",
              "Ajouter des glucides solides pour un apport plus soutenu",
              "Faire de courtes pauses si nécessaire"
            ],
            prevention: [
              "Suivre un protocole d'affûtage adapté avant l'événement",
              "Consommer des électrolytes régulièrement pendant l'effort",
              "Varier les sources de glucides (liquides, gels, solides)",
              "Adapter l'intensité aux conditions (chaleur, vent, dénivelé)"
            ],
            severity: "medium"
          },
          {
            name: "Hypoglycémie réactive",
            description: "Baisse de la glycémie peu après une consommation importante de glucides, provoquant fatigue et faiblesse.",
            causes: [
              "Consommation excessive de sucres simples d'un coup",
              "Insulino-sensibilité élevée",
              "Effort à jeun suivi d'une alimentation trop riche en glucides",
              "Mauvais timing de la nutrition"
            ],
            solutions: [
              "Consommer des glucides à index glycémique modéré avec un peu de protéines",
              "Réduire temporairement l'intensité",
              "Éviter les sucres concentrés pendant 30-45 minutes",
              "Boire de l'eau pour diluer les sucres déjà consommés"
            ],
            prevention: [
              "Privilégier les mélanges de glucides (glucose, fructose, maltodextrine)",
              "Fractionner les apports en petites doses régulières",
              "Éviter les aliments à très haut index glycémique pendant l'effort",
              "Commencer l'effort avec une glycémie stable"
            ],
            severity: "medium"
          }
        ]
      },
      {
        category: "Hydratation",
        items: [
          {
            name: "Déshydratation",
            description: "Perte excessive de liquides corporels, affectant la performance et pouvant entraîner des problèmes de santé.",
            causes: [
              "Apport hydrique insuffisant",
              "Température élevée et transpiration excessive",
              "Effort intense et prolongé",
              "Stratégie d'hydratation inadaptée"
            ],
            solutions: [
              "Boire immédiatement 500-750ml sur 30 minutes",
              "Ajouter des électrolytes à l'eau",
              "Réduire l'intensité jusqu'à l'amélioration des symptômes",
              "Rechercher l'ombre et la fraîcheur"
            ],
            prevention: [
              "Commencer bien hydraté (urine jaune pâle)",
              "Boire 500-800ml par heure selon la température",
              "Utiliser un système d'hydratation facilement accessible",
              "Augmenter l'apport hydrique en cas de chaleur ou d'humidité élevée"
            ],
            severity: "high"
          },
          {
            name: "Hyponatrémie",
            description: "Dilution excessive du sodium sanguin due à une surhydratation, pouvant être dangereuse.",
            causes: [
              "Consommation excessive d'eau sans électrolytes",
              "Transpiration intense avec perte importante de sodium",
              "Durée d'effort très longue (>4-5h)",
              "Prédisposition individuelle"
            ],
            solutions: [
              "URGENT: Consulter un médecin si symptômes sévères (confusion, vomissements)",
              "Arrêter de boire de l'eau pure",
              "Consommer une solution très concentrée en sodium",
              "Éviter les médicaments anti-inflammatoires"
            ],
            prevention: [
              "Ne jamais boire plus de 800ml/heure sauf en cas de chaleur extrême",
              "Toujours ajouter des électrolytes à l'eau lors d'efforts >2h",
              "Varier les sources d'hydratation (eau, boissons électrolytiques)",
              "Surveiller la couleur des urines (éviter qu'elles soient trop claires)"
            ],
            severity: "high"
          },
          {
            name: "Soif excessive",
            description: "Sensation de soif persistante malgré une hydratation régulière.",
            causes: [
              "Déshydratation préalable à l'effort",
              "Alimentation trop riche en sodium avant l'événement",
              "Respiration par la bouche excessive",
              "Médicaments ou suppléments diurétiques"
            ],
            solutions: [
              "Boire progressivement par petites gorgées",
              "Rincer la bouche fréquemment même sans avaler",
              "Sucer des pastilles sans sucre pour stimuler la salivation",
              "Utiliser des bâtons de miel ou des gommes à mâcher sans sucre"
            ],
            prevention: [
              "S'hydrater correctement 24-48h avant l'événement",
              "Éviter l'alcool et la caféine excessive la veille",
              "Limiter les aliments très salés les jours précédents",
              "Respirer par le nez quand c'est possible pendant l'effort"
            ],
            severity: "low"
          }
        ]
      },
      {
        category: "Crampes",
        items: [
          {
            name: "Crampes musculaires",
            description: "Contractions musculaires involontaires et douloureuses, souvent dans les jambes.",
            causes: [
              "Déséquilibre électrolytique (sodium, potassium, magnésium)",
              "Déshydratation",
              "Fatigue musculaire et effort prolongé",
              "Intensité inappropriée"
            ],
            solutions: [
              "S'arrêter et étirer doucement le muscle affecté",
              "Masser la zone avec une pression modérée",
              "Consommer une solution riche en électrolytes",
              "Reprendre à intensité réduite"
            ],
            prevention: [
              "Consommer régulièrement des électrolytes pendant l'effort",
              "Prévoir une supplémentation en magnésium avant les événements longs",
              "S'entraîner spécifiquement pour l'effort prévu",
              "Adapter l'intensité à son niveau de préparation"
            ],
            severity: "medium"
          },
          {
            name: "Crampes abdominales",
            description: "Douleurs spasmodiques dans la région abdominale pendant l'effort.",
            causes: [
              "Consommation d'aliments difficiles à digérer",
              "Alimentation trop proche du début de l'effort",
              "Boissons trop concentrées en glucides",
              "Respiration inadaptée"
            ],
            solutions: [
              "Adopter une respiration profonde et régulière",
              "Réduire l'intensité pendant 10-15 minutes",
              "Éviter de manger jusqu'à amélioration",
              "Boire de l'eau par petites gorgées"
            ],
            prevention: [
              "Respecter un délai de 2-3h entre un repas complet et l'effort",
              "Privilégier les aliments facilement digestibles",
              "Diluer correctement les boissons énergétiques",
              "Travailler sa technique respiratoire à l'entraînement"
            ],
            severity: "medium"
          },
          {
            name: "Point de côté",
            description: "Douleur aiguë et localisée sous les côtes, souvent du côté droit.",
            causes: [
              "Diaphragme en spasme dû à la respiration",
              "Effort intense sans échauffement adéquat",
              "Repas trop proche de l'effort",
              "Manque d'entraînement spécifique"
            ],
            solutions: [
              "Ralentir et appuyer légèrement sur la zone douloureuse",
              "Expirer profondément lorsque le pied opposé à la douleur touche le sol",
              "Étirer légèrement le côté affecté en levant le bras",
              "Reprendre progressivement une fois la douleur diminuée"
            ],
            prevention: [
              "S'échauffer progressivement avant l'effort intense",
              "Travailler spécifiquement la respiration à l'entraînement",
              "Renforcer les muscles du tronc (core)",
              "Éviter les repas lourds 3h avant l'effort"
            ],
            severity: "low"
          }
        ]
      }
    ],
    emergencyInfo: {
      title: "Quand consulter un médecin",
      situations: [
        "Vomissements persistants empêchant toute hydratation",
        "Confusion mentale ou désorientation",
        "Crampes très douloureuses ne cédant pas au repos",
        "Urine très foncée ou absence d'urine pendant plus de 4 heures",
        "Fièvre ou frissons pendant ou après l'effort",
        "Étourdissements sévères ou évanouissement"
      ]
    }
  };
  
  // Utiliser le contenu fourni ou les données par défaut
  const {
    title = defaultContent.title,
    intro = defaultContent.intro,
    categories = defaultContent.categories,
    problems = defaultContent.problems,
    emergencyInfo = defaultContent.emergencyInfo
  } = content;
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Obtenir les problèmes pour la catégorie active
  const getActiveProblems = () => {
    const activeCategory = categories[activeTab];
    const categoryProblems = problems.find(cat => cat.category === activeCategory);
    return categoryProblems ? categoryProblems.items : [];
  };

  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom>
        {title}
      </Typography>
      
      <Typography variant="body1" paragraph>
        {intro}
      </Typography>
      
      {/* Alerte d'urgence médicale */}
      <Alert 
        severity="error" 
        variant="filled"
        icon={<LocalHospital />}
        sx={{ mb: 3 }}
      >
        En cas de symptômes graves, arrêtez-vous et consultez un médecin. Votre santé est prioritaire.
      </Alert>
      
      {/* Navigation par onglets */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {categories.map((category, idx) => (
            <Tab label={category} key={idx} />
          ))}
        </Tabs>
      </Box>
      
      {/* Problèmes par catégorie */}
      <TabPanel value={activeTab} index={activeTab}>
        {getActiveProblems().map((problem, idx) => (
          <ProblemAccordion key={idx}>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              aria-controls={`problem-content-${idx}`}
              id={`problem-header-${idx}`}
            >
              <Box display="flex" alignItems="center">
                <SeverityBox severity={problem.severity}>
                  <WarningAmber fontSize="small" sx={{ mr: 0.5 }} />
                  {problem.severity === 'high' ? 'Élevé' : problem.severity === 'medium' ? 'Moyen' : 'Faible'}
                </SeverityBox>
                <Typography variant="subtitle1">
                  {problem.name}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                {problem.description}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Causes possibles:
              </Typography>
              <List dense>
                {problem.causes.map((cause, causeIdx) => (
                  <ListItem key={causeIdx}>
                    <ListItemIcon>
                      <ErrorOutline color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={cause} />
                  </ListItem>
                ))}
              </List>
              
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Solutions immédiates:
              </Typography>
              <List>
                {problem.solutions.map((solution, solIdx) => (
                  <SolutionItem key={solIdx}>
                    <ListItemIcon>
                      <CheckCircle sx={{ color: 'white' }} />
                    </ListItemIcon>
                    <ListItemText primary={solution} sx={{ color: 'white' }} />
                  </SolutionItem>
                ))}
              </List>
              
              <Typography variant="subtitle2" gutterBottom>
                Prévention:
              </Typography>
              <List>
                {problem.prevention.map((prevention, prevIdx) => (
                  <PreventionItem key={prevIdx}>
                    <ListItemIcon>
                      <InfoOutlined sx={{ color: 'white' }} />
                    </ListItemIcon>
                    <ListItemText primary={prevention} sx={{ color: 'white' }} />
                  </PreventionItem>
                ))}
              </List>
            </AccordionDetails>
          </ProblemAccordion>
        ))}
      </TabPanel>
      
      {/* Informations d'urgence */}
      <SectionPaper elevation={1} sx={{ bgcolor: 'error.light', color: 'white' }}>
        <Typography variant="h5" gutterBottom>
          {emergencyInfo.title}
        </Typography>
        
        <List>
          {emergencyInfo.situations.map((situation, idx) => (
            <ListItem key={idx}>
              <ListItemIcon>
                <LocalHospital sx={{ color: 'white' }} />
              </ListItemIcon>
              <ListItemText primary={situation} />
            </ListItem>
          ))}
        </List>
        
        <Button 
          variant="contained" 
          color="secondary"
          endIcon={<ArrowForward />}
          sx={{ mt: 2 }}
          href="/nutrition/emergency-guide"
        >
          Guide complet des urgences médicales
        </Button>
      </SectionPaper>
    </Box>
  );
};

export default CommonProblems;
