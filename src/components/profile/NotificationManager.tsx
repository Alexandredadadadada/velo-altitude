// src/components/profile/NotificationManager.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Switch, 
  FormControlLabel, 
  Divider, 
  Button, 
  Snackbar, 
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  PhoneAndroid as PhoneAndroidIcon,
  CalendarMonth as CalendarIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useApiOrchestrator } from '../../hooks/useApiOrchestrator';

interface NotificationChannel {
  id: string;
  type: 'email' | 'push' | 'in-app';
  enabled: boolean;
  description: string;
}

interface NotificationSubscription {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  enabled: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  channelIds: string[];
}

interface NotificationCategory {
  id: string;
  name: string;
  description: string;
}

interface NotificationEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  remindBefore: number; // minutes
  enabled: boolean;
}

interface NotificationSummary {
  totalEnabled: number;
  totalDisabled: number;
  byChannel: {
    email: number;
    push: number;
    inApp: number;
  };
}

const NotificationManager: React.FC = () => {
  const apiOrchestrator = useApiOrchestrator();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [subscriptions, setSubscriptions] = useState<NotificationSubscription[]>([]);
  const [categories, setCategories] = useState<NotificationCategory[]>([]);
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<NotificationEvent | null>(null);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<NotificationSubscription | null>(null);

  // Effet pour charger les données initiales
  useEffect(() => {
    fetchAllNotificationData();
  }, []);

  // Récupérer toutes les données de notification
  const fetchAllNotificationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // En situation réelle, ces appels seraient faits à l'APIOrchestrator
      // Simulation de données pour le développement
      const userData = await mockFetchUserNotificationData();
      
      setChannels(userData.channels);
      setSubscriptions(userData.subscriptions);
      setCategories(userData.categories);
      setEvents(userData.events);
      
      // Calculer le résumé des notifications
      calculateSummary(userData.channels, userData.subscriptions);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données de notification:', err);
      setError('Impossible de charger les paramètres de notification. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Fonction de simulation de données pour le développement
  const mockFetchUserNotificationData = async () => {
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      channels: [
        { id: 'email', type: 'email', enabled: true, description: 'Notifications par email' },
        { id: 'push', type: 'push', enabled: true, description: 'Notifications push sur le navigateur' },
        { id: 'in-app', type: 'in-app', enabled: true, description: 'Notifications dans l\'application' }
      ],
      categories: [
        { id: 'activity', name: 'Activités', description: 'Notifications liées à vos activités' },
        { id: 'social', name: 'Social', description: 'Interactions sociales et commentaires' },
        { id: 'challenges', name: 'Défis', description: 'Progrès et rappels sur vos défis' },
        { id: 'system', name: 'Système', description: 'Mises à jour et informations système' }
      ],
      subscriptions: [
        { 
          id: 'new-comments', 
          categoryId: 'social', 
          name: 'Nouveaux commentaires', 
          description: 'Notifications lors de nouveaux commentaires sur vos activités',
          enabled: true,
          frequency: 'immediate',
          channelIds: ['email', 'in-app']
        },
        { 
          id: 'challenge-progress', 
          categoryId: 'challenges', 
          name: 'Progression des défis', 
          description: 'Mise à jour sur votre progression dans les défis',
          enabled: true,
          frequency: 'weekly',
          channelIds: ['email']
        },
        { 
          id: 'friend-activities', 
          categoryId: 'social', 
          name: 'Activités des amis', 
          description: 'Notification des nouvelles activités de vos amis',
          enabled: false,
          frequency: 'daily',
          channelIds: ['in-app']
        },
        { 
          id: 'system-updates', 
          categoryId: 'system', 
          name: 'Mises à jour système', 
          description: 'Informations sur les mises à jour de l\'application',
          enabled: true,
          frequency: 'immediate',
          channelIds: ['email', 'push']
        }
      ],
      events: [
        {
          id: 'weekly-training',
          title: 'Entraînement hebdomadaire',
          description: 'Rappel pour l\'entraînement de groupe du dimanche',
          date: '2025-04-14',
          time: '10:00',
          remindBefore: 60, // 1 heure avant
          enabled: true
        },
        {
          id: 'nutrition-plan',
          title: 'Mise à jour du plan nutritionnel',
          description: 'Rappel pour revoir votre plan nutritionnel',
          date: '2025-04-10',
          time: '18:00',
          remindBefore: 30, // 30 minutes avant
          enabled: true
        }
      ]
    };
  };

  // Calculer le résumé des notifications
  const calculateSummary = (channels: NotificationChannel[], subscriptions: NotificationSubscription[]) => {
    const enabledSubscriptions = subscriptions.filter(s => s.enabled);
    const disabledSubscriptions = subscriptions.filter(s => !s.enabled);
    
    const summary: NotificationSummary = {
      totalEnabled: enabledSubscriptions.length,
      totalDisabled: disabledSubscriptions.length,
      byChannel: {
        email: 0,
        push: 0,
        inApp: 0
      }
    };
    
    // Compter les abonnements par canal
    enabledSubscriptions.forEach(subscription => {
      subscription.channelIds.forEach(channelId => {
        if (channelId === 'email') summary.byChannel.email++;
        else if (channelId === 'push') summary.byChannel.push++;
        else if (channelId === 'in-app') summary.byChannel.inApp++;
      });
    });
    
    setSummary(summary);
  };

  // Gérer le changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Mettre à jour l'état d'un canal
  const handleChannelToggle = async (channelId: string, enabled: boolean) => {
    try {
      // En situation réelle, appel à l'API
      // await apiOrchestrator.updateNotificationChannel(channelId, { enabled });
      
      // Mise à jour locale pour l'interface
      setChannels(prevChannels => 
        prevChannels.map(channel => 
          channel.id === channelId ? { ...channel, enabled } : channel
        )
      );
      
      setSuccess(`Canal de notification ${enabled ? 'activé' : 'désactivé'} avec succès`);
      
      // Mettre à jour le résumé
      setChannels(prevChannels => {
        const updatedChannels = prevChannels.map(channel => 
          channel.id === channelId ? { ...channel, enabled } : channel
        );
        calculateSummary(updatedChannels, subscriptions);
        return updatedChannels;
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour du canal:', err);
      setError('Impossible de mettre à jour le canal de notification');
    }
  };

  // Mettre à jour l'état d'un abonnement
  const handleSubscriptionToggle = async (subscriptionId: string, enabled: boolean) => {
    try {
      // En situation réelle, appel à l'API
      // await apiOrchestrator.updateNotificationSubscription(subscriptionId, { enabled });
      
      // Mise à jour locale pour l'interface
      setSubscriptions(prevSubscriptions => 
        prevSubscriptions.map(subscription => 
          subscription.id === subscriptionId ? { ...subscription, enabled } : subscription
        )
      );
      
      setSuccess(`Abonnement ${enabled ? 'activé' : 'désactivé'} avec succès`);
      
      // Mettre à jour le résumé
      setSubscriptions(prevSubscriptions => {
        const updatedSubscriptions = prevSubscriptions.map(subscription => 
          subscription.id === subscriptionId ? { ...subscription, enabled } : subscription
        );
        calculateSummary(channels, updatedSubscriptions);
        return updatedSubscriptions;
      });
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'abonnement:', err);
      setError('Impossible de mettre à jour l\'abonnement aux notifications');
    }
  };

  // Fonction pour fermer les alertes
  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  // Ouvrir le dialogue d'événement
  const handleOpenEventDialog = (event: NotificationEvent | null = null) => {
    setCurrentEvent(event || {
      id: '',
      title: '',
      description: '',
      date: '',
      remindBefore: 30,
      enabled: true
    } as NotificationEvent);
    setIsEventDialogOpen(true);
  };

  // Fermer le dialogue d'événement
  const handleCloseEventDialog = () => {
    setIsEventDialogOpen(false);
    setCurrentEvent(null);
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Gestion des notifications
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Configurez vos préférences de notification, gérez vos abonnements et planifiez des rappels pour ne rien manquer.
      </Typography>
      
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
          <Button variant="outlined" size="small" sx={{ ml: 2 }} onClick={fetchAllNotificationData}>
            Réessayer
          </Button>
        </Alert>
      ) : (
        <>
          {/* Résumé des notifications */}
          {summary && (
            <Paper elevation={1} sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h6">{summary.totalEnabled}</Typography>
                    <Typography variant="body2" color="text.secondary">Notifications actives</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>Par canal:</Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Chip 
                        icon={<EmailIcon />} 
                        label={`Email: ${summary.byChannel.email}`} 
                        size="small" 
                        color={summary.byChannel.email > 0 ? "primary" : "default"}
                      />
                      <Chip 
                        icon={<PhoneAndroidIcon />} 
                        label={`Push: ${summary.byChannel.push}`} 
                        size="small"
                        color={summary.byChannel.push > 0 ? "primary" : "default"}
                      />
                      <Chip 
                        icon={<NotificationsIcon />} 
                        label={`In-app: ${summary.byChannel.inApp}`} 
                        size="small"
                        color={summary.byChannel.inApp > 0 ? "primary" : "default"}
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Onglets de navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="notification settings tabs">
              <Tab label="Canaux" icon={<PhoneAndroidIcon />} iconPosition="start" />
              <Tab label="Abonnements" icon={<NotificationsActiveIcon />} iconPosition="start" />
              <Tab label="Rappels" icon={<CalendarIcon />} iconPosition="start" />
            </Tabs>
          </Box>

          {/* Contenu de l'onglet Canaux */}
          {activeTab === 0 && (
            <Box sx={{ py: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Canaux de notification disponibles
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Activez ou désactivez les différents canaux par lesquels vous pouvez recevoir des notifications.
              </Typography>
              
              <List>
                {channels.map(channel => (
                  <ListItem key={channel.id}>
                    <ListItemIcon>
                      {channel.type === 'email' ? <EmailIcon /> : 
                       channel.type === 'push' ? <PhoneAndroidIcon /> : 
                       <NotificationsIcon />}
                    </ListItemIcon>
                    <ListItemText 
                      primary={channel.description} 
                      secondary={channel.enabled ? 'Activé' : 'Désactivé'}
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={channel.enabled} 
                          onChange={(e) => handleChannelToggle(channel.id, e.target.checked)}
                        />
                      }
                      label=""
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Contenu de l'onglet Abonnements */}
          {activeTab === 1 && (
            <Box sx={{ py: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1">
                  Gérer vos abonnements aux notifications
                </Typography>
                <Button 
                  variant="outlined" 
                  startIcon={<AddIcon />}
                  onClick={() => setIsSubscriptionDialogOpen(true)}
                >
                  Nouvel abonnement
                </Button>
              </Box>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Personnalisez les types de notifications que vous souhaitez recevoir et leur fréquence.
              </Typography>
              
              {categories.map(category => {
                const categorySubscriptions = subscriptions.filter(s => s.categoryId === category.id);
                
                return categorySubscriptions.length > 0 ? (
                  <Box key={category.id} sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ 
                      bgcolor: 'action.hover', 
                      p: 1, 
                      borderRadius: 1 
                    }}>
                      {category.name}
                    </Typography>
                    
                    <List>
                      {categorySubscriptions.map(subscription => (
                        <ListItem 
                          key={subscription.id}
                          secondaryAction={
                            <Box>
                              <IconButton 
                                edge="end" 
                                aria-label="edit"
                                onClick={() => {
                                  setCurrentSubscription(subscription);
                                  setIsSubscriptionDialogOpen(true);
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                              <Switch 
                                checked={subscription.enabled} 
                                onChange={(e) => handleSubscriptionToggle(subscription.id, e.target.checked)}
                              />
                            </Box>
                          }
                        >
                          <ListItemText 
                            primary={subscription.name} 
                            secondary={
                              <Box>
                                <Typography variant="body2">{subscription.description}</Typography>
                                <Box mt={0.5} display="flex" gap={0.5}>
                                  {subscription.channelIds.includes('email') && 
                                    <Chip size="small" icon={<EmailIcon />} label="Email" />}
                                  {subscription.channelIds.includes('push') && 
                                    <Chip size="small" icon={<PhoneAndroidIcon />} label="Push" />}
                                  {subscription.channelIds.includes('in-app') && 
                                    <Chip size="small" icon={<NotificationsIcon />} label="In-app" />}
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ) : null;
              })}
            </Box>
          )}

          {/* Contenu de l'onglet Rappels */}
          {activeTab === 2 && (
            <Box sx={{ py: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1">
                  Rappels et événements planifiés
                </Typography>
                <Button 
                  variant="outlined" 
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenEventDialog()}
                >
                  Nouveau rappel
                </Button>
              </Box>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Créez et gérez des rappels pour vos entraînements, événements et tâches importantes.
              </Typography>
              
              {events.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <CalendarIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.3 }} />
                  <Typography color="text.secondary" mt={2}>
                    Aucun rappel programmé
                  </Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />} 
                    sx={{ mt: 2 }}
                    onClick={() => handleOpenEventDialog()}
                  >
                    Créer un rappel
                  </Button>
                </Box>
              ) : (
                <List>
                  {events.map(event => (
                    <ListItem 
                      key={event.id}
                      secondaryAction={
                        <Box>
                          <IconButton 
                            edge="end" 
                            aria-label="edit"
                            onClick={() => handleOpenEventDialog(event)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            edge="end" 
                            aria-label="delete"
                            onClick={() => {
                              // Logique de suppression ici
                              setEvents(prevEvents => prevEvents.filter(e => e.id !== event.id));
                              setSuccess('Rappel supprimé avec succès');
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemIcon>
                        <CalendarIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={event.title} 
                        secondary={
                          <Box>
                            <Typography variant="body2">{event.description}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {`${event.date} ${event.time || ''} - Rappel ${event.remindBefore} min avant`}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </>
      )}
      
      {/* Alertes de succès/erreur */}
      <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="success">
          {success}
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationManager;
