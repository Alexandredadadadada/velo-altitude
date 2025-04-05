import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  CardMedia,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ExpandMore,
  Star,
  ThumbUp,
  Flag,
  FilterList,
  Sort,
  Favorite,
  TrendingUp,
  Whatshot,
  LocalOffer,
  CheckCircle,
  Help,
  Info,
  DirectionsBike
} from '@mui/icons-material';

/**
 * Guide d'utilisation pour le système de revues et de recommandations
 * 
 * @param {Object} props - Propriétés du composant
 * @param {boolean} props.showReviews - Afficher la section sur les revues
 * @param {boolean} props.showRecommendations - Afficher la section sur les recommandations
 */
const UserGuide = ({ 
  showReviews = true, 
  showRecommendations = true 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // État pour le stepper
  const [activeStep, setActiveStep] = useState(0);
  
  // Gérer le changement d'étape
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  const handleReset = () => {
    setActiveStep(0);
  };
  
  // Étapes du guide pour les revues
  const reviewSteps = [
    {
      label: 'Consulter les avis',
      description: `Les avis des autres utilisateurs sont affichés sur la page de détail d'un itinéraire. 
        Vous pouvez voir la note globale, les commentaires et les évaluations détaillées pour chaque aspect de l'itinéraire.`,
      image: '/images/guide/reviews-list.jpg'
    },
    {
      label: 'Ajouter un avis',
      description: `Pour ajouter votre propre avis, cliquez sur le bouton "Ajouter un avis" sur la page de détail d'un itinéraire. 
        Vous pourrez attribuer une note globale et des notes détaillées pour différents aspects comme la difficulté, le paysage, etc.`,
      image: '/images/guide/add-review.jpg'
    },
    {
      label: 'Interagir avec les avis',
      description: `Vous pouvez interagir avec les avis des autres utilisateurs en cliquant sur "J'aime" pour soutenir un avis pertinent. 
        Si vous trouvez un avis inapproprié, vous pouvez le signaler en cliquant sur "Signaler".`,
      image: '/images/guide/review-interactions.jpg'
    },
    {
      label: 'Filtrer et trier les avis',
      description: `Utilisez les options de tri et de filtrage pour trouver rapidement les avis qui vous intéressent. 
        Vous pouvez trier par date, note ou popularité, et filtrer par note ou présence de commentaires.`,
      image: '/images/guide/review-filters.jpg'
    }
  ];
  
  // Étapes du guide pour les recommandations
  const recommendationSteps = [
    {
      label: 'Découvrir des itinéraires recommandés',
      description: `Sur la page d'accueil et dans la section "Découvrir", vous trouverez des itinéraires recommandés 
        spécialement pour vous en fonction de vos préférences et de votre historique.`,
      image: '/images/guide/recommendations.jpg'
    },
    {
      label: 'Explorer différentes catégories',
      description: `Naviguez entre les différentes catégories de recommandations : "Pour vous" (personnalisées), 
        "Tendances" (populaires actuellement), "Saisonniers" (adaptés à la saison) et "Favoris" (vos itinéraires préférés).`,
      image: '/images/guide/recommendation-tabs.jpg'
    },
    {
      label: 'Filtrer les recommandations',
      description: `Affinez les recommandations selon vos besoins en utilisant les filtres disponibles. 
        Vous pouvez filtrer par distance, dénivelé, difficulté et type de surface.`,
      image: '/images/guide/recommendation-filters.jpg'
    },
    {
      label: 'Ajouter aux favoris',
      description: `Ajoutez un itinéraire à vos favoris en cliquant sur l'icône en forme de cœur. 
        Vous retrouverez tous vos itinéraires favoris dans l'onglet "Favoris" des recommandations.`,
      image: '/images/guide/add-favorite.jpg'
    }
  ];
  
  // FAQ pour les revues
  const reviewFaq = [
    {
      question: 'Qui peut laisser un avis ?',
      answer: 'Tous les utilisateurs connectés peuvent laisser un avis sur un itinéraire. Vous devez être connecté à votre compte pour pouvoir publier un avis.'
    },
    {
      question: 'Puis-je modifier ou supprimer mon avis ?',
      answer: 'Oui, vous pouvez modifier ou supprimer votre avis à tout moment. Accédez simplement à l\'itinéraire concerné et recherchez votre avis pour le modifier ou le supprimer.'
    },
    {
      question: 'Comment fonctionne le système de modération des avis ?',
      answer: 'Les avis sont soumis à une modération automatique et manuelle. Si un avis est signalé par plusieurs utilisateurs ou contient des termes inappropriés, il sera examiné par notre équipe de modération.'
    },
    {
      question: 'Pourquoi certains avis sont-ils mis en avant ?',
      answer: 'Les avis les plus utiles, déterminés par le nombre de "J\'aime" reçus et d\'autres facteurs de pertinence, peuvent être mis en avant pour aider les autres utilisateurs.'
    }
  ];
  
  // FAQ pour les recommandations
  const recommendationFaq = [
    {
      question: 'Comment sont générées les recommandations personnalisées ?',
      answer: 'Les recommandations personnalisées sont basées sur vos préférences, votre historique de navigation, vos avis et vos itinéraires favoris. Plus vous interagissez avec la plateforme, plus les recommandations seront pertinentes.'
    },
    {
      question: 'Que signifie "Tendance" pour un itinéraire ?',
      answer: 'Un itinéraire tendance est un parcours qui gagne en popularité récemment, avec un nombre croissant de visites, d\'avis positifs ou d\'ajouts aux favoris.'
    },
    {
      question: 'Comment sont sélectionnés les itinéraires saisonniers ?',
      answer: 'Les itinéraires saisonniers sont choisis en fonction de la saison actuelle et des conditions météorologiques typiques. Par exemple, en été, vous verrez plus d\'itinéraires ombragés ou près de points d\'eau.'
    },
    {
      question: 'Puis-je désactiver les recommandations ?',
      answer: 'Vous ne pouvez pas désactiver complètement les recommandations, mais vous pouvez choisir de ne pas les afficher en priorité en modifiant vos préférences dans les paramètres de votre compte.'
    }
  ];
  
  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 2 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Guide d'utilisation
        </Typography>
        
        <Typography variant="body1" paragraph>
          Bienvenue dans le guide d'utilisation des nouvelles fonctionnalités de Grand Est Cyclisme. 
          Ce guide vous aidera à comprendre comment utiliser le système de revues et de recommandations 
          pour profiter pleinement de votre expérience sur notre plateforme.
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardMedia
              component="img"
              height={200}
              image="/images/guide/header.jpg"
              alt="Cycliste sur une route de campagne"
            />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Améliorez votre expérience cycliste
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Découvrez comment les avis et les recommandations peuvent vous aider à trouver 
                les meilleurs itinéraires adaptés à vos préférences et à partager votre expérience 
                avec la communauté.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Paper>
      
      {showReviews && (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Star sx={{ mr: 1, color: theme.palette.warning.main }} />
            Système d'avis
          </Typography>
          
          <Typography variant="body1" paragraph>
            Le système d'avis vous permet de partager votre expérience sur les itinéraires 
            et de consulter les avis des autres cyclistes pour faire des choix éclairés.
          </Typography>
          
          <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 3 }}>
            {reviewSteps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>
                  <Typography variant="subtitle1">{step.label}</Typography>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2">{step.description}</Typography>
                  {step.image && (
                    <Box sx={{ mt: 2, mb: 2, textAlign: 'center' }}>
                      <img 
                        src={step.image} 
                        alt={step.label} 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: 200, 
                          borderRadius: 8,
                          border: `1px solid ${theme.palette.divider}`
                        }} 
                      />
                    </Box>
                  )}
                  <Box sx={{ mb: 2 }}>
                    <div>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        {index === reviewSteps.length - 1 ? 'Terminer' : 'Continuer'}
                      </Button>
                      <Button
                        disabled={index === 0}
                        onClick={handleBack}
                        sx={{ mt: 1, mr: 1 }}
                      >
                        Retour
                      </Button>
                    </div>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
          
          {activeStep === reviewSteps.length && (
            <Paper square elevation={0} sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
              <Typography variant="body1" paragraph>
                Vous avez terminé le guide sur le système d'avis !
              </Typography>
              <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
                Revoir le guide
              </Button>
            </Paper>
          )}
          
          <Divider sx={{ my: 4 }} />
          
          <Typography variant="h6" gutterBottom>
            Questions fréquentes sur les avis
          </Typography>
          
          {reviewFaq.map((item, index) => (
            <Accordion key={index} sx={{ mb: 1 }}>
              <AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls={`review-faq-content-${index}`}
                id={`review-faq-header-${index}`}
              >
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Help sx={{ mr: 1, fontSize: 20, color: theme.palette.primary.main }} />
                  {item.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  {item.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
          
          <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Info sx={{ mr: 1, mt: 0.3, color: theme.palette.primary.dark }} />
              Astuce : Pour obtenir des recommandations plus pertinentes, n'hésitez pas à laisser des avis détaillés sur les itinéraires que vous avez parcourus.
            </Typography>
          </Box>
        </Paper>
      )}
      
      {showRecommendations && (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Whatshot sx={{ mr: 1, color: theme.palette.secondary.main }} />
            Système de recommandations
          </Typography>
          
          <Typography variant="body1" paragraph>
            Le système de recommandations vous propose des itinéraires adaptés à vos préférences 
            et à vos habitudes de cyclisme, vous permettant de découvrir de nouveaux parcours qui vous plairont.
          </Typography>
          
          <Box sx={{ mt: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Types de recommandations
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <DirectionsBike color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Pour vous" 
                  secondary="Recommandations personnalisées basées sur vos préférences et votre historique" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <TrendingUp color="secondary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Tendances" 
                  secondary="Itinéraires populaires auprès de la communauté en ce moment" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LocalOffer color="info" />
                </ListItemIcon>
                <ListItemText 
                  primary="Saisonniers" 
                  secondary="Itinéraires particulièrement adaptés à la saison actuelle" 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Favorite color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary="Favoris" 
                  secondary="Vos itinéraires préférés, facilement accessibles" 
                />
              </ListItem>
            </List>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            Comment utiliser les recommandations
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, mt: 2 }}>
            {recommendationSteps.map((step, index) => (
              <Card key={index} sx={{ flex: 1, minWidth: isMobile ? '100%' : 200 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircle sx={{ mr: 1, fontSize: 18, color: theme.palette.success.main }} />
                    {step.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
          
          <Divider sx={{ my: 4 }} />
          
          <Typography variant="h6" gutterBottom>
            Questions fréquentes sur les recommandations
          </Typography>
          
          {recommendationFaq.map((item, index) => (
            <Accordion key={index} sx={{ mb: 1 }}>
              <AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls={`recommendation-faq-content-${index}`}
                id={`recommendation-faq-header-${index}`}
              >
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Help sx={{ mr: 1, fontSize: 20, color: theme.palette.secondary.main }} />
                  {item.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  {item.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
          
          <Box sx={{ mt: 3, p: 2, bgcolor: 'secondary.light', borderRadius: 2 }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Info sx={{ mr: 1, mt: 0.3, color: theme.palette.secondary.dark }} />
              Astuce : Plus vous interagissez avec la plateforme (avis, favoris, recherches), plus nos recommandations seront précises et adaptées à vos préférences.
            </Typography>
          </Box>
        </Paper>
      )}
      
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Besoin d'aide supplémentaire ?
        </Typography>
        
        <Typography variant="body2" paragraph>
          Si vous avez d'autres questions ou si vous rencontrez des problèmes avec ces fonctionnalités, 
          n'hésitez pas à consulter notre centre d'aide complet ou à contacter notre équipe de support.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
          <Button variant="outlined" startIcon={<Help />}>
            Centre d'aide
          </Button>
          <Button variant="contained" color="primary">
            Contacter le support
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default UserGuide;
