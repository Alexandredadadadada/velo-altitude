import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  LinearProgress, 
  Divider, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Refresh as RefreshIcon, 
  WarningAmber as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  CloudQueue as ApiIcon,
  Timeline as StatsIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { 
import EnhancedMetaTags from '../common/EnhancedMetaTags';
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

// Composant principal du tableau de bord
const ApiMonitoringDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Charger les données du tableau de bord
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/admin/dashboard');
      setDashboardData(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des données du tableau de bord:', err);
      setError('Impossible de charger les données du tableau de bord. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Forcer une vérification des quotas
  const checkQuotas = async () => {
    try {
      setRefreshing(true);
      await axios.post('/api/admin/check-quotas');
      await fetchDashboardData();
    } catch (err) {
      console.error('Erreur lors de la vérification des quotas:', err);
      setError('Impossible de vérifier les quotas. Veuillez réessayer.');
    } finally {
      setRefreshing(false);
    }
  };

  // Charger les données au chargement du composant
  useEffect(() => {
    fetchDashboardData();

    // Rafraîchir les données toutes les 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/apimonitoringdashboardx"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
  }, []);

  // Formatter la durée d'activité
  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}j ${hours}h ${minutes}m`;
  };

  // Formatter la mémoire
  const formatMemory = (bytes) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Afficher un indicateur de chargement
  if (loading && !dashboardData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Chargement du tableau de bord...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Afficher une erreur
  if (error && !dashboardData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Box display="flex" justifyContent="center" mt={2}>
          <Button variant="contained" onClick={fetchDashboardData}>
            Réessayer
          </Button>
        </Box>
      </Container>
    );
  }

  // Préparer les données pour les graphiques
  const prepareChartData = () => {
    if (!dashboardData) return [];

    const apiNames = Object.keys(dashboardData.apiStatus.apis);
    return apiNames.map(apiKey => {
      const api = dashboardData.apiStatus.apis[apiKey];
      return {
        name: api.name,
        usage: api.percentageUsed,
        remaining: 100 - api.percentageUsed
      };
    });
  };

  const prepareUsageChartData = () => {
    if (!dashboardData) return [];

    const apiNames = Object.keys(dashboardData.usageStats.daily);
    return apiNames.map(apiName => {
      const dailyStats = dashboardData.usageStats.daily[apiName] || { totalCalls: 0, averageLatency: 0 };
      const weeklyStats = dashboardData.usageStats.weekly[apiName] || { totalCalls: 0, averageLatency: 0 };
      
      return {
        name: apiName,
        dailyCalls: dailyStats.totalCalls,
        weeklyCalls: weeklyStats.totalCalls,
        dailyLatency: dailyStats.averageLatency,
        weeklyLatency: weeklyStats.averageLatency
      };
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <ApiIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Tableau de Bord de Monitoring des API
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<RefreshIcon />}
          onClick={checkQuotas}
          disabled={refreshing}
        >
          {refreshing ? 'Rafraîchissement...' : 'Rafraîchir les données'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Résumé de l'état du serveur */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              <TimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              État du Serveur
            </Typography>
            {dashboardData && (
              <>
                <Typography component="p" variant="h4">
                  {formatUptime(dashboardData.serverStatus.uptime)}
                </Typography>
                <Typography color="text.secondary" sx={{ flex: 1 }}>
                  Mémoire: {formatMemory(dashboardData.serverStatus.memoryUsage.rss)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(dashboardData.serverStatus.timestamp).toLocaleString()}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>

        {/* Résumé des alertes */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography component="h2" variant="h6" color="error" gutterBottom>
              <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Alertes
            </Typography>
            {dashboardData && (
              <>
                <Typography component="p" variant="h4">
                  {dashboardData.alerts.length} alertes
                </Typography>
                {dashboardData.alerts.length > 0 ? (
                  <Typography color="text.secondary" sx={{ flex: 1 }}>
                    Dernière alerte: {new Date(dashboardData.alerts[0].timestamp).toLocaleString()}
                  </Typography>
                ) : (
                  <Typography color="text.secondary" sx={{ flex: 1 }}>
                    Aucune alerte récente.
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  Les 10 dernières alertes sont affichées ci-dessous
                </Typography>
              </>
            )}
          </Paper>
        </Grid>

        {/* Résumé des statistiques */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              <StatsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Statistiques d'Utilisation
            </Typography>
            {dashboardData && (
              <>
                <Typography component="p" variant="h4">
                  {Object.values(dashboardData.usageStats.daily).reduce((acc, curr) => acc + curr.totalCalls, 0)} appels
                </Typography>
                <Typography color="text.secondary" sx={{ flex: 1 }}>
                  Sur les dernières 24 heures
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Object.values(dashboardData.usageStats.weekly).reduce((acc, curr) => acc + curr.totalCalls, 0)} appels cette semaine
                </Typography>
              </>
            )}
          </Paper>
        </Grid>

        {/* Quotas des API */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Quotas des API
            </Typography>
            {dashboardData && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>API</TableCell>
                      <TableCell>Utilisation</TableCell>
                      <TableCell>Appels restants</TableCell>
                      <TableCell>Réinitialisation</TableCell>
                      <TableCell>Dernière vérification</TableCell>
                      <TableCell>État</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(dashboardData.apiStatus.apis).map(([apiKey, api]) => (
                      <TableRow key={apiKey}>
                        <TableCell>{api.name}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Box width="100%" mr={1}>
                              <LinearProgress 
                                variant="determinate" 
                                value={api.percentageUsed} 
                                color={api.percentageUsed > 80 ? "error" : api.percentageUsed > 60 ? "warning" : "primary"}
                              />
                            </Box>
                            <Box minWidth={35}>
                              <Typography variant="body2" color="text.secondary">{`${api.percentageUsed}%`}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{api.remainingCalls}</TableCell>
                        <TableCell>{api.resetIn}</TableCell>
                        <TableCell>{new Date(api.lastChecked).toLocaleString()}</TableCell>
                        <TableCell>
                          {api.percentageUsed > 80 ? (
                            <Tooltip title="Quota critique">
                              <ErrorIcon color="error" />
                            </Tooltip>
                          ) : api.percentageUsed > 60 ? (
                            <Tooltip title="Quota élevé">
                              <WarningIcon color="warning" />
                            </Tooltip>
                          ) : (
                            <Tooltip title="Quota normal">
                              <CheckCircleIcon color="success" />
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Graphique des quotas */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 300 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Utilisation des Quotas
            </Typography>
            {dashboardData && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={prepareChartData()}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Bar dataKey="usage" name="Utilisation (%)" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Graphique d'utilisation */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 300 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Appels API
            </Typography>
            {dashboardData && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={prepareUsageChartData()}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Bar dataKey="dailyCalls" name="Appels (24h)" fill="#82ca9d" />
                  <Bar dataKey="weeklyCalls" name="Appels (7j)" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Graphique de latence */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 300 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Latence des API (ms)
            </Typography>
            {dashboardData && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={prepareUsageChartData()}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="dailyLatency" name="Latence (24h)" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="weeklyLatency" name="Latence (7j)" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Alertes récentes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 300 }}>
            <Typography component="h2" variant="h6" color="error" gutterBottom>
              Alertes Récentes
            </Typography>
            {dashboardData && (
              <Box sx={{ overflow: 'auto', maxHeight: 240 }}>
                {dashboardData.alerts.length > 0 ? (
                  dashboardData.alerts.map((alert, index) => (
                    <Alert 
                      key={index} 
                      severity="warning" 
                      sx={{ mb: 1 }}
                      icon={<WarningIcon />}
                    >
                      <Typography variant="caption" display="block">
                        {new Date(alert.timestamp).toLocaleString()}
                      </Typography>
                      {alert.message}
                    </Alert>
                  ))
                ) : (
                  <Alert severity="success" sx={{ mb: 1 }}>
                    Aucune alerte récente.
                  </Alert>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ApiMonitoringDashboard;
