import React, { memo, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Container, 
  Grid, 
  Typography, 
  Box, 
  Alert, 
  Paper,
  Divider,
  Button,
  CircularProgress,
  useTheme
} from '@mui/material';
import { 
  FitnessCenterRounded as DumbbellIcon,
  CalendarMonthOutlined as CalendarIcon,
  DownloadOutlined as DownloadIcon,
  InfoOutlined as InfoIcon,
  LightbulbOutlined as TipIcon
} from '@mui/icons-material';

// Composants chargés avec lazy loading
const PlanForm = lazy(() => import('./components/PlanForm'));
const PlanDisplay = lazy(() => import('./components/PlanDisplay'));
import Breadcrumbs from '../common/Breadcrumbs';

// Hooks personnalisés
import useTrainingBuilder from './hooks/useTrainingBuilder';

/**
 * TrainingPlanBuilder - Composant principal pour créer et visualiser des plans d'entraînement personnalisés
 * 
 * Ce composant permet aux utilisateurs de générer des plans d'entraînement cyclistes personnalisés
 * selon différents objectifs, niveaux d'expérience et contraintes temporelles.
 * 
 * Optimisé avec React.memo pour éviter les re-renders inutiles
 */
const TrainingPlanBuilder = memo(() => {
  const { t } = useTranslation();
  const theme = useTheme();
  
  // Utilisation du hook personnalisé pour centraliser la logique
  const {
    // État du formulaire
    goal,
    experience,
    weeklyHours,
    planDuration,
    startDate,
    formSubmitted,
    validationErrors,
    customPlan,
    zones,
    hasPlan,
    
    // Gestionnaires d'événements
    handleFieldChange,
    handleGeneratePlan,
    handleExportPlan,
    handleAddToCalendar,
    resetForm
  } = useTrainingBuilder();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs pour la navigation */}
      <Box mb={3}>
        <Breadcrumbs />
      </Box>
      
      {/* En-tête de page */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <DumbbellIcon sx={{ fontSize: 32, mr: 2, color: theme.palette.primary.main }} />
        <Typography variant="h4" component="h1">
          {t('training.planBuilder')}
        </Typography>
      </Box>
      
      {/* Conteneur principal */}
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
        <Grid container spacing={3}>
          {/* Colonne gauche: Formulaire */}
          <Grid item xs={12} md={4}>
            <Suspense fallback={
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={40} />
              </Box>
            }>
              <PlanForm
                goal={goal}
                experience={experience}
                weeklyHours={weeklyHours}
                planDuration={planDuration}
                startDate={startDate}
                validationErrors={validationErrors}
                onFieldChange={handleFieldChange}
                onGeneratePlan={handleGeneratePlan}
              />
            </Suspense>
            
            {/* Section d'aide */}
            <Paper 
              elevation={2} 
              sx={{ 
                mt: 3, 
                p: 2, 
                bgcolor: 'primary.light', 
                color: 'primary.contrastText' 
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                <TipIcon sx={{ mr: 1, mt: 0.3 }} />
                <Typography variant="subtitle2" fontWeight="bold">
                  {t('training.tips.title')}
                </Typography>
              </Box>
              <Typography variant="body2">
                {t('training.tips.content')}
              </Typography>
            </Paper>
          </Grid>
          
          {/* Colonne droite: Affichage du plan */}
          <Grid item xs={12} md={8}>
            {!hasPlan && !formSubmitted && (
              <Paper elevation={3} sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', mb: 2, alignItems: 'flex-start' }}>
                  <InfoIcon sx={{ color: 'info.main', mr: 2, fontSize: 28 }} />
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {t('training.intro.title')}
                    </Typography>
                    <Typography paragraph>
                      {t('training.intro.description')}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ mt: 2, bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('training.intro.features')}
                  </Typography>
                  <ul style={{ paddingLeft: '1.5rem', marginTop: 0 }}>
                    <li>{t('training.intro.feature1')}</li>
                    <li>{t('training.intro.feature2')}</li>
                    <li>{t('training.intro.feature3')}</li>
                  </ul>
                </Box>
              </Paper>
            )}
            
            {formSubmitted && !hasPlan && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                <CircularProgress />
              </Box>
            )}
            
            {hasPlan && (
              <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="h2">
                    {t('training.yourPlan')}
                  </Typography>
                  <Box>
                    <Button
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={handleExportPlan}
                      sx={{ mr: 1 }}
                    >
                      {t('training.export')}
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      startIcon={<CalendarIcon />}
                      onClick={handleAddToCalendar}
                    >
                      {t('training.addToCalendar')}
                    </Button>
                  </Box>
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                <Suspense fallback={
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={40} />
                  </Box>
                }>
                  <PlanDisplay
                    plan={customPlan}
                    onExportPlan={handleExportPlan}
                    onAddToCalendar={handleAddToCalendar}
                  />
                </Suspense>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
});

export default TrainingPlanBuilder;