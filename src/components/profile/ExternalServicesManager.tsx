import React, { useState, useEffect } from 'react';
import { 
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Switch,
  Divider,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  Tooltip,
  useTheme
} from '@mui/material';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import SyncIcon from '@mui/icons-material/Sync';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { APIOrchestrator } from '../../api/orchestration/APIOrchestrator';

const apiOrchestrator = new APIOrchestrator();

interface ExternalServicesManagerProps {
  userId: string;
}

interface ExternalService {
  id: string;
  name: string;
  type: 'fitness' | 'activity' | 'health' | 'nutrition' | 'calendar' | 'other';
  description: string;
  connected: boolean;
  lastSync?: string;
  settings: {
    autoSync: boolean;
    importActivities: boolean;
    exportActivities: boolean;
    syncRoutes: boolean;
    syncChallenges: boolean;
    syncNutrition: boolean;
    syncTraining: boolean;
    syncCalendar: boolean;
  };
  authData?: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    scope?: string[];
  };
  syncInProgress?: boolean;
}

interface ServiceIntegrationSettings {
  serviceId: string;
  settings: Partial<ExternalService['settings']>;
}

const ExternalServicesManager: React.FC<ExternalServicesManagerProps> = ({ userId }) => {
  const theme = useTheme();
  const [services, setServices] = useState<ExternalService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openSettingsDialog, setOpenSettingsDialog] = useState<string | null>(null);
  const [confirmDisconnectDialog, setConfirmDisconnectDialog] = useState<string | null>(null);
  const [currentSettings, setCurrentSettings] = useState<ServiceIntegrationSettings | null>(null);

  useEffect(() => {
    // Charger les services externes connectés pour l'utilisateur
    const fetchExternalServices = async () => {
      try {
        setLoading(true);
        const servicesData = await apiOrchestrator.getUserExternalServices(userId);
        setServices(servicesData);
      } catch (error) {
        console.error('Erreur lors du chargement des services externes', error);
        setError('Erreur lors du chargement des services externes. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    fetchExternalServices();
  }, [userId]);

  // Vérifier si un OAuth redirect est en cours
  useEffect(() => {
    const handleOAuthRedirect = async () => {
      // Récupérer les paramètres de l'URL de redirection
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      
      // Si aucun code ou état n'est présent, ce n'est pas une redirection OAuth
      if (!code && !state) return;
      
      // Vérifier s'il y a une erreur
      if (error) {
        setError(`Erreur d'authentification: ${error}`);
        return;
      }
      
      try {
        // Échange du code contre un token
        if (code && state) {
          // Le state contient généralement le service concerné, ex: "strava", "garmin", etc.
          const service = state.split('_')[0];
          
          // Compléter le processus d'authentification
          const result = await apiOrchestrator.completeOAuthFlow(userId, service, code, state);
          
          if (result.success) {
            // Mettre à jour la liste des services avec le service nouvellement connecté
            setServices(prevServices => 
              prevServices.map(s => 
                s.id === service 
                  ? { ...s, connected: true, authData: result.authData }
                  : s
              )
            );
            
            setSuccess(`${getServiceName(service)} connecté avec succès !`);
            
            // Nettoyer l'URL pour supprimer les paramètres OAuth
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            throw new Error(result.error || 'Erreur lors de la connexion au service');
          }
        }
      } catch (error) {
        console.error('Erreur lors du traitement de la redirection OAuth', error);
        setError(`Erreur lors de la connexion du service: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    };
    
    handleOAuthRedirect();
  }, [userId]);

  // Obtenir le nom d'un service à partir de son ID
  const getServiceName = (serviceId: string): string => {
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : serviceId;
  };

  // Connecter un service externe
  const connectService = async (serviceId: string) => {
    try {
      // Initier le processus d'authentification OAuth
      const authUrl = await apiOrchestrator.initiateOAuthFlow(userId, serviceId);
      
      // Rediriger l'utilisateur vers la page d'authentification du service
      window.location.href = authUrl;
    } catch (error) {
      console.error(`Erreur lors de la connexion à ${getServiceName(serviceId)}`, error);
      setError(`Erreur lors de la connexion à ${getServiceName(serviceId)}. Veuillez réessayer.`);
    }
  };

  // Déconnecter un service externe
  const disconnectService = async (serviceId: string) => {
    try {
      await apiOrchestrator.disconnectExternalService(userId, serviceId);
      
      // Mettre à jour la liste des services
      setServices(prevServices => 
        prevServices.map(service => 
          service.id === serviceId 
            ? { ...service, connected: false, authData: undefined }
            : service
        )
      );
      
      setSuccess(`${getServiceName(serviceId)} déconnecté avec succès.`);
    } catch (error) {
      console.error(`Erreur lors de la déconnexion de ${getServiceName(serviceId)}`, error);
      setError(`Erreur lors de la déconnexion de ${getServiceName(serviceId)}. Veuillez réessayer.`);
    } finally {
      setConfirmDisconnectDialog(null);
    }
  };

  // Synchroniser les données avec un service externe
  const syncWithService = async (serviceId: string) => {
    try {
      // Marquer le service comme en cours de synchronisation
      setServices(prevServices => 
        prevServices.map(service => 
          service.id === serviceId 
            ? { ...service, syncInProgress: true }
            : service
        )
      );
      
      // Lancer la synchronisation
      const result = await apiOrchestrator.syncExternalService(userId, serviceId);
      
      if (result.success) {
        // Mettre à jour le service avec la date de dernière synchronisation
        setServices(prevServices => 
          prevServices.map(service => 
            service.id === serviceId 
              ? { ...service, lastSync: new Date().toISOString(), syncInProgress: false }
              : service
          )
        );
        
        setSuccess(`Synchronisation avec ${getServiceName(serviceId)} terminée.`);
      } else {
        throw new Error(result.error || 'Erreur lors de la synchronisation');
      }
    } catch (error) {
      console.error(`Erreur lors de la synchronisation avec ${getServiceName(serviceId)}`, error);
      setError(`Erreur lors de la synchronisation avec ${getServiceName(serviceId)}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      
      // Réinitialiser l'état de synchronisation
      setServices(prevServices => 
        prevServices.map(service => 
          service.id === serviceId 
            ? { ...service, syncInProgress: false }
            : service
        )
      );
    }
  };

  // Ouvrir la boîte de dialogue des paramètres d'un service
  const openServiceSettings = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setCurrentSettings({
        serviceId,
        settings: { ...service.settings }
      });
      setOpenSettingsDialog(serviceId);
    }
  };

  // Mettre à jour les paramètres d'un service
  const updateServiceSettings = async () => {
    if (!currentSettings) return;
    
    try {
      await apiOrchestrator.updateExternalServiceSettings(
        userId,
        currentSettings.serviceId,
        currentSettings.settings
      );
      
      // Mettre à jour la liste des services
      setServices(prevServices => 
        prevServices.map(service => 
          service.id === currentSettings.serviceId 
            ? { ...service, settings: { ...service.settings, ...currentSettings.settings } }
            : service
        )
      );
      
      setSuccess(`Paramètres de ${getServiceName(currentSettings.serviceId)} mis à jour.`);
      setOpenSettingsDialog(null);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour des paramètres de ${getServiceName(currentSettings.serviceId)}`, error);
      setError(`Erreur lors de la mise à jour des paramètres. Veuillez réessayer.`);
    }
  };

  // Obtenir l'icône pour un type de service
  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'fitness':
        return <FitnessCenterIcon />;
      case 'activity':
        return <DirectionsBikeIcon />;
      case 'health':
        return <MonitorHeartIcon />;
      case 'nutrition':
        return <RestaurantIcon />;
      case 'calendar':
        return <CalendarMonthIcon />;
      default:
        return <LinkIcon />;
    }
  };

  // Obtenir le style de couleur pour le chip de statut
  const getStatusChipColor = (connected: boolean) => {
    return connected ? 'success' : 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom>
        Services connectés
      </Typography>
      
      <Typography variant="body1" paragraph>
        Connectez des services externes pour synchroniser vos activités, vos plans d'entraînement 
        et vos statistiques. Une fois connectés, vous pourrez importer et exporter des données entre 
        ces plateformes et Vélo Altitude.
      </Typography>

      {/* Alertes et messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Services d'activités physiques */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Plateformes d'activités et fitness
            </Typography>
            
            <List>
              {services
                .filter(service => ['activity', 'fitness'].includes(service.type))
                .map((service) => (
                  <React.Fragment key={service.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getServiceIcon(service.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {service.name}
                            <Chip
                              size="small"
                              label={service.connected ? 'Connecté' : 'Non connecté'}
                              color={getStatusChipColor(service.connected)}
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary">
                              {service.description}
                            </Typography>
                            {service.connected && service.lastSync && (
                              <Typography variant="caption" display="block">
                                Dernière synchronisation: {new Date(service.lastSync).toLocaleString()}
                              </Typography>
                            )}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        {service.connected ? (
                          <Box sx={{ display: 'flex' }}>
                            <Tooltip title="Synchroniser maintenant">
                              <IconButton
                                onClick={() => syncWithService(service.id)}
                                disabled={!!service.syncInProgress}
                              >
                                {service.syncInProgress ? <CircularProgress size={24} /> : <SyncIcon />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Paramètres">
                              <IconButton
                                onClick={() => openServiceSettings(service.id)}
                              >
                                <SettingsIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Déconnecter">
                              <IconButton
                                onClick={() => setConfirmDisconnectDialog(service.id)}
                                color="error"
                              >
                                <LinkOffIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Button
                            variant="outlined"
                            startIcon={<LinkIcon />}
                            onClick={() => connectService(service.id)}
                          >
                            Connecter
                          </Button>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
            </List>
          </Paper>
        </Grid>
        
        {/* Services de santé et nutrition */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: a3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Santé et nutrition
            </Typography>
            
            <List>
              {services
                .filter(service => ['health', 'nutrition'].includes(service.type))
                .map((service) => (
                  <React.Fragment key={service.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getServiceIcon(service.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {service.name}
                            <Chip
                              size="small"
                              label={service.connected ? 'Connecté' : 'Non connecté'}
                              color={getStatusChipColor(service.connected)}
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                        secondary={service.description}
                      />
                      <ListItemSecondaryAction>
                        {service.connected ? (
                          <Box sx={{ display: 'flex' }}>
                            <Tooltip title="Synchroniser maintenant">
                              <IconButton
                                onClick={() => syncWithService(service.id)}
                                disabled={!!service.syncInProgress}
                              >
                                {service.syncInProgress ? <CircularProgress size={24} /> : <SyncIcon />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Paramètres">
                              <IconButton
                                onClick={() => openServiceSettings(service.id)}
                              >
                                <SettingsIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Déconnecter">
                              <IconButton
                                onClick={() => setConfirmDisconnectDialog(service.id)}
                                color="error"
                              >
                                <LinkOffIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Button
                            variant="outlined"
                            startIcon={<LinkIcon />}
                            onClick={() => connectService(service.id)}
                          >
                            Connecter
                          </Button>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
            </List>
          </Paper>
        </Grid>
        
        {/* Autres services */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Calendriers et autres services
            </Typography>
            
            <List>
              {services
                .filter(service => ['calendar', 'other'].includes(service.type))
                .map((service) => (
                  <React.Fragment key={service.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getServiceIcon(service.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {service.name}
                            <Chip
                              size="small"
                              label={service.connected ? 'Connecté' : 'Non connecté'}
                              color={getStatusChipColor(service.connected)}
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                        secondary={service.description}
                      />
                      <ListItemSecondaryAction>
                        {service.connected ? (
                          <Box sx={{ display: 'flex' }}>
                            <Tooltip title="Synchroniser maintenant">
                              <IconButton
                                onClick={() => syncWithService(service.id)}
                                disabled={!!service.syncInProgress}
                              >
                                {service.syncInProgress ? <CircularProgress size={24} /> : <SyncIcon />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Paramètres">
                              <IconButton
                                onClick={() => openServiceSettings(service.id)}
                              >
                                <SettingsIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Déconnecter">
                              <IconButton
                                onClick={() => setConfirmDisconnectDialog(service.id)}
                                color="error"
                              >
                                <LinkOffIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Button
                            variant="outlined"
                            startIcon={<LinkIcon />}
                            onClick={() => connectService(service.id)}
                          >
                            Connecter
                          </Button>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Section d'information sur les intégrations */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <InfoIcon color="info" sx={{ mr: 2, mt: 0.5 }} />
          <Box>
            <Typography variant="h6" gutterBottom>
              À propos des intégrations de services externes
            </Typography>
            <Typography variant="body2">
              Les intégrations permettent d'importer et d'exporter vos données d'activités, de nutrition et 
              d'entraînement entre Vélo Altitude et d'autres plateformes. Voici quelques points importants :
            </Typography>
            <ul>
              <li>
                <Typography variant="body2">
                  La connexion utilise des protocoles sécurisés (OAuth2) et nous ne stockons jamais vos 
                  mots de passe pour ces services.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Vous pouvez à tout moment déconnecter un service et révoquer l'accès.
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  Les données synchronisées respectent notre politique de confidentialité et les 
                  paramètres de votre compte.
                </Typography>
              </li>
            </ul>
            <Typography variant="body2">
              Pour plus d'informations sur la gestion des autorisations pour chaque service, visitez 
              directement leurs sites respectifs.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Dialogue des paramètres du service */}
      {currentSettings && (
        <Dialog
          open={!!openSettingsDialog}
          onClose={() => setOpenSettingsDialog(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Paramètres de synchronisation - {getServiceName(currentSettings.serviceId)}
          </DialogTitle>
          <DialogContent>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Synchronisation automatique" 
                  secondary="Synchroniser automatiquement lors des changements" 
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={!!currentSettings.settings.autoSync}
                    onChange={e => setCurrentSettings({
                      ...currentSettings,
                      settings: {
                        ...currentSettings.settings,
                        autoSync: e.target.checked
                      }
                    })}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemText 
                  primary="Importer les activités" 
                  secondary="Importer les activités depuis ce service" 
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={!!currentSettings.settings.importActivities}
                    onChange={e => setCurrentSettings({
                      ...currentSettings,
                      settings: {
                        ...currentSettings.settings,
                        importActivities: e.target.checked
                      }
                    })}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemText 
                  primary="Exporter les activités" 
                  secondary="Exporter les activités vers ce service" 
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={!!currentSettings.settings.exportActivities}
                    onChange={e => setCurrentSettings({
                      ...currentSettings,
                      settings: {
                        ...currentSettings.settings,
                        exportActivities: e.target.checked
                      }
                    })}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemText 
                  primary="Synchroniser les parcours" 
                  secondary="Parcours, routes et cols" 
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={!!currentSettings.settings.syncRoutes}
                    onChange={e => setCurrentSettings({
                      ...currentSettings,
                      settings: {
                        ...currentSettings.settings,
                        syncRoutes: e.target.checked
                      }
                    })}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemText 
                  primary="Synchroniser les défis" 
                  secondary="Défis et accomplissements" 
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={!!currentSettings.settings.syncChallenges}
                    onChange={e => setCurrentSettings({
                      ...currentSettings,
                      settings: {
                        ...currentSettings.settings,
                        syncChallenges: e.target.checked
                      }
                    })}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              {/* Conditionnellement, ajouter d'autres options selon le type de service */}
              {(['nutrition', 'health'].includes(services.find(s => s.id === currentSettings.serviceId)?.type || '')) && (
                <>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Synchroniser la nutrition" 
                      secondary="Plans et données nutritionnelles" 
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        edge="end"
                        checked={!!currentSettings.settings.syncNutrition}
                        onChange={e => setCurrentSettings({
                          ...currentSettings,
                          settings: {
                            ...currentSettings.settings,
                            syncNutrition: e.target.checked
                          }
                        })}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </>
              )}
              
              {(['calendar', 'activity', 'fitness'].includes(services.find(s => s.id === currentSettings.serviceId)?.type || '')) && (
                <>
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Synchroniser le calendrier" 
                      secondary="Planification et événements" 
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        edge="end"
                        checked={!!currentSettings.settings.syncCalendar}
                        onChange={e => setCurrentSettings({
                          ...currentSettings,
                          settings: {
                            ...currentSettings.settings,
                            syncCalendar: e.target.checked
                          }
                        })}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </>
              )}
            </List>
            
            {currentSettings.serviceId === 'strava' && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2" paragraph>
                  Pour gérer toutes les autorisations accordées à Vélo Altitude, visitez également les paramètres 
                  de votre compte Strava :
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  endIcon={<OpenInNewIcon />}
                  href="https://www.strava.com/settings/apps"
                  target="_blank"
                >
                  Paramètres d'autorisation Strava
                </Button>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenSettingsDialog(null)}>Annuler</Button>
            <Button onClick={updateServiceSettings} color="primary" variant="contained">
              Enregistrer
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Dialogue de confirmation de déconnexion */}
      <Dialog
        open={!!confirmDisconnectDialog}
        onClose={() => setConfirmDisconnectDialog(null)}
      >
        <DialogTitle>Confirmer la déconnexion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir déconnecter {confirmDisconnectDialog ? getServiceName(confirmDisconnectDialog) : 'ce service'} ?
            Cette action révoquera l'accès de Vélo Altitude à votre compte et arrêtera toute synchronisation.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDisconnectDialog(null)}>Annuler</Button>
          <Button 
            onClick={() => confirmDisconnectDialog && disconnectService(confirmDisconnectDialog)} 
            color="error"
          >
            Déconnecter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExternalServicesManager;
