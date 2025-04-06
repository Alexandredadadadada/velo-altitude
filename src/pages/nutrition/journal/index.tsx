import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Button,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
  Breadcrumbs,
  Link as MuiLink,
} from '@mui/material';
import { 
  DatePicker,
  LocalizationProvider 
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { format, isValid } from 'date-fns';
import { APIOrchestrator } from '../../../api/orchestration';
import FoodEntryForm from '../../../components/nutrition/journal/FoodEntryForm';
import NutritionDailyLog from '../../../components/nutrition/journal/NutritionDailyLog';
import NutritionTrends from '../../../components/nutrition/journal/NutritionTrends';
import NutritionTrainingSync from '../../../components/nutrition/journal/NutritionTrainingSync';
import Link from 'next/link';
import { 
  MenuBook as MenuBookIcon,
  Restaurant as RestaurantIcon,
  ShowChart as ShowChartIcon,
  Sync as SyncIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Interface TabPanel pour les onglets
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Composant TabPanel 
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`journal-tabpanel-${index}`}
      aria-labelledby={`journal-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const NutritionJournal: React.FC = () => {
  const router = useRouter();
  
  // Déterminer l'onglet actif à partir de l'URL ou par défaut à 0
  const getInitialTabValue = () => {
    const { tab } = router.query;
    if (tab === 'trends') return 1;
    if (tab === 'sync') return 2;
    return 0;
  };
  
  // États
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [nutritionPlan, setNutritionPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(getInitialTabValue());
  
  // Mise à jour de l'onglet actif quand l'URL change
  useEffect(() => {
    setTabValue(getInitialTabValue());
  }, [router.query]);
  
  // Récupération du plan nutritionnel actif
  useEffect(() => {
    const fetchActivePlan = async () => {
      try {
        const api = new APIOrchestrator();
        const plan = await api.getActiveNutritionPlan();
        setNutritionPlan(plan);
      } catch (err) {
        console.error('Erreur lors de la récupération du plan actif:', err);
        // Ne pas afficher d'erreur, ce n'est pas critique
      }
    };
    
    fetchActivePlan();
  }, []);
  
  // Gestion du changement de date
  const handleDateChange = (date: Date | null) => {
    if (date && isValid(date)) {
      setSelectedDate(date);
    }
  };
  
  // Gestion du changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Mettre à jour l'URL sans recharger la page
    const tabParam = newValue === 1 ? 'trends' : newValue === 2 ? 'sync' : 'daily';
    router.push(`/nutrition/journal?tab=${tabParam}`, undefined, { shallow: true });
  };
  
  // Formatage de la date pour l'affichage
  const formattedDate = selectedDate ? format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr }) : '';
  const formattedDateForApi = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
  
  return (
    <>
      <Head>
        <title>Journal Nutritionnel | Velo-Altitude</title>
        <meta name="description" content="Suivez votre nutrition quotidienne, analysez vos tendances et synchronisez avec vos entraînements pour optimiser vos performances cyclistes." />
      </Head>
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          {/* Fil d'Ariane */}
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
            <Link href="/" passHref>
              <MuiLink
                underline="hover"
                sx={{ display: 'flex', alignItems: 'center' }}
                color="inherit"
              >
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Accueil
              </MuiLink>
            </Link>
            <Link href="/nutrition" passHref>
              <MuiLink
                underline="hover"
                sx={{ display: 'flex', alignItems: 'center' }}
                color="inherit"
              >
                <RestaurantIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Nutrition
              </MuiLink>
            </Link>
            <Typography
              sx={{ display: 'flex', alignItems: 'center' }}
              color="text.primary"
            >
              <MenuBookIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Journal Nutritionnel
            </Typography>
          </Breadcrumbs>
          
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Journal Nutritionnel
          </Typography>
          
          <Paper sx={{ borderRadius: 2, mb: 4 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              aria-label="journal tabs"
            >
              <Tab 
                icon={<RestaurantIcon />}
                label="Journal Quotidien" 
                id="journal-tab-0"
                aria-controls="journal-tabpanel-0"
              />
              <Tab 
                icon={<ShowChartIcon />}
                label="Tendances" 
                id="journal-tab-1"
                aria-controls="journal-tabpanel-1"
              />
              <Tab 
                icon={<SyncIcon />}
                label="Sync. Entraînement" 
                id="journal-tab-2"
                aria-controls="journal-tabpanel-2"
              />
            </Tabs>
            
            {/* Journal Quotidien */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'stretch', sm: 'center' },
                  mb: 4,
                  gap: 2
                }}>
                  <Box>
                    <Typography variant="h6" component="h2" gutterBottom>
                      Entrées du {formattedDate}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Suivez votre alimentation quotidienne et atteignez vos objectifs nutritionnels.
                    </Typography>
                  </Box>
                  
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                    <DatePicker
                      label="Sélectionner une date"
                      value={selectedDate}
                      onChange={handleDateChange}
                      disableFuture
                    />
                  </LocalizationProvider>
                </Box>
                
                <FoodEntryForm date={formattedDateForApi} />
                
                <Box sx={{ mt: 4 }}>
                  <NutritionDailyLog date={formattedDateForApi} />
                </Box>
              </Box>
            </TabPanel>
            
            {/* Tendances */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ p: { xs: 2, md: 3 } }}>
                <NutritionTrends />
              </Box>
            </TabPanel>
            
            {/* Synchronisation Entraînement */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ p: { xs: 2, md: 3 } }}>
                <NutritionTrainingSync nutritionPlan={nutritionPlan} />
              </Box>
            </TabPanel>
          </Paper>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
            <Button
              variant="outlined"
              component={Link}
              href="/nutrition/plans"
            >
              Mes plans nutritionnels
            </Button>
            <Button
              variant="outlined"
              component={Link}
              href="/nutrition/recettes"
            >
              Recettes pour cyclistes
            </Button>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default NutritionJournal;
