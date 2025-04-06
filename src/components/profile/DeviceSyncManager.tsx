import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  Button,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Chip,
  useTheme
} from '@mui/material';
import QRCode from 'qrcode.react';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import SyncIcon from '@mui/icons-material/Sync';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import TabletIcon from '@mui/icons-material/Tablet';
import LaptopIcon from '@mui/icons-material/Laptop';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import WatchIcon from '@mui/icons-material/Watch';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import { io, Socket } from 'socket.io-client';
import { APIOrchestrator } from '../../api/orchestration/APIOrchestrator';

const apiOrchestrator = new APIOrchestrator();

interface DeviceSyncManagerProps {
  userId: string;
}

interface Device {
  id: string;
  name: string;
  type: 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'watch' | 'other';
  lastSync: string;
  isCurrentDevice: boolean;
  status: 'online' | 'offline';
  systemInfo: {
    os: string;
    browser?: string;
    appVersion?: string;
  };
}

interface SyncSettings {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // en minutes
  syncOnWifiOnly: boolean;
  syncActivities: boolean;
  syncChallenges: boolean;
  syncPreferences: boolean;
  syncNutrition: boolean;
  syncTraining: boolean;
}

const DeviceSyncManager: React.FC<DeviceSyncManagerProps> = ({ userId }) => {
  const theme = useTheme();
  const [devices, setDevices] = useState<Device[]>([]);
  const [settings, setSettings] = useState<SyncSettings>({
    enabled: true,
    autoSync: true,
    syncInterval: 15,
    syncOnWifiOnly: false,
    syncActivities: true,
    syncChallenges: true,
    syncPreferences: true,
    syncNutrition: true,
    syncTraining: true,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [addDeviceDialogOpen, setAddDeviceDialogOpen] = useState<boolean>(false);
  const [newDeviceName, setNewDeviceName] = useState<string>('');
  const [pairingCode, setPairingCode] = useState<string>('');
  const [confirmDeleteDevice, setConfirmDeleteDevice] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Charger les appareils et les paramètres de synchronisation
    const loadData = async () => {
      try {
        setLoading(true);
        const [devicesData, settingsData, syncData] = await Promise.all([
          apiOrchestrator.getUserDevices(userId),
          apiOrchestrator.getUserSyncSettings(userId),
          apiOrchestrator.getLastSyncInfo(userId)
        ]);
        
        setDevices(devicesData);
        if (settingsData) setSettings(settingsData);
        if (syncData?.lastSyncDate) setLastSyncDate(syncData.lastSyncDate);
      } catch (error) {
        console.error('Erreur lors du chargement des données de synchronisation', error);
        setError('Erreur lors du chargement des données de synchronisation. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Initialiser la connexion WebSocket
    initializeSocket();

    return () => {
      // Nettoyer la connexion WebSocket et les timeouts lors du démontage
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [userId]);

  // Initialiser la connexion WebSocket pour la synchronisation en temps réel
  const initializeSocket = () => {
    const socket = io(process.env.REACT_APP_API_URL || '', {
      query: {
        userId,
        deviceId: localStorage.getItem('deviceId') || 'unknown',
      },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Connected to real-time sync server');
      // Mettre à jour le statut de l'appareil actuel comme connecté
      updateCurrentDeviceStatus('online');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from real-time sync server');
      // Mettre à jour le statut de l'appareil actuel comme déconnecté
      updateCurrentDeviceStatus('offline');
    });

    socket.on('device_status_change', (data: { deviceId: string; status: 'online' | 'offline' }) => {
      // Mettre à jour le statut d'un appareil dans la liste
      setDevices(prevDevices => 
        prevDevices.map(device => 
          device.id === data.deviceId 
            ? { ...device, status: data.status } 
            : device
        )
      );
    });

    socket.on('sync_complete', (data: { syncId: string; timestamp: string }) => {
      setSyncing(false);
      setLastSyncDate(data.timestamp);
      setSuccess('Synchronisation terminée avec succès');
      
      // Rafraîchir la liste des appareils après une synchronisation
      refreshDeviceList();
    });

    socket.on('sync_error', (data: { message: string }) => {
      setSyncing(false);
      setError(`Erreur de synchronisation: ${data.message}`);
    });

    socket.on('new_device_paired', (data: { device: Device }) => {
      // Ajouter le nouvel appareil à la liste
      setDevices(prevDevices => [...prevDevices, data.device]);
      setSuccess(`Nouvel appareil jumelé: ${data.device.name}`);
    });

    socketRef.current = socket;

    // Si la synchronisation automatique est activée, configurer le timer
    if (settings.enabled && settings.autoSync) {
      setupAutoSync(settings.syncInterval);
    }
  };

  // Configurer la synchronisation automatique
  const setupAutoSync = (interval: number) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      syncData();
      // Réinitialiser le timer pour la prochaine synchronisation
      setupAutoSync(interval);
    }, interval * 60 * 1000); // Convertir les minutes en millisecondes
  };

  // Mettre à jour le statut de l'appareil actuel
  const updateCurrentDeviceStatus = (status: 'online' | 'offline') => {
    setDevices(prevDevices => 
      prevDevices.map(device => 
        device.isCurrentDevice 
          ? { ...device, status } 
          : device
      )
    );
  };

  // Rafraîchir la liste des appareils
  const refreshDeviceList = async () => {
    try {
      const devicesData = await apiOrchestrator.getUserDevices(userId);
      setDevices(devicesData);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement de la liste des appareils', error);
    }
  };

  // Synchroniser les données manuellement
  const syncData = async () => {
    if (syncing) return;
    
    setSyncing(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Vérifier si la synchronisation sur WiFi uniquement est activée
      if (settings.syncOnWifiOnly && !navigator.onLine) {
        throw new Error('La synchronisation sur WiFi uniquement est activée, mais vous n\'êtes pas connecté');
      }
      
      // Créer un objet avec les catégories à synchroniser
      const syncCategories = {
        activities: settings.syncActivities,
        challenges: settings.syncChallenges,
        preferences: settings.syncPreferences,
        nutrition: settings.syncNutrition,
        training: settings.syncTraining,
      };
      
      // Lancer la synchronisation via l'API
      await apiOrchestrator.syncUserData(userId, syncCategories);
      
      // Si le socket n'est pas connecté, mettre à jour directement l'UI
      // Sinon, l'événement 'sync_complete' sera déclenché
      if (!socketRef.current || !socketRef.current.connected) {
        setSyncing(false);
        setLastSyncDate(new Date().toISOString());
        setSuccess('Synchronisation terminée avec succès');
        refreshDeviceList();
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation', error);
      setSyncing(false);
      setError(`Erreur lors de la synchronisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  // Mettre à jour les paramètres de synchronisation
  const updateSyncSettings = async (newSettings: Partial<SyncSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      // Enregistrer les paramètres via l'API
      await apiOrchestrator.updateUserSyncSettings(userId, updatedSettings);
      
      // Si la synchronisation automatique est activée/désactivée, mettre à jour le timer
      if ('autoSync' in newSettings || 'syncInterval' in newSettings || 'enabled' in newSettings) {
        if (updatedSettings.enabled && updatedSettings.autoSync) {
          setupAutoSync(updatedSettings.syncInterval);
        } else if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
      }
      
      setSuccess('Paramètres de synchronisation mis à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres', error);
      setError('Erreur lors de la mise à jour des paramètres. Veuillez réessayer.');
    }
  };

  // Générer un code de jumelage pour ajouter un nouvel appareil
  const generatePairingCode = async () => {
    try {
      const result = await apiOrchestrator.generateDevicePairingCode(userId);
      setPairingCode(result.pairingCode);
    } catch (error) {
      console.error('Erreur lors de la génération du code de jumelage', error);
      setError('Erreur lors de la génération du code de jumelage. Veuillez réessayer.');
    }
  };

  // Ajouter un nouvel appareil
  const addNewDevice = async () => {
    if (!newDeviceName.trim()) {
      setError('Veuillez entrer un nom pour l\'appareil');
      return;
    }
    
    try {
      const deviceInfo = {
        name: newDeviceName.trim(),
        deviceId: localStorage.getItem('deviceId') || undefined
      };
      
      const newDevice = await apiOrchestrator.registerNewDevice(userId, deviceInfo);
      
      // Ajouter le nouvel appareil à la liste
      setDevices(prevDevices => [...prevDevices, newDevice]);
      
      // Générer un code de jumelage
      await generatePairingCode();
      
      setNewDeviceName('');
    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'un nouvel appareil', error);
      setError('Erreur lors de l\'ajout d\'un nouvel appareil. Veuillez réessayer.');
    }
  };

  // Supprimer un appareil
  const deleteDevice = async (deviceId: string) => {
    try {
      await apiOrchestrator.removeUserDevice(userId, deviceId);
      
      // Retirer l'appareil de la liste
      setDevices(prevDevices => prevDevices.filter(device => device.id !== deviceId));
      
      setSuccess('Appareil supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'appareil', error);
      setError('Erreur lors de la suppression de l\'appareil. Veuillez réessayer.');
    } finally {
      setConfirmDeleteDevice(null);
    }
  };

  // Obtenir l'icône appropriée pour un type d'appareil
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <PhoneAndroidIcon />;
      case 'tablet':
        return <TabletIcon />;
      case 'laptop':
        return <LaptopIcon />;
      case 'desktop':
        return <DesktopWindowsIcon />;
      case 'watch':
        return <WatchIcon />;
      default:
        return <DeviceIcon />;
    }
  };

  // Composant personnalisé pour les appareils non identifiés
  const DeviceIcon = () => (
    <Box
      component="div"
      sx={{
        width: 24,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        component="span"
        sx={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          backgroundColor: theme.palette.primary.main,
        }}
      />
    </Box>
  );

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
        Synchronisation des appareils
      </Typography>
      
      <Typography variant="body1" paragraph>
        Gérez la synchronisation entre vos différents appareils et personnalisez les paramètres de synchronisation.
        La synchronisation en temps réel permet de maintenir vos données à jour sur tous vos appareils.
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
        {/* Section des appareils synchronisés */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <LinkIcon sx={{ mr: 1 }} />
                Appareils synchronisés
              </Typography>
              
              <Box>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<RefreshIcon />}
                  onClick={refreshDeviceList}
                  sx={{ mr: 1 }}
                >
                  Actualiser
                </Button>
                <Button 
                  variant="contained" 
                  size="small" 
                  onClick={() => setAddDeviceDialogOpen(true)}
                >
                  Ajouter
                </Button>
              </Box>
            </Box>
            
            {devices.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Aucun appareil synchronisé
                </Typography>
                <Button 
                  variant="contained" 
                  sx={{ mt: 2 }}
                  onClick={() => setAddDeviceDialogOpen(true)}
                >
                  Ajouter un appareil
                </Button>
              </Box>
            ) : (
              <List>
                {devices.map((device) => (
                  <React.Fragment key={device.id}>
                    <ListItem
                      sx={{
                        bgcolor: device.isCurrentDevice ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                        borderRadius: 1,
                      }}
                    >
                      <ListItemIcon>
                        {getDeviceIcon(device.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {device.name}
                            {device.isCurrentDevice && (
                              <Chip 
                                label="Cet appareil" 
                                size="small" 
                                color="primary" 
                                sx={{ ml: 1 }} 
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="caption" component="span" display="block">
                              Dernière synchronisation: {new Date(device.lastSync).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" component="span" display="block">
                              {device.systemInfo.os}
                              {device.systemInfo.browser && ` • ${device.systemInfo.browser}`}
                              {device.systemInfo.appVersion && ` • v${device.systemInfo.appVersion}`}
                            </Typography>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          size="small"
                          label={device.status === 'online' ? 'En ligne' : 'Hors ligne'}
                          color={device.status === 'online' ? 'success' : 'default'}
                          sx={{ mr: 1 }}
                        />
                        {!device.isCurrentDevice && (
                          <IconButton 
                            edge="end" 
                            onClick={() => setConfirmDeleteDevice(device.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Dernière synchronisation:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {lastSyncDate 
                    ? new Date(lastSyncDate).toLocaleString() 
                    : 'Jamais synchronisé'}
                </Typography>
              </Box>
              
              <Button 
                variant="contained" 
                startIcon={<SyncIcon />}
                onClick={syncData}
                disabled={syncing}
              >
                {syncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Section des paramètres de synchronisation */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <SyncIcon sx={{ mr: 1 }} />
              Paramètres de synchronisation
            </Typography>
            
            <List>
              <ListItem>
                <ListItemText 
                  primary="Synchronisation activée" 
                  secondary="Activer ou désactiver complètement la synchronisation" 
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.enabled}
                    onChange={e => updateSyncSettings({ enabled: e.target.checked })}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemText 
                  primary="Synchronisation automatique" 
                  secondary={`Se synchroniser automatiquement toutes les ${settings.syncInterval} minutes`} 
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.autoSync}
                    disabled={!settings.enabled}
                    onChange={e => updateSyncSettings({ autoSync: e.target.checked })}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemText 
                  primary="Synchronisation sur WiFi uniquement" 
                  secondary="Ne synchroniser que lorsque connecté à un réseau WiFi" 
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.syncOnWifiOnly}
                    disabled={!settings.enabled}
                    onChange={e => updateSyncSettings({ syncOnWifiOnly: e.target.checked })}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              
              <Typography variant="subtitle2" sx={{ px: 2, py: 1, bgcolor: 'background.default' }}>
                Données à synchroniser
              </Typography>
              
              <ListItem>
                <ListItemText primary="Activités" />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.syncActivities}
                    disabled={!settings.enabled}
                    onChange={e => updateSyncSettings({ syncActivities: e.target.checked })}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemText primary="Défis" />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.syncChallenges}
                    disabled={!settings.enabled}
                    onChange={e => updateSyncSettings({ syncChallenges: e.target.checked })}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemText primary="Préférences" />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.syncPreferences}
                    disabled={!settings.enabled}
                    onChange={e => updateSyncSettings({ syncPreferences: e.target.checked })}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemText primary="Nutrition" />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.syncNutrition}
                    disabled={!settings.enabled}
                    onChange={e => updateSyncSettings({ syncNutrition: e.target.checked })}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemText primary="Entraînement" />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={settings.syncTraining}
                    disabled={!settings.enabled}
                    onChange={e => updateSyncSettings({ syncTraining: e.target.checked })}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
            
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                <InfoIcon color="info" sx={{ mr: 1, fontSize: 20 }} />
                <Typography variant="body2" color="info.main">
                  Informations sur la synchronisation
                </Typography>
              </Box>
              <Typography variant="caption">
                La synchronisation en temps réel utilise WebSockets pour maintenir vos données à jour 
                sur tous vos appareils. Les modifications sont propagées instantanément lorsque vos 
                appareils sont en ligne. En cas de déconnexion, les modifications sont synchronisées 
                automatiquement à la prochaine connexion.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialogue d'ajout d'appareil */}
      <Dialog 
        open={addDeviceDialogOpen} 
        onClose={() => {
          setAddDeviceDialogOpen(false);
          setPairingCode('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Ajouter un nouvel appareil</DialogTitle>
        <DialogContent>
          {!pairingCode ? (
            <>
              <DialogContentText>
                Entrez un nom pour identifier cet appareil. Ensuite, vous recevrez un code de jumelage 
                que vous pourrez utiliser sur votre autre appareil pour établir la synchronisation.
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                label="Nom de l'appareil"
                fullWidth
                variant="outlined"
                value={newDeviceName}
                onChange={e => setNewDeviceName(e.target.value)}
                sx={{ mt: 2, mb: 2 }}
              />
              <Button 
                variant="contained" 
                fullWidth 
                onClick={addNewDevice}
                disabled={!newDeviceName.trim()}
              >
                Continuer
              </Button>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h6" gutterBottom>
                Scannez ce code avec votre autre appareil
              </Typography>
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                <QRCode 
                  value={`velo-altitude://pair?code=${pairingCode}&userId=${userId}`} 
                  size={200} 
                  level="H"
                />
              </Box>
              <Typography variant="body1" gutterBottom fontWeight="bold">
                Ou utilisez ce code :
              </Typography>
              <Typography 
                variant="h5" 
                gutterBottom 
                sx={{ 
                  letterSpacing: 3, 
                  fontWeight: 'bold',
                  bgcolor: 'background.default',
                  py: 1,
                  borderRadius: 1,
                  display: 'inline-block',
                  px: 3
                }}
              >
                {pairingCode}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Ce code expirera dans 15 minutes. Utilisez-le pour connecter votre nouvel appareil.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAddDeviceDialogOpen(false);
            setPairingCode('');
            setNewDeviceName('');
          }}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue de confirmation de suppression d'appareil */}
      <Dialog
        open={!!confirmDeleteDevice}
        onClose={() => setConfirmDeleteDevice(null)}
      >
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer cet appareil de votre liste de synchronisation ? 
            Toutes les données non synchronisées depuis cet appareil seront perdues.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteDevice(null)}>Annuler</Button>
          <Button 
            onClick={() => confirmDeleteDevice && deleteDevice(confirmDeleteDevice)} 
            color="error"
            autoFocus
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeviceSyncManager;
