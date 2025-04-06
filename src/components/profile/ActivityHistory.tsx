import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  CircularProgress,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Chip,
  Divider,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import TuneIcon from '@mui/icons-material/Tune';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DownloadIcon from '@mui/icons-material/Download';
import DateAdapter from '@mui/lab/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/lab';
import ActivityList from './activity/ActivityList';
import ActivityMap from './activity/ActivityMap';
import ActivityStatistics from './activity/ActivityStatistics';
import ActivityFilters from './activity/ActivityFilters';
import { APIOrchestrator } from '../../api/orchestration/APIOrchestrator';
import { Activity, ActivityFilter } from '../../types';

const apiOrchestrator = new APIOrchestrator();

interface ActivityHistoryProps {
  userId: string;
}

const ActivityHistory: React.FC<ActivityHistoryProps> = ({ userId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState<boolean>(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeFrame, setTimeFrame] = useState<string>('month');
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [activityTypes, setActivityTypes] = useState<string[]>([]);
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const [currentFilters, setCurrentFilters] = useState<ActivityFilter>({
    startDate: startDate ? startDate.toISOString() : undefined,
    endDate: endDate ? endDate.toISOString() : undefined,
    activityTypes: [],
    minDistance: undefined,
    maxDistance: undefined,
    minElevation: undefined,
    maxElevation: undefined,
    minDuration: undefined,
    maxDuration: undefined,
    regions: [],
    searchQuery: ''
  });

  // Charger les activités de l'utilisateur
  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiOrchestrator.getUserActivities(userId, currentFilters);
      setActivities(data);
      setFilteredActivities(data);
      
      // Extraire tous les types d'activités uniques
      const types = [...new Set(data.map(activity => activity.type))];
      setActivityTypes(types);
      
      // Calculer les statistiques
      calculateStatistics(data);
      
      // Générer des métriques de performance
      generatePerformanceMetrics(data);
    } catch (error) {
      console.error('Erreur lors du chargement des activités', error);
    } finally {
      setLoading(false);
    }
  }, [userId, currentFilters]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Générer des métriques de performance à partir des activités
  const generatePerformanceMetrics = (activities: Activity[]) => {
    // Grouper les activités par mois
    const groupedByMonth: { [key: string]: Activity[] } = {};
    
    activities.forEach(activity => {
      const date = new Date(activity.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!groupedByMonth[monthKey]) {
        groupedByMonth[monthKey] = [];
      }
      
      groupedByMonth[monthKey].push(activity);
    });
    
    // Calculer les métriques mensuelles
    const metrics = Object.keys(groupedByMonth).sort().map(month => {
      const monthActivities = groupedByMonth[month];
      const totalDistance = monthActivities.reduce((sum, act) => sum + (act.distance || 0), 0);
      const totalElevation = monthActivities.reduce((sum, act) => sum + (act.elevation || 0), 0);
      const totalDuration = monthActivities.reduce((sum, act) => sum + (act.duration || 0), 0);
      
      // Format: YYYY-MM -> MM/YYYY
      const [year, monthNum] = month.split('-');
      const displayMonth = `${monthNum}/${year}`;
      
      return {
        month: displayMonth,
        distance: parseFloat((totalDistance / 1000).toFixed(1)), // km
        elevation: totalElevation, // m
        duration: parseFloat((totalDuration / 3600).toFixed(1)), // hours
        count: monthActivities.length
      };
    });
    
    setPerformanceMetrics(metrics);
  };

  // Calculer les statistiques globales des activités
  const calculateStatistics = (activities: Activity[]) => {
    if (activities.length === 0) {
      setStatistics(null);
      return;
    }
    
    const totalDistance = activities.reduce((sum, act) => sum + (act.distance || 0), 0);
    const totalElevation = activities.reduce((sum, act) => sum + (act.elevation || 0), 0);
    const totalDuration = activities.reduce((sum, act) => sum + (act.duration || 0), 0);
    
    // Grouper par type d'activité
    const byType: { [key: string]: { count: number; distance: number; elevation: number } } = {};
    activities.forEach(activity => {
      if (!byType[activity.type]) {
        byType[activity.type] = { count: 0, distance: 0, elevation: 0 };
      }
      
      byType[activity.type].count += 1;
      byType[activity.type].distance += activity.distance || 0;
      byType[activity.type].elevation += activity.elevation || 0;
    });
    
    // Statistiques par région
    const byRegion: { [key: string]: number } = {};
    activities.forEach(activity => {
      if (activity.region) {
        if (!byRegion[activity.region]) {
          byRegion[activity.region] = 0;
        }
        
        byRegion[activity.region] += 1;
      }
    });
    
    setStatistics({
      totalActivities: activities.length,
      totalDistance,
      totalElevation,
      totalDuration,
      byType,
      byRegion,
      averageDistance: totalDistance / activities.length,
      averageElevation: totalElevation / activities.length,
      averageDuration: totalDuration / activities.length
    });
  };

  // Mettre à jour les filtres et recharger les activités
  const updateFilters = (newFilters: Partial<ActivityFilter>) => {
    const updatedFilters = { ...currentFilters, ...newFilters };
    setCurrentFilters(updatedFilters);
    
    // Si le filtre de recherche a changé, filtrer les activités en local
    if ('searchQuery' in newFilters && activities.length > 0) {
      filterActivitiesLocally(updatedFilters);
    }
  };

  // Filtrer les activités localement (pour la recherche rapide)
  const filterActivitiesLocally = (filters: ActivityFilter) => {
    if (!filters.searchQuery && filters.activityTypes?.length === 0) {
      setFilteredActivities(activities);
      return;
    }
    
    let filtered = [...activities];
    
    // Filtrer par terme de recherche
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(activity => 
        (activity.name && activity.name.toLowerCase().includes(query)) ||
        (activity.description && activity.description.toLowerCase().includes(query)) ||
        (activity.location && activity.location.toLowerCase().includes(query)) ||
        (activity.region && activity.region.toLowerCase().includes(query))
      );
    }
    
    // Filtrer par type d'activité
    if (filters.activityTypes && filters.activityTypes.length > 0) {
      filtered = filtered.filter(activity => 
        filters.activityTypes.includes(activity.type)
      );
    }
    
    setFilteredActivities(filtered);
    calculateStatistics(filtered);
    generatePerformanceMetrics(filtered);
  };

  // Exporter les activités filtrées
  const exportActivities = async (format: 'csv' | 'json' | 'gpx') => {
    try {
      const result = await apiOrchestrator.exportUserActivities(userId, format, currentFilters);
      
      if (result.downloadUrl) {
        // Créer un lien temporaire pour télécharger le fichier
        const a = document.createElement('a');
        a.href = result.downloadUrl;
        a.download = `activities_export_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error(`Erreur lors de l'exportation des activités en ${format}`, error);
    }
  };

  // Gérer le changement d'onglet
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Gérer la sélection d'une activité
  const handleActivitySelect = (activity: Activity) => {
    setSelectedActivity(activity);
  };

  // Gérer le changement de période
  const handleTimeFrameChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as string;
    setTimeFrame(value);
    
    // Mettre à jour les dates en fonction de la période sélectionnée
    const endDate = new Date();
    let startDate = new Date();
    
    switch (value) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'all':
        startDate = null;
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 1);
    }
    
    setStartDate(startDate);
    setEndDate(endDate);
    
    // Mettre à jour les filtres
    updateFilters({
      startDate: startDate ? startDate.toISOString() : undefined,
      endDate: endDate.toISOString()
    });
  };

  // Gérer la recherche
  const handleSearch = () => {
    updateFilters({ searchQuery });
  };

  // Afficher le loader pendant le chargement
  if (loading && activities.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom>
        Historique d'activités
      </Typography>
      
      {/* En-tête avec filtres et recherche */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Rechercher une activité..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearch} size="small">
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="time-frame-label">Période</InputLabel>
              <Select
                labelId="time-frame-label"
                value={timeFrame}
                label="Période"
                onChange={handleTimeFrameChange}
              >
                <MenuItem value="week">7 derniers jours</MenuItem>
                <MenuItem value="month">30 derniers jours</MenuItem>
                <MenuItem value="quarter">3 derniers mois</MenuItem>
                <MenuItem value="year">12 derniers mois</MenuItem>
                <MenuItem value="all">Tout l'historique</MenuItem>
                <MenuItem value="custom">Période personnalisée</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            {timeFrame === 'custom' && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <LocalizationProvider dateAdapter={DateAdapter}>
                  <DatePicker
                    label="De"
                    value={startDate}
                    onChange={(newValue) => {
                      setStartDate(newValue);
                      if (newValue) {
                        updateFilters({ startDate: newValue.toISOString() });
                      }
                    }}
                    renderInput={(params) => <TextField {...params} size="small" />}
                  />
                  
                  <DatePicker
                    label="À"
                    value={endDate}
                    onChange={(newValue) => {
                      setEndDate(newValue);
                      if (newValue) {
                        updateFilters({ endDate: newValue.toISOString() });
                      }
                    }}
                    renderInput={(params) => <TextField {...params} size="small" />}
                  />
                </LocalizationProvider>
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Tooltip title="Filtres avancés">
              <Button
                variant={showFilters ? "contained" : "outlined"}
                startIcon={<FilterListIcon />}
                onClick={() => setShowFilters(!showFilters)}
              >
                Filtres
              </Button>
            </Tooltip>
            
            <Tooltip title="Exporter">
              <IconButton onClick={() => exportActivities('csv')}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
        
        {/* Filtres avancés */}
        {showFilters && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ my: 2 }} />
            <ActivityFilters 
              filters={currentFilters}
              activityTypes={activityTypes}
              onUpdateFilters={updateFilters}
              onApplyFilters={loadActivities}
            />
          </Box>
        )}
        
        {/* Résumé des filtres actifs */}
        {(currentFilters.activityTypes?.length > 0 || 
          currentFilters.regions?.length > 0 || 
          currentFilters.searchQuery) && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {currentFilters.activityTypes?.map(type => (
              <Chip 
                key={type} 
                label={type} 
                onDelete={() => {
                  const updatedTypes = currentFilters.activityTypes?.filter(t => t !== type) || [];
                  updateFilters({ activityTypes: updatedTypes });
                }}
              />
            ))}
            
            {currentFilters.regions?.map(region => (
              <Chip 
                key={region} 
                label={region} 
                onDelete={() => {
                  const updatedRegions = currentFilters.regions?.filter(r => r !== region) || [];
                  updateFilters({ regions: updatedRegions });
                }}
              />
            ))}
            
            {currentFilters.searchQuery && (
              <Chip 
                label={`Recherche: ${currentFilters.searchQuery}`} 
                onDelete={() => {
                  setSearchQuery('');
                  updateFilters({ searchQuery: '' });
                }}
              />
            )}
            
            {(currentFilters.minDistance || currentFilters.maxDistance) && (
              <Chip 
                label={`Distance: ${currentFilters.minDistance || 0} - ${currentFilters.maxDistance || '∞'} km`} 
                onDelete={() => updateFilters({ minDistance: undefined, maxDistance: undefined })}
              />
            )}
            
            {(currentFilters.minElevation || currentFilters.maxElevation) && (
              <Chip 
                label={`Dénivelé: ${currentFilters.minElevation || 0} - ${currentFilters.maxElevation || '∞'} m`} 
                onDelete={() => updateFilters({ minElevation: undefined, maxElevation: undefined })}
              />
            )}
            
            <Button 
              size="small" 
              variant="outlined" 
              onClick={() => {
                setCurrentFilters({
                  startDate: startDate ? startDate.toISOString() : undefined,
                  endDate: endDate ? endDate.toISOString() : undefined,
                  activityTypes: [],
                  minDistance: undefined,
                  maxDistance: undefined,
                  minElevation: undefined,
                  maxElevation: undefined,
                  minDuration: undefined,
                  maxDuration: undefined,
                  regions: [],
                  searchQuery: ''
                });
                setSearchQuery('');
                loadActivities();
              }}
            >
              Réinitialiser
            </Button>
          </Box>
        )}
      </Paper>
      
      {/* Statistiques globales */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom align="center">
                  Activités
                </Typography>
                <Typography variant="h4" color="primary" align="center">
                  {statistics.totalActivities}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom align="center">
                  Distance
                </Typography>
                <Typography variant="h4" color="primary" align="center">
                  {(statistics.totalDistance / 1000).toFixed(0)} km
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom align="center">
                  Dénivelé
                </Typography>
                <Typography variant="h4" color="primary" align="center">
                  {statistics.totalElevation.toFixed(0)} m
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom align="center">
                  Durée
                </Typography>
                <Typography variant="h4" color="primary" align="center">
                  {(statistics.totalDuration / 3600).toFixed(0)} h
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Onglets pour les différentes vues */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons={isMobile ? "auto" : undefined}
        >
          <Tab label="Activités" />
          <Tab label="Statistiques" />
          <Tab label="Carte" />
          <Tab label="Tendances" />
        </Tabs>
        
        <Box sx={{ p: 2 }}>
          {/* Onglet Liste d'activités */}
          {activeTab === 0 && (
            <ActivityList 
              activities={filteredActivities} 
              onSelectActivity={handleActivitySelect}
              selectedActivity={selectedActivity}
            />
          )}
          
          {/* Onglet Statistiques */}
          {activeTab === 1 && (
            <ActivityStatistics 
              activities={filteredActivities}
              statistics={statistics}
            />
          )}
          
          {/* Onglet Carte */}
          {activeTab === 2 && (
            <ActivityMap 
              activities={filteredActivities}
              selectedActivity={selectedActivity}
              onSelectActivity={handleActivitySelect}
            />
          )}
          
          {/* Onglet Tendances */}
          {activeTab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Évolution de vos performances
              </Typography>
              
              {performanceMetrics.length > 0 ? (
                <Box sx={{ height: 400, mt: 3 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={performanceMetrics}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <ChartTooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="distance"
                        name="Distance (km)"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="elevation"
                        name="Dénivelé (m)"
                        stroke="#82ca9d"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
                  Pas assez de données pour afficher les tendances
                </Typography>
              )}
              
              {performanceMetrics.length > 0 && (
                <Box sx={{ height: 300, mt: 4 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Nombre d'activités par mois
                  </Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={performanceMetrics}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip />
                      <Bar
                        dataKey="count"
                        name="Nombre d'activités"
                        fill="#8884d8"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ActivityHistory;
