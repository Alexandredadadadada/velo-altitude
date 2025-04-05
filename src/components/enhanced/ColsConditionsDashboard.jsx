import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
import EnhancedMetaTags from '../common/EnhancedMetaTags';
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  AcUnit as SnowIcon,
  WaterDrop as RainIcon,
  Air as WindIcon,
  Visibility as VisibilityIcon,
  Construction as RoadworksIcon,
  Cancel as ClosedIcon,
  WrongLocation as DifficultIcon,
  QuestionMark as UnknownIcon,
  OpenInNew as OpenIcon
} from '@mui/icons-material';

// Style des statuts
const statusStyles = {
  open: {
    color: 'success.main',
    label: 'Ouvert',
    icon: <CheckCircleIcon />,
    chipColor: 'success'
  },
  difficult: {
    color: 'warning.main',
    label: 'Difficile',
    icon: <DifficultIcon />,
    chipColor: 'warning'
  },
  closed: {
    color: 'error.main',
    label: 'Fermé',
    icon: <ClosedIcon />,
    chipColor: 'error'
  },
  unknown: {
    color: 'text.secondary',
    label: 'Inconnu',
    icon: <UnknownIcon />,
    chipColor: 'default'
  }
};

// Icônes pour les dangers
const hazardIcons = {
  snow: <SnowIcon />,
  heavy_rain: <RainIcon sx={{ color: 'error.main' }} />,
  rain: <RainIcon />,
  strong_wind: <WindIcon sx={{ color: 'error.main' }} />,
  wind: <WindIcon />,
  fog: <VisibilityIcon />,
  ice: <SnowIcon sx={{ color: 'info.main' }} />,
  roadworks: <RoadworksIcon />
};

