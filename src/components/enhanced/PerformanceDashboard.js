import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  Memory,
  Speed,
  QueryStats,
  PeopleAlt,
  ViewInAr,
  Map,
  ArrowUpward,
  ArrowDownward,
  Refresh,
  Warning,
  RestaurantMenu
} from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import adminService from '../../services/adminService';
import NutritionMonitoringTab from './NutritionMonitoringTab';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * Tableau de bord de monitoring des performances
 */
const PerformanceDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('day');
  const [metrics, setMetrics] = useState(null);
  const [errorAlert, setErrorAlert] = useState(null);
  const [nutritionMetrics, setNutritionMetrics] = useState(null);
  const [alertsCount, setAlertsCount] = useState(0);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchPerformanceData();
      // Rafraîchir les données toutes les 5 minutes
      const refreshInterval = setInterval(fetchPerformanceData, 5 * 60 * 1000);
      return () => clearInterval(refreshInterval);
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/performancedashboard"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    }
  }, [user, timeRange]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPerformanceMetrics(timeRange);
      setMetrics(data);
      
      // Récupérer les métriques spécifiques à la nutrition
      const nutritionData = await adminService.getNutritionMetrics(timeRange);
      setNutritionMetrics(nutritionData);
      
      // Récupérer le compte des alertes actives
      const alerts = await adminService.getActiveAlerts();
      setAlertsCount(alerts.length);
      
      setErrorAlert(null);
    } catch (error) {
      console.error('Erreur lors du chargement des métriques:', error);
      setErrorAlert('Erreur lors du chargement des données de performance.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const formatMetricValue = (value) => {
    if (value === undefined || value === null) return '-';
    if (typeof value === 'number') {
      if (value > 1000) return (value / 1000).toFixed(2) + 'k';
      return value.toFixed(2);
    }
    return value;
  };

  const getStatusColor = (value, thresholds) => {
    if (!thresholds) return 'success';
    if (value > thresholds.critical) return 'error';
    if (value > thresholds.warning) return 'warning';
    return 'success';
  };

  const getPercentageChange = (current, previous) => {
    if (!previous) return null;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  if (!user || user.role !== 'admin') {
    return (
      <Alert severity="error">
        Accès non autorisé. Seuls les administrateurs peuvent accéder à cette page.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Tableau de bord de performance
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="time-range-label">Période</InputLabel>
            <Select
              labelId="time-range-label"
              value={timeRange}
              onChange={handleTimeRangeChange}
              label="Période"
            >
              <MenuItem value="day">Aujourd'hui</MenuItem>
              <MenuItem value="week">7 derniers jours</MenuItem>
              <MenuItem value="month">30 derniers jours</MenuItem>
            </Select>
          </FormControl>
          
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={fetchPerformanceData}
          >
            Actualiser
          </Button>
        </Box>
      </Box>
      
      {errorAlert && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorAlert}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* KPIs */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} lg={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Speed color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">
                      Temps de réponse moyen
                    </Typography>
                  </Box>
                  <Typography variant="h4">
                    {metrics?.overview?.averageResponseTime || '-'} ms
                  </Typography>
                  {metrics?.overview?.responseTimeTrend && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {metrics.overview.responseTimeTrend > 0 ? (
                        <ArrowUpward color="error" fontSize="small" />
                      ) : (
                        <ArrowDownward color="success" fontSize="small" />
                      )}
                      <Typography variant="body2" color={metrics.overview.responseTimeTrend > 0 ? 'error' : 'success'}>
                        {Math.abs(metrics.overview.responseTimeTrend)}% vs période précédente
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} lg={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Memory color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">
                      Utilisation mémoire
                    </Typography>
                  </Box>
                  <Typography variant="h4">
                    {metrics?.overview?.memoryUsage 
                      ? (metrics.overview.memoryUsage / (1024 * 1024)).toFixed(1) + ' MB'
                      : '-'
                    }
                  </Typography>
                  {metrics?.overview?.memoryUsagePeak && (
                    <Typography variant="body2" color="text.secondary">
                      Pic: {(metrics.overview.memoryUsagePeak / (1024 * 1024)).toFixed(1)} MB
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} lg={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PeopleAlt color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">
                      Sessions actives
                    </Typography>
                  </Box>
                  <Typography variant="h4">
                    {metrics?.overview?.activeSessions || '-'}
                  </Typography>
                  {metrics?.overview?.sessionsTrend && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {metrics.overview.sessionsTrend > 0 ? (
                        <ArrowUpward color="success" fontSize="small" />
                      ) : (
                        <ArrowDownward color="error" fontSize="small" />
                      )}
                      <Typography variant="body2" color={metrics.overview.sessionsTrend > 0 ? 'success' : 'error'}>
                        {Math.abs(metrics.overview.sessionsTrend)}% vs période précédente
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} lg={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <QueryStats color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">
                      Requêtes API / min
                    </Typography>
                  </Box>
                  <Typography variant="h4">
                    {metrics?.overview?.requestsPerMinute || '-'}
                  </Typography>
                  {metrics?.overview?.errorRate !== undefined && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Chip 
                        size="small"
                        label={`Taux d'erreur: ${metrics.overview.errorRate}%`}
                        color={getStatusColor(metrics.overview.errorRate, { warning: 1, critical: 5 })}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Aperçu" icon={<Speed />} />
              <Tab label="API & Base de données" icon={<QueryStats />} />
              <Tab label="Rendu 3D & Carte" icon={<ViewInAr />} />
              <Tab label="Système" icon={<Memory />} />
              <Tab label="Nutrition" icon={<RestaurantMenu />} />
            </Tabs>
          </Paper>
          
          {/* Tab Content */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              {/* Performance globale au fil du temps */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Performance globale
                  </Typography>
                  
                  {metrics?.timeSeries?.responseTime ? (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metrics.timeSeries.responseTime}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            name="Temps de réponse (ms)" 
                            stroke="#8884d8" 
                            activeDot={{ r: 8 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aucune donnée disponible
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              {/* Alertes */}
              {metrics?.alerts && metrics.alerts.length > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Alertes de performance
                    </Typography>
                    
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Sévérité</TableCell>
                            <TableCell>Métrique</TableCell>
                            <TableCell>Message</TableCell>
                            <TableCell>Horodatage</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {metrics.alerts.map((alert, index) => (
                            <TableRow key={index} sx={{ 
                              backgroundColor: alert.severity === 'critical' 
                                ? 'error.lighter' 
                                : alert.severity === 'warning' 
                                  ? 'warning.lighter' 
                                  : 'inherit'
                            }}>
                              <TableCell>
                                <Chip 
                                  size="small"
                                  label={alert.severity}
                                  color={
                                    alert.severity === 'critical' 
                                      ? 'error' 
                                      : alert.severity === 'warning' 
                                        ? 'warning' 
                                        : 'info'
                                  }
                                />
                              </TableCell>
                              <TableCell>{alert.metric}</TableCell>
                              <TableCell>{alert.message}</TableCell>
                              <TableCell>{new Date(alert.timestamp).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
          
          {activeTab === 1 && (
            <Grid container spacing={3}>
              {/* Endpoints les plus lents */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Endpoints les plus lents
                  </Typography>
                  
                  {metrics?.api?.slowestEndpoints ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Endpoint</TableCell>
                            <TableCell align="right">Temps moyen (ms)</TableCell>
                            <TableCell align="right">Requêtes</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {metrics.api.slowestEndpoints.map((endpoint, index) => (
                            <TableRow key={index}>
                              <TableCell>{endpoint.route}</TableCell>
                              <TableCell align="right">
                                <Typography
                                  color={getStatusColor(endpoint.duration, { warning: 200, critical: 500 })}
                                >
                                  {endpoint.duration.toFixed(2)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">{endpoint.count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aucune donnée disponible
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              {/* Opérations DB les plus lentes */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Opérations DB les plus lentes
                  </Typography>
                  
                  {metrics?.database?.slowestOperations ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Opération</TableCell>
                            <TableCell>Collection</TableCell>
                            <TableCell align="right">Temps moyen (ms)</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {metrics.database.slowestOperations.map((op, index) => (
                            <TableRow key={index}>
                              <TableCell>{op.operation}</TableCell>
                              <TableCell>{op.collection}</TableCell>
                              <TableCell align="right">
                                <Typography
                                  color={getStatusColor(op.duration, { warning: 100, critical: 300 })}
                                >
                                  {op.duration.toFixed(2)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aucune donnée disponible
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              {/* Taux d'erreur par endpoint */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Taux d'erreur par endpoint
                  </Typography>
                  
                  {metrics?.api?.errorRates ? (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.api.errorRates}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="endpoint" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="errorRate" name="Taux d'erreur (%)" fill="#ff7043" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aucune donnée disponible
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
          
          {activeTab === 2 && (
            <Grid container spacing={3}>
              {/* Performance de rendu des cartes */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Performance de rendu des cartes
                  </Typography>
                  
                  {metrics?.rendering?.maps ? (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.rendering.maps}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="complexity" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="renderTime" name="Temps de rendu (ms)" fill="#4caf50" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aucune donnée disponible
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              {/* Performance de rendu 3D */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Performance de rendu 3D
                  </Typography>
                  
                  {metrics?.rendering?.visualization ? (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.rendering.visualization}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="type" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="renderTime" name="Temps de rendu (ms)" fill="#3f51b5" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aucune donnée disponible
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              {/* Détails des performances par appareil */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Performance par type d'appareil
                  </Typography>
                  
                  {metrics?.rendering?.devicePerformance ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Type d'appareil</TableCell>
                            <TableCell align="right">Temps de rendu carte (ms)</TableCell>
                            <TableCell align="right">Temps de rendu 3D (ms)</TableCell>
                            <TableCell align="right">FPS moyen</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {metrics.rendering.devicePerformance.map((device, index) => (
                            <TableRow key={index}>
                              <TableCell>{device.deviceType}</TableCell>
                              <TableCell align="right">{device.mapRenderTime.toFixed(1)}</TableCell>
                              <TableCell align="right">{device.visRenderTime.toFixed(1)}</TableCell>
                              <TableCell align="right">
                                <Typography
                                  color={getStatusColor(device.fps, { warning: 30, critical: 20 })}
                                >
                                  {device.fps.toFixed(1)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aucune donnée disponible
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
          
          {activeTab === 3 && (
            <Grid container spacing={3}>
              {/* Utilisation mémoire au fil du temps */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Utilisation mémoire
                  </Typography>
                  
                  {metrics?.system?.memoryUsage ? (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metrics.system.memoryUsage}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            name="Mémoire (MB)" 
                            stroke="#2196f3" 
                            activeDot={{ r: 8 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aucune donnée disponible
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              {/* Utilisation CPU au fil du temps */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Utilisation CPU
                  </Typography>
                  
                  {metrics?.system?.cpuUsage ? (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metrics.system.cpuUsage}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            name="CPU (%)" 
                            stroke="#f44336" 
                            activeDot={{ r: 8 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aucune donnée disponible
                    </Typography>
                  )}
                </Paper>
              </Grid>
              
              {/* Santé du système */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Santé du système
                  </Typography>
                  
                  {metrics?.system?.health ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Métrique</TableCell>
                            <TableCell align="right">Valeur</TableCell>
                            <TableCell align="right">Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(metrics.system.health).map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell>{key}</TableCell>
                              <TableCell align="right">{formatMetricValue(value.value)}</TableCell>
                              <TableCell align="right">
                                <Chip 
                                  size="small"
                                  label={value.status}
                                  color={
                                    value.status === 'critical' 
                                      ? 'error' 
                                      : value.status === 'warning' 
                                        ? 'warning' 
                                        : 'success'
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Aucune donnée disponible
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
          
          {activeTab === 4 && (
            <NutritionMonitoringTab nutritionMetrics={nutritionMetrics} formatMetricValue={formatMetricValue} />
          )}
        </>
      )}
    </Box>
  );
};

export default PerformanceDashboard;
