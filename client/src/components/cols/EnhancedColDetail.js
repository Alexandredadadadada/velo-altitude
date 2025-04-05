import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Container, 
  Tabs, 
  Tab, 
  CircularProgress,
  Typography,
  Grid,
  Alert,
  AlertTitle
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MapIcon from '@mui/icons-material/Map';
import NoteIcon from '@mui/icons-material/Note';

// Hooks personnalisés
import useColDetail from './hooks/useColDetail';
import useColCharts from './hooks/useColCharts';

// Composants
import ColHeader from './components/ColHeader';
import ColInfo from './components/ColInfo';
import WeatherInfo from './components/WeatherInfo';
import ElevationCharts from './components/ElevationCharts';
import ColMap from './components/ColMap';
import UserNotes from './components/UserNotes';

/**
 * Composant principal pour afficher les détails d'un col
 * Affiche toutes les informations, graphiques et options disponibles pour un col spécifique
 */
const EnhancedColDetail = () => {
  const { colId } = useParams();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  
  // Récupérer les données et fonctions du hook useColDetail
  const {
    col,
    loading,
    error,
    selectedSide,
    elevationProfile,
    weatherData,
    isFavorite,
    compareMode,
    compareCol,
    similarCols,
    userNotes,
    showNotesForm,
    setUserNotes,
    setShowNotesForm,
    handleSideChange,
    toggleFavorite,
    toggleCompareMode,
    handleCompareColChange,
    saveUserNotes,
    shareCol
  } = useColDetail(colId);
  
  // Récupérer les données et options des graphiques
  const {
    chartOptions,
    gradientChartOptions,
    elevationChartData,
    gradientChartData
  } = useColCharts({
    elevationProfile,
    col,
    compareCol,
    compareMode,
    selectedSide
  });
  
  // Afficher un chargement
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '50vh' 
      }}>
        <CircularProgress />
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          {t('cols.loading_col_data')}
        </Typography>
      </Box>
    );
  }
  
  // Afficher une erreur
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          <AlertTitle>{t('common.error')}</AlertTitle>
          {error}
        </Alert>
      </Container>
    );
  }
  
  // Afficher un message si le col n'est pas trouvé
  if (!col) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">
          <AlertTitle>{t('cols.col_not_found')}</AlertTitle>
          {t('cols.col_not_found_message')}
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
      {/* En-tête du col avec actions */}
      <ColHeader 
        col={col}
        isFavorite={isFavorite}
        compareMode={compareMode}
        similarCols={similarCols}
        toggleFavorite={toggleFavorite}
        toggleCompareMode={toggleCompareMode}
        handleCompareColChange={handleCompareColChange}
        shareCol={shareCol}
      />
      
      {/* Onglets */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab 
            label={t('cols.overview')} 
            value="overview" 
            icon={<InfoIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={t('cols.elevation')} 
            value="elevation" 
            icon={<TimelineIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={t('cols.gradient')} 
            value="gradient" 
            icon={<TrendingUpIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={t('cols.map')} 
            value="map" 
            icon={<MapIcon />} 
            iconPosition="start"
          />
          <Tab 
            label={t('cols.notes')} 
            value="notes" 
            icon={<NoteIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>
      
      {/* Contenu des onglets */}
      <Box sx={{ mt: 3 }}>
        {/* Vue d'ensemble */}
        {activeTab === 'overview' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ColInfo col={col} />
            </Grid>
            <Grid item xs={12} md={6}>
              <WeatherInfo weatherData={weatherData} />
            </Grid>
          </Grid>
        )}
        
        {/* Graphique d'élévation */}
        {activeTab === 'elevation' && (
          <ElevationCharts 
            data={elevationChartData}
            options={chartOptions}
            type="elevation"
          />
        )}
        
        {/* Graphique de pente */}
        {activeTab === 'gradient' && (
          <ElevationCharts 
            data={gradientChartData}
            options={gradientChartOptions}
            type="gradient"
          />
        )}
        
        {/* Carte */}
        {activeTab === 'map' && (
          <ColMap 
            col={col}
            selectedSide={selectedSide}
            elevationProfile={elevationProfile}
          />
        )}
        
        {/* Notes utilisateur */}
        {activeTab === 'notes' && (
          <UserNotes 
            userNotes={userNotes}
            showNotesForm={showNotesForm}
            setUserNotes={setUserNotes}
            setShowNotesForm={setShowNotesForm}
            saveUserNotes={saveUserNotes}
          />
        )}
      </Box>
    </Container>
  );
};

export default EnhancedColDetail;