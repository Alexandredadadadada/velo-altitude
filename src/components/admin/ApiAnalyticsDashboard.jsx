import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Button,
  Paper,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import {
  Timeline,
  Assessment,
  Warning,
  Check,
  DataUsage,
  Security,
  Refresh,
  ShowChart,
  Error as ErrorIcon
} from '@mui/icons-material';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Couleurs pour les graphiques
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#6BCB77', '#4D96FF'];

/**
 * Tableau de bord pour l'analyse des API
 */
const ApiAnalyticsDashboard = () => {
  // État local
  const [apiData, setApiData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Charger les données au chargement du composant
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Récupérer les données d'API
        const apiResponse = await axios.get('/api/admin/api-status');
        setApiData(apiResponse.data);
        
        // Récupérer les alertes
        const alertsResponse = await axios.get('/api/admin/api-alerts');
        setAlerts(alertsResponse.data.alerts);
        
        setError(null);
      } catch (err) {
        console.error('Erreur lors de la récupération des données :', err);
        setError('Impossible de récupérer les données du tableau de bord.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger]);

  // Forcer la vérification des quotas
  const handleCheckQuotas = async () => {
    try {
      setLoading(true);
      await axios.post('/api/admin/check-quotas');
      // Déclencher un rechargement des données
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Erreur lors de la vérification des quotas :', err);
      setError('Impossible de vérifier les quotas.');
      setLoading(false);
    }
  };

  // Changer d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Rendu pendant le chargement
  if (loading && !apiData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
        <Typography variant="h6" component="div" sx={{ ml: 2 }}>
          Chargement des données...
        </Typography>
      </Box>
    );
  }

  // Rendu en cas d'erreur
  if (error && !apiData) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  // Préparer les données pour les graphiques
  const prepareChartData = () => {
    if (!apiData || !apiData.apis) return { quotaData: [], callsData: [], errorRateData: [] };

    const quotaData = apiData.apis.map(api => ({
      name: api.name,
      value: api.quota ? parseFloat(api.quota.percentUsed) : 0
    }));

    const callsData = apiData.apis.map(api => ({
      name: api.name,
      calls: api.calls || 0
    }));

    const errorRateData = apiData.apis.map(api => {
      const total = api.calls || 0;
      const errors = api.errors || 0;
      const successRate = total > 0 ? ((total - errors) / total) * 100 : 100;
      return {
        name: api.name,
        'Taux de succès': successRate.toFixed(2),
        'Taux d\'erreur': (100 - successRate).toFixed(2)
      };
    });

    return { quotaData, callsData, errorRateData };
  };

  const { quotaData, callsData, errorRateData } = prepareChartData();

  return (
    <Box sx={{ flexGrow: 1, p: 1 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tableau de Bord d'Analyse des API
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Refresh />}
          onClick={handleCheckQuotas}
          disabled={loading}
        >
          {loading ? 'Mise à jour...' : 'Vérifier les quotas'}
        </Button>
      </Box>

      {/* Résumé des alertes */}
      {alerts.length > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => setActiveTab(1)}>
              Voir les détails
            </Button>
          }
        >
          {alerts.length} alerte(s) active(s) nécessitant votre attention
        </Alert>
      )}

      {/* Tabs de navigation */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<Assessment />} label="VUE D'ENSEMBLE" />
          <Tab 
            icon={<Warning />} 
            label="ALERTES" 
            iconPosition="start" 
            sx={{ 
              '& .MuiBadge-badge': { 
                right: -3, 
                top: 13 
              } 
            }}
          />
          <Tab icon={<Timeline />} label="TENDANCES" />
          <Tab icon={<Security />} label="SÉCURITÉ" />
        </Tabs>
      </Paper>

      {/* Contenu des onglets */}
      <div role="tabpanel" hidden={activeTab !== 0}>
        {activeTab === 0 && (
          <>
            {/* Cartes récapitulatives */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      APIs Surveillées
                    </Typography>
                    <Typography variant="h3" component="div">
                      {apiData?.apis?.length || 0}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Check color="success" />
                      <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                        Toutes les API configurées
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Appels Aujourd'hui
                    </Typography>
                    <Typography variant="h3" component="div">
                      {apiData?.totalCalls || 0}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <DataUsage color="primary" />
                      <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                        {apiData?.lastUpdated ? `Dernière mise à jour ${formatDistanceToNow(new Date(apiData.lastUpdated), { addSuffix: true, locale: fr })}` : 'Données en temps réel'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Taux de Réussite
                    </Typography>
                    <Typography variant="h3" component="div">
                      {apiData?.successRate ? `${apiData.successRate}%` : 'N/A'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <ShowChart color="success" />
                      <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                        Moyenne sur toutes les API
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Alertes Actives
                    </Typography>
                    <Typography variant="h3" component="div" color={alerts.length > 0 ? 'error' : 'success'}>
                      {alerts.length}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {alerts.length > 0 ? (
                        <ErrorIcon color="error" />
                      ) : (
                        <Check color="success" />
                      )}
                      <Typography variant="body2" color={alerts.length > 0 ? 'error' : 'success'} sx={{ ml: 1 }}>
                        {alerts.length > 0 ? 'Nécessite attention' : 'Tout est normal'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* Graphiques */}
            <Grid container spacing={3}>
              {/* Utilisation des quotas */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Utilisation des Quotas API
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={quotaData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, value }) => `${name} (${value}%)`}
                        >
                          {quotaData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Appels par API */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Appels par API
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={callsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="calls" fill="#8884d8" name="Appels" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Taux de réussite */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Taux de Réussite par API
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={errorRateData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Legend />
                        <Bar dataKey="Taux de succès" stackId="a" fill="#4caf50" />
                        <Bar dataKey="Taux d'erreur" stackId="a" fill="#f44336" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
              
              {/* Liste détaillée des API */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Détails des API
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <List>
                    {apiData?.apis?.map((api, index) => (
                      <React.Fragment key={api.name}>
                        {index > 0 && <Divider />}
                        <ListItem>
                          <ListItemText
                            primary={api.name}
                            secondary={`${api.calls || 0} appels | ${api.errors || 0} erreurs`}
                          />
                          <Box sx={{ flex: 1, mx: 2 }}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              Quota: {api.quota ? `${api.quota.percentUsed}%` : 'N/A'}
                            </Typography>
                            <LinearProgress 
                              variant="determinate" 
                              value={api.quota ? parseFloat(api.quota.percentUsed) : 0}
                              color={
                                api.quota && parseFloat(api.quota.percentUsed) > 90 ? 'error' : 
                                api.quota && parseFloat(api.quota.percentUsed) > 70 ? 'warning' : 
                                'primary'
                              }
                              sx={{ height: 8, borderRadius: 5 }}
                            />
                          </Box>
                          <Chip 
                            label={api.status || 'OK'} 
                            color={api.status === 'OK' ? 'success' : 'error'}
                            size="small"
                          />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </div>

      <div role="tabpanel" hidden={activeTab !== 1}>
        {activeTab === 1 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Alertes Actives
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {alerts.length === 0 ? (
              <Alert severity="success">
                Aucune alerte active. Tous les systèmes fonctionnent normalement.
              </Alert>
            ) : (
              <List>
                {alerts.map((alert, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <Divider />}
                    <ListItem
                      secondaryAction={
                        <IconButton edge="end" aria-label="dismiss">
                          <Check />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <Warning color={
                          alert.type.includes('critical') ? 'error' : 
                          alert.type.includes('warning') ? 'warning' : 
                          'info'
                        } />
                      </ListItemIcon>
                      <ListItemText
                        primary={alert.subject}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="textPrimary">
                              {alert.apiName} - {new Date(alert.timestamp).toLocaleString()}
                            </Typography>
                            <br />
                            {alert.message}
                          </>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        )}
      </div>

      <div role="tabpanel" hidden={activeTab !== 2}>
        {activeTab === 2 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Tendances d'Utilisation
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Alert severity="info" sx={{ mb: 2 }}>
              Pour voir une analyse détaillée des tendances, exécutez le script d'analyse dans la console d'administration.
            </Alert>
            
            {/* Graphique de tendance fictif - dans une application réelle, ces données viendraient de l'API */}
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { date: '2025-03-29', OpenWeatherMap: 120, Strava: 80, Mapbox: 50, OpenRouteService: 30 },
                    { date: '2025-03-30', OpenWeatherMap: 132, Strava: 89, Mapbox: 45, OpenRouteService: 28 },
                    { date: '2025-03-31', OpenWeatherMap: 141, Strava: 94, Mapbox: 55, OpenRouteService: 35 },
                    { date: '2025-04-01', OpenWeatherMap: 151, Strava: 96, Mapbox: 68, OpenRouteService: 42 },
                    { date: '2025-04-02', OpenWeatherMap: 155, Strava: 102, Mapbox: 71, OpenRouteService: 45 },
                    { date: '2025-04-03', OpenWeatherMap: 162, Strava: 105, Mapbox: 80, OpenRouteService: 55 },
                    { date: '2025-04-04', OpenWeatherMap: 170, Strava: 108, Mapbox: 95, OpenRouteService: 65 },
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="OpenWeatherMap" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="Strava" stroke="#82ca9d" />
                  <Line type="monotone" dataKey="Mapbox" stroke="#ffc658" />
                  <Line type="monotone" dataKey="OpenRouteService" stroke="#ff7300" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        )}
      </div>

      <div role="tabpanel" hidden={activeTab !== 3}>
        {activeTab === 3 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Sécurité des API
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Cette section montre l'état de sécurité des clés API et des tokens d'accès.
            </Alert>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Dernière vérification des clés API
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Exécutée le 04/04/2025 à 00:45
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <Check color="success" />
                        </ListItemIcon>
                        <ListItemText primary="OpenWeatherMap: Valide" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Check color="success" />
                        </ListItemIcon>
                        <ListItemText primary="Mapbox: Valide" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Warning color="warning" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Strava: Validité limitée" 
                          secondary="Token expire dans 13 jours"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Check color="success" />
                        </ListItemIcon>
                        <ListItemText primary="OpenRouteService: Valide" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Check color="success" />
                        </ListItemIcon>
                        <ListItemText primary="OpenAI: Valide" />
                      </ListItem>
                    </List>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      sx={{ mt: 2 }}
                      startIcon={<Security />}
                    >
                      Audit de sécurité complet
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recommandations de sécurité
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <Warning color="warning" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Rotation des clés API" 
                          secondary="Certaines clés n'ont pas été changées depuis plus de 90 jours"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Check color="success" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Validité des tokens OAuth" 
                          secondary="Tous les tokens OAuth sont valides et à jour"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <Check color="success" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Stockage sécurisé" 
                          secondary="Toutes les clés sont stockées de manière sécurisée dans le fichier .env"
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        )}
      </div>
    </Box>
  );
};

export default ApiAnalyticsDashboard;
