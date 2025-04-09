/**
 * WindForecast Component
 * 
 * Displays detailed wind forecasts for cyclists
 * Shows wind speed, direction, and gusts over time
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardHeader, 
  CardContent, 
  Typography, 
  Divider, 
  Grid, 
  Skeleton,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import { 
  Air, 
  Refresh, 
  WaterDrop, 
  ArrowUpward,
  Warning,
  CalendarViewDay,
  CalendarViewWeek,
  Info 
} from '@mui/icons-material';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import WindyService from '../../services/weather/windy-service';
import { WindForecast as WindForecastType, GeoLocation } from '../../services/weather/types/wind-types';
import { ENV } from '../../config/environment';
import WindAlert from './WindAlert';

// Custom arrow component for wind direction
const WindArrow: React.FC<{ direction: number, color?: string, size?: number }> = ({ 
  direction, 
  color = '#1976d2', 
  size = 24 
}) => {
  const rotationStyle = {
    transform: `rotate(${direction}deg)`,
    display: 'inline-block',
    width: size,
    height: size,
    color
  };
  
  return (
    <Box sx={rotationStyle}>
      <ArrowUpward style={{ width: '100%', height: '100%' }} />
    </Box>
  );
};

// Default Windy configuration
const DEFAULT_CONFIG = {
  apiKey: ENV.weather?.windy?.apiKey || process.env.WINDY_PLUGINS_API || '',
  cacheDuration: 1800,
  alertThresholds: {
    warning: 30,
    danger: 45
  }
};

interface WindForecastProps {
  location: GeoLocation;
  colId?: string;
  days?: number;
  initialView?: 'hourly' | 'daily';
  compact?: boolean;
  showAlert?: boolean;
  onWarning?: (warning: any) => void;
  className?: string;
}

const WindForecast: React.FC<WindForecastProps> = ({
  location,
  colId,
  days = 3,
  initialView = 'hourly',
  compact = false,
  showAlert = true,
  onWarning,
  className
}) => {
  const theme = useTheme();
  const [forecast, setForecast] = useState<WindForecastType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [windyService] = useState<WindyService>(() => new WindyService(DEFAULT_CONFIG));
  const [view, setView] = useState<'hourly' | 'daily'>(initialView);
  
  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await windyService.getWindForecast(location, days);
      setForecast(data);
    } catch (err) {
      console.error('[WindForecast] Error fetching forecast:', err);
      setError('Impossible de charger les prévisions de vent');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchForecast();
  }, [location, days]);
  
  const handleRefresh = () => {
    fetchForecast();
  };
  
  const handleViewChange = (event: React.SyntheticEvent, newValue: 'hourly' | 'daily') => {
    setView(newValue);
  };
  
  // Helper function to determine wind intensity color
  const getWindColor = (speed: number) => {
    if (speed >= DEFAULT_CONFIG.alertThresholds.danger) return theme.palette.error.main;
    if (speed >= DEFAULT_CONFIG.alertThresholds.warning) return theme.palette.warning.main;
    if (speed >= 20) return theme.palette.info.main;
    return theme.palette.success.main;
  };
  
  // Format X-axis labels
  const formatXAxis = (tickItem: string) => {
    try {
      const date = parseISO(tickItem);
      return format(date, view === 'hourly' ? 'HH:mm' : 'dd MMM', { locale: fr });
    } catch (e) {
      return tickItem;
    }
  };
  
  // Custom tooltip for wind data
  const WindTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    
    try {
      const date = parseISO(label);
      const formattedDate = format(
        date, 
        view === 'hourly' ? 'EEEE d MMM, HH:mm' : 'EEEE d MMMM yyyy', 
        { locale: fr }
      );
      
      const data = payload[0].payload;
      
      return (
        <Card sx={{ p: 1, maxWidth: 250 }}>
          <Typography variant="subtitle2">{formattedDate}</Typography>
          <Divider sx={{ my: 0.5 }} />
          
          {view === 'hourly' ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', my: 0.5 }}>
                <Air fontSize="small" sx={{ mr: 1, color: getWindColor(data.speed) }} />
                <Typography variant="body2">
                  Vent: <strong>{data.speed} km/h</strong>
                </Typography>
                <WindArrow 
                  direction={data.direction} 
                  size={16} 
                  color={getWindColor(data.speed)}
                />
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', my: 0.5 }}>
                <WaterDrop fontSize="small" sx={{ mr: 1, color: theme.palette.info.main }} />
                <Typography variant="body2">
                  Rafales: <strong>{data.gust} km/h</strong>
                </Typography>
              </Box>
            </>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', my: 0.5 }}>
                <Air fontSize="small" sx={{ mr: 1, color: getWindColor(data.max) }} />
                <Typography variant="body2">
                  Max: <strong>{data.max} km/h</strong>
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', my: 0.5 }}>
                <Air fontSize="small" sx={{ mr: 1, color: getWindColor(data.min) }} />
                <Typography variant="body2">
                  Min: <strong>{data.min} km/h</strong>
                </Typography>
                <WindArrow 
                  direction={data.avgDirection} 
                  size={16} 
                  color={getWindColor(data.max)}
                />
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', my: 0.5 }}>
                <WaterDrop fontSize="small" sx={{ mr: 1, color: theme.palette.info.main }} />
                <Typography variant="body2">
                  Rafales max: <strong>{data.maxGust} km/h</strong>
                </Typography>
              </Box>
            </>
          )}
        </Card>
      );
    } catch (e) {
      return null;
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader 
          title={
            <Skeleton variant="text" width="60%" />
          }
          action={
            <Skeleton variant="circular" width={40} height={40} />
          }
        />
        <CardContent>
          <Skeleton variant="rectangular" height={200} />
        </CardContent>
      </Card>
    );
  }
  
  // Render error state
  if (error || !forecast) {
    return (
      <Card className={className}>
        <CardHeader 
          title="Prévisions de vent"
          action={
            <IconButton onClick={handleRefresh}>
              <Refresh />
            </IconButton>
          }
        />
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
            <Warning color="error" sx={{ mb: 1, fontSize: 40 }} />
            <Typography variant="body1" color="error">
              {error || "Données non disponibles"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Vérifiez votre connexion internet ou réessayez plus tard.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }
  
  const safetyStatus = forecast.current.speed >= DEFAULT_CONFIG.alertThresholds.warning || 
                       forecast.current.gust >= DEFAULT_CONFIG.alertThresholds.warning + 10;
  
  return (
    <Card className={className}>
      {showAlert && safetyStatus && (
        <WindAlert 
          colId={colId}
          location={location}
          onWarning={onWarning}
          variant="compact"
          position="inline"
        />
      )}
      
      <CardHeader 
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Air sx={{ mr: 1 }} />
            <Typography variant="h6" component="div">
              Prévisions de vent
            </Typography>
            {!compact && forecast.current && (
              <Chip 
                icon={<Air />}
                label={`${forecast.current.speed} km/h`}
                size="small"
                color={
                  forecast.current.speed >= DEFAULT_CONFIG.alertThresholds.danger ? "error" :
                  forecast.current.speed >= DEFAULT_CONFIG.alertThresholds.warning ? "warning" :
                  "default"
                }
                sx={{ ml: 1 }}
              />
            )}
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {!compact && (
              <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                {format(new Date(forecast.updateTime), 'HH:mm', { locale: fr })}
              </Typography>
            )}
            <IconButton onClick={handleRefresh} size="small">
              <Refresh />
            </IconButton>
          </Box>
        }
        sx={{ pb: compact ? 0 : undefined }}
      />
      
      {!compact && (
        <Box sx={{ px: 2, pb: 0 }}>
          <Tabs 
            value={view} 
            onChange={handleViewChange}
            variant="fullWidth"
            sx={{ mb: 1 }}
          >
            <Tab 
              icon={<CalendarViewDay />} 
              label="Horaire" 
              value="hourly" 
              iconPosition="start"
            />
            <Tab 
              icon={<CalendarViewWeek />} 
              label="Journalier" 
              value="daily" 
              iconPosition="start"
            />
          </Tabs>
        </Box>
      )}
      
      <CardContent sx={{ pt: compact ? 0 : undefined }}>
        {/* Current wind conditions summary */}
        {!compact && forecast.current && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Vent</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h5">{forecast.current.speed}</Typography>
                    <Typography variant="body2" sx={{ ml: 0.5 }}>km/h</Typography>
                  </Box>
                  <WindArrow 
                    direction={forecast.current.direction} 
                    size={32} 
                    color={getWindColor(forecast.current.speed)}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Rafales</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h5">{forecast.current.gust}</Typography>
                    <Typography variant="body2" sx={{ ml: 0.5 }}>km/h</Typography>
                  </Box>
                  <Tooltip title="Rafales de vent maximum">
                    <Info fontSize="small" color="action" />
                  </Tooltip>
                </Box>
              </Grid>
              
              <Grid item xs={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Chip 
                    label={
                      forecast.current.speed >= DEFAULT_CONFIG.alertThresholds.danger ? "Danger" :
                      forecast.current.speed >= DEFAULT_CONFIG.alertThresholds.warning ? "Attention" :
                      "Favorable"
                    }
                    size="small"
                    color={
                      forecast.current.speed >= DEFAULT_CONFIG.alertThresholds.danger ? "error" :
                      forecast.current.speed >= DEFAULT_CONFIG.alertThresholds.warning ? "warning" :
                      "success"
                    }
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
          </Box>
        )}
        
        {/* Wind forecast chart */}
        <Box sx={{ width: '100%', height: compact ? 150 : 250 }}>
          <ResponsiveContainer width="100%" height="100%">
            {view === 'hourly' ? (
              <AreaChart
                data={forecast.hourly}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis 
                  dataKey="dateTime" 
                  tickFormatter={formatXAxis} 
                  stroke={theme.palette.text.secondary}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  tick={{ fontSize: 12 }}
                  domain={[0, 'auto']}
                />
                <RechartsTooltip content={<WindTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="gust" 
                  name="Rafales"
                  stroke={theme.palette.info.main} 
                  strokeWidth={1}
                  fill={theme.palette.info.light}
                  fillOpacity={0.2}
                />
                <Area 
                  type="monotone" 
                  dataKey="speed" 
                  name="Vent"
                  stroke={theme.palette.primary.main} 
                  fill={theme.palette.primary.light}
                  fillOpacity={0.4}
                />
              </AreaChart>
            ) : (
              <BarChart
                data={forecast.daily}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxis} 
                  stroke={theme.palette.text.secondary}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke={theme.palette.text.secondary}
                  tick={{ fontSize: 12 }}
                  domain={[0, 'auto']}
                />
                <RechartsTooltip content={<WindTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar 
                  dataKey="min" 
                  name="Min" 
                  fill={theme.palette.success.light} 
                  stackId="a"
                />
                <Bar 
                  dataKey="max" 
                  name="Max" 
                  fill={theme.palette.primary.main} 
                  stackId="b"
                />
                <Bar 
                  dataKey="maxGust" 
                  name="Rafales" 
                  fill={theme.palette.info.main} 
                  stackId="c"
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </Box>
        
        {/* Location info */}
        {!compact && location.name && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'right' }}>
            {location.name} • {location.lat.toFixed(2)}, {location.lon.toFixed(2)}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default WindForecast;
