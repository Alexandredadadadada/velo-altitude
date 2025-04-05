import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Card, 
  CardHeader, 
  CardContent, 
  ButtonGroup, 
  Button, 
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import NorthIcon from '@mui/icons-material/North';
import SpeedIcon from '@mui/icons-material/Speed';
import AirIcon from '@mui/icons-material/Air';
import HeightIcon from '@mui/icons-material/Height';
import InfoIcon from '@mui/icons-material/Info';

// Styles personnalisés pour les composants MUI
const ColorSquare = styled('span')(({ theme, color }) => ({
  display: 'inline-block',
  width: '16px',
  height: '16px',
  marginRight: theme.spacing(1),
  backgroundColor: color,
  borderRadius: '2px'
}));

const ImpactChip = styled(Chip)(({ theme, severity }) => {
  const colors = {
    calm: theme.palette.success.light,
    moderate: theme.palette.info.light,
    strong: theme.palette.warning.light,
    extreme: theme.palette.error.light
  };
  
  return {
    backgroundColor: colors[severity] || colors.moderate,
    color: theme.palette.getContrastText(colors[severity] || colors.moderate),
    fontWeight: 'bold',
    margin: theme.spacing(1, 0),
  };
});

// Wind arrow component for 3D visualization
const WindArrow = ({ position, direction, speed, color }) => {
  const arrowRef = useRef();
  
  useEffect(() => {
    if (arrowRef.current) {
      // Set arrow direction
      const radians = (direction * Math.PI) / 180;
      arrowRef.current.rotation.y = radians;
      
      // Scale arrow based on wind speed
      const baseScale = Math.min(0.5 + (speed / 20), 2.0);
      arrowRef.current.scale.set(baseScale, baseScale, baseScale * 2); // Longer in z-direction
    }
  }, [direction, speed]);
  
  return (
    <group ref={arrowRef} position={position}>
      {/* Arrow body */}
      <mesh>
        <cylinderGeometry args={[0.1, 0.1, 1, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Arrow head */}
      <mesh position={[0, 0, 0.6]}>
        <coneGeometry args={[0.2, 0.4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
};

// Wind visualization legend component
const WindLegend = ({ items }) => {
  const { t } = useTranslation();
  
  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardHeader
        sx={{ pb: 1 }}
        title={
          <Typography variant="h6" component="h4">
            {t('windLegend')}
          </Typography>
        }
      />
      <CardContent sx={{ pt: 1 }}>
        <List dense disablePadding>
          {items.map((item, index) => (
            <ListItem key={index} sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ColorSquare color={item.color} />
              </ListItemIcon>
              <ListItemText 
                primary={`${item.label}: ${item.range}`} 
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

// Main 3D terrain component with wind visualization
const WindTerrain = ({ elevationData, windData }) => {
  const meshRef = useRef();

  useEffect(() => {
    if (!elevationData || !meshRef.current) return;
    
    // Similar to ColVisualization3D, configure the terrain geometry
    const geometry = meshRef.current.geometry;
    const positionAttribute = geometry.getAttribute('position');
    
    // Apply elevation data to the geometry
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = Math.floor(i % elevationData.width);
      const z = Math.floor(i / elevationData.width);
      
      if (elevationData.heights[z] && elevationData.heights[z][x] !== undefined) {
        positionAttribute.setY(i, elevationData.heights[z][x] * 0.1); // Scale for visualization
      }
    }
    
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
  }, [elevationData]);
  
  return (
    <>
      {/* Terrain mesh */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10, 100, 100]} />
        <meshStandardMaterial 
          color="#a0a0a0"
          wireframe={false}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      
      {/* Wind arrows */}
      {windData && windData.map((wind, index) => {
        // Get color based on wind speed
        let color;
        if (wind.speed < 10) color = '#3388ff'; // Light wind
        else if (wind.speed < 20) color = '#ffaa00'; // Moderate wind
        else if (wind.speed < 30) color = '#ff7700'; // Strong wind
        else color = '#ff0000'; // Very strong wind
        
        return (
          <WindArrow
            key={index}
            position={[wind.x, wind.elevation * 0.1 + 0.5, wind.z]}
            direction={wind.direction}
            speed={wind.speed}
            color={color}
          />
        );
      })}
    </>
  );
};

// Wind data display panel
const WindDataPanel = ({ windData, currentLocation }) => {
  const { t } = useTranslation();
  
  if (!currentLocation || !windData) return null;
  
  const getCurrentWindData = () => {
    // Find closest wind data point to current location
    if (!windData.length) return null;
    
    // For now, use the first wind data point as a placeholder
    // In a real app, we'd calculate the closest point to currentLocation
    return windData[0];
  };
  
  const currentWind = getCurrentWindData() || { speed: 0, direction: 0, gusts: 0 };
  
  // Get wind condition description
  const getWindCondition = (speed) => {
    if (speed < 5) return 'calm';
    if (speed < 15) return 'moderate';
    if (speed < 30) return 'strong';
    return 'extreme';
  };
  
  // Get directional description
  const getWindDirectionDesc = (direction) => {
    const directions = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'north'];
    const index = Math.round(direction / 45) % 8;
    return directions[index];
  };
  
  const windCondition = getWindCondition(currentWind.speed);
  
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Typography variant="h6" component="h3">
            {t('windConditions')}
          </Typography>
        }
      />
      <CardContent>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <SpeedIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body1">
                  <strong>{t('speed')}:</strong> {currentWind.speed} km/h
                  <Typography variant="body2" component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                    ({t(windCondition)})
                  </Typography>
                </Typography>
              }
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <NorthIcon color="primary" style={{ transform: `rotate(${currentWind.direction}deg)` }} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body1">
                  <strong>{t('direction')}:</strong> {currentWind.direction}°
                  <Typography variant="body2" component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                    ({t('from')} {t(getWindDirectionDesc(currentWind.direction))})
                  </Typography>
                </Typography>
              }
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <AirIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body1">
                  <strong>{t('gusts')}:</strong> {currentWind.gusts || Math.round(currentWind.speed * 1.3)} km/h
                </Typography>
              }
            />
          </ListItem>
        </List>
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <ImpactChip
            severity={windCondition}
            icon={<InfoIcon />}
            label={`${t('cyclingImpact')}: ${t(`${windCondition}Impact`)}`}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

// Main component for wind visualization
const WindVisualization = ({ passId, elevationData, windData, currentLocation }) => {
  const { t } = useTranslation();
  const [cameraPosition, setCameraPosition] = useState([0, 5, 10]);
  
  // Define legend items
  const legendItems = [
    { color: '#3388ff', label: t('lightWind'), range: '0-10 km/h' },
    { color: '#ffaa00', label: t('moderateWind'), range: '10-20 km/h' },
    { color: '#ff7700', label: t('strongWind'), range: '20-30 km/h' },
    { color: '#ff0000', label: t('extremeWind'), range: '>30 km/h' }
  ];
  
  // Handle view changes
  const handleViewChange = (view) => {
    switch(view) {
      case 'top':
        setCameraPosition([0, 10, 0]);
        break;
      case 'side':
        setCameraPosition([10, 5, 0]);
        break;
      case 'front':
        setCameraPosition([0, 5, 10]);
        break;
      default:
        setCameraPosition([0, 5, 10]);
    }
  };
  
  return (
    <Paper 
      elevation={2} 
      sx={{ p: 2, mb: 4 }}
      component="section"
      aria-labelledby="wind-visualization-title"
    >
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h2" id="wind-visualization-title">
          {t('windVisualization')}
        </Typography>
        <ButtonGroup size="small" aria-label={t('viewControls')}>
          <Button 
            onClick={() => handleViewChange('top')}
            aria-label={t('topView')}
          >
            {t('topView')}
          </Button>
          <Button 
            onClick={() => handleViewChange('side')}
            aria-label={t('sideView')}
          >
            {t('sideView')}
          </Button>
          <Button 
            onClick={() => handleViewChange('front')}
            aria-label={t('frontView')}
          >
            {t('frontView')}
          </Button>
        </ButtonGroup>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper 
            elevation={0} 
            variant="outlined"
            sx={{ height: 400, overflow: 'hidden' }}
            aria-label={t('windVisualization3D')}
          >
            <Canvas camera={{ position: cameraPosition, fov: 45 }} shadows>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
              
              <WindTerrain elevationData={elevationData} windData={windData} />
              
              <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
            </Canvas>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <WindDataPanel windData={windData} currentLocation={currentLocation} />
            <WindLegend items={legendItems} />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

WindVisualization.propTypes = {
  passId: PropTypes.string.isRequired,
  elevationData: PropTypes.object.isRequired,
  windData: PropTypes.array.isRequired,
  currentLocation: PropTypes.object
};

// Default wind data for development
WindVisualization.defaultProps = {
  windData: [],
  currentLocation: null
};

export default WindVisualization;
