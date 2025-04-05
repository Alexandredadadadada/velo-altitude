import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  LinearProgress, 
  Button, 
  Chip, 
  Grid, 
  Divider,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { formatDistance, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import axios from 'axios';
import { useSnackbar } from 'notistack';

// Constantes pour les statuts
const STATUS_COLORS = {
  initializing: 'info',
  in_progress: 'info',
  completed: 'success',
  error: 'error',
  cancelled: 'warning',
  never_synced: 'default'
};

const STATUS_LABELS = {
  initializing: 'Initialisation',
  in_progress: 'En cours',
  completed: 'Terminée',
  error: 'Erreur',
  cancelled: 'Annulée',
  never_synced: 'Jamais synchronisé'
};

const StravaSyncStatus = ({ onHistoryClick }) => {
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  // Fonction pour formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Fonction pour formater la durée
  const formatDuration = (milliseconds) => {
    if (!milliseconds) return 'N/A';
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Récupérer le statut de synchronisation
  const fetchSyncStatus = async () => {
    try {
      const response = await axios.get('/api/strava/sync/status');
      setSyncStatus(response.data);
      
      // Si la synchronisation est terminée ou en erreur, arrêter le polling
      if (['completed', 'error', 'cancelled'].includes(response.data.status)) {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
      
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la récupération du statut');
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Démarrer une synchronisation
  const startSync = async (options = {}) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/strava/sync', options);
      
      setSyncStatus(response.data.status);
      enqueueSnackbar('Synchronisation Strava démarrée', { variant: 'success' });
      
      // Démarrer le polling si ce n'est pas déjà fait
      if (!pollingInterval) {
        const interval = setInterval(fetchSyncStatus, 2000);
        setPollingInterval(interval);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du démarrage de la synchronisation');
      enqueueSnackbar(
        err.response?.data?.error || 'Échec du démarrage de la synchronisation', 
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  // Annuler une synchronisation
  const cancelSync = async () => {
    try {
      setLoading(true);
      await axios.delete('/api/strava/sync');
      
      // Mise à jour immédiate du statut
      fetchSyncStatus();
      
      enqueueSnackbar('Synchronisation annulée', { variant: 'info' });
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'annulation');
      enqueueSnackbar(
        err.response?.data?.error || 'Échec de l\'annulation', 
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  // Récupérer le statut initial et configurer le polling si nécessaire
  useEffect(() => {
    fetchSyncStatus();

    // Configurer le polling si on n'a pas encore de statut ou si la synchronisation est en cours
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  // Configurer le polling si le statut change
  useEffect(() => {
    if (syncStatus && ['initializing', 'in_progress'].includes(syncStatus.status) && !pollingInterval) {
      const interval = setInterval(fetchSyncStatus, 2000);
      setPollingInterval(interval);
      return () => clearInterval(interval);
    }
  }, [syncStatus]);

  if (loading && !syncStatus) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  // Afficher un message d'erreur si nécessaire
  if (error && !syncStatus) {
    return (
      <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Synchronisation Strava
        </Typography>
        <Box>
          <Tooltip title="Rafraîchir">
            <IconButton 
              size="small" 
              onClick={fetchSyncStatus} 
              disabled={loading}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Historique des synchronisations">
            <IconButton 
              size="small" 
              onClick={onHistoryClick} 
              disabled={loading}
              sx={{ ml: 1 }}
            >
              <HistoryIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {syncStatus ? (
        <>
          <Box mb={2}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Chip 
                  label={STATUS_LABELS[syncStatus.status] || syncStatus.status} 
                  color={STATUS_COLORS[syncStatus.status] || 'default'}
                  icon={
                    syncStatus.status === 'completed' ? <CheckCircleIcon /> :
                    syncStatus.status === 'error' ? <ErrorIcon /> :
                    syncStatus.status === 'in_progress' ? <CircularProgress size={16} /> :
                    <InfoIcon />
                  }
                />
              </Grid>
              <Grid item xs>
                <Typography variant="body2" color="textSecondary">
                  {syncStatus.message || 'Aucune information disponible'}
                </Typography>
              </Grid>
              {['in_progress', 'initializing'].includes(syncStatus.status) && (
                <Grid item>
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    size="small"
                    startIcon={<CancelIcon />}
                    onClick={cancelSync}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                </Grid>
              )}
              {['completed', 'error', 'cancelled', 'never_synced'].includes(syncStatus.status) && (
                <Grid item>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={() => startSync({ daysToSync: 30 })}
                    disabled={loading}
                  >
                    Synchroniser (30j)
                  </Button>
                </Grid>
              )}
            </Grid>
          </Box>

          {/* Barre de progression */}
          {['in_progress', 'initializing'].includes(syncStatus.status) && (
            <Box mb={2}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Progression: {syncStatus.progress}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={syncStatus.progress || 0} 
                sx={{ height: 10, borderRadius: 5 }} 
              />
            </Box>
          )}

          {/* Statistiques de synchronisation */}
          {syncStatus.stats && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Statistiques
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4} md={2}>
                  <Typography variant="body2" color="textSecondary">Total</Typography>
                  <Typography variant="body1">{syncStatus.stats.total || 0}</Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Typography variant="body2" color="textSecondary">Traitées</Typography>
                  <Typography variant="body1">{syncStatus.stats.processed || 0}</Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Typography variant="body2" color="textSecondary">Ajoutées</Typography>
                  <Typography variant="body1">{syncStatus.stats.added || 0}</Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Typography variant="body2" color="textSecondary">Mises à jour</Typography>
                  <Typography variant="body1">{syncStatus.stats.updated || 0}</Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Typography variant="body2" color="textSecondary">Ignorées</Typography>
                  <Typography variant="body1">{syncStatus.stats.skipped || 0}</Typography>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Typography variant="body2" color="textSecondary">Échecs</Typography>
                  <Typography variant="body1">{syncStatus.stats.failed || 0}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Informations temporelles */}
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">Début</Typography>
                <Typography variant="body2">
                  {syncStatus.startTime ? (
                    <>
                      {formatDate(syncStatus.startTime)}
                      <Tooltip title={formatDate(syncStatus.startTime)}>
                        <Typography variant="caption" display="block" color="textSecondary">
                          {formatDistanceToNow(new Date(syncStatus.startTime), { addSuffix: true, locale: fr })}
                        </Typography>
                      </Tooltip>
                    </>
                  ) : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">Dernière mise à jour</Typography>
                <Typography variant="body2">
                  {syncStatus.lastUpdate ? (
                    <>
                      {formatDate(syncStatus.lastUpdate)}
                      <Tooltip title={formatDate(syncStatus.lastUpdate)}>
                        <Typography variant="caption" display="block" color="textSecondary">
                          {formatDistanceToNow(new Date(syncStatus.lastUpdate), { addSuffix: true, locale: fr })}
                        </Typography>
                      </Tooltip>
                    </>
                  ) : 'N/A'}
                </Typography>
              </Grid>
              {syncStatus.endTime && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">Fin</Typography>
                    <Typography variant="body2">
                      {formatDate(syncStatus.endTime)}
                      <Tooltip title={formatDate(syncStatus.endTime)}>
                        <Typography variant="caption" display="block" color="textSecondary">
                          {formatDistanceToNow(new Date(syncStatus.endTime), { addSuffix: true, locale: fr })}
                        </Typography>
                      </Tooltip>
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">Durée</Typography>
                    <Typography variant="body2">
                      {syncStatus.startTime && syncStatus.endTime ? 
                        formatDuration(new Date(syncStatus.endTime) - new Date(syncStatus.startTime)) 
                        : 'N/A'}
                    </Typography>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>

          {/* Afficher l'erreur si elle existe */}
          {syncStatus.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="subtitle2">
                {syncStatus.error.code ? `Erreur (${syncStatus.error.code})` : 'Erreur'}
              </Typography>
              <Typography variant="body2">{syncStatus.error.message}</Typography>
            </Alert>
          )}
        </>
      ) : (
        // Pas encore de statut de synchronisation
        <Box display="flex" flexDirection="column" alignItems="center" p={3}>
          <Typography variant="body1" gutterBottom>
            Aucune synchronisation Strava n'a encore été effectuée.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={() => startSync({ daysToSync: 30 })}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            Synchroniser maintenant (30 derniers jours)
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => startSync({ fullSync: true })}
            disabled={loading}
            sx={{ mt: 1 }}
          >
            Synchronisation complète
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default StravaSyncStatus;
