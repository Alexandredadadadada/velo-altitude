import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Grid, Tabs, Tab, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import AirIcon from '@mui/icons-material/Air';
import OpacityIcon from '@mui/icons-material/Opacity';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import CloudIcon from '@mui/icons-material/Cloud';
import AcUnitIcon from '@mui/icons-material/AcUnit';

// Styled components
const WeatherCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
  transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
  '&:hover': {
    boxShadow: '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
    transform: 'translateY(-2px)'
  }
}));

// Weather icons based on condition code
const getWeatherIcon = (weatherCode) => {
  if (weatherCode >= 200 && weatherCode < 300) return <ThunderstormIcon sx={{ color: '#5C6BC0' }} />;
  if (weatherCode >= 300 && weatherCode < 600) return <OpacityIcon sx={{ color: '#42A5F5' }} />;
  if (weatherCode >= 600 && weatherCode < 700) return <AcUnitIcon sx={{ color: '#90CAF9' }} />;
  if (weatherCode >= 700 && weatherCode < 800) return <AirIcon sx={{ color: '#B0BEC5' }} />;
  if (weatherCode === 800) return <WbSunnyIcon sx={{ color: '#FFA726' }} />;
  return <CloudIcon sx={{ color: '#78909C' }} />;
};

const MiniWeatherMap = ({ onClose }) => {
  const { t } = useTranslation();
  const [popularCols, setPopularCols] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  // Fetch weather data for popular cols
  useEffect(() => {
    // Mock data - would be replaced by API call
    const mockData = [
      {
        id: '1',
        name: 'Col du Galibier',
        elevation: 2642,
        region: 'Alpes',
        weather: {
          current: {
            temp: 12,
            humidity: 65,
            wind_speed: 15,
            weather: [{ id: 800, main: 'Clear', description: 'clear sky' }]
          },
          forecast: [
            { temp: 14, weather: [{ id: 800 }], dt: Date.now() + 86400000 },  // tomorrow
            { temp: 13, weather: [{ id: 801 }], dt: Date.now() + 86400000 * 2 }, // day after
            { temp: 8, weather: [{ id: 500 }], dt: Date.now() + 86400000 * 3 }  // 3 days later
          ]
        }
      },
      {
        id: '2',
        name: 'Alpe d\'Huez',
        elevation: 1860,
        region: 'Alpes',
        weather: {
          current: {
            temp: 14,
            humidity: 58,
            wind_speed: 12,
            weather: [{ id: 801, main: 'Clouds', description: 'few clouds' }]
          },
          forecast: [
            { temp: 15, weather: [{ id: 800 }], dt: Date.now() + 86400000 },
            { temp: 16, weather: [{ id: 800 }], dt: Date.now() + 86400000 * 2 },
            { temp: 12, weather: [{ id: 500 }], dt: Date.now() + 86400000 * 3 }
          ]
        }
      },
      {
        id: '3',
        name: 'Mont Ventoux',
        elevation: 1909,
        region: 'Provence',
        weather: {
          current: {
            temp: 16,
            humidity: 45,
            wind_speed: 25, // windy!
            weather: [{ id: 800, main: 'Clear', description: 'clear sky' }]
          },
          forecast: [
            { temp: 18, weather: [{ id: 800 }], dt: Date.now() + 86400000 },
            { temp: 17, weather: [{ id: 801 }], dt: Date.now() + 86400000 * 2 },
            { temp: 15, weather: [{ id: 802 }], dt: Date.now() + 86400000 * 3 }
          ]
        }
      },
      {
        id: '4',
        name: 'Col du Tourmalet',
        elevation: 2115,
        region: 'Pyrénées',
        weather: {
          current: {
            temp: 10,
            humidity: 70,
            wind_speed: 8,
            weather: [{ id: 803, main: 'Clouds', description: 'broken clouds' }]
          },
          forecast: [
            { temp: 12, weather: [{ id: 802 }], dt: Date.now() + 86400000 },
            { temp: 11, weather: [{ id: 801 }], dt: Date.now() + 86400000 * 2 },
            { temp: 9, weather: [{ id: 500 }], dt: Date.now() + 86400000 * 3 }
          ]
        }
      }
    ];
    
    setPopularCols(mockData);
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  };

  if (popularCols.length === 0) {
    return (
      <Card sx={{ minWidth: 275, maxWidth: 350 }}>
        <CardContent>
          <Typography variant="h6">{t('loading')}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ minWidth: 275, maxWidth: 350 }}>
      <CardContent sx={{ padding: 2 }}>
        <Typography variant="h6" component="div" gutterBottom>
          {t('colsWeather')}
        </Typography>
        
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="cols weather tabs"
          sx={{ mb: 1, minHeight: '36px' }}
        >
          {popularCols.map((col, index) => (
            <Tab 
              key={col.id} 
              label={col.name.split(' ').slice(-1)[0]} 
              sx={{ 
                minHeight: '36px', 
                py: 0.5, 
                minWidth: 'auto', 
                fontSize: '0.8rem' 
              }} 
            />
          ))}
        </Tabs>
        
        <Divider sx={{ mb: 2 }} />
        
        {popularCols.map((col, index) => (
          <Box
            key={col.id}
            sx={{
              display: activeTab === index ? 'block' : 'none',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {col.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {col.elevation}m
              </Typography>
            </Box>
            
            <WeatherCard sx={{ mb: 2 }}>
              <Grid container alignItems="center">
                <Grid item xs={3} sx={{ textAlign: 'center' }}>
                  {getWeatherIcon(col.weather.current.weather[0].id)}
                </Grid>
                <Grid item xs={9}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h5" fontWeight="bold">
                      {col.weather.current.temp}°C
                    </Typography>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AirIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="caption">
                          {col.weather.current.wind_speed} km/h
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <OpacityIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="caption">
                          {col.weather.current.humidity}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {col.weather.current.weather[0].description}
                  </Typography>
                </Grid>
              </Grid>
            </WeatherCard>
            
            <Typography variant="subtitle2" gutterBottom>
              {t('forecast')}
            </Typography>
            
            <Grid container spacing={1}>
              {col.weather.forecast.map((day, idx) => (
                <Grid item xs={4} key={idx}>
                  <WeatherCard sx={{ textAlign: 'center', p: 1 }}>
                    <Typography variant="caption" display="block" gutterBottom>
                      {formatDate(day.dt)}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
                      {getWeatherIcon(day.weather[0].id)}
                    </Box>
                    <Typography variant="body2" fontWeight="medium">
                      {day.temp}°C
                    </Typography>
                  </WeatherCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};

export default MiniWeatherMap;
