import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Tabs, 
  Tab, 
  Paper, 
  Divider,
  Button,
  Alert,
  Snackbar
} from '@mui/material';
import AthleteProfile from '../components/athlete/AthleteProfile';
import RouteDetails from '../components/routes/RouteDetails';
import TrainingRecommendations from '../components/training/TrainingRecommendations';
import NutritionRecommendations from '../components/nutrition/NutritionRecommendations';
import EquipmentRecommendations from '../components/equipment/EquipmentRecommendations';
import { APIOrchestrator } from '../api/orchestration';

const APIDashboard: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [showNutrition, setShowNutrition] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);
  const [notification, setNotification] = useState<{open: boolean, message: string, severity: 'success' | 'error' | 'info'}>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };
  
  const handleSelectActivity = (activityId: string) => {
    setSelectedActivityId(activityId);
    // Dans un cas réel, nous convertirions l'activité en itinéraire
    // Ici, nous simulons que l'activité devient un itinéraire
    setSelectedRouteId(activityId);
    setCurrentTab(1); // Passer à l'onglet des détails d'itinéraire
    
    setNotification({
      open: true,
      message: `Activité sélectionnée avec succès (ID: ${activityId.slice(0, 8)}...)`,
      severity: 'success'
    });
  };
  
  const handleGetNutritionRecommendations = (routeId: string) => {
    setShowNutrition(true);
    setCurrentTab(3); // Passer à l'onglet des recommandations nutritionnelles
    
    setNotification({
      open: true,
      message: 'Génération des recommandations nutritionnelles en cours...',
      severity: 'info'
    });
  };
  
  const handleGetEquipmentRecommendations = (routeId: string) => {
    setShowEquipment(true);
    setCurrentTab(4); // Passer à l'onglet des recommandations d'équipement
    
    setNotification({
      open: true,
      message: 'Génération des recommandations d\'équipement en cours...',
      severity: 'info'
    });
  };
  
  const handleClearCache = () => {
    // Créer une instance d'APIOrchestrator et vider le cache
    const orchestrator = new APIOrchestrator();
    orchestrator.clearCache('all');
    
    setNotification({
      open: true,
      message: 'Cache API vidé avec succès',
      severity: 'success'
    });
  };
  
  const handleCloseNotification = () => {
    setNotification({...notification, open: false});
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h3" gutterBottom>
          Velo-Altitude Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Tableau de bord d'intégration API pour le cyclisme de montagne
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Cette interface démontre l'intégration de la couche d'orchestration API avec les composants React pour Velo-Altitude.
          Naviguez entre les onglets pour explorer les différentes fonctionnalités.
        </Alert>
        
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleClearCache}
            size="small"
          >
            Vider le cache API
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3 }}
        >
          <Tab label="Profil Athlète" />
          <Tab label="Détails Itinéraire" disabled={!selectedRouteId} />
          <Tab label="Entraînement" />
          <Tab label="Nutrition" disabled={!showNutrition} />
          <Tab label="Équipement" disabled={!showEquipment} />
        </Tabs>
        
        <Box sx={{ mt: 2 }}>
          {currentTab === 0 && (
            <AthleteProfile onSelectActivity={handleSelectActivity} />
          )}
          
          {currentTab === 1 && selectedRouteId && (
            <RouteDetails 
              routeId={selectedRouteId}
              onGetNutritionRecommendations={handleGetNutritionRecommendations}
              onGetEquipmentRecommendations={handleGetEquipmentRecommendations}
            />
          )}
          
          {currentTab === 2 && (
            <TrainingRecommendations />
          )}
          
          {currentTab === 3 && showNutrition && selectedRouteId && (
            <NutritionRecommendations routeId={selectedRouteId} />
          )}
          
          {currentTab === 4 && showEquipment && selectedRouteId && (
            <EquipmentRecommendations routeId={selectedRouteId} />
          )}
        </Box>
      </Paper>
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default APIDashboard;