const ColsConditionsDashboard = () => {
  const [colsConditions, setColsConditions] = useState({ cols: {} });
  const [colsAlerts, setColsAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCol, setSelectedCol] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Charger les données initiales
  useEffect(() => {
    fetchColsConditions();
    fetchColsAlerts();
  }, []);

  // Récupérer les conditions des cols
  const fetchColsConditions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/cols-conditions');
      setColsConditions(response.data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors de la récupération des conditions des cols:', err);
      setError('Impossible de charger les conditions des cols. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les alertes des cols
  const fetchColsAlerts = async () => {
    try {
      const response = await axios.get('/api/cols-conditions/alerts/active');
      setColsAlerts(response.data.alerts);
    } catch (err) {
      console.error('Erreur lors de la récupération des alertes des cols:', err);
    }
  };

  // Rafraîchir les données
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchColsConditions(),
      fetchColsAlerts()
    ]);
    setRefreshing(false);
  };

  // Forcer la mise à jour des conditions pour tous les cols
  const handleForceUpdate = async () => {
    try {
      setRefreshing(true);
      await axios.post('/api/cols-conditions/update-all');
      setTimeout(() => {
        handleRefresh();
      }, 2000); // Attendre quelques secondes pour que la mise à jour commence
    } catch (err) {
      console.error('Erreur lors de la mise à jour des conditions:', err);
      setError('Impossible de mettre à jour les conditions. Veuillez réessayer plus tard.');
      setRefreshing(false);
    }
  };

  // Ouvrir le dialogue de détails
  const handleOpenDetails = (col) => {
    setSelectedCol(col);
    setDetailDialogOpen(true);
  };

  // Fermer le dialogue de détails
  const handleCloseDetails = () => {
    setDetailDialogOpen(false);
  };

  // Convertir la date en format lisible
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  // Rendu du composant
  if (loading && !colsConditions.cols) {
    return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "SportsActivity",
          "name": "{col.name}",
          "description": "{col.description}",
          "url": "https://velo-altitude.com/colsconditionsdashboardx"
        }
      </script>
      <EnhancedMetaTags
        title="Détail du Col | Velo-Altitude"
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="article"
        imageUrl="/images/og-image.jpg"
      />
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      {/* En-tête */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Surveillance des Conditions des Cols
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ mr: 1 }}
          >
            {refreshing ? 'Rafraîchissement...' : 'Rafraîchir'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleForceUpdate}
            disabled={refreshing}
          >
            Forcer la mise à jour
          </Button>
        </Box>
      </Box>

      {/* Message d'erreur */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Dernière mise à jour */}
      <Box display="flex" alignItems="center" mb={3}>
        <InfoIcon sx={{ mr: 1, color: 'info.main' }} />
        <Typography variant="body2" color="text.secondary">
          Dernière mise à jour: {formatDate(colsConditions.lastUpdated)}
        </Typography>
      </Box>

      {/* Alertes */}
      {colsAlerts.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Alertes actives ({colsAlerts.length})
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Col</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Sévérité</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {colsAlerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>{alert.colName}</TableCell>
                    <TableCell>{alert.message}</TableCell>
                    <TableCell>
                      <Chip 
                        size="small"
                        label={alert.type === 'weather' ? 'Météo' : 
                               alert.type === 'closure' ? 'Fermeture' : 
                               alert.type === 'infrastructure' ? 'Infrastructure' : 
                               alert.type}
                        color={alert.type === 'weather' ? 'info' : 
                               alert.type === 'closure' ? 'error' : 
                               alert.type === 'infrastructure' ? 'warning' : 
                               'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="small"
                        label={alert.severity === 'high' ? 'Élevée' : 
                               alert.severity === 'medium' ? 'Moyenne' : 
                               alert.severity === 'low' ? 'Faible' : 
                               alert.severity}
                        color={alert.severity === 'high' ? 'error' : 
                               alert.severity === 'medium' ? 'warning' : 
                               alert.severity === 'low' ? 'info' : 
                               'default'}
                      />
                    </TableCell>
                    <TableCell>{formatDate(alert.timestamp)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Tableau des conditions */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Col</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Température</TableCell>
                <TableCell>Conditions</TableCell>
                <TableCell>Vent</TableCell>
                <TableCell>Précipitations</TableCell>
                <TableCell>Hazards</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.values(colsConditions.cols).map((col) => (
                <TableRow key={col.id}>
                  <TableCell>{col.name}</TableCell>
                  <TableCell>
                    <Chip
                      icon={statusStyles[col.status]?.icon}
                      label={statusStyles[col.status]?.label}
                      color={statusStyles[col.status]?.chipColor}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {col.weather.temperature !== null ? 
                      `${col.weather.temperature.toFixed(1)} °C` : 
                      'N/A'}
                  </TableCell>
                  <TableCell>{col.weather.conditions || 'N/A'}</TableCell>
                  <TableCell>
                    {col.weather.wind?.speed !== null ? 
                      `${col.weather.wind.speed.toFixed(1)} km/h` : 
                      'N/A'}
                  </TableCell>
                  <TableCell>
                    {col.weather.precipitation ? (
                      <Box>
                        {col.weather.precipitation.rain > 0 && (
                          <Typography variant="body2" component="span">
                            Pluie: {col.weather.precipitation.rain} mm
                          </Typography>
                        )}
                        {col.weather.precipitation.snow > 0 && (
                          <Typography variant="body2" component="span">
                            {col.weather.precipitation.rain > 0 && <br />}
                            Neige: {col.weather.precipitation.snow} cm
                          </Typography>
                        )}
                        {col.weather.precipitation.rain === 0 && col.weather.precipitation.snow === 0 && 'Aucune'}
                      </Box>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={0.5}>
                      {col.roadCondition?.hazards?.map((hazard, index) => (
                        <Tooltip key={index} title={hazard.replace('_', ' ')}>
                          <Box sx={{ color: hazard.includes('strong') || hazard === 'ice' ? 'error.main' : 'text.secondary' }}>
                            {hazardIcons[hazard] || hazard}
                          </Box>
                        </Tooltip>
                      ))}
                      {(!col.roadCondition?.hazards || col.roadCondition.hazards.length === 0) && 'Aucun'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenDetails(col)}>
                      <OpenIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialogue de détails */}
      {selectedCol && (
        <Dialog
          open={detailDialogOpen}
          onClose={handleCloseDetails}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <Typography variant="h6" component="span">
                {selectedCol.name}
              </Typography>
              <Chip
                sx={{ ml: 2 }}
                icon={statusStyles[selectedCol.status]?.icon}
                label={statusStyles[selectedCol.status]?.label}
                color={statusStyles[selectedCol.status]?.chipColor}
                size="small"
              />
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              {/* Données météorologiques */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Conditions météorologiques" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Température
                        </Typography>
                        <Typography variant="h6">
                          {selectedCol.weather.temperature !== null ? 
                            `${selectedCol.weather.temperature.toFixed(1)} °C` : 
                            'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Conditions
                        </Typography>
                        <Typography variant="h6">
                          {selectedCol.weather.conditions || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Vent
                        </Typography>
                        <Typography variant="h6">
                          {selectedCol.weather.wind?.speed !== null ? 
                            `${selectedCol.weather.wind.speed.toFixed(1)} km/h` : 
                            'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Visibilité
                        </Typography>
                        <Typography variant="h6">
                          {selectedCol.weather.visibility !== null ? 
                            `${selectedCol.weather.visibility.toFixed(1)} km` : 
                            'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Pluie
                        </Typography>
                        <Typography variant="h6">
                          {selectedCol.weather.precipitation?.rain !== null ? 
                            `${selectedCol.weather.precipitation.rain} mm/h` : 
                            'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Neige
                        </Typography>
                        <Typography variant="h6">
                          {selectedCol.weather.precipitation?.snow !== null ? 
                            `${selectedCol.weather.precipitation.snow} cm` : 
                            'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Conditions routières */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Conditions routières" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Statut
                        </Typography>
                        <Typography variant="h6" color={statusStyles[selectedCol.roadCondition?.status || 'unknown']?.color}>
                          {statusStyles[selectedCol.roadCondition?.status || 'unknown']?.label}
                        </Typography>
                      </Grid>
                      {selectedCol.roadCondition?.closureReason && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Raison de fermeture
                          </Typography>
                          <Typography variant="body1" color="error">
                            {selectedCol.roadCondition.closureReason}
                          </Typography>
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Dangers
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                          {selectedCol.roadCondition?.hazards?.map((hazard, index) => (
                            <Chip
                              key={index}
                              icon={hazardIcons[hazard]}
                              label={hazard.replace('_', ' ')}
                              variant="outlined"
                              size="small"
                              color={hazard.includes('strong') || hazard === 'ice' ? 'error' : 'default'}
                            />
                          ))}
                          {(!selectedCol.roadCondition?.hazards || selectedCol.roadCondition.hazards.length === 0) && (
                            <Typography>Aucun danger signalé</Typography>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Alertes pour ce col */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Alertes actives pour ce col
                </Typography>
                {colsAlerts.filter(alert => alert.colId === selectedCol.id).length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Message</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Sévérité</TableCell>
                          <TableCell>Date</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {colsAlerts
                          .filter(alert => alert.colId === selectedCol.id)
                          .map((alert) => (
                            <TableRow key={alert.id}>
                              <TableCell>{alert.message}</TableCell>
                              <TableCell>
                                <Chip 
                                  size="small"
                                  label={alert.type === 'weather' ? 'Météo' : 
                                        alert.type === 'closure' ? 'Fermeture' : 
                                        alert.type === 'infrastructure' ? 'Infrastructure' : 
                                        alert.type}
                                  color={alert.type === 'weather' ? 'info' : 
                                        alert.type === 'closure' ? 'error' : 
                                        alert.type === 'infrastructure' ? 'warning' : 
                                        'default'}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  size="small"
                                  label={alert.severity === 'high' ? 'Élevée' : 
                                        alert.severity === 'medium' ? 'Moyenne' : 
                                        alert.severity === 'low' ? 'Faible' : 
                                        alert.severity}
                                  color={alert.severity === 'high' ? 'error' : 
                                        alert.severity === 'medium' ? 'warning' : 
                                        alert.severity === 'low' ? 'info' : 
                                        'default'}
                                />
                              </TableCell>
                              <TableCell>{formatDate(alert.timestamp)}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">Aucune alerte active pour ce col</Alert>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetails}>Fermer</Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={async () => {
                try {
                  setRefreshing(true);
                  await axios.post(`/api/cols-conditions/${selectedCol.id}/update`);
                  setTimeout(async () => {
                    await handleRefresh();
                    setRefreshing(false);
                  }, 1000);
                } catch (err) {
                  console.error('Erreur lors de la mise à jour:', err);
                  setRefreshing(false);
                }
              }}
              disabled={refreshing}
            >
              Actualiser ce col
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default ColsConditionsDashboard;
