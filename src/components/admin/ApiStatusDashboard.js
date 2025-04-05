import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  CircularProgress, 
  Chip, 
  Alert, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  InfoOutlined as InfoIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

// Enregistrement des composants requis de Chart.js
Chart.register(...registerables);

/**
 * Composant pour afficher le statut des services API
 * et les statistiques d'utilisation des quotas
 */
const ApiStatusDashboard = () => {
  // États pour les données
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusData, setStatusData] = useState({});
  const [usageData, setUsageData] = useState({});
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedApi, setSelectedApi] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [chartData, setChartData] = useState({});
  const [selectedTimeRange, setSelectedTimeRange] = useState('day');

  // Chargement initial des données
  useEffect(() => {
    fetchData();
  }, []);

  // Actualisation périodique (toutes les 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Mise à jour des données du graphique lorsque les données d'utilisation changent
  useEffect(() => {
    if (Object.keys(usageData).length > 0) {
      prepareChartData();
    }
  }, [usageData, selectedTimeRange]);

  /**
   * Récupère les données de statut et d'utilisation des API
   * @param {boolean} showLoadingState - Afficher l'état de chargement ou non
   */
  const fetchData = async (showLoadingState = true) => {
    if (showLoadingState) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      // Récupérer les statuts des services API
      const statusResponse = await axios.get('/api/admin/api-status');
      setStatusData(statusResponse.data);
      
      // Récupérer les données d'utilisation
      const usageResponse = await axios.get(`/api/admin/api-usage?timeRange=${selectedTimeRange}`);
      setUsageData(usageResponse.data);
      
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des données API:', err);
      setError('Impossible de charger les données. Vérifiez votre connexion ou vos permissions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Prépare les données pour les graphiques d'utilisation
   */
  const prepareChartData = () => {
    // Structure pour stocker les données formatées
    const formattedData = {};
    
    // Parcours des APIs
    Object.keys(usageData).forEach(apiName => {
      const api = usageData[apiName];
      
      // Créer les données du graphique pour cette API
      const datasets = [];
      const labels = [];
      
      // Déterminer le format des labels selon la plage temporelle
      if (selectedTimeRange === 'day') {
        // Format pour les données horaires
        if (api.hourly) {
          Object.keys(api.hourly).sort().forEach(hour => {
            labels.push(hour + 'h');
            
            // Si cette heure avait un quota effectif, utiliser ces données
            if (api.hourly[hour].quota && api.hourly[hour].quota.total) {
              const used = api.hourly[hour].quota.total - api.hourly[hour].quota.remaining;
              const percent = (used / api.hourly[hour].quota.total) * 100;
              datasets.push(percent);
            } else {
              // Sinon, utiliser le pourcentage relatif à la limite quotidienne
              const percent = (api.hourly[hour].requestCount / api.dailyLimit) * 100;
              datasets.push(percent);
            }
          });
        }
      } else if (selectedTimeRange === 'week') {
        // Format pour les données quotidiennes
        if (api.daily) {
          Object.keys(api.daily).sort().forEach(day => {
            // Formater la date pour l'affichage
            const date = new Date(day);
            const formattedDate = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
            labels.push(formattedDate);
            
            // Calculer le pourcentage d'utilisation
            const percent = (api.daily[day].requestCount / api.dailyLimit) * 100;
            datasets.push(percent);
          });
        }
      } else if (selectedTimeRange === 'month') {
        // Format pour les données hebdomadaires
        if (api.weekly) {
          Object.keys(api.weekly).sort().forEach(week => {
            labels.push('Sem. ' + week.split('-')[1]);
            
            // Calculer le pourcentage d'utilisation
            const percent = (api.weekly[week].requestCount / (api.dailyLimit * 7)) * 100;
            datasets.push(percent);
          });
        }
      }
      
      // Configurer les données du graphique
      formattedData[apiName] = {
        labels,
        datasets: [{
          label: 'Utilisation des quotas (%)',
          data: datasets,
          fill: true,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          tension: 0.1
        }]
      };
    });
    
    setChartData(formattedData);
  };

  /**
   * Ouvre la boîte de dialogue des détails pour une API spécifique
   * @param {string} apiName - Nom de l'API
   */
  const handleOpenDetails = (apiName) => {
    setSelectedApi(apiName);
    setShowDetailsDialog(true);
  };

  /**
   * Ferme la boîte de dialogue des détails
   */
  const handleCloseDetails = () => {
    setShowDetailsDialog(false);
    setSelectedApi(null);
  };

  /**
   * Détermine l'icône d'état en fonction du statut
   * @param {string} status - Statut de l'API
   * @returns {JSX.Element} Icône correspondante
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'down':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      case 'degraded':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      default:
        return <InfoIcon sx={{ color: 'info.main' }} />;
    }
  };

  /**
   * Détermine la couleur de fond en fonction du statut
   * @param {string} status - Statut de l'API
   * @returns {string} Couleur de fond
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return 'rgba(76, 175, 80, 0.1)';
      case 'down':
        return 'rgba(244, 67, 54, 0.1)';
      case 'degraded':
        return 'rgba(255, 152, 0, 0.1)';
      default:
        return 'rgba(33, 150, 243, 0.1)';
    }
  };

  /**
   * Formate le pourcentage d'utilisation d'un quota
   * @param {number} percent - Pourcentage d'utilisation
   * @returns {string} Pourcentage formaté
   */
  const formatUsagePercent = (percent) => {
    return `${Math.round(percent)}%`;
  };

  /**
   * Obtient la couleur de l'utilisation d'un quota en fonction du pourcentage
   * @param {number} percent - Pourcentage d'utilisation
   * @returns {string} Couleur correspondante
   */
  const getUsageColor = (percent) => {
    if (percent >= 90) return 'error.main';
    if (percent >= 70) return 'warning.main';
    return 'success.main';
  };

  // Si chargement initial
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Chargement des données API...
        </Typography>
      </Box>
    );
  }

  // Si erreur
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <Button 
          variant="outlined" 
          color="error" 
          size="small" 
          startIcon={<RefreshIcon />}
          onClick={() => fetchData()}
          sx={{ ml: 2 }}
        >
          Réessayer
        </Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Tableau de bord des API
        </Typography>
        
        <Box>
          {refreshing ? (
            <Chip 
              icon={<CircularProgress size={16} />} 
              label="Actualisation..." 
              color="primary" 
              variant="outlined" 
            />
          ) : (
            <Tooltip title="Actualiser les données">
              <IconButton onClick={() => fetchData(false)}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      
      {/* Résumé global */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Statut global des services
          </Typography>
          
          <Grid container spacing={2}>
            {Object.keys(statusData).map((apiName) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={apiName}>
                <Card 
                  sx={{ 
                    backgroundColor: getStatusColor(statusData[apiName].status),
                    '&:hover': {
                      boxShadow: 3,
                      cursor: 'pointer'
                    }
                  }}
                  onClick={() => handleOpenDetails(apiName)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {apiName}
                      </Typography>
                      {getStatusIcon(statusData[apiName].status)}
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                      {statusData[apiName].description || 'Aucune description disponible'}
                    </Typography>
                    
                    {usageData[apiName] && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" display="block">
                          Utilisation quotidienne
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(100, (usageData[apiName].totalToday / usageData[apiName].dailyLimit) * 100)} 
                            sx={{ 
                              flexGrow: 1, 
                              mr: 1, 
                              height: 8, 
                              borderRadius: 1,
                              backgroundColor: 'background.paper',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: getUsageColor((usageData[apiName].totalToday / usageData[apiName].dailyLimit) * 100)
                              }
                            }} 
                          />
                          <Typography variant="caption" fontWeight="bold">
                            {formatUsagePercent((usageData[apiName].totalToday / usageData[apiName].dailyLimit) * 100)}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', opacity: 0.6 }}>
                      <Typography variant="caption">
                        {statusData[apiName].lastCheck ? 
                          `Dernière vérification: ${new Date(statusData[apiName].lastCheck).toLocaleTimeString('fr-FR')}` : 
                          'Aucune donnée'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
      
      {/* Graphiques d'utilisation */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Utilisation des API
            </Typography>
            
            <Box>
              <Button
                variant={selectedTimeRange === 'day' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setSelectedTimeRange('day')}
                sx={{ mr: 1 }}
              >
                Jour
              </Button>
              <Button
                variant={selectedTimeRange === 'week' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setSelectedTimeRange('week')}
                sx={{ mr: 1 }}
              >
                Semaine
              </Button>
              <Button
                variant={selectedTimeRange === 'month' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setSelectedTimeRange('month')}
              >
                Mois
              </Button>
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            {Object.keys(chartData).map((apiName) => (
              <Grid item xs={12} md={6} key={apiName}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      {apiName}
                    </Typography>
                    
                    {chartData[apiName].labels.length > 0 ? (
                      <Box sx={{ height: 200 }}>
                        <Line 
                          data={chartData[apiName]} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                              y: {
                                beginAtZero: true,
                                max: 100,
                                title: {
                                  display: true,
                                  text: 'Utilisation (%)'
                                }
                              }
                            },
                            plugins: {
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    return `Utilisation: ${context.parsed.y.toFixed(1)}%`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                        <Typography variant="body2" color="text.secondary">
                          Pas de données disponibles pour cette période
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
      
      {/* Boîte de dialogue de détails */}
      {selectedApi && (
        <Dialog open={showDetailsDialog} onClose={handleCloseDetails} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getStatusIcon(statusData[selectedApi].status)}
              <Typography variant="h6" sx={{ ml: 1 }}>
                Détails de l'API {selectedApi}
              </Typography>
            </Box>
          </DialogTitle>
          
          <DialogContent dividers>
            {/* Informations générales */}
            <Typography variant="subtitle1" gutterBottom>
              Informations générales
            </Typography>
            
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row" width="30%">
                      Statut
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={statusData[selectedApi].status.toUpperCase()} 
                        color={
                          statusData[selectedApi].status === 'operational' ? 'success' :
                          statusData[selectedApi].status === 'down' ? 'error' : 'warning'
                        }
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell component="th" scope="row">
                      Dernière vérification
                    </TableCell>
                    <TableCell>
                      {statusData[selectedApi].lastCheck ? 
                        new Date(statusData[selectedApi].lastCheck).toLocaleString('fr-FR') : 
                        'Non disponible'}
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell component="th" scope="row">
                      Quota quotidien
                    </TableCell>
                    <TableCell>
                      {usageData[selectedApi] ? 
                        usageData[selectedApi].dailyLimit.toLocaleString('fr-FR') + ' requêtes' : 
                        'Non disponible'}
                    </TableCell>
                  </TableRow>
                  
                  {usageData[selectedApi] && usageData[selectedApi].monthlyLimit && (
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Quota mensuel
                      </TableCell>
                      <TableCell>
                        {usageData[selectedApi].monthlyLimit.toLocaleString('fr-FR') + ' requêtes'}
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {usageData[selectedApi] && (
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Utilisation aujourd'hui
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {usageData[selectedApi].totalToday.toLocaleString('fr-FR')} / {usageData[selectedApi].dailyLimit.toLocaleString('fr-FR')}
                          </Typography>
                          <Chip 
                            label={formatUsagePercent((usageData[selectedApi].totalToday / usageData[selectedApi].dailyLimit) * 100)} 
                            size="small"
                            color={
                              (usageData[selectedApi].totalToday / usageData[selectedApi].dailyLimit) * 100 >= 90 ? 'error' :
                              (usageData[selectedApi].totalToday / usageData[selectedApi].dailyLimit) * 100 >= 70 ? 'warning' : 'success'
                            }
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Statistiques détaillées */}
            {usageData[selectedApi] && usageData[selectedApi].endpoints && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 3, mb: 1 }}>
                  <TrendingUpIcon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    Répartition par endpoint
                  </Typography>
                </Box>
                
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Endpoint</TableCell>
                        <TableCell align="right">Requêtes (auj.)</TableCell>
                        <TableCell align="right">Erreurs</TableCell>
                        <TableCell align="right">Taux d'erreur</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {usageData[selectedApi].endpoints.map((endpoint) => (
                        <TableRow key={endpoint.path}>
                          <TableCell component="th" scope="row">
                            {endpoint.path}
                          </TableCell>
                          <TableCell align="right">
                            {endpoint.count}
                          </TableCell>
                          <TableCell align="right">
                            {endpoint.errors || 0}
                          </TableCell>
                          <TableCell align="right">
                            {endpoint.count > 0 ? 
                              ((endpoint.errors || 0) / endpoint.count * 100).toFixed(1) + '%' : 
                              '0%'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
            
            {/* Alertes récentes */}
            {usageData[selectedApi] && usageData[selectedApi].recentAlerts && usageData[selectedApi].recentAlerts.length > 0 && (
              <>
                <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
                  Alertes récentes
                </Typography>
                
                {usageData[selectedApi].recentAlerts.map((alert, index) => (
                  <Alert 
                    key={index} 
                    severity={alert.level} 
                    sx={{ mb: 1 }}
                    variant="outlined"
                  >
                    <Typography variant="body2">
                      {alert.message}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {new Date(alert.timestamp).toLocaleString('fr-FR')}
                    </Typography>
                  </Alert>
                ))}
              </>
            )}
          </DialogContent>
          
          <DialogActions>
            <Button onClick={handleCloseDetails}>
              Fermer
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default ApiStatusDashboard;
