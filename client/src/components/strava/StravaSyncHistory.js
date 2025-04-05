import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  TablePagination
} from '@mui/material';
import { 
  Refresh as RefreshIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import axios from 'axios';
import { useSnackbar } from 'notistack';

// Constantes pour les statuts (identiques à celles de StravaSyncStatus)
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

// Composant pour afficher les détails d'une synchronisation
const SyncDetailsDialog = ({ open, onClose, syncDetails }) => {
  if (!syncDetails) return null;
  
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
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Détails de la synchronisation
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Statut
          </Typography>
          <Box display="flex" alignItems="center" mb={1}>
            <Chip 
              label={STATUS_LABELS[syncDetails.status] || syncDetails.status} 
              color={STATUS_COLORS[syncDetails.status] || 'default'}
              size="small"
              sx={{ mr: 2 }}
            />
            <Typography variant="body2">
              {syncDetails.message || 'Aucune information disponible'}
            </Typography>
          </Box>
        </Box>
        
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Période de synchronisation
          </Typography>
          <Typography variant="body2">
            {syncDetails.options?.startDate ? `Du ${formatDate(syncDetails.options.startDate)}` : ''}
            {syncDetails.options?.endDate ? ` au ${formatDate(syncDetails.options.endDate)}` : ''}
            {syncDetails.options?.fullSync ? 'Synchronisation complète' : ''}
            {syncDetails.options?.daysToSync ? `Derniers ${syncDetails.options.daysToSync} jours` : ''}
            {!syncDetails.options?.startDate && !syncDetails.options?.endDate && 
             !syncDetails.options?.fullSync && !syncDetails.options?.daysToSync ? 
              'Période non spécifiée' : ''}
          </Typography>
        </Box>
        
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Statistiques
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell>Traitées</TableCell>
                  <TableCell>Ajoutées</TableCell>
                  <TableCell>Mises à jour</TableCell>
                  <TableCell>Ignorées</TableCell>
                  <TableCell>Échecs</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>{syncDetails.stats?.total || 0}</TableCell>
                  <TableCell>{syncDetails.stats?.processed || 0}</TableCell>
                  <TableCell>{syncDetails.stats?.added || 0}</TableCell>
                  <TableCell>{syncDetails.stats?.updated || 0}</TableCell>
                  <TableCell>{syncDetails.stats?.skipped || 0}</TableCell>
                  <TableCell>{syncDetails.stats?.failed || 0}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Timing
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell width="30%">Début</TableCell>
                  <TableCell>{formatDate(syncDetails.startTime)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Dernière mise à jour</TableCell>
                  <TableCell>{formatDate(syncDetails.lastUpdate)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Fin</TableCell>
                  <TableCell>{formatDate(syncDetails.endTime)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Durée</TableCell>
                  <TableCell>
                    {syncDetails.startTime && syncDetails.endTime ? 
                      formatDuration(new Date(syncDetails.endTime) - new Date(syncDetails.startTime)) 
                      : 'N/A'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        
        {syncDetails.error && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Détails de l'erreur
            </Typography>
            <Alert severity="error">
              <Typography variant="subtitle2">
                {syncDetails.error.code ? `Code: ${syncDetails.error.code}` : 'Erreur'}
              </Typography>
              <Typography variant="body2">{syncDetails.error.message}</Typography>
              {syncDetails.error.details && (
                <Box mt={1}>
                  <Typography variant="caption" component="pre" sx={{ 
                    whiteSpace: 'pre-wrap',
                    overflowX: 'auto',
                    maxHeight: '200px',
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    p: 1,
                    borderRadius: 1
                  }}>
                    {syncDetails.error.details}
                  </Typography>
                </Box>
              )}
            </Alert>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const StravaSyncHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedSync, setSelectedSync] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  // Fonction pour récupérer l'historique des synchronisations
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/strava/sync/history', {
        params: { limit: 20 } // Récupérer les 20 dernières synchronisations
      });
      setHistory(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la récupération de l\'historique');
      enqueueSnackbar(
        err.response?.data?.error || 'Échec de la récupération de l\'historique', 
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  // Ouvrir le dialogue de détails
  const openDetailsDialog = (sync) => {
    setSelectedSync(sync);
    setDialogOpen(true);
  };

  // Fermer le dialogue de détails
  const closeDetailsDialog = () => {
    setDialogOpen(false);
  };

  // Changer de page
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Changer le nombre de lignes par page
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Récupérer l'historique au chargement du composant
  useEffect(() => {
    fetchHistory();
  }, []);

  // Fonction pour formater les dates relatives
  const formatRelativeDate = (dateString) => {
    if (!dateString) return 'N/A';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
  };

  // Fonction pour obtenir l'icône de statut
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon fontSize="small" />;
      case 'error':
        return <ErrorIcon fontSize="small" />;
      case 'cancelled':
        return <WarningIcon fontSize="small" />;
      case 'in_progress':
        return <CircularProgress size={16} />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  if (loading && history.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && history.length === 0) {
    return (
      <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (history.length === 0 && !loading) {
    return (
      <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
        Aucun historique de synchronisation disponible.
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Historique des synchronisations
        </Typography>
        <Tooltip title="Rafraîchir">
          <IconButton 
            size="small" 
            onClick={fetchHistory} 
            disabled={loading}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Statut</TableCell>
              <TableCell>Début</TableCell>
              <TableCell>Durée</TableCell>
              <TableCell>Activités</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : (
              history
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((sync) => (
                  <TableRow key={sync._id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Tooltip title={STATUS_LABELS[sync.status] || sync.status}>
                          <IconButton size="small" sx={{ mr: 1, color: `${STATUS_COLORS[sync.status]}.main` }}>
                            {getStatusIcon(sync.status)}
                          </IconButton>
                        </Tooltip>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                          {sync.message || STATUS_LABELS[sync.status] || sync.status}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={new Date(sync.startTime).toLocaleString()}>
                        <Typography variant="body2">
                          {formatRelativeDate(sync.startTime)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {sync.startTime && sync.endTime ? (
                        <Typography variant="body2">
                          {Math.round((new Date(sync.endTime) - new Date(sync.startTime)) / 1000)}s
                        </Typography>
                      ) : (
                        <Typography variant="body2">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {sync.stats ? (
                          <>{sync.stats.processed} ({sync.stats.added} ajoutées)</>
                        ) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Voir les détails">
                        <IconButton 
                          size="small" 
                          onClick={() => openDetailsDialog(sync)}
                        >
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={history.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Lignes par page:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
      />

      <SyncDetailsDialog
        open={dialogOpen}
        onClose={closeDetailsDialog}
        syncDetails={selectedSync}
      />
    </Paper>
  );
};

export default StravaSyncHistory;
