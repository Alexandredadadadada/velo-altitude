import React from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper,
  Breadcrumbs,
  Link,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  NavigateNext as NavigateNextIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import NutritionCalculator from '../../components/nutrition/NutritionCalculator';
import SEOHelmet from '../../components/common/SEOHelmet';

// Styles personnalisés
const PageContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4, 0, 8),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2, 0, 6),
  }
}));

const PageHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(5),
  position: 'relative',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  position: 'relative',
  marginBottom: theme.spacing(1),
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -8,
    left: 0,
    width: 60,
    height: 4,
    backgroundColor: theme.palette.primary.main,
    borderRadius: 2,
  }
}));

/**
 * Page du Calculateur de Macros Nutritionnels
 * Un outil avancé pour calculer les besoins nutritionnels précis des cyclistes
 */
const MacroCalculator = () => {
  return (
    <>
      <SEOHelmet 
        title="Calculateur de Macros pour Cyclistes | Velo-Altitude"
        description="Calculez précisément vos besoins en calories, protéines, glucides et lipides selon votre profil de cycliste, vos objectifs et votre programme d'entraînement."
        keywords="calculateur nutritionnel, macronutriments, nutrition cycliste, besoins caloriques vélo, alimentation cyclisme"
      />
      
      <PageContainer>
        <PageHeader>
          <Breadcrumbs 
            separator={<NavigateNextIcon fontSize="small" />} 
            aria-label="breadcrumb"
            sx={{ mb: 2 }}
          >
            <Link component={RouterLink} to="/" color="inherit">
              Accueil
            </Link>
            <Link component={RouterLink} to="/nutrition/dashboard" color="inherit">
              Nutrition
            </Link>
            <Typography color="text.primary">Calculateur de Macros</Typography>
          </Breadcrumbs>
          
          <SectionTitle variant="h3" component="h1">
            Calculateur de Macros Nutritionnels
          </SectionTitle>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            Déterminez précisément vos besoins en calories et macronutriments adaptés à votre profil de cycliste
          </Typography>
        </PageHeader>
        
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, sm: 3, md: 4 }, 
            mb: 4, 
            borderRadius: 3,
            backgroundColor: '#f9f9f9'
          }}
        >
          <Grid container spacing={3} alignItems="center" sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <Typography variant="h5" component="h2" gutterBottom>
                Pourquoi utiliser notre calculateur ?
              </Typography>
              <Typography paragraph>
                Notre calculateur avancé prend en compte de nombreux facteurs spécifiques au cyclisme pour déterminer vos besoins nutritionnels précis :
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" paragraph>
                  <strong>Métabolisme de base</strong> calculé selon votre morphologie et votre âge
                </Typography>
                <Typography component="li" paragraph>
                  <strong>Types d'entraînements</strong> que vous pratiquez (endurance, seuil, VO2max...)
                </Typography>
                <Typography component="li" paragraph>
                  <strong>Intensité et durée</strong> de vos séances cyclistes
                </Typography>
                <Typography component="li" paragraph>
                  <strong>Objectifs personnels</strong> (performance, perte de poids, récupération...)
                </Typography>
                <Typography component="li" paragraph>
                  <strong>Préparation d'événements</strong> avec des recommandations spécifiques
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box 
                component="img"
                src="/assets/images/nutrition/nutrition-calculator-icon.svg"
                alt="Calculateur de Nutrition"
                sx={{ 
                  width: '100%', 
                  maxWidth: 200,
                  opacity: 0.85
                }}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ 
            borderRadius: 2, 
            p: 3, 
            backgroundColor: 'background.paper',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
          }}>
            <Typography variant="h6" component="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalculateIcon color="primary" /> Calculateur Nutritionnel
            </Typography>
            <Typography paragraph sx={{ mb: 4 }} color="text.secondary">
              Complétez le formulaire ci-dessous pour obtenir des recommandations nutritionnelles personnalisées.
            </Typography>
            
            <NutritionCalculator />
          </Box>
        </Paper>
        
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, sm: 3, md: 4 }, 
            borderRadius: 3
          }}
        >
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
            Comment utiliser ces résultats ?
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                p: 3, 
                borderRadius: 2, 
                backgroundColor: '#f3f8ff',
                height: '100%'
              }}>
                <Typography variant="h6" component="h3" gutterBottom>
                  Avant l'entraînement
                </Typography>
                <Typography paragraph>
                  Priorisez les glucides 2-4 heures avant l'effort pour maximiser vos réserves de glycogène. Pour les sorties matinales, une collation riche en glucides simples 15-30 minutes avant le départ peut être bénéfique.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                p: 3, 
                borderRadius: 2, 
                backgroundColor: '#fff5f5',
                height: '100%'
              }}>
                <Typography variant="h6" component="h3" gutterBottom>
                  Pendant l'effort
                </Typography>
                <Typography paragraph>
                  Pour les sorties supérieures à 90 minutes, visez 30-60g de glucides par heure. Pensez à l'hydratation avec électrolytes, particulièrement important en montagne et par temps chaud.
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                p: 3, 
                borderRadius: 2, 
                backgroundColor: '#f3fff5',
                height: '100%'
              }}>
                <Typography variant="h6" component="h3" gutterBottom>
                  Après l'effort
                </Typography>
                <Typography paragraph>
                  La fenêtre de récupération (30-60 minutes après l'effort) est cruciale : combinez protéines et glucides dans un rapport de 1:3 ou 1:4 pour optimiser la récupération musculaire et la reconstitution du glycogène.
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Nos recommandations sont basées sur les recherches scientifiques récentes en nutrition sportive et adaptées spécifiquement au cyclisme de montagne.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Pour des conseils plus personnalisés, nous vous recommandons de consulter un nutritionniste spécialisé en sport.
            </Typography>
          </Box>
        </Paper>
      </PageContainer>
    </>
  );
};

export default MacroCalculator;
