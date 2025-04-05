import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  InputAdornment
} from '@mui/material';
import {
  Save,
  Refresh,
  Add,
  Delete,
  Edit,
  Settings,
  Security,
  Email,
  Notifications
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import axios from 'axios';

/**
 * Page de paramètres du système de monitoring des API
 */
const AdminApiSettingsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editApiConfig, setEditApiConfig] = useState(null);
  
  // État local pour les paramètres
  const [apiConfigs, setApiConfigs] = useState([]);
  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    smsEnabled: false,
    slackEnabled: false,
    emailRecipients: '',
    smsRecipients: '',
    slackWebhook: ''
  });
  const [scheduleSettings, setScheduleSettings] = useState({
    dailyReport: '0 8 * * *',
    weeklyReport: '0 9 * * 1',
    monthlyReport: '0 10 1 * *',
    monitoringInterval: '0 */6 * * *'
  });
  const [thresholdSettings, setThresholdSettings] = useState({
    quotaWarning: 70,
    quotaCritical: 90,
    responseTimeWarning: 1000,
    responseTimeCritical: 3000
  });

  // Charger les paramètres depuis l'API
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        // Charger les configurations des API
        const apiConfigsResponse = await axios.get('/api/admin/api-configs');
        setApiConfigs(apiConfigsResponse.data.configs);
        
        // Charger les paramètres de notification
        const notifResponse = await axios.get('/api/admin/notification-settings');
        setNotificationSettings(notifResponse.data.settings);
        
        // Charger les paramètres de planification
        const scheduleResponse = await axios.get('/api/admin/schedule-settings');
        setScheduleSettings(scheduleResponse.data.settings);
        
        // Charger les paramètres de seuil
        const thresholdResponse = await axios.get('/api/admin/threshold-settings');
        setThresholdSettings(thresholdResponse.data.settings);
        
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des paramètres :', err);
        setError('Erreur lors du chargement des paramètres. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Gestion des changements d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Sauvegarder les paramètres de l'onglet actif
  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 0: // API Configs
          await axios.post('/api/admin/api-configs', { configs: apiConfigs });
          break;
        case 1: // Notifications
          await axios.post('/api/admin/notification-settings', { settings: notificationSettings });
          break;
        case 2: // Planification
          await axios.post('/api/admin/schedule-settings', { settings: scheduleSettings });
          break;
        case 3: // Seuils
          await axios.post('/api/admin/threshold-settings', { settings: thresholdSettings });
          break;
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des paramètres :', err);
      setError('Erreur lors de la sauvegarde des paramètres. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Ajouter une nouvelle configuration d'API
  const handleAddApiConfig = () => {
    setEditApiConfig({
      name: '',
      description: '',
      key: '',
      dailyLimit: 1000,
      isActive: true,
      testEndpoint: '',
      refreshTokenUrl: '',
      monitoringEnabled: true
    });
    setOpenDialog(true);
  };

  // Éditer une configuration d'API existante
  const handleEditApiConfig = (config) => {
    setEditApiConfig(config);
    setOpenDialog(true);
  };

  // Sauvegarder la configuration d'API
  const handleSaveApiConfig = () => {
    if (editApiConfig) {
      const isNew = !apiConfigs.find(config => config.name === editApiConfig.name);
      
      if (isNew) {
        setApiConfigs([...apiConfigs, editApiConfig]);
      } else {
        setApiConfigs(apiConfigs.map(config => 
          config.name === editApiConfig.name ? editApiConfig : config
        ));
      }
    }
    
    setOpenDialog(false);
    setEditApiConfig(null);
  };

  // Supprimer une configuration d'API
  const handleDeleteApiConfig = (apiName) => {
    setApiConfigs(apiConfigs.filter(config => config.name !== apiName));
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Paramètres du Monitoring | Administration | Cyclisme Grand Est</title>
      </Helmet>
      
      <Box sx={{ p: 3 }}>
        {/* Fil d'Ariane */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
          <Link 
            color="inherit" 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              navigate('/admin');
            }}
          >
            Administration
          </Link>
          <Typography color="text.primary">Paramètres du Monitoring</Typography>
        </Breadcrumbs>
        
        {/* Afficher les alertes */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Paramètres sauvegardés avec succès.
          </Alert>
        )}
        
        {/* Contenu principal */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab icon={<Settings />} label="APIS" />
            <Tab icon={<Notifications />} label="NOTIFICATIONS" />
            <Tab icon={<Refresh />} label="PLANIFICATION" />
            <Tab icon={<Security />} label="SEUILS" />
          </Tabs>
          
          {loading && <LinearProgress />}
          
          <Box sx={{ p: 3 }}>
            {/* Onglet Configuration des API */}
            {activeTab === 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Configuration des API</Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<Add />}
                    onClick={handleAddApiConfig}
                  >
                    Ajouter une API
                  </Button>
                </Box>
                
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Nom</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Limite Quotidienne</TableCell>
                        <TableCell align="center">Actif</TableCell>
                        <TableCell align="center">Monitoring</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {apiConfigs.map((config) => (
                        <TableRow key={config.name}>
                          <TableCell>{config.name}</TableCell>
                          <TableCell>{config.description}</TableCell>
                          <TableCell align="right">{config.dailyLimit}</TableCell>
                          <TableCell align="center">
                            <Switch 
                              checked={config.isActive} 
                              onChange={(e) => {
                                setApiConfigs(apiConfigs.map(c => 
                                  c.name === config.name ? { ...c, isActive: e.target.checked } : c
                                ));
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Switch 
                              checked={config.monitoringEnabled} 
                              onChange={(e) => {
                                setApiConfigs(apiConfigs.map(c => 
                                  c.name === config.name ? { ...c, monitoringEnabled: e.target.checked } : c
                                ));
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton 
                              color="primary"
                              onClick={() => handleEditApiConfig(config)}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton 
                              color="error"
                              onClick={() => handleDeleteApiConfig(config.name)}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
            
            {/* Onglet Notifications */}
            {activeTab === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>Paramètres de Notification</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          <Email sx={{ verticalAlign: 'middle', mr: 1 }} />
                          Notifications par Email
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch 
                              checked={notificationSettings.emailEnabled}
                              onChange={(e) => setNotificationSettings({
                                ...notificationSettings,
                                emailEnabled: e.target.checked
                              })}
                            />
                          }
                          label="Activer les notifications par email"
                        />
                        <TextField
                          label="Destinataires des emails"
                          fullWidth
                          margin="normal"
                          helperText="Séparez plusieurs adresses par des virgules"
                          value={notificationSettings.emailRecipients}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            emailRecipients: e.target.value
                          })}
                          disabled={!notificationSettings.emailEnabled}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          <Notifications sx={{ verticalAlign: 'middle', mr: 1 }} />
                          Notifications par SMS
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch 
                              checked={notificationSettings.smsEnabled}
                              onChange={(e) => setNotificationSettings({
                                ...notificationSettings,
                                smsEnabled: e.target.checked
                              })}
                            />
                          }
                          label="Activer les notifications par SMS"
                        />
                        <TextField
                          label="Numéros de téléphone"
                          fullWidth
                          margin="normal"
                          helperText="Séparez plusieurs numéros par des virgules"
                          value={notificationSettings.smsRecipients}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            smsRecipients: e.target.value
                          })}
                          disabled={!notificationSettings.smsEnabled}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Notifications Slack
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch 
                              checked={notificationSettings.slackEnabled}
                              onChange={(e) => setNotificationSettings({
                                ...notificationSettings,
                                slackEnabled: e.target.checked
                              })}
                            />
                          }
                          label="Activer les notifications Slack"
                        />
                        <TextField
                          label="URL du Webhook Slack"
                          fullWidth
                          margin="normal"
                          value={notificationSettings.slackWebhook}
                          onChange={(e) => setNotificationSettings({
                            ...notificationSettings,
                            slackWebhook: e.target.value
                          })}
                          disabled={!notificationSettings.slackEnabled}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* Onglet Planification */}
            {activeTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>Paramètres de Planification</Typography>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Les expressions de planification utilisent la syntaxe CRON. Format: <code>minute heure jour-du-mois mois jour-de-la-semaine</code>
                </Alert>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Rapport Quotidien"
                      fullWidth
                      margin="normal"
                      value={scheduleSettings.dailyReport}
                      onChange={(e) => setScheduleSettings({
                        ...scheduleSettings,
                        dailyReport: e.target.value
                      })}
                      helperText="Ex: 0 8 * * * (tous les jours à 8h)"
                    />
                    <TextField
                      label="Rapport Hebdomadaire"
                      fullWidth
                      margin="normal"
                      value={scheduleSettings.weeklyReport}
                      onChange={(e) => setScheduleSettings({
                        ...scheduleSettings,
                        weeklyReport: e.target.value
                      })}
                      helperText="Ex: 0 9 * * 1 (tous les lundis à 9h)"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Rapport Mensuel"
                      fullWidth
                      margin="normal"
                      value={scheduleSettings.monthlyReport}
                      onChange={(e) => setScheduleSettings({
                        ...scheduleSettings,
                        monthlyReport: e.target.value
                      })}
                      helperText="Ex: 0 10 1 * * (le 1er du mois à 10h)"
                    />
                    <TextField
                      label="Intervalle de Monitoring"
                      fullWidth
                      margin="normal"
                      value={scheduleSettings.monitoringInterval}
                      onChange={(e) => setScheduleSettings({
                        ...scheduleSettings,
                        monitoringInterval: e.target.value
                      })}
                      helperText="Ex: 0 */6 * * * (toutes les 6 heures)"
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* Onglet Seuils */}
            {activeTab === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom>Paramètres de Seuil</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>Seuils de Quota</Typography>
                        <TextField
                          label="Seuil d'avertissement"
                          fullWidth
                          margin="normal"
                          type="number"
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          }}
                          value={thresholdSettings.quotaWarning}
                          onChange={(e) => setThresholdSettings({
                            ...thresholdSettings,
                            quotaWarning: parseInt(e.target.value, 10) || 0
                          })}
                          helperText="Déclencher un avertissement quand le quota atteint ce pourcentage"
                        />
                        <TextField
                          label="Seuil critique"
                          fullWidth
                          margin="normal"
                          type="number"
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          }}
                          value={thresholdSettings.quotaCritical}
                          onChange={(e) => setThresholdSettings({
                            ...thresholdSettings,
                            quotaCritical: parseInt(e.target.value, 10) || 0
                          })}
                          helperText="Déclencher une alerte critique quand le quota atteint ce pourcentage"
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>Seuils de Temps de Réponse</Typography>
                        <TextField
                          label="Avertissement"
                          fullWidth
                          margin="normal"
                          type="number"
                          InputProps={{
                            endAdornment: <InputAdornment position="end">ms</InputAdornment>,
                          }}
                          value={thresholdSettings.responseTimeWarning}
                          onChange={(e) => setThresholdSettings({
                            ...thresholdSettings,
                            responseTimeWarning: parseInt(e.target.value, 10) || 0
                          })}
                          helperText="Déclencher un avertissement quand le temps de réponse dépasse cette valeur"
                        />
                        <TextField
                          label="Critique"
                          fullWidth
                          margin="normal"
                          type="number"
                          InputProps={{
                            endAdornment: <InputAdornment position="end">ms</InputAdornment>,
                          }}
                          value={thresholdSettings.responseTimeCritical}
                          onChange={(e) => setThresholdSettings({
                            ...thresholdSettings,
                            responseTimeCritical: parseInt(e.target.value, 10) || 0
                          })}
                          helperText="Déclencher une alerte critique quand le temps de réponse dépasse cette valeur"
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Save />}
                onClick={handleSaveSettings}
                disabled={loading}
              >
                Sauvegarder les Paramètres
              </Button>
            </Box>
          </Box>
        </Paper>
        
        {/* Boîte de dialogue pour l'ajout/modification d'une API */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editApiConfig && apiConfigs.find(config => config.name === editApiConfig.name)
              ? 'Modifier une API'
              : 'Ajouter une nouvelle API'
            }
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Nom de l'API"
                  fullWidth
                  margin="normal"
                  value={editApiConfig?.name || ''}
                  onChange={(e) => setEditApiConfig({
                    ...editApiConfig,
                    name: e.target.value
                  })}
                  required
                />
                <TextField
                  label="Description"
                  fullWidth
                  margin="normal"
                  value={editApiConfig?.description || ''}
                  onChange={(e) => setEditApiConfig({
                    ...editApiConfig,
                    description: e.target.value
                  })}
                />
                <TextField
                  label="Clé API (facultatif pour l'affichage)"
                  fullWidth
                  margin="normal"
                  value={editApiConfig?.key || ''}
                  onChange={(e) => setEditApiConfig({
                    ...editApiConfig,
                    key: e.target.value
                  })}
                  type="password"
                />
                <TextField
                  label="Limite quotidienne"
                  fullWidth
                  margin="normal"
                  type="number"
                  value={editApiConfig?.dailyLimit || 1000}
                  onChange={(e) => setEditApiConfig({
                    ...editApiConfig,
                    dailyLimit: parseInt(e.target.value, 10) || 0
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="URL de test"
                  fullWidth
                  margin="normal"
                  value={editApiConfig?.testEndpoint || ''}
                  onChange={(e) => setEditApiConfig({
                    ...editApiConfig,
                    testEndpoint: e.target.value
                  })}
                  helperText="Endpoint pour vérifier l'état de l'API"
                />
                <TextField
                  label="URL de rafraîchissement du token"
                  fullWidth
                  margin="normal"
                  value={editApiConfig?.refreshTokenUrl || ''}
                  onChange={(e) => setEditApiConfig({
                    ...editApiConfig,
                    refreshTokenUrl: e.target.value
                  })}
                  helperText="Pour les API OAuth (optionnel)"
                />
                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={editApiConfig?.isActive || false}
                        onChange={(e) => setEditApiConfig({
                          ...editApiConfig,
                          isActive: e.target.checked
                        })}
                      />
                    }
                    label="API active"
                  />
                </Box>
                <Box sx={{ mt: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={editApiConfig?.monitoringEnabled || false}
                        onChange={(e) => setEditApiConfig({
                          ...editApiConfig,
                          monitoringEnabled: e.target.checked
                        })}
                      />
                    }
                    label="Monitoring activé"
                  />
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
            <Button 
              onClick={handleSaveApiConfig} 
              variant="contained" 
              color="primary"
              disabled={!editApiConfig?.name}
            >
              Sauvegarder
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default AdminApiSettingsPage;
