import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Material UI
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
  Tab,
  Tabs,
  useMediaQuery,
  useTheme,
  Divider,
  CircularProgress
} from '@mui/material';

// Icons
import {
  FilterHdr,
  WbSunny,
  FitnessCenter,
  Restaurant,
  ThreeDRotation,
  DirectionsBike
} from '@mui/icons-material';

// Feature tabs data
const features = [
  {
    id: 'cols',
    label: 'Base de données de cols',
    icon: <FilterHdr />,
    title: 'Explorez plus de 3000 cols cyclables',
    description: 'Une collection complète de cols à travers le monde avec données d\'élévation, profils, difficulté et commentaires de la communauté.',
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    demo: 'map'
  },
  {
    id: 'meteo',
    label: 'Dashboard météo',
    icon: <WbSunny />,
    title: 'Prévisions météo spécifiques au cyclisme',
    description: 'Consultez les conditions météorologiques idéales pour vos sorties avec prévisions horaires, vent, précipitations et fenêtres optimales.',
    backgroundColor: '#e1f5fe',
    color: '#0288d1',
    demo: 'weather'
  },
  {
    id: 'entrainement',
    label: 'Entraînement',
    icon: <FitnessCenter />,
    title: 'Plans d\'entraînement personnalisés',
    description: 'Suivez votre progression avec des plans adaptés à votre profil et vos objectifs, incluant des séances spécifiques pour les cols.',
    backgroundColor: '#ffebee',
    color: '#d32f2f',
    demo: 'training'
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    icon: <Restaurant />,
    title: 'Nutrition optimisée pour le cyclisme',
    description: 'Planifiez votre alimentation avant, pendant et après l\'effort avec des recommandations personnalisées selon votre profil et vos objectifs.',
    backgroundColor: '#f3e5f5',
    color: '#7b1fa2',
    demo: 'nutrition'
  },
  {
    id: '3d',
    label: 'Visualisation 3D',
    icon: <ThreeDRotation />,
    title: 'Explorez les cols en 3D',
    description: 'Préparez votre ascension avec une visualisation réaliste en 3D des cols, virages et pentes pour mieux appréhender le terrain.',
    backgroundColor: '#e0f2f1',
    color: '#00695c',
    demo: '3d'
  }
];

// Col demonstration map
const ColMap = ({ animationComplexity = 'high' }) => {
  const mapContainerRef = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  useEffect(() => {
    // Initialize map only once
    if (!map.current && mapContainerRef.current) {
      // NOTE: In production, mapboxToken would be stored in environment variables
      // This is a placeholder that would be replaced with the actual token in deployment
      mapboxgl.accessToken = 'pk.MAPBOX_TOKEN_PLACEHOLDER';
      
      map.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/outdoors-v11',
        center: [6.1714, 46.1920], // Col de la Colombière coordinates
        zoom: 13,
        pitch: 60,
        bearing: 20,
        interactive: true,
        attributionControl: false
      });
      
      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Add marker at the col summit
      const markerEl = document.createElement('div');
      markerEl.className = 'col-marker';
      markerEl.style.width = '20px';
      markerEl.style.height = '20px';
      markerEl.style.borderRadius = '50%';
      markerEl.style.background = '#f44336';
      markerEl.style.border = '3px solid white';
      markerEl.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';
      
      new mapboxgl.Marker(markerEl)
        .setLngLat([6.1714, 46.1920])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML('<h3>Col de la Colombière</h3><p>Altitude: 1618m<br>Longueur: 16.3km<br>Dénivelé: 1100m<br>Pente moyenne: 6.8%</p>')
        )
        .addTo(map.current);
        
      // Add route line when map loads
      map.current.on('load', () => {
        setMapLoaded(true);
        
        if (animationComplexity !== 'low') {
          // Simulate route data - would be actual GPX data in production
          const route = {
            'type': 'Feature',
            'properties': {},
            'geometry': {
              'type': 'LineString',
              'coordinates': [
                [6.1414, 46.1620],
                [6.1514, 46.1720],
                [6.1614, 46.1820],
                [6.1714, 46.1920]
              ]
            }
          };
          
          map.current.addSource('route', {
            'type': 'geojson',
            'data': route
          });
          
          map.current.addLayer({
            'id': 'route',
            'type': 'line',
            'source': 'route',
            'layout': {
              'line-join': 'round',
              'line-cap': 'round'
            },
            'paint': {
              'line-color': '#f44336',
              'line-width': 6,
              'line-opacity': 0.8
            }
          });
          
          // Add hill shading for better terrain visualization
          map.current.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512
          });
          
          map.current.setTerrain({
            'source': 'mapbox-dem',
            'exaggeration': 1.5
          });
        }
      });
    }
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [animationComplexity]);
  
  return (
    <Box sx={{ position: 'relative', height: '400px', borderRadius: '8px', overflow: 'hidden' }}>
      <Box 
        ref={mapContainerRef} 
        sx={{ 
          width: '100%', 
          height: '100%',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: '8px'
        }}
      />
      
      {!mapLoaded && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.7)'
          }}
        >
          <CircularProgress />
        </Box>
      )}
      
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 1,
          background: 'rgba(255,255,255,0.9)',
          padding: '8px 16px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Col de la Colombière
        </Typography>
        <Typography variant="caption" sx={{ display: 'block' }}>
          Haute-Savoie, France
        </Typography>
      </Box>
    </Box>
  );
};

