import React, { useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Typography,
  Divider,
  Paper,
  Grid,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Dashboard,
  Route as RouteIcon,
  CalendarMonth,
  EmojiEvents,
  DirectionsBike,
  Notifications,
  CompareArrows
} from '@mui/icons-material';
import TrainingDashboard from '../components/training/TrainingDashboard';
import TrainingStats from '../components/training/TrainingStats';
import TrainingGoals from '../components/training/TrainingGoals';
import PeriodComparison from '../components/training/PeriodComparison';
import RouteSharing from '../components/social/RouteSharing';
import { useAuth } from '../contexts/AuthContext';

/**
 * Page principale regroupant les fonctionnalités d'entraînement et de partage d'itinéraires
 */
const TrainingHub = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  
  // État pour la gestion des onglets
  const [activeTab, setActiveTab] = useState(0);
  
  // Gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  return (
    <Box sx={{ py: { xs: 2, md: 3 } }}>
      <Container maxWidth="xl">
        {/* En-tête de la page */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs>
              <Typography variant="h4" component="h1" gutterBottom={isMobile}>
                Espace Cycliste
              </Typography>
              {!isMobile && (
                <Typography variant="subtitle1" color="text.secondary">
                  Suivez vos performances, définissez des objectifs et découvrez de nouveaux itinéraires
                </Typography>
              )}
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                startIcon={<DirectionsBike />}
                sx={{ mr: 1 }}
              >
                Ajouter une activité
              </Button>
            </Grid>
          </Grid>
        </Box>
        
        {/* Navigation par onglets */}
        <Paper 
          sx={{ 
            borderRadius: '8px',
            overflow: 'hidden',
            mb: 3
          }}
          elevation={1}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isTablet ? "scrollable" : "fullWidth"}
            scrollButtons={isTablet ? "auto" : false}
            allowScrollButtonsMobile
            sx={{
              bgcolor: theme.palette.background.paper,
              '& .MuiTab-root': {
                minHeight: '64px',
                fontSize: '0.9rem'
              }
            }}
          >
            <Tab 
              icon={<Dashboard />} 
              label="Tableau de bord" 
              iconPosition="start"
            />
            <Tab 
              icon={<RouteIcon />} 
              label="Itinéraires" 
              iconPosition="start" 
            />
            <Tab 
              icon={<CalendarMonth />} 
              label="Statistiques" 
              iconPosition="start"
            />
            <Tab 
              icon={<CompareArrows />} 
              label="Comparaison" 
              iconPosition="start"
            />
            <Tab 
              icon={<EmojiEvents />} 
              label="Objectifs" 
              iconPosition="start"
            />
          </Tabs>
        </Paper>
        
        {/* Contenu principal */}
        <Box sx={{ mt: 3 }}>
          {/* Tableau de bord */}
          {activeTab === 0 && (
            <TrainingDashboard />
          )}
          
          {/* Itinéraires */}
          {activeTab === 1 && (
            <RouteSharing />
          )}
          
          {/* Statistiques */}
          {activeTab === 2 && (
            <TrainingStats />
          )}
          
          {/* Comparaison */}
          {activeTab === 3 && (
            <PeriodComparison userId={user?.id} />
          )}
          
          {/* Objectifs */}
          {activeTab === 4 && (
            <TrainingGoals />
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default TrainingHub;
