import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Alert,
  Tooltip,
  IconButton,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Slider,
  InputAdornment,
  Skeleton,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import {
  Info as InfoIcon,
  Calculate as CalculateIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  FitnessCenter as FitnessCenterIcon
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar
} from 'recharts';
import FTPService from '../../services/FTPEstimationService';
import { useNotification } from '../common/NotificationSystem';

/**
 * Composant avancé de calcul et validation de FTP (Functional Threshold Power)
 * Permet de calculer la FTP par différentes méthodes et de visualiser les zones d'entraînement
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.userProfile - Profil utilisateur avec données cyclistes
 * @param {Function} props.onSaveFTP - Callback appelé lors de la sauvegarde d'une nouvelle FTP
 */
const FTPCalculator = ({ userProfile, onSaveFTP }) => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentFTP, setCurrentFTP] = useState(userProfile?.ftp || 200);
  const [powerZones, setPowerZones] = useState({});
  const [testResults, setTestResults] = useState({
    test20min: '',
    test8min: '',
    test5min: '',
    test1min: '',
    criticalPower: '',
    rampTest: {
      lastCompletedMinute: '',
      secondsInLastMinute: ''
    },
    hrBasedEstimation: {
      maxHR: '',
      restingHR: '',
      lactateThresholdHR: '',
      weight: userProfile?.weight || 70,
      vo2max: ''
    }
  });
  const [weightBasedEstimation, setWeightBasedEstimation] = useState({
    weight: userProfile?.weight || 70,
    level: userProfile?.level || 'intermediate'
  });
  const [manualFTP, setManualFTP] = useState(userProfile?.ftp || 200);
  const [ftpHistory, setFtpHistory] = useState([]);
  const [validationStatus, setValidationStatus] = useState({
    isValid: true,
    message: ''
  });

  // Charger les données initiales
  useEffect(() => {
    if (userProfile) {
      setCurrentFTP(userProfile.ftp || 200);
      setManualFTP(userProfile.ftp || 200);
      setWeightBasedEstimation({
        weight: userProfile.weight || 70,
        level: userProfile.level || 'intermediate'
      });
      
      // Générer les zones de puissance
      const zones = FTPService.calculatePowerZones(userProfile.ftp || 200);
      setPowerZones(zones);
      
      // Charger l'historique FTP
      loadFTPHistory();
    }
  }, [userProfile]);

  // Charger l'historique FTP
  const loadFTPHistory = useCallback(() => {
    setLoading(true);
    
    // Simuler un délai d'API
    setTimeout(() => {
      // Générer un historique fictif
      const today = new Date();
      const mockHistory = [
        { date: new Date(today.setMonth(today.getMonth() - 5)).toISOString().split('T')[0], value: 235, method: 'test20min' },
        { date: new Date(today.setMonth(today.getMonth() + 1)).toISOString().split('T')[0], value: 242, method: 'test20min' },
        { date: new Date(today.setMonth(today.getMonth() + 1)).toISOString().split('T')[0], value: 248, method: 'test8min' },
        { date: new Date(today.setMonth(today.getMonth() + 1)).toISOString().split('T')[0], value: 255, method: 'manual' },
        { date: new Date(today.setMonth(today.getMonth() + 1)).toISOString().split('T')[0], value: 260, method: 'test20min' }
      ];
      
      setFtpHistory(mockHistory);
      setLoading(false);
    }, 800);
  }, []);

  // Gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Gérer les changements dans les champs de test
  const handleTestInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Gérer les champs imbriqués
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setTestResults(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setTestResults(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }, []);

  // Gérer les changements dans l'estimation basée sur le poids
  const handleWeightEstimationChange = useCallback((e) => {
    const { name, value } = e.target;
    setWeightBasedEstimation(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Calculer la FTP à partir des résultats de test
  const calculateFTPFromTests = useCallback(() => {
    setLoading(true);
    let calculatedFTP = 0;
    let method = '';
    let isValid = true;
    let validationMessage = '';

    try {
      // Vérifier quels tests ont été complétés
      if (testResults.test20min) {
        // Calcul FTP basé sur test de 20 minutes (95% de la puissance moyenne)
        calculatedFTP = Math.round(parseFloat(testResults.test20min) * 0.95);
        method = 'test20min';
      } else if (testResults.test8min) {
        // Calcul FTP basé sur test de 8 minutes (90% de la puissance moyenne)
        calculatedFTP = Math.round(parseFloat(testResults.test8min) * 0.9);
        method = 'test8min';
      } else if (testResults.test5min && testResults.test1min) {
        // Calcul FTP basé sur CP (Critical Power)
        const CP = FTPService.calculateCriticalPower(
          parseFloat(testResults.test5min),
          300, // 5 minutes en secondes
          parseFloat(testResults.test1min),
          60 // 1 minute en secondes
        );
        calculatedFTP = Math.round(CP);
        method = 'cp';
      } else if (testResults.rampTest.lastCompletedMinute) {
        // Calcul FTP basé sur test rampe
        const lastMinute = parseInt(testResults.rampTest.lastCompletedMinute);
        const secondsInLastMinute = parseInt(testResults.rampTest.secondsInLastMinute) || 0;
        calculatedFTP = FTPService.calculateFTPFromRampTest(lastMinute, secondsInLastMinute);
        method = 'ramp';
      } else if (testResults.hrBasedEstimation.maxHR && 
                testResults.hrBasedEstimation.restingHR && 
                testResults.hrBasedEstimation.weight) {
        // Estimation basée sur la fréquence cardiaque
        const { maxHR, restingHR, lactateThresholdHR, weight, vo2max } = testResults.hrBasedEstimation;
        
        if (vo2max) {
          // Si VO2max est fourni, utiliser cette méthode
          calculatedFTP = FTPService.calculateFTPFromVO2max(
            parseFloat(vo2max),
            parseFloat(weight)
          );
        } else if (lactateThresholdHR) {
          // Si LTHR est fourni, utiliser cette méthode
          calculatedFTP = FTPService.calculateFTPFromLTHR(
            parseFloat(lactateThresholdHR),
            parseFloat(weight)
          );
        } else {
          // Sinon, estimer à partir des FC max et repos
          calculatedFTP = FTPService.estimateFTPFromHR(
            parseFloat(maxHR),
            parseFloat(restingHR),
            parseFloat(weight)
          );
        }
        
        method = 'hrBased';
      } else {
        isValid = false;
        validationMessage = t('noValidTestData');
      }
      
      // Validation supplémentaire
      if (calculatedFTP > 0) {
        if (calculatedFTP < 100) {
          isValid = false;
          validationMessage = t('ftpTooLow');
        } else if (calculatedFTP > 500) {
          isValid = false;
          validationMessage = t('ftpTooHigh');
        }
      } else {
        isValid = false;
        validationMessage = t('invalidCalculation');
      }
      
      setValidationStatus({
        isValid,
        message: validationMessage
      });
      
      if (isValid) {
        updateFTP(calculatedFTP, method);
      }
    } catch (err) {
      setValidationStatus({
        isValid: false,
        message: err.message || t('calculationError')
      });
    }
    
    setLoading(false);
  }, [testResults, t]);

  // Calculer la FTP à partir du poids
  const calculateFTPFromWeight = useCallback(() => {
    setLoading(true);
    
    try {
      const { weight, level } = weightBasedEstimation;
      const calculatedFTP = FTPService.estimateFTPFromWeight(
        parseFloat(weight),
        level
      );
      
      updateFTP(calculatedFTP, 'weightBased');
    } catch (err) {
      setValidationStatus({
        isValid: false,
        message: err.message || t('calculationError')
      });
    }
    
    setLoading(false);
  }, [weightBasedEstimation, t]);

  // Mettre à jour la FTP manuellement
  const updateManualFTP = useCallback(() => {
    const ftpValue = parseInt(manualFTP);
    
    if (ftpValue > 0) {
      updateFTP(ftpValue, 'manual');
    } else {
      setValidationStatus({
        isValid: false,
        message: t('invalidFTPValue')
      });
    }
  }, [manualFTP, t]);

  // Mettre à jour la FTP et les zones
  const updateFTP = useCallback((newFTP, method) => {
    setLoading(true);
    
    // Simuler un appel API
    setTimeout(() => {
      try {
        // Mettre à jour la FTP et recalculer les zones
        setCurrentFTP(newFTP);
        
        // Calculer les nouvelles zones de puissance
        const newPowerZones = FTPService.calculatePowerZones(newFTP);
        setPowerZones(newPowerZones);
        
        // Ajouter l'entrée à l'historique
        const today = new Date().toISOString().split('T')[0];
        const newHistoryEntry = {
          date: today,
          value: newFTP,
          method
        };
        
        setFtpHistory(prev => [
          ...prev.filter(entry => entry.date !== today || entry.method !== method),
          newHistoryEntry
        ].sort((a, b) => new Date(a.date) - new Date(b.date)));
        
        // Mettre à jour les états
        setValidationStatus({
          isValid: true,
          message: ''
        });
        
        // Notifier l'utilisateur du succès
        notify({
          type: 'success',
          message: `${t('ftpUpdatedSuccess')}: ${newFTP}W`
        });
        
        // Appeler le callback si fourni
        if (onSaveFTP) {
          onSaveFTP(newFTP, method);
        }
      } catch (err) {
        setValidationStatus({
          isValid: false,
          message: err.message || t('updateError')
        });
        
        notify({
          type: 'error',
          message: err.message || t('updateError')
        });
      }
      
      setLoading(false);
    }, 600);
  }, [notify, onSaveFTP, t]);

  // Générer les données pour le graphique des zones
  const generateZonesChartData = useCallback(() => {
    if (!powerZones || Object.keys(powerZones).length === 0) {
      return [];
    }
    
    return Object.entries(powerZones).map(([zone, range]) => ({
      zone: `Zone ${zone}`,
      min: range.min,
      max: range.max,
      range: range.max - range.min
    }));
  }, [powerZones]);

  // Générer les données pour le graphique d'historique
  const generateHistoryChartData = useCallback(() => {
    return ftpHistory.map(entry => ({
      date: entry.date,
      ftp: entry.value,
      method: t(`method_${entry.method}`) || entry.method
    }));
  }, [ftpHistory, t]);

  // Rendu des onglets
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Onglet Tests
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('testBasedEstimation')}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('testBasedEstimationDesc')}
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('test20minLabel')}
                  name="test20min"
                  value={testResults.test20min}
                  onChange={handleTestInputChange}
                  type="number"
                  fullWidth
                  margin="normal"
                  helperText={t('test20minHelp')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">W</InputAdornment>,
                  }}
                />
                
                <TextField
                  label={t('test8minLabel')}
                  name="test8min"
                  value={testResults.test8min}
                  onChange={handleTestInputChange}
                  type="number"
                  fullWidth
                  margin="normal"
                  helperText={t('test8minHelp')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">W</InputAdornment>,
                  }}
                />
                
                <TextField
                  label={t('test5minLabel')}
                  name="test5min"
                  value={testResults.test5min}
                  onChange={handleTestInputChange}
                  type="number"
                  fullWidth
                  margin="normal"
                  helperText={t('test5minHelp')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">W</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('test1minLabel')}
                  name="test1min"
                  value={testResults.test1min}
                  onChange={handleTestInputChange}
                  type="number"
                  fullWidth
                  margin="normal"
                  helperText={t('test1minHelp')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">W</InputAdornment>,
                  }}
                />
                
                <TextField
                  label={t('criticalPowerLabel')}
                  name="criticalPower"
                  value={testResults.criticalPower}
                  onChange={handleTestInputChange}
                  type="number"
                  fullWidth
                  margin="normal"
                  helperText={t('criticalPowerHelp')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">W</InputAdornment>,
                  }}
                />
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CalculateIcon />}
                    onClick={calculateFTPFromTests}
                    sx={{ mt: 2 }}
                  >
                    {t('calculateFTP')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );
        
      case 1: // Onglet Poids
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('weightBasedEstimation')}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('weightBasedEstimationDesc')}
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label={t('weightLabel')}
                  name="weight"
                  value={weightBasedEstimation.weight}
                  onChange={handleWeightEstimationChange}
                  type="number"
                  fullWidth
                  margin="normal"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="level-select-label">{t('levelLabel')}</InputLabel>
                  <Select
                    labelId="level-select-label"
                    name="level"
                    value={weightBasedEstimation.level}
                    label={t('levelLabel')}
                    onChange={handleWeightEstimationChange}
                  >
                    <MenuItem value="beginner">{t('beginner')}</MenuItem>
                    <MenuItem value="intermediate">{t('intermediate')}</MenuItem>
                    <MenuItem value="advanced">{t('advanced')}</MenuItem>
                    <MenuItem value="elite">{t('elite')}</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CalculateIcon />}
                    onClick={calculateFTPFromWeight}
                  >
                    {t('estimateFTP')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );
        
      case 2: // Onglet Manuel
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('manualFTPEntry')}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('manualFTPEntryDesc')}
            </Typography>
            
            <TextField
              label={t('ftpLabel')}
              value={manualFTP}
              onChange={(e) => setManualFTP(e.target.value)}
              type="number"
              fullWidth
              margin="normal"
              InputProps={{
                endAdornment: <InputAdornment position="end">W</InputAdornment>,
              }}
            />
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={updateManualFTP}
              >
                {t('saveFTP')}
              </Button>
            </Box>
          </Box>
        );
        
      case 3: // Onglet Historique
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('ftpHistory')}
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : (
              <LineChart
                width={500}
                height={300}
                data={generateHistoryChartData()}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ftp" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            )}
          </Box>
        );
        
      case 4: // Onglet Zones
        return (
          <Box sx={{ p: 2 }}>
            <Card 
              elevation={2}
              sx={{ 
                borderRadius: theme.shape.borderRadius,
                transition: theme.transitions.create(['box-shadow']),
                '&:hover': {
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {t('powerZonesTitle')}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body1" sx={{ mr: 1 }}>
                    {t('currentFTP')}:
                  </Typography>
                  <Typography variant="h6" color="primary.main" fontWeight="bold">
                    {currentFTP} W
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                {loading ? (
                  <Box sx={{ width: '100%' }}>
                    <Skeleton variant="rectangular" height={350} animation="wave" sx={{ mb: 2, borderRadius: 1 }} />
                    <Skeleton variant="rectangular" height={250} animation="wave" sx={{ borderRadius: 1 }} />
                  </Box>
                ) : Object.keys(powerZones).length > 0 ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Box sx={{ height: 350, position: 'relative' }} aria-label={t('powerZonesChart')}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={generateZonesChartData()}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 30,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                            <XAxis 
                              dataKey="zone"
                              tick={{ fill: theme.palette.text.secondary }}
                              axisLine={{ stroke: theme.palette.divider }}
                              tickLine={{ stroke: theme.palette.divider }}
                            />
                            <YAxis 
                              label={{ 
                                value: 'Power (W)', 
                                angle: -90, 
                                position: 'insideLeft',
                                fill: theme.palette.text.secondary,
                                style: { textAnchor: 'middle' }
                              }}
                              tick={{ fill: theme.palette.text.secondary }}
                              axisLine={{ stroke: theme.palette.divider }}
                              tickLine={{ stroke: theme.palette.divider }}
                            />
                            <Tooltip 
                              formatter={(value, name) => {
                                if (name === 'min') return [value + 'W', 'Min Power'];
                                if (name === 'max') return [value + 'W', 'Max Power'];
                                if (name === 'range') return [value + 'W', 'Range'];
                                return [value, name];
                              }}
                              contentStyle={{
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 4,
                                boxShadow: theme.shadows[3]
                              }}
                            />
                            <Legend 
                              formatter={(value) => {
                                return <span style={{ color: theme.palette.text.primary }}>{value}</span>;
                              }}
                            />
                            <Bar 
                              dataKey="min" 
                              fill={alpha(theme.palette.primary.main, 0.4)}
                              name="Min"
                              stackId="a"
                            />
                            <Bar 
                              dataKey="range" 
                              fill={theme.palette.primary.main}
                              name="Range"
                              stackId="a"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TableContainer 
                        component={Paper} 
                        elevation={1} 
                        sx={{ 
                          borderRadius: theme.shape.borderRadius,
                          '& .MuiTableCell-root': {
                            borderColor: theme.palette.divider
                          }
                        }}
                      >
                        <Table aria-label={t('powerZonesTableLabel')}>
                          <TableHead>
                            <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                              <TableCell sx={{ fontWeight: 'bold' }}>{t('zoneLabel')}</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>{t('powerRangeLabel')}</TableCell>
                              <TableCell sx={{ fontWeight: 'bold' }}>{t('descriptionLabel')}</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Object.entries(powerZones).map(([zone, range], index) => {
                              // Générer une couleur basée sur la zone (dégradé de l'intensité)
                              const zoneColor = index < 3 
                                ? theme.palette.success.main 
                                : index < 5 
                                  ? theme.palette.warning.main 
                                  : theme.palette.error.main;
                                  
                              return (
                                <TableRow 
                                  key={zone}
                                  hover
                                  sx={{ 
                                    '&:nth-of-type(odd)': {
                                      backgroundColor: alpha(theme.palette.common.black, 0.02),
                                    },
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                    }
                                  }}
                                >
                                  <TableCell component="th" scope="row">
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Box 
                                        sx={{ 
                                          width: 12, 
                                          height: 12, 
                                          borderRadius: '50%', 
                                          backgroundColor: zoneColor,
                                          mr: 1.5
                                        }} 
                                      />
                                      <Typography variant="body2" fontWeight="medium">
                                        {t(`zone${zone}Name`) || `Zone ${zone}`}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Typography variant="body2">
                                        {range.min} - {range.max} W
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                        ({Math.round(range.min / currentFTP * 100)}% - {Math.round(range.max / currentFTP * 100)}% FTP)
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {t(`zone${zone}Description`) || t('noZoneDescription')}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  </Grid>
                ) : (
                  <Alert 
                    severity="info" 
                    sx={{ 
                      borderRadius: theme.shape.borderRadius,
                      '& .MuiAlert-icon': {
                        display: 'flex',
                        alignItems: 'center',
                      }
                    }}
                  >
                    {t('noZonesCalculated')}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Box>
        );
        
      case 5: // Onglet Tests supplémentaires
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('additionalTests')}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('additionalTestsDesc')}
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  {t('rampTestLabel')}
                  <Tooltip title={t('rampTestTooltip')}>
                    <IconButton size="small" color="primary">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                
                <TextField
                  label={t('lastCompletedMinuteLabel')}
                  name="rampTest.lastCompletedMinute"
                  value={testResults.rampTest.lastCompletedMinute}
                  onChange={handleTestInputChange}
                  type="number"
                  fullWidth
                  margin="normal"
                  helperText={t('lastCompletedMinuteHelp')}
                />
                
                <TextField
                  label={t('secondsInLastMinuteLabel')}
                  name="rampTest.secondsInLastMinute"
                  value={testResults.rampTest.secondsInLastMinute}
                  onChange={handleTestInputChange}
                  type="number"
                  fullWidth
                  margin="normal"
                  helperText={t('secondsInLastMinuteHelp')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">s</InputAdornment>,
                  }}
                />
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  {t('hrBasedEstimationLabel')}
                  <Tooltip title={t('hrBasedEstimationTooltip')}>
                    <IconButton size="small" color="primary">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                
                <TextField
                  label={t('maxHRLabel')}
                  name="hrBasedEstimation.maxHR"
                  value={testResults.hrBasedEstimation.maxHR}
                  onChange={handleTestInputChange}
                  type="number"
                  fullWidth
                  margin="normal"
                  helperText={t('maxHRHelp')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">bpm</InputAdornment>,
                  }}
                />
                
                <TextField
                  label={t('restingHRLabel')}
                  name="hrBasedEstimation.restingHR"
                  value={testResults.hrBasedEstimation.restingHR}
                  onChange={handleTestInputChange}
                  type="number"
                  fullWidth
                  margin="normal"
                  helperText={t('restingHRHelp')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">bpm</InputAdornment>,
                  }}
                />
                
                <TextField
                  label={t('ltHRLabel')}
                  name="hrBasedEstimation.lactateThresholdHR"
                  value={testResults.hrBasedEstimation.lactateThresholdHR}
                  onChange={handleTestInputChange}
                  type="number"
                  fullWidth
                  margin="normal"
                  helperText={t('ltHRHelp')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">bpm</InputAdornment>,
                  }}
                />
                
                <TextField
                  label={t('vo2maxLabel')}
                  name="hrBasedEstimation.vo2max"
                  value={testResults.hrBasedEstimation.vo2max}
                  onChange={handleTestInputChange}
                  type="number"
                  fullWidth
                  margin="normal"
                  helperText={t('vo2maxHelp')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">ml/kg/min</InputAdornment>,
                  }}
                />
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CalculateIcon />}
                    onClick={calculateFTPFromTests}
                  >
                    {t('calculateFTP')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <Box 
      sx={{ 
        width: '100%', 
        height: '100%', 
        overflow: 'auto', 
        bgcolor: alpha(theme.palette.background.default, 0.5) 
      }}
      role="tabpanel"
      aria-labelledby="ftp-calculator-tabs"
    >
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: theme.shape.borderRadius,
          overflow: 'hidden',
          boxShadow: `0 0 10px ${alpha(theme.palette.common.black, 0.08)}`
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons={isMobile ? "auto" : false}
          aria-label={t('ftpCalculatorTabsLabel')}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              py: isMobile ? 1 : 1.5,
              minHeight: 'unset'
            }
          }}
        >
          <Tab 
            label={t('testBasedEstimation')} 
            id="ftp-tab-0"
            aria-controls="ftp-tabpanel-0"
            icon={<SpeedIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label={t('weightBasedEstimation')} 
            id="ftp-tab-1"
            aria-controls="ftp-tabpanel-1"
            icon={<FitnessCenterIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label={t('manualFTPEntry')} 
            id="ftp-tab-2"
            aria-controls="ftp-tabpanel-2"
            icon={<CalculateIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label={t('ftpHistory')} 
            id="ftp-tab-3"
            aria-controls="ftp-tabpanel-3"
            icon={<TimelineIcon />} 
            iconPosition="start" 
          />
          <Tab 
            label={t('powerZones')} 
            id="ftp-tab-4"
            aria-controls="ftp-tabpanel-4"
            icon={<InfoIcon />} 
            iconPosition="start" 
          />
        </Tabs>
        
        <Box
          role="tabpanel"
          id={`ftp-tabpanel-${activeTab}`}
          aria-labelledby={`ftp-tab-${activeTab}`}
        >
          {renderTabContent()}
        </Box>
      </Paper>
    </Box>
  );
};

FTPCalculator.propTypes = {
  userProfile: PropTypes.object,
  onSaveFTP: PropTypes.func
};

export default FTPCalculator;