// Weather demonstration
const WeatherDemo = () => {
  return (
    <Box sx={{ height: '400px', background: '#e1f5fe', borderRadius: '8px', p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <WeatherCard $primary>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h6">Aujourd'hui</Typography>
                <Typography variant="body2">Col du Galibier</Typography>
              </Box>
              <WbSunny fontSize="large" />
            </Box>
            
            <Typography variant="h3" sx={{ mb: 1 }}>18°C</Typography>
            
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption">Vent</Typography>
                <Typography variant="body2">12 km/h NE</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption">Précipitations</Typography>
                <Typography variant="body2">0%</Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Idéal pour rouler</Typography>
            <Typography variant="caption">
              Conditions excellentes avec vent favorable et visibilité parfaite
            </Typography>
          </WeatherCard>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Grid container spacing={2} direction="column">
            <Grid item>
              <WeatherCard>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="subtitle2">Demain</Typography>
                    <Typography variant="h6">14°C</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <WbSunny fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="caption">Partiellement nuageux</Typography>
                  </Box>
                </Box>
              </WeatherCard>
            </Grid>
            
            <Grid item>
              <WeatherCard>
                <Typography variant="subtitle2">Prévision hebdomadaire</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'].map((day, i) => (
                    <Box key={day} sx={{ textAlign: 'center' }}>
                      <Typography variant="caption">{day}</Typography>
                      <Typography variant="body2">{14 + i}°</Typography>
                    </Box>
                  ))}
                </Box>
              </WeatherCard>
            </Grid>
            
            <Grid item>
              <WeatherCard>
                <Typography variant="subtitle2">Qualité de l'air</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" color="#4caf50">Bonne</Typography>
                    <Typography variant="caption">Idéal pour l'effort</Typography>
                  </Box>
                  <Typography variant="h4">92</Typography>
                </Box>
              </WeatherCard>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

// Training demonstration
const TrainingDemo = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Training zones data
  const trainingZones = [
    { id: 'z1', name: 'Zone 1', power: '< 55% FTP', description: 'Récupération active', color: '#81c784' },
    { id: 'z2', name: 'Zone 2', power: '56-75% FTP', description: 'Endurance', color: '#4caf50' },
    { id: 'z3', name: 'Zone 3', power: '76-90% FTP', description: 'Tempo', color: '#ffd54f' },
    { id: 'z4', name: 'Zone 4', power: '91-105% FTP', description: 'Seuil', color: '#ff9800' },
    { id: 'z5', name: 'Zone 5', power: '106-120% FTP', description: 'VO2 Max', color: '#f44336' },
    { id: 'z6', name: 'Zone 6', power: '> 120% FTP', description: 'Anaérobie', color: '#9c27b0' }
  ];
  
  return (
    <Box sx={{ height: '400px', background: '#ffebee', borderRadius: '8px', p: 2, overflow: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Plan d'entraînement personnalisé</Typography>
        <Typography variant="body2">
          Programme spécifique pour préparer le Col du Tourmalet
        </Typography>
      </Box>
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Zones d'entraînement</Typography>
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                flexWrap: 'wrap',
                gap: 1,
                mb: 2
              }}
            >
              {trainingZones.map(zone => (
                <Box 
                  key={zone.id}
                  sx={{ 
                    background: zone.color + '20',
                    border: `1px solid ${zone.color}`,
                    borderRadius: '4px',
                    padding: '8px 12px',
                    minWidth: isMobile ? 'auto' : '150px',
                    flex: isMobile ? 'none' : '1 0 30%'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: zone.color, fontWeight: 600 }}>
                    {zone.name}
                  </Typography>
                  <Typography variant="caption" display="block">
                    {zone.power}
                  </Typography>
                  <Typography variant="caption">
                    {zone.description}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, background: 'rgba(255,255,255,0.7)', borderRadius: '8px', height: '100%' }}>
            <Typography variant="subtitle2" gutterBottom>Séance d'aujourd'hui</Typography>
            
            <Box sx={{ mb: 1, borderLeft: '3px solid #f44336', pl: 2 }}>
              <Typography variant="body2" fontWeight={500}>
                Entraînement spécifique col
              </Typography>
              <Typography variant="caption" display="block">
                Durée: 1h30 • TSS: 95 • IF: 0.85
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="caption" display="block" sx={{ mb: 1 }}>
              Structure:
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Box sx={{ width: 12, height: 12, background: '#81c784', borderRadius: '2px', mt: 0.5 }} />
                <Typography variant="body2">15 min - Échauffement progressif</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Box sx={{ width: 12, height: 12, background: '#ff9800', borderRadius: '2px', mt: 0.5 }} />
                <Typography variant="body2">5 x 5min Seuil (Z4) / 2min récup</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Box sx={{ width: 12, height: 12, background: '#f44336', borderRadius: '2px', mt: 0.5 }} />
                <Typography variant="body2">3 x 3min VO2max (Z5) / 3min récup</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, background: '#81c784', borderRadius: '2px', mt: 0.5 }} />
                <Typography variant="body2">10 min - Retour au calme</Typography>
              </Box>
            </Box>
            
            <Button 
              variant="contained" 
              color="primary" 
              size="small"
              startIcon={<DirectionsBike />}
              sx={{ borderRadius: '50px' }}
            >
              Démarrer la séance
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Other demos would be similarly implemented

// Main component
const FeaturesShowcase = ({ animationComplexity = 'high' }) => {
  const [activeTab, setActiveTab] = useState('cols');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Animation controls
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });
  
  const controls = useAnimation();
  
  useEffect(() => {
    if (inView) {
      controls.start('visible');
    } else {
      if (animationComplexity !== 'low') {
        controls.start('hidden');
      }
    }
  }, [controls, inView, animationComplexity]);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Function to render the appropriate demo component
  const renderDemo = () => {
    switch (activeTab) {
      case 'cols':
        return <ColMap animationComplexity={animationComplexity} />;
      case 'meteo':
        return <WeatherDemo />;
      case 'entrainement':
        return <TrainingDemo />;
      case 'nutrition':
        return (
          <Box sx={{ height: '400px', background: '#f3e5f5', borderRadius: '8px', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography>Simulation nutritionnelle - Contenu à venir</Typography>
          </Box>
        );
      case '3d':
        return (
          <Box sx={{ height: '400px', background: '#e0f2f1', borderRadius: '8px', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography>Visualisation 3D - Contenu à venir</Typography>
          </Box>
        );
      default:
        return null;
    }
  };
  
  // Get current feature data
  const activeFeature = features.find(f => f.id === activeTab);
  
  return (
    <SectionWrapper id="features" $backgroundColor="#ffffff">
      <Container>
        <SectionTitle>
          <Typography 
            variant="h2" 
            component="h2" 
            sx={{ 
              fontSize: { xs: '2rem', md: '3rem' },
              fontWeight: 700,
              mb: 1
            }}
          >
            Fonctionnalités Phares
          </Typography>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 400,
              color: 'text.secondary',
              maxWidth: '800px',
              margin: '0 auto',
              mb: 5
            }}
          >
            Découvrez les outils puissants et intuitifs qui rendront votre expérience cycliste unique.
          </Typography>
        </SectionTitle>
        
        <Box sx={{ mb: 4 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons={isMobile ? "auto" : false}
            centered={!isMobile}
            textColor="primary"
            sx={{
              '& .MuiTabs-indicator': {
                height: 3,
              },
              mb: 4
            }}
          >
            {features.map(feature => (
              <Tab 
                key={feature.id}
                value={feature.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {feature.icon}
                    <span>{feature.label}</span>
                  </Box>
                }
                sx={{
                  minHeight: '72px',
                  textTransform: 'none',
                  fontWeight: 500
                }}
              />
            ))}
          </Tabs>
        </Box>
        
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={controls}
        >
          <Grid container spacing={4}>
            <Grid item xs={12} md={5}>
              <motion.div variants={itemVariants}>
                <FeatureCard $color={activeFeature?.color}>
                  <Typography 
                    variant="h4" 
                    component="h3" 
                    sx={{ 
                      mb: 2,
                      color: activeFeature?.color,
                      fontWeight: 700
                    }}
                  >
                    {activeFeature?.title}
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 3 }}>
                    {activeFeature?.description}
                  </Typography>
                  
                  <Button 
                    variant="contained" 
                    sx={{ 
                      backgroundColor: activeFeature?.color,
                      '&:hover': {
                        backgroundColor: activeFeature?.color + 'dd'
                      },
                      borderRadius: '50px',
                      px: 3
                    }}
                  >
                    Explorer cette fonctionnalité
                  </Button>
                </FeatureCard>
              </motion.div>
            </Grid>
            
            <Grid item xs={12} md={7}>
              <motion.div variants={itemVariants}>
                <Box 
                  sx={{ 
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
                  }}
                >
                  {renderDemo()}
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </SectionWrapper>
  );
};

// Styled Components
const SectionWrapper = styled.section`
  padding: 120px 0;
  background-color: ${props => props.$backgroundColor || '#ffffff'};
`;

const SectionTitle = styled.div`
  text-align: center;
  margin-bottom: 60px;
`;

const FeatureCard = styled(Paper)`
  padding: 32px;
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
  border-left: 4px solid ${props => props.$color || '#1976d2'};
`;

const WeatherCard = styled(Paper)`
  padding: ${props => props.$primary ? '24px' : '16px'};
  height: 100%;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

export default FeaturesShowcase;
