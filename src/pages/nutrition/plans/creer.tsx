import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Breadcrumbs,
  Link, 
  Paper,
  Alert,
  useTheme
} from '@mui/material';
import Head from 'next/head';
import { useRouter } from 'next/router';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NextLink from 'next/link';
import PlanForm from '../../../components/nutrition/plans/PlanForm';

const CreerPlanNutritionnel: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const { template } = router.query;
  const [initialTemplate, setInitialTemplate] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (template && typeof template === 'string') {
      setInitialTemplate(template);
    }
  }, [template]);

  return (
    <>
      <Head>
        <title>Créer un Plan Nutritionnel | Nutrition | Velo-Altitude</title>
        <meta name="description" content="Créez votre plan nutritionnel personnalisé adapté à vos objectifs cyclistes et vos préférences alimentaires." />
      </Head>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Fil d'Ariane */}
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />} 
          aria-label="breadcrumb"
          sx={{ mb: 4 }}
        >
          <Link component={NextLink} href="/" underline="hover" color="inherit">
            Accueil
          </Link>
          <Link component={NextLink} href="/nutrition" underline="hover" color="inherit">
            Nutrition
          </Link>
          <Link component={NextLink} href="/nutrition/plans" underline="hover" color="inherit">
            Plans Nutritionnels
          </Link>
          <Typography color="text.primary">Créer un Plan</Typography>
        </Breadcrumbs>

        {/* Information sur l'intégration avec l'entraînement */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 3, 
            mb: 4, 
            bgcolor: theme.palette.info.light, 
            color: theme.palette.info.contrastText,
            borderRadius: 2
          }}
        >
          <Typography variant="subtitle1" gutterBottom fontWeight="medium">
            Optimisez votre alimentation pour l'ascension de cols
          </Typography>
          <Typography variant="body2">
            Ce plan nutritionnel sera parfaitement intégré avec vos données d'entraînement,
            vous permettant d'adapter votre alimentation selon vos objectifs d'ascension de cols
            et vos besoins spécifiques. Suivez les étapes ci-dessous pour créer un plan sur mesure.
          </Typography>
        </Paper>

        {/* Formulaire de création de plan nutritionnel */}
        <PlanForm initialTemplate={initialTemplate} />
      </Container>
    </>
  );
};

export default CreerPlanNutritionnel;
