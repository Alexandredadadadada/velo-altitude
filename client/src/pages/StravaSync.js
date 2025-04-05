import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  Paper, 
  Button, 
  Divider,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  Sync as SyncIcon,
  Settings as SettingsIcon,
  DirectionsBike as BikeIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { Helmet } from 'react-helmet';
import StravaSyncStatus from '../components/strava/StravaSyncStatus';
import StravaSyncHistory from '../components/strava/StravaSyncHistory';

// Panneau d'onglet
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`strava-sync-tabpanel-${index}`}
      aria-labelledby={`strava-sync-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          {children}
        </Box>
      )}
    </div>
  );
}

const StravaSync = () => {
  const [tabValue, setTabValue] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  // Afficher l'historique lorsque demandé depuis le composant de statut
  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  return (
    <Container maxWidth="lg">
      <Helmet>
        <title>Synchronisation Strava | Grand Est Cyclisme</title>
      </Helmet>

      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          <BikeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Synchronisation Strava
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" paragraph>
          Gérez la synchronisation de vos activités Strava avec notre plateforme pour suivre vos performances.
        </Typography>
      </Box>

      <Paper elevation={1} sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleChangeTab}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<SyncIcon />} label="Synchronisation" id="strava-sync-tab-0" />
          <Tab icon={<SettingsIcon />} label="Paramètres" id="strava-sync-tab-1" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <StravaSyncStatus onHistoryClick={toggleHistory} />
        
        {showHistory && (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Historique des synchronisations
              </Typography>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={toggleHistory}
              >
                Masquer l'historique
              </Button>
            </Box>
            <StravaSyncHistory />
          </>
        )}
        
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Options de synchronisation avancées
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Synchronisation complète
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Récupère toutes vos activités Strava, quel que soit leur âge. Cette opération peut prendre un certain temps.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    color="primary"
                    onClick={() => {
                      // Cette fonction sera liée au composant StravaSyncStatus
                      enqueueSnackbar('Veuillez utiliser le bouton de synchronisation complète dans le panneau de statut', { variant: 'info' });
                    }}
                  >
                    Synchroniser tout
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Derniers 6 mois
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Récupère uniquement les activités des 6 derniers mois. Option recommandée pour une mise à jour régulière.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    color="primary"
                    onClick={() => {
                      // Cette fonction sera liée au composant StravaSyncStatus
                      enqueueSnackbar('Veuillez utiliser le bouton de synchronisation dans le panneau de statut', { variant: 'info' });
                    }}
                  >
                    Synchroniser 6 mois
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Derniers 30 jours
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Récupère uniquement les activités des 30 derniers jours. Option la plus rapide pour des mises à jour fréquentes.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    color="primary"
                    onClick={() => {
                      // Cette fonction sera liée au composant StravaSyncStatus
                      enqueueSnackbar('Veuillez utiliser le bouton de synchronisation dans le panneau de statut', { variant: 'info' });
                    }}
                  >
                    Synchroniser 30 jours
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Paramètres de synchronisation
          </Typography>
          
          <Box mb={3}>
            <FormControlLabel
              control={
                <Switch 
                  color="primary" 
                  checked={true}
                  onChange={() => {
                    enqueueSnackbar('Fonctionnalité en cours de développement', { variant: 'info' });
                  }}
                />
              }
              label="Synchronisation automatique quotidienne"
            />
            <Typography variant="body2" color="textSecondary">
              Synchronise automatiquement vos activités Strava chaque jour
            </Typography>
          </Box>
          
          <Box mb={3}>
            <FormControlLabel
              control={
                <Switch 
                  color="primary" 
                  checked={true}
                  onChange={() => {
                    enqueueSnackbar('Fonctionnalité en cours de développement', { variant: 'info' });
                  }}
                />
              }
              label="Synchroniser les nouvelles activités en temps réel"
            />
            <Typography variant="body2" color="textSecondary">
              Synchronise automatiquement les nouvelles activités dès qu'elles sont créées dans Strava
            </Typography>
          </Box>
          
          <Box mb={3}>
            <FormControlLabel
              control={
                <Switch 
                  color="primary" 
                  checked={false}
                  onChange={() => {
                    enqueueSnackbar('Fonctionnalité en cours de développement', { variant: 'info' });
                  }}
                />
              }
              label="Synchroniser les activités privées"
            />
            <Typography variant="body2" color="textSecondary">
              Inclut vos activités privées Strava dans la synchronisation
            </Typography>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" gutterBottom>
            Notifications
          </Typography>
          
          <Box mb={3}>
            <FormControlLabel
              control={
                <Switch 
                  color="primary" 
                  checked={true}
                  onChange={() => {
                    enqueueSnackbar('Fonctionnalité en cours de développement', { variant: 'info' });
                  }}
                />
              }
              label="Notifications par email"
            />
            <Typography variant="body2" color="textSecondary">
              Recevez un email lorsqu'une synchronisation est terminée ou a échoué
            </Typography>
          </Box>
          
          <Box mb={3}>
            <FormControlLabel
              control={
                <Switch 
                  color="primary" 
                  checked={true}
                  onChange={() => {
                    enqueueSnackbar('Fonctionnalité en cours de développement', { variant: 'info' });
                  }}
                />
              }
              label="Notifications dans l'application"
            />
            <Typography variant="body2" color="textSecondary">
              Recevez des notifications dans l'application concernant les synchronisations
            </Typography>
          </Box>
        </Paper>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          Les paramètres de synchronisation sont en cours de développement. Certaines fonctionnalités peuvent ne pas être encore disponibles.
        </Alert>
      </TabPanel>
    </Container>
  );
};

export default StravaSync;
